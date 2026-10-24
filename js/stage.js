"use strict";
/* ==========================================================
   はいけい（Codex の え ＋ うごく つぶつぶ）
   ========================================================== */
const BGImg={};
/* え の なか の 「じめん の うえ の ふち」 の たかさ（わりあい） */
const BG_GROUND={bg_s1:.745,bg_s2:.74,bg_s3:.756,bg_s4:.665,bg_s5:.706,bg_menu:.742,bg_title:.8};
function loadBg(id){
  if(BGImg[id])return BGImg[id];
  const rec={img:new Image(),ok:false};
  rec.img.decoding="async";
  rec.img.onload=()=>{ rec.ok=true; };
  rec.img.onerror=()=>{ rec.fail=true; };
  rec.img.src="img/bg/"+id+".webp";
  return BGImg[id]=rec;
}
/* え を 「じめん の せん」 に あわせて しきつめる */
function drawBgImage(c,id,W,H,GY,o){
  const rec=loadBg(id);
  if(!rec.ok)return false;
  const im=rec.img, iw=im.naturalWidth, ih=im.naturalHeight, gr=BG_GROUND[id]||.74;
  const s=Math.max(W/iw, GY/(gr*ih), (H-GY)/((1-gr)*ih))*((o&&o.zoom)||1);
  const dw=iw*s, dh=ih*s, dx=(W-dw)/2+((o&&o.px)||0), dy=GY-gr*dh;
  c.drawImage(im,dx,dy,dw,dh);
  return true;
}
function drawBgFallback(c,st,W,H,GY,t){
  const g=c.createLinearGradient(0,0,0,GY);
  g.addColorStop(0,st.sky[0]); g.addColorStop(1,st.sky[1]);
  c.fillStyle=g; c.fillRect(-60,-60,W+120,GY+60);
  c.fillStyle="rgba(255,255,255,.18)";
  for(let i=-1;i<5;i++){ const x=i*300-((t*10)%300); c.beginPath(); c.moveTo(x,GY); c.quadraticCurveTo(x+150,GY-170,x+300,GY); c.fill(); }
  c.fillStyle=st.col; c.fillRect(-60,GY,W+120,H-GY+60);
  c.fillStyle="rgba(0,0,0,.12)"; c.fillRect(-60,GY+14,W+120,H-GY);
  c.strokeStyle=OL; c.lineWidth=4; c.beginPath(); c.moveTo(-60,GY); c.lineTo(W+60,GY); c.stroke();
}

/* ---------- ふんいき の つぶつぶ ---------- */
class Ambient{
  constructor(kind){ this.kind=kind; this.p=[]; this.acc=0; }
  update(dt,W,H,GY){
    const k=this.kind, rate={petal:5,dust:6,snow:22,ember:14,magic:10,leaf:4}[k]||0;
    this.acc+=dt*rate;
    while(this.acc>1){ this.acc--;
      if(k==="petal"||k==="leaf")this.p.push({x:W+20,y:rnd(-20,GY*.7),vx:-rnd(40,90),vy:rnd(10,40),r:rnd(4,7),rot:rnd(0,TAU),vr:rnd(-3,3),ph:rnd(0,TAU),l:12});
      else if(k==="dust")this.p.push({x:rnd(-20,W),y:rnd(GY*.3,GY),vx:rnd(20,60),vy:rnd(-6,6),r:rnd(1.5,3.5),ph:rnd(0,TAU),l:8});
      else if(k==="snow")this.p.push({x:rnd(-40,W+40),y:-10,vx:rnd(-25,10),vy:rnd(35,80),r:rnd(1.6,4.2),ph:rnd(0,TAU),l:14});
      else if(k==="ember")this.p.push({x:rnd(0,W),y:H+10,vx:rnd(-15,15),vy:-rnd(40,110),r:rnd(1.5,3.8),ph:rnd(0,TAU),l:9});
      else if(k==="magic")this.p.push({x:rnd(0,W),y:rnd(GY*.2,H),vx:rnd(-8,8),vy:-rnd(12,40),r:rnd(1.5,3.5),ph:rnd(0,TAU),l:7});
    }
    for(const p of this.p){ p.l-=dt; p.ph+=dt*3; p.x+=(p.vx+(k==="snow"?Math.sin(p.ph)*14:k==="petal"?Math.sin(p.ph)*20:0))*dt; p.y+=p.vy*dt; if(p.vr)p.rot+=p.vr*dt; }
    this.p=this.p.filter(p=>p.l>0&&p.x>-60&&p.x<W+60&&p.y<H+30&&p.y>-40);
  }
  draw(c){
    const k=this.kind;
    for(const p of this.p){
      if(k==="petal"||k==="leaf"){
        c.save(); c.translate(p.x,p.y); c.rotate(p.rot); c.scale(1,Math.abs(Math.cos(p.ph))*.8+.2);
        c.fillStyle=k==="petal"?"#ffc1d9":"#8fd46a"; ell(c,0,0,p.r*1.4,p.r*.8); c.fill(); c.restore();
      }else if(k==="dust"){ c.globalAlpha=.35+.25*Math.sin(p.ph); c.fillStyle="#fff1d0"; circle(c,p.x,p.y,p.r); c.fill(); c.globalAlpha=1; }
      else if(k==="snow"){ c.globalAlpha=.9; c.fillStyle="#fff"; circle(c,p.x,p.y,p.r); c.fill(); c.globalAlpha=1; }
      else if(k==="ember"){ glow(c,p.x,p.y,p.r*4,"#ff9a3c",.55+.3*Math.sin(p.ph*2)); c.fillStyle="#ffe08a"; circle(c,p.x,p.y,p.r*.6); c.fill(); }
      else if(k==="magic"){ glow(c,p.x,p.y,p.r*5,"#c79bff",.5+.3*Math.sin(p.ph*2)); }
    }
  }
}

/* ステージ まるごと（はいけい → つぶつぶ）。 */
class StageView{
  constructor(stageIdx){ this.set(stageIdx); this.t=0; this.flashT=0; }
  set(i){ this.i=i; this.st=STAGES[i]; this.amb=new Ambient(this.st.amb); loadBg(this.st.bg); }
  update(dt,W,H,GY){
    this.t+=dt; this.amb.update(dt,W,H,GY);
    if(this.st.amb==="magic"){ this.flashT-=dt; if(this.flashT<-rnd(4,9))this.flashT=.35; }
  }
  drawBack(c,W,H,GY,o){
    if(!drawBgImage(c,this.st.bg,W,H,GY,o))drawBgFallback(c,this.st,W,H,GY,this.t);
    if(this.st.amb==="magic"&&this.flashT>0){ c.fillStyle="rgba(220,200,255,"+(this.flashT*.5)+")"; c.fillRect(0,0,W,GY); }
    if(this.st.amb==="ember"){ c.fillStyle="rgba(255,90,40,"+(.05+.04*Math.sin(this.t*2))+")"; c.fillRect(0,0,W,H); }
  }
  drawFront(c){ this.amb.draw(c); }
}
