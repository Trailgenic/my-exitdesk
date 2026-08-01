export interface AcquisitionReasoningConfig {
  provider: "anthropic";
  model: string;
  maxTokens: number;
  temperature: number;
}

export const DEFAULT_ACQUISITION_REASONING_CONFIG: AcquisitionReasoningConfig =
  {
    provider: "anthropic",
    model: "claude-opus-4-6",
    maxTokens: 8_000,
    temperature: 0,
  };

function parseInteger(name: string, value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function parseTemperature(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(
      "ACQUISITION_REASONING_TEMPERATURE must be between 0 and 1.",
    );
  }
  return parsed;
}

export function getAcquisitionReasoningConfig(
  environment: Record<string, string | undefined> = process.env,
): AcquisitionReasoningConfig {
  const model =
    environment.ACQUISITION_REASONING_MODEL?.trim() ||
    DEFAULT_ACQUISITION_REASONING_CONFIG.model;

  return {
    provider: "anthropic",
    model,
    maxTokens: parseInteger(
      "ACQUISITION_REASONING_MAX_TOKENS",
      environment.ACQUISITION_REASONING_MAX_TOKENS,
      DEFAULT_ACQUISITION_REASONING_CONFIG.maxTokens,
    ),
    temperature: parseTemperature(
      environment.ACQUISITION_REASONING_TEMPERATURE,
      DEFAULT_ACQUISITION_REASONING_CONFIG.temperature,
    ),
  };
}
