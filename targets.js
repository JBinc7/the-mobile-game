/* ================= TARGETS AND CLAUSES =================
   Each match-centre season starts with the manager's targets (appearances, an output target that suits your
   position, and an average rating) and your agent's clauses: hit a stretch number and a bigger club bids in the
   summer, or play enough games and your wage goes up. Targets are judged at the end of the season (pro rata for
   time out injured): every one met wins the manager's trust, every one missed costs some. A January move brings
   new half-season targets from the new manager; the bid clause follows you, the pay clause stays with the club.
   S.tg holds the season's targets; mcBuild sets them, mcFinishHalf checks in halfway and finishSeason settles them. */
const TG_LABEL = {apps:"Appearances", g:"Goals", ga:"Goals and assists", a:"Assists", cs:"Clean sheets", avg:"Average rating"};
const tgS = n => n===1 ? "" : "s";
const TG_VERB = {apps:n=>`Make ${n} appearance${tgS(n)}`, g:n=>`Score ${n} goal${tgS(n)}`, ga:n=>`Get ${n} goal${n===1?" or assist":"s and assists"}`, a:n=>`Set up ${n} goal${tgS(n)}`, cs:n=>`Keep ${n} clean sheet${tgS(n)}`, avg:n=>`Average a ${n.toFixed(1)} rating`};
function tgOutputKey(pos){ return ["ST","LW","RW","CAM"].includes(pos) ? "g" : ["CM","CDM"].includes(pos) ? "ga" : ["LB","RB"].includes(pos) ? "a" : "cs"; }
function tgNice(n){ return n>=20 ? Math.round(n/5)*5 : Math.max(1, Math.round(n)); }

// totals from the match centre: this half's fixtures, plus the first half when it was at the same club (club) or anywhere (whole season)
function tgHalfTotals(){
  const t = {apps:0, g:0, a:0, cs:0, rSum:0, rN:0, club:S.mc && S.mc.club};
  if (!S.mc || !S.mc.key.startsWith(seasonLabel(S.season)+"|")) return t;
  S.mc.weeks.forEach(w=>w.fx.forEach(f=>{ if (!f.me || !f.me.mins || !f.res) return; t.apps++; t.g += f.me.g; t.a += f.me.a; if (f.me.cs) t.cs++; t.rSum += f.me.r; t.rN++; }));
  return t;
}
function tgTotals(club){
  const T = S.tg, now = tgHalfTotals(), out = {apps:0, g:0, a:0, cs:0, rSum:0, rN:0};
  const parts = [halfOf()===2 && T.h1 ? T.h1 : null, now].filter(x=>x && (!club || x.club===club));
  parts.forEach(p=>{ for (const k in out) out[k] += p[k]; });
  return {...out, ga:out.g+out.a, avg: out.rN ? out.rSum/out.rN : 0};
}
// injured time doesn't count against you
function tgNeed(it){ if (it.k==="avg") return it.n; const av = availability(); return av>=.999 ? it.n : Math.max(1, Math.round(it.n*av)); }
const tgMet = (it, tot) => it.k==="avg" ? tot.rN>=3 && tot.avg>=it.n : tot[it.k]>=tgNeed(it);

// what a manager can fairly ask: games from how often you'd start, output from your share of the team's goals
function tgMake(scale){
  const club = S.club, t = tierOf(club), T = TIERS[t], pos = S.player.pos, a = mcA(), w = mcWeights(), base = strOf(club);
  const league = S.world.tiers[t], avg = league.reduce((s,n)=>s + strOf(n), 0)/league.length;
  // the team's games: the league, about three per cup and ten in Europe
  const games = compPlan(club).reduce((s,c)=>s + (c.code==="league" ? (T.games || 38) : c.eu ? 10 : 3), 0)*scale, p = mcStartChance();
  const apps = tgNice(games*(p + .55*(1-p))*.95);
  const lf = 1.35*Math.exp((base-avg)/20), la = 1.35*Math.exp((avg-base)/20), damp = mcDamp(lf);
  const skill = k => clamp(1 + (a[k] - (base + 30*(w[k]-.2)))/20, .5, 1.6), [gs, as] = MC_SHARE[pos] || MC_SHARE.CM;
  const gpa = lf*gs*damp*skill("fin")*.85, apa = lf*as*damp*skill("pas")*.85;
  const k = tgOutputKey(pos);
  const out = k==="g" ? apps*gpa : k==="ga" ? apps*(gpa+apa) : k==="a" ? apps*apa : apps*.85*Math.exp(-la);
  const rating = +clamp(6.6 + (mcOvr()-base)*.05, 6.4, 7.4).toFixed(1);
  return [{k:"apps", n:apps}, {k, n:Math.max(1, Math.round(out*1.1))}, {k:"avg", n:rating}];
}
// a club a step up, near enough to your level to be believable
function tgSuitor(){
  const base = strOf(S.club), mine = standing(S.club), cands = [];
  LEAGUES.forEach(t=>S.world.tiers[t].forEach(c=>{ if (c!==S.club && !meta(c).custom && standing(c)>mine*1.12 && strOf(c)>=base+2 && strOf(c)<=base+14) cands.push(c); }));
  if (!cands.length) LEAGUES.forEach(t=>S.world.tiers[t].forEach(c=>{ if (c!==S.club && !meta(c).custom && strOf(c)>=base-2 && TIERS[t].pr>=.8) cands.push(c); }));
  if (!cands.length) return null;
  // clubs in your own country first
  const home = TIERS[tierOf(S.club)].country, fit = c => Math.abs(strOf(c)-base-7) + (TIERS[tierOf(c)].country===home ? 0 : 4);
  return pick(cands.sort((x,y)=>fit(x)-fit(y)).slice(0,4));
}
function tgClauseText(c){ return c.k==="bid" ? `${TG_VERB[c.m](c.n)} this season and ${c.club} will bid for you` : `${TG_VERB.apps(c.n)} and your wage at ${c.club} rises ${c.pct}%`; }
function tgEnsure(){
  const s = seasonLabel(S.season), half = halfOf();
  if (S.tg && S.tg.s===s && S.tg.club===S.club) return;
  const items = tgMake(half===1 ? 1 : .5), M = mgr(), fresh = !S.tg || S.tg.s!==s;
  let clauses = fresh ? [] : S.tg.clauses.filter(c=>c.k==="bid");   // a January move: the bid clause follows you, the pay clause doesn't
  if (fresh && half===1){
    const out = items[1], suitor = tgSuitor();
    if (suitor) clauses.push({k:"bid", m:out.k, n:Math.max(out.n+2, Math.ceil(out.n*1.35)), club:suitor});
    if (!S.loan && S.years>0) clauses.push({k:"pay", m:"apps", n:tgNice(items[0].n*1.1 + 1), pct:pick([15,20,25]), club:S.club});
  }
  S.tg = {s, club:S.club, half, items, clauses, h1:fresh ? null : S.tg.h1, done:false};
  note("club", fresh ? `${s} targets from ${M.name}` : `New targets at ${S.club}`,
    `${M.name} wants: ${items.map(it=>TG_VERB[it.k](it.n).toLowerCase()).join(", ")}${half===2 ? " between now and May" : " this season"}. Hit them and you'll earn his trust; miss them and you'll lose some.`
    + (fresh && clauses.length ? ` Your agent has negotiated: ${clauses.map(c=>tgClauseText(c).replace(/^./, x=>x.toLowerCase())).join("; and ")}.` : ""));
}
// halfway: remember the first half and tell you how you're doing
function tgHalfway(){
  if (halfOf()!==1 || !S.tg || S.tg.s!==seasonLabel(S.season)) return;
  S.tg.h1 = tgHalfTotals();
  if (S.tg.half!==1) return;
  const tot = tgTotals(S.tg.club), on = S.tg.items.filter(it=>it.k==="avg" ? tot.avg>=it.n : tot[it.k]>=tgNeed(it)/2);
  note(on.length===S.tg.items.length ? "good" : on.length ? "info" : "warn", "Halfway: how your targets look",
    `${on.length} of ${S.tg.items.length} targets on track. ${S.tg.items.map(it=>`${TG_LABEL[it.k]}: ${it.k==="avg" ? (tot.rN ? tot.avg.toFixed(2) : "–") : tot[it.k]} of ${it.k==="avg" ? it.n.toFixed(1) : tgNeed(it)}`).join(". ")}.`);
}
// season end: settle targets (manager trust) and clauses (pay rise now, bid in the summer window); returns the bidding club
function tgSeasonEnd(){
  const T = S.tg; if (!T || T.s!==seasonLabel(S.season) || T.done || seasonMode()!=="centre") return null;
  T.done = true;
  const tot = tgTotals(T.club), all = tgTotals(null), here = S.club===T.club, M = mgr(T.club);
  const met = T.items.filter(it=>tgMet(it, tot));
  let d = 0; T.items.forEach(it=>{ if (tgMet(it, tot)) d += 3; else d -= (it.k!=="avg" && tot[it.k] < tgNeed(it)*.6) ? 6 : 3; });
  if (met.length===T.items.length){ d += 3; if (here) addLoyalty(S.club, 3, "You hit every target the manager set."); }
  if (here) M.trust = clamp(M.trust + d, 5, 100);
  const line = it => `${TG_LABEL[it.k]} ${it.k==="avg" ? (tot.rN ? tot.avg.toFixed(2) : "–") : tot[it.k]}/${it.k==="avg" ? it.n.toFixed(1) : tgNeed(it)} ${tgMet(it, tot) ? "✓" : "✗"}`;
  note(met.length===T.items.length ? "good" : met.length>=2 ? "info" : "warn", `Targets: ${met.length} of ${T.items.length} met`,
    `${T.items.map(line).join(". ")}. ${!here ? "" : met.length===T.items.length ? `${M.name} is delighted.` : met.length ? `${M.name} wanted more.` : `${M.name} is losing patience.`}`);
  let bid = null;
  T.clauses.forEach(c=>{
    const ok = c.m==="avg" ? all.rN>=3 && all.avg>=c.n : all[c.m]>=c.n;
    if (c.k==="pay"){
      if (!ok || S.club!==c.club) return;
      const before = S.wage; S.wage = roundWage(S.wage*(1 + c.pct/100));
      S.log.push({season:T.s, text:`Appearance clause: wage up ${c.pct}% to ${wageTxt(S.wage)}`, fee:null});
      note("good", "Your wage has gone up", `You made ${all.apps} appearances, so the clause your agent negotiated kicks in: ${wageTxt(before)} → ${wageTxt(S.wage)}.`);
    } else if (ok && c.club!==S.club){
      bid = c.club;
      note("good", `${c.club} are coming in for you`, `${TG_VERB[c.m](c.n)}: done (${c.m==="avg" ? all.avg.toFixed(2) : all[c.m]}). Your agent's clause has been triggered, so ${c.club} will bid this summer.`);
    } else if (!ok) note("info", `${c.club} have cooled`, `You needed ${c.m==="avg" ? c.n.toFixed(1) : c.n} ${TG_LABEL[c.m].toLowerCase()} for ${c.club} to bid and finished on ${c.m==="avg" ? (all.rN ? all.avg.toFixed(2) : "–") : all[c.m]}.`);
  });
  return bid;
}
// the targets box in the match centre
function tgPanel(){
  const T = S.tg; if (!T || T.s!==seasonLabel(S.season)) return "";
  const tot = tgTotals(T.club), all = tgTotals(null);
  const row = (label, have, need, isAvg, ok) => `<div class="tg ${ok?"ok":""}"><span>${label}</span><div class="meter"><span style="width:${clamp(need ? have/need*100 : 0, 0, 100).toFixed(0)}%"></span></div><b>${isAvg ? (have ? have.toFixed(2) : "–") : have}<small>/${isAvg ? need.toFixed(1) : need}</small>${ok ? " ✓" : ""}</b></div>`;
  return `<h3>${esc(mgr(T.club).name)}'s targets${T.half===2 ? " (January to May)" : ""}</h3>
    <div class="tgl">${T.items.map(it=>row(TG_LABEL[it.k], it.k==="avg" ? tot.avg : tot[it.k], tgNeed(it), it.k==="avg", tgMet(it, tot))).join("")}</div>
    ${T.clauses.length ? `<h3>Your agent's clauses</h3><div class="tgl">${T.clauses.map(c=>{ const have = c.m==="avg" ? all.avg : all[c.m], ok = c.m==="avg" ? all.rN>=3 && all.avg>=c.n : have>=c.n;
      return `<div class="tg clause ${ok?"ok":""}"><span>${esc(tgClauseText(c))}</span><div class="meter trust"><span style="width:${clamp(have/c.n*100, 0, 100).toFixed(0)}%"></span></div><b>${c.m==="avg" ? (have ? have.toFixed(2) : "–") : have}<small>/${c.m==="avg" ? c.n.toFixed(1) : c.n}</small>${ok ? " ✓" : ""}</b></div>`; }).join("")}</div>` : ""}
    <p class="hint" style="margin-top:6px">Targets count games for ${esc(T.club)}; clauses count the whole season.${availability()<.999 ? " Targets are cut to allow for time out injured." : ""}</p>`;
}
