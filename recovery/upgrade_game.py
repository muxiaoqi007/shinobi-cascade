from pathlib import Path
R=Path('outputs/shinobi-cascade-project')
s=(R/'src/game.js').read_text()
s=s.replace('let toastTimer = 0;', '''let toastTimer = 0;
  let detail = null, libraryTab = 'ninja', libraryFilter = '', mapOpen = false;
  const SAVE_KEY='shinobi-cascade-v2';
  let saveWarning=false;
  function save(){
    if(!['battle','shop'].includes(state.phase)||busy)return;
    try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,state,uidCounter}));}catch(e){saveWarning=true;}
  }
  function savedRun(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY));return v?.version===2&&['battle','shop'].includes(v.state?.phase)&&v.state.deck.every(c=>byId[c.id])&&v.state.relics.every(id=>relicById[id])?v:null}catch(e){return null}}
  function resume(){const v=savedRun();if(!v)return;state=v.state;uidCounter=v.uidCounter;busy=false;state.selected=[];state.helpOpen=false;detail=null;mapOpen=false;render();}
  function clearSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}
  function viewCard(kind,id){detail={kind,id};render();}
  function closeDetail(){detail=null;render();}
  function toggleMap(){mapOpen=!mapOpen;render();}
  function setLibrary(tab){libraryTab=tab;libraryFilter='';render();}
  function filterLibrary(value){libraryFilter=value;const grid=document.getElementById('libraryGrid');if(grid)grid.innerHTML=libraryGrid();}
  function chooseBoon(id){if(state.phase!=='shop'||!state.boonPending)return;const b=BOONS.find(x=>x.id===id);if(!b)return;
    if(id==='power')state.training+=12;if(id==='fortune')state.money+=12;if(id==='focus')state.focus=Math.min(3,state.focus+1);
    state.boonPending=false;toast(b.name,'good');render();
  }
  function retire(uid){if(state.phase!=='shop'||state.deck.length<=8||state.money<3)return;const i=state.deck.findIndex(c=>c.uid===uid);if(i<0)return;state.deck.splice(i,1);state.money-=3;toast('精简队伍 · 返乡休整','good');render();}
  function scout(){if(state.phase!=='battle'||busy||state.scouted||!state.selected.length)return;
    state.scouted=true;state.selected=[];const candidate=state.hand.find(c=>byId[c.id].roles.includes('战术'))||state.hand[0];if(candidate)state.selected=[candidate.uid];render();
  }''')
s=s.replace("phase:'menu', encounterIndex:0, money:10", "phase:'menu', encounterIndex:0, money:16, focus:0, boonPending:false, previousCount:0, lastResult:null, peakThreat:0")
s=s.replace('function start(){','function start(build=\'leaf\'){')
s=s.replace('state.deck=STARTER_IDS.map(makeCard);\n    state.relics=[\'chakra_thread\'];',"const kit=STARTER_BUILDS[build]||STARTER_BUILDS.leaf;\n    state.deck=kit.ids.map(makeCard);state.build=build;\n    state.relics=['chakra_thread',kit.relic];\n    busy=false;detail=null;mapOpen=false;")
s=s.replace("state.playsLeft=4; state.redraws=2;", "state.playsLeft=4; state.redraws=2+state.focus;")
s=s.replace('state.battleFlags={medical_used:false,limit_used:false};', 'state.battleFlags={medical_used:false,limit_used:false};state.previousCount=0;state.lastResult=null;state.scouted=false;busy=false;')
s=s.replace("if(state.phase!=='battle'||busy) return;", "if(state.phase!=='battle'||busy||state.helpOpen||detail||mapOpen) return;",1)
s=s.replace('function evaluate(cards){','function evaluate(cards, commit=false){')
s=s.replace("if(enc().mod==='mist'&&i===0) p*=.45;", "if(enc().mod==='mist'&&i===0) p*=.45;\n      if(enc().mod==='rift'&&ninjas.length>=3&&i===ninjas.length-1)p=0;")
s=s.replace('const destiny=[];', '''for(const rule of EXTRA_TEAMS){
      const matched=rule.ids?rule.ids.every(id=>ids.has(id)):ninjas.filter(n=>n.teams.includes(rule.team)).length>=rule.count;
      if(matched)addCombo(combos,rule.name,rule.mult,'team');
    }
    const destiny=[];
    for(const rule of EXTRA_DESTINY)if(rule.ids.every(id=>ids.has(id)))destiny.push([rule.name,rule.mult]);''')
s=s.replace("if(a.elements.includes('体')&&b.elements.includes('体'))", "if(pairHas(a,b,'阴','体'))addCombo(combos,'阴→体·破幻追击',1.7,'hot');\n      if(a.roles.includes('战术')&&b.roles.includes('控制'))addCombo(combos,'战术→控制·先读封锁',1.45);\n      if(a.elements.includes('体')&&b.elements.includes('体'))")
s=s.replace('let comboMult=combos.reduce', "for(const r of EXTRA_TAG_RULES)if(tags.has(r.tag)&&(r.elements?r.elements.every(e=>elements.has(e)):roles.has(r.role)))addCombo(combos,r.name,r.mult,'hot');\n\n    let comboMult=combos.reduce")
s=s.replace('state.battleFlags.medical_pending=true;', 'if(commit)state.battleFlags.medical_pending=true;')
s=s.replace('state.battleFlags.curse_pending=true;', 'if(commit)state.battleFlags.curse_pending=true;')
s=s.replace('const damage=Math.round(base*baseMult*comboMult*finalMult);', '''const tagged=t=>ninjas.filter(n=>n.tags.includes(t)).length;
    const teamed=t=>ninjas.filter(n=>n.teams.includes(t)).length;
    if(hasRelic('ice_mirror'))rel('魔镜冰晶',tags.has('冰遁')?4:elements.has('水')&&elements.has('风')?2:1);
    if(hasRelic('puppet_core')){const c=tagged('傀儡');rel('百机赤秘',2.6**c*(c>=2?2:1));}
    if(hasRelic('paper_wings'))rel('纸海天使',1.7**ninjas.filter(n=>n.roles.includes('支援')).length*(tags.has('纸遁')?2:1));
    if(hasRelic('sword_archive'))rel('忍刀七卷',1.9**ninjas.filter(n=>n.tags.includes('忍刀')||n.tags.includes('忍具')).length);
    if(hasRelic('crimson_chain')&&tags.has('封印'))rel('金刚封锁',3*(teamed('漩涡家族')?2:1));
    if(hasRelic('storm_drum'))rel('岚遁雷鼓',2.8**ninjas.slice(1).filter((n,i)=>pairHas(ninjas[i],n,'水','雷')).length);
    if(hasRelic('hokage_cloak')){const c=teamed('火影');rel('火影御神袍',1.9**c*(c>=2?2:1));}
    if(hasRelic('moon_mirror')&&tags.has('幻术')&&ninjas.filter(n=>n.elements.includes('阴')).length>=2)rel('月读之镜',5);
    if(hasRelic('dust_cube'))rel('尘遁结晶',tags.has('尘遁')?8:['土','风','火'].every(e=>elements.has(e))?3:1);
    if(hasRelic('sage_contract'))rel('仙兽契约',1.8**ninjas.filter(n=>n.tags.includes('仙人')||n.tags.includes('通灵')).length);
    if(hasRelic('duet_bell')&&cards.length===2)rel('双人演武铃',18);
    if(hasRelic('solo_kunai')&&cards.length===1)rel('孤影苦无',80);
    if(hasRelic('echo_seal')&&state.previousCount===cards.length)rel('回响封印',4);
    if(hasRelic('last_flame')&&state.playsLeft===1)rel('不灭意志',8);
    if(hasRelic('chain_abacus'))rel('连锁算珠',3**Math.floor(combos.length/3));
    if(hasRelic('war_banner')&&new Set(ninjas.flatMap(n=>n.teams)).size>=4)rel('联军战旗',6);
    if(enc().mod==='armor'&&elements.size<3)rel('砂壁·伤害削减',.35,'boss');
    if(enc().mod==='thorns'&&state.previousCount===cards.length)rel('骨林·重复惩罚',.4,'boss');
    if(enc().mod==='puppet'&&!roles.has('战术'))rel('傀儡·战术压制',.45,'boss');
    // Chapter mastery lets all viable archetypes scale; relics still multiply on top.
    const mastery=1.42**(enc().chapter-1);rel('远征熟练度',mastery);
    const damage=Math.min(Number.MAX_SAFE_INTEGER,Math.round(base*baseMult*comboMult*finalMult));''')
s=s.replace("if(state.phase!=='battle'||busy||!state.selected.length) return;", "if(state.phase!=='battle'||busy||!state.selected.length||state.helpOpen||detail||mapOpen) return;")
s=s.replace('const result=evaluate(cards);', 'const result=evaluate(cards,true);state.lastResult=result;state.previousCount=cards.length;')
s=s.replace("state.score+=result.damage;", "state.score=Math.min(Number.MAX_SAFE_INTEGER,state.score+result.damage);")
s=s.replace('animateResolution(result);\n    render();', 'render();\n    animateResolution(result);')
s=s.replace("state.phase!=='battle'||busy||state.redraws<=0", "state.phase!=='battle'||busy||state.redraws<=0||state.helpOpen||detail||mapOpen")
s=s.replace("busy=true; SFX.win(); state.stats.battles++; state.money+=enc().reward;", "busy=true; SFX.win(); state.stats.battles++; state.money+=enc().reward+(hasRelic('treasure_frog')?4:0);state.training+=3+(hasRelic('training_weights')?5:0);\n    state.boonPending=enc().wave===3;")
s=s.replace("const ninjaPool=shuffle(NINJAS.filter(n=>Math.random()<.6||n.rarity===rarityRoll())).slice(0,3);\n    while(ninjaPool.length<3) ninjaPool.push(pick(NINJAS));", "const ownedTeams=new Set(state.deck.flatMap(c=>byId[c.id].teams));\n    const candidates=NINJAS.filter(n=>!state.deck.some(c=>c.id===n.id));\n    const synergy=shuffle(candidates.filter(n=>n.teams.some(t=>ownedTeams.has(t)))).slice(0,2);\n    const ninjaPool=[...synergy,...shuffle(candidates.filter(n=>!synergy.includes(n)))].slice(0,4);")
s=s.replace('...ninjaPool.slice(0,3)', '...ninjaPool.slice(0,4)').replace('...relicPool.slice(0,2)', '...relicPool.slice(0,3)')
s=s.replace("if(state.phase!=='shop')return; state.encounterIndex++;", "if(state.phase!=='shop')return;if(state.boonPending){toast('先选择章节奖励','bad');return;} state.encounterIndex++;")
s=s.replace("state.phase=win?'victory':'gameover'; busy=false;", "state.phase=win?'victory':'gameover'; busy=false;clearSave();")
# Replace render functions with clear art + live data, never bake stats into raster.
a=s.index('  function cardHtml(c){');b=s.index('  function battleShell(){',a)
s=s[:a]+'''  function cardHtml(c){
    const n=byId[c.id],sel=state.selected.indexOf(c.uid),locked=c.uid===state.lockedUid;
    return `<div role="button" tabindex="0" aria-label="${n.name}，${n.elements.join('')}，${n.roles.join('、')}，${sel>=0?'已选':'未选'}" aria-pressed="${sel>=0}" class="ninja-card holo-card ${n.rarity} ${sel>=0?'selected':''} ${locked?'locked':''}" data-uid="${c.uid}" onclick="Game.toggleCard('${c.uid}')" onkeydown="if(event.key===' '){event.preventDefault();Game.toggleCard('${c.uid}')}">
      <img class="full-card-art" src="${CARD_ART.ninja[n.id]}" alt="${n.name}独立卡面" draggable="false">
      <div class="foil-layer"></div><div class="shine-layer"></div><div class="order-badge">${sel+1}</div>
      <button class="inspect-card" aria-label="查看${n.name}" onclick="event.stopPropagation();Game.viewCard('ninja','${n.id}')">↗</button>
      <div class="card-caption"><strong>${n.short}<small>${n.elements.join('·')}</small></strong><span>${n.roles.join(' / ')}</span><div><b>威 ${Math.round(n.power+state.training+c.bonus)}</b><b>×${n.mult.toFixed(2)}</b></div></div>
    </div>`;
  }
  function relicHtml(id){const r=relicById[id];return `<button class="relic holo-relic ${r.rarity}" onclick="Game.viewCard('relic','${id}')"><img class="relic-art" src="${CARD_ART.relic[id]}" alt="${r.name}" draggable="false"><div class="relic-copy"><div class="relic-name">${r.name}</div><div class="relic-text">${r.text}</div></div></button>`}
''' +s[b:]
s=s.replace("const e=enc(), pct=clamp(state.score/e.target*100,0,100);", "const e=enc(), pct=clamp(state.score/e.target*100,0,100);\n    const preview=state.selected.length?evaluate(selectedCards()):null;const shown=preview||state.lastResult;")
s=s.replace("<b>第 ${e.chapter} 章</b>","<b>${e.chapter}/10 · ${e.chapterName}</b>")
s=s.replace('<button class="iconbtn" onclick="Game.toggleHelp()">?</button>', '<button class="iconbtn" aria-label="远征地图" onclick="Game.toggleMap()">路</button><button class="iconbtn" aria-label="卡牌与连携图鉴" onclick="Game.toggleHelp()">卷</button>')
s=s.replace('<section class="panel board"><div class="arena">', '<section class="panel board"><div class="mobile-threat"><b>${e.chapterName} · ${e.name}</b><span>目标 ${fmt(e.target)} · 出击 ${state.playsLeft} · 换手 ${state.redraws}</span>${boss?`<p>${boss}</p>`:\'\'}</div><div class="arena">')
s=s.replace("'选择忍者，开始结印'", "'选择忍者 · 属性顺序决定连锁'")
s=s.replace('<div class="big-score" id="scoreNum">${fmt(state.score)}</div>', '<div class="big-score" id="scoreNum">${fmt(preview?preview.damage:state.lastResult?state.lastResult.damage:0)}</div>')
s=s.replace('<div class="combo-stack" id="comboStack"></div>', '<div class="preview-meta">${preview?`预计伤害 · ${preview.combos.length} 个组合 · 总倍率 ×${fmt(preview.baseMult*preview.comboMult*preview.finalMult)}`:state.lastResult?\'上次出击 · 连锁结算\':\'先选支援 / 控制，再接强攻试试\'}</div><div class="combo-stack" id="comboStack">${shown?shown.combos.slice(0,8).map(c=>`<span class="combo-chip ${c.kind}">${c.name} ×${c.mult}</span>`).join(\'\'):\'\'}</div>')
s=s.replace('<span>${state.lockedUid?\'神树锁定 1 张\':\'\'}</span>', '<span>${state.lockedUid?\'神树锁定 1 张\':\'↗ 查看卡面 / 羁绊\'}</span>')
s=s.replace('<div class="hand">${handHtml}</div>', '<div class="hand">${handHtml}</div><div class="mobile-relics">${state.relics.map(id=>`<button onclick="Game.viewCard(\'relic\',\'${id}\')">${relicById[id].name}</button>`).join(\'\')}</div>')
s=s.replace('<div class="help">按选择顺序触发连携。', '<div class="help">远征熟练度 ×${(1.42**(e.chapter-1)).toFixed(1)}<br>每胜全队威力 +3。<br>按选择顺序触发连携。')
a=s.index('  function renderMenu(){');b=s.index('  function shopItemHtml',a)
s=s[:a]+'''  function renderMenu(){
    const canResume=savedRun();
    return `<div class="overlay menu-overlay"><div class="modal hero-modal"><div class="hero-art"><img src="${CARD_ART.ninja.naruto}" alt="鸣人"><img src="${CARD_ART.ninja.sasuke}" alt="佐助"><img src="${CARD_ART.ninja.kakashi}" alt="卡卡西"></div><div class="hero-content"><div class="panel-title">ROGUELIKE DECKBUILDER / 完整独立卡面版</div><h1>SHINOBI<br>CASCADE<em>忍 界 连 锁</em></h1><p>以忍术结印，以羁绊破局。<br>让每一张牌，都成为下一场数字爆炸的引线。</p><div class="feature-row"><div class="feature"><b>${NINJAS.length} 名忍者</b><span>三种起始流派</span></div><div class="feature"><b>${RELICS.length} 张秘卷</b><span>无限乘法构筑</span></div><div class="feature"><b>10 章 · 30 战</b><span>10 种首领机制</span></div><div class="feature"><b>20–30 分钟</b><span>自动保存远征进度</span></div></div><div class="starter-choices">${Object.entries(STARTER_BUILDS).map(([id,b])=>`<button onclick="Game.start('${id}')"><b>${b.name}</b><span>${b.hint}</span><em>开始远征 →</em></button>`).join('')}</div>${canResume?'<button class="startbtn resume" onclick="Game.resume()">继续已保存的远征</button>':''}<button class="text-button" onclick="Game.toggleHelp()">浏览全部卡牌与连携图鉴 →</button><p class="small-note">离线单文件 · 生成式同人美术 · WebAudio 合成音效<br>战斗间自动保存；游玩时长取决于思考与操作速度。</p></div></div></div>${helpOverlay()}`;
  }

''' +s[b:]
a=s.index('  function shopItemHtml');b=s.index('  function renderShop()',a)
s=s[:a]+'''  function shopItemHtml(item,i){
    if(item.type==='train')return `<button class="shop-item training-item ${item.sold?'sold':''}" onclick="Game.buy(${i})" ${item.sold?'disabled':''}><div class="bigicon">修</div><h3>全队特训</h3><p>全队基础威力永久 +6</p><div class="price">${item.sold?'已修炼':item.cost+' 両'}</div></button>`;
    const n=item.type==='ninja'?byId[item.id]:relicById[item.id];
    return `<div class="shop-item card-shop ${n.rarity} ${item.sold?'sold':''}"><button class="shop-art-button" onclick="Game.viewCard('${item.type}','${n.id}')" aria-label="查看${n.name}"><img class="shop-card-art" src="${CARD_ART[item.type][n.id]}" alt="${n.name}" loading="lazy"></button><div class="shop-copy"><h3>${n.name}</h3><p>${item.type==='ninja'?`${n.teams.join(' / ')} · ${n.elements.join('')}<br>${n.roles.join(' / ')} · 威 ${n.power} ×${n.mult}`:n.text}</p><button class="buy-button" onclick="Game.buy(${i})" ${item.sold?'disabled':''}>${item.sold?'已购入':`购入 · ${item.cost} 両`}</button></div></div>`;
  }

''' +s[b:]
s=s.replace('<div class="shop-section-title">RECRUIT / SCROLL / TRAINING</div>', '''${state.boonPending?`<div class="boon-panel"><h3>章节突破 · 选择一份奖励</h3><div class="boon-choices">${BOONS.map(b=>`<button onclick="Game.chooseBoon('${b.id}')"><b>${b.name}</b><span>${b.text}</span></button>`).join('')}</div></div>`:''}<div class="shop-section-title">招募 / 秘卷 / 修炼 · 点击卡面查看完整详情</div>''')
s=s.replace('<div class="shop-foot"><button', '<details class="retire-panel"><summary>队伍精简 · ${state.deck.length} 张（每张花费 3 両，至少保留 8 张）</summary><div class="owned-relics">${state.deck.map(c=>`<button class="owned-chip" onclick="Game.retire(\'${c.uid}\')" ${state.deck.length<=8||state.money<3?\'disabled\':\'\'}>休整 · ${byId[c.id].short}</button>`).join(\'\')}</div></details><div class="shop-foot"><button')
a=s.index('  function helpOverlay(){');b=s.index('  function render(){',a)
s=s[:a]+'''  function libraryGrid(){
    if(libraryTab==='combo')return COMBO_GLOSSARY.filter(([a,b])=>(a+b).includes(libraryFilter)).map(([a,b])=>`<div class="tutorial-card"><b>${a}</b><p>${b}</p></div>`).join('');
    const list=libraryTab==='ninja'?NINJAS:RELICS;
    return list.filter(n=>[n.name,...(n.teams||[]),...(n.tags||[]),...(n.elements||[])].join(' ').includes(libraryFilter)).map(n=>`<button class="library-card ${n.rarity}" onclick="Game.viewCard('${libraryTab}','${n.id}')"><img src="${CARD_ART[libraryTab][n.id]}" alt="${n.name}" loading="lazy"><b>${n.name}</b><span>${libraryTab==='ninja'?n.elements.join(' · '):n.text}</span></button>`).join('');
  }
  function helpOverlay(){
    if(!state.helpOpen)return'';
    return `<div class="overlay library-overlay"><div class="modal"><div class="shop-head"><div><div class="panel-title">SHINOBI ARCHIVE</div><h2>忍界图鉴</h2><p>按选择顺序结印，每一层组合倍率相乘。</p></div><button class="iconbtn" aria-label="关闭图鉴" onclick="Game.toggleHelp()">×</button></div><div class="library-tabs">${[['ninja',`忍者 ${NINJAS.length}`],['relic',`秘卷 ${RELICS.length}`],['combo',`羁绊与连携 ${COMBO_GLOSSARY.length}`]].map(([id,label])=>`<button class="${libraryTab===id?'active':''}" onclick="Game.setLibrary('${id}')">${label}</button>`).join('')}<input aria-label="搜索图鉴" placeholder="搜索名字 / 阵营 / 属性" oninput="Game.filterLibrary(this.value)"></div><div id="libraryGrid" class="library-grid ${libraryTab==='combo'?'combo-grid':''}">${libraryGrid()}</div></div></div>`;
  }
  function detailOverlay(){
    if(!detail)return'';const kind=detail.kind,n=kind==='ninja'?byId[detail.id]:relicById[detail.id];
    const pairs=kind==='ninja'?[...EXTRA_TEAMS,...EXTRA_DESTINY].filter(r=>r.ids?.includes(n.id)):[];
    return `<div class="overlay detail-overlay" onclick="Game.closeDetail()"><div class="modal card-detail" onclick="event.stopPropagation()"><img src="${CARD_ART[kind][n.id]}" alt="${n.name}完整独立卡面"><section><button class="iconbtn detail-close" aria-label="关闭卡牌详情" onclick="Game.closeDetail()">×</button><div class="panel-title">${n.rarity.toUpperCase()} / ${kind==='ninja'?'忍者':'秘卷'}</div><h2>${n.name}</h2>${kind==='ninja'?`<p>${n.teams.join(' / ')}</p><p>${n.elements.join(' · ')} / ${n.roles.join(' · ')}</p><p>${n.tags.join(' · ')}</p><div class="detail-stats">威力 ${n.power} <b>×${n.mult.toFixed(2)}</b></div><h3>关联羁绊</h3><p>${pairs.map(r=>`${r.name} ×${r.mult}：${r.ids.map(ninjaName).join(' + ')}`).join('<br>')||'与相同小队、互补属性或战术角色配合。更多规则见连携图鉴。'}</p>`:`<p>${n.text}</p><div class="detail-stats">价格 ${n.cost} 両</div>`}<p class="small-note">整幅独立绘制，完整保留四边；数值以当前游戏数据为准。</p></section></div></div>`;
  }
  function mapOverlay(){
    if(!mapOpen)return'';return `<div class="overlay"><div class="modal"><div class="shop-head"><div><div class="panel-title">EXPEDITION / 30 ENCOUNTERS</div><h2>远征之路</h2></div><button class="iconbtn" aria-label="关闭地图" onclick="Game.toggleMap()">×</button></div><div class="map-grid">${ENCOUNTERS.filter(e=>e.wave===1).map(e=>`<section class="map-chapter ${enc().chapter===e.chapter?'current':''}"><h3>${String(e.chapter).padStart(2,'0')} / ${e.chapterName}</h3>${ENCOUNTERS.filter(x=>x.chapter===e.chapter).map(x=>{const idx=ENCOUNTERS.indexOf(x);return `<p class="${idx<state.encounterIndex?'done':idx===state.encounterIndex?'current':''}">${idx<state.encounterIndex?'✓':idx===state.encounterIndex?'→':'·'} ${x.name}<small>${fmt(x.target)}${x.mod?' / BOSS':''}</small></p>`}).join('')}</section>`).join('')}</div></div></div>`;
  }

''' +s[b:]
s=s.replace('requestAnimationFrame(bindHoloTilt);', "app.insertAdjacentHTML('beforeend',mapOverlay()+detailOverlay());\n    requestAnimationFrame(bindHoloTilt);save();")
s=s.replace("if(state.phase==='battle'&&!state.helpOpen)", "if(state.phase==='battle'&&!state.helpOpen&&!detail&&!mapOpen)")
s=s.replace("if(e.key==='Escape'&&state.helpOpen)toggleHelp();", "if(e.key==='Escape'){if(detail)closeDetail();else if(mapOpen)toggleMap();else if(state.helpOpen)toggleHelp();}")
s=s.replace('return {start,toggleCard,play,redraw,buy,sellRelic,rerollShop,nextBattle,toggleHelp,toggleSound};', '''const api={start,resume,toggleCard,play,redraw,buy,sellRelic,rerollShop,nextBattle,toggleHelp,toggleSound,viewCard,closeDetail,toggleMap,setLibrary,filterLibrary,chooseBoon,retire};
  // Test harness is opt-in and never enabled by the released HTML.
  if(window.__SHINOBI_TEST__)api.test={state:()=>state,evaluate:(ids)=>evaluate(ids.map(id=>({n:byId[id],inst:{id,bonus:0}}))),setState:v=>{Object.assign(state,v);busy=false;},startBattle,generateShop,render,enc};
  return api;''')
(R/'src/game.js').write_text(s)
print('game upgraded',len(s))
