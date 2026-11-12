/* ================= DATA ================= */
const TIERS = {
  1:{pr:1, eu:[4,1,1], name:"Premier League", short:"PL",   level:1, country:"England", ceil:125e6, wage:1,   floor:8000, lo:72, hi:90, games:38, up:0, po:null,  down:3, title:"Premier League", second:2},
  2:{pr:.45, name:"Championship",   short:"Champ",level:2, country:"England", ceil:18e6,  wage:.6,  floor:2500, lo:62, hi:74, games:46, up:2, po:[3,6], down:3, title:"Championship title", second:3},
  3:{pr:.22, name:"League One",     short:"L1",   level:3, country:"England", ceil:3e6,   wage:.4,  floor:1000, lo:54, hi:64, games:46, up:2, po:[3,6], down:4, title:"League One title", second:4},
  4:{pr:.12, name:"League Two",     short:"L2",   level:4, country:"England", ceil:1e6,   wage:.32, floor:600,  lo:47, hi:57, games:46, up:3, po:[4,7], down:2, title:"League Two title", second:5},
  5:{pr:.05, name:"National League",short:"NL",   level:5, country:"England", ceil:.25e6, wage:.3, floor:250,  lo:40, hi:50, games:46, up:1, po:[2,5], down:4, title:"National League title", second:6},
  6:{pr:.02, name:"National League North/South", short:"NL N/S", level:6, country:"England", pool:true, feeds:5, ceil:.08e6, wage:.1, floor:150, lo:34, hi:44},
  ES:{pr:.95, eu:[4,1,1], name:"La Liga",   short:"La Liga",   level:1, country:"Spain",   ceil:115e6, wage:.75,  floor:7000, lo:72, hi:92, games:38, up:0, down:3, title:"La Liga title",   second:"ES2", champs:"Champions of Spain!",
      cup:{code:"cdr", name:"Copa del Rey", rounds:["1st Round","2nd Round","Round of 32","Round of 16","Quarter-final","Semi-final","Final"], sf:5, early:2}},
  DE:{pr:.9, eu:[4,1,1], name:"Bundesliga",short:"Bundesliga",level:1, country:"Germany", ceil:110e6,  wage:.7,  floor:6000, lo:71, hi:91, games:34, up:0, down:2, relPO:true, title:"Bundesliga title", second:"DE2", champs:"Champions of Germany!",
      cup:{code:"dfb", name:"DFB-Pokal", rounds:["1st Round","2nd Round","Round of 16","Quarter-final","Semi-final","Final"], sf:null, early:1}},
  IT:{pr:.9, eu:[4,1,1], name:"Serie A",   short:"Serie A",   level:1, country:"Italy",   ceil:95e6,  wage:.7,  floor:6000, lo:72, hi:89, games:38, up:0, down:3, title:"Serie A title",   second:"IT2", champs:"Champions of Italy!",
      cup:{code:"cit", name:"Coppa Italia", rounds:["Round of 32","Round of 16","Quarter-final","Semi-final","Final"], sf:3, early:1}},
  FR:{pr:.8, eu:[4,1,1], name:"Ligue 1",   short:"Ligue 1",   level:1, country:"France",  ceil:88e6,  wage:.6, floor:5000, lo:70, hi:91, games:34, up:0, down:2, relPO:true, title:"Ligue 1 title",   second:"FR2", champs:"Champions of France!",
      cup:{code:"cdf", name:"Coupe de France", rounds:["Round of 64","Round of 32","Round of 16","Quarter-final","Semi-final","Final"], sf:null, early:2}},
  ES2:{pr:.4, name:"Segunda División", short:"Segunda", level:2, country:"Spain",   pool:true, feeds:"ES", ceil:8e6, wage:.4, floor:1500, lo:64, hi:72},
  DE2:{pr:.4, name:"2. Bundesliga",    short:"2. BL",   level:2, country:"Germany", pool:true, feeds:"DE", ceil:8e6, wage:.4, floor:1500, lo:63, hi:71},
  IT2:{pr:.38, name:"Serie B",          short:"Serie B", level:2, country:"Italy",   pool:true, feeds:"IT", ceil:7e6, wage:.4, floor:1500, lo:63, hi:71},
  POR:{pr:.6, eu:[2,1,1], name:"Primeira Liga", short:"Liga Portugal", level:1, country:"Portugal", ceil:45e6, wage:.35, floor:2000, lo:62, hi:84, games:34, up:0, down:2, relPO:true, title:"Primeira Liga title", second:"POR2", champs:"Champions of Portugal!",
      cup:{code:"tdp", name:"Taça de Portugal", rounds:["3rd Round","4th Round","5th Round","Quarter-final","Semi-final","Final"], sf:4, early:2}},
  NED:{pr:.58, eu:[2,1,1], name:"Eredivisie", short:"Eredivisie", level:1, country:"Netherlands", ceil:40e6, wage:.35, floor:2000, lo:61, hi:82, games:34, up:0, down:2, relPO:true, title:"Eredivisie title", second:"NED2", champs:"Champions of the Netherlands!",
      cup:{code:"knvb", name:"KNVB Cup", rounds:["1st Round","2nd Round","Round of 16","Quarter-final","Semi-final","Final"], sf:null, early:1}},
  SCO:{pr:.4, eu:[1,1,2], name:"Scottish Premiership", short:"SPFL", level:1, country:"Scotland", ceil:15e6, wage:.32, floor:1000, lo:56, hi:80, games:38, up:0, down:1, relPO:true, title:"Scottish Premiership title", second:"SCO2", champs:"Champions of Scotland!",
      cup:{code:"scup", name:"Scottish Cup", rounds:["4th Round","5th Round","Quarter-final","Semi-final","Final"], sf:null, early:1}},
  POR2:{pr:.25, name:"Liga Portugal 2", short:"LP2", level:2, country:"Portugal", pool:true, feeds:"POR", ceil:3e6, wage:.2, floor:600, lo:54, hi:62},
  NED2:{pr:.25, name:"Eerste Divisie", short:"Eerste Div", level:2, country:"Netherlands", pool:true, feeds:"NED", ceil:3e6, wage:.2, floor:600, lo:53, hi:61},
  SCO2:{pr:.15, name:"Scottish Championship", short:"SC Champ", level:2, country:"Scotland", pool:true, feeds:"SCO", ceil:1.5e6, wage:.15, floor:400, lo:48, hi:56},
  FR2:{pr:.35, name:"Ligue 2",          short:"Ligue 2", level:2, country:"France",  pool:true, feeds:"FR", ceil:6e6, wage:.35,floor:1200, lo:62, hi:70}
};
const ENG = [1,2,3,4,5], FOREIGN = ["ES","DE","IT","FR","POR","NED","SCO"], TOP = [1,...FOREIGN];
const LEAGUES = [...ENG, ...FOREIGN], POOLS = [6,"ES2","DE2","IT2","FR2","POR2","NED2","SCO2"], ALLKEYS = [...LEAGUES, ...POOLS];
const keyOf = k => isNaN(k) ? k : +k;
const isTop = t => TOP.includes(t);
const cupNames = {cdr:"Copa del Rey", dfb:"DFB-Pokal", cit:"Coppa Italia", cdf:"Coupe de France", tdp:"Taça de Portugal", knvb:"KNVB Cup", scup:"Scottish Cup"};
// name|shirt|trim|stature 0.6–1|founded|nickname|ground|bio
const RAW = {
1:`Arsenal|#EF0107|#FFFFFF|1|1886|The Gunners|Emirates Stadium|Founded by munitions workers at the Royal Arsenal in Woolwich, they went a whole league season unbeaten in 2003/04.
Aston Villa|#670E36|#95BFE5|.88|1874|The Villans|Villa Park|Founder members of the Football League in 1888 and European Cup winners in 1982.
Bournemouth|#DA291C|#111111|.74|1899|The Cherries|Vitality Stadium|Climbed from the fourth tier to the Premier League in the 2010s and now play in Europe from one of the smallest grounds in the top flight.
Brentford|#E30613|#FFFFFF|.74|1889|The Bees|Gtech Community Stadium|Known for data-driven recruitment that took them back to the top flight in 2021 after 74 years away.
Brighton & Hove Albion|#0057B8|#FFFFFF|.8|1901|The Seagulls|Amex Stadium|Nearly dropped out of the Football League in 1997; now famous for smart scouting and selling players for big fees.
Chelsea|#034694|#FFFFFF|1|1905|The Blues|Stamford Bridge|Two-time European champions and winners of the 2025 Club World Cup.
Coventry City|#59B3E4|#FFFFFF|.64|1883|The Sky Blues|Coventry Building Society Arena|FA Cup winners in 1987, back in the Premier League in 2026 under Frank Lampard after 25 years away.
Crystal Palace|#1B458F|#C4122E|.76|1905|The Eagles|Selhurst Park|Won their first major trophy, the FA Cup, in 2025, then lifted the Conference League a year later.
Everton|#003399|#FFFFFF|.76|1878|The Toffees|Hill Dickinson Stadium|Nine-time champions of England who left Goodison Park for a new waterfront stadium in 2025.
Fulham|#F4F4F4|#111111|.72|1879|The Cottagers|Craven Cottage|London's oldest professional club, on the banks of the Thames, and Europa League finalists in 2010.
Hull City|#F5A12D|#111111|.62|1904|The Tigers|MKM Stadium|Won the 2026 Championship play-offs from sixth to return to the top flight for the first time since 2016/17.
Ipswich Town|#0044A9|#FFFFFF|.64|1878|The Tractor Boys|Portman Road|Champions of England in 1962 and UEFA Cup winners in 1981 under Bobby Robson.
Leeds United|#F4F4F4|#1D428A|.72|1919|The Whites|Elland Road|Three-time champions of England, last crowned in 1992 just before the Premier League began.
Liverpool|#C8102E|#FFFFFF|1|1892|The Reds|Anfield|Six-time European champions and 20-time champions of England.
Manchester City|#6CABDD|#FFFFFF|1|1880|The Citizens|Etihad Stadium|Won four straight Premier League titles from 2021 to 2024 and the treble in 2023.
Manchester United|#DA291C|#111111|.96|1878|The Red Devils|Old Trafford|Twenty English titles, three European Cups and the 1999 treble.
Newcastle United|#241F20|#FFFFFF|.9|1892|The Magpies|St James' Park|Ended a 70-year wait for a major domestic trophy by winning the 2025 League Cup.
Nottingham Forest|#DD0000|#FFFFFF|.78|1865|The Tricky Trees|City Ground|Won back-to-back European Cups in 1979 and 1980 under Brian Clough.
Sunderland|#EB172B|#FFFFFF|.68|1879|The Black Cats|Stadium of Light|Six-time champions of England who climbed back from League One to the Premier League and into Europe.
Tottenham Hotspur|#F4F4F4|#132257|.92|1882|Spurs|Tottenham Hotspur Stadium|The first British club to win a European trophy, in 1963, and Europa League winners in 2025.`,
2:`Birmingham City|#0000FF|#FFFFFF|.9|1875|Blues|St Andrew's|League Cup winners in 2011 who won League One with a record 111 points in 2024/25.
Blackburn Rovers|#009EE0|#FFFFFF|.8|1875|Rovers|Ewood Park|Premier League champions in 1995, with Alan Shearer leading the line.
Bolton Wanderers|#F4F4F4|#263C7E|.78|1874|The Trotters|Toughsheet Community Stadium|Founder members of the Football League and four-time FA Cup winners.
Bristol City|#E21A23|#FFFFFF|.82|1894|The Robins|Ashton Gate|Knocked Manchester United out on the way to the 2018 League Cup semi-finals.
Burnley|#6C1D45|#99D6EA|.95|1882|The Clarets|Turf Moor|Founder members of the Football League and two-time champions of England.
Cardiff City|#0070B5|#FFFFFF|.78|1899|The Bluebirds|Cardiff City Stadium|The only club from outside England to win the FA Cup, in 1927.
Charlton Athletic|#D4021D|#FFFFFF|.75|1905|The Addicks|The Valley|FA Cup winners in 1947 who returned to The Valley in 1992 after a long fan campaign.
Derby County|#F4F4F4|#111111|.82|1884|The Rams|Pride Park|Champions of England in 1972 and 1975 under Brian Clough and Dave Mackay.
Lincoln City|#E2001A|#FFFFFF|.7|1884|The Imps|Sincil Bank|Reached the FA Cup quarter-finals as a non-league side in 2017 and have kept climbing ever since.
Middlesbrough|#E11B22|#FFFFFF|.88|1876|Boro|Riverside Stadium|League Cup winners in 2004 and UEFA Cup finalists in 2006.
Millwall|#001D5E|#FFFFFF|.8|1885|The Lions|The Den|South London club that reached the FA Cup final in 2004.
Norwich City|#FFF200|#00A650|.86|1902|The Canaries|Carrow Road|Two-time League Cup winners who knocked Bayern Munich out of the UEFA Cup in 1993.
Portsmouth|#001489|#FFFFFF|.8|1898|Pompey|Fratton Park|FA Cup winners in 1939 and 2008, rebuilt under fan ownership after financial collapse.
Preston North End|#F4F4F4|#002A5C|.78|1880|The Lilywhites|Deepdale|The 'Invincibles' won the first Football League season in 1888/89 without losing a game.
Queens Park Rangers|#1D5BA4|#FFFFFF|.78|1882|The Hoops|Loftus Road|Won the League Cup in 1967 as a third-tier side.
Sheffield United|#EE2737|#FFFFFF|.9|1889|The Blades|Bramall Lane|Bramall Lane is the world's oldest major stadium still hosting professional football.
Southampton|#D71920|#FFFFFF|.95|1885|The Saints|St Mary's Stadium|FA Cup winners in 1976, with an academy that produced Bale, Walcott and Shaw.
Stoke City|#E03A3E|#FFFFFF|.84|1863|The Potters|bet365 Stadium|One of the oldest clubs in the Football League; League Cup winners in 1972.
Swansea City|#F4F4F4|#111111|.82|1912|The Swans|Swansea.com Stadium|Won the 2013 League Cup, the first major English trophy for a Welsh club since 1927.
Watford|#FBEE23|#ED2127|.86|1881|The Hornets|Vicarage Road|Rose from the fourth tier to runners-up in the top flight under Graham Taylor and Elton John.
West Bromwich Albion|#122F67|#FFFFFF|.86|1878|The Baggies|The Hawthorns|Five-time FA Cup winners and champions of England in 1920.
West Ham United|#7A263A|#1BB1E7|1|1895|The Hammers|London Stadium|Conference League winners in 2023 and home of three of England's 1966 World Cup winners.
Wolverhampton Wanderers|#FDB913|#231F20|1|1877|Wolves|Molineux|Three-time champions in the 1950s and pioneers of floodlit European friendlies.
Wrexham|#E4002B|#FFFFFF|.9|1864|The Red Dragons|The Racecourse Ground|Welsh club owned by Ryan Reynolds and Rob McElhenney that won three promotions in a row from 2023 to 2025.`,
3:`AFC Wimbledon|#002E7D|#F7D417|.75|2002|The Dons|Plough Lane|Founded by fans after the original Wimbledon moved to Milton Keynes, and climbed back to the Football League.
Barnsley|#D71921|#FFFFFF|.85|1887|The Tykes|Oakwell|FA Cup winners in 1912 who had one Premier League season in 1997/98.
Blackpool|#F68712|#FFFFFF|.85|1887|The Seasiders|Bloomfield Road|Won the 1953 'Matthews Final' and spent a season in the Premier League in 2010/11.
Bradford City|#8B1D41|#FDB913|.85|1903|The Bantams|Valley Parade|FA Cup winners in 1911 and League Cup finalists as a fourth-tier side in 2013.
Bromley|#F4F4F4|#111111|.72|1892|The Ravens|Hayes Lane|Reached the Football League for the first time in 2024 and kept on climbing.
Burton Albion|#FFD700|#111111|.75|1950|The Brewers|Pirelli Stadium|A young club that rose from non-league to the Championship under Nigel Clough.
Cambridge United|#FDB913|#111111|.75|1912|The U's|Abbey Stadium|Elected to the Football League in 1970 and FA Cup quarter-finalists in 1990 and 1991.
Doncaster Rovers|#E30613|#FFFFFF|.8|1879|Donny|Eco-Power Stadium|League Two champions in 2025, one of many trips up and down the lower divisions.
Huddersfield Town|#0E63AD|#FFFFFF|.9|1908|The Terriers|John Smith's Stadium|The first club to win three English titles in a row, from 1924 to 1926.
Leicester City|#003090|#FDBE11|1|1884|The Foxes|King Power Stadium|Pulled off the 5000-1 Premier League title win in 2016.
Leyton Orient|#C8102E|#FFFFFF|.78|1881|The O's|Brisbane Road|East London club whose ground famously has flats built into its corners.
Luton Town|#F78F1E|#002D62|.92|1885|The Hatters|Kenilworth Road|League Cup winners in 1988 who went from non-league to the Premier League in under a decade.
Mansfield Town|#F5A12D|#1E3C8C|.75|1897|The Stags|Field Mill|Won promotion to League One in 2024.
Milton Keynes Dons|#F4F4F4|#111111|.8|2004|The Dons|Stadium MK|Formed when Wimbledon FC relocated; EFL Trophy winners in 2008.
Notts County|#111111|#FFFFFF|.78|1862|The Magpies|Meadow Lane|The oldest professional football club in the world.
Oxford United|#FFD200|#002D62|.85|1893|The U's|Kassam Stadium|Won the League Cup in 1986 as a top-flight club.
Peterborough United|#0055A5|#FFFFFF|.82|1934|The Posh|Weston Homes Stadium|Scored a record 134 league goals in their first Football League season, 1960/61.
Plymouth Argyle|#00513A|#FFFFFF|.85|1886|The Pilgrims|Home Park|The south-west's biggest club, who knocked Liverpool out of the FA Cup in 2025.
Reading|#004494|#FFFFFF|.85|1871|The Royals|Select Car Leasing Stadium|Set a then-record 106 points winning the Championship in 2006.
Sheffield Wednesday|#0067B1|#FFFFFF|.92|1867|The Owls|Hillsborough|Four-time champions of England and League Cup winners in 1991.
Stevenage|#E30613|#FFFFFF|.72|1976|Boro|Lamex Stadium|Knocked Newcastle out of the FA Cup in 2011.
Stockport County|#0055A4|#FFFFFF|.85|1883|The Hatters|Edgeley Park|Climbed back from non-league with promotions in 2022 and 2024.
Wigan Athletic|#1D59AF|#FFFFFF|.85|1932|The Latics|Brick Community Stadium|Stunned Manchester City to win the 2013 FA Cup final.
Wycombe Wanderers|#88D1F1|#002F6C|.8|1887|The Chairboys|Adams Park|Reached the 2001 FA Cup semi-finals as a third-tier club.`,
4:`Accrington Stanley|#E10A0A|#FFFFFF|.75|1968|Stanley|Wham Stadium|Made famous by the 'Accrington Stanley, who are they?' milk advert; reformed in 1968.
Barnet|#F6A01A|#111111|.75|1888|The Bees|The Hive|Back in the Football League in 2025 after winning the National League.
Barrow|#F4F4F4|#1C3F94|.75|1901|The Bluebirds|Holker Street|Returned to the Football League in 2020 after 48 years away.
Bristol Rovers|#003C8F|#FFFFFF|.85|1883|The Gas|Memorial Stadium|Nicknamed after the gasworks next to their old Eastville home.
Cheltenham Town|#E3001B|#FFFFFF|.78|1887|The Robins|Whaddon Road|Reached the Football League in 1999 and League One in 2021.
Chesterfield|#0047AB|#FFFFFF|.85|1866|The Spireites|SMH Group Stadium|Named after the town's crooked spire; FA Cup semi-finalists in 1997.
Colchester United|#0057B8|#FFFFFF|.8|1937|The U's|JobServe Community Stadium|Knocked Leeds out of the FA Cup in 1971 as a fourth-tier side.
Crawley Town|#CC0000|#FFFFFF|.78|1896|The Red Devils|Broadfield Stadium|Reached the FA Cup fifth round in 2011 and beat Leeds in the FA Cup in 2021.
Crewe Alexandra|#E2001A|#FFFFFF|.8|1877|The Railwaymen|Gresty Road|Famous for an academy that produced David Platt and Danny Murphy.
Exeter City|#E2001A|#FFFFFF|.85|1904|The Grecians|St James Park|Fan-owned club that toured Brazil in 1914 and played their national team.
Fleetwood Town|#E30613|#FFFFFF|.8|1908|The Cod Army|Highbury Stadium|Won six promotions in ten years to reach the third tier.
Gillingham|#0047AB|#FFFFFF|.82|1893|The Gills|Priestfield Stadium|Reached the second tier for the first time in 2000.
Grimsby Town|#111111|#FFFFFF|.85|1878|The Mariners|Blundell Park|Knocked Manchester United out of the League Cup in 2025.
Harrogate Town|#FFD100|#111111|.72|1914|Town|Wetherby Road|Reached the Football League for the first time in 2020.
Newport County|#F7941D|#111111|.75|1912|The Exiles|Rodney Parade|Reached the European Cup Winners' Cup quarter-finals in 1981.
Northampton Town|#880015|#FFFFFF|.85|1897|The Cobblers|Sixfields|Rose from the fourth tier to the top flight between 1961 and 1965, then fell back just as fast.
Oldham Athletic|#0047AB|#FFFFFF|.85|1895|The Latics|Boundary Park|Original Premier League members in 1992/93, back in the Football League in 2025.
Port Vale|#F4F4F4|#111111|.88|1876|The Valiants|Vale Park|FA Cup semi-finalists in 1954 as a third-tier side.
Rotherham United|#E30613|#FFFFFF|.9|1925|The Millers|AESSEAL New York Stadium|Played in the first ever League Cup final in 1961.
Salford City|#E30613|#FFFFFF|.85|1940|The Ammies|Peninsula Stadium|Bought in 2014 by members of Manchester United's Class of '92.
Shrewsbury Town|#003399|#FDB913|.8|1886|The Shrews|Croud Meadow|Won the Welsh Cup six times despite being an English club.
Swindon Town|#E30613|#FFFFFF|.85|1879|The Robins|County Ground|Beat Arsenal in the 1969 League Cup final as a third-tier side.
Tranmere Rovers|#F4F4F4|#003399|.82|1884|Rovers|Prenton Park|Reached the League Cup final in 2000.
Walsall|#E30613|#FFFFFF|.8|1888|The Saddlers|Bescot Stadium|Beat Arsenal in the FA Cup in 1933, one of the great giant-killings.`,
5:`Aldershot Town|#E30613|#0047AB|.8|1992|The Shots|Recreation Ground|Formed after the original Aldershot folded in 1992 and reached the Football League by 2008.
Altrincham|#E30613|#FFFFFF|.78|1891|The Robins|Moss Lane|Have beaten more Football League clubs in the FA Cup than almost any other non-league side.
Boreham Wood|#F4F4F4|#111111|.72|1948|The Wood|Meadow Park|Reached the FA Cup fifth round in 2022.
Boston United|#FDB913|#111111|.72|1933|The Pilgrims|Jakemans Community Stadium|Spent five seasons in the Football League in the 2000s.
Braintree Town|#F68712|#002F6C|.68|1898|The Iron|Cressing Road|Essex club that won promotion back to the National League in 2024.
Brackley Town|#E30613|#FFFFFF|.68|1890|The Saints|St James Park|Won promotion to the National League in 2025.
Carlisle United|#0047AB|#FFFFFF|.92|1904|The Cumbrians|Brunton Park|Briefly top of the First Division in 1974.
Eastleigh|#0047AB|#FFFFFF|.75|1946|The Spitfires|Silverlake Stadium|Named after the Spitfire fighter planes built nearby.
FC Halifax Town|#0047AB|#FFFFFF|.78|2008|The Shaymen|The Shay|Reformed in 2008 and won the FA Trophy in 2016.
Forest Green Rovers|#8DC63F|#111111|.85|1889|The Rovers|The New Lawn|Called the world's greenest football club, with a fully vegan menu.
Gateshead|#F4F4F4|#111111|.75|1977|The Heed|Gateshead International Stadium|FA Trophy winners in 2024.
Hartlepool United|#003399|#FFFFFF|.85|1908|Pools|Victoria Park|Football League members for almost a century until 2017.
Morecambe|#E30613|#FFFFFF|.8|1920|The Shrimps|Mazuma Mobile Stadium|Reached League One in 2021 with a Wembley play-off win.
Rochdale|#003399|#FFFFFF|.85|1907|Dale|Crown Oil Arena|League Cup finalists in 1962 as a fourth-tier club.
Scunthorpe United|#8B1D41|#87CEEB|.82|1899|The Iron|Glanford Park|Kevin Keegan and Ray Clemence both started their careers here.
Southend United|#002F87|#FFFFFF|.85|1906|The Shrimpers|Roots Hall|Spent over a century in the Football League before 2021.
Solihull Moors|#FDB913|#002F6C|.75|2007|The Moors|Damson Park|Formed by a merger in 2007; FA Trophy finalists in 2024.
Sutton United|#FDB913|#8B1D41|.75|1898|The U's|Gander Green Lane|Beat top-flight Coventry in the FA Cup in 1989.
Tamworth|#E30613|#FFFFFF|.72|1933|The Lambs|The Lamb Ground|Drew Tottenham in the FA Cup third round in 2025.
Truro City|#F4F4F4|#111111|.65|1889|The White Tigers|Truro City Stadium|Cornwall's highest-ranked club.
Wealdstone|#0047AB|#FFFFFF|.7|1899|The Stones|Grosvenor Vale|Won the first non-league 'double' of Conference and FA Trophy in 1985.
Woking|#E30613|#FFFFFF|.75|1889|The Cards|Kingfield Stadium|Three-time FA Trophy winners in the 1990s.
Yeovil Town|#00843D|#FFFFFF|.8|1895|The Glovers|Huish Park|Famous FA Cup giant-killers who once reached the Championship.
York City|#E30613|#002F6C|.88|1922|The Minstermen|LNER Community Stadium|Beat Manchester United in the League Cup in 1995.`,
6:`Chester|#0047AB|#FFFFFF|.85|1885|The Blues|Deva Stadium|A former Football League club playing below the National League.
Kidderminster Harriers|#E30613|#FFFFFF|.8|1886|Harriers|Aggborough|FA Trophy winners in 1987 and Football League members from 2000 to 2005.
Torquay United|#FFD100|#0047AB|.8|1899|The Gulls|Plainmoor|A seaside club with over 80 years in the Football League.
Hereford|#F4F4F4|#111111|.75|2014|The Bulls|Edgar Street|Phoenix club of the Hereford United side that beat Newcastle in 1972.
Macclesfield|#0047AB|#FFFFFF|.72|2020|The Silkmen|Moss Rose|Reformed in 2020 and knocked Crystal Palace out of the FA Cup in 2025.
Darlington|#111111|#FFFFFF|.72|1883|The Quakers|Blackwell Meadows|Football League members for most of the 20th century.
Chorley|#F4F4F4|#111111|.65|1883|The Magpies|Victory Park|Reached the FA Cup fourth round in 2021.
Spennymoor Town|#111111|#FFFFFF|.62|1904|The Moors|The Brewery Field|A County Durham club climbing the non-league ladder.
Worthing|#E30613|#FFFFFF|.62|1886|The Rebels|Woodside Road|Sussex club pushing for the National League.
Maidstone United|#FDB913|#111111|.68|1992|The Stones|Gallagher Stadium|Reached the FA Cup fifth round in 2024 as a sixth-tier club.
Dagenham & Redbridge|#E30613|#0047AB|.72|1992|The Daggers|Victoria Road|Spent nine seasons in the Football League.
Ebbsfleet United|#E30613|#FFFFFF|.68|1946|The Fleet|Kuflink Stadium|FA Trophy winners in 2008.
Scarborough Athletic|#E30613|#FFFFFF|.65|2007|The Seadogs|Flamingo Land Stadium|Phoenix club of Scarborough, who once played in the Football League.
Bath City|#111111|#FFFFFF|.65|1889|The Romans|Twerton Park|One of the south-west's oldest clubs.`
};
RAW.ES = `Real Madrid|#F4F4F4|#FEBE10|1|1902|Los Blancos|Santiago Bernabéu|Record 15-time European champions, more than any other club.
Barcelona|#A50044|#004D98|.98|1899|Barça|Spotify Camp Nou|Built the tiki-taka era and won the treble in 2009 and 2015.
Atlético Madrid|#CB3524|#FFFFFF|.9|1903|Los Colchoneros|Riyadh Air Metropolitano|Broke the Real Madrid and Barcelona duopoly to win La Liga in 2014 and 2021 under Diego Simeone.
Villarreal|#FFE667|#005187|.82|1923|The Yellow Submarine|Estadio de la Cerámica|A small-town club that won the Europa League in 2021.
Real Betis|#0BB363|#FFFFFF|.8|1907|Los Verdiblancos|Benito Villamarín|Seville's green-and-white side, Copa del Rey winners in 2022.
Athletic Club|#EE2523|#FFFFFF|.8|1898|Los Leones|San Mamés|Only fields players from the Basque Country, and won the Copa del Rey in 2024.
Real Sociedad|#0067B1|#FFFFFF|.78|1909|La Real|Reale Arena|Back-to-back Spanish champions in 1981 and 1982.
Sevilla|#F4F4F4|#D4021D|.76|1890|Los Nervionenses|Ramón Sánchez-Pizjuán|Record seven-time Europa League winners.
Valencia|#F4F4F4|#111111|.74|1919|Los Che|Mestalla|Reached back-to-back Champions League finals in 2000 and 2001.
Celta Vigo|#8AC3EE|#E5254C|.7|1923|Celta|Balaídos|Galician club and Europa League semi-finalists in 2017.
Osasuna|#D91A21|#0A346F|.68|1920|Los Rojillos|El Sadar|Pamplona club that reached the 2023 Copa del Rey final.
Rayo Vallecano|#F4F4F4|#E53027|.66|1924|Los Franjirrojos|Estadio de Vallecas|Working-class club from the Vallecas neighbourhood of Madrid.
Getafe|#005999|#FFFFFF|.66|1983|Azulones|Coliseum|Madrid suburb side that reached the UEFA Cup quarter-finals in 2008.
Espanyol|#007FC8|#FFFFFF|.66|1900|Los Pericos|RCDE Stadium|Barcelona's other club, UEFA Cup finalists in 1988 and 2007.
Alavés|#0761AF|#FFFFFF|.64|1921|Babazorros|Mendizorrotza|Lost a 5-4 UEFA Cup final thriller to Liverpool in 2001.
Elche|#F4F4F4|#05642C|.62|1923|Los Franjiverdes|Martínez Valero|Valencian club back in La Liga since 2025.
Levante|#B4053F|#004D98|.62|1909|Granotes|Ciutat de València|Valencia's second club, back in La Liga since 2025.
Málaga|#5AB4E5|#FFFFFF|.64|1904|Los Boquerones|La Rosaleda|Champions League quarter-finalists in 2013, back in La Liga through the 2026 play-offs.
Deportivo A Coruña|#0B5AA7|#FFFFFF|.64|1906|Depor|Riazor|Spanish champions in 2000 and Champions League semi-finalists in 2004.
Racing Santander|#00A650|#FFFFFF|.62|1913|Racing|El Sardinero|Founder members of La Liga in 1929, back in the top flight in 2026.`;
RAW.ES2 = `Mallorca|#E20613|#111111|.72|1916|Los Bermellones|Son Moix|Copa del Rey winners in 2003, relegated from La Liga in 2026.
Girona|#E3001B|#FFFFFF|.7|1930|Gironistes|Montilivi|Finished third in La Liga in 2024 and played in the Champions League.
Real Oviedo|#0047AB|#FFFFFF|.62|1926|Los Carbayones|Carlos Tartiere|Returned to La Liga in 2025 after 24 years away, then went straight back down.
Las Palmas|#FFE000|#0047AB|.62|1949|Los Amarillos|Estadio Gran Canaria|The Canary Islands' biggest club.
Real Valladolid|#5F259F|#FFFFFF|.62|1928|Pucela|José Zorrilla|Castilian club and two-time League Cup winners.
Sporting Gijón|#E30613|#FFFFFF|.6|1905|Los Rojiblancos|El Molinón|Asturian club with one of Spain's oldest grounds.`;
RAW.DE = `Bayern Munich|#DC052D|#FFFFFF|1|1900|Die Roten|Allianz Arena|Six-time European champions and Germany's most successful club by distance.
Borussia Dortmund|#FDE100|#111111|.9|1909|BVB|Signal Iduna Park|Famous for the 25,000-strong Yellow Wall; European champions in 1997.
Bayer Leverkusen|#E32221|#111111|.88|1904|Die Werkself|BayArena|Won an unbeaten Bundesliga and German Cup double in 2024.
RB Leipzig|#F4F4F4|#DD0741|.84|2009|Die Roten Bullen|Red Bull Arena|Rose from the fifth tier to the Champions League semi-finals in about a decade.
VfB Stuttgart|#F4F4F4|#E32219|.8|1893|Die Schwaben|MHPArena|Five-time German champions and DFB-Pokal winners in 2025.
Eintracht Frankfurt|#E1000F|#111111|.78|1899|Die Adler|Deutsche Bank Park|Europa League winners in 2022.
SC Freiburg|#E2001A|#111111|.72|1904|Breisgau-Brasilianer|Europa-Park Stadion|Known for patience and stability, rarely sacking managers.
TSG Hoffenheim|#1C63B7|#FFFFFF|.7|1899|Die Kraichgauer|PreZero Arena|Village club that climbed from the fifth tier to the Bundesliga.
Borussia Mönchengladbach|#F4F4F4|#111111|.7|1900|Die Fohlen|Borussia-Park|Five-time German champions in the 1970s.
Werder Bremen|#1D9053|#FFFFFF|.68|1899|Die Werderaner|Weserstadion|Four-time German champions, last crowned in 2004.
Mainz 05|#ED1C24|#FFFFFF|.68|1905|Die Nullfünfer|Mewa Arena|Where Jürgen Klopp started out as a player and manager.
FC Augsburg|#BA3733|#46714D|.64|1907|Die Fuggerstädter|WWK Arena|Bavarian club in the Bundesliga since 2011.
Union Berlin|#EB1923|#FFFFFF|.66|1966|Die Eisernen|Stadion An der Alten Försterei|Fans helped rebuild their own ground; reached the Champions League in 2023.
Hamburger SV|#F4F4F4|#0A3F86|.7|1887|Der Dino|Volksparkstadion|European champions in 1983, back in the Bundesliga in 2025 after seven years away.
1. FC Köln|#F4F4F4|#ED1C24|.68|1948|Die Geißböcke|RheinEnergieStadion|Won the first ever Bundesliga title in 1964.
Schalke 04|#004D9D|#FFFFFF|.72|1904|Die Knappen|Veltins-Arena|Seven-time German champions, promoted back to the Bundesliga in 2026.
SV Elversberg|#111111|#FFFFFF|.6|1907|Die SVE|Ursapharm-Arena|A village club from Saarland that reached the Bundesliga for the first time in 2026.
SC Paderborn|#0055A4|#111111|.6|1907|Die Ostwestfalen|Home Deluxe Arena|Yo-yo club back in the top flight in 2026.`;
RAW.DE2 = `VfL Wolfsburg|#65B32E|#FFFFFF|.72|1945|Die Wölfe|Volkswagen Arena|German champions in 2009, relegated in 2026.
1. FC Heidenheim|#E2001A|#003B79|.6|1846|FCH|Voith-Arena|Reached the Conference League in 2024.
FC St. Pauli|#5C3A21|#FFFFFF|.6|1910|Kiezkicker|Millerntor-Stadion|Cult Hamburg club with a skull-and-crossbones emblem.
Hertha BSC|#005CA9|#FFFFFF|.66|1892|Die Alte Dame|Olympiastadion|Berlin's biggest club.
Hannover 96|#C8102E|#111111|.62|1896|Die Roten|Heinz von Heiden Arena|Two-time German champions.
Fortuna Düsseldorf|#E30613|#FFFFFF|.6|1895|Fortuna|Merkur Spiel-Arena|German champions in 1933.`;
RAW.IT = `Inter|#0068A8|#111111|.98|1908|Nerazzurri|San Siro|Won the treble in 2010.
Napoli|#12A0D7|#FFFFFF|.92|1926|Partenopei|Stadio Diego Armando Maradona|Champions in 2023 and 2025, first crowned with Maradona in 1987.
Juventus|#F4F4F4|#111111|.92|1897|La Vecchia Signora|Allianz Stadium|Won nine Serie A titles in a row from 2012 to 2020.
AC Milan|#FB090B|#111111|.9|1899|Rossoneri|San Siro|Seven-time European champions.
Atalanta|#1E71B8|#111111|.86|1907|La Dea|Gewiss Stadium|Bergamo club that won the Europa League in 2024.
Roma|#8E1F2F|#F0BC42|.84|1927|Giallorossi|Stadio Olimpico|Conference League winners in 2022 under José Mourinho.
Como|#003DA5|#FFFFFF|.8|1907|I Lariani|Stadio Giuseppe Sinigaglia|Lakeside club transformed by big investment, now in the Champions League.
Lazio|#87D8F7|#FFFFFF|.8|1900|Biancocelesti|Stadio Olimpico|Italian champions in 1974 and 2000.
Bologna|#1A2F48|#A21C26|.76|1909|Rossoblù|Stadio Renato Dall'Ara|Won the Coppa Italia in 2025, their first major trophy in 51 years.
Fiorentina|#482E92|#FFFFFF|.76|1926|La Viola|Stadio Artemio Franchi|Reached back-to-back Conference League finals in 2023 and 2024.
Torino|#8A1E03|#FFFFFF|.7|1906|Il Toro|Stadio Olimpico Grande Torino|Grande Torino won five titles in a row before the 1949 Superga air disaster.
Udinese|#F4F4F4|#111111|.66|1896|Le Zebrette|Bluenergy Stadium|Known for a worldwide scouting network.
Genoa|#A41E34|#002D62|.66|1893|Il Grifone|Stadio Luigi Ferraris|Italy's oldest football club.
Sassuolo|#00A752|#111111|.64|1920|Neroverdi|Mapei Stadium|A small-town club owned by the tile maker Mapei.
Parma|#FFD200|#0047AB|.64|1913|I Crociati|Stadio Ennio Tardini|Won two UEFA Cups in the 1990s.
Cagliari|#A70D26|#002D62|.62|1920|Rossoblù|Unipol Domus|Sardinian club, champions in 1970 with Gigi Riva.
Lecce|#FFE000|#E30613|.6|1908|I Giallorossi|Stadio Via del Mare|Southern club from Puglia.
Venezia|#111111|#F68712|.62|1907|I Lagunari|Stadio Pier Luigi Penzo|Fans travel to home games by boat.
Frosinone|#FFE000|#0047AB|.6|1906|I Canarini|Stadio Benito Stirpe|Small Lazio club back in Serie A in 2026.
Monza|#E30613|#FFFFFF|.62|1912|I Brianzoli|U-Power Stadium|Bought by Silvio Berlusconi in 2018 and reached Serie A for the first time in 2022.`;
RAW.IT2 = `Hellas Verona|#FFD200|#002D62|.62|1903|Gialloblù|Stadio Marcantonio Bentegodi|Shock Italian champions in 1985.
Cremonese|#E30613|#808080|.6|1903|I Grigiorossi|Stadio Giovanni Zini|Lombardy club relegated in 2026.
Pisa|#111111|#0047AB|.6|1909|I Nerazzurri|Arena Garibaldi|Back in Serie A in 2025 for the first time in 34 years.
Sampdoria|#0047AB|#FFFFFF|.66|1946|La Samp|Stadio Luigi Ferraris|Champions in 1991 and European Cup finalists in 1992.
Palermo|#F4A6C8|#111111|.64|1900|Rosanero|Stadio Renzo Barbera|Sicily's biggest club.
Empoli|#0047AB|#FFFFFF|.6|1920|Gli Azzurri|Stadio Carlo Castellani|Tuscan club famous for its youth system.`;
RAW.FR = `Paris Saint-Germain|#004170|#DA291C|1|1970|Les Parisiens|Parc des Princes|Won their first Champions League in 2025.
Marseille|#F4F4F4|#2FAEE0|.84|1899|L'OM|Stade Vélodrome|The first French club to win the Champions League, in 1993.
Monaco|#E7001F|#FFFFFF|.82|1924|Les Monégasques|Stade Louis II|Champions League finalists in 2004.
Lyon|#F4F4F4|#0041A3|.82|1950|Les Gones|Groupama Stadium|Won seven French titles in a row from 2002 to 2008.
Lille|#E01E13|#0A2240|.8|1944|Les Dogues|Stade Pierre-Mauroy|French champions in 2021, ahead of PSG.
Lens|#FFE500|#E30613|.8|1906|Les Sang et Or|Stade Bollaert-Delelis|Won the 2026 Coupe de France and finished second to reach the Champions League.
Rennes|#E30613|#111111|.74|1901|Les Rouges et Noirs|Roazhon Park|Coupe de France winners in 2019.
Nice|#E30613|#111111|.72|1904|Les Aiglons|Allianz Riviera|Four-time French champions in the 1950s.
Strasbourg|#009FE3|#FFFFFF|.72|1906|Le Racing|Stade de la Meinau|French champions in 1979.
Paris FC|#002D62|#FFFFFF|.68|1969|Le PFC|Stade Jean-Bouin|Paris' other club, back in Ligue 1 in 2025 with wealthy new owners.
Toulouse|#5B2C86|#FFFFFF|.66|1970|Les Violets|Stadium de Toulouse|Coupe de France winners in 2023.
Brest|#E30613|#FFFFFF|.66|1950|Les Pirates|Stade Francis-Le Blé|Reached the Champions League for the first time in 2024.
Auxerre|#F4F4F4|#0047AB|.62|1905|L'AJA|Stade de l'Abbé-Deschamps|Won the double in 1996 under Guy Roux.
Lorient|#F68712|#111111|.6|1926|Les Merlus|Stade du Moustoir|Brittany fishing-port club.
Angers|#111111|#FFFFFF|.6|1919|Le SCO|Stade Raymond-Kopa|Named their ground after the club's legend Raymond Kopa.
Le Havre|#87CEEB|#002D62|.6|1872|Les Ciel et Marine|Stade Océane|France's oldest football club.
Troyes|#0047AB|#FFFFFF|.6|1986|L'ESTAC|Stade de l'Aube|Promoted back to Ligue 1 in 2026.
Le Mans|#E30613|#FFD200|.58|1985|Les Manceaux|MMArena|Promoted to Ligue 1 in 2026.`;
RAW.FR2 = `Nantes|#FFE000|#00A650|.66|1943|Les Canaris|Stade de la Beaujoire|Eight-time French champions, relegated in 2026.
Metz|#8B1D41|#FFFFFF|.6|1932|Les Grenats|Stade Saint-Symphorien|Lorraine club relegated in 2026.
Saint-Étienne|#00A650|#FFFFFF|.68|1919|Les Verts|Stade Geoffroy-Guichard|Record ten-time French champions.
Montpellier|#F68712|#002D62|.62|1974|La Paillade|Stade de la Mosson|Shock French champions in 2012.
Stade de Reims|#E30613|#FFFFFF|.64|1931|Les Rouges et Blancs|Stade Auguste-Delaune|Reached two European Cup finals in the 1950s.
Guingamp|#E30613|#111111|.6|1912|En Avant|Stade du Roudourou|Won the Coupe de France in 2009 and 2014.`;

RAW.POR = `Benfica|#E30613|#FFFFFF|1|1904|As Águias|Estádio da Luz|Two-time European champions and Portugal's best-supported club.
Porto|#0047AB|#FFFFFF|.98|1893|Dragões|Estádio do Dragão|Won the Champions League in 2004 under José Mourinho.
Sporting CP|#00A650|#FFFFFF|.97|1906|Leões|Estádio José Alvalade|The academy that produced Cristiano Ronaldo and Luís Figo.
Braga|#E30613|#FFFFFF|.85|1921|Arsenalistas|Estádio Municipal de Braga|Play in a stadium carved into a quarry; Europa League finalists in 2011.
Vitória de Guimarães|#F4F4F4|#111111|.75|1922|Os Conquistadores|Estádio D. Afonso Henriques|From the city known as the birthplace of Portugal.
Santa Clara|#E30613|#FFFFFF|.68|1927|Açorianos|Estádio de São Miguel|Club from the Azores islands in the mid-Atlantic.
Famalicão|#0047AB|#FFFFFF|.68|1931|Famalicenses|Estádio Municipal 22 de Junho|Northern club known for selling young talent on.
Gil Vicente|#E30613|#0047AB|.66|1924|Gilistas|Estádio Cidade de Barcelos|Club from the town of Barcelos.
Rio Ave|#00A650|#FFFFFF|.66|1939|Vilacondenses|Estádio dos Arcos|Reached both domestic cup finals in 2014.
Estoril Praia|#FFD200|#0047AB|.64|1939|Canarinhos|Estádio António Coimbra da Mota|Seaside club on the coast near Lisbon.
Moreirense|#00A650|#FFFFFF|.62|1938|Cónegos|Parque Comendador Joaquim de Almeida Freitas|League Cup winners in 2017.
Arouca|#FFD200|#0047AB|.62|1951|Arouquenses|Estádio Municipal de Arouca|Small mountain-town club that reached Europe in 2023.
Casa Pia|#111111|#FFFFFF|.62|1920|Gansos|Estádio Pina Manique|Lisbon club with roots in a historic orphanage school.
Nacional|#111111|#FFFFFF|.62|1910|Alvinegros|Estádio da Madeira|Madeira club where Cristiano Ronaldo played as a boy.
Estrela da Amadora|#E30613|#00A650|.6|2020|Tricolores|Estádio José Gomes|Successor to the Estrela side that won the 1990 Portuguese Cup.
Alverca|#E30613|#FFFFFF|.6|1939|Ribatejanos|Complexo Desportivo do FC Alverca|Back in the top flight in 2025.
Marítimo|#E30613|#00A650|.64|1910|Leões do Almirante Reis|Estádio do Marítimo|Madeira's biggest club, promoted back in 2026.
Académico de Viseu|#111111|#FFFFFF|.6|1914|Viriatos|Estádio do Fontelo|Promoted to the top flight in 2026.`;
RAW.POR2 = `AVS|#E30613|#FFFFFF|.6|2023|Avenses|Estádio do CD Aves|Relegated in 2026.
Tondela|#00A650|#FFD200|.58|1933|Auriverdes|Estádio João Cardoso|Relegated in 2026.
Boavista|#111111|#FFFFFF|.64|1903|Panteras|Estádio do Bessa|Shock Portuguese champions in 2001.
Vizela|#0047AB|#FFFFFF|.58|1939|Vizelenses|Estádio do FC Vizela|Small northern club.
Farense|#F4F4F4|#111111|.58|1910|Leões de Faro|Estádio de São Luís|The Algarve's biggest club.
Chaves|#0047AB|#E30613|.58|1949|Flavienses|Estádio Municipal Eng. Manuel Branco Teixeira|Club near the Spanish border.`;
RAW.NED = `PSV|#ED1C24|#FFFFFF|1|1913|Boeren|Philips Stadion|European champions in 1988.
Ajax|#F4F4F4|#D2122E|.98|1900|Godenzonen|Johan Cruijff ArenA|Four-time European champions, famous for one of the world's great academies.
Feyenoord|#ED1C24|#111111|.95|1908|De Club van Zuid|De Kuip|The first Dutch club to win the European Cup, in 1970.
AZ|#E30613|#FFFFFF|.85|1967|Kaasboeren|AFAS Stadion|Dutch champions in 1981 and 2009.
Twente|#E30613|#FFFFFF|.82|1965|Tukkers|De Grolsch Veste|Dutch champions in 2010 under Steve McClaren.
Utrecht|#E30613|#FFFFFF|.78|1970|FC Utrecht|Stadion Galgenwaard|Three-time KNVB Cup winners.
Go Ahead Eagles|#E30613|#FFD200|.72|1902|Kowet|De Adelaarshorst|Deventer club that won the KNVB Cup in 2025.
Heerenveen|#0047AB|#FFFFFF|.72|1920|Superfriezen|Abe Lenstra Stadion|Frisian club known for developing strikers like Ruud van Nistelrooy.
NEC|#E30613|#111111|.72|1900|NEC|Goffertstadion|Nijmegen club and KNVB Cup finalists in 2024.
Groningen|#00A650|#FFFFFF|.7|1971|Trots van het Noorden|Euroborg|The pride of the north; KNVB Cup winners in 2015.
Sparta Rotterdam|#E30613|#FFFFFF|.68|1888|Kasteelheren|Het Kasteel|The oldest professional club in the Netherlands.
PEC Zwolle|#0047AB|#FFFFFF|.66|1910|Blauwvingers|MAC³PARK Stadion|KNVB Cup winners in 2014.
Willem II|#E30613|#002D62|.64|1896|Tricolores|Koning Willem II Stadion|Tilburg club and three-time Dutch champions, back up in 2026.
ADO Den Haag|#00A650|#FFD200|.66|1905|Ooievaars|Bingoal Stadion|Club from The Hague, promoted back in 2026.
Fortuna Sittard|#FFD200|#00A650|.64|1968|Fortuna|Fortuna Sittard Stadion|Limburg club in the far south of the Netherlands.
Excelsior|#E30613|#111111|.62|1902|Kralingers|Van Donge & De Roo Stadion|Rotterdam's smallest professional club.
Cambuur|#FFD200|#0047AB|.62|1964|Cambuur|Kooi Stadion|Leeuwarden club promoted back in 2026.
Telstar|#F4F4F4|#0047AB|.6|1963|Witte Leeuwen|BUKO Stadion|Returned to the Eredivisie in 2025 for the first time since 1978.`;
RAW.NED2 = `Volendam|#F68712|#111111|.6|1977|Palingboeren|Kras Stadion|Fishing-village club relegated in 2026.
NAC Breda|#FFD200|#111111|.64|1912|NAC|Rat Verlegh Stadion|Dutch champions in 1921, relegated in 2026.
Heracles Almelo|#111111|#FFFFFF|.6|1903|Heraclieden|Asito Stadion|Relegated in 2026.
Vitesse|#FFD200|#111111|.62|1892|Vitas|GelreDome|KNVB Cup winners in 2017.
Roda JC|#FFD200|#111111|.6|1962|Koempels|Parkstad Limburg Stadion|Limburg club and two-time KNVB Cup winners.
De Graafschap|#0047AB|#FFFFFF|.58|1954|Superboeren|De Vijverberg|Doetinchem club with a loud home crowd.`;
RAW.SCO = `Celtic|#00A650|#FFFFFF|1|1887|The Bhoys|Celtic Park|The first British club to win the European Cup, in 1967; 2025/26 champions and cup winners.
Rangers|#0047AB|#FFFFFF|.97|1872|The Gers|Ibrox|Over 50 Scottish titles and Europa League finalists in 2022.
Hearts|#8B1D41|#FFFFFF|.85|1874|The Jambos|Tynecastle Park|Finished second in 2025/26 to reach Champions League qualifying.
Aberdeen|#E30613|#FFFFFF|.8|1903|The Dons|Pittodrie|Beat Real Madrid to win the Cup Winners' Cup in 1983 under Alex Ferguson.
Hibernian|#00A650|#FFFFFF|.8|1875|The Hibees|Easter Road|Ended a 114-year wait for the Scottish Cup in 2016.
Motherwell|#FDB913|#8B1D41|.72|1886|The Steelmen|Fir Park|Finished fourth in 2025/26 to reach Europe.
Dundee United|#F68712|#111111|.72|1909|The Terrors|Tannadice Park|UEFA Cup finalists in 1987.
Kilmarnock|#0047AB|#FFFFFF|.68|1869|Killie|Rugby Park|Scotland's oldest professional club.
St Mirren|#111111|#FFFFFF|.66|1877|The Buddies|SMiSA Stadium|Paisley club that survived the 2026 play-off final.
Dundee|#002D62|#FFFFFF|.66|1893|The Dark Blues|Dens Park|European Cup semi-finalists in 1963.
St Johnstone|#0047AB|#FFFFFF|.64|1884|The Saints|McDiarmid Park|Won both domestic cups in 2021, back up as 2026 Championship winners.
Falkirk|#002D62|#E30613|.62|1876|The Bairns|Falkirk Stadium|Back in the Premiership in 2025.`;
RAW.SCO2 = `Livingston|#FDB913|#111111|.62|1943|Livi|Almondvale|Relegated in 2026.
Partick Thistle|#FDB913|#E30613|.6|1876|The Jags|Firhill|Glasgow's third club, beaten in the 2026 play-off final.
Ross County|#002D62|#FFFFFF|.6|1929|The Staggies|Victoria Park|Highland club and League Cup winners in 2016.
Raith Rovers|#002D62|#FFFFFF|.56|1883|Rovers|Stark's Park|Won the League Cup in 1994 and played Bayern Munich in Europe.
Ayr United|#F4F4F4|#111111|.56|1910|The Honest Men|Somerset Park|Ayrshire club.
Queen's Park|#F4F4F4|#111111|.54|1867|The Spiders|Hampden Park|Scotland's oldest club.`;

const META = {};
const TIER_LISTS = {};
for (const key of Object.keys(RAW)){ const t = keyOf(key); TIER_LISTS[t]=[]; RAW[key].split("\n").forEach(l=>{const [n,c1,c2,r,f,nick,gr,bio]=l.split("|"); META[n]={n,c1,c2,r:+r,founded:f,nick,ground:gr,bio}; TIER_LISTS[t].push(n);}); }

const EURO = {
  UCL:{name:"Champions League", phase:8, top8:16, po:10, pool:"Benfica:80,Sporting CP:80,Porto:79,PSV:79,Feyenoord:77,Ajax:76,Club Brugge:76,Galatasaray:78,Fenerbahçe:78,Shakhtar Donetsk:74,Bodø/Glimt:74,Celtic:73,Slavia Prague:73,AEK Athens:72,LASK:68,Viking:68,Slovan Bratislava:66,Sabah:64"},
  UEL:{name:"Europa League", phase:8, top8:16, po:10, pool:"Benfica:80,Braga:75,Olympiacos:76,Rangers:73,AZ Alkmaar:74,Twente:72,Midtjylland:72,Basel:72,Young Boys:71,Ferencváros:71,Panathinaikos:72,PAOK:72,Red Star Belgrade:72,Salzburg:74,Celtic:73,Ajax:76,Porto:79,Galatasaray:78"},
  UECL:{name:"Conference League", phase:6, top8:13, po:7, pool:"Legia Warsaw:70,Shamrock Rovers:62,Rapid Wien:70,Sparta Prague:72,Lech Poznań:70,Hearts:67,Aberdeen:66,Gent:72,Anderlecht:73,Copenhagen:72,Djurgården:66,Omonia:67,Hibernian:65,Jagiellonia:67,AZ Alkmaar:74,Braga:75,Twente:72,Rangers:73"}
};
for (const k in EURO) EURO[k].teams = EURO[k].pool.split(",").map(s=>{const [n,v]=s.split(":");return {n,str:+v}});
// 2026/27 English clubs in Europe (real qualification)
const EURO_2026 = {"Arsenal":"UCL","Manchester City":"UCL","Manchester United":"UCL","Aston Villa":"UCL","Liverpool":"UCL","Bournemouth":"UEL","Sunderland":"UEL","Crystal Palace":"UEL","Brighton & Hove Albion":"UECL",
  "Real Madrid":"UCL","Barcelona":"UCL","Atlético Madrid":"UCL","Villarreal":"UCL","Real Betis":"UCL","Athletic Club":"UEL","Real Sociedad":"UEL","Celta Vigo":"UECL",
  "Bayern Munich":"UCL","Borussia Dortmund":"UCL","RB Leipzig":"UCL","VfB Stuttgart":"UCL","Bayer Leverkusen":"UEL","Eintracht Frankfurt":"UEL","SC Freiburg":"UECL",
  "Inter":"UCL","Napoli":"UCL","Como":"UCL","Roma":"UCL","Juventus":"UEL","AC Milan":"UEL","Atalanta":"UECL",
  "Paris Saint-Germain":"UCL","Lens":"UCL","Lille":"UCL","Lyon":"UEL","Marseille":"UEL","Rennes":"UEL","Monaco":"UECL",
  "Porto":"UCL","Sporting CP":"UCL","Benfica":"UEL","Braga":"UEL","Vitória de Guimarães":"UECL",
  "PSV":"UCL","Feyenoord":"UCL","Ajax":"UEL","AZ":"UEL","Twente":"UECL",
  "Celtic":"UEL","Rangers":"UEL","Hearts":"UECL","Motherwell":"UECL"};

const POS = {
  GK:{label:"Goalkeeper",  exp:0,   w:0,   cs:.45, pf:.6},
  CB:{label:"Centre-back", exp:.08, w:.15, cs:.2,  pf:.85},
  LB:{label:"Left-back",   exp:.22, w:.3,  cs:.12, pf:.85},
  RB:{label:"Right-back",  exp:.22, w:.3,  cs:.12, pf:.85},
  CDM:{label:"Defensive mid",exp:.15,w:.25,cs:0,   pf:.9},
  CM:{label:"Central mid", exp:.35, w:.4,  cs:0,   pf:.95},
  CAM:{label:"Attacking mid",exp:.6,w:.55, cs:0,   pf:1},
  LW:{label:"Left winger", exp:.7,  w:.55, cs:0,   pf:1},
  RW:{label:"Right winger",exp:.7,  w:.55, cs:0,   pf:1},
  ST:{label:"Striker",     exp:.75, w:.6,  cs:0,   pf:1}
};
const DEF = ["GK","CB","LB","RB"];
const AGE = {16:.8,17:.95,18:1.05,19:1.1,20:1.1,21:1.08,22:1.05,23:1.02,24:1,25:.99,26:.97,27:.94,28:.9,29:.83,30:.73,31:.61,32:.49,33:.38,34:.28,35:.19,36:.13,37:.09,38:.065,39:.05,40:.04,41:.03,42:.025};
const ageF = a => AGE[a] ?? (a<16?.8:.02);
const contractF = y => y<=0?.35:y===1?.6:y===2?.85:y===3?.95:1;
const SKIN = ["#F1C9A5","#D9A37A","#B57D52","#8A5A3B","#5C3A24"];
const HAIRC = {Black:"#17130F",Brown:"#4A2E1A",Blonde:"#D8B25A",Ginger:"#B5522A"};
const COMP_W = {league:1, fa:.7, lc:.6, eflt:.5, fat:.6, cdr:.7, dfb:.7, cit:.7, cdf:.7, tdp:.6, knvb:.6, scup:.6, UCL:1.3, UEL:1.1, UECL:.9};

/* ================= HELPERS ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const gauss = () => { let u=0,v=0; while(!u)u=Math.random(); while(!v)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const ord = n => n + (["th","st","nd","rd"][(n%100-20)%10]||["th","st","nd","rd"][n%100]||"th");
function roundTM(v){ const step = v<1e5?5e3 : v<1e6?25e3 : v<5e6?1e5 : v<20e6?5e5 : v<50e6?1e6 : 5e6; return Math.max(step, Math.round(v/step)*step); }
function money(v){ if (!v) return "€0"; if (v>=1e6) return "€" + (v>=100e6? Math.round(v/1e6) : (Math.round(v/1e5)/10)) + "m"; return "€" + Math.round(v/1e3) + "k"; }
function roundWage(w){ const s = w<1000?50 : w<10000?250 : w<100000?1000 : 5000; return Math.max(s, Math.round(w/s)*s); }
function wageTxt(w){ return w>=1000 ? "£" + (w>=100000? Math.round(w/1000) : Math.round(w/100)/10) + "k/wk" : "£" + w + "/wk"; }
function gbp(v){ return v>=1e6 ? "£" + (Math.round(v/1e5)/10) + "m" : v>=1e3 ? "£" + Math.round(v/1e3) + "k" : "£" + Math.round(v); }
const seasonLabel = y => `${y}/${String((y+1)%100).padStart(2,"0")}`;
const logistic = d => 1/(1+Math.exp(-d));

/* ================= STATE ================= */
// each account on this device keeps its own career and Legacy; start() points these at the signed-in account
let KEY = "efp-career-v1";
let HALL_KEY = "efp-hall-v1";
function loadHall(){ try{ return JSON.parse(localStorage.getItem(HALL_KEY)) || []; }catch(e){ return []; } }
function saveHall(h){ try{ localStorage.setItem(HALL_KEY, JSON.stringify(h)); }catch(e){} }
function careerSummary(){
  const t = {apps:0,g:0,a:0,cs:0,rs:0,rn:0,potm:0}; S.history.forEach(h=>{ t.apps+=h.tot.apps; t.g+=h.tot.g; t.a+=h.tot.a; t.cs+=(h.tot.cs||0); t.rs+=(h.tot.rs||0); t.rn+=(h.tot.rn||0); t.potm+=(h.tot.potm||0); });
  const bd = S.history.map(h=>h.review&&h.review.world&&h.review.world.bdor).filter(Boolean);
  const first = S.history[0], last = S.history[S.history.length-1];
  const teamT = S.trophies.filter(x=>!["boot","medal","ballon"].includes(x.kind)).length;
  const clubs = [...new Set(S.history.map(h=>h.club))];
  return {id:S.id, name:S.player.name, nation:S.player.nation||"", pos:S.player.pos, from:seasonLabel(2026), seasons:new Set(S.history.map(h=>h.season)).size,
    status:S.phase==="retired"?"Retired":"Active", club:S.club, clubs:clubs.length,
    apps:t.apps, goals:t.g, assists:t.a, ga:t.g+t.a, earnings:Math.round(S.earnings||0),
    avgR:t.rn ? +(t.rs/t.rn).toFixed(2) : 0, potm:t.potm,
    peak:Math.max(S.startValue||0, ...S.history.map(h=>h.after)), trophies:teamT,
    bdor:S.trophies.filter(x=>x.kind==="ballon").length, cs:t.cs,
    caps:(S.intl&&S.intl.caps)||0, intlGoals:(S.intl&&S.intl.g)||0, intlTrophies:S.trophies.filter(x=>x.kind==="intl").length,
    leagues:S.trophies.filter(x=>x.kind==="league").length, europe:S.trophies.filter(x=>x.kind==="europe").length,
    awards:S.trophies.filter(x=>["boot","medal","ballon"].includes(x.kind)).length,
    bestBdor: bd.length ? Math.min(...bd) : null, ages: first ? `${first.age}–${last.age}` : "",
    clubList:[...new Set(S.history.map(h=>h.club))].slice(0,8), updated:2e12 + S.history.length*1000 + (S.phase==="retired"?500:0) + (S.log||[]).length,
    detail:{
      look:{skin:S.player.skin, hair:S.player.hair, hairColour:S.player.hairColour, number:S.player.number},
      start:{club:S.log[0] ? S.history[0].club : S.club, value:S.startValue, age:first ? first.age : S.age},
      seasons:S.history.map(h=>({s:h.season, age:h.age, club:h.club, tier:h.tier, loan:!!h.loan, apps:h.tot.apps, g:h.tot.g, a:h.tot.a, cs:h.tot.cs||0, v:h.after,
        r:h.tot.rn ? +(h.tot.rs/h.tot.rn).toFixed(2) : null, m:h.tot.of ? Math.round(h.tot.mins/h.tot.of*100) : null, pm:h.tot.potm||0,
        pos:h.finish?h.finish.pos:null, lg:TIERS[h.tier]?TIERS[h.tier].short:"", inj:(h.injuries||[]).filter(i=>i.tier==="major"||i.tier==="medium").map(i=>i.name),
        bd:h.review&&h.review.world?h.review.world.bdor||null:null, tr:(h.trophies||[]).length})),
      log:S.log.map(m=>({s:m.season, t:m.text, f:m.fee})),
      troph:S.trophies.map(x=>({n:x.name, k:x.kind, s:x.season, c:x.club})),
      colors:Object.fromEntries([...new Set(S.history.map(h=>h.club).concat(S.club))].map(c=>[c,[meta(c).c1, meta(c).c2]]))
    }};
}
function recordCareer(){
  if (!S || !S.history || !S.history.length) return;
  S.id ||= "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const entry = careerSummary();
  const hall = loadHall().filter(e=>e.id!==S.id); hall.push(entry); saveHall(hall);
}
const BOARD = [["apps","Appearances",v=>v],["caps","Caps",v=>v],["intlGoals","International goals",v=>v],["intlTrophies","International trophies",v=>v],["goals","Goals",v=>v],["assists","Assists",v=>v],["ga","Goals + assists",v=>v],
  ["cs","Clean sheets",v=>v],["bdor","Ballon d'Ors",v=>v],["trophies","Club trophies",v=>v],["leagues","League titles",v=>v],
  ["europe","European trophies",v=>v],["awards","Individual awards",v=>v],["avgR","Average rating",v=>v?v.toFixed(2):"–"],["potm","Player of the Match",v=>v],
  ["seasons","Seasons",v=>v],["peak","Peak value",v=>money(v)],["earnings","Career earnings",v=>gbp(v)]];
// the Hall of fame's stats, grouped for its dropdown
const BOARD_GROUPS = [["Career", ["apps","seasons","avgR","potm"]], ["Goals", ["goals","assists","ga","cs"]], ["Trophies", ["trophies","leagues","europe","awards","bdor"]],
  ["Country", ["caps","intlGoals","intlTrophies"]], ["Money", ["peak","earnings"]]];
let boardKey = "apps", profileId = null;
function profileFind(id){
  if (S && S.id===id && S.history && S.history.length) return careerSummary();
  return loadHall().find(e=>e.id===id);
}
function timelineSVG(r){
  const D = r.detail, ss = D.seasons; if (!ss.length) return "";
  const colW = 74, L = 14, W = L*2 + ss.length*colW, top = 18, vH = 92, bandY = top+vH+30, bandH = 24, evY = bandY+bandH+24;
  const maxV = niceMax(Math.max(D.start.value||1, ...ss.map(x=>x.v), 1));
  const x = i => L + i*colW + colW/2, y = v => top + vH*(1 - v/maxV);
  const pts = [[L, y(D.start.value||0)], ...ss.map((q,i)=>[x(i), y(q.v)])];
  const line = pts.map((p,i)=>`${i?"L":"M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  // club bands, merged across consecutive seasons
  const bands = []; ss.forEach((q,i)=>{ const key = q.club + (q.loan?"|loan":""); const b = bands[bands.length-1];
    if (b && b.key===key) b.to = i; else bands.push({key, club:q.club, loan:q.loan, from:i, to:i}); });
  const col = c => (D.colors && D.colors[c]) || [meta(c).c1, meta(c).c2];
  const bandSvg = bands.map(b=>{ const [c1,c2] = col(b.club), x0 = L + b.from*colW + 2, w = (b.to-b.from+1)*colW - 4;
    const short = b.club.length*6.2 > w-10 ? b.club.split(/\s+/).map(p=>p[0]).join("").slice(0,4) : b.club;
    return `<rect x="${x0}" y="${bandY}" width="${w}" height="${bandH}" rx="4" fill="${c1}" stroke="${c2}" stroke-width="2" ${b.loan?'stroke-dasharray="4 3"':""}/>
      <text x="${x0+w/2}" y="${bandY+16}" text-anchor="middle" font-size="11" font-weight="700" fill="${isLight(c1)?"#111":"#fff"}" font-family="Barlow Condensed, sans-serif">${esc(short)}${b.loan?" (loan)":""}</text>`; }).join("");
  // events at the end of the season they happened in
  const idxOf = label => ss.findIndex(q=>q.s===label);
  const ev = {}; const add = (i, e) => { if (i<0) return; (ev[i] ||= []).push(e); };
  D.log.forEach(m=>{ const i = idxOf(m.s); if (i<0) return;
    if (/→/.test(m.t)) add(i, {t:"move", fee:m.f, label:m.t});
    else if (/^Loaned/.test(m.t)) add(i, {t:"loan", label:m.t});
    else if (/contract/i.test(m.t) && !/clause/i.test(m.t)) add(i, {t:"deal", label:m.t});
    else if (/Retired/.test(m.t)) add(i, {t:"end", label:m.t}); });
  ss.forEach((q,i)=>{ if (q.tr) add(i, {t:"trophy", n:q.tr}); if (q.inj && q.inj.length) add(i, {t:"inj", label:q.inj.join(", ")}); if (q.bd===1) add(i, {t:"bdor"}); });
  const icon = (e, cx, cy) => {
    if (e.t==="move") return `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--accent)"/><path d="M${cx-5} ${cy-2}h9l-3-3M${cx+5} ${cy+2}h-9l3 3" stroke="var(--accent-ink)" stroke-width="1.6" fill="none"/>`;
    if (e.t==="loan") return `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/><text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="10" font-weight="800" fill="var(--ink)">L</text>`;
    if (e.t==="deal") return `<rect x="${cx-8}" y="${cy-9}" width="16" height="18" rx="2" fill="var(--surface)" stroke="var(--euro)" stroke-width="1.8"/><path d="M${cx-4} ${cy-3}h8M${cx-4} ${cy+1}h8M${cx-4} ${cy+5}h5" stroke="var(--euro)" stroke-width="1.3"/>`;
    if (e.t==="trophy") return `<path d="M${cx-6} ${cy-8}h12c0 7-2 10-6 11-4-1-6-4-6-11z" fill="var(--gold)"/><rect x="${cx-4}" y="${cy+5}" width="8" height="3" fill="var(--gold)"/>${e.n>1?`<text x="${cx+9}" y="${cy-4}" font-size="10" font-weight="800" fill="var(--ink)">${e.n}</text>`:""}`;
    if (e.t==="inj") return `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--down)"/><path d="M${cx} ${cy-5}v10M${cx-5} ${cy}h10" stroke="#fff" stroke-width="2.4"/>`;
    if (e.t==="bdor") return `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--gold)"/><circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="#7a5a05" stroke-width="1.4"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="6" fill="var(--muted)"/>`;
  };
  // as tall as the events need: a row for every two in a season, and room for a fee under a move
  const rows = Math.max(0, ...Object.values(ev).map(l=>Math.ceil(l.length/2))), fees = Object.values(ev).some(l=>l.some(e=>e.t==="move" && e.fee));
  const H = rows ? evY + (rows-1)*24 + (fees ? 30 : 14) : bandY + bandH + 8;
  const evSvg = Object.entries(ev).map(([i,list])=>{ const cx = +i===ss.length-1 ? x(+i) : L + (+i+1)*colW;
    return list.map((e,k)=>`<g><title>${esc(e.label || (e.t==="trophy"?`${e.n} trophies in ${ss[i].s}`:e.t==="bdor"?"Ballon d'Or winner":""))}</title>${icon(e, cx + (k%2? 11:-11)*(list.length>1?1:0), evY + Math.floor(k/2)*24)}${e.t==="move"&&e.fee?`<text x="${cx}" y="${evY+Math.floor(k/2)*24+24}" text-anchor="middle" font-size="10" fill="var(--muted)">${money(e.fee)}</text>`:""}</g>`).join(""); }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:${W}px;max-width:${Math.round(W*1.3)}px;height:auto" role="img" aria-label="Career timeline for ${esc(r.name)}">
    ${[0,.5,1].map(f=>`<line x1="${L}" x2="${W-L}" y1="${y(maxV*f)}" y2="${y(maxV*f)}" stroke="var(--line)"/><text x="${L+2}" y="${y(maxV*f)-3}" font-size="10" fill="var(--muted)">${money(maxV*f)}</text>`).join("")}
    <path d="${line} L${x(ss.length-1)} ${top+vH} L${L} ${top+vH} Z" fill="var(--accent)" fill-opacity=".16"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${ss.map((q,i)=>`<circle cx="${x(i)}" cy="${y(q.v)}" r="3" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`).join("")}
    ${ss.map((q,i)=>`<text x="${x(i)}" y="${bandY-14}" text-anchor="middle" font-size="10" fill="var(--muted)">${q.s.slice(2)}</text><text x="${x(i)}" y="${bandY-3}" text-anchor="middle" font-size="9" fill="var(--muted)">age ${q.age}</text>`).join("")}
    ${bandSvg}
    ${evSvg}
  </svg>`;
}
function profilePanel(id){
  const r = profileFind(id);
  const back = `<button class="btn small" data-act="profile-close">‹ Back to Legacy</button>`;
  if (!r) return `<section class="panel">${back}<p class="empty" style="margin-top:12px">That career couldn't be found.</p></section>`;
  const D = r.detail;
  const lastClub = D && D.seasons.length ? D.seasons[D.seasons.length-1].club : r.club;
  const [c1,c2] = D && D.colors && D.colors[lastClub] ? D.colors[lastClub] : [meta(lastClub).c1, meta(lastClub).c2];
  const look = D ? D.look : {skin:1, hair:"short", hairColour:"Black", number:"9"};
  const tile = (l,v) => `<div class="total"><div class="label">${l}</div><div class="v">${v}</div></div>`;
  const groups = {}; (D?D.troph:[]).forEach(t=>{ (groups[t.n] ||= {kind:t.k, items:[]}).items.push(t); });
  const order = {ballon:-2, intl:-1, europe:0, league:1, cup:2, playoff:3, boot:4, medal:5};
  return `<section class="panel">
    <div class="row" style="justify-content:space-between">${back}<span class="pill ${r.status==="Retired"?"":"gold"}">${r.status}</span></div>
    <div class="prof-head">
      <div class="prof-pic">${portrait(look, {n:lastClub, c1, c2}, look.number||"")}</div>
      <div><p class="pname" style="margin:0">${esc(r.name)}</p>
        <div class="label" style="margin-top:6px">${esc(POS[r.pos]?POS[r.pos].label:r.pos)} · ${esc(r.nation||"—")} · ${r.seasons} season${r.seasons===1?"":"s"}${r.ages?` · ages ${esc(r.ages)}`:""}</div>
        <p class="hint" style="margin-top:6px">${esc((r.clubList||[r.club]).join(" → "))}</p></div>
    </div>
    <div class="totals" style="margin-top:14px">
      ${tile("Apps", r.apps)}${tile("Goals", r.goals)}${tile("Assists", r.assists)}${DEF.includes(r.pos)?tile("Clean sheets", r.cs??0):tile("G+A", r.ga)}
      ${tile("Avg rating", r.avgR ? r.avgR.toFixed(2) : "–")}${tile("Player of the Match", r.potm||0)}
      ${tile("Club trophies", r.trophies)}${tile("Ballon d'Or", r.bdor?r.bdor+" won":r.bestBdor?"Best "+ord(r.bestBdor):"—")}${tile("Peak value", money(r.peak))}${tile("Earnings", gbp(r.earnings))}
    </div>
  </section>
  ${D?`<section class="panel"><h2>Career timeline</h2>
    <div class="tablewrap tl">${timelineSVG(r)}</div>
    <div class="legend" style="margin-top:8px"><span><i style="background:var(--accent)"></i>Market value / transfer</span><span><i style="background:var(--surface);border:2px solid var(--accent)"></i>Loan</span><span><i style="background:var(--euro)"></i>New contract</span><span><i style="background:var(--gold)"></i>Trophy</span><span><i style="background:var(--down)"></i>Serious injury</span></div>
  </section>
  <section class="panel"><h2>Trophy cabinet</h2>
    ${Object.keys(groups).length?`<div class="cabinet">${Object.entries(groups).sort((a,b)=>order[a[1].kind]-order[b[1].kind]).map(([name,g])=>`<div class="tro themed" style="${themeVars(trophyTheme(g.kind, name))}">${trophyIcon(g.kind, name)}<div class="tn">${esc(name)}</div>${g.items.length>1?`<div class="tc">×${g.items.length}</div>`:""}<div class="ts">${g.items.map(i=>`${i.s} · ${esc(i.c)}`).join("<br>")}</div></div>`).join("")}</div>`:`<p class="empty">No trophies won.</p>`}
  </section>
  <section class="panel"><h2>Season by season</h2>
    <div class="tablewrap"><table style="min-width:600px"><thead><tr><th>Season</th><th class="n">Age</th><th>Club</th><th>Finish</th><th class="n">Apps</th><th class="n">Mins</th><th class="n">Goals</th><th class="n">Assists</th>${DEF.includes(r.pos)?`<th class="n">CS</th>`:""}<th class="n">Rating</th><th class="n">Value</th></tr></thead><tbody>
      ${D.seasons.slice().reverse().map(q=>`<tr><td>${q.s}</td><td class="n">${q.age}</td><td>${esc(q.club)}${q.loan?" (loan)":""}</td><td>${q.pos?ord(q.pos)+" "+esc(q.lg):esc(q.lg)}</td><td class="n">${q.apps}</td><td class="n">${q.m!=null?q.m+"%":"–"}</td><td class="n">${q.g}</td><td class="n">${q.a}</td>${DEF.includes(r.pos)?`<td class="n">${q.cs}</td>`:""}<td class="n">${q.r!=null?q.r.toFixed(2):"–"}${q.pm?` <span class="hint">★${q.pm}</span>`:""}</td><td class="n">${money(q.v)}</td></tr>`).join("")}
    </tbody></table></div>
  </section>
  <section class="panel"><h2>Transfers & contracts</h2>
    <ol class="tl-list">${D.log.map(m=>`<li><span class="label">${esc(m.s)}</span><span>${esc(m.t)}</span>${m.f?`<strong>${money(m.f)}</strong>`:""}</li>`).join("")}</ol>
  </section>`:`<section class="panel"><p class="hint">This career was saved before profiles existed, so only its totals were kept. Play another season with it, or start a new career, to get the full timeline.</p></section>`}`;
}
function boardPanel(){
  if (profileId) return profilePanel(profileId);
  if (S && S.history && S.history.length) recordCareer();
  const hall = loadHall().filter(e=>!S || e.id!==S.id), [k,label,fmt] = BOARD.find(b=>b[0]===boardKey) || BOARD[0];
  if (S && S.history && S.history.length) hall.push(careerSummary());
  const pool = k==="cs" ? hall.filter(r=>DEF.includes(r.pos)) : hall;
  const rows = pool.slice().sort((a,b)=>(b[k]||0)-(a[k]||0) || b.apps-a.apps).slice(0,10);
  const col = (key, v) => `<td class="n ${key===k?"sorted":""}">${v}</td>`;
  return subTabs("legacy", [["hall", "Hall of fame", `<section class="panel">
    <h2>Legacy</h2>
    <p class="hint">Every career on this account (${hall.length} so far), ranked by the stat you pick. Tap a player for their profile.</p>
    <div class="field board-pick"><label for="boardSel">Rank by</label><select id="boardSel">${BOARD_GROUPS.map(([g, keys])=>`<optgroup label="${g}">${keys.map(key=>{ const b = BOARD.find(x=>x[0]===key); return `<option value="${key}" ${key===k?"selected":""}>${b[1]}</option>`; }).join("")}</optgroup>`).join("")}</select></div>
    ${rows.length ? `<ol class="lb">${rows.map((r,i)=>`<li class="${S&&r.id===S.id?"me":""}" data-act="profile" data-k="${esc(r.id)}" tabindex="0" role="button" aria-label="Open ${esc(r.name)}'s profile">
        <span class="lb-pos">${i+1}</span>
        <span class="lb-who"><strong>${esc(r.name)}</strong><small>${esc(r.pos)} · ${esc(r.nation||"—")} · ${r.seasons} season${r.seasons===1?"":"s"} · ${r.status==="Retired"?"Retired":"Now at "+esc(r.club)}</small></span>
        <span class="lb-val">${fmt(r[k]||0)}<small>${esc(label)}</small></span>
        <span class="lb-sub"><span>${r.apps} apps</span><span>${r.goals} goals</span><span>${r.assists} assists</span>${DEF.includes(r.pos)?`<span>${r.cs??0} clean sheets</span>`:""}${r.avgR?`<span>${r.avgR.toFixed(2)} avg</span>`:""}<span>${r.trophies} trophies</span>${r.bdor?`<span>${r.bdor} Ballon d'Or</span>`:""}<span class="lb-go">Profile ›</span></span>
      </li>`).join("")}</ol>` : `<p class="empty">${k==="cs"?"Clean sheets only count for goalkeepers and defenders. Play a career as one and it'll appear here.":"No careers yet. Finish a season and it'll appear here."}</p>`}
  </section>`], rows.length>1 && ["h2h", "Head to head", `<section class="panel">
    <h2>Head to head</h2>
    <p class="hint">The same top ${rows.length}, side by side.</p>
    <div class="tablewrap"><table class="h2h"><thead><tr><th>#</th><th>Player</th><th>Seasons</th><th class="n">Apps</th><th class="n">Goals</th><th class="n">Assists</th><th class="n">CS</th><th class="n">Club trophies</th><th class="n">Leagues</th><th class="n">Europe</th><th class="n">Ballon d'Or</th><th class="n">Peak value</th><th class="n">Earnings</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr class="${S&&r.id===S.id?"me":""}"><td>${i+1}</td><td><strong>${esc(r.name)}</strong> <span class="hint">${esc(r.pos)}</span><br><span class="hint">${esc((r.clubList||[r.club]).join(" · "))}</span></td><td>${r.seasons}${r.ages?` <span class="hint">(${r.ages})</span>`:""}</td>${col("apps",r.apps)}${col("goals",r.goals)}${col("assists",r.assists)}${col("cs",DEF.includes(r.pos)?(r.cs??0):"—")}${col("trophies",r.trophies)}${col("leagues",r.leagues??"—")}${col("europe",r.europe??"—")}${col("bdor",r.bdor?`${r.bdor} won`:r.bestBdor?ord(r.bestBdor):"—")}${col("peak",money(r.peak))}${col("earnings",gbp(r.earnings))}</tr>`).join("")}
    </tbody></table></div>
  </section>`], ["saves", "Saves", backupPanel()], ["bdor", "Ballon d'Or", `<section class="panel">
    <h2>Ballon d'Or: what it takes</h2>
    <p class="hint">The voting is modelled on real top-30 lists. Your goals and assists (or games and clean sheets for defenders) earn points, trophies earn more: the Champions League most, then a big-five league title, then the Europa League and domestic cups. Leagues outside the big five count for less. Around 20 goals and assists with nothing won won't get you nominated. To win it you also need the trophies and numbers of the last ten winners below.</p>
    <div class="tablewrap"><table style="min-width:520px"><thead><tr><th>Year</th><th>Winner</th><th>Club</th><th>That season</th></tr></thead><tbody>
      ${BDOR_HISTORY.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td style="white-space:normal">${esc(r[3])}</td></tr>`).join("")}
    </tbody></table></div>
    <ul class="hint" style="margin:10px 0 0;padding-left:18px">
      <li>Forwards: 30+ goals or 45+ goals and assists, at least 40 games.</li>
      <li>Midfielders: 45+ games and 12+ goals and assists. Defenders and keepers: 48+ games.</li>
      <li>Trophies: the Champions League (midfielders and defenders need another trophy with it), or a league title plus another trophy. A forward who wins the league with 40+ goals also qualifies.</li>
    </ul>
  </section>`]]);
}
let S = null, draft = null, flash = "", tab = "season", migratedNote = "", reviewIdx = null, leagueView = null, cardOpen = false;
const negoOpen = new Set();   // offer cards whose negotiation is open, kept open between rounds of talks
function load(){ try{ const raw = localStorage.getItem(KEY); if (raw) S = JSON.parse(raw);}catch(e){} }
function save(){
  if (!S) return;
  // keep the inbox to the latest 250 messages so saves stay small
  if (S.notes && S.notes.length>250){ const cut = S.notes.length-250; S.notes = S.notes.slice(cut); S.notesSeen = Math.max(0, (S.notesSeen||0)-cut); }
  S.updated = Date.now();
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ Account.saveFailed(); }
}

/* ================= BACKUP FILE =================
   Saves live on this device under the signed-in account (account.js). A backup file carries the current career
   and every Legacy career to another phone, and also loads backups downloaded from the Claude version of the game. */
async function exportBackup(){
  if (S && APP==="player") save();
  if (APP==="manager" && typeof Mgr!=="undefined") Mgr.saveNow();
  const slots = Hub.all();
  // "career" is slot 1's player career, as backups always had; "slots" has every player and manager save
  const data = {game:"English Footballing Pyramid", saved:new Date().toISOString(), career:slots["player-1"]||null, slots, legacy:loadHall(),
    mhall:(typeof Mgr!=="undefined" ? Mgr.hall() : []), coins:Account.coins(), locker:Account.locker(), ach:(typeof Records!=="undefined" ? Records.got() : {})};
  const json = JSON.stringify(data), filename = `pyramid-backup-${Account.fileTag()}-${new Date().toISOString().slice(0,10)}.json`;
  // on phones, hand the file to the share sheet (Save to Files, AirDrop, email…) where the browser allows it
  try{
    const file = new File([json], filename, {type:"application/json"});
    if (matchMedia("(pointer:coarse)").matches && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:"English Footballing Pyramid backup"}); flash = "Backup saved."; render(); return;
    }
  }catch(e){ if (e && e.name==="AbortError") return; }
  try{ const url = URL.createObjectURL(new Blob([json], {type:"application/json"})); const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000); flash = "Backup downloaded."; }
  catch(e){ flash = "The download didn't go through. Try again in a moment."; }
  render();
}
function importBackup(file){
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if (!d || (d.game!=="English Footballing Pyramid")) throw 0;
      const map = new Map(loadHall().map(e=>[e.id,e]));
      (d.legacy||[]).forEach(e=>{ const l = map.get(e.id); if (!l || (e.updated||0) > (l.updated||0)) map.set(e.id, e); });
      saveHall([...map.values()]);
      if (d.coins) Account.mergeCoins(d.coins);
      Account.mergeLocker(d.locker);   // the bigger balance wins, so a backup can't be loaded twice for double coins
      if (typeof Mgr!=="undefined" && d.mhall) Mgr.mergeHall(d.mhall);
      if (typeof Records!=="undefined" && d.ach) Records.merge(d.ach);
      // older backups have one career; newer ones have every slot of both modes
      const all = d.slots || (d.career ? {"player-1":d.career} : {});
      const got = Hub.restore(all, confirmImport);
      if (APP==="player" && Hub.playerSlot()){ S = null; load(); normalize(); }
      confirmImport = false;
      flash = `Backup loaded: ${(d.legacy||[]).length} Legacy career${(d.legacy||[]).length===1?"":"s"}${got.n?`, ${got.n} save${got.n===1?"":"s"}`:""}${got.skipped?` (${got.skipped} skipped: no free slot; tick “replace” to overwrite)`:""}.`;
      showBoard = false; profileId = null; render();
    }catch(e){ flash = "That file isn't a backup from this game."; render(); }
  };
  r.readAsText(file);
}
let confirmImport = false;
function backupPanel(){
  return `<section class="panel"><h2>Your saves</h2>
    <p class="hint">${esc(Account.statusText())}</p>
    <p class="hint" style="margin-top:8px">Your current career and every career in Legacy save on this phone automatically, under your account. To move them to another phone, or keep them safe, download a backup and load it there. Backups from the Claude version of the game load here too.</p>
    <div class="row" style="margin-top:10px">
      <button class="btn small" data-act="backup-export">Download backup</button>
      <label class="btn small" for="backupFile" style="display:inline-flex;align-items:center">Load backup</label>
      <input id="backupFile" type="file" accept="application/json,.json" hidden>
    </div>
    <p class="hint" style="margin-top:6px">Loading a backup adds its Legacy careers, and its player and manager saves go into free slots. To overwrite the saves in the same slots instead, tick this first: <label><input type="checkbox" id="confirmImport" ${confirmImport?"checked":""} style="width:auto"> replace my saves</label></p>
  </section>`;
}

function meta(n){ return META[n] || (S&&S.customClubs||[]).find(c=>c.n===n) || (typeof NAT_KIT!=="undefined" && NAT_KIT[n] ? {n, c1:NAT_KIT[n][0], c2:NAT_KIT[n][1], r:.8} : null) || {n, c1:"#555555", c2:"#FFFFFF", r:.7}; }
function tierOf(n){ for (const t of ALLKEYS) if (S.world.tiers[t] && S.world.tiers[t].includes(n)) return t; return 6; }
function strOf(n){ return S.world.str[n] ?? 36; }
function baseStr(t, r){ const T = TIERS[t]; return T.lo + (r-.6)/.4*(T.hi-T.lo); }

function buildWorld(custom){
  const w = {tiers:{}, str:{}, base:{}, europe:{...EURO_2026}};
  for (const t of ALLKEYS) w.tiers[t] = TIER_LISTS[t].slice();
  if (custom){ const list = w.tiers[custom.t]; const out = list.splice(Math.floor(Math.random()*list.length),1)[0]; delete w.europe[out]; w.tiers[6].push(out); list.push(custom.n); }
  for (const t of ALLKEYS) w.tiers[t].forEach(n=>{ w.base[n] = baseStr(t, meta(n).r); w.str[n] = +(w.base[n] + gauss()*.8).toFixed(2); });
  return w;
}
// older saves only had the English pyramid: add Europe's other top leagues
function upgradeWorld(w){
  if (w.pool){ w.tiers[6] = w.pool; delete w.pool; }
  w.base ||= {};
  for (const t of ALLKEYS){
    if (w.tiers[t]) continue;
    w.tiers[t] = TIER_LISTS[t].slice();
    w.tiers[t].forEach(n=>{ w.base[n] = baseStr(t, meta(n).r); w.str[n] = +(w.base[n] + gauss()*.8).toFixed(2); if (EURO_2026[n]) w.europe[n] = EURO_2026[n]; });
  }
  return w;
}

/* ================= VALUATION / WAGES ================= */
function perf(comps, teamPct, pos, avail=1, age=25){
  const p = POS[pos]; let wA=0, wGA=0, wCS=0, apps=0;
  for (const k in comps){ const c = comps[k], w = COMP_W[c.code||k] ?? .7; wA += w*c.apps; wGA += w*(c.g+c.a); wCS += w*(c.cs||0); apps += c.apps; }
  if (!apps) return {score:.15, time:.1};
  const ex = expectShare(age), youth = age<=19 ? .7 : age<=21 ? .82 : age<=23 ? .92 : 1;
  // a match centre season's goals and assists follow the team's (mcXg), so they're judged against a little less than
  // the numbers people type in from a real career
  const centre = Object.values(comps).some(c=>c.of) ? .8 : 1;
  const gaR = p.exp ? Math.min((wGA/wA)/(p.exp*youth*centre), 1.4) : 0;
  const csR = Math.min((wCS/wA)/.35, 1.4);
  // all-round contribution: how much you played, and how well your team did (league finish, 0 = bottom, 1 = top)
  const target = 40*Math.max(avail,.2)*ex;
  const share = clamp(wA/target, 0, 1), tp = teamPct ?? .5;
  const rS = clamp(.55*share + .45*tp, 0, 1);
  let score = clamp(p.w*gaR + p.cs*csR + (1-p.w-p.cs)*rS, .1, 1.3);
  // your match ratings (a season in the match centre) count for 40% of it once you've ten of them: 6.0 is nothing,
  // 7.5 a full mark, 8.1 the most
  let rs = 0, rn = 0; for (const k in comps){ rs += comps[k].rs || 0; rn += comps[k].rn || 0; }
  if (rn){ const rq = clamp((rs/rn - 6)/1.5, 0, 1.4), wr = .4*Math.min(1, rn/10); score = clamp(score*(1-wr) + rq*wr, .1, 1.3); }
  const time = Math.pow(clamp(wA/target,.1,1), .7);
  return {score,time};
}
function teamFactor(sim){
  if (!sim) return 1;
  let f = .95 + .1*(1-(sim.pos-1)/(sim.n-1));
  if (sim.comps.some(c=>c.won)) f += .03;
  if (sim.moved==="up") f += .05; if (sim.moved==="down") f -= .1;
  return f;
}
function valuation({age,pos,clubName,tier,years,pf,team=1}){
  const T = TIERS[tier];
  const f = {base:T.ceil, age:ageF(age), pos:POS[pos].pf, contract:contractF(years), club:.75+.25*repOf(clubName, tier), team, perf:Math.pow(pf.score,1.8)*pf.time};
  return {value:f.base*f.age*f.pos*f.contract*f.club*f.team*f.perf, f};
}
// weekly wage: based on how good you are (value with the age effect taken out), the league, how big the club is, and age
// (teenagers earn academy-level money; veterans keep wages that reflect their quality, not their falling value)
const YOUTH_PAY = {16:.05,17:.12,18:.3,19:.45,20:.6,21:.75,22:.88};
function wageFor(value, clubName, tier, age){
  age = age ?? (S && S.age) ?? 24;
  const T = TIERS[tier] || TIERS[5], r = (S && S.world && !S.newing) ? repOf(clubName, tier) : meta(clubName).r;
  const quality = Math.max(value,25e3) / Math.max(ageF(age), .3);
  const clubF = clamp(Math.pow(r/.8, 2.2), .35, 1.8), yf = YOUTH_PAY[age] ?? 1;
  return roundWage(Math.max(T.floor*yf, .835*Math.pow(quality,.674)*T.wage*clubF*yf));
}

/* ================= PORTRAIT / ICONS ================= */
function isLight(hex){const h=hex.replace("#","");const r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return (r*299+g*587+b*114)/1000>170}
let pid = 0;
function hashStr(s){ let h = 2166136261; for (const ch of String(s)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h>>>0; }
function seeded(seed){ let a = seed||1; return () => { a = (a + 0x6D2B79F5)>>>0; let t = a; t = Math.imul(t ^ t>>>15, t | 1); t ^= t + Math.imul(t ^ t>>>7, t | 61); return ((t ^ t>>>14)>>>0)/4294967296; }; }
function portrait(pl, club, num){
  if (pl.photo) return `<img src="${pl.photo}" alt="Photo of ${esc(pl.name)}">`;
  const id = "p"+(++pid), skin = SKIN[pl.skin ?? 1] || SKIN[1], hc = HAIRC[pl.hairColour||"Black"] || HAIRC.Black;
  const c1 = club.c1 || "#1D6537", c2 = club.c2 || "#FFFFFF", lightKit = isLight(c1);
  const sur = (String(pl.name||"").trim().split(/\s+/).pop() || "Player").toUpperCase().slice(0,14);
  const rnd2 = seeded(hashStr((pl.name||"")+"|"+club.n));
  // floodlit bokeh, scattered differently for every player
  const bokeh = Array.from({length:11}, (_,i)=>{ const x = rnd2()*200, y = 6+rnd2()*112, r = 2.5+rnd2()*8, col = [ "#FFD98A", c1, "#FFFFFF", "#9FE8DA" ][i%4];
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" opacity="${(.12+rnd2()*.28).toFixed(2)}"/>`; }).join("");
  // mown stripes in perspective
  const stripes = Array.from({length:14}, (_,k)=>{ const i = k-7; return k%2 ? "" : `<path d="M${100+i*13} 140 L${100+(i+1)*13} 140 L${100+(i+1)*70} 190 L${100+i*70} 190Z" fill="#fff" opacity=".045"/>`; }).join("");
  const lights = cx => `<g><circle cx="${cx}" cy="16" r="46" fill="url(#${id}fl)"/><rect x="${cx-12}" y="10" width="24" height="11" rx="2" fill="#0b0f10" stroke="#3a4146" stroke-width=".6"/>
    ${[0,1,2].flatMap(c=>[0,1].map(r=>`<circle cx="${cx-7.5+c*7.5}" cy="${13.2+r*4.6}" r="1.9" fill="#FFF8DF"/>`)).join("")}</g>`;
  // the back of a real head: a round crown, full at the ears, flowing into a strong neck
  const HEAD = "M100 42.5 C116.5 42.5 126.5 53 126.5 68 C126.5 78.5 124.8 86 121.5 91.5 C118 97 110.5 100.5 100 100.5 C89.5 100.5 82 97 78.5 91.5 C75.2 86 73.5 78.5 73.5 68 C73.5 53 83.5 42.5 100 42.5Z";
  const head = `<path d="${HEAD}"`, hr = seeded(hashStr((pl.name||"")+"|hair")), f1 = v => v.toFixed(1);
  const inHead = (x, y) => ((x-100)/26.5)**2 + ((y-69)/29.5)**2 < .97;
  // where the hair stops: up and round behind the ears, then across the nape in little tufts
  const nape = x => 88.5 + 3.5*(1 - ((x-100)/22)**2);
  const hairline = (drop = 0, tuft = 1.5) => { let d = `M68 38 L72.6 ${70+drop} C74 ${77+drop} 76 ${83+drop} 78.6 ${86.5+drop}`;
    for (let x = 80, k = 0; x <= 120; x += 2.5, k++) d += ` L${f1(x)} ${f1(nape(x) + drop + (k%2 ? tuft : 0) + (hr()-.5)*.8)}`;
    return d + ` L121.4 ${86.5+drop} C124 ${83+drop} 126 ${77+drop} 127.4 ${70+drop} L132 38Z`; };
  // short strokes of hair growing out of the crown in a slight swirl, the way real hair lies
  const crown = [103.5, 56];
  const growth = (n, len, keep = () => true) => { let dk = "", lt = ""; for (let i = 0, t = 0; i < n && t < n*6; t++){
      const x = 74 + hr()*52, y = 43 + hr()*50; if (!inHead(x, y) || !keep(x, y)) continue;
      const vx = x - crown[0], vy = y - crown[1], r = Math.hypot(vx, vy); if (r < 2.2) continue;
      const an = Math.atan2(vy, vx) + .55 - Math.min(.35, r/90), L = len*(.6 + hr()*.8), seg = `M${f1(x)} ${f1(y)}l${f1(Math.cos(an)*L)} ${f1(Math.sin(an)*L)}`;
      if ((x < 100 && y < 70 && hr() < .55) || hr() < .22) lt += seg; else dk += seg; i++; }
    return `<path d="${dk}" stroke="#000" stroke-opacity=".26" stroke-width=".75" stroke-linecap="round" fill="none"/><path d="${lt}" stroke="#fff" stroke-opacity=".13" stroke-width=".6" stroke-linecap="round" fill="none"/>`; };
  const whorl = `<path d="M${crown[0]} ${crown[1]} m-1.6 0 a1.6 1.6 0 1 1 1.6 1.6 a3.2 3.2 0 1 1 3.2 -3.4" stroke="#000" stroke-opacity=".28" stroke-width=".7" fill="none"/>`;
  const shortCut = (op, len, n) => `<g clip-path="url(#${id}hd)"><path d="${hairline(3.2, 1.2)}" fill="${hc}" opacity="${op*.28}"/><path d="${hairline()}" fill="${hc}" opacity="${op}"/>
      ${growth(n, len, (x, y) => y < nape(x) - .6 && !(y > 70 && (x < 76.5 || x > 123.5)))}${whorl}</g>`;
  // tight coils: a fuller outline, bumpy at the edge, tapered short at the nape
  const coilEdge = Array.from({length:17}, (_,k)=>{ const an = Math.PI*(1.02 + k/16*.96), rr = 27 + hr()*1.6; return `<circle cx="${f1(100 + Math.cos(an)*rr*1.02)}" cy="${f1(68 + Math.sin(an)*rr*1.06)}" r="${f1(4.4 + hr()*1.2)}"/>`; }).join("");
  const coils = (() => { let dk = "", lt = ""; for (let i = 0, t = 0; i < 120 && t < 900; t++){ const x = 72 + hr()*56, y = 39 + hr()*50;
      if (((x-100)/29)**2 + ((y-68)/31)**2 > 1 || y > nape(x) - 1) continue; const an = hr()*6.28, r = 1.5 + hr()*.9;
      const seg = `M${f1(x + Math.cos(an)*r)} ${f1(y + Math.sin(an)*r)}A${f1(r)} ${f1(r)} 0 1 1 ${f1(x + Math.cos(an+2.2)*r)} ${f1(y + Math.sin(an+2.2)*r)}`;
      if (y < 62 && hr() < .5) lt += seg; else dk += seg; i++; }
    return `<path d="${dk}" stroke="#000" stroke-opacity=".38" stroke-width=".8" fill="none"/><path d="${lt}" stroke="#fff" stroke-opacity=".14" stroke-width=".7" fill="none"/>`; })();
  // long hair down past the collar: clumps with tapered ends, a band of sheen where the light catches the crown
  const LONGHAIR = (() => { let d = "M100 40.5 C117.5 40.5 128 51.5 128 67.5 C128.5 84 127 102 124.5 116"; const tips = 5;
    for (let k = 0; k < tips; k++){ const x0 = 124.5 - k*49/tips, x1 = x0 - 49/tips, xm = (x0 + x1)/2; const yt = 120 + hr()*3; d += ` C${f1(x0 - 1)} ${f1(yt - 1)} ${f1(xm + 2.5)} ${f1(yt + 1.5)} ${f1(xm)} ${f1(yt + 1.2)} C${f1(xm - 2.5)} ${f1(yt + 1)} ${f1(x1 + 1)} ${f1(yt - 1.5)} ${f1(x1)} ${f1(117 + hr()*1.5)}`; }
    return d + " C73 102 71.5 84 72 67.5 C72 51.5 82.5 40.5 100 40.5Z"; })();
  const longStrands = (n, op, col, w) => Array.from({length:n}, ()=>{ const xe = 77 + hr()*46, ye = 112 + hr()*12, xs = 100 + (xe-100)*.18 + (hr()-.5)*6;
    return `<path d="M${f1(xs)} ${f1(43 + hr()*4)} Q${f1(100 + (xe-100)*1.55)} ${f1(64 + hr()*8)} ${f1(xe)} ${f1(ye)}" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}" fill="none"/>`; }).join("");
  const hairs = {
    short: shortCut(1, 3.6, 190),
    buzz:`<g clip-path="url(#${id}hd)"><path d="${hairline(2.4, .8)}" fill="${hc}" opacity=".16"/><path d="${hairline(0, .7)}" fill="${hc}" opacity=".58"/><path d="${hairline(0, .7)}" fill="url(#${id}st2)" opacity=".55"/>
      ${growth(110, 1.3, (x, y) => y < nape(x) - .6)}</g>`,
    curly:`<clipPath id="${id}cu"><path d="${hairline(0, 1.6)}"/></clipPath>
      <g clip-path="url(#${id}cu)"><g fill="${hc}"><path d="M100 39.5 C118.5 39.5 129 51 129 68 C129 80 127 88 124 94 L76 94 C73 88 71 80 71 68 C71 51 81.5 39.5 100 39.5Z"/>${coilEdge}</g>
      <g fill="#000" opacity=".25">${coilEdge}</g><g fill="${hc}">${coilEdge.replace(/r="([\d.]+)"/g, (m, r) => `r="${(r - .9).toFixed(1)}"`)}</g>${coils}</g>
      <g clip-path="url(#${id}hd)"><path d="${hairline(3, 1)}" fill="${hc}" opacity=".3"/></g>`,
    long:`<clipPath id="${id}lh"><path d="${LONGHAIR}"/></clipPath><path d="${LONGHAIR}" fill="${hc}"/>
      <g clip-path="url(#${id}lh)">${longStrands(26, .26, "#000", .8)}${longStrands(16, .12, "#fff", .6)}
      <path d="M75 72 C79 56 90 50 100 50 C110 50 121 56 125 72" stroke="url(#${id}sh2)" stroke-width="6" fill="none"/>
      <rect x="66" y="80" width="68" height="50" fill="url(#${id}lg)"/></g>
      <path d="M96 41.5 C93 60 92 80 90 104 M104.5 41.5 C107 62 108 84 110 106" stroke="#000" stroke-opacity=".12" stroke-width="1.4" fill="none"/>`,
    none:`<g clip-path="url(#${id}hd)"><path d="${hairline(0, .4)}" fill="${hc}" opacity=".13"/></g>
      <path d="M87 94.5 Q100 98.6 113 94.5 M89.5 97.6 Q100 100.4 110.5 97.6" stroke="#000" stroke-opacity=".14" stroke-width=".9" fill="none"/>`
  };
  const nameSize = sur.length>10 ? 9.5 : sur.length>7 ? 11 : 12.5;
  return `<svg viewBox="0 0 200 190" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(pl.name||"Your player")}, seen from behind in the ${esc(club.n)} kit under the floodlights">
  <defs>
    <radialGradient id="${id}bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${c1}" stop-opacity=".55"/><stop offset=".55" stop-color="${c1}" stop-opacity=".16"/><stop offset="1" stop-color="#05090A" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}fl"><stop offset="0" stop-color="#FFF4D0" stop-opacity=".85"/><stop offset=".25" stop-color="#FFE29A" stop-opacity=".35"/><stop offset="1" stop-color="#FFE29A" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}pt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E6B3C"/><stop offset="1" stop-color="#0A2616"/></linearGradient>
    <linearGradient id="${id}st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
    <linearGradient id="${id}sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
    <linearGradient id="${id}sv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${lightKit?0:.1}"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    <radialGradient id="${id}hs" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>
    <linearGradient id="${id}nk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".5" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
    <clipPath id="${id}hd"><path d="M100 42 C117 42 127 52.7 127 68 C127 78.7 125.2 86.3 121.9 91.8 C118.3 97.4 110.7 101 100 101 C89.3 101 81.7 97.4 78.1 91.8 C74.8 86.3 73 78.7 73 68 C73 52.7 83 42 100 42Z"/></clipPath>
    <linearGradient id="${id}sh2" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset=".75" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
    <pattern id="${id}st2" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".55" fill="#000" opacity=".5"/></pattern>
    <linearGradient id="${id}cy" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".22" stop-color="#000" stop-opacity=".05"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset=".78" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <linearGradient id="${id}nk2" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset=".35" stop-color="#000" stop-opacity=".06"/><stop offset=".65" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
    <pattern id="${id}cr" width="5" height="4.5" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".8" fill="#fff" opacity=".22"/><circle cx="4" cy="3.6" r=".6" fill="${c1}" opacity=".5"/></pattern>
  </defs>
  <rect width="200" height="190" fill="#05090A"/>
  <rect width="200" height="190" fill="url(#${id}bg)"/>
  <path d="M0 96 L200 96 L200 142 L0 142Z" fill="url(#${id}cr)" opacity=".9"/>
  <path d="M0 96 L200 96 L200 142 L0 142Z" fill="url(#${id}st)"/>
  <path d="M0 140 H200 V190 H0Z" fill="url(#${id}pt)"/>${stripes}
  <path d="M0 140 H200" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>
  <path d="M44 24 L4 140 L84 140Z M156 24 L196 140 L116 140Z" fill="#FFF1C2" opacity=".045"/>
  ${bokeh}${lights(52)}${lights(148)}
  <ellipse cx="100" cy="190" rx="92" ry="10" fill="#000" opacity=".35"/>
  <g class="pt-fig">
  <path d="M17 162 C16 170 15 180 14 190 L40 190 L42 170Z" fill="${skin}"/><path d="M183 162 C184 170 185 180 186 190 L160 190 L158 170Z" fill="${skin}"/>
  <path d="M17 162 C16 170 15 180 14 190 L22 190 C22 178 23 170 26 164Z M183 162 C184 170 185 180 186 190 L178 190 C178 178 177 170 174 164Z" fill="#000" opacity=".22"/>
  <path d="M83 92 C83 102 80 108.5 70 114.5 L130 114.5 C120 108.5 117 102 117 92Z" fill="${skin}"/><path d="M83 92 C83 102 80 108.5 70 114.5 L130 114.5 C120 108.5 117 102 117 92Z" fill="url(#${id}nk2)"/>
  <path d="M83 92 C83 102 80 108.5 70 114.5 L130 114.5 C120 108.5 117 102 117 92Z" fill="url(#${id}nk)" opacity=".7"/>
  <path d="M100 103 C99.6 107 99.8 111 100 116" stroke="#000" stroke-opacity=".16" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="M93.5 102 C93 107 91.5 111 88 115 M106.5 102 C107 107 108.5 111 112 115" stroke="#000" stroke-opacity=".08" stroke-width="1.6" fill="none"/>
  <path id="${id}sp" d="M75 112 C58 114 40 116 30 125 C22 133 18 148 16 166 L42 172 L49 150 L51 190 L149 190 L151 150 L158 172 L184 166 C182 148 178 133 170 125 C160 116 142 114 125 112 C115 117.5 107 119.5 100 119.5 C93 119.5 85 117.5 77 112Z" fill="${c1}"/>
  ${lightKit?`<path d="M30 125 C22 133 18 148 16 166 L42 172 L49 150Z M170 125 C178 133 182 148 184 166 L158 172 L151 150Z" fill="${c2}" opacity=".85"/>`:""}
  <path d="M75 112 C58 114 40 116 30 125 C22 133 18 148 16 166 L42 172 L49 150 L51 190 L149 190 L151 150 L158 172 L184 166 C182 148 178 133 170 125 C160 116 142 114 125 112 C115 117.5 107 119.5 100 119.5 C93 119.5 85 117.5 77 112Z" fill="url(#${id}cy)"/>
  <path d="M75 112 C58 114 40 116 30 125 C22 133 18 148 16 166 L42 172 L49 150 L51 190 L149 190 L151 150 L158 172 L184 166 C182 148 178 133 170 125 C160 116 142 114 125 112 C115 117.5 107 119.5 100 119.5 C93 119.5 85 117.5 77 112Z" fill="url(#${id}sv)"/>
  <ellipse cx="74" cy="146" rx="20" ry="15" fill="#fff" opacity=".045"/><ellipse cx="126" cy="146" rx="20" ry="15" fill="#fff" opacity=".045"/>
  <path d="M100 122 V190" stroke="#000" stroke-opacity=".13" stroke-width="2.2"/>
  <path d="M50 150 C64 152 72 160 74 176 M150 150 C136 152 128 160 126 176 M58 128 C66 134 70 140 72 148 M142 128 C134 134 130 140 128 148" stroke="#000" stroke-opacity=".1" stroke-width="1.5" fill="none"/>
  <path d="M60 182 Q80 176 98 184 M104 186 Q122 178 140 182" stroke="#000" stroke-opacity=".07" stroke-width="1.6" fill="none"/>
  <path d="M16.5 165 L42 171.5 M183.5 165 L158 171.5" stroke="${c2}" stroke-width="3.4"/><path d="M17 168.2 L41.6 174.4 M183 168.2 L158.4 174.4" stroke="#000" stroke-opacity=".2" stroke-width="1"/>
  <path id="${id}np" d="M60 139 Q100 129 140 139" fill="none"/>
  <text font-family="Big Shoulders Display, Impact, sans-serif" font-weight="800" font-size="${nameSize}" letter-spacing="1.4" fill="${c2}" text-anchor="middle"><textPath href="#${id}np" startOffset="50%">${esc(sur)}</textPath></text>
  <text x="100" y="172" text-anchor="middle" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="38" fill="${c2}" stroke="#000" stroke-opacity=".25" stroke-width=".8">${esc(num)}</text>
  <path d="M77 112 C87 117.5 94 119.5 100 119.5 C106 119.5 113 117.5 123 112" stroke="${c2}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
  <path d="M78 114.6 C88 120 94 122 100 122 C106 122 112 120 122 114.6" stroke="#000" stroke-opacity=".22" stroke-width="1" fill="none"/>
  <g transform="translate(100 104) scale(.86) translate(-100 -100)">
  ${[1,-1].map(m=>{ const X = x => f1(100 + m*(x-100)); return `<path d="M${X(75.6)} 68 C${X(71.6)} 66.2 ${X(69.4)} 69.6 ${X(69.8)} 74.4 C${X(70.2)} 79.8 ${X(72.4)} 84.6 ${X(76.8)} 86 Z" fill="${skin}"/>
    <path d="M${X(75.6)} 68 C${X(71.6)} 66.2 ${X(69.4)} 69.6 ${X(69.8)} 74.4 C${X(70.2)} 79.8 ${X(72.4)} 84.6 ${X(76.8)} 86 Z" fill="#000" opacity=".12"/>
    <path d="M${X(75.4)} 70 C${X(73.4)} 72.5 ${X(73.3)} 79.5 ${X(76)} 84.5" stroke="#000" stroke-opacity=".32" stroke-width="1.7" fill="none"/>
    <path d="M${X(70.6)} 71.4 C${X(70)} 75.4 ${X(70.9)} 80.4 ${X(73.4)} 83.8" stroke="#FFE9B0" stroke-opacity=".32" stroke-width=".8" fill="none"/>`; }).join("")}
  ${head} fill="${skin}"/>
  ${hairs[pl.hair||"short"] ?? hairs.short}
  ${pl.hair==="long" ? "" : `${head} fill="url(#${id}hs)"/>`}
  <path d="M80 55 C84 48.5 91 44.6 100 44.4" stroke="#FFE9B0" stroke-opacity=".34" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M120 55 C117.5 50.5 113 47 107.5 45.4" stroke="#FFE9B0" stroke-opacity=".18" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M74.2 74 C74.6 81 76.4 87 79.5 91.5 M125.8 74 C125.4 81 123.6 87 120.5 91.5" stroke="#000" stroke-opacity=".14" stroke-width="1.6" fill="none"/>
  <path d="M30 125 C40 116 58 114 75 112 M170 125 C160 116 142 114 125 112" stroke="#FFE9B0" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M17.5 160 C19 146 23 133 30 125 M182.5 160 C181 146 177 133 170 125" stroke="#FFE9B0" stroke-opacity=".25" stroke-width="1.2" fill="none"/>
  </g>
  </g>
  </svg>`;
}
// original trophy designs: each competition gets its own shape, metal, plinth colour and engraving
let tid = 0;
const METALS = {
  gold:  ["#8A6406","#F9DB6D","#FFF3C4","#B8860B"],
  silver:["#6B7280","#E5E7EB","#FFFFFF","#9CA3AF"],
  bronze:["#7A4A1F","#E0A060","#F6D2A8","#A0622D"]
};
function trophyStyle(kind, name){
  const n = name || "";
  const eng = (txt, base) => ({txt, base});
  if (kind==="intl"){
    if (/World Cup/.test(n)) return {shape:"globe", metal:"gold", ...eng("WORLD CHAMPIONS","#14532D")};
    return {shape:"grand", metal:"gold", ...eng(/European/.test(n)?"EUROPE":/Copa/.test(n)?"SOUTH AMERICA":/Africa/.test(n)?"AFRICA":/Asian/.test(n)?"ASIA":"NORTH AMERICA", "#3F1D0B")};
  }
  if (kind==="ballon") return {shape:"ball", metal:"gold", ...eng("BALLON D'OR","#1F1B16")};
  if (kind==="boot") return {shape:"bootpro", metal:"gold", ...eng("TOP SCORER","#14213D")};
  if (kind==="medal"){
    if (/Playmaker/.test(n)) return {shape:"playmaker", metal:"gold", ...eng("PLAYMAKER","#0F3B2E")};
    if (/Young/.test(n)) return {shape:"rising", metal:"silver", ...eng("YOUNG PLAYER","#1E3A5F")};
    return {shape:"laurel", metal:"gold", ...eng("PLAYER OF SEASON","#3B1F4A")};
  }
  if (kind==="europe"){
    if (/Champions/.test(n)) return {shape:"grand", metal:"silver", ...eng("EUROPE · I","#0B1A3A")};
    if (/Europa/.test(n)) return {shape:"bowl", metal:"silver", ...eng("EUROPE · II","#3B1F0B")};
    return {shape:"slim", metal:"silver", ...eng("EUROPE · III","#0F3B2E")};
  }
  if (kind==="playoff") return {shape:"small", metal:"silver", ...eng("PLAY-OFFS","#4B1D3F")};
  if (kind==="league"){
    if (/Premier League/.test(n)) return {shape:"urn", metal:"gold", ...eng("CHAMPIONS","#37003C")};
    if (/Championship/.test(n)) return {shape:"urn", metal:"silver", ...eng("CHAMPIONS","#1C2C5B")};
    if (/League One|League Two/.test(n)) return {shape:"shield", metal:"silver", ...eng("CHAMPIONS","#2B2B2B")};
    if (/National League/.test(n)) return {shape:"shield", metal:"bronze", ...eng("CHAMPIONS","#2B2B2B")};
    return {shape:"urn", metal:"gold", ...eng("CHAMPIONS", ({La:"#7A1020",Bu:"#7F0F1A",Se:"#0B2A5B",Li:"#14213D",Pr:"#0E4D2C",Er:"#B4440D",Sc:"#13294B"})[n.slice(0,2)] || "#2B2B2B")};
  }
  // domestic cups
  if (/FA Cup/.test(n)) return {shape:"twohandle", metal:"silver", ...eng("FA CUP","#5A1E14")};
  if (/League Cup/.test(n)) return {shape:"tall", metal:"silver", ...eng("LEAGUE CUP","#123B2C")};
  if (/Trophy/.test(n)) return {shape:"small", metal:"bronze", ...eng("TROPHY","#2B2B2B")};
  return {shape:"twohandle", metal:"silver", ...eng("CUP","#3A2A10")};
}
function trophyIcon(kind, name){
  const st = trophyStyle(kind, name), M = METALS[st.metal], id = "tr"+(++tid);
  const defs = `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${M[0]}"/><stop offset=".42" stop-color="${M[1]}"/><stop offset=".55" stop-color="${M[2]}"/><stop offset="1" stop-color="${M[3]}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${st.base}"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient></defs>`;
  const F = `url(#${id})`, B = `url(#${id}b)`;
  const plinth = (w=36) => `<path d="M${32-w/2+3} 66h${w-6}l3 12H${32-w/2}z" fill="${B}"/><rect x="${32-w/2-1}" y="77" width="${w+2}" height="3" rx="1" fill="${st.base}"/>
    ${st.txt?`<text x="32" y="74.5" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="5" fill="${M[1]}" textLength="${Math.min(st.txt.length*3.1, w-10)}" lengthAdjust="spacingAndGlyphs">${st.txt}</text>`:""}`;
  const stem = (y1, y2, w=6) => `<rect x="${32-w/2}" y="${y1}" width="${w}" height="${y2-y1}" fill="${F}"/><ellipse cx="32" cy="${y2}" rx="${w+3}" ry="2.2" fill="${F}"/>`;
  const shine = (x,y,h) => `<path d="M${x} ${y}q-2 ${h/2} 0 ${h}" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" fill="none"/>`;
  const shapes = {
    // lidded urn with finial
    urn: `<path d="M18 22h28c0 15-5 24-14 26-9-2-14-11-14-26z" fill="${F}"/><path d="M17 20h30v3H17z" fill="${F}"/><path d="M21 20c0-6 5-10 11-10s11 4 11 10z" fill="${F}"/><circle cx="32" cy="7.5" r="3" fill="${F}"/>
      <path d="M18 26c-7-1-8 9-1 11M46 26c7-1 8 9 1 11" stroke="${F}" stroke-width="2.4" fill="none"/>${stem(48,64,7)}${shine(23,25,16)}`,
    // classic two-handled cup
    twohandle: `<path d="M17 12h30c0 19-5 30-15 32-10-2-15-13-15-32z" fill="${F}"/><ellipse cx="32" cy="12" rx="15" ry="2.6" fill="${M[2]}" opacity=".7"/>
      <path d="M17 15c-9-2-11 14 2 18M47 15c9-2 11 14-2 18" stroke="${F}" stroke-width="3" fill="none"/>${stem(44,64,6)}${shine(22,16,18)}`,
    // tall narrow cup
    tall: `<path d="M22 8h20l-2 30c-1 6-4 9-8 9s-7-3-8-9z" fill="${F}"/><path d="M22 10l-6 4 2 12 5-2M42 10l6 4-2 12-5-2" stroke="${F}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>${stem(47,64,5)}${shine(25,11,20)}`,
    // big ornate cup with angular handles
    grand: `<path d="M14 9h36c-1 22-8 34-18 36-10-2-17-14-18-36z" fill="${F}"/><path d="M14 11H6v14l12 6M50 11h8v14l-12 6" stroke="${F}" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <path d="M20 20h24" stroke="${M[0]}" stroke-opacity=".5"/><path d="M22 27h20" stroke="${M[0]}" stroke-opacity=".5"/>${stem(45,64,7)}${shine(20,13,20)}`,
    // wide bowl on a tall stem
    bowl: `<path d="M10 14h44c-2 14-11 21-22 22-11-1-20-8-22-22z" fill="${F}"/><ellipse cx="32" cy="14" rx="22" ry="3" fill="${M[2]}" opacity=".7"/>${stem(36,64,5)}${shine(16,16,10)}`,
    // slim flute
    slim: `<path d="M25 6h14l-1 32c0 6-3 9-6 9s-6-3-6-9z" fill="${F}"/><path d="M25 6l-4-3M39 6l4-3" stroke="${F}" stroke-width="2"/>${stem(47,64,5)}${shine(28,9,24)}`,
    // small cup
    small: `<path d="M21 22h22c0 13-4 20-11 21-7-1-11-8-11-21z" fill="${F}"/><path d="M21 25c-6-1-7 9 1 11M43 25c6-1 7 9-1 11" stroke="${F}" stroke-width="2.2" fill="none"/>${stem(43,64,5)}${shine(25,24,12)}`,
    // shield on a stand
    shield: `<path d="M14 10h36v22c0 14-8 22-18 26-10-4-18-12-18-26z" fill="${F}"/><path d="M20 16h24v15c0 10-5 15-12 18-7-3-12-8-12-18z" fill="none" stroke="${M[0]}" stroke-opacity=".55" stroke-width="1.4"/>
      <path d="M32 22l2.5 5 5.5.6-4 3.8 1 5.4-5-2.6-5 2.6 1-5.4-4-3.8 5.5-.6z" fill="${M[0]}" opacity=".6"/>${stem(57,64,8)}`,
    // world champions: a gold globe ringed by a laurel band, raised on a fluted pillar
    globe: `<circle cx="32" cy="24" r="16" fill="${F}"/>
      <path d="M16 24h32M32 8v32M19 15c8 4 18 4 26 0M19 33c8-4 18-4 26 0" stroke="${M[0]}" stroke-width="1.3" fill="none" opacity=".6"/>
      <ellipse cx="32" cy="24" rx="7" ry="16" fill="none" stroke="${M[0]}" stroke-width="1.3" opacity=".6"/>
      <path d="M14 30c2 8 9 13 18 13s16-5 18-13" stroke="${F}" stroke-width="3.2" fill="none"/>
      <path d="M26 44h12l-2 6h-8z" fill="${F}"/><path d="M28 50h8v10h-8z" fill="${F}"/><path d="M30 51v8M34 51v8" stroke="${M[0]}" stroke-width="1" opacity=".6"/>
      <ellipse cx="32" cy="62" rx="9" ry="2.4" fill="${F}"/>${shine(22,14,14)}`,
    // golden ball on a cradle
    ball: `<circle cx="32" cy="28" r="19" fill="${F}"/><path d="M32 14l6 5-2.5 7.5h-7L26 19zM16 25l5.5-3 4 6.5-3 6.5-5-1.5zM48 25l-5.5-3-4 6.5 3 6.5 5-1.5zM25 44l4-6h6l4 6-7 3z" fill="${M[0]}" opacity=".45"/>
      ${shine(22,17,16)}<path d="M22 46c3 6 17 6 20 0" stroke="${F}" stroke-width="3" fill="none"/>${stem(50,64,6)}`,
    // top scorer: a golden football boot side-on (sock collar, laces, a raised stripe, studs), standing on a black block
    bootpro: `<defs><linearGradient id="${id}u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".3" stop-color="#F9D85E"/><stop offset=".66" stop-color="#DDA81C"/><stop offset="1" stop-color="#8F6405"/></linearGradient>
        <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C39414"/><stop offset="1" stop-color="#6A4704"/></linearGradient>
        <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A97A0C"/><stop offset=".55" stop-color="#EAC23E"/><stop offset="1" stop-color="#B58710"/></linearGradient>
        <radialGradient id="${id}h" cx="34%" cy="22%" r="55%"><stop offset="0" stop-color="#FFFBE6" stop-opacity=".85"/><stop offset="1" stop-color="#FFFBE6" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2C313C"/><stop offset="1" stop-color="#0A0C10"/></linearGradient>
        <linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3B414D"/><stop offset=".5" stop-color="#5A616E"/><stop offset="1" stop-color="#3B414D"/></linearGradient></defs>
      <path d="M13.5 53.5h37l-1.5 2.5h-34z" fill="url(#${id}t)"/><rect x="15" y="56" width="34" height="10" fill="url(#${id}k)"/><rect x="22" y="58.4" width="20" height="5" rx=".8" fill="#D9A821"/><path d="M24 61h16" stroke="#8F6405" stroke-width=".6"/>
      <g transform="translate(1.8 53.6)">
        <path d="M6 -1.4h4.6l-.8 3.2h-3zM13.4 -1.4h4.6l-.8 3.2h-3zM30 -1.4h3.8l-.7 3h-2.4zM37 -1.5h3.8l-.7 3h-2.4zM44 -1.8h3.8l-.7 2.9h-2.4zM50.6 -2.3h3.6l-.7 2.8h-2.2z" fill="url(#${id}s)"/>
        <path d="M2.8 -4.4H54.5C57.8 -4.2 60 -4.6 60.6 -5.6l.4 1.2C60.4 -2.4 57.6 -1.1 53.5 -1H5.4C3 -1 1.8 -2.6 2.8 -4.4z" fill="url(#${id}s)"/>
        <path d="M4 -4.2H54.4C57 -4.1 59 -4.5 60 -5.2" stroke="#FFE9A0" stroke-width=".6" fill="none" opacity=".8"/>
        <path d="M4.2 -22.4C3.6 -25.8 4.4 -28.6 6.2 -30C9.6 -31 13 -30.3 15.6 -28.2C15.8 -27 15.2 -25.8 14.4 -24.8z" fill="url(#${id}c)" stroke="#7A5606" stroke-width=".6"/>
        <path d="M6.3 -28.9l.8 5.2M8.6 -29.5l.6 5M11 -29.4l.3 4.7M13.3 -28.7v4" stroke="#8F6405" stroke-width=".55" opacity=".55"/>
        <path d="M2.8 -4.4C1 -10 1.2 -17 4 -22.6C7 -25.2 11 -25.8 14.6 -24.6C19 -21.8 24 -18.8 31 -16.6C39 -14.2 47 -12 53.5 -9.8C58 -8.4 61 -6.8 60.6 -5.6C60 -4.6 57.8 -4.2 54.5 -4.2z" fill="url(#${id}u)" stroke="#7A5606" stroke-width=".7"/>
        <path d="M2.8 -4.4C1 -10 1.2 -17 4 -22.6C7 -25.2 11 -25.8 14.6 -24.6C19 -21.8 24 -18.8 31 -16.6C39 -14.2 47 -12 53.5 -9.8C58 -8.4 61 -6.8 60.6 -5.6C60 -4.6 57.8 -4.2 54.5 -4.2z" fill="url(#${id}h)"/>
        <path d="M2.8 -4.4C1 -10 1.2 -17 4 -22.6l4.2 1.2C6.6 -15.8 6.5 -9.8 8 -4.4z" fill="#8F6405" opacity=".4"/>
        <path d="M4.8 -22.4C7.8 -24.6 11.2 -25.2 14.2 -24.6C11.6 -23 8 -22.4 4.8 -22.4z" fill="#4A3304"/>
        <path d="M17.6 -22.4l2.4 2.3M20.8 -20.6l2.2 2.4M24 -19l2 2.5M27.2 -17.6l1.8 2.5" stroke="#8F6405" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>
        <path d="M17.4 -22.9l2.4 2.3M20.6 -21.1l2.2 2.4M23.8 -19.5l2 2.5M27 -18.1l1.8 2.5" stroke="#FFF1B0" stroke-width="1.15" stroke-linecap="round"/>
        <path d="M8.5 -8C19.5 -9.6 31.5 -12.8 45.5 -10.8" stroke="#8F6405" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".45"/>
        <path d="M8.5 -8.6C19.5 -10.2 31.5 -13.4 45.5 -11.4" stroke="#FFE58A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M46 -11.6C47.4 -9.2 47.6 -6.6 46.8 -4.6" stroke="#8F6405" stroke-width=".6" fill="none" opacity=".55"/>
        <path d="M15.6 -23.6C19.6 -21 23.6 -19 28.4 -17.4" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/>
        <path d="M40 -13.6C46 -12.2 51.6 -10.6 56.6 -8.2" stroke="#FFFFFF" stroke-width="1.1" fill="none" opacity=".85" stroke-linecap="round"/>
        <path d="M2.6 -12C2.5 -16 3.1 -19.2 4.6 -21.6" stroke="#FFFFFF" stroke-width=".9" fill="none" opacity=".5" stroke-linecap="round"/></g>
      <path d="M50 20l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z" fill="#FFF6D2"/><path d="M13 14l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z" fill="#FFF6D2" opacity=".75"/>`,
    // playmaker: a gold orb traced by three curling passes, held up in a forked cradle
    playmaker: `<circle cx="32" cy="26" r="17" fill="${F}"/>
      <path d="M19 33c6-10 16-14 26-12M18 22c8 2 15 8 18 18M40 12c-6 4-10 12-9 22" stroke="${M[0]}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/>
      <path d="M45 21l-3-2.5M45 21l-3.6 1.2" stroke="${M[0]}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="31" cy="34" r="2.4" fill="${M[0]}"/>
      <path d="M22 41c2 6 6 9 10 9s8-3 10-9" stroke="${F}" stroke-width="3.2" fill="none"/>
      ${shine(22,16,14)}${stem(50,64,5)}`,
    // player of the season: a star framed by a laurel wreath on a column
    laurel: `<path d="M32 9l4.2 8.6 9.4 1.3-6.8 6.6 1.6 9.4-8.4-4.4-8.4 4.4 1.6-9.4-6.8-6.6 9.4-1.3z" fill="${F}"/>
      <path d="M17 22c-2 9 3 19 13 23M47 22c2 9-3 19-13 23" stroke="${M[0]}" stroke-width="1.6" fill="none"/>
      ${[0,1,2,3,4].map(i=>{ const t=i/4, xl=17.5-2.5*Math.sin(t*3)+t*8, yl=22+t*21; return `<ellipse cx="${xl.toFixed(1)}" cy="${yl.toFixed(1)}" rx="2.2" ry="4.4" transform="rotate(${(-40+t*70).toFixed(0)} ${xl.toFixed(1)} ${yl.toFixed(1)})" fill="${F}"/><ellipse cx="${(64-xl).toFixed(1)}" cy="${yl.toFixed(1)}" rx="2.2" ry="4.4" transform="rotate(${(40-t*70).toFixed(0)} ${(64-xl).toFixed(1)} ${yl.toFixed(1)})" fill="${F}"/>`; }).join("")}
      <path d="M27 46h10l-1.5 4h-7z" fill="${F}"/>${stem(50,64,6)}`,
    // young player: a silver rising flame-star on a slender spire
    rising: `<path d="M32 4c4 8 11 13 11 23 0 8-5 13-11 13s-11-5-11-13c0-6 4-9 6-13 1 4 2 6 4 7-1-7 0-12 1-17z" fill="${F}"/>
      <path d="M32 18l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="${M[0]}" opacity=".55"/>
      <path d="M32 40l-4 4h8z" fill="${F}"/>
      <path d="M30.5 44h3l1 20h-5z" fill="${F}"/><ellipse cx="32" cy="64" rx="7" ry="2" fill="${F}"/>
      ${shine(26,20,14)}`,
    // medal on a ribbon
    medal: `<path d="M20 2h10l5 26h-9zM44 2H34l-5 26h9z" fill="${st.base}"/><circle cx="32" cy="44" r="17" fill="${F}"/><circle cx="32" cy="44" r="12.5" fill="none" stroke="${M[0]}" stroke-opacity=".6"/>
      <path d="M32 35l3 6.5 7 .6-5.3 4.7 1.6 7-6.3-3.8-6.3 3.8 1.6-7-5.3-4.7 7-.6z" fill="${M[0]}" opacity=".7"/>`
  };
  const body = shapes[st.shape] || shapes.twohandle;
  return `<svg viewBox="0 0 64 82" aria-hidden="true">${defs}${body}${st.shape==="medal"?"":plinth(st.shape==="bootpro" ? 50 : st.shape==="grand"||st.shape==="bowl"?40:34)}</svg>`;
}

/* ================= SIMULATION ================= */
// club stature relative to a league (0.55–1.05), from current strength — clubs rise and fall over time
function repOf(n, t){ t = t ?? tierOf(n); const T = TIERS[t] || TIERS[5]; return clamp(.6 + .4*(strOf(n)-T.lo)/(T.hi-T.lo), .55, 1.05); }
// how much a player of your value matters at this level
function impFactor(t){ return clamp(S.value/(TIERS[t].ceil*.2), .5, 1.5); }
// strength boost from your stats in each competition, scaled by how many games you played
function playerImpact(comps, t){
  const imp = impFactor(t), out = {};
  for (const k in comps){ const c = comps[k];
    if (!c.apps){ out[k] = 0; continue; }
    const sc = perf({x:c}, null, S.player.pos).score;
    out[k] = k==="league" ? clamp((sc-.55)*6*(c.apps/TIERS[t].games)*imp, -3, 4.5)
                          : clamp((sc-.55)*4*Math.min(1, c.apps/4)*imp, -2, 3);
  }
  return out;
}
function simLeague(t, boosts){
  const T = TIERS[t], g = T.games, mid = (T.lo+T.hi)/2, slope = T.level===1 ? 3.4*g/38 : 4.3, base = g*1.37;
  const rows = S.world.tiers[t].map(n=>{
    const power = strOf(n) + (boosts[n]||0) + gauss()*1.4;
    let pts = Math.round(clamp(base + (power-mid)*slope + gauss()*4*g/38, g*.35, g*2.55));
    const gd = Math.round((pts-base)*1.05 + gauss()*5);
    return {n, pts, gd};
  });
  rows.sort((a,b)=>b.pts-a.pts || b.gd-a.gd || Math.random()-.5);
  rows.forEach((r,i)=>r.pos=i+1);
  return rows;
}
function tie(a, b, legs){ let p = logistic((a-b)/6); p = .5 + (p-.5)*(legs===2?.95:.85); return Math.random() < p; }
function match(a, b){ const d=(a-b)/5, pD=.25, pW=(1-pD)*logistic(d); const r=Math.random(); return r<pW?3:r<pW+pD?1:0; }
function domesticOpp(tiersAllowed, k, exclude){
  const pool = []; tiersAllowed.forEach(t=>S.world.tiers[t].forEach(n=>{ if (n!==exclude) pool.push({n,str:strOf(n)}); }));
  const draws = shuffle(pool).slice(0, k); return draws.sort((a,b)=>b.str-a.str)[0];
}
// need = games you played in it: the team must have survived long enough for you to play them
function runCup({code, name, rounds, entry, my, oppFor, legs=()=>1, group=false, need=0}){
  let games = 0, beaten = [];
  for (let i=entry;i<rounds.length;i++){
    if (group && i===entry){
      if (need > 3){ games += 3; continue; }
      let pts=0; for (let k=0;k<3;k++){ pts += match(my, oppFor(i).str); } games += 3;
      if (pts<4 && !(pts===3 && Math.random()<.4)) return {code,name,games,reached:"Group stage",won:false,stage:i,out:"Out in the group stage"};
      continue;
    }
    const opp = oppFor(i), L = legs(i);
    const forced = games + L < need;
    games += L;
    if (!forced && !tie(my, opp.str, L)){
      return {code,name,games,reached:rounds[i],lostTo:opp.n,won:false,stage:i,beaten,
        out: rounds[i]==="Final" ? `Runners-up, lost the final to ${opp.n}` : `Reached the ${rounds[i]}, knocked out by ${opp.n}`};
    }
    beaten.push(opp.n);
  }
  return {code,name,games,reached:"Winners",won:true,stage:rounds.length,beaten,out:`Winners, beat ${beaten[beaten.length-1]} in the final`};
}
const KO_EU = ["Knockout play-off","Round of 16","Quarter-final","Semi-final","Final"];
function euroField(code, exclude){
  const field = [];
  for (const t of TOP) S.world.tiers[t].forEach(n=>{ if (n!==exclude && S.world.europe[n]===code) field.push({n, str:strOf(n)}); });
  const names = new Set(field.map(f=>f.n));
  EURO[code].teams.forEach(x=>{ if (!names.has(x.n) && !META[x.n]) field.push(x); });
  return field;
}
function runEurope(code, my, need, our){
  const E = EURO[code], field = euroField(code, our), opps = shuffle(field).slice(0,E.phase);
  let pts = 0; opps.forEach(o=>pts+=match(my, o.str));
  if (need > E.phase && pts < E.po) pts = E.po + Math.floor(Math.random()*3);
  if (pts < E.po) return {code, name:E.name, games:E.phase, won:false, stage:0, reached:"League phase", out:`Out in the league phase with ${pts} points`};
  const start = pts >= E.top8 ? 1 : 0;
  const r = runCup({code, name:E.name, rounds:KO_EU, entry:start, my, need:need-E.phase, legs:i=>i===4?1:2,
    oppFor:i=>shuffle(field).slice(0,2+i).sort((a,b)=>b.str-a.str)[0]});
  r.games += E.phase;
  r.out = `${pts} pts in the league phase${start?" (top 8, straight to the last 16)":""}. ${r.out}`;
  return r;
}
function compPlan(club){
  const t = tierOf(club), eu = S.world.europe[club], out = [];
  if (FOREIGN.includes(t)){
    const T = TIERS[t], C = T.cup, entry = (t==="IT" && expectedFinish(club).rank<=8) ? 1 : 0;
    out.push({code:"league", name:T.name, max:T.games + (T.relPO?2:0), note:`${T.games} league games`});
    out.push({code:C.code, name:C.name, entry, max:C.rounds.length-entry+(C.sf!=null?1:0), note:`Enter in the ${C.rounds[entry]}`});
    if (eu) out.push({code:eu, name:EURO[eu].name, max:EURO[eu].phase+9, note:"League phase", eu:true});
    return out;
  }
  out.push({code:"league", name:TIERS[t].name, max:TIERS[t].games + (t>1?3:0), note:`${TIERS[t].games} league games${t>1?" + play-offs":""}`});
  const fe = t<=2?3 : t<=4?1 : 0;
  out.push({code:"fa", name:"FA Cup", max:9-fe, entry:fe, note:["Enter in the 4th Qualifying Round","","","Enter in the 3rd Round"][fe]||"Enter in the 1st Round"});
  if (t<=4){ const le = t===1 ? (eu?2:1) : 0; out.push({code:"lc", name:"League Cup", max:8-le, entry:le, note:["Enter in the 1st Round","Enter in the 2nd Round","Enter in the 3rd Round"][le]}); }
  if (t===3||t===4) out.push({code:"eflt", name:"EFL Trophy", max:8, note:"Group stage"});
  if (t===5) out.push({code:"fat", name:"FA Trophy", max:6, note:"Enter in the 3rd Round"});
  if (eu) out.push({code:eu, name:EURO[eu].name, max:EURO[eu].phase+9, note:"League phase", eu:true});
  return out;
}

// the domestic cups a club enters this season, shared by the season sim and the match centre
function cupSpecs(our){
  const t = tierOf(our), T = TIERS[t], W = S.world, plan = compPlan(our), out = [];
  if (T.country==="England"){
    out.push({code:"fa", name:"FA Cup", rounds:CP_ROUNDS.fa, entry:plan.find(p=>p.code==="fa").entry,
      oppFor:i=> i<=2 ? domesticOpp([3,4,5],1,our) : i<=4 ? domesticOpp([1,2,3,4,5], i-1, our) : domesticOpp([1,2], i-3, our)});
    const pl = plan.find(p=>p.code==="lc");
    if (pl) out.push({code:"lc", name:"League Cup", rounds:CP_ROUNDS.lc, entry:pl.entry,
        legs:i=>i===5?2:1, oppFor:i=>domesticOpp(i<2?[2,3,4]:i<3?[1,2,3,4]:[1,2], i<3?2:i-1, our)});
    if (t===3||t===4) out.push({code:"eflt", name:"EFL Trophy", rounds:CP_ROUNDS.eflt, entry:0, group:true,
        oppFor:()=>domesticOpp([3,4],1,our)});
    if (t===5){
      const pool = W.tiers[5].concat(W.tiers[6]).filter(n=>n!==our);
      out.push({code:"fat", name:"FA Trophy", rounds:CP_ROUNDS.fat, entry:0,
        oppFor:i=>shuffle(pool).slice(0,1+Math.floor(i/2)).map(n=>({n,str:strOf(n)})).sort((a,b)=>b.str-a.str)[0]});
    }
  } else {
    const C = T.cup, p = plan.find(x=>x.code===C.code), second = W.tiers[T.second];
    out.push({code:C.code, name:C.name, rounds:C.rounds, entry:p.entry,
      legs:i=>i===C.sf?2:1,
      oppFor:i=> i<C.early ? (n=>({n,str:strOf(n)}))(pick(second))
        : shuffle(W.tiers[t].filter(n=>n!==our)).slice(0, i-C.early+1).map(n=>({n,str:strOf(n)})).sort((a,b)=>b.str-a.str)[0]});
  }
  return out;
}
function simSeason(comps){
  const our = S.club, t = tierOf(our), T = TIERS[t], I = playerImpact(comps, t), base = strOf(our);
  const my = k => base + (I[k]||0), bL = I.league||0, need = k => (comps[k]&&comps[k].apps)||0;
  const W = S.world;
  const expRank = {};
  for (const k of LEAGUES) W.tiers[k].slice().sort((a,b)=>strOf(b)-strOf(a)).forEach((n,i)=>expRank[n]=i+1);
  // leagues played out week by week in the match centre (league.js) keep their tables; the rest are simulated
  const tables = {}; for (const k of LEAGUES) tables[k] = lgFinalRows(k) || simLeague(k, {[our]:bL});
  if (!lgGet(t)) mcLeagueTable(tables[t], our);   // your club's real results, from a match centre season before the league was played out
  const tbl = tables[t], row = tbl.find(r=>r.n===our);
  let leagueGames = T.games;
  const sb = n => strOf(n) + (n===our?bL:0);

  // English play-offs + movements
  const moves = {}, poWinners = {}; let ourPO = null, relPO = null;
  for (const k of [2,3,4,5]){
    const tt = TIERS[k], tb = tables[k];
    const auto = tb.slice(0, tt.up).map(r=>r.n);
    const po = tb.slice(tt.po[0]-1, tt.po[1]).map(r=>r.n);
    const s1 = tie(sb(po[0]), sb(po[3]), 2) ? po[0] : po[3];
    const s2 = tie(sb(po[1]), sb(po[2]), 2) ? po[1] : po[2];
    const win = tie(sb(s1), sb(s2), 1) ? s1 : s2;
    poWinners[k] = win; moves[k] = {up:[...auto, win]};
    if (k===t && po.includes(our)){ const inFinal = s1===our||s2===our; leagueGames += inFinal?3:2; ourPO = win===our?"won":inFinal?"lost final":"lost semi"; }
  }
  moves[1] = {up:[]};
  for (const k of ENG){
    let down = tables[k].slice(-TIERS[k].down).map(r=>r.n);
    if (k===5 && down.includes(our)) down = tables[k].slice(-TIERS[k].down-1).map(r=>r.n).filter(n=>n!==our);
    moves[k].down = down;
  }
  const engPoolUp = W.tiers[6].slice().sort((a,b)=>strOf(b)-strOf(a)+gauss()*2).slice(0, TIERS[5].down);
  // foreign top flights: bottom clubs go down, the best second-tier clubs come up (Germany/France: 16th plays off)
  for (const f of FOREIGN){
    const tt = TIERS[f], tb = tables[f], pool = W.tiers[tt.second].slice().sort((a,b)=>strOf(b)-strOf(a)+gauss()*2.5);
    const down = tb.slice(-tt.down).map(r=>r.n), up = pool.slice(0, tt.down);
    if (tt.relPO){
      const p16 = tb[tb.length-tt.down-1].n, ch = pool[tt.down];
      if (ch){ const stays = tie(sb(p16), strOf(ch), 2); if (p16===our){ relPO = stays?"won":"lost"; leagueGames += 2; } if (!stays){ down.push(p16); up.push(ch); } }
    }
    moves[f] = {up, down};
  }
  const reprieved = t===5 && row.pos > tbl.length-TIERS[5].down;

  // cups and Europe: from the match centre's fixtures when you played the season there, otherwise driven by your stats
  cpFinishAll();   // the English cups played out in full in the match centre get their winners (cups.js)
  euFinishAll();   // and Europe (europe.js)
  const out = cupSpecs(our).map(c=>mcCupResult(our, c) || runCup({...c, my:my(c.code), need:need(c.code)}));
  const euCode = W.europe[our];
  if (euCode) out.push(mcEuroResult(our, euCode) || runEurope(euCode, my(euCode), need(euCode), our));

  // league outcome
  let moved = null, outcome;
  if (T.level>1 && moves[t].up.includes(our)) moved = "up";
  if (moves[t].down.includes(our)) moved = "down";
  const champs = row.pos===1;
  if (isTop(t)){
    const [q1,q2,q3] = T.eu, zone = row.pos<=q1 ? "UCL" : row.pos<=q1+q2 ? "UEL" : row.pos<=q1+q2+q3 ? "UECL" : null;
    outcome = champs ? (T.champs || "Champions of England!") : zone==="UCL" ? "Champions League qualification" : zone==="UEL" ? "Europa League qualification" : zone==="UECL" ? "Conference League qualification"
      : moved==="down" ? `Relegated to ${theName(T.second)}${relPO==="lost"?" after losing the relegation play-off":""}` : relPO==="won" ? "Survived the relegation play-off" : row.pos>=tbl.length-5 ? "Survived a relegation scrap" : "Mid-table";
  } else {
    const upName = theName(t-1);
    outcome = champs ? `Champions, promoted to ${upName}` : moved==="up" ? (ourPO==="won" ? `Play-off winners, promoted to ${upName}` : `Promoted to ${upName}`)
      : ourPO==="lost final" ? "Lost the play-off final" : ourPO==="lost semi" ? "Knocked out in the play-off semi-finals"
      : moved==="down" ? `Relegated to ${theName(t+1)}` : reprieved ? "Finished in the drop zone but reprieved after another club folded" : row.pos<=T.po[1]+2 ? "Just missed the play-offs" : "Mid-table";
  }
  out.unshift({code:"league", name:T.name, games:leagueGames, won:champs, out:`Finished ${ord(row.pos)} of ${tbl.length} with ${row.pts} points`, outcome, po:ourPO});

  // next season's Europe: top six in each top flight, plus your cup wins
  const nextEu = {}, rank = {UCL:3,UEL:2,UECL:1};
  for (const f of TOP){ const tb = tables[f].map(r=>r.n), [q1,q2,q3] = TIERS[f].eu; tb.forEach((n,i)=>{ if (i<q1) nextEu[n]="UCL"; else if (i<q1+q2) nextEu[n]="UEL"; else if (i<q1+q2+q3) nextEu[n]="UECL"; }); }
  const give = (n,c)=>{ if (!nextEu[n] || rank[c]>rank[nextEu[n]]) nextEu[n]=c; };
  out.forEach(c=>{ if (!c.won || c.code==="league") return;
    if (c.code==="UCL"||c.code==="UEL") give(our,"UCL");
    else if (c.code==="UECL"||c.code==="fa"||cupNames[c.code]) give(our,"UEL");
    else if (c.code==="lc") give(our,"UECL"); });
  for (const f of TOP) moves[f].down.forEach(n=>{ if (n!==our || !out.some(c=>c.won&&c.code!=="league")) delete nextEu[n]; });

  // records
  const label = seasonLabel(S.season);
  for (const k of LEAGUES) tables[k].forEach(r=>{ (S.records[r.n] ||= []).push({s:label, t:k, pos:r.pos, str:+strOf(r.n).toFixed(1)}); if (S.records[r.n].length>12) S.records[r.n].shift(); });

  // apply promotion & relegation
  const nt = {}; ALLKEYS.forEach(k=>nt[k]=[]);
  const upSet = new Set(), downSet = new Set();
  const poolOut = new Set([...engPoolUp, ...FOREIGN.flatMap(f=>moves[f].up)]);
  POOLS.forEach(pk=>W.tiers[pk].forEach(n=>{ if (!poolOut.has(n)) nt[pk].push(n); }));
  for (const k of LEAGUES){
    const TT = TIERS[k];
    W.tiers[k].forEach(n=>{
      if (TT.level>1 && TT.country==="England" && moves[k].up.includes(n)){ nt[k-1].push(n); upSet.add(n); }
      else if (moves[k].down.includes(n)){ nt[TT.second].push(n); downSet.add(n); }
      else nt[k].push(n);
    });
  }
  engPoolUp.forEach(n=>{ nt[5].push(n); upSet.add(n); });
  FOREIGN.forEach(f=>moves[f].up.forEach(n=>{ nt[f].push(n); upSet.add(n); }));
  W.tiers = nt;

  // club fortunes: results feed back into each club's long-run level, so giants can fade and smaller clubs can grow
  const posOf = {}; for (const k of LEAGUES) tables[k].forEach(r=>posOf[r.n]={pos:r.pos, n:tables[k].length});
  for (const k of ALLKEYS){ const T2 = TIERS[k], m = (T2.lo+T2.hi)/2;
    W.tiers[k].forEach(n=>{
      let b = W.base[n] ?? strOf(n);
      const p = posOf[n];
      const overPerf = p ? (expRank[n]-p.pos)/p.n : 0;
      b += gauss()*1.1 + overPerf*3 + (upSet.has(n)?1.2:0) - (downSet.has(n)?1.4:0) + (nextEu[n]==="UCL"?.4:0) + (m-b)*.015;
      b = clamp(b, 32, 93);
      let s = strOf(n); s = clamp(s + (b - s)*.25 + gauss()*1.0, 30, 94);
      W.base[n] = +b.toFixed(2); W.str[n] = +s.toFixed(2); }); }
  W.europe = nextEu;

  return {season:label, club:our, tier:t, n:tbl.length, pos:row.pos, pts:row.pts, moved, newTier:tierOf(our), nextEurope:nextEu[our]||null,
    impact:{league:bL, pts:Math.round(bL*(T.level===1?3.4*T.games/38:4.3)), share:need("league")/T.games},
    tables: Object.fromEntries(LEAGUES.map(k=>[k, tables[k].map(r=>({n:r.n, pts:r.pts, gd:r.gd}))])), comps:out, poWinner:poWinners[t]||null};
}

/* ================= CAREER CREATION ================= */
function randomClub(except){ const all = LEAGUES.flatMap(t=>TIER_LISTS[t]).filter(n=>n!==except); return pick(all); }
function defaultDraft(){
  return {name:"Kai Morgan", nation:"England", age:18, pos:"RW", number:"17", club:randomClub(), years:3, skin:1, hair:"short", hairColour:"Black", photo:null,
    customName:"", customTier:5, customC1:"#7B2CBF", customC2:"#FFFFFF"};
}
function draftClub(d){
  if (d.club==="__custom") return {meta:{n:d.customName||"Your club", c1:d.customC1, c2:d.customC2, r:.85}, t:+d.customTier};
  for (const t of LEAGUES) if (TIER_LISTS[t].includes(d.club)) return {meta:META[d.club], t};
  return {meta:META.Wrexham, t:2};
}
function startValueFor(d, dc){
  const age = clamp(+d.age||18,16,38);
  return roundTM(TIERS[dc.t].ceil*ageF(age)*POS[d.pos].pf*contractF(+d.years)*(.75+.25*dc.meta.r)*Math.pow(.55,1.8)*.8);
}
function clubOptions(sel){
  return LEAGUES.map(t=>`<optgroup label="${TIERS[t].name}${t===1||FOREIGN.includes(t)?" · "+TIERS[t].country:""}">${TIER_LISTS[t].map(n=>`<option ${n===sel?"selected":""}>${esc(n)}</option>`).join("")}</optgroup>`).join("")
    + `<optgroup label="Your own"><option value="__custom" ${sel==="__custom"?"selected":""}>Create a custom club…</option></optgroup>`;
}
const PITCH_SPOTS = {GK:[7,50], CB:[22,50], LB:[30,15], RB:[30,85], CDM:[41,50], CM:[55,50], CAM:[68,50], LW:[78,15], RW:[78,85], ST:[88,50]};
function pitchPicker(sel){
  return `<div class="ppick" role="group" aria-label="Position">
    <svg class="ppick-lines" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".7" vector-effect="non-scaling-stroke">
      <rect x="2" y="2" width="156" height="96"/><path d="M80 2V98"/><circle cx="80" cy="50" r="13"/><rect x="2" y="24" width="22" height="52"/><rect x="2" y="38" width="8" height="24"/><rect x="136" y="24" width="22" height="52"/><rect x="150" y="38" width="8" height="24"/></g></svg>
    <span class="ppick-dir" aria-hidden="true">Attack ➝</span>
    ${Object.entries(PITCH_SPOTS).map(([k,[x,y]])=>`<button type="button" class="pdot" style="left:${x}%;top:${y}%" data-act="dset" data-k="pos" data-v="${k}" aria-pressed="${k===sel}" title="${POS[k].label}">${k}</button>`).join("")}
  </div>`;
}
function swatchBtns(k, list, sel, cls=""){ return `<div class="swatches">${list.map(([v,label,col])=>`<button type="button" class="sw ${cls}" data-act="dset" data-k="${k}" data-v="${v}" aria-pressed="${String(v)===String(sel)}" aria-label="${esc(label)}" title="${esc(label)}" style="--sw:${col}">${cls?"":`<span>${esc(label)}</span>`}</button>`).join("")}</div>`; }
function renderCreate(){
  const d = draft || (draft = defaultDraft()), dc = draftClub(d), sv = startValueFor(d, dc);
  $("#bandRight").innerHTML = `<button class="btn ghost" data-act="board-open">Legacy</button>` + (S && !S.newing ? "" : S ? `<button class="btn ghost" data-act="cancel-new">Back to career</button>` : "") + Hub.menuBtn();
  const nClubs = LEAGUES.reduce((n,t)=>n+TIER_LISTS[t].length,0);
  $("#app").innerHTML = `
  ${migratedNote?`<p class="ref" role="status" style="margin:0 0 18px">${esc(migratedNote)}</p>`:""}
  ${flash?`<p class="ref" role="status" style="margin:0 0 18px">${esc(flash)}</p>`:""}
  <div class="intro">
    <div class="eyebrow">New career · ${seasonLabel(2026)}</div>
    <h2 class="intro-h">Build your player</h2>
    <p class="intro-p">Start anywhere from the National League to the Champions League. Play your seasons match by match and the football world reacts: values, offers, trophies, call-ups.</p>
  </div>
  <div class="board create-board">
    <div class="col create-side">
      <section class="panel card">
        <div class="card-top">${portrait(d, dc.meta, d.number)}<div class="card-pos">${d.pos}</div></div>
        <div class="card-body">
          <p class="pname">${esc(d.name||"Your player")}</p>
          <div class="clubline"><span class="swatch" style="--c1:${dc.meta.c1};--c2:${dc.meta.c2}"></span>${esc(dc.meta.n)} · ${TIERS[dc.t].name}</div>
          <div class="facts">
            <div class="fact"><div class="label">Age</div><div class="v" id="pvAge">${clamp(+d.age||18,16,38)}</div></div>
            <div class="fact"><div class="label">Position</div><div class="v">${d.pos}</div></div>
            <div class="fact"><div class="label">Nation</div><div class="v" id="pvNation" style="font-size:16px">${esc(d.nation||"—")}</div></div>
          </div>
          <div class="value-box"><div><div class="label">Starting value</div><div class="value-big" id="pvValue">${money(sv)}</div></div><div style="text-align:right"><div class="label">Wage</div><div class="wage-sm" id="pvWage">${wageTxt(wageFor(sv, dc.meta.n, dc.t, clamp(+d.age||18,16,38)))}</div></div></div>
        </div>
      </section>
    </div>
    <form id="createForm" class="col create-form">
      <section class="panel cstep">
        <div class="cstep-h"><span class="cstep-n">1</span><div><h3>Who are you?</h3><p class="hint">Name, nationality and shirt number. Your nation decides which international tournaments you can play.</p></div></div>
        <div class="grid-form">
          <div class="field"><label for="c-name">Name</label><input id="c-name" data-k="name" value="${esc(d.name)}" maxlength="28" required autocomplete="off"></div>
          <div class="field"><label for="c-nation">Nationality</label><input id="c-nation" data-k="nation" value="${esc(d.nation)}" maxlength="24" autocomplete="off"></div>
          <div class="field"><label for="c-num">Shirt number</label><input id="c-num" data-k="number" type="number" min="1" max="99" value="${esc(d.number)}"></div>
        </div>
        <div class="field age-field"><label for="c-age">Age · <output id="ageOut">${clamp(+d.age||18,16,38)}</output></label><input id="c-age" data-k="age" type="range" min="16" max="38" value="${clamp(+d.age||18,16,38)}"><div class="range-ends"><span>16 · academy</span><span>38 · veteran</span></div></div>
      </section>
      <section class="panel cstep">
        <div class="cstep-h"><span class="cstep-n">2</span><div><h3>Position</h3><p class="hint">Tap a spot on the pitch. <strong>${POS[d.pos].label}</strong>${DEF.includes(d.pos)?": clean sheets count towards your rating.":"."}</p></div></div>
        ${pitchPicker(d.pos)}
      </section>
      <section class="panel cstep">
        <div class="cstep-h"><span class="cstep-n">3</span><div><h3>Your look</h3><p class="hint">Your player wears your club's kit. Upload a photo instead if you'd rather.</p></div></div>
        <div class="look">
          <div class="field"><span class="flabel">Skin tone</span>${swatchBtns("skin", SKIN.map((c,i)=>[i,`Skin tone ${i+1}`,c]), d.skin, "dot")}</div>
          <div class="field"><span class="flabel">Hair</span><div class="chips" style="margin:0">${[["short","Short"],["buzz","Buzz cut"],["curly","Curly"],["long","Long"],["none","Shaved"]].map(([v,l])=>`<button type="button" class="chip ${v===d.hair?"on":""}" data-act="dset" data-k="hair" data-v="${v}" aria-pressed="${v===d.hair}">${l}</button>`).join("")}</div></div>
          <div class="field"><span class="flabel">Hair colour</span>${swatchBtns("hairColour", Object.entries(HAIRC).map(([k,c])=>[k,k,c]), d.hairColour, "dot")}</div>
          <div class="field"><span class="flabel">Photo</span><div class="row"><label class="btn small" for="c-photo">${d.photo?"Change photo":"Upload a photo"}</label><input id="c-photo" class="vh" type="file" accept="image/*">${d.photo?`<button type="button" class="btn small" data-act="clear-photo">Use the drawn player</button>`:""}</div></div>
        </div>
      </section>
      <section class="panel cstep">
        <div class="cstep-h"><span class="cstep-n">4</span><div><h3>Club & contract</h3><p class="hint">Picked at random from all ${nClubs} clubs across eight countries. Keep it, roll again or choose your own.</p></div></div>
        <div class="row club-row">
          <div class="field" style="flex:1;min-width:0"><label for="c-club">Club</label><select id="c-club" data-k="club">${clubOptions(d.club)}</select></div>
          <button type="button" class="btn dice" data-act="rand-club" title="Pick a random club" aria-label="Pick a random club"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/></svg>Roll</button>
        </div>
        ${d.club==="__custom"?`<div class="custom-club grid-form">
          <div class="field"><label for="c-cname">Club name</label><input id="c-cname" data-k="customName" value="${esc(d.customName)}" maxlength="30" placeholder="e.g. Brighton Rangers"></div>
          <div class="field"><label for="c-ctier">League</label><select id="c-ctier" data-k="customTier">${[1,2,3,4,5].map(t=>`<option value="${t}" ${t==d.customTier?"selected":""}>${TIERS[t].name}</option>`).join("")}</select></div>
          <div class="field"><label for="c-c1">Shirt colour</label><input id="c-c1" type="color" data-k="customC1" value="${d.customC1}"></div>
          <div class="field"><label for="c-c2">Trim colour</label><input id="c-c2" type="color" data-k="customC2" value="${d.customC2}"></div>
        </div>`:""}
        <div class="field" style="margin-top:14px"><span class="flabel">Contract length</span>
          <div class="seg" role="group" aria-label="Contract length">${[1,2,3,4,5].map(y=>`<button type="button" data-act="dset" data-k="years" data-v="${y}" aria-pressed="${y==d.years}">${y}<small>yr${y>1?"s":""}</small></button>`).join("")}</div></div>
      </section>
      <div class="kickoff">
        <button class="btn primary big" type="submit">Kick off · ${seasonLabel(2026)}</button>
        <span class="err" id="createErr"></span>
      </div>
    </form>
  </div>`;
}
function startCareer(){
  const d = draft;
  if (!d.name.trim()){ $("#createErr").textContent="Give your player a name to start."; return; }
  if (d.club==="__custom" && !d.customName.trim()){ $("#createErr").textContent="Name your custom club, or pick one from the list."; return; }
  if (d.club==="__custom" && META[d.customName.trim()]){ $("#createErr").textContent="That name belongs to a real club. Pick it from the list, or choose another name."; return; }
  const dc = draftClub(d);
  let custom = null, clubName = d.club;
  if (d.club==="__custom"){ custom = {n:d.customName.trim(), t:+d.customTier, c1:d.customC1, c2:d.customC2, r:.85, founded:"2026", nick:"", ground:"", bio:"", custom:true}; clubName = custom.n; }
  const player = {name:d.name.trim(), nation:d.nation.trim(), pos:d.pos, number:String(d.number||9), skin:+d.skin, hair:d.hair, hairColour:d.hairColour, photo:d.photo};
  S = newState(player, clamp(+d.age||18,16,38), clubName, +d.years, custom, startValueFor(d, dc));
  migratedNote = ""; draft = null; tab = "season"; save(); render();
}
// clubs that buy young and sell high
const SELLERS = new Set(["Brighton & Hove Albion","Brentford","Southampton","Bournemouth","Crystal Palace","Benfica","Porto","Sporting CP","Braga","Ajax","PSV","Feyenoord","AZ","Twente","RB Leipzig","Borussia Dortmund","Eintracht Frankfurt","SC Freiburg","Lille","Monaco","Lens","Rennes","Atalanta","Udinese","Sassuolo","Villarreal","Real Sociedad","Sevilla","Celtic","Lyon"]);
function clubModel(n){
  const t = tierOf(n);
  if (SELLERS.has(n)) return {k:"seller", label:"Buy young, sell high", text:"Signs young players, develops them and sells when the price is right."};
  if (repOf(n,t)>=.96 && TIERS[t].pr>=.8) return {k:"elite", label:"Win now", text:"Big budget and little patience: ageing players get moved on to make room for better ones."};
  return {k:"steady", label:"Steady", text:"Keeps a settled squad, but rarely stands in the way of a big move."};
}
const INJ = {
  major: {label:"Major injury",  lo:.65, hi:.8,  p:.025, add:.6,  names:["ACL rupture","Broken leg","Achilles tendon rupture","Cartilage damage needing surgery","Fractured kneecap"]},
  medium:{label:"Medium injury", lo:.38, hi:.5,  p:.06,  add:.3,  names:["Torn hamstring","Broken metatarsal","Ankle ligament damage","Dislocated shoulder","Groin tear"]},
  minor: {label:"Minor injury",  lo:.1,  hi:.22, p:.15,  add:.1,  names:["Hamstring strain","Calf strain","Knee sprain","Thigh strain","Back spasm"]},
  small: {label:"Knock",         lo:.01, hi:.08, p:.3,   add:.03, names:["Dead leg","Tight hamstring","Ankle knock","Illness","Bruised foot","Minor concussion"]}
};
const INJ_ORDER = ["major","medium","minor","small"];
// injury risk by age: growing bodies (16–21) and veterans (34–42) break down more; 22–29 is the safest stretch
function injuryAgeFactor(age){
  if (age<=21) return [1.5,1.45,1.4,1.3,1.25,1.2][clamp(age,16,21)-16];
  if (age<=29) return 1;
  if (age<=33) return 1 + (age-29)*.06;
  return 1.45 + (Math.min(age,42)-34)*.15;
}
function pickBadLuckAge(age){ const from = Math.max(22, age); return from>29 ? null : from + Math.floor(Math.random()*(29-from+1)); }
function proneLabel(p){ return p<.8 ? "Robust" : p<1.4 ? "Normal" : p<2 ? "Fragile" : "Injury-prone"; }
function makeInjury(tier, by){ const I = INJ[tier]; return {tier, name:pick(I.names), red:+rnd(I.lo, I.hi).toFixed(2), by}; }
// injuries for the coming season: smaller ones are more common; proneness and age raise the odds
function rollInjuries(){
  const label = seasonLabel(S.season);
  if (S.inj && S.inj.season===label) return;
  // one hidden unlucky season somewhere between 22 and 29: injury odds double that year, whatever your record
  const cursed = S.badLuckAge!=null && S.age===S.badLuckAge;
  const prone = S.prone ?? 1, ageF2 = injuryAgeFactor(S.age) * (cursed ? 2 : 1);
  const list = [];
  INJ_ORDER.forEach(k=>{ if (Math.random() < clamp(INJ[k].p*prone*ageF2, 0, .9)) list.push(makeInjury(k, "sim")); });
  S.inj = {season:label, list};
  list.filter(i=>i.tier!=="small").forEach(i=>note(i.tier==="major"?"bad":"warn", `Injury: ${i.name}`, `${INJ[i.tier].label}. The medical team expect you to miss about ${Math.round(i.red*100)}% of the ${label} season.${i.tier==="major"?" A long road back.":""}`));
  save();
}
/* ================= MANAGER TRUST =================
   Every club you play for has a manager. Trust (0–100) grows with good seasons and time together, falls with bad ones
   (less so the longer he's known you), and caps how many games he picks you for. Managers get sacked when teams flop. */
const MGR_NAMES = {
  England:[["Gary","Steve","Paul","Mark","Rob","Neil","Chris","Sean","Danny","Lee"],["Walker","Holt","Bennett","Morris","Clarke","Hughes","Parker","Ward","Dixon","Shaw"]],
  Spain:[["Javier","Unai","Pablo","Sergio","Andoni","Míchel","Diego","Iñigo"],["Martínez","Echeverría","Ruiz","Ortega","Navarro","Cano","Vidal","Arrieta"]],
  Germany:[["Thomas","Jens","Markus","Niko","Sebastian","Florian","Uwe","Dirk"],["Krämer","Hoffmann","Brandt","Seidel","Wolf","Lange","Fischer","Becker"]],
  Italy:[["Luca","Stefano","Massimo","Fabio","Claudio","Roberto","Paolo","Davide"],["Rossi","Conti","Gallo","Bianchi","Moretti","Ferri","Marino","Greco"]],
  France:[["Laurent","Didier","Christophe","Rémi","Olivier","Julien","Bruno","Franck"],["Moreau","Girard","Lefèvre","Rousseau","Fontaine","Chevalier","Mercier","Blanc"]],
  Portugal:[["Rui","Nuno","Bruno","Paulo","Vítor","Hugo"],["Silva","Costa","Ferreira","Almeida","Rocha","Pinto"]],
  Netherlands:[["Erik","Ronald","Arne","Peter","Dick","Frank"],["de Boer","Bakker","Visser","Jansen","Smit","Mulder"]],
  Scotland:[["Derek","Stuart","Callum","Craig","Brian","Alan"],["McKenna","Robertson","Fraser","Muir","Kerr","Duncan"]]
};
function newManager(club, trust){
  const [f,l] = MGR_NAMES[TIERS[tierOf(club)].country] || MGR_NAMES.England;
  (S.mgrs ||= {})[club] = {name:pick(f)+" "+pick(l), seasons:0, trust:clamp(Math.round(trust),5,95)};
  return S.mgrs[club];
}
function mgr(club){ club = club || S.club; return (S.mgrs && S.mgrs[club]) || newManager(club, 55 + loyaltyOf(club)/10); }
function trustLabel(t){ return t>=80 ? "Untouchable" : t>=60 ? "Trusted" : t>=45 ? "In the plans" : t>=30 ? "Doubts" : t>=18 ? "Losing faith" : "Frozen out"; }
// share of the season the manager will pick you for
function selectShare(club){ const t = mgr(club).trust; let s = t>=60 ? 1 : t>=45 ? .9 : t>=30 ? .72 : t>=18 ? .5 : .3; if (S.loan && (!club || club===S.club)) s = Math.max(s, .9); return s; }
/* ================= INTERNATIONAL FOOTBALL =================
   Nation strength comes from real squad values: the 48 World Cup 2026 squads (Transfermarkt via Planet Football, July 2026);
   nations that didn't qualify are estimates (est). Making the squad means being top 3 in your position for your country. */
const NATIONS = {
  // name: [confederation, squad value €m, est?]
  "France":["UEFA",1520],"England":["UEFA",1360],"Spain":["UEFA",1220],"Portugal":["UEFA",1010],"Germany":["UEFA",947],"Brazil":["CONMEBOL",928],
  "Argentina":["CONMEBOL",808],"Netherlands":["UEFA",754],"Norway":["UEFA",590],"Belgium":["UEFA",548],"Ivory Coast":["CAF",522],"Senegal":["CAF",478],
  "Turkey":["UEFA",474],"Morocco":["CAF",448],"Sweden":["UEFA",406],"Croatia":["UEFA",387],"United States":["CONCACAF",386],"Ecuador":["CONMEBOL",369],
  "Uruguay":["CONMEBOL",359],"Switzerland":["UEFA",333],"Colombia":["CONMEBOL",302],"United Arab Emirates":["AFC",22],"Oman":["AFC",12],"Bahrain":["AFC",10],"Syria":["AFC",12],"Palestine":["AFC",8],"Thailand":["AFC",14],"Vietnam":["AFC",12],"Indonesia":["AFC",30],"Tajikistan":["AFC",8],"Kyrgyzstan":["AFC",6],"Lebanon":["AFC",6],"North Korea":["AFC",6],"Malaysia":["AFC",9],
  "Gabon":["CAF",30],"Angola":["CAF",22],"Benin":["CAF",15],"Uganda":["CAF",12],"Equatorial Guinea":["CAF",10],"Mozambique":["CAF",8],"Tanzania":["CAF",8],"Sudan":["CAF",6],
  "Honduras":["CONCACAF",15],"El Salvador":["CONCACAF",8],"Guatemala":["CONCACAF",9],"Trinidad and Tobago":["CONCACAF",8],"Suriname":["CONCACAF",14],"Nicaragua":["CONCACAF",4],"Cuba":["CONCACAF",3],"Guadeloupe":["CONCACAF",5],
  "Japan":["AFC",271],"Algeria":["CAF",257],"Austria":["UEFA",245],
  "Ghana":["CAF",235],"Canada":["CONCACAF",199],"Mexico":["CONCACAF",192],"Czech Republic":["UEFA",188],"Scotland":["UEFA",170],"Paraguay":["CONMEBOL",154],
  "Bosnia and Herzegovina":["UEFA",146],"DR Congo":["CAF",144],"South Korea":["AFC",139],"Egypt":["CAF",116],"Uzbekistan":["AFC",85],"Australia":["AFC",77],
  "Tunisia":["CAF",70],"Haiti":["CONCACAF",56],"Cape Verde":["CAF",49],"South Africa":["CAF",49],"Saudi Arabia":["AFC",41],"Panama":["CONCACAF",35],
  "New Zealand":["OFC",34],"Iran":["AFC",32],"Curaçao":["CONCACAF",26],"Iraq":["AFC",21],"Jordan":["AFC",20],"Qatar":["AFC",20],
  // didn't go to the 2026 World Cup: estimated
  "Italy":["UEFA",700,1],"Denmark":["UEFA",420,1],"Nigeria":["CAF",360,1],"Ukraine":["UEFA",280,1],"Serbia":["UEFA",250,1],"Poland":["UEFA",250,1],
  "Cameroon":["CAF",200,1],"Mali":["CAF",150,1],"Greece":["UEFA",150,1],"Georgia":["UEFA",130,1],"Hungary":["UEFA",110,1],"Wales":["UEFA",100,1],
  "Slovakia":["UEFA",100,1],"Romania":["UEFA",100,1],"Slovenia":["UEFA",90,1],"Guinea":["CAF",90,1],"Republic of Ireland":["UEFA",80,1],"Albania":["UEFA",80,1],
  "Burkina Faso":["CAF",80,1],"Chile":["CONMEBOL",80,1],"Venezuela":["CONMEBOL",60,1],"Israel":["UEFA",60,1],"Jamaica":["CONCACAF",45,1],"Peru":["CONMEBOL",40,1],
  "Northern Ireland":["UEFA",40,1],"Iceland":["UEFA",40,1],"Finland":["UEFA",40,1],"Costa Rica":["CONCACAF",30,1],"Zambia":["CAF",25,1],"China":["AFC",20,1],
  "Bolivia":["CONMEBOL",15,1],"India":["AFC",8,1]
};
const NATION_ALIASES = {"uk":"England","united kingdom":"England","great britain":"England","britain":"England","english":"England","usa":"United States","us":"United States","america":"United States","united states of america":"United States",
  "ivory coast":"Ivory Coast","côte d'ivoire":"Ivory Coast","cote d'ivoire":"Ivory Coast","korea":"South Korea","korea republic":"South Korea","czechia":"Czech Republic","holland":"Netherlands",
  "ireland":"Republic of Ireland","bosnia":"Bosnia and Herzegovina","drc":"DR Congo","congo dr":"DR Congo","türkiye":"Turkey","turkiye":"Turkey","scottish":"Scotland","welsh":"Wales","irish":"Republic of Ireland",
  "french":"France","spanish":"Spain","german":"Germany","italian":"Italy","portuguese":"Portugal","brazilian":"Brazil","argentinian":"Argentina","dutch":"Netherlands","nigerian":"Nigeria","ghanaian":"Ghana"};
function nationOf(text){
  const raw = (text||"").trim(); if (!raw) return null;
  const k = raw.toLowerCase(); const name = NATION_ALIASES[k] || Object.keys(NATIONS).find(n=>n.toLowerCase()===k);
  if (name) return {name, conf:NATIONS[name][0], value:NATIONS[name][1], est:!!NATIONS[name][2]};
  return {name:raw, conf:"OTHER", value:15, est:true};
}
const natStrength = v => 60 + 12*Math.log10(Math.max(v,8)/20);
// Tournaments by year. Winter ones fall in January of the season (or Nov–Dec), summer ones after the season ends.
const CONF_CUP = {UEFA:"European Championship", CONMEBOL:"Copa América", CAF:"Africa Cup of Nations", AFC:"Asian Cup", CONCACAF:"Gold Cup"};
function tournamentsIn(year){
  const out = [];
  if (year===2030 || (year>=2038 && (year-2030)%4===0)) out.push({key:"wc", name:`World Cup ${year}`, conf:"ALL", when:"summer", year});
  if (year===2034) out.push({key:"wc", name:"World Cup 2034", conf:"ALL", when:"winter", year, note:"Saudi Arabia; dates not fixed yet, played here as a winter tournament"});
  if (year>=2028 && year%4===0) out.push({key:"euro", name:`Euro ${year}`, conf:"UEFA", when:"summer", year});
  if (year>=2028 && year%4===0) out.push({key:"copa", name:`Copa América ${year}`, conf:"CONMEBOL", when:"summer", year, note: year===2028 ? "not yet confirmed" : null});
  if (year===2027 || year===2028 || (year>2028 && year%4===0)) out.push({key:"afcon", name:`Africa Cup of Nations ${year}`, conf:"CAF", when:"summer", year});
  if (year===2027 || (year>=2032 && year%4===0)) out.push({key:"asian", name:`Asian Cup ${year}`, conf:"AFC", when:"winter", year});
  if (year>=2027 && year%2===1) out.push({key:"gold", name:`Gold Cup ${year}`, conf:"CONCACAF", when:"summer", year});
  return out;
}
const HOSTS = {"euro2028":["England","Scotland","Wales","Republic of Ireland","Northern Ireland"],"euro2032":["Italy","Turkey"],"wc2030":["Spain","Portugal","Morocco","Argentina","Uruguay","Paraguay"],"wc2034":["Saudi Arabia"],"asian2027":["Saudi Arabia"],"copa2028":["Argentina","Brazil","Uruguay","Colombia","Ecuador","Paraguay","Chile","Peru","Venezuela","Bolivia"]};
const TOUR_FMT = {
  wc:{rounds:["Group stage","Round of 32","Round of 16","Quarter-final","Semi-final","Final"], base:70, slots:{UEFA:16,CONMEBOL:6,CAF:9,AFC:8,CONCACAF:6,OFC:1,OTHER:0}, field:{UEFA:55,CONMEBOL:10,CAF:54,AFC:47,CONCACAF:35,OFC:11,OTHER:20}},
  euro:{rounds:["Group stage","Round of 16","Quarter-final","Semi-final","Final"], base:71, slots:24, field:55},
  copa:{rounds:["Group stage","Quarter-final","Semi-final","Final"], base:72, slots:16, field:10},
  afcon:{rounds:["Group stage","Round of 16","Quarter-final","Semi-final","Final"], base:66, slots:24, field:54},
  asian:{rounds:["Group stage","Round of 16","Quarter-final","Semi-final","Final"], base:62, slots:24, field:47},
  gold:{rounds:["Group stage","Quarter-final","Semi-final","Final"], base:60, slots:16, field:35}
};
// rank of each nation within its confederation, by squad value
function confRank(name, conf){ const list = Object.entries(NATIONS).filter(([,v])=>v[0]===conf).sort((a,b)=>b[1][1]-a[1][1]).map(([n])=>n); const i = list.indexOf(name); return i<0 ? list.length+5 : i+1; }
function qualifies(nat, t){
  const hosts = HOSTS[t.key + t.year] || [];
  if (hosts.includes(nat.name)) return true;
  if (t.key==="copa") return nat.conf==="CONMEBOL";
  const F = TOUR_FMT[t.key];
  const slots = typeof F.slots==="object" ? F.slots[nat.conf] ?? 0 : F.slots, field = typeof F.field==="object" ? F.field[nat.conf] ?? 20 : F.field;
  if (!slots) return false;
  const r = nat.conf==="OTHER" ? field : confRank(nat.name, nat.conf);
  const p = clamp(1.15 - r/(slots*1.1), .03, .97);   // the best sides almost always make it; borderline ones sometimes miss
  return Math.random() < p;
}
// where you rank for your country in your position: top 3 makes the squad
function intlRole(nat, valueNow, score){
  if (!nat) return null;
  const avg = nat.value*1e6/26;   // squad value is in €m
  const eff = valueNow / Math.max(.6, POS[S.player.pos].pf) * (.8 + .4*clamp(score ?? .6, 0, 1.2));
  const third = avg*.65, second = avg*1.0, first = avg*1.6;
  if (eff >= first) return "Starter";
  if (eff >= second) return "Bench";
  if (eff >= third) return "Reserve";
  return null;
}
const ROLE_MIN = {Starter:1, Bench:.55, Reserve:.15};
function intlGames(role, games){
  if (!role) return 0;
  if (role==="Starter") return games;
  if (role==="Bench") return Math.min(games, Math.round(games*rnd(.45,.75)));
  return Math.random()<.5 ? Math.min(games, Math.round(games*rnd(.05,.25))) : 0;
}
function intlNumbers(apps, role, quality){
  const p = POS[S.player.pos], m = role==="Starter" ? 1 : role==="Bench" ? .4 : .25;
  let g=0,a=0,cs=0;
  for (let i=0;i<apps;i++){
    if (Math.random() < p.exp*.42*m*quality) g++;
    if (Math.random() < Math.max(.05, p.exp*.3+p.w*.1)*m*quality) a++;
    if (DEF.includes(S.player.pos) && role==="Starter" && Math.random()<.33) cs++;
  }
  return {g,a,cs};
}
function addCaps(apps, n){ S.intl ||= {caps:0,g:0,a:0,cs:0,tours:[]}; S.intl.caps += apps; S.intl.g += n.g; S.intl.a += n.a; S.intl.cs += n.cs; }
function intlAnswer(id){ const n = (S.notes||[]).find(x=>x.ask && x.ask.id===id); return n ? n.ask.answer : null; }
// at the start of each season: emails for the friendlies and any tournament this season
function scheduleIntl(){
  const nat = nationOf(S.player.nation); if (!nat) return;
  const y = S.season + 1, label = seasonLabel(S.season);
  const ask = (id, title, text) => { if ((S.notes||[]).some(x=>x.ask && x.ask.id===id)) return; (S.notes ||= []).push({season:label, kind:"club", title, text, ask:{id, answer:null}}); };
  ask(`fr-${label}`, `${nat.name}: international friendlies`, `${nat.name} want to know if you're available for this season's international friendlies (autumn and spring). You'll only be picked if you're in the top three in your position. If you don't reply, you'll be counted as available.`);
  tournamentsIn(y).filter(t=>t.conf==="ALL" || t.conf===nat.conf).forEach(t=>{
    ask(`t-${t.key}-${t.year}`, `${t.name}: are you available?`, `${t.name} ${t.when==="winter"?"takes place during the season, in the middle of the club campaign":"is next summer"}${t.note?` (${t.note})`:""}. ${nat.name} need to know if you'll make yourself available, should they qualify and pick you. If you don't reply, you'll be counted as available.`);
  });
}
function friendlies(part, score){
  const nat = nationOf(S.player.nation); if (!nat) return null;
  const label = seasonLabel(S.season);
  if (intlAnswer(`fr-${label}`)===false) return null;
  const role = intlRole(nat, S.value, score);
  if (!role){ if (part==="autumn") note("info", `Not in the ${nat.name} squad`, `${nat.name} named their squad for the autumn friendlies. You're not one of the top three in your position yet.`); return null; }
  const games = part==="autumn" ? 3 + (Math.random()<.5?1:0) : 2 + (Math.random()<.5?1:0);
  const apps = intlGames(role, games), n = intlNumbers(apps, role, clamp(score ?? .6, .3, 1.2));
  addCaps(apps, n);
  note("good", `${nat.name} ${part} friendlies`, `Called up as a ${role.toLowerCase()}${role==="Starter"?"":role==="Bench"?" (coming off the bench)":" (squad reserve)"}: ${apps} cap${apps===1?"":"s"}, ${n.g} goal${n.g===1?"":"s"}, ${n.a} assist${n.a===1?"":"s"}. Total caps: ${S.intl.caps}.`);
  return {role, apps, ...n};
}
function prepareTournament(t, score){
  const nat = nationOf(S.player.nation); if (!nat) return null;
  if (intlAnswer(`t-${t.key}-${t.year}`)===false){ note("info", t.name, `You made yourself unavailable for ${t.name}.`); return null; }
  if (!qualifies(nat, t)){ note("info", `${nat.name} miss out on ${t.name}`, `${nat.name} didn't qualify for ${t.name}.`); return null; }
  const role = intlRole(nat, S.value, score);
  if (!role){
    // you're not in the squad: the team's run is simulated without you
    const F = TOUR_FMT[t.key], r = runTourney(t, natStrength(nat.value), 0);
    note("info", `${t.name}: not selected`, `${nat.name} ${r.won?"won":"reached the "+r.reached.toLowerCase()+" of"} ${t.name}, but you weren't in the squad: you're not in the top three in your position.`);
    return null;
  }
  note("good", `Selected for ${t.name}`, `${nat.name} have named you in their squad as a ${role.toLowerCase()}. The tournament is played ${t.when==="winter" ? "in the middle of the season, before the January window" : "before the summer transfer window opens"}.`);
  return {key:t.key, name:t.name, year:t.year, conf:t.conf, nation:nat.name, role, str:natStrength(nat.value)};
}
// the team's run; your appearances prove how far they got at least
function runTourney(t, str, need){
  const F = TOUR_FMT[t.key];
  let gp = 0; for (let k=0;k<3;k++) gp += match(str, F.base - 4 + gauss()*4);
  let games = 3, stage = 0, won = false;
  const through = need>3 || gp>=4 || (gp===3 && Math.random()<.5);
  if (through){
    for (stage=1; stage<F.rounds.length; stage++){
      games++;
      const forced = need > games;
      if (!forced && !tie(str, F.base + stage*2 + gauss()*3, 1)) break;
    }
    if (stage===F.rounds.length){ won = true; stage = F.rounds.length-1; }
  }
  const reached = won ? "Winners" : stage===0 ? "Group stage" : F.rounds[stage]==="Final" ? "Runners-up" : F.rounds[stage];
  return {games, won, reached, maxGames: 3 + F.rounds.length - 1};
}
const tourMax = key => 3 + TOUR_FMT[key].rounds.length - 1;
function tournamentPanel(){
  const T = S.tourney, showCS = DEF.includes(S.player.pos), max = tourMax(T.key), P = tGet();
  const roleHint = T.role==="Starter" ? "You're a starter: you'd expect to play every game." : T.role==="Bench" ? "You're on the bench: expect to come on in most games." : "You're a squad reserve: minutes will be hard to come by.";
  // with the Editor pen, before a ball's kicked, you can type in your own numbers instead
  const form = penOwned() && !P.mine.length ? `<details class="t-hand"><summary>${PEN_IC("pen-ic tiny")} Enter your own numbers instead</summary><form id="tourForm" class="col" style="gap:14px;margin-top:14px">
      <div class="statgrid sheet"><div class="statrow sheet-h" style="--cols:${showCS?4:3}" aria-hidden="true"><span>Tournament</span><span>Apps</span><span>Goals</span><span>Assists</span>${showCS?`<span>Clean sh.</span>`:""}</div><div class="statrow" style="--cols:${showCS?4:3}">
        <div class="cname">${esc(T.name)}<small>up to ${max} games</small></div>
        <div class="field"><label for="tr-apps">Apps</label><input id="tr-apps" type="number" min="0" max="${max}" inputmode="numeric" value="0"></div>
        <div class="field"><label for="tr-g">Goals</label><input id="tr-g" type="number" min="0" inputmode="numeric" value="0"></div>
        <div class="field"><label for="tr-a">Assists</label><input id="tr-a" type="number" min="0" inputmode="numeric" value="0"></div>
        ${showCS?`<div class="field"><label for="tr-cs">Clean sh.</label><input id="tr-cs" type="number" min="0" inputmode="numeric" value="0"></div>`:""}
      </div></div>
      <div class="row"><button class="btn primary" type="submit">Save my numbers</button><span class="err" id="tourErr" role="alert"></span></div>
    </form></details>` : "";
  return `<section class="panel pop win-tourney" id="actionPanel">
    <div class="win-tag">★ ${esc(T.name)}</div>
    <h2>${esc(T.nation)} · ${esc(T.role)}</h2>
    ${tPanelHTML(T, roleHint)}
    ${form}
  </section>`;
}
// your own numbers for the tournament, typed in (with the Editor pen); without it the tournament's played out instead
function submitTournament(){
  const T = S.tourney, max = tourMax(T.key), err = $("#tourErr");
  if (!penOwned()) return tSimRest();
  const v = id => { const el = $("#"+id); return el ? +el.value.trim() : 0; };
  const st = {apps:v("tr-apps"), g:v("tr-g"), a:v("tr-a"), cs:v("tr-cs")};
  if ([st.apps,st.g,st.a,st.cs].some(n=>!Number.isInteger(n)||n<0)){ err.textContent = "Use whole numbers of 0 or more."; return; }
  if (st.apps>max){ err.textContent = `${T.name} has at most ${max} games.`; return; }
  if (st.cs>st.apps){ err.textContent = "Clean sheets can't be more than appearances."; return; }
  if (!st.apps && (st.g||st.a)){ err.textContent = "Goals or assists need at least one appearance."; return; }
  const perfBoost = T.role==="Starter" ? clamp(((st.g+st.a)/Math.max(1,st.apps) - .4)*3, -1, 2.5) : 0;
  tourDone(T, st, runTourney(T, T.str + perfBoost, st.apps));
}
// the tournament's over (played out in tournament.js, or typed in): caps, a medal, your value and the Ballon d'Or.
// winner: who won it, when it wasn't you
function tourDone(T, st, run, winner){
  addCaps(st.apps, st);
  const rec = {name:T.name, year:T.year, nation:T.nation, role:T.role, apps:st.apps, g:st.g, a:st.a, result:run.reached};
  (S.intl.tours ||= []).push(rec);
  const label = seasonLabel(S.season), trophyName = T.key==="wc" ? "World Cup" : CONF_CUP[T.conf];
  const medal = run.won && st.apps>0;
  if (medal) S.trophies.push({name:trophyName, kind:"intl", season:label, club:T.nation});
  note(run.won?"good":"info", `${T.name}: ${run.won?`${T.nation} are champions!`:`${T.nation} ${run.reached==="Runners-up"?"lose in the final":run.reached==="Group stage"?"go out in the group stage":"out in the "+run.reached.toLowerCase()}`}`,
    `${st.apps} game${st.apps===1?"":"s"}, ${st.g} goal${st.g===1?"":"s"}, ${st.a} assist${st.a===1?"":"s"} as a ${T.role.toLowerCase()}.${medal?" A winner's medal is in your trophy cabinet.":run.won?" You didn't get on the pitch, so there's no medal.":""}${winner ? ` ${winner} won it.` : ""}`);
  // a big tournament moves your value
  const bump = clamp(.015*(st.g+st.a) + (medal ? .08 : run.reached==="Runners-up" ? .04 : 0) - (st.apps>=3 && st.g+st.a===0 && T.role==="Starter" ? .04 : 0), -.06, .25);
  S.value = roundTM(S.value*(1+bump));
  // one played in the middle of the season counts towards its awards and the Ballon d'Or at the end of it, and you're
  // back with your club a few weeks into the second half
  if (T.winter){
    (S.seasonIntl ||= []).push({...rec, won:medal, key:T.key}); S.intlAway = .85;
    S.tourney = null; S.phase = "winter"; tab = "season";
    save(); recordCareer(); render();
    $("#actionPanel")?.scrollIntoView({behavior:"smooth", block:"start"});
    return;
  }
  const last = S.history[S.history.length-1]; if (last){ last.after = S.value; }
  // now the Ballon d'Or, with the tournament counted
  const B = T.bd, wonAll = B.won.concat(medal ? [{name:trophyName, kind:"intl"}] : []);
  const totAll = {apps:B.tot.apps+st.apps, g:B.tot.g+st.g, a:B.tot.a+st.a, cs:(B.tot.cs||0)+st.cs};
  let rank = worldRank(S.value, B.score);
  const bdor = ballonRank(rank, wonAll, totAll, S.player.pos, B.tier, B.comps, S.sim, B.age);
  if (bdor) rank = Math.min(rank, Math.max(1, Math.round(bdor*1.3)));
  const hNow = S.history[S.history.length-1];
  if (hNow && hNow.review){ hNow.review.world.rank = rank; hNow.review.world.bdor = bdor; }
  if (bdor===1){ S.trophies.push({name:"Ballon d'Or", kind:"ballon", season:label, club:hNow?hNow.club:S.club}); if (hNow) hNow.trophies.push("Ballon d'Or"); S.pending.won.push({name:"Ballon d'Or", kind:"ballon"}); }
  if (bdor) note(bdor===1?"good":"info", bdor===1?"You've won the Ballon d'Or!":`Ballon d'Or: ${ord(bdor)} place`, bdor===1?`Your season and ${T.name} made you the best player in the world.`:`You finished ${ord(bdor)} in the Ballon d'Or voting, with ${T.name} counted.`);
  if (medal) S.pending.won.push({name:trophyName, kind:"intl"});
  S.pending.tour = {...rec, won:medal};
  if (bump>.03 && S.pending.offerOpts) S.pending.offers = genOffers(S.pending.pf, S.pending.offerOpts);
  S.tourney = null; S.phase = "window"; tab = "season";
  save(); recordCareer(); render();
  $("#actionPanel")?.scrollIntoView({behavior:"smooth", block:"start"});
}
function intlPanel(){
  const nat = nationOf(S.player.nation), I = S.intl || {caps:0,g:0,a:0,cs:0,tours:[]};
  const role = nat ? intlRole(nat, S.value, (S.history.at(-1)||{}).score ?? .6) : null;
  const up = [S.season+1, S.season+2, S.season+3, S.season+4].flatMap(y=>tournamentsIn(y)).filter(t=>nat && (t.conf==="ALL"||t.conf===nat.conf));
  return `<section class="panel"><h2>International</h2>
    ${nat?`<p class="hint">${esc(nat.name)} · ${esc(nat.conf==="OTHER"?"no confederation data":nat.conf)} · squad strength ${money(nat.value*1e6)}${nat.est?" (estimate)":""}. Right now you'd be <strong>${role?role.toLowerCase():"outside the squad"}</strong> in your position.</p>`:`<p class="empty">Set a nationality to play international football.</p>`}
    <div class="totals" style="margin-top:10px">
      <div class="total"><div class="label">Caps</div><div class="v">${I.caps}</div></div>
      <div class="total"><div class="label">Goals</div><div class="v">${I.g}</div></div>
      <div class="total"><div class="label">Assists</div><div class="v">${I.a}</div></div>
      ${DEF.includes(S.player.pos)?`<div class="total"><div class="label">Clean sheets</div><div class="v">${I.cs}</div></div>`:""}
      <div class="total"><div class="label">Tournaments</div><div class="v">${I.tours.length}</div></div>
    </div>
    ${I.tours.length?`<div class="tablewrap" style="margin-top:12px"><table class="rt" style="min-width:480px"><thead><tr><th>Tournament</th><th>Role</th><th class="n">Apps</th><th class="n">Goals</th><th class="n">Assists</th><th>Result</th></tr></thead><tbody>
      ${I.tours.slice().reverse().map(r=>`<tr><td class="lead">${esc(r.name)}</td><td class="sea">${esc(r.role)}</td><td class="n" data-l="Apps">${r.apps}</td><td class="n" data-l="Goals">${r.g}</td><td class="n" data-l="Assists">${r.a}</td><td class="res" data-l="Result">${esc(r.result)}</td></tr>`).join("")}</tbody></table></div>`:""}
    ${up.length?`<h3>Coming up</h3><ul class="hint" style="margin:0;padding-left:18px">${up.map(t=>`<li>${esc(t.name)}${t.when==="winter"?" (mid-season)":" (summer)"}${t.note?` · ${esc(t.note)}`:""}</li>`).join("")}</ul>`:""}
  </section>`;
}

function hNowClub(){ return S.history.length ? S.history[S.history.length-1].club : S.club; }
function availability(){ if (S.inj) S.inj.list = S.inj.list.filter(i=>i.by!=="user"); return (S.inj && S.inj.season===seasonLabel(S.season) ? S.inj.list : []).reduce((a,i)=>a*(1-i.red), 1); }
// how much of a season a player is expected to play at each age while breaking through
// Summer 2026 gross transfer spend in €m. Premier League, La Liga and Serie A's top five are real figures (Transfermarkt via SI,
// Football Benchmark, AfricaSoccer, World Soccer Talk). Bundesliga (~€600m total) and Ligue 1 (~€800m) aren't published by club,
// so those are estimates split by club size, marked est.
const SPEND_2026 = {
  "Manchester City":531,"Chelsea":405,"Tottenham Hotspur":350,"Newcastle United":311,"Aston Villa":297,"Liverpool":230,"Arsenal":225,
  "Ipswich Town":221,"Brighton & Hove Albion":179,"Hull City":175,"Manchester United":172,"Coventry City":146,"Nottingham Forest":136,
  "Brentford":123,"Everton":102,"Fulham":102,"Leeds United":99,"Crystal Palace":85,"Bournemouth":80,"Sunderland":76,
  "Real Madrid":225,"Barcelona":184,"Atlético Madrid":123,"Real Betis":30.5,"Deportivo A Coruña":26,"Elche":23.25,"Racing Santander":20.5,
  "Getafe":19.5,"Villarreal":16.5,"Sevilla":15.5,"Alavés":13,"Celta Vigo":11.8,"Rayo Vallecano":10.3,"Valencia":9,"Real Sociedad":8.5,
  "Osasuna":8,"Espanyol":5.6,"Levante":5.1,"Málaga":.3,"Athletic Club":0,
  "AC Milan":165,"Juventus":164,"Fiorentina":150,"Roma":124.5,"Inter":101
};
const SPEND_EST = {
  "Napoli":90,"Como":85,"Atalanta":70,"Bologna":45,"Lazio":30,"Torino":25,"Genoa":20,"Parma":20,"Sassuolo":18,"Udinese":15,"Cagliari":12,"Lecce":10,"Venezia":15,"Frosinone":10,"Monza":15,
  "Bayern Munich":130,"Borussia Dortmund":90,"RB Leipzig":85,"Bayer Leverkusen":80,"VfB Stuttgart":50,"Eintracht Frankfurt":45,"SC Freiburg":20,"TSG Hoffenheim":20,
  "Borussia Mönchengladbach":15,"Werder Bremen":12,"Mainz 05":12,"FC Augsburg":10,"Union Berlin":10,"Hamburger SV":15,"1. FC Köln":10,"Schalke 04":8,"SV Elversberg":3,"SC Paderborn":3,
  "Paris Saint-Germain":200,"Marseille":110,"Monaco":80,"Paris FC":70,"Lyon":60,"Strasbourg":50,"Lille":45,"Rennes":45,"Lens":40,"Nice":30,"Toulouse":15,"Brest":12,"Auxerre":8,"Lorient":8,"Angers":6,"Le Havre":6,"Troyes":5,"Le Mans":4
};
// league formula for clubs without published figures (Championship down, Portugal, Netherlands, Scotland, second tiers)
function formulaBudget(club, t){ return TIERS[t].ceil * 1.2 * Math.pow(clamp(repOf(club, t), .45, 1.05), 3); }
// the biggest single fee a club will pay: about 38% of its summer spend (City spent €526m with a top fee of €145m),
// never far below what a club of its size in that league could raise, and it moves with the club's fortunes
function budgetOf(club, t){
  t = t ?? tierOf(club);
  const sp = SPEND_2026[club] ?? SPEND_EST[club];
  const f = formulaBudget(club, t);
  if (sp == null) return f;
  const fortune = clamp(repOf(club, t) / Math.max(.5, meta(club).r), .6, 1.5);
  return Math.max(sp*1e6*.38, f*.7) * fortune;
}
// breakthrough leniency only lasts until you've established yourself as a regular
function judgedAge(){ return S.established ? Math.max(S.age, 24) : S.age; }
function expectShare(age){ return age<=17 ? .25 : age<=19 ? .45 : age<=21 ? .65 : age<=23 ? .85 : 1; }
// pressure from a big transfer fee: higher fee for the league = higher expectations, fading over three seasons
function pressure(){
  const f = S.feePaid; if (!f || f.club!==S.club || !f.fee) return 0;
  const T = TIERS[tierOf(S.club)];
  return +(clamp(f.fee/(T.ceil*.45), 0, 1.6) * Math.max(0, 1 - f.seasons*.3)).toFixed(2);
}
function pressureLabel(p){ return p>=1 ? "Huge" : p>=.6 ? "High" : p>=.3 ? "Some" : "Low"; }
function standing(n){ const t = tierOf(n); return TIERS[t].pr * repOf(n, t); }
/* 3.1: life off the pitch. As your name grows, brands come calling: a boot deal that pays every year on top of your wage.
   The bigger your value, the bigger the brand; a strong season brings an upgrade, and a deal runs for three years. */
const SPONSORS = [{n:"Northgate Sports", min:4e5, pay:15e3, t:"a local boot deal"}, {n:"Kestrel", min:4e6, pay:120e3, t:"a national boot deal"}, {n:"Vanta Athletic", min:25e6, pay:1.2e6, t:"a major boot deal"}, {n:"Apex One", min:70e6, pay:6e6, t:"a global signature boot deal"}];
function sponsorCheck(pf){
  if (S.phase==="retired") return;
  const cur = S.spons, lvl = SPONSORS.reduce((b, x, i)=>S.value>=x.min ? i : b, -1);
  if (cur){ S.earnings += cur.pay; if (cur.until<=S.season) { S.spons = null; if (lvl<0) note("info", `${cur.n} deal ends`, `Your boot deal with ${cur.n} has run its course and won't be renewed.`); } }
  if (lvl<0) return;
  const now = S.spons ? SPONSORS.findIndex(x=>x.n===S.spons.n) : -1;
  if (lvl>now && (now<0 || (pf && pf.score>.55))){ const X = SPONSORS[lvl]; S.spons = {n:X.n, pay:X.pay, until:S.season + 3};
    note("good", `${X.n}: ${X.t}`, `${X.n} have signed you to ${X.t}, worth ${gbp(X.pay)} a year for three years on top of your wage.${now>=0 ? " It replaces your old deal." : ""}`); }
}
function note(kind, title, text){ (S.notes ||= []).push({season:seasonLabel(S.season), kind, title, text}); }
// contract length on offer shrinks as you age
function yearsFor(age){ return age<=23? [3,5] : age<=27? [2,5] : age<=29? [2,4] : age<=31? [1,3] : age<=33? [1,2] : [1,1]; }
// does the club want to sell you this summer?
// loyalty (0–100) builds with every good season, trophy and new deal at a club
function loyaltyOf(club){ return (S.loyalty||{})[club] || 0; }
const LOYAL = [[80,"Club legend"],[60,"Fan favourite"],[40,"Trusted"],[20,"Settled"],[0,"New arrival"]];
function loyaltyLevel(v){ return LOYAL.find(([min])=>v>=min)[1]; }
function addLoyalty(club, d, why){
  S.loyalty ||= {};
  const before = loyaltyOf(club), after = clamp(Math.round(before + d), 0, 100);
  S.loyalty[club] = after;
  if (loyaltyLevel(after)!==loyaltyLevel(before) && after>before)
    note("good", `${loyaltyLevel(after)} at ${club}`, `${why ? why+" " : ""}Your loyalty with ${club} is now ${after}/100. The club will stand by you through a bad patch, value you more at the negotiating table and treat you better as you get older.`);
  return after;
}
// bad seasons in a row before the club gives up on you
function patience(club, score){ const L = loyaltyOf(club); if (score!=null && score<.3) return 2; return L>=70 ? 4 : L>=40 ? 3 : 2; }
function saleIntent(club, pf, age){
  const t = tierOf(club), m = clubModel(club), T = TIERS[t];
  if (T.pool) return null;
  const sc = pf.score * clamp((pf.time ?? 1)*1.3, .3, 1);
  if (age<=25 && sc>.75){
    const pBig = S.value > T.ceil*.12 ? 1 : .5;
    const keep = 1 - loyaltyOf(club)/130;
    if (m.k==="seller" && Math.random() < .65*pBig*keep) return "cashin";
    if (m.k==="steady" && T.pr<.9 && S.value > T.ceil*.3 && Math.random() < .35*keep) return "cashin";
  }
  let pOld = clamp((age-28)*.12 + (m.k==="elite"?.15:0) - (sc-.7)*.4, 0, .85) * (1 - loyaltyOf(club)/120);
  if (age>=29 && Math.random() < pOld) return "makeway";
  return null;
}
function newState(player, age, clubName, years, custom, value){
  S = {v:3, id:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6), customClubs: custom?[custom]:[], player, age, club:clubName, years, season:2026, value, startValue:value,
    world:null, records:{}, history:[], log:[], trophies:[], earnings:0, phase:"preview", sim:null, pending:null};
  S.world = buildWorld(custom);
  S.wage = wageFor(value, clubName, tierOf(clubName), age); S.phase = "stats"; S.prone = 1; S.established = age>=24; S.mgrs = {}; newManager(clubName, 60); S.intl = {caps:0,g:0,a:0,cs:0,tours:[]}; S.badLuckAge = pickBadLuckAge(age);
  S.log.push({season:seasonLabel(2026), text:`Signed for ${clubName} (${TIERS[tierOf(clubName)].name}) on ${wageTxt(S.wage)}`, fee:null});
  S.notes = []; S.notesSeen = 0;
  note("club", `Welcome to ${clubName}`, `You've signed a ${years}-year deal on ${wageTxt(S.wage)}. ${clubModel(clubName).text}`);
  scheduleIntl();
  return S;
}

/* ================= SEASON FLOW ================= */
// a season's numbers. From the match centre also: mins (minutes played) and of (the team's minutes while you were
// there), rs and rn (the total of your match ratings and how many there were) and potm (Player of the Match awards)
const EXTRA = ["mins","of","rs","rn","potm","yc","rc"];
function totOf(comps){ const t = {apps:0,g:0,a:0,cs:0,mins:0,of:0,rs:0,rn:0,potm:0}; Object.values(comps||{}).forEach(c=>{ t.apps+=c.apps; t.g+=c.g; t.a+=c.a; t.cs+=(c.cs||0); EXTRA.forEach(k=>{ t[k] += c[k] || 0; }); }); t.rs = +t.rs.toFixed(1); return t; }
function mergeComps(a, b){ const out = {}; [a||{}, b||{}].forEach(x=>Object.entries(x).forEach(([k,c])=>{ const o = out[k] ||= {apps:0,g:0,a:0,cs:0,mins:0,of:0,rs:0,rn:0,potm:0,code:c.code||k}; o.apps+=c.apps; o.g+=c.g; o.a+=c.a; o.cs+=(c.cs||0); EXTRA.forEach(e=>{ o[e] += c[e] || 0; }); })); return out; }
const minsPct = t => t && t.of ? Math.round(t.mins/t.of*100) + "%" : "–";
const avgRating = t => t && t.rn ? t.rs/t.rn : null;
const halfOf = () => (S.half===2 ? 2 : 1);
function submitSeason(){
  const comps = readStatsForm(currentPlan()); if (comps) applyHalf(comps);
}
// a finished half-season, from the manual form or the match centre
function applyHalf(comps){
  if (halfOf()===1 && !S.sim){ midSeason(comps); return; }
  let full = comps, janFrom = null;
  if (S.h1){ if (S.h1.club===S.club) full = mergeComps(S.h1.comps, comps); else janFrom = S.h1; }
  finishSeason(full, janFrom);
}
function readStatsForm(plan){
  const comps = {}, err = $("#seasonErr");
  for (const c of plan){
    const v = id => { const el = $("#"+id); return el ? el.value.trim() : "0"; };
    const o = {apps:+v(`s-${c.code}-apps`), g:+v(`s-${c.code}-g`), a:+v(`s-${c.code}-a`), cs:+v(`s-${c.code}-cs`), code:c.code};
    if ([o.apps,o.g,o.a,o.cs].some(n=>!Number.isInteger(n)||n<0)){ err.textContent=`${c.name}: use whole numbers of 0 or more.`; return; }
    if (o.apps>c.max){ err.textContent = c.full ? `${c.name}: you can play at most ${c.max} games ${halfOf()===1?"before January":"from January to May"}${availability()<.999||selectShare()<1?` (${[availability()<.999?"injuries":"", selectShare()<1?"the manager's selection":""].filter(Boolean).join(" and ")})`:""}.` : `${c.name}: the most games possible is ${c.max}, so ${o.apps} appearances can't be right.`; return; }
    if (o.cs>o.apps){ err.textContent=`${c.name}: clean sheets can't be more than appearances.`; return; }
    if (o.apps===0 && (o.g||o.a)){ err.textContent=`${c.name}: goals or assists need at least one appearance.`; return; }
    comps[c.code] = o;
  }
  return comps;
}
function finishSeason(comps, janFrom){
  const legacy = S.sim;
  const sim = legacy || simSeason(comps);
  S.sim = sim;
  const allComps = janFrom ? mergeComps(janFrom.comps, comps) : comps;

  const tot = totOf(allComps);
  const prev = S.value, age = S.age, yearsLeft = S.years - 1;
  const teamPct = 1 - (sim.pos-1)/Math.max(1, sim.n-1);
  const fitAvail = availability(), sel = S.h1 && S.h1.sel!=null ? (S.h1.sel + selectShare())/2 : selectShare(), avail = fitAvail*sel, injuries = (S.inj && S.inj.season===sim.season) ? S.inj.list.slice() : [];
  const M = mgr(), trust0 = M.trust;
  const pr = pressure();
  const pf = perf(allComps, teamPct, S.player.pos, avail, judgedAge());
  const team = teamFactor(sim);
  const tgt = valuation({age, pos:S.player.pos, clubName:S.club, tier:sim.tier, years:yearsLeft, pf, team});
  const injHit = injuries.some(i=>i.tier==="major") ? .82 : injuries.some(i=>i.tier==="medium") ? .93 : 1;
  let raw = (.3*prev + .7*tgt.value) * (.85 + .15*sel);
  if (injHit<1) raw = Math.min(raw, prev*1.05);
  const newVal = roundTM(raw * injHit);

  const won = [], T = TIERS[sim.tier];
  sim.comps.forEach(c=>{
    if (!comps[c.code] || comps[c.code].apps<1) return;
    if (c.code==="league"){
      if (c.won) won.push({name:T.title, kind:"league"});
      else if (c.po==="won") won.push({name:`${T.name} play-off final`, kind:"playoff"});
    } else if (c.won) won.push({name:c.name, kind: ["UCL","UEL","UECL"].includes(c.code) ? "europe" : "cup"});
  });
  // the Golden Boot and Playmaker go to the league's real leaders when the league was played out in the match centre
  const lg = comps.league, gScale = T.games/38, LL = lgGet(sim.tier);
  if (lg && (LL ? lgTop(LL, "g") : lg.g >= Math.round(rnd(20,26)*gScale*.9))) won.push({name:`${T.short} Golden Boot`, kind:"boot"});
  if (lg && (LL ? lgTop(LL, "a") : lg.a >= Math.round(rnd(11,15)*gScale*.9)) && POS[S.player.pos].exp>0) won.push({name:`${T.short} Playmaker`, kind:"medal"});
  if (LL) lgSeasonNote(LL, sim.tier);
  if (LL){
    // the season's awards go to the league's best average ratings (league.js)
    const aw = lgAwards(LL);
    if (aw.pots && aw.pots.me) won.push({name:`${T.short} Player of the Season`, kind:"medal"});
    else if (aw.ypots && aw.ypots.me) won.push({name:`${T.short} Young Player of the Season`, kind:"medal"});
    if (aw.tots.some(p=>p.me)) won.push({name:`${T.short} Team of the Season`, kind:"medal"});
  }
  else if (lg && lg.apps>=Math.round(28*gScale) && pf.score>=1.05 && Math.random()<.65) won.push({name:`${T.short} Player of the Season`, kind:"medal"});
  else if (lg && age<=23 && lg.apps>=Math.round(24*gScale) && pf.score>=.92 && Math.random()<.6) won.push({name:`${T.short} Young Player of the Season`, kind:"medal"});
  won.forEach(w=>S.trophies.push({...w, season:sim.season, club:S.club}));

  S.earnings += janFrom ? (janFrom.wage*26 + S.wage*26) : S.wage*52;
  if (janFrom){
    // the first half of the season, at the club you left in January
    const tb = sim.tables[janFrom.tier], row = tb ? tb.findIndex(r=>r.n===janFrom.club) : -1, lgA = janFrom.comps.league;
    const aTro = [];
    if (row===0 && lgA && lgA.apps>=5 && !TIERS[janFrom.tier].pool){ const w = {name:TIERS[janFrom.tier].title, kind:"league"}; aTro.push(w.name); S.trophies.push({...w, season:sim.season, club:janFrom.club}); won.push(w); }
    S.history.push({season:sim.season, age, club:janFrom.club, tier:janFrom.tier, comps:janFrom.comps, tot:totOf(janFrom.comps), before:janFrom.value0 ?? prev, after:janFrom.value ?? prev,
      score:janFrom.pf, wage:janFrom.wage, half:"Aug–Dec", loan:!!janFrom.loan, injuries:[], trophies:aTro,
      finish: row>=0 ? {pos:row+1, n:tb.length, tier:janFrom.tier, outcome:"Left in January"} : null,
      results:[{code:"league", name:TIERS[janFrom.tier].name, res: row>=0 ? ord(row+1) : "—"}]});
  }
  S.history.push({season:sim.season, age, club:S.club, tier:sim.tier, comps, tot: janFrom ? totOf(comps) : tot, half: janFrom ? "Jan–May" : null, before:prev, after:newVal, score:pf.score, wage:S.wage,
    finish:{pos:sim.pos, n:sim.n, tier:sim.tier, outcome:sim.comps[0].outcome}, trophies:won.map(w=>w.name),
    results: sim.comps.map(c=>({code:c.code, name:c.name, res: c.code==="league" ? `${ord(sim.pos)}` : c.won ? "Winners" : c.reached})), loan: !!S.loan, injuries, pressure:pr});
  // injury proneness: every injury adds to it, an injury-free season brings it down
  S.prone = injuries.length ? clamp((S.prone ?? 1) + injuries.reduce((a,i)=>a+INJ[i.tier].add,0), .6, 4) : Math.max(.6, (S.prone ?? 1)*.82);
  if (!S.loan && S.feePaid && S.feePaid.club===S.club) S.feePaid.seasons++;
  S.value = newVal; S.years = yearsLeft;
  const share = ((allComps.league&&allComps.league.apps)||0)/T.games;
  const adjShare = ((allComps.league&&allComps.league.apps)||0)/Math.max(1, T.games*avail);
  const youth = age<=21 && !S.established;
  // young players are judged gently; a big fee raises the bar; long injuries don't count against you
  const badCut = (youth ? .3 : .45) + .15*pr;
  const injuredOut = fitAvail < .4;
  const bad = !injuredOut && (pf.score < badCut || (age >= 22 && adjShare < .35) || (age>=20 && age<=21 && adjShare < .12));
  // the manager's verdict: good seasons and time together build trust; bad seasons cost it, less so after years together
  if (!injuredOut){
    // time together softens one bad season; a run of them wears even a long relationship down
    const run = bad ? (S.badStreak||0) + 1 : 0;
    let d = pf.score>.85 ? 14 : pf.score>.6 ? 7 : !bad ? 1 : -(20 - Math.min(8, M.seasons*2)) * (1 + .5*(run-1));
    if (youth && d<0) d = Math.round(d/2);
    if (S.h1) d *= .6;   // the January review already counted the first half
    M.trust = clamp(Math.round(M.trust + d), 5, 100);
  }
  M.seasons++;
  const tl0 = trustLabel(trust0), tl1 = trustLabel(M.trust);
  if (tl0!==tl1){
    if (M.trust < trust0) note(M.trust<30?"bad":"warn", `${M.name}: ${tl1.toLowerCase()}`, M.trust<30 ? `The manager has lost faith in you. Expect to be picked for only about ${Math.round(selectShare()*100)}% of games next season unless something changes.` : `The manager has doubts after that season. You'll have to fight for your place: about ${Math.round(selectShare()*100)}% of games next season.`);
    else note("good", `${M.name}: ${tl1.toLowerCase()}`, `The manager's trust in you is growing. ${M.trust>=60?"You're one of the first names on his teamsheet.":""}`);
  }
  // managers get sacked when the team flops, and sometimes just move on
  const flop = sim.moved==="down" || (sim.n && sim.pos > Math.ceil(sim.n*.75) && isTop(sim.tier));
  if (Math.random() < (flop ? .55 : .1)){
    const old = M.name, nm = newManager(hNowClub(), 45 + loyaltyOf(hNowClub())/8 + (pf.score>.85?10:0));
    note("club", `${old} leaves ${hNowClub()}`, `${flop?"After a poor season the club have sacked the manager.":"The manager has moved on."} ${nm.name} takes over, and you'll have to win him over: he starts with ${trustLabel(nm.trust).toLowerCase()} trust in you.`);
  }
  let loanEnded = null, warn = false, stoodBy = false, patNow = null;
  if (S.loan){
    loanEnded = S.club; S.club = S.loan.parent; S.loan = null;
    if (!bad) S.badStreak = 0;
    S.log.push({season:sim.season, text:`Loan at ${loanEnded} ended, back at ${S.club}`, fee:null});
  } else {
    const L0 = loyaltyOf(S.club); patNow = patience(S.club, pf.score);
    S.badStreak = bad ? (S.badStreak||0) + 1 : 0;
    warn = bad && !youth && S.badStreak < patNow && S.badStreak===patNow-1;
    stoodBy = bad && L0>=40 && pf.score>=.3 && S.badStreak < patNow;
    const teamWins = won.filter(w=>!["boot","medal"].includes(w.kind)).length;
    const gain = (share>=.3 ? 7 : 2) + (pf.score>.95?10:pf.score>.75?6:pf.score>.55?2:-5) + teamWins*5 + (sim.moved==="up"?4:0);
    addLoyalty(S.club, gain, teamWins ? "Silverware brings you closer to the fans." : pf.score>.9 ? "Another big season for the club." : "");
    if (bad) addLoyalty(S.club, -(4 + 4*Math.min(3, S.badStreak)));
    if (sim.moved==="down" && FOREIGN.includes(sim.tier) && S.years>0){
      S.years = 0;
      S.log.push({season:sim.season, text:`Relegation release clause triggered at ${S.club}`, fee:null});
      note("bad", "Relegation release clause", `${S.club} went down to the ${TIERS[TIERS[sim.tier].second].name}, which isn't playable in this game. Your contract has a relegation clause, so it ends now and you can leave for free this summer.`);
    }
  }
  const pt = TIERS[tierOf(S.club)];
  if (loanEnded && pt.pool && pt.country!=="England" && S.years>0){ S.years = 0; S.log.push({season:sim.season, text:`${S.club} were relegated while you were away, so your release clause applies`, fee:null}); }
  const loanAsk = !loanEnded && age<=23 && !S.established && (S.badStreak||0)>=(age<=19?3:2) && S.years>0 && !TIERS[tierOf(S.club)].pool;
  const listed = !loanAsk && !loanEnded && (age>23 || S.established) && (S.badStreak||0)>=(patNow ?? patience(S.club, pf.score)) && S.years>0;
  if (loanAsk) S.log.push({season:sim.season, text:`${S.club} told you to go out on loan to get games`, fee:null});
  if (listed) S.log.push({season:sim.season, text:`Transfer-listed by ${S.club} after ${S.badStreak} poor seasons`, fee:null});
  // a young regular who plays most games and performs has broken through: from now on he's judged like a first-teamer
  if (!S.established && age<=23 && adjShare>=.6 && pf.score>=.6 && !loanEnded){
    S.established = true;
    note("good", "You've broken through", `A regular at ${age}. That's the end of the learning curve: from now on the club, the papers and the fans will judge you like any other first-team player.`);
  }
  const sale = (!listed && !loanAsk && !loanEnded && S.years>0) ? saleIntent(S.club, pf, age) : null;
  // international football: spring friendlies, then any summer tournament
  let tourPending = null;
  const intlWon = (S.seasonIntl||[]).filter(r=>r.won).map(r=>({name:r.key==="wc"?"World Cup":CONF_CUP[nationOf(S.player.nation).conf], kind:"intl"}));
  if (S.phase!=="retired"){
    friendlies("spring", pf.score);
    tournamentsIn(S.season+1).filter(t=>t.when==="summer").forEach(t=>{ if (tourPending) return; const nat = nationOf(S.player.nation); if (!nat || (t.conf!=="ALL" && t.conf!==nat.conf)) return; tourPending = prepareTournament(t, pf.score); });
  }
  S.seasonIntl = [];
  // where you stand in world football, and the Ballon d'Or
  let rank = worldRank(newVal, pf.score);
  // with a summer tournament to play, the Ballon d'Or waits until it's over
  const bdor = tourPending ? null : ballonRank(rank, won.concat(intlWon), tot, S.player.pos, sim.tier, comps, sim, age);
  if (bdor) rank = Math.min(rank, Math.max(1, Math.round(bdor*1.3)));
  const hNow = S.history[S.history.length-1];
  if (bdor===1){ const bw = {name:"Ballon d'Or", kind:"ballon"}; won.push(bw); S.trophies.push({...bw, season:sim.season, club:hNow.club}); hNow.trophies.push(bw.name); }
  const wonTeam = won.some(w=>!["boot","medal","ballon"].includes(w.kind));
  hNow.review = makeReview({name:S.player.name, pos:S.player.pos, age, club:hNow.club, tier:sim.tier, grade:clamp(+(gradeOf(pf.score, age<=21?Math.max(share,.3):adjShare, wonTeam) - (bad?pr*.8:0)).toFixed(1),2,10), share:adjShare, tot,
    sim, won, sale, listed, loanAsk, warn, established: !!S.established, stoodBy, injuries, pressure:pr, fee:S.feePaid&&S.feePaid.club===hNow.club?S.feePaid.fee:0, loyalty: loanEnded ? 0 : loyaltyOf(hNow.club), loan: loanEnded?{parent:S.club}:null, value:newVal, prev, rank, bdor});
  if (stoodBy) note("club", `${S.club} are standing by you`, `It wasn't your best season, but the club haven't forgotten what you've done for them. As a ${loyaltyLevel(loyaltyOf(S.club)).toLowerCase()} you've earned some patience. Don't push it.`);
  reviewIdx = null;
  // notifications for the summer
  const lgC = sim.comps[0];
  note(won.some(w=>!["boot","medal"].includes(w.kind)) || sim.moved==="up" ? "good" : sim.moved==="down" ? "bad" : "info",
    `${sim.season} season summary`, `${sim.club}: ${lgC.out.toLowerCase().replace(/^finished/,"finished")}. ${lgC.outcome}. You made ${tot.apps} appearances with ${tot.g} goals and ${tot.a} assists. Market value now ${money(newVal)}.`);
  won.forEach(w=>note("good", `Trophy: ${w.name}`, `Added to your cabinet with ${sim.club}.`));
  if (bdor) note(bdor===1?"good":"info", bdor===1?"You've won the Ballon d'Or!":`Ballon d'Or: ${ord(bdor)} place`, bdor===1?`The best player in the world this season. It's in your trophy cabinet.`:`You finished ${ord(bdor)} in the Ballon d'Or voting. Your season review has more on how the football world sees you.`);
  { const mv = movements(sim), parts = [];
    ENG.forEach(k=>{ const m = mv[k]; if (!m) return;
      if (m.up.length) parts.push(`Up from ${theName(k)}: ${m.up.map(x=>x.n).join(", ")}.`);
      if (k===5 && m.down.length) parts.push(`Out of the National League: ${m.down.map(x=>x.n).join(", ")}.`); });
    const pl = mv[1]; if (pl && pl.down.length) parts.unshift(`Relegated from the Premier League: ${pl.down.map(x=>x.n).join(", ")}.`);
    if (parts.length) note("info", "Promotion and relegation round-up", parts.join(" ")); }
  // the season goes into the roll of honour, and the other clubs do their summer business
  lgHonours(sim);
  cpSeasonNote(); euSeasonNote();
  sqNewsNote(sqWindow(S.season + 1));
  (S.notes ||= []).push({season:sim.season, kind:"club", title:`${sim.season} season review`, text:"The papers, the fans, the manager and the club have had their say. Open to read it.", rev:sim.season});
  if (loanEnded) note("info", "Loan finished", `Your season at ${loanEnded} is over and you're back at ${S.club}.`);
  if (loanAsk) note("club", `${S.club} want you to go out on loan`, `You haven't kicked on over the last ${S.badStreak} seasons. The club still see a future for you, but you need regular football at a lower level first. Pick a loan, or move on permanently.`);
  else if (bad && youth && !loanEnded && S.badStreak===1) note("info", "A learning year", `It hasn't clicked yet, but at ${age} nobody expects you to be the finished article. Show more next season.`);
  if (pr>=.6 && bad) note("bad", "Feeling the pressure", `The club paid ${money(S.feePaid.fee)} for you and expected far more. The fans and the papers are starting to ask questions.`);
  else if (pr>=.6 && pf.score>.9) note("good", "Living up to the fee", `Your ${money(S.feePaid.fee)} price tag is starting to look like a bargain.`);
  if (listed) note("bad", `${S.club} have transfer-listed you`, `After ${S.badStreak} poor seasons in a row the club wants you gone this summer. Take a transfer or a loan.`);
  else if (warn) note("warn", "The manager isn't happy", `That was a poor season. Another like it and ${S.club} will push you out.`);
  if (sale==="cashin"){ const m = clubModel(S.club);
    note("club", `${S.club} are ready to sell`, m.k==="seller" ? `The club signed you to develop and sell on, and after that season your value is ${money(S.value)}. They've told your agent they'll listen to offers and won't offer a new deal. Expect bigger clubs to call.` : `The club know they can't hold on to you if a bigger side comes in. They'll accept the right offer.`); }
  if (sale==="makeway") note("club", `${S.club} want to move you on`, `The club are planning to bring in younger players. At ${age} they'd prefer to sell you this summer, and any new deal would be short and on lower wages.`);
  if (S.years===1 && !listed && !loanEnded && age>=30 && sale!=="makeway") note("info", "One year left", `Your contract runs out next summer. At ${age}, expect clubs to offer shorter deals.`);
  const offerOpts = {listed, loanAsk, share:adjShare, loanFrom:loanEnded, good:pf.score>.75, sale, bid:tgSeasonEnd()};
  S.pending = {pf, f:tgt.f, prev, won, listed, loanAsk, warn: warn && !(youth && S.badStreak<2), stoodBy, loanEnded, sale, injuries, offerOpts, offers:genOffers(pf, offerOpts)};
  sponsorCheck(pf);
  S.phase = "window"; tab = "season";
  if (tourPending){
    S.tourney = {...tourPending, bd:{won:won.concat(intlWon).map(w=>({name:w.name, kind:w.kind})), tot, tier:sim.tier, comps, age, score:pf.score}};
    S.phase = "tournament";
  }
  save(); recordCareer(); render();
  $("#actionPanel")?.scrollIntoView({behavior:"smooth", block:"start"});
}
function currentPlan(){
  const base = S.sim ? S.sim.comps.map(c=>({code:c.code, name:c.name, max:c.games, note:`Team played ${c.games}`, eu:["UCL","UEL","UECL"].includes(c.code)})) : compPlan(S.club);
  if (S.sim){ const av = availability(); return av>=.999 ? base : base.map(p=>({...p, full:p.max, max:Math.max(0, Math.round(p.max*av))})); }
  // each half of the season is about half the games; fitness and the manager's selection cut that further
  const av = availability() * selectShare() * (halfOf()===2 ? (S.intlAway || 1) : 1);
  let plan = base.map(p=>({...p, full:p.max, max:Math.max(0, Math.ceil(p.max*.5*av - 1e-9))}));
  // moved clubs in January: you're cup-tied for domestic cups you already played in
  if (halfOf()===2 && S.h1 && S.h1.club!==S.club){
    const tied = Object.entries(S.h1.comps).filter(([k,c])=>c.apps>0 && !["league","UCL","UEL","UECL"].includes(k)).map(([k])=>k);
    plan = plan.filter(p=>!tied.includes(p.code));
  }
  return plan;
}

function pickLeague(target, exclude){
  const home = (S.player.nation||"").trim().toLowerCase();
  const cands = LEAGUES.map(k=>({k, d:Math.abs(TIERS[k].pr-target)})).sort((a,b)=>a.d-b.d);
  const near = cands.filter(c=>c.d<=cands[0].d+.12 && c.k!==exclude);
  const weighted = []; near.forEach(c=>{ const w = TIERS[c.k].country.toLowerCase()===home ? 3 : 2; for (let i=0;i<w;i++) weighted.push(c.k); });
  return weighted.length ? pick(weighted) : cands[0].k;
}
function genOffers(pf, opts={}){
  const cur = S.club, ct = tierOf(cur), cp = TIERS[ct].pr, age = S.age, sc = pf.score * clamp((pf.time ?? 1)*1.3, .3, 1);
  let up = sc>1.0 && age<=27 ? 2 : sc>.72 ? 1 : 0;
  let down = (sc<.42 || age>=32) ? 1 : 0; if (sc<.3 || age>=34) down = 2;
  const offers = [], used = new Set([cur]);
  // how in demand you are decides how many clubs come in (1 to 6)
  const demand = clamp(sc*.75 + (age<=21?.15:age<=24?.08:age>=33?-.25:age>=30?-.12:0) + (opts.sale==="cashin"?.15:0) + (S.release && S.years>0 && S.release<=S.value*1.5 ? .12 : 0) + rnd(-.08,.08), 0, 1);
  const n = opts.january ? clamp(Math.round(demand*3.4 - .4), opts.listed?1:0, 3) : clamp(Math.round(1 + demand*5.4), opts.listed?2:1, 6);
  const yr = () => yearsFor(age);
  if (opts.sale==="cashin"){ up += 1; }
  const make = (club, t, fee, role) => {
    const [minY,maxY] = yr(), years = Math.round(rnd(minY, maxY));
    const base = wageFor(S.value, club, t);
    const wage = roundWage(Math.max(base*rnd(.95,1.3), TIERS[t].pr>=cp-.05 ? Math.min(S.wage*rnd(1.02,1.18), base*1.6) : base));
    const mod = clubModel(club).k, spanish = t==="ES";
    const policy = spanish ? "required" : mod==="elite" && Math.random()<.6 ? "none" : "ok";
    const minClause = roundTM(Math.max(S.value,1e5) * (spanish?rnd(2.5,4):mod==="elite"?rnd(2.4,3.4):mod==="seller"?rnd(1.6,2.4):rnd(1.3,2)));
    const clause = spanish ? roundTM(minClause*rnd(1.4,2.2)) : (club===cur && S.release) ? S.release : null;
    return {club, tier:t, years, minY, maxY, fee, role, wage, maxWage:roundWage(wage*rnd(1.12,1.4)), patience:3, status:"open", msg:"", clause, minClause, policy};
  };
  const feeFor = (t, club) => S.years<=0 ? 0 : Math.min(roundTM(budgetOf(club, t)), roundTM(S.value * rnd(.85,1.3) * (S.years>=3?1.1:S.years===2?.95:.75) * (TIERS[t].pr>cp+.05?1.1:1) * (opts.listed?.6:(1+(sc>=.6?loyaltyOf(cur)/200:0))) * (opts.sale==="cashin"?1.15:opts.sale==="makeway"?.8:1)));
  // flopping players don't get calls from Europe's giants: cap how big an interested club can be
  const curSt = standing(cur);
  const maxSt = opts.loanAsk || down>0 ? curSt*.85 : up===0 ? curSt*1.1+.03 : up===1 ? curSt+.3 : 9;
  const roleFor = t => TIERS[t].pr>cp+.05 ? "Squad player" : TIERS[t].pr<cp-.05 ? "Guaranteed starter" : sc>.8 ? "Key player" : "Starter";
  // the loan club wants to keep you after a good spell
  if (opts.loanFrom && opts.good && tierOf(opts.loanFrom)!==6 && !TIERS[tierOf(opts.loanFrom)].pool){
    const t = tierOf(opts.loanFrom); used.add(opts.loanFrom);
    const o = make(opts.loanFrom, t, feeFor(t, opts.loanFrom), "Key player"); o.msg = "They want to make your loan permanent."; offers.push(o);
  }
  for (let i=0;i<n*6 && offers.length<n;i++){
    const shift = Math.round(rnd(-down-.49, up+.49));
    const target = clamp(cp + shift*.22 + rnd(-.06,.06), .03, 1);
    const t = pickLeague(target);
    // clubs that can't get near your value don't bid while you're under contract
    const pool = S.world.tiers[t].filter(c=>!used.has(c) && !meta(c).custom && standing(c)<=maxSt && (S.years<=0 || budgetOf(c,t) >= S.value*.7));
    if (!pool.length) continue;
    const want = clamp(.6 + .35*sc + rnd(-.15,.15), .6, 1);
    const club = pick(pool.slice().sort((a,b)=>Math.abs(repOf(a,t)-want)-Math.abs(repOf(b,t)-want)).slice(0,4));
    used.add(club);
    offers.push(make(club, t, feeFor(t, club), roleFor(t)));
  }
  // the club your agent's clause promised
  if (opts.bid && opts.bid!==cur && !opts.january){
    const have = offers.find(o=>o.club===opts.bid), t = tierOf(opts.bid);
    const o = have || make(opts.bid, t, feeFor(t, opts.bid), roleFor(t));
    if (!have){ used.add(opts.bid); offers.push(o); }
    o.agent = true; o.msg = "Your agent's clause paid off: they've come in for you.";
  }
  // veterans past their best may find nobody wants them
  if (!offers.length && !opts.january && (age<35 || sc>=.4 || Math.random()<.5)){ const t = pickLeague(Math.max(.05, cp-.2), ct); const c = pick(S.world.tiers[t].filter(x=>x!==cur)); offers.push(make(c,t,0,"Guaranteed starter")); }
  offers.sort((a,b)=>(b.club===opts.loanFrom)-(a.club===opts.loanFrom) || TIERS[b.tier].pr-TIERS[a.tier].pr || b.wage-a.wage);
  // a release clause lets bigger clubs go straight round your club
  if (S.release && S.years>0 && !opts.listed){
    offers.forEach(o=>{ if (o.club!==opts.loanFrom && TIERS[o.tier].pr>=cp-.05 && budgetOf(o.club,o.tier)>=S.release && (o.fee>=S.release*.8 || (S.release<=S.value*1.4 && Math.random()<.6))){
      o.fee = S.release; o.triggered = true; o.msg = "They've met your release clause, so your club can't block the move."; } });
  }
  let renewal = null;
  const Lc = loyaltyOf(cur);
  // form decides the money: loyalty only sweetens a deal when you're actually playing well
  const formOK = sc>=.6, poorForm = sc<.45;
  if (opts.january) offers.forEach(o=>{ if (o.fee) o.fee = roundTM(Math.min(budgetOf(o.club,o.tier), o.fee*1.1)); });
  if (!opts.january && !opts.listed && opts.sale!=="cashin" && !TIERS[ct].pool && S.years<=2 && sc>=(Lc>=50?.3:.35) && age<=41){
    const r = make(cur, ct, 0, "Current club");
    const bw = wageFor(S.value, cur, ct);
    if (poorForm){
      // a poor season gets you a short deal on less money, however loyal you've been
      r.minY = 1; r.maxY = Math.min(2, r.maxY); r.years = 1;
      r.wage = roundWage(Math.max(bw*.9, S.wage*rnd(.7,.85)));
      r.msg = "After that season they'll only offer a short deal on lower wages.";
    } else if (Lc>=60 && formOK && opts.sale!=="makeway" && age>=31){
      // loyal servants get looked after
      r.minY = 1; r.maxY = Math.min(3, yearsFor(age)[1]+1); r.years = r.maxY;
      r.wage = roundWage(Math.max(S.wage, bw) * rnd(1,1.08));
      r.msg = `A reward for your loyalty: ${r.maxY} year${r.maxY>1?"s":""} with no pay cut.`;
    } else if (opts.sale==="makeway" || age>=31){
      // older players: shorter deals, and the club wants a pay cut
      r.minY = 1; r.maxY = opts.sale==="makeway" ? 1 : Math.min(2, r.maxY); r.years = r.maxY;
      r.wage = roundWage(Math.max(S.wage*.7, Math.min(S.wage, bw) * rnd(.8,.95)));
      r.msg = opts.sale==="makeway" ? "They'll only offer one year, on reduced terms." : `At ${age} they'll only go to ${r.maxY} year${r.maxY>1?"s":""}.`;
    } else r.wage = roundWage(Math.max(Math.min(S.wage*rnd(1.02,1.2), bw*1.5), bw*rnd(.9,1.05)));
    const lb = formOK ? Lc/400 : 0;
    r.wage = roundWage(r.wage*(1+lb));
    r.maxWage = roundWage(r.wage*rnd(1.05,1.2)*(1+lb)*(poorForm?.95:1)); renewal = r;
  }
  // loans: for young players, players not getting games, or players the club wants rid of
  const loans = [];
  const struggling = pf.score < .35 || opts.listed || opts.loanAsk;
  if (S.years>=1 && !TIERS[ct].pool && cp>.04 && ((age<=21) || (age<=23 && !S.established) || struggling)){
    const nl = opts.loanAsk ? 3 : 1 + (Math.random()<.6 ? 1 : 0);
    for (let i=0;i<nl*6 && loans.length<nl;i++){
      const t = pickLeague(clamp(cp - rnd(.25,.6), .02, 1), ct);
      if (TIERS[t].pr >= cp) continue;
      const pool = S.world.tiers[t].filter(c=>!used.has(c) && !meta(c).custom && standing(c) <= curSt*.85);
      if (!pool.length) continue;
      const club = pick(pool.slice().sort((a,b)=>strOf(b)-strOf(a)).slice(0,8));
      used.add(club);
      loans.push({club, tier:t, loan:true});
    }
  }
  return {list:offers, renewal, loans, demand};
}
function getOffer(key){ return key==="renew" ? S.pending.offers.renewal : S.pending.offers.list[+key]; }
function negotiate(key){
  const o = getOffer(key); if (!o || o.status!=="open") return;
  const ask = roundWage(moneyOut($(`#ask-${key}`).value) || o.wage), years = +$(`#yrs-${key}`).value;
  const clRaw = ($(`#cl-${key}`)?.value ?? "").toString().trim();
  const askClause = clRaw==="" ? null : roundTM(+clRaw*1e6);
  const ys = clamp(years, o.minY, o.maxY);
  const wageOK = ask <= o.maxWage;
  const clauseOK = askClause==null ? o.policy!=="required" : (o.policy!=="none" && askClause >= o.minClause);
  const bits = [];
  if (wageOK && clauseOK){
    o.wage = Math.max(o.wage, ask); o.years = ys; o.status = "agreed";
    o.clause = askClause==null ? (o.policy==="required" ? o.clause : null) : askClause;
    o.msg = `Deal agreed: ${wageTxt(o.wage)} for ${ys} years${o.clause?`, release clause ${money(o.clause)}`:", no release clause"}.${ys!==years?` They'd only go to ${ys} years.`:""}`;
  } else {
    let cost = 0;
    if (!wageOK){
      if (ask <= o.maxWage*1.25){ cost = 1; o.wage = roundWage(o.maxWage*rnd(.94,1)); bits.push(`Their best wage is ${wageTxt(o.wage)}.`); }
      else { cost = 2; bits.push(`They think ${wageTxt(ask)} is way over the top.`); }
    }
    if (!clauseOK){
      cost = Math.max(cost, 1);
      if (o.policy==="none") bits.push("They won't put a release clause in your contract.");
      else if (askClause==null) bits.push(`Spanish clubs must include a release clause. They want ${money(o.clause)}.`);
      else { o.clause = o.minClause; bits.push(`The lowest release clause they'll accept is ${money(o.minClause)}.`); }
    }
    o.years = ys; o.patience -= cost; o.msg = bits.join(" ");
  }
  if (o.patience<=0 && o.status!=="agreed"){ o.status = "withdrawn"; o.msg = `${o.club} walked away from talks.`; }
  save(); render();
}
function midSeason(comps){
  const age = S.age, ex = expectedFinish(S.club), teamPct = 1 - (ex.rank-1)/Math.max(1, ex.n-1);
  const fit = availability(), sel1 = selectShare();
  const dbl = {}; for (const k in comps){ const c = comps[k]; dbl[k] = {...c, apps:c.apps*2, g:c.g*2, a:c.a*2, cs:(c.cs||0)*2}; }
  const pf = perf(dbl, teamPct, S.player.pos, fit*sel1, judgedAge());
  const youth = age<=21 && !S.established, pr = pressure();
  const bad = fit>=.4 && pf.score < (youth ? .3 : .45) + .15*pr;
  const M = mgr(), t0 = M.trust, onLoan = !!S.loan;
  if (fit>=.4){
    let d = pf.score>.85 ? 9 : pf.score>.6 ? 4 : !bad ? 0 : -Math.round((12 - Math.min(5, M.seasons*1.5)) * (1 + .5*(S.badStreak||0)));
    if (youth && d<0) d = Math.round(d/2);
    M.trust = clamp(M.trust + d, 5, 100);
  }
  const sel2 = selectShare();
  S.seasonIntl = [];
  let winterT = null;
  if (!(S.inj && availability()<.3)){
    const fr = friendlies("autumn", pf.score);
    // a mid-season tournament you're picked for is played game by game before the January window (tournament.js)
    tournamentsIn(S.season+1).filter(t=>t.when==="winter").forEach(t=>{ const nat = nationOf(S.player.nation); if (winterT || !nat || (t.conf!=="ALL" && t.conf!==nat.conf)) return; const T = prepareTournament(t, pf.score); if (T) winterT = {...T, winter:true}; });
  }
  const value0 = S.value;
  S.value = roundTM(S.value * clamp(1 + (pf.score-.65)*.25, .85, 1.18));
  S.h1 = {club:S.club, tier:tierOf(S.club), comps, wage:S.wage, sel:sel1, pf:pf.score, loan:onLoan, value0, value:S.value};
  let sale = null;
  if (!onLoan && S.years>0){
    if (bad && M.trust<35) sale = "available";
    else if (age<=25 && pf.score>.95 && clubModel(S.club).k==="seller" && Math.random()<.35) sale = "cashin";
  }
  const t = totOf(comps);
  note(bad?"warn":pf.score>.85?"good":"info", `${seasonLabel(S.season)} half-season review`,
    `${t.apps} appearances, ${t.g} goals and ${t.a} assists from August to December. ${sel2>sel1?`${M.name} is impressed: expect more games from January.`:sel2<sel1?`${M.name} isn't convinced: you'll get fewer games from January.`:`${M.name} is keeping things as they are.`}${sale==="available"?` The club would let you go this month.`:sale==="cashin"?` The club would sell for the right price.`:""}`);
  const offers = onLoan ? {list:[], loans:[], renewal:null, demand:0}
    : genOffers({...pf}, {january:true, listed: sale==="available", sale: sale==="cashin" ? "cashin" : null, share: t.apps ? .6 : .2});
  S.pending = {jan:true, pf, sel1, sel2, trust0:t0, trust1:M.trust, sale, offers, comps, bad};
  if (winterT){ S.tourney = winterT; S.phase = "tournament"; } else S.phase = "winter";
  tab = "season";
  save(); render();
  $("#actionPanel")?.scrollIntoView({behavior:"smooth", block:"start"});
}
function winterPanel(){
  const P = S.pending, t = totOf(P.comps), M = mgr();
  const pct = x => Math.round(x*100)+"%";
  return `<section class="panel pop win-winter" id="actionPanel">
    <div class="win-tag">❄ January transfer window</div>
    <h2>${seasonLabel(S.season)} · halfway</h2>
    <div class="totals" style="margin-bottom:14px">
      <div class="total"><div class="label">Apps</div><div class="v">${t.apps}</div></div>
      <div class="total"><div class="label">Goals</div><div class="v">${t.g}</div></div>
      <div class="total"><div class="label">Assists</div><div class="v">${t.a}</div></div>
      ${DEF.includes(S.player.pos)?`<div class="total"><div class="label">Clean sheets</div><div class="v">${t.cs}</div></div>`:""}
      <div class="total"><div class="label">Value</div><div class="v">${money(S.value)}</div></div>
    </div>
    <h3>The manager's mid-season verdict</h3>
    <p>${esc(M.name)}'s trust: <strong>${trustLabel(P.trust0)}</strong> → <strong>${trustLabel(P.trust1)}</strong>.
      ${P.sel2>P.sel1?`You've earned more game time: about <strong>${pct(P.sel2)}</strong> of games from January, up from ${pct(P.sel1)}.`
        :P.sel2<P.sel1?`You'll play less: about <strong>${pct(P.sel2)}</strong> of games from January, down from ${pct(P.sel1)}.`
        :`You'll be picked for about <strong>${pct(P.sel2)}</strong> of games from January.`}</p>
    ${S.loan?`<p class="hint">You're on loan at ${esc(S.club)} for the full season, so you stay put this month.</p>`:""}
    ${P.sale==="available"?`<p class="ref bad" style="margin:10px 0"><strong>${esc(S.club)} would let you leave this month.</strong> Take a move or a loan, or stay and fight for your place.</p>`
      :P.sale==="cashin"?`<p class="ref" style="margin:10px 0"><strong>${esc(S.club)} would sell for the right price.</strong> Bigger clubs have noticed your first half.</p>`:""}
    ${!S.loan?`<h3>January offers</h3>${P.offers.list.length?`<div class="offers">${P.offers.list.map((o,i)=>offerCard(o,i)).join("")}</div>`:`<p class="empty">No clubs have made an offer this month.</p>`}`:""}
    ${(P.offers.loans||[]).length?`<h3>Six-month loans · ${esc(S.club)} keep your contract</h3><div class="offers">${P.offers.loans.map((o,i)=>loanCard(o,i)).join("")}</div>`:""}
    <div class="row" style="margin-top:16px"><button class="btn primary" data-act="stay">${S.loan?"Back to the season":"Stay until the summer"}</button></div>
  </section>`;
}
function decideWinter(kind, key){
  negoOpen.clear();
  const P = S.pending, label = seasonLabel(S.season);
  if (kind==="sign"){
    const o = getOffer(key), from = S.club;
    S.club = o.club; S.years = o.years; S.wage = o.wage; S.badStreak = 0; S.release = o.clause || null;
    S.feePaid = o.fee ? {fee:o.fee, club:o.club, seasons:0} : null;
    newManager(o.club, 60 + (o.role==="Key player"?8:o.role==="Squad player"?-10:0));
    S.log.push({season:label, text:`January: ${from} → ${o.club} (${TIERS[o.tier].name}), ${o.years} years on ${wageTxt(o.wage)}`, fee:o.fee});
    note("good", `January move to ${o.club}`, `${o.fee?money(o.fee)+" deal":"Free transfer"} from ${from}. You'll play the second half of the season in ${theName(o.tier)}.`);
    flash = `January deal done. Welcome to ${o.club}.`;
  } else if (kind==="loan"){
    const o = P.offers.loans[+key];
    S.loan = {parent:S.club, half:true}; S.club = o.club; newManager(o.club, 62);
    S.log.push({season:label, text:`January: loaned from ${S.loan.parent} to ${o.club} (${TIERS[o.tier].name}) until the summer`, fee:null});
    note("info", `Six-month loan at ${o.club}`, `You'll play January to May in ${theName(o.tier)} and go back to ${S.loan.parent} in the summer.`);
    flash = `On loan at ${o.club} until the summer.`;
  } else {
    flash = `Staying at ${S.club} for the rest of the season.`;
  }
  S.half = 2; S.pending = null; S.phase = "stats"; tab = "season";
  save(); render(); window.scrollTo({top:0, behavior:"smooth"});
}
function decide(kind, key){
  negoOpen.clear();
  if (S.phase==="winter") return decideWinter(kind, key);
  const P = S.pending, done = seasonLabel(S.season);
  if (kind==="sign"){
    const o = getOffer(key);
    if (key==="renew"){
      S.years = o.years; S.wage = o.wage; S.badStreak = 0; S.release = o.clause || null;
      addLoyalty(S.club, 5, "Committing your future to the club goes down well.");
      S.log.push({season:done, text:`New ${o.years}-year contract at ${S.club} on ${wageTxt(o.wage)}`, fee:null});
      flash = `New ${o.years}-year deal signed at ${S.club} on ${wageTxt(o.wage)}.`;
      note("good", "New contract signed", `${o.years} more year${o.years>1?"s":""} at ${S.club} on ${wageTxt(o.wage)}.`);
    } else {
      const from = S.club; S.club = o.club; S.years = o.years; S.wage = o.wage; S.badStreak = 0; S.loan = null; S.release = o.clause || null;
      S.feePaid = o.fee ? {fee:o.fee, club:o.club, seasons:0} : null;
      newManager(o.club, 60 + (o.role==="Key player"?8:o.role==="Squad player"?-10:0));
      if (pressure()>=.6) note("warn", "All eyes on you", `A ${money(o.fee)} fee brings big expectations. ${o.club} will want to see a quick return, and so will the fans.`);
      const tgt = valuation({age:S.age, pos:S.player.pos, clubName:o.club, tier:o.tier, years:o.years, pf:P.pf});
      S.value = roundTM(.5*S.value + .5*tgt.value);
      S.log.push({season:done, text:`${from} → ${o.club} (${TIERS[o.tier].name}), ${o.years} years on ${wageTxt(o.wage)}`, fee:o.fee});
      flash = `Done deal. Welcome to ${o.club}.`;
      note("good", `Signed for ${o.club}`, `${o.fee?money(o.fee)+" move":"Free transfer"} from ${from}: ${o.years} years on ${wageTxt(o.wage)}. ${clubModel(o.club).text}`);
    }
  } else if (kind==="loan"){
    const o = P.offers.loans[+key];
    S.loan = {parent:S.club}; S.club = o.club; newManager(o.club, 62);
    S.log.push({season:done, text:`Loaned from ${S.loan.parent} to ${o.club} (${TIERS[o.tier].name}) for a season`, fee:null});
    flash = `On loan at ${o.club} for the season. You'll go back to ${S.loan.parent} next summer.`;
    note("info", `On loan at ${o.club}`, `One season in the ${TIERS[o.tier].name}. ${S.loan.parent} keep your contract and pay your wage.`);
  } else if (kind==="stay"){
    const bigger = (P.offers.list||[]).filter(o=>o.status!=="withdrawn" && TIERS[o.tier].pr > TIERS[tierOf(S.club)].pr + .05);
    if (bigger.length) addLoyalty(S.club, 6, `Turning down ${bigger[0].club} did not go unnoticed.`);
    flash = `Staying at ${S.club}. ${S.years} year${S.years===1?"":"s"} left on ${wageTxt(S.wage)}.`;
  } else if (kind==="retire"){
    S.phase = "retired"; S.log.push({season:done, text:`Retired at ${S.age}`, fee:null}); S.pending=null; save(); recordCareer(); render(); return;
  }
  S.season += 1; S.age += 1; S.pending = null; S.lastSim = S.sim; S.sim = null; S.phase = "stats"; tab = "season"; S.half = 1; S.h1 = null; S.intlAway = 1;
  if (S.age<=42){ rollInjuries(); scheduleIntl(); }
  if (S.age>42){ S.phase="retired"; S.log.push({season:done, text:`Retired at ${S.age-1}`, fee:null}); note("info","Time to hang up the boots","Nobody plays on past 42. Your career is over: see the Statistics tab for the full story."); }
  save(); recordCareer(); render(); window.scrollTo({top:0, behavior:"smooth"});
}

/* ================= SEASON REVIEW ================= */
const OUTLETS = {England:"The Matchday Herald", Spain:"Diario del Balón", Germany:"Fußball-Rundschau", Italy:"Corriere del Pallone", France:"Le Ballon Quotidien", Portugal:"Diário do Golo", Netherlands:"Voetbal Dagblad", Scotland:"The Terrace Times"};
function worldRank(value, score){
  const idx = Math.max(.05, value*(.7+.5*score)/1e6);
  return Math.max(1, Math.round(2490*Math.pow(idx, -1.4)));
}
function gradeOf(score, share, wonTeam){ return clamp(+(3.6 + score*4.6 + (wonTeam?.4:0) - (share<.3?.8:0)).toFixed(1), 2, 10); }
function makeReview(x){
  // x: {name, pos, age, club, tier, grade, share, tot, sim, won, sale, listed, warn, loan, value, prev, rank, bdor}
  const sur = x.name.trim().split(/\s+/).pop(), T = TIERS[x.tier], m = clubModel(x.club);
  const theL = /^(La Liga|Serie A|Ligue 1|Bundesliga|Eredivisie|Primeira Liga)$/.test(T.name) ? T.name : "the "+T.name;
  const band = x.share<.2 && x.tot.apps<10 && !(x.injuries||[]).some(i=>i.tier==="major") ? "unused" : x.grade>=8.6 ? "elite" : x.grade>=7.4 ? "great" : x.grade>=6.3 ? "good" : x.grade>=5.2 ? "mixed" : "poor";
  const ga = x.tot.g + x.tot.a, posL = POS[x.pos].label.toLowerCase(), def = DEF.includes(x.pos);
  const lg = x.sim.comps[0], teamTrophy = x.won.find(w=>!["boot","medal","ballon"].includes(w.kind));
  const statLine = def ? `${x.tot.apps} appearances${x.tot.cs?` and ${x.tot.cs} clean sheets`:""}` : `${x.tot.g} goals and ${x.tot.a} assists in ${x.tot.apps} games`;
  const vd = x.value - x.prev, vTxt = `${vd>=0?"up":"down"} ${money(Math.abs(vd))} to ${money(x.value)}`;

  // the club (board)
  const legend = (x.loyalty||0)>=60, young = x.age<=21 && !x.established, inj = (x.injuries||[]).filter(i=>i.tier==="major"||i.tier==="medium"), big = (x.pressure||0)>=.6;
  const club = inj.length && inj.some(i=>i.tier==="major") ? `The board know the ${inj[0].name.toLowerCase()} wrecked ${sur}'s season and are focused on getting him back to full fitness.`
    : x.loanAsk ? `The board still believe in ${sur}, but he needs games. They want him out on loan at a lower level to develop.`
    : young && (band==="unused"||band==="mixed"||band==="poor") ? `The board are happy to be patient with ${sur}. At ${x.age}, nobody expects him to be a regular yet.`
    : big && (band==="mixed"||band==="poor"||band==="unused") ? `The board paid ${money(x.fee)} for ${sur} and expected far more. Questions are being asked about the deal.`
    : big && (band==="elite"||band==="great") ? `The board are delighted. ${sur} is repaying every penny of his ${money(x.fee)} fee.`
    : x.stoodBy || (legend && (band==="mixed"||band==="poor"||band==="unused") && !x.listed) ? `The board are standing by ${sur}. After everything he's given the club, one poor season doesn't change how they see him.`
    : legend && !x.sale && !x.listed && (band==="elite"||band==="great") ? `The board see ${sur} as a ${loyaltyLevel(x.loyalty).toLowerCase()} and a symbol of the club. Keeping him is a priority.`
    : x.listed ? `The board have run out of patience. After back-to-back poor seasons they want ${sur} off the wage bill this summer.`
    : x.sale==="cashin" ? (m.k==="seller" ? `The board are thrilled with the profit they're about to make. ${sur} was signed to be developed and sold, and that plan is right on schedule.` : `The board rate ${sur} highly but accept a bigger club could come calling, and they won't stand in the way of the right offer.`)
    : x.sale==="makeway" ? `The board are planning for life after ${sur}. They're grateful for the service, but at ${x.age} the priority is a younger squad.`
    : x.loan ? `${x.loan.parent} sent ${sur} out to get minutes, and the board are watching the reports from ${x.club} closely.`
    : ({elite:`The board see ${sur} as central to the club's plans and expect to build around ${x.age<=27?"him for years":"him while he's at this level"}.`,
        great:`The board are delighted with the return on their investment and want to keep ${sur} happy.`,
        good:`The board are satisfied. ${sur} has earned his wages this season.`,
        mixed:`The board feel ${sur} hasn't fully justified his wages and want more next season.`,
        poor:`The board are concerned. ${sur} is one of the club's bigger earners and hasn't delivered.`,
        unused:`The board question why they're paying a player who barely features.`})[band];

  // the manager
  const role = x.share>=.75 ? "Key player" : x.share>=.5 ? "Regular starter" : x.share>=.25 ? "Rotation option" : "Fringe player";
  const mgrQ = ({elite:[`"He's been unplayable. I can't remember a season like it from a ${posL}."`, `"Every week he's decided games for us. He's the first name on my teamsheet."`],
    great:[`"He's been brilliant. Consistent, professional and he turns up in the big games."`, `"I've asked a lot of him and he's delivered every time."`],
    good:[`"A good season. He knows there's another level in him and so do I."`, `"Solid and reliable. He's done what I've asked."`],
    mixed:[`"Flashes of quality, but not enough consistency. He knows that."`, `"Some good days, some bad. I need more from him."`],
    poor:[`"It's not been his year. He has to fight for his place now."`, `"He's struggled, and I've had to look at other options."`],
    unused:[`"He's had to be patient. Minutes have to be earned in this squad."`, `"He hasn't forced his way in yet."`]})[band];
  const youngQ = [`"He's a young lad learning his trade. I'm not going to throw him in every week."`, `"There's real talent there. He just needs time and patience."`];
  const injQ = [`"It's been cruel for him. We just want him back fit."`, `"Injuries have held him back. When he's fit, he's a big player for us."`];
  const bigQ = [`"The fee isn't his fault, but he knows he has to deliver more."`, `"Big fee, big expectations. He has to handle that."`];
  const manager = {role: inj.length && x.share<.5 ? "Injured" : young && x.share<.4 ? "Development player" : role,
    quote: inj.length && band!=="elite" && band!=="great" ? pick(injQ) : young && (band==="unused"||band==="mixed"||band==="poor") ? pick(youngQ) : big && (band==="mixed"||band==="poor") ? pick(bigQ) : pick(mgrQ)};

  // the paper
  const heads = ({elite:[`${sur} lights up ${theL}`, `Unstoppable ${sur} carries ${x.club}`, `${sur}: the season of a lifetime`],
    great:[`${sur} delivers in style for ${x.club}`, `Big season for ${sur} as ${x.club} reap the rewards`],
    good:[`Steady campaign for ${sur}`, `${sur} quietly gets the job done`],
    mixed:[`Hot and cold: ${sur}'s up-and-down season`, `Questions remain over ${sur}`],
    poor:[`${sur} endures a season to forget`, `Where did it go wrong for ${sur}?`],
    unused:[`Bench-warmer ${sur} faces big summer`, `${sur} left on the fringes at ${x.club}`]})[band];
  const body = [
    `${sur} finished with ${statLine}.`,
    inj.length ? `A ${inj[0].name.toLowerCase()} kept him out for a big part of the campaign.` : "",
    big ? (band==="elite"||band==="great" ? `For a ${money(x.fee)} signing, that's exactly what was needed.` : `For a ${money(x.fee)} signing, it simply wasn't enough.`) : "",
    young && x.share<.5 && !inj.length ? `At ${x.age}, minutes were always going to be limited.` : "",
    `${x.club} ${lg.out.replace(/^Finished/,"finished")}: ${(lg.outcome.charAt(0).toLowerCase()+lg.outcome.slice(1)).replace(/[!.]+$/,"")}.`,
    teamTrophy ? `The ${teamTrophy.name} will be the memory everyone keeps.` : "",
    `His value is ${vTxt}.`,
    band==="elite"||band==="great" ? (x.age<=23 ? "At his age, the ceiling looks frighteningly high." : "Few in the league were more influential.") : band==="poor"||band==="unused" ? "This summer could decide the direction of his career." : ""
  ].filter(Boolean).join(" ");
  const paper = {outlet: OUTLETS[T.country] || OUTLETS.England, headline: pick(heads), body, rating: x.grade};

  // the fans
  const fanQ = ({elite:[`"Best player I've seen in our shirt in years. Give him whatever he wants."`, `"We sing his name before the game's even started now."`],
    great:[`"Brilliant season. Please don't sell him."`, `"Worth every penny. Our player of the season, no question."`],
    good:[`"Does his job. Not flashy, but you know what you're getting."`, `"Decent season. Would like a few more big moments."`],
    mixed:[`"Frustrating. You see the talent, then he goes missing."`, `"Jury's still out for me."`],
    poor:[`"Not good enough for this club, simple as that."`, `"Time for a fresh start, for him and for us."`],
    unused:[`"Barely seen him. Don't know why we signed him."`, `"Needs a loan to get some games."`]})[band];
  const fan = {who: `Season-ticket holder, ${meta(x.club).ground || x.club}`, quote: inj.length && band!=="elite" ? pick([`"Gutted for him. Get him fit and he'll show what he can do."`, `"Can't judge him on that season. He's barely been fit."`])
    : young && (band==="unused"||band==="mixed"||band==="poor") ? pick([`"Exciting kid. Give him time."`, `"Send him on loan, let him get games, he'll come back better."`])
    : big && (band==="mixed"||band==="poor"||band==="unused") ? pick([`"All that money for this? Not good enough."`, `"We paid a fortune. He needs to start earning it."`])
    : legend && (band==="mixed"||band==="poor"||band==="unused") ? pick([`"He's earned the right to a bad season. Leave him alone."`, `"After what he's done for us? He's not going anywhere."`]) : pick(fanQ)};

  // the wider football world
  const r = x.rank;
  const opinion = r<=3 ? `Considered one of the very best players on the planet.` : r<=15 ? `World class, and talked about among the elite of the game.`
    : r<=50 ? `One of the best ${posL}s in Europe.` : r<=150 ? `An established top-level player with international pedigree.`
    : r<=500 ? (x.age<=21 ? `One of the most exciting young players around.` : `Highly rated in ${theL}.`)
    : x.age<=21 ? `A prospect clubs are starting to notice.` : `A working professional, little known outside his own league.`;
  return {band, grade:x.grade, club, manager, paper, fan, world:{rank:r, opinion, bdor:x.bdor}};
}
// Ballon d'Or, modelled on the last ten winners (2015–2025):
// every winner lifted major silverware; most won the Champions League or a league-and-cup double;
// forwards posted huge numbers (Messi 51 in 2019, Benzema 44 in 2022, Dembélé 35 in 2025);
// midfielders only won when it came with a big double (Modrić 2018, Rodri 2024).
const BDOR_HISTORY = [
  ["2025","Ousmane Dembélé","PSG","Champions League, Ligue 1, Coupe de France · 35 goals, 16 assists"],
  ["2024","Rodri","Manchester City","Premier League, Euro 2024 · midfield anchor"],
  ["2023","Lionel Messi","PSG / Inter Miami","World Cup, Ligue 1"],
  ["2022","Karim Benzema","Real Madrid","Champions League, La Liga · 44 goals"],
  ["2021","Lionel Messi","Barcelona / PSG","Copa América, Copa del Rey · 38 goals"],
  ["2019","Lionel Messi","Barcelona","La Liga · 51 goals"],
  ["2018","Luka Modrić","Real Madrid","Champions League, World Cup finalist · midfield"],
  ["2017","Cristiano Ronaldo","Real Madrid","Champions League, La Liga · 42 goals"],
  ["2016","Cristiano Ronaldo","Real Madrid","Champions League, Euro 2016 · 51 goals"],
  ["2015","Lionel Messi","Barcelona","Treble · 58 goals"]
];
const BIG5 = [1,"ES","DE","IT","FR"];
function ballonCase(won, tot, pos, tier, comps){
  const teamW = won.filter(w=>!["boot","medal","ballon"].includes(w.kind));
  const ucl = teamW.some(w=>w.name==="Champions League");
  const title = teamW.some(w=>w.kind==="league" && !/play-off/.test(w.name));
  const ex = POS[pos].exp, ga = tot.g + tot.a, apps = tot.apps;
  const attacker = ex>=.5, mid = !attacker && ex>0;
  const stats = attacker ? (tot.g>=30 || ga>=45) && apps>=40 : mid ? apps>=45 && ga>=12 : apps>=48;
  const intlMajor = won.some(w=>w.kind==="intl" && /World Cup|European|Copa/.test(w.name));
  const trophies = (ucl && teamW.length>=1 && (attacker || teamW.length>=2)) || (title && teamW.length>=2) || (title && attacker && tot.g>=40) || (intlMajor && teamW.length>=2);
  return {eligible: BIG5.includes(tier) && stats && trophies, ucl, title, teamW:teamW.length, stats, trophies};
}
// Ballon d'Or points, calibrated against the real 2025 top 30:
//  Dembélé 1st (35 goals, 16 assists, Champions League + Ligue 1 + cup), Salah 4th (34 + 23, Premier League),
//  Mbappé 7th (44 goals, no major trophy), Kane 13th (41 goals, Bundesliga), Gyökeres 15th (54 goals in Portugal),
//  Guirassy 21st (38 goals, no trophy), Haaland 26th (31 goals, no trophy), Olise 30th (20 + 23, Bundesliga).
//  A season of around 20 goals and assists with nothing won doesn't get a nomination.
const BDOR_LEAGUE = {1:1, ES:1, DE:.9, IT:.95, FR:.92, POR:.55, NED:.55, SCO:.35, 2:.3};
const BDOR_TITLE  = {1:18, ES:16, DE:10, IT:12, FR:10};
function ballonPoints(won, tot, pos, tier, comps, sim, age){
  const ex = POS[pos].exp, attacker = ex>=.5, def = DEF.includes(pos);
  let perf;
  if (attacker) perf = tot.g*1.1 + tot.a*.8 + (tot.g>=40 ? 5 : 0);
  else if (def) perf = Math.min(32, tot.apps*.35 + (tot.cs||0)*.6 + (tot.g+tot.a)*.9);
  else perf = tot.g*1.3 + tot.a + tot.apps*.4;
  // a season of great match ratings (twenty or more of them) catches the voters' eye
  if (tot.rn>=20) perf += clamp((tot.rs/tot.rn - 7)*15, -5, 15);
  let tro = 0;
  won.forEach(w=>{
    if (w.kind==="intl") tro += /World Cup/.test(w.name) ? 26 : /European|Copa/.test(w.name) ? 18 : 7;
    else if (w.name==="Champions League") tro += 28;
    else if (w.name==="Europa League") tro += 10;
    else if (w.name==="Conference League") tro += 5;
    else if (w.kind==="league" && !/play-off/.test(w.name)) tro += BDOR_TITLE[tier] ?? 6;
    else if (w.kind==="cup") tro += /FA Cup|Copa del Rey|DFB|Coppa|Coupe/.test(w.name) ? 5 : 2;
    else if (w.kind==="boot") tro += 3;
    else if (w.kind==="medal" && /Player of the Season/.test(w.name) && !/Young/.test(w.name)) tro += 4;
  });
  const ucl = sim && sim.comps.find(c=>c.code==="UCL");
  if (ucl && !ucl.won) tro += ucl.reached==="Final" ? 6 : ucl.reached==="Semi-final" ? 3 : 0;
  if (sim && BIG5.includes(tier) && sim.pos<=4) tro += 2;
  const mult = BDOR_LEAGUE[tier] ?? .15;
  return Math.round((perf + tro) * mult * (age<=20 ? 1.12 : 1));
}
const BDOR_SCALE = [[100,1],[90,2],[80,4],[70,7],[60,12],[52,17],[45,22],[38,29]];
function ballonRank(rank, won, tot, pos, tier, comps, sim, age){
  const pts = ballonPoints(won, tot, pos, tier, comps, sim, age) * rnd(.93,1.07);
  if (pts < 37) return null;
  let place;
  if (pts >= 100) place = 1;
  else { for (let k=1;k<BDOR_SCALE.length;k++){ const [hi,ph] = BDOR_SCALE[k-1], [lo,pl] = BDOR_SCALE[k];
    if (pts >= lo){ place = Math.round(pl + (ph-pl)*(pts-lo)/(hi-lo)); break; } } }
  place ??= 30;
  const c = ballonCase(won, tot, pos, tier, comps);
  if (place===1 && !c.eligible) place = 2;                     // nobody wins it without silverware and the numbers
  if (c.eligible && place<=3 && Math.random() < (place===2 ? .7 : place===3 ? .35 : 1)) place = 1;
  return clamp(place, 1, 30);
}
function reviewBody(h){
  const R = h.review, stars = n => "★".repeat(Math.round(n/2)) + "☆".repeat(5-Math.round(n/2));
  return `<div class="review">
    <p class="hint">${esc(h.club)}${h.loan?" (loan)":""} · age ${h.age} · ${h.tot.apps} apps, ${h.tot.g} goals, ${h.tot.a} assists${(h.injuries||[]).filter(i=>i.tier!=="small").length?` · injured: ${h.injuries.filter(i=>i.tier!=="small").map(i=>esc(i.name)).join(", ")}`:""}</p>
    <div class="paper">
      <div class="outlet">${esc(R.paper.outlet)}</div>
      <h3 class="headline">${esc(R.paper.headline)}</h3>
      <p>${esc(R.paper.body)}</p>
      <div class="row" style="justify-content:space-between"><span class="label">Season rating</span><span class="grade">${R.paper.rating.toFixed(1)}<small>/10</small> <span class="stars" aria-hidden="true">${stars(R.paper.rating)}</span></span></div>
    </div>
    <div class="revgrid">
      <div class="revcard"><h3>The club</h3><p>${esc(R.club)}</p></div>
      <div class="revcard"><h3>The manager · ${esc(R.manager.role)}</h3><p class="quote">${esc(R.manager.quote)}</p></div>
      <div class="revcard"><h3>The fans</h3><p class="quote">${esc(R.fan.quote)}</p><p class="hint">${esc(R.fan.who)}</p></div>
      <div class="revcard"><h3>World football</h3>
        <div class="rankbig">${R.world.rank<=1000?`#${R.world.rank}`:"1,000+"}</div>
        <div class="label">${R.world.rank<=1000?"in the world":"outside the world's top 1,000"}</div>
        <p>${esc(R.world.opinion)}</p>
        ${R.world.bdor?`<div class="bdor ${R.world.bdor===1?"win":""}"><span class="label">Ballon d'Or</span><strong>${R.world.bdor===1?"Winner":ord(R.world.bdor)+" place"}</strong></div>`:""}
      </div>
    </div>
  </div>`;
}
function reviewPanel(){
  const hs = S.history.filter(h=>h.review);
  if (!hs.length) return `<section class="panel"><h2>Season review</h2><p class="empty">After your first season you'll get the club's verdict, the manager's view, a newspaper review, the fans' take and where you rank in world football.</p></section>`;
  const idx = clamp(reviewIdx ?? hs.length-1, 0, hs.length-1), h = hs[idx], R = h.review;
  const stars = n => "★".repeat(Math.round(n/2)) + "☆".repeat(5-Math.round(n/2));
  return `<section class="panel">
    <div class="row" style="justify-content:space-between">
      <h2 style="margin:0">${h.season} review</h2>
      <div class="row">${hs.length>1?`<button class="btn small" data-act="rev" data-k="${idx-1}" ${idx===0?"disabled":""} aria-label="Previous season">‹</button><button class="btn small" data-act="rev" data-k="${idx+1}" ${idx===hs.length-1?"disabled":""} aria-label="Next season">›</button>`:""}</div>
    </div>
    <p class="hint" style="margin-top:6px">${esc(h.club)}${h.loan?" (loan)":""} · age ${h.age} · ${h.tot.apps} apps, ${h.tot.g} goals, ${h.tot.a} assists</p>
  </section>
  <section class="panel paper">
    <div class="outlet">${esc(R.paper.outlet)}</div>
    <h3 class="headline">${esc(R.paper.headline)}</h3>
    <p>${esc(R.paper.body)}</p>
    <div class="row" style="justify-content:space-between"><span class="label">Season rating</span><span class="grade">${R.paper.rating.toFixed(1)}<small>/10</small> <span class="stars" aria-hidden="true">${stars(R.paper.rating)}</span></span></div>
  </section>
  <div class="revgrid">
    <section class="panel"><h3>The club</h3><p>${esc(R.club)}</p></section>
    <section class="panel"><h3>The manager · ${esc(R.manager.role)}</h3><p class="quote">${esc(R.manager.quote)}</p></section>
    <section class="panel"><h3>The fans</h3><p class="quote">${esc(R.fan.quote)}</p><p class="hint">${esc(R.fan.who)}</p></section>
    <section class="panel"><h3>World football</h3>
      <div class="rankbig">${R.world.rank<=1000?`#${R.world.rank}`:"1,000+"}</div>
      <div class="label">${R.world.rank<=1000?"in the world":"outside the world's top 1,000"}</div>
      <p>${esc(R.world.opinion)}</p>
      ${R.world.bdor?`<div class="bdor ${R.world.bdor===1?"win":""}"><span class="label">Ballon d'Or</span><strong>${R.world.bdor===1?"Winner":ord(R.world.bdor)+" place"}</strong></div>`:""}
    </section>
  </div>`;
}

/* ================= RENDER: CAREER ================= */
function totals(){
  const t = {apps:0,g:0,a:0};
  S.history.forEach(h=>{t.apps+=h.tot.apps;t.g+=h.tot.g;t.a+=h.tot.a});
  const clubs = new Set(S.history.map(h=>h.club)); clubs.add(S.club);
  const peak = Math.max(S.startValue, ...S.history.map(h=>h.after));
  return {...t, seasons:new Set(S.history.map(h=>h.season)).size, clubs:clubs.size, peak};
}
function pyramid(t){
  const T = TIERS[t];
  if (T.country!=="England"){
    return `<div class="pyr" aria-label="Europe's top five leagues, you are in ${T.country}">${TOP.map(k=>`<div class="step ${k===t||(T.pool&&T.feeds===k)?"on":""}" style="width:100%">${TIERS[k].name} · ${TIERS[k].country}</div>`).join("")}</div>${T.pool?`<p class="hint" style="margin-top:8px">Your club is in the ${T.name}.</p>`:""}`;
  }
  const w = {1:42,2:56,3:70,4:84,5:98};
  return `<div class="pyr" aria-label="English football pyramid, you are in the ${t<=5?T.name:"non-league"}">${[1,2,3,4,5].map(i=>`<div class="step ${i===t?"on":""}" style="width:${w[i]}%">${TIERS[i].name}</div>`).join("")}</div>`;
}
function niceMax(v){ const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1,1.5,2,2.5,3,4,5,6,8,10]) if (m*p>=v) return m*p; return 10*p; }
function chart(){
  const pts = [{l:"Start",v:S.startValue}, ...S.history.map(h=>({l:h.season.slice(2),v:h.after}))];
  if (pts.length<2) return `<p class="empty">Your value graph appears after your first season.</p>`;
  const narrow = typeof matchMedia==="function" && matchMedia("(max-width:600px)").matches;
  const W=narrow?360:640,H=narrow?230:220,L=narrow?46:58,R=narrow?10:16,T=14,B=30;
  const mx = Math.max(...pts.map(p=>p.v), 1), raw = mx/4, p10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1,2,2.5,5,10].map(k=>k*p10).find(v=>v>=raw), nice = Math.ceil(mx/step)*step, ticks = Array.from({length:Math.round(nice/step)+1},(_,i)=>i*step);
  const x = i => L + (W-L-R)*(i/(pts.length-1)), y = v => T + (H-T-B)*(1-v/nice);
  const line = pts.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const every = Math.ceil(pts.length/(narrow?6:10));
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Market value by season">
    ${ticks.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="Barlow, sans-serif">${money(v)}</text>`).join("")}
    <path d="${line} L${x(pts.length-1)} ${H-B} L${x(0)} ${H-B} Z" fill="var(--accent)" fill-opacity=".18"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>
    ${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.v)}" r="${i===pts.length-1?5:3}" fill="${i===pts.length-1?"var(--accent)":"var(--surface)"}" stroke="var(--accent)" stroke-width="2"/>${i%every===0||i===pts.length-1?`<text x="${x(i)}" y="${H-10}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="Barlow, sans-serif">${esc(p.l)}</text>`:""}`).join("")}
  </svg>`;
}
function expectedFinish(club){
  const t = tierOf(club), list = S.world.tiers[t].slice().sort((a,b)=>strOf(b)-strOf(a));
  return {rank:list.indexOf(club)+1, n:list.length};
}
function compBlock(c){
  const eu = ["UCL","UEL","UECL"].includes(c.code);
  const cls = c.won ? "win" : c.code==="league" ? (/Promoted|Champions|qualification|Play-off winners/.test(c.outcome)?"good":/Relegated/.test(c.outcome)?"bad":"") : eu?"eu":"";
  const res = c.code==="league" ? ord(+c.out.match(/(\d+)/)[1]) : c.won ? "🏆 Winners" : c.reached;
  return `<div class="comp ${cls}"><div class="nm">${esc(c.name)}</div><div class="res">${esc(res)}</div>
    <div class="sub">${c.code==="league"?`${esc(c.out)}. ${esc(c.outcome)}.`:esc(c.out)} ${c.games} games played.</div></div>`;
}
function fitnessBox(){
  const list = (S.inj && S.inj.season===seasonLabel(S.season)) ? S.inj.list : [], av = availability(), pr = pressure(), pl = S.prone ?? 1;
  return `<div class="fit">
    <div class="row" style="justify-content:space-between"><h3 style="margin:0">Fitness and selection</h3><span class="hint">Injury record: <strong>${proneLabel(pl)}</strong></span></div>
    ${list.length ? list.map((i,k)=>`<div class="inj t-${i.tier}"><span class="pill ${i.tier==="major"||i.tier==="medium"?"down":""}">${INJ[i.tier].label}</span><strong>${esc(i.name)}</strong><span class="hint">out for about ${Math.round(i.red*100)}% of the season</span></div>`).join("")
      : `<p class="hint" style="margin:6px 0">Fully fit going into the season.</p>`}
    ${av<.999?`<p class="hint">You can play about ${Math.round(av*100)}% of this season's games, so the most appearances in each competition has gone down. Injured time doesn't count against you.</p>`:""}
    <div class="row" style="margin-top:10px;gap:10px"><span class="label">Manager · ${esc(mgr().name)}</span><span class="pill ${mgr().trust<30?"down":mgr().trust>=60?"up":""}">${trustLabel(mgr().trust)}</span>${S.loan?`<span class="hint">On loan: guaranteed regular football</span>`:""}</div>
    ${selectShare()<1?`<p class="hint">The manager will pick you for about ${Math.round(selectShare()*100)}% of games this season, so your maximum appearances are lower. Good seasons win his trust back.</p>`:`<p class="hint">The manager picks you whenever you're fit.</p>`}
    <p class="hint" style="margin-top:6px">Injuries are decided for you at the start of each season. The more injuries you've had, the more likely the next one.</p>
    ${S.established&&S.age<=23?`<p class="hint" style="margin-top:8px">You've broken through, so you're judged like a first-team regular now. Expectations are higher.</p>`:""}
    ${S.age<=21&&!S.established?`<p class="hint" style="margin-top:8px">At ${S.age} you're still breaking through. Nobody expects you to play every game, so the club, the papers and your value judge you more gently.</p>`:""}
    ${pr>=.3?`<p class="hint" style="margin-top:8px"><strong>Pressure: ${pressureLabel(pr)}.</strong> ${esc(S.club)} paid ${money(S.feePaid.fee)} for you and expect a return. A middling season will be judged as a poor one.</p>`:""}
  </div>`;
}
function statsPanel(){
  if (seasonMode()==="centre") return mcPanel();
  const c = S.club, t = tierOf(c), ex = expectedFinish(c), plan = currentPlan();
  const showCS = DEF.includes(S.player.pos), cols = showCS?4:3;
  return `<section class="panel" id="actionPanel">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">${seasonLabel(S.season)} · ${esc(c)}</h2><span class="pill ${halfOf()===1?"":"eu"}">${halfOf()===1?"Part 1 · August to December":"Part 2 · January to May"}</span></div>
    ${halfOf()===2&&S.h1?`<p class="hint" style="margin-top:8px">First half${S.h1.club!==S.club?` at ${esc(S.h1.club)}`:""}: ${totOf(S.h1.comps).apps} apps, ${totOf(S.h1.comps).g} goals, ${totOf(S.h1.comps).a} assists.${S.h1.club!==S.club?" You're cup-tied for domestic cups you already played in.":""}</p>`:""}
    <p class="hint">Squad strength ranks ${ord(ex.rank)} of ${ex.n} in ${theName(t)}. Play your season, enter your stats for each competition, and the season is simulated from them.</p>
    <details class="ref howto" style="margin-top:12px"><summary><strong>How your stats shape the team</strong></summary>The more league games you play and the better your numbers, the more you move the final table. Three games barely registers; a full season of strong form can be worth a dozen points. Your cup appearances also prove how far the team got: play five FA Cup games and the team reached at least that round, then the rest of the run is simulated.</details>
    ${fitnessBox()}
    <form id="seasonForm" class="col" style="gap:14px;margin-top:16px">
      <div class="statgrid sheet">
        <div class="statrow sheet-h" style="--cols:${cols}" aria-hidden="true"><span>Competition</span><span>Apps</span><span>Goals</span><span>Assists</span>${showCS?`<span>Clean sh.</span>`:""}</div>
        ${plan.map(p=>`<div class="statrow" style="--cols:${cols}">
          <div class="cname">${esc(p.name)}<small>${esc(p.note)} · up to ${p.max} games</small></div>
          <div class="field"><label for="s-${p.code}-apps">Apps</label><input id="s-${p.code}-apps" type="number" min="0" max="${p.max}" inputmode="numeric" value="0"></div>
          <div class="field"><label for="s-${p.code}-g">Goals</label><input id="s-${p.code}-g" type="number" min="0" inputmode="numeric" value="0"></div>
          <div class="field"><label for="s-${p.code}-a">Assists</label><input id="s-${p.code}-a" type="number" min="0" inputmode="numeric" value="0"></div>
          ${showCS?`<div class="field"><label for="s-${p.code}-cs">Clean sh.</label><input id="s-${p.code}-cs" type="number" min="0" inputmode="numeric" value="0"></div>`:""}
        </div>`).join("")}
      </div>
      <div class="ref"><strong>Benchmark.</strong> Michael Olise at 24 in 2025/26: 52 games, 22 goals, 31 assists for Bayern. Transfermarkt took him from €150m to about €170–180m. You only collect a winner's medal if you played at least once in that competition.</div>
      <div class="row"><button class="btn primary" type="submit">${halfOf()===1?"Play to January":"Finish the season"}</button><span class="err" id="seasonErr" role="alert"></span></div>
    </form>
    ${mcModeSwitch()}
  </section>`;
}
// who went up and who went down: compare last season's tables with where every club is now
const theName = k => /^(League One|League Two|La Liga|Serie A|Ligue 1|Bundesliga|Eredivisie|Primeira Liga|Liga Portugal 2|Serie B|Ligue 2|Segunda División|Eerste Divisie|2\. Bundesliga)$/.test(TIERS[k].name) ? TIERS[k].name : "the "+TIERS[k].name;
function movements(ls){
  const out = {};
  if (!ls) return out;
  for (const k of LEAGUES){
    const tb = ls.tables[k]; if (!tb) continue;
    const was = new Set(tb.map(r=>r.n)), lvl = TIERS[k].level;
    const o = out[k] = {up:[], down:[], inUp:[], inDown:[]};
    tb.forEach(r=>{ const nt = tierOf(r.n); if (nt!==k){ (TIERS[nt].level<lvl ? o.up : o.down).push({n:r.n, to:nt}); } });
    S.world.tiers[k].forEach(n=>{ if (!was.has(n)){ const from = ALLKEYS.find(j=>j!==k && ls.tables[j] && ls.tables[j].some(r=>r.n===n)) ?? (TIERS[k].country==="England"?6:TIERS[k].second);
      (TIERS[from].level>lvl ? o.inUp : o.inDown).push({n, from}); } });
  }
  return out;
}
function moversHTML(mv, keys){
  const line = (k) => { const m = mv[k]; if (!m || (!m.up.length && !m.down.length)) return "";
    return `<div class="mv"><div class="mv-l">${TIERS[k].name}</div><div>${m.up.length?`<span class="up-t">▲ ${m.up.map(x=>esc(x.n)).join(", ")}</span>`:""}${m.up.length&&m.down.length?"<br>":""}${m.down.length?`<span class="down-t">▼ ${m.down.map(x=>esc(x.n)).join(", ")}</span>`:""}</div></div>`; };
  return keys.map(line).join("");
}
function seasonResults(sim, last){
  const nextEu = sim.nextEurope ? `<span class="pill eu">${EURO[sim.nextEurope].name} next season</span>` : "";
  const mv = sim.moved==="up" ? `<span class="pill up">Promoted</span>` : sim.moved==="down" ? `<span class="pill down">Relegated</span>` : "";
  const im = sim.impact, lgApps = last.comps.league ? last.comps.league.apps : 0;
  const impTxt = !im ? "" : lgApps===0 ? "You didn't play in the league, so the team's finish was all down to the squad."
    : `You played ${lgApps} of ${TIERS[sim.tier].games} league games. Your form was worth about ${im.pts>0?"+":""}${im.pts} points to the team${Math.abs(im.pts)<=1?", which barely moved the table":""}.`;
  return `<h2>${sim.season} · how ${esc(sim.club)} got on</h2>
    <div class="pills" style="margin-bottom:12px">${mv}${nextEu}</div>
    <div class="comps">${sim.comps.map(compBlock).join("")}</div>
    <details class="clubsplit" style="margin-top:12px"><summary>Promotion and relegation across ${TIERS[sim.tier].country==="England"?"the pyramid":"Europe"}</summary>
      <div class="mvs">${moversHTML(movements(sim), TIERS[sim.tier].country==="England" ? ENG : [sim.tier, ...ENG])}</div>
      <p class="hint" style="margin-top:8px">Every league's full table and next season's line-up are on the Leagues tab.</p></details>
    ${impTxt?`<p class="hint" style="margin-top:8px">${impTxt} The full table is on the Club tab.</p>`:""}`;
}
function offerCard(o, key){
  const ct = tierOf(S.club), cl = TIERS[ct].pr, ol = TIERS[o.tier].pr, isRenew = key==="renew";
  const abroad = TIERS[o.tier].country!==TIERS[ct].country ? `<span class="pill">Move to ${TIERS[o.tier].country}</span>` : "";
  const pill = (isRenew ? `<span class="pill">Current club</span>` : ol>cl+.05?`<span class="pill up">Step up</span>`:ol<cl-.05?`<span class="pill down">Step down</span>`:o.tier===ct?`<span class="pill">Same league</span>`:`<span class="pill">Same level</span>`) + abroad;
  const raise = Math.round((o.wage/S.wage-1)*100);
  const eu = S.world.europe[o.club] ? `<span class="pill eu">${EURO[S.world.europe[o.club]].name}</span>` : "";
  const m = meta(o.club);
  return `<article class="offer ${o.status==="withdrawn"?"gone":""}" style="--c1:${m.c1}">
    <div class="pills">${pill}${eu}${o.triggered?`<span class="pill gold">Clause triggered</span>`:""}${o.status==="agreed"?`<span class="pill gold">Terms agreed</span>`:""}</div>
    <div class="club">${clubBadge(o.club, 30)}<span>${esc(o.club)}</span></div>
    <div class="label">${TIERS[o.tier].name}</div>
    <dl>
      ${isRenew?"":`<dt>Fee</dt><dd>${o.fee?money(o.fee):"Free transfer"}</dd>`}
      <dt>Wage</dt><dd>${wageTxt(o.wage)} <span class="${raise>=0?"up-t":"down-t"}">(${raise>=0?"+":""}${raise}%)</span></dd>
      <dt>Contract</dt><dd>${o.years} years</dd>
      <dt>Release clause</dt><dd>${o.clause?money(o.clause):"None"}</dd>
      ${isRenew?"":`<dt>Role</dt><dd>${o.role}</dd>`}
    </dl>
    ${o.msg?`<div class="msg">${esc(o.msg)}</div>`:""}
    ${o.status==="open"?`<button class="btn small primary" data-act="sign" data-k="${key}">Accept as is</button>
      <details class="nego-d" ${negoOpen.has(String(key))?"open":""}><summary>Negotiate · ${o.patience} round${o.patience===1?"":"s"} of talks left</summary>
      <div class="nego">
        <div class="field"><label for="ask-${key}">Ask for (£/wk)</label><input id="ask-${key}" type="text" class="money-in" inputmode="text" autocomplete="off" value="${moneyIn(roundWage(o.wage*1.15))}"></div>
        <div class="field"><label for="yrs-${key}">Years</label><select id="yrs-${key}">${[1,2,3,4,5].map(y=>`<option ${y===o.years?"selected":""}>${y}</option>`).join("")}</select></div>
        <div class="field" style="grid-column:1/-1"><label for="cl-${key}">Release clause (€m, blank for none)</label><input id="cl-${key}" type="number" min="0" step="0.5" inputmode="decimal" value="${o.clause?Math.round(o.clause/1e5)/10:""}" placeholder="${o.policy==="none"?"This club won't include one":"e.g. "+Math.round(o.minClause*1.1/1e6*10)/10}"></div>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn small" data-act="nego" data-k="${key}">Put these terms to them</button></div></details>`
    : o.status==="agreed" ? `<button class="btn primary" data-act="sign" data-k="${key}">Sign ${isRenew?"new deal":"for "+esc(o.club)}</button>` : ""}
  </article>`;
}
function windowPanel(){
  const P = S.pending, last = S.history[S.history.length-1];
  const diff = last.after - last.before, pct = last.before? Math.round(diff/last.before*100) : 0, f = P.f;
  const fx = v => "×" + v.toFixed(2);
  const free = S.years<=0, sim = S.sim, lg = sim && sim.comps.find(c=>c.code==="league");
  const offers = [P.offers.renewal, ...P.offers.list].filter(Boolean), loans = P.offers.loans || [];
  // the season in a few lines: where the club finished, your value, anything you won
  const head = `<div class="win-tag">☀ Summer transfer window</div>
    <div class="win-sum">${clubBadge(last.club, 46)}<div><h2 style="margin:0">${last.season} · ${esc(last.club)}</h2>
      <p class="hint">${lg ? `${esc(lg.out)}. ${esc(lg.outcome)}.` : ""}</p></div></div>
    <div class="row win-val"><div><div class="label">New market value</div><div class="value-big">${money(last.after)}</div></div>
      <div class="delta ${diff>=0?"up":"down"}">${diff>=0?"▲":"▼"} ${money(Math.abs(diff))} (${pct>0?"+":""}${pct}%)</div></div>
    ${P.won.length ? `<div class="pills" style="margin-top:10px">${P.won.map(w=>`<span class="pill gold">🏆 ${esc(w.name)}</span>`).join("")}</div>` : ""}
    ${P.tour?`<div class="ref" style="margin-top:12px"><strong>${esc(P.tour.name)}:</strong> ${esc(P.tour.nation)} · ${esc(P.tour.result==="Winners"?"champions":P.tour.result.toLowerCase())} · you played ${P.tour.apps} game${P.tour.apps===1?"":"s"} with ${P.tour.g} goal${P.tour.g===1?"":"s"} and ${P.tour.a} assist${P.tour.a===1?"":"s"}.</div>`:""}`;
  const offersView = `
    ${P.loanEnded?`<p class="ref" style="margin-bottom:10px"><strong>Loan over.</strong> Your season at ${esc(P.loanEnded)} is done and you're back at ${esc(S.club)}.</p>`:""}
    ${P.injuries&&P.injuries.filter(i=>i.tier!=="small").length?`<p class="ref" style="margin-bottom:10px"><strong>Injury-hit season.</strong> ${P.injuries.filter(i=>i.tier!=="small").map(i=>esc(i.name)).join(", ")}. Clubs have taken it into account.</p>`:""}
    ${P.loanAsk?`<p class="ref bad" style="margin-bottom:10px"><strong>${esc(S.club)} want you to go out on loan.</strong> After ${S.badStreak} seasons without kicking on, they want you playing regularly at a lower level. Staying isn't an option this summer: pick a loan or a permanent move.</p>`
      : P.listed?`<p class="ref bad" style="margin-bottom:10px"><strong>${esc(S.club)} have transfer-listed you</strong> after ${S.badStreak} poor seasons in a row. Staying isn't an option: sign for someone or go out on loan. Clubs know you're available, so fees are lower.</p>`
      : P.sale==="cashin"?`<p class="ref" style="margin-bottom:10px"><strong>${esc(S.club)} are ready to sell you.</strong> They'll listen to offers and won't offer a new deal. You can still stay and see out your contract. Details are in your inbox.</p>`
      : P.sale==="makeway"?`<p class="ref" style="margin-bottom:10px"><strong>${esc(S.club)} want to move you on</strong> to make room for younger players. You can stay, but only on a short deal with lower wages. Details are in your inbox.</p>`
      : P.stoodBy?`<p class="ref" style="margin-bottom:10px"><strong>${esc(S.club)} are standing by you.</strong> A poor season, but your loyalty (${loyaltyOf(S.club)}/100, ${loyaltyLevel(loyaltyOf(S.club)).toLowerCase()}) has bought you time.</p>`
      : P.warn?`<p class="ref" style="margin-bottom:10px"><strong>The manager isn't happy.</strong> That was a poor season. Another one like it and ${esc(S.club)} will push you out.</p>`:""}
    <p class="hint">${free?(TIERS[tierOf(S.club)].pool && TIERS[tierOf(S.club)].country!=="England" ? `<strong>${esc(S.club)} went down, so your relegation clause lets you leave for free.</strong> Pick a new club.` : `<strong>Your contract has run out.</strong> You're a free agent, so clubs can sign you without a fee.`):`You earn ${wageTxt(S.wage)} with ${S.years} year${S.years===1?"":"s"} left at ${esc(S.club)}.`} Accept an offer as it is, or negotiate for a higher wage, a different length or a release clause. Push too hard and a club walks away.</p>
    ${P.offers.demand!=null?`<div class="row" style="margin-top:10px;gap:14px"><span class="label">Demand for you</span><div class="meter" style="flex:1;min-width:120px;max-width:260px"><span style="width:${Math.round(P.offers.demand*100)}%"></span></div><strong>${P.offers.demand>.8?"Very high":P.offers.demand>.6?"High":P.offers.demand>.4?"Moderate":P.offers.demand>.2?"Low":"Very low"} · ${P.offers.list.length} club${P.offers.list.length===1?"":"s"} interested</strong></div>`:""}
    ${S.release&&S.years>0?`<p class="hint" style="margin-top:6px">Your release clause is ${money(S.release)}. Any club that pays it can talk to you directly.</p>`:""}
    ${offers.length ? `<div class="offers" style="margin-top:12px">${P.offers.renewal?offerCard(P.offers.renewal,"renew"):""}${P.offers.list.map((o,i)=>offerCard(o,i)).join("")}</div>` : `<p class="empty" style="margin-top:12px">No offers this summer.</p>`}`;
  const reportView = `${sim?seasonResults(sim, last):""}
    ${P.won.length?`<h3>New in the cabinet</h3><div class="cabinet" style="margin-bottom:16px">${P.won.map(w=>`<div class="tro themed" style="${themeVars(trophyTheme(w.kind, w.name))}">${trophyIcon(w.kind, w.name)}<div class="tn">${esc(w.name)}</div><div class="ts">${last.season}</div></div>`).join("")}</div>`:""}
    <h3>How the valuation was built</h3>
    <div class="factors">
      <div class="factor"><div class="label">${TIERS[last.tier].short} base</div><div class="v">${money(f.base)}</div></div>
      <div class="factor"><div class="label">Age ${last.age}</div><div class="v">${fx(f.age)}</div></div>
      <div class="factor"><div class="label">Position</div><div class="v">${fx(f.pos)}</div></div>
      <div class="factor"><div class="label">Contract left</div><div class="v">${fx(f.contract)}</div></div>
      <div class="factor"><div class="label">Club stature</div><div class="v">${fx(f.club)}</div></div>
      <div class="factor"><div class="label">Team season</div><div class="v">${fx(f.team)}</div></div>
      <div class="factor"><div class="label">Your output</div><div class="v">${fx(f.perf)}</div></div>
    </div>
    <p class="hint" style="margin-top:8px">Like Transfermarkt, the new figure moves 70% of the way from your old value toward this season's estimate, so one freak season doesn't rewrite everything.</p>`;
  return `<section class="panel pop win-summer" id="actionPanel">
    ${head}
    ${subTabs("window", [["offers", `Offers (${offers.length})`, offersView], loans.length && ["loans", `Loans (${loans.length})`, `<p class="hint" style="margin-bottom:10px">One season away. ${esc(S.club)} keep your contract and pay your wage.</p><div class="offers">${loans.map((o,i)=>loanCard(o,i)).join("")}</div>`], ["season", "Season report", reportView]])}
    <div class="row win-act">
      ${[...P.offers.list, P.offers.renewal].filter(Boolean).every(o=>o.status==="withdrawn")?`<button class="btn primary" data-act="reoffer">Get my agent to find new offers</button>`:""}
      ${!free && !P.listed && !P.loanAsk?`<button class="btn" data-act="stay">Stay and see out my contract</button>`:(!P.offers.renewal?`<span class="hint">${esc(S.club)} haven't offered a new deal.${free&&!P.offers.list.length?` No other club has made an offer either: retire, or ask your agent to keep looking.`:""}</span>`:"")}
      ${S.age>=31||(free&&!P.offers.list.length)?`<button class="btn" data-act="retire">Retire</button>`:""}
      ${S.age===41?`<span class="hint">Next season will be your last: nobody plays on past 42.</span>`:S.age>=42?`<span class="hint">Your career ends this summer, whatever you choose.</span>`:""}
    </div>
  </section>`;
}
function loanCard(o, i){
  const m = meta(o.club), T = TIERS[o.tier];
  const abroad = T.country!==TIERS[tierOf(S.club)].country ? `<span class="pill">${T.country}</span>` : "";
  return `<article class="offer" style="--c1:${m.c1}">
    <div class="pills"><span class="pill gold">Loan</span>${abroad}</div>
    <div class="club">${clubBadge(o.club, 30)}<span>${esc(o.club)}</span></div>
    <div class="label">${T.name}</div>
    <dl><dt>Length</dt><dd>One season</dd><dt>Role</dt><dd>Guaranteed starter</dd><dt>Wage</dt><dd>${wageTxt(S.wage)}, paid by ${esc(S.club)}</dd></dl>
    <button class="btn primary" data-act="loan" data-k="${i}">Go on loan to ${esc(o.club)}</button>
  </article>`;
}
function retiredPanel(){
  const t = totals();
  return `<section class="panel pop" id="actionPanel">
    <h2>Career over</h2>
    <p>${esc(S.player.name)} hung up the boots after ${t.seasons} season${t.seasons===1?"":"s"}: ${t.apps} appearances, ${t.g} goals and ${t.a} assists across ${t.clubs} club${t.clubs===1?"":"s"}, ${S.trophies.length} trophies and awards, and ${gbp(S.earnings)} earned. Peak value ${money(t.peak)}.</p>
    <div class="row"><button class="btn primary" data-act="new">Start a new career</button></div>
  </section>`;
}
function inboxPanel(){
  const notes = (S.notes||[]).slice().reverse();
  if (!notes.length) return `<section class="panel"><h2>Inbox</h2><p class="empty">Messages from your club, your agent and the season round-up land here.</p></section>`;
  const seen = S.notesSeen ?? 0, total = S.notes.length;
  const icon = {good:"✓", bad:"!", warn:"!", club:"✉", info:"•"};
  let lastSeason = null;
  return `<section class="panel"><h2>Inbox</h2><div class="inbox">${notes.map((n,i)=>{
    const head = n.season!==lastSeason ? `<div class="label inbox-season">${n.season}</div>` : ""; lastSeason = n.season;
    const fresh = (total-1-i) >= seen;
    const revSeason = n.rev || (n.title==="Your season review is in" ? n.season : null);
    const h = revSeason ? S.history.find(x=>x.season===revSeason && x.review) : null;
    if (h) return `${head}<details class="msg-item msg-rev k-club ${fresh?"fresh":""}" ${i===0&&fresh?"open":""}><summary><div class="sumgrid"><span class="msg-ic" aria-hidden="true">✎</span><div><div class="msg-t">${esc(h.season)} season review</div><p>${esc(h.review.paper.headline)} · rated ${h.review.paper.rating.toFixed(1)}/10. Tap to read the papers, the manager, the fans and the club.</p></div></div></summary>${reviewBody(h)}</details>`;
    if (n.ask) return `${head}<article class="msg-item k-club ${fresh?"fresh":""}"><span class="msg-ic" aria-hidden="true">✉</span><div><div class="msg-t">${esc(n.title)}</div><p>${esc(n.text)}</p>
      <div class="row" style="margin-top:8px">${n.ask.answer===null||n.ask.answer===undefined
        ? `<button class="btn small primary" data-act="intl-yes" data-k="${esc(n.ask.id)}">I'm available</button><button class="btn small" data-act="intl-no" data-k="${esc(n.ask.id)}">Not this time</button>`
        : `<span class="pill ${n.ask.answer?"up":"down"}">${n.ask.answer?"You said you're available":"You declined"}</span><button class="btn small" data-act="${n.ask.answer?"intl-no":"intl-yes"}" data-k="${esc(n.ask.id)}">Change</button>`}</div></div></article>`;
    return `${head}<article class="msg-item k-${n.kind} ${fresh?"fresh":""}"><span class="msg-ic" aria-hidden="true">${icon[n.kind]||"•"}</span><div><div class="msg-t">${esc(n.title)}</div><p>${esc(n.text)}</p></div></article>`; }).join("")}</div></section>`;
}
function cabinetPanel(){
  if (!S.trophies.length) return `<section class="panel"><h2>Trophy cabinet</h2><p class="empty">Empty for now. Win a league, a cup, a play-off final or a personal award and it goes on the shelf here.</p><div class="shelf" style="margin-top:14px"></div></section>`;
  const groups = {}; S.trophies.forEach(t=>{ (groups[t.name] ||= {kind:t.kind, items:[]}).items.push(t); });
  const order = {ballon:-2, intl:-1, europe:0, league:1, cup:2, playoff:3, boot:4, medal:5};
  const team = S.trophies.filter(t=>!["boot","medal","ballon"].includes(t.kind)).length;
  const intlCount = S.trophies.filter(t=>t.kind==="intl").length;
  return `<section class="panel"><h2>Trophy cabinet</h2>
    <p class="hint" style="margin-bottom:14px">${team} team trophies · ${S.trophies.length-team} personal awards</p>
    <div class="cabinet">${Object.entries(groups).sort((a,b)=>order[a[1].kind]-order[b[1].kind]).map(([name,g])=>`<div class="tro themed" style="${themeVars(trophyTheme(g.kind, name))}">${trophyIcon(g.kind, name)}<div class="tn">${esc(name)}</div>${g.items.length>1?`<div class="tc">×${g.items.length}</div>`:""}<div class="ts">${g.items.map(i=>`${i.season} · ${esc(i.club)}`).join("<br>")}</div></div>`).join("")}</div>
    <div class="shelf" style="margin-top:14px"></div></section>`;
}
function zoneOf(t,pos,n){
  const T = TIERS[t];
  if (isTop(t)){ const [q1,q2,q3] = T.eu; return pos<=q1?"z-ucl":pos<=q1+q2?"z-uel":pos<=q1+q2+q3?"z-uecl":pos>n-T.down?"z-rel":(T.relPO&&pos===n-T.down)?"z-po":""; }
  return pos<=T.up?"z-up":(pos>=T.po[0]&&pos<=T.po[1])?"z-po":pos>n-T.down?"z-rel":"";
}
function clubPanel(){
  const c = S.club, m = meta(c), t = tierOf(c), ex = expectedFinish(c), recs = (S.records[c]||[]).slice(-6);
  const eu = S.world.europe[c];
  const strPct = clamp((strOf(c)-TIERS[t].lo)/(TIERS[t].hi-TIERS[t].lo),0,1)*100;
  const allR = S.records[c]||[], then = allR.length>=3 ? allR[allR.length-3] : allR[0];
  const absNow = strOf(c), trendV = then && then.str!=null ? absNow - then.str : 0;
  const trend = trendV>1.5 ? `<span class="trend up-t">▲ On the rise</span>` : trendV<-1.5 ? `<span class="trend down-t">▼ In decline</span>` : `<span class="trend">● Holding steady</span>`;
  const startT = ALLKEYS.find(k=>TIER_LISTS[k] && TIER_LISTS[k].includes(c)) ?? t;
  const journey = startT!==t ? (TIERS[startT].level>TIERS[t].level ? `Up from the ${TIERS[startT].name} since 2026.` : `Down from the ${TIERS[startT].name} since 2026.`) : "";
  const top = isTop(t), Tt = TIERS[t];
  const status = Tt.pool ? "Outside the top flight" : ex.rank<=2 ? (top?"Title contenders":"Promotion favourites") : ex.rank<=(top?6:Tt.po[1]) ? (top?"Pushing for Europe":"In the promotion hunt") : ex.rank>ex.n-(Tt.down+2) ? "Fighting relegation" : "Mid-table side";
  const ls = S.sim || S.lastSim;
  const ltKey = ls ? Object.keys(ls.tables).find(k=>ls.tables[k].some(r=>r.n===c)) : null, lt = ltKey!=null ? keyOf(ltKey) : null;
  const lastSim = lt ? {...ls, tier:lt, poWinner: lt===ls.tier ? ls.poWinner : null} : null;
  const tbl = lastSim ? ls.tables[lt] : null;
  return `<section class="panel">
    <div class="clubhead">${clubBadge(c, 84)}<div><div class="cn">${esc(c)}</div><div class="label">${esc(m.nick||"")}${m.nick?" · ":""}${TIERS[t].name}</div></div></div>
    ${m.bio?`<p style="max-width:65ch">${esc(m.bio)}</p>`:`<p class="hint">Your own club, founded in 2026. Its history starts with you.</p>`}
    <div class="kv">
      <div><div class="label">Founded</div><div class="v">${esc(m.founded||"—")}</div></div>
      <div><div class="label">Ground</div><div class="v">${esc(m.ground||"—")}</div></div>
      <div><div class="label">Europe this season</div><div class="v">${eu?EURO[eu].name:"None"}</div></div>
      <div><div class="label">Outlook</div><div class="v">${status}</div></div>
      <div><div class="label">Fortunes</div><div class="v">${trend}</div></div>
      <div><div class="label">Club model</div><div class="v">${clubModel(c).label}</div></div>
      <div><div class="label">Biggest fee they'd pay</div><div class="v">${money(roundTM(budgetOf(c,t)))}</div></div>
      ${SPEND_2026[c]!=null||SPEND_EST[c]!=null?`<div><div class="label">Summer 2026 spend</div><div class="v">${money((SPEND_2026[c]??SPEND_EST[c])*1e6)}${SPEND_2026[c]==null?" (est.)":""}</div></div>`:""}
      <div><div class="label">Manager</div><div class="v">${esc(mgr(c).name)}</div></div>
      <div><div class="label">His trust in you</div><div class="v">${Math.round(mgr(c).trust)}/100 · ${trustLabel(mgr(c).trust)}${mgr(c).seasons?` (${mgr(c).seasons} season${mgr(c).seasons===1?"":"s"} together)`:""}</div></div>
      <div><div class="label">Your loyalty</div><div class="v">${loyaltyOf(c)}/100 · ${loyaltyLevel(loyaltyOf(c))}</div></div>
    </div>
    <p class="hint" style="margin-top:10px">${clubModel(c).text} ${journey}</p>
    <p class="hint">Loyalty grows with every season you play well, every trophy, every new contract and every bigger club you turn down. ${patience(c)>2?`They'll put up with ${patience(c)-1} poor seasons in a row before pushing you out.`:"At this level, two poor seasons in a row and they'll push you out."}</p>
    <h3>Squad strength · ${TIERS[t].pool?"not in a simulated league":`${ord(ex.rank)} of ${ex.n} in the league`} · clubs grow or fade with results, promotion and Champions League money</h3>
    <div class="meter"><span style="width:${strPct.toFixed(0)}%"></span></div>
    <h3>Recent league finishes</h3>
    ${recs.length?`<div class="finishes">${recs.map(r=>`<div class="fin"><div class="p">${ord(r.pos)}</div><div class="s">${r.s} · ${TIERS[r.t].short}</div></div>`).join("")}</div>`:`<p class="empty">No seasons simulated yet with this club.</p>`}
  </section>`;
}
function leaguesTab(){
  const ls = S.sim || S.lastSim, mv = movements(ls);
  const ct = tierOf(S.club), def = TIERS[ct].pool ? TIERS[ct].feeds : ct;
  const k = keyOf(leagueView ?? def), T = TIERS[k];
  const opts = LEAGUES.map(x=>`<option value="${x}" ${x===k?"selected":""}>${TIERS[x].name}${TIERS[x].country!=="England"?" · "+TIERS[x].country:""}</option>`).join("");
  const tb = ls && ls.tables[k], m = mv[k] || {up:[],down:[],inUp:[],inDown:[]};
  const status = n => m.up.some(x=>x.n===n) ? `<span class="up-t">▲ ${esc(TIERS[m.up.find(x=>x.n===n).to].short)}</span>` : m.down.some(x=>x.n===n) ? `<span class="down-t">▼ ${esc(TIERS[m.down.find(x=>x.n===n).to].short)}</span>` : "";
  const next = S.world.tiers[k].slice().sort((a,b)=>strOf(b)-strOf(a));
  const newIn = new Set([...m.inUp, ...m.inDown].map(x=>x.n));
  return `<section class="panel lg-pick">
    <div class="field"><label for="leagueSel">League</label><select id="leagueSel">${opts}</select></div>
    <p class="hint" style="margin-top:8px">${T.country==="England" ? (k===1 ? `Bottom ${T.down} go down to the Championship.` : `Top ${T.up} go up automatically, ${ord(T.po[0])} to ${ord(T.po[1])} play off for one more place, bottom ${T.down} go down${k===5?" out of the National League":""}.`)
      : `Bottom ${T.down} go down to the ${TIERS[T.second].name}${T.relPO?", and the club just above them plays off to stay up":""}. The best ${TIERS[T.second].name} sides come up to replace them.`}</p>
  </section>
  ${lgGet(k) && !S.sim ? `<section class="panel"><h2>${seasonLabel(S.season)} so far · matchweek ${lgGet(k).r}</h2>${lgGet(k).r ? lgBox(k, "tab") : `<p class="empty">The first round hasn't been played yet.</p>`}</section>` : ""}
  ${tb?`<section class="panel"><h2>${ls.season} final table</h2>
    <div class="tablewrap"><table class="lt"><thead><tr><th></th><th class="n">#</th><th>Club</th><th class="n">GD</th><th class="n">Pts</th><th>Next season</th></tr></thead><tbody>
    ${tb.map((r,i)=>`<tr class="${r.n===S.club?"me":""}"><td class="z ${zoneOf(k,i+1,tb.length)}"></td><td class="n">${i+1}</td><td><span class="lg-club">${clubBadge(r.n, 18)}<span class="lg-cn">${esc(r.n)}</span></span></td><td class="n">${r.gd>0?"+":""}${r.gd}</td><td class="n">${r.pts}</td><td>${status(r.n)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="legend">${isTop(k)?`<span><i class="z-ucl"></i>Champions League</span><span><i class="z-uel"></i>Europa League</span><span><i class="z-uecl"></i>Conference League</span>`:`<span><i class="z-up"></i>Promotion</span><span><i class="z-po"></i>Play-offs</span>`}<span><i class="z-rel"></i>Relegation</span></div>
    ${S.sim && lgGet(k) ? `<h3>The season's top players</h3>${lgBox(k, "final")}` : ""}
  </section>`:lgGet(k) ? "" : `<section class="panel"><h2>Final table</h2><p class="empty">Tables appear here after your first season.</p></section>`}
  ${sqMovesHTML(k)}
  <details class="panel ss-panel"><summary><h2>${S.sim?"Next season":"This season"} in ${esc(theName(k))}</h2></summary>
    ${newIn.size?`<p class="hint" style="margin-bottom:10px">New ${S.sim?"next":"this"} season: ${[...m.inDown.map(x=>`${esc(x.n)} (down from ${esc(theName(x.from))})`), ...m.inUp.map(x=>`${esc(x.n)} (up from ${esc(theName(x.from))})`)].join(", ")}.</p>`:""}
    <div class="clublist">${next.map(n=>`<span class="cl ${n===S.club?"me":""}">${clubBadge(n, 18)}${esc(n)}${newIn.has(n)?` <span class="pill ${m.inDown.some(x=>x.n===n)?"down":"up"}">New</span>`:""}</span>`).join("")}</div>
    <p class="hint" style="margin-top:10px">Sorted by current squad strength.</p>
  </details>
  ${lgHonoursHTML(k)}`;
}
function statsTab(part){
  if (!S.history.length) return part==="totals" ? `<section class="panel"><h2>Statistics</h2><p class="empty">Your numbers appear here after your first season, split by club and by competition.</p></section>` : "";
  const showCS = DEF.includes(S.player.pos);
  const blank = () => ({apps:0,g:0,a:0,cs:0});
  const add = (x,c) => { x.apps+=c.apps; x.g+=c.g; x.a+=c.a; x.cs+=(c.cs||0); };
  const clubs = [], byClub = {}, total = {...blank(), comps:{}, seasons:0};
  S.history.forEach(h=>{
    let c = byClub[h.club];
    if (!c){ c = byClub[h.club] = {club:h.club, first:h.season, last:h.season, seasons:0, loans:0, tot:blank(), comps:{}, trophies:0}; clubs.push(c); }
    if (h.loan) c.loans++;
    if (c.last!==h.season || !c.seasons) c.seasons++;
    c.last = h.season;
    total.seasonSet = (total.seasonSet || new Set()).add(h.season); total.seasons = total.seasonSet.size;
    Object.entries(h.comps).forEach(([k0,v])=>{ const k = k0==="league" ? "L:"+h.tier : k0; add(c.tot,v); add(total,v); add(c.comps[k] ||= blank(), v); add(total.comps[k] ||= blank(), v); });
  });
  S.trophies.forEach(t=>{ if (byClub[t.club]) byClub[t.club].trophies++; });
  // each league kept separate (Premier League apart from League One, and so on), then cups, then Europe
  const order = [...LEAGUES.map(t=>"L:"+t), "fa","lc","eflt","fat",...Object.keys(cupNames),"UCL","UEL","UECL"];
  const label = k => k.startsWith("L:") ? `${TIERS[keyOf(k.slice(2))].name}${TIERS[keyOf(k.slice(2))].country!=="England"?" · "+TIERS[keyOf(k.slice(2))].country:""}` : compName(k);
  const sub = (obj, keys) => keys.reduce((x,k)=>{ if (obj[k]) add(x,obj[k]); return x; }, blank());
  const compRows = obj => {
    const lk = order.filter(k=>k.startsWith("L:") && obj[k]), ck = order.filter(k=>!k.startsWith("L:") && obj[k]);
    const row = (name, v, cls="") => `<tr class="${cls}"><td class="lead">${name}</td><td class="n" data-l="Apps">${v.apps}</td><td class="n" data-l="Goals">${v.g}</td><td class="n" data-l="Assists">${v.a}</td><td class="n" data-l="G+A">${v.g+v.a}</td>${showCS?`<td class="n" data-l="Clean sh.">${v.cs}</td>`:""}</tr>`;
    return lk.map(k=>row(label(k), obj[k])).join("")
      + (lk.length>1 ? row("All league games", sub(obj, lk), "subrow") : "")
      + ck.map(k=>row(label(k), obj[k])).join("");
  };
  const head = first => `<thead><tr><th>${first}</th><th class="n">Apps</th><th class="n">Goals</th><th class="n">Assists</th><th class="n">G+A</th>${showCS?`<th class="n">Clean sheets</th>`:""}</tr></thead>`;
  const per90 = total.apps ? ((total.g+total.a)/total.apps).toFixed(2) : "0.00", tt = totals();
  // each season's share of the team's minutes (both clubs in a season with a January move), averaged over the seasons
  // played in the match centre
  const bySeason = {}; S.history.forEach(h=>{ if (!h.tot || !h.tot.of) return; const x = bySeason[h.season] ||= {mins:0, of:0}; x.mins += h.tot.mins; x.of += h.tot.of; });
  const shares = Object.values(bySeason).map(x=>x.mins/x.of), minsAvg = shares.length ? Math.round(shares.reduce((a,b)=>a+b, 0)/shares.length*100) + "%" : "–";
  if (part==="totals") return `
  <section class="panel">
    <h2>Career totals</h2>
    <div class="totals four">
      <div class="total big"><div class="label">Apps</div><div class="v">${total.apps}</div></div>
      <div class="total big"><div class="label">Goals</div><div class="v">${total.g}</div></div>
      <div class="total big"><div class="label">Assists</div><div class="v">${total.a}</div></div>
      ${showCS?`<div class="total big"><div class="label">Clean sheets</div><div class="v">${total.cs}</div></div>`:""}
      <div class="total"><div class="label">G+A a game</div><div class="v">${per90}</div></div>
      <div class="total"><div class="label">Minutes played</div><div class="v">${S.history.reduce((n,h)=>n + (h.tot.mins||0), 0).toLocaleString("en-GB")}</div></div>
      <div class="total"><div class="label">Share of minutes</div><div class="v">${minsAvg}</div></div>
      <div class="total"><div class="label">Avg rating</div><div class="v">${(r => r ? r.toFixed(2) : "–")(avgRating(S.history.reduce((t,h)=>({rs:t.rs + (h.tot.rs||0), rn:t.rn + (h.tot.rn||0)}), {rs:0, rn:0})))}</div></div>
      <div class="total"><div class="label">Player of the Match</div><div class="v">${S.history.reduce((n,h)=>n + (h.tot.potm||0), 0)}</div></div>
      <div class="total"><div class="label">Cards</div><div class="v cards-v">${lvCardIc("y")}${S.history.reduce((n,h)=>n + (h.tot.yc||0), 0)} ${lvCardIc("r")}${S.history.reduce((n,h)=>n + (h.tot.rc||0), 0)}</div></div>
      <div class="total"><div class="label">Clubs</div><div class="v">${clubs.length}</div></div>
      <div class="total"><div class="label">Trophies</div><div class="v">${S.trophies.length}</div></div>
      <div class="total"><div class="label">Peak value</div><div class="v">${money(tt.peak)}</div></div>
      <div class="total"><div class="label">Earned</div><div class="v">${gbp(S.earnings)}</div></div>
    </div>
  </section>`;
  if (part==="clubs") return `
  <section class="panel">
    <h2>By club</h2>
    <div class="tablewrap"><table class="rt" style="min-width:560px"><thead><tr><th>Club</th><th>Seasons</th><th class="n">Apps</th><th class="n">Goals</th><th class="n">Assists</th><th class="n">G+A</th>${showCS?`<th class="n">CS</th>`:""}<th class="n">Trophies</th></tr></thead><tbody>
      ${clubs.map(c=>{ const m = meta(c.club); return `<tr><td class="lead"><span class="row" style="gap:8px;flex-wrap:nowrap">${clubBadge(c.club, 20)}${esc(c.club)}${c.loans?`<span class="pill gold">Loan</span>`:""}</span></td><td class="sea">${c.first===c.last?c.first:`${c.first}–${c.last.slice(-2)}`} · ${c.seasons} season${c.seasons===1?"":"s"}</td><td class="n" data-l="Apps">${c.tot.apps}</td><td class="n" data-l="Goals">${c.tot.g}</td><td class="n" data-l="Assists">${c.tot.a}</td><td class="n" data-l="G+A">${c.tot.g+c.tot.a}</td>${showCS?`<td class="n" data-l="Clean sh.">${c.tot.cs}</td>`:""}<td class="n" data-l="Trophies">${c.trophies}</td></tr>`; }).join("")}
      <tr class="totalrow"><td class="lead">Total</td><td class="sea">${total.seasons} season${total.seasons===1?"":"s"}</td><td class="n" data-l="Apps">${total.apps}</td><td class="n" data-l="Goals">${total.g}</td><td class="n" data-l="Assists">${total.a}</td><td class="n" data-l="G+A">${total.g+total.a}</td>${showCS?`<td class="n" data-l="Clean sh.">${total.cs}</td>`:""}<td class="n" data-l="Trophies">${S.trophies.length}</td></tr>
    </tbody></table></div>
  </section>`;
  return `
  <section class="panel">
    <h2>By competition</h2>
    <div class="tablewrap"><table class="rt" style="min-width:460px">${head("Competition")}<tbody>${compRows(total.comps)}</tbody></table></div>
    <h3>Each club, competition by competition</h3>
    <div class="col" style="gap:10px">${clubs.map(c=>`<details class="clubsplit"><summary>${clubBadge(c.club, 18)}${esc(c.club)}<span class="hint cs-sum">${c.tot.apps} apps · ${c.tot.g} goals · ${c.tot.a} assists</span></summary>
      <div class="tablewrap"><table class="rt" style="min-width:460px">${head("Competition")}<tbody>${compRows(c.comps)}${(()=>{ const v=c.tot; return `<tr class="totalrow"><td class="lead">Total</td><td class="n" data-l="Apps">${v.apps}</td><td class="n" data-l="Goals">${v.g}</td><td class="n" data-l="Assists">${v.a}</td><td class="n" data-l="G+A">${v.g+v.a}</td>${showCS?`<td class="n" data-l="Clean sh.">${v.cs}</td>`:""}</tr>`; })()}</tbody></table></div></details>`).join("")}</div>
  </section>`;
}
function careerPanels(part){
  const hist = S.history.slice().reverse();
  const cards = hist.map((h,i)=>{
    const m = meta(h.club), dv = h.after - h.before;
    const fin = h.finish ? `${ord(h.finish.pos)} ${TIERS[h.finish.tier].short}` : TIERS[h.tier].short;
    const cups = (h.results||[]).filter(r=>r.code!=="league").map(r=>`<span class="rchip ${/Winners/.test(r.res)?"win":""}">${esc(compName(r.code))} · ${esc(r.res)}</span>`).join("");
    const comps = Object.entries(h.comps).filter(([,c])=>c.apps>0);
    const def = DEF.includes(S.player.pos);
    const inj = (h.injuries||[]).filter(x=>x.tier!=="small");
    return `<details class="ss" ${i===0?"open":""}>
      <summary>
        <div class="ss-head"><span class="ss-yr">${h.season}</span>${clubBadge(h.club, 20)}<span class="ss-club">${esc(h.club)}</span>${h.loan?`<span class="pill gold">Loan</span>`:""}<span class="ss-fin">${esc(fin)}</span></div>
        <div class="ss-stats">
          <div><span class="label">Age</span><b>${h.age}</b></div>
          <div><span class="label">Apps</span><b>${h.tot.apps}</b></div>
          <div><span class="label">Minutes</span><b>${minsPct(h.tot)}</b></div>
          <div><span class="label">Rating</span><b>${avgRating(h.tot) ? avgRating(h.tot).toFixed(2) : "–"}</b></div>
          <div><span class="label">Goals</span><b>${h.tot.g}</b></div>
          <div><span class="label">Assists</span><b>${h.tot.a}</b></div>
          <div><span class="label">Wage</span><b class="sm">${h.wage?wageTxt(h.wage):"—"}</b></div>
          <div><span class="label">Value</span><b class="sm">${money(h.after)} <i class="${dv>=0?"up-t":"down-t"}">${dv>=0?"▲":"▼"}</i></b></div>
        </div>
      </summary>
      <div class="ss-body">
        ${cups?`<div class="rchips">${cups}</div>`:""}
        ${comps.length?`<div class="ss-comps"><div class="ss-cr ss-ch"><span>Competition</span><span>Apps</span><span>Goals</span><span>Assists</span>${def?`<span>CS</span>`:""}</div>
          ${comps.map(([k,c])=>`<div class="ss-cr"><span>${esc(k==="league"?TIERS[h.tier].name:compName(k))}</span><span>${c.apps}</span><span>${c.g}</span><span>${c.a}</span>${def?`<span>${c.cs||0}</span>`:""}</div>`).join("")}</div>`:`<p class="empty">No appearances.</p>`}
        ${h.trophies&&h.trophies.length?`<div class="pills" style="margin-top:10px">${h.trophies.map(t=>`<span class="pill gold">🏆 ${esc(t)}</span>`).join("")}</div>`:""}
        ${inj.length?`<div class="pills" style="margin-top:8px">${inj.map(x=>`<span class="pill down">${esc(x.name)}</span>`).join("")}</div>`:""}
      </div>
    </details>`; }).join("");
  const moves = S.log.slice().reverse().map(m=>`<li><span class="label">${esc(m.season)}</span><span>${esc(m.text)}</span><strong>${m.fee==null?"":m.fee?money(m.fee):"Free"}</strong></li>`).join("");
  if (part==="value") return `<section class="panel chart"><h2>Market value</h2>${chart()}</section>`;
  if (part==="seasons") return `
  <section class="panel">
    <h2>Season by season</h2>
    ${cards?`<div class="seasons">${cards}</div><p class="hint" style="margin-top:10px">Tap a season to see how far the team went in each cup and your numbers in every competition.</p>`:`<p class="empty">No seasons played yet.</p>`}
  </section>`;
  return `
  <section class="panel">
    <h2>Transfers & contracts</h2>
    ${moves?`<ol class="tl-list moves">${moves}</ol>`:`<p class="empty">No moves yet.</p>`}
  </section>`;
}
// a tab's sections as sub-views behind a strip of buttons: every view is rendered, and a tap shows one without
// re-rendering the page (SUB remembers the choice for next time)
const SUB = {};
function subTabs(g, views){
  views = views.filter(Boolean);
  const cur = views.some(v=>v[0]===SUB[g]) ? SUB[g] : views[0][0];
  return `<div class="subtabs" role="group" aria-label="Show">${views.map(([k,l])=>`<button type="button" data-sub="${g}" data-sub-k="${k}" aria-pressed="${k===cur}">${l}</button>`).join("")}</div>
    ${views.map(([k,,html])=>`<div class="subview" data-sub="${g}" data-k="${k}" ${k===cur ? "" : "hidden"}>${html}</div>`).join("")}`;
}
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-sub-k]"); if (!b) return;
  const g = b.dataset.sub, k = b.dataset.subK; SUB[g] = k;
  document.querySelectorAll(`[data-sub="${g}"][data-sub-k]`).forEach(x=>x.setAttribute("aria-pressed", x.dataset.subK===k));
  document.querySelectorAll(`.subview[data-sub="${g}"]`).forEach(v=>{ v.hidden = v.dataset.k!==k; if (!v.hidden) uiEnter(v); });
});
// a view that's just been switched to eases in (its panels one after another, its bars filling); the class comes off
// again so a later redraw doesn't replay it
function uiEnter(el){ if (!el) return; el.classList.remove("ui-enter"); void el.offsetWidth; el.classList.add("ui-enter"); clearTimeout(el._ent); el._ent = setTimeout(()=>el.classList.remove("ui-enter"), 700); }
function compName(k){ return {league:"League", fa:"FA Cup", lc:"League Cup", eflt:"EFL Trophy", fat:"FA Trophy", ...cupNames, UCL:"UCL", UEL:"UEL", UECL:"UECL"}[k] || k; }

function statsBody(){
  return subTabs("stats", [["career", "Career", statsTab("totals") + careerPanels("value")], ["seasons", "Seasons", careerPanels("seasons")],
    S.history.length && ["clubs", "Clubs", statsTab("clubs") + statsTab("comps")], ["intl", "Country", intlPanel()], ["moves", "Moves", careerPanels("moves")]]);
}
// the league first (in season, the table as it stands); the club, and on phones the pyramid, behind the second button
function clubBody(t){
  return subTabs("club", [["league", "League", leaguesTab()], S.phase!=="retired" && ["squad", "Squad", sqSquadPanel()],
    ["club", "Club", clubPanel() + `<section class="panel pyr-m"><h3>${TIERS[t].country==="England"?"Where you are in the pyramid":"Playing abroad"}</h3>${pyramid(t)}</section>`]]);
}
function renderCareer(){
  const club = meta(S.club), t = tierOf(S.club), pl = S.player;
  const last = S.history[S.history.length-1], diff = last ? last.after - last.before : 0;
  $("#bandRight").innerHTML = `<span class="season-tag">${seasonLabel(S.season)}</span><button class="btn ghost" data-act="new">New career</button>${Hub.menuBtn()}`;
  if (S.phase==="stats") rollInjuries();   // decide injuries before building the stats form, so its limits match
  const action = (S.phase==="preview"||S.phase==="stats")?statsPanel():S.phase==="winter"?winterPanel():S.phase==="tournament"?tournamentPanel():S.phase==="window"?windowPanel():retiredPanel();
  S.notes ||= []; S.notesSeen ??= 0;
  const unread = S.notes.length - S.notesSeen;
  if (!["season","inbox","stats","club","training","cabinet","legacy"].includes(tab)) tab = {review:"inbox", leagues:"club", career:"stats"}[tab] || "season";
  const tabs = [["season","Season","Season"],["inbox","Inbox","Inbox"],["stats","Statistics","Stats"],["club","Club & leagues","Club"],["training","Training","Training"],["lab","Mini-game lab","Lab"],["cabinet","Trophies","Trophies"],["legacy","Legacy","Legacy"]];
  const body = tab==="season" ? action : tab==="inbox" ? inboxPanel() : tab==="stats" ? statsBody() : tab==="club" ? clubBody(t) : tab==="training" ? trainingBody() : tab==="legacy" ? boardPanel() : cabinetPanel();
  if (tab==="inbox" && unread>0){ setTimeout(()=>{ S.notesSeen = S.notes.length; save(); }, 0); }
  $("#app").innerHTML = `
  ${flash?`<p class="ref" role="status" style="margin:0 0 18px">${esc(flash)}</p>`:""}
  <div class="board">
    <div class="col">
      <section class="panel card ${cardOpen?"open":""}">
        <div class="card-top">${portrait(pl, club, pl.number)}<div class="card-pos">${pl.pos}</div></div>
        <div class="card-body">
          <p class="pname">${S.history.length ? `<button type="button" class="pname-link" data-act="my-profile" aria-label="Open ${esc(pl.name)}'s career profile">${esc(pl.name)}</button>` : esc(pl.name)}</p>
          <div class="clubline">${clubBadge(club.n, 20)}${esc(club.n)}${S.loan?`<span class="pill gold">On loan</span>`:""}</div>
          <div class="card-key">${S.attr?`<span><b>${mcOvr()}</b> OVR</span>`:""}${S.attr&&mcSeasonRating()!=null?`<span><b>${mcSeasonRating().toFixed(2)}</b> avg</span>`:""}<span><b>${money(S.value)}</b></span><span>Age <b>${S.age}</b></span>${S.phase!=="retired" ? `<button type="button" class="card-pen" data-penact="${penOwned() ? "open" : "shop"}" aria-label="${penOwned() ? "Edit your player" : "Edit your player: needs the Editor pen"}" title="${penOwned() ? "Edit your player" : "Needs the Editor pen"}">${PEN_IC()}</button>` : ""}</div>
          <button type="button" class="card-more" data-act="card-more" aria-expanded="${cardOpen}">${cardOpen?"Show less":"Full profile"}</button>
          <div class="card-extra">
          ${S.loan?`<div class="label">On loan from ${esc(S.loan.parent)}</div>`:`<div class="loyal"><span class="label">Loyalty · ${loyaltyLevel(loyaltyOf(S.club))}</span><div class="meter"><span style="width:${loyaltyOf(S.club)}%"></span></div></div>`}
          ${S.phase!=="retired"?`<div class="loyal"><span class="label">Manager trust · ${trustLabel(mgr().trust)}</span><div class="meter trust"><span style="width:${mgr().trust}%"></span></div></div>`:""}
          <div class="facts">
            <div class="fact"><div class="label">Age</div><div class="v">${S.age}</div></div>
            <div class="fact"><div class="label">Position</div><div class="v">${pl.pos}</div></div>
            ${S.spons ? `<div class="fact"><div class="label">Boot deal</div><div class="v" style="font-size:15px">${esc(S.spons.n)}</div></div>` : ""}
            <div class="fact"><div class="label">Contract</div><div class="v">${S.phase==="retired"?"—":S.years<=0?"Expired":"'"+String((S.season+S.years+(S.phase==="window"?1:0))%100).padStart(2,"0")}</div></div>
          </div>
          <div class="facts">
            <div class="fact"><div class="label">Wage</div><div class="v" style="${wageTxt(S.wage).length>6?"font-size:17px":""}">${wageTxt(S.wage)}</div></div>
            <div class="fact"><div class="label">Trophies</div><div class="v">${S.trophies.length}</div></div>
            <div class="fact"><div class="label">Nation${S.intl&&S.intl.caps?` · ${S.intl.caps} caps`:""}</div><div class="v" style="font-size:18px;overflow-wrap:anywhere">${esc(pl.nation||"—")}</div></div>
          </div>
          ${S.release?`<div class="label">Release clause · ${money(S.release)}</div>`:""}
          <div class="pills">${S.attr?`<span class="pill gold">Overall ${mcOvr()}</span>`:""}${S.attr&&mcSeasonRating()!=null?`<span class="pill gold">Rating ${mcSeasonRating().toFixed(2)}</span>`:""}${S.attr&&mcBoot()?`<span class="pill boot-pill">${shopBootIcon(mcBoot().k, Account.locker().boots[mcBoot().k], "boot-ic tiny")}${esc(shopBootName(mcBoot().k))} +${mcBoot().n}</span>`:""}${S.phase==="stats"&&(seasonMode()==="centre" ? !!mcInjNow() : availability()<.999)?`<span class="pill down">Injured${seasonMode()==="centre" ? ` · ${mcInjWeeks(mcInjNow())} wk` : ""}</span>`:""}<span class="pill">Injury record: ${proneLabel(S.prone??1)}</span>${pressure()>=.3?`<span class="pill ${pressure()>=.6?"down":""}">Pressure: ${pressureLabel(pressure())}</span>`:""}</div>
          ${S.phase!=="retired" ? `<p class="pen-line">${penOwned() ? `<button type="button" class="btn small" data-penact="open">${PEN_IC()} Edit your player</button>` : `<button type="button" class="btn small" data-penact="shop">${PEN_IC()} Edit your player</button><span class="hint">Needs the Editor pen from the shop</span>`}</p>` : ""}
          <div class="value-box">
            <div><div class="label">Market value</div><div class="value-big">${money(S.value)}</div></div>
            ${last?`<div class="delta ${diff>=0?"up":"down"}">${diff>=0?"▲":"▼"} ${money(Math.abs(diff))}</div>`:""}
          </div>
          </div>
        </div>
      </section>
      <section class="panel pyr-side"><h3>${TIERS[t].country==="England"?"Where you are in the pyramid":"Playing abroad"}</h3>${pyramid(t)}</section>
    </div>
    <div class="col">
      <div class="tabs" role="tablist">${tabs.map(([k,l,sh])=>`<button class="tab" role="tab" aria-selected="${tab===k}" data-act="tab" data-k="${k}" aria-label="${l}">${TAB_IC[k]}<span class="t-l">${l}</span><span class="t-s">${sh}</span>${k==="cabinet"&&S.trophies.length?`<span class="count">${S.trophies.length}</span>`:""}${k==="inbox"&&unread>0&&tab!=="inbox"?`<span class="count">${unread}</span>`:""}${k==="season"&&S.phase!=="retired"&&tab!=="season"?`<span class="count">!</span>`:""}</button>`).join("")}</div>
      <div id="tabBody" class="col">${body}</div>
    </div>
  </div>`;
  flash = "";
}
const TAB_IC = (()=>{ const w = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    season: w('<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 2.9-1.5 4.7h-5L8 10.4z"/><path d="M12 3v4.5M16 10.4l4.3-1.6M14.5 15.1l2.6 3.8M9.5 15.1l-2.6 3.8M8 10.4L3.7 8.8"/>'),
    inbox: w('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
    stats: w('<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>'),
    club: w('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M12 7v10"/>'),
    cabinet: w('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a2.5 2.5 0 0 0 3 4M16 6h3a2.5 2.5 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>'),
    legacy: w('<path d="M4 17l1.5-9 4.5 4 2-6 2 6 4.5-4 1.5 9z"/><path d="M4 20h16"/>'),
    training: w('<path d="M12 3.5 6.5 19h11z"/><path d="M8.6 13.3h6.8M10.2 8.8h3.6M4 19.5h16"/>'),
    lab: w('<path d="M9.5 3h5M10.5 3v5.5L5 18.2A1.9 1.9 0 0 0 6.7 21h10.6a1.9 1.9 0 0 0 1.7-2.8L13.5 8.5V3"/><path d="M7.4 14h9.2"/>')
  };
})();
let showBoard = false;
function render(){
  if (APP==="hub" || APP==="manager"){ document.documentElement.dataset.window = ""; if (APP==="hub") Hub.render(); else Mgr.render(); return; }
  renderInner(); flash = "";
  if (typeof G3!=="undefined" && G3.ready()) G3.cardNow();
  document.documentElement.dataset.window = (!showBoard && S && !S.newing) ? (S.phase==="winter" ? "winter" : S.phase==="tournament" ? "tourney" : S.phase==="window" ? "summer" : "") : "";
}
function renderInner(){
  if (showBoard){
    $("#bandRight").innerHTML = `<button class="btn ghost" data-act="board-close">${S && !S.newing ? "Back to career" : "Back"}</button>${Hub.menuBtn()}`;
    $("#app").innerHTML = `<div style="max-width:820px;margin:0 auto" class="col">${boardPanel()}</div>`; return;
  }
  if (!S || S.newing) renderCreate(); else renderCareer();
}

/* ================= EVENTS ================= */
document.addEventListener("input", e=>{
  const k = e.target.dataset?.k; if (!k || !draft || e.target.closest("[data-act]")) return;
  draft[k] = e.target.value;
  if (e.target.tagName==="SELECT" || e.target.type==="color"){ const id = e.target.id; renderCreate(); document.getElementById(id)?.focus(); }
  else updateCreatePreview();
});
function updateCreatePreview(){
  const d = draft, dc = draftClub(d), card = document.querySelector(".card"); if (!card) return;
  card.querySelector(".card-top").innerHTML = `${portrait(d, dc.meta, d.number)}<div class="card-pos">${d.pos}</div>`;
  card.querySelector(".pname").textContent = d.name || "Your player";
  card.querySelector(".clubline").innerHTML = `<span class="swatch" style="--c1:${dc.meta.c1};--c2:${dc.meta.c2}"></span>${esc(dc.meta.n)} · ${TIERS[dc.t].name}`;
  const sv = startValueFor(d, dc), age = clamp(+d.age||18,16,38);
  $("#pvValue").textContent = money(sv); $("#pvWage").textContent = wageTxt(wageFor(sv, dc.meta.n, dc.t, age));
  const ao = $("#ageOut"), pa = $("#pvAge"), pn = $("#pvNation"); if (ao) ao.textContent = age; if (pa) pa.textContent = age; if (pn) pn.textContent = d.nation || "—";
}
document.addEventListener("change", e=>{
  if (e.target.id==="backupFile" && e.target.files[0]){ importBackup(e.target.files[0]); e.target.value=""; return; }
  if (e.target.id==="confirmImport"){ confirmImport = e.target.checked; return; }
  if (e.target.id==="leagueSel"){ leagueView = e.target.value; render(); return; }
  if (e.target.id==="boardSel"){ boardKey = e.target.value; render(); return; }
  if (e.target.id!=="c-photo" || !e.target.files[0]) return;
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => {
      const c = document.createElement("canvas"), s = 320; c.width = s; c.height = Math.round(s*.95);
      const scale = Math.max(c.width/img.width, c.height/img.height), w = img.width*scale, h = img.height*scale;
      c.getContext("2d").drawImage(img, (c.width-w)/2, (c.height-h)/2, w, h);
      draft.photo = c.toDataURL("image/jpeg", .85); renderCreate();
    }; img.src = r.result; };
  r.readAsDataURL(e.target.files[0]);
});
document.addEventListener("keydown", e=>{ if ((e.key==="Enter"||e.key===" ") && e.target.matches && e.target.matches('li[data-act="profile"]')){ e.preventDefault(); e.target.click(); } });
document.addEventListener("submit", e=>{
  e.preventDefault();
  if (e.target.id==="createForm") startCareer();
  if (e.target.id==="seasonForm") submitSeason();
  if (e.target.id==="tourForm") submitTournament();
});
let confirmNew = false;
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act;
  if (a.startsWith("mc-")){ mcAction(a, b); return; }
  if (a==="tour-sim"){ if (S && S.tourney) tSimRest(); return; }   // international tournaments (tournament.js)
  if (a==="tour-play" || a==="tour-simgame"){ if (S && S.tourney) tPlay(a==="tour-play"); return; }
  if (a==="tour-done"){ if (S && S.tourney) tDone(); return; }
  if (a==="tab" && b.dataset.k==="lab"){ labOpen(); return; }
  if (a==="tr-play"){ trPlay(b.dataset.k); return; }
  if (a==="tab"){ tab = b.dataset.k; render(); uiEnter(document.getElementById("tabBody")); if (matchMedia("(max-width:720px)").matches){ const tb = document.getElementById("tabBody"); if (tb) window.scrollTo({top: tb.getBoundingClientRect().top + scrollY - 12}); } }
  else if (a==="backup-export"){ exportBackup(); }
  else if (a==="intl-yes" || a==="intl-no"){ const n = (S.notes||[]).find(x=>x.ask && x.ask.id===b.dataset.k); if (n){ n.ask.answer = a==="intl-yes"; save(); render(); } }
  else if (a==="my-profile"){ tab = "legacy"; profileId = S.id; render(); window.scrollTo({top:0}); }
  else if (a==="card-more"){ cardOpen = !cardOpen; render(); if (!cardOpen) document.querySelector(".board .card")?.scrollIntoView({block:"nearest"}); }
  else if (a==="board-open"){ showBoard = true; render(); window.scrollTo({top:0}); }
  else if (a==="board-close"){ showBoard = false; if (!Hub.playerSlot()){ Hub.home(); return; } render(); }
  else if (a==="board"){ boardKey = b.dataset.k; render(); }
  else if (a==="profile"){ profileId = b.dataset.k; render(); document.querySelector("#app")?.scrollIntoView({block:"start"}); }
  else if (a==="profile-close"){ profileId = null; render(); }
  else if (a==="reoffer"){ S.pending.offers = genOffers({score:Math.max(.2,S.pending.pf.score*.8)}, {listed:S.pending.listed}); S.pending.offers.renewal = null; save(); render(); }
  else if (a==="nego"){ negoOpen.add(String(b.dataset.k)); negotiate(b.dataset.k); }
  else if (a==="sign") decide("sign", b.dataset.k);
  else if (a==="stay"||a==="retire") decide(a);
  else if (a==="loan") decide("loan", b.dataset.k);
  else if (a==="dset" && draft){ const k = b.dataset.k, v = b.dataset.v; draft[k] = v; renderCreate(); document.querySelector(`[data-act="dset"][data-k="${k}"][data-v="${v}"]`)?.focus({preventScroll:true}); }
  else if (a==="clear-photo"){ draft.photo=null; renderCreate(); }
  else if (a==="rand-club"){ draft.club = randomClub(draft.club); renderCreate(); }
  else if (a==="cancel-new"){ S.newing=false; draft=null; render(); }
  else if (a==="new"){
    if (S && S.phase!=="retired" && !confirmNew){ confirmNew = true; b.textContent = "Tap again to start over"; setTimeout(()=>{confirmNew=false; if (b.isConnected) b.textContent="New career";}, 3000); return; }
    confirmNew = false; draft = defaultDraft(); if (S) S.newing = true; render(); window.scrollTo({top:0});
  }
});

/* ================= MIGRATION + BOOT ================= */
function migrate(old){
  try{
    const custom = (old.customClubs||[])[0] ? {...old.customClubs[0], founded:"2026", nick:"", ground:"", bio:"", custom:true} : null;
    const club = META[old.club] || (custom && custom.n===old.club) ? old.club : "Wrexham";
    const ns = newState(old.player, old.age, club, old.years, custom, old.value);
    ns.startValue = old.startValue || old.value; ns.season = old.season; ns.log = old.log || ns.log;
    ns.history = (old.history||[]).map(h=>({season:h.season, age:h.age, club:h.club, tier:h.tier, comps:{league:{apps:h.apps,g:h.goals,a:h.assists,cs:h.cs||0,code:"league"}}, rating:h.rating, tot:{apps:h.apps,g:h.goals,a:h.assists,cs:h.cs||0}, before:h.before, after:h.after, score:.6, wage:0, finish:null, trophies:[]}));
    ns.phase = old.phase==="retired" ? "retired" : "stats";
    migratedNote = "";
    return ns;
  }catch(e){ migratedNote = "Your old save couldn't be carried over to the new version, so start a fresh career."; return null; }
}
function normalize(){
  if (S && S.v===1) S = migrate(S);
  if (S && S.world){ upgradeWorld(S.world); S.v = 3; }
  if (S && S.history && S.history.length){ S.id ||= "c"+Date.now().toString(36); recordCareer(); }
  if (S && S.badLuckAge===undefined) S.badLuckAge = (S.inj && S.inj.season===seasonLabel(S.season)) ? pickBadLuckAge(S.age+1) : pickBadLuckAge(S.age);
  if (S && !S.loyalty){ S.loyalty = {}; (S.history||[]).forEach(h=>{ if (!h.loan) S.loyalty[h.club] = Math.min(100, (S.loyalty[h.club]||0) + ((h.score||.6)>.75?12:(h.score||.6)>.5?8:3)); }); }
  if (S) S.newing = false;
  if (S && S.player && S.phase!=="retired" && !(S.notes||[]).some(n=>n.ask && n.ask.id===`fr-${seasonLabel(S.season)}`)) scheduleIntl();
}
function start(){
  // the main menu (hub.js) comes first; it points KEY at a player career's slot when you open one
  KEY = Account.storageKey("career"); HALL_KEY = Account.storageKey("hall");
  Hub.boot();
}
// account.js shows the sign-in screen first, then starts the game for that account
Account.boot(start);
