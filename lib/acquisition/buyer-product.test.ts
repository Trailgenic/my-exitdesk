import test from 'node:test';
import assert from 'node:assert/strict';
import type Stripe from 'stripe';
import { parseBuyerIntake } from './buyer-intake';
import { BUYER_SAMPLE_INTAKE, BUYER_SAMPLE_REPORT } from './buyer-sample';
import { buildBuyerDiagnosticPrompt, createBuyerDiagnosticEngine, validateBuyerDiagnostic } from './buyer-diagnostic';
import { MIKE_ACQUISITION_DOCTRINE } from './doctrine';
import { BuyerCommerceService, BuyerPaymentError, BUYER_PRODUCT } from './buyer-commerce';
import { InMemoryAcquisitionIdempotencyStore } from './idempotency';
import { buyerConfigurationReady } from './buyer-runtime';
import { renderBuyerReportPDF } from './buyer-report-pdf';
import { AnthropicBuyerResearch } from './buyer-research';
import type Anthropic from '@anthropic-ai/sdk';

test('buyer report reuses all 22 existing doctrine principles and segment guidance',()=>{
  const prompt=buildBuyerDiagnosticPrompt(BUYER_SAMPLE_INTAKE);
  assert.equal(MIKE_ACQUISITION_DOCTRINE.length,22);
  for(const principle of MIKE_ACQUISITION_DOCTRINE)assert.ok(prompt.includes(principle.rule));
  assert.match(prompt,/build-versus-buy/);
  assert.match(prompt,/Do not invent valuation multiples/);
});
test('intake preserves unknowns and isolates the public research identity',()=>{
  const {version,...input}=BUYER_SAMPLE_INTAKE;
  const parsed=parseBuyerIntake({...input,publicResearch:{companyName:'Example Company',website:'https://company.com/private-path?deal=secret',industry:'Maintenance',geography:'California'}});
  assert.equal(parsed.answers.cashRequirements,null);
  assert.equal(parsed.publicResearch?.website,'https://company.com');
  assert.equal(Object.keys(parsed.publicResearch!).length,4);
  assert.throws(()=>parseBuyerIntake({...input,answers:{...input.answers,extra:'injected'}}));
  assert.throws(()=>parseBuyerIntake({...input,publicResearch:{companyName:'X',website:'https://127.0.0.1',industry:'X',geography:'X'}}));
});
test('report validator rejects invented citations and elevated diligence claims',()=>{
  assert.equal(validateBuyerDiagnostic(BUYER_SAMPLE_REPORT.draft,new Set(['buyer-intake'])).provisionalPosture,'investigate');
  assert.throws(()=>validateBuyerDiagnostic({...BUYER_SAMPLE_REPORT.draft,competitiveLandscape:{...BUYER_SAMPLE_REPORT.draft.competitiveLandscape,evidenceIds:['made-up-source']}},new Set(['buyer-intake'])));
  assert.throws(()=>validateBuyerDiagnostic({...BUYER_SAMPLE_REPORT.draft,investmentCommitteeSnapshot:{...BUYER_SAMPLE_REPORT.draft.investmentCommitteeSnapshot,reliancePosture:'senior_review_ready'}},new Set(['buyer-intake'])));
});
test('real generator invokes the existing structured-model interface and skips search for anonymous intake',async()=>{
  let calls=0;
  const engine=createBuyerDiagnosticEngine({async generateStructured(request){calls++;assert.equal(request.toolName,'submit_acquisition_reasoning');assert.match(request.systemPrompt,/buyer-keeps-synergy/);assert.match(request.userPrompt,/No external research requested/);return BUYER_SAMPLE_REPORT.draft;}},{async research(){throw new Error('Private intake must not enter web research');}});
  const report=await engine.generate(BUYER_SAMPLE_INTAKE,'report-001');
  assert.equal(calls,1);assert.equal(report.research.status,'not_requested');assert.equal(report.doctrineIds.length,22);
});
test('public research receives no private acquisition details and preserves citations',async()=>{
  let sent='';
  const research=new AnthropicBuyerResearch({messages:{async create(request: unknown){sent=JSON.stringify(request);return {stop_reason:'end_turn',content:[{type:'web_search_tool_result',content:[]},{type:'text',text:'Public service overview.',citations:[{type:'web_search_result_location',url:'https://company.com/services',title:'Company services',cited_text:'Equipment maintenance services.'}]}]};}}} as unknown as Pick<Anthropic,'messages'>,'claude-opus-4-6');
  const result=await research.research({companyName:'Public Name',website:'https://company.com',industry:'Maintenance',geography:'California'});
  assert.equal(result.sources[0].id,'web-1');assert.match(result.summary,/web-1/);assert.ok(!sent.includes('$3.0M'));assert.ok(!sent.includes('buyerThesis'));
});
function setup(){
  let generates=0,emails=0;
  const session={id:'cs_test_1234567890',payment_status:'paid',status:'complete',mode:'payment',livemode:false,metadata:{product:BUYER_PRODUCT,draft_id:'draft-1'},amount_total:49900,customer_details:{email:'purchaser@example.test'},line_items:{data:[{quantity:1,price:{id:'price_buyer'}}]}};
  const store=new Map([['draft-1',BUYER_SAMPLE_INTAKE]]);
  let failEmail=false,failGenerate=false;
  const service=new BuyerCommerceService({stripe:{prices:{async retrieve(){return {active:true,type:'one_time',unit_amount:49900,currency:'usd',livemode:false,product:{active:true,metadata:{product:BUYER_PRODUCT}}};}},checkout:{sessions:{async retrieve(){return session;},async create(){return {url:'https://checkout.stripe.com/c/pay/example'};}}}} as unknown as Pick<Stripe,'prices'|'checkout'>,priceId:'price_buyer',baseUrl:'https://app.example.com',live:false,drafts:{async put(id,value){store.set(id,value);},async get(id){return store.get(id)??null;}},checkoutIdempotency:new InMemoryAcquisitionIdempotencyStore(),reports:new InMemoryAcquisitionIdempotencyStore(),deliveryIdempotency:new InMemoryAcquisitionIdempotencyStore(),async generate(){generates++;if(failGenerate)throw new Error('Provider interrupted');return BUYER_SAMPLE_REPORT;},async deliver(email){assert.equal(email,'purchaser@example.test');emails++;if(failEmail)throw new Error('Provider interrupted');}});
  return {service,session,count:()=>({generates,emails}),failEmail:(v:boolean)=>{failEmail=v;},failGenerate:(v:boolean)=>{failGenerate=v;}};
}
test('only a verified paid buyer-product session can invoke generation',async()=>{
  for(const change of [{payment_status:'unpaid'},{livemode:true},{metadata:{product:'exit_desk',draft_id:'draft-1'}},{line_items:{data:[{quantity:1,price:{id:'price_seller'}}]}}]){
    const s=setup();Object.assign(s.session,change);await assert.rejects(()=>s.service.report('cs_test_1234567890'),BuyerPaymentError);assert.equal(s.count().generates,0);
  }
});
test('repeated retrieval generates once and delivers to the Stripe purchaser once',async()=>{
  const s=setup();await s.service.report('cs_test_1234567890');const second=await s.service.report('cs_test_1234567890');assert.equal(second.replayed,true);assert.deepEqual(s.count(),{generates:1,emails:1});
});
test('email failure never loses the paid report and retry does not regenerate',async()=>{
  const s=setup();s.failEmail(true);assert.equal((await s.service.report('cs_test_1234567890')).emailStatus,'retry_available');s.failEmail(false);assert.equal((await s.service.report('cs_test_1234567890')).emailStatus,'sent');assert.equal(s.count().generates,1);
});
test('failed model generation can be retried against the same paid order',async()=>{
  const s=setup();s.failGenerate(true);await assert.rejects(()=>s.service.report('cs_test_1234567890'));s.failGenerate(false);assert.equal((await s.service.report('cs_test_1234567890')).report.reportId,BUYER_SAMPLE_REPORT.reportId);
});
test('missing configuration and live-key/test-mode mismatch keep checkout closed',()=>{
  assert.equal(buyerConfigurationReady({}),false);
  assert.equal(buyerConfigurationReady({ACQUISITION_DIAGNOSTIC_MODE:'test',STRIPE_SECRET_KEY:'sk_live_not-a-real-key'}),false);
});
test('buyer sample generates an actual branded PDF',async()=>{
  const pdf=await renderBuyerReportPDF(BUYER_SAMPLE_REPORT);assert.ok(pdf.byteLength>10000);assert.equal(pdf.subarray(0,4).toString(),'%PDF');
});
