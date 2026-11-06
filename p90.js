/* ================= PLAY THE 90 (development) =================
   A whole match for the mini-game lab only (lab.js): 11 against 11, where you control just your own player and the
   other 21 play themselves, seen as on television: a camera behind your goal looking up the pitch, following the
   ball, the far end smaller in perspective, the stand and the advertising boards behind it. Put a finger down anywhere
   and drag, like a joystick, to run (the further you drag, the faster you go); with the ball, Pass finds the
   best-placed team-mate the way you're running and Shoot stops the match for the shot mini-game (moments.js); without
   it, Call for it asks the man on the ball to find you, and Tackle goes in when you're close enough. In goal, every
   shot on target at you is the save mini-game.
   Everyone accelerates, turns and slows like a footballer, walking or jogging to hold their place and sprinting to
   press or chase; the man on the ball pushes it a stride ahead of him; passes roll, or over distance fly, as do
   crosses and shots, with the ball's shadow on the grass; keepers dive. Distances are in metres: the pitch is 68 wide
   (x) and 105 long (y), and you attack the goal at y = 0, the far end. 90 minutes go by in the length you pick.
   Loaded after moments.js, before lab.js. */
const P9_W = 68, P9_L = 105, P9_GOAL = [30.34, 37.66], P9_BAR = 2.44;
// a 4-3-3 for the side attacking the far goal, with the ball on the centre spot: [x, y, position, number]
const P9_SHAPE = [[34, 101, "GK", 1], [57, 82, "RB", 2], [42, 86, "CB", 5], [26, 86, "CB", 6], [11, 82, "LB", 3], [34, 70, "CDM", 4],
  [47, 62, "CM", 8], [21, 62, "CM", 10], [57, 44, "RW", 7], [34, 40, "ST", 9], [11, 44, "LW", 11]];
const P9_YOU = {GK:0, RB:1, CB:2, LB:4, CDM:5, CM:6, CAM:7, RW:8, ST:9, LW:10};
// 90 minutes go by in a few, so everyone's a little quicker than real players, and the chances are a little better
// the shorter the match (tempo: 1 for five minutes), so a short one still has its goals
const P9_PACE = 1.12;
const P9_ACC = 9;    // how hard a player can speed up, slow down or turn, metres a second every second
const P9_DRAG = 7;   // how quickly a rolling ball slows
const P9_G = 9.8;

/* ---------- the match's state ---------- */
function p9New(st, mins){
  const kit = lvKits(st), e = st.lab.ease, a = st.lab.a;
  const team = (side, them) => P9_SHAPE.map(([x, y, pos, num], i)=>{ const hx = them ? P9_W - x : x, hy = them ? P9_L - y : y;
    return {side, i, pos, num, hx, hy, x:hx, y:hy, vx:0, vy:0, fa:them ? Math.PI/2 : -Math.PI/2, fx:0, fy:them ? 1 : -1, cool:0, stun:0, kickT:0, cheer:0, touch:0, dive:null, lift:0}; });
  const M = {us:team(0, false), them:team(1, true), ball:{x:P9_W/2, y:P9_L/2, z:0, vx:0, vy:0, vz:0, roll:0, owner:null, last:null, pass:null, shot:null, land:null},
    t:0, len:mins*60, score:[0, 0], half:1, me:{g:0, a:0, sh:0, ps:0, pc:0, tk:0, tw:0, sv:0, touches:0}, msg:null, msgT:0, call:0, freeze:0, kickNext:0, hold:false, saveDue:null,
    kit, str:[1, clamp(1 - e*.6, .8, 1.2)], you:null, joy:null, key:{x:0, y:0}, done:false, lastPass:null, log:[], cam:{x:P9_W/2, y:P9_L/2 + 6},
    stat:{sh:[0, 0], pa:[0, 0], pc:[0, 0], pos:[0, 0]}, tempo:clamp(5.5/mins, .7, 2)};
  M.you = M.us[P9_YOU[st.lab.pos] ?? 9]; M.you.me = true;
  M.myName = typeof S!=="undefined" && S && S.player && !S.newing && S.player.name ? S.player.name : "You";   // for the scorers
  M.speedMe = (6.6 + (a.pac - 60)/35)*P9_PACE;   // your top speed, in metres a second
  p9Kickoff(M, 0);
  return M;
}
const p9All = M => [...M.us, ...M.them];
const p9Mates = (M, p) => p.side ? M.them : M.us;
const p9Foes = (M, p) => p.side ? M.us : M.them;
const p9Dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// the goal a side is attacking (the far one for you, the near one for them)
const p9GoalY = side => side ? P9_L : 0;
// everybody back in their own half, the ball on the centre spot for the side kicking off
function p9Kickoff(M, side){
  p9All(M).forEach(p=>{ const own = p.side ? Math.max(p.hy, P9_L/2 + 2) : Math.min(p.hy, P9_L/2 - 2); p.x = p.hx; p.y = p.side ? Math.max(own, P9_L/2 + 1) : Math.min(own, P9_L/2 - 1);
    p.vx = p.vy = 0; p.stun = 0; p.dive = null; p.lift = 0; p.cheer = 0; p.fa = p.side ? Math.PI/2 : -Math.PI/2; p.fx = 0; p.fy = p.side ? 1 : -1; });
  const taker = (side ? M.them : M.us)[9]; taker.x = P9_W/2; taker.y = P9_L/2 + (side ? -.5 : .5);
  Object.assign(M.ball, {x:P9_W/2, y:P9_L/2, z:0, vx:0, vy:0, vz:0, owner:taker, last:taker, pass:null, shot:null, land:null});
  taker.cool = .8;
}
function p9Say(M, txt, s = 1.6){ M.msg = txt; M.msgT = s; }

/* ---------- the ball ---------- */
// a kick from p towards (tx, ty) at speed: along the ground, or (loft) in the air to come down there, or (a shot)
// crossing the goal line at height zt
function p9Kick(M, p, tx, ty, speed, kind, loft, zt = 0){
  const b = M.ball, d = Math.hypot(tx - p.x, ty - p.y) || 1, ux = (tx - p.x)/d, uy = (ty - p.y)/d, t = Math.max(.15, (d - .9)/speed);
  Object.assign(b, {owner:null, last:p, x:p.x + ux*.9, y:p.y + uy*.9, z:.12, vx:ux*speed, vy:uy*speed,
    vz:kind==="shot" ? (zt - .12 + .5*P9_G*t*t)/t : loft ? .5*P9_G*t : 0, land:loft ? [tx, ty] : null});
  b.pass = kind==="pass" || kind==="cross" ? {from:p, to:M._to || null, tried:new Set(), air:kind==="cross"} : null; M._to = null;
  p.cool = .5; p.kickT = .33;
}
// a pass: aimed where the receiver's going (or into the space pt ahead of him), a little off for a poorer passer. A long
// one, or one with a man in the way, goes in the air; the rest roll, weighted to arrive at a pace he can control
function p9Pass(M, p, to, skill, pt){
  const tgt = pt ? {x:pt[0], y:pt[1], vx:0, vy:0} : to, d0 = p9Dist(p, tgt), loft = d0>27 || (d0>14 && p9Lane(M, p, tgt)<1.4);
  if (loft){
    const v = clamp(13 + d0*.22, 15, 24), lead = pt ? 0 : d0/v, err = (1.4 - skill)*2.8;
    const tx = clamp(tgt.x + tgt.vx*lead + gauss()*err, 1, P9_W - 1), ty = clamp(tgt.y + tgt.vy*lead + gauss()*err, 1, P9_L - 1);
    M._to = to; p9Kick(M, p, tx, ty, v, "pass", true);
  } else {
    const vEnd = pt ? 3 : 7, v0 = Math.sqrt(vEnd*vEnd + 2*P9_DRAG*d0), lead = pt ? 0 : d0/((v0 + vEnd)/2), err = (1.4 - skill)*2.2;
    const tx = clamp(tgt.x + tgt.vx*lead + gauss()*err, 1, P9_W - 1), ty = clamp(tgt.y + tgt.vy*lead + gauss()*err, 1, P9_L - 1), d = Math.hypot(tx - p.x, ty - p.y);
    M._to = to; p9Kick(M, p, tx, ty, Math.sqrt(vEnd*vEnd + 2*P9_DRAG*d), "pass");
  }
  if (p.side===0) M.lastPass = {from:p, to, t:M.t};
  M.stat.pa[p.side]++;
  if (p.me) M.me.ps++;
}
// a cross from a wide position to a team-mate in the box: in the air, and he goes for it with whoever's marking him
function p9Cross(M, p, to){
  const tx = clamp(to.x + gauss()*1.5, 8, P9_W - 8), ty = clamp(to.y + gauss()*1.5, 1, P9_L - 1), d = Math.hypot(tx - p.x, ty - p.y);
  M._to = to; p9Kick(M, p, tx, ty, clamp(14 + d*.15, 16, 22), "cross", true); M.stat.pa[p.side]++;
  if (p.side===0) M.lastPass = {from:p, to, t:M.t};
  if (p.me) M.me.ps++;
}
// how open a pass to `to` is: no opponent near the line, and how much ground it gains
function p9Lane(M, p, to){
  const foes = p9Foes(M, p), dx = to.x - p.x, dy = to.y - p.y, L = dx*dx + dy*dy || 1;
  let open = 9;
  foes.forEach(f=>{ const t = clamp(((f.x - p.x)*dx + (f.y - p.y)*dy)/L, 0, 1), dd = Math.hypot(p.x + dx*t - f.x, p.y + dy*t - f.y); open = Math.min(open, dd); });
  return open;
}
// the best pass on: [team-mate, the space ahead of him to aim at (a ball in behind) or null], or [null, null]
function p9BestPass(M, p, dir){
  const gy = p9GoalY(p.side), up = p.side ? 1 : -1, foes = p9Foes(M, p); let best = [null, null], bs = -1e9;
  p9Mates(M, p).forEach(q=>{
    if (q===p || q.stun>0) return;
    const d = p9Dist(p, q); if (d<5 || d>42) return;
    const opts = [null];
    // a forward (or you) running in behind: the ball into the space ahead of him, if it's free
    if (["RW", "ST", "LW", "CAM"].includes(q.pos) || q.me){ const sx = clamp(q.x, 4, P9_W - 4), sy = clamp(q.y + up*9, 2, P9_L - 2); if (foes.every(f=>Math.hypot(f.x - sx, f.y - sy)>4.5)) opts.push([sx, sy]); }
    opts.forEach(pt=>{
      const t = pt ? {x:pt[0], y:pt[1]} : q, lane = p9Lane(M, p, t), gain = Math.abs(p.y - gy) - Math.abs(t.y - gy), space = Math.min(...foes.map(f=>Math.hypot(f.x - t.x, f.y - t.y)));
      let s = Math.min(lane, 4)*3 + gain*.5 + Math.min(space, 8)*.8 - d*.08 + (q.pos==="GK" ? -12 : 0) + (pt ? 2 : 0);
      if (dir){ const ang = Math.atan2(t.y - p.y, t.x - p.x) - Math.atan2(dir[1], dir[0]); s += Math.cos(ang)*9; }
      if (M.call>0 && q.me) s += 14;
      if (s>bs){ bs = s; best = [q, pt]; }
    });
  });
  return best;
}

/* ---------- shots ---------- */
// a computer player's shot: in or not, decided by the distance, the angle and the sides' strengths; then where it goes
// (in, at the keeper, over or wide) and how high, and the keeper dives for it
function p9Shot(M, p){
  const gy = p9GoalY(p.side), d = Math.hypot(p.x - P9_W/2, p.y - gy), ang = Math.abs(p.x - P9_W/2)/Math.max(4, Math.abs(p.y - gy));
  const q = clamp(.4 - (d - 6)*.012 - ang*.06, .04, .5)*(p.header ? .8 : 1)*(p.side ? M.str[1] : 1/M.str[1])*M.tempo; p.header = false;
  const goal = Math.random()<q, onT = goal || Math.random()<.55, gk = p9Foes(M, p)[0];
  // you're in goal and it's on target: it's yours to save (the save mini-game), not the dice's
  if (p.side===1 && onT && M.you.pos==="GK" && !M.cpu){ M.saveDue = p; M.stat.sh[1]++; p.cool = .5; p.kickT = .33; p9Say(M, "Shot!", .6); return; }
  let tx, zt;
  if (goal){ const away = gk.x<P9_W/2 ? 1 : -1; tx = P9_W/2 + away*(.8 + Math.random()*2.6); zt = .15 + Math.random()*2.05; }
  else if (onT){ tx = clamp(gk.x + gauss()*1.1, P9_GOAL[0] + .3, P9_GOAL[1] - .3); zt = .2 + Math.random()*1.8; }
  else if (Math.random()<.45){ tx = P9_GOAL[0] + Math.random()*7.32; zt = 2.75 + Math.random()*1.6; }
  else { tx = Math.random()<.5 ? P9_GOAL[0] - .7 - Math.random()*4 : P9_GOAL[1] + .7 + Math.random()*4; zt = .2 + Math.random()*1.8; }
  p9Kick(M, p, tx, gy, 26 + Math.random()*6, "shot", false, zt);
  M.ball.shot = {by:p, goal, onT, x:tx, zt}; M.stat.sh[p.side]++;
  // the keeper goes for it: all the way when he saves it, not quite when it's in
  if (goal || onT) gk.dive = {x:goal ? gk.x + (tx - gk.x)*.55 : tx, z:Math.min(zt, 2.1), t:.9};
  if (p.side===1) p9Say(M, "Shot!", .8);
}
// your shot: the match stops for the shot mini-game, from where you are
async function p9YouShoot(M, st){
  const p = M.you, d = Math.hypot(p.x - P9_W/2, p.y), inBox = p.y<16.5 && p.x>13.85 && p.x<54.15;
  if (d>34){ p9Say(M, "Too far out", 1); return; }
  const near = M.them.filter(f=>f.pos!=="GK" && f.y<p.y && Math.abs(f.x - p.x)<6).length;
  const v = !inBox ? "long" : near===0 && d<14 ? "oneonone" : "box";
  M.me.sh++; M.stat.sh[0]++; M.paused = true;
  const r = await lvShotCore(st, {q:clamp(1.1 - near*.08 - (d>20 ? .1 : 0), .6, 1)}, v, lvHead(st), {long:"Shot from range", oneonone:"Through on goal!", box:"Shot in the box"}[v]);
  if (r==="skip" || st.lab.quit){ M.done = true; return; }
  const gk = M.them[0];
  if (r.goal){ p9Goal(M, 0, p); }
  else if (r.big==="Over the bar" || r.big==="Hit the wall"){ p9Say(M, r.big, 1.2); p9Restart(M, gk, P9_W/2, 5.5); }
  else { p9Say(M, r.big, 1.2); p9Restart(M, gk, gk.x, gk.y); }
  M.paused = false; p9Draw(M, st, true);
}
// a shot at you in goal: the match stops for the save mini-game
async function p9YouSave(M, st, by){
  M.paused = true;
  const r = await lvGameSave(st, {min:p9Min(M), q:1, g:"save", v:"box"});
  if (r==="skip" || st.lab.quit){ M.done = true; return; }
  if (r.ok){ M.me.sv++; p9Say(M, r.big, 1.2); p9Restart(M, M.you, M.you.x, M.you.y); }
  else p9Goal(M, 1, by);
  M.paused = false; p9Draw(M, st, true);
}
function p9Goal(M, side, by){
  M.score[side]++;
  if (side===0){
    if (by && by.me){ M.me.g++; p9Say(M, "GOAL! You scored!", 2.2); }
    else p9Say(M, "GOAL!", 2);
    const lp = M.lastPass; if (lp && lp.from.me && by && !by.me && M.t - lp.t<10 && lp.to===by){ M.me.a++; p9Say(M, "GOAL! Your assist!", 2.2); }
    M.log.push(`${p9Min(M)}' ${by && by.me ? M.myName : `#${by ? by.num : "?"}`} scored`);
  } else { p9Say(M, "They score", 1.8); M.log.push(`${p9Min(M)}' They scored`); }
  // the ball in the net, the scorer and those near him celebrating, then the kick-off
  Object.assign(M.ball, {owner:null, vx:0, vy:0, vz:0, pass:null, shot:null, land:null, x:clamp(M.ball.x, P9_GOAL[0] + .5, P9_GOAL[1] - .5), y:side ? P9_L + 1.2 : -1.2, z:clamp(M.ball.z, .11, 2)});
  p9All(M).forEach(p=>{ p.vx = p.vy = 0; p.dive = null; p.lift = 0; if (by && p.side===by.side && p9Dist(p, by)<14) p.cheer = 1.8; });
  M.freeze = 1.8; M.kickNext = side ? 0 : 1;
}
// a goal kick, a save held, a throw-in: the ball to p, standing at (x, y)
function p9Restart(M, p, x, y){
  p.x = clamp(x, 0, P9_W); p.y = clamp(y, 0, P9_L); p.dive = null; p.lift = 0;
  Object.assign(M.ball, {x:p.x, y:p.y, z:0, vx:0, vy:0, vz:0, owner:p, last:p, pass:null, shot:null, land:null}); p.cool = .9;
}
const p9Min = M => Math.min(90, Math.floor(M.t/M.len*90));

/* ---------- one step of the match ---------- */
function p9Step(M, dt){
  M.t += dt; M.call = Math.max(0, M.call - dt); M.msgT = Math.max(0, M.msgT - dt);
  p9All(M).forEach(p=>{ p.kickT = Math.max(0, p.kickT - dt); p.cheer = Math.max(0, p.cheer - dt); p.ph = ((p.ph || 0) + Math.hypot(p.vx, p.vy)*dt*2.6) % (Math.PI*2); });
  // a moment to take in a goal, or half time, then the kick-off
  if (M.freeze>0){ M.freeze -= dt; if (M.freeze<=0) p9Kickoff(M, M.kickNext); if (M.t<M.len) return; }
  if (M.half===1 && M.t>=M.len/2){ M.half = 2; p9Say(M, "Half time", 2); p9All(M).forEach(p=>{ p.vx = p.vy = 0; }); M.freeze = 2; M.kickNext = 1; return; }
  if (M.t>=M.len){ M.done = true; return; }
  const b = M.ball, carrier = b.owner;
  if (carrier) M.stat.pos[carrier.side] += dt;
  // each side's last defender (the one nearest the goal it defends), for keeping the forwards onside
  const line = def => { const L = (def ? M.them : M.us).filter(q=>q.pos!=="GK").map(q=>q.y); return def ? Math.min(...L) : Math.max(...L); };
  const press = carrier ? p9Foes(M, carrier).filter(q=>q.pos!=="GK" && q.stun<=0).sort((x, y)=>p9Dist(x, carrier) - p9Dist(y, carrier)).slice(0, 2) : [];
  const chase = !carrier && !b.shot ? [0, 1].map(sd=>(sd ? M.them : M.us).filter(q=>!q.stun).sort((x, y)=>p9Dist(x, b) - p9Dist(y, b))[0]) : [];
  // where everyone wants to be: their place in the shape, shifted with the ball; the side with it pushes on, and its
  // forwards make runs as far as the other side's last defender
  p9All(M).forEach(p=>{
    p.cool = Math.max(0, p.cool - dt); p.stun = Math.max(0, p.stun - dt);
    if (p.stun>0){ p9MoveTo(p, p.x, p.y, 0, dt); return; }
    if (p===carrier) return;
    if (p.me && !M.cpu && p9Input(M)) return;
    const has = carrier && carrier.side===p.side, up = p.side ? 1 : -1, fwd = ["RW", "ST", "LW"].includes(p.pos), mid = ["CM", "CDM", "CAM"].includes(p.pos);
    let tx = p.hx + (b.x - P9_W/2)*.35, ty = p.hy + (b.y - P9_L/2)*(p.pos==="GK" ? .06 : .55) + (has ? up*(fwd ? 16 : mid ? 10 : 6) : -up*3);
    if (has && fwd){ const l = line(1 - p.side); ty = p.side ? Math.min(ty, l) : Math.max(ty, l); tx += (p.hx - P9_W/2)*.25; }
    if (p.pos==="GK"){ const gy = p.side ? P9_L - 1 : 1; tx = P9_W/2 + (b.x - P9_W/2)*.18; ty = gy + (p.side ? -1 : 1)*clamp(Math.abs(b.y - gy)*.08, 1, 5); }
    // holding a place: a walk when it's close, a jog, a run when it's far
    const far = Math.hypot(tx - p.x, ty - p.y); let speed = (far<1.5 ? 1.7 : far<5 ? 3.6 : far<12 ? 5.4 : 6.6)*P9_PACE;
    // one presses the man on the ball, the next covers goal-side of him
    const k = press.indexOf(p);
    if (k===0){ tx = carrier.x; ty = carrier.y + (p.side ? -1.2 : 1.2); speed = 7.2*P9_PACE; }
    else if (k===1){ const gy = p9GoalY(1 - p.side), dd = Math.hypot(P9_W/2 - carrier.x, gy - carrier.y) || 1; tx = carrier.x + (P9_W/2 - carrier.x)/dd*6; ty = carrier.y + (gy - carrier.y)/dd*6; speed = 6.2*P9_PACE; }
    // a pass to you: meet it (where it comes down, when it's in the air); a loose ball: the nearest on each side goes for it
    if (b.pass && b.pass.to===p){ if (b.land){ tx = b.land[0]; ty = b.land[1]; } else { const v2 = b.vx*b.vx + b.vy*b.vy || 1, t = clamp(((p.x - b.x)*b.vx + (p.y - b.y)*b.vy)/v2, 0, 2); tx = b.x + b.vx*t; ty = b.y + b.vy*t; } speed = 7.6*P9_PACE; }
    else if (chase.includes(p)){ const lp = b.land || [b.x + b.vx*.3, b.y + b.vy*.3]; tx = lp[0]; ty = lp[1]; speed = 7.6*P9_PACE; }
    // a keeper going for a shot dives across, up for a high one
    if (p.dive){ p.dive.t -= dt; tx = p.dive.x; ty = p.y; speed = 9; p.lift = Math.min(p.dive.z*.4, 1); if (p.dive.t<=0){ p.dive = null; p.lift = 0; } }
    p9MoveTo(p, tx, ty, speed*(p.side ? M.str[1] : 1), dt, Math.atan2(b.y - p.y, b.x - p.x));
  });
  // you, under your own control
  p9Steer(M, dt);
  // the man on the ball: dribble, pass or shoot
  if (carrier && (!carrier.me || M.cpu)) p9Carry(M, carrier, dt);   // M.cpu: your player plays himself too (for testing)
  // the ball: pushed a stride ahead of the man on it, or rolling, flying and bouncing
  if (b.owner){
    const o = b.owner, sp = Math.hypot(o.vx, o.vy);
    o.touch = sp>1 ? (o.touch + sp*dt/2.6) % 1 : 0;
    const off = .45 + (sp>1 ? .3 + .9*o.touch : 0), tx = o.x + o.fx*off, ty = o.y + o.fy*off, dx = tx - b.x, dy = ty - b.y, dd = Math.hypot(dx, dy), mv = Math.min(dd, (sp + 5)*dt);
    if (dd>1e-3){ b.x += dx/dd*mv; b.y += dy/dd*mv; }
    b.vx = o.vx; b.vy = o.vy; b.z = 0; b.vz = 0; b.roll += sp*dt;
  } else {
    b.x += b.vx*dt; b.y += b.vy*dt; b.roll += Math.hypot(b.vx, b.vy)*dt;
    if (b.z>0 || b.vz>0){
      b.z += b.vz*dt; b.vz -= P9_G*dt;
      if (b.z<=0){ b.z = 0; b.land = null; if (b.vz<-2.4){ b.vz = -b.vz*.45; b.vx *= .82; b.vy *= .82; } else b.vz = 0; }
    } else { const sp = Math.hypot(b.vx, b.vy), ns = Math.max(0, sp - P9_DRAG*dt); if (sp>0){ b.vx *= ns/sp; b.vy *= ns/sp; } }
    if (b.shot) p9ShotFly(M);
    else p9Loose(M);
    if (!M.ball.owner && !M.ball.shot) p9Out(M);
  }
  // a defender close to the man on the ball can win it
  if (b.owner){
    const o = b.owner;
    p9Foes(M, o).forEach(f=>{
      if (f.me || f.stun>0 || f.cool>0 || p9Dist(f, o)>1.5) return;
      f.cool = 1.1;
      const win = Math.random() < (o.me ? .3 : .24)*(f.side ? M.str[1] : 1/M.str[1]);
      if (win){ if (o.me) p9Say(M, "Tackled!", 1); Object.assign(b, {owner:f, last:f, pass:null}); o.stun = .5; f.cool = .4; f.kickT = .33; }
    });
  }
}
// a footballer's way of getting somewhere: speeding up and slowing down no harder than he can, easing in as he
// arrives, and turning to face where he's going (or, standing, look: the ball)
function p9MoveTo(p, tx, ty, speed, dt, look){
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), want = d<.3 ? 0 : Math.min(speed, Math.sqrt(2*P9_ACC*.85*Math.max(0, d - .25)));
  const wx = d ? dx/d*want : 0, wy = d ? dy/d*want : 0, h = Math.max(dt, 1e-3), amax = P9_ACC*(p.dive ? 2.2 : 1);
  let ax = (wx - p.vx)/h, ay = (wy - p.vy)/h; const a = Math.hypot(ax, ay); if (a>amax){ ax *= amax/a; ay *= amax/a; }
  p.vx += ax*dt; p.vy += ay*dt;
  p.x = clamp(p.x + p.vx*dt, -2, P9_W + 2); p.y = clamp(p.y + p.vy*dt, -2, P9_L + 2);
  p9Face(p, dt, look);
}
function p9Face(p, dt, look){
  const sp = Math.hypot(p.vx, p.vy), want = sp>.7 ? Math.atan2(p.vy, p.vx) : look ?? p.fa;
  const d = Math.atan2(Math.sin(want - p.fa), Math.cos(want - p.fa)), mx = (sp>.7 ? 9 : 5)*dt;
  p.fa += clamp(d, -mx, mx); p.fx = Math.cos(p.fa); p.fy = Math.sin(p.fa);
}
// your joystick (or the arrow keys): where you're going and how fast; null when you've let go
function p9Input(M){
  if (M.joy && M.joy.on){ const m = Math.hypot(M.joy.dx, M.joy.dy); if (m>6) return [M.joy.dx/m, M.joy.dy/m, Math.min(1, (m - 6)/38)]; return [0, 0, 0]; }
  const k = M.key; if (k.x || k.y){ const m = Math.hypot(k.x, k.y); return [k.x/m, k.y/m, 1]; }
  return null;
}
function p9Steer(M, dt){
  const p = M.you, i = p9Input(M); if (!i || p.stun>0) return;
  const hasBall = M.ball.owner===p, sp = M.speedMe*(hasBall ? .88 : 1)*i[2];
  p9MoveTo(p, p.x + i[0]*10, p.y + i[1]*10, sp, dt, Math.atan2(M.ball.y - p.y, M.ball.x - p.x));
}
// a computer player on the ball
function p9Carry(M, p, dt){
  if (p.cool>0){ p9MoveTo(p, p.x, p.y + (p.side ? 1 : -1)*2, 3*P9_PACE, dt); return; }
  const gy = p9GoalY(p.side), up = p.side ? 1 : -1, foes = p9Foes(M, p), skill = (p.side ? M.str[1] : 1);
  const near = foes.reduce((m, f)=>!m || p9Dist(f, p)<p9Dist(m, p) ? f : m, null), press = near ? p9Dist(near, p) : 99;
  const dGoal = Math.hypot(p.x - P9_W/2, p.y - gy), central = Math.abs(p.x - P9_W/2)<22;
  if (p.pos==="GK"){ const [to, pt] = p9BestPass(M, p); p9Pass(M, p, to || p9Mates(M, p)[5], .9*skill, pt); return; }
  if (p.side===0 && M.call>0 && !p.me && p9Lane(M, p, M.you)>1.6){ M.call = 0; p9Say(M, "He's found you", .9); p9Pass(M, p, M.you, .95*skill); return; }
  p.think = (p.think ?? 0) - dt;
  if (p.think<=0){
    p.think = .22 + Math.random()*.2;
    // a shot: close in and central, or with a little room from further out; straight away from a cross
    if (p.header && dGoal<20){ p9Shot(M, p); return; }
    if (central && (dGoal<20 || (dGoal<28 && press>1.8)) && Math.random()<(dGoal<12 ? .9 : dGoal<20 ? .65 : .4)){ p9Shot(M, p); return; }
    // wide in the last 25 metres: a cross to whoever's in the box
    if (Math.abs(p.y - gy)<25 && Math.abs(p.x - P9_W/2)>=16 && Math.random()<.55){
      const box = p9Mates(M, p).filter(q=>q!==p && q.pos!=="GK" && Math.abs(q.x - P9_W/2)<14 && Math.abs(q.y - gy)<17);
      if (box.length){ p9Cross(M, p, box[Math.floor(Math.random()*box.length)]); return; }
    }
    // a pass: a safe one under pressure, a forward one when there's a lane, now and then a ball in behind
    const [to, pt] = p9BestPass(M, p);
    if (to){
      const t = pt ? {x:pt[0], y:pt[1]} : to, lane = p9Lane(M, p, t), gain = Math.abs(p.y - gy) - Math.abs(t.y - gy);
      if ((press<2.8 && lane>1.6) || (press<6 && lane>2.4 && gain>3 && Math.random()<.5) || (pt && lane>2.4 && Math.random()<.35)){ p9Pass(M, p, to, .95*skill, pt); return; }
    }
  }
  // dribble on towards goal, swerving away from whoever's closest
  let tx = p.x + (P9_W/2 - p.x)*.2, ty = p.y + up*8;
  if (near && press<7) tx += Math.sign(p.x - near.x || 1)*(7 - press)*1.4;
  p9MoveTo(p, clamp(tx, 3, P9_W - 3), ty, 5.8*P9_PACE*skill, dt);
}
// a loose ball, or a pass on its way: whoever gets to it first (and not while it's over his head)
function p9Loose(M){
  const b = M.ball, sp = Math.hypot(b.vx, b.vy);
  let best = null, bd = 1e9;
  // a cross: nobody gets to it until it's dropping at the man it's meant for, then it's him or his marker
  if (b.pass && b.pass.air){
    const to = b.pass.to; if (!to || p9Dist(to, b)>2.2 || b.z>2.8) return;
    const mark = p9Foes(M, to).filter(f=>f.pos!=="GK" || p9Dist(f, to)<3).sort((x, y)=>p9Dist(x, to) - p9Dist(y, to))[0], pass = b.pass;
    if (mark && p9Dist(mark, to)<2.6 && Math.random()<.5){ Object.assign(b, {owner:null, last:mark, pass:null, land:null}); const away = mark.side ? 1 : -1; b.vx = gauss()*6; b.vy = -away*14; b.vz = 4; mark.lift = .6; if (to.me) p9Say(M, "Headed clear", .9); return; }
    Object.assign(b, {owner:to, last:to, pass:null, land:null, z:0, vz:0}); to.cool = 0; M.stat.pc[to.side]++; if (pass.from.me && to.side===0) M.me.pc++;
    if (!to.me || M.cpu){ to.think = 0; to.header = true; } else p9Say(M, "Cross on its way to you", .8);
    return;
  }
  p9All(M).forEach(p=>{
    if (p.stun>0 || (b.last===p && p.cool>0)) return;
    const gkBox = p.pos==="GK" && Math.abs(b.y - p9GoalY(1 - p.side))<17;
    if (b.z>(gkBox ? 2.6 : 1.3)) return;
    const d = p9Dist(p, b), reach = b.pass && b.pass.to===p ? (sp<10 ? 2.1 : 1.7) : p.pos==="GK" ? 1.8 : 1.05;
    if (d>reach) return;
    // a pass going by an opponent: he has a go at cutting it out, once
    if (b.pass && b.pass.from.side!==p.side && sp>8){ if (b.pass.tried.has(p)) return; b.pass.tried.add(p); if (Math.random()>.32) return; }
    if (d<bd){ bd = d; best = p; }
  });
  if (!best) return;
  const pass = b.pass;
  Object.assign(b, {owner:best, last:best, pass:null, land:null, z:0, vz:0}); best.cool = .25;
  if (best.me){ M.me.touches++; if (pass && pass.from.side===0) p9Say(M, "On the ball", .6); }
  if (pass && pass.from.me){ if (best.side===0) M.me.pc++; else p9Say(M, "Intercepted", .9); }
  if (pass && pass.from.side===best.side) M.stat.pc[best.side]++;
}
// a shot on its way: in, saved, or over or wide, as it reaches the goal line
function p9ShotFly(M){
  const b = M.ball, s = b.shot, gy = p9GoalY(s.by.side), past = s.by.side ? b.y>=gy - .3 : b.y<=gy + .3;
  if (!past && Math.hypot(b.vx, b.vy)>2.5) return;
  const gk = (s.by.side ? M.us : M.them)[0];
  b.shot = null;
  if (s.goal) return p9Goal(M, s.by.side, s.by);
  if (s.onT){ if (s.by.side===1) p9Say(M, "Saved!", .9); else p9Say(M, "Saved", .8); gk.x = clamp(b.x, P9_GOAL[0], P9_GOAL[1]); p9Restart(M, gk, gk.x, gk.y); }
  else { p9Say(M, b.z>P9_BAR ? "Over the bar" : "Wide", .8); p9Restart(M, gk, P9_W/2, s.by.side ? P9_L - 5.5 : 5.5); }
}
// over a line: a throw-in, a goal kick or a corner
function p9Out(M){
  const b = M.ball, last = b.last || M.us[9];
  if (b.x<0 || b.x>P9_W){
    const side = 1 - last.side, x = b.x<0 ? 0 : P9_W, taker = (side ? M.them : M.us).filter(p=>p.pos!=="GK").sort((p, q)=>Math.hypot(p.x - x, p.y - b.y) - Math.hypot(q.x - x, q.y - b.y))[0];
    return p9Restart(M, taker, x + (x ? -.5 : .5), clamp(b.y, 1, P9_L - 1));
  }
  if (b.y<0 || b.y>P9_L){
    const top = b.y<0, defSide = top ? 1 : 0;   // the side defending that goal
    if (last.side===defSide){
      // a corner to the attackers
      const att = top ? M.us : M.them, taker = att[b.x<P9_W/2 ? 10 : 8], cx = b.x<P9_W/2 ? .5 : P9_W - .5, cy = top ? .5 : P9_L - .5;
      p9Restart(M, taker, cx, cy);
      if (!taker.me){ const box = att.filter(p=>p!==taker && Math.abs(p.y - cy)<20 && p.pos!=="GK"); const to = box[Math.floor(Math.random()*box.length)] || att[9]; p9Cross(M, taker, to); }
      p9Say(M, "Corner", .8);
    } else { const gk = (top ? M.them : M.us)[0]; p9Restart(M, gk, P9_W/2, top ? 5.5 : P9_L - 5.5); }
  }
}

/* ---------- the camera ---------- */
// the screen is 360 by 560; the camera sits P9_D metres behind the point it's looking at, P9_HC metres up, and shows
// 30 metres across there. The horizon is fixed, so the far end of the pitch climbs towards it in perspective
const P9_SW = 360, P9_SH = 560, P9_D = 24, P9_HC = 22, P9_F = P9_SW*P9_D/30, P9_HZ = Math.round(P9_SH*.62 - P9_HC*P9_F/P9_D);
const P9_BIG = 1.35;   // players and the ball are drawn a little larger than life, so you can see them
// the camera follows the ball, a little ahead of whoever has it
function p9Cam(M, dt){
  const b = M.ball, o = b.owner, c = M.cam, lead = (o ? (o.side ? 3 : -5) : 0) + clamp((b.y - 60)*.4, 0, 12);
  const tx = clamp(b.x, 14, P9_W - 14), ty = clamp(b.y + lead, -3, P9_L - 7);
  c.x += (tx - c.x)*Math.min(1, dt*2.2); c.y += (ty - c.y)*Math.min(1, dt*2.4);
  M.hz = P9_HZ - 3.2*Math.max(0, 30 - c.y);   // tilting down as play nears the far end, so the stand doesn't take over
}
// a point on (or above) the pitch to the screen: [x, y, pixels a metre there], or null when it's behind the camera
function p9P(M, x, y, z = 0){ const d = M.cam.y + P9_D - y; if (d<1.2) return null; const k = P9_F/d; return [P9_SW/2 + (x - M.cam.x)*k, (M.hz ?? P9_HZ) + (P9_HC - z)*k, k]; }
// the pitch's markings as straight pieces, worked out once: the touchlines and goal lines, halfway, the centre circle,
// both penalty areas and six-yard boxes, the arcs and the corner arcs; and the spots
const P9_LINES = (()=>{
  const L = [], seg = (x1, y1, x2, y2) => L.push([x1, y1, x2, y2]);
  const arc = (cx, cy, r, a0, a1, n) => { for (let i=0;i<n;i++){ const p = a0 + (a1 - a0)*i/n, q = a0 + (a1 - a0)*(i+1)/n; seg(cx + r*Math.cos(p), cy + r*Math.sin(p), cx + r*Math.cos(q), cy + r*Math.sin(q)); } };
  seg(0, 0, P9_W, 0); seg(P9_W, 0, P9_W, P9_L); seg(P9_W, P9_L, 0, P9_L); seg(0, P9_L, 0, 0); seg(0, P9_L/2, P9_W, P9_L/2);
  arc(P9_W/2, P9_L/2, 9.15, 0, Math.PI*2, 64);
  [[0, 1], [P9_L, -1]].forEach(([g, s])=>{
    seg(13.85, g, 13.85, g + s*16.5); seg(13.85, g + s*16.5, 54.15, g + s*16.5); seg(54.15, g + s*16.5, 54.15, g);
    seg(24.85, g, 24.85, g + s*5.5); seg(24.85, g + s*5.5, 43.15, g + s*5.5); seg(43.15, g + s*5.5, 43.15, g);
    const a = Math.asin(5.5/9.15); s>0 ? arc(P9_W/2, 11, 9.15, a, Math.PI - a, 18) : arc(P9_W/2, P9_L - 11, 9.15, Math.PI + a, Math.PI*2 - a, 18);
  });
  [[0, 0, 0], [P9_W, 0, Math.PI/2], [P9_W, P9_L, Math.PI], [0, P9_L, Math.PI*1.5]].forEach(([x, y, a])=>arc(x, y, 1, a, a + Math.PI/2, 4));
  return L;
})();
const P9_SPOTS = [[P9_W/2, P9_L/2], [P9_W/2, 11], [P9_W/2, P9_L - 11]].map(([x, y])=>[...Array(10)].map((_, i)=>[x + .22*Math.cos(i*Math.PI/5), y + .22*Math.sin(i*Math.PI/5), 0]));

/* ---------- what you see: a canvas, drawn from the camera every frame ---------- */
// into the current path: a flat patch of ground (cut off where it would pass behind the camera), a painted line w
// metres wide (so it thins into the distance like a real one), a flat shape standing up off the pitch
function p9GPatch(g, M, x0, y0, x1, y1){
  const yMax = M.cam.y + P9_D - 1.6; if (y0>=yMax) return;
  const y2 = Math.min(y1, yMax), a = p9P(M, x0, y0), b = p9P(M, x1, y0), c = p9P(M, x1, y2), d = p9P(M, x0, y2);
  g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath();
}
function p9GSeg(g, M, x1, y1, x2, y2, w){
  const yMax = M.cam.y + P9_D - 1.6;
  if (y1>yMax && y2>yMax) return;
  if (y1>yMax){ const t = (yMax - y2)/(y1 - y2); x1 = x2 + (x1 - x2)*t; y1 = yMax; } else if (y2>yMax){ const t = (yMax - y1)/(y2 - y1); x2 = x1 + (x2 - x1)*t; y2 = yMax; }
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1)/L*w, ny = (x2 - x1)/L*w;
  const a = p9P(M, x1 + nx, y1 + ny), b = p9P(M, x2 + nx, y2 + ny), c = p9P(M, x2 - nx, y2 - ny), d = p9P(M, x1 - nx, y1 - ny);
  if (!a || !b || !c || !d) return;
  g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath();
}
function p9GPoly(g, M, pts){
  const P = pts.map(([x, y, z])=>p9P(M, x, y, z)); if (P.some(q=>!q)) return;
  g.moveTo(P[0][0], P[0][1]); for (let i=1;i<P.length;i++) g.lineTo(P[i][0], P[i][1]); g.closePath();
}
// the stand behind the far end, 14 metres back and 18 high, and the far boards: both face the camera, so they're
// pictures drawn once (the stand at 10 pixels a metre) and only placed and scaled each frame; and the nets' mesh
const P9_STAND = {x:-60, y:-14, w:188, h:18};
function p9Assets(kit){
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }, A = {};
  { const [c, g] = mk(P9_STAND.w*10, P9_STAND.h*10), R = seeded(90), cols = ["#26332D", "#33413A", "#1E2A25", "#3D4A43", "#2B3832"];
    g.fillStyle = "#0E1A15"; g.fillRect(0, 0, c.width, c.height);
    for (let r=0, y=30; y<165; r++, y+=4.4) for (let x = 1.5 + (r%2)*2.4; x<c.width; x+=4.8){
      g.fillStyle = R()<.2 ? kit.us : R()<.07 ? kit.them : cols[Math.floor(R()*cols.length)]; g.fillRect(x - 1.9, y + 1.1, 3.8, 3.1);
      g.fillStyle = R()<.5 ? "#C99A72" : "#6B4A35"; g.beginPath(); g.arc(x, y, 1.45, 0, Math.PI*2); g.fill();
    }
    g.fillStyle = "#0A120E"; [64, 102, 140].forEach(y=>g.fillRect(0, y, c.width, 2.2));
    g.fillStyle = "#05090A"; g.fillRect(0, 0, c.width, 23); g.fillStyle = "rgba(255,246,214,.25)"; g.fillRect(0, 23, c.width, 2.2);
    g.fillStyle = "#0B1A12"; g.fillRect(0, 168, c.width, 12);
    A.stand = c; }
  { const S = 30, [c, g] = mk(92*S, Math.round(.9*S));
    g.fillStyle = "#0B1A12"; g.fillRect(0, 0, c.width, c.height); g.font = `900 ${.62*S}px "Big Shoulders Display", Impact, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    for (let i=0;i<12;i++){ g.fillStyle = i%2 ? "rgba(245,197,66,.8)" : "rgba(127,215,196,.8)"; g.fillText("PYRAMID", (3.8 + i*7.6)*S, .47*S); }
    g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, 0, c.width, 2);
    A.boards = c; }
  { const [c, g] = mk(6, 6); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(6, .5); g.lineTo(.5, .5); g.lineTo(.5, 6); g.stroke(); A.net = c; }
  return A;
}
// a player's colours, worked out once: his shirt (a keeper's own), shorts, socks, the number's ink, skin and hair
// (you look like your player)
function p9Look(p, kit){
  const shirt = p.pos==="GK" ? lgKeeperKit(kit) : p.side ? kit.them : kit.us, tr = LV_TRIM[shirt], trim = tr && !lvNear(tr, shirt) ? tr : lvLight(shirt) ? "#1F2937" : "#F3F4F6";
  const v = p.i*7 + p.side*13 + 3, you = p.me && typeof S!=="undefined" && S && S.player;
  return {shirt, trim, shorts:p.pos==="GK" ? "#1F2937" : trim, socks:shirt, ink:lvLight(shirt) ? "#15171A" : "#FFFFFF", gk:p.pos==="GK",
    skin:you ? LV_SKIN[S.player.skin ?? 1] || LV_SKIN[1] : LV_SKIN[v % LV_SKIN.length], hair:you ? (S.player.hair==="none" ? null : HAIRC[S.player.hairColour] || LV_HAIR[0]) : LV_HAIR[v % LV_HAIR.length]};
}
// a footballer as he'd look on television, 40 units tall with his feet at (x, y): boots, socks, legs, shorts, shirt,
// arms, head and hair, from the front or (back) from behind with his number big on his back. Running, his legs lift in
// turn and his arms swing at the pace he's going; a kick lifts his right foot; celebrating, his arms go up
function p9DrawFig(g, p, L, x, y, sc, lean, back, lift){
  const sp = Math.hypot(p.vx, p.vy), run = sp>1.2 && !p.cheer, ph = p.ph || 0;
  const la = run ? Math.max(0, Math.sin(ph))*1.9 : 0, lb = run ? Math.max(0, -Math.sin(ph))*1.9 : 0, kick = p.kickT>0 ? Math.sin((1 - p.kickT/.33)*Math.PI)*3.4 : 0;
  const bob = run ? Math.abs(Math.sin(ph))*.9 : 0, swing = run ? Math.sin(ph)*.2 : 0, up = p.cheer>0 ? 2.25 : 0;
  g.save(); g.translate(x, y - lift); if (lean) g.rotate(lean*Math.PI/180); g.scale(sc, sc); g.lineCap = "round";
  const leg = (lx, h) => {
    g.strokeStyle = L.skin; g.lineWidth = 2.7; g.beginPath(); g.moveTo(lx, -19); g.lineTo(lx, -5.5 - h); g.stroke();
    g.strokeStyle = L.socks; g.lineWidth = 3; g.beginPath(); g.moveTo(lx, -9 - h*.85); g.lineTo(lx, -1.6 - h); g.stroke();
    g.fillStyle = "#101214"; g.beginPath(); g.moveTo(lx - 1.7, -1.5 - h); g.lineTo(lx + 1.7, -1.5 - h); g.quadraticCurveTo(lx + 2.6, -.2 - h, lx + 1.4, -h); g.lineTo(lx - 1.7, -h); g.closePath(); g.fill();
  };
  leg(-2.4, la); leg(2.4, Math.max(lb, kick));
  g.translate(0, -bob);
  g.fillStyle = L.shorts; g.beginPath(); g.moveTo(-5.1, -21.6); g.lineTo(5.1, -21.6); g.lineTo(5.8, -15); g.lineTo(1.3, -15); g.lineTo(0, -16.5); g.lineTo(-1.3, -15); g.lineTo(-5.8, -15); g.closePath(); g.fill();
  const arm = (d, a) => {
    g.save(); g.translate(5.3*d, -31.4); g.rotate(a);
    g.strokeStyle = L.shirt; g.lineWidth = 2.7; g.beginPath(); g.moveTo(0, 0); g.lineTo(1.2*d, 4.4); g.stroke();
    g.strokeStyle = L.skin; g.lineWidth = 2; g.beginPath(); g.moveTo(1.2*d, 4.4); g.lineTo(1.7*d, 9.3); g.stroke();
    g.fillStyle = L.gk ? "#C8F04A" : L.skin; g.beginPath(); g.arc(1.8*d, 9.9, L.gk ? 1.45 : 1.05, 0, Math.PI*2); g.fill(); g.restore();
  };
  arm(-1, up || swing); arm(1, up ? -up : -swing);
  g.fillStyle = L.shirt; g.beginPath(); g.moveTo(-5.6, -32.5); g.quadraticCurveTo(0, -34.2, 5.6, -32.5); g.lineTo(5, -21.3); g.lineTo(-5, -21.3); g.closePath(); g.fill();
  g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.moveTo(1.4, -33.3); g.quadraticCurveTo(3.9, -33.1, 5.6, -32.5); g.lineTo(5, -21.3); g.lineTo(1.4, -21.3); g.closePath(); g.fill();
  g.strokeStyle = L.trim; g.lineWidth = .85; g.beginPath(); if (back){ g.moveTo(-1.9, -32.9); g.lineTo(1.9, -32.9); } else { g.moveTo(-1.7, -32.9); g.lineTo(0, -31.3); g.lineTo(1.7, -32.9); } g.stroke();
  g.fillStyle = L.ink; g.font = `800 ${back ? 6.2 : 3.6}px "Barlow Condensed", sans-serif`; g.textAlign = "center"; g.fillText(p.num, back ? 0 : 2.2, back ? -24.4 : -25.4);
  g.fillStyle = L.skin; g.fillRect(-1.2, -35, 2.4, 2.6); g.beginPath(); g.arc(0, -37.6, 3.05, 0, Math.PI*2); g.fill();
  if (L.hair){
    g.fillStyle = L.hair; g.beginPath();
    if (back){ g.arc(0, -37.6, 3.05, Math.PI, 0); g.lineTo(3.05, -36.9); g.quadraticCurveTo(0, -35.2, -3.05, -36.9); }
    else { g.arc(0, -37.9, 3.05, Math.PI, 0); g.quadraticCurveTo(0, -39.4, -3.05, -37.9); }
    g.closePath(); g.fill();
  }
  if (p.me){ g.fillStyle = "#F5C542"; g.beginPath(); g.moveTo(-2.6, -45.6); g.lineTo(2.6, -45.6); g.lineTo(0, -42.4); g.closePath(); g.fill(); }
  g.restore();
}
// a player where he stands: his shadow, your ring under you, then him (facing away when he's heading up the pitch)
function p9DrawPlayer(g, M, p, q){
  const L = M.L[`${p.side}-${p.i}`], sc = q[2]*1.8*P9_BIG/40.5, lean = p.dive ? clamp(p.vx*9, -70, 70) : clamp(p.vx*.8, -6, 6);
  if (p.fy<-.15) p.bk = true; else if (p.fy>.15) p.bk = false;
  g.fillStyle = "rgba(0,0,0,.36)"; g.beginPath(); g.ellipse(q[0] + 1.6*sc, q[1] + .6*sc, 7.4*sc, 2.3*sc, 0, 0, Math.PI*2); g.fill();
  if (p.me){ g.fillStyle = "rgba(245,197,66,.16)"; g.strokeStyle = "#F5C542"; g.lineWidth = 1.5*sc; g.beginPath(); g.ellipse(q[0], q[1], 10.5*sc, 3.6*sc, 0, 0, Math.PI*2); g.fill(); g.stroke(); }
  p9DrawFig(g, p, L, q[0], q[1], sc, lean, !!p.bk, p.lift*q[2]);
}
// the ball: its shadow on the grass (smaller and fainter the higher it is), and the ball at its height, its patches
// turning as it rolls
function p9DrawBall(g, M, gq, bq){
  const b = M.ball, r = Math.max(1.6, .11*bq[2]*2.4), f = Math.max(.55, 1 - b.z/8);
  g.fillStyle = `rgba(0,0,0,${Math.max(.3, .55 - b.z/12).toFixed(2)})`; g.beginPath(); g.ellipse(gq[0], gq[1], r*1.25*f, r*.5*f, 0, 0, Math.PI*2); g.fill();
  const gr = g.createRadialGradient(bq[0] - r*.35, bq[1] - r*.4, r*.1, bq[0], bq[1], r); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.6, "#EEF2EF"); gr.addColorStop(1, "#9AA39D");
  g.fillStyle = gr; g.beginPath(); g.arc(bq[0], bq[1], r, 0, Math.PI*2); g.fill();
  g.fillStyle = "#15171A"; for (let i=0;i<3;i++){ const a = b.roll*2.2 + i*2.1; g.beginPath(); g.arc(bq[0] + Math.cos(a)*r*.48, bq[1] + Math.sin(a)*r*.48, r*.26, 0, Math.PI*2); g.fill(); }
  g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = Math.max(.4, r*.12); g.beginPath(); g.arc(bq[0], bq[1], r, 0, Math.PI*2); g.stroke();
}
// a goal: its net (dark behind, the mesh over it) and its white frame. The far one's frame is in front of its net; the
// near one's net is in front of its frame
function p9DrawGoal(g, M, far){
  const gy = far ? 0 : P9_L, b = far ? -2.2 : P9_L + 2.2, [x0, x1] = P9_GOAL, h = P9_BAR, bh = 2.05, w = .07;
  const net = () => { g.beginPath(); p9GPoly(g, M, [[x0, b, 0], [x1, b, 0], [x1, b, bh], [x0, b, bh]]); p9GPoly(g, M, [[x0, gy, h], [x1, gy, h], [x1, b, bh], [x0, b, bh]]);
    p9GPoly(g, M, [[x0, gy, 0], [x0, gy, h], [x0, b, bh], [x0, b, 0]]); p9GPoly(g, M, [[x1, gy, 0], [x1, gy, h], [x1, b, bh], [x1, b, 0]]);
    g.fillStyle = "rgba(6,18,11,.35)"; g.fill(); g.fillStyle = M.R.pat; g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.stroke(); };
  const frame = () => { g.beginPath(); p9GPoly(g, M, [[x0 - w, gy, 0], [x0 + w, gy, 0], [x0 + w, gy, h], [x0 - w, gy, h]]); p9GPoly(g, M, [[x1 - w, gy, 0], [x1 + w, gy, 0], [x1 + w, gy, h], [x1 - w, gy, h]]);
    p9GPoly(g, M, [[x0 - w, gy, h + w], [x1 + w, gy, h + w], [x1 + w, gy, h - w], [x0 - w, gy, h - w]]); g.fillStyle = "#F4F7F2"; g.fill(); };
  if (far){ net(); frame(); } else { frame(); net(); }
}
// the match screen: a canvas for the match, and the scoreboard, messages, joystick and buttons over and under it;
// drawn again after a shot or save mini-game has had the stage
function p9Draw(M, st, again){
  const us = typeof S!=="undefined" && S && S.player && !S.newing && S.club ? lvAbbr(S.club) : "YOU", them = lvAbbr(st.f.opp || "Lab XI");
  lvShow(`${lvHead(st)}<div class="lv-stage p9-stage"><canvas class="p9-cv" role="img" aria-label="The match"></canvas><div class="p9-fx" aria-hidden="true"></div>
      <div class="p9-bug" aria-live="polite"><span class="p9-t" style="--k:${M.kit.us}">${esc(us)}</span><b class="p9-sc">0–0</b><span class="p9-t" style="--k:${M.kit.them}">${esc(them)}</span><span class="p9-clk">0'</span></div>
      <button type="button" class="p9-pause" aria-label="Pause">II</button><div class="p9-msg" aria-live="assertive"></div><div class="p9-joy" hidden><i></i></div></div>
    <div class="p9-btns"><button type="button" class="btn big p9-b2">Pass</button><button type="button" class="btn big primary p9-b1">Shoot</button></div>
    <p class="hint p9-help">Drag anywhere on the pitch to run: the further you drag, the faster you go. ${again ? "" : "Arrow keys and Space / Enter work too."}</p>`);
  const $ = s => lvEl.querySelector(s), cv = $(".p9-cv"), g = cv.getContext("2d");
  lvEl.p9M = M;   // the match, for the lab's tests
  M.A ||= p9Assets(M.kit);
  M.L ||= Object.fromEntries(p9All(M).map(p=>[`${p.side}-${p.i}`, p9Look(p, M.kit)]));
  // (the night sky and the floodlights' glow behind, the haze and the darker corners in front, are the stage's own
  // backgrounds in the CSS: they never change, so they're never drawn again)
  M.R = {cv, g, pat:g.createPattern(M.A.net, "repeat"),
    sc:$(".p9-sc"), clk:$(".p9-clk"), msg:$(".p9-msg"), pause:$(".p9-pause"), b1:$(".p9-b1"), b2:$(".p9-b2"), last:{}};
  // the canvas's own pixels follow its size on the screen (up to twice the pixels for sharp screens)
  const fit = () => { const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(r.width*dpr)), h = Math.max(1, Math.round(r.height*dpr));
    if (cv.width!==w || cv.height!==h){ cv.width = w; cv.height = h; } };
  fit(); if (window.ResizeObserver) new ResizeObserver(fit).observe(cv);
  p9Wire(M, st);
  p9Paint(M);
}
// one frame: the sky, the stand, the pitch and its markings, the far goal, everyone on the pitch back to front, the
// near goal; then the scoreboard and the buttons
function p9Paint(M){
  const R = M.R; if (!R || !R.cv.isConnected) return;
  const g = R.g, b = M.ball;
  g.setTransform(R.cv.width/P9_SW, 0, 0, R.cv.height/P9_SH, 0, 0);
  // the floodlight towers, over the sky
  g.clearRect(0, 0, P9_SW, P9_SH);
  g.fillStyle = "#1B2530"; g.fillRect(28.5, 0, 3, 26); g.fillRect(P9_SW - 31.5, 0, 3, 26);
  g.fillStyle = "#FFF6D6"; [22, 30, 38, 46].forEach(x=>{ g.fillRect(x - 4, 22, 5, 3); g.fillRect(P9_SW - x - 1, 22, 5, 3); });
  // the stand (with the odd camera flash) and the boards, the ground, the pitch's stripes and its markings
  const sq = p9P(M, P9_STAND.x, P9_STAND.y, P9_STAND.h);
  if (sq){ g.drawImage(M.A.stand, sq[0], sq[1], P9_STAND.w*sq[2], P9_STAND.h*sq[2]);
    if (Math.random()<.3){ g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(sq[0] + Math.random()*P9_STAND.w*sq[2], sq[1] + (3 + Math.random()*13)*sq[2], Math.max(.6, .18*sq[2]), 0, Math.PI*2); g.fill(); } }
  g.fillStyle = "#174C2B"; g.beginPath(); p9GPatch(g, M, -14, -16, P9_W + 14, P9_L + 14); g.fill();
  g.fillStyle = "#1C6337"; g.beginPath(); p9GPatch(g, M, 0, 0, P9_W, P9_L); g.fill();
  g.fillStyle = "#22723F"; g.beginPath(); for (let j=1;j<20;j+=2) p9GPatch(g, M, 0, j*5.25, P9_W, (j + 1)*5.25); g.fill();
  g.fillStyle = "rgba(255,255,255,.88)"; g.beginPath(); P9_LINES.forEach(([x1, y1, x2, y2])=>p9GSeg(g, M, x1, y1, x2, y2, .065)); P9_SPOTS.forEach(pts=>p9GPoly(g, M, pts)); g.fill();
  const yN = Math.min(P9_L + 6, M.cam.y + P9_D - 2);
  g.fillStyle = "#0B1A12"; g.beginPath(); p9GPoly(g, M, [[-4, -6, 0], [-4, yN, 0], [-4, yN, .9], [-4, -6, .9]]); p9GPoly(g, M, [[P9_W + 4, -6, 0], [P9_W + 4, yN, 0], [P9_W + 4, yN, .9], [P9_W + 4, -6, .9]]); g.fill();
  const bt = p9P(M, -12, -6, .9); if (bt) g.drawImage(M.A.boards, bt[0], bt[1], 92*bt[2], .9*bt[2]);
  p9DrawGoal(g, M, true);
  // everyone on the pitch, and the ball, back to front
  const E = [];
  p9All(M).forEach(p=>{ const q = p9P(M, p.x, p.y, 0); if (q && q[1]<P9_SH + 90 && q[0]>-60 && q[0]<P9_SW + 60) E.push([q[1], ()=>p9DrawPlayer(g, M, p, q)]); });
  const gq = p9P(M, b.x, b.y, 0), bq = p9P(M, b.x, b.y, b.z + .11);
  if (gq && bq) E.push([gq[1] + .01, ()=>p9DrawBall(g, M, gq, bq)]);
  E.sort((x, y)=>x[0] - y[0]).forEach(e=>e[1]());
  p9DrawGoal(g, M, false);
  // you, when you're off the screen: an arrow at the edge pointing your way
  const yq = p9P(M, M.you.x, M.you.y, 0);
  if (!yq || yq[0]<0 || yq[0]>P9_SW || yq[1]>P9_SH || yq[1]<0){
    const ax = clamp(yq ? yq[0] : P9_SW/2 + (M.you.x - M.cam.x)*8, 14, P9_SW - 14), ay = yq ? clamp(yq[1], 70, P9_SH - 14) : P9_SH - 14;
    const ang = Math.atan2((yq ? yq[1] : P9_SH + 200) - ay, (yq ? yq[0] : ax) - ax) + Math.PI/2;
    g.save(); g.translate(ax, ay); g.rotate(ang); g.fillStyle = "#F5C542"; g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -9); g.lineTo(8, 7); g.lineTo(-8, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  // the score, the clock, the messages and the buttons (only touched when they change)
  const has = b.owner===M.you, gk = M.you.pos==="GK", near = !gk && b.owner && b.owner.side===1 && p9Dist(M.you, b.owner)<2.4;
  const ui = {sc:`${M.score[0]}–${M.score[1]}`, clk:`${p9Min(M)}'`, msg:M.hold ? "Paused" : M.msgT>0 ? M.msg : "", on:M.hold || M.msgT>0, pz:M.hold,
    b1:has ? (gk ? "Long kick" : "Shoot") : gk ? "In goal" : "Tackle", b1on:has || near, b2:has ? "Pass" : M.call>0 ? "Calling…" : "Call for it", b2on:has || (!gk && !!(b.owner && b.owner.side===0 && b.owner!==M.you))};
  const L = R.last, set = (k, f) => { if (L[k]!==ui[k]){ L[k] = ui[k]; f(ui[k]); } };
  set("sc", v=>{ R.sc.textContent = v; }); set("clk", v=>{ R.clk.textContent = v; }); set("msg", v=>{ R.msg.textContent = v; }); set("on", v=>R.msg.classList.toggle("on", v));
  set("pz", v=>{ R.pause.textContent = v ? "▶" : "II"; R.pause.setAttribute("aria-label", v ? "Carry on" : "Pause"); });
  set("b1", v=>{ R.b1.textContent = v; }); set("b1on", v=>{ R.b1.disabled = !v; R.b1.classList.toggle("primary", v); });
  set("b2", v=>{ R.b2.textContent = v; }); set("b2on", v=>{ R.b2.disabled = !v; });
}
// the joystick, the buttons and the keys
function p9Wire(M, st){
  const stage = lvEl.querySelector(".p9-stage"), joy = lvEl.querySelector(".p9-joy"), knob = joy.firstElementChild;
  stage.addEventListener("pointerdown", ev=>{ if (ev.target.closest("button")) return; ev.preventDefault(); try{ stage.setPointerCapture(ev.pointerId); }catch(e){}
    const r = stage.getBoundingClientRect(); M.joy = {on:true, ox:ev.clientX, oy:ev.clientY, dx:0, dy:0}; joy.hidden = false; joy.style.left = `${ev.clientX - r.left}px`; joy.style.top = `${ev.clientY - r.top}px`; knob.style.transform = ""; });
  stage.addEventListener("pointermove", ev=>{ if (!M.joy || !M.joy.on) return; let dx = ev.clientX - M.joy.ox, dy = ev.clientY - M.joy.oy; const m = Math.hypot(dx, dy); if (m>48){ dx *= 48/m; dy *= 48/m; }
    M.joy.dx = dx; M.joy.dy = dy; knob.style.transform = `translate(${dx}px,${dy}px)`; });
  const up = () => { if (M.joy) M.joy.on = false; joy.hidden = true; };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  lvEl.querySelector(".p9-b1").addEventListener("click", ()=>p9Act(M, st, 1));
  lvEl.querySelector(".p9-pause").addEventListener("click", ()=>{ if (!M.paused) M.hold = !M.hold; p9Paint(M); });
  lvEl.querySelector(".p9-b2").addEventListener("click", ()=>p9Act(M, st, 2));
}
function p9Act(M, st, k){
  if (M.paused || M.done) return;
  const b = M.ball, p = M.you;
  if (M.hold) return;
  if (b.owner===p && p.pos==="GK"){
    // in goal: a long kick up to the most open forward, or a short pass
    if (k===1){ const fw = M.us.filter(q=>["RW", "ST", "LW"].includes(q.pos)).sort((x, y)=>Math.min(...M.them.map(f=>p9Dist(f, y))) - Math.min(...M.them.map(f=>p9Dist(f, x))))[0]; return p9Pass(M, p, fw, .6 + st.lab.a.pas/250); }
    const [to, pt] = p9BestPass(M, p); if (to) p9Pass(M, p, to, .7 + st.lab.a.pas/200, pt); return;
  }
  if (b.owner===p){
    if (k===1) return p9YouShoot(M, st);
    const i = p9Input(M), [to, pt] = p9BestPass(M, p, i && i[2] ? [i[0], i[1]] : [p.fx, p.fy]);
    if (to) p9Pass(M, p, to, .7 + st.lab.a.pas/200, pt); return;
  }
  if (k===2){ if (b.owner && b.owner.side===0){ M.call = 2.5; p9Say(M, "Calling for it", .8); } return; }
  // a tackle: close enough, and it's down to your defending (and a bit of luck)
  const o = b.owner; if (!o || o.side!==1 || p9Dist(p, o)>2.4 || p.stun>0) return;
  M.me.tk++; p.kickT = .33;
  if (Math.random() < .38 + (st.lab.a.def - 60)/150){ M.me.tw++; Object.assign(b, {owner:p, last:p, pass:null}); o.stun = .7; p9Say(M, "Won it!", .9); }
  else { p.stun = .7; p9Say(M, "Missed the tackle", .9); }
}

/* ---------- the lab's game ---------- */
async function p9Run(st){
  const len = await lvAsk(`<div class="lv-card lab-pre"><div class="lv-eye">Play the 90 · development</div><h2 class="lv-t">How long?</h2>
    <p>A whole match, 11 against 11, as on TV. You're the ${esc(st.lab.pos)} with the gold ring: drag anywhere to run, and use the buttons to pass, shoot, call for it and tackle. Your shots are played as the shot mini-game.</p>
    <div class="lv-row">${[3, 5, 8].map(n=>`<button type="button" class="btn ${n===5 ? "primary" : ""} big" data-lv="${n}">${n} minutes</button>`).join("")}</div></div>`);
  if (st.lab.quit || !/^\d+$/.test(len)) return "skip";
  const M = p9New(st, +len);
  st.lab.tally = "";
  p9Draw(M, st);
  const off = lgKeys(k=>{
    const m = {ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1], a:[-1, 0], d:[1, 0], w:[0, -1], s:[0, 1]}[k];
    if (m){ if (m[0]) M.key.x = m[0]; if (m[1]) M.key.y = m[1]; return true; }
    if (k===" "){ p9Act(M, st, 1); return true; } if (k==="Enter" || k==="x"){ p9Act(M, st, 2); return true; }
    if (k==="p" || k==="Escape"){ if (!M.paused){ M.hold = !M.hold; p9Paint(M); } return true; }
  }, k=>{ if (["ArrowLeft", "ArrowRight", "a", "d"].includes(k)) M.key.x = 0; if (["ArrowUp", "ArrowDown", "w", "s"].includes(k)) M.key.y = 0; });
  try{
    await new Promise(res=>{
      let last = performance.now();
      const tick = now=>{
        if (st.lab.quit || !lvEl){ M.done = true; return res(); }
        const dt = Math.min(.05, (now - last)/1000); last = now;
        if (!M.paused && !M.hold){ p9Step(M, dt); p9Cam(M, dt); p9Paint(M); if (M.saveDue){ const by = M.saveDue; M.saveDue = null; p9YouSave(M, st, by); } }
        if (M.done) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  } finally { off(); }
  if (st.lab.quit) return "skip";
  const [f, a] = M.score, me = M.me, win = f>a;
  const gk = M.you.pos==="GK", rt = clamp(6.3 + (f - a)*.25 + me.g*.95 + me.a*.6 + me.tw*.12 + me.pc*.03 - (me.ps - me.pc)*.04 + (gk ? me.sv*.35 - a*.25 + (a===0 ? .7 : 0) : 0), 3.5, 10).toFixed(1);
  return {ok:win, big:win ? `Won ${f}–${a}` : f===a ? `Drew ${f}–${a}` : `Lost ${f}–${a}`,
    small:gk ? `You: ${me.sv} save${me.sv===1 ? "" : "s"}, ${a} conceded${a===0 ? " (a clean sheet)" : ""}, ${me.pc}/${me.ps} passes · rating ${rt}` : `You: ${me.g} goal${me.g===1 ? "" : "s"}, ${me.a} assist${me.a===1 ? "" : "s"}, ${me.pc}/${me.ps} passes, ${me.tw}/${me.tk} tackles · rating ${rt}`,
    score:`${M.log.length ? M.log.join(" · ") : "No goals"} · shots ${M.stat.sh[0]}–${M.stat.sh[1]} · possession ${Math.round(M.stat.pos[0]/Math.max(1, M.stat.pos[0] + M.stat.pos[1])*100)}%`};
}
const LAB_P90 = [{id:"p90", t:"Play the 90", d:"A whole match, as on TV, 11 against 11: you control your own player, the rest play themselves. Your shots are played as the shot mini-game.", cat:"full", ic:"move", help:"p90", run:p9Run}];
LV_HELP.p90 = {t:"Play the 90", steps:["A whole match, as on TV, with you as the player with the gold ring and arrow. The other 21 play themselves, and the camera follows the ball.",
  "<b>Put your finger down anywhere and drag</b> to run, like a joystick: the further you drag, the faster you go. Let go and you take up your position again. When you're off the screen, a gold arrow at the edge shows where you are.",
  "With the ball: <b>Pass</b> finds the best-placed team-mate the way you're running (a long one goes in the air), and <b>Shoot</b> stops the match for the shot mini-game.",
  "Without it: <b>Call for it</b> asks the man on the ball to pass to you, and <b>Tackle</b> goes in when you're close to their man on the ball."]};
