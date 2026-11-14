/* ================= EUROPE, IN FULL =================
   In a match centre season the Champions League, the Europa League and the Conference League are played out in full,
   all three at once. Each has 36 clubs: the game's own clubs that qualified (S.world.europe), topped up with clubs from
   the rest of Europe (EU_EXTRA, strongest into the Champions League). The league phase is a real schedule (8 matchdays,
   6 in the Conference League) with every game simulated alongside yours and a full table: 1st to 8th go straight to the
   last 16, 9th to 24th play a two-legged knockout play-off, the rest are out. Then a seeded bracket (1st and 2nd can
   only meet in the final), two legs a round, and a one-off final at a neutral ground. Scorers come from each club's XI
   (squads.js), as in the cups (cups.js, whose cpSide, cpCredit and cpWinner this reuses).
   Kept in S.eu = {s:season, off (a season that began before this, with European games already played), C:{code: {
   n:[clubs], str:{club: strength, for clubs outside the game}, md (league-phase games each), sch:[[[home, away] as
   indexes into n] by matchday], res:[[[home, away, home goals, away goals]] by matchday played], cur (your game or tie
   waiting to be played: {md, games, mine} or {ko, i, ties, q, mine}), pos:[clubs in league-phase order] once it's done,
   ko:[[tie] by round, in bracket order], kr (next knockout round), sc:{"club|place":[goals, assists]}, me:[games,
   goals, assists], meClub, win}}}. A knockout tie is [first-leg home, away, home goals, away goals, penalties won by
   (0 nobody, 1 home, 2 away)] over both legs. S.euHon keeps the winners, season by season.
   Loaded after cups.js, before game.js; only called once the game is running. */
const EU_CODES = ["UCL", "UEL", "UECL"];
// clubs from Europe's other leagues, for the places the game's own clubs don't fill
const EU_EXTRA = ("Galatasaray:78,Fenerbahçe:78,Club Brugge:76,Olympiacos:76,Beşiktaş:75,Union Saint-Gilloise:74,Salzburg:74,Shakhtar Donetsk:74,Bodø/Glimt:74,AZ Alkmaar:74,"
  + "Slavia Prague:73,Anderlecht:73,Dinamo Zagreb:72,Sparta Prague:72,Copenhagen:72,Midtjylland:72,Basel:72,Red Star Belgrade:72,PAOK:72,AEK Athens:72,Panathinaikos:72,Gent:72,Genk:72,"
  + "Young Boys:71,Ferencváros:71,Sturm Graz:71,Viktoria Plzeň:71,Trabzonspor:71,Dynamo Kyiv:71,Qarabağ:70,Legia Warsaw:70,Lech Poznań:70,Rapid Wien:70,Başakşehir:70,Antwerp:70,"
  + "Malmö:69,Molde:69,Standard Liège:68,Brøndby:68,LASK:68,Viking:68,Lugano:68,Ludogorets:67,Hajduk Split:67,Partizan:67,Omonia:67,Jagiellonia:67,Raków Częstochowa:67,Servette:67,"
  + "Slovan Bratislava:66,Rosenborg:66,Djurgården:66,Rijeka:66,Pafos:66,APOEL:65,Sabah:64,Häcken:64,AIK:63,Olimpija Ljubljana:63,Shamrock Rovers:62,Puskás Akadémia:62,Celje:62,"
  + "CSKA Sofia:61,Spartak Trnava:60,HJK Helsinki:60,Borac Banja Luka:60,Shelbourne:58,Víkingur Reykjavík:58,The New Saints:57").split(",").map(s=>{ const [n, v] = s.split(":"); return {n, str:+v}; });
const EU_LEGS = i => i===KO_EU.length - 1 ? 1 : 2;
// the last 16's seeds, in bracket order: each plays the winner of the play-off tie in the same place
const EU_SEEDS = [1, 8, 5, 4, 3, 6, 7, 2];

/* ---------- the three competitions ---------- */
// this season's European competitions, made the first time they're needed (make); null when they aren't played out
function euAll(make){
  const s = seasonLabel(S.season);
  if (!S.eu || S.eu.s!==s){
    if (!make) return null;
    const recs = S.mcRec && S.mcRec.s===s ? Object.values(S.mcRec.clubs) : [];
    S.eu = {s, off:recs.some(r=>r.eu && r.eu.games), C:euBuild()};
  }
  return S.eu.off ? null : S.eu;
}
const euGet = (code, make) => { const G = euAll(make); return G ? G.C[code] || null : null; };
// a club's strength in a competition: the game's own clubs as they are now, the rest as drawn
const euStr = (C, n) => META[n] ? strOf(n) : C.str[n] ?? 60;
function euBuild(){
  const own = {}; EU_CODES.forEach(k=>{ own[k] = []; });
  for (const t of TOP) (S.world.tiers[t] || []).forEach(n=>{ const k = S.world.europe[n]; if (own[k]) own[k].push(n); });
  // the rest of Europe, strongest first (give or take), shared out so nobody is in two competitions
  const extra = EU_EXTRA.filter(x=>!META[x.n]).map(x=>({...x, k:x.str + gauss()*2.5})).sort((a,b)=>b.k-a.k);
  const C = {};
  EU_CODES.forEach(k=>{
    const mine = own[k].sort((a,b)=>strOf(b)-strOf(a)).slice(0, 36), need = 36 - mine.length, add = extra.splice(0, need), str = {};
    add.forEach(x=>{ str[x.n] = x.str; });
    const n = [...mine, ...add.map(x=>x.n)];
    if (n.length%2) n.pop();
    C[k] = {n, str, md:EURO[k].phase, sch:euSchedule(n.length, EURO[k].phase), res:[], cur:null, pos:null, ko:[], kr:0, sc:{}, me:[0, 0, 0], win:null};
  });
  return C;
}
// md rounds of a round robin (the circle method), so nobody meets the same club twice; home and away alternate
function euSchedule(N, md){
  const t = shuffle([...Array(N).keys()]), rounds = [];
  for (let r=0;r<N-1;r++){
    rounds.push([...Array(N/2)].map((_, i)=>{ const a = t[i], b = t[N-1-i]; return (r + i)%2 ? [a, b] : [b, a]; }));
    t.splice(1, 0, t.pop());
  }
  return shuffle(rounds).slice(0, md);
}

/* ---------- playing it ---------- */
// one game between two other clubs (as cpTie: the gap counts up to 20, a goal and a half for being at home)
function euGame(C, h, a, neutral){
  const d = clamp(euStr(C, h) - euStr(C, a), -20, 20) + (neutral ? 0 : 1.5), hg = mcPoisson(1.35*Math.exp(d/20)), ag = mcPoisson(1.35*Math.exp(-d/20));
  cpSide(C, h, hg); cpSide(C, a, ag);
  return [hg, ag];
}
// matchday m: every game except yours when `mine` (your club) is about to play it
function euMd(C, m, mine){
  if (C.res.length!==m || C.cur || m>=C.md) return;
  const games = []; let my = null;
  C.sch[m].forEach(([h, a])=>{ const H = C.n[h], A = C.n[a]; if (H===mine || A===mine) my = [h, a]; else games.push([h, a, ...euGame(C, H, A)]); });
  if (my) C.cur = {md:m, games, mine:my}; else euMdDone(C, games);
}
function euMdDone(C, games){ C.res.push(games); C.cur = null; if (C.res.length>=C.md) euPhaseDone(C); }
// the league-phase table: [{n, p, w, d, l, gf, ga, pts}], best first
function euTable(C){
  const T = C.n.map(n=>({n, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0}));
  const add = (x, f, a) => { x.p++; x.gf += f; x.ga += a; if (f>a){ x.w++; x.pts += 3; } else if (f===a){ x.d++; x.pts++; } else x.l++; };
  C.res.forEach(md=>md.forEach(([h, a, hg, ag])=>{ add(T[h], hg, ag); add(T[a], ag, hg); }));
  return T.sort((x, y)=>y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || euStr(C, y.n) - euStr(C, x.n));
}
function euPhaseDone(C){ C.pos = euTable(C).map(x=>x.n); C.kr = 0; }
// the pairs in knockout round i, in bracket order, the first of each at home in the first leg (the lower seed, so the
// higher seed is at home in the second); null until the round before is done
function euPairs(C, i){
  const P = C.pos; if (!P) return null;
  const win = j => C.ko[j] ? C.ko[j].map(cpWinner) : null, rank = n => P.indexOf(n);
  if (i===0) return EU_SEEDS.map(k=>[P[15 + k], P[16 - k]]).filter(p=>p[0] && p[1]);   // 17th v 16th ... 24th v 9th, in the place of the seed they'll meet
  if (i===1){ const w = win(0); return w && EU_SEEDS.map((k, q)=>[w[q], P[k - 1]]); }
  const w = win(i - 1); if (!w) return null;
  const out = []; for (let q=0;q+1<w.length;q+=2){ const [x, y] = rank(w[q])>rank(w[q+1]) ? [w[q], w[q+1]] : [w[q+1], w[q]]; out.push([x, y]); }
  return out;
}
// a tie between two other clubs: two legs (one in the final, at a neutral ground), penalties if it's level
function euTie(C, i, h, a){
  let [hg, ag] = euGame(C, h, a, EU_LEGS(i)===1);
  if (EU_LEGS(i)===2){ const [x, y] = euGame(C, a, h); hg += y; ag += x; }
  return [h, a, hg, ag, hg!==ag ? 0 : Math.random()<logistic((euStr(C, h) - euStr(C, a))/12) ? 1 : 2];
}
// knockout round i: every tie except yours when `mine` is about to play it
function euKo(C, i, mine){
  if (C.kr!==i || C.cur || C.win || !C.pos) return;
  const pairs = euPairs(C, i); if (!pairs) return;
  let q = -1; const ties = pairs.map(([h, a], j)=>{ if (h===mine || a===mine){ q = j; return null; } return euTie(C, i, h, a); });
  if (q>=0) C.cur = {ko:true, i, ties, q, mine:pairs[q]}; else euKoDone(C, i, ties);
}
function euKoDone(C, i, ties){ C.ko[i] = ties; C.cur = null; C.kr = i + 1; if (C.kr>=KO_EU.length) C.win = ties[0] ? cpWinner(ties[0]) : null; }
// your game won't be played after all: it's simulated like the rest
function euSettle(C){
  const c = C.cur; if (!c) return;
  if (c.ko){ c.ties[c.q] = euTie(C, c.i, c.mine[0], c.mine[1]); euKoDone(C, c.i, c.ties); }
  else euMdDone(C, [...c.games, [c.mine[0], c.mine[1], ...euGame(C, C.n[c.mine[0]], C.n[c.mine[1]])]]);
}
// played up to (not including) matchday m, or knockout round i
function euPhaseTo(C, m){ while (C.res.length<Math.min(m, C.md)){ if (C.cur) euSettle(C); else euMd(C, C.res.length); } }
function euKoTo(C, i){ euPhaseTo(C, C.md); while (C.kr<i && !C.win && C.pos){ if (C.cur) euSettle(C); else euKo(C, C.kr); } }
// every competition up to where the season has got to (mcWeek, after each week): matchdays through the autumn, the
// knockouts from February. Yours, while you're still in it, moves with your own games instead
function euTick(frac){
  const G = euAll(true); if (!G) return;
  const r = (mcRecIf(S.mc.club) || {}).eu;
  EU_CODES.forEach(k=>{
    const C = G.C[k]; if (r && r.code===k && r.alive) return;
    for (let m=0;m<C.md;m++) if ((.1 + .85*m/Math.max(1, C.md - 1))*.5 <= frac) euPhaseTo(C, m + 1);
    for (let i=0;i<KO_EU.length;i++) if (.5 + .5*(i<KO_EU.length - 1 ? .12 + .2*i + .04 : .97) <= frac) euKoTo(C, i + 1);
  });
}
// the season's over: everything finishes, and the winners go in the record
function euFinishAll(){
  const G = euAll(false); if (!G) return;
  EU_CODES.forEach(k=>euKoTo(G.C[k], KO_EU.length));
  const H = S.euHon ||= [], row = {s:G.s}; EU_CODES.forEach(k=>{ if (G.C[k].win) row[k] = G.C[k].win; });
  if (H.length && H[H.length-1].s===row.s) H.pop();
  H.push(row); if (H.length>40) H.splice(0, H.length - 40);
}

/* ---------- your games (matchcentre.js) ---------- */
// your club's eight (or six) league-phase opponents, home or away, from the schedule; null if it isn't in the draw
function euOpps(code, club){
  const C = euGet(code, true); if (!C) return null;
  const me = C.n.indexOf(club); if (me<0) return null;
  return C.sch.map(R=>{ const p = R.find(x=>x.includes(me)), o = C.n[p[0]===me ? p[1] : p[0]]; return {n:o, str:euStr(C, o), home:p[0]===me}; });
}
// before your league-phase game on matchday m: the matchdays before it are played, then the rest of this one
function euPhaseOpp(code, m, club){
  const C = euGet(code); if (!C) return null;
  euPhaseTo(C, m); if (C.res.length===m && !C.cur) euMd(C, m, club);
  const c = C.cur; if (!c || c.ko || c.md!==m || !c.mine.some(x=>C.n[x]===club)) return null;
  const home = C.n[c.mine[0]]===club, o = C.n[c.mine[home ? 1 : 0]];
  return {n:o, str:euStr(C, o), home};
}
// your league-phase game is over (mcAfter): it goes in the table
function euPhaseResult(f, club){
  const C = euGet(f.code), c = C && C.cur; if (!c || c.ko || c.md!==f.gi) return;
  const home = C.n[c.mine[0]]===club; if (!home && C.n[c.mine[1]]!==club) return;
  euMdDone(C, [...c.games, [c.mine[0], c.mine[1], home ? f.res.gf : f.res.ga, home ? f.res.ga : f.res.gf]]);
}
// where your club finished the league phase, once it's over: through to the last 16, the play-off, or out. false
// when Europe isn't played out (the old points thresholds decide instead)
function euPhaseEnd(r, code, club){
  const C = euGet(code); if (!C) return false;
  euPhaseTo(C, C.md); const at = C.pos ? C.pos.indexOf(club) : -1; if (at<0) return false;
  r.rank = at + 1;
  if (at<8){ r.next = 1; r.top8 = true; } else if (at<24) r.next = 0; else mcOut(r, "League phase", null, 0);
  return true;
}
// who you play in knockout round i: the rounds before are played, then the rest of this one
function euKoOpp(code, i, club){
  const C = euGet(code); if (!C) return null;
  euKoTo(C, i); if (C.kr===i && !C.cur) euKo(C, i, club);
  const c = C.cur; if (!c || !c.ko || c.i!==i || !c.mine.includes(club)) return null;
  const o = cpOther(c.mine, club);
  return {n:o, str:euStr(C, o), home:c.mine[0]===club};
}
// one of your European games is over (mcResolve): the scorers count, and a decided tie closes the round
function euOnResult(f, det){
  const C = euGet(f.code); if (!C) return;
  const our = S.mc.club, me = f.me;
  if (det) det.forEach((side, s)=>side.forEach((x, i)=>{ if (x){ if (x[0]) cpCredit(C, s ? f.opp : our, i, 0, x[0]); if (x[1]) cpCredit(C, s ? f.opp : our, i, 1, x[1]); } }));
  if (me && me.mins){ C.me[0]++; C.me[1] += me.g; C.me[2] += me.a; C.meClub = our; }
  const c = C.cur; if (f.ri<0 || f.leg===1 || !c || !c.ko || c.i!==f.ri || !c.mine.includes(our)) return;
  const [F, A] = f.agg || [f.res.gf, f.res.ga], h = c.mine[0]===our, pens = f.res.pens ? ((f.res.pens==="won")===h ? 1 : 2) : 0;
  c.ties[c.q] = [c.mine[0], c.mine[1], h ? F : A, h ? A : F, pens]; euKoDone(C, c.i, c.ties);
}
// a week's European tie you're no longer in (mcWeek): its round is played anyway
function euAdvance(code, i){ const C = euGet(code); if (C && i>=0) euKoTo(C, i + 1); }
// the league-phase games you haven't played for this club (you joined in January, or the season ended): from the
// schedule, and where it finished. false when Europe isn't played out
function euPhaseFill(code, club, r){
  const C = euGet(code, true); if (!C || C.n.indexOf(club)<0) return false;
  if (r.next!==null || !r.alive) return true;
  euPhaseTo(C, C.md); const me = C.n.indexOf(club);
  C.res.slice(r.gp).forEach(md=>md.forEach(([h, a, hg, ag])=>{ if (h!==me && a!==me) return; const [f, g] = h===me ? [hg, ag] : [ag, hg]; r.games++; r.pts += f>g ? 3 : f===g ? 1 : 0; }));
  r.gp = C.md; euPhaseEnd(r, code, club);
  return true;
}
// the season's over: the rest of your run comes from the bracket (mcEuroResult). false when Europe isn't played out
function euFate(code, club, r){
  const C = euGet(code); if (!C || !euPhaseFill(code, club, r)) return false;
  if (!r.alive || r.won) return true;
  euKoTo(C, KO_EU.length);
  for (let i=r.next;i<KO_EU.length;i++){
    const t = (C.ko[i] || []).find(x=>x && (x[0]===club || x[1]===club)); if (!t) continue;
    r.games += EU_LEGS(i) - (r.tie && r.tie.i===i ? 1 : 0); r.tie = null;
    if (cpWinner(t)!==club){ mcOut(r, KO_EU[i], cpOther(t, club), i); return true; }
    r.beaten.push(cpOther(t, club)); r.next = i + 1;
  }
  if (C.win===club){ r.alive = false; r.won = true; }
  return true;
}

/* ---------- what you see ---------- */
// a knockout tie as text, with the aggregate or penalties where it needs them
function euTieText(i, t){
  const pens = t[4] ? ` (${esc(t[t[4]-1])} win on penalties)` : "", agg = EU_LEGS(i)===2;
  return `<span>${clubBadge(t[0], 16)} ${esc(t[0])}</span><b>${t[2]}–${t[3]}</b><span>${esc(t[1])} ${clubBadge(t[1], 16)}</span>${pens || agg ? `<small>${agg ? "Aggregate" : ""}${pens}</small>` : ""}`;
}
// the league-phase table: the top eight, the play-off places and the rest, with your club marked
function euTableHTML(C, our){
  const T = euTable(C), zone = i => i<8 ? "z-ucl" : i<24 ? "z-po" : "";
  return `<div class="tablewrap"><table class="lt lg-t eu-t"><thead><tr><th></th><th class="n">#</th><th>Club</th><th class="n">P</th><th class="n">W</th><th class="n">D</th><th class="n">L</th><th class="n">GD</th><th class="n">Pts</th></tr></thead><tbody>
    ${T.map((x, i)=>`<tr class="${x.n===our ? "me" : ""}${i===8 || i===24 ? " cut" : ""}"><td class="z ${zone(i)}"></td><td class="n">${i+1}</td><td><span class="lg-club">${clubBadge(x.n, 18)}<span class="lg-cn">${esc(x.n)}</span></span></td>
      <td class="n">${x.p}</td><td class="n">${x.w}</td><td class="n">${x.d}</td><td class="n">${x.l}</td><td class="n">${x.gf - x.ga>0 ? "+" : ""}${x.gf - x.ga}</td><td class="n"><b>${x.pts}</b></td></tr>`).join("")}
  </tbody></table></div><p class="hint eu-key"><i class="z z-ucl"></i> Last 16 <i class="z z-po"></i> Knockout play-off</p>`;
}
// the knockouts, round by round: the ties played, and the next round's pairs once they're known
function euBracketHTML(C, our){
  const rounds = KO_EU.map((name, i)=>{
    const done = C.ko[i], pairs = !done && i===C.kr ? euPairs(C, i) : null;
    if (!done && !pairs) return "";
    const list = done ? done.map(t=>t ? `<li class="${t[0]===our || t[1]===our ? "me" : ""}">${euTieText(i, t)}</li>` : "").join("")
      : pairs.map(([h, a])=>`<li class="${h===our || a===our ? "me" : ""}"><span>${clubBadge(h, 16)} ${esc(h)}</span><b>v</b><span>${esc(a)} ${clubBadge(a, 16)}</span></li>`).join("");
    return `<p class="label" style="margin:12px 0 6px">${esc(name)}${done ? "" : " · drawn"}</p><ul class="lg-res">${list}</ul>`;
  }).join("");
  return rounds || `<p class="hint">The knockouts start in February: 1st to 8th go straight to the last 16, 9th to 24th play off for the other eight places.</p>`;
}
function euBox(k){
  const G = S.eu, C = G.C[k], our = S.mc.club, rec = mcRecIf(our), r = rec && rec.eu && rec.eu.code===k ? rec.eu : null;
  const at = C.n.indexOf(our), T = C.res.length ? euTable(C) : null, myRow = T && T.findIndex(x=>x.n===our);
  const stage = C.win ? `Won by ${esc(C.win)}` : C.pos ? `${esc(KO_EU[Math.min(C.kr, KO_EU.length - 1)])}${C.cur ? " being played" : " next"}` : `League phase · matchday ${C.res.length} of ${C.md}`;
  const you = at<0 ? "" : r && r.won ? "You won it!" : r && !r.alive ? (r.reached==="League phase" ? `You went out in the league phase${r.rank ? `, ${ord(r.rank)}` : ""}.` : `You went out in the ${esc(r.reached)}${r.lostTo ? ` to ${esc(r.lostTo)}` : ""}.`)
    : C.pos ? (r && r.next!=null ? `You finished ${ord(r.rank || C.pos.indexOf(our) + 1)} in the league phase, and you're in the ${esc(KO_EU[r.next])}.` : "")
    : T ? `You're ${ord(myRow + 1)} with ${T[myRow].pts} point${T[myRow].pts===1 ? "" : "s"} from ${T[myRow].p} game${T[myRow].p===1 ? "" : "s"}.` : `You're in the draw: ${C.md} games in the league phase.`;
  const top = cpLeaders(C, 0), mine = top.findIndex(p=>p.me);
  const row = p => `<li class="${p.me ? "me" : ""}" data-pl="${esc(p.me ? "me" : `${p.club}|${p.i}`)}" tabindex="0" role="button" aria-label="Open ${esc(p.name)}'s card"><span class="lg-rk">${p.rank}</span>${clubBadge(p.club, 18)}
    <span class="lg-who"><b class="${p.me ? "me-name" : ""}">${esc(p.name)}</b><small>${esc(p.club)}</small></span><span class="lg-v">${p.n}</span></li>`;
  const hon = (S.euHon || []).filter(h=>h[k] && h.s!==G.s).slice(-5).reverse();
  return `<div class="cp-head"><span class="pill ${C.win ? "gold" : "eu"}">${stage}</span></div>
    ${you ? `<p class="hint" style="margin:0 0 8px">${you}</p>` : ""}
    ${C.pos ? euBracketHTML(C, our) : ""}
    <details class="cp-res" ${C.pos ? "" : "open"}><summary>League phase table <span class="hint">(${C.n.length} clubs)</span></summary>${euTableHTML(C, our)}</details>
    ${top.length ? `<p class="label" style="margin:12px 0 6px">Top scorers</p><ol class="lg-lead cp-top">${top.slice(0, 5).map(row).join("")}${mine>=5 ? row(top[mine]) : ""}</ol>` : ""}
    ${hon.length ? `<p class="label" style="margin:12px 0 6px">Recent winners</p><ul class="eu-hon">${hon.map(h=>`<li><span class="label">${esc(h.s)}</span>${clubBadge(h[k], 16)} ${esc(h[k])}</li>`).join("")}</ul>` : ""}`;
}
// the match centre's Europe view: all three competitions, yours first
function euPanel(){
  const G = euAll(false); if (!G || !S.mc) return "";
  const r = (mcRecIf(S.mc.club) || {}).eu, ks = EU_CODES.slice().sort((a, b)=>(b===(r && r.code)) - (a===(r && r.code)));
  return subTabs("eu", ks.map(k=>[k, EURO[k].name, euBox(k)]));
}
// the season's European winners, for the inbox (finishSeason)
function euSeasonNote(){
  const G = euAll(false); if (!G) return;
  const lines = EU_CODES.filter(k=>G.C[k].win).map(k=>{
    const C = G.C[k], f = (C.ko[KO_EU.length - 1] || [])[0], g = cpLeaders(C, 0)[0];
    return `${EURO[k].name}: ${C.win}${f ? `, beating ${cpOther(f, C.win)} ${f[4] ? `on penalties after a ${f[2]}–${f[3]} draw` : `${Math.max(f[2], f[3])}–${Math.min(f[2], f[3])}`} in the final` : ""}${g ? `. Top scorer: ${g.me ? "you" : `${g.name} (${g.club})`}, ${g.n}` : ""}.`;
  });
  if (lines.length) note("info", "Europe's winners", lines.join(" "));
}
// a player's European numbers this season, for his card
function euCardLine(club, i){
  const G = euAll(false); if (!G) return "";
  const parts = EU_CODES.map(k=>{ const C = G.C[k], x = club==="me" ? (C.me[0] ? [C.me[1], C.me[2]] : null) : C.sc[`${club}|${i}`];
    return x && (x[0] || x[1]) ? `${EURO[k].name}: ${x[0]} goal${x[0]===1 ? "" : "s"}${x[1] ? `, ${x[1]} assist${x[1]===1 ? "" : "s"}` : ""}` : ""; }).filter(Boolean);
  return parts.length ? `<p class="hint" style="margin:8px 0 0">${parts.join(" · ")}</p>` : "";
}
