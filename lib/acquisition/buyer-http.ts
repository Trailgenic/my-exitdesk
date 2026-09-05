import { createHash } from 'node:crypto';
import { parseBuyerIntake } from './buyer-intake';
import { buyerConfigurationReady, getBuyerRuntime } from './buyer-runtime';
import { BuyerPaymentError, BuyerExpiredError } from './buyer-commerce';
import { AcquisitionIdempotencyConflictError, AcquisitionIdempotencyInProgressError } from './idempotency';
import { renderBuyerReportPDF } from './buyer-report-pdf';

const headers = { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
async function body(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Use JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body.');
  let bytes = 0; const chunks: Uint8Array[] = [];
  while (true) { const next = await reader.read(); if (next.done) break; bytes += next.value.byteLength; if (bytes > 100000) { await reader.cancel(); throw new Error('Intake exceeds the request limit.'); } chunks.push(next.value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}
export async function buyerQuote() {
  if (!buyerConfigurationReady()) return json({ available: false, message: 'Private product preview. Paid reports open after launch configuration.' });
  try { return json({ available: true, ...await getBuyerRuntime().commerce.quote() }); }
  catch { return json({ available: false, message: 'Checkout is temporarily unavailable.' }); }
}
export async function buyerCommand(request: Request, action: 'checkout' | 'report' | 'pdf') {
  if (!buyerConfigurationReady()) return json({ error: 'Private preview: paid report generation is not activated.' }, 503);
  try {
    const runtime = getBuyerRuntime();
    const origin = request.headers.get('origin');
    if (!origin || ![new URL(request.url).origin, runtime.baseOrigin].includes(origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Open the secure Acquisition Lens report page to continue.' }, 403);
    const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await runtime.limiter.check('buyer-' + action, createHash('sha256').update(ip).digest('hex'))).allowed) return json({ error: 'Please wait a minute and retry the same order.' }, 429);
    let value: Record<string, unknown>;
    try { value = await body(request); } catch { return json({ error: 'Provide a valid intake within 100 KB.' }, 400); }
    if (action === 'checkout') {
      let intake;
      try { intake = parseBuyerIntake(value.intake); } catch (error) { return json({ error: error instanceof Error ? error.message : 'Check the intake.' }, 400); }
      const key = request.headers.get('idempotency-key') ?? '';
      if (!/^[a-zA-Z0-9-]{16,100}$/.test(key)) return json({ error: 'Reload the checkout form and retry.' },400);
      return json(await runtime.commerce.checkout(intake,key));
    }
    if (Object.keys(value).length !== 1 || typeof value.sessionId !== 'string') return json({ error: 'A checkout session is required.' },400);
    const result = await runtime.commerce.report(value.sessionId);
    if (action === 'pdf') {
      const pdf = await renderBuyerReportPDF(result.report);
      return new Response(new Uint8Array(pdf), { headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Acquisition_Lens_Buyer_Assessment.pdf"' } });
    }
    return json(result);
  } catch (error) {
    if (error instanceof BuyerPaymentError) return json({ error: 'Payment is not confirmed for this Acquisition Lens report. Retry after payment completes.' },402);
    if (error instanceof BuyerExpiredError) return json({ error: error.message },410);
    if (error instanceof AcquisitionIdempotencyInProgressError) return json({ processing: true, message: 'Your existing report is still being prepared. Retry this order.' },202);
    if (error instanceof AcquisitionIdempotencyConflictError) return json({ error: 'This order is already tied to an intake. Use the original order.' },409);
    return json({ error: 'The report could not finish. Retry this order without paying again. If this continues, contact MikeYe.com with your Stripe receipt.' },503);
  }
}
