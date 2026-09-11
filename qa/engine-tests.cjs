const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
function environment(seed=1){
 let now=0,queue=[],storage={};
 const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){}},remove(){},appendChild(){},animate(){},setAttribute(){},innerHTML:'',insertAdjacentHTML(){}});const app=el();
 const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const ctx=vm.createContext({console,Math:math,Date,Number,Set,Map,JSON,Array,Object,String,document:{getElementById:id=>id==='app'?app:null,querySelector:()=>null,querySelectorAll:()=>[],createElement:el,body:{appendChild(){},contains:()=>false}},window:{__SHINOBI_TEST__:true,addEventListener(){}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},requestAnimationFrame(){},setTimeout:(f,d)=>{queue.push({f,t:now+d});return queue.length},clearTimeout(){},innerWidth:1440,innerHeight:900,SFX:new Proxy({enabled:false},{get:(o,p)=>p==='enabled'?false:()=>{}})});
 let code=['data.js','expansion.js'].map(f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8')).join('\n');
 code+='\nconst CARD_ART={ninja:Object.fromEntries(NINJAS.map(n=>[n.id,"x"])),relic:Object.fromEntries(RELICS.map(n=>[n.id,"x"]))};\n'+fs.readFileSync(path.join(ROOT,'src/game.js'),'utf8')+'\nglobalThis.api=Game;globalThis.data={NINJAS,RELICS,ENCOUNTERS,EXTRA_TEAMS,EXTRA_DESTINY,EXTRA_TAG_RULES,COMBO_GLOSSARY};';
 vm.runInContext(code,ctx);
 return {game:ctx.api,data:ctx.data,random:math.random,flush(){let count=0;while(queue.length){queue.sort((a,b)=>a.t-b.t);const q=queue.shift();now=q.t;q.f();if(++count>1000)throw Error('Timer loop');}},storage};
}
function tests(){
 const e=environment(),g=e.game,d=e.data,t=g.test;g.start();
 assert.equal(d.NINJAS.length,55);assert.equal(d.RELICS.length,36);assert.equal(d.ENCOUNTERS.length,30);
 assert.equal(t.state().deck.length,9,'starter decks should leave room to build');
 assert(d.ENCOUNTERS.filter(x=>!x.mod).every(x=>x.rule),'every normal encounter has a rule');
 for(const list of [d.NINJAS,d.RELICS])assert.equal(new Set(list.map(n=>n.id)).size,list.length);
 assert.equal(new Set(d.ENCOUNTERS.filter(e=>e.mod).map(e=>e.mod)).size,10);
 const set=v=>t.setState({encounterIndex:0,relics:[],training:0,bossSealElement:null,previousCount:0,playsLeft:4,battleFlags:{},...v});
 for(const r of [...d.EXTRA_TEAMS,...d.EXTRA_DESTINY]){
  const ids=r.ids||d.NINJAS.filter(n=>n.teams.includes(r.team)).slice(0,r.count).map(n=>n.id);set({});assert(t.evaluate(ids).combos.some(c=>c.name===r.name),r.name);
 }
 const cases={shadow_scroll:['naruto'],chakra_thread:['naruto','sasuke'],medical_seal:['sakura'],sharingan:['naruto','sasuke'],sage_mode:['naruto','sasuke','sakura','kakashi'],curse_mark:['naruto','sasuke','sakura'],eight_gates:['guy','lee','neji','naruto','sasuke'],jinchuriki_core:['naruto'],flying_raijin:['naruto','kakashi'],rinnegan:['naruto','sasuke','sakura','kakashi','gaara'],edo_tensei:['naruto','sasuke'],wood_domain:['yamato'],akatsuki_ring:['itachi','kisame','konan'],team_tactics:['naruto','sasuke','sakura'],element_prism:['asuma','darui','yamato'],destiny_knot:['naruto','sasuke'],combo_engine:['naruto','sasuke','sakura','kakashi','gaara'],ice_mirror:['haku'],puppet_core:['sasori','kankuro'],paper_wings:['konan'],sword_archive:['tenten','zabuza'],crimson_chain:['kushina'],storm_drum:['zabuza','kakashi'],hokage_cloak:['hashirama','tobirama'],moon_mirror:['itachi','kurenai'],dust_cube:['ohnoki'],sage_contract:['jiraiya','kabuto'],duet_bell:['naruto','sasuke'],solo_kunai:['naruto'],echo_seal:['naruto','sasuke'],last_flame:['naruto'],chain_abacus:['naruto','sasuke','sakura','kakashi'],war_banner:['naruto','gaara','lee','shikamaru']};
 for(const [id,ids] of Object.entries(cases)){
  set({previousCount:2,playsLeft:1});const baseline=t.evaluate(ids).damage;t.setState({relics:[id]});const before=JSON.stringify(t.state());const result=t.evaluate(ids);assert(result.damage>baseline,`${id}: ${result.damage} <= ${baseline}`);assert.equal(JSON.stringify(t.state()),before,'preview must be pure: '+id);
 }
 // Gameplay effects beyond damage: rewards, growth, selection limits, correct save/resume.
 function forceWin(relic){g.start();t.setState({relics:[relic],score:d.ENCOUNTERS[0].target,money:0,training:0});const uid=t.state().hand[0].uid;g.toggleCard(uid);g.play();e.flush();return t.state();}
 assert.equal(forceWin('treasure_frog').money,d.ENCOUNTERS[0].reward+4);
 assert.equal(forceWin('training_weights').training,8);
 g.start();set({relics:['limit_break'],training:100000});const uids=t.state().hand.slice(0,5).map(c=>c.uid);uids.forEach(g.toggleCard);g.play();e.flush();assert.equal(t.state().training,100007);
 for(const [mod,ids,extra] of [['mist',['naruto'],{}],['armor',['naruto'],{}],['thorns',['naruto','sasuke'],{previousCount:2}],['puppet',['naruto'],{}],['rift',['naruto','sasuke','sakura'],{}],['drain',['naruto','sasuke'],{}]]){set({...extra,ruleOverride:null});const base=t.evaluate(ids).damage;const i=d.ENCOUNTERS.findIndex(e=>e.mod===mod);t.setState({encounterIndex:i});const chapterScale=1.42**(d.ENCOUNTERS[i].chapter-1);assert(t.evaluate(ids).damage/chapterScale<base+1,mod+' penalty');}
 g.start();t.setState({encounterIndex:5});t.startBattle();t.state().hand.slice(0,5).map(c=>c.uid).forEach(g.toggleCard);assert.equal(t.state().selected.length,4,'seal cap');
 g.start();const money=t.state().money;g.toggleCard(t.state().hand[0].uid);g.resume();assert.equal(t.state().selected.length,0);assert.equal(t.state().money,money);
 t.setState({rngState:123,seed:123});const seq=[t.gameRandom(),t.gameRandom(),t.gameRandom()];t.setState({rngState:123});assert.deepEqual([t.gameRandom(),t.gameRandom(),t.gameRandom()],seq,'saved RNG state reproduces choices');
 g.start();const order=['naruto','kakashi','sasuke'];set({});assert.notEqual(t.evaluate(order).damage,t.evaluate([...order].reverse()).damage,'selection order matters');
 const selected=t.state().hand.slice(0,3).map(c=>c.uid);selected.forEach(g.toggleCard);const first=[...t.state().selected];g.moveSelected(first[0],1);assert.equal(t.state().selected[1],first[0],'chain rail reorder');
 for(const r of d.EXTRA_TAG_RULES){const n=d.NINJAS.find(n=>n.tags.includes(r.tag));let ids=[n.id];for(const el of r.elements||[])if(!ids.some(id=>d.NINJAS.find(n=>n.id===id).elements.includes(el)))ids.push(d.NINJAS.find(n=>n.elements.includes(el)).id);if(r.role&&!ids.some(id=>d.NINJAS.find(n=>n.id===id).roles.includes(r.role)))ids.push(d.NINJAS.find(n=>n.roles.includes(r.role)).id);set({});assert(t.evaluate(ids).combos.some(c=>c.name===r.name),r.name);}

 // Full boss layers must not be skipped by overkill, and no win is awarded mid-boss.
 g.start();t.setState({encounterIndex:2,training:10000});t.startBattle();
 for(let phase=0;phase<2;phase++){const cards=t.state().hand.slice(0,5).map(c=>c.uid);cards.forEach(g.toggleCard);g.play();e.flush();if(phase===0){assert.equal(t.state().phase,'battle');assert.equal(t.state().bossPhase,1);assert.equal(t.state().stats.battles,0);}}
 assert.equal(t.state().phase,'shop');assert(t.state().boonPending);const idx=t.state().encounterIndex;g.nextBattle();assert.equal(t.state().encounterIndex,idx);g.chooseBoon('power');g.nextBattle();assert.equal(t.state().encounterIndex,idx+1);
 g.start();t.setState({encounterIndex:26});t.startBattle();g.toggleCard(t.state().hand[0].uid);g.play();e.flush();assert(t.state().lockedUid,'roots locks a hand card');g.toggleCard(t.state().lockedUid);assert.equal(t.state().selected.length,0);
 g.start();t.setState({encounterIndex:29,playsLeft:1,relics:[],score:0,training:0});g.toggleCard(t.state().hand[0].uid);g.play();e.flush();assert.equal(t.state().phase,'gameover');assert(!e.storage['shinobi-cascade-v3']);
 g.start();t.setState({encounterIndex:0,phase:'shop'});for(let i=0;i<80;i++){t.generateShop();assert(t.state().shopItems.filter(x=>x.type==='relic').every(x=>!['epic','legendary'].includes(d.RELICS.find(r=>r.id===x.id).rarity)),'early rarity gate');assert.equal(new Set(t.state().shopItems.filter(x=>x.type==='ninja').map(x=>x.id)).size,t.state().shopItems.filter(x=>x.type==='ninja').length)}
 const owned=t.state().deck[0].id;t.setState({phase:'shop',money:99,shopItems:[{type:'awaken',id:owned,cost:8,sold:false}],awakenings:{}});g.buy(0);assert.equal(t.state().awakenings[owned],1);assert.equal(t.state().deck.filter(c=>c.id===owned).length,1,'awakening must not duplicate unique ninja');
 g.start();const boss=d.ENCOUNTERS.findIndex(x=>x.mod==='genjutsu');t.setState({encounterIndex:boss,bossPhase:0});const phase0=t.currentRule();t.setState({bossPhase:1});assert.notEqual(t.currentRule(),phase0,'boss phase changes its battlefield rule');
 console.log('PASS: 9-card starters, seeded RNG, weighted early shops, awakening uniqueness, encounter rules, boss phase changes, combo ordering, save/resume and content systems.');
}
if(require.main===module)tests();module.exports={environment};
