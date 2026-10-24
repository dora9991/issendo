"use strict";
/* ==========================================================
   おと — こうかおん（WebAudio で ごうせい）＋ おんがく（ちっぷちゅーん）＋ こえ
   ========================================================== */
let AC=null, MASTER=null, SFXG=null, MUSG=null, NOISE=null;
const PULSE={};

function acInit(){
  if(AC)return AC;
  try{
    const C=window.AudioContext||window.webkitAudioContext; if(!C)return null;
    AC=new C({latencyHint:"interactive"});
    try{ if(navigator.audioSession)navigator.audioSession.type="playback"; }catch(e){}   /* iPhone の マナーモード でも ならす */
    const comp=AC.createDynamicsCompressor();
    comp.threshold.value=-14; comp.knee.value=10; comp.ratio.value=5; comp.attack.value=.003; comp.release.value=.18;
    MASTER=AC.createGain(); MASTER.gain.value=.95; MASTER.connect(comp); comp.connect(AC.destination);
    SFXG=AC.createGain(); SFXG.gain.value=S.se?1:0; SFXG.connect(MASTER);
    MUSG=AC.createGain(); MUSG.gain.value=S.bgm?.8:0; MUSG.connect(MASTER);
    const len=Math.floor(AC.sampleRate*1.2);
    NOISE=AC.createBuffer(1,len,AC.sampleRate);
    const d=NOISE.getChannelData(0); for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    [.125,.25,.5].forEach(duty=>{
      const N=48, re=new Float32Array(N), im=new Float32Array(N);
      for(let n=1;n<N;n++)re[n]=2/(n*Math.PI)*Math.sin(n*Math.PI*duty);
      PULSE[duty]=AC.createPeriodicWave(re,im);
    });
  }catch(e){ AC=null; }
  return AC;
}
let _unlocked=false;
function audioUnlock(){
  const a=acInit(); if(!a)return;
  if(a.state!=="running"){ try{ a.resume(); }catch(e){} }
  if(!_unlocked){
    _unlocked=true;
    try{ const b=a.createBuffer(1,1,22050),s=a.createBufferSource(); s.buffer=b; s.connect(a.destination); s.start(0); }catch(e){}
    Voice.unlock();
  }
  Music.kick();
}
["pointerup","touchend","click","keydown"].forEach(ev=>addEventListener(ev,audioUnlock,{capture:true,passive:true}));

function setVolumes(){
  if(!AC)return;
  const t=AC.currentTime;
  SFXG.gain.setTargetAtTime(S.se?1:0,t,.03);
  MUSG.gain.setTargetAtTime(S.bgm?.8:0,t,.05);
  Music.mp3Vol();
}

/* ---------- もと に なる おと ---------- */
function tone(o){
  const a=AC; if(!a||a.state!=="running")return;
  const dest=o.dest||SFXG; if(dest===SFXG&&!S.se)return;
  const t=(o.at0||a.currentTime)+(o.when||0), dur=o.dur||.1, v=o.vol||.15, at=o.atk||.004;
  const os=a.createOscillator();
  if(o.duty)os.setPeriodicWave(PULSE[o.duty]); else os.type=o.type||"square";
  os.frequency.setValueAtTime(o.f,t);
  if(o.f2){ if(o.lin)os.frequency.linearRampToValueAtTime(o.f2,t+dur); else os.frequency.exponentialRampToValueAtTime(o.f2,t+dur); }
  if(o.det)os.detune.value=o.det;
  const g=a.createGain();
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+at);
  if(o.hold)g.gain.setValueAtTime(v,t+dur*o.hold);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  let last=os;
  if(o.lp){ const f=a.createBiquadFilter(); f.type="lowpass"; f.frequency.value=o.lp; last.connect(f); last=f; }
  last.connect(g); g.connect(dest);
  os.start(t); os.stop(t+dur+.05);
}
function noise(o){
  const a=AC; if(!a||a.state!=="running")return;
  const dest=o.dest||SFXG; if(dest===SFXG&&!S.se)return;
  const t=(o.at0||a.currentTime)+(o.when||0), dur=o.dur||.1, v=o.vol||.2, at=o.atk||.003;
  const src=a.createBufferSource(); src.buffer=NOISE;
  const f=a.createBiquadFilter(); f.type=o.type||"bandpass"; f.Q.value=o.q||1;
  f.frequency.setValueAtTime(o.f||1000,t);
  if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
  const g=a.createGain();
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+at);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t,Math.random()*.6); src.stop(t+dur+.05);
}
const R=(a,b)=>a+Math.random()*(b-a);

/* ---------- こうかおん ---------- */
const sfx={
  tap(){ tone({f:880,f2:1320,type:"sine",dur:.08,vol:.2}); },
  back(){ tone({f:700,f2:420,type:"sine",dur:.09,vol:.18}); },
  swing(k){ const p=R(.9,1.12)*(k?1.25:1);
    noise({type:"bandpass",f:700*p,f2:4200*p,q:.9,dur:.14,vol:.42});
    tone({f:420*p,f2:1300*p,type:"triangle",dur:.07,vol:.05}); },
  hit(big){ const p=R(.9,1.1);
    noise({type:"lowpass",f:3600,f2:500,dur:.14,vol:.55});
    tone({f:240*p,f2:60,type:"sine",dur:big?.28:.18,vol:big?.8:.55});
    tone({f:1300*p,f2:500,duty:.25,dur:.05,vol:.09}); },
  crit(){ sfx.hit(true);
    tone({f:1760,type:"triangle",dur:.35,vol:.2,when:.02});
    tone({f:2637,type:"triangle",dur:.4,vol:.13,when:.06}); },
  hurt(){ noise({type:"lowpass",f:1600,f2:260,dur:.2,vol:.5});
    tone({f:320,f2:90,type:"square",dur:.2,vol:.11,lp:1400}); },
  guard(){ tone({f:1568,type:"triangle",dur:.35,vol:.22}); tone({f:2349,type:"sine",dur:.4,vol:.13,when:.01});
    noise({type:"highpass",f:5000,dur:.06,vol:.18}); },
  coin(k){ const p=Math.pow(2,(k||0)/12);
    tone({f:988*p,duty:.5,dur:.06,vol:.07,hold:.8}); tone({f:1319*p,duty:.5,dur:.2,vol:.07,when:.06}); },
  heal(){ [523,659,784,1047,1319].forEach((f,i)=>tone({f,type:"sine",dur:.25,vol:.14,when:i*.06}));
    noise({type:"highpass",f:6000,dur:.5,vol:.06,atk:.1}); },
  jump(){ tone({f:320,f2:880,duty:.25,dur:.16,vol:.1}); noise({type:"bandpass",f:800,f2:2400,dur:.15,vol:.12}); },
  land(){ tone({f:130,f2:55,type:"sine",dur:.12,vol:.35}); noise({type:"lowpass",f:700,dur:.07,vol:.2}); },
  charge(){ tone({f:160,f2:900,type:"sawtooth",dur:.85,vol:.07,lp:2200,lin:1});
    tone({f:320,f2:1800,type:"triangle",dur:.85,vol:.06,lin:1}); },
  ready(){ [1047,1319,1568,2093].forEach((f,i)=>tone({f,type:"triangle",dur:.2,vol:.1,when:i*.05})); },
  ultStart(){ tone({f:300,f2:2600,type:"sine",dur:.55,vol:.22}); tone({f:450,f2:3900,duty:.125,dur:.55,vol:.05});
    noise({type:"bandpass",f:400,f2:7000,q:.8,dur:.55,vol:.18}); },
  cutin(){ noise({type:"highpass",f:2500,dur:.45,vol:.32}); tone({f:2093,type:"triangle",dur:.7,vol:.16});
    tone({f:3136,type:"sine",dur:.8,vol:.1,when:.02}); tone({f:1046,type:"square",dur:.12,vol:.06,lp:3000}); },
  dash(){ noise({type:"bandpass",f:500,f2:6000,q:1.4,dur:.22,vol:.55}); tone({f:200,f2:1200,type:"sawtooth",dur:.18,vol:.05,lp:3000}); },
  sheath(){ tone({f:2600,type:"square",dur:.03,vol:.09,lp:6000}); tone({f:1800,type:"triangle",dur:.14,vol:.12,when:.05}); },
  boom(){ noise({type:"lowpass",f:4200,f2:70,dur:1.0,vol:.8}); tone({f:95,f2:28,type:"sine",dur:.9,vol:.8});
    noise({type:"highpass",f:3000,dur:.25,vol:.2}); },
  warn(){ tone({f:1250,f2:1650,duty:.25,dur:.07,vol:.07}); tone({f:1250,f2:1650,duty:.25,dur:.07,vol:.07,when:.09}); },
  shoot(){ tone({f:900,f2:260,duty:.5,dur:.2,vol:.07,lp:3000}); noise({type:"bandpass",f:1500,f2:500,dur:.15,vol:.1}); },
  arrow(){ noise({type:"bandpass",f:1800,f2:3800,q:3,dur:.13,vol:.25}); tone({f:760,f2:1300,type:"triangle",dur:.07,vol:.07}); },
  wind(){ noise({type:"bandpass",f:600,f2:3000,q:2.5,dur:.3,vol:.35}); noise({type:"bandpass",f:1200,f2:5000,q:4,dur:.25,vol:.15,when:.05}); },
  quake(){ noise({type:"lowpass",f:900,f2:120,dur:.45,vol:.45}); tone({f:70,f2:40,type:"sine",dur:.4,vol:.4}); },
  curse(){ tone({f:500,f2:180,type:"sine",dur:.55,vol:.12}); tone({f:520,f2:190,type:"triangle",dur:.55,vol:.06,det:30}); },
  eheal(){ [392,494,587].forEach((f,i)=>tone({f,type:"triangle",dur:.25,vol:.08,when:i*.07})); },
  die(){ tone({f:900,f2:90,duty:.25,dur:.6,vol:.13}); noise({type:"highpass",f:3000,f2:9000,dur:.6,vol:.12}); },
  star(k){ const f=[1047,1319,1568][k]||1568;
    tone({f,type:"triangle",dur:.5,vol:.22}); tone({f:f*2,type:"sine",dur:.5,vol:.08,when:.02});
    noise({type:"highpass",f:7000,dur:.3,vol:.07}); },
  tick(){ tone({f:1900,type:"square",dur:.02,vol:.035,lp:5000}); },
  buy(){ [1319,1568,2093,2637].forEach((f,i)=>tone({f,type:"triangle",dur:.22,vol:.13,when:i*.06})); sfx.coin(0); },
  combo(n){ const p=Math.pow(2,Math.min(n,24)/24); tone({f:880*p,f2:1320*p,duty:.25,dur:.07,vol:.06}); },
  heart(){ tone({f:62,type:"sine",dur:.13,vol:.45}); tone({f:58,type:"sine",dur:.13,vol:.35,when:.2}); },
  whoosh(){ noise({type:"bandpass",f:300,f2:2500,q:.7,dur:.35,vol:.3}); },
  go(){ tone({f:523,duty:.25,dur:.09,vol:.12}); tone({f:1047,duty:.25,dur:.35,vol:.12,when:.09}); },
  alarm(){ for(let i=0;i<3;i++){ tone({f:880,duty:.5,dur:.16,vol:.07,when:i*.36,lp:3000}); tone({f:660,duty:.5,dur:.16,vol:.07,when:i*.36+.18,lp:3000}); } },
  pop(){ tone({f:520,f2:1100,type:"sine",dur:.09,vol:.18}); },
  bonk(){ tone({f:200,f2:120,type:"square",dur:.12,vol:.12,lp:1200}); noise({type:"lowpass",f:900,dur:.08,vol:.25}); },
};
function buzz(ms){ if(navigator.vibrate){ try{navigator.vibrate(ms);}catch(e){} } }

/* ==========================================================
   おんがく（じぶん で さっきょく した ちっぷちゅーん）
   ========================================================== */
const NOTE={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
function midi(n){ const m=/^([A-G][#b]?)(-?\d)$/.exec(n); return m?12*(+m[2]+1)+NOTE[m[1]]:null; }
const mtof=m=>440*Math.pow(2,(m-69)/12);
function parseTrack(str){
  const tk=str.trim().split(/\s+/).filter(x=>x!=="|"), ev=[];
  for(let i=0;i<tk.length;i++){
    const x=tk[i]; if(x==="."||x==="-")continue;
    let len=1; while(tk[i+len]==="-")len++;
    ev.push({at:i,len,n:x.split("+")});
  }
  return {len:tk.length,ev};
}
/* ひとつ の がっき の おと */
function playNote(inst,n,t,dur,v,dest){
  const a=AC;
  if(inst==="drum"){
    if(n==="k"){ tone({at0:t,f:150,f2:42,type:"sine",dur:.16,vol:v*.85,dest}); tone({at0:t,f:900,f2:200,type:"triangle",dur:.02,vol:v*.22,dest}); }
    else if(n==="s"){ noise({at0:t,type:"highpass",f:1100,dur:.13,vol:v*.7,dest}); tone({at0:t,f:210,f2:140,type:"triangle",dur:.07,vol:v*.5,dest}); }
    else if(n==="h"){ noise({at0:t,type:"highpass",f:7500,dur:.035,vol:v*.28,dest}); }
    else if(n==="o"){ noise({at0:t,type:"highpass",f:6500,dur:.16,vol:v*.25,dest}); }
    else if(n==="c"){ noise({at0:t,type:"highpass",f:4200,dur:.9,vol:v*.45,dest}); }
    else if(n==="t"){ tone({at0:t,f:180,f2:90,type:"sine",dur:.14,vol:v*.8,dest}); }
    return;
  }
  const m=midi(n); if(m==null)return;
  const f=mtof(m);
  if(inst==="bass"){ tone({at0:t,f,duty:.5,dur:Math.max(.06,dur*.9),vol:v,atk:.004,hold:.7,lp:900,dest}); return; }
  if(inst==="harm"){ tone({at0:t,f,duty:.125,dur:Math.min(dur,.14),vol:v,atk:.003,dest}); return; }
  if(inst==="arp"){ tone({at0:t,f,duty:.25,dur:Math.min(dur,.1),vol:v,atk:.002,dest}); return; }
  if(inst==="bell"){ tone({at0:t,f,type:"triangle",dur:Math.max(.3,dur),vol:v,dest}); tone({at0:t,f:f*2,type:"sine",dur:Math.max(.25,dur*.8),vol:v*.35,dest}); return; }
  /* lead / lead2: ぱるす ＋ びぶらーと */
  const os=a.createOscillator(), g=a.createGain();
  os.setPeriodicWave(PULSE[inst==="lead2"?.5:.25]);
  os.frequency.setValueAtTime(f,t);
  if(dur>.28){
    const lfo=a.createOscillator(), lg=a.createGain();
    lfo.frequency.value=5.8; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*.006,t+.22);
    lfo.connect(lg); lg.connect(os.frequency); lfo.start(t); lfo.stop(t+dur+.1);
  }
  const vv=inst==="lead2"?v*.75:v, end=t+Math.max(.05,dur-.02);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vv,t+.008);
  g.gain.exponentialRampToValueAtTime(vv*.72,t+.1); g.gain.setValueAtTime(vv*.72,end-.02);
  g.gain.exponentialRampToValueAtTime(.0001,end+.06);
  let last=os;
  if(inst==="lead2"){ const fl=a.createBiquadFilter(); fl.type="lowpass"; fl.frequency.value=3200; os.connect(fl); last=fl; }
  last.connect(g); g.connect(dest); os.start(t); os.stop(end+.1);
}

/* ---------- きょく ---------- */
const B8=(...bars)=>bars.join(" ");
const rep=(s,n)=>Array(n).fill(s).join(" ");
function chordBar(ch,pat){ return pat.split(" ").map(x=>x==="X"?ch:x).join(" "); }
const SONGS={
  /* タイトル「いっせんどう の テーマ」 D */
  title:{bpm:138,spb:2,loop:true,tracks:[
    {i:"lead",v:.2,s:B8(
      "D5 - - A4 D5 - F#5 -","E5 - - C#5 A4 - - -","B4 - D5 - F#5 - B5 -","A5 - G5 - F#5 - E5 -",
      "D5 - - A4 D5 - F#5 -","A5 - - G5 F#5 - E5 -","G5 - F#5 - E5 - C#5 -","D5 - - - - - A4 -",
      "B4 - D5 - G5 - - F#5","E5 - - A4 C#5 - E5 -","F#5 - - E5 C#5 - A4 -","B4 - C#5 - D5 - F#5 -",
      "G5 - - F#5 G5 - B5 -","A5 - - G5 A5 - C#6 -","D6 - - C#6 B5 - G5 -","A5 - - - E5 - C#5 -")},
    {i:"harm",v:.07,s:B8(
      chordBar("D4+F#4+A4",". X . X . X . X"),chordBar("C#4+E4+A4",". X . X . X . X"),chordBar("D4+F#4+B4",". X . X . X . X"),chordBar("D4+G4+B4",". X . X . X . X"),
      chordBar("D4+F#4+A4",". X . X . X . X"),chordBar("C#4+E4+A4",". X . X . X . X"),". D4+G4+B4 . D4+G4+B4 . C#4+E4+A4 . C#4+E4+A4",chordBar("D4+F#4+A4",". X . X . X . X"),
      chordBar("D4+G4+B4",". X . X . X . X"),chordBar("C#4+E4+A4",". X . X . X . X"),chordBar("C#4+F#4+A4",". X . X . X . X"),chordBar("D4+F#4+B4",". X . X . X . X"),
      chordBar("D4+G4+B4",". X . X . X . X"),chordBar("C#4+E4+A4",". X . X . X . X"),". D4+F#4+B4 . D4+F#4+B4 . D4+G4+B4 . D4+G4+B4",chordBar("C#4+E4+A4",". X . X . X . X"))},
    {i:"bass",v:.16,s:B8(
      rep("D2 D3",4),rep("A1 A2",4),rep("B1 B2",4),rep("G1 G2",4),
      rep("D2 D3",4),rep("A1 A2",4),"G1 G2 G1 G2 A1 A2 A1 A2",rep("D2 D3",4),
      rep("G1 G2",4),rep("A1 A2",4),rep("F#1 F#2",4),rep("B1 B2",4),
      rep("G1 G2",4),rep("A1 A2",4),"B1 B2 B1 B2 G1 G2 G1 G2",rep("A1 A2",4))},
    {i:"drum",v:.5,s:B8(rep("k+h h s+h h k+h k+h s+h h",7),"k+h h s+h h s s s s",rep("k+h h s+h h k+h k+h s+h h",7),"k+c h s+h h s s t t")},
  ]},
  /* メニュー「しゅぎょう の ひろば」 G */
  menu:{bpm:112,spb:2,loop:true,tracks:[
    {i:"lead",v:.17,s:B8(
      "D5 - B4 - G4 - B4 D5","E5 - - - B4 - - -","C5 - E5 - G5 - E5 -","F#5 - - E5 D5 - - -",
      "D5 - B4 - G4 - B4 D5","G5 - F#5 - E5 - B4 -","C5 - E5 - D5 - F#5 -","G5 - - - - - . .",
      "G5 - D5 - B4 - D5 G5","B5 - - - G5 - - -","E5 - G5 - C6 - G5 -","A5 - - G5 F#5 - - -",
      "B5 - A5 - G5 - D5 -","E5 - G5 - B5 - G5 -","E5 - C5 - F#5 - A5 -","G5 - - - - - . .")},
    {i:"harm",v:.06,s:rep(B8(
      chordBar("B3+D4+G4",". X . X . X . X"),chordBar("B3+E4+G4",". X . X . X . X"),chordBar("C4+E4+G4",". X . X . X . X"),chordBar("D4+F#4+A4",". X . X . X . X"),
      chordBar("B3+D4+G4",". X . X . X . X"),chordBar("B3+E4+G4",". X . X . X . X"),". C4+E4+G4 . C4+E4+G4 . D4+F#4+A4 . D4+F#4+A4",chordBar("B3+D4+G4",". X . X . X . X")),2)},
    {i:"bass",v:.15,s:rep(B8("G2 . D3 . G2 . D3 .","E2 . B2 . E2 . B2 .","C3 . G2 . C3 . G2 .","D3 . A2 . D3 . A2 .",
      "G2 . D3 . G2 . D3 .","E2 . B2 . E2 . B2 .","C3 . G2 . D3 . A2 .","G2 . D3 . G2 . . ."),2)},
    {i:"drum",v:.32,s:B8(rep("k . h . s . h h",7),"k . h . s s s .")},
  ]},
  /* とっくん「えいっ！ やーっ！」 C */
  train:{bpm:156,spb:2,loop:true,tracks:[
    {i:"lead",v:.17,s:B8(
      "C5 C5 E5 - G5 - E5 -","C5 C5 E5 - G5 - C6 -","A5 - G5 - F5 - A5 -","G5 - - - D5 - B4 -",
      "C5 C5 E5 - G5 - E5 -","A5 - G5 - E5 - C5 -","F5 - A5 - G5 - B5 -","C6 - - - G5 - E5 -")},
    {i:"arp",v:.05,s:B8(rep("C4 E4 G4 E4",4),rep("F4 A4 C5 A4",2),rep("G4 B4 D5 B4",2),rep("C4 E4 G4 E4",2),rep("A3 C4 E4 C4",2),"F4 A4 C5 A4 G4 B4 D5 B4",rep("C4 E4 G4 E4",2))},
    {i:"bass",v:.16,s:B8(rep("C2 C2 C3 C2",4),rep("F2 F2 F3 F2",2),rep("G2 G2 G3 G2",2),rep("C2 C2 C3 C2",2),rep("A1 A1 A2 A1",2),"F2 F2 F3 F2 G2 G2 G3 G2",rep("C2 C2 C3 C2",2))},
    {i:"drum",v:.45,s:B8(rep("k+h h s+h k+h k+h h s+h h",7),"k+h s s s s s c+k .")},
  ]},
  /* ボス「つよい てき が あらわれた」 Em */
  boss:{bpm:164,spb:2,loop:true,tracks:[
    {i:"lead2",v:.17,s:B8(
      "E5 - - B4 E5 - G5 -","F#5 - E5 - D5 - B4 -","C5 - - E5 G5 - C6 -","B5 - A5 - F#5 - D5 -",
      "E5 - - B4 E5 - G5 -","B5 - - A5 G5 - F#5 -","G5 - E5 - C5 - E5 -","D#5 - - - F#5 - B5 -",
      "C6 - B5 - A5 - E5 -","G5 - F#5 - E5 - B4 -","A5 - B5 - C6 - E6 -","D#6 - - - B5 - - -",
      "E6 - D6 - C6 - G5 -","F#5 - A5 - D6 - C6 -","B5 - A5 - G5 - F#5 -","D#5 - F#5 - A5 - B5 -")},
    {i:"harm",v:.07,s:B8(
      chordBar("E4+B4","X . X X . X . X"),chordBar("E4+B4","X . X X . X . X"),chordBar("C4+G4","X . X X . X . X"),chordBar("D4+A4","X . X X . X . X"),
      chordBar("E4+B4","X . X X . X . X"),chordBar("E4+B4","X . X X . X . X"),chordBar("C4+G4","X . X X . X . X"),chordBar("B3+F#4","X . X X . X . X"),
      chordBar("A3+E4","X . X X . X . X"),chordBar("E4+B4","X . X X . X . X"),chordBar("A3+E4","X . X X . X . X"),chordBar("B3+F#4","X . X X . X . X"),
      chordBar("C4+G4","X . X X . X . X"),chordBar("D4+A4","X . X X . X . X"),chordBar("B3+F#4","X . X X . X . X"),chordBar("B3+F#4","X . X X . X . X"))},
    {i:"bass",v:.17,s:B8(
      rep("E2 E2 E3 E2 E2 E3 E2 E3",2),"C2 C2 C3 C2 C2 C3 C2 C3","D2 D2 D3 D2 D2 D3 D2 D3",
      rep("E2 E2 E3 E2 E2 E3 E2 E3",2),"C2 C2 C3 C2 C2 C3 C2 C3","B1 B1 B2 B1 B1 B2 B1 B2",
      "A1 A1 A2 A1 A1 A2 A1 A2","E2 E2 E3 E2 E2 E3 E2 E3","A1 A1 A2 A1 A1 A2 A1 A2","B1 B1 B2 B1 B1 B2 B1 B2",
      "C2 C2 C3 C2 C2 C3 C2 C3","D2 D2 D3 D2 D2 D3 D2 D3",rep("B1 B1 B2 B1 B1 B2 B1 B2",2))},
    {i:"drum",v:.5,s:B8(rep("k+h h s+h k k+h h s+h h",7),"k s k s s s s s",rep("k+h h s+h k k+h h s+h h",7),"k+c s s s s s t t")},
  ]},
  /* さいご の たたかい Dm */
  final:{bpm:172,spb:2,loop:true,tracks:[
    {i:"lead2",v:.17,s:B8(
      "D5 - A4 - D5 - F5 -","F5 - D5 - Bb4 - D5 -","G5 - - Bb5 A5 - G5 -","A5 - - - C#5 - E5 -",
      "D6 - C6 - A5 - F5 -","F5 - D5 - Bb4 - F5 -","G5 - Bb5 - A5 - C#6 -","D6 - - - A5 - D5 -",
      "Bb5 - A5 - F5 - D5 -","C6 - Bb5 - G5 - E5 -","A5 - C#6 - E6 - C#6 -","D6 - - - A5 - F5 -",
      "D6 - C6 - Bb5 - F5 -","E6 - D6 - C6 - G5 -","D6 - Bb5 - G5 - Bb5 -","A5 - G5 - F5 - E5 -")},
    {i:"harm",v:.07,s:B8(
      chordBar("D4+A4","X . X X . X . X"),chordBar("Bb3+F4","X . X X . X . X"),chordBar("G3+D4","X . X X . X . X"),chordBar("A3+E4","X . X X . X . X"),
      chordBar("D4+A4","X . X X . X . X"),chordBar("Bb3+F4","X . X X . X . X"),"G3+D4 . G3+D4 G3+D4 A3+E4 . A3+E4 .",chordBar("D4+A4","X . X X . X . X"),
      chordBar("Bb3+F4","X . X X . X . X"),chordBar("C4+G4","X . X X . X . X"),chordBar("A3+E4","X . X X . X . X"),chordBar("D4+A4","X . X X . X . X"),
      chordBar("Bb3+F4","X . X X . X . X"),chordBar("C4+G4","X . X X . X . X"),chordBar("G3+D4","X . X X . X . X"),chordBar("A3+E4","X . X X . X . X"))},
    {i:"bass",v:.17,s:B8(
      "D2 D2 D3 D2 D2 D3 D2 D3","Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 Bb2","G1 G1 G2 G1 G1 G2 G1 G2","A1 A1 A2 A1 A1 A2 A1 A2",
      "D2 D2 D3 D2 D2 D3 D2 D3","Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 Bb2","G1 G1 G2 G1 A1 A1 A2 A1","D2 D2 D3 D2 D2 D3 D2 D3",
      "Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 Bb2","C2 C2 C3 C2 C2 C3 C2 C3","A1 A1 A2 A1 A1 A2 A1 A2","D2 D2 D3 D2 D2 D3 D2 D3",
      "Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 Bb2","C2 C2 C3 C2 C2 C3 C2 C3","G1 G1 G2 G1 G1 G2 G1 G2","A1 A1 A2 A1 A1 A2 A1 A2")},
    {i:"drum",v:.52,s:B8(rep("k+h k s+h k k+h k s+h h",7),"k s k s s s s s",rep("k+h k s+h k k+h k s+h h",7),"k+c s s s s s t t")},
  ]},
  /* かった！ */
  win:{bpm:150,spb:4,loop:false,tracks:[
    {i:"lead",v:.2,s:"G4 C5 E5 G5 - - - - E5 - G5 - - - - - A4 D5 F5 A5 - - - - F5 - A5 - B5 - - - C6 - - - - - - - - - - - . . . ."},
    {i:"harm",v:.08,s:"E4+G4 - - - - - - - C5+E5 - - - - - - - F4+A4 - - - - - - - D5+F5 - - - D5+G5 - - - E5+G5+C6 - - - - - - - - - - - . . . ."},
    {i:"bass",v:.17,s:"C3 - - - - - - - C3 - - - - - - - F2 - - - - - - - G2 - - - G2 - - - C3 - - - - - - - - - - - . . . ."},
    {i:"drum",v:.5,s:"k . . . . . . . s . . . . . . . k . . . . . . . s . . . s . s . k+c . . . . . . . . . . . . . . ."},
  ]},
  /* まけた… */
  lose:{bpm:92,spb:2,loop:false,tracks:[
    {i:"lead",v:.16,s:"G4 - F#4 - F4 - - - E4 - - - - - . ."},
    {i:"bass",v:.15,s:"C3 - - - B2 - - - Bb2 - - - A2 - . ."},
  ]},
  /* けん が しんか！ / れべるあっぷ */
  evolve:{bpm:160,spb:4,loop:false,tracks:[
    {i:"lead",v:.18,s:"C5 E5 G5 C6 E5 G5 C6 E6 G5 C6 E6 G6 - - - - C7 - - - - - - - . . . ."},
    {i:"bell",v:.07,s:"C6 . . . E6 . . . G6 . . . C7 . . . E7 - - - - - - - . . . ."},
    {i:"bass",v:.15,s:"C3 - - - - - - - G2 - - - - - - - C3 - - - - - - - . . . ."},
    {i:"drum",v:.4,s:"k . . . . . . . s . . . s . s . c+k . . . . . . . . . . ."},
  ]},
};

const Music=(()=>{
  let cur=null, song=null, parsed=null, step=0, nextT=0, timer=null, g=null, onEnd=null, stepsLeft=0;
  let mp3=null, mp3Src=null, mp3G=null, mp3On=false;
  function stopSynth(fade){
    if(timer){ clearInterval(timer); timer=null; }
    if(g&&AC){ const gg=g; try{ gg.gain.setTargetAtTime(.0001,AC.currentTime,fade||.08); }catch(e){} setTimeout(()=>{ try{gg.disconnect();}catch(e){} },900); }
    g=null; song=null;
  }
  function ensureMp3(){
    if(mp3)return;
    mp3=new Audio("audio/battle.mp3"); mp3.loop=true; mp3.preload="auto";
    try{ if(acInit()){ mp3Src=AC.createMediaElementSource(mp3); mp3G=AC.createGain(); mp3G.gain.value=.55; mp3Src.connect(mp3G); mp3G.connect(MUSG); } }catch(e){ mp3Src=null; }
  }
  function mp3Vol(){ if(!mp3)return; if(!mp3Src)mp3.volume=S.bgm?.45:0; }
  function stopMp3(){ mp3On=false; if(mp3){ try{ mp3.pause(); }catch(e){} } }
  function tick(){
    if(!AC||!song)return;
    if(AC.state!=="running"){ nextT=AC.currentTime+.05; return; }
    const sd=60/song.bpm/song.spb;
    if(nextT<AC.currentTime-.3)nextT=AC.currentTime+.02;
    while(nextT<AC.currentTime+.14){
      for(const tr of parsed){
        const local=step%tr.len;
        for(const e of tr.byAt[local]||[])for(const n of e.n)playNote(tr.i,n,nextT,e.len*sd,tr.v,g);
      }
      nextT+=sd; step++;
      if(!song.loop&&--stepsLeft<=0){
        const cb=onEnd; stopSynth(.3); cur=null;
        if(cb)setTimeout(cb,250);
        return;
      }
    }
  }
  function startSynth(id,then){
    song=SONGS[id];
    parsed=song.tracks.map(tr=>{ const p=parseTrack(tr.s), byAt={}; p.ev.forEach(e=>(byAt[e.at]=byAt[e.at]||[]).push(e)); return {i:tr.i,v:tr.v,len:p.len,byAt}; });
    stepsLeft=Math.max(...parsed.map(p=>p.len));
    g=AC.createGain(); g.gain.value=1; g.connect(MUSG);
    step=0; nextT=AC.currentTime+.06; onEnd=then||null;
    timer=setInterval(tick,25); tick();
  }
  return {
    get cur(){ return cur; },
    play(id,then){
      if(cur===id&&(timer||mp3On))return;
      Music.stop(.12);
      cur=id;
      if(!acInit())return;
      if(id==="battle"){
        ensureMp3(); mp3On=true;
        try{ mp3.currentTime=0; if(S.bgm){ const p=mp3.play(); if(p&&p.catch)p.catch(()=>{}); } }catch(e){}
        return;
      }
      if(SONGS[id])startSynth(id,then);
    },
    jingle(id,then){ Music.stop(.05); cur=id; if(acInit()&&SONGS[id])startSynth(id,then); },
    stop(fade){ stopSynth(fade); stopMp3(); cur=null; },
    kick(){ /* ろっく かいじょ の あと に もう いちど */
      if(cur==="battle"&&mp3On&&mp3&&mp3.paused&&S.bgm){ try{ const p=mp3.play(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} }
    },
    pause(){ if(mp3&&mp3On){ try{mp3.pause();}catch(e){} } },
    resume(){ Music.kick(); },
    mp3Vol(){ mp3Vol(); if(mp3On&&mp3){ if(!S.bgm)mp3.pause(); else Music.kick(); } },
    duck(on){ if(!AC||!MUSG)return; MUSG.gain.setTargetAtTime(S.bgm?(on?.25:.8):0,AC.currentTime,.08); },
  };
})();

/* ---------- こえ（よみあげ） ---------- */
const Voice=(()=>{
  let voice=null, ok=!!window.speechSynthesis;
  function choose(){
    if(!ok)return;
    const vs=speechSynthesis.getVoices().filter(v=>/^ja/i.test(v.lang));
    voice=vs.find(v=>/otoya|male|男/i.test(v.name))||vs.find(v=>/kyoko|o-ren|hattori/i.test(v.name))||vs[0]||null;
  }
  if(ok){ choose(); try{ speechSynthesis.onvoiceschanged=choose; }catch(e){} }
  return {
    unlock(){ if(!ok)return; try{ const u=new SpeechSynthesisUtterance(" "); u.volume=0; speechSynthesis.speak(u); }catch(e){} },
    say(text,o){
      if(!ok||!S.voice)return;
      try{
        speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(text);
        u.lang="ja-JP"; if(voice)u.voice=voice;
        u.pitch=(o&&o.pitch)||1.35; u.rate=(o&&o.rate)||1.15; u.volume=1;
        speechSynthesis.speak(u);
      }catch(e){}
    },
  };
})();
