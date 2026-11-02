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
  function makePlayer(look){
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
  /* the stadium for a shot or a save: the goal, the ball on its spot, the man taking it and the man in goal.
     role "shot": you take it (o.me) against their keeper (o.keeper); role "save": their striker (o.taker) against you (o.gk) */
  function world(stage, o, role){
    if (!SR){ SR = {r:makeRenderer(), scene:new THREE.Scene(), cam:new THREE.PerspectiveCamera(40, 300/180, .1, 120)}; }
    const {r, scene, cam} = SR; clear(scene); scene.fog = null; scene.background = new THREE.Color(0x07120C);
    const D = DIST[o.v] ?? 13;
    lights(scene, {hemi:1.3, key:2.3, keyZ:8, rim:.9, fill:1.1});
    pitch(scene, D); const net = goalFrame(scene); stands(scene, o.crowd || "#F5C542");
    const B = ball(); B.position.set(0, .11, D); scene.add(B);
    const bs = blob(.36, .36); bs.position.set(0, .006, D); scene.add(bs);
    // a faint trail behind the ball, so you can follow it into the far corner
    const TN = 14, trailPos = new Float32Array(TN*3), trailG = new THREE.BufferGeometry(); trailG.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trail = new THREE.Line(trailG, new THREE.LineBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.5})); trail.visible = false; trail.frustumCulled = false; scene.add(trail);
    const trailPush = () => { if (!trail.visible){ for (let i = 0; i < TN; i++) trailPos.set([B.position.x, B.position.y, B.position.z], i*3); trail.visible = true; }
      trailPos.copyWithin(3, 0, (TN - 1)*3); trailPos[0] = B.position.x; trailPos[1] = B.position.y; trailPos[2] = B.position.z; trailG.attributes.position.needsUpdate = true; };
    // the taker: a step behind the ball and to its left, side-on to it
    const taker = makePlayer(role==="shot" ? o.me : o.taker); taker.root.position.set(-.72, 0, D + .62); taker.root.rotation.y = Math.PI + .3; scene.add(taker.root);
    // the keeper on his line (off it, one-on-one)
    const kz = o.v==="oneonone" ? 2.6 : o.v==="pen" ? .1 : .4;
    const kp = grp(0, .94, kz), K = makePlayer(role==="shot" ? o.keeper : o.gk); K.root.position.y = -.94; kp.add(K.root); scene.add(kp);
    const ks = blob(1, .7); ks.position.set(0, .006, kz); scene.add(ks);
    // a wall for free kicks, 9.15 m out
    if (o.v==="freekick") for (let i = 0; i < 4; i++){ const w = makePlayer(o.wall); w.root.position.set(-.75 + i*.5, 0, D - 9.15); scene.add(w.root); POSE.idle(w.rig, i);
      w.rig.arm[-1].rotation.x = w.rig.arm[1].rotation.x = -.6; w.rig.arm[-1].rotation.z = .35; w.rig.arm[1].rotation.z = -.35; }
    // the camera: high behind the ball and dead centre, so the taker sits below the goal and both corners are clear.
    // The picture's shifted so the ball lands at (50%, 92%) of the stage, where your finger goes
    const camAt = new THREE.Vector3(0, 2.75, D + 4.7);
    { // angles below the horizontal to the ball and to just over the bar; find the tilt c that puts them at 92% and 13% down
      const aB = Math.atan2(camAt.y - .11, camAt.z - D), aG = Math.atan2(camAt.y - 2.75, camAt.z), fB = .844, fG = -.74;
      let lo = aG + 1e-4, hi = aB - 1e-4; for (let i = 0; i < 50; i++){ const c = (lo + hi)/2, r0 = Math.tan(aB - c)/Math.tan(aG - c); if (r0 < fB/fG) lo = c; else hi = c; }
      const c = (lo + hi)/2, T = Math.tan(aB - c)/fB;
      cam.fov = 2*Math.atan(T)*180/Math.PI; cam.position.copy(camAt); cam.lookAt(0, camAt.y - Math.tan(c)*10, camAt.z - 10); cam.clearViewOffset(); cam.updateProjectionMatrix(); }
    const host = stage; host.classList.add("g3"); host.prepend(r.domElement); r._w = 0;
    const anims = new Set(); let t0 = performance.now(), raf = 0, stopped = false;
    const W = {r, scene, cam, B, bs, trail, trailPush, taker, K, kp, ks, kz, D, net, mode:"idle", t0};
    const aim = () => {};
    // watch how fast it draws: too slow, and drop the resolution; still too slow, and the next moments are 2D
    let nf = 0, last = 0, sum = 0, cnt = 0;
    const watch = now => { if (last && ++nf > 4){ sum += now - last; cnt++;
        if (cnt >= 12){ const avg = sum/cnt; sum = cnt = 0;
          if (avg > 45){ if (r.getPixelRatio() > 1){ r.setPixelRatio(1); r._w = 0; } else { slow = true; try{ sessionStorage.setItem("efp-3d-slow", "1"); }catch(e){} } } } }
      last = now; };
    const frame = now => {
      raf = 0; if (stopped) return; if (!r.domElement.isConnected){ W.stop(); return; }
      watch(now);
      if (fit(r, cam, host)) aim();
      const t = (now - t0)/1000;
      if (W.mode==="idle"){ POSE.idle(taker.rig, t); POSE.ready(K.rig, t); }
      anims.forEach(f=>f(now)); net.update(now);
      r.render(scene, cam); raf = requestAnimationFrame(frame);
    };
    try{ r.compile(scene, cam); }catch(e){}
    raf = requestAnimationFrame(frame);
    W.stop = () => { stopped = true; if (raf) cancelAnimationFrame(raf); raf = 0; host.classList.remove("g3"); r.domElement.remove(); };
    // an animation step run every frame for ms milliseconds (several can run at once)
    W.tween = (ms, f) => new Promise(res=>{ const a = performance.now(); const g = now=>{ const k = Math.min(1, Math.max(0, now - a)/ms); f(k); if (k>=1){ anims.delete(g); res(); } }; anims.add(g); if (stopped) res(); });
    // the ball into the net: it hits the back of the net, which bulges and ripples, and drops
    W.inNet = async (spinAxis) => { const p0 = B.position.clone(), back = -net.D + .11;
      net.touch(B.position);
      // across the goal to the back of the net
      const t1 = Math.max(90, Math.abs(back - p0.z)*90);
      await W.tween(t1, k=>{ B.position.set(p0.x*(1 - .06*k), Math.max(.11, p0.y - .12*k*k), p0.z + (back - p0.z)*k); trailPush(); B.rotateOnAxis(spinAxis, -.25); });
      W.tween(300, k=>{ trail.material.opacity = .5*(1 - k); }).then(()=>{ trail.visible = false; });
      // the net stretches round it and stops it…
      const p1 = B.position.clone();
      await W.tween(230, k=>{ const e = 1 - Math.pow(1 - k, 3); B.position.set(p1.x, p1.y - .06*k, back - .45*e); B.rotateOnAxis(spinAxis, -.1*(1 - k)); });
      // …then throws it back out, and it drops into the goal
      const p2 = B.position.clone();
      await W.tween(620, k=>{ const e = k*k*(3 - 2*k); B.position.set(p2.x, Math.max(.11, p2.y + .08*Math.sin(k*Math.PI) - (p2.y - .11)*k*k), p2.z + .7*e); });
      net.touch(null);
    };
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
    async function play(q){
      W.mode = "shoot"; W.tween(250, k=>{ aimL.material.opacity = .85*(1 - k); aimM.material.opacity = .9*(1 - k); }).then(()=>{ aimL.visible = aimM.visible = false; });
      // the harder the strike, the quicker the leg comes through
      const sw = clamp(300 - (q.power ?? .7)*120, 170, 300);
      await W.tween(sw, k=>{ POSE.kick(taker.rig, k*.55); POSE.ready(K.rig, (performance.now() - W.t0)/1000); });
      const tgt = new THREE.Vector3(gx(q.wx), Math.max(.11, gy(q.ty)), 0);
      if (q.wall) tgt.set(gx(q.wx), 1.2, D - 9.15 + .35);
      const from = B.position.clone(), arcH = (q.h || 0)/104*2.44, cv = (q.curve || 0)/120*3.66;
      const kTo = kTarget(q.kx, q.ky).setZ(kz), kFrom = kp.position.clone(), roll = -(q.rot || 0)*Math.PI/180, fov0 = cam.fov;
      const spinAxis = new THREE.Vector3(1, q.curve ? -.4*Math.sign(q.curve) : 0, 0).normalize();
      await Promise.all([
        W.tween(sw*1.05, k=>POSE.kick(taker.rig, .55 + .45*k)),
        W.tween(q.ms, k=>{ const e = ease(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e), from.y + (tgt.y - from.y)*e + arcH*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); W.trailPush(); bs.position.set(B.position.x, .006, B.position.z); bs.scale.setScalar(Math.max(.3, 1 - B.position.y*.25));
          cam.fov = fov0 - 3*e; cam.updateProjectionMatrix(); }),   // a slight zoom as it flies
        W.tween(q.kms, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; POSE.dive(K.rig, Math.abs(roll) > .2 ? e : e*.4); ks.position.x = kp.position.x; })
      ]);
      const p0 = B.position.clone(), fade = () => W.tween(300, k=>{ W.trail.material.opacity = .5*(1 - k); }).then(()=>{ W.trail.visible = false; });
      if (q.goal){
        W.mode = "goal";
        const tc = performance.now(); W.tween(1400, k=>POSE.cheer(taker.rig, (performance.now() - tc)/1000));
        await W.inNet(spinAxis);
      } else if (q.over || q.wide){ fade();
        await W.tween(360, k=>{ B.position.set(p0.x + (q.wide ? Math.sign(p0.x)*1.5*k : 0), p0.y + (q.over ? .6*k : -.1*k), p0.z - 6*k); });
      } else if (q.wood){ fade();
        await W.tween(420, k=>{ B.position.set(p0.x - Math.sign(p0.x)*.8*k, Math.max(.11, p0.y - 1.2*k*k + .2*k), p0.z + 4*ease(k)); });
      } else if (q.wall){ fade();
        await W.tween(420, k=>{ B.position.set(p0.x + .6*k, Math.max(.11, p0.y + .3*k - 1.2*k*k), p0.z + 3.5*ease(k)); });
      } else { fade();   // saved: pushed away
        await W.tween(460, k=>{ B.position.set(p0.x + Math.sign(p0.x || 1)*1.6*ease(k), Math.max(.11, p0.y + .25*k - 1.1*k*k), p0.z + 1.2*ease(k)); bs.position.set(B.position.x, .006, B.position.z); });
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
        W.tween(Math.max(300, ms - 200), k=>{ const e = k*k*(3 - 2*k); taker.root.position.lerpVectors(start, plant, e); POSE.run(taker.rig, (performance.now() - t1)/1000, 1 - k*.6); POSE.ready(K.rig, (performance.now() - W.t0)/1000); }); },
      release(x, y, curl, ms){
        if (released) return; released = true; W.mode = "shoot";
        const tgt = new THREE.Vector3(gx(x), Math.max(.11, gy(y)), 0), from = B.position.clone(), cv = (curl || 0)/120*3.66;
        spinAxis = new THREE.Vector3(1, curl ? -.4*Math.sign(curl) : 0, 0).normalize();
        W.tween(200, k=>POSE.kick(taker.rig, .45 + .55*k));
        flying = W.tween(ms, k=>{ const e = ease(k); B.position.set(from.x + (tgt.x - from.x)*e + cv*Math.sin(Math.PI*e), from.y + (tgt.y - from.y)*e + .25*4*e*(1 - e), from.z + (tgt.z - from.z)*e);
          B.rotateOnAxis(spinAxis, -.35); W.trailPush(); bs.position.set(B.position.x, .006, B.position.z); });
        return flying;
      },
      dive(x, y, rot, ms){
        const kTo = kTarget(x, y).setZ(kz), kFrom = kp.position.clone(), roll = -(rot || 0)*Math.PI/180;
        return W.tween(ms, k=>{ const e = ease(k); kp.position.lerpVectors(kFrom, kTo, e); kp.rotation.z = roll*e; POSE.dive(K.rig, Math.abs(roll) > .2 ? e : e*.3); ks.position.x = kp.position.x; });
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
          const hand = new THREE.Vector3(); K.rig.elbow[p0.x < 0 ? -1 : 1].getWorldPosition(hand);
          await W.tween(220, k=>{ B.position.lerpVectors(p0, hand.clone().add(new THREE.Vector3(0, 0, .25)), ease(k)); });
        } else await W.inNet(spinAxis);
      }
    };
  }

  // three.js is fetched once the game's on screen, so it's there by the first shot
  if (typeof window !== "undefined") window.addEventListener("load", ()=>setTimeout(()=>load().then(ok=>{ if (ok && typeof S!=="undefined" && S && typeof render==="function" && document.querySelector(".board .card-top")) G3.cardNow(); }), 400));
  return {on, set, load, ready, glOK, lookOf, card:card, shot, save, cardNow(){ const el = document.querySelector(".board .card-top"); if (el && S && S.player) card.mount(el, S.player, meta(S.club)); }};
})();
