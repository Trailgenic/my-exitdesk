import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

// Run a copy of this builder in an OS temporary directory with runtime node_modules.
const out = process.env.SYNERGY_OUTPUT_DIR || '/workspace/scratch/c919f721831d/outputs/synergy';
await fs.mkdir(out, { recursive: true });
const wb = Workbook.create();
const names = ['Dashboard','Assumptions','Cash Flow','Initiatives','Delivery','Guide'];
const sheets = Object.fromEntries(names.map(n => [n, wb.worksheets.add(n)]));
const ink='#1A1A18', navy='#173D34', gold='#79602E', muted='#5C5C54', amber='#FFF3CD', green='#00804A', blue='#0000FF';
const num='#,##0.0;(#,##0.0);"–"';
const pct='0.0%;(0.0%);"–"';
function col(n){let s='';for(;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function v(s,a,x){s.getRange(a).values=[[x]];}
function f(s,a,x){s.getRange(a).formulas=[[x]];s.getRange(a).format.font.color=x.includes("'!")?green:'#000000';}
function note(s,a,x){v(s,a,x);s.getRange(a).format.font={name:'Arial',size:10,color:muted,italic:true};}
function input(s,a,x){v(s,a,x);s.getRange(a).format.fill=amber;s.getRange(a).format.font.color=typeof x==='number'?blue:ink;}
function heading(s,a,text){v(s,a,text);s.getRange(a).format.font={name:'Arial',size:16,bold:true,color:ink};}
function band(s,range,text){const r=s.getRange(range);r.format.fill=navy;r.format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};v(s,range.split(':')[0],text);}
function hdr(s,range,labels){s.getRange(range).values=[labels];s.getRange(range).format={fill:navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:42};}
function warn(s,a){s.getRange(a).conditionalFormats.add('containsText',{text:'Missing',format:{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}}});s.getRange(a).conditionalFormats.add('containsText',{text:'Unpriced',format:{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}}});s.getRange(a).conditionalFormats.add('containsText',{text:'Invalid',format:{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}}});}
for(const s of Object.values(sheets)){
 s.showGridLines=false;s.getRange('A1:AD230').format.font={name:'Arial',size:10,color:ink};
 s.getRange('A1:AD230').format.rowHeight=22;s.getRange('A1:B230').format.columnWidth=2.5;
 s.getRange('C1:C230').format.columnWidth=39;s.getRange('D1:J230').format.columnWidth=15;
 s.getRange('C1:AD230').format.verticalAlignment='center';
}
const d=sheets.Dashboard,a=sheets.Assumptions,c=sheets['Cash Flow'],i=sheets.Initiatives,t=sheets.Delivery,g=sheets.Guide;
d.tabColor=navy;a.tabColor=gold;g.tabColor='#CEC9BC';
heading(d,'C2','Synergy Underwriting & Value Bridge');
note(d,'C3','What can the buyer create, and what should the seller receive?');
v(d,'G4','Case selected');input(d,'H4','Base');d.getRange('H4').dataValidation={rule:{type:'list',values:['Base','Downside']}};
for(const [name,s] of Object.entries(sheets)){if(name==='Dashboard')continue;heading(s,'C2',name==='Cash Flow'?'Incremental cash flow':name);v(s,'G4','Case selected');f(s,'H4',"='Dashboard'!H4");s.getRange('H4').format.borders={preset:'outside',style:'dotted',color:gold};}
note(a,'C3','Blue numbers on amber cells are editable Assumptions. All money is USD thousands.');
hdr(a,'C6:F6',['Global input','Assumption','Meaning','']);
const globals=[['Standalone enterprise value',20000,'Value before buyer-specific synergies'],['Seller share of positive net synergy NPV',0,'Negotiated share; zero is a valid choice'],['Private affordability ceiling (EV)',null,'Enter financing and downside-tested EV ceiling'],['Tax losses and deductions usable',0,'0 = no immediate benefit; 1 = usable'],['Discount rate',0.12,'Annual rate for incremental cash flows'],['Approval authority',null,'Who can approve price and integration resources'],['Private hard ceiling (EV)',null,'Maximum authorized EV before negotiations'],['Proposed purchase price (EV)',null,'Compare the bid with the supported price']];
globals.forEach((r,k)=>{const rr=7+k;v(a,`C${rr}`,r[0]);input(a,`D${rr}`,r[1]);v(a,`E${rr}`,r[2]);});
a.getRange('C7:C14').format.wrapText=true;a.getRange('C7:F14').format.rowHeight=34;a.getRange('D7:D11').setNumberFormat(num);a.getRange('D13:D14').setNumberFormat(num);a.getRange('D8').setNumberFormat(pct);a.getRange('D11').setNumberFormat(pct);a.getRange('D10').setNumberFormat('0');
a.getRange('E6:E45').format.columnWidth=26;a.getRange('F6:F45').format.columnWidth=19;a.getRange('E7:J14').merge(true);
a.getRange('E7:J14').format.wrapText=true;a.getRange('D10').dataValidation={rule:{type:'list',values:['0','1']}};
hdr(a,'C15:J15',['Scenario driver','Selection','At close','Year 1','Year 2','Year 3','Year 4','Year 5']);
const drivers=[['Revenue multiplier',1,.75],['Cost-saving multiplier',1,.85],['Dis-synergy multiplier',1,1.5],['Benefit probability multiplier',1,.8],['Implementation-cost multiplier',1,1.25],['Capital multiplier',1,1.2],['Extra delay (months)',0,6]];
drivers.forEach(([label,b,down],k)=>{let r=16+k*3;v(a,`C${r}`,label);v(a,`D${r}`,'Active');v(a,`D${r+1}`,'Base');v(a,`D${r+2}`,'Downside');a.getRange(`C${r}:J${r}`).format.fill='#F7F5F0';
 for(let q=5;q<=10;q++){let cc=col(q);input(a,`${cc}${r+1}`,b);input(a,`${cc}${r+2}`,down);f(a,`${cc}${r}`,`=IF('Dashboard'!$H$4="Base",IF(ISNUMBER(${cc}${r+1}),${cc}${r+1},"Missing input"),IF('Dashboard'!$H$4="Downside",IF(ISNUMBER(${cc}${r+2}),${cc}${r+2},"Missing input"),"Invalid case"))`);}
});
a.getRange('E16:J33').setNumberFormat('0.00"x"');a.getRange('E34:J36').setNumberFormat('0');
note(a,'C39','Delay uses At close. Spend multipliers use At close. Operating multipliers use each forecast year.');
note(a,'C40','Unused period cells remain visible so the scenario groups share one time axis.');
v(a,'C42','Active inputs');f(a,'D42',`=IF(OR(COUNT(D7:D8,D10:D11)<>4,D7<0,D8<0,D8>1,D10<0,D10>1,MOD(D10,1)<>0,D11<0),"Missing / invalid global input",IF(OR(COUNT(F16:J16,F19:J19,F22:J22,F25:J25,E28,E31,E34)<>23,MIN(F16:J16,F19:J19,F22:J22,F25:J25,E28,E31,E34)<0),"Missing / invalid scenario input","Complete"))`);warn(a,'D42');

// One wide native filtered table holds each initiative's assumptions and operating handoff.
note(i,'C3','First pass: replace the three Assumption examples. Use all 10 fixed IDs. Enter an explicit zero where appropriate.');
const headers=['ID','Initiative','Type','Annual revenue','Contribution margin','Annual cost saving','Annual dis-synergy','One-time cost','Capex at close','Working capital at close','Start month','Ramp months','Probability','Tax rate','Cost deductible %','Operating owner','Integration action','Workflow dependency','Revenue disruption risk','Evidence','Missing input / finding','Decision','Treatment','Due date','Basis','Include?','Economic inputs','Operating handoff'];
hdr(i,'C6:AD6',headers);i.getRange('C6:AD6').format.rowHeight=50;
i.getRange('C1:C20').format.columnWidth=11;i.getRange('D1:D20').format.columnWidth=27;i.getRange('E1:E20').format.columnWidth=14;i.getRange('F1:Q20').format.columnWidth=16;
i.getRange('R1:Y20').format.columnWidth=29;i.getRange('Z1:Z20').format.columnWidth=14;i.getRange('AA1:AD20').format.columnWidth=22;
const rows=[
 ['S01','Cross-sell existing customers','Revenue',1200,.4,0,100,250,50,80,7,12,.6,.25,1,'Chief revenue officer','Pilot shared account plans','CRM and account ownership','Account overlap and churn','Assumption: test customer overlap','Confirm pilot conversion','Investigate','Protect',new Date('2026-12-31'), 'Assumption','Yes'],
 ['S02','Combine vendor contracts','Cost',0,0,600,0,120,0,0,1,6,.9,.25,1,'Chief operating officer','Confirm service levels before cutover','Vendor exits and continuity','Service interruption','Assumption: review contracts','Confirm termination charges','Price','Combine',new Date('2026-12-31'),'Assumption','Yes'],
 ['S03','Consolidate finance systems','Cost',0,0,350,60,300,150,20,10,9,.8,.25,.5,'Chief financial officer','Parallel close before migration','Billing and collections','Invoice errors delay collections','Assumption: scope migration','Confirm migration and retention cost','Protect','Standardize',new Date('2027-03-31'),'Assumption','Yes'],
];
for(let z=3;z<10;z++){const r=Array(26).fill(null);r[0]=`S${String(z+1).padStart(2,'0')}`;r[24]='Assumption';r[25]='No';rows.push(r);}
i.getRange('C7:AB16').values=rows;i.getRange('C7:AB16').format.fill=amber;i.getRange('F7:Q16').format.font.color=blue;i.getRange('F7:Q16').setNumberFormat(num);
for(const cc of ['G','O','P','Q'])i.getRange(`${cc}7:${cc}16`).setNumberFormat(pct);
i.getRange('M7:N16').setNumberFormat('0');i.getRange('Z7:Z16').setNumberFormat('mm/dd/yy');i.getRange('D7:AB16').format.wrapText=true;i.getRange('C7:AD16').format.rowHeight=65;
i.getRange('AB7:AB16').dataValidation={rule:{type:'list',values:['Yes','No']}};i.getRange('X7:X16').dataValidation={rule:{type:'list',values:['Investigate','Price','Protect','Walk']}};i.getRange('Y7:Y16').dataValidation={rule:{type:'list',values:['Preserve','Protect','Standardize','Combine','Retire']}};
for(let r=7;r<=16;r++){
 f(i,`AC${r}`,`=IF(AB${r}="No","Excluded",IF(AB${r}<>"Yes","Invalid inclusion",IF(OR(COUNTIFS($C$7:$C$16,C${r})<>1,COUNTIFS('Cash Flow'!$L$7:$L$16,C${r})<>1),"Invalid ID",IF(OR(COUNT(F${r}:Q${r})<>12,MIN(F${r}:Q${r})<0,G${r}>1,O${r}>1,P${r}>1,Q${r}>1,M${r}<1,MOD(M${r},1)<>0,MOD(N${r},1)<>0),"Unpriced inputs","Complete"))))`);
 f(i,`AD${r}`,`=IF(AB${r}="No","Excluded",IF(OR(COUNTBLANK(R${r}:AA${r})>0,COUNTBLANK(D${r}:E${r})>0),"Missing owner / action / evidence",IF(X${r}="Walk","Walk",IF(W${r}<>"None","Open finding","Complete"))))`);
}warn(i,'AC7:AD16');
const initiativeTable=i.tables.add('C6:AD16',true,'SynergyInitiatives');initiativeTable.style='TableStyleLight1';initiativeTable.showFilterButton=true;i.freezePanes.freezeRows(6);i.freezePanes.freezeColumns(4);
note(i,'C19','Start month 1 means capture starts at close. Ramp 0 means immediate full run rate at the start month.');
note(i,'C20','Annual dis-synergies start at close and remain fully funded throughout the five-year forecast.');

// The same five-year build recalculates for the authoritative case selection.
note(c,'C3','USD thousands. Year-end discounting. At-close spend. No terminal value or capital recovery.');
hdr(c,'C6:J6',['Incremental economics','At close','Year 1','Year 2','Year 3','Year 4','Year 5','5-year PV']);
c.getRange('D5:I5').values=[[0,1,2,3,4,5]];c.getRange('D5:I5').format.font.color=muted;
const sumlabels=['Gross synergy before probability','Risk-adjusted synergy before dis-synergies','Dis-synergies','Cash tax expense / (benefit)','Implementation cash, after tax','Capital and working capital','Net incremental cash','Discounted incremental cash'];
sumlabels.forEach((x,k)=>v(c,`C${7+k}`,x));
v(c,'C17','Included initiatives');f(c,'D17',`=COUNTIFS('Initiatives'!AB7:AB16,"Yes")`);
v(c,'C18','Unpriced included initiatives');f(c,'D18',`=COUNTIFS('Initiatives'!AB7:AB16,"Yes",'Initiatives'!AC7:AC16,"<>Complete")+COUNTIFS('Initiatives'!AB7:AB16,"<>Yes",'Initiatives'!AB7:AB16,"<>No")`);
v(c,'C19','Operating findings still open');f(c,'D19',`=COUNTIFS('Initiatives'!AB7:AB16,"Yes",'Initiatives'!AD7:AD16,"<>Complete")`);
v(c,'C20','Walk decisions');f(c,'D20',`=COUNTIFS('Initiatives'!AB7:AB16,"Yes",'Initiatives'!X7:X16,"Walk")`);
v(c,'C21','Pricing prerequisites');f(c,'D21',`=IF('Assumptions'!D42<>"Complete","Missing / invalid assumptions",IF(D18>0,"Unpriced initiatives",IF(D17=0,"No included initiatives","Complete")))`);
warn(c,'D21');
v(c,'L6','Stable build ID');v(c,'M6','Input row');v(c,'N6','Economic inputs');v(c,'O6','Net synergy NPV');v(c,'P6','Year 1 net cash');
c.getRange('L6:P16').format.columnWidth=19;
const starts=[];
for(let n=0;n<10;n++){
 const key=`S${String(n+1).padStart(2,'0')}`,rr=7+n,b=25+n*18;starts.push(b);
 v(c,`L${rr}`,key);f(c,`M${rr}`,`=IF(COUNTIFS('Initiatives'!$C$7:$C$16,L${rr})=1,MATCH(L${rr},'Initiatives'!$C$7:$C$16,0),0)`);
 f(c,`N${rr}`,`=IF(M${rr}=0,"Invalid ID",INDEX('Initiatives'!$AC$7:$AC$16,M${rr}))`);
 const get=(cc)=>`INDEX('Initiatives'!$${cc}$7:$${cc}$16,$M$${rr})`;
 v(c,`C${b}`,key);f(c,`D${b}`,`=IF($M$${rr}=0,"Invalid ID",${get('D')})`);c.getRange(`C${b}:J${b}`).format.fill='#F7F5F0';c.getRange(`C${b}:J${b}`).format.font.bold=true;
 const labels=['Capture fraction','Revenue contribution','Cost savings','Gross synergy','Risk-adjusted synergy','Dis-synergies','Net operating benefit','Cash tax expense / (benefit)','Implementation cash, after tax','Capex','Working capital','Net incremental cash','Discounted incremental cash'];
 labels.forEach((x,k)=>v(c,`C${b+k+1}`,x));
 for(let q=4;q<=9;q++){
  const cc=col(q),ac=col(q+1),yr=q-4;
  const gate=(expr)=>`=IF($N$${rr}="Excluded",0,IF(OR($N$${rr}<>"Complete",'Assumptions'!$D$42<>"Complete"),"n.a.",${expr}))`;
  const elapsed=(m)=>`MAX(0,${m}-(${get('M')}-1+'Assumptions'!$E$34))`;
  const area=(m)=>`IF(${get('N')}=0,${elapsed(m)},MIN(${elapsed(m)},${get('N')})^2/(2*MAX(1,${get('N')}))+MAX(0,${elapsed(m)}-${get('N')}))`;
  f(c,`${cc}${b+1}`,gate(yr===0?'0':`(${area(yr*12)}-${area((yr-1)*12)})/12`));
  f(c,`${cc}${b+2}`,gate(`${cc}${b+1}*${get('F')}*${get('G')}*'Assumptions'!${ac}$16`));
  f(c,`${cc}${b+3}`,gate(`${cc}${b+1}*${get('H')}*'Assumptions'!${ac}$19`));
  f(c,`${cc}${b+4}`,gate(`SUM(${cc}${b+2}:${cc}${b+3})`));
  f(c,`${cc}${b+5}`,gate(`${cc}${b+4}*MIN(1,${get('O')}*'Assumptions'!${ac}$25)`));
  f(c,`${cc}${b+6}`,gate(yr===0?'0':`${get('I')}*'Assumptions'!${ac}$22`));
  f(c,`${cc}${b+7}`,gate(`${cc}${b+5}-${cc}${b+6}`));
  f(c,`${cc}${b+8}`,gate(`(MAX(0,${cc}${b+7})-MAX(0,-${cc}${b+7})*'Assumptions'!$D$10)*${get('P')}`));
  f(c,`${cc}${b+9}`,gate(yr===0?`${get('J')}*'Assumptions'!$E$28*(1-${get('P')}*${get('Q')}*'Assumptions'!$D$10)`:'0'));
  f(c,`${cc}${b+10}`,gate(yr===0?`${get('K')}*'Assumptions'!$E$31`:'0'));
  f(c,`${cc}${b+11}`,gate(yr===0?`${get('L')}*'Assumptions'!$E$31`:'0'));
  f(c,`${cc}${b+12}`,gate(`${cc}${b+7}-${cc}${b+8}-SUM(${cc}${b+9}:${cc}${b+11})`));
  f(c,`${cc}${b+13}`,gate(`${cc}${b+12}/(1+'Assumptions'!$D$11)^${cc}$5`));
 }
 f(c,`J${b+13}`,`=IF(COUNT(D${b+13}:I${b+13})=6,SUM(D${b+13}:I${b+13}),"n.a.")`);
 f(c,`O${rr}`,`=J${b+13}`);f(c,`P${rr}`,`=E${b+12}`);
 c.getRange(`D${b+1}:I${b+1}`).setNumberFormat(pct);c.getRange(`C${b+12}:J${b+13}`).format.font.bold=true;
}
const offsets=[4,5,6,8,9,null,12,13];
for(let q=4;q<=9;q++){const cc=col(q);for(let k=0;k<8;k++){
 let refs=starts.flatMap(b=>k===5?[`${cc}${b+10}`,`${cc}${b+11}`]:[`${cc}${b+offsets[k]}`]);
 f(c,`${cc}${7+k}`,`=IF($D$21<>"Complete","n.a.",SUM(${refs.join(',')}))`);
} }
f(c,'J14','=IF(COUNT(D14:I14)=6,SUM(D14:I14),"n.a.")');
c.getRange('D7:J204').setNumberFormat(num);for(const b of starts)c.getRange(`D${b+1}:I${b+1}`).setNumberFormat(pct);
c.getRange('C7:C14').format.wrapText=true;c.getRange('C7:J14').format.rowHeight=32;c.getRange('C13:J14').format.font.bold=true;c.freezePanes.freezeRows(6);c.freezePanes.freezeColumns(3);

// Dashboard value bridge. Economic value and negotiated offer are distinct outputs.
band(d,'C6:J6','Value bridge (USD thousands)');
const dl=[['Standalone enterprise value',"='Assumptions'!D7"],['Net buyer-created synergy NPV',"='Cash Flow'!J14"],['Maximum economics-supported EV','=IF(COUNT(F7:F8)=2,F7+F8,"n.a.")'],['Seller share of positive net synergy',"=IF(AND(ISNUMBER(F8),'Assumptions'!D42=\"Complete\"),MAX(0,F8)*'Assumptions'!D8,\"n.a.\")"],['Offer supported by seller-sharing policy','=IF(COUNT(F7:F8,F10)=3,F7+MIN(0,F8)+F10,"n.a.")'],['Private affordability ceiling',"=IF(ISNUMBER('Assumptions'!D9),'Assumptions'!D9,\"n.a.\")"],['Maximum supported purchase price (EV)','=IF(AND(COUNT(F11:F12,F15)=3,F12>=0,F15>=0),MIN(F11,F12,F15),"n.a.")'],['Buyer-retained net synergy value','=IF(COUNT(F8,F10)=2,MAX(0,F8)-F10,"n.a.")']];
dl.forEach(([l,fo],k)=>{v(d,`C${7+k}`,l);f(d,`F${7+k}`,fo);});
d.getRange('C7:E14').merge(true);d.getRange('C7:F14').format.rowHeight=29;d.getRange('C7:E14').format.wrapText=true;d.getRange('F7:F14').setNumberFormat(num);d.getRange('C13:F13').format.fill='#F7F5F0';d.getRange('C13:F13').format.font.bold=true;
v(d,'C15','Private hard ceiling (EV)');f(d,'F15',"=IF(ISNUMBER('Assumptions'!D13),'Assumptions'!D13,\"n.a.\")");d.getRange('C15:E15').merge();d.getRange('F15').setNumberFormat(num);
v(d,'H7','Pricing status');f(d,'H8',`=IF('Cash Flow'!D21<>"Complete",'Cash Flow'!D21,IF(NOT(ISNUMBER('Assumptions'!D9)),"Missing affordability ceiling",IF(OR('Assumptions'!D9<0,NOT(ISNUMBER('Assumptions'!D13)),'Assumptions'!D13<0),"Missing / invalid hard ceiling",IF('Cash Flow'!D20>0,"Walk decision remains",IF(OR('Cash Flow'!D19>0,'Assumptions'!D12=""),"Resolve findings / authority","Ready for decision")))))`);d.getRange('H8:J10').merge();d.getRange('H8:J10').format.wrapText=true;warn(d,'H8');
v(d,'H12','Unpriced initiatives');f(d,'J12',"='Cash Flow'!D18");v(d,'H13','Open handoffs');f(d,'J13',"='Cash Flow'!D19");
note(d,'C16','Buyer-created value can inform affordability. It does not automatically belong to the seller.');
note(d,'C17','Enter the private ceiling after testing financing and combined downside. Any calculated price remains subject to open findings.');
band(d,'C19:J19','First pass in 10–15 minutes');
v(d,'C20','1. Set standalone value, sharing policy and Base / Downside assumptions.');v(d,'C21','2. Replace the three examples in Initiatives. Add owner, action, dependency and missing inputs.');v(d,'C22','3. Switch to Downside. Review cash outlay, lost revenue and the resulting price ceiling.');v(d,'C23','4. Resolve each finding as Investigate, Price, Protect or Walk. Transfer owned actions into Delivery.');
band(d,'C25:J25','Cash required and value delivered');
hdr(d,'C26:I26',['USD thousands','At close','Year 1','Year 2','Year 3','Year 4','Year 5']);
v(d,'C27','Net incremental cash');v(d,'C28','Risk-adjusted benefit');v(d,'C29','Dis-synergies');
for(let q=4;q<=9;q++){let cc=col(q);f(d,`${cc}27`,`='Cash Flow'!${cc}13`);f(d,`${cc}28`,`='Cash Flow'!${cc}8`);f(d,`${cc}29`,`='Cash Flow'!${cc}9`);}d.getRange('D27:I29').setNumberFormat(num);
band(d,'C32:J32','Sensitivity: discount rate and seller share');
note(d,'C33','Offer under the sharing policy, before the private affordability cap. Active cash flows are rediscounted.');
hdr(d,'C35:I35',['Discount rate','Synergy NPV','0% share','25% share','50% share','75% share','100% share']);
d.getRange('E34:I34').values=[[0,.25,.5,.75,1]];d.getRange('E34:I34').setNumberFormat(pct);
for(let rr=36;rr<=40;rr++){f(d,`C${rr}`,`=IF(ISNUMBER('Assumptions'!D11),MAX(0,'Assumptions'!D11+${(rr-38)*.02}),"n.a.")`);f(d,`D${rr}`,`=IF(AND(ISNUMBER(C${rr}),COUNT('Cash Flow'!D13:I13)=6),'Cash Flow'!D13+NPV(C${rr},'Cash Flow'!E13:I13),"n.a.")`);for(let q=5;q<=9;q++)f(d,`${col(q)}${rr}`,`=IF(COUNT($F$7,$D${rr})=2,$F$7+MIN(0,$D${rr})+MAX(0,$D${rr})*${col(q)}$34,"n.a.")`);}
d.getRange('C36:C40').setNumberFormat(pct);d.getRange('D36:I40').setNumberFormat(num);d.getRange('E36:I40').conditionalFormats.add('colorScale',{colors:['#F7F5F0','#FFFFFF','#CEC9BC'],thresholds:['min',{type:'percentile',value:50},'max']});
note(d,'C42','Assumption examples. Version 1.0. Updated September 10, 2026.');
band(d,'C44:J44','Proposed price review (enterprise value)');
v(d,'C45','Proposed purchase price');f(d,'F45',`=IF(AND(ISNUMBER('Assumptions'!D14),'Assumptions'!D14>=0),'Assumptions'!D14,"n.a.")`);
v(d,'C46','Buyer value retained at proposed price');f(d,'F46','=IF(COUNT(F9,F45)=2,F9-F45,"n.a.")');
v(d,'C47','Headroom to maximum supported price');f(d,'F47','=IF(COUNT(F13,F45)=2,F13-F45,"n.a.")');
v(d,'C48','Bid decision');f(d,'F48','=IF(COUNT(F13,F45)<>2,"Missing price / ceiling",IF(F45>F13,"Above supported price","Within price ceiling"))');
d.getRange('C45:E48').merge(true);d.getRange('F45:F47').setNumberFormat(num);d.getRange('F48:J48').merge();d.getRange('F47').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}}});warn(d,'F48');
d.getRange('C6:J42').format.font.color=ink;d.getRange('H4').format.font.color=blue;for(const r of [6,19,25,26,32,35])d.getRange(`C${r}:J${r}`).format.font.color='#FFFFFF';

// Actual benefits and costs remain keyed to initiative and relative year, including close.
note(t,'C3','USD thousands. Year 0 = close. Enter actual benefits and all cash costs separately. Positive variances are favorable.');
hdr(t,'C6:P6',['ID','Year','Initiative','Operating owner','Planned benefit','Actual benefit','Benefit variance','Planned cash cost','Actual cash cost','Cost variance','Planned net cash','Actual net cash','Net variance','Next action / decision']);
t.getRange('C1:D72').format.columnWidth=10;t.getRange('E1:F72').format.columnWidth=27;t.getRange('G1:O72').format.columnWidth=16;t.getRange('P1:P72').format.columnWidth=36;
for(let n=0;n<10;n++)for(let year=0;year<=5;year++){
 const r=7+n*6+year;v(t,`C${r}`,`S${String(n+1).padStart(2,'0')}`);v(t,`D${r}`,year);
 const match=`MATCH($C${r},'Initiatives'!$C$7:$C$16,0)`;
 for(const [dest,src] of [['E','D'],['F','R']])f(t,`${dest}${r}`,`=IF(COUNTIFS('Initiatives'!$C$7:$C$16,$C${r})<>1,"Invalid ID",IF(INDEX('Initiatives'!$AB$7:$AB$16,${match})="No","Excluded",IF(INDEX('Initiatives'!$${src}$7:$${src}$16,${match})="","Missing input",INDEX('Initiatives'!$${src}$7:$${src}$16,${match}))))`);
 const row=`(MATCH($C${r},'Cash Flow'!$L$7:$L$16,0)-1)*18`;
 const get=(offset)=>`INDEX('Cash Flow'!$D$25:$I$204,${row}+${offset+1},$D${r}+1)`;
 f(t,`G${r}`,`=${get(5)}`);f(t,`M${r}`,`=${get(12)}`);
 f(t,`J${r}`,`=IF(COUNT(G${r},M${r})=2,G${r}-M${r},"n.a.")`);
 for(const cc of ['H','K','P'])input(t,`${cc}${r}`,null);
 f(t,`I${r}`,`=IF(COUNT(G${r}:H${r})=2,H${r}-G${r},"n.a.")`);
 f(t,`L${r}`,`=IF(COUNT(J${r}:K${r})=2,J${r}-K${r},"n.a.")`);
 f(t,`N${r}`,`=IF(COUNT(H${r},K${r})=2,H${r}-K${r},"n.a.")`);
 f(t,`O${r}`,`=IF(COUNT(M${r}:N${r})=2,N${r}-M${r},"n.a.")`);
}
t.getRange('G7:O66').setNumberFormat(num);t.getRange('C7:P66').format.rowHeight=38;t.getRange('E7:F66').format.wrapText=true;const deliveryTable=t.tables.add('C6:P66',true,'SynergyDelivery');deliveryTable.style='TableStyleLight1';deliveryTable.showFilterButton=true;t.freezePanes.freezeRows(6);t.freezePanes.freezeColumns(4);
note(t,'C69','Benefits are incremental contribution profit plus cost savings. Costs include dis-synergies, cash taxes, implementation and capital.');
note(t,'C70','Blank actuals mean not reported. Zero is a reported zero. Preserve a dated approved baseline before changing underwriting.');
note(t,'C71','Sort the full table. Each initiative ID and relative year must stay with its actuals and next action.');

heading(g,'C2','How to use the value bridge');
const guide=[
 ['The decision','Separate standalone value from the cash the buyer can create. Establish a private maximum price before negotiations change the standard.'],
 ['Start with three initiatives','Replace the examples with your largest cost saving, revenue opportunity and integration risk. Keep unused slots set to No. Never delete or rename S01–S10.'],
 ['Required information','Annual revenue and contribution margin, cost savings, recurring dis-synergies, implementation cost, capital, timing, probability and tax assumptions. Each included initiative needs an owner, action, workflow, evidence and a visible finding.'],
 ['Unknowns are findings','Blank or invalid economic inputs withhold the aggregate cash forecast and price outputs. An explicit zero is accepted. Open findings remain visible even after numbers are entered. Enter None only when the operating owner has resolved the finding.'],
 ['Gross and risk-adjusted synergy','Gross synergy is incremental contribution profit plus cost savings after the timing ramp. Risk-adjusted synergy applies the benefit probability and active scenario multiplier. Revenue is converted using contribution margin before it enters value.'],
 ['Timing','Start month 1 is close. Benefits rise linearly over Ramp months. Annual capture is the exact area under that continuous ramp during each 12-month period. A zero ramp starts at full run rate. Downside delay uses the At close input.'],
 ['Dis-synergies and required spend','Recurring lost profit or extra operating cost starts at close and runs through all five forecast years. Implementation, capex and incremental working capital are fully funded at close, even if the benefit fails. Do not probability-weight these commitments.'],
 ['Cash taxes','Positive operating benefit pays the initiative tax rate. A loss creates a cash tax benefit only when the global usability input is 1. The same input permits the deductible portion of implementation cost to reduce tax at close. Default 0 assumes no usable immediate shield.'],
 ['Capital and valuation','Capex and working capital are separate cash outlays. No depreciation shield, working-capital release or terminal value is assumed. Net present value discounts Year 1–5 cash at year end and includes close cash without discount.'],
 ['Price bridge','Economics-supported EV equals standalone EV plus net synergy NPV. The sharing-policy offer includes all negative synergy and only the negotiated share of positive synergy. Maximum supported price is the lowest of that offer, an independent affordability limit and a private hard ceiling.'],
 ['What the number does not establish','This is an incremental synergy model. It does not calculate debt service, lender capacity, standalone operating downside, equity value, or a formal valuation. Determine financing and downside survivability before entering the private ceiling.'],
 ['Scenario and sensitivity','One Base / Downside selector changes the same forecast. The sensitivity grid rediscounts that active forecast at five rates and applies five seller shares. It does not change operations or apply the private affordability cap.'],
 ['Protect revenue while integrating cost','Test billing, collections, customer ownership and service continuity before systems or headcount are combined. A cost saving that disrupts the workflow producing revenue can destroy the thesis.'],
 ['Handoff and realization','Use Investigate, Price, Protect or Walk for every issue. Record actual benefits and all cash costs by fixed ID and year in Delivery. Net cash and variances calculate automatically. Sort whole tables so the ID and year stay with actuals and actions.'],
 ['Ten initiative slots','The model supports S01–S10. Fill an unused slot and set Include to Yes. More than 10 initiatives requires extending the build and delivery formulas together. Keep separate initiatives free of overlapping benefits or duplicated costs.'],
 ['Decision gate','An economic ceiling is provisional while findings, a Walk decision or approval authority remain unresolved. Move approved actions into the integration plan and re-underwrite when evidence changes.'],
];
g.getRange('C1:C55').format.columnWidth=32;g.getRange('D1:J55').format.columnWidth=14;
guide.forEach(([title,body],n)=>{const r=7+n*3;v(g,`C${r}`,title);g.getRange(`C${r}`).format.font.bold=true;g.getRange(`C${r}:C${r+1}`).merge();g.getRange(`C${r}:C${r+1}`).format.wrapText=true;g.getRange(`D${r}:J${r+1}`).merge();v(g,`D${r}`,body);g.getRange(`D${r}:J${r+1}`).format.wrapText=true;g.getRange(`C${r}:J${r+1}`).format.rowHeight=24;});

// Terminal checks observe the business logic; outputs never read these checks.
band(g,'C57:J57','Model checks');
v(g,'C58','NPV bridge difference');f(g,'D58',`=IF(COUNT('Cash Flow'!D13:I13)=6,'Cash Flow'!J14-('Cash Flow'!D13+NPV('Assumptions'!D11,'Cash Flow'!E13:I13)),"n.a.")`);
v(g,'C59','Sensitivity center NPV difference');f(g,'D59',`=IF(COUNT('Dashboard'!D38,'Cash Flow'!J14)=2,'Dashboard'!D38-'Cash Flow'!J14,"n.a.")`);
v(g,'C60','Input ID count');f(g,'D60','=COUNTA(\'Initiatives\'!C7:C16)');v(g,'C61','Numeric cash forecast periods');f(g,'D61',"=COUNT('Cash Flow'!D13:I13)");
g.getRange('D58:D61').format.font.color=ink;g.getRange('D58:D59').setNumberFormat('0.00;(0.00);0.00');g.getRange('D58:D59').conditionalFormats.addCustom('ABS(D58)>0.01',{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}});
note(g,'C64','Version 1.0. Updated September 10, 2026. Assumption examples. MikeYe.com.');

wb.recalculate();
const val=(s,cell)=>sheets[s].getRange(cell).values[0][0];
const assertions=[];
function assert(name,ok,actual){if(!ok)throw new Error(`${name}: ${JSON.stringify(actual)}`);assertions.push({name,passed:true,actual});}
const sampleNPV=val('Cash Flow','J14');
assert('Base NPV is numeric',typeof sampleNPV==='number',sampleNPV);
// Independent numerical integration of the example's monthly ramp, outside spreadsheet formulas.
let independentNPV=0;
for(const row of rows.slice(0,3)){
 let pv=-(row[7]+row[8]+row[9]);
 for(let year=1;year<=5;year++){
  let captured=0;for(let step=0;step<1200;step++){const month=(year-1)*12+(step+.5)/100;const elapsed=Math.max(0,month-(row[10]-1));captured+=(row[11]===0?(elapsed>0?1:0):Math.min(1,elapsed/row[11]))/1200;}
  const benefit=(row[3]*row[4]+row[5])*captured*row[12]-row[6];
  pv+=(benefit-Math.max(0,benefit)*row[13])/Math.pow(1.12,year);
 }independentNPV+=pv;
}
assert('Independent ramp and cash model agrees',Math.abs(independentNPV-sampleNPV)<.001,independentNPV);
assert('Missing private ceiling withholds supported price',val('Dashboard','F13')==='n.a.',val('Dashboard','F13'));
input(a,'D9',25000);input(a,'D13',25000);assert('Zero seller share offers standalone EV',Math.abs(val('Dashboard','F13')-20000)<1e-8,val('Dashboard','F13'));
input(a,'D8',.25);assert('Positive seller sharing flows to supported price',Math.abs(val('Dashboard','F13')-(20000+sampleNPV*.25))<1e-7,val('Dashboard','F13'));
input(d,'H4','Downside');const downside=val('Cash Flow','J14');assert('Downside reduces synergy NPV',typeof downside==='number'&&downside<sampleNPV,downside);
input(d,'H4','Base');const oldLate=val('Assumptions','J17');input(a,'J17',.2);assert('Later-year assumption updates build',val('Cash Flow','J14')<sampleNPV,val('Cash Flow','J14'));input(a,'J17',oldLate);
input(a,'J18',null);assert('Blank unselected case does not block Base',typeof val('Cash Flow','J14')==='number',val('Cash Flow','J14'));input(d,'H4','Downside');assert('Selecting missing case withholds forecast',val('Cash Flow','J14')==='n.a.',val('Cash Flow','J14'));input(a,'J18',.75);input(d,'H4','Base');
input(i,'F7',null);assert('Blank economic input remains unpriced',val('Initiatives','AC7')==='Unpriced inputs'&&val('Dashboard','F13')==='n.a.',val('Initiatives','AC7'));input(i,'F7',0);assert('Explicit zero accepted',val('Initiatives','AC7')==='Complete',val('Initiatives','AC7'));input(i,'F7',1200);
input(i,'C8','S01');assert('Duplicate ID rejected',val('Cash Flow','J14')==='n.a.',val('Cash Flow','J14'));input(i,'C8','S02');
input(i,'M7',61);assert('Start outside horizon gives no revenue benefit',val('Cash Flow','I27')===0,val('Cash Flow','I27'));input(i,'M7',7);
input(i,'N8',0);assert('Zero ramp gives full first-year cost capture',Math.abs(val('Cash Flow','E44')-1)<1e-8,val('Cash Flow','E44'));input(i,'N8',6);
const emptySlot=i.getRange('C10:AB10').values;const fourth=[...rows[1]];fourth[0]='S04';i.getRange('C10:AB10').values=[fourth];assert('Fourth initiative flows into aggregate',Math.abs(val('Cash Flow','J14')-sampleNPV-val('Cash Flow','O8'))<1e-7,val('Cash Flow','J14'));i.getRange('C10:AB10').values=emptySlot;
input(i,'R7',null);input(i,'W7','None');assert('Resolved finding cannot hide missing owner',val('Initiatives','AD7')==='Missing owner / action / evidence',val('Initiatives','AD7'));input(i,'R7',rows[0][15]);input(i,'W7',rows[0][20]);
input(t,'H7',0);assert('One reported actual cannot establish net cash',val('Delivery','N7')==='n.a.',val('Delivery','N7'));input(t,'K7',400);assert('Actual net cash deducts cost and exposes overrun',val('Delivery','N7')===-400&&val('Delivery','O7')===-20,[val('Delivery','N7'),val('Delivery','O7')]);input(t,'K7',0);assert('Zero actual accepted',val('Delivery','N7')===0,val('Delivery','N7'));input(t,'H7',null);input(t,'K7',null);
input(i,'I7',5000);input(a,'D8',0);assert('Negative synergy reduces zero-share offer',val('Dashboard','F11')<20000,val('Dashboard','F11'));input(i,'I7',100);
input(a,'D10',1);assert('Usable tax shield increases NPV',val('Cash Flow','J14')>sampleNPV,val('Cash Flow','J14'));input(a,'D10',0);
// Swap entire input records to simulate a supported table sort; the ID joins must survive.
const first=i.getRange('C7:AB7').values,second=i.getRange('C8:AB8').values;i.getRange('C7:AB7').values=second;i.getRange('C8:AB8').values=first;
assert('ID join survives input row reorder',val('Delivery','E7')==='Cross-sell existing customers'&&Math.abs(val('Cash Flow','J14')-sampleNPV)<1e-7,val('Delivery','E7'));
i.getRange('C7:AB7').values=first;i.getRange('C8:AB8').values=second;
input(a,'D13',19000);input(a,'D14',20000);assert('Private hard ceiling constrains bid',val('Dashboard','F13')===19000&&val('Dashboard','F48')==='Above supported price',[val('Dashboard','F13'),val('Dashboard','F48')]);assert('Buyer retained value at proposed EV uses economic value',Math.abs(val('Dashboard','F46')-sampleNPV)<1e-7,val('Dashboard','F46'));
input(a,'D9',null);input(a,'D13',null);input(a,'D14',null);input(a,'D8',0);wb.recalculate();
assert('Final Base restored',Math.abs(val('Cash Flow','J14')-sampleNPV)<1e-7,val('Cash Flow','J14'));
assert('Cash and sensitivity checks reconcile',Math.abs(val('Guide','D58'))<.01&&Math.abs(val('Guide','D59'))<.01,[val('Guide','D58'),val('Guide','D59')]);
const errorScan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Formula errors'});
await fs.writeFile(`${out}/qa.json`,JSON.stringify({sampleNPV,downside,assertions,errorScan:errorScan.ndjson,dashboard:d.getRange('C7:J14').values,cash:c.getRange('C7:J14').values},null,2));
console.log(JSON.stringify({sampleNPV,downside,tests:assertions.length,errors:errorScan.ndjson}));
const renders=[['Dashboard','C2:J48','dashboard'],['Assumptions','C2:J42','assumptions'],['Cash Flow','C2:J39','cash-flow'],['Cash Flow','C187:J204','cash-flow-last'],['Initiatives','C2:Q16','initiatives-economics'],['Initiatives','R6:AD16','initiatives-handoff'],['Delivery','C2:P24','delivery'],['Delivery','C60:P71','delivery-last'],['Guide','C2:J32','guide-1'],['Guide','C34:J64','guide-2']];
for(const [sheetName,range,slug] of renders){if(process.env.SYNERGY_RENDER_ONLY&&!process.env.SYNERGY_RENDER_ONLY.split(',').includes(slug))continue;const image=await wb.render({sheetName,range,scale:1.5,format:'png'});await fs.writeFile(`${out}/${slug}.png`,new Uint8Array(await image.arrayBuffer()));}
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(`${out}/synergy-underwriting-value-bridge.xlsx`);
console.log('Exported '+`${out}/synergy-underwriting-value-bridge.xlsx`);
