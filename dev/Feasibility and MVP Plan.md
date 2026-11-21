# AI Dungeon Master RPG — Feasibility & MVP Plan

Nov 21, 2026 · @aditya · Revision 8 (Revisions 4 and 5 are recorded in the handover)

The game is feasible as a free-hosted MVP if the story is a hand-authored graph and every piece of prose, including the private hints, is pre-generated offline with the local model and served as static text. Nothing improvises at the live event, which removes the laptop as a runtime dependency and leaves the Render server as the only thing that has to hold up for 200 players.

## What changed in Revisions 2 to 8

- Scale is now up to 200 players (40 teams), realistically about 20 teams.
- No AI improvisation of the major story. Narration and hints are generated before the event, reviewed by you, and committed as JSON.
- Hints may be rephrased live later, but the MVP pre-generates several phrasings per hint to keep the 20-minute event light.
- The laptop and Ollama are now a build-time tool: no live worker, job queue or fallback path.
- In the MVP players cannot interact with the AI at all: they read their hints and pick the decision. A later phase may let them ask a Guide questions, limited to their team's current stage and context; it is designed in as a seam but not built.
- Revision 3: human team chat is confirmed; later Guide answers are private to the asker; the story uses a temporary typical high-fantasy premise; hosting must be free, so I re-checked the free hosts (see Free hosting options compared); and your current laptop is a GTX 1650 with 4 GB of VRAM, so the model plan is rewritten around that.
- Revision 6 (Nov 21, 2026, plan only, nothing built): scenes become image cut scenes; free-text chat is replaced by preset messages and clue sharing; a recap banner is added; the story is rewritten in plain language and the roles become CEO, Product Lead, Lead Dev, QA Lead and Customer Lead. See Revision 6 plan below. It overrides the chat confirmation from Revision 3, the high-fantasy placeholder and the roles table.
- Revision 7 (Nov 21, 2026, plan only, nothing built): teams sit together and huddle in person, like mini stand-ups, so each decision gets a timed huddle phase; the game shrinks from 10 to 6 decisions that each take about 174 seconds and carry more complexity (two-part clues, a case card, gain-and-cost options); in-app chat, the preset feed and the 'meet up in 5 / 10 minutes' presets are removed; teams form at numbered stations. See Revision 7 plan below. It overrides Revision 6 on timing, the feed and story length.
- Revision 8 (Nov 21, 2026, built): the event is played entirely on phones, with teams anywhere and nobody on site to help. There is no free-text chat; players tap preset messages (meet in 2 / 3 / 5 min before the game starts, discuss now, share your clues, I agree, and so on) and a Publish to team button posts a lead's own clue to a read-only team feed. The five roles are CEO, Product Lead, CTO, Quality Lead and Customer Lead. Also built: a phone-first layout, a Help and FAQ sheet on every screen, Rejoin, Share invite and an unread badge. This overrides Revision 7's in-person huddle and stations, and Revision 3's free chat; the six-decision, case-card and two-part-clue ideas in Revision 7 are not built and are open (see the handover).

## Feasibility verdict

Overall: feasible, medium risk, $0 to host. If the free instance struggles at 200 sockets, the plan lists free-only mitigations first. The risky parts are authoring the story and the free tier's CPU at 200 concurrent players, not the web tech and not the LLM.

| Component | Feasibility | Main risk | Mitigation |
| --- | --- | --- | --- |
| Team messaging, up to 40 teams | Not needed | None: Revision 7 has no in-app messaging because teams talk face to face (Revision 6 had a preset feed; Revision 3 had free chat) | Only player names are free text; the server accepts only taps and the choice |
| Roles + private hints | High | Hint leaks through the client | Server sends each hint only to that role's socket |
| In-person huddles (Revision 7) | High | Noise with 20 or more teams in one room; teams drifting out of step; one voice dominating | Guided stand-up round, vibration-only cues, station spacing, per-team clocks, a retro huddle, an in-room playtest |
| Decision maker + timer | High | Decision maker drops or goes idle | Auto-reassign, timeout fallback |
| Branching story, 6 alternate endings, 1 true ending | High | Authoring effort, not technology | Story graph lives in code; all prose is pre-generated and reviewed |
| Pre-generated prose with the local LLM | High | Quality and consistency of generated text; hints that leak the answer | Review pass, leak check against the answer key, several phrasings per item |
| Live LLM during the event | Not needed | Latency, laptop sleep, queueing | Removed from the MVP; optional feature flag later |
| RAG | Not needed for MVP | Added complexity for no gain | Look up lore by node id; add embeddings only if a chatbot role is built |
| Free hosting for 200 players | Medium | Cold start with a joining surge; low CPU; restarts | Warm up 5 minutes early, stagger joins, lighter socket library, static frontend on a free host, load test (see Free hosting options compared) |
| Future AI (ask-the-Guide Q&A) | Medium | Reintroduces prompt injection, live load and the chance of leaking hints | Stage-scoped context builder and a disabled stub now; guardrails later (see Path to AI later) |

Host choice: Render fits best because it runs a long-lived Node WebSocket server on a free tier. I re-checked the alternatives for Revision 3 (see Free hosting options compared): Heroku has had no free tier since 2022, PythonAnywhere does not run server-side WebSockets, and Vercel now offers WebSockets in public beta but needs an external store for shared state. My earlier note that Vercel cannot hold open sockets was out of date.

## Revision 7 plan: in-person huddles and six bigger decisions

Nov 21, 2026. Plan only; nothing in this section is built yet. Teams will sit together, so each decision becomes a short stand-up huddle, and the game shrinks from 10 decisions to 6 that each take longer and ask for more judgement. Where this section disagrees with Revision 6 or earlier, this section wins (see "What Revision 7 overrides" at its end). Everything else from Revision 6 stays: cut scenes, composed vector pictures, the recap banner, the CEO / Product Lead / Lead Dev / QA Lead / Customer Lead roles, plain language, the graph rules and secret clues.

### What we heard and what changes

| You said | Change | Why it helps |
| --- | --- | --- |
| Teams will huddle together, like mini stand-up sessions | Every decision gets a timed huddle: phones down, a stand-up round (what I see, what worries me, what I would do), then open floor | The clues become things people say aloud, so the app needs no chat, presets or feed |
| Reduce the number of decisions | 10 decisions become 6 (8 scene nodes in all, counting 2 drift nodes); the 7 endings stay | Each decision gets room to breathe, and there are fewer scenes to write and review |
| Increase the complexity a bit | Two-part clues (a fact and a role-biased worry), a case card of 3 public facts, options that each show a gain and a cost | Teams must weigh conflicting advice instead of only collecting clues |
| Increase the duration of each | About 174 seconds per decision instead of about 93 | Enough time for a real stand-up |

### Decisions I am taking by default (change any of them)

These fill gaps in your request; none is confirmed until you say so.

| ID | Question | Default | Alternative |
| --- | --- | --- | --- |
| H1 | What does "huddle" mean in the game? | Every decision has a huddle phase of about 100 seconds: advisors stand with phones down and speak in turn, then 20 seconds of open floor | Huddles only at set checkpoints, or free talk with no structure |
| H2 | How many decisions? | 6, with 8 scene nodes (6 main, 2 drift) and the same 7 endings | 5 or 7 |
| H3 | How do your bands fit 6 decisions? Your bands were D1-3 no wrong answer, D4-5 one doom / one true / one detour, D6-8 two wrong and one right, D9-10 two right and one wrong | Scaled to D1-D2 no wrong answer, D3 doom / true / detour, D4-D5 two wrong, D6 two right | D1-D2 free, D3-D4 doom / true / detour, D5 two wrong, D6 two right |
| H4 | How long is a decision, and how long is the game? | About 174 seconds per decision; a full run stays about 20 minutes | A longer game of about 25 minutes with 3.5-minute decisions |
| H5 | What makes it more complex? | Two-part clues, a case card, gain-and-cost options | Visible meters such as trust and speed, later |
| H6 | What happens to chat and the preset messages? | Removed. There is no in-app messaging. Advisors tap a quiet suggestion and the CEO can end the huddle early. "Meet up in 5 / 10 minutes" is dropped because the huddle is the meet-up | Keep the Revision 6 preset feed for remote players |
| H7 | How do teams form? | At numbered stations; each has a printed card with the team code and a QR code; teams of 3-5 (a CEO and up to four advisors) | Random grouping in the lobby |
| H8 | Whose clock? | Each team runs its own clock; the host can pause a team | Synchronised rounds from a host clock and big screen |
| H9 | What happens after a team fails? | A 60-second retro huddle with one prompt and no scoring | Skip it |

### The six-decision story

The graph is the same shape as before, shortened. A drift node replaces the main node it skips, so every route to the true ending is exactly 6 decisions.

```
D1 -> D2 : every pick scores 2 / 1 / 0 (hidden), no wrong answers
   total 0-1 -------------------------------> ALT ENDING 1
   total 2   -------------------------------> DRIFT A (replaces D3) --right--> D4
   total 3-4 -------------------------------> D3

D3   doom   -> ALT ENDING 2
     true   -> D4
     detour -> DRIFT B (replaces D4) --right--> D5

D4, D5  right -> next decision
        'rash' wrong -> ALT ENDING 4     'timid' wrong -> ALT ENDING 5

D6   two right options -> TRUE ENDING (goal achieved)
     one wrong option  -> ALT ENDING 6

Either wrong option on a drift node -> ALT ENDING 3
```

| New node | Story beat | Built from earlier beats | Band |
| --- | --- | --- | --- |
| `d1` | The Whiteboard Idea | `d1` | No wrong answer, scores |
| `d2` | The Access Request and the Team | `d2` and `d3` | No wrong answer, scores |
| `m3` | Pilot Day and the Data Line | `m4` and `m5` | Doom / true / detour |
| `dr_a` | The Borrowed Sponsor | `dr_a` | Drift, replaces `m3` |
| `dr_b` | The Conference Corridor | `dr_b` | Drift, replaces `m4` |
| `m4` | The Incident Alert | `m7` | Two wrong, one right |
| `m5` | Credit and the Rival | `m6` and `m8` | Two wrong, one right |
| `m6` | The Leadership Review | `m9` and `m10` | Two right, one wrong |

`dr_c` (The Start-up's Offer) is cut; its idea can fold into `m5`. The goal, premise (R2) and endings are unchanged. Chapters are scenery only: The Prototype (D1-D2), The Scale-Up (D3-D4), The Trust Test (D5) and The Leadership Review (D6). Chapter 1 now means D1-D2, so the hidden score thresholds change from 0-1 / 2-3 / 4-6 to 0-1 / 2 / 3-4 (this updates A2).

### Decision rhythm

| Phase | Time | What happens |
| --- | --- | --- |
| Cut scene | 24 s | 3 panels of about 8 s; tap to go faster; the first panel carries the one-line aftermath of the last choice |
| Read | 20 s | Phones up: read your own clue and the case card |
| Huddle | 100 s | Phones down, stand up: the stand-up round, then open floor |
| Decide | 30 s | The CEO picks and confirms; advisors can tap a quiet suggestion; on timeout the most-suggested option wins, else a random one (A7) |
| One decision | about 174 s | |
| Six decisions | about 17.4 min | |
| Intro (goal, role card, a 20-second "how to huddle" card) | about 60 s | |
| Ending cut scene and debrief | about 90 s | |
| Full run | about 20 min | Plus the optional 60-second retro huddle |

A team that fails ends earlier (see Odds below), so teams finish at different times; the retro huddle gives them something useful to do while others finish.

### The huddle

**The stand-up round.** The phone shows who is up. Each advisor gets an equal turn in the first 80 seconds (20 seconds with four advisors, never more than 30) and says three things in plain words:

1. What I see: the fact from my clue
2. What worries me: the concern from my clue
3. What I would do: my own view, not scripted

The CEO listens and does not talk during the round. The last 20 seconds are open floor: questions, challenges, and the CEO's thinking out loud. With fewer than five players the missing roles' clues are shared out as before, so each advisor reads more than one clue.

**What the phone shows.**
- A large timer ring, "Phones down. Stand up and talk."
- The speaker order with the person up now highlighted, and a "Peek at my clue" button so nobody has to memorise anything
- The case card and the recap banner
- Cues are visual and vibration only, no sound, because 20 teams talking in one room would drown out a chime
- For the CEO, an "End huddle early" button

**Practice mode.** In the single-file demo the practice teammates "speak" their lines as speech bubbles in turn, so one person can still play a whole game alone.

**Retro huddle.** After the ending the screen shows the debrief and one prompt ("What did you trust, and what would you change?"). It runs 60 seconds with no scoring and no input.

### More complexity, in a bit

Three additions, all pre-written text; none needs new engine rules.

1. **Two-part clues.** Each advisor has a *see* line (a fact) and a *worry* line (a concern shaped by their role). The roles lean differently: Product Lead towards speed, Lead Dev towards effort and limits, QA Lead towards caution, Customer Lead towards trust. So worry lines pull in different directions, and only the facts settle the decision.
2. **Case card.** Three public facts per scene, shown on every screen (for example "The Leadership Review is in 9 days"), so options can be weighed against real numbers.
3. **Gain-and-cost options.** Each option states one gain and one cost in plain words and never says right or wrong.

| Band | What the *see* lines do | What the *worry* lines do |
| --- | --- | --- |
| D1-D2 | Point to the option that scores best | Name a real cost of the tempting option; never decisive |
| D3 | Two or more expose the doom option; two or more separate the true option from the detour | Pull towards the detour |
| D4-D5 | Each wrong option is ruled out by two or more lines; no single line rules out both | Two lean to the rash option, two to the timid one, so every worry sounds sensible |
| D6 | Two or more flag the one trap | Disagree about which right option is better; either works |

**A solvability check in the linter.** Each *see* line carries authored tags (`rulesOut`, the options it eliminates) and each *worry* line carries `leansTo`. The linter then proves, for every scene, that the clues can be solved without any single advisor, and that no single line gives the answer away. That makes difficulty something you can check before a playtest, not only afterwards.

**Illustration (placeholder wording, not final text):** the Incident Alert, a "two wrong, one right" scene.

Case card: "Tuesday: Bridgeline was down for 40 minutes." "Two test cells lost data entries from that hour." "The Leadership Review is in 9 days."

| Option | Type | Rules out / leans |
| --- | --- | --- |
| A: Push the quick fix to every site tonight. Fast, but untested. | Rash | |
| B: Freeze Bridgeline everywhere until a full review. Safe, but the rollout stalls. | Timid | |
| C: Fix the two affected cells and tell their owners today. Honest, but rough. | Right | |

| Role | I see | I worry | Rules out | Leans to |
| --- | --- | --- | --- | --- |
| Product Lead | Eight sites run fine. Two more join this week. | A freeze now hands those sites to a rival tool. | B | A |
| Lead Dev | The bug is in one module. Only two test cells use it. | I can push a fix tonight. Waiting makes the backlog worse. | B | A |
| QA Lead | The fix passed on two cells. No other site has tested it. | I want every site reviewed before anything moves. | A | B |
| Customer Lead | The two affected owners lost data to a rushed change last year. | Staff feel safest when we stop and explain everything. | A | B |

Each wrong option is ruled out by two lines, no single line rules out both, and the worries pull the team towards A and B. A team that listens to the facts ends up at C.

### Odds of reaching the true ending (simulated)

I simulated 200,000 teams per row with my own model of the six-decision graph, not yet on the real engine (which is not rebuilt). "Skill" is the chance a team spots the best option on any one decision; otherwise it guesses.

| Team skill | True ending, 10 decisions (Revision 6) | True ending, 6 decisions (Revision 7) | Average decisions played, all teams (6-decision game) |
| --- | --- | --- | --- |
| Guessing only | under 1% | 2.5% | n/a |
| 0.5 | 13% | 27% | 4.4 |
| 0.6 | 21% | 37% | 4.7 |
| 0.7 | 33% | 50% | 5.1 |
| 0.8 | 49% | 64% | 5.4 |
| 0.9 | 71% | 81% | 5.7 |

Fewer decisions make the true ending easier at every skill level, which is why the extra complexity matters: it should pull a typical team's skill down from about 0.6-0.8 to about 0.5-0.6. That gives roughly 27-37% of teams the true ending, about 5 to 7 of 20 teams. That target is my guess until you playtest, and the linter's solvability check is the main lever for tuning it. A team that fails plays about 3.9-4.0 decisions at skill 0.5-0.6, so it finishes about 6 minutes before a winner, which is the gap the retro huddle fills.

### Story content volume and language limits

| Item | Limit |
| --- | --- |
| Panel caption | 22 words |
| All captions in one scene | 60 words |
| Recap | 50 words |
| Case fact | 12 words; 3 per scene |
| Option label | 14 words, with a gain and a cost |
| *See* line and *worry* line | 20 words each |
| Aftermath line | 18 words |
| Ending text / debrief | 40 / 28 words |
| Reading ease | Flesch score of 70 or more on all player-facing text (a guide, not proof) |
| Jargon | A banned-word list, as in Revision 6 |

Volume: 8 scenes x 3 panels, 3 intro panels and 7 endings x 2 panels make about 41 panels (Revision 6: about 56); 8 recaps; 24 case facts; 24 option labels (Revision 6: 39); 64 clue lines, which is 32 *see* and 32 *worry* (Revision 6: 52 hints); and about 24 aftermath lines. Offline generation drops to roughly 5,000-8,000 output tokens per pass (an estimate), against about 23,000 in the earlier plan. Review is still the real cost.

### Teams, stations and the room

- **Stations.** Each team gets a numbered standing spot with a printed card: team number, 4-letter code and a QR code to the join page. Teams form where they stand, which also spreads the join surge.
- **Host console.** "Create N stations" returns the codes and a printable card page; the console also shows each team's phase and current decision and can pause or skip a team (already planned for Phase 5).
- **Facilitators.** A few volunteers walking the room to nudge stalled teams and answer rules questions (my guess: one per 5-8 teams).
- **Noise.** Space the stations so neighbouring teams do not overhear, use vibration only, and playtest in a room of a similar size.
- **Clocks.** Teams start when they are ready. The host can run a "wave start" (a shared countdown before everyone presses start), but teams are not kept in step afterwards.
- **Connectivity.** 100-200 phones on venue Wi-Fi or mobile data; payloads are small. Ask the venue about Wi-Fi capacity and test on site.

### Engine and code changes

| File | Change |
| --- | --- |
| `shared/types.ts` | Phases `scene`, `read`, `huddle`, `decide`, `retro`; story schema v3 (cut scene panels, recap, case card, `see` and `worry` lines with `rulesOut` and `leansTo` tags, gain-and-cost options); role names |
| `shared/team.ts` | A phase chain with a deadline per phase; a huddle speaker schedule (equal turns in the first 80 s, capped at 30 s); CEO "end huddle early"; suggestions open only in `decide`; routing for 6 decisions (score after D2: 0-1 alt ending 1, 2 drift node, 3-4 main); the `chat` handler removed; practice teammates speak as speech bubbles; a `retro` phase after the ending; the view adds the case card, speaker and phase deadlines |
| `shared/art.ts` | As Revision 6 (art catalog ids) |
| `shared/presets.ts` | Not needed; the Revision 6 file is dropped |
| `server/index.ts` | Allowed events `join`, `suggest`, `choose`, `endhuddle`, `start`, `skip`, `bots`; environment variables for each phase length; a host-only call to create stations |
| `server/stations.ts` (new) | Creates N team codes and a printable card page with QR codes |
| `server/lint-story.ts` | Schema v3; 8 scene nodes and 7 endings; the new ids; every true-ending route is 6 decisions; band rules scaled to 6; word limits, reading ease, jargon list; the solvability check from the tags |
| `server/sim.ts` | Plays every phase; reports the new odds table; still checks that no view leaks a secret |
| `server/loadtest.ts` | Sends only `suggest` and `choose`, and walks the phases |
| `client/src/App.tsx` | Cut scene player, read screen, huddle screen, case card, recap banner, decide screen, retro screen; chat panel removed |
| `client/src/art/` | As Revision 6 (SVG kit, now about 41 panels) |
| `client/src/styles.css` | Huddle ring and phones-down state, phone layout |
| `docs/index.html` | Rebuilt demo with speaking practice teammates |

### Load (estimates, to be measured)

- **Inbound:** about 5 taps per team per decision (suggestions and the choice), so about 1 event per second across 40 teams.
- **Outbound:** about 9 state broadcasts per team per decision (4 phase changes and the taps), each to up to 5 sockets, so about 10 emits per second across 40 teams. Revision 6 estimated about 6 in and 30 out; the Revision 3 chat worst case was about 200 out.
- **Payload:** panels are sent once per scene; nothing else is large.
- **Cost:** still $0 at runtime; no model is involved. The join surge and cold start remain the real free-tier risks.

### Risks (Revision 7)

| Risk | Likelihood | Impact | Response |
| --- | --- | --- | --- |
| Room noise with 20 or more teams talking at once | High | Medium | Station spacing, vibration-only cues, standing circles, playtest in a similar room |
| One voice (often the CEO) dominates the huddle | Medium | Medium | Every advisor has a fixed turn; the CEO listens first; the speaker is highlighted |
| Teams ignore phones-down or skip the round | Medium | Low | The round is guided, not enforced; a team that talks freely still works; timers keep the pace |
| Teams drift out of step and early finishers sit idle | High | Low | Per-team clocks, the retro huddle, the host can pause or group teams |
| The true ending is too rare or too easy with 6 decisions | Medium | High | The odds table; the linter's solvability check; two in-person playtests to tune |
| Longer scenes and clues stop being plain | Medium | Medium | Word limits and the reading-ease check; numbers live on the case card |
| Venue Wi-Fi or mobile data struggles with 200 phones | Medium | High | Small payloads, a site test, a Wi-Fi capacity check |

### Work plan (Revision 7)

| Step | Goal | Exit criteria |
| --- | --- | --- |
| 1 Plan and docs (this step) | Agree the plan; update the docs | You confirm or change H1-H9 |
| 2 Story | Plain-language `story.json` (schema v3): 8 scene nodes, recaps, case cards, 64 clue lines, endings, intro | The linter passes the new limits and the solvability check; the simulator shows roughly 27-37% reaching the true ending at skill 0.5-0.6; you can read any scene in under 30 seconds |
| 3a Engine | Phase chain, huddle turns, 6-decision routing, quiet taps, retro; updated lint, sim and load test | Typecheck, lint and simulator pass; all 7 endings reachable; every true route is 6 decisions; no secrets in any view |
| 3b Art | SVG kit and composer for about 41 panels | Every panel renders; the linter confirms every art id exists |
| 3c UI | Cut scene player, read and huddle screens, case card, recap banner, retro, phone layout | A full game plays on a phone in about 20 minutes |
| 3d Host | Station creation and printable cards; pause and skip a team | Cards print and a team joins by scanning one |
| 3e Ship | Rebuilt demo with speaking practice teammates; README and docs; zip the repo | The demo loads from GitHub Pages and plays start to finish |
| 4 Playtest | Two real teams in a room of similar size | Timing, noise and clue difficulty tuned; odds re-checked on the real engine |

My estimate is that the total effort stays close to Revision 6 (about 9-11 days): fewer scenes and no chat, offset by the huddle screen, richer clues, the solvability check and the host console. The story and art remain the largest parts.

### What I need from you

- Confirm or change H1-H9, above all H2 and H3 (six decisions and how your bands scale), H4 (about 20 minutes total versus longer) and H7 (stations).
- Venue facts: room size and layout, how many teams per room, Wi-Fi or mobile data, and whether volunteers can act as facilitators.
- Still pending from Revision 6: R1 (composed pictures or supplied images) and R2 (keep the Halden premise).
- Someone who knows the real organisation should review the final text before an event.

### What Revision 7 overrides

- **Revision 6:** the team feed and preset messages (H6), the 18 s + 75 s timing, the work plan, the load estimate, and defaults R4 and R6. R4's "meet up in 5 / 10 minutes" presets are dropped because the huddle is the meet-up. The story schema moves from v2 to v3.
- **Game design:** 10 decisions become 6 and 13 decision nodes become 8; the 105-second decision (A7) becomes about 174 seconds with a 30-second decide phase; A1 chapters become D1-D2, D3-D4, D5, D6 for scenery; A2 thresholds change (see above); A9 clue jobs become the *see* and *worry* jobs in the table above; A12 (chat) is gone.
- **Still holds:** cut scenes and composed pictures, the recap banner, the five role names, plain language, the hidden score and band logic, one true ending and six alternate endings, secret clues sent only to their holder, offline-generated text, and no live AI.

## Revision 6 plan: cut scenes, preset messages, simpler story and roles

Nov 21, 2026. This section is the plan only. Nothing in it is built yet. Sections elsewhere in this document that were written for earlier revisions are kept for history; where Revision 6 changes them, a "Revision 6" note says how. The order of work you asked for is: this plan and the docs first, then the story, then the artifacts (engine and UI code, art, rebuilt demo).

*Revision 7 note: the team feed, preset messages, timing, load estimate, work plan and defaults R4 and R6 below are overridden by the Revision 7 plan above (see What Revision 7 overrides). Cut scenes, composed pictures, the recap banner, the roles and plain language still hold.*

### What we heard and what changes

| Feedback or request | Change | Why it helps |
| --- | --- | --- |
| The story and text were too complex and too high fantasy | Rewrite in plain, short sentences set in an everyday office; hard word limits enforced by the linter | Players can take in a scene in seconds, on a phone, at an event |
| Scenes are walls of text | Each scene becomes a short cut scene: 3 panels, each one picture and one short caption | Pictures carry the scene; the text only anchors it |
| Free-text chat is extra work to build and run | Remove it. A read-only team feed shows preset messages and shared clues | No moderation, no profanity filter, no free text reaching the server except names |
| Players may want to re-read what happened | A banner at the top opens a recap card: the scene's key picture plus a short text recap | One tap to catch up, without scrolling or asking a teammate |
| Roles feel complicated | CEO, Product Lead, Lead Dev, QA Lead, Customer Lead | Everyone already knows what these people do |

### Decisions I am taking by default (change any of them)

| ID | Question | Default | Alternative |
| --- | --- | --- | --- |
| R1 | How are the pictures made? | Composed vector (SVG) scenes: a small library of backgrounds, characters, props and moods, assembled from data. Free, tiny, consistent, works offline and inside the single-file demo, and shows no real people or brands | Raster images you supply (AI-generated, stock or commissioned) dropped in per panel; I cannot generate raster images in this environment |
| R2 | Which premise? | Keep Project Bridgeline at the fictional Halden Aerospace India, but retell it as a simple "launch our app" story that fits the new roles | A new, plainer premise (for example a generic product launch) |
| R3 | The fifth role | Customer Lead: what customers and colleagues really want and worry about | Operations Lead or People Lead |
| R4 | Preset messages and the timer | Keep your "meet up in 5 / 10 minutes" presets as configured, and add game-clock ones such as "Quick huddle now?". See the timing note below | Longer decision timers so a real meet-up fits |
| R5 | What is the "recap image"? | One card: the scene's key picture, a 2-3 sentence text recap and the goal line. The text is real text over the picture, not baked into the image, so it stays readable and editable | A pre-rendered picture with the text drawn in |
| R6 | Decision timer | 75 seconds, after a cut scene of about 18 seconds | Back to 90 seconds |
| R7 | Internal role keys | Keep `captain`, `seer`, `scout`, `scholar`, `empath` internally; change only the names, icons and clue titles players see | Rename keys too (mechanical, but touches more files) |
| R8 | Free text that remains | Player names only (20 characters, small filter) | Pick names from a list |

**Timing note on R4.** Ten decisions in about 20 minutes leaves roughly two minutes per decision, so a literal "meet in 5 or 10 minutes" cannot happen inside the game clock. It only makes sense if teams are in the same room and the phrase is a nudge to talk face to face, outside the timer. I will keep those two presets as you described and add shorter ones, and you can edit the list in one file.

### What the player sees

```
Welcome -> Lobby -> Intro cut scene (goal and your role)
   -> for each decision:
        Cut scene (3 panels, about 18 s, tap to move on)
        -> Decision (75 s): picture, 3 options, your private clue,
           team feed with preset buttons, recap banner
   -> Ending cut scene and a one-line debrief
```

- **Cut scene:** full-width 16:9 picture with a caption underneath. Panels advance on their own about every 6 seconds and on tap; progress dots show where you are. The CEO or the team leader can skip the rest. A slow pan and fade give the game feel, switched off for people who prefer reduced motion.
- **Decision screen:** the last panel stays as a thumbnail, with the three options as large tap targets, your private clue in its purple box and the countdown.
- **Recap banner:** a slim strip under the header, "Story so far - tap to recap", shown from the first decision. It opens the recap card and does not pause the timer.
- **Phone layout:** picture first, options next, and the team feed as a collapsible drawer with an unread count instead of a 420-pixel panel pushed under the card. The preset buttons sit in a bottom sheet.

### Roles

| Internal key | Shown as | Sees | Clue title |
| --- | --- | --- | --- |
| `captain` | CEO | Nothing extra; makes every decision | n/a |
| `seer` | Product Lead | What users and the market are asking for next | The Product Lead's view |
| `scout` | Lead Dev | What the technology can and cannot do | The Lead Dev's report |
| `scholar` | QA Lead | Faults found, rules and past lessons | The QA Lead's findings |
| `empath` | Customer Lead | What customers and colleagues feel | The Customer Lead's feedback |

Everything else about roles is unchanged: with fewer than five players the missing roles' clues are shared out, a dropped CEO is replaced by the longest-connected teammate, and clues go only to the player who holds them.

### Team feed: preset messages and clue sharing

- The chat box becomes a read-only **team feed**. Instead of typing, a player taps a preset or "Share my clue".
- **Presets** live in one shared file (`shared/presets.ts`) as id and text pairs. The client sends only the id; the server looks up the text, so a client can never post anything that is not on the list. Default list:
  - "Let's meet up in 5 minutes to discuss."
  - "Let's meet up in 10 minutes to discuss."
  - "Quick huddle now? Share your clues."
  - "I have a clue. Who wants to hear it?"
  - "Can everyone share their clues?"
  - "I suggest option 1." / "option 2." / "option 3." (positions follow the team's own option order)
  - "I'm not sure. What does everyone think?"
  - "I agree with that."
  - "Time is short. Let's decide."
- **Share my clue** posts the player's own clue for this scene into the feed, tagged with their role, once per scene. That is how a private clue becomes public, by the holder's choice.
- Practice teammates keep posting their clues through the same path.
- The existing rate limit (one message per 0.8 seconds) stays. The profanity filter is removed from messages and kept only for names.
- **Side effects:** no free text reaches the server except names, so the moderation work, the abuse risk and the prompt-injection surface that chat created are gone. This also keeps the later "ask the Guide" feature as the only place free text could appear.

### Story rewrite

The graph, band rules, hidden Chapter 1 score and every node and ending id stay the same, so the engine rules, the linter's graph checks and the simulator carry over. Only the words and the shape of each scene change.

**New shape of a decision scene** (schema v2):

```json
{
  "id": "m4",
  "title": "Pilot Day",
  "chapter": 1,
  "band": "d45",
  "cutscene": [
    { "art": { "bg": "office", "cast": ["dev", "qa"], "prop": "dashboard", "mood": "hopeful" },
      "caption": "The first test went well. Two more teams want the app." },
    { "art": { "bg": "office", "cast": ["ceo"], "prop": "phone", "mood": "tense" },
      "caption": "A big conference calls. They want a demo." },
    { "art": { "bg": "meetingroom", "cast": ["ceo", "product"], "mood": "calm" },
      "caption": "Everyone wants the app now. What is your next move?" }
  ],
  "recap": "The first test worked. Two more teams and a conference want the app.",
  "options": [ "unchanged: id, label, type, to, aftermath" ],
  "hints": { "unchanged": "one short clue per role; several phrasings still allowed" }
}
```

The intro becomes 3 panels and each ending becomes 2 panels plus a one-line debrief.

**Language rules, enforced by the linter:**

| Item | Limit |
| --- | --- |
| Panel caption | 18 words |
| All captions in one scene | 45 words |
| Recap | 40 words |
| Option label | 8 words |
| Clue | 20 words, short sentences |
| Aftermath line | 15 words |
| Ending text / debrief | 35 / 25 words |
| Reading ease | Flesch score of 70 or more on all player-facing text (a guide, not proof) |
| Jargon | A banned-word list (for example assurance, synthetic, governance, charter, provenance) |

Clues keep their jobs by band (A9): in D1-D3 they point at the best option, in D4-D5 they expose the doom option, in D6-D8 any two rule out both wrong options, and in D9-D10 they flag the trap. Each clue is one phrasing by default; the engine still supports several.

**Content volume:** about 13 scenes x 3 panels, 3 intro panels, 7 endings x 2 panels, 13 recaps, 52 clues and 39 option labels. That is clearly fewer words than the current text, but more pieces to review, because every panel also needs its picture.

### Pictures

- **Catalog:** about 8 backgrounds (office, test cell, meeting room, server room, conference hall, corridor, boardroom, desk with laptop); 5 role characters plus a few generic extras (colleague, customer, rival, sponsor); about 8 props (laptop, dashboard, warning sign, document, phone, trophy, handshake, clock); 4 moods (calm, tense, hopeful, night) shown as a colour wash.
- **A panel is data, not a file:** `art: { bg, cast, prop, mood }`. A scene composer draws it as one SVG, so about 56 panels reuse a small kit and stay in one consistent style.
- **Catalog ids** live in `shared/art.ts`, so the linter can check that every panel uses real ids without loading any React code.
- **Size:** estimated at tens of kilobytes on top of the current 237 KB demo page, so the single-file demo and the GitHub Pages deploy keep working.
- **Accessibility:** the caption is the picture's text alternative; all information is also in the text.
- **Swap-in path:** a panel may carry an optional `image` field pointing at a supplied file, which wins over the composed scene. Raster art for about 25 key frames would add roughly 1-3 MB (an estimate), and the demo would no longer be a single file.
- **Rights:** the pictures are original flat drawings with no real people, no logos and no company marks.

### Engine and code changes

| File | Change |
| --- | --- |
| `shared/types.ts` | `scene` text becomes `cutscene` panels plus `recap`; `Story` gets intro panels; endings get panels; new role names, icons and clue titles |
| `shared/team.ts` | New `scene` phase before each decision with its own deadline; decision timer and bots start after it; `skip` works in the intro and the scene phase; the `chat` handler becomes `say` (preset id or share-clue); view adds `cutscene` and `recap`; message text filter removed, kept for names |
| `shared/presets.ts` (new) | The preset list |
| `shared/art.ts` (new) | Art catalog ids |
| `server/index.ts` | `say` replaces `chat` in the allowed events |
| `server/lint-story.ts` | Schema v2 checks, art ids, word limits, reading ease, jargon list; the graph checks stay |
| `server/sim.ts` | Plays through the scene phase before each decision |
| `server/loadtest.ts` | Sends preset ids and skips scenes |
| `client/src/App.tsx` | Cut scene player, recap banner and card, team feed with preset bar, new copy and role blurbs |
| `client/src/art/` (new) | SVG backgrounds, characters, props and the scene composer |
| `client/src/styles.css` | Cut scene motion, drawer and bottom sheet, small-screen layout |
| `docs/index.html` | Rebuilt demo |

### Timing

| Part | Time |
| --- | --- |
| Intro cut scene and role card | about 30 s |
| Cut scene per decision | about 18 s (3 panels at about 6 s; tap to go faster) |
| Decision | 75 s |
| One decision in total | about 93 s |
| Ten decisions | about 15.5 min |
| Ending cut scene and debrief | 30-60 s |
| Full run | about 17 min, leaving slack inside the 20-minute target |

Teams that fail finish earlier, as before.

### Load and cost effects (estimates, to be measured)

- **Fewer messages:** with presets, a player might send about 2-3 messages per decision instead of one every 5 seconds. For 200 players over about 95 seconds that is roughly 6 messages per second inbound and about 30 outbound emits per second, about an order of magnitude below the chat estimate later in this document. This rests on assumed behaviour; the load test replaces it.
- **Payload:** panels are sent once, in the scene phase, and the recap is a small text object in each decision view, so state broadcasts stay small.
- **Cost:** still $0 at runtime; no model is involved.

### Risks

| Risk | Likelihood | Impact | Response |
| --- | --- | --- | --- |
| Composed SVG scenes look too plain or samey | Medium | Medium | Strong mood colours, varied cast and props, slow motion; keep the `image` field for a few key frames |
| Rewritten clues become too easy or too hard in fewer words | Medium | High | Keep the graph and band rules; re-run the linter and simulator; playtest with real teams |
| Auto-advancing panels move too fast for slow readers | Medium | Low | Tap to advance, recap card, caption word limits |
| Preset-only talk feels thin | Medium | Low | Share my clue plus option-suggestion presets cover the real need; the list is editable |
| "Meet in 5 / 10 minutes" conflicts with the game clock | High | Low | See the timing note; keep both kinds of preset |
| Cut scenes and the new UI take longer than the text version | Medium | Medium | Build the engine and one finished scene first, then fill in the rest |

### Work plan

| Step | Goal | Exit criteria |
| --- | --- | --- |
| 1 Plan and docs (this step) | Agree the plan; update the docs | You confirm or change R1-R8 |
| 2 Story | New plain-language `story.json` (schema v2): 13 scenes x 3 panels, recaps, clues, endings, intro | Linter passes with the new limits; the simulator results are unchanged in shape; you can read any scene in under 20 seconds |
| 3a Engine | Scene phase, `say` and presets, recap data, role names, updated lint, sim and load test | Typecheck, lint and simulator pass; all 7 endings reachable; no secrets in any view |
| 3b Art | SVG kit and scene composer for every panel in the story | Every panel renders; the linter confirms every art id exists |
| 3c UI | Cut scene player, recap banner and card, team feed with presets, phone layout | A full game plays on a phone in about 17 minutes |
| 3d Ship | Rebuild `docs/index.html`, update README and docs, zip the repo | Demo loads from GitHub Pages and plays start to finish |

The effort is mostly the story and the art kit; the engine change is small because the graph and rules do not move (an estimate: the engine and tests are the smallest part, and the story plus art are the largest).

### What I need from you

- Confirm or change R1-R8, above all R1 (composed SVG pictures versus supplied images) and R2 (keep the Halden premise or pick a plainer one).
- Say whether teams will sit together, which decides whether "meet in 5 / 10 minutes" is a real-world nudge or should be dropped.
- Someone who knows the real organisation should still review the final text and pictures before an event.

## Game design for the MVP

*Revision 6 note: the rules below still hold, but the roles are renamed (see Roles), scenes are shown as image cut scenes, the decision timer becomes 75 seconds after an 18-second cut scene, and chat is replaced by preset messages. The fantasy premise further down was replaced by the Project Bridgeline story in Revision 5 and will be rewritten in plain language in Revision 6.*

*Revision 7 note: the current plan is 6 decisions, not 10, and about 174 seconds per decision with a huddle, not 105 seconds; read this section with the Revision 7 plan above. The 10-decision design stays as the record of what the prototype does today.*

The game is 10 decisions in four chapters with 7 endings: 6 alternate and 1 true. The goal is declared in the intro and only the true ending achieves it. At about 105 seconds per decision a full run takes about 20 minutes. Code decides what happens next; the text players read is authored facts turned into prose by the local model before the event. Gaps in your rules that I filled are marked A1-A12 and listed in the assumptions table below.

### Roles and hints

*Revision 6 note: the roles are now CEO (was Captain), Product Lead (Seer), Lead Dev (Scout), QA Lead (Scholar) and Customer Lead (Empath), and the CEO no longer gathers clues through free chat but through the preset feed and shared clues. Hint jobs by band are unchanged.*

*Revision 7 note: there is no feed or shared-clue button any more; advisors say their clues aloud in a stand-up huddle, and each advisor now has a see line and a worry line (see More complexity, in a bit).*

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

*Revision 7 note: this is the 10-decision graph of the current prototype. The 6-decision graph is in The six-decision story above.*

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
- Revision 6: instead of narration text, a 3-panel cut scene (picture data plus a short caption each) and a short text recap; the previous choice appears as a one-line aftermath
- Narration text for each way of arriving at the node, with 2 reviewed variants each (A10; superseded by the cut scene and aftermath line in Revision 6): the scene opens by acknowledging the previous choice, so a Captain who picked differently reads different words
- Ending nodes hold narration only, plus a debrief line naming the choice that mattered

### Rules that protect the design

- Player chat text never reaches any model in the MVP, which removes prompt-injection risk (Revision 6: there is no free chat at all; the server accepts only preset ids and a share-clue action)
- Hints are sent only to the matching role's connection, never hidden in the browser
- Scores, drift status and which option is right stay on the server and are never sent to browsers
- A 90-second decision timer picks the option the advisors suggested most, else a random one (A7; Revision 7: the same rule applies at the end of the 30-second decide phase)
- If the Captain disconnects, the longest-connected teammate takes over

### Placeholder premise and endings (historical: typical high fantasy, replaced in Revisions 5 and 6)

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

*Revision 7 note: this table is for 10 decisions; the 6-decision table is in the Revision 7 plan above.*

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

*Revision 7 note: A1, A2, A7, A9 and A12 change for the six-decision game; see What Revision 7 overrides. The new defaults are H1-H9 in the Revision 7 plan.*

| ID | Gap in your rules | What I chose | Alternative |
| --- | --- | --- | --- |
| A1 | Stages of 3 decisions do not divide 10 evenly, and your difficulty bands (1-3, 4-5, 6-8, 9-10) do not match them | Four chapters for scenery (D1-3, D4-6, D7-9, D10 as a one-decision finale); difficulty bands are a separate axis | Chapters of 3, 3, 2, 2 aligned to the bands |
| A2 | 'Chance to tie into the main storyline' in D1-D3 has no mechanism | Hidden score per pick (strong 2, mixed 1, weak 0): 0-1 ends early, 2-3 enters drift, 4-6 stays on main | Each pick opens its own mini-branch |
| A3 | How long a 'slightly different path' lasts | A drift node is one decision with one right option: right rejoins main, wrong gives Alt ending 3 | A two-decision detour with partial recovery |
| A4 | What the two wrong options do in D6-D8 | Each ends the game with its own ending (rash 4, timid 5); no tie-back | Timid option detours instead, which makes the true ending easier (table above) |
| A5 | What the two right options do in D9-D10 | Both keep the team on main; they change only narration flavour | Each right option unlocks a different variant of the true ending |
| A6 | The goal declared at the start | Shown in the intro and pinned on every screen; alternate endings miss it in different ways; goal text is a placeholder | Alternate endings show how close the team got |
| A7 | Timing and timeouts | 105 seconds per decision (90-second timer plus about 15 seconds to read the narration, shown with a cosmetic typewriter effect; Revision 6 changes this to an 18-second cut scene plus a 75-second timer); timeout takes the most-suggested option, else a random one, so idling has a cost | Timeout counts as the weakest option |
| A8 | Failed teams finish early (between decisions 3 and 10) | A short debrief names the choice that mattered and the goal missed; no replay in the MVP | Replay from a checkpoint |
| A9 | How hints differ by band | Band-specific hint jobs (see Roles and hints); no single hint names the right option | Uniform hints in every band |
| A10 | Pre-generated narration cannot see the whole play history | Narration is written per node and per incoming option (the previous choice only); flags and score never appear in the text | Per-path narration for the whole history, which multiplies the text |
| A11 | Fixed hints let neighbouring teams copy answers | 3 phrasings per hint, one picked per team at game start | One phrasing per hint |
| A12 | Whether players still talk to each other when they cannot talk to the AI | Superseded in Revision 6: free chat is removed; advisors talk through preset messages and by sharing their clue into a read-only feed | Free chat (the earlier choice) |

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
 |  - lobby, team rooms, preset-message feed  |
 |  - game engine: story graph, roles, timer  |
 |  - per-role hint delivery (picks phrasing) |
 |  - content loaded from JSON into memory    |
 |  - host console (password protected)       |
 |  - serves the built frontend               |
 +--------------------------------------------+
```

### Flow of one decision

*Revision 7 note: a decision now has four phases (cut scene, read, huddle, decide) as set out in Decision rhythm; the steps below describe the earlier shape.*

1. Revision 6: the server first runs a short cut scene phase (3 panels), then starts the decision. Earlier text: the server sends the team the narration text for this node and the way they arrived (loaded from memory) plus the three option labels.
2. At the same moment it sends each advisor the team's chosen phrasing of their private hint, only to that socket.
3. The team uses preset messages and shared clues (earlier: free chat); advisors can post suggestions; the Captain picks an option or the 90-second timer fires.
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
- Chat messages keep a sender-kind field (human only for now). Revision 6: the field is now used, with kinds preset, clue and system.

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

*Revision 7 note: with no in-app messaging the load is lower again, about 1 event per second in and about 10 emits per second out (see Load in the Revision 7 plan).*

*Revision 6 note: free chat is removed, so the chat figure below no longer applies. With preset messages the estimate is about an order of magnitude lower (see Load and cost effects in the Revision 6 plan). The numbers below are kept as the worst case and are still unmeasured.*

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
| 1 Lobby and stations | Teams, aliases, station codes (Revision 7: no chat or feed) | 1 day | 3 browsers join one team by code and rejoin after refresh |
| 2 Game engine | Six-decision graph, roles, clues, phase timers, huddle turns (Revision 7) | 2-2.5 days | Bots reach all 7 endings in 6 decisions; linter passes |
| 3 Content pipeline | Generator, review step, leak check, phrasing selection | 1 day | One full pass of a sample story generates, passes the leak check and loads in the game |
| 4 Story authoring | 8 scene nodes, 64 clue lines, 7 endings (Revision 7) | 3 days | An in-person team that plays well finishes in about 20 minutes |
| 5 Harden and ship | Host console (stations, printable cards), load test, runbook | 1-2 days | 40 bot teams plus 2 human teams finish; survives a forced restart |

### Phase 0: spikes

1. Deploy a "hello socket" app to Render; run a bot script that opens 200 sockets in 40 rooms and sends chat at the assumed rate; record message delay, CPU behaviour and any drops; run it once with Socket.IO and once with native `ws` to see how much CPU the library costs.
2. Hold sockets idle for 30 minutes with 25-second pings; time a cold start and a 200-client join surge.
3. Install Ollama, pull Qwen3 4B (4-bit, context capped at 2K), generate 20 sample narrations and hints from the real prompts on the GTX 1650, and record tokens per second and whether it spills to the CPU.

### Phase 1: lobby, rooms, chat

*Revision 7 note: steps 3 and 5 are dropped (no chat, no feed); teams form at stations with printed codes.*

1. Scaffold a repo with `client/`, `server/`, `generator/` and `shared/` (event types, story schema, the unused worker protocol).
2. Join by room code plus an auto-generated alias; assign up to 5 players per team.
3. Anonymous Omegle-style chat: two-pane mobile layout, message rate limit, basic profanity filter. (Revision 6: replaced by a read-only team feed with preset messages and a share-clue button; no free text except names.)
4. Resume token in the browser so a refresh puts the player back in their seat.
5. Tag every chat message with a sender kind (human only for now).

### Phase 2: game engine

*Revision 7 note: the graph has 8 scene nodes and 6 decisions per run, and a decision is a phase chain (scene, read, huddle, decide) with a deadline per phase; see Engine and code changes in the Revision 7 plan.*

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

*Revision 7 note: write 8 scene nodes with see and worry lines, a case card and gain-and-cost options; the vertical slice is D1, D2 and D3 plus one drift node and two endings.*

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

Live LLM generation, free-form player actions, RAG with embeddings, any player-facing AI interaction (the Guide), in-app messaging of any kind (Revision 7), accounts and saved history, leaderboards and voice.

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

The biggest risk is the story, not the code: balanced clues that must not leak the answer take longer to write and review than the engine takes to build. Revision 7 has 64 clue lines across 8 scene nodes (earlier plans: 52 hints across 13 nodes). The Revision 7 risks are in the table in its own section above.

| Risk | Likelihood | Impact | Response |
| --- | --- | --- | --- |
| Story authoring and review run long | High | High | Vertical slice first; stub D7-D10 and the later endings until Chapter 1 and the early main track play well |
| Free instance cannot sustain 200 sockets or the join surge | Medium | High | Phase 0 load test, staggered room-code release, lighter socket library and chat limits, static frontend on a free host |
| Free instance restarts mid-game | Medium | Medium | Resume tokens, optional state snapshot, content reloads from JSON |
| Socket drops on the free tier | Medium | Low | 25-second pings, auto-reconnect |
| Generated hints leak the answer or drift in meaning | Medium | Medium | Leak check, human review, three phrasings checked against the original clue |
| Chat abuse across 200 people | Medium | Medium | Revision 6: removed with the free chat; only names remain as free text. Earlier response: room codes, rate limit, profanity filter, host can remove a player |
| Teams compare screens and copy hints | Medium | Low | Per-team phrasing choice (A11) |

### Open questions

- Is the audience internal and known, or a fully public link? With 200 people this sets how strict moderation must be.
- Is a laptop-hosted server behind a free tunnel acceptable as a last-resort fallback if free hosting fails the load test?
- Who writes the final story: you, or Claude drafting it from a theme you give? (The premise above is a placeholder.)
- Should players choose their roles, or should the server assign them?
- Do you want to stay with React and Node, or reuse Angular and FastAPI?
- Please confirm or correct assumptions A1-A11 in Game design (A12 is superseded by Revision 6).
- Revision 6: confirm or change R1-R8 in the Revision 6 plan (teams do sit together, so the seating question is answered).
- Revision 7: confirm or change H1-H9, above all H2 and H3 (six decisions and how the bands scale), H4 (about 20 minutes versus longer) and H7 (stations).
- Venue: room size and layout, teams per room, Wi-Fi or mobile data, and volunteers for facilitating.
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
