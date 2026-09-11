from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
R=Path(__file__).resolve().parents[1]
issues={
 'sakura':'右侧边框、稀有度文字被裁断', 'kakashi':'上沿残留相邻卡片边框，主体比例过窄',
 'yamato':'右侧边框与稀有度文字被裁断','sai':'右侧边框和名称区被裁断',
 'choji':'上沿有相邻卡片的边框残片','asuma':'上沿有相邻卡片的边框残片',
 'shino':'上下不对称留黑，顶部边缘杂片','kurenai':'上下不对称留黑，顶部边缘杂片',
 'orochimaru':'上沿混入相邻卡片的横边','minato':'上沿混入相邻卡片的横边',
 'pain':'上沿有额外横边，主体与其他忍者比例不统一','obito':'上沿有额外横边，主体与其他忍者比例不统一',
 'hashirama':'左右主体边框和底部数值区存在裁切','madara':'右侧名称、数值与边框明显缺失',
 'sharingan':'左侧装饰和底部价格数字被裁断','team_tactics':'右侧边框与装饰被裁断',
 'jinchuriki_core':'左边框与价格数字缺失','flying_raijin':'右侧边框被截断',
 'rinnegan':'仅剩横向片段，画面高度明显不足','edo_tensei':'仅剩横向片段，右侧边缘裁断',
 'wood_domain':'仅剩横向片段，卡牌主体高度明显不足','akatsuki_ring':'仅剩横向片段，卡牌主体高度明显不足',
 'element_prism':'仅剩横向片段，顶部混入邻卡边框','destiny_knot':'仅剩横向片段，顶部混入邻卡边框',
 'limit_break':'仅剩横向片段，顶部混入邻卡文字和边框','combo_engine':'仅剩横向片段，顶部混入邻卡文字和边框'
}
rows=[]
for kind in ['ninja','relic']:
 for p in (R/f'assets/original/{kind}').glob('*.webp'):
  rows.append(dict(id=p.stem,kind=kind,original_size=list(Image.open(p).size),finding=issues.get(p.stem,'缩略图未发现明显主体缺口；留黑和卡框比例不统一，统一重绘以消除旧排版与静态数值'),action='整幅独立重绘并替换',replacement=f'assets/generated/{kind}/{p.stem}.png'))
(R/'qa/original-card-audit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
jobs=json.loads((R/'assets/generation-jobs.json').read_text());checks=[]
for j in jobs:
 p=R/f'assets/generated/{j["kind"]}/{j["id"]}.png'
 if not p.exists():continue
 im=Image.open(p);checks.append(dict(id=j['id'],kind=j['kind'],size=list(im.size),portrait=im.width<im.height,ratio=round(im.width/im.height,4),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
for kind in ['ninja','relic']:
 files=[R/f'assets/generated/{kind}/{j["id"]}.png' for j in jobs if j['kind']==kind and (R/f'assets/generated/{kind}/{j["id"]}.png').exists()]
 for start in range(0,len(files),24):
  subset=files[start:start+24];im=Image.new('RGB',(1200,((len(subset)+5)//6)*320),'#111e28');draw=ImageDraw.Draw(im)
  for i,p in enumerate(subset):
   card=Image.open(p);card.thumbnail((192,288));x=i%6*200;y=i//6*320;im.paste(card,(x,y));draw.text((x+5,y+295),p.stem,fill='white')
  im.save(R/f'qa/art-{kind}-{start//24+1}.jpg',quality=92)
(R/'qa/generated-art-checks.json').write_text(json.dumps(checks,indent=2))
assert len(set(c['sha256'] for c in checks))==len(checks),'Duplicate generated files'
assert all(c['portrait'] for c in checks),'Landscape card detected'
print(json.dumps({'original_audited':len(rows),'obvious_defects':len(issues),'generated_checked':len(checks),'expected':len(jobs)}))
