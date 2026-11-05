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
  // a phone that can't draw the 3D mini-games smoothly gets the 2D ones for the rest of the session: timing games
  // (saves, shots) have to be fair, and a slow picture shows the ball late
  let slow = false; try{ slow = sessionStorage.getItem("efp-3d-slow")==="1"; }catch(e){}
  /* older phones (little memory, few cores, or a phone that's struggled before): no antialiasing, one pixel per pixel,
     kits and faces painted at half size (a quarter of the work for each new kit) and no bump maps */
  let lite = false; try{ lite = localStorage.getItem("efp-3d-lite")==="1"; }catch(e){}
  lite ||= (navigator.deviceMemory > 0 && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
  const goLite = () => { lite = true; try{ localStorage.setItem("efp-3d-lite", "1"); }catch(e){} };
  const fast = () => ready() && !slow;
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
  function makeToy(look){
    const root = grp(), rig = {};
    const sk = "skin|" + look.skin; if (!mats.has(sk)) mats.set(sk, new THREE.MeshStandardMaterial({color:col(look.skin), roughness:.58, emissive:col(look.skin).multiplyScalar(.1)}));
    const skin = mats.get(sk), shirt = mat(look.c1, .82), trim = mat(look.c2 || "#FFFFFF", .8), shorts = mat(look.shorts || (lum(look.c1) > .6 ? "#1F2937" : "#F4F4F5"), .85);
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
    const torsoG = geo("torso2", ()=>new THREE.LatheGeometry([[0,0],[.152,0],[.155,.05],[.16,.12],[.172,.2],[.186,.28],[.196,.35],[.198,.4],[.19,.445],[.165,.48],[.12,.505],[.07,.515],[0,.518]].map(([r, y])=>new THREE.Vector2(r, y)), 40));
    const torso = new THREE.Mesh(torsoG, shirt); torso.scale.set(1.28, 1, .72); chest.add(torso);
    // the slope of the shoulders, from the neck down to the arms (no flat shelf)
    const trap = new THREE.Mesh(sph(.1, 28, 16), shirt); trap.scale.set(2.05, .62, .82); trap.position.set(0, .455, -.012); chest.add(trap);
    // the name and number on the back, a curved panel just off the shirt
    const nb = new THREE.Mesh(new THREE.CylinderGeometry(.19, .176, .4, 28, 1, true, Math.PI - .95, 1.9), new THREE.MeshStandardMaterial({map:backTex(look), transparent:true, roughness:.8, depthWrite:false}));
    nb.scale.set(1.31, 1, .76); nb.position.y = .23; chest.add(nb);
    // collar
    const collar = new THREE.Mesh(geo("collar", ()=>new THREE.TorusGeometry(.068, .013, 8, 24)), trim); collar.rotation.x = Math.PI/2.2; collar.position.set(0, .515, .004); collar.scale.set(1.15, 1, 1); chest.add(collar);
    // the neck, and the head on it
    chest.add(mesh(geo("neck2", ()=>new THREE.CylinderGeometry(.058, .07, .16, 18)), skin, 0, .565, -.004));
    const head = rig.head = grp(0, .675, .006); head.scale.setScalar(1.08); chest.add(head);
    // the head: an egg from crown to chin, a little narrower than it is deep, with a jaw and cheeks to give the face its shape
    const skullG = geo("skull2", ()=>{ const g = new THREE.LatheGeometry([[0,-.118],[.032,-.115],[.055,-.103],[.072,-.085],[.086,-.06],[.096,-.03],[.102,.0],[.104,.03],[.1,.06],[.088,.088],[.066,.108],[.036,.12],[0,.124]].map(([r, y])=>new THREE.Vector2(r, y)), 40);
      // shape it into a head: the jaw narrows to the chin, the chin comes forward, the face is flatter than the back
      const P = g.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < P.count; i++){ v.fromBufferAttribute(P, i); v.x *= .86; v.z *= .97;
        if (v.y < -.02){ const t = Math.min(1, (-.02 - v.y)/.1); v.x *= 1 - .2*t*(v.z > 0 ? 1 : .5); if (v.z > 0) v.z += .012*t*Math.max(0, 1 - Math.abs(v.x)/.05); }
        if (v.z > .05) v.z = .05 + (v.z - .05)*.88;
        if (v.z < -.02 && v.y > -.04) v.z *= 1.04;   // the back of the head
        P.setXYZ(i, v.x, v.y, v.z); }
      g.computeVertexNormals(); return g; });
    const skull = new THREE.Mesh(skullG, skin); head.add(skull);
    [-1, 1].forEach(s=>{
      // ears, flat against the head
      const ear = new THREE.Mesh(sph(.03, 14, 10), skin); ear.scale.set(.32, 1, .66); ear.position.set(s*.087, -.006, -.008); ear.rotation.y = s*.3; head.add(ear);
      // eyes: a little white, a dark iris, set under the brow
      const white = mesh(sph(.0125, 14, 10), mat("#EDE7DF", .35), s*.032, .012, .087); white.scale.set(1.2, .72, .5); head.add(white);
      head.add(mesh(sph(.0062, 12, 8), mat("#2A1A10", .25), s*.032, .012, .0915));
      const lid = mesh(sph(.0142, 14, 8), skin, s*.032, .0175, .0865); lid.scale.set(1.25, .45, .55); head.add(lid);
      // brows: thin and a little arched
      const brow = new THREE.Mesh(geo("brow2", ()=>{ const g = new THREE.CapsuleGeometry(.0042, .026, 4, 6); g.rotateZ(Math.PI/2); return g; }), hairM); brow.position.set(s*.033, .031, .094); brow.rotation.z = -s*.1; head.add(brow);
      head.add(mesh(sph(.009, 10, 8), skin, s*.011, -.03, .1));   // the wings of the nose
    });
    // the brow ridge, the nose, the lips
    // the nose: a bridge from between the eyes down to a rounded tip
    const nose = new THREE.Mesh(geo("nose3", ()=>{ const g = new THREE.CylinderGeometry(.006, .012, .042, 10); return g; }), skin); nose.position.set(0, -.006, .1); nose.rotation.x = .38; head.add(nose);
    head.add(mesh(sph(.0115, 12, 10), skin, 0, -.028, .108));
    const lipC = "#" + col(look.skin).lerp(col("#8A3A34"), .22).getHexString();
    const lipU = new THREE.Mesh(geo("lip", ()=>{ const g = new THREE.CapsuleGeometry(.0055, .02, 4, 8); g.rotateZ(Math.PI/2); return g; }), mat(lipC, .45)); lipU.position.set(0, -.054, .088); head.add(lipU);
    const lipL = new THREE.Mesh(geo("lip2", ()=>{ const g = new THREE.CapsuleGeometry(.0065, .018, 4, 8); g.rotateZ(Math.PI/2); return g; }), mat(lipC, .45)); lipL.position.set(0, -.064, .085); head.add(lipL);
    // hair, by style
    const hs = look.hair || "short";
    if (hs !== "none"){
      // the hair follows the skull: high at the forehead, above the ears, down to the nape (a cap tipped back)
      const cap0 = (r, top = 1.5, tilt = -.5) => { const g = new THREE.Mesh(new THREE.SphereGeometry(r, 30, 18, 0, Math.PI*2, 0, top), hairM); g.scale.set(.87, 1, .98); g.rotation.x = tilt; g.position.set(0, .02, -.003); return g; };
      if (hs === "buzz"){ head.add(cap0(.1105, 1.52)); }
      else if (hs === "short"){ head.add(cap0(.1145)); }
      else if (hs === "curly"){ const R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(7);
        head.add(cap0(.116, 1.5));
        for (let i = 0; i < 56; i++){ const th = R()*Math.PI*2, ph = R()*1.25; const p = new THREE.Vector3(Math.sin(ph)*Math.cos(th), Math.cos(ph), Math.sin(ph)*Math.sin(th));
          if (p.z > .3 && p.y < .6) continue; p.multiplyScalar(.116); head.add(mesh(sph(.021 + R()*.008, 8, 6), hairM, p.x*.88, p.y + .02, p.z*.98 - .004)); } }
      else if (hs === "long"){ head.add(cap0(.117, 1.55, -.55));
        const fall = new THREE.Mesh(geo("hairfall", ()=>new THREE.CylinderGeometry(.098, .122, .24, 20, 1, true, Math.PI*.2, Math.PI*1.6)), hairM);
        fall.material = mats.get("hairDS|" + look.hairCol) || (mats.set("hairDS|" + look.hairCol, new THREE.MeshStandardMaterial({color:col(look.hairCol || "#17130F"), map:hairMap(), roughness:.85, side:THREE.DoubleSide})), mats.get("hairDS|" + look.hairCol));
        fall.position.set(0, -.07, -.014); fall.scale.set(.92, 1, .95); head.add(fall); }
    }
    // arms: shoulder → elbow → hand, with the sleeve over the top half
    rig.arm = {}; rig.elbow = {};
    [-1, 1].forEach(s=>{
      const shp = rig.arm[s] = grp(s*.238, .425, -.01); chest.add(shp); shp.rotation.z = s*.07;
      shp.add(mesh(sph(.066, 16, 12), shirt));   // the round of the shoulder, under the sleeve
      shp.add(mesh(limb(.29, .05, .056, .041), skin));   // the upper arm: biceps, narrowing to the elbow
      const slv = new THREE.Mesh(geo("sleeve", ()=>new THREE.CylinderGeometry(.068, .064, .16, 16, 1, true)), mat(look.c1, .82, {side:THREE.DoubleSide})); slv.position.y = -.07; shp.add(slv);
      const cuff = new THREE.Mesh(geo("cuff", ()=>new THREE.CylinderGeometry(.065, .065, .02, 16, 1, true)), mat(look.c2 || "#FFFFFF", .8, {side:THREE.DoubleSide})); cuff.position.y = -.15; shp.add(cuff);
      const el = rig.elbow[s] = grp(0, -.29, 0); shp.add(el); el.rotation.x = -.18;
      el.add(mesh(limb(.25, .041, .046, .03), skin));   // the forearm, thick below the elbow, thin at the wrist
      const hm = look.gk ? mat(look.gloves || "#C8F04A", .6) : skin, hand = mesh(sph(look.gk ? .056 : .044, 16, 12), hm, 0, -.275, .004); hand.scale.set(look.gk ? .95 : .72, 1.2, look.gk ? .62 : .5); el.add(hand);
      const thumb = mesh(cap(look.gk ? .019 : .013, .03), hm, -s*.02, -.262, .024); thumb.rotation.x = .5; thumb.rotation.z = -s*.4; el.add(thumb);
      if (look.gk){ const cuffG = new THREE.Mesh(geo("gcuff", ()=>new THREE.CylinderGeometry(.042, .038, .05, 14)), mat("#111827", .5)); cuffG.position.y = -.225; el.add(cuffG); }
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
    root.traverse(o=>{ if (o.isMesh){ o.frustumCulled = false; o.castShadow = true; } });
    return {root, rig};
  }
  // poses: k from 0 to 1 through the move
  const POSE = {
    idle(r, t){ const b = Math.sin(t*1.8); r.chest.rotation.x = .02 + b*.012; r.arm[-1].rotation.x = b*.04; r.arm[1].rotation.x = -b*.04; r.arm[-1].rotation.z = -.09; r.arm[1].rotation.z = .09;
      r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.28; r.head.rotation.y = Math.sin(t*.45)*.12; r.leg[-1].rotation.x = r.leg[1].rotation.x = 0; r.knee[-1].rotation.x = r.knee[1].rotation.x = 0; },
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
    // running: legs and arms swinging in time, a lean into it (k: how hard)
    move(r, ph, v){ POSE.idle(r, performance.now()/1000); if (v > .25) POSE.run(r, ph*.571, Math.min(1, v/3)); },
    run(r, t, k = 1){ const w = Math.sin(t*11)*k; r.leg[1].rotation.x = w*.75; r.leg[-1].rotation.x = -w*.75; r.knee[1].rotation.x = .3 + Math.max(0, -w)*1.1; r.knee[-1].rotation.x = .3 + Math.max(0, w)*1.1;
      r.arm[1].rotation.x = -w*.6; r.arm[-1].rotation.x = w*.6; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -1.1; r.arm[-1].rotation.z = -.15; r.arm[1].rotation.z = .15; r.chest.rotation.x = .18*k; r.hips.position.y = .94 + Math.abs(Math.cos(t*11))*.03; },
    // a header: arms up for balance, the neck snapping through (k: 0 to 1 through the jump)
    header(r, k){ r.arm[-1].rotation.z = -1.2; r.arm[1].rotation.z = 1.2; r.arm[-1].rotation.x = r.arm[1].rotation.x = -.5; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.9;
      r.chest.rotation.x = -.35 + .75*k; r.head.rotation.x = -.3 + .7*k; r.leg[1].rotation.x = r.leg[-1].rotation.x = .1; r.knee[1].rotation.x = r.knee[-1].rotation.x = .7*Math.sin(k*Math.PI); },
    // a slide tackle: the front leg out straight, the other folded, leaning back on an arm
    // (the body leans back about 55°, so the leading leg only lifts a little to lie along the grass)
    slide(r, k){ r.leg[1].rotation.x = -.62*k; r.knee[1].rotation.x = .05; r.leg[-1].rotation.x = .15*k; r.knee[-1].rotation.x = 1.5*k; r.leg[-1].rotation.z = -.2*k;
      r.chest.rotation.x = .35*k; r.head.rotation.x = .3*k; r.arm[-1].rotation.z = -.5*k; r.arm[1].rotation.z = .9*k; r.arm[-1].rotation.x = 1.1*k; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.25; },
    // brought down: arms out to break the fall
    fall(r, k){ r.arm[-1].rotation.x = r.arm[1].rotation.x = -1.6*k; r.arm[-1].rotation.z = -.4; r.arm[1].rotation.z = .4; r.leg[1].rotation.x = .5*k; r.knee[1].rotation.x = .8*k; r.chest.rotation.x = .2*k; },
    wall(r, t){ POSE.idle(r, t); r.arm[-1].rotation.x = r.arm[1].rotation.x = -.6; r.arm[-1].rotation.z = .35; r.arm[1].rotation.z = -.35; },
    plane(r, t){ POSE.run(r, t, 1); r.arm[-1].rotation.z = 1.4; r.arm[1].rotation.z = -1.4; },
    knees(r, k){ POSE.cheer(r, 0); },
    cheer(r, t){ r.arm[-1].rotation.z = -2.6; r.arm[1].rotation.z = 2.6; r.arm[-1].rotation.x = r.arm[1].rotation.x = Math.sin(t*9)*.15; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.15;
      r.chest.rotation.x = -.1; r.hips.position.y = .94 + Math.abs(Math.sin(t*9))*.05; r.leg[1].rotation.x = r.leg[-1].rotation.x = 0; r.knee[1].rotation.x = r.knee[-1].rotation.x = .05; }
  };

  /* ---------- real footballers ----------
     Two footballers from the Microsoft Rocketbox Avatar Library (MIT; vendor/people), with motion-captured idle,
     breathing, running and celebrating. Each is dressed in the kit of the side he's playing for (the shirt in its
     colour, the trim in its second, the name and number on the back), and you look like your player: the footballer
     closer to your skin tone, tinted to it. Until they've loaded (or if they can't), the drawn players stand in */
  const PEOPLE = {m02:{glb:"sm02", tex:"m301", skin:"#C08368"}, m03:{glb:"sm03", tex:"m300", skin:"#9A6746", hair:true}};
  /* more faces: other Rocketbox men's faces, which share the footballers' head layout, so any of them goes on m02's
     head. Each skin tone has its own set (the two darkest: two Black players' faces), and each player keeps his */
  const FACES = {m007:{skin:"#6A4634"}, m006:{skin:"#83583D"}, m017:{skin:"#B28665"}, m019:{skin:"#C29475", blond:true}, m003:{skin:"#B5896E"}, m013:{skin:"#BF8462"}, m001:{skin:"#CF9475"}};
  const FACE_TONES = [["#F1C9A5", ["m301", "m019", "m001", "m003"]], ["#D9A37A", ["m301", "m013", "m003", "m017", "m001", "m019"]], ["#B57D52", ["m300", "m013", "m017", "m003"]],
    ["#8A5A3B", ["m006", "m300", "m007"]], ["#5C3A24", ["m007", "m006"]]];
  const faceImg = {};
  let peopleP = null, people = null, clips = null;
  const img = src => new Promise((res, rej)=>{ const i = new Image(); i.onload = ()=>res(i); i.onerror = rej; i.src = src; });
  const script = src => new Promise((res, rej)=>{ const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  function loadPeople(){
    return peopleP ||= (async ()=>{
      try{
        if (!window.GLTFLoader) await script("vendor/GLTFLoader.js");
        if (!window.SkeletonUtils) await script("vendor/SkeletonUtils.js");
        const L = new GLTFLoader(), dir = "vendor/people/", out = {};
        for (const [k, P] of Object.entries(PEOPLE)){
          const [g, body, head, bn, hn, hair] = await Promise.all([L.loadAsync(dir + P.glb + ".glb"), img(dir + P.tex + "_body.jpg"), img(dir + P.tex + "_head.jpg"),
            img(dir + P.tex + "_body_n.jpg"), img(dir + P.tex + "_head_n.jpg"), P.hair ? img(dir + P.tex + "_hair.png") : null]);
          if (g.animations.length) clips = Object.fromEntries(g.animations.map(a=>[a.name, a]));
          const T = (i, srgb) => { const t = new THREE.Texture(i); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t; };
          out[k] = {...P, key:k, scene:g.scene, body, head, bodyN:T(bn), headN:T(hn), hairT:hair && T(hair, true)};
        }
        // the gaits: a walk, a jog and a steady run (Rocketbox's motion capture, the skeleton only), to go with the sprint
        try{ const gg = await L.loadAsync(dir + "gaits.glb"); gg.animations.forEach(a=>{ if (!clips[a.name]) clips[a.name] = a; }); }catch(e){}
        // the extra faces (a face that won't load is just left out)
        await Promise.all(Object.keys(FACES).map(k=>img(dir + k + "_head.jpg").then(i=>{ faceImg[k] = i; }, ()=>{})));
        people = out; return true;
      }catch(e){ console.warn("players", e); return false; }
    })();
  }
  const hex = c => { const h = String(c || "#888888").replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const isSkin = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx/255, s = mx ? (mx - mn)/mx : 0; if (s < .14 || s > .72 || v < .16 || mx !== r) return false; const h = 60*((g - b)/(mx - mn)); return h > 4 && h < 48; };
  const isTrim = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx===r && mx > 100 && (mx - mn)/mx > .64 && g < r*.62; };
  // a texture from an image, painted by fn on a canvas (cached by key)
  const texCache = new Map();
  function painted(key, im, fn){
    if (texCache.has(key)) return texCache.get(key);
    const k = lite ? .5 : 1, c = document.createElement("canvas"); c.width = Math.round(im.width*k); c.height = Math.round(im.height*k); const x = c.getContext("2d", {willReadFrequently:true}); x.drawImage(im, 0, 0, c.width, c.height);
    fn(c, x); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache.set(key, t); return t;
  }
  const tint = (M, look) => { const a = hex(M.skin), b = hex(look.skin); return a.map((v, i)=>Math.max(.45, Math.min(1.6, b[i]/v))); };
  // the face and the hands: the skin tinted to yours
  function headTex(M, look){
    const tn = tint(M, look);
    return painted(`h|${M.key}|${look.skin}`, M.head, (c, x)=>{ const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) if (isSkin(p[i], p[i+1], p[i+2])){ p[i] = Math.min(255, p[i]*tn[0]); p[i+1] = Math.min(255, p[i+1]*tn[1]); p[i+2] = Math.min(255, p[i+2]*tn[2]); }
      x.putImageData(d, 0, 0); });
  }
  // the kit: shirt, trim, shorts and hooped socks recoloured; boots kept; skin tinted; name and number on the back
  function kitTex(M, look){
    const c1 = hex(look.c1), c2 = hex(look.c2 || "#FFFFFF"), sh = hex(look.shorts || look.c2 || "#FFFFFF"), so = hex(look.socks || look.c1), tn = tint(M, look);
    return painted(`k|${M.key}|${look.skin}|${look.c1}|${look.c2}|${look.shorts}|${look.socks}|${look.num}|${look.name}`, M.body, (c, x)=>{
      const W = c.width, H = c.height, s = W/1024, d = x.getImageData(0, 0, W, H), p = d.data;
      for (let y = 0; y < H; y++) for (let X = 0; X < W; X++){
        const i = (y*W + X)*4, r = p[i], g = p[i+1], b = p[i+2], u = X/s, v = y/s;
        if (v > 735 && ((u > 226 && u < 336) || (u > 688 && u < 800) || (v > 866 && ((u > 226 && u < 408) || (u > 616 && u < 800))))) continue;   // the boots
        if (isSkin(r, g, b)){ p[i] = Math.min(255, r*tn[0]); p[i+1] = Math.min(255, g*tn[1]); p[i+2] = Math.min(255, b*tn[2]); continue; }
        const L = (r*.3 + g*.59 + b*.11)/255, trim = isTrim(r, g, b);
        let o;
        if (v < 205 && (u < 300 || u > 724)) o = trim ? c1 : sh;                          // shorts, with a trim in the shirt colour
        else if (v > 316 && v < 578 && (u < 262 || u > 762)) o = L > .27 ? so : c2;        // socks, hooped
        else o = trim ? c2 : c1;                                                            // the shirt and its trim
        const f = trim ? .95 : .94 + .04*Math.min(1, L*1.4);
        p[i] = o[0]*f; p[i+1] = o[1]*f; p[i+2] = o[2]*f;
      }
      x.putImageData(d, 0, 0);
      const ink = `rgb(${c2.join(",")})`, font = "Big Shoulders Display, Impact, sans-serif";
      // the sponsor: the game's
      x.fillStyle = `rgb(${c1.map(v=>v*.95).join(",")})`; x.fillRect(440*s, 615*s, 150*s, 80*s); x.fillRect(456*s, 570*s, 116*s, 46*s);   // the old sponsor and badge
      x.fillStyle = ink; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `900 ${34*s}px ${font}`; x.fillText("PYRAMID", 512*s, 652*s, 140*s);
      // the back (upside down in the texture): the name over the number
      x.save(); x.translate(512*s, 300*s); x.rotate(Math.PI);
      const name = String(look.name || "").toUpperCase().slice(0, 14);
      if (name){ x.font = `800 ${(name.length > 9 ? 30 : 36)*s}px ${font}`; x.fillText(name, 0, -98*s, 200*s); }
      x.font = `900 ${150*s}px ${font}`; x.fillText(String(look.num ?? ""), 0, 0); x.restore();
      // and on the shorts
      x.font = `900 ${34*s}px ${font}`; x.fillStyle = `rgb(${(lum("#" + sh.map(v=>v.toString(16).padStart(2, "0")).join("")) > .5 ? [21, 23, 26] : [245, 245, 245]).join(",")})`; x.fillText(String(look.num ?? ""), 175*s, 172*s);
    });
  }
  const matCache = new Map();
  const matFor = (key, make) => { if (!matCache.has(key)) matCache.set(key, make()); return matCache.get(key); };
  function makeReal(look){
    // his face: from the set for the skin tone nearest his, picked by his name (so it's always the same face)
    const sk = hex(look.skin), tone = FACE_TONES.reduce((b, t)=>{ const d = hex(t[0]).reduce((a, v, i)=>a + Math.abs(v - sk[i]), 0); return d < b[0] ? [d, t[1]] : b; }, [1e9, FACE_TONES[1][1]])[1];
    let opts = tone.filter(k=>k==="m301" || k==="m300" || faceImg[k]);
    if (look.hairCol && lum(look.hairCol) > .2 && opts.some(k=>FACES[k] && FACES[k].blond)) opts = opts.filter(k=>FACES[k] && FACES[k].blond);   // fair hair
    const nh = [...String(look.name || look.num || look.skin)].reduce((a, ch)=>(a*33 + ch.charCodeAt(0)) >>> 0, 5381), face = opts[nh % opts.length] || "m301";
    const M = face==="m300" ? people.m03 : people.m02;
    const F = FACES[face] ? {key:"f" + face, head:faceImg[face], skin:FACES[face].skin} : M;
    const model = SkeletonUtils.clone(M.scene), root = grp(); root.add(model);
    const body = kitTex(M, look), head = headTex(F, look);
    model.traverse(o=>{ if (!o.isMesh) return; o.frustumCulled = false; o.castShadow = true;
      const ms = [].concat(o.material).map(m => m.name==="hair" ? matFor("hair|" + M.key, ()=>new THREE.MeshStandardMaterial({map:M.hairT, alphaTest:.42, side:THREE.DoubleSide, roughness:.85}))
        : m.name==="head" ? matFor("head|" + head.uuid, ()=>new THREE.MeshStandardMaterial({map:head, normalMap:lite || F!==M ? null : M.headN, roughness:.62}))
        : matFor("body|" + body.uuid, ()=>lite ? new THREE.MeshStandardMaterial({map:body, roughness:.6})
          // the kit as cloth: a soft sheen at grazing angles, the way a shirt catches the floodlights
          : new THREE.MeshPhysicalMaterial({map:body, normalMap:M.bodyN, roughness:.66, sheen:.7, sheenRoughness:.5, sheenColor:new THREE.Color(.55, .55, .55)})));
      o.material = ms.length===1 ? ms[0] : ms; });
    const bones = {}, byName = {}; model.traverse(o=>{ if (o.isBone){ bones[o.name.replace(/^Bip01_?/, "") || "root"] = o; byName[o.name] = o; } });
    // a keeper's gloves
    if (look.gk) ["L_Hand", "R_Hand"].forEach(n=>{ const b = bones[n]; if (!b) return; const gl = new THREE.Mesh(sph(5.2, 14, 10), mat(look.gloves || "#C8F04A", .6)); gl.scale.set(1.9, .75, 1.25); gl.position.set(7, 0, 0); b.add(gl); });
    // everyone a little different: taller or shorter, slighter or stockier (the same for the same player every time)
    const hs = [...String(look.name || "") + (look.num ?? "") + look.skin + look.c1].reduce((a, ch)=>(a*31 + ch.charCodeAt(0)) >>> 0, 7);
    const h = .95 + (hs % 101)/1000, g = .94 + ((hs >>> 8) % 131)/1000; model.scale.multiply(new THREE.Vector3(g, h, g));
    const shadow = blob(.9, .6); root.add(shadow);
    return {root, model, real:true, act:{}, bones, byName, shadow, rig:null};
  }
  // which player to make: a real footballer once they've loaded, the drawn one till then
  function makePlayer(look){ return people && !look.toy ? makeReal(look) : makeToy(look); }

  /* poses for the real footballers: a captured clip, then the joints moved on top of it. Moves are in the player's
     own frame: x to his left, y up, z the way he faces */
  const AX = {x:null, y:null, z:null};
  let Q1, Q2, V1;
  function rotW(P, bone, axis, ang){
    if (!bone || !ang) return;
    Q1 ||= new THREE.Quaternion(); Q2 ||= new THREE.Quaternion(); V1 ||= new THREE.Vector3();
    P.root.getWorldQuaternion(Q2); V1.copy(axis).applyQuaternion(Q2); Q1.setFromAxisAngle(V1, ang);
    bone.getWorldQuaternion(Q2); Q2.premultiply(Q1);   // the bone's new world rotation
    bone.parent.getWorldQuaternion(Q1); bone.quaternion.copy(Q1.invert().multiply(Q2)); bone.updateMatrixWorld(true);
  }
  // a clip at time t, set on every bone it moves, every time (so the moves put on top never pile up from frame to frame)
  /* the gaits: each clip's own ground speed (m/s), the ground covered in one cycle of it (m) and where in it his left
     foot's furthest forward (measured from the motion capture), so stride and speed match and the feet don't slide */
  const GAITS = [{n:"walk", v:1.49, c:1.59, o:.992}, {n:"jog", v:2.42, c:1.86, o:.867}, {n:"stride", v:2.88, c:2.11, o:.958}, {n:"run", v:5.84, c:3.5, o:.992}];
  const gaits = () => GAITS.filter(g=>clips && clips[g.n]);
  // the two gaits either side of a speed, and how far between them (null is standing)
  function gaitAt(v){ const G = gaits(); if (!G.length) return [null, null, 0];
    if (v < .25) return [null, G[0], 0];
    if (v < G[0].v*.6) return [null, G[0], Math.min(1, (v - .25)/(G[0].v*.6 - .25))];
    for (let i = 0; i < G.length - 1; i++) if (v < G[i + 1].v) return [G[i], G[i + 1], Math.max(0, (v - G[i].v)/(G[i + 1].v - G[i].v))];
    return [G[G.length - 1], G[G.length - 1], 0]; }
  // how far through his stride he gets, covering d metres (his own size) at v m/s
  function strideBy(d, v){ const [a, b, w] = gaitAt(v), ca = a ? a.c : (b ? b.c : 1.6), cb = b ? b.c : ca; return d/(ca + (cb - ca)*w); }
  // a player's stride kept going as he covers ground: from where he was to where he is now, over dt seconds
  function stepTo(P, d, dt, scale = 1){ const v = dt > 0 ? d/scale/dt : 0; P.gv = (P.gv ?? v) + (v - (P.gv ?? v))*(1 - Math.exp(-dt*8)); P.gph = (P.gph ?? Math.random()) + strideBy(d/scale, P.gv); pose(P, "move", P.gph, P.gv); }
  // a player moved by a script (obj: what moves him): his stride and gait from how far he's come since the last frame
  function track(P, obj, scale = 1){ const now = performance.now(), p = obj.position;
    if (P._lp && now > P._lt){ stepTo(P, Math.hypot(p.x - P._lp.x, p.z - P._lp.z), (now - P._lt)/1000, scale); } else if (!P._lp) pose(P, "move", 0, 0);
    P._lp = p.clone(); P._lt = now; }
  // a clip's tracks on this player's bones: [bone, "quaternion" | "position", sampler, spare]
  function clipList(P, name){
    const c = clips && clips[name]; if (!c) return [];
    return P.act[name] ||= c.tracks.map(tr=>{ const [bn, prop] = tr.name.split("."), b = P.byName[bn];
      return b && (prop==="quaternion" || prop==="position") ? [b, prop, tr.createInterpolant(), prop==="quaternion" ? new THREE.Quaternion() : new THREE.Vector3()] : null; }).filter(Boolean);
  }
  function clip(P, name, t){
    const c = clips && clips[name]; if (!c) return;
    const L = clipList(P, name);
    const tt = ((t % c.duration) + c.duration) % c.duration;
    for (const [b, prop, it] of L){ const v = it.evaluate(tt); if (prop==="quaternion") b.quaternion.fromArray(v); else b.position.fromArray(v); }
    P.model.position.y = 0; P.model.updateMatrixWorld(true);
  }
  const XA = () => AX.x ||= new THREE.Vector3(1, 0, 0), YA = () => AX.y ||= new THREE.Vector3(0, 1, 0), ZA = () => AX.z ||= new THREE.Vector3(0, 0, 1);
  // legs swing forward with a negative turn about x; the trunk leans forward with a positive one; arms rise out to the side
  // about z (the left arm positive, the right negative)
  const fwd = (P, b, a) => rotW(P, P.bones[b], XA(), -a), lean = (P, b, a) => rotW(P, P.bones[b], XA(), a);
  const raise = (P, side, a) => rotW(P, P.bones[side + "_UpperArm"], ZA(), side==="L" ? a : -a);
  const REAL = {
    idle(P, t){ clip(P, "idle", t); },
    run(P, t){ clip(P, "run", t); },
    /* on the move at v m/s (his own size), at ph through his stride (0 to 1, the left foot forward at 0): standing,
       walking, jogging, running or sprinting, whichever fits the speed, blended between neighbours (no snapping) */
    move(P, ph, v){ const [a, b, w] = gaitAt(v);
      const at = g => g ? ((((ph + g.o) % 1) + 1) % 1)*clips[g.n].duration : performance.now()/1000;
      if (w <= .01) return clip(P, a ? a.n : "idle", at(a));
      if (w >= .99) return clip(P, b.n, at(b));
      clip(P, a ? a.n : "idle", at(a)); const L = clipList(P, b.n); for (const [bn, prop, , sp] of L) sp.copy(bn[prop]);
      clip(P, b.n, at(b));
      for (const [bn, prop, , sp] of L){ if (prop==="quaternion") bn.quaternion.copy(sp.slerp(bn.quaternion, w)); else bn.position.copy(sp.lerp(bn.position, w)); }
      P.model.position.y = 0; P.model.updateMatrixWorld(true); },
    cheer(P, t){ clip(P, "cheer2", t); },
    // a keeper on his toes: knees bent, weight forward, hands out
    ready(P, t){ clip(P, "breathe", t); P.model.position.y = -.1;
      ["L", "R"].forEach(s=>{ fwd(P, s + "_Thigh", .6); fwd(P, s + "_Calf", -1.0); fwd(P, s + "_Foot", .35); raise(P, s, .5); fwd(P, s + "_UpperArm", .55); fwd(P, s + "_Forearm", .7); });
      lean(P, "Spine1", .28); lean(P, "Head", -.2); },
    // the strike: the right leg back, then through the ball
    kick(P, k){ clip(P, "breathe", .3); P.model.position.y = 0;
      const back = k < .45 ? k/.45 : 1 - (k - .45)/.55, thr = k < .45 ? 0 : (k - .45)/.55;
      fwd(P, "R_Thigh", -.8*back + 1.15*thr*(1 - thr*.3)); fwd(P, "R_Calf", -1.3*back*(1 - thr) - .1);
      fwd(P, "L_Thigh", .15); fwd(P, "L_Calf", -.25); lean(P, "Spine1", -.12 - .1*thr); rotW(P, P.bones.Spine1, YA(), -.2*back + .15*thr);
      raise(P, "L", .45 + .3*thr); raise(P, "R", .3 + .2*back); },
    // diving: the arms stretched up past the head
    dive(P, k){ clip(P, "breathe", 0); P.model.position.y = 0;
      raise(P, "L", 2.6*k); raise(P, "R", 2.6*k); fwd(P, "L_Thigh", .15*k); fwd(P, "R_Thigh", .15*k); fwd(P, "L_Calf", -.3*k); fwd(P, "R_Calf", -.3*k); },
    // a header: arms up for balance, the neck snapping through
    header(P, k){ clip(P, "breathe", 0); raise(P, "L", 1.2); raise(P, "R", 1.2); fwd(P, "L_UpperArm", .4); fwd(P, "R_UpperArm", .4);
      lean(P, "Spine1", -.35 + .75*k); lean(P, "Head", -.3 + .6*k); fwd(P, "L_Calf", -.7*Math.sin(k*Math.PI)); fwd(P, "R_Calf", -.7*Math.sin(k*Math.PI)); },
    // a slide tackle: (the body's leant back outside) the leading leg along the grass, the other folded under
    slide(P, k){ clip(P, "breathe", 0); fwd(P, "R_Thigh", .62*k); fwd(P, "L_Thigh", -.15*k); fwd(P, "L_Calf", -1.5*k);
      lean(P, "Spine1", .35*k); lean(P, "Head", .3*k); raise(P, "L", .5*k); fwd(P, "L_UpperArm", -1.1*k); raise(P, "R", .9*k); },
    // brought down: arms out to break the fall
    fall(P, k){ clip(P, "breathe", 0); fwd(P, "L_UpperArm", 1.6*k); fwd(P, "R_UpperArm", 1.6*k); fwd(P, "R_Thigh", -.5*k); fwd(P, "R_Calf", -.8*k); lean(P, "Spine1", .2*k); },
    // in the wall: hands in front, braced
    wall(P, t){ clip(P, "idle", t); ["L", "R"].forEach(s=>{ fwd(P, s + "_UpperArm", .35); raise(P, s, -.18); fwd(P, s + "_Forearm", 1.25); }); },
    // celebrating: the aeroplane (running, arms out wide, banking) and the knee slide (on his knees, arms up, leaning back)
    plane(P, t){ clip(P, "run", t); raise(P, "L", 1.45); raise(P, "R", 1.45); lean(P, "Spine1", .12); rotW(P, P.bones.Spine1, ZA(), Math.sin(t*2.2)*.22); P.model.updateMatrixWorld(true); },
    knees(P, k){ clip(P, "breathe", .5); P.model.position.y = -.42*k;
      ["L", "R"].forEach(s=>{ fwd(P, s + "_Thigh", .25*k); fwd(P, s + "_Calf", -1.75*k); fwd(P, s + "_Foot", .5*k); raise(P, s, 2.3*k); });
      lean(P, "Spine1", -.32*k); lean(P, "Head", -.25*k); P.model.updateMatrixWorld(true); }
  };
  // pose any player, real or drawn
  let poseLog = null;
  function pose(P, name, a, b){ if (!P) return; if (poseLog) poseLog.push([P, name, a, b]); if (P.real) REAL[name](P, a, b); else POSE[name](P.rig, a, b); }

  // your player, as the game describes him, in a kit (club colours, or the kit of the moment)
  function lookOf(pl, c1, c2, o = {}){
    const SK = typeof SKIN!=="undefined" ? SKIN : ["#F1C9A5","#D9A37A","#B57D52","#8A5A3B","#5C3A24"], HC = typeof HAIRC!=="undefined" ? HAIRC : {Black:"#17130F"};
    return {skin:SK[pl && pl.skin != null ? pl.skin : 1] || SK[1], hair:(pl && pl.hair) || "short", hairCol:HC[(pl && pl.hairColour) || "Black"] || "#17130F",
      c1:c1 || "#1D6537", c2:c2 || "#FFFFFF", num:o.num ?? (pl && pl.number) ?? "", name:o.name ?? (pl ? String(pl.name || "").trim().split(/\s+/).pop() : ""), ...o};
  }

  /* ---------- renderers: one for the card, one for the mini-games, kept for the whole session ---------- */
  function makeRenderer(){
    const r = new THREE.WebGLRenderer({antialias:!lite, alpha:true, powerPreference:"low-power"});
    r.setPixelRatio(lite ? 1 : Math.min(2, window.devicePixelRatio || 1)); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
    if (!lite){ r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }   // real shadows under the floodlights (not on older phones)
    r.domElement.className = "g3-canvas"; r.domElement.setAttribute("aria-hidden", "true");
    return r;
  }
  function fit(r, cam, el){ const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight); if (r._w===w && r._h===h) return false; r._w = w; r._h = h; r.setSize(w, h, false); if (cam.isPerspectiveCamera) cam.aspect = w/h; cam.updateProjectionMatrix(); return true; }
  /* ---------- the look ----------
     The light: a night stadium all round (a dark sky, the glow of the stands, four banks of floodlights, the pitch below),
     made once per renderer and used as image-based light, so the kit, the skin, the ball and the posts pick up the
     floodlights and the grass the way they would under them */
  const envs = new WeakMap(), envsDay = new WeakMap();
  // the afternoon: a blue sky, white haze over the roofs, the sun high to one side, the sunlit pitch below
  function envDay(r){
    if (envsDay.has(r)) return envsDay.get(r);
    const sc = new THREE.Scene(), g = new THREE.SphereGeometry(60, 48, 24), P = g.attributes.position, cl = [], c = new THREE.Color();
    const top = new THREE.Color(.16, .32, .72), haze = new THREE.Color(.75, .8, .86), stand = new THREE.Color(.22, .23, .24), grass = new THREE.Color(.1, .26, .09);
    for (let i = 0; i < P.count; i++){ const y = P.getY(i)/60;
      if (y < -.03) c.copy(grass); else if (y < .1) c.copy(stand).lerp(haze, (y + .03)/.13); else c.copy(haze).lerp(top, Math.min(1, (y - .1)/.6)); cl.push(c.r, c.g, c.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
    sc.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide})));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 8), new THREE.MeshBasicMaterial({color:new THREE.Color(60, 56, 48)})); sun.position.copy(SUN()).multiplyScalar(50); sc.add(sun);
    const pm = new THREE.PMREMGenerator(r), env = pm.fromScene(sc, .04).texture; pm.dispose();
    sc.traverse(o=>{ if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    envsDay.set(r, env); return env;
  }
  let sunV = null; const SUN = () => sunV ||= new THREE.Vector3(.85, .8, -.3).normalize();   // where the sun is: off to the right and a little behind the goal, so the shadows lie long across the pitch
  let skyDayTex = null;
  function skyDay(){ if (skyDayTex) return skyDayTex;
    const c = document.createElement("canvas"); c.width = 4; c.height = 256; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#2F6DB8"); g.addColorStop(.55, "#7FAEDB"); g.addColorStop(.85, "#C8D9E6"); g.addColorStop(1, "#A9BBA3"); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    skyDayTex = new THREE.CanvasTexture(c); skyDayTex.colorSpace = THREE.SRGBColorSpace; return skyDayTex; }
  let skyRainTex = null;
  function skyRain(){ if (skyRainTex) return skyRainTex;
    const c = document.createElement("canvas"); c.width = 4; c.height = 256; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#4B535C"); g.addColorStop(.6, "#78828C"); g.addColorStop(1, "#8E979D"); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    skyRainTex = new THREE.CanvasTexture(c); skyRainTex.colorSpace = THREE.SRGBColorSpace; return skyRainTex; }
  function envFor(r){
    if (envs.has(r)) return envs.get(r);
    const sc = new THREE.Scene(), g = new THREE.SphereGeometry(60, 48, 24), P = g.attributes.position, cl = [], c = new THREE.Color();
    const sky = new THREE.Color(.012, .02, .035), haze = new THREE.Color(.16, .15, .13), stand = new THREE.Color(.05, .06, .06), grass = new THREE.Color(.035, .12, .05);
    for (let i = 0; i < P.count; i++){ const y = P.getY(i)/60;
      if (y < -.03) c.copy(grass); else if (y < .12) c.copy(stand).lerp(haze, (y + .03)/.15); else c.copy(haze).lerp(sky, Math.min(1, (y - .12)/.35));
      cl.push(c.r, c.g, c.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
    sc.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide})));
    // the floodlights: four bright banks high in the corners, and a long strip along each roof
    const fl = new THREE.MeshBasicMaterial({color:new THREE.Color(9, 8.6, 7.6)}), st = new THREE.MeshBasicMaterial({color:new THREE.Color(2.4, 2.3, 2.1)});
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz])=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), fl); m.position.set(sx*34, 26, sz*34); m.lookAt(0, 0, 0); sc.add(m); });
    [0, Math.PI/2, Math.PI, -Math.PI/2].forEach(a=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 1.2), st); m.position.set(Math.sin(a)*45, 17, Math.cos(a)*45); m.lookAt(0, 4, 0); sc.add(m); });
    const pm = new THREE.PMREMGenerator(r), env = pm.fromScene(sc, .035).texture; pm.dispose();
    sc.traverse(o=>{ if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    envs.set(r, env); return env;
  }
  // the night sky behind the stands: deep blue overhead to a haze over the roofs
  let skyTex = null;
  function skyFor(){ if (skyTex) return skyTex;
    const c = document.createElement("canvas"); c.width = 4; c.height = 256; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#03060C"); g.addColorStop(.55, "#0A1320"); g.addColorStop(.8, "#16212A"); g.addColorStop(1, "#0B1611"); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    skyTex = new THREE.CanvasTexture(c); skyTex.colorSpace = THREE.SRGBColorSpace; return skyTex; }
  // the grass: fine blades and patchy wear over the mown stripes (a texture that tiles every 4 m)
  let grassTex = null;
  function grassFor(){ if (grassTex) return grassTex;
    const N = 512, c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d");
    x.fillStyle = "#C9C9C9"; x.fillRect(0, 0, N, N);
    const R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(7);
    for (let i = 0; i < 220; i++){ const px = R()*N, py = R()*N, rr = 14 + R()*40, g2 = x.createRadialGradient(px, py, 0, px, py, rr), v = R() < .5 ? "255,255,255" : "40,40,40";
      g2.addColorStop(0, `rgba(${v},${(.02 + R()*.035).toFixed(3)})`); g2.addColorStop(1, `rgba(${v},0)`); x.fillStyle = g2;
      for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]){ x.save(); x.translate(ox, oy); x.fillRect(px - rr, py - rr, rr*2, rr*2); x.restore(); } }
    for (let i = 0; i < 26000; i++){ const px = R()*N, py = R()*N, l = 2 + R()*5, sh = R(); x.strokeStyle = sh < .55 ? `rgba(255,255,255,${(.06 + R()*.14).toFixed(2)})` : `rgba(20,40,10,${(.05 + R()*.12).toFixed(2)})`;
      x.lineWidth = .8 + R()*.6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (R() - .5)*1.6, py - l); x.stroke(); }
    grassTex = new THREE.CanvasTexture(c); grassTex.colorSpace = THREE.SRGBColorSpace; grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.anisotropy = 16; return grassTex; }
  const grassMat = (c2, wet) => { const k = "grass|" + c2 + (wet ? "|wet" : ""); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color:col(c2).multiplyScalar(wet ? .82 : 1), map:grassFor(), roughness:wet ? .72 : .92, envMapIntensity:wet ? .62 : .55})); return mats.get(k); };   // (wet: darker, with a sheen)
  const tileUV = (g, u, v) => { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i)*u, a.getY(i)*v); return g; };
  /* ---------- the picture: a broadcast look over the render ----------
     The scene's drawn into a high-range buffer (with its own antialiasing), then: bloom (the floodlights, the roof
     strips, white kit and the ball glow a little), a grade (cooler in the shadows, warmer in the highlights, a touch
     richer), a vignette and a fine grain, and the tone mapping. Older phones (lite) get the plain render */
  const posts = new WeakMap();
  const PV = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }";
  function postFor(r){
    if (posts.has(r)) return posts.get(r);
    const hf = {type:THREE.HalfFloatType, depthBuffer:false}, P = {
      rt:new THREE.WebGLRenderTarget(4, 4, {type:THREE.HalfFloatType, samples:4}), a:new THREE.WebGLRenderTarget(4, 4, hf), b:new THREE.WebGLRenderTarget(4, 4, hf),
      scene:new THREE.Scene(), cam:new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), w:0, h:0};
    P.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); P.quad.frustumCulled = false; P.scene.add(P.quad);
    P.bright = new THREE.ShaderMaterial({uniforms:{t:{value:null}}, vertexShader:PV, toneMapped:false, depthTest:false,
      fragmentShader:"uniform sampler2D t; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c*smoothstep(.7, 1.5, l), 1.); }"});
    // a soft copy of the whole picture, for the shallow focus on the far crowd
    P.c = new THREE.WebGLRenderTarget(4, 4, hf); P.d = new THREE.WebGLRenderTarget(4, 4, hf);
    P.copy = new THREE.ShaderMaterial({uniforms:{t:{value:null}}, vertexShader:PV, toneMapped:false, depthTest:false, fragmentShader:"uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb, 1.); }"});
    P.blur = new THREE.ShaderMaterial({uniforms:{t:{value:null}, d:{value:new THREE.Vector2()}}, vertexShader:PV, toneMapped:false, depthTest:false,
      fragmentShader:"uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb*.227; c += (texture2D(t, vUv + d*1.385).rgb + texture2D(t, vUv - d*1.385).rgb)*.316; c += (texture2D(t, vUv + d*3.231).rgb + texture2D(t, vUv - d*3.231).rgb)*.07; gl_FragColor = vec4(c, 1.); }"});
    P.final = new THREE.ShaderMaterial({uniforms:{t:{value:null}, b:{value:null}, s:{value:null}, time:{value:0}, bk:{value:.72}, dy:{value:0}}, vertexShader:PV, toneMapped:true, depthTest:false,
      fragmentShader:`uniform sampler2D t; uniform sampler2D b; uniform sampler2D s; uniform float time; uniform float bk; uniform float dy; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }
        void main(){
          vec2 e = (vUv - .5)*dot(vUv - .5, vUv - .5)*.012;                          // a little colour fringing towards the edges
          vec4 s0 = texture2D(t, vUv); s0.r = texture2D(t, vUv + e).r; s0.b = texture2D(t, vUv - e).b;
          float fo = smoothstep(.86, .99, vUv.y)*.85 + smoothstep(.07, 0., vUv.y)*.35;   // shallow focus: the far crowd soft
          s0.rgb = mix(s0.rgb, texture2D(s, vUv).rgb, fo);
          vec3 bl = texture2D(b, vUv).rgb*bk, c = s0.rgb + bl;
          float al = clamp(s0.a + dot(bl, vec3(.33)), 0., 1.);   // (the home card's drawn over the page: keep its see-through)
          float l = dot(c, vec3(.2126, .7152, .0722));
          c = mix(c, c*vec3(.9, 1., 1.12), (1. - smoothstep(0., .45, l))*mix(.6, .2, dy));    // cool shadows (less by day)
          c = mix(c, c*vec3(1.08, 1., .9), smoothstep(.3, 1.4, l)*.5);           // warm highlights
          c = mix(vec3(l), c, 1.14);                                              // richer colour
          c = pow(max(c, 0.), vec3(1.06));                                        // a little more contrast
          vec2 q = (vUv - .5)*vec2(1., 1.2); c *= 1. - dot(q, q)*mix(.75, .4, dy);   // vignette (lighter by day)
          gl_FragColor = vec4(max(c, 0.), al);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb += (hash(vUv*1031. + fract(time)*17.) - .5)*.022*al;   // grain
        }`});
    posts.set(r, P); return P;
  }
  function present(r, scene, cam){
    if (lite || !r.capabilities.isWebGL2){ r.render(scene, cam); return; }
    const P = postFor(r), w = r.domElement.width, h = r.domElement.height;
    if (w !== P.w || h !== P.h){ P.w = w; P.h = h; P.rt.setSize(w, h); P.a.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2)); P.b.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
      P.c.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1)); P.d.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1)); }
    const pass = (m, to) => { P.quad.material = m; r.setRenderTarget(to); r.render(P.scene, P.cam); };
    r.setRenderTarget(P.rt); r.render(scene, cam);
    P.bright.uniforms.t.value = P.rt.texture; pass(P.bright, P.a);
    const tx = 1/Math.max(1, w >> 2), ty = 1/Math.max(1, h >> 2);
    for (let i = 0; i < 2; i++){ P.blur.uniforms.t.value = P.a.texture; P.blur.uniforms.d.value.set(tx*(1 + i), 0); pass(P.blur, P.b);
      P.blur.uniforms.t.value = P.b.texture; P.blur.uniforms.d.value.set(0, ty*(1 + i)); pass(P.blur, P.a); }
    // the soft copy: half size, blurred both ways
    P.copy.uniforms.t.value = P.rt.texture; pass(P.copy, P.c);
    const hx = 1/Math.max(1, w >> 1), hy = 1/Math.max(1, h >> 1);
    P.blur.uniforms.t.value = P.c.texture; P.blur.uniforms.d.value.set(hx*1.5, 0); pass(P.blur, P.d);
    P.blur.uniforms.t.value = P.d.texture; P.blur.uniforms.d.value.set(0, hy*1.5); pass(P.blur, P.c);
    P.final.uniforms.t.value = P.rt.texture; P.final.uniforms.b.value = P.a.texture; P.final.uniforms.s.value = P.c.texture; P.final.uniforms.time.value = performance.now()/1000; P.final.uniforms.bk.value = scene.userData.day ? .38 : .72; P.final.uniforms.dy.value = scene.userData.day ? 1 : 0; r.toneMappingExposure = scene.userData.day ? 1.12 : 1;
    pass(P.final, null);
  }
  function lights(scene, o = {}){
    const env = !!scene.environment;
    scene.add(new THREE.HemisphereLight(o.day ? 0xCFE3FF : 0xD8E4FF, o.day ? 0x2C5A2A : 0x16301E, (o.hemi ?? 1.1)*(env ? (o.day ? .55 : .32) : 1)));
    const a = new THREE.DirectionalLight(o.day ? 0xFFF3DF : 0xFFE2BE, (o.key ?? 2.2)*(o.day ? 1.55 : 1.3)); if (o.day) a.position.copy(SUN()).multiplyScalar(12); else a.position.set(-4, 7, o.keyZ ?? -5); scene.add(a);
    // the main floodlight casts the shadows: of the players, the ball and the goal, round where the play is
    if (o.at && !lite){ const at = o.at, dir = a.position.clone().normalize(); a.target.position.copy(at); scene.add(a.target); a.position.copy(at).addScaledVector(dir, 40);
      a.castShadow = true; a.shadow.mapSize.set(2048, 2048); const sc = a.shadow.camera, z = o.size || 17; sc.left = -z; sc.right = z; sc.top = z; sc.bottom = -z; sc.near = 5; sc.far = 90; sc.updateProjectionMatrix();
      a.shadow.bias = -.0004; a.shadow.normalBias = .03; a.shadow.radius = 3; }
    const b = new THREE.DirectionalLight(0xDDE8FF, o.fill ?? .9); b.position.set(5, 5, 6); scene.add(b);
    const c = new THREE.DirectionalLight(0xFFE9B0, o.rim ?? 1.3); c.position.set(0, 4, -8); scene.add(c);
    // the floodlights behind the play: a cool edge of light round the players, the ball and the posts
    const rim = new THREE.DirectionalLight(0xBFD6FF, (env ? 2.4 : 1.2)*(o.day ? .35 : 1)); rim.position.set(6, 9, -14); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xFFD9A8, (env ? 1.4 : .7)*(o.day ? .3 : 1)); rim2.position.set(-9, 6, -10); scene.add(rim2);
  }
  // empty a scene, freeing what isn't shared (the shared geometries and materials stay for the next one)
  function clear(scene){
    const keepG = new Set(geos.values()), keepM = new Set(mats.values());
    scene.traverse(o=>{ if (o.geometry && !keepG.has(o.geometry)) o.geometry.dispose();
      if (o.material && !keepM.has(o.material)){ if (o.material.map && ![...crowdTexes.values()].includes(o.material.map) && o.material.map !== boardTex && o.material.map !== ballTex && o.material.map !== blobTex) o.material.map.dispose(); if (o.material.bumpMap === ballBump) o.material.bumpMap = null; o.material.dispose(); } });
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
      P.root.rotation.y = Math.PI + spin; pose(P, "idle", t);
      present(R, scene, cam); raf = requestAnimationFrame(frame);
    }
    function stop(){ if (raf) cancelAnimationFrame(raf); raf = 0; if (io){ io.disconnect(); io = null; } }
    function mount(el, pl, club){
      if (!el || !ready()) return false;
      if (!R){ R = makeRenderer(); scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(26, 1, .1, 50); }
      const k = JSON.stringify([pl.skin, pl.hair, pl.hairColour, pl.number, pl.name, club.c1, club.c2, !!people]);
      if (k !== key){ key = k; clear(scene); scene.environment = envFor(R); lights(scene, {key:2.4, keyZ:-6, rim:1.6});
        P = makePlayer(lookOf(pl, club.c1, club.c2)); (P.rig ? P.rig.shadow : P.shadow).visible = false; scene.add(P.root); }
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
  function pitch(scene, lines = true, wet = false){
    // mown stripes across the pitch, then the lines as thin strips
    const g1 = grassMat("#25703E", wet), g2 = grassMat("#34914F", wet), line = new THREE.MeshBasicMaterial({color:0xF2F5EF});
    const ground = new THREE.Mesh(tileUV(new THREE.PlaneGeometry(400, 400), 100, 100), g1); ground.rotation.x = -Math.PI/2; ground.position.set(0, -.01, 0); ground.receiveShadow = true; scene.add(ground);   // grass to the horizon
    const sg = geo("stripe", ()=>tileUV(new THREE.PlaneGeometry(120, 4), 30, 1));
    for (let i = -2; i < 20; i++){ const s = new THREE.Mesh(sg, i%2 ? g1 : g2); s.rotation.x = -Math.PI/2; s.position.set(0, 0, i*4 + 2); s.receiveShadow = true; scene.add(s); }
    // wear: the goalmouth and the penalty spot, scuffed and sandy where the play's been
    if (!mats.has("wear")){
      const N = 256, c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"), R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(23);
      for (let i = 0; i < 1400; i++){ const a = R()*Math.PI*2, rr = Math.pow(R(), .7)*N*.42, px = N/2 + Math.cos(a)*rr*1.05, py = N/2 + Math.sin(a)*rr, f = 1 - rr/(N*.42);
        x.fillStyle = R() < .25 ? `rgba(70,52,30,${(.2*f).toFixed(3)})` : `rgba(150,128,82,${(.17*f).toFixed(3)})`; x.beginPath(); x.ellipse(px, py, 2 + R()*7, 1.5 + R()*4, R()*3, 0, 7); x.fill(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      mats.set("wear", new THREE.MeshStandardMaterial({map:t, transparent:true, depthWrite:false, roughness:1, polygonOffset:true, polygonOffsetFactor:-2})); }
    [[0, 2.6, 8.5, 5.2], [0, 11, 2.4, 2.4], [0, .7, 5, 1.6]].forEach(([wx, wz, w, d])=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mats.get("wear")); m.rotation.x = -Math.PI/2; m.position.set(wx, .003, wz); m.receiveShadow = true; scene.add(m); });
    if (!lines) return;
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
    [-1, 1].forEach(s=>{ const p = new THREE.Mesh(pg, post); p.position.set(s*X, (H + r)/2, 0); p.castShadow = true; scene.add(p); });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2*X + 2*r, 16), post); bar.rotation.z = Math.PI/2; bar.position.set(0, H, 0); scene.add(bar);
    /* the net. The back is a stretchy sheet: a grid of knots, each pushed back by the ball and pulled by its
       neighbours (a wave on a membrane), held by the frame at its edges. The roof and the sides hang off it and
       move with its top and side edges. */
    const D = 1.9, Hb = H*.86, n = .14, NX = Math.round(2*X/n) + 1, NY = Math.round(Hb/n) + 1, dx = 2*X/(NX - 1), dy = Hb/(NY - 1);
    const h = new Float32Array(NX*NY), v = new Float32Array(NX*NY), at = (i, j) => j*NX + i;
    const pts = [], link = [];   // every vertex: [x, y, z] at rest, and how it follows the sheet
    const V = (x, y, z, l) => { pts.push(x, y, z); link.push(l); };
    // the back: rows and columns joining the knots
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX - 1; i++){ V(-X + i*dx, j*dy, -D, [1, at(i, j)]); V(-X + (i + 1)*dx, j*dy, -D, [1, at(i + 1, j)]); }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY - 1; j++){ V(-X + i*dx, j*dy, -D, [1, at(i, j)]); V(-X + i*dx, (j + 1)*dy, -D, [1, at(i, j + 1)]); }
    // the roof, sloping from the back's top edge up to the bar: it moves with the knot below it, less towards the bar
    const roofAt = (i, t) => [-X + i*dx, Hb + (H - Hb)*t, -D + (D - .25)*t];
    for (let i = 0; i < NX; i++) for (let k = 0; k < 6; k++){ const a = roofAt(i, k/6), b = roofAt(i, (k + 1)/6); V(...a, [2, at(i, NY - 2), 1 - k/6]); V(...b, [2, at(i, NY - 2), 1 - (k + 1)/6]); }
    for (let k = 0; k <= 6; k++) for (let i = 0; i < NX - 1; i++){ const t = k/6; V(...roofAt(i, t), [2, at(i, NY - 2), 1 - t]); V(...roofAt(i + 1, t), [2, at(i + 1, NY - 2), 1 - t]); }
    // the sides: they bow out with the knots next to the posts, more towards the back
    [-1, 1].forEach(s=>{ const ci = s < 0 ? 1 : NX - 2;
      const sideTop = z => z < .25 ? H : H - (H - Hb)*(z - .25)/(D - .25);
      for (let z = 0; z <= D + 1e-6; z += n){ const top = sideTop(z), rows = Math.max(1, Math.round(top/dy));
        for (let k = 0; k < rows; k++){ const y0 = top*k/rows, y1 = top*(k + 1)/rows; V(s*X, y0, -z, [3, at(ci, Math.min(NY - 2, Math.round(y0/dy))), z/D, s]); V(s*X, y1, -z, [3, at(ci, Math.min(NY - 2, Math.round(y1/dy))), z/D, s]); } }
      for (let y = 0; y <= H + 1e-6; y += n){ const zEnd = y > Hb ? .25 + (D - .25)*(H - y)/(H - Hb) : D, segs = 8;
        for (let k = 0; k < segs; k++){ const z0 = .02 + (zEnd - .02)*k/segs, z1 = .02 + (zEnd - .02)*(k + 1)/segs, jj = at(ci, Math.min(NY - 2, Math.round(y/dy)));
          V(s*X, y, -z0, [3, jj, z0/D, s]); V(s*X, y, -z1, [3, jj, z1/D, s]); } } });
    const base = Float32Array.from(pts), g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    // each knot lit by the floodlights: brighter where the net tilts up towards them, darker where it tilts away
    const cols = new Float32Array(pts.length).fill(.93); g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const lit = new Float32Array(NX*NY).fill(1), gxA = new Float32Array(NX*NY), gyA = new Float32Array(NX*NY);
    const net = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:0xFFFFFF, vertexColors:true, transparent:true, opacity:.6}));
    net.frustumCulled = false; scene.add(net);
    // the dark inside of the goal, well behind the net and drawn first, so the net never disappears into it
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(2*X + 1, Hb + .6), new THREE.MeshBasicMaterial({color:0x04100A, transparent:true, opacity:.4, depthWrite:false}));
    shade.position.set(0, Hb/2, -D - 1.4); shade.renderOrder = -1; scene.add(shade);
    let ball = null, live = 0, last = 0;
    const C2 = 15/(n*n), K = 12, DAMP = 2.3;   // wave speed squared over the knot spacing, a little spring back, and damping
    const step = dt => {
      for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++){ const k = at(i, j);
        // the top row is tied to the roof, which gives a little: it mirrors the row below
        const up = j + 1 < NY - 1 ? h[k + NX] : h[k]*.5;
        v[k] += (C2*(h[k - 1] + h[k + 1] + h[k - NX] + up - 4*h[k]) - K*h[k] - DAMP*v[k])*dt; }
      for (let k = 0; k < h.length; k++) h[k] += v[k]*dt;
      // where the ball is in the net, the net is where the ball is: pushed back around it
      if (ball){ const pen = -D - (ball.z - .11); if (pen > 0){ const R = .8;
        for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++){ const x = -X + i*dx, y = j*dy, d2 = ((x - ball.x)**2 + (y - ball.y)**2)/(R*R); if (d2 >= 1) continue;
          const want = pen*(1 - d2)*(1 - d2)*(1 - d2*.3); const k = at(i, j); if (h[k] < want){ v[k] = Math.min(v[k] + (want - h[k])/dt*.35, 6); h[k] += (want - h[k])*.6; } } } }
    };
    // a light smoothing pass, so the cloth never looks knotted
    const smooth = () => { for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++){ const k = at(i, j); h[k] += .12*((h[k - 1] + h[k + 1] + h[k - NX] + h[k + NX])/4 - h[k]); } };
    return {D,
      // the ball, while it's in the goal (null once it's done)
      touch(b){ ball = b; live = performance.now(); },
      update(now){
        const dt = Math.min(.033, last ? (now - last)/1000 : .016); last = now;
        if (!ball && now - live > 4500) return;   // settled: nothing to do
        for (let s = 0; s < 6; s++) step(dt/6);
        smooth();
        // the slope of the sheet at each knot: the cords sway across with it (that's what you see of a ripple from the
        // front), it draws the mesh in round the bulge, and it lights the knot
        for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++){ const k = at(i, j);
          const gx = gxA[k] = (h[k + 1] - h[k - 1])/(2*dx), gy = gyA[k] = (h[k + NX] - h[k - NX])/(2*dy);
          const b = (.6*gy + .8)/Math.sqrt(1 + gx*gx + gy*gy)/.8; lit[k] = Math.max(.4, Math.min(1.7, 1 + 2.4*(b - 1))); }
        const p = g.attributes.position.array, c = g.attributes.color.array, SW = .17;
        for (let q = 0; q < link.length; q++){ const L = link[q], o = q*3, k = L[1]; let d = 0, l = 1;
          if (L[0]===1){ d = h[k]; const sx = -gxA[k]*(SW + h[k]*.3), sy = -gyA[k]*(SW + h[k]*.3);
            p[o] = base[o] + Math.max(-.16, Math.min(.16, sx)); p[o + 1] = base[o + 1] + Math.max(-.16, Math.min(.16, sy)) - d*.1; p[o + 2] = base[o + 2] - d; l = lit[k]; }
          else if (L[0]===2){ d = h[k]*L[2]; p[o] = base[o] - gxA[k]*SW*L[2]*.6; p[o + 1] = base[o + 1] + d*.25; p[o + 2] = base[o + 2] - d*.85; l = 1 + (lit[k] - 1)*L[2]; }
          else { d = h[k]*L[2]; p[o] = base[o] + L[3]*d*.6; p[o + 1] = base[o + 1] - gyA[k]*SW*L[2]*.6; p[o + 2] = base[o + 2] - d*.3; l = 1 + (lit[k] - 1)*L[2]*.7; }
          c[o] = c[o + 1] = c[o + 2] = .93*l; }
        g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
      }};
  }
  let crowdTex = null, boardTex = null; const crowdTexes = new Map();   // (one crowd per pair of clubs' colours)
  function stands(scene, kc, day, ka){
    // the crowd: rows of fans on the steps, faces of every skin tone, shirts in the home colours, white, and everyday darks,
    // the odd scarf held up; the rows under the roof in its shadow
    const ck = kc + "|" + (ka || ""); crowdTex = crowdTexes.get(ck) || null;
    if (!crowdTex){ const c = document.createElement("canvas"); c.width = 2048; c.height = 512; const x = c.getContext("2d"); x.fillStyle = "#0A120E"; x.fillRect(0, 0, 2048, 512);
      const R = (a => () => (a = (a*16807) % 2147483647)/2147483647)(11), sk = ["#F1C9A5","#D9A37A","#B57D52","#8A5A3B","#5C3A24"], dk = ["#2B3440","#3A3F46","#1F2A33","#4B5563","#343434","#5B4636"];
      for (let row = 0; row < 16; row++){ const cy = 22 + row*30;
        x.fillStyle = "rgba(255,255,255,.035)"; x.fillRect(0, cy + 17, 2048, 4);   // the step
        for (let i = 0; i < 120; i++){ if (R() < .06) continue;   // an empty seat
          const away = ka && i < 30, team = away ? ka : kc;   // the away end: a block in their colours
          const cx = i*17.1 + (row%2)*8.5 + R()*4, r = R(), shirt = r < (away ? .5 : .34) ? team : r < .5 ? "#E8E8E4" : dk[Math.floor(R()*dk.length)];
          x.fillStyle = shirt; x.beginPath(); x.ellipse(cx, cy + 15, 7.5, 9, 0, Math.PI, 0); x.fill(); x.fillRect(cx - 7.5, cy + 14, 15, 9);
          x.fillStyle = sk[Math.floor(R()*sk.length)]; x.beginPath(); x.arc(cx, cy + 3, 5.2, 0, 7); x.fill();
          if (R() < .5){ x.fillStyle = R() < .7 ? "#17120E" : "#6B4A2B"; x.beginPath(); x.arc(cx, cy + 1.2, 5.3, Math.PI, 0); x.fill(); }   // hair
          if (R() < .07){ x.fillStyle = team; x.fillRect(cx - 9, cy - 9, 18, 4.5); x.fillStyle = "#F4F4F0"; x.fillRect(cx - 9, cy - 9, 4, 4.5); x.fillRect(cx + 1, cy - 9, 4, 4.5); }   // a scarf held up
        } }
      const sh = x.createLinearGradient(0, 0, 0, 512); sh.addColorStop(0, "rgba(0,0,0,.55)"); sh.addColorStop(.3, "rgba(0,0,0,.12)"); sh.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = sh; x.fillRect(0, 0, 2048, 512);
      crowdTex = new THREE.CanvasTexture(c); crowdTex.colorSpace = THREE.SRGBColorSpace; crowdTex.anisotropy = 4; crowdTexes.set(ck, crowdTex); }
    if (!boardTex){ const c = document.createElement("canvas"); c.width = 1024; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#0B1A12"; x.fillRect(0, 0, 1024, 64);
      x.font = "900 40px Big Shoulders Display, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      for (let i = 0; i < 6; i++){ x.fillStyle = i%2 ? "#F5C542" : "#7FD7C4"; x.fillText("PYRAMID", 85 + i*171, 34); }
      boardTex = new THREE.CanvasTexture(c); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.wrapS = THREE.RepeatWrapping; boardTex.repeat.x = 2; }
    // the stands all round: behind the goal and down both sides (so a replay from the side has a crowd behind it),
    // each a raked bank of fans over a strip of advertising boards
    const cm = new THREE.MeshBasicMaterial({map:crowdTex, color:day ? 0xE4E8E5 : 0xB4BCB7}), bm = new THREE.MeshBasicMaterial({map:boardTex}), crowd = [];
    const roofM = day ? mat("#7C848C", .7, {metal:.3}) : mat("#14191E", .7, {metal:.3}), wallM = day ? mat("#8A9097", .85) : mat("#1B2228", .85), lightM = day ? mat("#8E959C", .5, {metal:.5}) : new THREE.MeshBasicMaterial({color:new THREE.Color(2.2, 2.1, 1.85)});   // (the floodlights off by day)
    // a stand: the raked crowd over a concourse wall and the advertising boards, under a roof with a strip of floodlights along its edge
    const bank = (w, x, z, ry, d) => { const g = grp(x, 0, z); g.rotation.y = ry; g.userData.stand = true; scene.add(g);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(w, 20), cm); c.position.set(0, 11.2, -d); c.rotation.x = .22; g.add(c); crowd.push(c);
      const fw = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.8), wallM); fw.position.set(0, .9, -1.2); g.add(fw);
      // the front rows, between the wall behind the boards and the raked stand: fans, not bare concrete
      const dd = Math.max(.5, d - 10*Math.sin(.22) - 1.2), ft = crowdTex.clone(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(1, .18); ft.needsUpdate = true;
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(w, dd), new THREE.MeshBasicMaterial({map:ft, color:cm.color})); deck.rotation.x = -Math.PI/2 + .35; deck.position.set(0, 1.5, -1.2 - dd/2); g.add(deck);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 4, .35, 13), roofM); roof.position.set(0, 21.6, -d - 2.4); roof.rotation.x = -.08; g.add(roof);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w*.92, .28, .28), lightM); strip.position.set(0, 21.05, -d + 4); g.add(strip);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(w*.6, .9), bm); b.position.set(0, .45, 0); g.add(b); };
    // flags among the fans, in the clubs' colours (the away end's in theirs), waving (W animates crowd.flags)
    const flagTex = (c1) => { const k = "flag|" + c1; if (mats.has(k)) return mats.get(k); const c = document.createElement("canvas"); c.width = 128; c.height = 80; const x = c.getContext("2d");
      for (let i = 0; i < 4; i++){ x.fillStyle = i%2 ? "#F4F4F0" : c1; x.fillRect(i*32, 0, 32, 80); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({map:t, side:THREE.DoubleSide, roughness:.85}); mats.set(k, m); return m; };
    crowd.flags = [];
    const flag = (g, x, y, z, c1) => { const geo2 = new THREE.PlaneGeometry(1.7, 1.05, 10, 3), f = new THREE.Mesh(geo2, flagTex(c1)); f.position.set(x, y, z); g.add(f);
      f.userData.base = Float32Array.from(geo2.attributes.position.array); f.userData.ph = Math.random()*6; crowd.flags.push(f); };
    bank(80, 0, -5, 0, 6.5);   // (close to the pitch, like a modern ground: the fans right behind the boards)
    { const g = crowd[0].parent; [[-30, 4.2], [-22, 6.5], [-8, 3.6], [6, 7.2], [17, 4.6], [29, 6]].forEach(([fx, fy], i)=>flag(g, fx, fy, -6.5 + (fy - 11.2)/Math.cos(.22)*Math.sin(.22) + .6, ka && fx < -20 ? ka : kc)); }
    [-1, 1].forEach(s=>bank(66, s*36, 27, -s*Math.PI/2, 4.5));
    // the touchlines
    const tl = new THREE.MeshBasicMaterial({color:0xF2F5EF}); [-1, 1].forEach(s=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(.12, 58), tl); m.rotation.x = -Math.PI/2; m.position.set(s*34, .01, 29); scene.add(m); });
    // the floodlights' glow
    const gc = document.createElement("canvas"); gc.width = gc.height = 64; const gx2 = gc.getContext("2d"), gr = gx2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,248,222,1)"); gr.addColorStop(.25, "rgba(255,226,154,.45)"); gr.addColorStop(1, "rgba(255,226,154,0)"); gx2.fillStyle = gr; gx2.fillRect(0, 0, 64, 64);
    const gt = new THREE.CanvasTexture(gc);
    [-1, 1].forEach(s=>{ const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:gt, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending})); sp.position.set(s*24, 24, -22); sp.scale.set(16, 16, 1); sp.visible = !day; scene.add(sp);
      // the pylon under it, and its bank of lamps
      const py = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, 24, 8), wallM); py.position.set(s*24, 12, -22.5); py.userData.pylon = true; scene.add(py);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, .4), lightM); hd.position.set(s*24, 24, -22.2); hd.lookAt(0, 0, 8); hd.userData.pylon = true; scene.add(hd); sp.userData.pylon = true; });
    scene.fog = day ? new THREE.Fog(0xB4C6D6, 45, 150) : new THREE.Fog(0x0C1620, 34, 92);   // a haze over the far stands, for depth
    return crowd;
  }
  /* the ball: a modern six-panel match ball. Each panel's the face of a cube blown up into a sphere, so the seams are the
     curves where two faces meet; the panels are white with a sweep of gold or teal and a dark edge, and a bump map
     sinks the seams so they catch the light. Drawn once, in high resolution (lite: half) */
  let ballTex = null, ballBump = null;
  function ball(){
    if (!ballTex){
      const W2 = lite ? 512 : 1024, H2 = W2/2, c = document.createElement("canvas"), cb = document.createElement("canvas"); c.width = cb.width = W2; c.height = cb.height = H2;
      const x = c.getContext("2d"), xb = cb.getContext("2d"), im = x.createImageData(W2, H2), ib = xb.createImageData(W2, H2), d = im.data, db = ib.data;
      const acc = [[245, 197, 66], [36, 160, 150], [24, 38, 74], [245, 197, 66], [36, 160, 150], [24, 38, 74]];   // gold, teal and navy sweeps
      for (let j = 0; j < H2; j++){ const th = j/H2*Math.PI, st = Math.sin(th), ct = Math.cos(th);
        for (let i = 0; i < W2; i++){ const ph = i/W2*Math.PI*2, v = [-Math.cos(ph)*st, ct, Math.sin(ph)*st], a = v.map(Math.abs);
          const ax = a[0] > a[1] ? (a[0] > a[2] ? 0 : 2) : (a[1] > a[2] ? 1 : 2), face = ax*2 + (v[ax] > 0 ? 0 : 1);
          const o = [a[(ax + 1)%3], a[(ax + 2)%3]], m = a[ax], seam = m - Math.max(...o);   // how far from the nearest seam
          const u1 = v[(ax + 1)%3]/m, u2 = v[(ax + 2)%3]/m;   // where on the panel (-1 to 1 each way)
          let r = 247, g = 247, b = 244;
          const sw = Math.abs(u1*.7 + u2*.7 - .25*Math.sin(u2*3)), sweep = sw < .2 + .12*(1 - Math.abs(u1));   // a curved sweep across the panel
          if (sweep){ [r, g, b] = acc[face]; if (sw > .17 + .12*(1 - Math.abs(u1))){ r *= .55; g *= .55; b *= .55; } }   // (edged darker)
          if (seam < .035){ const k = seam/.035; r = r*(.35 + .65*k); g = g*(.35 + .65*k); b = b*(.38 + .62*k); }   // the seam, dark
          else if (seam < .06){ r *= .94; g *= .94; b *= .95; }
          const n = (Math.random() - .5)*6, p = (j*W2 + i)*4; d[p] = r + n; d[p + 1] = g + n; d[p + 2] = b + n; d[p + 3] = 255;
          const h = seam < .04 ? 255*(seam/.04)*.6 : 160 + (Math.random() - .5)*14; db[p] = db[p + 1] = db[p + 2] = h; db[p + 3] = 255; } }
      x.putImageData(im, 0, 0); xb.putImageData(ib, 0, 0);
      ballTex = new THREE.CanvasTexture(c); ballTex.colorSpace = THREE.SRGBColorSpace; ballTex.anisotropy = 8; ballBump = new THREE.CanvasTexture(cb); }
    const b = new THREE.Mesh(new THREE.SphereGeometry(.11, 40, 28), new THREE.MeshStandardMaterial({map:ballTex, bumpMap:ballBump, bumpScale:.0025, roughness:.34, envMapIntensity:1.2})); b.castShadow = true;
    return b;
  }
  /* the stadium for a shot or a save: the goal, the ball on its spot, the man taking it and the man in goal.
     role "shot": you take it (o.me) against their keeper (o.keeper); role "save": their striker (o.taker) against you (o.gk) */
  /* the stadium every 3D moment is played in: the pitch and its lines, the goal and its net, the crowd, the ball (on
     its spot at `ballAt`), the lights, the animation loop and the speed watch. Each moment adds its players and camera */
  function base(stage, o, ballAt){
    if (!SR){ SR = {r:makeRenderer(), scene:new THREE.Scene(), cam:new THREE.PerspectiveCamera(40, 300/180, .1, 160)}; }
    if (SR.cur){ SR.cur.stop(); SR.cur = null; }   // one scene at a time: the last one stops
    const day = typeof LV_DAY!=="undefined" && !!LV_DAY;   // an afternoon kick-off (moments.js), or under the floodlights
    const rain = typeof LV_RAIN!=="undefined" && !!LV_RAIN;   // and a wet one
    const {r, scene} = SR, cam = o.cam || SR.cam; clear(scene); scene.fog = null; scene.background = day ? (rain ? skyRain() : skyDay()) : skyFor(); scene.environment = day ? envDay(r) : envFor(r); scene.userData.day = day;
    if (cam.isPerspectiveCamera){ cam.far = 160; cam.aspect = 300/180; cam.clearViewOffset(); }
    lights(scene, {hemi:1.3, key:rain && day ? 1.1 : 2.3, keyZ:8, rim:.9, fill:1.1, at:o.focus || new THREE.Vector3(ballAt.x*.5, 0, ballAt.z*.5), size:o.shadowSize, day});
    pitch(scene, !o.noLines, rain); const net = goalFrame(scene); const LC = typeof LV_CROWD!=="undefined" ? LV_CROWD : null, crowd = stands(scene, o.crowd || (LC && LC[0]) || "#F5C542", day, o.crowdAway || (LC && LC[1]));
    const B = ball(); B.position.copy(ballAt); scene.add(B);
    const bs = blob(.36, .36); bs.position.set(ballAt.x, .006, ballAt.z); scene.add(bs);
    // a faint trail behind the ball, so you can follow it into the far corner
    const TN = 14, trailPos = new Float32Array(TN*3), trailG = new THREE.BufferGeometry(); trailG.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trail = new THREE.Line(trailG, new THREE.LineBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.5})); trail.visible = false; trail.frustumCulled = false; scene.add(trail);
    const trailPush = () => { if (!trail.visible){ for (let i = 0; i < TN; i++) trailPos.set([B.position.x, B.position.y, B.position.z], i*3); trail.visible = true; }
      trailPos.copyWithin(3, 0, (TN - 1)*3); trailPos[0] = B.position.x; trailPos[1] = B.position.y; trailPos[2] = B.position.z; trailG.attributes.position.needsUpdate = true; };
    const host = stage; host.classList.add("g3"); host.prepend(r.domElement); r._w = 0;
    const anims = new Set(); let t0 = performance.now(), raf = 0, stopped = false;
    const W = {r, scene, cam, B, bs, trail, trailPush, net, mode:"idle", t0, idle:null, dyn:[B, bs], rec:null, view:null, crowd}; SR.cur = W;
    // the rain: streaks falling past the camera, blown a little, around where the play is
    if (rain){ const RN = lite ? 450 : 1200, rp = new Float32Array(RN*6), rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
      const rl = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({color:0xC9D8E8, transparent:true, opacity:day ? .38 : .3, depthWrite:false})); rl.frustumCulled = false; scene.add(rl);
      const fc = o.focus || new THREE.Vector3(ballAt.x*.5, 0, ballAt.z*.5), drops = [];
      const seed = d => { d.x = fc.x + (Math.random() - .5)*30; d.z = fc.z + (Math.random() - .3)*34; return d; };
      for (let i = 0; i < RN; i++) drops.push(Object.assign(seed({}), {y:Math.random()*12, v:10 + Math.random()*3}));
      let rlast = performance.now();
      anims.add(now => { const dt = Math.min(.05, (now - rlast)/1000); rlast = now;
        drops.forEach((d, i)=>{ d.y -= d.v*dt; d.x += 1.4*dt; if (d.y < 0){ seed(d); d.y += 12; }
          rp[i*6] = d.x; rp[i*6 + 1] = d.y; rp[i*6 + 2] = d.z; rp[i*6 + 3] = d.x - .07; rp[i*6 + 4] = d.y + .55; rp[i*6 + 5] = d.z; });
        rg.attributes.position.needsUpdate = true; }); }
    // the ball's shadow follows it, smaller as it rises
    W.ballTo = (x, y, z) => { B.position.set(x, y, z); bs.position.set(x, .006, z); bs.scale.setScalar(Math.max(.3, 1 - y*.25)); };
    W.fadeTrail = () => W.tween(300, k=>{ trail.material.opacity = .5*(1 - k); }).then(()=>{ trail.visible = false; trail.material.opacity = .5; });
    // a point in the world, as a point of the stage (x 0-300, y 0-180), for the buttons and rings laid over the picture
    const pv = new THREE.Vector3();
    W.toStage = v => { cam.updateMatrixWorld(); pv.copy(v).project(cam); return [(pv.x + 1)/2*300, (1 - pv.y)/2*180]; };
    // watch how fast it draws: too slow, and drop the resolution; still too slow, and the next moments are 2D
    let nf = 0, last = 0, sum = 0, cnt = 0;
    const watch = now => { if (window.__g3full) return;   // (testing: keep full quality whatever the speed)
      if (last && ++nf > 4){ sum += now - last; cnt++;
        if (cnt >= 12){ const avg = sum/cnt; sum = cnt = 0;
          if (avg > 45){ goLite(); if (r.getPixelRatio() > 1){ r.setPixelRatio(1); r._w = 0; } else { slow = true; try{ sessionStorage.setItem("efp-3d-slow", "1"); }catch(e){} } } } }
      last = now; };
    const frame = now => {
      raf = 0; if (stopped) return; if (!r.domElement.isConnected){ W.stop(); return; }
      watch(now); if (fit(r, cam, host) && W.onFit) W.onFit();
      if (W.rec) poseLog = [];
      if (W.mode==="idle" && W.idle) W.idle((now - t0)/1000);
      anims.forEach(f=>f(now)); net.update(now);
      if (W.rec){ W.rec.push({t:now, o:W.dyn.map(o=>[o.position.clone(), o.quaternion.clone(), o.visible]), p:poseLog}); poseLog = null; }
      if (W.view) fit(r, W.view, host);
      present(r, scene, W.view || cam); raf = requestAnimationFrame(frame);
    };
    W.start = () => { try{ r.compile(scene, cam); }catch(e){} raf = requestAnimationFrame(frame); };
    W.stop = () => { if (stopped) return; stopped = true; if (raf) cancelAnimationFrame(raf); raf = 0; host.classList.remove("g3"); if (r.domElement.parentNode===host) r.domElement.remove(); if (SR.cur===W) SR.cur = null; };
    // an animation step run every frame for ms milliseconds (several can run at once)
    W.tween = (ms, f) => new Promise(res=>{ const a = performance.now(); const g = now=>{ const k = Math.min(1, Math.max(0, now - a)/ms); f(k); if (k>=1){ anims.delete(g); res(); } }; anims.add(g); if (stopped) res(); });
    // the ball into the net: it hits the back of the net, which stretches round it and throws it back out, and it drops
    W.inNet = async (spinAxis, speed) => { const p0 = B.position.clone(), back = -net.D + .11;
      net.touch(B.position); W.shake(.025, 260);
      const t1 = speed ? Math.max(60, Math.abs(back - p0.z)/speed) : Math.max(90, Math.abs(back - p0.z)*90);
      await W.tween(t1, k=>{ B.position.set(p0.x*(1 - .06*k), Math.max(.11, p0.y - .12*k*k), p0.z + (back - p0.z)*k); trailPush(); B.rotateOnAxis(spinAxis, -.25); });
      W.fadeTrail();
      const p1 = B.position.clone();
      await W.tween(230, k=>{ const e = 1 - Math.pow(1 - k, 3); B.position.set(p1.x, p1.y - .06*k, back - .45*e); B.rotateOnAxis(spinAxis, -.1*(1 - k)); });
      const p2 = B.position.clone();
      await W.tween(620, k=>{ const e = k*k*(3 - 2*k); B.position.set(p2.x, Math.max(.11, p2.y + .08*Math.sin(k*Math.PI) - (p2.y - .11)*k*k), p2.z + .7*e); });
      net.touch(null);
    };
    // a player standing in the scene: a holder for where he is and which way he faces, the body inside it free to tilt
    W.add = (look, x, z, face = 0) => { const P = makePlayer(look), h = grp(x, 0, z); h.rotation.y = face; h.add(P.root); scene.add(h); P.at = h; W.dyn.push(h, P.root); return P; };
    /* a goal: the scorer wheels away to celebrate, then a slow-motion replay of the recording from a second camera
       (from behind the goal, through the net), then back to him celebrating. It runs on behind the result card */
    // a jolt of the camera (the strike, the net bulging), dying away over ms
    W.shake = (amp, ms) => { const p0 = cam.position.clone(); return W.tween(ms, k=>{ const a = amp*(1 - k)*(1 - k); cam.position.set(p0.x + (Math.random() - .5)*a, p0.y + (Math.random() - .5)*a, p0.z); if (k >= 1) cam.position.copy(p0); }); };
    /* the ball loose (off the post, parried, past the post, off the wall): it moves under gravity from velocity v (m/s),
       bouncing and losing pace on the grass, rolling to a stop, spinning as it goes, and coming back off the boards */
    W.loose = (v, ms = 1300) => { const p = B.position, vel = v.clone(), ax = new THREE.Vector3(); let last = performance.now();
      return W.tween(ms, ()=>{ const now = performance.now(), dt = Math.min(.05, Math.max(0, (now - last)/1000)); last = now;
        vel.y -= 9.8*dt; p.addScaledVector(vel, dt);
        if (p.y < .11){ p.y = .11; if (vel.y < 0){ vel.y = -vel.y*.52; vel.x *= .85; vel.z *= .85; if (vel.y < .5) vel.y = 0; } }
        if (p.y <= .111 && vel.y===0){ const f = Math.pow(.3, dt); vel.x *= f; vel.z *= f; }   // rolling, slowing
        if (p.z < -4.85 && vel.z < 0 && p.y < .95){ p.z = -4.85; vel.z = -vel.z*.35; vel.x *= .7; }   // off the advertising boards
        const sp = Math.hypot(vel.x, vel.z); if (sp > .02){ ax.set(vel.z, 0, -vel.x).normalize(); B.rotateOnWorldAxis(ax, sp*dt/.11); }
        bs.position.set(p.x, .006, p.z); bs.scale.setScalar(Math.max(.3, 1 - (p.y - .11)*.25)); }); };
    /* a keeper coming down from his dive: a full-length one lands him on his side on the grass, a smaller one back on his
       feet; a ball he's held comes down with him */
    W.land = (K, kp, ball) => { const y0 = kp.position.y, r0 = kp.rotation.z, lying = Math.abs(r0) > .6 || y0 > 1.35, rT = lying ? Math.sign(r0 || 1)*1.45 : 0, yT = lying ? .32 : .94;
      if (Math.abs(y0 - yT) < .04 && Math.abs(r0 - rT) < .04) return Promise.resolve();
      const off = ball ? ball.position.clone().sub(kp.position) : null;
      return W.tween(lying ? 440 : 320, k=>{ const g = k*k; kp.position.y = y0 + (yT - y0)*g; kp.rotation.z = r0 + (rT - r0)*(1 - (1 - k)*(1 - k));
        if (off){ ball.position.copy(kp.position).add(off); bs.position.set(ball.position.x, .006, ball.position.z); } if (!lying && k > .5) pose(K, "ready", performance.now()/1000); }); };
    // a player eased out of whatever he was doing (a header, a strike) back to standing, over ms, then standing on
    const sq = new THREE.Quaternion();
    W.settle = (P, ms = 350, dur = 4000) => { const t1 = performance.now(), from = [];
      if (P.real) P.model.traverse(o=>{ if (o.isBone) from.push([o, o.quaternion.clone()]); });
      return W.tween(dur, ()=>{ const e = Math.min(1, (performance.now() - t1)/ms); pose(P, "idle", performance.now()/1000);
        if (e < 1 && from.length){ const s2 = e*e*(3 - 2*e); for (const [b, q] of from) b.quaternion.copy(sq.copy(q).slerp(b.quaternion, s2)); P.model.updateMatrixWorld(true); } }); };
    // the crowd on its feet: the banks bounce, fading out over ms
    W.roar = (ms, amp = .35) => { const y0 = crowd.map(c=>c.position.y); W.tween(ms, k=>crowd.forEach((c, i)=>{ c.position.y = y0[i] + amp*(1 - k)*Math.abs(Math.sin(k*ms/1000*7.5 + i)); })); };
    // the flags in the crowd, waving: a ripple running along each, bigger away from the pole
    if (crowd.flags && crowd.flags.length) anims.add(now => { const t = now/1000; crowd.flags.forEach(f=>{ const P = f.geometry.attributes.position, b = f.userData.base;
      for (let i = 0; i < P.count; i++){ const x = b[i*3], u = (x + .85)/1.7; P.setZ(i, Math.sin(x*3.2 - t*5.5 + f.userData.ph)*.16*u + Math.sin(t*2.1 + f.userData.ph)*.05*u); }
      P.needsUpdate = true; }); });
    W.goalShow = async (P, runTo, camAt, lookAt) => {
      const frames = W.takeRec(); if (stopped) return;
      W.roar(4200);
      const host0 = host, from = P.at ? P.at.position.clone() : P.root.position.clone(), obj = P.at || P.root;
      const yaw = Math.atan2(runTo.x - from.x, runTo.z - from.z), t1 = performance.now();
      const face = Math.atan2(cam.position.x - runTo.x, cam.position.z - runTo.z), turn = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a))*k;
      // how he celebrates: off to the crowd and a cheer, the aeroplane, or a knee slide
      const how = ["cheer", "plane", "slide"][Math.floor(Math.random()*3)];
      const run = W.tween(1300, k=>{ const e = how==="slide" ? Math.min(1, k*1.25)*(2 - Math.min(1, k*1.25)) : k*k*(3 - 2*k); obj.position.lerpVectors(from, runTo, e); obj.rotation.y = turn(yaw, face, Math.max(0, (k - .6)/.4));
        const t = (performance.now() - t1)/1000;
        if (how==="slide"){ if (k < .45) track(P, obj); else pose(P, "knees", Math.min(1, (k - .45)/.2)); }
        else if (how==="plane"){ if (k < .85) pose(P, "plane", t*1.6); else pose(P, "cheer", t); }
        else if (k < .75) track(P, obj); else pose(P, "cheer", t); });
      await run; if (stopped || frames.length < 4) return;
      await W.replay(frames, camAt, lookAt); if (stopped) return;
      W.mode = "goal";
      const t2 = performance.now(); W.tween(2600, ()=>{ if (how==="slide") pose(P, "knees", 1); else pose(P, "cheer", (performance.now() - t2)/1000); });
    };
    // the last moments recorded (W.rec), up to 2.6 s
    W.takeRec = () => { const all = W.rec || [], end = all.length ? all[all.length - 1].t : 0; W.rec = null; return all.filter(f=>f.t >= end - 2600); };
    // a near miss (off the woodwork, a great save): after a breath, the replay, then back to the live picture
    W.nearMiss = async (camAt, lookAt) => { const frames = W.takeRec(); W.roar(1400, .14); await W.tween(500, ()=>{}); if (stopped || frames.length < 4) return; await W.replay(frames, camAt, lookAt); };
    // the replay: everything put back as it was, frame by frame, at half speed, from camAt; then back as it is now
    W.replay = async (frames, camAt, lookAt) => {
      const host0 = host, live = W.dyn.map(o=>[o.position.clone(), o.quaternion.clone(), o.visible]), mode0 = W.mode;
      const rc = new THREE.PerspectiveCamera(40, 300/180, .1, 160); rc.position.copy(camAt); rc.lookAt(lookAt); W.view = rc; const tr = new THREE.Vector3(); W.mode = "replay";
      host0.insertAdjacentHTML("beforeend", `<span class="g3-replay" aria-hidden="true">Replay</span>`); const badge = host0.lastElementChild; host0.classList.add("g3-replaying");
      const t0r = frames[0].t, span = frames[frames.length - 1].t - t0r; net.touch(B.position);
      await W.tween(span*2, k=>{ const tt = t0r + span*k; let i = 0; while (i < frames.length - 1 && frames[i + 1].t <= tt) i++; const F = frames[i];
        F.o.forEach(([p, q, v], j)=>{ const o = W.dyn[j]; if (!o) return; o.position.copy(p); o.quaternion.copy(q); o.visible = v; });
        (F.p || []).forEach(([Q, n, a, b])=>{ if (Q.real) REAL[n](Q, a, b); else POSE[n](Q.rig, a, b); });
        rc.lookAt(tr.copy(lookAt).lerp(B.position, .45)); });   // the camera follows the ball
      net.touch(null); badge.remove(); host0.classList.remove("g3-replaying"); if (stopped) return;
      live.forEach(([p, q, v], j)=>{ const o = W.dyn[j]; o.position.copy(p); o.quaternion.copy(q); o.visible = v; });
      W.view = null; W.mode = mode0;
    };
    return W;
  }
  // the camera at `at`, tilted and zoomed so that point a lands fa of the way down the picture and point b lands fb down
  function frameCam(cam, at, a, fa, b, fb, x = 0){
    const ang = p => Math.atan2(at.y - p.y, Math.hypot(at.x - p.x, at.z - p.z));
    const aA = ang(a), aB = ang(b), FA = (fa - .5)*2, FB = (fb - .5)*2;
    let lo = aB + 1e-4, hi = aA - 1e-4; for (let i = 0; i < 50; i++){ const c = (lo + hi)/2, r0 = Math.tan(aA - c)/Math.tan(aB - c); if (r0 < FA/FB) lo = c; else hi = c; }
    const c = (lo + hi)/2, T = Math.tan(aA - c)/FA, dir = new THREE.Vector3(x - at.x, 0, (a.z + b.z)/2 - at.z).normalize();
    cam.fov = 2*Math.atan(T)*180/Math.PI; cam.position.copy(at); cam.lookAt(at.x + dir.x*10, at.y - Math.tan(c)*10, at.z + dir.z*10); cam.updateProjectionMatrix();
  }
  // a shot or a save: the ball on its spot, the man taking it, the man in goal (and a wall for free kicks).
  // role "shot": you take it (o.me) against their keeper (o.keeper); role "save": their striker (o.taker) against you (o.gk)
  function world(stage, o, role){
    const D = DIST[o.v] ?? 13, W = base(stage, o, new THREE.Vector3(0, .11, D)), {scene, cam} = W;
    // the taker: a step behind the ball and to its left, side-on to it
    const taker = makePlayer(role==="shot" ? o.me : o.taker); taker.root.position.set(-.72, 0, D + .62); taker.root.rotation.y = Math.PI + .3; scene.add(taker.root);
    // the keeper on his line (off it, one-on-one)
    const kz = o.v==="oneonone" ? 2.6 : o.v==="pen" ? .1 : .4;
    const kp = grp(0, .94, kz), K = makePlayer(role==="shot" ? o.keeper : o.gk); K.root.position.y = -.94; kp.add(K.root); scene.add(kp);
    const ks = blob(1, .7); ks.position.set(0, .006, kz); scene.add(ks);
    // a wall for free kicks, 9.15 m out
    if (o.v==="freekick") for (let i = 0; i < 4; i++){ const w = makePlayer(o.wall); w.root.position.set(-.75 + i*.5, 0, D - 9.15); scene.add(w.root); pose(w, "wall", i); }
    // the referee, off to one side, watching
    const ref = makePlayer({skin:["#8D5A3B", "#E0B590", "#C08368", "#5C3A26"][Math.floor(D)%4], c1:"#141414", c2:"#F5C542", shorts:"#141414", socks:"#141414", num:"", name:""});
    const rz = D - 5 > kz + 3 ? D - 5 : D + 1; ref.root.position.set(3.4, 0, rz); ref.root.rotation.y = Math.atan2(-3.4, D/2 - rz); scene.add(ref.root);
    // the camera: low behind the ball and dead centre (the ball where your finger goes), so the taker sits below the goal and both corners are clear;
    // the ball where your finger goes (92% down), just over the bar 13% down
    frameCam(cam, new THREE.Vector3(0, 2.05, D + 4.4), new THREE.Vector3(0, .11, D), .922, new THREE.Vector3(0, 2.75, 0), .13);
    Object.assign(W, {taker, K, kp, ks, kz, D});
    // how far his hands reach above his hips, arms up in a dive (measured on him: everyone's built a little differently)
    W.reach = reachOf(K, kp);
    // the keeper reads you as you line it up: a shuffle across his line towards where you're aiming
    W.kshift = 0;
    W.idle = t => { pose(taker, "idle", t); pose(ref, "idle", t + 2.3);
      const dx = W.kshift - kp.position.x; if (Math.abs(dx) > .01){ kp.position.x += Math.sign(dx)*Math.min(Math.abs(dx), .025); ks.position.x = kp.position.x; }
      pose(K, "ready", t + (Math.abs(dx) > .03 ? t*1.5 : 0)); };
    W.start();
    return W;
  }
  const ease = k => 1 - Math.pow(1 - k, 2);
  // a struck ball through the air: barely slowing (it keeps 85% of its pace to the end), so it carries on into the net
  const glide = k => k*(1.15 - .15*k);
  // a point of the 2D goal (x 30-270 post to post, y 20 bar to 124 line) in the 3D goal mouth
  const kTarget = (kx, ky) => new THREE.Vector3(gx(kx), Math.max(.55, gy(ky)), 0);
  /* the keeper getting his hands to P (a point on his line): which way he goes (sideways, a full-length dive with his
     arms past his head; up, a leap; low and central, a crouch with the hands down), and where his hips must be for his
     hands (reach above the hips, arms up) to land on it. Returns {at: his hips, roll, k: how far into the dive pose} */
  function reachFor(P, reach){
    // (from a crouch to a full dive, smoothly, the further out or higher it is)
    const sd = Math.max(Math.min(1, Math.max(0, (Math.abs(P.x) - .3)/.5)), Math.min(1, Math.max(0, (P.y - 1.5)/.4))), ang = Math.atan2(P.x, Math.max(.15, P.y - .2));
    const roll = -ang*(.35 + .6*sd), L = reach*(.4 + .6*sd), k = .35 + .65*sd;
    const at = new THREE.Vector3(P.x + Math.sin(roll)*L, P.y - Math.cos(roll)*L, P.z);
    at.y = Math.max(.3 + .6*Math.abs(Math.cos(roll)), Math.min(1.7, at.y));   // (upright, his feet stay on the grass)
    return {at, roll, k};
  }
  // how far a keeper's hands reach above his hips, arms up in a dive (measured on him: everyone's built a little differently)
  function reachOf(K, kp){ const r0 = kp.rotation.z; kp.rotation.z = 0; pose(K, "dive", 1); kp.updateMatrixWorld(true); const h = new THREE.Vector3(), c = new THREE.Vector3(); kp.getWorldPosition(c);
    const hs = K.real ? [K.bones.L_Hand, K.bones.R_Hand].filter(Boolean) : []; let y = 1.1;
    if (hs.length){ y = 0; hs.forEach(b=>{ b.getWorldPosition(h); y += (h.y - c.y)/hs.length; }); }
    kp.rotation.z = r0; pose(K, "ready", 0); return Math.max(.8, Math.min(1.4, y)); }
  // where his hands are, with his hips at c and that lean
  const handsAt = (c, roll, L) => new THREE.Vector3(c.x - Math.sin(roll)*L, c.y + Math.cos(roll)*L, c.z);

  /* your shot. play(q) takes the 2D shot's numbers {wx, ty, ms, h, curve, kx, ky, rot, kms, goal, over, wide, wood, wall}
     and plays the strike, the flight, the keeper and what happens next */
  function shot(stage, o){
    if (!stage || !fast()) return null;
    const W = world(stage, o, "shot"), {B, bs, taker, K, kp, ks, kz, D, cam} = W;
    const aimG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, .02, D), new THREE.Vector3(0, .02, 0)]);
    const aimL = new THREE.Line(aimG, new THREE.LineDashedMaterial({color:0xF5C542, dashSize:.5, gapSize:.35, transparent:true, opacity:.85, depthTest:false}));
    aimL.visible = false; aimL.renderOrder = 5; W.scene.add(aimL);
    const aimM = new THREE.Mesh(new THREE.RingGeometry(.16, .26, 3), new THREE.MeshBasicMaterial({color:0xF5C542, transparent:true, opacity:.9, depthTest:false}));
    aimM.rotation.x = -Math.PI/2; aimM.visible = false; aimM.renderOrder = 5; W.scene.add(aimM);
    function aim(x){ const ax = gx(x), P = aimG.attributes.position; W.kshift = Math.max(-.45, Math.min(.45, ax*.12)); P.setXYZ(1, ax, .02, 0); P.needsUpdate = true; aimL.computeLineDistances(); aimL.visible = true; aimM.position.set(ax, .03, .3); aimM.visible = true; }
    W.dyn.push(taker.root, kp);
    async function play(q){
      W.rec = []; W.mode = "shoot"; W.tween(250, k=>{ aimL.material.opacity = .85*(1 - k); aimM.material.opacity = .9*(1 - k); }).then(()=>{ aimL.visible = aimM.visible = false; });
      // the harder the strike, the quicker the leg comes through
      const sw = clamp(300 - (q.power ?? .7)*120, 170, 300);
      await W.tween(sw, k=>{ pose(taker, "kick", k*.55); pose(K, "ready", (performance.now() - W.t0)/1000); });
      W.shake(.03 + (q.power ?? .7)*.02, 170);   // contact
      const tgt = new THREE.Vector3(gx(q.wx), Math.max(.11, gy(q.ty)), 0);
      if (q.wall) tgt.set(gx(q.wx), 1.2, D - 9.15 + .35);
      if (q.saved) tgt.z = kz + .3;   // saved: it meets his hands in front of the line, not the goal behind him
      const from = B.position.clone(), arcH = (q.h || 0)/104*2.44, cv = (q.curve || 0)/120*3.66;
      let kTo = kTarget(q.kx, q.ky).setZ(kz), roll = -(q.rot || 0)*Math.PI/180, dk = Math.abs(roll) > .2 ? 1 : .4;
      if (q.saved){ const R = reachFor(new THREE.Vector3(tgt.x, tgt.y, kz), W.reach); kTo = R.at; roll = R.roll; dk = R.k; }   // a save: his hands meet it
      else if (q.goal){ const hd = handsAt(kTo, roll, dk > .5 ? W.reach : W.reach*.4), gap = Math.hypot(hd.x - tgt.x, hd.y - tgt.y);   // a goal: it beats his hands
        if (gap < .6) kTo.x += (Math.sign(hd.x - tgt.x) || -Math.sign(tgt.x) || 1)*(.6 - gap); }
      const kFrom = kp.position.clone(), fov0 = cam.fov;
      const spinAxis = new THREE.Vector3(1, q.curve ? -.4*Math.sign(q.curve) : 0, 0).normalize();
      await Promise.all([
        W.tween(sw*1.05, k=>pose(taker, "kick", .55 + .45*k)),
        W.tween(q.ms, k=>{ const e = glide(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e) + (q.swerve || 0)*.32*Math.sin(3*Math.PI*e)*4*e*(1 - e), from.y + (tgt.y - from.y)*e + arcH*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); W.trailPush(); bs.position.set(B.position.x, .006, B.position.z); bs.scale.setScalar(Math.max(.3, 1 - B.position.y*.25));
          cam.fov = fov0 - 3*e; cam.updateProjectionMatrix(); }),   // a slight zoom as it flies
        W.tween(q.kms, k=>{ const e = ease(Math.max(0, (k - .14)/.86)); kp.position.lerpVectors(kFrom, kTo, e); kp.position.y -= .09*Math.sin(Math.min(1, k/.3)*Math.PI);   // a dip to set himself, then he goes
          kp.rotation.z = roll*e; pose(K, "dive", e*dk); ks.position.x = kp.position.x; })
      ]);
      const p0 = B.position.clone(), vin = tgt.clone().sub(from).multiplyScalar(.85*1000/q.ms), fade = () => W.tween(300, k=>{ W.trail.material.opacity = .5*(1 - k); }).then(()=>{ W.trail.visible = false; });
      if (!q.goal) W.settle(taker, 450);   // no goal: he comes out of the follow-through and stands
      if (q.goal){
        W.mode = "goal"; W.land(K, kp);
        await W.inNet(spinAxis, .85*from.distanceTo(tgt)/q.ms);
        W.goalShow(taker, new THREE.Vector3(-2.3, 0, D - 2), new THREE.Vector3(-7, 3.4, D + (D > 16 ? 6 : 8)), new THREE.Vector3(0, .9, D*.3));
      } else if (q.over || q.wide){ W.rec = null; fade(); W.land(K, kp);
        await W.loose(vin.clone().setY(q.over ? Math.max(1.5, vin.y) : vin.y), 1200);   // on past the goal, onto the boards
      } else if (q.wood){ fade();
        // off the woodwork: the bar knocks it down and back out, a post back across the face of goal
        const bar = p0.y > 2.2, rb = vin.clone(); if (bar){ rb.y = -Math.abs(rb.y)*.5 - 1; rb.z = -rb.z*.45; } else { rb.x = -rb.x*.6 - Math.sign(p0.x || 1)*1.5; rb.z = -rb.z*.4; rb.y = Math.max(rb.y, .8); }
        await W.loose(rb, 1300);
        W.nearMiss(new THREE.Vector3(-7, 3.4, D + (D > 16 ? 6 : 8)), new THREE.Vector3(0, .9, D*.3));   // so close: see it again
      } else if (q.wall){ fade();
        await W.loose(new THREE.Vector3(vin.x*.3 + (Math.random() - .5)*2, 2.2 + Math.random(), -vin.z*.3), 1200);   // off the wall and away
      } else if (q.held){ fade();   // held: into his chest, and he keeps it
        await W.tween(240, k=>{ const e = ease(k); B.position.set(p0.x + (kp.position.x - p0.x)*e*.85, p0.y + (kp.position.y + .15 - p0.y)*e*.85, p0.z + .1*e); bs.position.set(B.position.x, .006, B.position.z); });
        await W.land(K, kp, B);
      } else { fade(); W.land(K, kp);   // parried: pushed away, out and wide
        await W.loose(new THREE.Vector3(Math.sign(p0.x || 1)*(4 + Math.random()*2), 1.6 + p0.y*.5, 3 + Math.random()*1.5), 1300);
        if (Math.abs(p0.x) > 1.6) W.nearMiss(new THREE.Vector3(Math.sign(p0.x)*6, 2.2, -2.6), new THREE.Vector3(p0.x*.3, 1, D*.35));   // a flying save: see it again, from beside the goal
      }
    }
    /* 2D's goal view mapped onto this one, for a game that takes taps or swipes on it (bend it): 2D's goal (x 30-270 post
       to post, y 20 bar to 124 line) is the goal; below it, 2D's grass out to the ball (y 166) is the grass out to the
       ball here (2D draws the near end bigger: the ball's 1, the goal's .6) */
    const rc = new THREE.Raycaster(), pv = new THREE.Vector3(), gp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), gl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const near = t => .6/(.6 + .4*t);
    const map = {
      fwd(x, y){ let v; if (y <= 124) v = new THREE.Vector3(gx(x), gy(y), 0); else { const t = Math.min(1.3, (y - 124)/42); v = new THREE.Vector3(gx(x)*near(t), 0, t*D); }
        cam.updateMatrixWorld(); v.project(cam); return [(v.x + 1)*150, (1 - v.y)*90]; },
      inv(x, y){ cam.updateMatrixWorld(); rc.setFromCamera(new THREE.Vector2(x/150 - 1, 1 - y/90), cam);
        if (rc.ray.direction.y < 0 && rc.ray.intersectPlane(gp, pv) && pv.z > 0){ const t = pv.z/D; return [150 + pv.x/near(t)/3.66*120, 124 + 42*t]; }
        return rc.ray.intersectPlane(gl, pv) ? [150 + pv.x/3.66*120, 124 - pv.y/2.44*104] : [x, y]; }};
    return {play, aim, stop:W.stop, map};
  }

  /* you in goal: their striker runs up and shoots; you dive.
     runup(ms) brings him in; release(x, y, curl, ms) is his shot to that point of the 2D goal; dive(x, y, rot, ms) is you;
     finish(saved) is the ball in your gloves, or in the net */
  function save(stage, o){
    if (!stage || !fast()) return null;
    const W = world(stage, o, "save"), {B, bs, taker, K, kp, ks, kz, D} = W;
    // he starts further back for his run-up
    const start = new THREE.Vector3(-1.5, 0, D + 2.6), plant = taker.root.position.clone(); taker.root.position.copy(start);
    let flying = null, spinAxis = new THREE.Vector3(1, 0, 0), released = false, flySpeed = 0;
    const rc = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -kz), hitP = new THREE.Vector3();
    return {
      stop:W.stop,
      // a tap on the picture, as a point of the 2D goal (x 30-270 post to post, y 20 bar to 124 line)
      toGoal(cx, cy){ const r = W.r.domElement.getBoundingClientRect(); rc.setFromCamera(new THREE.Vector2((cx - r.left)/r.width*2 - 1, -(cy - r.top)/r.height*2 + 1), W.cam);
        return rc.ray.intersectPlane(plane, hitP) ? [150 + hitP.x/3.66*120, 124 - hitP.y/2.44*104] : null; },
      runup(ms){ W.mode = "run"; const t1 = performance.now();
        W.tween(Math.max(300, ms - 200), k=>{ const e = k*k*(3 - 2*k); taker.root.position.lerpVectors(start, plant, e); track(taker, taker.root); pose(K, "ready", (performance.now() - W.t0)/1000); }); },
      release(x, y, curl, ms){
        if (released) return; released = true; W.mode = "shoot";
        const tgt = new THREE.Vector3(gx(x), Math.max(.11, gy(y)), 0), from = B.position.clone(), cv = (curl || 0)/120*3.66;
        spinAxis = new THREE.Vector3(1, curl ? -.4*Math.sign(curl) : 0, 0).normalize();
        W.tween(200, k=>pose(taker, "kick", .45 + .55*k));
        flySpeed = .85*from.distanceTo(tgt)/ms; flying = W.tween(ms, k=>{ const e = glide(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e), from.y + (tgt.y - from.y)*e + .25*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); W.trailPush(); bs.position.set(B.position.x, .006, B.position.z); });
        return flying;
      },
      // your dive: your hands go where you tapped (as far as you can reach)
      dive(x, y, rot, ms){
        const R = reachFor(new THREE.Vector3(gx(x), Math.max(.15, gy(y)), kz), W.reach), kFrom = kp.position.clone(), r0 = kp.rotation.z;
        return W.tween(ms, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, R.at, e); kp.rotation.z = r0 + (R.roll - r0)*e; pose(K, "dive", e*R.k); ks.position.x = kp.position.x; });
      },
      async finish(saved, post){
        if (flying) await flying;
        const p0 = B.position.clone();
        if (post){   // off the post and away
          W.tween(300, k=>{ W.trail.material.opacity = .5*(1 - k); }).then(()=>{ W.trail.visible = false; });
          const sx = p0.x < 0 ? -1 : 1, at = new THREE.Vector3(sx*3.6, Math.min(2.2, Math.max(.4, p0.y)), 0);
          await W.tween(120, k=>B.position.lerpVectors(p0, at, k));
          await W.tween(420, k=>{ B.position.set(at.x - sx*1.4*ease(k), Math.max(.11, at.y + .3*k - 1.6*k*k), at.z + 3*ease(k)); });
        } else if (saved){   // held, or pushed round the post
          W.tween(300, k=>{ W.trail.material.opacity = .5*(1 - k); }).then(()=>{ W.trail.visible = false; });
          // the last stretch: his hands onto the ball, and the ball into them
          const R = reachFor(new THREE.Vector3(p0.x, p0.y, kz), W.reach), k0 = kp.position.clone(), r0 = kp.rotation.z, hand = new THREE.Vector3();
          await W.tween(200, k=>{ const e = ease(k); kp.position.lerpVectors(k0, R.at, e); kp.rotation.z = r0 + (R.roll - r0)*e; pose(K, "dive", R.k); kp.updateMatrixWorld(true);
            (K.real ? K.bones[(p0.x < 0 ? "L" : "R") + "_Hand"] : K.rig.elbow[p0.x < 0 ? -1 : 1]).getWorldPosition(hand); B.position.lerpVectors(p0, hand.add(new THREE.Vector3(0, 0, .12)), e); });
          await W.land(K, kp, B);
        } else { W.land(K, kp); await W.inNet(spinAxis, flySpeed); }
      }
    };
  }


  /* ---------- level 2: headers, tackles and blocks, crosses ---------- */
  let spinX0 = null; const SX = () => spinX0 ||= new THREE.Vector3(1, 0, 0);
  // a ball's flight from a to b over ms, rising h at the top of the arc
  const flight = (W, a, b, ms, h, after) => W.tween(ms, k=>{ const e = k; W.ballTo(a.x + (b.x - a.x)*e, Math.max(.11, a.y + (b.y - a.y)*e + h*4*e*(1 - e)), a.z + (b.z - a.z)*e); W.B.rotateOnAxis(SX(), -.3); W.trailPush(); after && after(k); });

  /* a header (or, with o.volley, a volley) as 2D plays it: a ring closes on the spot where you meet the ball, and you
     tap as it gets there. The camera's behind you, the goal ahead, so the ball comes in to where the ring is */
  function header(stage, o){
    if (!stage || !fast()) return null;
    const V = !!o.volley;
    // where you meet it: your head (a cross from near the byline on the right), or your right boot (a dropping ball)
    const H = V ? new THREE.Vector3(-.4, .5, 9.3) : new THREE.Vector3(-1.1, 2.05, 7.2), start = V ? new THREE.Vector3(H.x + 5*(o.from || 1), 0, 6.8) : new THREE.Vector3(7.2, .11, 3.6);
    const W = base(stage, o, start), {cam} = W;
    const me = V ? W.add(o.me, H.x - .22, H.z + .5, Math.PI) : W.add(o.me, H.x, H.z + .35, Math.PI), mk = V ? W.add(o.marker, H.x - 1.5, H.z - 1.7, -.5) : W.add(o.marker, H.x + .6, H.z - .25, Math.PI + .5);   // the man marking you, goal-side
    const crosser = W.add(o.crosser, V ? 9 : start.x + .45, V ? 3 : start.z - .35, -Math.PI/2 + .35); if (V) crosser.at.visible = false;
    const kz = .5, kp = grp(0, .94, kz), K = makePlayer(o.keeper); K.root.position.y = -.94; kp.add(K.root); W.scene.add(kp); W.dyn.push(kp); const reach = reachOf(K, kp);
    // the camera: over your shoulder, the goal ahead
    cam.fov = 42; if (V){ cam.position.set(.6, 1.95, 13.1); cam.lookAt(-.3, 1.05, 3); } else { cam.position.set(.4, 2.6, 12.4); cam.lookAt(-.5, 1.5, 3); } cam.updateProjectionMatrix();
    W.idle = t => { pose(me, "idle", t); pose(mk, "idle", t + 1); pose(crosser, "idle", t + 2); pose(K, "ready", t); };
    W.start();
    let kicked = false;
    return {stop:W.stop, at:W.toStage(H),
      // the cross on its way: 0 when it's struck, 1 when it reaches you
      k(k){ if (!kicked && k > 0){ kicked = true; W.rec = []; if (!V) W.tween(220, q=>pose(crosser, "kick", .45 + .55*q)); }
        const e = Math.min(1.15, k);
        // the volley: k is 2D's drop (its height 120(1 - k²), met at 18, when k is .922), the ball in over your boot then
        if (V){ const f = Math.min(1.08, k/.922), z2 = 120*(1 - k*k); W.ballTo(start.x + (H.x - start.x)*f, Math.max(.11, H.y*z2/18), start.z + (H.z - start.z)*f); }
        else W.ballTo(start.x + (H.x - start.x)*e, Math.max(.11, start.y + (H.y - start.y)*e + 1.6*Math.sin(Math.min(1, e)*Math.PI)), start.z + (H.z - start.z)*e);
        W.B.rotateOnAxis(SX(), -.2); W.trailPush(); },
      // you meet it (on: you got your head to it); q has the 2D goal's numbers for where it goes and where the keeper goes
      async finish(q){
        W.mode = "play";
        const jump = V ? W.tween(240, k=>pose(me, "kick", .45 + .55*k)) : W.tween(260, k=>{ me.at.position.y = Math.sin(k*Math.PI)*.42; pose(me, "header", k); });
        if (!q.goal) W.rec = null;
        const settle = () => { me.at.position.y = 0; W.settle(me); };   // and back on his feet
        if (!q.on){ await jump; settle(); await flight(W, W.B.position.clone(), new THREE.Vector3(H.x - 3, 3.4, H.z - 12), 520, .6); W.fadeTrail(); return; }
        const tgt = new THREE.Vector3(gx(q.tx), Math.max(.11, gy(q.ty)), q.ty < 18 ? -3 : 0);
        let kTo = new THREE.Vector3(gx(q.kx), Math.max(.55, gy(q.ky)), kz), roll = -(q.rot || 0)*Math.PI/180, dk = Math.abs(roll) > .2 ? 1 : .4;
        if (!q.goal && tgt.z===0){ const R = reachFor(new THREE.Vector3(tgt.x, tgt.y, kz), reach); kTo = R.at; roll = R.roll; dk = R.k; tgt.z = kz + .3; }   // saved: his hands meet it
        else if (q.goal){ const hd = handsAt(kTo, roll, dk > .5 ? reach : reach*.4), gap = Math.hypot(hd.x - tgt.x, hd.y - tgt.y); if (gap < .6) kTo.x += (Math.sign(hd.x - tgt.x) || 1)*(.6 - gap); }
        const kFrom = kp.position.clone();
        await Promise.all([jump, flight(W, W.B.position.clone(), tgt, 380, .15),
          W.tween(330, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; pose(K, "dive", e*dk); })]);
        if (q.goal){ await W.inNet(SX()); W.goalShow(me, new THREE.Vector3(-3.6, 0, 10.2), new THREE.Vector3(-9, 3.6, 13.5), new THREE.Vector3(0, 1.1, 3.5)); }
        else { settle(); W.fadeTrail(); const p0 = W.B.position.clone(); await W.tween(420, k=>W.ballTo(p0.x + Math.sign(p0.x || 1)*1.4*ease(k), Math.max(.11, p0.y + .2*k - 1.2*k*k), p0.z + 1.4*ease(k))); }
      }};
  }

  /* a tackle (or a block): their man runs at you, or their shot comes at you; you go to ground when he's in the green.
     p(p) moves him (0 far away, 1 past you); the green is where p is between zone[0] and zone[1] */
  function tackle(stage, o){
    if (!stage || !fast()) return null;
    const Zme = 44, Z = p => 31 + p*(Zme - .9 - 31)/o.mid, block = o.block;
    const W = base(stage, o, new THREE.Vector3(.3, .11, Z(0))), {cam, scene} = W;
    const me = W.add(o.me, 0, Zme, Math.PI), them = W.add(o.them, .3, Z(-.1), 0);
    // the green: a band across his path
    const z0 = Z(o.zone[0]), z1 = Z(o.zone[1]);
    const band = new THREE.Mesh(new THREE.PlaneGeometry(3.4, Math.abs(z1 - z0)), new THREE.MeshBasicMaterial({color:0x4ADE80, transparent:true, opacity:.28, depthWrite:false}));
    band.rotation.x = -Math.PI/2; band.position.set(.2, .02, (z0 + z1)/2); scene.add(band);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(band.geometry), new THREE.LineBasicMaterial({color:0x4ADE80})); edge.rotation.x = -Math.PI/2; edge.position.copy(band.position); edge.position.y = .025; scene.add(edge);
    cam.fov = 44; cam.position.set(1.5, 3.3, Zme + 6.4); cam.lookAt(.2, .45, Zme - 7); cam.updateProjectionMatrix();
    W.idle = t => { pose(me, "ready", t); if (block) pose(them, "idle", t); };
    W.start();
    let p = -.1, struck = false;
    const place = () => {
      if (block){ // the shot: struck from 20 yards, low and hard at you
        if (p > -.05 && !struck){ struck = true; W.tween(200, k=>pose(them, "kick", .45 + .55*k)); }
        them.at.position.z = Z(-.05) - .6; W.ballTo(.3 - p*.3, .11 + Math.max(0, p)*.45, Z(p));
      } else {   // he dribbles at you, the ball a stride ahead
        them.at.position.z = Z(p); track(them, them.at);
        W.ballTo(.3, .11 + Math.abs(Math.sin(p*40))*.04, Z(p) + .55);
      }
      W.B.rotateOnAxis(SX(), .25);
    };
    place();
    return {stop:W.stop,
      p(v){ p = v; place(); },
      // you go to ground: won (ok), a foul, or he gets past (or the shot does)
      async go(q){
        W.mode = "play";
        // a slide, feet first towards him, leaning back on an arm
        const zt = clamp(Z(Math.min(p, 1)) + .9, Zme - 2.4, Zme - .6), z0m = me.at.position.z, tilt = .95;
        const slide = W.tween(320, k=>{ const e = ease(k); me.at.position.z = z0m + (zt - z0m)*e; me.root.rotation.x = -tilt*e; me.root.position.y = -.12*e; pose(me, "slide", e); });
        if (q.ok){ await slide; const p0 = W.B.position.clone();
          await flight(W, p0, new THREE.Vector3(p0.x + (block ? -4 : 5), block ? 3.5 : .11, p0.z + (block ? -6 : 1.5)), 420, block ? 1 : .6); W.fadeTrail(); return; }
        if (q.foul){ await slide; const zt2 = them.at.position.z;
          await W.tween(420, k=>{ const e = ease(k); them.root.rotation.x = 1.35*e; them.root.position.y = -.5*e; them.at.position.z = zt2 + .9*e; pose(them, "fall", e); }); return; }
        // he's away: past you (or the shot's past you)
        const zEnd = Zme + 1.4;
        await Promise.all([slide, W.tween(520, k=>{ const v2 = Math.min(1.4, p) + k*.6; if (block){ W.ballTo(.3 - v2*.3, .11 + v2*.3, Z(v2)); W.trailPush(); } else { them.at.position.z = Math.min(zEnd, Z(v2)); them.at.position.x = .3 + k*1.7; track(them, them.at); W.ballTo(them.at.position.x, .11, them.at.position.z + .55); } })]);
        W.fadeTrail();
      }};
  }

  /* a cross: you on the wing, two team-mates making runs into the box, one of them marked. The 2D game's pitch (the
     goal at the top, x 0-300 across, y down the pitch) is laid out here at a scale that keeps everyone in shot */
  function cross(stage, o){
    if (!stage || !fast()) return null;
    const P3 = (x, y) => new THREE.Vector3((x - 150)*.12, 0, 2 + (y - 5)*.12);
    const cw = P3(...o.crosser), bw = P3(...o.ball); bw.y = .11;
    const W = base(stage, o, bw), {cam, scene} = W, side = cw.x > 0 ? 1 : -1;
    const me = W.add(o.me, cw.x, cw.z, side > 0 ? -Math.PI/2 - .5 : Math.PI/2 + .5);
    const runners = o.mates.map((look, i)=>W.add(look, 0, 20, Math.PI)), mk = W.add(o.marker, 0, 20, Math.PI);
    const kz = .6, kp = grp(0, .94, kz), K = makePlayer(o.keeper); K.root.position.y = -.94; kp.add(K.root); scene.add(kp); W.dyn.push(kp); const reach = reachOf(K, kp);
    // the green spots where the runners want it
    o.spots.forEach(([x, y, r])=>{ const c = P3(x, y), d = new THREE.Mesh(new THREE.CircleGeometry(r*.12, 28), new THREE.MeshBasicMaterial({color:0x4ADE80, transparent:true, opacity:.3, depthWrite:false}));
      d.rotation.x = -Math.PI/2; d.position.set(c.x, .02, c.z); scene.add(d);
      const ring = new THREE.Mesh(new THREE.RingGeometry(r*.12 - .05, r*.12, 32), new THREE.MeshBasicMaterial({color:0x4ADE80})); ring.rotation.x = -Math.PI/2; ring.position.set(c.x, .025, c.z); scene.add(ring); });
    cam.fov = 44; cam.position.set(cw.x + side*5.5, 5.2, cw.z + 9.5); cam.lookAt(side*1.2, .4, 6.2); cam.updateProjectionMatrix();
    W.idle = t => { pose(me, "idle", t); pose(K, "ready", t); };
    W.start();
    return {stop:W.stop,
      ballStage(){ return W.toStage(W.B.position); },
      // a runner (or the defender marking him) at a point of the 2D pitch: returns where he is on the stage, head height
      run(i, x, y){ const P = i < 0 ? mk : runners[i], v = P3(x, y); P.at.position.set(v.x, 0, v.z); track(P, P.at); v.y = 1.9; return W.toStage(v); },
      // the cross to runner i: what became of it (q.res: "assist", "saved", "cleared", "wasted")
      async go(i, spot, q){
        W.mode = "play"; W.rec = q.res==="assist" ? [] : null; runners.forEach(R=>pose(R, "idle", 0)); pose(mk, "idle", 0);
        await W.tween(200, k=>pose(me, "kick", .45 + .55*k));
        const s = P3(...spot); s.y = q.res==="wasted" ? .11 : 1.9;
        // the camera pushes in behind the runner as it comes to him, so you see what he does with it
        const c0p = cam.position.clone(), c0l = new THREE.Vector3(side*1.2, .4, 6.2), c1p = new THREE.Vector3(s.x + side*2.2, 2.4, s.z + 5.5), c1l = new THREE.Vector3(s.x*.3, 1.1, 0), cl = new THREE.Vector3();
        W.tween(900, k=>{ const e = k*k*(3 - 2*k); cam.position.lerpVectors(c0p, c1p, e); cam.lookAt(cl.lerpVectors(c0l, c1l, e)); });
        await flight(W, W.B.position.clone(), s, 520, 3.2);
        const R = runners[i];
        if (q.res==="assist" || q.res==="saved"){
          const k0 = kp.position.clone();
          const tx = (Math.random() < .5 ? -1 : 1)*(1.5 + Math.random()*1.6), tgt = new THREE.Vector3(tx, .6 + Math.random()*1.4, 0);
          await Promise.all([W.tween(240, k=>{ R.at.position.y = Math.sin(k*Math.PI)*.4; pose(R, "header", k); }), flight(W, W.B.position.clone(), q.res==="assist" ? tgt : new THREE.Vector3(tx*.4, 1.3, kz + .3), 360, .1),
            // saved: he gets his hands to it; a goal: he's gone the other way
            (R => W.tween(330, k=>{ const e = ease(k); kp.position.lerpVectors(k0, R.at, e); kp.rotation.z = R.roll*e; pose(K, "dive", e*R.k); }))(q.res==="assist" ? reachFor(new THREE.Vector3(-tx*.5, 1.1, kz), reach) : reachFor(new THREE.Vector3(tx*.4, 1.3, kz), reach))]);
          if (q.res==="assist"){ await W.inNet(SX()); W.goalShow(R, R.at.position.clone().setY(0).lerp(me.at.position, .5), new THREE.Vector3(-side*9, 3.6, 14), new THREE.Vector3(0, 1, 5)); }
          else W.fadeTrail();
        } else if (q.res==="cleared"){ await W.tween(220, k=>{ mk.at.position.y = Math.sin(k*Math.PI)*.4; pose(mk, "header", k); }); await flight(W, W.B.position.clone(), new THREE.Vector3(W.B.position.x + side*6, 3, W.B.position.z + 14), 520, 1.4); W.fadeTrail(); }
        else { const p0 = W.B.position.clone(); await flight(W, p0, new THREE.Vector3(p0.x - side*3, .11, p0.z - 1), 420, .3); W.fadeTrail(); }
      }};
  }


  /* ---------- level 3: every other mini-game, mirrored into 3D ----------
     The 2D game keeps running underneath, exactly as it was; each frame its players and ball are read off the 2D picture
     and stood in a 3D stadium. For the views from above, a camera looking down at 50° with no perspective puts every
     point of the grass exactly where it was in 2D, so the game's taps, drags and buttons still land where they should */
  const MK = .045, ELEV = 50*Math.PI/180, SE = Math.sin(ELEV), CE = Math.cos(ELEV);
  // each view: which way the 2D picture's x and y run on the grass, and where its middle is (the goal at the origin)
  const VIEWS = {
    top:   {ex:[1, 0, 0],  ey:[0, 0, 1],  o:[0, 0, (90 - 3)*MK/SE]},
    bottom:{ex:[-1, 0, 0], ey:[0, 0, -1], o:[0, 0, (177 - 90)*MK/SE]},
    side:  {ex:[0, 0, -1], ey:[1, 0, 0],  o:[0, 0, (297 - 150)*MK]},
    none:  {ex:[0, 0, -1], ey:[1, 0, 0],  o:[0, 0, 52]},
    // side-on games (2D's grass from y 126 to 180, the action along y 166): lower down, and no goal
    sideview:{ex:[1, 0, 0], ey:[0, 0, 1], o:[0, 0, 40], elev:20, track:166}
  };
  /* the goal view (2D's front-on goal: posts at x 30 and 270, the bar at y 20, the ball's spot at y 166) mirrored
     with a shot camera framed the same way, so each 2D point is found in 3D by casting through it: the keeper onto his
     line, the wall onto the grass, the ball at the depth its 2D size says it's reached */
  let MLOOKS = {me:null, anyone:()=>({skin:"#D9A37A"})};
  function mirrorGoal(stage, svg){
    // the distance whose framing puts the posts where 2D has them
    const fr = D => { const c = new THREE.PerspectiveCamera(40, 300/180, .1, 160); frameCam(c, new THREE.Vector3(0, 2.75, D + 4.7), new THREE.Vector3(0, .11, D), .922, new THREE.Vector3(0, 2.44, 0), .111); c.updateMatrixWorld(); return c; };
    let lo = 4, hi = 40; for (let i = 0; i < 30; i++){ const D = (lo + hi)/2, x = new THREE.Vector3(3.66, 1.2, 0).project(fr(D)).x; if (x > .8) lo = D; else hi = D; }
    /* 2D's picture is as seen from c0, with the ball only D0 out. A game played further out (svg data-dist: a free kick,
       a chip over a keeper rushing out) is put at that distance: everything 2D draws is found in c0's world, then its
       distance from the goal stretched by S (heights and sideways kept), and filmed by a camera behind the ball like a
       shot's. Its taps, swipes and the things laid over it are mapped between the two (LV_MAP) */
    const D0 = (lo + hi)/2, c0 = fr(D0), D = Math.max(D0, +svg.dataset.dist || 0), S = D/D0, far = D > D0 + .5;
    const W = base(stage, {}, new THREE.Vector3(0, .11, D)), {scene, cam} = W; W.looks = MLOOKS;
    if (far) frameCam(cam, new THREE.Vector3(.4, 2.6 + D*.03, D + 5.2), new THREE.Vector3(0, .11, D), .922, new THREE.Vector3(0, 2.44, 0), .2);
    else { cam.fov = c0.fov; cam.position.copy(c0.position); cam.quaternion.copy(c0.quaternion); cam.updateProjectionMatrix(); }
    // a breakaway (svg data-run: the chip): you run at goal with the ball as he comes out, the camera with you
    const run = far && !!svg.dataset.run, cz0 = cam.position.z; let adv = 0, runT0 = 0;
    // a 2D goal drawn at an angle (the finesse shot's) is front-on here, so its swipe lines up with the 3D goal
    const tilt = svg.style.cssText; if (tilt){ svg.style.cssText = ""; const st0 = W.stop; W.stop = () => { st0(); if (svg.isConnected) svg.style.cssText = tilt; }; }
    const rc = new THREE.Raycaster(), hit = new THREE.Vector3(), plane = new THREE.Plane(), nz = new THREE.Vector3(0, 0, 1), ny = new THREE.Vector3(0, 1, 0);
    const cast = (x, y, onZ) => { rc.setFromCamera(new THREE.Vector2(x/150 - 1, 1 - y/90), c0); if (onZ != null) plane.set(nz, -onZ); else plane.set(ny, 0); return rc.ray.intersectPlane(plane, hit) ? hit.clone() : null; };
    // a 2D point on the grass in front of the goal (or on the goal itself), where it is in this world, and back again
    const gp = new THREE.Plane(ny, 0), gl = new THREE.Plane(nz, 0), pv = new THREE.Vector3();
    const to3 = (x, y) => { rc.setFromCamera(new THREE.Vector2(x/150 - 1, 1 - y/90), c0); const g = rc.ray.intersectPlane(gp, pv);
      if (g && g.z > 0 && rc.ray.direction.y < 0) return pv.clone().setZ(pv.z*S); return rc.ray.intersectPlane(gl, pv) ? pv.clone() : null; };
    const from3 = v => { const q = v.clone(); if (q.z > .01) q.z /= S; q.project(c0); return [(q.x + 1)*150, (1 - q.y)*90]; };
    if (far){
      stage.classList.add("g3-far");
      LV_MAP = {fwd:(x, y)=>{ const v = to3(x, y); if (!v) return [x, y]; cam.updateMatrixWorld(); v.project(cam); return [(v.x + 1)*150, (1 - v.y)*90]; },
        inv:(x, y)=>{ cam.updateMatrixWorld(); rc.setFromCamera(new THREE.Vector2(x/150 - 1, 1 - y/90), cam);
          const g = rc.ray.direction.y < 0 && rc.ray.intersectPlane(gp, pv); if (g && pv.z > 0) return from3(pv); return rc.ray.intersectPlane(gl, pv) ? from3(pv) : [x, y]; }};
      // 2D's drag lines and swipes, drawn over the picture where they are in it
      stage.insertAdjacentHTML("beforeend", `<svg class="g3-ov" viewBox="0 0 300 180" preserveAspectRatio="none" aria-hidden="true"></svg>`);
      const ov = stage.lastElementChild, st1 = W.stop; W.stop = () => { st1(); LV_MAP = null; ov.remove(); stage.classList.remove("g3-far"); };
      W.overlay = () => { const ls = svg.querySelectorAll(".lv-dragline"); while (ov.children.length > ls.length) ov.lastChild.remove();
        ls.forEach((l, i)=>{ let o = ov.children[i]; if (!o){ o = document.createElementNS("http://www.w3.org/2000/svg", "path"); o.setAttribute("class", "lv-dragline"); ov.appendChild(o); }
          ["stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "opacity", "fill"].forEach(a=>{ const v = l.getAttribute(a); if (v!=null) o.setAttribute(a, v); else o.removeAttribute(a); });
          const n = (l.getAttribute("d") || "").match(/-?[\d.]+/g) || []; let d = ""; for (let j = 0; j + 1 < n.length; j += 2){ const [X, Y] = LV_MAP.fwd(+n[j], +n[j + 1]); d += (j ? "L" : "M") + X.toFixed(1) + " " + Y.toFixed(1); }
          o.setAttribute("d", d); o.style.opacity = getComputedStyle(l).opacity; }); };
    }
    // their keeper (or you, in goal), on his line
    const kz = .4, kp = grp(0, .94, kz), K = makePlayer(svg.dataset.kme ? W.looks.me && {...W.looks.me, gk:true, c1:"#F97316"} || {skin:"#B57D52", c1:"#F97316", c2:"#111827", gk:true, num:1} : {skin:"#D9A37A", c1:"#65A30D", c2:"#111827", gk:true, num:1, hair:"short", hairCol:"#17130F"});
    K.root.position.y = -.94; kp.add(K.root); scene.add(kp); const reach = reachOf(K, kp);
    const men = new Map(), seen = new Set(), T = () => performance.now()/1000;
    const kme = !!svg.dataset.kme, tk = W.add(kme ? {...W.looks.anyone({}), c1:"#E5E7EB", c2:"#1F2937", num:9} : {...W.looks.me, c1:W.looks.me.c1}, -.72, D + .62, Math.PI + .3);
    let kickAt = 0, s0 = null;
    W.idle = () => {
      const sv = svg.getScreenCTM(); if (!sv) return; const inv = sv.inverse(); seen.clear();
      // the strike: 2D's boot swinging in (a shot), or the ball setting off (a shot at you)
      const now = performance.now(), b0 = svg.querySelector("#lvBall"), bs0 = b0 ? Math.hypot(...(m => [m.a, m.b])(inv.multiply(b0.getScreenCTM()))) : 1;
      if (s0==null) s0 = bs0;
      if (!kickAt && (svg.querySelector(".lv-boot") || bs0 < s0 - .01)) kickAt = now;
      if (run && !kickAt && runT0){ const a0 = adv; adv = Math.min(7, (now - runT0)*2.8/1000); tk.at.position.z = D + .62 - adv; cam.position.z = cz0 - adv; cam.updateMatrixWorld(); stepTo(tk, adv - a0, Math.max(.001, (now - (W.rt || now))/1000)); W.rt = now; }
      else if (kickAt) pose(tk, "kick", Math.min(1, (now - kickAt)/300)); else pose(tk, "idle", T());
      const kel = svg.querySelector("#lvKp");
      if (kel && kel.getClientRects().length){ const m = inv.multiply(kel.getScreenCTM()), rot = Math.atan2(m.b, m.a), ksz = Math.hypot(m.a, m.b);
        // off his line (2D draws him bigger as he comes out): how far, from his size
        const out = ksz > 1.1 ? Math.min(D0 - kz - .5, (c0.position.z - kz)*(1 - 1/ksz)) : 0, zo = kz + out, p = cast(m.e, m.f, zo);
        if (p){ p.z = Math.min(kz + out*S, D - adv - 1.1); if (out > 0) p.y = Math.max(p.y, .94); }
        if (run && out > .05 && !runT0) runT0 = now;   // he's coming: off you go
        // diving, his hands go where 2D's keeper is (that's what 2D's saves are measured from); otherwise he's on his toes there
        const dv = Math.abs(rot) > .2 || kel.classList.contains("dive");
        if (p && dv){ const R = reachFor(new THREE.Vector3(p.x, Math.max(.15, p.y), p.z), reach); kp.position.copy(R.at); kp.rotation.z = R.roll; pose(K, "dive", R.k); }
        else if (p && out > .05){ const was = kp.position.clone(); kp.position.set(p.x, .94, p.z); kp.rotation.z = 0; const dt = Math.max(.001, (now - (W.kt || now))/1000);   // rushing out at you
          const v = Math.hypot(kp.position.x - was.x, kp.position.z - was.z)/dt; W.kv = (W.kv || 0) + (v - (W.kv || 0))*.2; K.root.rotation.y = 0; if (W.kv > .6) stepTo(K, Math.hypot(kp.position.x - was.x, kp.position.z - was.z), dt); else pose(K, "ready", T()); }
        else { if (p){ kp.position.set(p.x, Math.max(.55, p.y), p.z); kp.rotation.z = 0; } pose(K, "ready", T()); }
        W.kt = now;
        kp.visible = true; } else kp.visible = false;
      // the ball: how far it's come from its 2D size, then cast through the picture at that depth
      const bb = svg.querySelector("#lvBall > .lv-bb") || svg.querySelector("g[id] > .lv-bb");
      if (bb){ const g = bb.parentNode, m = inv.multiply(g.getScreenCTM()), s = Math.hypot(m.a, m.b), q = clamp((1 - s)/.4, 0, 1.15), tz = /translate\(\s*[-\d.]+[ ,]+([-\d.]+)/.exec(bb.getAttribute("transform") || "");
        const lift = tz ? -(+tz[1])*s : 0, p = cast(m.e, m.f - lift, D0*(1 - q)); if (p){ p.z *= S*(D - adv)/D; if (run && !kickAt) p.x += .25; W.B.position.set(p.x, Math.max(.11, p.y), p.z); W.bs.position.set(p.x, .006, p.z); } W.B.rotation.x -= .08; }
      // anyone else: a wall, a striker, on the grass
      svg.querySelectorAll(".lv-man").forEach(el=>{ if (!el.getClientRects().length) return; seen.add(el); let M = men.get(el);
        if (!M){ const k = el.dataset.k || "#1D4ED8"; M = W.add({...W.looks.anyone(el), c1:k, c2:(typeof LV_TRIM!=="undefined" && LV_TRIM[k]) || "#FFFFFF", num:el.dataset.n || ""}, 0, 0, 0); men.set(el, M); }
        const m = inv.multiply(el.getScreenCTM()), p = cast(m.e, m.f); if (p){ p.z *= S; M.at.position.copy(p); }
        pose(M, el.closest(".lv-wall") || p && p.z > 3 ? "wall" : "idle", T()); });
      men.forEach((M, el)=>{ M.at.visible = seen.has(el); });
      if (W.overlay) W.overlay();
    };
    W.start(); return W;
  }

  /* the TV camera for a from-above game: lower and in perspective, like the main camera at a match, from behind the
     2D picture's near (bottom) edge. The 2D scene still runs the game, so its flat picture is mapped onto the
     camera's (a homography: the ground's a plane): the 2D layer (the drag line) is drawn in perspective with a CSS
     matrix3d, and LV_MAP takes points between the two for the taps and the things laid over the picture */
  const TV_EL = 26*Math.PI/180;
  function homog(s, d){   // the 3x3 projective map taking the four points s to the four points d
    const A = [], b = [];
    for (let i = 0; i < 4; i++){ const [x, y] = s[i], [X, Y] = d[i];
      A.push([x, y, 1, 0, 0, 0, -X*x, -X*y]); b.push(X); A.push([0, 0, 0, x, y, 1, -Y*x, -Y*y]); b.push(Y); }
    for (let c = 0; c < 8; c++){ let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]]; [b[c], b[m]] = [b[m], b[c]];
      for (let r = 0; r < 8; r++) if (r!==c){ const k = A[r][c]/A[c][c]; for (let j = c; j < 8; j++) A[r][j] -= k*A[c][j]; b[r] -= k*b[c]; } }
    return [...b.map((v, i)=>v/A[i][i]), 1];
  }
  const happly = (h, x, y) => { const w = h[6]*x + h[7]*y + h[8]; return [(h[0]*x + h[1]*y + h[2])/w, (h[3]*x + h[4]*y + h[5])/w, w]; };
  function tv(W, stage, svg, cam, G, ey){
    const C = [[0, 0], [300, 0], [300, 180], [0, 180]], P = C.map(([x, y])=>G(x, y)), v = new THREE.Vector3();
    const look = new THREE.Vector3(), f = ey.clone().multiplyScalar(-Math.cos(TV_EL)).add(new THREE.Vector3(0, -Math.sin(TV_EL), 0)).normalize();
    const mid = G(150, 90); let s = 0, d = 60;
    const place = () => { look.copy(mid).addScaledVector(ey, s); cam.position.copy(look).addScaledVector(f, -d); cam.up.set(0, 1, 0); cam.lookAt(look); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
    const ndc = () => P.map(p=>{ v.copy(p).project(cam); return [v.x, v.y]; });
    // fit: the near edge across the bottom of the picture, the whole of the 2D scene in it, the stands over the far edge
    const fitCam = () => {
      for (let i = 0; i < 80; i++){ place(); const q = ndc(), yf = Math.max(q[0][1], q[1][1]), yn = Math.min(q[2][1], q[3][1]), xm = Math.max(...q.map(p=>Math.abs(p[0])));
        const k = Math.max(xm/.99, (yf - yn)/1.84); d *= Math.pow(k, .6); s -= (yn + .97)*d*.12; }
      place();
      // the map, in the 2D scene's units both ways (and the layer's CSS pixels for the matrix)
      const q = ndc().map(([x, y])=>[(x + 1)/2*300, (1 - y)/2*180]), h = homog(C, q), hi = homog(q, C), w = stage.clientWidth || 300, ht = stage.clientHeight || 180;
      LV_MAP = {fwd:(x, y)=>happly(h, x, y).slice(0, 2), inv:(x, y)=>{ const r = happly(hi, x, y); return r[2] > 0 ? [r[0], Math.max(-90, Math.min(270, r[1]))] : [r[0], -90]; }};
      const hp = homog(C.map(([x, y])=>[x*w/300, y*ht/180]), q.map(([x, y])=>[x*w/300, y*ht/180]));
      svg.style.transformOrigin = "0 0"; svg.style.transform = `matrix3d(${[hp[0], hp[3], 0, hp[6], hp[1], hp[4], 0, hp[7], 0, 0, 1, 0, hp[2], hp[5], 0, hp[8]].map(n=>+n.toFixed(9)).join(",")})`;
      stage.querySelectorAll('[style*="--lx"]').forEach(el=>{ const [X, Y] = LV_MAP.fwd(+el.style.getPropertyValue("--lx"), +el.style.getPropertyValue("--ly")); el.style.left = (X/3).toFixed(2) + "%"; el.style.top = (Y/1.8).toFixed(2) + "%"; });
    };
    W.onFit = fitCam;
    const stop0 = W.stop; W.stop = () => { stop0(); LV_MAP = null; svg.style.transform = svg.style.transformOrigin = "";
      stage.querySelectorAll('[style*="--lx"]').forEach(el=>{ el.style.left = (+el.style.getPropertyValue("--lx")/3).toFixed(2) + "%"; el.style.top = (+el.style.getPropertyValue("--ly")/1.8).toFixed(2) + "%"; }); };
  }
  const BSZ = 1.25;
  // the ball seen through a player in front of it (from behind, he'd hide it at his feet): a faint ghost drawn over everything
  const ghost = B => { const g = new THREE.Mesh(B.geometry, new THREE.MeshBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.5, depthTest:false, depthWrite:false})); g.renderOrder = 5; B.add(g); B.material.transparent = true; B.renderOrder = 6; return B; };   // (the ball itself drawn after it, over it when it's in view)   // the ball in the from-above games: a touch big, to follow, but in proportion to the players (1.3)
  function mirror(stage){
    if (!stage || !fast() || stage.classList.contains("g3")) return null;
    const svg = stage.querySelector(":scope > svg[data-view]"); if (!svg) return null;
    const vk = svg.dataset.view, V = VIEWS[vk];
    if (vk==="goal") return mirrorGoal(stage, svg);
    if (!V) return null;
    const EL = (V.elev || 50)*Math.PI/180, SE = Math.sin(EL), CE = Math.cos(EL);
    const ex = new THREE.Vector3(...V.ex), ey = new THREE.Vector3(...V.ey), O = new THREE.Vector3(...V.o);
    const G = (x, y, h = 0, out = new THREE.Vector3()) => out.copy(O).addScaledVector(ex, (x - 150)*MK).addScaledVector(ey, (y - 90)*MK/SE).setY(h);
    SR ||= {r:makeRenderer(), scene:new THREE.Scene(), cam:new THREE.PerspectiveCamera(40, 300/180, .1, 160)};
    // side-on games keep the flat (orthographic) view; the rest are filmed by a TV camera (see tv() below)
    const flat = V.track || vk==="bottom";   // (looking out of your own goal, the goal in the foreground would hide the play)
    const cam = flat ? (SR.ortho ||= new THREE.OrthographicCamera(-150*MK, 150*MK, 90*MK, -90*MK, .1, 400)) : (SR.tv ||= new THREE.PerspectiveCamera(30, 300/180, .5, 400));
    const W = base(stage, {cam, noLines:true, focus:G(150, 90), shadowSize:15}, G(150, 90, .11)), {scene} = W;
    if (V.track){ // side-on: the middle of the picture is the grass behind the line of play, and there's no goal in it
      O.copy(new THREE.Vector3(...V.o)).addScaledVector(ey, (90 - V.track)*MK/SE); scene.children.forEach(o=>{ if (o.isLineSegments || (o.isMesh && o.geometry && o.geometry.type==="CylinderGeometry")) o.visible = false; });
      // the stand as 2D draws it, just behind: the crowd (2D's y 0 to 106) over the advertising boards (106 to 126) where the grass ends
      scene.children.forEach(o=>{ if (o.userData.stand || o.userData.pylon || o.renderOrder===-1) o.visible = false; });
      const back = G(150, 126), CE2 = Math.cos(EL), bh = 20*MK/CE2, ch = 106*MK/CE2 + 1;
      const bdm = new THREE.Mesh(new THREE.PlaneGeometry(60, bh), new THREE.MeshBasicMaterial({map:boardTex})); bdm.position.set(back.x, bh/2, back.z); scene.add(bdm);
      const ct = crowdTex.clone(); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(1.7, ch/11); ct.needsUpdate = true;   // (closer than a real stand: the fans tiled smaller)
      const crm = new THREE.Mesh(new THREE.PlaneGeometry(60, ch), new THREE.MeshBasicMaterial({map:ct, color:0xB4BCB7})); crm.position.set(back.x, bh + ch/2 - .05, back.z - .6); scene.add(crm);
      const rw = new THREE.Mesh(new THREE.PlaneGeometry(60, 2), mat("#1B2228", .85)); rw.position.set(back.x, bh + .6, back.z - .3); rw.rotation.x = -Math.PI/2; scene.add(rw);
      // a goal at the side when 2D has one (lgSideGoal: its post at x 30, the net back to the left), side-on to us, its mouth to the play
      const sg = svg.querySelector('path[fill="url(#lvNetS)"]');
      if (sg){ const px = +(/M\s*([-\d.]+)/.exec(sg.getAttribute("d")) || [0, 30])[1], at = G(px, V.track), gg = new THREE.Group(); goalFrame(gg); gg.rotation.y = Math.PI/2; gg.position.set(at.x, 0, at.z); scene.add(gg); } }
    // looking out of your own goal, the camera's high behind it: the stand there (and the pylons) would be in the way
    if (vk==="bottom"){ if (W.crowd[0]) W.crowd[0].parent.visible = false; scene.children.forEach(o=>{ if (o.userData.pylon) o.visible = false; }); }
    // a 2D scene with no goal in it (the slalom's course): no goal, and the stand behind it pushed well back
    if (svg.dataset.nogoal){ scene.children.forEach(o=>{ if (o.isLineSegments || o.renderOrder===-1 || (o.isMesh && o.geometry && o.geometry.type==="CylinderGeometry")) o.visible = false; });
      if (W.crowd[0]) W.crowd[0].parent.position.z -= 60; }
    // the 2D pitch's own markings (its boxes, arcs and centre circle), traced onto the grass
    const mk = svg.querySelector('g[fill="none"]');
    if (mk){ const pts = [];
      mk.querySelectorAll("rect, path, circle, line").forEach(el=>{ if (!el.getTotalLength) return;
        /* (2D's border round the picture isn't a line on a real pitch: in 3D it looked like a huge box) */ if (el.tagName==="rect" && +el.getAttribute("width") >= 280) return; const L = el.getTotalLength(), n = Math.max(2, Math.ceil(L/4)); let prev = null;
        for (let i = 0; i <= n; i++){ const q = el.getPointAtLength(L*i/n), v = G(q.x, q.y, .02); if (prev) pts.push(prev.x, prev.y, prev.z, v.x, v.y, v.z); prev = v; } });
      const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color:0xF2F5EF, transparent:true, opacity:.85}))); }
    W.B.scale.setScalar(BSZ); W.bs.scale.setScalar(BSZ); ghost(W.B); W.B.renderOrder = 6; scene.fog = null;   // (the camera's 80 m off: the stadium's fog would hide everything)
    // the camera: up and back on the near side (2D's bottom edge), looking at the middle of the picture
    const f = ey.clone().multiplyScalar(-CE).add(new THREE.Vector3(0, -SE, 0));
    cam.position.copy(O).addScaledVector(f, -80); cam.up.set(0, 1, 0); cam.lookAt(O); cam.updateProjectionMatrix();
    if (!flat) tv(W, stage, svg, cam, G, ey);
    // the players: one 3D footballer for each 2D one, matched on the element
    const men = new Map(), balls = new Map(), seen = new Set(), sm = new DOMMatrix();
    const T = () => performance.now()/1000;
    const lookFor = el => { const k = el.dataset.k || "#1D4ED8", you = el.classList.contains("lv-you");
      const L = you && o0.me ? {...o0.me, c1:k, c2:(typeof LV_TRIM!=="undefined" && LV_TRIM[k]) || o0.me.c2} : {...o0.anyone(el), c1:k, c2:(typeof LV_TRIM!=="undefined" && LV_TRIM[k]) || (lum(k) > .5 ? "#1F2937" : "#FFFFFF"), num:el.dataset.n || ""};
      if (el.closest("#lvGk") || el.dataset.gk) L.gk = true; return L; };
    const o0 = W.looks = {me:null, anyone:null};
    W.idle = () => {
      const now = performance.now(), sv = svg.getScreenCTM(); if (!sv) return; const inv = sv.inverse();
      seen.clear();
      // where the ball is (the first one), so the players can face it
      let ballAt = null;
      svg.querySelectorAll("g[id] > .lv-bb").forEach((bb, i)=>{
        const g = bb.parentNode; if (!g.getClientRects().length) return; const m = inv.multiply(g.getScreenCTM());
        const tz = /translate\(\s*[-\d.]+[ ,]+([-\d.]+)/.exec(bb.getAttribute("transform") || ""), z = tz ? -(+tz[1])*Math.hypot(m.a, m.b) : 0;
        let B = balls.get(g); if (!B){ B = i===0 && !balls.size ? W.B : (()=>{ const b = ball(); b.scale.setScalar(BSZ); ghost(b); b.renderOrder = 6; scene.add(b); return b; })(); balls.set(g, B); }
        if (V.track) G(m.e, V.track, .11*BSZ + Math.max(0, V.track - m.f + z)*MK/CE, B.position); else G(m.e, m.f, .11*BSZ + Math.max(0, z)*MK/CE, B.position);
        B.rotation.x -= .05; seen.add(g); if (!ballAt) ballAt = B.position.clone();
        if (B===W.B) W.bs.position.set(B.position.x, .006, B.position.z);
      });
      balls.forEach((B, g)=>{ B.visible = seen.has(g); });
      // a touch: the ball suddenly away at pace from near a player means he's just played it
      if (ballAt){ const bt = (now - (W.bt || now))/1000, bsp = W.bp && bt > 0 ? ballAt.distanceTo(W.bp)/bt : 0;
        if (W.bsp != null && bsp - W.bsp > 3.5 && W.bp){ let best = null, bd = 1.6; men.forEach(M=>{ if (!M.last) return; const d = Math.hypot(M.last.x - W.bp.x, M.last.z - W.bp.z)/(M.sz || 1.3)*1.3; if (d < bd){ bd = d; best = M; } }); if (best) best.touchAt = now; }
        W.bsp = bsp; W.bp = ballAt.clone(); W.bt = now; }
      svg.querySelectorAll(".lv-man").forEach(el=>{
        if (!el.getClientRects().length) return; seen.add(el);
        let M = men.get(el);
        if (!M){ M = W.add(lookFor(el), 0, 0, 0); M.root.scale.setScalar(1.3); M.sz = 1.3; M.last = null; M.v = 0; M.yaw = null; M.ph = Math.random(); M.w = 0; men.set(el, M); }
        const dt = M.last ? Math.min(.1, Math.max(0, (now - M.lt)/1000)) : 0;
        const m = inv.multiply(el.getScreenCTM()), at = M.at;
        // his size as 2D draws him (bigger in the side-on games)
        const sz = 1.3*Math.min(1.9, Math.max(.6, Math.hypot(m.a, m.b))); if (Math.abs(sz - M.sz) > .01){ M.sz = sz; M.root.scale.setScalar(sz); }
        // side-on, 2D shows a jump by moving him up the picture: here he stays on his line and goes up
        let p; if (V.track){ M.y0 = Math.max(M.y0 ?? m.f, m.f); p = G(m.e, M.y0, Math.max(0, M.y0 - m.f)*MK/CE); }
        else p = G(m.e, m.f);
        // facing: the way he's moving, or towards the ball
        const moved = M.last ? Math.hypot(p.x - M.last.x, p.z - M.last.z) : 0, yaw0 = at.rotation.y;
        if (M.last){ const d = p.clone().sub(M.last).setY(0), sp = d.length()/Math.max(.001, (now - M.lt)/1000); M.v += (Math.min(12, sp) - M.v)*(1 - Math.exp(-dt*9)); if (d.lengthSq() > 1e-6) M.yaw = Math.atan2(d.x, d.z); }
        else if (ballAt) M.yaw = Math.atan2(ballAt.x - p.x, ballAt.z - p.z);
        if (M.v < .6 && ballAt && p.distanceTo(ballAt) > .5) M.yaw = Math.atan2(ballAt.x - p.x, ballAt.z - p.z);
        M.last = p.clone(); M.lt = now; at.position.copy(p); if (M.yaw!=null) at.rotation.y += Math.atan2(Math.sin(M.yaw - at.rotation.y), Math.cos(M.yaw - at.rotation.y))*(1 - Math.exp(-dt*11));
        // what he's doing: the 2D picture's own animations (kick, hop, cheer), a dive (his tilt), running, or standing
        const cls = el.classList, anc = el.parentNode && el.parentNode.classList, rot = Math.atan2(m.b, m.a);
        const flag = (k, on) => { if (on){ M[k] ||= now; return (now - M[k])/1000; } M[k] = 0; return -1; };
        const kick = flag("kickAt", cls.contains("kick")), hop = flag("hopAt", cls.contains("hop")), cheer = flag("cheerAt", cls.contains("cheer") || (el.closest(".cheer") != null));
        M.root.rotation.z = 0;
        if (kick >= 0) pose(M, "kick", Math.min(1, kick/.33));
        else if (hop >= 0){ pose(M, "header", Math.min(1, hop/.46)); at.position.y = Math.sin(Math.min(1, hop/.46)*Math.PI)*.4; }
        else if (cheer >= 0) pose(M, "cheer", cheer);
        else if (M.touchAt && now - M.touchAt < 300) pose(M, "kick", .45 + .55*(now - M.touchAt)/300);   // the touch
        else if (Math.abs(rot) > .35 || (anc && anc.contains("dive")) || el.closest(".dive")){ pose(M, "dive", Math.min(1, Math.abs(rot)/1.1)); M.root.rotation.z = -rot; }
        else {   // standing, walking, jogging, running or sprinting, by his speed; the stride matched to the ground he covers
          let v = M.v/M.sz, d = moved/M.sz;
          if (el.querySelector(".lv-legs.run") && v < 3.2){ v = 3.6; d = v*dt; }   // running on the spot (the 2D world scrolls past him)
          M.ph += strideBy(d, v); pose(M, "move", M.ph, v);
          // leaning into his turns, more the faster he goes
          const turn = dt > 0 ? Math.atan2(Math.sin(at.rotation.y - yaw0), Math.cos(at.rotation.y - yaw0))/dt : 0;
          M.lean = (M.lean || 0) + (Math.max(-.2, Math.min(.2, -turn*v*.035)) - (M.lean || 0))*(1 - Math.exp(-dt*6)); M.root.rotation.z = M.lean; }
      });
      men.forEach((M, el)=>{ M.at.visible = seen.has(el); if (!el.isConnected){ scene.remove(M.at); men.delete(el); } });
      // their keeper, in the from-above attacking games whose 2D picture leaves him out: on his line, shuffling across
      // to stay between the ball and his goal
      if (W.gk){ const g = W.gk, tx = ballAt ? Math.max(-2.4, Math.min(2.4, ballAt.x*.45)) : 0, dx = tx - g.at.position.x, dtk = Math.min(.05, (now - (g.lt || now))/1000); g.lt = now;
        const step = Math.sign(dx)*Math.min(Math.abs(dx), 3.2*dtk); g.at.position.x += step; pose(g, "ready", T() + (Math.abs(dx) > .05 ? T() : 0)); }
      // props the 2D game draws (slalom poles), stood where they are
      svg.querySelectorAll("[data-prop]").forEach(el=>{ let P = props.get(el);
        if (!P){ P = new THREE.Group(); const pm = new THREE.Mesh(geo("pole", ()=>new THREE.CylinderGeometry(.035, .035, 1.7, 10)), mat("#F8FAFC", .4)); pm.position.y = .85; P.add(pm);
          const fl = new THREE.Mesh(geo("flag", ()=>{ const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.7, 0, .45, 1.55, 0, 0, 1.4, 0], 3)); g.computeVertexNormals(); return g; }), mat("#F97316", .6, {side:THREE.DoubleSide})); P.add(fl); scene.add(P); props.set(el, P); }
        const m = inv.multiply(el.getScreenCTM()); G(m.e, m.f, 0, P.position); P.visible = !!el.getClientRects().length; });
    };
    const props = new Map();
    if (vk==="top" && !svg.dataset.nogoal && !svg.querySelector("#lvGk, [data-gk]")){ const at = G(150, 8); W.gk = W.add({skin:"#C08368", c1:"#16A34A", c2:"#111827", shorts:"#111827", socks:"#16A34A", gk:true, gloves:"#C8F04A", num:1, name:""}, at.x, at.z, 0); W.gk.root.scale.setScalar(1.3); }
    W.start();
    return W;
  }

  // three.js is fetched once the game's on screen, so it's there by the first shot
  if (typeof window !== "undefined") window.addEventListener("load", ()=>setTimeout(()=>load().then(ok=>{
    if (!ok) return; if (typeof S!=="undefined" && S && document.querySelector(".board .card-top")) G3.cardNow();
    loadPeople().then(got=>{ if (got && typeof S!=="undefined" && S && document.querySelector(".board .card-top")) G3.cardNow(); });
  }), 400));
  return {on, set, load, ready, glOK, lookOf, card:card, shot, save, header, tackle, cross, mirror:(stage, looks)=>{ MLOOKS = looks || MLOOKS; const W = mirror(stage); if (W && looks) Object.assign(W.looks ||= {}, looks); return W; }, cardNow(){ const el = document.querySelector(".board .card-top"); if (el && S && S.player) card.mount(el, S.player, meta(S.club)); }};
})();
