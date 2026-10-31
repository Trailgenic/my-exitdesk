import zipfile,re,sys,shutil
SRC='/home/claude/my-exitdesk/public/resources/'
files={'Gap_Inc_GAP_Valuation_Model':('F34','F6:F29'),'Salesforce_CRM_Valuation_Model':('F34','F6:F29'),
       'Ziff_Davis_ZD_Valuation_Model':('F30','F6:F25'),'NVIDIA_NVDA_Valuation_Model':('F27','F6:F23'),
       'Surgery_Partners_SGRY_Valuation_Model':('C24','G6:G21')}
def sheet_path(z,name):
    wbx=z.read('xl/workbook.xml').decode(); rels=z.read('xl/_rels/workbook.xml.rels').decode()
    rid=re.search(r'name="%s"[^>]*r:id="([^"]+)"'%re.escape(name),wbx).group(1)
    t=re.search(r'Target="([^"]+)" Id="%s"'%rid,rels) or re.search(r'Id="%s"[^>]*Target="([^"]+)"'%rid,rels)
    return t.group(1).lstrip('/')
for base,(cell,rng) in files.items():
    src=SRC+base+'-v1.2.xlsx'; out='/tmp/build/models/'+base+'-v1.2.1.xlsx'
    zin=zipfile.ZipFile(src); checks=sheet_path(zin,'Checks')
    zout=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
    removed=0
    for item in zin.infolist():
        data=zin.read(item.filename)
        if item.filename.startswith('xl/worksheets/sheet') and item.filename.endswith('.xml'):
            x=data.decode()
            x,n1=re.subn(r'<x:f[^>/]*>\s*</x:f>','',x); x,n2=re.subn(r'<x:f[^>/]*/>','',x); removed+=n1+n2
            if item.filename==checks:
                pat=r'(<x:c r="%s"[^>]*><x:f>)([^<]*)(</x:f>)'%cell
                m=re.search(pat,x); old=m.group(2)
                lo,hi=rng.split(':')
                new=f'IF(SUMPRODUCT(--ISERROR({rng}))+COUNTIF({rng},"FAIL")=0,"PASS","FAIL")'
                x=re.sub(pat,lambda mm: mm.group(1)+new.replace('"','&quot;') if False else mm.group(1)+new+mm.group(3),x)
                print(base,'status:',old,'->',new)
            data=x.encode()
        zout.writestr(item,data)
    zout.close(); print(base,'empty formulas removed',removed)
