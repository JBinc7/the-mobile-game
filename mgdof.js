/* ================= DIRECTOR OF FOOTBALL =================
   The third career. You run the club, not the team: a head coach picks the side, the tactics and the training, and
   you decide who the coach is, which players he has and what the club can afford. It's the same world as manager
   mode (manager.js), with the save's role set to "dof":
   - The head coach: a style (possession, gegenpress, counter-attack, direct, wing play, balanced, defensive) and a
     formation he plays it in, ratings for tactics (how well his teams play), motivation (the squad's morale),
     development (how fast players improve) and youth (how readily he picks young players), a wage, a contract, a
     record, and a mood. He asks you for signings, complains when you sell his best players, can be poached by a
     bigger club, and resigns if he's miserable for long enough.
   - Sacking him costs half his remaining wages; an interim (his assistant) takes over until you hire someone from the
     market: coaches out of work, and coaches at other clubs, whose clubs want compensation.
   - The owner judges you on results and on the books: a profit target and wages kept below a share of revenue, on
     top of the league, cup and Europe. You set ticket prices and invest in the training ground and the academy.
   Loaded after mgmatch.js, before mgui.js. */
const mgDof = () => !!(M && M.role==="dof");
const MDF_STYLES = {
  "Possession":{f:["4-3-3","4-2-3-1"], ment:2, tempo:0, press:1, width:1, pass:0, line:2, tst:"Tiki-taka", focus:"pos", int:1},
  "Gegenpress":{f:["4-3-3","4-2-3-1","4-1-2-1-2"], ment:3, tempo:2, press:2, width:1, pass:1, line:2, tst:"Gegenpress", focus:"fit", int:2},
  "Counter-attack":{f:["4-4-2","4-5-1","5-3-2"], ment:1, tempo:2, press:0, width:1, pass:2, line:0, tst:"Counter", focus:"def", int:1},
  "Direct":{f:["4-4-2","3-5-2"], ment:2, tempo:2, press:1, width:1, pass:2, line:1, tst:"Route one", focus:"att", int:1},
  "Wing play":{f:["4-4-2","3-4-3","4-3-3"], ment:2, tempo:1, press:1, width:2, pass:1, line:1, tst:"Wing play", focus:"att", int:1},
  "Balanced":{f:["4-2-3-1","4-3-3","4-4-2"], ment:2, tempo:1, press:1, width:1, pass:1, line:1, tst:"Balanced", focus:"bal", int:1},
  "Defensive":{f:["5-3-2","4-5-1","4-1-2-1-2"], ment:1, tempo:0, press:0, width:0, pass:2, line:0, tst:"Park the bus", focus:"def", int:0}
};
const MDF_BG = [["scout","Chief scout","You found players for a living. Your scouts know more from day one."], ["analyst","Data analyst","Numbers first. The owner trusts your judgement on value."],
  ["player","Former player","A big name in the game. Coaches and players listen."], ["business","Business","You know money. The owner gives you a little more to spend."]];

/* ---------- coaches ---------- */
const mdfNeed = club => Math.round(clamp((mgRep(club) - .55)/.5, 0, 1)*80 + (isTop(mgTierOf(club)) ? 6 : 0));
const mdfWage = (rep, t) => mgRoundWage((MG_WAGE[t] || 2000)*.5*Math.exp(rep/45));
function mdfCoach(R, o){
  const rep = Math.round(o.rep), r = (b = 0) => Math.round(clamp(rep + b + mgGauss(R)*11, 20, 98));
  const style = o.style || mgPick(R, Object.keys(MDF_STYLES)), nat = o.nat || (R()<.55 ? mgCountry(M.club || "") : mgPick(R, SQ_FOREIGN));
  return {n:o.n || mgName(R, SQ_NAMES[nat] ? nat : "England"), nat:SQ_NAMES[nat] ? nat : "England", age:o.age || 36 + Math.floor(R()*26), rep, tac:r(), mot:r(), dev:r(-3), yth:Math.round(clamp(45 + mgGauss(R)*20, 8, 96)),
    style, f:o.f || mgPick(R, MDF_STYLES[style].f), wage:mdfWage(rep, mgLeagueOf() ?? 1), con:M.season + 1 + Math.floor(R()*3), since:M.season,
    rec:{p:0, w:0, d:0, l:0, pts:0, xp:0}, tot:{p:0, w:0, d:0, l:0}, mood:72, club:o.club || null, int:!!o.int};
}
const mdfMood = m => m>=75 ? "Happy" : m>=55 ? "Content" : m>=38 ? "Frustrated" : m>=22 ? "Unhappy" : "Furious";
const mdfPerf = c => c && c.rec.p ? c.rec.pts - c.rec.xp : 0;
const mdfPerfTxt = c => { const d = mdfPerf(c); return !c || !c.rec.p ? "No games yet" : d>=4 ? `Overachieving (+${d.toFixed(1)} pts)` : d<=-4 ? `Underachieving (${d.toFixed(1)} pts)` : `As expected (${d>=0 ? "+" : ""}${d.toFixed(1)} pts)`; };
// the coach in charge when you arrive: whoever the club had, as good as the club
function mdfFirstCoach(club){
  const R = mgR(`${M.seed}|coach|${club}|${M.season}`);
  return mdfCoach(R, {n:M.am[club] || mgAiManager(club), rep:clamp(mdfNeed(club) + mgGauss(R)*8, 12, 92)});
}
// his assistant, until you appoint someone
function mdfInterim(old){
  const R = Math.random, c = mdfCoach(R, {rep:Math.max(10, (old ? old.rep : 40)*.55), style:"Balanced", int:true});
  c.tac = Math.min(c.tac, 52); c.con = M.season; c.wage = mgRoundWage(c.wage*.4); c.mood = 60;
  return c;
}
// the coach sets up his team: his formation, his style, the mentality for this opponent, his XI
function mdfPrep(f){
  if (!mgDof() || !M.coach) return;
  const C = M.coach, S = MDF_STYLES[C.style] || MDF_STYLES.Balanced;
  if (M.tac.f!==C.f){ M.tac.f = C.f; M.tac.fam[C.f] ??= 60; }
  Object.assign(M.tac, {tempo:S.tempo, press:S.press, width:S.width, pass:S.pass, line:S.line, style:S.tst});
  let ment = S.ment;
  if (f){ const opp = f.h===M.club ? f.a : f.h, gap = mgLevel(M.club) - mgLevel(opp); if (gap>5) ment++; if (gap<-6) ment--; }
  M.tac.ment = clamp(ment, 0, 4);
  mdfPick();
}
function mdfPick(){
  const C = M.coach, bias = p => p.age<=21 ? ((C ? C.yth : 50) - 50)/18 : 0;
  const pool = mgMine().filter(mgAvail).map(p=>({p, b:bias(p)}));
  // youth-minded coaches give the kids a little more benefit of the doubt
  const shadow = pool.map(({p, b})=>({...p, mor:p.mor + b*20}));
  const A = mgAutoXI(M.club, M.tac.f, shadow);
  M.tac.xi = A.xi.map(p=>p ? p.id : null); M.tac.bench = A.subs.map(p=>p.id);
  mgMendXI(true);
}
// how much better (or worse) the team plays for him, in rating points
function mdfBoost(home){
  if (!mgDof() || !M.coach) return 0;
  const C = M.coach, tix = M.fin.tix ?? 1;
  return (C.tac - 60)/18 + (C.mood<30 ? -.6 : 0) + (C.int ? -.8 : 0) + (home ? (tix===0 ? .25 : tix===2 ? -.2 : 0) : 0);
}
function mdfTrain(){ const C = M.coach, S = MDF_STYLES[C ? C.style : "Balanced"] || MDF_STYLES.Balanced; M.train = {focus:S.focus, int:S.int, ind:M.train ? M.train.ind : [], mult:mdfDevMult()}; }
const mdfDevMult = () => 1 + ((M.coach ? M.coach.dev : 60) - 60)/120 + (((M.fac && M.fac.train) || 3) - 3)*.08;

/* ---------- starting out ---------- */
function mdfSetup(club){
  const c = M.cl[club];
  M.coach = mdfFirstCoach(club); M.am[club] = M.coach.n; c.mg = M.coach.n;
  const S = MDF_STYLES[M.coach.style];
  M.tac.f = M.coach.f; M.tac.fam = {[M.coach.f]:88};
  Object.assign(M.tac, {ment:S.ment, tempo:S.tempo, press:S.press, width:S.width, pass:S.pass, line:S.line, style:S.tst});
  mdfPick(); mdfTrain();
  M.fin.tix = 1;
  const t = mgLeagueOf(), base = clamp(Math.round(1.5 + (mgRep(club) - .55)/.12), 1, 5);
  M.fac = {train:base, acad:clamp(base - (isTop(t) ? 0 : 1) + (SELLERS.has(club) ? 1 : 0), 1, 5), job:null};
  M.cands = null; M.creq = null;
  if (M.mgr.bg==="business") M.fin.tb = mgRoundFee(M.fin.tb*1.12);
  if (M.mgr.bg==="scout") MG_PLAYABLE.forEach(k=>M.tiers[k].forEach(cl=>{ if (cl!==club && mgTierOf(cl)===t) mgSquad(cl).forEach(p=>{ M.kn[p.id] = 100; }); }));
}
function mdfWelcome(){
  const C = M.coach, o = M.board.obj.map(x=>`• ${x.t} (${x.imp})`).join("\n");
  return `The owner welcomes you as ${M.club}'s new Director of Football.\n\nThe head coach is ${C.n} (${C.style}, ${C.f}), on a contract until ${C.con + 1}. You can keep him, or find your own man.\n\nYour transfer budget is ${mgMoney(M.fin.tb)} and your wage budget is ${mgWageTxt(M.fin.wb)}.\n\nThis season the owner expects:\n${o}\n\nResults count, and so do the books: every pound you spend on fees and wages has to be paid for, so sell before you buy.`;
}
// what the club should take in over a season, roughly
function mdfRevEst(){
  const t = mgLeagueOf(), homes = Math.round(mgRounds(t)/2);
  return (MG_TV[t] || 2e5)*1.3 + mgGate()*homes + mgCommercial(M.club);
}
// the stadium, the staff, travel and the rest: a share of what the club takes in, more with better buildings
function mdfOpsShare(){ const t = mgLeagueOf(), F = M.fac || {train:3, acad:3}; return (isTop(t) && TIERS[t].level===1 ? .36 : .28) + (F.train + F.acad - 6)*.012; }
const mdfOpsWeek = () => Math.round(mdfRevEst()*mdfOpsShare()/52);
function mdfObjectives(o){
  const t = mgLeagueOf(), top = isTop(t) && TIERS[t].level===1, rev = mdfRevEst();
  const loss = top && mgRep(M.club)>.85 ? 0 : -mgRoundFee(rev*(top ? .04 : .08));
  const keep = o.filter(x=>x.k!=="wage");
  keep.push({k:"profit", n:loss, t:loss>=0 ? "Make a profit this season" : `Lose no more than ${mgMoney(-loss)} this season`, imp:"High", w:2});
  keep.push({k:"wagerev", n:top ? .7 : .85, t:`Keep wages below ${top ? 70 : 85}% of revenue`, imp:"Medium", w:1});
  return keep;
}
const mdfSeasonMoney = () => { const F = M.fin, inc = Object.values(F.inc || {}).reduce((s, v)=>s + v, 0), exp = Object.entries(F.exp || {}).reduce((s, [k, v])=>s + (k==="build" ? 0 : v), 0); return {inc, exp, profit:inc - exp, wr:inc ? (F.exp.wages || 0)/inc : 0}; };
function mdfObjState(o){
  const m = mdfSeasonMoney();
  if (o.k==="profit") return {c:m.profit>=o.n ? "ok" : "bad", txt:`${m.profit>=0 ? "Profit" : "Loss"} so far: ${mgMoney(Math.abs(m.profit))} (TV money comes in the summer)`};
  if (o.k==="wagerev") return {c:!m.inc ? "" : m.wr<=o.n ? "ok" : "bad", txt:m.inc ? `${Math.round(m.wr*100)}% so far` : "No income yet"};
  return null;
}
function mdfObjMet(o){ const m = mdfSeasonMoney(); if (o.k==="profit") return {met:m.profit>=o.n, note:`${m.profit>=0 ? "Profit" : "Loss"}: ${mgMoney(Math.abs(m.profit))}`}; if (o.k==="wagerev") return {met:m.wr<=o.n, note:`Wages ${Math.round(m.wr*100)}% of revenue`}; return null; }

/* ---------- the week ---------- */
function mdfWeekly(){
  const C = M.coach; if (!C) return;
  // his man-management sets the dressing room's mood; his training, how fast they improve
  mgMine().forEach(p=>{ p.mor = clamp(p.mor + (C.mot - 60)*.025, 5, 100); });
  mdfTrain();
  // a new formation is learned on the training ground
  if (M.tac.f!==C.f){ M.tac.f = C.f; M.tac.fam[C.f] ??= 60; }
  // facilities being built
  if (M.fac && M.fac.job && (M.fac.job.d -= 7)<=0){ const k = M.fac.job.k; M.fac[k] = Math.min(5, M.fac[k] + 1); M.fac.job = null; if (k==="acad") M.acad = null;
    mgMail("board", `${k==="train" ? "Training ground" : "Academy"} upgraded`, `The work's finished: the ${k==="train" ? "training ground" : "academy"} is now ${"★".repeat(M.fac[k])}.`); }
  mgFinAdd("exp", "ops", mdfOpsWeek());
  if (M.phase!=="season") return;
  // the owner wants a proper coach, and money that adds up
  if (C.int){ C.wk = (C.wk || 0) + 1; if (C.wk>=4) mgBoardShift(-.5, "No permanent head coach"); }
  if (M.fin.bal<0) mgBoardShift(-.4, "The club's in the red");
  // the coach asks for a player, mostly while a window's open
  if (!C.int && !M.creq && Math.random()<(mgInWindow() ? .22 : .04)) mdfRequest();
  // an unhappy coach can walk out
  if (!C.int){ if (C.mood<25) C.low = (C.low || 0) + 1; else C.low = 0;
    if (C.low>=3 && Math.random()<.2){ mgMail("board", `${C.n} resigns`, `${C.n} has resigned as head coach. He says he no longer has the backing he needs. His assistant takes charge for now: find a new head coach.`, {stop:1}); mdfVacate(); return; } }
  // a bigger club comes for a coach who's doing well
  if (!C.int && mgInWindow() && C.rec.p>=8 && mdfPerf(C)>5 && Math.random()<.04) mdfPoach();
}
function mdfRequest(){
  if (mgxPlanOpen()) return;
  const T = M.tac, slots = MG_FORM[T.f], lv = mgLevel(M.club);
  let wi = -1, wv = 99; T.xi.forEach((id, i)=>{ const p = M.P[id], v = p ? mgOvrAt(p, slots[i][0]) : 0; if (v<wv){ wv = v; wi = i; } });
  if (wi<0 || wv>=lv + 2) return;
  const pos = slots[wi][0], cur = M.P[T.xi[wi]];
  M.creq = {pos:pos==="LWB" ? "LB" : pos==="RWB" ? "RB" : pos, need:Math.max(wv + 2, Math.round(lv)), d:M.day, until:mgInWindow() ? (mgDate(M.day).getUTCMonth()===0 ? MGD(M.season + 1, 1, 1) : MGD(M.season, 8, 1)) : M.day + 120};
  mgMail("board", `${M.coach.n} wants a ${M.creq.pos}`, `Your head coach has asked for a new ${MG_POS_NAME[M.creq.pos] || M.creq.pos}: someone rated ${M.creq.need} or better${cur ? ` to replace ${cur.n} (${mgOvrAt(cur, pos)} there)` : ""}. Deliver, and he'll be pleased.`, {stop:1});
}
const MG_POS_NAME = {GK:"goalkeeper", CB:"centre-back", LB:"left-back", RB:"right-back", CDM:"defensive midfielder", CM:"central midfielder", CAM:"attacking midfielder", LM:"left midfielder", RM:"right midfielder", LW:"left winger", RW:"right winger", ST:"striker"};
// a signing (or loan) the coach asked for?
function mdfArrived(q){
  const R = M.creq, C = M.coach; if (!mgDof() || !C || C.int) return;
  if (mgxPlanArrived(q)) return;
  if (R && (q.pos===R.pos || (q.alt || []).includes(R.pos)) && mgOvrAt(q, R.pos)>=R.need){ C.mood = clamp(C.mood + 12, 0, 100); M.creq = null;
    mgMail("board", `${C.n} is delighted`, `"${q.n} is exactly what I asked for. Thank you."`); }
  else C.mood = clamp(C.mood + 2, 0, 100);
}
// selling one of his best players annoys him
function mdfSold(p){
  const C = M.coach; if (!mgDof() || !C || C.int) return;
  const top = mgMine().concat([p]).sort((a, b)=>mgOvr(b) - mgOvr(a)).slice(0, 5);
  if (top.includes(p)){ C.mood = clamp(C.mood - 10, 0, 100); mgMail("board", `${C.n} isn't happy`, `"I didn't want to lose ${p.n}. He was one of my most important players."`); }
}
function mdfWindowShut(){
  const C = M.coach, R = M.creq; if (!mgDof() || !C) return;
  if (R && M.day>=R.until){ C.mood = clamp(C.mood - 8, 0, 100); M.creq = null; if (!C.int) mgMail("board", `${C.n} is frustrated`, `"I asked for a ${R.pos} and didn't get one."`); }
}
// after each of the club's matches: his record, and his mood
function mdfAfterMatch(res, pts, exp){
  const C = M.coach; if (!mgDof() || !C) return;
  C.rec.p++; C.rec.pts += pts; C.rec.xp = +(C.rec.xp + exp).toFixed(2); C.rec[res==="W" ? "w" : res==="D" ? "d" : "l"]++;
  C.tot ||= {p:0, w:0, d:0, l:0}; C.tot.p++; C.tot[res==="W" ? "w" : res==="D" ? "d" : "l"]++;
  C.mood = clamp(C.mood + (res==="W" ? 1.2 : res==="L" ? -1.2 : 0), 0, 100);
}

/* ---------- comings and goings ---------- */
function mdfVacate(){
  const old = M.coach;
  M.exCoach = (M.exCoach || []).concat(old && !old.int ? [{n:old.n, s:seasonLabel(M.season), rec:old.tot || old.rec, style:old.style}] : []).slice(-10);
  M.coach = mdfInterim(old); M.am[M.club] = M.coach.n; M.cl[M.club].mg = M.coach.n; M.cands = null; M.creq = null;
  mdfPrep(null);
}
function mdfComp(C){ const end = MGD(C.con + 1, 5, 30), wks = Math.max(8, (end - M.day)/7); return mgRoundFee(C.wage*wks*.5); }
function mdfSack(){
  const C = M.coach; if (!C || C.int) return "There's nobody to sack.";
  const comp = mdfComp(C), d = mdfPerf(C);
  M.fin.tb -= comp; mgFinAdd("exp", "fees", comp);
  if (d>4) mgBoardShift(-6, "Sacked a coach who was doing well"); else if (d<-4) mgBoardShift(2, "Acted on poor results"); else mgBoardShift(-1, "Changed coach");
  mgMail("board", `${C.n} sacked`, `You've sacked ${C.n}. Paying up his contract cost ${mgMoney(comp)}. His assistant takes charge until you appoint a new head coach.`);
  mdfVacate(); mgSave(); return "";
}
function mdfPoach(){
  const C = M.coach, clubs = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club && mgRep(c)>mgRep(M.club) + .03);
  if (!clubs.length) return;
  const club = mgPick(Math.random, clubs), comp = mgRoundFee(C.wage*52*1.2);
  mgMail("board", `${club} want ${C.n}`, `${club} want your head coach and will pay ${mgMoney(comp)} in compensation. ${C.n} would like to go.`, {act:{type:"poach", club, comp}, stop:1});
}
function mdfPoachAnswer(m, yes){
  const C = M.coach, a = m.act; if (!C || C.int || a.done) return "That's in the past now.";
  if (yes){ M.fin.tb += a.comp; mgFinAdd("inc", "sales", a.comp); a.done = `${C.n} has gone to ${a.club}`; const n = C.n; M.am[a.club] = n; mdfVacate(); mgSave(); return `${n} leaves for ${a.club}. ${mgMoney(a.comp)} comes in. Now find his replacement.`; }
  C.mood = clamp(C.mood - 15, 0, 100); a.done = "You kept him"; mgSave(); return `${C.n} stays, but he isn't happy about it.`;
}
// the coaches you could appoint: some out of work, some at other clubs (who'll want compensation)
function mdfCands(){
  if (M.cands && M.cands.d>M.day - 21) return M.cands.list;
  const need = mdfNeed(M.club), R = Math.random, list = [];
  const clubs = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club);
  for (let i = 0; i<7; i++){
    const rep = clamp(need + (R() - .55)*38, 8, 96), c = mdfCoach(R, {rep});
    if (R()<.45){ const near = clubs.filter(x=>Math.abs(mdfNeed(x) - rep)<12); if (near.length){ c.club = mgPick(R, near); c.n = M.am[c.club] || c.n; c.comp = mgRoundFee(c.wage*52*.8); } }
    c.ask = mgRoundWage(c.wage*(rep>need + 6 ? 1.2 : 1)); c.yrs = 2 + Math.floor(R()*3);
    list.push(c);
  }
  M.cands = {d:M.day, list:list.sort((a, b)=>b.rep - a.rep)};
  return M.cands.list;
}
function mdfInterest(c){ const need = mdfNeed(M.club), up = M.euroQ[M.club] ? 6 : 0;
  if (c.rep>need + 18 + up) return {ok:false, txt:"Not interested: he's aiming higher"};
  if (c.rep>need + 8 + up) return {ok:true, txt:"He'd need persuading: a big wage", hard:true};
  return {ok:true, txt:c.club ? "Interested, if his club lets him go" : "Keen to talk"}; }
function mdfHire(i, wage, yrs){
  const c = mdfCands()[i]; if (!c) return {txt:"He's no longer available."};
  const I = mdfInterest(c); if (!I.ok) return {txt:I.txt + "."};
  const ask = mgRoundWage(c.ask*(I.hard ? 1.25 : 1));
  if (wage<ask*.95) return {counter:ask, txt:`${c.n} wants ${mgWageTxt(ask)}.`};
  if (wage>ask*2.5) return {txt:"That's far more than he's asking. The owner won't sign it off."};
  if (c.comp && M.fin.tb<c.comp) return {txt:`${c.club} want ${mgMoney(c.comp)} in compensation, more than your transfer budget.`};
  if (c.comp){ M.fin.tb -= c.comp; mgFinAdd("exp", "fees", c.comp); M.am[c.club] = mgAiManager(c.club); if (M.cl[c.club]) M.cl[c.club].mg = M.am[c.club]; }
  const old = M.coach;
  M.coach = {...c, wage, con:M.season + yrs - (M.day>=MGD(M.season + 1, 3, 1) ? 0 : 1), since:M.season, mood:78, rec:{p:0, w:0, d:0, l:0, pts:0, xp:0}, tot:{p:0, w:0, d:0, l:0}, int:false, comp:0, ask:0, wk:0, low:0};
  M.am[M.club] = c.n; M.cl[M.club].mg = c.n; M.cands = null;
  M.tac.fam[c.f] ??= 55;
  mdfPrep(null);
  mgBoardShift(old && old.int ? 2 : .5, `Appointed ${c.n}`);
  mgMail("board", `${c.n} is your new head coach`, `${c.n} (${c.style}, ${c.f}) signs until ${M.coach.con + 1} on ${mgWageTxt(wage)}${c.comp ? `. Compensation to ${c.club}: ${mgMoney(c.comp)}` : ""}. His players will need a few weeks to learn his ${c.f}.`);
  mgSave(); return {ok:true, txt:`${c.n} is your new head coach!`};
}
function mdfRenew(wage, yrs){
  const C = M.coach; if (!C || C.int) return {txt:"There's no head coach to renew."};
  if (C.mood<30) return {txt:`${C.n} won't talk about a new deal: he's ${mdfMood(C.mood).toLowerCase()}.`};
  const ask = mgRoundWage(mdfWage(C.rep, mgLeagueOf())*(C.mood<50 ? 1.15 : 1));
  if (wage<ask*.95) return {counter:ask, txt:`He wants ${mgWageTxt(ask)}.`};
  C.wage = wage; C.con = M.season + yrs - (M.day>=MGD(M.season + 1, 3, 1) ? 0 : 1); C.mood = clamp(C.mood + 15, 0, 100);
  mgMail("board", `${C.n} signs a new deal`, `${C.n} has signed a new contract until ${C.con + 1} on ${mgWageTxt(wage)}.`); mgSave();
  return {ok:true, txt:`${C.n} has signed a new contract!`};
}

/* ---------- the club's money and buildings ---------- */
const MDF_TIX = ["Low", "Normal", "High"];
const mdfGateF = () => mgDof() ? [.82, 1, 1.18][M.fin.tix ?? 1] : 1;
const mdfFillF = () => mgDof() ? [.08, 0, -.1][M.fin.tix ?? 1] : 0;
const mdfFacCost = (k, lvl) => mgRoundFee(Math.max(1.5e5, (MG_TB[mgLeagueOf()] || 2e5)*(k==="train" ? .045 : .035)*lvl));
function mdfBuild(k){
  const F = M.fac; if (!F) return "";
  if (F.job) return "Builders are already on site.";
  if (F[k]>=5) return "That's as good as it gets.";
  const cost = mdfFacCost(k, F[k]);
  if (M.fin.tb<cost) return `You need ${mgMoney(cost)} in your transfer budget.`;
  M.fin.tb -= cost; mgFinAdd("exp", "build", cost); F.job = {k, d:63};
  mgMail("board", `Work starts on the ${k==="train" ? "training ground" : "academy"}`, `${mgMoney(cost)} is being spent on the ${k==="train" ? "training ground" : "academy"}. It'll be ready in about nine weeks.`);
  mgSave(); return "";
}

/* ---------- the end of a season ---------- */
function mdfSeasonEnd(){
  const C = M.coach; if (!C) return;
  if (!C.int){
    const d = mdfPerf(C), wonT = M.trophies.filter(x=>x.s===seasonLabel(M.season) && x.club===M.club).length;
    C.rep = Math.round(clamp(C.rep + d/4 + wonT*3, 5, 99));
    M.mgr.rep = clamp(M.mgr.rep + d/10, 1, 100);
    // a coach who's done well gets offers
    if (d>4 && Math.random()<.35) mdfPoach();
    // his contract
    if (C.con<=M.season){ mgMail("board", `${C.n} leaves`, `${C.n}'s contract has run out and he has left the club. Find a new head coach before the season starts.`, {stop:1}); mdfVacate(); }
  }
  C.rec = {p:0, w:0, d:0, l:0, pts:0, xp:0};
}
function mdfRenewNote(){ const C = M.coach; if (mgDof() && C && !C.int && C.con<=M.season) mgMail("board", `${C.n}'s contract is running out`, `Your head coach's contract ends this summer. Offer him a new one from the Head coach page, or start looking for his successor.`, {stop:1}); }
