"use strict";
/* ==========================================================
   いっせんどう v4 — きょうつう（どうぐ・ほぞん・データ）
   ========================================================== */
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const TAU=Math.PI*2;
const Ease={
  outCubic:t=>1-Math.pow(1-t,3),
  inCubic:t=>t*t*t,
  outQuad:t=>1-(1-t)*(1-t),
  inOut:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,
  outBack:t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);},
  outElastic:t=>t<=0?0:t>=1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*(TAU/3))+1,
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- ほぞん ばしょ（localStorage が だめ なら session → memory） ---------- */
const SAVE_KEY="issendo_save_v3", BAK_KEY="issendo_save_v3_bak", _mem={};
function testStorage(kind){
  try{ const k="__issendo_test__"; window[kind].setItem(k,"1"); window[kind].removeItem(k); return true; }
  catch(e){ return false; }
}
const STORAGE_MODE = testStorage("localStorage") ? "local"
                    : testStorage("sessionStorage") ? "session" : "memory";
const Store={
  get(k){
    try{
      if(STORAGE_MODE==="local")return localStorage.getItem(k);
      if(STORAGE_MODE==="session")return sessionStorage.getItem(k);
    }catch(e){}
    return _mem[k]??null;
  },
  set(k,v){
    try{
      if(STORAGE_MODE==="local"){localStorage.setItem(k,v);return;}
      if(STORAGE_MODE==="session"){sessionStorage.setItem(k,v);return;}
    }catch(e){}
    _mem[k]=v;
  },
  del(k){
    try{
      if(STORAGE_MODE==="local"){localStorage.removeItem(k);return;}
      if(STORAGE_MODE==="session"){sessionStorage.removeItem(k);return;}
    }catch(e){}
    delete _mem[k];
  }
};

/* ==========================================================
   データ
   ========================================================== */
/* ステージ（4たい ごとに 1ステージ。4たいめ が ボス） */
const STAGES=[
  {name:"はじまり の はらっぱ", bg:"bg_s1", col:"#7cc47a", sky:["#7fd3ff","#d9f4ff"], amb:"petal"},
  {name:"ゆうやけ こうや",     bg:"bg_s2", col:"#e8a25a", sky:["#ff9a5a","#ffd29a"], amb:"dust"},
  {name:"こおり の やま",       bg:"bg_s3", col:"#9fd8f0", sky:["#2d4f8f","#8fd3e8"], amb:"snow"},
  {name:"ほのお の かざん",     bg:"bg_s4", col:"#c0503a", sky:["#5a1e2e","#ff8a4c"], amb:"ember"},
  {name:"めいおう の しろ",     bg:"bg_s5", col:"#7a5ac0", sky:["#1e1440","#6a3aa8"], amb:"magic"},
  /* うら の せかい（20たい たおす と ひらく） */
  {name:"よる の はらっぱ",       bg:"bg_s6", col:"#3d5a86", sky:["#101a3e","#2c4a86"], amb:"firefly", w2:1},
  {name:"たそがれ の こうや",     bg:"bg_s7", col:"#7a4a8a", sky:["#3a1e5a","#a0508a"], amb:"dust", w2:1},
  {name:"くれない の ゆきやま",   bg:"bg_s8", col:"#e08a9a", sky:["#5a1030","#e06a7a"], amb:"snow", w2:1},
  {name:"あおい ほのお の かざん", bg:"bg_s9", col:"#2a6a7a", sky:["#0a2a3a","#2a9aaa"], amb:"ember", ambCol:"#7fe0ff", w2:1},
  {name:"あかい つき の しろ",     bg:"bg_s10",col:"#8a2a5a", sky:["#2a0a20","#9a2a5a"], amb:"magic", ambCol:"#ff7a9a", w2:1},
];
const MAIN=20;                                   /* さいしょ の せかい の てき の かず */
const world2Open=()=>S.cleared>=MAIN;            /* うら の せかい が ひらいた か */
const goalN=()=>world2Open()?ENEMIES.length:MAIN;

/* てき 20たい（2026-10-25：とっくん の のびかた に あわせて つよさ を みなおした） */
const ENEMIES=[
 {id:"e01",n:"どろ すらいむ",   hp:45,atk:6,  sp:52, g:30,   c:"#7fd88f", c2:"#4fae63", form:"blob",     size:1.0, h:92,
  line:"ぷるぷる… かかって こい！", desc:"どろ で できた すらいむ。ぷにぷに していて、とびはねる。"},
 {id:"e02",n:"おお ねずみ",     hp:150,atk:13,  sp:78, g:45,   c:"#c9a98a", c2:"#8e6f52", form:"beast",    size:.95, h:96,
  line:"ちゅちゅー！ ちーず を よこせ！", desc:"とっても おおきい ねずみ。はしる のが とても はやい。"},
 {id:"e03",n:"やぶ ごぶりん",   hp:240,atk:20, sp:70, g:65,   c:"#9ccf5c", c2:"#6d9c34", form:"humanoid", size:1.0, ear:1, h:118,
  line:"げっへっへ、いたずら して やる！", desc:"やぶ に かくれて いたずら ばかり する ごぶりん。"},
 {id:"e04",n:"もり おおかみ",   hp:360,atk:28, sp:96, g:90,   c:"#9aa8c4", c2:"#5f6c85", form:"beast",    size:1.15, h:160, boss:1,
  line:"がおーん！ この もり は おれ の ものだ！", desc:"もり の ぬし。するどい きば と はやい あし を もつ。"},
 {id:"e05",n:"がいこつ けんし", hp:670,atk:51, sp:74, g:130,  c:"#f2ecdd", c2:"#b9b09a", form:"humanoid", size:1.05, skull:1, weap:"sword", h:142,
  line:"かたかた… けん の しょうぶ だ！", desc:"ほね だけ に なっても、けん の れんしゅう を つづけて いる。"},
 {id:"e06",n:"いし ごーれむ",   hp:1060,atk:79, sp:44, g:180,  c:"#a3a7ae", c2:"#6d7178", form:"giant",    size:1.25, h:178,
  line:"ごごご… ここ は とおさ ない…", desc:"いし で できた からだ。とっても かたくて おもい。"},
 {id:"e07",n:"ひ とかげ",       hp:1540,atk:115, sp:88, g:250,  c:"#ff8a4c", c2:"#d1481f", form:"beast",    size:1.1,  glow:"#ffb703", h:140,
  line:"しゃー！ まるこげ に して やる！", desc:"しっぽ の さき で ほのお が ぼうぼう もえて いる。"},
 {id:"e08",n:"とうぞく の かしら",hp:2450,atk:130, sp:100,g:340,  c:"#d8b06a", c2:"#9a7433", form:"humanoid", size:1.05, mask:1, weap:"dagger", h:172, boss:1,
  line:"がっはっは！ おたから は いただく ぜ！", desc:"たから が だいすき な とうぞく の おやぶん。すばやい。"},
 {id:"e09",n:"どく ぐも",       hp:3550,atk:190, sp:92, g:470,  c:"#a97fd6", c2:"#6f4aa3", form:"bug",      size:1.1, h:122,
  line:"しゅるる… いと で ぐるぐる に して やる", desc:"どく の いと を はく くも。あし が 8ほん ある。"},
 {id:"e10",n:"こおり の まじょ",hp:4820,atk:255, sp:66, g:640,  c:"#8fd3f4", c2:"#4b9ec9", form:"caster",   size:1.05, glow:"#bff0ff", h:162,
  line:"ふふっ、かちこち に して あげる", desc:"こおり の まほう で なんでも かちこち に して しまう。"},
 {id:"e11",n:"よろい きし",     hp:6350,atk:330, sp:70, g:880,  c:"#b7c4dc", c2:"#6c7d9c", form:"humanoid", size:1.15, armor:1, weap:"sword", h:180,
  line:"われ の よろい は やぶれぬ！", desc:"おもい よろい で こうげき を はねかえす つよい きし。"},
 {id:"e12",n:"かみなり どり",   hp:9190,atk:360, sp:118,g:1200, c:"#ffe066", c2:"#e0a500", form:"flyer",    size:1.1,  glow:"#fff3b0", h:186, boss:1, fly:26,
  line:"ぴしゃーん！ かみなり を くらえ！", desc:"はばたく と そら から かみなり が おちて くる。"},
 {id:"e13",n:"しかばね づかい", hp:11200,atk:555, sp:64, g:1600, c:"#9a8fd6", c2:"#5f4f9c", form:"caster",   size:1.1,  skull:1, glow:"#c2b0ff", h:172, fly:8,
  line:"ひっひっひ… おばけ たち、いけ！", desc:"おばけ を あやつる ふしぎ な まほうつかい。"},
 {id:"e14",n:"ようがん きょじん",hp:15200,atk:735,sp:52, g:2200, c:"#ff6b4a", c2:"#a32d17", form:"giant",    size:1.4,  glow:"#ffb703", h:222,
  line:"ぐおおお… あつい ぞ…！", desc:"からだ の なか を あつい ようがん が ながれて いる。"},
 {id:"e15",n:"そうけん おに",   hp:19800,atk:955,sp:104,g:3000, c:"#ff7f9e", c2:"#c03a5c", form:"humanoid", size:1.2,  horn:1, weap:"twin", h:192,
  line:"2ほん の かたな、よけ られる か！", desc:"2ほん の かたな を ふりまわす つよい おに。"},
 {id:"e16",n:"だいじゃ ぬし",   hp:29000,atk:1070,sp:80, g:4000, c:"#5fc98f", c2:"#2f8b5c", form:"serpent",  size:1.3, h:228, boss:1,
  line:"しゃああ… まる のみ に して くれる", desc:"やま より ながい と いわれる、へび の ぬし。"},
 {id:"e17",n:"だ てんし",       hp:31500,atk:1510,sp:96, g:5400, c:"#e6dcff", c2:"#a08fd0", form:"flyer",    size:1.2,  halo:1, h:200, fly:22,
  line:"ひかり と やみ の ちから、みせて あげる", desc:"そら から おちて きた てんし。ひかり と やみ を あやつる。"},
 {id:"e18",n:"りゅう きへい",   hp:37500,atk:1860,sp:88, g:7200, c:"#7f9dd6", c2:"#43629c", form:"humanoid", size:1.25, wing:1, weap:"lance", h:208,
  line:"りゅう の やり、うけて みよ！", desc:"りゅう の ちから を もつ きし。ながい やり が ぶき。"},
 {id:"e19",n:"こりゅう ばるが", hp:45500,atk:2180,sp:82, g:9600, c:"#e0a54c", c2:"#a06a1c", form:"dragon",   size:1.45, h:236,
  line:"ぐおおおお！！ ちいさき もの よ…", desc:"とても ふるい りゅう。くち から ほのお を はく。"},
 {id:"e20",n:"めいおう のくす", hp:61100,atk:2260,sp:98, g:15000,c:"#b57ff0", c2:"#6a2fa8", form:"boss",     size:1.5,  horn:1, wing:1, glow:"#e0b0ff", h:258, boss:1,
  line:"よくぞ ここ まで きた…。さいご の しょうぶ だ！", desc:"めいかい の おう。いっせんどう さいご の てき。"},
];
/* うら の せかい：もと の てき の いろちがい（え は img/enemy/e21〜e40 = art-work/variants.py で つくった） */
[
 ["e21","e01","きんいろ すらいむ",   56000,3190, 16100,"#ffd23f","ぴかぴか！ つかまえて ごらん！","きんいろ に ひかる すらいむ。とっても かたくて すばやい。"],
 ["e22","e02","やみ ねずみ",         62100,3670, 17300,"#b07cff","ちゅちゅっ… やみ に まぎれて かじる ぞ","やみ の なか で くらす ねずみ。よる に なると つよく なる。"],
 ["e23","e03","あか ごぶりん",       70900,4040, 18600,"#ff6b5b","げへへ！ しゅぎょう して もどって きた ぜ！","しゅぎょう して まっか に なった ごぶりん。ちから もち。"],
 ["e24","e04","ほのお の おおかみ おう",93300,3830,20000,"#ff8a3c","がおおお！ もえる きば を うけて みよ！","ほのお を まとう おおかみ の おう。あしあと が こげて いる。"],
 ["e25","e05","やみ がいこつ",       93600,4840, 21500,"#a78bd8","かたかた… やみ の けん は おもい ぞ","やみ の ちから で よみがえった がいこつ の けんし。"],
 ["e26","e06","おうごん ごーれむ",   106000,5370, 23100,"#ffd23f","ごごご… きん の からだ は こわれない","きん で できた ごーれむ。とても おもくて かたい。"],
 ["e27","e07","あおび とかげ",       119000,5930, 24900,"#6fd3ff","しゃー！ あおい ほのお は もっと あつい ぞ！","あおい ほのお を はく とかげ。あかい ほのお より あつい。"],
 ["e28","e08","かげ とうぞく の かしら",152000,5670,26800,"#8a7cff","がっはっは！ こんど は ほし を いただく！","かげ に かくれる とうぞく の かしら。そら の ほし まで ねらう。"],
 ["e29","e09","ほのお ぐも",         154000,7340, 28800,"#ff7a3c","しゅるる… もえる いと で ぐるぐる だ","もえる いと を はく くも。さわると あちち。"],
 ["e30","e10","まぼろし の まじょ",  176000,8300, 30900,"#ff8fd8","うふふ、ゆめ の まほう を みせて あげる","こおり の まじょ の いもうと。まぼろし を みせる。"],
 ["e31","e11","おうごん きし",       202000,9300, 33200,"#ffe27a","わが きん の よろい、やぶれる もの か！","きん の よろい の きし。どんな けん も はねかえす。"],
 ["e32","e12","やみ いかずち どり", 261000,9030, 35700,"#c27bff","ごろごろ… むらさき の かみなり を くらえ！","むらさき の かみなり を おとす とり。くも の うえ に すむ。"],
 ["e33","e13","みどり の しかばね づかい",253000,11100,38400,"#7dff9a","ひっひっ… もり の おばけ たち よ、いけ！","もり の おばけ を あやつる まほうつかい。"],
 ["e34","e14","ひょうが きょじん",  277000,12000, 41300,"#8fe3ff","ぐおお… すべて こおらせて やる…","ようがん が こおって できた きょじん。ひえひえ。"],
 ["e35","e15","あお おに",          302000,12900, 44400,"#6fa8ff","あかおに より つよい ぞ！ かかって こい！","そうけん おに の おにいさん。2ほん の かたな の たつじん。"],
 ["e36","e16","はくじゃ ぬし",      371000,12200, 47700,"#e8f6ff","しゃああ… しろき へび の ちから を しれ","しろく かがやく へび の ぬし。かみさま の つかい と いわれる。"],
 ["e37","e17","くれない てんし",    352000,15000, 51300,"#ff7f9e","あかい はね で、つつみこんで あげる","あかい はね の てんし。ほのお と ひかり を あやつる。"],
 ["e38","e18","ほのお りゅう きへい",373000,16500, 55100,"#ff6b4a","もえる やり、よけ られる か！","ほのお の りゅう の ちから を もつ きし。やり が もえて いる。"],
 ["e39","e19","こくりゅう ばるが",  407000,17400, 59300,"#b07cff","ぐおおお！ やみ の ほのお で もやしつくす！","やみ に そまった こりゅう。いっせんどう で いちばん ふるい。"],
 ["e40","e20","むげん の まおう ぜろ",497000,16300,63700,"#ff4d6d","ついに きたか…。わたし こそ が ほんとう の まおう だ！","めいおう のくす を うごかして いた、ほんとう の まおう。"],
].forEach(([id,base,n,hp,atk,g,glow,line,desc])=>{
  const b=ENEMIES.find(e=>e.id===base);
  ENEMIES.push(Object.assign({},b,{id,base,n,hp,atk,g,glow,line,desc,w2:1,sp:Math.round(b.sp*1.08),h:Math.round(b.h*(b.boss?1.04:1.08))}));
});
ENEMIES.forEach((e,i)=>{ e.idx=i; e.stage=Math.floor(i/4); });

/* わざ（ねだん・つよさ は もとの まま。fam = おなじ なかま は いちばん つよい もの だけ ボタン に でる） */
const SKILLS=[
 {id:"sp1",name:"はやあし 1",cat:"passive",cost:120, val:.18,icon:"👟",fam:"sp",desc:"うごく はやさ が ＋18％"},
 {id:"sp2",name:"はやあし 2",cat:"passive",cost:400, val:.36,req:"sp1",icon:"👟",fam:"sp",desc:"うごく はやさ が ＋36％"},
 {id:"sp3",name:"はやあし 3",cat:"passive",cost:1200,val:.56,req:"sp2",icon:"👟",fam:"sp",desc:"うごく はやさ が ＋56％"},
 {id:"sp4",name:"はやあし きわみ",cat:"passive",cost:3500,val:.80,req:"sp3",icon:"⚡",fam:"sp",desc:"うごく はやさ が ＋80％"},
 {id:"cr", name:"かいしん の こころ",cat:"passive",cost:20000,icon:"💫",fam:"cr",w2:1,desc:"かいしん（2ばい だめーじ）が 2ばい でやすく なる"},
 {id:"ug", name:"ひっさつ の こころ",cat:"passive",cost:25000,icon:"🔥",fam:"ug",w2:1,desc:"ひっさつ が 1.5ばい はやく たまる"},
 {id:"r2", name:"かまいたち",   cat:"active",kind:"melee",cost:300, cd:.8, range:150,dmg:1.0,icon:"🌪️",fam:"r",wind:1,desc:"かぜ の やいば。とどく ところ が 2ばい"},
 {id:"r3", name:"おお かまいたち", cat:"active",kind:"melee",cost:1100,cd:1.0,range:225,dmg:1.15,req:"r2",icon:"🌪️",fam:"r",wind:1,desc:"おおきな かぜ の やいば。とどく ところ が 3ばい"},
 {id:"h1", name:"いき 1",cat:"active",kind:"heal", cost:250, cd:14,ratio:.25,icon:"💚",fam:"h",desc:"たいりょく が 25％ かいふく"},
 {id:"h2", name:"いき 2",cat:"active",kind:"heal", cost:900, cd:13,ratio:.40,req:"h1",icon:"💚",fam:"h",desc:"たいりょく が 40％ かいふく"},
 {id:"h3", name:"いき 3",cat:"active",kind:"heal", cost:2600,cd:12,ratio:.60,req:"h2",icon:"💖",fam:"h",desc:"たいりょく が 60％ かいふく"},
 {id:"h4", name:"いき きわみ",cat:"active",kind:"heal", cost:12000,cd:11,ratio:.80,req:"h3",icon:"💗",fam:"h",w2:1,desc:"たいりょく が 80％ かいふく"},
 {id:"drop",name:"そら おとし",  cat:"active",kind:"drop", cost:1500,cd:5, dmg:2.2,icon:"☄️",fam:"drop",desc:"てき の うえ から ひかる けん を おとす"},
 {id:"d2", name:"そら おとし きわみ",cat:"active",kind:"drop",cost:30000,cd:5,dmg:2.2,multi:3,req:"drop",icon:"🌠",fam:"drop",w2:1,desc:"ひかる けん が 3ぼん ふって くる"},
 {id:"k1", name:"ふきとばし 1",cat:"active",kind:"melee",cost:350, cd:2.5,range:110,dmg:1.1,knock:150,icon:"💨",fam:"k",desc:"きって ふっとばす"},
 {id:"k2", name:"ふきとばし 2",cat:"active",kind:"melee",cost:1000,cd:2.5,range:110,dmg:1.4,knock:250,req:"k1",icon:"💨",fam:"k",desc:"もっと ふっとばす"},
 {id:"k3", name:"ふきとばし きわみ",cat:"active",kind:"melee",cost:3000,cd:2.4,range:115,dmg:1.8,knock:380,req:"k2",icon:"💥",fam:"k",desc:"かべ まで ふっとばす"},
 {id:"sw", name:"つばめがえし", cat:"active",kind:"melee",cost:600, cd:1.6,range:105,dmg:1.35,back:140,icon:"🐦",fam:"sw",desc:"きって すぐ さがる"},
 {id:"b1", name:"や 1",cat:"active",kind:"arrow",cost:300, cd:.9, dmg:.45,spd:560,icon:"🏹",fam:"b",desc:"よわい けど とおく へ とぶ や"},
 {id:"b2", name:"や 2",cat:"active",kind:"arrow",cost:1000,cd:.75,dmg:.60,spd:640,req:"b1",icon:"🏹",fam:"b",desc:"はやくて つよい や"},
 {id:"b3", name:"や きわみ",cat:"active",kind:"arrow",cost:3200,cd:.6,dmg:.80,spd:740,req:"b2",icon:"🎯",fam:"b",desc:"ひかる や を れんぞく で うてる"},
 {id:"ch", name:"ためぎり", cat:"active",kind:"charge",cost:2200,cd:6,range:135,dmg:3.6,knock:300,icon:"🔥",fam:"ch",desc:"ためて おおきい だめーじ ＋ ふきとばし"},
 {id:"jp", name:"そらがけ", cat:"active",kind:"jump", cost:800, cd:1.8,icon:"🦘",fam:"jp",desc:"たかく とぶ。ゆか の こうげき を よける"},
 {id:"gd", name:"むてき", cat:"active",kind:"guard",cost:1600,cd:7,dur:2,icon:"🛡️",fam:"gd",desc:"2びょう むてき。おわって 5びょうご に また つかえる"},
];
const SK=Object.fromEntries(SKILLS.map(s=>[s.id,s]));

/* けん の ランク（こうげき が あがる と けん が しんか する） */
const SWORDS=[
  {min:0,   name:"きの けん",       blade:"#e3b27a", edge:"#b9824a", glow:null,      ult:"いっせん ぎり"},
  {min:20,  name:"てつ の けん",     blade:"#dfe6ee", edge:"#8d99a8", glow:null,      ult:"いっせん ぎり"},
  {min:50,  name:"はがね の けん",   blade:"#f4fbff", edge:"#7fb2e0", glow:"#bfe6ff", ult:"はがね いっせん"},
  {min:110, name:"ほのお の けん",   blade:"#ffd27a", edge:"#ff6b2c", glow:"#ff9a3c", ult:"ほのお いっせん"},
  {min:220, name:"いかずち の けん", blade:"#fffbd0", edge:"#ffd000", glow:"#fff27a", ult:"いかずち いっせん"},
  {min:400, name:"にじいろ の けん", blade:"#ffffff", edge:"#b98bff", glow:"#ffffff", ult:"にじいろ いっせん"},
  {min:1000, name:"ほし の けん",     blade:"#eaf4ff", edge:"#6fa8ff", glow:"#9fd0ff", ult:"ほしふる いっせん"},
  {min:3000, name:"たいよう の けん", blade:"#fff4c2", edge:"#ff9a1f", glow:"#ffd36b", ult:"たいよう いっせん"},
  {min:7000, name:"りゅう の けん",   blade:"#e8fff4", edge:"#1fbf8f", glow:"#6fffc8", ult:"りゅうじん いっせん"},
  {min:15000,name:"でんせつ の けん", blade:"#ffffff", edge:"#ffd23f", glow:"#ffffff", ult:"でんせつ の いっせん"},
];
function swordRank(atk){ let r=0; SWORDS.forEach((s,i)=>{ if(atk>=s.min)r=i; }); return r; }

/* ---------- セーブ ---------- */
const fresh=()=>({maxHp:50,atk:8,gold:0,cleared:0,skills:[],mute:false,
  v:4,bgm:true,se:true,voice:true,matome:true,zukan:{},tut:{},swings:0,runs:0,wins:0,ults:0,rank:0});
let S=fresh();
function normalize(d){
  const old=(d&&typeof d==="object")?d:{};
  const s=Object.assign(fresh(),old);
  const num=(v,def,min)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.max(min,v):def;};
  s.maxHp=num(s.maxHp,50,1); s.atk=num(s.atk,8,1); s.gold=num(s.gold,0,0);
  s.cleared=clamp(num(s.cleared,0,0),0,ENEMIES.length);
  s.skills=Array.isArray(s.skills)?[...new Set(s.skills.filter(id=>SK[id]))]:[];
  if(!s.zukan||typeof s.zukan!=="object"||Array.isArray(s.zukan))s.zukan={};
  for(let i=0;i<s.cleared;i++){ if(!s.zukan[i])s.zukan[i]={w:1,s:0}; }
  if(!s.tut||typeof s.tut!=="object")s.tut={};
  if(old.v===undefined){               /* v3 → v4 */
    s.bgm=!old.mute; s.se=!old.mute; s.voice=true;
    s.rank=swordRank(s.atk);
    if(s.cleared>0||s.skills.length)s.tut={move:1,atk:1,ult:0};
  }
  s.rank=clamp(num(s.rank,0,0),0,SWORDS.length-1);
  s.matome=s.matome!==false;          /* ボタン を まとめる（ひっさつ＝きる！・わざ＝1つ）が きほん */
  s.v=4;
  return s;
}
function save(){ S.mute=!S.bgm&&!S.se; Store.set(SAVE_KEY,JSON.stringify(S)); }
function load(){
  try{
    const r=Store.get(SAVE_KEY); if(!r)return false;
    const d=JSON.parse(r);
    if(d&&d.v===undefined&&!Store.get(BAK_KEY))Store.set(BAK_KEY,r);   /* ふるい きろく を ひかえ に */
    S=normalize(d); return true;
  }catch(e){ return false; }
}
const has=id=>S.skills.includes(id);
const speedMul=()=>1+Math.max(0,...["sp4","sp3","sp2","sp1"].map(i=>has(i)?SK[i].val:0));
/* いちばん つよい なかま だけ（いき1・いき2・いき3 → いき3 だけ） */
function activeSkills(){
  const best={};
  SKILLS.forEach(s=>{ if(s.cat==="active"&&has(s.id))best[s.fam]=s; });
  return SKILLS.filter(s=>best[s.fam]===s);
}

/* かてそう？（ざっくり の めやす） */
/* わざ を もって いる と どれだけ かちやすく なるか（2026-10-25 に たいせん シミュレーション で はかった。なかま は いちばん つよい もの だけ） */
const SKILL_POW={h1:1.45,h2:1.55,h3:1.65,h4:1.8,b1:1.15,b2:1.17,b3:1.2,gd:1.45,ch:1.3,drop:1.1,d2:1.3,
  k1:1.06,k2:1.08,k3:1.1,r2:1.08,r3:1.1,sw:1.05,jp:1.05,sp1:1.05,sp2:1.06,sp3:1.08,sp4:1.1,cr:1.12,ug:1.15};
function skillPower(){
  const best={};
  SKILLS.forEach(s=>{ if(has(s.id)&&SKILL_POW[s.id])best[s.fam]=s.id; });
  return Object.values(best).reduce((m,id)=>m*SKILL_POW[id],1);
}
function powerRatio(e){
  const p=(S.maxHp*S.atk)/(0.69*e.hp*e.atk);
  return p*Math.pow(skillPower(),.75)*1.35;   /* わざ は じょうず に つかえない こ も いる ので ひかえめ に（^0.75）。1.35 = ひっさつ わざ の ぶん */
}
function chanceOf(e){
  let r=powerRatio(e)/(1+e.idx*.01);   /* あと の てき ほど こうげき の しゅるい が ふえる（シミュレーション で あわせた） */
  if(e.boss&&e.idx>=7)r/=1.1;          /* ぼす は すこし きびしめ に みせる */
  if(r>=2.0)return {k:"easy", t:"よゆう！", f:"😆"};
  if(r>=1.15)return {k:"ok",  t:"かてそう", f:"🙂"};
  if(r>=.65)return {k:"hard", t:"ぎりぎり", f:"😬"};
  return            {k:"no",   t:"きけん！", f:"😱"};
}
