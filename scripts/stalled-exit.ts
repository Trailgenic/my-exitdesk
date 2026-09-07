/** Operator CLI. No transport, mailbox login, crawler, or automatic sending in v0. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {Candidate,Source,assess,selectPilot} from '../lib/stalled/engine';
import {signToken,contactHash,encryptEmail} from '../lib/stalled/security';
import {sequence} from '../lib/stalled/emails';
import {mergeObservation} from '../lib/stalled/observations';
interface Packet {sources:Source[];candidates:Candidate[]}
const [command,input,output]=process.argv.slice(2);
const now=new Date().toISOString();
function load(path:string){return JSON.parse(readFileSync(path,'utf8'));}
function save(path:string,data:unknown){writeFileSync(path,JSON.stringify(data,null,2)+'\n',{mode:0o600});}
function packet(path:string):Packet{
  const p=load(path);if(!Array.isArray(p.sources)||!Array.isArray(p.candidates))throw new Error('Expected sources and candidates arrays');
  if(p.candidates.length>1000)throw new Error('v0 supports at most 1000 discovered candidates');
  if(new Set(p.candidates.map((c:Candidate)=>c.id)).size!==p.candidates.length)throw new Error('Duplicate candidate IDs');
  if(new Set(p.sources.map((s:Source)=>s.id)).size!==p.sources.length)throw new Error('Duplicate source IDs');
  return p;
}
async function api(action:string,body?:unknown){
  const base=process.env.STALLED_EXIT_API_BASE??'https://my-exitdesk.vercel.app/api/stalled';
  if(!base.startsWith('https://'))throw new Error('HTTPS endpoint required');
  const key=process.env.STALLED_EXIT_ADMIN_KEY??'';if(key.length<32)throw new Error('Admin key required');
  const r=await fetch(base+'/'+action,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('Pilot API '+action+' failed ('+r.status+')');return r.json();
}
const html=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
async function main(){
  if(command==='observe'){
    const incoming=packet(input),existing=packet(output);
    const byId=new Map(existing.candidates.map(c=>[c.id,c]));
    for(const c of incoming.candidates)byId.set(c.id,mergeObservation(byId.get(c.id),c,now));
    const sources=new Map(existing.sources.map(s=>[s.id,s]));
    for(const s of incoming.sources)sources.set(s.id,s);
    save(output,{sources:[...sources.values()],candidates:[...byId.values()]});return;
  }
  if(command==='score'){
    const p=packet(input);save(output??'.stalled-private/assessment.json',{as_of:now,results:p.candidates.map(c=>assess(c,p.sources,now)),pilot:selectPilot(p.candidates,p.sources,now)});return;
  }
  if(command==='prepare'){
    const p=packet(input),pilot=selectPilot(p.candidates,p.sources,now);
    const dir=resolve(output??'.stalled-private/drafts');mkdirSync(dir,{recursive:true,mode:0o700});
    const secret=process.env.STALLED_EXIT_SIGNING_SECRET??'';
    const suppression=process.env.STALLED_EXIT_SUPPRESSION_SECRET??'';
    const postal=process.env.STALLED_EXIT_POSTAL_ADDRESS??'';
    if(!postal)throw new Error('Approve a business postal address before generating send-ready copy');
    const manifest:any[]=[];
    for(const {candidate:c,assessment} of pilot.selected){
      const person=c.contact!;
      const unsubscribe=signToken({v:1,purpose:'unsubscribe',contact:person.id},secret);
      const all=[];
      for(const step of [0,1,2] as const){
        const token=signToken({v:1,purpose:'campaign',signal:c.id,contact:person.id,audience:person.audience,step,exp:Math.floor(Date.now()/1000)+90*86400},secret);
        const url=(path:string)=>'https://www.mikeye.com'+path+'?utm_source=stalled_exit&utm_medium=email&utm_campaign=pilot_v0&utm_content='+person.audience+'_d'+[0,4,10][step]+'&se_token='+encodeURIComponent(token);
        const messages=sequence(c,p.sources,{score:url('/exit/score'),partners:url('/exit/partners'),sample:url('/exit/sample'),unsubscribe:'https://my-exitdesk.vercel.app/api/stalled/unsubscribe?token='+encodeURIComponent(unsubscribe)},postal,now);
        all.push(messages[step]);
      }
      save(join(dir,c.id+'.json'),{id:c.id,contact:person,assessment,messages:all,status:'DRAFT_NOT_SENT'});
      manifest.push({id:person.id,signal:c.id,audience:person.audience,email_hash:contactHash(person.email,suppression),email_ciphertext:encryptEmail(person.email,secret)});
    }
    save(join(dir,'register.json'),manifest);
    save(join(dir,'pilot.json'),{as_of:now,counts:pilot.counts,shortfall:pilot.shortfall,status:'DRAFT_ONLY',launch_blocks:['Outbound provider and policy not verified','Public unsubscribe and suppression integration not live-tested','Sender authentication and approved postal address must be verified','Register contacts and verify stop gates before any provider handoff']});
    console.log(JSON.stringify({drafts:manifest.length,shortfall:pilot.shortfall,sent:0}));return;
  }
  if(command==='register'){
    const rows=load(input);if(!Array.isArray(rows)||rows.length>50)throw new Error('At most 50 contact registrations');
    for(const row of rows)await api('register',row);console.log('Registered '+rows.length+' contacts. Sent 0 emails.');return;
  }
  if(command==='sync-events'){save(input,await api('events'));return;}
  if(command==='suppress'){console.log(await api('suppress',{contact:input}));return;}
  if(command==='record'){console.log(await api('record',load(input)));return;}
  if(command==='check-contact'){console.log(await api('contact?id='+encodeURIComponent(input)));return;}
  if(command==='health'){console.log(await api('health'));return;}
  if(command==='report'){
    const p=packet(input),events=output?load(output).events:[];
    if(!Array.isArray(events))throw new Error('Expected events array');
    const selected=selectPilot(p.candidates,p.sources,now);
    const kinds=['sent','delivered','bounced','unsubscribed','clicked','score_start','score_complete','score_save','plan_signup','valuation_visit','sample_visit','purchase','partner_visit','partner_application','partner_approved','referred_client','referral_approved','referral_paid'];
    const counts=(kind:string,audience:string)=>new Set(events.filter((e:any)=>e.kind===kind&&e.audience===audience).map((e:any)=>e.contact)).size;
    const rows=p.candidates.map(c=>{const a=assess(c,p.sources,now);return '<tr><td>'+html(c.public_listing_label)+'</td><td>'+html(c.representation)+'</td><td>'+a.score+'</td><td>'+html(a.age_basis)+'</td><td>'+html(a.hold_reasons.join('; ')||'Ready for provider review')+'</td></tr>';}).join('');
    const metrics=kinds.map(k=>'<tr><td>'+html(k)+'</td><td>'+counts(k,'seller')+'</td><td>'+counts(k,'broker')+'</td></tr>').join('');
    const purchases=events.filter((e:any)=>e.kind==='purchase'&&e.authority==='stripe');
    const gross=purchases.reduce((s:number,e:any)=>s+(e.amount_cents??0),0)/100;
    const qualified=p.candidates.filter(c=>assess(c,p.sources,now).qualified).length;
    const page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stalled Exit Pilot</title><style>body{font:16px system-ui;background:#f7f5f0;color:#202320;max-width:1100px;margin:40px auto;padding:0 24px}h1{font:48px Georgia}h2{margin-top:40px}table{border-collapse:collapse;width:100%;background:#fff}th,td{padding:12px;text-align:left;border-bottom:1px solid #deded5}th{background:#e8eadf}.banner{padding:20px;background:#ece3c9;border-left:5px solid #806124}.stats{display:flex;gap:16px;flex-wrap:wrap}.stat{background:white;padding:20px;flex:1;min-width:150px}small{color:#555}td{overflow-wrap:anywhere}@media(max-width:600px){h1{font-size:34px}table{font-size:12px}td,th{padding:7px}}</style></head><body><p>EXIT DESK / PILOT V0</p><h1>Stalled Exit Engine</h1><p class="banner">Build and sourcing review. Sending is not enabled. No campaign results are implied by draft preparation.</p><p>Updated '+html(now)+'</p><div class="stats"><div class="stat">Discovered<br><strong>'+p.candidates.length+'</strong></div><div class="stat">Qualified signals<br><strong>'+qualified+'</strong></div><div class="stat">Ready contacts<br><strong>'+selected.selected.length+' / 50</strong></div><div class="stat">Verified gross revenue<br><strong>$'+gross.toFixed(2)+'</strong></div></div><p>Owner-direct shortfall: '+selected.shortfall.seller+'. Broker shortfall: '+selected.shortfall.broker+'. Revenue per qualified signal: '+(qualified?'$'+(gross/qualified).toFixed(2):'not measurable')+'. Gross revenue excludes fees, refunds, fulfillment costs and referral payouts until reconciled.</p><h2>Two paths from one signal</h2><p>Owner-direct → personalized email → free Score → paid Audit. Broker-represented → broker email → Partner Program → client referral → paid Audit.</p><h2>Candidate review</h2><table><thead><tr><th>Listing</th><th>Route</th><th>Friction</th><th>Age basis</th><th>Hold reason</th></tr></thead><tbody>'+rows+'</tbody></table><h2>Observed conversions</h2><p>Unique contacts per event; browser events are directional, purchases require Stripe evidence. Email opens are intentionally excluded. Provider clicks may include security scanners.</p><table><thead><tr><th>Event</th><th>Seller</th><th>Broker</th></tr></thead><tbody>'+metrics+'</tbody></table><h2>Interpretation</h2><p>Friction measures evidence of an extended or increasingly flexible sale process. It does not establish that a business cannot sell, why a transaction stalled, or whether the seller will buy an audit.</p><p>Preserve source permissions, original listing dates, first-seen observations, and updates separately. Recheck availability within seven days of each send; recheck suppression immediately before handoff.</p></body></html>';
    const dest=resolve('.stalled-private/pilot-report.html');mkdirSync(resolve('.stalled-private'),{recursive:true});writeFileSync(dest,page,{mode:0o600});console.log(dest);return;
  }
  console.log('Commands: score packet.json output.json | prepare packet.json draft-directory | register register.json | health | check-contact ID | suppress ID | record event.json | sync-events events.json | report packet.json [events.json]');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
