#!/usr/bin/env python3
"""Build one fully offline HTML; requires Python 3 and Pillow. No node build step."""
from pathlib import Path
import base64,json,argparse,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--draft',action='store_true',help='Allow missing new art while developing; never use for release')
args=parser.parse_args()
jobs=json.loads((ROOT/'assets/generation-jobs.json').read_text())
art={'ninja':{},'relic':{}};manifest=[];missing=[]
for j in jobs:
 kind,id=j['kind'],j['id'];source=ROOT/f'assets/generated/{kind}/{id}.png'
 if not source.exists():
  missing.append(kind+'/'+id)
  if not args.draft:continue
  source=ROOT/f'assets/original/{kind}/{id}.webp'
  if not source.exists():source=ROOT/'assets/generated/ninja/naruto.png'
 target=ROOT/f'assets/cards/{kind}/{id}.webp';target.parent.mkdir(parents=True,exist_ok=True)
 if not target.exists() or source.stat().st_mtime>target.stat().st_mtime:
  im=Image.open(source).convert('RGB');im.thumbnail((512,768),Image.Resampling.LANCZOS);im.save(target,'WEBP',quality=85,method=6)
 content=target.read_bytes();art[kind][id]='data:image/webp;base64,'+base64.b64encode(content).decode()
 manifest.append(dict(id=id,kind=kind,source=str(source.relative_to(ROOT)),runtime=str(target.relative_to(ROOT)),size=list(Image.open(target).size),bytes=len(content),sha256=hashlib.sha256(content).hexdigest(),prompt=f'assets/prompts/{kind}-{id}.txt'))
if missing and not args.draft:raise SystemExit('Missing independent art: '+', '.join(missing))
(ROOT/'assets/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
css='\n'.join((ROOT/'src'/f).read_text() for f in ['style-0.css','expansion.css'])
script='\n'.join((ROOT/'src'/f).read_text() for f in ['data.js','expansion.js'])+'\nconst CARD_ART = '+json.dumps(art,ensure_ascii=False,separators=(',',':'))+';\n'+'\n'.join((ROOT/'src'/f).read_text() for f in ['audio.js','game.js'])
template=(ROOT/'src/index.template.html').read_text()
html=template.replace('/*__CSS__*/',css).replace('/*__JS__*/',script)
out=ROOT/'dist';out.mkdir(exist_ok=True);(out/'shinobi-cascade.html').write_text(html)
print(json.dumps({'cards':len(manifest),'missing':missing,'html_bytes':len(html.encode()),'draft':args.draft},ensure_ascii=False))
