import sys; sys.path.insert(0,'/tmp/build')
from checklist_common import *
SRC='/home/claude/my-exitdesk/public/resources/MikeYe-MA-Deal-Workflow-Checklist-v1.0.xlsx'
OUT=sys.argv[1]
wb=openpyxl.load_workbook(SRC)
dw=wb['Deal Workflow']; N1,N2=6,161

GROUP={
 'Strategy & Thesis':['Strategy','Deal Thesis','Investment Case','Strategic Fit','Market','Portfolio','Prioritization','Ceiling','Downside'],
 'Targeting & Outreach':['Targeting','Outreach','Seller','Ownership','Information','NDA','Confidentiality','Conflicts','Clean Teams','Data Room','Q&A'],
 'Valuation & Returns':['Valuation','Value','Returns','Economics','Purchase Price','Price Mechanics','Consideration','Forecast Accuracy'],
 'Financing & Cash':['Capital','Cash','Debt & Cash','Financing','Funds Flow','Working Capital'],
 'Financial & Tax':['Financial','Finance','Tax','Reporting'],
 'Commercial & Customers':['Commercial','Customers','Revenue'],
 'Legal, Terms & Regulatory':['Legal','Regulatory','Compliance','Consents','Conditions','Terms','Structure','Earnout','Exclusivity','Interim Conduct','Risk Allocation','Disclosure','Closing','Negotiation','Control'],
 'People & Knowledge':['People','Employees','Management','Knowledge','Resources'],
 'Operations & Workflows':['Operations','Workflows','Transferability','Back Office','TSA','Day 1','Readiness','Command Center'],
 'Technology & Data':['Technology','Systems','Cyber','Cyber & Data','Testing'],
 'Integration & Synergies':['Integration','Synergies','Dis-synergies','Handoff','Performance','Execution','Planning','Workstreams'],
 'Governance & Decisions':['Governance','Decision','Decisions','Process','Issues','Unknowns','Risk','Integrity','Trust','Diligence','Archive','Communications'],
}
LOOK={v:g for g,vs in GROUP.items() for v in vs}
missing=set()
for r in range(N1,N2+1):
    v=dw.cell(r,4).value
    if v not in LOOK: missing.add(v); continue
    dw.cell(r,4).value=LOOK[v]
assert not missing, missing
dropdown(dw, f'D{N1}:D{N2}', list(GROUP))

# Priority: Critical now means "can stop or reprice the deal" (If unresolved = Walk or Price)
moved=0
for r in range(N1,N2+1):
    if dw.cell(r,9).value=='Critical' and dw.cell(r,8).value not in ('Walk','Price'):
        dw.cell(r,9).value='High'; moved+=1
print('critical->high',moved)

# Related tool names
fix={'Acquisition Lens':'Acquisition Target Pipeline & Deal Funnel','Industry Comps':'Public Company Comps Workbench',
     'Valuation Models':'Company valuation models','Decision Log':'Decision Log tab'}
for r in range(N1,N2+1):
    v=dw.cell(r,14).value
    if v in fix: dw.cell(r,14).value=fix[v]
for r in (37,40):
    if dw.cell(r,14).value=='Acquisition Target Pipeline & Deal Funnel': dw.cell(r,14).value='Acquisition Mandate & Target Screen'

dw['A3']=('Start at the phase you are in. Each row is one action: give it an owner and a date, update Status as the work moves, '
          'and use Scope decision to drop rows that do not apply. Yellow columns are yours to fill in.')
input_fill(dw,['J','K','L','O','P'],N1,N2); dates(dw,['K'],N1,N2)
rebuild_text_cf(dw); print_setup(dw, title_rows='5:5', area=f'A5:L{N2}')

sg=wb['Stage Gates']; rebuild_text_cf(sg); input_fill(sg,['I','J','K'],6,18); print_setup(sg,title_rows='5:5')
dt=wb['Deal Team']; input_fill(dt,['E','F','G','H'],6,18); print_setup(dt,title_rows='5:5')
dl=wb['Decision Log']; rebuild_text_cf(dl); input_fill(dl,['B','C','D','E','F','G','H','I','J','K','L','M','N'],6,55)
dates(dl,['B','L'],6,55); print_setup(dl,title_rows='5:5')

# ---------- Dashboard ----------
ds=wb['Dashboard']; clear_dashboard(ds,5)
ds['A3']='Version 1.1 · November 2026 · 156 buyer-side actions, 13 decision gates, deal-team roles and a decision log, from mandate to post-close review.'
d=Dash(ds,5)
d.note('How to use','Start at the phase you are in. Put a name and a date on each action, filter by phase or gate, and don\'t clear a gate until its evidence is in. Use Scope decision to drop actions that don\'t apply. Removed actions drop out of every count below.')
d.note('Priority','Critical means the action can stop or reprice the deal if it goes wrong. High means it matters but can usually be handled in the contract or the plan.')
d.gap()
T='DealWorkflowTable'
live=f'{T}[Scope decision],"<>Remove"'
d.header('Where the deal stands','Now','What it tells you')
r_scope=d.metric('Actions in scope',f'=COUNTIFS({live},{T}[Status],"<>N/A")','Rows still in play after Remove and N/A.')
r_done=d.metric('Complete',f'=COUNTIFS({T}[Status],"Complete",{live})','Finished, with the evidence in the Ready column.')
d.metric('% complete',f'=IFERROR(B{r_done}/B{r_scope},0)','Share of in-scope actions finished.','0%')
d.metric('In progress',f'=COUNTIFS({T}[Status],"In Progress",{live})','Work under way.')
d.metric('Blocked',f'=COUNTIFS({T}[Status],"Blocked",{live})','Stuck. Each one needs a named fix or an escalation.')
d.metric('Overdue',f'=COUNTIFS({T}[Target date],"<"&TODAY(),{T}[Status],"<>Complete",{T}[Status],"<>N/A",{live})','Past the target date and not done.')
d.metric('Open Critical actions with no owner',f'=COUNTIFS({T}[Priority],"Critical",{T}[Status],"<>Complete",{T}[Status],"<>N/A",{T}[Accountable owner],"",{live})','Assign these first. Nobody owns work that can stop the deal.')
d.metric('Next gate to clear','=IFERROR(INDEX(StageGatesTable[Gate],MATCH(1,INDEX((StageGatesTable[Status]<>"Approved")*(StageGatesTable[Status]<>"N/A")*(StageGatesTable[Scope decision]<>"Remove"),0),0)),"All gates cleared")','First gate not yet approved on the Stage Gates tab.')
d.metric('Open decisions','=COUNTIFS(DealDecisionLogTable[Status],"Open",DealDecisionLogTable[Decision],"<>")+COUNTIFS(DealDecisionLogTable[Status],"In Progress",DealDecisionLogTable[Decision],"<>")','Logged decisions still waiting on an answer.')
d.gap()
d.header('If unresolved','Open','What it means')
defs=[('Investigate','Evidence is missing, contradictory or not yet tested. Name what is missing and who is getting it.'),
      ('Price','The issue changes standalone value, required investment, financing or returns.'),
      ('Protect','Handle it through structure, contract, consent, retention, control or the integration plan.'),
      ('Walk','The downside, a transfer failure, a ceiling breach or an integrity issue breaks the thesis.')]
for k,txt in defs:
    rr=d.metric(k,f'=COUNTIFS({T}[If unresolved],A{d.r},{T}[Status],"<>Complete",{T}[Status],"<>N/A",{live})',txt)
    ds[f'A{rr}'].font=F(b=True)
text_cf(ds,f'B{d.r-1}','',None) if False else None
d.gap()
d.header('Progress by phase','Actions','Complete','Blocked','% complete')
phases=[]
for r in range(N1,N2+1):
    p=dw.cell(r,2).value
    if p not in phases: phases.append(p)
first=d.r
for p in phases:
    rr=d.r
    d.row([p,f'=COUNTIFS({T}[Phase],A{rr},{live})',f'=COUNTIFS({T}[Phase],A{rr},{T}[Status],"Complete",{live})',
           f'=COUNTIFS({T}[Phase],A{rr},{T}[Status],"Blocked",{live})',f'=IFERROR(C{rr}/(B{rr}-COUNTIFS({T}[Phase],A{rr},{T}[Status],"N/A",{live})),0)'],
          fmts=[None,'0','0','0','0%'])
pct_bar(ds,f'E{first}:E{d.r-1}')
for col,w in zip('ABCDEF',[34,16,16,16,16,30]): ds.column_dimensions[col].width=w
ds.freeze_panes=None
print_setup(ds,landscape=False,area=f'A2:F{d.r-1}',fit_height=1)
wb.properties.title='M&A Deal Workflow Checklist v1.1'; wb.properties.creator='Mike Ye'
wb.active=0
wb.save(OUT); print('saved',OUT)
