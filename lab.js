/* ================= THE MINI-GAME LAB (development) =================
   Every mini-game in one place, to look at and play: the ones used in matches, the training drills, and the new games
   still in development (labgames.js), which are never used in matches. Open it from the account menu, under
   Development. The lab is a sandbox: each game gets a pretend match of its own (st.lab, read by moments.js), so
   nothing played here touches the career: no coins, no stats, no training, no saves, and the "first time" guides
   aren't ticked off. Loaded after moments.js, drills.js and labgames.js; only called once the page is running. */
const LAB_DIFF = {easy:{t:"Easy", ease:.25, a:82, kr:58}, normal:{t:"Normal", ease:0, a:70, kr:72}, hard:{t:"Hard", ease:-.25, a:58, kr:82}};
let labDiff = "normal", labCat = "all";

// small pictures for the lab's cards: lines and shapes in a 24-point square
const LAB_IC = {
  goal:`<path d="M3.5 15V6.5h17V15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 9h12M6 12h12M9 6.5V15M15 6.5V15" stroke="currentColor" stroke-width=".7" opacity=".5"/><circle cx="12" cy="19.5" r="2.4" fill="currentColor"/>`,
  wall:`<path d="M3.5 13V5.5h17V13" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="8" y="12" width="2.4" height="5" rx="1" fill="currentColor"/><rect x="11" y="12" width="2.4" height="5" rx="1" fill="currentColor"/><rect x="14" y="12" width="2.4" height="5" rx="1" fill="currentColor"/><circle cx="6" cy="20" r="2" fill="currentColor"/>`,
  head:`<circle cx="9" cy="15" r="4.2" fill="currentColor"/><path d="M5.6 21.5q3.4-3 6.8 0" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="6.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14.5 9l-2 2.4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.5 1.5"/>`,
  pass:`<circle cx="5" cy="17" r="2.6" fill="currentColor"/><circle cx="19" cy="7" r="2.6" fill="currentColor"/><path d="M7.5 15.3 15 9.8" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.4 2"/><path d="M13.4 8.6l3.2-.6-.8 3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  move:`<circle cx="4.5" cy="19" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19.5" cy="5" r="2" fill="currentColor"/><path d="M6 17.5l4.6-4M13.6 10.6l4.4-4" stroke="currentColor" stroke-width="1.8"/>`,
  dribble:`<circle cx="12" cy="18.5" r="2.4" fill="currentColor"/><path d="M12 15.5c-5-2-5-6 0-8s5-5 0-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  cross:`<path d="M3.5 19c4-12 11-14 16-12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.4 2"/><circle cx="19.5" cy="7.5" r="2.4" fill="currentColor"/><path d="M14 21h7" stroke="currentColor" stroke-width="1.8"/>`,
  tackle:`<path d="M3 17.5h10l5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.5" cy="9.5" r="2.4" fill="currentColor"/><path d="M5 21h14" stroke="currentColor" stroke-width="1.2" opacity=".5"/>`,
  block:`<path d="M12 3.5l6.5 2.6v5.4c0 4.2-2.8 7.4-6.5 9-3.7-1.6-6.5-4.8-6.5-9V6.1z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="11.5" r="2.4" fill="currentColor"/>`,
  eye:`<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/>`,
  lanes:`<path d="M8 3v18M16 3v18" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2" opacity=".6"/><circle cx="12" cy="7" r="2.4" fill="currentColor"/><circle cx="12" cy="17" r="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  glove:`<path d="M7 20v-7.5a1.4 1.4 0 0 1 2.8 0V8a1.4 1.4 0 0 1 2.8 0v3-5a1.4 1.4 0 0 1 2.8 0v5-3.5a1.4 1.4 0 0 1 2.8 0V15c0 3-2.2 5-5 5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="5" cy="5.5" r="2.2" fill="currentColor"/>`,
  spot:`<path d="M4 12V5h16v7" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/><circle cx="12" cy="16" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  claim:`<path d="M5 13a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="8.5" r="2.6" fill="currentColor"/><path d="M4 16h4M16 16h4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  rush:`<path d="M4 12h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="12" r="1.8" fill="currentColor"/>`,
  lights:`<rect x="4" y="8" width="16" height="8" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor" opacity=".6"/><circle cx="16" cy="12" r="1.8" fill="currentColor" opacity=".3"/>`,
  shuttle:`<path d="M4 4v16M20 4v16" stroke="currentColor" stroke-width="1.8"/><path d="M7.5 12h9M10 9.5 7.5 12l2.5 2.5M14 9.5l2.5 2.5-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  juggle:`<circle cx="12" cy="5.5" r="2.4" fill="currentColor"/><path d="M12 9v4M9 21l3-5 3 5M8 13h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15.5 4.5q2 1.5 0 3" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  bar:`<path d="M3 20V6h18v14" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M5 6h14" stroke="currentColor" stroke-width="3.2"/><circle cx="12" cy="3.5" r="2" fill="currentColor"/>`,
  cones:`<path d="M6 8l2-5 2 5zM14 14l2-5 2 5zM6 21l2-5 2 5z" fill="currentColor"/><path d="M12 22c-3-3 4-4 1-8s4-5 1-9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="1.6 1.6"/>`,
  boot:`<path d="M4 9h6l2 4h6.5a2.5 2.5 0 0 1 0 5H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 18v2M10 18v2M14 18v2M18 18v2" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="5.5" r="2.2" fill="currentColor"/>`,
  arrows:`<path d="M12 3l3 3h-6zM12 21l-3-3h6zM3 12l3-3v6zM21 12l-3 3V9z" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/>`,
  flag:`<path d="M6 21V3" stroke="currentColor" stroke-width="1.8"/><path d="M6 4h11l-2.5 3.5L17 11H6z" fill="currentColor"/><path d="M3 21h8" stroke="currentColor" stroke-width="1.6"/>`,
  target:`<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>`,
  circle:`<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2"/>${[0,1,2,3,4].map(k=>{ const a = (-90 + k*72)*Math.PI/180; return `<circle cx="${(12 + 8*Math.cos(a)).toFixed(1)}" cy="${(12 + 8*Math.sin(a)).toFixed(1)}" r="1.9" fill="currentColor"/>`; }).join("")}<circle cx="12" cy="12" r="1.6" fill="currentColor" opacity=".55"/>`,
  shield:`<circle cx="12" cy="13" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 13a5 5 0 0 1 10 0" fill="none" stroke="currentColor" stroke-width="3.2"/><circle cx="12" cy="19.5" r="2" fill="currentColor"/>`,
  legs:`<path d="M9 3v8l-3 10M15 3v8l3 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="18.5" r="2.2" fill="currentColor"/>`,
  bend:`<path d="M5 20C3 12 14 12 19 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.4 2"/><rect x="9" y="11.5" width="2" height="4.5" rx="1" fill="currentColor" opacity=".6"/><rect x="12" y="11.5" width="2" height="4.5" rx="1" fill="currentColor" opacity=".6"/><circle cx="5" cy="20" r="2" fill="currentColor"/>`,
  jump:`<circle cx="9" cy="6" r="2.4" fill="currentColor"/><circle cx="16" cy="9" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 9v6l-3 5M9 15l3 5M5 11l4-1 4 1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  sprint:`<path d="M13 3 6 14h5l-1 7 7-11h-5z" fill="currentColor"/>`,
  onetwo:`<circle cx="5" cy="18" r="2.2" fill="currentColor"/><circle cx="19" cy="14" r="2.2" fill="currentColor"/><path d="M7 17l10-2.5M17.5 12 9 6" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 1.8"/><circle cx="8" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
  volley:`<circle cx="15" cy="5.5" r="2.4" fill="currentColor"/><path d="M15 8.5v4" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.5 1.5"/><path d="M4 19l6-4 4 2 6-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  chip:`<path d="M4 20q8-18 16-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.4 2"/><circle cx="4" cy="20" r="2" fill="currentColor"/><path d="M12 21v-6M10 15h4" stroke="currentColor" stroke-width="1.8"/>`,
  bike:`<path d="M5 18l5-4 3 3 6-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19" cy="5" r="2.4" fill="currentColor"/><path d="M3 21h18" stroke="currentColor" stroke-width="1.2" opacity=".5"/>`,
  switch:`<path d="M4 18Q12 0 20 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.4 2"/><circle cx="4" cy="18" r="2.2" fill="currentColor"/><circle cx="20" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>`
};
const labIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${LAB_IC[k] || LAB_IC.goal}</svg>`;

/* ---------- the games: only the unreleased ones (labgames.js, p90.js) ---------- */
// the old training ground's sprint starts and beep test, scored as one go
async function labSprint(st){
  st.drill = {t:"Sprint starts", n:0}; st.lvl = 0;
  const rt = await drSprintCore(st); if (rt==="skip") return rt;
  return rt<0 ? {ok:false, big:"False start", small:"Wait for the green"} : {ok:rt<450, big:rt<330 ? "Rapid!" : rt<450 ? "Good start" : "Slow start", small:`${(rt/1000).toFixed(2)}s reaction`};
}
async function labBeep(st){
  st.drill = {t:"Beep test", n:0}; st.lvl = 0;
  const n = await drBeepCore(st); if (n==="skip") return n;
  return {ok:n>=8, big:`Level ${Math.floor(n/2)+1}`, small:`${n} shuttle${n===1 ? "" : "s"} of ${DR_BEEP_MAX}`};
}
// the lab is for games that aren't released yet, and (from 1.57) the old training ground's drills and arcade games,
// kept here to think about. The rest are in matches, or at the training centre (drills.js)
const LAB_GAMES = [
  ...(typeof LAB_NEW!=="undefined" ? LAB_NEW.filter(g=>g.cat==="new") : []),
  {id:"sprint", t:"Sprint starts", d:"The old training drill: go the moment the lights turn green.", cat:"old", ic:"lights", help:"sprint", run:labSprint},
  {id:"beep", t:"Beep test", d:"The old training drill: turn at each line, faster and faster.", cat:"old", ic:"shuttle", help:"beep", run:labBeep},
  ...(typeof LAB_NEW!=="undefined" ? LAB_NEW.filter(g=>g.cat==="arcade").map(g=>({...g, cat:"old"})) : []),
  ...(typeof LAB_P90!=="undefined" ? LAB_P90 : [])
];
const LAB_CATS = {match:"In matches", drill:"Training", arcade:"Arcade · training ground", new:"New · lab only", full:"Full match · lab only", old:"Old training · for later"};

/* ---------- the sandbox ---------- */
// a pretend match for one game: attributes and ease from the difficulty, your club's kit if you have a career
function labCtx(g){
  const D = LAB_DIFF[labDiff], career = typeof S!=="undefined" && S && S.player && !S.newing && S.club;
  const club = career ? meta(S.club) : {c1:"#F5C542", c2:"#15171A"};
  const them = lvNear(club.c1, "#1D4ED8") || lvNear(club.c1, "#0F172A") ? "#DC2626" : "#1D4ED8";
  const a = Object.fromEntries(["fin","pas","pac","def","sta"].map(k=>[k, D.a]));
  return {f:{opp:"Lab XI", oppStr:70, home:true}, X:{base:70, lf:1.4, la:1.2, t:1, pG:.3, pA:.2}, ev:[], g:0, a:0, og:0, bonus:0, left:1, log:[],
    lab:{a, ease:D.ease, kr:D.kr, pos:career ? S.player.pos : "ST", game:g, next:"Continue",
      kits:{us:club.c1, them, usTrim:club.c2 || "#15171A", themTrim:"#F8FAFC"}, cols:[club.c1, club.c2 || "#FFFFFF", "#F5C542", "#FFFFFF"]}};
}
// the lab's scoreboard: which game, the difficulty, any steps, and the way out
function labHead(st, step){
  const g = st.lab.game, train = st.lab.train;   // an arcade session at the training ground (drills.js) wears the same scoreboard
  return `<div class="lv-top lab-top"><span class="lv-sc"><b>${train ? "Arcade" : "Lab"}</b> · ${esc(g.t)}</span>
    ${step ? `<span class="lv-steps-dots" aria-label="Step ${step[0]} of ${step[1]}">${[...Array(step[1])].map((_,i)=>`<i class="${i<step[0]?"on":""}"></i>`).join("")}</span>` : ""}
    ${st.lab.tally ? `<span class="lab-tally">${st.lab.tally}</span>` : ""}${train ? "" : `<span class="lab-diff-pill">${LAB_DIFF[labDiff].t}</span>`}<button type="button" class="lv-skip" data-lv-skip>${train ? "End session" : "Exit"}</button></div>`;
}
// a game's guide, straight from its help card (without ticking it off as seen)
function labGuide(g){
  const H = LV_HELP[g.help]; if (!H) return "";
  return `<details class="lab-guide"><summary>How to play</summary>${H.svg ? `<div class="lv-demo" aria-hidden="true">${H.svg}</div>` : ""}<ol class="lv-steps">${H.steps.map(x=>`<li>${x}</li>`).join("")}</ol></details>`;
}

/* ---------- the lab's screens ---------- */
function labHome(){
  const list = LAB_GAMES.filter(g=>labCat==="all" || g.cat===labCat), n = c => LAB_GAMES.filter(g=>c==="all" || g.cat===c).length;
  return `<div class="lab">
    <div class="lab-head"><div><div class="lv-eye">Development</div><h2 class="lv-t">Mini-game lab</h2></div><button type="button" class="dlg-x lab-x" data-lab="close" aria-label="Close the lab">×</button></div>
    <p class="lab-intro">Mini-games that <b>aren't in the game yet</b>, and the <b>old training ground's</b> drills and arcade games, to try out as often as you like. <b>Nothing here touches your career</b>: no coins, no stats, no training, no saves. The released ones are in your matches and at the training ground.</p>
    <div class="lab-bar">
      <div class="lab-seg" role="group" aria-label="Difficulty">${Object.entries(LAB_DIFF).map(([k,D])=>`<button type="button" data-lab="diff" data-k="${k}" aria-pressed="${k===labDiff}">${D.t}</button>`).join("")}</div>
      <div class="chips lab-cats" role="group" aria-label="Show">${["all","new","full","old"].filter(c=>n(c)).map(c=>`<button type="button" class="chip ${c===labCat?"on":""}" data-lab="cat" data-k="${c}" aria-pressed="${c===labCat}">${c==="all" ? "All" : LAB_CATS[c].split(" ·")[0]} <small>${n(c)}</small></button>`).join("")}</div>
    </div>
    <div class="lab-grid">${list.map(g=>`<button type="button" class="lab-card ${g.cat}" data-lab="play" data-k="${g.id}">
      <span class="lab-ic">${labIcon(g.ic)}</span><span class="lab-txt"><b>${esc(g.t)}</b><small>${esc(g.d)}</small></span>
      <span class="lab-tag">${{new:"New", drag:"Drag", drill:"Drill", arcade:"Arcade", full:"90'", old:"Old"}[g.cat] || "Match"}</span></button>`).join("")}</div>
  </div>`;
}
// the lab's front page: resolves the button pressed, as [action, key]
function labAsk(){
  return new Promise(res=>{
    lvShow(labHome());
    lvEl.querySelectorAll("[data-lab]").forEach(b=>b.addEventListener("click", ()=>res([b.dataset.lab, b.dataset.k])));
  });
}
// one game, as many goes as you like: its card, the game, how it went
async function labPlay(g){
  if (await lvAsk(`<div class="lv-card lab-pre"><div class="lv-eye">${esc(LAB_CATS[g.cat])} · ${LAB_DIFF[labDiff].t}</div>
      <div class="lab-pre-h"><span class="lab-ic big">${labIcon(g.ic)}</span><h2 class="lv-t">${esc(g.t)}</h2></div><p>${esc(g.d)}</p>${labGuide(g)}
      <div class="lv-row"><button type="button" class="btn primary big" data-lv="go" data-lv-focus>Play</button><button type="button" class="btn" data-lv="back">Back to the lab</button></div></div>`)!=="go") return;
  for (;;){
    const st = labCtx(g);
    // Exit works at any point, even between goes: it stops the game (the new games won't draw another screen) and
    // comes back here
    let quit; const q = new Promise(r=>{ quit = r; }), box = lvEl;
    const onExit = e=>{ if (e.target.closest("[data-lv-skip]")){ st.lab.quit = true; quit("skip"); } };
    box.addEventListener("click", onExit);
    lvCountNext = true;
    const R = await Promise.race([g.run(st).catch(e=>{ if (e==="lab-quit") return "skip"; throw e; }), q]).finally(()=>box.removeEventListener("click", onExit));
    if (R==="skip" || !R) return;
    if (lv$(".lv-stage")) await lvOutcome(st, R);
    const again = await lvAsk(`<div class="lv-card lab-pre"><div class="lv-eye">${esc(g.t)} · ${LAB_DIFF[labDiff].t}</div>
      ${lvResHTML(R, "lab-res")}
      ${R.score!=null ? `<p class="lab-score">${esc(String(R.score))}</p>` : ""}
      <div class="lv-row"><button type="button" class="btn primary big" data-lv="again" data-lv-focus>Play again</button><button type="button" class="btn" data-lv="back">Back to the lab</button></div></div>`);
    if (again!=="again") return;
  }
}
async function labOpen(){
  if (lvEl) return;   // a match or a drill is already on screen
  lvOpen("Mini-game lab");
  try{
    for (;;){
      const [a, k] = await labAsk();
      if (a==="close") break;
      if (a==="diff") labDiff = k;
      else if (a==="cat") labCat = k;
      else if (a==="play"){ const g = LAB_GAMES.find(x=>x.id===k); if (g) await labPlay(g); }
    }
  } finally { lvClose(); }
}
