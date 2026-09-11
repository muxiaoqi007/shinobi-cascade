'use strict';

const Game = (() => {
  const $ = (s) => document.querySelector(s);
  const app = document.getElementById('app');
  const byId = Object.fromEntries(NINJAS.map(n => [n.id, n]));
  const relicById = Object.fromEntries(RELICS.map(r => [r.id, r]));
  const rarityPrice = {common:5, uncommon:7, rare:10, epic:14, legendary:19};
  const elementColor = {风:'#4cc9a5',火:'#ff6b57',水:'#55a8ef',土:'#b89255',雷:'#9c85ff',阴:'#766a89',体:'#e06c79'};

  let state = {};
  let uidCounter = 1;
  let busy = false;
  let toastTimer = 0;

  function freshState(){
    return {
      phase:'menu', encounterIndex:0, money:10, deck:[], drawPile:[], discard:[], hand:[], selected:[],
      relics:[], score:0, playsLeft:4, redraws:2, training:0, shopItems:[], shopRerollCost:3,
      log:[], helpOpen:false, bossSealElement:null, lockedUid:null, drawPenalty:0,
      battleFlags:{}, stats:{totalDamage:0,maxHit:0,totalCombos:0,battles:0,recruits:0,relicsBought:0,startTime:Date.now()}
    };
  }

  function makeCard(id){ return {uid:`c${uidCounter++}`, id, bonus:0}; }
  function shuffle(a){
    const b=[...a];
    for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
    return b;
  }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hasRelic(id){return state.relics.includes(id)}
  function enc(){return ENCOUNTERS[state.encounterIndex]}
  function fmt(n){
    n=Math.max(0,Math.round(n||0));
    if(n<10000) return n.toLocaleString('zh-CN');
    if(n<1e8) return (n/1e4).toFixed(n<1e5?1:0)+'万';
    if(n<1e12) return (n/1e8).toFixed(n<1e9?2:1)+'亿';
    return (n/1e12).toFixed(2)+'万亿';
  }
  function exact(n){ return Math.round(n||0).toLocaleString('zh-CN'); }
  function addLog(text){state.log.unshift(text);state.log=state.log.slice(0,7)}

  function start(){
    state=freshState(); uidCounter=1;
    state.deck=STARTER_IDS.map(makeCard);
    state.relics=['chakra_thread'];
    state.stats.startTime=Date.now();
    startBattle();
    SFX.tap();
  }

  function startBattle(){
    state.phase='battle'; state.score=0; state.playsLeft=4; state.redraws=2; state.selected=[];
    state.drawPile=shuffle(state.deck); state.discard=[]; state.hand=[]; state.lockedUid=null; state.drawPenalty=0;
    state.battleFlags={medical_used:false,limit_used:false};
    state.bossSealElement=enc().mod==='genjutsu' ? pick(['风','火','水','土','雷','阴','体']) : null;
    draw(8); addLog(`进入 ${enc().name}，威胁值 ${fmt(enc().target)}`); render();
  }

  function draw(n){
    n=Math.max(0,n-(state.drawPenalty||0)); state.drawPenalty=0;
    while(n-->0 && state.hand.length<8){
      if(!state.drawPile.length){
        if(!state.discard.length) break;
        state.drawPile=shuffle(state.discard); state.discard=[];
      }
      const c=state.drawPile.pop();
      if(c) state.hand.push(c);
    }
  }

  function maxSelect(){return enc()?.mod==='seal'?4:5}
  function toggleCard(uid){
    if(state.phase!=='battle'||busy) return;
    if(uid===state.lockedUid){toast('这张牌被神树根界锁住了','bad');SFX.fail();return}
    const idx=state.selected.indexOf(uid);
    if(idx>=0){state.selected.splice(idx,1);SFX.deselect();}
    else{
      if(state.selected.length>=maxSelect()){toast(`本战最多选择 ${maxSelect()} 张`,'bad');SFX.fail();return}
      state.selected.push(uid); SFX.select(state.selected.length);
    }
    render();
  }

  function selectedCards(){
    return state.selected.map(uid=>state.hand.find(c=>c.uid===uid)).filter(Boolean).map(inst=>({inst,n:byId[inst.id]}));
  }

  function pairHas(a,b,ea,eb){ return a.elements.includes(ea)&&b.elements.includes(eb); }
  function addCombo(combos,name,mult,kind='normal'){ combos.push({name,mult,kind}); }

  function evaluate(cards){
    const ninjas=cards.map(c=>c.n), ids=new Set(ninjas.map(n=>n.id));
    const tags=new Set(ninjas.flatMap(n=>n.tags));
    const roles=new Set(ninjas.flatMap(n=>n.roles));
    const elements=new Set(ninjas.flatMap(n=>n.elements));
    const combos=[];
    let base=0, baseMult=1;
    ninjas.forEach((n,i)=>{
      let p=n.power+state.training+cards[i].inst.bonus;
      if(enc().mod==='mist'&&i===0) p*=.45;
      if(state.bossSealElement && n.elements.includes(state.bossSealElement)) p*=.5;
      base+=p; baseMult*=n.mult;
    });
    if(enc().mod==='drain') baseMult=Math.max(1,baseMult-.8);

    // Named team combinations.
    if(ids.has('naruto')&&ids.has('sasuke')&&ids.has('sakura')) addCombo(combos,'第七班·三位一体', ids.has('kakashi')?7:3.6,'team');
    if(ids.has('shikamaru')&&ids.has('ino')&&ids.has('choji')) addCombo(combos,'猪鹿蝶·影心倍化',3.2,'team');
    if(ids.has('gaara')&&ids.has('temari')&&ids.has('kankuro')) addCombo(combos,'砂之三姐弟·砂暴阵',3.5,'team');
    if(ids.has('jiraiya')&&ids.has('tsunade')&&ids.has('orochimaru')) addCombo(combos,'传说三忍·禁域',6.5,'legend');
    if(ids.has('guy')&&ids.has('lee')&&ids.has('neji')) addCombo(combos,'凯班·青春全开',4.2,'team');
    const akatsuki=ninjas.filter(n=>n.teams.includes('晓')).length;
    if(akatsuki>=2) addCombo(combos,`晓之共鸣 ×${akatsuki}`,Math.pow(1.7,akatsuki-1),'hot');

    // Destiny pairs.
    const destiny=[];
    if(ids.has('naruto')&&ids.has('sasuke')) destiny.push(['宿命·双星',3.7]);
    if(ids.has('sasuke')&&ids.has('itachi')) destiny.push(['宿命·兄弟之眼',4.5]);
    if(ids.has('naruto')&&ids.has('jiraiya')) destiny.push(['宿命·师徒螺旋',3.0]);
    if(ids.has('naruto')&&ids.has('minato')) destiny.push(['宿命·父子飞雷',3.8]);
    if(ids.has('naruto')&&ids.has('gaara')) destiny.push(['宿命·人柱力共鸣',2.2]);
    if(ids.has('guy')&&ids.has('lee')) destiny.push(['宿命·青春传承',3.0]);
    if(ids.has('hashirama')&&ids.has('madara')) destiny.push(['宿命·终焉之谷',9.0]);
    destiny.forEach(d=>addCombo(combos,d[0],d[1],'legend'));

    // Ordered elemental / tactical chains.
    let raijinLinks=0;
    for(let i=0;i<ninjas.length-1;i++){
      const a=ninjas[i], b=ninjas[i+1];
      if(pairHas(a,b,'风','火')) addCombo(combos,'风遁 → 火遁 · 风助火势',1.85,'normal');
      if(pairHas(a,b,'水','雷')) addCombo(combos,'水遁 → 雷遁 · 感电场',2.25,'hot');
      if(pairHas(a,b,'火','雷')) addCombo(combos,'火遁 → 雷遁 · 炎雷贯穿',2.05,'hot');
      if(pairHas(a,b,'土','水')||pairHas(a,b,'水','土')) addCombo(combos,'土水相生 · 地脉涌流',1.8,'normal');
      if(pairHas(a,b,'雷','风')||pairHas(a,b,'风','雷')){ addCombo(combos,'风雷瞬连 · 超速术式',2.35,'hot'); raijinLinks++; }
      if(a.elements.includes('体')&&b.elements.includes('体')) addCombo(combos,'体术追击 · 无间连打',1.55,'hot');
      if((a.roles.includes('医疗')||a.roles.includes('支援'))&&b.roles.includes('强攻')) addCombo(combos,'医疗增幅 → 强攻',1.65,'normal');
      if(a.roles.includes('控制')&&b.roles.includes('强攻')) addCombo(combos,'控制锁定 → 斩杀',1.5,'normal');
    }

    if(elements.size===3) addCombo(combos,'三性变化·复合忍术',2.25,'normal');
    if(elements.size===4) addCombo(combos,'四象联弹·属性共振',4.8,'hot');
    if(elements.size>=5) addCombo(combos,'五遁大连弹·属性崩解',13,'legend');
    if(roles.has('强攻')&&roles.has('控制')&&(roles.has('医疗')||roles.has('支援'))&&roles.has('战术')) addCombo(combos,'完美阵型·攻控辅策',4.2,'team');
    if(tags.has('写轮眼')&&tags.has('幻术')) addCombo(combos,'写轮眼·幻术增幅',1.8,'hot');
    if(tags.has('仙人')&&tags.has('螺旋丸')) addCombo(combos,'仙术·螺旋共振',2.4,'legend');
    if(tags.has('木遁')&&elements.has('土')&&elements.has('水')) addCombo(combos,'木遁·森罗生长',2.8,'legend');

    let comboMult=combos.reduce((m,c)=>m*c.mult,1);
    const relicSteps=[];
    const attackCount=ninjas.filter(n=>n.roles.includes('强攻')).length;
    const medCount=ninjas.filter(n=>n.roles.includes('医疗')).length;
    const jinCount=ninjas.filter(n=>n.tags.includes('人柱力')).length;
    const destinyCount=destiny.length;
    const maxTeamCount=Math.max(0,...Object.values(ninjas.flatMap(n=>n.teams).reduce((o,t)=>(o[t]=(o[t]||0)+1,o),{})));
    let finalMult=1;

    function rel(name,m,kind='relic'){ if(m!==1){finalMult*=m;relicSteps.push({name,mult:m,kind});} }
    if(hasRelic('shadow_scroll')&&attackCount) rel('秘卷·多重影分身',Math.pow(1.28,attackCount));
    if(hasRelic('chakra_thread')&&elements.size>1){ const m=1+.35*(elements.size-1); base*=m; relicSteps.push({name:`查克拉丝线 +${Math.round((m-1)*100)}%威力`,mult:m,kind:'base'}); }
    if(hasRelic('medical_seal')&&medCount){ rel('百豪储备',2.2); if(!state.battleFlags.medical_used){rel('百豪·首次释放',1.6); state.battleFlags.medical_pending=true;} }
    if(hasRelic('sharingan')&&combos.length) rel('写轮眼·看破连携',Math.pow(1.16,combos.length));
    if(hasRelic('sage_mode')&&cards.length>=4) rel('仙人模式',3);
    if(hasRelic('curse_mark')&&cards.length===3){rel('咒印暴走',4.5); state.battleFlags.curse_pending=true;}
    if(hasRelic('eight_gates')&&cards.length===5){rel('八门·开',6);if(tags.has('八门遁甲'))rel('体术者·门开',2);}
    if(hasRelic('jinchuriki_core')&&jinCount) rel('尾兽查克拉核',Math.pow(2.1,jinCount));
    if(hasRelic('flying_raijin')&&raijinLinks) rel('飞雷神·连点术式',Math.pow(3.2,raijinLinks));
    if(hasRelic('rinnegan')&&combos.length>=4) rel('轮回眼·倍率重演',Math.sqrt(Math.max(1,comboMult)));
    if(hasRelic('edo_tensei')&&state.playsLeft===1&&destinyCount) rel('秽土阵·宿命再演',Math.pow(1.8,destinyCount));
    if(hasRelic('wood_domain')&&elements.has('土')&&elements.has('水')){rel('树界降诞',3.5);if(tags.has('木遁'))rel('木遁核心',2.5);}
    if(hasRelic('akatsuki_ring')&&akatsuki){rel('晓之戒',Math.pow(1.85,akatsuki));if(akatsuki>=3)rel('晓·三人以上',3);}
    if(hasRelic('team_tactics')&&maxTeamCount>=3) rel('小队战术卷轴',maxTeamCount>=4?7:3);
    if(hasRelic('element_prism')&&elements.size){rel('五遁棱镜',Math.pow(1.75,elements.size));if(elements.size>=5)rel('五遁棱镜·完全折射',10);}
    if(hasRelic('destiny_knot')&&destinyCount) rel('宿命之结',Math.pow(2.5,destinyCount));
    if(hasRelic('combo_engine')&&combos.length>4) rel('连携演算式',Math.pow(2,combos.length-4));
    if(enc().mod==='finale'&&destinyCount) rel('终焉场域·宿命放大',Math.pow(1.5,destinyCount));

    const damage=Math.round(base*baseMult*comboMult*finalMult);
    return {base,baseMult,comboMult,finalMult,damage,combos,relicSteps,elements:[...elements],destinyCount};
  }

  function play(){
    if(state.phase!=='battle'||busy||!state.selected.length) return;
    const cards=selectedCards(); if(!cards.length)return;
    busy=true; SFX.shuffle();
    const playing=[...state.selected];
    render();
    playing.forEach((uid,i)=>{const el=document.querySelector(`[data-uid="${uid}"]`);if(el){el.classList.add('playing');el.style.setProperty('--tilt',`${(i-(playing.length-1)/2)*3}deg`);}});
    setTimeout(()=>resolvePlay(cards,playing),430);
  }

  function resolvePlay(cards,playing){
    const result=evaluate(cards);
    state.playsLeft--;
    state.score+=result.damage;
    state.stats.totalDamage+=result.damage; state.stats.maxHit=Math.max(state.stats.maxHit,result.damage); state.stats.totalCombos+=result.combos.length+result.relicSteps.length;
    if(state.battleFlags.medical_pending){state.battleFlags.medical_used=true;delete state.battleFlags.medical_pending;}
    if(state.battleFlags.curse_pending){state.drawPenalty=1;delete state.battleFlags.curse_pending;}

    const selectedSet=new Set(playing);
    state.hand=state.hand.filter(c=>{if(selectedSet.has(c.uid)){state.discard.push(c);return false}return true});
    state.selected=[];
    if(enc().mod==='roots'&&state.hand.length){state.lockedUid=pick(state.hand).uid;} else state.lockedUid=null;
    draw(cards.length);

    if(hasRelic('limit_break')&&!state.battleFlags.limit_used&&result.damage>enc().target*1.5){
      state.training+=4; state.battleFlags.limit_used=true; addLog('限界突破：全队基础威力永久 +4');
    }
    addLog(`连携 ${result.combos.length} 段，造成 ${fmt(result.damage)}`);
    animateResolution(result);
    render();

    setTimeout(()=>{
      if(state.score>=enc().target){battleWin();}
      else if(state.playsLeft<=0){gameOver(false);}
      else {busy=false; render();}
    },Math.min(1050+result.combos.length*90,2200));
  }

  function redraw(){
    if(state.phase!=='battle'||busy||state.redraws<=0)return;
    let uids=[...state.selected];
    if(!uids.length) uids=shuffle(state.hand.filter(c=>c.uid!==state.lockedUid)).slice(0,Math.min(3,state.hand.length)).map(c=>c.uid);
    if(!uids.length)return;
    const set=new Set(uids); let count=0;
    state.hand=state.hand.filter(c=>{if(set.has(c.uid)){state.discard.push(c);count++;return false}return true});
    state.selected=[]; state.redraws--; state.lockedUid=null; draw(count); SFX.shuffle(); addLog(`换手 ${count} 张`); render();
  }

  function battleWin(){
    busy=true; SFX.win(); state.stats.battles++; state.money+=enc().reward;
    toast(`击破！获得 ${enc().reward} 両`,'good'); burstAtCenter(34,'#63f5df');
    if(state.encounterIndex===ENCOUNTERS.length-1){setTimeout(()=>gameOver(true),700);return}
    setTimeout(()=>openShop(),650);
  }

  function openShop(){
    state.phase='shop'; busy=false; generateShop(); render();
  }

  function rarityRoll(){
    const r=Math.random();
    if(r>.97)return'legendary'; if(r>.88)return'epic'; if(r>.68)return'rare'; if(r>.38)return'uncommon'; return'common';
  }
  function generateShop(){
    const ninjaPool=shuffle(NINJAS.filter(n=>Math.random()<.6||n.rarity===rarityRoll())).slice(0,3);
    while(ninjaPool.length<3) ninjaPool.push(pick(NINJAS));
    const relicPool=shuffle(RELICS.filter(r=>!state.relics.includes(r.id))).slice(0,3);
    state.shopItems=[
      ...ninjaPool.slice(0,3).map(n=>({type:'ninja',id:n.id,cost:rarityPrice[n.rarity]+Math.floor(state.encounterIndex/4),sold:false})),
      ...relicPool.slice(0,2).map(r=>({type:'relic',id:r.id,cost:r.cost,sold:false})),
      {type:'train',id:'train',cost:6+Math.floor(state.encounterIndex/3),sold:false}
    ];
  }

  function buy(i){
    if(state.phase!=='shop')return; const item=state.shopItems[i]; if(!item||item.sold)return;
    if(state.money<item.cost){toast('両不够','bad');SFX.fail();return}
    if(item.type==='relic'&&state.relics.length>=5){toast('秘卷栏已满：先出售一个','bad');SFX.fail();return}
    state.money-=item.cost; item.sold=true; SFX.buy();
    if(item.type==='ninja'){state.deck.push(makeCard(item.id));state.stats.recruits++;toast(`${byId[item.id].short} 加入队伍`,'good');}
    if(item.type==='relic'){state.relics.push(item.id);state.stats.relicsBought++;toast(`获得 ${relicById[item.id].name}`,'good');}
    if(item.type==='train'){state.training+=6;toast('全队修炼：基础威力 +6','good');}
    render();
  }

  function sellRelic(id){
    if(state.phase!=='shop')return; const idx=state.relics.indexOf(id); if(idx<0)return;
    const r=relicById[id]; const gain=Math.max(2,Math.floor(r.cost/2));
    state.relics.splice(idx,1); state.money+=gain; SFX.buy(); toast(`出售 ${r.name}，+${gain} 両`,'good'); render();
  }

  function rerollShop(){
    if(state.phase!=='shop')return;
    if(state.money<state.shopRerollCost){toast('両不够','bad');return}
    state.money-=state.shopRerollCost; state.shopRerollCost=Math.min(8,state.shopRerollCost+1); SFX.shuffle(); generateShop(); render();
  }
  function nextBattle(){
    if(state.phase!=='shop')return; state.encounterIndex++; state.shopRerollCost=3; startBattle();
  }

  function gameOver(win){
    state.phase=win?'victory':'gameover'; busy=false; if(win){SFX.win();burstAtCenter(80,'#ffd36b')}else SFX.fail(); render();
  }

  function cardHtml(c){
    const n=byId[c.id], sel=state.selected.indexOf(c.uid), locked=c.uid===state.lockedUid;
    const art=CARD_ART.ninja[n.id]||'';
    return `<div class="ninja-card holo-card ${n.rarity} ${sel>=0?'selected':''} ${locked?'locked':''}" data-uid="${c.uid}" onclick="Game.toggleCard('${c.uid}')">
      <img class="full-card-art" src="${art}" alt="${n.name}" draggable="false">
      <div class="foil-layer"></div><div class="shine-layer"></div><div class="order-badge">${sel+1}</div>
      <div class="game-stat-strip"><b>威 ${Math.round(n.power+state.training+c.bonus)}</b><b>×${n.mult.toFixed(2)}</b></div>
    </div>`;
  }

  function relicHtml(id){const r=relicById[id],art=CARD_ART.relic[id]||'';return `<div class="relic holo-relic ${r.rarity}"><img class="relic-art" src="${art}" alt="${r.name}" draggable="false"><div class="relic-copy"><div class="relic-name">${r.name}</div><div class="relic-text">${r.text}</div></div></div>`}
  function battleShell(){
    const e=enc(), pct=clamp(state.score/e.target*100,0,100);
    const handHtml=state.hand.map(cardHtml).join('');
    const relics=state.relics.map(relicHtml).join('')+Array.from({length:Math.max(0,5-state.relics.length)},()=>'<div class="empty-slot">空秘卷槽</div>').join('');
    const boss=e.mod?(BOSS_TEXT[e.mod]+(state.bossSealElement?` 当前封印：${state.bossSealElement}`:'')):'';
    const chapterProgress=[1,2,3].map(w=>`<i class="${w<=e.wave?'on':''}"></i>`).join('');
    return `<div class="shell" id="shell">
      <header class="topbar"><div class="brand"><div class="brand-mark">忍</div><div><div class="brand-title">SHINOBI CASCADE</div><div class="brand-sub">忍 界 连 锁</div></div></div>
      <div class="stage"><b>第 ${e.chapter} 章</b>${chapterProgress}<span style="font-size:10px;color:#6f8994">${e.wave}/3</span></div>
      <div class="resources"><div class="pill">両 <strong>${state.money}</strong></div><button class="iconbtn" onclick="Game.toggleHelp()">?</button><button class="iconbtn" onclick="Game.toggleSound()">${SFX.enabled?'♪':'×'}</button></div></header>
      <main class="main">
        <aside class="panel left"><div class="panel-title">Threat / 威胁目标</div><div class="enemy-card"><div class="enemy-kicker">${e.title}</div><div class="enemy-name">${e.name}</div><div class="target-row">击破阈值</div><div class="target-num">${fmt(e.target)}</div><div class="boss-mod">${boss}</div></div>
          <div class="progress-box"><div class="progress-label"><span>本战伤害</span><b>${fmt(state.score)} / ${fmt(e.target)}</b></div><div class="bar"><i style="width:${pct}%"></i></div></div>
          <div class="stat-grid"><div class="stat"><span>剩余出击</span><strong class="cyan">${state.playsLeft}</strong></div><div class="stat"><span>剩余换手</span><strong class="gold">${state.redraws}</strong></div><div class="stat"><span>队伍</span><strong>${state.deck.length}</strong></div><div class="stat"><span>修炼</span><strong>+${state.training}</strong></div></div>
          <div class="help">按选择顺序触发连携。<br><span class="kbd">Enter</span> 出击　<span class="kbd">R</span> 换手<br><span class="kbd">1–8</span> 快速选牌</div>
        </aside>
        <section class="panel board"><div class="arena"><div class="arena-rings"></div><div class="score-stage"><div class="chain-title" id="chainTitle">${state.selected.length?`已结印 ${state.selected.length}/${maxSelect()} · 顺序决定连携`:'选择忍者，开始结印'}</div><div class="big-score" id="scoreNum">${fmt(state.score)}</div><div class="equation"><span>本战累计</span><b>${exact(state.score)}</b><span class="mul">/</span><span>威胁 ${exact(e.target)}</span></div><div class="combo-stack" id="comboStack"></div></div></div>
          <div class="hand-zone"><div class="hand-meta"><span>HAND / 手牌 ${state.hand.length}</span><span>${state.lockedUid?'神树锁定 1 张':''}</span></div><div class="hand">${handHtml}</div></div>
        </section>
        <aside class="panel right"><div class="panel-title">Scrolls / 秘卷构筑 ${state.relics.length}/5</div><div class="relic-list">${relics}</div><div class="deck-mini"><div class="panel-title">Build / 当前构筑</div><div class="deck-summary">${buildTags().map(x=>`<span class="deck-tag">${x}</span>`).join('')}</div></div><div class="log"><div class="panel-title">Battle log</div>${state.log.map(x=>`<div class="log-line">${x}</div>`).join('')}</div></aside>
      </main>
      <footer class="actions"><button class="action danger" onclick="Game.redraw()" ${state.redraws<=0||busy?'disabled':''}>换手 <small>R · ${state.redraws} 次</small></button><div class="selected-info"><b>${state.selected.length}</b>已选择</div><button class="action primary" onclick="Game.play()" ${!state.selected.length||busy?'disabled':''}>结印出击 <small>ENTER · ${state.playsLeft} 次</small></button></footer>
    </div>`;
  }

  function buildTags(){
    const ns=state.deck.map(c=>byId[c.id]); const allTeams=ns.flatMap(n=>n.teams), allEls=ns.flatMap(n=>n.elements);
    const count=a=>Object.entries(a.reduce((o,x)=>(o[x]=(o[x]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]);
    const tags=[]; count(allTeams).slice(0,3).forEach(([k,v])=>{if(v>=2)tags.push(`${k} ×${v}`)}); count(allEls).slice(0,3).forEach(([k,v])=>tags.push(`${k} ×${v}`));
    return tags.slice(0,6);
  }

  function renderMenu(){
    return `<div class="overlay"><div class="modal hero-modal"><div class="hero-logo">忍</div><h1>SHINOBI<br>CASCADE<em>忍 界 连 锁</em></h1><p>不是扑克换皮：用<strong>忍术顺序、小队羁绊、属性相生与宿命关系</strong>构筑连锁。前期几千伤害，后期让倍率彻底失控。</p><div class="feature-row"><div class="feature"><b>顺序即结印</b><span>先后手改变属性与战术连携</span></div><div class="feature"><b>5 张极限连锁</b><span>五遁、阵型、宿命可同时爆发</span></div><div class="feature"><b>18 场战斗</b><span>6 章 × 3 战，目标 20–30 分钟</span></div><div class="feature"><b>离线单 HTML</b><span>CSS 卡面 + WebAudio 合成音效</span></div></div><button class="startbtn" onclick="Game.start()">开始忍界远征</button><p class="small-note">非商业 fan-game 技术原型；未使用官方图片、Logo 或音频素材。</p></div></div>`;
  }

  function shopItemHtml(item,i){
    if(item.type==='ninja'){
      const n=byId[item.id], art=CARD_ART.ninja[n.id]||''; return `<div class="shop-item card-shop ${item.sold?'sold':''}" onclick="Game.buy(${i})"><img class="shop-card-art" src="${art}" alt="${n.name}"><div class="shop-overlay"><h3>招募 · ${n.short}</h3><p>${n.teams.join(' / ')} · ${n.elements.join('')} · ${n.roles.join('/')}<br>威力 ${n.power} · 单卡倍率 ×${n.mult.toFixed(2)}</p></div><div class="price">${item.cost} 両</div></div>`;
    }
    if(item.type==='relic'){
      const r=relicById[item.id], art=CARD_ART.relic[r.id]||''; return `<div class="shop-item card-shop ${item.sold?'sold':''}" onclick="Game.buy(${i})"><img class="shop-card-art" src="${art}" alt="${r.name}"><div class="shop-overlay"><h3>秘卷 · ${r.name}</h3><p>${r.text}</p></div><div class="price">${item.cost} 両</div></div>`;
    }
    return `<div class="shop-item ${item.sold?'sold':''}" onclick="Game.buy(${i})"><div class="bigicon">修</div><h3>全队特训</h3><p>全队所有卡牌基础威力永久 +6。越早购买收益越高。</p><div class="price">${item.cost} 両</div></div>`;
  }

  function renderShop(){
    const e=enc(), next=ENCOUNTERS[state.encounterIndex+1];
    return `${battleShell()}<div class="overlay"><div class="modal"><div class="shop-head"><div><div class="panel-title">POST BATTLE / 战后补给</div><h2>${e.name} · 已击破</h2><p>下一战：第 ${next.chapter} 章 ${next.wave}/3 · ${next.name} · 目标 ${fmt(next.target)}</p></div><div class="money">${state.money} 両</div></div>
      <div class="shop-section-title">RECRUIT / SCROLL / TRAINING</div><div class="shop-grid">${state.shopItems.map(shopItemHtml).join('')}</div>
      <div class="shop-section-title">OWNED SCROLLS · 点击出售（50% 回收）</div><div class="owned-relics">${state.relics.map(id=>`<span class="owned-chip" onclick="Game.sellRelic('${id}')">${relicById[id].icon} ${relicById[id].name}</span>`).join('')||'<span style="color:#607985;font-size:10px">暂无秘卷</span>'}</div>
      <div class="shop-foot"><button onclick="Game.rerollShop()">重掷商品 · ${state.shopRerollCost} 両</button><button class="next" onclick="Game.nextBattle()">前往下一战 →</button></div></div></div>`;
  }

  function renderEnd(win){
    const sec=Math.max(1,Math.floor((Date.now()-state.stats.startTime)/1000)), min=Math.floor(sec/60), s=sec%60;
    const rank=win?(state.stats.maxHit>1e10?'SSS':state.stats.maxHit>1e9?'SS':'S'):'D';
    return `<div class="overlay"><div class="modal endbox"><div class="rank">${rank}</div><h2>${win?'忍界连锁完成':'远征中断'}</h2><p style="color:#829aa4">${win?'你把连携系统推到了终焉之谷之外。':'构筑还没成型。换一种羁绊与秘卷路线再来。'}</p><div class="endstats"><div><span>推进战斗</span><b>${state.stats.battles}/${ENCOUNTERS.length}</b></div><div><span>最大单击</span><b>${fmt(state.stats.maxHit)}</b></div><div><span>累计伤害</span><b>${fmt(state.stats.totalDamage)}</b></div><div><span>用时</span><b>${min}:${String(s).padStart(2,'0')}</b></div></div><button class="startbtn" onclick="Game.start()">重新远征</button></div></div>`;
  }

  function helpOverlay(){
    if(!state.helpOpen)return'';
    return `<div class="overlay" onclick="Game.toggleHelp()"><div class="modal" onclick="event.stopPropagation()"><div class="shop-head"><div><div class="panel-title">COMBO CODEX</div><h2>忍术连携图鉴</h2><p>选择顺序会改变相邻卡牌的连携判定。</p></div><button class="iconbtn" onclick="Game.toggleHelp()">×</button></div><div class="tutorial">${COMBO_GLOSSARY.map(([a,b])=>`<div class="tutorial-card"><b>${a}</b><p>${b}</p></div>`).join('')}</div><p class="small-note">提示：高阶伤害通常来自“基础队伍羁绊 × 宿命 × 属性顺序 × 秘卷”的乘法叠加，而不是单张稀有卡。</p></div></div>`;
  }

  function render(){
    if(state.phase==='menu'||!state.phase) app.innerHTML=renderMenu();
    else if(state.phase==='battle') app.innerHTML=battleShell()+helpOverlay();
    else if(state.phase==='shop') app.innerHTML=renderShop()+helpOverlay();
    else app.innerHTML=renderEnd(state.phase==='victory');
    requestAnimationFrame(bindHoloTilt);
  }

  function animateResolution(result){
    const stack=document.getElementById('comboStack');
    if(stack){ stack.innerHTML=''; [...result.combos,...result.relicSteps].slice(0,12).forEach((c,i)=>setTimeout(()=>{
      if(!document.body.contains(stack))return; const el=document.createElement('div');
      el.className='combo-chip '+(c.kind==='legend'?'legend':c.kind==='hot'?'hot':''); el.textContent=`${c.name} ×${c.mult.toFixed(c.mult>=10?0:2)}`; stack.appendChild(el); SFX.combo(i+1);
    },i*85)); }
    const score=document.getElementById('scoreNum');
    if(score){score.animate([{transform:'scale(.82)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.16,.8,.2,1)'});}
    const power=Math.min(12,Math.max(2,Math.log10(Math.max(10,result.damage))));
    SFX.impact(power); if(result.damage>1e6)SFX.explosion();
    spawnFloat(`+${fmt(result.damage)}`,50,44,result.damage>1e7?'#ffd36b':'#ffffff');
    burstAtCenter(Math.min(70,18+result.combos.length*5),result.damage>1e7?'#ffd36b':'#5ff5df');
    if(result.damage>enc().target*.6) shake();
    if(result.damage>enc().target*1.5) flash();
  }

  function spawnFloat(text,xPct,yPct,color){
    const d=document.createElement('div');d.className='float-num';d.textContent=text;d.style.left=xPct+'%';d.style.top=yPct+'%';d.style.color=color;document.body.appendChild(d);setTimeout(()=>d.remove(),1150);
  }
  function burstAtCenter(count,color){
    const cx=innerWidth*.5,cy=innerHeight*.45;
    for(let i=0;i<count;i++){
      const p=document.createElement('i');p.className='particle';const a=Math.random()*Math.PI*2,r=60+Math.random()*260;
      p.style.left=(cx+(Math.random()-.5)*60)+'px';p.style.top=(cy+(Math.random()-.5)*35)+'px';p.style.setProperty('--x',Math.cos(a)*r+'px');p.style.setProperty('--y',Math.sin(a)*r+'px');p.style.setProperty('--d',(.55+Math.random()*.65)+'s');p.style.setProperty('--p',color);document.body.appendChild(p);setTimeout(()=>p.remove(),1300);
    }
  }
  function shake(){const sh=document.getElementById('shell');if(sh){sh.classList.remove('screen-shake');void sh.offsetWidth;sh.classList.add('screen-shake');}}
  function flash(){let f=document.querySelector('.flash');if(!f){f=document.createElement('div');f.className='flash';document.body.appendChild(f)}f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}
  function toast(text,type='good'){
    let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}
    t.textContent=text;t.className=`toast ${type} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1600);
  }
  function toggleHelp(){state.helpOpen=!state.helpOpen;SFX.tap();render()}
  function toggleSound(){SFX.toggle();render()}

  function key(e){
    if(state.phase==='battle'&&!state.helpOpen){
      if(e.key==='Enter'){e.preventDefault();play()}
      else if(e.key.toLowerCase()==='r'){e.preventDefault();redraw()}
      else if(/^[1-8]$/.test(e.key)){const c=state.hand[Number(e.key)-1];if(c)toggleCard(c.uid)}
    }
    if(e.key==='Escape'&&state.helpOpen)toggleHelp();
  }
  window.addEventListener('keydown',key);

  state=freshState(); render();

  function bindHoloTilt(){
    document.querySelectorAll('.holo-card,.card-shop').forEach(el=>{
      if(el.dataset.tiltBound)return; el.dataset.tiltBound='1';
      el.addEventListener('pointermove',ev=>{const r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;el.style.setProperty('--mx',(x*100)+'%');el.style.setProperty('--my',(y*100)+'%');el.style.setProperty('--rx',((.5-y)*10)+'deg');el.style.setProperty('--ry',((x-.5)*12)+'deg');});
      el.addEventListener('pointerleave',()=>{el.style.removeProperty('--rx');el.style.removeProperty('--ry');});
    });
  }
  return {start,toggleCard,play,redraw,buy,sellRelic,rerollShop,nextBattle,toggleHelp,toggleSound};
})();
