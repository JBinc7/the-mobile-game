/* ================= DIRECTOR OF FOOTBALL: THE SCREENS =================
   What's different when you're the Director of Football (mgdof.js): the Head coach page (the coach, his record and
   mood, what he's asking for, his side, his contract, sacking him, and the coaches you could appoint), the club's
   facilities and ticket prices, and the coach on the home screen. Everything else is manager mode's (mgui.js).
   Loaded after mgui.js. */
let MDF_MARKET = false, MDF_SURE = false;
const mdfBar = (l, v) => `<div class="mdf-bar"><span>${l}</span><span class="mdf-barm"><i style="width:${v}%" class="${v>=75 ? "hi" : v>=55 ? "ok" : v>=40 ? "mid" : "lo"}"></i></span><b>${v}</b></div>`;
const mdfFace = (C, px) => mgAvatar({n:C.n, nat:C.nat, lk:mgLook(mgR(C.n + "|coach"), C.nat)}, M.club, px);
function mdfRatings(C){ return `<div class="mdf-bars">${mdfBar("Tactics", C.tac)}${mdfBar("Motivation", C.mot)}${mdfBar("Development", C.dev)}${mdfBar("Youth trust", C.yth)}</div>`; }
function mdfCoachHTML(){
  const C = M.coach, T = M.tac, S = MDF_STYLES[C.style] || MDF_STYLES.Balanced, slots = MG_FORM[T.f], R = M.creq;
  const xi = T.xi.map((id, i)=>({p:M.P[id], pos:slots[i][0], x:slots[i][1], y:slots[i][2]}));
  const fam = Math.round(T.fam[T.f] || 50);
  return `<section class="panel mdf-coach"><h2>Head coach</h2>
    ${C.int ? `<p class="mg-note bad"><b>${esc(C.n)} is in caretaker charge.</b> The team plays below itself and the owner wants a permanent appointment. Pick from the coaches below.</p>` : ""}
    <div class="mdf-top">${mdfFace(C, 96)}<div style="min-width:0"><h3 class="mdf-name">${esc(C.n)}${C.int ? ` <span class="pill">Interim</span>` : ""}</h3>
      <p class="hint">${esc(C.nat)} · ${C.age} · <b>${esc(C.style)}</b> · ${esc(C.f)} · reputation ${C.rep}</p>${mdfRatings(C)}</div></div>
    <div class="mg-kpis"><div><span class="label">This season</span><b>${C.rec.w}–${C.rec.d}–${C.rec.l}</b><small>${esc(mdfPerfTxt(C))}</small></div>
      <div><span class="label">Mood</span><b>${mdfMood(C.mood)}</b><span class="meter ${C.mood<35 ? "over" : ""}"><span style="width:${C.mood}%"></span></span></div>
      <div><span class="label">Contract</span><b>${mgWageTxt(C.wage)}</b><small>until ${C.con + 1}</small></div>
      <div><span class="label">Training</span><b>${esc({bal:"Balanced", att:"Attacking", def:"Defending", pos:"Possession", fit:"Fitness", tac:"Tactical", rec:"Recovery"}[S.focus] || "Balanced")}</b><small>${["Light","Normal","Hard"][S.int]} intensity</small></div></div>
    ${R ? `<p class="mg-note warn"><b>He wants a ${esc(MG_POS_NAME[R.pos] || R.pos)}</b> rated ${R.need} or better${R.until ? `, by ${mgFmt(R.until)}` : ""}. ${mgBtn("mdfseek", "Find one ▶", "small", `data-p="${R.pos}" data-o="${R.need}"`)}</p>` : ""}
    <h3>His side · ${esc(T.f)} · ${esc(MG_MENT[T.ment])} · ${esc(T.style)}</h3>
    <p class="hint">He picks the team and the tactics. The squad knows his ${esc(T.f)} ${fam}% well${fam<85 ? ": it takes a few weeks to learn a new coach's shape" : ""}.</p>
    <div class="mg-pitch mdf-pitch" aria-label="The coach's XI">${xi.map(({p, pos, x, y})=>`<span class="mg-tok ${mgFitCls(p, pos)}" style="left:${(x*100).toFixed(1)}%;bottom:${(4 + y*88).toFixed(1)}%"><b>${p ? mgOvrAt(p, pos) : "–"}</b><span>${p ? esc(mgSurname(p.n)) : "Empty"}</span><small>${pos}</small></span>`).join("")}</div>
    ${C.int ? "" : `<h3>His contract</h3><div class="mdf-form"><div class="field"><label for="mdfWage">Weekly wage (£)</label><input id="mdfWage" type="number" min="0" step="1000" value="${mdfWage(C.rep, mgLeagueOf())}" inputmode="numeric"></div>
        <div class="field"><label for="mdfYrs">Years</label><select id="mdfYrs">${[1,2,3,4].map(y=>`<option ${y===2 ? "selected" : ""}>${y}</option>`).join("")}</select></div>${mgBtn("mdfrenew", "Offer a new contract", "primary")}</div>
      <div class="row" style="margin-top:12px">${mgBtn("mdfsack", MDF_SURE ? `Tap again: compensation ${mgMoney(mdfComp(C))}` : `Sack ${esc(mgSurname(C.n))}`, "danger")}<span class="hint">Sacking him costs ${mgMoney(mdfComp(C))}: half his remaining wages.</span></div>`}
    <h3>The coach market</h3>${C.int || MDF_MARKET ? mdfMarketHTML() : `<p class="hint">Coaches out of work, and some at other clubs, who you could bring in.</p>${mgBtn("mdfmarket", "Look at the market", "small")}`}
    ${(M.exCoach || []).length ? `<h3>Past coaches</h3><div class="mg-list">${M.exCoach.slice().reverse().map(x=>`<div class="mg-row"><b>${esc(x.n)}</b><small>${esc(x.style || "")} · left ${esc(x.s)}</small><span class="mg-val">${x.rec ? `${x.rec.w}–${x.rec.d}–${x.rec.l}` : ""}</span></div>`).join("")}</div>` : ""}
  </section>`;
}
function mdfMarketHTML(){
  const L = mdfCands();
  return `<div class="mdf-cands">${L.map((c, i)=>{ const I = mdfInterest(c), ask = mgRoundWage(c.ask*(I.hard ? 1.25 : 1));
    return `<article class="mdf-cand ${I.ok ? "" : "no"}"><div class="mdf-cand-h">${mdfFace(c, 54)}<div style="min-width:0"><b>${esc(c.n)}</b><small>${esc(c.nat)} · ${c.age} · ${esc(c.style)} · ${esc(c.f)}</small>
        <small>${c.club ? `At ${esc(c.club)} · compensation ${mgMoney(c.comp)}` : "Out of work"} · reputation ${c.rep}</small></div></div>
      <div class="mdf-mini"><span>TAC <b>${c.tac}</b></span><span>MOT <b>${c.mot}</b></span><span>DEV <b>${c.dev}</b></span><span>YTH <b>${c.yth}</b></span></div>
      <p class="mg-int ${I.ok ? "ok" : "bad"}">${esc(I.txt)}</p>
      ${I.ok ? `<div class="mdf-form"><div class="field"><label for="mdfW${i}">Wage (£/wk) · he wants about ${mgWageTxt(ask)}</label><input id="mdfW${i}" type="number" min="0" step="1000" value="${ask}" inputmode="numeric"></div>
        <div class="field"><label for="mdfY${i}">Years</label><select id="mdfY${i}">${[1,2,3,4].map(y=>`<option ${y===c.yrs ? "selected" : ""}>${y}</option>`).join("")}</select></div>${mgBtn("mdfhire", "Appoint him", "primary small", `data-i="${i}"`)}</div>` : ""}</article>`; }).join("")}</div>`;
}
// the coach on the home screen
function mdfHomeCoach(){
  const C = M.coach, R = M.creq;
  return `<section class="panel mdf-homecoach"><h2>Head coach</h2><div class="mdf-top sm">${mdfFace(C, 64)}<div style="min-width:0"><b class="mdf-name">${esc(C.n)}${C.int ? ` <span class="pill">Interim</span>` : ""}</b>
      <p class="hint">${esc(C.style)} · ${esc(C.f)} · ${C.rec.w}–${C.rec.d}–${C.rec.l}</p></div></div>
    <div class="mg-kpis"><div><span class="label">Performance</span><b class="${mdfPerf(C)>=4 ? "up-t" : mdfPerf(C)<=-4 ? "down-t" : ""}">${esc(mdfPerfTxt(C).split(" (")[0])}</b></div><div><span class="label">Mood</span><b>${mdfMood(C.mood)}</b><span class="meter ${C.mood<35 ? "over" : ""}"><span style="width:${C.mood}%"></span></span></div></div>
    ${C.int ? `<p class="mg-note bad">You need a permanent head coach.</p>` : R ? `<p class="mg-note warn">He wants a ${esc(MG_POS_NAME[R.pos] || R.pos)} rated ${R.need}+.</p>` : ""}
    <div class="row">${mgBtn("tab", "Head coach", "small", 'data-k="coach"')}${mgBtn("tab", "Transfers", "small", 'data-k="transfers"')}</div></section>`;
}
function mdfMoneyLine(){
  const m = mdfSeasonMoney();
  return `<div class="mg-kpis" style="margin-top:10px"><div><span class="label">${m.profit>=0 ? "Profit" : "Loss"} this season</span><b class="${m.profit>=0 ? "up-t" : "down-t"}">${mgMoney(Math.abs(m.profit))}</b></div><div><span class="label">Wages / revenue</span><b>${m.inc ? Math.round(m.wr*100) + "%" : "–"}</b></div></div>`;
}
function mdfFacilitiesHTML(){
  const F = M.fac, row = (k, l, d) => `<div class="mdf-fac"><div><b>${l}</b> <span class="mdf-stars">${"★".repeat(F[k])}${"☆".repeat(5 - F[k])}</span><p class="hint">${d}</p></div>
    ${F.job && F.job.k===k ? `<span class="pill">Being built · ${Math.max(1, Math.ceil(F.job.d/7))} wk</span>` : F[k]>=5 ? `<span class="pill up">Top class</span>` : mgBtn("mdfbuild", `Upgrade · ${mgMoney(mdfFacCost(k, F[k]))}`, "small primary", `data-k="${k}" ${F.job ? "disabled" : ""}`)}</div>`;
  return `<p class="hint">Money spent on buildings comes out of your transfer budget, but the owner doesn't count it against your profit target. The work takes about nine weeks. One project at a time. Better buildings cost more to run: ${mgMoney(mdfOpsWeek())} a week goes on running the club now.</p>
    ${row("train", "Training ground", F.train===3 ? "Players develop as fast as at an average club." : `Players develop ${Math.abs((F.train - 3)*8)}% ${F.train>3 ? "faster" : "slower"} than at an average club.`)}
    ${row("acad", "Academy", "Better youth intakes every March, with more chance of a gem.")}`;
}
function mdfTixHTML(){
  return `<h3>Ticket prices</h3>${mgSeg("mdftix", "t", MDF_TIX.map((l, i)=>[i, l]), M.fin.tix ?? 1)}
    <p class="hint">Low prices fill the ground and the crowd gets behind the team; high prices bring in more money per game but fewer fans, a flatter atmosphere and, in time, protests.</p>`;
}

document.addEventListener("click", e=>{
  if (APP!=="manager" || !M || !mgDof()) return;
  const b = e.target.closest("[data-mg]"); if (!b || b.disabled) return;
  const a = b.dataset.mg, re = () => mgRender();
  if (a==="mdfmarket"){ MDF_MARKET = true; re(); return; }
  if (a==="mdfsack"){ if (!MDF_SURE){ MDF_SURE = true; re(); setTimeout(()=>{ if (MDF_SURE){ MDF_SURE = false; if (MG_TAB==="coach") re(); } }, 3500); return; } MDF_SURE = false; const err = mdfSack(); mgFlash(err || "Done. The search for a new head coach begins."); re(); return; }
  if (a==="mdfrenew"){ const r = mdfRenew(Math.round(+document.getElementById("mdfWage").value || 0), +document.getElementById("mdfYrs").value); mgFlash(r.txt); re(); return; }
  if (a==="mdfhire"){ const i = +b.dataset.i, r = mdfHire(i, Math.round(+document.getElementById(`mdfW${i}`).value || 0), +document.getElementById(`mdfY${i}`).value); mgFlash(r.txt); if (r.ok) MDF_MARKET = false; re(); return; }
  if (a==="mdfseek"){ MG_TAB = "transfers"; MG_SUB.transfers = "search"; MG_Q = {...MG_Q, pos:b.dataset.p, ovr:Math.max(0, Math.floor(+b.dataset.o/5)*5 - 5)}; MG_RES = mgSearch(MG_Q); re(); window.scrollTo({top:0}); return; }
  if (a==="mdfbuild"){ const err = mdfBuild(b.dataset.k); mgFlash(err || "Work has started."); re(); return; }
  if (a==="mdftix"){ M.fin.tix = +b.dataset.v; mgSave(); re(); return; }
  if (a==="mdfpoach"){ const m = M.inbox.find(x=>x.id===+b.dataset.m); if (m && m.act) mgFlash(mdfPoachAnswer(m, b.dataset.v==="yes")); re(); return; }
});
