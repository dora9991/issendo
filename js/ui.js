"use strict";
/* ==========================================================
   がめん（DOM）
   ========================================================== */
const SCREENS=["title","menu","pick","shop","zukan","train","battle"];
let CUR="title";
function show(id){
  SCREENS.forEach(s=>$("#"+s).classList.toggle("on",s===id));
  const prev=CUR; CUR=id;
  if(prev==="battle"&&id!=="battle")Battle.end();
  if(prev==="train"&&id!=="train")Train.end();
  clearHints();
}
/* ぴゅっと きりかえ */
let _wiping=false;
function go(id,fn){
  if(_wiping)return;
  _wiping=true;
  const w=$("#wipe"); w.classList.remove("go"); void w.offsetWidth; w.classList.add("go"); w.style.pointerEvents="auto";
  sfx.whoosh();
  setTimeout(()=>{ if(fn)fn(); else show(id); },290);
  setTimeout(()=>{ w.classList.remove("go"); w.style.pointerEvents="none"; _wiping=false; },640);
}
function songFor(id){ return id==="title"?"title":id==="train"?"train":id==="battle"?null:"menu"; }
function toast(msg,ms){
  const el=$("#toast"); el.textContent=msg; el.classList.add("on");
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove("on"),ms||1800);
}
function openVeil(id){ $("#"+id).classList.add("on"); }
function closeVeil(id){ $("#"+id).classList.remove("on"); }

/* ---------- ヒント（はじめて の とき） ---------- */
const _hints={};
function hint(el,text,key){
  if(!el)return;
  const r=el.getBoundingClientRect(); if(!r.width)return;
  const h=document.createElement("div"); h.className="hint"; h.textContent=text;
  const cx=r.left+r.width/2;
  h.style.left=cx+"px"; h.style.top=(r.top-10)+"px";
  $("#hints").appendChild(h);
  const hr=h.getBoundingClientRect(), pad=8;
  let dx=0;
  if(hr.right>innerWidth-pad)dx=innerWidth-pad-hr.right;
  if(hr.left+dx<pad)dx=pad-hr.left;
  if(dx){ h.style.left=(cx+dx)+"px"; h.style.setProperty("--ax",(-dx)+"px"); }
  (_hints[key]=_hints[key]||[]).push(h);
}
function clearHints(key){
  const ks=key?[key]:Object.keys(_hints);
  ks.forEach(k=>{ (_hints[k]||[]).forEach(h=>h.remove()); delete _hints[k]; });
}

/* ==========================================================
   UI
   ========================================================== */
const UI={
  /* ---------------- メニュー ---------------- */
  renderMenu(bumpKey){
    $("#sHp").textContent=S.maxHp; $("#sAtk").textContent=S.atk;
    $("#sGold").textContent=S.gold; $("#sClear").textContent=S.cleared+"/"+ENEMIES.length;
    if(bumpKey){ const el=$(bumpKey); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    const m=Train.mult();
    $("#dSuburi").textContent="こうげき ＋"+m+"〜"+m*2;
    $("#dHashiri").textContent="たいりょく ＋"+3*m+"〜"+6*m;
    const r=swordRank(S.atk);
    $("#swordTag").textContent="⚔️ "+SWORDS[r].name+(r<SWORDS.length-1?"（こうげき "+SWORDS[r+1].min+" で しんか）":"（さいきょう！）");
    const zn=Object.keys(S.zukan).length;
    $("#dZukan").textContent=zn+"/"+ENEMIES.length+" たい";
    const canBuy=SKILLS.some(s=>!has(s.id)&&(!s.req||has(s.req))&&S.gold>=s.cost);
    $("#shopDot").hidden=!canBuy; $("#shopDot").textContent="かえる！";
    const next=ENEMIES[Math.min(S.cleared,ENEMIES.length-1)];
    const ch=chanceOf(next);
    $("#dFight").textContent=S.cleared>=ENEMIES.length?"ぜんぶ たおした！ また たたかえる":"つぎ："+next.n+"　"+ch.f+" "+ch.t;
    let talk;
    if(S.cleared>=ENEMIES.length)talk="ぜんぶ たおした！ きみ は さいきょう の けんし だ！";
    else if(S.cleared===0&&S.atk<=9)talk="まずは「すぶり」で つよく なろう！";
    else if(canBuy)talk="おかね が たまった！「わざ」を おぼえよう！";
    else if(ch.k==="no")talk="つぎ の てき は すごく つよい… とっくん だ！";
    else if(ch.k==="hard")talk="もう すこし とっくん すると あんしん！";
    else talk=pick(["いま なら かてそう！ たたかおう！","けん が うずうず してる！","つぎ の てき へ いこう！"]);
    $("#heroTalk").textContent=talk;
    $("#heroTalk").style.animation="none"; void $("#heroTalk").offsetWidth; $("#heroTalk").style.animation="";
  },

  /* ---------------- てき を えらぶ ---------------- */
  pickStage:0,
  renderPick(){
    const open=Math.min(ENEMIES.length,S.cleared+1);
    const openStage=Math.floor((open-1)/4);
    if(UI.pickStage>openStage)UI.pickStage=openStage;
    $("#stageTabs").innerHTML=STAGES.map((st,i)=>{
      const lock=i>openStage;
      let got=0; for(let k=0;k<4;k++){ const z=S.zukan[i*4+k]; if(z)got+=z.s; }
      const clear=S.cleared>=(i+1)*4;
      return '<button class="tab'+(i===UI.pickStage?" on":"")+(lock?" lock":"")+(clear?" clr":"")+'" data-st="'+i+'"><span class="n">すてーじ '+(i+1)+(lock?"":"　★"+got+"/12")+'</span>'+(lock?"🔒 ？？？":(clear?"👑 ":"")+esc(st.name))+'</button>';
    }).join("");
    $$("#stageTabs .tab").forEach(b=>b.onclick=()=>{
      const i=+b.dataset.st; if(i>openStage){ sfx.bonk(); toast("まえ の ぼす を たおす と ひらく よ"); return; }
      sfx.tap(); UI.pickStage=i; UI.renderPick();
    });
    const cards=[];
    for(let k=0;k<4;k++){
      const i=UI.pickStage*4+k, e=ENEMIES[i]; if(!e)continue;
      const lock=i>=open, z=S.zukan[i], stars=z?z.s:0;
      const ch=chanceOf(e);
      cards.push('<div class="ecard'+(lock?" lock":"")+(e.boss?" boss":"")+(!lock&&!z?" new":"")+'" data-i="'+i+'">'+
        (e.boss?'<span class="crown">👑 ぼす</span>':'')+
        (z?'<span class="st">'+"★".repeat(stars)+"☆".repeat(3-stars)+'</span>':'')+
        '<div class="ei"><img src="'+enemyThumb(e)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">'+(lock?'<span class="q">？</span>':'')+'</div>'+
        (z?'<span class="stamp">たおした</span>':'')+
        '<div class="en">'+(lock?"？？？":esc(e.n))+'</div>'+
        '<div class="em num">'+(lock?"まだ あえない":"たいりょく "+e.hp+" ／ こうげき "+e.atk)+'</div>'+
        (lock?'':'<div class="chance '+ch.k+'">'+ch.f+" "+ch.t+'</div>')+
      '</div>');
    }
    $("#enemyCards").innerHTML=cards.join("");
    $$("#enemyCards .ecard").forEach(el=>el.onclick=()=>{
      const i=+el.dataset.i;
      if(i>=open){ sfx.bonk(); toast("まえ の てき を たおす と あえる よ"); return; }
      sfx.tap(); UI.startBattle(i);
    });
  },
  startBattle(i){ go("battle",()=>{ closeVeil("veilRes"); Battle.start(i); }); },

  /* ---------------- わざ ---------------- */
  renderShop(){
    $("#shopGold").textContent="💰 "+S.gold;
    $("#shopList").innerHTML=SKILLS.map(s=>{
      const owned=has(s.id), need=s.req&&!has(s.req), poor=S.gold<s.cost;
      let cls,foot;
      if(owned){ cls="owned"; foot='<span class="pill have">✔ もっている</span>'; }
      else if(need){ cls="no"; foot='<span class="pill grey">🔒 さきに「'+esc(SK[s.req].name)+'」</span>'; }
      else if(poor){ cls="no"; foot='<span class="pill grey">💰 '+s.cost+' えん（あと '+(s.cost-S.gold)+'）</span>'; }
      else { cls="can"; foot='<button class="buyBtn" data-buy="'+s.id+'">かう！ '+s.cost+' えん</button>'; }
      return '<div class="skc '+cls+'" id="skc_'+s.id+'"><span class="si">'+s.icon+'</span><div class="sn">'+esc(s.name)+'</div><div class="sd">'+esc(s.desc)+(s.cat==="passive"?"（いつも）":"")+'</div><div class="sb">'+foot+'</div></div>';
    }).join("");
    $$("#shopList [data-buy]").forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      const s=SK[b.dataset.buy]; if(!s||has(s.id)||S.gold<s.cost)return;
      S.gold-=s.cost; S.skills.push(s.id); save(); sfx.buy();
      UI.renderShop();
      const card=$("#skc_"+s.id); if(card){ card.classList.add("just"); }
      toast("「"+s.name+"」を おぼえた！");
    });
  },

  /* ---------------- ずかん ---------------- */
  renderZukan(){
    const n=Object.keys(S.zukan).length;
    $("#zukanCount").textContent="📖 "+n+"/"+ENEMIES.length;
    $("#zukanGrid").innerHTML=ENEMIES.map((e,i)=>{
      const z=S.zukan[i];
      return '<div class="zc'+(z?"":" lock")+(e.boss?" boss":"")+'" data-i="'+i+'"><div class="zi"><img src="'+enemyThumb(e)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"></div>'+
        '<div class="zn">'+(z?esc(e.n):"No."+(i+1)+" ？？？")+'</div><div class="zs">'+(z?"★".repeat(z.s)+"☆".repeat(3-z.s):"")+'</div></div>';
    }).join("");
    $$("#zukanGrid .zc").forEach(el=>el.onclick=()=>{
      const i=+el.dataset.i, z=S.zukan[i], e=ENEMIES[i];
      if(!z){ sfx.bonk(); toast("まだ たおして いない てき だよ"); return; }
      sfx.tap();
      $("#zImg").src=enemyThumb(e); $("#zNo").textContent="No."+(i+1)+(e.boss?"　👑 ぼす":"")+"　すてーじ "+(e.stage+1);
      $("#zName").textContent=e.n; $("#zStars").textContent="★".repeat(z.s)+"☆".repeat(3-z.s);
      $("#zDesc").textContent=e.desc;
      $("#zStat").textContent="たいりょく "+e.hp+" ／ こうげき "+e.atk+" ／ たおした かず "+z.w+" かい";
      openVeil("veilZ");
    });
  },

  /* ---------------- せってい ---------------- */
  renderToggles(){
    const items=[["bgm","🎵 おんがく"],["se","🔔 こうかおん"],["voice","🗣️ こえ"]];
    $$(".toggles").forEach(box=>{
      box.innerHTML=items.map(([k,l])=>'<button class="tgl '+(S[k]?"on":"off")+'" data-tgl="'+k+'">'+l+'</button>').join("");
      box.querySelectorAll("[data-tgl]").forEach(b=>b.onclick=()=>{
        const k=b.dataset.tgl; S[k]=!S[k]; save(); setVolumes(); UI.renderToggles();
        if(k==="se"&&S.se)sfx.tap();
        if(k==="voice"&&S.voice)Voice.say("こえ おん！");
        if(k==="bgm"){ if(S.bgm){ const sg=songFor(CUR); if(sg)Music.play(sg); else Music.resume(); } }
      });
    });
    $("#btnRestore").hidden=!Store.get(BAK_KEY);
  },

  /* ---------------- バトル HUD ---------------- */
  _hud:{},
  battleSetup(B){
    const e=B.e;
    $("#eName").textContent=(e.boss?"👑 ":"")+e.n;
    $("#foeImg").src=enemyThumb(e);
    $(".hp.foe").classList.toggle("boss",!!e.boss);
    const fc=$("#meFaceCv"), g=fc.getContext("2d");
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,96,96); g.fillStyle="#bfe6ff"; g.fillRect(0,0,96,96);
    const ci=uiImg("hero_win");
    if(ci.ok){ const im=ci.img, h=250, w=h*im.naturalWidth/im.naturalHeight; g.drawImage(im,48-w*.555,52-h*.40,w,h); }
    else drawHeroBust(g,48,58,1.02,{expr:"normal"});
    $("#pFill").style.width=$("#pChip").style.width="100%";
    $("#eFill").style.width=$("#eChip").style.width="100%";
    $("#pFill").className="fill p";
    $("#combo").className=""; $("#toast").classList.remove("on");
    $("#introName").className="introName"; $("#introName").innerHTML="";
    UI._hud={php:-1,ehp:-1,g:-1,cds:{}};
    const L=activeSkills();
    $("#skillBar").innerHTML=L.map((s,i)=>'<button class="sk" data-sk="'+s.id+'"><span class="key">'+(i+1)+'</span><span class="i">'+s.icon+'</span><span class="n">'+esc(s.name)+'</span><span class="cd" id="cd_'+s.id+'"></span><span class="cs" id="cs_'+s.id+'"></span></button>').join("");
    $$("#skillBar [data-sk]").forEach(b=>b.addEventListener("pointerdown",ev=>{ ev.preventDefault(); Battle.useSkill(SK[b.dataset.sk]); }));
    $("#btnUlt").classList.remove("ready"); $("#ultFill").style.height="0%";
    UI.cine(true);
  },
  battleHud(B){
    const p=B.p,en=B.en,h=UI._hud;
    if(h.php!==p.hp){ h.php=p.hp; const k=p.hp/p.max*100;
      $("#pFill").style.width=k+"%"; $("#pChip").style.width=k+"%";
      $("#pHpTxt").textContent=p.hp+"/"+p.max;
      $("#pFill").className="fill p"+(k<25?" low":k<50?" mid":""); }
    if(h.ehp!==en.hp){ h.ehp=en.hp; const k=en.hp/en.max*100;
      $("#eFill").style.width=k+"%"; $("#eChip").style.width=k+"%"; $("#eHpTxt").textContent=en.hp+"/"+en.max; }
    const g=Math.floor(p.gauge);
    if(h.g!==g){ h.g=g; $("#ultFill").style.height=g+"%"; $("#btnUlt").classList.toggle("ready",g>=100); }
    for(const s of activeSkills()){
      const left=B.cds[s.id]||0, k=Math.round(left/s.cd*100);
      if(h.cds[s.id]!==k){ h.cds[s.id]=k;
        const cd=document.getElementById("cd_"+s.id), cs=document.getElementById("cs_"+s.id);
        if(cd)cd.style.transform="scaleY("+(k/100)+")";
        if(cs)cs.textContent=left>0.95?Math.ceil(left):""; }
    }
  },
  introName(e){
    const el=$("#introName");
    el.innerHTML=(e.boss?'<span class="boss">★ ぼす ★</span>':'')+'<div class="b">'+esc(e.n)+'</div><br><div class="l">「'+esc(e.line)+'」</div>';
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  },
  introDone(){ const el=$("#introName"); setTimeout(()=>{ if(Battle.B&&Battle.B.phase!=="intro")el.classList.remove("on"); },700); },
  cine(on){ $("#battle").classList.toggle("cine",!!on); if(on)clearHints(); },
  combo(n){
    const el=$("#combo");
    if(n<2){ el.classList.remove("on"); return; }
    el.innerHTML=n+'<small> れんげき！</small>';
    el.className="on"+(n>=20?" fire":n>=10?" hot":"");
    void el.offsetWidth; el.classList.add("pop");
    if(n%5===0)sfx.combo(n);
  },
  ultReady(){
    if(!S.tut.ult)setTimeout(()=>{ if(Battle.B&&Battle.ultReady())hint($("#btnUlt"),"ひっさつ を おして！","ult"); },200);
  },
  tutorial(){
    if(!S.tut.move){ hint($("#padR"),"▶ で すすもう","move"); }
    if(!S.tut.atk){ setTimeout(()=>{ if(CUR==="battle"&&!S.tut.atk)hint($("#padA"),"きる！ で こうげき","atk"); },S.tut.move?0:1400); }
  },
  hintDone(k){ if(!S.tut[k]){ S.tut[k]=1; clearHints(k); } },

  /* ---------------- けっか ---------------- */
  result(r){
    const v=$("#veilRes"), title=$("#resTitle"), stars=$$("#resStars span"), body=$("#resBody"), gold=$("#resGold"), badges=$("#resBadges");
    $("#resImg").src=r.win?"img/ui/hero_win.webp":enemyThumb(r.e); $("#resImg").className="resImg"+(r.win?" hero":"");
    stars.forEach(s=>s.className="");
    badges.innerHTML="";
    const next=r.idx+1<ENEMIES.length&&r.idx+1<=S.cleared;
    $("#btnNext").hidden=!(r.win&&next);
    $("#btnAgain").textContent=r.win?"もういちど":"もういちど たたかう";
    $("#btnBack").textContent=r.win?"メニュー":"とっくん する";
    if(r.win){
      title.textContent="かった！"; title.className="win";
      $("#resStars").hidden=false;
      body.innerHTML=esc(r.e.n)+" を やっつけた！";
      gold.textContent="+0 えん";
      const bs=[];
      if(r.first)bs.push(["ずかん に のった！","gold"]);
      if(r.newBest&&!r.first)bs.push(["ほし の きろく こうしん！","gold"]);
      if(r.combo>=5)bs.push(["さいだい "+r.combo+" れんげき",""]);
      if(r.ults>0)bs.push(["ひっさつ "+r.ults+" かい",""]);
      if(r.first&&r.idx+1<ENEMIES.length)bs.push([(ENEMIES[r.idx+1].boss?"👑 ぼす":"つぎ の てき")+" が あらわれた！",""]);
      if(r.first&&r.idx===ENEMIES.length-1)bs.push(["🎉 ぜんぶ クリア！ おめでとう！","gold"]);
      if(r.first&&(r.idx+1)%4===0&&r.idx+1<ENEMIES.length)bs.push(["あたらしい すてーじ が ひらいた！","gold"]);
      openVeil("veilRes");
      for(let i=0;i<3;i++)setTimeout(()=>{ if(i<r.stars){ stars[i].className="got"; sfx.star(i); } },350+i*330);
      const t0=performance.now()+1300, dur=900;
      const tick=()=>{ const k=clamp((performance.now()-t0)/dur,0,1);
        if(k>0){ gold.textContent="+"+Math.round(r.gain*Ease.outCubic(k))+" えん"; if(Math.random()<.5)sfx.tick(); }
        if(k<1&&v.classList.contains("on"))requestAnimationFrame(tick); else { gold.textContent="+"+r.gain+" えん"; if(k>=1)sfx.coin(5);
          badges.innerHTML=bs.map((b,i)=>'<span class="badge '+b[1]+'" style="animation-delay:'+(i*.12)+'s">'+esc(b[0])+'</span>').join(""); } };
      requestAnimationFrame(tick);
    }else{
      title.textContent="まけた…"; title.className="lose";
      $("#resStars").hidden=true;
      const e=r.e, ratio=powerRatio(e);
      let tip;
      if(S.atk*1.6<e.atk*1.2&&S.maxHp<e.atk*6)tip="たいりょく が たりない かも。「はしりこみ」を しよう！";
      else if(ratio<.6)tip="まだ ちょっと はやい かも。とっくん して つよく なろう！";
      else tip=pick(["あと すこし！ ひっさつ を つかう と かてる かも！","てき の「！」を みたら、さがって よけよう！","わざ を おぼえる と らく に なる よ！"]);
      body.innerHTML=esc(e.n)+" に やられた…<br><span class='tiny'>"+esc(tip)+"</span>";
      gold.textContent="";
      if(r.enemyLeft<.25)badges.innerHTML='<span class="badge">あと すこし だった！（のこり '+Math.max(1,Math.round(r.enemyLeft*100))+'％）</span>';
      openVeil("veilRes");
    }
  },
  pauseOpen(){ UI.renderToggles(); openVeil("veilPause"); },
  /* まいにち の ごほうび */
  daily(){
    const d=new Date(), today=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
    if(S.lastDay===today)return;
    const brandNew=!S.lastDay&&S.cleared===0&&!S.wins;
    S.lastDay=today;
    const g=brandNew?0:50+25*S.cleared;
    if(!g){ save(); return; }
    S.gold+=g; save();
    $("#dailyGold").textContent="+"+g+" えん";
    setTimeout(()=>{ openVeil("veilDaily"); sfx.ready(); },500);
    $("#dailyOk").onclick=()=>{ sfx.buy(); closeVeil("veilDaily"); UI.renderMenu("#sGold"); };
  },
  ending(then){
    $("#endImg").src="img/ui/hero_win.webp";
    openVeil("veilEnd"); Music.jingle("evolve",()=>Music.play("title")); Voice.say("やったー！ ぜんぶ クリア！");
    $("#endOk").onclick=()=>{ sfx.tap(); closeVeil("veilEnd"); if(then)then(); };
  },

  /* ---------------- とっくん HUD ---------------- */
  trainSetup(T){
    $("#trainTitle").textContent=T.kind==="suburi"?"🗡️ すぶり":"👟 はしりこみ";
    $("#trainCount").textContent="0";
    $("#tbarFill").style.width="0%";
    $("#trainHelp").textContent=T.kind==="suburi"?"がめん を たくさん たっぷ！ 15かい で ぼーなす":"たっぷ で じゃんぷ！ 3かい とべたら ぼーなす";
    $("#trainHelp").classList.remove("shake");
    $("#trainRes").hidden=true; $("#btnSkip").hidden=false; $("#trainHelp").hidden=false;
  },
  trainBar(k){ $("#tbarFill").style.width=(k*100)+"%"; },
  trainCount(n){ const el=$("#trainCount"); el.textContent=n; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); },
  trainHint(){ const el=$("#trainHelp"); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); },
  trainResult(r){
    $("#btnSkip").hidden=true;
    $("#trainGain").textContent=(r.kind==="suburi"?"こうげき ＋":"たいりょく ＋")+r.gain+"！";
    let b="";
    if(r.bonus)b+="🎉 "+(r.kind==="suburi"?"れんだ":"じゃんぷ")+" ぼーなす ×2！ ";
    if(r.mult>1)b+="⭐ たおした てき の ぶん ×"+r.mult;
    if(!b)b=r.kind==="suburi"?"たっぷ 15かい で ぼーなす だよ！":"3かい じゃんぷ で ぼーなす だよ！";
    $("#trainBonus").textContent=b;
    $("#trainRes").hidden=false; $("#trainHelp").hidden=true;
    UI._bump=r.kind==="suburi"?"#sAtk":"#sHp";
    if(r.evolved>=0)setTimeout(()=>UI.evolve(r.evolved),650);
  },
  /* ---------------- けん が しんか ---------------- */
  evolve(rank){
    const sd=SWORDS[rank];
    $("#evoName").textContent=sd.name;
    $("#evoUlt").textContent="ひっさつ わざ が「"+sd.ult+"」に なった！";
    openVeil("veilEvolve");
    Music.jingle("evolve",()=>{ const sg=songFor(CUR); if(sg)Music.play(sg); });
    Voice.say(sd.name+"！");
    const cv=$("#evoCv"), g=cv.getContext("2d"), t0=performance.now();
    const loop=()=>{
      if(!$("#veilEvolve").classList.contains("on"))return;
      const t=(performance.now()-t0)/1000;
      g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,520,200);
      g.save(); g.translate(260,100); g.rotate(-Math.PI/2*0);
      g.globalCompositeOperation="lighter";
      for(let i=0;i<12;i++){ g.save(); g.rotate(i*TAU/12+t*.6); g.fillStyle="rgba(255,240,170,.18)"; g.beginPath(); g.moveTo(0,0); g.lineTo(300,-22); g.lineTo(300,22); g.closePath(); g.fill(); g.restore(); }
      g.restore();
      g.save(); g.translate(260-3.2*38,100); const k=Math.min(1,t*2); g.scale(3.2*Ease.outBack(k),3.2*Ease.outBack(k)); drawSword(g,rank,72,t); g.restore();
      for(let i=0;i<6;i++){ const a=t*2+i; g.save(); g.fillStyle="#fff"; star(g,260+Math.cos(a)*200,100+Math.sin(a*1.3)*70,6+3*Math.sin(t*6+i),4,.3,t); g.fill(); g.restore(); }
      requestAnimationFrame(loop);
    };
    loop();
  },
};

/* ---------------- ながおし かくにん ---------------- */
function confirmHold(title,body,onYes){
  $("#cfTitle").textContent=title; $("#cfBody").textContent=body;
  const btn=$("#cfYes"), fill=btn.querySelector(".holdFill");
  let t0=0, raf=0;
  const reset=()=>{ cancelAnimationFrame(raf); t0=0; fill.style.width="0"; };
  const stepH=()=>{ const k=(performance.now()-t0)/1300; fill.style.width=Math.min(100,k*100)+"%";
    if(k>=1){ reset(); closeVeil("veilConfirm"); onYes(); return; } raf=requestAnimationFrame(stepH); };
  btn.onpointerdown=e=>{ e.preventDefault(); t0=performance.now(); stepH(); };
  btn.onpointerup=btn.onpointerleave=btn.onpointercancel=()=>{ if(t0)reset(); };
  $("#cfNo").onclick=()=>{ sfx.back(); reset(); closeVeil("veilConfirm"); };
  reset(); openVeil("veilConfirm");
}

/* ==========================================================
   ボタン の しかけ
   ========================================================== */
function wireUI(){
  /* タイトル */
  $("#title").addEventListener("pointerup",e=>{
    if(!$("#titleBtns").hidden)return;
    $("#tapStart").hidden=true; $("#titleBtns").hidden=false;
    sfx.go(); Music.play("title"); refreshTitle();
  });
  $("#btnContinue").onclick=()=>{ sfx.tap(); if(load()){ syncAfterLoad(); go("menu",()=>{ show("menu"); UI.renderMenu(); Music.play("menu"); UI.daily(); }); } };
  $("#btnStart").onclick=()=>{
    sfx.tap();
    const begin=()=>{ const old=Store.get(SAVE_KEY); if(old)Store.set(BAK_KEY,old);
      S=fresh(); UI.daily(); save(); syncAfterLoad();
      go("menu",()=>{ show("menu"); UI.renderMenu(); Music.play("menu"); setTimeout(()=>{ toast("めいおう の しろ まで、てき を ぜんぶ たおせ！",3200); Voice.say("いくぞ！"); },500); }); };
    if(Store.get(SAVE_KEY))confirmHold("はじめ から に する？","いま の きろく は けえて、さいしょ から に なります。（まえ の きろく は「せってい」で もどせます）",begin);
    else begin();
  };
  $("#rotSkip").onclick=()=>$("#rotate").classList.add("hide");
  $(".menuLeft").addEventListener("pointerdown",()=>{ Scene.heroTap(); const L=["えいっ！","やーっ！","まかせて！","つよく なる ぞ！","いっせん！"]; const w=pick(L); $("#heroTalk").textContent=w; Voice.say(w); });

  /* メニュー */
  $("#btnSuburi").onclick=()=>{ sfx.tap(); go("train",()=>Train.start("suburi")); };
  $("#btnHashiri").onclick=()=>{ sfx.tap(); go("train",()=>Train.start("hashiri")); };
  $("#btnShop").onclick=()=>{ sfx.tap(); go("shop",()=>{ show("shop"); UI.renderShop(); }); };
  $("#btnZukan").onclick=()=>{ sfx.tap(); go("zukan",()=>{ show("zukan"); UI.renderZukan(); }); };
  $("#btnFight").onclick=()=>{ sfx.tap(); UI.pickStage=Math.min(STAGES.length-1,Math.floor(Math.min(S.cleared,ENEMIES.length-1)/4)); go("pick",()=>{ show("pick"); UI.renderPick(); }); };
  $("#btnSettings").onclick=()=>{ sfx.tap(); UI.renderToggles(); $("#exportInfo").innerHTML="&nbsp;"; openVeil("veilSet"); };
  const backToMenu=(bump)=>{ sfx.back(); go("menu",()=>{ show("menu"); UI.renderMenu(typeof bump==="string"?bump:null); if(Music.cur!=="menu")Music.play("menu"); }); };
  $("#pickBack").onclick=()=>backToMenu(); $("#shopBack").onclick=()=>backToMenu(); $("#zukanBack").onclick=()=>backToMenu();
  $("#zClose").onclick=()=>{ sfx.back(); closeVeil("veilZ"); };
  $("#veilZ").onclick=e=>{ if(e.target.id==="veilZ")closeVeil("veilZ"); };

  /* せってい */
  $("#btnSetClose").onclick=()=>{ sfx.back(); closeVeil("veilSet"); };
  $("#btnToTitle").onclick=()=>{ sfx.back(); closeVeil("veilSet"); go("title",()=>{ show("title"); $("#tapStart").hidden=true; $("#titleBtns").hidden=false; refreshTitle(); Music.play("title"); }); };
  $("#btnExport").onclick=()=>{
    try{
      const blob=new Blob([JSON.stringify(S)],{type:"application/json"}), url=URL.createObjectURL(blob), a=document.createElement("a");
      a.href=url; a.download="issendo_save.json"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      $("#exportInfo").textContent="かきだした よ。ファイル は なくさない でね。";
    }catch(e){ $("#exportInfo").textContent="かきだし に しっぱい した。"; }
  };
  $("#btnImport").onclick=()=>$("#fileImport").click();
  $("#fileImport").onchange=ev=>{
    const f=ev.target.files&&ev.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=()=>{ try{ S=normalize(JSON.parse(r.result)); save(); syncAfterLoad(); UI.renderMenu(); UI.renderToggles();
      $("#exportInfo").textContent="よみこんだ よ！"; sfx.buy(); }catch(e){ $("#exportInfo").textContent="よみこみ に しっぱい。ファイル を たしかめて ね。"; } };
    r.readAsText(f); ev.target.value="";
  };
  $("#btnRestore").onclick=()=>{
    confirmHold("まえ の きろく に もどす？","いま の きろく と いれかえます。",()=>{
      const bak=Store.get(BAK_KEY), cur=Store.get(SAVE_KEY);
      try{ S=normalize(JSON.parse(bak)); if(cur)Store.set(BAK_KEY,cur); save(); syncAfterLoad(); UI.renderMenu(); UI.renderToggles(); toast("もどした よ！"); }catch(e){ toast("もどせ なかった…"); }
    });
  };

  /* とっくん */
  $("#train").addEventListener("pointerdown",e=>{ if(e.target.closest("button"))return; Train.tap(); });
  $("#btnSkip").onclick=e=>{ e.stopPropagation(); sfx.tap(); Train.skip(); };
  $("#btnTrainAgain").onclick=e=>{ e.stopPropagation(); sfx.tap(); const k=Train.T?Train.T.kind:"suburi"; Train.start(k); };
  $("#btnTrainBack").onclick=e=>{ e.stopPropagation(); backToMenu(UI._bump); };
  $("#evoOk").onclick=()=>{ sfx.tap(); closeVeil("veilEvolve"); };

  /* バトル */
  const hold=(el,k)=>{
    const on=e=>{ e.preventDefault(); try{el.setPointerCapture(e.pointerId);}catch(_){} Battle.setKey(k,true); el.classList.add("on"); };
    const off=e=>{ e.preventDefault(); Battle.setKey(k,false); el.classList.remove("on"); };
    el.addEventListener("pointerdown",on); el.addEventListener("pointerup",off); el.addEventListener("pointercancel",off); el.addEventListener("lostpointercapture",off);
  };
  hold($("#padL"),"l"); hold($("#padR"),"r");
  $("#padA").addEventListener("pointerdown",e=>{ e.preventDefault(); Battle.attack(); });
  $("#btnUlt").addEventListener("pointerdown",e=>{ e.preventDefault(); if(Battle.ultReady())Battle.useUlt(); else { sfx.bonk(); if(Battle.B&&Battle.B.phase==="fight")toast("てき を きる と たまる よ！",1100); } });
  $("#btnPause").onclick=()=>{ sfx.tap(); Battle.pause(); };
  $("#battle").addEventListener("pointerdown",e=>{ if(!e.target.closest("button"))Battle.skipIntro(); });
  $("#btnResume").onclick=()=>{ sfx.tap(); closeVeil("veilPause"); Battle.resume(); };
  $("#btnAgain").onclick=()=>{ sfx.tap(); const B=Battle.B; UI.startBattle(B?B.idx:0); };
  $("#btnNext").onclick=()=>{ sfx.tap(); const B=Battle.B; UI.startBattle(Math.min(ENEMIES.length-1,(B?B.idx:0)+1)); };
  $("#btnBack").onclick=()=>{ closeVeil("veilRes"); backToMenu(); };
  $("#btnRun").onclick=()=>{ sfx.back(); closeVeil("veilPause"); Battle.quit(); backToMenu(); };
}

function refreshTitle(){
  const raw=Store.get(SAVE_KEY);
  $("#btnContinue").hidden=!raw;
  $("#btnStart").className=raw?"gbtn sky":"gbtn big lemon";
  $("#btnStart").textContent=raw?"はじめ から":"はじめる ▶";
  try{
    const d=raw&&JSON.parse(raw);
    $("#saveInfo").textContent=d?("⚔️ "+d.atk+"　❤️ "+d.maxHp+"　👑 "+(d.cleared||0)+"たい"):"";
  }catch(e){ $("#saveInfo").textContent=""; }
}
function syncAfterLoad(){ setVolumes(); }
