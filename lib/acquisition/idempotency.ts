import { createHash } from "node:crypto";

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
