import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

// Local-only HTTP smoke checks. No browser, provider, purchase, or delivery calls.
const reservation = createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    STRIPE_SECRET_KEY: "sk_test_phase1_build_placeholder",
    RESEND_API_KEY: "re_phase1_build_placeholder",
    ACQUISITION_BACKEND_MODE: "disabled",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let diagnostics = "";
server.stdout.on("data", (chunk) => { diagnostics += chunk; });
server.stderr.on("data", (chunk) => { diagnostics += chunk; });
const origin = `http://127.0.0.1:${port}`;
const request = (path, options = {}) => fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(3000), ...options });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error("Local server exited: " + diagnostics);
    try { await request("/"); ready = true; break; } catch { await delay(100); }
  }
  assert.ok(ready, "Local server did not become ready: " + diagnostics);
  const checkout = await request("/checkout?email=private%40example.test&company=Confidential");
  assert.equal(checkout.status, 307);
  assert.equal(checkout.headers.get("location"), "https://www.mikeye.com/exit/checkout");
  const legacyScore = await request("/exit/run");
  assert.equal(legacyScore.status, 308);
  assert.equal(new URL(legacyScore.headers.get("location"), origin).pathname, "/exit/score");
  const readiness = await request("/api/acquisition/readiness");
  assert.equal(readiness.status, 503);
  assert.match(readiness.headers.get("cache-control"), /no-store/);
  assert.equal((await readiness.json()).error.code, "service_unavailable");
  const order = await request("/api/acquisition/orders/nonexistent-phase1-order");
  assert.equal(order.status, 503);
  const delivery = await request("/api/acquisition/orders/nonexistent-phase1-order/deliver", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
  assert.equal(delivery.status, 401);
  assert.equal((await delivery.json()).error.code, "unauthorized");
  console.log("Phase 1 HTTP smoke checks passed: canonical checkout, no query-data forwarding, preserved redirect, disabled readiness, and closed order/delivery routes.");
} finally {
  if (server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill("SIGTERM");
    await closed;
  }
}
