# The Last Ember of Aldoria (prototype)

Team chat RPG: teams of up to 5, one Warden decides, four advisors each see a private clue. 10 decisions, 6 alternate endings, 1 true ending, about 20 minutes. **All story text is pre-written in `shared/story.json`; there is no live AI anywhere in this prototype.**

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
   git init && git add . && git commit -m "Last Ember prototype"
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
- If a player drops, their hints move to connected advisors; if the Warden drops, the longest-connected teammate takes over.
- Timeout takes the most-suggested option, else a random one.

## Not done yet (by design, see the plan)

Several phrasings per hint (the schema supports it; the story has one or two), the content generator and review step, a host console, state snapshots across server restarts, a real profanity filter, and the future ask-the-Guide feature.

## Known limits

- The story is a placeholder premise written by hand; the hints are untested with real players.
- Game state lives in server memory, so a restart ends running games.
- The load test numbers from localhost say nothing about a free cloud host. Run it against the deployed URL.
