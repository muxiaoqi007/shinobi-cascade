'use strict';

const ELEMENTS = {
  风: { icon: '風', css: 'wind' },
  火: { icon: '火', css: 'fire' },
  水: { icon: '水', css: 'water' },
  土: { icon: '土', css: 'earth' },
  雷: { icon: '雷', css: 'lightning' },
  阴: { icon: '陰', css: 'yin' },
  体: { icon: '体', css: 'body' }
};

const NINJAS = [
  {id:'naruto', name:'漩涡鸣人', short:'鸣人', icon:'螺', power:78, mult:1.20, elements:['风'], teams:['第七班'], roles:['强攻'], tags:['人柱力','影分身','螺旋丸'], rarity:'rare'},
  {id:'sasuke', name:'宇智波佐助', short:'佐助', icon:'写', power:84, mult:1.25, elements:['火','雷'], teams:['第七班'], roles:['强攻'], tags:['宇智波','写轮眼','千鸟'], rarity:'rare'},
  {id:'sakura', name:'春野樱', short:'小樱', icon:'樱', power:58, mult:1.10, elements:['土'], teams:['第七班'], roles:['医疗','强攻'], tags:['怪力','医疗'], rarity:'common'},
  {id:'kakashi', name:'旗木卡卡西', short:'卡卡西', icon:'雷', power:75, mult:1.22, elements:['雷'], teams:['第七班'], roles:['战术','控制'], tags:['写轮眼','雷切'], rarity:'rare'},
  {id:'yamato', name:'大和', short:'大和', icon:'木', power:68, mult:1.16, elements:['土','水'], teams:['大和班'], roles:['控制','防守'], tags:['木遁'], rarity:'uncommon'},
  {id:'sai', name:'佐井', short:'佐井', icon:'墨', power:62, mult:1.12, elements:['阴'], teams:['大和班'], roles:['控制'], tags:['超兽伪画'], rarity:'common'},
  {id:'shikamaru', name:'奈良鹿丸', short:'鹿丸', icon:'影', power:54, mult:1.18, elements:['阴'], teams:['第十班'], roles:['战术','控制'], tags:['影缝'], rarity:'uncommon'},
  {id:'ino', name:'山中井野', short:'井野', icon:'心', power:48, mult:1.12, elements:['阴'], teams:['第十班'], roles:['医疗','控制'], tags:['心转身'], rarity:'common'},
  {id:'choji', name:'秋道丁次', short:'丁次', icon:'倍', power:74, mult:1.08, elements:['土'], teams:['第十班'], roles:['强攻','防守'], tags:['倍化'], rarity:'common'},
  {id:'asuma', name:'猿飞阿斯玛', short:'阿斯玛', icon:'刃', power:72, mult:1.16, elements:['风','火'], teams:['第十班'], roles:['强攻'], tags:['风刃'], rarity:'uncommon'},
  {id:'hinata', name:'日向雏田', short:'雏田', icon:'柔', power:59, mult:1.16, elements:['体'], teams:['第八班'], roles:['支援','强攻'], tags:['白眼','柔拳'], rarity:'uncommon'},
  {id:'kiba', name:'犬冢牙', short:'牙', icon:'牙', power:66, mult:1.10, elements:['风'], teams:['第八班'], roles:['强攻'], tags:['兽忍'], rarity:'common'},
  {id:'shino', name:'油女志乃', short:'志乃', icon:'虫', power:57, mult:1.14, elements:['土'], teams:['第八班'], roles:['控制'], tags:['寄坏虫'], rarity:'common'},
  {id:'kurenai', name:'夕日红', short:'红', icon:'幻', power:61, mult:1.18, elements:['阴'], teams:['第八班'], roles:['控制','战术'], tags:['幻术'], rarity:'uncommon'},
  {id:'gaara', name:'我爱罗', short:'我爱罗', icon:'砂', power:82, mult:1.22, elements:['土'], teams:['砂之三姐弟'], roles:['控制','防守'], tags:['人柱力','砂遁'], rarity:'rare'},
  {id:'temari', name:'手鞠', short:'手鞠', icon:'扇', power:73, mult:1.18, elements:['风'], teams:['砂之三姐弟'], roles:['强攻'], tags:['风遁'], rarity:'uncommon'},
  {id:'kankuro', name:'勘九郎', short:'勘九郎', icon:'傀', power:65, mult:1.14, elements:['土'], teams:['砂之三姐弟'], roles:['控制'], tags:['傀儡'], rarity:'common'},
  {id:'jiraiya', name:'自来也', short:'自来也', icon:'仙', power:96, mult:1.35, elements:['火','水'], teams:['传说三忍'], roles:['强攻','战术'], tags:['仙人','通灵','螺旋丸'], rarity:'epic'},
  {id:'tsunade', name:'纲手', short:'纲手', icon:'纲', power:92, mult:1.32, elements:['土'], teams:['传说三忍'], roles:['医疗','强攻'], tags:['怪力','医疗','百豪'], rarity:'epic'},
  {id:'orochimaru', name:'大蛇丸', short:'大蛇丸', icon:'蛇', power:90, mult:1.34, elements:['风','阴'], teams:['传说三忍'], roles:['控制','战术'], tags:['禁术','通灵'], rarity:'epic'},
  {id:'itachi', name:'宇智波鼬', short:'鼬', icon:'月', power:102, mult:1.42, elements:['火','阴'], teams:['晓'], roles:['控制','强攻'], tags:['宇智波','写轮眼','幻术'], rarity:'epic'},
  {id:'kisame', name:'干柿鬼鲛', short:'鬼鲛', icon:'鲛', power:94, mult:1.30, elements:['水'], teams:['晓'], roles:['强攻','防守'], tags:['鲛肌'], rarity:'rare'},
  {id:'deidara', name:'迪达拉', short:'迪达拉', icon:'爆', power:97, mult:1.32, elements:['土'], teams:['晓'], roles:['强攻'], tags:['爆遁'], rarity:'rare'},
  {id:'pain', name:'佩恩', short:'佩恩', icon:'輪', power:110, mult:1.48, elements:['雷','阴'], teams:['晓'], roles:['控制','强攻'], tags:['轮回眼'], rarity:'legendary'},
  {id:'minato', name:'波风水门', short:'水门', icon:'闪', power:108, mult:1.44, elements:['风','雷'], teams:['火影'], roles:['强攻','战术'], tags:['飞雷神','螺旋丸'], rarity:'legendary'},
  {id:'guy', name:'迈特凯', short:'凯', icon:'门', power:93, mult:1.30, elements:['体'], teams:['凯班'], roles:['强攻'], tags:['八门遁甲'], rarity:'rare'},
  {id:'lee', name:'洛克李', short:'小李', icon:'拳', power:76, mult:1.20, elements:['体'], teams:['凯班'], roles:['强攻'], tags:['八门遁甲'], rarity:'uncommon'},
  {id:'neji', name:'日向宁次', short:'宁次', icon:'穴', power:79, mult:1.22, elements:['体'], teams:['凯班'], roles:['控制','强攻'], tags:['白眼','柔拳'], rarity:'rare'},
  {id:'hashirama', name:'千手柱间', short:'柱间', icon:'森', power:126, mult:1.58, elements:['土','水'], teams:['火影'], roles:['强攻','控制'], tags:['木遁','仙人'], rarity:'legendary'},
  {id:'madara', name:'宇智波斑', short:'斑', icon:'焰', power:132, mult:1.62, elements:['火','阴'], teams:['传说'], roles:['强攻','控制'], tags:['宇智波','写轮眼'], rarity:'legendary'},
  {id:'obito', name:'宇智波带土', short:'带土', icon:'虚', power:112, mult:1.46, elements:['火','阴'], teams:['晓'], roles:['控制','战术'], tags:['宇智波','写轮眼','时空间'], rarity:'epic'}
];

const RELICS = [
  {id:'shadow_scroll', name:'多重影分身之卷', icon:'影', rarity:'common', cost:7, text:'每张【强攻】牌使本次连锁倍率 ×1.28。'},
  {id:'chakra_thread', name:'查克拉丝线', icon:'丝', rarity:'common', cost:6, text:'每种不同属性使基础伤害 +35%。'},
  {id:'medical_seal', name:'百豪储备', icon:'百', rarity:'uncommon', cost:9, text:'若含【医疗】，最终伤害 ×2.2；每战首次触发再 ×1.6。'},
  {id:'sharingan', name:'三勾玉写轮眼', icon:'写', rarity:'uncommon', cost:10, text:'每触发 1 个组合词条，连锁倍率额外 ×1.16。'},
  {id:'sage_mode', name:'仙人模式', icon:'仙', rarity:'rare', cost:12, text:'一次出击 4 张以上时，最终伤害 ×3。'},
  {id:'curse_mark', name:'咒印暴走', icon:'咒', rarity:'rare', cost:11, text:'恰好 3 张牌时 ×4.5；但本次出击后少抽 1 张。'},
  {id:'eight_gates', name:'八门遁甲', icon:'門', rarity:'rare', cost:13, text:'一次出击 5 张时 ×6；若含【八门遁甲】角色再 ×2。'},
  {id:'jinchuriki_core', name:'尾兽查克拉核', icon:'尾', rarity:'rare', cost:12, text:'每名【人柱力】使最终伤害 ×2.1。'},
  {id:'flying_raijin', name:'飞雷神术式', icon:'闪', rarity:'epic', cost:15, text:'选择顺序中每出现一次“雷→风”或“风→雷”，倍率 ×3.2。'},
  {id:'rinnegan', name:'轮回眼共鸣', icon:'輪', rarity:'epic', cost:17, text:'若本次触发 4 个以上组合，重演倍率链：组合总倍率再平方根式叠乘一次。'},
  {id:'edo_tensei', name:'秽土转生阵', icon:'禁', rarity:'epic', cost:16, text:'每战最后一次出击，已触发过的“宿命组合”倍率再次结算 ×1.8。'},
  {id:'wood_domain', name:'树界降诞', icon:'森', rarity:'epic', cost:16, text:'同时含【土】和【水】时 ×3.5；若含木遁角色再 ×2.5。'},
  {id:'akatsuki_ring', name:'晓之戒', icon:'晓', rarity:'epic', cost:15, text:'每名【晓】成员使倍率 ×1.85，3 名以上再 ×3。'},
  {id:'team_tactics', name:'小队战术卷轴', icon:'隊', rarity:'uncommon', cost:9, text:'同一小队达到 3 人时 ×3；达到 4 人时改为 ×7。'},
  {id:'element_prism', name:'五遁棱镜', icon:'遁', rarity:'legendary', cost:20, text:'每种不同属性使倍率 ×1.75；5 种属性时额外 ×10。'},
  {id:'destiny_knot', name:'宿命之结', icon:'結', rarity:'legendary', cost:21, text:'每个“宿命组合”倍率再 ×2.5。'},
  {id:'limit_break', name:'查克拉限界突破', icon:'∞', rarity:'legendary', cost:22, text:'本次伤害超过目标 50% 时，超出部分转为永久修炼：全队基础威力 +4。'},
  {id:'combo_engine', name:'连携演算式', icon:'Σ', rarity:'legendary', cost:24, text:'第 5 个及之后的组合词条，每个使最终伤害 ×2。'}
];

const ENCOUNTERS = [
  {chapter:1, wave:1, name:'边境巡逻', title:'C 级遭遇', target:2400, reward:6, mod:null},
  {chapter:1, wave:2, name:'桥头伏击', title:'B 级遭遇', target:5200, reward:7, mod:null},
  {chapter:1, wave:3, name:'雾隐追忍', title:'章节首领', target:9200, reward:10, mod:'mist'},

  {chapter:2, wave:1, name:'中忍试炼', title:'资格战', target:17000, reward:8, mod:null},
  {chapter:2, wave:2, name:'森林猎杀', title:'死亡森林', target:34000, reward:9, mod:null},
  {chapter:2, wave:3, name:'封印监考官', title:'章节首领', target:65000, reward:12, mod:'seal'},

  {chapter:3, wave:1, name:'晓之侦察队', title:'S 级警报', target:130000, reward:10, mod:null},
  {chapter:3, wave:2, name:'双人不死组', title:'S 级遭遇', target:280000, reward:11, mod:null},
  {chapter:3, wave:3, name:'幻术空间', title:'章节首领', target:620000, reward:14, mod:'genjutsu'},

  {chapter:4, wave:1, name:'尾兽暴走', title:'灾害级', target:1500000, reward:12, mod:null},
  {chapter:4, wave:2, name:'六道傀儡', title:'超 S 级', target:3400000, reward:13, mod:null},
  {chapter:4, wave:3, name:'查克拉黑洞', title:'章节首领', target:7800000, reward:16, mod:'drain'},

  {chapter:5, wave:1, name:'忍界联军前线', title:'战争级', target:19000000, reward:14, mod:null},
  {chapter:5, wave:2, name:'十万白绝', title:'战争级', target:46000000, reward:15, mod:null},
  {chapter:5, wave:3, name:'神树根界', title:'章节首领', target:120000000, reward:18, mod:'roots'},

  {chapter:6, wave:1, name:'六道门槛', title:'神话级', target:320000000, reward:16, mod:null},
  {chapter:6, wave:2, name:'月之眼倒计时', title:'神话级', target:900000000, reward:18, mod:null},
  {chapter:6, wave:3, name:'终焉之谷', title:'最终首领', target:2800000000, reward:30, mod:'finale'}
];

const BOSS_TEXT = {
  mist:'雾隐：每次出击的第一张牌只提供 45% 基础威力。',
  seal:'封印：每次最多只能选择 4 张牌。',
  genjutsu:'幻术：每次出击随机封印一种属性，该属性卡牌威力减半。',
  drain:'吸收：本战基础倍率 -0.8，最低为 1。',
  roots:'根界：每次出击后锁住 1 张未选手牌，下一次不能选择。',
  finale:'终焉：目标极高，但每个宿命组合在本战额外 ×1.5。'
};

const STARTER_IDS = ['naruto','sasuke','sakura','kakashi','shikamaru','ino','choji','hinata','kiba','shino','gaara','temari','kankuro','lee','neji','sai'];

const COMBO_GLOSSARY = [
  ['第七班集结','鸣人 + 佐助 + 小樱（+卡卡西强化）'],
  ['猪鹿蝶','鹿丸 + 井野 + 丁次'],
  ['砂之三姐弟','我爱罗 + 手鞠 + 勘九郎'],
  ['传说三忍','自来也 + 纲手 + 大蛇丸'],
  ['凯班青春','凯 + 小李 + 宁次'],
  ['晓之共鸣','2 名以上晓成员'],
  ['宿命·双星','鸣人 + 佐助'],
  ['宿命·兄弟','佐助 + 鼬'],
  ['宿命·师徒','鸣人 + 自来也 / 水门'],
  ['宿命·终焉','柱间 + 斑'],
  ['属性连携','按选择顺序触发 风→火、水→雷、火→雷、雷↔风 等'],
  ['五遁大连弹','5 张牌凑齐 5 种不同属性']
];
