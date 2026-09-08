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
const nativeJS=read('public/exit-score-native-v1.js');
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
const checkoutHTML=read('site-foundation/native-funnel/checkout.html').replace(/<button\b/g,'<div').replace(/<\/button>/g,'</div>');
const checkoutJS=read('public/exit-checkout-native-v1.js');
for(const [query,price,visible] of [['?q1=a&score=0','$199',true],['?q1=b&score=100','$499',true],['','$499',false],['?score=NaN','$499',false],['?score=101','$499',false]]){
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
console.log(`Passed ${cases.length} scoring parity scenarios, native control activation, checkout tiers, duplicate-click protection, and checkout error recovery.`);
