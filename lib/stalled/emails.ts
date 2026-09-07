import {Candidate,Source,assess} from './engine';
export function sequence(c:Candidate,sources:Source[],urls:{score:string;partners:string;sample:string;unsubscribe:string},postal:string,now:string){
  const a=assess(c,sources,now);const person=c.contact;
  if(!a.outreach_ready||!person)throw new Error('Candidate held: '+a.hold_reasons.join(', '));
  if(!postal.trim())throw new Error('Approved business mailing address required');
  const greeting=person.first_name?'Hi '+person.first_name+',':'Hello,';
  const footer='— Mike Ye\nExit Desk\n\nCommercial message from Exit Desk.\n'+postal+'\nUnsubscribe from all Exit Desk marketing: '+urls.unsubscribe;
  const finish=(body:string)=>greeting+'\n\n'+body+'\n\n'+footer;
  const label=person.audience==='seller'?c.business_name!:c.public_listing_label;
  const evidence=a.reduction_count>0
    ?'The listing for '+label+' advertises a price reduction.'
    :a.original_listing_age_days!==null
      ?'The listing for '+label+' is dated '+c.original_published_at!.slice(0,10)+' and is still advertised as available.'
      :a.observed_active_age_days!==null&&a.observed_active_age_days>90
        ?'The listing for '+label+' was visible in our records at least '+a.observed_active_age_days+' days ago and is still advertised as available.'
        :'The listing for '+label+' advertises more flexible sale terms.';
  if(person.audience==='seller')return [
    {step:0,day:0,subject:a.reduction_count>0?'Before you cut the price again':'A lower asking price may not fix it',body:finish(evidence+'\n\nWhen a business stays on the market, price may be only part of the issue. Buyers may also be discounting owner dependence, customer concentration, transferability, or the way the financials and opportunity are presented.\n\nBefore making another concession, see what a buyer may be seeing.\n\nTake the free Exit Score:\n'+urls.score+'\n\n8 questions. About 90 seconds. No email required to take it. Self-serve, with no call required.')},
    {step:1,day:4,subject:'Price may not be the problem',body:finish('A price cut changes the number. It does not explain whether the business can run without you, whether customers will stay, or whether a buyer can get comfortable with the earnings.\n\nThose are different problems, and each calls for different preparation.\n\nThe free Exit Score gives you a buyer-side read on where to look first:\n'+urls.score+'\n\nIf you want a deeper diagnostic, the Buyer-Lens Audit is $199 for businesses under $1M in annual revenue and $499 for $1M+. The report is delivered within 24 hours. No sales meeting required.')},
    {step:2,day:10,subject:'One last thought on your exit',body:finish('Before changing the price or terms, it helps to separate what buyers are questioning from what you can actually improve.\n\nThat is what Exit Desk is built to help you examine. Start with the free Score:\n'+urls.score+'\n\nYou can also see the report format here:\n'+urls.sample+'\n\nThis is my last email about this listing. If the timing is not right, no response is needed.')}
  ];
  return [
    {step:0,day:0,subject:'A buyer-side diagnostic for your seller',body:finish(evidence+'\n\nFor a seller facing a slower process, an independent buyer-side diagnostic can help frame what buyers may be discounting before the next pricing conversation.\n\nYou keep the relationship. Exit Desk provides the diagnostic. We do not represent sellers, broker transactions, or compete for your engagement.\n\nOur Partner Program pays a flat $100 per converted paid Buyer-Lens Audit, at either report tier. No minimums, quotas, or exclusivity.\n\nSee the program and apply here:\n'+urls.partners)},
    {step:1,day:4,subject:'You keep the relationship. We provide the diagnostic.',body:finish('A seller may hear “lower the price” when the real conversation is about transferable earnings, owner dependence, or how the opportunity is presented.\n\nExit Desk gives that conversation a structured buyer-side reference, grounded in my 25 years of buy-side M&A judgment. It supplements your work; it does not take over the engagement.\n\nReports are $199 below $1M annual revenue and $499 at $1M+, delivered within 24 hours. Approved partners receive $100 per converted paid report. Attribution and payout review are manual for v1.\n\nPartner details:\n'+urls.partners)},
    {step:2,day:10,subject:'A resource for this seller—and the next',body:finish('The partner relationship can be useful beyond one listing: a seller preparing to launch, a client whose process has slowed, or an owner who needs to understand the buyer’s lens before changing terms.\n\nYou decide when it fits, and you retain the client relationship. The referral payment is a flat $100 for each converted paid report.\n\nReview the program:\n'+urls.partners+'\n\nThis is my last follow-up. No call is needed to apply.')}
  ];
}
