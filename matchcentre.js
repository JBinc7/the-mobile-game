/* ================= MATCH CENTRE =================
   Instead of typing in a season's stats, play it week by week: pick a training focus, sim the fixtures, and your
   attributes, form, sharpness and fitness decide whether you start and how you play. Each half-season ends by
   handing its appearances, goals, assists and clean sheets to the same review the manual form uses (applyHalf), so
   values, offers and the Ballon d'Or work as before. Your league is played out round by round alongside your fixtures
   (league.js), and your cup runs come from the ties played here (mcCupResult, mcEuroResult), so the final table and
   the cups match the results you saw.
   Loaded before game.js and only called once the game is running. */
const MC_ATTR = [["fin","Finishing"],["pas","Passing"],["pac","Pace"],["def","Defending"],["sta","Stamina"]];
// how much each attribute counts towards your overall rating, by position (finishing, passing, pace, defending, stamina)
const MC_W = {ST:[.45,.12,.25,0,.18], LW:[.28,.24,.32,0,.16], RW:[.28,.24,.32,0,.16], CAM:[.25,.4,.15,.04,.16], CM:[.12,.38,.1,.2,.2],
  CDM:[.04,.3,.1,.36,.2], LB:[0,.2,.32,.33,.15], RB:[0,.2,.32,.33,.15], CB:[0,.14,.16,.55,.15], GK:[0,.12,.08,.7,.1]};
// share of the team's goals you score and set up when you're as good as your team: a little more than a teammate of
// the same quality in your position gets (squads.js shares out the other goals with the same weights)
const MC_SHARE = {ST:[.27,.11], LW:[.22,.14], RW:[.22,.14], CAM:[.17,.17], CM:[.085,.11], CDM:[.034,.05], LB:[.026,.09], RB:[.026,.09], CB:[.038,.011], GK:[0,.002]};
// a team that scores less leans on its best players a little more, but your output still follows the team's
const mcDamp = lf => Math.pow(1.35/lf, .25);
// how much of your quality goes into attack rather than defence
const MC_ATT = {ST:.8, LW:.8, RW:.8, CAM:.75, CM:.5, CDM:.3, LB:.3, RB:.3, CB:.15, GK:0};
// the first round of each domestic cup played after Christmas
const MC_H2 = {fa:3, lc:5, eflt:2, fat:1, cdr:3, dfb:3, cit:2, cdf:1, tdp:3, knvb:2, scup:0};
const MC_TRAIN = [...MC_ATTR, ["prep","Match prep"], ["rest","Rest"]];
// how far below the first team a young player starts, and how much room he has to grow
const MC_YOUTH = {16:12, 17:9, 18:7, 19:5, 20:3, 21:2, 22:1};
const MC_ROOM = {16:22, 17:19, 18:16, 19:13, 20:10, 21:8, 22:6, 23:4, 24:3, 25:2};
const MC_MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------- attributes ---------- */
function mcWeights(){ const w = MC_W[S.player.pos] || MC_W.CM; return Object.fromEntries(MC_ATTR.map(([k],i)=>[k, w[i]])); }
// the boost from the boots you're wearing (shop.js); mcA() is your attributes as they count in matches
const MC_BOOT = [0, 2, 4, 6];
function mcBoot(){ const L = Account.locker(), lvl = L.on ? L.boots[L.on] || 0 : 0; return lvl ? {k:L.on, n:MC_BOOT[lvl]} : null; }
function mcA(){ const a = {...S.attr}, b = mcBoot(); if (b) a[b.k] = Math.min(99, a[b.k] + b.n); return a; }
function mcOvr(a = mcA()){ const w = mcWeights(); return Math.round(MC_ATTR.reduce((s,[k])=>s + w[k]*a[k], 0)); }
function mcAttrName(k){ return k==="def" && S.player.pos==="GK" ? "Shot-stopping" : MC_TRAIN.find(x=>x[0]===k)[1]; }
// a new player (or an older save) starts around the first team's level, lower while still breaking through
function mcInit(){
  if (S.attr) return;
  const w = mcWeights(), last = S.history[S.history.length-1];
  const target = strOf(S.club) - (MC_YOUTH[S.age] || 0) + (last ? clamp(((last.score ?? .6) - .6)*10, -4, 5) : 0) + gauss()*1.5;
  const a = {}; MC_ATTR.forEach(([k])=>{ a[k] = target + 30*(w[k]-.2) + gauss()*2; });
  const shift = target - MC_ATTR.reduce((s,[k])=>s + w[k]*a[k], 0);
  MC_ATTR.forEach(([k])=>{ a[k] = +clamp(a[k] + shift, 20, 95).toFixed(2); });
  a.pot = +clamp(target + (MC_ROOM[S.age] ?? 1) + gauss()*2.5, target+1, 96).toFixed(1);
  S.attr = a; S.cond = {fat:10, sharp:60, form:[]};
  S.train = {focus:MC_ATTR.slice().sort((x,y)=>w[y[0]]-w[x[0]])[0][0], hard:false};
}
// weekly growth from training: fast for teenagers, small by the late twenties; past 30 it only slows the decline
function mcGrowth(age){ return age<=18 ? .2 : age<=20 ? .16 : age<=22 ? .11 : age<=24 ? .07 : age<=26 ? .04 : .02; }
// how close an attribute is to its ceiling: your potential, higher for the attributes your position relies on
function mcRoom(k){ return clamp((S.attr.pot + 30*(mcWeights()[k]-.2) + 4 - S.attr[k])/6, 0, 1.3); }
function mcPotLabel(){ const d = S.attr.pot - mcOvr(); return d>=10 ? "Huge potential" : d>=5 ? "Room to grow" : d>=2 ? "Close to your peak" : "At your peak"; }

/* ---------- which mode this season uses ---------- */
// a season is played in one mode throughout; a save that's already midway through one stays manual until it ends
function seasonMode(){
  const s = seasonLabel(S.season);
  // entering your stats by hand takes the Editor pen (shop.js): without it a new season is played in the match centre
  if (!S.modeSeason || S.modeSeason.s!==s) S.modeSeason = {s, m: halfOf()===1 && !S.h1 ? (S.mode==="manual" && penOwned() ? "manual" : "centre") : "manual"};
  return S.modeSeason.m;
}
// switching is allowed before this half's first week; back to manual entry only before the season starts
function mcCanSwitch(to){ return !(S.mc && S.mc.key===mcKey() && S.mc.wi>0) && (to==="centre" || (halfOf()===1 && !S.h1)); }
function mcModeSwitch(){
  const now = seasonMode(), other = now==="centre" ? "manual" : "centre";
  const what = m => m==="manual" ? "enter your stats by hand (handy for logging a real FC career)" : "play your seasons in the match centre";
  if (other==="manual" && !penOwned()) return `<p class="hint" style="margin-top:14px">Prefer to ${what(other)}? That takes the <button type="button" class="linkbtn" data-penact="shop">${PEN_IC("pen-ic tiny")} Editor pen</button> from the shop.</p>`;
  if (mcCanSwitch(other)) return `<p class="hint" style="margin-top:14px">Prefer to ${what(other)}? <button type="button" class="linkbtn" data-act="mc-mode" data-k="${other}">Switch for this season</button></p>`;
  if ((S.mode || "centre")!==now) return `<p class="hint" style="margin-top:14px">From next season you'll ${what(S.mode)}. <button type="button" class="linkbtn" data-act="mc-mode" data-k="${now}">Keep things as they are</button></p>`;
  return `<p class="hint" style="margin-top:14px">Prefer to ${what(other)}? <button type="button" class="linkbtn" data-act="mc-mode" data-k="${other}">Switch from next season</button></p>`;
}

/* ---------- the season's record for your club ---------- */
function mcKey(){ return `${seasonLabel(S.season)}|${halfOf()}|${S.club}`; }
function mcRec(club){
  const s = seasonLabel(S.season);
  if (!S.mcRec || S.mcRec.s!==s) S.mcRec = {s, clubs:{}};
  return S.mcRec.clubs[club] ||= {lg:{p:0,w:0,d:0,l:0,gf:0,ga:0}, cups:{}, eu:null, order:null};
}
// a club's last five results this season (yours in every competition, anyone else's in the league), and what
// they're worth: −0.9 (losing every week) to +1 (winning every week)
function mcFormOf(list){
  const L = list.slice(-5), ppg = L.length ? L.reduce((s,r)=>s + (r==="W" ? 3 : r==="D" ? 1 : 0), 0)/L.length : 1.4;
  return {L, ppg, f: L.length ? clamp((ppg-1.4)/1.6, -.9, 1)*Math.min(1, L.length/3) : 0};
}
function mcTeamForm(club){ const rec = club===S.mc?.club ? mcRecIf(club) : null; return mcFormOf(rec ? rec.form || [] : lgFormList(club)); }
const mcFormPills = L => L.length ? L.map(r=>`<span class="tf ${r.toLowerCase()}">${r}</span>`).join("") : `<span class="hint">No games yet</span>`;
function mcRecIf(club){ return S.mcRec && S.mcRec.s===seasonLabel(S.season) ? S.mcRec.clubs[club] : null; }
function mcOut(r, reached, lostTo, stage){ Object.assign(r, {alive:false, reached, lostTo, stage}); }
function mcCupRec(rec, c, half){
  if (rec.cups[c.code]) return rec.cups[c.code];
  const r = rec.cups[c.code] = {alive:true, next:c.entry, games:0, gp:0, pts:0, beaten:[], tie:null};
  // joined in January: play out the rounds this club got through before you arrived
  if (half===2){
    const h2 = Math.max(c.entry, MC_H2[c.code] ?? Math.ceil(c.rounds.length/2)), base = strOf(S.club);
    if (cpJoin(c.code, S.club, h2, r)) return r;   // a cup played out in full knows how far the club got
    while (r.alive && r.next<h2){
      const i = r.next, L = c.legs ? c.legs(i) : 1;
      if (c.group && i===0){ r.games += 3; r.gp = 3; r.next = 1; continue; }
      const o = c.oppFor(i); r.games += L;
      if (tie(base, o.str, L)){ r.beaten.push(o.n); r.next++; } else mcOut(r, c.rounds[i], o.n, i);
    }
  }
  return r;
}
function mcEuPhaseEnd(r, E){
  if (r.pts>=E.top8){ r.next = 1; r.top8 = true; } else if (r.pts>=E.po) r.next = 0; else mcOut(r, "League phase", null, 0);
}
function mcEuRec(rec, code, half){
  if (rec.eu && rec.eu.code===code) return rec.eu;
  // Europe played out in full (europe.js) gives your club its schedule, and in January how its league phase went
  const E = EURO[code], full = euOpps(code, S.club);
  const r = rec.eu = {code, opps:full || shuffle(euroField(code, S.club)).slice(0, E.phase), pts:0, gp:0, alive:true, next:null, games:0, beaten:[], tie:null};
  if (half===2 && !euPhaseFill(code, S.club, r)){ r.opps.forEach(o=>{ r.pts += match(strOf(S.club), o.str); }); r.gp = r.games = E.phase; mcEuPhaseEnd(r, E); }
  return r;
}

/* ---------- building a half-season ---------- */
// fraction of the season a week falls at (0 = August, 1 = May), for injuries scheduled across the season
function mcFrac(w){ const M = S.mc; return (M.half-1)*.5 + (w+.5)/M.weeks.length*.5; }
// league games on the weekend, cup and European ties in midweek
function mcDate(w, f){
  const M = S.mc, y = M.half===1 ? S.season : S.season+1, d0 = M.half===1 ? Date.UTC(y,7,8) : Date.UTC(y,0,3);
  const d = new Date(d0 + (Math.round(w/Math.max(1, M.weeks.length-1)*140) - (f && f.code!=="league" ? 3 : 0))*864e5);
  return `${d.getUTCDate()} ${MC_MON[d.getUTCMonth()]}`;
}
function mcBuild(){
  mcInit();
  const our = S.club, t = tierOf(our), T = TIERS[t], half = halfOf(), rec = mcRec(our), base = strOf(our);
  const codes = new Set(currentPlan().map(p=>p.code));
  if (half===1 && !(S.attr0 && S.attr0.s===seasonLabel(S.season))){
    S.cond.fat = Math.min(S.cond.fat, 15); S.cond.sharp = 60;   // pre-season
    S.attr0 = {s:seasonLabel(S.season), ...S.attr};
  }
  const rivals = S.world.tiers[t].filter(n=>n!==our), L = lgEnsure(t);
  // the league's rounds for this half, one a week (a league without a table, outside the main divisions, gets a fixture list)
  let lg, lgr = null;
  if (L){ lgr = half===1 ? [0, Math.floor(L.G/2)] : [Math.floor(L.G/2), L.G]; lg = []; for (let R=lgr[0];R<lgr[1];R++){ const m = lgMatchOf(L, R, our); lg.push(m && {n:m.opp, home:m.home, rd:R}); } }
  else { rec.order ||= shuffle(rivals).map(n=>({n, home:Math.random()<.5})); lg = half===1 ? rec.order : shuffle(rec.order).map(o=>({n:o.n, home:!o.home})); }
  const W = Math.max(lg.length, 12), weeks = Array.from({length:W}, ()=>[]);
  const at = (x, f) => weeks[clamp(Math.floor(x*W), 0, W-1)].push(f);
  const top3 = rivals.slice().sort((a,b)=>strOf(b)-strOf(a)).slice(0,3);
  lg.forEach((o,i)=>{ if (o) weeks[Math.floor(i*W/lg.length)].push({code:"league", opp:o.n, home:o.home, big:top3.includes(o.n), rd:o.rd}); });
  // cup rounds spread across the half; two-legged ties a week or so apart
  for (const c of cupSpecs(our)){
    if (!codes.has(c.code)) continue;
    mcCupRec(rec, c, half);
    const h2 = MC_H2[c.code] ?? Math.ceil(c.rounds.length/2), from = half===1 ? c.entry : Math.max(c.entry, h2), to = half===1 ? Math.max(c.entry, h2) : c.rounds.length;
    for (let i=from;i<to;i++){
      const fx = {code:c.code, cup:true, ri:i, nr:c.rounds.length, round:c.rounds[i], big:i>=c.rounds.length-3, neutral:c.rounds[i]==="Final"};
      if (c.group && i===0){ [.08,.25,.42].forEach((x,k)=>at(x, {...fx, gi:k, round:`Group game ${k+1}`, big:false})); continue; }
      const x = c.group ? .55 + .4*(i-1)/Math.max(1, to-2) : .04 + .9*(i-from+.5)/(to-from), legs = c.legs ? c.legs(i) : 1;
      at(x, {...fx, leg:legs===2 ? 1 : 0});
      if (legs===2) at(x + 1.5/W, {...fx, leg:2});
    }
  }
  const eu = S.world.europe[our];
  if (eu && codes.has(eu)){
    const r = mcEuRec(rec, eu, half), E = EURO[eu];
    if (half===1) r.opps.forEach((o,k)=>at(.1 + .85*k/Math.max(1, E.phase-1), {code:eu, eu:true, ri:-1, gi:k, round:`League phase, game ${k+1}`, opp:o.n, oppStr:o.str, home:o.home ?? k%2===0, big:o.str>=base+3}));
    else KO_EU.forEach((round,i)=>{
      const fx = {code:eu, eu:true, ri:i, nr:KO_EU.length, round, big:true, neutral:round==="Final"};
      if (i<4){ at(.12 + .2*i, {...fx, leg:1}); at(.12 + .2*i + 1.5/W, {...fx, leg:2}); } else at(.97, {...fx, leg:0});
    });
  }
  // season-start injuries get a place in the calendar the first time they're needed
  const inj = S.inj && S.inj.season===seasonLabel(S.season) ? S.inj.list : [], lo = half===1 ? 0 : .5;
  inj.forEach(i=>{ if (i.at==null) i.at = +(lo + Math.random()*Math.max(0, 1-lo-i.red)).toFixed(3); });
  S.mc = {key:mcKey(), club:our, half, weeks:weeks.map(fx=>({fx})), wi:0, done:false, from:0,
    intlTo: half===2 ? Math.round((1-(S.intlAway||1))*W) : 0, lgk: L ? t : null, lgr};
  tgEnsure();
}

/* ---------- playing a week ---------- */
// the injury you have this week in the match centre, and how many weeks it has left (counting this one)
const mcInjNow = () => S.mc && !S.mc.done && S.mc.key===mcKey() ? mcInjury(mcFrac(S.mc.wi)) : null;
const mcInjWeeks = i => i ? Math.max(1, Math.ceil(((i.at + i.red) - mcFrac(S.mc.wi))*S.mc.weeks.length*2 + .5)) : 0;
function mcInjury(frac){ const list = S.inj && S.inj.season===seasonLabel(S.season) ? S.inj.list : []; return list.find(i=>i.at!=null && frac>=i.at && frac<i.at+i.red) || null; }
// your average match rating this season: both halves (and both clubs after a January move)
function mcSeasonRating(){
  let rs = 0, rn = 0;
  if (S.h1 && S.h1.comps) Object.values(S.h1.comps).forEach(c=>{ rs += c.rs || 0; rn += c.rn || 0; });
  if (S.mc && S.mc.key===mcKey() && !(S.h1 && S.mc.half===1)) S.mc.weeks.forEach(w=>w.fx.forEach(f=>{ if (f.res && f.me && f.me.mins && f.me.r!=null){ rs += f.me.r; rn++; } }));
  return rn ? rs/rn : null;
}
const mcRateLabel = r => r>=8.5 ? "World class" : r>=8 ? "Superb" : r>=7.5 ? "Excellent" : r>=7 ? "Very good" : r>=6.5 ? "Solid" : r>=6 ? "Below par" : "Poor";
function mcFormAvg(){ const f = S.cond.form; return f.length ? f.reduce((s,x)=>s+x, 0)/f.length : 6.6; }
// how the manager rates your training: the average of the last four weeks' marks, each a drill's score (drills.js), a
// neutral half mark for a week without one, and a little extra for hard sessions. Good training gets you more game time
function mcTrainNote(mark){ S.cond.tr = (S.cond.tr || []).concat(+clamp(mark + (S.train.hard && S.train.focus!=="rest" ? .1 : 0), 0, 1).toFixed(2)).slice(-4); }
function mcTrainImp(){ const L = S.cond.tr || []; return (L.reduce((s,x)=>s+x, 0) + .5*(4-L.length))/4; }   // a new player starts on neutral marks
function mcTrainLabel(v){ return v>=.75 ? "Impressing the manager" : v>=.58 ? "Training well" : v>=.42 ? "Average in training" : "Poor in training"; }
function mcFormLabel(v){ return !S.cond.form.length ? "No games yet" : v>=7.4 ? "On fire" : v>=7 ? "Good" : v>=6.5 ? "Steady" : v>=6.1 ? "Patchy" : "Poor"; }
// chance the manager starts you: his trust, how you compare with the squad, your form and how tired you are
function mcStartChance(f){
  const c = S.cond, our = S.mc.club;
  let p = selectShare(our) * logistic((mcOvr() - strOf(our))/3.5 + 1.2) + (mcFormAvg()-6.6)*.25 + (mcTrainImp()-.5)*.4 - (c.fat>75 ? .25 : c.fat>60 ? .1 : 0) + (f && f.cup && !f.big ? .1 : 0);
  // a youngster who's been good off the bench earns the odd start
  if (S.age<=20 && c.form.length>=2 && mcFormAvg()>=7.1) p += .12;
  if (S.loan) p = Math.max(p, .8);
  return clamp(p, .02, .97);
}
// your minutes this season: the first half (S.h1) and the weeks played so far
function mcSeasonMins(){
  const o = {mins:0, apps:0, starts:0};
  if (S.h1 && S.h1.comps) Object.values(S.h1.comps).forEach(c=>{ o.mins += c.mins || 0; o.apps += c.apps || 0; o.starts += c.starts || 0; });
  if (S.mc && S.mc.key===mcKey() && !(S.h1 && S.mc.half===1)) S.mc.weeks.forEach(w=>w.fx.forEach(f=>{ if (f.res && f.me && f.me.mins){ o.mins += f.me.mins; o.apps++; if (f.me.st==="start") o.starts++; } }));
  return o;
}
function mcStartLabel(p){ return p>=.85 ? "Nailed-on starter" : p>=.6 ? "Usually starts" : p>=.35 ? "In and out of the side" : p>=.15 ? "Mostly on the bench" : "Out of the picture"; }
function mcHurt(w){
  const tier = Math.random()<.6 ? "small" : Math.random()<.8 ? "minor" : "medium", inj = makeInjury(tier, "train");
  inj.at = +mcFrac(w).toFixed(3);
  if (!S.inj || S.inj.season!==seasonLabel(S.season)) S.inj = {season:seasonLabel(S.season), list:[]};
  S.inj.list.push(inj);
  const weeks = Math.max(1, Math.round(inj.red*S.mc.weeks.length*2));
  note(tier==="small" ? "warn" : "bad", `Injured in training: ${inj.name}`, `You'll be out for about ${weeks} week${weeks===1?"":"s"}. Hard sessions on tired legs make this more likely.`);
}
function mcTrain(w){
  const T = S.train, a = S.attr, c = S.cond, age = S.age, g = mcGrowth(age);
  if (!S.mc.weeks[w].drill) mcTrainNote(.5);
  if (mcInjury(mcFrac(w))){ c.fat = Math.max(0, c.fat-20); c.sharp = Math.max(20, c.sharp-6); }   // rehab
  else if (T.focus==="rest"){ c.fat = Math.max(0, c.fat-35); c.sharp = Math.max(20, c.sharp-5); }
  else {
    // double training from the shop, and double again for a finished weekly session (drills.js)
    const m = (T.hard ? 1.6 : 1)*(S.boost && S.boost.double>0 ? 2 : 1)*(typeof drSessDone==="function" && drSessDone(S.mc.weeks[w]) ? 2 : 1);
    MC_ATTR.forEach(([k])=>{ a[k] += g*m*(k===T.focus ? 1 : T.focus==="prep" ? .1 : .2)*mcRoom(k); });
    if (T.focus==="prep") c.sharp = Math.min(100, c.sharp + (T.hard ? 10 : 7));
    c.fat = clamp(c.fat - (T.hard ? 5 : 15), 0, 100); c.sharp = Math.max(20, c.sharp-3);
    if (Math.random() < .005*(T.hard ? 2.2 : 1)*(1 + c.fat/45)*injuryAgeFactor(age)*(S.prone ?? 1)) mcHurt(w);
  }
  // past 30 the legs go first
  if (age>=30){ const d = (age-29)*.028; a.pac -= d; a.sta -= d*.8; a.fin -= d*.35; a.def -= d*.35; a.pas -= d*.2; }
  MC_ATTR.forEach(([k])=>{ a[k] = +clamp(a[k], 20, 99).toFixed(2); });
  if (S.boost && S.boost.double>0) S.boost.double--;
}
/* ---------- cards: bookings in simmed games, and the bans that follow ----------
   a yellow or a red (or two yellows) for a game. Defenders and holding midfielders pick up the most */
const MC_YC = {GK:.03, CB:.17, LB:.14, RB:.14, CDM:.2, CM:.14, CAM:.08, LW:.07, RW:.07, ST:.09};
function mcCardRoll(mins){
  const t = mins/90, y = (MC_YC[S.player.pos] ?? .12)*t, x = Math.random();
  return x < .006*t ? "r" : x < .006*t + y*.06 ? "yy" : x < .006*t + y ? "y" : "";
}
function mcDisc(){ const k = seasonLabel(S.season); if (!S.disc || S.disc.s!==k) S.disc = {s:k, y:0, r:0, ban:(S.disc && S.disc.ban) || 0}; return S.disc; }
// a card goes in the book: five yellows in a season is a one-match ban, and a red (two yellows or straight) is one match too
function mcBook(card){
  if (!card) return; const D = mcDisc();
  if (card==="y"){ D.y++; if (D.y%5===0){ D.ban++; note("bad", "Suspended for a match", `That's your ${ord(D.y)} yellow card of the season: you'll sit out the next game.`); } }
  else if (card==="yy"){ D.r++; D.ban++; note("bad", "Sent off: a one-match ban", "Two yellows in one game. You'll miss the next match."); }
  else { D.r++; D.ban++; note("bad", "Straight red: a one-match ban", "A reckless challenge. You'll miss the next match."); }
}
function mcSelect(f, w){
  if (S.disc && S.disc.ban>0) return {st:"ban", mins:0};
  const inj = mcInjury(mcFrac(w));
  if (inj) return {st:"inj", mins:0, why:inj.name};
  if (w < S.mc.intlTo) return {st:"intl", mins:0};
  const young = S.age<=19, form = mcFormAvg(), fat = S.cond.fat;
  if (Math.random() < mcStartChance(f)){
    // the more tired you are, the earlier you come off (and the fewer moments come your way); now and then a tactical change
    let mins = 90;
    if (fat>55) mins = Math.round(90 - (fat - 55)*1.15 - Math.random()*8);
    else if (Math.random()<.15) mins = 62 + Math.floor(Math.random()*24);
    if (S.player.pos==="GK") mins = 90;   // keepers play the whole game
    return {st:"start", mins:clamp(mins, 46, 90)};
  }
  // proving yourself: teenagers get plenty of cameos, and good form earns longer ones. Keepers almost never come off the bench
  const subP = S.player.pos==="GK" ? .03 : clamp(.55 + (mcTrainImp()-.5)*.4 + (young ? .25 : 0) + (form - 6.6)*.1, .1, .92);
  return Math.random() < subP ? {st:"sub", mins:clamp(Math.round(10 + Math.random()*25 + (form - 6.6)*8 + (young ? 5 : 0)), 5, 45)} : {st:"bench", mins:0};
}
function mcPoisson(l){ let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= Math.random(); } while (p>L); return k-1; }
function mcTieOn(f, r){
  if (!r || !r.alive) return false;
  if (f.eu && f.ri===-1) return r.next===null && r.gp===f.gi;
  if (f.gi!=null) return r.next===0 && r.gp===f.gi;
  return r.next===f.ri && (f.leg!==2 || (r.tie && r.tie.i===f.ri));
}
// who you're playing, and whether the manager picks you; false when a cup tie no longer happens
function mcSetup(f, w, specs){
  const our = S.mc.club, rec = mcRec(our);
  const r = f.code==="league" ? null : f.eu ? rec.eu : rec.cups[f.code];
  if (f.code!=="league"){
    if (!mcTieOn(f, r)){ f.skip = true; return false; }
    // Europe played out in full: the matchday's other games are played first, and the schedule says who you play
    if (f.eu && f.ri===-1 && !f.res){ const o = euPhaseOpp(f.code, f.gi, our); if (o){ f.opp = o.n; f.oppStr = o.str; f.home = o.home; } }
    if (!f.opp){
      if (f.leg===2){ f.opp = r.tie.opp; f.oppStr = r.tie.str; f.home = !r.tie.home; }
      else {
        // an English cup played out in full gives you the club you were drawn against (cups.js)
        const o = f.eu ? euKoOpp(f.code, f.ri, our) || shuffle(euroField(f.code, our)).slice(0, 2+f.ri).sort((x,y)=>y.str-x.str)[0] : cpOpp(f.code, f.gi!=null ? 0 : f.ri, our) || specs[f.code].oppFor(f.gi!=null ? 0 : f.ri);
        f.opp = o.n; f.oppStr = o.str; f.home = o.home ?? Math.random()<.5;
      }
    }
  }
  if (f.oppStr==null) f.oppStr = strOf(f.opp);
  f.oppStr = +f.oppStr.toFixed(1);
  f.me = {...mcSelect(f, w), g:0, a:0, cs:false, r:null};
  return true;
}
// expected goals each way, and the chance each of your team's goals is yours (pG) or set up by you (pA)
function mcXg(f){
  const base = strOf(S.mc.club), pos = S.player.pos, a = mcA(), me = f.me, t = me.mins/90, fa = mcFormAvg();
  // you lift the team in proportion to how much better you are than it, and how long you're on the pitch
  const boost = clamp((mcOvr()-base)*.18*t + (me.mins ? (fa-6.6)*.4 : 0), -3, 2.5), att = MC_ATT[pos] ?? .5, ha = f.neutral ? 0 : f.home ? 1.5 : -1.5;
  // a team on a run plays with confidence; one on a losing streak doesn't
  const tf = mcTeamForm(S.mc.club).f, edge = (tf - mcTeamForm(f.opp).f)*.6;
  // a cup tie against a club leagues below counts the gap up to 20: a giant expects about four goals, not a dozen. And
  // before the semi-finals a much stronger side rests players (yours, or theirs), so giant-killings happen (as cpTie)
  const rot = f.cup && f.ri < f.nr - 2 ? (base - f.oppStr >= 6 ? -3 : f.oppStr - base >= 6 ? 3 : 0) : 0;
  const gap = clamp(base - f.oppStr, -20, 20) + rot;
  const lf = 1.35*Math.exp((gap + edge + boost*att + ha)/20), la = 1.35*Math.exp((-gap - edge - boost*(1-att) - ha)/20);
  // your goals and assists are a share of the team's, bigger the sharper your finishing and passing
  const [gs, as] = MC_SHARE[pos] || MC_SHARE.CM, w = mcWeights(), form = clamp(1 + (fa-6.6)*.1, .85, 1.15), damp = mcDamp(lf);
  const skill = k => clamp(1 + (a[k] - (base + 30*(w[k]-.2)))/20, .5, 1.6);
  return {base, lf, la, t, tf, pG:clamp(gs*t*form*damp*skill("fin"), 0, .7), pA:clamp(as*t*form*damp*skill("pas"), 0, .5)};
}
function mcPlay(f, w, specs){ if (mcSetup(f, w, specs)) mcResolve(f, w); }
// the result, simulated or (live) built from the key moments you played
// whether a knockout tie is level (st.ev from the moments, or the score): extra time and maybe penalties follow
function mcKoLevel(f, ev, gf, ga){
  if (f.code==="league" || (f.eu && f.ri===-1) || f.gi!=null || f.leg===1) return false;
  if (ev){ gf = ev.filter(e=>e.us).length; ga = ev.filter(e=>!e.us).length; }
  const rec = mcRec(S.mc.club), r = f.eu ? rec.eu : rec.cups[f.code], t = f.leg===2 && r && r.tie ? r.tie : {gf:0, ga:0};
  return gf + t.gf === ga + t.ga;
}
function mcResolve(f, w, live){
  const our = S.mc.club, rec = mcRec(our), pos = S.player.pos, a = S.attr, c = S.cond, me = f.me, X = mcXg(f), t = X.t;
  const r = f.code==="league" ? null : f.eu ? rec.eu : rec.cups[f.code];
  let gf, ga, et = false;
  if (me.st==="ban" && S.disc && S.disc.ban>0){ S.disc.ban--; me.served = true; }
  if (live){ gf = live.gf; ga = live.ga; me.g = live.g; me.a = live.a; me.og = live.og || 0; f.live = true; if (live.card) me.card = live.card; }
  else {
    gf = mcPoisson(X.lf); ga = mcPoisson(X.la);
    // level in a knockout: thirty minutes of extra time (penalties, if it's still level, come in mcAfter)
    if (mcKoLevel(f, null, gf, ga)){ gf += mcPoisson(X.lf*.3); ga += mcPoisson(X.la*.3); et = true; }
    if (me.mins) for (let i=0;i<gf;i++){ const x = Math.random(); if (x<X.pG) me.g++; else if (x<X.pG+X.pA) me.a++; }
    // booked, or sent off (and down to ten, a goal more likely against you)
    if (me.mins){ me.card = mcCardRoll(me.mins); if (me.card && me.card!=="y"){ me.sent = Math.max(me.st==="start" ? 20 : 90 - me.mins + 1, Math.round((me.st==="start" ? 0 : 90 - me.mins) + me.mins*(.35 + Math.random()*.6))); me.mins = Math.max(1, me.sent - (me.st==="start" ? 0 : 90 - me.mins)); if (Math.random()<.35) ga++; } }
  }
  f.res = {gf, ga};
  if (live ? live.et : et) f.res.et = true;
  if (live && live.pens) f.res.pens = live.pens;
  if (me.mins){
    me.cs = me.mins>=60 && ga===0;
    const d = DEF.includes(pos) || pos==="CDM", win = gf>ga, loss = gf<ga;
    let rt = 6.35 + (mcOvr() - f.oppStr)*.02 + me.g*.95 + me.a*.6 + (me.cs && d ? .7 : 0) + (win ? .3 : loss ? -.3 : 0) - (d && ga>=3 ? .5 : 0)
      - Math.max(0, c.fat-60)/40*.6 + (c.sharp-80)/40*.35 + (live ? live.bonus*.6 + gauss()*.3 : gauss()*.5);   // on the same scale as everyone else's (sqRate)
    if (me.st==="sub") rt = 6.3 + (rt-6.35)*.6;
    rt -= me.card==="y" ? .25 : me.card ? 1.2 : 0;
    me.r = +clamp(rt, 3.5, 10).toFixed(1);
    mcBook(me.card);
    c.form = c.form.concat(me.r).slice(-6);
    c.fat = clamp(c.fat + 13*t*(1 - (mcA().sta-55)/150)*(pos==="GK" ? .5 : 1), 0, 100); c.sharp = clamp(c.sharp + 9*t, 0, 100);
    // matches teach you too, more when you play well
    const rf = clamp(me.r - 5.8, .3, 2.2);
    MC_ATTR.forEach(([k])=>{ a[k] = +(a[k] + mcGrowth(S.age)*.08*t*mcRoom(k)*rf).toFixed(2); });
    // the manager notices every game: good ratings build his trust over a season, poor ones wear it down
    if (!S.loan && me.mins>=30){ const Mg = mgr(S.mc.club); Mg.trust = +clamp(Mg.trust + clamp((me.r-6.9)*.6, -1.2, 1.2), 5, 100).toFixed(1); }
    if (me.g>=3) note("good", `Hat-trick against ${f.opp}`, `${me.g} goals in a ${gf}–${ga} ${win?"win":loss?"defeat":"draw"}. Match rating ${me.r}.`);
  }
  const det = sqMatch(f, live && live.ev);   // scorers, everyone's ratings and the Player of the Match
  mcAfter(f, r, rec, X.base);
  if (f.code==="league") lgOnResult(f, det);
  else if (f.cup) cpOnResult(f, det);
  else if (f.eu) euOnResult(f, det);
}
// a played fixture moves the league record on, and decides cup and European ties
function mcAfter(f, r, rec, base){
  const {gf, ga} = f.res, pts = gf>ga ? 3 : gf===ga ? 1 : 0;
  (rec.form ||= []).push(pts===3 ? "W" : pts===1 ? "D" : "L"); if (rec.form.length>10) rec.form.shift();
  if (f.code==="league"){ const L = rec.lg; L.p++; L.gf += gf; L.ga += ga; if (pts===3) L.w++; else if (pts===1) L.d++; else L.l++; return; }
  r.games++;
  if (f.eu && f.ri===-1){ r.pts += pts; r.gp++; euPhaseResult(f, S.mc.club); if (r.gp>=EURO[f.code].phase && !euPhaseEnd(r, f.code, S.mc.club)) mcEuPhaseEnd(r, EURO[f.code]); return; }
  if (f.gi!=null){ r.pts += pts; r.gp++; if (r.gp>=3){ if (r.pts>=4 || (r.pts===3 && Math.random()<.4)) r.next = 1; else mcOut(r, "Group stage", null, 0); } return; }
  if (f.leg===1){ r.tie = {i:f.ri, opp:f.opp, str:f.oppStr, gf, ga, home:f.home}; return; }
  let F = gf, A = ga; if (f.leg===2){ F += r.tie.gf; A += r.tie.ga; f.agg = [F, A]; }
  let through = F>A;
  if (F===A){ through = f.res.pens ? f.res.pens==="won" : Math.random() < logistic((base - f.oppStr)/12); f.res.pens = through ? "won" : "lost"; }
  r.tie = null;
  if (!through){ mcOut(r, f.round, f.opp, f.ri); return; }
  r.beaten.push(f.opp); r.next++;
  if (r.next>=f.nr){ r.alive = false; r.won = true; }
}
function mcLive(f){
  if (f.code==="league") return true;
  const rec = mcRec(S.mc.club), r = f.eu ? rec.eu : rec.cups[f.code];
  return !!r && r.alive && (f.eu && f.ri===-1 ? r.next===null : f.gi!=null ? r.next===0 : r.next===f.ri);
}
// one week: training, then midweek ties, then the weekend. Every match you're picked for is played live as key
// moments (lvPlayMatch); each fixture is saved as it's decided, so closing the app mid-week picks up where it left off
async function mcWeek(live=true){
  const M = S.mc, wk = M.weeks[M.wi]; if (!wk || M.done) return;
  const specs = {}; cupSpecs(M.club).forEach(c=>{ specs[c.code] = c; });
  if (!wk.trained){ mcTrain(M.wi); wk.trained = true; }
  for (const f of wk.fx.slice().sort((x,y)=>(x.code==="league")-(y.code==="league"))){
    if (f.res || f.skip) continue;
    if (!mcSetup(f, M.wi, specs)){ if (f.cup && f.gi==null) cpAdvance(f.code, f.ri); else if (f.eu) euAdvance(f.code, f.ri); continue; }   // a cup you're out of still plays its round
    if (live && f.me.mins){
      save();
      try{ await lvPlayMatch(f, M.wi); } catch(err){ console.error(err); if (!f.res) mcResolve(f, M.wi); }   // never leave a match half-played
    } else mcResolve(f, M.wi);
  }
  lgWeekDone(M);
  euTick(mcFrac(M.wi));   // Europe's other games, up to this week
  M.wi++; if (M.wi>=M.weeks.length) M.done = true;
}
let mcBusy = false;
async function mcAdvance(kind){
  const M = S.mc; if (!M || M.done || mcBusy) return;
  mcBusy = true; M.from = M.wi;
  // "half" plays straight through to January (or May), opening every match you're in; the panel keeps up between weeks
  try{ do { await mcWeek(); if (kind==="half"){ save(); render(); } } while (kind==="half" && !M.done); }
  finally{ mcBusy = false; }
  save(); render();
}
// the half-season's numbers go to the same review as the manual form
function mcFinishHalf(){
  const M = S.mc; if (!M || !M.done || M.finished) return;
  const blank = code => ({apps:0, g:0, a:0, cs:0, mins:0, of:0, rs:0, rn:0, potm:0, code});
  const comps = {}; currentPlan().forEach(p=>{ comps[p.code] = blank(p.code); });
  M.weeks.forEach(w=>w.fx.forEach(f=>{
    if (!f.res || !f.me) return;
    const o = comps[f.code] ||= blank(f.code);
    o.of += 90;
    if (!f.me.mins) return;
    o.apps++; o.g += f.me.g; o.a += f.me.a; if (f.me.cs) o.cs++; o.mins += f.me.mins; if (f.me.st==="start") o.starts = (o.starts || 0) + 1;
    if (f.me.r!=null){ o.rs = +(o.rs + f.me.r).toFixed(1); o.rn++; } if (f.potm) o.potm++;
    if (f.me.card==="y") o.yc = (o.yc || 0) + 1; else if (f.me.card) o.rc = (o.rc || 0) + 1;
  }));
  M.finished = true;
  tgHalfway();
  applyHalf(comps);
}

/* ---------- season end: results from the fixtures you played ---------- */
// a match centre season from before the league was played out (league.js): only your club's row comes from your results
function mcLeagueTable(rows, our){
  const rec = mcRecIf(our), row = rows.find(r=>r.n===our);
  if (!rec || !row || !rec.lg.p) return;
  const L = rec.lg, t = tierOf(our), g = TIERS[t].games || L.p, base = strOf(our), tier = S.world.tiers[t];
  const avg = tier.reduce((s,n)=>s + strOf(n), 0)/tier.length;
  let pts = L.w*3 + L.d, gd = L.gf - L.ga;
  // games before a January move weren't played here, so they're simulated as before
  for (let k=L.p;k<g;k++){ const m = match(base, avg); pts += m; gd += m===3 ? 1 : m===0 ? -1 : 0; }
  row.pts = pts; row.gd = gd;
  rows.sort((a,b)=>b.pts-a.pts || b.gd-a.gd || Math.random()-.5); rows.forEach((r,i)=>{ r.pos = i+1; });
}
function mcKoOut(r){
  return r.won ? `Winners, beat ${r.beaten[r.beaten.length-1]} in the final` : r.reached==="Final" ? `Runners-up, lost the final to ${r.lostTo}` : `Reached the ${r.reached}, knocked out by ${r.lostTo}`;
}
function mcCupResult(our, c){
  const rec = mcRecIf(our), r = rec && rec.cups[c.code]; if (!r) return null;
  const base = strOf(our);
  cpFate(c.code, our, r);   // a cup played out in full: the rest of your run comes from the draw
  while (r.alive && !r.won && r.next<c.rounds.length){
    const i = r.next, L = c.legs ? c.legs(i) : 1;
    if (c.group && i===0){ r.games += 3 - r.gp; r.gp = 3; r.next = 1; continue; }
    const o = r.tie && r.tie.i===i ? {n:r.tie.opp, str:r.tie.str} : c.oppFor(i); r.games += L - (r.tie && r.tie.i===i ? 1 : 0); r.tie = null;
    if (tie(base, o.str, L)){ r.beaten.push(o.n); r.next++; if (r.next>=c.rounds.length){ r.alive = false; r.won = true; } } else mcOut(r, c.rounds[i], o.n, i);
  }
  const res = {code:c.code, name:c.name, games:r.games, won:!!r.won, stage:r.won ? c.rounds.length : r.stage, beaten:r.beaten};
  if (r.won) return {...res, reached:"Winners", out:mcKoOut(r)};
  if (r.reached==="Group stage") return {...res, reached:"Group stage", out:"Out in the group stage"};
  return {...res, reached:r.reached, lostTo:r.lostTo, out:mcKoOut(r)};
}
function mcEuroResult(our, code){
  const rec = mcRecIf(our), r = rec && rec.eu; if (!r || r.code!==code) return null;
  const E = EURO[code], base = strOf(our), field = euroField(code, our);
  euFate(code, our, r);   // Europe played out in full: the rest of your run comes from the bracket
  if (r.next===null && r.alive){ r.opps.slice(r.gp).forEach(o=>{ r.pts += match(base, o.str); r.games++; }); r.gp = E.phase; mcEuPhaseEnd(r, E); }
  if (r.reached==="League phase") return {code, name:E.name, games:r.games, won:false, stage:0, reached:"League phase", out:`Out in the league phase with ${r.pts} points${r.rank ? `, ${ord(r.rank)} of 36` : ""}`};
  while (r.alive && !r.won && r.next<KO_EU.length){
    const i = r.next, L = i===4 ? 1 : 2, o = r.tie && r.tie.i===i ? {n:r.tie.opp, str:r.tie.str} : shuffle(field).slice(0,2+i).sort((x,y)=>y.str-x.str)[0];
    r.games += L - (r.tie && r.tie.i===i ? 1 : 0); r.tie = null;
    if (tie(base, o.str, L)){ r.beaten.push(o.n); r.next++; if (r.next>=KO_EU.length){ r.alive = false; r.won = true; } } else mcOut(r, KO_EU[i], o.n, i);
  }
  return {code, name:E.name, games:r.games, won:!!r.won, stage:r.won ? KO_EU.length : r.stage, reached:r.won ? "Winners" : r.reached, lostTo:r.lostTo, beaten:r.beaten,
    out:`${r.pts} pts in the league phase${r.rank ? `, ${ord(r.rank)}` : ""}${r.top8 ? " (top 8, straight to the last 16)" : ""}. ${mcKoOut(r)}`};
}

/* ---------- the panel ---------- */
function mcCompLabel(f){ return f.code==="league" ? TIERS[tierOf(S.mc.club)].short : compName(f.code); }
function mcMeLine(f){
  const me = f.me; if (!me) return "";
  const st = {start:"Started", sub:`Came on for ${me.mins}'`, bench:"Unused sub", inj:`Injured${me.why?` (${esc(me.why)})`:""}`, intl:"Away on international duty", ban:"Suspended"}[me.st];
  if (!me.mins) return st;
  const bits = [me.g ? `<b>${me.g} goal${me.g>1?"s":""}</b>` : "", me.a ? `<b>${me.a} assist${me.a>1?"s":""}</b>` : "", me.og ? `${me.og} own goal${me.og>1?"s":""}` : "", me.cs && (DEF.includes(S.player.pos) || S.player.pos==="CDM") ? "clean sheet" : "",
    me.card ? `${lvCardIc(me.card)}${me.card==="y" ? "booked" : `sent off${me.sent ? ` ${me.sent}'` : ""}`}` : ""].filter(Boolean);
  return `${st}${bits.length ? " · " + bits.join(", ") : ""} · <span class="rt ${me.r>=7.5?"hi":me.r<6?"lo":""}">${me.r}</span>${f.coins!=null ? ` · <span class="coins sm"><i class="coin" aria-hidden="true"></i>${f.coins>=0?"+":""}${f.coins}</span>` : ""}`;
}
function mcFxRow(f, w){
  const done = !!f.res, wdl = done ? (f.res.gf>f.res.ga || f.res.pens==="won" ? "w" : f.res.gf<f.res.ga || f.res.pens==="lost" ? "l" : "d") : "";
  const opp = f.opp ? `${f.neutral ? "" : f.home ? "" : "at "}${esc(f.opp)}` : "Opponent to be drawn";
  const extra = done && f.agg ? ` · ${f.agg[0]}–${f.agg[1]} on aggregate` : "", pens = done && f.res.pens ? ` · ${f.res.pens==="won" ? "won" : "lost"} on penalties` : "";
  return `<div class="fx ${f.big?"big":""} ${done?"":"todo"}"><span class="fx-d">${mcDate(w, f)}</span>
    <span class="fx-o"><span class="fx-n">${f.opp ? clubBadge(f.opp, 20) : ""}<span>${f.big?"★ ":""}${opp}</span></span><small>${esc(mcCompLabel(f))}${f.code!=="league" ? " · " + esc(f.round) + (f.leg ? `, leg ${f.leg}` : "") : f.home ? " · home" : ""}${!done && f.code==="league" && lgPosOf(f.opp) ? ` · ${ord(lgPosOf(f.opp))} in the table` : ""}${extra}${pens}</small></span>
    <span class="fx-s ${wdl}">${done ? `${f.res.gf}–${f.res.ga}` : ""}</span>
    ${done ? `<span class="fx-me">${mcMeLine(f)}</span>` : ""}</div>`;
}
// this week's main match, big: both badges, where they are in the table, the competition and the ground
function mcHero(f, w){
  const our = S.mc.club, [h, a] = !f.opp || f.home || f.neutral ? [our, f.opp] : [f.opp, our];
  const side = n => n ? `<div class="mc-side">${clubBadge(n, 46)}<b>${esc(n)}</b>${f.code==="league" && lgPosOf(n) ? `<small>${ord(lgPosOf(n))} in the table</small>` : ""}</div>`
    : `<div class="mc-side"><span class="crest-q" aria-hidden="true">?</span><b>To be drawn</b></div>`;
  const ground = f.neutral ? "Neutral venue" : f.opp ? meta(h).ground : "";
  return `<div class="mc-vs">${side(h)}<span class="mc-v">v</span>${side(a)}</div>
    <p class="mc-vs-sub">${f.big ? "★ " : ""}${esc(mcCompLabel(f))}${f.code!=="league" ? ` · ${esc(f.round)}${f.leg ? `, leg ${f.leg}` : ""}` : ""} · ${mcDate(w, f)}${ground ? ` · ${esc(ground)}` : ""}</p>`;
}
function mcPanel(){
  if (!S.mc || S.mc.key!==mcKey()) { mcBuild(); save(); }
  const M = S.mc, c = S.cond, a = S.attr, W = M.weeks.length, h = M.half, cups = cpPanel(), eup = euPanel();
  const list = []; M.weeks.forEach((wk,w)=>wk.fx.slice().sort((x,y)=>(x.code==="league")-(y.code==="league")).forEach(f=>{ if (!f.skip && (f.res || mcLive(f) || f.code==="league")) list.push([f,w]); }));
  const played = list.filter(([f])=>f.res), now = list.filter(([f,w])=>!f.res && w===M.wi), later = list.filter(([f,w])=>!f.res && w>M.wi);
  const tot = {apps:0, g:0, a:0, cs:0, r:[], potm:0, mins:0, of:0, yc:0, rc:0}; played.forEach(([f])=>{ if (!f.me) return; tot.of += 90; if (f.me.card==="y") tot.yc++; else if (f.me.card) tot.rc++; if (f.me.mins){ tot.apps++; tot.g += f.me.g; tot.a += f.me.a; if (f.me.cs) tot.cs++; tot.r.push(f.me.r); if (f.potm) tot.potm++; tot.mins += f.me.mins; } });
  const avgR = tot.r.length ? (tot.r.reduce((s,x)=>s+x, 0)/tot.r.length).toFixed(2) : "–";
  const fa = mcFormAvg(), pS = mcStartChance(), injNow = M.done ? null : mcInjury(mcFrac(M.wi));
  const T = S.train, a0 = S.attr0 && S.attr0.s===seasonLabel(S.season) ? S.attr0 : null, showCS = DEF.includes(S.player.pos);
  // your numbers in one strip: each a label, a value, a meter and (on wider screens) what it means
  const stat = (l, v, sub, pct, cls="") => `<div class="mc-st"><span class="label">${l}</span><b>${v}</b>${pct!=null ? `<span class="meter ${cls}"><span style="width:${clamp(pct,0,100)}%"></span></span>` : ""}<small>${sub}</small></div>`;
  const hint = T.focus==="rest" ? "Rest: no growth this week, but you recover fast."
    : T.focus==="prep" ? "Match prep: sharper for the next games, with little growth."
    : `${mcAttrName(T.focus)} grows fastest.${T.hard ? " Hard sessions grow you about 60% faster, but tire you and risk injury." : ""}${S.age<=20 ? " At your age training pays off fast." : S.age>=30 ? " Past 30, training slows your decline." : ""}`;
  const fx = rows => `<div class="fxl">${rows.map(([f,w])=>mcFxRow(f,w)).join("")}</div>`;
  return `<section class="panel mc" id="actionPanel">
    <div class="mc-head"><h2>${seasonLabel(S.season)} · ${esc(M.club)}</h2><span class="pill ${h===1?"":"eu"}">${h===1 ? "Aug to Dec" : "Jan to May"}</span></div>
    <div class="mc-prog"><span class="label">${M.done ? `All ${W} weeks played` : `Week ${M.wi+1} of ${W}`}</span><div class="meter"><span style="width:${Math.round(M.wi/W*100)}%"></span></div><span class="mc-tf" aria-label="Team form">${mcFormPills(mcTeamForm(M.club).L)}</span></div>
    ${S.disc && S.disc.ban>0 && !M.done ? `<p class="ref bad"><strong>Suspended.</strong> You'll miss the next ${S.disc.ban===1 ? "match" : S.disc.ban + " matches"}.</p>` : ""}
    ${S.disc && S.disc.s===seasonLabel(S.season) && S.disc.y%5===4 && !M.done ? `<p class="ref">${lvCardIc("y")} ${S.disc.y} yellow cards this season: one more and you're banned for a match.</p>` : ""}
    ${injNow ? `<p class="ref bad"><strong>Injured: ${esc(injNow.name)}.</strong> You'll miss games until you're fit again. Training this week is rehab.</p>` : ""}
    ${!M.done && M.wi<M.intlTo ? `<p class="ref">Away on international duty for the first ${M.intlTo} weeks of the half.</p>` : ""}
    ${M.done ? `<div class="mc-next"><p><strong>${h===1 ? "That's the first half of the season done." : "That's the season done."}</strong> ${tot.apps} appearances, ${tot.g} goals and ${tot.a} assists${showCS?`, ${tot.cs} clean sheets`:""}, average rating ${avgR}.</p>
        <button class="btn primary big" data-act="mc-finish">${h===1 ? "Go to the January window" : "See how the season ended"}</button></div>`
    : `<div class="mc-next"><div class="mc-next-h"><span class="label">This week · ${mcDate(M.wi)}</span>${now.some(([f])=>f.big) ? `<span class="pill gold">★ Big game</span>` : ""}</div>
        ${now.length ? (main => mcHero(...main) + (now.length>1 ? fx(now.filter(x=>x!==main)) : ""))(now.find(([f])=>f.code==="league") || now[0]) : `<p class="hint">No match this week, just training.</p>`}
        <div class="mc-actions"><button class="btn primary big" data-act="mc-week">Play next week</button><button class="btn" data-act="mc-half">${h===1 ? "Play to January" : "Play to May"}</button></div></div>`}
    <div class="mc-strip">
      ${(sr => stat("Rating", sr!=null ? sr.toFixed(2) : "–", sr!=null ? `Season average · ${mcRateLabel(sr)}` : "Season average", sr!=null ? (sr-5.5)/3*100 : null, "rate"))(mcSeasonRating())}${stat("Form", c.form.length ? fa.toFixed(1) : "–", mcFormLabel(fa), c.form.length ? (fa-5.6)/2*100 : null)}
      ${stat("Sharp", Math.round(c.sharp), c.sharp>=75 ? "Match sharp" : c.sharp>=50 ? "Getting there" : "Rusty", c.sharp)}
      ${stat("Fitness", Math.round(100-c.fat), c.fat>75 ? "Exhausted" : c.fat>55 ? "Tired" : "Fresh", 100-c.fat, "trust")}${stat("Picked", Math.round(pS*100)+"%", mcStartLabel(pS), pS*100)}
    </div>
    ${(m => `<p class="mc-mins">Minutes this season: <b>${m.mins.toLocaleString("en-GB")}</b> in ${m.apps} game${m.apps===1 ? "" : "s"}${m.apps ? ` · ${m.starts} start${m.starts===1 ? "" : "s"}, ${m.apps - m.starts} off the bench` : ""}</p>`)(mcSeasonMins())}
    ${M.done ? "" : `<div class="mc-train">
      <div class="mc-train-h"><span class="label">Training</span>
        ${T.focus!=="rest" ? `<div class="seg2 mc-int" role="group" aria-label="Intensity"><button type="button" data-act="mc-hard" data-k="0" aria-pressed="${!T.hard}">Normal</button><button type="button" data-act="mc-hard" data-k="1" aria-pressed="${!!T.hard}">Hard</button></div>` : ""}
        <button type="button" class="btn small" data-shop="open"><i class="coin" aria-hidden="true"></i> Shop</button></div>
      <div class="chips mc-chips" role="group" aria-label="Training focus">${MC_TRAIN.map(([k])=>`<button type="button" class="chip ${T.focus===k?"on":""}" data-act="mc-focus" data-k="${k}" aria-pressed="${T.focus===k}">${esc(mcAttrName(k))}</button>`).join("")}</div>
      <p class="hint">${hint}${S.boost && S.boost.double>0 ? ` <span class="pill gold">Double training · ${S.boost.double} week${S.boost.double===1?"":"s"} left</span>` : ""}</p>
      ${drPanel()}
      <p class="hint mc-imp"><b>${mcTrainLabel(mcTrainImp())}.</b> Good drills and hard sessions get you more game time.</p>
    </div>`}
    ${subTabs("season", [
      ["results", "Results", `${played.length ? fx(played.slice(-5).reverse()) : `<p class="empty">No results yet. Tap Play next week to get going.</p>`}${later.length ? `<h3>Coming up</h3>${fx(later.slice(0,3))}` : ""}`],
      lgGet(M.lgk) && ["table", "Table", lgPanel()],
      cups && ["cups", "Cups", cups],
      eup && ["europe", "Europe", eup],
      S.tg && S.tg.s===seasonLabel(S.season) && ["targets", "Targets", tgPanel()],
      ["you", "You", `<div class="totals">${[["Apps",tot.apps],["Goals",tot.g],["Assists",tot.a],...(showCS?[["Clean sheets",tot.cs]]:[]),["Avg rating",avgR],["Minutes",tot.of ? Math.round(tot.mins/tot.of*100)+"%" : "–"],["Player of the Match",tot.potm],["Cards",`${lvCardIc("y")}${tot.yc} ${lvCardIc("r")}${tot.rc}`]].map(([l,v])=>`<div class="total"><div class="label">${l}</div><div class="v">${v}</div></div>`).join("")}</div>
        <h3>Your attributes</h3>
        <div class="attrs">${MC_ATTR.map(([k])=>{ const d = a0 ? Math.round(a[k]-a0[k]) : 0, bt = mcBoot(), bn = bt && bt.k===k ? bt.n : 0;
          return `<div class="attr"><span>${esc(mcAttrName(k))}</span><div class="meter"><span style="width:${Math.min(99, a[k]+bn)}%"></span></div><span class="v">${Math.round(Math.min(99, a[k]+bn))}${bn ? `<small class="boot" title="From your boots">${shopBootIcon(mcBoot().k, Account.locker().boots[mcBoot().k], "boot-ic tiny")}+${bn}</small>` : ""}${d ? `<small class="${d>0?"":"neg"}">${d>0?"+":""}${d}</small>` : ""}</span></div>`; }).join("")}</div>
        <p class="hint" style="margin-top:8px">Numbers are this half of the season. Green and red show changes since August.${mcBoot() ? ` ${shopBootIcon(mcBoot().k, Account.locker().boots[mcBoot().k], "boot-ic tiny")} is your ${esc(shopBootName(mcBoot().k))}.` : ""} ${mcPotLabel()}.</p>
        <p class="pen-line">${penOwned() ? `<button type="button" class="btn small" data-penact="open">${PEN_IC()} Edit your player</button>` : `<button type="button" class="btn small" data-penact="shop">${PEN_IC()} Edit your player</button><span class="hint">Needs the Editor pen from the shop</span>`}</p>`],
      ["fixtures", "Fixtures", `${fx(list)}<p class="hint" style="margin-top:8px">★ marks the big games. Cup ties only appear while the team is still in the competition.</p>`]
    ])}
    ${mcModeSwitch()}
  </section>`;
}
function mcAction(a, b){
  const k = b.dataset.k;
  if (a==="mc-week") mcAdvance("week");
  else if (a==="mc-half") mcAdvance("half");
  else if (a==="mc-finish") mcFinishHalf();
  else if (a==="mc-drill") drPlay();
  else if (a==="mc-focus"){ S.train.focus = k; save(); render(); }
  else if (a==="mc-hard"){ S.train.hard = k==="1"; save(); render(); }
  else if (a==="mc-mode"){
    if (k==="manual" && !penOwned()) return shopOpenPen();
    if (mcCanSwitch(k)){ S.modeSeason = {s:seasonLabel(S.season), m:k}; if (k==="manual" && S.tg && S.tg.s===seasonLabel(S.season)) S.tg = null; }   // no targets for a season you log by hand
    S.mode = k; save(); render();
  }
}
