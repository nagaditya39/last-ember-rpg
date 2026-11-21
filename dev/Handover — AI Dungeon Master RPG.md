# Handover — AI Dungeon Master RPG

Nov 21, 2026 · @aditya · Revision 8

A playable prototype now exists (Revision 4, see Prototype below): a real Node + Socket.IO server, a React client, the full placeholder story, a single-file browser demo, and checks that pass. Earlier revisions set the design: Revision 2 changed the architecture: all narration and hints are pre-generated offline, so no LLM runs during the live event. The feasibility report and MVP plan have been rewritten to match, and Revision 3 folds in your latest answers (chat stays, Guide answers are private, placeholder high-fantasy premise, free-only hosting, GTX 1650 laptop). The next step is to play it, then run the load test against a deployed Render URL and the offline generation benchmark on your GPU. Claude updates this document after every reply.

**Revision 6 (plan only, nothing built yet):** feedback said the story was too complex and too high fantasy, so the plan is a plain-language story shown as image cut scenes with a recap banner, preset messages instead of free chat, and simpler roles (CEO, Product Lead, Lead Dev, QA Lead, Customer Lead). The full plan is the Revision 6 section of the Feasibility & MVP Plan. Order of work: plan and docs, then the story, then the artifacts (engine and UI code, art, rebuilt demo). Everything below this paragraph that describes the prototype is still how it works today.

**Revision 8 (built):** the whole event is played on phones, with teams meeting anywhere and nobody on site to help. There is no free-text chat. Players tap preset messages (`shared/presets.ts`: meet in 2 / 3 / 5 min and "I am here" in the lobby only; discuss now, share your clues, not sure yet, I agree and need a minute during the game), and each lead can tap Publish to team on their private clue to post it to a read-only team feed. The server accepts only preset ids and published clues, so nothing a player types reaches it except their name. The roles are now CEO, Product Lead, CTO, Quality Lead and Customer Lead (internal keys unchanged). The app also has a phone-first layout (Game and Team tabs, a sticky Commit button), a Help and FAQ sheet on every screen (`client/src/faq.ts`, with `HELP_CONTACT` for a human contact), Rejoin after a reload and a Share invite button. The six-decision game, case cards and two-part clues from Revision 7 are not built; they need rethinking for remote play.

**Revision 7 (plan only, nothing built yet):** teams will sit together, so each decision becomes a timed in-person huddle (a stand-up round, then open floor), and the game shrinks from 10 to 6 decisions of about 174 seconds each with more complexity (two-part clues, a case card, gain-and-cost options). In-app chat and the preset feed are removed, and a full run stays about 20 minutes. The full plan is the Revision 7 section of the Feasibility & MVP Plan, with new defaults H1-H9 for you to confirm. Revisions 6 and 7 are not built; the Prototype section below is still how it works today.

## Requirements you gave

- Chat-room RPG web app; teams of at most 5, each member has a role; one decision maker picks the team's action
- Omegle-styled team chat; the dungeon master describes the situation and offers 3 options per decision (Revision 6: no free chat; the situation is shown as an image cut scene, and preset messages plus clue sharing replace chat)
- Every non-decision-maker role sees a private hint about future events
- 10 decisions with 3 per stage, about 20 minutes; a goal is declared at the start and only the true ending achieves it (Revision 7: 6 decisions, still about 20 minutes)
- 6 alternate endings and 1 true ending
- D1-D3: separate stages with a chance to tie into the main storyline or branch to an alternate ending
- D4-D5: one option surely leads to an alternate ending; of the other two, one is the true path and one a slightly different path that can tie back
- D6-D8: two wrong options, one right; D9-D10: two right, one wrong (Revision 7 scales the bands to six decisions: D1-D2, D3, D4-D5, D6)
- AI model runs locally; app reachable over the internet on a free host
- Scale: up to 200 players (40 teams), realistically about 20 teams
- No AI improvisation of the major story; content is pre-generated and served live
- Hints may be rephrased live, but can be pre-generated to cut live load
- MVP: players cannot interact with the AI at all, only view their hints and select the decision
- Later: players can ask the AI questions, but it is limited to the team's current stage and context
- Human team chat stays in the MVP (superseded in Revision 6: free chat removed; Revision 7: no in-app messaging at all)
- Later Guide answers are private to the asking player
- Premise (Revision 5): a corporate-event story in the spirit of a startup-platform drama, aligned to Rolls-Royce India but not too similar to any existing work (copyright)
- Hosting must be free (Vercel, Heroku, Render, PythonAnywhere or similar), because AI costs may come later
- Current laptop: GTX 1650 (4 GB VRAM); popular hosted models may be used later
- Deliverables: feasibility report, detailed MVP plan, tech stack and models, this handover document

### Revision 6 requirements (from feedback)

- Dumb the story down: plain, short language, less fantasy
- Show each scene as a game-style cut scene with images instead of a block of text
- No chat room: replace it with a few hard-coded preset messages (for example "meet up to discuss in 5 or 10 minutes") or a way to paste your own clue
- A banner at the top of the screen that opens a recap image with a text recap of the current scene's cut scenes
- Simpler roles: CEO, Lead Dev, QA, Product Lead and so on
- Order of work: plan and docs first, then the story, then the artifacts

### Revision 7 requirements (from feedback)

- Teams will sit together and huddle, like mini stand-up sessions
- Reduce the number of decisions, add a bit more complexity and give each decision more time

## Decisions so far

Proposals are Claude's; none is confirmed by you except the items marked Confirmed.

| Decision | Status |
| --- | --- |
| Render free web service hosts the socket server and content; the frontend can sit on a free static host | Proposed; the 200-socket load test decides, with free-only levers first |
| Story is a hand-authored graph of 13 decision nodes and 7 endings (Revision 7: 8 scene nodes, 6 decisions per run, the same 7 endings) | Proposed |
| All narration and hints are pre-generated offline with the local model, human-reviewed, committed as JSON | Proposed (follows your direction) |
| 3 phrasings per hint and 2 variants per narration; the server picks per team | Proposed |
| Laptop and Ollama are a build-time tool; no live worker, queue or fallback in the MVP | Proposed |
| Live hint rephrasing is a post-MVP feature flag, off by default | Proposed |
| No player-facing AI in the MVP; a later "ask the Guide" Q&A is scoped to the team's current stage, with a context builder and a disabled stub built now | Confirmed (scope), Proposed (design) |
| Stack: TypeScript, React + Vite, Node + Fastify, Socket.IO, Ollama (offline) | Proposed |
| Default generation model: Qwen3 4B, 4-bit, 2K context on the GTX 1650 (CPU spill is fine for an offline batch); larger or hosted models later; swappable by config | Proposed |
| No RAG in the MVP; lore is looked up by node id | Proposed |
| A hidden Chapter 1 score sends teams to the main track, a drift node or alternate ending 1 (A2) | Proposed, needs your confirmation |
| Scale: about 20 teams expected, 40 teams (200 players) as the design ceiling | Confirmed |
| Human team chat stays in the MVP (A12) | Confirmed in Revision 3; superseded in Revision 6 by preset messages and clue sharing, and in Revision 7 by face-to-face huddles |
| Guide answers, when built, are private to the asker | Confirmed |
| Revision 6 plan (cut scenes, preset messages, recap banner, plain language, new roles); decisions R1-R8 in the plan | Proposed; needs your confirmation, above all R1 (composed SVG pictures versus supplied images) and R2 (keep the Halden premise) |
| Revision 7 plan: an in-person huddle phase, 6 decisions with bands scaled to D1-D2 / D3 / D4-D5 / D6, about 174 s per decision, two-part clues, a case card, no in-app messaging, stations, per-team clocks, a retro huddle; decisions H1-H9 in the plan | Proposed; needs your confirmation, above all H2, H3, H4 and H7 |
| Premise: "Project Bridgeline", a fictional-company story (Halden Aerospace India) about taking an internal platform from prototype to company-wide rollout | Proposed; replaces the fantasy placeholder; fictional name chosen on purpose |
| Free hosting only; Render is the one free host I found that runs a Node WebSocket server | Proposed; Vercel WebSockets (beta) is the backup |

## Assumptions to confirm

Gaps in your rules that Claude filled; detail is in the Game design section of the main doc.

- A1: four chapters for scenery (D1-3, D4-6, D7-9, D10 finale); difficulty bands run separately
- A2: hidden Chapter 1 score; 0-1 ends early, 2-3 drift, 4-6 main
- A3: a drift node is one decision with one right option
- A4: both wrong options in D6-D8 end the game ('rash' and 'timid' endings)
- A5: both right options in D9-D10 only change narration flavour
- A6: the goal is pinned on every screen; alternate endings miss it
- A7: 105 seconds per decision; a timeout takes the most-suggested option, else a random one
- A8: failed teams get a short debrief, no replay
- A9: hints have a different job in each band
- A10: narration is written per node and per incoming option, so it can mention the previous choice without a live model
- A11: each hint has 3 phrasings; the server picks one per team so neighbouring teams do not see identical text
- A12 (confirmed in Revision 3, superseded in Revision 6): human team chat stays in the MVP; replaced by preset messages and a share-clue button, so advisors can still pass clues on
- H1-H9 (Revision 7): defaults for the huddle, six decisions, the band scaling, timing, complexity, no messaging, stations, clocks and the retro huddle. They replace A1, the A2 thresholds, A7 timing, A9 clue jobs and A12 for the six-decision game; see the plan.

Simulation result: a team that spots the best option 70% of the time reaches the true ending about 33% of the time (49% at 80%); pure guessing gives under 1%. Revision 7 (six decisions, my model, not yet the real engine): 27% at skill 0.5, 37% at 0.6, 50% at 0.7, 64% at 0.8 and 81% at 0.9, with 2.5% for guessing alone, so the extra complexity has to pull typical team skill down to about 0.5-0.6.

## Prototype (Revision 4)

This section describes what exists today. The Revision 6 changes are planned, not built.

What exists, built from the plan on the placeholder premise:

- **Playable demo:** one self-contained page where the real game engine runs in the browser with four practice teammates (`docs/index.html`, rebuilt for the Bridgeline story).
- **Real multiplayer app:** Node + Socket.IO server serving the React client; teams join by a 4-letter code, up to 5 players, with team chat, roles, per-player private hints, a 90-second timer, Programme Lead handover if the Programme Lead drops, and practice-teammate bots so one person can play alone. Run with `npm run build && npm start`.
- **Story:** 13 decision nodes and 7 endings in `shared/story.json`, following A1-A9. Revision 5 replaced the fantasy text with the Bridgeline story; node ids, graph and option types are unchanged, so the linter and simulator results carry over (true ending 13% at skill 0.5, 21% at 0.6, 33% at 0.7, 48% at 0.8, 70% at 0.9). Hints are sent only to the player who holds them; option types and the hidden score never reach a client.
- **Checks that pass:** typecheck; story linter (structure, per-band rules, all paths end, every route to the true ending is exactly 10 decisions, no hint repeats the right option's label); a simulator over 4,000 games per skill level; a full winning game played through the real UI in a headless browser; and a 200-socket local load test (40 teams) with no drops.
- **Simulated odds on the real engine:** true ending at 13% (skill 0.5), 20% (0.6), 31% (0.7), 50% (0.8), 70% (0.9); perfect play wins in 10 decisions. These match the earlier estimate and still assume players spot the best option with a fixed probability, which real playtests will replace.

Where it differs from the plan, so nothing is assumed done that is not:

- **Not built yet:** the content generator and review step (Phase 3), several phrasings per hint (the schema allows it; most hints have one, a few have two), per-arrival narration variants (A10), the host console, state snapshots across server restarts, a real profanity filter, and the Guide seams (`buildGuideContext`, `GuideService` stub, `HintProvider`, sender-kind field). The story text was written by hand, not generated.
- **Server is plain Node `http` plus Socket.IO, not Fastify.** Simpler for the prototype; swapping to `ws` stays a free-tier lever.
- **Local load test only.** 200 sockets with chat every 5 seconds gave p95 message delay of 12 ms on localhost. That says the code path works and nothing about a free cloud instance; run `npm run loadtest` against the deployed URL.
- **Not tested on any host yet:** nothing has been deployed to Render.
- **The hints and difficulty are untested with people.** The Bridgeline story is plausible, not balanced.
- **The Bridgeline text has not been reviewed by anyone who knows the real organisation.** It uses a fictional company on purpose; check tone, sensitivities and the failure endings before a real event, and before swapping in a real company name.

## Revision 7: the plan, in short

Full detail, including the story graph, timing, huddle format, engine changes and risks, is the Revision 7 section of the Feasibility & MVP Plan.

- **Huddle:** each decision is a cut scene (24 s), a read phase (20 s), a stand-up huddle (100 s, phones down) and a decide phase (30 s), about 174 s in all. The stand-up round gives each advisor a turn to say what they see, what worries them and what they would do; then 20 s of open floor.
- **Six decisions:** bands scaled to D1-D2 no wrong answer, D3 doom / true / detour, D4-D5 two wrong, D6 two right. Eight scene nodes (two drift), the same 7 endings, every true route exactly 6 decisions, a full run about 20 minutes.
- **More complexity:** each advisor has a fact and a role-biased worry; each scene has a case card of three public facts; each option shows a gain and a cost. The linter proves solvability from authored tags.
- **No in-app messaging:** only quiet suggestion taps; the CEO can end the huddle early; practice teammates speak as bubbles in the demo.
- **Teams and room:** numbered stations with printed code cards and QR; each team on its own clock; a 60-second retro huddle after the ending; a host console that creates stations.
- **Odds and load:** six decisions are easier at any skill level (37% at skill 0.6 versus 21% for ten), so the clues must be harder. Load is about 1 event per second in and 10 emits per second out (estimates).
- **Next:** confirm H1-H9, then the story (schema v3), engine, art, UI, host console and demo, then an in-person playtest.

## Revision 6: the plan, in short

*Revision 7 overrides the timing, the preset feed and the story length below.*

Full detail, including the story schema, art plan and file-by-file changes, is the Revision 6 section of the Feasibility & MVP Plan.

- **Cut scenes:** each decision opens with a 3-panel cut scene (about 18 seconds): one picture and one short caption per panel, tap to move on. Then the 75-second decision. A full run is about 17 minutes.
- **Pictures:** composed vector (SVG) scenes built from data (background, cast, prop, mood), so they are free, tiny, consistent and work in the single-file demo. I cannot generate raster images here; supplied images can be dropped in per panel later.
- **Recap banner:** a strip under the header opens a card with the scene's key picture, a 2-3 sentence recap and the goal. It does not pause the timer.
- **No free chat:** a read-only team feed with preset messages and "Share my clue". The server accepts only preset ids, so there is no abuse, filter or injection surface except player names. Your "meet up in 5 / 10 minutes" presets are kept, plus shorter game-clock ones, because a real 5-minute meet-up cannot fit a 75-second timer.
- **Roles:** CEO (decides), Product Lead, Lead Dev, QA Lead, Customer Lead. Internal keys stay the same, so only labels, icons and clue titles change.
- **Story:** same graph, ids and rules, rewritten in plain language with hard word limits and a reading-ease check in the linter.
- **Load:** far fewer messages than free chat (estimate: about 6 per second inbound for 200 players), still unmeasured.
- **Next:** the story (schema v2), then the engine, art, UI and rebuilt demo.

## Revision 5: what changed and why

- **New story.** The fantasy placeholder is replaced by "Project Bridgeline", a corporate-event story set at a fictional company, Halden Aerospace India. A small Bengaluru team takes an internal collaboration platform from prototype to company-wide rollout and must win the Leadership Review. It is inspired by the general shape of startup-platform dramas (small team, fast-growing network, rivalry, credit, ethics), with its own characters, situations and wording, and nothing taken from any film or book.
- **Aligned to Rolls-Royce India by theme, not by name.** The story draws on engine test cells, supplier processes, airline customers, export and data rules, quality and assurance culture, and people. It uses a fictional company so no real organisation is depicted in failure endings. The name appears only in `title`, `goal` and `intro`; search for "Halden" to change it.
- **Roles renamed, keys unchanged.** Warden is Programme Lead; Seer is Foresight Analyst; Scout is Field Engineer; Loremaster is Quality Lead; Heartspeaker is People Partner. Icons, clue titles, role blurbs, bot names and bot clue prefixes, system messages, UI copy, page title, favicon and README follow.
- **Structure untouched on purpose.** Same 13 nodes, 7 endings, ids, band rules and routing, so `lint:story` and `sim` pass unchanged (every route to the true ending is still 10 decisions; no secrets in any view). A 3-team local socket test also ran cleanly.
- **Not done:** no review by someone who knows the real organisation; most clues still have one phrasing (the first and last decisions have two); the demo was rebuilt (`docs/index.html`) but not re-tested on a phone.

## Revision 2: what changed and why

- **Live LLM is gone from the event.** Laptop sleep, network loss and model latency stop being event risks. The worker, job queue and fallback path drop out of the MVP.
- **The bottleneck moves to Render.** 200 sockets is light on memory, but chat fan-out peaks around 200 emits per second under my assumption of one message per player every 5 seconds. As far as I know, the free instance has little CPU and 512 MB; verify before the event. Phase 0 load-tests 40 bot teams; if it fails, free-only levers come first (see Revision 3).
- **Content volume:** about 52 hints x 3 phrasings, about 40 narrations x 2 variants, 7 endings with debriefs, roughly 23,000 generated tokens per full pass (about 13-25 minutes of laptop time, an estimate). Review is the real cost.
- **Authoring stays the critical path.** The model only rephrases and polishes; you still write the facts and the answer key.
- **Phase 3 is now a content pipeline:** generator, leak check against the answer key, review step, per-team phrasing selection.
- **Cold start with a 200-person join surge** is the main free-tier risk: warm the site 5 minutes early and release room codes in waves.

## Revision 3: what changed and why

- **Chat stays; Guide answers are private.** Private is required anyway because an answer may use the asker's private hint. It trims one chat emit per answer but does not reduce model load, which is the real cost.
- **Premise:** originally the placeholder "The Last Ember of Aldoria" (typical high fantasy). Replaced in Revision 5; the structure does not depend on the premise.
- **Free hosting, re-checked:** Render free is the only free host I found that fits a Node WebSocket server. Vercel now has WebSockets in public beta (my earlier note that it could not was out of date) but needs an external store for shared state, so it is the backup and a good home for the static frontend. Heroku has no free tier (about $5 a month for the cheapest plan, per a third-party page). PythonAnywhere does not support server-side WebSockets per a 2023 staff reply. Each row rests on one page I read; none is tested.
- **If 200 sockets overload the free instance:** swap Socket.IO for `ws`, limit chat to one message per player every 2 seconds, drop presence extras, and serve the frontend from a free static host. A laptop behind a free tunnel is a last-resort option to evaluate.
- **GTX 1650 (4 GB VRAM):** plan on Qwen3 4B at 4-bit with a 2K context. One third-party checker says it does not fit; I have not tested it, so Phase 0 decides. If it spills to the CPU, a full generation pass could take about 75 minutes (estimate), which an offline batch tolerates.
- **AI cost:** the MVP has zero runtime AI cost because everything is pre-generated. Cost appears only if the Guide uses a hosted model; pre-written Q&A per node keeps even that free.

## Future AI: the "Guide" (not in the MVP)

- **MVP:** players read narration and their private hint and pick the decision. No AI input box, no AI replies.
- **Later:** an "ask the Guide" box. It answers only from the team's current stage and context: the current node's public facts, the team's past choices and the asking player's own hints. Never future nodes, other roles' hints, the answer key or the score.
- **Visibility:** answers are private to the asker (confirmed); this reduces chat traffic slightly but not model load.
- **Seams built now:** `buildGuideContext(team, player)` (tested, uncalled), a disabled `GuideService` stub, `HintProvider`, an unused worker protocol in `shared/`, and a sender-kind field on chat messages.
- **Guardrails for later:** leak check against the answer key, per-player question cap, pre-written deflection for out-of-stage questions, host kill switch.
- **New risk:** player free text reaching a model reopens prompt injection; the narrow context limits the damage.
- **Load:** worst case about 570 tokens per second (200 players x 3 questions x about 100 tokens per 105 s), roughly 20 times a laptop; needs a hosted API, a tiny model, or the zero-generation option (pre-written Q&A per node matched to the question).

## Open questions

- Revision 8, decided by Claude when you left the choice to me (change any time): (1) "Meet in 2 / 3 / 5 min" stays lobby-only, because a pause during play would make a 20-minute event run unpredictably long across about 20 teams; teams that need a longer talk should agree it in the lobby. (2) The 10-decision game stays as built; the six-decision redesign from Revision 7 is parked. (3) The roles stay CEO, Product Lead, CTO, Quality Lead and Customer Lead. Still open: what `HELP_CONTACT` should say on the day.

- Revision 6: do you confirm R1-R8? (Teams will sit together, so that question is answered.)
- Revision 7: do you confirm H1-H9, above all H2 and H3 (six decisions and how the bands scale), H4 (about 20 minutes versus longer) and H7 (stations)?
- Venue: room size and layout, teams per room, Wi-Fi or mobile data, and whether volunteers can facilitate?
- Internal audience or fully public link?
- Who writes the final story: you, or Claude drafting it from a theme you give?
- Players choose roles, or server assigns them?
- React and Node, or Angular and FastAPI?
- Are assumptions A1-A11 right (A12 is confirmed), and should D6-D8 be strict (A4) or softer?
- Is a laptop-hosted server behind a free tunnel acceptable as a last-resort fallback if free hosting fails the load test?
- Date of the first playtest or event?

## Next steps

1. Confirm or change the Revision 7 decisions H1-H9 (in the plan), above all H2, H3, H4 and H7, plus the pending Revision 6 items R1 (composed SVG pictures versus supplied images) and R2 (keep the Halden premise).
2. Share the venue facts: room size and layout, teams per room, Wi-Fi or mobile data, and whether volunteers can facilitate.
3. Claude writes the plain-language story (schema v3: 8 scene nodes, two-part clues, case cards) and the linter rules, including the solvability check.
4. Claude builds the engine (phase chain, huddle turns), the art kit, the cut scene player, the huddle screen, the recap banner and the host console with station cards, then rebuilds the demo.
5. Someone who knows the real organisation reviews the final text and pictures.
6. Deploy to Render, run `npm run loadtest` against the URL, and run the generation benchmark on the GTX 1650 (unchanged from before). Then playtest with two real teams in a room of similar size.

## Change log


| Date | Change |
| --- | --- |
| 2026-11-21 | Revision 8 defaults chosen by Claude (lobby-only meeting messages, 10 decisions kept, roles kept) |
| 2026-11-21 | Revision 8 (built): no free chat, preset messages and Publish to team, roles renamed to CEO / Product Lead / CTO / Quality Lead / Customer Lead, phone-first layout, Help and FAQ sheet, Rejoin and Share invite; Revision 7 in-person parts superseded |
| 2026-11-21 | Revision 7 (plan only): teams huddle in person; 10 decisions become 6 with more complexity and about 174 s each; no in-app messaging; stations, per-team clocks and a retro huddle; plan, handover, walkthrough and README updated; nothing built yet |
| 2026-11-21 | Revision 6 (plan only): cut scenes with images, preset messages instead of free chat, recap banner, plain-language story, roles CEO / Product Lead / Lead Dev / QA Lead / Customer Lead; plan, handover, walkthrough and README updated; nothing built yet |
| 2026-11-21 | Revision 5: replaced the fantasy story with the corporate "Project Bridgeline" story; renamed roles and updated engine copy, UI, README, walkthrough and demo build |
| 2026-11-02 | Revision 4: built the prototype (server, client, story, single-file demo, linter, simulator, load test); added the Prototype section |
| 2026-11-01 | Revision 3: chat confirmed, private Guide answers, placeholder high-fantasy premise, free-only hosting comparison (Vercel WebSockets beta, Heroku, PythonAnywhere), GTX 1650 model plan |
| 2026-11-01 | MVP AI is read-only for players; Guide Q&A scoped to the current stage moved to a later phase; added A12 and a stage-scoped context builder |
| 2026-11-01 | Rewrote the full Feasibility & MVP Plan as Revision 2: server load estimate, content pipeline phase, Guide section, A10-A11 |
| 2026-11-01 | Revision 2 of this handover: scale set to 20 expected and 40 maximum teams; all content pre-generated, no live LLM; Guide chatbot seam added |
| 2026-11-01 | Redesigned to 10 decisions, 7 endings and a declared goal with per-band rules; simulated ending odds; added assumptions A1-A9 |
| 2026-11-01 | Wrote the feasibility report and MVP plan; created this handover document |

## Links

- AI Dungeon Master RPG — Feasibility & MVP Plan.md (Revision 7; the older claude.ai artifact still shows the live-worker design and is superseded)
- dm-rpg.zip: the prototype source with a README (run, build, checks)
- Playable demo: `docs/index.html` (Project Bridgeline), or the GitHub Pages link
