import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
// Run a copy in an OS temporary directory linked to the primary runtime modules.
const out=process.env.LOI_OUTPUT_DIR||'/workspace/scratch/c919f721831d/outputs/loi';
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create(), names=['Dashboard','Assumptions','Economics','Contingencies','Conditions','Guide'];
const ss=Object.fromEntries(names.map(x=>[x,wb.worksheets.add(x)]));
const [d,a,e,c,r,g]=names.map(x=>ss[x]);
const ink='#1A1A18',forest='#173D34',gold='#79602E',paper='#F7F5F0',line='#CEC9BC',amber='#FFF3CD';
const num='#,##0.0;(#,##0.0);"–"',pct='0.0%;(0.0%);"–"',date='mm/dd/yy';
const v=(s,p,x)=>s.getRange(p).values=[[x]];
function f(s,p,x){s.getRange(p).formulas=[[x]];s.getRange(p).format.font.color=s===d?ink:x.includes('!')?'#00804A':'#000000';}
function input(s,p,x){v(s,p,x);s.getRange(p).format.fill=amber;s.getRange(p).format.font.color=typeof x==='number'?'#0000FF':ink;}
function note(s,p,x){v(s,p,x);s.getRange(p).format.font={name:'Arial',size:10,color:'#5C5C54',italic:true};}
function band(s,p,x){v(s,p.split(':')[0],x);s.getRange(p).format.fill=forest;s.getRange(p).format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};}
function header(s,p,x){s.getRange(p).values=[x];s.getRange(p).format={fill:forest,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:40};}
function warn(s,p){for(const t of ['Missing','Invalid','Open','Walk','Above','Gap','Expired','Extend'])s.getRange(p).conditionalFormats.add('containsText',{text:t,format:{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}}});}
function list(s,p,values){s.getRange(p).dataValidation={rule:{type:'list',values}};}
for(const [name,s] of Object.entries(ss)){
 s.showGridLines=false;s.getRange('A1:O100').format.font={name:'Arial',size:10,color:ink};s.getRange('A1:O100').format.rowHeight=24;
 s.getRange('A1:B100').format.columnWidth=2.5;s.getRange('C1:C100').format.columnWidth=43;s.getRange('D1:D100').format.columnWidth=20;s.getRange('E1:E100').format.columnWidth=3;
 s.getRange('F1:J100').format.columnWidth=16;s.getRange('C1:O100').format.verticalAlignment='center';
 v(s,'C2',name==='Dashboard'?'LOI Economics & Risk Allocator':name);s.getRange('C2').format.font={name:'Arial',size:16,bold:true,color:ink};
 v(s,'G4','Case selected');if(s===d){input(s,'H4','Base');list(s,'H4',['Base','Downside']);}else f(s,'H4',"='Dashboard'!H4");
 s.getRange('H4').format.borders={preset:'outside',style:'dotted',color:gold};
}
d.tabColor=forest;a.tabColor=gold;g.tabColor=line;
note(d,'C3','USD thousands. How does the structure change price, cash, control and downside exposure?');
note(a,'C3','Assumption examples. USD thousands, except USD per share, dates and years.');
header(a,'C6:F6',['Core term','Assumption','','Meaning']);a.getRange('F1:F100').format.columnWidth=77;
const globals=[
 ['Headline enterprise value',20000,'Debt-free business value at the agreed NWC peg.'],
 ['Debt repaid at close',3000,'Deducted from seller equity and funded at close.'],
 ['Debt retained / assumed',1000,'Deducted from seller equity; retained debt is not a close cash use.'],
 ['Eligible excess cash',500,'Cash transferred and credited to seller; not reused as a funding source here.'],
 ['Working-capital peg',2000,'Normalized delivered NWC, excluding cash and debt already bridged.'],
 ['Stock reference allocation',4000,'Fixed equity allocated to buyer shares at the reference price.'],
 ['Seller rollover amount',2000,'Noncash reinvestment; separate from buyer stock.'],
 ['Funded escrow',1000,'Part of fixed cash; funded at close, restricted from seller.'],
 ['Unfunded holdback',500,'Part of fixed cash; paid later, without modeled interest.'],
 ['Annual discount rate',0.12,'Discount expected contingent cash and deferred holdback.'],
 ['Reference share price (USD)',50,'Used to lock shares under Fixed shares mode.'],
 ['Rollover issuer','Assumption: acquisition vehicle','Name the entity in which seller retains or receives an interest.'],
 ['Required cash into business',1000,'Additional close cash use, separate from eligible excess cash.'],
 ['Private EV ceiling',23000,'Same basis as EV including NWC and maximum entered contingencies.'],
 ['Review date',new Date('2026-09-10'),'Fixed as-of date. Update deliberately; no moving TODAY() assumption.'],
 ['Exclusivity start',new Date('2026-09-01'),'Calendar date; elapsed/remaining days exclude the starting day.'],
 ['Exclusivity end',new Date('2026-10-31'),'Negotiated end date; extension is a new decision.'],
 ['Buyer incremental daily cost',10,'Process cost per calendar day, separate from close fees and purchase price.'],
 ['Seller incremental daily cost',6,'Seller process cost per day; opportunity cost is described in Conditions.'],
 ['Stock pricing mode','Fixed shares','Fixed shares locks the reference share count; Fixed value locks value.'],
 ['Decision authority',null,'Enter the named person authorized to approve price and open risks.'],
 ['Holdback payment years',1,'Years from close; contractual nominal amount remains due.'],
 ['Rollover rights / control','Assumption: board and consent rights unresolved','Record governance, dilution, distributions and exit terms; amount is not voting control.'],
];
globals.forEach(([l,x,n],i)=>{let row=7+i;v(a,`C${row}`,l);input(a,`D${row}`,x);v(a,`F${row}`,n);});
a.getRange('C7:D29').format.wrapText=true;a.getRange('F7:F29').format.wrapText=true;a.getRange('C7:F29').format.rowHeight=35;
a.getRange('D7:D20').setNumberFormat(num);a.getRange('D16').setNumberFormat(pct);a.getRange('D17').setNumberFormat('0.00');a.getRange('D21:D23').setNumberFormat(date);a.getRange('D24:D25').setNumberFormat(num);a.getRange('D28').setNumberFormat('0.0');
list(a,'D26',['Fixed shares','Fixed value']);
header(a,'C32:F32',['Scenario driver','Active / case','','Assumption']);
const drivers=[['Delivered NWC',1900,1500],['Closing share price (USD)',50,35],['Buyer cash available',10000,8000],['New debt drawn at close',7000,5000],['Fees paid at close',500,800],['Expected close date',new Date('2026-10-15'),new Date('2026-11-30')]];
a.getRange('F33:F50').format.columnWidth=77;
drivers.forEach(([l,b,z],i)=>{const row=33+i*3;v(a,`C${row}`,l);v(a,`D${row}`,'Active');v(a,`D${row+1}`,'Base');v(a,`D${row+2}`,'Downside');input(a,`F${row+1}`,b);input(a,`F${row+2}`,z);f(a,`F${row}`,`=IF('Dashboard'!$H$4="Base",IF(ISNUMBER(F${row+1}),F${row+1},"Missing input"),IF('Dashboard'!$H$4="Downside",IF(ISNUMBER(F${row+2}),F${row+2},"Missing input"),"Invalid case"))`);a.getRange(`C${row}:F${row}`).format.fill=paper;a.getRange(`C${row}:F${row}`).format.font.bold=true;a.getRange(`F${row}:F${row+2}`).setNumberFormat(i===5?date:i===1?'0.00':num);});
v(a,'C53','Price inputs');f(a,'D53','=IF(OR(COUNT(D7:D16,D19,D28,F33)<>13,MIN(D7:D10,D12:D16,D19,D28)<0),"Missing / invalid price input",IF(AND(D26<>"Fixed shares",D26<>"Fixed value"),"Invalid stock mode",IF(D12=0,"Complete",IF(OR(NOT(ISNUMBER(F36)),F36<=0),"Missing / invalid closing price",IF(AND(D26="Fixed shares",OR(NOT(ISNUMBER(D17)),D17<=0)),"Missing / invalid reference price","Complete")))))');
v(a,'C54','Funding inputs');f(a,'D54','=IF(OR(COUNT(F39,F42,F45)<>3,MIN(F39,F42,F45)<0),"Missing / invalid funding input","Complete")');
v(a,'C55','Time inputs');f(a,'D55','=IF(OR(COUNT(D21:D25,F48)<>6,MIN(D21:D23,F48)<=0,MIN(D24:D25)<0,D23<D22,F48<D21),"Missing / invalid date or cost","Complete")');
warn(a,'D53:D55');a.freezePanes.freezeRows(6);

// Six contingent slots; active driver rows precede Base and Downside assumptions.
note(c,'C3','Assumption examples. Cash obligations only. Enter each commitment once; exclude escrow and holdback.');
note(c,'C4','Shaded rows select the active case.');
c.getRange('C1:C65').format.columnWidth=12;c.getRange('D1:D65').format.columnWidth=29;c.getRange('E1:E65').format.columnWidth=14;c.getRange('F1:I65').format.columnWidth=18;c.getRange('J1:J65').format.columnWidth=42;
header(c,'C6:J6',['Slot','Commitment','Include?','Contractual cap','Probability','Payout if triggered','Payment years','Definition / evidence']);
const contingencies=[['C01','Earnout','Yes',3000,.65,2400,2,'Assumption: revenue and EBITDA targets; accounting and seller influence unresolved',.85,3000,2],['C02','License milestone','Yes',1000,.4,1000,1,'Assumption: payment on transferable license renewal',.7,1000,1]];
while(contingencies.length<6){let n=contingencies.length+1;contingencies.push([`C0${n}`,null,'No',null,null,null,null,null,null,null,null]);}
for(let k=0;k<6;k++){
 const row=7+4*k, it=contingencies[k];v(c,`C${row}`,it[0]);input(c,`D${row}`,it[1]);input(c,`E${row}`,it[2]);input(c,`F${row}`,it[3]);input(c,`J${row}`,it[7]);v(c,`D${row+1}`,'Base');v(c,`D${row+2}`,'Downside');
 for(let q=0;q<3;q++){const cc=['G','H','I'][q];input(c,`${cc}${row+1}`,it[4+q]);input(c,`${cc}${row+2}`,it[8+q]);f(c,`${cc}${row}`,`=IF($E${row}="No",0,IF('Dashboard'!$H$4="Base",IF(ISNUMBER(${cc}${row+1}),${cc}${row+1},"Missing input"),IF('Dashboard'!$H$4="Downside",IF(ISNUMBER(${cc}${row+2}),${cc}${row+2},"Missing input"),"Invalid case")))`);}
 c.getRange(`C${row}:J${row}`).format.rowHeight=52;c.getRange(`D${row}:J${row}`).format.wrapText=true;c.getRange(`G${row}:I${row}`).format.fill=paper;c.getRange(`G${row}:G${row+2}`).setNumberFormat(pct);c.getRange(`F${row}:F${row+2}`).setNumberFormat(num);c.getRange(`H${row}:H${row+2}`).setNumberFormat(num);c.getRange(`I${row}:I${row+2}`).setNumberFormat('0.0');list(c,`E${row}`,['Yes','No']);
}
header(c,'C33:J33',['Slot','Commitment','Input status','Maximum cash','Expected cash','Expected PV','Unweighted tail','Definition finding']);
for(let k=0;k<6;k++){
 const q=7+k*4,row=34+k;v(c,`C${row}`,`C0${k+1}`);f(c,`D${row}`,`=IF(D${q}="","Unused",D${q})`);
 f(c,`E${row}`,`=IF(E${q}="No","Excluded",IF(E${q}<>"Yes","Invalid inclusion",IF(OR(COUNT(F${q}:I${q})<>4,MIN(F${q}:I${q})<0,G${q}>1,H${q}>F${q},D${q}=""),"Missing / invalid input","Complete")))`);
 const guard=x=>`=IF(E${row}="Excluded",0,IF(E${row}<>"Complete","n.a.",${x}))`;
 f(c,`F${row}`,guard(`F${q}`));f(c,`G${row}`,guard(`G${q}*H${q}`));f(c,`H${row}`,`=IF(E${row}="Excluded",0,IF(OR(E${row}<>"Complete",NOT(ISNUMBER('Assumptions'!D16)),'Assumptions'!D16<0),"n.a.",G${row}/(1+'Assumptions'!D16)^I${q}))`);f(c,`I${row}`,guard(`F${row}-G${row}`));f(c,`J${row}`,`=IF(E${row}="Excluded","Excluded",IF(J${q}="","Missing definition / evidence","Review Conditions"))`);
}
v(c,'D41','Total contingent cash');for(const cc of ['F','G','H','I'])f(c,`${cc}41`,`=IF(COUNT(${cc}34:${cc}39)=6,SUM(${cc}34:${cc}39),"n.a.")`);c.getRange('F34:I41').setNumberFormat(num);c.getRange('J34:J39').setNumberFormat('  @');c.getRange('D34:E39').format.wrapText=true;c.getRange('C34:J39').format.rowHeight=36;c.getRange('C41:J41').format.font.bold=true;warn(c,'E34:E39');
note(c,'C44','Expected = probability × payout if triggered. A zero probability never cancels the contractual cap.');
note(c,'C45','Caps are summed conservatively; mutually exclusive or linked payments require a negotiated combined cap.');
note(c,'C46','Maximum cash is not maximum total deal cost. Stock value, unmodeled liabilities and interest may add exposure.');
c.freezePanes.freezeRows(6);

// Conditions are an operating decision register, with closure prerequisites in the owning row.
note(r,'C3','Assumption examples. Replace role placeholders with named owners and evidence before advancing.');
r.getRange('C1:C24').format.columnWidth=10;r.getRange('D1:D24').format.columnWidth=22;r.getRange('E1:E24').format.columnWidth=11;r.getRange('F1:G24').format.columnWidth=14;r.getRange('H1:H24').format.columnWidth=24;r.getRange('I1:K24').format.columnWidth=35;r.getRange('L1:L24').format.columnWidth=14;r.getRange('M1:M24').format.columnWidth=13;r.getRange('N1:N24').format.columnWidth=35;r.getRange('O1:O24').format.columnWidth=26;
header(r,'C6:O6',['ID','Condition / risk','Required?','Risk bearer','Decision','Named owner','Evidence needed / obtained','Required action','Resolution / protection','Due date','Status','Buyer / seller consequence','Readiness']);
const riskrows=[
 ['R01','Financing availability','Yes','Buyer','Protect',null,'Executed commitment and draw conditions','Confirm amount, funding date and conditions',null,new Date('2026-10-01'),'Open','Buyer funding gap; seller closing certainty'],
 ['R02','Buyer approval','Yes','Buyer','Investigate',null,'Authorized price and decision record','Obtain approval on this structure and ceiling',null,new Date('2026-10-01'),'Open','Buyer may lack authority to sign'],
 ['R03','Seller authority / consent','Yes','Seller','Investigate',null,'Cap table, vote and delivery authority','Confirm who can deliver the company',null,new Date('2026-10-01'),'Open','Seller cannot promise unsupported control'],
 ['R04','Contract / license consents','Yes','Shared','Protect',null,'Change-of-control and assignment terms','Secure required consents and preserve workflow',null,new Date('2026-10-10'),'Open','Revenue or operating rights may not transfer'],
 ['R05','Earnout definition / control','Yes','Shared','Protect',null,'Metrics, accounting, integration and dispute terms','Define measurement and who can influence it',null,new Date('2026-10-01'),'Open','Buyer integration and seller payment conflict'],
 ['R06','NWC peg / debt perimeter','Yes','Shared','Price',null,'Agreed accounting policies and debt schedule','Test normal NWC and classify every obligation once',null,new Date('2026-10-01'),'Open','Seller true-up and buyer cash requirements change'],
 ['R07','Escrow / holdback recovery','Yes','Shared','Protect',null,'Release, claim and credit support terms','Test recovery, release timing and seller credit risk',null,new Date('2026-10-01'),'Open','Escrow is funded but does not assure recovery'],
 ['R08','Rollover governance','Yes','Shared','Protect',null,'Issuer, capital, voting, dilution and exit rights','Agree economic alignment and decision authority',null,new Date('2026-10-01'),'Open','Rollover dollars do not establish control'],
 ['R09','Exclusivity / extension','Yes','Shared','Investigate',null,'Dated diligence plan and extension rationale','Tie exclusivity to deliverables and next decision',null,new Date('2026-10-15'),'Open','Buyer process cost; seller lost alternatives'],
 ['R10','Unpriced liability / veto','Yes','Buyer','Investigate',null,'Known liabilities and unresolved findings','Classify each as Investigate, Price, Protect or Walk',null,new Date('2026-10-01'),'Open','Unknowns can exceed modeled consideration'],
 ];
while(riskrows.length<14){let n=riskrows.length+1;riskrows.push([`R${n}`,null,'No',null,null,null,null,null,null,null,'Open',null]);}
r.getRange('C7:N20').values=riskrows;r.getRange('C7:N20').format.fill=amber;r.getRange('C7:N20').format.wrapText=true;r.getRange('C7:O20').format.rowHeight=88;r.getRange('L7:L20').setNumberFormat(date);
r.getRange('M7:M20').setNumberFormat('  @');
list(r,'E7:E20',['Yes','No']);list(r,'F7:F20',['Buyer','Seller','Shared']);list(r,'G7:G20',['Investigate','Price','Protect','Walk']);list(r,'M7:M20',['Open','Closed']);
for(let row=7;row<=20;row++)f(r,`O${row}`,`=IF(E${row}="No","Excluded",IF(E${row}<>"Yes","Invalid requirement",IF(OR(COUNTIFS($C$7:$C$20,C${row})<>1,C${row}=""),"Invalid ID",IF(G${row}="Walk","Walk",IF(OR(COUNTBLANK(D${row}:K${row})>0,N${row}="",NOT(ISNUMBER(L${row})),AND(F${row}<>"Buyer",F${row}<>"Seller",F${row}<>"Shared"),AND(G${row}<>"Investigate",G${row}<>"Price",G${row}<>"Protect")),"Missing owner / evidence / resolution",IF(M${row}="Closed","Closed",IF(M${row}="Open","Open","Invalid status")))))))`);
warn(r,'O7:O20');r.getRange('O7:O20').format.wrapText=true;const rt=r.tables.add('C6:O20',true,'LOIConditions');rt.style='TableStyleLight1';rt.showFilterButton=true;r.freezePanes.freezeRows(6);r.freezePanes.freezeColumns(4);
note(r,'C23','Closed requires a named owner, evidence, action, resolution, due date and consequence. No formula grants approval.');

// One transparent economics build. Price, financing and time each retain their own prerequisites.
note(e,'C3','USD thousands. Positive uses / obligations. Equity bridge uses the selected NWC and stock price.');
e.getRange('F1:F90').format.columnWidth=75;
function build(row,label,formula,meaning=''){v(e,`C${row}`,label);f(e,`D${row}`,formula);if(meaning)v(e,`F${row}`,meaning);}
const P=x=>`=IF('Assumptions'!$D$53<>"Complete","n.a.",${x})`;
const safe=(refs,x)=>`=IF(COUNT(${refs})<>${refs.split(',').length},"n.a.",${x})`;
band(e,'C6:F6','Enterprise value to agreed fixed equity');
for(const [row,label,src] of [[7,'Headline enterprise value','D7'],[8,'Debt repaid at close','D8'],[9,'Debt retained / assumed','D9'],[10,'Eligible excess cash','D10'],[11,'NWC peg','D11'],[12,'Delivered NWC','F33']])build(row,label,P(`'Assumptions'!${src}`));
build(13,'NWC adjustment',safe('D11,D12','D12-D11'),'Delivered NWC minus peg; no cash or debt included twice.');
build(14,'Agreed fixed equity consideration',safe('D7,D8,D9,D10,D13','D7-D8-D9+D10+D13'));
band(e,'C16:F16','Cash, stock and rollover');
build(17,'Stock reference allocation',P("'Assumptions'!D12"));build(18,'Seller rollover',P("'Assumptions'!D13"));
build(19,'Fixed cash allocation',safe('D14,D17,D18','D14-D17-D18'),'Residual fixed equity after stock reference allocation and rollover.');
build(20,'Allocation status','=IF(COUNT(D14,D19)<>2,"Missing price inputs",IF(OR(D14<0,D19<0),"Invalid consideration allocation",IF(SUM(\'Assumptions\'!D14:D15)>D19,"Invalid escrow / holdback cap","Complete")))');
build(21,'Reference shares (thousands)',P("IF(D17=0,0,IF(OR(NOT(ISNUMBER('Assumptions'!D17)),'Assumptions'!D17<=0),\"n.a.\",D17/'Assumptions'!D17))"),'USD thousands divided by USD/share = thousands of shares.');
build(22,'Closing shares (thousands)',P(`IF(D17=0,0,IF('Assumptions'!D26="Fixed shares",D21,D17/'Assumptions'!F36))`));
build(23,'Stock value at closing price',safe('D22',"IF(D22=0,0,D22*'Assumptions'!F36)"));
build(24,'Stock value change vs reference',safe('D23,D17','D23-D17'));
build(25,'Delivered fixed equity value','=IF(D20<>"Complete","n.a.",SUM(D19,D23,D18))','Cash + closing stock value + rollover; holdback is still part of cash.');
build(26,'Funded escrow',P("'Assumptions'!D14"));build(27,'Deferred holdback',P("'Assumptions'!D15"));
build(28,'Cash paid directly to seller','=IF(D20<>"Complete","n.a.",D19-D26-D27)');
build(29,'Cash funded for fixed equity','=IF(D20<>"Complete","n.a.",D28+D26)','Includes funded escrow; excludes deferred holdback.');
build(30,'Holdback present value',P("D27/(1+'Assumptions'!D16)^'Assumptions'!D28"));
band(e,'C32:F32','Contingent price and effective buyer cost');
build(33,'Maximum contingent cash',"='Contingencies'!F41");build(34,'Expected contingent cash',"='Contingencies'!G41");build(35,'Expected contingent present value',"='Contingencies'!H41");
build(36,'Expected nominal equity cost',safe('D25,D34','D25+D34'),'Delivered fixed equity plus probability-weighted contingent cash.');
build(37,'Buyer PV equity cost',safe('D25,D27,D30,D35','D25-D27+D30+D35'),'Fixed equity less holdback discount + expected contingent PV.');
build(38,'Equity + maximum contingent cash',safe('D25,D33','D25+D33'),'At entered closing stock price; not an absolute maximum deal cost.');
build(39,'Buyer PV enterprise equivalent',safe('D37,D8,D9,D10','D37+D8+D9-D10'),'Includes selected NWC adjustment. Fees and process costs are excluded.');
build(40,'EV + maximum contingent cash',safe('D38,D8,D9,D10','D38+D8+D9-D10'),'Includes selected NWC; compare with a ceiling defined on this same basis.');
build(41,'Headroom to private ceiling','=IF(OR(NOT(ISNUMBER(\'Assumptions\'!D20)),\'Assumptions\'!D20<0,NOT(ISNUMBER(D40))),"n.a.",\'Assumptions\'!D20-D40)');
band(e,'C43:F43','Close funding and continuing obligations');
build(44,'Fixed equity cash at close','=D29');build(45,'Debt repaid at close','=D8');
build(46,'Fees paid at close','=IF(\'Assumptions\'!D54<>"Complete","n.a.",\'Assumptions\'!F45)');build(47,'Required cash into business',P("'Assumptions'!D19"));
build(48,'Total close cash uses',safe('D44,D45,D46,D47','SUM(D44:D47)'));
build(49,'Buyer cash available','=IF(\'Assumptions\'!D54<>"Complete","n.a.",\'Assumptions\'!F39)');
build(50,'New debt drawn at close','=IF(\'Assumptions\'!D54<>"Complete","n.a.",\'Assumptions\'!F42)','Committed debt assumed drawn at close; exclude undrawn facility capacity.');
build(51,'Total entered funding sources',safe('D49,D50','SUM(D49:D50)'));
build(52,'Funding surplus / (gap)',safe('D51,D48','D51-D48'),'No balancing plug; available source commitments must cover uses.');
build(53,'Post-close debt principal',safe('D9,D50','D9+D50'),'Retained existing debt + new borrowing; excludes interest and fees.');
build(54,'Deferred cash obligation ceiling',safe('D27,D33','D27+D33'),'Unfunded holdback + maximum contingent cash; no credit for escrow claims.');
build(55,'Debt + deferred cash principal',safe('D53,D54','D53+D54'),'Exposure subtotal, not an incremental purchase-price addition.');
band(e,'C57:F57','Exclusivity and process cost');
const T=x=>`=IF('Assumptions'!$D$55<>"Complete","n.a.",${x})`;
build(58,'Elapsed exclusivity days',T("MAX(0,MIN('Assumptions'!D21,'Assumptions'!D23)-'Assumptions'!D22)"));
build(59,'Days remaining to expiry',T("MAX(0,'Assumptions'!D23-'Assumptions'!D21)"));
build(60,'Expected close beyond expiry (days)',T("MAX(0,'Assumptions'!F48-'Assumptions'!D23)"));
build(61,'Buyer cost in elapsed exclusivity',T("D58*'Assumptions'!D24"));build(62,'Seller cost in elapsed exclusivity',T("D58*'Assumptions'!D25"));
build(63,'Buyer further cost to expected close',T("('Assumptions'!F48-'Assumptions'!D21)*'Assumptions'!D24"));
build(64,'Seller further cost to expected close',T("('Assumptions'!F48-'Assumptions'!D21)*'Assumptions'!D25"));
build(65,'Exclusivity decision','=IF(\'Assumptions\'!D55<>"Complete","Missing time inputs",IF(\'Assumptions\'!D21>\'Assumptions\'!D23,"Expired exclusivity",IF(D60>0,"Extend or reset close plan","Within entered term")))');
e.getRange('D7:D64').setNumberFormat(num);e.getRange('D58:D60').setNumberFormat('0');e.getRange('F7:F65').format.wrapText=true;e.getRange('C7:F65').format.rowHeight=30;e.getRange('C7:C65').format.wrapText=true;warn(e,'D20');warn(e,'D65');e.freezePanes.freezeRows(6);
for(const row of [14,25,29,37,40,48,52,55]){e.getRange(`C${row}:D${row}`).format.fill=paper;e.getRange(`C${row}:D${row}`).format.font.bold=true;}

// Decision-facing overview reads completed build results.
d.getRange('C1:C46').format.columnWidth=44;d.getRange('D1:D46').format.columnWidth=22;d.getRange('F1:F46').format.columnWidth=40;d.getRange('G1:J46').format.columnWidth=14;
band(d,'C6:D6','Price at the selected terms');
const headlines=[[7,'Headline enterprise value',7],[8,'Agreed fixed equity',14],[9,'Closing stock value',23],[10,'Delivered fixed equity',25],[11,'Buyer PV equity cost',37],[12,'Buyer PV enterprise equivalent',39],[13,'EV + maximum contingent cash',40],[14,'Headroom to private EV ceiling',41]];
headlines.forEach(([row,label,src])=>{v(d,`C${row}`,label);f(d,`D${row}`,`='Economics'!D${src}`);});d.getRange('D7:D14').setNumberFormat(num);
band(d,'F6:J6','Decision posture');v(d,'F7','Calculation inputs');f(d,'G8','=IF(\'Assumptions\'!D53<>"Complete","Missing / invalid price inputs",IF(\'Economics\'!D20<>"Complete",\'Economics\'!D20,IF(COUNT(\'Contingencies\'!F41:H41)<>3,"Missing contingent inputs",IF(\'Assumptions\'!D54<>"Complete","Missing funding inputs","Calculations available"))))');d.getRange('G8:J9').merge();d.getRange('G8:J9').format.wrapText=true;
v(d,'F11','Decision readiness');f(d,'G12','=IF(G8<>"Calculations available","Resolve inputs",IF(NOT(ISNUMBER(\'Economics\'!D41)),"Missing private ceiling",IF(\'Economics\'!D41<0,"Above private ceiling",IF(\'Economics\'!D52<0,"Gap in close funding",IF(D33>0,"Walk decision remains",IF(OR(D32>0,D34=0,D35>0,\'Assumptions\'!D27="",AND(\'Assumptions\'!D13>0,OR(\'Assumptions\'!D18="",\'Assumptions\'!D29=""))),"Open conditions / authority",IF(\'Economics\'!D65<>"Within entered term","Resolve exclusivity","Ready for authorized review")))))))');d.getRange('G12:J14').merge();d.getRange('G12:J14').format.wrapText=true;warn(d,'G8');warn(d,'G12');
note(d,'C16','EV equivalents include the NWC adjustment. Maximum contingent cash is unweighted and at the entered stock price.');
band(d,'C18:D18','Close liquidity');band(d,'F18:J18','Exposure remaining after close');
for(const [row,label,src] of [[19,'Cash directly to seller',28],[20,'Funded escrow',26],[21,'Total cash uses at close',48],[22,'Entered funding sources',51],[23,'Funding surplus / (gap)',52]]){v(d,`C${row}`,label);f(d,`D${row}`,`='Economics'!D${src}`);}
for(const [row,label,src] of [[19,'Unfunded holdback',27],[20,'Maximum contingent cash',33],[21,'Expected contingent cash',34],[22,'Post-close debt principal',53],[23,'Debt + deferred cash principal',55]]){v(d,`F${row}`,label);f(d,`I${row}`,`='Economics'!D${src}`);}
d.getRange('D19:D23').setNumberFormat(num);d.getRange('I19:I23').setNumberFormat(num);
band(d,'C26:D26','Exclusivity');band(d,'F26:J26','First pass in 10–15 minutes');
for(const [row,label,src] of [[27,'Days remaining to expiry',59],[28,'Close beyond expiry (days)',60],[29,'Buyer further process cost',63],[30,'Seller further process cost',64]]){v(d,`C${row}`,label);f(d,`D${row}`,`='Economics'!D${src}`);}
d.getRange('D27:D28').setNumberFormat('0');d.getRange('D29:D30').setNumberFormat(num);
const steps=['1. Replace core Assumptions and set the price ceiling.','2. Define contingencies, caps, timing and evidence.','3. Assign Conditions to named owners; resolve each.','4. Switch to Downside; review funding and expiry.'];steps.forEach((x,i)=>{v(d,`F${27+i}`,x);d.getRange(`F${27+i}:J${27+i}`).merge();});
v(d,'C32','Required conditions unresolved');f(d,'D32','=COUNTIFS(\'Conditions\'!E7:E20,"Yes",\'Conditions\'!O7:O20,"<>Closed")+COUNTIFS(\'Conditions\'!E7:E20,"<>Yes",\'Conditions\'!E7:E20,"<>No")');
v(d,'C33','Walk decisions');f(d,'D33','=COUNTIFS(\'Conditions\'!E7:E20,"Yes",\'Conditions\'!G7:G20,"Walk")');v(d,'C34','Conditions included');f(d,'D34','=COUNTIFS(\'Conditions\'!E7:E20,"Yes")');
v(d,'C35','Contingent definitions missing');f(d,'D35','=COUNTIFS(\'Contingencies\'!J34:J39,"Missing definition / evidence")');
note(d,'F32','Formula completeness does not approve a transaction.');note(d,'F33','Protect revenue while integrating cost.');note(d,'C37','Assumption examples • Mike Ye • Version 1.0 • September 10, 2026');
d.getRange('C7:D14').format.rowHeight=29;d.getRange('C7:C14').format.wrapText=true;
for(const pos of ['D14','D23'])d.getRange(pos).conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FCE8E6',font:{color:'#A61C17',bold:true}}});
for(const sheet of [a,e,g]){sheet.getRange('G4:H4').clear({applyTo:'all'});v(sheet,'C4','Case selected');f(sheet,'D4',"='Dashboard'!H4");sheet.getRange('D4').format.borders={preset:'outside',style:'dotted',color:gold};}

// Method and model scope, with terminal reconciliations never used by business formulas.
g.getRange('C1:C70').format.columnWidth=32;g.getRange('D1:D70').format.columnWidth=106;g.getRange('E1:E70').format.columnWidth=3;
g.getRange('D4').clear({applyTo:'all'});f(g,'C4','=\"Case selected: \"&\'Dashboard\'!H4');
const guide=[
 ['The decision','Separate headline valuation, delivered consideration, closing liquidity and continuing obligations. Agree core economics before exclusivity consumes leverage. This is an economics and decision tool, not a legal-document generator.'],
 ['Assumptions and unknowns','Every example is an Assumption. Replace numeric examples and text placeholders with actual terms and evidence. Blue numeric inputs on amber cells are editable. Blank means unknown; zero is an explicit zero. Missing required numbers withhold dependent outputs. NWC peg and delivered NWC may be negative.'],
 ['Enterprise to equity','Agreed fixed equity = headline debt-free enterprise value − debt repaid − debt retained + eligible excess cash + (delivered NWC − peg). Retained debt still reduces seller equity; classifying debt changes close funding, not the enterprise economics.'],
 ['Cash, stock and rollover','Stock reference allocation and rollover are carved out of agreed fixed equity. The residual is fixed cash. NWC true-up therefore changes cash in this template. The parties may negotiate another allocation; revise the model if they do. Rollover is a separate noncash interest, not buyer stock.'],
 ['Fixed shares versus fixed value','Fixed shares locks thousands of shares = reference stock allocation / reference USD share price. Closing value varies with the selected closing share price. Fixed value preserves allocation and changes shares. Zero stock needs no share prices; Fixed value needs only a closing price. No collars, exchange-ratio limits, dilution, dividends, fractional-share cash or equity-award treatment are modeled.'],
 ['Escrow and holdback','Both are subsets of fixed cash. Funded escrow is a close cash use but is not cash released to seller. Unfunded holdback remains a deferred nominal obligation and is discounted only in buyer PV equity cost. Neither increases nominal price. No assumed claims or recoveries are netted against price. Escrow does not guarantee recovery.'],
 ['Rollover and control','Enter the issuer and rights/control notes. A dollar rollover does not establish voting rights, board control or percentage ownership. Confirm capitalization, distribution priority, dilution, transfer and exit rights in Conditions. No ownership percentage is calculated.'],
 ['Contingent consideration','Use six slots for distinct cash commitments. Expected payment = probability × payout if triggered. Expected PV discounts that payment from its entered years after close. Sum contractual caps separately without probability weighting. Payments must not overlap; linked or mutually exclusive obligations require an agreed combined cap.'],
 ['Effective purchase price','Expected nominal equity cost = delivered fixed equity + expected contingent cash. Buyer PV equity cost = delivered fixed equity − nominal holdback + holdback PV + expected contingent PV. Escrow is valued at funding, rollover at entered amount, and stock at the selected close price. This is buyer cost, not seller net proceeds or fair-value accounting.'],
 ['Enterprise-equivalent basis','Add repaid and retained debt to equity cost and subtract eligible excess cash. The result includes the selected NWC adjustment. The private ceiling uses EV plus maximum contingent cash on this same basis, at the entered stock price. It is not an absolute maximum transaction cost: stock appreciation, interest and unmodeled liabilities can add exposure.'],
 ['Sources and uses','Close uses = fixed cash minus holdback + repaid debt + close fees + required business cash. Funded escrow is already in fixed cash. Sources = buyer cash available + committed new debt assumed drawn at close; exclude undrawn facility capacity. Excess target cash is credited in price and is not also treated as funding. Do not reuse it unless the actual flow of funds is separately modeled.'],
 ['Remaining debt and cash exposure','Post-close debt is retained debt plus new borrowing. Deferred cash ceiling is holdback plus maximum contingent payments. Their sum is a principal exposure subtotal, not extra purchase price. This tool does not model debt service, covenants, operating downside, taxes, fees on future payments or uncapped indemnities.'],
 ['Exclusivity','Use fixed review, start, end and expected-close dates. Calendar-day differences exclude the starting day. Elapsed exclusivity stops at expiry; remaining days cannot be negative. Future daily process costs continue to expected close and are separate from fees and price. Do not count the same cost twice. Seller lost alternatives and buyer distraction require judgment.'],
 ['Conditions and decision authority','Fourteen condition slots support buyer/seller/shared bearer, Investigate/Price/Protect/Walk, named owner, evidence, action, resolution, due date and consequence. Closed requires all fields. Formula checks cannot verify whether evidence is true or sufficient; authorized review remains necessary. Required No excludes a row; never use it to hide an unresolved requirement.'],
 ['Use and extend','Replace the largest assumptions, review the bridge, assign condition owners, then switch to Downside. Six contingency slots and fourteen condition slots are supported. Fill an unused slot rather than inserting beyond the ranges. More slots require extending formulas and rechecking aggregates. Sort the entire Conditions table so each risk stays with its evidence and owner.'],
 ['Boundaries','This is not a definitive agreement, tax model, purchase-price allocation, fairness opinion or financing commitment. Confirm asset-versus-equity structure, liabilities, accounting definitions and approvals with the relevant advisers. Buyer-specific synergies can inform a private ceiling; they do not automatically belong to the seller.'],
];
guide.forEach(([l,x],i)=>{let row=7+i*3;v(g,`C${row}`,l);v(g,`D${row}`,x);g.getRange(`C${row}:D${row}`).format.wrapText=true;g.getRange(`C${row}:D${row}`).format.rowHeight=66;g.getRange(`C${row}`).format.font.bold=true;g.getRange(`C${row+1}:D${row+2}`).format.rowHeight=5;});
band(g,'C57:D57','Calculation checks');v(g,'C58','Reference allocation difference');f(g,'D58','=IF(COUNT(\'Economics\'!D14,\'Economics\'!D17:D19)<>4,"n.a.",\'Economics\'!D14-SUM(\'Economics\'!D17:D19))');v(g,'C59','Cash allocation difference');f(g,'D59','=IF(COUNT(\'Economics\'!D19,\'Economics\'!D26:D28)<>4,"n.a.",\'Economics\'!D19-SUM(\'Economics\'!D26:D28))');g.getRange('D58:D59').setNumberFormat('0.00');

// Machine-readable guide and field map accompany the local calculation QA only.
const map={title:'LOI Economics & Risk Allocator',version:'1.0',units:'USD thousands except USD/share, dates, years and thousands of shares',selector:'Dashboard!H4',inputs:Object.fromEntries(globals.map(([label,value,meaning],i)=>[label,{cell:`Assumptions!D${7+i}`,meaning}])),scenarioDrivers:Object.fromEntries(drivers.map(([label],i)=>[label,{active:`Assumptions!F${33+3*i}`,base:`Assumptions!F${34+3*i}`,downside:`Assumptions!F${35+3*i}`}])) ,outputMap:Object.fromEntries(headlines.map(([row,label,src])=>[label,{dashboard:`Dashboard!D${row}`,build:`Economics!D${src}`}])) ,guide};
await fs.writeFile(`${out}/calculation-map.json`,JSON.stringify(map,null,2));
const val=(s,p)=>ss[s].getRange(p).values[0][0],tests=[];
function check(name,ok,actual){tests.push({name,pass:!!ok,actual});if(!ok)throw Error(name+': '+JSON.stringify(actual));}
const near=(x,y)=>typeof x==='number'&&Math.abs(x-y)<1e-7;
const getMetrics=()=>Object.fromEntries([14,19,21,22,23,25,28,29,30,33,34,35,36,37,38,39,40,41,48,51,52,53,54,55,58,59,60,61,62,63,64].map(row=>[row,val('Economics',`D${row}`)]));
const base=getMetrics();
check('Independent fixed equity bridge',near(base[14],16400),base[14]);
check('Cash stock rollover allocation',near(base[19],10400)&&near(base[25],16400),[base[19],base[25]]);
check('Escrow restricted while holdback deferred',near(base[28],8900)&&near(base[29],9900),[base[28],base[29]]);
check('Contingent expected and maximum separate',near(base[33],4000)&&near(base[34],1960),[base[33],base[34]]);
const expectedPV=1560/1.12**2+400/1.12;
check('Independent buyer PV cost',near(base[37],16400-500+500/1.12+expectedPV),base[37]);
check('Close sources and uses no plug',near(base[48],14400)&&near(base[52],2600),[base[48],base[52]]);
check('Continuing principal exposure excludes funded escrow',near(base[55],12500),base[55]);
input(d,'H4','Downside');const downside=getMetrics();check('Downside NWC stock funding and expiry change',near(downside[14],16000)&&near(downside[23],2800)&&near(downside[52],-1300)&&downside[60]===30,downside);
input(d,'H4','Base');input(a,'F35',null);check('Unselected missing NWC does not block Base',near(val('Economics','D14'),16400),val('Economics','D14'));input(d,'H4','Downside');check('Selected missing NWC withholds price',val('Economics','D14')==='n.a.',val('Economics','D14'));input(a,'F35',1500);input(d,'H4','Base');
input(a,'D10',null);check('Blank excess cash is unknown',val('Economics','D14')==='n.a.',val('Economics','D14'));input(a,'D10',0);check('Zero excess cash is accepted',near(val('Economics','D14'),15900),val('Economics','D14'));input(a,'D10',500);
input(a,'D14',10000);check('Escrow and holdback cannot exceed fixed cash',val('Economics','D25')==='n.a.',val('Economics','D20'));input(a,'D14',1000);
input(a,'D12',20000);check('Negative residual consideration withheld',val('Economics','D25')==='n.a.',val('Economics','D20'));input(a,'D12',4000);
input(a,'D8',0);input(a,'D9',4000);check('Debt reclassification preserves equity but changes cash uses',near(val('Economics','D14'),16400)&&near(val('Economics','D48'),11400),[val('Economics','D14'),val('Economics','D48')]);input(a,'D8',3000);input(a,'D9',1000);
input(a,'D26','Fixed value');input(a,'F37',25);check('Fixed value protects amount by changing shares',near(val('Economics','D22'),160)&&near(val('Economics','D23'),4000),[val('Economics','D22'),val('Economics','D23')]);input(a,'D26','Fixed shares');check('Fixed shares preserves count and changes delivered value',near(val('Economics','D22'),80)&&near(val('Economics','D23'),2000)&&near(val('Economics','D19'),10400),[val('Economics','D22'),val('Economics','D23')]);input(a,'F37',50);
input(a,'F37',0);check('Zero stock price withholds invalid share math',val('Economics','D25')==='n.a.',val('Economics','D25'));input(a,'F37',50);
input(c,'G8',0);check('Zero probability preserves maximum obligation',near(val('Economics','D33'),4000)&&near(val('Economics','D34'),400),[val('Economics','D33'),val('Economics','D34')]);input(c,'G8',.65);
input(c,'H8',4000);check('Payout above cap is rejected',val('Economics','D37')==='n.a.',val('Economics','D37'));input(c,'H8',2400);
input(c,'G9',null);check('Unselected missing contingency accepted',near(val('Economics','D34'),1960),val('Economics','D34'));input(d,'H4','Downside');check('Selected missing contingency is unknown',val('Economics','D34')==='n.a.',val('Economics','D34'));input(c,'G9',.85);input(d,'H4','Base');
input(c,'E15','Yes');input(c,'D15','Assumption: additional milestone');input(c,'F15',600);input(c,'G16',.5);input(c,'H16',600);input(c,'I16',1);check('Third contingency slot extends aggregate',near(val('Economics','D33'),4600)&&near(val('Economics','D34'),2260),[val('Economics','D33'),val('Economics','D34')]);input(c,'E15','No');for(const p of ['D15','F15','G16','H16','I16'])input(c,p,null);
input(a,'D28',0);check('Immediate holdback has no discount',near(val('Economics','D30'),500),val('Economics','D30'));input(a,'D28',1);
input(a,'D16',0);check('Zero discount equates PV and nominal cost',near(val('Economics','D37'),val('Economics','D36')),val('Economics','D37'));input(a,'D16',.12);
input(a,'F40',0);input(a,'F43',0);check('Zero financing sources produces real gap',near(val('Economics','D52'),-14400),val('Economics','D52'));input(a,'F40',10000);input(a,'F43',7000);
input(r,'M7','Closed');check('Closing status cannot hide missing owner and resolution',val('Conditions','O7')==='Missing owner / evidence / resolution',val('Conditions','O7'));input(r,'H7','Assumption: named approver');check('Owner alone cannot close condition',val('Conditions','O7')==='Missing owner / evidence / resolution',val('Conditions','O7'));input(r,'K7','Assumption: verified commitment');check('Complete condition closes only its own row',val('Conditions','O7')==='Closed'&&val('Dashboard','D32')===9,[val('Conditions','O7'),val('Dashboard','D32')]);input(r,'M7','Open');input(r,'H7',null);input(r,'K7',null);
input(r,'G7','Walk');check('Walk decision remains visible',val('Dashboard','D33')===1,val('Dashboard','D33'));input(r,'G7','Protect');
input(a,'D20',23000);check('Private ceiling compares unweighted EV basis',near(val('Economics','D41'),-900),val('Economics','D41'));
input(a,'D20',null);check('Missing ceiling does not fabricate decision headroom',val('Economics','D41')==='n.a.'&&typeof val('Economics','D39')==='number',val('Economics','D41'));input(a,'D20',23000);
input(a,'D11',-500);input(a,'F34',-600);check('Negative NWC peg and delivered NWC remain valid',near(val('Economics','D13'),-100)&&near(val('Economics','D14'),16400),[val('Economics','D13'),val('Economics','D14')]);input(a,'D11',2000);input(a,'F34',1900);
input(a,'D12',0);input(a,'D17',null);input(a,'F37',null);check('Zero stock needs no fabricated share prices',near(val('Economics','D22'),0)&&near(val('Economics','D23'),0)&&near(val('Economics','D25'),16400),[val('Economics','D22'),val('Economics','D25')]);input(a,'D12',4000);input(a,'D26','Fixed value');input(a,'F37',50);check('Fixed value does not require unused reference price',near(val('Economics','D23'),4000)&&near(val('Economics','D25'),16400),val('Economics','D25'));input(a,'D17',50);input(a,'D26','Fixed shares');
input(a,'D22',new Date('2026-09-15'));check('Review before proposed exclusivity starts is valid',near(val('Economics','D58'),0)&&near(val('Economics','D59'),51),[val('Economics','D58'),val('Economics','D59')]);input(a,'D22',new Date('2026-09-01'));
const conditionsBefore=r.getRange('C7:N20').values;
for(let q=7;q<=16;q++){input(r,`H${q}`,'Assumption: named owner');input(r,`K${q}`,'Assumption: documented resolution');input(r,`M${q}`,'Closed');}
input(a,'D20',25000);input(a,'D27','Assumption: named authority');check('Completed prerequisites reach authorized review only',val('Dashboard','G12')==='Ready for authorized review',val('Dashboard','G12'));
input(c,'J7',null);check('Missing contingency definition stays a finding after conditions close',val('Dashboard','G12')==='Open conditions / authority',val('Dashboard','G12'));input(c,'J7',contingencies[0][7]);
input(a,'D18',null);check('Nonzero rollover requires issuer for readiness',val('Dashboard','G12')==='Open conditions / authority',val('Dashboard','G12'));input(a,'D13',0);input(a,'D29',null);check('Zero rollover does not require unused issuer or rights',val('Dashboard','G12')==='Ready for authorized review',val('Dashboard','G12'));input(a,'D13',2000);input(a,'D18',globals[11][1]);input(a,'D29',globals[22][1]);
const extra=['R11','Assumption: extension condition','Yes','Buyer','Protect','Assumption: named owner','Assumption: evidence','Obtain documented release','Assumption: resolution',new Date('2026-10-01'),'Open','Assumption: cash risk'];r.getRange('C17:N17').values=[extra];check('Unused condition slot extends decision gate',val('Dashboard','D32')===1&&val('Dashboard','G12')==='Open conditions / authority',[val('Dashboard','D32'),val('Dashboard','G12')]);
r.getRange('C7:N20').values=conditionsBefore;input(a,'D20',23000);input(a,'D27',null);
const first=r.getRange('C7:N7').values,second=r.getRange('C8:N8').values;r.getRange('C7:N7').values=second;r.getRange('C8:N8').values=first;check('Condition full-row reorder preserves open count',val('Dashboard','D32')===10,val('Dashboard','D32'));r.getRange('C7:N7').values=first;r.getRange('C8:N8').values=second;
wb.recalculate();check('Final Base economics restored',near(val('Economics','D37'),base[37])&&val('Dashboard','H4')==='Base',val('Economics','D37'));check('Independent allocation reconciliations',near(val('Guide','D58'),0)&&near(val('Guide','D59'),0),[val('Guide','D58'),val('Guide','D59')]);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Formula errors'});
await fs.writeFile(`${out}/qa.json`,JSON.stringify({base,downside,tests,errorScan:errors.ndjson,limits:['Recalculated with artifact-tool; desktop Excel unavailable','No debt service, taxes, interest, uncapped liability quantification, collars or ownership percentage']},null,2));
console.log(JSON.stringify({tests:tests.length,base,downside,errors:errors.ndjson}));
const renders=[['Dashboard','C2:J37','dashboard'],['Assumptions','C2:F29','assumptions-core'],['Assumptions','C32:F55','assumptions-cases'],['Economics','C2:F30','economics-equity'],['Economics','C32:F65','economics-funding'],['Contingencies','C2:J29','contingencies-inputs'],['Contingencies','C33:J46','contingencies-build'],['Conditions','C2:H20','conditions-owners'],['Conditions','I6:O20','conditions-evidence'],['Guide','C2:D28','guide-1'],['Guide','C31:D59','guide-2']];
for(const [sheetName,range,slug] of renders){if(process.env.LOI_SKIP_RENDER==='1'||(process.env.LOI_RENDER_ONLY&&!process.env.LOI_RENDER_ONLY.split(',').includes(slug)))continue;const img=await wb.render({sheetName,range,scale:1.5,format:'png'});await fs.writeFile(`${out}/${slug}.png`,new Uint8Array(await img.arrayBuffer()));}
const x=await SpreadsheetFile.exportXlsx(wb);await x.save(`${out}/loi-economics-risk-allocator.xlsx`);console.log('Exported '+`${out}/loi-economics-risk-allocator.xlsx`);
