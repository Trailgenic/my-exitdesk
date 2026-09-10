import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root='/workspace/scratch/c919f721831d',out=root+'/outputs/public-comps',release=root+'/my-exitdesk/site-foundation/public-comps-release';
await fs.mkdir(out,{recursive:true});await fs.mkdir(release,{recursive:true});
const wb=Workbook.create(),[d,c,p,g]=['Dashboard','Controls','Peer data','Guide'].map(n=>wb.worksheets.add(n));
const sectors=['Media & Publishing','Marketing & Advertising','Events & Exhibitions','Software & SaaS','IT Services & Managed Services','Business & Professional Services','Healthcare Services','Consumer Products & Brands','Food & Beverage','Retail & Restaurants','Industrial & Commercial Services','Distribution & Logistics'];
const green='#173D34',amber='#FFF3CD',ink='#202620',money='#,##0.0;(#,##0.0);"–"',multiple='0.0"x"';
const val=(s,a,v)=>s.getRange(a).values=[[v]],fx=(s,a,f)=>s.getRange(a).formulas=[[f]];
const merge=(s,a,t)=>{s.getRange(a).merge();val(s,a.split(':')[0],t);};
const input=(s,a,v=null)=>{val(s,a,v);s.getRange(a).format.fill=amber;s.getRange(a).format.font.color='#0000FF';};
const header=(s,a,values)=>{s.getRange(a).values=[values];s.getRange(a).format={fill:green,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:40,wrapText:true};};
const list=(s,a,values)=>s.getRange(a).dataValidation={rule:{type:'list',values}};
for(const s of[d,c,p,g]){s.showGridLines=false;s.getRange(s===p?'A1:AP309':'A1:J60').format={font:{name:'Arial',size:10,color:ink},rowHeight:25,columnWidth:16,verticalAlignment:'center'};s.getRange('A1:A60').format.columnWidth=3;if(s!==p){merge(s,'B2:H2',s===d?'Public Company Comps Workbench':s.name);s.getRange('B2').format.font={name:'Arial',size:16,bold:true,color:green};s.getRange('B3:H3').format.borders={bottom:{style:'thin',color:green}};s.getRange('B1:B60').format.columnWidth=38;}s.freezePanes.freezeRows(s===p?9:4);}
d.tabColor=green;c.tabColor='#477467';g.tabColor='#CEC9BC';
merge(d,'B3:H3','MIKE YE · Industry comps · v1.0 · Blank template');
const controls=[['Target company',null],['Valuation date',null],['Common currency code',null],['Sector number',1],['Peer group (exact label)',null],['Metric number',2],['Target metric (millions)',null],['Target net debt (millions)',null],['Target other claims (millions)',null],['Target diluted shares (millions)',null],['Selected low multiple',null],['Selected high multiple',null],['Target basis reviewed?','No'],['Range selection rationale',null],['LTM / NTM period definition',null],['EV / leases / adjustments policy',null],['Target metric source and basis',null],['Decision owner',null]];
controls.forEach(([l,v],i)=>{val(c,`B${i+6}`,l);c.getRange(`C${i+6}:E${i+6}`).merge();input(c,`C${i+6}`,v);});
c.getRange('B6:E23').format.wrapText=true;c.getRange('B6:E23').format.rowHeight=35;c.getRange('C7').setNumberFormat('mm/dd/yy');c.getRange('C12:C17').setNumberFormat(money);c.getRange('C16:C17').setNumberFormat(multiple);
list(c,'C9',sectors.map((_,i)=>String(i+1)));list(c,'C11',['1','2','3','4','5']);list(c,'C18',['Yes','No']);
header(c,'G5:H5',['Sector','Industry']);c.getRange('G1:G35').format.columnWidth=8;c.getRange('H1:H35').format.columnWidth=44;
sectors.forEach((s,i)=>{val(c,`G${i+6}`,i+1);val(c,`H${i+6}`,s);});
header(c,'G20:H20',['Metric','Numerator / denominator']);['EV / LTM Revenue','EV / LTM EBITDA','EV / LTM EBIT','EV / NTM Revenue','EV / NTM EBITDA'].forEach((s,i)=>{val(c,`G${i+21}`,i+1);val(c,`H${i+21}`,s);});
merge(c,'B26:H27','All monetary inputs use one currency and millions. Convert outside this template. Net debt is signed: a net cash position is negative. Other claims are positive deductions from enterprise value.');c.getRange('B26:H27').format.wrapText=true;
merge(c,'B29:H30','Enter explicit zero for no adjustment, net debt or other claims. Blank means missing. The low and high multiples are analyst selections, supported by the peer statistics and a written rationale.');c.getRange('B29:H30').format.wrapText=true;
const headers=['Record ID','Sector no.','Peer group','Company','Exchange / ticker','Country','Tier','Use?','Basis reviewed?','Inclusion / exclusion rationale','Business / revenue mix','Customer / platform exposure','Currency','Market data date','LTM period end','NTM period end','Enterprise value','LTM revenue','Reported LTM EBITDA','EBITDA adjustment','LTM EBIT','NTM revenue','NTM EBITDA','Source / as-of / definitions','Adjustment rationale','Normalized LTM EBITDA','EBITDA margin','NTM revenue growth','EV / LTM Revenue','EV / LTM EBITDA','EV / LTM EBIT','EV / NTM Revenue','EV / NTM EBITDA','Selected multiple','Eligibility','Core multiple','All eligible multiple','Outlier review'];
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
merge(p,'A2:J2','Peer data: paste values into amber columns A:Y. Keep each record and its rationale on one row.');
merge(p,'A3:J3','300 rows: 10–309. Review the selected metric and common basis before setting Use? and Basis reviewed? to Yes.');
header(p,'A5:H5',['Core count','Core Q1','Core median','Core Q3','All count','All Q1','All median','All Q3']);
for(const[start,range]of [[0,'AJ10:AJ309'],[4,'AK10:AK309']]){fx(p,`${col(start)}6`,`=COUNT(${range})`);[1,2,3].forEach((q,i)=>fx(p,`${col(start+i+1)}6`,`=IF(${col(start)}6<3,"n.a.",QUARTILE(${range},${q}))`));}
p.getRange('B6:D6').setNumberFormat(multiple);p.getRange('F6:H6').setNumberFormat(multiple);
header(p,`A9:${col(headers.length-1)}9`,headers);p.getRange('A10:Y309').format.fill=amber;p.getRange('A10:Y309').format.font.color='#0000FF';p.getRange('A1:A309').format.columnWidth=19;
for(const a of ['C','D','J','K','L','X','Y'])p.getRange(`${a}1:${a}309`).format.columnWidth=30;
p.getRange('AI1:AI309').format.columnWidth=25;p.getRange('AL1:AL309').format.columnWidth=23;p.getRange('N10:P309').setNumberFormat('mm/dd/yy');p.getRange('Q10:Z309').setNumberFormat(money);p.getRange('AA10:AB309').setNumberFormat('0.0%;(0.0%);"–"');p.getRange('AC10:AH309').setNumberFormat(multiple);p.getRange('AJ10:AK309').setNumberFormat(multiple);
list(p,'B10:B309',sectors.map((_,i)=>String(i+1)));list(p,'G10:G309',['Core','Secondary','Adjacent','Watchlist','Excluded']);list(p,'H10:I309',['Yes','No']);p.freezePanes.freezeColumns(5);
for(let r=10;r<=309;r++){
 fx(p,`Z${r}`,`=IF(COUNT(S${r}:T${r})<>2,"",SUM(S${r}:T${r}))`);
 fx(p,`AA${r}`,`=IF(OR(NOT(ISNUMBER(Z${r})),NOT(ISNUMBER(R${r})),R${r}<=0),"",Z${r}/R${r})`);
 fx(p,`AB${r}`,`=IF(OR(COUNT(R${r},V${r})<>2,R${r}<=0),"",V${r}/R${r}-1)`);
 ['R','Z','U','V','W'].forEach((den,i)=>fx(p,`${col(28+i)}${r}`,`=IF(COUNT(Q${r},${den}${r})<>2,"",IF(OR(Q${r}<=0,${den}${r}<=0),"NM",Q${r}/${den}${r}))`));
 fx(p,`AH${r}`,`=IF(OR(NOT(ISNUMBER(Controls!$C$11)),Controls!$C$11<1,Controls!$C$11>5,Controls!$C$11<>INT(Controls!$C$11)),"",INDEX(AC${r}:AG${r},1,Controls!$C$11))`);
 fx(p,`AI${r}`,`=IF(A${r}="","",IF(COUNTIFS($A$10:$A$309,A${r})<>1,"Duplicate ID",IF(OR(B${r}<>Controls!$C$9,C${r}<>Controls!$C$10),"Other peer group",IF(OR(H${r}<>"Yes",G${r}="Excluded",G${r}="Adjacent",G${r}="Watchlist"),"Excluded",IF(OR(I${r}<>"Yes",D${r}="",E${r}="",J${r}="",K${r}="",L${r}="",X${r}="",Controls!$C$10="",Controls!$C$8="",Controls!$C$20="",Controls!$C$21="",M${r}<>Controls!$C$8,NOT(ISNUMBER(N${r})),N${r}<=0,N${r}<>Controls!$C$7,NOT(ISNUMBER(O${r})),O${r}>N${r},AND(Controls!$C$11>=4,OR(NOT(ISNUMBER(P${r})),P${r}<=N${r})),AND(Controls!$C$11=2,T${r}<>0,Y${r}=""),AND(G${r}<>"Core",G${r}<>"Secondary")),"Review inputs / basis",IF(NOT(ISNUMBER(AH${r})),"Missing / NM metric","Eligible"))))))`);
 fx(p,`AJ${r}`,`=IF(AND(AI${r}="Eligible",G${r}="Core"),AH${r},"")`);fx(p,`AK${r}`,`=IF(AI${r}="Eligible",AH${r},"")`);
 fx(p,`AL${r}`,`=IF(NOT(ISNUMBER(AJ${r})),"",IF($A$6<5,"Fewer than 5 core",IF(OR(AJ${r}<$B$6-1.5*($D$6-$B$6),AJ${r}>$D$6+1.5*($D$6-$B$6)),"Review outlier","Within IQR fences")))`);
}
p.getRange('AI10:AI309').conditionalFormats.add('containsText',{text:'Review',format:{fill:'#FCE8E6',font:{color:'#A61C17'}}});p.getRange('AL10:AL309').conditionalFormats.add('containsText',{text:'Review outlier',format:{fill:'#FCE8E6',font:{color:'#A61C17'}}});
header(d,'B5:E5',['Selected peer group','Core','All eligible','Basis']);val(d,'B6','Valid multiple count');fx(d,'C6',"='Peer data'!A6");fx(d,'D6',"='Peer data'!E6");val(d,'E6','Core + Secondary');
for(let i=0;i<3;i++){val(d,`B${i+7}`,['25th percentile','Median','75th percentile'][i]);fx(d,`C${i+7}`,`='Peer data'!${col(i+1)}6`);fx(d,`D${i+7}`,`='Peer data'!${col(i+5)}6`);}d.getRange('C7:D9').setNumberFormat(multiple);
val(d,'B11','Selected metric');merge(d,'C11:F11','');fx(d,'C11','=IF(OR(NOT(ISNUMBER(Controls!C11)),Controls!C11<1,Controls!C11>5,Controls!C11<>INT(Controls!C11)),"Select metric",INDEX(Controls!H21:H25,Controls!C11))');
val(d,'B12','Selected sector');merge(d,'C12:F12','');fx(d,'C12','=IF(OR(NOT(ISNUMBER(Controls!C9)),Controls!C9<1,Controls!C9>12,Controls!C9<>INT(Controls!C9)),"Select sector",INDEX(Controls!H6:H17,Controls!C9))');
val(d,'B13','Peer group');merge(d,'C13:F13','');fx(d,'C13','=IF(Controls!C10="","Enter peer group",Controls!C10)');
val(d,'B14','Valuation status');merge(d,'C14:H14','');
fx(d,'C14','=IF(C6<3,"Need at least 3 eligible core peers",IF(OR(COUNT(Controls!C12:C17)<>6,Controls!C12<=0,Controls!C14<0,Controls!C15<=0,Controls!C16<=0,Controls!C17<Controls!C16,Controls!C18<>"Yes",Controls!C19="",Controls!C22="",Controls!C6=""),"Complete target basis and selected range","Selected range ready for review"))');
header(d,'B17:D17',['Implied value (currency millions)','Low','High']);
['Selected multiple','Enterprise value','Less: net debt','Less: other claims','Equity value','Value per diluted share'].forEach((x,i)=>val(d,`B${i+18}`,x));
for(const[co,source]of[['C','C16'],['D','C17']]){const f=(r,e)=>fx(d,`${co}${r}`,`=IF($C$14<>"Selected range ready for review","n.a.",${e})`);f(18,`Controls!${source}`);f(19,`${co}18*Controls!C12`);f(20,'Controls!C13');f(21,'Controls!C14');f(22,`${co}19-SUM(${co}20:${co}21)`);f(23,`${co}22/Controls!C15`);}d.getRange('C18:D18').setNumberFormat(multiple);d.getRange('C19:D23').setNumberFormat(money);
merge(d,'B26:H27','Begin on Controls, then paste and review Peer data. Quartiles require at least 3 valid peers. Outliers require 5 core peers and remain included until you change Use? with a rationale.');d.getRange('B26:H27').format.wrapText=true;
merge(d,'B29:H30','A public trading range is a market reference. Record the target’s size, growth, margin, business mix and liquidity differences before selecting a multiple. Buyer-specific synergy is assessed separately.');d.getRange('B29:H30').format.wrapText=true;
for(const[r,label,source]of[[32,'Target company','C6'],[33,'Valuation date','C7'],[34,'Currency','C8']]){val(d,`B${r}`,label);merge(d,`C${r}:F${r}`,'');fx(d,`C${r}`,`=IF(Controls!${source}="","Enter on Controls",Controls!${source})`);}d.getRange('C33').setNumberFormat('mm/dd/yy');val(d,'B35','Per-share values are in currency units.');
p.getRange('AH10:AK309').format.font.color='#00804A';p.getRange('AI10:AI309').format.font.color=ink;
for(const a of ['AA10:AH309','AJ10:AK309'])p.getRange(a).format.font.italic=true;
const notes=[
['Scope','Public-company trading comparables across the 12 sectors on Controls. No precedent M&A data or analysis is included. The distributed workbook contains no company data or licensed provider values.'],
['Import','Use an authorized export or your own permitted sources. Paste values by matching field names into A:Y, rows 10–309. Do not paste the full export across formulas. Keep the original export separately. This template has no provider connection or automatic refresh.'],
['Record integrity','Assign one stable exchange-and-ticker ID per company. Duplicate IDs are excluded. Keep all columns together when sorting, and preserve each record’s selection and rationale when refreshing. Do not sort individual columns.'],
['Peer groups','Enter your own exact peer-group labels within each sector. Core peers support the target range. Secondary peers provide a broader comparison. Adjacent, Watchlist and Excluded rows never enter the statistics.'],
['Basis review','Use one valuation date and one currency across each EV numerator and financial denominator. Amounts are in millions. Confirm actual fiscal period ends, common LTM and NTM definitions, FX conversion, lease treatment, stock compensation, acquisitions and business mix before marking Basis reviewed? Yes.'],
['EBITDA normalization','Normalized LTM EBITDA equals reported EBITDA plus the signed adjustment. Enter an explicit 0 if unchanged. Document amount, affected period, reason and source in Adjustment rationale. Other financial inputs must already use the reviewed common basis.'],
['Enterprise value','Enter reviewed enterprise value. Reconcile it outside the template to common equity value plus net debt, preferred stock, minority interests and other claims, using the stated cash, investment and lease policy. The workbook does not reconstruct vendor EV.'],
['Multiples','Five EV multiples cover LTM revenue, EBITDA and EBIT, plus NTM revenue and EBITDA. Missing inputs return blank. Nonpositive EV or denominator returns NM. P/E is outside v1.0 because it requires a separately normalized equity earnings basis.'],
['Statistics','Core and all eligible (Core plus Secondary) counts are metric-specific. Q1, median and Q3 use Excel inclusive QUARTILE and require 3 observations. The core outlier screen uses Q1 minus 1.5 IQR and Q3 plus 1.5 IQR with at least 5 observations. It flags, but never automatically removes, a peer.'],
['Valuation','Choose low and high multiples using the statistics and target differences. EV equals the chosen multiple times the matching target metric. Equity value subtracts signed net debt and other claims. Per-share value divides by diluted shares. Negative equity remains visible. All target inputs, including zeros, are required.'],
['Limits','Ranges use a minimum of 3 eligible core peers as a template rule, not a claim of statistical sufficiency. There is no automatic control premium, marketability discount, currency conversion or synergy add-on. Rows beyond 309 are outside the calculation capacity.'],
['Refresh','Replace values and review dates, definitions, adjustments, IDs and selection decisions each time. Recalculate in Excel with calculation set to Automatic. Check the Dashboard and outlier column after every change. Amber cells are editable. Formula cells should remain intact.']
];
notes.forEach(([title,body],i)=>{const r=5+i*4;merge(g,`B${r}:H${r}`,title);g.getRange(`B${r}`).format.font.bold=true;merge(g,`B${r+1}:H${r+2}`,body);g.getRange(`B${r+1}:H${r+2}`).format.wrapText=true;g.getRange(`B${r+1}:H${r+2}`).format.rowHeight=27;});
// Synthetic QA fixtures exist only during the build, and are cleared before export.
const tests=[],assert=(name,got,want)=>{if(typeof want==='number'?Math.abs(got-want)>1e-8:got!==want)throw Error(`${name}: ${got} != ${want}`);tests.push({name,passed:true});};
const get=(s,a)=>s.getRange(a).values[0][0];
for(const[a,v]of Object.entries({C6:'Test target',C7:45000,C8:'USD',C9:4,C10:'Test group',C11:2,C12:10,C13:20,C14:0,C15:10,C16:8,C17:12,C18:'Yes',C19:'Synthetic test',C20:'LTM and NTM common basis',C21:'Reviewed EV basis',C22:'Synthetic fixture'}))val(c,a,v);
for(let i=0;i<6;i++)p.getRange(`A${10+i}:Y${10+i}`).values=[[`TEST${i}`,4,'Test group',`Synthetic ${i}`,'TEST:X','US','Core','Yes','Yes','Synthetic comparable','Same revenue model','Diversified','USD',45000,44900,45365,[80,100,120,140,160,1000][i],100,10,0,8,110,11,'Synthetic fixture','No adjustment']];
wb.recalculate();assert('Core count',get(d,'C6'),6);assert('Median',get(d,'C8'),13);assert('Q1',get(d,'C7'),10.5);assert('Q3',get(d,'C9'),15.5);assert('Outlier flag',get(p,'AL15'),'Review outlier');assert('Low EV',get(d,'C19'),80);assert('High equity',get(d,'D22'),100);
val(p,'H15','No');assert('Exclusion updates count',get(d,'C6'),5);val(p,'S10',-10);assert('Negative EBITDA NM',get(p,'AD10'),'NM');assert('Negative excluded',get(d,'C6'),4);val(p,'S10',10);val(p,'A11','TEST0');assert('Both duplicate IDs excluded',get(d,'C6'),3);val(p,'A11','TEST1');val(p,'N10',44999);assert('Wrong market date excluded',get(d,'C6'),4);val(p,'N10',45000);val(c,'C11',4);assert('Metric selector recalculates',get(p,'AH10'),80/110);val(c,'C11',2);val(p,'T10',null);assert('Missing adjustment is missing',get(p,'Z10'),'');val(p,'T10',0);val(c,'C13',null);assert('Missing net debt blocks valuation',get(d,'C19'),'n.a.');val(c,'C13',0);assert('Explicit zero net debt works',get(d,'C22'),80);
val(p,'G14','Secondary');assert('Secondary excluded from core',get(d,'C6'),4);assert('Secondary retained in all eligible',get(d,'D6'),5);
val(c,'C13',200);assert('Negative equity remains visible',get(d,'C22'),-120);
val(p,'M10','EUR');assert('Currency mismatch excluded',get(d,'C6'),3);val(p,'M10','USD');
p.getRange('A309:Y309').values=[['LAST',4,'Test group','Synthetic last','TEST:LAST','US','Core','Yes','Yes','Synthetic comparable','Same revenue model','Diversified','USD',45000,44900,45365,200,100,10,0,8,110,11,'Synthetic fixture','No adjustment']];assert('Last capacity row included',get(d,'C6'),5);assert('Last row formula copied',get(p,'AD309'),20);
val(c,'C9',12);assert('Sector change clears peers',get(d,'C6'),0);
p.getRange('A10:Y309').clear({applyTo:'contents'});controls.forEach(([,v],i)=>val(c,`C${i+6}`,v));wb.recalculate();assert('Blank template has no peers',get(d,'C6'),0);assert('Blank template has no valuation',get(d,'C19'),'n.a.');
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Final formula error scan'});
await fs.writeFile(release+'/formula-scan.ndjson',errors.ndjson);await fs.writeFile(release+'/workbook-qa.json',JSON.stringify({tests,engine:'Artifact Tool recalculation; Excel desktop not available',licensedDataIncluded:false},null,2));
await fs.writeFile(release+'/key-ranges.ndjson',(await wb.inspect({kind:'table',range:'Dashboard!B5:H23',include:'values,formulas',tableMaxRows:20,tableMaxCols:7})).ndjson);
for(const[s,range,file]of[[d,'B2:H35','dashboard'],[c,'B2:H30','controls'],[p,'A5:H16','peer-inputs'],[p,'Z9:AL16','peer-calculations'],[g,'B2:H28','guide-1'],[g,'B29:H52','guide-2']]){const b=await wb.render({sheetName:s.name,range,scale:1.5});await fs.writeFile(out+'/'+file+'.png',new Uint8Array(await b.arrayBuffer()));}
await(await SpreadsheetFile.exportXlsx(wb)).save(out+'/MikeYe-Public-Company-Comps-Workbench-v1.0.xlsx');
console.log(JSON.stringify({tests:tests.length,output:out,errors:errors.ndjson}));
