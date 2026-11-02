/**
 * Plays whole games through the real Team engine (no sockets, no timers waiting)
 * to check that every ending is reachable, that no secret ever reaches a client
 * view, that small teams still receive all four hints, and what win rates look like.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Team } from '../shared/team';
import type { Story } from '../shared/types';

const here = path.dirname(fileURLToPath(import.meta.url));
const story = JSON.parse(fs.readFileSync(path.join(here, '../shared/story.json'), 'utf-8')) as Story;
const BEST = new Set(['strong', 'true', 'right']);

let leaks = 0;
let hintGaps = 0;

function play(teamSize: number, skill: number): { ending: string; decisions: number } {
  const views = new Map<string, any>();
  const team = new Team(story, 'SIMX', { send: (pid, ev, p) => ev === 'state' && views.set(pid, p) }, { decisionSeconds: 3600, introSeconds: 3600, botSkill: 0.7 });
  const ids = Array.from({ length: teamSize }, (_, i) => `p${i}`);
  ids.forEach((id) => team.join(id, `Player${id}`));
  team.handle('p0', 'start', {});
  team.handle('p0', 'skip', {});
  let guard = 0;
  while (team.phase === 'decision' && guard++ < 30) {
    const captain = ids.find((id) => (views.get(id) as any).you.isCaptain)!;
    // every view must hold all four hints in total, and never expose secrets
    const hintRoles = new Set<string>();
    for (const id of ids) {
      const v = views.get(id);
      const json = JSON.stringify(v);
      if (/"type"|"to"|"score"|"strong"|"doom"|"detour"|"rash"|"timid"/.test(json)) leaks++;
      for (const h of v.hints) hintRoles.add(h.from);
    }
    if (hintRoles.size !== 4) hintGaps++;
    const node = story.nodes[team.nodeId];
    const view = views.get(captain);
    const best = node.options.find((o) => BEST.has(o.type))!;
    const shown = view.node.options.map((o: any) => o.id);
    const pick = Math.random() < skill ? best.id : shown[Math.floor(Math.random() * shown.length)];
    team.handle(captain, 'choose', { optionId: pick });
  }
  const res = { ending: team.endingId, decisions: team.history.length };
  team.destroy();
  return res;
}

const N = 4000;
console.log(`Simulating ${N} games per skill level (skill = chance a team spots the best option, else it guesses)\n`);
console.log('skill  true-ending  avg decisions   endings reached');
for (const skill of [0.3, 0.5, 0.6, 0.7, 0.8, 0.9]) {
  const counts: Record<string, number> = {};
  let dec = 0;
  for (let i = 0; i < N; i++) {
    const r = play(1 + (i % 5), skill);
    counts[r.ending] = (counts[r.ending] ?? 0) + 1;
    dec += r.decisions;
  }
  const t = ((counts['end_true'] ?? 0) / N) * 100;
  console.log(
    `${skill.toFixed(1)}    ${t.toFixed(1).padStart(5)}%      ${(dec / N).toFixed(1).padStart(5)}          ${Object.keys(counts).sort().map((k) => k.replace('end_', '')).join(' ')}`,
  );
}

// a deterministic perfect run must win in exactly 10 decisions
const perfect = play(5, 1);
console.log(`\nPerfect play: ${perfect.ending} after ${perfect.decisions} decisions`);
console.log(`Secrets leaked into any client view: ${leaks}`);
console.log(`Decisions where the four hints were not all available to the team: ${hintGaps}`);
if (leaks || hintGaps || perfect.ending !== 'end_true' || perfect.decisions !== 10) {
  console.error('SIM FAILED');
  process.exit(1);
}
console.log('SIM OK');
