import { ACQUISITION_COMMERCE_VERSION } from "./commerce";
import { ACQUISITION_CONTRACT_VERSION } from "./contracts";
import { ACQUISITION_DELIVERY_VERSION } from "./delivery";
import { ACQUISITION_ORCHESTRATION_VERSION } from "./orchestration-contract";
import { getAcquisitionReasoningConfig } from "./reasoning-config";
import { ACQUISITION_REASONING_VERSION } from "./reasoning-contract";

export const ACQUISITION_BACKEND_VERSION = "1.0.0" as const;
export const ACQUISITION_DEPLOYMENT_CONTRACT_VERSION = "1.0.0" as const;

export type AcquisitionBackendMode = "disabled" | "internal" | "live";

export type AcquisitionDeploymentCheckName =
  | "activation"
  | "security"
  | "storage"
  | "payment"
  | "reasoning"
  | "delivery"
  | "limits"
  | "production_safety";

export interface AcquisitionDeploymentCheck {
  name: AcquisitionDeploymentCheckName;
  ready: boolean;
}

export interface AcquisitionDeploymentState {
  backendVersion: typeof ACQUISITION_BACKEND_VERSION;
  deploymentContractVersion: typeof ACQUISITION_DEPLOYMENT_CONTRACT_VERSION;
  mode: AcquisitionBackendMode;
  configurationStatus: "ready" | "incomplete";
  operationalStatus: "frozen" | "ready" | "blocked";
  operational: boolean;
  contracts: {
    intake: typeof ACQUISITION_CONTRACT_VERSION;
    orchestration: typeof ACQUISITION_ORCHESTRATION_VERSION;
    reasoning: typeof ACQUISITION_REASONING_VERSION;
    commerce: typeof ACQUISITION_COMMERCE_VERSION;
    delivery: typeof ACQUISITION_DELIVERY_VERSION;
  };
  checks: AcquisitionDeploymentCheck[];
}

export class AcquisitionDeploymentConfigurationError extends Error {
  constructor(message = "Acquisition Lens backend activation is not configured.") {
    super(message);
    this.name = "AcquisitionDeploymentConfigurationError";
  }
}

const VALID_MODES: readonly AcquisitionBackendMode[] = [
  "disabled",
  "internal",
  "live",
] as const;

export function getAcquisitionBackendMode(
  environment: Record<string, string | undefined> = process.env,
): AcquisitionBackendMode {
  const raw = environment.ACQUISITION_BACKEND_MODE?.trim() || "disabled";
  if (!VALID_MODES.includes(raw as AcquisitionBackendMode)) {
    throw new AcquisitionDeploymentConfigurationError(
      "ACQUISITION_BACKEND_MODE must be disabled, internal, or live.",
    );
  }
  return raw as AcquisitionBackendMode;
}

/**
 * Deliberate activation barrier. Secrets alone cannot make the transaction
 * routes operational; Step 8 requires an explicit internal or live mode.
 */
export function assertAcquisitionBackendEnabled(
  environment: Record<string, string | undefined> = process.env,
) {
  const mode = getAcquisitionBackendMode(environment);
  if (mode === "disabled") {
    throw new AcquisitionDeploymentConfigurationError(
      "Acquisition Lens backend is frozen.",
    );
  }
  return mode;
}

/**
 * Static, side-effect-free configuration inspection. It never calls Redis,
 * Stripe, Anthropic, or Resend and never returns a credential value.
 */
export function inspectAcquisitionDeployment(
  environment: Record<string, string | undefined> = process.env,
): AcquisitionDeploymentState {
  let mode: AcquisitionBackendMode = "disabled";
  let activationReady = true;
  try {
    mode = getAcquisitionBackendMode(environment);
  } catch {
    activationReady = false;
  }

  const stripeSecret = trimmed(environment.STRIPE_SECRET_KEY);
  const checks: AcquisitionDeploymentCheck[] = [
    check("activation", activationReady),
    check(
      "security",
      trimmed(environment.ACQUISITION_API_SECRET).length >= 32,
    ),
    check(
      "storage",
      validEncryptionKey(environment.ACQUISITION_DATA_ENCRYPTION_KEY) &&
        validHttpsUrl(environment.ACQUISITION_REDIS_REST_URL) &&
        Boolean(trimmed(environment.ACQUISITION_REDIS_REST_TOKEN)),
    ),
    check(
      "payment",
      /^(sk|rk)_(test|live)_/.test(stripeSecret) &&
        trimmed(environment.ACQUISITION_STRIPE_PRICE_ID).startsWith("price_") &&
        trimmed(environment.ACQUISITION_STRIPE_WEBHOOK_SECRET).startsWith(
          "whsec_",
        ) &&
        validCheckoutUrl(
          environment.ACQUISITION_CHECKOUT_SUCCESS_URL,
          true,
        ) &&
        validCheckoutUrl(
          environment.ACQUISITION_CHECKOUT_CANCEL_URL,
          false,
        ),
    ),
    check(
      "reasoning",
      trimmed(environment.ANTHROPIC_API_KEY).startsWith("sk-ant-") &&
        validReasoningConfiguration(environment),
    ),
    check(
      "delivery",
      trimmed(environment.RESEND_API_KEY).startsWith("re_") &&
        validSender(
          environment.ACQUISITION_RESEND_FROM_EMAIL ??
            "Acquisition Lens by Mike Ye <mike@mikeye.com>",
        ),
    ),
    check(
      "limits",
      validBoundedInteger(
        environment.ACQUISITION_RATE_LIMIT_PER_MINUTE,
        10,
        1,
        10_000,
      ) &&
        validBoundedInteger(
          environment.ACQUISITION_REPORT_RETENTION_DAYS,
          30,
          1,
          365,
        ) &&
        validBoundedInteger(
          environment.ACQUISITION_LEDGER_RETENTION_DAYS,
          90,
          1,
          365,
        ),
    ),
    check(
      "production_safety",
      mode !== "live" || /^(sk|rk)_live_/.test(stripeSecret),
    ),
  ];

  const configurationReady = checks.every(({ ready }) => ready);
  const operational = configurationReady && mode !== "disabled";
  return {
    backendVersion: ACQUISITION_BACKEND_VERSION,
    deploymentContractVersion: ACQUISITION_DEPLOYMENT_CONTRACT_VERSION,
    mode,
    configurationStatus: configurationReady ? "ready" : "incomplete",
    operationalStatus: operational
      ? "ready"
      : configurationReady && mode === "disabled"
        ? "frozen"
        : "blocked",
    operational,
    contracts: {
      intake: ACQUISITION_CONTRACT_VERSION,
      orchestration: ACQUISITION_ORCHESTRATION_VERSION,
      reasoning: ACQUISITION_REASONING_VERSION,
      commerce: ACQUISITION_COMMERCE_VERSION,
      delivery: ACQUISITION_DELIVERY_VERSION,
    },
    checks,
  };
}

function check(
  name: AcquisitionDeploymentCheckName,
  ready: boolean,
): AcquisitionDeploymentCheck {
  return { name, ready };
}

function trimmed(value: string | undefined) {
  return value?.trim() ?? "";
}

function validEncryptionKey(value: string | undefined) {
  const normalized = trimmed(value);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) return false;
  try {
    const decoded = Buffer.from(normalized, "base64");
    return (
      decoded.byteLength === 32 &&
      decoded.toString("base64") === normalized
    );
  } catch {
    return false;
  }
}

function validHttpsUrl(value: string | undefined) {
  try {
    return new URL(trimmed(value)).protocol === "https:";
  } catch {
    return false;
  }
}

function validCheckoutUrl(value: string | undefined, success: boolean) {
  const normalized = trimmed(value);
  if (!validHttpsUrl(normalized)) return false;
  return !success || normalized.includes("{CHECKOUT_SESSION_ID}");
}

function validReasoningConfiguration(
  environment: Record<string, string | undefined>,
) {
  try {
    getAcquisitionReasoningConfig(environment);
    return true;
  } catch {
    return false;
  }
}

function validSender(value: string) {
  const normalized = value.trim();
  return (
    normalized.length > 0 &&
    normalized.length <= 320 &&
    !/[\r\n]/.test(normalized) &&
    /@/.test(normalized)
  );
}

function validBoundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = value === undefined || value === "" ? fallback : Number(value);
  return (
    Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
  );
}
