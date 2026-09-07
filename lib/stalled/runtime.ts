import {Redis} from '@upstash/redis';
import {CampaignToken,verifyToken,idPattern,contactHash,decryptEmail} from './security';
export const browserEvents=['score_start','score_complete','score_save','plan_signup','valuation_visit','sample_visit','partner_visit','partner_application','landing_visit'] as const;
export const operatorEvents=['sent','delivered','bounced','complained','replied','clicked','partner_approved','referred_client','referral_approved','referral_paid','referral_reversed','cost'] as const;
export function enabled(){return process.env.STALLED_EXIT_ENABLED==='true';}
export function config(requireEnabled=true){
  if(requireEnabled&&!enabled())throw new Error('Pilot disabled');
  const secret=process.env.STALLED_EXIT_SIGNING_SECRET??'';
  const url=process.env.STALLED_EXIT_REDIS_URL??'';const token=process.env.STALLED_EXIT_REDIS_TOKEN??'';
  if(secret.length<32||!url.startsWith('https://')||!token||(process.env.STALLED_EXIT_SUPPRESSION_SECRET??'').length<32)throw new Error('Pilot storage/signing not configured');
  return {secret,redis:new Redis({url,token})};
}
export interface RegisteredContact {id:string;signal:string;audience:'seller'|'broker';email_hash:string;email_ciphertext:string;status:'active'|'stopped';created_at:string}
export interface PilotEvent {id:string;kind:string;signal:string;contact:string;audience:'seller'|'broker';at:string;step?:number;amount_cents?:number;ref?:string;source_ref?:string;visit?:string;authority:'browser'|'provider_or_operator'|'stripe'}
export async function record(redis:Redis,event:PilotEvent){
  // Atomic idempotency + durable event write; bounded pilot, no false success on storage failure.
  await redis.eval(`if redis.call('EXISTS',KEYS[1]) == 1 then return 0 end
    redis.call('SET',KEYS[1],ARGV[1],'EX',15552000)
    redis.call('ZADD',KEYS[2],ARGV[2],KEYS[1])
    return 1`,['se:event:'+event.id,'se:events'],[JSON.stringify(event),Date.parse(event.at)]);
}
export async function campaign(token:unknown){
  const {secret,redis}=config();const p=verifyToken(token,secret,'campaign') as CampaignToken|null;
  if(!p)return null;
  const contact=await redis.get<RegisteredContact>('se:contact:'+p.contact);
  if(!contact||contact.signal!==p.signal||contact.audience!==p.audience)return null;
  return {redis,p,contact};
}
export async function recordPurchase(session:{id:string;payment_status:string;amount_total:number|null;metadata:Record<string,string>|null;client_reference_id:string|null}){
  if(!enabled()||session.payment_status!=='paid'||!session.metadata?.se_token)return;
  const c=await campaign(session.metadata.se_token);if(!c)return;
  await record(c.redis,{id:'stripe_'+session.id,kind:'purchase',signal:c.p.signal,contact:c.p.contact,audience:c.p.audience,at:new Date().toISOString(),amount_cents:session.amount_total??0,ref:session.client_reference_id??undefined,source_ref:session.id,authority:'stripe'});
  // Purchase is a stop event for the cold sequence, not an unsubscribe from requested delivery.
  await c.redis.set('se:contact:'+c.contact.id,{...c.contact,status:'stopped'});
}
export function safeId(value:unknown):value is string{return typeof value==='string'&&idPattern.test(value);}
export async function isSuppressed(email:string){
  if(!enabled()&&!process.env.STALLED_EXIT_SIGNING_SECRET)return false;
  const {redis}=config(false);return !!await redis.get('se:suppressed:'+contactHash(email,process.env.STALLED_EXIT_SUPPRESSION_SECRET??''));
}
export async function suppressContact(redis:Redis,c:RegisteredContact,reason:string){
  const at=new Date().toISOString();
  await redis.set('se:suppressed:'+c.email_hash,{at,reason});
  await redis.set('se:contact:'+c.id,{...c,status:'stopped'});
  await record(redis,{id:'unsubscribe_'+c.id,kind:'unsubscribed',signal:c.signal,contact:c.id,audience:c.audience,at,authority:'provider_or_operator'});
  // Existing requested nurture is in Kit. Cancel there too; never import cold prospects into Kit.
  const apiSecret=process.env.CONVERTKIT_API_SECRET;
  if(!apiSecret){await redis.set('se:paused','Kit suppression secret missing');throw new Error('Kit suppression configuration required');}
  try{
    const email=decryptEmail(c.email_ciphertext,process.env.STALLED_EXIT_SIGNING_SECRET??'');
    const response=await fetch('https://api.convertkit.com/v3/unsubscribe',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_secret:apiSecret,email}),signal:AbortSignal.timeout(10000)});
    if(!response.ok&&response.status!==404)throw new Error('Kit suppression failed');
  }catch{
    await redis.set('se:suppression-pending:'+c.id,{at,reason});
    await redis.set('se:paused','Suppression synchronization requires retry');
    throw new Error('Opt-out recorded; Kit synchronization pending');
  }
  await redis.del('se:suppression-pending:'+c.id);
}
