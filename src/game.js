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
  let detail = null, libraryTab = 'ninja', libraryFilter = '', mapOpen = false, combatSheetOpen=false, combatSheetTab='relics';
  const SAVE_KEY='shinobi-cascade-v3';
  let saveWarning=false;
  let homeRequested=false;
  function save(){
    if(!['battle','shop'].includes(state.phase)||busy)return;
    try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:3,state,uidCounter}));}catch(e){saveWarning=true;}
  }
  function savedRun(){try{
    let v=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!v){const legacy=JSON.parse(localStorage.getItem('shinobi-cascade-v2'));if(legacy?.version===2){const seed=newSeed();legacy.version=3;legacy.state={...legacy.state,seed,rngState:seed,awakenings:{},weakElement:null};v=legacy}}
    return v?.version===3&&['battle','shop'].includes(v.state?.phase)&&v.state.deck.every(c=>byId[c.id])&&v.state.relics.every(id=>relicById[id])?v:null
  }catch(e){return null}}
  function resume(){const v=savedRun();if(!v)return;state=v.state;uidCounter=v.uidCounter;busy=false;state.selected=[];state.helpOpen=false;state.awakenings||={};detail=null;mapOpen=false;combatSheetOpen=false;render();}
  function home(){
    if(busy){homeRequested=true;toast('结算完成后自动保存并返回主页');return;}
    save();state=freshState();detail=null;mapOpen=false;combatSheetOpen=false;homeRequested=false;render();
  }
  function clearSave(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem('shinobi-cascade-v2')}catch(e){}}
  function viewCard(kind,id){detail={kind,id};render();}
  function closeDetail(){detail=null;render();}
  function toggleMap(){mapOpen=!mapOpen;combatSheetOpen=false;render();}
  function toggleCombatSheet(tab='relics'){combatSheetTab=tab;combatSheetOpen=!combatSheetOpen;render();}
  function setCombatSheet(tab){combatSheetTab=tab;combatSheetOpen=true;render();}
  function setLibrary(tab){libraryTab=tab;libraryFilter='';render();}
  function filterLibrary(value){libraryFilter=value;const grid=document.getElementById('libraryGrid');if(grid)grid.innerHTML=libraryGrid();}
  function chooseBoon(id){if(state.phase!=='shop'||!state.boonPending)return;const b=BOONS.find(x=>x.id===id);if(!b)return;
    if(id==='power')state.training+=12;if(id==='fortune')state.money+=12;if(id==='focus')state.focus=Math.min(3,state.focus+1);
    state.boonPending=false;toast(b.name,'good');render();
  }
  function retire(uid){if(state.phase!=='shop'||state.deck.length<=8||state.money<3)return;const i=state.deck.findIndex(c=>c.uid===uid);if(i<0)return;state.deck.splice(i,1);state.money-=3;toast('精简队伍 · 返乡休整','good');render();}


  function freshState(){
    return {
      phase:'menu', encounterIndex:0, money:16, focus:0, boonPending:false, previousCount:0, lastResult:null, peakThreat:0, deck:[], drawPile:[], discard:[], hand:[], selected:[],
      relics:[], score:0, playsLeft:4, redraws:2, training:0, shopItems:[], shopRerollCost:3,
      log:[], helpOpen:false, bossSealElement:null, weakElement:null, lockedUid:null, drawPenalty:0, awakenings:{}, seed:0, rngState:0,
      battleFlags:{}, stats:{totalDamage:0,maxHit:0,totalCombos:0,battles:0,recruits:0,relicsBought:0,startTime:Date.now()}
    };
  }

  function makeCard(id){ return {uid:`c${uidCounter++}`, id, bonus:0}; }
  function newSeed(){return ((Date.now()>>>0)^((typeof performance!=='undefined'?performance.now()*1000:0)>>>0)^0x9e3779b9)>>>0||1}
  function gameRandom(){let x=(state.rngState||state.seed||1)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;state.rngState=x>>>0;return state.rngState/4294967296}
  function shuffle(a){
    const b=[...a];
    for(let i=b.length-1;i>0;i--){const j=Math.floor(gameRandom()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
    return b;
  }
  function pick(arr){ return arr[Math.floor(gameRandom()*arr.length)]; }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hasRelic(id){return state.relics.includes(id)}
  function enc(){const e=ENCOUNTERS[state.encounterIndex];return {...e,target:Math.round(e.target*1.75**(state.bossPhase||0)),phases:e.mod?(e.chapter<=5?2:3):1};}
  function currentRule(){if(Object.prototype.hasOwnProperty.call(state,'ruleOverride'))return state.ruleOverride;const e=enc();return e.mod?(e.phaseRules||BOSS_PHASE_RULES[e.mod]||[])[state.bossPhase||0]||e.rule:e.rule}
  function fmt(n){
    n=Math.max(0,Math.round(n||0));
    if(n<10000) return n.toLocaleString('zh-CN');
    if(n<1e8) return (n/1e4).toFixed(n<1e5?1:0)+'万';
    if(n<1e12) return (n/1e8).toFixed(n<1e9?2:1)+'亿';
    return (n/1e12).toFixed(2)+'万亿';
  }
  function exact(n){ return Math.round(n||0).toLocaleString('zh-CN'); }
  function addLog(text){state.log.unshift(text);state.log=state.log.slice(0,7)}

  function start(build='leaf',seed=null){
    state=freshState(); uidCounter=1;const querySeed=typeof location!=='undefined'?Number(new URLSearchParams(location.search).get('seed')):0;state.seed=(Number(seed)||querySeed||newSeed())>>>0;state.rngState=state.seed;
    const kit=STARTER_BUILDS[build]||STARTER_BUILDS.leaf;
    state.deck=kit.ids.map(makeCard);state.build=build;
    state.relics=['chakra_thread',kit.relic];
    busy=false;detail=null;mapOpen=false;
    state.stats.startTime=Date.now();
    startBattle();
    SFX.tap();
  }

  function startBattle(){
    state.phase='battle'; state.score=0; state.playsLeft=4; state.redraws=2+state.focus; state.selected=[];
    state.drawPile=shuffle(state.deck); state.discard=[]; state.hand=[]; state.lockedUid=null; state.drawPenalty=0;
    state.battleFlags={medical_used:false,limit_used:false};state.previousCount=0;state.lastResult=null;state.bossPhase=0;busy=false;
    state.bossSealElement=enc().mod==='genjutsu' ? pick(['风','火','水','土','雷','阴','体']) : null;
    state.weakElement=currentRule()==='weakness'?pick(['风','火','水','土','雷','阴','体']):null;
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
    if(state.phase!=='battle'||busy||state.helpOpen||detail||mapOpen) return;
    if(uid===state.lockedUid){toast('这张牌被神树根界锁住了','bad');SFX.fail();return}
    const idx=state.selected.indexOf(uid);
    if(idx>=0){state.selected.splice(idx,1);SFX.deselect();}
    else{
      if(state.selected.length>=maxSelect()){toast(`本战最多选择 ${maxSelect()} 张`,'bad');SFX.fail();return}
      state.selected.push(uid); SFX.select(state.selected.length);
    }
    render();
  }
  function moveSelected(uid,dir){const i=state.selected.indexOf(uid),j=i+dir;if(i<0||j<0||j>=state.selected.length)return;[state.selected[i],state.selected[j]]=[state.selected[j],state.selected[i]];SFX.tap();render()}
  function reorderSelected(from,to){const a=state.selected.indexOf(from),b=state.selected.indexOf(to);if(a<0||b<0||a===b)return;state.selected.splice(b,0,state.selected.splice(a,1)[0]);SFX.tap();render()}
  function chainDragStart(ev,uid){ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',uid)}
  function chainDrop(ev,uid){ev.preventDefault();reorderSelected(ev.dataTransfer.getData('text/plain'),uid)}

  function selectedCards(){
    return state.selected.map(uid=>state.hand.find(c=>c.uid===uid)).filter(Boolean).map(inst=>({inst,n:byId[inst.id]}));
  }

  function pairHas(a,b,ea,eb){ return a.elements.includes(ea)&&b.elements.includes(eb); }
  function addCombo(combos,name,mult,kind='normal'){ combos.push({name,mult,kind}); }

  function evaluate(cards, commit=false){
    const ninjas=cards.map(c=>c.n), ids=new Set(ninjas.map(n=>n.id));
    const tags=new Set(ninjas.flatMap(n=>n.tags));
    const roles=new Set(ninjas.flatMap(n=>n.roles));
    const elements=new Set(ninjas.flatMap(n=>n.elements));
    const combos=[];
    let base=0, baseMult=1;
    const rule=currentRule();
    ninjas.forEach((n,i)=>{
      const awakening=state.awakenings?.[n.id]||0;
      let p=n.power+state.training+cards[i].inst.bonus+awakening*12;
      if(enc().mod==='mist'&&i===0) p*=.45;
      if(enc().mod==='rift'&&ninjas.length>=3&&i===ninjas.length-1)p=0;
      if(state.bossSealElement && n.elements.includes(state.bossSealElement)) p*=.5;
      if(rule==='fire_suppression'&&n.elements.includes('火'))p*=.5;
      if(rule==='finisher'&&i===ninjas.length-1)p*=2;
      if(rule==='weakness'&&state.weakElement&&n.elements.includes(state.weakElement))p*=1.8;
      base+=p; baseMult*=n.mult;
      if(awakening>=2)baseMult*=1.12;
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
    for(const rule of EXTRA_TEAMS){
      const matched=rule.ids?rule.ids.every(id=>ids.has(id)):ninjas.filter(n=>n.teams.includes(rule.team)).length>=rule.count;
      if(matched)addCombo(combos,rule.name,rule.mult,'team');
    }
    const destiny=[];
    for(const rule of EXTRA_DESTINY)if(rule.ids.every(id=>ids.has(id)))destiny.push([rule.name,rule.mult]);
    if(ids.has('naruto')&&ids.has('sasuke')) destiny.push(['宿命·双星',3.7]);
    if(ids.has('sasuke')&&ids.has('itachi')) destiny.push(['宿命·兄弟之眼',4.5]);
    if(ids.has('naruto')&&ids.has('jiraiya')) destiny.push(['宿命·师徒螺旋',3.0]);
    if(ids.has('naruto')&&ids.has('minato')) destiny.push(['宿命·父子飞雷',3.8]);
    if(ids.has('naruto')&&ids.has('gaara')) destiny.push(['宿命·人柱力共鸣',2.2]);
    if(ids.has('guy')&&ids.has('lee')) destiny.push(['宿命·青春传承',3.0]);
    if(ids.has('hashirama')&&ids.has('madara')) destiny.push(['宿命·终焉之谷',9.0]);
    destiny.forEach(d=>addCombo(combos,d[0],d[1],'legend'));

    // Ordered elemental / tactical chains.
    const orderedStart=combos.length;
    let raijinLinks=0;
    for(let i=0;i<ninjas.length-1;i++){
      const a=ninjas[i], b=ninjas[i+1];
      if(pairHas(a,b,'风','火')) addCombo(combos,'风遁 → 火遁 · 风助火势',1.85,'normal');
      if(pairHas(a,b,'水','雷')) addCombo(combos,'水遁 → 雷遁 · 感电场',2.25,'hot');
      if(pairHas(a,b,'火','雷')) addCombo(combos,'火遁 → 雷遁 · 炎雷贯穿',2.05,'hot');
      if(pairHas(a,b,'土','水')||pairHas(a,b,'水','土')) addCombo(combos,'土水相生 · 地脉涌流',1.8,'normal');
      if(pairHas(a,b,'雷','风')||pairHas(a,b,'风','雷')){ addCombo(combos,'风雷瞬连 · 超速术式',2.35,'hot'); raijinLinks++; }
      if(pairHas(a,b,'阴','体'))addCombo(combos,'阴→体·破幻追击',1.7,'hot');
      if(a.roles.includes('战术')&&b.roles.includes('控制'))addCombo(combos,'战术→控制·先读封锁',1.45);
      if(a.elements.includes('体')&&b.elements.includes('体')) addCombo(combos,'体术追击 · 无间连打',1.55,'hot');
      if((a.roles.includes('医疗')||a.roles.includes('支援'))&&b.roles.includes('强攻')) addCombo(combos,'医疗增幅 → 强攻',1.65,'normal');
      if(a.roles.includes('控制')&&b.roles.includes('强攻')) addCombo(combos,'控制锁定 → 斩杀',1.5,'normal');
    }

    const orderedEnd=combos.length;
    if(elements.size===3) addCombo(combos,'三性变化·复合忍术',2.25,'normal');
    if(elements.size===4) addCombo(combos,'四象联弹·属性共振',4.8,'hot');
    if(elements.size>=5) addCombo(combos,'五遁大连弹·属性崩解',13,'legend');
    if(roles.has('强攻')&&roles.has('控制')&&(roles.has('医疗')||roles.has('支援'))&&roles.has('战术')) addCombo(combos,'完美阵型·攻控辅策',4.2,'team');
    if(tags.has('写轮眼')&&tags.has('幻术')) addCombo(combos,'写轮眼·幻术增幅',1.8,'hot');
    if(tags.has('仙人')&&tags.has('螺旋丸')) addCombo(combos,'仙术·螺旋共振',2.4,'legend');
    if(tags.has('木遁')&&elements.has('土')&&elements.has('水')) addCombo(combos,'木遁·森罗生长',2.8,'legend');

    for(const r of EXTRA_TAG_RULES)if(tags.has(r.tag)&&(r.elements?r.elements.every(e=>elements.has(e)):roles.has(r.role)))addCombo(combos,r.name,r.mult,'hot');

    combos.forEach((c,i)=>{c.nominalMult=c.mult;c.mult=Math.pow(c.mult,i>=orderedStart&&i<orderedEnd?1:.38);});
    let comboMult=combos.reduce((m,c)=>m*c.mult,1);
    const relicSteps=[];
    const attackCount=ninjas.filter(n=>n.roles.includes('强攻')).length;
    const medCount=ninjas.filter(n=>n.roles.includes('医疗')).length;
    const jinCount=ninjas.filter(n=>n.tags.includes('人柱力')).length;
    const destinyCount=destiny.length;
    const maxTeamCount=Math.max(0,...Object.values(ninjas.flatMap(n=>n.teams).reduce((o,t)=>(o[t]=(o[t]||0)+1,o),{})));
    let finalMult=1;

    function rel(name,m,kind='relic'){ if(m!==1){const effective=kind==='relic'&&m>1?Math.pow(m,.38):m;finalMult*=effective;relicSteps.push({name,mult:effective,kind});} }
    if(rule==='trio'&&cards.length===3)rel('战场·三人结印',2,'rule');
    if(rule==='exact_four'&&cards.length===4)rel('战场·精英阵式',2.5,'rule');
    if(rule==='support_first'&&ninjas[0]&&ninjas[0].roles.some(r=>['支援','医疗','战术'].includes(r)))rel('战场·战地补给',2,'rule');
    if(rule==='crescendo'&&state.previousCount&&cards.length===state.previousCount+1)rel('战场·连携升温',2.2,'rule');
    if(rule==='diverse'&&ninjas.some((n,i)=>i&&n.elements[0]===ninjas[i-1].elements[0]))rel('战场·忍术反噬',.65,'boss');
    if(hasRelic('shadow_scroll')&&attackCount) rel('秘卷·多重影分身',Math.pow(1.28,attackCount));
    if(hasRelic('chakra_thread')&&elements.size>1){ const m=1+.35*(elements.size-1); base*=m; relicSteps.push({name:`查克拉丝线 +${Math.round((m-1)*100)}%威力`,mult:m,kind:'base'}); }
    if(hasRelic('medical_seal')&&medCount){ rel('百豪储备',2.2); if(!state.battleFlags.medical_used){rel('百豪·首次释放',1.6); if(commit)state.battleFlags.medical_pending=true;} }
    if(hasRelic('sharingan')&&combos.length) rel('写轮眼·看破连携',Math.pow(1.16,combos.length));
    if(hasRelic('sage_mode')&&cards.length>=4) rel('仙人模式',3);
    if(hasRelic('curse_mark')&&cards.length===3){rel('咒印暴走',4.5); if(commit)state.battleFlags.curse_pending=true;}
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

    const tagged=t=>ninjas.filter(n=>n.tags.includes(t)).length;
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
    if(rule==='precision'&&![3,4].includes(cards.length))rel('精准结印·张数不符',.25,'boss');
    if(rule==='reversal'&&ninjas[0])rel('逆流领域',ninjas[0].roles.some(r=>['支援','医疗','战术'].includes(r))?1.5:ninjas[0].roles.includes('强攻')?.35:1,'boss');
    if(rule==='silence'&&!roles.has('控制'))rel('静默·缺少控制',.3,'boss');
    if(rule==='adaptation'&&state.previousCount===cards.length)rel('战术适应',.2,'boss');
    // Chapter mastery lets all viable archetypes scale; relics still multiply on top.
    const mastery=1.08**(enc().chapter-1);rel('远征熟练度',mastery);
    const damage=Math.min(Number.MAX_SAFE_INTEGER,Math.round(base*baseMult*comboMult*finalMult));
    return {base,baseMult,comboMult,finalMult,damage,combos,relicSteps,elements:[...elements],destinyCount};
  }

  function play(){
    if(state.phase!=='battle'||busy||!state.selected.length||state.helpOpen||detail||mapOpen) return;
    const cards=selectedCards(); if(!cards.length)return;
    busy=true; SFX.shuffle();
    const playing=[...state.selected];
    render();
    playing.forEach((uid,i)=>{const el=document.querySelector(`[data-uid="${uid}"]`);if(el){el.classList.add('playing');el.style.setProperty('--tilt',`${(i-(playing.length-1)/2)*3}deg`);}});
    setTimeout(()=>resolvePlay(cards,playing),430);
  }

  function resolvePlay(cards,playing){
    const result=evaluate(cards,true);state.lastResult=result;state.previousCount=cards.length;
    state.playsLeft--;
    state.score=Math.min(Number.MAX_SAFE_INTEGER,state.score+result.damage);
    state.stats.totalDamage+=result.damage; state.stats.maxHit=Math.max(state.stats.maxHit,result.damage); state.stats.totalCombos+=result.combos.length+result.relicSteps.length;
    if(state.battleFlags.medical_pending){state.battleFlags.medical_used=true;delete state.battleFlags.medical_pending;}
    if(state.battleFlags.curse_pending){state.drawPenalty=1;delete state.battleFlags.curse_pending;}

    const selectedSet=new Set(playing);
    state.hand=state.hand.filter(c=>{if(selectedSet.has(c.uid)){state.discard.push(c);return false}return true});
    state.selected=[];
    if(enc().mod==='roots'&&state.hand.length){state.lockedUid=pick(state.hand).uid;} else state.lockedUid=null;
    draw(cards.length);
    if(enc().mod==='genjutsu'){
      const old=state.bossSealElement;state.bossSealElement=pick(['风','火','水','土','雷','阴','体'].filter(e=>e!==old));
      addLog(`幻术转移：${state.bossSealElement}属性被封印`);setTimeout(()=>toast(`幻术转移 · ${state.bossSealElement}属性封印`,'bad'),80);
    }
    if(currentRule()==='weakness'){
      const old=state.weakElement;state.weakElement=pick(['风','火','水','土','雷','阴','体'].filter(e=>e!==old));
      addLog(`弱点轮换：${state.weakElement}属性增幅`);
    }

    if(hasRelic('limit_break')&&!state.battleFlags.limit_used&&result.damage>enc().target*1.5){
      state.training+=4; state.battleFlags.limit_used=true; addLog('限界突破：全队基础威力永久 +4');
    }
    addLog(`连携 ${result.combos.length} 段，造成 ${fmt(result.damage)}`);
    render();
    animateResolution(result);

    setTimeout(()=>{
      if(state.score>=enc().target){if((state.bossPhase||0)+1<enc().phases)breakBarrier();else battleWin();}
      else if(state.playsLeft<=0){gameOver(false);}
      else {busy=false; render();}
    },Math.min(1050+result.combos.length*90,2200));
  }

  function redraw(){
    if(state.phase!=='battle'||busy||state.redraws<=0||state.helpOpen||detail||mapOpen)return;
    let uids=[...state.selected];
    if(!uids.length) uids=shuffle(state.hand.filter(c=>c.uid!==state.lockedUid)).slice(0,Math.min(3,state.hand.length)).map(c=>c.uid);
    if(!uids.length)return;
    const set=new Set(uids); let count=0;
    state.hand=state.hand.filter(c=>{if(set.has(c.uid)){state.discard.push(c);count++;return false}return true});
    state.selected=[]; state.redraws--; state.lockedUid=null; draw(count); SFX.shuffle(); addLog(`换手 ${count} 张`); render();
  }

  function breakBarrier(){
    state.bossPhase=(state.bossPhase||0)+1;state.score=0;state.redraws++;
    state.weakElement=currentRule()==='weakness'?pick(['风','火','水','土','雷','阴','体']):null;
    addLog(`击碎结界 · 第 ${state.bossPhase+1}/${enc().phases} 层`);SFX.win();burstAtCenter(45,'#c78aff');
    if(state.playsLeft<=0){gameOver(false);return;}
    toast(`结界破碎！下一层目标 ${fmt(enc().target)} · 换手 +1`,'good');busy=false;render();
  }

  function battleWin(){
    busy=true; SFX.win(); state.stats.battles++; state.money+=enc().reward+(hasRelic('treasure_frog')?4:0);state.training+=3+(hasRelic('training_weights')?5:0);
    state.boonPending=enc().wave===3;
    toast(`击破！获得 ${enc().reward} 両`,'good'); burstAtCenter(34,'#63f5df');
    if(state.encounterIndex===ENCOUNTERS.length-1){setTimeout(()=>gameOver(true),700);return}
    setTimeout(()=>openShop(),650);
  }

  function openShop(){
    state.phase='shop'; busy=false; generateShop(); render();
  }

  function rarityWeights(chapter=enc().chapter){
    if(chapter<=1)return {common:60,uncommon:30,rare:10,epic:0,legendary:0};
    if(chapter===2)return {common:49,uncommon:33,rare:13,epic:4,legendary:1};
    if(chapter===3)return {common:38,uncommon:32,rare:20,epic:8,legendary:2};
    if(chapter===4)return {common:28,uncommon:30,rare:25,epic:13,legendary:4};
    return {common:20,uncommon:26,rare:29,epic:18,legendary:7};
  }
  function rarityRoll(chapter=enc().chapter){
    let r=gameRandom()*100;for(const [rarity,weight] of Object.entries(rarityWeights(chapter))){r-=weight;if(r<0)return rarity}return'common';
  }
  function rollFrom(list,used,ownedTeams){
    const weights=rarityWeights(),unlocked=new Set(Object.entries(weights).filter(([,w])=>w>0).map(([r])=>r));
    const available=list.filter(x=>!used.has(x.id)&&unlocked.has(x.rarity));if(!available.length)return null;
    const wanted=rarityRoll(),order=['common','uncommon','rare','epic','legendary'],at=order.indexOf(wanted);
    let pool=available.filter(x=>x.rarity===wanted);
    for(let d=1;!pool.length&&d<order.length;d++){const rarity=order[Math.max(0,at-d)];if(unlocked.has(rarity))pool=available.filter(x=>x.rarity===rarity)}
    if(!pool.length)pool=available;
    const synergy=pool.filter(n=>n.teams?.some(t=>ownedTeams.has(t)));return pick(synergy.length&&gameRandom()<.68?synergy:pool);
  }
  function generateShop(){
    const ownedTeams=new Set(state.deck.flatMap(c=>byId[c.id].teams));
    const owned=new Set(state.deck.map(c=>c.id)),usedN=new Set(),usedR=new Set();
    const ninjaPool=[];while(ninjaPool.length<4){const n=rollFrom(NINJAS.filter(x=>!owned.has(x.id)),usedN,ownedTeams);if(!n)break;usedN.add(n.id);ninjaPool.push(n)}
    const relicPool=[];while(relicPool.length<3){const r=rollFrom(RELICS.filter(x=>!state.relics.includes(x.id)),usedR,new Set());if(!r)break;usedR.add(r.id);relicPool.push(r)}
    const awakenable=[...owned].filter(id=>(state.awakenings?.[id]||0)<3);
    const awakening=awakenable.length&&gameRandom()<.4?pick(awakenable):null;
    state.shopItems=[
      ...ninjaPool.slice(0,awakening?3:4).map(n=>({type:'ninja',id:n.id,cost:rarityPrice[n.rarity]+Math.floor(state.encounterIndex/4),sold:false})),
      ...(awakening?[{type:'awaken',id:awakening,cost:8+(state.awakenings?.[awakening]||0)*5+Math.floor(state.encounterIndex/5),sold:false}]:[]),
      ...relicPool.slice(0,3).map(r=>({type:'relic',id:r.id,cost:r.cost,sold:false})),
      {type:'train',id:'train',cost:6+Math.floor(state.encounterIndex/3),sold:false}
    ];
  }

  function buy(i){
    if(state.phase!=='shop')return; const item=state.shopItems[i]; if(!item||item.sold)return;
    if(state.money<item.cost){toast('両不够','bad');SFX.fail();return}
    if(item.type==='relic'&&state.relics.length>=5){toast('秘卷栏已满：先出售一个','bad');SFX.fail();return}
    state.money-=item.cost; item.sold=true; SFX.buy();
    if(item.type==='ninja'){state.deck.push(makeCard(item.id));state.stats.recruits++;toast(`${byId[item.id].short} 加入队伍`,'good');}
    if(item.type==='awaken'){const level=Math.min(3,(state.awakenings[item.id]||0)+1);state.awakenings[item.id]=level;toast(`${byId[item.id].short} 觉醒 ${['','I','II','III'][level]} · 威力与倍率提升`,'good');}
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
    if(state.phase!=='shop')return;if(state.boonPending){toast('先选择章节奖励','bad');return;} state.encounterIndex++; state.shopRerollCost=3; startBattle();
  }

  function gameOver(win){
    state.phase=win?'victory':'gameover'; busy=false;clearSave(); if(win){SFX.win();burstAtCenter(80,'#ffd36b')}else SFX.fail(); render();
  }

  function cardHtml(c){
    const n=byId[c.id],sel=state.selected.indexOf(c.uid),locked=c.uid===state.lockedUid;
    let delta='';if(sel<0&&!locked&&state.selected.length<maxSelect()){
      const before=state.selected.length?evaluate(selectedCards()):{damage:0,combos:[]};const after=evaluate([...selectedCards(),{inst:c,n}]);
      const existing=new Set(before.combos.map(x=>x.name)),added=after.combos.filter(x=>!existing.has(x.name));
      delta=`<div class="candidate-delta"><b>+${fmt(after.damage-before.damage)}</b><span>${added[0]?added[0].name:'加入结印'}</span></div>`;
    }
    return `<div role="button" tabindex="0" aria-label="${n.name}，${n.elements.join('')}，${n.roles.join('、')}，${sel>=0?'已选':'未选'}" aria-pressed="${sel>=0}" class="ninja-card holo-card ${n.rarity} ${sel>=0?'selected':''} ${locked?'locked':''}" data-uid="${c.uid}" onclick="Game.toggleCard('${c.uid}')" onkeydown="if(event.key===' '){event.preventDefault();Game.toggleCard('${c.uid}')}">
      <div class="card-art-frame"><img class="full-card-art" src="${CARD_ART.ninja[n.id]}" alt="${n.name}独立卡面" draggable="false"><div class="foil-layer"></div><div class="shine-layer"></div><div class="order-badge">${sel+1}</div><button class="inspect-card" aria-label="查看${n.name}" onclick="event.stopPropagation();Game.viewCard('ninja','${n.id}')">↗</button>${delta}</div>
      <div class="card-caption"><strong>${n.short}<small>${n.elements.join('·')}</small></strong><span>${n.roles.join(' / ')}</span><div><b>威 ${Math.round(n.power+state.training+c.bonus+(state.awakenings?.[n.id]||0)*12)}</b><b>${state.awakenings?.[n.id]?`觉${state.awakenings[n.id]} · `:''}×${n.mult.toFixed(2)}</b></div></div>
    </div>`;
  }
  function chainRailHtml(){if(!state.selected.length)return'<div class="chain-empty">点选手牌开始结印 · 顺序会改变连携</div>';return state.selected.map((uid,i)=>{const c=state.hand.find(x=>x.uid===uid),n=byId[c.id];return `${i?'<span class="chain-arrow">→</span>':''}<div class="chain-node" draggable="true" ondragstart="Game.chainDragStart(event,'${uid}')" ondragover="event.preventDefault()" ondrop="Game.chainDrop(event,'${uid}')"><img src="${CARD_ART.ninja[n.id]}" alt=""><b>${i+1}</b><span>${n.short}</span><button aria-label="${n.short}前移" onclick="Game.moveSelected('${uid}',-1)" ${i===0?'disabled':''}>‹</button><button aria-label="${n.short}后移" onclick="Game.moveSelected('${uid}',1)" ${i===state.selected.length-1?'disabled':''}>›</button></div>`}).join('')}
  function relicHtml(id){const r=relicById[id];return `<button class="relic holo-relic ${r.rarity}" onclick="Game.viewCard('relic','${id}')"><img class="relic-art" src="${CARD_ART.relic[id]}" alt="${r.name}" draggable="false"><div class="relic-copy"><div class="relic-name">${r.name}</div><div class="relic-text">${r.text}</div></div></button>`}
  function battleShell(){
    const e=enc(), pct=clamp(state.score/e.target*100,0,100);
    const preview=state.selected.length?evaluate(selectedCards()):null;const shown=preview||state.lastResult;
    const handHtml=state.hand.map(cardHtml).join('');
    const relics=state.relics.map(relicHtml).join('')+Array.from({length:Math.max(0,5-state.relics.length)},()=>'<div class="empty-slot">空秘卷槽</div>').join('');
    const activeRule=currentRule(),ruleText=RULE_TEXT[activeRule]||'';
    const boss=e.mod?(`结界 ${1+(state.bossPhase||0)}/${e.phases} · `+BOSS_TEXT[e.mod]+(state.bossSealElement?` 当前封印：${state.bossSealElement}`:'')+(ruleText?` 本层：${ruleText}`:'')):ruleText;
    const chapterProgress=[1,2,3].map(w=>`<i class="${w<=e.wave?'on':''}"></i>`).join('');
    return `<div class="shell" id="shell">
      <header class="topbar"><div class="brand"><div class="brand-mark">忍</div><div><div class="brand-title">SHINOBI CASCADE</div><div class="brand-sub">忍 界 连 锁</div></div></div>
      <div class="stage"><b>${e.chapter}/${CHAPTER_COUNT} · ${e.chapterName}</b>${chapterProgress}<span style="font-size:10px;color:#6f8994">${e.wave}/3</span></div>
      <div class="resources"><button class="iconbtn home-button" aria-label="保存并返回主页" title="保存并返回主页" onclick="Game.home()">⌂</button><div class="pill">両 <strong>${state.money}</strong></div><button class="mobile-sheet-button" onclick="Game.toggleCombatSheet('relics')">秘卷 ${state.relics.length}/5</button><button class="mobile-sheet-button" onclick="Game.toggleCombatSheet('log')">战况</button><button class="iconbtn desktop-tool" aria-label="远征地图" onclick="Game.toggleMap()">路</button><button class="iconbtn desktop-tool" aria-label="卡牌与连携图鉴" onclick="Game.toggleHelp()">卷</button><button class="iconbtn desktop-tool" onclick="Game.toggleSound()">${SFX.enabled?'♪':'×'}</button></div></header>
      <main class="main">
        <aside class="panel left"><div class="panel-title">Threat / 威胁目标</div><div class="enemy-card"><div class="enemy-kicker">${e.title}</div><div class="enemy-name">${e.name}</div><div class="target-row">击破阈值</div><div class="target-num">${fmt(e.target)}</div><div class="boss-mod">${boss}</div></div>
          <div class="progress-box"><div class="progress-label"><span>本战伤害</span><b>${fmt(state.score)} / ${fmt(e.target)}</b></div><div class="bar"><i style="width:${pct}%"></i></div></div>
          <div class="stat-grid"><div class="stat"><span>剩余出击</span><strong class="cyan">${state.playsLeft}</strong></div><div class="stat"><span>剩余换手</span><strong class="gold">${state.redraws}</strong></div><div class="stat"><span>队伍</span><strong>${state.deck.length}</strong></div><div class="stat"><span>修炼</span><strong>+${state.training}</strong></div></div>
          <div class="help">远征熟练度 ×${(1.08**(e.chapter-1)).toFixed(1)}<br>每胜全队威力 +3。<br>顺序连携保留全倍率。<br>羁绊 / 秘卷倍率按 0.38 次方叠加。<br><span class="kbd">Enter</span> 出击　<span class="kbd">R</span> 换手<br><span class="kbd">1–8</span> 快速选牌</div>
        </aside>
        <section class="panel board"><div class="mobile-threat"><b>${e.chapter}-${e.wave} ${e.name}</b><span>还差 ${fmt(Math.max(0,e.target-state.score))} · ${state.bossSealElement?`${state.bossSealElement}封印`:state.weakElement?`${state.weakElement}弱点`:`出击 ${state.playsLeft}`}</span>${boss?`<p>${boss}</p>`:''}</div><div class="arena"><div class="arena-rings"></div><div class="score-stage"><div class="chain-title" id="chainTitle">${state.selected.length?`已结印 ${state.selected.length}/${maxSelect()} · 拖动下方轨道调整顺序`:'选择忍者 · 属性顺序决定连锁'}</div><div class="big-score" id="scoreNum">${fmt(preview?preview.damage:state.lastResult?state.lastResult.damage:0)}</div><div class="equation"><span>本战累计</span><b>${exact(state.score)}</b><span class="mul">/</span><span>威胁 ${exact(e.target)}</span></div><div class="preview-meta">${preview?`预计伤害 · ${preview.combos.length} 个组合 · 总倍率 ×${fmt(preview.baseMult*preview.comboMult*preview.finalMult)}`:state.lastResult?'上次出击 · 连锁结算':'先选支援 / 控制，再接强攻试试'}</div><div class="combo-stack" id="comboStack">${shown?[...shown.combos,...shown.relicSteps].slice(0,8).map(c=>`<span class="combo-chip ${c.kind}">${c.name} ×${Number(c.mult.toFixed(2))}</span>`).join(''):''}</div></div></div>
          <div class="hand-zone"><div class="chain-rail" aria-label="出手顺序">${chainRailHtml()}</div><div class="hand-meta"><span>HAND / 手牌 ${state.hand.length}</span><span>${state.lockedUid?'神树锁定 1 张':'点卡加入 · 箭头微调顺序'}</span></div><div class="hand">${handHtml}</div></div>
        </section>
        <aside class="panel right"><div class="panel-title">Scrolls / 秘卷构筑 ${state.relics.length}/5</div><div class="relic-list">${relics}</div><div class="deck-mini"><div class="panel-title">Build / 当前构筑</div><div class="deck-summary">${buildTags().map(x=>`<span class="deck-tag">${x}</span>`).join('')}</div></div><div class="log"><div class="panel-title">Battle log</div>${state.log.map(x=>`<div class="log-line">${x}</div>`).join('')}</div></aside>
      </main>
      <footer class="actions"><button class="action danger" onclick="Game.redraw()" ${state.redraws<=0||busy?'disabled':''}>换手 <small>R · ${state.redraws} 次</small></button><div class="selected-info"><b>${state.selected.length}</b>已选择</div><button class="action primary" onclick="Game.play()" ${!state.selected.length||busy?'disabled':''}>结印出击 <small>ENTER · ${state.playsLeft} 次</small></button></footer>
    </div>${combatSheetOverlay()}`;
  }

  function combatSheetOverlay(){if(!combatSheetOpen)return'';const tabs=[['relics',`秘卷 ${state.relics.length}/5`],['build','当前构筑'],['log','战斗日志']];let content='';if(combatSheetTab==='relics')content=`<div class="sheet-relics">${state.relics.map(relicHtml).join('')||'<p>尚未获得秘卷</p>'}</div>`;if(combatSheetTab==='build')content=`<div class="sheet-build">${buildTags().map(x=>`<span class="deck-tag">${x}</span>`).join('')}<p>队伍 ${state.deck.length} 人 · 修炼 +${state.training}</p></div>`;if(combatSheetTab==='log')content=`<div class="sheet-log">${state.log.map(x=>`<div class="log-line">${x}</div>`).join('')}</div>`;return `<div class="combat-sheet-backdrop" onclick="Game.toggleCombatSheet('${combatSheetTab}')"><section class="combat-sheet" onclick="event.stopPropagation()"><div class="sheet-handle"></div><nav>${tabs.map(([id,label])=>`<button class="${combatSheetTab===id?'active':''}" onclick="Game.setCombatSheet('${id}')">${label}</button>`).join('')}<button class="sheet-close" aria-label="关闭战况" onclick="Game.toggleCombatSheet('${combatSheetTab}')">×</button></nav>${content}<div class="sheet-tools"><button onclick="Game.toggleMap()">远征地图</button><button onclick="Game.toggleHelp()">卡牌与连携图鉴</button><button onclick="Game.toggleSound()">音效 ${SFX.enabled?'开':'关'}</button></div></section></div>`}

  function buildTags(){
    const ns=state.deck.map(c=>byId[c.id]); const allTeams=ns.flatMap(n=>n.teams), allEls=ns.flatMap(n=>n.elements);
    const count=a=>Object.entries(a.reduce((o,x)=>(o[x]=(o[x]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]);
    const tags=[]; count(allTeams).slice(0,3).forEach(([k,v])=>{if(v>=2)tags.push(`${k} ×${v}`)}); count(allEls).slice(0,3).forEach(([k,v])=>tags.push(`${k} ×${v}`));
    return tags.slice(0,6);
  }

  function renderMenu(){
    const canResume=savedRun();
    return `<div class="overlay menu-overlay"><div class="modal hero-modal"><div class="hero-art"><img src="${CARD_ART.ninja.naruto}" alt="鸣人"><img src="${CARD_ART.ninja.sasuke}" alt="佐助"><img src="${CARD_ART.ninja.kakashi}" alt="卡卡西"></div><div class="hero-content"><div class="panel-title">ROGUELIKE DECKBUILDER / 完整独立卡面版</div><h1>SHINOBI<br>CASCADE<em>忍 界 连 锁</em></h1><p>以忍术结印，以羁绊破局。<br>让每一张牌，都成为下一场数字爆炸的引线。</p><div class="feature-row"><div class="feature"><b>${NINJAS.length} 名忍者</b><span>三种起始流派</span></div><div class="feature"><b>${RELICS.length} 张秘卷</b><span>连携优先 · 秘卷递减</span></div><div class="feature"><b>${CHAPTER_COUNT} 章 · ${ENCOUNTERS.length} 战</b><span>新增 4 章 · 高压试炼</span></div><div class="feature"><b>25–40 分钟</b><span>自动保存远征进度</span></div></div><div class="starter-choices">${Object.entries(STARTER_BUILDS).map(([id,b])=>`<button onclick="Game.start('${id}')"><b>${b.name}</b><span>${b.hint}</span><em>开始远征 →</em></button>`).join('')}</div>${canResume?'<button class="startbtn resume" onclick="Game.resume()">继续已保存的远征</button>':''}<button class="text-button" onclick="Game.toggleHelp()">浏览全部卡牌与连携图鉴 →</button><p class="small-note">离线单文件 · 生成式同人美术 · WebAudio 合成音效<br>战斗间自动保存；游玩时长取决于思考与操作速度。</p></div></div></div>${helpOverlay()}`;
  }

  function shopItemHtml(item,i){
    if(item.type==='train')return `<button class="shop-item training-item ${item.sold?'sold':''}" onclick="Game.buy(${i})" ${item.sold?'disabled':''}><div class="bigicon">修</div><h3>全队特训</h3><p>全队基础威力永久 +6</p><div class="price">${item.sold?'已修炼':item.cost+' 両'}</div></button>`;
    if(item.type==='awaken'){const n=byId[item.id],level=(state.awakenings[item.id]||0)+1;return `<div class="shop-item card-shop awakening ${n.rarity} ${item.sold?'sold':''}"><button class="shop-art-button" onclick="Game.viewCard('ninja','${n.id}')"><img class="shop-card-art" src="${CARD_ART.ninja[n.id]}" alt="${n.name}"></button><div class="shop-copy"><h3>${n.short} · 觉醒 ${['','I','II','III'][level]}</h3><p>唯一角色强化 · 威力 +12${level>=2?' · 倍率 +12%':''}</p><button class="buy-button" onclick="Game.buy(${i})" ${item.sold?'disabled':''}>${item.sold?'已觉醒':`觉醒 · ${item.cost} 両`}</button></div></div>`}
    const n=item.type==='ninja'?byId[item.id]:relicById[item.id];
    return `<div class="shop-item card-shop ${n.rarity} ${item.sold?'sold':''}"><button class="shop-art-button" onclick="Game.viewCard('${item.type}','${n.id}')" aria-label="查看${n.name}"><img class="shop-card-art" src="${CARD_ART[item.type][n.id]}" alt="${n.name}" loading="lazy"></button><div class="shop-copy"><h3>${n.name}</h3><p>${item.type==='ninja'?`${n.teams.join(' / ')} · ${n.elements.join('')}<br>${n.roles.join(' / ')} · 威 ${n.power} ×${n.mult}`:n.text}</p><button class="buy-button" onclick="Game.buy(${i})" ${item.sold?'disabled':''}>${item.sold?'已购入':`购入 · ${item.cost} 両`}</button></div></div>`;
  }

  function renderShop(){
    const e=enc(), next=ENCOUNTERS[state.encounterIndex+1];
    return `${battleShell()}<div class="overlay"><div class="modal"><div class="shop-head"><div><div class="panel-title">POST BATTLE / 战后补给</div><h2>${e.name} · 已击破</h2><p>下一战：第 ${next.chapter} 章 ${next.wave}/3 · ${next.name} · 目标 ${fmt(next.target)}</p></div><div class="money">${state.money} 両</div></div>
      ${state.boonPending?`<div class="boon-panel"><h3>章节突破 · 选择一份奖励</h3><div class="boon-choices">${BOONS.map(b=>`<button onclick="Game.chooseBoon('${b.id}')"><b>${b.name}</b><span>${b.text}</span></button>`).join('')}</div></div>`:''}<div class="shop-section-title">招募 / 秘卷 / 修炼 · 点击卡面查看完整详情</div><div class="shop-grid">${state.shopItems.map(shopItemHtml).join('')}</div>
      <div class="shop-section-title">OWNED SCROLLS · 点击出售（50% 回收）</div><div class="owned-relics">${state.relics.map(id=>`<span class="owned-chip" onclick="Game.sellRelic('${id}')">${relicById[id].icon} ${relicById[id].name}</span>`).join('')||'<span style="color:#607985;font-size:10px">暂无秘卷</span>'}</div>
      <details class="retire-panel"><summary>队伍精简 · ${state.deck.length} 张（每张花费 3 両，至少保留 8 张）</summary><div class="owned-relics">${state.deck.map(c=>`<button class="owned-chip" onclick="Game.retire('${c.uid}')" ${state.deck.length<=8||state.money<3?'disabled':''}>休整 · ${byId[c.id].short}</button>`).join('')}</div></details><div class="shop-foot"><button onclick="Game.home()">保存并返回主页</button><button onclick="Game.rerollShop()">重掷商品 · ${state.shopRerollCost} 両</button><button class="next" onclick="Game.nextBattle()">前往下一战 →</button></div></div></div>`;
  }

  function renderEnd(win){
    const sec=Math.max(1,Math.floor((Date.now()-state.stats.startTime)/1000)), min=Math.floor(sec/60), s=sec%60;
    const rank=win?(state.stats.maxHit>1e10?'SSS':state.stats.maxHit>1e9?'SS':'S'):'D';
    return `<div class="overlay"><div class="modal endbox"><div class="rank">${rank}</div><h2>${win?'忍界连锁完成':'远征中断'}</h2><p style="color:#829aa4">${win?'你把连携系统推到了终焉之谷之外。':'构筑还没成型。换一种羁绊与秘卷路线再来。'}</p><div class="endstats"><div><span>推进战斗</span><b>${state.stats.battles}/${ENCOUNTERS.length}</b></div><div><span>最大单击</span><b>${fmt(state.stats.maxHit)}</b></div><div><span>累计伤害</span><b>${fmt(state.stats.totalDamage)}</b></div><div><span>用时</span><b>${min}:${String(s).padStart(2,'0')}</b></div></div><p class="small-note">远征种子 ${state.seed} · 使用 ?seed=${state.seed} 可重现本局随机结果</p><button class="startbtn" onclick="Game.start()">重新远征</button><button class="text-button" onclick="Game.home()">返回主页</button></div></div>`;
  }

  function libraryGrid(){
    if(libraryTab==='combo')return COMBO_GLOSSARY.filter(([a,b])=>(a+b).includes(libraryFilter)).map(([a,b])=>`<div class="tutorial-card"><b>${a}</b><p>${b}</p></div>`).join('');
    const list=libraryTab==='ninja'?NINJAS:RELICS;
    return list.filter(n=>[n.name,...(n.teams||[]),...(n.tags||[]),...(n.elements||[])].join(' ').includes(libraryFilter)).map(n=>`<button class="library-card ${n.rarity}" onclick="Game.viewCard('${libraryTab}','${n.id}')"><img src="${CARD_ART[libraryTab][n.id]}" alt="${n.name}" loading="lazy"><b>${n.name}</b><span>${libraryTab==='ninja'?n.elements.join(' · '):n.text}</span></button>`).join('');
  }
  function helpOverlay(){
    if(!state.helpOpen)return'';
    return `<div class="overlay library-overlay"><div class="modal"><div class="shop-head"><div><div class="panel-title">SHINOBI ARCHIVE</div><h2>忍界图鉴</h2><p>按选择顺序结印，顺序连携全额相乘，其他羁绊和秘卷倍率按 0.38 次方叠加，避免无脑堆叠。</p></div><button class="iconbtn" aria-label="关闭图鉴" onclick="Game.toggleHelp()">×</button></div><div class="library-tabs">${[['ninja',`忍者 ${NINJAS.length}`],['relic',`秘卷 ${RELICS.length}`],['combo',`羁绊与连携 ${COMBO_GLOSSARY.length}`]].map(([id,label])=>`<button class="${libraryTab===id?'active':''}" onclick="Game.setLibrary('${id}')">${label}</button>`).join('')}<input aria-label="搜索图鉴" placeholder="搜索名字 / 阵营 / 属性" oninput="Game.filterLibrary(this.value)"></div><div id="libraryGrid" class="library-grid ${libraryTab==='combo'?'combo-grid':''}">${libraryGrid()}</div></div></div>`;
  }
  function detailOverlay(){
    if(!detail)return'';const kind=detail.kind,n=kind==='ninja'?byId[detail.id]:relicById[detail.id];
    const pairs=kind==='ninja'?[...BASE_BONDS,...EXTRA_TEAMS,...EXTRA_DESTINY].filter(r=>r.ids?.includes(n.id)):[];
    return `<div class="overlay detail-overlay" onclick="Game.closeDetail()"><div class="modal card-detail" onclick="event.stopPropagation()"><img src="${CARD_ART[kind][n.id]}" alt="${n.name}完整独立卡面"><section><button class="iconbtn detail-close" aria-label="关闭卡牌详情" onclick="Game.closeDetail()">×</button><div class="panel-title">${n.rarity.toUpperCase()} / ${kind==='ninja'?'忍者':'秘卷'}</div><h2>${n.name}</h2>${kind==='ninja'?`<p>${n.teams.join(' / ')}</p><p>${n.elements.join(' · ')} / ${n.roles.join(' · ')}</p><p>${n.tags.join(' · ')}</p><div class="detail-stats">威力 ${n.power} <b>×${n.mult.toFixed(2)}</b></div><h3>关联羁绊</h3><p>${pairs.map(r=>`${r.name} ×${r.mult}：${r.ids.map(ninjaName).join(' + ')}`).join('<br>')||'与相同小队、互补属性或战术角色配合。更多规则见连携图鉴。'}</p>`:`<p>${n.text}</p><div class="detail-stats">价格 ${n.cost} 両</div>`}<p class="small-note">整幅独立绘制，完整保留四边；数值以当前游戏数据为准。</p></section></div></div>`;
  }
  function mapOverlay(){
    if(!mapOpen)return'';return `<div class="overlay"><div class="modal"><div class="shop-head"><div><div class="panel-title">EXPEDITION / ${ENCOUNTERS.length} ENCOUNTERS · SEED ${state.seed}</div><h2>远征之路</h2></div><button class="iconbtn" aria-label="关闭地图" onclick="Game.toggleMap()">×</button></div><div class="map-grid">${ENCOUNTERS.filter(e=>e.wave===1).map(e=>`<section class="map-chapter ${enc().chapter===e.chapter?'current':''}"><h3>${String(e.chapter).padStart(2,'0')} / ${e.chapterName}</h3>${ENCOUNTERS.filter(x=>x.chapter===e.chapter).map(x=>{const idx=ENCOUNTERS.indexOf(x);return `<p class="${idx<state.encounterIndex?'done':idx===state.encounterIndex?'current':''}">${idx<state.encounterIndex?'✓':idx===state.encounterIndex?'→':'·'} ${x.name}<small>${fmt(x.target)} · ${x.mod?'BOSS 多阶段':RULE_TEXT[x.rule]}</small></p>`}).join('')}</section>`).join('')}</div></div></div>`;
  }

  function render(){
    if(homeRequested&&!busy){home();return;}
    if(state.phase==='menu'||!state.phase) app.innerHTML=renderMenu();
    else if(state.phase==='battle') app.innerHTML=battleShell()+helpOverlay();
    else if(state.phase==='shop') app.innerHTML=renderShop()+helpOverlay();
    else app.innerHTML=renderEnd(state.phase==='victory');
    app.insertAdjacentHTML('beforeend',mapOverlay()+detailOverlay());
    requestAnimationFrame(bindHoloTilt);save();if(saveWarning){saveWarning=false;toast('当前浏览器无法保存进度，请保持页面开启','bad');}
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
  function toggleHelp(){state.helpOpen=!state.helpOpen;combatSheetOpen=false;SFX.tap();render()}
  function toggleSound(){SFX.toggle();render()}

  function key(e){
    if(state.phase==='battle'&&!state.helpOpen&&!detail&&!mapOpen){
      if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){e.preventDefault();play()}
      else if(e.key.toLowerCase()==='r'){e.preventDefault();redraw()}
      else if(/^[1-8]$/.test(e.key)){const c=state.hand[Number(e.key)-1];if(c)toggleCard(c.uid)}
    }
    if(e.key==='Escape'){if(detail)closeDetail();else if(mapOpen)toggleMap();else if(state.helpOpen)toggleHelp();}
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
  const api={home,start,resume,toggleCard,moveSelected,reorderSelected,chainDragStart,chainDrop,play,redraw,buy,sellRelic,rerollShop,nextBattle,toggleHelp,toggleSound,viewCard,closeDetail,toggleMap,toggleCombatSheet,setCombatSheet,setLibrary,filterLibrary,chooseBoon,retire};
  // Test harness is opt-in and never enabled by the released HTML.
  if(window.__SHINOBI_TEST__)api.test={state:()=>state,evaluate:(ids)=>evaluate(ids.map(id=>({n:byId[id],inst:{id,bonus:0}}))),setState:v=>{Object.assign(state,v);busy=false;},startBattle,generateShop,render,enc,rarityRoll,currentRule,gameRandom};
  return api;
})();
