/* =========================================================================================
   3D (level 1): your player turning on the home card, and shots and penalties in 3D.
   three.js (vendor/three.min.js) loads on demand, so the game starts as fast as before. Everything here falls back
   to the 2D pictures when 3D is off (Account menu), WebGL isn't there, or three.js hasn't loaded yet.
   Units are metres. A player stands at the origin facing +z; the goal line is z = 0 with the pitch towards +z.
   ========================================================================================= */
const G3 = (() => {
  const KEY = "efp-3d";
  const on = () => { try{ return localStorage.getItem(KEY)!=="0"; }catch(e){ return true; } };
  let gl = null;
  const glOK = () => gl ??= (() => { try{ const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }catch(e){ return false; } })();
  let loading = null;
  function load(){
    if (!on() || !glOK()) return Promise.resolve(false);
    if (window.THREE) return Promise.resolve(true);
    return loading ||= new Promise(res=>{ const s = document.createElement("script"); s.src = "vendor/three.min.js"; s.async = true;
      s.onload = ()=>res(!!window.THREE); s.onerror = ()=>{ loading = null; res(false); }; document.head.appendChild(s); });
  }
  const ready = () => on() && glOK() && !!window.THREE;
  function set(v){ try{ localStorage.setItem(KEY, v ? "1" : "0"); }catch(e){} if (v) load().then(()=>typeof render==="function" && S && render()); else { card.stop(); typeof render==="function" && S && render(); } }

  /* ---------- small helpers ---------- */
  const col = c => new THREE.Color(c);
  const lum = c => { const x = col(c); return .2126*x.r + .7152*x.g + .0722*x.b; };
  const mats = new Map();
  // one material per colour and finish, shared by every model
  const mat = (c, rough = .78, o = {}) => { const k = c + "|" + rough + "|" + (o.metal || 0) + (o.side || ""); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color:col(c), roughness:rough, metalness:o.metal || 0, side:o.side || THREE.FrontSide})); return mats.get(k); };
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
  const grp = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
  const geos = new Map();
  const geo = (k, make) => { if (!geos.has(k)) geos.set(k, make()); return geos.get(k); };
  const cap = (r, len) => geo(`cap${r}|${len}`, ()=>new THREE.CapsuleGeometry(r, len, 6, 14));
  // a limb from its joint (y = 0) down to len: radius r0 at the joint, swelling to r1 a third of the way, r2 at the end
  const limb = (len, r0, r1, r2) => geo(`limb${len}|${r0}|${r1}|${r2}`, ()=>{ const pts = []; const N = 12;
    for (let i = 0; i <= N; i++){ const k = i/N, r = k < .33 ? r0 + (r1 - r0)*Math.sin(k/.33*Math.PI/2) : r1 + (r2 - r1)*(1 - Math.cos((k - .33)/.67*Math.PI/2)); pts.push(new THREE.Vector2(r, -k*len)); }
    pts.unshift(new THREE.Vector2(r0*.8, r0*.4)); pts.unshift(new THREE.Vector2(0, r0*.6)); pts.push(new THREE.Vector2(r2*.7, -len - r2*.4), new THREE.Vector2(0, -len - r2*.6));
    return new THREE.LatheGeometry(pts.reverse(), 18); });
  // hair: fine strands over the colour, so it reads as hair and not a hat
  let hairTex = null;
  function hairMap(){ if (hairTex) return hairTex; const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 256, 256);
    const R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(5);
    for (let i = 0; i < 2600; i++){ const px = R()*256, py = R()*256, l = 4 + R()*9, a = Math.PI/2 + (R() - .5)*.6; x.strokeStyle = R() < .5 ? `rgba(0,0,0,${.18 + R()*.25})` : `rgba(255,255,255,${.12 + R()*.2})`; x.lineWidth = .8 + R(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a)*l, py + Math.sin(a)*l); x.stroke(); }
    hairTex = new THREE.CanvasTexture(c); hairTex.colorSpace = THREE.SRGBColorSpace; hairTex.wrapS = hairTex.wrapT = THREE.RepeatWrapping; hairTex.repeat.set(3, 2); return hairTex; }
  const sph = (r, w = 20, h = 14) => geo(`sph${r}|${w}`, ()=>new THREE.SphereGeometry(r, w, h));
  // a soft round shadow on the grass
  let blobTex = null;
  function blob(w, d){
    if (!blobTex){ const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(.6, "rgba(0,0,0,.25)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({map:blobTex, transparent:true, depthWrite:false}));
    m.rotation.x = -Math.PI/2; m.position.y = .005; return m;
  }

  /* ---------- the player ----------
     look: {skin, hair, hairCol, c1 (shirt), c2 (trim), shorts, socks, num, name, gk, gloves, boots}
     Returns {root, rig} where rig has the joints a pose moves: hips, chest, head, shoulders/elbows, hips/knees */
  function backTex(look){
    const c = document.createElement("canvas"); c.width = 512; c.height = 512; const x = c.getContext("2d");
    const ink = look.c2 && Math.abs(lum(look.c2) - lum(look.c1)) > .25 ? look.c2 : lum(look.c1) > .5 ? "#15171A" : "#FFFFFF";
    const font = "Big Shoulders Display, Impact, sans-serif";
    x.fillStyle = ink; x.textAlign = "center"; x.textBaseline = "alphabetic";
    const name = String(look.name || "").toUpperCase().slice(0, 14);
    if (name){ x.font = `800 ${name.length > 9 ? 54 : 66}px ${font}`; x.fillText(name, 256, 150, 420); }
    x.font = `900 250px ${font}`; x.fillText(String(look.num ?? ""), 256, 400);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function makePlayer(look){
    const root = grp(), rig = {};
    const skin = mat(look.skin, .55), shirt = mat(look.c1, .82), trim = mat(look.c2 || "#FFFFFF", .8), shorts = mat(look.shorts || (lum(look.c1) > .6 ? "#1F2937" : "#F4F4F5"), .85);
    const socks = mat(look.socks || look.c1, .85), boot = mat(look.boots || "#111214", .35), dark = mat("#1A0F0A", .4);
    const hk = "hair|" + (look.hairCol || "#17130F"); if (!mats.has(hk)) mats.set(hk, new THREE.MeshStandardMaterial({color:col(look.hairCol || "#17130F"), map:hairMap(), roughness:.88}));
    const hairM = mats.get(hk);
    // the pelvis: everything above hangs off the hips, the legs off the hip joints
    const hips = rig.hips = grp(0, .94, 0); root.add(hips);
    // the shorts
    const sh = new THREE.Mesh(geo("shorts", ()=>new THREE.LatheGeometry([[0,-.15],[.13,-.15],[.155,-.11],[.158,-.04],[.152,.03],[0,.03]].map(([r, y])=>new THREE.Vector2(r, y)), 24)), shorts);
    sh.scale.set(1.18, 1, .85); hips.add(sh);
    // the chest: a turned profile, broad at the shoulders and narrow at the waist, squashed front to back
    const chest = rig.chest = grp(0, .02, 0); hips.add(chest);
    const torsoG = geo("torso", ()=>new THREE.LatheGeometry([[0,0],[.155,0],[.158,.07],[.168,.18],[.186,.3],[.198,.38],[.194,.44],[.17,.485],[.11,.51],[0,.515]].map(([r, y])=>new THREE.Vector2(r, y)), 28));
    const torso = new THREE.Mesh(torsoG, shirt); torso.scale.set(1.3, 1, .74); chest.add(torso);
    // the name and number on the back, a curved panel just off the shirt
    const nb = new THREE.Mesh(new THREE.CylinderGeometry(.191, .176, .4, 24, 1, true, Math.PI - .95, 1.9), new THREE.MeshStandardMaterial({map:backTex(look), transparent:true, roughness:.8, depthWrite:false}));
    nb.scale.set(1.34, 1, .8); nb.position.y = .23; chest.add(nb);
    // collar and the trim at the hem
    const collar = new THREE.Mesh(geo("collar", ()=>new THREE.TorusGeometry(.075, .014, 8, 20)), trim); collar.rotation.x = Math.PI/2; collar.position.y = .5; collar.scale.set(1.15, 1, 1); chest.add(collar);
    // the neck and the head
    chest.add(mesh(geo("neck", ()=>new THREE.CylinderGeometry(.06, .07, .15, 16)), skin, 0, .555, -.005));
    const head = rig.head = grp(0, .67, .005); head.scale.setScalar(1.1); chest.add(head);
    const skull = new THREE.Mesh(sph(.104, 26, 20), skin); skull.scale.set(.9, 1.08, 1); head.add(skull);
    const jaw = new THREE.Mesh(sph(.08, 20, 14), skin); jaw.scale.set(.95, .8, .95); jaw.position.set(0, -.055, .022); head.add(jaw);
    [-1, 1].forEach(s=>{ const ear = new THREE.Mesh(sph(.026, 10, 8), skin); ear.scale.set(.45, 1, .8); ear.position.set(s*.093, -.004, -.004); head.add(ear);
      const eye = mesh(sph(.011, 8, 6), dark, s*.034, .012, .088); head.add(eye);
      const brow = new THREE.Mesh(geo("brow", ()=>new THREE.BoxGeometry(.034, .008, .01)), hairM); brow.position.set(s*.035, .034, .09); brow.rotation.z = -s*.12; head.add(brow); });
    const nose = new THREE.Mesh(geo("nose", ()=>new THREE.ConeGeometry(.016, .042, 8)), skin); nose.position.set(0, -.01, .105); nose.rotation.x = Math.PI/2.4; head.add(nose);
    const mouth = new THREE.Mesh(geo("mouth", ()=>new THREE.BoxGeometry(.03, .005, .006)), mat("#7A3B2E", .6)); mouth.position.set(0, -.052, .094); head.add(mouth);
    // hair, by style
    const hs = look.hair || "short";
    if (hs !== "none"){
      // the hair follows the skull: high at the forehead, above the ears, down to the nape (a cap tipped back)
      const cap0 = (r, top = 1.36, tilt = -.46, sc = 1) => { const g = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 16, 0, Math.PI*2, 0, top), hairM); g.scale.set(.9*sc, 1.08*sc, 1*sc); g.rotation.x = tilt; g.position.set(0, .002, -.002); return g; };
      if (hs === "buzz"){ head.add(cap0(.1075, 1.4)); }
      else if (hs === "short"){ head.add(cap0(.111)); const top = cap0(.116, .75, -.3); head.add(top); }
      else if (hs === "curly"){ const R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(7);
        head.add(cap0(.113, 1.4));
        for (let i = 0; i < 52; i++){ const th = R()*Math.PI*2, ph = R()*1.2; const p = new THREE.Vector3(Math.sin(ph)*Math.cos(th), Math.cos(ph), Math.sin(ph)*Math.sin(th));
          if (p.z > .35 && p.y < .55) continue; p.multiplyScalar(.118); head.add(mesh(sph(.022 + R()*.008, 8, 6), hairM, p.x*.92, p.y*1.08 + .006, p.z - .004)); } }
      else if (hs === "long"){ head.add(cap0(.114, 1.45, -.5));
        const fall = new THREE.Mesh(geo("hairfall", ()=>new THREE.CylinderGeometry(.098, .122, .24, 20, 1, true, Math.PI*.2, Math.PI*1.6)), hairM);
        fall.material = mats.get("hairDS|" + look.hairCol) || (mats.set("hairDS|" + look.hairCol, new THREE.MeshStandardMaterial({color:col(look.hairCol || "#17130F"), map:hairMap(), roughness:.85, side:THREE.DoubleSide})), mats.get("hairDS|" + look.hairCol));
        fall.position.set(0, -.085, -.014); head.add(fall); }
    }
    // arms: shoulder → elbow → hand, with the sleeve over the top half
    rig.arm = {}; rig.elbow = {};
    [-1, 1].forEach(s=>{
      const shp = rig.arm[s] = grp(s*.245, .43, -.005); chest.add(shp); shp.rotation.z = s*.12;
      shp.add(mesh(sph(.066, 16, 12), shirt));   // the round of the shoulder, under the sleeve
      shp.add(mesh(limb(.29, .05, .056, .041), skin));   // the upper arm: biceps, narrowing to the elbow
      const slv = new THREE.Mesh(geo("sleeve", ()=>new THREE.CylinderGeometry(.068, .064, .16, 16, 1, true)), mat(look.c1, .82, {side:THREE.DoubleSide})); slv.position.y = -.07; shp.add(slv);
      const cuff = new THREE.Mesh(geo("cuff", ()=>new THREE.CylinderGeometry(.065, .065, .02, 16, 1, true)), mat(look.c2 || "#FFFFFF", .8, {side:THREE.DoubleSide})); cuff.position.y = -.15; shp.add(cuff);
      const el = rig.elbow[s] = grp(0, -.29, 0); shp.add(el); el.rotation.x = -.18;
      el.add(mesh(limb(.25, .041, .046, .03), skin));   // the forearm, thick below the elbow, thin at the wrist
      const hand = mesh(sph(look.gk ? .055 : .042, 12, 10), look.gk ? mat(look.gloves || "#C8F04A", .6) : skin, 0, -.26, .005); hand.scale.set(look.gk ? 1 : .8, 1.15, look.gk ? .7 : .6); el.add(hand);
    });
    // legs: hip → knee → foot, shorts over the thigh, socks up the shin, a boot
    rig.leg = {}; rig.knee = {};
    [-1, 1].forEach(s=>{
      const hp = rig.leg[s] = grp(s*.1, -.06, 0); hips.add(hp);
      hp.add(mesh(limb(.42, .085, .088, .056), skin));   // the thigh, tapering to the knee
      const leg = new THREE.Mesh(geo("legshort", ()=>new THREE.CylinderGeometry(.098, .1, .17, 16, 1, true)), mat(look.shorts || (lum(look.c1) > .6 ? "#1F2937" : "#F4F4F5"), .85, {side:THREE.DoubleSide})); leg.position.y = -.06; hp.add(leg);
      const kn = rig.knee[s] = grp(0, -.42, 0); hp.add(kn);
      kn.add(mesh(limb(.4, .054, .064, .036), skin));   // the calf
      const sk = new THREE.Mesh(limb(.33, .06, .068, .042), socks); sk.position.y = -.07; kn.add(sk);
      const band = new THREE.Mesh(geo("sockband", ()=>new THREE.CylinderGeometry(.062, .062, .025, 16)), trim); band.position.y = -.09; kn.add(band);
      const ft = grp(0, -.42, 0); kn.add(ft);
      const b = new THREE.Mesh(geo("boot", ()=>{ const g = new THREE.CapsuleGeometry(.042, .16, 4, 10); g.rotateX(Math.PI/2); return g; }), boot); b.scale.set(1.05, .8, 1); b.position.set(0, -.012, .055); ft.add(b);
    });
    const sh0 = blob(.9, .6); root.add(sh0); rig.shadow = sh0;
    root.traverse(o=>{ if (o.isMesh) o.frustumCulled = false; });
    return {root, rig};
  }
  // poses: k from 0 to 1 through the move
  const POSE = {
    idle(r, t){ const b = Math.sin(t*1.8); r.chest.rotation.x = .02 + b*.012; r.arm[-1].rotation.x = b*.04; r.arm[1].rotation.x = -b*.04; r.arm[-1].rotation.z = -.14; r.arm[1].rotation.z = .14;
      r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.2; r.head.rotation.y = Math.sin(t*.45)*.12; r.leg[-1].rotation.x = r.leg[1].rotation.x = 0; r.knee[-1].rotation.x = r.knee[1].rotation.x = 0; },
    // the shooter: lean, then the right leg swings back and through the ball
    kick(r, k){ const back = k < .45 ? k/.45 : 1 - (k - .45)/.55, thr = k < .45 ? 0 : (k - .45)/.55;
      r.leg[1].rotation.x = .9*back - 1.15*thr*(1 - thr*.3); r.knee[1].rotation.x = 1.4*back*(1 - thr) + .1;
      r.leg[-1].rotation.x = -.15; r.knee[-1].rotation.x = .25; r.chest.rotation.x = .12 + .1*thr; r.chest.rotation.y = -.2*back + .15*thr;
      r.arm[-1].rotation.z = -.5 - .5*thr; r.arm[1].rotation.z = .4 + .3*back; r.arm[-1].rotation.x = -.3*thr; r.arm[1].rotation.x = .4*thr; },
    // the keeper on his toes: knees bent, hands out
    ready(r, t){ const b = Math.sin(t*5)*.03; r.hips.position.y = .86 + b; r.leg[-1].rotation.x = r.leg[1].rotation.x = -.35; r.knee[-1].rotation.x = r.knee[1].rotation.x = .6;
      r.leg[-1].rotation.z = -.14; r.leg[1].rotation.z = .14; r.chest.rotation.x = .28; r.head.rotation.x = -.2;
      r.arm[-1].rotation.z = -.55; r.arm[1].rotation.z = .55; r.arm[-1].rotation.x = r.arm[1].rotation.x = -.5; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.6; },
    // diving: arms stretched up past the head
    dive(r, k){ r.hips.position.y = .9; r.chest.rotation.x = .05; r.head.rotation.x = 0; r.arm[-1].rotation.z = -2.7*k - .55*(1 - k); r.arm[1].rotation.z = 2.7*k + .55*(1 - k);
      r.arm[-1].rotation.x = r.arm[1].rotation.x = -.3*(1 - k); r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.1;
      r.leg[-1].rotation.z = -.25*k; r.leg[1].rotation.z = .25*k; r.leg[-1].rotation.x = r.leg[1].rotation.x = -.1; r.knee[-1].rotation.x = r.knee[1].rotation.x = .3*k; },
    cheer(r, t){ r.arm[-1].rotation.z = -2.6; r.arm[1].rotation.z = 2.6; r.arm[-1].rotation.x = r.arm[1].rotation.x = Math.sin(t*9)*.15; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.15;
      r.chest.rotation.x = -.1; r.hips.position.y = .94 + Math.abs(Math.sin(t*9))*.05; r.leg[1].rotation.x = r.leg[-1].rotation.x = 0; r.knee[1].rotation.x = r.knee[-1].rotation.x = .05; }
  };

  // your player, as the game describes him, in a kit (club colours, or the kit of the moment)
  function lookOf(pl, c1, c2, o = {}){
    const SK = typeof SKIN!=="undefined" ? SKIN : ["#F1C9A5","#D9A37A","#B57D52","#8A5A3B","#5C3A24"], HC = typeof HAIRC!=="undefined" ? HAIRC : {Black:"#17130F"};
    return {skin:SK[pl && pl.skin != null ? pl.skin : 1] || SK[1], hair:(pl && pl.hair) || "short", hairCol:HC[(pl && pl.hairColour) || "Black"] || "#17130F",
      c1:c1 || "#1D6537", c2:c2 || "#FFFFFF", num:o.num ?? (pl && pl.number) ?? "", name:o.name ?? (pl ? String(pl.name || "").trim().split(/\s+/).pop() : ""), ...o};
  }

  /* ---------- renderers: one for the card, one for the mini-games, kept for the whole session ---------- */
  function makeRenderer(){
    const r = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:"low-power"});
    r.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1)); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.domElement.className = "g3-canvas"; r.domElement.setAttribute("aria-hidden", "true");
    return r;
  }
  function fit(r, cam, el){ const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight); if (r._w===w && r._h===h) return false; r._w = w; r._h = h; r.setSize(w, h, false); cam.aspect = w/h; cam.updateProjectionMatrix(); return true; }
  function lights(scene, o = {}){
    scene.add(new THREE.HemisphereLight(0xE6EEFF, 0x1A3A22, o.hemi ?? 1.1));
    const a = new THREE.DirectionalLight(0xFFF1D6, o.key ?? 2.2); a.position.set(-4, 7, o.keyZ ?? -5); scene.add(a);
    const b = new THREE.DirectionalLight(0xDDE8FF, o.fill ?? .9); b.position.set(5, 5, 6); scene.add(b);
    const c = new THREE.DirectionalLight(0xFFE9B0, o.rim ?? 1.3); c.position.set(0, 4, -8); scene.add(c);
  }
  // empty a scene, freeing what isn't shared (the shared geometries and materials stay for the next one)
  function clear(scene){
    const keepG = new Set(geos.values()), keepM = new Set(mats.values());
    scene.traverse(o=>{ if (o.geometry && !keepG.has(o.geometry)) o.geometry.dispose();
      if (o.material && !keepM.has(o.material)){ if (o.material.map && o.material.map !== crowdTex && o.material.map !== boardTex && o.material.map !== ballTex && o.material.map !== blobTex) o.material.map.dispose(); o.material.dispose(); } });
    while (scene.children.length) scene.remove(scene.children[0]);
  }

  /* ---------- the home card: your player, turning slowly under the floodlights ---------- */
  const card = (() => {
    let R = null, scene, cam, P = null, key = "", raf = 0, host = null, t0 = 0, spin = 0, drag = null, vis = true, io = null;
    function frame(now){
      raf = 0; if (!host || !host.isConnected || !R) return stop();
      if (!vis || document.hidden){ raf = requestAnimationFrame(frame); return; }
      fit(R, cam, host);
      const t = (now - t0)/1000;
      if (!drag) spin += Math.min(.05, (now - (frame.last || now))/1000)*.38;   // a slow turn, about one every 17 seconds
      frame.last = now;
      P.root.rotation.y = Math.PI + spin; POSE.idle(P.rig, t);
      R.render(scene, cam); raf = requestAnimationFrame(frame);
    }
    function stop(){ if (raf) cancelAnimationFrame(raf); raf = 0; if (io){ io.disconnect(); io = null; } }
    function mount(el, pl, club){
      if (!el || !ready()) return false;
      if (!R){ R = makeRenderer(); scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(26, 1, .1, 50); }
      const k = JSON.stringify([pl.skin, pl.hair, pl.hairColour, pl.number, pl.name, club.c1, club.c2]);
      if (k !== key){ key = k; clear(scene); lights(scene, {key:2.4, keyZ:-6, rim:1.6});
        P = makePlayer(lookOf(pl, club.c1, club.c2)); P.rig.shadow.visible = false; scene.add(P.root); }
      // framed from the thighs up, the way the 2D card was
      cam.position.set(0, 1.47, 2.25); cam.lookAt(0, 1.31, 0);
      host = el; el.classList.add("g3"); el.prepend(R.domElement); R._w = 0;
      const c = R.domElement;
      if (!c._g3){ c._g3 = 1;
        c.addEventListener("pointerdown", e=>{ drag = {x:e.clientX, s:spin}; try{ c.setPointerCapture(e.pointerId); }catch(err){} });
        c.addEventListener("pointermove", e=>{ if (drag) spin = drag.s + (e.clientX - drag.x)*.012; });
        const up = () => { drag = null; }; c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up); }
      if (io) io.disconnect(); io = new IntersectionObserver(es=>{ vis = es.some(e=>e.isIntersecting); }); io.observe(el);
      if (!t0) t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
      return true;
    }
    return {mount, stop, turn(a){ spin = a; }};
  })();

  /* ---------- shots in 3D ----------
     The 2D shot's numbers are kept: x across the goal 30 (left post) to 270 (right post), y 20 (bar) to 124 (the line).
     G3.shot(stage, o) builds the scene in the stage and returns {play(res), stop()}; play() animates the strike,
     the ball and the keeper, and resolves when the ball's arrived */
  const DIST = {pen:11, box:13.5, oneonone:8.5, long:24, freekick:22, chip:9, volley:12};
  const gx = x => (x - 150)/120*3.66, gy = y => (124 - y)/104*2.44;
  let SR = null;
  function pitch(scene, D){
    // mown stripes across the pitch, then the lines as thin strips
    const g1 = mat("#1D6B3A", .95), g2 = mat("#22793F", .95), line = new THREE.MeshBasicMaterial({color:0xF2F5EF});
    for (let i = -2; i < 14; i++){ const s = new THREE.Mesh(new THREE.PlaneGeometry(90, 4), i%2 ? g1 : g2); s.rotation.x = -Math.PI/2; s.position.set(0, 0, i*4 + 2); scene.add(s); }
    const strip = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), line); m.rotation.x = -Math.PI/2; m.position.set(x, .01, z); scene.add(m); };
    const W = .12;
    strip(0, 0, 70, W);                                       // the goal line
    strip(-9.16, 2.75, W, 5.5); strip(9.16, 2.75, W, 5.5); strip(0, 5.5, 18.32 + W, W);   // the six-yard box
    strip(-20.16, 8.25, W, 16.5); strip(20.16, 8.25, W, 16.5); strip(0, 16.5, 40.32 + W, W);   // the penalty area
    const spot = new THREE.Mesh(new THREE.CircleGeometry(.12, 16), line); spot.rotation.x = -Math.PI/2; spot.position.set(0, .011, 11); scene.add(spot);
    const arc = new THREE.Mesh(new THREE.RingGeometry(9.15 - W/2, 9.15 + W/2, 48, 1, Math.PI*.205, Math.PI*.59), line); arc.rotation.x = -Math.PI/2; arc.position.set(0, .011, 11); scene.add(arc);
  }
  function goalFrame(scene){
    const post = mat("#F4F6F2", .35), H = 2.44, X = 3.66, r = .06;
    const pg = new THREE.CylinderGeometry(r, r, H + r, 16);
    [-1, 1].forEach(s=>{ const p = new THREE.Mesh(pg, post); p.position.set(s*X, (H + r)/2, 0); scene.add(p); });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2*X + 2*r, 16), post); bar.rotation.z = Math.PI/2; bar.position.set(0, H, 0); scene.add(bar);
    // the net: a grid on the back, the roof and the sides; the back bulges where a goal goes in
    const D = 1.9, n = .16, pts = [], base = [];
    const seg = (a, b) => { pts.push(...a, ...b); };
    for (let x = -X; x <= X + 1e-6; x += n){ seg([x, 0, -D], [x, H*.86, -D]); seg([x, H*.86, -D], [x, H, -.25]); }
    for (let y = 0; y <= H*.86 + 1e-6; y += n) seg([-X, y, -D], [X, y, -D]);
    for (let z = 0; z <= 1; z += .1){ const zz = -.25 - (D - .25)*z, yy = H - (H - H*.86)*z; seg([-X, yy, zz], [X, yy, zz]); }
    [-1, 1].forEach(s=>{ for (let z = 0; z <= D + 1e-6; z += n) seg([s*X, 0, -z], [s*X, z < .25 ? H : H - (H*.14)*(z - .25)/(D - .25), -z]);
      for (let y = 0; y <= H + 1e-6; y += n) seg([s*X, y, -.02], [s*X, y, -(y > H*.86 ? .25 + (D - .25)*(H - y)/(H*.14) : D)]); });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); base.push(...pts);
    const net = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:0xE8EEE8, transparent:true, opacity:.42}));
    scene.add(net);
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(2*X, H*.86), new THREE.MeshBasicMaterial({color:0x04100A, transparent:true, opacity:.45})); shade.position.set(0, H*.43, -D - .02); scene.add(shade);
    // push the net out around (x, y), by amount 0..1
    return (x, y, amt) => { const p = g.attributes.position.array; for (let i = 0; i < p.length; i += 3){ if (base[i + 2] > -D + .3) continue; const d = Math.hypot(base[i] - x, base[i + 1] - y); p[i + 2] = base[i + 2] - amt*.55*Math.max(0, 1 - d/1.3); } g.attributes.position.needsUpdate = true; };
  }
  let crowdTex = null, boardTex = null;
  function stands(scene, kc){
    if (!crowdTex){ const c = document.createElement("canvas"); c.width = 1024; c.height = 256; const x = c.getContext("2d"); x.fillStyle = "#0B1611"; x.fillRect(0, 0, 1024, 256);
      const R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(11), cs = ["#26332D","#33413A","#1E2A25","#3D4A43","#46524B"];
      for (let row = 0; row < 11; row++) for (let i = 0; i < 70; i++){ x.fillStyle = R() < .18 ? kc : cs[Math.floor(R()*cs.length)];
        const cx = i*14.8 + (row%2)*7 + R()*3, cy = 18 + row*22 + R()*3; x.beginPath(); x.arc(cx, cy, 5 + R()*1.5, 0, 7); x.fill(); x.fillRect(cx - 7, cy + 5, 14, 12); }
      crowdTex = new THREE.CanvasTexture(c); crowdTex.colorSpace = THREE.SRGBColorSpace; }
    if (!boardTex){ const c = document.createElement("canvas"); c.width = 1024; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#0B1A12"; x.fillRect(0, 0, 1024, 64);
      x.font = "900 40px Big Shoulders Display, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      for (let i = 0; i < 6; i++){ x.fillStyle = i%2 ? "#F5C542" : "#7FD7C4"; x.fillText("PYRAMID", 85 + i*171, 34); }
      boardTex = new THREE.CanvasTexture(c); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.wrapS = THREE.RepeatWrapping; boardTex.repeat.x = 2; }
    const crowd = new THREE.Mesh(new THREE.PlaneGeometry(80, 20), new THREE.MeshBasicMaterial({map:crowdTex, color:0x9AA59F})); crowd.position.set(0, 10.5, -16); crowd.rotation.x = .22; scene.add(crowd);
    const boards = new THREE.Mesh(new THREE.PlaneGeometry(40, .9), new THREE.MeshBasicMaterial({map:boardTex})); boards.position.set(0, .45, -5); scene.add(boards);
    // the floodlights' glow
    const gc = document.createElement("canvas"); gc.width = gc.height = 64; const gx2 = gc.getContext("2d"), gr = gx2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,248,222,1)"); gr.addColorStop(.25, "rgba(255,226,154,.45)"); gr.addColorStop(1, "rgba(255,226,154,0)"); gx2.fillStyle = gr; gx2.fillRect(0, 0, 64, 64);
    const gt = new THREE.CanvasTexture(gc);
    [-1, 1].forEach(s=>{ const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:gt, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending})); sp.position.set(s*24, 24, -22); sp.scale.set(16, 16, 1); scene.add(sp); });
    scene.fog = new THREE.Fog(0x07120C, 30, 70);
  }
  let ballTex = null;
  function ball(){
    if (!ballTex){ const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d"); x.fillStyle = "#F7F7F5"; x.fillRect(0, 0, 256, 128);
      x.fillStyle = "#1B1D21"; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++){ const cx = i*44 + (j%2)*22 + 10, cy = 22 + j*42; x.beginPath(); for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2 - Math.PI/2; x.lineTo(cx + Math.cos(a)*11, cy + Math.sin(a)*11); } x.fill(); }
      ballTex = new THREE.CanvasTexture(c); ballTex.colorSpace = THREE.SRGBColorSpace; }
    const b = new THREE.Mesh(new THREE.SphereGeometry(.11, 24, 16), new THREE.MeshStandardMaterial({map:ballTex, roughness:.45}));
    return b;
  }
  function shot(stage, o){
    if (!stage || !ready()) return null;
    if (!SR){ SR = {r:makeRenderer(), scene:new THREE.Scene(), cam:new THREE.PerspectiveCamera(40, 300/180, .1, 120)}; }
    const {r, scene, cam} = SR; clear(scene); scene.fog = null; scene.background = new THREE.Color(0x07120C);
    const D = DIST[o.v] ?? 13;
    lights(scene, {hemi:1.25, key:2.3, keyZ:8, rim:.9, fill:1});
    pitch(scene, D); const bulge = goalFrame(scene); stands(scene, o.crowd || "#F5C542");
    const B = ball(); B.position.set(0, .11, D); scene.add(B);
    // a faint trail behind the ball, so you can follow it into the far corner
    const TN = 14, trailPos = new Float32Array(TN*3), trailG = new THREE.BufferGeometry(); trailG.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trail = new THREE.Line(trailG, new THREE.LineBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.5})); trail.visible = false; trail.frustumCulled = false; scene.add(trail);
    const trailPush = () => { trailPos.copyWithin(3, 0, (TN - 1)*3); trailPos[0] = B.position.x; trailPos[1] = B.position.y; trailPos[2] = B.position.z; trailG.attributes.position.needsUpdate = true; }; const bs = blob(.36, .36); bs.position.set(0, .006, D); scene.add(bs);
    // you: just behind the ball, a little to its left, seen from behind
    const me = makePlayer(o.me); me.root.position.set(-.62, 0, D + .6); me.root.rotation.y = Math.PI + .3; scene.add(me.root);
    // their keeper, on his line (off it, one-on-one)
    const kz = o.v==="oneonone" ? 2.6 : o.v==="pen" ? .1 : .4;
    const kp = grp(0, .94, kz), K = makePlayer(o.keeper); K.root.position.y = -.94; kp.add(K.root); scene.add(kp);
    const ks = blob(1, .7); ks.position.set(0, .006, kz); scene.add(ks);
    // a wall for free kicks, 9.15 m out
    const wall = []; if (o.v==="freekick"){ for (let i = 0; i < 4; i++){ const w = makePlayer(o.wall); w.root.position.set(-.75 + i*.5, 0, D - 9.15); scene.add(w.root); POSE.idle(w.rig, i); w.rig.arm[-1].rotation.x = w.rig.arm[1].rotation.x = -.6; w.rig.arm[-1].rotation.z = .35; w.rig.arm[1].rotation.z = -.35; wall.push(w); } }
    // the camera behind your shoulder, low enough to see the whole goal; the ball sits where your finger goes (92% down)
    const camAt = new THREE.Vector3(.4, 1.7, D + 4.2), look = new THREE.Vector3(0, 1.05, 0);
    cam.fov = o.v==="long" || o.v==="freekick" ? 30 : 38; cam.position.copy(camAt); cam.lookAt(look); cam.clearViewOffset();
    const host = stage; host.classList.add("g3"); host.prepend(r.domElement); r._w = 0;
    const anims = new Set(); let t0 = performance.now(), raf = 0, stopped = false, mode = "idle";
    const aim = () => { // shift the picture so the ball lands at (50%, 92%) of the stage, where the drag starts
      cam.clearViewOffset(); cam.updateMatrixWorld(); const p = new THREE.Vector3(0, .11, D).project(cam), w = r._w, h = r._h;
      const dx = (p.x*.5)*w, dy = (-p.y*.5 + .5 - .922)*h; cam.setViewOffset(w, h, dx, dy, w, h); };
    const frame = now => {
      raf = 0; if (stopped) return; if (!r.domElement.isConnected){ stop(); return; }
      if (fit(r, cam, host)) aim();
      const t = (now - t0)/1000;
      if (mode==="idle"){ POSE.idle(me.rig, t); POSE.ready(K.rig, t); }
      anims.forEach(f=>f(now));
      r.render(scene, cam); raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const stop = () => { stopped = true; if (raf) cancelAnimationFrame(raf); raf = 0; host.classList.remove("g3"); r.domElement.remove(); };
    // an animation step run every frame for ms milliseconds (several can run at once)
    const tween = (ms, f) => new Promise(res=>{ const a = performance.now(); const g = now=>{ const k = Math.min(1, Math.max(0, now - a)/ms); f(k); if (k>=1){ anims.delete(g); res(); } }; anims.add(g); if (stopped) res(); });
    const ease = k => 1 - Math.pow(1 - k, 2);
    /* res: {wx, ty, ms, h, curve, kx, ky, rot, kms, goal, over, wide, wood, wall, saved} in the 2D shot's numbers */
    async function play(q){
      mode = "shoot";
      // the strike: the leg swings back and through
      await tween(240, k=>{ POSE.kick(me.rig, k*.55); POSE.ready(K.rig, (performance.now() - t0)/1000); });
      const tgt = new THREE.Vector3(gx(q.wx), Math.max(.11, gy(q.ty)), 0);
      if (q.wall) tgt.set(gx(q.wx), 1.2, D - 9.15 + .35);
      const from = B.position.clone(), arcH = (q.h || 0)/104*2.44, cv = (q.curve || 0)/120*3.66;
      const kTo = new THREE.Vector3(gx(q.kx), Math.max(.55, gy(q.ky)), kz), kFrom = kp.position.clone(), roll = -(q.rot || 0)*Math.PI/180;
      const fov0 = cam.fov;
      const spinAxis = new THREE.Vector3(1, q.curve ? -.4*Math.sign(q.curve) : 0, 0).normalize();
      await Promise.all([
        tween(260, k=>POSE.kick(me.rig, .55 + .45*k)),
        tween(q.ms, k=>{ const e = ease(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e), from.y + (tgt.y - from.y)*e + arcH*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); if (!trail.visible){ for (let i = 0; i < TN; i++) trailPos.set([B.position.x, B.position.y, B.position.z], i*3); trail.visible = true; } trailPush(); bs.position.set(B.position.x, .006, B.position.z); bs.scale.setScalar(Math.max(.3, 1 - B.position.y*.25));
          cam.fov = fov0 - 4*ease(k); cam.updateProjectionMatrix(); }),   // a slight zoom as it flies
        tween(q.kms, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; POSE.dive(K.rig, Math.abs(roll) > .2 ? e : e*.4); ks.position.x = kp.position.x; })
      ]);
      // what happens next: in the net, off the keeper, off the post, over, wide, off the wall
      const p0 = B.position.clone(); tween(300, k=>{ trailPush(); trail.material.opacity = .5*(1 - k); }).then(()=>{ trail.visible = false; });
      if (q.goal){
        mode = "goal";
        await tween(420, k=>{ const e = ease(k); B.position.set(p0.x, Math.max(.11, p0.y - .4*k*k), p0.z - 1.55*e); bulge(p0.x, p0.y, Math.sin(Math.min(1, k*1.6)*Math.PI*.5)*(1 - Math.max(0, k - .6))); B.rotateOnAxis(spinAxis, -.12*(1 - k)); });
        const tc = performance.now(); tween(900, k=>{ POSE.cheer(me.rig, (performance.now() - tc)/1000); bulge(p0.x, p0.y, Math.max(0, .4 - k)*.5); });
      } else if (q.over || q.wide){
        await tween(360, k=>{ B.position.set(p0.x + (q.wide ? Math.sign(p0.x)*1.5*k : 0), p0.y + (q.over ? .6*k : -.1*k), p0.z - 6*k); });
      } else if (q.wood){
        await tween(420, k=>{ B.position.set(p0.x - Math.sign(p0.x)*.8*k, Math.max(.11, p0.y - 1.2*k*k + .2*k), p0.z + 4*ease(k)); });
      } else if (q.wall){
        await tween(420, k=>{ B.position.set(p0.x + .6*k, Math.max(.11, p0.y + .3*k - 1.2*k*k), p0.z + 3.5*ease(k)); });
      } else {   // saved: pushed away
        await tween(460, k=>{ B.position.set(p0.x + Math.sign(p0.x || 1)*1.6*ease(k), Math.max(.11, p0.y + .25*k - 1.1*k*k), p0.z + 1.2*ease(k)); bs.position.set(B.position.x, .006, B.position.z); });
      }
    }
    return {play, stop};
  }

  // three.js is fetched once the game's on screen, so it's there by the first shot
  if (typeof window !== "undefined") window.addEventListener("load", ()=>setTimeout(()=>load().then(ok=>{ if (ok && typeof S!=="undefined" && S && typeof render==="function" && document.querySelector(".board .card-top")) G3.cardNow(); }), 400));
  return {on, set, load, ready, glOK, lookOf, card:card, shot, cardNow(){ const el = document.querySelector(".board .card-top"); if (el && S && S.player) card.mount(el, S.player, meta(S.club)); }};
})();
