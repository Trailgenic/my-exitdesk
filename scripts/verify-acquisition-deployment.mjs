const deploymentUrl = requiredEnvironment("ACQUISITION_DEPLOYMENT_URL");
const apiSecret = requiredEnvironment("ACQUISITION_API_SECRET");
const expectedMode = process.env.ACQUISITION_EXPECTED_BACKEND_MODE?.trim();

if (apiSecret.length < 32) {
  fail("ACQUISITION_API_SECRET must contain at least 32 characters.");
}
if (expectedMode && !["disabled", "internal", "live"].includes(expectedMode)) {
  fail(
    "ACQUISITION_EXPECTED_BACKEND_MODE must be disabled, internal, or live.",
  );
}

const readinessUrl = new URL("/api/acquisition/readiness", deploymentUrl);
if (readinessUrl.protocol !== "https:") {
  fail("ACQUISITION_DEPLOYMENT_URL must use HTTPS.");
}

const unauthenticated = await fetch(readinessUrl, {
  headers: { Accept: "application/json" },
});
if (unauthenticated.status !== 401) {
  fail(`Unauthenticated readiness check returned ${unauthenticated.status}.`);
}

const authenticated = await fetch(readinessUrl, {
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${apiSecret}`,
  },
});
const body = await safeJson(authenticated);
if (authenticated.status !== 200 || body?.ok !== true) {
  fail(`Authenticated readiness check returned ${authenticated.status}.`);
}
if (body.result?.backendVersion !== "1.0.0") {
  fail("Deployment does not expose the frozen Acquisition Lens backend v1.");
}
if (body.result?.configurationStatus !== "ready") {
  fail("Deployment configuration is incomplete.");
}
if (expectedMode && body.result?.mode !== expectedMode) {
  fail(
    `Deployment mode is ${String(body.result?.mode)}, expected ${expectedMode}.`,
  );
}
if (body.result?.mode === "disabled") {
  if (body.result?.operationalStatus !== "frozen" || body.result?.operational) {
    fail("Disabled deployment did not report the expected frozen state.");
  }
} else if (
  body.result?.operationalStatus !== "ready" ||
  body.result?.operational !== true
) {
  fail("Enabled deployment is not operationally ready.");
}

console.log(
  `Acquisition Lens backend ${body.result.backendVersion} verified in ${body.result.mode} mode.`,
);

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is required.`);
  return value;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    fail(`Readiness endpoint returned a non-JSON ${response.status} response.`);
  }
}

function fail(message) {
  console.error(`Acquisition deployment verification failed: ${message}`);
  process.exit(1);
}
