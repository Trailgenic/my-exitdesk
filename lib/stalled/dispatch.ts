import {Candidate,Source,assess} from './engine';
export interface DispatchState {
  provider_policy_verified:boolean; provider_policy_url:string; mailbox_policy_verified:boolean;
  sender_authenticated:boolean; postal_address_approved:boolean;
  unsubscribe_test_passed:boolean; suppression_sync_test_passed:boolean;
  provider_events_test_passed:boolean; live_suppression_checked_at:string;
  suppressed:boolean; stopped:boolean; sent_steps:number[];
  first_sent_at:string|null; prior_sent_at:string|null;
  any_reply:boolean; opted_in:boolean; purchased:boolean; partner_applied:boolean;
  campaign_paused:boolean; provider_name:string;
}
/** A readiness decision only. The provider adapter must rerun this immediately before submission. */
export function dispatchDecision(c:Candidate,sources:Source[],state:DispatchState,step:number,now:string){
  const reasons=[...assess(c,sources,now).hold_reasons];
  for(const key of ['provider_policy_verified','mailbox_policy_verified','sender_authenticated','postal_address_approved','unsubscribe_test_passed','suppression_sync_test_passed','provider_events_test_passed'] as const)if(!state[key])reasons.push(key+'_required');
  if(!/^https:\/\//.test(state.provider_policy_url))reasons.push('provider_policy_evidence_required');
  if(/resend|convertkit|^kit$/i.test(state.provider_name))reasons.push('provider_prohibits_cold_outreach');
  const checkAge=Date.parse(now)-Date.parse(state.live_suppression_checked_at);
  if(!Number.isFinite(checkAge)||checkAge<0||checkAge>30000)reasons.push('fresh_global_suppression_check_required');
  if(state.suppressed||state.stopped||state.any_reply||state.opted_in||state.purchased||state.partner_applied)reasons.push('contact_stopped');
  if(state.campaign_paused)reasons.push('campaign_paused');
  if(![0,1,2].includes(step))reasons.push('invalid_sequence_step');
  if(state.sent_steps.includes(step))reasons.push('already_sent');
  if(step>0&&!state.sent_steps.includes(step-1))reasons.push('prior_step_not_sent');
  const first=Date.parse(state.first_sent_at??'');const prior=Date.parse(state.prior_sent_at??'');
  const due=step===0?Date.parse(now):Math.max(first+[0,4,10][step]*86400000,prior+(step===1?4:6)*86400000);
  if(step>0&&(!Number.isFinite(due)||Date.parse(now)<due))reasons.push('not_due');
  return {ready:reasons.length===0,reasons:[...new Set(reasons)],due_at:Number.isFinite(due)?new Date(due).toISOString():null,idempotency_key:c.id+':'+c.contact?.id+':'+step};
}
