const path=require('path'),fs=require('fs'),assert=require('assert');
let playwright;try{playwright=require('playwright')}catch(e){playwright=require(path.resolve(__dirname,'../../../work/node_modules/playwright'))}const {chromium}=playwright;
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--allow-file-access-from-files']});
 const report={errors:[],externalRequests:[],checks:[],viewports:[]};
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,offline:true});
 await context.addInitScript(()=>window.__SHINOBI_TEST__=true);
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url())});
 await page.goto('file://'+path.join(ROOT,'dist/shinobi-cascade.html'));await page.screenshot({path:path.join(__dirname,'desktop-menu.png'),fullPage:true});
 await page.getByRole('button',{name:/第七班·属性连携/}).click();await page.waitForSelector('.hand .ninja-card');assert.equal(await page.locator('.hand .ninja-card').count(),8);
 const best=await page.evaluate(()=>{let best={damage:0,uids:[]};const hand=Game.test.state().hand;for(let j=0;j<350;j++){const p=[...hand].sort(()=>Math.random()-.5).slice(0,5);const r=Game.test.evaluate(p.map(c=>c.id));if(r.damage>best.damage)best={damage:r.damage,uids:p.map(c=>c.uid)}}return best;});
 for(const uid of best.uids)await page.locator(`[data-uid="${uid}"]`).click();
 assert.equal(await page.locator('.ninja-card.selected').count(),5);await page.waitForTimeout(350);await page.screenshot({path:path.join(__dirname,'desktop-battle.png'),fullPage:true});
 const expected=await page.evaluate(()=>Game.test.evaluate(Game.test.state().selected.map(uid=>Game.test.state().hand.find(c=>c.uid===uid).id)).damage);
 await page.getByRole('button',{name:/结印出击/}).click();await page.waitForTimeout(600);assert(await page.locator('.float-num').count()>0,'damage explosion');await page.waitForTimeout(350);assert(await page.locator('#comboStack .combo-chip').count()>0,'combo animation remains in DOM');await page.screenshot({path:path.join(__dirname,'desktop-chain.png'),fullPage:true});
 await page.waitForFunction(()=>Game.test.state().phase==='shop',null,{timeout:10000});assert.equal(await page.evaluate(()=>Game.test.state().stats.maxHit),expected);report.checks.push('Natural first battle won; damage preview equals actual hit; particles and combo chips visible');
 await page.screenshot({path:path.join(__dirname,'desktop-shop.png'),fullPage:true});
 const money=await page.evaluate(()=>Game.test.state().money);const buy=page.locator('.buy-button:not([disabled])').first();const cost=Number((await buy.textContent()).match(/\d+/)[0]);if(money>=cost){await buy.click();assert.equal(await page.evaluate(()=>Game.test.state().money),money-cost);}
 await page.getByRole('button',{name:'保存并返回主页',exact:true}).last().click();await page.getByRole('button',{name:'继续已保存的远征'}).click();assert.equal(await page.evaluate(()=>Game.test.state().phase),'shop');
 await page.reload();await page.getByRole('button',{name:'继续已保存的远征'}).click();assert.equal(await page.evaluate(()=>Game.test.state().phase),'shop');report.checks.push('Shop purchase, persisted currency and resume work');
 await page.getByRole('button',{name:/前往下一战/}).click();assert.equal(await page.evaluate(()=>Game.test.state().encounterIndex),1);
 await page.getByRole('button',{name:'卡牌与连携图鉴'}).click();assert.equal(await page.locator('.library-card').count(),55);await page.getByRole('button',{name:'秘卷 36',exact:true}).click();assert.equal(await page.locator('.library-card').count(),36);await page.screenshot({path:path.join(__dirname,'desktop-relic-codex.png'),fullPage:true});await page.getByRole('button',{name:'关闭图鉴'}).click();
 await page.locator('.inspect-card').first().click();await page.screenshot({path:path.join(__dirname,'desktop-card-detail.png'),fullPage:true});assert(await page.locator('.card-detail>img').evaluate(im=>im.complete&&im.naturalWidth>0));await page.getByRole('button',{name:'关闭卡牌详情'}).click();
 await page.getByRole('button',{name:'远征地图'}).click();assert.equal(await page.locator('.map-chapter').count(),14);await page.screenshot({path:path.join(__dirname,'desktop-map.png'),fullPage:true});await page.getByRole('button',{name:'关闭地图'}).click();
 for(const size of [{width:390,height:844},{width:360,height:800},{width:768,height:1024}]){
  await page.setViewportSize(size);await page.evaluate(()=>{Game.start('storm');Game.test.setState({encounterIndex:14});Game.test.startBattle()});await page.waitForTimeout(150);
  const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.ninja-card')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),broken:[...document.images].filter(im=>!im.complete||im.naturalWidth===0).length,bossVisible:innerWidth>720||document.querySelector('.mobile-threat').getBoundingClientRect().height>0}));
  assert(layout.scrollWidth<=size.width,'No horizontal overflow');assert.equal(layout.broken,0);assert(layout.bossVisible);report.viewports.push({...size,...layout});
  await page.screenshot({path:path.join(__dirname,`battle-${size.width}.png`),fullPage:true});
  await page.getByRole('button',{name:'保存并返回主页',exact:true}).click();await page.getByRole('button',{name:'继续已保存的远征'}).click();assert.equal(await page.evaluate(()=>Game.test.state().encounterIndex),14);
  await page.locator('.ninja-card').first().click();assert.equal(await page.locator('.ninja-card.selected').count(),1);
  await page.locator('.inspect-card').first().click();await page.screenshot({path:path.join(__dirname,`detail-${size.width}.png`),fullPage:true});await page.getByRole('button',{name:'关闭卡牌详情'}).click();
 }

 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,offline:true});
 await touch.addInitScript(()=>window.__SHINOBI_TEST__=true);const tp=await touch.newPage();tp.on('pageerror',e=>report.errors.push(e.message));
 await tp.goto('file://'+path.join(ROOT,'dist/shinobi-cascade.html'));await tp.screenshot({path:path.join(__dirname,'mobile-menu.png'),fullPage:true});
 await tp.getByRole('button',{name:/猪鹿蝶·控制爆发/}).tap();await tp.locator('.ninja-card').first().tap();assert.equal(await tp.locator('.ninja-card.selected').count(),1);assert.equal(await tp.locator('.chain-node').count(),1);
 await tp.getByRole('button',{name:/秘卷 2\/5/}).tap();assert(await tp.locator('.combat-sheet').isVisible());await tp.getByRole('button',{name:'当前构筑'}).tap();assert(await tp.locator('.sheet-build').isVisible());await tp.getByRole('button',{name:'关闭战况'}).tap();
 await tp.getByRole('button',{name:/换手 R/}).tap();assert.equal(await tp.evaluate(()=>Game.test.state().redraws),1);
 await tp.locator('.inspect-card').first().tap();await tp.getByRole('button',{name:'关闭卡牌详情'}).tap();
 await tp.evaluate(()=>{Game.test.setState({phase:'shop',encounterIndex:2,boonPending:true});Game.test.generateShop();Game.test.render()});
 await tp.screenshot({path:path.join(__dirname,'mobile-shop-boon.png'),fullPage:true});await tp.getByRole('button',{name:/查克拉淬炼/}).tap();
 await tp.getByRole('button',{name:/前往下一战/}).tap();assert.equal(await tp.evaluate(()=>Game.test.state().encounterIndex),3);
 await tp.getByRole('button',{name:'战况'}).tap();await tp.getByRole('button',{name:'卡牌与连携图鉴'}).tap();await tp.getByRole('button',{name:'秘卷 36',exact:true}).tap();await tp.screenshot({path:path.join(__dirname,'mobile-relic-codex.png'),fullPage:true});await tp.getByRole('button',{name:'关闭图鉴'}).tap();
 assert(await tp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.checks.push('Touch emulation: tap select, redraw, inspect, chapter boon, shop advance, mobile codex');await touch.close();
 assert.equal(report.errors.length,0,report.errors.join('\n'));assert.equal(report.externalRequests.length,0,'No network dependencies');report.checks.push('55 ninja + 36 relic gallery, 14 chapter map, full card detail, mobile card selection, offline loading, no console errors');
 fs.writeFileSync(path.join(__dirname,'browser-results.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
