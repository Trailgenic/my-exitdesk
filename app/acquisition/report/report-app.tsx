'use client';
import { useEffect, useRef, useState } from 'react';
import { BUYER_INTAKE_FIELDS, type BuyerField, type BuyerIntake } from '@/lib/acquisition/buyer-intake';
import { BUYER_SAMPLE_REPORT } from '@/lib/acquisition/buyer-sample';
import type { BuyerDiagnosticReport } from '@/lib/acquisition/buyer-diagnostic';
import { buyerReportSections } from '@/lib/acquisition/buyer-report-view';
import './report.css';

const groups = [...new Set(BUYER_INTAKE_FIELDS.map(f => f[2]))];
type Quote = { available: boolean; amount?: number; currency?: string; live?: boolean; message?: string };
export default function BuyerReportApp() {
  const [step,setStep] = useState(0);
  const [answers,setAnswers] = useState<Partial<Record<BuyerField,string>>>({});
  const [segment,setSegment] = useState<BuyerIntake['segment']>('strategic');
  const [research,setResearch] = useState(false);
  const [identity,setIdentity] = useState({companyName:'',website:'',industry:'',geography:''});
  const [quote,setQuote] = useState<Quote | null>(null);
  const [report,setReport] = useState<BuyerDiagnosticReport | null>(null);
  const [session,setSession] = useState('');
  const [error,setError] = useState('');
  const [status,setStatus] = useState('');
  const [busy,setBusy] = useState(false);
  const [ack,setAck] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const key = useRef('');
  const active = useRef(false);
  useEffect(() => {
    key.current = crypto.randomUUID();
    fetch('/api/acquisition/buyer-report', {cache:'no-store'}).then(r=>r.json()).then(setQuote).catch(()=>setQuote({available:false,message:'Checkout is temporarily unavailable.'}));
    const url = new URL(window.location.href);
    if (url.hash === '#sample') setReport(BUYER_SAMPLE_REPORT);
    const id = url.searchParams.get('session_id');
    if (id) { sessionStorage.setItem('acquisition-buyer-session',id); setSession(id); url.searchParams.delete('session_id'); history.replaceState(null,'',url.pathname); }
    else { const saved = sessionStorage.getItem('acquisition-buyer-session'); if (saved && url.hash !== '#sample') setSession(saved); }
    if (url.searchParams.has('cancelled')) setStatus('Checkout was cancelled. No report was generated. Your previous order is not charged unless payment completed.');
  },[]);
  useEffect(()=>{ heading.current?.focus(); },[step]);
  async function generate(id: string) {
    if (active.current) return;
    active.current=true; setBusy(true);setError('');setStatus('Ella is preparing your company assessment. Public research, when selected, and the report can take several minutes.');
    try {
      const response=await fetch('/api/acquisition/buyer-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:id})});
      const data=await response.json();
      if(response.status===202){setStatus(data.message);return;}
      if(!response.ok)throw new Error(data.error||'The report could not finish. Retry the same order.');
      setReport(data.report);setStatus(data.emailStatus==='sent'?'Your PDF was emailed to the address used at checkout.':'Your report is ready here. Email delivery needs a retry; you can download the PDF now.');
    }catch(e){setError(e instanceof Error?e.message:'Report unavailable. Retry the same order without paying again.');}
    finally{active.current=false;setBusy(false);}
  }
  useEffect(()=>{ if(session)void generate(session); },[session]);
  function sample() { setReport(BUYER_SAMPLE_REPORT); setError('');setStatus('Illustrative sample: fictional company, invented competitor names, and no live research run.'); }
  function start() {setReport(null);setSession('');sessionStorage.removeItem('acquisition-buyer-session');setStatus('');setError('');setStep(0);}
  function validate() {
    const missing=BUYER_INTAKE_FIELDS.find(([key,,,required])=>required&&!answers[key]?.trim());
    if(missing){setError('Complete: '+missing[1]);setStep(groups.indexOf(missing[2]));return false;}return true;
  }
  async function checkout() {
    if(!validate()||!ack)return;
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/acquisition/buyer-report/checkout',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key.current},body:JSON.stringify({intake:{segment,answers,publicResearch:research?identity:null}})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Checkout could not open.');
      const destination=new URL(data.url);if(destination.protocol!=='https:'||destination.hostname!=='checkout.stripe.com')throw new Error('Unexpected checkout destination.');
      window.location.assign(destination.href);
    }catch(e){setError(e instanceof Error?e.message:'Checkout unavailable.');setBusy(false);}
  }
  async function download() {
    if(report?.reportId==='illustrative-harbor-001'){window.location.assign('/acquisition-buyer-sample.pdf');return;}
    setBusy(true);setError('');
    try {const r=await fetch('/api/acquisition/buyer-report/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:session})});if(!r.ok||!r.headers.get('content-type')?.startsWith('application/pdf'))throw new Error('PDF unavailable. Retry this order.');const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='Acquisition_Lens_Buyer_Assessment.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e instanceof Error?e.message:'PDF unavailable.');}finally{setBusy(false);}
  }
  const price=quote?.amount&&quote.currency?new Intl.NumberFormat('en-US',{style:'currency',currency:quote.currency}).format(quote.amount/100):null;
  return <div className="buyer-app"><main>
    <header><a href="https://www.mikeye.com/acquisition-lens">Mike Ye · Acquisition Lens</a><a href="https://www.mikeye.com/exit">Seller tools: Exit Desk ↗</a></header>
    <section className="hero"><p className="eyebrow">Ella’s buyer assessment · Mike Ye’s acquisition judgment</p><h1>Understand the business.<br/>Underwrite the decision.</h1><p className="deck">A substantive assessment of the company, competitors, industry, transferable economics, and the acquisition you are considering.</p><div className="hero-meta">Your acquisition context + cited public research + 22 encoded judgment principles</div></section>
    <div className="workspace">
      {status&&<p className="status" role="status">{status}</p>}{error&&<p className="error" role="alert">{error}</p>}
      {busy&&<p className="working" aria-live="polite">Working on your request. Keep this page open. Retrying an existing paid order does not require another purchase.</p>}
      {session&&!report&&!busy&&<div className="actions"><button onClick={()=>generate(session)}>Retry existing order</button><button className="secondary" onClick={start}>Start a different assessment</button></div>}
      {report ? <>
        <div className="report-summary"><p className="eyebrow">{report.reportId==='illustrative-harbor-001'?'Illustrative sample · fictional deal':'Confidential buyer assessment'}</p><h2>{report.companyName}</h2><p>{report.draft.investmentCommitteeSnapshot.headline}</p><p className="badge">Provisional assessment: {report.draft.provisionalPosture}</p></div>
        <div className="actions no-print"><button onClick={download} disabled={busy}>Download PDF</button><button className="secondary" onClick={()=>window.print()}>Print assessment</button>{session&&<button className="secondary" disabled={busy} onClick={()=>generate(session)}>Retry email delivery</button>}<button className="secondary" onClick={start} disabled={busy}>Start your assessment</button></div>
        <nav className="report-nav no-print" aria-label="Report sections">{buyerReportSections(report).map((s,i)=><a key={i} href={'#report-'+i}>{s.title}</a>)}</nav>
        <article className="report">{buyerReportSections(report).map((s,i)=><section id={'report-'+i} key={i}><p className="eyebrow">{String(i+1).padStart(2,'0')}</p><h2>{s.title}</h2>{(s.paragraphs.length?s.paragraphs:['No additional item identified from the supplied evidence.']).map((p,j)=><p key={j}>{p}</p>)}</section>)}</article>
        {report.sourceRegister.some(s=>s.url)&&<section className="sources"><h2>Open the public sources</h2>{report.sourceRegister.filter(s=>s.url).map(s=><p key={s.id}><a href={s.url!} target="_blank" rel="noopener noreferrer">{s.id}: {s.label}</a></p>)}</section>}
      </> : !session&&<>
        <div className="intro-card"><div><h2>See the depth before you begin.</h2><p>A fictional acquisition shows how Ella applies the existing judgment framework. The free screen is a starting point; this is the substantive report.</p></div><button className="secondary" onClick={sample}>View sample assessment →</button></div>
        <div className="offer"><h2>Buyer Acquisition Assessment</h2><p>One company, analyzed for your buyer context. Receive the report here and as an emailed PDF. Current company, competitor, and industry research is included when you authorize a public research identity.</p><strong>{price?(quote?.live?'One-time fee: ':'Test checkout: ')+price:'Paid product · price shown when checkout opens'}</strong>{!quote?.available&&<p className="muted">{quote?.message||'Checking availability…'}</p>}</div>
        <form onSubmit={e=>{e.preventDefault();if(step<4){setError('');setStep(step+1);}else void checkout();}}>
          <p className="eyebrow">Section {step+1} of 5 · {step<4?groups[step]:'Research and review'}</p><h2 ref={heading} tabIndex={-1}>{step<4?groups[step]:'Choose the evidence Ella can use.'}</h2><p className="muted">Answer from the information you have. Unknown or undisclosed details remain uncertainties in the report. Required fields are marked.</p>
          {step===0&&<label>Acquisition context<select value={segment} onChange={e=>{setSegment(e.target.value as BuyerIntake['segment']);keyChange();}}><option value="strategic">Strategic / adjacent operator</option><option value="lower_middle_market">Lower middle market / financial buyer</option><option value="main_street">Main Street / owner-operator</option></select></label>}
          {step<4&&BUYER_INTAKE_FIELDS.filter(f=>f[2]===groups[step]).map(([key,label,,required])=><label key={key}>{label}{required?' · required':''}<textarea required={required} minLength={required?3:undefined} maxLength={2500} rows={key==='companyDescription'||key==='buyerThesis'?4:3} value={answers[key]??''} onChange={e=>{setAnswers({...answers,[key]:e.target.value});keyChange();}} placeholder={required?'Be specific to this buyer and target.':'Unknown / not provided'}/></label>)}
          {step===4&&<><label className="check"><input type="checkbox" checked={research} onChange={e=>{setResearch(e.target.checked);keyChange();}}/>Include cited public company, competitor, and industry research.</label><p className="muted">Only the public identity below goes to the research stage. Your private price, financing, financials, buyer thesis, and other deal details are used in Ella’s separate assessment step. For an anonymous target, leave research off; the report will identify external evidence gaps.</p>{research&&<div className="research-fields">{(['companyName','website','industry','geography'] as const).map(k=><label key={k}>{({companyName:'Public company name',website:'Official public website (https://)',industry:'Public industry / products',geography:'Public operating geography'})[k]}<input required value={identity[k]} maxLength={k==='website'?500:200} type={k==='website'?'url':'text'} onChange={e=>{setIdentity({...identity,[k]:e.target.value});keyChange();}}/></label>)}</div>}
            <details><summary>Review your answers</summary>{BUYER_INTAKE_FIELDS.map(([k,label])=><p key={k}><strong>{label}</strong><br/>{answers[k]||'Unknown / not provided'}</p>)}</details>
            <label className="check"><input type="checkbox" required checked={ack} onChange={e=>setAck(e.target.checked)}/>I am authorized to submit this information for AI analysis. I understand the report is based on supplied and available evidence, and does not establish a valuation or approve a transaction.</label><p className="muted">The intake and report are encrypted in storage and retained for 30 days. The PDF goes to the email used at Stripe checkout. Public research queries may reveal the target’s public identity to the search provider. Confidential deal details are processed by the AI provider to prepare your assessment.</p>
          </>}
          <div className="actions"><button type="button" className="secondary" disabled={step===0||busy} onClick={()=>setStep(step-1)}>Back</button><button type="submit" disabled={busy||(step===4&&(!quote?.available||!ack))}>{step===4?(price?'Continue to secure checkout · '+price:'Checkout opens after launch'):'Continue →'}</button></div>
        </form>
      </>}
    </div><footer><a href="https://www.mikeye.com/acquisition-lens">Acquisition Lens</a><a href="https://www.mikeye.com/exit">Exit Desk</a><a href="https://www.mikeye.com/about">About Mike Ye</a><span>AI-generated assessment using Mike Ye’s encoded judgment. No claim of personal review.</span></footer>
  </main></div>;
  function keyChange(){key.current=crypto.randomUUID();}
}
