/* ================= MANAGER CAREER, DEEPER (2.5) =================
   Loaded after mgdofui.js. Everything here hangs off hooks in manager.js, mgmatch.js, mgdof.js and mgui.js:
   - Form and sharpness: a visible plus or minus on a player's rating. Form is his last five match ratings; sharpness
     is match practice (it drops when he's injured or not playing and comes back with minutes). A man back from
     injury is also short of stamina for a while: he tires faster and recovers slower.
   - Staff: an assistant manager, a physio and a chief scout, each with a rating, a wage and a market to hire from.
   - The assistant's report before a match, with one tap to do what he suggests.
   - Player conversations and promises, opposition instructions, set-piece takers, a word on whether your changes
     worked, derbies, the season's story on Home, and a board ultimatum before the sack.
   - Director of Football: the head coach's plan for each window (the positions he wants and the players he'd pick).
     Back his choices or sign your own. */

/* ---------- form and sharpness ---------- */
const mgxShp = p => p.shp ?? 100;
const mgxFormPart = p => { const f = mgFormAvg(p); return f ? clamp((f - 6.6)*2.2, -3, 3) : 0; };
const mgxShpPart = p => { const s = mgxShp(p); return s>=80 ? 0 : -(80 - s)*.12; };
// what's added to (or taken off) his rating on the day
const mgxAdj = p => mgxFormPart(p) + mgxShpPart(p);
const mgxAdjN = p => Math.round(mgxAdj(p));
const mgxAdjB = p => { const n = mgxAdjN(p); return n ? `<i class="mgx-adj ${n>0 ? "up" : "dn"}" title="Form and sharpness">${n>0 ? "+" : "−"}${Math.abs(n)}</i>` : ""; };
const mgxShpLabel = s => s>=90 ? "Match sharp" : s>=80 ? "Sharp" : s>=65 ? "Lacking sharpness" : s>=50 ? "Rusty" : "Very rusty";
const mgxFormLabel = p => { const f = mgFormAvg(p); return !f ? "No games yet" : f>=7.6 ? "On fire" : f>=7 ? "In form" : f>=6.4 ? "Steady" : f>=6 ? "Out of form" : "Badly out of form"; };
const mgxFitTxt = p => `<span class="mgx-fitn ${p.fit<70 ? "low" : p.fit<85 ? "mid" : ""}">${Math.round(p.fit)}%</span>`;
// a player's injury has healed: he's back, but rusty and short of stamina for a while
function mgxRecovered(p){
  const L = p.inj.t || 7, mine = p.club===M.club; p.inj = null;
  p.fit = Math.min(p.fit, clamp(Math.round(100 - L*1.1), 60, 92));
  p.stam = {d:Math.round(clamp(L*.6, 5, 28)*(mine ? 1 - (mgxS().phys.r - 50)/160 : 1))};
  if (mine) mgMail("injury", `${p.n} is fit again`, `${p.n} has recovered and is available for selection. He's ${mgxShpLabel(mgxShp(p)).toLowerCase()} (sharpness ${Math.round(mgxShp(p))}%) and will tire quickly for the next ${mgWeeks(p.stam.d)}: bring him back gently.`);
}

/* ---------- staff ---------- */
const MGX_ROLES = {asst:["Assistant manager", "Picks out who's tired, in form or rusty before each match, freshens the team when you quick sim, and brings players back in after injuries. Better assistants give better advice and teach a new formation faster."],
  phys:["Head physio", "Shorter injuries, quicker recovery between games, and less time short of stamina after an injury."],
  scout:["Chief scout", "Scouting reports come back faster."]};
function mgxStaffMake(k, r){ const R = Math.random, t = mgLeagueOf() ?? 3; r = Math.round(clamp(r, 25, 95));
  return {n:mgName(R, mgPick(R, ["England","England","Scotland","Spain","Germany","Italy","France","Netherlands","Portugal","Ireland"])), r, w:mgRoundWage((MG_WAGE[t] || 2000)*.12*Math.exp(r/42)*(k==="asst" ? 1.2 : 1)), age:32 + Math.floor(R()*28)}; }
function mgxS(){
  if (!M.staff){ const base = 38 + (mgLevel(M.club) - 55)*.9; M.staff = {pick:true}; ["asst","phys","scout"].forEach(k=>{ M.staff[k] = mgxStaffMake(k, base + mgGauss(Math.random)*7); }); }
  return M.staff;
}
function mgxStaffCands(k){
  const S = mgxS(); S.mk ||= {};
  if (!S.mk[k] || S.mk[k].d<M.day - 28){ const base = 38 + (mgLevel(M.club) - 55)*.9; S.mk[k] = {d:M.day, list:[0, 1, 2].map(i=>mgxStaffMake(k, base + 4 + i*5 + mgGauss(Math.random)*6)).sort((a, b)=>b.r - a.r)}; }
  return S.mk[k].list;
}
function mgxHire(k, i){
  const S = mgxS(), c = mgxStaffCands(k)[i]; if (!c) return "He's taken another job.";
  const pay = S[k].w*4;
  if (M.fin.tb<pay) return `Paying off ${S[k].n} costs ${mgMoney(pay)}, more than your transfer budget.`;
  M.fin.tb -= pay; mgFinAdd("exp", "fees", pay);
  const old = S[k].n; S[k] = c; S.mk[k].list.splice(i, 1); mgSave();
  return `${c.n} is your new ${MGX_ROLES[k][0].toLowerCase()}. ${old} leaves with four weeks' pay (${mgMoney(pay)}).`;
}
const mgxPhysRec = () => M.staff ? (M.staff.phys.r - 50)/40 : 0;
const mgxScoutF = () => M.staff ? clamp(1 - (M.staff.scout.r - 50)/120, .55, 1.25) : 1;
function mgxPhysio(p){ if (p && p.inj && p.club===M.club && !p.inj.ph){ p.inj.d = Math.max(2, Math.round(p.inj.d*(1 - (mgxS().phys.r - 50)/200))); p.inj.ph = 1; } }
function mgxStaffHTML(){
  const S = mgxS(), dof = mgDof();
  const card = k => { if (dof && k==="asst") return ""; const x = S[k], open = MGX_OPEN===k;
    return `<div class="mgx-staff"><div class="mgx-staff-h"><div><div class="label">${MGX_ROLES[k][0]}</div><b>${esc(x.n)}</b><small>${x.age} · ${mgWageTxt(x.w)}</small></div>${mgOvrB(x.r)}</div>
      <p class="hint">${MGX_ROLES[k][1]}</p>
      ${open ? `<div class="mg-list">${mgxStaffCands(k).map((c, i)=>`<div class="mg-row mgx-cand">${mgOvrB(c.r, "sm")}<span class="mg-pn"><b>${esc(c.n)}</b><small>${c.age} · ${mgWageTxt(c.w)}</small></span>${mgBtn("xhire", "Hire", "small primary", `data-k="${k}" data-i="${i}"`)}</div>`).join("") || `<p class="hint">Nobody available this month.</p>`}</div>
        <p class="hint">Hiring pays off ${esc(mgSurname(x.n))} with four weeks' wages (${mgMoney(x.w*4)}), from the transfer budget.</p>` : mgBtn("xstaff", "Find a replacement", "small", `data-k="${k}"`)}</div>`; };
  return `<div class="mgx-staffs">${card("asst")}${card("phys")}${card("scout")}</div>
    ${dof ? "" : `<label class="chk mgx-chk"><input type="checkbox" data-mgin="xpick" ${S.pick ? "checked" : ""}> When I quick sim a match, let my assistant rest tired players and pick the men in form</label>`}
    <p class="hint">Staff wages (${mgWageTxt(mgxStaffBill())}) are paid weekly with the players'.</p>`;
}
const mgxStaffBill = () => { const S = mgxS(); return (mgDof() ? 0 : S.asst.w) + S.phys.w + S.scout.w; };
let MGX_OPEN = null;

/* ---------- the XI: players coming back, and freshening the side ---------- */
// a starter who was out is fit again: back in if he's at least as good on the day as the man who covered for him
function mgxReturn(T, slots, mine, notes, quiet){
  const out = T.out; if (!out || mgDof()) return;
  for (const i in out){
    const q = M.P[out[i]];
    if (!q || !mine.has(q.id) || T.xi.includes(q.id) || +i>=slots.length){ delete out[i]; continue; }
    if (!mgAvail(q)) continue;
    const cur = M.P[T.xi[i]], pos = slots[i][0];
    if (!cur || mgEff(q, pos)>=mgEff(cur, pos) - .5){
      T.xi[i] = q.id; T.bench = (T.bench || []).filter(id=>id!==q.id); if (cur && !T.bench.includes(cur.id)) T.bench.unshift(cur.id);
      if (!quiet) notes.push(`${mgShort(q.n)} is back${cur ? ` in for ${mgShort(cur.n)}` : ""}`);
    } else if (!quiet) notes.push(`${mgShort(q.n)} is fit again but ${mgxShp(q)<80 ? "short of sharpness" : "not yet at his best"}: he's on the bench, ${mgShort(cur.n)} keeps his place`);
    delete out[i];
  }
}
// the assistant's changes: anyone clearly better on the day (fitter, sharper, in form) comes in. Returns what he did.
function mgxFreshen(apply = true){
  const T = M.tac, slots = MG_FORM[T.f], used = new Set(T.xi), swaps = [];
  T.xi.forEach((id, i)=>{ const p = M.P[id]; if (!p) return; const pos = slots[i][0], mine = mgEff(p, pos) - (p.fit<62 ? 4 : 0);
    const c = mgMine().filter(q=>mgAvail(q) && !used.has(q.id)).map(q=>({q, v:mgEff(q, pos) - (q.fit<62 ? 4 : 0)})).sort((a, b)=>b.v - a.v)[0];
    if (c && c.v>mine + 1.2){ swaps.push({i, pos, out:p, in:c.q}); used.add(c.q.id); } });
  if (apply) swaps.forEach(s=>{ T.xi[s.i] = s.in.id; T.bench = T.bench.filter(id=>id!==s.in.id); if (!T.bench.includes(s.out.id)) T.bench.push(s.out.id); });
  if (apply && swaps.length){ T.bench = T.bench.slice(0, 9); mgMendXI(true); }
  return swaps;
}

/* ---------- the assistant's report ---------- */
function mgxReport(f){
  const S = mgxS(), T = M.tac, slots = MG_FORM[T.f], us = f.h===M.club, opp = us ? f.a : f.h, good = S.asst.r;
  const xi = T.xi.map((id, i)=>({p:M.P[id], pos:slots[i][0]})).filter(x=>x.p), L = [];
  const swaps = mgxFreshen(false);
  const tired = xi.filter(x=>x.p.fit<76).sort((a, b)=>a.p.fit - b.p.fit);
  if (tired.length) L.push({k:"fit", t:`${tired.slice(0, 3).map(x=>`${mgShort(x.p.n)} (${Math.round(x.p.fit)}%)`).join(", ")} ${tired.length===1 ? "is" : "are"} tired.`});
  const rusty = xi.filter(x=>mgxShp(x.p)<72);
  if (rusty.length) L.push({k:"shp", t:`${rusty.slice(0, 2).map(x=>mgShort(x.p.n)).join(" and ")} ${rusty.length===1 ? "is" : "are"} short of match sharpness and will play below ${rusty.length===1 ? "his" : "their"} rating.`});
  const hot = xi.filter(x=>mgxFormPart(x.p)>=1.8).map(x=>mgShort(x.p.n));
  if (hot.length) L.push({k:"form", t:`In form: ${hot.slice(0, 3).join(", ")}.`});
  swaps.slice(0, 3).forEach(s=>L.push({k:"swap", t:`I'd start ${mgShort(s.in.n)} for ${mgShort(s.out.n)} at ${s.pos}: he's ${s.out.fit<76 ? "fresher" : mgxShp(s.out)<75 ? "sharper" : "in better form"} (${Math.round(mgEff(s.in, s.pos))} against ${Math.round(mgEff(s.out, s.pos))} today).`}));
  // the opposition: one thing to go after, and their key man
  const of = (M.cl[opp] && M.cl[opp].f) || "4-3-3", ox = mgAutoXI(opp, of), os = MG_FORM[of] || MG_FORM["4-3-3"];
  const O = ox.xi.map((p, i)=>p ? {p, pos:os[i][0]} : null).filter(Boolean), avg = (l, i) => l.length ? l.reduce((s, x)=>s + x.p.at[i], 0)/l.length : 60;
  const fb = O.filter(x=>["LB","RB","LWB","RWB"].includes(x.pos)), cb = O.filter(x=>x.pos==="CB"), om = O.filter(x=>MG_GROUP(x.pos)==="MID");
  const myW = xi.filter(x=>["LW","RW","LM","RM","LWB","RWB"].includes(x.pos)), myM = xi.filter(x=>MG_GROUP(x.pos)==="MID");
  let tip = null;
  if (good>=45){
    if (fb.length && myW.length && avg(myW, 0) - avg(fb, 0)>=5 && T.width!==2) tip = {t:`Their full-backs are slow (pace ${Math.round(avg(fb, 0))}). Play wide and get at them.`, set:{width:2}};
    else if (cb.length && avg(cb, 0)<62 && T.pass!==2) tip = {t:`Their centre-backs can't turn (pace ${Math.round(avg(cb, 0))}). Go direct, in behind.`, set:{pass:2}};
    else if (om.length && myM.length && avg(om, 2) - avg(myM, 2)>=4 && T.press!==2) tip = {t:`Their midfield passes better than ours. Press high and don't let them settle.`, set:{press:2}};
    else if (mgLevel(opp) - mgLevel(M.club)>=5 && T.ment>1) tip = {t:`They're stronger than us. I'd sit in and hit them on the break.`, set:{ment:1, line:0}};
    else if (mgLevel(M.club) - mgLevel(opp)>=5 && T.ment<3) tip = {t:`We're the better side. Go for them from the start.`, set:{ment:3}};
  }
  if (tip) L.push({k:"tip", t:tip.t});
  const key = O.filter(x=>x.pos!=="GK").sort((a, b)=>mgOvr(b.p) - mgOvr(a.p))[0];
  const marked = T.mark && T.mark.k===f.key ? T.mark.id : null;
  if (key && !marked && good>=40) L.push({k:"mark", t:`${mgShort(key.p.n)} (${mgOvr(key.p)}) is their danger man. Put a man on him.`});
  return {L, swaps, set:tip ? tip.set : null, mark:key && !marked ? key.p.id : null, n:S.asst.n};
}
function mgxReportHTML(f){
  if (mgDof()) return "";
  const R = mgxReport(f), can = R.swaps.length || R.set || R.mark;
  return `<div class="mgx-rep"><div class="eyebrow">Assistant's report · ${esc(R.n)}</div>
    ${R.L.length ? `<ul>${R.L.map(l=>`<li class="k-${l.k}">${esc(l.t)}</li>`).join("")}</ul>` : `<p class="hint">Everyone's fit, sharp and ready. No changes from me.</p>`}
    ${can ? mgBtn("xrep", "Do what he suggests", "small primary") : ""}</div>`;
}
function mgxReportApply(f){
  const R = mgxReport(f), did = [];
  if (R.swaps.length){ mgxFreshen(true); did.push(`${R.swaps.length} change${R.swaps.length===1 ? "" : "s"} to the XI`); }
  if (R.set){ Object.assign(M.tac, R.set); M.tac.style = "Custom"; did.push("tactics adjusted"); }
  if (R.mark){ M.tac.mark = {k:f.key, id:R.mark}; did.push("their danger man marked"); }
  mgSave(); return did.length ? `Done: ${did.join(", ")}.` : "Nothing to change.";
}

/* ---------- opposition instructions and set pieces ---------- */
function mgxMatchSetup(G, us){
  const mk = M.tac.mark;
  if (!mgDof() && mk && mk.k===G.f.key){ const o = G.S[1 - us].on.find(x=>x.p.id===mk.id); if (o){ o.marked = true; G.S[us].marking = true; } }
}
// who takes it: your choice if he's on the pitch, otherwise the best man for it
function mgxTaker(A, on, kind){
  const sp = (A.user && !mgDof() && M.tac.sp) || {};
  if (kind==="pen"){ const o = (sp.pen && on.find(x=>x.p.id===sp.pen)) || on.filter(x=>x.pos!=="GK").sort((a, b)=>mmSho(b) - mmSho(a))[0]; return o ? {o, fk:false} : null; }
  if (kind==="good" && Math.random()<.14){ const o = (sp.fk && on.find(x=>x.p.id===sp.fk)) || on.filter(x=>x.pos!=="GK").sort((a, b)=>(mmSho(b) + mmPas(b)) - (mmSho(a) + mmPas(a)))[0]; return o ? {o, fk:true} : null; }
  return null;
}
function mgxCorner(A, pool){ const sp = (A.user && !mgDof() && M.tac.sp) || {}; return sp.cor && Math.random()<.6 ? pool.find(x=>x.p.id===sp.cor) || null : null; }
function mgxSetPiecesHTML(){
  const T = M.tac, sp = T.sp || {}, xi = T.xi.map(id=>M.P[id]).filter(p=>p && p.pos!=="GK");
  const sel = (k, label, score) => { const best = xi.slice().sort((a, b)=>score(b) - score(a));
    return `<div><div class="label">${label}</div><select data-mgin="sp-${k}" class="mg-capsel"><option value="">Best available (${esc(best[0] ? mgShort(best[0].n) : "–")})</option>${best.map(p=>`<option value="${esc(p.id)}" ${sp[k]===p.id ? "selected" : ""}>${esc(p.n)} · ${Math.round(score(p))}</option>`).join("")}</select></div>`; };
  return `<h3>Set pieces</h3><div class="mg-instr mgx-sp">${sel("pen", "Penalties", p=>p.at[1])}${sel("fk", "Free kicks", p=>(p.at[1] + p.at[2])/2)}${sel("cor", "Corners", p=>p.at[2])}</div>
    <p class="hint">Your taker takes it when he's on the pitch. The number is how good he is at it.</p>`;
}

/* ---------- did your change work? ---------- */
function mgxFxMark(G, s, why){ if (G.auto || G.done) return; const S = G.S[s]; G.fx = {s, at:G.min, R:{...S.R}, sc:G.score.slice(), sh:S.st.sh, osh:G.S[1 - s].st.sh, why}; }
function mgxFxSay(G){
  const x = G.fx; if (!x || G.auto || G.min<x.at + 8) return; G.fx = null;
  const S = G.S[x.s], c = S.club, gf = G.score[x.s] - x.sc[x.s], ga = G.score[1 - x.s] - x.sc[1 - x.s], sh = S.st.sh - x.sh, osh = G.S[1 - x.s].st.sh - x.osh, n = G.min - x.at;
  const what = x.why==="sub" ? "the substitution" : x.why==="shout" ? "your shout" : "the change";
  const t = gf>ga ? `It's worked: ${c} have scored since ${what}.` : ga>gf ? `${what[0].toUpperCase() + what.slice(1)} hasn't helped: ${c} have conceded since.`
    : sh>=2 && sh>osh ? `${c} look more dangerous since ${what}: ${sh} shots in ${n} minutes.` : osh>=2 && osh>sh ? `${what[0].toUpperCase() + what.slice(1)} hasn't turned it: ${osh} shots against in ${n} minutes.`
    : S.R.att - x.R.att>.7 ? `${c} are getting forward more since ${what}.` : S.R.def - x.R.def>.7 ? `${c} look more solid since ${what}.` : S.R.mid - x.R.mid>.7 ? `${c} are seeing more of the ball since ${what}.` : `Not much has changed since ${what}.`;
  mmSay(G, x.s, "info", t);
}

/* ---------- derbies ---------- */
const MGX_RIVALS = [["Arsenal","Tottenham Hotspur"],["Liverpool","Everton"],["Manchester United","Manchester City"],["Manchester United","Liverpool"],["Chelsea","Tottenham Hotspur"],["Chelsea","Arsenal"],["Newcastle United","Sunderland"],
  ["Aston Villa","Birmingham City"],["West Ham United","Millwall"],["Crystal Palace","Brighton & Hove Albion"],["Leeds United","Manchester United"],["Sheffield United","Sheffield Wednesday"],["Norwich City","Ipswich Town"],
  ["Southampton","Portsmouth"],["Bristol City","Bristol Rovers"],["Cardiff City","Swansea City"],["Derby County","Nottingham Forest"],["West Bromwich Albion","Wolverhampton Wanderers"],["Blackburn Rovers","Burnley"],["Preston North End","Blackpool"],
  ["Stoke City","Port Vale"],["Leicester City","Coventry City"],["Real Madrid","Barcelona"],["Real Madrid","Atlético Madrid"],["Sevilla","Real Betis"],["Athletic Club","Real Sociedad"],["Bayern Munich","Borussia Dortmund"],
  ["Borussia Dortmund","Schalke 04"],["Inter","AC Milan"],["Juventus","Torino"],["Roma","Lazio"],["Juventus","Inter"],["Paris Saint-Germain","Marseille"],["Lyon","Saint-Étienne"],["Benfica","Porto"],["Benfica","Sporting CP"],
  ["Ajax","Feyenoord"],["Ajax","PSV"],["Celtic","Rangers"],["Hearts","Hibernian"],["Dundee","Dundee United"]];
const mgxRival = (a, b) => MGX_RIVALS.some(([x, y])=>(x===a && y===b) || (x===b && y===a));
const mgxDerby = f => f && f.c!=="F" && mgxRival(f.h, f.a);

/* ---------- after each competitive match: the season's story, derbies, the ultimatum, promises ---------- */
function mgxAfterMatch(f, r, res, pts, exp, opp, gf, ga){
  if (f.c==="L"){
    if (M.storyS!==M.season){ M.story = []; M.storyS = M.season; }
    const last = M.story[M.story.length - 1] || {p:0, x:0};
    M.story.push({p:last.p + pts, x:+(last.x + exp).toFixed(2)});
    const U = M.board.ult;
    if (U && !U.done){ U.g++; U.pts += pts;
      if (U.pts>=U.need){ U.done = 1; M.board.ult = null; M.board.conf = Math.max(M.board.conf, 40); mgMail("board", `${mgDof() ? "The owner backs you" : "The board backs you"}`, `${U.pts} points from ${U.g} games: you've done what was asked. The pressure is off, for now.`, {stop:1}); }
      else if (U.g>=U.of){ U.done = 1; M.board.ultFail = 1; } }
  }
  if (mgxDerby(f)){
    mgBoardShift(res==="W" ? 1.5 : res==="L" ? -1.5 : 0, res==="W" ? "Won the derby" : res==="L" ? "Lost the derby" : "");
    mgMine().forEach(p=>{ p.mor = clamp(p.mor + (res==="W" ? 3 : res==="L" ? -3 : 0), 5, 100); });
    mgMail("news", res==="W" ? `Derby delight: ${M.club} ${gf}–${ga} ${opp}` : res==="L" ? `Derby despair: ${opp} take the bragging rights` : `Honours even in the derby`,
      res==="W" ? `The fans will be singing about this one for weeks. Beating ${opp} lifts the whole club.` : res==="L" ? `Losing to ${opp} hurts more than any other defeat. The fans and the dressing room are flat.` : `A point each against ${opp}, and nobody's happy or sad about it.`);
  }
  // promises of game time
  mgMine().forEach(p=>{ const P = p.prom; if (!P || P.k!=="st") return; const s = r.ps.find(x=>x.id===p.id);
    P.g++; if (s && s.start) P.got++;
    if (P.got>=P.n){ p.prom = null; p.mor = clamp(p.mor + 8, 5, 100); mgMail("contract", `${p.n}: promise kept`, `${p.n} has had the games you promised him and is grateful. His morale is up.`); }
    else if (P.g>=P.of){ p.prom = null; p.mor = clamp(p.mor - 14, 5, 100); mgMine().forEach(q=>{ q.mor = clamp(q.mor - 1.5, 5, 100); });
      mgMail("contract", `${p.n}: promise broken`, `You promised ${p.n} ${P.n} starts in ${P.of} games and gave him ${P.got}. He's furious, and the rest of the dressing room has noticed.`, {stop:1}); } });
}

/* ---------- the board's ultimatum ---------- */
function mgxBoardCheck(played){
  const B = M.board, who = mgDof() ? "The owner" : "The board";
  if (B.ultFail){ B.ultFail = 0; B.ult = null; mgSacked("results"); return true; }
  if (B.ult && !B.ult.done) return false;
  if (B.conf<26 && played>=8 && B.ultS!==M.season){
    const t = mgLeagueOf(), left = mgRounds(t) - played, of = Math.min(5, left); if (of<3) return false;
    const fx = []; for (let d = M.day; d<M.day + 80 && fx.length<of; d++){ const f = mgFixturesOn(d).find(x=>x.c==="L" && mgIsMine(x) && !M.played[x.key]); if (f) fx.push(f); }
    const xp = fx.reduce((s, f)=>s + mgExpPts(M.club, f.h===M.club ? f.a : f.h, f.h===M.club ? 1 : -1), 0) || of*1.3;
    const need = clamp(Math.round(xp*.9), 4, Math.round(of*1.6));
    B.ult = {need, of, g:0, pts:0}; B.ultS = M.season; B.conf = Math.max(B.conf, 16);
    mgMail("board", `${who} wants to see you`, `${who} has called you in. Results haven't been good enough and patience is running out.\n\nThe message is clear: take at least ${need} points from the next ${of} league games, or you'll be out of a job.`, {stop:1});
    return false;
  }
  if (B.conf<15 && played>=10){ mgSacked("results"); return true; }
  return false;
}

/* ---------- each week ---------- */
function mgxWeekly(){
  const S = mgxS();
  mgFinAdd("exp", "staff", mgxStaffBill());
  // match sharpness fades when a player isn't playing
  mgMine().forEach(p=>{ if (!p.inj && !p.loan && (p._mins || 0)<30) p.shp = Math.max(55, mgxShp(p) - 3); });
  if (!mgDof()){ const fam = M.tac.fam; fam[M.tac.f] = clamp((fam[M.tac.f] || 40) + (S.asst.r - 50)/25, 40, 100); }
  // a promised contract
  mgMine().forEach(p=>{ const P = p.prom; if (!P || P.k!=="con") return;
    if (p.con>M.season){ p.prom = null; }
    else if (M.day>=P.by){ p.prom = null; p.mor = clamp(p.mor - 12, 5, 100); mgMail("contract", `${p.n}: no contract offer`, `You told ${p.n} you'd talk about a new contract and nothing came. He feels let down.`, {stop:1}); } });
  if (!mgDof() && M.phase==="season" && !M.inbox.some(m=>m.act && m.act.type==="talk" && !m.act.done && m.d>M.day - 21) && Math.random()<.17) mgxTalk();
  if (mgDof()) mgxPlanTick();
}

/* ---------- player conversations ---------- */
function mgxTalk(){
  const sq = mgMine().filter(p=>!p.inj && !p.loan && !p.lin && !p.prom && !p.req && p.age>18), lv = mgLevel(M.club);
  const want = p => MG_ROLE_SHARE[p.role ?? 2];
  const a = sq.filter(p=>(p.pt ?? want(p))<want(p) - .12 && (p.role ?? 2)<=2 && mgOvr(p)>=lv - 6).sort((x, y)=>(x.pt ?? 1) - (y.pt ?? 1))[0];
  const b = sq.filter(p=>(p.form || []).length>=4 && mgFormAvg(p)>=7.5).sort((x, y)=>mgFormAvg(y) - mgFormAvg(x))[0];
  const c = sq.filter(p=>p.con<=M.season && mgOvr(p)>=lv - 3).sort((x, y)=>mgOvr(y) - mgOvr(x))[0];
  const opts = [a && ["time", a], b && ["form", b], c && ["con", c]].filter(Boolean); if (!opts.length) return;
  const [k, p] = mgPick(Math.random, opts);
  const fa = mgFormAvg(p) || 0, nf = (p.form || []).length;
  const M_ = k==="time" ? [`${p.n} wants a word`, `${p.n} has knocked on your door. "I'm not playing enough, boss. I came here to play football, not to watch it."`, [["Promise him 3 starts in the next 6", "prom"], ["Tell him to earn it in training", "earn"], ["Tell him he's not in your plans", "no"]]]
    : k==="form" ? [`${p.n} is flying`, `${p.n} is averaging ${fa.toFixed(1)} over his last ${nf} games, and the papers are full of him. He's in your office, grinning.`, [["Praise him in front of the squad", "praise"], ["Tell him to keep his feet on the ground", "ground"], ["Say nothing special", "skip"]]]
    : [`${p.n} asks about his future`, `${p.n}'s contract runs out this summer. "I need to know where I stand, boss. Do you want me here or not?"`, [["Promise contract talks this month", "talk"], ["Tell him to wait until the summer", "wait"], ["Tell him he can leave", "leave"]]];
  mgMail("contract", M_[0], M_[1], {act:{type:"talk", id:p.id, k, ch:M_[2]}, stop:1});
}
function mgxTalkAnswer(m, v){
  const a = m.act, p = M.P[a.id]; if (!p || a.done) return "That's in the past now.";
  const mor = d => { p.mor = clamp(p.mor + d, 5, 100); }, n = mgSurname(p.n); let t = "";
  if (v==="prom"){ p.prom = {k:"st", n:3, of:6, g:0, got:0}; mor(6); t = `${n} leaves happy. Now keep your word: 3 starts in the next 6 games.`; }
  else if (v==="earn"){ if (Math.random()<.5){ mor(3); p.xp = (p.xp || 0) + .2; t = `${n} takes it well and says he'll prove you wrong.`; } else { mor(-5); t = `${n} isn't impressed. He thinks he's earned it already.`; } }
  else if (v==="no"){ mor(-10); t = `${n} is stunned. Expect him to ask for a move.`; }
  else if (v==="praise"){ if (Math.random()<.8){ mor(5); t = `${n} beams. He'd run through a wall for you.`; } else { mor(2); p.form = (p.form || []).map(x=>x - .3); t = `${n} enjoys the praise a little too much: he's eased off in training.`; } }
  else if (v==="ground"){ if (Math.random()<.6){ mor(2); p.xp = (p.xp || 0) + .2; t = `${n} nods. He knows there's more to come.`; } else { mor(-3); t = `${n} thinks you could have just said well done.`; } }
  else if (v==="skip"){ mor(-1); t = `${n} shrugs and goes back to training.`; }
  else if (v==="talk"){ p.prom = {k:"con", by:M.day + 30}; mor(5); t = `${n} is pleased. Offer him a new contract from his card within the month.`; }
  else if (v==="wait"){ mor(-4); t = `${n} isn't happy to be kept waiting. Other clubs can talk to him soon.`; }
  else if (v==="leave"){ mor(-8); p.tl = 1; t = `${n} is told he can go. He's on the transfer list.`; }
  a.done = t; mgSave(); return t;
}

/* ---------- the season's story (Home) ---------- */
function mgxStoryHTML(){
  const S = M.storyS===M.season ? (M.story || []) : [];
  if (S.length<3) return "";
  const W = 320, H = 120, L = 26, B = 16, max = Math.max(S[S.length - 1].p, S[S.length - 1].x, 6), n = S.length;
  const X = i => L + (i + 1)/n*(W - L - 6), Y = v => H - B - v/max*(H - B - 8);
  const line = k => `M${L} ${Y(0)} ` + S.map((s, i)=>`L${X(i).toFixed(1)} ${Y(s[k]).toFixed(1)}`).join(" ");
  const lg = M.myres.filter(r=>r.c==="L"); let best = 0, worst = 0, cb = 0, cw = 0;
  lg.forEach(r=>{ cb = r.res!=="L" ? cb + 1 : 0; cw = r.res!=="W" ? cw + 1 : 0; best = Math.max(best, cb); worst = Math.max(worst, cw); });
  const d = S[n - 1].p - S[n - 1].x, U = M.board.ult;
  return `<section class="panel mgx-story"><h2>The season so far</h2>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Points won against the points a club like yours would expect, game by game">
      <line x1="${L}" y1="${Y(0)}" x2="${W - 6}" y2="${Y(0)}" class="ax"/><text x="${L - 4}" y="${Y(max) + 4}" text-anchor="end">${Math.round(max)}</text><text x="${L - 4}" y="${Y(0) + 3}" text-anchor="end">0</text>
      <path d="${line("x")}" class="exp"/><path d="${line("p")}" class="pts"/><circle cx="${X(n - 1).toFixed(1)}" cy="${Y(S[n - 1].p).toFixed(1)}" r="3.5" class="dot"/></svg>
    <div class="mgx-key"><span class="k-p">Your points · ${S[n - 1].p}</span><span class="k-x">Expected · ${S[n - 1].x.toFixed(0)}</span></div>
    <p class="mg-note ${d>=2 ? "ok" : d<=-2 ? "bad" : ""}">${d>=2 ? `${d.toFixed(0)} points better than a club like ${esc(M.club)} would expect.` : d<=-2 ? `${Math.abs(d).toFixed(0)} points short of what a club like ${esc(M.club)} would expect.` : "About where you'd expect to be."} Longest unbeaten run: ${best}. Longest run without a win: ${worst}.</p>
    ${U && !U.done ? `<p class="mg-note bad"><b>Ultimatum:</b> ${U.need} points from ${U.of} league games. So far: ${U.pts} from ${U.g}.</p>` : ""}</section>`;
}
function mgxHomeAsst(nf){
  if (mgDof() || !nf) return "";
  const R = mgxReport(nf), n = R.L.filter(l=>l.k!=="form").length;
  return `<p class="mgx-homeasst"><b>${esc(mgSurname(R.n))}:</b> ${n ? esc(R.L.filter(l=>l.k!=="form")[0].t) + (n>1 ? ` <i>+${n - 1} more on match day</i>` : "") : "Everyone's fit and ready, boss."}${mgxDerby(nf) ? ` <span class="mg-tag bad">DERBY</span>` : ""}</p>`;
}

/* ================= DIRECTOR OF FOOTBALL: THE COACH'S WINDOW PLAN ================= */
const mgxWinId = () => M.season + (mgDate(M.day).getUTCMonth()===0 ? "j" : "s");
const mgxPlan = () => mgDof() && M.cplan && M.cplan.w===mgxWinId() ? M.cplan : null;
const mgxPlanOpen = () => { const P = mgxPlan(); return !!(P && mgInWindow() && P.items.some(i=>i.st==="open")); };
const MGX_STYLE_W = {"Possession":[0,0,.6,.4,0,0], "Gegenpress":[.45,0,.1,0,.1,.35], "Counter-attack":[.6,.2,0,.2,0,0], "Direct":[.1,.35,0,0,.1,.45], "Wing play":[.5,0,.15,.35,0,0], "Balanced":[.17,.17,.17,.17,.16,.16], "Defensive":[0,0,.1,0,.5,.4]};
const MGX_STYLE_WHY = {"Possession":"good on the ball", "Gegenpress":"quick and strong, to press all game", "Counter-attack":"quick on the break", "Direct":"big and direct", "Wing play":"pace and dribbling out wide", "Balanced":"a good all-round player", "Defensive":"solid and disciplined"};
function mgxPlanMake(){
  const C = M.coach; if (!C || C.int) return;
  mdfPick();
  const T = M.tac, slots = MG_FORM[T.f], lv = mgLevel(M.club), byPos = {};
  T.xi.forEach((id, i)=>{ const p = M.P[id], pos = slots[i][0], k = pos==="LWB" ? "LB" : pos==="RWB" ? "RB" : pos, v = p ? mgOvrAt(p, pos) : 40; if (byPos[k]==null || v<byPos[k].v) byPos[k] = {v, cur:p}; });
  let want = Object.entries(byPos).sort((a, b)=>a[1].v - b[1].v).filter(([, x])=>x.v<lv + 1).slice(0, 3);
  if (!want.length) want = Object.entries(byPos).sort((a, b)=>a[1].v - b[1].v).slice(0, 1);
  const w = MGX_STYLE_W[C.style] || MGX_STYLE_W.Balanced, taken = new Set();
  const items = want.map(([pos, x])=>{
    let need = Math.max(x.v + 2, Math.round(lv)), picks = [];
    for (let relax = 0; relax<=4 && picks.length<3; relax += 2){
      const pool = mgSearch({lg:"all", pos, age:99, ovr:need - relax, max:Math.max(M.fin.tb, 1e5)*1.15, name:"", loan:""});
      picks = pool.filter(p=>!taken.has(p.id) && mgOvrAt(p, pos)>=need - relax && mgInterest(p).ok && (!p.club || mgAsk(p)<=M.fin.tb*1.02))
        .map(p=>({p, s:mgOvrAt(p, pos) + (p.pos==="GK" ? 0 : p.at.reduce((t, a, i)=>t + a*w[i], 0)*.18) + (p.age<=23 ? (C.yth - 50)/12 : 0) - (p.age>=31 ? 2 : 0)}))
        .sort((a, b)=>b.s - a.s).slice(0, 3).map(o=>o.p);
    }
    picks.forEach(p=>{ taken.add(p.id); M.kn[p.id] = 100; });
    return {pos, need, cur:x.cur ? x.cur.n : null, curV:x.v, st:"open", picks:picks.map(p=>({id:p.id, n:p.n}))};
  });
  M.cplan = {w:mgxWinId(), d:M.day, items}; M.creq = null;
  mgMail("board", `${C.n}'s plan for the window`, `Your head coach has been through the squad and wants to strengthen:\n\n${items.map(i=>`• ${MG_POS_NAME[i.pos] || i.pos}, rated ${i.need} or better${i.cur ? ` (${i.cur} is ${i.curV} there)` : ""}${i.picks.length ? `: he likes ${i.picks.map(p=>p.n).join(", ")}` : ": nobody he likes is in budget"}`).join("\n")}\n\nHe plays ${C.style.toLowerCase()} football, so he's looking for players who are ${MGX_STYLE_WHY[C.style] || "right for his system"}. Back his choices or sign your own: it's on the Head coach page.`, {stop:1});
}
function mgxPlanTick(){
  const C = M.coach; if (!C) return;
  if (mgInWindow()){ if (!C.int && (!M.cplan || M.cplan.w!==mgxWinId())) mgxPlanMake(); return; }
  const P = M.cplan; if (!P || P.closed) return; P.closed = 1;
  const miss = P.items.filter(i=>i.st==="open"); miss.forEach(i=>{ i.st = "missed"; });
  if (miss.length && !C.int){ C.mood = clamp(C.mood - Math.min(12, miss.length*5), 0, 100);
    mgMail("board", `${C.n} is frustrated`, `"The window's shut and I still don't have ${miss.map(i=>`a ${MG_POS_NAME[i.pos] || i.pos}`).join(" or ")}. I told you what this squad needed."`); }
  else if (!miss.length && P.items.length && !C.int){ C.mood = clamp(C.mood + 4, 0, 100); mgMail("board", `${C.n} is happy with the window`, `"Everything I asked for. Now it's down to me."`); }
}
// a new signing against the plan: his man, your man, or not what he asked for
function mgxPlanArrived(q){
  const P = mgxPlan(), C = M.coach; if (!P || !C) return false;
  const it = P.items.find(i=>i.st==="open" && (q.pos===i.pos || (q.alt || []).includes(i.pos))); if (!it) return false;
  const his = it.picks.some(x=>x.n===q.n), v = mgOvrAt(q, it.pos);
  if (his){ it.st = "his"; it.got = q.n; C.mood = clamp(C.mood + 11, 0, 100); mgMail("board", `${C.n} is delighted`, `"${q.n} is the one I wanted. Thank you for backing me."`); }
  else if (v>=it.need){ it.st = "yours"; it.got = q.n; C.mood = clamp(C.mood + 5, 0, 100); mgMail("board", `${C.n} on ${q.n}`, `"He wasn't on my list, but he's good enough. I can work with him."`); }
  else { C.mood = clamp(C.mood - 3, 0, 100); mgMail("board", `${C.n} isn't convinced`, `"${q.n}? I asked for a ${MG_POS_NAME[it.pos] || it.pos} rated ${it.need}. He's ${v} there. That's not what this team needs."`); }
  return true;
}
// back the coach: try his choices in order, at the asking price and the wage the player wants
function mgxTrust(i){
  const P = mgxPlan(), it = P && P.items[i]; if (!it || it.st!=="open") return "That's already been dealt with.";
  if (!mgInWindow()) return "The transfer window is closed.";
  const why = [];
  for (const pk of it.picks){
    const p = mgFind(pk.id); if (!p || p.club===M.club || M.gone[pk.id]){ why.push(`${pk.n} is no longer available`); continue; }
    if (p.club){ const ask = mgAsk(p); if (ask>M.fin.tb){ why.push(`${pk.n} costs ${mgMoney(ask)}, more than the budget`); continue; }
      let r = mgBid(p, ask); if (!r.ok && r.counter && r.counter<=M.fin.tb) r = mgBid(p, r.counter);
      if (!r.ok){ why.push(`${p.club} wouldn't sell ${pk.n}`); continue; } }
    const role = mgRoleGuessFor(p), yrs = p.age>=33 ? 1 : p.age>=31 ? 2 : 3;
    let c = {wage:mgRoundWage(mgDemand(p, role)*1.02), yrs, role}, o = mgOffer(p, c);
    if (!o.ok && o.counter){ c.wage = o.counter; o = mgOffer(p, c); }
    if (!o.ok){ why.push(`${pk.n}: ${o.txt}`); continue; }
    const q = mgSign(p, c); M.coach.mood = clamp(M.coach.mood + 2, 0, 100);
    return `✍ ${q.n} signs: ${M.coach.n}'s first choice${why.length ? " available" : ""}. ${q._in ? "He goes straight into the coach's plans." : ""}`;
  }
  return it.picks.length ? `None of his choices could be done. ${why.join("; ")}.` : "He has nobody in mind that the budget can reach. Raise money by selling, or find your own.";
}
function mgxPlanHTML(){
  const P = mgxPlan(), C = M.coach; if (!P || !C || C.int) return mgInWindow() || !M.cplan ? "" : `<h3>His plan for the window</h3><p class="hint">The window's closed. He'll give you a new list when the next one opens.</p>`;
  const stTxt = {his:"Signed: his choice", yours:"Signed: your choice", missed:"Not delivered", open:""};
  return `<h3>His plan for this window</h3><p class="hint">${esc(C.n)} plays ${esc(C.style.toLowerCase())} football and wants players who are ${esc(MGX_STYLE_WHY[C.style] || "right for his system")}. Back his choices, or use your own judgement: sign anyone for that position from Transfers. He's happiest with his own picks, fine with a good one of yours, and frustrated if the window shuts with nothing done.</p>
    <div class="mgx-plan">${P.items.map((it, i)=>`<div class="mgx-item st-${it.st}"><div class="mgx-item-h">${mgPosC(it.pos)}<div><b>${esc((MG_POS_NAME[it.pos] || it.pos).replace(/^./, c=>c.toUpperCase()))}</b><small>Rated ${it.need}+${it.cur ? ` · now ${esc(mgShort(it.cur))} (${it.curV})` : ""}</small></div>${it.st!=="open" ? `<span class="pill ${it.st==="missed" ? "down" : "up"}">${stTxt[it.st]}${it.got ? ` · ${esc(mgShort(it.got))}` : ""}</span>` : ""}</div>
      ${it.st==="open" ? `${it.picks.length ? `<div class="mg-list">${it.picks.map((pk, j)=>{ const p = mgFind(pk.id); if (!p || p.club===M.club) return `<div class="mg-row"><span class="mg-pn"><b>${esc(pk.n)}</b><small>No longer available</small></span></div>`;
          const ask = p.club ? mgAsk(p) : 0; return `<button type="button" class="mg-row mgx-pick" data-mg="player" data-id="${esc(p.id)}"><span class="mgx-rank">${j + 1}</span>${mgOvrB(mgOvrAt(p, it.pos), "sm")}<span class="mg-pn"><b>${esc(p.n)}</b><small>${p.age} · ${esc(p.club || "Free agent")}</small></span><span class="mg-val ${ask>M.fin.tb ? "down-t" : ""}">${ask ? mgMoney(ask) : "Free"}</span></button>`; }).join("")}</div>` : `<p class="hint">Nobody he likes is within the budget.</p>`}
        <div class="row">${it.picks.length && mgInWindow() ? mgBtn("xtrust", "Trust him: sign his first choice", "small primary", `data-i="${i}"`) : ""}${mgBtn("mdfseek", "Find my own ▶", "small", `data-p="${it.pos}" data-o="${it.need}"`)}</div>` : ""}</div>`).join("")}</div>`;
}
