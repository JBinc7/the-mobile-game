/* ================= CLUB CRESTS =================
   Every club gets a badge drawn in its colours: a shape and a pattern picked from its name (so a club's badge never
   changes) and, on bigger badges, its initials. clubBadge is used in tables, fixture lists, the match centre and the
   match screens. The badge shapes are shared clip paths, defined once in the page (so they still work inside views
   that are hidden). Loaded before game.js; only called once the game is running. */
const CR_SHAPES = {
  shield:"M20 1.5 37.5 6.5V22c0 12.5-7.8 19.4-17.5 23C10.3 41.4 2.5 34.5 2.5 22V6.5z",
  heater:"M2.5 2.5h35V20c0 13-8.6 20.6-17.5 24.5C11.1 40.6 2.5 33 2.5 20z",
  round:"M20 4c10.5 0 19 8.5 19 19s-8.5 19-19 19S1 33.5 1 23 9.5 4 20 4z",
  spade:"M20 1.5c5.8 3.6 11 4.5 17.5 4.5v14c0 14-8 20.5-17.5 25-9.5-4.5-17.5-11-17.5-25V6c6.5 0 11.7-.9 17.5-4.5z",
  square:"M4 2.5h32a1.5 1.5 0 0 1 1.5 1.5v26c0 7-6 11.5-17.5 15C8.5 41.5 2.5 37 2.5 30V4A1.5 1.5 0 0 1 4 2.5z"
};
const CR_PATTERNS = {
  plain:"", stripes:[6,14,22,30].map(x=>`<rect x="${x}" width="4" height="46"/>`).join(""), hoops:[8,18,28,38].map(y=>`<rect y="${y}" width="40" height="5"/>`).join(""),
  halves:`<rect x="20" width="20" height="46"/>`, sash:`<path d="M-4 8 8-4 44 36 32 48z"/>`, quarters:`<rect width="20" height="23"/><rect x="20" y="23" width="20" height="23"/>`,
  chevron:`<path d="M0 12l20 13 20-13v8L20 33 0 20z"/>`, band:`<rect y="17" width="40" height="10"/>`, cross:`<rect x="16" width="8" height="46"/><rect y="18" width="40" height="8"/>`,
  pale:`<rect x="13" width="14" height="46"/>`
};
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(CR_SHAPES).map(([k,d])=>`<clipPath id="crClip-${k}"><path d="${d}"/></clipPath>`).join("")}</defs></svg>`);

// the letters on a club's badge: Tottenham Hotspur → TH, Brighton & Hove Albion → BHA, Wrexham → WRE
function crCode(n){
  const w = String(n).replace(/&/g, " ").split(/\s+/).filter(x=>x && !/^(FC|AFC|CF|SC|AC|SV|VfB|VfL|of|the|de|del|and|Club)$/i.test(x));
  return (w.length>1 ? w.slice(0, 3).map(x=>x[0]).join("") : (w[0] || String(n)).slice(0, 3)).toUpperCase();
}
// a club's badge at px wide (European opponents outside the game's leagues get one from their name and plain colours)
function clubBadge(n, px = 20){
  const m = meta(n), R = seeded(hashStr(`${n}|badge`)), shapes = Object.keys(CR_SHAPES), pats = Object.keys(CR_PATTERNS);
  const shape = shapes[Math.floor(R()*shapes.length)], pat = pats[Math.floor(R()*pats.length)];
  const c1 = m.c1 || "#4B5563", c2 = !m.c2 || lvNear(c1, m.c2) ? (lvLight(c1) ? "#1F2937" : "#F3F4F6") : m.c2;
  const ink = lvLight(c1) ? "#15171A" : "#FFFFFF", big = px>=34;
  return `<svg class="crest" viewBox="0 0 40 46" width="${px}" height="${Math.round(px*46/40)}" aria-hidden="true" focusable="false">
    <g clip-path="url(#crClip-${shape})"><rect width="40" height="46" fill="${c1}"/><g fill="${c2}">${CR_PATTERNS[pat]}</g>
      <path d="M0 0h40v20C26 24 12 14 0 20z" fill="#fff" opacity=".12"/></g>
    ${big ? `<circle cx="20" cy="24" r="10.5" fill="${c1}" stroke="${c2}" stroke-width="1.6"/><text x="20" y="${crCode(n).length>2 ? 27.6 : 28.4}" text-anchor="middle" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="${crCode(n).length>2 ? 9.5 : 11.5}" fill="${ink}">${esc(crCode(n))}</text>` : ""}
    <path d="${CR_SHAPES[shape]}" fill="none" stroke="${c2}" stroke-width="2.2"/><path d="${CR_SHAPES[shape]}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width=".7"/>
  </svg>`;
}
