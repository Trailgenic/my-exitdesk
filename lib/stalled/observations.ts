import {Candidate} from './engine';
/** Append snapshots to a curator-resolved identity. No fuzzy entity guessing. */
export function mergeObservation(previous:Candidate|undefined,incoming:Candidate,observedAt:string):Candidate{
  const next=structuredClone(incoming);
  if(!previous){next.first_seen_at=observedAt;return next;}
  if(previous.id!==incoming.id||previous.entity_key!==incoming.entity_key)throw new Error('Identity conflict: resolve explicitly before merging');
  const evidence=new Map(previous.evidence.map(e=>[e.id,e]));
  for(const e of incoming.evidence){const old=evidence.get(e.id);if(old&&JSON.stringify(old)!==JSON.stringify(e))throw new Error('Evidence is immutable; append a new evidence ID');evidence.set(e.id,e);}
  next.evidence=[...evidence.values()];next.first_seen_at=previous.first_seen_at;
  const originalDates=[previous.original_published_at,incoming.original_published_at].filter((v):v is string=>!!v).sort();
  next.original_published_at=originalDates[0]??null;
  if(previous.last_updated_at&&(!next.last_updated_at||previous.last_updated_at>next.last_updated_at))next.last_updated_at=previous.last_updated_at;
  return next;
}
