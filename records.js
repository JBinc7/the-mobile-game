/* records.js — 3.0: the Records room. One place on the main menu for everything you've done on this account, in all
   three modes: achievements (with progress, and a few gold coins the first time each is unlocked), your all-time
   records, and the way into the two halls of fame.
   Nothing here is tracked as it happens: it's all worked out from your saves (and the managers' hall of fame, which
   outlives a deleted save), so it's right for careers started before this existed. What you've unlocked is kept on
   the account ("ach") and travels in backups, so deleting a save never takes an achievement away. */
const Records = (() => {
  const key = () => Account.storageKey("ach");
  const got = () => { try{ return JSON.parse(localStorage.getItem(key())) || {}; }catch(e){ return {}; } };
  const put = o => { try{ localStorage.setItem(key(), JSON.stringify(o)); }catch(e){} };
  const COIN = {1:40, 2:120, 3:300}, TIER = {1:"Bronze", 2:"Silver", 3:"Gold"};
  const n = v => Math.round(+v || 0), isTop = t => { const T = TIERS[keyOf(t)]; return !!T && T.level===1; };

  /* ---------- what your saves say ---------- */
  function facts(saves, hall){
    const F = {modes:new Set(), tro:{player:0, manager:0, dof:0},
      p:{careers:0, seasons:0, apps:0, g:0, a:0, cs:0, potm:0, tro:0, kinds:new Set(), bestG:0, bestR:0, top:false, retired:0, clubs:0},
      m:{careers:0, seasons:0, p:0, w:0, tro:0, title:false, euro:false, top4:false, promo:false, big:0, rep:0, clubs:0},
      d:{careers:0, seasons:0, p:0, w:0, tro:0, title:false, euro:false, promo:false, rep:0, clubs:0},
      rec:{}};
    const best = (k, v, who) => { if (v!=null && isFinite(v) && (!F.rec[k] || v > F.rec[k].v)) F.rec[k] = {v, ...who}; };
    (saves.player || []).forEach(d=>{
      if (!d || !d.player) return;
      const P = F.p, H = d.history || [], who = {name:d.player.name};
      F.modes.add("player"); P.careers++; P.tro += (d.trophies || []).length; (d.trophies || []).forEach(t=>P.kinds.add(t.kind));
      if (d.phase==="retired") P.retired++;
      let g = 0, a = 0, apps = 0;
      H.forEach(h=>{ const t = h.tot || {}; apps += n(t.apps); g += n(t.g); a += n(t.a); P.cs += n(t.cs); P.potm += n(t.potm);
        if (!h.half) P.seasons++;
        if (isTop(h.tier)) P.top = true;
        P.bestG = Math.max(P.bestG, n(t.g)); best("pSeasonG", n(t.g), {...who, sub:`${seasonLabel(h.season)} · ${h.club}`});
        if (n(t.rn)>=10){ const r = t.rs/t.rn; P.bestR = Math.max(P.bestR, r); best("pSeasonR", +r.toFixed(2), {...who, sub:`${seasonLabel(h.season)} · ${h.club}`}); }
        best("pValue", +h.after || 0, {...who, sub:`${seasonLabel(h.season)} · ${h.club}`}); });
      // the season in progress counts towards the career totals
      const now = d.mc && d.mc.rec ? totOf({...(d.mc.rec.cups || {}), league:d.mc.rec.league, ...(d.mc.rec.eu ? {eu:d.mc.rec.eu} : {})}) : null;
      if (now){ apps += n(now.apps); g += n(now.g); a += n(now.a); P.cs += n(now.cs); P.potm += n(now.potm); P.bestG = Math.max(P.bestG, n(now.g)); }
      const tiers = (d.world && d.world.tiers) || (typeof TIER_LISTS!=="undefined" ? TIER_LISTS : {}), tNow = Object.keys(tiers).find(t=>(tiers[t] || []).includes(d.club));
      if (tNow!=null && isTop(tNow) && apps) P.top = true;
      P.apps += apps; P.g += g; P.a += a; P.clubs = Math.max(P.clubs, new Set(H.map(h=>h.club).concat(d.club || [])).size);
      best("pCareerG", g, {...who, sub:`${apps} games`}); best("pCareerApps", apps, {...who, sub:`${H.filter(h=>!h.half).length} seasons`}); best("pTro", (d.trophies || []).length, {...who, sub:d.club || ""});
    });
    // managers and directors: the hall of fame has every career, deleted or not; the saves add the detail
    const seen = new Set();
    const career = (role, e) => { const X = role==="dof" ? F.d : F.m; F.modes.add(role==="dof" ? "dof" : "manager");
      X.careers++; X.seasons += n(e.seasons); X.p += n(e.p); X.w += n(e.w); X.tro += n(e.tro); X.rep = Math.max(X.rep, n(e.rep)); X.clubs = Math.max(X.clubs, (e.clubs || []).length);
      const who = {name:e.name, sub:e.club || ""}, pre = role==="dof" ? "d" : "m";
      best(pre + "Tro", n(e.tro), who); best(pre + "Wins", n(e.w), {...who, sub:`${n(e.p)} games`}); if (n(e.p)>=30) best(pre + "Pct", Math.round(e.w/e.p*100), {...who, sub:`${n(e.p)} games`}); };
    ["manager", "dof"].forEach(mode=>(saves[mode] || []).forEach(d=>{
      if (!d || !d.mgr || !d.club) return;
      const role = d.role==="dof" ? "dof" : d.role==="mgr" ? "mgr" : mode==="dof" ? "dof" : "mgr", X = role==="dof" ? F.d : F.m, hist = (d.hist || []).filter(h=>!h.part), c = d.car || {};
      seen.add(d.id);
      career(role, {name:d.mgr.name, club:d.club, clubs:[...new Set((d.clubs || []).map(x=>x.club))], seasons:hist.length, p:c.p, w:c.w, tro:(d.trophies || []).length, rep:d.mgr.rep});
      const who = {name:d.mgr.name};
      hist.forEach((h, i)=>{ const T = TIERS[keyOf(h.t)]; if (!T) return;
        if (h.pos===1 && T.level===1) X.title = true;
        if (h.pos<=4 && T.level===1 && role==="mgr") F.m.top4 = true;
        const nx = (d.hist || [])[d.hist.indexOf(h) + 1];
        if (nx && nx.club===h.club && TIERS[keyOf(nx.t)] && TIERS[keyOf(nx.t)].level < T.level) X.promo = true;
        if (T.level===1) best((role==="dof" ? "d" : "m") + "Pos", -h.pos, {...who, sub:`${h.s} · ${h.club}`, show:ord(h.pos)}); });
      (d.trophies || []).forEach(t=>{ if (/Champions League|Europa League|Conference League/.test(t.n)) X.euro = true; const T = Object.values(TIERS).find(T=>T.level===1 && (T.title===t.n || T.name===t.n)); if (T) X.title = true; });
      if (role==="mgr") (d.myres || []).forEach(r=>{ if (r.c!=="F"){ F.m.big = Math.max(F.m.big, r.gf - r.ga); best("mBig", r.gf - r.ga, {...who, sub:`${r.h ? "v" : "at"} ${r.o}`, show:`${r.gf}–${r.ga}`}); } });
    }));
    (hall || []).forEach(e=>{ if (e && !seen.has(e.id)) career(e.role==="dof" ? "dof" : "mgr", e); });
    F.tro = {player:F.p.tro, manager:F.m.tro, dof:F.d.tro};
    return F;
  }

  /* ---------- the achievements: [id, mode, tier, title, how, progress(F) → [have, need]] ---------- */
  const yes = b => [b ? 1 : 0, 1];
  const LIST = [
    ["p_debut", "player", 1, "Debut", "Play your first match", F=>[F.p.apps, 1]],
    ["p_g10", "player", 1, "Off the mark", "Score 10 career goals", F=>[F.p.g, 10]],
    ["p_g100", "player", 2, "Centurion", "Score 100 career goals", F=>[F.p.g, 100]],
    ["p_g300", "player", 3, "Record breaker", "Score 300 career goals", F=>[F.p.g, 300]],
    ["p_a50", "player", 2, "Playmaker", "Set up 50 goals", F=>[F.p.a, 50]],
    ["p_s20", "player", 2, "Twenty-goal season", "Score 20 goals in one season", F=>[F.p.bestG, 20]],
    ["p_r8", "player", 3, "World class", "Average 8.0 or better over a season", F=>[Math.min(8, +F.p.bestR.toFixed(1)), 8]],
    ["p_potm", "player", 2, "Star man", "Win 10 Player of the Match awards", F=>[F.p.potm, 10]],
    ["p_apps100", "player", 1, "Regular", "Play 100 games", F=>[F.p.apps, 100]],
    ["p_apps500", "player", 3, "Five hundred club", "Play 500 games", F=>[F.p.apps, 500]],
    ["p_cs50", "player", 2, "Brick wall", "Keep 50 clean sheets", F=>[F.p.cs, 50]],
    ["p_top", "player", 2, "The big time", "Play in a top flight", F=>yes(F.p.top)],
    ["p_tro1", "player", 1, "Silverware", "Win your first trophy", F=>[F.p.tro, 1]],
    ["p_league", "player", 2, "Champion", "Win a league title", F=>yes(F.p.kinds.has("league"))],
    ["p_euro", "player", 3, "Kings of Europe", "Win a European trophy", F=>yes(F.p.kinds.has("europe"))],
    ["p_intl", "player", 3, "For your country", "Win an international tournament", F=>yes(F.p.kinds.has("intl"))],
    ["p_ballon", "player", 3, "The best in the world", "Win the Ballon d'Or", F=>yes(F.p.kinds.has("ballon"))],
    ["p_tro10", "player", 3, "Serial winner", "Win 10 trophies as a player", F=>[F.p.tro, 10]],
    ["p_retire", "player", 2, "Hung up the boots", "See a career through to retirement", F=>[F.p.retired, 1]],
    ["m_win1", "manager", 1, "Three points", "Win your first match as a manager", F=>[F.m.w, 1]],
    ["m_w50", "manager", 2, "Winning habit", "Win 50 matches as a manager", F=>[F.m.w, 50]],
    ["m_w200", "manager", 3, "Dynasty", "Win 200 matches as a manager", F=>[F.m.w, 200]],
    ["m_big", "manager", 1, "Statement win", "Win a competitive match by five goals", F=>[Math.min(5, F.m.big), 5]],
    ["m_s1", "manager", 1, "Still in a job", "Complete a season as a manager", F=>[F.m.seasons, 1]],
    ["m_s5", "manager", 2, "Part of the furniture", "Complete five seasons as a manager", F=>[F.m.seasons, 5]],
    ["m_promo", "manager", 2, "Going up", "Win promotion", F=>yes(F.m.promo)],
    ["m_top4", "manager", 2, "Top four", "Finish in the top four of a top flight", F=>yes(F.m.top4)],
    ["m_tro1", "manager", 2, "First of many", "Win a trophy as a manager", F=>[F.m.tro, 1]],
    ["m_title", "manager", 3, "Champions", "Win a top-flight title as a manager", F=>yes(F.m.title)],
    ["m_euro", "manager", 3, "European nights", "Win a European trophy as a manager", F=>yes(F.m.euro)],
    ["m_rep", "manager", 3, "The special one", "Reach a reputation of 85", F=>[Math.min(85, F.m.rep), 85]],
    ["d_s1", "dof", 1, "Upstairs", "Complete a season as a director of football", F=>[F.d.seasons, 1]],
    ["d_s5", "dof", 2, "The long game", "Complete five seasons as a director", F=>[F.d.seasons, 5]],
    ["d_w50", "dof", 2, "Right appointments", "Your club wins 50 matches", F=>[F.d.w, 50]],
    ["d_promo", "dof", 2, "Built to go up", "Win promotion as a director", F=>yes(F.d.promo)],
    ["d_tro1", "dof", 2, "The architect", "Win a trophy as a director", F=>[F.d.tro, 1]],
    ["d_title", "dof", 3, "Project complete", "Win a top-flight title as a director", F=>yes(F.d.title)],
    ["d_euro", "dof", 3, "Continental project", "Win a European trophy as a director", F=>yes(F.d.euro)],
    ["x_three", "all", 1, "Every angle", "Start a career in all three modes", F=>[F.modes.size, 3]],
    ["x_treble", "all", 3, "Boots, dugout, boardroom", "Win a trophy as a player, a manager and a director", F=>[["player", "manager", "dof"].filter(k=>F.tro[k]>0).length, 3]],
    ["x_tro25", "all", 3, "Trophy room", "Win 25 trophies across all your careers", F=>[F.p.tro + F.m.tro + F.d.tro, 25]],
  ];
  const MODE = {player:"Player Career", manager:"Manager Career", dof:"Director of Football", all:"Every mode"};
  const BOARD = [
    ["Player Career", [["pSeasonG", "Most goals in a season"], ["pSeasonR", "Best season rating"], ["pCareerG", "Most career goals"], ["pCareerApps", "Most games"], ["pTro", "Most trophies"], ["pValue", "Highest value", v=>money(v)]]],
    ["Manager Career", [["mTro", "Most trophies"], ["mWins", "Most wins"], ["mPct", "Best win rate", v=>v + "%"], ["mBig", "Biggest win"], ["mPos", "Best top-flight finish"]]],
    ["Director of Football", [["dTro", "Most trophies"], ["dWins", "Most wins"], ["dPct", "Best win rate", v=>v + "%"], ["dPos", "Best top-flight finish"]]],
  ];

  // work everything out, bank anything newly unlocked (with its coins) and say what's new
  function check(saves, hall){
    const F = facts(saves, hall), have = got(), fresh = [];
    const rows = LIST.map(([id, mode, tier, t, how, fn])=>{ let [a, b] = fn(F); a = Math.max(0, +a || 0);
      if (a>=b && !have[id]){ have[id] = Date.now(); fresh.push({id, t, tier}); }
      return {id, mode, tier, t, how, a:Math.min(a, b), b, done:!!have[id], when:have[id]}; });
    if (fresh.length){ put(have); Account.addCoins(fresh.reduce((s, x)=>s + COIN[x.tier], 0)); }
    return {F, rows, fresh};
  }
  const medal = (tier, on) => `<span class="ach-m t${tier} ${on ? "on" : ""}" aria-hidden="true"><svg viewBox="0 0 32 40"><path d="M9 0h14l-3 13h-8z" fill="currentColor" opacity=".45"/><circle cx="16" cy="25" r="12" fill="currentColor"/><circle cx="16" cy="25" r="8.5" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/><path d="M16 19.5l1.7 3.6 3.9.5-2.9 2.7.8 3.9-3.5-2-3.5 2 .8-3.9-2.9-2.7 3.9-.5z" fill="rgba(0,0,0,.3)"/></svg></span>`;
  function html(saves, hall, tab){
    const {F, rows, fresh} = check(saves, hall), done = rows.filter(r=>r.done).length;
    const fmt = (r, f) => r.show || (f ? f(r.v) : r.v);
    const ach = Object.keys(MODE).map(m=>{ const L = rows.filter(r=>r.mode===m); return `<section class="panel rec-sec"><h3 class="rec-h">${MODE[m]}<span>${L.filter(r=>r.done).length} / ${L.length}</span></h3>
      <div class="ach-list">${L.sort((a, b)=>b.done - a.done || b.a/b.b - a.a/a.b || a.tier - b.tier).map(r=>`<div class="ach ${r.done ? "done" : ""}">${medal(r.tier, r.done)}
        <div class="ach-t"><b>${esc(r.t)}</b><span>${esc(r.how)}</span>${r.done ? "" : r.b>1 ? `<span class="ach-bar" role="img" aria-label="${r.a} of ${r.b}"><i style="width:${Math.round(r.a/r.b*100)}%"></i></span>` : ""}</div>
        <span class="ach-r">${r.done ? `<b class="ach-ok">✓</b>` : r.b>1 ? `${r.a.toLocaleString()} / ${r.b.toLocaleString()}` : ""}<small>${TIER[r.tier]} · ${COIN[r.tier]} coins</small></span></div>`).join("")}</div></section>`; }).join("");
    const board = BOARD.map(([name, L])=>{ const any = L.some(([k])=>F.rec[k] && F.rec[k].v>0 || (F.rec[k] && F.rec[k].show));
      return `<section class="panel rec-sec"><h3 class="rec-h">${name}</h3>${any ? `<div class="rec-list">${L.map(([k, label, f])=>{ const r = F.rec[k]; return r && (r.v>0 || r.show) ? `<div class="rec-row"><span class="label">${label}</span><b>${esc(String(fmt(r, f)))}</b><span class="rec-who">${esc(r.name || "")}${r.sub ? ` · ${esc(r.sub)}` : ""}</span></div>` : ""; }).join("")}</div>`
        : `<p class="empty">Nothing here yet. Your records in this mode appear as soon as you've played.</p>`}</section>`; }).join("");
    return `<div class="hub rec">
      <div class="hub-top"><button type="button" class="btn small" data-hub="home">‹ Main menu</button><div><div class="eyebrow">Every mode, every career</div><h2 class="hub-h">Records room</h2></div></div>
      ${fresh.length ? `<p class="ref rec-new" role="status">Unlocked: ${fresh.map(x=>`<b>${esc(x.t)}</b>`).join(", ")} · +${fresh.reduce((s, x)=>s + COIN[x.tier], 0)} gold coins</p>` : ""}
      <div class="rec-sum"><div><span class="label">Achievements</span><b>${done}<small> / ${rows.length}</small></b></div><div><span class="label">Trophies</span><b>${F.p.tro + F.m.tro + F.d.tro}</b></div>
        <div><span class="label">Careers</span><b>${F.p.careers + F.m.careers + F.d.careers}</b></div><div><span class="label">Goals scored</span><b>${F.p.g.toLocaleString()}</b></div></div>
      <div class="rec-tabs" role="tablist">${[["ach", "Achievements"], ["rec", "All-time records"]].map(([k, l])=>`<button type="button" role="tab" aria-selected="${tab===k}" class="${tab===k ? "on" : ""}" data-hub="rectab" data-v="${k}">${l}</button>`).join("")}</div>
      ${tab==="rec" ? `${board}<div class="hub-more"><button type="button" class="btn small" data-hub="legacy">Player Legacy</button>${typeof Mgr!=="undefined" ? `<button type="button" class="btn small" data-hub="mhall">Managers' hall of fame</button>` : ""}</div>` : ach}
    </div>`;
  }
  return {html, check, got, merge(o){ if (!o || typeof o!=="object") return; const h = got(); Object.entries(o).forEach(([k, v])=>{ if (!h[k] || v<h[k]) h[k] = v; }); put(h); }};
})();
