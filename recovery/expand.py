from pathlib import Path
import json,re
R=Path('outputs/shinobi-cascade-project')
s=(R/'src/data.js').read_text()
new=[
('tenten','天天','天天',70,1.18,'体','凯班','强攻,支援','忍具,通灵','uncommon','Tenten, brown hair in two buns, Chinese-style sleeveless ninja tunic, deploying a scroll with suspended kunai, crimson gold light'),
('tobirama','千手扉间','扉间',112,1.45,'水,雷','火影','战术,控制','飞雷神,水遁','legendary','Tobirama Senju, white spiky hair, red facial markings, blue armor with white fur collar, forming water dragon, icy blue silver'),
('hiruzen','猿飞日斩','日斩',98,1.34,'火,土','火影','战术,强攻','通灵,忍具','epic','Hiruzen Sarutobi, elderly ninja in dark battle armor and helmet, wielding black and gold long staff, fiery amber wind'),
('kushina','漩涡玖辛奈','玖辛奈',87,1.32,'水,阴','漩涡家族','控制,支援','封印,人柱力','epic','Kushina Uzumaki, long bright red hair, green dress, golden chakra chains coiling around both hands, ocean blue and gold'),
('konan','小南','小南',90,1.30,'风,阴','晓','控制,支援','纸遁','rare','Konan, short blue hair with paper flower, black red-cloud cloak, white origami wings unfurling, pale violet rain'),
('sasori','赤砂之蝎','蝎',95,1.34,'土,阴','晓','控制,战术','傀儡,忍具','epic','Sasori, short red hair, black red-cloud cloak, graceful puppet master with blue chakra threads and wooden puppet arms, amber teal'),
('hidan','飞段','飞段',91,1.28,'体,阴','晓','强攻','禁术,忍具','rare','Hidan, slicked back silver hair, open black red-cloud cloak, triple bladed red scythe fully framed, dark crimson ritual aura, no gore'),
('kakuzu','角都','角都',102,1.36,'火,风,土','晓','强攻,防守','禁术','epic','Kakuzu, hood and lower face mask, green eyes, black red-cloud cloak, floating elemental masks and black threads, emerald orange energy'),
('zabuza','桃地再不斩','再不斩',86,1.26,'水','雾隐','强攻,控制','忍刀,水遁','rare','Zabuza Momochi, black spiky hair, bandaged lower face, large executioner sword entirely inside frame, blue mist and water'),
('haku','白','白',77,1.24,'水,风','雾隐','控制,支援','冰遁','rare','Haku, beautiful androgynous ninja with long black hair tied up, pale green robe, holding white hunter mask, floating ice mirrors and snow'),
('mei','照美冥','照美冥',99,1.36,'水,火','五影','强攻,控制','熔遁,水遁','epic','Mei Terumi, flowing auburn hair covering one eye, blue off-shoulder dress, swirling lava and turquoise vapor, elegant powerful pose'),
('ay','四代雷影','雷影',108,1.38,'雷,体','五影,云隐','强攻,防守','雷铠','epic','Fourth Raikage A, muscular dark-skinned blond man with mustache, white cloak and golden forearm guards, blue lightning armor, full fists visible'),
('bee','奇拉比','奇拉比',103,1.38,'雷,体','云隐','强攻,支援','人柱力,忍刀','epic','Killer Bee, dark-skinned white-haired ninja with sunglasses, white scarf and red rope, acrobatic sword pose with octopus chakra silhouettes, violet gold'),
('ohnoki','两天秤大野木','大野木',103,1.39,'土,风','五影','控制,战术','尘遁','epic','Onoki, tiny elderly bald ninja with white moustache and large red nose, levitating with glowing translucent dust-release cube between hands, rocky sky'),
('darui','达鲁伊','达鲁伊',83,1.25,'水,雷','云隐','强攻,战术','岚遁,忍刀','rare','Darui, dark-skinned ninja with shaggy white hair over one eye, grey flak jacket, broad sword, black panther lightning and blue laser beams'),
('shisui','宇智波止水','止水',99,1.38,'火,风','宇智波','控制,战术','宇智波,写轮眼,幻术','epic','Shisui Uchiha, short dark hair, forehead protector and dark high-collared ninja uniform, green spectral warrior aura, red sharingan eyes'),
('kabuto','药师兜','兜',88,1.31,'水,阴','音隐','医疗,战术','医疗,禁术,仙人','rare','Kabuto Yakushi, silver hair tied back, round glasses, purple high-collared ninja outfit, teal chakra scalpel hands and white snake, mysterious laboratory'),
('kimimaro','君麻吕','君麻吕',89,1.30,'体,土','音隐','强攻,防守','骨脉','rare','Kimimaro, long white hair center part, two red forehead dots, pale tunic and purple rope belt, elegant ivory bone spear, moonlit violet field, no gore'),
('suigetsu','鬼灯水月','水月',81,1.25,'水','鹰小队','强攻,防守','忍刀,水遁','rare','Suigetsu Hozuki, short white hair, purple eyes, sleeveless lavender shirt, huge sword with circular hole, liquid water body and wave splashes'),
('karin','漩涡香燐','香燐',64,1.22,'阴','鹰小队,漩涡家族','医疗,支援','医疗,封印','uncommon','Karin Uzumaki, long red hair, red glasses, lavender ninja shirt, sensing chakra with luminous red gold chains, calm violet backdrop'),
('jugo','重吾','重吾',92,1.29,'土','鹰小队','强攻,防守','仙人,咒印','rare','Jugo, orange spiky hair, gray cloak, one massive rocky transformed arm, orange natural energy and birds, forest rubble, no gore'),
('rin','野原琳','琳',61,1.19,'水','水门班','医疗,支援','医疗,人柱力','uncommon','Rin Nohara, short brown hair and purple rectangular cheek markings, dark ninja tunic and forehead protector, glowing green healing hands, soft blue water'),
('nagato','长门','长门',119,1.52,'水,阴','晓','控制,战术','轮回眼,封印','legendary','Nagato Uzumaki, long red hair and concentric purple rinnegan eyes, dark high-collared cloak, gravitational rings and floating stone spheres, violet red glow'),
('kaguya','大筒木辉夜','辉夜',138,1.65,'火,水,阴','大筒木','强攻,控制','白眼,时空间','legendary','Kaguya Otsutsuki, ethereal pale woman with very long white hair, two horns, third red forehead eye, flowing white patterned robes, lunar dimensional portals, pearl violet gold')]
ninjas=[dict(id=i,name=n,short=sh,icon=sh[0],power=p,mult=m,elements=e.split(','),teams=t.split(','),roles=ro.split(','),tags=ta.split(','),rarity=ra) for i,n,sh,p,m,e,t,ro,ta,ra,art in new]
s=s.replace('\n];\n\nconst RELICS',',\n'+',\n'.join(json.dumps(n,ensure_ascii=False) for n in ninjas)+'\n];\n\nconst RELICS',1)
relics=[
('ice_mirror','魔镜冰晶','rare',12,'含【冰遁】时 ×4；否则水与风共存时 ×2。','A ring of complete floating crystalline ice mirrors reflecting snowflakes, cyan silver'),
('puppet_core','百机赤秘','rare',12,'每名【傀儡】角色 ×2.6；至少两人再 ×2。','A lacquered wooden puppet heart with blue chakra threads and articulated brass joints, red teal'),
('paper_wings','纸海天使','rare',11,'每名【支援】角色 ×1.7；含纸遁再 ×2。','White origami angel wings circling a paper rose, silver lavender'),
('sword_archive','忍刀七卷','rare',12,'每名【忍刀】或【忍具】角色 ×1.9。','A scroll holding seven distinct legendary ninja swords floating as tiny artifacts, steel blue'),
('crimson_chain','金刚封锁','epic',15,'含【封印】时 ×3；含漩涡家族再 ×2。','Complete loop of golden chakra chains sealing a red crystal, gold crimson'),
('storm_drum','岚遁雷鼓','epic',15,'每段水→雷连携 ×2.8。','A floating circular thunder drum with azure lightning and rain currents, cyan purple'),
('hokage_cloak','历代火影御神袍','epic',16,'每名【火影】角色 ×1.9，至少两人再 ×2。','An empty white ceremonial Hokage cloak with red flame hem floating above a stone pedestal, amber'),
('moon_mirror','月读之镜','epic',16,'含【幻术】且有两名阴属性角色时 ×5。','Complete black lacquer ritual mirror with red moon and concentric ripples, crimson black'),
('dust_cube','尘遁结晶','legendary',20,'含【尘遁】时 ×8；否则土风火共存时 ×3。','A complete translucent geometric cube surrounding a radiant white core, gold prismatic'),
('sage_contract','仙兽契约','rare',12,'每名【通灵】或【仙人】角色 ×1.8。','An open summoning contract scroll with three miniature animal spirit silhouettes toad snake slug, jade gold'),
('duet_bell','双人演武铃','uncommon',9,'恰好两张牌时最终伤害 ×18。','Two complete small bronze training bells tied with red silk, deep teal amber'),
('solo_kunai','孤影苦无','rare',12,'只出一张牌时最终伤害 ×80。','One entire three-pronged kunai with black wrapped handle and luminous gold seal, midnight silver'),
('echo_seal','回响封印','epic',15,'与上次出击张数相同时 ×4；每战首次不触发。','Two complete nested jade seal rings creating repeating sound waves, emerald violet'),
('last_flame','不灭意志','rare',12,'每战最后一次出击 ×8。','An undying orange flame held in a complete bronze lantern, dark blue embers'),
('chain_abacus','连锁算珠','legendary',22,'每三个组合词条使最终伤害 ×3。','A complete ornate ninja abacus with glowing prismatic beads and chakra lines, gold teal'),
('war_banner','联军战旗','epic',16,'至少四个不同小队共同行动时 ×6。','Five complete miniature battle banners arranged around a central glowing alliance crest, silver red'),
('treasure_frog','妙木宝囊','uncommon',9,'每战胜利额外获得 4 両。','A whimsical green frog-shaped coin purse spilling golden coins, jade amber'),
('training_weights','青春负重','uncommon',10,'每战胜利全队永久威力 +5。','A pair of complete worn orange ninja ankle weights with green cloth ties and golden energy, forest green')]
rs=[dict(id=i,name=n,icon=n[0],rarity=ra,cost=c,text=t) for i,n,ra,c,t,a in relics]
s=s.replace('\n];\n\nconst ENCOUNTERS',',\n'+',\n'.join(json.dumps(n,ensure_ascii=False) for n in rs)+'\n];\n\nconst ENCOUNTERS',1)
# Preserve original encounters in original backup, replace campaign with evenly scaled chapters.
chapters=[('波之国',['边境巡逻','大桥伏击','再不斩·无声暗杀'],'mist'),('中忍试炼',['死亡森林','预选对决','大蛇丸·五行封印'],'seal'),('木叶崩溃',['砂忍突袭','通灵兽攻城','我爱罗·砂之绝壁'],'armor'),('追逐叛忍',['音忍结界','终末追击','君麻吕·骨林'],'thorns'),('晓之猎影',['砂隐夺还','百机操演','赤砂之蝎·傀儡剧场'],'puppet'),('不死之章',['飞段的仪式','角都的心脏','宇智波鼬·月读'],'genjutsu'),('佩恩来袭',['六道突袭','地爆天星','佩恩·查克拉黑洞'],'drain'),('五影集结',['雷影演武','雾隐风暴','带土·神威空间'],'rift'),('忍界大战',['白绝军团','秽土联阵','宇智波斑·神树根界'],'roots'),('月下终焉',['六道觉醒','辉夜·天之御中','终焉之谷·宿命双星'],'finale')]
enc=[]
for ci,(name,waves,mod) in enumerate(chapters):
 for wi,n in enumerate(waves):
  j=ci*3+wi
  enc.append(dict(chapter=ci+1,chapterName=name,wave=wi+1,name=n,title='章节首领' if wi==2 else '远征遭遇',target=round(2800*1.51**j/100)*100,reward=9+ci+(4 if wi==2 else 0),mod=mod if wi==2 else None))
s=re.sub(r'const ENCOUNTERS = \[.*?\n\];','const ENCOUNTERS = '+json.dumps(enc,ensure_ascii=False,indent=2)+';',s,flags=re.S)
s=s.replace("const BOSS_TEXT = {","const BOSS_TEXT = {\n  armor:'砂壁：不足三种属性时，伤害降低 65%。',\n  thorns:'骨林：连续出击相同张数时，伤害降低 60%。',\n  puppet:'傀儡：缺少战术角色时，伤害降低 55%。',\n  rift:'神威：出击三张以上时，最后一张基础威力归零，组合仍生效。',")
# Readable fixed glossary, synced later with actual rules.
s=s.replace("text:'每种不同属性使基础伤害 +35%。'","text:'首种以外，每多一种不同属性，基础伤害 +35%。'")
s=s.replace("text:'每战最后一次出击，已触发过的“宿命组合”倍率再次结算 ×1.8。'","text:'每战最后一次出击，本次每个宿命组合额外 ×1.8。'")
s=s.replace("text:'本次伤害超过目标 50% 时，超出部分转为永久修炼：全队基础威力 +4。'","text:'单次伤害超过目标的 150% 时，全队威力永久 +4，每战一次。'")
(R/'src/data.js').write_text(s)
original_subjects={
'naruto':'Naruto Uzumaki, blond spiky hair, orange black ninja outfit, glowing blue Rasengan',
'sasuke':'Sasuke Uchiha, black spiky hair, grey open collar shirt, purple rope belt, crackling blue Chidori in hand',
'sakura':'Sakura Haruno, short pink hair, red sleeveless tunic, black gloves, powerful glowing pink chakra punch',
'kakashi':'Kakashi Hatake, silver spiky hair, black face mask, tilted headband over left eye, green flak vest, blue lightning blade',
'yamato':'Yamato, short brown hair, metal forehead and cheek guard, green ninja vest, rising wood branches and jade chakra',
'sai':'Sai, short black hair, pale face, cropped black ninja top, holding an ink brush and unrolled scroll, ink tigers',
'shikamaru':'Shikamaru Nara, black ponytail, green ninja vest, hand forming a strategic seal, living shadows on ground',
'ino':'Ino Yamanaka, long blond ponytail, purple sleeveless ninja outfit, elegant mind-transfer hand gesture, violet chakra',
'choji':'Choji Akimichi, brown hair, spiral cheek marks, red armor and scarf, enlarged fist with butterfly chakra wings',
'asuma':'Asuma Sarutobi, short black hair and beard, green ninja vest, paired chakra blades and turquoise wind',
'hinata':'Hinata Hyuga, long dark blue hair, pale lavender eyes, lavender jacket, glowing blue twin lion fists',
'kiba':'Kiba Inuzuka, brown spiky hair, red fang cheek marks, grey fur-lined jacket, white dog Akamaru and spiraling wind',
'shino':'Shino Aburame, dark round sunglasses, hooded high-collared olive coat, swirling luminous beetles',
'kurenai':'Kurenai Yuhi, long black wavy hair, red eyes, red-white bandage-pattern outfit, illusion petals and red moon',
'gaara':'Gaara, short red hair, forehead love tattoo, dark red outfit, complete sand gourd on back, curling golden sand',
'temari':'Temari, blond hair in four short bunches, dark ninja dress, large fully visible opened fan with purple circles and wind',
'kankuro':'Kankuro, dark hooded ninja outfit, purple face paint, wooden puppet and blue chakra threads',
'jiraiya':'Jiraiya, long spiky white hair, red eye markings, red sleeveless coat over green robe, blue Rasengan and toad silhouette',
'tsunade':'Tsunade, long blond twin ponytails, violet diamond on forehead, green haori and grey blouse, glowing green healing chakra',
'orochimaru':'Orochimaru, long straight black hair, pale face, golden snake eyes, beige tunic and purple rope belt, white snakes and violet energy',
'itachi':'Itachi Uchiha, black hair framing face, red sharingan eyes, black red-cloud cloak, crows and crimson moon',
'kisame':'Kisame Hoshigaki, blue skin and shark-like facial features, dark blue spiky hair, red-cloud cloak, bandaged Samehada sword and blue waves',
'deidara':'Deidara, blond ponytail covering one eye, black red-cloud cloak, small white clay bird in palm, gold explosion clouds',
'pain':'Pain Tendo, orange spiky hair, facial piercings and concentric violet rinnegan eyes, black red-cloud cloak, gravitational rings',
'minato':'Minato Namikaze, blond spiky hair, green vest and white flame-hem cloak, three-pronged kunai and golden teleportation rings',
'guy':'Might Guy, black bowl haircut, thick eyebrows, green jumpsuit and flak jacket, orange leg warmers, emerald eight gates energy',
'lee':'Rock Lee, black bowl haircut, thick eyebrows, green jumpsuit and orange leg warmers, wrapped fists in martial arts stance',
'neji':'Neji Hyuga, long dark brown hair, pale byakugan eyes, white ninja tunic, precise palm strike with silver chakra circles',
'hashirama':'Hashirama Senju, long straight black hair, red samurai armor, huge wooden dragon and jade forest chakra',
'madara':'Madara Uchiha, long wild black hair, red samurai armor, red sharingan eyes, spectral blue Susanoo and red fire',
'obito':'Obito Uchiha, orange spiral mask with single eye hole, dark red-cloud cloak, swirling violet space-time vortex'}
old_relic={
'shadow_scroll':'A complete ancient open golden scroll releasing luminous ninja shadow silhouettes',
'chakra_thread':'An intricate complete crystalline loom of blue chakra threads, luminous silk spool',
'medical_seal':'A complete jade diamond healing seal, green energy blooming like a lotus',
'sharingan':'A crimson sharingan eye jewel with three black tomoe inset in a complete obsidian amulet',
'sage_mode':'A complete golden toad sage talisman with orange eye motifs and leaf spirals',
'curse_mark':'An entire dark violet stone amulet bearing a three-point black curse mark, purple flames',
'eight_gates':'Eight complete glowing chakra gates arranged vertically around a bronze human-energy statue',
'jinchuriki_core':'A complete fiery red tailed beast chakra sphere within golden sealing rings',
'flying_raijin':'A complete three-pronged kunai resting above golden teleportation rings and parchment seals',
'rinnegan':'A complete violet concentric-ring eye jewel levitating above an obsidian pedestal',
'edo_tensei':'A complete summoning scroll encircled by tiny closed stone coffins and teal spirit fire',
'wood_domain':'A complete miniature ancient tree realm growing from a jade stone talisman',
'akatsuki_ring':'A complete silver ninja ring with crimson stone and red cloud energy',
'team_tactics':'A complete open tactical scroll with four small ninja figures linked by luminous geometric paths',
'element_prism':'A complete floating prismatic crystal with five elemental streams fire water earth lightning wind',
'destiny_knot':'A complete intricate golden infinity knot tying red and blue silk ribbons together',
'limit_break':'A complete fractured blue chakra crystal with an infinity-shaped energy loop',
'combo_engine':'A complete intricate golden mechanical chakra gyroscope with nested prismatic rings'}
jobs=[]
common='Use case: stylized-concept. ONE independent complete portrait collectible card illustration for SHINOBI CASCADE. Rich finely detailed Japanese anime fantasy painting. Deep navy atmospheric background, holographic rainbow glints along a thin elegant silver frame, premium collectible finish. Portrait 2:3. ONE card fills image, all four border edges fully visible, 5% safe margins. Keep head, hair, hands, main weapon and magical effect inside frame. No neighboring card, no grid, no collage, no lettering, no numbers, no title, no stats. The game renders readable text separately. Subject: '
for i,sub in [*original_subjects.items(),*((x[0],x[-1]) for x in new)]: jobs.append(dict(kind='ninja',id=i,prompt=common+sub+'. Dynamic three-quarter body action composition, coherent anatomy.'))
for i,sub in [*old_relic.items(),*((x[0],x[-1]) for x in relics)]: jobs.append(dict(kind='relic',id=i,prompt=common+sub+'. An enchanted artifact still life, centered whole object completely visible with breathing room, no human portrait.'))
for j in jobs:(R/f'assets/prompts/{j["kind"]}-{j["id"]}.txt').write_text(j['prompt'])
(R/'assets/generation-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2))
print('Added',len(ninjas),'ninjas,',len(rs),'relics. Image jobs:',len(jobs))
