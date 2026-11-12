/* ================= MANAGER CAREER: THE SCREENS =================
   Everything you see in manager mode: making your manager and picking a club, then the club's hub, with a Continue
   button that moves the season on. Home (the next match, the board, the table, the squad's news), Squad, Tactics
   (formation, the XI on a pitch, mentality and instructions), Transfers (search, scouting, offers, your list),
   Competitions (table, fixtures, stats, cups, Europe, every league), Club (finances, board, academy, training, jobs,
   your career) and the Inbox. Players open on a card with their attributes, contract and what you can do with them.
   Matches are on the match screen (mgmatch.js). Loaded after mgmatch.js. */
let MG_TAB = "home", MG_FLASH = "", MG_NEW = null, MG_SEL = null, MG_PRE = null, MG_LAST = null, MG_BUSY = false;
const MG_SUB = {transfers:"search", comps:"table", club:"overview", squad:"all"};
let MG_Q = {pos:"any", age:40, ovr:0, max:0, lg:"all", name:"", loan:"any"}, MG_RES = null, MG_DLG = null, MG_LGV = null, MG_EUV = null, MG_SORT = "pos";

/* ---------- small pieces ---------- */
const mgIc = (d, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const MG_IC = {
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  squad:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6.2 4.4 1.9 5 5.4"/>',
  tactics:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/><circle cx="7.5" cy="7.5" r="1.3"/><circle cx="16.5" cy="16.5" r="1.3"/><path d="M14 7l3 3M17 7l-3 3"/>',
  transfers:'<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  comps:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a2.5 2.5 0 0 0 3 4M16 6h3a2.5 2.5 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  club:'<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M12 7v10"/>',
  inbox:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  coach:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 10h7M8.5 14h7M8.5 18h4"/>'
};
const mgPosC = (pos) => `<span class="mg-pos p-${MG_GROUP(pos)}">${pos}</span>`;
function mgOvrB(v, cls = ""){ const t = v>=85 ? "elite" : v>=78 ? "gold" : v>=70 ? "silver" : "bronze"; return `<b class="mg-ovr ${t} ${cls}">${v}</b>`; }
function mgEstB(p){ const e = mgEst(p); return e.lo===e.hi ? mgOvrB(e.lo) : `<b class="mg-ovr est" title="Scout knowledge ${e.k}%">${e.lo}–${e.hi}</b>`; }
const mgPotTxt = p => { const e = mgEst(p); return e.plo==null ? "?" : e.plo===e.phi ? String(e.plo) : `${e.plo}–${e.phi}`; };
const mgFitBar = p => `<span class="mg-fitw" title="Fitness ${Math.round(p.fit)}%${p.stam ? " · short of stamina after injury" : ""}"><span class="mg-fit"><i style="width:${p.fit}%" class="${p.fit<70 ? "low" : p.fit<85 ? "mid" : ""}"></i></span>${mgxFitTxt(p)}${p.stam ? `<i class="mgx-stam" aria-label="Short of stamina">▾</i>` : ""}</span>`;
const mgMorIc = m => `<span class="mg-mor m${m>=80 ? 4 : m>=65 ? 3 : m>=50 ? 2 : m>=35 ? 1 : 0}" title="Morale: ${mgMorLabel(m)}" aria-label="Morale ${mgMorLabel(m)}"></span>`;
const mgFormPills = s => s ? s.split("").map(c=>`<span class="tf ${c.toLowerCase()}">${c}</span>`).join("") : `<span class="hint">–</span>`;
function mgTags(p){
  const t = [];
  if (p.inj) t.push(`<span class="mg-tag bad">INJ ${mgWeeks(p.inj.d)}</span>`);
  if (p.ban>0) t.push(`<span class="mg-tag bad">BAN ${p.ban}</span>`);
  if (p.loan) t.push(`<span class="mg-tag">LOAN · ${esc(p.loan.club)}</span>`);
  if (p.lin) t.push(`<span class="mg-tag loan">ON LOAN FROM ${esc(p.lin.from || "").toUpperCase()}</span>`);
  if (p.tl) t.push(`<span class="mg-tag warn">LISTED</span>`);
  if (p.ll) t.push(`<span class="mg-tag warn">LOAN LIST</span>`);
  if (p.req) t.push(`<span class="mg-tag bad">WANTS OUT</span>`);
  if (p.con<=M.season && p.club===M.club) t.push(`<span class="mg-tag warn">EXPIRING</span>`);
  if (M.tac && M.tac.cap===p.id) t.push(`<span class="mg-tag cap">C</span>`);
  return t.join("");
}
function mgAvatar(p, club, px = 64){
  const L = p.lk || (p.n ? mgLook(mgR(p.n + "|" + p.nat), p.nat) : {s:1, h:0, c:"Black", b:0}), skin = SKIN[L.s] || SKIN[1], hc = HAIRC[L.c] || HAIRC.Black, c = meta(club || p.club || M.club || "") || {c1:"#333", c2:"#fff"}, id = "av" + (++pid);
  const hair = ["M30 27c0-11 8-17 18-17s18 6 18 17c-2-6-8-9-18-9s-16 3-18 9z", "M29 30c-1-13 7-20 19-20s20 7 19 20c-3-8-9-11-19-11s-16 3-19 11z", "M31 26c2-9 9-14 17-14s15 5 17 14l-2 2c-3-5-8-8-15-8s-12 3-15 8z",
    "M28 31c-2-14 6-22 20-22s22 8 20 22c-1-4-3-7-5-8 1 3 0 5-1 6-3-6-8-8-14-8s-11 2-14 8c-1-1-2-3-1-6-2 1-4 4-5 8z", "M33 24c3-7 9-10 15-10s12 3 15 10c-4-3-9-4-15-4s-11 1-15 4z", ""][L.h % 6];
  return `<svg class="mg-av" viewBox="0 0 96 96" width="${px}" height="${px}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c1}" stop-opacity=".75"/></linearGradient></defs>
    <path d="M10 96c2-18 16-27 38-27s36 9 38 27z" fill="url(#${id})"/><path d="M38 70l10 10 10-10" fill="none" stroke="${c.c2}" stroke-width="3"/>
    <rect x="40" y="52" width="16" height="16" rx="5" fill="${skin}"/><ellipse cx="48" cy="36" rx="17" ry="20" fill="${skin}"/>
    ${hair ? `<path d="${hair}" fill="${hc}"/>` : ""}${L.b ? `<path d="M33 42c1 10 7 16 15 16s14-6 15-16c-2 6-8 9-15 9s-13-3-15-9z" fill="${hc}" opacity=".85"/>` : ""}
    <circle cx="41.5" cy="37" r="1.7" fill="#1b1410"/><circle cx="54.5" cy="37" r="1.7" fill="#1b1410"/><path d="M43 47c3 2 7 2 10 0" stroke="#7a4a35" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}
function mgCrestName(club, px = 20){ return `<span class="mg-cn">${clubBadge(club, px)}<span>${esc(club)}</span></span>`; }
const mgBtn = (act, label, cls = "", extra = "") => `<button type="button" class="btn ${cls}" data-mg="${act}" ${extra}>${label}</button>`;
function mgSeg(act, key, opts, cur){ return `<div class="mg-seg" role="group">${opts.map(([v, l])=>`<button type="button" data-mg="${act}" data-k="${key}" data-v="${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join("")}</div>`; }
function mgSubTabs(g, views){ const cur = MG_SUB[g]; return `<div class="subtabs mg-subtabs" role="tablist">${views.map(([k, l])=>`<button type="button" role="tab" data-mg="sub" data-g="${g}" data-k="${k}" aria-selected="${cur===k}">${l}</button>`).join("")}</div>`; }
function mgGauge(v, label){
  const a = Math.PI*(1 - v/100), x = 60 + 46*Math.cos(a), y = 60 - 46*Math.sin(a), col = v>=65 ? "var(--up)" : v>=35 ? "var(--accent)" : "var(--down)";
  return `<div class="mg-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M14 60a46 46 0 0 1 92 0" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/>
    <path d="M14 60a46 46 0 0 1 92 0" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="${v} 100" style="filter:drop-shadow(0 0 6px ${col})"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#fff"/></svg><div class="mg-gauge-v"><b>${Math.round(v)}</b><span>${esc(label)}</span></div></div>`;
}

/* ---------- the save: summaries for the main menu, opening and closing ---------- */
function mgSummary(d){
  if (!d || !d.mgr) return null;
  let lg = ""; for (const t in d.tiers || {}) if ((d.tiers[t] || []).includes(d.club)) lg = TIERS[keyOf(t)] ? TIERS[keyOf(t)].name : "";
  const c = d.car || {}, tro = (d.trophies || []).length;
  if (d.role==="dof") return {name:d.mgr.name, sub:d.club ? `Director of Football · ${d.club}` : "Out of work", club:d.club, season:seasonLabel(d.season), done:d.phase==="retired", updated:d.updated,
    stats:[["Seasons", (d.hist || []).filter(h=>!h.part).length], ["Coach", d.coach ? String(d.coach.n).split(" ").slice(-1)[0] : "–"], ["Balance", d.fin ? mgMoney(d.fin.bal) : "–"], ["Trophies", tro]]};
  return {name:d.mgr.name, sub:d.club ? `${d.club}${lg ? " · " + lg : ""}` : "Out of work", club:d.club, season:seasonLabel(d.season), done:d.phase==="retired", updated:d.updated,
    stats:[["Games", c.p || 0], ["Won", c.w || 0], ["Win %", c.p ? Math.round(c.w/c.p*100) + "%" : "–"], ["Trophies", tro]]};
}
const Mgr = {
  summary:mgSummary,
  open(slot, key, role){
    MG_SLOT = slot; MG_KEY = key; M = mgLoad(key); MG_TAB = "home"; MG_PRE = null; MG_LAST = null; MG_FLASH = ""; MG_SEL = null; MG_RES = null; mgVCache.clear();
    if (M){ M._tier = null; M._idx = null; M._lv = null; mgTierOf(M.club); if (M.phase!=="new" && M.club && M.tac) mgMendXI(true); }
    else MG_NEW = {step:1, name:"", nat:"England", age:42, bg:role==="dof" ? "analyst" : "pro", kit:0, lg:1, club:null, role:role==="dof" ? "dof" : "mgr"};
    // a retired player going into management (mgdepth.js): his name, and a head start
    if (!M && window.MGW_PREFILL){ const X = window.MGW_PREFILL; window.MGW_PREFILL = null; Object.assign(MG_NEW, {name:X.name, nat:SQ_NAMES[X.nat] ? X.nat : "England", age:X.age, bg:"player", ex:X.ex, exRep:X.rep}); }
    if (typeof Hub!=="undefined") Hub.paintBand(M ? M.role : role);
    mgRender();
  },
  close(){ if (M) mgSave(); if (typeof mmClose==="function") mmClose(); mgDlgClose(); M = null; MG_KEY = ""; },
  render:()=>mgRender(),
  saveNow:()=>mgSave(),
  hall:()=>mgHallGet(),
  mergeHall(list){ const map = new Map(mgHallGet().map(e=>[e.id, e])); (list || []).forEach(e=>{ const l = map.get(e.id); if (!l || (e.updated || 0)>(l.updated || 0)) map.set(e.id, e); }); try{ localStorage.setItem(mgHallKey(), JSON.stringify([...map.values()])); }catch(e){} },
  hallHTML(){
    const list = mgHallGet().sort((a, b)=>b.tro - a.tro || b.w - a.w);
    $("#bandRight").innerHTML = Hub.menuBtn();
    return `<div class="hub"><div class="hub-top"><button type="button" class="btn small" data-hub="home">‹ Main menu</button><div><div class="eyebrow">Managers and directors</div><h2 class="hub-h">Hall of fame</h2></div></div>
      ${list.length ? `<div class="mg-list">${list.map((e, i)=>`<div class="mg-hall"><span class="mg-hall-n">${i + 1}</span>${e.club ? clubBadge(e.club, 34) : ""}<div style="min-width:0"><b>${esc(e.name)} <span class="pill ${e.role==="dof" ? "eu" : ""}">${e.role==="dof" ? "Director" : "Manager"}</span></b><small>${esc(e.clubs.join(" · "))}</small><small>${e.list.length ? esc(e.list.join(", ")) : "No trophies yet"}</small></div>
        <div class="mg-hall-s"><span><b>${e.tro}</b> trophies</span><span><b>${e.p}</b> games · ${e.p ? Math.round(e.w/e.p*100) : 0}% won</span><span>${e.seasons} season${e.seasons===1 ? "" : "s"}</span></div></div>`).join("")}</div>`
      : `<section class="panel"><p class="hint">Nobody yet. Start a Manager Career or a Director of Football career and your record will be kept here.</p></section>`}</div>`;
  }
};

/* ---------- drawing it all ---------- */
function mgRender(){
  if (APP!=="manager") return;
  if (!M){ mgRenderNew(); return; }
  const unread = M.inbox.filter(m=>!m.seen).length;
  $("#bandRight").innerHTML = `<span class="season-tag">${seasonLabel(M.season)}</span>${Hub.menuBtn()}`;
  const dof = mgDof(), tabs = [["home","Home"],["squad","Squad"],dof ? ["coach","Head coach","Coach"] : ["tactics","Tactics"],["transfers","Transfers"],["comps","Competitions","Comps"],["club","Club"],["inbox","Inbox"]];
  if (dof && MG_TAB==="tactics") MG_TAB = "coach"; if (!dof && MG_TAB==="coach") MG_TAB = "tactics";
  const nf = M.phase==="season" || M.phase==="pre" ? mgNextFixture() : null, today = nf && nf.day===M.day;
  const cont = M.phase==="summer" ? "Next season" : M.phase==="sacked" ? "Wait a week" : today ? "Match day ▶" : "Continue";
  const body = MG_PRE ? mgPreHTML() : MG_TAB==="home" ? mgHomeHTML(nf) : MG_TAB==="squad" ? mgSquadHTML() : MG_TAB==="tactics" ? mgTacticsHTML() : MG_TAB==="coach" ? mdfCoachHTML() : MG_TAB==="transfers" ? mgTransfersHTML()
    : MG_TAB==="comps" ? mgCompsHTML() : MG_TAB==="club" ? mgClubHTML() : mgInboxHTML();
  const c = meta(M.club);
  $("#app").innerHTML = `${MG_FLASH ? `<p class="ref mg-flash" role="status">${esc(MG_FLASH)}</p>` : ""}
  <div class="mg" style="--club1:${c.c1};--club2:${c.c2}">
    <section class="mg-head">
      <div class="mg-head-id">${clubBadge(M.club, 54)}<div style="min-width:0"><div class="mg-head-club">${esc(M.club)}</div>
        <div class="mg-head-sub">${esc(M.mgr.name)}${dof ? ` · Director of Football · coach ${esc(M.coach.n)}` : ""} · ${TIERS[mgLeagueOf()].name} · <b>${(mgTable(mgLeagueOf()).find(r=>r.n===M.club) || {}).p ? ord(mgPos()) : M.phase==="pre" ? "Pre-season" : "–"}</b></div></div></div>
      <div class="mg-head-chips"><span class="mg-chip"><small>Date</small><b>${mgFmt(M.day)}</b></span><span class="mg-chip"><small>Transfer budget</small><b>${mgMoney(M.fin.tb)}</b></span>
        <span class="mg-chip ${M.board.conf<35 ? "bad" : ""}"><small>${dof ? "Owner" : "Board"}</small><b>${mgConfLabel(M.board.conf)}</b></span></div>
      ${MG_PRE ? "" : `<button type="button" class="mg-continue ${today ? "match" : ""}" data-mg="continue" ${MG_BUSY ? "disabled" : ""}><span>${cont}</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4l10 8-10 8z" fill="currentColor"/></svg></button>`}
    </section>
    <div class="tabs mg-tabs" role="tablist">${tabs.map(([k, l, sh])=>`<button class="tab" role="tab" aria-selected="${MG_TAB===k && !MG_PRE}" data-mg="tab" data-k="${k}" aria-label="${l}">${mgIc(MG_IC[k])}<span class="t-l">${l}</span><span class="t-s">${sh || l}</span>${k==="inbox" && unread ? `<span class="count">${unread}</span>` : ""}</button>`).join("")}</div>
    <div id="mgBody" class="col mg-body">${body}</div>
  </div>`;
  MG_FLASH = "";
  if (MG_TAB==="inbox" && !MG_PRE) setTimeout(()=>{ if (M){ M.inbox.forEach(m=>{ m.seen = true; }); mgSave(); } }, 0);
}
function mgGo(){
  if (MG_BUSY || !M) return;
  if (M.phase==="sacked"){ mgcWait(7); mgFlash(`${mgFmt(M.day)}. ${(M.jobs || []).length} vacanc${(M.jobs || []).length===1 ? "y" : "ies"} open.`); MG_TAB = "home"; MG_PRE = null; mgRender(); return; }
  const today = mgUserFixture();
  if (!M.done && today){ MG_PRE = today; mgRender(); window.scrollTo({top:0}); return; }
  MG_BUSY = true; mgRender();
  setTimeout(()=>{
    let r; try{ r = mgAdvance(); } catch(err){ console.error(err); MG_FLASH = "Something went wrong moving on. Your save is safe."; r = {stop:"idle"}; }
    MG_BUSY = false; MG_LAST = r.stop==="match" ? MG_LAST : MG_LAST;
    if (r.stop==="match"){ MG_PRE = r.fx; MG_TAB = "home"; }
    else if (r.stop==="mail"){ MG_TAB = "inbox"; }
    else if (r.stop==="summer" || r.stop==="season"){ MG_TAB = "home"; }
    else if (r.stop==="sacked"){ MG_TAB = "home"; }
    mgRender(); window.scrollTo({top:0});
  }, 30);
}

/* ---------- a new manager ---------- */
const MG_BG = [["sunday","Sunday league","No playing career to speak of. The players will need convincing."], ["semi","Semi-pro","A few years in non-league football."], ["pro","Former pro","A solid professional career. Players know your name."], ["intl","Former international","You played for your country. Instant respect."]];
const MG_KITS = ["#111827", "#1E3A8A", "#7F1D1D", "#F8FAFC"];
function mgRenderNew(){
  const N = MG_NEW;
  $("#bandRight").innerHTML = Hub.menuBtn();
  const dof = N.role==="dof", steps = [dof ? "Director" : "Manager", "League", "Club"];
  let body = "";
  if (N.step===1){
    const nats = Object.keys(SQ_NAMES).sort();
    body = `<section class="panel mg-new"><h2>${dof ? "Your director" : "Your manager"}</h2>
      <div class="grid-form">
        <div class="field"><label for="mg-name">Name</label><input id="mg-name" data-mgin="name" value="${esc(N.name)}" maxlength="26" placeholder="e.g. Alex Carter" autocomplete="off"></div>
        <div class="field"><label for="mg-nat">Nationality</label><select id="mg-nat" data-mgin="nat">${nats.map(n=>`<option ${n===N.nat ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
        <div class="field"><label for="mg-age">Age · <output id="mgAgeOut">${N.age}</output></label><input id="mg-age" type="range" min="28" max="70" value="${N.age}" data-mgin="age"></div>
      </div>
      <h3>${dof ? "Background" : "Playing background"}</h3>
      <div class="mg-bgs">${(dof ? MDF_BG : MG_BG).map(([k, t, d])=>`<button type="button" class="mg-bg" data-mg="nset" data-k="bg" data-v="${k}" aria-pressed="${N.bg===k}"><b>${t}</b><span>${d}</span></button>`).join("")}</div>
      ${dof ? "" : `<h3>Touchline look</h3>
      <div class="swatches">${MG_KITS.map((c, i)=>`<button type="button" class="sw" data-mg="nset" data-k="kit" data-v="${i}" aria-pressed="${N.kit===i}" aria-label="Suit ${i + 1}" style="--sw:${c}"></button>`).join("")}</div>`}
      <div class="row" style="margin-top:18px">${mgBtn("nnext", "Choose a league ▶", "primary big")}</div>
      <p class="err" id="mgNewErr" role="alert"></p></section>`;
  } else if (N.step===2){
    body = `<section class="panel mg-new"><h2>Choose a league</h2><p class="hint">Any club in the game is yours to take: from the National League to the biggest clubs in Europe.</p>
      <div class="mg-leagues">${MG_PLAYABLE.map(t=>{ const T = TIERS[t], clubs = TIER_LISTS[t], top = clubs.slice().sort((a, b)=>META[b].r - META[a].r).slice(0, 5);
        return `<button type="button" class="mg-lgc" data-mg="nset" data-k="lg" data-v="${t}" aria-pressed="${String(N.lg)===String(t)}"><span class="mg-lgc-c">${esc(T.country)} · Level ${T.level}</span><b>${esc(T.name)}</b>
          <span class="mg-lgc-b">${top.map(c=>clubBadge(c, 22)).join("")}</span><small>${clubs.length} clubs</small></button>`; }).join("")}</div>
      <div class="row" style="margin-top:18px">${mgBtn("nback", "‹ Back")}${mgBtn("nnext", "Choose a club ▶", "primary big")}</div></section>`;
  } else {
    const t = keyOf(N.lg), clubs = TIER_LISTS[t].slice().sort((a, b)=>META[b].r - META[a].r);
    const pick = N.club && clubs.includes(N.club) ? N.club : null, R = MG_RANGE[t];
    const lvOf = c => Math.round(R[0] + clamp((META[c].r - .6)/.4, -.2, 1.12)*(R[1] - R[0]));
    const starOf = c => { const r = META[c].r, top = isTop(t); return clamp(Math.round(((top ? 3 : 2.2 - (TIERS[t].level - 2)*.45) + (r - .75)*6*(top ? 1 : .5))*2)/2, .5, 5); };
    body = `<section class="panel mg-new"><h2>Choose a club · ${esc(TIERS[t].name)}</h2>
      <div class="mg-clubs">${clubs.map(c=>`<button type="button" class="mg-clubc" data-mg="nset" data-k="club" data-v="${esc(c)}" aria-pressed="${pick===c}" style="--c1:${META[c].c1}">
        ${clubBadge(c, 40)}<span class="mg-clubc-n"><b>${esc(c)}</b>${mgStarsHTML(starOf(c))}</span><span class="mg-clubc-o">${mgOvrB(lvOf(c))}</span></button>`).join("")}</div>
      ${pick ? `<div class="mg-pick" style="--c1:${META[pick].c1};--c2:${META[pick].c2}">${clubBadge(pick, 72)}<div><div class="eyebrow">${esc(META[pick].nick || "")} · founded ${esc(META[pick].founded || "")}</div><h3>${esc(pick)}</h3>
        <p class="hint">${esc(META[pick].bio || "")}</p><p class="hint">Ground: <b>${esc(META[pick].ground || "")}</b> · Team rating <b>${lvOf(pick)}</b></p></div></div>` : ""}
      <div class="row" style="margin-top:18px">${mgBtn("nback", "‹ Back")}${mgBtn("ntake", pick ? `${dof ? "Join" : "Take charge of"} ${esc(pick)} ▶` : "Pick a club", "primary big", pick ? "" : "disabled")}${mgBtn("nrand", "Random club")}</div></section>`;
  }
  $("#app").innerHTML = `<div class="mg-newwrap"><div class="intro"><div class="eyebrow">New ${dof ? "director of football" : "manager"} career · ${seasonLabel(2026)} · slot 0${MG_SLOT}</div><h2 class="intro-h">${dof ? "The boardroom awaits" : "The dugout awaits"}</h2>
    <p class="intro-p">${dof ? "Run a club from above the dugout: hire and fire head coaches, buy and sell players, balance the books and keep the owner happy." : "Build your manager, pick a club and take charge: tactics, transfers, the academy and a board to keep happy."}</p></div>
    <ol class="mg-steps">${steps.map((s, i)=>`<li class="${N.step===i + 1 ? "on" : N.step>i + 1 ? "done" : ""}"><span>${i + 1}</span>${s}</li>`).join("")}</ol>${body}</div>`;
}
function mgCreate(){
  const N = MG_NEW;
  mgNewSave({name:N.name, nat:N.nat, age:N.age, bg:N.bg, kit:N.kit, role:N.role});
  mgwApply();
  M._tier = null; mgSeasonLevels();
  mgTakeJob(N.club, true);
  mgStartSeason(); M.phase = "pre"; mgcEnsure();
  M.board.obj = mgObjectives(); M.board.season = M.season;
  MG_NEW = null; MG_TAB = "home"; mgSave(); mgHallRecord();
  MG_FLASH = mgDof() ? `Welcome to ${M.club}. Meet your head coach, ${M.coach.n}, then press Continue to start pre-season.` : `Welcome to ${M.club}, boss. Press Continue to start pre-season.`;
  mgRender(); window.scrollTo({top:0});
}

/* ================= HOME ================= */
function mgClubForm(club){ const t = mgTierOf(club); if (t!=null && M.tab[t] && M.tab[t][club]) return M.tab[t][club][7]; for (const c in M.eu) if (M.eu[c].tab[club]) return M.eu[c].tab[club][7]; return ""; }
function mgRel(day){ const d = day - M.day; return d<=0 ? "Today" : d===1 ? "Tomorrow" : `In ${d} days`; }
function mgVsHTML(f, big){
  const side = c => `<div class="mg-vs-t">${clubBadge(c, big ? 72 : 56)}<b>${esc(c)}</b><span class="mg-vs-f">${mgFormPills(mgClubForm(c))}</span><span class="mg-vs-l">Team ${mgOvrB(Math.round(mgLevel(c)), "sm")}</span></div>`;
  return `<div class="mg-vs">${side(f.h)}<div class="mg-vs-v"><span>VS</span><small>${esc(mgVenue(f))}${f.c!=="F" && mgWx(f).k!=="clear" ? ` · ${mgWx(f).icon} ${mgWx(f).label}` : ""}</small></div>${side(f.a)}</div>`;
}
function mgHomeHTML(nf){
  if (M.phase==="sacked") return mgSackedHTML();
  if (M.phase==="summer" && M.review) return mgcOfferHTML() + mgReviewHTML();
  const out = [];
  if (M.offer) out.push(mgcOfferHTML());
  if (MG_LAST) out.push(mgLastHTML());
  if (nf){ const today = nf.day===M.day && !M.done;
    out.push(`<section class="panel mg-next themed themed-top" data-pat="${mgTheme(nf).pat}" style="${themeVars(mgTheme(nf))}"><div class="mg-next-top">${compChip(mgTheme(nf), mgCompName(nf), "mg-comp")}<span class="mg-when">${mgFmt(nf.day)} · ${mgRel(nf.day)}</span></div>
      ${mgVsHTML(nf, true)}${mgxHomeAsst(nf)}<div class="row mg-next-go">${today ? mgBtn("prematch", "Go to match day ▶", "primary big") : ""}${mgDof() ? mgBtn("tab", "Head coach", "", 'data-k="coach"') : mgBtn("tab", "Tactics", "", 'data-k="tactics"')}${mgBtn("tab", "Squad", "", 'data-k="squad"')}</div></section>`); }
  const t = mgLeagueOf(), tb = mgTable(t), me = tb.findIndex(r=>r.n===M.club), from = clamp(me - 2, 0, Math.max(0, tb.length - 5));
  const sq = mgMine(), inj = sq.filter(p=>p.inj), ban = sq.filter(p=>p.ban>0), sad = sq.filter(p=>p.mor<40), exp = sq.filter(p=>p.con<=M.season && !p.loan);
  const mor = sq.length ? sq.reduce((s, p)=>s + p.mor, 0)/sq.length : 60, fam = M.tac.fam[M.tac.f] || 50, bill = mgBill();
  out.push(`<div class="mg-grid">
    <section class="panel mg-board"><h2>${mgDof() ? "The owner" : "The board"}</h2>${mgGauge(M.board.conf, mgConfLabel(M.board.conf))}
      <ul class="mg-objs">${M.board.obj.map(o=>{ const s = mgObjState(o); return `<li class="${s.c}"><span class="mg-obj-i" aria-hidden="true">${s.c==="ok" ? "✓" : s.c==="bad" ? "!" : "•"}</span><span><b>${esc(o.t)}</b><small>${esc(o.imp)} · ${esc(s.txt)}</small></span></li>`; }).join("")}</ul></section>
    <section class="panel"><h2>${esc(TIERS[t].name)}</h2>${mgTableHTML(t, tb.slice(from, from + 5), from)}
      <div class="row">${mgBtn("go", "Full table", "small", 'data-k="comps" data-s="table"')}${mgBtn("go", "Fixtures", "small", 'data-k="comps" data-s="fixtures"')}</div></section>
    <section class="panel"><h2>Squad</h2>
      <div class="mg-kpis"><div><span class="label">Team morale</span><b>${mgMorLabel(mor)}</b><span class="meter"><span style="width:${mor}%"></span></span></div>
        <div><span class="label">Tactical familiarity</span><b>${Math.round(fam)}%</b><span class="meter trust"><span style="width:${fam}%"></span></span></div></div>
      ${inj.length ? `<p class="mg-note bad"><b>Injured:</b> ${inj.map(p=>`${esc(mgShort(p.n))} (${mgWeeks(p.inj.d)})`).join(", ")}</p>` : `<p class="mg-note ok">No injuries.</p>`}
      ${ban.length ? `<p class="mg-note bad"><b>Suspended:</b> ${ban.map(p=>`${esc(mgShort(p.n))} (${p.ban})`).join(", ")}</p>` : ""}
      ${sad.length ? `<p class="mg-note warn"><b>Unhappy:</b> ${sad.map(p=>esc(mgShort(p.n))).join(", ")}</p>` : ""}
      ${exp.length ? `<p class="mg-note warn"><b>Contracts ending:</b> ${exp.map(p=>esc(mgShort(p.n))).join(", ")}</p>` : ""}
      <div class="row">${mgBtn("tab", "Squad", "small", 'data-k="squad"')}${mgDof() ? "" : mgBtn("go", "Training", "small", 'data-k="club" data-s="training"')}</div></section>
    ${mgDof() ? mdfHomeCoach() : ""}
    ${mgxStoryHTML()}
    <section class="panel"><h2>Money</h2>
      <div class="mg-kpis"><div><span class="label">Transfer budget</span><b>${mgMoney(M.fin.tb)}</b></div><div><span class="label">Balance</span><b>${mgMoney(M.fin.bal)}</b></div></div>
      <div class="label" style="margin-top:10px">Wage bill · ${mgWageTxt(bill)} of ${mgWageTxt(M.fin.wb)}</div><span class="meter ${bill>M.fin.wb ? "over" : ""}"><span style="width:${Math.min(100, bill/M.fin.wb*100)}%"></span></span>
      ${mgDof() ? mdfMoneyLine() : ""}<p class="hint" style="margin-top:8px">Transfer window: ${esc(mgWindowLine())}</p>
      <div class="row">${mgBtn("tab", "Transfers", "small", 'data-k="transfers"')}${mgBtn("go", "Finances", "small", 'data-k="club" data-s="finances"')}</div></section>
    <section class="panel"><h2>Results</h2>${M.myres.length ? `<div class="mg-res">${M.myres.slice(-6).reverse().map(mgResRow).join("")}</div>` : `<p class="hint">No games yet this season.</p>`}</section>
    <section class="panel"><h2>Latest news</h2><div class="mg-news">${M.inbox.slice(0, 5).map(m=>`<button type="button" class="mg-newsi ${m.seen ? "" : "fresh"}" data-mg="tab" data-k="inbox"><span class="mg-k k-${m.k}">${m.k}</span><span>${esc(m.t)}</span><small>${mgFmt(m.d)}</small></button>`).join("")}</div></section>
  </div>`);
  return out.join("");
}
function mgObjState(o){
  const d = mdfObjState(o); if (d) return d;
  if (o.k==="league"){ const p = mgPos(), pl = mgTable(mgLeagueOf()).find(r=>r.n===M.club)?.p || 0; return {c:!pl ? "" : p<=o.n ? "ok" : p<=o.n + 2 ? "" : "bad", txt:pl ? `${ord(p)} now` : "Not started"}; }
  if (o.k==="cup"){ const C = M.cups[o.code]; if (!C) return {c:"", txt:""}; if (C.win===M.club) return {c:"ok", txt:"Won!"}; const out = C.out[M.club]; return out!=null ? {c:out>=o.n ? "ok" : "bad", txt:`Out in the ${C.rounds[out]}`} : {c:C.r>=o.n ? "ok" : "", txt:`Into the ${C.rounds[C.r]}`}; }
  if (o.k==="eu"){ const E = M.eu[o.code]; if (!E) return {c:"", txt:""}; if (E.win===M.club) return {c:"ok", txt:"Won!"}; const out = E.out[M.club]; return out ? {c:"bad", txt:`Out: ${out}`} : {c:"", txt:E.kr>=0 ? `In the ${MG_EU_KO[E.kr]}` : `League phase: ${ord(mgEuTable(E).findIndex(r=>r.n===M.club) + 1)}`}; }
  if (o.k==="wage"){ const b = mgBill(); return {c:b<=M.fin.wb ? "ok" : "bad", txt:`${mgWageTxt(b)} of ${mgWageTxt(M.fin.wb)}`}; }
  if (o.k==="youth"){ const n = mgMine().filter(p=>p.age<=21).reduce((s, p)=>s + p.st.st, 0); return {c:n>=o.n ? "ok" : "", txt:`${n} of ${o.n}`}; }
  return {c:"", txt:""};
}
function mgResRow(r){ return `<div class="mg-resr"><span class="tf ${r.res.toLowerCase()}">${r.res}</span><span class="mg-resc">${compDot(mgTheme(r))}${esc(r.comp)}</span>${clubBadge(r.o, 18)}<span class="mg-reso">${r.h ? "" : "@ "}${esc(r.o)}</span><b>${r.gf}–${r.ga}${r.pens ? ` <small>(${r.pens}p)</small>` : r.et ? " <small>aet</small>" : ""}</b></div>`; }
function mgLastHTML(){
  const {f, r} = MG_LAST, mine = f.h===M.club, gf = mine ? r.hg : r.ag, ga = mine ? r.ag : r.hg, won = r.dec ? r.dec.w===M.club : gf>ga, lost = r.dec ? r.dec.w!==M.club : gf<ga;
  const others = f.c==="L" ? (M.res[f.r] || []).filter(x=>x[0]!==M.club && x[1]!==M.club) : [];
  return `<section class="panel mg-last ${won ? "w" : lost ? "l" : "d"} themed themed-top" data-pat="${mgTheme(f).pat}" style="${themeVars(mgTheme(f))}"><div class="mg-next-top">${compChip(mgTheme(f), mgCompName(f), "mg-comp")}<span class="mg-when">Full-time</span></div>
    <div class="mg-last-sc">${clubBadge(f.h, 44)}<b>${r.hg}–${r.ag}</b>${clubBadge(f.a, 44)}</div>
    <p class="mg-last-v">${won ? "Victory" : lost ? "Defeat" : "Draw"}${r.dec && r.dec.pens ? ` · ${r.dec.pens.join("–")} on penalties` : r.dec && r.dec.et ? " · after extra time" : ""}</p>
    ${r.goals.length ? `<p class="hint mg-last-g">${r.goals.map(g=>`${g.side===0 ? "" : ""}<b>${esc(mgSurname(g.n))}</b> ${g.m}'${g.pen ? " (p)" : ""}`).join(" · ")}</p>` : ""}
    ${(w=>w.length ? `<ul class="mg-why">${w.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : "")(mgWhy(f, r))}
    ${r.potm ? `<p class="hint">Player of the Match: <b>${esc(r.potm.n)}</b> · ${r.potm.rt.toFixed(1)}</p>` : ""}
    ${others.length ? `<details class="mg-more"><summary>Other results</summary><div class="mg-others">${others.map(x=>`<div>${esc(x[0])} <b>${x[2]}–${x[3]}</b> ${esc(x[1])}</div>`).join("")}</div></details>` : ""}
    <div class="row">${mgBtn("lastx", "Dismiss", "small")}</div></section>`;
}
function mgReviewHTML(){
  const R = M.review;
  return `<section class="panel mg-review"><div class="eyebrow">Season review · ${esc(R.s)}</div>
    <div class="mg-rev-top"><div class="mg-grade g-${R.grade.replace("+", "p")}">${esc(R.grade)}</div><div><h2>${esc(R.club)}: ${ord(R.pos)} in the ${esc(TIERS[R.t].name)}</h2>
      <p class="hint">${R.pts} points · Board: <b>${mgConfLabel(R.conf)}</b>${R.up ? ` · <b class="up-t">Promoted to the ${esc(R.up)}!</b>` : ""}${R.down ? ` · <b class="down-t">Relegated to the ${esc(R.down)}</b>` : ""}${R.eu ? ` · Europe next season: <b>${esc(MG_EU[R.eu].name)}</b>` : ""}</p></div></div>
    <h3>Objectives</h3><ul class="mg-objs">${R.obj.map(o=>`<li class="${o.met ? "ok" : "bad"}"><span class="mg-obj-i">${o.met ? "✓" : "✗"}</span><span><b>${esc(o.t)}</b><small>${esc(o.imp)} · ${esc(o.note)}</small></span></li>`).join("")}</ul>
    <h3>${esc(TIERS[R.t].name)} awards</h3><div class="mg-awards">${R.aw.map(a=>`<div class="mg-aw ${a.club===M.club ? "mine" : ""}"><span class="label">${esc(a.t)}</span>${clubBadge(a.club, 22)}<b>${esc(a.n)}</b><small>${esc(a.v)}</small></div>`).join("")}</div>
    ${R.retired && R.retired.length ? `<p class="hint">Retiring: ${R.retired.map(esc).join(", ")}</p>` : ""}
    <div class="row" style="margin-top:14px">${mgBtn("continue", `Start ${seasonLabel(M.season + 1)} ▶`, "primary big")}</div></section>`;
}
function mgSackedHTML(){
  return `<section class="panel mg-review"><div class="eyebrow">Out of work</div><h2>You've left ${esc(M.club)}</h2>
    <p class="hint">You're a free agent. Clubs with vacancies are listed below. Apply for any of them: the bigger the club, the better your reputation needs to be.</p>
    ${mgcOutHTML()}</section>${mgcOfferHTML()}<section class="panel"><h2>Vacancies</h2>${mgJobsHTML()}</section>`;
}
function mgJobsHTML(){
  const J = M.jobs || [];
  if (!J.length) return `<p class="hint">No vacancies right now. They come up a few times a season, as managers are sacked or their contracts run out.</p>`;
  return `<div class="mg-list">${J.map(j=>{ const t = mgTierOf(j.club), ch = clamp(.55 + (M.mgr.rep - j.need)/25, .05, .97);
    return `<div class="mg-job">${clubBadge(j.club, 40)}<div style="min-width:0"><b>${esc(j.club)}</b><small>${t!=null ? esc(TIERS[t].name) : ""} · ${mgStarsHTML(mgStars(j.club))}</small><small>Board expects: ${esc(j.exp)}</small></div>
      <div class="mg-job-r"><span class="pill ${ch>.6 ? "up" : ch<.3 ? "down" : ""}">${ch>.75 ? "Strong chance" : ch>.45 ? "Good chance" : ch>.2 ? "Outside chance" : "Long shot"}</span>${mgBtn("apply", "Apply", "small primary", `data-c="${esc(j.club)}"`)}</div></div>`; }).join("")}</div>`;
}

/* ================= MATCH DAY ================= */
function mgPreHTML(){
  const f = MG_PRE, us = f.h===M.club ? 0 : 1, opp = us ? f.h : f.a;
  const notes = mgMendXI();
  const xi = M.tac.xi.map((id, i)=>({p:M.P[id], pos:MG_FORM[M.tac.f][i][0]}));
  const oc = M.cl[opp], of = oc ? oc.f : "4-3-3", oxi = mgAutoXI(opp, of), key = oxi.xi.filter(Boolean).sort((a, b)=>mgOvr(b) - mgOvr(a))[0];
  const P = M.pressDone!==f.key ? mgPressFor(f) : null;
  const S0 = mmSide(M.club, true, f), S1 = mmSide(opp, false, f); mmRate(S0); mmRate(S1);
  const bar = (l, a, b) => `<div class="mg-cmp"><b>${Math.round(a)}</b><span>${l}</span><b>${Math.round(b)}</b><i style="--p:${(clamp(50 + (a - b)*4, 8, 92)).toFixed(0)}%"></i></div>`;
  return `<section class="panel mg-pre themed themed-top" data-pat="${mgTheme(f).pat}" style="${themeVars(mgTheme(f))}"><div class="mg-next-top">${compChip(mgTheme(f), mgCompName(f), "mg-comp")}<span class="mg-when">Match day · ${mgFmt(f.day)}</span></div>
    ${mgVsHTML(f, true)}
    <div class="mg-cmps">${bar("Attack", S0.R.att, S1.R.att)}${bar("Midfield", S0.R.mid, S1.R.mid)}${bar("Defence", S0.R.def, S1.R.def)}</div>
    ${mgxDerby(f) ? `<p class="mg-note bad"><b>Derby day.</b> The fans and the ${mgDof() ? "owner" : "board"} care about this one more than any other.</p>` : ""}
    ${notes.length ? `<p class="mg-note warn"><b>Assistant:</b> ${notes.map(esc).join("; ")}.</p>` : ""}
    ${mgxReportHTML(f)}
    <div class="mg-pre-grid">
      <div><h3>${mgDof() ? `${esc(mgSurname(M.coach.n))}'s XI` : esc(M.club)} · ${esc(M.tac.f)} · ${esc(MG_MENT[M.tac.ment])}</h3><div class="mg-xi">${xi.map(x=>x.p ? `<div class="mg-xir">${mgPosC(x.pos)}<span>${esc(mgShort(x.p.n))}</span>${mgFitBar(x.p)}<span class="mgx-ov">${mgOvrB(mgOvrAt(x.p, x.pos), "sm")}${mgxAdjB(x.p)}</span></div>` : `<div class="mg-xir empty">${mgPosC(x.pos)}<span>Nobody</span></div>`).join("")}</div></div>
      <div><h3>${esc(opp)} · ${esc(of)}</h3><div class="mg-xi">${oxi.xi.map((p, i)=>{ if (!p) return ""; const mk = M.tac.mark && M.tac.mark.k===f.key && M.tac.mark.id===p.id, can = !mgDof() && MG_FORM[of][i][0]!=="GK";
          return `<${can ? `button type="button" data-mg="xmark" data-id="${esc(p.id)}"` : "div"} class="mg-xir ${mk ? "mgx-marked" : ""}">${mgPosC(MG_FORM[of][i][0])}<span>${esc(mgShort(p.n))}${p===key ? ` <span class="mg-tag warn">KEY</span>` : ""}${mk ? ` <span class="mg-tag bad">MARKED</span>` : ""}</span><span class="mgx-ov">${mgOvrB(mgOvrAt(p, MG_FORM[of][i][0]), "sm")}${mgxAdjB(p)}</span></${can ? "button" : "div"}>`; }).join("")}</div>
        <p class="hint">Manager: ${esc(M.am[opp] || "unknown")}${mgDof() ? "" : " · tap one of their players to mark him tightly: he plays 3 below his rating, and your midfield gives up a little to do it."}</p></div>
    </div>
    ${P ? `<div class="mg-press"><div class="eyebrow">Pre-match press conference</div><p class="mg-press-q">“${esc(P.q)}”</p><div class="mg-opts">${P.a.map((a, i)=>`<button type="button" class="btn small" data-mg="press" data-i="${i}">${esc(a[0])}</button>`).join("")}</div></div>` : ""}
    <div class="row mg-pre-go">${mgDof() ? `${mgBtn("play", "Watch the match ▶", "primary big")}${mgBtn("sim", "Skip to the result", "big")}${mgBtn("precoach", "Head coach")}` : `${mgBtn("play", "Play the match ▶", "primary big")}${mgBtn("sim", "Quick sim", "big")}${mgBtn("pretac", "Edit tactics")}`}</div>
    ${mgDof() ? `<p class="hint" style="text-align:center">${esc(M.coach.n)} picks the team and makes the calls. You watch from the directors' box.</p>` : ""}</section>`;
}
function mgPlay(sim){
  const f = MG_PRE; if (!f) return;
  const finish = (fx, r) => { mgFinishUserMatch(fx, r); MG_LAST = {f:fx, r}; MG_PRE = null; MG_TAB = "home"; mgRender(); window.scrollTo({top:0}); };
  if (sim){ if (!mgDof() && mgxS().pick){ mgMendXI(true); mgxFreshen(true); } finish(f, mgMatchFast(f, f.h===M.club ? 0 : 1)); return; }
  mgLive(f, finish, {watch:mgDof()});
}

/* ================= SQUAD ================= */
const MG_SORTS = [["pos","Position"],["ovr","Overall"],["age","Age"],["val","Value"],["form","Form"],["mor","Morale"],["fit","Fitness"]];
function mgSquadHTML(){
  const g = MG_SUB.squad, all = mgMine();
  let sq = all.filter(p=>g==="all" ? !p.loan : g==="loan" ? p.loan : MG_GROUP(p.pos)===g && !p.loan);
  const by = {pos:p=>MG_FORM_ORDER(p.pos)*1000 - mgOvr(p), ovr:p=>-mgOvr(p), age:p=>p.age, val:p=>-mgValue(p), form:p=>-(mgFormAvg(p) || 0), mor:p=>-p.mor, fit:p=>-p.fit}[MG_SORT];
  sq.sort((a, b)=>by(a) - by(b));
  return `<section class="panel"><h2>Squad · ${all.filter(p=>!p.loan).length} players</h2>
    <div class="mg-toolbar">${mgSeg("sqf", "g", [["all","All"],["GK","GK"],["DEF","DEF"],["MID","MID"],["ATT","ATT"],["loan","On loan"]], g)}
      <label class="mg-sort">Sort <select data-mgin="sort">${MG_SORTS.map(([k, l])=>`<option value="${k}" ${MG_SORT===k ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <div class="mg-sq-h" aria-hidden="true"><span>#</span><span>Pos</span><span>Player</span><span>OVR</span><span>POT</span><span>Fit</span><span>Mor</span><span>Form</span><span>Apps · G · A</span><span>Value</span></div>
    <div class="mg-list">${sq.map(mgPRow).join("") || `<p class="hint">Nobody here.</p>`}</div>
    <p class="hint" style="margin-top:10px">Wage bill ${mgWageTxt(mgBill())} of ${mgWageTxt(M.fin.wb)} · tap a player for his card, contract and options.</p></section>`;
}
function mgPRow(p){
  const fa = mgFormAvg(p);
  return `<button type="button" class="mg-prow" data-mg="player" data-id="${esc(p.id)}"><span class="mg-num">${p.num || ""}</span>${mgPosC(p.pos)}
    <span class="mg-pn"><b>${esc(p.n)}</b><small>${mgNat3(p.nat)} · ${p.age} yrs${mgTags(p) ? " · " : ""}${mgTags(p)}</small></span>
    <span class="mgx-ov">${mgOvrB(mgOvr(p))}${mgxAdjB(p)}</span><span class="mg-pot">${p.pot}</span>${mgFitBar(p)}${mgMorIc(p.mor)}<span class="mg-frm">${fa ? `<b class="mg-rt ${mmRtCls(fa)}">${fa.toFixed(1)}</b>` : "–"}</span>
    <span class="mg-apps">${p.st.ap} · ${p.st.g} · ${p.st.a}</span><span class="mg-val">${mgMoney(mgValue(p))}</span></button>`;
}

/* ================= TACTICS ================= */
const MG_STYLES = {"Balanced":{tempo:1, press:1, width:1, pass:1, line:1}, "Tiki-taka":{tempo:0, press:2, width:1, pass:0, line:2}, "Gegenpress":{tempo:2, press:2, width:1, pass:1, line:2},
  "Counter":{tempo:2, press:0, width:1, pass:2, line:0}, "Wing play":{tempo:1, press:1, width:2, pass:1, line:1}, "Park the bus":{tempo:0, press:0, width:0, pass:2, line:0, ment:1}, "Route one":{tempo:2, press:1, width:1, pass:2, line:1}};
function mgFitCls(p, pos){ if (!p) return "bad"; if (p.pos===pos || (p.alt || []).includes(pos)) return "good"; const f = MG_FAM[p.pos] && MG_FAM[p.pos][pos]; return f!=null && f<=4 ? "ok" : "bad"; }
function mgTacticsHTML(){
  mgMendXI(true);
  const T = M.tac, slots = MG_FORM[T.f], S = mmSide(M.club, true, null); mmRate(S);
  const inXI = new Set(T.xi), onB = new Set(T.bench), res = mgMine().filter(p=>!inXI.has(p.id) && !onB.has(p.id) && !p.loan).sort((a, b)=>MG_FORM_ORDER(a.pos) - MG_FORM_ORDER(b.pos));
  const sel = MG_SEL, fam = Math.round(T.fam[T.f] || 50);
  const row = (p, where) => `<button type="button" class="mg-tr ${sel && sel.id===p.id ? "sel" : ""} ${mgAvail(p) ? "" : "na"}" data-mg="tpick" data-id="${esc(p.id)}" data-w="${where}">${mgPosC(p.pos)}<span>${esc(mgShort(p.n))}</span>${mgTags(p)}${mgFitBar(p)}<span class="mgx-ov">${mgOvrB(mgOvr(p), "sm")}${mgxAdjB(p)}</span></button>`;
  return `<section class="panel mg-tac"><h2>Tactics</h2>
    <div class="mg-tac-top"><div class="mg-forms">${Object.keys(MG_FORM).map(f=>`<button type="button" class="chip ${T.f===f ? "on" : ""}" data-mg="form" data-v="${f}" aria-pressed="${T.f===f}">${f}</button>`).join("")}</div>
      <div class="mg-kpis tight"><div><span class="label">Familiarity</span><b>${fam}%</b><span class="meter trust"><span style="width:${fam}%"></span></span></div>
        <div class="mg-trio"><span>ATT <b>${Math.round(S.R.att)}</b></span><span>MID <b>${Math.round(S.R.mid)}</b></span><span>DEF <b>${Math.round(S.R.def)}</b></span></div></div></div>
    <p class="hint">${sel ? `Selected: <b>${esc(sel.id ? mgShort(M.P[sel.id]?.n || "") : slots[sel.i][0])}</b>. Tap a place on the pitch or a player to swap.` : "Tap a player on the pitch, then another place or a player from the bench to swap them."}</p>
    <div class="mg-tac-grid">
      <div class="mg-pitch" role="group" aria-label="Your XI">${slots.map(([pos, x, y], i)=>{ const p = M.P[T.xi[i]];
        return `<button type="button" class="mg-tok ${mgFitCls(p, pos)} ${sel && sel.i===i ? "sel" : ""}" data-mg="tslot" data-i="${i}" style="left:${(x*100).toFixed(1)}%;bottom:${(4 + y*88).toFixed(1)}%">
          <b>${p ? mgOvrAt(p, pos) : "–"}${p ? mgxAdjB(p) : ""}</b><span>${p ? esc(mgSurname(p.n)) : "Empty"}</span><small>${pos}${p && T.cap===p.id ? " · C" : ""}${p ? ` · <em class="${p.fit<70 ? "low" : p.fit<85 ? "mid" : ""}">${Math.round(p.fit)}%</em>` : ""}</small></button>`; }).join("")}</div>
      <div class="mg-tac-side"><h3>Bench (${T.bench.length}/9)</h3><div class="mg-trs">${T.bench.map(id=>M.P[id]).filter(Boolean).map(p=>row(p, "b")).join("") || `<p class="hint">Empty.</p>`}</div>
        <h3>Reserves</h3><div class="mg-trs">${res.map(p=>row(p, "r")).join("") || `<p class="hint">Nobody else.</p>`}</div></div>
    </div>
    <div class="row">${mgBtn("autoxi", "Auto-pick best XI", "primary")}${sel ? mgBtn("tclear", "Clear selection") : ""}</div>
    <h3>Mentality</h3><div class="mg-seg ment">${MG_MENT.map((l, i)=>`<button type="button" data-mg="tset" data-k="ment" data-v="${i}" aria-pressed="${T.ment===i}">${l}</button>`).join("")}</div>
    <h3>Playing style</h3><div class="chips">${Object.keys(MG_STYLES).map(k=>`<button type="button" class="chip ${T.style===k ? "on" : ""}" data-mg="style" data-v="${k}" aria-pressed="${T.style===k}">${k}</button>`).join("")}</div>
    <div class="mg-instr">
      <div><div class="label">Tempo</div>${mgSeg("tset", "tempo", [[0,"Slow"],[1,"Normal"],[2,"Fast"]], T.tempo)}</div>
      <div><div class="label">Pressing</div>${mgSeg("tset", "press", [[0,"Stand off"],[1,"Normal"],[2,"High"]], T.press)}</div>
      <div><div class="label">Width</div>${mgSeg("tset", "width", [[0,"Narrow"],[1,"Normal"],[2,"Wide"]], T.width)}</div>
      <div><div class="label">Passing</div>${mgSeg("tset", "pass", [[0,"Short"],[1,"Mixed"],[2,"Direct"]], T.pass)}</div>
      <div><div class="label">Defensive line</div>${mgSeg("tset", "line", [[0,"Deep"],[1,"Normal"],[2,"High"]], T.line)}</div>
    </div>
    <h3>Captain</h3><select data-mgin="cap" class="mg-capsel">${T.xi.map(id=>M.P[id]).filter(Boolean).map(p=>`<option value="${esc(p.id)}" ${T.cap===p.id ? "selected" : ""}>${esc(p.n)}</option>`).join("")}</select>
    ${mgxSetPiecesHTML()}
    <p class="hint" style="margin-top:12px">The small + or − beside a rating is form and match sharpness: what a player is worth today. High pressing tires players faster; a new formation takes a few weeks of training to learn (Club → Training, Tactical focus speeds it up).</p></section>`;
}
function mgTacTap(kind, val){
  const T = M.tac, S = MG_SEL;
  if (kind==="slot"){
    const i = val;
    if (!S){ MG_SEL = {i}; return; }
    if (S.i!=null){ if (S.i!==i) [T.xi[S.i], T.xi[i]] = [T.xi[i], T.xi[S.i]]; MG_SEL = null; return; }
    mgPutIn(S.id, i); MG_SEL = null; return;
  }
  const id = val;
  if (!S){ MG_SEL = {id}; return; }
  if (S.i!=null){ mgPutIn(id, S.i); MG_SEL = null; return; }
  if (S.id===id){ MG_SEL = null; return; }
  // two from the bench and the reserves: they swap over
  const bi = T.bench.indexOf(S.id), bj = T.bench.indexOf(id);
  if (bi>=0 && bj<0) T.bench[bi] = id; else if (bj>=0 && bi<0) T.bench[bj] = S.id;
  MG_SEL = null;
}
function mgPutIn(id, i){
  const T = M.tac, out = T.xi[i], bi = T.bench.indexOf(id), xi = T.xi.indexOf(id);
  if (xi>=0){ [T.xi[xi], T.xi[i]] = [T.xi[i], T.xi[xi]]; return; }
  T.xi[i] = id;
  if (bi>=0){ if (out) T.bench[bi] = out; else T.bench.splice(bi, 1); }
  if (T.cap===out) T.cap = id;
}

/* ================= TRANSFERS ================= */
function mgTransfersHTML(){
  const sub = MG_SUB.transfers, open = (M.offers || []).filter(o=>o.st==="open").length;
  const room = M.fin.wb - mgBill();
  const head = `<div class="mg-kpis mg-xfhead"><div><span class="label">Window</span><b class="${mgInWindow() ? "up-t" : ""}">${mgInWindow() ? mgWindowName() : "Closed"}</b><small>${esc(mgWindowLine())}</small></div>
    <div><span class="label">Transfer budget</span><b>${mgMoney(M.fin.tb)}</b></div><div><span class="label">Wage room</span><b class="${room<0 ? "down-t" : ""}">${mgWageTxt(room)}</b></div></div>`;
  let body = "";
  if (sub==="search"){
    const q = MG_Q, opt = (k, list) => `<select data-mgin="q-${k}">${list.map(([v, l])=>`<option value="${v}" ${String(q[k])===String(v) ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    body = `<div class="mg-search">
      <div class="field"><label>Position</label>${opt("pos", [["any","Any"],["GK","GK"],["DEF","Defenders"],["MID","Midfielders"],["ATT","Attackers"],...["CB","LB","RB","CDM","CM","CAM","LM","RM","LW","RW","ST"].map(x=>[x, x])])}</div>
      <div class="field"><label>Max age</label>${opt("age", [[40,"Any"],[19,"19"],[21,"21"],[23,"23"],[25,"25"],[28,"28"],[31,"31"]])}</div>
      <div class="field"><label>Min overall</label>${opt("ovr", [[0,"Any"],...[50,55,60,65,70,75,80,85].map(x=>[x, x + "+"])])}</div>
      <div class="field"><label>Max value</label>${opt("max", [[0,"Any"],[25e4,"£250k"],[1e6,"£1m"],[5e6,"£5m"],[15e6,"£15m"],[40e6,"£40m"],[80e6,"£80m"]])}</div>
      <div class="field"><label>League</label>${opt("lg", [["all","All leagues"],["fa","Free agents"],...MG_PLAYABLE.map(t=>[t, TIERS[t].name])])}</div>
      <div class="field"><label>Name</label><input data-mgin="q-name" value="${esc(q.name)}" placeholder="Any" autocomplete="off"></div>
      <div class="field"><label>Deal</label>${opt("loan", [["any","Transfer or loan"],["loan","Loan available"]])}</div>
      <button type="button" class="btn primary" data-mg="search">Search</button></div>
      ${MG_RES ? (MG_RES.length ? `<p class="hint">${MG_RES.length}${MG_RES.length>=60 ? "+" : ""} players · ranges are your scouts' estimates until a player's been scouted.</p><div class="mg-list">${MG_RES.map(mgMRow).join("")}</div>` : `<p class="hint">Nobody matches. Try widening the search.</p>`) : `<p class="hint">Search every club in the game's leagues, and the free agents. Players at clubs outside your league are known only roughly until you scout them.</p>`}`;
  } else if (sub==="short"){
    const list = M.short.map(mgFind).filter(Boolean);
    body = list.length ? `<div class="mg-list">${list.map(mgMRow).join("")}</div>` : `<p class="hint">Your shortlist is empty. Star players in the search to keep an eye on them.</p>`;
  } else if (sub==="scout"){
    body = `<p class="hint">You have ${mgScoutsMax()} scouts. A scout's report gives a player's exact overall and potential, his value and whether he'd join.</p>
      ${M.scout.length ? `<div class="mg-list">${M.scout.map(s=>`<div class="mg-row"><span>🔍</span><b>${esc(s.n)}</b><small>${esc(s.club || "Free agent")}</small><span class="pill">${s.d} day${s.d===1 ? "" : "s"}</span></div>`).join("")}</div>` : `<p class="hint">No scouts out. Scout a player from his card or the search.</p>`}`;
  } else if (sub==="offers"){
    const inc = (M.offers || []).filter(o=>o.st==="open"), mine = (M.bids || []).filter(b=>b.s===M.season && b.win===mgWindowKey() && ["fee","contract"].includes(b.st));
    body = `<h3>Offers for your players</h3>${inc.length ? `<div class="mg-list">${inc.map(o=>{ const p = M.P[o.pid]; return p ? `<div class="mg-offer">${clubBadge(o.club, 32)}<div style="min-width:0"><b>${esc(o.club)}</b><small>${o.loan ? `Loan · they pay ${Math.round((o.pay ?? 1)*100)}% of wages${o.opt ? ` · option ${mgMoney(o.opt)}` : ""}` : esc(mgDealTxt(o))} for ${esc(p.n)} · value ${mgMoney(mgValue(p))} · ${o.exp - M.day} day${o.exp - M.day===1 ? "" : "s"} left</small></div>${mgOfferBtns(o)}</div>` : ""; }).join("")}</div>` : `<p class="hint">No offers on the table.</p>`}
      <h3>Your negotiations</h3>${mine.length ? `<div class="mg-list">${mine.map(b=>`<button type="button" class="mg-row" data-mg="player" data-id="${esc(b.id)}"><b>${esc(b.n)}</b><small>${esc(b.club || "Free agent")}</small><span class="pill ${b.st==="contract" ? "up" : ""}">${b.st==="contract" ? "Fee agreed: talk terms" : `Offer ${b.tries}/3`}</span></button>`).join("")}</div>` : `<p class="hint">You're not in talks with anyone.</p>`}`;
  } else if (sub==="loans"){
    const ins = mgLoanees(), outs = mgMine().filter(p=>p.loan);
    body = `<p class="hint">Borrow up to ${MG_LOAN_MAX} players until the end of the season: search with <b>Deal: Loan available</b>, then ask about a loan from a player's card. His club wants him playing and some of his wages paid.</p>
      <h3>On loan at ${esc(M.club)} (${ins.length}/${MG_LOAN_MAX})</h3>${ins.length ? `<div class="mg-list">${ins.map(p=>`<button type="button" class="mg-row" data-mg="player" data-id="${esc(p.id)}">${mgPosC(p.pos)}<b>${esc(p.n)}</b><small>from ${esc(p.lin.from)} · you pay ${Math.round(p.lin.pay*100)}% (${mgWageTxt(p.wage*p.lin.pay)})${p.lin.opt ? ` · option ${mgMoney(p.lin.opt)}` : ""}</small>${mgOvrB(mgOvr(p), "sm")}</button>`).join("")}</div>` : `<p class="hint">Nobody yet.</p>`}
      <h3>Your players out on loan</h3>${outs.length ? `<div class="mg-list">${outs.map(p=>`<button type="button" class="mg-row" data-mg="player" data-id="${esc(p.id)}">${mgPosC(p.pos)}<b>${esc(p.n)}</b><small>at ${esc(p.loan.club)} · ${p.loan.play>.7 ? "a regular" : p.loan.play>.4 ? "plays often" : "a squad player"}</small>${mgOvrB(mgOvr(p), "sm")}</button>`).join("")}</div>` : `<p class="hint">Nobody. Loan-list a player from his card and offers will come in while a window is open.</p>`}`;
  } else if (sub==="clauses"){
    const R = M.recv || [], P = M.pay || [], BB = M.bb || [], rc = mgMine().filter(p=>p.rc), so = mgMine().filter(p=>p.sellOn);
    const row = (t, sm, v) => `<div class="mg-row"><b>${esc(t)}</b><small>${esc(sm)}</small><span class="mg-val">${v}</span></div>`;
    body = `<h3>Money owed to you</h3>${R.length ? `<div class="mg-list">${R.map(x=>row(x.n, x.why==="inst" ? `instalment from ${x.club} · ${seasonLabel(x.s)}` : x.why==="addon" ? `add-on from ${x.club} · decided this summer` : `${x.pct}% sell-on at ${x.club}`, x.why==="sellon" ? `${x.pct}%` : mgMoney(x.amt))).join("")}</div>` : `<p class="hint">Nothing.</p>`}
      <h3>Money you owe</h3>${P.length ? `<div class="mg-list">${P.map(x=>row(x.n, x.why==="inst" ? `instalment to ${x.club} · ${seasonLabel(x.s)}` : `add-on to ${x.club} if he plays ${x.need} league games`, mgMoney(x.amt))).join("")}</div>` : `<p class="hint">Nothing.</p>`}
      <h3>Buy-back clauses</h3>${BB.length ? `<div class="mg-list">${BB.map((x, i)=>`<div class="mg-row"><b>${esc(x.n)}</b><small>at ${esc(x.club)} · until summer ${x.until + 1}</small>${mgBtn("buyback", `Buy back · ${mgMoney(x.fee)}`, "small primary", `data-i="${i}" ${mgInWindow() ? "" : "disabled"}`)}</div>`).join("")}</div>` : `<p class="hint">None. Ask for one when you counter an offer for a player you're selling.</p>`}
      <h3>Release clauses in your squad</h3>${rc.length ? `<div class="mg-list">${rc.map(p=>row(p.n, `value ${mgMoney(mgValue(p))}`, mgMoney(p.rc))).join("")}</div>` : `<p class="hint">None. You can add one when you agree a contract.</p>`}
      <h3>Sell-on clauses you owe</h3>${so.length ? `<div class="mg-list">${so.map(p=>row(p.n, `to ${p.sellOn.club}`, `${p.sellOn.pct}%`)).join("")}</div>` : `<p class="hint">None.</p>`}`;
  } else if (sub==="list"){
    const L = mgMine().filter(p=>p.tl || p.ll);
    body = `<p class="hint">Players you've made available. Listed players attract offers each week while a window is open; loan-listed players get loan offers.</p>${L.length ? `<div class="mg-list">${L.map(mgPRow).join("")}</div>` : `<p class="hint">Nobody's on your list. Use a player's card to list him.</p>`}`;
  } else {
    const ins = mgMine().filter(p=>p.from && p.joined && p.from!=="Academy").sort((a, b)=>(b.joined - a.joined) || (b.fee || 0) - (a.fee || 0));
    body = `<h3>Signed</h3>${ins.length ? `<div class="mg-list">${ins.map(p=>`<button type="button" class="mg-row" data-mg="player" data-id="${esc(p.id)}">${mgPosC(p.pos)}<b>${esc(p.n)}</b><small>from ${esc(p.from)} · ${seasonLabel(p.joined)}</small><span class="mg-val">${p.fee ? mgMoney(p.fee) : "Free"}</span></button>`).join("")}</div>` : `<p class="hint">No signings yet.</p>`}
      <h3>Sold</h3>${M.tl.length ? `<div class="mg-list">${M.tl.slice().reverse().map(d=>`<div class="mg-row"><b>${esc(d.n)}</b><small>to ${esc(d.to)} · ${esc(d.s)}</small><span class="mg-val">${mgMoney(d.fee)}</span></div>`).join("")}</div>` : `<p class="hint">Nobody sold yet.</p>`}`;
  }
  return `<section class="panel"><h2>Transfers</h2>${head}${mgSubTabs("transfers", [["search","Search"],["short",`Shortlist${M.short.length ? ` (${M.short.length})` : ""}`],["scout","Scouting"],["offers",`Offers${open ? ` (${open})` : ""}`],["loans",`Loans${mgLoanees().length ? ` (${mgLoanees().length})` : ""}`],["clauses","Clauses"],["list","Your list"],["done","Deals"]])}<div class="subview">${body}</div></section>`;
}
function mgMRow(p){
  const sh = M.short.includes(p.id);
  return `<div class="mg-mrow"><button type="button" class="mg-mrow-m" data-mg="player" data-id="${esc(p.id)}">${mgEstB(p)}${mgPosC(p.pos)}
    <span class="mg-pn"><b>${esc(p.n)}${mgLoanable(p) ? ` <span class="mg-tag loan">LOAN</span>` : ""}</b><small>${p.pos} · ${mgNat3(p.nat)} · ${p.age} yrs · POT ${mgPotTxt(p)}${p.club ? ` · ${esc(p.club)}` : ""}</small></span>
    <span class="mg-mclub">${p.club ? `${clubBadge(p.club, 18)}<span>${esc(p.club)}</span>` : `<span class="mg-tag">FREE AGENT</span>`}</span><span class="mg-val">${mgMoney(mgValue(p))}</span></button>
    <div class="mg-mrow-a"><button type="button" class="mg-ib ${sh ? "on" : ""}" data-mg="short" data-id="${esc(p.id)}" aria-pressed="${sh}" aria-label="${sh ? "Remove from shortlist" : "Add to shortlist"}">★</button>
      ${mgKnow(p)<100 ? `<button type="button" class="mg-ib" data-mg="scout" data-id="${esc(p.id)}" aria-label="Scout ${esc(p.n)}">🔍</button>` : ""}</div></div>`;
}
function mgOfferBtns(o){ return `<div class="mg-offer-b">${mgBtn("ofr", "Accept", "small primary", `data-o="${o.id}" data-v="yes"`)}${mgBtn("ofr", "Reject", "small", `data-o="${o.id}" data-v="no"`)}${o.loan ? "" : mgBtn("ofr", "Counter", "small", `data-o="${o.id}" data-v="ask"`)}</div>`; }

/* ================= COMPETITIONS ================= */
function mgZone(t, i, n){
  const T = TIERS[t]; if (!T) return "";
  if (T.eu){ if (i<T.eu[0]) return "mz-ucl"; if (i<T.eu[0] + T.eu[1]) return "mz-uel"; if (i<T.eu[0] + T.eu[1] + T.eu[2]) return "mz-uecl"; }
  if (T.up && i<T.up) return "mz-up"; if (T.po && i>=T.po[0] - 1 && i<T.po[1]) return "mz-po";
  if (T.down && i>=n - T.down) return "mz-down"; return "";
}
function mgTableHTML(t, rows, offset = 0, full){
  const n = M.tiers[t].length;
  return `<div class="tablewrap"><table class="mg-table ${full ? "full" : ""}"><thead><tr><th>#</th><th class="l">Club</th><th>P</th>${full ? "<th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th>" : ""}<th>GD</th><th>Pts</th>${full ? `<th class="frm">Form</th>` : ""}</tr></thead><tbody>
    ${rows.map((r, k)=>{ const i = offset + k; return `<tr class="${mgZone(t, i, n)} ${r.n===M.club ? "me" : ""}"><td>${i + 1}</td><td class="l">${mgCrestName(r.n, 18)}</td><td>${r.p}</td>${full ? `<td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td>` : ""}<td>${r.gd>0 ? "+" : ""}${r.gd}</td><td><b>${r.pts}</b></td>${full ? `<td class="frm">${mgFormPills(r.form)}</td>` : ""}</tr>`; }).join("")}</tbody></table></div>`;
}
function mgMyFixtures(){
  const out = M.myres.map(r=>({...r, played:true}));
  for (let d = M.day; d<=MGD(M.season + 1, 5, 1); d++){ mgFixturesOn(d).forEach(f=>{ if (mgIsMine(f) && !M.played[f.key]) out.push({d, c:f.c, t:f.t, code:f.code, comp:mgCompName(f, true), full:mgCompName(f), o:f.h===M.club ? f.a : f.h, h:f.h===M.club, played:false}); }); }
  return out;
}
function mgCompsHTML(){
  const sub = MG_SUB.comps, t = mgLeagueOf();
  let body = "";
  if (sub==="table"){ const tb = mgTable(t); body = `${mgTableHTML(t, tb, 0, true)}<p class="hint mg-legend"><span class="mz mz-ucl"></span>Champions League <span class="mz mz-uel"></span>Europa League <span class="mz mz-uecl"></span>Conference League <span class="mz mz-up"></span>Promotion <span class="mz mz-po"></span>Play-offs <span class="mz mz-down"></span>Relegation</p>`; }
  else if (sub==="fixtures"){ const L = mgMyFixtures();
    body = `<div class="mg-fx">${L.map(r=>`<div class="mg-fxr ${r.played ? "done" : ""}"><span class="mg-fxd">${mgFmt(r.d)}</span><span class="mg-fxc" style="${themeVars(mgTheme(r))}">${compDot(mgTheme(r))}${esc(r.comp)}</span><span class="mg-fxo">${clubBadge(r.o, 18)}${r.h ? "" : "@ "}${esc(r.o)}</span>${r.played ? `<b><span class="tf ${r.res.toLowerCase()}">${r.res}</span> ${r.gf}–${r.ga}${r.pens ? ` (${r.pens}p)` : ""}</b>` : `<span class="hint">${r.d===M.day ? "Today" : ""}</span>`}</div>`).join("")}</div>
      <p class="hint">Cup ties appear once they're drawn.</p>`; }
  else if (sub==="stats"){
    const ps = M.tiers[t].flatMap(c=>M.cl[c] ? M.cl[c].sq.map(id=>M.P[id]).filter(Boolean) : []);
    const top = (f, k, fmt, ok = () => true) => ps.filter(p=>f(p)>0 && ok(p)).sort((a, b)=>f(b) - f(a)).slice(0, 10).map((p, i)=>`<li class="${p.club===M.club ? "me" : ""}"><span>${i + 1}</span>${clubBadge(p.club, 16)}<button type="button" class="linkbtn" data-mg="player" data-id="${esc(p.id)}">${esc(p.n)}</button><b>${fmt(p)}</b></li>`).join("") || `<li class="hint">No games yet.</li>`;
    const minA = Math.max(3, Math.round((mgTable(t)[0]?.p || 0)*.4));
    body = `<div class="mg-leaders"><div><h3>Goals</h3><ol>${top(p=>p.lg.g, "g", p=>p.lg.g)}</ol></div><div><h3>Assists</h3><ol>${top(p=>p.lg.a, "a", p=>p.lg.a)}</ol></div>
      <div><h3>Average rating</h3><ol>${top(p=>p.lg.rn ? p.lg.rs/p.lg.rn : 0, "r", p=>(p.lg.rs/p.lg.rn).toFixed(2), p=>p.lg.ap>=minA)}</ol></div><div><h3>Clean sheets</h3><ol>${top(p=>p.pos==="GK" ? p.lg.cs : 0, "cs", p=>p.lg.cs)}</ol></div></div>`;
  }
  else if (sub==="cups"){
    const cs = Object.values(M.cups).filter(C=>C.country===TIERS[t].country);
    body = cs.map(C=>{ const me = C.win===M.club ? "Winners!" : C.out[M.club]!=null ? `Out in the ${C.rounds[C.out[M.club]]}` : C.alive.includes(M.club) || (C.pairs || []).some(p=>p.h===M.club || p.a===M.club) || (C.join[C.r] || []).includes(M.club) || C.r===0 ? "Still in it" : "Not entered";
      const last = C.hist[C.hist.length - 1];
      return `<div class="mg-cup"><h3>${esc(C.name)}</h3><p class="hint">${C.win ? `Winners: <b>${esc(C.win)}</b>` : `Next: <b>${esc(C.rounds[C.r])}</b> · ${mgFmt(C.days[C.r][0])}`} · You: <b>${esc(me)}</b></p>
        ${C.pairs && C.pairs.length ? `<details class="mg-more" ${C.pairs.some(p=>p.h===M.club || p.a===M.club) ? "open" : ""}><summary>${esc(C.rounds[C.r])} draw</summary><div class="mg-others">${C.pairs.map(p=>`<div class="${p.h===M.club || p.a===M.club ? "me" : ""}">${esc(p.h)} v ${esc(p.a)}${p.l1 ? ` <small>(${p.l1[0]}–${p.l1[1]})</small>` : ""}</div>`).join("")}</div></details>` : ""}
        ${last ? `<details class="mg-more"><summary>${esc(C.rounds[last.r])} results</summary><div class="mg-others">${last.ties.map(x=>`<div class="${x[0]===M.club || x[1]===M.club ? "me" : ""}">${esc(x[0])} <b>${x[2]}–${x[3]}</b> ${esc(x[1])}${x[5] ? ` <small>(${x[5]}p)</small>` : ""}</div>`).join("")}</div></details>` : ""}</div>`; }).join("") || `<p class="hint">No cups.</p>`;
  }
  else if (sub==="europe"){
    const mine = Object.keys(M.eu).find(c=>M.eu[c].teams.includes(M.club));
    const code = MG_EUV || mine || "UCL", E = M.eu[code];
    body = `${mgSeg("euv", "c", [["UCL","Champions League"],["UEL","Europa League"],["UECL","Conference League"]], code)}
      ${E.win ? `<p class="mg-note ok">Winners: <b>${esc(E.win)}</b></p>` : ""}
      ${E.ko.length || E.pairs && E.kr>=0 ? `<h3>Knockouts</h3><div class="mg-others">${E.ko.map((r, i)=>`<div class="label">${MG_EU_KO[i]}</div>${r.map(x=>`<div class="${x[0]===M.club || x[1]===M.club ? "me" : ""}">${esc(x[0])} <b>${x[2]}–${x[3]}</b> ${esc(x[1])}${x[5] ? ` (${x[5]}p)` : ""}</div>`).join("")}`).join("")}
        ${E.pairs && E.kr>=0 ? `<div class="label">${MG_EU_KO[E.kr]} (next)</div>${E.pairs.map(p=>`<div class="${p.h===M.club || p.a===M.club ? "me" : ""}">${esc(p.h)} v ${esc(p.a)}${p.l1 ? ` <small>(1st leg ${p.l1[0]}–${p.l1[1]})</small>` : ""}</div>`).join("")}` : ""}</div>` : ""}
      <h3>League phase</h3><div class="tablewrap"><table class="mg-table"><thead><tr><th>#</th><th class="l">Club</th><th>P</th><th>GD</th><th>Pts</th></tr></thead><tbody>${mgEuTable(E).map((r, i)=>`<tr class="${i<8 ? "mz-ucl" : i<24 ? "mz-po" : ""} ${r.n===M.club ? "me" : ""}"><td>${i + 1}</td><td class="l">${mgCrestName(r.n, 18)}</td><td>${r.p}</td><td>${r.gd>0 ? "+" : ""}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join("")}</tbody></table></div>`;
  }
  else {
    const v = MG_LGV ?? t;
    body = `<label class="mg-sort">League <select data-mgin="lgv">${MG_PLAYABLE.map(k=>`<option value="${k}" ${String(k)===String(v) ? "selected" : ""}>${esc(TIERS[k].name)} (${esc(TIERS[k].country)})</option>`).join("")}</select></label>${mgTableHTML(keyOf(v), mgTable(keyOf(v)), 0, true)}`;
  }
  return `<section class="panel"><h2>Competitions</h2>${mgSubTabs("comps", [["table","Table"],["fixtures","Fixtures"],["stats","Stats"],["cups","Cups"],["europe","Europe"],["leagues","All leagues"]])}<div class="subview">${body}</div></section>`;
}

/* ================= CLUB ================= */
const MG_FOCUS = [["bal","Balanced","Steady all-round work"],["att","Attacking","Finishing and movement"],["def","Defending","Shape and tackling"],["pos","Possession","Passing and patience"],["fit","Fitness","Stamina; slows decline in older players"],["tac","Tactical","Learn your formation faster"],["rec","Recovery","Rest: faster recovery between games"]];
function mgClubHTML(){
  const sub = MG_SUB.club, c = meta(M.club), t = mgLeagueOf();
  let body = "";
  if (sub==="overview"){
    const tro = M.trophies.filter(x=>x.club===M.club);
    body = `<div class="mg-clubov" style="--c1:${c.c1};--c2:${c.c2}">${clubBadge(M.club, 96)}<div><div class="eyebrow">${esc(c.nick || "")}${c.founded ? ` · founded ${esc(c.founded)}` : ""}</div><h3 class="mg-clubov-n">${esc(M.club)}</h3>${mgStarsHTML(mgStars(M.club))}
      <p class="hint">${esc(c.bio || "")}</p></div></div>
      <div class="mg-kpis"><div><span class="label">Stadium</span><b>${esc(c.ground || "–")}</b><small>${mgCapacity(M.club).toLocaleString()} seats</small></div><div><span class="label">League</span><b>${esc(TIERS[t].name)}</b></div>
        <div><span class="label">Academy</span><b>${"★".repeat(mgAcademy())}${"☆".repeat(5 - mgAcademy())}</b></div><div><span class="label">Team rating</span><b>${Math.round(mgLevel(M.club))}</b></div></div>
      <h3>Honours with you</h3>${tro.length ? `<div class="mg-tro">${tro.map(x=>`<span class="mg-trophy themed" style="${themeVars(trophyTheme(null, x.n))}">🏆 ${esc(x.n)} <small>${esc(x.s)}</small></span>`).join("")}</div>` : `<p class="hint">None yet.</p>`}`;
  }
  else if (sub==="finances"){
    const F = M.fin, inc = F.inc || {}, exp = F.exp || {}, ti = Object.values(inc).reduce((s, v)=>s + v, 0), te = Object.values(exp).reduce((s, v)=>s + v, 0), mx = Math.max(1, ti, te);
    const line = (l, v, cls) => `<div class="mg-fin"><span>${l}</span><span class="mg-finb ${cls}"><i style="width:${(v/mx*100).toFixed(1)}%"></i></span><b>${mgMoney(v)}</b></div>`;
    body = `<div class="mg-kpis"><div><span class="label">Balance</span><b>${mgMoney(F.bal)}</b></div><div><span class="label">Transfer budget</span><b>${mgMoney(F.tb)}</b></div><div><span class="label">Wage budget</span><b>${mgWageTxt(F.wb)}</b><small>Bill ${mgWageTxt(mgBill())}</small></div></div>
      <h3>This season</h3>${line("Match day", inc.gate || 0, "in")}${line("TV and prize money", (inc.tv || 0) + (inc.prize || 0), "in")}${line("Commercial", inc.spons || 0, "in")}${line("Player sales", inc.sales || 0, "in")}
      ${line("Wages", exp.wages || 0, "out")}${exp.staff ? line("Head coach", exp.staff, "out") : ""}${exp.ops ? line("Running costs", exp.ops, "out") : ""}${exp.build ? line("Buildings", exp.build, "out") : ""}${line("Transfers", exp.buys || 0, "out")}${line("Other", exp.fees || 0, "out")}
      <p class="hint">Profit this season: <b class="${ti - te>=0 ? "up-t" : "down-t"}">${mgMoney(ti - te)}</b></p>${mgDof() ? mdfTixHTML() : ""}
      <h3>Adjust your budgets</h3><p class="hint">Move money between the transfer budget and the wage budget (each £1/wk of wages costs about £${mgWeeksLeft()} of transfer budget this season).</p>
      <div class="row">${[["-big","− " + mgWageTxt(mgBudgetStep())],["+big","+ " + mgWageTxt(mgBudgetStep())]].map(([v, l])=>mgBtn("budget", l + " wages", "small", `data-v="${v}"`)).join("")}</div>`;
  }
  else if (sub==="board"){
    const B = M.board;
    body = `<div class="mg-boardv">${mgGauge(B.conf, mgConfLabel(B.conf))}<div><h3>Objectives · ${seasonLabel(M.season)}</h3><ul class="mg-objs">${B.obj.map(o=>{ const s = mgObjState(o); return `<li class="${s.c}"><span class="mg-obj-i">${s.c==="ok" ? "✓" : s.c==="bad" ? "!" : "•"}</span><span><b>${esc(o.t)}</b><small>${esc(o.imp)} · ${esc(s.txt)}</small></span></li>`; }).join("")}</ul></div></div>
      <p class="hint">The board judges every result against what the club should get, watches the table and the wage bill, and reviews the season in June. If confidence falls too low, you'll be sacked.</p>
      ${B.hist.length ? `<h3>Recent verdicts</h3><div class="mg-list">${B.hist.slice(-8).reverse().filter(h=>h.why).map(h=>`<div class="mg-row"><span class="${h.v>=0 ? "up-t" : "down-t"}">${h.v>=0 ? "▲" : "▼"}</span><span>${esc(h.why)}</span><small>${mgFmt(h.d)}</small></div>`).join("")}</div>` : ""}`;
  }
  else if (sub==="academy"){
    const Y = M.yth.map(id=>M.P[id]).filter(Boolean).sort((a, b)=>b.pot - a.pot);
    body = `<p class="hint">Academy rating ${"★".repeat(mgAcademy())}${"☆".repeat(5 - mgAcademy())} · New intake every March. At 19, players must be given a professional contract or they leave.</p>
      <div class="mg-list">${Y.map(p=>`<div class="mg-yrow"><button type="button" class="mg-mrow-m" data-mg="player" data-id="${esc(p.id)}">${mgOvrB(mgOvr(p))}${mgPosC(p.pos)}<span class="mg-pn"><b>${esc(p.n)}</b><small>${mgNat3(p.nat)} · ${p.age} yrs</small></span><span class="mg-potb">POT <b>${p.pot}</b></span></button>
        <div class="mg-mrow-a">${mgBtn("promote", "Promote", "small primary", `data-id="${esc(p.id)}"`)}${mgBtn("yrel", "Release", "small", `data-id="${esc(p.id)}"`)}</div></div>`).join("") || `<p class="hint">The academy's empty.</p>`}</div>
      <h3>Youth scouting</h3>${M.ysc ? `<p class="hint">Your youth scout is in ${esc(MG_REGIONS[M.ysc.region])}: report in ${M.ysc.d} day${M.ysc.d===1 ? "" : "s"}.</p>` : `<p class="hint">Send your youth scout on a three-week trip to find prospects.</p><div class="row">${Object.entries(MG_REGIONS).map(([k, l])=>mgBtn("ysc", l, "small", `data-v="${k}"`)).join("")}</div>`}`;
  }
  else if (sub==="training"){
    const T = M.train;
    body = `<h3>Team focus</h3><div class="mg-focus">${MG_FOCUS.map(([k, l, d])=>`<button type="button" class="mg-bg" data-mg="train" data-k="focus" data-v="${k}" aria-pressed="${T.focus===k}"><b>${l}</b><span>${d}</span></button>`).join("")}</div>
      <h3>Intensity</h3>${mgSeg("train", "int", [[0,"Light"],[1,"Normal"],[2,"Hard"]], T.int)}
      <p class="hint">Hard training develops players faster but they recover more slowly and pick up more knocks; light training keeps legs fresh.</p>
      <h3>Individual training (${T.ind.length}/5)</h3><p class="hint">Pick up to five players to work on one attribute: they grow faster, especially there. Set it from a player's card.</p>
      ${T.ind.length ? `<div class="mg-list">${T.ind.map(x=>{ const p = M.P[x.id]; return p ? `<div class="mg-row">${mgPosC(p.pos)}<b>${esc(p.n)}</b><small>${(p.pos==="GK" ? MG_GKATT : MG_ATT)[x.k]}</small>${mgBtn("indx", "Stop", "small", `data-id="${esc(p.id)}"`)}</div>` : ""; }).join("")}</div>` : ""}`;
  }
  else if (sub==="jobs"){ body = M.phase==="sacked" ? `${mgcOutHTML()}${mgJobsHTML()}` : `${mgcCardHTML()}${mgpHTML()}<p class="hint">Your reputation: <b>${Math.round(M.mgr.rep)}</b>/100. Clubs looking for a ${mgcRole()}:</p>${mgJobsHTML()}`; }
  else {
    const c2 = M.car;
    body = `<div class="mg-mgr">${mgAvatar({lk:{s:1, h:2, c:"Brown", b:0}}, M.club, 84)}<div><h3>${esc(M.mgr.name)}</h3><p class="hint">${esc(M.mgr.nat)} · ${M.mgr.age} · ${esc((MG_BG.find(b=>b[0]===M.mgr.bg) || [])[1] || "")}</p>
      <div class="label">Reputation</div><span class="meter"><span style="width:${M.mgr.rep}%"></span></span></div></div>
      <div class="mg-kpis"><div><span class="label">Games</span><b>${c2.p}</b></div><div><span class="label">W–D–L</span><b>${c2.w}–${c2.d}–${c2.l}</b></div><div><span class="label">Win rate</span><b>${c2.p ? Math.round(c2.w/c2.p*100) : 0}%</b></div><div><span class="label">Trophies</span><b>${M.trophies.length}</b></div></div>
      ${M.trophies.length ? `<h3>Trophies</h3><div class="mg-tro">${M.trophies.map(x=>`<span class="mg-trophy themed" style="${themeVars(trophyTheme(null, x.n))}">🏆 ${esc(x.n)} <small>${esc(x.club)} · ${esc(x.s)}</small></span>`).join("")}</div>` : ""}
      ${M.aw.length ? `<h3>Awards</h3><div class="mg-tro">${M.aw.map(a=>`<span class="mg-trophy">⭐ ${esc(a.t)} <small>${seasonLabel(a.s)}</small></span>`).join("")}</div>` : ""}
      <h3>Seasons</h3>${M.hist.length ? `<div class="tablewrap"><table class="mg-table"><thead><tr><th class="l">Season</th><th class="l">Club</th><th>Pos</th><th>W–D–L</th></tr></thead><tbody>${M.hist.map(h=>`<tr><td class="l">${esc(h.s)}${h.part ? "*" : ""}</td><td class="l">${mgCrestName(h.club, 16)}</td><td>${h.pos ? ord(h.pos) : "–"}</td><td>${h.w}–${h.d}–${h.l}</td></tr>`).join("")}</tbody></table></div>` : `<p class="hint">Your first season is under way.</p>`}`;
  }
  if (mgDof() && sub==="training") MG_SUB.club = "facilities";
  if (mgDof()) return `<section class="panel"><h2>${esc(M.club)}</h2>${mgSubTabs("club", [["overview","Overview"],["finances","Finances"],["facilities","Facilities"],["staff","Staff"],["board","Owner"],["academy","Academy"],["jobs","Jobs"],["career","Your career"]])}<div class="subview">${sub==="facilities" ? mdfFacilitiesHTML() : sub==="staff" ? mgxStaffHTML() : sub==="board" ? mgdPhilHTML() + body : body}</div></section>`;
  return `<section class="panel"><h2>${esc(M.club)}</h2>${mgSubTabs("club", [["overview","Overview"],["finances","Finances"],["board","Board"],["academy","Academy"],["training","Training"],["staff","Staff"],["jobs","Jobs"],["career","Your career"]])}<div class="subview">${sub==="staff" ? mgxStaffHTML() : body}</div></section>`;
}
const mgWeeksLeft = () => Math.max(10, Math.round((MGD(M.season + 1, 5, 1) - M.day)/7));
const mgBudgetStep = () => mgRoundWage(Math.max(500, M.fin.wb*.05));

/* ================= INBOX ================= */
function mgInboxHTML(){
  return `<section class="panel"><h2>Inbox</h2>${M.inbox.length ? `<div class="mg-inbox">${M.inbox.slice(0, 60).map(m=>`<article class="mg-msg k-${m.k} ${m.seen ? "" : "fresh"}"><div class="mg-msg-h"><span class="mg-k k-${m.k}">${m.k}</span><b>${esc(m.t)}</b><small>${mgFmt(m.d)}</small></div>
    <p>${esc(m.b).replace(/\n/g, "<br>")}</p>${mgMsgAct(m)}</article>`).join("")}</div>` : `<p class="hint">Nothing yet.</p>`}</section>`;
}
function mgMsgAct(m){
  const a = m.act; if (!a) return "";
  if (a.done) return `<p class="mg-done">${esc(a.done)}</p>`;
  if (a.type==="offer"){ const o = (M.offers || []).find(x=>x.id===a.offer); return o && o.st==="open" ? mgOfferBtns(o) : ""; }
  if (a.type==="req") return `<div class="row">${mgBtn("req", "Transfer list him", "small", `data-id="${esc(a.id)}" data-v="list" data-m="${m.id}"`)}${mgBtn("req", "Persuade him to stay", "small", `data-id="${esc(a.id)}" data-v="stay" data-m="${m.id}"`)}</div>`;
  if (a.type==="event"){ return M.ev && M.ev.id===a.ev ? `<div class="row">${a.ch.map(([l, k])=>mgBtn("ev", esc(l), "small", `data-v="${k}"`)).join("")}</div>` : ""; }
  if (a.type==="job") return M.phase==="sacked" || M.phase==="summer" || M.phase==="season" || M.phase==="pre" ? `<div class="row">${mgBtn("jobyes", `Take the ${esc(a.club)} job`, "small primary", `data-c="${esc(a.club)}" data-m="${m.id}"`)}${mgBtn("jobno", "Decline", "small", `data-m="${m.id}"`)}</div>` : "";
  if (a.type==="poach") return M.coach && !M.coach.int ? `<div class="row">${mgBtn("mdfpoach", `Let him go · ${mgMoney(a.comp)}`, "small", `data-m="${m.id}" data-v="yes"`)}${mgBtn("mdfpoach", "Refuse", "small primary", `data-m="${m.id}" data-v="no"`)}</div>` : "";
  if (a.type==="loanopt"){ const p = M.P[a.id]; return p && p.lin ? `<div class="row">${mgBtn("loanbuy", `Sign him · ${mgMoney(p.lin.opt)}`, "small primary", `data-id="${esc(p.id)}"`)}${mgBtn("loanlet", "Let him go back", "small", `data-id="${esc(p.id)}" data-m="${m.id}"`)}</div>` : ""; }
  if (a.type==="player") return `<div class="row">${mgBtn("player", "View player", "small", `data-id="${esc(a.id)}"`)}</div>`;
  if (a.type==="talk") return `<div class="row mgx-talk">${a.ch.map(([l, k])=>mgBtn("xtalk", esc(l), "small", `data-m="${m.id}" data-v="${k}"`)).join("")}</div>`;
  if (a.type==="prospects"){ const fee = mgRoundFee(Math.max(1e4, (MG_TB[mgLeagueOf()] || 1e5)*.0015));
    return `<div class="mg-list">${a.ids.map(id=>{ const p = M.P[id]; if (!p) return ""; const got = M.yth.includes(id);
      return `<div class="mg-yrow"><div class="mg-mrow-m">${mgOvrB(mgOvr(p))}${mgPosC(p.pos)}<span class="mg-pn"><b>${esc(p.n)}</b><small>${mgNat3(p.nat)} · ${p.age} yrs</small></span><span class="mg-potb">POT <b>${p.pot}</b></span></div>
        <div class="mg-mrow-a">${got ? `<span class="pill up">Signed</span>` : mgBtn("prosp", `Sign · ${mgMoney(fee)}`, "small primary", `data-id="${esc(id)}" data-fee="${fee}"`)}</div></div>`; }).join("")}</div>`; }
  return "";
}

/* ================= THE PLAYER CARD ================= */
function mgDlgEl(){ let d = document.getElementById("mgDlg"); if (!d){ d = document.createElement("dialog"); d.id = "mgDlg"; d.className = "acct-dlg mg-dlg"; d.setAttribute("aria-labelledby", "mgDlgT"); document.body.appendChild(d); d.addEventListener("click", e=>{ if (e.target===d) mgDlgClose(); }); } return d; }
function mgDlgClose(){ const d = document.getElementById("mgDlg"); if (d){ if (d.close && d.open) d.close(); else d.removeAttribute("open"); } MG_DLG = null; }
function mgOpenPlayer(id){ const p = mgFind(id); if (!p) return; MG_DLG = {id, mode:"info", msg:"", sure:false}; mgDlgPaint(true); }
function mgDlgPaint(first){
  const d = mgDlgEl(), D = MG_DLG; if (!D) return;
  const p = mgFind(D.id); if (!p){ mgDlgClose(); return; }
  const mine = p.club===M.club, yth = M.yth.includes(p.id), k = mgKnow(p), e = mgEst(p), att = p.pos==="GK" ? MG_GKATT : MG_ATT;
  const show = v => k>=100 ? v : k>=45 ? "~" + Math.round(v/5)*5 : "?";
  const ovr = mgOvr(p), tier = ovr>=85 ? "elite" : ovr>=78 ? "gold" : ovr>=70 ? "silver" : "bronze";
  const fa = mgFormAvg(p), avg = p.st.rn ? (p.st.rs/p.st.rn).toFixed(2) : "–", cl = p.club ? meta(p.club) : {c1:"#334", c2:"#fff"};
  let act = "";
  if (D.mode==="bid"){
    const ask = mgKnow(p)>=100 ? mgAsk(p) : null, val = mgValue(p), clause = mgClauseOf(p);
    const swaps = mgMine().filter(q=>!q.lin && !q.loan).sort((x, y)=>mgOvr(y) - mgOvr(x));
    act = `<div class="mg-neg"><h3>Make an offer to ${esc(p.club)}</h3>${clause ? `<p class="hint">Release clause: <b>${mgMoney(clause)}</b>. Pay it in full, up front, and they can't refuse.</p>` : ""}
      <div class="grid-form"><div class="field"><label for="mgFee">Transfer fee (£)</label><input id="mgFee" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.fee ?? val)}"></div>
        <div class="field"><label for="mgAddon">Add-ons (£, if he plays 20 league games)</label><input id="mgAddon" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.addon ?? 0)}"></div></div>
      <div class="row">${[["Value", val], ...(ask ? [["Their price", ask]] : []), ...(clause ? [["Clause", clause]] : [])].map(([l, v])=>`<button type="button" class="chip" data-mg="feeset" data-v="${v}">${l} · ${mgMoney(v)}</button>`).join("")}</div>
      <div class="label">Payment</div>${mgSeg("dset", "inst", MG_INST.map((l, i)=>[i, l]), D.inst ?? 0)}
      <div class="label">Sell-on clause for ${esc(p.club)}</div>${mgSeg("dset", "sell", [[0,"None"],[10,"10%"],[15,"15%"],[20,"20%"],[25,"25%"]], D.sell ?? 0)}
      <div class="field"><label for="mgSwap">Add a player in part-exchange</label><select id="mgSwap"><option value="">Nobody</option>${swaps.map(q=>`<option value="${esc(q.id)}" ${D.swap===q.id ? "selected" : ""}>${esc(q.n)} · ${q.pos} · ${mgOvr(q)} · ${mgMoney(mgValue(q))}</option>`).join("")}</select></div>
      <p class="hint">Clubs count money paid later and add-ons for less than money now. A sell-on clause is worth more to them for a young player.</p>
      <div class="row">${mgBtn("dobid", "Submit offer", "primary")}${mgBtn("dmode", "Back", "", 'data-v="info"')}</div></div>`;
  } else if (D.mode==="contract" || D.mode==="renew"){
    const renew = D.mode==="renew", role = D.role ?? (renew ? p.role ?? 2 : mgRoleGuessFor(p)), dem = mgDemand(p, role, renew), val = mgValue(p);
    act = `<div class="mg-neg"><h3>${renew ? "New contract" : "Personal terms"}</h3><p class="hint">${D.hint ? esc(D.hint) : `His agent says he's looking for around ${mgWageTxt(dem)}.`} Wage room: ${mgWageTxt(M.fin.wb - mgBill() + (renew ? p.wage : 0))}.</p>
      <div class="grid-form"><div class="field"><label for="mgWage">Weekly wage (£)</label><input id="mgWage" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.wage ?? dem)}"></div>
        <div class="field"><label for="mgYrs">Years</label><select id="mgYrs">${[1,2,3,4,5].map(y=>`<option ${(D.yrs ?? 3)===y ? "selected" : ""}>${y}</option>`).join("")}</select></div>
        <div class="field"><label for="mgRole">Squad role</label><select id="mgRole">${MG_ROLES.map((r, i)=>`<option value="${i}" ${role===i ? "selected" : ""}>${r}</option>`).join("")}</select></div>
        <div class="field"><label for="mgSignOn">Signing-on fee (£)</label><input id="mgSignOn" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.sign ?? 0)}"></div>
        <div class="field"><label for="mgApp">Appearance bonus (£ a game)</label><input id="mgApp" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.app ?? 0)}"></div>
        <div class="field"><label for="mgRc">Release clause (£, 0 for none)</label><input id="mgRc" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.rc ?? (renew ? p.rc || 0 : 0))}"></div></div>
      <div class="row"><button type="button" class="chip" data-mg="rcset" data-v="${mgRoundFee(val*2)}">Clause · 2× value (${mgMoney(mgRoundFee(val*2))})</button><button type="button" class="chip" data-mg="rcset" data-v="${mgRoundFee(val*4)}">Clause · 4× value</button><button type="button" class="chip" data-mg="rcset" data-v="0">No clause</button></div>
      <p class="hint">A signing-on fee or bonuses can bring his weekly wage down. He likes a release clause too, and a low one makes him cheaper, but a bigger club can pay it and take him.</p>
      <div class="row">${mgBtn("doterms", renew ? "Offer the contract" : "Offer terms", "primary")}${mgBtn("dmode", "Back", "", 'data-v="info"')}</div></div>`;
  } else if (D.mode==="sell"){
    const o = (M.offers || []).find(x=>x.id===D.offer && x.st==="open");
    act = !o ? `<p class="hint">That offer's gone.</p>` : `<div class="mg-neg"><h3>${esc(o.club)}'s offer</h3><p class="mg-int ok">${esc(mgDealTxt(o))}</p><p class="hint">His value: ${mgMoney(mgValue(p))}. ${o.exp - M.day} day${o.exp - M.day===1 ? "" : "s"} left to answer.</p>
      <div class="row">${mgBtn("ofr", "Accept", "primary", `data-o="${o.id}" data-v="yes"`)}${mgBtn("ofr", "Reject", "", `data-o="${o.id}" data-v="no"`)}</div>
      <h3>Or counter</h3>
      <div class="grid-form"><div class="field"><label for="mgFee">Fee you want (£)</label><input id="mgFee" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.fee ?? mgRoundFee(Math.max(o.fee*1.2, mgValue(p))))}"></div>
        <div class="field"><label for="mgBb">Buy-back clause (£, 0 for none)</label><input id="mgBb" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.bb ?? 0)}"></div></div>
      <div class="label">Payment</div>${mgSeg("dset", "inst", MG_INST.map((l, i)=>[i, l]), D.inst ?? o.inst ?? 0)}
      <div class="label">Sell-on clause for you</div>${mgSeg("dset", "sell", [[0,"None"],[10,"10%"],[15,"15%"],[20,"20%"],[25,"25%"],[30,"30%"]], D.sell ?? 0)}
      <div class="row"><button type="button" class="chip" data-mg="bbset" data-v="${mgRoundFee(mgValue(p)*1.5)}">Buy-back · ${mgMoney(mgRoundFee(mgValue(p)*1.5))}</button><button type="button" class="chip" data-mg="bbset" data-v="0">No buy-back</button></div>
      <p class="hint">The more you ask for (more money, all of it now, a sell-on, a buy-back), the less likely they are to agree. Push too far and they walk away.</p>
      <div class="row">${mgBtn("docounter", "Send counter-offer", "primary")}</div></div>`;
  } else if (D.mode==="loanin"){
    const role = D.role ?? mgRoleGuessFor(p), pay = D.pay ?? .5, val = mgValue(p);
    act = `<div class="mg-neg"><h3>Ask ${esc(p.club)} about a loan</h3><p class="hint">Until the end of the season. His wage: ${mgWageTxt(p.wage)} · your wage room: ${mgWageTxt(M.fin.wb - mgBill())}.</p>
      <div class="label">Share of his wages you pay</div>${mgSeg("payset", "pay", [[0,"0%"],[.25,"25%"],[.5,"50%"],[.75,"75%"],[1,"100%"]], pay)}
      <div class="grid-form"><div class="field"><label for="mgRole">Squad role</label><select id="mgRole">${MG_ROLES.map((r, i)=>`<option value="${i}" ${role===i ? "selected" : ""}>${r}</option>`).join("")}</select></div>
        <div class="field"><label for="mgOpt">Option to buy (£, 0 for none)</label><input id="mgOpt" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(D.opt ?? 0)}"></div></div>
      <div class="row"><button type="button" class="chip" data-mg="optset" data-v="${mgRoundFee(val*1.2)}">Add an option · ${mgMoney(mgRoundFee(val*1.2))}</button><button type="button" class="chip" data-mg="optset" data-v="0">No option</button></div>
      <div class="row">${mgBtn("doloan", "Make the loan offer", "primary")}${mgBtn("dmode", "Back", "", 'data-v="info"')}</div></div>`;
  } else if (D.mode==="train"){
    act = `<div class="mg-neg"><h3>Individual training</h3><div class="chips">${att.map((a, i)=>`<button type="button" class="chip" data-mg="indset" data-v="${i}">${MG_ATT_LONG[a]}</button>`).join("")}</div><div class="row">${mgBtn("dmode", "Back", "", 'data-v="info"')}</div></div>`;
  } else if (mine && p.lin){
    const ind = M.train.ind.find(x=>x.id===p.id);
    act = `<p class="mg-int ok">On loan from ${esc(p.lin.from)} until the summer · you pay ${Math.round(p.lin.pay*100)}% of his wages</p><div class="mg-acts">
      ${p.lin.opt ? mgBtn("loanbuy", `Make it permanent · ${mgMoney(p.lin.opt)}`, "small primary", `data-id="${esc(p.id)}"`) : ""}
      ${mgBtn("capt", M.tac.cap===p.id ? "Captain ✓" : "Make captain", "small")}${ind ? mgBtn("indx", "Stop individual training", "small", `data-id="${esc(p.id)}"`) : mgBtn("dmode", "Individual training", "small", 'data-v="train"')}
      ${mgBtn("loanback", D.sure ? "Tap again to send him back" : "Send him back early", "small danger")}</div>`;
  } else if (mine){
    const ind = M.train.ind.find(x=>x.id===p.id);
    act = `<div class="mg-acts">${mgBtn("dmode", "New contract", "small", 'data-v="renew"')}${mgBtn("tl", p.tl ? "Take off transfer list" : "Transfer list", "small")}${mgBtn("ll", p.ll ? "Take off loan list" : "Loan list", "small")}
      ${mgBtn("capt", M.tac.cap===p.id ? "Captain ✓" : "Make captain", "small")}${ind ? mgBtn("indx", "Stop individual training", "small", `data-id="${esc(p.id)}"`) : mgBtn("dmode", "Individual training", "small", 'data-v="train"')}
      ${mgBtn("release", D.sure ? `Tap again: costs ${mgMoney(mgRoundFee(p.wage*52*Math.max(0, p.con - M.season + 1)*.5))}` : "Release", "small danger")}</div>`;
  } else if (yth){
    act = `<div class="mg-acts">${mgBtn("promote", "Promote to the first team", "small primary", `data-id="${esc(p.id)}"`)}${mgBtn("yrel", "Release", "small", `data-id="${esc(p.id)}"`)}</div>`;
  } else {
    const I = mgInterest(p), sh = M.short.includes(p.id), B = mgBidOf(p.id), free = !p.club;
    act = `<p class="mg-int ${I.ok ? "ok" : "bad"}">${esc(I.txt)}</p><div class="mg-acts">${mgBtn("short", sh ? "★ Shortlisted" : "☆ Shortlist", "small", `data-id="${esc(p.id)}"`)}${k<100 ? mgBtn("scout", "Scout him", "small", `data-id="${esc(p.id)}"`) : ""}
      ${free ? mgBtn("dmode", "Offer a contract", "small primary", `data-v="contract" ${I.ok ? "" : "disabled"}`) : B && B.st==="contract" ? mgBtn("dmode", "Agree personal terms", "small primary", 'data-v="contract"')
        : mgBtn("dmode", mgInWindow() ? "Make an offer" : "Window closed", "small primary", `data-v="bid" ${I.ok && mgInWindow() && (!B || B.st!=="off") ? "" : "disabled"}`)}
      ${!free && mgLoanable(p) ? mgBtn("dmode", "Ask about a loan", "small", `data-v="loanin" ${mgInWindow() && mgLoanInterest(p).ok ? "" : "disabled"}`) : ""}</div>
      ${!free ? `<p class="hint" style="margin-top:6px">${mgLoanable(p) ? `${esc(p.club)} would consider loaning him out. ${esc(mgLoanInterest(p).txt)}.` : `${esc(p.club)} won't loan him out.`}</p>` : ""}`;
  }
  d.innerHTML = `<div class="dlg-in mg-pdlg"><div class="dlg-head"><div style="min-width:0"><h2 id="mgDlgT">${esc(p.n)}</h2><p class="hint">${esc(p.club || (yth ? "Academy" : "Free agent"))} · ${esc(MG_ATT_LONG[p.pos] || POS[p.pos]?.label || p.pos)}</p></div><button type="button" class="dlg-x" data-mg="dclose" aria-label="Close">×</button></div>
    <div class="mg-pgrid">
      <div class="mg-fut ${k>=100 ? tier : "unk"}" style="--c1:${cl.c1};--c2:${cl.c2}">
        <div class="mg-fut-top"><b class="mg-fut-ovr">${k>=100 ? ovr : e.lo + "–" + e.hi}</b><span class="mg-fut-pos">${p.pos}</span><span class="mg-fut-nat">${mgNat3(p.nat)}</span>${p.club ? clubBadge(p.club, 22) : ""}</div>
        <div class="mg-fut-av">${mgAvatar(p, p.club, 120)}</div>
        <div class="mg-fut-name">${esc(mgSurname(p.n))}</div>
        <div class="mg-fut-st">${att.map((a, i)=>`<span><b>${show(p.at[i])}</b>${a}</span>`).join("")}</div>
      </div>
      <div class="mg-pinfo">
        <dl class="mg-dl"><dt>Age</dt><dd>${p.age}</dd><dt>Potential</dt><dd>${esc(mgPotTxt(p))}</dd><dt>Foot</dt><dd>${p.ft==="L" ? "Left" : "Right"}</dd><dt>Positions</dt><dd>${[p.pos, ...(p.alt || [])].join(", ")}</dd>
          <dt>Value</dt><dd>${mgMoney(mgValue(p))}</dd><dt>Wage</dt><dd>${p.wage ? mgWageTxt(p.wage) : "–"}</dd><dt>Contract</dt><dd>${p.lin ? `on loan from ${esc(p.lin.from)}` : p.club ? `to ${p.con + 1}` : "–"}</dd>${mgClauseOf(p) && p.club ? `<dt>Release clause</dt><dd>${mgMoney(mgClauseOf(p))}</dd>` : ""}${mine && p.bon ? `<dt>Bonus</dt><dd>${mgMoney(p.bon)} a game</dd>` : ""}${mine && p.sellOn ? `<dt>Sell-on</dt><dd>${p.sellOn.pct}% to ${esc(p.sellOn.club)}</dd>` : ""}${mine && p.loan ? `<dt>Loan</dt><dd>at ${esc(p.loan.club)}${p.loan.opt ? ` · option ${mgMoney(p.loan.opt)}` : ""}</dd>` : ""}${mine ? `<dt>Role</dt><dd>${MG_ROLES[p.role ?? 2]}</dd>` : ""}
          <dt>Morale</dt><dd>${mgMorIc(p.mor)} ${mgMorLabel(p.mor)}</dd><dt>Form</dt><dd>${mgxFormLabel(p)}${mgxFormPart(p) ? ` (${mgxFormPart(p)>0 ? "+" : "−"}${Math.abs(mgxFormPart(p)).toFixed(1)})` : ""}</dd><dt>Sharpness</dt><dd>${Math.round(mgxShp(p))}% · ${mgxShpLabel(mgxShp(p))}${mgxShpPart(p) ? ` (−${Math.abs(mgxShpPart(p)).toFixed(1)})` : ""}</dd><dt>Fitness</dt><dd>${Math.round(p.fit)}%${p.stam ? ` · <span class="down-t">short of stamina for ${mgWeeks(p.stam.d)}</span>` : ""}${p.inj ? ` · <span class="down-t">${esc(p.inj.n)} (${mgWeeks(p.inj.d)})</span>` : ""}</dd>
          <dt>Form</dt><dd>${p.form && p.form.length ? p.form.map(r=>`<b class="mg-rt ${mmRtCls(r)}">${r.toFixed(1)}</b>`).join(" ") : "–"}</dd></dl>
        <div class="mg-pst"><div><b>${p.st.ap}</b><span>Apps</span></div><div><b>${p.st.g}</b><span>Goals</span></div><div><b>${p.st.a}</b><span>Assists</span></div><div><b>${avg}</b><span>Avg</span></div>${p.pos==="GK" ? `<div><b>${p.st.cs}</b><span>Clean sh.</span></div>` : ""}</div>
        ${p.hist && p.hist.length ? `<details class="mg-more"><summary>Past seasons</summary><div class="mg-others">${p.hist.slice().reverse().map(h=>`<div>${esc(h[0])} · ${esc(h[1])} · ${h[2]} apps, ${h[3]} g, ${h[4]} a${h[5] ? ` · ${h[5]}` : ""}</div>`).join("")}</div></details>` : ""}
      </div>
    </div>
    ${D.msg ? `<p class="ref mg-dmsg ${D.ok ? "ok" : ""}" role="status">${esc(D.msg)}</p>` : ""}
    ${act}</div>`;
  if (first){ if (d.showModal){ if (!d.open) d.showModal(); } else d.setAttribute("open", ""); }
}
// bring the deal form into view on the card
function mgDlgToForm(){ requestAnimationFrame(()=>{ const f = document.querySelector("#mgDlg .mg-neg"); if (f) f.scrollIntoView({block:"start", behavior:"smooth"}); }); }
function mgRoleGuessFor(p){ const lv = mgLevel(M.club), o = mgOvr(p); return o>=lv + 3 ? 0 : o>=lv ? 1 : o>=lv - 4 ? 2 : p.age<=21 ? 4 : 3; }

/* ================= TAPS AND TYPING ================= */
function mgFlash(t){ MG_FLASH = t; }
document.addEventListener("click", e=>{
  if (APP!=="manager") return;
  const b = e.target.closest("[data-mg]"); if (!b || b.disabled) return;
  const a = b.dataset.mg, id = b.dataset.id;
  const re = () => mgRender(), dlg = () => mgDlgPaint(false);
  // making a manager
  if (a==="nset"){ const k = b.dataset.k, v = b.dataset.v; MG_NEW[k] = k==="kit" ? +v : v; if (k==="lg") MG_NEW.club = null; mgRenderNew(); return; }
  if (a==="nnext"){
    if (MG_NEW.step===1){ const n = String(document.getElementById("mg-name")?.value || MG_NEW.name).trim(); if (n.length<2){ const er = document.getElementById("mgNewErr"); if (er) er.textContent = "Give your manager a name (at least 2 letters)."; return; } MG_NEW.name = n; }
    MG_NEW.step++; mgRenderNew(); window.scrollTo({top:0}); return; }
  if (a==="nback"){ MG_NEW.step--; mgRenderNew(); return; }
  if (a==="nrand"){ const L = TIER_LISTS[keyOf(MG_NEW.lg)]; MG_NEW.club = L[Math.floor(Math.random()*L.length)]; mgRenderNew(); return; }
  if (a==="ntake"){ if (MG_NEW.club) mgCreate(); return; }
  if (!M) return;
  // moving around
  if (a==="tab"){ MG_TAB = b.dataset.k; MG_PRE = null; MG_SEL = null; re(); uiEnter(document.getElementById("mgBody")); if (matchMedia("(max-width:720px)").matches) window.scrollTo({top:0}); return; }
  if (a==="go"){ MG_TAB = b.dataset.k; MG_SUB[b.dataset.k] = b.dataset.s; MG_PRE = null; re(); window.scrollTo({top:0}); return; }
  if (a==="sub"){ MG_SUB[b.dataset.g] = b.dataset.k; re(); return; }
  if (a==="continue"){ mgGo(); return; }
  if (a==="prematch"){ MG_PRE = mgUserFixture(); re(); return; }
  if (a==="play"){ mgPlay(false); return; }
  if (a==="sim"){ mgPlay(true); return; }
  if (a==="pretac"){ MG_PRE = null; MG_TAB = "tactics"; re(); return; }
  if (a==="xrep"){ if (MG_PRE) mgFlash(mgxReportApply(MG_PRE)); re(); return; }
  if (a==="xmark"){ const f = MG_PRE; if (f){ M.tac.mark = M.tac.mark && M.tac.mark.k===f.key && M.tac.mark.id===id ? null : {k:f.key, id}; mgSave(); } re(); return; }
  if (a==="xtalk"){ const m = M.inbox.find(x=>x.id===+b.dataset.m); if (m) mgFlash(mgxTalkAnswer(m, b.dataset.v)); re(); return; }
  if (a==="xstaff"){ MGX_OPEN = MGX_OPEN===b.dataset.k ? null : b.dataset.k; re(); return; }
  if (a==="xhire"){ mgFlash(mgxHire(b.dataset.k, +b.dataset.i)); MGX_OPEN = null; re(); return; }
  if (a==="xneg"){ const p = mgFind(id); if (p){ MG_DLG = {id, mode:p.club ? "bid" : "contract", msg:"", sure:false}; mgDlgPaint(true); mgDlgToForm(); } return; }
  if (a==="xtrust"){ mgFlash(mgxTrust(+b.dataset.i)); re(); window.scrollTo({top:0}); return; }
  if (a==="precoach"){ MG_PRE = null; MG_TAB = "coach"; re(); return; }
  if (a==="press"){ mgPressAnswer(MG_PRE, +b.dataset.i); mgFlash("Your answer is in tomorrow's papers."); re(); return; }
  if (a==="lastx"){ MG_LAST = null; re(); return; }
  if (a==="apply"){ const r = mgApplyJob(b.dataset.c); mgFlash(r.txt); if (r.ok){ MG_TAB = "home"; MG_PRE = null; } re(); window.scrollTo({top:0}); return; }
  if (a==="jobyes"){ const m = M.inbox.find(x=>x.id===+b.dataset.m); if (m) m.act.done = "In talks"; mgcOffer(b.dataset.c); mgFlash(`${b.dataset.c} have made you an offer.`); MG_TAB = M.phase==="sacked" ? "club" : "home"; re(); window.scrollTo({top:0}); return; }
  if (a==="csign"){ const txt = mgcSign(); mgFlash(txt); MG_TAB = "home"; MG_LAST = null; MG_PRE = null; re(); window.scrollTo({top:0}); return; }
  if (a==="cask"){ mgcAsk(b.dataset.v==="wage" ? "wage" : "yrs"); re(); return; }
  if (a==="cno"){ mgcDecline(); re(); return; }
  if (a==="cresign"){ MG_RESIGN = true; re(); return; }
  if (a==="cresign0"){ MG_RESIGN = false; re(); return; }
  if (a==="cresign2"){ MG_RESIGN = false; mgcResign(); MG_TAB = "home"; MG_PRE = null; MG_LAST = null; re(); window.scrollTo({top:0}); return; }
  if (a==="cwait"){ mgcWait(+b.dataset.v || 7); mgFlash(`${mgFmt(M.day)}. ${(M.jobs || []).length} vacanc${(M.jobs || []).length===1 ? "y" : "ies"} open.`); re(); return; }
  if (a==="jobno"){ const m = M.inbox.find(x=>x.id===+b.dataset.m); if (m) m.act.done = "Declined"; mgSave(); re(); return; }
  // squad and tactics
  if (a==="sqf"){ MG_SUB.squad = b.dataset.v; re(); return; }
  if (a==="form"){ M.tac.out = {}; M.tac.f = b.dataset.v; M.tac.fam[M.tac.f] ??= 45; mgPickBest(); MG_SEL = null; mgSave(); re(); return; }
  if (a==="tslot"){ mgTacTap("slot", +b.dataset.i); mgSave(); re(); return; }
  if (a==="tpick"){ mgTacTap("p", id); mgSave(); re(); return; }
  if (a==="tclear"){ MG_SEL = null; re(); return; }
  if (a==="autoxi"){ mgPickBest(); MG_SEL = null; mgSave(); mgFlash("Your assistant has picked the strongest XI."); re(); return; }
  if (a==="tset"){ M.tac[b.dataset.k] = +b.dataset.v; if (b.dataset.k!=="ment") M.tac.style = "Custom"; mgSave(); re(); return; }
  if (a==="style"){ const st = MG_STYLES[b.dataset.v]; Object.assign(M.tac, {tempo:st.tempo, press:st.press, width:st.width, pass:st.pass, line:st.line}); if (st.ment!=null) M.tac.ment = st.ment; M.tac.style = b.dataset.v; mgSave(); re(); return; }
  // transfers
  if (a==="search"){ MG_RES = mgSearch(MG_Q); re(); return; }
  if (a==="short"){ const i = M.short.indexOf(id); if (i>=0) M.short.splice(i, 1); else M.short.push(id); mgSave(); if (MG_DLG) dlg(); re(); return; }
  if (a==="scout"){ const p = mgFind(id); const err = p ? mgScout(p) : "Player not found."; mgFlash(err || `A scout is on his way to watch ${p.n}.`); if (MG_DLG){ MG_DLG.msg = err || "A scout is on his way. His report will be in your inbox."; dlg(); } re(); return; }
  if (a==="ofr"){ const o = (M.offers || []).find(x=>x.id===+b.dataset.o); if (!o) return;
    if (b.dataset.v==="ask"){ mgOpenPlayer(o.pid); MG_DLG.mode = "sell"; MG_DLG.offer = o.id; mgDlgPaint(false); mgDlgToForm(); return; }
    const t = mgAnswerOffer(o, b.dataset.v); if (MG_DLG) mgDlgClose(); mgFlash(t); re(); return; }
  if (a==="buyback"){ const err = mgBuyBack(+b.dataset.i); mgFlash(err || "He's back!"); re(); return; }
  if (a==="req"){ const p = M.P[id], m = M.inbox.find(x=>x.id===+b.dataset.m); if (!p) return;
    if (b.dataset.v==="list"){ p.tl = 1; if (m) m.act.done = "Transfer listed"; }
    else { const ok = Math.random()<.5; p.req = ok ? 0 : 1; p.mor = clamp(p.mor + (ok ? 15 : -8), 0, 100); if (m) m.act.done = ok ? "He's agreed to stay and fight for his place" : "He isn't convinced and still wants out"; }
    mgSave(); re(); return; }
  if (a==="ev"){ mgFlash(mgEventAnswer(b.dataset.v)); re(); return; }
  if (a==="loanbuy"){ const p = M.P[id]; if (!p) return; const n = p.n, err = mgLoanBuy(p); mgFlash(err || `✍ ${n} is yours for good.`); if (MG_DLG) mgDlgClose(); re(); return; }
  if (a==="loanlet"){ const m = M.inbox.find(x=>x.id===+b.dataset.m); if (m) m.act.done = "He'll go back in the summer"; mgSave(); re(); return; }
  if (a==="prosp"){ const p = M.P[id], fee = +b.dataset.fee; if (!p || M.yth.includes(id)) return; if (M.fin.tb<fee){ mgFlash("You can't afford him."); re(); return; } M.fin.tb -= fee; mgFinAdd("exp", "buys", fee); M.yth.push(id); mgSave(); mgFlash(`${p.n} joins your academy.`); re(); return; }
  // the club
  if (a==="budget"){ const step = mgBudgetStep(), cost = step*mgWeeksLeft(); if (b.dataset.v==="+big"){ if (M.fin.tb<cost){ mgFlash("Not enough transfer budget to move."); re(); return; } M.fin.tb -= cost; M.fin.wb += step; } else { if (M.fin.wb - step<mgBill()){ mgFlash("You can't cut the wage budget below your wage bill."); re(); return; } M.fin.wb -= step; M.fin.tb += cost; } mgSave(); re(); return; }
  if (a==="train"){ M.train[b.dataset.k] = b.dataset.k==="int" ? +b.dataset.v : b.dataset.v; mgSave(); re(); return; }
  if (a==="indx"){ M.train.ind = M.train.ind.filter(x=>x.id!==id); mgSave(); if (MG_DLG) dlg(); re(); return; }
  if (a==="ysc"){ const err = mgYouthScout(b.dataset.v); mgFlash(err || "Your youth scout is on his way."); re(); return; }
  if (a==="promote"){ mgPromote(id); mgFlash(`${M.P[id]?.n} joins the first team.`); if (MG_DLG) mgDlgClose(); re(); return; }
  if (a==="yrel"){ const p = M.P[id]; M.yth = M.yth.filter(x=>x!==id); if (p) delete M.P[id]; mgSave(); if (MG_DLG) mgDlgClose(); mgFlash(`${p ? p.n : "He"} has been released from the academy.`); re(); return; }
  if (a==="euv"){ MG_EUV = b.dataset.v; re(); return; }
  // the player card
  if (a==="player"){ mgOpenPlayer(id); return; }
  if (a==="dclose"){ mgDlgClose(); re(); return; }
  if (!MG_DLG) return;
  const D = MG_DLG, p = mgFind(D.id);
  if (a==="dmode"){ D.mode = b.dataset.v; D.msg = ""; D.hint = ""; dlg(); if (D.mode!=="info") mgDlgToForm(); return; }
  // the deal forms keep what's been typed when a button redraws them
  const keep = () => { const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
    [["mgFee","fee"],["mgAddon","addon"],["mgWage","wage"],["mgSignOn","sign"],["mgApp","app"],["mgRc","rc"],["mgBb","bb"],["mgOpt","opt"]].forEach(([i, k])=>{ const x = v(i); if (x!=null) D[k] = moneyOut(x); });
    const sw = v("mgSwap"); if (sw!=null) D.swap = sw || null; const y = v("mgYrs"); if (y!=null) D.yrs = +y; const r = v("mgRole"); if (r!=null) D.role = +r; };
  if (a==="feeset"){ keep(); D.fee = +b.dataset.v; dlg(); return; }
  if (a==="dset"){ keep(); D[b.dataset.k] = +b.dataset.v; dlg(); return; }
  if (a==="rcset"){ keep(); D.rc = +b.dataset.v; dlg(); return; }
  if (a==="bbset"){ keep(); D.bb = +b.dataset.v; dlg(); return; }
  if (a==="docounter"){ keep(); const o = (M.offers || []).find(x=>x.id===D.offer); if (!o) return; const t = mgAnswerOffer(o, "ask", {fee:D.fee, inst:D.inst ?? o.inst ?? 0, sell:D.sell || 0, bb:D.bb || 0});
    if (o.st==="open"){ D.msg = t; D.ok = false; dlg(); re(); return; } mgDlgClose(); mgFlash(t); re(); return; }
  if (a==="payset"){ D.pay = +b.dataset.v; D.role = +document.getElementById("mgRole").value; D.opt = moneyOut(document.getElementById("mgOpt").value); dlg(); return; }
  if (a==="optset"){ D.opt = +b.dataset.v; D.role = +document.getElementById("mgRole").value; dlg(); return; }
  if (a==="doloan"){
    const pay = D.pay ?? .5, role = +document.getElementById("mgRole").value, opt = moneyOut(document.getElementById("mgOpt").value); D.role = role; D.opt = opt;
    const r = mgLoanAsk(p, pay, role, opt);
    if (r.ok){ const q = mgLoanIn(p, pay, role, opt); mgDlgClose(); mgFlash(`✍ ${q.n} joins on loan from ${q.lin.from}! ${q._in ? `Your assistant has put him straight into the XI at ${q._in.pos}${q._in.out ? `, in place of ${mgShort(q._in.out)}` : ""}.` : "He starts on the bench."}`); MG_RES = MG_RES ? MG_RES.filter(x=>x.id!==p.id) : null; re(); return; }
    D.msg = r.txt; D.ok = false; if (r.counter!=null) D.pay = r.counter; if (r.opt) D.opt = r.opt; dlg(); return; }
  if (a==="loanback"){ if (!D.sure){ D.sure = true; dlg(); setTimeout(()=>{ if (MG_DLG===D){ D.sure = false; dlg(); } }, 3500); return; } const n = p.n, from = p.lin.from; mgLoanBack(p); mgDlgClose(); mgFlash(`${n} has gone back to ${from}.`); re(); return; }
  if (a==="dobid"){ keep(); const r = mgBid(p, {fee:D.fee, inst:D.inst || 0, addon:D.addon || 0, sell:D.sell || 0, swap:D.swap || null}); D.msg = r.txt; D.ok = !!r.ok;
    if (r.counter) D.fee = r.counter; if (r.ok){ D.mode = "contract"; D.role = mgRoleGuessFor(p); } mgSave(); dlg(); return; }
  if (a==="doterms"){
    keep(); const c = {wage:mgRoundWage(D.wage || 0), yrs:D.yrs || 3, role:D.role ?? 2, sign:D.sign || 0, app:D.app || 0, rc:D.rc || 0};
    const renew = D.mode==="renew", r = mgOffer(p, c, 0, 0, renew);
    if (r.ok){ if (renew){ mgRenew(p, c); D.mode = "info"; D.msg = `${p.n} has signed a new contract!`; D.ok = true; dlg(); re(); return; }
      const q = mgSign(p, c); mgDlgClose(); mgFlash(`✍ ${q.n} has signed for ${M.club}! ${q._in ? `Your assistant has put him straight into the XI at ${q._in.pos}${q._in.out ? `, in place of ${mgShort(q._in.out)}` : ""}.` : "He starts on the bench."}`); MG_RES = MG_RES ? MG_RES.filter(x=>x.id!==p.id) : null; re(); return; }
    D.msg = r.txt; D.ok = false; if (r.counter){ D.wage = r.counter; D.hint = `He wants ${mgWageTxt(r.counter)} a week with the rest as offered.`; } mgSave(); dlg(); return; }
  if (a==="tl"){ p.tl = p.tl ? 0 : 1; if (p.tl) p.mor = clamp(p.mor - (p.req ? -5 : 8), 0, 100); D.msg = p.tl ? `${p.n} is on the transfer list.` : `${p.n} is off the transfer list.`; mgSave(); dlg(); re(); return; }
  if (a==="ll"){ p.ll = p.ll ? 0 : 1; D.msg = p.ll ? `${p.n} is available for loan.` : `${p.n} is no longer available for loan.`; mgSave(); dlg(); re(); return; }
  if (a==="capt"){ if (!M.tac.xi.includes(p.id)){ D.msg = "Only a player in your XI can be captain."; dlg(); return; } M.tac.cap = p.id; p.mor = clamp(p.mor + 5, 0, 100); D.msg = `${p.n} is your captain.`; mgSave(); dlg(); return; }
  if (a==="indset"){ if (M.train.ind.length>=5){ D.msg = "Five players are already on individual training."; D.mode = "info"; dlg(); return; } M.train.ind.push({id:p.id, k:+b.dataset.v}); D.mode = "info"; D.msg = `${p.n} starts individual work.`; mgSave(); dlg(); return; }
  if (a==="release"){ if (!D.sure){ D.sure = true; dlg(); setTimeout(()=>{ if (MG_DLG===D){ D.sure = false; dlg(); } }, 3500); return; } mgRelease(p); mgDlgClose(); mgFlash(`${p.n} has been released.`); re(); return; }
});
document.addEventListener("input", e=>{
  if (APP!=="manager") return;
  const k = e.target.dataset && e.target.dataset.mgin; if (!k) return;
  if (k==="name" && MG_NEW) MG_NEW.name = e.target.value;
  if (k==="age" && MG_NEW){ MG_NEW.age = +e.target.value; const o = document.getElementById("mgAgeOut"); if (o) o.textContent = MG_NEW.age; }
});
document.addEventListener("change", e=>{
  if (APP!=="manager") return;
  const k = e.target.dataset && e.target.dataset.mgin; if (!k) return;
  const v = e.target.value;
  if (k==="nat" && MG_NEW) MG_NEW.nat = v;
  else if (k==="sort"){ MG_SORT = v; mgRender(); }
  else if (k==="cap"){ M.tac.cap = v; mgSave(); }
  else if (k.startsWith("sp-")){ (M.tac.sp ||= {})[k.slice(3)] = v || null; mgSave(); }
  else if (k==="xpick"){ mgxS().pick = e.target.checked; mgSave(); }
  else if (k==="lgv"){ MG_LGV = v; mgRender(); }
  else if (k.startsWith("q-")){ const f = k.slice(2); MG_Q[f] = ["age","ovr","max"].includes(f) ? +v : v; }
});
document.addEventListener("keydown", e=>{ if (APP==="manager" && e.key==="Enter" && e.target.dataset && e.target.dataset.mgin==="q-name"){ MG_Q.name = e.target.value; MG_RES = mgSearch(MG_Q); mgRender(); } });
