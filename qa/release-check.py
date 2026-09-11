from pathlib import Path
from PIL import Image
import hashlib,json,re
R=Path(__file__).resolve().parents[1]
jobs=json.loads((R/'assets/generation-jobs.json').read_text())
manifest=json.loads((R/'assets/manifest.json').read_text())
html=(R/'dist/shinobi-cascade.html').read_text()
assert len(jobs)==len(manifest)==91
assert len({(m['kind'],m['id']) for m in manifest})==91
assert len({m['sha256'] for m in manifest})==91
assert html.count('data:image/webp;base64,')==91
assert not re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']https?://',html)
for m in manifest:
 assert m['source']==f'assets/generated/{m["kind"]}/{m["id"]}.png',m['id']+' used old/fallback art'
 im=Image.open(R/m['runtime']);assert abs(im.width/im.height-2/3)<.01,m['id']+' unexpected aspect ratio'
 assert hashlib.sha256((R/m['runtime']).read_bytes()).hexdigest()==m['sha256']
reports=json.loads((R/'qa/browser-results.json').read_text());assert not reports['errors'];assert not reports['externalRequests']
result=dict(cards=91,ninjas=55,relics=36,independent_generated_sources=91,old_assets_in_release=0,external_requests=0,html_bytes=len(html.encode()),html_sha256=hashlib.sha256(html.encode()).hexdigest(),browser_checks=reports['checks'])
(R/'qa/release-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False))
