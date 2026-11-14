/* ================= MAIN MENU: PLAYER, MANAGER OR DIRECTOR OF FOOTBALL =================
   After signing in, the main menu: a Player career (build your player and play his career, game.js), a Manager
   career (run the team from the dugout, manager.js) or a Director of Football career (run the club, hire and fire the
   head coach, mgdof.js). Each mode has three save slots on the account, so one account can keep three of each. Slot 1 of the player career is where the one career lived
   before slots existed, so old saves turn up there. The last save played is a tap away at the top.
   Loaded after account.js and before manager.js and game.js; APP says which of the three is on screen, and game.js's
   render() hands over to Hub.render or Mgr.render when it isn't the player career. */
let APP = "hub";
const HUB_SLOTS = 3;
const Hub = (() => {
  const BOOT = "efp-boot";
  let view = "home", sure = "", playerSlot = 0, mountT = 0, recTab = "ach";
  // every save on the account, for the Records room (records.js)
  const allSaves = () => Object.fromEntries(MODES.map(m=>[m, Array.from({length:HUB_SLOTS}, (_, k)=>read(m, k + 1)).filter(Boolean)]));
  const recCheck = () => typeof Records!=="undefined" ? Records.check(allSaves(), typeof Mgr!=="undefined" ? Mgr.hall() : []) : null;
  const pKind = i => i===1 ? "career" : `career-${i}`;
  const mKind = i => `mgr-${i}`, dKind = i => `dof-${i}`;
  const MODES = ["player", "manager", "dof"];
  const keyOf = (mode, i) => Account.storageKey(mode==="player" ? pKind(i) : mode==="dof" ? dKind(i) : mKind(i));
  const MODE_NAME = {player:"Player career", manager:"Manager career", dof:"Director of Football"};
  const read = (mode, i) => { try{ return JSON.parse(localStorage.getItem(keyOf(mode, i))); }catch(e){ return null; } };
  const lastGet = () => { try{ return JSON.parse(localStorage.getItem(Account.storageKey("last"))); }catch(e){ return null; } };
  const lastSet = (m, i) => { try{ localStorage.setItem(Account.storageKey("last"), JSON.stringify({m, i})); }catch(e){} };
  const ago = t => { if (!t) return ""; const d = (Date.now() - t)/1000; return d<90 ? "just now" : d<3600 ? `${Math.round(d/60)} min ago` : d<86400 ? `${Math.round(d/3600)} h ago` : `${Math.round(d/86400)} d ago`; };

  /* ---------- what's in a slot ---------- */
  function pSum(d){
    if (!d || !d.player) return null;
    const tro = (d.trophies||[]).length, apps = (d.history||[]).reduce((n, h)=>n + ((h.tot && h.tot.apps)||0), 0), g = (d.history||[]).reduce((n, h)=>n + ((h.tot && h.tot.g)||0), 0);
    return {name:d.player.name, sub:`${d.player.pos} · ${d.club}`, club:d.club, season:seasonLabel(d.season), age:d.age, done:d.phase==="retired",
      stats:[["Seasons", (d.history||[]).length], ["Apps", apps], ["Goals", g], ["Trophies", tro]], updated:d.updated, look:d.player};
  }
  function mSum(d){ return d && typeof Mgr!=="undefined" ? Mgr.summary(d) : null; }
  const sumOf = (mode, i) => mode==="player" ? pSum(read(mode, i)) : mSum(read(mode, i));

  /* ---------- going into a save ---------- */
  // a different player career than the one already loaded this visit starts from a fresh page, so nothing from the
  // last one (squads, line-ups, mini-game state) is carried over
  function enter(mode, i){
    sure = "";
    if (mode==="player"){
      if (playerSlot && playerSlot!==i){ try{ sessionStorage.setItem(BOOT, JSON.stringify({m:"player", i})); }catch(e){} location.reload(); return; }
      if (APP==="manager" && typeof Mgr!=="undefined") Mgr.close();
      playerSlot = i; KEY = keyOf("player", i); S = null; draft = null; load(); normalize();
      APP = "player"; tab = "season"; showBoard = false; profileId = null; lastSet("player", i);
      paintBand(); render(); window.scrollTo({top:0}); return;
    }
    if (APP==="player" && S) save();
    if (APP==="manager" && typeof Mgr!=="undefined") Mgr.close();
    APP = "manager"; lastSet(mode, i); paintBand(mode==="dof" ? "dof" : "mgr");
    Mgr.open(i, keyOf(mode, i), mode==="dof" ? "dof" : "mgr"); window.scrollTo({top:0});
  }
  function wipe(mode, i){
    try{ localStorage.removeItem(keyOf(mode, i)); }catch(e){}
    if (mode==="player" && playerSlot===i){ S = null; playerSlot = 0; }
    const L = lastGet(); if (L && L.m===mode && L.i===i) try{ localStorage.removeItem(Account.storageKey("last")); }catch(e){}
  }
  function home(){
    if (APP==="player" && S) save();
    if (APP==="manager" && typeof Mgr!=="undefined") Mgr.close();
    APP = "hub"; view = "home"; sure = ""; paintBand(); render(); window.scrollTo({top:0});
  }
  function paintBand(role){
    const h = document.querySelector(".band h1"), sub = document.querySelector(".band .sub");
    if (h) h.textContent = "English Footballing Pyramid";
    if (sub) sub.textContent = APP==="manager" ? (role==="dof" ? "Director of Football · pick the coach, build the club" : "Manager career · run the team, build a dynasty") : APP==="player" ? "Player career · from the National League to the Champions League" : "Player · Manager · Director of Football";
    document.documentElement.dataset.app = APP;
  }

  /* ---------- the pictures on the two mode cards ---------- */
  const PLAYER_ART = `<svg class="mode-svg" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
    <defs><linearGradient id="hbP1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00F0A8"/><stop offset="1" stop-color="#00B4FF"/></linearGradient>
      <radialGradient id="hbP2" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#00F0A8" stop-opacity=".35"/><stop offset="1" stop-color="#00F0A8" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="200" fill="url(#hbP2)"/>
    <g stroke="rgba(255,255,255,.12)" fill="none"><path d="M-20 200 L120 96 L200 96 L340 200"/><path d="M60 200 L140 96 M180 96 L260 200"/><ellipse cx="160" cy="150" rx="70" ry="18"/></g>
    <g fill="none" stroke="url(#hbP1)" stroke-width="3" stroke-linecap="round" class="mode-streak"><path d="M30 60 L110 60"/><path d="M14 84 L96 84"/><path d="M40 108 L102 108"/></g>
    <g transform="translate(150 22)">
      <circle cx="22" cy="10" r="11" fill="#EAF2FF"/>
      <path d="M8 26 C14 22 30 22 36 26 L44 64 L30 66 L26 46 L18 66 L4 64 Z" fill="url(#hbP1)"/>
      <path d="M4 30 L-22 48 L-18 54 L8 40 Z M36 28 L64 20 L66 27 L40 38 Z" fill="#EAF2FF"/>
      <path d="M8 64 L-6 104 L-26 116 L-22 124 L4 112 L22 70 Z" fill="#EAF2FF"/>
      <path d="M30 66 L52 96 L84 92 L84 101 L48 108 L22 74 Z" fill="#EAF2FF"/>
    </g>
    <g class="mode-ball"><circle cx="250" cy="118" r="13" fill="#fff"/><path d="M250 109l6 4-2 7h-8l-2-7z" fill="#0B1020"/><circle cx="250" cy="118" r="13" fill="none" stroke="#00F0A8" stroke-width="2" opacity=".8"/></g>
  </svg>`;
  const MANAGER_ART = `<svg class="mode-svg" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
    <defs><linearGradient id="hbM1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#FF2E88"/></linearGradient>
      <radialGradient id="hbM2" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#7C5CFF" stop-opacity=".38"/><stop offset="1" stop-color="#7C5CFF" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="200" fill="url(#hbM2)"/>
    <g transform="translate(40 22)">
      <rect width="240" height="156" rx="6" fill="rgba(10,14,28,.6)" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/>
      <g stroke="rgba(255,255,255,.22)" fill="none" stroke-width="1.5"><path d="M120 0v156"/><circle cx="120" cy="78" r="22"/><rect x="0" y="40" width="34" height="76"/><rect x="206" y="40" width="34" height="76"/></g>
      <g fill="none" stroke="url(#hbM1)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="6 6" class="mode-run"><path d="M70 40 C110 20 150 24 182 48"/><path d="M78 120 C118 132 150 118 178 96"/></g>
      <path d="M176 44 l9 4 -7 7z M172 92 l10 1 -5 8z" fill="#FF2E88"/>
      <g font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="15" text-anchor="middle">
        ${[[30,78],[64,40],[64,116],[96,78],[150,44],[150,112],[186,78]].map(([x,y],k)=>`<circle cx="${x}" cy="${y}" r="11" fill="${k%2?"#00F0A8":"#EAF2FF"}"/><text x="${x}" y="${y+5}" fill="#0B1020">${k+1}</text>`).join("")}
        ${[[214,60],[214,98]].map(([x,y])=>`<text x="${x}" y="${y+6}" fill="#FF2E88" font-size="22">×</text>`).join("")}
      </g>
    </g>
  </svg>`;

  const DOF_ART = `<svg class="mode-svg" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
    <defs><linearGradient id="hbD1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD23F"/><stop offset="1" stop-color="#FF8A3D"/></linearGradient>
      <radialGradient id="hbD2" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#FFB020" stop-opacity=".3"/><stop offset="1" stop-color="#FFB020" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="200" fill="url(#hbD2)"/>
    <g transform="translate(38 30)">
      <rect width="244" height="140" rx="8" fill="rgba(10,14,28,.65)" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/>
      <g stroke="rgba(255,255,255,.12)">${[30, 60, 90, 120].map(y=>`<path d="M14 ${y}h216"/>`).join("")}</g>
      ${[[28,92],[60,74],[92,82],[124,52],[156,58],[188,30]].map(([x, h], k)=>`<rect x="${x}" y="${120 - h}" width="20" height="${h}" rx="3" fill="${k===5 ? "url(#hbD1)" : "rgba(255,210,63,.35)"}"/>`).join("")}
      <path class="mode-run" d="M22 96 L66 80 L98 88 L132 58 L166 64 L198 34 L226 20" fill="none" stroke="url(#hbD1)" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 6"/>
      <circle cx="226" cy="20" r="6" fill="#FFD23F"/>
    </g>
    <g transform="translate(236 128)"><circle r="26" fill="#0B1020" stroke="#FFD23F" stroke-width="2"/><text y="9" text-anchor="middle" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="26" fill="#FFD23F">£</text></g>
  </svg>`;

  /* ---------- the screens ---------- */
  function slotCard(mode, i){
    const s = sumOf(mode, i), id = `${mode}-${i}`;
    if (!s) return `<article class="slot empty"><div class="slot-n">Slot 0${i}</div>
      <div class="slot-empty"><span class="slot-plus" aria-hidden="true">+</span><b>Empty slot</b><span class="hint">${mode==="player" ? "Create a player and start a new career." : mode==="dof" ? "Run any club in the game, from above the dugout." : "Take charge of any club in the game."}</span></div>
      <button type="button" class="btn primary" data-hub="enter" data-m="${mode}" data-i="${i}">${mode==="player" ? "New player career" : mode==="dof" ? "New director career" : "New manager career"}</button></article>`;
    return `<article class="slot"><div class="slot-n">Slot 0${i}${s.done ? ` · <span class="pill">${mode==="player" ? "Retired" : "Finished"}</span>` : ""}<span class="slot-when">${esc(ago(s.updated))}</span></div>
      <div class="slot-id">${s.club ? clubBadge(s.club, 46) : ""}<div style="min-width:0"><p class="slot-name">${esc(s.name)}</p><p class="slot-sub">${esc(s.sub)}</p></div><span class="slot-season">${esc(s.season)}</span></div>
      <div class="slot-stats">${s.stats.map(([k, v])=>`<div><span class="label">${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>
      <div class="row"><button type="button" class="btn primary" data-hub="enter" data-m="${mode}" data-i="${i}">Continue</button>
        ${mode==="player" && s.done && typeof mgwFromPlayer==="function" ? `<button type="button" class="btn small" data-hub="tomgr" data-m="player" data-i="${i}">Go into management</button>` : ""}
        <button type="button" class="btn small danger" data-hub="del" data-m="${mode}" data-i="${i}">${sure===id ? "Tap again to delete" : "Delete"}</button></div>
      ${mode==="player" && s.done && sure==="mgrfull" ? `<p class="hint">All your manager slots are full. Delete one to start his managerial career.</p>` : ""}
      ${typeof UNI!=="undefined" ? uniCard(mode, i) : ""}</article>`;
  }
  // one universe (universe.js): which world a Player Career shares, and the way to link or unlink it
  function uniCard(mode, i){
    const d = read(mode, i); if (!d) return "";
    if (mode!=="player"){ if (!d.uni) return ""; const p = read("player", d.uni.slot); return p && p.player ? `<p class="uni-line">One universe with <b>${esc(p.player.name)}</b> (Player Career, slot 0${d.uni.slot})</p>` : ""; }
    const W = UNI.worlds(), cur = d.uni ? W.find(w=>w.mode===d.uni.mode && w.slot===d.uni.slot) : null, open = sure===`uni-${i}`;
    if (!W.length && !cur) return `<p class="uni-line muted">Start a Manager or Director career to link this player to its world.</p>`;
    return `<div class="uni-box"><p class="uni-line">${cur ? `One universe with <b>${esc(cur.name)}</b> · ${esc(cur.club)} (${cur.role==="dof" ? "Director" : "Manager"})` : "Not linked to a world"}
        <button type="button" class="btn small" data-hub="uniopen" data-i="${i}">${open ? "Close" : cur ? "Change" : "Link to a world"}</button></p>
      ${open ? `<div class="uni-opts">${W.map(w=>`<button type="button" class="btn small ${cur===w ? "primary" : ""}" data-hub="unilink" data-i="${i}" data-m="${w.mode}" data-s="${w.slot}">${esc(w.name)} · ${esc(w.club)}${w.pslot && w.pslot!==i ? " (linked to another player)" : ""}</button>`).join("")}
        ${cur ? `<button type="button" class="btn small danger" data-hub="unilink" data-i="${i}" data-m="">Unlink</button>` : ""}</div>
        <p class="hint">Linked, the two share a world: he plays in that world's squads and follows his career here, its promotions and relegations shape his leagues, and if you sign him there his career gets the offer.</p>` : ""}</div>`;
  }
  function count(mode){ let n = 0; for (let i = 1; i<=HUB_SLOTS; i++) if (sumOf(mode, i)) n++; return n; }
  function homeHTML(){
    const L = lastGet(), ls = L ? sumOf(L.m, L.i) : null;
    return `<div class="hub">
      ${flash ? `<p class="ref" role="status">${esc(flash)}</p>` : ""}
      <div class="hub-hero"><div class="eyebrow">Main menu</div><h2 class="hub-h">Choose your path</h2>
        <p class="intro-p">Live it on the pitch as a player, run the team from the dugout, or run the whole club from the boardroom. Three save slots for each.</p></div>
      ${ls ? `<button type="button" class="hub-last" data-hub="enter" data-m="${L.m}" data-i="${L.i}">
          <span class="hub-last-k">Continue · ${MODE_NAME[L.m] || "Career"} · slot 0${L.i}</span>
          <span class="hub-last-id">${ls.club ? clubBadge(ls.club, 40) : ""}<span><b>${esc(ls.name)}</b><small>${esc(ls.sub)} · ${esc(ls.season)}</small></span></span>
          <span class="hub-last-go" aria-hidden="true">▶</span></button>` : ""}
      <div class="hub-modes">
        <button type="button" class="mode-card mode-player" data-hub="mode" data-v="player">
          <span class="mode-art" id="hubPlayerArt">${PLAYER_ART}</span>
          <span class="mode-body"><span class="mode-k">Mode 01</span><span class="mode-t">Player Career</span>
            <span class="mode-p">Create your player and play every big moment yourself, from the National League to the Champions League.</span>
            <span class="mode-meta"><span>${count("player")} / ${HUB_SLOTS} saves</span><span class="mode-go">Play ▶</span></span></span>
        </button>
        <button type="button" class="mode-card mode-manager" data-hub="mode" data-v="manager">
          <span class="mode-art">${MANAGER_ART}</span>
          <span class="mode-body"><span class="mode-k">Mode 02</span><span class="mode-t">Manager Career</span>
            <span class="mode-p">Pick any club. Sign players, set your tactics, watch your team play and keep the board happy.</span>
            <span class="mode-meta"><span>${count("manager")} / ${HUB_SLOTS} saves</span><span class="mode-go">Manage ▶</span></span></span>
        </button>
        <button type="button" class="mode-card mode-dof" data-hub="mode" data-v="dof">
          <span class="mode-art">${DOF_ART}</span>
          <span class="mode-body"><span class="mode-k">Mode 03</span><span class="mode-t">Director of Football</span>
            <span class="mode-p">Hire and fire head coaches, buy and sell players, balance the books and keep the owner happy.</span>
            <span class="mode-meta"><span>${count("dof")} / ${HUB_SLOTS} saves</span><span class="mode-go">Direct ▶</span></span></span>
        </button>
      </div>
      ${(()=>{ const R = recCheck(); if (!R) return ""; const done = R.rows.filter(r=>r.done).length, next = R.rows.filter(r=>!r.done).sort((a, b)=>b.a/b.b - a.a/a.b)[0];
        return `<button type="button" class="hub-rec" data-hub="records"><span class="hub-rec-i" aria-hidden="true">🏆</span><span class="hub-rec-t"><b>Records room</b><small>${R.fresh.length ? `New: ${R.fresh.map(x=>esc(x.t)).join(", ")}` : next ? `Next: ${esc(next.t)}${next.b>1 ? ` (${next.a.toLocaleString()} / ${next.b.toLocaleString()})` : ""}` : "Every achievement unlocked"}</small></span><span class="hub-rec-n">${done}<small> / ${R.rows.length}</small></span></button>`; })()}
      <div class="hub-more">
        <button type="button" class="btn small" data-hub="legacy">Player Legacy</button>
        ${typeof Mgr!=="undefined" ? `<button type="button" class="btn small" data-hub="mhall">Hall of fame</button>` : ""}
        <button type="button" class="btn small" data-acct="open">Account &amp; backups</button>
      </div>
    </div>`;
  }
  function slotsHTML(mode){
    return `<div class="hub">
      ${flash ? `<p class="ref" role="status">${esc(flash)}</p>` : ""}
      <div class="hub-top"><button type="button" class="btn small" data-hub="home">‹ Main menu</button>
        <div><div class="eyebrow">${mode==="player" ? "Mode 01" : mode==="dof" ? "Mode 03" : "Mode 02"}</div><h2 class="hub-h">${mode==="player" ? "Player Career" : mode==="dof" ? "Director of Football" : "Manager Career"}</h2></div></div>
      <p class="hint" style="margin:0 0 16px">${mode==="player" ? "Each slot is its own player. Your Legacy keeps every player you've had on this account." : mode==="dof" ? "Each slot is its own director of football, at any club in the game. Your saves are kept on this phone and travel in backups." : "Each slot is its own manager, at any club in the game. Your saves are kept on this phone and travel in backups."}</p>
      <div class="slots">${Array.from({length:HUB_SLOTS}, (_, k)=>slotCard(mode, k + 1)).join("")}</div>
    </div>`;
  }
  function hubRender(){
    $("#bandRight").innerHTML = "";
    if (view==="mhall" && typeof Mgr!=="undefined"){ $("#app").innerHTML = Mgr.hallHTML(); return; }
    if (view==="records" && typeof Records!=="undefined"){ $("#app").innerHTML = Records.html(allSaves(), typeof Mgr!=="undefined" ? Mgr.hall() : [], recTab); return; }
    $("#app").innerHTML = view==="home" ? homeHTML() : slotsHTML(view);
    flash = "";
    if (view==="home") mount3D();
  }
  // the last player career's player turns slowly on the Player Career card, in 3D where the phone can
  // (the lifelike players only: the drawing stays until they've loaded)
  function mount3D(){
    if (typeof G3==="undefined" || !G3.on || !G3.on() || !document.getElementById("hubPlayerArt")) return;
    const t = ++mountT;
    G3.load().then(ok=>ok ? G3.people() : false).then(got=>{
      const el = document.getElementById("hubPlayerArt"); if (!got || t!==mountT || !el || APP!=="hub") return;
      let pl = null, club = null;
      for (let i = 1; i<=HUB_SLOTS && !pl; i++){ const d = read("player", i); if (d && d.player){ pl = d.player; club = d.club; } }
      pl ||= {name:"", skin:2, hair:"short", hairColour:"Black", number:"10"};
      if (G3.card.mount(el, {...pl, photo:null}, club ? meta(club) : {n:"", c1:"#0B1020", c2:"#00F0A8"})) el.classList.add("has3d");
    });
  }

  document.addEventListener("click", e=>{
    const b = e.target.closest("[data-hub]"); if (!b) return;
    const a = b.dataset.hub, m = b.dataset.m, i = +b.dataset.i;
    if (a==="mode"){ view = b.dataset.v; sure = ""; hubRender(); window.scrollTo({top:0}); }
    else if (a==="home") home();
    else if (a==="tomgr"){   // a retired player goes into management, in the first free manager slot
      const d = read("player", i), free = [1, 2, 3].slice(0, HUB_SLOTS).find(k=>!read("manager", k));
      if (!d || typeof mgwFromPlayer!=="function") return;
      if (!free){ sure = "mgrfull"; hubRender(); return; }
      window.MGW_PREFILL = {...mgwFromPlayer(d), pslot:i}; enter("manager", free);
    }
    else if (a==="uniopen"){ sure = sure===`uni-${i}` ? "" : `uni-${i}`; hubRender(); }
    else if (a==="unilink"){ UNI.link(i, b.dataset.m || null, +b.dataset.s || 0); sure = ""; hubRender(); }
    else if (a==="enter") enter(m, i);
    else if (a==="del"){
      const id = `${m}-${i}`;
      if (sure!==id){ sure = id; hubRender(); setTimeout(()=>{ if (sure===id){ sure = ""; if (APP==="hub") hubRender(); } }, 3500); return; }
      sure = ""; wipe(m, i); flash = `Slot 0${i} deleted.`; render();
    }
    else if (a==="legacy"){ APP = "player"; showBoard = true; render(); window.scrollTo({top:0}); }
    else if (a==="mhall"){ view = "mhall"; hubRender(); window.scrollTo({top:0}); }
    else if (a==="records"){ view = "records"; recTab = "ach"; hubRender(); window.scrollTo({top:0}); }
    else if (a==="rectab"){ recTab = b.dataset.v; hubRender(); }
  });

  return {
    saves:allSaves, key:keyOf,
    // after sign-in: straight back into a save if the page was reloaded to open one, otherwise the main menu
    boot(){
      let b = null; try{ b = JSON.parse(sessionStorage.getItem(BOOT)); sessionStorage.removeItem(BOOT); }catch(e){}
      if (b && b.m && b.i){ enter(b.m, b.i); return; }
      APP = "hub"; view = "home"; paintBand(); hubRender();
    },
    home, render:hubRender, paintBand,
    menuBtn: () => `<button type="button" class="btn ghost hub-menu" data-hub="home" aria-label="Main menu"><span aria-hidden="true">☰</span> Menu</button>`,
    slotKey: keyOf, read,
    // every slot of both modes, for backups: {"player-2": {...}, "manager-1": {...}}
    all(){ const out = {}; for (const mode of MODES) for (let i = 1; i<=HUB_SLOTS; i++){ const d = read(mode, i); if (d) out[`${mode}-${i}`] = d; } return out; },
    // a backup's saves go back in their own slot when it's free (or when replacing), otherwise in the first free one
    restore(all, replace){
      let n = 0, skipped = 0;
      for (const [k, d] of Object.entries(all || {})){
        const [mode, si] = k.split("-"), i = +si; if (!MODES.includes(mode) || !(i>=1 && i<=HUB_SLOTS) || !d) continue;
        let to = (replace || !read(mode, i)) ? i : 0;
        for (let j = 1; !to && j<=HUB_SLOTS; j++) if (!read(mode, j)) to = j;
        if (!to){ skipped++; continue; }
        try{ localStorage.setItem(keyOf(mode, to), JSON.stringify(d)); n++; }catch(e){ skipped++; }
      }
      return {n, skipped};
    },
    playerSlot: () => playerSlot
  };
})();
