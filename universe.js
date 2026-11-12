/* universe.js — 3.3: one universe. A Player Career can be linked to one of your Manager or Director of Football
   saves, and the two then share a world:
   - the player is in that world's squads (★), and follows his Player Career: when he moves clubs, ages or retires
     there, he does in the manager's world too (mgdepth.js puts him there; uniSyncWorld keeps him up to date);
   - sign him in the manager's world and his Player Career gets that offer in its next window, from "you";
   - the Player Career's leagues follow the manager's world: who went up and down there is who's in each division
     here (his own club stays in the division he earned), and if you manage his club, you are his manager.
   Inside the manager's world you can also change role when you change jobs (mgcareer.js): manager one year,
   director the next, in the same save. So one career can run from the pitch to the dugout to the boardroom.
   The two games still play their own matches: results are not shared, only the shape of the world. */
const UNI = {
  key:(mode, i) => typeof Hub!=="undefined" && Hub.key ? Hub.key(mode, i) : null,
  read(mode, i){ try{ return JSON.parse(localStorage.getItem(UNI.key(mode, i))); }catch(e){ return null; } },
  // link (or unlink, with mode null) a Player Career slot and a world
  link(pslot, mode, mslot){
    const pk = UNI.key("player", pslot), d = UNI.read("player", pslot); if (!d) return false;
    if (d.uni){ const o = UNI.read(d.uni.mode, d.uni.slot); if (o && o.uni && o.uni.slot===pslot){ delete o.uni; localStorage.setItem(UNI.key(d.uni.mode, d.uni.slot), JSON.stringify(o)); } delete d.uni; }
    if (mode){ const w = UNI.read(mode, mslot); if (!w) return false;
      if (w.uni && w.uni.slot!==pslot){ const op = UNI.read("player", w.uni.slot); if (op && op.uni){ delete op.uni; localStorage.setItem(UNI.key("player", w.uni.slot), JSON.stringify(op)); } }
      w.uni = {slot:pslot}; localStorage.setItem(UNI.key(mode, mslot), JSON.stringify(w)); d.uni = {mode, slot:mslot}; }
    localStorage.setItem(pk, JSON.stringify(d)); return true;
  },
  worlds(){ const out = []; ["manager", "dof"].forEach(m=>{ for (let i = 1; i<=3; i++){ const w = UNI.read(m, i); if (w && w.mgr && w.club) out.push({mode:m, slot:i, name:w.mgr.name, club:w.club, role:w.role, pslot:w.uni ? w.uni.slot : 0}); } }); return out; }
};

/* ---------- in the Player Career: what the linked world says ---------- */
function uniWorld(){ if (typeof S==="undefined" || !S || !S.uni) return null; const w = UNI.read(S.uni.mode, S.uni.slot); return w && w.mgr && w.tiers ? w : null; }
// on opening the career: who's in charge, and whether your other self has signed you
function uniPull(){
  const W = uniWorld(); if (!W || S.phase==="retired") return;
  S.uniInfo = {name:W.mgr.name, club:W.club, role:W.role==="dof" ? "Director of Football" : "manager", season:W.season};
  if (W.club===S.club && W.role!=="dof" && S.mgrs && S.mgrs[S.club] && S.mgrs[S.club].name!==W.mgr.name){
    S.mgrs[S.club].name = W.mgr.name; note("club", `${W.mgr.name} is your manager`, `In your linked world you manage ${S.club}, so that's who picks the team here too.`); }
}
// a new season in the Player Career: the leagues take their shape from the linked world, if it has played that far
function uniRoll(){
  const W = uniWorld(); if (!W || W.season<S.season - 1) return;
  const T = S.world.tiers, keys = Object.keys(T);
  if (!keys.every(k=>Array.isArray(W.tiers[k]) && W.tiers[k].length===T[k].length)) return;
  const all = new Set(keys.flatMap(k=>T[k])); if (!keys.flatMap(k=>W.tiers[k]).every(c=>all.has(c))) return;   // custom clubs here: leave this world alone
  const mine = keys.find(k=>T[k].includes(S.club)), next = {}; keys.forEach(k=>{ next[k] = W.tiers[k].slice(); });
  const there = keys.find(k=>next[k].includes(S.club));
  if (mine!=null && there!=null && String(mine)!==String(there)){   // your club stays where it finished here: it swaps with the weakest side of that division
    const swap = next[mine].slice().sort((a, b)=>((typeof META!=="undefined" && META[a] ? META[a].r : 0) || 0) - ((typeof META!=="undefined" && META[b] ? META[b].r : 0) || 0))[0];
    next[there][next[there].indexOf(S.club)] = swap; next[mine][next[mine].indexOf(swap)] = S.club; }
  const moved = keys.some(k=>next[k].some(c=>!T[k].includes(c)));
  S.world.tiers = next;
  if (moved) note("info", "The leagues have changed", `Promotion and relegation in your linked world (${W.mgr.name} at ${W.club}) have set this season's divisions.`);
}
// offers: the club you run in the linked world has signed you there, so it comes for you here
function uniOffer(offers, make, feeFor){
  const o = S.uniOffer; if (!o || !o.club || o.club===S.club) { S.uniOffer = null; return; }
  const t = Object.keys(S.world.tiers).find(k=>S.world.tiers[k].includes(o.club)); S.uniOffer = null; if (t==null) return;
  const tk = keyOf(t), x = make(o.club, tk, feeFor(tk, o.club), "Key player"); x.msg = `${o.by} wants you: you signed yourself in your linked world.`; x.uni = true;
  const i = offers.findIndex(y=>y.club===o.club); if (i>=0) offers.splice(i, 1); offers.unshift(x);
}

/* ---------- in the manager's world: keeping the player up to date ---------- */
function uniSyncWorld(){
  if (typeof M==="undefined" || !M || !M.uni || !M.club) return;
  const slot = M.uni.slot, d = UNI.read("player", slot); if (!d || !d.player) return;
  MGW = null; const L = mgwLoad().find(x=>x.id.startsWith("LG" + (slot - 1) + "_")), id = L ? L.id : Object.keys(M.P).find(k=>k.startsWith("LG" + (slot - 1) + "_")), p = id ? M.P[id] : null;
  if (d.phase==="retired"){ if (p){ const C = M.cl[p.club]; if (C) C.sq = C.sq.filter(x=>x!==id); if (p.club===M.club){ M.tac.xi = M.tac.xi.map(x=>x===id ? null : x); M.tac.bench = M.tac.bench.filter(x=>x!==id); } delete M.P[id]; (M.gone ||= {})[id] = 1;
      mgMail("news", `${d.player.name} retires`, `${d.player.name} has hung up his boots in your Player Career, so he's left the game here too.`); } return; }
  if (!L) return;
  if (!p){ if (M.cl[L.club]) mgwAdd(L.club, M.cl[L.club]); return; }
  p.age = clamp(L.age, 15, 45);
  const dv = L.ovr - mgOvr(p); if (Math.abs(dv)>=2) p.at = p.at.map(v=>Math.round(clamp(v + dv, 12, 99)));
  if (p.pot<mgOvr(p)) p.pot = mgOvr(p);
  if (p.club===L.club){ p.uniMine = false; p.uniAt = L.club; return; }
  // out of step. Did he move in his own career since we last looked (he moves here too), or was he moved in this world?
  const movedThere = p.uniAt!=null && p.uniAt!==L.club;
  if (!movedThere && p.club===M.club){   // you've signed him here: tell his Player Career, once, and keep him
    if (!p.uniMine){ p.uniMine = true; d.uniOffer = {club:M.club, by:M.mgr.name}; localStorage.setItem(UNI.key("player", slot), JSON.stringify(d));
      mgMail("news", `${d.player.name}: over to him`, `You've signed ${d.player.name} in this world. His Player Career will get your offer in its next transfer window: accept it there and the two stay in step.`); } return; }
  const from = p.club, C0 = M.cl[from]; if (C0) C0.sq = C0.sq.filter(x=>x!==id);
  const C1 = mgMaterialize(L.club) || M.cl[L.club]; if (!C1){ delete M.P[id]; return; }
  if (from===M.club){ M.tac.xi = M.tac.xi.map(x=>x===id ? null : x); M.tac.bench = M.tac.bench.filter(x=>x!==id); }
  p.club = L.club; if (!C1.sq.includes(id)) C1.sq.push(id); p.uniMine = false; p.uniAt = L.club; M._lv = null;
  mgMail("news", `${d.player.name} joins ${L.club}`, `In your Player Career, ${d.player.name} has moved from ${from} to ${L.club}. He's made the same move in this world.`);
}
