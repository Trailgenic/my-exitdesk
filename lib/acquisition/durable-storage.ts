import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

import { Redis } from "@upstash/redis";

export const ACQUISITION_STORAGE_VERSION = "1.0.0" as const;

export interface AcquisitionRedisSetOptions {
  ex: number;
  nx?: true;
  xx?: true;
}

export interface AcquisitionRedisClient {
  get<TData>(key: string): Promise<TData | null>;
  set<TData>(
    key: string,
    value: TData,
    options: AcquisitionRedisSetOptions,
  ): Promise<"OK" | TData | null>;
  del(...keys: string[]): Promise<number>;
  eval<TArgs extends unknown[], TData = unknown>(
    script: string,
    keys: string[],
    args: TArgs,
  ): Promise<TData>;
}

export class AcquisitionStorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcquisitionStorageConfigurationError";
  }
}

export function createAcquisitionRedisClient(config: {
  url: string | undefined;
  token: string | undefined;
}): AcquisitionRedisClient {
  const url = config.url?.trim();
  const token = config.token?.trim();
  if (!url || !token) {
    throw new AcquisitionStorageConfigurationError(
      "Acquisition Lens durable storage is not configured.",
    );
  }
  if (!url.startsWith("https://")) {
    throw new AcquisitionStorageConfigurationError(
      "Acquisition Lens durable storage must use HTTPS.",
    );
  }
  return new Redis({ url, token }) as AcquisitionRedisClient;
}

export class AcquisitionDataCipher {
  private readonly key: Buffer;

  constructor(encodedKey: string | undefined) {
    if (!encodedKey) {
      throw new AcquisitionStorageConfigurationError(
        "Acquisition Lens data encryption is not configured.",
      );
    }
    const key = Buffer.from(encodedKey, "base64");
    if (key.byteLength !== 32) {
      throw new AcquisitionStorageConfigurationError(
        "ACQUISITION_DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
      );
    }
    this.key = key;
  }

  encrypt(value: unknown) {
    const initializationVector = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, initializationVector);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]);
    return [
      "v1",
      initializationVector.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      ciphertext.toString("base64url"),
    ].join(".");
  }

  decrypt<T>(envelope: string): T {
    const [version, initializationVector, authenticationTag, ciphertext] =
      envelope.split(".");
    if (
      version !== "v1" ||
      !initializationVector ||
      !authenticationTag ||
      !ciphertext
    ) {
      throw new Error("Unsupported encrypted Acquisition Lens record.");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(initializationVector, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authenticationTag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(plaintext) as T;
  }

  opaqueKey(scope: string, identifier: string) {
    const digest = createHmac("sha256", this.key)
      .update(`${scope}\0${identifier}`)
      .digest("base64url");
    return `acq:${ACQUISITION_STORAGE_VERSION}:${scope}:${digest}`;
  }

  fingerprint(value: string) {
    return createHmac("sha256", this.key).update(value).digest("base64url");
  }
}

export function retentionSeconds(days: number, fieldName: string) {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new AcquisitionStorageConfigurationError(
      `${fieldName} must be an integer from 1 to 365.`,
    );
  }
  return days * 24 * 60 * 60;
}
