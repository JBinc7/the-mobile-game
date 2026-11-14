/* ================= MANAGER CAREER: THE 2D MATCH =================
   The match screen's pitch (mgmatch.js runs the match; this shows it). Football Manager-style 2D: every player is a
   disc in his kit with his number, on a pitch in a floodlit ground, and the match is played out continuously.
   - Between the engine's events the ball is played about as the match is going: the side on the ball builds from
     the back, passes, dribbles, goes long, switches play and crosses; the other side presses (one or two men close
     the ball down) and wins it back with tackles and interceptions; the ball goes out for throw-ins and goal kicks.
     How far up the pitch a side gets follows how much on top it is in the engine.
   - Each side keeps its shape, which slides with the ball: higher and wider with the ball, deeper and narrower
     without it, the defensive line where the tactics put it; forwards run in behind when their side attacks.
   - The engine's events are acted out: chances (the build-up, the shooter arriving, the shot and the keeper's
     dive, the net, the post, the block), headers from crosses, penalties, corners (everyone in the box), free kicks
     (a wall when it's near goal), offsides (the flag), cards, injuries (the physio comes on), substitutions (the
     board), goals (the scorer runs to the corner, his team-mates join him) and kick-offs.
   - Distances are in metres: the pitch is 105 by 68, the home side attacks towards x = 105. On a narrow screen the
     pitch stands upright (the home side attacking up the screen), so it can be big.
   Loaded after mgmatch.js; md* functions are called from its match screen. */
const MD_L = 105, MD_W = 68;
let MD = null;
// the kits: the away side changes when its colours are too close to the home side's
function mgKits(h, a){
  const H = meta(h), A = meta(a), hk = [H.c1 || "#888", H.c2 || "#fff"];
  let ak = [A.c1 || "#888", A.c2 || "#fff"];
  if (lvNear(ak[0], hk[0])) ak = A.c2 && !lvNear(A.c2, hk[0]) ? [A.c2, A.c1] : lvLight(hk[0]) ? ["#111827", "#F8FAFC"] : ["#F8FAFC", "#111827"];
  return [hk, ak];
}
const mdOwnX = (s, X) => s ? MD_L - X : X;          // how far up the pitch, for side s
const mdWX = (s, d) => s ? MD_L - d : d;             // ...and back
const mdD = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mdR = (a, b) => a + Math.random()*(b - a);
// what gets acted out at each level of highlights
const MD_SHOW = {
  full:{shot:0, corner:1, foul:1, off:1, card:1, inj:1, sub:1, min:2.6},
  ext:{shot:.05, corner:.6, foul:.35, off:1, card:1, inj:1, sub:1, min:1.25},
  key:{shot:.15, corner:0, foul:0, off:0, card:.5, inj:0, sub:0, min:.6},
  none:{shot:9, corner:0, foul:0, off:0, card:0, inj:0, sub:0, min:.45}
};

/* ---------- setting up ---------- */
function mdInit(G, us){
  MD = {G, us, kits:mgKits(G.S[0].club, G.S[1].club), dots:new Map(), ball:{x:52.5, y:34, z:0, tw:null, own:null}, trail:[], q:[], cur:null, hold:.8, own:0, t:0, fx:[], chip:null, layer:null, key:"", said:-99, flip:0};
  mdSync(true);
  mdQueue(mdKickoff(0, true));
}
// the players on the pitch: new ones (substitutes) jog on from the touchline, those sent off or replaced walk off
function mdSync(first){
  const G = MD.G, seen = new Set();
  G.S.forEach((S, s)=>S.on.forEach((o, k)=>{
    if (o.off) return; seen.add(o);
    if (!MD.dots.has(o)){
      const d = {o, s, k, x:52.5, y:s ? 69.5 : -1.5, tx:52.5, ty:34, fa:s ? Math.PI : 0, jx:0, jy:0, jt:0, lock:false, sprint:0, down:0, dive:0, cel:0, lv:false};
      if (first){ const [x, y] = mdShape(d, 0); d.x = x; d.y = y; }
      MD.dots.set(o, d);
    }
  }));
  for (const [o, d] of MD.dots) if (!seen.has(o) && !d.lv){ d.lv = true; d.lock = true; d.tx = d.x; d.ty = d.y<34 ? -3 : 71; if (MD.ball.own===d) MD.ball.own = null; }
}
const mdDots = s => [...MD.dots.values()].filter(d=>!d.lv && (s==null || d.s===s));
const mdById = id => [...MD.dots.values()].find(d=>d.o.p.id===id && !d.lv) || null;
const mdGk = s => mdDots(s).find(d=>d.o.pos==="GK") || null;
function mdNearest(p, s, not){ let b = null, bd = 1e9; for (const d of mdDots(s)){ if (d===not || d.o.pos==="GK" && s!=null && !p.gkOk) continue; const v = mdD(d, p); if (v<bd){ bd = v; b = d; } } return b; }

/* ---------- where everyone wants to be ---------- */
// a player's place in his side's shape: the shape slides with the ball, higher and wider with it
function mdShape(d, ps){
  const s = d.s, o = d.o, B = MD.ball, S = MD.G.S[s], poss = ps===s, bx = mdOwnX(s, B.x), line = S.tac.line ?? 1;
  let def, att;
  if (poss){ def = clamp(bx - 34 + line*4, 12, 56); att = clamp(bx + 22, 38, 93); }
  else { def = clamp(bx - 24 + (line - 1)*6, 8, 46); att = clamp(bx + 6 + (S.tac.press===2 ? 8 : 0), 26, 70); }
  if (o.pos==="GK") return [mdWX(s, poss ? clamp(def - 20, 3, 14) : clamp(def - 16, 2.5, 7)), 34 + (B.y - 34)*.12];
  const dn = clamp((o.y - .15)/(.84 - .15), 0, 1);
  let depth = def + dn*(att - def);
  // forwards run in behind when their side is going forward
  if (poss && bx>48 && ["ST","LW","RW","CAM"].includes(o.pos)) depth = Math.min(depth + 7, mdLastLine(1 - s) - .6);
  const across = s ? 1 - o.x : o.x, wm = poss ? 50 + (S.tac.width ?? 1)*7 : 38;
  const y = 34 + (across - .5)*wm + (B.y - 34)*(poss ? .14 : .3);
  return [mdWX(s, clamp(depth, 2, 103)), clamp(y, 2, 66)];
}
// the deepest outfield man of side s, as distance up the pitch for the other side (the offside line)
function mdLastLine(s){ let m = 0; for (const d of mdDots(s)) if (d.o.pos!=="GK") m = Math.max(m, mdOwnX(1 - s, d.x)); return m || 80; }
function mdTargets(dt){
  const B = MD.ball, own = B.own, ps = own ? own.s : MD.own, opp = 1 - ps;
  const nPress = MD.G.S[opp].tac.press===2 ? 2 : 1;
  const press = own && !MD.cur?.still ? mdDots(opp).filter(d=>d.o.pos!=="GK" && !d.lock).sort((a, b)=>mdD(a, B) - mdD(b, B)).slice(0, nPress) : [];
  for (const d of MD.dots.values()){
    if ((d.jt -= dt)<=0){ d.jt = mdR(1.5, 3.5); d.jx = mdR(-3, 3); d.jy = mdR(-2.5, 2.5); }
    if (d.lock || d.lv) continue;
    if (d===own){ d.tx = d.x; d.ty = d.y; d.sprint = 0; continue; }
    if (press.includes(d) && mdD(d, B)<24){ const k = 1.7/Math.max(1.7, mdD(d, B)); d.tx = B.x + (d.x - B.x)*k; d.ty = B.y + (d.y - B.y)*k; d.sprint = 1; continue; }
    const [x, y] = mdShape(d, ps); d.tx = clamp(x + d.jx, 1, 104); d.ty = clamp(y + d.jy, 1, 67); d.sprint = 0;
  }
}
function mdMove(dt){
  for (const [o, d] of MD.dots){
    if (d.down>0){ d.down -= dt; continue; }
    if (d.dive>0) d.dive -= dt;
    if (d.cel>0) d.cel -= dt;
    const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
    if (dist<.05){ if (d.lv) MD.dots.delete(o); continue; }
    const top = (d.dive>0 ? 9 : d.sprint || dist>10 ? 7.2 : dist>3 ? 4.6 : 2.4)*(d.lv ? .55 : 1)*(.78 + .22*(o.cond ?? 90)/100);
    const step = Math.min(dist, top*dt);
    d.x += dx/dist*step; d.y += dy/dist*step;
    if (dist>.3) d.fa = Math.atan2(dy, dx);
  }
}

/* ---------- the ball ---------- */
function mdBall(dt){
  const B = MD.ball;
  if (B.tw){
    const T = B.tw; T.t += dt; const k = Math.min(1, T.t/T.d), e = T.h ? k : 1 - (1 - k)*(1 - k)*.6 - .4*(1 - k);
    B.x = T.fx + (T.tx - T.fx)*e; B.y = T.fy + (T.ty - T.fy)*e; B.z = T.h ? Math.sin(k*Math.PI)*T.h : 0;
    if (k>=1){ B.tw = null; if (T.to){ B.own = T.to; MD.own = T.to.s; } if (T.end) T.end(); }
  } else if (B.own){
    const d = B.own, f = Math.min(1, dt*12);
    B.x += (d.x + Math.cos(d.fa)*.8 - B.x)*f; B.y += (d.y + Math.sin(d.fa)*.8 - B.y)*f; B.z = 0;
  }
}
// strike the ball to a point (or a team-mate); returns how long it takes
function mdKick(tx, ty, o = {}){
  const B = MD.ball, dist = Math.hypot(tx - B.x, ty - B.y), d = o.d ?? Math.max(.22, dist/(o.v || (o.h ? 19 : 16)) + .08);
  B.tw = {fx:B.x, fy:B.y, tx, ty, t:0, d, h:o.h || 0, to:o.to || null, end:o.end};
  B.own = null;
  if (o.sound!==false && typeof SND!=="undefined" && dist>18 && LV && LV.speed<=2) SND.kick(.25 + Math.min(.45, dist/90));
  return d;
}
const mdPassTo = (d, o = {}) => mdKick(d.tx*.35 + d.x*.65, d.ty*.35 + d.y*.65, {...o, to:d});

/* ---------- scripts: little sequences acted out one step at a time ---------- */
// steps are {d: seconds, go(): runs at the start and may return a duration, wait(): hold until true}
const mdS = (steps, o = {}) => ({steps, i:0, t:0, locks:[], ...o});
function mdQueue(S){ if (!S) return; if (MD.cur && MD.cur.amb) mdEnd(MD.cur); MD.q.push(S); }
function mdLock(S, d, x, y, sprint){ if (!d) return; d.lock = true; d.tx = clamp(x, -2, 107); d.ty = clamp(y, -2, 70); d.sprint = sprint ? 1 : 0; if (!S.locks.includes(d)) S.locks.push(d); }
function mdEnd(S){ S.locks.forEach(d=>{ if (!d.lv) d.lock = false; }); if (MD.cur===S) MD.cur = null; if (S.done) S.done(); }
function mdRun(dt){
  if (!MD.cur){
    if (MD.q.length) MD.cur = MD.q.shift();
    else { if (LV && LV.G.done) return; MD.hold -= dt; if (MD.hold>0) return; MD.cur = mdAmbient(); MD.hold = mdR(.15, .55)*(MD.G.S[MD.own].tac.tempo===2 ? .7 : MD.G.S[MD.own].tac.tempo===0 ? 1.4 : 1); if (!MD.cur) return; }
  }
  const S = MD.cur, st = S.steps[S.i];
  if (!st){ mdEnd(S); return; }
  if (!st.on){ st.on = true; S.t = 0; const r = st.go ? st.go(S) : null; if (typeof r==="number") st.d = r + (st.pad || 0); }
  if (st.wait && !st.wait()) return;
  S.t += dt;
  if (S.t>=(st.d || 0)){ S.i++; if (S.i>=S.steps.length) mdEnd(S); }
}
const mdBusy = () => !!(MD && (MD.q.length || (MD.cur && !MD.cur.amb)));
const mdWaitBall = () => ({d:0, wait:()=>!MD.ball.tw});
function mdChip(t, s, dur = 1.8){ MD.chip = {t, s, until:MD.t + dur}; }
function mdFx(o){ MD.fx.push({...o, t0:MD.t}); }
function mdSay(txt, s){ if (!LV || LV.hl==="key" || LV.hl==="none" || MD.G.min - MD.said<4) return; MD.said = MD.G.min; mmFeed({m:MD.G.min, s, k:"play", txt}); }
const mdName = d => mgShort(d.o.p.n);

/* ---------- open play ---------- */
function mdAmbient(){
  const B = MD.ball, own = B.own, G = MD.G;
  if (B.tw) return null;
  if (!own){ const d = mdNearest(B, null); if (!d) return null; return mdS([{go:()=>{ B.own = d; MD.own = d.s; }, d:.1}], {amb:true}); }
  const s = own.s, bx = mdOwnX(s, own.x), zone = bx<35 ? 0 : bx<70 ? 1 : 2;
  const la = mmLam(G, s), lb = mmLam(G, 1 - s), dom = la/(la + lb), T = G.S[s].tac;
  if (own.o.pos==="GK") return mdGkBall(own);
  const lose = (G.side!=null && G.side!==s ? .32 : 0) + [.05, .11, .2][zone]*(1.45 - dom);
  if (Math.random()<lose) return mdLose(own, zone);
  if (zone===2){
    if ((own.y<16 || own.y>52) && Math.random()<.45) return mdCross(own);
    if (Math.random()<.08) return mdOut(own);
  }
  if (Math.random()<(zone===0 ? .1 : .13) + (T.pass===2 ? .12 : T.pass===0 ? -.06 : 0)) return mdLong(own);
  if (zone<2 && Math.random()<.08) return mdSwitch(own);
  if (Math.random()<.2) return mdCarry(own);
  return mdPass(own, zone, dom);
}
function mdPass(own, zone, dom){
  const s = own.s, mates = mdDots(s).filter(d=>d!==own && (d.o.pos!=="GK" || zone===0 && Math.random()<.15));
  if (!mates.length) return null;
  const fwd = Math.random()<.32 + dom*.42, ox = mdOwnX(s, own.x);
  const opp = mdDots(1 - s);
  const pick = mmPick(mates, d=>{ const gain = mdOwnX(s, d.x) - ox, dist = mdD(d, own), open = Math.min(...opp.map(o=>mdD(o, d)), 20);
    return (dist<4 || dist>38 ? .05 : 1)*(fwd ? (gain>2 ? 1 + gain/10 : .25) : (gain<6 ? 1 : .3))*(.4 + open/8); });
  // a pass through a crowded lane can be cut out
  const cut = opp.filter(o=>mdSegD(o, own, pick)<2.2 && mdOwnX(s, o.x)>ox - 1).sort((a, b)=>mdD(a, own) - mdD(b, own))[0];
  if (cut && Math.random()<.35) return mdS([{go:()=>{ mdKick(cut.x, cut.y, {to:cut}); mdSay(`${mdName(cut)} reads it and intercepts.`, cut.s); }}, mdWaitBall(), {d:.15}], {amb:true});
  return mdS([{go:()=>mdPassTo(pick)}, mdWaitBall(), {d:.05}], {amb:true});
}
function mdSegD(p, a, b){ const vx = b.x - a.x, vy = b.y - a.y, l = vx*vx + vy*vy || 1, t = clamp(((p.x - a.x)*vx + (p.y - a.y)*vy)/l, 0, 1); return Math.hypot(p.x - a.x - t*vx, p.y - a.y - t*vy); }
function mdCarry(own){
  const s = own.s, dir = s ? -1 : 1, dx = mdR(6, 13)*dir, dy = mdR(-5, 5) + (34 - own.y)*.08;
  const S = mdS([], {amb:true});
  S.steps = [{go:()=>{ mdLock(S, own, own.x + dx, own.y + dy, true); return Math.hypot(dx, dy)/6.4; }}, {d:.05, go:()=>{ if (Math.random()<.15) mdSay(`${mdName(own)} drives forward.`, s); }}];
  return S;
}
function mdLong(own){
  const s = own.s, fw = mdDots(s).filter(d=>["ST","LW","RW","CAM"].includes(d.o.pos)).sort((a, b)=>mdOwnX(s, b.x) - mdOwnX(s, a.x))[0];
  if (!fw) return mdPass(own, 1, .5);
  const tx = mdWX(s, Math.min(mdOwnX(s, fw.x) + 6, 96)), ty = clamp(fw.y + mdR(-6, 6), 6, 62);
  const S = mdS([], {amb:true});
  S.steps = [{go:()=>{ mdLock(S, fw, tx, ty, true); const def = mdNearest({x:tx, y:ty}, 1 - s); if (def) mdLock(S, def, tx + (s ? 1.5 : -1.5)*0, ty + .8, true);
      if (Math.random()<.3) mdSay(`${mdName(own)} goes long, looking for ${mdName(fw)}.`, s); return mdKick(tx, ty, {h:mdR(6, 10)}); }},
    {d:.05, go:()=>{ const def = mdNearest(MD.ball, 1 - s); const win = Math.random()<.5 + (MD.G.side===s ? .15 : -.15) ? fw : def || fw; MD.ball.own = win; MD.own = win.s; win.cel = 0; }},
    {d:.2}];
  return S;
}
function mdSwitch(own){
  const s = own.s, far = mdDots(s).filter(d=>d.o.pos!=="GK" && Math.abs(d.y - own.y)>26).sort((a, b)=>mdOwnX(s, b.x) - mdOwnX(s, a.x))[0];
  if (!far) return mdPass(own, 1, .5);
  return mdS([{go:()=>{ if (Math.random()<.35) mdSay(`${mdName(own)} switches the play.`, s); return mdPassTo(far, {h:4}); }}, mdWaitBall(), {d:.1}], {amb:true});
}
function mdCross(own){
  const s = own.s, gx = s ? 0 : MD_L, tx = mdWX(s, MD_L - mdR(6, 13)), ty = mdR(27, 41);
  const atk = mdDots(s).filter(d=>["ST","CAM","LW","RW","CM"].includes(d.o.pos)).slice(0, 3), dfs = mdDots(1 - s).filter(d=>MG_GROUP(d.o.pos)==="DEF" && d.o.pos!=="GK").slice(0, 3);
  const S = mdS([], {amb:true});
  S.steps = [{go:()=>{ atk.forEach((d, i)=>mdLock(S, d, mdWX(s, MD_L - mdR(6, 13)), 28 + i*6 + mdR(-2, 2), true)); dfs.forEach((d, i)=>mdLock(S, d, mdWX(s, MD_L - mdR(5, 9)), 29 + i*5, true)); return .5; }},
    {go:()=>mdKick(tx, ty, {h:mdR(5, 8)})},
    {go:()=>{ const gk = mdGk(1 - s), d = mdNearest(MD.ball, 1 - s);
      if (gk && Math.random()<.25){ MD.ball.own = gk; MD.own = 1 - s; mdSay(`${mdName(gk)} comes and claims the cross.`, 1 - s); return .3; }
      if (d){ mdSay(`${mdName(own)}'s cross is headed clear.`, s); return mdKick(mdWX(s, MD_L - mdR(24, 34)), clamp(MD.ball.y + mdR(-14, 14), 6, 62), {h:mdR(3, 6), to:mdNearest({x:mdWX(s, MD_L - 30), y:34}, null)}); } return .2; }},
    mdWaitBall(), {d:.1}];
  return S;
}
function mdLose(own, zone){
  const s = own.s, t = mdNearest(own, 1 - s);
  if (!t) return null;
  if (Math.random()<.2 && (own.y<12 || own.y>56)) return mdThrowOut(own);
  const S = mdS([], {amb:true});
  S.steps = [{go:()=>{ mdLock(S, t, own.x, own.y, true); return Math.min(.9, mdD(t, own)/7 + .15); }},
    {d:.15, go:()=>{ MD.ball.own = t; MD.own = t.s; own.down = Math.random()<.15 ? .6 : 0; if (Math.random()<.25) mdSay(`Good tackle from ${mdName(t)}.`, t.s); }}];
  return S;
}
// over the touchline: a throw-in for the other side
function mdThrowOut(own){
  const s = own.s, side = own.y<34 ? -.8 : 68.8, x = clamp(own.x + (s ? -6 : 6), 4, 101);
  const S = mdS([], {amb:true});
  S.steps = [{go:()=>mdKick(x, side, {d:.5})},
    {go:()=>{ const tk = mdNearest({x, y:side}, 1 - s); if (!tk) return 0; mdLock(S, tk, x, side, true); S.tk = tk; return Math.min(2, mdD(tk, {x, y:side})/6 + .3); }},
    {d:.5, go:()=>{ if (S.tk){ MD.ball.own = S.tk; MD.own = S.tk.s; } }},
    {go:()=>{ const to = mdNearest({x:x, y:side<0 ? 12 : 56}, 1 - s, S.tk); return to ? mdPassTo(to, {h:2}) : .1; }}, mdWaitBall()];
  return S;
}
// over the goal line: a goal kick
function mdOut(own){
  const s = own.s, gx = s ? -1 : 106, y = own.y<34 ? mdR(18, 28) : mdR(40, 50);
  return mdS([{go:()=>mdKick(gx, y, {})}, mdWaitBall(), {d:.2, go:()=>{ MD.own = 1 - s; }}, ...mdGoalKick(1 - s).steps], {amb:true});
}
function mdGoalKick(s){
  const gk = mdGk(s), x = mdWX(s, 5.5), y = Math.random()<.5 ? 29 : 39, S = mdS([], {amb:true});
  S.steps = [{go:()=>{ MD.ball.tw = null; MD.ball.own = null; MD.ball.x = x; MD.ball.y = y; if (gk) mdLock(S, gk, x - (s ? -1 : 1)*1.2, y, false); return 1.1; }},
    {go:()=>{ if (gk){ MD.ball.own = gk; MD.own = s; } return .2; }},
    {go:()=>{ MD.ball.own = null; const tx = mdWX(s, mdR(48, 64)), ty = mdR(14, 54); return mdKick(tx, ty, {h:mdR(10, 15), to:mdNearest({x:tx, y:ty}, null)}); }}, mdWaitBall()];
  return S;
}
function mdGkBall(gk){
  const s = gk.s, S = mdS([], {amb:true});
  S.steps = [{d:mdR(.5, 1.1)}, {go:()=>{
    if (Math.random()<.55){ const tx = mdWX(s, mdR(50, 66)), ty = mdR(12, 56); if (Math.random()<.2) mdSay(`${mdName(gk)} launches it upfield.`, s); return mdKick(tx, ty, {h:mdR(11, 16), to:mdNearest({x:tx, y:ty}, null)}); }
    const cb = mdDots(s).filter(d=>MG_GROUP(d.o.pos)==="DEF" && d.o.pos!=="GK")[Math.floor(Math.random()*3)] || mdNearest(gk, s, gk); return cb ? mdPassTo(cb) : .2; }}, mdWaitBall()];
  return S;
}

/* ---------- restarts ---------- */
// the shape for a kick-off: everyone in his own half, the ball on the centre spot
function mdKickoff(side, instant){
  const S = mdS([], {kick:true});
  S.steps = [{go:()=>{
      const B = MD.ball; B.tw = null; B.own = null; B.x = 52.5; B.y = 34; B.z = 0; MD.own = side;
      for (const d of mdDots()){ let [x, y] = mdShape(d, -1); x = d.s ? Math.max(x, 54) : Math.min(x, 51); if (instant){ d.x = x; d.y = y; } mdLock(S, d, x, y, false); }
      const ks = mdDots(side).filter(d=>["ST","CAM","CM"].includes(d.o.pos)).slice(0, 2);
      ks.forEach((d, i)=>mdLock(S, d, 52.5 + (side ? 1 : -1)*(i ? 4 : .8), 34 + (i ? 3 : 0), false));
      S.k = ks[0]; return instant ? .9 : 2.4; }},
    {d:.3, go:()=>{ if (S.k){ MD.ball.own = S.k; } if (typeof SND!=="undefined" && LV && LV.speed<=2) SND.whistle(.35, 1); }},
    {go:()=>{ const mid = mdDots(side).filter(d=>["CM","CDM"].includes(d.o.pos))[0] || mdNearest({x:mdWX(side, 40), y:34}, side, S.k); return mid ? mdPassTo(mid) : .2; }}, mdWaitBall()];
  return S;
}

/* ---------- the engine's events, acted out ---------- */
// returns true when the event will reach the screen through its script (at the right moment), false to show it now
function mdEvent(e){
  if (!MD || !LV) return false;
  const lv = MD_SHOW[LV.hl] || MD_SHOW.ext;
  if (["goal","save","post","miss","block"].includes(e.k)){ if (e.k!=="goal" && (e.xg || 0)<lv.shot && e.kind!=="pen") return false; if (LV.hl==="none") return false; return mdQueue(mdShot(e)), true; }
  if (e.k==="corner"){ if (Math.random()>=lv.corner) return false; mdQueue(mdCorner(e)); return true; }
  if (e.k==="foul" || e.k==="yellow" || e.k==="red"){ const card = e.k!=="foul"; if (Math.random()>=(card ? lv.card : lv.foul)) return false; mdQueue(mdFoul(e)); return true; }
  if (e.k==="off"){ if (!lv.off) return false; mdQueue(mdOffside(e)); return true; }
  if (e.k==="inj"){ if (!lv.inj) return false; mdQueue(mdInjury(e)); return true; }
  if (e.k==="sub"){ if (lv.sub) mdQueue(mdSubBoard(e)); return false; }
  if (e.k==="ht" || e.k==="et"){ mdQueue(mdS([{go:()=>{ mmShow(e); mdChip(e.k==="ht" ? "HALF-TIME" : "EXTRA TIME", -1, 2.4); for (const d of mdDots()) d.sprint = 0; return 1.6; }}])); if (e.k==="et") mdQueue(mdKickoff(0)); return true; }
  if (e.k==="ko" && e.m===45){ mdQueue(mdKickoff(1)); return false; }
  if (e.k==="ft" || e.k==="pens"){ mdQueue(mdS([{go:()=>{ mmShow(e); mdChip(e.k==="ft" ? "FULL-TIME" : "PENALTIES", -1, 3); MD.ball.tw = null; MD.ball.own = null; return 1.2; }}])); return true; }
  return false;
}
function mdShot(e){
  const s = e.s, S = mdS([]), gx = s ? 0 : MD_L, fwd = s ? -1 : 1;
  const sh = mdById(e.p), gk = mdGk(1 - s);
  if (!sh){ return mdS([{go:()=>{ mmShow(e); return .3; }}]); }
  if (e.kind==="pen") return mdPenalty(e, sh, gk);
  const big = e.kind==="big", good = e.kind==="good";
  const sx = mdWX(s, MD_L - (big ? mdR(7, 12) : good ? mdR(11, 17) : e.head ? mdR(6, 10) : mdR(17, 28)));
  const sy = e.head ? mdR(29, 39) : clamp(sh.y*.45 + mdR(24, 44)*.55, 12, 56);
  const ty = e.k==="goal" ? mdR(30.9, 37.1) : e.k==="post" ? (Math.random()<.5 ? 30.34 : 37.66) : e.k==="miss" ? (Math.random()<.5 ? mdR(26, 29.6) : mdR(38.4, 42)) : mdR(31, 37);
  const opp = mdDots(1 - s).filter(d=>d.o.pos!=="GK"), blocker = opp.slice().sort((a, b)=>Math.hypot(a.x - sx, a.y - sy) - Math.hypot(b.x - sx, b.y - sy))[0];
  S.steps.push(mdWaitBall());
  // win the ball first if the other side has it
  S.steps.push({go:()=>{ const B = MD.ball; if (B.own && B.own.s===s) return 0; const m = mdNearest(B, s); if (!m) return 0; B.own = null; return mdKick(m.x, m.y, {to:m, d:.35}); }}, mdWaitBall());
  if (e.head){
    // from a cross: a wide man gets it near the byline, the shooter attacks the ball
    S.steps.push({go:()=>{
      const wy = sh.y<34 ? mdR(56, 63) : mdR(5, 12), wide = mdDots(s).filter(d=>d!==sh && d.o.pos!=="GK").sort((a, b)=>Math.abs(a.y - wy) - Math.abs(b.y - wy))[0] || MD.ball.own;
      S.w = wide; const wx = mdWX(s, MD_L - mdR(8, 16)); mdLock(S, wide, wx, wy, true); mdLock(S, sh, mdWX(s, MD_L - 17), sy, true);
      if (blocker) mdLock(S, blocker, mdWX(s, MD_L - 8), sy + 1.5, true); if (gk) mdLock(S, gk, mdWX(s, MD_L - 1.5), 34, false);
      if (MD.ball.own===wide) return .5; MD.ball.own = null; return mdKick(wx, wy, {to:wide, v:20}); }}, mdWaitBall(),
      {go:()=>{ mdLock(S, sh, sx, sy, true); return .25; }},
      {go:()=>mdKick(sx, sy, {h:mdR(5, 8), v:22})});
  } else {
    S.steps.push({go:()=>{
      const own = MD.ball.own; mdLock(S, sh, sx, sy, true); if (gk) mdLock(S, gk, mdWX(s, MD_L - (big ? 5 : 2)), 34 + (sy - 34)*.2, false);
      if (blocker && e.k==="block") mdLock(S, blocker, sx + fwd*mdR(2, 3), sy + mdR(-1, 1), true);
      else if (blocker) mdLock(S, blocker, sx + fwd*mdR(2.5, 5), sy + mdR(-4, 4), true);
      if (!own || own===sh) return Math.max(.6, mdD(sh, {x:sx, y:sy})/6.8);
      // the pass into him as he arrives
      const d = mdD(own, {x:sx, y:sy}); if (Math.random()<.4 && e.a) mmFeed({m:MD.G.min, s, k:"play", txt:`${mgShort(e.a)} looks for ${mgShort(e.n)}...`});
      return mdKick(sx - fwd*.8, sy, {to:sh, v:d>25 ? 20 : 16, h:d>28 ? 3 : 0}); }}, mdWaitBall(),
      {go:()=>{ MD.ball.own = sh; return .2; }});
  }
  // the shot
  S.steps.push({go:()=>{
    MD.ball.own = null; sh.lock = true;
    const k = e.k, B = MD.ball;
    if (typeof SND!=="undefined" && LV.speed<=4) SND.kick(.85);
    if (k==="block" && blocker) return mdKick(blocker.x, blocker.y, {d:.18});
    if (k==="save" && gk){ const sy2 = ty, gx2 = gx - fwd*1.2; gk.dive = .6; mdLock(S, gk, gx2, sy2, true); gk.x += (gx2 - gk.x)*.4; return mdKick(gx2 - fwd*.4, sy2, {v:30, h:e.head ? 1.5 : 0}); }
    if (k==="miss") return mdKick(gx + fwd*3, ty, {v:28, h:Math.random()<.5 ? 3.5 : .6});
    if (k==="post") return mdKick(gx, ty, {v:30});
    if (gk && Math.random()<.6){ gk.dive = .5; mdLock(S, gk, gx - fwd*1.4, 34 + (ty - 34)*.55, true); }
    return mdKick(gx + fwd*1.6, ty, {v:30, h:e.head ? 1.2 : .4}); }});
  // what happens next
  S.steps.push({go:()=>{
    mmShow(e);
    if (e.k==="goal"){ MD.net = {s, t:MD.t, y:ty}; return 0; }
    if (e.k==="post"){ return mdKick(gx - fwd*mdR(8, 13), clamp(ty + (ty<34 ? -mdR(4, 10) : mdR(4, 10)), 8, 60), {to:mdNearest({x:gx - fwd*10, y:ty}, null)}); }
    if (e.k==="save" && gk){ if (Math.random()<.6){ MD.ball.own = gk; MD.own = 1 - s; } else return mdKick(gx - fwd*1, ty<34 ? mdR(10, 20) : mdR(48, 58), {d:.35}); return .2; }
    if (e.k==="block"){ return mdKick(MD.ball.x - fwd*mdR(5, 12), clamp(MD.ball.y + mdR(-10, 10), 6, 62), {to:mdNearest({x:MD.ball.x - fwd*8, y:MD.ball.y}, null)}); }
    return .1; }}, mdWaitBall());
  if (e.k==="goal"){
    // the scorer heads for the corner flag, his team-mates follow; then back for the kick-off
    S.steps.push({go:()=>{ const fy = sh.y<34 ? 1 : 67, fx = gx - fwd*1; mdLock(S, sh, fx, fy, true); sh.cel = 3;
      mdDots(s).filter(d=>d!==sh && d.o.pos!=="GK").forEach((d, i)=>{ if (i<6) mdLock(S, d, fx - fwd*mdR(2, 6), fy + (fy<34 ? 1 : -1)*mdR(1, 6), true); });
      return LV.hl==="key" ? 1.4 : 2.6; }});
    S.steps.push({go:()=>{ mdEnd(S); mdQueue(mdKickoff(1 - s)); return 0; }});
  } else if (e.k==="miss"){ S.steps.push({d:.4}, ...mdGoalKick(1 - s).steps); }
  else S.steps.push({d:.3});
  return S;
}
function mdPenalty(e, sh, gk){
  const s = e.s, gx = s ? 0 : MD_L, fwd = s ? -1 : 1, spot = mdWX(s, MD_L - 11), S = mdS([]);
  const ty = e.k==="goal" ? (Math.random()<.5 ? mdR(31, 32.5) : mdR(35.5, 37)) : e.k==="save" ? mdR(31.5, 36.5) : (Math.random()<.5 ? mdR(27, 29.5) : mdR(38.5, 41));
  S.steps = [mdWaitBall(), {go:()=>{
      mdChip("PENALTY!", s, 2.4); if (typeof SND!=="undefined") SND.whistle(.6, 1);
      const B = MD.ball; B.tw = null; B.own = null; B.x = spot; B.y = 34;
      for (const d of mdDots()){ if (d===sh || d===gk) continue; mdLock(S, d, mdWX(s, MD_L - mdR(19, 26)), mdR(14, 54), false); }
      mdLock(S, sh, spot - fwd*2.2, 34.5, false); if (gk) mdLock(S, gk, gx - fwd*.6, 34, false); return 2.2; }},
    {go:()=>{ mdLock(S, sh, spot - fwd*.6, 34, true); return .45; }},
    {go:()=>{ if (typeof SND!=="undefined") SND.kick(.9); if (gk){ gk.dive = .6; mdLock(S, gk, gx - fwd*.8, e.k==="save" ? ty : (ty<34 ? 37 : 31), true); }
      return mdKick(e.k==="save" ? gx - fwd*1.2 : gx + fwd*1.6, ty, {v:30, h:e.k==="miss" ? 2.6 : .5}); }},
    {go:()=>{ mmShow(e); if (e.k==="goal") MD.net = {s, t:MD.t, y:ty}; else if (e.k==="save" && gk){ MD.ball.own = gk; MD.own = 1 - s; } return e.k==="goal" ? 1.6 : .8; }}];
  if (e.k==="goal") S.steps.push({go:()=>{ mdEnd(S); mdQueue(mdKickoff(1 - s)); return 0; }});
  else if (e.k==="miss") S.steps.push(...mdGoalKick(1 - s).steps);
  return S;
}
function mdCorner(e){
  const s = e.s, gx = s ? 0 : MD_L, fwd = s ? -1 : 1, fy = MD.ball.y<34 ? .4 : 67.6, S = mdS([]);
  S.steps = [mdWaitBall(), {go:()=>{
      mdChip("CORNER", s); mmShow(e);
      const B = MD.ball; B.own = null; return mdKick(gx, fy, {d:.4}); }},
    {go:()=>{
      const tk = mdDots(s).filter(d=>["LW","RW","LM","RM","CM","CAM"].includes(d.o.pos)).sort((a, b)=>Math.abs(a.y - fy) - Math.abs(b.y - fy))[0] || mdNearest({x:gx, y:fy}, s);
      S.tk = tk; mdLock(S, tk, gx + fwd*.6, fy + (fy<34 ? -.6 : .6), true);
      const atk = mdDots(s).filter(d=>d!==tk && d.o.pos!=="GK" && !["LB","RB","LWB","RWB"].includes(d.o.pos)).slice(0, 6);
      atk.forEach((d, i)=>mdLock(S, d, gx - fwd*mdR(5, 14), 26 + i*3.2 + mdR(-1, 1), true));
      mdDots(1 - s).filter(d=>d.o.pos!=="GK").forEach((d, i)=>{ const m = atk[i % Math.max(1, atk.length)]; if (i<7 && m) mdLock(S, d, m.tx + fwd*.9, m.ty + .7, true); else mdLock(S, d, mdWX(s, MD_L - mdR(18, 30)), mdR(18, 50), false); });
      const gk = mdGk(1 - s); if (gk) mdLock(S, gk, gx - fwd*.8, 34, false);
      return 1.8; }},
    {go:()=>{ if (S.tk){ MD.ball.own = null; } return mdKick(gx - fwd*mdR(5, 11), mdR(29, 39), {h:mdR(6, 9), v:18}); }},
    {go:()=>{ const gk = mdGk(1 - s);
      if (gk && Math.random()<.3){ MD.ball.own = gk; MD.own = 1 - s; return .5; }
      const d = mdNearest(MD.ball, 1 - s); if (d) d.x = MD.ball.x, d.y = MD.ball.y;
      return mdKick(gx - fwd*mdR(22, 34), clamp(MD.ball.y + mdR(-16, 16), 6, 62), {h:mdR(4, 7), to:mdNearest({x:gx - fwd*28, y:34}, null)}); }}, mdWaitBall(), {d:.2}];
  return S;
}
function mdFoul(e){
  const s = e.s, f = mdById(e.p), S = mdS([]), them = 1 - s;
  S.steps = [mdWaitBall(), {go:()=>{
      const B = MD.ball, at = f ? {x:f.x, y:f.y} : {x:B.x, y:B.y}; B.tw = null; B.own = null; B.x = at.x; B.y = at.y; S.at = at;
      if (typeof SND!=="undefined" && LV.speed<=4) SND.whistle(.3, 1);
      const v = mdNearest(at, them); if (v){ v.down = .9; S.v = v; }
      mmShow(e);
      if (e.k!=="foul" && f) mdFx({k:"card", c:e.k==="red" ? "#FF2E55" : "#FFD23F", d:f, dur:2.2});
      mdChip(e.k==="red" ? "RED CARD" : e.k==="yellow" ? "YELLOW CARD" : "FREE KICK", them, 1.8);
      return 1.1; }},
    {go:()=>{
      const at = S.at, dist = mdOwnX(them, at.x), gx = them ? 0 : MD_L, fwd = them ? -1 : 1;
      const tk = S.v && !S.v.lv ? S.v : mdNearest(at, them); S.tk = tk; if (tk) mdLock(S, tk, at.x - fwd*1.2, at.y, false);
      S.near = dist>70 && Math.abs(at.y - 34)<26;
      if (S.near){
        // a wall, and bodies in the box
        const ang = Math.atan2(34 - at.y, gx - at.x), wx = at.x + Math.cos(ang)*9.2, wy = at.y + Math.sin(ang)*9.2;
        mdDots(s).filter(d=>d.o.pos!=="GK").sort((a, b)=>mdD(a, at) - mdD(b, at)).slice(0, 4).forEach((d, i)=>mdLock(S, d, wx - Math.sin(ang)*(i - 1.5)*.9, wy + Math.cos(ang)*(i - 1.5)*.9, true));
        mdDots(them).filter(d=>d!==tk && d.o.pos!=="GK").slice(0, 4).forEach((d, i)=>mdLock(S, d, gx - fwd*mdR(6, 13), 27 + i*4, true));
        const gk = mdGk(s); if (gk) mdLock(S, gk, gx + (s ? .8 : -.8), 34 + (at.y - 34)*.15, false);
        return 1.9; }
      return .8; }},
    {go:()=>{ if (S.tk){ MD.ball.own = S.tk; MD.own = them; } const gx = them ? 0 : MD_L, fwd = them ? -1 : 1;
      if (S.near){ MD.ball.own = null; return mdKick(gx - fwd*mdR(5, 10), mdR(29, 39), {h:mdR(4, 7), v:20}); }
      const to = S.tk ? mdNearest(S.tk, them, S.tk) : null; return to ? mdPassTo(to) : .2; }},
    mdWaitBall()];
  if (true) S.steps.push({go:()=>{ if (!S.near) return 0; const gx = them ? 0 : MD_L, fwd = them ? -1 : 1, gk = mdGk(s);
    if (gk && Math.random()<.35){ MD.ball.own = gk; MD.own = s; return .4; }
    return mdKick(gx - fwd*mdR(22, 32), clamp(MD.ball.y + mdR(-14, 14), 6, 62), {h:mdR(4, 7), to:mdNearest({x:gx - fwd*26, y:34}, null)}); }}, mdWaitBall());
  return S;
}
function mdOffside(e){
  const s = e.s, a = mdById(e.p), S = mdS([]);
  S.steps = [mdWaitBall(), {go:()=>{
      const at = a ? {x:a.x, y:a.y} : {x:MD.ball.x, y:MD.ball.y}; S.at = at;
      if (a) mdLock(S, a, at.x, at.y, false);
      mdFx({k:"flag", x:at.x, y:at.y<34 ? -1.6 : 69.6, dur:1.8}); mdChip("OFFSIDE", s);
      if (typeof SND!=="undefined" && LV.speed<=4) SND.whistle(.3, 1);
      mmShow(e); MD.ball.tw = null; MD.ball.own = null; MD.ball.x = at.x; MD.ball.y = at.y; return 1; }},
    {go:()=>{ const d = mdNearest(S.at, 1 - s); if (d){ mdLock(S, d, S.at.x, S.at.y, true); S.d = d; return Math.min(1.5, mdD(d, S.at)/7 + .2); } return .2; }},
    {go:()=>{ if (S.d){ MD.ball.own = S.d; MD.own = 1 - s; } const tx = mdWX(1 - s, mdR(48, 62)), ty = mdR(14, 54); MD.ball.own = null; return mdKick(tx, ty, {h:mdR(8, 12), to:mdNearest({x:tx, y:ty}, null)}); }}, mdWaitBall()];
  return S;
}
function mdInjury(e){
  const s = e.s, d = mdById(e.p), S = mdS([]);
  S.steps = [mdWaitBall(), {go:()=>{
      mmShow(e); if (!d) return .2;
      d.down = 3.2; mdChip("INJURY", s, 2.4); MD.ball.tw = null; MD.ball.own = null;
      mdFx({k:"physio", from:{x:d.x, y:d.y<34 ? -1.5 : 69.5}, to:{x:d.x, y:d.y}, dur:3.2});
      return LV.hl==="full" ? 3.2 : 2; }},
    {go:()=>{ const n = mdNearest(MD.ball, null); if (n){ MD.ball.own = n; MD.own = n.s; } return .1; }}];
  return S;
}
function mdSubBoard(e){
  const S = mdS([]);
  S.steps = [{go:()=>{ const on = mdById(e.p), off = [...MD.G.S[e.s].on, ...MD.G.S[e.s].out].find(o=>o.p.n===e.o);
    mdFx({k:"board", s:e.s, inN:on ? on.o.p.num : "", outN:off ? off.p.num : "", dur:2.4}); return .8; }}];
  return S;
}

/* ---------- each frame ---------- */
function mdUpdate(dt){
  if (!MD) return;
  MD.t += dt;
  mdSync(false);
  mdRun(dt);
  mdTargets(dt);
  mdMove(dt);
  mdBall(dt);
  MD.fx = MD.fx.filter(f=>MD.t - f.t0<f.dur);
}
// sim to the end: clear the stage
function mdStop(){ if (!MD) return; MD.q = []; MD.cur = null; for (const d of MD.dots.values()) d.lock = false; }

/* ---------- drawing ---------- */
function mdGeom(){
  const cv = document.getElementById("mmCv"); if (!cv) return null;
  const box = cv.parentElement, cw = box.clientWidth || 360, tall = cw<600, big = LV && LV.big;
  const maxH = Math.min(window.innerHeight*(big ? .78 : tall ? .56 : .62), tall ? 900 : 620);
  let w, h, m;
  if (tall){ h = maxH; m = Math.round(Math.min(cw, h)*.06); w = Math.min(cw, Math.round((h - 2*m)*MD_W/MD_L + 2*m)); h = Math.round((w - 2*m)*MD_L/MD_W + 2*m); }
  else { w = cw; m = Math.round(w*.045); h = Math.round((w - 2*m)*MD_W/MD_L + 2*m); if (h>maxH){ h = maxH; w = Math.round((h - 2*m)*MD_L/MD_W + 2*m); } }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width!==Math.round(w*dpr) || cv.height!==Math.round(h*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); cv.style.width = w + "px"; cv.style.height = h + "px"; }
  const pw = w - 2*m, ph = h - 2*m;
  const P = tall ? (x, y) => [m + y/MD_W*pw, m + (1 - x/MD_L)*ph] : (x, y) => [m + x/MD_L*pw, m + y/MD_W*ph];
  const u = tall ? pw/MD_W : pw/MD_L;   // pixels per metre
  return {cv, g:cv.getContext("2d"), w, h, m, dpr, P, u, tall};
}
function mdLayer(Q){
  const G = MD.G, key = [Q.w, Q.h, Q.dpr, Q.tall].join("|");
  if (MD.layer && MD.key===key) return MD.layer;
  const c = document.createElement("canvas"); c.width = Math.round(Q.w*Q.dpr); c.height = Math.round(Q.h*Q.dpr);
  const g = c.getContext("2d"); g.setTransform(Q.dpr, 0, 0, Q.dpr, 0, 0);
  const {w, h, m, P, u} = Q, R = mgR(`${G.f.key}|crowd`);
  // the stands: a dark bowl full of fans, more in the home colours, the away end in theirs
  g.fillStyle = "#070A12"; g.fillRect(0, 0, w, h);
  const hc = meta(G.S[0].club), ac = meta(G.S[1].club), cols = [hc.c1, hc.c1, hc.c2, "#2A3350", "#3B4566", hc.c1, "#C9D2E8"];
  for (let i = 0; i<Math.round((w + h)*3.2); i++){
    const side = Math.floor(R()*4); let x, y;
    if (side===0){ x = R()*w; y = R()*(m*.62); } else if (side===1){ x = R()*w; y = h - R()*(m*.62); } else if (side===2){ x = R()*(m*.62); y = R()*h; } else { x = w - R()*(m*.62); y = R()*h; }
    const awayEnd = Q.tall ? y<m && x>w*.55 : x>w - m && y<h*.45;
    g.fillStyle = awayEnd ? (R()<.6 ? ac.c1 : ac.c2) : cols[Math.floor(R()*cols.length)];
    g.globalAlpha = .35 + R()*.5; g.beginPath(); g.arc(x, y, .9 + R()*1.1, 0, Math.PI*2); g.fill();
  }
  g.globalAlpha = 1;
  // advertising boards round the pitch
  const [x0, y0] = Q.tall ? [m, m] : P(0, 0), pw = w - 2*m, ph = h - 2*m, bw = Math.max(3, m*.22);
  const led = g.createLinearGradient(0, 0, w, 0); led.addColorStop(0, "#00F0A8"); led.addColorStop(.5, "#00B4FF"); led.addColorStop(1, "#7C5CFF");
  g.fillStyle = "#0B1020"; g.fillRect(m - bw - 2, m - bw - 2, pw + 2*bw + 4, ph + 2*bw + 4);
  g.fillStyle = led; g.globalAlpha = .75;
  g.fillRect(m - bw - 2, m - bw - 2, pw + 2*bw + 4, bw); g.fillRect(m - bw - 2, m + ph + 2, pw + 2*bw + 4, bw);
  g.fillRect(m - bw - 2, m - 2, bw, ph + 4); g.fillRect(m + pw + 2, m - 2, bw, ph + 4);
  g.globalAlpha = 1; g.fillStyle = "rgba(5,8,16,.85)"; g.font = `800 ${Math.max(6, bw*.8)}px "Barlow Condensed", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  for (let x = m + 30; x<m + pw; x += 90){ g.fillText("PYRAMID", x, m - bw/2 - 2); g.fillText("MANAGER", x + 45, m + ph + bw/2 + 2); }
  // the grass, mown in stripes
  const stripes = 14;
  for (let i = 0; i<stripes; i++){
    const [ax, ay] = P(i*MD_L/stripes, 0), [bx, by] = P((i + 1)*MD_L/stripes, MD_W);
    g.fillStyle = i % 2 ? "#0F4F2E" : "#125A34"; g.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + .5, Math.abs(by - ay) + .5);
  }
  const vg = g.createRadialGradient(w/2, h/2, Math.min(w, h)*.2, w/2, h/2, Math.max(w, h)*.7); vg.addColorStop(0, "rgba(255,255,255,.04)"); vg.addColorStop(1, "rgba(0,0,0,.35)");
  g.fillStyle = vg; g.fillRect(m, m, pw, ph);
  // the markings
  g.strokeStyle = "rgba(235,255,245,.82)"; g.lineWidth = Math.max(1.2, u*.14); g.shadowColor = "rgba(0,240,168,.55)"; g.shadowBlur = 5;
  const line = (a, b, c, d) => { const [x1, y1] = P(a, b), [x2, y2] = P(c, d); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const rect = (a, b, c, d) => { line(a, b, c, b); line(c, b, c, d); line(c, d, a, d); line(a, d, a, b); };
  rect(0, 0, MD_L, MD_W); line(MD_L/2, 0, MD_L/2, MD_W);
  const [cx, cy] = P(MD_L/2, MD_W/2); g.beginPath(); g.arc(cx, cy, 9.15*u, 0, Math.PI*2); g.stroke();
  [[0, 1], [MD_L, -1]].forEach(([x, d])=>{
    rect(x, MD_W/2 - 20.16, x + d*16.5, MD_W/2 + 20.16); rect(x, MD_W/2 - 9.16, x + d*5.5, MD_W/2 + 9.16);
    const [sx, sy] = P(x + d*11, MD_W/2); g.beginPath(); g.arc(sx, sy, Math.max(1.5, u*.25), 0, Math.PI*2); g.fillStyle = "rgba(235,255,245,.9)"; g.fill();
    // the arc on the edge of the box
    g.beginPath(); for (let a = -1; a<=1.0001; a += .05){ const ang = a*.93, px = x + d*(11 + 9.15*Math.cos(ang)), py = MD_W/2 + 9.15*Math.sin(ang); if (d*(px - x)<16.5) continue; const [qx, qy] = P(px, py); g.lineTo(qx, qy); } g.stroke();
    // the goal and its net
    const [g1x, g1y] = P(x, MD_W/2 - 3.66), [g2x, g2y] = P(x - d*2, MD_W/2 + 3.66);
    g.save(); g.shadowBlur = 0; g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(Math.min(g1x, g2x), Math.min(g1y, g2y), Math.abs(g2x - g1x), Math.abs(g2y - g1y));
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .6; for (let k = 1; k<6; k++){ line(x, MD_W/2 - 3.66 + k*1.22, x - d*2, MD_W/2 - 3.66 + k*1.22); } g.restore();
    g.save(); g.strokeStyle = "#fff"; g.lineWidth = Math.max(1.6, u*.2); line(x, MD_W/2 - 3.66, x - d*2, MD_W/2 - 3.66); line(x - d*2, MD_W/2 - 3.66, x - d*2, MD_W/2 + 3.66); line(x - d*2, MD_W/2 + 3.66, x, MD_W/2 + 3.66); g.restore();
  });
  [[0, 0], [0, MD_W], [MD_L, 0], [MD_L, MD_W]].forEach(([x, y])=>{ const [px, py] = P(x, y); g.fillStyle = "#FF2E88"; g.fillRect(px - 1, py - 5, 2, 5); });
  g.shadowBlur = 0;
  MD.layer = c; MD.key = key; return c;
}
function mdDraw(){
  if (!MD || !LV) return;
  const Q = mdGeom(); if (!Q) return;
  const {g, w, h, dpr, P, u} = Q, G = MD.G;
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(mdLayer(Q), 0, 0);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = clamp(u*1.35, 6.5, 12), B = MD.ball;
  // the net bulging after a goal
  if (MD.net && MD.t - MD.net.t<1.4){ const n = MD.net, gx = n.s ? 0 : MD_L, d = n.s ? -1 : 1, k = 1 - (MD.t - n.t)/1.4;
    g.save(); g.strokeStyle = `rgba(255,255,255,${(.8*k).toFixed(2)})`; g.lineWidth = 1.2; g.shadowColor = "#00F0A8"; g.shadowBlur = 10*k;
    g.beginPath(); for (let i = 0; i<=10; i++){ const yy = MD_W/2 - 3.66 + i*.732, bulge = Math.sin(i/10*Math.PI)*1.6*k; const [px, py] = P(gx + d*(2 + bulge), yy); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore(); }
  // the physio running on
  MD.fx.forEach(f=>{ if (f.k!=="physio") return; const k = (MD.t - f.t0)/f.dur, kk = k<.35 ? k/.35 : k>.75 ? 1 - (k - .75)/.25 : 1; const [px, py] = P(f.from.x + (f.to.x - f.from.x)*kk, f.from.y + (f.to.y - f.from.y)*kk*.92);
    g.beginPath(); g.arc(px, py, r*.7, 0, Math.PI*2); g.fillStyle = "#F8FAFC"; g.fill(); g.fillStyle = "#E11D48"; g.fillRect(px - r*.4, py - r*.12, r*.8, r*.24); g.fillRect(px - r*.12, py - r*.4, r*.24, r*.8); });
  // shadows first, then the players
  const dots = [...MD.dots.values()];
  dots.forEach(d=>{ const [x, y] = P(d.x, d.y); g.beginPath(); g.ellipse(x + r*.25, y + r*.7, r*.95, r*.38, 0, 0, Math.PI*2); g.fillStyle = "rgba(0,0,0,.32)"; g.fill(); });
  const holder = B.own;
  dots.forEach(d=>{
    const [x, y] = P(d.x, d.y), K = MD.kits[d.s], gk = d.o.pos==="GK", c1 = gk ? (d.s ? "#F59E0B" : "#A3E635") : K[0], c2 = gk ? "#111" : (lvNear(K[0], K[1]) ? (lvLight(K[0]) ? "#111" : "#fff") : K[1]);
    g.save(); g.globalAlpha = d.lv ? .5 : 1;
    if (d.cel>0){ g.beginPath(); g.arc(x, y, r*(1.6 + .3*Math.sin(MD.t*12)), 0, Math.PI*2); g.fillStyle = "rgba(0,240,168,.22)"; g.fill(); }
    if (d===holder){ g.beginPath(); g.arc(x, y, r*1.45, 0, Math.PI*2); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.5; g.shadowColor = "#fff"; g.shadowBlur = 8; g.stroke(); g.shadowBlur = 0; }
    if (d.down>0){
      g.translate(x, y); g.rotate(.9); g.beginPath(); g.ellipse(0, 0, r*1.25, r*.6, 0, 0, Math.PI*2); g.fillStyle = c1; g.fill(); g.lineWidth = 2; g.strokeStyle = c2; g.stroke(); g.restore();
      if (Math.floor(MD.t*3) % 2){ g.fillStyle = "#E11D48"; g.fillRect(x - r*.5, y - r*2.1, r, r*.3); g.fillRect(x - r*.15, y - r*2.45, r*.3, r); }
      return;
    }
    if (d.dive>0){ g.translate(x, y); g.rotate(Q.tall ? 0 : Math.PI/2); g.beginPath(); g.ellipse(0, 0, r*1.7, r*.75, 0, 0, Math.PI*2); g.fillStyle = c1; g.fill(); g.lineWidth = 2; g.strokeStyle = c2; g.stroke(); g.restore(); return; }
    // which way he's facing: a little notch in his second colour
    const fa = Q.tall ? -d.fa - Math.PI/2 + Math.PI : d.fa, fx = Q.tall ? Math.sin(d.fa) : Math.cos(d.fa), fy = Q.tall ? -Math.cos(d.fa) : Math.sin(d.fa);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fillStyle = c1; g.fill();
    g.lineWidth = Math.max(1.6, r*.22); g.strokeStyle = d.s===MD.us ? "rgba(0,240,168,.95)" : c2; g.stroke();
    g.beginPath(); g.arc(x + fx*r*.95, y + fy*r*.95, r*.28, 0, Math.PI*2); g.fillStyle = c2; g.fill();
    g.fillStyle = gk ? "#111" : (lvLight(c1) ? "#111" : "#fff"); g.font = `800 ${Math.round(r*1.05)}px "Barlow Condensed", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(d.o.p.num || ""), x, y + .5);
    g.restore();
  });
  // cards and flags
  MD.fx.forEach(f=>{
    if (f.k==="card" && f.d){ const [x, y] = P(f.d.x, f.d.y); g.save(); g.translate(x + r*.9, y - r*2.2); g.rotate(.15); g.fillStyle = f.c; g.shadowColor = f.c; g.shadowBlur = 10; g.fillRect(-r*.45, -r*.65, r*.9, r*1.3); g.restore(); }
    if (f.k==="flag"){ const [x, y] = P(f.x, f.y); g.fillStyle = "#FFD23F"; g.fillRect(x - 1, y - r*1.6, 2, r*1.6); g.fillStyle = "#FF2E55"; g.beginPath(); g.moveTo(x + 1, y - r*1.6); g.lineTo(x + r, y - r*1.3); g.lineTo(x + 1, y - r); g.fill(); }
    if (f.k==="board"){ const [x, y] = P(MD_L/2, f.s===0 ? -1.2 : MD_W + 1.2), bw2 = r*5, bh = r*1.8;
      g.save(); g.fillStyle = "rgba(5,8,16,.92)"; g.fillRect(x - bw2/2, y - bh/2, bw2, bh); g.strokeStyle = "#00F0A8"; g.lineWidth = 1; g.strokeRect(x - bw2/2, y - bh/2, bw2, bh);
      g.font = `800 ${Math.round(r*1.2)}px "Big Shoulders Display", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "#FF4D6D"; g.fillText(String(f.outN), x - bw2/4, y); g.fillStyle = "#2EF2A0"; g.fillText(String(f.inN), x + bw2/4, y); g.restore(); }
  });
  // the ball: its shadow on the grass, a short trail, and the ball up in the air
  const [bx, by0] = P(B.x, B.y), lift = (B.z || 0)*u*.55, by = by0 - lift;
  MD.trail.push([bx, by]); if (MD.trail.length>9) MD.trail.shift();
  MD.trail.forEach(([tx, ty], i)=>{ g.beginPath(); g.arc(tx, ty, r*.32*(i/9), 0, Math.PI*2); g.fillStyle = `rgba(255,255,255,${(i/9*.35).toFixed(2)})`; g.fill(); });
  g.beginPath(); g.ellipse(bx, by0 + r*.25, r*.45, r*.2, 0, 0, Math.PI*2); g.fillStyle = "rgba(0,0,0,.45)"; g.fill();
  const br = r*.5*(1 + Math.min(.6, (B.z || 0)/14));
  g.beginPath(); g.arc(bx, by, br, 0, Math.PI*2); g.fillStyle = "#fff"; g.shadowColor = "#fff"; g.shadowBlur = 10; g.fill(); g.shadowBlur = 0;
  g.beginPath(); g.arc(bx, by, br*.45, 0, Math.PI*2); g.fillStyle = "#111827"; g.fill();
  // who's on the ball
  if (holder && !holder.lv){ const [x, y] = P(holder.x, holder.y), t = mgSurname(holder.o.p.n).toUpperCase();
    g.font = `700 ${Math.round(r*1.15)}px "Barlow Condensed", sans-serif`; const tw = g.measureText(t).width + 10, ty = y - r*2.3;
    g.fillStyle = "rgba(5,8,16,.82)"; g.fillRect(x - tw/2, ty - r*.85, tw, r*1.7); g.fillStyle = holder.s===MD.us ? "#00F0A8" : "#FF7AB6"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, ty); }
  // the moment's label
  if (MD.chip && MD.t<MD.chip.until){ const C = MD.chip, col = C.s<0 ? "#7C5CFF" : C.s===MD.us ? "#00F0A8" : "#FF2E88";
    g.font = `900 ${Math.round(Math.max(13, r*1.9))}px "Big Shoulders Display", sans-serif`; const tw = g.measureText(C.t).width + 26, th = Math.max(22, r*2.8), x = w/2, far = Q.tall ? by0<h/2 : false, y = far ? h - Q.m - th*.9 : Q.m + th*.9;
    g.save(); g.globalAlpha = Math.min(1, (C.until - MD.t)*3); g.fillStyle = "rgba(5,8,16,.86)"; g.beginPath(); g.moveTo(x - tw/2 + 8, y - th/2); g.lineTo(x + tw/2, y - th/2); g.lineTo(x + tw/2 - 8, y + th/2); g.lineTo(x - tw/2, y + th/2); g.closePath(); g.fill();
    g.strokeStyle = col; g.lineWidth = 2; g.stroke(); g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(C.t, x, y + 1); g.restore(); }
}
