import type {
  AcquisitionDataCipher,
  AcquisitionRedisClient,
} from "./durable-storage";

const FIXED_WINDOW_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

export interface AcquisitionRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export interface AcquisitionRateLimiter {
  check(scope: string, subject: string): Promise<AcquisitionRateLimitResult>;
}

export class RedisAcquisitionRateLimiter implements AcquisitionRateLimiter {
  constructor(
    private readonly redis: AcquisitionRedisClient,
    private readonly cipher: AcquisitionDataCipher,
    private readonly limit: number,
    private readonly windowSeconds = 60,
  ) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1_000) {
      throw new Error("Acquisition rate limit must be between 1 and 1,000.");
    }
  }

  async check(scope: string, subject: string) {
    const window = Math.floor(Date.now() / (this.windowSeconds * 1_000));
    const key = this.cipher.opaqueKey(
      "rate-limit",
      `${scope}:${subject}:${window}`,
    );
    const count = await this.redis.eval<[number], number>(
      FIXED_WINDOW_SCRIPT,
      [key],
      [this.windowSeconds],
    );
    return {
      allowed: count <= this.limit,
      limit: this.limit,
      remaining: Math.max(0, this.limit - count),
      retryAfterSeconds: this.windowSeconds,
    };
  }
}
