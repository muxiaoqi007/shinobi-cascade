'use strict';
// Data-driven rules: every glossary entry below is also used by the evaluator.
const EXTRA_TEAMS = [
  {name:'凯班·忍具齐射',ids:['lee','neji','tenten'],mult:4.2},
  {name:'水门班·未竟之约',ids:['kakashi','obito','rin'],mult:5},
  {name:'鹰小队·协同狩猎',ids:['sasuke','suigetsu','karin'],mult:4.5},
  {name:'雨隐·黎明理想',ids:['pain','konan','nagato'],mult:6},
  {name:'五影·联合战线',team:'五影',count:3,mult:6},
  {name:'火影·薪火相传',team:'火影',count:3,mult:6},
  {name:'雾隐·无声猎杀',team:'雾隐',count:2,mult:3},
  {name:'云隐·雷鸣阵',team:'云隐',count:3,mult:4.5},
  {name:'音隐·禁术实验',team:'音隐',count:2,mult:3},
  {name:'漩涡·封印血脉',team:'漩涡家族',count:2,mult:3.5},
];
const EXTRA_DESTINY = [
  {name:'宿命·母子之链',ids:['naruto','kushina'],mult:3.5},
  {name:'宿命·红发的约定',ids:['minato','kushina'],mult:4},
  {name:'宿命·镜中之雪',ids:['zabuza','haku'],mult:4},
  {name:'宿命·不死二重奏',ids:['hidan','kakuzu'],mult:3.8},
  {name:'宿命·艺术永恒',ids:['deidara','sasori'],mult:3.5},
  {name:'宿命·雷鸣兄弟',ids:['ay','bee'],mult:4},
  {name:'宿命·一双写轮眼',ids:['kakashi','obito'],mult:4.2},
  {name:'宿命·守护之人',ids:['obito','rin'],mult:3.5},
  {name:'宿命·止水之托',ids:['itachi','shisui'],mult:4.2},
  {name:'宿命·千手兄弟',ids:['hashirama','tobirama'],mult:4.5},
  {name:'宿命·纸雨轮回',ids:['konan','nagato'],mult:4},
  {name:'宿命·日向双掌',ids:['hinata','neji'],mult:3},
  {name:'宿命·医者传承',ids:['sakura','tsunade'],mult:3.5},
  {name:'宿命·风影之策',ids:['shikamaru','temari'],mult:3},
  {name:'宿命·蛇的传承',ids:['orochimaru','kabuto'],mult:3.5},
];
const EXTRA_TAG_RULES = [
  {name:'冰遁·千杀水翔',tag:'冰遁',elements:['水','风'],mult:3},
  {name:'岚遁·激光连射',tag:'岚遁',elements:['水','雷'],mult:3},
  {name:'熔遁·溶怪之术',tag:'熔遁',elements:['水','火'],mult:3},
  {name:'尘遁·原界剥离',tag:'尘遁',elements:['土','风','火'],mult:4},
  {name:'封印·结界合围',tag:'封印',role:'控制',mult:2},
  {name:'忍具·千刃追击',tag:'忍具',role:'战术',mult:2},
  {name:'骨脉·早蕨之舞',tag:'骨脉',role:'防守',mult:2.2},
  {name:'纸遁·天使降临',tag:'纸遁',role:'支援',mult:2.2},
];
const STARTER_BUILDS = {
  leaf:{name:'第七班·属性连携',hint:'9 张 · 双星成型，师徒与三人班待招募',ids:['naruto','sasuke','sakura','shikamaru','hinata','lee','tenten','asuma','sai'],relic:'team_tactics'},
  storm:{name:'猪鹿蝶·控制爆发',hint:'9 张 · 猪鹿蝶成型，控制→强攻持续成长',ids:['shikamaru','ino','choji','asuma','sakura','kakashi','lee','hinata','sai'],relic:'shadow_scroll'},
  dawn:{name:'砂隐·土风叠层',hint:'9 张 · 砂之三姐弟成型，追逐多属性共振',ids:['gaara','temari','kankuro','naruto','yamato','sakura','tenten','neji','shikamaru'],relic:'storm_drum'}
};

const RULE_TEXT={
  trio:'三人结印：恰好选择 3 张时，最终伤害 ×2。',
  fire_suppression:'水汽压制：火属性忍者基础威力减半。',
  finisher:'终式追击：最后一张忍者的基础威力翻倍。',
  weakness:'流动弱点：对应属性基础威力 ×1.8，每次出击后轮换。',
  diverse:'忍术反噬：相邻两张主属性相同时，最终伤害 ×0.65。',
  exact_four:'精英阵式：恰好选择 4 张时，最终伤害 ×2.5。',
  support_first:'战地补给：第一张为支援、医疗或战术时，最终伤害 ×2。',
  crescendo:'连携升温：本次比上次多出一张牌时，最终伤害 ×2.2。'
};
const NORMAL_RULE_CYCLE=['trio','fire_suppression','finisher','weakness','diverse','exact_four','support_first','crescendo'];
ENCOUNTERS.forEach((e,i)=>{if(!e.mod)e.rule=NORMAL_RULE_CYCLE[(i+e.chapter+e.wave)%NORMAL_RULE_CYCLE.length]});
const BOSS_PHASE_RULES={
  mist:['finisher','weakness'],seal:['trio','exact_four'],armor:['diverse','finisher'],thorns:['crescendo','support_first'],puppet:['support_first','exact_four'],
  rift:['trio','diverse','finisher'],genjutsu:['weakness','support_first','exact_four'],drain:['crescendo','trio','diverse'],roots:['finisher','weakness','support_first'],finale:['trio','crescendo','exact_four']
};
const BOONS=[
  {id:'power',name:'查克拉淬炼',text:'全队基础威力永久 +12。'},
  {id:'fortune',name:'战备补给',text:'立即获得 12 両。'},
  {id:'focus',name:'战术洞察',text:'后续每战多 1 次换手（最多 +3）。'}
];
// Integrate established characters into the expanded affiliations.
for(const [id,team] of [['gaara','五影'],['tsunade','五影'],['tsunade','火影'],['naruto','漩涡家族'],['kakashi','水门班'],['obito','水门班'],['minato','水门班'],['sasuke','鹰小队']]){
 const n=NINJAS.find(n=>n.id===id);if(!n.teams.includes(team))n.teams.push(team);
}
const ninjaName=id=>NINJAS.find(n=>n.id===id).short;
COMBO_GLOSSARY.push(...EXTRA_TEAMS.map(r=>[r.name,(r.ids?r.ids.map(ninjaName).join(' + '):`${r.team} ${r.count}人`)+` · ×${r.mult}`]),...EXTRA_DESTINY.map(r=>[r.name,r.ids.map(ninjaName).join(' + ')+` · ×${r.mult}`]),...EXTRA_TAG_RULES.map(r=>[r.name,`含${r.tag}，${r.elements?'集齐'+r.elements.join('、'):'含'+r.role} · ×${r.mult}`]),['阴→体·破幻追击','相邻选择阴属性→体术角色 · ×1.7'],['战术→控制·先读封锁','相邻选择战术→控制角色 · ×1.45']);

const BASE_BONDS = [
  {name:'第七班·三位一体',ids:['naruto','sasuke','sakura'],mult:3.6},
  {name:'第七班·师徒集结',ids:['naruto','sasuke','sakura','kakashi'],mult:7},
  {name:'猪鹿蝶·影心倍化',ids:['shikamaru','ino','choji'],mult:3.2},
  {name:'砂之三姐弟·砂暴阵',ids:['gaara','temari','kankuro'],mult:3.5},
  {name:'传说三忍·禁域',ids:['jiraiya','tsunade','orochimaru'],mult:6.5},
  {name:'凯班·青春全开',ids:['guy','lee','neji'],mult:4.2},
  {name:'宿命·双星',ids:['naruto','sasuke'],mult:3.7},
  {name:'宿命·兄弟之眼',ids:['sasuke','itachi'],mult:4.5},
  {name:'宿命·师徒螺旋',ids:['naruto','jiraiya'],mult:3},
  {name:'宿命·父子飞雷',ids:['naruto','minato'],mult:3.8},
  {name:'宿命·人柱力共鸣',ids:['naruto','gaara'],mult:2.2},
  {name:'宿命·青春传承',ids:['guy','lee'],mult:3},
  {name:'宿命·终焉之谷',ids:['hashirama','madara'],mult:9}
];
