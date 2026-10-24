"use strict";
/* ==========================================================
   えんしゅつ（パーティクル・もじ・ひかり）
   ========================================================== */
const FONT_D="'Dela Gothic One','M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif";
const FONT_R="'M PLUS Rounded 1c','Hiragino Maru Gothic ProN','Hiragino Sans',sans-serif";

class FXList{
  constructor(){ this.a=[]; }
  add(p){
    p.t=0; p.life=p.life||.6; p.vx=p.vx||0; p.vy=p.vy||0; p.g=p.g||0; p.drag=p.drag==null?0:p.drag;
    p.rot=p.rot||0; p.vr=p.vr||0; p.s=p.s||1; this.a.push(p); return p;
  }
  clear(){ this.a.length=0; }
  update(dt){
    const a=this.a;
    for(let i=a.length-1;i>=0;i--){
      const p=a[i]; p.t+=dt;
      if(p.t>=p.life){ if(p.onEnd)p.onEnd(p); a.splice(i,1); continue; }
      if(p.upd){ p.upd(p,dt); continue; }
      if(p.drag){ const k=Math.pow(1-p.drag,dt*60); p.vx*=k; p.vy*=k; }
      p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
      if(p.floor!=null&&p.y>p.floor){ p.y=p.floor; p.vy*=-(p.bounce||.4); p.vx*=.7; }
    }
  }
  draw(c,layer){
    for(const p of this.a){ if((p.layer||"front")!==layer)continue; drawP(c,p); }
  }
}

function drawP(c,p){
  const k=p.t/p.life, inv=1-k;
  switch(p.k){
  case "dot":{
    c.globalAlpha=p.fade===false?1:Math.min(1,inv*1.6);
    c.fillStyle=p.col; circle(c,p.x,p.y,Math.max(.5,p.r*(p.shrink===false?1:inv*.8+.2))); c.fill();
    c.globalAlpha=1; break; }
  case "glow":{
    const r=p.r*(p.grow?1+k*p.grow:inv*.7+.3);
    glow(c,p.x,p.y,r,p.col,Math.min(1,inv*1.8)*(p.a||1)); break; }
  case "spark":{
    c.save(); c.globalCompositeOperation="lighter"; c.globalAlpha=Math.min(1,inv*2);
    c.strokeStyle=p.col; c.lineWidth=p.w||4; c.lineCap="round";
    const sp=Math.hypot(p.vx,p.vy)||1, len=(p.len||.045)*sp;
    c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p.x-p.vx/sp*len,p.y-p.vy/sp*len); c.stroke(); c.restore(); break; }
  case "star":{
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
    const sc=p.pop?Ease.outBack(Math.min(1,k*4))*(k>.7?(1-k)/.3:1):inv;
    c.globalAlpha=Math.min(1,inv*2);
    star(c,0,0,p.r*sc,p.n||5,p.inner||.45); c.fillStyle=p.col; c.fill();
    if(p.ol!==false){ c.lineWidth=2.5; c.strokeStyle=OL; c.stroke(); }
    c.restore(); break; }
  case "ring":{
    c.save(); c.globalAlpha=inv*(p.a||1); c.strokeStyle=p.col; c.lineWidth=(p.w||8)*inv+1;
    if(p.add)c.globalCompositeOperation="lighter";
    const r=p.r0+(p.r1-p.r0)*Ease.outCubic(k);
    c.beginPath(); c.ellipse(p.x,p.y,r,r*(p.flat||1),0,0,TAU); c.stroke(); c.restore(); break; }
  case "puff":{
    c.globalAlpha=Math.max(0,inv*.8); c.fillStyle=p.col||"#fff";
    circle(c,p.x,p.y,p.r*(.6+k*.9)); c.fill(); c.globalAlpha=1; break; }
  case "slash":{
    const a=Math.min(1,inv*1.8);
    c.save(); c.translate(p.x,p.y); c.scale(p.face*p.sc,p.sc); c.rotate(p.rot);
    const R=56, a0=p.a0==null?-1.15:p.a0, a1=p.a1==null?.85:p.a1, e=Ease.outCubic(Math.min(1,k*3));
    const aa=a0+(a1-a0)*e;
    c.globalAlpha=a; c.lineCap="round";
    c.globalCompositeOperation="lighter";
    c.strokeStyle=p.glow||"#ffe27a"; c.lineWidth=26*inv+4; c.globalAlpha=a*.45;
    c.beginPath(); c.arc(0,0,R,a0,aa); c.stroke();
    c.globalCompositeOperation="source-over"; c.globalAlpha=a;
    c.strokeStyle="#ffffff"; c.lineWidth=13*inv+3; c.beginPath(); c.arc(0,0,R,a0,aa); c.stroke();
    c.strokeStyle=p.col||"#ffd23f"; c.lineWidth=5*inv+1.5; c.beginPath(); c.arc(0,0,R+2,a0,aa); c.stroke();
    c.restore(); break; }
  case "line":{ /* ながい ひとふで（いっせん） */
    const e=Ease.outCubic(Math.min(1,k*5)), a=k<.6?1:inv/.4;
    c.save(); c.globalAlpha=a; c.lineCap="round";
    const x2=p.x+(p.x2-p.x)*e, y2=p.y+(p.y2-p.y)*e;
    c.globalCompositeOperation="lighter"; c.strokeStyle=p.glow||"#ffe27a"; c.lineWidth=(p.w||16)*2.4;
    c.globalAlpha=a*.4; c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(x2,y2); c.stroke();
    c.globalCompositeOperation="source-over"; c.globalAlpha=a;
    c.strokeStyle="#fff"; c.lineWidth=(p.w||16)*(k<.5?1:inv*2); c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(x2,y2); c.stroke();
    c.restore(); break; }
  case "text":{
    const pop=Ease.outBack(Math.min(1,k/.18));
    const out=k>.72?(1-k)/.28:1;
    c.save(); c.translate(p.x,p.y-(p.rise||0)*k); c.rotate(p.rot); c.scale(pop*p.s,pop*p.s);
    c.globalAlpha=Math.max(0,out);
    c.font=(p.w||"900")+" "+p.size+"px "+(p.font||FONT_D); c.textAlign="center"; c.textBaseline="middle";
    c.lineJoin="round";
    if(p.ol2){ c.lineWidth=p.size*.42; c.strokeStyle=p.ol2; c.strokeText(p.txt,0,0); }
    c.lineWidth=p.size*.24; c.strokeStyle=OL; c.strokeText(p.txt,0,0);
    if(p.grad){ const g=c.createLinearGradient(0,-p.size/2,0,p.size/2); g.addColorStop(0,p.grad[0]); g.addColorStop(1,p.grad[1]); c.fillStyle=g; }
    else c.fillStyle=p.col||"#fff";
    c.fillText(p.txt,0,0);
    c.restore(); break; }
  case "num":{
    const pop=Ease.outBack(Math.min(1,k/.15)), out=k>.7?(1-k)/.3:1;
    c.save(); c.translate(p.x,p.y); c.scale(pop*p.s,pop*p.s); c.globalAlpha=Math.max(0,out);
    c.font="900 "+p.size+"px "+FONT_D; c.textAlign="center"; c.textBaseline="middle"; c.lineJoin="round";
    c.lineWidth=p.size*.3; c.strokeStyle=OL; c.strokeText(p.txt,0,0);
    const g=c.createLinearGradient(0,-p.size/2,0,p.size/2); g.addColorStop(0,p.c1); g.addColorStop(1,p.c2); c.fillStyle=g;
    c.fillText(p.txt,0,0);
    if(p.sub){ c.font="900 "+(p.size*.42)+"px "+FONT_R; c.lineWidth=p.size*.14; c.strokeText(p.sub,0,-p.size*.72); c.fillStyle="#fff"; c.fillText(p.sub,0,-p.size*.72); }
    c.restore(); break; }
  case "coin":{ drawCoin(c,p.x,p.y,p.r,p.t+p.seed); break; }
  case "confetti":{
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot); c.globalAlpha=Math.min(1,inv*3);
    c.fillStyle=p.col; c.fillRect(-p.r,-p.r*.45,p.r*2,p.r*.9*Math.abs(Math.cos(p.t*9+p.seed))); c.restore(); break; }
  case "bolt":{ /* いなずま */
    c.save(); c.globalCompositeOperation="lighter"; c.globalAlpha=inv; c.strokeStyle=p.col||"#fff59a"; c.lineWidth=p.w||6; c.lineJoin="round";
    c.beginPath(); let y=p.y0, x=p.x; c.moveTo(x,y);
    const seg=8; for(let i=1;i<=seg;i++){ y=p.y0+(p.y-p.y0)*i/seg; x=p.x+(i<seg?(Math.sin(p.seed+i*7.3)*18):0); c.lineTo(x,y); }
    c.stroke(); c.lineWidth=(p.w||6)*.35; c.strokeStyle="#fff"; c.stroke(); c.restore(); break; }
  case "img":{
    c.save(); c.globalAlpha=(p.a||1)*Math.min(1,inv*2); c.translate(p.x,p.y); c.scale(p.face||1,1);
    if(p.draw)p.draw(c,p); c.restore(); break; }
  }
}

/* よく つかう くみあわせ */
const Burst={
  hit(fx,x,y,col,big){
    const n=big?16:9;
    for(let i=0;i<n;i++){ const a=rnd(0,TAU), s=rnd(260,big?760:520);
      fx.add({k:"spark",x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,drag:.12,life:rnd(.18,.32),col:col||"#ffe27a",w:big?6:4}); }
    fx.add({k:"ring",x,y,r0:10,r1:big?110:70,life:.28,col:"#fff",w:big?12:8});
    fx.add({k:"glow",x,y,r:big?110:70,col:col||"#ffe27a",life:.2});
    for(let i=0;i<(big?5:3);i++)fx.add({k:"star",x:x+rnd(-30,30),y:y+rnd(-30,30),vx:rnd(-160,160),vy:rnd(-260,-60),g:500,r:rnd(7,13),col:pick(["#ffd23f","#fff","#7ef0c4","#ff9fbc"]),life:rnd(.45,.7),vr:rnd(-8,8)});
  },
  dust(fx,x,y,dir,n){
    for(let i=0;i<(n||6);i++)fx.add({k:"puff",layer:"back",x:x+rnd(-10,10),y:y-rnd(0,10),vx:-dir*rnd(40,160),vy:-rnd(10,60),drag:.06,r:rnd(7,14),col:"rgba(255,248,234,.9)",life:rnd(.3,.55)});
  },
  heal(fx,x,y){
    for(let i=0;i<22;i++)fx.add({k:"glow",x:x+rnd(-45,45),y:y-rnd(0,120),vy:-rnd(60,160),r:rnd(10,20),col:"#7ef0c4",life:rnd(.5,.9)});
    for(let i=0;i<8;i++)fx.add({k:"star",x:x+rnd(-40,40),y:y-rnd(20,110),vy:-rnd(40,120),r:rnd(6,10),col:"#b8ffe0",life:rnd(.6,1),vr:rnd(-4,4),ol:false});
    fx.add({k:"ring",x,y:y-4,r0:10,r1:80,flat:.3,life:.5,col:"#7ef0c4",w:10,add:true});
  },
  stars(fx,x,y,n,big){
    for(let i=0;i<n;i++){ const a=rnd(0,TAU), s=rnd(120,big?520:340);
      fx.add({k:"star",x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-120,g:420,drag:.02,r:rnd(8,big?20:14),col:pick(["#ffd23f","#fff59a","#ff9fbc","#7ec8f2","#7ef0c4"]),life:rnd(.7,1.2),vr:rnd(-9,9),pop:true}); }
  },
  confetti(fx,W,n){
    for(let i=0;i<n;i++)fx.add({k:"confetti",layer:"ui",x:rnd(0,W),y:rnd(-80,-10),vx:rnd(-40,40),vy:rnd(80,220),g:80,r:rnd(5,9),rot:rnd(0,TAU),vr:rnd(-6,6),seed:rnd(0,9),
      col:pick(["#ffd23f","#ff6b6b","#42d6a4","#7ec8f2","#a78bd8","#ff9fbc"]),life:rnd(2.2,3.4)});
  },
};
function onoma(fx,x,y,txt,o){
  o=o||{};
  return fx.add({k:"text",x,y,txt,size:o.size||46,life:o.life||.7,rot:o.rot==null?rnd(-.25,.25):o.rot,rise:o.rise==null?26:o.rise,
    grad:o.grad||["#fff9c2","#ffb700"],ol2:o.ol2===undefined?"#fff":o.ol2,s:o.s||1,font:o.font,layer:o.layer||"front"});
}
function dmgNum(fx,x,y,n,o){
  o=o||{};
  const p=fx.add({k:"num",x:x+rnd(-14,14),y,txt:String(n),size:o.size||40,s:1,life:o.life||.85,
    c1:o.c1||"#ffffff",c2:o.c2||"#ffd23f",sub:o.sub,layer:"front",vx:rnd(-50,50),vy:-340,g:900});
  p.upd=(q,dt)=>{ q.vy+=q.g*dt; q.x+=q.vx*dt; q.y+=q.vy*dt; if(q.vy>0)q.vy*=.9; };
  return p;
}
