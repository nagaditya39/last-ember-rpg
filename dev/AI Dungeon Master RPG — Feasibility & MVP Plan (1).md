# AI Dungeon Master RPG — Feasibility & MVP Plan

Nov 1, 2026 · @aditya · Revision 3

The game is feasible as a free-hosted MVP if the story is a hand-authored graph and every piece of prose, including the private hints, is pre-generated offline with the local model and served as static text. Nothing improvises at the live event, which removes the laptop as a runtime dependency and leaves the Render server as the only thing that has to hold up for 200 players.

## What changed in Revisions 2 and 3

- Scale is now up to 200 players (40 teams), realistically about 20 teams.
- No AI improvisation of the major story. Narration and hints are generated before the event, reviewed by you, and committed as JSON.
- Hints may be rephrased live later, but the MVP pre-generates several phrasings per hint to keep the 20-minute event light.
- The laptop and Ollama are now a build-time tool: no live worker, job queue or fallback path.
- In the MVP players cannot interact with the AI at all: they read their hints and pick the decision. A later phase may let them ask a Guide questions, limited to their team's current stage and context; it is designed in as a seam but not built.
- Revision 3: human team chat is confirmed; later Guide answers are private to the asker; the story uses a temporary typical high-fantasy premise; hosting must be free, so I re-checked the free hosts (see Free hosting options compared); and your current laptop is a GTX 1650 with 4 GB of VRAM, so the model plan is rewritten around that.

## Feasibility verdict

Overall: feasible, medium risk, $0 to host. If the free instance struggles at 200 sockets, the plan lists free-only mitigations first. The risky parts are authoring the story and the free tier's CPU at 200 concurrent players, not the web tech and not the LLM.

| Component | Feasibility | Main risk | Mitigation |
| --- | --- | --- | --- |
| Team chat rooms (anonymous handles), up to 40 teams | High | Abuse across 200 people; chat fan-out CPU on a free instance | Room codes, rate limit, profanity filter, host can remove a player; load test in Phase 0 |
| Roles + private hints | High | Hint leaks through the client | Server sends each hint only to that role's socket |
| Decision maker + timer | High | Decision maker drops or goes idle | Auto-reassign, timeout fallback |
| Branching story, 6 alternate endings, 1 true ending | High | Authoring effort, not technology | Story graph lives in code; all prose is pre-generated and reviewed |
| Pre-generated prose with the local LLM | High | Quality and consistency of generated text; hints that leak the answer | Review pass, leak check against the answer key, several phrasings per item |
| Live LLM during the event | Not needed | Latency, laptop sleep, queueing | Removed from the MVP; optional feature flag later |
| RAG | Not needed for MVP | Added complexity for no gain | Look up lore by node id; add embeddings only if a chatbot role is built |
| Free hosting for 200 players | Medium | Cold start with a joining surge; low CPU; restarts | Warm up 5 minutes early, stagger joins, lighter socket library, static frontend on a free host, load test (see Free hosting options compared) |
| Future AI (ask-the-Guide Q&A) | Medium | Reintroduces prompt injection, live load and the chance of leaking hints | Stage-scoped context builder and a disabled stub now; guardrails later (see Path to AI later) |

Host choice: Render fits best because it runs a long-lived Node WebSocket server on a free tier. I re-checked the alternatives for Revision 3 (see Free hosting options compared): Heroku has had no free tier since 2022, PythonAnywhere does not run server-side WebSockets, and Vercel now offers WebSockets in public beta but needs an external store for shared state. My earlier note that Vercel cannot hold open sockets was out of date.

## Game design for the MVP

The game is 10 decisions in four chapters with 7 endings: 6 alternate and 1 true. The goal is declared in the intro and only the true ending achieves it. At about 105 seconds per decision a full run takes about 20 minutes. Code decides what happens next; the text players read is authored facts turned into prose by the local model before the event. Gaps in your rules that I filled are marked A1-A12 and listed in the assumptions table below.

### Roles and hints

| Role | Sees | Hint flavour |
| --- | --- | --- |
| Captain | Nothing extra; picks the option | Must gather clues through chat |
| Seer | Omens of what is coming | "The river runs red under the third bridge" |
| Scout | Terrain and physical threats ahead | "Fresh tracks lead to the north gate" |
| Scholar | Lore and history behind the scene | "The old charter forbids opening that door at night" |
| Empath | Moods and intentions of characters | "The guide is lying about one thing, not everything" |

Each decision node has four authored hints, each only partly true on its own, and the hints' job changes by band (A9). In D1-D3 they foreshadow and show which option scores best. In D4-D5 they expose the doom option and subtly separate the true path from the detour. In D6-D8 any two hints must rule out both wrong options. In D9-D10 they flag the one trap. With fewer than five players, the missing roles' hints go to the remaining advisors, so the puzzle stays solvable.

Each hint has 3 pre-generated phrasings that carry the same information (A11). The server picks one per team at the start of the game, so neighbouring teams comparing notes see different wording of the same clue. A reviewer checks that every phrasing keeps the hint's job and does not name the answer.

### Story shape

```
CHAPTER 1 (D1-D3): every pick scores 2 / 1 / 0 points (hidden)
  total 0-1  ------------------------> ALT ENDING 1
  total 2-3  ------------------------> DRIFT node (D4)
  total 4-6  ------------------------> MAIN track

MAIN track                                  DRIFT node (one decision)
  D4-D5   doom option    -> ALT ENDING 2      right option   -> back to MAIN
          true option    -> stay on MAIN      wrong options  -> ALT ENDING 3
          detour option  -> DRIFT node
  D6-D8   right option   -> stay on MAIN
          'rash' wrong   -> ALT ENDING 4
          'timid' wrong  -> ALT ENDING 5
  D9-D10  two right options -> stay on MAIN
          wrong option   -> ALT ENDING 6
  D10 right option -> TRUE ENDING (goal achieved)
```

Chapters set the scenery: Chapter 1 is D1-D3, Chapter 2 is D4-D6, Chapter 3 is D7-D9 and Chapter 4 is the D10 finale (A1). The difficulty bands in the table below cut across chapters. A drift node is a one-decision detour that can rejoin the main track (A3). The graph has 13 decision nodes (3 in Chapter 1, 7 on the main track D4-D10, 3 drift nodes) and 7 ending nodes.

| Step | Options | Outcomes | Time |
| --- | --- | --- | --- |
| Intro | - | Goal and roles revealed | 1 min |
| D1-D3 | Strong (2 pts), mixed (1), weak (0); none looks wrong | Total 0-1: Alt ending 1; 2-3: drift node; 4-6: main track | 105 s each |
| D4-D5 | One doom, one true, one detour | Doom: Alt ending 2; true: stay on main; detour: drift node | 105 s each |
| Drift node (D4-D6) | One right, two wrong | Right: back to main; wrong: Alt ending 3 | 105 s |
| D6-D8 | One right, two wrong | Right: stay on main; 'rash': Alt ending 4; 'timid': Alt ending 5 | 105 s each |
| D9-D10 | Two right, one wrong | Right: stay on main (right at D10 gives the true ending); wrong: Alt ending 6 | 105 s each |
| Ending | - | Narrated outcome and a short debrief | 1.5 min |

### What each node contains

- Authored facts (input to the generator, never shown raw): 2-3 sentences of scene truth, the declared goal and any lore snippet
- Three option labels, each with an outcome (next node, drift node or ending) and a type (strong, mixed or weak in Chapter 1; true, doom, detour, right or wrong after that)
- Four role hints, each with 3 reviewed phrasings
- Narration text for each way of arriving at the node, with 2 reviewed variants each (A10): the scene opens by acknowledging the previous choice, so a Captain who picked differently reads different words
- Ending nodes hold narration only, plus a debrief line naming the choice that mattered

### Rules that protect the design

- Player chat text never reaches any model in the MVP, which removes prompt-injection risk
- Hints are sent only to the matching role's connection, never hidden in the browser
- Scores, drift status and which option is right stay on the server and are never sent to browsers
- A 90-second decision timer picks the option the advisors suggested most, else a random one (A7)
- If the Captain disconnects, the longest-connected teammate takes over

### Placeholder premise and endings (temporary, typical high fantasy)

This premise exists so the vertical slice has something to write against. It can be swapped at any time without changing the structure.

- **Title:** The Last Ember of Aldoria
- **Setting:** a classic high-fantasy realm; the kingdom's founding flame has gone out and an unnatural winter creeps south.
- **Declared goal (shown in the intro and pinned, A6):** carry the Emberstone across the realm and relight the Founder's Flame at the Altar of Aldoria before the Ashen Eclipse.
- **Tone:** heroic with a little dread, plain language, addressed to "you" (the whole team).
- **Roles fit unchanged:** Captain (the Warden), Seer, Scout, Scholar (the Loremaster), Empath (the Heartspeaker).

| Chapter | Decisions | Placeholder setting | What it does in the structure |
| --- | --- | --- | --- |
| 1 The Road Out | D1-D3 | A border village, a flooded ford, a haunted inn | Hidden score decides main track, drift or early end |
| 2 The Thornwood | D4-D6 | A cursed forest, a hedge-witch's offer, the smugglers' trail | Doom option is the witch's bargain; detour is the smugglers' trail |
| 3 The Frostbound Pass | D7-D9 | An ice bridge, a besieged keep, the Sunken Library | Rash versus timid choices; two-right-one-wrong from D9 |
| 4 The Altar | D10 | The ruined Altar of Aldoria | Final choice: how the flame is lit |

| Ending | Reached by | Placeholder idea |
| --- | --- | --- |
| Alt ending 1 | Chapter 1 score of 0-1 | The Road Ends at the Ford: the party never leaves the lowlands and winter arrives |
| Alt ending 2 | Doom option at D4 or D5 | The Witch's Bargain: the flame is traded for a crown of ash |
| Alt ending 3 | Wrong pick on a drift node | Lost in the Smugglers' Mire |
| Alt ending 4 | 'Rash' option at D6-D8 | The Charge at the Keep: the Emberstone shatters in a doomed assault |
| Alt ending 5 | 'Timid' option at D6-D8 | The Long Wait: the Eclipse falls while the party debates |
| Alt ending 6 | Wrong option at D9 or D10 | One Step Short: the flame catches, then gutters out |
| True ending | Right pick at D10 | The Flame Rekindled: the declared goal is achieved |

### Odds of reaching the true ending (simulated)

I simulated 200,000 teams per row under your rules. 'Skill' is the chance a team spots the best option on any one decision; otherwise it guesses. A team that only guesses reaches the true ending under 1% of the time.

| Team skill | True ending, strict rules | True ending if 'timid' at D6-D8 becomes a detour (A4) |
| --- | --- | --- |
| 0.5 | 13% | 23% |
| 0.6 | 21% | 33% |
| 0.7 | 33% | 45% |
| 0.8 | 49% | 60% |
| 0.9 | 71% | 79% |

Teams that fail finish early: a skill-0.7 team averages about 17 minutes and a skill-0.9 team about 19. I recommend the strict rules, then tuning hints in playtests so typical teams land at skill 0.6-0.8, which sends roughly 1 in 5 to 1 in 2 teams to the true ending. That skill range is my guess until you playtest. With 20 teams that is roughly 4 to 10 teams reaching the true ending.

### Assumptions I filled in (please confirm)

| ID | Gap in your rules | What I chose | Alternative |
| --- | --- | --- | --- |
| A1 | Stages of 3 decisions do not divide 10 evenly, and your difficulty bands (1-3, 4-5, 6-8, 9-10) do not match them | Four chapters for scenery (D1-3, D4-6, D7-9, D10 as a one-decision finale); difficulty bands are a separate axis | Chapters of 3, 3, 2, 2 aligned to the bands |
| A2 | 'Chance to tie into the main storyline' in D1-D3 has no mechanism | Hidden score per pick (strong 2, mixed 1, weak 0): 0-1 ends early, 2-3 enters drift, 4-6 stays on main | Each pick opens its own mini-branch |
| A3 | How long a 'slightly different path' lasts | A drift node is one decision with one right option: right rejoins main, wrong gives Alt ending 3 | A two-decision detour with partial recovery |
| A4 | What the two wrong options do in D6-D8 | Each ends the game with its own ending (rash 4, timid 5); no tie-back | Timid option detours instead, which makes the true ending easier (table above) |
| A5 | What the two right options do in D9-D10 | Both keep the team on main; they change only narration flavour | Each right option unlocks a different variant of the true ending |
| A6 | The goal declared at the start | Shown in the intro and pinned on every screen; alternate endings miss it in different ways; goal text is a placeholder | Alternate endings show how close the team got |
| A7 | Timing and timeouts | 105 seconds per decision (90-second timer plus about 15 seconds to read the narration, shown with a cosmetic typewriter effect); timeout takes the most-suggested option, else a random one, so idling has a cost | Timeout counts as the weakest option |
| A8 | Failed teams finish early (between decisions 3 and 10) | A short debrief names the choice that mattered and the goal missed; no replay in the MVP | Replay from a checkpoint |
| A9 | How hints differ by band | Band-specific hint jobs (see Roles and hints); no single hint names the right option | Uniform hints in every band |
| A10 | Pre-generated narration cannot see the whole play history | Narration is written per node and per incoming option (the previous choice only); flags and score never appear in the text | Per-path narration for the whole history, which multiplies the text |
| A11 | Fixed hints let neighbouring teams copy answers | 3 phrasings per hint, one picked per team at game start | One phrasing per hint |
| A12 | Whether players still talk to each other when they cannot talk to the AI | Confirmed: human team chat stays (it is how advisors share hints); only the AI is non-interactive | Hints shown on screen and chat removed, which makes the game a pure reading and voting exercise |

## Architecture

One small server on Render holds all game logic, the chat and the pre-generated content. At the event nothing else is involved; the laptop is only used beforehand to generate the text.

```
 BEFORE THE EVENT (laptop, offline)
   authored facts + answer key
        -> generator script -> Ollama -> candidate text
        -> your review + leak check -> story/*.json in the repo
        -> git push -> Render deploy

 AT THE EVENT
 Players (phones / browsers, React app)
        |  wss (WebSocket)
        v
 +--------------------------------------------+
 | Render web service (Node + Socket.IO)      |
 |  - lobby, team rooms, anonymous chat       |
 |  - game engine: story graph, roles, timer  |
 |  - per-role hint delivery (picks phrasing) |
 |  - content loaded from JSON into memory    |
 |  - host console (password protected)       |
 |  - serves the built frontend               |
 +--------------------------------------------+
```

### Flow of one decision

1. The server sends the team the narration text for this node and the way they arrived (loaded from memory) plus the three option labels.
2. At the same moment it sends each advisor the team's chosen phrasing of their private hint, only to that socket.
3. The team chats; advisors can post suggestions; the Captain picks an option or the 90-second timer fires.
4. The engine validates the pick, applies the band rules, then moves to the next node, a drift node or an ending.

There is no model call anywhere in this loop, so a decision costs the server microseconds of game logic plus chat traffic.

### State and failure handling

- Team state lives in server memory; after each decision a small snapshot can go to Render's free Key Value store, so a restart does not lose a game.
- Players keep a resume token in the browser and rejoin their team after a dropped connection.
- Content is read-only JSON loaded at startup, so a restart restores it immediately.
- The host console shows teams, connections and player counts, and can pause, skip or remove a team or player.

### Seams for the future Guide (interfaces only, no player-facing feature)

- `buildGuideContext(team, player)`: returns only the current stage's public facts, the choices the team has already made and the hints that player has already been shown. It is built and unit-tested in the MVP; nothing calls it yet.
- `GuideService`: an interface with a disabled stub that answers "not available". The MVP client has no ask box and the server rejects the event.
- `HintProvider`: returns a hint for a node and role; static pre-generated phrasings now, a model later.
- `shared/` holds a specified, unused job protocol (outbound worker socket, job, streamed tokens), so adding live generation later does not change the game engine.
- Chat messages keep a sender-kind field (human only for now).

## Tech stack and models

One language (TypeScript) end to end, one Render service, and Ollama on the laptop for offline generation.

| Layer | Choice | Why | Alternative |
| --- | --- | --- | --- |
| Frontend | React + Vite + TypeScript, plain CSS | Fast to build, mobile-first two-pane chat UI | Angular or Svelte if you prefer |
| Realtime | Socket.IO | Rooms map to teams; auto-reconnect built in | Native `ws` (lighter on CPU) |
| Backend | Node 20+, TypeScript, Fastify | Same language as the frontend; shared event types | FastAPI + python-socketio |
| Validation | Zod | Checks every socket event and the story files | Pydantic (Python) |
| Story data | JSON files in the repo, linted at startup and in CI | Version-controlled; a script proves all paths are valid and every node has its text | YAML |
| Game state | In-memory map, optional snapshot to Render Key Value | Disk is wiped on free instances | Free Render Postgres (expires after 30 days) |
| Content generation | Ollama on the laptop, run by a generator script | Simplest local setup; works on Windows, Mac, Linux | LM Studio, llama.cpp |
| Hosting | Render free web service for the socket server; optionally a free static host for the React build | Holds long-lived WebSockets; static hosting keeps the Render CPU for sockets | See Free hosting options compared |
| Testing | Vitest, plus a bot script that simulates 40 teams | Lets you load-test 200 sockets without 200 people | Playwright for UI |

### Models (offline generation; speed barely matters now)

Because generation happens once, ahead of time, token speed only affects how long a regeneration takes. Model names move quickly; confirm what is current in the Ollama library and keep the model name as a config value.

| Tier | Hardware | Starting model | Notes |
| --- | --- | --- | --- |
| A0 (yours now) | Laptop GTX 1650, 4 GB VRAM | Qwen3 4B, 4-bit, context capped at 2K tokens; Qwen3 1.7B as the last resort | Weights are about 2.5 GB, so there is little room; if it spills over, Ollama moves layers to the CPU and runs slower, which an offline batch tolerates |
| A | Any 16 GB RAM laptop, no GPU | Qwen3 4B or Phi-4-mini (about 3.8B), 4-bit | Works, but needs more review and rewrites |
| B | 8 GB GPU, or Apple Silicon with 16 GB | Qwen3 8B, 4-bit (about 5-8 GB) | Recommended once you have the hardware |
| C | 16-24 GB GPU | A 14B-class model, 4-bit | Best prose and best at following the "do not reveal the answer" rule |
| H (later) | Hosted API | A popular hosted model | Billed per token, so keep it out of the free-only MVP path; use it for a one-off polish pass or the future Guide |

About the GTX 1650: one third-party fit checker rates Qwen3 4B as not fitting a 4 GB card at a 4K context, mostly because of cache and runtime overhead. I have not tested it, so treat that as unconfirmed. Capping the context at 2K and measuring in Phase 0 settles it. A 4B model writes weaker prose than an 8B one, so the leak check and your review matter more, and you can later re-run the same pipeline on a bigger or hosted model with no code changes, because the model name is config.

### How the model is used (offline)

- Output is plain prose, never JSON; options, routing and the answer key are authored and are never given to the model for hints it is rewriting, only the partial-truth clue and the target phrasing job.
- Settings: thinking mode off, temperature about 0.8 for variety between phrasings, output capped near 220 tokens.
- Prompt for narration: a fixed dungeon-master persona and rules (90-120 words, address the team as "you", do not invent options), plus the node's facts and the previous choice.
- Prompt for hints: the authored clue, the role's flavour, and "rewrite in this voice, 25-40 words, keep the same information". The generator makes 3 phrasings per hint.
- A leak check compares each hint against the answer key (for example, it fails any hint that names the right option label) before it reaches your review.
- Volume: about 52 hints x 3 phrasings, about 40 narrations x 2 variants, and 7 endings with debriefs, roughly 23,000 output tokens per full pass. That is about 13 minutes at 30 tokens/s, 25 minutes at 15 tokens/s and about 75 minutes at 5 tokens/s, which is plausible on a 4 GB card that spills to the CPU (all estimates; Phase 0 measures them). Plan on several passes, and generate in small batches while you review.

## Capacity, latency and free-tier limits

At the event the model is not running, so capacity is a question about the Render server and its sockets. These are estimates from assumed behaviour, and the Phase 0 load test replaces them with measurements.

### Server load estimate (40 teams, 200 players)

- Connections: 200 WebSockets, plus 40 team rooms. Memory per socket is small; game state for 40 teams is a few megabytes.
- Chat: assuming each player sends one message every 5 seconds, that is about 40 messages per second inbound. Each goes to at most 5 teammates, so about 200 outbound emits per second at a busy moment. That is modest for Node, but the free instance has little CPU, so this is the number to test.
- Content: every text the players read is already in memory, so serving a decision is a lookup, not a computation.
- Join surge: 200 people opening the link at the same moment, possibly on a cold service, is a bigger risk than steady-state chat.
- Expected case: at 20 teams (about 100 players) the load is roughly half of the above.

Phase 0 targets, to be confirmed by measurement: 200 bot sockets in 40 teams, chat at the rate above, no dropped connections over 30 minutes, 95th-percentile message delay under 1 second.

### Render free tier: what the docs say

- A free web service spins down after 15 minutes with no inbound traffic; since a February 2026 change, WebSocket messages on an existing connection count as traffic.
- A spun-down service takes about a minute to start again on the next request.
- The filesystem is ephemeral, so local SQLite files vanish on restart or redeploy.
- Each workspace gets 750 free instance hours per month, and Render may restart a free service at any time.
- Free Render Postgres databases expire 30 days after creation.
- An older community thread reports free-tier sockets closing after about 5 minutes; Render acknowledged it as an open issue at the time. Mitigation: ping every 25 seconds, auto-reconnect, and test a 30-minute idle session in Phase 0.

As far as I know, the free instance has about 512 MB of RAM and a fraction of a CPU; verify both on Render's pricing page before the event. If the load test shows the free instance cannot sustain 200 sockets, use these free-only levers first: swap Socket.IO for the lighter native `ws` library; limit chat to one message per player every 2 seconds and 200 characters; send no typing indicators or presence pings beyond the 25-second heartbeat; and serve the React build from a free static host so the Render instance only handles sockets. A paid instance stays possible if you ever choose it, but it is not part of the plan.

Practical routine: open the site about 5 minutes before the event to wake it, check the host console, then release the room codes in waves rather than all at once.

## Free hosting options compared

You asked for a free host because AI costs may come later. At runtime the MVP has no AI cost at all, since everything is pre-generated, so a free host is realistic. I re-checked the options for this revision; each row rests on one page I read, and none of it is tested.

| Host | Fit for this game | Notes |
| --- | --- | --- |
| Render free web service | Best fit | Long-lived Node server with WebSockets; spins down after 15 minutes idle with about a one-minute cold start; 750 free hours a month |
| Vercel Hobby | Possible, more work | WebSockets are in public beta on Vercel Functions. Instance memory is not shared between function instances, so game state would need an external store such as Redis from its Marketplace. One comparison article says Hobby functions run at most 5 minutes, which would mean reconnecting during a 20-minute game; I could not confirm that. Best use here: host the static React build |
| Heroku | Not free | Free plans ended in November 2022; a third-party page lists the cheapest plan at about $5 a month |
| PythonAnywhere | Does not fit | A staff reply in a forum thread (July 2023, so it may have changed) says server-side WebSockets are not supported on any plan; the workaround is polling or an outside service such as Pusher |
| Netlify, Cloudflare Workers | Does not fit as the game server | Per a Render-written comparison (a competitor's view): 60-second function limit on Netlify; Workers have no Node APIs and very small CPU limits |
| Fly.io, Railway | Not free for new users | Fly.io has no free tier for new accounts; Railway gives a small monthly credit that will not keep a service running |
| Your laptop plus a free tunnel | A fallback to evaluate | Free, but it makes the laptop a runtime dependency again, and I have not checked any tunnel's limits |

Recommendation: Render for the socket server, optionally a free static host for the frontend, and Vercel WebSockets only if Render fails the Phase 0 load test.

## MVP build plan

Six phases, about 9-11 focused days for one developer (an estimate). Do Phase 0 first: it proves the riskiest link, 200 sockets on the Render free tier, and measures your generation speed before any game code exists.

| Phase | Goal | Effort | Exit criteria |
| --- | --- | --- | --- |
| 0 Spikes | Prove 200 sockets on Render; measure generation speed | 1 day | 200 bot sockets stable 30 minutes; p95 message delay under 1 s; generation tokens/s recorded |
| 1 Lobby and chat | Teams, aliases, anonymous chat | 1-2 days | 3 browsers chat in one team and rejoin after refresh |
| 2 Game engine | Story graph, roles, hints, timer | 2 days | Bots reach all 7 endings; linter passes |
| 3 Content pipeline | Generator, review step, leak check, phrasing selection | 1 day | One full pass of a sample story generates, passes the leak check and loads in the game |
| 4 Story authoring | 13 decision nodes, 52 hints, 7 endings | 3 days | A human team that plays well finishes in 18-22 minutes |
| 5 Harden and ship | Host console, load test, runbook | 1-2 days | 40 bot teams plus 2 human teams finish; survives a forced restart |

### Phase 0: spikes

1. Deploy a "hello socket" app to Render; run a bot script that opens 200 sockets in 40 rooms and sends chat at the assumed rate; record message delay, CPU behaviour and any drops; run it once with Socket.IO and once with native `ws` to see how much CPU the library costs.
2. Hold sockets idle for 30 minutes with 25-second pings; time a cold start and a 200-client join surge.
3. Install Ollama, pull Qwen3 4B (4-bit, context capped at 2K), generate 20 sample narrations and hints from the real prompts on the GTX 1650, and record tokens per second and whether it spills to the CPU.

### Phase 1: lobby, rooms, chat

1. Scaffold a repo with `client/`, `server/`, `generator/` and `shared/` (event types, story schema, the unused worker protocol).
2. Join by room code plus an auto-generated alias; assign up to 5 players per team.
3. Anonymous Omegle-style chat: two-pane mobile layout, message rate limit, basic profanity filter.
4. Resume token in the browser so a refresh puts the player back in their seat.
5. Tag every chat message with a sender kind (human only for now).

### Phase 2: game engine

1. Define the node schema (facts, three options with next ids and a type, four hints with 3 phrasings each, narration per incoming option with 2 variants) and a linter: every path reaches an ending, there are exactly 7 endings (one true), every node has all its text, and each band has the right count of right and wrong options.
2. Build the state machine: intro, decision, resolve, next node, ending.
3. Role assignment, hint redistribution for small teams, Captain reassignment, 90-second timer with advisor suggestions.
4. Define the `HintProvider` interface with the static implementation, plus the `buildGuideContext` function and a disabled `GuideService` stub; send hints per role from the server only; write bot players that play every path in tests.

### Phase 3: content pipeline

1. Generator script: reads authored facts, calls Ollama with the narration and hint prompts, writes candidate JSON.
2. Leak check: fails any hint or narration that names the right option or reveals the score.
3. Review step: a simple page or diff showing each candidate next to its facts, so you accept, edit or regenerate.
4. Runtime picks one phrasing per hint per team at game start and one narration variant per arrival.

### Phase 4: story authoring

1. Fix the premise, the declared goal and the true ending first; then write the finale and work backwards.
2. Build a vertical slice: Chapter 1, the main track to D6, one drift node and two endings. Playtest it with two teams.
3. Tune hints until any two hints identify the right option (in D6-D8, ruling out both wrong ones) but one alone does not.
4. Write D7-D10, the other drift nodes and all six alternate endings, then run the generator and review pass.

### Phase 5: harden and ship

1. Secrets in environment variables, CORS locked to your domain, host console behind a password.
2. Load test with 40 bot teams on the live Render URL; if it fails, apply the free-only levers and retest.
3. Optional: snapshot team state to Render Key Value after each decision and restore on restart.
4. Write a one-page runbook: warm-up, releasing room codes in waves, how to recover a stuck team.

### Out of scope for the MVP

Live LLM generation, free-form player actions, RAG with embeddings, any player-facing AI interaction (the Guide), accounts and saved history, leaderboards and voice.

## Path to AI later: the Guide

Not in the MVP. For the MVP the AI-written text is something players only read: the narration, their private hint and the decision buttons. A later phase can add an "ask the Guide" box where a player asks a question and gets a short answer.

- **Scope rule:** the Guide answers only from the team's current stage and context: the current node's public facts, the choices the team already made, and the hints the asking player has already been shown. It cannot see future nodes, other roles' private hints, the answer key or the hidden score.
- **How the scope is enforced:** the server builds that context with `buildGuideContext` from the team's state, so the scope moves forward automatically as the team advances, and the model never receives the whole story bible. Only the asking player's own hints are included, so the Guide cannot be used to read a teammate's private hint.
- **Visibility (confirmed):** answers are private to the asker and never posted to team chat. That is required anyway, because an answer may draw on the asker's private hint. It saves one chat fan-out per answer, but fan-out is not the expensive part; the model's compute is, so privacy does not reduce inference load.
- **Out-of-stage questions:** get a pre-written, in-character deflection ("that is a matter for a later chapter").
- **Guardrails:** a leak check of every answer against the answer key, a per-player cap (for example 3 questions per decision), and a host kill switch.
- **New risk:** free text from players reaches a model for the first time, so prompt injection returns. Because the context holds nothing the player has not already seen, the damage from a successful injection is limited, which is the reason for the narrow context.
- **Load:** if all 200 players asked 3 questions in one decision window and answers were about 100 tokens, that is roughly 6 questions per second and 570 tokens per second, around 20 times what a laptop produces at 30 tokens per second (an estimate from assumed numbers). Real usage will be far lower, but this phase likely needs a hosted model API, a very small model, or the next option.
- **Zero-generation option:** pre-write about 8 question-and-answer pairs per node, match a player's question to the closest one, and fall back to the deflection. This keeps the Guide scoped by construction and needs no live model. It is the one place where embeddings would earn their place.
- **Cheaper stepping stone:** live rephrasing of hints behind a feature flag, using the same `HintProvider` seam, with the pre-generated phrasings as the fallback.

## Risks and open questions

The biggest risk is the story, not the code: 52 balanced hints across 13 decision nodes, each with 3 phrasings that must not leak the answer, take longer to write and review than the engine takes to build.

| Risk | Likelihood | Impact | Response |
| --- | --- | --- | --- |
| Story authoring and review run long | High | High | Vertical slice first; stub D7-D10 and the later endings until Chapter 1 and the early main track play well |
| Free instance cannot sustain 200 sockets or the join surge | Medium | High | Phase 0 load test, staggered room-code release, lighter socket library and chat limits, static frontend on a free host |
| Free instance restarts mid-game | Medium | Medium | Resume tokens, optional state snapshot, content reloads from JSON |
| Socket drops on the free tier | Medium | Low | 25-second pings, auto-reconnect |
| Generated hints leak the answer or drift in meaning | Medium | Medium | Leak check, human review, three phrasings checked against the original clue |
| Chat abuse across 200 people | Medium | Medium | Room codes, rate limit, profanity filter, host can remove a player |
| Teams compare screens and copy hints | Medium | Low | Per-team phrasing choice (A11) |

### Open questions

- Is the audience internal and known, or a fully public link? With 200 people this sets how strict moderation must be.
- Is a laptop-hosted server behind a free tunnel acceptable as a last-resort fallback if free hosting fails the load test?
- Who writes the final story: you, or Claude drafting it from a theme you give? (The premise above is a placeholder.)
- Should players choose their roles, or should the server assign them?
- Do you want to stay with React and Node, or reuse Angular and FastAPI?
- Please confirm or correct assumptions A1-A11 (A12 is confirmed) in Game design.
- When is the first playtest or event date?

## Sources

Hosting facts come from Render's own pages. Model speeds and recommendations come from third-party blog posts seen as search excerpts, not opened in full, so treat them as approximate and measure in Phase 0. Server capacity figures in this revision are my estimates and have not been measured. The hosting comparison and GTX 1650 notes in Revision 3 come from the last five links below; I read each page once and tested nothing.

- [Render: Deploy for Free](https://render.com/docs/free)
- [Render changelog: free services stay active on WebSocket messages](https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages)
- [Render community: Socket.IO timeouts on the free tier](https://community.render.com/t/socket-io-in-a-node-app/3051)
- [Best Ollama models for agents](https://localaimaster.com/blog/best-ollama-models-for-agents)
- [10 best local LLM tools and models for developers in 2026](https://fungies.io/?p=40691)
- [Ollama 2026 full guide](https://itsourcecode.com/ai-framework/ollama-run-local-llms-2026-complete-guide/)
- [Structured output from small local models](https://agent-zone.pages.dev/knowledge/agent-tooling/structured-output-local-models)
- [Vercel: do Functions support WebSocket connections?](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)
- [Render: platforms with a real free tier in 2026](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026.md) (a competitor's comparison)
- [PythonAnywhere forum: WebSocket support](https://pythonanywhere.com/forums/topic/1034)
- [Heroku free tier status 2026](https://snapdeploy.dev/heroku-free-tier) (third party)
- [Qwen3 4B on a GTX 1650 4 GB](https://willitrunai.com/de/can-run/qwen-3-4b-on-gtx-1650-4gb) (third-party fit checker)
