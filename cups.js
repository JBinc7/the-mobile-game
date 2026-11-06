/* ================= THE CUPS, ROUND BY ROUND =================
   In a match centre season the English cups are played out in full: the FA Cup, the League Cup, the EFL Trophy and
   the FA Trophy. Each round is a real draw among the clubs still in it and the clubs that join at that round; your
   opponent comes from that draw, the other ties are simulated with the league's model (and scorers from each club's
   XI, squads.js), and the cup carries on after you're out until somebody lifts it. Where the numbers don't divide,
   some clubs get a bye in an early round (never you), so every round from the last club's entry on is full. The EFL
   Trophy's group stage isn't played out: you play your three group games as before, and the 32 who go through are
   you (if you do) and the strongest of the rest, give or take.
   Kept in S.cups = {s:season, off (a season that began before the cups were played out), C:{code: {r:next round,
   plan:[clubs through after each round], early (League Cup: clubs in Europe brought forward a round), al:[clubs through,
   before the next round's entrants], res:[[tie] by round], cur:{i, ties, bye, mine} (a round drawn with your tie to
   play), sc:{"club|place":[goals, assists]}, me:[games, goals, assists], grp (the EFL Trophy's 32), win}}}. A tie is [home, away, home goals,
   away goals, penalties won by (0 nobody, 1 home, 2 away)], over both legs of a two-legged tie.
   Loaded before game.js; only called once the game is running. */
const CP_ROUNDS = {
  fa:["4th Qualifying Round","1st Round","2nd Round","3rd Round","4th Round","5th Round","Quarter-final","Semi-final","Final"],
  lc:["1st Round","2nd Round","3rd Round","4th Round","Quarter-final","Semi-final","Final"],
  eflt:["Group stage","Round of 32","Round of 16","Quarter-final","Semi-final","Final"],
  fat:["3rd Round","4th Round","5th Round","Quarter-final","Semi-final","Final"]
};
const CP_NAMES = {fa:"FA Cup", lc:"League Cup", eflt:"EFL Trophy", fat:"FA Trophy"};
const cpLegs = (k, i) => k==="lc" && i===5 ? 2 : 1;
const cpWinner = t => t[2]>t[3] || (t[2]===t[3] && t[4]===1) ? t[0] : t[1];
const cpOther = (t, club) => t[0]===club ? t[1] : t[0];

// the clubs joining at round i: the non-league clubs first, the Football League next, the Premier League last (and in
// the League Cup, its clubs in Europe a round later, except the `early` ones when the numbers need it)
function cpEntrants(k, i, early = []){
  const T = t => S.world.tiers[t] || [];
  if (k==="fa") return i===0 ? [...T(5), ...T(6)] : i===1 ? [...T(3), ...T(4)] : i===3 ? [...T(1), ...T(2)] : [];
  if (k==="lc"){
    const eu = n => S.world.europe[n] && !early.includes(n);
    return i===0 ? [...T(2), ...T(3), ...T(4)] : i===1 ? T(1).filter(n=>!eu(n)) : i===2 ? T(1).filter(eu) : [];
  }
  if (k==="eflt") return i===0 ? [...T(3), ...T(4)] : [];
  if (k==="fat") return i===0 ? [...T(5), ...T(6)] : [];
  return [];
}
// how many go through each round, from how many join each round (E): full rounds up to the last entry round, then
// one round with just enough byes for the next to be full, then halving to the final. null if it can't be done.
function cpPlan(E){
  const n = E.length, caps = []; caps[n-1] = 2;
  for (let j=n-2;j>=0;j--) caps[j] = 2*(caps[j+1] - E[j+1]);
  const J = E.reduce((m,e,j)=>e ? j : m, 0);
  const tryP = P => {
    const S = []; let N = 0;
    for (let j=0;j<n;j++){
      N += E[j];
      if (j>=P && N!==caps[j]) return null;
      const s = j===P-1 ? caps[P] - E[P] : Math.ceil(N/2);
      if (s<Math.ceil(N/2) || s>N) return null;
      S.push(s); N = s;
    }
    return N===1 ? S : null;
  };
  for (let P=J;P>=0;P--){ const S = tryP(P); if (S) return S; }
  for (let P=J+1;P<n;P++){ const S = tryP(P); if (S) return S; }
  return null;
}
function cpNew(k){
  const E = early => CP_ROUNDS[k].map((_, i)=>cpEntrants(k, i, early).length);
  if (k==="eflt") return {r:0, plan:[32, 16, 8, 4, 2, 1], al:[], res:[], cur:null, sc:{}, me:[0,0,0], win:null};
  // the League Cup's weakest clubs in Europe (never yours) come in a round early if that's what it takes
  const you = S.mc && S.mc.club, eu = (S.world.tiers[1] || []).filter(n=>S.world.europe[n] && n!==you).sort((a,b)=>strOf(a)-strOf(b));
  let m = 0, plan = cpPlan(E([]));
  while (!plan && k==="lc" && m<eu.length) plan = cpPlan(E(eu.slice(0, ++m)));
  return plan ? {r:0, plan, early:eu.slice(0, k==="lc" ? m : 0), al:[], res:[], cur:null, sc:{}, me:[0,0,0], win:null} : null;
}
// this season's cup, started when first needed in the match centre (make); null when it isn't played out. Whether a
// season's cups are played out is settled the first time: not when you start it abroad (a move to England in January
// keeps the old draws to the end), nor in a season begun before this version with cup games already played
const cpEnglish = () => TIERS[tierOf(S.mc ? S.mc.club : S.club)].country==="England";
function cpGet(k, make){
  const s = seasonLabel(S.season);
  if (!S.cups || S.cups.s!==s){
    if (!make) return null;
    const recs = S.mcRec && S.mcRec.s===s ? Object.values(S.mcRec.clubs) : [];
    S.cups = {s, off:!cpEnglish() || recs.some(r=>Object.values(r.cups || {}).some(x=>x.games)), C:{}};
  }
  if (S.cups.off || !CP_ROUNDS[k] || (!(k in S.cups.C) && !cpEnglish())) return null;
  if (!(k in S.cups.C) && make) S.cups.C[k] = cpNew(k);
  return S.cups.C[k] || null;
}

/* ---------- playing a round ---------- */
function cpCredit(C, club, i, k, n = 1){ const x = C.sc[`${club}|${i}`] ||= [0, 0]; x[k] += n; }
// one side's goals shared out across its XI
function cpSide(C, club, gf){
  const xi = sqSquad(club), on = xi.map(()=>true);
  for (let g=0;g<gf;g++){ const s = sqPick(xi, on, 0, -1); cpCredit(C, club, s, 0); if (Math.random()<.72) cpCredit(C, club, sqPick(xi, on, 1, s), 1); }
}
// a tie between two other clubs: home advantage except in the final, over two legs where the round has them, and
// penalties if it's level
function cpTie(C, k, i, h, a){
  const neutral = CP_ROUNDS[k][i]==="Final"; let hg = 0, ag = 0;
  for (let l=0;l<cpLegs(k, i);l++){
    // as mcXg: the gap counts up to 20, and before the semi-finals a much stronger side rests players
    const [x, y] = l ? [a, h] : [h, a], g = strOf(x) - strOf(y), rot = i < CP_ROUNDS[k].length - 2 ? (g >= 6 ? -3 : g <= -6 ? 3 : 0) : 0;
    const d = clamp(g, -20, 20) + rot + (neutral ? 0 : 1.5);
    const xg = mcPoisson(1.35*Math.exp(d/20)), yg = mcPoisson(1.35*Math.exp(-d/20));
    cpSide(C, x, xg); cpSide(C, y, yg);
    if (l){ hg += yg; ag += xg; } else { hg += xg; ag += yg; }
  }
  return [h, a, hg, ag, hg!==ag ? 0 : Math.random()<logistic((strOf(h) - strOf(a))/12) ? 1 : 2];
}
function cpClose(C, k, i, ties, bye){
  C.res[i] = ties; C.al = [...ties.map(cpWinner), ...bye]; C.r = i + 1; C.cur = null;
  if (C.r>=CP_ROUNDS[k].length){
    // the numbers should always end in a final; if they didn't, the last ones standing play it off
    while (C.al.length>1){ const t = cpTie(C, k, i, C.al[0], C.al[1]); C.al.splice(0, 2, cpWinner(t)); }
    C.win = C.al[0] || null;
  }
}
// the EFL Trophy's 32 from its group stage: you if you went through, then the rest weighted towards the strongest
function cpGroups(pool){
  const you = S.mc && S.mc.club, r = you && pool.includes(you) ? ((mcRecIf(you) || {cups:{}}).cups || {}).eflt : null;
  const rest = pool.filter(c=>!(r && c===you)).map(c=>({c, w:-Math.log(Math.random())/Math.exp(strOf(c)/6)})).sort((a,b)=>a.w-b.w).map(x=>x.c);
  return [...(r && r.next>=1 ? [you] : []), ...rest].slice(0, 32);
}
// round i: the draw, then every tie except yours when `mine` (your club) is about to play it
function cpRound(C, k, i, mine){
  if (C.r!==i || C.cur || C.win) return;
  const pool = shuffle([...new Set([...C.al, ...cpEntrants(k, i, C.early)])]);
  if (k==="eflt" && i===0){ C.grp = cpGroups(pool); cpClose(C, k, 0, [], C.grp); return; }
  const n = pool.length, K = clamp(n - C.plan[i], 0, Math.floor(n/2)), bye = [], play = [];
  pool.forEach(c=>{ if (bye.length < n - 2*K && c!==mine) bye.push(c); else play.push(c); });
  const ties = []; let mt = null;
  for (let j=0;j+1<play.length;j+=2){ const h = play[j], a = play[j+1]; if (h===mine || a===mine) mt = [h, a]; else ties.push(cpTie(C, k, i, h, a)); }
  if (play.length%2) bye.push(play[play.length-1]);
  if (mt) C.cur = {i, ties, bye, mine:mt}; else cpClose(C, k, i, ties, bye);
}
// your tie won't be played after all (the season's over): it's simulated like the rest
function cpSettle(C, k){ const c = C.cur; if (c) cpClose(C, k, c.i, [...c.ties, cpTie(C, k, c.i, c.mine[0], c.mine[1])], c.bye); }
function cpTo(C, k, upTo){ while (C.r<upTo && !C.win){ if (C.cur) cpSettle(C, k); else cpRound(C, k, C.r); } }

/* ---------- your cup ties (matchcentre.js) ---------- */
// who you play in round i: the rounds before it are played, then the draw; null leaves it to the old draw
function cpOpp(k, i, club){
  const C = cpGet(k, true); if (!C || (k==="eflt" && i===0)) return null;
  cpTo(C, k, i);
  if (C.r===i && !C.cur) cpRound(C, k, i, club);
  const m = C.cur && C.cur.i===i ? C.cur.mine : null; if (!m) return null;
  const o = cpOther(m, club);
  return {n:o, str:strOf(o), home:m[0]===club};
}
// one of your cup games is over (mcResolve, after mcAfter): the scorers count, and a decided tie closes the round
function cpOnResult(f, det){
  const C = cpGet(f.code); if (!C) return;
  const our = S.mc.club, me = f.me;
  if (det) det.forEach((side, s)=>side.forEach((x, i)=>{ if (x){ if (x[0]) cpCredit(C, s ? f.opp : our, i, 0, x[0]); if (x[1]) cpCredit(C, s ? f.opp : our, i, 1, x[1]); } }));
  if (me && me.mins){ C.me[0]++; C.me[1] += me.g; C.me[2] += me.a; C.meClub = our; }
  const c = C.cur; if (f.gi!=null || f.leg===1 || !c || c.i!==f.ri || !c.mine.includes(our)) return;
  const [F, A] = f.agg || [f.res.gf, f.res.ga], h = c.mine[0]===our, pens = f.res.pens ? ((f.res.pens==="won")===h ? 1 : 2) : 0;
  cpClose(C, f.code, c.i, [...c.ties, [c.mine[0], c.mine[1], h ? F : A, h ? A : F, pens]], c.bye);
}
// a week's cup tie you're no longer in (mcWeek): its round is played anyway
function cpAdvance(k, i){ const C = cpGet(k); if (C) cpTo(C, k, i + 1); }
// a club you join in January: how far it really got before you arrived. false leaves it to the old draw
function cpJoin(k, club, upTo, r){
  const C = cpGet(k, true); if (!C) return false;
  cpTo(C, k, upTo);
  if (k==="eflt"){ if (!C.grp || !C.grp.includes(club)){ mcOut(r, "Group stage", null, 0); r.games = 3; return true; } r.games = 3; r.gp = 3; }
  for (let i=0;i<upTo;i++){
    const t = (C.res[i] || []).find(x=>x[0]===club || x[1]===club); if (!t) continue;
    r.games += cpLegs(k, i);
    if (cpWinner(t)!==club){ mcOut(r, CP_ROUNDS[k][i], cpOther(t, club), i); return true; }
    r.beaten.push(cpOther(t, club));
  }
  r.next = upTo;
  return true;
}
// the season's over: a cup you were still in when it ended carries on from the bracket (mcCupResult)
function cpFate(k, club, r){
  const C = cpGet(k); if (!C || !r.alive || r.won) return;
  cpTo(C, k, CP_ROUNDS[k].length);
  for (let i=r.next;i<CP_ROUNDS[k].length;i++){
    const t = (C.res[i] || []).find(x=>x[0]===club || x[1]===club); if (!t) continue;
    r.games += cpLegs(k, i);
    if (cpWinner(t)!==club){ mcOut(r, CP_ROUNDS[k][i], cpOther(t, club), i); return; }
    r.beaten.push(cpOther(t, club)); r.next = i + 1;
  }
  if (C.win===club){ r.alive = false; r.won = true; }
}
// every cup this season finishes (simSeason); the FA Cup and the League Cup always get a winner for the record
function cpFinishAll(){
  if (!S.cups || S.cups.s!==seasonLabel(S.season) || S.cups.off) return;
  ["fa", "lc"].forEach(k=>cpGet(k, true));
  Object.entries(S.cups.C).forEach(([k, C])=>{ if (C) cpTo(C, k, CP_ROUNDS[k].length); });
}

/* ---------- what you see ---------- */
// top scorers (k=0) or assists (k=1), with you among them: [{name, club, i or me, n, rank}]
function cpLeaders(C, k){
  const list = Object.entries(C.sc).filter(([,x])=>x[k]>0).map(([key, x])=>{ const j = key.lastIndexOf("|"), club = key.slice(0, j), i = +key.slice(j+1);
    return {name:sqSquad(club)[i].name, club, i, n:x[k]}; });
  if (C.me[k+1]) list.push({name:S.player.name, club:C.meClub || S.club, me:true, n:C.me[k+1]});
  list.sort((a,b)=>b.n-a.n || (b.me ? 1 : 0)-(a.me ? 1 : 0));
  list.forEach((p,j)=>{ p.rank = j && list[j-1].n===p.n ? list[j-1].rank : j+1; });
  return list;
}
// a tie as text: "Arsenal 2–1 Chelsea", with penalties or aggregate where it needs them
function cpTieText(k, i, t){
  const pens = t[4] ? ` (${esc(t[t[4]-1])} win on penalties)` : "", agg = cpLegs(k, i)===2 ? " on aggregate" : "";
  return `<span>${clubBadge(t[0], 16)} ${esc(t[0])}</span><b>${t[2]}–${t[3]}</b><span>${esc(t[1])} ${clubBadge(t[1], 16)}</span>${pens || agg ? `<small>${agg ? "Aggregate" : ""}${pens}</small>` : ""}`;
}
function cpBox(k){
  const C = S.cups.C[k], R = CP_ROUNDS[k], our = S.mc.club, rec = mcRecIf(our), r = rec && rec.cups[k];
  const last = C.res.reduce((m, t, i)=>t && t.length ? i : m, -1), ties = last>=0 ? C.res[last] : [];
  const yourTie = ties.find(t=>t[0]===our || t[1]===our);
  const you = !r ? "" : r.won ? "You won it!" : !r.alive ? (r.reached==="Group stage" ? "You went out in the group stage." : `You went out in the ${esc(r.reached)}${r.lostTo ? ` to ${esc(r.lostTo)}` : ""}.`)
    : k==="eflt" && r.next===0 ? `Group stage: ${r.pts} point${r.pts===1 ? "" : "s"} from ${r.gp} game${r.gp===1 ? "" : "s"}.`
    : r.games ? `You're through to the ${esc(R[r.next] || "")}.` : `You come in at the ${esc(R[r.next] || "")}.`;
  const left = C.win ? `Won by ${esc(C.win)}` : C.cur ? `${esc(R[C.cur.i])} being played` : `${C.al.length} club${C.al.length===1 ? "" : "s"} left · next: ${esc(R[C.r] || "")}`;
  const top = cpLeaders(C, 0), mine = top.findIndex(p=>p.me);
  const row = p => `<li class="${p.me ? "me" : ""}" data-pl="${esc(p.me ? "me" : `${p.club}|${p.i}`)}" tabindex="0" role="button" aria-label="Open ${esc(p.name)}'s card"><span class="lg-rk">${p.rank}</span>${clubBadge(p.club, 18)}
    <span class="lg-who"><b class="${p.me ? "me-name" : ""}">${esc(p.name)}</b><small>${esc(p.club)}</small></span><span class="lg-v">${p.n}</span></li>`;
  const list = [...(yourTie ? [yourTie] : []), ...ties.filter(t=>t!==yourTie)].map(t=>`<li class="${t===yourTie ? "me" : ""}">${cpTieText(k, last, t)}</li>`).join("");
  return `<div class="cp-head"><span class="pill ${C.win ? "gold" : ""}">${left}</span></div>
    ${you ? `<p class="hint" style="margin:0 0 8px">${you}</p>` : ""}
    ${last<0 ? "" : ties.length===1 ? `<p class="label" style="margin:0 0 6px">${esc(R[last])}</p><ul class="lg-res">${list}</ul>`
      : `<details class="cp-res"><summary>${esc(R[last])} results <span class="hint">(${ties.length})</span></summary><ul class="lg-res">${list}</ul></details>`}
    ${top.length ? `<p class="label" style="margin:12px 0 6px">Top scorers</p><ol class="lg-lead cp-top">${top.slice(0, 5).map(row).join("")}${mine>=5 ? row(top[mine]) : ""}</ol>` : ""}`;
}
// the match centre's Cups view: one cup at a time, the ones you're in (or were in) first
function cpPanel(){
  const G = S.cups; if (!G || G.s!==seasonLabel(S.season) || G.off) return "";
  const our = S.mc.club, rec = mcRecIf(our) || {cups:{}}, ks = Object.keys(CP_ROUNDS).filter(k=>G.C[k]).sort((a,b)=>!rec.cups[a] - !rec.cups[b]);
  return ks.length ? subTabs("cups", ks.map(k=>[k, CP_NAMES[k], cpBox(k)])) : "";
}
// a player's cup numbers this season, for his card: "FA Cup: 3 goals, 1 assist"
function cpCardLine(club, i){
  const G = S.cups; if (!G || G.s!==seasonLabel(S.season) || G.off) return "";
  const parts = Object.entries(G.C).filter(([,C])=>C).map(([k, C])=>{ const x = club==="me" ? (C.me[0] ? [C.me[1], C.me[2]] : null) : C.sc[`${club}|${i}`];
    return x && (x[0] || x[1]) ? `${CP_NAMES[k]}: ${x[0]} goal${x[0]===1 ? "" : "s"}${x[1] ? `, ${x[1]} assist${x[1]===1 ? "" : "s"}` : ""}` : ""; }).filter(Boolean);
  return parts.length ? `<p class="hint" style="margin:8px 0 0">${parts.join(" · ")}</p>` : "";
}
// the season's cup winners, for the inbox (finishSeason)
function cpSeasonNote(){
  const G = S.cups; if (!G || G.s!==seasonLabel(S.season) || G.off) return;
  const lines = Object.keys(CP_ROUNDS).filter(k=>G.C[k] && G.C[k].win).map(k=>{
    const C = G.C[k], f = (C.res[CP_ROUNDS[k].length-1] || [])[0], g = cpLeaders(C, 0)[0];
    return `${CP_NAMES[k]}: ${C.win}${f ? `, beating ${cpOther(f, C.win)} ${f[4] ? `on penalties after a ${f[2]}–${f[3]} draw` : `${Math.max(f[2], f[3])}–${Math.min(f[2], f[3])}`} in the final` : ""}${g ? `. Top scorer: ${g.me ? "you" : `${g.name} (${g.club})`}, ${g.n}` : ""}.`;
  });
  if (lines.length) note("info", "The cup winners", lines.join(" "));
}
