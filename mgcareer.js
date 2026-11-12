/* mgcareer.js — 3.1: your own contract, and moving jobs (Manager Career and Director of Football).
   - M.con: the deal you signed with your club {club, wage (a week), until (the last season it covers), from, yrs}.
     It's agreed when you take a job (M.offer: sign it, or ask for more money or a longer deal first). In its last
     January a happy board opens talks; at the end of its last season the board either offers a new one or lets you
     go. Sacked early, you're paid up half of what was left.
   - Out of work (M.phase "sacked"): the world no longer stops. Wait a week or a month and the football carries on
     without you (M.out: your old club plays on under a new manager), vacancies come and go, and your reputation
     slowly fades after a couple of months.
   - Moving is rare: a few vacancies a season (sackings, and managers whose own deals run out), and now and then a
     bigger club approaches you. Leave in the middle of a contract and your new club pays compensation; walk out in
     mid-season and your reputation takes a knock. You can also resign. */
const mgcRole = () => mgDof() ? "Director of Football" : "manager";
const mgcWageTxt = w => `${mgMoney(w)} a week`;
// what a club would pay you: its size sets the scale, your reputation moves it
function mgcTerms(club, renew, role){
  role = role==="dof" || role==="mgr" ? role : M.role==="dof" ? "dof" : "mgr";
  const j = mgJob(club), rep = clamp((mgLevel(club) - 48)/40, 0, 1);   // the squad's strength says how big the club is, across every league
  let wage = 1200*Math.pow(120, rep)*(.8 + M.mgr.rep/220)*(role==="dof" ? .75 : 1);
  if (renew && M.con) wage = Math.max(wage, M.con.wage*(1.08 + clamp((M.board.conf - 55)/200, 0, .2)));
  wage = wage>=10000 ? Math.round(wage/1000)*1000 : Math.round(wage/100)*100;
  const yrs = renew ? (M.board.conf>=72 ? 3 : 2) : M.mgr.rep>=j.need + 12 ? 3 : M.mgr.rep>=j.need - 6 ? 2 : 1;
  return {club, wage, yrs, exp:j.exp, need:j.need, renew:!!renew, role, askW:false, askY:false, note:""};
}
const mgcUntil = yrs => M.season + yrs - (M.phase==="summer" || (M.phase==="sacked" && M.day>=MGD(M.season + 1, 5, 1)) ? 0 : 1);
const mgcLeft = () => M.con ? Math.max(0, M.con.until - M.season + (M.phase==="summer" ? 0 : 1)) : 0;   // seasons still to run, this one included
function mgcEnsure(){
  M.mgr.earned ??= 0;
  if (!M.con && M.club && M.phase!=="sacked" && M.phase!=="new" && !M.out){ const T = mgcTerms(M.club); M.con = {club:M.club, wage:T.wage, from:M.job ? M.job.since : M.season, until:Math.max(M.season + 1, (M.job ? M.job.since : M.season) + 1), yrs:2}; }
}
/* ---------- agreeing a deal ---------- */
function mgcOffer(club, renew, role){ M.offer = mgcTerms(club, renew, role); mgSave(); return M.offer; }
function mgcAsk(what){
  const O = M.offer; if (!O) return;
  const ok = Math.random() < clamp(.4 + (M.mgr.rep - O.need)/40 + (O.renew ? (M.board.conf - 60)/100 : 0), .1, .85);
  if (what==="wage"){ O.askW = true; if (ok){ O.wage = Math.round(O.wage*1.15/100)*100; O.note = `They've agreed: ${mgcWageTxt(O.wage)}.`; } else O.note = "They won't go any higher on money. This is their final offer."; }
  else { O.askY = true; if (ok && O.yrs<4){ O.yrs++; O.note = `They've agreed: a ${O.yrs}-year deal.`; } else O.note = "They won't offer a longer deal. This is their final offer."; }
  mgSave();
}
function mgcSign(){
  const O = M.offer; if (!O) return "";
  M.offer = null;
  if (O.renew){ M.con = {club:M.club, wage:O.wage, from:M.season, until:M.season + O.yrs, yrs:O.yrs};
    mgBoardShift(2); mgMail("board", "New contract signed", `You've signed a new ${O.yrs}-year deal at ${M.club}, worth ${mgcWageTxt(O.wage)}. It runs to the summer of ${M.con.until + 1}.`); mgSave(); return `New ${O.yrs}-year deal signed.`; }
  const old = M.club, had = M.con && !M.out && M.phase!=="sacked" ? M.con : null, mid = had && (M.phase==="season" || M.phase==="pre");
  if (had && old && old!==O.club){
    const comp = Math.round(had.wage*26*Math.max(1, mgcLeft())/1000)*1000;
    if (mid){ M.hist.push(mgHistRow(true)); M.mgr.rep = Math.max(5, M.mgr.rep - 2); }
    M._left = {club:old, comp, mid};
  }
  M.out = false; M.jobs = []; M.outW = 0;
  // a change of role with the change of job: the same career, the same world (universe.js)
  if (O.role && O.role!==(M.role==="dof" ? "dof" : "mgr")){ M.role = O.role; if (O.role!=="dof") M.coach = null; M.cands = null; (M.mgr.roles ||= []).push({s:M.season, role:O.role}); if (typeof Hub!=="undefined") Hub.paintBand(M.role); }
  mgTakeJob(O.club);
  M.con = {club:O.club, wage:O.wage, from:M.season, until:mgcUntil(O.yrs), yrs:O.yrs};
  if (M._left){ const L = M._left; M._left = null; mgMail("news", `${M.mgr.name} leaves ${L.club} for ${O.club}`, `${O.club} have paid ${L.club} ${mgMoney(L.comp)} in compensation to release you from your contract.${L.mid ? " Leaving in mid-season hasn't gone down well: your reputation has taken a small knock." : ""}`); }
  mgMail("board", "Your contract", `You've signed a ${O.yrs}-year deal as ${O.club}'s ${mgcRole()}, worth ${mgcWageTxt(O.wage)}. It runs to the summer of ${M.con.until + 1}. The board expects: ${O.exp}.`);
  mgSave(); return `You're the new ${mgcRole()} of ${O.club}!`;
}
function mgcDecline(){ const O = M.offer; if (!O) return; M.offer = null; if (O.renew && M.con) M.con.said = "no"; else M.jobs = (M.jobs || []).filter(j=>j.club!==O.club); mgSave(); }

/* ---------- leaving ---------- */
// out of work, for whatever reason: your old club appoints someone else and plays on without you
function mgcOut(){
  const old = M.club;
  if (old){ M.am[old] = mgAiManager(old); if (M.cl[old]) M.cl[old].mg = M.am[old]; }
  M.con = null; M.offer = null; M.outW = 0; M.outPhase = null;
}
function mgcPayoff(){
  if (!M.con) return 0;
  const yrs = Math.max(.25, M.con.until - M.season + (M.phase==="summer" ? 0 : .5)), pay = Math.round(M.con.wage*52*yrs*.5/1000)*1000;
  M.mgr.earned = (M.mgr.earned || 0) + pay; return pay;
}
function mgcResign(){
  if (!M.club || M.phase==="sacked") return;
  const mid = M.phase==="season" || M.phase==="pre";
  if (mid) M.hist.push(mgHistRow(true));
  M.mgr.rep = Math.max(5, M.mgr.rep - (mid ? 4 : 1));
  M.phase = "sacked"; M.jobs = mgVacancies(true);
  const was = M.club; mgcOut();
  mgMail("board", `You've resigned from ${was}`, `${was} have accepted your resignation.${mid ? " Walking out during the season has cost you some reputation." : ""} You're a free agent: clubs with vacancies are listed under Jobs.`, {stop:1});
  mgHallRecord(); mgSave();
}
// the end of a season: has your deal run out?
function mgcSeasonEnd(){
  if (!M.con || M.con.until>M.season || M.phase==="sacked") return;
  if (M.con.said==="no" || M.board.conf<50){
    const was = M.club, mine = M.con.said==="no";
    M.phase = "sacked"; M.jobs = mgVacancies(false); mgcOut(); if (M.review) M.review.sacked = true;
    mgMail("board", mine ? `You've left ${was}` : `${was} won't renew your contract`, mine ? `Your contract at ${was} has run out and you've chosen to move on. You're a free agent: clubs with vacancies are listed under Jobs.` : `Your contract at ${was} has run out and the board has decided not to offer a new one. Thank you for your work. You're a free agent: clubs with vacancies are listed under Jobs.`, {stop:1});
    mgHallRecord(); return;
  }
  if (!M.offer || !M.offer.renew) M.offer = mgcTerms(M.club, true);
  mgMail("board", "Your contract has run out", `The board wants you to stay and has put a new ${M.offer.yrs}-year deal on the table (${mgcWageTxt(M.offer.wage)}). Sign it before the new season, or you'll leave as a free agent.`, {stop:1});
}
// "Next season" with no contract: you leave as a free agent
function mgcLapsed(){
  if (!M.con || M.con.until>M.season || M.phase!=="summer") return false;
  const was = M.club; M.phase = "sacked"; M.jobs = mgVacancies(false); mgcOut();
  mgMail("board", `You've left ${was}`, `Your contract at ${was} ran out without a new one being signed. You're a free agent: clubs with vacancies are listed under Jobs.`, {stop:1});
  mgHallRecord(); mgSave(); return true;
}

/* ---------- week by week ---------- */
function mgcWeekly(){
  if (!M.out) mgcEnsure();
  // managers elsewhere come to the end of their deals or get the sack: a few vacancies a season, filled after a month or so
  M.jobs = (M.jobs || []).filter(j=>!j.d || M.day - j.d<45 || (M.out && M.jobs.length<=2));
  if (Math.random() < (M.out ? .16 : .06)){
    const cap = M.mgr.rep + (M.out ? 10 : 20), pool = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club && !(M.jobs || []).some(j=>j.club===c) && mgJob(c).need<=cap + 25);
    if (pool.length){ const c = pool[Math.floor(Math.random()*pool.length)], old = M.am[c] || (M.cl[c] && M.cl[c].mg) || "", nw = mgAiManager(c), sack = M.phase==="season" && Math.random()<.6;
      M.jobs = (M.jobs || []).concat([mgJob(c)]).slice(-8);
      mgMail("news", sack ? `${c} sack ${old || "their manager"}` : old ? `${old} leaves ${c}` : `${c} part company with their manager`, sack ? `${c} have dismissed ${old || "their manager"} and are looking for a successor.` : `${old ? old + "'s" : "Their manager's"} contract at ${c} is up and won't be renewed. The club is looking for a successor.`);
      M._fill = (M._fill || []).concat([{c, nw, d:M.day + 30 + Math.floor(Math.random()*20)}]); }
  }
  (M._fill || []).forEach(f=>{ if (M.day>=f.d && f.c!==M.club){ M.am[f.c] = f.nw; if (M.cl[f.c]) M.cl[f.c].mg = f.nw; M.jobs = (M.jobs || []).filter(j=>j.club!==f.c || M.offer && M.offer.club===f.c); f.done = 1; } });
  M._fill = (M._fill || []).filter(f=>!f.done);
  if (M.out){ M.outW = (M.outW || 0) + 1; if (M.outW>8) M.mgr.rep = Math.max(5, +(M.mgr.rep - .2).toFixed(2)); return; }
  if (!M.con || M.phase==="sacked") return;
  M.mgr.earned = (M.mgr.earned || 0) + M.con.wage;
  // the last January of your deal: a happy board opens talks
  const last = M.con.until<=M.season, d = mgDate(M.day);
  if (last && !M.con.talk && M.phase==="season" && d.getUTCMonth()===0 && d.getUTCDate()>=8){ M.con.talk = 1;
    if (M.board.conf>=62){ M.offer = mgcTerms(M.club, true); mgMail("board", "The board wants to extend your contract", `Your deal runs out this summer. The board is pleased with your work and has offered a new ${M.offer.yrs}-year contract worth ${mgcWageTxt(M.offer.wage)}. You'll find it on your home screen.`, {stop:1}); }
    else mgMail("board", "Your contract runs out this summer", `The board will decide on a new deal at the end of the season. Results between now and then will settle it.`); }
  // now and then a bigger club with a vacancy asks for you (rarely: it takes a good season and a free dugout)
  if (M.phase==="season" && !M.offer && M.board.conf>=68 && Math.random()<.012){
    const j = (M.jobs || []).find(j=>mgRep(j.club)>mgRep(M.club) + .03 && M.mgr.rep>=j.need);
    if (j && !M.inbox.some(m=>m.act && m.act.type==="job" && m.act.club===j.club && !m.act.done)) mgMail("job", `${j.club} want to talk to you`, `${j.club} (${TIERS[mgTierOf(j.club)]?.name || ""}) have asked ${M.club} for permission to speak to you about their vacancy. They'd pay compensation to release you from your contract. Their board expects: ${j.exp}.`, {act:{type:"job", club:j.club}, stop:1});
  }
}

/* ---------- out of work: time passes without you ---------- */
function mgcWait(days){
  if (M.phase!=="sacked") return;
  M.out = true; M.offer = null;
  M.phase = M.day>=MGD(M.season + 1, 5, 1) ? "summer" : M.day>=MGD(M.season, 7, 1) ? "season" : "pre";
  for (let i = 0; i<days; i++){
    if (M.phase==="summer"){ mgNewSeason(); continue; }
    if (!M.done){ mgProcessDay(); M.done = true; }
    if (M.phase==="summer") continue;
    M.day++; M.done = false; mgTick();
  }
  M.outPhase = M.phase; M.phase = "sacked"; M._stop = 0;
  if ((M.jobs || []).length<2) M.jobs = (M.jobs || []).concat(mgVacancies(true).filter(j=>!(M.jobs || []).some(x=>x.club===j.club)).slice(0, 2));
  mgHallRecord(); mgSave();
}

/* ---------- on screen ---------- */
function mgcOfferHTML(){
  const O = M.offer; if (!O) return "";
  const t = mgTierOf(O.club), until = (O.renew ? M.season + O.yrs : mgcUntil(O.yrs)) + 1;
  return `<section class="panel mgc-offer"><div class="eyebrow">${O.renew ? "New contract offer" : "Contract offer"}</div>
    <div class="mgc-head">${clubBadge(O.club, 46)}<div style="min-width:0"><h2>${esc(O.club)}</h2><p class="hint">${t!=null ? esc(TIERS[t].name) : ""} · ${O.renew ? "they want you to stay" : `they want you as their ${O.role==="dof" ? "Director of Football" : O.role==="mgr" ? "manager" : mgcRole()}`}</p></div></div>
    <div class="mg-kpis"><div><span class="label">Wage</span><b>${mgcWageTxt(O.wage)}</b></div><div><span class="label">Length</span><b>${O.yrs} year${O.yrs>1 ? "s" : ""}</b></div><div><span class="label">Runs to</span><b>Summer ${until}</b></div><div><span class="label">Board expects</span><b>${esc(O.exp)}</b></div></div>
    ${O.note ? `<p class="ref" role="status">${esc(O.note)}</p>` : ""}
    ${!O.renew && M.con && M.phase!=="sacked" ? `<p class="hint">You're under contract at ${esc(M.club)}: ${esc(O.club)} will pay compensation.${M.phase==="season" || M.phase==="pre" ? " Leaving in mid-season will cost you a little reputation." : ""}</p>` : ""}
    <div class="row">${mgBtn("csign", "Sign the contract", "primary")}${O.askW ? "" : mgBtn("cask", "Ask for more money", "small", `data-v="wage"`)}${O.askY || O.yrs>=4 ? "" : mgBtn("cask", "Ask for a longer deal", "small", `data-v="yrs"`)}${mgBtn("cno", O.renew ? "Turn it down" : "Walk away", "small danger")}</div></section>`;
}
function mgcCardHTML(){
  mgcEnsure(); const C = M.con; if (!C) return "";
  const left = mgcLeft(), last = C.until<=M.season;
  return `<div class="mgc-card"><div class="eyebrow">Your contract</div>
    <div class="mg-kpis"><div><span class="label">Wage</span><b>${mgcWageTxt(C.wage)}</b></div><div><span class="label">Runs to</span><b>Summer ${C.until + 1}</b></div><div><span class="label">Time left</span><b class="${last ? "down-t" : ""}">${last ? "Final season" : `${left} seasons`}</b></div><div><span class="label">Career earnings</span><b>${mgMoney(M.mgr.earned || 0)}</b></div></div>
    <p class="hint">${last ? (M.board.conf>=62 ? "The board is happy: expect talks about a new deal." : M.board.conf>=50 ? "A new deal depends on how the season ends." : "As things stand, the board won't renew.") : "Sacked early, you'd be paid half of what's left on it."}</p>
    <div class="row">${MG_RESIGN ? `${mgBtn("cresign2", "Yes, resign", "small danger")}${mgBtn("cresign0", "Stay", "small")}` : mgBtn("cresign", "Resign", "small danger")}</div>
    ${MG_RESIGN ? `<p class="hint">You'll leave ${esc(M.club)} today and become a free agent.${M.phase==="season" || M.phase==="pre" ? " Walking out in mid-season costs reputation." : ""}</p>` : ""}</div>`;
}
let MG_RESIGN = false;
function mgcOutHTML(){
  const w = M.outW || 0, d = mgDate(M.day);
  return `<div class="mgc-out"><div class="mg-kpis"><div><span class="label">Date</span><b>${mgFmt(M.day)}</b></div><div><span class="label">Out of work</span><b>${w ? `${w} week${w===1 ? "" : "s"}` : "Just now"}</b></div><div><span class="label">Reputation</span><b>${Math.round(M.mgr.rep)}</b></div><div><span class="label">Career earnings</span><b>${mgMoney(M.mgr.earned || 0)}</b></div></div>
    <p class="hint">Nothing you fancy? Let time pass: the season carries on without you and new vacancies come up as managers leave. After a couple of months out of the game your reputation starts to fade.</p>
    <div class="row">${mgBtn("cwait", "Wait a week", "", `data-v="7"`)}${mgBtn("cwait", "Wait a month", "", `data-v="30"`)}</div></div>`;
}
