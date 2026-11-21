/** Rules of the team feed: preset phrases only, publish-your-clue once, no free text. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Team } from '../shared/team';
import type { Story } from '../shared/types';

const here = path.dirname(fileURLToPath(import.meta.url));
const story = JSON.parse(fs.readFileSync(path.join(here, '../shared/story.json'), 'utf-8')) as Story;
const views = new Map<string, any>();
const team = new Team(story, 'TEST', { send: (pid, ev, p) => ev === 'state' && views.set(pid, p) }, { decisionSeconds: 3600, introSeconds: 3600, botSkill: 0.7 });
const ids = ['p0', 'p1', 'p2', 'p3', 'p4'];
ids.forEach((id) => team.join(id, id));
const fails: string[] = [];
const check = (ok: boolean, m: string) => !ok && fails.push(m);
const feed = () => team.chat.filter((m) => !m.system);
let wait = 0;
const tick = () => { wait += 1000; (Date as any).now = () => realNow() + wait; };
const realNow = Date.now.bind(Date);

// lobby: a meeting preset works, free text and unknown ids do not
team.handle('p1', 'say', { id: 'meet5' });
const n1 = feed().length;
team.handle('p2', 'say', { text: 'hello there' });
team.handle('p2', 'say', { id: 'not-a-preset' });
team.handle('p2', 'chat', { text: 'hello there' });
check(feed().length === n1, 'free text or unknown id reached the feed');
check(feed()[0]?.text.includes('5 minutes'), 'meet5 text missing');
tick(); team.handle('p1', 'say', { id: 'meet5' }); // too fast after the previous one? 1 s later is allowed
tick();

team.handle('p0', 'start', {});
team.handle('p0', 'skip', {});
check(team.phase === 'decision', 'did not reach a decision');
const holder = ids.find((id) => views.get(id).hints.length > 0 && !views.get(id).you.isCaptain)!;
const captain = ids.find((id) => views.get(id).you.isCaptain)!;
const role = views.get(holder).hints[0].from;
const other = ids.find((id) => id !== holder && id !== captain)!;

tick(); team.handle(other, 'say', { id: 'meet2' });
check(!feed().some((m) => m.text.includes('2 minutes')), 'meeting preset worked during a decision');
team.handle(other, 'publish', { role });
check(!feed().some((m) => m.kind === 'clue'), 'someone published a clue they do not hold');
team.handle(captain, 'publish', { role });
check(!feed().some((m) => m.kind === 'clue'), 'the CEO published a clue');
team.handle(holder, 'publish', { role });
team.handle(holder, 'publish', { role });
const clues = feed().filter((m) => m.kind === 'clue');
check(clues.length === 1, `expected 1 clue message, got ${clues.length}`);
check(views.get(holder).hints[0].published === true, 'view does not mark the hint as published');
check(views.get(other).hints.every((h: any) => h.published === false), 'published flag leaked to another player');
tick(); team.handle(other, 'say', { id: 'agree' });
check(feed().some((m) => m.text.includes('agree')), 'talk preset missing in a decision');

if (fails.length) { console.error('FEED TEST FAILED:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('FEED TEST OK');
process.exit(0);
