import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {browserEvents,operatorEvents,campaign,config,enabled,record,safeId,suppressContact,RegisteredContact,PilotEvent} from '@/lib/stalled/runtime';
import {verifyToken,decryptEmail,contactHash} from '@/lib/stalled/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const origins=['https://www.mikeye.com','https://mikeye.com'];
function headers(req:Request){const o=req.headers.get('origin')??'';return {'Cache-Control':'no-store','Access-Control-Allow-Origin':origins.includes(o)?o:origins[0],'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin'};}
function reply(req:Request,data:unknown,status=200){return NextResponse.json(data,{status,headers:headers(req)});}
function admin(req:Request){const expected=process.env.STALLED_EXIT_ADMIN_KEY??'';const actual=req.headers.get('authorization')??'';const full='Bearer '+expected;return expected.length>=32&&actual.length===full.length&&timingSafeEqual(Buffer.from(actual),Buffer.from(full));}
export async function OPTIONS(req:Request){return new Response(null,{status:204,headers:headers(req)});}
export async function GET(req:Request,{params}:{params:{action:string}}){
  try{
    if(params.action==='unsubscribe')return await unsubscribe(req);
    if(!enabled())return reply(req,{error:'Pilot not enabled'},503);
    if(!admin(req))return reply(req,{error:'Unauthorized'},401);
    const {redis}=config();
    if(params.action==='health')return reply(req,{ready:await redis.ping()==='PONG',sending_enabled:false,paused:await redis.get('se:paused')});
    if(params.action==='events'){
      const keys=await redis.zrange<string[]>('se:events',0,-1);
      // Max 50 signals x 3 emails + diagnostic events. Retention 180 days.
      if(keys.length>20000)return reply(req,{error:'Event export exceeds pilot limit'},409);
      const events:unknown[]=[];
      for(let i=0;i<keys.length;i+=100){const batch=await redis.mget(...keys.slice(i,i+100));events.push(...batch.filter(Boolean));}
      return reply(req,{events});
    }
    if(params.action==='contact'){
      const id=new URL(req.url).searchParams.get('id');if(!safeId(id))return reply(req,{error:'Invalid ID'},400);
      const c=await redis.get<RegisteredContact>('se:contact:'+id);
      if(!c)return reply(req,{error:'Not found'},404);
      const {email_ciphertext,...safe}=c;
      return reply(req,{...safe,suppressed:!!await redis.get('se:suppressed:'+c.email_hash),campaign_paused:!!await redis.get('se:paused')});
    }
    return reply(req,{error:'Not found'},404);
  }catch{return reply(req,{error:'Pilot service unavailable'},503);}
}
async function unsubscribe(req:Request){
  const {secret,redis}=config(false);const token=new URL(req.url).searchParams.get('token');
  const p=verifyToken(token,secret,'unsubscribe');if(!p)return reply(req,{error:'Invalid unsubscribe link'},400);
  const c=await redis.get<RegisteredContact>('se:contact:'+p.contact);if(!c)return reply(req,{error:'Unsubscribe unavailable. Please reply unsubscribe to the original email.'},503);
  // Permanent global suppression by normalized email HMAC; survives reimport under a new contact ID.
  await suppressContact(redis,c,'unsubscribe');
  return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Unsubscribed</title><main><h1>You’re unsubscribed.</h1><p>You will receive no further Exit Desk marketing emails.</p><p>This does not cancel a report you requested.</p></main></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"}});
}
export async function POST(req:Request,{params}:{params:{action:string}}){
  try{
    if(params.action==='unsubscribe')return await unsubscribe(req);
    if(!enabled())return reply(req,{error:'Pilot not enabled'},503);
    const raw=await req.text();if(Buffer.byteLength(raw)>16384)return reply(req,{error:'Payload too large'},413);
    let b:any;try{b=JSON.parse(raw);}catch{return reply(req,{error:'Invalid JSON'},400);}
    if(!b||typeof b!=='object'||Array.isArray(b))return reply(req,{error:'Invalid body'},400);
    if(params.action==='event'){
      if(!origins.includes(req.headers.get('origin')??''))return reply(req,{error:'Invalid origin'},403);
      if(!browserEvents.includes(b.kind)||!safeId(b.visit))return reply(req,{error:'Invalid event'},400);
      const c=await campaign(b.token);if(!c)return reply(req,{error:'Invalid campaign'},403);
      if(await c.redis.get('se:suppressed:'+c.contact.email_hash))return reply(req,{accepted:false});
      const bucket='se:rate:'+c.p.contact+':'+Math.floor(Date.now()/60000);
      const n=await c.redis.incr(bucket);if(n===1)await c.redis.expire(bucket,120);if(n>60)return reply(req,{error:'Rate limited'},429);
      await record(c.redis,{id:[c.p.contact,c.p.step,b.visit,b.kind].join('_'),kind:b.kind,signal:c.p.signal,contact:c.p.contact,audience:c.p.audience,step:c.p.step,visit:b.visit,at:new Date().toISOString(),authority:'browser'});
      if(['score_save','plan_signup','partner_application'].includes(b.kind))await c.redis.set('se:contact:'+c.contact.id,{...c.contact,status:'stopped'});
      return reply(req,{accepted:true});
    }
    if(!admin(req))return reply(req,{error:'Unauthorized'},401);
    const {redis}=config();
    if(params.action==='register'){
      if(!safeId(b.id)||!safeId(b.signal)||!['seller','broker'].includes(b.audience)||typeof b.email_hash!=='string'||!/^([0-9a-f]{64})$/.test(b.email_hash))return reply(req,{error:'Invalid contact'},400);
      if(typeof b.email_ciphertext!=='string'||b.email_ciphertext.length>1500)return reply(req,{error:'Encrypted email required'},400);
      let email:string;try{email=decryptEmail(b.email_ciphertext,process.env.STALLED_EXIT_SIGNING_SECRET??'');}catch{return reply(req,{error:'Invalid encrypted email'},400);}
      if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||contactHash(email,process.env.STALLED_EXIT_SUPPRESSION_SECRET??'')!==b.email_hash)return reply(req,{error:'Email identity mismatch'},400);
      const old=await redis.get<RegisteredContact>('se:contact:'+b.id);
      if(old){if(old.email_hash!==b.email_hash||old.signal!==b.signal||old.audience!==b.audience)return reply(req,{error:'Contact identity conflict'},409);return reply(req,{registered:true,existing:true});}
      const owner=await redis.get<string>('se:email-owner:'+b.email_hash);if(owner&&owner!==b.id)return reply(req,{error:'Duplicate contact email'},409);
      // Register at most 50 contacts, atomically; never overwrite a suppression or an existing identity.
      const c:RegisteredContact={id:b.id,signal:b.signal,audience:b.audience,email_hash:b.email_hash,email_ciphertext:b.email_ciphertext,status:'active',created_at:new Date().toISOString()};
      const registered=await redis.eval(`if redis.call('EXISTS',KEYS[1])==1 then return 0 end
        if redis.call('EXISTS',KEYS[2])==1 then return 0 end
        if tonumber(redis.call('GET',KEYS[3]) or '0')>=50 then return 0 end
        redis.call('SET',KEYS[1],ARGV[1]);redis.call('SET',KEYS[2],ARGV[2]);redis.call('INCR',KEYS[3]);return 1`,['se:contact:'+c.id,'se:email-owner:'+c.email_hash,'se:contact-count'],[JSON.stringify(c),c.id]);
      return reply(req,{registered:registered===1},registered===1?200:409);
    }
    if(params.action==='suppress'){
      if(!safeId(b.contact))return reply(req,{error:'Invalid ID'},400);
      const c=await redis.get<RegisteredContact>('se:contact:'+b.contact);if(!c)return reply(req,{error:'Not found'},404);
      await suppressContact(redis,c,'operator_optout');
      return reply(req,{suppressed:true});
    }
    if(params.action==='record'){
      if(!operatorEvents.includes(b.kind)||!safeId(b.id)||!safeId(b.contact)||typeof b.source_ref!=='string'||b.source_ref.length<3||b.source_ref.length>300)return reply(req,{error:'Invalid event/provenance'},400);
      const c=await redis.get<RegisteredContact>('se:contact:'+b.contact);if(!c)return reply(req,{error:'Not found'},404);
      if(b.amount_cents!==undefined&&(!Number.isSafeInteger(b.amount_cents)||b.amount_cents<0))return reply(req,{error:'Invalid amount'},400);
      if(b.step!==undefined&&![0,1,2].includes(b.step))return reply(req,{error:'Invalid sequence step'},400);
      if(b.kind==='sent'&&(c.status!=='active'||await redis.get('se:suppressed:'+c.email_hash)))return reply(req,{error:'Contact stopped or suppressed'},409);
      if(b.ref!==undefined&&(typeof b.ref!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(b.ref)))return reply(req,{error:'Invalid referral tag'},400);
      const e:PilotEvent={id:b.id,kind:b.kind,signal:c.signal,contact:c.id,audience:c.audience,at:new Date().toISOString(),source_ref:b.source_ref,step:b.step,amount_cents:b.amount_cents,ref:b.ref,authority:'provider_or_operator'};
      await record(redis,e);
      if(['bounced','complained'].includes(b.kind))await redis.set('se:suppressed:'+c.email_hash,{at:e.at,reason:b.kind});
      if(['bounced','complained','replied','partner_approved'].includes(b.kind))await redis.set('se:contact:'+c.id,{...c,status:'stopped'});
      return reply(req,{recorded:true});
    }
    return reply(req,{error:'Not found'},404);
  }catch{return reply(req,{error:'Pilot service unavailable'},503);}
}
