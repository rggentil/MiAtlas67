# MiAtlas67 — Product Specification

> **Status: APPROVED v1.18** — agreed baseline (2026-11-17). Any later change is agreed first and recorded in
> [§18 Change log](#18-change-log).
> Last updated: 2026-11-20

---

## 1. Vision

A simple, beautiful, mobile-first geography quiz game for the family. Children (starting at ~8 years old)
learn world **flags**, **capitals** and **country shapes** through short rounds, and can see their progress
grow over time. Adults can play the expert levels and compete with the kids on the same device.

It is a personal and learning project: no business model, no ads, no tracking.

## 2. Users

| Persona | Description | Needs |
|---|---|---|
| **Child player (~8)** | Reads fluently, plays on a phone or tablet, short attention span | Big buttons, short rounds, encouraging feedback, visible rewards (stars), no time pressure |
| **Adult player** | Geography enthusiast | Expert levels with territories and lesser-known entities, compare scores with the kids |

## 3. Goals and non-goals

**Goals**
- **G1** Learn flags, capitals and shapes of the world in a fun way, in both directions ("what is this?" and "which one is it?").
- **G2** Graded difficulty: a beginner never faces 195 flags at once.
- **G3** Make improvement visible over time (history and progress per player).
- **G4** Great on a phone, installable, and later a native app built from the same code.
- **G5** *(project goal)* Learn an AI-driven, spec-driven, well-tested way of building apps.

**Non-goals for v1:** monetization, accounts/login, online multiplayer, backend server.

## 4. Glossary

| Term | Meaning |
|---|---|
| **Topic** | Flags, Capitals or Shapes |
| **Direction** | **A "¿Qué es?"**: identify the thing shown · **B "¿Cuál es?"**: find the thing that belongs to a given country |
| **Game** | Topic + direction (6 games in total, see §6) |
| **Region** | Mundo, Europa, África, América, Asia, Oceanía |
| **Level** | Difficulty step within a game and region: 1 Fácil, 2 Medio, 3 Difícil, 4 Experto |
| **Entity** | Anything that can be asked: a country or, in level 4, a territory, a state with limited recognition or an autonomous region (see §13.2) |
| **Round** | A set of 10 questions of one game, region and level |
| **Profile** | A local player on the device (nickname + avatar) |
| **Stars** | 0–3 rating of a round |
| **Mastered entity** | An entity whose last 3 answers in a given game were correct (HIS-04, D29) |

## 5. Scope (MoSCoW)

| Priority | Features |
|---|---|
| **Must (MVP)** | The six games (§6) · regions and levels 1–3 · 10-question multiple-choice rounds · immediate feedback · round summary · stars · level unlocking · local profiles · history saved on the device · mobile-first responsive UI · Spanish UI with switchable English |
| **Should** | Level 4 Experto with the extended entity set · Atlas (learning/browse mode) · family records (local leaderboard) · mastered-entity counter · offline and installable (PWA) · sound effects with mute |
| **Could** | Mixed rounds (both directions of a topic) · read names aloud (text-to-speech) · achievements/badges · "67" easter egg · timed challenge · "review my mistakes" round · progress chart · parent switch "unlock everything" · themed packs (e.g. Spanish autonomous communities) · flags in their real proportions (D17) |
| **Won't (for now)** | Place-the-country-on-the-map mode · online multiplayer/sync · app store release · typed answers |

## 6. Games

Each topic is played in both directions, which makes **six games**:

| Topic | Direction A — "¿Qué es?" | Direction B — "¿Cuál es?" |
|---|---|---|
| **Flags** | **FLAG-A** A flag is shown → pick the country | **FLAG-B** A country name is shown → pick its flag among N flags |
| **Capitals** | **CAP-A** A country is shown → pick its capital | **CAP-B** A capital is shown → pick its country |
| **Shapes** | **SHAPE-A** A silhouette is shown → pick the country | **SHAPE-B** A country name is shown → pick its silhouette among N silhouettes |

- **GAME-01** The home screen shows the six games grouped by topic.
- **GAME-02** Stars, progress, unlocking and records are tracked per game (topic + direction).
- **GAME-03** Text options are shown as a vertical list of large buttons. Image options (flags, silhouettes) are
  shown as a grid of large tappable cards.
- **CAP-01** At level 1, Capitals games show the country's flag next to its name as a visual hint.
- **SHAPE-01** Silhouettes have no labels and no neighbours. Every island stays visible, at least as a dot.
- **SHAPE-02** A silhouette shows the main territory; distant overseas territories are left out
  (e.g. France without French Guiana). Exceptions decided by the product owner are in D25 and D31.
- **SHAPE-03** Entities whose silhouette is not recognizable are excluded from Shapes games (`shapeEligible` in
  the data). None for now: microstates such as Vatican City, Monaco or Nauru stay in (D25).
- **SHAPE-04** Entities without a reliable, undisputed open geometry (e.g. Puntland, whose boundary with
  Somalilandia is disputed) are excluded from Shapes games.
- **CAP-02** Entities without a meaningful capital (e.g. Hong Kong, Macao, Gibraltar) are excluded from Capitals
  games (`capitalEligible` in the data). All 195 countries have a quiz capital (D13): a city-state's capital is
  the country itself (Mónaco, Singapur, Ciudad del Vaticano) and Nauru uses its de facto capital, Yaren.
- **CAP-03** No two options of a Capitals question share a quiz capital, so the question has exactly one right
  answer and never shows a capital twice. Names are compared without case, accents, spaces or hyphens. Only these
  entities share a quiz capital (D30): Reino Unido and Inglaterra → Londres; Aruba and San Eustaquio → Oranjestad;
  Jamaica and Isla Norfolk → Kingston, and Guyana and Islas Caimán → Georgetown / George Town (different towns with
  the same name). Chipre (Nicosia) and Chipre del Norte (Nicosia del Norte) have different quiz capitals, so one
  can be a wrong option for the other (D32).

## 7. Levels and difficulty

Each of the 195 countries has a curated, editable **familiarity tier**:
- **Tier 1**: very well known (~40 countries, e.g. España, Francia, Brasil, Japón, Estados Unidos)
- **Tier 2**: reasonably known (~70)
- **Tier 3**: the rest (~85)

The product owner reviewed the tiers of every country in story #15 (42 / 71 / 82).

| Level | Entities asked | Options per question | Distractors (wrong options) |
|---|---|---|---|
| **1 Fácil** | Tier 1 | 3 | Random from the same pool (easy to rule out) |
| **2 Medio** | Tier 1–2 | 4 | Random from the same region |
| **3 Difícil** | All 195 countries | 6 | "Tricky": similar flags, neighbours, same region |
| **4 Experto** *(Should)* | 195 + extended set (§13.2), half of the questions from the extended set (LVL-07) | 6 | "Tricky", mixing countries and extended entities |

*The number of options per level is a starting point and will be tuned during playtesting.*

- **LVL-01** The player chooses Game → Region → Level.
- **LVL-02** Region "Mundo" includes all regions.
- **LVL-03** If a region/level pool has fewer than 10 entities (e.g. Oceanía, tier 1), it is topped up
  with entities from the next tier.
- **LVL-04** Level 1 is always open. Level N+1 of a game and region unlocks when level N reaches ≥ 2 stars.
  Each player, game and region ("Mundo" included) unlocks on its own. A level where the player has already
  completed a round stays open, so nobody loses a level played before unlocking arrived (D26).
- **LVL-05** Locked levels are visible, with a padlock and a hint ("Consigue ★★ en Medio para desbloquear").
- **LVL-06** At level 3 the wrong options are "tricky". They are taken in this order, at random within each group:
  flags similar to the answer's (Flags games only), countries that share a land border with it, countries of its
  region. In "Mundo" a similar flag or a neighbour can come from another region; a region round only uses its own
  countries. The similar-flag groups and the land borders are curated data reviewed by the product owner (D15):
  a territory counts when it is part of the country inside the EU, de facto lines are used, and in levels 1–3 only
  the 195 countries count. At level 4 the extended entities add their own land borders and similar-flag groups,
  also reviewed by the product owner (D30).
- **LVL-07** *(Should)* In a level 4 Experto round, 5 of the 10 questions ask an extended entity (§13.2) and the
  other 5 ask countries of any tier, in random order. When a topic and region have fewer than 5 eligible extended
  entities, all of them are asked and countries complete the round (D27).

## 8. Round flow

- **RND-01** A round has 10 questions; no entity is repeated within a round.
- **RND-02** Options are shuffled, the correct answer appears exactly once, and there are no duplicate options.
- **RND-03** No timer in v1.
- **RND-04** Immediate feedback after each answer:
  - correct → positive animation (and sound if enabled);
  - wrong → the chosen option is marked wrong, the correct one is highlighted and named ("¡Uy! Era Portugal", D16; "¡Uy! Eran los Países Bajos" for a plural name, DATA-09).
  - Feedback never relies on colour alone (✓ / ✗ icons as well).
- **RND-05** The player taps "Siguiente" to move on, so the child controls the pace.
- **RND-06** Progress (e.g. 3/10) and current score are always visible.
- **RND-07** The player can quit a round (with confirmation). Quit rounds are not saved in the history.
- **RND-08** End-of-round summary: score, stars, "new personal best" and "level unlocked" indicators, the list of
  missed entities with their correct answers (the learning moment), and the buttons "Jugar otra vez" and "Menú".
  "¡Nuevo récord!" shows when the score beats the player's best one in that game, region and level. A tie does
  not, and neither does the first round there, which has nothing to beat (D23). "¡Nivel desbloqueado!" names the
  next level when the round reaches ★★ and that level was locked before it (LVL-04); the last level opens nothing.

## 9. Scoring and stars

- **SCR-01** Score = number of correct answers (0–10). Simple and readable for kids. *(Points/streak bonuses: Could.)*
- **SCR-02** Stars: 1★ ≥ 5 correct, 2★ ≥ 8 correct, 3★ = 10 correct (proportional if a round has fewer questions).
- **SCR-03** The best result per profile and per game/region/level is kept.

## 10. Profiles

- **PRF-01** On launch, a "¿Quién juega?" screen shows the existing profiles; tap one to select it.
  The last used profile is highlighted.
- **PRF-02** Create profile: nickname (1–12 letters, unique on the device) + avatar from a predefined
  set of 11 animals (D21). No password, email, age or real name required. Two nicknames that differ only in
  capitals, accents or spaces at both ends count as the same ("lucia" = "Lucía"). Two profiles may have the same
  avatar (D21).
- **PRF-03** Switch profile at any time from the main menu.
- **PRF-04** Edit nickname/avatar; delete a profile (with confirmation; this deletes its history).
- **PRF-05** Maximum 8 profiles per device.

> Local profiles + family records (HIS-05) give a turn-based "multiplayer on the same device" in v1,
> without any server. Online multiplayer stays a future step.

## 11. History and progress

- **HIS-01** Every completed round is saved: date/time, profile, game, region, level, score with its number of
  questions (8/10), stars, missed entities, and the entities asked (for HIS-04).
- **HIS-02** History screen per profile: newest first, filterable by game.
- **HIS-03** Progress screen per profile: stars per game/region/level, total stars.
- **HIS-04** *(Should)* Mastered entities per game: "Países dominados: 37/195". An entity is mastered while its
  last 3 answers in that game, in any region and level, were correct; a miss takes it out until it is answered
  right 3 times in a row again (D29). Only the rounds that keep every entity asked count, so rounds played before
  this counter arrived do not. Extended entities are counted separately: "Territorios y otros dominados: 3/52".
  Each counter counts only the entities its game can ask: Capitals leave out those without a quiz capital (CAP-02)
  and Shapes those without a silhouette (SHAPE-03, SHAPE-04).
- **HIS-05** *(Should)* Family records: best score per game/region/level across all profiles on the device, with
  the nickname and avatar of the player who holds it, on a "Récords" screen opened from the home screen. A tie
  does not take a record away: the player who reached it first keeps it (D28).
- **HIS-06** *(Could)* Chart of results over time.

## 12. Atlas — learning mode *(Should)*

- **ATL-01** Browse entities by region: flag, name, capital and silhouette.
- **ATL-02** Not scored; available without selecting a profile.

## 13. Content and data rules

### 13.1 General

- **DATA-01** Every entity has: a code (ISO 3166-1 alpha-2 where one exists, otherwise ISO 3166-2 or a custom code),
  names and capitals in **Spanish and English**, region, category (§13.2), familiarity tier, flag (SVG),
  silhouette geometry, `shapeEligible` and `capitalEligible`.
- **DATA-02** Spanish names follow RAE / *Diccionario panhispánico de dudas* conventions (e.g. "Catar", "Kenia",
  "Países Bajos"). English names follow common English usage.
- **DATA-03** Countries with more than one capital (e.g. Bolivia, Sudáfrica, Malasia, Países Bajos) have one
  **quiz capital**; the others are shown as extra info and are **never** offered as wrong options for that country.
- **DATA-04** Each entity belongs to exactly one region; transcontinental countries are assigned by convention
  (e.g. Rusia → Europa, Turquía → Asia, Egipto → África, Groenlandia → América), documented in the data.
  Extended entities belong to the region where they are located (e.g. Puntland → África, Bonaire → América).
- **DATA-05** All data is bundled with the app (no runtime API calls). It uses openly licensed sources, which are
  listed on an "Acerca de" screen (flags: *flag-icons*, MIT; shapes: *Natural Earth*, public domain, and
  Vatican City from *OpenStreetMap*, © OpenStreetMap contributors, ODbL; avatars:
  *OpenMoji*, CC BY-SA 4.0).
  Flags missing from *flag-icons* (e.g. Abjasia, Puntland), or shown there differently from the flag in de facto
  use (Afganistán, D13), come from *Wikimedia Commons*; the source and licence of each such file are recorded in
  the data.
- **DATA-06** Data integrity is checked by automated tests: all fields present in both languages, unique codes
  and names, and every flag and shape file exists.

### 13.2 Entity sets

| Category | Count | Used in |
|---|---|---|
| `un-member` | 193 | Levels 1–4 |
| `un-observer` (Vatican City, Palestine) | 2 | Levels 1–4 |
| `limited-recognition`: partially recognized or de facto states (e.g. Kosovo, Taiwán, Abjasia, Somalilandia) | 8 | Level 4 |
| `territory`: dependent and overseas territories (e.g. Groenlandia, Gibraltar, Puerto Rico, Hong Kong, Aruba) | 31 | Level 4 |
| `subnational`: constituent countries and autonomous regions (e.g. Escocia, Åland, Puntland, Zanzíbar) | 13 | Level 4 |

- **DATA-07** The extended set is the list in Appendix A. The data story confirms, for each entity, the flag
  source, the quiz capital and whether a shape is available. An entity without a flag in official use in its
  territory is dropped (that is why Irlanda del Norte is not included). The product owner may also leave one out
  (D30: Azores and Madeira).
- **DATA-08** The "Acerca de" screen states that including an entity reflects geography and flags, not a political
  position. Names use neutral, widely used forms. The Atlas describes each extended entity's status in plain,
  factual words (e.g. «Territorio autónomo de Dinamarca», «Estado con reconocimiento limitado»,
  «Estado federado de Somalia»).
- **DATA-09** A name that takes an article in a sentence keeps it there, in each language: «¿Cuál es la bandera
  del Reino Unido?», «de la República Dominicana», «de los Países Bajos», «Which one is the flag of the United
  Kingdom?». Options, lists
  and titles show the name alone («Reino Unido»). An article that is part of the name is never contracted
  («de El Salvador»). A name with «los» is plural, so the verb of the wrong-answer feedback agrees with it:
  «¡Uy! Eran los Países Bajos». Which names take an article is curated data reviewed by the product owner (D18).

## 14. Settings

- **SET-01** Language: Español (default) / English. It applies to the whole UI, entity names and capitals.
  The choice is stored on the device and applies to all profiles.
- **SET-02** *(Should)* Sound on/off: on the first time, stored on the device for all profiles, like the language
  (D35).

## 15. UX and visual principles

- Mobile-first, portrait. Works from 360 px wide up to desktop (centred column on large screens).
- Kid-friendly: large touch targets (≥ 48 px), large readable text, minimal reading, colourful and playful
  but not noisy.
- Encouraging tone: never "you failed", and no "¡Casi!" when the answer was not close: a miss gets a light
  "¡Uy! Era…" (D16).
- Colour-blind friendly: feedback also uses icons, not just colour.
- Visual direction: theme C **«Bloques»** (D11). Thick dark outlines, offset "sticker" shadows, a sky-blue
  background and one bright colour per topic (Banderas pink, Capitales blue, Siluetas green). Display font
  *Lilita One*, body font *Nunito*. Reference mockups are in the
  [design canvas](https://claude.ai/artifact/SDHWBLStMoj1Xg2eNdF3PX). Design tokens are in
  [02-technical-approach.md §7](02-technical-approach.md#7-visual-theme-tokens--theme-c-bloques).
- **NAV-01** The phone's back button (or back gesture, or the browser's Back) goes back inside the game. It does
  what the screen's own way back does: a setup step goes to the previous step or home ("Volver"), a round asks
  "¿Salir de la partida?" first (RND-07) and Back again closes that question, the summary goes home ("Menú").
  Creating a player goes back to "¿Quién juega?", and so does the home screen (D22). Only "¿Quién juega?" is
  left by Back, and it asks first (NAV-02, D19).
- **NAV-02** On "¿Quién juega?", Back asks "¿Salir del juego?" with "Pulsa atrás otra vez para salir." and one
  button, "Seguir jugando", which closes the question. Back again leaves the game. There is no "Sí, salir": a web
  page cannot close itself, and when the game was opened from the phone's home screen or in a new tab there is no
  page before it to go to. While the question is open, only "Seguir jugando" keeps the player in the game: a tap
  anywhere else does not stop Back from leaving. Back before the first tap after opening the game leaves without
  asking, because the browser's back button skips the history entries a page adds without a tap (D20).

## 16. Non-functional requirements

- **NFR-01** Mobile-first responsive; supported browsers: latest Chrome (Android, desktop), Safari (iOS) and Edge.
- **NFR-02** *(Should)* Fully playable offline after the first load; installable on the home screen (PWA).
  Installable part, done early (D24, story #74): a web manifest named "MiAtlas67" with its icons and the iOS meta tags, so it opens full screen from the home screen on «¿Quién juega?». Playing offline is a service worker that keeps the whole game on the device; a new version arrives in silence the next time the game is opened (D36, story #110).
- **NFR-03** Usable within 2 s on a mid-range phone over Wi-Fi; answer feedback feels instant (< 100 ms). The
  profile, the size budgets and how they are checked are in D38.
- **NFR-04** Privacy by design (GDPR/AVG): all data stays on the device. Only nickname, avatar and game results
  are stored. No analytics, ads, cookies or third-party calls at runtime. Deleting a profile deletes its data.
  Any future online feature (sync, multiplayer) needs a separate privacy review first, because it involves
  children's data: parental consent, data minimization, and encryption in transit and at rest.
- **NFR-05** Accessibility: target WCAG 2.2 AA where reasonable (contrast, roles/labels, keyboard usable on
  desktop), checked automatically with axe.
- **NFR-06** Internationalization: all UI texts are externalized; Spanish and English are shipped in v1.
- **NFR-07** Testability: question generation is seedable, so tests are deterministic.
- **NFR-08** Quality: three test layers (unit, component/integration, E2E with Playwright); see
  [02-technical-approach.md](02-technical-approach.md).

## 17. Decisions and open questions

| # | Topic | Decision / status |
|---|---|---|
| D1 | UI language | ✅ Spanish by default, English switchable (SET-01) |
| D2 | Entity set | ✅ 195 for levels 1–3; extended set (territories, states with limited recognition, autonomous regions; Appendix A) in level 4 Experto |
| D3 | Level structure | ✅ Region × 4 levels, 10 questions, stars |
| D4 | Unlocking | ✅ Unlock the next level with ≥ 2★; "unlock everything" switch as a Could |
| D5 | Answer format | ✅ Multiple choice only in v1 |
| D6 | Timer | ✅ No timer in v1 |
| D7 | Game name | ✅ **MiAtlas67** |
| D8 | Board | ✅ GitHub Projects + Issues (see way of working) |
| D9 | Directions | ✅ Both directions for every topic (6 games) |
| D10 | Repository and hosting | ✅ Public repo `rggentil/MiAtlas67`; HTTPS preview on GitHub Pages |
| D11 | Visual theme | ✅ Theme C «Bloques» (chosen from Pasaporte, Galaxia and Bloques in the [design canvas](https://claude.ai/artifact/SDHWBLStMoj1Xg2eNdF3PX)) |
| D12 | Extended entity list | ✅ Appendix A, including de facto states and autonomous regions. The data story verifies each entity (DATA-07) |
| D13 | Country data review (#15) | ✅ Tiers reviewed one by one. Flags show the flag in de facto use (Afganistán: the Islamic Emirate flag). Every country has a quiz capital: city-states → the country itself, Nauru → Yaren (de facto), Israel → Jerusalén, Palestina → Jerusalén Este (Ramala as extra info), so CAP-03 still holds. Sahara Occidental → El Aaiún |
| D14 | Level 3 "tricky" distractors | ✅ Split from the question generator (#17) into story #37 (similar flags + neighbours, with a data review). Until then level 3 wrong options are random from the same region |
| D15 | Similar flags and land borders (#37) | ✅ Reviewed in a [review page](https://claude.ai/artifact/TXjaHY9kF97aj8az78G93A). 25 similar-flag groups (Somalia–Micronesia dropped; related groups merged, e.g. all pan-Arab flags, the Union Jack ones; Malta and Singapur join Indonesia–Mónaco–Polonia). Land borders: a territory counts when it is part of the country inside the EU (Francia–Brasil and Francia–Surinam via French Guiana, España–Marruecos via Ceuta and Melilla); dependent territories outside the EU do not (Gibraltar, Groenlandia). De facto lines (China–Pakistán yes, India–Afganistán no). Kosovo and Sahara Occidental stay in the extended set (D2); their borders are added with it for level 4 |
| D16 | Wrong-answer feedback | ✅ "¡Uy! Era Portugal" instead of "¡Casi! Era Portugal": a miss is not always close. "País → Bandera": "¡Uy! La bandera de Portugal es la marcada con ✓". English: "Oops!" (RND-04) |
| D17 | Flag proportions | ✅ Flags are shown in a 4:3 frame (*flag-icons* 4×3 set), so two flags that differ only in their proportions look the same there: Indonesia (2:3) and Mónaco (4:5) can meet in a level 3 "Mundo" round. Accepted for now. Showing each flag in its real proportions (Suiza square, Nepal not a rectangle, Mongolia and Sri Lanka longer) needs a study of every flag; planned as a Could in epic 7. Chad and Rumanía have the same proportions and differ only in the shade of blue, in reality too: they stay a level 3 challenge (D15) |
| D18 | Names with an article | ✅ Sentences use the article a name takes (DATA-09). Reviewed in a [review page](https://claude.ai/artifact/5gzVsZBQpAhGjhhjWPSj4P) (story #52); Países Bajos changed in v1.7 (story #58). Spanish: «el» Reino Unido and Líbano; «la» República Dominicana, República Centroafricana, República del Congo and República Democrática del Congo; «los» Países Bajos, where the product owner follows the RAE («de los Países Bajos», «¡Uy! Eran los Países Bajos»). Every other name goes without one: the other plural names too («de Bahamas», «de Islas Marshall»), and Estados Unidos, India, Ciudad del Vaticano and the South American countries («de Perú», «de Argentina»). English: «the» United Kingdom, United States, Netherlands, United Arab Emirates, Philippines, Bahamas, Gambia, Maldives, Marshall Islands, Solomon Islands, Comoros, Central African Republic, Dominican Republic, Democratic Republic of the Congo and Republic of the Congo. For the other plural names this choice takes precedence over the RAE usage of DATA-02 |
| D19 | Back button | ✅ The phone's back button goes back inside the game instead of leaving it (NAV-01, story #51) |
| D20 | Leaving from the home screen | ✅ Back on the home screen asks "¿Salir del juego?" first; Back again leaves (NAV-02, story #55). Chosen over a "Sí, salir" button, which could not leave when there is no page before the game, and over an Android-style notice at the bottom. Escape closes the question too, like "¿Salir de la partida?"; Escape is not a tap for the browser, so after it Back leaves without asking until the next tap |
| D21 | Avatars | ✅ 11 animals drawn by *OpenMoji* (CC BY-SA 4.0, credited on "Acerca de", DATA-05), chosen in the [review page](https://claude.ai/artifact/PzZrMTSrdtRNzHJMXRv3hi) over the flat *Fluent Emoji* style, because their black outline matches «Bloques»: Zorro, Panda, Rana, León, Pingüino, Pulpo, Unicornio, Dinosaurio, Gato, Perro and Búho. Two players may have the same avatar: the nickname tells them apart, and nobody loses their favourite animal (PRF-02) |
| D22 | Back on the home screen | ✅ The game opens on "¿Quién juega?", so Back on the home screen goes there, and "¿Quién juega?" is the screen that asks "¿Salir del juego?" (NAV-01, NAV-02, story #61). Back always goes to the screen before. This moves the question of D20 to another screen; the rest of D20 stays |
| D23 | "¡Nuevo récord!" | ✅ Only when a round beats the player's best score in the same game, region and level. A tie is not a record, and neither is the first round there: it would show very often at first, with 36 combinations in "Banderas" alone (RND-08, story #66) |
| D24 | Devices | ✅ The family plays on Android and on iPhone. Safari on iPhone and iPad deletes the data of a website after 7 days of Safari use without opening it; a game added to the home screen keeps it. Not urgent for the product owner: a small story adds the home screen install in a later epic (#74), before the offline PWA of epic 7 (NFR-02) |
| D25 | Silhouettes | ✅ Decided in the [shapes review page](https://claude.ai/artifact/XL55gaC5p8PzcQeadSiF39) (SHAPE-01…03, #79). Spain shows the Canary Islands in a small framed box in the bottom-left corner, as maps of Spain do; Ceuta and Melilla are drawn in their place. With their islands: Ecuador (Galápagos) and India (Andaman and Nicobar). Without them: United States (Alaska, Hawaii), Portugal (Azores, Madeira). Drawn whole: Somalia with Somalilandia, Cyprus with the north, Serbia with Kosovo; Morocco without the Western Sahara. Island countries keep every island group (Kiribati, Micronesia), each island at least a visible dot; Seychelles shows the islands around Mahé. Every country is shape-eligible, microstates included; Vatican City is drawn from OpenStreetMap, whose outline shows its walls and St Peter's Square (Natural Earth has a plain 7-point polygon) |
| D26 | Unlocking the levels already played | ✅ Every level was open until unlocking arrived, and the children already play Medio and Difícil. A level where the player has completed a round stays open, so nobody loses one; from then on a level opens only with ★★ in the one before (LVL-04) |
| D27 | Experto mix | ✅ Half of an Experto round (5 of 10) asks extended entities and the rest countries of any tier. Mixed at random, only about 2 of 10 would be extended entities in "Mundo" (52 of 247), and Experto would feel like Difícil (LVL-07) |
| D28 | Family records | ✅ A "Récords" button on the home screen, next to "Progreso" and "Historial", opens one table per game with the nickname and avatar of each record holder, without switching player. A tie keeps the first holder: as in sport, a record must be beaten (HIS-05) |
| D29 | Mastered entities | ✅ An entity is mastered while its last 3 answers in a game were correct; a miss takes it out until it is answered right 3 times in a row again, so the counter can go down. Rounds saved before the counter arrived have no list of the entities asked and do not count (HIS-04) |
| D30 | Extended set review (#93) | ✅ Reviewed in a [review page](https://claude.ai/artifact/N7fZE1GUqZAL2WWiPQozWy): 52 entities with their names, articles, capitals, flags, statuses, land borders and similar flags. Azores and Madeira are left out: for the family they are Portugal, not a territory of their own (DATA-07). Capitals: Islas Malvinas → «Puerto Argentino/Stanley» (en: «Stanley»); Montserrat → Brades, the de facto one (Plymouth as extra info); Guam → «Agaña» (en: «Hagåtña»); Zanzíbar → «Ciudad de Zanzíbar» (en: «Zanzibar City»); Bougainville → Buka (Arawa as extra info); Inglaterra → Londres and San Eustaquio → Oranjestad, shared with Reino Unido and Aruba, Isla Norfolk → Kingston and Islas Caimán → George Town, towns with the same name as the capitals of Jamaica and Guyana (Georgetown), so a Capitals question never offers both of a pair (CAP-03); Chipre del Norte, Gibraltar, Hong Kong, Macao and Tokelau have none (CAP-02). Nueva Caledonia shows the Kanak flag (the French one is already France's). Articles (DATA-09): «la» Isla de Man, Isla Norfolk and Polinesia Francesa, «el» Sahara Occidental and Kurdistán iraquí; Bermudas goes without one («de Bermudas», like D18). Similar flags at level 4: the reviewed groups, with Jersey among the red crosses on white (with Inglaterra, Guernsey and Georgia), and every flag with a crescent and a star in one group (Turquía, Túnez, Chipre del Norte, Argelia, Azerbaiyán, Mauritania, Pakistán, Malasia, Singapur, Turkmenistán, Uzbekistán, Libia, Comoras and Sahara Occidental) |
| D31 | Silhouettes of the extended set (#94) | ✅ Reviewed in a [review page](https://claude.ai/artifact/XDR9sXBFiqNJnMJUrsnUQV): the 50 silhouettes of the extended set, drawn with the rules of D25. Every entity of the set is shape-eligible except Puntland and Jubalandia (SHAPE-04). Sahara Occidental is drawn whole, as maps draw it, not only the strip east of the berm (Natural Earth's de facto line); Marruecos is cut at 27° 40′ N, so at every level its silhouette leaves out the whole Western Sahara, as D25 says. With all their islands, like Kiribati: Polinesia Francesa (with the Austral Islands) and Islas Cook (with the northern group). Santa Elena is the island alone, without Ascension and Tristan da Cunha (SHAPE-02). Transnistria with Bender, the line it controls de facto. Tokelau is drawn with the 2 atolls Natural Earth has (Nukunonu is missing). Serbia, Somalia and Cyprus are still drawn whole (D25); at level 4, Kosovo, Somalilandia and Chipre del Norte also have their own silhouettes |
| D32 | Chipre del Norte and the crescent flags (#104) | ✅ Left to the team by the product owner (2026-11-20). Chipre del Norte joins the Capitals games with «Nicosia del Norte» (en: «North Nicosia»; Lefkoşa in Turkish), the northern half of the divided city, which it declares its capital; the name differs from Chipre's «Nicosia», so each question keeps one right answer (CAP-03). This replaces "none" for it in D30. The crescent-and-star group of similar flags (D30) stays at level 4: at Difícil the groups are flags that look alike, and of those flags only Turquía and Túnez do (D15) |
| D33 | "Acerca de" (#107) | ✅ Approved by the product owner (2026-11-23, questions P1–P3 of epic 7). One credit per source with its original name, its licence and, where the licence asks for it, its author, with every address written out as text: nothing is fetched (NFR-04). Sections «Banderas», «Siluetas», «Animales» and «Territorios y nombres» (en: Flags, Silhouettes, Animals, Territories and names); the 15 Wikimedia Commons flags are a list that opens and closes. Neutrality (DATA-08): «Incluir un territorio, un estado con reconocimiento limitado o una región autónoma refleja su geografía y su bandera, no una posición política.» and «Los nombres son las formas neutras más usadas.» The licensors' credit lines keep their original wording in both languages. It opens without a player, from the footer of the home screen and of «¿Quién juega?», and «Volver» or Back returns to the screen it was opened from (NAV-01). Fonts, libraries and the app version are not listed |
| D34 | Atlas (#109) | ✅ Approved by the product owner (2026-11-23, questions P7–P9 of epic 7). "Atlas" opens without a player, from the footer of the home screen and of «¿Quién juega?», next to "Acerca de"; it asks «¿Qué región quieres ver?» with "Mundo" and the five regions. A region lists its countries, then a section «Territorios y otros» with its extended entities, each list in alphabetical order of the language shown. Each entry shows the flag, the name, the quiz capital, «Otras capitales» when there are more (DATA-03), the status of an extended entity (DATA-08) and the silhouette; an entity without a capital (CAP-02) or a silhouette (SHAPE-04) shows none, with no empty box. «Volver» or Back goes from a region to the regions, and from the regions to the screen the Atlas was opened from (NAV-01). Nothing is scored or saved (ATL-02). No search, no detail screen, no quiz from the Atlas |
| D35 | Sound (#108) | ✅ Approved by the product owner (2026-11-23, questions P4–P6 of epic 7). Three short sounds: a correct answer, a soft wrong answer (D16) and the end of a round, when the summary opens. They are synthesized in the browser (Web Audio), so there is no sound file to license or download. The sound is on the first time; the switch «Sonido» sits in the footer of the home screen and of «¿Quién juega?», next to «Idioma», shows whether it is on with an icon besides its colour, and is stored on the device for every player, like the language (SET-01). Blocked storage or a browser that cannot play sound never breaks the game, and a sound never delays the ✓ or ✗ of an answer (NFR-03) |
| D36 | Offline play and new versions (#110) | ✅ Approved by the product owner (2026-11-23, question P10 of epic 7). After the first visit a service worker keeps the whole game on the device (pages, scripts, styles, fonts, flags and silhouettes) and it plays with no connection (NFR-02). It stores only the game's own files, under its own address (NFR-04, D10). A new version arrives in silence: the game goes on with the version it has, a round in progress is never reloaded, and the new one is used the next time the game is opened after it was closed. Players and rounds are never touched by an update |
| D37 | Accessibility pass (#111) | ✅ Approved by the product owner (2026-11-23, question P12 of epic 7). The chosen language shows a ✓ besides its colour, as the «Sonido» switch shows its speaker icon, so colour is never the only signal (§15). The sweep of every screen in both languages also made the game usable on a 360 px phone with the text at 200 %, without changing how it looks at the normal size: a word too long for its line is split, the side padding of buttons stays at 20 px, the language chips and the animals wrap, the answer panel scrolls when it is taller than the screen, and the tables of «Progreso» and «Récords» scroll inside their box, as data tables may (WCAG 1.4.10). The dialogs keep the focus inside them |
| D38 | Performance budget (#112) | ✅ Approved by the product owner (2026-11-23, question P13 of epic 7). NFR-03 is measured on a mid-range phone emulated in Chromium: CPU 4 times slower, 10 Mbit/s, 40 ms latency. «¿Quién juega?» is usable within 2 s (median of 5 first openings); a tap on an answer shows its ✓ or ✗ within 100 ms; «Historial» with 500 rounds and the Atlas «Mundo» (247 entries) are usable within 2 s. The build fails when the JavaScript of the first screen is over 200 KB gzipped, its CSS over 20 KB gzipped, or the files stored for offline play over 5 MB; flags and silhouettes are never part of the first load. If a time test proves unstable in CI, it reports its number instead of failing, and the sizes stay a hard limit |

No open questions.

## 18. Change log

- **v1.24** (2026-11-23): the performance budget: profile, times and sizes (NFR-03, D38, story #112).
- **v1.23** (2026-11-23): accessibility pass: a ✓ on the chosen language, large text on a small phone, focus kept in dialogs (NFR-05, D37, story #111).
- **v1.22** (2026-11-23): playing offline and how a new version arrives (NFR-02, D36, story #110).
- **v1.21** (2026-11-23): sound effects and the «Sonido» switch (SET-02, RND-04, RND-08, D35, story #108).
- **v1.20** (2026-11-23): the Atlas: entry points, "Mundo", order and entry contents (ATL-01, ATL-02, DATA-03, DATA-08, D34, story #109).
- **v1.19** (2026-11-23): the "Acerca de" screen: credits, sections and neutrality sentences; it opens without a
  player (DATA-05, DATA-08, NAV-01, D33, story #107).
- **v1.18** (2026-11-20): Chipre del Norte's quiz capital is Nicosia del Norte (CAP-03, D32, story #104).
- **v1.17** (2026-11-20): HIS-04 names the counter of the extended entities and says that each game counts only
  the entities it can ask (story #95).
- **v1.16** (2026-11-20): silhouettes of the extended set reviewed (D31, story #94): Western Sahara whole and
  Morocco cut at 27° 40′ N, French Polynesia and the Cook Islands with all their islands (SHAPE-02).
- **v1.15** (2026-11-20): extended set reviewed (D30, story #93): Azores and Madeira left out, so 52 entities
  (Appendix A, DATA-07) · two entities may share a quiz capital, never in the same question (CAP-03) · level 4
  land borders and similar flags (LVL-06).
- **v1.14** (2026-11-20): RND-08 says when "¡Nivel desbloqueado!" shows (story #90).
- **v1.13** (2026-11-20): decisions for epic 6: levels already played stay open when unlocking arrives (LVL-04,
  D26) · an Experto round asks half extended entities (new LVL-07, D27) · family records on a "Récords" screen
  from the home screen, a tie keeps the first holder (HIS-05, D28) · an entity stays mastered only while its last
  3 answers were correct, and a saved round keeps the entities asked (HIS-04, HIS-01, D29).
- **v1.12** (2026-11-20): the installable part of NFR-02 is built early (D24, story #74): web manifest, icons and iOS meta tags; offline play stays in epic 7.
- **v1.11** (2026-11-19): D25 decided in the shapes review: overseas exceptions, de facto lines, the Canary
  Islands box, islands always visible (SHAPE-01, SHAPE-02) and microstates kept in the Shapes games (SHAPE-03) · Vatican City outline from OpenStreetMap (DATA-05).
- **v1.10** (2026-11-18): D24 decided: the home screen install comes as a small story in a later epic (#74), so iPhone keeps the players and history.
- **v1.9** (2026-11-18): decisions of the epic 4 review page: the avatars are 11 OpenMoji animals, and two
  players may share one (PRF-02, DATA-05, D21) · Back on the home screen goes to "¿Quién juega?", which now asks
  "¿Salir del juego?" (NAV-01, NAV-02, D22) · "¡Nuevo récord!" only when a previous best is beaten (RND-08, D23) ·
  the family plays on Android and iPhone, so the home screen install may come earlier (D24, open). PRF-02 counts
  the nickname in letters and says when two nicknames are the same.
- **v1.8** (2026-11-18): HIS-01 says that the score is kept with its number of questions (8/10), as the summary
  shows it.
- **v1.7** (2026-11-18): Países Bajos follows the RAE: «de los Países Bajos», «¡Uy! Eran los Países Bajos»
  (DATA-09, RND-04, D18); the other plural names keep going without an article.
- **v1.6** (2026-11-18): Back on the home screen asks "¿Salir del juego?" before leaving (NAV-02, D20).
- **v1.5** (2026-11-18): names with an article reviewed (D18): in Spanish only six names take one, plural names
  go without («de Países Bajos»); 15 names take «the» in English.
- **v1.4** (2026-11-18): decisions after the first demo of epic 3: wrong-answer feedback "¡Uy! Era…" (RND-04,
  D16) · flags in a 4:3 frame for now, real proportions as a Could (D17) · names with their article in sentences
  (DATA-09, D18) · the back button goes back inside the game (NAV-01, D19).
- **v1.3** (2026-11-17): level 3 "tricky" wrong options defined (LVL-06); similar flags and land borders reviewed
  (D15).
- **v1.2** (2026-11-17): level 3 "tricky" distractors split into story #37; same-region distractors until then (D14).
- **v1.1** (2026-11-17): country data review (D13) · every country has a quiz capital (CAP-02) · de facto flags
  allowed from Wikimedia Commons (DATA-05) · Sahara Occidental gets its capital, El Aaiún (Appendix A.1).
- **v1.0** (2026-11-17): approved. Extended set completed with de facto states and autonomous regions
  (Abjasia, Osetia del Sur, Transnistria, Chipre del Norte, Somalilandia, Puntland, Jubalandia, Gagauzia…) and
  reorganized by category (Appendix A) · category `partially-recognized` renamed to `limited-recognition` ·
  Irlanda del Norte dropped (no official flag) · new rules SHAPE-04 and CAP-03 · flags from Wikimedia Commons when
  missing in *flag-icons* (DATA-05) · public repo + GitHub Pages (D10) · theme C «Bloques» (D11).
- **v0.2** (2026-11-16): six games (two directions per topic) · level 4 Experto with the extended entity set ·
  English as a second language · unlocking confirmed · name MiAtlas67 · decisions table.
- **v0.1** (2026-11-16): first draft.

---

## Appendix A — Extended set (level 4 Experto)

52 entities. Spanish names follow DATA-02; the English name is given where it differs noticeably. The data story
fills in codes, capitals and sources, and may drop an entity that fails DATA-07.

### A.1 `limited-recognition` — partially recognized or de facto states (8)

| Entity | Notes for the data story |
|---|---|
| Kosovo | |
| Taiwán | |
| Sahara Occidental *(Western Sahara)* | Capital: El Aaiún *(Laayoune)*, as proclaimed (D13) |
| Abjasia *(Abkhazia)* | Flag from Wikimedia Commons |
| Osetia del Sur *(South Ossetia)* | Flag from Wikimedia Commons |
| Transnistria | Flag from Wikimedia Commons |
| Chipre del Norte *(Northern Cyprus)* | Capital: Nicosia del Norte *(North Nicosia)*, not Chipre's Nicosia (CAP-03, D32) |
| Somalilandia *(Somaliland)* | Flag from Wikimedia Commons |

### A.2 `territory` — dependent and overseas territories (31)

| Region | Entities |
|---|---|
| Europa | Islas Feroe, Gibraltar, Isla de Man, Jersey, Guernsey |
| América | Groenlandia, Puerto Rico, Aruba, Curazao, Sint Maarten, Bermudas, Islas Caimán, Islas Vírgenes Británicas, Islas Vírgenes de los Estados Unidos, Islas Turcas y Caicos, Anguila, Montserrat, Islas Malvinas *(en: Falkland Islands)*, San Pedro y Miquelón |
| Asia | Hong Kong, Macao |
| África | Santa Elena |
| Oceanía | Nueva Caledonia, Polinesia Francesa, Guam, Samoa Americana, Islas Marianas del Norte, Islas Cook, Niue, Tokelau, Isla Norfolk |

*Many British territories share the "blue ensign" design: perfect tricky distractors for Experto.*
*Nueva Caledonia has two flags in official use; the data story picks one and documents the choice.*

### A.3 `subnational` — constituent countries and autonomous regions (13)

| Region | Entities | Notes for the data story |
|---|---|---|
| Europa | Inglaterra, Escocia, Gales, Åland, Gagauzia | Inglaterra: Londres, shared with Reino Unido (CAP-03) |
| América | Bonaire, San Eustaquio, Saba (Caribe neerlandés) | San Eustaquio: Oranjestad, shared with Aruba (CAP-03) |
| Asia | Kurdistán iraquí *(Kurdistan Region)* | |
| África | Puntland, Jubalandia *(Jubaland)*, Zanzíbar | Puntland and Jubalandia not in Shapes games (SHAPE-04) |
| Oceanía | Bougainville | |

### A.4 Not included, and why

| Entity | Reason |
|---|---|
| Irlanda del Norte | No flag in official use since 1972 (DATA-07) |
| Azores, Madeira | Autonomous regions of Portugal: for the family they are Portugal, not a territory of their own (D30) |
| Artsaj / Alto Karabaj | Dissolved on 1 January 2024 |
| Wallis y Futuna, Guayana Francesa, Reunión, Mayotte | They officially use the French flag |
| Spanish autonomous communities | Planned as a themed pack (Could, §5) |
