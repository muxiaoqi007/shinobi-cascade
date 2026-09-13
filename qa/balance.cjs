const {environment}=require('./engine-tests.cjs');const fs=require('fs'),path=require('path');
function simulate(seed,build,policy='planned'){
 const e=environment(seed),g=e.game,t=g.test,d=e.data;g.start(build,seed*2654435761>>>0);const turns=[];let loops=0;
 function pickBest(pool,tries=190){
  if(policy==='random')tries=1;
  let best={damage:0,ids:[]};const max=d.ENCOUNTERS[t.state().encounterIndex].mod==='seal'?4:5;
  for(let j=0;j<tries;j++){
   const cs=[...pool];for(let i=cs.length-1;i>0;i--){const k=Math.floor(e.random()*(i+1));[cs[i],cs[k]]=[cs[k],cs[i]];}
   const count=policy==='random'?max:j%12===0?1:j%12===1?2:j%12===2?3:j%12===3?4:max;const hand=cs.slice(0,count);const r=t.evaluate(hand.map(c=>c.id));if(r.damage>best.damage)best={damage:r.damage,ids:hand.map(c=>c.uid)};
  }return best;
 }
 while(['battle','shop'].includes(t.state().phase)&&loops++<400){
  let st=t.state();
  if(st.phase==='battle'){
   const best=pickBest(st.hand);const target=t.enc().target;
   if(best.damage<(target-st.score)/st.playsLeft&&st.redraws>0){st.hand.filter(c=>c.uid!==st.lockedUid).slice(0,Math.min(4,st.hand.length)).forEach(c=>g.toggleCard(c.uid));g.redraw();continue;}
   const usable=st.hand.filter(c=>c.uid!==st.lockedUid);const chosen=usable.length!==st.hand.length?pickBest(usable):best;
   turns.push({encounter:st.encounterIndex+1,damage:chosen.damage,target});chosen.ids.forEach(g.toggleCard);g.play();e.flush();
  }else{
   if(st.boonPending)g.chooseBoon(st.focus<2?'focus':'power');
   // Relic selection evaluates offers over many possible hands; keeps five best current options.
   const samples=[];for(let j=0;j<28;j++){const p=[...st.deck].sort(()=>e.random()-.5).slice(0,5);samples.push(p.map(c=>c.id));}
   const original=[...st.relics];
   const utility=relics=>{t.setState({relics});let score=0;for(const ids of samples)score+=Math.log10(Math.max(1,t.evaluate(ids).damage));return score/samples.length;};
   let base=utility(original);t.setState({relics:original});
   let best=null;
   for(let i=0;i<st.shopItems.length;i++){const item=st.shopItems[i];if(item.type!=='relic'||item.cost>st.money)continue;
    for(let j=-1;j<original.length;j++){if(j===-1&&original.length>=5)continue;const relics=j<0?[...original,item.id]:original.map((r,k)=>k===j?item.id:r);const score=utility(relics);if(score>base+.03&&(!best||score>best.score))best={i,j,score};}
   }
   t.setState({relics:original});if(best){if(best.j>=0)g.sellRelic(original[best.j]);g.buy(best.i);}
   // Prefer a recruit only if their intrinsic ceiling is higher than the weakest card.
   const train=st.shopItems.findIndex(x=>x.type==='train');if(st.money>25)g.buy(train);
   if(st.money>30){const owned=new Set(st.deck.flatMap(c=>d.NINJAS.find(n=>n.id===c.id).teams));const item=st.shopItems.findIndex(x=>x.type==='ninja'&&d.NINJAS.find(n=>n.id===x.id).teams.some(t=>owned.has(t)));if(item>=0)g.buy(item);}
   g.nextBattle();
  }
 }
 const st=t.state();return {seed,build,policy,win:st.phase==='victory',battles:st.stats.battles,plays:turns.length,peak:st.stats.maxHit,relics:st.relics,deck:st.deck.length,turns};
}
const count=Number(process.argv[2]||3);const result=[];for(const policy of ['random','planned'])for(const build of ['leaf','storm','dawn'])for(let seed=1;seed<=count;seed++){const r=simulate(seed,build,policy);result.push(r);console.log(JSON.stringify({...r,turns:undefined}));}
fs.writeFileSync(path.join(__dirname,'balance-results.json'),JSON.stringify(result,null,2));
