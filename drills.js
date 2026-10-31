/* ================= TRAINING DRILLS =================
   Once a week in the match centre you can do a drill for your training focus: a short, easier version of a match
   mini-game (shooting, passing, tackling, saves, free kicks) or one of two of its own (sprint starts for pace, a beep
   test for stamina). The better the session, the more that attribute grows on top of the week's training: a perfect
   score adds about the same again, and even a player at his peak gains a little. Free kicks for match prep sharpen
   you instead. The drill runs on the live match screen (moments.js) against teammates in training bibs, with the
   opponent set well below you, so every mini-game is at its most forgiving. A week's drill is kept on its week
   (S.mc.weeks[w].drill), so it can't be repeated. Loaded before game.js; only called once the game is running. */
const DR = {
  fin:{t:"Shooting practice", n:5, unit:"shots", help:"shot"},
  pas:{t:"Passing drill", n:5, unit:"passes", help:"pass"},
  pac:{t:"Sprint starts", n:5, unit:"sprints", help:"sprint"},
  def:{t:"Tackling drill", n:5, unit:"tackles", help:"tackle"},
  gk:{t:"Shot-stopping drill", n:5, unit:"shots to save", help:"save"},
  sta:{t:"Beep test", n:0, unit:"levels", help:"beep"},
  prep:{t:"Free kicks", n:3, unit:"free kicks", help:"shot"}
};
const DR_BEEP_MAX = 16;   // shuttles in a perfect beep test

Object.assign(LV_HELP, {
  drills:{t:"Training drills", steps:["Once a week you can do a <b>drill</b> for your training focus: a quicker, easier version of a match mini-game.",
    "The better the session, the more that attribute grows on top of the week's training. A perfect score adds about the same again.",
    "Drills are optional. Rest weeks have none, and you can't do one while you're injured."]},
  sprint:{t:"Sprint starts", steps:["The lights come on red, one by one, then turn <b>green</b>.", "Tap <b>Go!</b> (or anywhere on the track) the moment they go green.",
    "Too early is a false start and scores nothing. The quicker your reaction, the better."],
    svg:lvDemo("side", `<path d="M40 40v100" stroke="#fff" stroke-width="3"/>${lvMan(40, 112, "#F5C542")}<circle cx="190" cy="60" r="12" fill="#4ADE80"/><circle cx="220" cy="60" r="12" fill="#4ADE80"/><circle cx="250" cy="60" r="12" fill="#4ADE80"/>`, "TAP WHEN THE LIGHTS GO GREEN")},
  beep:{t:"Beep test", steps:["Your runner shuttles between two lines, a little faster every level.", "Tap <b>Turn!</b> as he reaches each line, while he's in the <b>green</b>.",
    "Too early or too late is a miss. Two misses and the test is over."],
    svg:lvDemo("none", `<rect x="20" y="40" width="44" height="100" rx="8" fill="rgba(74,222,128,.3)" stroke="#4ADE80"/><rect x="236" y="40" width="44" height="100" rx="8" fill="rgba(74,222,128,.3)" stroke="#4ADE80"/>${lvMan(250, 112, "#F5C542")}<path d="M90 96h120" stroke="#FFE9A8" stroke-width="3" stroke-dasharray="6 5"/>`, "TAP AS HE REACHES THE LINE")}
});

// this week's drill: what it is for your training focus (none on rest weeks)
function drInfo(k = S.train.focus){ return k==="rest" ? null : k==="def" && S.player.pos==="GK" ? DR.gk : DR[k] || null; }
function drWeek(){ const M = S.mc; return M && !M.done ? M.weeks[M.wi] : null; }
// what a session adds to its attribute: up to a normal week's growth again with a perfect score, and a little more
// even close to your ceiling (mcRoom), so drills still slow the decline after 30
function drGain(k, score){ const room = mcRoom(k); return +(score*(mcGrowth(S.age)*room + .05*Math.max(.3, room))).toFixed(2); }
// the drill's line in the match centre's training section
function drPanel(){
  const wk = drWeek(), k = S.train.focus, D = drInfo(k); if (!wk) return "";
  if (wk.drill){ const d = wk.drill; return `<div class="mc-drill done"><span>✓ <b>${esc(d.t)}</b>: ${esc(d.res)} · <b>${d.k==="prep" ? `Sharpness +${d.gain}` : `${esc(mcAttrName(d.k))} +${d.gain.toFixed(2)}`}</b></span></div>`; }
  if (!D) return "";
  if (mcInjury(mcFrac(S.mc.wi))) return `<div class="mc-drill"><span>No drills while you're injured.</span></div>`;
  const up = k==="prep" ? "up to +12 sharpness" : `up to +${drGain(k, 1).toFixed(2)} ${esc(mcAttrName(k))}`;
  return `<div class="mc-drill"><span><b>${esc(D.t)}</b> · ${D.n ? `${D.n} ${D.unit}` : "as long as you last"} · ${up}</span><button type="button" class="btn small primary" data-act="mc-drill">Start drill</button></div>`;
}
/* ---------- the arcade: the training ground's extra sessions ----------
   Once a week, on top of the drill, you can do one arcade session (labgames.js's LG_ARCADE games, played in full).
   It grows the attribute it works, a little less than a drill: up to about half a normal week's growth again. */
const DR_ARCADE = {keepy:["pas", "Keepy-uppy"], flickups:["pas", "Flick-ups"], crossbar:["fin", "Crossbar challenge"], targets:["fin", "Target practice"],
  slalom:["pac", "Dribble slalom"], golf:["pas", "Pass golf"], rondo:["pas", "Rondo"]};
const drArcadeGain = (k, score) => +(drGain(k, score)*.55).toFixed(2);
function drArcadePanel(){
  const wk = drWeek(); if (!wk) return "";
  if (wk.arcade){ const d = wk.arcade; return `<div class="mc-drill done dr-arcade"><span>✓ Arcade · <b>${esc(d.t)}</b>: ${esc(d.res)} · <b>${esc(mcAttrName(d.k))} +${d.gain.toFixed(2)}</b></span></div>`; }
  if (mcInjury(mcFrac(S.mc.wi))) return "";
  return `<div class="mc-drill dr-arcade"><span><b>Arcade</b> · one extra session this week, for a little more growth</span>
    <div class="dr-arc-btns">${Object.entries(DR_ARCADE).map(([id, [k, t]])=>`<button type="button" class="chip" data-act="mc-arcade" data-k="${id}">${esc(t)} <small>${esc(mcAttrName(k))}</small></button>`).join("")}</div></div>`;
}
async function drArcade(id){
  const wk = drWeek(), A = DR_ARCADE[id], g = (typeof LAB_NEW!=="undefined" ? LAB_NEW : []).find(x=>x.id===id);
  if (!wk || wk.arcade || !A || !g || mcInjury(mcFrac(S.mc.wi))) return;
  const [k, t] = A, a = mcA(), club = meta(S.mc.club), bib = lvNear(club.c1, "#F97316") ? "#0EA5E9" : "#F97316";
  const st = {f:{opp:"Training", oppStr:a[k] - 12, home:true}, X:{base:strOf(S.mc.club)}, ev:[], g:0, a:0, og:0, bonus:0, left:1, log:[],
    lab:{train:true, a, ease:clamp((a[k] - 62)/80, -.2, .3), kr:Math.max(45, strOf(S.mc.club) - 10), pos:S.player.pos, game:g, next:"Finish",
      kits:{us:club.c1, them:bib, usTrim:club.c2 || "#FFFFFF", themTrim:"#FFFFFF"}, cols:[club.c1, club.c2 || "#FFFFFF", "#F5C542", "#FFFFFF"]}};
  lvOpen("Training ground");
  try{
    if (!lvSeen()[g.help]) await lvHelp([g.help], true);
    const go = await lvAsk(`<div class="lv-card"><div class="lv-eye">Arcade · ${esc(mcDate(S.mc.wi))}</div><h2 class="lv-t">${esc(t)}</h2><p>${esc(g.d)} The better you do, the more your ${esc(mcAttrName(k))} grows.</p>
      <div class="lv-row"><button type="button" class="btn primary big" data-lv="go" data-lv-focus>Start</button><button type="button" class="btn" data-lv="no">Not now</button></div></div>`);
    if (go!=="go") return;
    let quit; const q = new Promise(r=>{ quit = r; }), box = lvEl;
    const onExit = e=>{ if (e.target.closest("[data-lv-skip]")){ st.lab.quit = true; quit("skip"); } };
    box.addEventListener("click", onExit);
    const R = await Promise.race([g.run(st).catch(e=>{ if (e==="lab-quit") return "skip"; throw e; }), q]).finally(()=>box.removeEventListener("click", onExit));
    if (!R || R==="skip") return;
    // how well it went: a pass is most of it, the rest from how far past the target you got
    const nums = String(R.big + " " + (R.score || "")).match(/\d+/g) || [], score = R.ok ? (id==="golf" ? .85 : clamp(.75 + .05*(+nums[0] || 0)/2, .75, 1)) : .3;
    const gain = drArcadeGain(k, score);
    S.attr[k] = +clamp(S.attr[k] + gain, 20, 99).toFixed(2);
    wk.arcade = {id, k, t, res:`${R.big}${R.small ? " · " + R.small : ""}`, gain};
    save();
    await lvAsk(`<div class="lv-card"><div class="lv-eye">Arcade · ${esc(t)}</div><h2 class="lv-t">${R.ok ? "Nailed it" : "Not this time"}</h2>
      <p>${esc(R.big)}${R.small ? `. ${esc(R.small)}` : ""}.</p>
      <div class="dr-gain"><span>${esc(mcAttrName(k))}</span><b>+${gain.toFixed(2)}</b><small>Now ${Math.round(S.attr[k])}</small></div>
      <button type="button" class="btn primary big" data-lv="ok" data-lv-focus>Back to the match centre</button></div>`);
  } finally { lvClose(); render(); }
}
// the drill's scoreboard: which rep you're on, how each went, and a way out
function drHead(st){
  if (st.lab) return labHead(st);   // a drill tried in the mini-game lab (lab.js)
  const D = st.drill;
  return `<div class="lv-top"><span class="lv-sc"><b>Training</b> · ${esc(D.t)}</span>
    ${D.n ? `<span class="lv-steps-dots" aria-label="${Math.min(st.i+1, D.n)} of ${D.n}">${[...Array(D.n)].map((_,j)=>`<i class="${j<st.got.length ? (st.got[j]>=.5 ? "on" : "off") : ""}"></i>`).join("")}</span>` : `<span>Level ${Math.floor(st.lvl/2)+1}</span>`}
    <button type="button" class="lv-skip" data-lv-skip>End drill</button></div>`;
}
// how a rep went, shown over the pitch for a moment before the next one
async function drFlash(ok, big, small){
  lv$(".lv-stage")?.insertAdjacentHTML("beforeend", lvResHTML({ok, big, small})); lvBuzz(ok ? "good" : "bad");
  lv$("[data-lv-skip]")?.remove(); lvEl.querySelectorAll(".lv-act").forEach(b=>{ b.disabled = true; });
  await lvWait(900);
}

/* ---------- the two drills of their own ---------- */
// sprint starts: resolves the reaction time in ms, -1 for a false start, or "skip"
function drSprintCore(st){
  const kit = lvKits(st);
  return new Promise(res=>{
    lvShow(`${drHead(st)}<h2 class="lv-t">Sprint starts</h2><p class="lv-s">Tap Go! the moment the lights turn green. Go before that and it's a false start.</p>
      <div class="lv-stage">${lvField("side", `<path d="M40 30v120" stroke="#fff" stroke-width="3"/><path d="M262 30v120" stroke="#F5C542" stroke-width="3" stroke-dasharray="7 6"/><g id="drRun">${lvMan(0, 0, kit.us, {ring:"#F5C542"})}</g>`)}
        <span class="dr-lights" aria-hidden="true"><i></i><i></i><i></i></span></div>
      <button type="button" class="btn primary big lv-act">Go!</button>`);
    lvSkippable(res);
    lvMove("#drRun", 40, 108);
    const lights = lvEl.querySelectorAll(".dr-lights i"), stage = lv$(".lv-stage"), t0 = performance.now(), wait = 1700 + Math.random()*1600;
    let green = 0, done = false;
    lvLoop(now=>{
      if (done) return false;
      const t = now - t0;
      if (!green) lights.forEach((l,i)=>l.classList.toggle("red", t > 250 + i*400));
      if (!green && t>=wait){ green = now; stage.dataset.go = 1; lights.forEach(l=>{ l.classList.remove("red"); l.classList.add("go"); }); }
      if (green && now-green > 1500){ go(); return false; }
    });
    const go = async ()=>{
      if (done) return; done = true; cancelAnimationFrame(lvRaf); lv$(".lv-act").disabled = true;
      const rt = green ? performance.now() - green : -1;
      if (rt>=0) await lvTween(clamp(450 + rt*1.2, 550, 2000), k=>lvMove("#drRun", 40 + 222*(1-Math.pow(1-k, 2)), 108));
      res(rt);
    };
    lvTap(lv$(".lv-act"), go); lvTap(stage, go);
    lvKey = k=>{ if (k==="go") go(); };
  });
}
// the beep test: tap as the runner reaches each line; each turn speeds him up. Resolves the shuttles completed
function drBeepCore(st){
  const kit = lvKits(st), e = lvEase(st, lvAttr(st).sta), zone = clamp(.15*(1 + e*1.1), .09, .22), x0 = 34, x1 = 266;
  return new Promise(res=>{
    lvShow(`${drHead(st)}<h2 class="lv-t">Beep test</h2><p class="lv-s">Tap Turn! as he reaches each line, while he's in the green. Two misses and you're out.</p>
      <div class="lv-stage">${lvField("none", `<rect x="${x0-12}" y="36" width="${(x1-x0)*zone+12}" height="110" rx="8" fill="rgba(74,222,128,.25)" stroke="#4ADE80" stroke-width="2"/>
          <rect x="${x1-(x1-x0)*zone}" y="36" width="${(x1-x0)*zone+12}" height="110" rx="8" fill="rgba(74,222,128,.25)" stroke="#4ADE80" stroke-width="2"/>
          <path d="M${x0} 30v122M${x1} 30v122" stroke="#F5C542" stroke-width="3"/><g id="drRun">${lvMan(0, 0, kit.us, {run:true})}</g>`)}
        <span class="dr-lives" aria-label="Misses left"><i></i><i></i></span></div>
      <button type="button" class="btn primary big lv-act">Turn!</button>`);
    lvSkippable(res);
    const stage = lv$(".lv-stage"), lives = lvEl.querySelectorAll(".dr-lives i");
    const t0 = performance.now() + 600; let p = .5, dir = 1, v = .5, last = t0, left = 2, n = 0, done = false, cooled = 0;
    const draw = () => lvMove("#drRun", x0 + (x1-x0)*p, 112);
    const miss = now => { left--; lives[left]?.classList.add("gone"); cooled = now; stage.dataset.miss = 2-left; if (left<=0) finish(); };
    const turn = () => { dir = -dir; n++; st.lvl = n; v *= 1.07; const head = lv$(".lv-top"); if (head) head.outerHTML = drHead(st); lv$("[data-lv-skip]")?.addEventListener("click", ()=>{ cancelAnimationFrame(lvRaf); lvKey = null; done = true; res(n); }); };
    draw();
    lvLoop(now=>{
      if (done) return false;
      if (now<t0) return;
      const dt = (now-last)/1000; last = now;
      p += dir*v*dt;
      // he reached the line and nobody told him to turn: a miss, and he turns anyway
      if (p>=1 || p<=0){ p = clamp(p, 0, 1); if (now-cooled > 200) miss(now); if (!done) turn(); }
      stage.dataset.near = (dir>0 ? p>=1-zone : p<=zone) ? 1 : 0;
      draw();
      if (n>=DR_BEEP_MAX){ finish(); return false; }
    });
    const tap = () => {
      if (done) return;
      const now = performance.now();
      // a double tap just after turning doesn't count against you
      if (dir>0 ? p>=1-zone : p<=zone){ turn(); cooled = now; stage.dataset.ok = n; }
      else if (now-cooled > 250) miss(now);
    };
    const finish = () => { if (done) return; done = true; cancelAnimationFrame(lvRaf); lv$(".lv-act").disabled = true; res(n); };
    lvTap(lv$(".lv-act"), tap); lvTap(stage, tap);
    lvKey = k=>{ if (k==="go") tap(); };
  });
}

/* ---------- a session ---------- */
// one rep of a rep-based drill: resolves a score from 0 to 1 (with what to flash), or "skip"
async function drRep(st, k){
  const m = {min:0, q:1, g:k==="def" ? "tackle" : "save"};
  if (k==="fin" || k==="prep"){
    const r = await lvShotCore(st, m, k==="prep" ? "freekick" : "box", drHead(st), k==="prep" ? "Free kick" : "Shooting practice"); if (r==="skip") return r;
    return {s:r.goal ? 1 : 0, big:r.big, small:r.small};
  }
  if (k==="pas"){
    const r = await lvPassCore(st, drHead(st), "Passing drill", "Drag the ball to the teammate who's free. The bibs keep moving.", 700); if (r==="skip") return r;
    return {s:r.ok ? 1 : 0, big:r.ok ? "Found him" : "Cut out", small:r.why};
  }
  if (k==="pac"){
    const rt = await drSprintCore(st); if (rt==="skip") return rt;
    // the quicker your pace, the more a slightly late start is forgiven
    const pace = (mcA().pac - 60)*1.5, s = rt<0 ? 0 : rt<=330 + pace ? 1 : rt<=460 + pace ? .6 : rt<=650 + pace ? .3 : 0;
    return {s, big:rt<0 ? "False start" : s>=1 ? "Rapid!" : s>=.6 ? "Good start" : s>0 ? "Slow start" : "Asleep", small:rt<0 ? "Wait for the green" : `${(rt/1000).toFixed(2)}s reaction`};
  }
  const R = await (S.player.pos==="GK" ? lvGameSave : lvGameTiming)(st, m); if (R==="skip") return R;
  return {s:R.ok ? 1 : 0, big:R.ok ? R.big : S.player.pos==="GK" ? "Goal" : "Missed it", small:R.ok ? R.small : S.player.pos==="GK" ? "Wrong way" : "Timing's off"};
}
async function drSession(st, k){
  const D = st.drill;
  if (k==="sta"){ const n = await drBeepCore(st); return {score:Math.min(1, n/DR_BEEP_MAX), res:`level ${Math.floor(n/2)+1}, ${n} shuttle${n===1?"":"s"}`}; }
  for (st.i=0; st.i<D.n; st.i++){
    const r = await drRep(st, k); if (r==="skip") break;
    st.got.push(r.s); await drFlash(r.s>=.5, r.big, r.small);
  }
  const tot = st.got.reduce((s,x)=>s+x, 0);
  return {score:tot/D.n, res:k==="pac" ? `${st.got.filter(x=>x>=.6).length} good starts out of ${D.n}` : `${tot} of ${D.n} ${D.unit}`};
}
async function drPlay(){
  const wk = drWeek(), k = S.train.focus, D = drInfo(k);
  if (!wk || wk.drill || !D || mcInjury(mcFrac(S.mc.wi))) return;
  const attr = k==="prep" ? mcA().fin : mcA()[k];
  const st = {drill:D, f:{opp:"Training", oppStr:attr - 16, home:true}, X:{base:strOf(S.mc.club)}, ev:[], left:1, i:0, got:[], lvl:0, log:[]};
  lvOpen();
  try{
    if (!lvSeen().drills) await lvHelp(["drills"], true);
    if (!lvSeen()[D.help]) await lvHelp([D.help], true);
    const go = await lvAsk(`<div class="lv-card"><div class="lv-eye">Training · ${esc(mcDate(S.mc.wi))}</div><h2 class="lv-t">${esc(D.t)}</h2>
      <p>${D.n ? `${D.n} ${D.unit}, easier than in a match.` : "Keep going as long as you can."} ${k==="prep" ? "A good session sharpens you for the next games." : `The better you do, the more your ${esc(mcAttrName(k).toLowerCase())} grows this week.`}</p>
      <div class="lv-row"><button type="button" class="btn primary big" data-lv="go" data-lv-focus>Start</button><button type="button" class="btn" data-lv="no">Not now</button></div></div>`);
    if (go!=="go") return;
    const {score, res} = await drSession(st, k);
    const gain = k==="prep" ? Math.round(12*score) : drGain(k, score);
    if (k==="prep") S.cond.sharp = Math.min(100, S.cond.sharp + gain);
    else S.attr[k] = +clamp(S.attr[k] + gain, 20, 99).toFixed(2);
    wk.drill = {k, t:D.t, res, score:+score.toFixed(2), gain};
    mcTrainNote(score);   // the manager saw it: good training gets you more game time
    save();
    await lvAsk(`<div class="lv-card"><div class="lv-eye">Training · ${esc(D.t)}</div>
      <h2 class="lv-t">${score>=.8 ? "Great session" : score>=.5 ? "Good session" : score>0 ? "Tough session" : "One to forget"}</h2>
      <p>${esc(res.charAt(0).toUpperCase() + res.slice(1))}.</p>
      <div class="dr-gain"><span>${k==="prep" ? "Sharpness" : esc(mcAttrName(k))}</span><b>+${k==="prep" ? gain : gain.toFixed(2)}</b><small>${k==="prep" ? `Now ${Math.round(S.cond.sharp)}` : `Now ${Math.round(S.attr[k])}, on top of this week's training`}</small></div>
      <p class="dr-imp">${esc(mcTrainLabel(mcTrainImp()))}: your chance of starting is now <b>${Math.round(mcStartChance()*100)}%</b>.</p>
      <button type="button" class="btn primary big" data-lv="ok" data-lv-focus>Back to the match centre</button></div>`);
  } finally { lvClose(); render(); }
}
