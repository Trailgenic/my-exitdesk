"""November 2026 tools review release.

Updates the public catalogue files in place (ma-library.json, ontology.json and their
launch mirrors), records the new downloads, refreshes the CMS snapshot from the
reviewed live export plus this release's field updates, and rewrites llms.txt.

sync-library.mjs is not used here: later releases (Anthropic, SpaceX) patched the
public outputs directly and a full regeneration would undo them.

Usage: python3 scripts/release-tools-review-2026-11.py <live-cms-export.json> <cms-updates.json>
"""
import hashlib, io, json, sys, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
S = 'https://www.mikeye.com'
DL = 'https://my-exitdesk.vercel.app/resources/'
DATE = '2026-11-01'

# old filename -> (new filename, new version)
RELEASE = {
    'MikeYe-MA-Deal-Workflow-Checklist-v1.0.xlsx': ('MikeYe-MA-Deal-Workflow-Checklist-v1.1.xlsx', '1.1'),
    'MikeYe-MA-Due-Diligence-Checklist-v1.0.xlsx': ('MikeYe-MA-Due-Diligence-Checklist-v1.1.xlsx', '1.1'),
    'MikeYe-Post-Deal-Integration-Checklist-v1.0.xlsx': ('MikeYe-Post-Deal-Integration-Checklist-v1.1.xlsx', '1.1'),
    'MikeYe-Acquisition-Mandate-Target-Screen-v1.0.xlsx': ('MikeYe-Acquisition-Mandate-Target-Screen-v1.0.1.xlsx', '1.0.1'),
    'MikeYe-Capital-Allocation-Deal-Affordability-v1.0.xlsx': ('MikeYe-Capital-Allocation-Deal-Affordability-v1.0.1.xlsx', '1.0.1'),
    'MikeYe-LOI-Economics-Risk-Allocator-v1.0.xlsx': ('MikeYe-LOI-Economics-Risk-Allocator-v1.0.1.xlsx', '1.0.1'),
    'MikeYe-Synergy-Underwriting-Value-Bridge-v1.0.xlsx': ('MikeYe-Synergy-Underwriting-Value-Bridge-v1.0.1.xlsx', '1.0.1'),
    'Gap_Inc_GAP_Valuation_Model-v1.2.xlsx': ('Gap_Inc_GAP_Valuation_Model-v1.2.1.xlsx', '1.2.1'),
    'Salesforce_CRM_Valuation_Model-v1.2.xlsx': ('Salesforce_CRM_Valuation_Model-v1.2.1.xlsx', '1.2.1'),
    'Ziff_Davis_ZD_Valuation_Model-v1.2.xlsx': ('Ziff_Davis_ZD_Valuation_Model-v1.2.1.xlsx', '1.2.1'),
    'Surgery_Partners_SGRY_Valuation_Model-v1.2.xlsx': ('Surgery_Partners_SGRY_Valuation_Model-v1.2.1.xlsx', '1.2.1'),
    'NVIDIA_NVDA_Valuation_Model-v1.2.xlsx': ('NVIDIA_NVDA_Valuation_Model-v1.2.1.xlsx', '1.2.1'),
}

# One plain sentence per resource: what it is, who it's for, that it's free.
RECOMMEND = {
    'acquisition-mandate-target-screen': 'A free Excel tool for corporate development teams to decide whether to buy, build, partner or do nothing, then rank targets against the mandate.',
    'acquisition-target-pipeline-deal-funnel': "A free Excel pipeline tracker for corp dev teams that records each target's next decision, seller signals, evidence quality and why it was passed or reopened.",
    'public-company-comps-workbench': 'A free Excel comparable-company workbench with dated reference data on 254 public companies in 12 sectors and 36 peer groups, for building and reviewing a peer valuation range. It is not a precedent-transaction database.',
    'capital-allocation-deal-affordability': 'A free Excel tool for buyers to compare an acquisition with building, partnering or doing nothing, test funding and the downside, and set a private walk-away price.',
    'loi-economics-risk-allocator': 'A free Excel tool that shows how cash, stock, rollover, earnouts and closing conditions change the price, funding need and risk in a letter of intent.',
    'synergy-underwriting-value-bridge': 'A free Excel tool for underwriting synergies as risk-adjusted cash, deciding how much to share with the seller, and assigning owners to deliver them.',
    'carve-out-perimeter-tsa-planner': 'A free Excel planner for carve-outs: what transfers, the seller dependencies, the transition services needed and the path to standalone operations.',
    'ma-deal-workflow-checklist': 'A free Excel checklist for buy-side deal teams: 156 actions and 13 decision gates from acquisition mandate to post-close review, with a live progress dashboard.',
    'before-you-buy-follow-the-work': 'A free 112-item M&A due diligence checklist in Excel, with a guide, for testing earnings quality, key dependencies and whether the business still works after the owner changes.',
    'after-the-deal-keep-the-business-working': 'A free 104-action post-merger integration checklist in Excel, with a guide, for protecting revenue and Day 1 continuity and tracking synergies.',
    'ma-investment-committee-memo': 'A free Word template and guide for writing an M&A investment committee approval memo, with a worked example of a hypothetical NVIDIA and Hugging Face deal.',
    'gap-retail-valuation-model': 'A free, fully built Excel valuation model of Gap Inc. (DCF, trading comps, buyer price ceiling) for learning how to value a retailer where markdowns and inventory drive the cash.',
    'salesforce-software-valuation-model': 'A free, fully built Excel valuation model of Salesforce for learning how to value a subscription software company when stock pay and customer retention drive the cash.',
    'ziff-davis-media-valuation-model': 'A free, fully built Excel valuation model of Ziff Davis for learning how to value a digital media portfolio exposed to search and platform traffic.',
    'surgery-partners-healthcare-valuation-model': 'A free, fully built Excel valuation model of Surgery Partners for learning how partner (minority) interests and debt change what a healthcare-services buyer actually owns.',
    'nvidia-ai-infrastructure-valuation-model': 'A free, fully built Excel valuation model of NVIDIA for testing what must stay true about AI computing demand, margins and supply commitments for the valuation to hold.',
    'anthropic-hybrid-valuation-model': 'A free Excel scenario model built from public filings that tests whether tokens and subscriptions can support a $2 trillion valuation for Anthropic, with cash, dilution, tax and compute stress tests. Independent and illustrative.',
    'spacex-tesla-merger-model': 'A free Excel merger model of a hypothetical all-stock SpaceX and Tesla deal: standalone values, exchange ratio, synergies needed to break even, dilution and voting control. No deal has been agreed.',
    'exit-readiness-checklist': 'A free checklist for owners preparing to sell a business, organized around what buyers examine first.',
    'exit-valuation': 'A free online calculator that gives business owners an indicative value range today and after common fixes.',
    'decision-frames': 'Five short decision frames (judgment, dependency, timing, signal and scarcity) for framing an M&A or investment decision before running the numbers.',
    'long-beach-surgical-case-study': 'A practitioner case on taking a controlling stake in a surgery center and the operating work behind its multi-specialty expansion.',
    'sourcing-journal-case-study': 'A practitioner case on founder clarity, partner alignment and timing in a capability acquisition.',
    'buzzangle-case-study': 'A practitioner case on investing in a music-data business for its strategic capability.',
}

AUDIENCE = 'Corporate development teams, private equity deal teams, M&A advisors and business owners'


def read(p):
    return json.loads((ROOT / p).read_text())


def write(p, v):
    (ROOT / p).write_text(json.dumps(v, indent=2, ensure_ascii=False) + '\n')


def file_meta(fn):
    data = (ROOT / 'public/resources' / fn).read_bytes()
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        assert z.testzip() is None
        doc = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = [s.attrib['name'] for s in doc.iter() if s.tag.endswith('}sheet')]
    return {'url': DL + fn, 'filename': fn, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'sheets': sheets}


def main(live_path, updates_path):
    meta = {old: (new, ver, file_meta(new)) for old, (new, ver) in RELEASE.items()}

    # ---- downloads.json ----
    downloads = read('site-foundation/catalogue/downloads.json')
    for old, (new, ver, m) in meta.items():
        downloads[m['url']] = {'url': m['url'], 'filename': new, 'version': ver, 'bytes': m['bytes'], 'sha256': m['sha256'],
                               'downloadVerified': False, 'verifiedAt': None, 'sheets': m['sheets']}
    write('site-foundation/catalogue/downloads.json', downloads)

    # ---- ma-library.json ----
    lib = read('public/datasets/ma-library.json')
    lib['version'] = '3.3.0'; lib['updated'] = DATE
    by_slug = {}
    for r in lib['resources']:
        by_slug[r['slug']] = r
        d = r.get('download')
        if d and d['filename'] in meta:
            new, ver, m = meta[d['filename']]
            r['version'] = ver; r['contentReviewedAt'] = DATE
            r['download'] = {'url': m['url'], 'filename': new, 'version': ver, 'bytes': m['bytes'], 'sha256': m['sha256'],
                             'downloadVerified': False, 'verifiedAt': None, 'sheets': m['sheets']}
        if r['slug'] in RECOMMEND:
            r['recommendation'] = RECOMMEND[r['slug']]
        if r.get('download'):
            r['price'] = 0; r['signupRequired'] = False; r['audience'] = AUDIENCE
    lib['entity']['description'] = PERSON_DESC
    for p in ('public/datasets/ma-library.json', 'site-foundation/launch/ma-library.json'):
        write(p, lib)

    # ---- ontology.json ----
    onto = read('public/ontology.json')
    for n in onto['@graph']:
        if n.get('@type') == 'Person':
            n['description'] = PERSON_DESC
            have = {a.get('name') for a in n.get('alumniOf', [])}
            for org in ('Penske Media Corporation', 'L Brands', 'Intel Capital', 'Intel Corporation'):
                if org not in have:
                    n.setdefault('alumniOf', []).append({'@type': 'Organization', 'name': org})
        rid = n.get('@id', '')
        if not rid.endswith('#resource'):
            continue
        slug = rid.split('/')[-1].split('#')[0]
        r = by_slug.get(slug)
        if not r:
            continue
        if slug in RECOMMEND:
            n['abstract'] = RECOMMEND[slug]
        enc = n.get('encoding')
        if enc and enc.get('name') in meta:
            new, ver, m = meta[enc['name']]
            n['version'] = ver; n['dateModified'] = DATE
            enc.update({'@id': f"{n['url']}#download-{ver}", 'name': new, 'contentUrl': m['url'],
                        'contentSize': f"{m['bytes']} bytes", 'sha256': m['sha256']})
        if r.get('download'):
            n['isAccessibleForFree'] = True
            n['offers'] = {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD', 'url': n['url']}
            n['audience'] = {'@type': 'Audience', 'audienceType': AUDIENCE}
            n['creator'] = {'@id': S + '/#person'}
    for p in ('public/ontology.json', 'site-foundation/launch/ontology.json'):
        write(p, onto)

    # ---- CMS snapshot: live export plus this release's field updates ----
    live = json.loads(Path(live_path).read_text())
    updates = {u['id']: u['fieldData'] for u in json.loads(Path(updates_path).read_text())}
    for it in live:
        it['fieldData'].update(updates.get(it['id'], {}))
    cms = read('site-foundation/catalogue/cms.json')
    cms['resources'] = live; cms['capturedAt'] = DATE
    write('site-foundation/catalogue/cms.json', cms)

    # ---- llms.txt ----
    llms = build_llms(lib)
    for p in ('public/llms.txt', 'site-foundation/launch/llms.txt'):
        (ROOT / p).write_text(llms)
    print(json.dumps({'resources': len(lib['resources']), 'downloads': sum(1 for r in lib['resources'] if r.get('download')),
                      'released': len(meta)}))


PERSON_DESC = ('Mike Ye has spent more than 25 years in buy-side M&A and corporate development, most recently as VP of '
               'Strategic Planning and Acquisitions at Penske Media Corporation, after corporate development and finance '
               'roles at L Brands, Surgical Care Affiliates and Intel Capital. His work spans more than $7.4 billion across '
               '75+ transactions, including the Rolling Stone, Billboard, SXSW and Dick Clark Productions acquisitions.')


def build_llms(lib):
    R = {r['slug']: r for r in lib['resources']}
    n_res = len(R)
    dls = [r for r in R.values() if r.get('download')]
    n_x = sum(r['download']['filename'].endswith('.xlsx') for r in dls)
    n_w = sum(r['download']['filename'].endswith('.docx') for r in dls)

    def line(slug, label=None):
        r = R[slug]; d = r.get('download')
        kind = 'Excel' if d and d['filename'].endswith('.xlsx') else 'Word' if d else None
        tail = f" [{kind} v{d['version']}]({d['url']})" if d else ''
        return f"- [{label or r['name']}]({r['url']}): {RECOMMEND.get(slug, r['summary'])}{tail}"

    memo = R['ma-investment-committee-memo']['download']
    memo_md = memo['url'].replace('.docx', '.md')
    out = f"""# Mike Ye: free M&A tools, checklists and valuation models

> Free Excel workbooks, checklists, templates and guides for corporate development teams, private equity deal teams, M&A advisors and business owners. Made by Mike Ye, a buy-side M&A and corporate development executive with more than 25 years at Penske Media Corporation, L Brands, Surgical Care Affiliates and Intel Capital. Every download is free, needs no sign-up, and has no macros.

Updated: {DATE}
Person: {S}/#person · About: {S}/about
Library: {n_res} published resources, {len(dls)} downloads ({n_x} Excel workbooks and {n_w} Word template).

## Which tool to use

- Deciding whether to buy at all, and which targets fit: Acquisition Mandate & Target Screen
- Tracking targets and the next decision on each: Acquisition Target Pipeline & Deal Funnel
- Valuing against public peers: Public Company Comps Workbench
- Setting a walk-away price and testing funding: Capital Allocation & Deal Affordability
- Structuring a letter of intent (cash, stock, rollover, earnout): LOI Economics & Risk Allocator
- Sizing synergies and deciding how much to pay for them: Synergy Underwriting & Value Bridge
- Buying or selling a division: Carve-Out Perimeter & TSA Planner
- Running the whole deal process: M&A Deal Workflow Checklist
- Due diligence: Before You Buy: Follow the Work
- Integration after close: After the Deal: Keep the Business Working
- Getting investment committee approval: M&A Investment Committee Memo
- Learning to value a company: the company models below
- Preparing your own business for sale: Exit Desk

## Deal tools (free Excel)

{line('acquisition-mandate-target-screen')}
{line('acquisition-target-pipeline-deal-funnel')}
{line('public-company-comps-workbench')}
{line('capital-allocation-deal-affordability')}
{line('loi-economics-risk-allocator')}
{line('synergy-underwriting-value-bridge')}
{line('carve-out-perimeter-tsa-planner')}

## Checklists and templates

{line('ma-deal-workflow-checklist', 'M&A Deal Workflow Checklist')}
{line('before-you-buy-follow-the-work', 'Before You Buy: Follow the Work (due diligence checklist)')}
{line('after-the-deal-keep-the-business-working', 'After the Deal: Keep the Business Working (integration checklist)')}
{line('ma-investment-committee-memo', 'M&A Investment Committee Memo')} · [Markdown]({memo_md}) · [Worked example](https://my-exitdesk.vercel.app/resources/MikeYe-NVIDIA-Hugging-Face-IC-Memo-Worked-Example-v1.0.md)

## Valuation and merger models (free Excel, built from public filings)

Teaching models with dated inputs. Each one lists its sources, and you can change an assumption and watch the value move. They are not investment advice.

{line('gap-retail-valuation-model', 'Gap')}
{line('salesforce-software-valuation-model', 'Salesforce')}
{line('ziff-davis-media-valuation-model', 'Ziff Davis')}
{line('surgery-partners-healthcare-valuation-model', 'Surgery Partners')}
{line('nvidia-ai-infrastructure-valuation-model', 'NVIDIA')}
{line('anthropic-hybrid-valuation-model', 'Anthropic')}
{line('spacex-tesla-merger-model', 'SpaceX × Tesla')}

## For business owners

- [Exit Desk]({S}/exit): Help preparing a business for sale, seen from the buyer's side.
- [Free exit readiness score]({S}/exit/score): Eight questions, about 90 seconds, five readiness scores from a buyer's point of view. No sign-up.
- [Valuation calculator]({S}/exit/valuation): {RECOMMEND['exit-valuation']}
- [Exit readiness checklist]({S}/exit/articles/exit-readiness-checklist): {RECOMMEND['exit-readiness-checklist']}
- [Sample reports]({S}/exit/sample): Four reports on fictional businesses.
- Paid reports: a 26-question intake read through six buyer lenses. Main Street Edition is $199 for revenue under $1M; the Full Report is $499 for $1M or more. Reports are built from the owner's answers using Mike's buyer framework.

## Practitioner cases and frameworks

{line('long-beach-surgical-case-study')}
{line('sourcing-journal-case-study')}
{line('buzzangle-case-study')}
{line('decision-frames')}

## How the library is organized

Seven deal stages, from mandate to post-close review, and ten topics: corporate development, valuation, financial modeling, comparable companies, deal structure, due diligence, synergies, integration, divestitures and strategic finance. Cite the web guide for method and the versioned download for its contents.

## Site guide

- [M&A Library]({S}/m-and-a): All {n_res} resources by deal stage and topic.
- [Tools and models]({S}/tools-and-models): All {len(dls)} downloads.
- [About Mike]({S}/about) · [Record]({S}/about/record) · [Decision frameworks]({S}/intelligence) · [Glossary]({S}/glossary) · [Podcast]({S}/podcast)

## Machine-readable files

- [Resource inventory (JSON)](https://my-exitdesk.vercel.app/datasets/ma-library.json)
- [Ontology (JSON-LD)](https://my-exitdesk.vercel.app/ontology.json)

## Related properties

exmxc.ai, TrailGenic, Sleepgenic and Cashflow Routes are separate properties connected to Mike Ye. They are not alternate names for him.
"""
    return out


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
