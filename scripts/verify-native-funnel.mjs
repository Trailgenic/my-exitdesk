import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(process.env.FUNNEL_DOM_PACKAGE || new URL('../package.json', import.meta.url));
const { parseHTML } = require('linkedom');
const read = p => fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const content = read('public/exit-score-content.js');
const baseline = read('site-foundation/launch/exit-score-production-embed.html');
const inline = [...baseline.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')).map(m=>m[2]).join('\n');
function environment(html,script,search='',response={ok:true,json:async()=>({url:'https://checkout.stripe.com/test'})}) {
  const { document, HTMLElement, Event } = parseHTML(html);
  HTMLElement.prototype.focus = function(){ document.focused = this; };
  const requests=[];
  const window = {location:{search,href:''},scrollTo(){}};
  const context=vm.createContext({document,window,URLSearchParams,console,setTimeout:fn=>fn(),fetch:async(url,options)=>{requests.push({url,...options});return response;}});
  vm.runInContext(script,context);
  const click=el=>{assert.ok(el);el.dispatchEvent(new Event('click',{bubbles:true}));};
  return {document,window,requests,context,click};
}
const nativeHTML = read('site-foundation/native-funnel/score.html').replace(/<button\b/g,'<div').replace(/<\/button>/g,'</div>').replace(/ disabled=""/g,'');
const nativeJS=read('public/exit-score-native-v2.js');
let seed=37;
const cases=[['e','a','a','a','a','a','b','a'],['a','c','d','c','d','c','d','c'],['a','a','a','a','a','a','b','a']];
for(let k=0;k<64;k++)cases.push(Array.from({length:8},(_,i)=>{seed=(seed*16807)%2147483647;return 'abcde'[seed%(i?4:5)];}));
for(const answers of cases){
  const old=environment(baseline,content+'\n'+inline);
  const current=environment(nativeHTML,nativeJS);
  assert.equal(current.document.querySelector('[data-native-funnel]').dataset.runtimeReady,'true');
  assert.equal(current.document.getElementById('es-next-1').disabled,true);
  current.click(current.document.querySelector('[data-funnel-action="nextQ"]'));
  assert.ok(current.document.getElementById('es-q1').classList.contains('active'));
  answers.forEach((a,i)=>{
    old.window.selectOption(old.document.querySelector(`[data-q="${i+1}"][data-v="${a}"]`));
    const choice=current.document.querySelector(`[data-q="${i+1}"][data-v="${a}"]`);
    assert.equal(choice.tagName,'BUTTON');current.click(choice);
    assert.equal(choice.getAttribute('aria-pressed'),'true');
    if(i<7)current.click(current.document.getElementById('es-next-'+(i+1)));
  });
  old.window.showResults();current.click(current.document.querySelector('[data-funnel-action="showResults"]'));
  for(const id of ['es-score-display','es-score-band','es-score-band-label','score-rq','score-fd','score-fh','score-cp','score-ta','es-findings'])assert.equal(current.document.getElementById(id).textContent,old.document.getElementById(id).textContent,id);
  assert.equal(current.document.getElementById('es-checkout-link').getAttribute('href'),old.document.getElementById('es-checkout-link').getAttribute('href'));
  assert.equal(current.document.focused.id,'main-content');
  vm.runInContext(nativeJS,current.context);
  assert.equal(current.document.getElementById('es-score-display').textContent,old.document.getElementById('es-score-display').textContent);
}
const repeated=environment(nativeHTML,nativeJS);
for(const [answers,expected] of [[cases[0],'high'],[cases[1],'low'],[cases[2],'high']]){
  answers.forEach((a,i)=>repeated.window.selectOption(repeated.document.querySelector(`[data-q="${i+1}"][data-v="${a}"]`)));
  repeated.window.showResults();
  assert.equal(repeated.document.getElementById('es-path-'+expected).style.display,'block');
  assert.equal(repeated.document.getElementById('es-path-'+(expected==='high'?'low':'high')).style.display,'none');
}
const checkoutHTML=read('site-foundation/native-funnel/checkout.html').replace(/<button\b/g,'<div').replace(/<\/button>/g,'</div>');
const checkoutJS=read('public/exit-checkout-native-v2.js');
for(const [query,price,visible] of [['?q1=a&score=0','$199',true],['?q1=b&score=100','$499',true],['?q1=c','$499',false],['?q1=d&score=NaN','$499',false],['?q1=e&score=101','$499',false]]){
  const e=environment(checkoutHTML,checkoutJS,query);
  assert.equal(e.document.getElementById('ec-cta-price').textContent,price);
  assert.equal(e.document.getElementById('ec-score-block').classList.contains('visible'),visible);
  const pay=e.document.getElementById('ec-pay-btn');assert.equal(pay.tagName,'BUTTON');assert.equal(pay.disabled,false);
  e.click(pay);e.click(pay);assert.equal(e.requests.length,1);
  const payload=JSON.parse(e.requests[0].body);assert.equal(payload.q1,new URLSearchParams(query).get('q1')||undefined);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(e.window.location.href,'https://checkout.stripe.com/test');
}
const failure=environment(checkoutHTML,checkoutJS,'?q1=a',{ok:false});failure.click(failure.document.getElementById('ec-pay-btn'));await new Promise(resolve=>setImmediate(resolve));
assert.equal(failure.document.getElementById('ec-pay-btn').disabled,false);assert.equal(failure.document.getElementById('ec-error').style.display,'block');

// Direct arrivals cannot pay until they select revenue, including malformed URLs.
for (const query of ['', '?q1=', '?q1=invalid', '?q1=A', '?score=NaN', '?score=101']) {
  for (const [choice, price] of [['a', '$199'], ['b', '$499']]) {
    const e=environment(checkoutHTML,checkoutJS,query);
    const pay=e.document.getElementById('ec-pay-btn');
    assert.equal(pay.disabled,true);
    assert.equal(e.document.getElementById('ec-cta-price').textContent,'Choose revenue first');
    e.click(pay);e.window.startCheckout();assert.equal(e.requests.length,0);
    const radio=e.document.querySelector('#ec-revenue-choice input[value="'+choice+'"]');
    radio.dispatchEvent(new e.document.defaultView.Event('change',{bubbles:true}));
    assert.equal(pay.disabled,false);
    assert.equal(e.document.getElementById('ec-cta-price').textContent,price);
    assert.equal(e.document.getElementById('ec-term-price').textContent,price);
    e.click(pay);e.window.startCheckout();e.click(pay);assert.equal(e.requests.length,1);
    assert.equal(JSON.parse(e.requests[0].body).q1,choice);
    assert.equal(radio.disabled,true);
  }
}
const retry=environment(checkoutHTML,checkoutJS,'',{ok:false});
function selectRevenue(e,choice) {
  const radio=e.document.querySelector('#ec-revenue-choice input[value="'+choice+'"]');
  radio.dispatchEvent(new e.document.defaultView.Event('change',{bubbles:true}));
}
selectRevenue(retry,'a');selectRevenue(retry,'b');selectRevenue(retry,'a');
assert.equal(retry.document.getElementById('ec-cta-price').textContent,'$199');
retry.click(retry.document.getElementById('ec-pay-btn'));
await new Promise(resolve=>setImmediate(resolve));
assert.equal(retry.document.querySelector('#ec-revenue-choice input').disabled,false);
selectRevenue(retry,'b');retry.click(retry.document.getElementById('ec-pay-btn'));
assert.equal(JSON.parse(retry.requests[1].body).q1,'b');

// Referral tags survive the real Score -> checkout -> API payload path.
for (const ref of ['partner_123-ABC','a'.repeat(64),'','a'.repeat(65),'<script>','partner bad']) {
  const valid=/^[a-zA-Z0-9_-]{1,64}$/.test(ref);
  const e=environment(nativeHTML,nativeJS,'?ref='+encodeURIComponent(ref));
  cases[0].forEach((a,i)=>e.window.selectOption(e.document.querySelector(`[data-q="${i+1}"][data-v="${a}"]`)));
  e.window.showResults();
  const link=new URL(e.document.getElementById('es-checkout-link').getAttribute('href'),'https://www.mikeye.com');
  assert.equal(link.searchParams.get('ref'),valid?ref:null);
  const checkout=environment(checkoutHTML,checkoutJS,link.search);
  checkout.click(checkout.document.getElementById('ec-pay-btn'));
  const payload=JSON.parse(checkout.requests[0].body);
  assert.equal(payload.ref,valid?ref:undefined);
  cases[0].forEach((answer,i)=>assert.equal(payload['q'+(i+1)],answer));
  // Direct URLs use the same validation and preserve the ref after revenue selection.
  const direct=environment(checkoutHTML,checkoutJS,'?ref='+encodeURIComponent(ref));
  selectRevenue(direct,'a');direct.click(direct.document.getElementById('ec-pay-btn'));
  assert.equal(JSON.parse(direct.requests[0].body).ref,valid?ref:undefined);
}
console.log(`Passed ${cases.length} scoring parity scenarios, repeated-result reset, native controls, all revenue tiers, missing/invalid revenue gates, duplicate-click protection, error recovery, and Score-to-checkout referral propagation.`);
