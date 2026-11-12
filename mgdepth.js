/* mgdepth.js — 3.1 and 3.2: more to do in the dugout and the boardroom, and one football world.
   1. Touchline calls: a few times a match the game stops and asks you to react (a red card, an hour gone and
      you're behind, a lead to protect, a wobble). Each answer changes how the team plays for a spell.
   2. Your press persona: how you answer the press builds a reputation (Motivator, Diplomat or Firebrand), each
      with a small edge.
   3. Weather on match day, and "why it went that way" under every result.
   4. A scouting network: scouts by region who file reports on players worth a look.
   5. Director of Football: a monthly board pack, interviewing head-coach candidates, a club philosophy the owner
      judges you on, and deadline day.
   6. One world: the players you've made in Player Career turn up in your Manager and Director saves, and a retired
      player can go into management under his own name. */

/* ================= 1. TOUCHLINE CALLS ================= */
const MGT = {
  oppRed:{t:"They're down to ten", q:"A red card for them. How do you want to play it?", o:[["Go for the throat", "Pour forward for 20 minutes", S=>{ S.push = 1; S.pushT = 20; return "You wave everyone forward against the ten men."; }],
    ["Keep the shape", "Stay patient and let the extra man tell", S=>{ S.boost = .9; S.boostT = 25; return "You tell them to stay patient: the gaps will come."; }],
    ["Slow it down", "Keep the ball, take no risks", S=>{ S.push = -1; S.pushT = 15; S.boost = .5; S.boostT = 15; return "You ask them to keep the ball and take the sting out of it."; }]]},
  usRed:{t:"You're down to ten", q:"A man short. What's the message?", o:[["Dig in", "Two banks of four, protect what you have", S=>{ S.push = -1; S.pushT = 30; S.boost = 1; S.boostT = 20; return "You reorganise: two banks of four and no way through."; }],
    ["Stay brave", "Keep playing your game: it could lift them or leave you open", S=>{ const ok = Math.random()<.5; S.boost = ok ? 1.6 : -1; S.boostT = 20; return ok ? "You tell them to keep playing, and they respond brilliantly." : "You stay on the front foot, and the gaps are showing."; }],
    ["Say nothing", "Trust them to work it out", S=>"You leave them to it."]]},
  behind:{t:"An hour gone, and you're behind", q:"Time is running out. What now?", o:[["Throw men forward", "More chances for you, and for them", S=>{ S.push = 1; S.pushT = 25; return "You throw men forward."; }],
    ["Trust the plan", "Keep doing the right things", S=>{ S.boost = .8; S.boostT = 20; return "You tell them the chances will come: keep going."; }],
    ["Read the riot act", "A gamble: it could spark them or sink them", S=>{ const ok = Math.random()<.55; S.boost = ok ? 2 : -1.2; S.boostT = 15; return ok ? "Your words from the touchline light a fire under them!" : "Your anger doesn't help: heads go down."; }]]},
  ahead:{t:"A narrow lead, minutes left", q:"How do you see this out?", o:[["Shut up shop", "Everyone behind the ball", S=>{ S.push = -1; S.pushT = 20; return "You pull everyone back behind the ball."; }],
    ["Keep the ball", "Stay calm, make them chase", S=>{ S.boost = .7; S.boostT = 15; S.focus = .8; setTimeout(()=>{ if (typeof LV!=="undefined" && LV) S.focus = 0; }, 15000); return "You tell them to keep it and make the other side chase."; }],
    ["Go for a second", "Kill the game off", S=>{ S.push = 1; S.pushT = 15; return "You want the second goal to finish it."; }]]},
  rocking:{t:"You're rocking", q:"Two goals conceded in quick succession. Steady the ship?", o:[["Calm them down", "Slow it down, get your shape back", S=>{ S.push = -1; S.pushT = 10; S.boost = .8; S.boostT = 15; return "You get them to slow it down and find their shape."; }],
    ["Demand a reaction", "A gamble", S=>{ const ok = Math.random()<.5; S.boost = ok ? 1.8 : -1; S.boostT = 15; return ok ? "You demand a reaction, and you get one." : "You demand a reaction. It doesn't come."; }],
    ["Change nothing", "They know what went wrong", S=>"You keep faith with what you're doing."]]},
  level:{t:"All square with twenty to go", q:"Stick or twist?", o:[["Go and win it", "More risk, more reward", S=>{ S.push = 1; S.pushT = 20; return "You send them forward to win it."; }],
    ["Stay as you are", "Keep the balance", S=>{ S.boost = .6; S.boostT = 20; return "You tell them to keep playing: one chance will do."; }],
    ["Take the point", "Make sure you don't lose it", S=>{ S.push = -1; S.pushT = 20; return "You settle for what you have."; }]]}
};
function mgtCheck(G, evs){
  if (typeof LV==="undefined" || !LV || LV.watch || mgDof() || G.done || G.user!==LV.us) return;
  const C = (LV.calls ||= {n:0, done:{}, conc:[]}), us = LV.us, gd = G.score[us] - G.score[1 - us];
  evs.forEach(e=>{ if (e.k==="goal" && e.s!==us) C.conc.push(G.min); });
  if (C.n>=3 || LV.wantCall || G.min<12 || (G.min>=44 && G.min<=47) || G.min>88) return;
  const want = k => { if (C.done[k]) return false; C.done[k] = 1; C.n++; LV.wantCall = k; return true; };
  const red = evs.find(e=>e.k==="red");
  if (red) return void want(red.s===us ? "usRed" : "oppRed");
  if (C.conc.length>=2 && C.conc[C.conc.length - 1]===G.min && G.min - C.conc[C.conc.length - 2]<=10) return void want("rocking");
  if (gd<0 && G.min>=60 && G.min<=75) return void want("behind");
  if (gd===1 && G.min>=78) return void want("ahead");
  if (gd===0 && G.min>=70 && G.min<=74) return void want("level");
}
function mgtHTML(){
  const D = MGT[LV.call]; if (!D) return "";
  return `<div class="mm-card-in"><div class="eyebrow">Touchline call · ${LV.G.min}'</div><h3>${D.t}</h3><p class="hint">${D.q}</p>
    <div class="mm-opts">${D.o.map(([l, d], i)=>`<button type="button" class="btn" data-mm="calldo" data-i="${i}"><b>${l}</b><small>${d}</small></button>`).join("")}</div></div>`;
}
function mgtDo(i){
  const D = MGT[LV.call], G = LV.G, S = G.S[LV.us]; if (!D || !D.o[i]) return;
  const txt = D.o[i][2](S); LV.call = null;
  mmRate(S); mmFeed(mmSay(G, LV.us, "shout", txt));
}

/* ================= 2. YOUR PRESS PERSONA ================= */
const MGP = [["The Motivator", "Your team talks land a little better."], ["The Diplomat", "The board is a little slower to lose faith."], ["The Firebrand", "Demanding more from the touchline works more often."]];
function mgpTally(i){ const P = (M.mgr.per ||= [0, 0, 0]); if (i>=0 && i<3) P[i]++; }
function mgpIs(){ const P = M && M.mgr && M.mgr.per; if (!P) return -1; const n = P[0] + P[1] + P[2]; if (n<6) return -1; const i = P.indexOf(Math.max(...P)); return P[i]/n>=.45 ? i : -1; }
const mgpBonus = k => { const p = mgpIs(); return k==="talk" ? (p===0 ? .3 : 0) : k==="demand" ? (p===2 ? .15 : 0) : 0; };
function mgpHTML(){
  if (mgDof()) return "";
  const P = M.mgr.per || [0, 0, 0], n = P[0] + P[1] + P[2], p = mgpIs();
  return `<div class="mgc-card"><div class="eyebrow">How the press sees you</div>${p>=0 ? `<b class="mgp-name">${MGP[p][0]}</b><p class="hint">${MGP[p][1]}</p>` : `<p class="hint">${n<6 ? `Not yet known: answer ${6 - n} more press question${6 - n===1 ? "" : "s"} and a reputation forms.` : "No clear style: your answers have been a mix."}</p>`}</div>`;
}

/* ================= 3. WEATHER, AND WHY IT WENT THAT WAY ================= */
const MG_WX = {clear:["Clear", "☀"], rain:["Heavy rain", "🌧"], wind:["Strong wind", "💨"], snow:["Snow", "❄"], heat:["Very hot", "🌡"]};
function mgWx(f){
  const R = mgR(`${M.seed}|wx|${f.key}`), m = mgDate(f.day ?? M.day).getUTCMonth(), r = R();
  const k = m>=11 || m<=1 ? (r<.12 ? "snow" : r<.38 ? "rain" : r<.52 ? "wind" : "clear") : m>=5 && m<=7 ? (r<.14 ? "heat" : r<.26 ? "rain" : "clear") : (r<.24 ? "rain" : r<.38 ? "wind" : "clear");
  return {k, label:MG_WX[k][0], icon:MG_WX[k][1]};
}
// how the weather suits the way a side plays (a multiplier on the chances it makes)
function mgWxF(G, A){
  const k = G.wx; if (!k || k==="clear") return 1;
  if (k==="rain") return A.tac.pass===0 ? .95 : A.tac.pass===2 ? 1.03 : 1;
  if (k==="wind") return A.tac.pass===2 ? .93 : 1.01;
  if (k==="snow") return .93;
  return A.tac.tempo===2 || A.tac.press===2 ? .94 : 1;   // heat
}
function mgWhy(f, r){
  if (!r || !r.st || !r.st[0]) return [];
  const mine = f.h===M.club, a = r.st[mine ? 0 : 1], b = r.st[mine ? 1 : 0], gf = mine ? r.hg : r.ag, ga = mine ? r.ag : r.hg, out = [], xa = +(a.xg || 0), xb = +(b.xg || 0);
  if (xa || xb){ if (gf>ga && xa<xb - .4) out.push(`You took your chances: they made the better ones (${xb.toFixed(1)} expected goals to your ${xa.toFixed(1)}).`);
    else if (gf<ga && xa>xb + .4) out.push(`You made the better chances (${xa.toFixed(1)} expected goals to ${xb.toFixed(1)}) and didn't take them.`);
    else if (Math.abs(xa - xb)>.5) out.push(`${xa>xb ? "You" : "They"} made the better chances: ${xa.toFixed(1)} expected goals to ${xb.toFixed(1)}.`); }
  if (a.sh + b.sh>6 && Math.abs(a.sh - b.sh)>=6) out.push(`${a.sh>b.sh ? "You had" : "They had"} far more shots: ${a.sh} to ${b.sh}.`);
  if (a.rc) out.push("You played part of it a man down."); else if (b.rc) out.push("They played part of it a man down.");
  if (r.poss && Math.abs(r.poss[mine ? 0 : 1] - 50)>=12) out.push(`${r.poss[mine ? 0 : 1]>50 ? "You" : "They"} had most of the ball (${Math.round(Math.max(r.poss[0], r.poss[1]))}%).`);
  const tired = (r.ps || []).filter(s=>M.P[s.id] && M.P[s.id].club===M.club && s.start && (M.P[s.id].fit ?? 100)<62).length;
  if (tired>=4) out.push(`${tired} of your starters finished the game very tired.`);
  const wx = mgWx(f); if (wx.k!=="clear" && f.c!=="F") out.push(`${wx.label} on the day${wx.k==="wind" ? ": long balls suffered" : wx.k==="rain" ? ": short passing suffered" : wx.k==="snow" ? ": chances were hard to come by" : ": a fast tempo was hard to keep up"}.`);
  return out.slice(0, 3);
}

/* ================= 4. THE SCOUTING NETWORK ================= */
const MGN = {England:[1, 2, 3, 4, 5], Spain:["ES"], Germany:["DE"], Italy:["IT"], France:["FR"], Portugal:["POR"], Netherlands:["NED"], Scotland:["SCO"]};
const mgnCost = lvl => mgRoundWage((MG_WAGE[mgLeagueOf()] || 2000)*.2*lvl);
const mgnBill = () => Object.values(M.net || {}).reduce((s, l)=>s + (l ? mgnCost(l) : 0), 0);
function mgnWeekly(){
  const N = M.net; if (!N || M.out || M.phase==="sacked") return;
  const bill = mgnBill(); if (bill) mgFinAdd("exp", "wages", bill);
  const lv = mgLevel(M.club);
  for (const reg in N){ const lvl = N[reg]; if (!lvl || Math.random()>.14 + .08*lvl) continue;
    const clubs = mgShuffleR(MGN[reg].flatMap(t=>M.tiers[keyOf(t)] || []).filter(c=>c!==M.club), Math.random).slice(0, 3);
    let best = null, bs = -1;
    clubs.forEach(c=>{ const C = mgMaterialize(c); if (!C) return; C.sq.forEach(id=>{ const p = M.P[id]; if (!p || p.age>23 + lvl || M.short.includes(id) || (M.kn[id] || 0)>=60) return;
      const o = mgOvr(p); if (o<lv - 7 || o>lv + 6 + lvl*2) return;
      const s = (p.pot - lv)*1.2 + (o - lv) + (26 - p.age)*.6 + Math.random()*4; if (s>bs){ bs = s; best = p; } }); });
    if (!best) continue;
    M.kn[best.id] = Math.max(M.kn[best.id] || 0, 45 + lvl*17); M.short.push(best.id);
    const o = mgOvr(best), fuzz = 4 - lvl, grade = best.pot>=lv + 8 ? "A" : best.pot>=lv + 3 ? "B" : "C";
    mgMail("transfer", `Scout report (${reg}): ${best.n}`, `${best.n}, ${best.age}, ${best.pos} at ${best.club}. Your scout rates him ${o - fuzz}–${o + fuzz} now with room to grow, and values him at about ${mgMoney(mgValue(best))}. Recommendation: ${grade}${grade==="A" ? " (sign him)" : grade==="B" ? " (worth a closer look)" : " (one to watch)"}. He's been added to your shortlist.`, {act:{type:"player", id:best.id}});
  }
}
function mgnHTML(){
  const N = M.net || {};
  return `<div class="mgx-staff mgn"><div class="mgx-staff-h"><div><div class="label">Scouting network</div><b>${Object.values(N).filter(Boolean).length} region${Object.values(N).filter(Boolean).length===1 ? "" : "s"} covered</b><small>${mgWageTxt(mgnBill())} in all</small></div></div>
    <p class="hint">Put a scout in a region and he files reports on young players worth signing, straight onto your shortlist. A better scout reports more often, looks at older players too and judges them more exactly.</p>
    <div class="mgn-list">${Object.keys(MGN).map(r=>{ const l = N[r] || 0; return `<div class="mgn-row"><b>${r}</b><span class="mgn-lv">${l ? ["", "Local scout", "Senior scout", "Chief scout"][l] : "Nobody there"}</span><span class="mgn-c">${l ? mgWageTxt(mgnCost(l)) : ""}</span>
      <span class="row">${l<3 ? mgBtn("netup", l ? "Upgrade" : "Send a scout", "small", `data-v="${r}"`) : ""}${l ? mgBtn("netdown", "Recall", "small danger", `data-v="${r}"`) : ""}</span></div>`; }).join("")}</div></div>`;
}

/* ================= 5. DIRECTOR OF FOOTBALL ================= */
// the monthly board pack: where the club stands, in one message
function mgdMonthly(){
  if (!mgDof() || M.phase!=="season" || M.out) return;
  const t = mgLeagueOf(), pos = mgPos(), o = M.board.obj.find(x=>x.k==="league"), m = mdfSeasonMoney(), C = M.coach, sq = mgMine();
  const age = sq.length ? (sq.reduce((s, p)=>s + p.age, 0)/sq.length).toFixed(1) : "–", val = sq.reduce((s, p)=>s + mgValue(p), 0);
  const lines = [`League: ${ord(pos)} in the ${TIERS[t].name}${o ? ` (the owner wants ${ord(o.n)} or better: ${pos<=o.n ? "on track" : pos<=o.n + 3 ? "just short" : "well short"})` : ""}.`,
    `Money: ${m.profit>=0 ? "a profit" : "a loss"} of ${mgMoney(Math.abs(m.profit))} so far this season. Wages are ${mgWageTxt(mgBill())} against a budget of ${mgWageTxt(M.fin.wb)}${mgBill()>M.fin.wb ? " (over)" : ""}. Transfer budget left: ${mgMoney(M.fin.tb)}.`,
    C ? `Head coach: ${C.n} is ${mdfPerfTxt(C).toLowerCase()} and is ${mdfMood(C.mood).toLowerCase()}${C.con<=M.season ? "; his contract runs out this summer" : ""}.` : "Head coach: the post is vacant.",
    `Squad: ${sq.length} players, average age ${age}, worth about ${mgMoney(val)} in all.`,
    M.phil ? `Philosophy (${MGD_PHIL[M.phil].t}): ${mgdPhilState().txt}` : "Philosophy: none set. Choose one under Club > Owner before the season starts.",
    `The owner's confidence in you: ${mgConfLabel(M.board.conf)}.`];
  mgMail("board", `Board pack: ${mgDate(M.day).toLocaleString("en-GB", {month:"long", timeZone:"UTC"})}`, lines.join("\n\n"));
}
// interviews: a candidate's numbers are only a rough guide until you've sat down with him
const mgdHash = s => { let h = 0; for (const c of String(s)) h = (h*31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
function mgdRange(c, k){ if (c.iv) return String(c[k]); const off = mgdHash(c.n + k)%9 - 4, lo = clamp(c[k] + off - 7, 1, 99), hi = clamp(c[k] + off + 7, 1, 99); return `${lo}–${hi}`; }
const mgdIvLeft = () => Math.max(0, 3 - ((M.cands && M.cands.iv) || 0));
function mgdInterview(i){
  const c = mdfCands()[i]; if (!c || c.iv || !mgdIvLeft()) return;
  M.cands.iv = (M.cands.iv || 0) + 1; c.iv = true;
  const S = MDF_STYLES[c.style] || {};
  c.ivt = [`On his football: "${c.style} football in a ${c.f}. ${c.tac>=75 ? "I'll out-think most coaches at this level." : c.tac>=60 ? "We'll be well organised." : "I keep it simple."}"`,
    `On young players: "${c.yth>=65 ? "If they're good enough, they're old enough. I'll play them." : c.yth>=40 ? "They'll get chances when they've earned them." : "I need players who can win now. The academy isn't my priority."}"`,
    `On the dressing room: "${c.mot>=75 ? "Players run through walls for me." : c.mot>=58 ? "I'm fair, and players respect that." : "I'm not here to be liked."}" ${c.dev>=72 ? "He lights up talking about improving players on the training ground." : c.dev<52 ? "He has little to say about coaching individuals." : ""}`,
    M.phil ? `Fit with your philosophy (${MGD_PHIL[M.phil].t}): ${mgdPhilFit(c) ? "a good match." : "not an obvious match."}` : ""].filter(Boolean);
  mgSave();
}
// the club's philosophy: what the owner has agreed you're building, judged every summer
const MGD_PHIL = {
  youth:{t:"Develop our own", d:"Give young players real football. Judged on starts by players aged 21 or under."},
  prudent:{t:"Live within our means", d:"Run the club at a profit. Judged on the season's balance."},
  entertain:{t:"Play on the front foot", d:"Attacking football that fills the ground. Judged on league goals scored."},
  winnow:{t:"Win now", d:"Results above everything. Judged on the league finish against the owner's target."}
};
function mgdPhilState(){
  const k = M.phil; if (!k) return {ok:false, txt:""};
  if (k==="youth"){ const n = mgMine().filter(p=>p.age<=21).reduce((s, p)=>s + p.st.st, 0), need = 45; return {ok:n>=need, txt:`${n} starts by players aged 21 or under (target ${need} over the season).`}; }
  if (k==="prudent"){ const m = mdfSeasonMoney(); return {ok:m.profit>=0, txt:`${m.profit>=0 ? "A profit" : "A loss"} of ${mgMoney(Math.abs(m.profit))} so far.`}; }
  if (k==="entertain"){ const r = mgTable(mgLeagueOf()).find(x=>x.n===M.club) || {p:0, gf:0}, per = r.p ? r.gf/r.p : 0; return {ok:per>=1.55, txt:`${r.gf} league goals in ${r.p} games (${per.toFixed(2)} a game; target 1.55).`}; }
  const o = M.board.obj.find(x=>x.k==="league"), pos = mgPos(); return {ok:!o || pos<=o.n, txt:`${ord(pos)} in the league${o ? ` (target ${ord(o.n)})` : ""}.`};
}
const mgdPhilFit = c => !M.phil || (M.phil==="youth" ? c.yth>=60 : M.phil==="entertain" ? /Attack|Press|Possession/i.test(c.style) : M.phil==="winnow" ? c.tac>=68 : true);
function mgdPhilEnd(){
  if (!mgDof() || !M.phil || M.out) return;
  const S = mgdPhilState();
  mgBoardShift(S.ok ? 5 : -4, `Philosophy: ${MGD_PHIL[M.phil].t}`);
  mgMail("board", `Philosophy review: ${S.ok ? "delivered" : "not delivered"}`, `You and the owner agreed the club would "${MGD_PHIL[M.phil].t.toLowerCase()}". ${S.txt} ${S.ok ? "The owner is pleased you've stuck to it." : "The owner expected better."}`);
}
function mgdPhilHTML(){
  if (!mgDof()) return "";
  const lock = M.phase==="season", S = M.phil ? mgdPhilState() : null;
  return `<div class="mgc-card"><div class="eyebrow">Club philosophy</div>
    ${M.phil ? `<b class="mgp-name">${MGD_PHIL[M.phil].t}</b><p class="hint">${MGD_PHIL[M.phil].d}</p><p class="mg-int ${S.ok ? "ok" : "bad"}">${S.ok ? "On track" : "Behind"}: ${esc(S.txt)}</p>` : `<p class="hint">Agree with the owner what this club is about. You're judged on it every summer, on top of the season's objectives, and it shapes which head coaches fit.</p>`}
    ${lock ? `<p class="hint">${M.phil ? "It can be changed in the summer." : "It can be set once the season is over."}</p>` : `<div class="mgd-phil">${Object.entries(MGD_PHIL).map(([k, P])=>`<button type="button" class="btn small ${M.phil===k ? "primary" : ""}" data-mg="phil" data-v="${k}"><b>${P.t}</b></button>`).join("")}</div>`}</div>`;
}
// deadline day: the last day of a window brings a late bid and a late bargain (managers and directors alike)
function mgdDeadline(){
  if (M.out || M.phase==="sacked" || !M.club) return;
  const close = [MGD(M.season, 8, 1), MGD(M.season + 1, 1, 1)].find(d=>d - 1===M.day); if (!close) return;
  const notes = [];
  // a late bid, over the odds, for one of your better players
  const sq = mgMine().filter(p=>!p.lin && !p.loan && !p.inj && !(M.offers || []).some(o=>o.pid===p.id && o.st==="open")).sort((a, b)=>mgOvr(b) - mgOvr(a)).slice(1, 9);
  if (sq.length && Math.random()<.7){ const p = sq[Math.floor(Math.random()*sq.length)], club = mgBuyerFor(p);
    if (club){ const fee = mgRoundFee(mgValue(p)*(1.25 + Math.random()*.3)), t = {fee, inst:0, addon:0, sell:0, bb:0}, id = (M.ofid = (M.ofid || 0) + 1);
      (M.offers ||= []).push({id, pid:p.id, club, ...t, exp:M.day + 1, st:"open"});
      mgMail("transfer", `Deadline day: ${mgMoney(fee)} for ${p.n}`, `${club} have come in late with ${mgMoney(fee)} for ${p.n}, well over his value of ${mgMoney(mgValue(p))}. The window shuts tonight: accept or turn it down today.`, {act:{type:"offer", offer:id}});
      notes.push(`${club} have bid ${mgMoney(fee)} for ${p.n}.`); } }
  // a late bargain: a club that needs to sell lets one of your targets go cheaply, today only
  const pool = (M.short || []).map(id=>M.P[id]).filter(p=>p && p.club && p.club!==M.club && M.cl[p.club]);
  const lv = mgLevel(M.club), extra = pool.length ? [] : mgShuffleR(M.tiers[mgLeagueOf()].filter(c=>c!==M.club && M.cl[c]), Math.random).slice(0, 4).flatMap(c=>M.cl[c].sq.map(id=>M.P[id]).filter(p=>p && Math.abs(mgOvr(p) - lv)<=4 && p.age<=29));
  const all = pool.concat(extra);
  if (all.length){ const p = all[Math.floor(Math.random()*all.length)]; p.dd = {d:M.day, f:.72};
    M.kn[p.id] = Math.max(M.kn[p.id] || 0, 70);
    mgMail("transfer", `Deadline day: ${p.club} will sell ${p.n}`, `${p.club} need to raise money before the window shuts and will let ${p.n} (${p.pos}, ${p.age}) go for ${mgMoney(mgAsk(p))} today only: well under their usual price.`, {act:{type:"player", id:p.id}});
    notes.push(`${p.club} will sell ${p.n} for ${mgMoney(mgAsk(p))}, today only.`); }
  mgMail("transfer", "Deadline day", `The window shuts tonight. ${notes.length ? notes.join(" ") : "It's quiet so far."} Any business has to be done today.`, {stop:1});
}
if (typeof mgAsk==="function"){ const mgAsk0 = mgAsk; mgAsk = function(p){ const a = mgAsk0(p); return p && p.dd && p.dd.d>=M.day && a ? mgRoundFee(a*p.dd.f) : a; }; }

/* ================= 6. ONE WORLD ================= */
// the players you've made in Player Career, as this world would know them
let MGW = null;
function mgwLoad(){
  if (MGW) return MGW; MGW = [];
  try{ const S = [1, 2, 3].map(i=>typeof UNI!=="undefined" ? UNI.read("player", i) : null);   // by slot, so a player keeps his place in a world whatever else is saved
    S.forEach((d, i)=>{ if (!d || !d.player || !d.club || d.phase==="retired") return;
      const v = +d.value || 3e5; MGW.push({id:"LG" + i + "_" + String(d.player.name).replace(/\W/g, ""), n:d.player.name, nat:d.player.nation || "England", pos:d.player.pos, age:d.age || 20, club:d.club, ovr:Math.round(clamp(50 + 13.5*Math.log10(Math.max(1, v/2e5)), 45, 93))}); });
  }catch(e){}
  return MGW;
}
function mgwAdd(club, C){
  if (!C || !M) return;
  mgwLoad().forEach(L=>{ if (L.club!==club || M.P[L.id] || (M.gone && M.gone[L.id])) return;
    const pos = L.pos==="GK" || MG_W[L.pos] ? L.pos : "CM", age = clamp(L.age + (M.season - 2026), 16, 40);
    const p = mgMakePlayer(mgR(`${M.seed}|${L.id}`), {id:L.id, n:"★ " + L.n, nat:L.nat, pos, age, ovr:L.ovr, club});
    p.star = true; p.con = M.season + 2; p.wage = mgRoundWage((MG_WAGE[mgTierOf(club)] || 2000)*Math.exp((L.ovr - mgLevel(club))/9)); p.num = 0;
    M.P[p.id] = p; C.sq.push(p.id); if (M._lv) M._lv = null;
  });
}
if (typeof mgMaterialize==="function"){ const mgMat0 = mgMaterialize; mgMaterialize = function(club){ const C = mgMat0(club); try{ mgwAdd(club, C || M.cl[club]); }catch(e){} return C; }; }
// a retired player goes into management: his name, a head start in reputation, and a welcome at his old clubs
function mgwFromPlayer(d){
  const H = d.history || [], apps = H.reduce((s, h)=>s + ((h.tot && h.tot.apps) || 0), 0), tro = (d.trophies || []).length, top = H.some(h=>TIERS[keyOf(h.tier)] && TIERS[keyOf(h.tier)].level===1);
  return {name:d.player.name, nat:d.player.nation || "England", age:clamp((d.age || 36) + 1, 30, 60), rep:Math.round(clamp(40 + apps/40 + tro*2.5 + (top ? 6 : 0), 40, 72)), ex:[...new Set(H.map(h=>h.club))]};
}
function mgwApply(){
  const X = typeof MG_NEW!=="undefined" && MG_NEW && MG_NEW.ex ? MG_NEW : null; if (!X) return;
  M.mgr.rep = X.exRep; M.mgr.ex = X.ex; M.mgr.was = "player";
  // his playing career and this world are one universe from the start
  if (X.pslot && typeof UNI!=="undefined"){ M.uni = {slot:X.pslot}; try{ const d = UNI.read("player", X.pslot); if (d){ d.uni = {mode:M.role==="dof" ? "dof" : "manager", slot:MG_SLOT}; localStorage.setItem(UNI.key("player", X.pslot), JSON.stringify(d)); } }catch(e){} }
}

/* ================= 7. A WORLD THAT MOVES WITHOUT YOU =================
   Week by week, in the news: clubs in your league on a winning run or in freefall, and now and then a takeover that
   lifts a club's standing and strength for good. */
function mgwEvents(){
  if (!M.club || M.phase!=="season") return;
  const t = mgLeagueOf(), seen = (M._runs ||= {}), tb = mgTable(t);
  tb.forEach((r, i)=>{ if (r.n===M.club || !r.form || r.form.length<5) return;
    const f = r.form.slice(-5), k = /^W{5}$/.test(f) ? "W" : /^L{5}$/.test(f) ? "L" : "";
    if (!k){ if (seen[r.n] && !f.endsWith(seen[r.n].k)) delete seen[r.n]; return; }
    if (seen[r.n] && seen[r.n].k===k) return; seen[r.n] = {k, d:M.day};
    if (k==="W") mgMail("news", `${r.n} make it five wins in a row`, `${r.n} are flying: five straight league wins have taken them to ${ord(i + 1)} in the ${TIERS[t].name}.`);
    else mgMail("news", `${r.n} in freefall`, `Five league defeats in a row have left ${r.n} ${ord(i + 1)} in the ${TIERS[t].name}. The pressure on ${M.am[r.n] || "their manager"} is growing.`); });
  if (Math.random()<.012){
    const pool = MG_PLAYABLE.flatMap(k=>M.tiers[k]).filter(c=>c!==M.club && mgRep(c)<.95 && !(M._owned || {})[c]);
    if (pool.length){ const c = pool[Math.floor(Math.random()*pool.length)]; (M._owned ||= {})[c] = M.season;
      M.rep[c] = +clamp(mgRep(c) + .04, .55, 1.06).toFixed(3); if (M.vs[c]!=null) M.vs[c] = +(M.vs[c] + 2).toFixed(1); M._lv = null;
      mgMail("news", `${c} taken over`, `${c} have new owners, who have promised to invest in the squad. Expect them to be stronger from here, and busier in the transfer market.`); }
  }
}

/* ---------- clicks for everything above that lives in the manager screens ---------- */
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-mg]"); if (!b || typeof M==="undefined" || !M) return;
  const a = b.dataset.mg, v = b.dataset.v;
  if (a==="netup"){ (M.net ||= {})[v] = Math.min(3, (M.net[v] || 0) + 1); }
  else if (a==="netdown"){ if (M.net) M.net[v] = 0; }
  else if (a==="mdfiv"){ mgdInterview(+b.dataset.i); }
  else if (a==="phil"){ if (M.phase!=="season") M.phil = M.phil===v ? null : v; }
  else return;
  mgSave(); mgRender();
});
