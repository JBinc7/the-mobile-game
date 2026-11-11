/* ================= MANAGER CAREER: THE WORLD =================
   Manager mode: take charge of any club in the game's twelve leagues and run it, in the spirit of Football Manager
   and the career modes of FIFA 17 and EA FC 26. This file is the world and the season; mgui.js draws the screens and
   mgmatch.js plays the matches.
   - The world: every club in the game's leagues, with a level (its best XI's average rating, on a FIFA-style scale),
     a stature and, for the clubs in your league, a full squad of players with attributes, contracts, wages, morale,
     fitness, form and potential. Clubs outside your league keep a squad drawn from their name and the season
     (mgVirtual), so they cost nothing to save; a player only joins the save when someone signs him.
   - The season: July to June, day by day. Every league is played round by round (yours in full detail, the others
     from each club's level), with the domestic cups, the three European competitions and the EFL play-offs, on real
     weekdays. Continue moves on to the next thing that needs you.
   - Running the club: tactics and team selection, training, transfers (scouting, bids, contracts, loans, releases,
     offers for your players), finances (transfer and wage budgets), the youth academy, the board's objectives and
     its confidence in you, random events, and the job market.
   Saves live under the signed-in account, one per slot (hub.js). Loaded after europe.js and squads.js. */
let M = null, MG_KEY = "", MG_SLOT = 0;
const MG_V = 1;
const MG_PLAYABLE = [1, 2, 3, 4, 5, "ES", "DE", "IT", "FR", "POR", "NED", "SCO"];
// a club's best XI on average, for the weakest and strongest club in each league
const MG_RANGE = {1:[72,85], 2:[63,71], 3:[58,65], 4:[54,61], 5:[49,56], 6:[44,51], ES:[68,86], DE:[67,85], IT:[68,84], FR:[66,85], POR:[62,81], NED:[62,79], SCO:[58,77],
  ES2:[61,68], DE2:[61,68], IT2:[61,67], FR2:[60,67], POR2:[56,63], NED2:[55,62], SCO2:[52,59]};
// the transfer budget of the biggest club in each league (smaller clubs get less, steeply), the typical weekly wage at
// the league's middle, the ground's size [base, more at the biggest club], a ticket, TV money for a season
const MG_TB = {1:180e6, 2:18e6, 3:3e6, 4:.8e6, 5:.2e6, 6:.05e6, ES:160e6, DE:140e6, IT:130e6, FR:120e6, POR:40e6, NED:35e6, SCO:15e6, ES2:6e6, DE2:6e6, IT2:5e6, FR2:5e6, POR2:1.5e6, NED2:1.5e6, SCO2:.6e6};
const MG_WAGE = {1:45000, 2:9000, 3:3500, 4:2000, 5:900, 6:400, ES:35000, DE:32000, IT:30000, FR:25000, POR:8000, NED:7000, SCO:4500, ES2:5000, DE2:5000, IT2:4500, FR2:4000, POR2:1500, NED2:1500, SCO2:800};
const MG_CAP = {1:[20000,55000], 2:[12000,22000], 3:[6000,14000], 4:[4000,8000], 5:[2000,4000], ES:[15000,70000], DE:[20000,60000], IT:[15000,60000], FR:[15000,35000], POR:[8000,45000], NED:[8000,45000], SCO:[6000,50000]};
const MG_TICKET = {1:48, 2:28, 3:22, 4:20, 5:15, ES:38, DE:30, IT:32, FR:28, POR:18, NED:22, SCO:24};
const MG_TV = {1:35e6, 2:4e6, 3:1.6e6, 4:1e6, 5:.15e6, ES:12e6, DE:13e6, IT:13e6, FR:10e6, POR:1e6, NED:1e6, SCO:.5e6};
// commercial income for the biggest club in each league (sponsors, shirts, tours): far more for the giants
const MG_COM = {1:150e6, 2:8e6, 3:1e6, 4:.4e6, 5:.1e6, ES:130e6, DE:110e6, IT:100e6, FR:120e6, POR:30e6, NED:25e6, SCO:20e6};
const mgCommercial = club => { const t = mgTierOf(club); return (MG_TV[t] || 2e5)*.1 + (MG_COM[t] || 1e5)*Math.pow(clamp((mgRep(club) - .55)/.45, 0, 1.1), 3); };
const MG_NAT3 = {England:"ENG", Scotland:"SCO", Wales:"WAL", Ireland:"IRL", Spain:"ESP", Germany:"GER", Italy:"ITA", France:"FRA", Portugal:"POR", Netherlands:"NED", Belgium:"BEL",
  Denmark:"DEN", Norway:"NOR", Sweden:"SWE", Poland:"POL", Czechia:"CZE", Croatia:"CRO", Serbia:"SRB", Hungary:"HUN", Greece:"GRE", Ukraine:"UKR", Turkey:"TUR", Azerbaijan:"AZE",
  Brazil:"BRA", Argentina:"ARG", Uruguay:"URU", Colombia:"COL", USA:"USA", Nigeria:"NGA", Ghana:"GHA", Senegal:"SEN", "Ivory Coast":"CIV", Morocco:"MAR", Japan:"JPN", "South Korea":"KOR"};
const mgNat3 = n => MG_NAT3[n] || String(n||"").slice(0, 3).toUpperCase();

/* ---------- positions and attributes ---------- */
const MG_ATT = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"], MG_GKATT = ["DIV", "HAN", "KIC", "REF", "SPD", "POS"];
const MG_ATT_LONG = {PAC:"Pace", SHO:"Shooting", PAS:"Passing", DRI:"Dribbling", DEF:"Defending", PHY:"Physical", DIV:"Diving", HAN:"Handling", KIC:"Kicking", REF:"Reflexes", SPD:"Speed", POS:"Positioning"};
// how much each attribute counts towards a position's overall
const MG_W = {ST:[.2,.45,.05,.15,0,.15], LW:[.3,.2,.15,.3,0,.05], RW:[.3,.2,.15,.3,0,.05], LM:[.25,.1,.25,.3,.05,.05], RM:[.25,.1,.25,.3,.05,.05],
  CAM:[.1,.2,.3,.35,0,.05], CM:[.05,.1,.4,.2,.15,.1], CDM:[.05,0,.25,.1,.4,.2], LB:[.25,0,.15,.1,.35,.15], RB:[.25,0,.15,.1,.35,.15],
  LWB:[.25,.02,.2,.18,.25,.1], RWB:[.25,.02,.2,.18,.25,.1], CB:[.1,0,.05,0,.6,.25]};
const MG_GKW = [.22,.2,.08,.25,.05,.2];
// each position's usual shape around its overall, before it's levelled to the overall
const MG_SHAPE = {ST:[4,6,-8,2,-42,1], LW:[8,-2,-3,5,-45,-12], RW:[8,-2,-3,5,-45,-12], LM:[5,-8,0,3,-30,-10], RM:[5,-8,0,3,-30,-10], CAM:[0,0,4,6,-40,-14],
  CM:[-6,-8,4,0,-6,-3], CDM:[-10,-18,-2,-8,4,4], LB:[5,-25,-6,-5,-1,-2], RB:[5,-25,-6,-5,-1,-2], LWB:[6,-20,-3,0,-6,-4], RWB:[6,-20,-3,0,-6,-4], CB:[-10,-35,-14,-20,4,5]};
const MG_GKSHAPE = [1,-1,-6,2,-15,0];
// how well a player fits a position that isn't his own (a penalty to his overall there)
const MG_FAM = {GK:{}, CB:{CDM:4, RB:6, LB:6}, LB:{LWB:1, LM:4, RB:5, CB:5, RWB:6}, RB:{RWB:1, RM:4, LB:5, CB:5, LWB:6}, LWB:{LB:1, LM:2, RWB:4}, RWB:{RB:1, RM:2, LWB:4},
  CDM:{CM:2, CB:4}, CM:{CDM:2, CAM:2, LM:5, RM:5}, CAM:{CM:2, ST:5, LW:4, RW:4}, LM:{LW:2, LWB:3, CM:5, RM:4}, RM:{RW:2, RWB:3, CM:5, LM:4},
  LW:{LM:2, RW:3, ST:4, CAM:4}, RW:{RM:2, LW:3, ST:4, CAM:4}, ST:{CAM:4, LW:4, RW:4}};
const MG_GROUP = pos => pos==="GK" ? "GK" : ["CB","LB","RB","LWB","RWB"].includes(pos) ? "DEF" : ["CDM","CM","CAM","LM","RM"].includes(pos) ? "MID" : "ATT";

function mgOvrAt(p, pos){
  if (!p) return 0;
  if (pos==="GK") return p.pos==="GK" ? Math.round(p.at.reduce((s, v, i)=>s + v*MG_GKW[i], 0)) : 20;
  if (p.pos==="GK") return 25;
  const w = MG_W[pos] || MG_W.CM; let v = p.at.reduce((s, x, i)=>s + x*w[i], 0);
  if (pos!==p.pos) v -= (p.alt||[]).includes(pos) ? 1 : (MG_FAM[p.pos] && MG_FAM[p.pos][pos]) ?? 10;
  return Math.round(v);
}
const mgOvr = p => mgOvrAt(p, p.pos);

/* ---------- money ---------- */
const mgMoney = v => { v = Math.round(v||0); const s = v<0 ? "−" : ""; v = Math.abs(v); return s + (v>=1e9 ? "£" + (v/1e9).toFixed(2) + "bn" : v>=1e6 ? "£" + (v>=1e8 ? Math.round(v/1e6) : (Math.round(v/1e5)/10)) + "m" : v>=1e3 ? "£" + Math.round(v/1e3) + "k" : "£" + v); };
const mgWageTxt = w => mgMoney(w) + "/wk";
const mgRoundFee = v => { const s = v<1e5 ? 5e3 : v<1e6 ? 25e3 : v<5e6 ? 1e5 : v<20e6 ? 5e5 : v<60e6 ? 1e6 : 5e6; return Math.max(5e3, Math.round(v/s)*s); };
const mgRoundWage = w => { const s = w<1000 ? 50 : w<10000 ? 250 : w<100000 ? 1000 : 5000; return Math.max(100, Math.round(w/s)*s); };
function mgValue(p){
  const o = mgOvr(p), age = p.age, gap = Math.max(0, p.pot - o);
  let v = 120e6*Math.exp((o - 90)/5.1);
  v *= age<=21 ? Math.min(2.4, 1 + gap*.06) : age<=25 ? 1 + gap*.03 : age<=29 ? 1 : age===30 ? .8 : age===31 ? .65 : age===32 ? .5 : age===33 ? .38 : .25;
  v *= p.pos==="GK" ? .75 : MG_GROUP(p.pos)==="DEF" ? .9 : p.pos==="CDM" ? .95 : 1;
  const yl = p.con - M.season; v *= yl<=0 ? .55 : yl===1 ? .8 : yl===2 ? .92 : 1;
  return mgRoundFee(Math.max(1e4, v));
}
// what a player would expect to earn at a club in league t: more the better he is for that league
function mgWageAt(p, t){ const R = MG_RANGE[t] || MG_RANGE[3], mid = (R[0] + R[1])/2, span = Math.max(3, (R[1] - R[0])/2);
  const base = (MG_WAGE[t] || 2000)*Math.exp(clamp((mgOvr(p) - mid)/span, -2.2, 2.1)*1.05);
  const age = p.age<=18 ? .25 : p.age<=20 ? .55 : p.age<=22 ? .8 : 1;
  return mgRoundWage(base*age); }

/* ---------- random ---------- */
const mgR = seed => seeded(hashStr(String(seed)));
const mgPick = (R, a) => a[Math.floor(R()*a.length)];
const mgGauss = R => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };

/* ---------- clubs ---------- */
function mgTierOf(club){ if (!M) return null; if (!M._tier){ M._tier = {}; for (const t in M.tiers) M.tiers[t].forEach(c=>{ M._tier[c] = keyOf(t); }); } return M._tier[club] ?? null; }
function mgRep(club){ return M.rep[club] ?? (META[club] ? META[club].r : .7); }
const mgEuroClub = club => !META[club];
function mgEuroLevel(club){ const e = [...EU_EXTRA, ...Object.values(EURO).flatMap(x=>x.teams)].find(x=>x.n===club); return e ? e.str - 2 : 66; }
// the level a club's squad is built around, in its league now
function mgBaseLevel(club){
  if (mgEuroClub(club)) return mgEuroLevel(club);
  const t = mgTierOf(club), R = MG_RANGE[t] || MG_RANGE[6];
  return R[0] + clamp((mgRep(club) - .6)/.4, -.2, 1.12)*(R[1] - R[0]);
}
// how strong a club is this season (its XI's level): worked out from the squad for clubs in full detail
function mgLevel(club){
  if (M.cl[club]){ const k = `${club}|${M.day}`; M._lv ||= {}; if (M._lv[k]==null){ const xi = mgAutoXI(club, M.cl[club].f || "4-3-3"); M._lv[k] = xi.lv; } return M._lv[k]; }
  return M.vs[club] ?? mgBaseLevel(club);
}
const mgCountry = club => { const t = mgTierOf(club); return t!=null ? TIERS[t].country : (SQ_CLUB_NAT[club] || "Europe"); };
const mgCapacity = club => { const t = mgTierOf(club), c = MG_CAP[t] || [1500, 3000], r = clamp((mgRep(club) - .55)/.45, 0, 1.1); return Math.round((c[0] + c[1]*r*r)/500)*500; };
const mgStars = club => { const r = mgRep(club), t = mgTierOf(club), lvl = TIERS[t] ? TIERS[t].level : 1, top = isTop(t);
  const v = (top ? 3 : 2.2 - (lvl - 2)*.45) + (r - .75)*6*(top ? 1 : .5); return clamp(Math.round(v*2)/2, .5, 5); };
function mgStarsHTML(n){ let s = ""; for (let i = 1; i<=5; i++) s += `<i class="mg-star ${n>=i ? "on" : n>=i - .5 ? "half" : ""}" aria-hidden="true"></i>`; return `<span class="mg-stars" role="img" aria-label="${n} stars">${s}</span>`; }

/* ---------- people ---------- */
function mgNatFor(R, club){
  if (SQ_CLUB_NAT[club]) return R()<.6 ? SQ_CLUB_NAT[club] : mgPick(R, SQ_FOREIGN);
  const t = mgTierOf(club), home = t!=null ? TIERS[t].country : "England", dom = SQ_DOMESTIC[t] ?? .7;
  if (R()<dom) return home;
  const pool = t!=null && TIERS[t].country==="England" && TIERS[t].level>=3 ? SQ_NEAR : SQ_FOREIGN;
  let n; do { n = mgPick(R, pool); } while (n===home); return n;
}
function mgName(R, nat){ const [F, L] = sqNames(nat); return `${mgPick(R, F)} ${mgPick(R, L)}`; }
const mgShort = n => { const w = String(n).split(" "); return w.length>1 ? `${w[0][0]}. ${w.slice(1).join(" ")}` : n; };
const mgSurname = n => { const w = String(n).split(" ").slice(1).join(" "); return w || n; };
const MG_DARK = new Set(["Nigeria","Ghana","Senegal","Ivory Coast","Brazil","USA","France","Colombia","Netherlands","Belgium","England","Portugal"]);
function mgLook(R, nat){
  const dark = ["Nigeria","Ghana","Senegal","Ivory Coast"].includes(nat) ? .85 : MG_DARK.has(nat) ? .3 : ["Morocco","Turkey","Brazil","Argentina","Uruguay","Colombia","Spain","Italy","Portugal","Greece","Azerbaijan"].includes(nat) ? .12 : .04;
  const skin = R()<dark ? 3 + Math.floor(R()*2) : ["Japan","South Korea"].includes(nat) ? 1 : Math.floor(R()*3);
  const hc = skin>=3 || R()<.55 ? "Black" : mgPick(R, ["Brown","Brown","Blonde","Ginger","Black"]);
  return {s:skin, h:Math.floor(R()*6), c:hc, b:R()<.3 ? 1 : 0};
}
// a player built around an overall at a position; R makes him the same every time for the same seed
function mgMakePlayer(R, o){
  const pos = o.pos, gk = pos==="GK", w = gk ? MG_GKW : MG_W[pos], shape = gk ? MG_GKSHAPE : MG_SHAPE[pos];
  let at = shape.map(s=>o.ovr + s + (R() - .5)*10);
  const cur = at.reduce((s, v, i)=>s + v*w[i], 0);
  at = at.map(v=>Math.round(clamp(v + o.ovr - cur, 12, 99)));
  const age = o.age, room = age<=17 ? 10 + R()*16 : age<=19 ? 7 + R()*14 : age<=21 ? 4 + R()*11 : age<=23 ? 1 + R()*7 : age<=26 ? R()*3.5 : 0;
  const pot = Math.round(clamp(o.ovr + room*(o.gem ? 1.6 : 1), o.ovr, 95));
  const fam = Object.entries(MG_FAM[pos] || {}).filter(([, v])=>v<=2).map(([k])=>k), alt = [];
  fam.forEach(k=>{ if (R()<.45 && alt.length<2) alt.push(k); });
  const left = ["LB","LWB","LM","LW"].includes(pos) ? .7 : ["RB","RWB","RM","RW"].includes(pos) ? .08 : .22;
  const nat = o.nat || "England";
  return {id:o.id, n:o.n || mgName(R, nat), nat, pos, alt, age, at, pot, ft:R()<left ? "L" : "R", club:o.club || null, num:0, wage:0, con:0,
    mor:Math.round(62 + R()*16), fit:100, form:[], inj:null, ban:0, ycc:0, xp:0, st:mgStat(), lg:mgStat(), car:{ap:0, g:0, a:0}, role:2, joined:M ? M.season : 2026};
}
const mgStat = () => ({ap:0, st:0, g:0, a:0, cs:0, mins:0, rs:0, rn:0, yc:0, rc:0, potm:0});
const MG_TEMPLATE = ["GK","GK","GK","CB","CB","CB","CB","LB","LB","RB","RB","CDM","CDM","CM","CM","CM","CAM","LM","RM","LW","RW","ST","ST","ST"];
// the first-choice place of each position in a squad: [position, how many start]
const MG_STARTERS = {GK:1, CB:2, LB:1, RB:1, CDM:1, CM:2, CAM:1, LM:0, RM:0, LW:1, RW:1, ST:1};
// a whole squad for a club around its level: the first XI near it, one star, back-ups below, a few prospects
function mgGenSquad(club, seed, level, small){
  const R = mgR(seed), out = [], seen = {};
  let tpl = MG_TEMPLATE.slice(); if (small) tpl.splice(tpl.indexOf("CAM"), 1), tpl.splice(tpl.lastIndexOf("GK"), 1);
  tpl.push(mgPick(R, ["CM","ST","CB","LW"]));
  const stars = 1 + (R()<.25 ? 1 : 0); let starsLeft = stars;
  tpl.forEach((pos, i)=>{
    const k = seen[pos] = (seen[pos]||0) + 1, starter = k<=(MG_STARTERS[pos] ?? 0) || (pos==="CB" && k<=2);
    let ovr, age;
    if (starter){ ovr = level - 1.2 + mgGauss(R)*2; age = 22 + Math.floor(R()*10); if (starsLeft && R()<.35){ ovr = level + 3 + R()*4; starsLeft--; } }
    else if (k<=(MG_STARTERS[pos] ?? 0) + 1 || R()<.6){ ovr = level - 3 + mgGauss(R)*2.5; age = 20 + Math.floor(R()*13); }
    else { ovr = level - 9 + mgGauss(R)*3.5; age = 17 + Math.floor(R()*4); }
    if (pos==="GK" && age<20) age += 3;
    const p = mgMakePlayer(R, {id:`${seed}#${i}`, pos, ovr:Math.round(clamp(ovr, 35, 93)), age, nat:mgNatFor(R, club), club, gem:age<=19 && R()<.12});
    out.push(p);
  });
  return out;
}
// a club outside your league, as it is this season (made from its name, not saved)
const mgVCache = new Map();
function mgVirtual(club){
  const key = `${M.seed}|${club}|${M.season}`;
  if (mgVCache.has(key)) return mgVCache.get(key);
  const t = mgTierOf(club), sq = mgGenSquad(club, `v:${key}`, M.vs[club] ?? mgBaseLevel(club), t!=null && TIERS[t].level>=3 && t!==3).filter(p=>!M.gone[p.id]);
  sq.forEach(p=>{ p.wage = mgWageAt(p, t ?? 1); p.con = M.season + 1 + Math.floor(mgR(p.id + "c")()*4); p.virt = 1; });
  mgNumbers(sq);
  if (mgVCache.size>300) mgVCache.clear();
  mgVCache.set(key, sq); return sq;
}
const MG_NUMS = {GK:[1,13,31], CB:[4,5,6,15,22], LB:[3,21], RB:[2,12], LWB:[3], RWB:[2], CDM:[6,16], CM:[8,14,18], CAM:[10,20], LM:[11,17], RM:[7,19], LW:[11,17], RW:[7,19], ST:[9,19,29,39]};
function mgNumbers(sq){
  const used = new Set(sq.filter(p=>p.num).map(p=>p.num));
  sq.filter(p=>!p.num).sort((a, b)=>mgOvr(b) - mgOvr(a)).forEach(p=>{ let n = (MG_NUMS[p.pos] || []).find(x=>!used.has(x)); if (!n){ n = 12; while (used.has(n)) n++; } p.num = n; used.add(n); });
}
// bring a club into full detail: its squad joins the save
function mgMaterialize(club){
  if (M.cl[club]) return M.cl[club];
  const t = mgTierOf(club), sq = mgVirtual(club);
  const ids = sq.map(v=>{ const p = {...v, id:"p" + (M.nid++), virt:undefined, st:mgStat(), lg:mgStat(), car:{ap:0, g:0, a:0}}; delete p.virt; M.gone[v.id] = 1; M.P[p.id] = p; return p.id; });
  M.cl[club] = {sq:ids, f:mgPick(mgR(club), ["4-3-3","4-2-3-1","4-4-2","4-3-3","4-1-2-1-2","3-5-2"]), mg:M.am[club] || mgAiManager(club)};
  M.am[club] = M.cl[club].mg;
  return M.cl[club];
}
function mgAiManager(club){ const R = mgR(`${M.seed}|mgr|${club}|${M.season}|${Object.keys(M.am).length}`), c = mgCountry(club); return mgName(R, SQ_NAMES[c] ? c : R()<.5 ? "England" : mgPick(R, SQ_FOREIGN)); }
const mgSquad = club => M.cl[club] ? M.cl[club].sq.map(id=>M.P[id]).filter(Boolean) : mgVirtual(club);
const mgMine = () => M.cl[M.club].sq.map(id=>M.P[id]).filter(Boolean);
const mgAvail = p => p && !p.inj && !(p.ban>0) && !p.loan;

/* ---------- formations and the XI ---------- */
// slots as [position, x across (0 left, 1 right), y up the pitch (0 your goal, 1 theirs)]
const MG_FORM = {
  "4-3-3":[["GK",.5,.04],["LB",.12,.24],["CB",.37,.18],["CB",.63,.18],["RB",.88,.24],["CM",.3,.47],["CDM",.5,.38],["CM",.7,.47],["LW",.14,.74],["ST",.5,.82],["RW",.86,.74]],
  "4-2-3-1":[["GK",.5,.04],["LB",.12,.24],["CB",.37,.18],["CB",.63,.18],["RB",.88,.24],["CDM",.36,.4],["CDM",.64,.4],["LW",.15,.66],["CAM",.5,.62],["RW",.85,.66],["ST",.5,.84]],
  "4-4-2":[["GK",.5,.04],["LB",.12,.24],["CB",.37,.18],["CB",.63,.18],["RB",.88,.24],["LM",.12,.52],["CM",.37,.46],["CM",.63,.46],["RM",.88,.52],["ST",.38,.8],["ST",.62,.8]],
  "4-1-2-1-2":[["GK",.5,.04],["LB",.12,.24],["CB",.37,.18],["CB",.63,.18],["RB",.88,.24],["CDM",.5,.36],["CM",.3,.5],["CM",.7,.5],["CAM",.5,.64],["ST",.38,.82],["ST",.62,.82]],
  "4-5-1":[["GK",.5,.04],["LB",.12,.24],["CB",.37,.18],["CB",.63,.18],["RB",.88,.24],["LM",.12,.55],["CM",.32,.48],["CDM",.5,.38],["CM",.68,.48],["RM",.88,.55],["ST",.5,.82]],
  "3-5-2":[["GK",.5,.04],["CB",.26,.19],["CB",.5,.16],["CB",.74,.19],["LWB",.1,.46],["CM",.32,.5],["CDM",.5,.38],["CM",.68,.5],["RWB",.9,.46],["ST",.38,.8],["ST",.62,.8]],
  "3-4-3":[["GK",.5,.04],["CB",.26,.19],["CB",.5,.16],["CB",.74,.19],["LM",.12,.5],["CM",.38,.46],["CM",.62,.46],["RM",.88,.5],["LW",.18,.76],["ST",.5,.82],["RW",.82,.76]],
  "5-3-2":[["GK",.5,.04],["LWB",.09,.32],["CB",.3,.18],["CB",.5,.15],["CB",.7,.18],["RWB",.91,.32],["CM",.3,.5],["CDM",.5,.42],["CM",.7,.5],["ST",.38,.8],["ST",.62,.8]]
};
// a player's real level in a match: his overall there, his fitness, morale and form
function mgEff(p, pos){
  let v = mgOvrAt(p, pos);
  if (p.fit<80) v -= (80 - p.fit)*.12;
  v += (p.mor - 60)/20;
  v += mgxAdj(p);
  return v;
}
// the best XI a club can put out in a formation: the most important places first, then each place's best man
function mgAutoXI(club, f, pool){
  const slots = MG_FORM[f] || MG_FORM["4-3-3"], sq = (pool || mgSquad(club)).filter(mgAvail);
  const order = slots.map((s, i)=>i).sort((a, b)=>(slots[a][0]==="GK" ? -1 : 0) - (slots[b][0]==="GK" ? -1 : 0) || mgScarce(sq, slots[a][0]) - mgScarce(sq, slots[b][0]));
  const xi = Array(slots.length).fill(null), used = new Set();
  order.forEach(i=>{ let best = null, bv = -1; sq.forEach(p=>{ if (used.has(p.id)) return; const v = mgEff(p, slots[i][0]) - (p.fit<60 ? 6 : 0); if (v>bv){ bv = v; best = p; } }); if (best){ xi[i] = best; used.add(best.id); } });
  // swap any two whose places suit each other better
  for (let a = 0; a<xi.length; a++) for (let b = a + 1; b<xi.length; b++){ const A = xi[a], B = xi[b]; if (!A || !B) continue;
    if (mgEff(A, slots[b][0]) + mgEff(B, slots[a][0]) > mgEff(A, slots[a][0]) + mgEff(B, slots[b][0]) + .5){ xi[a] = B; xi[b] = A; } }
  const bench = sq.filter(p=>!used.has(p.id)).sort((a, b)=>mgOvr(b) - mgOvr(a));
  const subs = []; const gk = bench.find(p=>p.pos==="GK"); if (gk) subs.push(gk);
  bench.forEach(p=>{ if (subs.length<9 && !subs.includes(p)) subs.push(p); });
  const lv = xi.reduce((s, p, i)=>s + (p ? mgOvrAt(p, slots[i][0]) : 30), 0)/slots.length;
  return {xi, subs, lv:+lv.toFixed(1)};
}
function mgScarce(sq, pos){ return sq.filter(p=>p.pos===pos || (p.alt||[]).includes(pos)).length; }
// your XI, mended: anyone injured, banned or gone is replaced by the assistant, who tells you
function mgMendXI(quiet){
  const T = M.tac, slots = MG_FORM[T.f], mine = new Set(M.cl[M.club].sq), notes = [];
  T.xi = (T.xi||[]).slice(0, slots.length); while (T.xi.length<slots.length) T.xi.push(null);
  mgxReturn(T, slots, mine, notes, quiet);
  const used = new Set(T.xi.filter(Boolean));
  T.xi = T.xi.map((id, i)=>{
    const p = M.P[id];
    if (p && mine.has(id) && mgAvail(p)) return id;
    used.delete(id);
    if (p && mine.has(id) && (p.inj || p.ban>0)) (T.out ||= {})[i] = id;
    const cand = mgMine().filter(q=>mgAvail(q) && !used.has(q.id) && !T.xi.includes(q.id)).sort((a, b)=>mgEff(b, slots[i][0]) - mgEff(a, slots[i][0]))[0];
    if (cand){ used.add(cand.id); if (p && !quiet) notes.push(`${mgShort(cand.n)} in for ${mgShort(p.n)} (${p.inj ? "injured" : p.ban>0 ? "suspended" : "unavailable"})`); return cand.id; }
    return null;
  });
  T.bench = (T.bench||[]).filter(id=>mine.has(id) && mgAvail(M.P[id]) && !T.xi.includes(id));
  const extra = mgMine().filter(p=>mgAvail(p) && !T.xi.includes(p.id) && !T.bench.includes(p.id)).sort((a, b)=>mgOvr(b) - mgOvr(a));
  if (!T.bench.some(id=>M.P[id].pos==="GK")){ const g = extra.find(p=>p.pos==="GK"); if (g) T.bench.unshift(g.id); }
  while (T.bench.length<9 && extra.length){ const p = extra.shift(); if (!T.bench.includes(p.id)) T.bench.push(p.id); }
  T.bench = T.bench.slice(0, 9);
  if (!T.xi.includes(T.cap)) T.cap = T.xi.map(id=>M.P[id]).filter(Boolean).sort((a, b)=>(b.age + mgOvr(b)/3) - (a.age + mgOvr(a)/3))[0]?.id || null;
  return notes;
}
function mgPickBest(){ M.tac.out = {}; const A = mgAutoXI(M.club, M.tac.f, mgMine()); M.tac.xi = A.xi.map(p=>p ? p.id : null); M.tac.bench = A.subs.map(p=>p.id); mgMendXI(true); }

/* ---------- the calendar ---------- */
const MGD = (y, m, d) => Math.round(Date.UTC(y, m, d)/864e5);
const mgDate = day => new Date(day*864e5);
const mgDow = day => mgDate(day).getUTCDay();
function mgOn(y, m, d, dow){ let x = MGD(y, m, d); while (mgDow(x)!==dow) x++; return x; }
const MG_WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MG_MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function mgFmt(day, long){ const d = mgDate(day); return `${MG_WD[d.getUTCDay()]} ${d.getUTCDate()} ${MG_MO[d.getUTCMonth()]}${long ? " " + d.getUTCFullYear() : ""}`; }
const mgRounds = t => { const n = M.tiers[t].length; return t==="SCO" ? 3*(n - 1) : 2*(n - 1); };
// the days a league's rounds are played: Saturdays from August to May (not in the international breaks), with
// Tuesday nights added for the long leagues
function mgLeagueDays(t, Y){
  const R = mgRounds(t), top = TIERS[t].level===1;
  const start = mgOn(Y, 7, top ? 15 : 8, 6), end = top ? mgOn(Y + 1, 4, 16, 6) : mgOn(Y + 1, 3, 28, 6);
  const breaks = new Set([mgOn(Y, 8, 5, 6), mgOn(Y, 9, 10, 6), mgOn(Y, 10, 14, 6), mgOn(Y + 1, 2, 27, 6)]);
  let wk = []; for (let d = start; d<=end; d += 7) if (!breaks.has(d)) wk.push(d);
  if (wk.length>R){ const drop = wk.length - R, keep = new Set(); for (let k = 1; k<=drop; k++) keep.add(Math.round(k*wk.length/(drop + 1))); wk = wk.filter((d, i)=>!keep.has(i)); }
  else if (wk.length<R){ const need = R - wk.length, add = []; for (let k = 1; k<=need; k++) add.push(wk[Math.min(wk.length - 1, Math.round(k*(wk.length - 1)/(need + 1)))] + 3); wk = wk.concat(add); }
  return wk.sort((a, b)=>a - b);
}
// the round-robin: round r of a league whose clubs are in `list` (the circle method), [home, away] pairs
function mgPairs(list, r){
  const n = list.length, cyc = r % (n - 1), leg = Math.floor(r/(n - 1)), rest = list.slice(1);
  const rot = rest.slice(rest.length - cyc).concat(rest.slice(0, rest.length - cyc)), arr = [list[0], ...rot], out = [];
  for (let i = 0; i<n/2; i++){ let h = arr[i], a = arr[n - 1 - i]; if ((i===0 && cyc % 2) || (i>0 && i % 2)) [h, a] = [a, h]; if (leg % 2) [h, a] = [a, h]; out.push([h, a]); }
  return out;
}
// the cups: rounds, the day of each (two days for two legs), who joins when, and where it ends
function mgCupSpecs(country, Y){
  const W = (m, d, dow = 3) => mgOn(m>=12 ? Y + 1 : Y, m % 12, d, dow);
  if (country==="England") return [
    {code:"fa", name:"FA Cup", rounds:["1st Round","2nd Round","3rd Round","4th Round","5th Round","Quarter-final","Semi-final","Final"],
      days:[[W(10,4)],[W(11,2)],[W(12,6)],[W(12,27)],[W(13,24)],[W(14,17)],[W(15,25,0)],[W(16,22,6)]], neutral:6, join:{0:[3,4,5,"6+"], 2:[1,2]}},
    {code:"lc", name:"League Cup", rounds:["1st Round","2nd Round","3rd Round","4th Round","Quarter-final","Semi-final","Final"],
      days:[[W(7,19)],[W(8,2)],[W(8,23)],[W(9,28)],[W(11,16)],[W(12,13),W(13,3)],[W(14,14,0)]], neutral:6, join:{0:[2,3,4], 1:[1]}}];
  const t = Object.keys(TIERS).map(keyOf).find(k=>TIERS[k].country===country && TIERS[k].level===1), c = TIERS[t] && TIERS[t].cup;
  if (!c) return [];
  const n = c.rounds.length, first = W(9,28), last = W(16,12), days = c.rounds.map((_, i)=>[i===n - 1 ? W(16,19,6) : first + Math.round(i*(last - first)/Math.max(1, n - 1)/7)*7]);
  return [{code:c.code, name:c.name, rounds:c.rounds, days, neutral:n - 1, join:{0:[t, t + "2"]}}];
}
const MG_EU = {UCL:{name:"Champions League", md:8, dow:2}, UEL:{name:"Europa League", md:8, dow:4}, UECL:{name:"Conference League", md:6, dow:4}};
const MG_EU_KO = ["Knockout play-off","Round of 16","Quarter-final","Semi-final","Final"];
function mgEuDays(code, Y){
  const dow = MG_EU[code].dow, W = (m, d) => mgOn(m>=12 ? Y + 1 : Y, m % 12, d, dow);
  const md = [W(8,15),W(8,29),W(9,20),W(10,3),W(10,24),W(11,8),W(12,19),W(12,26)].slice(0, MG_EU[code].md);
  const fin = {UCL:mgOn(Y + 1, 4, 29, 6), UEL:mgOn(Y + 1, 4, 19, 3), UECL:mgOn(Y + 1, 4, 26, 3)}[code];
  return {md, ko:[[W(13,16),W(13,23)],[W(14,2),W(14,9)],[W(15,6),W(15,13)],[W(15,27),W(16,4)],[fin]]};
}

/* ---------- a new save ---------- */
function mgNewSave(prof){
  const seed = Math.random().toString(36).slice(2, 10);
  M = {v:MG_V, id:"m" + Date.now().toString(36), seed, created:Date.now(), updated:Date.now(),
    role:prof.role==="dof" ? "dof" : "mgr",
    mgr:{name:prof.name, nat:prof.nat, age:+prof.age||42, bg:prof.bg||"pro", rep:{sunday:22, semi:34, pro:46, intl:58, scout:34, analyst:36, player:50, business:40}[prof.bg] ?? 40, kit:prof.kit||0},
    club:null, season:2026, day:MGD(2026, 6, 1), done:false, phase:"new",
    tiers:{}, rep:{}, vs:{}, am:{}, cl:{}, P:{}, nid:1, gone:{},
    tab:{}, order:{}, res:{}, myres:[], cups:{}, eu:{}, po:{}, euroQ:{...EURO_2026},
    fin:null, board:null, inbox:[], nmid:1, kn:{}, short:[], scout:[], bids:[], yth:[], ysc:null, hist:[], trophies:[], car:{p:0, w:0, d:0, l:0, gf:0, ga:0},
    jobs:[], clubs:[], ev:null, chal:null, news:[], tl:[], aw:[], sacked:0};
  for (const t of ALLKEYS) M.tiers[t] = TIER_LISTS[t].slice();
  return M;
}
// season strengths: each club's level this season, near its usual one
function mgSeasonLevels(){
  const R = mgR(`${M.seed}|lv|${M.season}`);
  for (const t of ALLKEYS) M.tiers[t].forEach(c=>{ M.vs[c] = +(mgBaseLevel(c) + mgGauss(R)*1.1).toFixed(1); });
}
function mgTakeJob(club, first){
  const old = M.club;
  M.club = club; M._tier = null;
  const c = mgMaterialize(club);
  if (!mgDof()) c.mg = M.mgr.name;
  if (old && old!==club){ M.am[old] = mgAiManager(old); if (M.cl[old]) M.cl[old].mg = M.am[old]; }
  // the rest of your new league comes into full detail too
  const t = mgTierOf(club); M.tiers[t].forEach(n=>mgMaterialize(n));
  M.tac = {f:c.f || "4-3-3", xi:[], bench:[], ment:2, tempo:1, press:1, width:1, pass:1, line:1, cap:null, pk:null, fk:null, fam:{}, style:"Balanced"};
  M.tac.fam[M.tac.f] = 85; mgPickBest();
  M.train = {focus:"bal", int:1, ind:[]};
  M.job = {club, since:M.season, day:M.day, p:0, w:0, d:0, l:0};
  M.lt = t; M.res = {};
  M.clubs.push({club, from:M.season});
  M.kn = {}; mgMine().forEach(p=>{ M.kn[p.id] = 100; });
  mgMine().forEach(p=>{ p.role = mgRoleGuess(p); });
  M.fin = mgNewFinances(club, first);
  M.board = {conf:first ? 62 : 66, obj:mgObjectives(), hist:[], wk:0};
  if (mgDof()) mdfSetup(club);
  (M.yth || []).forEach(id=>{ delete M.P[id]; });
  M.yth = []; M.ysc = null; M.short = []; M.scout = []; M.bids = []; M.offers = []; M.acad = null; M.chal = null; M.ev = null;
  mgYouthIntake(true);
  if (M.phase==="sacked") M.phase = M.day>=MGD(M.season + 1, 5, 1) ? "summer" : M.day>=MGD(M.season, 7, 1) ? "season" : "pre";
  mgMail("board", `Welcome to ${club}`, mgWelcomeText(), {stop:1});
  mgSave();
}
function mgWelcomeText(){
  if (mgDof()) return mdfWelcome();
  const o = M.board.obj.map(x=>`• ${x.t} (${x.imp})`).join("\n");
  return `The board welcomes you as the new manager of ${M.club}.\n\nYour transfer budget is ${mgMoney(M.fin.tb)} and your wage budget is ${mgWageTxt(M.fin.wb)}.\n\nThis season the board expects:\n${o}\n\nKeep their confidence high: results, the objectives and the club's finances all count.`;
}
function mgRoleGuess(p){ const sq = mgMine().sort((a, b)=>mgOvr(b) - mgOvr(a)), i = sq.indexOf(p); return p.age<=20 && i>14 ? 4 : i<4 ? 0 : i<11 ? 1 : i<17 ? 2 : 3; }
const MG_ROLES = ["Crucial", "Important", "Rotation", "Sporadic", "Prospect"];
const MG_ROLE_SHARE = [.85, .65, .4, .2, .15];

/* ---------- finances ---------- */
function mgNewFinances(club, first){
  const t = mgTierOf(club), r = mgRep(club), R = mgR(`${M.seed}|fin|${club}|${M.season}`);
  const tb = mgRoundFee((MG_TB[t] || 1e5)*Math.pow(clamp(r, .5, 1.05), 4)*(.85 + R()*.3));
  const bill = mgMine().reduce((s, p)=>s + p.wage, 0);
  return {bal:Math.round(tb*1.4 + bill*30), tb, wb:mgRoundWage(bill*(1.04 + r*.1)), inc:{}, exp:{}, hist:[], start:tb};
}
const mgBill = () => mgMine().reduce((s, p)=>s + (p.loan ? p.wage*(1 - (p.loan.pay ?? 1)) : p.lin ? p.wage*p.lin.pay : p.wage), 0);
function mgFinAdd(kind, k, v){ const F = M.fin; (F[kind])[k] = (F[kind][k]||0) + v; F.bal += kind==="inc" ? v : -v; }

/* ---------- the board ---------- */
function mgExpRank(club){ const t = mgTierOf(club); return M.tiers[t].slice().sort((a, b)=>mgLevel(b) - mgLevel(a)).indexOf(club) + 1; }
function mgObjectives(){
  const t = mgTierOf(M.club), T = TIERS[t], n = M.tiers[t].length, e = mgExpRank(M.club), o = [];
  const eu = T.eu ? T.eu[0] + T.eu[1] + T.eu[2] : 0;
  let lg;
  if (T.level===1 && isTop(t)){
    lg = e===1 ? {t:"Win the league", n:1} : e<=Math.max(2, T.eu ? T.eu[0] : 2) ? {t:`Finish in the top ${T.eu ? T.eu[0] : 2}`, n:T.eu ? T.eu[0] : 2}
      : e<=eu + 1 ? {t:"Qualify for Europe", n:Math.max(eu, 3)} : e<=Math.ceil(n/2) ? {t:"Finish in the top half", n:Math.ceil(n/2)}
      : e<=n - T.down - 2 ? {t:`Finish ${ord(n - T.down - 1)} or higher`, n:n - T.down - 1} : {t:"Avoid relegation", n:n - T.down};
  } else {
    const up = T.up || 0, po = T.po ? T.po[1] : up;
    lg = e<=up ? {t:"Win promotion", n:up} : e<=po + 1 && T.po ? {t:"Reach the play-offs", n:po} : e<=Math.ceil(n/2) ? {t:"Finish in the top half", n:Math.ceil(n/2)} : {t:"Avoid relegation", n:n - T.down};
  }
  o.push({k:"league", t:lg.t, n:lg.n, imp:"Critical", w:3});
  const cupT = T.level<=1 && isTop(t) ? (e<=4 ? 5 : e<=10 ? 4 : 3) : T.level===2 ? 3 : 2;
  const cups = mgCupSpecs(T.country, M.season);
  if (cups.length){ const c = cups[0], ri = Math.min(c.rounds.length - 1, Math.max(0, c.rounds.length - 1 - Math.max(1, 6 - cupT))); o.push({k:"cup", code:c.code, t:`Reach the ${c.rounds[ri]} of the ${c.name}`, n:ri, imp:"Medium", w:1}); }
  const q = M.euroQ[M.club];
  if (q){ const top = e<=4 && q==="UCL"; o.push({k:"eu", code:q, t:top ? `Reach the quarter-finals of the ${MG_EU[q].name}` : `Reach the knockout stage of the ${MG_EU[q].name}`, n:top ? 2 : 0, imp:"High", w:2}); }
  o.push({k:"wage", t:"Keep the wage bill within budget", imp:"Medium", w:1});
  if (SELLERS.has(M.club) || T.level>=3 || mgRep(M.club)<.72) o.push({k:"youth", t:"Give 15 starts to players aged 21 or under", n:15, imp:"Low", w:1});
  return mgDof() ? mdfObjectives(o) : o;
}
const mgConfLabel = c => c>=80 ? "Delighted" : c>=65 ? "Pleased" : c>=50 ? "Satisfied" : c>=35 ? "Concerned" : c>=20 ? "Worried" : "Furious";
function mgBoardShift(d, why){ const B = M.board; B.conf = +clamp(B.conf + d, 0, 100).toFixed(1); if (why) B.hist.push({d:M.day, v:d, why}); if (B.hist.length>40) B.hist.shift(); }

/* ---------- the inbox ---------- */
// kinds: board, transfer, contract, scout, youth, injury, news, event, job, award, match
function mgMail(k, t, b, o = {}){
  const m = {id:M.nmid++, d:M.day, k, t, b, act:o.act || null, stop:!!o.stop, seen:false};
  M.inbox.unshift(m); if (M.inbox.length>160) M.inbox.length = 160;
  if (o.stop) M._stop = (M._stop||0) + 1;
  return m;
}

/* ---------- saving ---------- */
// players are saved compactly: season stats as arrays, and nothing that's empty
const MG_STK = ["ap","st","g","a","cs","mins","rs","rn","yc","rc","potm"];
function mgPack(p){
  const o = {};
  for (const k in p){ const v = p[k]; if (k[0]==="_" || v==null || v===0 || v===false || v==="" || (Array.isArray(v) && !v.length)) continue;
    o[k] = k==="st" || k==="lg" ? MG_STK.map(x=>+(+v[x] || 0).toFixed(1)) : k==="car" ? [v.ap, v.g, v.a] : k==="mor" || k==="xp" ? +v.toFixed(1) : v; }
  return o;
}
function mgUnpack(o){
  const p = {...o, st:mgStat(), lg:mgStat(), car:{ap:0, g:0, a:0}};
  ["st","lg"].forEach(k=>{ if (Array.isArray(o[k])) MG_STK.forEach((x, i)=>{ p[k][x] = o[k][i] || 0; }); });
  if (Array.isArray(o.car)) p.car = {ap:o.car[0] || 0, g:o.car[1] || 0, a:o.car[2] || 0};
  p.alt ||= []; p.form ||= []; p.mor ??= 65; p.fit ??= 100; p.ban ||= 0; p.ycc ||= 0; p.xp ||= 0; p.wage ||= 0; p.con ||= 0; p.num ||= 0; p.role ??= 2;
  return p;
}
function mgSave(){
  if (!M || !MG_KEY) return;
  M.updated = Date.now();
  const keep = {};
  for (const k in M) if (k[0]!=="_") keep[k] = M[k];
  keep.P = {}; for (const id in M.P) keep.P[id] = mgPack(M.P[id]);
  keep.pk = 1;
  try{ localStorage.setItem(MG_KEY, JSON.stringify(keep)); }catch(e){ if (typeof Account!=="undefined") Account.saveFailed(); }
}
function mgLoad(key){
  try{ const d = JSON.parse(localStorage.getItem(key)); if (!d || !d.v) return null;
    if (d.pk) for (const id in d.P) d.P[id] = mgUnpack(d.P[id]);
    delete d.pk; d.played ||= {}; return d; }catch(e){ return null; }
}

/* ================= THE SEASON ================= */
const mgShuffleR = (a, R) => { a = a.slice(); for (let i = a.length - 1; i>0; i--){ const j = Math.floor(R()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const mgLeagueOf = () => mgTierOf(M.club);
const mgInWindow = (d = M.day) => { const y = mgDate(d).getUTCFullYear(), m = mgDate(d).getUTCMonth(); return m===6 || m===7 || m===0; };
const mgWindowName = () => { const m = mgDate(M.day).getUTCMonth(); return m===6 || m===7 ? "Summer window" : m===0 ? "January window" : null; };
function mgWindowLine(){
  const Y = M.season, d = M.day;
  if (mgInWindow()){ const close = mgDate(d).getUTCMonth()===0 ? MGD(Y + 1, 1, 1) : MGD(Y, 8, 1); const left = close - d; return `Open · closes in ${left} day${left===1 ? "" : "s"}`; }
  const next = d<MGD(Y + 1, 0, 1) ? MGD(Y + 1, 0, 1) : MGD(Y + 1, 6, 1); return `Closed · opens ${mgFmt(next)}`;
}
function mgStartSeason(){
  M._tier = null; M._idx = null; M._lv = null; mgVCache.clear(); M.gone = {};
  mgSeasonLevels();
  const R = mgR(`${M.seed}|order|${M.season}`);
  M.order = {}; M.tab = {}; M.res = {}; M.myres = []; M.played = {}; M.po = {}; M.lt = mgLeagueOf();
  for (const t of MG_PLAYABLE){ M.order[t] = mgShuffleR(M.tiers[t], R); M.tab[t] = {}; M.tiers[t].forEach(c=>{ M.tab[t][c] = [0,0,0,0,0,0,0,""]; }); }
  M.cups = {};
  [...new Set(MG_PLAYABLE.map(t=>TIERS[t].country))].forEach(country=>mgCupSpecs(country, M.season).forEach(spec=>{ M.cups[spec.code] = mgCupNew(spec, country); }));
  M.eu = {}; const used = new Set(); ["UCL","UEL","UECL"].forEach(code=>{ M.eu[code] = mgEuNew(code, used); });
  Object.values(M.P).forEach(p=>{ p.st = mgStat(); p.lg = mgStat(); p.ycc = 0; });
  M.mon = {};
  if (M.board && M.board.season!==M.season){ M.board.obj = mgObjectives(); M.board.season = M.season; }
  M.fin.inc = {}; M.fin.exp = {};
  M.phase = "pre";
}
const mgDayIdx = () => {
  if (M._idx && M._idx.s===M.season) return M._idx.m;
  const m = new Map(), add = (d, e) => { if (!m.has(d)) m.set(d, []); m.get(d).push(e); };
  for (const t of MG_PLAYABLE) mgLeagueDays(t, M.season).forEach((d, r)=>add(d, {k:"L", t, r}));
  for (const code in M.cups) M.cups[code].days.forEach((ds, r)=>ds.forEach((d, leg)=>add(d, {k:"C", code, r, leg})));
  for (const code in M.eu){ const D = mgEuDays(code, M.season); D.md.forEach((d, r)=>add(d, {k:"E", code, s:"md", r})); D.ko.forEach((ds, r)=>ds.forEach((d, leg)=>add(d, {k:"E", code, s:"ko", r, leg}))); }
  for (const t of [2,3,4,5]){ const end = mgLeagueDays(t, M.season).slice(-1)[0]; [end + 4, end + 7].forEach((d, leg)=>add(d, {k:"P", t, s:0, leg})); add(end + 16, {k:"P", t, s:1, leg:0}); }
  [11, 18, 25].forEach((dd, n)=>add(mgOn(M.season, 6, dd, 6), {k:"F", n}));
  [["wclose", MGD(M.season, 8, 1)], ["jopen", MGD(M.season + 1, 0, 1)], ["jclose", MGD(M.season + 1, 1, 1)], ["youth", MGD(M.season + 1, 2, 15)], ["renew", MGD(M.season + 1, 3, 1)], ["end", MGD(M.season + 1, 5, 1)]].forEach(([w, d])=>add(d, {k:"X", w}));
  M._idx = {s:M.season, m}; return m;
};
// every match on a day: {c (league L, cup C, Europe E, play-off P, friendly F), code/t, r, leg, h, a, neutral, ko, first (the first leg), key}
function mgFixturesOn(day){
  const evs = mgDayIdx().get(day) || [], out = [];
  for (const e of evs){
    const key = `${day}|${e.k}|${e.code || e.t || ""}|${e.s || ""}|${e.r}|${e.leg || 0}`;
    if (e.k==="L"){ const L = M.order[e.t]; mgPairs(L, e.r).forEach(([h, a], i)=>out.push({c:"L", t:e.t, r:e.r, h, a, key:`${key}|${i}`, day})); }
    else if (e.k==="C"){ const C = M.cups[e.code]; if (!C || C.win || C.r!==e.r || !C.pairs) continue;
      C.pairs.forEach((P, i)=>{ if (P.res) return; const two = C.days[e.r].length>1; if (two && e.leg===1 && !P.l1) return; if (two && e.leg===0 && P.l1) return;
        const [h, a] = e.leg===1 ? [P.a, P.h] : [P.h, P.a];
        out.push({c:"C", code:e.code, r:e.r, leg:e.leg, h, a, neutral:e.r>=C.neutral, ko:!two || e.leg===1, first:e.leg===1 ? [P.l1[1], P.l1[0]] : null, key:`${key}|${i}`, day, i}); }); }
    else if (e.k==="E"){ const E = M.eu[e.code]; if (!E || E.win) continue;
      if (e.s==="md"){ if (E.md!==e.r) continue; mgPairs(E.teams, e.r).forEach(([h, a], i)=>out.push({c:"E", code:e.code, s:"md", r:e.r, h, a, key:`${key}|${i}`, day})); }
      else { if (E.kr!==e.r || !E.pairs) continue; const fin = e.r===MG_EU_KO.length - 1;
        E.pairs.forEach((P, i)=>{ if (P.res) return; if (!fin && e.leg===1 && !P.l1) return; if (!fin && e.leg===0 && P.l1) return;
          const [h, a] = e.leg===1 ? [P.a, P.h] : [P.h, P.a];
          out.push({c:"E", code:e.code, s:"ko", r:e.r, leg:e.leg, h, a, neutral:fin, ko:fin || e.leg===1, first:e.leg===1 ? [P.l1[1], P.l1[0]] : null, key:`${key}|${i}`, day, i}); }); } }
    else if (e.k==="P"){ const P = M.po[e.t]; if (!P || P.win || P.s!==e.s || !P.pairs) continue;
      P.pairs.forEach((Q, i)=>{ if (Q.res) return; const two = e.s===0; if (two && e.leg===1 && !Q.l1) return; if (two && e.leg===0 && Q.l1) return;
        const [h, a] = e.leg===1 ? [Q.a, Q.h] : [Q.h, Q.a];
        out.push({c:"P", t:e.t, s:e.s, leg:e.leg, h, a, neutral:e.s===1, ko:!two || e.leg===1, first:e.leg===1 ? [Q.l1[1], Q.l1[0]] : null, key:`${key}|${i}`, day, i}); }); }
    else if (e.k==="F"){ if (M.phase!=="pre") continue; const o = mgFriendlyOpp(e.n); if (o) out.push({c:"F", n:e.n, h:e.n===1 ? o : M.club, a:e.n===1 ? M.club : o, key, day}); }
  }
  return out;
}
const mgIsMine = f => f.h===M.club || f.a===M.club;
function mgUserFixture(day = M.day){ return mgFixturesOn(day).find(f=>mgIsMine(f) && !M.played[f.key]) || null; }
function mgNextFixture(){ for (let d = M.day; d<=MGD(M.season + 1, 5, 2); d++){ const f = mgUserFixture(d); if (f && !(d===M.day && M.done)) return f; } return null; }
function mgFriendlyOpp(n){
  const t = mgLeagueOf(), lv = mgLevel(M.club), R = mgR(`${M.seed}|fr|${M.season}|${n}`);
  const pool = ALLKEYS.flatMap(k=>M.tiers[k]).filter(c=>c!==M.club && !M.tiers[t].includes(c) && Math.abs((M.vs[c] ?? 60) - lv + [6, 0, -3][n])<4);
  return pool.length ? mgPick(R, pool) : mgPick(R, ALLKEYS.flatMap(k=>M.tiers[k]).filter(c=>c!==M.club));
}
// a competition's name for a fixture
function mgCompName(f, short){
  if (f.c==="L") return short ? TIERS[f.t].short : TIERS[f.t].name;
  if (f.c==="C"){ const C = M.cups[f.code]; return short ? C.name.replace("League Cup", "Lg Cup") : `${C.name} · ${C.rounds[f.r]}${C.days[f.r].length>1 ? ` · ${f.leg ? "2nd" : "1st"} leg` : ""}`; }
  if (f.c==="E") return short ? f.code : `${MG_EU[f.code].name} · ${f.s==="md" ? `League phase, matchday ${f.r + 1}` : MG_EU_KO[f.r] + (f.r<MG_EU_KO.length - 1 ? ` · ${f.leg ? "2nd" : "1st"} leg` : "")}`;
  if (f.c==="P") return short ? "Play-off" : `${TIERS[f.t].name} play-off ${f.s ? "final" : `semi-final · ${f.leg ? "2nd" : "1st"} leg`}`;
  return short ? "Friendly" : "Pre-season friendly";
}
const mgVenue = f => f.neutral ? (f.c==="C" && TIERS[mgTierOf(f.h)]?.country==="England" || f.c==="P" ? "Wembley Stadium" : "a neutral ground") : (META[f.h] && META[f.h].ground) || `${f.h}'s ground`;

/* ---------- quick results, from levels ---------- */
// goals a side should score in 90 minutes, from how much better it is (d) and where it's played (home 1, away -1)
function mgLam(d, home){ const x = Math.abs(d)<=10 ? d : Math.sign(d)*(10 + (Math.abs(d) - 10)*.4); return 1.3*Math.exp(x/26)*(home===1 ? 1.07 : home===-1 ? .93 : 1); }
function mgPois(l){ let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= Math.random(); } while (p>L && k<12); return k - 1; }
function mgQuick(h, a, neutral){ const lh = mgLevel(h), la = mgLevel(a); return [mgPois(mgLam(lh - la, neutral ? 0 : 1)), mgPois(mgLam(la - lh, neutral ? 0 : -1))]; }
// a knockout decided: extra time, then penalties if it's still level
function mgDecide(h, a, hg, ag, first, neutral){
  let th = hg + (first ? first[0] : 0), ta = ag + (first ? first[1] : 0), et = false, pens = null;
  if (th===ta){ et = true; const e = [mgPois(mgLam(mgLevel(h) - mgLevel(a), neutral ? 0 : 1)/3), mgPois(mgLam(mgLevel(a) - mgLevel(h), neutral ? 0 : -1)/3)]; hg += e[0]; ag += e[1]; th += e[0]; ta += e[1];
    if (th===ta){ let ph = 0, pa = 0; for (let i = 0; i<5; i++){ ph += Math.random()<.76; pa += Math.random()<.76; } while (ph===pa){ ph += Math.random()<.76; pa += Math.random()<.76; } pens = [ph, pa]; } }
  return {hg, ag, et, pens, w:pens ? (pens[0]>pens[1] ? h : a) : th>ta ? h : a};
}

/* ---------- the league table ---------- */
function mgTabAdd(t, h, a, hg, ag){
  const T = M.tab[t]; if (!T || !T[h] || !T[a]) return;
  const add = (c, f, g) => { const r = T[c]; r[0]++; r[4] += f; r[5] += g; if (f>g){ r[1]++; r[6] += 3; r[7] = (r[7] + "W").slice(-5); } else if (f===g){ r[2]++; r[6]++; r[7] = (r[7] + "D").slice(-5); } else { r[3]++; r[7] = (r[7] + "L").slice(-5); } };
  add(h, hg, ag); add(a, ag, hg);
}
function mgTable(t){ const T = M.tab[t] || {}; return Object.keys(T).map(n=>({n, p:T[n][0], w:T[n][1], d:T[n][2], l:T[n][3], gf:T[n][4], ga:T[n][5], gd:T[n][4] - T[n][5], pts:T[n][6], form:T[n][7]}))
  .sort((x, y)=>y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.n.localeCompare(y.n)); }
const mgPos = (club = M.club, t = mgTierOf(club)) => mgTable(t).findIndex(r=>r.n===club) + 1;

/* ---------- cups ---------- */
function mgCupNew(spec, country){
  const join = {};
  for (const [r, list] of Object.entries(spec.join)) join[r] = list.flatMap(k=>k==="6+" ? M.tiers[6].slice().sort((a, b)=>(M.vs[b]||0) - (M.vs[a]||0)).slice(0, 8) : M.tiers[keyOf(k)] || []);
  let {rounds, days, neutral} = spec;
  // a cup abroad starts at the round its field needs (26 clubs: the round of 32)
  if (country!=="England"){ const n = join[0].length, k = Math.max(1, Math.ceil(Math.log2(n))), cut = Math.max(0, rounds.length - k); rounds = rounds.slice(cut); days = days.slice(cut); neutral = rounds.length - 1; }
  const C = {code:spec.code, name:spec.name, country, rounds, days, neutral, join, r:0, alive:[], pairs:null, bye:[], hist:[], win:null, out:{}};
  mgCupDraw(C); return C;
}
function mgCupDraw(C){
  C.alive = [...new Set([...C.alive, ...(C.join[C.r] || [])])];
  const pool = mgShuffleR(C.alive, Math.random); C.bye = [];
  // an odd number left: one club (never yours) goes through without playing
  if (pool.length % 2){ const i = pool.findIndex(c=>c!==M.club); C.bye.push(pool.splice(i, 1)[0]); }
  C.pairs = []; for (let i = 0; i<pool.length; i += 2) C.pairs.push({h:pool[i], a:pool[i + 1], l1:null, res:null});
}
function mgCupResult(C, i, leg, hg, ag, dec){
  const P = C.pairs[i];
  if (C.days[C.r].length>1 && leg===0){ P.l1 = [hg, ag]; return; }
  const w = dec ? dec.w : (hg>ag ? P.h : P.a);
  P.res = leg===1 ? {hg:P.l1[0] + (dec ? dec.ag : ag), ag:P.l1[1] + (dec ? dec.hg : hg), w, pens:dec && dec.pens ? [dec.pens[1], dec.pens[0]] : null, et:dec && dec.et, agg:true}
    : {hg:dec ? dec.hg : hg, ag:dec ? dec.ag : ag, w, pens:dec ? dec.pens : null, et:dec && dec.et};
  const lost = w===P.h ? P.a : P.h; C.out[lost] = C.r;
  if (C.pairs.every(x=>x.res)) mgCupNext(C);
}
function mgCupNext(C){
  // the rounds of the cups at home are kept; abroad, only the latest
  const H = {r:C.r, ties:C.pairs.map(p=>[p.h, p.a, p.res.hg, p.res.ag, p.res.w, p.res.pens ? p.res.pens.join("–") : ""])};
  if (M.club && TIERS[mgLeagueOf()] && TIERS[mgLeagueOf()].country===C.country) C.hist.push(H); else C.hist = [H];
  C.alive = [...C.pairs.map(p=>p.res.w), ...C.bye];
  if (C.r===C.rounds.length - 1 || C.alive.length===1){ C.win = C.alive[0]; C.pairs = null; mgCupWon(C); return; }
  C.r++; mgCupDraw(C);
}
function mgCupWon(C){
  if (C.win===M.club) mgTrophy(C.name);
  if (TIERS[mgLeagueOf()]?.country===C.country) mgMail("news", `${C.win} win the ${C.name}`, `${C.win} lift the ${C.name}${C.win===M.club ? ". What a day for the club!" : "."}`);
}

/* ---------- Europe ---------- */
function mgEuNew(code, used){
  const R = mgR(`${M.seed}|eu|${code}|${M.season}`);
  let teams = Object.keys(M.euroQ).filter(c=>M.euroQ[c]===code && mgTierOf(c)!=null && isTop(mgTierOf(c)));
  // topped up to 36 from the rest of Europe: the strongest of them in the Champions League
  const extra = EU_EXTRA.filter(x=>!META[x.n] && !used.has(x.n)).sort((a, b)=>b.str - a.str);
  for (let i = 0; teams.length<36 && i<extra.length; i++){ teams.push(extra[i].n); used.add(extra[i].n); }
  teams = mgShuffleR(teams.slice(0, 36), R);
  const E = {code, name:MG_EU[code].name, teams, md:0, tab:{}, kr:-1, pairs:null, ko:[], win:null, out:{}};
  teams.forEach(c=>{ E.tab[c] = [0,0,0,0,0,0,0,""]; });
  return E;
}
function mgEuTable(E){ return Object.keys(E.tab).map(n=>({n, p:E.tab[n][0], w:E.tab[n][1], d:E.tab[n][2], l:E.tab[n][3], gf:E.tab[n][4], ga:E.tab[n][5], gd:E.tab[n][4] - E.tab[n][5], pts:E.tab[n][6], form:E.tab[n][7]}))
  .sort((x, y)=>y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || mgLevel(y.n) - mgLevel(x.n)); }
function mgEuMdResult(E, h, a, hg, ag){
  const add = (c, f, g) => { const r = E.tab[c]; r[0]++; r[4] += f; r[5] += g; if (f>g){ r[1]++; r[6] += 3; r[7] = (r[7] + "W").slice(-5); } else if (f===g){ r[2]++; r[6]++; r[7] = (r[7] + "D").slice(-5); } else { r[3]++; r[7] = (r[7] + "L").slice(-5); } };
  add(h, hg, ag); add(a, ag, hg);
}
function mgEuMdDone(E){
  E.md++;
  if (E.md<MG_EU[E.code].md) return;
  const tb = mgEuTable(E); E.final = tb.map(r=>r.n);
  tb.slice(24).forEach(r=>{ E.out[r.n] = "League phase"; });
  E.seeds = tb.slice(0, 8).map(r=>r.n);
  E.kr = 0; E.pairs = []; for (let i = 0; i<8; i++) E.pairs.push({h:tb[8 + i].n, a:tb[23 - i].n, l1:null, res:null});
  if (E.teams.includes(M.club)){ const p = tb.findIndex(r=>r.n===M.club) + 1; mgMail("news", `${E.name}: league phase over`, p<=8 ? `You finished ${ord(p)}: straight into the round of 16.` : p<=24 ? `You finished ${ord(p)}: into the knockout play-off.` : `You finished ${ord(p)} and you're out of the ${E.name}.`); }
}
function mgEuKoResult(E, i, leg, hg, ag, dec){
  const P = E.pairs[i], fin = E.kr===MG_EU_KO.length - 1;
  if (!fin && leg===0){ P.l1 = [hg, ag]; return; }
  const w = dec.w;
  P.res = fin ? {hg:dec.hg, ag:dec.ag, w, pens:dec.pens, et:dec.et} : {hg:P.l1[0] + dec.ag, ag:P.l1[1] + dec.hg, w, pens:dec.pens ? [dec.pens[1], dec.pens[0]] : null, et:dec.et, agg:true};
  E.out[w===P.h ? P.a : P.h] = MG_EU_KO[E.kr];
  if (!E.pairs.every(x=>x.res)) return;
  E.ko.push(E.pairs.map(p=>[p.h, p.a, p.res.hg, p.res.ag, p.res.w, p.res.pens ? p.res.pens.join("–") : ""]));
  const wins = E.pairs.map(p=>p.res.w);
  if (fin){ E.win = wins[0]; E.pairs = null; if (E.win===M.club) mgTrophy(E.name); mgMail("news", `${E.win} win the ${E.name}`, `${E.win} are the ${E.name} winners.`); return; }
  E.kr++;
  const pool = E.kr===1 ? E.seeds.map((s, k)=>[s, wins[7 - k]]) : (()=>{ const w = mgShuffleR(wins, Math.random), o = []; for (let k = 0; k<w.length; k += 2) o.push([w[k], w[k + 1]]); return o; })();
  E.pairs = pool.map(([x, y])=>({h:y, a:x, l1:null, res:null}));
}

/* ---------- play-offs ---------- */
function mgPoStart(t){
  const T = TIERS[t]; if (!T.po) return;
  const tb = mgTable(t), q = tb.slice(T.po[0] - 1, T.po[1]).map(r=>r.n);
  M.po[t] = {s:0, q, pairs:[{h:q[3], a:q[0], l1:null, res:null}, {h:q[2], a:q[1], l1:null, res:null}], win:null};
}
function mgPoResult(t, i, leg, hg, ag, dec){
  const P = M.po[t], Q = P.pairs[i];
  if (P.s===0 && leg===0){ Q.l1 = [hg, ag]; return; }
  Q.res = P.s===0 ? {hg:Q.l1[0] + dec.ag, ag:Q.l1[1] + dec.hg, w:dec.w, pens:dec.pens ? [dec.pens[1], dec.pens[0]] : null} : {hg:dec.hg, ag:dec.ag, w:dec.w, pens:dec.pens};
  if (!P.pairs.every(x=>x.res)) return;
  if (P.s===0){ P.semis = P.pairs.map(x=>[x.h, x.a, x.res.hg, x.res.ag, x.res.w]); P.s = 1; P.pairs = [{h:P.pairs[0].res.w, a:P.pairs[1].res.w, l1:null, res:null}]; return; }
  P.win = Q.res.w; P.final = [Q.h, Q.a, Q.res.hg, Q.res.ag, Q.res.w, Q.res.pens ? Q.res.pens.join("–") : ""]; P.pairs = null;
  if (P.win===M.club) mgTrophy(`${TIERS[t].name} play-offs`);
  if (t===mgLeagueOf()) mgMail("news", `${P.win} win the play-off final`, `${P.win} go up through the ${TIERS[t].name} play-offs.`);
}

/* ---------- writing a result ---------- */
// a finished match goes into its competition; det is the detailed result (scorers, ratings) when there is one
function mgApply(f, hg, ag, dec){
  if (f.c==="L"){ mgTabAdd(f.t, f.h, f.a, hg, ag); if (f.t===M.lt) (M.res[f.r] ||= []).push([f.h, f.a, hg, ag]); }
  else if (f.c==="C") mgCupResult(M.cups[f.code], f.i, f.leg || 0, hg, ag, f.ko ? dec || mgDecide(f.h, f.a, hg, ag, f.first, f.neutral) : null);
  else if (f.c==="E"){ const E = M.eu[f.code]; if (f.s==="md") mgEuMdResult(E, f.h, f.a, hg, ag); else mgEuKoResult(E, f.i, f.leg || 0, hg, ag, f.ko ? dec || mgDecide(f.h, f.a, hg, ag, f.first, f.neutral) : null); }
  else if (f.c==="P") mgPoResult(f.t, f.i, f.leg || 0, hg, ag, f.ko ? dec || mgDecide(f.h, f.a, hg, ag, f.first, f.neutral) : null);
}
// all the day's matches that aren't yours (yours is played on the match screen first)
function mgProcessDay(){
  const fx = mgFixturesOn(M.day), mdE = new Set();
  for (const f of fx){
    if (mgIsMine(f)) continue;
    if (f.c==="L" && M.cl[f.h] && M.cl[f.a] && f.t===M.lt){ const r = mgMatchFast(f); mgApplyDetail(f, r); mgApply(f, r.hg, r.ag); continue; }
    let [hg, ag] = mgQuick(f.h, f.a, f.neutral);
    if (f.ko){ const d = mgDecide(f.h, f.a, hg, ag, f.first, f.neutral); mgApply(f, d.hg, d.ag, d); }
    else mgApply(f, hg, ag);
    if (f.c==="E" && f.s==="md") mdE.add(f.code);
  }
  (mgDayIdx().get(M.day) || []).forEach(e=>{
    if (e.k==="E" && e.s==="md" && M.eu[e.code].md===e.r) mgEuMdDone(M.eu[e.code]);
    if (e.k==="L" && e.r===mgRounds(e.t) - 1) mgLeagueOver(e.t);
  });
  if (M._lv) M._lv = null;
}
function mgLeagueOver(t){ if (TIERS[t].po) mgPoStart(t); }
// a detailed match's players: appearances, goals, assists, ratings, cards and injuries
function mgApplyDetail(f, r){
  const lg = f.c==="L";
  for (const s of r.ps){
    const p = M.P[s.id]; if (!p || s.mins<=0) continue;
    for (const st of lg ? [p.st, p.lg] : [p.st]){ st.ap++; if (s.start) st.st++; st.g += s.g; st.a += s.a; st.mins += s.mins; st.rs += s.r; st.rn++; st.yc += s.yc; st.rc += s.rc; if (s.cs) st.cs++; if (s.potm) st.potm++; }
    p.form = (p.form || []).concat(+s.r.toFixed(1)).slice(-5);
    p._mins = (p._mins || 0) + s.mins;
    p.fit = Math.max(25, Math.round(p.fit - s.drain));
    p.shp = Math.min(100, mgxShp(p) + s.mins/90*14);
    // cards in a friendly don't count
    if (f.c!=="F"){
      if (s.yc){ p.ycc = (p.ycc||0) + s.yc; if (p.ycc>=5){ p.ban = (p.ban||0) + 1; p.ycc = 0; } }
      if (s.rc) p.ban = (p.ban||0) + (s.yc>=2 ? 1 : 3);
    }
    if (s.inj){ p.inj = s.inj; mgxPhysio(p); }
  }
  // a ban is served by missing a match: everyone banned at these clubs who didn't play has one fewer to serve
  [f.h, f.a].forEach(c=>{ if (M.cl[c]) M.cl[c].sq.forEach(id=>{ const p = M.P[id]; if (p && p.ban>0 && !r.ps.some(s=>s.id===id && s.mins>0)) p.ban--; }); });
}

/* ================= TIME MOVES ON ================= */
// Continue: on to the next thing that needs you (your next match, a message to answer, the end of the season)
function mgAdvance(){
  if (M.phase==="summer"){ mgNewSeason(); mgSave(); return {stop:"season"}; }
  if (M.phase==="sacked" || M.phase==="new") return {stop:M.phase};
  M._stop = 0;
  for (let guard = 0; guard<420; guard++){
    if (!M.done){
      const uf = mgUserFixture();
      if (uf){ mgSave(); return {stop:"match", fx:uf}; }
      mgProcessDay(); M.done = true;
      if (M.phase==="summer" || M.phase==="sacked"){ mgSave(); return {stop:M.phase}; }
      if (M._stop){ mgSave(); return {stop:"mail"}; }
    }
    M.day++; M.done = false;
    mgTick();
    if (M.phase==="summer" || M.phase==="sacked"){ mgSave(); return {stop:M.phase}; }
    if (M._stop){ mgSave(); return {stop:"mail"}; }
  }
  mgSave(); return {stop:"idle"};
}
// your match is over: it goes into its competition, then the rest of the day is played
function mgFinishUserMatch(f, r){
  M.played[f.key] = 1;
  mgApplyDetail(f, r);
  const mine = f.h===M.club, gf = mine ? r.hg : r.ag, ga = mine ? r.ag : r.hg;
  if (f.c!=="F"){ mgApply(f, r.hg, r.ag, r.dec); }
  const res = gf>ga ? "W" : gf<ga ? "L" : "D", opp = mine ? f.a : f.h;
  const decW = r.dec ? r.dec.w===M.club : null;
  M.myres.push({d:M.day, c:f.c, t:f.t, code:f.code, comp:mgCompName(f, true), full:mgCompName(f), o:opp, h:mine, gf, ga, res, ko:decW, pens:r.dec && r.dec.pens ? (mine ? r.dec.pens : r.dec.pens.slice().reverse()).join("–") : "", et:!!(r.dec && r.dec.et),
    sc:r.goals.filter(g=>g.side===(mine ? 0 : 1)).map(g=>`${mgSurname(g.n)} ${g.m}'`)});
  if (f.c!=="F"){
    const J = M.job; J.p++; M.car.p++; M.car.gf += gf; M.car.ga += ga;
    if (res==="W"){ J.w++; M.car.w++; } else if (res==="D"){ J.d++; M.car.d++; } else { J.l++; M.car.l++; }
    // the board's view of the result: against what a club of yours should get from this game
    const exp = mgExpPts(M.club, opp, mine ? 1 : -1), pts = res==="W" ? 3 : res==="D" ? 1 : 0;
    mgBoardShift(clamp((pts - exp)*(f.c==="L" ? .95 : .7)*(mgDof() ? .7 : 1), -2.6, 2.6));
    mdfAfterMatch(res, pts, exp);
    mgMine().forEach(p=>{ const s = r.ps.find(x=>x.id===p.id), mins = s ? s.mins : 0;
      p.pt = +((p.pt ?? MG_ROLE_SHARE[p.role ?? 2])*.8 + Math.min(1, mins/90)*.2).toFixed(3);
      p.mor = clamp(p.mor + (res==="W" ? 1.5 : res==="L" ? -1.5 : 0)*(mins ? 1 : .5) + (s ? clamp((s.r - 6.6)*1.2, -1.5, 1.5) : 0), 5, 100); });
    // gate money for a home game
    if (mine && !f.neutral){ const g = mgGate(); mgFinAdd("inc", "gate", g); }
    // appearance bonuses
    const bon = r.ps.reduce((t, x)=>{ const q = M.P[x.id]; return t + (q && q.club===M.club && q.bon && x.mins>0 ? q.bon : 0); }, 0); if (bon) mgFinAdd("exp", "fees", bon);
    mgPrize(f, res, decW);
    if (M.chal) mgChallengeTick(f, res, gf);
    mgxAfterMatch(f, r, res, pts, exp, opp, gf, ga);
  }
  const hurt = r.ps.filter(s=>s.inj && M.P[s.id] && M.P[s.id].club===M.club);
  hurt.forEach(s=>mgMail("injury", `${M.P[s.id].n} is injured`, `${M.P[s.id].n} picked up ${s.inj.n.toLowerCase()} and will be out for about ${mgWeeks(s.inj.d)}.`));
  mgProcessDay(); M.done = true;
  mgSave();
}
const mgWeeks = d => d<7 ? `${d} day${d===1 ? "" : "s"}` : `${Math.round(d/7)} week${Math.round(d/7)===1 ? "" : "s"}`;
// points a club would expect from a game against opp (home 1, away -1)
function mgExpPts(club, opp, home){ const lh = mgLam(mgLevel(club) - mgLevel(opp), home), la = mgLam(mgLevel(opp) - mgLevel(club), -home);
  let w = 0, d = 0; for (let i = 0; i<8; i++) for (let j = 0; j<8; j++){ const p = Math.exp(-lh)*lh**i/mgFact(i)*Math.exp(-la)*la**j/mgFact(j); if (i>j) w += p; else if (i===j) d += p; } return 3*w + d; }
const mgFact = n => n<2 ? 1 : n*mgFact(n - 1);
function mgGate(){ const t = mgLeagueOf(), cap = mgCapacity(M.club), fill = clamp(.55 + mgRep(M.club)*.3 + (mgTable(t).findIndex(r=>r.n===M.club)<5 ? .08 : 0) + mdfFillF(), .3, 1); return Math.round(cap*fill*(MG_TICKET[t] || 15)*mdfGateF()); }
// prize money: for reaching each round and winning a cup, and Europe's fees for games and wins
function mgPrize(f, res, decW){
  const top = isTop(mgLeagueOf()) && TIERS[mgLeagueOf()].level===1;
  if (f.c==="E"){ const per = {UCL:2.1e6, UEL:.45e6, UECL:.3e6}[f.code], v = (res==="W" ? per : res==="D" ? per/3 : 0) + (f.s==="ko" && decW ? per*3 : 0); if (v) mgFinAdd("inc", "prize", v); }
  if (f.c==="C" && decW){ const v = (top ? 2e5 : 5e4)*Math.pow(1.6, f.r); mgFinAdd("inc", "prize", v); }
}

/* ---------- each new day ---------- */
function mgTick(){
  const d = mgDate(M.day), dow = d.getUTCDay(), dom = d.getUTCDate();
  // recovery: players get their legs back day by day; injuries heal
  const hard = M.train ? M.train.int : 1;
  for (const id in M.P){ const p = M.P[id]; if (!p.club || !M.cl[p.club]) continue;
    if (p.inj){ p.inj.t ??= p.inj.d; p.inj.d--; p.shp = Math.max(30, mgxShp(p) - 1.3); if (p.inj.d<=0) mgxRecovered(p); }
    const mine = p.club===M.club, rec = 8 + ((p.pos==="GK" ? 70 : p.at[5]) - 60)/12 - (p.age>30 ? 1.5 : 0) + (mine ? (hard===0 ? 2.5 : hard===2 ? -2 : 0) + mgxPhysRec() : 0);
    p.fit = Math.min(100, Math.round(p.fit + Math.max(3, rec)*(p.stam ? .55 : 1)));
    if (p.stam && --p.stam.d<=0) p.stam = null;
  }
  if (M.phase==="pre" && M.day>=MGD(M.season, 7, 1)) M.phase = "season";
  if (dow===1) mgWeekly();
  if (dom===1) mgMonthly();
  (mgDayIdx().get(M.day) || []).forEach(e=>{ if (e.k==="X") mgSpecial(e.w); });
  // scouting reports come in when they're ready
  M.scout = (M.scout || []).filter(s=>{ if (--s.d>0) return true; mgScoutDone(s); return false; });
  if (M.ysc && --M.ysc.d<=0) mgYouthScoutDone();
  // offers for your players don't wait for ever
  (M.offers || []).forEach(o=>{ if (o.st==="open" && M.day>=o.exp){ o.st = "lapsed"; const m = M.inbox.find(x=>x.act && x.act.offer===o.id); if (m) m.act.done = "Lapsed"; } });
}
function mgWeekly(){
  const F = M.fin, bill = mgBill();
  mgFinAdd("exp", "wages", bill);
  const sq = mgMine(), T = M.train || {focus:"bal", int:1, ind:[]};
  // playing time against what each player was promised (pt: his recent share of the minutes), drifting back to content
  sq.forEach(p=>{
    mgDevelop(p, 1, T);
    p._mins = (p._mins || 0)*.55;
    if (M.phase==="season" && !p.inj && !p.loan){ const want = MG_ROLE_SHARE[p.role ?? 2]; p.mor = clamp(p.mor + clamp(((p.pt ?? want) - want)*5, -1.5, 1) + (66 - p.mor)*.08, 5, 100); }
    if (T.int===2 && Math.random()<.006*(p.fit<70 ? 2 : 1)) { p.inj = mgInjury(true); mgxPhysio(p); mgMail("injury", `${p.n} hurt in training`, `${p.n} picked up ${p.inj.n.toLowerCase()} in training and will be out for about ${mgWeeks(p.inj.d)}.`); }
    if (p.mor<28 && !p.req && p.age>19 && M.phase==="season" && Math.random()<.2){ p.req = 1; mgMail("contract", `${p.n} wants to leave`, `${p.n} is unhappy (${mgMorLabel(p.mor)}) and has asked to be put on the transfer list.`,
      {act:{type:"req", id:p.id}, stop:1}); }
  });
  M.yth.forEach(id=>{ const p = M.P[id]; if (p) mgDevelop(p, .55, T); });
  // tactical familiarity grows as you train the shape
  const fam = M.tac.fam; fam[M.tac.f] = Math.min(100, (fam[M.tac.f] || 40) + (T.focus==="tac" ? 9 : 4));
  for (const k in fam) if (k!==M.tac.f) fam[k] = Math.max(40, fam[k] - 1);
  // the board watches the table and the books
  if (M.phase==="season"){
    const o = M.board.obj.find(x=>x.k==="league"), pos = mgPos(), played = mgTable(mgLeagueOf()).find(r=>r.n===M.club)?.p || 0;
    if (o && played>=8){ const gap = o.n - pos; mgBoardShift(clamp(gap*.1, -.8, .5)); }
    if (bill>M.fin.wb*1.02) mgBoardShift(-.6, "Wage bill over budget");
    if (mgxBoardCheck(played)) return;
  }
  mgxWeekly();
  if (mgDof()){ if (M.coach) mgFinAdd("exp", "staff", M.coach.wage); mdfWeekly(); }
  if (mgInWindow()) mgWindowWeek();
  mgAiManagers();
  if (!M.ev && M.phase==="season" && Math.random()<.13) mgEvent();
  M._lv = null;
}
function mgMonthly(){
  const t = mgLeagueOf(), sp = mgCommercial(M.club);
  if (M.phase!=="summer") mgFinAdd("inc", "spons", Math.round(sp/12));
  // manager of the month: the best points haul in your league over the last month
  if (M.phase==="season" && M.mon && M.mon.pts){
    const tb = mgTable(t), gain = tb.map(r=>({n:r.n, g:r.pts - (M.mon.pts[r.n] || 0), p:r.p - (M.mon.p[r.n] || 0)})).filter(x=>x.p>=3).sort((a, b)=>b.g - a.g || mgLevel(a.n) - mgLevel(b.n));
    if (gain.length){ const w = gain[0], mo = MG_MO[(mgDate(M.day).getUTCMonth() + 11) % 12];
      if (w.n===M.club && mgDof()){ const C = M.coach; C.mood = clamp(C.mood + 5, 0, 100); C.rep = Math.min(99, C.rep + 1); M.aw.push({s:M.season, t:`Manager of the Month · ${mo} (${C.n})`}); mgMail("award", `${C.n}: Manager of the Month`, `Your head coach is the ${TIERS[t].name} Manager of the Month for ${mo}: ${w.g} points from ${w.p} games.`); }
      else if (w.n===M.club){ M.mgr.rep = Math.min(100, M.mgr.rep + 1.5); M.aw.push({s:M.season, t:`Manager of the Month · ${mo}`}); mgMail("award", `Manager of the Month!`, `You're the ${TIERS[t].name} Manager of the Month for ${mo}: ${w.g} points from ${w.p} games.`, {stop:1}); }
      else mgMail("news", `Manager of the Month: ${M.am[w.n] || "the " + w.n + " boss"}`, `${M.am[w.n] || "The manager"} of ${w.n} wins the award for ${mo} with ${w.g} points from ${w.p} games.`); }
  }
  const tb = mgTable(t); M.mon = {pts:Object.fromEntries(tb.map(r=>[r.n, r.pts])), p:Object.fromEntries(tb.map(r=>[r.n, r.p]))};
}
function mgSpecial(w){
  if (w==="wclose" || w==="jclose") mdfWindowShut();
  if (w==="renew") mdfRenewNote();
  if (w==="wclose"){ mgMail("transfer", "The summer window has closed", `Deadline day is over. ${mgMoney(M.fin.tb)} left in your transfer budget; the window opens again on 1 January.`); M.tl = []; }
  if (w==="jopen"){ mgMail("transfer", "The January window is open", `Your transfer budget: ${mgMoney(M.fin.tb)}. The window closes on 1 February.`, {stop:1}); }
  if (w==="jclose") mgMail("transfer", "The January window has closed", `The window shuts until the summer.`);
  if (w==="youth") mgYouthIntake();
  if (w==="renew") mgLoanees().filter(p=>p.lin.opt).forEach(p=>mgMail("transfer", `${p.n}: buy him or let him go?`, `${p.n}'s loan from ${p.lin.from} ends this summer. You can make it permanent for ${mgMoney(p.lin.opt)}.`, {act:{type:"loanopt", id:p.id}, stop:1}));
  if (w==="renew"){ const ex = mgMine().filter(p=>p.con<=M.season && !p.lin); if (ex.length) mgMail("contract", `${ex.length} contract${ex.length===1 ? "" : "s"} running out`, `These players' contracts end this summer: ${ex.map(p=>p.n).join(", ")}. Offer new deals from their player cards, or they'll leave for nothing.`, {stop:1}); }
  if (w==="end") mgSeasonEnd();
}
function mgSacked(why, ended){
  M.phase = "sacked"; M.sacked++;
  if (!ended) M.hist.push(mgHistRow(true));
  M.mgr.rep = Math.max(5, M.mgr.rep - 6);
  M.jobs = mgVacancies(true);
  if (mgDof()) mgMail("board", `Sacked by ${M.club}`, `${M.club}'s owner has decided to make a change and you've lost your job as Director of Football. Clubs with vacancies will be in touch.`, {stop:1});
  else mgMail("board", `Sacked by ${M.club}`, why==="relegated" ? `${M.club} have been relegated, and the board has decided to make a change. Thank you for your efforts.` : `The board has lost confidence in you and has decided to end your time at ${M.club}. Clubs with vacancies will be in touch.`, {stop:1});
  mgHallRecord();
}
function mgHistRow(partial){
  const t = mgLeagueOf();
  return {s:seasonLabel(M.season), club:M.club, t, pos:mgPos(), n:M.tiers[t].length, p:M.job.p, w:M.job.w, d:M.job.d, l:M.job.l, part:!!partial, tro:M.trophies.filter(x=>x.s===seasonLabel(M.season) && x.club===M.club).map(x=>x.n)};
}
function mgTrophy(n){ M.trophies.push({s:seasonLabel(M.season), n, club:M.club}); M.mgr.rep = Math.min(100, M.mgr.rep + 4); mgMail("award", `Champions! ${n}`, `You've won the ${n} with ${M.club}. A night nobody at the club will forget.`, {stop:1}); }

/* ================= THE END OF A SEASON ================= */
function mgSeasonEnd(){
  const t = mgLeagueOf(), tb = mgTable(t), pos = mgPos(), T = TIERS[t];
  const rev = {s:seasonLabel(M.season), club:M.club, t, pos, n:tb.length, pts:tb[pos - 1]?.pts || 0, obj:[], aw:[], moves:[], cups:[]};
  // every league's final table: champions, then who goes up and who goes down
  const champs = {}, moves = [];
  const topOf = (list, n) => list.slice().sort((x, y)=>(M.vs[y] + Math.random()*4) - (M.vs[x] + Math.random()*4)).slice(0, n);
  for (const k of MG_PLAYABLE){ const L = mgTable(k); champs[k] = L[0].n; if (L[0].n===M.club) mgTrophy(TIERS[k].title || TIERS[k].name); }
  for (let k = 1; k<=5; k++){
    const L = mgTable(k), K = TIERS[k], down = L.slice(L.length - K.down).map(r=>r.n);
    let ups;
    if (k<5){ const B = mgTable(k + 1), BT = TIERS[k + 1]; ups = B.slice(0, BT.up).map(r=>r.n); if (BT.po){ const P = M.po[k + 1]; const w = P && P.win ? P.win : B[BT.po[0] - 1].n; if (!ups.includes(w)) ups.push(w); } }
    else ups = topOf(M.tiers[6], K.down);
    moves.push({k, below:k<5 ? k + 1 : 6, down, ups});
  }
  for (const k of FOREIGN){ const L = mgTable(k), K = TIERS[k]; moves.push({k, below:K.second, down:L.slice(L.length - K.down).map(r=>r.n), ups:topOf(M.tiers[K.second], K.down)}); }
  const nextT = {}; for (const k of ALLKEYS) nextT[k] = M.tiers[k].slice();
  moves.forEach(m=>{ nextT[m.k] = nextT[m.k].filter(c=>!m.down.includes(c)).concat(m.ups); nextT[m.below] = nextT[m.below].filter(c=>!m.ups.includes(c)).concat(m.down); });
  rev.moves = moves;
  // the clubs' standing moves with how they did
  for (const k of MG_PLAYABLE){ const L = mgTable(k), byLv = L.slice().sort((a, b)=>mgLevel(b.n) - mgLevel(a.n)).map(r=>r.n);
    L.forEach((r, i)=>{ const e = byLv.indexOf(r.n); M.rep[r.n] = +clamp(mgRep(r.n) + (e - i)/L.length*.04, .55, 1.06).toFixed(3); }); }
  // awards in your league
  rev.aw = mgAwards(t);
  // money: TV and league placing (before the books are judged)
  const tv = (MG_TV[t] || 1e5)*(1 + (tb.length - pos)/tb.length*.6);
  mgFinAdd("inc", "tv", Math.round(tv));
  // the board's verdict on each objective
  let score = 0, wsum = 0;
  M.board.obj.forEach(o=>{
    let met = false, note = "";
    if (o.k==="league"){ met = pos<=o.n; note = `Finished ${ord(pos)}`; if (!met && pos<=o.n + 2){ score += .5*o.w; note += " (close)"; } }
    else if (o.k==="cup"){ const C = M.cups[o.code]; const r = C ? (C.win===M.club ? C.rounds.length : C.out[M.club] ?? C.rounds.length) : 0; met = r>=o.n || (C && C.win===M.club); note = C ? (C.win===M.club ? "Won it" : `Out in the ${C.rounds[Math.min(r, C.rounds.length - 1)]}`) : ""; }
    else if (o.k==="eu"){ const E = M.eu[o.code]; const won = E && E.win===M.club, ko = E && E.final && E.final.indexOf(M.club)<24 && E.final.indexOf(M.club)>=0; const out = E ? E.out[M.club] : null;
      const reached = won ? 9 : out==null ? (ko ? 1 : 0) : Math.max(0, MG_EU_KO.indexOf(out)); met = o.n===0 ? ko || won : reached>=o.n + 1 || won; note = won ? "Won it" : out ? `Out: ${out}` : ""; }
    else if (o.k==="wage"){ met = mgBill()<=M.fin.wb*1.02; note = `${mgWageTxt(mgBill())} of ${mgWageTxt(M.fin.wb)}`; }
    else if (o.k==="youth"){ const n = mgMine().filter(p=>p.age<=21).reduce((s, p)=>s + p.st.st, 0); met = n>=o.n; note = `${n} starts`; }
    else { const r = mdfObjMet(o); if (r){ met = r.met; note = r.note; } }
    o.met = met; score += (met ? 1 : 0)*o.w; wsum += o.w;
    rev.obj.push({t:o.t, imp:o.imp, met, note});
  });
  const grade = wsum ? score/wsum : .5;
  rev.grade = grade>=.95 ? "A+" : grade>=.8 ? "A" : grade>=.65 ? "B" : grade>=.45 ? "C" : grade>=.25 ? "D" : "F";
  mgBoardShift((grade - .5)*36, `Season review: ${rev.grade}`);
  M.mgr.rep = clamp(M.mgr.rep + (grade - .5)*8, 1, 100);
  rev.conf = M.board.conf;
  M.hist.push(mgHistRow(false));
  // next season's budget
  const F = M.fin; F.hist.push({s:seasonLabel(M.season), inc:{...F.inc}, exp:{...F.exp}, bal:F.bal});
  // where every club's going in Europe next season
  M.euroQ = mgEuroNext(champs);
  rev.eu = M.euroQ[M.club] || null;
  // the move up or down
  const relegatedTo = (()=>{ const m = moves.find(x=>x.k===t); return m && m.down.includes(M.club) ? m.below : null; })();
  const promoted = (()=>{ const up = moves.find(x=>x.ups.includes(M.club)); return up ? up.k : null; })();
  rev.up = promoted!=null ? TIERS[promoted].name : null; rev.down = relegatedTo!=null ? TIERS[relegatedTo].name : null;
  M.tiers = nextT; M._tier = null;
  rev.loans = mgLoanees().map(p=>p.n); mgLoanees().forEach(p=>mgLoanBack(p, true));
  // players out on loan with an option: does the loan club take it?
  mgMine().filter(p=>p.loan && p.loan.opt).forEach(p=>{ if (Math.random()<.3 + p.loan.play*.45){ const o = p.loan; p.loan = null; mgSell(p, o.club, {fee:o.opt}); } });
  mgDues("end");
  mgAgeWorld();
  rev.retired = M._retired || []; M._retired = [];
  if (mgDof()) mdfSeasonEnd();
  M.review = rev;
  M.phase = "summer";
  mgHallRecord();
  // relegation out of the game's leagues, or a board that's had enough, ends the job
  const dropped = relegatedTo!=null && !MG_PLAYABLE.includes(keyOf(relegatedTo)), first = M.job.since===M.season;
  if (dropped || M.board.conf<(first ? 20 : 28)){ mgSacked(dropped ? "relegated" : "results", true); M.review.sacked = true; return; }
  // other clubs come calling when you've done well
  M.jobs = mgVacancies(false);
  const offers = M.jobs.filter(j=>mgRep(j.club)>mgRep(M.club) + .02 && M.mgr.rep>=j.need).slice(0, 2);
  offers.forEach(j=>mgMail("job", `Job offer: ${j.club}`, `${j.club} (${TIERS[mgTierOf(j.club)]?.name || ""}) want you as their new manager. Their board expects: ${j.exp}.`, {act:{type:"job", club:j.club}}));
  mgMail("board", `Season review: ${rev.grade}`, `The board has reviewed your season. Confidence: ${mgConfLabel(M.board.conf)}.`, {stop:1});
}
function mgEuroNext(champs){
  const q = {}, cupW = {};
  for (const code in M.cups) if (M.cups[code].win) cupW[M.cups[code].country] = M.cups[code].win;
  for (const k of MG_PLAYABLE){ const K = TIERS[k]; if (!K.eu) continue;
    const L = mgTable(k).map(r=>r.n); let i = 0;
    for (let n = 0; n<K.eu[0]; n++) q[L[i++]] = "UCL";
    const cw = cupW[K.country]; if (cw && !q[cw] && mgTierOf(cw)===k) q[cw] = "UEL";
    for (let n = 0; n<K.eu[1]; n++){ while (q[L[i]]) i++; q[L[i++]] = "UEL"; }
    for (let n = 0; n<K.eu[2]; n++){ while (q[L[i]]) i++; q[L[i++]] = "UECL"; } }
  // Europe's winners come back into the Champions League
  if (M.eu.UCL && M.eu.UCL.win && META[M.eu.UCL.win]) q[M.eu.UCL.win] = "UCL";
  if (M.eu.UEL && M.eu.UEL.win && META[M.eu.UEL.win]) q[M.eu.UEL.win] = "UCL";
  return q;
}
function mgAwards(t){
  const ps = M.tiers[t].flatMap(c=>M.cl[c] ? M.cl[c].sq.map(id=>M.P[id]).filter(Boolean) : []), out = [];
  const best = (f, ok = () => true) => ps.filter(ok).sort((a, b)=>f(b) - f(a))[0];
  const gb = best(p=>p.lg.g*100 - p.lg.mins/1000); if (gb && gb.lg.g) out.push({t:"Golden Boot", p:gb.id, n:gb.n, club:gb.club, v:`${gb.lg.g} goals`});
  const pm = best(p=>p.lg.a*100 - p.lg.mins/1000); if (pm && pm.lg.a) out.push({t:"Playmaker", p:pm.id, n:pm.n, club:pm.club, v:`${pm.lg.a} assists`});
  const minA = Math.max(8, mgRounds(t)*.45), avg = p => p.lg.rn ? p.lg.rs/p.lg.rn : 0;
  const ps1 = best(avg, p=>p.lg.ap>=minA); if (ps1) out.push({t:"Player of the Season", p:ps1.id, n:ps1.n, club:ps1.club, v:`${avg(ps1).toFixed(2)} average`});
  const yp = best(avg, p=>p.lg.ap>=minA*.7 && p.age<=21); if (yp) out.push({t:"Young Player of the Season", p:yp.id, n:yp.n, club:yp.club, v:`${avg(yp).toFixed(2)} average`});
  const gk = best(p=>p.lg.cs*10 + avg(p), p=>p.pos==="GK" && p.lg.ap>=minA); if (gk) out.push({t:"Golden Glove", p:gk.id, n:gk.n, club:gk.club, v:`${gk.lg.cs} clean sheets`});
  // manager of the season: the biggest climb above expectations
  const L = mgTable(t), byLv = L.slice().sort((a, b)=>mgLevel(b.n) - mgLevel(a.n)).map(r=>r.n);
  const mos = L.map((r, i)=>({n:r.n, d:byLv.indexOf(r.n) - i + (i===0 ? 2.5 : 0)})).sort((a, b)=>b.d - a.d)[0];
  out.push({t:"Manager of the Season", n:mos.n===M.club ? (mgDof() ? M.coach.n : M.mgr.name) : (M.am[mos.n] || "Their manager"), club:mos.n, v:`${ord(L.findIndex(r=>r.n===mos.n) + 1)} place`, me:mos.n===M.club && !mgDof()});
  out.forEach(a=>{ if (a.club===M.club){ M.aw.push({s:M.season, t:a.me ? a.t : `${a.t}: ${a.n}`}); if (a.me) M.mgr.rep = Math.min(100, M.mgr.rep + 3); } });
  return out;
}
// a year older: growth and decline, retirements, contracts ending, loans coming back, academy players moving on
function mgAgeWorld(){
  M._retired = [];
  for (const club in M.cl){
    const C = M.cl[club], mine = club===M.club;
    C.sq = C.sq.filter(id=>{
      const p = M.P[id]; if (!p) return false;
      p.car.ap += p.st.ap; p.car.g += p.st.g; p.car.a += p.st.a;
      (p.hist ||= []).push([seasonLabel(M.season), club, p.st.ap, p.st.g, p.st.a, p.st.rn ? +(p.st.rs/p.st.rn).toFixed(2) : 0]);
      if (p.hist.length>8) p.hist.shift();
      p.age++;
      if (!mine) mgDevelopSeason(p);
      p.loan = null;
      const quit = p.age>=38 || (p.age>=34 && Math.random()<(p.age - 33)*.22) || (p.age>=32 && mgOvr(p)<mgBaseLevel(club) - 12 && Math.random()<.4);
      if (quit){ if (mine) M._retired.push(p.n); delete M.P[id]; return false; }
      if (p.con<=M.season){
        if (mine){ mgMail("contract", `${p.n} has left`, `${p.n}'s contract has ended and he has left the club on a free.`); delete M.P[id]; return false; }
        if (Math.random()<.78){ p.con = M.season + 1 + Math.floor(Math.random()*3); p.wage = mgWageAt(p, mgTierOf(club) ?? 1); }
        else { delete M.P[id]; return false; }
      }
      p.inj = p.inj && p.inj.d>60 ? {...p.inj, d:p.inj.d - 60} : null; p.ban = 0; p.fit = 100; p.req = 0;
      return true;
    });
    if (!mine) mgAiRebuild(club);
  }
  // the academy: everyone's a year older; at 19 it's the first team or goodbye
  M.yth = M.yth.filter(id=>{ const p = M.P[id]; if (!p) return false; p.age++; mgDevelop(p, 6, M.train);
    if (p.age>=19){ mgMail("youth", `${p.n} leaves the academy`, `${p.n} is 19 and wasn't offered a professional contract, so he has left the club.`); delete M.P[id]; return false; } return true; });
  // players nobody kept any more fall out of the save (bought players live in squads)
  M.short = M.short.filter(id=>M.P[id] || String(id).startsWith("v:"));
  M.offers = []; M.bids = [];
}
// an AI club tops its squad back up to strength with new signings
function mgAiRebuild(club){
  const C = M.cl[club], lvl = mgBaseLevel(club), need = {};
  const sq = C.sq.map(id=>M.P[id]);
  MG_TEMPLATE.forEach(pos=>{ need[pos] = (need[pos]||0) + 1; });
  sq.forEach(p=>{ if (need[p.pos]>0) need[p.pos]--; });
  const R = Math.random;
  for (const pos in need) for (let k = 0; k<need[pos] && C.sq.length<26; k++){
    const p = mgMakePlayer(R, {id:"p" + (M.nid++), pos, ovr:Math.round(lvl - 2 + mgGauss(R)*3), age:20 + Math.floor(R()*10), nat:mgNatFor(R, club), club});
    p.wage = mgWageAt(p, mgTierOf(club) ?? 1); p.con = M.season + 2 + Math.floor(R()*3);
    M.P[p.id] = p; C.sq.push(p.id);
  }
  mgNumbers(C.sq.map(id=>M.P[id]));
}
function mgNewSeason(){
  M.season++; M.day = MGD(M.season, 6, 1); M.done = false;
  const old = M.job;
  M.job = {...old, p:0, w:0, d:0, l:0};
  // clubs now in your league come into full detail
  M._tier = null; mgTierOf(M.club);
  M.tiers[mgLeagueOf()].forEach(c=>mgMaterialize(c));
  // clubs you no longer meet keep their squads only if they're small enough to keep; others drop out of the save
  const keep = new Set(M.tiers[mgLeagueOf()]);
  for (const c in M.cl) if (!keep.has(c) && c!==M.club){ M.cl[c].sq.forEach(id=>{ if (!M.short.includes(id)) delete M.P[id]; }); delete M.cl[c]; }
  // budgets for the new season
  const F = M.fin, t = mgLeagueOf(), r = mgRep(M.club), perf = M.review ? ({"A+":1, A:.85, B:.7, C:.5, D:.35, F:.2}[M.review.grade] ?? .5) : .5;
  const base = (MG_TB[t] || 1e5)*Math.pow(clamp(r, .5, 1.06), 4);
  F.tb = mgRoundFee(Math.max(0, F.tb)*.5 + base*(.6 + perf*.6));
  M._dues = 1;
  F.wb = mgRoundWage(Math.max(F.wb, mgBill()*(1.02 + perf*.08)));
  F.start = F.tb;
  mgStartSeason();
  M.board.obj = mgObjectives(); M.board.season = M.season;
  M.mgr.age++;
  mgMine().forEach(p=>{ M.kn[p.id] = 100; });
  mgMendXI(true);
  if (mgDof()) mdfPrep(null);
  M.review = null;
  if (M._dues){ M._dues = 0; mgDues("start"); }
  mgMail("board", `${seasonLabel(M.season)}: the new season`, `Pre-season starts today and the transfer window is open until 1 September.\n\nYour transfer budget: ${mgMoney(F.tb)}. Wage budget: ${mgWageTxt(F.wb)}.\n\nThe board expects:\n${M.board.obj.map(o=>`• ${o.t} (${o.imp})`).join("\n")}`, {stop:1});
}

/* ================= PLAYERS: GROWTH, INJURIES, MORALE ================= */
const MG_INJ = [["Knock",2,6,30],["Bruised ankle",5,12,20],["Hamstring strain",12,28,18],["Groin strain",10,22,10],["Calf injury",12,30,9],["Ankle ligaments",21,45,7],["Broken foot",42,70,3],["Knee ligament damage",56,110,2.5],["ACL rupture",170,250,.5]];
function mgInjury(train){
  const list = train ? MG_INJ.slice(0, 5) : MG_INJ, tot = list.reduce((s, x)=>s + x[3], 0); let r = Math.random()*tot;
  for (const [n, lo, hi, w] of list){ r -= w; if (r<=0) return {n, d:Math.round(lo + Math.random()*(hi - lo))}; }
  return {n:"Knock", d:4};
}
const mgMorLabel = m => m>=80 ? "Superb" : m>=65 ? "Good" : m>=50 ? "Okay" : m>=35 ? "Low" : "Very low";
const mgFormAvg = p => p.form && p.form.length ? p.form.reduce((s, x)=>s + x, 0)/p.form.length : null;
// a week's growth (or decline): the young grow towards their potential, faster when they play and train hard
function mgDevelop(p, weeks, T){
  const o = mgOvr(p), age = p.age;
  const base = age<=18 ? .25 : age<=20 ? .22 : age<=22 ? .16 : age<=24 ? .1 : age<=26 ? .06 : age<=28 ? .03 : 0;
  const room = clamp((p.pot - o)/6, 0, 1.5), play = clamp((p._mins || 0)/170, 0, 1);
  const ind = T && T.ind ? T.ind.find(x=>x.id===p.id) : null;
  const tm = T ? (T.int===2 ? 1.25 : T.int===0 ? .8 : 1)*(ind ? 1.3 : 1)*(T.mult || 1) : 1;
  let g = base*room*(.45 + .55*play)*tm*weeks;
  if (age>=30) g -= (age - 29)*.02*weeks*(T && T.focus==="fit" ? .75 : 1);
  if (p.loan) g = base*room*(.45 + .55*p.loan.play)*weeks - (age>=30 ? (age - 29)*.02*weeks : 0);
  p.xp = (p.xp || 0) + g;
  while (p.xp>=1){ p.xp -= 1; mgGrow(p, 1, ind ? ind.k : null); }
  while (p.xp<=-1){ p.xp += 1; mgGrow(p, -1); }
}
function mgGrow(p, d, focus){
  const w = p.pos==="GK" ? MG_GKW : MG_W[p.pos];
  p.at = p.at.map((v, i)=>clamp(v + (w[i]>0 ? d : Math.random()<.25 ? d : 0) + (focus!=null && i===focus && d>0 ? 1 : 0) + (d<0 && i===0 && p.pos!=="GK" && Math.random()<.5 ? -1 : 0), 10, 99));
}
// a season's change at once, for the other clubs' players
function mgDevelopSeason(p){
  const play = clamp(p.st.mins/(Math.max(20, mgRounds(mgTierOf(p.club) ?? 1))*90*.8), 0, 1);
  p._mins = play*170; mgDevelop(p, 40, null); p._mins = 0;
  p.xp += mgGauss(Math.random)*.8;
}

/* ================= TRANSFERS ================= */
const mgClause = p => p.club && mgTierOf(p.club)==="ES" ? mgRoundFee(mgValue(p)*3.2) : 0;
function mgSquadRank(p){ const sq = mgSquad(p.club).slice().sort((a, b)=>mgOvr(b) - mgOvr(a)); return sq.findIndex(x=>x.id===p.id); }
// what a club wants for a player: more for its best players and when it's the bigger club, less near the end of his contract
function mgAsk(p){
  if (!p.club) return 0;
  const rank = mgSquadRank(p);
  let f = rank<0 ? 1.1 : rank<3 ? 1.55 : rank<11 ? 1.3 : 1.08;
  if (p.con - M.season<=0) f *= .65;
  if (mgRep(p.club) - mgRep(M.club)>.08) f *= 1.2;
  if (p.tl) f *= .85;
  return mgRoundFee(mgValue(p)*f);
}
// will he even talk to you? A player won't drop to a much smaller club, or to one where he'd be a long way below the team
function mgInterest(p){
  const myLv = mgLevel(M.club), o = mgOvr(p), step = mgRep(M.club) - mgRep(p.club || M.club) + (M.euroQ[M.club]==="UCL" ? .05 : 0);
  const lvlOf = c => { const t = mgTierOf(c); return t==null ? 9 : TIERS[t].level*(isTop(t) || ENG.includes(t) ? 1 : 1.4); };
  if (p.club && lvlOf(M.club)>lvlOf(p.club) + .5 && o>myLv + 3) return {ok:false, txt:"Not interested: he won't drop down a division"};
  if (step<-.12 && o>myLv + 4) return {ok:false, txt:`Not interested: ${M.club} is a step down for him`};
  if (o<myLv - 12 && p.age>23) return {ok:true, txt:"Keen: he'd jump at the chance", keen:1};
  return {ok:true, txt:step>.05 ? "Interested: it's a step up" : "Open to talks"};
}
function mgDemand(p, role, renew){
  const base = Math.max(mgWageAt(p, mgLeagueOf()), (p.wage || 0)*(renew ? 1.05 : 1.12));
  const rf = [1.22, 1.1, 1, .93, .86][role ?? 2];
  const mor = renew ? (p.mor<40 ? 1.25 : p.mor<55 ? 1.1 : 1) : 1;
  return mgRoundWage(base*rf*mor*(p.club && mgRep(p.club)>mgRep(M.club) ? 1.12 : 1));
}
function mgRoleOk(p, role){ const lv = mgLevel(M.club), o = mgOvr(p); if (o>=lv + 2 && role>=2) return false; if (o>=lv - 1 && role>=3 && p.age>21) return false; return true; }
const mgBidOf = id => (M.bids ||= []).find(b=>b.id===id && b.s===M.season && b.win===mgWindowKey());
const mgWindowKey = () => mgDate(M.day).getUTCMonth()===0 ? "jan" : "sum";
// your offer for a player: accepted, a counter-offer, or a no
/* ---------- the small print ----------
   A transfer is more than a fee. When buying: pay up front or over two or three seasons, add-ons (paid if he plays 20
   league games in his first season), a sell-on percentage of his next fee for his old club, and a player of yours in
   part-exchange. When selling: the same, plus a buy-back clause. Contracts have a signing-on fee, an appearance bonus
   and a release clause (players like them, but a bigger club can pay the clause and take him). A club values money
   later and add-ons for less than money now. */
const MG_INST = ["All up front", "Over 2 seasons", "Over 3 seasons"];
const mgSellOnWorth = (p, pct) => (pct || 0)/100*mgValue(p)*(p.age<=21 ? 1.3 : p.age<=24 ? 1 : p.age<=28 ? .55 : .2);
const mgBuyBackCost = (p, bb) => bb ? mgValue(p)*(bb<=mgValue(p)*1.5 ? .3 : bb<=mgValue(p)*2.5 ? .15 : .05) : 0;
const mgDealWorth = (p, t) => (t.fee || 0)*(1 - .045*(t.inst || 0)) + (t.addon || 0)*.55 + mgSellOnWorth(p, t.sell);
function mgDealTxt(t, p){
  const out = [mgMoney(t.fee)];
  if (t.inst) out[0] += ` (${mgMoney(t.fee/(t.inst + 1))} now, the rest over ${t.inst===1 ? "the next season" : "the next two seasons"})`;
  if (t.addon) out.push(`${mgMoney(t.addon)} in add-ons`);
  if (t.sell) out.push(`a ${t.sell}% sell-on clause`);
  if (t.bb) out.push(`a ${mgMoney(t.bb)} buy-back clause`);
  if (t.swap && M.P[t.swap]) out.push(`${M.P[t.swap].n} in part-exchange`);
  return out.join(" + ");
}
const mgClauseOf = p => p.rc || mgClause(p);
// your offer for a player: accepted, a counter-offer, or a no
function mgBid(p, t){
  if (typeof t==="number") t = {fee:t};
  t = {fee:Math.round(t.fee || 0), inst:t.inst || 0, addon:Math.round(t.addon || 0), sell:t.sell || 0, swap:t.swap || null};
  if (!mgInWindow()) return {txt:"The transfer window is closed."};
  const now = Math.round(t.fee/(t.inst + 1));
  if (now>M.fin.tb) return {txt:`The first payment (${mgMoney(now)}) is more than your transfer budget (${mgMoney(M.fin.tb)}).`};
  let B = mgBidOf(p.id); if (!B){ B = {id:p.id, n:p.n, club:p.club, s:M.season, win:mgWindowKey(), tries:0, st:"fee"}; M.bids.push(B); }
  if (B.st==="off") return {txt:`${p.club} won't talk to you about ${p.n} again this window.`};
  if (B.st==="contract" || B.st==="done") return {txt:"The fee's already agreed.", ok:true};
  // a player of yours in the deal: they have to want him
  let swapV = 0;
  if (t.swap){ const q = M.P[t.swap]; if (!q || q.club!==M.club || q.lin || q.loan) return {txt:"That player can't be part of the deal."};
    if (mgOvr(q)<mgLevel(p.club) - 7 || q.age>32) return {txt:`${p.club} aren't interested in ${q.n}.`};
    swapV = mgValue(q)*.85; }
  B.tries++;
  const ask = mgAsk(p), cl = mgClauseOf(p), worth = mgDealWorth(p, t) + swapV;
  const done = txt => { B.st = "contract"; B.fee = t.fee; B.terms = {...t}; return {ok:true, txt}; };
  if (cl && t.fee>=cl && !t.inst && !t.swap) return done(`You've met his release clause: ${mgMoney(cl)}.`);
  if (worth>=ask) return done(`${p.club} accept: ${mgDealTxt(t)}.`);
  if (B.tries>=3){ B.st = "off"; return {txt:`${p.club} have broken off talks: three offers well short of their valuation.`}; }
  if (worth>=ask*.8){ const rest = worth - t.fee*(1 - .045*t.inst), need = (ask - rest)/(1 - .045*t.inst);
    B.counter = mgRoundFee(need*(1 - (B.tries - 1)*.03)); const extra = t.inst || t.addon || t.sell || t.swap;
    return {counter:B.counter, txt:`${p.club} want ${mgMoney(B.counter)}${extra ? ", with the rest of your offer as it is" : ""}.`}; }
  return {txt:`${p.club} reject it out of hand: it's nowhere near their valuation. (${3 - B.tries} offer${3 - B.tries===1 ? "" : "s"} left.)`};
}
// your contract offer: he signs, asks for more, or walks away. c: {wage, yrs, role, sign (signing-on fee), app (bonus a game), rc (release clause)}
function mgOffer(p, c, yrs, role, renew){
  if (typeof c==="number") c = {wage:c, yrs, role};
  c = {wage:Math.round(c.wage || 0), yrs:c.yrs || 3, role:c.role ?? 2, sign:Math.round(c.sign || 0), app:Math.round(c.app || 0), rc:Math.round(c.rc || 0)};
  const B = renew ? (p._renew ||= {tries:0}) : mgBidOf(p.id) || (p.club ? null : (()=>{ const b = {id:p.id, n:p.n, club:null, s:M.season, win:mgWindowKey(), tries:0, st:"contract", fee:0}; M.bids.push(b); return b; })());
  if (!renew && (!B || B.st!=="contract")) return {txt:"Agree a fee with his club first."};
  const room = M.fin.wb - (mgBill() - (renew ? p.wage : 0));
  if (c.wage>room) return {txt:`That's over your wage budget: you've ${mgWageTxt(Math.max(0, room))} of room.`};
  if (c.sign>M.fin.tb) return {txt:`You can't afford a ${mgMoney(c.sign)} signing-on fee (transfer budget ${mgMoney(M.fin.tb)}).`};
  if (!mgRoleOk(p, c.role)) return {txt:`He won't accept being a ${MG_ROLES[c.role].toLowerCase()} player.`};
  if (c.yrs>(p.age>=33 ? 1 : p.age>=31 ? 2 : 5)) return {txt:`At ${p.age} he only wants a ${p.age>=33 ? "one" : "two"}-year deal.`};
  if (renew && p.req) return {txt:`${p.n} wants to leave and won't sign a new deal.`};
  const v = mgValue(p), rcF = c.rc ? (c.rc<=v*1.6 ? .92 : c.rc<=v*3 ? .96 : .985) : 1;
  const dem = mgDemand(p, c.role, renew)*rcF;
  // what the package is worth to him a week: the wage, the signing-on fee spread over the deal, his likely bonuses
  const extra = c.sign/(52*c.yrs)*.9 + c.app*MG_ROLE_SHARE[c.role]*.8, worth = c.wage + extra;
  B.ctries = (B.ctries || 0) + 1;
  if (worth>=dem*.97) return {ok:true, txt:`${p.n} agrees!`, c};
  const wantW = mgRoundWage(Math.max(0, dem - extra));
  if (B.ctries>=3){ if (!renew) B.st = "off"; return {txt:`${p.n} has ended talks. He wanted around ${mgWageTxt(wantW)} with the rest as offered.`}; }
  if (worth>=dem*.85) return {counter:wantW, txt:`He wants ${mgWageTxt(wantW)} a week with the rest as offered.`};
  return {txt:`He laughs it off: he wants a lot more than that.`};
}
function mgSign(p, c, yrs, role){
  if (typeof c==="number") c = {wage:c, yrs, role};
  const B = mgBidOf(p.id), T = (B && B.terms) || {fee:B ? B.fee || 0 : 0}, fee = T.fee || 0, from = p.club || "free agency";
  let q = p;
  if (p.virt || !M.P[p.id]){ q = {...p, id:"p" + (M.nid++), st:mgStat(), lg:mgStat(), car:{ap:0, g:0, a:0}}; delete q.virt; M.gone[p.id] = 1; M.P[q.id] = q; mgVCache.clear(); }
  if (p.club && M.cl[p.club]) M.cl[p.club].sq = M.cl[p.club].sq.filter(id=>id!==p.id);
  M.fa = (M.fa || []).filter(id=>id!==p.id);
  Object.assign(q, {club:M.club, wage:c.wage, con:M.season + c.yrs - 1, role:c.role, mor:Math.max(q.mor, 76), joined:M.season, from, fee, tl:0, ll:0, req:0, num:0, form:[], _renew:null,
    rc:c.rc || 0, bon:c.app || 0, sellOn:T.sell ? {club:from, pct:T.sell} : null});
  M.cl[M.club].sq.push(q.id); mgNumbers(mgMine());
  M.kn[q.id] = 100; M.short = M.short.filter(id=>id!==p.id);
  // the money: now, later, and only if he plays
  const lines = [];
  if (fee){ const now = Math.round(fee/((T.inst || 0) + 1)); M.fin.tb -= now; mgFinAdd("exp", "buys", now);
    for (let k = 1; k<=(T.inst || 0); k++) (M.pay ||= []).push({why:"inst", club:from, n:q.n, amt:now, s:M.season + k});
    if (T.inst) lines.push(`${mgMoney(now)} paid now, ${mgMoney(now)} at the start of each of the next ${T.inst===1 ? "season" : "two seasons"}.`); }
  if (T.addon){ (M.pay ||= []).push({why:"addon", club:from, n:q.n, pid:q.id, amt:T.addon, s:M.season, need:mgDate(M.day).getUTCMonth()<6 ? 10 : 20}); lines.push(`${mgMoney(T.addon)} more if he plays ${mgDate(M.day).getUTCMonth()<6 ? 10 : 20} league games this season.`); }
  if (T.sell) lines.push(`${from} get ${T.sell}% of any fee when you sell him.`);
  if (T.swap){ const x = M.P[T.swap]; if (x){ mgPartEx(x, from); lines.push(`${x.n} has gone the other way.`); } }
  if (c.sign){ M.fin.tb -= c.sign; mgFinAdd("exp", "fees", c.sign); lines.push(`Signing-on fee: ${mgMoney(c.sign)}.`); }
  if (c.app) lines.push(`Appearance bonus: ${mgMoney(c.app)} a game.`);
  if (c.rc) lines.push(`Release clause: ${mgMoney(c.rc)}.`);
  if (B) B.st = "done";
  if (M.tac.bench.length<9) M.tac.bench.push(q.id);
  const xi = q._in = mgAssistIn(q); mdfArrived(q);
  mgMail("transfer", `${q.n} signs!`, `${q.n} (${q.pos}, ${q.age}) joins from ${from}${fee ? ` for ${mgDealTxt(T)}` : ""} on ${mgWageTxt(c.wage)} until ${M.season + c.yrs}. Squad role: ${MG_ROLES[c.role]}.${lines.length ? "\n\n" + lines.join("\n") : ""}${xi ? `\n\nYour assistant has put him straight into the XI at ${xi.pos}${xi.out ? `, in place of ${xi.out}` : ""}.` : "\n\nYour assistant has kept your XI as it is: he starts on the bench."}`);
  mgSave(); return q;
}
// a player of yours going the other way in a deal
function mgPartEx(x, to){
  M.cl[M.club].sq = M.cl[M.club].sq.filter(id=>id!==x.id);
  M.tac.xi = M.tac.xi.map(id=>id===x.id ? null : id); M.tac.bench = M.tac.bench.filter(id=>id!==x.id); if (M.tac.cap===x.id) M.tac.cap = null;
  M.train.ind = M.train.ind.filter(y=>y.id!==x.id);
  if (to && M.cl[to]){ M.cl[to].sq.push(x.id); Object.assign(x, {club:to, tl:0, ll:0, req:0, num:0, joined:M.season, from:M.club, wage:mgWageAt(x, mgTierOf(to) ?? 1), con:M.season + 3, rc:0, bon:0, sellOn:null}); mgNumbers(mgSquad(to)); }
  else { M.tl.push({n:x.n, from:M.club, to, fee:0, s:seasonLabel(M.season), pe:true}); delete M.P[x.id]; }
  mgMendXI(true);
}
function mgRenew(p, c, yrs, role){
  if (typeof c==="number") c = {wage:c, yrs, role};
  p.wage = c.wage; p.con = M.season + c.yrs - (M.day>=MGD(M.season + 1, 3, 1) ? 0 : 1); p.role = c.role; p.mor = clamp(p.mor + 10, 0, 100); p._renew = null;
  p.rc = c.rc || 0; p.bon = c.app || 0;
  if (c.sign){ M.fin.tb -= c.sign; mgFinAdd("exp", "fees", c.sign); }
  mgMail("contract", `${p.n} signs a new deal`, `${p.n} has signed a new contract until ${p.con + 1} on ${mgWageTxt(c.wage)}${c.sign ? `, with a ${mgMoney(c.sign)} signing-on fee` : ""}${c.app ? `, ${mgMoney(c.app)} a game in bonuses` : ""}${c.rc ? `, and a ${mgMoney(c.rc)} release clause` : ""}.`); mgSave(); }
// selling: t is the deal ({fee, inst, addon, sell, bb}) or just a fee
function mgSell(p, to, t, why){
  if (typeof t==="number") t = {fee:t};
  const fee = t.fee || 0, now = Math.round(fee/((t.inst || 0) + 1)), lines = [];
  mdfSold(p);
  M.cl[M.club].sq = M.cl[M.club].sq.filter(id=>id!==p.id);
  M.tac.xi = M.tac.xi.map(id=>id===p.id ? null : id); M.tac.bench = M.tac.bench.filter(id=>id!==p.id);
  if (M.tac.cap===p.id) M.tac.cap = null;
  M.train.ind = M.train.ind.filter(x=>x.id!==p.id);
  M.fin.tb += now; mgFinAdd("inc", "sales", now);
  // what you owe his old club, and what's still to come to you
  if (p.sellOn && p.sellOn.pct && fee){ const cut = mgRoundFee(fee*p.sellOn.pct/100); M.fin.tb -= cut; mgFinAdd("exp", "fees", cut); lines.push(`${p.sellOn.club} take ${p.sellOn.pct}% (${mgMoney(cut)}) under their sell-on clause.`); }
  const R = (M.recv ||= []);
  for (let k = 1; k<=(t.inst || 0); k++) R.push({why:"inst", club:to, n:p.n, amt:now, s:M.season + k});
  if (t.inst) lines.push(`${mgMoney(now)} now, ${mgMoney(now)} at the start of each of the next ${t.inst===1 ? "season" : "two seasons"}.`);
  if (t.addon){ R.push({why:"addon", club:to, n:p.n, amt:t.addon, s:M.season, ch:+clamp(.35 + (mgOvr(p) - mgLevel(to))/15, .1, .85).toFixed(2)}); lines.push(`${mgMoney(t.addon)} more in add-ons if he plays regularly for them.`); }
  if (t.sell){ R.push({why:"sellon", club:to, n:p.n, pct:t.sell, val:mgValue(p), age:p.age, s:M.season, until:M.season + 4}); lines.push(`You get ${t.sell}% of his next fee.`); }
  if (t.bb){ (M.bb ||= []).push({n:p.n, club:to, fee:t.bb, until:M.season + 2, s:M.season, snap:mgPack({...p, st:mgStat(), lg:mgStat(), tl:0, ll:0, req:0, rc:0, bon:0, sellOn:null, loan:null})}); lines.push(`You can buy him back for ${mgMoney(t.bb)} until the summer of ${M.season + 3}.`); }
  if (to && M.cl[to]){ M.cl[to].sq.push(p.id); Object.assign(p, {club:to, tl:0, ll:0, req:0, num:0, joined:M.season, from:M.club, fee, wage:mgWageAt(p, mgTierOf(to) ?? 1), con:M.season + 3, rc:0, bon:0, sellOn:null, loan:null}); mgNumbers(mgSquad(to)); }
  else { M.tl.push({n:p.n, from:M.club, to, fee, s:seasonLabel(M.season)}); delete M.P[p.id]; }
  mgMendXI(true);
  mgMail("transfer", why==="clause" ? `${to} trigger ${p.n}'s release clause` : `${p.n} sold to ${to}`, `${why==="clause" ? `${to} have paid ${p.n}'s ${mgMoney(fee)} release clause, and he has gone.` : `${p.n} has joined ${to} for ${mgDealTxt(t)}.`} Your transfer budget is now ${mgMoney(M.fin.tb)}.${lines.length ? "\n\n" + lines.join("\n") : ""}`, why==="clause" ? {stop:1} : {});
  mgSave();
}
// money due: instalments at the start of a season; add-ons, sell-ons and expiring buy-backs at the end of one
function mgDues(when){
  const out = [];
  M.pay = (M.pay || []).filter(x=>{
    if (x.s>M.season) return true;
    if (x.why==="inst" && when==="start"){ M.fin.tb -= x.amt; mgFinAdd("exp", "buys", x.amt); out.push(`You paid ${x.club} ${mgMoney(x.amt)} (an instalment for ${x.n}).`); return false; }
    if (x.why==="addon" && when==="end"){ const q = M.P[x.pid]; if (q && q.club===M.club && q.lg.ap>=x.need){ M.fin.tb -= x.amt; mgFinAdd("exp", "buys", x.amt); out.push(`${x.n} played ${q.lg.ap} league games: ${x.club} get their ${mgMoney(x.amt)} add-on.`); } else out.push(`${x.n}'s add-on to ${x.club} wasn't triggered.`); return false; }
    return true; });
  M.recv = (M.recv || []).filter(x=>{
    if (x.why==="inst" && when==="start" && x.s<=M.season){ M.fin.tb += x.amt; mgFinAdd("inc", "sales", x.amt); out.push(`${x.club} paid you ${mgMoney(x.amt)} (an instalment for ${x.n}).`); return false; }
    if (x.why==="addon" && when==="end" && x.s<=M.season){ if (Math.random()<x.ch){ M.fin.tb += x.amt; mgFinAdd("inc", "sales", x.amt); out.push(`${x.n} played enough for ${x.club}: you get a ${mgMoney(x.amt)} add-on.`); } else out.push(`${x.n}'s add-on from ${x.club} wasn't triggered.`); return false; }
    if (x.why==="sellon" && when==="end" && x.s<M.season){
      if (M.season>=x.until) return false;
      const age = x.age + (M.season - x.s);
      if (Math.random()<(age<=27 ? .22 : .1)){ const nf = mgRoundFee(x.val*(.8 + Math.random()*1.1)*(age<=26 ? 1.2 : .8)), cut = mgRoundFee(nf*x.pct/100); M.fin.tb += cut; mgFinAdd("inc", "sales", cut);
        out.push(`${x.n} has been sold on by ${x.club} for ${mgMoney(nf)}: your ${x.pct}% sell-on brings in ${mgMoney(cut)}.`); return false; } }
    return true; });
  if (when==="end") M.bb = (M.bb || []).filter(x=>{ if (M.season + 1>x.until){ out.push(`Your buy-back clause for ${x.n} has run out.`); return false; } return true; });
  if (out.length) mgMail("transfer", when==="start" ? "Transfer payments" : "Transfer clauses settled", out.join("\n"));
}
// buying back a player you sold with a buy-back clause
function mgBuyBack(i){
  const x = (M.bb || [])[i]; if (!x) return "That clause has gone.";
  if (!mgInWindow()) return "Buy-backs go through when a window's open.";
  if (M.fin.tb<x.fee) return `You need ${mgMoney(x.fee)} in your transfer budget.`;
  const q = mgUnpack(x.snap); q.id = "p" + (M.nid++); q.age += M.season - x.s;
  Object.assign(q, {club:M.club, wage:mgRoundWage(q.wage*1.1), con:M.season + 2, joined:M.season, from:x.club, fee:x.fee, mor:75, num:0, form:[], inj:null, ban:0});
  M.P[q.id] = q; M.cl[M.club].sq.push(q.id); mgNumbers(mgMine()); M.kn[q.id] = 100;
  M.fin.tb -= x.fee; mgFinAdd("exp", "buys", x.fee); M.bb.splice(i, 1);
  M.recv = (M.recv || []).filter(r=>!(r.n===x.n && r.club===x.club));   // anything they still owed you for him is off
  if (M.tac.bench.length<9) M.tac.bench.push(q.id);
  const xi = mgAssistIn(q);
  mgMail("transfer", `${q.n} is back!`, `You've used your buy-back clause: ${q.n} returns from ${x.club} for ${mgMoney(x.fee)}.${xi ? ` Your assistant has put him straight into the XI at ${xi.pos}.` : ""}`);
  mgSave(); return "";
}
function mgRelease(p){
  const left = Math.max(0, p.con - M.season + 1), cost = mgRoundFee(p.wage*52*left*.5);
  M.fin.tb -= cost; mgFinAdd("exp", "fees", cost);
  M.cl[M.club].sq = M.cl[M.club].sq.filter(id=>id!==p.id);
  M.tac.xi = M.tac.xi.map(id=>id===p.id ? null : id); M.tac.bench = M.tac.bench.filter(id=>id!==p.id);
  Object.assign(p, {club:null, tl:0, ll:0, num:0, form:[], wage:mgRoundWage(p.wage*.8)}); (M.fa ||= []).push(p.id);
  mgMendXI(true); mgMail("contract", `${p.n} released`, `${p.n} has left the club. Paying up his contract cost ${mgMoney(cost)}.`); mgSave();
}
/* ---------- loans in ----------
   Borrow a player until the end of the season. His club decides whether he can go (their young players and those
   outside their first team can), and wants him playing and some of his wages paid: the bigger they are than you,
   and the older he is, the more. You can agree an option to buy him. He goes back in the summer unless you take it. */
const MG_LOAN_MAX = 4;
const mgLoanees = () => mgMine().filter(p=>p.lin);
function mgLoanable(p){ if (!p || !p.club || p.club===M.club || p.lin || p.yth) return false; const r = mgSquadRank(p); return !!p.tl || (p.age<=23 && r>=4) || r>=13; }
function mgLoanInterest(p){
  const o = mgOvr(p), lv = mgLevel(M.club);
  if (o>lv + 9 && p.age>24) return {ok:false, txt:"Not interested: he'd rather fight for his place"};
  return {ok:true, txt:o>=lv + 2 ? "Keen: he'd be a first-team player for you" : p.age<=21 ? "Keen: he wants games" : "Open to a loan"};
}
const mgLoanNeed = (p, role) => clamp(.45 + (mgRep(p.club) - mgRep(M.club))*.6 + (p.age>23 ? .25 : 0) - (role<=1 ? .25 : role===2 ? .1 : 0), 0, 1);
function mgLoanAsk(p, pay, role, opt){
  if (!mgInWindow()) return {txt:"The transfer window is closed."};
  if (!mgLoanable(p)) return {txt:`${p.club} won't loan him out: he's part of their plans.`};
  if (mgLoanees().length>=MG_LOAN_MAX) return {txt:`You already have ${MG_LOAN_MAX} players on loan.`};
  const I = mgLoanInterest(p); if (!I.ok) return {txt:I.txt + "."};
  if (p.age<=23 && role>=3) return {txt:`${p.club} want him playing: promise him more than a ${MG_ROLES[role].toLowerCase()} role.`};
  const room = M.fin.wb - mgBill(); if (p.wage*pay>room + 1) return {txt:`Paying ${Math.round(pay*100)}% of his wages (${mgWageTxt(p.wage*pay)}) takes you over your wage budget.`};
  const need = Math.ceil(mgLoanNeed(p, role)*4)/4;
  if (pay + 1e-6<need) return {counter:need, txt:`${p.club} want you to pay ${Math.round(need*100)}% of his wages (${mgWageTxt(p.wage*need)}).`};
  if (opt){ const min = mgRoundFee(mgValue(p)*1.2); if (opt<min) return {counter:pay, opt:min, txt:`For an option to buy him, ${p.club} want at least ${mgMoney(min)}.`}; }
  return {ok:true, txt:`${p.club} agree: ${p.n} joins you on loan until the end of the season.`};
}
function mgLoanIn(p, pay, role, opt){
  let q = p;
  if (p.virt || !M.P[p.id]){ q = {...p, id:"p" + (M.nid++), st:mgStat(), lg:mgStat(), car:{ap:0, g:0, a:0}}; delete q.virt; M.gone[p.id] = 1; M.P[q.id] = q; mgVCache.clear(); }
  if (p.club && M.cl[p.club]) M.cl[p.club].sq = M.cl[p.club].sq.filter(id=>id!==p.id);
  const from = p.club;
  Object.assign(q, {club:M.club, role, mor:Math.max(q.mor, 72), num:0, form:[], tl:0, ll:0, req:0, pt:MG_ROLE_SHARE[role]});
  q.lin = {from, pay, opt:opt || 0, s:M.season};
  M.cl[M.club].sq.push(q.id); mgNumbers(mgMine()); M.kn[q.id] = 100; M.short = M.short.filter(id=>id!==p.id);
  if (M.tac.bench.length<9) M.tac.bench.push(q.id);
  const xi = q._in = mgAssistIn(q); mdfArrived(q);
  mgMail("transfer", `${q.n} arrives on loan`, `${q.n} (${q.pos}, ${q.age}) joins on loan from ${from} until the end of the season. You pay ${Math.round(pay*100)}% of his wages (${mgWageTxt(q.wage*pay)}). Squad role: ${MG_ROLES[role]}.${opt ? ` You can make it permanent for ${mgMoney(opt)}.` : ""}${xi ? `\n\nYour assistant has put him straight into the XI at ${xi.pos}${xi.out ? `, in place of ${xi.out}` : ""}.` : "\n\nYour assistant has kept your XI as it is: he starts on the bench."}`);
  mgSave(); return q;
}
// the assistant's call on a new arrival: into the XI where he's clearly better than the man playing there
function mgAssistIn(q){
  if (!mgAvail(q)) return null;
  const T = M.tac, slots = MG_FORM[T.f];
  let best = -1, gain = .8;
  T.xi.forEach((id, i)=>{ const cur = M.P[id], pos = slots[i][0], g = mgEff(q, pos) - (cur && mgAvail(cur) ? mgEff(cur, pos) : 0); if (g>gain){ gain = g; best = i; } });
  if (best<0) return null;
  const out = M.P[T.xi[best]];
  T.xi[best] = q.id; T.bench = T.bench.filter(id=>id!==q.id);
  if (out){ T.bench.unshift(out.id); T.bench = T.bench.slice(0, 9); }
  mgMendXI(true);
  return {pos:slots[best][0], out:out ? out.n : null};
}
function mgLoanBack(p, quiet){
  if (!p.lin) return;
  const from = p.lin.from;
  M.cl[M.club].sq = M.cl[M.club].sq.filter(id=>id!==p.id);
  M.tac.xi = M.tac.xi.map(id=>id===p.id ? null : id); M.tac.bench = M.tac.bench.filter(id=>id!==p.id); if (M.tac.cap===p.id) M.tac.cap = null;
  M.train.ind = M.train.ind.filter(x=>x.id!==p.id);
  delete p.lin;
  if (from && M.cl[from]){ Object.assign(p, {club:from, num:0, role:2}); M.cl[from].sq.push(p.id); mgNumbers(mgSquad(from)); }
  else delete M.P[p.id];
  if (!quiet) mgMail("transfer", `${p.n} returns to ${from}`, `${p.n}'s loan is over and he has gone back to ${from}.`);
  mgMendXI(true); mgSave();
}
function mgLoanBuy(p){
  const fee = p.lin && p.lin.opt; if (!fee) return "There's no option to buy him.";
  if (M.fin.tb<fee) return `You need ${mgMoney(fee)} in your transfer budget.`;
  M.fin.tb -= fee; mgFinAdd("exp", "buys", fee);
  const from = p.lin.from; delete p.lin;
  Object.assign(p, {from, fee, joined:M.season, con:Math.max(p.con, M.season + 3)});
  M.inbox.forEach(m=>{ if (m.act && m.act.type==="loanopt" && m.act.id===p.id && !m.act.done) m.act.done = "Signed"; });
  mgMail("transfer", `${p.n} signs permanently`, `You've taken up the option: ${p.n} joins from ${from} for ${mgMoney(fee)}.`);
  mgSave(); return "";
}

// the transfer market: everyone matching what you're looking for (clubs outside your league are drawn as needed)
function mgSearch(q){
  const leagues = q.lg==="all" ? MG_PLAYABLE : q.lg==="fa" ? [] : [keyOf(q.lg)];
  let pool = leagues.flatMap(t=>M.tiers[t].filter(c=>c!==M.club).flatMap(c=>mgSquad(c)));
  if (q.lg==="all" || q.lg==="fa") pool = pool.concat(mgFreeAgents());
  const name = String(q.name || "").trim().toLowerCase();
  return pool.filter(p=>(q.pos==="any" || p.pos===q.pos || (q.pos==="DEF" && MG_GROUP(p.pos)==="DEF") || (q.pos==="MID" && MG_GROUP(p.pos)==="MID") || (q.pos==="ATT" && MG_GROUP(p.pos)==="ATT"))
    && p.age<=q.age && mgEst(p).hi>=q.ovr && (!q.max || mgValue(p)<=q.max) && (!name || p.n.toLowerCase().includes(name)) && !M.gone[p.id] && (q.loan!=="loan" || mgLoanable(p)))
    .map(p=>({p, ok:mgInterest(p).ok ? 1 : 0, o:mgEst(p).mid})).sort((a, b)=>b.ok - a.ok || b.o - a.o).slice(0, 60).map(x=>x.p);
}
function mgFreeAgents(){
  if (!M.fa || M.faS!==M.season){ M.fa = (M.fa || []).filter(id=>M.P[id] && !M.P[id].club); M.faS = M.season;
    const R = Math.random, lv = mgLevel(M.club);
    for (let i = 0; i<14; i++){ const pos = mgPick(R, MG_TEMPLATE), age = 27 + Math.floor(R()*8), p = mgMakePlayer(R, {id:"p" + (M.nid++), pos, ovr:Math.round(lv - 4 + mgGauss(R)*5), age, nat:mgPick(R, SQ_FOREIGN)});
      p.club = null; p.wage = mgRoundWage(mgWageAt(p, mgLeagueOf())*.8); M.P[p.id] = p; M.fa.push(p.id); } }
  return M.fa.map(id=>M.P[id]).filter(p=>p && !p.club);
}
// what your scouts know about a player: his overall and potential as a range until he's been watched
function mgKnow(p){ if (p.club===M.club || M.yth.includes(p.id)) return 100; const k = M.kn[p.id]; if (k!=null) return k; return p.club && mgTierOf(p.club)===mgLeagueOf() ? 60 : 25; }
function mgEst(p){
  const k = mgKnow(p), o = mgOvr(p);
  if (k>=100) return {lo:o, hi:o, mid:o, plo:p.pot, phi:p.pot, k};
  const w = Math.max(1, Math.round((100 - k)/9)), off = hashStr(p.id + "e") % (w + 1), lo = o - off;
  const pw = Math.round(w*1.6), poff = hashStr(p.id + "p") % (pw + 1);
  return {lo, hi:lo + w, mid:o, plo:k>=45 ? p.pot - poff : null, phi:k>=45 ? p.pot - poff + pw : null, k};
}
const mgScoutsMax = () => clamp(Math.round(1 + mgRep(M.club)*3), 2, 4);
function mgScout(p){
  if (M.scout.some(s=>s.id===p.id)) return "Already being scouted.";
  if (M.scout.length>=mgScoutsMax()) return `All ${mgScoutsMax()} of your scouts are busy.`;
  M.scout.push({id:p.id, n:p.n, club:p.club, d:Math.max(2, Math.round((mgCountry(p.club)===mgCountry(M.club) ? 4 : 8)*mgxScoutF())), p:p.virt ? {...p} : null}); mgSave(); return "";
}
function mgScoutDone(s){
  M.kn[s.id] = 100;
  const p = M.P[s.id] || mgFindVirtual(s.id) || s.p; if (!p) return;
  const i = mgInterest(p), ask = mgAsk(p);
  mgMail("scout", `Scout report: ${p.n}`, `${p.n} · ${p.pos} · ${p.age} · ${p.club || "free agent"}\nOverall ${mgOvr(p)} · Potential ${p.pot}\nValue ${mgMoney(mgValue(p))}${p.club ? ` · they'd want about ${mgMoney(ask)}` : ""}\n${i.txt}.`, {act:{type:"player", id:p.id}});
}
function mgFindVirtual(id){ if (!String(id).startsWith("v:")) return null; const club = String(id).split("|")[1]; return club ? mgSquad(club).find(p=>p.id===id) || null : null; }
const mgFind = id => M.P[id] || mgFindVirtual(id);

/* ---------- the window: offers for your players, the other clubs' business ---------- */
function mgWindowWeek(){
  M.offers ||= [];
  const mine = mgMine(), lv = mgLevel(M.club), open = M.offers.filter(o=>o.st==="open").length;
  let n = 0;
  for (const p of mgShuffleR(mine, Math.random)){
    if (p.lin || n>=1 || open + n>=2 || M.offers.some(o=>o.pid===p.id && o.st==="open")) continue;
    const o = mgOvr(p), f = mgFormAvg(p) || 6.6;
    const ch = p.tl ? .3 : p.req ? .2 : (o>=lv + 2 ? .02 : .006) + (f>7.3 ? .015 : 0);
    if (Math.random()>ch) continue;
    const club = mgBuyerFor(p); if (!club) continue;
    const fee = mgRoundFee(mgValue(p)*(p.tl ? .7 + Math.random()*.3 : .9 + Math.random()*.4)), r = Math.random();
    const t = {fee, inst:r<.6 ? 0 : r<.9 ? 1 : 2, addon:Math.random()<.35 ? mgRoundFee(fee*(.08 + Math.random()*.17)) : 0, sell:0, bb:0};
    const id = (M.ofid = (M.ofid || 0) + 1);
    M.offers.push({id, pid:p.id, club, ...t, exp:M.day + 5, st:"open"});
    mgMail("transfer", `Offer for ${p.n}: ${mgMoney(fee)}`, `${club} have bid ${mgDealTxt(t)} for ${p.n} (value ${mgMoney(mgValue(p))}). The offer stands for 5 days. Accept it, turn it down, or counter: ask for more, payment up front, a sell-on clause or a buy-back clause.`, {act:{type:"offer", offer:id}, stop:1});
    n++;
  }
  // a release clause someone's willing to pay
  mine.filter(p=>p.rc && !p.loan && !p.lin).forEach(p=>{
    const v = mgValue(p), ch = p.rc<=v*1.2 ? .14 : p.rc<=v*1.6 ? .06 : p.rc<=v*2.5 ? .015 : .003;
    if (Math.random()>=ch) return;
    const fits = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club && mgRep(c)>=mgRep(M.club) && mgLevel(c)>=mgOvr(p) - 3), club = fits.length ? mgPick(Math.random, fits) : null;
    if (club) mgSell(p, club, {fee:p.rc}, "clause");
  });
  // loan offers for players you've made available
  mine.filter(p=>p.ll && !p.loan && !M.offers.some(o=>o.pid===p.id && o.st==="open")).forEach(p=>{
    if (Math.random()>.5) return;
    const club = mgLoanClub(p); if (!club) return;
    const id = (M.ofid = (M.ofid || 0) + 1), play = clamp(.5 + (mgOvr(p) - mgLevel(club))/12, .15, .95);
    const pay = mgPick(Math.random, [.5, .75, 1, 1]), opt = Math.random()<.4 ? mgRoundFee(mgValue(p)*(1.1 + Math.random()*.3)) : 0;
    M.offers.push({id, pid:p.id, club, fee:0, loan:true, play:+play.toFixed(2), pay, opt, exp:M.day + 5, st:"open"});
    mgMail("transfer", `Loan offer for ${p.n}`, `${club} want ${p.n} on loan until the end of the season. They'd pay ${Math.round(pay*100)}% of his wages and expect him to ${play>.7 ? "start most games" : play>.4 ? "play regularly" : "be a squad player"}.${opt ? ` They want an option to buy him for ${mgMoney(opt)} at the end of the loan.` : ""}`, {act:{type:"offer", offer:id}, stop:1});
  });
  // the rest of your league does its business
  const deals = [];
  M.tiers[mgLeagueOf()].filter(c=>c!==M.club && M.cl[c]).forEach(c=>{
    if (Math.random()<.16){ const d = mgAiSign(c); if (d) deals.push(d); }
    if (Math.random()<.05){ const d = mgAiPoach(c); if (d) deals.push(d); }
  });
  if (deals.length) mgMail("news", `Transfer round-up`, deals.map(d=>`• ${d}`).join("\n"));
}
function mgBuyerFor(p){
  const o = mgOvr(p), all = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club);
  const fit = all.filter(c=>{ const l = mgLevel(c); return l>=o - 4 && l<=o + 5 && (p.tl || mgRep(c)>=mgRep(M.club) - .05); });
  return fit.length ? fit[Math.floor(Math.random()*fit.length)] : null;
}
function mgLoanClub(p){ const o = mgOvr(p), all = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club && mgLevel(c)<=o + 3 && mgLevel(c)>=o - 8); return all.length ? mgPick(Math.random, all) : null; }
function mgAiSign(club){
  const C = M.cl[club], lv = mgLevel(club), xi = mgAutoXI(club, C.f || "4-3-3"), slots = MG_FORM[C.f || "4-3-3"];
  let wi = -1, wv = 99; xi.xi.forEach((p, i)=>{ const v = p ? mgOvrAt(p, slots[i][0]) : 0; if (v<wv){ wv = v; wi = i; } });
  if (wi<0 || wv>=lv + 1) return null;
  const pos = slots[wi][0], R = Math.random, from = mgPick(R, MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>!M.cl[c] && Math.abs(mgLevel(c) - lv)<6));
  if (!from) return null;
  const p = mgMakePlayer(R, {id:"p" + (M.nid++), pos:pos==="LWB" ? "LB" : pos==="RWB" ? "RB" : pos, ovr:Math.round(lv + 1 + R()*3), age:21 + Math.floor(R()*8), nat:mgNatFor(R, from), club});
  p.wage = mgWageAt(p, mgTierOf(club) ?? 1); p.con = M.season + 3; p.from = from; p.fee = mgValue(p); p.joined = M.season;
  M.P[p.id] = p; C.sq.push(p.id);
  if (C.sq.length>27){ const out = C.sq.map(id=>M.P[id]).filter(q=>q.id!==p.id).sort((a, b)=>mgOvr(a) - mgOvr(b))[0]; C.sq = C.sq.filter(id=>id!==out.id); delete M.P[out.id]; }
  mgNumbers(C.sq.map(id=>M.P[id]));
  return `${club} sign ${p.n} (${p.pos}, ${mgOvr(p)}) from ${from} for ${mgMoney(p.fee)}`;
}
function mgAiPoach(club){
  const C = M.cl[club], star = C.sq.map(id=>M.P[id]).filter(p=>p.age<=29 && !p.inj).sort((a, b)=>mgOvr(b) - mgOvr(a))[0];
  if (!star || mgOvr(star)<mgLevel(club) + 3) return null;
  const to = mgPick(Math.random, MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>!M.cl[c] && mgLevel(c)>=mgOvr(star) - 1 && mgRep(c)>mgRep(club)));
  if (!to) return null;
  const fee = mgRoundFee(mgValue(star)*1.3);
  C.sq = C.sq.filter(id=>id!==star.id); delete M.P[star.id]; mgAiRebuild(club);
  return `${star.n} leaves ${club} for ${to} in a ${mgMoney(fee)} deal`;
}
function mgAnswerOffer(o, how, t){
  const p = M.P[o.pid]; if (!p || o.st!=="open") return "That offer has gone.";
  const m = M.inbox.find(x=>x.act && x.act.offer===o.id);
  if (how==="no"){ o.st = "rejected"; if (m) m.act.done = "Rejected"; if (p.req) p.mor = clamp(p.mor - 8, 0, 100); mgSave(); return `You turned down ${o.club}.`; }
  if (how==="yes"){
    o.st = "accepted"; if (m) m.act.done = o.loan ? "Loaned" : "Sold";
    if (o.loan){ p.loan = {club:o.club, play:o.play, pay:o.pay ?? 1, opt:o.opt || 0}; p.ll = 0; M.tac.xi = M.tac.xi.map(id=>id===p.id ? null : id); M.tac.bench = M.tac.bench.filter(id=>id!==p.id); mgMendXI(true);
      mgMail("transfer", `${p.n} goes on loan`, `${p.n} joins ${o.club} on loan until the end of the season. They pay ${Math.round((o.pay ?? 1)*100)}% of his wages.${o.opt ? ` They can buy him for ${mgMoney(o.opt)} at the end of the loan.` : ""}`); mgSave(); return `${p.n} is off to ${o.club} on loan.`; }
    mgSell(p, o.club, o); return `${p.n} sold to ${o.club} for ${mgDealTxt(o)}.`;
  }
  // a counter: their limit is set once per offer, and they'll meet you if your terms come in under it
  t = {fee:Math.round(t.fee || o.fee), inst:t.inst || 0, addon:o.addon || 0, sell:t.sell || 0, bb:Math.round(t.bb || 0)};
  o.max ||= mgDealWorth(p, o)*(1.1 + Math.random()*.25);
  const cost = mgDealWorth(p, t) + mgBuyBackCost(p, t.bb);
  if (cost<=o.max){ Object.assign(o, t); o.st = "accepted"; if (m) m.act.done = "Sold"; mgSell(p, o.club, t); return `${o.club} agree: ${mgDealTxt(t)}. ${p.n} has gone.`; }
  if (cost<=o.max*1.15 && !o.came){
    const fee = mgRoundFee((o.max - (t.addon*.55 + mgSellOnWorth(p, t.sell) + mgBuyBackCost(p, t.bb)))/(1 - .045*t.inst));
    Object.assign(o, t, {fee:Math.max(o.fee, Math.min(fee, t.fee)), came:1, exp:Math.max(o.exp, M.day + 2)});
    if (m) m.b += `\n\nThey've come back with ${mgDealTxt(o)}.`;
    mgSave(); return `${o.club} won't go that far, but they've come back with ${mgDealTxt(o)}.`;
  }
  o.st = "rejected"; if (m) m.act.done = "They walked away"; mgSave(); return `${o.club} won't meet those terms and have walked away.`;
}

/* ================= THE ACADEMY ================= */
const mgAcademy = () => M.acad ?? (M.acad = M.fac && M.fac.acad ? M.fac.acad : clamp(Math.round(1 + (mgRep(M.club) - .55)/.12 + (isTop(mgLeagueOf()) ? .5 : 0)), 1, 5));
function mgYouthPlayer(R, region){
  const A = mgAcademy(), pos = mgPick(R, ["GK","CB","CB","LB","RB","CDM","CM","CM","CAM","LM","RM","LW","RW","ST","ST"]), age = 15 + Math.floor(R()*2);
  const gem = R()<.02 + A*.015, nat = region ? mgPick(R, {home:[mgCountry(M.club)], eu:["Spain","France","Germany","Netherlands","Portugal","Belgium","Italy","Croatia","Denmark"], sa:["Brazil","Argentina","Uruguay","Colombia"], af:["Nigeria","Ghana","Senegal","Ivory Coast","Morocco"]}[region] || [mgCountry(M.club)]) : (R()<.85 ? mgCountry(M.club) : mgPick(R, SQ_FOREIGN));
  const p = mgMakePlayer(R, {id:"p" + (M.nid++), pos, ovr:Math.round(40 + A*2 + R()*8), age, nat:SQ_NAMES[nat] ? nat : "England"});
  p.pot = Math.round(clamp(gem ? 84 + R()*9 : 56 + A*4 + mgGauss(R)*7, mgOvr(p) + 6, 94));
  p.club = null; p.yth = 1; p.wage = 0; p.con = M.season + 2; p.role = 4;
  return p;
}
function mgYouthIntake(quiet){
  const R = Math.random, n = quiet ? 4 : 3 + Math.floor(mgAcademy()/2 + R()*2), list = [];
  for (let i = 0; i<n; i++){ const p = mgYouthPlayer(R); if (quiet) p.age += 1 + Math.floor(R()*2); M.P[p.id] = p; M.yth.push(p.id); list.push(p); }
  if (!quiet){ const best = list.slice().sort((a, b)=>b.pot - a.pot)[0];
    mgMail("youth", `Youth intake: ${n} new academy players`, `This year's intake has arrived. The academy staff are most excited about ${best.n} (${best.pos}, ${best.age}), who could become a ${best.pot>=85 ? "world-class" : best.pot>=78 ? "top" : best.pot>=70 ? "very good" : "decent"} player.\n\n${list.map(p=>`• ${p.n}, ${p.pos}, ${p.age}`).join("\n")}`, {stop:1}); }
}
function mgPromote(id){
  const p = M.P[id]; if (!p) return;
  M.yth = M.yth.filter(x=>x!==id);
  Object.assign(p, {club:M.club, yth:1, wage:mgRoundWage(Math.max(200, mgWageAt(p, mgLeagueOf())*.6)), con:M.season + 2, role:4, joined:M.season, from:"Academy"});
  M.cl[M.club].sq.push(id); mgNumbers(mgMine()); M.kn[id] = 100;
  if (M.tac.bench.length<9) M.tac.bench.push(id);
  mgMail("youth", `${p.n} promoted`, `${p.n} has signed his first professional contract and joins the first-team squad.`); mgSave();
}
const MG_REGIONS = {home:"At home", eu:"Europe", sa:"South America", af:"Africa"};
function mgYouthScout(region){
  if (M.ysc) return "Your youth scout is already away.";
  const cost = mgRoundFee(Math.max(5000, (MG_TB[mgLeagueOf()] || 1e5)*.002) * (region==="home" ? 1 : 2));
  if (M.fin.tb<cost) return "You can't afford the trip.";
  M.fin.tb -= cost; mgFinAdd("exp", "fees", cost);
  M.ysc = {region, d:21, cost}; mgSave(); return "";
}
function mgYouthScoutDone(){
  const R = Math.random, reg = M.ysc.region, list = [0, 1, 2].map(()=>mgYouthPlayer(R, reg));
  list.forEach(p=>{ p.pot = Math.min(95, p.pot + 3); p.scouted = 1; M.P[p.id] = p; });
  M.ysc = null;
  mgMail("youth", `Youth scout report: ${MG_REGIONS[reg]}`, `Your youth scout has found three prospects. Sign them to the academy, or let them go.`, {act:{type:"prospects", ids:list.map(p=>p.id)}, stop:1});
}

/* ================= UNEXPECTED EVENTS, CHALLENGES AND THE PRESS ================= */
function mgEvent(){
  const sq = mgMine().filter(p=>!p.loan), star = sq.filter(p=>!p.lin).slice().sort((a, b)=>mgOvr(b) - mgOvr(a))[0], last = M.myres.filter(r=>r.c!=="F").slice(-3), lost = last.filter(r=>r.res==="L").length;
  const t = mgLeagueOf(), big = (MG_TB[t] || 1e5)*.04*mgRep(M.club);
  const opts = [];
  opts.push(()=>({t:"Sponsor challenge", b:`A sponsor will pay ${mgMoney(big)} if you win your next 3 games.`, ch:[["Accept the challenge", "sponsor"], ["Not now", "x"]]}));
  if (star && star.age<=30) opts.push(()=>({t:`${star.n}'s head has been turned`, b:`A bigger club is circling and ${star.n} is unsettled. How do you respond?`, ch:[["Promise him a new contract (+25% wages)", "star-new"], ["He's going nowhere", "star-no"], ["Open to offers", "star-sell"]], id:star.id}));
  if (lost>=2 && !mgDof()) opts.push(()=>({t:"Dressing room unrest", b:`Results have been poor and the players are restless. What do you do?`, ch:[["Hold a team meeting", "meet"], ["Give them a day off", "dayoff"], ["Ignore it", "x"]]}));
  opts.push(()=>({t:"Takeover rumours", b:`A consortium is in talks to invest in the club. They'll add ${mgMoney(big*2.5)} to your transfer budget now, but they want a higher league finish.`, ch:[["Welcome the investment", "invest"], ["Turn it down", "x"]]}));
  opts.push(()=>({t:"Wonderkid alert", b:`Your scouts have found a 16-year-old with rare talent at a smaller club. He'd cost ${mgMoney(Math.max(5e4, big*.35))}.`, ch:[["Sign him for the academy", "wonder"], ["Pass", "x"]]}));
  if (sq.filter(p=>p.inj).length>=3) opts.push(()=>({t:"Injury crisis", b:`With ${sq.filter(p=>p.inj).length} players injured, the board will let you sign an experienced free agent on a short deal.`, ch:[["Sign the free agent", "crisis"], ["We'll cope", "x"]]}));
  const yk = sq.find(p=>p.age<=20 && p.st.ap>0);
  if (yk && !mgDof()) opts.push(()=>({t:"Viral moment", b:`A clip of ${yk.n}'s skill has gone viral. Fans want to see more of him.`, ch:[["Promise him more games", "viral-yes"], ["Keep his feet on the ground", "x"]], id:yk.id}));
  // a director of football's own decisions: the shirt sponsor, the ticket prices
  if (mgDof()){
    const sp = mgRoundFee(Math.max((MG_TV[t] || 2e5)*.06, mgCommercial(M.club)*.2));
    opts.push(()=>({t:"A new shirt sponsor", b:`A company wants its name on your shirts. They'll pay ${mgMoney(sp)} now for one season, or ${mgMoney(sp*.45)} a season for three seasons, starting now.`, ch:[["One season, cash now", "spon-1"], ["Three seasons", "spon-3"], ["Not interested", "x"]]}));
    if ((M.fin.tix ?? 1)===2) opts.push(()=>({t:"Fans protest at ticket prices", b:`Supporters' groups are unhappy with the price of tickets and are planning a protest.`, ch:[["Bring prices back to normal", "tix-down"], ["Hold firm", "tix-hold"]]}));
  }
  const e = mgPick(Math.random, opts)();
  M.ev = {...e, pid:e.id || null, d:M.day, id:(M.evid = (M.evid || 0) + 1)};
  mgMail("event", e.t, e.b, {act:{type:"event", ev:M.ev.id, ch:e.ch}, stop:1});
}
function mgEventAnswer(k){
  const E = M.ev; if (!E) return "That's in the past now.";
  const m = M.inbox.find(x=>x.act && x.act.ev===E.id); M.ev = null;
  const p = E.pid ? M.P[E.pid] : null, sq = mgMine(), t = mgLeagueOf(), big = (MG_TB[t] || 1e5)*.04*mgRep(M.club);
  let out = "Noted.";
  if (k==="spon-1" || k==="spon-3"){ const sp = mgRoundFee(Math.max((MG_TV[mgLeagueOf()] || 2e5)*.06, mgCommercial(M.club)*.2));
    if (k==="spon-1"){ M.fin.tb += sp; mgFinAdd("inc", "spons", sp); out = `${mgMoney(sp)} goes into your transfer budget.`; }
    else { const a = mgRoundFee(sp*.45); M.fin.tb += a; mgFinAdd("inc", "spons", a); for (let y = 1; y<=2; y++) (M.recv ||= []).push({why:"inst", club:"Shirt sponsor", n:"the sponsorship", amt:a, s:M.season + y}); out = `${mgMoney(a)} now, and the same at the start of each of the next two seasons.`; } }
  else if (k==="tix-down"){ M.fin.tix = 1; mgMine().forEach(p=>{ p.mor = clamp(p.mor + 2, 0, 100); }); out = "Prices are back to normal and the fans are behind the team again."; }
  else if (k==="tix-hold"){ mgBoardShift(-2, "Fans protest at ticket prices"); out = "The protest goes ahead. The owner isn't pleased with the headlines."; }
  else if (k==="sponsor"){ M.chal = {k:"win", need:3, got:0, left:3, reward:mgRoundFee(big)}; out = "Challenge accepted: win the next three."; }
  else if (k==="star-new" && p){ p.wage = mgRoundWage(p.wage*1.25); p.con = Math.max(p.con, M.season + 3); p.mor = clamp(p.mor + 15, 0, 100); out = `${p.n} is happy and signs a new deal.`; }
  else if (k==="star-no" && p){ p.mor = clamp(p.mor - 14, 0, 100); out = `${p.n} isn't pleased.`; }
  else if (k==="star-sell" && p){ p.tl = 1; out = `${p.n} is available. Expect offers.`; }
  else if (k==="meet"){ const good = Math.random()<.6; sq.forEach(q=>{ q.mor = clamp(q.mor + (good ? 8 : -4), 0, 100); }); out = good ? "The meeting clears the air: morale is up." : "The meeting goes badly. Some players feel singled out."; }
  else if (k==="dayoff"){ sq.forEach(q=>{ q.mor = clamp(q.mor + 5, 0, 100); }); M.tac.fam[M.tac.f] = Math.max(40, (M.tac.fam[M.tac.f] || 60) - 6); out = "The players enjoy the break; the tactical work suffers a little."; }
  else if (k==="invest"){ M.fin.tb += mgRoundFee(big*2.5); const o = M.board.obj.find(x=>x.k==="league"); if (o && o.n>1){ o.n = Math.max(1, o.n - 2); o.t = `Finish ${ord(o.n)} or higher`; } out = "The money's in. The board's target is higher now."; }
  else if (k==="wonder"){ const cost = mgRoundFee(Math.max(5e4, big*.35)); if (M.fin.tb>=cost){ M.fin.tb -= cost; mgFinAdd("exp", "buys", cost); const q = mgYouthPlayer(Math.random); q.pot = 86 + Math.floor(Math.random()*7); q.age = 16; M.P[q.id] = q; M.yth.push(q.id); out = `${q.n} joins the academy. One to watch.`; } else out = "You can't afford him."; }
  else if (k==="crisis"){ const lv = mgLevel(M.club), R = Math.random, pos = mgPick(R, ["CB","CM","ST","LB","RB","LW"]); const q = mgMakePlayer(R, {id:"p" + (M.nid++), pos, ovr:Math.round(lv - 1), age:31 + Math.floor(R()*3), nat:mgPick(R, SQ_FOREIGN)});
    Object.assign(q, {club:M.club, wage:mgRoundWage(mgWageAt(q, t)*.7), con:M.season, role:2, joined:M.season, from:"free agency"}); M.P[q.id] = q; M.cl[M.club].sq.push(q.id); M.kn[q.id] = 100; mgNumbers(mgMine()); if (M.tac.bench.length<9) M.tac.bench.push(q.id); out = `${q.n} (${q.pos}, ${mgOvr(q)}) signs until the summer.`; }
  else if (k==="viral-yes" && p){ p.mor = clamp(p.mor + 10, 0, 100); p.role = Math.min(p.role, 2); M.rep[M.club] = +(mgRep(M.club) + .002).toFixed(3); out = `${p.n} is buzzing.`; }
  if (m) m.act.done = out;
  mgSave(); return out;
}
function mgChallengeTick(f, res){
  const C = M.chal; C.left--; if (res==="W") C.got++;
  if (C.got>=C.need){ M.fin.tb += C.reward; mgFinAdd("inc", "spons", C.reward); mgMail("event", "Challenge complete!", `Three wins out of three: ${mgMoney(C.reward)} goes into your transfer budget.`, {stop:1}); M.chal = null; }
  else if (C.left<=0 || res!=="W"){ mgMail("event", "Challenge failed", "The run's over, and so is the sponsor's challenge."); M.chal = null; }
}
// the pre-match press conference: three ways to answer, each with a price
const MG_PRESS = [
  {q:o=>`${o.opp} are in good form. Are you worried?`, a:[["Not at all. We'll beat them.", {mor:3, opp:1}], ["They deserve respect. It'll be tough.", {mor:0, opp:0}], ["I only think about my own team.", {mor:1, opp:0}]]},
  {q:o=>`Some fans are questioning your tactics. Your response?`, a:[["Trust the process. Results will come.", {board:1, mor:1}], ["I understand them. We must do better.", {mor:-1, board:2}], ["Fans don't pick the team.", {board:-2, mor:2}]]},
  {q:o=>`Is this a must-win game?`, a:[["Every game is a must-win.", {mor:2, fit:0}], ["No, it's one of many.", {mor:-1}], ["We go for three points, as always.", {mor:1}]]},
  {q:o=>`Your opponents' manager says they'll dominate. Thoughts?`, a:[["Let's see on the pitch.", {mor:2, opp:1}], ["He's entitled to his opinion.", {mor:0}], ["He talks too much.", {mor:3, opp:2, board:-1}]]},
  {q:o=>`What do you expect from your young players?`, a:[["They'll get their chance.", {mor:2}], ["Experience wins games.", {mor:-1}], ["Nobody's place is safe.", {mor:1}]]}
];
function mgPressFor(f){ if (mgDof()) return null; const R = mgR(`${M.seed}|${f.key}`); if (f.c==="F" || R()<.55) return null; const Q = mgPick(R, MG_PRESS); return {q:Q.q({opp:f.h===M.club ? f.a : f.h}), a:Q.a}; }
function mgPressAnswer(fx, i){
  const P = mgPressFor(fx); if (!P) return; const e = P.a[i][1];
  if (e.mor) mgMine().forEach(p=>{ p.mor = clamp(p.mor + e.mor, 0, 100); });
  if (e.board) mgBoardShift(e.board);
  M.pressOpp = e.opp || 0; M.pressDone = fx.key; mgSave();
}

/* ================= THE JOB MARKET ================= */
function mgAiManagers(){
  if (M.phase!=="season") return;
  const t = mgLeagueOf(), tb = mgTable(t), byLv = tb.slice().sort((a, b)=>mgLevel(b.n) - mgLevel(a.n)).map(r=>r.n);
  tb.forEach((r, i)=>{
    if (r.n===M.club || r.p<10) return;
    const gap = i - byLv.indexOf(r.n);
    if (gap>=6 && Math.random()<.04){
      const old = M.am[r.n] || "Their manager", nw = mgAiManager(r.n); M.am[r.n] = nw; if (M.cl[r.n]) M.cl[r.n].mg = nw;
      mgMail("news", `${r.n} sack ${old}`, `With ${r.n} ${ord(i + 1)} in the table, ${old} has been dismissed. ${nw} takes over.`);
      M.jobs = (M.jobs || []).filter(j=>j.club!==r.n).concat([mgJob(r.n)]).slice(-8);
    }
  });
}
function mgJob(club){ const need = Math.round(clamp((mgRep(club) - .55)/.5, 0, 1)*80 + (isTop(mgTierOf(club)) ? 6 : 0)); const e = mgTierOf(club), tl = TIERS[e];
  return {club, need, exp:tl && tl.level===1 ? (mgRep(club)>.9 ? "Win the league" : "A top-half finish") : (mgRep(club)>.75 ? "Win promotion" : "Stay up"), d:M.day}; }
function mgVacancies(fired){
  const R = Math.random, all = MG_PLAYABLE.flatMap(t=>M.tiers[t]).filter(c=>c!==M.club);
  const cap = fired ? M.mgr.rep + 6 : M.mgr.rep + 18;
  const ok = all.filter(c=>mgJob(c).need<=cap);
  return mgShuffleR(ok, R).slice(0, 6).map(mgJob).sort((a, b)=>mgRep(b.club) - mgRep(a.club));
}
function mgApplyJob(club){
  const j = (M.jobs || []).find(x=>x.club===club) || mgJob(club);
  const chance = clamp(.55 + (M.mgr.rep - j.need)/25, .05, .97);
  if (Math.random()>chance){ M.jobs = M.jobs.filter(x=>x.club!==club); mgSave(); return {ok:false, txt:`${club} have gone with another candidate.`}; }
  if (M.club && (M.phase==="season" || M.phase==="pre")) M.hist.push(mgHistRow(true));
  M.jobs = [];
  mgTakeJob(club);
  return {ok:true, txt:`You're the new manager of ${club}!`};
}

/* ================= THE MANAGERS' HALL OF FAME ================= */
function mgHallKey(){ return Account.storageKey("mhall"); }
function mgHallGet(){ try{ return JSON.parse(localStorage.getItem(mgHallKey())) || []; }catch(e){ return []; } }
function mgHallRecord(){
  if (!M) return;
  const list = mgHallGet().filter(x=>x.id!==M.id), c = M.car;
  list.push({id:M.id, role:M.role || "mgr", name:M.mgr.name, nat:M.mgr.nat, club:M.club, clubs:[...new Set(M.clubs.map(x=>x.club))], seasons:M.hist.filter(h=>!h.part).length, p:c.p, w:c.w, d:c.d, l:c.l,
    tro:M.trophies.length, list:M.trophies.slice(-6).map(x=>`${x.n} (${x.s})`), rep:Math.round(M.mgr.rep), updated:Date.now()});
  try{ localStorage.setItem(mgHallKey(), JSON.stringify(list)); }catch(e){}
}
