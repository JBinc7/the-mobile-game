/* ================= KEY MOMENTS =================
   Every match you're picked for is played as key moments, like FC's player career: four if you start, one or two
   off the bench, drawn by position from LV_POOL's mini-games: shots and free kicks, headers, passes, a full
   attacking move, take-ons and crosses; tackles, blocks and interceptions; and for keepers
   saves, penalties, claiming crosses and rushing out. How many are attacking rather than defending, and how good the
   chances are, follow how the match is going for your team (mcXg's expected goals each way). The rest of the match
   is simulated around them: the expected goals each way minus what the moments stand in for (LV_EV at average
   skill, scaled by chance quality), so the score always includes what you did. Each mini-game (LV_GAMES) resolves to
   a result R that lvApply turns into goals, assists, own goals, goals conceded and a rating bonus. */
const LV_POOL = {
  ST:{att:["shot:oneonone","shot:box","shot:long","header","move","takeon","pass","cross","lab:volley","lab:bicycle","lab:chip","lab:airduel","lab:dribble","lab:lob","lab:shield"], def:["intercept","tackle"]},
  LW:{att:["shot:box","shot:long","takeon","cross","move","pass","shot:oneonone","lab:skills","lab:dribble","lab:corner","lab:chip","lab:volley"], def:["intercept","tackle"]},
  RW:{att:["shot:box","shot:long","takeon","cross","move","pass","shot:oneonone","lab:skills","lab:dribble","lab:corner","lab:chip","lab:volley"], def:["intercept","tackle"]},
  CAM:{att:["shot:box","shot:long","pass","move","takeon","shot:freekick","shot:oneonone","lab:through","lab:onetwo","lab:skills","lab:bendit","lab:volley","lab:chip","lab:gap"], def:["intercept","tackle"]},
  CM:{att:["pass","move","shot:long","shot:box","takeon","lab:through","lab:switch","lab:onetwo","lab:gap","lab:shield","lab:volley"], def:["intercept","tackle","block","lab:blockit"]},
  CDM:{att:["pass","shot:long","move","takeon","lab:switch","lab:gap","lab:shield"], def:["intercept","tackle","block","header:def","lab:offside","lab:blockit"]},
  LB:{att:["cross","takeon","pass","move","shot:long","lab:corner","lab:switch","lab:dribble"], def:["tackle","intercept","block","header:def","lab:blockit","lab:clear"]},
  RB:{att:["cross","takeon","pass","move","shot:long","lab:corner","lab:switch","lab:dribble"], def:["tackle","intercept","block","header:def","lab:blockit","lab:clear"]},
  CB:{att:["header","pass","shot:long","lab:switch","lab:airduel"], def:["tackle","block","intercept","header:def","lab:offside","lab:clear","lab:blockit"]},
  GK:{att:[], def:["save","save","claim","rush","lab:fingertips","lab:fingertips"]}
};
// the games that started in the lab (labgames.js), played once as a match moment: what a success is worth, and the
// attribute that makes it easier. goal = you score; assist = you set one up (usually); chance = beat your man and
// it often ends in a goal or an assist; keep = keep the ball; def and save = stop them scoring; pen = a penalty
const LV_LABM = {volley:["goal","fin"], bicycle:["goal","fin"], chip:["goal","fin"], lob:["goal","fin"], topbins:["goal","fin"], bendit:["goal","fin"], flickpen:["pen","fin"],
  through:["assist","pas"], switch:["assist","pas"], corner:["assist","pas"], gap:["assist","pas"],
  onetwo:["chance","pas"], skills:["chance","pac"], dribble:["chance","pac"], airduel:["chance","def"], shield:["keep","sta"],
  offside:["def","def"], clear:["def","def"], blockit:["def","def"], fingertips:["save","def"]};
// the set piece a match sometimes hands you instead of one of your moments: who takes it, and how often
const LV_SETPIECE = {ST:["shot:pen",.14], LW:["shot:freekick",.12], RW:["shot:freekick",.12], CAM:["shot:pen",.12], CM:["shot:freekick",.1], CDM:["shot:freekick",.06], LB:["shot:freekick",.05], RB:["shot:freekick",.05], CB:["header",.12]};
// and keepers face the odd penalty
// expected goals each moment stands for at average skill: scored (attacking) or conceded (defending)
const LV_EV = {"shot:oneonone":.45, "shot:box":.34, "shot:long":.13, "shot:freekick":.17, "shot:pen":.76, header:.26, pass:.18, move:.3, takeon:.24, cross:.16,
  intercept:.1, tackle:.2, block:.28, "header:def":.22, save:.36, "save:pen":.6, claim:.14, rush:.3};
// the share of the goals your team concedes that a position's defending moments can stand for
Object.entries(LV_LABM).forEach(([id, [k]])=>{ LV_EV["lab:" + id] = {goal:id==="bicycle" ? .15 : id==="bendit" ? .17 : .3, pen:.76, assist:.16, chance:.2, keep:.05, def:.2, save:.36}[k]; });
const LV_DSHARE = {GK:.75, CB:.4, LB:.3, RB:.3, CDM:.25, CM:.15};
const LV_COLS = {l:75, c:150, r:225}, LV_ROWS = {t:50, b:98};
let lvEl = null, lvRaf = 0, lvKey = null;

// scoreboard names: Tottenham Hotspur → TOT, Manchester City → MCI, Real Madrid → MAD
function lvAbbr(n){
  const w = String(n).replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(x=>x && !/^(FC|AFC|AC|SC|SV|CF|CD|RC|RB|VfB|VfL|TSG|1|Real|Club|Borussia|Bayer|Inter)$/i.test(x));
  if (!w.length) return String(n).slice(0,3).toUpperCase();
  return (w.length>1 && w[0]==="Manchester" ? w[0][0] + w[1].slice(0,2) : w[0].slice(0,3)).toUpperCase();
}
function lvOpen(label = "Match"){
  lvEl = document.createElement("div"); lvEl.className = "lv"; lvEl.setAttribute("role", "dialog"); lvEl.setAttribute("aria-modal", "true"); lvEl.setAttribute("aria-label", label);
  document.body.appendChild(lvEl); document.documentElement.classList.add("lv-open");
}
function lvClose(){ if (typeof SND!=="undefined") SND.ambient(false); lvRelease(); lvCountNext = false; cancelAnimationFrame(lvRaf); lvKey = null; lvEl?.remove(); lvEl = null; document.documentElement.classList.remove("lv-open"); }
// a new screen eases in (only when it first appears: parts swapped in later, like a scoreboard, don't)
function lvShow(html){
  cancelAnimationFrame(lvRaf); lvKey = null; lvEl.innerHTML = `<div class="lv-in enter">${html}</div>`; lvEl.scrollTop = 0;
  const box = lvEl.firstElementChild; setTimeout(()=>box.classList.remove("enter"), 450);
  if (lvCountNext && box.querySelector(".lv-stage")){ lvCountNext = false; lvCountdown(); }
  if (typeof SND!=="undefined" && box.querySelector(".lv-stage")) SND.ambient(true);   // the crowd
  // in 3D: any mini-game without its own 3D scene is mirrored into one (g3d.js), once this one's had the chance to make its own
  if (typeof G3!=="undefined" && G3.ready()) setTimeout(()=>{ const stg = box.querySelector(".lv-stage"); if (stg && stg.isConnected && !stg.classList.contains("g3")) G3.mirror(stg, lv3dMirrorLooks()); }, 0);
  (lvEl.querySelector("[data-lv-focus]") || lvEl.querySelector("button:not([data-lv-skip]):not(.lv-tap)"))?.focus({preventScroll:true});   // never "Sim the rest" or a tap zone: an outline there looks like a hint
}
const lv$ = s => lvEl.querySelector(s);
// a screen whose buttons (data-lv="value") answer it
function lvAsk(html){ return new Promise(res=>{ lvShow(html); lvEl.querySelectorAll("[data-lv]").forEach(b=>b.addEventListener("click", ()=>res(b.dataset.lv))); }); }
// a tween stops (and never finishes) if its screen goes, so nothing carries on drawing after you've left
function lvTween(ms, step){ return new Promise(res=>{ const t0 = performance.now(), box = lvEl?.firstElementChild; const tick = now=>{ if (box && !box.isConnected) return; const k = Math.min(1, (now-t0)/ms); step(k); if (k<1) lvRaf = requestAnimationFrame(tick); else res(); }; lvRaf = requestAnimationFrame(tick); }); }
const lvWait = ms => new Promise(r=>setTimeout(r, ms));
/* ---------- the countdown: 3, 2, 1, Go! before each mini-game ----------
   The scene is on screen but frozen while it counts: the mini-games' clock (performance.now and the timestamps
   requestAnimationFrame hands out) is held, so nothing moves, no bar swings and no timer runs; taps and keys are ignored.
   A caller sets lvCountNext before starting a moment; the next screen with a stage counts down, once. */
const lvRealNow = performance.now.bind(performance), lvRealRaf = window.requestAnimationFrame.bind(window);
let lvHeld = 0, lvHoldAt = 0, lvCountNext = false, lvCountT = 0;
performance.now = () => lvRealNow() - lvHeld - (lvHoldAt ? lvRealNow() - lvHoldAt : 0);
window.requestAnimationFrame = cb => lvRealRaf(()=>cb(performance.now()));
function lvRelease(){ if (lvHoldAt){ lvHeld += lvRealNow() - lvHoldAt; lvHoldAt = 0; } clearTimeout(lvCountT); lvEl?.querySelector(".lv-count")?.remove(); }
function lvCountdown(){
  lvRelease(); lvHoldAt = lvRealNow();
  const box = lvEl.firstElementChild; box.insertAdjacentHTML("beforeend", `<div class="lv-count" aria-live="assertive"><b>3</b></div>`);
  const el = box.lastElementChild, b = el.firstElementChild, stg = box.querySelector(".lv-stage");
  if (stg){ const r = stg.getBoundingClientRect(), r0 = box.getBoundingClientRect(); b.style.top = (r.top - r0.top + r.height/2) + "px"; }   // over the middle of the pitch
  el.addEventListener("pointerdown", e=>{ e.preventDefault(); e.stopPropagation(); }, true);
  const step = n => { b.textContent = n || "Go!"; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); if (n){ lvCountT = setTimeout(()=>step(n - 1), 1000); } else lvCountT = setTimeout(lvRelease, 420); };
  step(3);
}
// one animation loop per mini-game: step(now) returns false to stop
function lvLoop(step){ const box = lvEl?.firstElementChild; const tick = now=>{ if (lvEl && (!box || box.isConnected) && step(now)!==false) lvRaf = requestAnimationFrame(tick); }; lvRaf = requestAnimationFrame(tick); }
document.addEventListener("keydown", e=>{
  if (!lvEl || !lvKey || lvHoldAt) return;
  const k = {" ":"go", Enter:"go", ArrowLeft:"l", ArrowRight:"r", ArrowUp:"c", ArrowDown:"c"}[e.key];
  if (!k || (k==="go" && e.target.closest && e.target.closest(".lv-aim, .lv-tap, [data-lv]"))) return;
  e.preventDefault(); lvKey(k);
});
// fast taps: act on pointerdown, and ignore the click that follows
function lvTap(el, fn){ if (!el) return; el.addEventListener("pointerdown", e=>{ e.preventDefault(); fn(e); }); el.addEventListener("click", e=>{ if (e.detail===0) fn(e); }); }
// a little buzz on phones that have it: a tap for a good result, a double for a bad one, a rumble for a goal
function lvBuzz(kind){ try{ navigator.vibrate?.(kind==="goal" ? [30, 50, 70] : kind==="bad" ? [14, 40, 14] : 18); }catch(e){} }
const lvEaseOut = k => 1 - Math.pow(1-k, 2.2), lvEaseInOut = k => k<.5 ? 2*k*k : 1 - Math.pow(2 - 2*k, 2)/2;

/* ---------- who's playing: a match in your career, or the lab's sandbox (lab.js) ----------
   A moment in the lab carries st.lab = {a:attributes, ease, pos, kits:{us, them, usTrim, themTrim}, cols}, and
   nothing it does reaches the career: no coins, no stats, no saves. */
const lvAttr = st => st.lab ? st.lab.a : mcA();
const lvPos = st => st.lab ? st.lab.pos : S.player.pos;
// the side you play for: your club, or your country at a tournament (tournament.js)
const lvUs = st => st.us || S.mc.club;
const lvCols = st => { if (st.lab) return st.lab.cols; const k = meta(lvUs(st)); return [k.c1, k.c2 || "#FFFFFF", "#F5C542", "#FFFFFF"]; };

/* ---------- drawing ---------- */
/* in 3D the from-above games are filmed by a TV camera (a tilted, perspective view), and LV_MAP (set by the 3D
   mirror while one's on) maps the 2D scene's points to where they are in the picture (fwd) and back (inv).
   Things laid over the picture remember their 2D point (--lx, --ly), so they can be put back when it changes */
let LV_MAP = null;
const lvPct = (x, y) => { const [X, Y] = LV_MAP ? LV_MAP.fwd(x, y) : [x, y]; return `left:${(X/3).toFixed(2)}%;top:${(Y/1.8).toFixed(2)}%;--lx:${(+x).toFixed(1)};--ly:${(+y).toFixed(1)}`; };
// a finger on the stage, as a point of the 2D scene (300 by 180)
function lvAt(ev, stage){ const r = stage.getBoundingClientRect(), x = (ev.clientX - r.left)/r.width*300, y = (ev.clientY - r.top)/r.height*180; return LV_MAP ? LV_MAP.inv(x, y) : [x, y]; }
// how much easier your attribute makes a moment against this opponent, with sharpness and form: about −0.35 to +0.35
// (in the lab, the difficulty you picked)
// mostly your own attribute (so a better finisher always gets a bigger green), a little the opponent, sharpness and form
const lvEase = (st, attr) => st.lab ? st.lab.ease : clamp((attr - 66)/55 + (attr - st.f.oppStr)/160 + (S.cond.sharp-60)/500 + (mcFormAvg()-6.6)/14, -.32, .4);
// light kit? (this file loads before game.js, so it can't use isLight while drawing the instruction diagrams)
function lvLight(hex){ const h = s => parseInt(String(hex).slice(s, s+2), 16) || 0; return (h(1)*299 + h(3)*587 + h(5)*114)/1000 > 150; }
function lvNear(x, y){ const h = s => [1,3,5].map(i=>parseInt(String(s).slice(i,i+2),16)||0), a = h(x), b = h(y); return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]) < 110; }
// both kits, kept apart when they clash; each kit's second colour goes on its collars, cuffs and shorts (LV_TRIM)
const LV_TRIM = {}, LV_SKIN = ["#F1C9A5","#D9A37A","#B57D52","#8A5A3B","#5C3A24"], LV_HAIR = ["#17130F","#2B1B12","#4A2E1A","#17130F","#B5872F","#0E0B09"];
function lvKits(st){
  if (st.lab){ const k = st.lab.kits; LV_TRIM[k.us] = k.usTrim; LV_TRIM[k.them] = k.themTrim; return {us:k.us, them:k.them}; }
  const us = meta(lvUs(st)), them = meta(st.f.opp);
  let t = them.c1, tt = them.c2;
  if (lvNear(us.c1, t)){ if (them.c2 && !lvNear(us.c1, them.c2)){ t = them.c2; tt = them.c1; } else { t = lvLight(us.c1) ? "#1F2937" : "#E5E7EB"; tt = null; } }
  LV_TRIM[us.c1] = us.c2; LV_TRIM[t] = tt;
  return {us:us.c1, them:t};
}
// a player seen from above or the front: (x, y) is where his feet are. Shirt and socks in the kit colour, shorts and
// trim in its second; skin and hair vary with where he stands, and you (o.ring) look like your player. o.run sets his
// legs going; o.back shows him from behind (the back of his head, his number on his back)
function lvMan(x, y, kit, o={}){
  let trim = o.trim || LV_TRIM[kit];
  if (!trim || lvNear(trim, kit)) trim = lvLight(kit) ? "#1F2937" : "#F3F4F6";
  // each player's own look (skin, hair, hairstyle), mixed from where he stands, his number and his kit
  const v = (Math.imul(Math.round(x*10) + 7, 73856093) ^ Math.imul(Math.round(y*10) + 3, 19349663) ^ Math.imul((+o.num || 0) + 11, 83492791) ^ Math.imul(parseInt(String(kit).slice(1, 7), 16) || 5, 2654435761)) >>> 0, me = !!(o.ring || o.you), you = me && typeof S!=="undefined" && S && S.player;
  const skin = o.skin || (you ? LV_SKIN[S.player.skin ?? 1] : LV_SKIN[v % LV_SKIN.length]) || LV_SKIN[1];
  const hair = you ? (S.player.hair==="none" ? null : HAIRC[S.player.hairColour] || LV_HAIR[0]) : LV_HAIR[(v >>> 4) % LV_HAIR.length];
  // drawn from athletes' proportions: a head about a sixth of his height, tapered thighs and calves, a V from shoulders
  // to waist, arms that narrow to the wrist, a jaw. Light from the top left: a highlight on that side, shade on the other
  const style = you ? (S.player.hair || "short") : ["short","fade","curly","buzz","short","long","fade","curly","short","buzz","none","fade"][(v >>> 7) % 12];
  const ink = lvLight(kit) ? "#15171A" : "#FFFFFF", boot = ["#0E1012","#0E1012","#F4F4F5","#0E1012","#1E3A8A","#0E1012","#B91C1C","#0E1012"][(v >>> 11) % 8];
  const f = n => n.toFixed(2);
  const leg = (sx, b) => { const d = sx<0 ? -1 : 1;
    return `<g class="lv-l${b}"><path d="M${f(sx-1.95)} -19.6H${f(sx+1.95)}L${f(sx+1.3)} -10.7Q${f(sx+1.75)} -7.6 ${f(sx+.9)} -2.7H${f(sx-.9)}Q${f(sx-1.75)} -7.6 ${f(sx-1.3)} -10.7Z" fill="${skin}"/>
      <path d="M${f(sx+.2*d)} -11.6q${f(.6*d)} .5 0 1.3" stroke="#000" stroke-opacity=".18" stroke-width=".35" fill="none"/>
      <path d="M${f(sx-1.6)} -8.9H${f(sx+1.6)}Q${f(sx+1.5)} -5.1 ${f(sx+1)} -2.3H${f(sx-1)}Q${f(sx-1.5)} -5.1 ${f(sx-1.6)} -8.9Z" fill="${kit}"/><path d="M${f(sx-1.6)} -8.3H${f(sx+1.6)}" stroke="${trim}" stroke-width=".75"/>
      <path d="M${f(sx+.35*d)} -8.9H${f(sx+1.6*d)}Q${f(sx+1.5*d)} -5.1 ${f(sx+d)} -2.3H${f(sx+.3*d)}z" fill="#000" opacity=".14"/>
      <path d="M${f(sx-1.15)} -2.8H${f(sx+1.15)}L${f(sx+1.25+.5*d)} -1.2Q${f(sx+(d>0 ? 3.6 : 1.4))} -.9 ${f(sx+(d>0 ? 3.5 : 1.3))} 0H${f(sx-(d>0 ? 1.3 : 3.5))}Q${f(sx-(d>0 ? 1.4 : 3.6))} -.9 ${f(sx-1.25+.5*d)} -1.2Z" fill="${boot}"/>
      <path d="M${f(sx-(d>0 ? 1.2 : 3.2))} -.35H${f(sx+(d>0 ? 3.2 : 1.2))}" stroke="${boot==="#F4F4F5" ? "#9CA3AF" : "#3B3F45"}" stroke-width=".45"/></g>`; };
  // an arm: a shoulder, a short sleeve, a bicep, a forearm that narrows to the wrist, and a hand
  const arm = (d, b) => `<g class="lv-a${b}"><path d="M${f(5.9*d)} -33L${f(8.3*d)} -31.8Q${f(9.2*d)} -29.6 ${f(8.9*d)} -27.4L${f(6.2*d)} -27.9Z" fill="${kit}"/>
    <path d="M${f(6.4*d)} -27.8L${f(8.9*d)} -27.4" stroke="${trim}" stroke-width=".9"/>
    <path d="M${f(7.75*d)} -27.4Q${f(9.5*d)} -25.9 ${f(9.05*d)} -23.7L${f(9.6*d)} -18.9" stroke="${skin}" stroke-width="2.05" stroke-linecap="round" fill="none"/>
    <path d="M${f(8.2*d)} -27.2Q${f(9.9*d)} -25.6 ${f(9.4*d)} -23.6" stroke="#000" stroke-opacity="${d>0 ? .16 : .06}" stroke-width=".7" fill="none"/>
    <ellipse cx="${f(9.75*d)}" cy="-17.9" rx="1.05" ry="1.3" fill="${skin}"/></g>`;
  const H = -37.2, head = `M-3.15 ${f(H - .7)}Q-3.25 ${f(H - 4)} 0 ${f(H - 4.15)}Q3.25 ${f(H - 4)} 3.15 ${f(H - .7)}Q3 ${f(H + 2.3)} 1.2 ${f(H + 3.2)}Q0 ${f(H + 3.6)} -1.2 ${f(H + 3.2)}Q-3 ${f(H + 2.3)} -3.15 ${f(H - .7)}Z`;
  const hairD = {
    short:o.back ? `<path d="M-3.25 ${f(H - .4)}Q-3.3 ${f(H - 4.3)} 0 ${f(H - 4.45)}Q3.3 ${f(H - 4.3)} 3.25 ${f(H - .4)}V${f(H + 1.4)}Q0 ${f(H + 2.6)} -3.25 ${f(H + 1.4)}Z" fill="${hair}"/>` : `<path d="M-3.25 ${f(H - .9)}Q-3.3 ${f(H - 4.4)} 0 ${f(H - 4.5)}Q3.3 ${f(H - 4.4)} 3.25 ${f(H - .9)}Q2.6 ${f(H - 2.7)} .4 ${f(H - 2.9)}Q-2.4 ${f(H - 2.8)} -3.25 ${f(H - .9)}Z" fill="${hair}"/>`,
    fade:`<path d="M-3.15 ${f(H - .6)}Q-3.2 ${f(H - 3.9)} 0 ${f(H - 4.05)}Q3.2 ${f(H - 3.9)} 3.15 ${f(H - .6)}${o.back ? `V${f(H + 1)}Q0 ${f(H + 1.9)} -3.15 ${f(H + 1)}Z` : `Q1.6 ${f(H - 2.2)} 0 ${f(H - 2.3)}Q-1.6 ${f(H - 2.2)} -3.15 ${f(H - .6)}Z`}" fill="${hair}" opacity=".55"/><path d="M-2.6 ${f(H - 3.5)}Q0 ${f(H - 5.6)} 2.6 ${f(H - 3.5)}Q0 ${f(H - 4.2)} -2.6 ${f(H - 3.5)}Z" fill="${hair}"/>`,
    curly:`<g fill="${hair}">${[[-2.5,-2.4],[0,-3.4],[2.5,-2.4],[-3.2,-.6],[3.2,-.6],[-1.3,-3.9],[1.3,-3.9],...(o.back ? [[-2.2,.9],[0,1.4],[2.2,.9]] : [])].map(([cx, cy])=>`<circle cx="${cx}" cy="${f(H + cy)}" r="1.5"/>`).join("")}</g>`,
    buzz:`<path d="M-3.15 ${f(H - .8)}Q-3.2 ${f(H - 4)} 0 ${f(H - 4.15)}Q3.2 ${f(H - 4)} 3.15 ${f(H - .8)}${o.back ? `V${f(H + 1)}Q0 ${f(H + 1.9)} -3.15 ${f(H + 1)}Z` : `Q1.6 ${f(H - 2.6)} 0 ${f(H - 2.7)}Q-1.6 ${f(H - 2.6)} -3.15 ${f(H - .8)}Z`}" fill="${hair}" opacity=".5"/>`,
    long:`<path d="M-3.45 ${f(H - .4)}Q-3.5 ${f(H - 4.5)} 0 ${f(H - 4.6)}Q3.5 ${f(H - 4.5)} 3.45 ${f(H - .4)}L3.6 ${f(H + (o.back ? 5.4 : 3.6))}Q2.9 ${f(H + 4.3)} 2.4 ${f(H + 3)}${o.back ? "" : `L2.6 ${f(H - 1.4)}Q0 ${f(H - 3.2)} -2.6 ${f(H - 1.4)}L-2.4 ${f(H + 3)}`}Q-2.9 ${f(H + 4.3)} -3.6 ${f(H + (o.back ? 5.4 : 3.6))}Z" fill="${hair}"/>`,
    none:""
  };
  const face = o.back ? "" : `<path d="M-2.05 ${f(H - .75)}h1.2a.6.38 0 0 1-1.2 0zM.85 ${f(H - .75)}h1.2a.6.38 0 0 1-1.2 0z" fill="#fff" opacity=".85"/>
    <circle cx="-1.45" cy="${f(H - .62)}" r=".33" fill="#1B1410"/><circle cx="1.45" cy="${f(H - .62)}" r=".33" fill="#1B1410"/>
    <path d="M-2.2 ${f(H - 1.6)}q.7-.35 1.4-.05M.8 ${f(H - 1.65)}q.7-.3 1.4.05" stroke="${hair || "#3A2A20"}" stroke-width=".42" stroke-linecap="round" fill="none"/>
    <path d="M.15 ${f(H - .4)}L.55 ${f(H + .9)}L-.05 ${f(H + 1)}" stroke="#000" stroke-opacity=".22" stroke-width=".32" fill="none"/>
    <path d="M-.85 ${f(H + 1.85)}q.85.35 1.7 0" stroke="#6B3B2E" stroke-width=".38" fill="none" opacity=".75"/>`;
  return `<g ${o.id?`id="${o.id}"`:""} class="lv-man${me ? " lv-you" : ""}" data-k="${kit}"${o.num ? ` data-n="${o.num}"` : ""}${o.run ? ` data-run="1"` : ""} transform="translate(${x} ${y}) scale(${o.s||1})">
    ${o.noShadow ? "" : `<ellipse cy="1" rx="8.6" ry="2.6" fill="rgba(0,0,0,.35)"/>`}
    ${o.ring ? `<circle cy="-20" r="22" fill="none" stroke="${o.ring}" stroke-width="2.5" opacity=".9"/><circle cy="-20" r="22" fill="${o.ring}" opacity=".08"/>` : ""}
    <g class="lv-fig">
    <g class="lv-legs${o.run ? " run" : ""}">${leg(-2.5, 1)}${leg(2.5, 2)}</g>
    <g class="lv-body">
    <path d="M-5.9 -20.8H5.9L7.1 -13.4H1.5L0 -15.4L-1.5 -13.4H-7.1Z" fill="${trim}"/><path d="M1.6 -20.8H5.9L7.1 -13.4H2.6Z" fill="#000" opacity=".12"/><path d="M0 -20.6V-15.6" stroke="#000" stroke-opacity=".12" stroke-width=".4"/>
    ${arm(-1, 1)}${arm(1, 2)}
    <path d="M-6.9 -31.4Q-7.3 -32.7 -5.6 -33.1L-2.6 -33.8Q0 -32.4 2.6 -33.8L5.6 -33.1Q7.3 -32.7 6.9 -31.4L6.1 -28.3L5.3 -20.3H-5.3L-6.1 -28.3Z" fill="${kit}"/>
    <path d="M2.2 -33.6L5.6 -33.1Q7.3 -32.7 6.9 -31.4L6.1 -28.3L5.3 -20.3H2.4Q3.4 -26 2.2 -33.6Z" fill="#000" opacity=".15"/>
    <path d="M-6.9 -31.4Q-7.3 -32.7 -5.6 -33.1L-3.9 -33.5Q-5.6 -30 -5.1 -26.4L-6.1 -28.3Z" fill="#fff" opacity=".1"/>
    <path d="M-3.4 -27.2Q-1.6 -26.2 0 -27M3.2 -24.4Q1.8 -23.4 .6 -24" stroke="#000" stroke-opacity=".1" stroke-width=".4" fill="none"/>
    <path d="M-5.3 -20.3H5.3" stroke="#000" stroke-opacity=".2" stroke-width=".5"/>
    <path d="M-1.55 -35.2H1.55L2 -33.2Q0 -32.2 -2 -33.2Z" fill="${skin}"/><path d="M.6 -35.2H1.55L2 -33.2Q1.2 -32.8.9 -32.9Z" fill="#000" opacity=".16"/>
    ${o.back ? `<path d="M-2.6 -33.5Q0 -32.9 2.6 -33.5" stroke="${trim}" stroke-width=".9" fill="none"/>` : `<path d="M-2.4 -33.6L0 -31.7L2.4 -33.6" fill="none" stroke="${trim}" stroke-width=".9" stroke-linejoin="round"/>`}
    <ellipse cx="-3.2" cy="${f(H - .2)}" rx=".62" ry="1" fill="${skin}"/><ellipse cx="3.2" cy="${f(H - .2)}" rx=".62" ry="1" fill="${skin}"/>
    <path d="${head}" fill="${skin}"/><path d="M1.4 ${f(H - 3.9)}Q3.25 ${f(H - 3.4)} 3.15 ${f(H - .7)}Q3 ${f(H + 2.3)} 1.2 ${f(H + 3.2)}Q2.2 ${f(H + .6)} 1.4 ${f(H - 3.9)}Z" fill="#000" opacity=".12"/>
    ${face}${hair ? (hairD[style] ?? hairD.short) : ""}
    ${o.num!=null ? `<text y="${o.back ? -23.4 : -24.4}" text-anchor="middle" font-size="${o.back ? 7.6 : 5.6}" font-weight="800" fill="${ink}" font-family="Barlow Condensed,sans-serif">${o.num}</text>` : ""}
    </g></g>
    ${o.mark ? `<path class="lv-mark-you" d="M-4.5 -53h9l-4.5 5.5z" fill="#F5C542" stroke="rgba(0,0,0,.4)" stroke-width=".6"/>` : ""}
    ${o.label ? `<text y="-48" text-anchor="middle" font-size="9" font-weight="700" fill="#FFE9A8" font-family="Barlow Condensed,sans-serif" letter-spacing=".5">${o.label}</text>` : ""}
  </g>`;
}
// shading for the ball, shared by every scene
const LV_DEFS = `<radialGradient id="lvBallG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#EEF2EF"/><stop offset="1" stop-color="#AEB6B0"/></radialGradient>
  <pattern id="lvNetS" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M3 0H0V3" fill="none" stroke="rgba(255,255,255,.45)" stroke-width=".6"/></pattern>`;
const lvPent = (r, rot) => [0,1,2,3,4].map(k=>{ const a = (rot + 72*k)*Math.PI/180; return [r*Math.cos(a), r*Math.sin(a)]; });
// a ball with its shadow (and, for one that flies, the ghosts of where it just was): lvBallAt and lvFly move it
function lvBallSvg(id, x, y, r=5, trail=true){
  const P = lvPent(r*.38, -90), seam = lvPent(r*.38, -90).map(([px,py], k)=>{ const [qx, qy] = lvPent(r*1.1, -90)[k]; return `M${px.toFixed(2)} ${py.toFixed(2)}L${qx.toFixed(2)} ${qy.toFixed(2)}`; }).join("");
  const patch = lvPent(r*1.02, -54).map(([px,py])=>`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${(r*.3).toFixed(2)}"/>`).join("");
  return `${trail ? `<g id="${id}-tr" fill="#fff" style="pointer-events:none">${[0,1,2,3,4].map(i=>`<circle r="${(r*(.85 - i*.13)).toFixed(2)}" data-r="${(r*(.85 - i*.13)).toFixed(2)}" opacity="0"/>`).join("")}</g>` : ""}
    <g id="${id}" transform="translate(${x} ${y})"><ellipse class="lv-bsh" cy="${(r*.95).toFixed(2)}" rx="${(r*1.05).toFixed(2)}" ry="${(r*.36).toFixed(2)}" fill="rgba(0,0,0,.38)"/>
    <g class="lv-bb"><clipPath id="${id}-c"><circle r="${r}"/></clipPath><circle r="${r}" fill="url(#lvBallG)"/>
      <g clip-path="url(#${id}-c)" fill="#15171A"><polygon points="${P.map(p=>p.map(v=>v.toFixed(2)).join(" ")).join(" ")}"/>${patch}<path d="${seam}" stroke="#15171A" stroke-width="${(r*.1).toFixed(2)}" fill="none"/></g>
      <circle r="${r}" fill="none" stroke="#15171A" stroke-width="${(r*.16).toFixed(2)}" opacity=".85"/><ellipse cx="${(-r*.35).toFixed(2)}" cy="${(-r*.42).toFixed(2)}" rx="${(r*.3).toFixed(2)}" ry="${(r*.2).toFixed(2)}" fill="#fff" opacity=".85"/></g></g>`;
}
// put a ball at (x, y), z above the ground, at scale s, turned spin degrees; trail leaves ghosts behind it
function lvBallAt(id, x, y, s=1, z=0, spin=0, trail=false){
  const g = lv$(id); if (!g) return;
  g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
  g.querySelector(".lv-bb")?.setAttribute("transform", `translate(0 ${(-z/s).toFixed(1)}) rotate(${spin.toFixed(0)})`);
  g.querySelector(".lv-bsh")?.setAttribute("opacity", (1 - Math.min(.8, z/45)).toFixed(2));
  const tr = lv$(`${id}-tr`); if (!tr) return;
  const P = tr._p ||= [], C = [...tr.children];
  if (!trail){ P.length = 0; C.forEach(c=>c.setAttribute("opacity", 0)); return; }
  P.unshift([x, y - z, s]); if (P.length>C.length*2 + 2) P.pop();
  C.forEach((c, i)=>{ const q = P[(i+1)*2]; if (!q) return; c.setAttribute("cx", q[0].toFixed(1)); c.setAttribute("cy", q[1].toFixed(1)); c.setAttribute("r", (c.dataset.r*q[2]).toFixed(2)); c.setAttribute("opacity", (.3 - i*.055).toFixed(2)); });
}
// a ball flying from a to b over ms: h is the top of its arc (0 keeps it on the ground), s0 and s1 its scale at either
// end, curve bends it sideways, spin is how many turns it makes
function lvFly(id, a, b, ms, o={}){
  const h = o.h || 0, s0 = o.s0 ?? 1, s1 = o.s1 ?? s0, ease = o.ease || lvEaseOut, cv = o.curve || 0, spin = o.spin ?? 1.2;
  return lvTween(ms, k=>{
    const q = ease(k), x = a[0] + (b[0]-a[0])*q + cv*Math.sin(Math.PI*q), y = a[1] + (b[1]-a[1])*q;
    lvBallAt(id, x, y, s0 + (s1-s0)*q, h*4*q*(1-q), k*360*spin, k<1);
  }).then(()=>lvBallAt(id, b[0], b[1], s1, 0, spin*360, false));
}
// a short animation on a player (a CSS class, taken off again when it's done): a kick or a jump
function lvAnim(sel, cls, ms){ lvEl?.querySelectorAll(sel).forEach(g=>{ g.classList.remove(cls); void g.getBBox; g.classList.add(cls); setTimeout(()=>g.classList.remove(cls), ms); }); }
const lvKick = (sel = ".lv-you") => { if (typeof SND!=="undefined") SND.kick(); return lvAnim(sel, "kick", 330); }, lvHop = sel => lvAnim(sel, "hop", 460);
// a goal: you celebrate, arms up, and the crowd jumps
function lvCheer(){
  lvEl?.querySelectorAll(".lv-you").forEach(g=>{ g.querySelector(".lv-legs")?.classList.remove("run"); g.classList.add("cheer"); });
  lvEl?.querySelectorAll(".lv-crowd").forEach(c=>c.classList.add("roar"));
}
// your boot swinging through the ball at the bottom of a goal scene, in the pair you're wearing; resolves as it
// makes contact, and follows through while the ball flies
function lvStrike(st){
  const svg = lv$(".lv-stage svg"); if (!svg || typeof shopBootArt!=="function") return Promise.resolve();
  const worn = mcBoot(), sock = st ? lvKits(st).us : "#1F2937";
  svg.insertAdjacentHTML("beforeend", `<g class="lv-boot" style="pointer-events:none"><g transform="scale(-.92 .92)"><path d="M-57 -24-59 -41h19l-5 18z" fill="${sock}" stroke="rgba(0,0,0,.3)" stroke-width="1"/><path d="M-59 -41-60 -52h20l-1 11z" fill="${sock}" opacity=".45"/>${shopBootArt(worn ? worn.k : null, worn ? Account.locker().boots[worn.k] : 0, {x:-62, y:-30})}</g></g>`);
  const b = svg.lastElementChild, at = k => `translate(${(240 - 78*k).toFixed(1)} ${(204 - 34*k).toFixed(1)}) rotate(${(34 - 36*k).toFixed(1)})`;
  b.setAttribute("transform", at(0));
  return lvTween(105, k=>b.setAttribute("transform", at(k*k))).then(()=>{
    if (typeof SND!=="undefined") SND.kick(1);   // contact
    const t0 = performance.now(), f = now=>{ const k = Math.min(1, (now - t0)/260); b.setAttribute("transform", at(1 + .45*lvEaseOut(k))); b.setAttribute("opacity", (1 - k*k).toFixed(2)); if (k<1 && b.isConnected) requestAnimationFrame(f); else b.remove(); };
    requestAnimationFrame(f);
  });
}
/* ---------- dragging the ball ----------
   Shots, passes, crosses and the square ball are played by dragging: put a finger on the pitch (the ball's the natural
   place), drag, and let go. Positions come in the scene's coordinates (300 by 180), and a gold line runs from the ball
   to your finger. A tap (a short press that hardly moves) is reported as one, so tapping still works where it did. */
function lvDrag(stage, o){
  const at = ev => lvAt(ev, stage);
  const svg = stage.querySelector("svg"); let d = null, line = null;
  const draw = p => { if (!o.from || !svg) return; if (!line){ svg.insertAdjacentHTML("beforeend", `<path class="lv-dragline" fill="none" stroke="#F5C542" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 5" opacity=".9"/>`); line = svg.lastElementChild; }
    line.setAttribute("d", p ? `M${o.from[0].toFixed(1)} ${o.from[1].toFixed(1)}L${p[0].toFixed(1)} ${p[1].toFixed(1)}` : ""); };
  stage.addEventListener("pointerdown", ev=>{
    if (d || ev.target.closest("button") || (o.ok && !o.ok())) return;
    ev.preventDefault(); try{ stage.setPointerCapture(ev.pointerId); }catch(e){}
    const p = at(ev); d = {p0:p, t0:performance.now(), moved:0, open:null}; o.start?.(p, d);
  });
  stage.addEventListener("pointermove", ev=>{ if (!d) return; const p = at(ev); d.moved = Math.max(d.moved, Math.hypot(p[0] - d.p0[0], p[1] - d.p0[1])); if (d.moved>=6) draw(o.line ? o.line(p, d) : p); o.move?.(p, d); });
  stage.addEventListener("pointerup", ev=>{ if (!d) return; const p = at(ev), dd = d; d = null; draw(null); o.end?.(p, dd, dd.moved<10 && performance.now() - dd.t0<260); });
  stage.addEventListener("pointercancel", ()=>{ if (!d) return; d = null; draw(null); o.cancel?.(); });
}
// which of some targets a drag from `from` towards `p` is pointing at (the nearest in angle, within 35°), or -1
function lvDragPick(from, p, targets){
  const a = Math.atan2(p[1] - from[1], p[0] - from[0]); let best = -1, bd = .62;
  if (Math.hypot(p[0] - from[0], p[1] - from[1]) < 16) return -1;
  targets.forEach((t, i)=>{ if (!t) return; const b = Math.atan2(t[1] - from[1], t[0] - from[0]), dd = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); if (dd<bd){ bd = dd; best = i; } });
  return best;
}
// a player (any <g> drawn at the origin) gliding to (x, y)
const lvGlide = (id, a, b, ms, ease = lvEaseInOut) => lvTween(ms, k=>{ const q = ease(k); lvMove(id, a[0] + (b[0]-a[0])*q, a[1] + (b[1]-a[1])*q); });
// a pitch from above: attacking the goal at the top, or defending yours at the bottom ("side" puts the goal on the right)
function lvField(goal, inner=""){
  const box = goal==="top" ? `<rect x="90" y="5" width="120" height="44"/><rect x="124" y="5" width="52" height="16"/><path d="M120 49a30 30 0 0 0 60 0"/>`
    : goal==="bottom" ? `<rect x="90" y="131" width="120" height="44"/><rect x="124" y="159" width="52" height="16"/><path d="M120 131a30 30 0 0 1 60 0"/>`
    : goal==="side" ? `<rect x="236" y="40" width="59" height="100"/><rect x="273" y="66" width="22" height="48"/>` : `<circle cx="150" cy="90" r="24"/><path d="M150 5v170"/>`;
  // the goal behind the line: its net, and the posts throwing a little shadow on the grass
  const net = goal==="top" ? `<rect x="133" y="0" width="34" height="5" fill="rgba(6,18,11,.6)"/><rect x="133" y="0" width="34" height="5" fill="url(#lvNetS)"/><path d="M132 0v6.5M168 0v6.5" stroke="#F4F7F2" stroke-width="2.6"/><path d="M133 7.4h35" stroke="rgba(0,0,0,.25)" stroke-width="1.6"/><circle cx="150" cy="30" r="1.4" fill="rgba(255,255,255,.6)"/>`
    : goal==="bottom" ? `<rect x="133" y="175" width="34" height="5" fill="rgba(6,18,11,.6)"/><rect x="133" y="175" width="34" height="5" fill="url(#lvNetS)"/><path d="M132 173.5v6.5M168 173.5v6.5" stroke="#F4F7F2" stroke-width="2.6"/><circle cx="150" cy="150" r="1.4" fill="rgba(255,255,255,.6)"/>`
    : goal==="side" ? `<rect x="295" y="74" width="5" height="32" fill="rgba(6,18,11,.6)"/><rect x="295" y="74" width="5" height="32" fill="url(#lvNetS)"/><path d="M293.5 73h6.5M293.5 107h6.5" stroke="#F4F7F2" stroke-width="2.6"/>` : "";
  // mown stripes, a little grass texture, the lines, and the floodlights fading towards the corners
  return `<svg viewBox="0 0 300 180" aria-hidden="true" data-view="${goal || "none"}"><defs>${LV_DEFS}<radialGradient id="lvVg" cx="50%" cy="45%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></radialGradient>
      <linearGradient id="lvSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".07"/><stop offset=".5" stop-color="#FFF6D6" stop-opacity="0"/></linearGradient>
      <pattern id="lvGr" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 6.5 2.4 4M4.6 3.5 6 1" stroke="#fff" stroke-opacity=".05" stroke-width="1"/></pattern></defs>
    <rect width="300" height="180" fill="#195C33"/>
    ${[0,2,4,6,8].map(i=>goal==="side" ? `<rect x="${i*30}" width="30" height="180" fill="#1E6A3B"/>` : `<rect y="${i*18}" width="300" height="18" fill="#1E6A3B"/>`).join("")}
    <rect width="300" height="180" fill="url(#lvGr)"/><rect width="300" height="180" fill="url(#lvSun)"/>
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5"><rect x="5" y="5" width="290" height="170"/>${box}</g>${net}
    <rect width="300" height="180" fill="url(#lvVg)"/>${inner}</svg>`;
}
// the crowd in the stands behind the goal: heads in four rows, some in your colours, and the odd camera flash
function lvCrowd(){
  const R = seeded(77), cols = ["#26332D","#33413A","#1E2A25","#3D4A43"], k = typeof S!=="undefined" && S && S.mc ? [meta(S.mc.club).c1] : ["#F5C542"];
  return `<g class="lv-crowd" opacity=".55">${[0,1,2,3].map(r=>`<g class="lv-cr">${[...Array(33)].map((_,i)=>{ const c = R()<.16 ? k[0] : cols[Math.floor(R()*cols.length)];
    return `<circle cx="${(i*9.4 + (r%2)*4.7 + R()*2).toFixed(1)}" cy="${(14 + r*20 + R()*3).toFixed(1)}" r="${(3.6 + R()*1.2).toFixed(1)}" fill="${c}"/><rect x="${(i*9.4 + (r%2)*4.7 - 4.5).toFixed(1)}" y="${(18 + r*20).toFixed(1)}" width="9" height="9" rx="3" fill="${c}"/>`; }).join("")}</g>`).join("")}</g>
    <g fill="#fff">${[...Array(7)].map((_,i)=>`<circle class="lv-flash" cx="${(18 + R()*264).toFixed(0)}" cy="${(12 + R()*70).toFixed(0)}" r="1.6" style="animation-delay:${(R()*4).toFixed(2)}s"/>`).join("")}</g>`;
}
// the goal from the front, with the keeper (you, when me is set; none with o.empty) and, for free kicks, a wall
function lvGoalSvg(kc, wall, me, o={}){
  const you = me && typeof S!=="undefined" && S && S.player;
  const skin = you ? LV_SKIN[S.player.skin ?? 1] : "#D9A37A", hair = you ? (S.player.hair==="none" ? null : HAIRC[S.player.hairColour]) : "#1A120D";
  const ink = lvLight(kc) ? "#15171A" : "#FFFFFF", trim = LV_TRIM[kc] && !lvNear(LV_TRIM[kc], kc) ? LV_TRIM[kc] : lvLight(kc) ? "#1F2937" : "#E5E7EB";
  // o.dist: how far out it's taken, in metres, for 3D (a free kick, a chip); 2D's picture is the same either way
  return `<svg viewBox="0 0 300 180" aria-hidden="true" data-view="goal"${me ? ` data-kme="1"` : ""}${o.dist ? ` data-dist="${o.dist}"` : ""}${o.run ? ` data-run="1"` : ""}>
    <defs>${LV_DEFS}<pattern id="lvNet" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1"/></pattern>
      <linearGradient id="lvPostV" x1="0" x2="1"><stop offset="0" stop-color="#BFC6C1"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#A3ABA6"/></linearGradient>
      <linearGradient id="lvPostH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#A3ABA6"/></linearGradient>
      <linearGradient id="lvTurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17542E"/><stop offset="1" stop-color="#22743F"/></linearGradient>
      <radialGradient id="lvLight" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".22"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient></defs>
    <rect width="300" height="180" fill="#08180F"/>
    ${lvCrowd()}<rect width="300" height="180" fill="url(#lvLight)"/>
    <rect y="100" width="300" height="24" fill="#0B1A12"/>${[0,1,2,3,4,5].map(i=>`<text x="${25+i*50}" y="116" text-anchor="middle" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="10" letter-spacing="1" fill="${i%2 ? "#F5C542" : "#7FD7C4"}" opacity=".38">PYRAMID</text>`).join("")}
    <rect y="124" width="300" height="56" fill="url(#lvTurf)"/><path d="M0 138h300M0 158h300" stroke="rgba(255,255,255,.05)" stroke-width="9"/><path d="M60 180 108 124M240 180 192 124" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>
    <path d="M30 20 16 32v92h14zM270 20l14 12v92h-14z" fill="url(#lvNet)" opacity=".7"/><path d="M30 20 16 32v92M270 20l14 12v92" fill="none" stroke="rgba(244,247,242,.5)" stroke-width="1.5"/>
    <rect x="30" y="20" width="240" height="104" fill="#06120B" opacity=".55"/><rect x="30" y="20" width="240" height="104" fill="url(#lvNet)"/><rect x="30" y="22" width="240" height="5" fill="#000" opacity=".22"/>
    <g id="lvRip" opacity="0"><ellipse class="lv-rb" rx="1" ry="1" fill="rgba(0,0,0,.4)"/><circle class="lv-rr" r="1" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2"/></g>
    <rect x="27.5" y="17.5" width="5" height="107" fill="url(#lvPostV)"/><rect x="267.5" y="17.5" width="5" height="107" fill="url(#lvPostV)"/><rect x="27.5" y="17.5" width="245" height="5" rx="1.5" fill="url(#lvPostH)"/>
    <path d="M0 124h300" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    ${o.extra || ""}
    <g id="lvKp" transform="translate(150 84)" ${o.empty ? `style="display:none"` : ""}><ellipse cy="41" rx="17" ry="3.6" fill="rgba(0,0,0,.4)"/><g class="lv-kbody">
      <path d="M-6 16v20M6 16v20" stroke="${skin}" stroke-width="6.5" stroke-linecap="round"/><path d="M-6 26v12M6 26v12" stroke="${kc}" stroke-width="7" stroke-linecap="round"/><path d="M-10 39.5h7M3 39.5h7" stroke="#0E1012" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M-11 10h22l1 9h-10l-2-2-2 2h-10z" fill="${trim}"/>
      <g class="lv-karms"><path d="M-10 -8L-26 -24M10 -8L26 -24" stroke="${kc}" stroke-width="7" stroke-linecap="round"/><path d="M-21 -19l-3 -3M21 -19l3 -3" stroke="${trim}" stroke-width="7.5" stroke-linecap="round"/>
        <path d="M-27.5 -31.5l-4.6 1.6 1 6.4 4.4 1.8 3.6-3.4z" fill="#C8F04A" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><path d="M27.5 -31.5l4.6 1.6-1 6.4-4.4 1.8-3.6-3.4z" fill="#C8F04A" stroke="rgba(0,0,0,.35)" stroke-width=".8"/></g>
      <rect x="-11" y="-14" width="22" height="27" rx="8" fill="${kc}" stroke="rgba(0,0,0,.35)"/><path d="M3 -13.5q6 1 8 4v22h-8z" fill="#000" opacity=".14"/><path d="M-4 -14q4 3 8 0" fill="none" stroke="${trim}" stroke-width="2"/>
      <text y="3" text-anchor="middle" font-size="11" font-weight="900" fill="${ink}" opacity=".9" font-family="Big Shoulders Display,Impact,sans-serif">1</text>
      <circle cy="-22" r="7.5" fill="${skin}"/><path d="M2.4 -28.5a7.5 7.5 0 0 1 0 13a7.5 7.5 0 0 0 0-13z" fill="#000" opacity=".12"/>${hair ? `<path d="M-7.5 -23a7.5 7.5 0 0 1 15 0q-3-3-7.5-3t-7.5 3z" fill="${hair}"/>` : ""}</g></g>
    ${wall ? [126,142,158,174].map(x=>lvMan(x, 152, wall, {s:1.15})).join("") : ""}
    ${lvBallSvg("lvBall", 150, 166, 7)}
  </svg>`;
}
const lvMove = (id, x, y, rot=0, sc=1) => lv$(id)?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(2)})`);
// the net bulging where a goal went in
function lvRipple(x, y){
  const g = lv$("#lvRip"); if (!g) return Promise.resolve();
  g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`); g.setAttribute("opacity", 1);
  const e = g.querySelector(".lv-rb"), c = g.querySelector(".lv-rr");
  return lvTween(520, k=>{ const q = lvEaseOut(k); e.setAttribute("rx", (4 + 22*q).toFixed(1)); e.setAttribute("ry", (3 + 14*q).toFixed(1)); c.setAttribute("r", (4 + 30*q).toFixed(1)); g.setAttribute("opacity", (1 - k*.85).toFixed(2)); });
}
// the power bar: a green zone, and a marker moved by transform so the page never has to lay out again
const lvBarHTML = (mid, zone) => `<div class="lv-bar" aria-hidden="true"><span class="lv-zone" style="left:${((mid-zone/2)*100).toFixed(1)}%;width:${(zone*100).toFixed(1)}%"></span><span class="lv-mark"></span></div>`;
function lvBarSet(p, lo, hi){ const m = lv$(".lv-mark"); if (!m) return; m.style.transform = `translateX(${(p*100).toFixed(2)}%)`; m.parentNode.classList.toggle("in", p>=lo && p<=hi); }

/* ---------- the match ---------- */
// 92 is "90+2'" in normal time; in extra time the clock just runs on to 120
const lvMinTxt = (st, min) => min>90 && !st.et ? `90+${min - 90}'` : min>120 ? `120+${min - 120}'` : `${min}'`;
function lvScore(st, min){ let f = 0, a = 0; st.ev.forEach(e=>{ if (e.min<min){ if (e.us) f++; else a++; } }); return [f, a]; }
function lvHead(st, min, step){
  if (st.lab && !st.lab.match) return labHead(st, step);   // the mini-game lab (lab.js) has its own
  if (st.lab && min==null) min = st.lab.min;   // a lab game played as a match moment (lvGameLab)
  if (st.drill) return drHead(st);   // a training drill (drills.js) has its own scoreboard
  const [f, a] = lvScore(st, min), left = st.f.home || st.f.neutral, us = lvAbbr(left ? lvUs(st) : st.f.opp), them = lvAbbr(left ? st.f.opp : lvUs(st));
  const [l, r] = left ? [f, a] : [a, f];
  return `<div class="lv-top"><span class="lv-sc"><b>${esc(us)}</b> ${l}–${r} <b>${esc(them)}</b></span><span>${lvMinTxt(st, min)}</span>
    ${step ? `<span class="lv-steps-dots" aria-label="Step ${step[0]} of ${step[1]}">${[...Array(step[1])].map((_,i)=>`<i class="${i<step[0]?"on":""}"></i>`).join("")}</span>` : ""}
    ${st.left>1 || step ? `<button type="button" class="lv-skip" data-lv-skip>Sim the rest</button>` : ""}</div>`;
}
// which moments come your way. A starter gets about four: more against weaker teams and when your team's on a run,
// fewer against the best (keepers the other way round: the better the opponent, the more saves to make), and more
// attacking ones the more your team is on top. The chances can't promise more goals than the match would give
// (quality q), and the base simulation gives up what they stand for
function lvPlan(f, X){
  const pos = S.player.pos, me = f.me, P = LV_POOL[pos] || LV_POOL.CM, dom = X.lf/(X.lf + X.la), tf = X.tf || 0;
  const pAtt = !P.att.length ? 0 : !P.def.length ? 1 : clamp((MC_ATT[pos] ?? .5) + (dom-.5)*.7, .1, .92);
  const edge = pos==="GK" ? (.5-dom)*5 - tf*.6 : (dom-.5)*5 + tf*.9;
  // fewer moments the less you play: a tired starter subbed on the hour gets about two-thirds of a full game's
  const n = me.st==="sub" ? (me.mins>=30 ? 2 : 1) : clamp(Math.round((4 + edge + Math.random() - .5)*Math.min(1, me.mins/86)), 1, 6), bag = {att:[], def:[]};
  // every match a bit different: within a match no mini-game repeats until the pool's used up, and across matches
  // the ones you've had lately are less likely (S.lvRecent remembers your last dozen or so)
  const recent = (typeof S!=="undefined" && S && S.lvRecent) || [];
  const weight = id => 1/(1 + 2.2*recent.filter(x=>x===id).length + (recent.slice(-4).includes(id) ? 1.5 : 0));
  const draw = side => {
    if (!bag[side].length) bag[side] = P[side].slice();
    const w = bag[side].map(weight), tot = w.reduce((a,b)=>a+b, 0); let r = Math.random()*tot, i = 0;
    while (i<w.length-1 && (r -= w[i])>0) i++;
    return bag[side].splice(i, 1)[0];
  };
  const list = [...Array(n)].map(()=>{ const side = Math.random()<pAtt ? "att" : "def"; return {side, id:draw(side)}; });
  // a set piece now and then: a penalty for the strikers and tens, a free kick for the wide men and midfielders
  const sp = LV_SETPIECE[pos], spare = list.filter(m=>m.side==="att" && m.id!==sp?.[0]);
  if (sp && spare.length && Math.random()<sp[1]) pick(spare).id = sp[0]==="shot:freekick" && Math.random()<.4 ? "lab:bendit" : sp[0];   // penalties are always the flick-and-bar shot
  if (pos==="GK" && Math.random()<.15){ const s = list.find(m=>m.id==="save"); if (s) s.id = "save:pen"; }
  if (typeof S!=="undefined" && S && !f.lab){ S.lvRecent = [...recent, ...list.map(m=>m.id)].slice(-14); }
  const from = me.st==="sub" ? 92-me.mins : 3, to = me.st==="sub" ? 89 : Math.max(12, me.mins-2);
  list.forEach(m=>{ [m.g, m.v] = m.id.split(":"); m.min = from + Math.floor(Math.random()*(to-from+1)); if (m.min>=85 && me.mins>=85 && Math.random()<.4) m.min = 91 + Math.floor(Math.random()*5); });
  // together your moments can't stand for more than your position's share of the match (mcXg's pG and pA): a striker
  // is in on about a third of his team's goals, a centre-back on very few. Played averagely (lvAuto) they give about
  // what the simulation would; playing them well is how you beat it
  const sum = side => list.filter(m=>m.side===side).reduce((s,m)=>s + LV_EV[m.id], 0), eF = sum("att"), eA = sum("def");
  const capF = clamp((X.pG + X.pA)*1.1, .06, .7)*X.lf, capD = (LV_DSHARE[pos] ?? .08)*X.t*X.la;
  const qa = eF ? clamp(capF/eF, .2, 1) : 1, qd = eA ? clamp(capD/eA, .2, 1) : 1;
  list.forEach(m=>{ m.q = m.side==="att" ? qa : qd; });
  return {list:list.sort((x,y)=>x.min-y.min), eF:eF*qa, eA:eA*qd};
}
// what a moment did: R = {ok, big, small, g (your goal), a (your assist), gf (a team goal), ga (they scored), og (your own goal), bonus}
/* ---------- fouls and cards ----------
   sev 0..1: how bad the challenge was. Most are a yellow, a bad one can be a straight red; a third foul in a match is a booking
   for persistent fouling; a second yellow is a red. Being sent off ends your match (lvSentOff) and brings a ban (mcBook) */
function lvFoul(st, m, sev, early){
  st.fouls = (st.fouls || 0) + 1;
  let card = "", why;
  // most bad tackles are a booking; the worse it is, the likelier, and a bad one can be a straight red
  if (sev > .45 && Math.random() < (early ? .1 : .14) + (sev - .45)*.4){ card = "r"; why = early ? "Two-footed and out of control: straight red" : "A reckless lunge from behind: straight red"; }
  else if (Math.random() < .72 + sev*.25){ card = "y"; why = early ? "You dived in and took him down" : "You clipped his heels"; }
  else if (st.fouls >= 3){ card = "y"; why = "That's your third foul: booked for persistent fouling"; }
  else why = early ? "You went through the back of him" : "Late, but the ref only gives the free kick";
  if (card==="y" && st.yc){ card = "yy"; why = "A second yellow, so it's red"; }
  const fk = Math.random() < .1*m.q;   // and the free kick that follows
  const big = card==="y" ? "Yellow card" : card ? "Red card!" : "Foul";
  return {ok:false, big, small: why + (fk ? ". They score from the free kick" : card==="y" || !card ? ". Free kick to them" : ""), foul:1, card, ga: fk ? 1 : 0,
    bonus: card==="y" ? -.25 : card ? -.9 : -.12};
}
// sent off: the rest of your moments don't happen, and ten men concede more and score less for the rest of the game
function lvSentOff(st, m){
  const f = st.f, me = f.me, left = Math.max(0, 90 - m.min)/90, on = me.st==="start" ? 0 : 90 - me.mins;
  st.ev = st.ev.filter(e => e.min < m.min || !e.us || Math.random() < .65);
  for (let i=0, n=mcPoisson(st.X.la*.45*left); i<n; i++) st.ev.push({min:m.min + 1 + Math.floor(Math.random()*Math.max(1, 90 - m.min)), us:false});
  me.mins = clamp(Math.min(90, m.min) - on, 1, me.mins); me.sent = m.min;
  st.left = 0;
}
function lvApply(st, m, R){
  if (R.card){ st.log.push({min:m.min, txt:R.card==="y" ? "Booked" : "Sent off", good:false, card:R.card==="y" ? "y" : "r"});
    if (R.card==="y") st.yc = 1; else st.red = R.card; st.card = R.card==="y" ? "y" : R.card; }
  if (R.g || R.a || R.gf) st.ev.push({min:m.min, us:true, me:R.g ? "g" : R.a ? "a" : ""});
  if (R.g) st.g++; if (R.a) st.a++;
  if (R.ga || R.og){ st.ev.push({min:m.min, us:false, og:!!R.og}); if (R.og) st.og++; }
  st.bonus += R.bonus || 0;
  st.log.push({min:m.min, txt:R.big + (R.small ? ` · ${R.small}` : ""), good:R.ok});
}
// moments you skip go the way the simulation would have sent them
function lvAuto(st, m){
  const p = LV_EV[m.id]*m.q;
  if (m.side==="att"){
    if (Math.random()>=p) return {ok:false, big:"Simmed", small:"No end product", bonus:-.03};
    const lk = m.g==="lab" ? LV_LABM[m.v][0] : null;
    const g = lk ? lk==="goal" || lk==="pen" || (lk==="chance" && Math.random()<.6) : ["shot","header"].includes(m.g) || (["move","takeon"].includes(m.g) && Math.random()<.6);
    return g ? {ok:true, big:"Simmed", small:"You scored", g:1} : {ok:true, big:"Simmed", small:"You set one up", a:1};
  }
  if (Math.random()>=p) return {ok:true, big:"Simmed", small:"Dealt with", bonus:.2};
  const og = m.g==="block" && Math.random()<.3;
  return og ? {ok:false, big:"Simmed", small:"Own goal", og:1, bonus:-.4} : {ok:false, big:"Simmed", small:"They scored", ga:1, bonus:-.25};
}
// after each moment: the outcome over the pitch, then on to the next
// a goal you scored or set up: confetti in your club's colours
function lvBurst(cols){
  return `<div class="lv-burst" aria-hidden="true">${[...Array(28)].map((_,i)=>{ const a = Math.random()*Math.PI*2, d = 70 + Math.random()*120;
    return `<i style="--x:${(Math.cos(a)*d).toFixed(0)}px;--y:${(Math.sin(a)*d*.7 - 40).toFixed(0)}px;--r:${Math.round(Math.random()*720 - 360)}deg;--c:${cols[i%4]};--d:${(Math.random()*.2).toFixed(2)}s"></i>`; }).join("")}</div>`;
}
// the result over the pitch: a tick, a cross or a ball, the headline and why
const LV_ICON = {good:`<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  bad:`<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  goal:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#15171A" stroke-width="1.5"/><path d="M12 7.6l3.8 2.8-1.5 4.4H9.7l-1.5-4.4z" fill="#15171A"/></svg>`};
function lvResHTML(R, cls = "lv-res"){
  const goal = !!(R.g || R.a || R.gf), kind = goal ? "goal" : R.ok ? "good" : "bad";
  return `<div class="${cls} ${R.ok?"good":"bad"} ${goal ? "goal" : ""}${R.card ? R.card==="y" ? " cy" : " cr" : ""}">${R.card ? `<div class="lv-refcard ${R.card==="y" ? "y" : "r"}" aria-hidden="true">${R.card==="yy" ? `<i class="y"></i>` : ""}<i></i></div>` : `<i class="lv-ico ${kind}" aria-hidden="true">${LV_ICON[kind]}</i>`}<span>${esc(R.big)}</span>${R.small?`<small>${esc(R.small)}</small>`:""}</div>`;
}
function lvOutcome(st, R){
  const goal = !!(R.g || R.a || R.gf);
  if (typeof SND!=="undefined") SND.verdict(R);
  lv$(".lv-stage").insertAdjacentHTML("beforeend", lvResHTML(R));
  if (R.g || R.a){ lv$(".lv-res").insertAdjacentHTML("beforeend", lvBurst(lvCols(st))); lvCheer(); }
  lvBuzz(goal ? "goal" : R.ok ? "good" : "bad");
  // some mini-games (take-ons) have their own buttons instead of a main one: swap those for it
  let act = lv$(".lv-act"); if (!act){ act = document.createElement("button"); act.type = "button"; lv$(".lv-in").appendChild(act); }
  lv$(".lv-lr")?.remove(); act.hidden = false;
  act.textContent = st.lab ? st.lab.next || "Continue" : R.card && R.card!=="y" ? "Walk off" : st.left>1 ? "Next moment" : "Full time"; act.disabled = true; act.className = "btn big primary lv-act"; act.onclick = null;
  lv$("[data-lv-skip]")?.remove();
  // a short pause, so the tap that made the tackle can't also skip past its result
  return new Promise(res=>setTimeout(()=>{
    if (!lvEl) return res();
    act.disabled = false; act.focus({preventScroll:true});
    lvKey = k=>{ if (k==="go"){ lvKey = null; res(); } }; act.onclick = ()=>{ lvKey = null; res(); };
  }, 450));
}
function lvSkippable(res){ lv$("[data-lv-skip]")?.addEventListener("click", ()=>{ cancelAnimationFrame(lvRaf); lvKey = null; res("skip"); }); }

/* ---------- first-time instructions ----------
   Before your first match, and the first time each mini-game comes up, a card explains it. Each account
   remembers what it has seen; "How to play" on a match's intro shows them again. */
const LV_TXT = (x, y, s, a="middle") => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="13" letter-spacing=".5" fill="#FFE9A8">${s}</text>`;
const lvDemo = (goal, inner, cap) => lvField(goal, inner + `<rect x="0" y="152" width="300" height="28" fill="rgba(0,0,0,.45)"/>` + LV_TXT(150, 171, cap));
const LV_HELP = {
  intro:{t:"Key moments", steps:["In every match you're picked for, you play the moments that involve you: <b>4</b> if you start, 1 or 2 off the bench. Each one is a quick mini-game.",
    "The rest of the match is simulated around them, so the final score includes what you did. When your team's on top you get more attacking moments; under pressure, more defending.",
    "Every match ends with a <b>rating</b>. Ratings decide your form, the manager's trust, how fast you grow, your value and the season's awards.",
    "Your attributes, boots, form and sharpness make every mini-game easier. Tap <b>Sim the match</b> on a match's intro to skip it."]},
  shot:{t:"How to shoot", steps:["<b>Put your finger on the ball</b>: the power bar starts to build and swing.", "<b>Flick up</b> while the marker's <b>in the green</b>. A gold line shows where you're aiming.",
    "<b>Aim</b> across with the way you flick, and a <b>quicker flick lifts it</b> towards the top corner. The keeper saves what's near him: <b>pick a corner</b>.", "In the green it's a <b>clean strike</b>: full pace, where you aimed. Off the green it's slower and wilder: too much and it rises, too little and it dies. The better your <b>finishing</b>, the bigger the green."],
    svg:`<svg viewBox="0 0 240 160"><rect x="30" y="10" width="180" height="72" fill="rgba(255,255,255,.05)" stroke="#F4F7F2" stroke-width="4"/><circle cx="120" cy="104" r="7" fill="#fff"/><path d="M120 96Q150 70 182 34" fill="none" stroke="#F5C542" stroke-width="3" stroke-dasharray="6 5"/><rect x="30" y="132" width="180" height="14" rx="7" fill="rgba(255,255,255,.12)"/><rect x="146" y="132" width="26" height="14" fill="rgba(74,222,128,.75)"/><rect x="157" y="128" width="4" height="22" rx="2" fill="#fff"/>${LV_TXT(120,58,"FLICK IN THE GREEN")}</svg>`},
  header:{t:"How to head it", steps:["A cross is coming in. A <b>ring closes in</b> on the ball.", "Tap <b>Head it!</b> the moment it lines up with the <b>gold target ring</b>.",
    "Spot on and it flies into the corner; a bit off and the keeper has a chance; way off and it goes over."],
    svg:lvDemo("top", `<circle cx="150" cy="70" r="16" fill="none" stroke="#F5C542" stroke-width="3"/><circle cx="150" cy="70" r="34" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="150" cy="70" r="5" fill="#fff"/>`, "TAP WHEN THE RINGS MEET")},
  pass:{t:"How to pass", steps:["Two of your teammates are marked: a <b>defender</b> is right next to them.",
    "<b>Drag the ball</b> towards the free teammate and let go (or tap him) before the timer runs out.", "The defenders keep moving: the man who was free when you started dragging is the one that counts."],
    svg:`<svg viewBox="0 0 240 160"><rect width="240" height="160" rx="12" fill="#1D6537"/><circle cx="45" cy="50" r="13" fill="#F4F7F2"/><circle cx="58" cy="62" r="7" fill="#EF4444"/><circle cx="195" cy="50" r="13" fill="#F4F7F2"/><circle cx="182" cy="62" r="7" fill="#EF4444"/>
      <circle cx="120" cy="34" r="13" fill="#F4F7F2" stroke="#F5C542" stroke-width="4"/><circle cx="120" cy="128" r="12" fill="#F5C542"/><path d="M120 114V52" stroke="#FFE9A8" stroke-width="2.5" stroke-dasharray="5 5"/>${LV_TXT(120,152,"DRAG IT TO THE FREE MAN")}</svg>`},
  move:{t:"Attacking move", steps:["A three-step move. <b>1:</b> find the free teammate to start it.", "<b>2:</b> beat your defender: watch for him to commit and go the other way.",
    "<b>3:</b> shoot, or drag it square to a teammate for a tap-in. Lose it at any step and the move breaks down."]},
  takeon:{t:"How to take him on", steps:["Your defender is waiting. When he <b>commits</b> (a <b>!</b> flashes and he shifts), go the <b>other way</b>.",
    "Tap <b>◀ Left</b> or <b>Right ▶</b>, or that side of the pitch. Go too early and he reads you.", "Beat him and you're through on goal."],
    svg:lvDemo("top", `${lvMan(170,92,"#EF4444")}<text x="186" y="52" font-size="22" font-weight="900" fill="#F5C542">!</text>${lvMan(150,140,"#F5C542")}<path d="M138 120l-30-30" stroke="#FFE9A8" stroke-width="3" stroke-dasharray="5 4"/>`, "HE GOES RIGHT, YOU GO LEFT")},
  cross:{t:"How to cross", steps:["Two teammates make runs into the box, each towards a <b>green spot</b>. One of them is marked.",
    "<b>Drag the ball</b> onto the free runner and <b>let go</b> as he reaches his green spot (or tap him then).", "Pick the marked man, or cross too early or late, and it's cleared."],
    svg:lvDemo("top", `<circle cx="128" cy="34" r="12" fill="rgba(74,222,128,.35)" stroke="#4ADE80"/><circle cx="172" cy="38" r="12" fill="rgba(74,222,128,.35)" stroke="#4ADE80"/>${lvMan(130,46,"#F4F7F2")}${lvMan(176,58,"#F4F7F2")}${lvMan(184,62,"#EF4444")}${lvMan(268,40,"#F5C542")}`, "DRAG IT TO THE FREE RUNNER")},
  tackle:{t:"How to tackle", steps:["The attacker runs along the line towards the <b>green zone</b>.",
    "Tap <b>Tackle!</b> while he's inside the green.", "Too early and you dive in; too late and he's past you."],
    svg:`<svg viewBox="0 0 240 120"><rect width="240" height="120" rx="12" fill="#1D6537"/><path d="M14 60H226" stroke="rgba(255,255,255,.35)" stroke-width="4"/><rect x="146" y="28" width="40" height="64" rx="8" fill="rgba(74,222,128,.35)" stroke="#4ADE80" stroke-width="2"/>
      <circle cx="70" cy="60" r="13" fill="#EF4444" stroke="#fff" stroke-width="3"/><path d="M92 60h34m-8-7 8 7-8 7" stroke="#FFE9A8" stroke-width="3" fill="none"/>${LV_TXT(120,112,"TAP WHEN HE'S IN THE GREEN")}</svg>`},
  block:{t:"How to block", steps:["A shot is heading for goal.", "Tap <b>Block!</b> when the ball is <b>in the green</b>.", "Miss it and they'll probably score, and sometimes it deflects in off you."],
    svg:`<svg viewBox="0 0 240 120"><rect width="240" height="120" rx="12" fill="#1D6537"/><path d="M14 60H214" stroke="rgba(255,255,255,.35)" stroke-width="4"/><rect x="166" y="28" width="34" height="64" rx="8" fill="rgba(74,222,128,.35)" stroke="#4ADE80" stroke-width="2"/>
      <rect x="216" y="24" width="12" height="72" fill="rgba(255,255,255,.2)" stroke="#F4F7F2" stroke-width="3"/><circle cx="80" cy="60" r="9" fill="#fff"/><path d="M98 60h40m-8-7 8 7-8 7" stroke="#FFE9A8" stroke-width="3" fill="none"/>${LV_TXT(115,112,"TAP WHEN THE BALL'S IN THE GREEN")}</svg>`},
  intercept:{t:"How to intercept", steps:["Their midfielder has the ball, with three team-mates to pass to: left, middle and right.", "Wait until his <b>lane lights up gold</b> and the button says <b>Now!</b>, then <b>tap that lane</b> (anywhere in that third of the pitch) to step in and win it.",
    "Good passers flash a look one way and pass the other, so don't go on the first glance. Too slow and the pass gets through."],
    svg:lvDemo("bottom", `${lvMan(150,40,"#EF4444")}${lvMan(70,110,"#EF4444")}${lvMan(150,124,"#EF4444")}${lvMan(230,110,"#EF4444")}<path d="M150 46L222 100" stroke="#F5C542" stroke-width="4" stroke-dasharray="7 5"/>${lvMan(150,84,"#F5C542")}`, "TAP THE LANE HE'S LOOKING AT")},
  save:{t:"How to save", steps:["The striker lines up his shot. Don't move too early: strikers punish keepers who guess, and put it the other way.",
    "Watch the ball, then <b>tap where it's going</b>: anywhere on the goal. You dive there.", "Your shot-stopping decides how far you can dive and how much your hands cover. Late, and you won't get across; right at your hands, and you hold it."],
    svg:`<svg viewBox="0 0 240 150"><rect x="20" y="10" width="200" height="90" fill="rgba(255,255,255,.05)" stroke="#F4F7F2" stroke-width="4"/>
      <circle cx="120" cy="130" r="8" fill="#fff"/><path d="M112 124 62 70" stroke="#FFE9A8" stroke-width="3" stroke-dasharray="5 4"/><circle cx="54" cy="62" r="20" fill="rgba(245,197,66,.25)" stroke="#F5C542" stroke-width="3"/>${LV_TXT(160,140,"TAP WHERE IT'S GOING","start")}</svg>`},
  claim:{t:"How to claim a cross", steps:["A cross is coming into your box. A <b>ring closes in</b> on the ball.", "Tap <b>Claim it!</b> when it meets the <b>gold target ring</b>.",
    "Spot on and you catch it; a bit off and you punch it clear; miss it and they've a free header."],
    svg:lvDemo("bottom", `<circle cx="150" cy="118" r="16" fill="none" stroke="#F5C542" stroke-width="3"/><circle cx="150" cy="118" r="34" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="150" cy="118" r="5" fill="#fff"/>`, "TAP WHEN THE RINGS MEET")},
  rush:{t:"How to rush out", steps:["A striker's through on your goal.", "Wait for his <b>heavy touch</b>: the ball runs away from his feet and a <b>!</b> flashes.",
    "Then tap <b>Rush out!</b> to smother it. Go before that and he rounds you; too late and he shoots."],
    svg:lvDemo("bottom", `${lvMan(150,70,"#EF4444")}<circle cx="150" cy="92" r="5" fill="#fff"/><text x="162" y="94" font-size="20" font-weight="900" fill="#F5C542">!</text>${lvMan(150,150,"#F5C542")}`, "TAP RIGHT AFTER HIS HEAVY TOUCH")},
  coins:{t:"Gold coins", steps:["You earn gold coins in every match you play with key moments. Your total sits next to your name at the top.",
    "A win is worth <b>50</b>, a draw <b>10</b> and a defeat nothing.", "Every goal you score adds <b>20</b> and every assist <b>15</b>, but an own goal costs <b>10</b>. Simmed matches don't earn coins."]}
};
function lvSeen(){ try{ return JSON.parse(localStorage.getItem(Account.storageKey("tips"))) || {}; }catch(e){ return {}; } }
function lvMarkSeen(k){ const s = lvSeen(); s[k] = 1; try{ localStorage.setItem(Account.storageKey("tips"), JSON.stringify(s)); }catch(e){} }
async function lvHelp(keys, first){
  for (const k of keys){
    const H = LV_HELP[k]; if (!H) continue;
    await lvAsk(`<div class="lv-card lv-help"><div class="lv-eye">${first ? "First time? Here's how it works" : "How to play"}</div><h2 class="lv-t">${H.t}</h2>
      ${H.svg ? `<div class="lv-demo" aria-hidden="true">${H.svg}</div>` : ""}<ol class="lv-steps">${H.steps.map(s=>`<li>${s}</li>`).join("")}</ol>
      <button type="button" class="btn primary big" data-lv="ok" data-lv-focus>${first ? "Got it, let's play" : "Got it"}</button></div>`);
    lvMarkSeen(k);
  }
}
// every guide that matters for your position
function lvHelpAll(){ const P = LV_POOL[S.player.pos] || LV_POOL.CM; return ["intro", ...new Set([...P.att, ...P.def].map(id=>id.split(":")[0]))]; }

// gold coins for a match you played: the result, plus your goals and assists, minus own goals
const LV_COINS = {win:50, draw:10, loss:0, goal:20, assist:15, og:-10, potm:25};
function lvCoins(f){
  const r = f.res, me = f.me, res = r.gf>r.ga ? "win" : r.gf===r.ga ? "draw" : "loss", og = me.og || 0;
  const parts = [[{win:"Win", draw:"Draw", loss:"Defeat"}[res], LV_COINS[res]], ...(me.g ? [[`${me.g} goal${me.g>1?"s":""}`, me.g*LV_COINS.goal]] : []),
    ...(me.a ? [[`${me.a} assist${me.a>1?"s":""}`, me.a*LV_COINS.assist]] : []), ...(og ? [[`${og} own goal${og>1?"s":""}`, og*LV_COINS.og]] : []), ...(f.potm ? [["Player of the Match", LV_COINS.potm]] : []),
    ...(me.card && me.card!=="y" ? [["Sent off", -Math.round(LV_COINS.goal/2)]] : [])];
  return {parts, total:parts.reduce((s,p)=>s + p[1], 0)};
}

async function lvPlayMatch(f, w){
  const X = mcXg(f), me = f.me, plan = lvPlan(f, X);
  const home = f.home || f.neutral ? S.mc.club : f.opp, away = f.home || f.neutral ? f.opp : S.mc.club;
  // the goals your moments don't stand in for, at random minutes
  const ev = [];
  const rest = (n, us) => { for (let i=0;i<n;i++) ev.push({min:1+Math.floor(Math.random()*90), us}); };
  rest(mcPoisson(Math.max(0, X.lf - plan.eF)), true); rest(mcPoisson(Math.max(0, X.la - plan.eA)), false);
  const st = {f, X, ev, g:0, a:0, og:0, bonus:0, left:plan.list.length, log:[]};
  lvOpen();
  try{
    if (!lvSeen().intro) await lvHelp(["intro"], true);
    let go;
    while ((go = await lvAsk(`<div class="lv-card">
        <div class="lv-eye">${f.big ? "★ " : ""}${esc(mcCompLabel(f))}${f.code!=="league" ? " · " + esc(f.round) + (f.leg ? `, leg ${f.leg}` : "") : ""} · ${mcDate(w, f)}</div>
        <div class="lv-teams"><span>${clubBadge(home, 34)}${esc(home)}</span><i>v</i><span>${clubBadge(away, 34)}${esc(away)}</span></div>
        ${sqLineups(f)}
        <div class="lv-forms">${[[S.mc.club, "Your team"], [f.opp, f.opp]].map(([n, l])=>`<div class="lv-form"><span>${esc(l)}</span>${mcFormPills(mcTeamForm(n).L)}</div>`).join("")}</div>
        <p>${me.st==="start" ? `You're in the starting line-up.${me.mins<90 ? (S.cond.fat>55 ? ` You're tired, so expect to come off around the ${ord(me.mins)} minute.` : ` The manager plans to bring you off around the ${ord(me.mins)} minute.`) : ""}` : `You start on the bench and come on around the ${ord(90-me.mins)} minute.`}
          ${plan.list.length} key moment${plan.list.length===1?"":"s"} will come your way${me.st!=="start" ? "" : plan.list.length>=5 ? ": a big chance to shine" : plan.list.length<=3 ? ": a tough one, make them count" : ""}.</p>
        <div class="lv-row"><button type="button" class="btn primary big" data-lv="play" data-lv-focus>Play key moments</button><button type="button" class="btn" data-lv="sim">Sim the match</button></div>
        <button type="button" class="lv-skip" data-lv="help" style="justify-self:start">How to play</button>
      </div>`))==="help") await lvHelp(lvHelpAll(), false);
    if (go==="play"){
      let auto = false;
      for (const m of plan.list){
        let R = null;
        if (!auto){
          if (!lvSeen()[lvHelpKey(m)]) await lvHelp([lvHelpKey(m)], true);
          lvCountNext = true; R = await LV_GAMES[m.g](st, m);
          if (R==="skip") auto = true;
        }
        if (auto){ lvApply(st, m, lvAuto(st, m)); st.left--; continue; }
        lvApply(st, m, R); await lvOutcome(st, R); st.left--;
        if (st.red){ lvSentOff(st, m); break; }
      }
      const D = mcKoLevel(f, st.ev) ? await lvDecider(st, P => mcKoLevel(f, st.ev)) : {};
      mcResolve(f, w, {gf:st.ev.filter(e=>e.us).length, ga:st.ev.filter(e=>!e.us).length, g:st.g, a:st.a, og:st.og, bonus:st.bonus, ev:st.ev, et:D.et, pens:D.pens, card:st.card});
      f.coins = lvCoins(f).total; Account.addCoins(f.coins); save();
      if (!lvSeen().coins) await lvHelp(["coins"], true);
    } else mcResolve(f, w);
    await lvFullTime(st, home, away);
  } finally { lvClose(); }
}
/* ---------- level after 90 in a knockout: extra time, then penalties, each played or simmed ----------
   level(st) says whether it's still level (counting a first leg). Resolves {et, pens} for the result. */
async function lvDecider(st, level){
  const f = st.f, X = st.X, P = LV_POOL[lvPos(st)] || LV_POOL.CM, [g0, a0] = lvScore(st, 999);
  if (st.red){   // you watch from the tunnel: extra time and penalties are simmed
    for (let i=0, n=mcPoisson(X.lf*.2); i<n; i++) st.ev.push({min:91 + Math.floor(Math.random()*29), us:true});
    for (let i=0, n=mcPoisson(X.la*.32); i<n; i++) st.ev.push({min:91 + Math.floor(Math.random()*29), us:false});
    st.et = true; if (!level(st)) return {et:true};
    return {et:true, pens:Math.random() < logistic((X.base - f.oppStr)/12) ? "won" : "lost"};
  }
  const go = await lvAsk(`<div class="lv-card"><div class="lv-eye">${esc(f.round || "Knockout")} · 90 minutes</div><h2 class="lv-t">Extra time</h2>
    <p>Level at ${g0}–${a0}${f.leg===2 ? " on aggregate" : ""}. Thirty more minutes, then penalties if nobody wins it.</p>
    <div class="lv-row"><button type="button" class="btn primary big" data-lv="play" data-lv-focus>Play extra time</button><button type="button" class="btn" data-lv="sim">Sim it</button></div></div>`);
  st.et = true;
  // the goals your moment doesn't stand for, and one moment of your own
  const side = !P.att.length ? "def" : !P.def.length ? "att" : Math.random()<.6 ? "att" : "def", id = pick(P[side]), [g, v] = id.split(":");
  const m = {side, id, g, v, min:95 + Math.floor(Math.random()*24), q:.85};
  for (let i=0, n=mcPoisson(Math.max(0, X.lf*.25 - (side==="att" ? .15 : 0))); i<n; i++) st.ev.push({min:91 + Math.floor(Math.random()*29), us:true});
  for (let i=0, n=mcPoisson(Math.max(0, X.la*.25 - (side==="def" ? .15 : 0))); i<n; i++) st.ev.push({min:91 + Math.floor(Math.random()*29), us:false});
  st.left = 1;
  if (go==="play"){
    if (!lvSeen()[lvHelpKey(m)]) await lvHelp([lvHelpKey(m)], true);
    lvCountNext = true; const R = await LV_GAMES[m.g](st, m);
    if (R==="skip") lvApply(st, m, lvAuto(st, m)); else { lvApply(st, m, R); await lvOutcome(st, R); }
  } else lvApply(st, m, lvAuto(st, m));
  if (!level(st)) return {et:true};
  // penalties
  const [g1, a1] = lvScore(st, 999);
  const pk = await lvAsk(`<div class="lv-card"><div class="lv-eye">${esc(f.round || "Knockout")} · after extra time</div><h2 class="lv-t">Penalties!</h2>
    <p>Still ${g1}–${a1}${f.leg===2 ? " on aggregate" : ""}. Five each, then sudden death. Take them all yourself, and go in goal for theirs.</p>
    <div class="lv-row"><button type="button" class="btn primary big" data-lv="play" data-lv-focus>Take the shootout</button><button type="button" class="btn" data-lv="sim">Sim it</button></div></div>`);
  const odds = logistic((X.base - f.oppStr)/12 + (st.f.me && st.f.me.mins ? (mcOvr() - X.base)/40 : 0));
  if (pk!=="play") return {et:true, pens:Math.random()<odds ? "won" : "lost"};
  return {et:true, pens:await lvShootout(st)};
}
// the shootout: your penalty, then theirs with you in goal, five each and sudden death. "Sim the rest" finishes it
async function lvShootout(st){
  const me = [], them = [], n = a => a.filter(Boolean).length, left = st.f.home || st.f.neutral;
  const us = lvAbbr(lvUs(st)), op = lvAbbr(st.f.opp), [g, a] = lvScore(st, 999);
  const decided = () => { const x = n(me), y = n(them), nx = me.length, ny = them.length;
    if (nx<=5 && ny<=5) return x + (5 - nx) < y || y + (5 - ny) < x;
    return nx===ny && x!==y; };
  const head = () => `<div class="lv-top"><span class="lv-sc"><b>${esc(left ? us : op)}</b> ${left ? g : a}–${left ? a : g} <b>${esc(left ? op : us)}</b></span><span>Pens ${left ? n(me) : n(them)}–${left ? n(them) : n(me)}</span>
    <button type="button" class="lv-skip" data-lv-skip>Sim the rest</button></div>`;
  const simTo = () => { while (!decided() && me.length<30){ if (me.length===them.length) me.push(Math.random()<.76); else them.push(Math.random()<.74); } };
  lvCountNext = true;
  for (let r=0; r<30 && !decided(); r++){
    const sh = await lvShotCore(st, {q:1}, "pen", head(), r<5 ? `Your penalty · ${r + 1} of 5` : "Sudden death: your penalty");
    if (sh==="skip"){ simTo(); break; }
    me.push(sh.goal); await lgFlash(sh.goal, sh.goal ? "Scored!" : sh.big, `Pens ${n(me)}–${n(them)}`);
    if (decided()) break;
    const sv = await lvGameSave(st, {q:1, v:"pen", g:"save", head:head(), title:r<5 ? `Their penalty · ${r + 1} of 5` : "Sudden death: their penalty"});
    if (sv==="skip"){ them.push(Math.random()<.74); simTo(); break; }
    them.push(!sv.ok); await lgFlash(sv.ok, sv.ok ? "Saved!" : "They score", `Pens ${n(me)}–${n(them)}`);
  }
  const won = n(me)>n(them);
  st.pens = [n(me), n(them)];
  await lvAsk(`<div class="lv-card"><div class="lv-eye">Penalties</div><h2 class="lv-t">${won ? "You win the shootout!" : "Beaten on penalties"}</h2>
    <p class="lab-score">You ${me.map(x=>x ? "●" : "○").join(" ")}<br>Them ${them.map(x=>x ? "●" : "○").join(" ")}</p><p>${n(me)}–${n(them)} on penalties.</p>
    <button type="button" class="btn primary big" data-lv="ok" data-lv-focus>Full time</button></div>`);
  return won ? "won" : "lost";
}
// how long you played: "90 minutes", "Started, off on 68' (68 minutes)", "On at 71' (19 minutes)"
const lvCardIc = c => c ? `<i class="card-ic ${c==="y" ? "y" : "r"}" role="img" aria-label="${c==="y" ? "Yellow card" : c==="yy" ? "Two yellows, sent off" : "Red card"}"></i>` : "";
const lvMinsLine = me => me.sent ? (me.st==="start" ? `${lvCardIc(me.card)} Sent off on ${me.sent}' · <b>${me.mins} minute${me.mins===1 ? "" : "s"}</b>` : `On at ${me.sent - me.mins}', ${lvCardIc(me.card)} sent off on ${me.sent}' · <b>${me.mins} minute${me.mins===1 ? "" : "s"}</b>`) : me.st==="start" ? (me.mins>=90 ? "Played the full <b>90 minutes</b>" : `Started, off on ${me.mins}' · <b>${me.mins} minutes</b>`) : `On at ${90 - me.mins}' · <b>${me.mins} minute${me.mins===1 ? "" : "s"}</b>`;
async function lvFullTime(st, home, away){
  const f = st.f, me = f.me, [l, r] = f.home || f.neutral ? [f.res.gf, f.res.ga] : [f.res.ga, f.res.gf];
  const bits = [me.g ? `${me.g} goal${me.g>1?"s":""}` : "", me.a ? `${me.a} assist${me.a>1?"s":""}` : "", me.og ? `${me.og} own goal${me.og>1?"s":""}` : "", me.cs && (DEF.includes(S.player.pos) || S.player.pos==="CDM") ? "clean sheet" : "",
    me.card==="y" ? "booked" : me.card ? "sent off" : ""].filter(Boolean);
  const html = `<div class="lv-card lv-ftc">
      <div class="lv-eye">Full time${f.res.pens ? ` · ${f.res.pens==="won"?"won":"lost"} on penalties` : f.res.et ? " · after extra time" : ""}${f.agg && !f.res.pens ? ` · ${f.agg[0]}–${f.agg[1]} on aggregate` : ""}</div>
      <div class="lv-ft"><span>${clubBadge(home, 44)}<em>${esc(home)}</em></span><b>${l}–${r}</b><span>${clubBadge(away, 44)}<em>${esc(away)}</em></span></div>
      ${sqScorers(f)}
      <div class="lv-rate"><span class="label">Your rating</span><b class="${me.r>=7.5?"hi":me.r<6?"lo":""}">${me.r ?? "–"}</b><span>${bits.join(" · ") || (me.mins ? "No goal involvement" : "")}</span></div>
      ${me.mins ? `<p class="lv-mins">${lvMinsLine(me)}</p>` : ""}
      ${me.r!=null ? `<p class="lv-rate-sub"><b>${mcRateLabel(me.r)}.</b> Season average <b>${mcSeasonRating().toFixed(2)}</b>.</p>` : ""}
      ${f.potm ? `<div class="lv-potm">★ Player of the Match</div>` : f.potmBy ? `<p class="lv-potm-by">Player of the Match: <b>${esc(f.potmBy.n)}</b> (${esc(f.potmBy.c)}), ${f.potmBy.r.toFixed(1)}</p>` : ""}
      ${f.coins!=null ? (()=>{ const C = lvCoins(f); return `<div class="lv-coins"><i class="coin" aria-hidden="true"></i><b>${C.total>=0?"+":""}${C.total}</b><span>${C.parts.map(([l,n])=>`${esc(l)} ${n>=0?"+":""}${n}`).join(" · ")}</span></div>`; })()
        : `<p class="lv-nocoins">Simmed matches don't earn gold coins. Play the key moments to earn them.</p>`}
      ${st.log.length ? `<details class="lv-logd"><summary>Your key moments · ${st.log.filter(x=>x.good).length} of ${st.log.length} went your way</summary><ol class="lv-log">${st.log.map(x=>`<li class="${x.good===true?"good":x.good===false?"bad":""}"><span>${x.min}'</span>${x.card ? lvCardIc(x.card) + " " : ""}${esc(x.txt)}</li>`).join("")}</ol></details>` : ""}
      ${lgFullTime(f)}
      <button type="button" class="btn primary big" data-lv="ok" data-lv-focus>Continue</button>
    </div>`;
  // the league table and the leaderboards, then back to full time
  while (await lvAsk(html)==="table") await lvAsk(`<div class="lv-card lv-ftc"><div class="lv-eye">${esc(TIERS[S.mc.lgk].name)} · matchweek ${lgGet(S.mc.lgk).r}</div>
    ${lgBox(S.mc.lgk, "lv")}<button type="button" class="btn primary big" data-lv="ok" data-lv-focus>Back to full time</button></div>`);
}

/* =========================================================================================
   THE MINI-GAMES. Each takes (st, m) and resolves to a result R, or "skip" for "Sim the rest".
   ========================================================================================= */

/* ---------- shots: aim, then power (one-on-ones, in the box, from distance, free kicks) ---------- */
// z: how big the green is on the power bar for this kind of shot; k: how good keepers are at it; per: the bar's swing (ms)
const LV_SHOT = {
  oneonone:{t:"Through on goal!", s:"Put your finger on the ball and the power builds. Flick it where you want it while the power's in the green: that's a goal.", z:1.15, k:.85, per:1700},
  box:{t:"Space in the box", s:"Put your finger on the ball and the power builds. Flick it where you want it while the power's in the green: that's a goal.", z:1, k:1, per:1600},
  long:{t:"Shot from 25 yards", s:"Flick it at goal while the power's in the green. Past the green and it's in the stands.", z:.72, k:1.25, per:1400},
  freekick:{t:"Free kick in range", s:"Flick it at goal in the green to clear the wall. Short of the green and it hits the wall.", z:.85, k:1.1, per:1450},
  pen:{t:"Penalty", s:"Put your finger on the ball and the power builds. Flick it where you want it while the power's in the green: that's a goal.", z:1.1, k:.95, per:1650}
};
// the green on the power bar: hit it and it's a goal. Its size is your finishing (and the kind of shot): about .08 of
// the bar for a finisher of 45, .14 at 65, .2 at 85
const lvGreenSize = (st, mult = 1) => clamp(.08 + (lvAttr(st).fin - 45)*.003, .05, .22)*mult;
// where the keeper ends up: at the ball when he saves it, close when it beats his hands, the other way when he's fooled
function lvKeeperTo(tx, ty, reach, kcol){
  lv$("#lvKp")?.classList.add("dive");
  const side = tx<140 ? -1 : tx>160 ? 1 : 0;
  if (reach==="save") return side ? [tx - side*20, ty + 18, side*62] : [tx, ty + 26, 0];
  if (reach==="near") return side ? [150 + (tx-150)*.72, ty + 24, side*55] : [150, ty + 30, 0];
  const k = {l:-1, c:0, r:1}[kcol];
  return [150 + k*80, LV_ROWS.b - 4, k*62];
}
// the keeper you're up against: their number one in a match (rated from their squad, so a non-league keeper is no
// Neuer), a reserve keeper in training, and in the lab one to suit the difficulty. q (0.1 to 0.88) is how hard he is
// to beat: mostly his own level, and a little how it compares with the finishing of whoever's shooting (fin)
function lvKeeper(st, fin){
  let name = "", r = st.f.oppStr;
  if (st.lab) r = st.lab.kr ?? 72;
  else if (st.drill) r = strOf(S.mc.club) - 8;
  else if (typeof sqSquad==="function"){ try{ const p = sqSquad(st.f.opp)[0]; name = sqSurname(p.name); r = sqRating(p, st.f.oppStr); }catch(e){} }
  return {name, r:Math.round(r), q:clamp(.5 + (r - 75)/80 + (r - fin)/80, .1, .88)};
}
// a tag on the goal saying who's in it and how good he is
// who's who in a mirrored 3D mini-game: you as yourself, everyone else a face of their own (kept per element)
function lv3dMirrorLooks(){
  const you = typeof S!=="undefined" && S && S.player && !S.newing ? S.player : null;
  let n = 0;
  return {me:G3.lookOf(you || {skin:1, hair:"short", hairColour:"Black", number:10, name:"You"}, "#1D4ED8", "#FFFFFF"),
    anyone:el => { const R = seeded(hashStr((el.id || "") + "|" + (++n))); return {skin:LV_SKIN[Math.floor(R()*LV_SKIN.length)], hair:["short","buzz","curly","none"][Math.floor(R()*4)], hairCol:LV_HAIR[Math.floor(R()*LV_HAIR.length)], name:""}; }};
}
// who's in the 3D shot (g3d.js): you in your kit, their keeper in his, their players in a free kick's wall
function lv3dLooks(st, kit, v){
  const you = typeof S!=="undefined" && S && S.player && !S.newing ? S.player : null;
  const tr = c => LV_TRIM[c] || (lvLight(c) ? "#1F2937" : "#FFFFFF");
  const gk = ["#65A30D", "#F97316", "#111827", "#7C3AED"].find(c=>!lvNear(c, kit.them) && !lvNear(c, kit.us)) || "#65A30D";
  const R = seeded(hashStr(String(st.f && st.f.opp || "x")));
  const them = n => ({skin:LV_SKIN[Math.floor(R()*LV_SKIN.length)], hair:["short","buzz","curly","none"][Math.floor(R()*4)], hairCol:LV_HAIR[Math.floor(R()*LV_HAIR.length)], c1:kit.them, c2:tr(kit.them), num:n, name:""});
  const gkMe = ["#65A30D", "#F97316", "#7C3AED", "#111827"].find(c=>!lvNear(c, kit.them) && !lvNear(c, kit.us) && c!==gk) || "#F97316";
  return {v, crowd:kit.us,
    // you in goal (saves), and the striker who takes it
    gk:G3.lookOf(you || {skin:1, hair:"short", hairColour:"Black", number:1, name:"You"}, gkMe, lvLight(gkMe) ? "#111827" : "#F4F4F5", {gk:true, gloves:"#C8F04A", num:1, shorts:"#111827", socks:gkMe}),
    taker:{...them(9)}, foe:them(4),
    mates:[7, 9, 11].map(n=>({...them(n), c1:kit.us, c2:tr(kit.us), socks:kit.us, shorts:tr(kit.us)==="#FFFFFF" ? "#F4F4F5" : tr(kit.us)})),
    me:G3.lookOf(you || {skin:1, hair:"short", hairColour:"Black", number:10, name:"You"}, kit.us, tr(kit.us), {shorts:tr(kit.us)==="#FFFFFF" ? "#F4F4F5" : tr(kit.us), socks:kit.us}),
    keeper:{...them(1), c1:gk, c2:lvLight(gk) ? "#111827" : "#F4F4F5", gk:true, gloves:"#C8F04A", shorts:"#111827", socks:gk},
    wall:them(4)};
}
const lvKeeperTag = GK => `<span class="lv-gk ${GK.r>=85 ? "elite" : GK.r<65 ? "weak" : ""}" aria-label="Their keeper${GK.name ? `, ${esc(GK.name)}` : ""}, rated ${GK.r}">GK${GK.name ? ` · ${esc(GK.name)}` : ""} <b>${GK.r}</b></span>`;
// the shot itself, also used at the end of a take-on and an attacking move: resolves {goal, big, small} or "skip"
function lvShotCore(st, m, v, head, title, o = {}){
  const K = LV_SHOT[v], attr = lvAttr(st).fin, kit = lvKits(st), GK = lvKeeper(st, attr), kq = GK.q;
  const zone = lvGreenSize(st, K.z*(o.zone || 1)), mid = .72, lo = mid - zone/2, hi = mid + zone/2, per = K.per;
  return new Promise(res=>{
    lvShow(`${head}<h2 class="lv-t">${title || K.t}</h2><p class="lv-s">${K.s}</p>
      <div class="lv-stage lv-flick">${lvGoalSvg(kit.them, v==="freekick" ? kit.them : null)}${lvKeeperTag(GK)}<span class="lv-fhint">Hold the ball, then flick it</span>
        <div class="lv-pow"><span class="lv-pow-l">Power</span>${lvBarHTML(mid, zone)}</div></div>
      <p class="lv-zonecap">The <b>green</b> grows with your finishing: <b>${Math.round(attr)}</b></p>`);
    lvSkippable(res);
    let done = false, pts = [], p = 0, t0 = 0;
    const stage = lv$(".lv-stage");
    const g3 = typeof G3!=="undefined" ? G3.shot(stage, lv3dLooks(st, kit, v)) : null;   // in 3D, when it's on
    if (g3 && window.__g3full){ window.__shotG3 = g3; const pl = g3.play; g3.play = q => { window.__lastQ = q; return pl(q); }; }   // (testing only)
    // as the old shot: put your finger on the ball and the power starts to build and swing; flick while it's in the green
    // the power locks the moment the flick starts, so you start it in the green
    let locked = false, flickT0 = 0, aimEl = null;
    // where the flick points, across the goal (2D: a gold marker on the line; 3D: a line on the grass)
    /* in 2D the flick's direction is turned into a point across the goal. In 3D it's where the flick, carried on up the
       picture, crosses the goal line as the 3D goal is drawn: flick at the left corner and that's where it's going */
    // (at the height it's going in at: flick at the top corner and it's the top corner, not the line under it)
    const aimX = (q, ty = 124) => { if (g3 && g3.map){ const gY = g3.map.fwd(150, ty)[1], B = pts[0], dy = B[1] - q[1]; if (dy < 1) return 150; const X = B[0] + (q[0] - B[0])*(B[1] - gY)/dy; return clamp(g3.map.inv(X, gY)[0], -40, 340); }
      return clamp(150 + clamp((q[0] - pts[0][0])/Math.max(1, pts[0][1] - q[1]), -1.9, 1.9)*110, -40, 340); };
    const showAim = q => { const x = aimX(q, 112 - clamp((150 - (flickT0 ? performance.now() - flickT0 : 120))/100, 0, 1)*80); if (g3) return g3.aim(x);
      const svg = stage.querySelector("svg"); if (!svg) return;
      if (!aimEl){ svg.insertAdjacentHTML("beforeend", `<g class="lv-aimmark" pointer-events="none"><path d="M0 0V-100" stroke="#F5C542" stroke-width="2.5" stroke-dasharray="5 5" opacity=".75"/><path d="M-7 8 0 0 7 8" fill="none" stroke="#F5C542" stroke-width="3" stroke-linecap="round"/></g>`); aimEl = svg.lastElementChild; }
      aimEl.setAttribute("transform", `translate(${x.toFixed(1)} 124)`); };
    const startBar = () => { t0 = performance.now(); locked = false; lv$(".lv-pow")?.classList.remove("locked"); lvLoop(now=>{ if (done || !t0 || locked) return false; p = (1 - Math.cos(2*Math.PI*(now - t0)/per))/2; lvBarSet(p, lo, hi); }); };
    lvBarSet(0, lo, hi);
    lvDrag(stage, {from:[150, 166], ok:()=>!done, line:q=>q,
      start:q=>{ pts = [q]; startBar(); const h = lv$(".lv-fhint"); if (h) h.textContent = "Flick it in the green"; },
      cancel:()=>{ t0 = 0; p = 0; lvBarSet(0, lo, hi); },
      // it goes the moment the flick's long enough: no waiting for your finger to lift
      move:q=>{ pts.push(q); if (!locked && Math.hypot(q[0] - pts[0][0], q[1] - pts[0][1])>=8){ locked = true; flickT0 = performance.now(); lv$(".lv-pow")?.classList.add("locked"); }
        if (locked && pts[0][1] - q[1] > 10) showAim(q);
        if (!done && pts[0][1] - q[1]>=55) take(q); },
      end:(q, d, tap)=>{ if (done) return; if (tap || pts.length<2 || pts[0][1] - q[1]<26){ pts = []; t0 = 0; p = 0; cancelAnimationFrame(lvRaf); lvBarSet(0, lo, hi); const h = lv$(".lv-fhint"); if (h){ h.textContent = "Flick up, towards the goal"; h.classList.remove("pop"); void h.offsetWidth; h.classList.add("pop"); } return; } take(q); }});
    const take = async q => {
      done = true; cancelAnimationFrame(lvRaf); lv$(".lv-fhint")?.remove();
      const pw = lv$(".lv-pow"); if (pw){ pw.dataset.res = p>=lo && p<=hi ? "Perfect strike" : p<lo ? "Not enough" : "Too much"; pw.classList.add(p>=lo && p<=hi ? "hit" : "miss"); }
      /* where it goes. Across: the way you flicked. Height: how quick the flick was (a fast flick lifts it towards the
         top corner, a slow one keeps it low). The power bar is how cleanly you strike it: in the green it goes where you
         aimed at full pace; the further off the green, the slower and wilder (too much and it rises, too little and it
         dies low). Your finishing tightens it up */
      const green = p>=lo && p<=hi, short = p<lo, long = p>hi, off = green ? 0 : short ? lo - p : p - hi;
      // a quick flick lifts it to the top corner; a steady one drives it low along the ground
      const ft = flickT0 ? performance.now() - flickT0 : 120, lift = clamp((150 - ft)/100, 0, 1);
      let y = 112 - lift*80, x = aimX(q, y);
      const spray = (1.35 - attr/100)*9 + off*110;
      x += gauss()*spray; y += gauss()*spray*.55;
      if (long) y -= off*190; else if (short) y += off*45;
      const wide = x<27 || x>273, over = !wide && y<15;
      const wood = !wide && !over && (Math.abs(x - 30)<3.5 || Math.abs(x - 270)<3.5 || y<21);
      const wall = v==="freekick" && Math.abs(x - 150)<56 && (y>64 || short);
      y = clamp(y, -14, 116);
      const col = x<110 ? "l" : x>190 ? "r" : "c", side = x<150 ? -1 : 1;
      /* the keeper. He covers what's within his reach: wider and higher the better he is, and more of it the slower
         your shot (a clean strike gives him least time). Into the corners beats him; near him, he saves it. For a
         penalty he picks a side as you strike: send him the wrong way and it's in, unless it's at where he stood */
      const pace = green ? 1 : short ? 1.25 + off*2 : 1.06;
      const kk = Math.sqrt(K.k), rx = (38 + kq*72)*pace*kk, ry = (46 + kq*26)*pace*kk;
      // the curl: how far your flick bowed out from a straight line (the ball bends the same way, round and back to its spot)
      const A0 = pts[0], fdx = q[0] - A0[0], fdy = q[1] - A0[1], fL = Math.hypot(fdx, fdy) || 1; let bow = 0;
      pts.forEach(P=>{ const c = ((P[0] - A0[0])*fdy - (P[1] - A0[1])*fdx)/fL; if (Math.abs(c) > Math.abs(bow)) bow = c; });
      let d = Math.hypot((x - 150)/rx, (y - 80)/ry)*(1 + Math.min(.25, Math.abs(bow)/90)), guess = 0;   // a well-bent shot is harder to read
      if (v==="pen"){ guess = Math.random() < .16 ? 0 : Math.random() < .5 ? -1 : 1;
        if (guess && guess!==side && Math.abs(x - 150)>22) d = 9; else if (!guess) d = Math.abs(x - 150)<30 && y>50 ? .3 : d*1.7; }
      // a shot at him (near the middle of the goal) he saves most of the time, however well it's struck; unless he's
      // already gone the wrong way for a penalty
      const sentWrong = v==="pen" && guess && guess!==side && Math.abs(x - 150)>22, atHim = Math.abs(x - 150)<42 && y>40 && !sentWrong;
      const pSave = atHim ? Math.max(clamp(1.32 - d, 0, .95), green ? .7 : .85) : clamp(1.32 - d, 0, .95);
      let goal = !wide && !wood && !over && !wall && Math.random()>=pSave, tip = false;
      if (goal && !green && pSave>0 && Math.random()>m.q){ goal = false; tip = true; }   // in a match that's going against you, chances are harder
      const corner = Math.abs(x - 150)>78 && (y<52 || y>96);
      const wx = wall ? clamp(x, 128, 172) : x, ty = wall ? 140 : y;
      const kcol = guess ? (guess<0 ? "l" : "r") : green ? (col==="l" ? "r" : col==="r" ? "l" : pick(["l","r"])) : col;
      const [kx, ky, rot] = lvKeeperTo(clamp(wx, 36, 264), clamp(ty, 30, 116), !goal && !over && !wide && !wood && !wall ? "save" : guess && guess!==side ? "wrong" : d>1.6 ? "wrong" : "near", kcol);
      // pace follows the power: the harder you hit it, the quicker it's there
      const ms = clamp(760 - Math.min(p, 1.05)*520, 290, 760)*(green ? .92 : 1), h = over ? 26 : y<72 ? 14 : y>96 ? 1 : 4, curve = Math.abs(bow) > 3 ? clamp(-bow*2.2, -48, 48) : (col==="l" ? -1 : col==="r" ? 1 : 0)*(4 + Math.random()*4);
      // struck clean and hard with little curl, it swerves late (a knuckleball)
      const swerve = green && p > (lo + hi)/2 && Math.abs(bow) < 4 ? (Math.random() < .5 ? -1 : 1) : 0;
      // on target and not in: the keeper's saved it, so he gets there with the ball; he holds the ones at him, parries the rest
      const saved = !goal && !over && !wide && !wood && !wall, held = saved && (d<.6 || Math.random() < kq*.4);
      const kms = saved ? Math.min(330 + (1 - kq)*110, ms*.9) : 330 + (1 - kq)*110;
      if (g3 && typeof SND!=="undefined") SND.kick(.7 + Math.min(.4, p*.4));
      if (g3) await g3.play({wx:clamp(wx, -10, 310), ty, ms, h, curve, swerve, kx, ky, rot, kms, goal, over, wide, wood, wall, saved, held, power:p});
      else {
        await lvStrike(st);
        await Promise.all([
          lvFly("#lvBall", [150, 166], [clamp(wx, -10, 310), ty], ms, {s0:1, s1:wall ? .85 : .6, h, curve, spin:green ? 2.4 : 1.4}),
          lvTween(kms, k=>{ const q2 = lvEaseOut(k); lvMove("#lvKp", 150 + (kx-150)*q2, 84 + (ky-84)*q2, rot*q2, 1 + .06*q2); })
        ]);
        if (goal){ lvRipple(wx, ty); await lvWait(160); }
      }
      res({goal, big: goal ? (corner && green ? "Top drawer!" : "Goal!") : over ? "Over the bar" : wide ? "Wide" : wood ? "Off the woodwork" : wall ? "Hit the wall" : "Saved",
        small: goal ? (guess && guess!==side ? "Sent him the wrong way" : corner ? "Right in the corner" : green ? "Struck too well for him" : "Squeezed past him")
          : over ? (long ? "Too much power: flick in the green" : "Flicked it too quick: it rose over") : wide ? (green ? "A clean strike, but aim inside the posts" : "Off the green, so it sprayed wide")
          : wood ? "Inches away" : wall ? (short ? "Not enough on it to clear the wall" : "Flick quicker to lift it over the wall") : tip ? "Fingertip save"
          : atHim ? (held ? "Straight at him: aim for the corners" : "Too close to him: aim for the corners") : short ? "Not enough power: he had time to get there" : held ? "Great save, and he held it" : "Good save: go further into the corner"});
    };
    lvKey = null;
  });
}
async function lvGameShot(st, m){
  const r = await lvShotCore(st, m, m.v || "box", lvHead(st, m.min)); if (r==="skip") return r;
  return r.goal ? {ok:true, big:"Goal!", small:r.small, g:1} : {ok:false, big:r.big, small:r.small, bonus:-.08};
}

/* ---------- ring timing: headers in their box, claiming crosses in yours ---------- */
// a ring closes on the ball; tap as it meets the target ring. Resolves the miss distance d against tolerance tol
function lvRing(st, o){
  const e = lvEase(st, o.attr), tol = clamp(.17*(1 + e*1.2), .08, .3), per = clamp(1200*(1 + e*.5), 850, 1650);
  // the ball comes in from the wing as the ring closes, and arrives with it (o.ball: [id, where it ends up, scale])
  const [bid, bx, by, bs] = o.ball || [], from = [bx + 150, by - 26];
  return new Promise(res=>{
    lvShow(`${o.head}<h2 class="lv-t">${o.title}</h2><p class="lv-s">${o.sub}</p>
      <div class="lv-stage lv-ringstage">${o.scene}
        <span class="lv-ring tgt" style="${lvPct(o.x, o.y)}"></span><span class="lv-ring mov" style="${lvPct(o.x, o.y)}"></span></div>
      <button type="button" class="btn primary big lv-act">${o.btn}</button>`);
    lvSkippable(res);
    // in 3D (o.g3 builds the scene): the rings go where the ball's met in the picture, and the 3D ball follows the ring
    const g3 = o.g3 ? o.g3(lv$(".lv-stage")) : null;
    if (g3) lvEl.querySelectorAll(".lv-ring").forEach(el=>el.setAttribute("style", lvPct(...g3.at)));
    const ring = lv$(".lv-ring.mov"), t0 = performance.now() + 350; let s = 2.8, done = false;
    const ballAt = k => { if (g3) g3.k(k); if (bid) lvBallAt(bid, from[0] + (bx-from[0])*k, from[1] + (by-from[1])*k, bs, Math.sin(Math.min(1, k)*Math.PI)*34*(1 - k*.4), k*500, true); };
    ballAt(0);
    lvLoop(now=>{ if (done) return false; const t = Math.max(0, now-t0)/per; s = 2.8 - 2.6*t; ring.style.transform = `translate(-50%,-50%) scale(${Math.max(.15, s).toFixed(3)})`; ballAt(clamp((2.8 - s)/1.8, 0, 1.12)); if (s<=.2){ end(); return false; } });
    const end = ()=>{ if (done) return; done = true; cancelAnimationFrame(lvRaf); lv$(".lv-act").disabled = true; res({d:Math.abs(s-1), tol, g3}); };
    lvTap(lv$(".lv-act"), end); lvTap(lv$(".lv-stage"), end);
    lvKey = k=>{ if (k==="go") end(); };
  });
}
async function lvGameHeader(st, m){
  if (m.v==="def") return lvGameClear(st, m);
  const kit = lvKits(st), a = lvAttr(st), GK = lvKeeper(st, a.fin), kq = GK.q;
  const r = await lvRing(st, {head:lvHead(st, m.min), title:"Cross coming in", sub:"Tap Head it! when the closing ring meets the gold one.", btn:"Head it!",
    attr:a.fin*.6 + a.def*.4, x:112, y:104, scene:lvGoalSvg(kit.them) + lvKeeperTag(GK), ball:["#lvBall", 112, 104, .85],
    g3:typeof G3!=="undefined" ? stage => { const L = lv3dLooks(st, kit, "box"); return G3.header(stage, {...L, marker:L.foe, crosser:L.mates[0]}); } : null});
  if (r==="skip") return r;
  const perfect = r.d < r.tol*.45, on = r.d < r.tol;
  const save = perfect ? .1*kq/.5 : on ? clamp(.45*kq/.5, .2, .8) : 1;
  let goal = Math.random() > save; if (goal && Math.random()>m.q) goal = false;
  const col = pick(["l","r"]), tx = perfect ? LV_COLS[col] : on ? 150 + (Math.random()*60-30) : 150 + (Math.random()*160-80), ty = !on ? -10 : perfect ? 42 : 80;
  const [kx, ky, rot] = lvKeeperTo(tx, ty, goal ? "wrong" : on ? "save" : "wrong", goal ? (tx<150 ? "r" : "l") : "c");
  if (r.g3) await r.g3.finish({on, goal, tx, ty, kx, ky, rot});
  else await Promise.all([lvFly("#lvBall", [112, 104], [tx, ty], 380, {s0:.85, s1:.6, spin:1.4}), on ? lvTween(300, k=>{ const q = lvEaseOut(k); lvMove("#lvKp", 150 + (kx-150)*q, 84 + (ky-84)*q, rot*q); }) : null]);
  if (goal){ if (!r.g3){ lvRipple(tx, ty); await lvWait(160); } return {ok:true, big:"Goal!", small: perfect ? "A bullet header" : "Glanced in", g:1}; }
  return {ok:false, big: on ? "Saved" : "Over the bar", small: on ? (perfect ? "Somehow he kept it out" : "Straight at the keeper") : r.d<r.tol*2 ? "Just mistimed it" : "Way off", bonus:-.08};
}
// a cross into your own box: meet it first and head it clear
async function lvGameClear(st, m){
  const kit = lvKits(st), a = lvAttr(st);
  const r = await lvRing(st, {head:lvHead(st, m.min), title:"Defend the cross", sub:"Tap Clear it! when the closing ring meets the gold one, and win the header before their striker.", btn:"Clear it!",
    attr:a.def*.7 + a.sta*.3, x:150, y:110, scene:lvField("bottom", `${lvMan(150,124,kit.us,{ring:"#F5C542"})}${lvMan(166,112,kit.them)}${lvMan(98,128,kit.them)}${lvMan(214,120,kit.us)}${lvBallSvg("lvB",150,110,4)}`), ball:["#lvB", 150, 110, 1]});
  if (r==="skip") return r;
  if (r.d < r.tol*.6) return {ok:true, big:"Cleared!", small:"Up and away: big header", bonus:.3};
  if (r.d < r.tol) return {ok:true, big:"Cleared", small:"Only to the edge of the box, but it's gone", bonus:.12};
  return Math.random() < .5*m.q ? {ok:false, big:"They score", small:"Their striker got there first", ga:1, bonus:-.3} : {ok:false, big:"Lost the header", small:"Their header flew over", bonus:-.1};
}
async function lvGameClaim(st, m){
  const kit = lvKits(st), a = lvAttr(st);
  const r = await lvRing(st, {head:lvHead(st, m.min), title:"Cross into your box", sub:"Tap Claim it! when the closing ring meets the gold one.", btn:"Claim it!",
    attr:a.def, x:150, y:112, scene:lvField("bottom", `${lvMan(150,170,kit.us,{ring:"#F5C542"})}${lvMan(96,124,kit.them)}${lvMan(206,118,kit.them)}${lvMan(226,140,kit.us)}${lvBallSvg("lvB",150,112,4)}`), ball:["#lvB", 150, 112, 1]});
  if (r==="skip") return r;
  if (r.d < r.tol*.6) return {ok:true, big:"Claimed!", small:"Safe hands", bonus:.3};
  if (r.d < r.tol) return {ok:true, big:"Punched clear", small:"Not pretty, but it's gone", bonus:.15};
  return Math.random() < .45*m.q ? {ok:false, big:"They score", small:"You came for it and missed", ga:1, bonus:-.35} : {ok:false, big:"Missed it", small:"Their header went wide", bonus:-.1};
}

/* ---------- passes: drag the ball to the free teammate (or tap him) ---------- */
// resolves {ok, why} or "skip"; extra gives more (or less) time
function lvPassCore(st, head, title, sub, extra=0){
  const f = st.f, a = lvAttr(st), e = lvEase(st, a.pas), kit = lvKits(st);
  const win = clamp(2900*(1 + e*.6), 1900, 3900) + extra, iv = clamp(950*(1 + e*.5), 600, 1350);
  const spots = [[50,72],[150,36],[250,72]].map(([x,y])=>[x + Math.random()*24-12, y + Math.random()*14-7]);
  return new Promise(res=>{
    lvShow(`${head}<h2 class="lv-t">${title}</h2><p class="lv-s">${sub}</p>
      <div class="lv-stage">${lvField("top", spots.map(([x,y],i)=>lvMan(x, y, kit.us, {num:[9,10,7][i], id:`lvM${i}`})).join("") + lvMan(150, 166, kit.us, {ring:"#F5C542"}) + `<g id="lvGk">${lvMan(0, 0, "#16A34A", {s:.95})}</g>`
          + [0,1,2].map(i=>`<g class="lv-dg" data-d="${i}" style="transform:translate(150px,110px)">${lvMan(0, 0, kit.them, {s:.92})}</g>`).join("") + lvBallSvg("lvPb", 150, 150, 4))}
        ${spots.map(([x,y],i)=>`<button type="button" class="lv-tap lv-mate" data-i="${i}" style="${lvPct(x, y-14)}" aria-label="Pass to number ${[9,10,7][i]}"></button>`).join("")}
      </div>
      <div class="lv-timer"><span></span></div>
      <button type="button" class="btn big lv-act" disabled>Find the free man</button>`);
    lvSkippable(res);
    let open = Math.floor(Math.random()*3), prev = -1, switched = 0, done = false, downOpen = -1;
    const place = ()=>{
      const marked = [0,1,2].filter(i=>i!==open), ds = lvEl.querySelectorAll(".lv-dg");
      marked.forEach((i,k)=>{ ds[k].style.transform = `translate(${spots[i][0] + (k ? -12 : 12)}px,${spots[i][1] + 4}px)`; });
      ds[2].style.transform = `translate(${110 + Math.random()*80}px,${112 + Math.random()*16}px)`;
      lv$(".lv-stage").dataset.open = open;
    };
    place(); lvMove("#lvGk", 150, 12);   // their keeper, on his line
    const t0 = performance.now(), bar = lv$(".lv-timer span"); let next = t0 + iv;
    lvLoop(now=>{
      if (done) return false;
      bar.style.width = Math.max(0, 100 - (now-t0)/win*100) + "%";
      if (now>=t0+win){ finish(-1); return false; }
      if (now>=next){ prev = open; open = pick([0,1,2].filter(i=>i!==open)); switched = now; next = now + iv*(.8 + Math.random()*.4); place(); }
    });
    const finish = async i=>{
      if (done) return; done = true; cancelAnimationFrame(lvRaf);
      // a fraction of a second's grace when the defenders have only just moved
      const ok = i>=0 && (i===open || i===downOpen || (i===prev && performance.now()-switched<220));
      // the ball goes to him, or to the defender who was waiting for it
      if (i>=0){ const [x,y] = spots[i], far = Math.hypot(x-150, y-150) > 90;
        lvKick(); await lvFly("#lvPb", [150, 150], ok ? [x, y] : [x + (x<150 ? 9 : x>150 ? -9 : 0), y + 8], far ? 420 : 320, {h:far ? 16 : 5, spin:1}); }
      res({ok, i, at:i>=0 ? spots[i] : null, why: i<0 ? "You took too long" : ok ? "" : "He was marked"});
    };
    lvEl.querySelectorAll(".lv-mate").forEach(b=>lvTap(b, ()=>finish(+b.dataset.i)));
    // a drag towards one of them: whoever was free when you started the drag counts, as a tap would have
    const mates = lvEl.querySelectorAll(".lv-mate");
    lvDrag(lv$(".lv-stage"), {from:[150, 150], ok:()=>!done, start:()=>{ downOpen = open; },
      move:q=>{ const i = lvDragPick([150, 150], q, spots); mates.forEach((b, j)=>b.classList.toggle("aim", j===i)); },
      end:q=>{ const i = lvDragPick([150, 150], q, spots); mates.forEach(b=>b.classList.remove("aim")); if (i>=0) finish(i); else downOpen = -1; }});
    lvKey = k=>{ const i = {l:0, c:1, r:2}[k]; if (i!=null) finish(i); };
  });
}
// a teammate finishing a chance you made: better the stronger your team is against this opponent
const lvConv = (st, m, base) => clamp(base + (st.X.base - st.f.oppStr)*.008, base*.55, base*1.5)*(1.2 - .4*lvKeeper(st, st.X.base).q)*m.q;
async function lvGamePass(st, m){
  const title = {LB:"Overlap down the wing", RB:"Overlap down the wing", ST:"Hold it up and lay it off", LW:"Cutting inside", RW:"Cutting inside", CDM:"Switch the play"}[lvPos(st)] || "Teammate making a run";
  const r = await lvPassCore(st, lvHead(st, m.min), title, "Drag the ball to the teammate who's free before the defenders close him down.");
  if (r==="skip") return r;
  if (!r.ok) return {ok:false, big: r.i<0 ? "Closed down" : "Intercepted", small:r.why, bonus:-.1};
  const scored = Math.random() < lvConv(st, m, .32);
  // what he did with it: a touch, a shot at goal, and the keeper going for it
  if (r.at && lvEl){ const [x, y] = r.at, side = x < 150 ? 1 : -1, gx = scored ? 150 + side*(30 + Math.random()*20) : 150 + side*12, gy = scored ? 4 : 10;
    await lvWait(160); lvKick(`#lvM${r.i}`);
    await Promise.all([lvFly("#lvPb", [x, y], [gx, gy], 360, {h:6, spin:1.6}), lvTween(300, k=>{ const q = lvEaseOut(k); lvMove("#lvGk", 150 + (scored ? -side*14 : side*12)*q, 12, (scored ? -side : side)*40*q); })]);
    if (scored) await lvWait(200); }
  return scored ? {ok:true, big:"Assist!", small:"Your teammate finished it off", a:1} : {ok:true, big:"Chance created", small:"Great ball, but his shot was saved", bonus:.1};
}

/* ---------- take-ons: read the defender and go the other way ---------- */
function lvTakeonCore(st, head, title, sub, hard = 1){
  const f = st.f, a = lvAttr(st), e = lvEase(st, a.pac*.6 + a.fin*.4), kit = lvKits(st);
  const react = clamp(720*(1 + e)*hard, 300, 1100), wait = 700 + Math.random()*900, fake = f.oppStr > a.pac + 4 && Math.random()<.3;
  return new Promise(res=>{
    lvShow(`${head}<h2 class="lv-t">${title}</h2><p class="lv-s">${sub}</p>
      <div class="lv-stage">${lvField("top", `<g id="lvDef">${lvMan(0, 0, kit.them)}</g><text id="lvBang" x="0" y="0" font-size="26" font-weight="900" fill="#F5C542" opacity="0" font-family="Big Shoulders Display,sans-serif">!</text>
          <g id="lvMe">${lvMan(0, 0, kit.us, {ring:"#F5C542"})}</g>${lvBallSvg("lvTb", 150, 136, 4)}`)}
        <button type="button" class="lv-tap lv-half l" data-s="l" aria-label="Go left"></button><button type="button" class="lv-tap lv-half r" data-s="r" aria-label="Go right"></button></div>
      <div class="lv-row lv-lr"><button type="button" class="btn big" data-s="l">◀ Left</button><button type="button" class="btn big" data-s="r">Right ▶</button></div>`);
    lvSkippable(res);
    lvMove("#lvDef", 150, 92); lvMove("#lvMe", 150, 150);
    const stage = lv$(".lv-stage"), t0 = performance.now(); let commit = null, at = 0, faked = false, done = false;
    lvLoop(now=>{
      if (done) return false;
      const t = now - t0;
      if (fake && !faked && t>wait-420 && t<wait-200){ lvMove("#lvDef", 150 + (Math.random()<.5 ? -6 : 6), 92); }
      else if (fake && !faked && t>=wait-200){ faked = true; lvMove("#lvDef", 150, 92); }
      if (!commit && t>=wait){ commit = pick(["l","r"]); at = now; stage.dataset.commit = commit;
        const b = lv$("#lvBang"); b.setAttribute("x", 150 + (commit==="l" ? -30 : 22)); b.setAttribute("y", 58); b.setAttribute("opacity", 1); }
      if (commit) lvMove("#lvDef", 150 + (commit==="l" ? -16 : 16)*lvEaseOut(Math.min(1, (now-at)/140)), 92);
      if (commit && now-at > react){ end(null, "He closed you down"); return false; }
    });
    const end = async (side, why)=>{
      if (done) return; done = true; cancelAnimationFrame(lvRaf);
      let ok = false;
      if (side && !commit){ ok = Math.random() < .3; why = ok ? "" : "You went too early: he read you"; }
      else if (side){ ok = side!==commit; why = ok ? "" : "He was waiting for that"; }
      const dx = side==="l" ? -46 : 46;
      lv$("#lvMe .lv-legs")?.classList.add("run");
      if (ok) await lvTween(340, k=>{ const q = lvEaseOut(k); lvMove("#lvMe", 150 + dx*q, 150 - 80*q); lvBallAt("#lvTb", 150 + dx*q + 4, 136 - 84*q, 1, 0, k*400); });
      else { const dd = commit || (side==="l" ? "l" : "r"), bx = 150 + (dd==="l" ? -10 : 10);
        await lvTween(260, k=>{ const q = lvEaseOut(k); lvMove("#lvDef", 150 + (bx-150)*q, 92 + 34*q); lvBallAt("#lvTb", 150 + (dd==="l" ? -50 : 50)*q, 136 + 10*q, 1, 6*Math.sin(Math.PI*q), k*300); }); }
      res({ok, why});
    };
    lvEl.querySelectorAll("[data-s]").forEach(b=>lvTap(b, ()=>end(b.dataset.s)));
    lvKey = k=>{ if (k==="l" || k==="r") end(k); };
  });
}
async function lvGameTakeon(st, m){
  const r = await lvTakeonCore(st, lvHead(st, m.min), "Take him on", "Wait for him to commit, then go the other way.");
  if (r==="skip") return r;
  if (!r.ok) return {ok:false, big:"Tackled", small:r.why, bonus:-.08};
  // forwards go through on goal; full-backs and midfielders cut it back
  if (["ST","LW","RW","CAM"].includes(lvPos(st))){
    const s = await lvShotCore(st, m, "oneonone", lvHead(st, m.min), "You're through!"); if (s==="skip") return s;
    return s.goal ? {ok:true, big:"Goal!", small:"Beat his man and finished it", g:1} : {ok:false, big:s.big, small:s.small, bonus:.02};
  }
  return Math.random() < lvConv(st, m, .34) ? {ok:true, big:"Assist!", small:"Beat your man and cut it back", a:1} : {ok:true, big:"Beat your man", small:"The cut-back was cleared", bonus:.12};
}

/* ---------- the attacking move: pass, take-on, then shoot or square it ---------- */
async function lvGameMove(st, m){
  const S1 = await lvPassCore(st, lvHead(st, m.min, [1,3]), "Attacking move", "Step 1: find the free man to get it going.", -420);
  if (S1==="skip") return S1;
  if (!S1.ok) return {ok:false, big:"Move broken down", small:S1.why, bonus:-.06};
  const S2 = await lvTakeonCore(st, lvHead(st, m.min, [2,3]), "Attacking move", "Step 2: the return ball's yours. Beat your man.", .75);
  if (S2==="skip") return S2;
  if (!S2.ok) return {ok:false, big:"Move broken down", small:S2.why, bonus:-.04};
  const kit = lvKits(st);
  const pickIt = await new Promise(res=>{
    lvShow(`${lvHead(st, m.min, [3,3])}<h2 class="lv-t">Attacking move</h2><p class="lv-s">Step 3: you're in the box. Shoot, or square it for a tap-in?</p>
      <div class="lv-stage">${lvField("top", `${lvMan(108,70,kit.us,{ring:"#F5C542",label:"YOU"})}${lvMan(196,52,kit.us,{num:9})}${lvMan(150,20,kit.them)}${lvMan(160,62,kit.them)}<path d="M118 66L186 54" stroke="#FFE9A8" stroke-width="2" stroke-dasharray="5 5"/>`)}</div>
      <div class="lv-row"><button type="button" class="btn primary big" data-c="shoot">Shoot</button><button type="button" class="btn big" data-c="square">Square it</button></div>
      <button type="button" class="btn big lv-act" hidden></button>`);
    lvSkippable(res);
    lvEl.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click", ()=>res(b.dataset.c)));
  });
  if (pickIt==="skip") return pickIt;
  if (pickIt==="shoot"){
    const s = await lvShotCore(st, m, "box", lvHead(st, m.min, [3,3]), "Finish the move", {zone:.8}); if (s==="skip") return s;
    return s.goal ? {ok:true, big:"Goal!", small:"What a team move", g:1} : {ok:false, big:s.big, small:s.small, bonus:.02};
  }
  // squaring it: weight the pass (a quick power bar with a wide green zone)
  const w = await lvWeight(st, m, lvHead(st, m.min, [3,3]));
  if (w==="skip") return w;
  if (!w) return {ok:false, big:"Cut out", small:"The pass didn't reach him", bonus:-.04};
  return Math.random() < lvConv(st, m, .72) ? {ok:true, big:"Assist!", small:"Squared for a tap-in", a:1} : {ok:true, big:"Off the line!", small:"Cleared at the last second", bonus:.12};
}
function lvWeight(st, m, head){
  const e = lvEase(st, lvAttr(st).pas), zone = clamp(.26*(1 + e), .14, .4), mid = .6, per = 1100, kit = lvKits(st);
  return new Promise(res=>{
    lvShow(`${head}<h2 class="lv-t">Square it</h2><p class="lv-s">Drag the ball across to him and let go with the bar in the green.</p>
      <div class="lv-stage">${lvField("top", `${lvMan(108,70,kit.us,{ring:"#F5C542"})}${lvMan(196,52,kit.us,{num:9})}${lvMan(150,20,kit.them)}${lvBallSvg("lvSq",116,74,4)}`)}</div>
      ${lvBarHTML(mid, zone)}
      <button type="button" class="btn big primary lv-act">Pass!</button>`);
    lvSkippable(res);
    const t0 = performance.now(); let p = 0, done = false;
    lvLoop(now=>{ if (done) return false; p = (1 - Math.cos(2*Math.PI*(now-t0)/per))/2; lvBarSet(p, mid-zone/2, mid+zone/2); });
    const go = async ()=>{ if (done) return; done = true; cancelAnimationFrame(lvRaf); lv$(".lv-act").disabled = true; const ok = Math.abs(p-mid)<=zone/2;
      lvKick(); await lvFly("#lvSq", [116, 74], ok ? [190, 54] : [156 + (p>mid ? 40 : 0), p>mid ? 40 : 72], 320, {spin:1}); res(ok); };
    lvTap(lv$(".lv-act"), go); lv$(".lv-bar").addEventListener("pointerdown", go);
    lvDrag(lv$(".lv-stage"), {from:[116, 74], ok:()=>!done, end:(q, d, tap)=>{ if (!tap) go(); }});
    lvKey = k=>{ if (k==="go") go(); };
  });
}

/* ---------- crosses: pick the free runner as he hits his spot ---------- */
function lvGameCross(st, m){
  const a = lvAttr(st), e = lvEase(st, a.pas), kit = lvKits(st), left = ["LW","LB"].includes(lvPos(st)), X = x => left ? 300-x : x;
  const R = [{from:[X(214),124], to:[X(170),26], spot:[X(172),38]}, {from:[X(138),140], to:[X(122),20], spot:[X(128),34]}];
  const marked = Math.floor(Math.random()*2), per = clamp(1750*(1 + e*.35), 1250, 2300), rr = clamp(14*(1 + e), 9, 21);
  return new Promise(res=>{
    lvShow(`${lvHead(st, m.min)}<h2 class="lv-t">Cross it in</h2><p class="lv-s">Drag the ball onto the free runner and let go as he reaches his green spot.</p>
      <div class="lv-stage">${lvField("top", R.map((r,i)=>`<circle cx="${r.spot[0]}" cy="${r.spot[1]}" r="${rr}" fill="rgba(74,222,128,.28)" stroke="#4ADE80" stroke-width="1.5"/>`).join("")
          + R.map((r,i)=>`<g id="lvR${i}">${lvMan(0,0,kit.us,{num:[9,11][i], run:true})}</g>`).join("") + `<g id="lvRd">${lvMan(0,0,kit.them,{run:true})}</g>` + lvMan(X(272), 34, kit.us, {ring:"#F5C542"}) + lvBallSvg("lvCb", X(262), 36, 4))}
        ${R.map((r,i)=>`<button type="button" class="lv-tap lv-run-btn" data-i="${i}" ${i===marked?"data-marked":""} aria-label="Cross to number ${[9,11][i]}"></button>`).join("")}</div>
      <button type="button" class="btn big lv-act" disabled>Pick your man</button>`);
    lvSkippable(res);
    const t0 = performance.now() + 300, btns = lvEl.querySelectorAll(".lv-run-btn"); let t = 0, done = false;
    const pos = (r, k) => [r.from[0] + (r.to[0]-r.from[0])*k, r.from[1] + (r.to[1]-r.from[1])*k];
    // in 3D: from behind you on the wing, the runners in the box; where each is on the stage, for the buttons and aiming
    const g3 = typeof G3!=="undefined" ? (L => G3.cross(lv$(".lv-stage"), {...L, me:L.me, mates:[L.mates[1], L.mates[2]], marker:L.foe, crosser:[X(272), 34], ball:[X(262), 36], spots:R.map(r=>[...r.spot, rr])}))(lv3dLooks(st, kit, "box")) : null;
    const scr = [[0, 0], [0, 0]];
    lvLoop(now=>{
      if (done) return false;
      t = Math.max(0, now-t0)/per;
      R.forEach((r,i)=>{ const [x,y] = pos(r, Math.min(t, 1.1)); lvMove(`#lvR${i}`, x, y); scr[i] = g3 ? g3.run(i, x, y) : [x, y - 14]; btns[i].setAttribute("style", lvPct(...scr[i]));
        if (i===marked){ lvMove("#lvRd", x + (left ? -11 : 11), y + 5); if (g3) g3.run(-1, x + (left ? -11 : 11)*.6, y + 4); } });
      if (t>1.25){ end(-1); return false; }
    });
    const end = async i=>{
      if (done) return; done = true; cancelAnimationFrame(lvRaf);
      if (i<0) return res({ok:false, big:"Too late", small:"The chance has gone", bonus:-.08});
      const r = R[i], [x,y] = pos(r, Math.min(t, 1.1)), d = Math.hypot(x - r.spot[0], y - r.spot[1]);
      // decide what came of it, then show it
      const R2 = i===marked ? {ok:false, big:"Cleared", small:"He was marked", bonus:-.08, k:"cleared"}
        : d>rr ? {ok:false, big:"Wasted", small: t<1 && Math.hypot(x-r.from[0], y-r.from[1]) < Math.hypot(r.spot[0]-r.from[0], r.spot[1]-r.from[1]) ? "Crossed too early" : "Crossed too late", bonus:-.08, k:"wasted"}
        : Math.random() < lvConv(st, m, .42) ? {ok:true, big:"Assist!", small:"A perfect cross, buried with a header", a:1, k:"assist"} : {ok:true, big:"Great cross", small:"His header was saved", bonus:.12, k:"saved"};
      lvEl.querySelectorAll(".lv-legs.run").forEach(l=>l.classList.remove("run"));
      if (g3){ if (typeof SND!=="undefined") SND.kick(.8); await g3.go(i, r.spot, {res:R2.k}); } else { lvKick(); await lvFly("#lvCb", [X(262), 36], r.spot, 420, {h:30, spin:1.4}); }
      delete R2.k; res(R2);
    };
    btns.forEach(b=>lvTap(b, ()=>end(+b.dataset.i)));
    const from = g3 ? g3.ballStage() : [X(262), 36], aimAt = q => { if (Math.hypot(q[0] - from[0], q[1] - from[1]) < 16) return -1;
      let best = -1, bd = 46; R.forEach((r, i)=>{ const [x, y] = scr[i], d = Math.hypot(q[0] - x, q[1] - (y + 4)); if (d<bd){ bd = d; best = i; } }); return best; };
    lvDrag(lv$(".lv-stage"), {from, ok:()=>!done, move:q=>{ const i = aimAt(q); btns.forEach((b, j)=>b.classList.toggle("aim", j===i)); },
      end:q=>{ const i = aimAt(q); btns.forEach(b=>b.classList.remove("aim")); if (i>=0) end(i); }});
    lvKey = k=>{ const i = {l:left?0:1, r:left?1:0}[k]; if (i!=null) end(i); };
  });
}

/* ---------- tackles and blocks: timing ---------- */
function lvGameTiming(st, m){
  const f = st.f, a = lvAttr(st), block = m.g==="block", kit = lvKits(st);
  const e = lvEase(st, block ? a.def : a.def*.7 + a.pac*.3);
  const zone = clamp(.14*(1 + e*1.2), .06, .3), mid = block ? .78 : .66, per = clamp(1300*(1 + e*.45), 750, 1750);
  const T = block ? {t:"Shot heading for goal!", s:"Throw yourself in the way: tap when the ball reaches the green.", b:"Block!"}
    : {t:"Counter-attack!", s:"He's running at you. Tap to tackle when he's in the green.", b:"Tackle!"};
  return new Promise(res=>{
    lvShow(`${lvHead(st, m.min)}<h2 class="lv-t">${T.t}</h2><p class="lv-s">${T.s}</p>
      <div class="lv-stage">${lvField(block ? "side" : "none", `<path d="M10 92H290" stroke="rgba(255,255,255,.3)" stroke-width="3" stroke-dasharray="8 6"/>
          <rect x="${(10 + 280*(mid-zone/2)).toFixed(1)}" y="52" width="${(280*zone).toFixed(1)}" height="78" rx="10" fill="rgba(74,222,128,.3)" stroke="#4ADE80" stroke-width="2"/>
          <g id="lvMe">${lvMan(0, 0, kit.us, {ring:"#F5C542"})}</g>
          ${block ? `${lvMan(18, 100, kit.them)}${lvBallSvg("lvRun", 10, 92, 5)}` : `<g id="lvRun">${lvMan(0, 8, kit.them, {run:true})}${lvBallSvg("lvRunB", 9, 6, 3.6, false)}</g>`}`)}</div>
      <button type="button" class="btn primary big lv-act">${T.b}</button>`);
    lvSkippable(res);
    let p = -.1, done = false; const t0 = performance.now() + 450, mx = 10 + 280*mid;
    // in 3D: from behind you, him running at you (or the shot coming at you), the green a band across his path
    const g3 = typeof G3!=="undefined" ? (L => G3.tackle(lv$(".lv-stage"), {...L, me:L.me, them:block ? L.taker : L.foe, block, mid, zone:[mid - zone/2, mid + zone/2]}))(lv3dLooks(st, kit, "box")) : null;
    lvMove("#lvMe", mx, 140);
    const place = () => { const x = 10 + clamp(p, -.1, 1)*280; if (g3) g3.p(clamp(p, -.1, 1)); if (block) lvBallAt("#lvRun", x, 92, 1, 0, x*4); else { lvMove("#lvRun", x, 92); lvBallAt("#lvRunB", 9, 6, 1, 0, x*5); } };
    lvLoop(now=>{ if (done) return false; p = (now-t0)/per; place(); if (p>=1){ go(true); return false; } });
    const go = async (late)=>{
      if (done || (p<0 && !late)) return;   // he isn't on the pitch yet: a tap now doesn't count
      done = true; cancelAnimationFrame(lvRaf); lv$(".lv-act").disabled = true;
      const ok = Math.abs(p-mid)<=zone/2, early = p<mid-zone/2, x = 10 + clamp(p, -.1, 1)*280;
      // a tackle you mistime catches the man, not the ball: the later (or the more reckless the dive), the worse it is
      let foulR = null;
      if (!ok && !block && !late){
        const off = early ? (mid - zone/2) - p : p - (mid + zone/2);
        const foul = early ? off < .1 && Math.random() < .6 : off < .34;
        if (foul) foulR = lvFoul(st, m, early ? .3*(1 - off/.1) : off/.34, early);
      }
      // you go to ground: a slide towards where he is (and the ball flying off if you got it, or him going down)
      if (g3) await g3.go({ok, foul:!!foulR});
      else {
        lvTween(260, k=>{ const q = lvEaseOut(k); lvMove("#lvMe", mx + (x - mx)*q*.8, 140 - 34*q, (x<mx ? -1 : 1)*70*q); });
        if (ok){ await lvWait(120); if (block) await lvFly("#lvRun", [x, 92], [x - 40, 30], 380, {h:24, spin:2}); else await lvFly("#lvRunB", [9, 6], [9, -50], 380, {h:20, spin:2}); }
        else await lvWait(260);
      }
      if (ok) return res({ok:true, big: block ? "Blocked!" : "Tackle won!", small: block ? "Off your shin and away" : "Clean as a whistle", bonus:.3});
      if (foulR) return res(foulR);
      const why = early ? (block ? "You went down too soon" : "You dived in") : (block ? "Too late" : "He skipped past you");
      if (Math.random() >= (block ? .72 : .52)*m.q) return res({ok:false, big:"Got away with it", small:`${why}, but the shot went wide`, bonus:-.1});
      const og = block && Math.random()<.3;   // a block that goes wrong can deflect in off you
      res(og ? {ok:false, big:"Own goal", small:"It deflected in off you", og:1, bonus:-.45} : {ok:false, big:"They score", small:why, ga:1, bonus:-.3});
    };
    lvTap(lv$(".lv-act"), ()=>go()); lvTap(lv$(".lv-stage"), ()=>go());
    lvKey = k=>{ if (k==="go") go(); };
  });
}

/* ---------- interceptions: read the passer's eyes ---------- */
function lvGameIntercept(st, m){
  const f = st.f, a = lvAttr(st), e = lvEase(st, a.def*.7 + a.pas*.3), kit = lvKits(st);
  const react = clamp(700*(1 + e), 400, 1100), wait = 700 + Math.random()*800, dummy = f.oppStr > a.def + 3 && Math.random()<.35;
  const L = {l:[70,110], c:[150,126], r:[230,110]};
  return new Promise(res=>{
    lvShow(`${lvHead(st, m.min)}<h2 class="lv-t">Cut out the pass</h2><p class="lv-s">He's passing to one of his three team-mates. When his lane lights up gold, tap it to step in. He might look one way first.</p>
      <div class="lv-stage">${lvField("bottom", `${Object.entries(L).map(([z,[x,y]])=>`<path id="lvLn${z}" d="M150 46L${x} ${y}" stroke="rgba(255,255,255,.13)" stroke-width="14" stroke-linecap="round"/>`).join("")}${lvMan(150,40,kit.them)}${Object.values(L).map(([x,y])=>lvMan(x, y, kit.them)).join("")}<g id="lvMe">${lvMan(0,0,kit.us,{ring:"#F5C542"})}</g>
          <path id="lvLook" d="M0 0" stroke="#F5C542" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6" opacity="0"/>${lvBallSvg("lvIb", 150, 44, 4)}`)}
        <div class="lv-thirds">${["l","c","r"].map(z=>`<button type="button" class="lv-tap" data-z="${z}" aria-label="Cut out the pass ${{l:"left",c:"through the middle",r:"right"}[z]}"></button>`).join("")}</div></div>
      <button type="button" class="btn big lv-act" disabled>Watch his eyes…</button>`);
    lvSkippable(res);
    const stage = lv$(".lv-stage"), look = lv$("#lvLook"), act = lv$(".lv-act"), lane = (z, col) => lv$("#lvLn" + z)?.setAttribute("stroke", col), t0 = performance.now(); let dir = null, at = 0, done = false, faked = !dummy, cur = [150, 44];
    lvMove("#lvMe", 150, 86);
    const show = z => { const [x,y] = L[z]; look.setAttribute("d", `M150 46L${150 + (x-150)*.72} ${46 + (y-46)*.72}`); look.setAttribute("opacity", 1); };
    lvLoop(now=>{
      if (done) return false;
      const t = now - t0;
      if (!faked && t>=wait-450){ faked = true; show(pick(["l","c","r"])); setTimeout(()=>{ if (!dir && lvEl) look.setAttribute("opacity", 0); }, 200); }
      if (!dir && t>=wait){ dir = pick(["l","c","r"]); at = now; stage.dataset.look = dir; show(dir); lane(dir, "rgba(245,197,66,.42)"); act.textContent = "Now! Tap his lane"; act.classList.add("primary"); }
      if (dir){ const k = clamp((now-at-react*.45)/(react*.55), 0, 1), [x,y] = L[dir]; cur = [150 + (x-150)*k, 44 + (y-44)*k]; lvBallAt("#lvIb", cur[0], cur[1], 1, 0, k*500, k>0); if (k>=1){ end(null); return false; } }
    });
    const end = async z=>{
      if (done) return; done = true; cancelAnimationFrame(lvRaf);
      const ok = z && (dir ? z===dir : Math.random()<1/3);
      if (z) lane(z, ok ? "rgba(74,222,128,.5)" : "rgba(248,113,113,.45)");
      // you step across into the lane you picked; if it's the right one, the ball's yours
      if (z){ const tx = {l:104, c:150, r:196}[z]; await lvTween(200, k=>lvMove("#lvMe", 150 + (tx-150)*lvEaseOut(k), 86 + 6*k));
        if (ok) await lvFly("#lvIb", cur, [tx + 6, 90], 160); }
      if (ok) return res(Math.random()<.08 ? {ok:true, big:"Intercepted!", small:"…and the counter ends in a goal", gf:1, bonus:.4} : {ok:true, big:"Intercepted!", small: dir ? "You read it perfectly" : "A lucky guess", bonus:.3});
      const why = !z ? "Too slow to react" : !dir ? "You went before he'd decided" : "Wrong lane";
      res(Math.random() < .3*m.q ? {ok:false, big:"They score", small:`${why}: they broke through`, ga:1, bonus:-.3} : {ok:false, big:"Pass completed", small:why, bonus:-.1});
    };
    lvEl.querySelectorAll(".lv-thirds button").forEach(b=>lvTap(b, ()=>end(b.dataset.z)));
    lvKey = k=>{ if (k!=="go") end(k); };
  });
}

/* ---------- saves and penalties: react to the shot ---------- */
function lvGameSave(st, m){
  const f = st.f, a = lvAttr(st), pen = m.v==="pen", kit = lvKits(st), e = lvEase(st, a.def);
  const react = pen ? clamp(470*(1 + e*.5), 380, 600) : clamp(720*(1 + e*.8), 420, 1000);   // the ball's flight: a penalty's on you in half a second
  // how far you can get from the middle of the goal, and how much your hands cover at the end of the dive: both grow
  // with your shot-stopping. The dive itself takes a quarter of a second
  const R = clamp(80 + e*50, 60, 108), hands = clamp(22 + e*10, 16, 29), diveMs = 250, C = [150, 84];
  const T = pen ? {t:"Penalty!", s:"Watch the ball, then tap where it's going: you dive there. Go too early and he'll put it the other way."}
    : pick([{t:"One-on-one!", s:"He's through. Watch the ball and tap where it's going: you dive there."}, {t:"Shot from the edge of the box", s:"Watch the ball, then tap where it's going: you dive there."}]);
  return new Promise(res=>{
    lvShow(`${m.head || lvHead(st, m.min)}<h2 class="lv-t">${m.title || T.t}</h2><p class="lv-s">${T.s}</p>
      <div class="lv-stage lv-savestage" role="button" tabindex="0" aria-label="Tap where the ball is going to dive there">${lvGoalSvg(kit.us, null, true)}
        <span class="lv-cue">${pen ? "Penalty" : "Here he comes"}…</span></div>
      <button type="button" class="btn big lv-act" disabled>Watch the ball</button>`);
    lvSkippable(res);
    const stage = lv$(".lv-stage");
    let target = null, tap = null, kp = null, tapAt = 0, rel = 0, done = false, curl = 0, diving = null;
    const windUp = (pen ? 1100 : 650) + Math.random()*700, t0 = performance.now();
    // in 3D: their striker runs up and shoots, and you're the keeper diving (g3d.js)
    const g3 = typeof G3!=="undefined" ? G3.save(stage, lv3dLooks(st, kit, pen ? "pen" : "box")) : null;
    if (g3) g3.runup(windUp);
    // where he puts it: mostly the corners, now and then down the middle; and away from you if you've gone early
    const pickTarget = () => {
      let side = Math.random()<.5 ? -1 : 1;
      if (tap){ const ts = tap[0]<150 ? -1 : 1; if (Math.random()<.8) side = -ts; }
      if (!tap && Math.random()<.12) return [150 + (Math.random()*40 - 20), 46 + Math.random()*62];
      return [150 + side*(46 + Math.random()*70), 38 + Math.random()*76];
    };
    lvLoop(now=>{
      if (done) return false;
      if (!target && now-t0>=windUp){ target = pickTarget(); rel = now; curl = (Math.random()*2-1)*(pen ? 4 : 12); lv$(".lv-cue")?.remove(); g3?.release(target[0], target[1], curl, react); if (typeof SND!=="undefined") SND.kick(.9); }
      if (target){ const k = Math.min(1, (now-rel)/react), q = lvEaseOut(k); lvBallAt("#lvBall", 150 + (target[0]-150)*q + curl*Math.sin(Math.PI*q), 166 + (target[1]-166)*q, 1 - .38*q, 0, k*480, true); if (k>=1){ end(); return false; } }
    });
    // a dive towards where you tapped, as far as you can reach
    const dive = pt=>{
      if (tap || done || !pt) return; tap = pt; tapAt = performance.now();
      const dx = pt[0] - C[0], dy = pt[1] - C[1], L = Math.hypot(dx, dy), s = L > R ? R/L : 1;
      kp = [C[0] + dx*s, C[1] + dy*s];
      const rot = clamp(dx/R, -1, 1)*(dy > 0 ? 80 : 62);
      lv$("#lvKp")?.classList.add("dive");
      diving = g3 ? g3.dive(kp[0], kp[1], rot, diveMs) : lvTween(diveMs, k=>{ const q = lvEaseOut(k); lvMove("#lvKp", C[0] + (kp[0]-C[0])*q, C[1] + (kp[1]-C[1])*q, rot*q, 1 + .06*q); });
    };
    // the ball always finishes its flight and your dive always finishes, however late you went, before the verdict
    const end = async ()=>{
      if (done) return; done = true;
      if (!target) target = pickTarget();
      // where you were when it got there: still on your way if you went late
      const arrive = rel + react, prog = tap ? clamp((arrive - tapAt)/diveMs, 0, 1) : 0, pq = lvEaseOut(prog);
      const at = tap ? [C[0] + (kp[0]-C[0])*pq, C[1] + (kp[1]-C[1])*pq] : C;
      const dist = Math.hypot(target[0] - at[0], (target[1] - at[1])*.85), reach = tap ? hands : hands*.8;
      const held = dist < reach*.55, saved = dist < reach || (dist < reach*1.25 && Math.random() < .35);
      if (diving) await diving;
      const post = !saved && Math.random() > .92*m.q;
      if (g3){ g3.release(target[0], target[1], curl, 1); await g3.finish(saved, post); await lvWait(120); }
      else {
        lvBallAt("#lvBall", target[0] + (saved ? (target[0]<150 ? 10 : -10) : 0), saved ? target[1] - 6 : target[1], .62);
        if (!saved) lvRipple(target[0], target[1]);
        await lvWait(250);
      }
      if (saved) return res({ok:true, big: held ? "Held it!" : "Saved!", small: pen && tap && tapAt<rel ? "You guessed right" : held ? (pen ? "Penalty saved, and held" : "Safe hands") : dist < reach ? "Pushed it round the post" : "Fingertips!", bonus: pen ? .55 : held ? .38 : .32});
      if (post) return res({ok:true, big:"Off the post!", small:"Lucky", bonus:-.05});
      res({ok:false, big:"Goal", ga:1, bonus: pen ? -.1 : -.3,
        small: !tap ? "You didn't move" : tapAt<rel && (target[0]<150) !== (tap[0]<150) ? "You went too early: he put it the other way" : prog<1 ? "Too late: you couldn't get across" : dist < reach*2 ? "Just out of reach" : "Wrong way"});
    };
    // tap (or click) where it's going; in 3D the tap is found on the goal in the picture
    const toGoal = ev => g3 ? g3.toGoal(ev.clientX, ev.clientY) : (r => [(ev.clientX - r.left)/r.width*300, (ev.clientY - r.top)/r.height*180])(stage.getBoundingClientRect());
    stage.addEventListener("pointerdown", ev=>{ if (ev.target.closest("button")) return; ev.preventDefault(); dive(toGoal(ev)); });
    lvKey = k=>{ const P = {l:[62, 92], r:[238, 92], c:[150, 60]}[k]; if (P) dive(P); };
  });
}

/* ---------- rushing out: smother it after his heavy touch ---------- */
function lvGameRush(st, m){
  const f = st.f, a = lvAttr(st), e = lvEase(st, a.def*.7 + a.pac*.3), kit = lvKits(st);
  const run = clamp(1900*(1 + e*.3), 1300, 2400), react = clamp(620*(1 + e), 330, 980), heavyAt = .35 + Math.random()*.35;
  return new Promise(res=>{
    lvShow(`${lvHead(st, m.min)}<h2 class="lv-t">He's through!</h2><p class="lv-s">Wait for his heavy touch, then rush out and smother it.</p>
      <div class="lv-stage">${lvField("bottom", `<g id="lvSt">${lvMan(0,0,kit.them,{run:true})}</g>${lvBallSvg("lvRb", 150, 30, 4)}<text id="lvBang" x="0" y="0" font-size="24" font-weight="900" fill="#F5C542" opacity="0" font-family="Big Shoulders Display,sans-serif">!</text>
          <g id="lvGk">${lvMan(0,0,kit.us,{ring:"#F5C542"})}</g>`)}</div>
      <button type="button" class="btn primary big lv-act">Rush out!</button>`);
    lvSkippable(res);
    lvMove("#lvGk", 150, 168);
    const stage = lv$(".lv-stage"), t0 = performance.now() + 300; let k = 0, heavy = 0, done = false;
    lvLoop(now=>{
      if (done) return false;
      k = Math.max(0, now-t0)/run; const y = 20 + k*112;
      lvMove("#lvSt", 150, y);
      if (!heavy && k>=heavyAt){ heavy = now; stage.dataset.heavy = 1; const b = lv$("#lvBang"); b.setAttribute("x", 160); b.setAttribute("y", y - 10); b.setAttribute("opacity", 1); }
      lvBallAt("#lvRb", 150 + (heavy ? 4 : 0), y + 8 + (heavy ? Math.min(22, (now-heavy)/12) : 0), 1, 0, y*6);
      if (k>=1 || (heavy && now-heavy > react*1.8)){ end(true); return false; }
    });
    const end = async late=>{
      if (done) return; done = true; cancelAnimationFrame(lvRaf); lv$(".lv-act").disabled = true;
      const now = performance.now(), ok = heavy && !late && now-heavy <= react;
      lv$("#lvSt .lv-legs")?.classList.remove("run");
      await lvTween(260, q=>lvMove("#lvGk", 150, 168 - lvEaseOut(q)*(ok ? 50 : 26), 0, 1 + (ok ? .08*q : 0)));
      if (ok) return res({ok:true, big:"Smothered it!", small:"Brave and perfectly timed", bonus:.35});
      if (!heavy) return res(Math.random() < .78*m.q ? {ok:false, big:"Rounded you", small:"You went too early", ga:1, bonus:-.3} : {ok:false, big:"Rounded you", small:"…but he ran it out of play", bonus:-.1});
      res(Math.random() < .58*m.q ? {ok:false, big:"He scores", small:"Too late: he got the shot away", ga:1, bonus:-.25} : {ok:true, big:"Saved!", small:"Late, but you got a hand to it", bonus:.15});
    };
    lvTap(lv$(".lv-act"), ()=>end(false)); lvTap(stage, ()=>end(false));
    lvKey = k=>{ if (k==="go") end(false); };
  });
}

/* ---------- the lab's games as match moments: one go, against this opponent, with your attributes ---------- */
const lvHelpKey = m => m.g==="lab" ? "lg_" + m.v : m.g==="shot" ? "flick3" : m.g==="save" ? "save2" : m.g;   // "flick2": the flick-and-bar shot's guide (1.40), shown once more
async function lvGameLab(st, m){
  const g = (typeof LAB_NEW!=="undefined" ? LAB_NEW : []).find(x=>x.id===m.v), K = LV_LABM[m.v];
  if (!g || !K) return lvAuto(st, m);
  const a = lvAttr(st), kits = lvKits(st), GK = lvKeeper(st, a.fin);
  const lab = {match:true, once:true, min:m.min, a, ease:lvEase(st, a[K[1]]), kr:GK.r, pos:lvPos(st), game:g, next:"Next moment",
    kits:{us:kits.us, them:kits.them, usTrim:LV_TRIM[kits.us] || "#FFFFFF", themTrim:LV_TRIM[kits.them] || "#FFFFFF"}, cols:lvCols(st)};
  const R = await g.run({...st, lab}).catch(e=>{ if (e==="lab-quit") return "skip"; throw e; });
  if (!R || R==="skip") return "skip";
  const ok = !!R.ok, conv = p => Math.random() < p*m.q, small = R.small || "";
  switch (K[0]){
    case "goal": case "pen": return ok ? {ok, big:"Goal!", small, g:1} : {ok:false, big:R.big, small, bonus:-.06};
    case "assist": return !ok ? {ok:false, big:R.big, small, bonus:-.05} : conv(.62) ? {ok, big:"Assist!", small, a:1} : {ok, big:R.big, small:"The chance went begging", bonus:.15};
    case "chance": return !ok ? {ok:false, big:R.big, small, bonus:-.05} : conv(.4) ? {ok, big:"Goal!", small:"…and you finished it", g:1} : conv(.35) ? {ok, big:"Assist!", small:"…and you set it up", a:1} : {ok, big:R.big, small, bonus:.15};
    case "keep": return ok ? {ok, big:R.big, small, bonus:.2} : {ok:false, big:R.big, small, bonus:-.1};
    default: return ok ? {ok, big:R.big, small, bonus:.3} : conv(K[0]==="save" ? .6 : .4) ? {ok:false, big:"They score", small, ga:1, bonus:-.3} : {ok:false, big:R.big, small, bonus:-.1};
  }
}
const LV_GAMES = {shot:lvGameShot, header:lvGameHeader, pass:lvGamePass, move:lvGameMove, takeon:lvGameTakeon, cross:lvGameCross,
  tackle:lvGameTiming, block:lvGameTiming, intercept:lvGameIntercept, save:lvGameSave, claim:lvGameClaim, rush:lvGameRush, lab:lvGameLab};
