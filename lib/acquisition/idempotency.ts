import { createHash } from "node:crypto";

import type {
  AcquisitionDataCipher,
  AcquisitionRedisClient,
} from "./durable-storage";

export class AcquisitionIdempotencyConflictError extends Error {
  constructor(key: string) {
    super(`Idempotency key ${key} was already used for a different payload.`);
    this.name = "AcquisitionIdempotencyConflictError";
  }
}

export interface AcquisitionIdempotencyExecution<T> {
  value: T;
  replayed: boolean;
}

export interface AcquisitionIdempotencyStore<T> {
  execute(
    key: string,
    fingerprint: string,
    operation: () => Promise<T>,
  ): Promise<AcquisitionIdempotencyExecution<T>>;
}

interface MemoryEntry<T> {
  fingerprint: string;
  promise: Promise<T>;
  completed: boolean;
}

export class InMemoryAcquisitionIdempotencyStore<T>
  implements AcquisitionIdempotencyStore<T>
{
  private readonly entries = new Map<string, MemoryEntry<T>>();

  constructor(private readonly maximumCompletedEntries = 250) {
    if (
      !Number.isInteger(maximumCompletedEntries) ||
      maximumCompletedEntries < 1
    ) {
      throw new Error("maximumCompletedEntries must be a positive integer.");
    }
  }

  async execute(
    key: string,
    fingerprint: string,
    operation: () => Promise<T>,
  ): Promise<AcquisitionIdempotencyExecution<T>> {
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new AcquisitionIdempotencyConflictError(key);
      }
      return { value: await existing.promise, replayed: true };
    }

    const entry: MemoryEntry<T> = {
      fingerprint,
      promise: Promise.resolve().then(operation),
      completed: false,
    };
    this.entries.set(key, entry);

    try {
      const value = await entry.promise;
      entry.completed = true;
      this.trimCompletedEntries();
      return { value, replayed: false };
    } catch (error) {
      if (this.entries.get(key) === entry) {
        this.entries.delete(key);
      }
      throw error;
    }
  }

  private trimCompletedEntries() {
    let completedCount = [...this.entries.values()].filter(
      ({ completed }) => completed,
    ).length;
    if (completedCount <= this.maximumCompletedEntries) return;

    for (const [key, entry] of this.entries) {
      if (!entry.completed) continue;
      this.entries.delete(key);
      completedCount -= 1;
      if (completedCount <= this.maximumCompletedEntries) return;
    }
  }
}

interface DurableIdempotencyLock {
  fingerprint: string;
}

interface DurableIdempotencyResult {
  fingerprint: string;
  encryptedValue: string;
}

export interface RedisAcquisitionIdempotencyStoreOptions {
  redis: AcquisitionRedisClient;
  cipher: AcquisitionDataCipher;
  retentionSeconds: number;
  lockSeconds?: number;
  waitMilliseconds?: number;
  pollMilliseconds?: number;
}

export class AcquisitionIdempotencyInProgressError extends Error {
  constructor() {
    super("The original Acquisition Lens request is still processing.");
    this.name = "AcquisitionIdempotencyInProgressError";
  }
}

/**
 * Shared idempotency for serverless and multi-instance deployments. The result
 * is application-encrypted before it leaves the process. A short-lived Redis
 * lock coalesces duplicate work; the completed result survives cold starts.
 */
export class RedisAcquisitionIdempotencyStore<T>
  implements AcquisitionIdempotencyStore<T>
{
  private readonly lockSeconds: number;
  private readonly waitMilliseconds: number;
  private readonly pollMilliseconds: number;

  constructor(private readonly options: RedisAcquisitionIdempotencyStoreOptions) {
    this.lockSeconds = options.lockSeconds ?? 360;
    this.waitMilliseconds = options.waitMilliseconds ?? 300_000;
    this.pollMilliseconds = options.pollMilliseconds ?? 250;
  }

  async execute(
    key: string,
    fingerprint: string,
    operation: () => Promise<T>,
  ): Promise<AcquisitionIdempotencyExecution<T>> {
    const resultKey = this.options.cipher.opaqueKey("idem-result", key);
    const lockKey = this.options.cipher.opaqueKey("idem-lock", key);
    const completed = await this.readResult(resultKey, fingerprint);
    if (completed) return { value: completed, replayed: true };

    const lock: DurableIdempotencyLock = { fingerprint };
    const acquired = await this.options.redis.set(lockKey, lock, {
      ex: this.lockSeconds,
      nx: true,
    });

    if (acquired !== "OK") {
      const existingLock = await this.options.redis.get<DurableIdempotencyLock>(
        lockKey,
      );
      if (existingLock && existingLock.fingerprint !== fingerprint) {
        throw new AcquisitionIdempotencyConflictError(key);
      }
      return {
        value: await this.waitForResult(resultKey, fingerprint),
        replayed: true,
      };
    }

    try {
      const racedResult = await this.readResult(resultKey, fingerprint);
      if (racedResult) return { value: racedResult, replayed: true };

      const value = await operation();
      const record: DurableIdempotencyResult = {
        fingerprint,
        encryptedValue: this.options.cipher.encrypt(value),
      };
      await this.options.redis.set(resultKey, record, {
        ex: this.options.retentionSeconds,
      });
      return { value, replayed: false };
    } catch (error) {
      throw error;
    } finally {
      await this.options.redis.del(lockKey);
    }
  }

  private async readResult(resultKey: string, fingerprint: string) {
    const result = await this.options.redis.get<DurableIdempotencyResult>(
      resultKey,
    );
    if (!result) return null;
    if (result.fingerprint !== fingerprint) {
      throw new AcquisitionIdempotencyConflictError("redacted");
    }
    return this.options.cipher.decrypt<T>(result.encryptedValue);
  }

  private async waitForResult(resultKey: string, fingerprint: string) {
    const deadline = Date.now() + this.waitMilliseconds;
    while (Date.now() < deadline) {
      const result = await this.readResult(resultKey, fingerprint);
      if (result) return result;
      await new Promise((resolve) => setTimeout(resolve, this.pollMilliseconds));
    }
    throw new AcquisitionIdempotencyInProgressError();
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function fingerprintAcquisitionPayload(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}
