/* ---------- the sound of the ground ----------
   All made here, with no recordings to download: the crowd's murmur under every moment, drawing breath as the ball's
   struck; the roar for a goal, the "ooh" of a near miss or a save, the groan of a miss, applause for good play; the
   thump of a strike, the swish of the net and the referee's whistle. On unless you turn it off (Settings, Sound).
   Phones only let a page make sound after a tap, so it wakes on the first one. */
const SND = (() => {
  const KEY = "efp-sound";
  let on = true; try{ on = localStorage.getItem(KEY) !== "0"; }catch(e){}
  let ac = null, master = null, bed = null, bedGain = null, noiseBuf = null;
  const ctx = () => {
    if (!on) return null;
    if (!ac){ try{ ac = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return null; }
      master = ac.createGain(); master.gain.value = .9;
      // a gentle limiter, so a roar on top of the crowd never clips
      const lim = ac.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 8; lim.ratio.value = 6; lim.attack.value = .005; lim.release.value = .25;
      master.connect(lim); lim.connect(ac.destination); }
    if (ac.state === "suspended") ac.resume().catch(()=>{});
    return ac;
  };
  // a warm noise (white with some brown in it): the raw stuff of a crowd
  const noise = () => { if (noiseBuf) return noiseBuf; const n = ac.sampleRate*3, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    let p = 0; for (let i = 0; i < n; i++){ const w = Math.random()*2 - 1; p = .97*p + .03*w; d[i] = w*.5 + p*3; } noiseBuf = b; return b; };
  const src = () => { const s = ac.createBufferSource(); s.buffer = noise(); s.loop = true; s.playbackRate.value = .85 + Math.random()*.3; return s; };
  const band = (f, q) => { const b = ac.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = f; b.Q.value = q; return b; };
  // now and then the crowd sings: a chant (three rising "oh"s) and claps in time
  let chantT = 0;
  function chant(){ if (!ctx()) return; const beat = .52;
    for (let i = 0; i < 3; i++) voice(380 + i*30, 880 + i*60, .5, .26, 1.04, .06, i*beat);
    for (let i = 0; i < 4; i++) setTimeout(()=>applause(.12, .2), (3*beat + i*beat*.5)*1000); }
  const nextChant = () => { clearTimeout(chantT); chantT = setTimeout(()=>{ if (bedGain && bedGain.gain.value > .05) chant(); nextChant(); }, 9000 + Math.random()*7000); };
  // the crowd's murmur: noise through a few voice-like bands, each swaying slowly on its own
  function ambient(v){
    if (!v){ clearTimeout(chantT); if (bedGain && ac){ bedGain.gain.cancelScheduledValues(ac.currentTime); bedGain.gain.setTargetAtTime(0, ac.currentTime, .5); } return; }
    if (!ctx()) return; nextChant();
    if (!bed){
      bedGain = ac.createGain(); bedGain.gain.value = 0; bedGain.connect(master);
      bed = [[300, .5], [650, .45], [1250, .3], [2500, .1]].map(([f, w], i)=>{ const s = src(), bp = band(f, 1.1), g = ac.createGain(); g.gain.value = w;
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .11 + i*.07; lg.gain.value = w*.35; lfo.connect(lg); lg.connect(g.gain); lfo.start();
        s.connect(bp); bp.connect(g); g.connect(bedGain); s.start(); return s; });
    }
    bedGain.gain.cancelScheduledValues(ac.currentTime); bedGain.gain.setTargetAtTime(.15, ac.currentTime, .7);
  }
  // the crowd drawing breath: a swell that settles back
  function swell(dur = .9, peak = .28){ if (!ctx() || !bedGain) return; const t = ac.currentTime, g = bedGain.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(peak, t + dur*.6); g.setTargetAtTime(.15, t + dur, .9); }
  // a crowd's voice: noise through formant bands (a vowel), shaped, gliding in pitch
  function voice(f1, f2, dur, level, glide = 1, attack = .12, delay = 0){
    if (!ctx()) return; const t = ac.currentTime + delay, s = src(), out = ac.createGain(); out.gain.value = 0;
    [[f1, 4, 1], [f2, 5, .6], [f2*2.2, 3, .2]].forEach(([f, q, w])=>{ const bp = band(f, q); bp.frequency.setValueAtTime(f, t); bp.frequency.linearRampToValueAtTime(f*glide, t + dur);
      const g = ac.createGain(); g.gain.value = w; s.connect(bp); bp.connect(g); g.connect(out); });
    out.connect(master); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(level, t + attack); out.gain.setTargetAtTime(0, t + dur*.55, dur*.3);
    s.start(t); s.stop(t + dur*1.9);
  }
  const roar = () => { voice(520, 1150, 4.4, .9, 1.12, .25); voice(380, 900, 3.4, .55, 1.05, .35); voice(640, 1450, 2.6, .4, 1.1, .2, .6); swell(4, .36); };
  const ooh = () => voice(340, 760, 1.6, .55, .8, .18);
  const groan = () => voice(250, 540, 1.6, .45, .76, .22);
  function applause(len = 1.6, level = .14){ if (!ctx()) return; const t = ac.currentTime, s = src(), hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1700;
    const g = ac.createGain(), am = ac.createOscillator(), ag = ac.createGain(); am.type = "square"; am.frequency.value = 9; ag.gain.value = level*.3; am.connect(ag); ag.connect(g.gain); am.start(t); am.stop(t + len*2);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .15); g.gain.setTargetAtTime(0, t + len, .45); s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + len*2); }
  // the ball struck: a low thump and the click of the boot, and the crowd draws breath
  function kick(hard = .8){ if (!ctx()) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(46, t + .12); g.gain.setValueAtTime(1*hard, t); g.gain.exponentialRampToValueAtTime(.001, t + .17);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .2);
    const s = src(), bp = band(2600, 1.2), cg = ac.createGain(); cg.gain.setValueAtTime(.32*hard, t); cg.gain.exponentialRampToValueAtTime(.001, t + .035); s.connect(bp); bp.connect(cg); cg.connect(master); s.start(t); s.stop(t + .06);
    swell(); }
  // the net taking the ball: a soft swish
  function net(){ if (!ctx()) return; const t = ac.currentTime, s = src(), bp = band(3200, .8), g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + .35);
    s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + .4); }
  // the referee's whistle: a pea whistle's trill, n blasts
  function whistle(len = .35, n = 1){ if (!ctx()) return;
    for (let i = 0; i < n; i++){ const t = ac.currentTime + i*(len + .12), o = ac.createOscillator(), fm = ac.createOscillator(), fg = ac.createGain(), g = ac.createGain();
      o.type = "sine"; o.frequency.value = 3050; fm.frequency.value = 34; fg.gain.value = 170; fm.connect(fg); fg.connect(o.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.15, t + .02); g.gain.setValueAtTime(.15, t + len - .05); g.gain.linearRampToValueAtTime(0, t + len);
      o.connect(g); g.connect(master); o.start(t); fm.start(t); o.stop(t + len + .02); fm.stop(t + len + .02); } }
  // rain: a soft hiss over everything, on or off
  let rainG = null;
  function rain(v){
    if (!v){ if (rainG && ac) rainG.gain.setTargetAtTime(0, ac.currentTime, .6); return; }
    if (!ctx()) return;
    if (!rainG){ rainG = ac.createGain(); rainG.gain.value = 0; const s = src(), hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2400; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000;
      s.connect(hp); hp.connect(lp); lp.connect(rainG); rainG.connect(master); s.start(); }
    rainG.gain.setTargetAtTime(.09, ac.currentTime, .8);
  }
  // the crowd's verdict on a moment (what lvOutcome shows)
  function verdict(R){
    if (!R) return;
    if (R.card){ whistle(R.card==="y" ? .45 : .7, R.card==="y" ? 1 : 2); setTimeout(groan, 500); return; }
    if (R.g || R.a || R.gf){ net(); roar(); return; }
    if (R.ga){ groan(); return; }
    if (R.ok){ applause(R.bonus > .25 ? 2.2 : 1.4, R.bonus > .25 ? .16 : .11); return; }
    if (/save|wood|post|bar|wide|close|inches|fingertip|just|chance/i.test(`${R.big} ${R.small}`)) ooh(); else groan();
  }
  // wake on the first tap (phones won't play before one)
  document.addEventListener("pointerdown", ()=>{ if (on) ctx(); }, {passive:true});
  return {on:()=>on, set(v){ on = !!v; try{ localStorage.setItem(KEY, on ? "1" : "0"); }catch(e){} if (!on){ ambient(false); ac?.suspend?.(); } else { ctx(); } },
    ambient, swell, kick, net, whistle, roar, ooh, groan, applause, verdict, rain};
})();
