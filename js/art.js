"use strict";
/* ==========================================================
   え — しゅじんこう（Canvas で うごかす）・てき（Codex の え ＋ よびの ベクター）
   ========================================================== */
const OL="#3a2a5e";
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function circle(c,x,y,r){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.closePath();}
function ell(c,x,y,rx,ry,rot){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,TAU);c.closePath();}
function fs(c,fill,lw){c.fillStyle=fill;c.fill();c.lineWidth=lw||4;c.strokeStyle=OL;c.lineJoin="round";c.lineCap="round";c.stroke();}
/* セル ぬり：かたち を かげ いろ で ぬって、ひかり がわ に ずらした もと いろ を かさねる */
function cel(c,path,base,shade,sx,sy,lw){
  path(); c.save(); c.clip(); c.fillStyle=shade; c.fill();
  c.translate(-(sx||3),-(sy||3)); path(); c.fillStyle=base; c.fill(); c.restore();
  path(); c.lineWidth=lw||3.6; c.strokeStyle=OL; c.lineJoin="round"; c.lineCap="round"; c.stroke();
}
function star(c,x,y,r,n,inner,rot){
  n=n||5; inner=inner||.45; c.beginPath();
  for(let i=0;i<n*2;i++){ const a=(rot||0)-Math.PI/2+i*Math.PI/n, rr_=i%2?r*inner:r; c.lineTo(x+Math.cos(a)*rr_,y+Math.sin(a)*rr_); }
  c.closePath();
}
function shadowEl(c,x,y,w,a){c.fillStyle="rgba(40,24,70,"+(a||.22)+")";c.beginPath();c.ellipse(x,y,Math.max(1,w),Math.max(1,w*.2),0,0,TAU);c.fill();}

/* ふんわり ひかる まる（すぷらいと を つくって おく） */
const GlowSprite={};
function glowSprite(col){
  if(GlowSprite[col])return GlowSprite[col];
  const s=document.createElement("canvas"); s.width=s.height=128;
  const g=s.getContext("2d"), gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,col); gr.addColorStop(.35,col); gr.addColorStop(1,"rgba(0,0,0,0)");
  g.globalAlpha=1; g.fillStyle=gr; g.fillRect(0,0,128,128);
  return GlowSprite[col]=s;
}
function glow(c,x,y,r,col,a){ c.save(); c.globalAlpha=a==null?1:a; c.globalCompositeOperation="lighter"; c.drawImage(glowSprite(col),x-r,y-r,r*2,r*2); c.restore(); }

/* ==========================================================
   しゅじんこう
   ========================================================== */
const HC={skin:"#ffe2c6",skinS:"#f6c39c",hair:"#433c95",hairS:"#2b2566",hairH:"#8577ea",band:"#ff4d5e",bandS:"#cf2f45",
  plate:"#eef3fb",plateS:"#a9b6cc",gi:"#3f73e6",giS:"#2b53b8",collar:"#ffffff",belt:"#ffc933",beltS:"#e09a00",
  pants:"#3a3486",pantsS:"#28236a",boot:"#8a5a2b",bootS:"#633d1a",scarf:"#ff4d5e",scarfS:"#c92c43",iris:"#3f58d8",irisD:"#1c1f6e"};

/* ぽーず を けいさん（すべて ラジアン。うで/あし は した むき が 0、まえ に ふる と ＋） */
function heroPose(o){
  const t=o.t||0, st=o.state||"idle";
  const P={y:0,lean:0,head:0,legF:0,legB:0,armB:.35,armF:1.15,sword:-1.05,expr:"normal",scarf:1,crouch:0,swingFrom:null};
  const breathe=Math.sin(t*3.2);
  if(st==="idle"){
    P.y=breathe*1.4; P.armF=1.12+breathe*.04; P.sword=-1.02+breathe*.03; P.armB=.3+breathe*.05; P.head=breathe*.02;
  }else if(st==="run"){
    const r=t*15; P.lean=.16; P.y=-Math.abs(Math.sin(r))*4;
    P.legF=Math.sin(r)*.75; P.legB=-Math.sin(r)*.75; P.armB=.2-Math.sin(r)*.7;
    P.armF=1.25+Math.sin(r)*.12; P.sword=-.6+Math.sin(r)*.06; P.scarf=1.8;
  }else if(st==="atk"){
    const k=o.swing||0, e=Ease.outCubic(1-k), ty=o.swingType||0;   /* k: 1→0 */
    P.lean=.14*Math.sin(Math.PI*(1-k)); P.expr="shout"; P.legF=.35; P.legB=-.25; P.armB=-.2;
    if(ty===0){ P.armF=lerp(2.9,.65,e); P.sword=lerp(-2.45,.8,e); P.swingFrom=-2.45; }
    else if(ty===1){ P.armF=lerp(.45,2.55,e); P.sword=lerp(1.0,-1.95,e); P.swingFrom=1.0; }
    else { P.armF=lerp(1.0,1.62,e); P.sword=lerp(-1.3,.12,e); P.swingFrom=-1.3; P.lean+=.08; }
  }else if(st==="jump"){
    P.legF=-.9; P.legB=.55; P.armB=1.6; P.armF=1.9; P.sword=-.85; P.scarf=1.6; P.expr="shout";
  }else if(st==="hurt"){
    P.lean=-.22; P.legF=.4; P.legB=-.3; P.armB=1.4; P.armF=1.9; P.sword=-.25; P.expr="hurt"; P.head=-.1;
  }else if(st==="charge"){
    P.crouch=7; P.lean=.18; P.legF=.55; P.legB=-.55; P.armB=.9; P.armF=.25; P.sword=2.55+Math.sin(t*30)*.02; P.expr="grit"; P.scarf=1.4;
  }else if(st==="dash"){
    P.crouch=6; P.lean=.5; P.legF=.9; P.legB=-1.0; P.armB=-.5; P.armF=.15; P.sword=2.95; P.expr="shout"; P.scarf=2.4;
  }else if(st==="finish"){
    P.crouch=4; P.lean=.05; P.legF=.3; P.legB=-.3; P.armF=.75; P.sword=.95; P.armB=.1; P.expr="cool";
  }else if(st==="win"){
    const k=Math.min(1,(o.tw||0)*4);
    P.y=-Math.abs(Math.sin(t*6))*3; P.armF=lerp(1.1,2.95,Ease.outBack(k)); P.sword=lerp(-1.0,-1.57,k); P.armB=-.5; P.expr="happy";
    P.legF=.12; P.legB=-.12;
  }else if(st==="lose"){
    P.crouch=16; P.lean=.35; P.head=.25; P.legF=1.2; P.legB=.9; P.armF=.4; P.sword=1.35; P.armB=.3; P.expr="dizzy";
  }else if(st==="cheer"){ /* メニュー の よろこび */
    P.y=-Math.abs(Math.sin(t*8))*6; P.armF=2.7+Math.sin(t*16)*.2; P.sword=-1.4; P.armB=2.6; P.expr="happy";
  }
  return P;
}

/* け ん（ランク で みため が かわる） */
function drawSword(c,rank,len,t,o){
  o=o||{};
  const sd=SWORDS[rank]||SWORDS[0], L=len||66;
  if(sd.glow&&!o.noGlow){
    c.save(); c.globalCompositeOperation="lighter";
    const pulse=.55+Math.sin(t*6)*.15;
    for(let i=0;i<4;i++){ const px=18+i*(L-18)/3; c.globalAlpha=pulse*(rank>=3?.9:.6); c.drawImage(glowSprite(sd.glow),px-17,-17,34,34); }
    c.restore();
  }
  /* つか */
  rr(c,-15,-4.2,17,8.4,3.6); fs(c,rank===0?"#8a5a2b":"#3a2a5e",3);
  if(rank>0){ c.strokeStyle="#ffd23f"; c.lineWidth=1.6; c.beginPath();
    for(let i=0;i<3;i++){ const xx=-12+i*5; c.moveTo(xx,-3.4); c.lineTo(xx+3,3.4); c.moveTo(xx+3,-3.4); c.lineTo(xx,3.4); } c.stroke(); }
  /* つば */
  ell(c,3.5,0,3.4,8.2); fs(c,rank>=3?"#ffd23f":rank>=1?"#c9a227":"#a86e38",3);
  /* は */
  c.beginPath(); c.moveTo(6,-3.8); c.quadraticCurveTo(L*.55,-5.6,L,-1.2); c.lineTo(L+4,.6); c.quadraticCurveTo(L*.55,3.4,6,3.8); c.closePath();
  let fill=sd.blade;
  if(rank===5){ const g=c.createLinearGradient(6,0,L,0), h=(t*120)%360;
    for(let i=0;i<=5;i++)g.addColorStop(i/5,"hsl("+((h+i*60)%360)+",95%,72%)"); fill=g; }
  else if(rank===3){ const g=c.createLinearGradient(6,0,L,0); g.addColorStop(0,"#ffe08a"); g.addColorStop(1,"#ff7a2e"); fill=g; }
  else if(rank===4){ const g=c.createLinearGradient(6,0,L,0); g.addColorStop(0,"#ffffff"); g.addColorStop(1,"#ffe14d"); fill=g; }
  fs(c,fill,3);
  /* はもん の ひかり */
  c.strokeStyle=rank===0?"rgba(255,255,255,.35)":"rgba(255,255,255,.9)"; c.lineWidth=1.8;
  c.beginPath(); c.moveTo(9,-1.2); c.quadraticCurveTo(L*.55,-2.8,L-4,-.6); c.stroke();
  if(rank===0){ c.strokeStyle="rgba(120,70,30,.45)"; c.lineWidth=1.2; c.beginPath(); c.moveTo(14,1.2); c.lineTo(L*.7,1.6); c.stroke(); }
  if(rank>=2&&!o.noGlow){ /* きらり */
    const gx=((t*.6)%1.6)/1.6*(L+30)-10;
    if(gx>6&&gx<L){ c.save(); c.globalCompositeOperation="lighter"; c.fillStyle="#fff"; star(c,gx,-1,5,4,.25,t*3); c.fill(); c.restore(); }
  }
  if(rank===4&&!o.noGlow&&Math.sin(t*23)>.3){ /* でんき */
    c.save(); c.strokeStyle="#fff7a0"; c.lineWidth=1.6; c.globalCompositeOperation="lighter"; c.beginPath();
    let x=10,y=0; c.moveTo(x,y); while(x<L){ x+=6+Math.random()*6; y=(Math.random()-.5)*14; c.lineTo(x,y); } c.stroke(); c.restore();
  }
}

/* かお（め・まゆ・くち） */
function heroFace(c,expr,t,blink){
  const nearX=11, farX=-4, ey=-74;
  const E=(x,rx,ry)=>{
    if(expr==="hurt"){ c.lineWidth=3.2; c.strokeStyle=OL; c.beginPath(); c.moveTo(x-rx,ey-ry*.6); c.lineTo(x+rx*.6,ey); c.lineTo(x-rx,ey+ry*.6); c.stroke(); return; }
    if(expr==="happy"||blink||expr==="cool"){ c.lineWidth=3.4; c.strokeStyle=OL; c.beginPath();
      if(expr==="happy")c.arc(x,ey+2,rx*.9,Math.PI*1.1,Math.PI*1.9); else { c.moveTo(x-rx,ey+1); c.quadraticCurveTo(x,ey+(expr==="cool"?-1:4),x+rx,ey+1); }
      c.stroke(); return; }
    if(expr==="dizzy"){ c.lineWidth=2.4; c.strokeStyle=OL; c.beginPath();
      for(let a=0;a<TAU*2;a+=.3){ const r=a/(TAU*2)*rx; c.lineTo(x+Math.cos(a+t*8)*r,ey+Math.sin(a+t*8)*r); } c.stroke(); return; }
    ell(c,x,ey,rx,ry); fs(c,"#fff",2.6);
    const g=c.createLinearGradient(0,ey-ry,0,ey+ry); g.addColorStop(0,HC.irisD); g.addColorStop(1,HC.iris);
    ell(c,x+1.2,ey+.6,rx*.72,ry*.8); c.fillStyle=g; c.fill();
    ell(c,x+1.6,ey+1,rx*.34,ry*.42); c.fillStyle="#120d33"; c.fill();
    circle(c,x-1,ey-ry*.38,rx*.34); c.fillStyle="#fff"; c.fill();
    circle(c,x+rx*.35,ey+ry*.35,rx*.16); c.fill();
  };
  E(farX,4.6,6.6); E(nearX,5.6,7.6);
  /* まゆ */
  c.lineWidth=3.2; c.strokeStyle=HC.hairS; c.lineCap="round"; c.beginPath();
  const bd=(expr==="shout"||expr==="grit")?3.2:expr==="hurt"||expr==="dizzy"?-2:1.6;
  c.moveTo(farX-5,ey-11); c.lineTo(farX+4,ey-11+bd*.6);
  c.moveTo(nearX-5,ey-11+bd); c.lineTo(nearX+6,ey-12);
  c.stroke();
  /* ほっぺ */
  ell(c,nearX+3,ey+9,4.2,2.4); c.fillStyle="rgba(255,110,120,.45)"; c.fill();
  ell(c,farX-3,ey+9,3,2); c.fill();
  /* くち */
  const mx=6, my=-61;
  c.lineWidth=2.8; c.strokeStyle=OL;
  if(expr==="shout"){ c.beginPath(); c.moveTo(mx-5,my-2); c.quadraticCurveTo(mx,my+9,mx+6,my-2); c.closePath(); fs(c,"#a8243c",2.6);
    ell(c,mx+.5,my+3.2,2.8,1.6); c.fillStyle="#ff7f8e"; c.fill(); }
  else if(expr==="happy"){ c.beginPath(); c.moveTo(mx-6,my-3); c.quadraticCurveTo(mx,my+8,mx+7,my-3); c.closePath(); fs(c,"#a8243c",2.6);
    ell(c,mx+.5,my+2.6,3,1.6); c.fillStyle="#ff7f8e"; c.fill(); }
  else if(expr==="grit"){ rr(c,mx-5,my-3,11,6,2.4); fs(c,"#fff",2.4); c.lineWidth=1.4; c.beginPath(); c.moveTo(mx-5,my); c.lineTo(mx+6,my); c.stroke(); }
  else if(expr==="hurt"){ c.beginPath(); c.moveTo(mx-5,my); c.quadraticCurveTo(mx-2.5,my-3,mx,my); c.quadraticCurveTo(mx+2.5,my+3,mx+5,my); c.stroke(); }
  else if(expr==="dizzy"){ ell(c,mx,my,2.4,3); fs(c,"#a8243c",2.2); }
  else if(expr==="cool"){ c.beginPath(); c.moveTo(mx-3,my); c.lineTo(mx+4,my-1); c.stroke(); }
  else { c.beginPath(); c.moveTo(mx-4,my-1.4); c.quadraticCurveTo(mx+.5,my+3.2,mx+5,my-1.8); c.stroke(); }
}

/* あたま（うしろがみ・かお・まえがみ・はちまき） */
function heroHead(c,t,P,o){
  const hx=2, hy=-76;
  /* はちまき の しっぽ（うしろ） */
  const w1=Math.sin(t*9)*5*P.scarf, w2=Math.sin(t*9+1.3)*6*P.scarf, len=10+P.scarf*9;
  c.beginPath(); c.moveTo(-18,-86); c.quadraticCurveTo(-28-len*.4,-92+w1*.5,-30-len,-84+w1);
  c.lineTo(-27-len,-79+w1); c.quadraticCurveTo(-24-len*.4,-84+w1*.3,-17,-80); c.closePath(); fs(c,HC.band,3.2);
  c.beginPath(); c.moveTo(-18,-83); c.quadraticCurveTo(-26-len*.3,-80+w2*.5,-26-len*.8,-70+w2);
  c.lineTo(-22-len*.8,-68+w2); c.quadraticCurveTo(-22-len*.3,-76,-16,-78); c.closePath(); fs(c,HC.bandS,3.2);
  /* うしろ がみ（かぜ に なびく とげ） */
  const hw=Math.sin(t*7)*1.5*P.scarf;
  c.beginPath(); c.moveTo(-14,-64);
  c.lineTo(-33+hw,-70); c.lineTo(-24,-78);
  c.lineTo(-39+hw,-88); c.lineTo(-25,-92);
  c.lineTo(-37+hw,-106); c.lineTo(-18,-100);
  c.lineTo(-8,-96); c.closePath(); fs(c,HC.hairS,3.2);
  /* かお */
  cel(c,()=>{ circle(c,hx,hy,23.5); },HC.skin,HC.skinS,-3.5,4,3.6);
  /* かみ（うえ の とげとげ） */
  const hairPath=()=>{
    c.beginPath();
    c.moveTo(-23,-70);
    c.quadraticCurveTo(-27,-94,-13,-103);
    c.lineTo(-21,-121+hw);
    c.lineTo(-3,-107);
    c.lineTo(3,-127+hw*.6);
    c.lineTo(11,-106);
    c.lineTo(25,-119+hw*.4);
    c.lineTo(21,-100);
    c.lineTo(33,-99);
    c.quadraticCurveTo(28,-96,26,-91);
    c.lineTo(-20,-86);
    c.quadraticCurveTo(-22,-78,-23,-70);
    c.closePath();
  };
  cel(c,hairPath,HC.hair,HC.hairS,-3,4,3.6);
  /* つや */
  c.save(); hairPath(); c.clip();
  c.strokeStyle=HC.hairH; c.lineWidth=3; c.lineCap="round"; c.beginPath();
  c.moveTo(-10,-99); c.quadraticCurveTo(0,-104,9,-100); c.moveTo(13,-100); c.lineTo(18,-98); c.stroke();
  c.restore();
  /* はちまき */
  c.beginPath(); c.moveTo(-21,-89); c.quadraticCurveTo(2,-99,25,-93); c.lineTo(25.5,-86); c.quadraticCurveTo(2,-92,-21,-82); c.closePath();
  fs(c,HC.band,3.2);
  rr(c,3,-98.5,15,11,3); fs(c,HC.plate,2.8);
  c.fillStyle="#ffd23f"; star(c,10.5,-93,3.6,5,.45); c.fill(); c.lineWidth=1.2; c.strokeStyle=OL; c.stroke();
  /* まえがみ（はちまき の うえ に かかる） */
  c.beginPath(); c.moveTo(18,-96); c.lineTo(22,-84); c.lineTo(25,-93); c.lineTo(30,-86); c.lineTo(29,-98); c.closePath(); fs(c,HC.hair,3);
  c.beginPath(); c.moveTo(-9,-95); c.lineTo(-6,-84); c.lineTo(-1,-93); c.lineTo(1,-96); c.closePath(); fs(c,HC.hair,3);
  heroFace(c,P.expr,t,o.blink&&P.expr==="normal");
}

function drawHero(c,x,gy,o){
  o=o||{};
  const t=o.t||0, sc=o.sc||1.25, face=o.face===undefined?1:o.face, rank=o.rank||0;
  const P=heroPose(o);
  const jump=o.jump||0;
  shadowEl(c,x,gy+2,26*sc*(jump>0?Math.max(.4,1-jump/160):1),.24);
  c.save();
  c.translate(x,gy-jump);
  c.scale(sc*face,sc);
  if(o.hurt>0&&Math.floor(t*30)%2===0)c.globalAlpha=.55;
  if(o.alpha!=null)c.globalAlpha*=o.alpha;
  c.translate(0,P.y+P.crouch);
  c.rotate(P.lean);
  /* オーラ */
  if(o.aura){ const sd=SWORDS[rank]; glow(c,0,-52,78+Math.sin(t*14)*6,sd.glow||"#fff3a0",.55); }

  /* まふらー（うしろ） */
  const sw=P.scarf, w=t*8;
  c.beginPath(); c.moveTo(-6,-58);
  const tx=-30-sw*14, ty=-50+Math.sin(w)*5*sw;
  c.bezierCurveTo(-18,-62+Math.sin(w+1)*3,-24-sw*4,-54+Math.sin(w+2)*6,tx,ty);
  c.lineTo(tx-4,ty+9);
  c.bezierCurveTo(-22-sw*4,-44+Math.sin(w+2.3)*6,-14,-50,-4,-48); c.closePath();
  cel(c,()=>{ c.beginPath(); c.moveTo(-6,-58); c.bezierCurveTo(-18,-62+Math.sin(w+1)*3,-24-sw*4,-54+Math.sin(w+2)*6,tx,ty);
    c.lineTo(tx-4,ty+9); c.bezierCurveTo(-22-sw*4,-44+Math.sin(w+2.3)*6,-14,-50,-4,-48); c.closePath(); },HC.scarf,HC.scarfS,0,-3,3.2);

  /* うしろ の あし */
  const leg=(hx,ang,col,colS)=>{
    c.save(); c.translate(hx,-26); c.rotate(-ang);
    cel(c,()=>rr(c,-6.5,-2,13,22,6),col,colS,-2,0,3.4);
    c.translate(0,21); cel(c,()=>{ ell(c,3,1,9,5.6); },HC.boot,HC.bootS,0,-2,3.2);
    c.restore();
  };
  leg(-5,P.legB,HC.pantsS,"#1d1950");
  /* うしろ の うで */
  c.save(); c.translate(-9,-52); c.rotate(-P.armB);
  cel(c,()=>rr(c,-5,-3,10,20,5),HC.giS,"#22469e",-2,0,3.2);
  circle(c,0,19,5.2); fs(c,HC.skin,3);
  c.restore();
  /* からだ（どうぎ） */
  cel(c,()=>{ c.beginPath(); c.moveTo(-15,-56); c.quadraticCurveTo(0,-60,15,-56); c.lineTo(17,-26); c.quadraticCurveTo(0,-22,-17,-26); c.closePath(); },HC.gi,HC.giS,-4,2,3.6);
  /* えり */
  c.beginPath(); c.moveTo(-8,-58); c.lineTo(2,-40); c.lineTo(11,-57); c.lineTo(6,-58); c.lineTo(2,-47); c.lineTo(-3,-58); c.closePath(); fs(c,HC.collar,2.6);
  /* おび */
  cel(c,()=>rr(c,-17,-34,34,8,3),HC.belt,HC.beltS,0,-2,3);
  c.beginPath(); c.moveTo(-10,-28); c.lineTo(-16,-18); c.lineTo(-11,-17); c.lineTo(-7,-26); c.closePath(); fs(c,HC.belt,2.6);
  /* まえ の あし */
  leg(6,P.legF,HC.pants,HC.pantsS);
  /* まふらー の まきもの */
  cel(c,()=>rr(c,-13,-63,26,10,5),HC.scarf,HC.scarfS,0,-2,3.2);
  /* あたま */
  c.save(); c.translate(2,-56); c.rotate(P.head); c.translate(-2,56);
  heroHead(c,t,P,o);
  c.restore();
  /* まえ の うで ＋ けん */
  const armL=19;
  c.save(); c.translate(9,-52);
  /* ふりの ざんぞう */
  if(o.state==="atk"&&P.swingFrom!=null&&(o.swing||0)>.05){
    const k=o.swing, a0=P.swingFrom, a1=P.sword, sd=SWORDS[rank];
    c.save(); c.globalAlpha=Math.min(1,k*1.6);
    const hx=Math.sin(P.armF)*armL, hy=Math.cos(P.armF)*armL, R=64;
    c.lineCap="round";
    c.strokeStyle="rgba(255,255,255,.85)"; c.lineWidth=16; c.beginPath();
    const s0=Math.min(a0,a1), s1=Math.max(a0,a1);
    c.arc(hx*.4,hy*.4,R,s0,s1); c.stroke();
    c.strokeStyle=sd.glow||"#ffd23f"; c.lineWidth=6; c.beginPath(); c.arc(hx*.4,hy*.4,R,s0,s1); c.stroke();
    c.restore();
  }
  c.rotate(-P.armF);
  cel(c,()=>rr(c,-5.5,-3,11,21,5.5),HC.gi,HC.giS,-2,0,3.2);
  c.translate(0,armL);
  c.rotate(P.armF);
  c.save(); c.rotate(P.sword); drawSword(c,rank,66,t,o); c.restore();
  circle(c,0,0,6); fs(c,HC.skin,3);
  c.restore();
  /* ためぎり の わっか */
  if(o.state==="charge"){
    c.save(); c.globalAlpha=.55+Math.sin(t*26)*.35; c.strokeStyle=SWORDS[rank].glow||"#ffd23f"; c.lineWidth=5;
    circle(c,0,-50,50+Math.sin(t*20)*4); c.stroke(); c.restore();
  }
  c.restore();
}

/* かお だけ（HUD・カットイン よう） */
function drawHeroBust(c,x,y,s,o){
  o=o||{};
  const P={expr:o.expr||"normal",scarf:1.2,head:0};
  c.save(); c.translate(x,y); c.scale(s,s); c.translate(-2,76);
  /* かた */
  cel(c,()=>{ c.beginPath(); c.moveTo(-26,-40); c.quadraticCurveTo(0,-62,28,-40); c.lineTo(30,-20); c.lineTo(-28,-20); c.closePath(); },HC.gi,HC.giS,-4,2,3.6);
  c.beginPath(); c.moveTo(-9,-58); c.lineTo(2,-36); c.lineTo(12,-57); c.lineTo(6,-58); c.lineTo(2,-46); c.lineTo(-3,-58); c.closePath(); fs(c,HC.collar,2.6);
  cel(c,()=>rr(c,-15,-64,30,11,5),HC.scarf,HC.scarfS,0,-2,3.2);
  heroHead(c,o.t||0,P,{blink:false});
  c.restore();
}

/* ---------- しゅじんこう の いちまいえ（Codex） ---------- */
const UIImg={};
function uiImg(id){
  if(UIImg[id])return UIImg[id];
  const rec={img:new Image(),ok:false};
  rec.img.decoding="async";
  rec.img.onload=()=>{ rec.ok=true; };
  rec.img.onerror=()=>{ rec.fail=true; };
  rec.img.src="img/ui/"+id+".webp";
  return UIImg[id]=rec;
}
/* いちまいえ を 「あしもと＝(x,gy)」で かく。h＝たかさ。ax＝あしもと の よこ いち（0〜1）。 */
function drawIllust(c,id,x,gy,h,o){
  const rec=uiImg(id); if(!rec.ok)return false;
  o=o||{};
  const im=rec.img, w=h*im.naturalWidth/im.naturalHeight, ax=o.ax==null?.5:o.ax;
  c.save(); c.translate(x,gy);
  if(o.face<0)c.scale(-1,1);
  if(o.rot)c.rotate(o.rot);
  c.scale(o.sx||1,o.sy||1);
  if(o.alpha!=null)c.globalAlpha*=o.alpha;
  c.drawImage(im,-w*ax,-h,w,h);
  c.restore();
  return true;
}

/* ---------- しゅじんこう の ぽーず え（Codex）で うごかす ---------- */
/* h: あたま の おおきさ が そろう たかさ（sc=1 の とき）／ ax: あしもと の よこ いち ／ sw: けん（つか→きっさき、え の なか の わりあい） */
const POSE_META={
  h_idle:  {h:108,ax:.48,sw:[.72,.56,.99,.16]},
  h_run:   {h:96, ax:.65,sw:[.36,.61,.01,.75]},
  h_run2:  {h:100,ax:.57,sw:[.42,.63,.99,.78]},
  h_run3:  {h:96, ax:.65,sw:[.38,.58,.01,.66]},
  h_slash1:{h:104,ax:.45,sw:[.67,.74,.99,.94]},
  h_slash2:{h:100,ax:.48,sw:[.72,.40,.99,.02]},
  h_thrust:{h:100,ax:.42,sw:[.65,.58,.99,.50]},
  h_jump:  {h:118,ax:.58,sw:[.74,.23,.10,.02]},
  h_hurt:  {h:93, ax:.70,sw:[.80,.62,.99,.10]},
  h_charge:{h:90, ax:.67,sw:[.39,.66,.01,.45]},
  h_dash:  {h:90, ax:.60,sw:[.39,.51,.01,.52]},
  h_finish:{h:96, ax:.51,sw:[.53,.71,.99,.91]},
  h_lose:  {h:93, ax:.64,sw:null},
  hero_win:{h:96, ax:.50,sw:[.85,.40,.99,.02]},
};
function heroPoseId(o){
  const st=o.state||"idle", t=o.t||0;
  if(st==="run")return (Math.floor(t*9)%2)?(uiImg("h_run3").ok?"h_run3":"h_run"):"h_run";
  if(st==="atk")return ["h_slash1","h_slash2","h_thrust"][o.swingType||0];
  if(st==="win"||st==="cheer")return "hero_win";
  return {idle:"h_idle",jump:"h_jump",hurt:"h_hurt",charge:"h_charge",dash:"h_dash",finish:"h_finish",lose:"h_lose"}[st]||"h_idle";
}
function heroSpritesReady(){ const r=uiImg("h_idle"); return r.ok; }
function drawHeroSprite(c,x,gy,o){
  o=o||{};
  let id=heroPoseId(o);
  if(!uiImg(id).ok){ if(!uiImg("h_idle").ok)return false; id="h_idle"; }
  const m=POSE_META[id]||POSE_META.h_idle, t=o.t||0, sc=o.sc||1.25, face=o.face===undefined?1:o.face, rank=o.rank||0;
  const rec=uiImg(id), im=rec.img, H=m.h*sc, Wd=H*im.naturalWidth/im.naturalHeight;
  const jump=o.jump||0;
  shadowEl(c,x,gy+2,26*sc*(jump>0?Math.max(.4,1-jump/160):1),.24);
  let sx=1, sy=1, ox=0, rot=0;
  const st=o.state||"idle";
  if(st==="idle"){ const b=Math.sin(t*3.2); sy=1+b*.018; sx=1-b*.01; }
  else if(st==="run"){ sy=1+Math.abs(Math.sin(t*15))*.03; rot=.03; }
  else if(st==="atk"){ const k=o.swing||0, e=Math.sin(Math.min(1,(1-k)*1.4)*Math.PI*.5); ox=10*e; sx=1+.06*k; sy=1-.04*k; }
  else if(st==="hurt"){ ox=-8; rot=-.06; }
  else if(st==="charge"){ ox=Math.sin(t*60)*1.5; }
  else if(st==="win"||st==="cheer"){ sy=1+Math.abs(Math.sin(t*7))*.04; }
  c.save();
  c.translate(x,gy-jump);
  c.scale(face,1);
  if(o.hurt>0&&Math.floor(t*30)%2===0)c.globalAlpha=.55;
  if(o.alpha!=null)c.globalAlpha*=o.alpha;
  if(o.aura){ const sd=SWORDS[rank]; glow(c,0,-H*.45,H*.75+Math.sin(t*14)*6,sd.glow||"#fff3a0",.55); }
  c.translate(ox,0); c.rotate(rot); c.scale(sx,sy);
  c.drawImage(im,-Wd*m.ax,-H,Wd,H);
  /* けん の ひかり（ランク） */
  const sd=SWORDS[rank];
  if(m.sw&&sd.glow&&!o.noGlow){
    const [x1,y1,x2,y2]=m.sw, X1=-Wd*m.ax+x1*Wd, Y1=-H+y1*H, X2=-Wd*m.ax+x2*Wd, Y2=-H+y2*H;
    c.save(); c.globalCompositeOperation="lighter";
    const n=6, pulse=.5+Math.sin(t*6)*.15;
    for(let i=1;i<=n;i++){ const k=i/n, px=lerp(X1,X2,k), py=lerp(Y1,Y2,k);
      let col=sd.glow; if(rank===5)col="hsl("+((t*140+i*50)%360)+",95%,70%)";
      c.globalAlpha=pulse*(rank>=3?.85:.55); c.drawImage(glowSprite(rank===5?"#ffffff":col),px-16,py-16,32,32);
      if(rank===5){ c.globalAlpha=.35; c.fillStyle=col; circle(c,px,py,6); c.fill(); } }
    if(rank===4&&Math.sin(t*23)>.2){ c.globalAlpha=.9; c.strokeStyle="#fff7a0"; c.lineWidth=2; c.beginPath(); c.moveTo(X1,Y1);
      for(let i=1;i<=6;i++){ const k=i/6; c.lineTo(lerp(X1,X2,k)+(Math.random()-.5)*12,lerp(Y1,Y2,k)+(Math.random()-.5)*12); } c.stroke(); }
    c.restore();
  }
  c.restore();
  return true;
}
/* つかう がわ：え が あれば え、なければ ベクター */
function drawHeroAny(c,x,gy,o){ if(!drawHeroSprite(c,x,gy,o))drawHero(c,x,gy,o); }

/* ==========================================================
   てき の え（Codex の いちまいえ）
   ========================================================== */
const EImg={};   /* id -> {img, white, ok} */
function loadEnemyImg(e){
  if(EImg[e.id])return EImg[e.id];
  const rec={img:new Image(),white:null,ok:false,fail:false};
  rec.img.decoding="async";
  rec.img.onload=()=>{
    rec.ok=true;
    try{ /* しろ シルエット（ひかる とき よう） */
      const w=rec.img.naturalWidth,h=rec.img.naturalHeight,cv=document.createElement("canvas");
      cv.width=w; cv.height=h; const g=cv.getContext("2d");
      g.drawImage(rec.img,0,0); g.globalCompositeOperation="source-in"; g.fillStyle="#fff"; g.fillRect(0,0,w,h);
      rec.white=cv;
      const cr=document.createElement("canvas"); cr.width=w; cr.height=h; const g2=cr.getContext("2d");
      g2.drawImage(rec.img,0,0); g2.globalCompositeOperation="source-in"; g2.fillStyle="#ff3b5c"; g2.fillRect(0,0,w,h);
      rec.red=cr;
    }catch(err){}
  };
  rec.img.onerror=()=>{ rec.fail=true; };
  rec.img.src="img/enemy/"+e.id+".webp";
  return EImg[e.id]=rec;
}
function enemyReady(e){ const r=loadEnemyImg(e); return r.ok; }

/* てき を かく：o = {t, face(-1=ひだり むき), hurt, windup(0..1), swing(1→0), walk, angry, dead(0..1), flash, sc} */
function drawEnemy(c,x,gy,e,o){
  o=o||{};
  const rec=loadEnemyImg(e);
  if(!rec.ok){ drawEnemyVec(c,x,gy,e,o); return; }
  const t=o.t||0, face=o.face===undefined?-1:o.face, H=e.h*(o.sc||1);
  const im=rec.img, W=H*im.naturalWidth/im.naturalHeight;
  const fly=e.fly?e.fly+Math.sin(t*2.6)*8:0;
  let sx=1, sy=1, rot=0, ox=0, oy=0;
  /* いき（ぷにぷに） */
  const br=Math.sin(t*3.1+e.idx);
  if(e.form==="blob"){ sy=1+br*.06; sx=1-br*.05; }
  else { sy=1+br*.022; sx=1-br*.012; }
  if(o.walk){ oy-=Math.abs(Math.sin(t*9))*(e.form==="blob"?10:5); rot+=Math.sin(t*9)*.035; }
  if(e.fly)rot+=Math.sin(t*2.6+.6)*.04;
  /* ためる（こうげき の まえ） */
  const wu=o.windup||0;
  if(wu>0){ rot+=.13*Ease.outCubic(Math.min(1,wu*1.4)); sx*=1+.06*wu; sy*=1-.05*wu; ox+=8*wu; }
  /* こうげき（まえ に ふみこむ） */
  const swg=o.swing||0;
  if(swg>0){ const k=Math.sin(swg*Math.PI); ox-=30*k; rot-=.16*k; sx*=1+.08*k; sy*=1-.06*k; }
  /* いたい */
  const hu=o.hurt||0;
  if(hu>0){ const k=hu/.25; ox+=10*k+Math.sin(t*90)*3*k; sx*=1+.12*k; sy*=1-.1*k; }
  /* やられ */
  const dd=o.dead||0;
  shadowEl(c,x,gy+2,W*.36*(1-dd*.8)*(e.fly?.7:1),.24*(1-dd));
  c.save();
  c.translate(x,gy-fly);
  if(face>0)c.scale(-1,1);
  c.translate(ox,oy);
  if(dd>0){ c.globalAlpha=1-Ease.inCubic(dd); rot+=dd*.8; sx*=1+dd*.3; sy*=1-dd*.4; }
  c.rotate(rot); c.scale(sx,sy);
  /* おこり モード の オーラ */
  if(o.angry){ glow(c,0,-H*.5,H*.62+Math.sin(t*10)*6,"#ff3b3b",.35); }
  if(e.glow&&!o.noGlow){ glow(c,0,-H*.5,H*.55,e.glow,.22+Math.sin(t*4)*.06); }
  /* ためる とき の ひかる ふち */
  if(wu>0&&rec.red){
    c.save(); c.globalAlpha=.45+.45*Math.sin(t*40);
    for(const [dx,dy] of [[-4,0],[4,0],[0,-4],[0,4]])c.drawImage(rec.red,-W/2+dx,-H+dy,W,H);
    c.restore();
  }
  c.drawImage(im,-W/2,-H,W,H);
  const fl=Math.max(hu>0?hu/.25:0,o.flash||0);
  if(fl>0&&rec.white){ c.save(); c.globalAlpha=Math.min(1,fl*1.2); c.drawImage(rec.white,-W/2,-H,W,H); c.restore(); }
  c.restore();
}
/* カード・ずかん よう（ちいさく） */
function enemyThumb(e){ return "img/enemy/"+e.id+".webp"; }

/* ---------- よび の ベクター てき（え が よめない とき） ---------- */
function eyeV(c,x,y,r,dir,blink){
  circle(c,x,y,r); fs(c,"#fff");
  if(blink){c.lineWidth=4;c.strokeStyle=OL;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.stroke();return;}
  c.fillStyle=OL;circle(c,x+dir*r*.28,y+r*.1,r*.46);c.fill();
  c.fillStyle="#fff";circle(c,x+dir*r*.1,y-r*.3,r*.18);c.fill();
}
function drawEnemyVec(c,x,gy,d,o){
  const t=o.t||0,sw=o.swing||0,hurt=o.hurt||0,face=(o.face===undefined?-1:o.face);
  const sc=d.size*(o.sc||1)*(d.h/(110*d.size))*.9, bob=Math.sin(t*3+1)*3;
  shadowEl(c,x,gy+2,30*sc);
  c.save();c.translate(x,gy-bob-(d.fly||0));c.scale(sc*(face<0?1:-1),sc);
  if(o.dead)c.globalAlpha=1-o.dead;
  if(hurt>0)c.globalAlpha=.55+Math.sin(t*60)*.35;
  if(d.glow){c.save();c.globalAlpha=.3+Math.sin(t*5)*.1;c.fillStyle=d.glow;circle(c,0,-50,56);c.fill();c.restore();}
  const F=d.form, blink=(t%3.4)>3.25;
  if(F==="blob"){
    const sq=1+Math.sin(t*4)*.09;
    c.save();c.scale(1/sq,sq);
    c.beginPath();c.moveTo(-34,0);c.quadraticCurveTo(-38,-52,0,-52);c.quadraticCurveTo(38,-52,34,0);c.closePath();fs(c,d.c);
    c.globalAlpha=.55;c.fillStyle="#fff";c.beginPath();c.ellipse(-12,-36,9,6,-.5,0,TAU);c.fill();c.globalAlpha=1;
    c.restore();
    eyeV(c,-11,-30,7,-1,blink);eyeV(c,11,-30,7,-1,blink);
    c.lineWidth=3.5;c.strokeStyle=OL;c.beginPath();c.arc(0,-18,7,0,Math.PI);c.stroke();
  }else if(F==="beast"){
    rr(c,-30,-42,58,34,16);fs(c,d.c);
    rr(c,-28,-18,10,18,5);fs(c,d.c2); rr(c,14,-18,10,18,5);fs(c,d.c2);
    circle(c,-34,-46,20);fs(c,d.c);
    eyeV(c,-28,-50,6,-1,blink);eyeV(c,-44,-50,5,-1,blink);
  }else if(F==="bug"){
    circle(c,0,-40,30);fs(c,d.c); circle(c,0,-46,17);fs(c,d.c2);
    eyeV(c,-10,-48,6,-1,blink);eyeV(c,10,-48,6,-1,blink);
  }else if(F==="serpent"){
    for(let i=6;i>=1;i--){const yy=-8-i*8,xx=Math.sin(t*3+i*.7)*16;circle(c,xx,yy,22-i*1.6);c.fillStyle=i%2?d.c:d.c2;c.fill();c.lineWidth=4;c.strokeStyle=OL;c.stroke();}
    const hx=Math.sin(t*3)*16; circle(c,hx,-70,23);fs(c,d.c); eyeV(c,hx-9,-74,6,-1,blink);eyeV(c,hx+9,-74,6,-1,blink);
  }else if(F==="flyer"){
    const flap=Math.sin(t*9)*.5;
    c.save();c.translate(-14,-58);c.rotate(-.5+flap);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-46,-24,-58,4);c.quadraticCurveTo(-30,-2,0,14);c.closePath();fs(c,d.c2);c.restore();
    c.save();c.translate(14,-58);c.rotate(.5-flap);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(46,-24,58,4);c.quadraticCurveTo(30,-2,0,14);c.closePath();fs(c,d.c2);c.restore();
    rr(c,-18,-58,36,46,16);fs(c,d.c); circle(c,0,-72,19);fs(c,d.c);
    eyeV(c,-8,-74,6,-1,blink);eyeV(c,8,-74,6,-1,blink);
  }else if(F==="giant"||F==="dragon"){
    rr(c,-40,-30,26,30,8);fs(c,d.c2); rr(c,14,-30,26,30,8);fs(c,d.c2);
    rr(c,-42,-88,84,62,18);fs(c,d.c);
    eyeV(c,-14,-64,9,-1,blink);eyeV(c,16,-64,9,-1,blink);
  }else{
    rr(c,-12,-24,10,24,5);fs(c,d.c2); rr(c,2,-24,10,24,5);fs(c,d.c2);
    if(F==="caster"){c.beginPath();c.moveTo(-16,-62);c.lineTo(16,-62);c.lineTo(30,0);c.lineTo(-30,0);c.closePath();fs(c,d.c);}
    else{rr(c,-20,-64,40,44,14);fs(c,d.c);}
    circle(c,0,-80,18);fs(c,d.skull?"#f4efe2":d.c);
    eyeV(c,-7,-82,6,-1,blink);eyeV(c,7,-82,6,-1,blink);
    if(d.horn){c.beginPath();c.moveTo(-13,-92);c.lineTo(-24,-116);c.lineTo(-4,-96);c.closePath();fs(c,"#fff8ea");
      c.beginPath();c.moveTo(13,-92);c.lineTo(24,-116);c.lineTo(4,-96);c.closePath();fs(c,"#fff8ea");}
    const ang=sw>0?lerp(-2.1,.8,1-sw):-.4+Math.sin(t*3.4)*.12;
    c.save();c.translate(-15,-56);c.rotate(-ang);rr(c,-26,-5,28,11,5);fs(c,d.c);
    c.translate(-26,0);c.beginPath();c.moveTo(0,-5);c.lineTo(-48,-3);c.lineTo(-48,3);c.lineTo(0,5);c.closePath();fs(c,"#e8eef8");c.restore();
  }
  c.restore();
}

/* ==========================================================
   こまかい え（こばん・びっくり・まきわら）
   ========================================================== */
function drawCoin(c,x,y,r,t){
  const sq=Math.abs(Math.cos(t*8));
  c.save(); c.translate(x,y);
  ell(c,0,0,r*Math.max(.15,sq),r); fs(c,"#ffd23f",Math.max(1.5,r*.22));
  if(sq>.4){ ell(c,0,0,r*.55*sq,r*.55); c.strokeStyle="#e09a00"; c.lineWidth=Math.max(1,r*.14); c.stroke(); }
  c.restore();
}
function drawBang(c,x,y,s,t){ /* ！ マーク */
  c.save(); c.translate(x,y); c.scale(s,s); c.rotate(Math.sin(t*30)*.08);
  c.beginPath(); c.moveTo(-9,-34); c.lineTo(9,-34); c.lineTo(5,-6); c.lineTo(-5,-6); c.closePath(); fs(c,"#ff3b5c",4);
  circle(c,0,5,6); fs(c,"#ff3b5c",4);
  c.restore();
}
function drawDummy(c,x,gy,t,hit){ /* まきわら */
  const wob=hit>0?Math.sin(t*50)*hit*.35:Math.sin(t*2)*.02;
  shadowEl(c,x,gy+2,26);
  c.save(); c.translate(x,gy); c.rotate(wob);
  rr(c,-6,-40,12,40,3); fs(c,"#8a5a2b",3.5);
  cel(c,()=>rr(c,-17,-112,34,76,14),"#f0cf7a","#c9a24a",-3,2,3.6);
  c.strokeStyle="#b8862f"; c.lineWidth=3; c.beginPath();
  for(let i=0;i<4;i++){ c.moveTo(-15,-100+i*16); c.quadraticCurveTo(0,-96+i*16,15,-100+i*16); } c.stroke();
  rr(c,-19,-86,38,7,3); fs(c,"#ff4d5e",3); rr(c,-19,-58,38,7,3); fs(c,"#ff4d5e",3);
  circle(c,0,-122,13); cel(c,()=>circle(c,0,-122,13),"#f0cf7a","#c9a24a",-2,2,3.4);
  c.restore();
}
