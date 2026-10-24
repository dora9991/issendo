"use strict";
/* ==========================================================
   きどう ＋ まいフレーム
   ========================================================== */
const View={cv:document.getElementById("view"),cx:null,W:1000,H:500,GY:372,s:1,dpr:1};
View.cx=View.cv.getContext("2d");
function resize(){
  const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight);
  const dpr=Math.min(2,window.devicePixelRatio||1);
  View.cv.width=Math.round(w*dpr); View.cv.height=Math.round(h*dpr);
  let H=500, s=h/H, W=w/s;
  if(W<880){ W=880; s=w/W; H=h/s; }
  if(W>1280){ W=1280; s=w/W; H=h/s; }
  View.W=W; View.H=H; View.s=s; View.dpr=dpr; View.GY=H-128;
}
addEventListener("resize",resize);
addEventListener("orientationchange",()=>setTimeout(resize,250));
if(window.visualViewport)visualViewport.addEventListener("resize",resize);

/* ---------- タイトル・メニュー の けしき ---------- */
const Scene=(()=>{
  const fx=new FXList();
  let t=0, swing=0, swingType=0, nextSwing=2.4, cheer=0;
  const petals=new Ambient("petal");
  let pickStage=null;
  function update(dt){
    t+=dt; fx.update(dt); petals.update(dt,View.W,View.H,View.GY);
    swing=Math.max(0,swing-dt*4.2); cheer=Math.max(0,cheer-dt);
    if(CUR==="title"){
      nextSwing-=dt;
      if(nextSwing<=0){ nextSwing=rnd(1.6,3); swing=1; swingType=(swingType+1)%3;
        const W=View.W,H=View.H,hx=W*.2+H*.14, hy=H*.52;
        fx.add({k:"slash",x:hx,y:hy,face:1,sc:1.5,life:.32,a0:[-1.25,1.05,-.35][swingType],a1:[.9,-1,.35][swingType],col:"#ffd23f",glow:"#fff3a0"});
        for(let i=0;i<7;i++)fx.add({k:"star",x:hx+rnd(-40,40),y:hy+rnd(-40,40),vx:rnd(-80,160),vy:rnd(-200,-40),g:300,r:rnd(5,9),col:pick(["#fff","#ffd23f","#ffc1d9"]),life:.6,vr:rnd(-6,6)});
      }
    }
  }
  function heroTap(){ cheer=1.2; sfx.pop(); }
  function draw(c){
    const W=View.W,H=View.H,GY=View.GY,r=swordRank(S.atk);
    if(CUR==="title"){
      if(!drawBgImage(c,"bg_title",W,H,H-30)&&!drawBgImage(c,"bg_s1",W,H,GY))drawBgFallback(c,STAGES[0],W,H,GY,t);
      c.save(); c.globalCompositeOperation="lighter"; c.globalAlpha=.16+.05*Math.sin(t*1.3);
      for(let i=0;i<9;i++){ c.save(); c.translate(W*.5,H*.32); c.rotate(i*TAU/9+t*.05); c.fillStyle="#fff6c8"; c.beginPath(); c.moveTo(0,0); c.lineTo(W,-60); c.lineTo(W,60); c.closePath(); c.fill(); c.restore(); }
      c.restore();
      petals.draw(c);
      const hg=H-22, br=Math.sin(t*2.4);
      if(!drawIllust(c,"hero_title",W*.2,hg,H*.6,{sy:1+br*.012,sx:1-br*.006,ax:.45}))
        drawHero(c,W*.17,H-34,{t,state:swing>0?"atk":"idle",swing,swingType,sc:1.95,rank:Math.max(r,1),face:1,blink:(t%3.4)>3.28});
      fx.draw(c,"front");
      return;
    }
    if(CUR==="menu"){
      if(!drawBgImage(c,"bg_menu",W,H,GY))drawBgFallback(c,STAGES[0],W,H,GY,t);
      petals.draw(c);
      const hx=Math.min(W*.2,W*.4-80);
      drawHeroAny(c,hx,GY+30,{t,state:cheer>0?"cheer":"idle",sc:2.25,rank:r,face:1,blink:(t%3.4)>3.28,aura:r>=3});
      fx.draw(c,"front");
      return;
    }
    /* いちらん の がめん（うすぐらく） */
    let bg="bg_menu";
    if(CUR==="pick")bg=STAGES[UI.pickStage].bg;
    if(!drawBgImage(c,bg,W,H,GY))drawBgFallback(c,STAGES[CUR==="pick"?UI.pickStage:0],W,H,GY,t);
    c.fillStyle="rgba(28,20,70,.42)"; c.fillRect(0,0,W,H);
    petals.draw(c);
  }
  return {update,draw,heroTap};
})();

/* ---------- まいフレーム ---------- */
let _last=performance.now();
function frame(now){
  let dt=(now-_last)/1000; _last=now;
  if(!(dt>0))dt=0; if(dt>.05)dt=.05;
  const c=View.cx;
  c.setTransform(View.s*View.dpr,0,0,View.s*View.dpr,0,0);
  c.globalAlpha=1; c.globalCompositeOperation="source-over";
  try{
    if(CUR==="battle"&&Battle.B){ Battle.update(dt); Battle.draw(c); }
    else if(CUR==="train"&&Train.T){ Train.update(dt); Train.draw(c); }
    else { Scene.update(dt); Scene.draw(c); }
  }catch(err){ console.error(err); }
  requestAnimationFrame(frame);
}

/* ---------- キーボード（パソコン よう） ---------- */
addEventListener("keydown",e=>{
  const k=e.key;
  if(CUR==="battle"&&Battle.B){
    if($("#veilPause").classList.contains("on")){ if(k==="Escape"||k==="Enter"){ closeVeil("veilPause"); Battle.resume(); } return; }
    if(k==="ArrowLeft")Battle.setKey("l",true);
    else if(k==="ArrowRight")Battle.setKey("r",true);
    else if((k==="z"||k==="Z"||k===" "||k==="j")&&!e.repeat)Battle.attack();
    else if((k==="z"||k==="Z"||k===" "||k==="j")&&e.repeat)Battle.attack();
    else if(k==="x"||k==="X"||k==="k")Battle.useUlt();
    else if(k==="ArrowUp"){ const s=activeSkills().find(s=>s.kind==="jump"); if(s)Battle.useSkill(s); }
    else if(k==="Escape"||k==="p")Battle.pause();
    else { const n=parseInt(k,10); if(n>=1&&n<=9){ const L=activeSkills(); if(L[n-1])Battle.useSkill(L[n-1]); } }
    if(k===" "||k.startsWith("Arrow"))e.preventDefault();
    Battle.skipIntro();
  }else if(CUR==="train"){
    if((k===" "||k==="z"||k==="Z"||k==="Enter")&&!e.repeat){ Train.tap(); e.preventDefault(); }
  }
});
addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft")Battle.setKey("l",false);
  if(e.key==="ArrowRight")Battle.setKey("r",false);
});

/* ---------- がめん が かくれた とき ---------- */
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    if(CUR==="battle"&&Battle.B&&Battle.B.phase!=="ko"&&Battle.B.phase!=="lose")Battle.pause();
    Music.pause();
    try{ if(AC&&AC.state==="running")AC.suspend(); }catch(e){}
  }else{
    try{ if(AC&&AC.state!=="running")AC.resume(); }catch(e){}
    if(!(CUR==="battle"&&Battle.B&&Battle.B.paused))Music.resume();
  }
});

/* ---------- きどう ---------- */
(function boot(){
  document.addEventListener("contextmenu",e=>e.preventDefault());
  document.addEventListener("selectstart",e=>{ if(!e.target.closest("input,textarea"))e.preventDefault(); });
  document.addEventListener("dragstart",e=>e.preventDefault());
  document.addEventListener("gesturestart",e=>e.preventDefault());
  document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
  if(document.fonts&&document.fonts.load){
    const sample="あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉっゃゅょー！？…「」0123456789+％★km";
    ["900 20px 'M PLUS Rounded 1c'","400 20px 'Dela Gothic One'"].forEach(f=>{ try{ document.fonts.load(f,sample).catch(()=>{}); }catch(e){} });
  }
  load();
  resize();
  wireUI();
  refreshTitle();
  UI.renderToggles();
  loadBg("bg_title"); loadBg("bg_menu"); loadBg("bg_s1");
  ["hero_title","cutin","hero_win"].concat(Object.keys(POSE_META)).forEach(uiImg);
  const warn=$("#storageWarn");
  if(STORAGE_MODE!=="local"){ warn.hidden=false;
    warn.textContent=STORAGE_MODE==="session"?"⚠️ この まま だ と、とじる と きろく が きえる ことが あります。せってい の「かきだす」で ほぞん してね。"
      :"⚠️ この ブラウザ では きろく が ほぞん されません。"; }
  show("title");
  requestAnimationFrame(frame);
})();
