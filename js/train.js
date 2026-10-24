"use strict";
/* ==========================================================
   とっくん（すぶり ＝ れんだ ／ はしりこみ ＝ じゃんぷ）
   ========================================================== */
const Train=(()=>{
  let T=null;
  const fx=new FXList();
  let menuStage=null;

  function mult(){ return 1+Math.floor(S.cleared/4); }
  function start(kind){
    T={kind,t:-.8,dur:kind==="suburi"?4:5,taps:0,swings:0,done:false,
       h:{swing:0,swingType:0,step:0,air:0,trip:0,x:0},dummyHit:0,obs:[],nextObs:.35,cleared:0,dist:0,lastTap:-9,autoT:0,said:false};
    fx.clear();
    menuStage=menuStage||new StageView(0);
    UI.trainSetup(T);
    show("train");
    Music.play("train");
  }
  function tap(){
    if(!T||T.done)return;
    if(T.t<0){ return; }
    if(T.kind==="suburi"){
      if(T.t-T.lastTap<.075)return;
      T.lastTap=T.t; T.taps++; swing(true);
    }else{
      if(T.h.air>0||T.h.trip>0)return;
      T.h.air=.62; T.taps++; sfx.jump(); Burst.dust(fx,View.W*.3,View.GY,1,6);
    }
  }
  function swing(byTap){
    const h=T.h, W=View.W, GY=View.GY, hx=W*.42, dx=hx+118;
    h.swing=1; h.swingType=h.step%3; h.step++; T.swings++;
    T.dummyHit=1; sfx.swing(h.swingType===1);
    setTimeout(()=>sfx.hit(false),20);
    const sd=SWORDS[swordRank(S.atk)];
    fx.add({k:"slash",x:hx+62,y:GY-72,face:1,sc:1.1,life:.26,a0:[-1.25,1.05,-.35][h.swingType],a1:[.9,-1,.35][h.swingType],col:sd.edge,glow:sd.glow||"#ffe27a"});
    Burst.hit(fx,dx-8,GY-80,sd.glow||"#ffe27a",false);
    if(byTap){
      if(T.taps%5===0)onoma(fx,dx+rnd(-20,30),GY-170,pick(HIT_WORDS),{size:36});
      UI.trainCount(T.taps,T.kind);
      if(T.taps===15){ onoma(fx,W/2,GY-260,"ぼーなす！",{size:56,layer:"ui",grad:["#fff","#ff8fb1"],rot:0}); sfx.ready(); }
    }
  }
  function skip(){
    if(!T||T.done)return;
    T.skipped=true; finish();
  }
  function finish(){
    if(T.done)return;
    T.done=true;
    const m=mult(), bonus=!T.skipped&&(T.kind==="suburi"?T.taps>=15:T.cleared>=3);
    const gain=(T.kind==="suburi"?1:3)*m*(bonus?2:1);
    const before=swordRank(S.atk);
    if(T.kind==="suburi"){ S.atk+=gain; S.swings=(S.swings||0)+1; }
    else { S.maxHp+=gain; S.runs=(S.runs||0)+1; }
    const after=swordRank(S.atk);
    const evolved=after>S.rank; if(evolved)S.rank=after;
    save();
    sfx.buy();
    Burst.confetti(fx,View.W,40);
    UI.trainResult({kind:T.kind,gain,bonus,mult:m,taps:T.taps,cleared:T.cleared,evolved:evolved?after:-1,before});
  }

  function update(dt){
    if(!T)return;
    const W=View.W,GY=View.GY,h=T.h;
    menuStage.update(dt,W,View.H,GY);
    fx.update(dt);
    h.swing=Math.max(0,h.swing-dt*4.5);
    T.dummyHit=Math.max(0,T.dummyHit-dt*2.4);
    if(T.done){ return; }
    const prevT=T.t; T.t+=dt;
    if(prevT<-.4&&T.t>=-.4){ onoma(fx,W/2,GY-230,"よーい…",{size:54,layer:"ui",rot:0,rise:0,life:.5}); }
    if(prevT<0&&T.t>=0){ onoma(fx,W/2,GY-230,"はじめ！",{size:70,layer:"ui",rot:0,rise:0,life:.7}); sfx.go(); }
    if(T.t<0)return;
    UI.trainBar(Math.min(1,T.t/T.dur));
    if(T.kind==="suburi"){
      /* たっぷ が ない とき は じぶん で ゆっくり ふる */
      if(T.t-T.lastTap>.9){ T.autoT-=dt; if(T.autoT<=0){ T.autoT=.5; swing(false); } }
      if(T.t>1.2&&!T.said&&T.taps<3){ T.said=true; UI.trainHint(); }
    }else{
      const speed=520;
      T.dist+=speed*dt;
      const wasAir=h.air>0; h.air=Math.max(0,h.air-dt); h.trip=Math.max(0,h.trip-dt);
      if(wasAir&&h.air<=0){ sfx.land(); Burst.dust(fx,W*.3,GY,1,4); }
      T.nextObs-=dt;
      if(T.nextObs<=0&&T.t<T.dur-.9){ T.nextObs=rnd(.95,1.3); T.obs.push({x:W+40,kind:pick(["rock","log","hurdle"]),hit:false,passed:false}); }
      const hx=W*.3;
      for(const o of T.obs){
        o.x-=speed*dt;
        if(!o.hit&&!o.passed&&Math.abs(o.x-hx)<26){
          if(h.air>.08){ o.passed=true; T.cleared++; onoma(fx,hx+30,GY-190,T.cleared>=3?"ないす！":"じゃんぷ！",{size:36});
            sfx.coin(T.cleared); fx.add({k:"star",x:hx,y:GY-150,r:14,col:"#ffd23f",life:.5,pop:true});
            if(T.cleared===3){ onoma(fx,W/2,GY-260,"ぼーなす！",{size:56,layer:"ui",grad:["#fff","#ff8fb1"],rot:0}); sfx.ready(); }
            UI.trainCount(T.cleared,T.kind); }
          else { o.hit=true; h.trip=.45; sfx.bonk(); onoma(fx,hx,GY-170,"おっとっと！",{size:32,grad:["#fff","#7ec8f2"]}); }
        }
      }
      T.obs=T.obs.filter(o=>o.x>-60);
      if(Math.random()<dt*10)Burst.dust(fx,hx-16,GY,1,1);
    }
    if(T.t>=T.dur)finish();
  }

  function draw(c){
    if(!T)return;
    const W=View.W,H=View.H,GY=View.GY,t=Math.max(0,T.t)+(T.done?0:0),h=T.h;
    const now=performance.now()/1000;
    const rank=swordRank(S.atk);
    if(T.kind==="suburi"){
      if(!drawBgImage(c,"bg_menu",W,H,GY))drawBgFallback(c,STAGES[0],W,H,GY,now);
      c.fillStyle="rgba(255,248,234,.08)"; c.fillRect(0,0,W,H);
      fx.draw(c,"back");
      drawDummy(c,W*.42+118,GY,now,T.dummyHit);
      drawHeroAny(c,W*.42,GY,{t:now,state:h.swing>0?"atk":T.done?"cheer":"idle",swing:h.swing,swingType:h.swingType,sc:1.45,rank,face:1,blink:(now%3.4)>3.28});
    }else{
      if(!drawBgImage(c,"bg_s1",W,H,GY))drawBgFallback(c,STAGES[0],W,H,GY,now);
      /* はしる かんじ（てまえ の くさ・はな・くい） */
      const off=T.dist;
      c.save();
      for(let i=0;i<14;i++){
        const x=((i*173-off*1.0)%(W+240)+W+240)%(W+240)-120;
        const y=GY+22+(i%3)*18;
        if(i%4===0){ rr(c,x-4,y-46,8,46,3); fs(c,"#b07a44",3); rr(c,x-18,y-40,36,6,3); fs(c,"#c98f55",2.6); }
        else { c.fillStyle=i%2?"#5fbf52":"#7fd068"; c.beginPath(); c.moveTo(x-12,y); c.quadraticCurveTo(x-8,y-22,x-2,y-4); c.quadraticCurveTo(x+2,y-26,x+6,y-3); c.quadraticCurveTo(x+12,y-18,x+14,y); c.closePath(); c.fill();
          if(i%3===0){ c.fillStyle="#fff"; circle(c,x+2,y-24,4); c.fill(); c.fillStyle="#ffd23f"; circle(c,x+2,y-24,1.8); c.fill(); } }
      }
      c.globalAlpha=.35; c.strokeStyle="#fff"; c.lineWidth=3; c.lineCap="round";
      for(let i=0;i<8;i++){ const y=60+i*38, x=((i*231-off*1.6)%(W+300)+W+300)%(W+300)-150; c.beginPath(); c.moveTo(x,y); c.lineTo(x+90+(i%3)*30,y); c.stroke(); }
      c.restore();
      fx.draw(c,"back");
      for(const o of T.obs)drawObstacle(c,o,GY);
      const hx=W*.3, jumpH=h.air>0?Math.sin((1-h.air/.62)*Math.PI)*130:0;
      drawHeroAny(c,hx,GY,{t:now,state:h.trip>0?"hurt":jumpH>0?"jump":T.done?"cheer":"run",sc:1.45,rank,face:1,jump:jumpH,blink:(now%3.4)>3.28});
      c.save(); c.font="900 30px "+FONT_R; c.textAlign="right"; c.lineWidth=8; c.strokeStyle=OL; c.lineJoin="round";
      const km=(T.dist/1000*1.8).toFixed(1)+" km"; c.strokeText(km,W-24,90); c.fillStyle="#fff"; c.fillText(km,W-24,90); c.restore();
    }
    fx.draw(c,"front");
    fx.draw(c,"ui");
  }
  function drawObstacle(c,o,GY){
    c.save(); c.translate(o.x,GY);
    if(o.hit)c.rotate(-.5);
    if(o.kind==="rock"){ c.beginPath(); c.moveTo(-26,0); c.quadraticCurveTo(-24,-34,0,-38); c.quadraticCurveTo(26,-34,28,0); c.closePath(); cel(c,()=>{ c.beginPath(); c.moveTo(-26,0); c.quadraticCurveTo(-24,-34,0,-38); c.quadraticCurveTo(26,-34,28,0); c.closePath(); },"#b7b2c4","#8a84a0",-3,3); }
    else if(o.kind==="log"){ cel(c,()=>rr(c,-34,-26,68,26,13),"#b8814a","#8a5a2b",-2,3); ell(c,26,-13,9,12); fs(c,"#e7c08a",3); ell(c,26,-13,4,6); c.strokeStyle="#b8814a"; c.lineWidth=2; c.stroke(); }
    else { rr(c,-24,-40,6,40,3); fs(c,"#ff6b6b",3); rr(c,18,-40,6,40,3); fs(c,"#ff6b6b",3); rr(c,-28,-44,56,10,4); fs(c,"#fff8ea",3); }
    c.restore();
  }
  function end(){ T=null; fx.clear(); }
  return {start,tap,skip,update,draw,end,get T(){return T;},mult};
})();
