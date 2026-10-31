/* ================= INTERNATIONAL TOURNAMENTS, PLAYED =================
   A summer tournament you're picked for (S.tourney, game.js) is played out game by game: the World Cup's 48 nations,
   the Euros' 24 and so on (T_SIZE), drawn into groups of four from seeding pots, every group game simulated with a
   table, the best third-placed sides through where the format needs them, then a seeded knockout bracket (extra time
   and penalties when it's level) to a winner. Your games are played with key moments (moments.js) or simmed, and how
   much you play follows your role in the squad. When your tournament's over, the rest is played out and the same
   aftermath as before follows (tourDone, game.js): caps, a medal, your value and the Ballon d'Or.
   Kept in S.tourney.P = {n:[nations], str:{nation: strength}, host:[nations], G:[[4 nations] by group], gr:[[[home,
   away, home goals, away goals]] by group matchday played], K (how many reach the knockouts), br:[nations still in, in
   bracket order], ko:[[tie] by round], kr (next knockout round), cur (your next game: {ko, i or md, opp, others,
   me:{st, mins}}), mine:[your games: {round, opp, gf, ga, pens, mins, g, a, r}], me:[games, goals, assists, clean
   sheets], sc:{"nation|place":[goals, assists]}, meClub (your nation), out:{reached, lostTo} once you're out, win}.
   A knockout tie is [first, second, goals, goals, penalties won by (0 nobody, 1 first, 2 second)].
   Loaded before game.js; only called once the game is running. */
const T_SIZE = {wc:48, euro:24, copa:16, afcon:24, asian:24, gold:16};
// each nation's kit (shirt, then shorts and trim), for its badge and the match screens (meta, game.js)
const NAT_KIT = Object.fromEntries(("France:#1E3A8A:#FFFFFF,England:#FFFFFF:#1E3A8A,Spain:#C8102E:#FFC400,Portugal:#A50021:#006600,Germany:#FFFFFF:#111111,Netherlands:#F36C21:#FFFFFF,"
  + "Norway:#C8102E:#FFFFFF,Belgium:#C8102E:#111111,Turkey:#E30A17:#FFFFFF,Sweden:#FECC00:#005BAC,Croatia:#FFFFFF:#C8102E,Switzerland:#D52B1E:#FFFFFF,Austria:#ED2939:#FFFFFF,"
  + "Czech Republic:#D7141A:#11457E,Scotland:#1B2A4A:#FFFFFF,Bosnia and Herzegovina:#002395:#FECB00,Italy:#0066B3:#FFFFFF,Denmark:#C8102E:#FFFFFF,Ukraine:#FFD500:#0057B7,"
  + "Serbia:#C6363C:#0C4076,Poland:#FFFFFF:#DC143C,Greece:#0D5EAF:#FFFFFF,Georgia:#FFFFFF:#DA291C,Hungary:#CD2A3E:#FFFFFF,Wales:#C8102E:#00AB39,Slovakia:#FFFFFF:#0B4EA2,"
  + "Romania:#FCD116:#002B7F,Slovenia:#FFFFFF:#005DA4,Republic of Ireland:#169B62:#FFFFFF,Albania:#E41E20:#111111,Israel:#FFFFFF:#0038B8,Northern Ireland:#00843D:#FFFFFF,"
  + "Iceland:#02529C:#FFFFFF,Finland:#FFFFFF:#002F6C,Brazil:#FFDF00:#009C3B,Argentina:#75AADB:#FFFFFF,Ecuador:#FFD100:#034EA2,Uruguay:#5CBFEB:#111111,Colombia:#FCD116:#003893,"
  + "Paraguay:#D52B1E:#FFFFFF,Chile:#D52B1E:#0039A6,Venezuela:#7A1F2B:#FFFFFF,Peru:#FFFFFF:#D91023,Bolivia:#007934:#FFFFFF,Ivory Coast:#FF8200:#FFFFFF,Senegal:#FFFFFF:#00853F,"
  + "Morocco:#C1272D:#006233,Algeria:#FFFFFF:#006633,Ghana:#FFFFFF:#111111,DR Congo:#007FFF:#F7D618,Egypt:#C8102E:#FFFFFF,Tunisia:#FFFFFF:#E70013,Cape Verde:#003893:#FFFFFF,"
  + "South Africa:#FFB612:#007749,Nigeria:#008751:#FFFFFF,Cameroon:#007A5E:#CE1126,Mali:#14B53A:#FCD116,Guinea:#CE1126:#FCD116,Burkina Faso:#009E49:#EF2B2D,Zambia:#198A00:#EF7D00,"
  + "Gabon:#009E60:#FCD116,Angola:#CC092F:#111111,Benin:#FCD116:#008751,Uganda:#FCDC04:#111111,Equatorial Guinea:#E32118:#3E9A00,Mozambique:#D21034:#111111,Tanzania:#1EB53A:#00A3DD,"
  + "Sudan:#D21034:#FFFFFF,United States:#FFFFFF:#0A3161,Canada:#D80621:#FFFFFF,Mexico:#006847:#FFFFFF,Haiti:#00209F:#D21034,Panama:#DA121A:#FFFFFF,Curaçao:#002B7F:#F9E814,"
  + "Jamaica:#FED100:#009B3A,Costa Rica:#CE1126:#002B7F,Honduras:#FFFFFF:#0073CF,El Salvador:#0F47AF:#FFFFFF,Guatemala:#4997D0:#FFFFFF,Trinidad and Tobago:#CE1126:#111111,"
  + "Suriname:#377E3F:#FFFFFF,Nicaragua:#0067C6:#FFFFFF,Cuba:#CF142B:#002A8F,Guadeloupe:#CE1126:#FCD116,Japan:#1D2B6B:#FFFFFF,South Korea:#CD2E3A:#111111,Uzbekistan:#FFFFFF:#0099B5,"
  + "Australia:#FFCD00:#00843D,Saudi Arabia:#FFFFFF:#006C35,Iran:#FFFFFF:#DA0000,Iraq:#FFFFFF:#007A3D,Jordan:#FFFFFF:#CE1126,Qatar:#8A1538:#FFFFFF,China:#DE2910:#FFDE00,"
  + "India:#1F4DA0:#FF9933,United Arab Emirates:#FFFFFF:#00732F,Oman:#DB161B:#FFFFFF,Bahrain:#CE1126:#FFFFFF,Syria:#CE1126:#FFFFFF,Palestine:#FFFFFF:#007A3D,Thailand:#003399:#FFFFFF,"
  + "Vietnam:#DA251D:#FFFF00,Indonesia:#CE1126:#FFFFFF,Tajikistan:#FFFFFF:#CC0000,Kyrgyzstan:#E8112D:#FFEF00,Lebanon:#EE161F:#FFFFFF,North Korea:#ED1C27:#FFFFFF,"
  + "Malaysia:#FFCC00:#010066,New Zealand:#FFFFFF:#111111").split(",").map(s=>{ const [n, c1, c2] = s.split(":"); return [n, [c1, c2]]; }));
// the names a national side's players get (squads.js): its own where the game has them, a neighbour's otherwise
const NAT_NAMES = {"Republic of Ireland":"Ireland", "Northern Ireland":"Ireland", "Czech Republic":"Czechia", "United States":"USA", "Austria":"Germany", "Switzerland":"Germany",
  "Bosnia and Herzegovina":"Serbia", "Slovakia":"Czechia", "Slovenia":"Croatia", "Georgia":"Ukraine", "Romania":"Serbia", "Albania":"Serbia", "Iceland":"Norway", "Finland":"Sweden",
  "Israel":"England", "Canada":"USA", "Australia":"England", "New Zealand":"England", "Jamaica":"England", "Trinidad and Tobago":"England"};
function natNames(n){
  if (SQ_NAMES[n]) return n;
  if (NAT_NAMES[n]) return NAT_NAMES[n];
  const conf = (NATIONS[n] || ["UEFA"])[0], pool = {CAF:["Nigeria", "Ghana", "Senegal", "Morocco"], AFC:["Japan", "Morocco"], CONMEBOL:["Argentina", "Brazil", "Uruguay", "Colombia"],
    CONCACAF:["Colombia", "USA"], UEFA:["England"], OFC:["England"]}[conf] || ["England"];
  return pool[hashStr(n) % pool.length];
}

/* ---------- the draw ---------- */
// the nations taking part: the best of each confederation (give or take), the hosts, and always yours
function tField(T){
  const F = TOUR_FMT[T.key], N = T_SIZE[T.key], hosts = HOSTS[T.key + T.year] || [], must = [...new Set([T.nation, ...hosts.filter(h=>NATIONS[h])])];
  const all = Object.entries(NATIONS).map(([n, v])=>({n, conf:v[0], w:Math.log(Math.max(v[1], 2)) + gauss()*.45}));
  const best = (list, k) => list.slice().sort((a, b)=>b.w - a.w).slice(0, k).map(x=>x.n);
  let out = T.key==="wc" ? Object.entries(F.slots).flatMap(([c, k])=>best(all.filter(x=>x.conf===c), k))
    : T.key==="copa" ? [...all.filter(x=>x.conf==="CONMEBOL").map(x=>x.n), ...best(all.filter(x=>x.conf==="CONCACAF"), 6)]
    : best(all.filter(x=>x.conf===T.conf), N);
  must.forEach(n=>{ if (!out.includes(n)) out.push(n); });
  // too many: the weakest who don't have to be there go; too few: the best of the rest come in
  const w = Object.fromEntries(all.map(x=>[x.n, x.w]));
  while (out.length>N){ const drop = out.filter(n=>!must.includes(n)).sort((a, b)=>w[a] - w[b])[0]; out = out.filter(n=>n!==drop); }
  if (out.length<N) out.push(...best(all.filter(x=>!out.includes(x.n) && (T.key==="wc" || x.conf===T.conf || T.key==="copa")), N - out.length));
  return {out, hosts:must.filter(n=>n!==T.nation || hosts.includes(n))};
}
function tBuild(T){
  const {out, hosts} = tField(T), str = {};
  out.forEach(n=>{ str[n] = n===T.nation ? T.str : +(natStrength(NATIONS[n][1]) + gauss()*1.2).toFixed(1); });
  // pots by strength (the hosts top seeds), one from each pot in every group
  const G = Math.floor(out.length/4), order = out.slice().sort((a, b)=>(hosts.includes(b) - hosts.includes(a)) || str[b] - str[a]);
  const pots = [0, 1, 2, 3].map(p=>shuffle(order.slice(p*G, (p+1)*G)));
  const groups = [...Array(G)].map((_, g)=>pots.map(p=>p[g]).filter(Boolean));
  let K = 2**(TOUR_FMT[T.key].rounds.length - 1); while (K>3*G) K /= 2;   // never more places than there are top-three sides
  return {n:out, str, host:hosts.filter(h=>out.includes(h)), G:groups, gr:[], K, br:null, ko:[], kr:0, cur:null, mine:[], me:[0, 0, 0, 0], sc:{}, meClub:T.nation, out:null, win:null};
}
const tGet = () => { const T = S.tourney; if (!T) return null; return T.P ||= tBuild(T); };
const T_MD = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]];
const tLetter = g => String.fromCharCode(65 + g);
const tGroupOf = (P, n) => P.G.findIndex(g=>g.includes(n));

/* ---------- playing it ---------- */
// one game between two nations: a goal and a half for a host at home, extra time and penalties in a knockout tie
function tGame(P, x, y, ko){
  const ha = (P.host.includes(x) ? 1.5 : 0) - (P.host.includes(y) ? 1.5 : 0), d = clamp(P.str[x] - P.str[y], -20, 20) + ha;
  let xg = mcPoisson(1.25*Math.exp(d/20)), yg = mcPoisson(1.25*Math.exp(-d/20)), pens = 0;
  if (ko && xg===yg){ xg += mcPoisson(.3*Math.exp(d/20)); yg += mcPoisson(.3*Math.exp(-d/20)); if (xg===yg) pens = Math.random()<logistic((P.str[x] - P.str[y])/12) ? 1 : 2; }
  cpSide(P, x, xg); cpSide(P, y, yg);
  return [xg, yg, pens];
}
// a group's table: [{n, p, w, d, l, gf, ga, pts}], best first
function tTable(P, g){
  const T = Object.fromEntries(P.G[g].map(n=>[n, {n, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0}]));
  const add = (x, f, a) => { x.p++; x.gf += f; x.ga += a; if (f>a){ x.w++; x.pts += 3; } else if (f===a){ x.d++; x.pts++; } else x.l++; };
  P.gr.forEach(md=>md.forEach(([h, a, hg, ag])=>{ if (T[h] && T[a]){ add(T[h], hg, ag); add(T[a], ag, hg); } }));
  return Object.values(T).sort((x, y)=>y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || P.str[y.n] - P.str[x.n]);
}
// the knockouts' first round: group winners, runners-up and the best thirds, seeded so the top two meet only in the
// final, and nobody meets a side from their own group straight away where that can be helped
function tSeedOrder(K){ let o = [1]; while (o.length<K){ const m = o.length*2 + 1; o = o.flatMap(s=>[s, m - s]); } return o; }
function tQualify(P){
  const tabs = P.G.map((_, g)=>tTable(P, g)), rank = l => l.sort((x, y)=>y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || P.str[y.n] - P.str[x.n]);
  const W = rank(tabs.map(t=>t[0]).filter(Boolean)), R = rank(tabs.map(t=>t[1]).filter(Boolean)), Th = rank(tabs.map(t=>t[2]).filter(Boolean));
  const seeds = [...W, ...R, ...Th].slice(0, P.K).map(x=>x.n), order = tSeedOrder(P.K).map(s=>seeds[s-1]);
  for (let j=0;j<order.length;j+=2){
    if (tGroupOf(P, order[j])!==tGroupOf(P, order[j+1])) continue;
    for (let q=j+3;q<order.length;q+=2) if (tGroupOf(P, order[q])!==tGroupOf(P, order[j]) && tGroupOf(P, order[j+1])!==tGroupOf(P, order[q-1])){ [order[j+1], order[q]] = [order[q], order[j+1]]; break; }
  }
  P.br = order;
}
// your next game, and the rest of its matchday or round played around it: null when you're out or it's over
function tNext(P){
  if (P.cur) return P.cur;
  if (P.out || P.win) return null;
  const me = P.meClub;
  if (P.gr.length<3){
    const md = P.gr.length, others = [], g0 = tGroupOf(P, me); let opp = null;
    P.G.forEach((grp, g)=>T_MD[md].forEach(([i, j])=>{ const h = grp[i], a = grp[j]; if (!h || !a) return; if (g===g0 && (h===me || a===me)) opp = h===me ? a : h; else others.push([h, a, ...tGame(P, h, a).slice(0, 2)]); }));
    return P.cur = {ko:false, md, opp, others, me:tPick(), round:`Group ${tLetter(g0)}, game ${md + 1}`};
  }
  const i = P.kr, at = P.br.indexOf(me); if (at<0) return null;
  const opp = P.br[at%2 ? at - 1 : at + 1], others = [];
  for (let j=0;j<P.br.length;j+=2) if (j!==at - at%2) others.push([P.br[j], P.br[j+1], ...tGame(P, P.br[j], P.br[j+1], true)]);
  return P.cur = {ko:true, i, opp, others, me:tPick(), round:TOUR_FMT[S.tourney.key].rounds[i + 1]};
}
// whether you play: starters start, the bench comes on most games, a reserve now and then
function tPick(){
  const role = S.tourney.role;
  if (role==="Starter") return Math.random()<.15 ? {st:"start", mins:60 + Math.floor(Math.random()*25)} : {st:"start", mins:90};
  if (Math.random() < (role==="Bench" ? .62 : .18)) return {st:"sub", mins:role==="Bench" ? 10 + Math.floor(Math.random()*30) : 5 + Math.floor(Math.random()*18)};
  return {st:"bench", mins:0};
}
// your game as a fixture the key moments understand
function tFixture(P){
  const c = P.cur, host = P.host.includes(P.meClub), away = P.host.includes(c.opp);
  return {intl:true, code:"intl", opp:c.opp, oppStr:P.str[c.opp], home:host && !away, neutral:!host || away, round:c.round, big:true, me:{...c.me, g:0, a:0, og:0, cs:false, r:null}};
}
// expected goals each way, as mcXg: your nation's strength, you lifting it when you're better than it
function tXg(P, f){
  const base = P.str[P.meClub], pos = S.player.pos, a = mcA(), t = f.me.mins/90, w = mcWeights();
  const boost = clamp((mcOvr() - base)*.18*t, -3, 2.5), att = MC_ATT[pos] ?? .5, ha = f.neutral ? 0 : 1.5, gap = clamp(base - f.oppStr, -20, 20);
  const lf = 1.25*Math.exp((gap + boost*att + ha)/20), la = 1.25*Math.exp((-gap - boost*(1 - att) - ha)/20);
  const [gs, as] = MC_SHARE[pos] || MC_SHARE.CM, damp = mcDamp(lf), skill = k => clamp(1 + (a[k] - (base + 30*(w[k] - .2)))/20, .5, 1.6);
  return {base, lf, la, t, tf:0, pG:clamp(gs*t*damp*skill("fin"), 0, .7), pA:clamp(as*t*damp*skill("pas"), 0, .5)};
}
// your game's result (live: from the key moments you played), your rating, the scorers, and the tournament moves on
function tResolve(P, f, live){
  const X = tXg(P, f), me = f.me, pos = S.player.pos, c = P.cur;
  let gf, ga;
  if (live){ gf = live.gf; ga = live.ga; me.g = live.g; me.a = live.a; me.og = live.og || 0; }
  else { gf = mcPoisson(X.lf); ga = mcPoisson(X.la); if (me.mins) for (let i=0;i<gf;i++){ const x = Math.random(); if (x<X.pG) me.g++; else if (x<X.pG + X.pA) me.a++; } }
  let pens = 0;
  if (live && live.pens) pens = live.pens==="won" ? 1 : 2;   // extra time and the shootout were played (lvDecider)
  else if (c.ko && gf===ga){ if (!(live && live.et)){ gf += mcPoisson(X.lf*.3); ga += mcPoisson(X.la*.3); } if (gf===ga) pens = Math.random()<logistic((X.base - f.oppStr)/12 + (me.mins ? (mcOvr() - X.base)/40 : 0)) ? 1 : 2; }
  f.res = {gf, ga, pens:pens ? (pens===1 ? "won" : "lost") : null};
  if (me.mins){
    me.cs = me.mins>=60 && ga===0;
    const d = DEF.includes(pos) || pos==="CDM", win = gf>ga || pens===1, loss = gf<ga || pens===2;
    let rt = 6.35 + (mcOvr() - f.oppStr)*.02 + me.g*.95 + me.a*.6 + (me.cs && d ? .7 : 0) + (win ? .3 : loss ? -.3 : 0) - (d && ga>=3 ? .5 : 0) + (live ? live.bonus*.6 + gauss()*.3 : gauss()*.5);
    if (me.st==="sub") rt = 6.3 + (rt - 6.35)*.6;
    me.r = +clamp(rt, 3.5, 10).toFixed(1);
    P.me[0]++; P.me[1] += me.g; P.me[2] += me.a; if (me.cs && (DEF.includes(pos) || pos==="CDM")) P.me[3]++;
  }
  // the goals: yours, then your team-mates' (not your place in the XI when you played), then theirs
  const xi = sqSquad(P.meClub), on = xi.map(()=>true), u = sqSlotOf(pos); if (me.mins) on[u] = false;
  const team = Math.max(0, gf - me.g);
  for (let k=0;k<team;k++){ const s = sqPick(xi, on, 0, -1); cpCredit(P, P.meClub, s, 0); if (k>=me.a && Math.random()<.72) cpCredit(P, P.meClub, sqPick(xi, on, 1, s), 1); }
  cpSide(P, c.opp, ga);
  P.mine.push({round:c.round, opp:c.opp, gf, ga, pens:f.res.pens, mins:me.mins, g:me.g, a:me.a, r:me.r});
  // the matchday or the round is done
  const mine = [P.meClub, c.opp, gf, ga];
  if (!c.ko){
    P.gr.push([...c.others, mine]); P.cur = null;
    if (P.gr.length===3){ tQualify(P); if (!P.br.includes(P.meClub)) P.out = {reached:"Group stage"}; }
  } else {
    const ties = [...c.others, [P.meClub, c.opp, gf, ga, pens]], won = gf>ga || pens===1;
    // in bracket order: the winners go on in the places they played from
    const next = []; for (let j=0;j<P.br.length;j+=2){ const t = ties.find(x=>x[0]===P.br[j] || x[1]===P.br[j]); next.push(t ? (t[2]>t[3] || (t[2]===t[3] && t[4]===1) ? t[0] : t[1]) : P.br[j]); }
    P.ko[c.i] = ties; P.br = next; P.kr = c.i + 1; P.cur = null;
    const rounds = TOUR_FMT[S.tourney.key].rounds;
    if (!won) P.out = {reached:c.i + 1===rounds.length - 1 ? "Runners-up" : rounds[c.i + 1], lostTo:c.opp};
    if (P.br.length===1) P.win = P.br[0];
  }
  return f;
}
// the rest of the tournament once you're out (or it's over): every round to the final
function tFinish(P){
  if (P.cur && !P.out && !P.win) return;
  if (P.gr.length<3){ while (P.gr.length<3){ const md = P.gr.length, games = []; P.G.forEach(grp=>T_MD[md].forEach(([i, j])=>{ if (grp[i] && grp[j]) games.push([grp[i], grp[j], ...tGame(P, grp[i], grp[j]).slice(0, 2)]); })); P.gr.push(games); } tQualify(P); }
  while (!P.win && P.br && P.br.length>1){
    const ties = []; for (let j=0;j<P.br.length;j+=2) ties.push([P.br[j], P.br[j+1], ...tGame(P, P.br[j], P.br[j+1], true)]);
    P.ko[P.kr] = ties; P.br = ties.map(t=>t[2]>t[3] || (t[2]===t[3] && t[4]===1) ? t[0] : t[1]); P.kr++;
  }
  if (!P.win && P.br) P.win = P.br[0];
}
// your next game: played live with key moments, or simmed
async function tPlay(live){
  const P = tGet(), c = tNext(P); if (!c) return;
  const f = tFixture(P);
  if (live && f.me.mins) await tPlayLive(P, f); else tResolve(P, f);
  save(); render();
}
// every game you've got left, simmed, then on to the summer window
function tSimRest(){
  const P = tGet(); if (!P) return;
  let guard = 0; while (tNext(P) && guard++<12) tResolve(P, tFixture(P));
  tDone();
}
// the tournament's over for you: the rest is played out, and the aftermath (game.js)
function tDone(){
  const T = S.tourney, P = tGet(); if (!P) return;
  tFinish(P);
  const won = P.win===P.meClub, rounds = TOUR_FMT[T.key].rounds;
  const reached = won ? "Winners" : P.out ? P.out.reached : P.win ? "Runners-up" : rounds[Math.min(P.kr + 1, rounds.length - 1)];
  tourDone(T, {apps:P.me[0], g:P.me[1], a:P.me[2], cs:P.me[3]}, {won, reached, games:P.mine.length}, P.win && !won ? P.win : null);
}

/* ---------- your games, live (moments.js) ---------- */
async function tPlayLive(P, f){
  const X = tXg(P, f), me = f.me, plan = lvPlan(f, X), T = S.tourney, us = P.meClub;
  const ev = [], rest = (n, mine) => { for (let i=0;i<n;i++) ev.push({min:1 + Math.floor(Math.random()*90), us:mine}); };
  rest(mcPoisson(Math.max(0, X.lf - plan.eF)), true); rest(mcPoisson(Math.max(0, X.la - plan.eA)), false);
  const st = {f, X, ev, g:0, a:0, og:0, bonus:0, left:plan.list.length, log:[], us, intl:true};
  const [home, away] = f.home || f.neutral ? [us, f.opp] : [f.opp, us];
  lvOpen("International");
  try{
    let go;
    while ((go = await lvAsk(`<div class="lv-card">
        <div class="lv-eye">★ ${esc(T.name)} · ${esc(f.round)}</div>
        <div class="lv-teams"><span>${clubBadge(home, 34)}${esc(home)}</span><i>v</i><span>${clubBadge(away, 34)}${esc(away)}</span></div>
        <p>${me.st==="start" ? `You start for ${esc(us)}.` : `You start on the bench and come on around the ${ord(90 - me.mins)} minute.`}
          ${plan.list.length} key moment${plan.list.length===1 ? "" : "s"} will come your way.${f.oppStr>X.base + 4 ? " They're the stronger side: make them count." : ""}</p>
        <div class="lv-row"><button type="button" class="btn primary big" data-lv="play" data-lv-focus>Play key moments</button><button type="button" class="btn" data-lv="sim">Sim the match</button></div>
        <button type="button" class="lv-skip" data-lv="help" style="justify-self:start">How to play</button>
      </div>`))==="help") await lvHelp(lvHelpAll(), false);
    if (go==="play"){
      let auto = false;
      for (const m of plan.list){
        let R = null;
        if (!auto){ if (!lvSeen()[lvHelpKey(m)]) await lvHelp([lvHelpKey(m)], true); R = await LV_GAMES[m.g](st, m); if (R==="skip") auto = true; }
        if (auto){ lvApply(st, m, lvAuto(st, m)); st.left--; continue; }
        lvApply(st, m, R); await lvOutcome(st, R); st.left--;
      }
      const D = P.cur.ko && st.ev.filter(e=>e.us).length===st.ev.filter(e=>!e.us).length ? await lvDecider(st, s2 => s2.ev.filter(e=>e.us).length===s2.ev.filter(e=>!e.us).length) : {};
      tResolve(P, f, {gf:ev.filter(e=>e.us).length, ga:ev.filter(e=>!e.us).length, g:st.g, a:st.a, og:st.og, bonus:st.bonus, et:D.et, pens:D.pens});
      f.coins = lvCoins(f).total; Account.addCoins(f.coins);
    } else tResolve(P, f);
    save();
    const [l, r] = f.home || f.neutral ? [f.res.gf, f.res.ga] : [f.res.ga, f.res.gf];
    const bits = [me.g ? `${me.g} goal${me.g>1 ? "s" : ""}` : "", me.a ? `${me.a} assist${me.a>1 ? "s" : ""}` : "", me.cs && (DEF.includes(S.player.pos) || S.player.pos==="CDM") ? "clean sheet" : ""].filter(Boolean);
    const next = P.out ? (P.out.reached==="Group stage" ? `${esc(us)} are out in the group stage.` : `${esc(us)} are out.`) : P.win===us ? `${esc(us)} are champions!` : P.gr.length===3 && !P.cur && P.kr===0 && f.round.startsWith("Group") ? `${esc(us)} are through to the ${esc(TOUR_FMT[T.key].rounds[1])}!` : "";
    await lvAsk(`<div class="lv-card lv-ftc">
      <div class="lv-eye">Full time${f.res.pens ? ` · ${f.res.pens==="won" ? "won" : "lost"} on penalties` : ""} · ${esc(f.round)}</div>
      <div class="lv-ft"><span>${clubBadge(home, 44)}<em>${esc(home)}</em></span><b>${l}–${r}</b><span>${clubBadge(away, 44)}<em>${esc(away)}</em></span></div>
      ${me.mins ? `<div class="lv-rate"><span class="label">Your rating</span><b class="${me.r>=7.5 ? "hi" : me.r<6 ? "lo" : ""}">${me.r}</b><span>${bits.join(" · ") || "No goal involvement"}</span></div>` : ""}
      ${f.coins!=null ? `<div class="lv-coins"><i class="coin" aria-hidden="true"></i><b>${f.coins>=0 ? "+" : ""}${f.coins}</b><span>${lvCoins(f).parts.map(([t, n])=>`${esc(t)} ${n>=0 ? "+" : ""}${n}`).join(" · ")}</span></div>` : ""}
      ${next ? `<p class="lv-potm-by"><b>${next}</b></p>` : ""}
      <button type="button" class="btn primary big" data-lv="ok" data-lv-focus>Continue</button></div>`);
  } finally { lvClose(); }
}

/* ---------- what you see ---------- */
function tTableHTML(P, g){
  const T = tTable(P, g), me = P.meClub, done = P.gr.length===3;
  return `<div class="tablewrap"><table class="lt lg-t t-grp"><thead><tr><th></th><th class="n">#</th><th>Group ${tLetter(g)}</th><th class="n">P</th><th class="n">W</th><th class="n">D</th><th class="n">L</th><th class="n">GD</th><th class="n">Pts</th></tr></thead><tbody>
    ${T.map((x, i)=>`<tr class="${x.n===me ? "me" : ""}"><td class="z ${done && P.br && (P.br.includes(x.n) || P.ko.some(r=>r && r.some(t=>t.includes(x.n)))) ? "z-up" : i<2 ? "z-po" : ""}"></td><td class="n">${i+1}</td><td><span class="lg-club">${clubBadge(x.n, 18)}<span class="lg-cn">${esc(x.n)}</span></span></td>
      <td class="n">${x.p}</td><td class="n">${x.w}</td><td class="n">${x.d}</td><td class="n">${x.l}</td><td class="n">${x.gf - x.ga>0 ? "+" : ""}${x.gf - x.ga}</td><td class="n"><b>${x.pts}</b></td></tr>`).join("")}
  </tbody></table></div>`;
}
function tTieText(t){
  return `<span>${clubBadge(t[0], 16)} ${esc(t[0])}</span><b>${t[2]}–${t[3]}</b><span>${esc(t[1])} ${clubBadge(t[1], 16)}</span>${t[4] ? `<small>${esc(t[t[4]-1])} win on penalties</small>` : ""}`;
}
function tBracketHTML(P){
  const R = TOUR_FMT[S.tourney.key].rounds, me = P.meClub;
  const done = P.ko.map((ties, i)=>ties ? `<p class="label" style="margin:12px 0 6px">${esc(R[i + 1])}</p><ul class="lg-res">${ties.map(t=>`<li class="${t[0]===me || t[1]===me ? "me" : ""}">${tTieText(t)}</li>`).join("")}</ul>` : "").join("");
  const nextPairs = P.br && P.br.length>1 && !P.win ? `<p class="label" style="margin:12px 0 6px">${esc(R[P.kr + 1])} · drawn</p><ul class="lg-res">${[...Array(P.br.length/2)].map((_, j)=>{ const h = P.br[2*j], a = P.br[2*j+1];
    return `<li class="${h===me || a===me ? "me" : ""}"><span>${clubBadge(h, 16)} ${esc(h)}</span><b>v</b><span>${esc(a)} ${clubBadge(a, 16)}</span></li>`; }).join("")}</ul>` : "";
  return done + nextPairs || `<p class="hint">The knockouts start after the group stage: the top two in each group${P.K>P.G.length*2 ? ` and the ${P.K - P.G.length*2} best third-placed sides` : ""} go through.</p>`;
}
// the tournament screen (game.js's tournamentPanel): your next game, your group, the knockouts and the scorers
function tPanelHTML(T, roleHint){
  const P = tGet(), c = tNext(P), me = P.meClub, g0 = tGroupOf(P, me), F = TOUR_FMT[T.key];
  const top = cpLeaders(P, 0), mine = top.findIndex(p=>p.me);
  const row = p => `<li class="${p.me ? "me" : ""}"><span class="lg-rk">${p.rank}</span>${clubBadge(p.club, 18)}<span class="lg-who"><b class="${p.me ? "me-name" : ""}">${esc(p.name)}</b><small>${esc(p.club)}</small></span><span class="lg-v">${p.n}</span></li>`;
  const sel = c && (c.me.st==="start" ? "You're in the starting line-up." : c.me.st==="sub" ? `You'll come off the bench, around the ${ord(90 - c.me.mins)} minute.` : "You're on the bench and won't get on in this one.");
  const results = P.mine.map(x=>`<li><span>${esc(x.round)}</span><span>${clubBadge(x.opp, 16)} ${esc(x.opp)}</span><b>${x.gf}–${x.ga}${x.pens ? ` (${x.pens==="won" ? "won" : "lost"} on pens)` : ""}</b><small>${x.mins ? `${x.r.toFixed(1)} · ${[x.g ? `${x.g}G` : "", x.a ? `${x.a}A` : ""].filter(Boolean).join(" ") || "played"}` : "didn't play"}</small></li>`).join("");
  const over = !c;
  const verdict = P.win===me ? `${esc(me)} are champions!` : P.out ? (P.out.reached==="Group stage" ? `${esc(me)} went out in the group stage.` : P.out.reached==="Runners-up" ? `${esc(me)} lost the final to ${esc(P.out.lostTo)}.` : `${esc(me)} went out in the ${esc(P.out.reached.toLowerCase())} to ${esc(P.out.lostTo)}.`) : "";
  return `<p class="hint">${roleHint} ${T.winter ? "It's played in the middle of the season: you're back with your club afterwards, a few weeks into the second half." : "The summer transfer window opens afterwards."}</p>
    <p class="hint">${F.rounds.join(" → ")} · ${P.n.length} nations, ${P.G.length} groups of four</p>
    ${over ? `<div class="t-next done"><b>${verdict}</b><span class="hint">You played ${P.me[0]} game${P.me[0]===1 ? "" : "s"}: ${P.me[1]} goal${P.me[1]===1 ? "" : "s"}, ${P.me[2]} assist${P.me[2]===1 ? "" : "s"}.</span>
        <button type="button" class="btn primary" data-act="tour-done">${P.win===me ? "Lift the trophy" : T.winter ? "Back to your club" : "On to the summer window"}</button></div>`
      : `<div class="t-next"><span class="label">Next · ${esc(c.round)}</span><div class="t-vs">${clubBadge(me, 30)}<b>${esc(me)}</b><i>v</i><b>${esc(c.opp)}</b>${clubBadge(c.opp, 30)}</div>
        <span class="hint">${sel}</span>
        <div class="row">${c.me.mins ? `<button type="button" class="btn primary" data-act="tour-play">Play key moments</button>` : ""}<button type="button" class="btn ${c.me.mins ? "" : "primary"}" data-act="tour-simgame">Sim the match</button></div>
        <button type="button" class="linkbtn" data-act="tour-sim" style="justify-self:start">Sim the rest of the tournament</button></div>`}
    ${results ? `<p class="label" style="margin:14px 0 6px">Your games</p><ul class="t-mine">${results}</ul>` : ""}
    ${subTabs("tour", [
      g0>=0 && ["group", `Group ${tLetter(g0)}`, tTableHTML(P, g0)],
      ["ko", "Knockouts", tBracketHTML(P)],
      ["groups", "All groups", P.G.map((_, g)=>tTableHTML(P, g)).join("")],
      top.length && ["top", "Top scorers", `<ol class="lg-lead cp-top">${top.slice(0, 8).map(row).join("")}${mine>=8 ? row(top[mine]) : ""}</ol>`]
    ])}`;
}
