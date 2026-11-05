/* ================= ACCOUNTS =================
   Accounts live on this device: no email and no server, so the game runs anywhere, even offline.
   A name and a password (kept only as a salted hash) keep each person's career and Legacy apart when a phone
   is shared. A backup file (Account menu, or Legacy → Your saves) carries everything to another phone.
   Everything here sits inside one closure so its helpers don't collide with game.js's globals; game.js
   calls Account.boot(start) once it has loaded, and this file calls back into the game (render, exportBackup…)
   only after that. */
const Account = (() => {
  const LIST = "efp-accounts-v1", SESSION = "efp-session-v1", VERSION = "1.90";
  const OLD = {career:"efp-career-v1", hall:"efp-hall-v1"};   // where saves lived before accounts existed
  const $id = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const get = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }catch(e){ return d; } };
  const put = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } };
  const accounts = () => get(LIST, []);
  const tidy = n => String(n||"").trim().replace(/\s+/g," ");
  const keyOf = n => tidy(n).toLowerCase();
  const keyFor = (acc, kind) => `efp-${kind}-v1:${acc.id}`;
  const initial = n => (tidy(n)[0] || "?").toUpperCase();
  let me = null, onReady = null, installEvt = null;
  let mode = null, nameVal = "", gateNote = "";

  function storageOK(){ try{ localStorage.setItem("efp-test","1"); localStorage.removeItem("efp-test"); return true; }catch(e){ return false; } }

  /* ---------- passwords ---------- */
  const enc = new TextEncoder();
  const hex = b => Array.from(new Uint8Array(b), x=>x.toString(16).padStart(2,"0")).join("");
  const rand = n => hex(crypto.getRandomValues(new Uint8Array(n)));
  const ITER = 120000;
  // WebCrypto only exists on https (or localhost); on a plain-http address the game falls back to iterated SHA-256
  const subtleOK = () => !!(window.crypto && crypto.subtle);
  async function hashPw(pw, salt, algo){
    if (algo==="pbkdf2"){
      const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
      return hex(await crypto.subtle.deriveBits({name:"PBKDF2", hash:"SHA-256", salt:enc.encode(salt), iterations:ITER}, k, 256));
    }
    let h = pw; for (let i=0;i<4000;i++) h = sha256(salt + h); return h;
  }
  function sha256(str){
    const r = (x,n) => (x>>>n)|(x<<(32-n));
    const primes = []; for (let n=2; primes.length<64; n++) if (primes.every(p=>n%p)) primes.push(n);
    const frac = x => (x - Math.floor(x))*2**32|0;
    const K = primes.map(p=>frac(Math.cbrt(p))), H = primes.slice(0,8).map(p=>frac(Math.sqrt(p)));
    const b = enc.encode(str), l = b.length, n = ((l+9+63)>>6)<<6, m = new Uint8Array(n); m.set(b); m[l] = 0x80;
    const dv = new DataView(m.buffer); dv.setUint32(n-8, Math.floor(l/0x20000000)); dv.setUint32(n-4, (l*8)>>>0);
    const w = new Int32Array(64);
    for (let o=0;o<n;o+=64){
      for (let i=0;i<16;i++) w[i] = dv.getUint32(o+i*4);
      for (let i=16;i<64;i++){ const x = w[i-15], y = w[i-2]; w[i] = (w[i-16] + (r(x,7)^r(x,18)^(x>>>3)) + w[i-7] + (r(y,17)^r(y,19)^(y>>>10)))|0; }
      let [a,b2,c,d,e,f,g,h] = H;
      for (let i=0;i<64;i++){
        const t1 = (h + (r(e,6)^r(e,11)^r(e,25)) + ((e&f)^(~e&g)) + K[i] + w[i])|0, t2 = ((r(a,2)^r(a,13)^r(a,22)) + ((a&b2)^(a&c)^(b2&c)))|0;
        h = g; g = f; f = e; e = (d+t1)|0; d = c; c = b2; b2 = a; a = (t1+t2)|0;
      }
      [a,b2,c,d,e,f,g,h].forEach((v,i)=>{ H[i] = (H[i]+v)|0; });
    }
    return H.map(v=>(v>>>0).toString(16).padStart(8,"0")).join("");
  }
  async function verify(acc, pw){
    if (acc.algo==="pbkdf2" && !subtleOK()) throw "Open the game from its https:// link to sign in.";
    return (await hashPw(pw, acc.salt, acc.algo)) === acc.hash;
  }

  /* ---------- account actions ---------- */
  async function create(name, pw, pw2){
    name = tidy(name);
    if (name.length<2 || name.length>20) throw "Pick a name between 2 and 20 characters.";
    if (!/^[\p{L}\p{N} ._'-]+$/u.test(name)) throw "Names can use letters, numbers, spaces, dots, dashes and apostrophes.";
    if (pw.length<4) throw "Use a password of at least 4 characters.";
    if (pw!==pw2) throw "Those passwords don't match.";
    if (!storageOK()) throw "This browser isn't letting the game save. Turn off private browsing and try again.";
    const list = accounts();
    if (list.some(a=>a.key===keyOf(name))) throw `There's already an account called “${name}” on this phone. Sign in, or pick another name.`;
    const algo = subtleOK() ? "pbkdf2" : "sha256", salt = rand(16);
    const acc = {id:"u" + Date.now().toString(36) + rand(3), name, key:keyOf(name), salt, algo, hash:await hashPw(pw, salt, algo), created:Date.now()};
    // the first account on a phone takes over any career saved before accounts existed
    if (!list.length) for (const [kind, old] of Object.entries(OLD)){
      try{ const v = localStorage.getItem(old); if (v!==null){ localStorage.setItem(keyFor(acc, kind), v); localStorage.removeItem(old); } }catch(e){}
    }
    list.push(acc);
    if (!put(LIST, list)) throw "This phone is out of storage space, so the account couldn't be saved.";
    return acc;
  }
  async function signIn(name, pw){
    const acc = accounts().find(a=>a.key===keyOf(name));
    if (!tidy(name)) throw "Enter your name.";
    if (!acc) throw `There's no account called “${tidy(name)}” on this phone. Create one first.`;
    if (!(await verify(acc, pw))) throw "Wrong password. Try again.";
    return acc;
  }
  function begin(acc, welcome){
    me = acc; put(SESSION, acc.id); mode = null; gateNote = ""; nameVal = "";
    paintLine();
    if (welcome) flash = welcome;   // game.js shows and clears this on its next render
    onReady();
    window.scrollTo({top:0});
  }
  function signOut(){ try{ localStorage.removeItem(SESSION); }catch(e){} location.reload(); }
  function wipe(acc){
    for (const kind of [...Object.keys(OLD), "tips", "coins", "locker"]){ try{ localStorage.removeItem(keyFor(acc, kind)); }catch(e){} }
    put(LIST, accounts().filter(a=>a.id!==acc.id));
  }

  /* ---------- gold coins ----------
     Earned in matches you play (moments.js) and kept on the account, so they carry across careers. */
  function coins(){ try{ return Math.max(0, Math.round(+localStorage.getItem(keyFor(me, "coins")) || 0)); }catch(e){ return 0; } }
  function setCoins(n){ try{ localStorage.setItem(keyFor(me, "coins"), String(Math.max(0, Math.round(n)))); }catch(e){} paintLine(); }
  const coinHTML = n => `<span class="coins" title="Gold coins"><i class="coin" aria-hidden="true"></i>${n.toLocaleString()}<span class="vh"> gold coins</span></span>`;
  // the boots you own (level 1–3 per attribute) and the pair you're wearing, also kept on the account
  function locker(){ try{ const L = JSON.parse(localStorage.getItem(keyFor(me, "locker"))); if (L && L.boots) return L; }catch(e){} return {boots:{}, on:null}; }
  function setLocker(L){ try{ localStorage.setItem(keyFor(me, "locker"), JSON.stringify(L)); }catch(e){} }

  /* ---------- header ---------- */
  function paintLine(state){
    const el = $id("acctLine"); if (!el || !me) return;
    el.hidden = false;
    el.innerHTML = `<button type="button" class="acct-btn" data-acct="open" aria-haspopup="dialog" aria-label="Account: ${esc(me.name)}">
        <span class="acct-av" aria-hidden="true">${esc(initial(me.name))}</span><span class="acct-nm">${esc(me.name)}</span>
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
      <button type="button" class="coins" data-shop="open" aria-label="${coins().toLocaleString()} gold coins: open the shop"><i class="coin" aria-hidden="true"></i>${coins().toLocaleString()}<span class="coins-shop">Shop</span></button>
      <span class="cloud" data-state="${state==="error"?"error":"saved"}" role="status">${state==="error" ? "Couldn't save: this phone's storage is full or blocked" : "✓ Saved on this phone"}</span>`;
  }

  /* ---------- install ---------- */
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  const SHARE_IC = `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>`;
  function installHTML(){
    if (standalone()) return `<p class="hint">✓ You're playing the installed app. Open it from your home screen any time, with or without signal.</p>`;
    const how = installEvt ? `<button type="button" class="btn primary" data-acct="install">Install the app</button>`
      : isIOS() ? `<ol class="steps"><li>Tap the <b>Share</b> button ${SHARE_IC} in the browser bar.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. The game sits on your home screen like any other app.</li></ol>`
      : `<ol class="steps"><li>Open the browser menu <b>⋮</b>.</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Confirm. The game sits with your other apps.</li></ol>`;
    return `<p class="hint">Put the game on your home screen to play it full screen, even without signal. It's free and takes a few seconds.</p>${how}`;
  }
  function paintInstall(){ document.querySelectorAll("[data-install]").forEach(el=>{ el.innerHTML = installHTML(); }); }
  addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); installEvt = e; paintInstall(); });
  addEventListener("appinstalled", ()=>{ installEvt = null; paintInstall(); });
  function registerSW(){
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    addEventListener("load", ()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); });
  }

  /* ---------- sign-in screen ---------- */
  function gate(){
    const list = accounts();
    mode ||= list.length ? "signin" : "create";
    $id("acctLine").hidden = true; $id("bandRight").innerHTML = "";
    const create = mode==="create";
    $id("app").innerHTML = `
    <div class="intro">
      <div class="eyebrow">Free · plays offline · no email needed</div>
      <h2 class="intro-h">${create ? "Your career starts here" : "Welcome back"}</h2>
      <p class="intro-p">${create ? "Make an account on this phone to keep your player, your seasons and your Legacy. Then build your player and play from the National League to the Champions League." : "Sign in to pick up your career where you left it."}</p>
    </div>
    ${storageOK() ? "" : `<p class="ref bad" role="alert" style="margin:0 0 18px">This browser is blocking storage, so nothing can be saved. Turn off private browsing, or open the link in your normal browser.</p>`}
    ${gateNote ? `<p class="ref" role="status" style="margin:0 0 18px">${esc(gateNote)}</p>` : ""}
    <div class="gate">
      <section class="panel">
        <div class="seg2" role="group" aria-label="Account">
          <button type="button" data-acct="mode" data-v="create" aria-pressed="${create}">Create account</button>
          <button type="button" data-acct="mode" data-v="signin" aria-pressed="${!create}">Sign in</button>
        </div>
        <form id="acctForm" class="acct-form" novalidate>
          ${!create && list.length ? `<div class="field"><span class="flabel">Accounts on this phone</span><div class="chips" style="margin:0">${list.map(a=>`<button type="button" class="chip ${a.key===keyOf(nameVal)?"on":""}" data-acct="pick" data-v="${esc(a.name)}" aria-pressed="${a.key===keyOf(nameVal)}">${esc(a.name)}</button>`).join("")}</div></div>` : ""}
          <div class="field"><label for="a-name">Your name</label><input id="a-name" name="name" value="${esc(nameVal)}" maxlength="20" autocomplete="username" autocapitalize="words" spellcheck="false" required></div>
          <div class="field"><label for="a-pw">Password</label><input id="a-pw" name="pw" type="password" autocomplete="${create?"new-password":"current-password"}" required></div>
          ${create ? `<div class="field"><label for="a-pw2">Confirm password</label><input id="a-pw2" name="pw2" type="password" autocomplete="new-password" required></div>` : ""}
          <button class="btn primary big" type="submit">${create ? "Create account" : "Sign in"}</button>
          <p class="err" id="acctErr" role="alert"></p>
        </form>
        ${create ? `<p class="hint">Your account is kept on this phone, so there's nothing to verify. The password keeps anyone else who uses this phone out of your career.</p>`
        : `<details class="forgot"><summary>Forgot your password?</summary>
            <p class="hint">Passwords can't be reset: accounts only exist on this phone, so nobody else can see or recover them. If you can't remember yours, remove the account and create a new one. Its saves are deleted unless you've kept a backup file.</p>
            <form id="forgotForm" class="acct-form"><div class="field"><label for="f-name">Type the account's name to remove it</label><input id="f-name" name="name" autocomplete="off" spellcheck="false"></div>
            <button class="btn small danger" type="submit">Remove account</button><p class="err" id="forgotErr" role="alert"></p></form>
          </details>`}
      </section>
      <section class="panel"><h2>Get the app</h2><div data-install>${installHTML()}</div></section>
    </div>`;
    const focus = $id(nameVal ? "a-pw" : "a-name"); if (focus && !matchMedia("(pointer:coarse)").matches) focus.focus();
  }

  /* ---------- account menu ---------- */
  // The Development section (the mini-game lab) is only shown on a phone where developer mode is on: tap the version
  // line at the bottom of this menu five times, or open the game once with ?dev at the end of its address
  const DEV = "efp-dev";
  const devOn = () => { try{ return localStorage.getItem(DEV)==="1"; }catch(e){ return false; } };
  const setDev = on => { try{ if (on) localStorage.setItem(DEV, "1"); else localStorage.removeItem(DEV); }catch(e){} };
  if (/[?&]dev\b/.test(location.search)) setDev(true);
  let devTaps = 0, devNote = "";
  function dialogHTML(){
    const since = new Date(me.created).toLocaleDateString(undefined, {day:"numeric", month:"short", year:"numeric"});
    return `<div class="dlg-in">
      <div class="dlg-head"><span class="acct-av big" aria-hidden="true">${esc(initial(me.name))}</span>
        <div style="min-width:0"><h2 id="acctDlgTitle">${esc(me.name)}</h2><p class="hint">Account on this phone · since ${esc(since)} · ${coins().toLocaleString()} gold coins</p></div>
        <button type="button" class="dlg-x" data-acct="close" aria-label="Close">×</button></div>
      <section><h3>Your saves</h3>
        <p class="hint">Your career and Legacy save on this phone as you play. Download a backup to keep them safe, or to carry on playing on another phone.</p>
        <div class="row"><button type="button" class="btn small" data-acct="backup">Download backup</button>
          <label class="btn small" for="acctBackupFile" style="display:inline-flex;align-items:center">Load backup</label><input id="acctBackupFile" type="file" accept="application/json,.json" hidden></div>
        ${S ? `<label class="chk"><input type="checkbox" id="acctReplace"> Loading a backup also replaces my current career</label>` : ""}
      </section>
      ${devOn() ? `<section><h3>Development</h3><p class="hint">Only on this phone: try every mini-game in one place, at any difficulty. Nothing you play there affects your career or your coins.</p>
        <div class="row"><button type="button" class="btn small primary" data-acct="lab">Open the mini-game lab</button><button type="button" class="btn small" data-acct="dev-off">Hide this section</button></div></section>` : ""}
      ${typeof G3!=="undefined" && G3.glOK() ? `<section><h3>Graphics</h3>
        <label class="chk"><input type="checkbox" data-acct="g3" ${G3.on() ? "checked" : ""}> 3D graphics: your player on the home screen, and shots and penalties</label>
        <p class="hint">Turn it off to save battery on an older phone.</p></section>` : ""}
      ${typeof SND!=="undefined" ? `<section><h3>Sound</h3>
        <label class="chk"><input type="checkbox" data-acct="snd" ${SND.on() ? "checked" : ""}> The crowd, the ball and the referee's whistle</label></section>` : ""}
      <section><h3>Get the app</h3><div data-install>${installHTML()}</div></section>
      <details class="dlg-more"><summary>Change password</summary>
        <form id="pwForm" class="acct-form">
          <input type="text" name="username" value="${esc(me.name)}" autocomplete="username" hidden>
          <div class="field"><label for="p-old">Current password</label><input id="p-old" name="old" type="password" autocomplete="current-password"></div>
          <div class="field"><label for="p-new">New password</label><input id="p-new" name="pw" type="password" autocomplete="new-password"></div>
          <div class="field"><label for="p-new2">Confirm new password</label><input id="p-new2" name="pw2" type="password" autocomplete="new-password"></div>
          <button class="btn small primary" type="submit">Change password</button><p class="err" id="pwErr" role="alert"></p>
        </form></details>
      <details class="dlg-more"><summary>Delete account</summary>
        <form id="delForm" class="acct-form">
          <p class="hint">This removes ${esc(me.name)} and every save on it from this phone. Download a backup first if you might want them back.</p>
          <div class="field"><label for="d-pw">Password</label><input id="d-pw" name="pw" type="password" autocomplete="current-password"></div>
          <button class="btn small danger" type="submit">Delete account</button><p class="err" id="delErr" role="alert"></p>
        </form></details>
      <p class="hint" style="margin:0"><span data-acct="ver">Game version ${VERSION}.</span> <button type="button" class="linkbtn" data-acct="update">Check for updates</button>${devNote ? ` <span role="status">${esc(devNote)}</span>` : ""}</p>
      <div class="row dlg-foot"><button type="button" class="btn" data-acct="signout">Sign out</button><button type="button" class="btn primary" data-acct="close">Back to the game</button></div>
    </div>`;
  }
  function openMenu(){
    const d = $id("acctDlg"); devTaps = 0; devNote = ""; d.innerHTML = dialogHTML();
    if (d.showModal){ if (!d.open) d.showModal(); } else d.setAttribute("open", "");
  }
  function closeMenu(){ const d = $id("acctDlg"); if (d.close) d.close(); else d.removeAttribute("open"); }
  $id("acctDlg")?.addEventListener("click", e=>{ if (e.target.id==="acctDlg") closeMenu(); });   // tap outside the sheet

  /* ---------- events ---------- */
  document.addEventListener("click", async e=>{
    const b = e.target.closest("[data-acct]"); if (!b) return;
    const a = b.dataset.acct;
    if (a==="mode"){ mode = b.dataset.v; gateNote = ""; nameVal = $id("a-name")?.value || nameVal; gate(); }
    else if (a==="pick"){ nameVal = b.dataset.v; gateNote = ""; gate(); $id("a-pw")?.focus(); }
    else if (a==="open") openMenu();
    else if (a==="g3") G3.set(b.checked);
    else if (a==="snd") SND.set(b.checked);
    else if (a==="close") closeMenu();
    else if (a==="signout") signOut();
    else if (a==="update"){ b.textContent = "Checking…"; try{ const r = await navigator.serviceWorker?.getRegistration(); await r?.update(); }catch(err){} location.reload(); }
    else if (a==="backup"){ closeMenu(); exportBackup(); }
    else if (a==="lab"){ closeMenu(); labOpen(); }
    else if (a==="ver" || a==="dev-off"){
      if (a==="ver" && ++devTaps<5) return;
      devTaps = 0; setDev(a==="ver" && !devOn()); devNote = devOn() ? "Developer mode is on: the Development section is above." : "Developer mode is off.";
      const d = $id("acctDlg"), y = d.scrollTop; d.innerHTML = dialogHTML(); d.scrollTop = y;
    }
    else if (a==="install" && installEvt){ const ev = installEvt; installEvt = null; ev.prompt(); try{ await ev.userChoice; }catch(err){} paintInstall(); }
  });
  document.addEventListener("change", e=>{
    if (e.target.id!=="acctBackupFile" || !e.target.files[0]) return;
    confirmImport = !!$id("acctReplace")?.checked;
    importBackup(e.target.files[0]); e.target.value = ""; closeMenu();
  });
  document.addEventListener("submit", async e=>{
    const f = e.target;
    if (!["acctForm","pwForm","delForm","forgotForm"].includes(f.id)) return;
    e.preventDefault();
    const v = n => (f.elements[n] ? f.elements[n].value : "");
    const btn = f.querySelector('button[type="submit"]'), out = f.querySelector(".err"), label = btn.textContent;
    if (btn.disabled) return;
    btn.disabled = true; out.textContent = ""; out.classList.remove("ok");
    try{
      if (f.id==="acctForm"){
        nameVal = v("name"); btn.textContent = mode==="create" ? "Creating…" : "Signing in…";
        if (mode==="create"){ const acc = await create(v("name"), v("pw"), v("pw2")); begin(acc, `Welcome, ${acc.name}! Your account is ready. Now build your player.`); }
        else begin(await signIn(v("name"), v("pw")));
      }
      else if (f.id==="forgotForm"){
        const acc = accounts().find(a=>a.key===keyOf(v("name")));
        if (!acc) throw `There's no account called “${tidy(v("name"))}” on this phone.`;
        wipe(acc); nameVal = ""; mode = null; gateNote = `“${acc.name}” was removed from this phone.`; gate();
      }
      else if (f.id==="pwForm"){
        if (!(await verify(me, v("old")))) throw "Your current password isn't right.";
        if (v("pw").length<4) throw "Use a new password of at least 4 characters.";
        if (v("pw")!==v("pw2")) throw "The new passwords don't match.";
        const algo = subtleOK() ? "pbkdf2" : "sha256", salt = rand(16), hash = await hashPw(v("pw"), salt, algo);
        const list = accounts(), acc = list.find(a=>a.id===me.id);
        if (!acc) throw "This account is no longer on this phone.";
        Object.assign(acc, {salt, algo, hash});
        if (!put(LIST, list)) throw "The new password couldn't be saved. This phone may be out of storage.";
        me = acc; f.reset(); out.textContent = "✓ Password changed."; out.classList.add("ok");
      }
      else if (f.id==="delForm"){
        if (!(await verify(me, v("pw")))) throw "That password isn't right.";
        wipe(me); signOut();
      }
    }catch(err){ out.textContent = typeof err==="string" ? err : "Something went wrong. Try again."; }
    if (btn.isConnected){ btn.disabled = false; btn.textContent = label; }
  });

  return {
    boot(start){
      onReady = start; registerSW();
      const acc = accounts().find(a=>a.id===get(SESSION, null));
      if (acc){ me = acc; paintLine(); start(); } else gate();
    },
    storageKey: kind => keyFor(me, kind),
    statusText: () => `Signed in as ${me.name}. Saved on this phone.`,
    coins, addCoins: n => setCoins(coins() + n), mergeCoins: n => setCoins(Math.max(coins(), +n || 0)), coinHTML,
    spend: n => { if (coins() < n) return false; setCoins(coins() - n); return true; },
    locker, setLocker,
    // a backup's boots: keep the best level of each pair
    mergeLocker: L => { if (!L || !L.boots) return; const mine = locker(); for (const k in L.boots) mine.boots[k] = Math.max(mine.boots[k]||0, Math.min(3, +L.boots[k]||0)); mine.on ||= L.on || null; if (L.pen) mine.pen = 1; setLocker(mine); },
    fileTag: () => me.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "player",
    saveFailed: () => paintLine("error")
  };
})();
