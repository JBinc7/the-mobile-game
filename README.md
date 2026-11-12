# the-mobile-game
making the game accessible and downloadable on phones via just a link.

**English Footballing Pyramid** is a football career game with three modes: a **Player Career** (build your player, then play from the National League to the Champions League), a **Manager Career** (take charge of any club and run it: tactics, transfers, the academy and a board to keep happy) and a **Director of Football** career (run the club above the dugout: hire and sack head coaches, buy and sell, and keep the owner happy with both the results and the books). It started as a Claude artifact. This repo is a standalone version that runs on its own, with no Claude account needed.

- **One link to share.** Open it on any phone and you can play straight away in the browser.
- **Installs like an app.** Add it to the home screen. It opens full screen, has its own icon and works without signal.
- **Accounts.** Each player creates an account (a name and a password) the first time they open the game. Their career and Legacy save to that account automatically.
- **Free to host.** It's plain HTML, CSS and JavaScript on GitHub Pages: no server, no database, no build step.

## Put it online (one time)

1. Get these files onto the `main` branch (merge the pull request).
2. On GitHub, open the repo's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **`main`** and **`/ (root)`**, then **Save**.
4. After a minute or two the game is live at:

   **https://joshboakye500-eng.github.io/the-mobile-game/**

That's the link to share. Every later push to `main` updates it, and players pick up the new version the next time they open the game with signal.

To try it before merging, pick this work's branch in step 3 instead of `main`, then switch back to `main` after merging.

## The main menu and your saves

After signing in you land on the main menu: pick **Player Career**, **Manager Career** or **Director of Football**. Each mode has **three save slots** on your account, so one account can keep three players, three managers and three directors going at once. The last save you played is a tap away at the top (*Continue*), and *Menu* in the header brings you back here from any mode.

- A slot shows who's in it (name, club, season, key numbers) with *Continue* and *Delete* (tap twice). An empty slot starts a new career.
- Your first player career (from before slots existed) is in Player Career slot 1.
- *Player Legacy* ranks every player you've had; the *Hall of fame* ranks every manager and director by trophies and wins.
- The Player Career card shows your latest player in 3D, using the same lifelike players as the matches (the drawing shows until they've loaded).
- Backups (Account menu) carry every slot of every mode. Loading one puts its saves back in their own slots if they're free, or in the first free slot; tick *overwrite* to replace the saves in the same slots.

## Manager Career

Inspired by Football Manager and the career modes of FIFA 17 and EA FC 26.

- **Your manager and your club.** Name, nationality, age and playing background (Sunday league to former international), then any club in the game's twelve leagues: England's top five divisions, La Liga, the Bundesliga, Serie A, Ligue 1, the Primeira Liga, the Eredivisie and the Scottish Premiership. Clubs show their star rating and team rating.
- **Continue.** The season runs day by day from July to June. *Continue* moves on to the next thing that needs you: your next match, an offer to answer, a board meeting, the end of the season.
- **The squad.** Every player has a position (and others he can play), six FIFA-style attributes (pace, shooting, passing, dribbling, defending, physical; diving, handling, kicking, reflexes, speed and positioning for keepers), an overall, a potential, age, nationality, foot, contract, wage, value, morale, fitness, form, squad role and season stats. Tap anyone for his card.
- **Tactics.** Eight formations, your XI on a pitch (tap to swap players; tokens go green, amber or red for how well each fits his place), nine on the bench, *Auto-pick best XI*, captain, mentality (ultra defensive to ultra attacking), tempo, pressing, width, passing and the defensive line, with presets (tiki-taka, gegenpress, counter, wing play, park the bus, route one). A new formation takes a few weeks of training to learn.
- **Match day.** A pre-match screen (both line-ups, attack, midfield and defence compared, the opposition's key man, sometimes a press conference), then *Play the match* or *Quick sim*. From the touchline: change mentality and instructions, make up to five substitutions, shout (encourage, demand more, focus, push forward, tighten up) and give a half-time team talk. Fatigue, cards, injuries, extra time and penalty shootouts are all played.
- **The 2D match.** The whole match is played out on a 2D pitch inside a floodlit ground (upright on a phone, so it's big; *Pitch ⤢* makes it bigger still):
  - **Open play, all the time:** the side on the ball builds from the back, passes, dribbles, goes long, switches play and crosses; the other side presses and wins it back with tackles and interceptions; the ball goes out for throw-ins and goal kicks. Each side keeps its shape, sliding with the ball (higher and wider with it, deeper and narrower without it), and forwards run in behind. How far up the pitch a side gets follows how well it's playing.
  - **The big moments acted out:** chances (the pass in, the shot, the keeper's dive, the net bulging, the post, the block), headers from crosses, penalties, corners (everyone in the box), free kicks (a wall near goal), offsides (the flag), cards, injuries (the physio comes on), substitutions (the board goes up), goals (the scorer runs to the corner flag and his team-mates follow) and kick-offs.
  - **How much you see:** *Full match*, *Extended*, *Key moments* or *Commentary only* (the ⋯ menu), at 1× to 8×. A TV scoreboard, a live ticker, commentary, stats (possession, shots, expected goals, corners, offsides and more) and player ratings. Kits that clash are changed for the away side.
- **Competitions.** Your league in full detail (every match with scorers and ratings) and the other eleven leagues played alongside, with promotion, relegation and the EFL play-offs; the FA Cup and League Cup (or the cup of the country you're in); and the Champions League, Europa League and Conference League with a 36-club league phase and two-legged knockouts. Tables, fixtures, top scorers, assists, ratings and clean sheets, and every league's table.
- **Transfers.** Two windows (summer and January). Search every club and the free agents by position, age, overall, value, league and name. Players outside your league are known only roughly until your scouts watch them. Bid for a player (his club accepts, counters or refuses), then agree his personal terms. A player may refuse a smaller club or a lower division. New signings go straight into the XI when they're clearly better than the man playing there. **Loans in:** borrow up to four players until the end of the season (search with *Deal: Loan available*). His club decides whether he can go (their young players and those outside their first team can), and wants him playing and some of his wages paid: the bigger they are than you, the more. When he arrives, your assistant puts him straight into the XI wherever he's clearly better than the man playing there (otherwise he starts on the bench, and the inbox says which). You can agree an option to buy, and you're reminded in April; otherwise he goes back in the summer. *Transfers → Loans* lists who's with you on loan and who you've loaned out. Other clubs bid for your players (accept, reject or counter); you can transfer-list or loan-list players, release them, and the rest of your league does its own business.
- **The small print.** Deals have the details of a real transfer:
  - *Buying:* the fee all up front or over two or three seasons, add-ons (paid if he plays 20 league games in his first season), a sell-on clause for his old club, and a player of yours in part-exchange (if they want him). Clubs count money later and add-ons for less than money now. Pay a release clause in full, up front, and his club can't refuse.
  - *Contracts* (new signings, free agents and renewals): wage, length, squad role, a signing-on fee, an appearance bonus and a release clause. A signing-on fee or bonuses bring his weekly wage down, and he likes a release clause, but a bigger club can pay it and take him.
  - *Selling:* offers come with their own structure (instalments, add-ons). Accept, reject, or counter from the player's card: ask for more, payment up front, a sell-on clause or a buy-back clause. Push too far and they walk away; get close and they come back with a better offer. You pay any sell-on you owe when you sell him on.
  - *Loans out:* the loan club pays a share of his wages and may ask for an option to buy, which they can take up at the end of the loan.
  - *Transfers → Clauses* shows the money owed to you and by you, buy-back clauses (buy him back while a window's open), and the release and sell-on clauses in your squad. Instalments are paid at the start of each season; add-ons and sell-ons are settled each summer.
- **Money.** A transfer budget and a wage budget (move money between them), match-day income, TV and prize money, sponsors and wages, season by season.
- **The board.** Objectives each season (league, cup, Europe, wages, youth), a confidence meter that moves with every result, and a season review graded A+ to F. Lose their confidence, or get relegated out of the game's leagues, and you're sacked; then pick a new job from the clubs with vacancies. Do well and bigger clubs offer you jobs.
- **The academy.** A youth intake every March, a youth scout you can send abroad, promotion to the first team (or release at 19).
- **Training and growth.** A weekly team focus and intensity, and individual training for up to five players. Young players grow towards their potential, faster when they play; players over 30 decline; morale follows playing time, results and how you handle them.
- **Unexpected events** (sponsor challenges, a star's head turned, dressing-room unrest, takeovers, wonderkids, injury crises), **awards** (Manager of the Month, the league's Golden Boot, Player of the Season, Manager of the Season and more), retirements, contracts that run out, and a career record of every season.

## Director of Football

The third career, in the same world as Manager Career. You don't pick the team: a **head coach** does. You decide who the coach is, which players he has to work with and what the club can afford.

- **Your director.** Name, nationality, age and background: *chief scout* (your league's players are fully scouted from day one), *data analyst*, *former player* or *business* (a bigger transfer budget). Then any club in the twelve leagues.
- **The head coach.** Each coach has a style (possession, gegenpress, counter-attack, direct, wing play, balanced or defensive) and the formation he plays it in, ratings for **tactics** (how well his teams play), **motivation** (the squad's morale), **development** (how fast players improve) and **youth trust** (how readily he picks young players), a reputation, a wage, a contract and a mood. Before every match he picks his XI and sets his tactics for the opponent; his training follows his style. The *Head coach* tab shows all of this, his record against what the squad should be getting, and his XI on the pitch.
- **Sack and hire.** Sacking costs half his remaining wages (at least eight weeks), and the owner judges the call: sack a coach who's doing well and he won't like it. His assistant takes over as interim (weaker, and the owner gets restless after four weeks). *The coach market* lists coaches out of work and coaches at other clubs (whose clubs want compensation). Offer a wage and a contract length: he may want more, or not fancy your club. You can also offer your own coach a new contract before his runs out.
- **Keeping him happy.** He asks for signings (a position and a rating) and is delighted when you deliver; he's unhappy when you sell his best players. A miserable coach plays worse and can resign; a successful one can be poached by a bigger club (you get compensation, then need a replacement).
- **Watching a match.** *Watch the match* shows it in full on the 2D pitch with the coach in the dugout (no touchline controls, it's his job), or skip straight to the result.
- **Transfers.** All of Manager Career's transfers, loans and the small print are yours to run. New arrivals go into the coach's plans when they're better than what he has.
- **The owner.** Objectives on the pitch (league, cups, Europe, youth) and on the books: **a profit target** for the season and **wages kept below a share of revenue**. The confidence meter moves with results and money; stay in the red and it falls. Lose the owner's confidence and you're out.
- **The books.** Match-day income, TV and prize money and commercial deals come in; player wages, the coach's wage, running costs (stadium, staff, travel; more with better facilities), fees and compensation go out. Set **ticket prices** (low fills the ground and helps at home; high earns more but the fans may protest). Invest in the **training ground** (players develop faster) and the **academy** (better youth intakes); building work comes out of the transfer budget but isn't counted against the profit target.
- **Events for a director:** shirt sponsors, fan protests at ticket prices, takeovers, wonderkids and stars whose heads are turned.

## Form, sharpness and the staff (2.5)

In both Manager Career and Director of Football:

- **Form and sharpness.** A small **+** or **−** beside a player's rating is what he's worth today. *Form* is his last five match ratings (up to +3 or −3). *Sharpness* is match practice: it drops while he's injured or not playing and comes back with minutes; a rusty player plays below his rating. Managers (yours, the computer's, and your head coach) pick on today's level, so a man in form can keep a better player out.
- **Fitness is always shown** as a bar and a number. It falls with minutes played and recovers day by day (faster with more stamina). A player back from injury is **short of stamina** for a while (▾): he tires faster and recovers slower.
- **Staff** (Club → Staff): an assistant manager, a head physio and a chief scout, each with a rating and a wage. Hire better ones from the market.
- **The assistant's report** before every match: who's tired, rusty or in form, the changes he'd make, one thing to go after in the opposition and their danger man. *Do what he suggests* applies it. When you quick sim he freshens the team (switch this off in Club → Staff). Players back from injury or a ban go back into the XI if they're good enough on the day.
- **Player conversations.** Players knock on your door about game time, their form or their contract. Promises are remembered: keep them and morale rises, break them and the whole dressing room notices.
- **Opposition instructions and set pieces.** On match day, tap one of their players to mark him tightly. In Tactics, choose who takes penalties, free kicks and corners.
- **Did it work?** A few minutes after a substitution, shout or tactical change, the commentary tells you what it did.
- **Derbies** matter more to the board, the fans and the dressing room.
- **The season so far** (Home): your points against what a club like yours would expect, game by game, and your best and worst runs.
- **An ultimatum before the sack.** The board calls you in and sets a points target over the next five league games.
- **The head coach's window plan** (Director of Football): each window he names the positions he wants and his three preferred players for each, chosen for his style. *Trust him* signs his first available choice at the asking price, or find your own. He's happiest with his own picks, fine with a good one of yours, and frustrated if the window shuts with nothing done.

Fixed in 2.5: substituted players were counted twice (doubled appearances, minutes and injury messages), cards in friendlies led to bans, and a first-choice player back from injury stayed on the bench.

## 3.0, part 1: the mini-game rebuild

- **In goal, you're in control.** The keeper does what you ask, whenever you ask it. Tap the goal where the ball's going and you dive there, or press **Dive left**, **Stay** or **Dive right** under the goal. Before the shot, hold a finger on the goal to shuffle along your line; slide it as he strikes and you dive that way. Shots and penalties are a touch slower, and a dive as he hits it is an honest guess: only going well before the kick sends it the other way. This is every save in the game: matches, shootouts, drills and the lab.
- **Interceptions are played, not tapped.** You move your defender yourself: hold a finger on the pitch and he runs to it. Their midfielder looks at the man he's about to find (a dashed gold line), then passes: be in the way of the ball and it's yours. He won't pass through you, so camping in a lane just sends it elsewhere.
- **Practise first.** Every mini-game's guide has a *Practise it first* button: a go at the real thing that doesn't count. The rebuilt games show their new guide once more.

## 3.0, part 2: one look for every competition

Every competition now has its own two colours and pattern, the same in all three modes (`themes.js`): leagues wear stripes, domestic cups a spotlight, the Champions League stars, the other European cups rays, international tournaments rings.

- **Player Career:** a banner on the pre-match card and at full time, a strip over the scoreboard during your key moments, a coloured edge and dot on every fixture and result, and trophies in the cabinet in their competition's colours.
- **Manager Career and Director of Football:** the next match, match day and last result panels take the competition's colours; fixtures, results and trophies carry its dot.

## 3.0, part 3: the Records room

A new **Records room** on the main menu covers everything you've done on the account, in all three modes (`records.js`).

- **Achievements:** 41 of them (19 as a player, 12 as a manager, 7 as a director of football and 3 that span every mode), each bronze, silver or gold, with a progress bar. Unlocking one pays gold coins once: 40, 120 or 300.
- **All-time records:** your best across every career: most goals in a season, best season rating, most trophies, biggest win, best top-flight finish and more.
- It's all worked out from your saves, so careers started before 3.0 count. What you've unlocked is kept on the account and in backups, so deleting a save never takes an achievement away.

## 3.1, part 1: contracts and job moves (Manager and Director of Football)

- **You have a contract.** Wage, length and what the board expects are agreed when you take a job: sign what's offered, or ask for more money or a longer deal first. Club > Jobs shows your deal, time left and career earnings. Careers started before 3.1 are given a two-year deal.
- **Renewals and expiry.** In the last January of your deal a happy board opens talks. At the end of its last season the board either offers a new contract or lets you go; leave it unsigned and you walk away as a free agent. Sacked early, you're paid half of what was left.
- **Free agency, with the world carrying on.** Out of work, time no longer stands still: wait a week or a month and the season plays on without you (your old club under a new manager), vacancies come and go, and after a couple of months your reputation starts to fade.
- **Moves are rare.** A few vacancies a season, from sackings and from managers whose own deals run out. Now and then a bigger club asks to speak to you; leave mid-contract and they pay compensation, and walking out in mid-season costs some reputation. You can also resign.

## 3.1 and 3.2: depth in the dugout and boardroom, and one world

**Manager Career**
- **Touchline calls.** Up to three times a live match the game stops and asks you to react: a red card for either side, an hour gone and you're behind, a one-goal lead late on, two goals conceded in ten minutes, all square with twenty to go. Each answer changes how the team plays for a spell.
- **Press persona.** After six press answers you become known as a Motivator (team talks land better), a Diplomat (the board is slower to lose faith) or a Firebrand (demanding more from the touchline works more often). It's shown under Club > Jobs.
- **Weather.** Rain, wind, snow and heat on match day, shown before kick-off, each suiting some styles and hurting others.
- **Why it went that way.** Up to three plain reasons under every result: chances made, shots, red cards, possession, tired legs, the weather.

**Both roles**
- **Scouting network** (Club > Staff): send scouts to eight regions at three levels. They file reports on young players and put them on your shortlist.
- **Deadline day:** on the last day of each window, a late over-the-odds bid for one of your players and a club selling one of your targets cheaply, for that day only.

**Director of Football**
- **Monthly board pack:** league position against target, money, the head coach, the squad and your philosophy in one message.
- **Interviews:** a candidate's ratings are a rough range until you interview him (three interviews per search), which also tells you how he works.
- **Club philosophy** (Club > Owner): develop our own, live within our means, play on the front foot or win now. The owner judges you on it every summer.

**Player Career**
- **Boot deals:** as your value grows, brands sign you up for a yearly payment on top of your wage, from a local deal to a global one.

**One world (3.2)**
- The players you've made in Player Career appear in your Manager and Director saves at their current clubs, marked ★.
- A retired player can **go into management** from the main menu: his name, a reputation built from his playing career, and a better hearing at his old clubs.

## 3.3: one universe

A Player Career can share a world with one of your Manager or Director of Football saves (`universe.js`). Link them from the Player Career slot on the main menu; a retired player who goes into management is linked automatically.

- **He lives in that world.** Your player is in its squads (★) and follows his own career: when he moves club, ages or retires in Player Career, he does there too.
- **Sign yourself.** Buy him in the manager's world and his Player Career gets that offer, from you, in its next transfer window.
- **One set of leagues.** Each new Player Career season takes its divisions from the linked world's promotions and relegations (his own club stays in the division it earned), and if you manage his club, you're named as his manager.
- **One career, three roles.** Inside a world you can change role when you change job: every vacancy can be applied for as manager or as director, in the same save. So a career can run from the pitch to the dugout to the boardroom.

The two games still play their own matches, so scores and league tables are not shared: what's shared is who is where.

## 3.4: the last of the plan

- **The dressing room (Player Career).** Your standing in the squad at each club (Outsider, Squad player, Respected, Leader) grows with good seasons, time at the club, trophies and age. Become a leader and you're given the armband: a bonus, and the club stands by its captain for longer after a poor season. An outsider gets less patience.
- **A world that moves (Manager and Director).** The news now reports clubs in your league on five-game winning runs or in freefall, and now and then a club is taken over and gets stronger for good.
- **One universe fix.** When your player moves on in his own career from the club you manage, he now leaves in the manager's world too, instead of being offered straight back.

## 3.5: the same clubs are strong in both

In a linked universe, each new Player Career season now also takes the pecking order from the manager's world: within every division, the clubs that are strong there are the strong ones here (a club that's been taken over or built up in the manager's world is a force in the Player Career too). Your own club keeps the strength it has.

## How the game looks

A dark, night-game look across both careers: deep navy under floodlight glows and a neon pitch grid, mint-to-cyan for the main actions and violet-to-magenta for the big moments, angled panels with a lit corner, and condensed capitals throughout. It's in `theme.css`, which sets the colours every other stylesheet uses.

## How a season plays

Each half-season is a **match centre**: a fixture list for your club (league, cups and Europe), played week by week.

Every club has its own badge, drawn from its colours, in the tables, fixture lists, the match centre and on the match screens. Players wear their club's kit (shirt, shorts and socks), the goal has a crowd and advertising boards behind it, and a goal you score or set up ends in a burst of confetti in your club's colours.

The match screens move: players run with their arms pumping, kick the ball when they pass or cross, jump for headers and throw their arms up when you score, while the crowd jumps with them. The keeper shifts his weight before a shot and dives for it, the ball curls, spins and bulges the net, and when you shoot your own boot swings through the ball in the colours of the pair you're wearing. Each new screen eases in, and so do the app's tabs, views and dialogs.

The Season screen keeps it short: this week's match (both badges, the competition and the ground) and the play buttons at the top, then your key numbers and this week's training, then tabs for recent results, the league table, your targets, your attributes and the full fixture list. *Stats*, *Club & leagues*, *Legacy*, the shop and the summer transfer window (offers, loans and the season report) are split into tabs the same way, transfer offers keep their negotiation folded away until you tap *Negotiate*, and on phones the header and your player card fold down to a single row (tap *Full profile* for the whole card).

- **Training.** Each week, pick a focus (finishing, passing, pace, defending or shot-stopping, stamina, match prep, or rest) and how hard to train. Hard training grows you faster but tires you and raises the injury risk. Young players grow fast, and over-30s fight decline.
- **Training drills.** Once a week you can do a drill for your training focus: shooting practice, a passing drill, sprint starts for pace, a tackling drill (shot-stopping for keepers), a beep test for stamina, or free kicks for match prep. They're quicker, easier versions of the match mini-games, plus two of their own. The better the session, the more that attribute grows on top of the week's training: a perfect score adds about the same again, and even players near their peak gain a little. Free kicks sharpen you instead.
- **Selection.** Whether you start, come off the bench or sit out depends on the manager's trust, how your overall rating compares with the squad, your form, how tired you are and how you train. He marks every week's training: good drills and hard sessions raise your chances of starting and of coming off the bench, and poor drills lower them. The match centre shows how he rates your training.
- **Minutes played.** Every match records the minutes you played and the minutes your team played while you were there. *Stats* shows the share for each season, and your average a season.
- **Matches.** Fixtures are simulated from your attributes, form, sharpness and fitness. Your goals and assists come out of the team's scorelines. ★ marks the big games.
- **Key moments.** Every match you're picked for is played as quick mini-games for the moments that involve you. A starter gets about 4: more against weaker teams and when your team is in form, fewer against the best (keepers the other way round). Off the bench you get 1 or 2. There are 12 mini-games, drawn by position (30 more are being tried out in the mini-game lab):
  - **Attack:** shots (one-on-ones, in the box, long range, free kicks over a wall), headers (tap as the rings meet), passes (pick the free man), take-ons (read the defender and go the other way), crosses (pick the free runner on his spot), and a three-step **attacking move** that ends in a shot or a square ball for an assist.
  - **Drag the ball:** shots, free kicks, passes, crosses and the square ball are played by dragging. For a shot, drag the ball up to your spot in the goal, hold while the power bar swings, and let go in the green. For a pass, cross or square ball, drag the ball towards the man you want and let go. Tapping still works too. The timing games (headers, tackles, saves and so on) stay as taps.
  - **Defence:** tackles and blocks (timing) and interceptions (read the passer's eyes).
  - **Keepers:** saves and penalties (react to the shot), claiming crosses (ring timing) and rushing out (wait for the heavy touch).

  The keeper you shoot at is their real number one, with his name and rating on the goal. He's as good as his level: a non-league keeper is much easier to beat than a Premier League one, and a poor keeper now and then gets a hand to it and still lets it in. Your teammates' chances are the same: they score more often against a weak keeper.

  On the full-time scoresheet and in every scorers' list your name glows gold, so you can spot yourself at a glance.

  Your attributes, boots, form and sharpness set how forgiving each one is. How many attacking or defending moments you get, and how good the chances are, follow how the match is going for your team. The rest of the match is simulated around your moments, so the final score includes what you did. *Play next week* plays one week; *Play to January* plays straight through. To skip a game, tap *Sim the match* on its intro, or *Sim the rest* partway through.
- **Team form.** Your team's last five results show in the match centre and before each match, next to your opponent's. A team on a run plays with more confidence, and you get more chances.
- **Squads and line-ups.** Every club has a starting XI of made-up players, named for the country it plays in, with shirt numbers and ratings built around the club's strength. Squads change gradually: each player stays a few seasons before someone new arrives. Before each match you see both line-ups on a pitch, each side's average rating and the opponent's key man. You take the place of the player in your position. Players keep the name and shirt number they arrived with for as long as they stay; a newcomer who'd share either takes another.
- **Player cards and your squad.** Tap any player in the top scorers, assists or ratings lists, on the line-ups pitch or in the transfer list to open their card: rating, age, nationality, how long they've been at the club (and who they were signed from, for how much), and their league games, goals, assists and average rating this season, with where they rank. Your own card links to your full profile. *Club & leagues → Squad* lists your club's XI with everyone's rating and season numbers.
- **Summer transfers.** Every summer the best players at smaller clubs can move up to bigger clubs that need them in their position, for a fee that fits their rating, age and the league they join; the selling club brings in someone new. Each league sells up to four players a summer. Your inbox gets the round-up (the biggest deal and any business at your club), and *Club & leagues* lists every deal in and out of the league you're looking at.
- **Roll of honour.** Each league's champions every season of your career, with the Golden Boot and Player of the Season for the seasons you played in it, and the English cups' winners, under *Club & leagues*. A player's card shows any of those awards they've won, and a signing's card shows the clubs they've played for.
- **The league, week by week.** Your whole league is played out one round a week alongside your fixtures: every club plays every other home and away. After each league match the full-time screen shows the table around you, with the full table, top scorers, assists, average ratings and the round's results a tap away. The same table and leaderboards are in the match centre and under *Club & leagues*. At the end of the season this table is the final one, and the Golden Boot and Playmaker awards go to the league's real leaders.
- **The cups, round by round.** In a match centre season the FA Cup, the League Cup, the EFL Trophy and the FA Trophy are played out in full: each round is a real draw among the clubs still in it and the clubs that join at that round (non-league first, the Football League next, the Premier League from the FA Cup's 3rd Round), so your opponent comes from the draw and the cup carries on after you're out. The match centre's *Cups* view shows where you are, the latest round's results and each cup's top scorers; your inbox gets the winners at the end of the season. Where the numbers don't divide, some clubs get a bye in an early round, never you. A cup tie against a club far below you counts the gap in quality only up to a point, so a giant expects about four goals rather than a dozen. Before the semi-finals the big clubs rest players against much weaker sides (and the small clubs raise their game), so early-round upsets happen. A season you started before this version keeps the old draws until it ends.
- **International tournaments, played.** When your country picks you for a summer tournament (World Cup, Euros, Copa América, Africa Cup of Nations, Asian Cup, Gold Cup), you play it game by game:
  - **The full field:** 48 nations at the World Cup, 24 at the Euros and so on, drawn into groups of four from seeding pots, with the hosts top seeds.
  - **Groups:** every group game is simulated alongside yours, with tables, and the best third-placed sides go through where the format needs them.
  - **Knockouts:** a seeded bracket, with extra time and penalties when it's level, all the way to a winner.
  - **Your games:** play the key moments or sim each match. How much you play follows your role (starter, bench or squad reserve).

  The tournament screen shows your next game, your results and ratings, your group, every group, the knockouts and the top scorers. Caps, a winner's medal, your value and the Ballon d'Or follow as before. Tournaments held mid-season (the 2034 World Cup and the Asian Cup) are played the same way, between the two halves of the season, before the January window; you're back with your club a few weeks into the second half, and they count towards that season's awards and the Ballon d'Or. With the Editor pen you can type in your own numbers instead, before the first game.
- **Europe, in full.** In a match centre season the Champions League, the Europa League and the Conference League are all played out, week by week:
  - **36 clubs each:** the game's own clubs that qualified, topped up with real clubs from the rest of Europe.
  - **A real league phase:** 8 matchdays (6 in the Conference League), with every other game simulated alongside yours and a full table. 1st to 8th go straight to the last 16, and 9th to 24th play a two-legged knockout play-off.
  - **A seeded bracket:** two legs a round, so 1st and 2nd can only meet in the final, which is a one-off at a neutral ground.

  The match centre's *Europe* view shows all three competitions: the table, the knockout draw and results, top scorers and recent winners. You can follow them even when your club isn't in Europe. Your inbox gets the winners at the end of the season. A season you started before this version keeps the old way until it ends.
- **Scorers and Player of the Match.** Every match shows who scored and set up the goals, and every player gets a match rating on the same scale as yours. The best rating on the pitch is Player of the Match, worth 25 extra gold coins when it's you.
- **Your rating matters.** Your season's average rating sits at the top of the match centre, on your card and on the full-time screen. Every rating moves your form and the manager's trust, a good game teaches you more than a poor one, and the season average counts for 40% of how your season is judged: your market value, transfer offers and the newspapers' verdict. The league's Player of the Season, Young Player of the Season and Team of the Season go to the best average ratings, and great ratings help your Ballon d'Or case.
- **Your output follows your team's.** Your goals and assists are your share of what your team scores, about what a teammate of the same quality in your position would get, plus a little more. A star at a top side scores like one; at a struggling side your numbers drop with the team's, and you lift them by being better than your teammates and playing your key moments well.

  The first time a player meets key moments, and each kind of mini-game, a short card with a diagram explains how it works. *How to play* on any match's intro shows them again.
- **Gold coins.** Every match you play with key moments earns coins: a win is worth 50, a draw 10 and a defeat nothing; each goal adds 20 and each assist 15, and an own goal costs 10. Simmed matches earn nothing. Your total shows next to your name, and the full-time screen breaks down each match. Coins belong to the account, so they carry across careers, and they travel in backup files.
- **Shop.** Tap your coins at the top, or *Shop* in the match centre, to spend them:

  | Item | What it does | Cost |
  | --- | --- | --- |
  | Boots: Sniper, Maestro, Lightning, Rock (Safe-hands gloves for keepers) and Engine | +2 / +4 / +6 to finishing, passing, pace, defending (or shot-stopping) or stamina in every match. Wear one pair at a time; boots are kept on your account across careers. Each pair has its own colours, with bronze, silver or gold studs to match its level, and the pair you wear shows on your card and in your attributes | 250, then 450 to Silver and 800 to Gold |
  | Double training | Training gains doubled for 4 weeks | 250 |
  | Personal coach | +1 to your training focus now, up to 3 times a season | 400 |
  | Physio | Fitness back to 100 | 75 |
  | Sharpness drills | Sharpness back to 100 | 75 |
  | Injury treatment | Halves the time left on your current injury | 300 |

  The shop also sells **coin packs** for real money: 500 coins for £0.99 up to 15,000 for £14.99. Payments aren't connected yet, so for now tapping a pack just adds the coins, and the shop says so. To take real payments later, connect a provider (for example Stripe Checkout) in `shopCheckout()` in `shop.js` and set `SHOP_PAYMENTS` to `true`. Coins and accounts currently live only on the player's phone, so before charging money you'll also want online accounts, so paid coins can't be lost or edited.

  **The Editor pen** (£5.99, in the shop's *Editor pen* tab) is yours to keep on the account. Only with it can you:
  - enter your season and tournament stats by hand;
  - edit your player whenever you like: every attribute and your potential, from the *Edit your player* button on your player card or under *Season → You*, with your overall worked out as you go.

  Without it, seasons are played in the match centre, and international tournaments are played game by game (below). Like the coin packs, it's free for now: tapping it just gives you the pen.
- **Results count.** Your club's league points and cup runs come from these fixtures, and your half-season numbers feed the same reviews, transfer offers and awards as before. Trophies are hard to win: one great player lifts a team only so far, and form swings matches less than it did. A big club wins about one trophy every season or two, as real ones do.

- **Targets and clauses.** Each season the manager sets three targets: appearances, an output target for your position (goals, goals and assists, assists or clean sheets) and an average rating. Meeting them wins his trust, so you start more; missing them costs it. Time out injured is allowed for, and a January move brings new half-season targets. Your agent also adds clauses: hit a stretch number and a bigger club will bid for you in the summer, or make enough appearances and your wage goes up. Progress shows in the match centre, with inbox updates at the halfway point and at the end of the season.

## Mini-game lab (development)

### Matches, extra time and penalties
- **Shooting:** put your finger on the ball and the power bar (on the pitch, just above the ball) starts to build and swing; flick up towards where you want it (across for the side, straighter for the top corners). Flick while the marker's in the **green** and it's a goal, guaranteed, if it's inside the posts; the bar shows *Perfect strike*, *Not enough* or *Too much*, and the ball flies to match. The green grows with your finishing (smaller for long shots, free kicks and the end of an attacking move). Penalties in matches use the same shot.
- **Injuries:** the player card's *Injured* badge shows only an injury you have this week, with the weeks left. Injury treatment in the shop cures it: you're fit and available that week.
- **Key moments:** every position draws from a wide pool: the original 16 match games plus 21 that started in the lab (volley, bicycle kick, chip, lob, top bins, bend it, flick penalty, through ball, switch the play, corner, through the gap, one-two, skill combo, race to the ball, dribble drag, air duel, shield the ball, offside trap, clear the cross, block it, fingertips), each played once in a match. Nothing repeats within a match until the pool's used up, and recent ones are less likely next time.
- **Set pieces:** now and then a penalty (strikers and tens) or a free kick (wide men and midfielders).
- **Injury time:** late moments can come in stoppage time (90+3').
- **Extra time and penalties:** a knockout tie level after 90 (or on aggregate) goes to extra time, with one more moment of yours, then a penalty shootout. Play either or sim it. In the shootout you take your side's kicks and go in goal for theirs; *Sim the rest* finishes it. Cups, Europe and international tournaments.

### Training ground
- The **Training** tab (where the Lab tab was): each week a session of four exercises, two drills (your focus and one other) and two arcade games (keepy-uppy, flick-ups, crossbar challenge, target practice, dribble slalom, pass golf, rondo). Each adds a little growth; finish all four before you play the week and that week's training counts double (2×). The mini-game lab is now only in the Account menu's Development section.

### The mini-game lab
The **mini-game lab** is a development area for trying out mini-games: every one in one place, to play as often as you like.

It's hidden from players. To show it on a phone, open the Account menu and tap the *Game version* line at the bottom five times (or open the game once with `?dev` at the end of its address).

- Pick **Easy**, **Normal** or **Hard** at the top, and filter by *In matches*, *Training*, *Arcade* or *Full match*. Lab games play their full sessions here (three or five goes); in matches they're a single go.
- **Full match, lab only: Play the 90.** A whole match, 11 against 11, played in 3, 5 or 8 real minutes and seen as on television:
  - **The camera** sits behind your goal looking up the pitch and follows the ball, pulling back when play nears your goal so it stays in view and tilting down near the far end.
  - **The pitch** is in perspective, with mowing stripes, markings that thin into the distance, goals and nets, advertising boards, and a stand of supporters (some in your colours) under floodlights.
  - **The players** are figures in their kits, numbers on their backs, shown from the front or behind depending on which way they face. Their legs and arms move at the pace they're running, they kick, keepers dive, and scorers celebrate.
  - **The movement:** everyone speeds up, slows down and turns like a footballer, walking or jogging to hold position and sprinting to press or chase. The man on the ball pushes it a stride ahead. Long passes, crosses and shots fly with the ball's shadow on the grass, and the ball bounces.
  - **Drawing:** it's drawn on a canvas, so it stays smooth on a phone.
  - **You control only your own player** (the gold ring). Put a finger down anywhere and drag, like a joystick, to run. Let go and you take up your position again. Arrow keys work too.
  - **With the ball:** *Pass* finds the best-placed team-mate the way you're running, including a ball in behind. *Shoot* stops the match for the shot mini-game (one-on-one, in the box or from range).
  - **Without it:** *Call for it* asks the man on the ball to find you, and *Tackle* goes in when you're close to their man on the ball.
  - **In goal:** if you're a keeper, every shot on target is yours to save, played as the save mini-game. With the ball, *Long kick* finds your most open forward and *Pass* plays it short.
  - **Pausing:** the button on the pitch (or P) pauses the match. After a goal, and at half time, it stops for a moment before the kick-off.
  - **The other 21 play themselves:** teams keep their shape and shift with the ball. Forwards make runs as far as the last defender. One man presses while the next covers. Players pass into open lanes, cross from wide and shoot.
  - **Full time:** the score, your goals, assists, passes and tackles, a rating, the scorers, shots and possession. The difficulty sets how good the other side is.

Each game has a card with how to play it, a score at the end, and *Play again*.

**Legacy.** The *Hall of fame* ranks every career on the account by the stat you pick from the *Rank by* list, grouped into career, goals, trophies, country and money. Each row shows the player, where they are now, the stat you ranked by and their headline numbers. *Head to head* puts the top ten side by side.

**Legacy profiles.** Every career on the account is in *Legacy*: tap a player (or your own name on your card) for their profile, with their totals, average rating, Player of the Match awards, a career timeline, their trophies and every season's numbers, including minutes and rating.

Prefer to log a real FC career? With the Editor pen, use *Enter your stats by hand* under the match centre. A season is played in one mode throughout, so switching mid-season takes effect the next season. A save that was already entering stats by hand finishes that season that way, then goes back to the match centre unless you have the pen.

### How a match looks and sounds (3D)

- **Kick-off times and weather.** Most league games are afternoons in the sun; some, and the cups, Europe and the big games, are evenings under the floodlights. About one match in five is played in the rain (a wet pitch, grey skies by day). Training's in daylight. (`LV_DAY`, `LV_RAIN` in `moments.js`.)
- **The ground.** The home fans in the home club's colours with an away end in the visitors', flags waving, stands with roofs and floodlights, a worn goalmouth. The crowd murmurs, chants, draws breath at a strike, roars for a goal, ooh's a near miss and groans a miss; the referee whistles kick-off, cards and full time (`sound.js`, with a Sound switch in Settings).
- **The picture.** Each moment fills the screen: the 3D view runs to the screen's edges and on down the page below the play, fading out, under a TV-style scoreboard (the teams' colours under their names, the clock in its own box). A goal's result sits on the grass below the celebration. Close to the camera the grass has real depth (blades standing up, leaning the way they were mown), the players are full-detail models that shadow themselves, and the crowd's shaded fans sit and stand in the floodlights' shade.
- **Commentary.** A line as each of your moments begins, with what's happened since your last one (goals elsewhere, the score).
- **Replays.** Goals (after the scorer's celebration: a cheer, the aeroplane or a knee slide), shots off the woodwork and flying saves play again in slow motion from another angle.
- **The play.** Moments are on the move, not still pictures: passes are played into a runner as the attack moves up the pitch, take-ons start with you running at your man, interceptions read moving lanes. Winning a chance-making moment carries straight on into your own shot. Shots go where your flick points on the 3D goal, the shape of the flick curls it, and the ball moves under real physics when it's loose.
- **Older phones** get a lighter version (no shadows, finishing effects or grass blades, smaller textures, the picture kept to the stage); a phone that struggles first drops the resolution, then switches to it by itself.

## Installing it on a phone

The game shows these steps on its first screen and in the **Account** menu.

- **Android (Chrome, Edge, Samsung Internet):** tap **Install the app** when it appears, or open the browser menu **⋮** and choose **Install app** or **Add to Home screen**.
- **iPhone / iPad (Safari, Chrome):** tap **Share**, then **Add to Home Screen**, then **Add**.

## How accounts work

Accounts live on the phone itself, so there's no email, no sign-up server and nothing to verify.

- A player picks a name and a password. The password is stored only as a salted hash (PBKDF2-SHA256).
- Each account keeps its own career and Legacy, so several people can share one phone.
- Players can change their password, sign out, or delete their account from the **Account** menu (tap their name in the header).
- **Moving to another phone:** in the Account menu, tap **Download backup**, then on the new phone create an account and tap **Load backup**.
- **Bringing a career over from the Claude version:** in the Claude artifact go to **Legacy → Your saves → Download backup**. Then load that file in this version from the Account menu, and tick *also replaces my current career* if you already have one.
- Passwords can't be reset, because nobody but the phone has the account. If a player forgets theirs, the sign-in screen lets them remove that account and start again.
- Deleting the browser's site data for the game, or uninstalling the app on some phones, deletes saves too. Backups are the safety net.

Players on different phones can't see each other's careers. That would need an online database, and a free one (for example Supabase or Firebase) can be added later if you want shared leaderboards or accounts that follow players between phones.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page: header, game area, app and phone settings |
| `hub.js` | The main menu: Player Career, Manager Career or Director of Football, three save slots for each, and backups of every slot |
| `manager.js` | Manager Career's world and season: clubs and squads, the calendar, every league, cup and European competition, transfers, finances, the board, the academy, training, events and the job market |
| `mgmatch.js` | Manager Career's matches: the engine every detailed match is played on, and the match screen (commentary, stats, ratings, substitutions, shouts and team talks) |
| `mg2d.js` | The 2D match: open play between the engine's events, every big moment acted out, and the pitch and ground drawn on a canvas |
| `mgdof.js` | Director of Football: head coaches (style, ratings, mood, contracts), the coach's team selection and tactics, hiring and sacking, requests, the owner's money objectives, running costs, ticket prices and facilities |
| `mgui.js` | Manager Career's screens (and Director of Football's): making your manager or director and picking a club, Home, Squad, Tactics, Transfers, Competitions, Club, Inbox and the player card |
| `mgdofui.js` | Director of Football's own screens: the head coach page, the coach market, the coach on Home, the money line, facilities and ticket prices |
| `mgplus.js` | Form and sharpness, stamina after injury, staff, the assistant's report, player conversations, opposition instructions, set-piece takers, derbies, the season's story, the board's ultimatum, and the head coach's window plan |
| `manager.css` | The main menu's, Manager Career's and Director of Football's styles |
| `theme.css` | The game's look: colours, panels, buttons, tabs and fields for every screen |
| `game.js` / `game.css` | The game itself, taken from the artifact. Saving now goes to the signed-in account instead of Claude |
| `account.js` | Accounts, the sign-in screen, the Account menu and the install instructions |
| `matchcentre.js` | The match centre: fixtures, training, attributes, form, selection and match simulation |
| `moments.js` | Key moments: the live match screen, its mini-games, and the drawing and animation they share (players, ball, goal, crowd) |
| `labgames.js` | The 30 new mini-games (10 of them played by dragging), played only in the lab |
| `p90.js` | Play the 90: a whole match in real time, seen as on television (drawn on a canvas), in the lab only |
| `lab.js` | The mini-game lab under the Account menu's Development section |
| `squads.js` | Every club's starting XI, the line-ups before a match, scorers, match ratings, Player of the Match, player cards, the Squad view and the summer transfers between clubs |
| `league.js` | Your league played out week by week: the table, top scorers, assists, ratings and results, and the roll of honour |
| `tournament.js` | International tournaments played game by game: the field, the group draw and tables, the knockout bracket, your games with key moments, nations' kits and player names |
| `europe.js` | The Champions League, Europa League and Conference League played out in full: 36 clubs each, the league phase table, the knockout bracket, top scorers and winners |
| `cups.js` | The English cups played out in full: the draws, every tie, top scorers and the winners |
| `drills.js` | Weekly training drills: easier mini-games that grow your attributes and earn you game time |
| `crests.js` | Every club's badge, drawn from its colours |
| `targets.js` | The manager's season targets and your agent's clauses |
| `shop.js` | The shop: boots (and their icons) and training boosts bought with gold coins, coin packs, and the Editor pen with its player editor |
| `themes.js` | The competition themes (3.0): colours and patterns for every league, cup, European and international competition, and the banners, strips and chips that show them in all three modes. |
| `records.js` | The Records room (3.0): achievements and all-time records across all three modes, worked out from your saves. |
| `mgcareer.js` | Your own contract and the job market (3.1) for Manager Career and Director of Football: terms, renewals, expiry, resigning, being out of work while the world carries on. |
| `mgdepth.js` | 3.1/3.2: touchline calls, press persona, weather, match reasons, scouting network, deadline day, the director's board pack, interviews and philosophy, and the shared world. |
| `universe.js` | One universe (3.3): linking a Player Career to a manager's world and keeping the two in step. |
| `g3d.js` | The 3D graphics (three.js): the player on the home screen, the 3D scenes for shots, saves, headers, volleys, tackles and crosses, and a 3D version of every other mini-game drawn from its 2D picture; the stadium, light and weather, replays and celebrations, and the broadcast finish over the picture |
| `sound.js` | The sound, all made in the browser (no recordings): the crowd, its chants and reactions, the ball, the net, the whistle and the rain |
| `sw.js` | Offline support: keeps a copy of the game on the phone |
| `manifest.webmanifest`, `icons/` | App name, colours and home-screen icons |
| `fonts/` | The game's fonts (Big Shoulders Display, Barlow, Barlow Condensed), served from here under the SIL Open Font License |

## Making changes

Edit the files and push to `main`. When the network is good, phones fetch the newest versions of the game's files. If you **rename or remove** a file, also change `CACHE` in `sw.js` (for example to `"pyramid-v2"`) and update its file list, so phones drop the old copy.

To run it on your computer:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk works too, but without offline support.

## Credits

- 3D: [three.js](https://threejs.org) (MIT), in `vendor/`.
- The footballers in 3D come from the [Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox) (MIT): Sports_Male_02 and Sports_Male_03 with their motion-captured animations, converted to glTF and reduced for phones, its walk, jog and run (`gaits.glb`, the skeleton and motion only), and seven more faces from its adult men (Male_Adult_02, 04, 07, 09, 11, 12 and 16) on the same head, with their relief (normal) maps, and a gloss map made from Sports_Male_02's head specular map (`head_rough.jpg`). Licence in `vendor/people/LICENSE-Rocketbox.txt`.
