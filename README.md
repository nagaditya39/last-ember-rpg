# Project Bridgeline (prototype)

Team decision game played on phones: teams of up to 5, one CEO decides, four leads each see a private clue. There is no free-text chat: players tap preset messages and can publish their clue. 10 decisions, 6 alternate endings, 1 true ending, about 20 minutes. **All story text is pre-written in `shared/story.json`; there is no live AI anywhere in this prototype.**

## The story

A corporate decision game set at a fictional company, **Halden Aerospace India**. A small team at the Bengaluru engineering centre must take an internal collaboration platform, **Bridgeline**, from a lab prototype to a company-wide rollout and win the Leadership Review. The decisions cover starting from real user pain, data access, scaling carefully, customer data boundaries, crediting colleagues, owning an incident, working with an internal rival, and answering the ownership question. It is inspired by the general shape of startup-platform stories (a small team, a fast-growing network, rivalry, credit, ethics) but uses no characters, scenes or text from any film or book.

The company name is fictional on purpose. It appears only in `title`, `goal` and `intro` in `shared/story.json` (search for "Halden"), so it can be swapped in one edit. Check with your communications team before using a real company name in the text, especially in the failure endings.

| Role (internal key) | Shown as | Clue theme |
| --- | --- | --- |
| `captain` | CEO | Decides; sees no clues |
| `seer` | Product Lead | What is coming: market, customer, regulatory signals |
| `scout` | CTO | What the systems and test cells can really do |
| `scholar` | Quality Lead | Records, rules and past lessons |
| `empath` | Customer Lead | What customers and colleagues truly want and fear |

Chapters: The Prototype (D1-D3), The Scale-Up (D4-D6), The Trust Test (D7-D9), The Leadership Review (D10). To retheme again, change `shared/story.json`, the role names in `shared/types.ts`, the bot wording in `shared/team.ts` and the copy in `client/src/App.tsx`. Keep the node ids (`d1`-`d3`, `m4`-`m10`, `dr_a`-`dr_c`, `end_alt1`-`end_alt6`, `end_true`) because the linter and engine rely on them.

## Built for phones (Revision 8)

The event is played entirely on phones, with teams meeting anywhere and nobody on site to help.

- **No typing.** There is no free-text chat. The Team tab is a read-only feed, and players add to it only by tapping:
  - **Preset messages** (`shared/presets.ts`): "Meet in 2 / 3 / 5 min", "I am here" (lobby only, to agree a time to meet) and "Discuss now", "Share your clues", "Not sure yet", "I agree", "Need a minute" (in the game). The server accepts only a preset id, so no free text ever reaches it except player names. Edit the wording in that one file.
  - **Publish to team**: a button on each lead's private clue. It posts that clue to the feed, once per decision. Clues stay private until published.
- **Layout.** Game and Team tabs sit at the bottom of the screen, with an unread badge on Team. The CEO's Commit button stays pinned above the tabs. Buttons are thumb-sized, and the page respects the notch and home bar. On a larger screen the game and feed sit side by side.
- **Help and FAQ.** A **? Help** button is in the header on every screen, and "New here? Read the FAQ" is on the first screen. The sheet opens with a tip for the current moment, then questions grouped as getting started, playing and something went wrong. Edit `client/src/faq.ts`; set `HELP_CONTACT` there to say where players reach a human on the day.
- **Joining.** The lobby has a **Share invite** button. After a reload or lost signal, the first screen shows **Rejoin team XXXX** and the player gets the same seat back.
- **Testing several players on one computer.** Each browser has one player id. Open `?seat=1`, `?seat=2` and so on in separate tabs.
- **Meeting times.** "Meet in N min" only works before the game starts, because the decision timer runs live. See the handover for the open question.

## Planned changes (Revisions 6 and 7, not built yet)

*Revision 8 supersedes the in-person parts of Revision 7 (huddle, stations). It keeps Revision 7's "no free-text chat" and replaces the Revision 6 preset feed with the one described above. The roles are now CEO, Product Lead, CTO, Quality Lead and Customer Lead. See the handover.*


The sections below describe the prototype as it works today. Two revisions are planned but not built. Revision 6:

- Each scene is shown as a 3-panel cut scene (picture plus a short caption) instead of a paragraph, then a 75-second decision.
- The free-text chat is replaced by a read-only team feed with preset messages and a "Share my clue" button. The server accepts only preset ids.
- A banner at the top opens a recap card with the scene's key picture and a short text recap.
- Roles become CEO, Product Lead, Lead Dev, QA Lead and Customer Lead (internal keys unchanged).
- The story is rewritten in plain language with word limits and a reading-ease check in the linter. Pictures are composed from a small SVG kit.

Full plan: the Revision 6 section of the Feasibility & MVP Plan.

Revision 7 (on top of Revision 6, also not built) changes the feed, the timing and the number of decisions in the list above:

- Teams sit together, so each decision becomes a cut scene (24 s), a read phase (20 s), a stand-up huddle with phones down (100 s) and a decide phase (30 s), about 174 s in all.
- The game is 6 decisions (8 scene nodes, the same 7 endings), still about 20 minutes.
- Clues become a fact and a role-biased worry; each scene gets a case card of three public facts, and options show a gain and a cost.
- The feed and preset messages are removed. Players tap a quiet suggestion and the CEO decides. Teams form at numbered stations with printed code cards.

Full plan: the Revision 7 section of the Feasibility & MVP Plan.

## Run it

```bash
npm install
npm run build          # builds the client into dist/
npm start              # http://localhost:3000  (open several tabs to play as a team)
```

For quick play-testing with shorter timers: `DECISION_SECONDS=30 INTRO_SECONDS=8 npm start`

Development with hot reload: `npm run dev:server` in one terminal, `npm run dev:client` in another, then open http://localhost:5173.

In the lobby the team leader can fill empty seats with **practice teammates** (bots that chat their hints and suggest options), so one person can play a whole game alone.

## Put the demo on GitHub Pages

GitHub Pages only serves static files, so it can host the **in-browser demo** (you vs. four practice teammates), not the multiplayer server. For a live walkthrough that is enough: the demo runs the same game engine and the same story.

**Option A: no build tools, 2 minutes.** `docs/index.html` is a prebuilt, self-contained copy of the demo.

1. Create a new GitHub repository and push this folder to it:
   ```bash
   git init && git add . && git commit -m "Project Bridgeline prototype"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings > Pages > Build and deployment > Source: Deploy from a branch**, branch `main`, folder `/docs`, then Save.
3. After a minute the demo is live at `https://<you>.github.io/<repo>/`.

If you change the story or the UI, run `npm run demo:docs` and commit the updated `docs/index.html`.

**Option B: GitHub Actions rebuilds it on every push.** `.github/workflows/pages.yml` runs typecheck, the story linter and the simulator, builds the demo and deploys it. To use it, set **Settings > Pages > Source: GitHub Actions** instead of Option A, then push to `main`. If you use this option, you can delete `docs/`.

Both options use one relative-path-free HTML file, so it works under the `/<repo>/` sub-path without any `base` setting.

The real multiplayer version needs a Node host with WebSocket support (see the project plan; Render's free web service is the candidate). It is not deployable to GitHub Pages.

## Single-file demo

`npm run build:demo` produces `dist-demo/index.html` (and `npm run demo:docs` also copies it to `docs/index.html`), a self-contained page where the same game engine runs in the browser against four practice teammates. No server needed.

## Checks

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript across server, shared engine and client |
| `npm run lint:story` | Verifies 13 decision nodes, 7 endings, per-band option rules, hints for every role, no dead ends, no unreachable nodes, every route to the true ending is exactly 10 decisions, and no hint repeats the right option's label |
| `npm run test:feed` | Checks the feed rules: unknown ids and free text are ignored, meeting phrases only work in the lobby, only the holder can publish a clue, once |
| `npm run sim` | Plays thousands of games through the real engine; checks every ending is reachable, no secret (option types, score) ever appears in a client view, and teams of 1-5 always have all four hints available |
| `TARGET=http://localhost:3000 TEAMS=40 SECONDS=60 npm run loadtest` | Opens 40 x 5 real WebSocket clients, chats at a steady rate and plays; reports message delay. Point `TARGET` at your deployed URL to measure the real host |

## Layout

```
shared/story.json   the whole story: scenes, options, hints (with phrasings), endings
shared/team.ts      pure game engine for one team (roles, hints, timer, chat, scoring, bots)
shared/types.ts     types and role labels
server/index.ts     Node + Socket.IO server; also serves dist/
server/*.ts         story linter, simulator, load test
client/src          React UI; net.ts switches between Socket.IO and the in-browser demo
```

## How the rules are implemented

- Chapter 1 (D1-D3): each pick scores 2 / 1 / 0 (hidden). Total 0-1 gives alternate ending 1, 2-3 a drift node, 4-6 the main track.
- D4-D5: one doom option (alternate ending 2), one true option, one detour into a drift node that can rejoin the main track.
- D6-D8: one right option; the 'rash' and 'timid' wrong options end the game with different endings.
- D9-D10: two right options, one wrong; the right pick at D10 gives the true ending.
- Every route to the true ending is exactly 10 decisions. Drift nodes replace a main node.
- A hint is sent only to the socket of the player who holds it. Option types, scores and answers never leave the server.
- If a player drops, their hints move to connected advisors; if the CEO drops, the longest-connected teammate takes over.
- Timeout takes the most-suggested option, else a random one.

## Not done yet (by design, see the plan)

Several phrasings per hint (the schema supports it; the story has one or two), the content generator and review step, a host console, state snapshots across server restarts, a real profanity filter, and the future ask-the-Guide feature.

## Known limits

- The story is a placeholder premise written by hand; the hints are untested with real players.
- Game state lives in server memory, so a restart ends running games.
- The load test numbers from localhost say nothing about a free cloud host. Run it against the deployed URL.
