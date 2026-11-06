/* ================= SQUADS =================
   Every club has a starting XI of made-up players in a 4-2-3-1: named for the country it plays in (more foreign
   signings the higher the league), with shirt numbers and ratings built around the club's strength. A squad comes
   from the club's name and the season (sqSquad), so nothing needs saving: each place in the side keeps its player
   for a few seasons before someone new arrives, and players get older as the years go by. In your matches you take
   the place of the player in your position. sqLineups draws both XIs before kick-off; sqMatch shares out the goals,
   assists and match ratings and picks the Player of the Match.
   Loaded before game.js; only called once the game is running. */
const SQ_SLOTS = [["GK",1],["RB",2],["CB",5],["CB",6],["LB",3],["CDM",4],["CM",8],["RW",7],["CAM",10],["LW",11],["ST",9]];
// where each slot stands on the line-ups pitch, for the side on the left attacking right: [depth, width]
const SQ_SPOT = [[16,105],[52,178],[48,130],[48,80],[52,32],[86,80],[86,130],[122,176],[118,105],[122,34],[152,105]];
const SQ_NAMES = {
  England:["Jack|Harry|George|Charlie|Oliver|James|Jacob|Thomas|Alfie|Joe|Ben|Callum|Kyle|Ryan|Jordan|Lewis|Mason|Reece|Tom|Sam|Danny|Josh|Luke|Adam|Connor|Jamie|Aaron|Marcus|Ollie|Kieran|Jake|Liam|Bradley|Tyler|Nathan",
    "Smith|Jones|Taylor|Brown|Williams|Wilson|Johnson|Davies|Robinson|Wright|Thompson|Evans|Walker|White|Roberts|Green|Hall|Wood|Jackson|Clarke|Hughes|Edwards|Turner|Hill|Moore|Cooper|Ward|Morris|King|Watson|Harrison|Morgan|Baker|Lewis|Palmer|Mitchell|Bennett|Shaw|Foster|Barnes|Holt|Fletcher|Chambers|Lowe|Parry"],
  Scotland:["Callum|Lewis|Ross|Scott|Craig|Kyle|Ryan|Jamie|Fraser|Euan|Calum|Liam|Andrew|Stuart|Grant|Kieran|Ewan|Rory|Cameron|Blair|Lennon|Jack",
    "Campbell|Stewart|MacDonald|Robertson|Thomson|Anderson|Scott|Murray|Reid|Clark|Ross|Paterson|Young|Mitchell|Watson|Fraser|McLean|McKenzie|Morrison|Hamilton|Graham|Kerr|Johnston|Christie|Ferguson|McGregor|Gray|Wallace|Kennedy|Hunter"],
  Wales:["Rhys|Gareth|Dylan|Owain|Aaron|Ethan|Tom|Joe|Harry|Kieffer|Brennan|Neco|Connor|Daniel", "Jones|Davies|Evans|Thomas|Roberts|Hughes|Lewis|Morgan|Griffiths|Price|Owen|Pritchard|Rees|Powell|Jenkins|Vaughan"],
  Ireland:["Seán|Conor|Cian|Darragh|Evan|Jamie|Adam|Callum|Dara|Ryan|Shane|Ciarán|Liam|Josh|Mark|Niall", "Murphy|Kelly|O'Brien|Byrne|Ryan|O'Sullivan|Walsh|O'Connor|McCarthy|Doyle|Kennedy|Lynch|Quinn|Brennan|Doherty|Gallagher"],
  Spain:["Pablo|Javier|Sergio|Alejandro|Daniel|Álvaro|Adrián|Diego|Carlos|Iker|Mario|Raúl|Marcos|Hugo|Rubén|Óscar|Jorge|Iván|Unai|Aitor|Borja|Gonzalo|Pedro|Fernando|Manuel|Andrés|Víctor|Nacho|Dani|Rodrigo",
    "García|Fernández|González|Rodríguez|López|Martínez|Sánchez|Pérez|Gómez|Martín|Jiménez|Ruiz|Hernández|Díaz|Moreno|Muñoz|Álvarez|Romero|Alonso|Navarro|Torres|Domínguez|Gil|Vázquez|Serrano|Blanco|Molina|Morales|Ortega|Delgado|Castro|Ortiz|Rubio|Marín|Sanz|Iglesias|Medina|Garrido|Cortés"],
  Germany:["Lukas|Leon|Finn|Jonas|Niklas|Felix|Maximilian|Tim|Jan|Paul|Moritz|Luca|Julian|Tobias|Florian|Kevin|Marco|Sebastian|Philipp|Dennis|Timo|Kai|Nico|Robin|Lars|Benedikt|Malte|Erik|Hannes|Jannik",
    "Müller|Schmidt|Schneider|Fischer|Weber|Meyer|Wagner|Becker|Schulz|Hoffmann|Schäfer|Koch|Bauer|Richter|Klein|Wolf|Schröder|Neumann|Schwarz|Zimmermann|Braun|Krüger|Hofmann|Hartmann|Lange|Schmitt|Werner|Krause|Meier|Lehmann|Köhler|Herrmann|König|Walter|Mayer|Huber|Kaiser|Fuchs|Peters|Lang"],
  Italy:["Francesco|Alessandro|Andrea|Lorenzo|Matteo|Gabriele|Leonardo|Riccardo|Davide|Federico|Marco|Luca|Simone|Giorgio|Nicolò|Tommaso|Edoardo|Stefano|Alessio|Daniele|Fabio|Giacomo|Mattia|Pietro|Filippo|Emanuele|Antonio|Michele|Samuele",
    "Rossi|Russo|Ferrari|Esposito|Bianchi|Romano|Colombo|Ricci|Marino|Greco|Bruno|Gallo|Conti|De Luca|Mancini|Costa|Giordano|Rizzo|Lombardi|Moretti|Barbieri|Fontana|Santoro|Mariani|Rinaldi|Caruso|Ferrara|Galli|Martini|Leone|Longo|Gentile|Martinelli|Vitale|Serra|Coppola|De Santis|Marchetti|Villa"],
  France:["Lucas|Hugo|Théo|Louis|Nathan|Enzo|Mathis|Tom|Raphaël|Jules|Maxime|Antoine|Clément|Alexandre|Baptiste|Romain|Thomas|Adrien|Quentin|Florian|Benjamin|Bastien|Valentin|Yanis|Moussa|Ibrahim|Rayan|Malik|Karim|Mathéo",
    "Martin|Bernard|Dubois|Thomas|Robert|Richard|Petit|Durand|Leroy|Moreau|Simon|Laurent|Lefebvre|Michel|Garcia|David|Bertrand|Roux|Vincent|Fournier|Morel|Girard|André|Mercier|Dupont|Lambert|Bonnet|François|Legrand|Garnier|Faure|Rousseau|Blanc|Guérin|Henry|Roussel|Nicolas|Perrin|Morin"],
  Portugal:["João|Rodrigo|Martim|Tomás|Diogo|Afonso|Duarte|Gonçalo|Pedro|Rafael|Tiago|Francisco|Miguel|Gustavo|André|Rúben|Nuno|Bruno|Ricardo|Hugo|Fábio|Daniel|Luís|Bernardo|Vasco",
    "Silva|Santos|Ferreira|Pereira|Oliveira|Costa|Rodrigues|Martins|Jesus|Sousa|Fernandes|Gonçalves|Gomes|Lopes|Marques|Alves|Almeida|Ribeiro|Pinto|Carvalho|Teixeira|Moreira|Correia|Mendes|Nunes|Soares|Vieira|Monteiro|Cardoso|Rocha"],
  Netherlands:["Daan|Sem|Lucas|Levi|Finn|Milan|Jesse|Thijs|Bram|Ruben|Lars|Tim|Stijn|Joey|Kevin|Jasper|Luuk|Sven|Niels|Bas|Wout|Teun|Rick|Ryan|Jurgen",
    "de Jong|de Vries|van den Berg|van Dijk|Bakker|Janssen|Visser|Smit|Meijer|de Boer|Mulder|de Groot|Bos|Vos|Peters|Hendriks|van Leeuwen|Dekker|Brouwer|de Wit|Dijkstra|Smits|de Graaf|van der Meer|Kok|Jacobs|de Haan|Vermeulen|van den Heuvel|Schouten"],
  Belgium:["Thibaut|Axel|Youri|Arthur|Jérémy|Charles|Hans|Lois|Maxim|Senne|Arne|Wout", "Peeters|Janssens|Maes|Jacobs|Mertens|Willems|Claes|Goossens|Wouters|De Smet|Dubois|Lambert|Vermeiren"],
  Denmark:["Rasmus|Mikkel|Andreas|Christian|Jonas|Mathias|Joachim|Kasper|Jesper|Simon|Victor|Mads", "Jensen|Nielsen|Hansen|Pedersen|Andersen|Christensen|Larsen|Sørensen|Rasmussen|Jørgensen|Petersen|Madsen|Kristensen"],
  Norway:["Martin|Alexander|Sander|Emil|Fredrik|Kristian|Sondre|Henrik|Jonas|Magnus|Ola|Tobias", "Olsen|Berg|Haugen|Lund|Strand|Bakke|Hagen|Johansen|Eriksen|Solberg|Moe|Nygaard"],
  Sweden:["Viktor|Isak|Anton|Gustav|Oscar|Elias|Hugo|Linus|Albin|Filip|Hampus|Ludwig", "Johansson|Andersson|Karlsson|Nilsson|Eriksson|Larsson|Svensson|Persson|Olsson|Lindberg|Holm|Bergström"],
  Poland:["Piotr|Jakub|Kamil|Mateusz|Krzysztof|Sebastian|Przemysław|Karol|Bartosz|Jan|Michał|Paweł", "Nowak|Kowalski|Wiśniewski|Wójcik|Kowalczyk|Kamiński|Szymański|Woźniak|Dąbrowski|Kozłowski|Jankowski|Mazur|Krawczyk"],
  Czechia:["Tomáš|Jakub|Ondřej|Lukáš|Adam|Patrik|Vladimír|David|Matěj|Václav|Antonín|Michal", "Novák|Svoboda|Novotný|Dvořák|Černý|Procházka|Kučera|Veselý|Horák|Němec|Pokorný|Marek|Holeš|Souček"],
  Croatia:["Luka|Ivan|Mateo|Josip|Marko|Duje|Ante|Mario|Bruno|Domagoj|Nikola|Petar", "Horvat|Kovačević|Babić|Marić|Jurić|Novak|Knežević|Vuković|Matić|Tomić|Pavić|Grgić"],
  Serbia:["Nikola|Dušan|Sergej|Filip|Andrej|Stefan|Aleksandar|Miloš|Lazar|Uroš|Vanja|Strahinja", "Petrović|Jovanović|Nikolić|Marković|Đorđević|Stojanović|Ilić|Pavlović|Popović|Živković|Lukić|Milenković"],
  Hungary:["Dominik|Roland|Ádám|Bence|Dániel|Milos|Zsolt|Barnabás|Márton|Attila|Kristóf|Péter", "Nagy|Kovács|Tóth|Szabó|Horváth|Varga|Kiss|Molnár|Németh|Farkas|Balogh|Szalai|Lovrencsics"],
  Greece:["Giorgos|Kostas|Dimitris|Nikos|Giannis|Christos|Vangelis|Anastasios|Petros|Thanasis|Kyriakos|Manolis", "Papadopoulos|Pappas|Georgiou|Nikolaidis|Konstantinou|Vlachos|Dimitriou|Ioannou|Mavropanos|Tzolis|Bakasetas|Pelkas|Siopis|Kourbelis"],
  Ukraine:["Oleksandr|Andriy|Mykola|Viktor|Taras|Artem|Heorhiy|Yehor|Vitaliy|Serhiy|Mykhailo|Illia", "Shevchenko|Bondarenko|Kovalenko|Tkachenko|Kravchenko|Melnyk|Boyko|Moroz|Lysenko|Savchenko|Rudenko|Marchenko"],
  Turkey:["Arda|Kerem|Hakan|Orkun|Ferdi|Mert|Cengiz|Emre|Barış|Kaan|Yusuf|Salih", "Yılmaz|Kaya|Demir|Şahin|Çelik|Yıldız|Yıldırım|Öztürk|Aydın|Özdemir|Arslan|Doğan|Kılıç"],
  Azerbaijan:["Emin|Ramil|Mahir|Toral|Renat|Elvin|Rahil|Namiq|Ozan|Anatoliy", "Mammadov|Aliyev|Huseynov|Hasanov|Guliyev|Ismayilov|Abdullayev|Rzayev|Sheydayev|Dadashov"],
  Brazil:["Lucas|Gabriel|Matheus|Vinícius|Rafael|Bruno|Felipe|Thiago|Gustavo|Pedro|Caio|Igor|Danilo|Wesley|Murilo|Renan", "Silva|Santos|Oliveira|Souza|Lima|Pereira|Costa|Ferreira|Almeida|Carvalho|Ribeiro|Araújo|Barbosa|Nascimento|Moura|Rocha"],
  Argentina:["Santiago|Matías|Nicolás|Facundo|Julián|Franco|Agustín|Joaquín|Valentín|Emiliano|Gonzalo|Ezequiel|Tomás|Lucas", "González|Rodríguez|Fernández|López|Martínez|Gómez|Díaz|Romero|Sosa|Medina|Herrera|Aguirre|Benítez|Ledesma|Ríos|Molina"],
  Uruguay:["Facundo|Maximiliano|Agustín|Nahitan|Mathías|Sebastián|Rodrigo|Brian|Manuel|Giorgian|Federico|Diego", "Pereyra|Núñez|Olivera|Cáceres|Rodríguez|Bentos|Piquerez|Ugalde|Viña|Coates|Sosa|Pintos"],
  Colombia:["Juan|Jhon|Andrés|Camilo|Jefferson|Yerry|Duván|Mateus|Kevin|Wílmar|Santiago|Daniel", "Ramírez|Castillo|Vargas|Mejía|Restrepo|Cabrera|Mosquera|Palacios|Valencia|Moreno|Hinestroza|Cuesta"],
  USA:["Tyler|Brenden|Josh|Tim|Chris|Miles|Cameron|Jordan|Paxton|Caden|Owen|Malik", "Johnson|Miller|Davis|Anderson|Thomas|Jackson|Harris|Martin|Thompson|Robinson|Clark|Lewis|Walker|Young"],
  Nigeria:["Chidi|Emeka|Victor|Samuel|Ademola|Kelechi|Chukwudi|Ola|Tunde|Ifeanyi|Wilfred|Moses|Uche|Femi", "Okafor|Adeyemi|Nwosu|Eze|Okonkwo|Balogun|Ogunleye|Onyeka|Okoye|Babatunde|Adebayo|Nwachukwu|Obi|Afolabi"],
  Ghana:["Kwame|Kofi|Yaw|Kwabena|Mohammed|Daniel|Abdul|Joseph|Emmanuel|Osman|Richard|Kojo", "Mensah|Asante|Boateng|Owusu|Addo|Amartey|Agyeman|Ofori|Badu|Antwi|Danso|Fosu|Sarpong|Tetteh"],
  Senegal:["Moussa|Cheikh|Idrissa|Pape|Abdou|Mamadou|Bamba|Habib|Lamine|Boulaye|Ousmane|Saliou", "Diallo|Ndiaye|Sarr|Diop|Faye|Gueye|Sow|Mendy|Cissé|Diatta|Camara|Niang|Ba|Seck|Fall"],
  "Ivory Coast":["Serge|Yannick|Wilfried|Franck|Ibrahim|Simon|Odilon|Christian|Jérémie|Hamed|Seko|Karim", "Kouassi|Koné|Bamba|Traoré|Coulibaly|Touré|Kessié|Diomandé|Gbamin|Doumbia|Fofana|Kouamé"],
  Morocco:["Youssef|Hakim|Sofyan|Bilal|Azzedine|Amine|Ilias|Yassine|Selim|Anass|Zakaria|Oussama", "El Amrani|Benali|Tazi|Bennani|El Fassi|Alaoui|Chraibi|Berrada|Lahlou|Saidi|Haddad|El Mansouri"],
  Japan:["Takumi|Kaoru|Daichi|Wataru|Ritsu|Hiroki|Ayase|Yuki|Shota|Kenta|Sota|Ryo", "Tanaka|Suzuki|Takahashi|Watanabe|Ito|Yamamoto|Nakamura|Kobayashi|Kato|Yoshida|Yamada|Sasaki|Matsumoto|Inoue"],
  "South Korea":["Dong-hyun|Seung-woo|Jin-su|Tae-hwan|Sang-ho|Ji-hoon|Young-jae|Hyun-soo|Joon-ho|Woo-jin", "Kim|Lee|Park|Choi|Jung|Kang|Cho|Yoon|Jang|Lim|Han|Oh"]
};
// where signings come from: anywhere for the big leagues, closer to home for England's lower divisions
const SQ_FOREIGN = ["Brazil","Argentina","France","Spain","Portugal","Netherlands","Germany","Belgium","Nigeria","Ghana","Senegal","Ivory Coast","Morocco","Denmark","Norway","Sweden","Poland","Croatia","Serbia","Japan","South Korea","USA","Colombia","Uruguay","Turkey","England","Italy","Scotland","Ireland","Wales"];
const SQ_NEAR = ["Scotland","Ireland","Wales","Ireland","Nigeria","Ghana","Netherlands","France"];
const SQ_DOMESTIC = {1:.42, 2:.62, 3:.78, 4:.82, 5:.88, ES:.58, DE:.48, IT:.48, FR:.52, POR:.42, NED:.55, SCO:.52};
// European opponents from outside the game's leagues, by country (names only, so Austria and Switzerland use German ones)
const SQ_CLUB_NAT = {"Galatasaray":"Turkey", "Fenerbahçe":"Turkey", "Club Brugge":"Belgium", "Gent":"Belgium", "Anderlecht":"Belgium", "Shakhtar Donetsk":"Ukraine",
  "Bodø/Glimt":"Norway", "Viking":"Norway", "Slavia Prague":"Czechia", "Sparta Prague":"Czechia", "Slovan Bratislava":"Czechia", "AEK Athens":"Greece", "Olympiacos":"Greece",
  "Panathinaikos":"Greece", "PAOK":"Greece", "Omonia":"Greece", "LASK":"Germany", "Rapid Wien":"Germany", "Salzburg":"Germany", "Basel":"Germany", "Young Boys":"Germany",
  "Sabah":"Azerbaijan", "Midtjylland":"Denmark", "Copenhagen":"Denmark", "Ferencváros":"Hungary", "Red Star Belgrade":"Serbia", "Legia Warsaw":"Poland", "Lech Poznań":"Poland",
  "Jagiellonia":"Poland", "Shamrock Rovers":"Ireland", "Djurgården":"Sweden", "AZ Alkmaar":"Netherlands"};
const sqCache = new Map();

const sqNames = nat => (SQ_NAMES[nat] || SQ_NAMES.England).map(s=>s.split("|"));
// the club's country, for its players' names, and how many of them are home-grown
function sqHome(club){
  if (SQ_CLUB_NAT[club]) return {home:SQ_CLUB_NAT[club], dom:.55, near:false};
  if (typeof NATIONS!=="undefined" && NATIONS[club]) return {home:natNames(club), dom:1, near:false};   // a national side (tournament.js)
  const t = ALLKEYS.find(k=>S.world.tiers[k] && S.world.tiers[k].includes(club));
  if (t==null) return {home:null, dom:0, near:false};
  return {home:TIERS[t].country, dom:SQ_DOMESTIC[t] ?? .7, near:TIERS[t].country==="England" && TIERS[t].level>=3};
}
// how age changes a player: still learning before 21, fading after 30
const sqAgeAdj = age => age>30 ? -(age-30)*.8 : age<21 ? -(21-age)*1.2 : 0;
// a place's own rhythm: each player there stays `stay` seasons, and 2026 falls `off` seasons into the first one
function sqTime(club, i){ const R0 = seeded(hashStr(`${club}|${i}`)), stay = 3 + Math.floor(R0()*6); return {stay, off:Math.floor(R0()*stay)}; }
// the first season from `from` on when someone new would arrive at that place anyway
function sqNextStart(club, i, from){ const t = sqTime(club, i); return 2026 - t.off + Math.ceil((from - 2026 + t.off)/t.stay)*t.stay; }
// a summer signing at this place, or the newcomer who replaced a player sold (see sqWindow)
function sqOver(club, i, season){ const L = S.xf && S.xf.slots[`${club}|${i}`]; return L ? L.find(o=>o.since<=season && season<o.until) || null : null; }
// the player in one place in a club's side in a season: a place keeps its player for 3 to 8 seasons, then a new one
// arrives (or sooner, when the club sells him in the summer)
function sqPlayer(club, i, season, H){
  const t = sqTime(club, i), k = season - 2026 + t.off, gen = Math.floor(k/t.stay), ov = sqOver(club, i, season);
  if (ov && ov.p){ const q = ov.p, age = q.age + season - ov.since;
    return {i, id:`${club}|${i}|mv${ov.since}`, name:q.name, nat:q.nat, pos:SQ_SLOTS[i][0], num:q.num, r:+(q.ab + sqAgeAdj(age) - strOf(club)).toFixed(1), age, since:ov.since, from:q.from, fee:q.fee, hist:q.hist, mv:true}; }
  const yrs = ov ? season - ov.since : k - gen*t.stay;
  const id = ov ? `${club}|${i}|${ov.tag || "n" + ov.since}` : `${club}|${i}|${gen}`, R = seeded(hashStr(id)), one = a => a[Math.floor(R()*a.length)];
  let nat = H.home;
  if (!H.home || R()>=H.dom){ const pool = H.near ? SQ_NEAR : SQ_FOREIGN; do { nat = one(pool); } while (nat===H.home); }
  const [F, L] = sqNames(nat), age = 18 + Math.floor(R()*12) + yrs;
  // most players are a little below the club's level; about one in ten is its star
  const r = (R()<.1 ? 4 + R()*5 : (R() - .6)*10) + sqAgeAdj(age);
  return {i, id, name:`${one(F)} ${one(L)}`, nat, pos:SQ_SLOTS[i][0], num:R()<.7 ? SQ_SLOTS[i][1] : 12 + Math.floor(R()*28), r:+r.toFixed(1), age, since:season - yrs, R};
}
// a club's XI in a season (this one unless given), cached: [{i, id, name, nat, pos, num, r (rating against the
// club's strength), age, since, and for a signing mv, from and fee}]
function sqSquad(club, season = S.season){
  const key = `${club}|${season}`;
  if (sqCache.has(key)) return sqCache.get(key);
  const H = sqHome(club), xi = SQ_SLOTS.map((_, i)=>sqPlayer(club, i, season, H));
  sqNameAll(club, xi, season);
  if (sqCache.size>400) sqCache.clear();
  sqCache.set(key, xi);
  return xi;
}
// everyone keeps the name and shirt number he arrived with (or had in 2026, when the game starts): a newcomer who'd
// share either with a team-mate already there takes another, so nobody's name changes from one season to the next.
// A signing keeps his own name, and takes a free number. Kept by player (id) for as long as the game's open
const sqNamed = new Map();
function sqNameAll(club, xi, season){
  const names = new Set(), nums = new Set(), from = p => Math.max(p.since, 2026);
  xi.slice().sort((a, b)=>from(a) - from(b) || a.i - b.i).forEach(p=>{
    let got = sqNamed.get(p.id);
    if (!got && from(p)<season){ sqSquad(club, from(p)); got = sqNamed.get(p.id); }   // as he was named when he arrived
    if (!got){
      let name = p.name, num = p.num;
      if (!p.mv){ const [F, L] = sqNames(p.nat); for (let k=0; names.has(name) && k<8; k++) name = `${F[Math.floor(p.R()*F.length)]} ${L[Math.floor(p.R()*L.length)]}`; }
      while (nums.has(num)) num = num>=99 ? 12 : num + 1;
      got = [name, num]; sqNamed.set(p.id, got);
    }
    p.name = got[0]; p.num = got[1]; names.add(p.name); nums.add(p.num); delete p.R;
  });
}
const sqSlotOf = pos => Math.max(0, SQ_SLOTS.findIndex(s=>s[0]===pos));
// a player's rating: his club's strength (or a European opponent's) plus his own edge
const sqRating = (p, base) => Math.round(clamp(base + p.r, 30, 96));
const sqSurname = n => { const w = String(n).split(" ").slice(1), s = w.join(" "); return s.length>12 ? w[w.length-1] : s; };
const sqDefends = pos => DEF.includes(pos) || pos==="CDM";
// who scores (k=0) or sets up (k=1) a goal: weighted by position (MC_SHARE) and quality, never player `not`
function sqPick(xi, on, k, not){
  const w = xi.map((p,i)=>on[i] && i!==not ? (MC_SHARE[p.pos] || MC_SHARE.CM)[k]*Math.exp(p.r/14) + .001 : 0);
  let x = Math.random()*w.reduce((s,v)=>s+v, 0);
  for (let i=0;i<w.length;i++){ x -= w[i]; if (x<=0 && w[i]>0) return i; }
  return w.findIndex(v=>v>0);
}
// a match rating on the same scale as yours (mcResolve): quality against the opponent, goals, assists, the result,
// and for defenders clean sheets and heavy defeats
function sqRate(pos, q, oppQ, g, a, gf, ga){
  const d = sqDefends(pos);
  return +clamp(6.35 + (q - oppQ)*.02 + g*.95 + a*.6 + (d && ga===0 ? .7 : 0) + (gf>ga ? .3 : gf<ga ? -.3 : 0) - (d && ga>=3 ? .5 : 0) + gauss()*.5, 3.5, 10).toFixed(1);
}

/* ---------- your matches ---------- */
// both XIs on a pitch, the home side on the left attacking right, with you in your place when you start
function sqLineups(f){
  const our = S.mc.club, K = lvKits({f}), left = f.home || f.neutral ? our : f.opp, right = left===our ? f.opp : our, u = sqSlotOf(S.player.pos);
  const you = !!f.me && f.me.st==="start", baseOf = n => n===our ? strOf(our) : f.oppStr;
  const side = (club, flip) => {
    const kit = club===our ? K.us : K.them, ink = lvLight(kit) ? "#15171A" : "#FFFFFF";
    return sqSquad(club).map((p,i)=>{
      const me = club===our && you && i===u, [x0, y0] = SQ_SPOT[i], x = flip ? 340-x0 : x0, y = flip ? 210-y0 : y0;
      return `<g transform="translate(${x} ${y})" class="sq-p" data-pl="${esc(me ? "me" : `${club}|${i}`)}" data-str="${baseOf(club)}"><circle r="8.5" fill="${kit}" stroke="${me ? "#F5C542" : "rgba(0,0,0,.45)"}" stroke-width="${me ? 2.5 : 1}"/>
        <text y="3" text-anchor="middle" class="sq-num" fill="${ink}">${me ? esc(String(S.player.number).slice(0,2)) : p.num}</text>
        <text y="${i===10 ? -12 : 19}" text-anchor="middle" class="sq-name${me ? " me" : ""}">${esc(me ? "You" : sqSurname(p.name))}</text></g>`;
    }).join("");
  };
  const avg = club => { const xi = sqSquad(club); return Math.round(xi.reduce((s,p,i)=>s + (club===our && you && i===u ? mcOvr() : sqRating(p, baseOf(club))), 0)/xi.length); };
  const key = sqSquad(f.opp).reduce((b,p)=>p.r>b.r ? p : b);
  return `<details class="sq" open><summary><span>Line-ups</span><span class="sq-avg">${esc(lvAbbr(left))} ${avg(left)} · ${avg(right)} ${esc(lvAbbr(right))}</span></summary>
    <svg viewBox="0 0 340 210" class="sq-pitch" role="img" aria-label="${esc(`Starting line-ups: ${left} on the left, ${right} on the right`)}">
      <rect width="340" height="210" rx="10" fill="#195C33"/>${[0,2,4,6,8,10].map(i=>`<rect x="${i*31}" width="31" height="210" fill="#1E6A3B"/>`).join("")}
      <g fill="none" stroke="rgba(255,255,255,.32)" stroke-width="1.3"><rect x="4" y="4" width="332" height="202" rx="4"/><path d="M170 4v202"/><circle cx="170" cy="105" r="24"/>
        <rect x="4" y="58" width="38" height="94"/><rect x="298" y="58" width="38" height="94"/></g>
      ${side(left, false)}${side(right, true)}
    </svg>
    <p class="sq-key">${you ? "You're the gold ring. " : f.me && f.me.st==="sub" ? "You start on the bench. " : ""}Tap a player for their card. Their key man: <b>${esc(key.name)}</b> (${key.pos}, rated ${sqRating(key, f.oppStr)}).</p>
  </details>`;
}
// after one of your matches: who scored and set up each goal (with the minutes from your key moments when you played
// them), everyone's match rating, and the Player of the Match. Returns both sides' [goals, assists, rating] by place in
// the XI (null for anyone who didn't play), for the league's stats
function sqMatch(f, ev){
  const our = S.mc.club, me = f.me, {gf, ga} = f.res, u = sqSlotOf(S.player.pos);
  const sides = [{club:our, xi:sqSquad(our), q:strOf(our), oq:f.oppStr}, {club:f.opp, xi:sqSquad(f.opp), q:f.oppStr, oq:strOf(our)}];
  const on = [sides[0].xi.map((p,i)=>!(me.st==="start" && i===u)), sides[1].xi.map(()=>true)];
  // the goals in order: from the key moments, or at random minutes (yours while you were on the pitch)
  let evs;
  if (ev) evs = ev.map(e=>({...e}));
  else {
    evs = [...Array(gf)].map(()=>({us:true})).concat([...Array(ga)].map(()=>({us:false})));
    const ours = shuffle(evs.filter(e=>e.us)), lo = me.st==="sub" ? 91-me.mins : 1, hi = me.st==="start" ? me.mins : 90;
    ours.slice(0, me.g).forEach(e=>{ e.me = "g"; }); ours.slice(me.g, me.g+me.a).forEach(e=>{ e.me = "a"; });
    shuffle(evs.filter(e=>!e.us)).slice(0, me.og || 0).forEach(e=>{ e.og = true; });
    evs.forEach(e=>{ e.min = e.me || e.og ? lo + Math.floor(Math.random()*Math.max(1, hi-lo+1)) : 1 + Math.floor(Math.random()*90); });
  }
  evs.sort((a,b)=>a.min-b.min);
  const tally = sides.map(sd=>sd.xi.map(()=>[0,0]));
  f.sc = evs.map(e=>{
    const s = e.us ? 0 : 1, name = i => i<0 ? "You" : sqSurname(sides[s].xi[i].name);
    if (e.og) return {m:e.min, u:0, s:"You", og:1, me:1};
    const by = e.me==="g" ? -1 : sqPick(sides[s].xi, on[s], 0, -1);
    const from = e.me==="a" ? -1 : Math.random()<.72 ? sqPick(sides[s].xi, on[s], 1, by) : null;
    if (by>=0) tally[s][by][0]++;
    if (from!=null && from>=0) tally[s][from][1]++;
    return {m:e.min, u:e.us ? 1 : 0, s:name(by), a:from==null ? "" : name(from), me:by<0 ? 1 : 0};
  });
  const rt = sides.map((sd,s)=>sd.xi.map((p,i)=>on[s][i] ? sqRate(p.pos, sd.q + p.r, sd.oq, tally[s][i][0], tally[s][i][1], s ? ga : gf, s ? gf : ga) : null));
  let best = null;
  sides.forEach((sd,s)=>sd.xi.forEach((p,i)=>{ const r = rt[s][i]; if (r!=null && (!best || r>best.r)) best = {n:p.name, c:sd.club, r}; }));
  f.potm = me.mins>0 && me.r!=null && (!best || me.r>=best.r);
  f.potmBy = f.potm ? null : best;
  return sides.map((sd,s)=>sd.xi.map((p,i)=>rt[s][i]==null ? null : [tally[s][i][0], tally[s][i][1], rt[s][i]]));
}
// your name where a list would say "you": glowing gold, so it's easy to spot
const sqMeName = (n = S.player.name) => `<b class="me-name">${esc(n)}</b>`;
// the full-time goal list: "Smith 12', Your Name 54'" under each side (yours glowing)
function sqScorers(f){
  if (!f.sc || !f.sc.length) return "";
  const line = us => f.sc.filter(g=>!!g.u===us).map(g=>`${g.me || g.s==="You" ? sqMeName() : esc(g.s)}${g.og ? " (og)" : ""} ${g.m}'`).join(", ");
  const [l, r] = f.home || f.neutral ? [line(true), line(false)] : [line(false), line(true)];
  return `<div class="sq-goals"><span>${l}</span><i aria-hidden="true">⚽</i><span>${r}</span></div>`;
}

/* ---------- player cards ---------- */
// a player's card: rating, age, nationality, years at the club and the league season so far. Any element with
// data-pl="club|place in the XI" (or "me") opens one: the leaderboards, the squad list, the line-ups (whose data-str
// carries the strength of a European opponent from outside the game's leagues) and the summer's transfers (whose
// data-season is next season while the window is open)
function sqLeague(club){ return S.lg && S.lg.s===seasonLabel(S.season) ? Object.entries(S.lg.L).find(([,L])=>L.ps[club] || L.tab[club]) || null : null; }
function sqCard(club, i, base = strOf(club), season = S.season){
  const me = club==="me", p = me ? null : sqSquad(club, season)[i], c = me ? S.club : club, lk = season===S.season ? sqLeague(c) : null;
  const L = lk && lk[1], x = !L ? null : me ? L.me : L.ps[club] && L.ps[club][i];
  const find = me ? q=>q.me : q=>q.club===club && q.i===i, rank = k => L ? (lgLeaders(L, k).find(find) || {}).rank : null;
  const tile = (l, v) => `<div class="total"><div class="label">${l}</div><div class="v">${v}</div></div>`;
  const name = me ? S.player.name : p.name, pos = me ? S.player.pos : p.pos, top = [["g", "in the scoring charts"], ["a", "for assists"], ["avg", "for average rating"]].map(([k,t])=>[rank(k), t]).filter(([r])=>r && r<=20);
  return `<div class="dlg-in pl-card">
    <div class="dlg-head">${clubBadge(c, 40)}<div style="min-width:0"><h2 id="plDlgTitle">${esc(name)}</h2><p class="hint">${esc(c)} · #${esc(me ? S.player.number : p.num)} · ${esc(POS[pos] ? POS[pos].label : pos)}</p></div>
      <button type="button" class="dlg-x" data-pl-close aria-label="Close">×</button></div>
    <div class="pl-top"><div class="pl-ovr"><b>${me ? (S.attr ? mcOvr() : "–") : sqRating(p, base)}</b><span>Rating</span></div>
      <div class="pills"><span class="pill">${esc(me ? S.player.nation || "No nation" : p.nat)}</span><span class="pill">Age ${me ? S.age : p.age}</span>${me ? "" : `<span class="pill">At the club since ${seasonLabel(p.since)}</span>`}${p && p.mv ? `<span class="pill">From ${esc(p.from)}${p.fee ? ` · ${money(p.fee)}` : ""}</span>` : ""}</div></div>
    ${p && p.hist ? `<p class="hint pl-path">${[...p.hist, [club, p.since]].map(([c, y])=>`${esc(c)} <span>${seasonLabel(y)}</span>`).join(" › ")}</p>` : ""}
    ${sqHonours(me, p, club, season)}
    <section><h3>${L ? `${esc(TIERS[lk[0]].name)} this season` : season===S.season ? "This season" : seasonLabel(season)}</h3>
    ${x && x[0] ? `<div class="totals pl-four">${tile("Games", x[0])}${tile("Goals", x[1])}${tile("Assists", x[2])}${tile("Avg", (x[3]/10/x[0]).toFixed(2))}</div>
      <p class="hint" style="margin:10px 0 0">${top.map(([r,t])=>`${ord(r)} ${t}`).join(" · ") || "Not in the league's top 20 for goals, assists or ratings yet."}</p>`
    : `<p class="hint" style="margin:0">${L ? "No league games this season yet." : season!==S.season ? "No games for the club yet." : "Only your own league is played out week by week, so there are no season numbers here."}</p>`}
    ${season===S.season ? cpCardLine(me ? "me" : club, i) + euCardLine(me ? "me" : club, i) : ""}</section>
    ${me && S.history.length && !lvEl ? `<button type="button" class="btn" data-act="my-profile" style="justify-self:start">Your full profile ›</button>` : ""}
  </div>`;
}
// a player's awards from the roll of honour (lgHonours): matched by name and year of birth, or by name and club for
// seasons saved before years of birth were kept
function sqHonours(me, p, club, season){
  const out = [], clubs = p ? [club, ...(p.hist || []).map(h=>h[0])] : [];
  (S.honours || []).forEach(h=>Object.entries(h.lb || {}).forEach(([k, lb])=>lb.forEach((x, j)=>{
    if (x && (me ? x[3] : !x[3] && x[0]===p.name && (x[4]!=null ? x[4]===season - p.age : clubs.includes(x[1]))))
      out.push(`${j ? "Player of the Season" : "Golden Boot"} ${h.s} (${TIERS[k] ? TIERS[k].short : k})`);
  })));
  return out.length ? `<div class="pills pl-hon">${out.map(t=>`<span class="pill gold">🏆 ${esc(t)}</span>`).join("")}</div>` : "";
}
function sqOpen(key, str, season){
  const d = document.getElementById("plDlg"); if (!d) return;
  const [club, i] = key==="me" ? ["me", 0] : [key.slice(0, key.lastIndexOf("|")), +key.slice(key.lastIndexOf("|")+1)];
  d.innerHTML = sqCard(club, i, str ? +str : undefined, season ? +season : undefined);
  if (d.showModal){ if (!d.open) d.showModal(); } else d.setAttribute("open", "");
}
document.addEventListener("click", e=>{ const t = e.target.closest && e.target.closest("[data-pl]"); if (t) sqOpen(t.dataset.pl, t.dataset.str, t.dataset.season); });
document.addEventListener("keydown", e=>{ const t = (e.key==="Enter" || e.key===" ") && e.target.closest && e.target.closest("[data-pl]"); if (t){ e.preventDefault(); sqOpen(t.dataset.pl, t.dataset.str, t.dataset.season); } });
document.getElementById("plDlg")?.addEventListener("click", e=>{ if (e.target.id==="plDlg" || e.target.closest("[data-pl-close], [data-act]")) e.currentTarget.close(); });
// your club's XI under Club & leagues: ratings and this season's league numbers, you first; a tap opens a player's card
function sqSquadPanel(){
  const club = S.club, lk = sqLeague(club), L = lk && lk[1];
  const row = (key, num, name, sub, rt, x, me) => { const n = x && x[0], avg = n ? (x[3]/10/x[0]).toFixed(2) : "–";
    return `<li class="${me ? "me" : ""}" data-pl="${esc(key)}" tabindex="0" role="button" aria-label="${esc(`${name}${me ? " (you)" : ""}, ${sub}, rated ${rt}${n ? `: ${x[1]} goals, ${x[2]} assists, average rating ${avg}` : ""}. Open card`)}">
    <span class="lg-rk">${esc(num)}</span><span class="lg-who"><b class="${me ? "me-name" : ""}">${esc(name)}</b><small>${esc(sub)}</small></span>
    <span class="sq-n sq-g">${n ? x[1] : "–"}</span><span class="sq-n sq-a">${n ? x[2] : "–"}</span><span class="sq-n sq-av">${avg}</span><span class="lg-v">${rt}</span></li>`; };
  return `<section class="panel"><h2>${esc(club)} squad</h2>
    <p class="hint" style="margin-bottom:12px">Ratings, and this season's league goals, assists and average match rating. When you start, you replace the player in your position. Tap a player for their card.</p>
    <div class="sq-hd" aria-hidden="true"><span>#</span><span>Player</span><span>G</span><span>A</span><span>Avg</span><span>Rtg</span></div>
    <ol class="lg-lead sq-list">${row("me", S.player.number, S.player.name, `${S.player.pos} · ${S.age} · ${S.player.nation || "–"}`, S.attr ? mcOvr() : "–", L && L.me, true)}
      ${sqSquad(club).map((p,i)=>row(`${club}|${i}`, p.num, p.name, `${p.pos} · ${p.age} · ${p.nat}`, sqRating(p, strOf(club)), L && L.ps[club] && L.ps[club][i])).join("")}</ol>
  </section>`;
}

/* ---------- the summer transfer window ---------- */
// At the end of each season some of the best players at smaller clubs move up to bigger clubs that need them: a club
// buys when he'd be a clear upgrade in his position, and fills the place he leaves with a newcomer. A signing stays
// until his new place would next change hands anyway (at least three seasons, never past 34). Every stay ends when a
// place's own next player is due, so nobody who has left ever comes back. Kept in
// S.xf = {slots:{"club|place": [{since, until, p:{name, nat, num, age, ab (ability before age), from, fee, hist (earlier
// clubs: [[club, season he joined]])}}, or
// without p for a newcomer (tag picks him)]}, news:{s, list:[{n, pos, age, from, to, j (his place at the new club),
// fee, rt}]}}. A stay is kept until the window after it ends, so last season's squads stay as they were.
const SQ_MOVES = 4;   // the most players each league sells in a summer
const sqFee = (rt, age, pos, k) => { const T = TIERS[k], q = clamp((rt - T.lo)/(T.hi - T.lo), .05, 1.1); return roundTM(T.ceil*ageF(age)*POS[pos].pf*Math.pow(q, 3)*(.85 + Math.random()*.3)); };
// someone new at a place from o.since: whoever was there leaves, and anything planned for later is replaced
function sqSet(club, i, o){
  const key = `${club}|${i}`, L = (S.xf.slots[key] || []).filter(x=>x.since<o.since);
  L.forEach(x=>{ if (x.until>o.since) x.until = o.since; });
  S.xf.slots[key] = [...L, o];
}
function sqWindow(s){
  const X = S.xf ||= {slots:{}, news:null};
  if (X.news && X.news.s>=s) return null;   // this summer's business is already done
  Object.keys(X.slots).forEach(k=>{ X.slots[k] = X.slots[k].filter(o=>o.until>=s); if (!X.slots[k].length) delete X.slots[k]; });
  sqCache.clear();
  const u = sqSlotOf(S.player.pos), clubs = LEAGUES.flatMap(k=>S.world.tiers[k].map(c=>({c, k, str:strOf(c), xi:sqSquad(c, s).slice()})));
  const cand = clubs.flatMap(C=>C.xi.map((p,i)=>({C, i, p, rt:C.str + p.r})))
    .filter(x=>x.p.r>=3 && x.p.age>=19 && x.p.age<=28 && x.p.since<s && !(x.p.mv && x.p.since>=s-1)).sort((a,b)=>b.rt-a.rt);
  const buys = new Map(), sold = new Map(), list = [];
  for (const x of cand){
    if ((sold.get(x.C.k) || 0)>=SQ_MOVES || Math.random()>.3 || x.C.xi[x.i]!==x.p) continue;
    // the clubs at least a step up with a clearly weaker player in his position (never in your place at your club)
    const opts = [];
    clubs.forEach(B=>{
      if (B.c===x.C.c || B.str < x.C.str + 3 || (buys.get(B.c) || 0) >= (TIERS[B.k].level===1 ? 2 : 1) || B.xi.some(q=>q.name===x.p.name)) return;
      let j = -1, low = Infinity;
      B.xi.forEach((q,jj)=>{ if (q.pos===x.p.pos && !q.fresh && !(B.c===S.club && jj===u) && B.str + q.r < low){ low = B.str + q.r; j = jj; } });
      if (j>=0 && x.rt >= low + 2) opts.push({B, j, w:(TIERS[B.k].country===TIERS[x.C.k].country ? 3 : TIERS[B.k].pr>=.8 ? 1.2 : .4)*Math.exp((B.str - x.C.str)/12)});
    });
    if (!opts.length) continue;
    let w = Math.random()*opts.reduce((t,o)=>t + o.w, 0), o = opts[opts.length-1];
    for (const y of opts){ w -= y.w; if (w<=0){ o = y; break; } }
    const {B, j} = o, p = x.p, fee = sqFee(x.rt, p.age, p.pos, B.k);
    const until = sqNextStart(B.c, j, s + 3), leave = Math.min(until, s + Math.max(2, 34 - p.age));
    sqSet(B.c, j, {since:s, until:leave, p:{name:p.name, nat:p.nat, num:p.num, age:p.age, ab:+(x.rt - sqAgeAdj(p.age)).toFixed(1), from:x.C.c, fee, hist:[...(p.hist || []), [x.C.c, p.since]]}});
    if (leave<until) sqSet(B.c, j, {since:leave, until});
    // the newcomer stays until the place would change hands anyway, or until the end of anything already planned
    // there; he never shares a name with a team-mate
    const nc = {since:s, until:Math.max(sqNextStart(x.C.c, x.i, s + 1), ...(X.slots[`${x.C.c}|${x.i}`] || []).map(e=>e.until))}, H = sqHome(x.C.c);
    sqSet(x.C.c, x.i, nc);
    for (let t=1; t<6 && x.C.xi.some(q=>q.name===sqPlayer(x.C.c, x.i, s, H).name); t++) nc.tag = `n${s}x${t}`;
    B.xi[j] = {...p, fresh:true}; x.C.xi[x.i] = {pos:p.pos, r:-99, age:99, fresh:true};
    buys.set(B.c, (buys.get(B.c) || 0) + 1); sold.set(x.C.k, (sold.get(x.C.k) || 0) + 1);
    list.push({n:p.name, pos:p.pos, age:p.age, from:x.C.c, to:B.c, j, fee, rt:Math.round(x.rt)});
  }
  sqCache.clear();
  return X.news = {s, list:list.sort((a,b)=>b.fee-a.fee)};
}
// the inbox round-up: the biggest deal, your club's business and how many deals touch your league
function sqNewsNote(N){
  if (!N || !N.list.length) return;
  const k = tierOf(S.club), mine = N.list.filter(m=>m.to===S.club || m.from===S.club), lg = N.list.filter(m=>tierOf(m.to)===k || tierOf(m.from)===k).length, top = N.list[0];
  note(mine.length ? "club" : "info", "Summer transfers", `The biggest move of the summer: ${top.n} (${top.pos}, ${top.age}) from ${top.from} to ${top.to} for ${money(top.fee)}.`
    + `${mine.length ? ` At ${S.club}: ${mine.map(m=>m.to===S.club ? `${m.n} (${m.pos}) signed from ${m.from}` : `${m.n} (${m.pos}) sold to ${m.to}`).join("; ")}.` : ""}`
    + `${lg ? ` ${lg} deal${lg===1 ? "" : "s"} involve ${theName(k)}: the full list is under Club & leagues.` : ""}`);
}
// the summer's moves in and out of a league, under Club & leagues; a tap opens the player's card at his new club
function sqMovesHTML(k){
  const N = S.xf && S.xf.news; if (!N || !LEAGUES.includes(k)) return "";
  const list = N.list.filter(m=>tierOf(m.to)===k || tierOf(m.from)===k), next = N.s > S.season;
  return `<details class="panel ss-panel" ${S.phase==="window" && list.length ? "open" : ""}><summary><h2>Summer ${N.s} transfers</h2></summary>
    ${list.length ? `<ol class="lg-lead xf-list">${list.map(m=>`<li class="${m.to===S.club || m.from===S.club ? "me" : ""}" data-pl="${esc(`${m.to}|${m.j}`)}" ${next ? `data-season="${N.s}"` : ""} tabindex="0" role="button" aria-label="${esc(`${m.n}, ${m.pos}, ${m.age}, from ${m.from} to ${m.to} for ${money(m.fee)}. Open card`)}">
      <span class="xf-nm"><b>${esc(m.n)}</b><small>${m.pos} · ${m.age} · rated ${m.rt}</small></span><span class="lg-v">${money(m.fee)}</span>
      <span class="xf-cl">${clubBadge(m.from, 16)}<span>${esc(m.from)}</span><i aria-hidden="true">›</i>${clubBadge(m.to, 16)}<span>${esc(m.to)}</span></span></li>`).join("")}</ol>
      <p class="hint" style="margin-top:8px">The big deals in and out of ${esc(theName(k))}. Tap a player for their card.</p>`
    : `<p class="empty">No big deals in or out of ${esc(theName(k))} this summer.</p>`}
  </details>`;
}
