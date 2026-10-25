/* バランス の たしかめ（おと なし で つかう：index.html?mute=1 を ひらいて、コンソール で この ファイル を よみこむ）
   const s=document.createElement("script"); s.src="dev/sim.js?"+Date.now(); document.head.appendChild(s);
   kidSim(19, 2493, 7505, SKS(19), 6)   … わざ を じょうず に つかう こ
   sloppySim(19, 2493, 7505, SKS(19), 6) … わざ を てきとう に おす こ
   PLAN[i] = その てき に いどむ ころ の よてい の こうげき・たいりょく（とっくん で そだてた ばあい） */
"use strict";
window.PLAN=[[8,50],[16,74],[27,107],[41,149],[75,251],[115,371],[161,509],[213,665],[300,926],[396,1214],[501,1529],[615,1871],[779,2363],[955,2891],[1143,3455],[1343,4055],[1608,4850],[1888,5690],[2183,6575],[2493,7505],[2811,8459],[3147,9467],[3501,10529],[3873,11645],[4328,13010],[4804,14438],[5301,15929],[5819,17483],[6435,19331],[7075,21251],[7739,23243],[8427,25307],[9228,27710],[10056,30194],[10911,32759],[11793,35405],[12803,38435],[13843,41555],[14913,44765],[16013,48065]];
/* その ころ に もって いそう な わざ */
window.SKS=i=>{ const n=i+1; const L=[];
  if(n>=5)L.push("h1"); if(n>=9)L.push("h2","b1","sp1"); if(n>=13)L.push("h3","b2","sp2"); if(n>=14)L.push("gd"); if(n>=15)L.push("ch");
  if(n>=17)L.push("b3","drop","k1","k2","r2","sp3"); if(n>=21)L.push("h4"); if(n>=25)L.push("cr"); if(n>=29)L.push("ug"); if(n>=31)L.push("d2"); return L; };
function runFight(idx,atk,hp,skills,brain){
  S=fresh(); S.tut={move:1,atk:1,ult:1}; S.atk=atk; S.maxHp=hp; S.skills=skills.slice(); S.cleared=40;
  Battle.start(idx); const B=Battle.B; while(B.phase==="intro")Battle.update(1/60);
  let f=0,acc=0;
  while(f<60*120&&B.phase!=="ko"&&B.phase!=="lose"){ f++; acc+=1/60; if(acc>=brain.dt&&B.phase==="fight"){ acc=0; brain.think(B); } Battle.update(1/60); }
  Battle.setKey("l",false); Battle.setKey("r",false);
  return {win:B.phase==="ko",left:Math.round(B.p.hp/B.p.max*100),ults:B.ults,secs:f/60};
}
const SMART={dt:.06,think(B){
  const p=B.p,en=B.en,d=en.x-p.x,ad=Math.abs(d),want=60+B.ehw*.5,L=activeSkills(),rdy=s=>!(B.cds[s.id]>0);
  const heal=L.find(s=>s.kind==="heal"), gd=L.find(s=>s.kind==="guard");
  if(p.gauge>=100)Battle.useUlt();
  else if(heal&&p.hp<p.max*.45&&rdy(heal))Battle.useSkill(heal);
  else if(gd&&en.act&&ad<want+90&&rdy(gd))Battle.useSkill(gd);
  else if(ad>want){ Battle.setKey(d>0?"r":"l",true); Battle.setKey(d>0?"l":"r",false);
    const ar=L.find(s=>s.kind==="arrow"&&rdy(s)); if(ar&&Math.random()<.3){ p.face=Math.sign(d)||1; Battle.useSkill(ar); } }
  else { Battle.setKey("l",false); Battle.setKey("r",false); p.face=Math.sign(d)||1;
    const a=L.filter(s=>["melee","charge","drop","arrow"].includes(s.kind)&&rdy(s)); if(a.length&&Math.random()<.3)Battle.useSkill(pick(a)); else Battle.attack(); }
}};
const SLOPPY={dt:.09,think(B){
  const p=B.p,en=B.en,d=en.x-p.x,ad=Math.abs(d),want=60+B.ehw*.5,L=activeSkills(),rdy=s=>!(B.cds[s.id]>0);
  if(p.gauge>=100&&Math.random()<.3)Battle.useUlt();
  else if(ad>want){ Battle.setKey(d>0?"r":"l",true); Battle.setKey(d>0?"l":"r",false); }
  else { Battle.setKey("l",false); Battle.setKey("r",false); p.face=Math.sign(d)||1;
    const any=L.filter(rdy); if(any.length&&Math.random()<.12)Battle.useSkill(pick(any)); else Battle.attack(); }
}};
/* まとめ ボタン で あそぶ こ：わざ！ が ひかったら よく おす・ふだん は ときどき おす・ひっさつ は きる！ を おしていれば でる */
const MATOME={dt:.08,think(B){
  const p=B.p,en=B.en,d=en.x-p.x,ad=Math.abs(d),want=60+B.ehw*.5;
  const w=Battle.pickWaza();
  if(w&&w.urgent&&Math.random()<.6){ Battle.useWaza(); return; }
  if(ad>want){ Battle.setKey(d>0?"r":"l",true); Battle.setKey(d>0?"l":"r",false); return; }
  Battle.setKey("l",false); Battle.setKey("r",false);
  if(w&&Math.random()<.2)Battle.useWaza(); else Battle.attack();
}};
function sim(brain,name,idx,atk,hp,skills,runs){
  const keep=JSON.stringify(S); let w=0; const left=[];
  for(let r=0;r<runs;r++){ const o=runFight(idx,atk,hp,skills,brain); if(o.win){ w++; left.push(o.left); } }
  S=fresh(); S.atk=atk; S.maxHp=hp; S.skills=skills.slice(); const lab=chanceOf(ENEMIES[idx]).t;
  S=JSON.parse(keep); Battle.quit();
  return "e"+(idx+1)+" "+name+" "+lab+" かち"+w+"/"+runs+" HP平均"+(left.length?Math.round(left.reduce((a,b)=>a+b,0)/left.length):"-");
}
window.kidSim=(idx,atk,hp,skills,runs)=>sim(SMART,"じょうず",idx,atk,hp,skills,runs);
window.sloppySim=(idx,atk,hp,skills,runs)=>sim(SLOPPY,"てきとう",idx,atk,hp,skills,runs);
window.matomeSim=(idx,atk,hp,skills,runs)=>{ const m=S.matome; const r=sim(MATOME,"まとめ",idx,atk,hp,skills,runs); return r; };
window.simReady=true;
