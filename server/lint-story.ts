import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Story } from '../shared/types';
import { HINT_ROLES } from '../shared/types';

const here = path.dirname(fileURLToPath(import.meta.url));
const story = JSON.parse(fs.readFileSync(path.join(here, '../shared/story.json'), 'utf-8')) as Story;

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const nodes = Object.values(story.nodes);
const endings = Object.values(story.endings);

// shape
if (nodes.length !== 13) err(`expected 13 decision nodes, found ${nodes.length}`);
if (endings.length !== 7) err(`expected 7 endings, found ${endings.length}`);
if (endings.filter((e) => e.kind === 'true').length !== 1) err('expected exactly one true ending');
if (endings.filter((e) => e.kind === 'alt').length !== 6) err('expected exactly six alternate endings');
if (!story.nodes[story.start]) err(`start node ${story.start} missing`);

// band rules
const want: Record<string, string[]> = {
  c1: ['strong', 'mixed', 'weak'],
  d45: ['true', 'doom', 'detour'],
  d68: ['right', 'rash', 'timid'],
  d910: ['right', 'right', 'wrong'],
  drift: ['right', 'wrong', 'wrong'],
};
for (const n of nodes) {
  if (n.options.length !== 3) err(`${n.id}: needs exactly 3 options`);
  const got = n.options.map((o) => o.type).sort().join(',');
  const exp = (want[n.band] ?? []).slice().sort().join(',');
  if (got !== exp) err(`${n.id} (${n.band}): option types [${got}] should be [${exp}]`);
  for (const r of HINT_ROLES) {
    const h = n.hints[r];
    if (!h || h.length < 1 || h.some((t) => !t.trim())) err(`${n.id}: missing hint for ${r}`);
  }
  for (const o of n.options) {
    const ok = o.to === '@ch1' || story.nodes[o.to] || story.endings[o.to];
    if (!ok) err(`${n.id}/${o.id}: target "${o.to}" does not exist`);
    if (o.to === '@ch1' && n.band !== 'c1') err(`${n.id}/${o.id}: only Chapter 1 nodes may route to @ch1`);
  }
  // the right answer must never be named in a hint verbatim
  for (const o of n.options.filter((x) => ['strong', 'true', 'right'].includes(x.type))) {
    for (const r of HINT_ROLES)
      for (const t of n.hints[r] ?? [])
        if (t.toLowerCase().includes(o.label.toLowerCase())) err(`${n.id}: hint (${r}) repeats the option label "${o.label}"`);
  }
}

// graph: expand @ch1, make sure everything is reachable and every path ends within 10 decisions
const expand = (to: string): string[] => (to === '@ch1' ? ['end_alt1', 'dr_a', 'm4'] : [to]);
const seen = new Set<string>();
const lens: Record<string, Set<number>> = {};
function walk(id: string, depth: number, stack: string[]) {
  if (id.startsWith('end_')) {
    seen.add(id);
    (lens[id] ??= new Set()).add(depth);
    return;
  }
  if (stack.includes(id)) return err(`cycle through ${id}`);
  const n = story.nodes[id];
  if (!n) return;
  seen.add(id);
  for (const o of n.options) for (const t of expand(o.to)) walk(t, depth + 1, [...stack, id]);
}
walk(story.start, 0, []);
for (const id of [...Object.keys(story.nodes), ...Object.keys(story.endings)]) if (!seen.has(id)) err(`unreachable: ${id}`);
const trueLens = [...(lens['end_true'] ?? [])];
if (trueLens.length !== 1 || trueLens[0] !== 10) err(`every route to the true ending should take exactly 10 decisions; found ${trueLens.join(',')}`);
for (const [id, set] of Object.entries(lens)) for (const d of set) if (d > 10) err(`path to ${id} takes ${d} decisions (max 10)`);

if (errors.length) {
  console.error(`Story lint FAILED (${errors.length}):\n- ` + errors.join('\n- '));
  process.exit(1);
}
const summary = Object.entries(lens)
  .map(([id, s]) => `${id}: ${[...s].sort((a, b) => a - b).join('/')} decisions`)
  .join('\n  ');
console.log(`Story lint OK: ${nodes.length} decision nodes, ${endings.length} endings, all reachable.\n  ${summary}`);
