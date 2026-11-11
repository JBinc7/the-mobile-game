/* ================= MANAGER CAREER: MATCHES =================
   One engine plays every detailed match, minute by minute: each side's attack, midfield and defence come from the XI
   on the pitch (their overall in the places they're playing, fitness, morale, form and how well they know the
   shape), shaped by the tactics (mentality, tempo, pressing, width, passing, the defensive line) and the touchline:
   shouts, team talks and substitutions. Shots come at the rate those numbers give and are finished or saved on the
   shooter's and the keeper's attributes; fouls, cards, injuries, fatigue, extra time and penalties are all played.
   mgMatchFast plays a match at once (the other clubs' games, and yours when you sim it); mgLive shows yours on the
   match screen: a 2D pitch where the chances play out, live commentary, stats and ratings, with you on the touchline.
   Loaded after manager.js. */
const MG_AW = {GK:0, CB:.05, LB:.25, RB:.25, LWB:.35, RWB:.35, CDM:.15, CM:.4, CAM:.8, LM:.6, RM:.6, LW:.9, RW:.9, ST:1};
const MG_DW = {GK:.9, CB:1, LB:.7, RB:.7, LWB:.55, RWB:.55, CDM:.7, CM:.3, CAM:.1, LM:.2, RM:.2, LW:.1, RW:.1, ST:.05};
const MG_MW = {GK:0, CB:.1, LB:.25, RB:.25, LWB:.35, RWB:.35, CDM:.8, CM:1, CAM:.8, LM:.7, RM:.7, LW:.3, RW:.3, ST:.15};
const MG_SW = {GK:0, CB:.5, LB:.45, RB:.45, LWB:.6, RWB:.6, CDM:.6, CM:1.3, CAM:2.3, LM:1.7, RM:1.7, LW:2.5, RW:2.5, ST:3.4};
const MG_ASW = {GK:.05, CB:.3, LB:1.2, RB:1.2, LWB:1.5, RWB:1.5, CDM:.8, CM:2, CAM:3, LM:2, RM:2, LW:2.5, RW:2.5, ST:1.5};
const MG_FW = {GK:.1, CB:1.6, LB:1.3, RB:1.3, LWB:1.2, RWB:1.2, CDM:1.8, CM:1.2, CAM:.7, LM:.9, RM:.9, LW:.6, RW:.6, ST:.8};
const MG_MENT = ["Ultra defensive", "Defensive", "Balanced", "Attacking", "Ultra attacking"];

/* ---------- the two sides ---------- */
function mmSide(club, user, f){
  let form, xi, bench, tac;
  if (user){
    if (mgDof()) mdfPrep(f); else mgMendXI(true);
    form = M.tac.f; xi = M.tac.xi.map(id=>M.P[id] || null); bench = M.tac.bench.map(id=>M.P[id]).filter(Boolean);
    tac = {ment:M.tac.ment, tempo:M.tac.tempo, press:M.tac.press, width:M.tac.width, pass:M.tac.pass, line:M.tac.line, style:M.tac.style};
  } else {
    form = (M.cl[club] && M.cl[club].f) || mgPick(mgR(club), ["4-3-3","4-2-3-1","4-4-2","4-1-2-1-2","3-5-2"]);
    const A = mgAutoXI(club, form); xi = A.xi; bench = A.subs.slice(0, 9);
    const opp = f ? (f.h===club ? f.a : f.h) : null, gap = opp ? mgLevel(club) - mgLevel(opp) : 0;
    tac = {ment:gap>5 ? 3 : gap<-6 ? 1 : 2, tempo:1, press:mgRep(club)>.9 ? 2 : 1, width:1, pass:1, line:1, style:"Balanced"};
  }
  const slots = MG_FORM[form] || MG_FORM["4-3-3"];
  const on = xi.map((p, i)=>p ? mmMan(p, slots[i][0], slots[i][1], slots[i][2], true) : null).filter(Boolean);
  const fam = user ? (M.tac.fam[form] ?? 60) : 85;
  // a director of football's head coach makes his team play better (or worse) than its ratings
  const cb = user ? mdfBoost(f ? f.h===club && !f.neutral : false) : 0;
  return {club, user, form, on, bench:bench.map(p=>({p, used:false})), subs:0, subW:0, tac, fam, boost:0, boostT:0, push:0, pushT:0, focus:0, cb,
    st:{sh:0, ont:0, xg:0, poss:0, cor:0, fou:0, yc:0, rc:0, sav:0, off:0}, R:null, out:[]};
}
function mmMan(p, pos, x, y, start){ return {p, pos, x, y, cond:p.fit ?? 100, in:0, mins:0, g:0, a:0, sh:0, ont:0, kp:0, tk:0, sv:0, yc:0, rc:0, inj:null, rt:6.3, off:false, start}; }
const mmOn = S => S.on.filter(o=>!o.off);
function mmEff(o, S){
  const p = o.p; let v = mgOvrAt(p, o.pos);
  if (o.cond<72) v -= (72 - o.cond)*.16;
  v += ((p.mor ?? 62) - 60)/20;
  v += mgxAdj(p);
  if (o.marked) v -= 3;
  v -= (100 - S.fam)*.05;
  v += S.boost + (S.cb || 0);
  return v;
}
function mmRate(S){
  let a = 0, aw = 0, d = 0, dw = 0, m = 0, mw = 0, gk = 50;
  const on = mmOn(S);
  on.forEach(o=>{ const e = mmEff(o, S); a += e*MG_AW[o.pos]; aw += MG_AW[o.pos]; d += e*MG_DW[o.pos]; dw += MG_DW[o.pos]; m += e*MG_MW[o.pos]; mw += MG_MW[o.pos]; if (o.pos==="GK") gk = e; });
  const short = 11 - on.length, line = S.tac.line;
  S.R = {att:(aw ? a/aw : 40) - short*3 + (S.tac.width===2 ? .6 : 0), def:(dw ? d/dw : 40) - short*3.5 + (line===0 ? .8 : line===2 ? -.6 : 0) + S.focus, mid:(mw ? m/mw : 40) - short*3 + (S.tac.press===2 ? .8 : 0) - (S.marking ? .5 : 0), gk};
}

/* ---------- a match ---------- */
function mmNew(f, userSide){
  const H = mmSide(f.h, userSide===0, f), A = mmSide(f.a, userSide===1, f);
  const G = {f, S:[H, A], min:0, add:[1 + Math.floor(Math.random()*4), 2 + Math.floor(Math.random()*5)], half:1, score:[0, 0], ev:[], poss:[0, 0], mom:0, user:userSide,
    ko:!!f.ko, first:f.first || null, neutral:!!f.neutral, phase:"1h", et:false, pens:null, done:false, pressOpp:0};
  if (userSide>=0 && M.pressDone===f.key && M.pressOpp){ G.S[1 - userSide].boost += M.pressOpp*.4; }
  if (userSide>=0) mgxMatchSetup(G, userSide);
  G.S.forEach(mmRate);
  return G;
}
function mmLam(G, s){
  const A = G.S[s], B = G.S[1 - s];
  const d = .52*(A.R.att - B.R.def) + .48*(A.R.mid - B.R.mid);
  let l = mgLam(d, G.neutral ? 0 : s===0 ? 1 : -1);
  const ma = clamp(A.tac.ment - 2 + A.push, -2, 2), mb = clamp(B.tac.ment - 2 + B.push, -2, 2);
  l *= (1 + .1*ma)*(1 + .075*mb);
  l *= A.tac.press===2 ? 1.04 : A.tac.press===0 ? .97 : 1; l *= B.tac.press===2 ? .97 : 1;
  l *= A.tac.tempo===2 ? 1.05 : A.tac.tempo===0 ? .95 : 1; l *= B.tac.tempo===2 ? 1.03 : 1;
  if (A.tac.style==="Counter" && mb>=1) l *= 1.1;
  if (A.tac.pass===2 && B.tac.line===2) l *= 1.07;
  if (A.tac.width===2 && ["4-1-2-1-2","4-2-3-1"].includes(B.form)) l *= 1.04;
  return Math.max(.08, l);
}
const mmPick = (list, w) => { const t = list.reduce((s, x)=>s + Math.max(0, w(x)), 0); let r = Math.random()*t; for (const x of list){ r -= Math.max(0, w(x)); if (r<=0) return x; } return list[list.length - 1]; };
const mmSho = o => o.p.pos==="GK" ? 25 : o.p.at[1];
const mmPas = o => o.p.pos==="GK" ? 40 : o.p.at[2];
function mmSay(G, s, k, txt, o){ const e = {m:G.min, s, k, txt, ...o}; G.ev.push(e); return e; }
const mmMinTxt = G => G.min>(G.phase==="1h" ? 45 : G.phase==="2h" ? 90 : G.phase==="et1" ? 105 : 120) ? `${G.phase==="1h" ? 45 : G.phase==="2h" ? 90 : G.phase==="et1" ? 105 : 120}+${G.min - (G.phase==="1h" ? 45 : G.phase==="2h" ? 90 : G.phase==="et1" ? 105 : 120)}` : String(G.min);
// one minute of football
function mmMinute(G){
  G.min++;
  const live = [];
  G.S.forEach((S, s)=>{
    const drain = (S.tac.press===2 ? 1.22 : S.tac.press===0 ? .9 : 1)*(S.tac.tempo===2 ? 1.08 : 1);
    mmOn(S).forEach(o=>{ o.mins++; o.cond = Math.max(10, o.cond - (o.pos==="GK" ? .08 : .32*(1.15 - (o.p.at[5] || 60)/200)*drain*(o.p.stam ? 1.3 : 1))); });
    if (S.boostT && --S.boostT<=0) S.boost = 0;
    if (S.pushT && --S.pushT<=0) S.push = 0;
  });
  if (G.min % 5===0) G.S.forEach(mmRate);
  // who's got the ball
  const p0 = logistic((G.S[0].R.mid - G.S[1].R.mid)/8 + (G.S[0].tac.pass===0 ? .18 : G.S[0].tac.pass===2 ? -.12 : 0) - (G.S[1].tac.pass===0 ? .18 : G.S[1].tac.pass===2 ? -.12 : 0) + (G.neutral ? 0 : .08));
  G.poss[0] += p0; G.poss[1] += 1 - p0; G.side = Math.random()<p0 ? 0 : 1;
  for (const s of [0, 1]) if (Math.random()<mmLam(G, s)/90/.14) live.push(mmShot(G, s));
  // corners won in open play, and offsides
  for (const s of [0, 1]){ const share = mmLam(G, s)/(mmLam(G, 0) + mmLam(G, 1));
    if (Math.random()<.055*share) mmCorner(G, s, null);
    if (Math.random()<.042*share*(G.S[1 - s].tac.line===2 ? 1.5 : G.S[1 - s].tac.line===0 ? .6 : 1)){ const f = mmPick(mmOn(G.S[s]), o=>({ST:5, LW:3, RW:3, CAM:1.5, LM:1, RM:1, CM:.4})[o.pos] || 0); if (f){ G.S[s].st.off++; mmSay(G, s, "off", `${mgShort(f.p.n)} is flagged offside.`, {p:f.p.id, n:f.p.n}); } } }
  if (Math.random()<.24) mmFoul(G, Math.random()<.5 + (G.S[0].tac.press - G.S[1].tac.press)*.06 ? 0 : 1);
  for (const s of [0, 1]) if (Math.random()<.0017*(1 + mmOn(G.S[s]).filter(o=>o.cond<55).length*.3)) mmInjure(G, s);
  for (const s of [0, 1]) if (G.user!==s || G.auto) mmAiCoach(G, s);
  G.mom = clamp(G.mom*.9, -1, 1);
  mgxFxSay(G);
  return live;
}
const MG_SHOT_T = {
  goal:["GOAL! {p} finds the bottom corner!", "GOAL! {p} lashes it in!", "GOAL! What a finish from {p}!", "GOAL! {p} keeps his cool and slots it home!", "GOAL! {p} rifles it into the roof of the net!", "GOAL! {p} gets on the end of it and scores!"],
  goalA:["{a} picks him out and {p} scores!", "{a} with the pass, {p} with the finish!", "Lovely work from {a}, and {p} buries it!"],
  head:["GOAL! {p} rises highest and heads it in!", "GOAL! A towering header from {p}!"],
  pen:["GOAL! {p} sends the keeper the wrong way from the spot.", "GOAL! {p} smashes the penalty home."],
  penMiss:["Penalty saved! {gk} guesses right and keeps out {p}'s spot-kick!", "{p} blazes the penalty over the bar!"],
  save:["{gk} gets down well to save from {p}.", "Great save! {gk} tips {p}'s shot round the post.", "{p} tests {gk}, who holds on.", "{gk} spreads himself and blocks {p}'s effort."],
  big:["Huge chance for {p}... but {gk} saves!", "{p} is clean through... denied by {gk}!"],
  post:["Off the post! {p} so nearly scores!", "{p} hits the woodwork!", "Crossbar! {p} can't believe it."],
  miss:["{p} drags it wide.", "{p} fires over the bar.", "{p} shoots from distance, well off target.", "{p} snatches at it and misses the target."],
  block:["{p}'s shot is blocked.", "{p} tries his luck but it's charged down."]
};
const mmT = (k, o) => mgPick(Math.random, MG_SHOT_T[k]).replace(/\{(\w+)\}/g, (m, x)=>o[x] || "");
function mmShot(G, s){
  const A = G.S[s], B = G.S[1 - s], on = mmOn(A), them = mmOn(B);
  if (!on.length) return null;
  let sh = mmPick(on, o=>MG_SW[o.pos]*Math.pow(mmSho(o)/70, 2));
  const r = Math.random(); let kind, xg;
  if (r<.025){ kind = "pen"; xg = .76; } else if (r<.085){ kind = "big"; xg = .3 + Math.random()*.35; } else if (r<.28){ kind = "good"; xg = .12 + Math.random()*.18; } else { kind = "low"; xg = .02 + Math.random()*.1; }
  let fk = false; { const sp = mgxTaker(A, on, kind); if (sp){ sh = sp.o; fk = sp.fk; } }
  if (kind!=="pen") xg *= Math.exp(clamp(A.R.att - B.R.def, -15, 15)/120);
  const head = kind!=="pen" && !fk && ["CB","ST"].includes(sh.pos) && Math.random()<.3;
  const gk = them.find(o=>o.pos==="GK"), gkv = gk ? mmEff(gk, B) : 40;
  const fin = Math.exp((mmSho(sh) + (sh.cond - 70)*.05 - 70)/100)/Math.exp((gkv - 70)/100);
  const pg = clamp(xg*fin, .01, .9);
  A.st.sh++; A.st.xg += xg; sh.sh++;
  const x = Math.random(), names = {p:mgShort(sh.p.n), gk:gk ? mgShort(gk.p.n) : "the keeper"};
  let out, cor = false;
  if (x<pg){
    G.score[s]++; A.st.ont++; sh.ont++; sh.g++; sh.rt += 1.05;
    let as = null;
    if (kind!=="pen" && Math.random()<.78){ const pool = on.filter(o=>o!==sh); if (pool.length){ as = (head && mgxCorner(A, pool)) || mmPick(pool, o=>MG_ASW[o.pos]*Math.pow(mmPas(o)/70, 2)); as.a++; as.kp++; as.rt += .7; } }
    if (gk) gk.rt -= .35;
    them.filter(o=>MG_GROUP(o.pos)==="DEF").forEach(o=>{ o.rt -= .12; });
    on.forEach(o=>{ o.rt += .05; });
    G.mom = clamp(G.mom + (s ? -.6 : .6), -1, 1);
    const txt = kind==="pen" ? mmT("pen", names) : fk ? `GOAL! ${names.p} curls the free kick into the top corner!` : head ? mmT("head", names) : as ? mmT("goal", names) + " " + mmT("goalA", {...names, a:mgShort(as.p.n)}) : mmT("goal", names);
    out = mmSay(G, s, "goal", txt, {p:sh.p.id, n:sh.p.n, a:as ? as.p.n : null, kind, xg, head});
    (G.goals ||= []).push({side:s, n:sh.p.n, m:mmMinTxt(G), pen:kind==="pen", a:as ? as.p.n : null});
  } else {
    const y = Math.random();
    const onT = kind==="pen" ? .7 : .4;
    let k;
    if (kind==="pen") k = y<onT ? "save" : "miss";
    else k = y<onT ? "save" : y<onT + .04 ? "post" : y<onT + .24 ? "block" : "miss";
    if (k==="save"){ A.st.ont++; sh.ont++; B.st.sav++; if (gk){ gk.sv++; gk.rt += kind==="big" || kind==="pen" ? .45 : .22; } sh.rt += .05; if (kind!=="pen" && Math.random()<.4) cor = true; }
    else if (k==="block"){ const bl = them.filter(o=>MG_GROUP(o.pos)==="DEF"); if (bl.length){ const b = mgPick(Math.random, bl); b.tk++; b.rt += .12; } if (Math.random()<.35) cor = true; }
    else sh.rt -= .03;
    if (kind==="big" || kind==="pen") sh.rt -= .2;
    G.mom = clamp(G.mom + (s ? -.2 : .2), -1, 1);
    const txt = kind==="pen" ? mmT("penMiss", names) : k==="save" ? (kind==="big" ? mmT("big", names) : mmT("save", names)) : mmT(k, names);
    out = mmSay(G, s, k, (kind==="pen" ? "PENALTY! " : fk ? "Free kick. " : "") + txt, {p:sh.p.id, n:sh.p.n, kind, xg, head});
  }
  out.pos = sh.pos;
  if (cor) mmCorner(G, s, out);
  return out;
}
const MM_CORNER = ["Corner to {t}.", "{t} win a corner.", "It's turned behind: corner to {t}."];
function mmCorner(G, s, after){ G.S[s].st.cor++; mmSay(G, s, "corner", mgPick(Math.random, MM_CORNER).replace("{t}", G.S[s].club)); }
function mmFoul(G, s){
  const S = G.S[s], on = mmOn(S); if (!on.length) return;
  const o = mmPick(on, x=>MG_FW[x.pos]*(1 + (S.tac.press===2 ? .2 : 0)));
  S.st.fou++;
  const r = Math.random(), yc = .15*(S.focus ? .7 : 1);
  if (r<.008){ o.rc = 1; o.off = true; S.st.rc++; o.rt -= 1.4; mmSay(G, s, "red", `RED CARD! ${mgShort(o.p.n)} is sent off for a reckless challenge!`, {p:o.p.id, n:o.p.n}); mmRate(S); }
  else if (r<yc){
    if (o.yc){ o.yc = 2; o.rc = 1; o.off = true; S.st.yc++; S.st.rc++; o.rt -= 1.2; mmSay(G, s, "red", `Second yellow! ${mgShort(o.p.n)} is off and his side are down to ${mmOn(S).length}.`, {p:o.p.id, n:o.p.n}); mmRate(S); }
    else { o.yc = 1; S.st.yc++; o.rt -= .2; mmSay(G, s, "yellow", `Yellow card for ${mgShort(o.p.n)}.`, {p:o.p.id, n:o.p.n}); }
  }
  else mmSay(G, s, "foul", mgPick(Math.random, ["Foul by {p}.", "{p} brings his man down. Free kick.", "{p} is penalised for a late challenge.", "Free kick: {p} catches his man."]).replace("{p}", mgShort(o.p.n)), {p:o.p.id, n:o.p.n});
}
function mmInjure(G, s){
  const S = G.S[s], on = mmOn(S).filter(o=>!o.inj); if (!on.length) return;
  const o = mmPick(on, x=>1 + (x.cond<55 ? 2 : 0));
  o.inj = mgInjury(false);
  mmSay(G, s, "inj", `${mgShort(o.p.n)} is down injured${o.inj.d>20 ? " and it looks serious" : ""}.`, {p:o.p.id, n:o.p.n});
  if (G.user===s && !G.auto){ G.needSub = o; return; }
  if (!mmSubFor(G, s, o)){ o.off = true; mmRate(S); mmSay(G, s, "info", `${mgShort(o.p.n)} can't continue and there are no subs left.`); }
}
// a substitution: someone from the bench, best suited to the place
function mmSub(G, s, off, onP){
  const S = G.S[s]; if (S.subs>=5 || off.off) return false;
  const b = S.bench.find(x=>x.p===onP && !x.used); if (!b) return false;
  b.used = true; S.subs++;
  const m = mmMan(onP, off.pos, off.x, off.y, false); m.in = G.min;
  off.off = true; off.subbed = G.min;
  S.on.push(m);
  mmSay(G, s, "sub", `Substitution: ${mgShort(onP.n)} replaces ${mgShort(off.p.n)}.`, {p:onP.id, n:onP.n, o:off.p.n, off:off.p.id});
  mmRate(S); return true;
}
function mmSubFor(G, s, off){
  const S = G.S[s], avail = S.bench.filter(b=>!b.used && b.p && !b.p.inj);
  if (S.subs>=5 || !avail.length) return false;
  const best = avail.sort((x, y)=>mgOvrAt(y.p, off.pos) - mgOvrAt(x.p, off.pos))[0];
  return mmSub(G, s, off, best.p);
}
function mmAiCoach(G, s){
  const S = G.S[s], m = G.min, gd = G.score[s] - G.score[1 - s];
  if ([60, 70, 79].includes(m) && S.subs<5){
    const tired = mmOn(S).filter(o=>o.pos!=="GK" && (o.cond<68 || o.rt<6)).sort((a, b)=>a.cond - b.cond).slice(0, m===60 ? 2 : 1);
    tired.forEach(o=>mmSubFor(G, s, o));
  }
  if (m===70 && gd<0 && S.tac.ment<4){ S.tac.ment++; }
  if (m===80 && gd>0 && S.tac.ment>1){ S.tac.ment--; }
}
// a match played straight through
function mmRun(G){
  while (!G.done) mmStep(G);
  return G;
}
// on to the next minute or phase; returns the minute's events
function mmStep(G){
  if (G.done) return [];
  const end = G.phase==="1h" ? 45 + G.add[0] : G.phase==="2h" ? 90 + G.add[1] : G.phase==="et1" ? 105 : 120;
  if (G.min>=end){
    if (G.phase==="1h"){ G.phase = "ht"; mmSay(G, -1, "ht", `Half-time: ${G.S[0].club} ${G.score[0]}–${G.score[1]} ${G.S[1].club}.`); return [G.ev[G.ev.length - 1]]; }
    if (G.phase==="2h" || G.phase==="et2"){
      const agg = G.first ? [G.score[0] + G.first[0], G.score[1] + G.first[1]] : G.score;
      if (G.ko && agg[0]===agg[1] && G.phase==="2h"){ G.phase = "et0"; G.et = true; mmSay(G, -1, "et", `It's level${G.first ? " on aggregate" : ""}: extra time.`); return [G.ev[G.ev.length - 1]]; }
      if (G.ko && agg[0]===agg[1]){ mmPens(G); }
      G.phase = "ft"; G.done = true; mmSay(G, -1, "ft", `Full-time: ${G.S[0].club} ${G.score[0]}–${G.score[1]} ${G.S[1].club}${G.pens ? ` (${G.pens[0]}–${G.pens[1]} on penalties)` : ""}.`);
      mmFinish(G); return [G.ev[G.ev.length - 1]];
    }
    if (G.phase==="et1"){ G.phase = "et2"; }
  }
  if (G.phase==="ht"){ G.phase = "2h"; G.min = 45; mmSay(G, -1, "ko", "The second half is under way."); return [G.ev[G.ev.length - 1]]; }
  if (G.phase==="et0"){ G.phase = "et1"; G.min = 90; G.S.forEach(S=>{ mmOn(S).forEach(o=>{ o.cond = Math.max(10, o.cond - 3); }); }); }
  if (G.min===0 && G.phase==="1h" && !G.ev.length) mmSay(G, -1, "ko", `Kick-off at ${mgVenue(G.f)}!`);
  const evs = G.ev.length;
  mmMinute(G);
  return G.ev.slice(evs);
}
function mmPens(G){
  const kick = s => { const S = G.S[s], k = mmOn(S).filter(o=>o.pos!=="GK").sort((a, b)=>mmSho(b) - mmSho(a)), gk = mmOn(G.S[1 - s]).find(o=>o.pos==="GK"); return {k, gk:gk ? mmEff(gk, G.S[1 - s]) : 45}; };
  const K = [kick(0), kick(1)], sc = [0, 0], log = [];
  for (let i = 0; i<30; i++){
    const s = i % 2, n = Math.floor(i/2), T = K[s], t = T.k[n % Math.max(1, T.k.length)];
    const p = t ? clamp(.76 + (mmSho(t) - T.gk)/250, .55, .93) : .6, in_ = Math.random()<p;
    if (in_) sc[s]++;
    log.push({s, n:t ? t.p.n : "?", in:in_});
    if (i>=9 && s===1 && sc[0]!==sc[1]) break;
    if (i<9){ const left0 = 5 - Math.ceil((i + 1)/2), left1 = 5 - Math.floor((i + 1)/2); if (sc[0] + left0<sc[1] || sc[1] + left1<sc[0]) break; }
  }
  G.pens = sc; G.penLog = log;
  mmSay(G, -1, "pens", `Penalties: ${G.S[0].club} ${sc[0]}–${sc[1]} ${G.S[1].club}.`, {log});
}
function mmFinish(G){
  const [H, A] = G.S, [hg, ag] = G.score;
  [H, A].forEach((S, s)=>{
    const gf = G.score[s], ga = G.score[1 - s], res = gf>ga ? .3 : gf<ga ? -.25 : 0;
    [...S.on, ...S.out].forEach(o=>{ const mins = o.mins; if (!mins) return;
      o.rt += res + (Math.random() - .5)*.7;
      if (ga===0 && ["GK","CB","LB","RB","LWB","RWB"].includes(o.pos) && mins>=60) o.rt += o.pos==="GK" ? .6 : .35;
      if (o.pos==="GK") o.rt -= Math.max(0, ga - 1)*.15;
      if (mins<25) o.rt = 6.2 + (o.rt - 6.2)*.5;
      o.rt = clamp(o.rt, 3.5, 10); });
  });
  const all = G.S.flatMap(S=>[...S.on, ...S.out]).filter(o=>o.mins>0);
  const potm = all.slice().sort((a, b)=>b.rt - a.rt)[0]; if (potm) potm.potm = 1;
  G.potm = potm ? {n:potm.p.n, club:G.S[G.S.findIndex(S=>S.on.includes(potm) || S.out.includes(potm))].club, rt:potm.rt} : null;
  const pens = G.pens;
  let dec = null;
  if (G.ko){ const agg = G.first ? [hg + G.first[0], ag + G.first[1]] : [hg, ag]; dec = {hg, ag, et:G.et, pens, w:pens ? (pens[0]>pens[1] ? H.club : A.club) : agg[0]>agg[1] ? H.club : A.club}; }
  G.dec = dec;
}
// the result in the form the season needs: per-player lines, goals, the winner of a knockout
function mmResult(G){
  const ps = [];
  G.S.forEach((S, s)=>[...S.on, ...S.out].forEach(o=>{ if (!o.mins && !o.start) return;
    ps.push({id:o.p.id, mins:o.mins, start:o.start, g:o.g, a:o.a, r:+o.rt.toFixed(1), yc:o.yc ? Math.min(2, o.yc) : 0, rc:o.rc || 0, cs:G.score[1 - s]===0 && o.mins>=60 && ["GK","CB","LB","RB","LWB","RWB"].includes(o.pos) ? 1 : 0, potm:o.potm || 0, drain:Math.max(0, (o.p.fit ?? 100) - o.cond), inj:o.inj}); }));
  return {hg:G.score[0], ag:G.score[1], ps, goals:G.goals || [], dec:G.dec, potm:G.potm, st:G.S.map(S=>S.st), poss:G.poss};
}
function mgMatchFast(f, userSide = -1){ const G = mmNew(f, userSide); G.auto = true; mmRun(G); return mmResult(G); }

/* ================= THE MATCH SCREEN ================= */
let LV = null;
const MG_SPEEDS = [1, 2, 4, 8];
function mgLive(f, onDone, opt = {}){
  const us = f.h===M.club ? 0 : 1, G = mmNew(f, us), watch = !!opt.watch;
  if (watch) G.auto = true;
  let speed = 2, hl = "ext"; try{ speed = +localStorage.getItem("efp-mg-speed") || 2; hl = localStorage.getItem("efp-mg-hl") || "ext"; }catch(e){}
  if (!MD_SHOW[hl]) hl = "ext";
  LV = {G, f, us, onDone, speed, paused:false, tab:"feed", feed:[], acc:0, last:0, shown:[0, 0], modal:null, shoutAt:-99, hl, raf:0, talkDone:watch, big:false, watch};
  const el = document.createElement("div"); el.id = "mgLive"; el.className = "mg-live"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Match");
  document.body.appendChild(el); document.documentElement.classList.add("mg-live-on");
  const [hk, ak] = mgKits(f.h, f.a);
  el.innerHTML = `<div class="mm-wrap">
    <div class="mm-top"><span class="mm-comp">${esc(mgCompName(f))}</span><button type="button" class="mm-x" data-mm="menu" aria-label="Match menu">⋯</button></div>
    <div class="mm-board" style="--c1:${hk[0]};--c2:${ak[0]}">
      <div class="mm-team h">${clubBadge(f.h, 30)}<b>${esc(crCode(f.h))}</b></div>
      <div class="mm-score"><span id="mmSc">0–0</span><span class="mm-clock" id="mmClock">0'</span></div>
      <div class="mm-team a"><b>${esc(crCode(f.a))}</b>${clubBadge(f.a, 30)}</div>
    </div>
    <div class="mm-scorers" id="mmScorers"></div>
    <div class="mm-pitchbox"><canvas id="mmCv" class="mm-cv"></canvas><div class="mm-flash" id="mmFlash" hidden></div></div>
    <div class="mm-tick" id="mmTick" aria-live="polite"></div>
    <div class="mm-mom" aria-hidden="true"><span id="mmMom"></span></div>
    <div class="mm-ctrl">
      <button type="button" class="mm-b" data-mm="pause" id="mmPause" aria-label="Pause">❚❚</button>
      <button type="button" class="mm-b" data-mm="speed" id="mmSpeed">${speed}×</button>
      ${watch ? `<span class="mm-b mm-watch">${esc(M.coach ? M.coach.n : "The coach")} in the dugout</span>` : `<button type="button" class="mm-b" data-mm="tactics">Tactics</button>
      <button type="button" class="mm-b" data-mm="subs">Subs <span id="mmSubsN">0/5</span></button>
      <button type="button" class="mm-b" data-mm="shout">Shout</button>`}
      <button type="button" class="mm-b" data-mm="big" id="mmBig" aria-pressed="false">Pitch ⤢</button>
      <button type="button" class="mm-b sim" data-mm="sim">Sim to end ⏭</button>
    </div>
    <div class="mm-tabs" role="tablist">${[["feed","Commentary"],["stats","Stats"],["rat","Ratings"]].map(([k, l])=>`<button type="button" role="tab" data-mm="tab" data-k="${k}" aria-selected="${k==="feed"}">${l}</button>`).join("")}</div>
    <div class="mm-body" id="mmBody"></div>
    <div class="mm-modal" id="mmModal" hidden></div>
  </div>`;
  el.addEventListener("click", mmClick);
  if (typeof SND!=="undefined"){ SND.ambient(true); SND.whistle(.5, 1); }
  mmFeed({m:0, s:-1, k:"ko", txt:`${f.h} v ${f.a} · ${mgVenue(f)}`});
  mdInit(G, us);
  mmPaintBody(); mmBoard();
  LV.last = performance.now();
  LV.raf = requestAnimationFrame(mmFrame);
}
function mmClose(){
  if (!LV) return; cancelAnimationFrame(LV.raf);
  if (typeof SND!=="undefined") SND.ambient(false);
  document.getElementById("mgLive")?.remove(); document.documentElement.classList.remove("mg-live-on");
  LV = null; MD = null;
}
function mmFrame(now){
  if (!LV) return;
  const dt = Math.min(.06, (now - LV.last)/1000); LV.last = now;
  const G = LV.G;
  if (!LV.paused && !LV.modal){
    const step = dt*LV.speed;
    mdUpdate(step);
    // the clock only runs while nothing's being acted out
    if (!G.done && !mdBusy()){ LV.acc += step; if (LV.acc>=(MD_SHOW[LV.hl] || MD_SHOW.ext).min){ LV.acc = 0; mmAdvance(); } }
    if (!mdBusy()){
      if (LV.wantSub){ const o = LV.wantSub; LV.wantSub = null; LV.forced = o; mmOpen("subs"); }
      else if (LV.wantTalk){ LV.wantTalk = false; mmOpen("talk"); }
      else if (G.done && !LV.ended) mmOpen("ft");
    }
  }
  mdDraw();
  LV.raf = requestAnimationFrame(mmFrame);
}
function mmAdvance(){
  const G = LV.G, evs = mmStep(G);
  // each event is acted out on the pitch (and reaches the commentary when it happens there), or shown now
  for (const e of evs) if (!mdEvent(e)) mmShow(e);
  if (G.needSub && G.user===LV.us){ LV.wantSub = G.needSub; G.needSub = null; }
  if (evs.some(e=>e.k==="ht") && !LV.talkDone) LV.wantTalk = true;
  mmBoard();
}
// an event reaches the screen: the commentary, the score, a sound
function mmShow(e){
  const G = LV.G;
  if (e.k==="goal"){ LV.shown[e.s]++; mmScorers(); mmFlash(e); if (typeof SND!=="undefined"){ SND.net(); if (e.s===LV.us) SND.roar(); else SND.groan(); } }
  else if (["save","post"].includes(e.k)){ if (typeof SND!=="undefined") SND.ooh(); }
  else if (e.k==="miss" && typeof SND!=="undefined") SND.groan();
  else if (["ht","ft"].includes(e.k) && typeof SND!=="undefined") SND.whistle(.5, e.k==="ft" ? 3 : 2);
  else if (["yellow","red"].includes(e.k) && typeof SND!=="undefined" && LV.speed>4) SND.whistle(.4, 1);
  mmFeed(e);
  mmBoard();
}
function mmFeed(e){
  LV.feed.unshift(e);
  const t = document.getElementById("mmTick"); if (t && e.txt){ t.innerHTML = `<b>${e.k==="ko" && !e.m ? "" : e.m + "'"}</b> ${esc(e.txt)}`; t.className = `mm-tick k-${e.k} ${e.s===LV.us ? "us" : e.s>=0 ? "them" : ""}`; }
  if (LV.tab==="feed") mmPaintBody();
}
const MM_IC = {goal:"⚽", save:"🧤", post:"▮", miss:"✕", block:"⛉", yellow:"<i class='mm-card y'></i>", red:"<i class='mm-card r'></i>", inj:"✚", sub:"⇄", ht:"⏸", ft:"⏹", et:"⏱", pens:"◎", ko:"▶", info:"·", shout:"📣", talk:"🗣", corner:"◣", foul:"!", off:"⚑", play:"›"};
function mmBoard(){
  const G = LV.G, sc = document.getElementById("mmSc"), ck = document.getElementById("mmClock");
  if (sc) sc.textContent = `${LV.shown[0]}–${LV.shown[1]}${G.pens && G.done && !mdBusy() ? ` (${G.pens[0]}–${G.pens[1]}p)` : ""}`;
  if (ck) ck.textContent = G.phase==="ht" ? "HT" : G.done ? "FT" : G.phase==="et0" ? "ET" : `${mmMinTxt(G)}'`;
  const mom = document.getElementById("mmMom"); if (mom){ const v = G.mom; mom.style.setProperty("--m", ((v + 1)/2*100).toFixed(1) + "%"); }
  const n = document.getElementById("mmSubsN"); if (n) n.textContent = `${G.S[LV.us].subs}/5`;
}
function mmScorers(){
  const G = LV.G, el = document.getElementById("mmScorers"); if (!el) return;
  const shown = (G.goals || []).slice(0, LV.shown[0] + LV.shown[1]);
  const side = s => shown.filter(g=>g.side===s).map(g=>`${esc(mgSurname(g.n))} ${g.m}'${g.pen ? " (p)" : ""}`).join(", ");
  el.innerHTML = `<span>${side(0)}</span><span>${side(1)}</span>`;
}
function mmFlash(e){
  const el = document.getElementById("mmFlash"); if (!el) return;
  const c = mgKits(LV.G.S[0].club, LV.G.S[1].club)[e.s];
  el.hidden = false; el.style.setProperty("--fc", c[0]); el.innerHTML = `<span class="mm-goal">GOAL!</span><span class="mm-goal-n">${esc(e.n)}</span>`;
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  clearTimeout(LV.flashT); LV.flashT = setTimeout(()=>{ el.hidden = true; }, 2200/Math.max(1, LV.speed/2));
}
function mmPaintBody(){
  const b = document.getElementById("mmBody"); if (!b || !LV) return;
  const G = LV.G;
  if (LV.tab==="feed"){ b.innerHTML = `<ol class="mm-feed">${LV.feed.slice(0, 90).map(e=>`<li class="k-${e.k} ${["corner","foul","off","play"].includes(e.k) ? "minor" : ""} ${e.s===LV.us ? "us" : e.s>=0 ? "them" : ""}"><span class="mm-m">${e.k==="ko" && !e.m ? "" : e.m + "'"}</span><span class="mm-ic">${MM_IC[e.k] || "·"}</span><span class="mm-t">${esc(e.txt)}</span></li>`).join("")}</ol>`; return; }
  if (LV.tab==="stats"){
    const [h, a] = G.S.map(S=>S.st), tp = G.poss[0] + G.poss[1] || 1, row = (l, x, y, fmt = v=>v) => { const t = (+x) + (+y) || 1; return `<div class="mm-st"><b>${fmt(x)}</b><span>${l}</span><b>${fmt(y)}</b><i style="--p:${(x/t*100).toFixed(0)}%"></i></div>`; };
    b.innerHTML = `<div class="mm-stats">${row("Possession", Math.round(G.poss[0]/tp*100), Math.round(G.poss[1]/tp*100), v=>v + "%")}${row("Shots", h.sh, a.sh)}${row("On target", h.ont, a.ont)}${row("Expected goals", +h.xg.toFixed(2), +a.xg.toFixed(2), v=>(+v).toFixed(2))}${row("Corners", h.cor, a.cor)}${row("Offsides", h.off, a.off)}${row("Fouls", h.fou, a.fou)}${row("Yellow cards", h.yc, a.yc)}${row("Red cards", h.rc, a.rc)}${row("Saves", h.sav, a.sav)}</div>`; return; }
  const S = G.S[LV.us], rows = [...S.on, ...S.out].filter(o=>o.mins>0 || !o.off);
  b.innerHTML = `<div class="mm-rat">${rows.map(o=>`<div class="mm-r ${o.off ? "off" : ""}"><span class="mg-pos p-${MG_GROUP(o.pos)}">${o.pos}</span><span class="mm-rn">${esc(mgShort(o.p.n))}${o.g ? ` <i class="mm-g">${"⚽".repeat(o.g)}</i>` : ""}${o.yc ? `<i class='mm-card ${o.rc ? "r" : "y"}'></i>` : ""}${o.inj ? " ✚" : ""}</span><span class="mm-cond"><i style="width:${Math.round(o.cond)}%"></i></span><b class="mg-rt ${mmRtCls(o.rt)}">${o.rt.toFixed(1)}</b></div>`).join("")}</div>`;
}
const mmRtCls = r => r>=8 ? "r-hi" : r>=7 ? "r-good" : r>=6.3 ? "r-ok" : "r-low";

/* ---------- the touchline ---------- */
function mmOpen(k){ LV.modal = k; mmModal(); }
function mmShut(){ LV.modal = null; const m = document.getElementById("mmModal"); if (m){ m.hidden = true; m.innerHTML = ""; } }
function mmModal(){
  const m = document.getElementById("mmModal"), G = LV.G, S = G.S[LV.us], k = LV.modal; if (!m) return;
  m.hidden = false;
  if (k==="talk"){
    const gd = G.score[LV.us] - G.score[1 - LV.us];
    m.innerHTML = `<div class="mm-card-in"><div class="eyebrow">Half-time team talk</div><h3>${gd>0 ? "You're ahead" : gd<0 ? "You're behind" : "All square"} · ${G.score[0]}–${G.score[1]}</h3>
      <p class="hint">What do you say in the dressing room?</p>
      <div class="mm-opts">${[["calm","Stay calm, keep doing what we're doing"],["enc","Encourage them: you can do this"],["praise","Praise them: brilliant so far"],["demand","Demand more: this isn't good enough"],["crit","Criticise them: that was unacceptable"]].map(([v, l])=>`<button type="button" class="btn" data-mm="talk" data-v="${v}">${l}</button>`).join("")}</div></div>`;
  } else if (k==="subs"){
    const off = mmOn(S).sort((a, b)=>MG_FORM_ORDER(a.pos) - MG_FORM_ORDER(b.pos)), bench = S.bench.filter(b=>!b.used);
    LV.subOff = LV.subOff && off.includes(LV.subOff) ? LV.subOff : LV.forced || null; LV.subOn = LV.subOn && bench.some(b=>b.p===LV.subOn) ? LV.subOn : null;
    m.innerHTML = `<div class="mm-card-in"><div class="eyebrow">Substitutions · ${S.subs}/5 used</div><h3>${LV.forced ? `${esc(mgShort(LV.forced.p.n))} is injured: bring someone on` : "Make a change"}</h3>
      <div class="mm-subs"><div><div class="label">Coming off</div>${off.map(o=>`<button type="button" class="mm-sp ${LV.subOff===o ? "on" : ""}" data-mm="soff" data-i="${S.on.indexOf(o)}"><span class="mg-pos p-${MG_GROUP(o.pos)}">${o.pos}</span><span>${esc(mgShort(o.p.n))}</span><span class="mm-cond"><i style="width:${Math.round(o.cond)}%"></i></span><b class="mg-rt ${mmRtCls(o.rt)}">${o.rt.toFixed(1)}</b></button>`).join("")}</div>
      <div><div class="label">Going on</div>${bench.length ? bench.map(b=>`<button type="button" class="mm-sp ${LV.subOn===b.p ? "on" : ""}" data-mm="son" data-id="${esc(b.p.id)}"><span class="mg-pos p-${MG_GROUP(b.p.pos)}">${b.p.pos}</span><span>${esc(mgShort(b.p.n))}</span><b class="mg-ovr sm">${LV.subOff ? mgOvrAt(b.p, LV.subOff.pos) : mgOvr(b.p)}</b></button>`).join("") : `<p class="hint">Nobody left on the bench.</p>`}</div></div>
      <div class="row"><button type="button" class="btn primary" data-mm="dosub" ${LV.subOff && LV.subOn && S.subs<5 ? "" : "disabled"}>Make the change</button><button type="button" class="btn" data-mm="shut">${LV.forced ? "Play on with 10" : "Done"}</button></div></div>`;
  } else if (k==="tactics"){
    const t = S.tac;
    const seg = (key, labels) => `<div class="mg-seg">${labels.map((l, i)=>`<button type="button" data-mm="tac" data-k="${key}" data-v="${i}" aria-pressed="${t[key]===i}">${l}</button>`).join("")}</div>`;
    m.innerHTML = `<div class="mm-card-in"><div class="eyebrow">Tactics</div><h3>${esc(S.form)} · ${MG_MENT[t.ment]}</h3>
      <div class="label">Mentality</div><div class="mg-seg ment">${MG_MENT.map((l, i)=>`<button type="button" data-mm="tac" data-k="ment" data-v="${i}" aria-pressed="${t.ment===i}">${l.replace("Ultra ", "Ultra ")}</button>`).join("")}</div>
      <div class="label">Tempo</div>${seg("tempo", ["Slow","Normal","Fast"])}
      <div class="label">Pressing</div>${seg("press", ["Stand off","Normal","High press"])}
      <div class="label">Passing</div>${seg("pass", ["Short","Mixed","Direct"])}
      <div class="label">Defensive line</div>${seg("line", ["Deep","Normal","High"])}
      <div class="row"><button type="button" class="btn primary" data-mm="shut">Back to the match</button></div></div>`;
  } else if (k==="shout"){
    const cool = G.min - LV.shoutAt<10;
    m.innerHTML = `<div class="mm-card-in"><div class="eyebrow">Touchline shout</div><h3>${cool ? "They heard you. Give it a few minutes." : "Get your message across"}</h3>
      <div class="mm-opts">${[["enc","Encourage","A lift for everyone"],["demand","Demand more","Risky, but it can spark them"],["focus","Focus","Fewer mistakes and cards"],["push","Push forward","More attacking for 15 minutes"],["tight","Tighten up","Protect what you have for 15 minutes"]].map(([v, l, d])=>`<button type="button" class="btn" data-mm="shoutdo" data-v="${v}" ${cool ? "disabled" : ""}><b>${l}</b><small>${d}</small></button>`).join("")}</div>
      <div class="row"><button type="button" class="btn" data-mm="shut">Close</button></div></div>`;
  } else if (k==="menu"){
    m.innerHTML = `<div class="mm-card-in"><div class="eyebrow">Match</div><h3>Highlights</h3>
      <p class="hint">How much of the match is played out on the pitch. The full match is the longest; commentary only is the quickest.</p>
      <div class="mg-seg">${[["full","Full match"],["ext","Extended"],["key","Key moments"],["none","Commentary only"]].map(([v, l])=>`<button type="button" data-mm="hl" data-v="${v}" aria-pressed="${LV.hl===v}">${l}</button>`).join("")}</div>
      <div class="row"><button type="button" class="btn" data-mm="sim">Sim to the end</button><button type="button" class="btn primary" data-mm="shut">Back to the match</button></div></div>`;
  } else if (k==="ft"){
    LV.ended = true;
    const r = mmResult(G), my = G.S[LV.us], gd = G.score[LV.us] - G.score[1 - LV.us], won = G.dec ? G.dec.w===M.club : gd>0;
    const top = [...my.on, ...my.out].filter(o=>o.mins>0).sort((a, b)=>b.rt - a.rt).slice(0, 3);
    m.innerHTML = `<div class="mm-card-in ft"><div class="eyebrow">Full-time${G.et ? " · after extra time" : ""}</div>
      <div class="mm-ft-score"><span>${clubBadge(G.S[0].club, 34)}</span><b>${G.score[0]}–${G.score[1]}</b><span>${clubBadge(G.S[1].club, 34)}</span></div>
      ${G.pens ? `<p class="mm-ft-pens">${G.pens[0]}–${G.pens[1]} on penalties</p>` : ""}
      <p class="mm-ft-v ${won ? "w" : gd<0 || (G.dec && !won) ? "l" : "d"}">${won ? "Victory" : gd<0 || (G.dec && !won) ? "Defeat" : "Draw"}</p>
      ${G.potm ? `<p class="hint">Player of the Match: <b>${esc(G.potm.n)}</b> (${esc(G.potm.club)}) · ${G.potm.rt.toFixed(1)}</p>` : ""}
      <div class="mm-top3">${top.map(o=>`<div><b class="mg-rt ${mmRtCls(o.rt)}">${o.rt.toFixed(1)}</b><span>${esc(mgShort(o.p.n))}</span></div>`).join("")}</div>
      ${LV.watch ? "" : `<div class="label">Post-match words</div>
      <div class="mg-seg">${[["praise","Praise"],["enc","Encourage"],["crit","Criticise"]].map(([v, l])=>`<button type="button" data-mm="post" data-v="${v}" aria-pressed="${LV.post===v}">${l}</button>`).join("")}</div>`}
      <div class="row"><button type="button" class="btn primary big" data-mm="done">Continue</button></div></div>`;
  }
}
const MG_FORM_ORDER = pos => ["GK","RB","RWB","CB","LB","LWB","CDM","CM","RM","LM","CAM","RW","LW","ST"].indexOf(pos);
function mmClick(e){
  const b = e.target.closest("[data-mm]"); if (!b || !LV) return;
  const a = b.dataset.mm, G = LV.G, S = G.S[LV.us];
  if (a==="pause"){ LV.paused = !LV.paused; b.textContent = LV.paused ? "▶" : "❚❚"; b.setAttribute("aria-label", LV.paused ? "Play" : "Pause"); }
  else if (a==="speed"){ LV.speed = MG_SPEEDS[(MG_SPEEDS.indexOf(LV.speed) + 1) % MG_SPEEDS.length]; b.textContent = LV.speed + "×"; try{ localStorage.setItem("efp-mg-speed", LV.speed); }catch(err){} }
  else if (a==="tab"){ LV.tab = b.dataset.k; document.querySelectorAll('[data-mm="tab"]').forEach(x=>x.setAttribute("aria-selected", x===b)); mmPaintBody(); }
  else if (["tactics","subs","shout","menu"].includes(a)){ if (!G.done && (a==="menu" || !LV.watch)) mmOpen(a); }
  else if (a==="shut"){ LV.forced = null; LV.subOff = LV.subOn = null; mmShut(); }
  else if (a==="hl"){ LV.hl = b.dataset.v; try{ localStorage.setItem("efp-mg-hl", LV.hl); }catch(err){} mmModal(); }
  else if (a==="big"){ LV.big = !LV.big; b.setAttribute("aria-pressed", LV.big); document.querySelector(".mm-wrap")?.classList.toggle("big", LV.big); }
  else if (a==="tac"){ mgxFxMark(G, LV.us, "tac"); S.tac[b.dataset.k] = +b.dataset.v; if (b.dataset.k==="ment") mmSay(G, LV.us, "info", `You switch to ${MG_MENT[S.tac.ment].toLowerCase()}.`); mmRate(S); mmModal(); }
  else if (a==="soff"){ LV.subOff = S.on[+b.dataset.i]; mmModal(); }
  else if (a==="son"){ LV.subOn = S.bench.find(x=>x.p.id===b.dataset.id)?.p || null; mmModal(); }
  else if (a==="dosub"){ mgxFxMark(G, LV.us, "sub"); if (LV.subOff && LV.subOn && mmSub(G, LV.us, LV.subOff, LV.subOn)){ mmFeed(G.ev[G.ev.length - 1]); LV.forced = null; LV.subOff = LV.subOn = null; mmBoard(); mmShut(); } }
  else if (a==="shoutdo"){ mgxFxMark(G, LV.us, "shout"); mmShout(b.dataset.v); mmShut(); }
  else if (a==="talk"){ mmTalk(b.dataset.v); LV.talkDone = true; mmShut(); }
  else if (a==="post"){ LV.post = b.dataset.v; mmModal(); }
  else if (a==="sim"){ G.auto = true; mdStop(); mmRun(G); LV.shown = G.score.slice(); LV.feed = G.ev.slice().reverse(); mmScorers(); mmBoard(); mmPaintBody(); LV.modal = null; mmOpen("ft"); }
  else if (a==="done"){ mmEnd(); }
}
function mmShout(k){
  const G = LV.G, S = G.S[LV.us], gd = G.score[LV.us] - G.score[1 - LV.us]; LV.shoutAt = G.min;
  let txt = "";
  if (k==="enc"){ S.boost = gd<=0 ? 1 : .5; S.boostT = 10; txt = "You urge your players on from the touchline."; }
  else if (k==="demand"){ const ok = Math.random()<(gd<0 ? .6 : .4); S.boost = ok ? 2 : -1; S.boostT = 15; txt = ok ? "You demand more, and they respond!" : "Your demands fall flat: heads go down."; }
  else if (k==="focus"){ S.focus = .8; setTimeout(()=>{ if (LV) S.focus = 0; }, 15000); txt = "You tell them to concentrate."; }
  else if (k==="push"){ S.push = 1; S.pushT = 15; txt = "You wave your team forward."; }
  else if (k==="tight"){ S.push = -1; S.pushT = 15; txt = "You signal to tighten up."; }
  mmRate(S); mmFeed(mmSay(G, LV.us, "shout", txt));
}
function mmTalk(k){
  const G = LV.G, S = G.S[LV.us], gd = G.score[LV.us] - G.score[1 - LV.us];
  const fx = {calm:gd>0 ? 1 : 0, enc:gd<=0 ? 1.2 : .4, praise:gd>0 ? 1.2 : -.6, demand:gd<0 ? (Math.random()<.6 ? 1.8 : -1) : gd===0 ? .6 : -.5, crit:gd<0 ? (Math.random()<.5 ? 2 : -1.5) : -1.2}[k];
  S.boost = fx; S.boostT = 30; mmRate(S);
  mmFeed(mmSay(G, LV.us, "talk", fx>=1 ? "The team talk fires them up!" : fx>0 ? "The players nod and head back out." : "The team talk goes down badly."));
  mgMine().forEach(p=>{ p.mor = clamp(p.mor + fx*1.5, 0, 100); });
}
function mmEnd(){
  const G = LV.G, f = LV.f, r = mmResult(G), done = LV.onDone, post = LV.post;
  if (post){ const gd = G.score[LV.us] - G.score[1 - LV.us], v = {praise:gd>=0 ? 3 : -2, enc:gd<0 ? 2 : 1, crit:gd<0 ? (Math.random()<.5 ? 2 : -4) : -4}[post]; mgMine().forEach(p=>{ p.mor = clamp(p.mor + v, 0, 100); }); }
  mmClose();
  if (done) done(f, r);
}
