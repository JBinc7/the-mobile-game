/* themes.js — 3.0: one look for every competition, in every mode.
   Each competition has two colours and a pattern (COMP_THEMES): leagues wear stripes, domestic cups a spotlight,
   the Champions League stars, the other European cups rays and international tournaments rings. compInfo(code, tier)
   names a competition and gives its colours; fxTheme (Player Career) and mgTheme (Manager and Director of Football)
   find it for a fixture. compBand is the big banner (pre-match, full time), compLine the thin strip over the
   scoreboard, compChip the small label; trophies in every cabinet wear the same colours (trophyTheme). */
const COMP_THEMES = {
  "L:1":["#2B0B3F","#C77DFF","stripes"], "L:2":["#0C1F45","#5B9BFF","stripes"], "L:3":["#3A0D12","#FF5A64","stripes"],
  "L:4":["#0A2C28","#2DD4BF","stripes"], "L:5":["#2A2610","#D9C24A","stripes"], "L:6":["#24221E","#B8A58A","stripes"],
  "L:ES":["#3A0B0E","#FF7A45","stripes"], "L:DE":["#1C0B0B","#FF4D4D","stripes"], "L:IT":["#061C38","#4FB3FF","stripes"], "L:FR":["#0D1530","#C6F24E","stripes"],
  "L:POR":["#062B1C","#FF5A5F","stripes"], "L:NED":["#2B1400","#FF9533","stripes"], "L:SCO":["#08203F","#8EC5FF","stripes"],
  fa:["#3A0B0B","#F4F4F4","spot"], lc:["#082A20","#3DDC97","spot"], eflt:["#241338","#C084FC","spot"], fat:["#2B2014","#E0B070","spot"],
  cdr:["#3A0A0E","#F5C542","spot"], dfb:["#141414","#F5C542","spot"], cit:["#06281C","#5EE59A","spot"], cdf:["#0A1C45","#FF8A8A","spot"],
  tdp:["#06291B","#F5C542","spot"], knvb:["#2B1400","#FFB066","spot"], scup:["#08203F","#E2E8F0","spot"],
  UCL:["#040A22","#D6E0FF","stars"], UEL:["#2A1100","#FF9533","rays"], UECL:["#04261A","#3DFFA0","rays"],
  wc:["#2A2005","#F5C542","rings"], euro:["#081A4A","#7AA2FF","rings"], copa:["#062642","#7DD3FC","rings"], afcon:["#162A06","#FACC15","rings"],
  asian:["#2A0718","#F472B6","rings"], gold:["#2A1A05","#FBBF24","rings"], friendly:["#1A1F24","#CBD5E1","spot"],
  ballon:["#2A2005","#F5C542","rays"], award:["#1A1F24","#E5C07B","spot"]
};
const INTL_NAMES = {wc:"World Cup", euro:"European Championship", copa:"Copa América", afcon:"Africa Cup of Nations", asian:"Asian Cup", gold:"Gold Cup"};
const CUP_NAMES_ALL = () => ({fa:"FA Cup", lc:"League Cup", eflt:"EFL Trophy", fat:"FA Trophy", ...(typeof cupNames!=="undefined" ? cupNames : {})});
function compInfo(code, tier){
  code = String(code ?? "");
  const mk = (key, o) => { const [c1, c2, pat] = COMP_THEMES[key] || COMP_THEMES.friendly; return {c1, c2, pat, ...o}; };
  if (code==="league" || code.startsWith("L:")){
    const t = code==="league" ? (tier ?? 1) : keyOf(code.slice(2)), T = TIERS[t] || TIERS[1];
    const key = COMP_THEMES["L:"+t] ? "L:"+t : COMP_THEMES["L:"+String(t).replace(/2$/,"")] ? "L:"+String(t).replace(/2$/,"") : "L:6";
    return mk(key, {name:T.name, short:T.short || T.name, type:T.country==="England" ? (T.level===1 ? "Top flight" : `League · tier ${T.level}`) : T.level===1 ? `${T.country} · top flight` : `${T.country} · tier ${T.level}`, kind:"league", tname:T.title || T.name});
  }
  if (typeof EURO!=="undefined" && EURO[code]) return mk(code, {name:EURO[code].name, short:code, type:"European cup", kind:"europe", tname:EURO[code].name});
  if (INTL_NAMES[code]) return mk(code, {name:INTL_NAMES[code], short:INTL_NAMES[code], type:"International tournament", kind:"intl", tname:INTL_NAMES[code]});
  const nm = CUP_NAMES_ALL()[code];
  if (nm) return mk(code, {name:nm, short:nm, type:"Domestic cup", kind:"cup", tname:nm});
  if (code==="friendly") return mk("friendly", {name:"Friendly", short:"Friendly", type:"Pre-season", kind:"cup", tname:"Friendly"});
  return mk("friendly", {name:code, short:code, type:"Competition", kind:"cup", tname:code});
}
// the same look for a trophy already in a cabinet (kind as the Player Career stores it; a name alone works too)
function trophyTheme(kind, name){
  const n = name || "", mk = key => { const [c1, c2, pat] = COMP_THEMES[key]; return {c1, c2, pat}; };
  if (kind==="ballon" || /Ballon/i.test(n)) return mk("ballon");
  const ik = /World Cup/.test(n) ? "wc" : Object.keys(INTL_NAMES).find(k=>n.includes(INTL_NAMES[k]));
  if (ik) return compInfo(ik);
  const ek = typeof EURO!=="undefined" ? Object.keys(EURO).find(k=>n.includes(EURO[k].name)) : null;
  if (ek || kind==="europe") return compInfo(ek || "UCL");
  const all = CUP_NAMES_ALL(), ck = Object.keys(all).find(k=>n.includes(all[k]));
  if (ck) return compInfo(ck);
  // league titles, play-off finals and league awards all wear their league's colours
  const t = Object.keys(TIERS).find(k=>TIERS[k].title===n || TIERS[k].name===n) ?? Object.keys(TIERS).find(k=>n.startsWith(TIERS[k].name) || n.startsWith(TIERS[k].short + " "));
  if (t!=null) return compInfo("league", keyOf(t));
  return mk(kind==="cup" ? "friendly" : "award");
}
const themeVars = th => `--tc1:${th.c1};--tc2:${th.c2}`;
const compDot = th => `<i class="cdot" style="${themeVars(th)}" aria-hidden="true"></i>`;
const compBadge = th => `<span class="cbadge" style="${themeVars(th)}" aria-hidden="true">${typeof trophyIcon==="function" ? trophyIcon(th.kind, th.tname) : ""}</span>`;
const compBand = (th, sub, cls = "") => `<div class="comp-band themed ${cls}" data-pat="${th.pat}" style="${themeVars(th)}">${compBadge(th)}<div class="cb-t"><span class="ctype">${esc(th.type)}</span><b>${esc(th.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div></div>`;
const compLine = (th, text) => `<div class="comp-line themed" data-pat="${th.pat}" style="${themeVars(th)}">${compDot(th)}<span>${esc(text)}</span></div>`;
const compChip = (th, text, cls = "") => `<span class="cchip ${cls}" style="${themeVars(th)}">${compDot(th)}${esc(text)}</span>`;

/* ---------- Player Career: a match centre fixture ---------- */
function fxTheme(f){
  if (!f || !f.code) return compInfo("friendly");
  if (f.code==="league") return compInfo("league", typeof S!=="undefined" && S && S.mc ? tierOf(S.mc.club) : 1);
  if (f.code==="intl" || f.intl) return compInfo(f.tkey && INTL_NAMES[f.tkey] ? f.tkey : "wc");
  return compInfo(f.code);
}
const fxRound = f => !f || f.code==="league" ? "" : `${f.round || ""}${f.leg ? `, leg ${f.leg}` : ""}`;

/* ---------- Manager Career and Director of Football: a fixture (f.c, f.t, f.code) or a result row ---------- */
function mgTheme(f){
  if (!f) return compInfo("friendly");
  const lg = () => f.t ?? (typeof mgLeagueOf==="function" ? mgLeagueOf() : 1);
  if (f.c==="L") return compInfo("league", lg());
  if (f.c==="P") return {...compInfo("league", lg()), type:"Play-offs"};
  if (f.c==="E") return compInfo(f.code || ({UCL:"UCL", UEL:"UEL", UECL:"UECL"})[f.comp] || "UCL");
  if (f.c==="C"){
    if (f.code && COMP_THEMES[f.code]) return compInfo(f.code);
    const nm = (f.code && typeof M!=="undefined" && M && M.cups && M.cups[f.code] && M.cups[f.code].name) || String(f.full || f.comp || "Cup").split(" · ")[0].replace("Lg Cup", "League Cup");
    const th = trophyTheme("cup", nm); return {...compInfo("friendly"), ...th, name:nm, short:nm, type:"Domestic cup", kind:"cup", tname:nm};
  }
  return compInfo("friendly");
}
