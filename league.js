/* ================= THE LEAGUE, WEEK BY WEEK =================
   A season played in the match centre plays out your whole league, one round a week: every club meets every other
   home and away (and again in Scotland's 12-club league). Your matches come from the match centre; the rest are
   simulated from each club's strength, home advantage and form, and every club's XI (squads.js) gets the goals,
   assists and match ratings. So the table, the top scorers, the assists and the ratings all add up, and at the end of
   the season this table is the final one (lgFinalRows) instead of the season simulation's.
   Kept in S.lg = {s:season, L:{league key: {teams, G:games, r:rounds played, tab:{club:[P,W,D,L,GF,GA]},
   form:{club:"WDLWW"}, ps:{club:[[apps, goals, assists, rating total ×10] by place in the XI]}, me:[the same for you],
   meClub, last:{r, res:[[home, away, home goals, away goals]]}, prev:{club:position before the last round}}}}.
   Loaded before game.js; only called once the game is running. */
let lgTab = "table";

function lgGet(k){ const L = k!=null && S.lg && S.lg.s===seasonLabel(S.season) ? S.lg.L[k] || null : null; if (L && !L.mended) lgMend(L); return L; }
// a one-off repair for seasons played on version 1.18, when only matches against your club were counted in other
// clubs' players' numbers: each club's missing games are shared out across its XI from its goals in the table (who
// scored and set them up picked as in lgSide), so the charts match the fixtures played
function lgMend(L){
  L.mended = 1;
  L.teams.forEach(club=>{
    const t = L.tab[club]; if (!t || !t[0]) return;
    const ps = L.ps[club] ||= SQ_SLOTS.map(()=>[0,0,0,0]), miss = t[0] - Math.max(...ps.map(p=>p[0])); if (miss<=0) return;
    const xi = sqSquad(club), on = xi.map(()=>true), goals = Math.max(0, t[4] - ps.reduce((s,p)=>s + p[1], 0));
    ps.forEach(p=>{ const avg = p[0] ? p[3]/p[0] : 63; p[0] += miss; p[3] += Math.round(avg*miss); });
    for (let g=0; g<goals; g++){ const s = sqPick(xi, on, 0, -1); ps[s][1]++; if (Math.random()<.72) ps[sqPick(xi, on, 1, s)][2]++; }
  });
}
// a league this season, started if needed; a club that joins in January finds the first half already played
function lgEnsure(k){
  const T = TIERS[k]; if (!T || T.pool || !T.games) return null;
  const s = seasonLabel(S.season);
  if (!S.lg || S.lg.s!==s) S.lg = {s, L:{}};
  if (S.lg.L[k]) return S.lg.L[k];
  const teams = shuffle(S.world.tiers[k]), L = S.lg.L[k] = {teams, G:T.games, r:0, tab:{}, form:{}, ps:{}, me:[0,0,0,0], meClub:null, last:null, prev:null};
  teams.forEach(n=>{ L.tab[n] = [0,0,0,0,0,0]; L.form[n] = ""; });
  if (halfOf()===2){
    while (L.r < Math.floor(L.G/2)) lgRound(L, L.r);
    // a save from before the league was played out: its first-half results stand
    const rec = mcRecIf(S.club);
    if (rec && rec.lg.p && L.tab[S.club]){ const x = rec.lg; L.tab[S.club] = [x.p, x.w, x.d, x.l, x.gf, x.ga]; L.form[S.club] = (rec.form || []).slice(-5).join(""); }
  }
  return L;
}
// round R by the circle method: every n-1 rounds each club meets every other once, with home and away swapped the next time
function lgPairs(L, R){
  const ids = L.teams.map((_, i)=>i); if (ids.length%2) ids.push(-1);
  const n = ids.length, c = Math.floor(R/(n-1)), r = R%(n-1), rot = [ids[0], ...ids.slice(1).map((_, i)=>ids[1 + (i+r)%(n-1)])], out = [];
  for (let i=0;i<n/2;i++){
    let h = rot[i], a = rot[n-1-i];
    if ((i ? i : r)%2) [h, a] = [a, h];
    if (c%2) [h, a] = [a, h];
    if (h>=0 && a>=0) out.push([L.teams[h], L.teams[a]]);
  }
  return out;
}
function lgMatchOf(L, R, club){ const p = lgPairs(L, R).find(x=>x.includes(club)); return p ? {opp:p[0]===club ? p[1] : p[0], home:p[0]===club} : null; }
const lgPts = t => t[1]*3 + t[2];
function lgOrder(L){
  return L.teams.slice().sort((a,b)=>{ const x = L.tab[a], y = L.tab[b]; return lgPts(y)-lgPts(x) || (y[4]-y[5])-(x[4]-x[5]) || y[4]-x[4] || a.localeCompare(b); });
}
// a club's last five league results this season, from whichever league it's in
function lgFormList(club){
  const L = S.lg && S.lg.s===seasonLabel(S.season) ? Object.values(S.lg.L).find(x=>x.form[club]!=null) : null;
  return L ? L.form[club].split("") : [];
}
function lgCredit(L, club, list){
  const ps = L.ps[club] ||= SQ_SLOTS.map(()=>[0,0,0,0]);
  list.forEach((x,i)=>{ if (!x) return; const p = ps[i]; p[0]++; p[1] += x[0]; p[2] += x[1]; p[3] += Math.round(x[2]*10); });
}
// one side of a simulated match: its goals shared out across the XI (squads.js), and everyone's rating
function lgSide(L, club, gf, ga, oq){
  const xi = sqSquad(club), q = strOf(club), on = xi.map(()=>true), t = xi.map(()=>[0,0]);
  for (let k=0;k<gf;k++){ const s = sqPick(xi, on, 0, -1); t[s][0]++; if (Math.random()<.72) t[sqPick(xi, on, 1, s)][1]++; }
  lgCredit(L, club, xi.map((p,i)=>[t[i][0], t[i][1], sqRate(p.pos, q + p.r, oq, t[i][0], t[i][1], gf, ga)]));
}
function lgResult(L, club, gf, ga){
  const t = L.tab[club] ||= [0,0,0,0,0,0];
  t[0]++; t[gf>ga ? 1 : gf===ga ? 2 : 3]++; t[4] += gf; t[5] += ga;
  L.form[club] = ((L.form[club] || "") + (gf>ga ? "W" : gf===ga ? "D" : "L")).slice(-5);
}
// a round of matches, the same model as yours (mcXg): strength, home advantage and form decide the expected goals.
// `mine` is your match, already played: {h, a, hg, ag, club, det (sqMatch's numbers for both sides), me}
function lgRound(L, R, mine){
  const res = [], form = n => mcFormOf(lgFormList(n)).f;
  L.prev = Object.fromEntries(lgOrder(L).map((n,i)=>[n, i+1]));
  for (const [h, a] of lgPairs(L, R)){
    let hg, ag;
    if (mine && mine.h===h && mine.a===a){
      ({hg, ag} = mine);
      lgCredit(L, mine.club, mine.det[0]); lgCredit(L, mine.club===h ? a : h, mine.det[1]);
      const me = mine.me;
      if (me.mins){ const x = L.me; x[0]++; x[1] += me.g; x[2] += me.a; x[3] += Math.round(me.r*10); L.meClub = mine.club; }
    } else {
      const d = strOf(h) - strOf(a) + 1.5 + (form(h) - form(a))*.6;
      hg = mcPoisson(1.35*Math.exp(d/20)); ag = mcPoisson(1.35*Math.exp(-d/20));
      lgSide(L, h, hg, ag, strOf(a)); lgSide(L, a, ag, hg, strOf(h));
    }
    lgResult(L, h, hg, ag); lgResult(L, a, ag, hg);
    res.push([h, a, hg, ag]);
  }
  L.last = {r:R, res}; L.r = R+1;
}
// one of your league matches is over (mcResolve): the rest of its round is played around it
function lgOnResult(f, det){
  const L = lgGet(S.mc.lgk); if (!L || f.rd==null) return;
  while (L.r < f.rd) lgRound(L, L.r);
  if (L.r!==f.rd) return;
  const our = S.mc.club, [hg, ag] = f.home ? [f.res.gf, f.res.ga] : [f.res.ga, f.res.gf];
  lgRound(L, f.rd, {h:f.home ? our : f.opp, a:f.home ? f.opp : our, hg, ag, club:our, det, me:f.me});
}
// the end of a week (mcWeek): any round due by now that hasn't been played (a week your club has no league match) is
function lgWeekDone(M){
  const L = lgGet(M.lgk); if (!L || !M.lgr) return;
  const [R0, R1] = M.lgr, upTo = R0 + Math.min(R1-R0, Math.ceil((M.wi+1)*(R1-R0)/M.weeks.length));
  while (L.r < upTo) lgRound(L, L.r);
}
// the season's over: rounds nobody played (a league you left in January) are simulated, and this is the final table
function lgFinalRows(k){
  const L = lgGet(k); if (!L) return null;
  while (L.r < L.G) lgRound(L, L.r);
  return lgOrder(L).map((n,i)=>{ const t = L.tab[n]; return {n, pts:lgPts(t), gd:t[4]-t[5], pos:i+1}; });
}
function lgPosOf(club){ const L = lgGet(S.mc && S.mc.lgk); return L && L.r ? lgOrder(L).indexOf(club) + 1 : 0; }

/* ---------- top scorers, assists and ratings ---------- */
function lgPlayers(L){
  const out = [];
  L.teams.forEach(club=>{ const ps = L.ps[club]; if (ps) sqSquad(club).forEach((p,i)=>{ const x = ps[i]; if (x && x[0]) out.push({name:p.name, pos:p.pos, age:p.age, club, i, apps:x[0], g:x[1], a:x[2], avg:x[3]/10/x[0]}); }); });
  const m = L.me; if (m[0]) out.push({name:S.player.name, pos:S.player.pos, age:S.age, club:L.meClub || S.club, me:true, apps:m[0], g:m[1], a:m[2], avg:m[3]/10/m[0]});
  return out;
}
// the leaders in goals (g), assists (a) or average rating (avg; regular starters only), with shared ranks
function lgLeaders(L, k){
  const min = Math.max(3, Math.round(L.r*.4)), v = p => k==="avg" ? Math.round(p.avg*100) : p[k];
  const list = lgPlayers(L).filter(p=>k==="avg" ? p.apps>=min : p[k]>0).sort((x,y)=>v(y)-v(x) || x.apps-y.apps || y.avg-x.avg);
  list.forEach((p,i)=>{ p.rank = i && v(list[i-1])===v(p) ? list[i-1].rank : i+1; });
  return list;
}
// for the season's awards: are you the league's leader (or joint leader) in goals or assists?
function lgTop(L, k){ const m = L.me[k==="g" ? 1 : 2]; return m>0 && lgPlayers(L).every(p=>p.me || p[k]<=m); }
// the season's awards, from the league's average ratings: Player of the Season (over 60% of the games), Young Player of
// the Season (23 and under, half the games) and the Team of the Season (the best keeper, four defenders, three
// midfielders and three forwards with half the games)
const lgGroup = pos => pos==="GK" ? "gk" : ["CB","LB","RB"].includes(pos) ? "def" : ["CDM","CM","CAM"].includes(pos) ? "mid" : "fwd";
function lgAwards(L){
  const all = lgPlayers(L), by = (share, ok=()=>true) => all.filter(p=>p.apps>=Math.round(L.G*share) && ok(p)).sort((x,y)=>y.avg-x.avg);
  const tots = Object.entries({gk:1, def:4, mid:3, fwd:3}).flatMap(([g,n])=>by(.5, p=>lgGroup(p.pos)===g).slice(0, n));
  return {pots:by(.6)[0], ypots:by(.5, p=>p.age<=23)[0], tots};
}
function lgSeasonNote(L, k){
  const g = lgLeaders(L, "g")[0], a = lgLeaders(L, "a")[0], r = lgLeaders(L, "avg")[0], mine = x => lgLeaders(L, x).find(p=>p.me);
  if (!g) return;
  const who = p => p.me ? "you" : `${p.name} (${p.club})`, you = ["g","a"].map(mine);
  const aw = lgAwards(L), inTots = aw.tots.some(p=>p.me);
  note("info", `${TIERS[k].short}: the season's best`, `Golden Boot: ${who(g)} with ${g.g} goals. Most assists: ${a ? `${who(a)} with ${a.a}` : "nobody"}.`
    + `${aw.pots ? ` Player of the Season: ${who(aw.pots)}, averaging ${aw.pots.avg.toFixed(2)}.` : r ? ` Best average rating: ${who(r)}, ${r.avg.toFixed(2)}.` : ""}`
    + `${you[0] || you[1] ? ` You finished ${[you[0] ? `${ord(you[0].rank)} in the scoring charts` : "", you[1] ? `${ord(you[1].rank)} for assists` : ""].filter(Boolean).join(" and ")}.` : ""}${inTots ? " You made the Team of the Season." : ""}`);
}

/* ---------- the table and the leaderboards ---------- */
function lgLegend(k){
  return `<div class="legend">${isTop(k) ? `<span><i class="z-ucl"></i>Champions League</span><span><i class="z-uel"></i>Europa League</span><span><i class="z-uecl"></i>Conference League</span>` : `<span><i class="z-up"></i>Promotion</span><span><i class="z-po"></i>Play-offs</span>`}<span><i class="z-rel"></i>Relegation</span></div>`;
}
// the table, or (mini) five rows around your club; ▲▼ show who moved in the last round
function lgTableHTML(L, k, mini){
  const order = lgOrder(L), n = order.length, at = order.indexOf(S.club), from = clamp(at-2, 0, Math.max(0, n-5));
  const rows = order.map((c,i)=>[c,i]).slice(mini ? from : 0, mini ? from+5 : n);
  const sw = c => clubBadge(c, 18);
  return `<div class="tablewrap"><table class="lt lg-t${mini ? " mini" : ""}"><thead><tr><th></th><th class="n">#</th><th>Club</th><th class="n">P</th>${mini ? "" : `<th class="n">W</th><th class="n">D</th><th class="n">L</th>`}<th class="n">GD</th><th class="n">Pts</th>${mini ? "" : `<th class="lg-fc">Form</th>`}</tr></thead><tbody>
    ${rows.map(([c,i])=>{ const t = L.tab[c], gd = t[4]-t[5], mv = L.prev && L.prev[c] ? L.prev[c]-(i+1) : 0;
      return `<tr class="${c===S.club ? "me" : ""}"><td class="z ${zoneOf(k, i+1, n)}"></td><td class="n">${i+1}</td>
        <td><span class="lg-club">${sw(c)}<span class="lg-cn">${esc(c)}</span>${mv ? `<i class="lg-mv ${mv>0 ? "up" : "down"}" aria-label="${mv>0 ? "Up" : "Down"} ${Math.abs(mv)}">${mv>0 ? "▲" : "▼"}</i>` : ""}</span></td>
        <td class="n">${t[0]}</td>${mini ? "" : `<td class="n">${t[1]}</td><td class="n">${t[2]}</td><td class="n">${t[3]}</td>`}<td class="n">${gd>0 ? "+" : ""}${gd}</td><td class="n"><b>${lgPts(t)}</b></td>
        ${mini ? "" : `<td class="lg-fc">${L.form[c].split("").map(x=>`<span class="tf sm ${x.toLowerCase()}">${x}</span>`).join("")}</td>`}</tr>`; }).join("")}
  </tbody></table></div>`;
}
function lgLeadersHTML(L, k){
  const list = lgLeaders(L, k), mine = list.findIndex(p=>p.me), min = Math.max(3, Math.round(L.r*.4));
  const row = p => `<li class="${p.me ? "me" : ""}" data-pl="${esc(p.me ? "me" : `${p.club}|${p.i}`)}" tabindex="0" role="button" aria-label="Open ${esc(p.name)}'s card"><span class="lg-rk">${p.rank}</span>${clubBadge(p.club, 22)}
    <span class="lg-who"><b class="${p.me ? "me-name" : ""}">${esc(p.name)}</b><small>${esc(p.club)} · ${p.pos} · ${p.apps} game${p.apps===1 ? "" : "s"}</small></span><span class="lg-v">${k==="avg" ? p.avg.toFixed(2) : p[k]}</span></li>`;
  if (!list.length) return `<p class="empty">${k==="avg" ? `Ratings show once players have ${min} games.` : "Nobody yet."}</p>`;
  return `<ol class="lg-lead">${list.slice(0, 10).map(row).join("")}${mine>=10 ? `<li class="lg-gap" aria-hidden="true">⋯</li>${row(list[mine])}` : ""}</ol>
    ${k==="avg" ? `<p class="hint" style="margin-top:8px">Average match rating, for players with at least ${min} games.</p>` : ""}`;
}
function lgResultsHTML(L){
  if (!L.last) return `<p class="empty">No results yet.</p>`;
  return `<p class="label" style="margin:0 0 6px">Matchweek ${L.last.r+1}</p><ul class="lg-res">${L.last.res.map(([h,a,hg,ag])=>`<li class="${h===S.club || a===S.club ? "me" : ""}"><span>${clubBadge(h, 16)} ${esc(h)}</span><b>${hg}–${ag}</b><span>${esc(a)} ${clubBadge(a, 16)}</span></li>`).join("")}</ul>`;
}
// the table with tabs for the leaderboards and the latest results; "final" leaves the table out (it's shown above it)
function lgBox(k, mode){
  const L = lgGet(k); if (!L) return "";
  const tabs = [...(mode==="final" ? [] : [["table","Table"]]), ["g","Scorers"], ["a","Assists"], ["avg","Ratings"], ...(mode==="final" || !L.last ? [] : [["res","Results"]])];
  const cur = tabs.some(t=>t[0]===lgTab) ? lgTab : tabs[0][0];
  const body = cur==="table" ? lgTableHTML(L, k) + lgLegend(k) : cur==="res" ? lgResultsHTML(L) : lgLeadersHTML(L, cur);
  return `<div class="lg-box" data-k="${k}" data-mode="${mode}"><div class="lg-tabs" role="group" aria-label="Show">${tabs.map(([v,l])=>`<button type="button" data-lgtab="${v}" aria-pressed="${v===cur}">${l}</button>`).join("")}</div>${body}</div>`;
}
document.addEventListener("click", e=>{
  const b = e.target.closest && e.target.closest("[data-lgtab]"), box = b && b.closest(".lg-box"); if (!box) return;
  lgTab = b.dataset.lgtab;
  const tmp = document.createElement("div"); tmp.innerHTML = lgBox(keyOf(box.dataset.k), box.dataset.mode);
  const next = tmp.firstElementChild; box.replaceWith(next);
  next.querySelector(`[data-lgtab="${lgTab}"]`)?.focus({preventScroll:true});
});
// the match centre's league view: where you are, then the table and the leaderboards
function lgPanel(){
  const k = S.mc.lgk, L = lgGet(k); if (!L) return "";
  const order = lgOrder(L), at = order.indexOf(S.club), t = L.tab[S.club], g = lgLeaders(L, "g"), top = g[0], me = g.find(p=>p.me);
  return `<p class="hint" style="margin-bottom:10px">${esc(TIERS[k].name)}${L.r ? `, matchweek ${L.r}` : ""}.${at>=0 && t[0] ? ` You're ${ord(at+1)} with ${lgPts(t)} point${lgPts(t)===1 ? "" : "s"} from ${t[0]} game${t[0]===1 ? "" : "s"}.` : ""}${top ? ` Top scorer: ${top.me ? "you" : `${esc(top.name)} (${esc(top.club)})`}, ${top.g}.` : ""}${me && !top.me ? ` You're ${ord(me.rank)} with ${me.g}.` : ""}</p>
    ${lgBox(k, "panel")}`;
}
// the full-time screen's look at the table after a league match, with a button for the rest
function lgFullTime(f){
  const L = f.code==="league" ? lgGet(S.mc.lgk) : null; if (!L) return "";
  return `<div class="lg-ft"><div class="lv-eye">${esc(TIERS[S.mc.lgk].name)} · matchweek ${L.r}</div>${lgTableHTML(L, S.mc.lgk, true)}
    <button type="button" class="btn" data-lv="table">Full table and top scorers</button></div>`;
}

/* ---------- the roll of honour ---------- */
// each season's champions in every league, and where the league was played out week by week its Golden Boot and
// Player of the Season, and the English cups' winners when they were played out (cups.js): S.honours = [{s, ch:{league
// key: champions}, lb:{league key: [[name, club, goals, you?, born], [name, club, average rating, you?, born]]},
// cp:{cup code: winners}}], the latest 40 seasons
function lgHonours(sim){
  const row = {s:sim.season, ch:{}}, who = p => p.me ? S.player.name : p.name, born = p => p.me ? null : S.season - p.age;
  LEAGUES.forEach(k=>{ const tb = sim.tables[k]; if (tb && tb[0]) row.ch[k] = tb[0].n; });
  if (S.cups && S.cups.s===sim.season && !S.cups.off) Object.entries(S.cups.C).forEach(([k, C])=>{ if (C && C.win) (row.cp ||= {})[k] = C.win; });
  if (S.lg && S.lg.s===sim.season) Object.entries(S.lg.L).forEach(([k, L])=>{
    if (L.r < L.G) return;
    const g = lgLeaders(L, "g")[0], p = lgAwards(L).pots;
    (row.lb ||= {})[k] = [g ? [who(g), g.club, g.g, !!g.me, born(g)] : null, p ? [who(p), p.club, +p.avg.toFixed(2), !!p.me, born(p)] : null];
  });
  const H = S.honours ||= []; if (H.length && H[H.length-1].s===row.s) H.pop();
  H.push(row); if (H.length>40) H.splice(0, H.length-40);
}
function lgHonoursHTML(k){
  const H = (S.honours || []).filter(h=>h.ch[k]).reverse(); if (!H.length) return "";
  const line = (l, x, v) => x ? `<small class="${x[3] ? "me" : ""}">${l}: ${esc(x[0])} (${esc(x[1])}), ${v(x[2])}</small>` : "";
  return `<details class="panel ss-panel"><summary><h2>Roll of honour</h2></summary>
    <ol class="lg-hon">${H.map(h=>{ const lb = h.lb && h.lb[k];
      const cups = h.cp && TIERS[k].country==="England" ? ["fa", "lc", ...(k===3 || k===4 ? ["eflt"] : k===5 ? ["fat"] : [])].filter(c=>h.cp[c]) : [];
      return `<li class="${h.ch[k]===S.club ? "me" : ""}"><span class="label">${esc(h.s)}</span><span class="lg-hon-c">${clubBadge(h.ch[k], 18)}<b>${esc(h.ch[k])}</b></span>
        ${lb ? line("Golden Boot", lb[0], g=>`${g} goal${g===1 ? "" : "s"}`) + line("Player of the Season", lb[1], r=>r.toFixed(2)) : ""}
        ${cups.length ? `<small>${cups.map(c=>`${CP_NAMES[c]}: ${esc(h.cp[c])}`).join(" · ")}</small>` : ""}</li>`; }).join("")}</ol>
    <p class="hint" style="margin-top:8px">Champions every season of your career. The Golden Boot and Player of the Season are there for seasons when you played in this league.</p>
  </details>`;
}
