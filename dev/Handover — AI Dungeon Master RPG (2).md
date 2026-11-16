# Handover — AI Dungeon Master RPG

Nov 2, 2026 · @aditya · Revision 4

A playable prototype now exists (Revision 4, see Prototype below): a real Node + Socket.IO server, a React client, the full placeholder story, a single-file browser demo, and checks that pass. Earlier revisions set the design: Revision 2 changed the architecture: all narration and hints are pre-generated offline, so no LLM runs during the live event. The feasibility report and MVP plan have been rewritten to match, and Revision 3 folds in your latest answers (chat stays, Guide answers are private, placeholder high-fantasy premise, free-only hosting, GTX 1650 laptop). The next step is to play it, then run the load test against a deployed Render URL and the offline generation benchmark on your GPU. Claude updates this document after every reply.

## Requirements you gave

- Chat-room RPG web app; teams of at most 5, each member has a role; one decision maker picks the team's action
- Omegle-styled team chat; the dungeon master describes the situation and offers 3 options per decision
- Every non-decision-maker role sees a private hint about future events
- 10 decisions with 3 per stage, about 20 minutes; a goal is declared at the start and only the true ending achieves it
- 6 alternate endings and 1 true ending
- D1-D3: separate stages with a chance to tie into the main storyline or branch to an alternate ending
- D4-D5: one option surely leads to an alternate ending; of the other two, one is the true path and one a slightly different path that can tie back
- D6-D8: two wrong options, one right; D9-D10: two right, one wrong
- AI model runs locally; app reachable over the internet on a free host
- Scale: up to 200 players (40 teams), realistically about 20 teams
- No AI improvisation of the major story; content is pre-generated and served live
- Hints may be rephrased live, but can be pre-generated to cut live load
- MVP: players cannot interact with the AI at all, only view their hints and select the decision
- Later: players can ask the AI questions, but it is limited to the team's current stage and context
- Human team chat stays in the MVP
- Later Guide answers are private to the asking player
- Temporary premise: typical high fantasy
- Hosting must be free (Vercel, Heroku, Render, PythonAnywhere or similar), because AI costs may come later
- Current laptop: GTX 1650 (4 GB VRAM); popular hosted models may be used later
- Deliverables: feasibility report, detailed MVP plan, tech stack and models, this handover document

## Decisions so far

Proposals are Claude's; none is confirmed by you except the items marked Confirmed.

| Decision | Status |
| --- | --- |
| Render free web service hosts the socket server and content; the frontend can sit on a free static host | Proposed; the 200-socket load test decides, with free-only levers first |
| Story is a hand-authored graph of 13 decision nodes and 7 endings | Proposed |
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
| Human team chat stays in the MVP (A12) | Confirmed |
| Guide answers, when built, are private to the asker | Confirmed |
| Temporary high-fantasy premise, "The Last Ember of Aldoria" | Placeholder; replace any time |
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
- A12 (confirmed): human team chat stays in the MVP (it is how advisors share hints); only the AI is non-interactive

Simulation result: a team that spots the best option 70% of the time reaches the true ending about 33% of the time (49% at 80%); pure guessing gives under 1%.

## Prototype (Revision 4)

What exists, built from the plan on the placeholder premise:

- **Playable demo:** one self-contained page where the real game engine runs in the browser with four practice teammates (the artifact link in the chat; also `last-ember-demo.html`).
- **Real multiplayer app:** Node + Socket.IO server serving the React client; teams join by a 4-letter code, up to 5 players, with team chat, roles, per-player private hints, a 90-second timer, Warden handover if the Warden drops, and practice-teammate bots so one person can play alone. Run with `npm run build && npm start`.
- **Story:** 13 decision nodes and 7 endings in `shared/story.json`, following A1-A9. Hints are sent only to the player who holds them; option types and the hidden score never reach a client.
- **Checks that pass:** typecheck; story linter (structure, per-band rules, all paths end, every route to the true ending is exactly 10 decisions, no hint repeats the right option's label); a simulator over 4,000 games per skill level; a full winning game played through the real UI in a headless browser; and a 200-socket local load test (40 teams) with no drops.
- **Simulated odds on the real engine:** true ending at 13% (skill 0.5), 20% (0.6), 31% (0.7), 50% (0.8), 70% (0.9); perfect play wins in 10 decisions. These match the earlier estimate and still assume players spot the best option with a fixed probability, which real playtests will replace.

Where it differs from the plan, so nothing is assumed done that is not:

- **Not built yet:** the content generator and review step (Phase 3), several phrasings per hint (the schema allows it; most hints have one, a few have two), per-arrival narration variants (A10), the host console, state snapshots across server restarts, a real profanity filter, and the Guide seams (`buildGuideContext`, `GuideService` stub, `HintProvider`, sender-kind field). The story text was written by hand, not generated.
- **Server is plain Node `http` plus Socket.IO, not Fastify.** Simpler for the prototype; swapping to `ws` stays a free-tier lever.
- **Local load test only.** 200 sockets with chat every 5 seconds gave p95 message delay of 12 ms on localhost. That says the code path works and nothing about a free cloud instance; run `npm run loadtest` against the deployed URL.
- **Not tested on any host yet:** nothing has been deployed to Render.
- **The hints and difficulty are untested with people.** The placeholder story is plausible, not balanced.

## Revision 2: what changed and why

- **Live LLM is gone from the event.** Laptop sleep, network loss and model latency stop being event risks. The worker, job queue and fallback path drop out of the MVP.
- **The bottleneck moves to Render.** 200 sockets is light on memory, but chat fan-out peaks around 200 emits per second under my assumption of one message per player every 5 seconds. As far as I know, the free instance has little CPU and 512 MB; verify before the event. Phase 0 load-tests 40 bot teams; if it fails, free-only levers come first (see Revision 3).
- **Content volume:** about 52 hints x 3 phrasings, about 40 narrations x 2 variants, 7 endings with debriefs, roughly 23,000 generated tokens per full pass (about 13-25 minutes of laptop time, an estimate). Review is the real cost.
- **Authoring stays the critical path.** The model only rephrases and polishes; you still write the facts and the answer key.
- **Phase 3 is now a content pipeline:** generator, leak check against the answer key, review step, per-team phrasing selection.
- **Cold start with a 200-person join surge** is the main free-tier risk: warm the site 5 minutes early and release room codes in waves.

## Revision 3: what changed and why

- **Chat stays; Guide answers are private.** Private is required anyway because an answer may use the asker's private hint. It trims one chat emit per answer but does not reduce model load, which is the real cost.
- **Placeholder premise:** "The Last Ember of Aldoria", typical high fantasy: carry the Emberstone to the Altar of Aldoria before the Ashen Eclipse. Chapters and all seven endings are named in the main doc; the structure does not depend on it.
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

- Internal audience or fully public link?
- Who writes the final story: you, or Claude drafting it from a theme you give?
- Players choose roles, or server assigns them?
- React and Node, or Angular and FastAPI?
- Are assumptions A1-A11 right (A12 is confirmed), and should D6-D8 be strict (A4) or softer?
- Is a laptop-hosted server behind a free tunnel acceptable as a last-resort fallback if free hosting fails the load test?
- Date of the first playtest or event?

## Next steps

1. You play the demo and the local app and tell Claude what feels wrong: pacing, hint difficulty, the UI, the roles.
2. You answer the open questions above.
3. Deploy to Render, then run `npm run loadtest` against the URL and share the numbers (this replaces the Phase 0 hello-socket spike).
4. Run the generation benchmark on the GTX 1650 and decide whether Qwen3 4B is good enough.
5. Claude builds the content generator and review step, adds per-team hint phrasings, and the host console.
6. Decide whether the placeholder premise stays or the story is rewritten.

## Change log

| Date | Change |
| --- | --- |
| 2026-11-02 | Revision 4: built the prototype (server, client, story, single-file demo, linter, simulator, load test); added the Prototype section |
| 2026-11-01 | Revision 3: chat confirmed, private Guide answers, placeholder high-fantasy premise, free-only hosting comparison (Vercel WebSockets beta, Heroku, PythonAnywhere), GTX 1650 model plan |
| 2026-11-01 | MVP AI is read-only for players; Guide Q&A scoped to the current stage moved to a later phase; added A12 and a stage-scoped context builder |
| 2026-11-01 | Rewrote the full Feasibility & MVP Plan as Revision 2: server load estimate, content pipeline phase, Guide section, A10-A11 |
| 2026-11-01 | Revision 2 of this handover: scale set to 20 expected and 40 maximum teams; all content pre-generated, no live LLM; Guide chatbot seam added |
| 2026-11-01 | Redesigned to 10 decisions, 7 endings and a declared goal with per-band rules; simulated ending odds; added assumptions A1-A9 |
| 2026-11-01 | Wrote the feasibility report and MVP plan; created this handover document |

## Links

- AI Dungeon Master RPG — Feasibility & MVP Plan.md (Revision 3; the older claude.ai artifact still shows the live-worker design and is superseded)
- dm-rpg.zip: the prototype source with a README (run, build, checks)
- Playable demo: the Last Ember of Aldoria artifact page in this conversation
