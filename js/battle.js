"use strict";
/* ==========================================================
   せんとう
   ========================================================== */
/* てき ごと の とびどうぐ の みため */
const SHOT_KIND={e05:"bone",e06:"rock",e07:"fire",e08:"star",e09:"web",e10:"ice",e11:"beam",e12:"bolt",e13:"ghost",e14:"fire",
  e15:"beam",e16:"poison",e17:"light",e18:"bolt",e19:"fire",e20:"dark"};
const SHOT_COL={bone:"#fff8ea",rock:"#b9a58a",fire:"#ff8a3c",star:"#ffd23f",web:"#b8f07a",ice:"#bff0ff",beam:"#ffe27a",bolt:"#fff27a",
  ghost:"#d9c8ff",poison:"#9be86a",light:"#fff6c8",dark:"#c27bff",orb:"#ff9fbc"};
const HIT_WORDS=["ばしっ！","ずばっ！","ざしゅっ！","すぱっ！","どかっ！"];

const Battle=(()=>{
  let B=null, stage=null;
  const fx=new FXList();
  const keys={l:false,r:false};
  const CUT=new Image(); let cutOK=false; CUT.onload=()=>{cutOK=true;}; CUT.src="img/ui/cutin.webp";

  /* ---------- はじめる ---------- */
  function start(idx){
    const e=ENEMIES[idx];
    loadEnemyImg(e);
    stage=new StageView(e.stage);
    fx.clear();
    const W=View.W, GY=View.GY;
    const rank=swordRank(S.atk);
    B={idx,e,t:0,phase:"intro",pt:0,ts:1,slowT:0,stop:0,shake:0,zoom:1,zx:W/2,zy:GY-120,flash:0,flashCol:"#fff",dark:0,red:0,
      introDur:e.boss?3.0:1.9,
      p:{x:Math.max(160,W*.2),hp:S.maxHp,max:S.maxHp,atk:S.atk,face:1,cd:0,swing:0,swingType:0,step:0,air:0,charge:0,pending:null,
         hurt:0,slow:0,inv:0,run:0,gauge:25,state:"idle",rank,tw:0,alpha:1,trail:[]},
      en:{x:W-Math.max(170,W*.2),hp:e.hp,max:e.hp,atk:e.atk,sp:e.sp,face:-1,cd:0,think:.9,act:null,windup:0,wmax:0,swing:0,hurt:0,
          flash:0,angry:false,dead:0,walk:false,tier:idx,ex:0},
      cds:{},shots:[],drops:[],waves:[],
      combo:0,comboT:-9,maxCombo:0,hits:0,taken:0,ults:0,heartT:0,warnedLow:false,angryShown:false,ult:null,over:false,
      hintT:0};
    B.ehw=Math.min(150,e.h*.42);   /* からだ の はば の はんぶん（めやす） */
    keys.l=keys.r=false;
    UI.battleSetup(B);
    show("battle");
    Music.play(e.boss?(idx===ENEMIES.length-1?"final":"boss"):"battle");
    if(e.boss)setTimeout(()=>{ if(B&&B.phase==="intro")sfx.alarm(); },80);
    else sfx.whoosh();
  }

  /* ---------- にゅうりょく ---------- */
  function setKey(k,v){ keys[k]=v; }
  function canAct(){ return B&&B.phase==="fight"&&!B.paused; }
  function attack(){
    if(!canAct())return;
    const p=B.p; if(p.cd>0||p.charge>0)return;
    p.cd=.55; p.swing=1; p.swingType=p.step%3; p.step++;
    sfx.swing(p.swingType===1);
    const reach=p.x+p.face*46;
    const hit=hitEnemy(reach,72,p.atk,0,{crit:true,gauge:8});
    const sd=SWORDS[p.rank];
    fx.add({k:"slash",x:p.x+p.face*56,y:View.GY-70-(p.swingType===1?10:0),face:p.face,sc:1.05,life:.28,
      a0:[-1.25,1.05,-.35][p.swingType],a1:[.9,-1.0,.35][p.swingType],col:sd.edge,glow:sd.glow||"#ffe27a",rot:p.swingType===2?.1:0});
    if(!hit&&Math.random()<.5)Burst.dust(fx,p.x+p.face*20,View.GY,-p.face,2);
    UI.hintDone("atk");
  }
  function useSkill(s){
    if(!canAct())return;
    const p=B.p, GY=View.GY;
    if((B.cds[s.id]||0)>0||p.charge>0)return;
    B.cds[s.id]=s.cd;
    const sd=SWORDS[p.rank];
    if(s.kind==="melee"){
      p.swing=1; p.swingType=s.back?1:0; p.cd=.25;
      const cxp=p.x+p.face*(s.range/2+12);
      const hit=hitEnemy(cxp,s.range,p.atk*s.dmg,s.knock||0,{crit:true,gauge:8});
      if(s.wind){
        sfx.wind();
        const n=s.id==="r3"?3:2;
        for(let i=0;i<n;i++)fx.add({k:"slash",x:p.x+p.face*(50+i*s.range/(n+.5)),y:GY-66-i*6,face:p.face,sc:1.1+i*.25,life:.34+i*.05,a0:-1.3,a1:1.0,col:"#5fe0c0",glow:"#9ff5e0"});
        for(let i=0;i<14;i++)fx.add({k:"spark",x:p.x+p.face*rnd(30,s.range),y:GY-rnd(20,110),vx:p.face*rnd(300,700),vy:rnd(-60,60),col:"#b8fff0",life:.25,w:3});
        if(hit)onoma(fx,B.en.x,GY-B.e.h*.7,"ひゅおっ！",{size:40,grad:["#e0fff6","#3fd6b0"]});
      }else if(s.knock){
        sfx.swing(); fx.add({k:"slash",x:cxp,y:GY-70,face:p.face,sc:1.6,life:.32,col:sd.edge,glow:"#ffb35c"});
        if(hit){ sfx.boom(); B.shake=Math.max(B.shake,14);
          fx.add({k:"ring",x:B.en.x,y:GY-50,r0:20,r1:150,life:.4,col:"#ffd23f",w:14,add:true});
          onoma(fx,B.en.x,GY-B.e.h*.75,"どかーん！",{size:54,grad:["#fff3a0","#ff7a2e"]}); }
      }else if(s.back){
        sfx.swing(true);
        fx.add({k:"slash",x:cxp,y:GY-78,face:p.face,sc:1.3,life:.3,a0:1.1,a1:-1.2,col:"#7ec8f2",glow:"#bfe6ff"});
        for(let i=0;i<4;i++)p.trail.push({x:p.x-p.face*i*30,l:.25});
        p.x=clamp(p.x-p.face*s.back,B.L,B.R);
        if(hit)onoma(fx,B.en.x,GY-B.e.h*.7,"しゅぱっ！",{size:44,grad:["#e8f7ff","#4aa8e8"]});
      }else{ sfx.swing(); }
    }else if(s.kind==="arrow"){
      p.swing=.6; p.swingType=2; sfx.arrow();
      B.shots.push({x:p.x+p.face*34,y:GY-72,vx:p.face*s.spd,dmg:p.atk*s.dmg,own:"p",type:s.id==="b3"?"garrow":"arrow"});
    }else if(s.kind==="heal"){
      const v=Math.round(p.max*s.ratio); p.hp=Math.min(p.max,p.hp+v);
      sfx.heal(); Burst.heal(fx,p.x,GY);
      dmgNum(fx,p.x,GY-150,"+"+v,{c1:"#e8fff4",c2:"#2fd18f",size:40});
      onoma(fx,p.x,GY-190,"げんき！",{size:34,grad:["#e8fff4","#2fd18f"],rot:0});
    }else if(s.kind==="drop"){
      B.drops.push({x:B.en.x,t:.55,max:.55,dmg:p.atk*s.dmg,own:"p",kind:"sword"}); sfx.charge();
    }else if(s.kind==="jump"){
      if(p.air>0)return;
      p.air=.66; sfx.jump(); Burst.dust(fx,p.x,GY,p.face,8);
    }else if(s.kind==="guard"){
      p.inv=s.dur; sfx.guard(); toast("むてき！ 2びょう");
      for(let i=0;i<18;i++)fx.add({k:"glow",x:p.x+rnd(-50,50),y:GY-rnd(0,120),vy:-rnd(40,90),r:rnd(10,18),col:"#ffe9a0",life:rnd(.4,.8)});
    }else if(s.kind==="charge"){
      p.charge=.85; p.pending=s; sfx.charge();
    }
  }
  function releaseCharge(){
    const p=B.p,s=p.pending,GY=View.GY; p.pending=null; p.swing=1; p.swingType=0;
    const cxp=p.x+p.face*(s.range/2+12);
    const hit=hitEnemy(cxp,s.range,p.atk*s.dmg,s.knock,{crit:true,gauge:10,big:true});
    const sd=SWORDS[p.rank];
    fx.add({k:"slash",x:cxp,y:GY-76,face:p.face,sc:2.4,life:.4,col:sd.edge,glow:sd.glow||"#ffb35c"});
    fx.add({k:"ring",x:cxp,y:GY-60,r0:30,r1:200,life:.45,col:"#ffd23f",w:16,add:true});
    B.shake=Math.max(B.shake,16); sfx.boom();
    onoma(fx,cxp,GY-190,"ずどーん！",{size:62,grad:["#fff3a0","#ff5a2e"]});
  }

  /* ---------- ひっさつ いっせん ---------- */
  function ultReady(){ return B&&B.p.gauge>=100; }
  function useUlt(){
    if(!canAct())return;
    const p=B.p; if(p.gauge<100||p.charge>0)return;
    p.gauge=0; B.phase="ult"; B.ults++; S.ults=(S.ults||0)+1;
    UI.cine(true); $("#introName").classList.remove("on");
    const en=B.en, dir=Math.sign(en.x-p.x)||p.face;
    let tx=en.x+dir*(B.ehw*.6+110);
    const inside=tx>B.L+10&&tx<B.R-10;
    if(!inside){ const near=B.ehw*.6+90; tx=Math.abs(p.x-en.x)>near?en.x-dir*near:p.x; }   /* かべ ぎわ は てまえ で とまる */
    B.ult={t:0,x0:p.x,tx:clamp(tx,B.L,B.R),dir,through:inside,hits:0,step:0,name:SWORDS[p.rank].ult};
    p.face=dir; p.swing=0; p.charge=0;
    sfx.ultStart(); Music.duck(true);
    UI.hintDone("ult");
  }
  function stepUlt(dt){
    const u=B.ult,p=B.p,en=B.en,GY=View.GY,e=B.e;
    const prev=u.t; u.t+=dt;
    const at=x=>prev<x&&u.t>=x;
    const sd=SWORDS[p.rank];
    if(u.t<.35){ B.dark=Math.min(.6,u.t*2); B.zoom=lerp(B.zoom,1.22,.12); B.zx=lerp(B.zx,p.x,.2); B.zy=lerp(B.zy,GY-80,.2); p.state="charge";
      if(Math.random()<.9){ const a=rnd(0,TAU); fx.add({k:"glow",x:p.x+Math.cos(a)*120,y:GY-60+Math.sin(a)*90,vx:-Math.cos(a)*300,vy:-Math.sin(a)*230,r:rnd(10,18),col:sd.glow||"#fff3a0",life:.35}); } }
    if(at(.35)){ sfx.cutin(); Voice.say(u.name+"！",{pitch:1.3,rate:1.1}); }
    if(at(1.28)){ B.flash=1; B.flashCol="#ffffff"; B.dark=.35; }
    if(at(1.32)){ sfx.dash(); p.state="dash"; for(let i=0;i<7;i++)p.trail.push({x:lerp(u.x0,u.tx,i/7),l:.45+i*.03,st:"dash"});
      fx.add({k:"line",x:u.x0-u.dir*40,y:GY-62,x2:u.tx+u.dir*40,y2:GY-70,w:18,life:.9,glow:sd.glow||"#ffe27a",layer:"front"}); }
    if(u.t>=1.32&&u.t<1.46){ p.x=lerp(u.x0,u.tx,Ease.outCubic((u.t-1.32)/.14)); }
    if(at(1.46)){ p.x=u.tx; p.state="finish"; p.face=u.through?u.dir:u.dir; B.zoom=1.12; B.zx=(p.x+en.x)/2; B.zy=GY-100; en.flash=1; }
    if(at(1.95)){ sfx.sheath(); }
    if(u.t>=2.05&&u.step<5&&u.t>=2.05+u.step*.075){
      u.step++;
      const d=p.atk*.72*(1+p.rank*.06);
      const X=en.x+rnd(-B.ehw*.4,B.ehw*.4), Y=GY-e.h*rnd(.3,.7);
      fx.add({k:"slash",x:X,y:Y,face:pick([-1,1]),sc:rnd(1.4,2.2),rot:rnd(-1,1),life:.35,col:sd.edge,glow:sd.glow||"#ffe27a"});
      dealEnemy(d,{noGauge:true,big:true,silent:u.step>1,ult:true});
      if(u.step===1){ sfx.boom(); B.shake=26; B.flash=.8; B.flashCol=sd.glow||"#fff3a0";
        onoma(fx,View.W/2,GY-230,"ずばばばーん！",{size:70,grad:["#ffffff",sd.glow||"#ffd23f"],rot:-.08,layer:"ui",life:1.1});
        Burst.stars(fx,en.x,GY-e.h*.5,26,true);
        fx.add({k:"ring",x:en.x,y:GY-e.h*.5,r0:20,r1:260,life:.6,col:sd.glow||"#fff",w:22,add:true}); }
      else sfx.hit(true);
      if(u.step===5&&en.hp>0)en.x=clamp(en.x+u.dir*40,B.L,B.R);
    }
    if(u.t>=2.6||(u.step>=5&&en.hp<=0&&u.t>=2.45)){
      Music.duck(false); B.dark=0; B.ult=null;
      if(en.hp<=0){ ko(); return; }
      UI.cine(false);
      B.phase="fight"; p.state="idle"; p.face=Math.sign(en.x-p.x)||1;
    }
  }

  /* ---------- あたり ---------- */
  function hitEnemy(cxp,len,dmg,knock,o){
    const en=B.en, tol=20+B.ehw*.5;
    if(Math.abs(en.x-cxp)>len/2+tol)return false;
    dealEnemy(dmg,o||{});
    if(knock&&en.hp>0)en.x=clamp(en.x+Math.sign(en.x-cxp||B.p.face)*knock,B.L,B.R);
    else if(en.hp>0)en.x=clamp(en.x+Math.sign(en.x-B.p.x||1)*7,B.L,B.R);
    return true;
  }
  function dealEnemy(dmg,o){
    const en=B.en,p=B.p,GY=View.GY,e=B.e;
    if(en.hp<=0)return;
    let d=Math.max(1,Math.round(dmg)), crit=false;
    if(o.crit&&Math.random()<.1){ d*=2; crit=true; }
    en.hp=Math.max(0,en.hp-d); en.hurt=.25; en.flash=1;
    B.hits++;
    if(B.t-B.comboT<1.6)B.combo++; else B.combo=1;
    B.comboT=B.t; B.maxCombo=Math.max(B.maxCombo,B.combo);
    if(!o.noGauge){ const g0=p.gauge; p.gauge=Math.min(100,p.gauge+(o.gauge||6)+Math.min(4,Math.floor(B.combo/5)));
      if(g0<100&&p.gauge>=100){ sfx.ready(); UI.ultReady(); } }
    const hx=en.x-(Math.sign(en.x-p.x)||1)*B.ehw*.3, hy=GY-e.h*.5;
    const sd=SWORDS[p.rank];
    if(!o.ult)B.stop=Math.max(B.stop,crit?.13:o.big?.1:.055);
    B.shake=Math.max(B.shake,Math.min(20,(crit?10:5)+d/en.max*40));
    Burst.hit(fx,hx,hy,sd.glow||"#ffe27a",crit||o.big);
    if(crit){ dmgNum(fx,hx,hy-50,d,{size:58,c1:"#fff3a0",c2:"#ff5a2e",sub:"かいしん！"}); sfx.crit(); buzz(25); B.zoom=Math.max(B.zoom,1.05); B.zx=hx; B.zy=hy; }
    else { dmgNum(fx,hx,hy-40,d,{size:o.big?52:40}); if(!o.silent)sfx.hit(o.big); buzz(12); }
    if(!crit&&!o.ult&&Math.random()<.45)onoma(fx,hx+rnd(-30,30),hy-90,pick(HIT_WORDS),{size:34});
    if(B.combo>=2)UI.combo(B.combo);
    if(B.combo>0&&B.combo%10===0){ onoma(fx,View.W/2,View.GY-250,B.combo>=30?"てんさい！":B.combo>=20?"すばらしい！":"すごい！",{size:50,layer:"ui",rot:0,grad:["#fff","#ff8fb1"]}); sfx.ready(); }
    if(!en.angry&&en.hp>0&&en.hp<en.max*.3){ en.angry=true; toast(e.n+" が おこった！"); say(pick(["もう おこった ぞ！","ゆるさない ぞ〜！","ぐぬぬ… まだまだ！","ほんき を だす ぞ！"])); }
    if(en.hp<=0&&B.phase!=="ult")ko();
  }
  function hurtPlayer(d,src){
    const p=B.p,GY=View.GY;
    if(B.phase!=="fight")return;
    if(p.inv>0){
      sfx.guard(); onoma(fx,p.x,GY-150,"がきーん！",{size:34,grad:["#fff","#7ec8f2"]});
      for(let i=0;i<8;i++)fx.add({k:"spark",x:p.x+rnd(-20,20),y:GY-70,vx:rnd(-300,300),vy:rnd(-300,50),col:"#bfe6ff",life:.25});
      return;
    }
    d=Math.max(1,Math.round(d));
    p.hp=Math.max(0,p.hp-d); p.hurt=.4; B.taken+=d;
    p.gauge=Math.min(100,p.gauge+5);
    B.shake=Math.max(B.shake,10); B.red=.55; B.stop=Math.max(B.stop,.05);
    sfx.hurt(); buzz(35);
    dmgNum(fx,p.x,GY-140,d,{c1:"#ffe0e0",c2:"#ff3b5c",size:40});
    for(let i=0;i<8;i++)fx.add({k:"star",x:p.x,y:GY-80,vx:rnd(-200,200),vy:rnd(-300,-100),g:600,r:rnd(5,9),col:"#ff9fbc",life:.5,vr:rnd(-8,8)});
    if(p.hp<=0){ lose(); return; }
    if(!B.warnedLow&&p.hp<p.max*.3){ B.warnedLow=true;
      toast(activeSkills().some(s=>s.kind==="heal")?"あぶない！ 「いき」で かいふく しよう":"あぶない！ はなれて たいせい を たてなおそう"); }
  }

  /* ---------- てき の あたま ---------- */
  function enemyThink(dt){
    const en=B.en,p=B.p,d=p.x-en.x,ad=Math.abs(d),tier=en.tier;
    en.walk=false;
    if(en.act){
      en.windup-=dt;
      if(en.windup<=0){ const a=en.act; en.act=null; doAct(a); }
      return;
    }
    en.face=d<0?-1:1; en.think-=dt;
    if(en.cd>0)return;
    const near=58+B.ehw*.55, reach=86+B.ehw*.55;
    if(en.think>0){ if(ad>near){ en.x+=Math.sign(d)*en.sp*dt; en.walk=true; } return; }
    en.think=.3+Math.random()*.3;
    const r=Math.random();
    if(tier>=10&&r<.14){ tele("drop",.3); return; }
    if(tier>=12&&r<.24){ tele("curse",.3); return; }
    if(tier>=8&&r<.36){ tele("wave",.32); return; }
    if(tier>=4&&r<.5){ tele("shot",.28); return; }
    if(tier>=6&&r<.62&&ad>170){ doAct("dash"); return; }
    if(tier>=9&&r<.68&&en.hp<en.max*.35){ tele("heal",.3); return; }
    if(ad<=reach){ tele("melee",Math.max(.24,.46-tier*.012)); return; }
    en.x+=Math.sign(d)*en.sp*dt; en.walk=true;
  }
  function tele(kind,t){ const en=B.en; en.act=kind; en.windup=t; en.wmax=t; if(kind==="melee"||kind==="wave")sfx.warn(); }
  function doAct(kind){
    const en=B.en,p=B.p,GY=View.GY,e=B.e,tier=en.tier,d=p.x-en.x,ad=Math.abs(d);
    const sk=SHOT_KIND[e.id]||"orb";
    if(kind==="melee"){
      en.swing=1; en.cd=tier>=14?.55:.8;
      const cxp=en.x+en.face*(40+B.ehw*.3), len=76+B.ehw*.4;
      fx.add({k:"slash",x:en.x+en.face*(50+B.ehw*.35),y:GY-e.h*.45,face:en.face,sc:1+B.ehw/150,life:.25,col:"#ff6b6b",glow:"#ff9f9f"});
      sfx.swing();
      if(Math.abs(p.x-cxp)<=len/2+26){ hurtPlayer(en.atk); if(tier>=11&&p.inv<=0)p.x=clamp(p.x+Math.sign(p.x-cxp||1)*70,B.L,B.R); }
    }else if(kind==="shot"){
      const n=tier>=16?3:1; sfx.shoot();
      for(let i=0;i<n;i++)B.shots.push({x:en.x+en.face*(20+B.ehw*.4),y:GY-60-i*26-Math.min(40,e.h*.15),vx:en.face*(320+i*40),dmg:en.atk*.7,own:"e",type:sk,rot:0});
      en.cd=.8; en.swing=.6;
    }else if(kind==="wave"){
      B.waves.push({x:en.x+en.face*(20+B.ehw*.4),vx:en.face*400,dmg:en.atk*1.1,own:"e",t:0});
      en.cd=.9; en.swing=1; B.shake=Math.max(B.shake,8); sfx.quake();
    }else if(kind==="drop"){
      B.drops.push({x:p.x,t:.72,max:.72,dmg:en.atk*1.6,own:"e",kind:sk});
      en.cd=1; toast(e.n+" が そら を にらんだ！ よけて！");
    }else if(kind==="curse"){
      p.slow=2.2; en.cd=1.2; sfx.curse(); toast("あし が おもい…！");
      for(let i=0;i<14;i++)fx.add({k:"glow",x:p.x+rnd(-35,35),y:GY-rnd(0,70),vy:-rnd(30,60),r:rnd(10,16),col:"#a78bd8",life:rnd(.6,1)});
    }else if(kind==="dash"){
      const mv=Math.sign(d)*Math.min(ad-70,240);
      Burst.dust(fx,en.x,GY,Math.sign(d),10);
      en.x=clamp(en.x+mv,B.L,B.R); en.cd=.5; sfx.dash();
    }else if(kind==="heal"){
      const v=Math.round(en.max*.12); en.hp=Math.min(en.max,en.hp+v); en.cd=1.6; sfx.eheal();
      dmgNum(fx,en.x,GY-e.h-20,"+"+v,{c1:"#e8fff4",c2:"#2fd18f"}); toast(e.n+" は きず を なおした！");
      Burst.heal(fx,en.x,GY);
    }
  }

  /* ---------- やっつけた / まけた ---------- */
  function ko(){
    if(B.over)return;
    B.over=true; B.phase="ko"; B.pt=0; B.stop=.22; B.slowT=.9; B.flash=1; B.flashCol="#fff"; UI.cine(true); UI.combo(0);
    B.zoom=1.15; B.zx=B.en.x; B.zy=View.GY-B.e.h*.5;
    keys.l=keys.r=false;
    sfx.crit(); buzz([30,40,60]);
    Music.stop(.2);
    say(pick(["やられた〜！","お、おぼえてろ〜！","つ、つよすぎる…！","きゅう〜…","まいった〜！"]),1.6);
  }
  function say(txt,dur){ if(B)B.bubble={txt,t:0,dur:dur||1.5}; }
  function lose(){
    if(B.over)return;
    B.over=true; B.phase="lose"; B.pt=0; B.stop=.25; B.p.state="lose"; UI.cine(true); UI.combo(0);
    keys.l=keys.r=false;
    Music.stop(.3);
  }
  function stepKO(dt){
    const en=B.en,p=B.p,GY=View.GY,e=B.e;
    const prev=B.pt; B.pt+=dt; const at=x=>prev<x&&B.pt>=x;
    en.dead=clamp((B.pt-.25)/1.0,0,1);
    if(at(.3)){ sfx.die(); Burst.stars(fx,en.x,GY-e.h*.5,30,true); fx.add({k:"ring",x:en.x,y:GY-e.h*.5,r0:10,r1:220,life:.5,col:"#fff",w:18,add:true}); }
    if(at(.55)){ sfx.boom(); B.shake=18;
      onoma(fx,View.W/2,GY-240,"やっつけた！",{size:76,grad:["#ffffff","#ffd23f"],rot:-.06,layer:"ui",life:1.8,rise:0});
      const n=Math.min(26,6+B.idx);
      for(let i=0;i<n;i++){
        const c0=fx.add({k:"coin",x:en.x+rnd(-20,20),y:GY-e.h*.5,vx:rnd(-260,260),vy:rnd(-620,-300),g:1500,r:rnd(9,12),seed:rnd(0,9),life:9,floor:GY-8,bounce:.45});
        c0.upd=(q,dt2)=>{
          if(q.t<.9+i*.03){ q.vy+=q.g*dt2; q.x+=q.vx*dt2; q.y+=q.vy*dt2; if(q.y>q.floor){ q.y=q.floor; q.vy*=-.45; q.vx*=.7; } return; }
          const tx=B.p.x, ty=GY-60, dx=tx-q.x, dy=ty-q.y, dd=Math.hypot(dx,dy);
          const sp=900+q.t*600; q.x+=dx/dd*Math.min(dd,sp*dt2); q.y+=dy/dd*Math.min(dd,sp*dt2);
          if(dd<18){ q.t=q.life; sfx.coin(Math.min(12,i)); fx.add({k:"star",x:q.x,y:q.y,r:8,col:"#ffd23f",life:.3,pop:true}); }
        };
      }
    }
    if(at(.7)){ Music.jingle("win"); p.state="win"; p.tw=0; p.face=Math.sign(en.x-p.x)||1; }
    if(p.state==="win")p.tw+=dt;
    B.zoom=lerp(B.zoom,1,.03); B.zx=lerp(B.zx,View.W/2,.03);
    if(at(1.2))Burst.confetti(fx,View.W,70);
    if(at(2.7))finishWin();
  }
  function stepLose(dt){
    const prev=B.pt; B.pt+=dt; const at=x=>prev<x&&B.pt>=x;
    B.dark=Math.min(.45,B.pt*.5);
    if(at(.4)){ Music.jingle("lose"); onoma(fx,View.W/2,View.GY-230,"まけた…",{size:64,grad:["#e6dcff","#8a7ad0"],rot:0,layer:"ui",life:2.2,rise:0}); }
    if(at(2.0))finishLose();
  }
  function starsOf(){ const r=B.p.hp/B.p.max; return r>=.75?3:r>=.4?2:1; }
  function finishWin(){
    const e=B.e, idx=B.idx, first=idx>=S.cleared, gain=Math.round(e.g*(first?1:.4)), st=starsOf();
    const z=S.zukan[idx]||{w:0,s:0}; const newBest=st>z.s;
    S.zukan[idx]={w:z.w+1,s:Math.max(z.s,st)};
    S.gold+=gain; if(first)S.cleared=idx+1; S.wins=(S.wins||0)+1;
    save();
    const r={win:true,e,idx,gain,first,stars:st,newBest,combo:B.maxCombo,hits:B.hits,ults:B.ults,hp:B.p.hp,max:B.p.max};
    if(first&&idx===ENEMIES.length-1)UI.ending(()=>UI.result(r));
    else UI.result(r);
  }
  function finishLose(){
    save();
    UI.result({win:false,e:B.e,idx:B.idx,enemyLeft:B.en.hp/B.en.max});
  }

  /* ---------- まいフレーム ---------- */
  function update(rdt){
    if(!B)return;
    const W=View.W,H=View.H,GY=View.GY;
    B.L=55; B.R=W-55;
    stage.update(rdt,W,H,GY);
    if(B.paused){ return; }
    if(B.stop>0){ B.stop-=rdt; B.shake*=.9; fx.update(rdt*.15); return; }
    if(B.slowT>0){ B.slowT-=rdt; B.ts=.32; } else B.ts=1;
    const dt=rdt*B.ts;
    B.t+=dt;
    const p=B.p,en=B.en;
    B.shake*=Math.pow(.86,rdt*60); if(B.shake<.3)B.shake=0;
    B.flash=Math.max(0,B.flash-rdt*4); B.red=Math.max(0,B.red-rdt*1.6);
    en.flash=Math.max(0,en.flash-rdt*6);
    if(B.phase!=="ult"&&B.phase!=="ko"){ B.zoom=lerp(B.zoom,1,.12); if(Math.abs(B.zoom-1)<.002)B.zoom=1; }
    p.trail=p.trail.filter(q=>(q.l-=rdt)>0);
    if(B.bubble){ B.bubble.t+=rdt; if(B.bubble.t>=B.bubble.dur)B.bubble=null; }
    fx.update(dt);

    if(B.phase==="intro"){ stepIntro(dt); }
    else if(B.phase==="fight"){ stepFight(dt); }
    else if(B.phase==="ult"){ stepUlt(dt); }
    else if(B.phase==="ko"){ stepKO(dt); }
    else if(B.phase==="lose"){ stepLose(dt); }
    UI.battleHud(B);
  }
  function stepIntro(dt){
    const prev=B.pt; B.pt+=dt; const at=x=>prev<x&&B.pt>=x;
    const e=B.e, T=B.introDur, bossOff=e.boss?1.1:0;
    if(e.boss&&B.pt<1.0)B.dark=.35;
    else B.dark=Math.max(0,B.dark-dt*2);
    if(at(bossOff+.45)){ if(e.boss){ sfx.quake(); B.shake=16; } else sfx.land(); Burst.dust(fx,B.en.x,View.GY,-1,12); }
    if(at(bossOff+.55))UI.introName(e);
    if(at(T-.5)){ sfx.go(); onoma(fx,View.W/2,View.GY-220,"すたーと！",{size:80,grad:["#fff9c2","#ffb700"],rot:0,layer:"ui",life:.9,rise:0}); }
    if(B.pt>=T){ B.phase="fight"; B.pt=0; UI.cine(false); UI.introDone(); UI.tutorial(); }
  }
  function skipIntro(){ if(B&&B.phase==="intro"&&B.pt<B.introDur-.55){ const e=B.e; B.pt=B.introDur-.56; B.dark=0; UI.introName(e); } }
  function stepFight(dt){
    const p=B.p,en=B.en,GY=View.GY;
    for(const k in B.cds)B.cds[k]=Math.max(0,B.cds[k]-dt);
    p.cd=Math.max(0,p.cd-dt); p.hurt=Math.max(0,p.hurt-dt);
    const wasAir=p.air>0;
    p.air=Math.max(0,p.air-dt); p.slow=Math.max(0,p.slow-dt); p.inv=Math.max(0,p.inv-dt);
    if(wasAir&&p.air<=0){ sfx.land(); Burst.dust(fx,p.x,GY,p.face,6); }
    p.swing=Math.max(0,p.swing-dt*4.2);
    en.cd=Math.max(0,en.cd-dt); en.hurt=Math.max(0,en.hurt-dt); en.swing=Math.max(0,en.swing-dt*4);
    if(p.charge>0){ p.charge-=dt; if(Math.random()<.6)fx.add({k:"glow",x:p.x+rnd(-40,40),y:GY-rnd(10,110),vy:-rnd(60,140),r:rnd(8,14),col:SWORDS[p.rank].glow||"#ffd23f",life:.4});
      if(p.charge<=0)releaseCharge(); }
    const spd=230*speedMul()*(p.slow>0?.45:1);
    p.run=0;
    if(p.charge<=0){
      if(keys.l&&!keys.r){ p.x-=spd*dt; p.face=-1; p.run=1; }
      if(keys.r&&!keys.l){ p.x+=spd*dt; p.face=1; p.run=1; }
    }
    if(p.run&&p.air<=0&&Math.random()<dt*14)Burst.dust(fx,p.x-p.face*14,GY,p.face,1);
    if(p.run)UI.hintDone("move");
    p.x=clamp(p.x,B.L,B.R);
    enemyThink(dt);
    en.x=clamp(en.x,B.L,B.R);
    /* とびどうぐ */
    B.shots=B.shots.filter(s=>{
      s.x+=s.vx*dt; s.rot=(s.rot||0)+dt*12;
      if(s.own==="p"){
        if(Math.random()<.7)fx.add({k:"glow",layer:"back",x:s.x,y:s.y,r:s.type==="garrow"?14:8,col:s.type==="garrow"?"#ffe27a":"#ffffff",life:.18});
        if(Math.abs(s.x-en.x)<20+B.ehw*.5){ dealEnemy(s.dmg,{gauge:4}); return false; }
      }else{
        if(Math.random()<.5)fx.add({k:"glow",layer:"back",x:s.x,y:s.y,r:14,col:SHOT_COL[s.type]||"#ff9fbc",life:.22});
        const dodge=p.air>0;
        if(!dodge&&Math.abs(s.x-p.x)<30){ hurtPlayer(s.dmg); Burst.hit(fx,s.x,s.y,SHOT_COL[s.type],false); return false; }
      }
      return s.x>-40&&s.x<View.W+40;
    });
    B.waves=B.waves.filter(w=>{
      w.x+=w.vx*dt; w.t+=dt;
      if(Math.random()<.5)fx.add({k:"puff",layer:"back",x:w.x,y:GY-4,vy:-rnd(20,60),r:rnd(8,14),col:"rgba(255,220,200,.8)",life:.4});
      if(p.air<=0&&Math.abs(w.x-p.x)<34){ hurtPlayer(w.dmg); return false; }
      return w.x>20&&w.x<View.W-20;
    });
    B.drops=B.drops.filter(d=>{
      d.t-=dt;
      if(d.t<=0){
        const tgt=d.own==="p"?en:p;
        if(Math.abs(d.x-tgt.x)<52+(d.own==="p"?B.ehw*.3:0)){ if(d.own==="p")dealEnemy(d.dmg,{gauge:8,big:true}); else hurtPlayer(d.dmg); }
        B.shake=Math.max(B.shake,13); sfx.boom();
        const col=d.own==="p"?(SWORDS[p.rank].glow||"#ffd23f"):(SHOT_COL[d.kind]||"#ff9fbc");
        fx.add({k:"ring",x:d.x,y:GY-2,r0:10,r1:140,flat:.3,life:.45,col,w:14,add:true});
        for(let i=0;i<16;i++)fx.add({k:"spark",x:d.x,y:GY-10,vx:rnd(-420,420),vy:-rnd(80,420),g:900,col,life:.45,w:5});
        if(d.own==="p")onoma(fx,d.x,GY-150,"どーん！",{size:50});
        return false;
      }
      return true;
    });
    /* れんげき の じかん ぎれ */
    if(B.combo>0&&B.t-B.comboT>1.6){ B.combo=0; UI.combo(0); }
    /* ぴんち の しんぞう の おと */
    if(p.hp<p.max*.25){ B.heartT-=dt; if(B.heartT<=0){ B.heartT=.9; sfx.heart(); } }
    /* ようす */
    p.state=p.charge>0?"charge":p.hurt>.2?"hurt":p.air>0?"jump":p.swing>0?"atk":p.run?"run":"idle";
  }

  /* ---------- えがく ---------- */
  function draw(c){
    if(!B)return;
    const W=View.W,H=View.H,GY=View.GY,p=B.p,en=B.en,e=B.e,t=B.t;
    c.save();
    if(B.shake>0)c.translate(rnd(-1,1)*B.shake,rnd(-1,1)*B.shake*.7);
    if(B.zoom!==1){ c.translate(B.zx,B.zy); c.scale(B.zoom,B.zoom); c.translate(-B.zx,-B.zy); }
    stage.drawBack(c,W,H,GY);
    if(B.dark>0){ c.fillStyle="rgba(12,6,34,"+B.dark+")"; c.fillRect(-100,-100,W+200,H+200); }
    if(B.phase==="ult"&&B.ult&&B.ult.t<1.3)drawSpeedLines(c,W,H,t,.5);
    fx.draw(c,"back");
    /* そら から の こうげき の しるし */
    for(const d of B.drops){
      const k=d.t/d.max, mine=d.own==="p", col=mine?(SWORDS[p.rank].glow||"#ffd23f"):"#ff4d6d";
      c.save(); c.strokeStyle=col; c.lineWidth=6; c.setLineDash([14,10]); c.lineDashOffset=-t*60;
      ell(c,d.x,GY-4,62*(1.25-k*.5),16*(1.25-k*.5)); c.stroke(); c.setLineDash([]);
      c.globalAlpha=.25+.2*Math.sin(t*20); c.fillStyle=col; c.fill(); c.restore();
      const y=GY-420*k;
      if(mine){ c.save(); c.translate(d.x,y); c.rotate(Math.PI/2); c.scale(1.8,1.8); drawSword(c,p.rank,66,t); c.restore(); glow(c,d.x,y-40,60,col,.6); }
      else drawShot(c,{x:d.x,y:y-20,type:d.kind,rot:t*8,vx:0},1.8);
    }
    /* ちび の がめん の ひだり と みぎ に まだ いる かげ */
    for(const q of p.trail){ drawHeroAny(c,q.x,GY,{t,state:q.st||"run",face:p.face,sc:1.4,rank:p.rank,alpha:q.l*.9}); }
    /* てき */
    let ex=en.x;
    if(B.phase==="intro"){
      const bossOff=e.boss?1.1:0, k=clamp((B.pt-bossOff)/.45,0,1);
      ex=lerp(W+e.h,en.x,Ease.outCubic(k));
      if(k<=0)ex=W+e.h*2;
    }
    const ey=GY-(B.phase==="intro"&&!e.fly?Math.max(0,Math.sin(clamp((B.pt-(e.boss?1.1:0))/.45,0,1)*Math.PI)*60):0);
    if(ex<W+e.h*1.5)drawEnemy(c,ex,ey,e,{t,face:en.face,hurt:en.hurt,windup:en.act?1-en.windup/en.wmax:0,swing:en.swing,walk:en.walk,angry:en.angry,dead:en.dead,flash:en.flash});
    if(en.act&&B.phase==="fight"){ drawBang(c,en.x,GY-e.h-(e.fly||0)-18,1.1,t); }
    if(B.bubble){ drawBubble(c,clamp(en.x,150,W-150),GY-e.h-(e.fly||0)-30,B.bubble); }
    if(en.angry&&!en.dead&&Math.random()<.08)fx.add({k:"puff",x:en.x+rnd(-20,20),y:GY-e.h-10,vy:-60,r:10,col:"rgba(255,255,255,.8)",life:.5});
    /* しゅじんこう */
    const jumpH=p.air>0?Math.sin((1-p.air/.66)*Math.PI)*120:0;
    if(p.inv>0){ drawBarrier(c,p.x,GY-55-jumpH,t,p.inv); }
    drawHeroAny(c,p.x,GY,{t,state:p.state,face:p.face,sc:1.4,swing:p.swing,swingType:p.swingType,jump:jumpH,hurt:p.hurt,rank:p.rank,tw:p.tw,
      blink:(t%3.4)>3.28,aura:p.state==="charge"||(B.phase==="ult"&&B.ult&&B.ult.t<1.3)});
    if(p.slow>0){ c.save(); c.globalAlpha=.6; c.strokeStyle="#a78bd8"; c.lineWidth=6; c.setLineDash([10,8]); c.lineDashOffset=t*40;
      ell(c,p.x,GY-4,46,14); c.stroke(); c.restore(); }
    /* たま */
    for(const w of B.waves)drawWave(c,w,GY,t);
    for(const s of B.shots)drawShot(c,s,s.own==="e"?1.5:1.15);
    fx.draw(c,"front");
    stage.drawFront(c);
    c.restore();

    /* カメラ の そと */
    if(B.phase==="ult"&&B.ult)drawCutin(c,W,H,B.ult,t);
    if(B.phase==="intro"&&e.boss&&B.pt<1.05)drawWarning(c,W,H,B.pt);
    if(p.hp>0&&p.hp<p.max*.25&&B.phase==="fight"){ const a=.25+.15*Math.sin(t*7); vignette(c,W,H,"rgba(255,40,70,"+a+")"); }
    if(B.red>0)vignette(c,W,H,"rgba(255,40,70,"+(B.red*.8)+")");
    fx.draw(c,"ui");
    if(B.flash>0){ c.globalAlpha=Math.min(.6,B.flash*.7); c.fillStyle=B.flashCol; c.fillRect(0,0,W,H); c.globalAlpha=1; }
  }
  function drawBubble(c,x,y,b){
    const k=b.t/b.dur, a=k<.1?k/.1:k>.85?(1-k)/.15:1, pop=Ease.outBack(Math.min(1,b.t/.2));
    c.save(); c.globalAlpha=Math.max(0,a); c.translate(x,Math.max(70,y)); c.scale(pop,pop);
    c.font="900 20px "+FONT_R; const w=c.measureText(b.txt).width+30;
    rr(c,-w/2,-44,w,40,16); fs(c,"#fff",3.5);
    c.beginPath(); c.moveTo(-8,-5); c.lineTo(4,12); c.lineTo(8,-5); c.closePath(); fs(c,"#fff",3.5);
    c.fillStyle="#fff"; c.fillRect(-9,-8,18,6);
    c.fillStyle=OL; c.textAlign="center"; c.textBaseline="middle"; c.fillText(b.txt,0,-24);
    c.restore();
  }
  function vignette(c,W,H,col){
    const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.62);
    g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,col); c.fillStyle=g; c.fillRect(0,0,W,H);
  }
  function drawBarrier(c,x,y,t,left){
    c.save(); c.translate(x,y);
    const blink=left<.6&&Math.floor(t*14)%2===0; if(blink)c.globalAlpha=.4;
    glow(c,0,0,90,"#fff3a0",.35);
    c.globalAlpha*=.9; c.strokeStyle="#ffd23f"; c.lineWidth=4; c.beginPath();
    for(let i=0;i<6;i++){ const a=i*TAU/6+t*.8; c.lineTo(Math.cos(a)*70,Math.sin(a)*70); } c.closePath(); c.stroke();
    c.strokeStyle="rgba(255,255,255,.9)"; c.lineWidth=2; c.stroke();
    c.fillStyle="rgba(255,243,160,.12)"; c.fill();
    c.restore();
  }
  function drawWave(c,w,GY,t){
    c.save(); c.translate(w.x,GY); c.scale(Math.sign(w.vx),1);
    const h=1+Math.sin(w.t*30)*.08;
    c.beginPath(); c.moveTo(-30,0); c.lineTo(-10,-54*h); c.lineTo(2,-26); c.lineTo(16,-62*h); c.lineTo(30,0); c.closePath();
    const g=c.createLinearGradient(0,-60,0,0); g.addColorStop(0,"#ffe0a0"); g.addColorStop(1,"#ff5a3c"); fs(c,g,4);
    c.restore();
  }
  function drawShot(c,s,sc){
    const t=s.type, col=SHOT_COL[t]||"#ff9fbc";
    c.save(); c.translate(s.x,s.y); c.scale(sc,sc);
    if(t==="arrow"||t==="garrow"){
      c.scale(Math.sign(s.vx)||1,1);
      if(t==="garrow")glow(c,0,0,26,"#ffe27a",.8);
      c.lineWidth=4; c.strokeStyle=OL; c.beginPath(); c.moveTo(4,0); c.lineTo(-28,0); c.stroke();
      c.lineWidth=2.4; c.strokeStyle=t==="garrow"?"#ffe27a":"#c98a4a"; c.stroke();
      c.beginPath(); c.moveTo(24,0); c.lineTo(4,-8); c.lineTo(4,8); c.closePath(); fs(c,t==="garrow"?"#fff6c8":"#e8eef8",3);
      c.beginPath(); c.moveTo(-22,0); c.lineTo(-32,-8); c.lineTo(-28,0); c.lineTo(-32,8); c.closePath(); fs(c,"#ff6b6b",2.4);
      c.restore(); return;
    }
    glow(c,0,0,30,col,.75);
    c.rotate(s.rot||0);
    if(t==="bone"){ rr(c,-16,-4,32,8,4); fs(c,"#fff8ea",3); circle(c,-16,-4,5); fs(c,"#fff8ea",3); circle(c,-16,4,5); fs(c,"#fff8ea",3); circle(c,16,-4,5); fs(c,"#fff8ea",3); circle(c,16,4,5); fs(c,"#fff8ea",3); }
    else if(t==="rock"){ c.beginPath(); c.moveTo(-14,-6); c.lineTo(-4,-15); c.lineTo(12,-10); c.lineTo(15,6); c.lineTo(2,14); c.lineTo(-13,8); c.closePath(); fs(c,"#a3a7ae",3.4); }
    else if(t==="star"){ star(c,0,0,15,4,.35); fs(c,"#ffd23f",3); }
    else if(t==="ice"){ c.beginPath(); c.moveTo(-18,0); c.lineTo(0,-8); c.lineTo(20,0); c.lineTo(0,8); c.closePath(); fs(c,"#dff8ff",3); }
    else if(t==="bolt"){ c.beginPath(); c.moveTo(-6,-16); c.lineTo(8,-16); c.lineTo(0,-2); c.lineTo(10,-2); c.lineTo(-8,18); c.lineTo(-2,2); c.lineTo(-10,2); c.closePath(); fs(c,"#fff27a",3); }
    else if(t==="ghost"){ c.rotate(-(s.rot||0)); c.beginPath(); c.arc(0,-2,12,Math.PI,0); c.lineTo(12,12); c.lineTo(6,7); c.lineTo(0,12); c.lineTo(-6,7); c.lineTo(-12,12); c.closePath(); fs(c,"#f4efff",3);
      c.fillStyle=OL; circle(c,-4,-3,2.4); c.fill(); circle(c,4,-3,2.4); c.fill(); }
    else if(t==="web"){ circle(c,0,0,13); fs(c,"#dfffb8",3); c.strokeStyle=OL; c.lineWidth=1.6; c.beginPath(); for(let i=0;i<4;i++){ const a=i*Math.PI/4; c.moveTo(Math.cos(a)*13,Math.sin(a)*13); c.lineTo(-Math.cos(a)*13,-Math.sin(a)*13);} c.stroke(); }
    else if(t==="beam"){ c.rotate(-(s.rot||0)); c.scale(Math.sign(s.vx)||1,1); c.beginPath(); c.arc(-10,0,22,-1.1,1.1); c.arc(-18,0,18,1.0,-1.0,true); c.closePath(); fs(c,"#fff6c8",3); }
    else if(t==="fire"){ c.rotate(-(s.rot||0)); c.scale(Math.sign(s.vx)||1,1); c.beginPath(); c.moveTo(16,0); c.quadraticCurveTo(6,-16,-20,-6); c.quadraticCurveTo(-8,0,-20,6); c.quadraticCurveTo(6,16,16,0); c.closePath(); fs(c,"#ff8a3c",3); circle(c,6,0,6); c.fillStyle="#ffe08a"; c.fill(); }
    else { circle(c,0,0,12); fs(c,col,3.4); circle(c,-4,-4,4); c.fillStyle="rgba(255,255,255,.8)"; c.fill(); }
    c.restore();
  }
  function drawSpeedLines(c,W,H,t,a){
    c.save(); c.globalAlpha=a; c.strokeStyle="#ffffff"; c.lineCap="round";
    const cxp=W/2, cyp=H/2;
    for(let i=0;i<46;i++){
      const ang=i*TAU/46+Math.sin(i*12.9)*.05, r0=Math.min(W,H)*(.42+((t*3+i*.37)%1)*.2), r1=Math.max(W,H)*.8;
      c.lineWidth=1.5+(i%3)*1.4;
      c.beginPath(); c.moveTo(cxp+Math.cos(ang)*r0,cyp+Math.sin(ang)*r0); c.lineTo(cxp+Math.cos(ang)*r1,cyp+Math.sin(ang)*r1); c.stroke();
    }
    c.restore();
  }
  /* カットイン */
  function drawCutin(c,W,H,u,t){
    const k0=.35, k1=1.28;
    if(u.t<k0||u.t>k1+.08)return;
    const tin=clamp((u.t-k0)/.16,0,1), tout=clamp((u.t-k1)/.08,0,1);
    const bandH=H*.46, cy=H*.5;
    const sd=SWORDS[B.p.rank];
    c.save();
    c.translate(W*(tout*1.3)+(1-Ease.outCubic(tin))*-W*1.2,0);
    /* おび */
    c.save(); c.translate(W/2,cy); c.rotate(-.09);
    const g=c.createLinearGradient(-W,0,W,0);
    g.addColorStop(0,"#1c1446"); g.addColorStop(.5,"#3a2a8e"); g.addColorStop(1,"#1c1446");
    c.fillStyle=g; c.fillRect(-W,-bandH/2,W*2,bandH);
    c.globalAlpha=.55; c.strokeStyle=sd.glow||"#ffd23f"; c.lineWidth=3;
    for(let i=0;i<22;i++){ const y=-bandH/2+((i*37.7)%bandH), x=((t*1600+i*211)%(W*2.4))-W*1.2; c.beginPath(); c.moveTo(x,y); c.lineTo(x+140+(i%4)*60,y); c.stroke(); }
    c.globalAlpha=1; c.fillStyle="#ffd23f"; c.fillRect(-W,-bandH/2-7,W*2,7); c.fillRect(-W,bandH/2,W*2,7);
    c.restore();
    /* かお */
    c.save();
    c.beginPath(); c.save(); c.translate(W/2,cy); c.rotate(-.09); c.rect(-W,-bandH/2,W*2,bandH); c.restore(); c.clip();
    const zoomIn=1+.06*Math.sin(Math.min(1,(u.t-k0)/.9)*Math.PI/2);
    if(cutOK){ const ih=bandH*1.35*zoomIn, iw=ih*CUT.naturalWidth/CUT.naturalHeight; c.drawImage(CUT,W*.3-iw/2,cy-ih*.52,iw,ih); }
    else drawHeroBust(c,W*.28,cy+bandH*.08,bandH/62*zoomIn,{expr:"shout",t});
    c.restore();
    /* もじ */
    const name=u.name, chars=Array.from(name), shown=Math.floor(clamp((u.t-k0-.12)/.42,0,1)*chars.length+.001);
    c.save(); c.translate(W*.66,cy); c.rotate(-.09);
    c.textAlign="center"; c.textBaseline="middle"; c.lineJoin="round";
    c.font="900 "+Math.round(bandH*.17)+"px "+FONT_R; c.lineWidth=bandH*.05; c.strokeStyle=OL;
    c.strokeText("ひっさつ！",0,-bandH*.24); c.fillStyle="#ff8fb1"; c.fillText("ひっさつ！",0,-bandH*.24);
    const fsz=Math.round(Math.min(bandH*.3,W*.52/Math.max(4,chars.length)));
    c.font="900 "+fsz+"px "+FONT_D;
    const txt=chars.slice(0,shown).join("");
    const full=c.measureText(name).width, x0=-full/2;
    const wSoFar=c.measureText(txt).width;
    c.textAlign="left";
    c.lineWidth=fsz*.32; c.strokeStyle="#fff"; c.strokeText(txt,x0,bandH*.08);
    c.lineWidth=fsz*.18; c.strokeStyle=OL; c.strokeText(txt,x0,bandH*.08);
    const tg=c.createLinearGradient(0,-fsz/2,0,fsz/2); tg.addColorStop(0,"#fff9c2"); tg.addColorStop(1,sd.glow&&B.p.rank>=3?sd.edge:"#ffb700");
    c.fillStyle=tg; c.fillText(txt,x0,bandH*.08);
    if(shown<chars.length&&shown>0)glow(c,x0+wSoFar,bandH*.08,fsz*.8,"#fff3a0",.8);
    c.restore();
    c.restore();
  }
  function drawWarning(c,W,H,pt){
    const a=Math.min(1,pt*4)*(pt>.85?(1.05-pt)/.2:1);
    c.save(); c.globalAlpha=a;
    const stripe=(y)=>{ c.save(); c.beginPath(); c.rect(0,y,W,46); c.clip(); c.fillStyle="#ffd23f"; c.fillRect(0,y,W,46);
      c.fillStyle="#2a1a40"; for(let x=-60+((pt*220)%60);x<W+60;x+=60){ c.beginPath(); c.moveTo(x,y); c.lineTo(x+30,y); c.lineTo(x,y+46); c.lineTo(x-30,y+46); c.closePath(); c.fill(); } c.restore(); };
    stripe(H*.22); stripe(H*.64);
    c.fillStyle="rgba(200,20,40,"+(.25+.15*Math.sin(pt*30))+")"; c.fillRect(0,H*.22+46,W,H*.64-H*.22-46);
    c.textAlign="center"; c.textBaseline="middle"; c.lineJoin="round";
    c.font="900 "+Math.round(H*.13)+"px "+FONT_D; c.lineWidth=14; c.strokeStyle=OL; c.strokeText("きけん！",W/2,H*.4);
    c.fillStyle="#fff"; c.fillText("きけん！",W/2,H*.4);
    c.font="900 "+Math.round(H*.055)+"px "+FONT_R; c.lineWidth=8; c.strokeText("つよい ぼす が やってくる！",W/2,H*.52); c.fillStyle="#ffd23f"; c.fillText("つよい ぼす が やってくる！",W/2,H*.52);
    c.restore();
  }

  /* ---------- ていし ---------- */
  function pause(){ if(!B||B.over||B.paused)return; B.paused=true; keys.l=keys.r=false; Music.pause(); UI.pauseOpen(); }
  function resume(){ if(!B)return; B.paused=false; Music.resume(); }
  function quit(){ if(!B)return; B.paused=false; B.over=true; Music.stop(.2); }
  function end(){ B=null; fx.clear(); }

  return {start,update,draw,attack,useSkill,useUlt,ultReady,setKey,skipIntro,pause,resume,quit,end,
    get B(){ return B; }, stageView:()=>stage};
})();
