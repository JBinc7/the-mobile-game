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
    root.traverse(o=>{ if (o.isMesh) o.frustumCulled = false; });
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
    cheer(r, t){ r.arm[-1].rotation.z = -2.6; r.arm[1].rotation.z = 2.6; r.arm[-1].rotation.x = r.arm[1].rotation.x = Math.sin(t*9)*.15; r.elbow[-1].rotation.x = r.elbow[1].rotation.x = -.15;
      r.chest.rotation.x = -.1; r.hips.position.y = .94 + Math.abs(Math.sin(t*9))*.05; r.leg[1].rotation.x = r.leg[-1].rotation.x = 0; r.knee[1].rotation.x = r.knee[-1].rotation.x = .05; }
  };

  /* ---------- real footballers ----------
     Two footballers from the Microsoft Rocketbox Avatar Library (MIT; vendor/people), with motion-captured idle,
     breathing, running and celebrating. Each is dressed in the kit of the side he's playing for (the shirt in its
     colour, the trim in its second, the name and number on the back), and you look like your player: the footballer
     closer to your skin tone, tinted to it. Until they've loaded (or if they can't), the drawn players stand in */
  const PEOPLE = {m02:{glb:"sm02", tex:"m301", skin:"#C08368"}, m03:{glb:"sm03", tex:"m300", skin:"#9A6746", hair:true}};
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
    const M = lum(look.skin) < .33 ? people.m03 : people.m02;   // the two lightest skin tones: m02; the rest: m03
    const model = SkeletonUtils.clone(M.scene), root = grp(); root.add(model);
    const body = kitTex(M, look), head = headTex(M, look);
    model.traverse(o=>{ if (!o.isMesh) return; o.frustumCulled = false;
      const ms = [].concat(o.material).map(m => m.name==="hair" ? matFor("hair|" + M.key, ()=>new THREE.MeshStandardMaterial({map:M.hairT, alphaTest:.42, side:THREE.DoubleSide, roughness:.85}))
        : m.name==="head" ? matFor("head|" + head.uuid, ()=>new THREE.MeshStandardMaterial({map:head, normalMap:lite ? null : M.headN, roughness:.62}))
        : matFor("body|" + body.uuid, ()=>new THREE.MeshStandardMaterial({map:body, normalMap:lite ? null : M.bodyN, roughness:.78})));
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
  function clip(P, name, t){
    const c = clips && clips[name]; if (!c) return;
    const L = P.act[name] ||= c.tracks.map(tr=>{ const [bn, prop] = tr.name.split("."), b = P.byName[bn]; return b && (prop==="quaternion" || prop==="position") ? [b, prop, tr.createInterpolant()] : null; }).filter(Boolean);
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
    wall(P, t){ clip(P, "idle", t); ["L", "R"].forEach(s=>{ fwd(P, s + "_UpperArm", .35); raise(P, s, -.18); fwd(P, s + "_Forearm", 1.25); }); }
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
    r.setPixelRatio(lite ? 1 : Math.min(1.75, window.devicePixelRatio || 1)); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.domElement.className = "g3-canvas"; r.domElement.setAttribute("aria-hidden", "true");
    return r;
  }
  function fit(r, cam, el){ const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight); if (r._w===w && r._h===h) return false; r._w = w; r._h = h; r.setSize(w, h, false); if (cam.isPerspectiveCamera) cam.aspect = w/h; cam.updateProjectionMatrix(); return true; }
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
      P.root.rotation.y = Math.PI + spin; pose(P, "idle", t);
      R.render(scene, cam); raf = requestAnimationFrame(frame);
    }
    function stop(){ if (raf) cancelAnimationFrame(raf); raf = 0; if (io){ io.disconnect(); io = null; } }
    function mount(el, pl, club){
      if (!el || !ready()) return false;
      if (!R){ R = makeRenderer(); scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(26, 1, .1, 50); }
      const k = JSON.stringify([pl.skin, pl.hair, pl.hairColour, pl.number, pl.name, club.c1, club.c2, !!people]);
      if (k !== key){ key = k; clear(scene); lights(scene, {key:2.4, keyZ:-6, rim:1.6});
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
  function pitch(scene, lines = true){
    // mown stripes across the pitch, then the lines as thin strips
    const g1 = mat("#1D6B3A", .95), g2 = mat("#22793F", .95), line = new THREE.MeshBasicMaterial({color:0xF2F5EF});
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), g1); ground.rotation.x = -Math.PI/2; ground.position.set(0, -.01, 0); scene.add(ground);   // grass to the horizon
    for (let i = -2; i < 20; i++){ const s = new THREE.Mesh(new THREE.PlaneGeometry(120, 4), i%2 ? g1 : g2); s.rotation.x = -Math.PI/2; s.position.set(0, 0, i*4 + 2); scene.add(s); }
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
    [-1, 1].forEach(s=>{ const p = new THREE.Mesh(pg, post); p.position.set(s*X, (H + r)/2, 0); scene.add(p); });
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
    // the stands all round: behind the goal and down both sides (so a replay from the side has a crowd behind it),
    // each a raked bank of fans over a strip of advertising boards
    const cm = new THREE.MeshBasicMaterial({map:crowdTex, color:0x9AA59F}), bm = new THREE.MeshBasicMaterial({map:boardTex}), crowd = [];
    const bank = (w, x, z, ry, d) => { const g = grp(x, 0, z); g.rotation.y = ry; scene.add(g);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(w, 20), cm); c.position.set(0, 10.5, -d); c.rotation.x = .22; g.add(c); crowd.push(c);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(w*.6, .9), bm); b.position.set(0, .45, 0); g.add(b); };
    bank(80, 0, -5, 0, 11);
    [-1, 1].forEach(s=>bank(66, s*36, 27, -s*Math.PI/2, 7));
    // the touchlines
    const tl = new THREE.MeshBasicMaterial({color:0xF2F5EF}); [-1, 1].forEach(s=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(.12, 58), tl); m.rotation.x = -Math.PI/2; m.position.set(s*34, .01, 29); scene.add(m); });
    // the floodlights' glow
    const gc = document.createElement("canvas"); gc.width = gc.height = 64; const gx2 = gc.getContext("2d"), gr = gx2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,248,222,1)"); gr.addColorStop(.25, "rgba(255,226,154,.45)"); gr.addColorStop(1, "rgba(255,226,154,0)"); gx2.fillStyle = gr; gx2.fillRect(0, 0, 64, 64);
    const gt = new THREE.CanvasTexture(gc);
    [-1, 1].forEach(s=>{ const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:gt, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending})); sp.position.set(s*24, 24, -22); sp.scale.set(16, 16, 1); scene.add(sp); });
    scene.fog = new THREE.Fog(0x07120C, 30, 70);
    return crowd;
  }
  let ballTex = null;
  function ball(){
    if (!ballTex){ const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d"); x.fillStyle = "#F7F7F5"; x.fillRect(0, 0, 256, 128);
      x.fillStyle = "#1B1D21"; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++){ const cx = i*44 + (j%2)*22 + 10, cy = 22 + j*42; x.beginPath(); for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2 - Math.PI/2; x.lineTo(cx + Math.cos(a)*11, cy + Math.sin(a)*11); } x.fill(); }
      ballTex = new THREE.CanvasTexture(c); ballTex.colorSpace = THREE.SRGBColorSpace; }
    const b = new THREE.Mesh(new THREE.SphereGeometry(.11, 24, 16), new THREE.MeshStandardMaterial({map:ballTex, roughness:.45}));
    return b;
  }
  /* the stadium for a shot or a save: the goal, the ball on its spot, the man taking it and the man in goal.
     role "shot": you take it (o.me) against their keeper (o.keeper); role "save": their striker (o.taker) against you (o.gk) */
  /* the stadium every 3D moment is played in: the pitch and its lines, the goal and its net, the crowd, the ball (on
     its spot at `ballAt`), the lights, the animation loop and the speed watch. Each moment adds its players and camera */
  function base(stage, o, ballAt){
    if (!SR){ SR = {r:makeRenderer(), scene:new THREE.Scene(), cam:new THREE.PerspectiveCamera(40, 300/180, .1, 160)}; }
    if (SR.cur){ SR.cur.stop(); SR.cur = null; }   // one scene at a time: the last one stops
    const {r, scene} = SR, cam = o.cam || SR.cam; clear(scene); scene.fog = null; scene.background = new THREE.Color(0x07120C);
    if (cam.isPerspectiveCamera){ cam.far = 160; cam.aspect = 300/180; cam.clearViewOffset(); }
    lights(scene, {hemi:1.3, key:2.3, keyZ:8, rim:.9, fill:1.1});
    pitch(scene, !o.noLines); const net = goalFrame(scene); const crowd = stands(scene, o.crowd || "#F5C542");
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
    // the ball's shadow follows it, smaller as it rises
    W.ballTo = (x, y, z) => { B.position.set(x, y, z); bs.position.set(x, .006, z); bs.scale.setScalar(Math.max(.3, 1 - y*.25)); };
    W.fadeTrail = () => W.tween(300, k=>{ trail.material.opacity = .5*(1 - k); }).then(()=>{ trail.visible = false; trail.material.opacity = .5; });
    // a point in the world, as a point of the stage (x 0-300, y 0-180), for the buttons and rings laid over the picture
    const pv = new THREE.Vector3();
    W.toStage = v => { cam.updateMatrixWorld(); pv.copy(v).project(cam); return [(pv.x + 1)/2*300, (1 - pv.y)/2*180]; };
    // watch how fast it draws: too slow, and drop the resolution; still too slow, and the next moments are 2D
    let nf = 0, last = 0, sum = 0, cnt = 0;
    const watch = now => { if (last && ++nf > 4){ sum += now - last; cnt++;
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
      r.render(scene, W.view || cam); raf = requestAnimationFrame(frame);
    };
    W.start = () => { try{ r.compile(scene, cam); }catch(e){} raf = requestAnimationFrame(frame); };
    W.stop = () => { if (stopped) return; stopped = true; if (raf) cancelAnimationFrame(raf); raf = 0; host.classList.remove("g3"); if (r.domElement.parentNode===host) r.domElement.remove(); if (SR.cur===W) SR.cur = null; };
    // an animation step run every frame for ms milliseconds (several can run at once)
    W.tween = (ms, f) => new Promise(res=>{ const a = performance.now(); const g = now=>{ const k = Math.min(1, Math.max(0, now - a)/ms); f(k); if (k>=1){ anims.delete(g); res(); } }; anims.add(g); if (stopped) res(); });
    // the ball into the net: it hits the back of the net, which stretches round it and throws it back out, and it drops
    W.inNet = async (spinAxis) => { const p0 = B.position.clone(), back = -net.D + .11;
      net.touch(B.position);
      const t1 = Math.max(90, Math.abs(back - p0.z)*90);
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
    // the crowd on its feet: the banks bounce, fading out over ms
    W.roar = ms => { const y0 = crowd.map(c=>c.position.y); W.tween(ms, k=>crowd.forEach((c, i)=>{ c.position.y = y0[i] + .35*(1 - k)*Math.abs(Math.sin(k*ms/1000*7.5 + i)); })); };
    W.goalShow = async (P, runTo, camAt, lookAt) => {
      const all = W.rec || [], end = all.length ? all[all.length - 1].t : 0, frames = all.filter(f=>f.t >= end - 2600); W.rec = null; if (stopped) return;
      W.roar(4200);
      const host0 = host, from = P.at ? P.at.position.clone() : P.root.position.clone(), obj = P.at || P.root;
      const yaw = Math.atan2(runTo.x - from.x, runTo.z - from.z), t1 = performance.now();
      const face = Math.atan2(cam.position.x - runTo.x, cam.position.z - runTo.z), turn = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a))*k;
      const run = W.tween(1300, k=>{ const e = k*k*(3 - 2*k); obj.position.lerpVectors(from, runTo, e); obj.rotation.y = turn(yaw, face, Math.max(0, (k - .6)/.4)); pose(P, k < .75 ? "run" : "cheer", (performance.now() - t1)/1000); });
      await run; if (stopped || frames.length < 4) return;
      // the replay: everything put back as it was, frame by frame, at half speed
      const live = W.dyn.map(o=>[o.position.clone(), o.quaternion.clone(), o.visible]);
      const rc = new THREE.PerspectiveCamera(40, 300/180, .1, 160); rc.position.copy(camAt); rc.lookAt(lookAt); W.view = rc; const tr = new THREE.Vector3(); W.mode = "replay";
      host0.insertAdjacentHTML("beforeend", `<span class="g3-replay" aria-hidden="true">Replay</span>`); const badge = host0.lastElementChild;
      const t0r = frames[0].t, span = frames[frames.length - 1].t - t0r; net.touch(B.position);
      await W.tween(span*2, k=>{ const tt = t0r + span*k; let i = 0; while (i < frames.length - 1 && frames[i + 1].t <= tt) i++; const F = frames[i];
        F.o.forEach(([p, q, v], j)=>{ const o = W.dyn[j]; if (!o) return; o.position.copy(p); o.quaternion.copy(q); o.visible = v; });
        (F.p || []).forEach(([Q, n, a, b])=>{ if (Q.real) REAL[n](Q, a, b); else POSE[n](Q.rig, a, b); });
        rc.lookAt(tr.copy(lookAt).lerp(B.position, .45)); });   // the camera follows the ball
      net.touch(null); badge.remove(); if (stopped) return;
      live.forEach(([p, q, v], j)=>{ const o = W.dyn[j]; o.position.copy(p); o.quaternion.copy(q); o.visible = v; });
      W.view = null; W.mode = "goal";
      const t2 = performance.now(); W.tween(2600, ()=>pose(P, "cheer", (performance.now() - t2)/1000));
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
    // the camera: high behind the ball and dead centre, so the taker sits below the goal and both corners are clear;
    // the ball where your finger goes (92% down), just over the bar 13% down
    frameCam(cam, new THREE.Vector3(0, 2.75, D + 4.7), new THREE.Vector3(0, .11, D), .922, new THREE.Vector3(0, 2.75, 0), .13);
    Object.assign(W, {taker, K, kp, ks, kz, D});
    W.idle = t => { pose(taker, "idle", t); pose(K, "ready", t); pose(ref, "idle", t + 2.3); };
    W.start();
    return W;
  }
  const ease = k => 1 - Math.pow(1 - k, 2);
  // a point of the 2D goal (x 30-270 post to post, y 20 bar to 124 line) in the 3D goal mouth
  const kTarget = (kx, ky) => new THREE.Vector3(gx(kx), Math.max(.55, gy(ky)), 0);

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
    function aim(x){ const ax = gx(x), P = aimG.attributes.position; P.setXYZ(1, ax, .02, 0); P.needsUpdate = true; aimL.computeLineDistances(); aimL.visible = true; aimM.position.set(ax, .03, .3); aimM.visible = true; }
    W.dyn.push(taker.root, kp);
    async function play(q){
      W.rec = []; W.mode = "shoot"; W.tween(250, k=>{ aimL.material.opacity = .85*(1 - k); aimM.material.opacity = .9*(1 - k); }).then(()=>{ aimL.visible = aimM.visible = false; });
      // the harder the strike, the quicker the leg comes through
      const sw = clamp(300 - (q.power ?? .7)*120, 170, 300);
      await W.tween(sw, k=>{ pose(taker, "kick", k*.55); pose(K, "ready", (performance.now() - W.t0)/1000); });
      const tgt = new THREE.Vector3(gx(q.wx), Math.max(.11, gy(q.ty)), 0);
      if (q.wall) tgt.set(gx(q.wx), 1.2, D - 9.15 + .35);
      if (q.saved) tgt.z = kz + .3;   // saved: it meets his hands in front of the line, not the goal behind him
      const from = B.position.clone(), arcH = (q.h || 0)/104*2.44, cv = (q.curve || 0)/120*3.66;
      const kTo = kTarget(q.kx, q.ky).setZ(kz), kFrom = kp.position.clone(), roll = -(q.rot || 0)*Math.PI/180, fov0 = cam.fov;
      const spinAxis = new THREE.Vector3(1, q.curve ? -.4*Math.sign(q.curve) : 0, 0).normalize();
      await Promise.all([
        W.tween(sw*1.05, k=>pose(taker, "kick", .55 + .45*k)),
        W.tween(q.ms, k=>{ const e = ease(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e), from.y + (tgt.y - from.y)*e + arcH*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); W.trailPush(); bs.position.set(B.position.x, .006, B.position.z); bs.scale.setScalar(Math.max(.3, 1 - B.position.y*.25));
          cam.fov = fov0 - 3*e; cam.updateProjectionMatrix(); }),   // a slight zoom as it flies
        W.tween(q.kms, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; pose(K, "dive", Math.abs(roll) > .2 ? e : e*.4); ks.position.x = kp.position.x; })
      ]);
      const p0 = B.position.clone(), fade = () => W.tween(300, k=>{ W.trail.material.opacity = .5*(1 - k); }).then(()=>{ W.trail.visible = false; });
      if (q.goal){
        W.mode = "goal";
        await W.inNet(spinAxis);
        W.goalShow(taker, new THREE.Vector3(-2.3, 0, D - 2), new THREE.Vector3(-7, 3.4, D + (D > 16 ? 6 : 8)), new THREE.Vector3(0, .9, D*.3));
      } else if (q.over || q.wide){ W.rec = null; fade();
        await W.tween(360, k=>{ B.position.set(p0.x + (q.wide ? Math.sign(p0.x)*1.5*k : 0), p0.y + (q.over ? .6*k : -.1*k), p0.z - 6*k); });
      } else if (q.wood){ fade();
        await W.tween(420, k=>{ B.position.set(p0.x - Math.sign(p0.x)*.8*k, Math.max(.11, p0.y - 1.2*k*k + .2*k), p0.z + 4*ease(k)); });
      } else if (q.wall){ fade();
        await W.tween(420, k=>{ B.position.set(p0.x + .6*k, Math.max(.11, p0.y + .3*k - 1.2*k*k), p0.z + 3.5*ease(k)); });
      } else if (q.held){ fade();   // held: into his chest, and he keeps it
        await W.tween(240, k=>{ const e = ease(k); B.position.set(p0.x + (kp.position.x - p0.x)*e*.85, p0.y + (kp.position.y + .15 - p0.y)*e*.85, p0.z + .1*e); bs.position.set(B.position.x, .006, B.position.z); });
      } else { fade();   // parried: pushed away, out and wide
        await W.tween(480, k=>{ B.position.set(p0.x + Math.sign(p0.x || 1)*1.8*ease(k), Math.max(.11, p0.y + .3*k - 1.3*k*k), p0.z + 2.6*ease(k)); bs.position.set(B.position.x, .006, B.position.z); });
      }
    }
    return {play, aim, stop:W.stop};
  }

  /* you in goal: their striker runs up and shoots; you dive.
     runup(ms) brings him in; release(x, y, curl, ms) is his shot to that point of the 2D goal; dive(x, y, rot, ms) is you;
     finish(saved) is the ball in your gloves, or in the net */
  function save(stage, o){
    if (!stage || !fast()) return null;
    const W = world(stage, o, "save"), {B, bs, taker, K, kp, ks, kz, D} = W;
    // he starts further back for his run-up
    const start = new THREE.Vector3(-1.5, 0, D + 2.6), plant = taker.root.position.clone(); taker.root.position.copy(start);
    let flying = null, spinAxis = new THREE.Vector3(1, 0, 0), released = false;
    const rc = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -kz), hitP = new THREE.Vector3();
    return {
      stop:W.stop,
      // a tap on the picture, as a point of the 2D goal (x 30-270 post to post, y 20 bar to 124 line)
      toGoal(cx, cy){ const r = W.r.domElement.getBoundingClientRect(); rc.setFromCamera(new THREE.Vector2((cx - r.left)/r.width*2 - 1, -(cy - r.top)/r.height*2 + 1), W.cam);
        return rc.ray.intersectPlane(plane, hitP) ? [150 + hitP.x/3.66*120, 124 - hitP.y/2.44*104] : null; },
      runup(ms){ W.mode = "run"; const t1 = performance.now();
        W.tween(Math.max(300, ms - 200), k=>{ const e = k*k*(3 - 2*k); taker.root.position.lerpVectors(start, plant, e); pose(taker, "run", (performance.now() - t1)/1000, 1 - k*.6); pose(K, "ready", (performance.now() - W.t0)/1000); }); },
      release(x, y, curl, ms){
        if (released) return; released = true; W.mode = "shoot";
        const tgt = new THREE.Vector3(gx(x), Math.max(.11, gy(y)), 0), from = B.position.clone(), cv = (curl || 0)/120*3.66;
        spinAxis = new THREE.Vector3(1, curl ? -.4*Math.sign(curl) : 0, 0).normalize();
        W.tween(200, k=>pose(taker, "kick", .45 + .55*k));
        flying = W.tween(ms, k=>{ const e = ease(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e), from.y + (tgt.y - from.y)*e + .25*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); W.trailPush(); bs.position.set(B.position.x, .006, B.position.z); });
        return flying;
      },
      dive(x, y, rot, ms){
        const kTo = kTarget(x, y).setZ(kz), kFrom = kp.position.clone(), roll = -(rot || 0)*Math.PI/180;
        return W.tween(ms, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; pose(K, "dive", Math.abs(roll) > .2 ? e : e*.3); ks.position.x = kp.position.x; });
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
          const hand = new THREE.Vector3(); (K.real ? K.bones[(p0.x < 0 ? "L" : "R") + "_Hand"] : K.rig.elbow[p0.x < 0 ? -1 : 1]).getWorldPosition(hand);
          await W.tween(220, k=>{ B.position.lerpVectors(p0, hand.clone().add(new THREE.Vector3(0, 0, .25)), ease(k)); });
        } else await W.inNet(spinAxis);
      }
    };
  }


  /* ---------- level 2: headers, tackles and blocks, crosses ---------- */
  let spinX0 = null; const SX = () => spinX0 ||= new THREE.Vector3(1, 0, 0);
  // a ball's flight from a to b over ms, rising h at the top of the arc
  const flight = (W, a, b, ms, h, after) => W.tween(ms, k=>{ const e = k; W.ballTo(a.x + (b.x - a.x)*e, Math.max(.11, a.y + (b.y - a.y)*e + h*4*e*(1 - e)), a.z + (b.z - a.z)*e); W.B.rotateOnAxis(SX(), -.3); W.trailPush(); after && after(k); });

  /* a header: the cross comes in from the right wing, you rise and head it at goal. The ring game drives the ball (k);
     at is where it's met, as a point on the stage, for the rings */
  function header(stage, o){
    if (!stage || !fast()) return null;
    const H = new THREE.Vector3(-1.1, 2.05, 7.2), start = new THREE.Vector3(7.2, .11, 3.6);   // a cross from near the byline on the right
    const W = base(stage, o, start), {cam} = W;
    const me = W.add(o.me, H.x, H.z + .35, Math.PI), mk = W.add(o.marker, H.x + .75, H.z + .9, Math.PI + .4);
    const crosser = W.add(o.crosser, start.x + .45, start.z - .35, -Math.PI/2 + .35);
    const kz = .5, kp = grp(0, .94, kz), K = makePlayer(o.keeper); K.root.position.y = -.94; kp.add(K.root); W.scene.add(kp); W.dyn.push(kp);
    cam.fov = 44; cam.position.set(2.6, 4.1, 18.5); cam.lookAt(.6, 1.3, 4); cam.updateProjectionMatrix();
    W.idle = t => { pose(me, "idle", t); pose(mk, "idle", t + 1); pose(crosser, "idle", t + 2); pose(K, "ready", t); };
    W.start();
    let kicked = false;
    return {stop:W.stop, at:W.toStage(H),
      // the cross on its way: 0 when it's struck, 1 when it reaches you
      k(k){ if (!kicked && k > 0){ kicked = true; W.rec = []; W.tween(220, q=>pose(crosser, "kick", .45 + .55*q)); }
        const e = Math.min(1.15, k); W.ballTo(start.x + (H.x - start.x)*e, Math.max(.11, start.y + (H.y - start.y)*e + 3.2*Math.sin(Math.min(1, e)*Math.PI)), start.z + (H.z - start.z)*e); W.B.rotateOnAxis(SX(), -.2); W.trailPush(); },
      // you meet it (on: you got your head to it); q has the 2D goal's numbers for where it goes and where the keeper goes
      async finish(q){
        W.mode = "play";
        const jump = W.tween(260, k=>{ me.at.position.y = Math.sin(k*Math.PI)*.42; pose(me, "header", k); });
        if (!q.goal) W.rec = null;
        if (!q.on){ await jump; await flight(W, W.B.position.clone(), new THREE.Vector3(H.x - 3, 3.4, H.z - 12), 520, .6); W.fadeTrail(); return; }
        const tgt = new THREE.Vector3(gx(q.tx), Math.max(.11, gy(q.ty)), q.ty < 18 ? -3 : 0);
        const kFrom = kp.position.clone(), kTo = new THREE.Vector3(gx(q.kx), Math.max(.55, gy(q.ky)), kz), roll = -(q.rot || 0)*Math.PI/180;
        await Promise.all([jump, flight(W, W.B.position.clone(), tgt, 380, .15),
          W.tween(330, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; pose(K, "dive", Math.abs(roll) > .2 ? e : e*.4); })]);
        if (q.goal){ await W.inNet(SX()); W.goalShow(me, new THREE.Vector3(-3.6, 0, 10.2), new THREE.Vector3(-9, 3.6, 13.5), new THREE.Vector3(0, 1.1, 3.5)); }
        else { W.fadeTrail(); const p0 = W.B.position.clone(); await W.tween(420, k=>W.ballTo(p0.x + Math.sign(p0.x || 1)*1.4*ease(k), Math.max(.11, p0.y + .2*k - 1.2*k*k), p0.z + 1.4*ease(k))); }
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
        them.at.position.z = Z(p); pose(them, "run", performance.now()/1000, 1);
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
        await Promise.all([slide, W.tween(520, k=>{ const v2 = Math.min(1.4, p) + k*.6; if (block){ W.ballTo(.3 - v2*.3, .11 + v2*.3, Z(v2)); W.trailPush(); } else { them.at.position.z = Math.min(zEnd, Z(v2)); them.at.position.x = .3 + k*1.7; pose(them, "run", performance.now()/1000, 1); W.ballTo(them.at.position.x, .11, them.at.position.z + .55); } })]);
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
    const kz = .6, kp = grp(0, .94, kz), K = makePlayer(o.keeper); K.root.position.y = -.94; kp.add(K.root); scene.add(kp); W.dyn.push(kp);
    // the green spots where the runners want it
    o.spots.forEach(([x, y, r])=>{ const c = P3(x, y), d = new THREE.Mesh(new THREE.CircleGeometry(r*.12, 28), new THREE.MeshBasicMaterial({color:0x4ADE80, transparent:true, opacity:.3, depthWrite:false}));
      d.rotation.x = -Math.PI/2; d.position.set(c.x, .02, c.z); scene.add(d);
      const ring = new THREE.Mesh(new THREE.RingGeometry(r*.12 - .05, r*.12, 32), new THREE.MeshBasicMaterial({color:0x4ADE80})); ring.rotation.x = -Math.PI/2; ring.position.set(c.x, .025, c.z); scene.add(ring); });
    cam.fov = 44; cam.position.set(cw.x + side*5.5, 5.2, cw.z + 9.5); cam.lookAt(side*1.2, .4, 6.2); cam.updateProjectionMatrix();
    W.idle = t => { pose(me, "idle", t); pose(K, "ready", t); };
    W.start();
    const runT = () => performance.now()/1000;
    return {stop:W.stop,
      ballStage(){ return W.toStage(W.B.position); },
      // a runner (or the defender marking him) at a point of the 2D pitch: returns where he is on the stage, head height
      run(i, x, y){ const P = i < 0 ? mk : runners[i], v = P3(x, y); P.at.position.set(v.x, 0, v.z); pose(P, "run", runT() + i*.37, 1); v.y = 1.9; return W.toStage(v); },
      // the cross to runner i: what became of it (q.res: "assist", "saved", "cleared", "wasted")
      async go(i, spot, q){
        W.mode = "play"; W.rec = q.res==="assist" ? [] : null; runners.forEach(R=>pose(R, "idle", 0)); pose(mk, "idle", 0);
        await W.tween(200, k=>pose(me, "kick", .45 + .55*k));
        const s = P3(...spot); s.y = q.res==="wasted" ? .11 : 1.9;
        await flight(W, W.B.position.clone(), s, 520, 3.2);
        const R = runners[i];
        if (q.res==="assist" || q.res==="saved"){
          const tx = (Math.random() < .5 ? -1 : 1)*(1.5 + Math.random()*1.6), tgt = new THREE.Vector3(tx, .6 + Math.random()*1.4, 0);
          await Promise.all([W.tween(240, k=>{ R.at.position.y = Math.sin(k*Math.PI)*.4; pose(R, "header", k); }), flight(W, W.B.position.clone(), q.res==="assist" ? tgt : new THREE.Vector3(tx*.4, 1.3, kz + .3), 360, .1),
            W.tween(330, k=>{ const e = ease(k); kp.position.x = (q.res==="assist" ? -tx*.4 : tx*.4)*e; })]);
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
    const D = (lo + hi)/2, W = base(stage, {}, new THREE.Vector3(0, .11, D)), {scene, cam} = W, c0 = fr(D); W.looks = MLOOKS;
    cam.fov = c0.fov; cam.position.copy(c0.position); cam.quaternion.copy(c0.quaternion); cam.updateProjectionMatrix();
    // a 2D goal drawn at an angle (the finesse shot's) is front-on here, so its swipe lines up with the 3D goal
    const tilt = svg.style.cssText; if (tilt){ svg.style.cssText = ""; const st0 = W.stop; W.stop = () => { st0(); if (svg.isConnected) svg.style.cssText = tilt; }; }
    const rc = new THREE.Raycaster(), hit = new THREE.Vector3(), plane = new THREE.Plane(), nz = new THREE.Vector3(0, 0, 1), ny = new THREE.Vector3(0, 1, 0);
    const cast = (x, y, onZ) => { rc.setFromCamera(new THREE.Vector2(x/150 - 1, 1 - y/90), cam); if (onZ != null) plane.set(nz, -onZ); else plane.set(ny, 0); return rc.ray.intersectPlane(plane, hit) ? hit.clone() : null; };
    // their keeper (or you, in goal), on his line
    const kz = .4, kp = grp(0, .94, kz), K = makePlayer(svg.dataset.kme ? W.looks.me && {...W.looks.me, gk:true, c1:"#F97316"} || {skin:"#B57D52", c1:"#F97316", c2:"#111827", gk:true, num:1} : {skin:"#D9A37A", c1:"#65A30D", c2:"#111827", gk:true, num:1, hair:"short", hairCol:"#17130F"});
    K.root.position.y = -.94; kp.add(K.root); scene.add(kp);
    const men = new Map(), seen = new Set(), T = () => performance.now()/1000;
    const kme = !!svg.dataset.kme, tk = W.add(kme ? {...W.looks.anyone({}), c1:"#E5E7EB", c2:"#1F2937", num:9} : {...W.looks.me, c1:W.looks.me.c1}, -.72, D + .62, Math.PI + .3);
    let kickAt = 0, s0 = null;
    W.idle = () => {
      const sv = svg.getScreenCTM(); if (!sv) return; const inv = sv.inverse(); seen.clear();
      // the strike: 2D's boot swinging in (a shot), or the ball setting off (a shot at you)
      const now = performance.now(), b0 = svg.querySelector("#lvBall"), bs0 = b0 ? Math.hypot(...(m => [m.a, m.b])(inv.multiply(b0.getScreenCTM()))) : 1;
      if (s0==null) s0 = bs0;
      if (!kickAt && (svg.querySelector(".lv-boot") || bs0 < s0 - .01)) kickAt = now;
      if (kickAt) pose(tk, "kick", Math.min(1, (now - kickAt)/300)); else pose(tk, "idle", T());
      const kel = svg.querySelector("#lvKp");
      if (kel && kel.getClientRects().length){ const m = inv.multiply(kel.getScreenCTM()), rot = Math.atan2(m.b, m.a), p = cast(m.e, m.f, kz);
        if (p){ kp.position.set(p.x, Math.max(.55, p.y), kz); kp.rotation.z = -rot; } kp.visible = true;
        if (Math.abs(rot) > .2 || kel.classList.contains("dive")) pose(K, "dive", Math.min(1, Math.abs(rot)/1.1 + .3)); else pose(K, "ready", T()); } else kp.visible = false;
      // the ball: how far it's come from its 2D size, then cast through the picture at that depth
      const bb = svg.querySelector("#lvBall > .lv-bb") || svg.querySelector("g[id] > .lv-bb");
      if (bb){ const g = bb.parentNode, m = inv.multiply(g.getScreenCTM()), s = Math.hypot(m.a, m.b), q = clamp((1 - s)/.4, 0, 1.15), tz = /translate\(\s*[-\d.]+[ ,]+([-\d.]+)/.exec(bb.getAttribute("transform") || "");
        const lift = tz ? -(+tz[1])*s : 0, p = cast(m.e, m.f - lift, D*(1 - q)); if (p){ W.B.position.set(p.x, Math.max(.11, p.y), p.z); W.bs.position.set(p.x, .006, p.z); } W.B.rotation.x -= .08; }
      // anyone else: a wall, a striker, on the grass
      svg.querySelectorAll(".lv-man").forEach(el=>{ if (!el.getClientRects().length) return; seen.add(el); let M = men.get(el);
        if (!M){ const k = el.dataset.k || "#1D4ED8"; M = W.add({...W.looks.anyone(el), c1:k, c2:(typeof LV_TRIM!=="undefined" && LV_TRIM[k]) || "#FFFFFF", num:el.dataset.n || ""}, 0, 0, 0); men.set(el, M); }
        const m = inv.multiply(el.getScreenCTM()), p = cast(m.e, m.f); if (p) M.at.position.copy(p);
        pose(M, el.closest(".lv-wall") || p && p.z > 3 ? "wall" : "idle", T()); });
      men.forEach((M, el)=>{ M.at.visible = seen.has(el); });
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
    const W = base(stage, {cam, noLines:true}, G(150, 90, .11)), {scene} = W;
    if (V.track){ // side-on: the middle of the picture is the grass behind the line of play, and there's no goal in it
      O.copy(new THREE.Vector3(...V.o)).addScaledVector(ey, (90 - V.track)*MK/SE); scene.children.forEach(o=>{ if (o.isLineSegments || (o.isMesh && o.geometry && o.geometry.type==="CylinderGeometry")) o.visible = false; });
      const back = G(150, 124), bd = scene.children.find(o=>o.isMesh && o.material && o.material.map===boardTex), cr = scene.children.find(o=>o.isMesh && o.material && o.material.map===crowdTex);
      if (bd){ bd.position.set(back.x, .45, back.z); bd.scale.set(.6, 1, 1); }
      if (cr){ cr.position.set(back.x, 5.4, back.z - .05); cr.rotation.x = 0; cr.scale.set(.42, .45, 1); } }
    // a 2D scene with no goal in it (the slalom's course): no goal, and the stand behind it pushed well back
    if (svg.dataset.nogoal){ scene.children.forEach(o=>{ if (o.isLineSegments || o.renderOrder===-1 || (o.isMesh && o.geometry && o.geometry.type==="CylinderGeometry")) o.visible = false; });
      if (W.crowd[0]) W.crowd[0].parent.position.z -= 60; }
    // the 2D pitch's own markings (its boxes, arcs and centre circle), traced onto the grass
    const mk = svg.querySelector('g[fill="none"]');
    if (mk){ const pts = [];
      mk.querySelectorAll("rect, path, circle, line").forEach(el=>{ if (!el.getTotalLength) return; const L = el.getTotalLength(), n = Math.max(2, Math.ceil(L/4)); let prev = null;
        for (let i = 0; i <= n; i++){ const q = el.getPointAtLength(L*i/n), v = G(q.x, q.y, .02); if (prev) pts.push(prev.x, prev.y, prev.z, v.x, v.y, v.z); prev = v; } });
      const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color:0xF2F5EF, transparent:true, opacity:.85}))); }
    W.B.scale.setScalar(1.8); W.bs.scale.setScalar(1.8); scene.fog = null;   // (the camera's 80 m off: the stadium's fog would hide everything)
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
        let B = balls.get(g); if (!B){ B = i===0 && !balls.size ? W.B : (()=>{ const b = ball(); b.scale.setScalar(1.8); scene.add(b); return b; })(); balls.set(g, B); }
        if (V.track) G(m.e, V.track, .11*1.8 + Math.max(0, V.track - m.f + z)*MK/CE, B.position); else G(m.e, m.f, .11*1.8 + Math.max(0, z)*MK/CE, B.position);
        B.rotation.x -= .05; seen.add(g); if (!ballAt) ballAt = B.position.clone();
        if (B===W.B) W.bs.position.set(B.position.x, .006, B.position.z);
      });
      balls.forEach((B, g)=>{ B.visible = seen.has(g); });
      svg.querySelectorAll(".lv-man").forEach(el=>{
        if (!el.getClientRects().length) return; seen.add(el);
        let M = men.get(el);
        if (!M){ M = W.add(lookFor(el), 0, 0, 0); M.root.scale.setScalar(1.3); M.last = null; M.v = 0; M.yaw = null; men.set(el, M); }
        const m = inv.multiply(el.getScreenCTM()), p = G(m.e, m.f), at = M.at;
        // facing: the way he's moving, or towards the ball
        if (M.last){ const d = p.clone().sub(M.last), sp = d.length()/Math.max(.001, (now - M.lt)/1000); M.v = M.v*.8 + sp*.2; if (d.lengthSq() > 1e-6) M.yaw = Math.atan2(d.x, d.z); }
        else if (ballAt) M.yaw = Math.atan2(ballAt.x - p.x, ballAt.z - p.z);
        if (M.v < .6 && ballAt && p.distanceTo(ballAt) > .5) M.yaw = Math.atan2(ballAt.x - p.x, ballAt.z - p.z);
        M.last = p.clone(); M.lt = now; at.position.copy(p); if (M.yaw!=null) at.rotation.y += Math.atan2(Math.sin(M.yaw - at.rotation.y), Math.cos(M.yaw - at.rotation.y))*.3;
        // what he's doing: the 2D picture's own animations (kick, hop, cheer), a dive (his tilt), running, or standing
        const cls = el.classList, anc = el.parentNode && el.parentNode.classList, rot = Math.atan2(m.b, m.a);
        const flag = (k, on) => { if (on){ M[k] ||= now; return (now - M[k])/1000; } M[k] = 0; return -1; };
        const kick = flag("kickAt", cls.contains("kick")), hop = flag("hopAt", cls.contains("hop")), cheer = flag("cheerAt", cls.contains("cheer") || (el.closest(".cheer") != null));
        M.root.rotation.z = 0;
        if (kick >= 0) pose(M, "kick", Math.min(1, kick/.33));
        else if (hop >= 0){ pose(M, "header", Math.min(1, hop/.46)); at.position.y = Math.sin(Math.min(1, hop/.46)*Math.PI)*.4; }
        else if (cheer >= 0) pose(M, "cheer", cheer);
        else if (Math.abs(rot) > .35 || (anc && anc.contains("dive")) || el.closest(".dive")){ pose(M, "dive", Math.min(1, Math.abs(rot)/1.1)); M.root.rotation.z = -rot; }
        else if (M.v > .7 || el.querySelector(".lv-legs.run")) pose(M, "run", T()*(.8 + Math.min(1.4, M.v/5)));
        else pose(M, "idle", T() + (M.root.id%7));
      });
      men.forEach((M, el)=>{ M.at.visible = seen.has(el); if (!el.isConnected){ scene.remove(M.at); men.delete(el); } });
      // props the 2D game draws (slalom poles), stood where they are
      svg.querySelectorAll("[data-prop]").forEach(el=>{ let P = props.get(el);
        if (!P){ P = new THREE.Group(); const pm = new THREE.Mesh(geo("pole", ()=>new THREE.CylinderGeometry(.035, .035, 1.7, 10)), mat("#F8FAFC", .4)); pm.position.y = .85; P.add(pm);
          const fl = new THREE.Mesh(geo("flag", ()=>{ const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.7, 0, .45, 1.55, 0, 0, 1.4, 0], 3)); g.computeVertexNormals(); return g; }), mat("#F97316", .6, {side:THREE.DoubleSide})); P.add(fl); scene.add(P); props.set(el, P); }
        const m = inv.multiply(el.getScreenCTM()); G(m.e, m.f, 0, P.position); P.visible = !!el.getClientRects().length; });
    };
    const props = new Map();
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
