import { HINT_ROLES } from './types';
import { PRESET_BY_ID } from './presets';
import type { HintRoleKey, Role, Story, StoryNode } from './types';

/**
 * Pure game logic for ONE team. It has no network code: whoever hosts it
 * (the Socket.IO server, or the in-browser demo) passes in a `send` hook.
 * Nothing here ever calls a model; all text comes from story.json.
 */

export type Phase = 'lobby' | 'intro' | 'decision' | 'ending';

export interface Hooks {
  send(playerId: string, event: string, payload: unknown): void;
}

export interface TeamOptions {
  decisionSeconds: number;
  introSeconds: number;
  /** chance a practice teammate suggests the best option */
  botSkill: number;
}

export interface Player {
  id: string;
  name: string;
  role?: Role;
  connected: boolean;
  joinedAt: number;
  bot: boolean;
  lastChatAt: number;
}

export interface ChatMsg {
  id: number;
  from: string;
  name: string;
  role?: Role;
  text: string;
  ts: number;
  system?: boolean;
  /** a preset phrase, or a clue an advisor published from their own hint */
  kind?: 'preset' | 'clue';
}

interface HistoryItem {
  nodeId: string;
  optionId: string;
  label: string;
}

const BOT_NAMES = ['Aarav', 'Meera', 'Karthik', 'Divya', 'Rohan'];
const CHAPTER1_POINTS: Record<string, number> = { strong: 2, mixed: 1, weak: 0 };
const BEST_TYPES = new Set(['strong', 'true', 'right']);

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Team {
  readonly code: string;
  players: Player[] = [];
  phase: Phase = 'lobby';
  nodeId = '';
  slot = 0;
  score = 0; // hidden Chapter 1 score, never sent to clients
  history: HistoryItem[] = [];
  aftermath = '';
  deadline = 0;
  phaseSeconds = 0;
  endingId = '';
  captainId = '';
  leaderId = '';
  chat: ChatMsg[] = [];
  lastActivity = Date.now();

  private chatSeq = 0;
  private published = new Set<string>();
  private suggestions = new Map<string, string>();
  private order: string[] = [];
  private hintOwner = new Map<HintRoleKey, string>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private introTimer: ReturnType<typeof setTimeout> | undefined;
  private botTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private story: Story,
    code: string,
    private hooks: Hooks,
    private opts: TeamOptions,
  ) {
    this.code = code;
  }

  // ---------- membership ----------

  join(id: string, name: string): { ok: true; player: Player } | { ok: false; error: string } {
    this.lastActivity = Date.now();
    const existing = this.players.find((p) => p.id === id);
    if (existing) {
      existing.connected = true;
      return { ok: true, player: existing };
    }
    if (this.phase !== 'lobby') return { ok: false, error: 'That team has already set out.' };
    if (this.players.length >= 5) return { ok: false, error: 'That team is full (5 players).' };
    const player: Player = {
      id,
      name: this.uniqueName(name),
      connected: true,
      joinedAt: Date.now(),
      bot: false,
      lastChatAt: 0,
    };
    this.players.push(player);
    if (!this.leaderId) this.leaderId = id;
    this.system(`${player.name} joined the team.`);
    return { ok: true, player };
  }

  setConnected(id: string, connected: boolean) {
    const p = this.players.find((x) => x.id === id);
    if (!p) return;
    p.connected = connected;
    this.lastActivity = Date.now();
    if (this.phase === 'intro' || this.phase === 'decision') {
      if (!connected && id === this.captainId) {
        const heir = this.players
          .filter((x) => x.id !== id && x.connected)
          .sort((a, b) => Number(a.bot) - Number(b.bot) || a.joinedAt - b.joinedAt)[0];
        if (heir) this.swapCaptain(heir.id);
      }
      this.assignHints(); // keep every hint reachable while someone is offline
    }
    this.broadcast();
  }

  allHumansGone(): boolean {
    return this.players.filter((p) => !p.bot).every((p) => !p.connected);
  }

  destroy() {
    clearTimeout(this.timer);
    clearTimeout(this.introTimer);
    this.botTimers.forEach(clearTimeout);
    this.botTimers = [];
  }

  private uniqueName(name: string): string {
    const base = (name || 'Colleague').trim().slice(0, 20) || 'Colleague';
    let n = base;
    let i = 2;
    while (this.players.some((p) => p.name.toLowerCase() === n.toLowerCase())) n = `${base} ${i++}`;
    return n;
  }

  // ---------- incoming events ----------

  handle(pid: string, ev: string, payload: any) {
    this.lastActivity = Date.now();
    const me = this.players.find((p) => p.id === pid);
    if (!me) return;
    switch (ev) {
      case 'say':
        return this.say(me, String(payload?.id ?? ''));
      case 'publish':
        return this.publish(me, String(payload?.role ?? ''));
      case 'suggest':
        return this.suggest(me, String(payload?.optionId ?? ''));
      case 'choose':
        return this.choose(me.id, String(payload?.optionId ?? ''), false);
      case 'start':
        return pid === this.leaderId ? this.start(pid, typeof payload?.captain === 'boolean' ? payload.captain : undefined) : undefined;
      case 'skip':
        if (this.phase === 'intro' && (pid === this.captainId || pid === this.leaderId)) this.beginJourney();
        return;
      case 'bots':
        return pid === this.leaderId ? this.addBots(Number(payload?.count ?? 4)) : undefined;
    }
  }

  sendInitial(pid: string) {
    this.hooks.send(pid, 'chatlog', this.chat.slice(-100));
    this.hooks.send(pid, 'state', this.view(pid));
  }

  // ---------- chat ----------

  /** A preset phrase. Rate limited; meeting phrases only make sense before the game starts. */
  private say(p: Player, id: string) {
    const preset = PRESET_BY_ID.get(id);
    if (!preset) return;
    if (preset.group === 'meet' && this.phase !== 'lobby') return;
    const now = Date.now();
    if (now - p.lastChatAt < 800) return;
    p.lastChatAt = now;
    this.pushChat({ from: p.id, name: p.name, role: p.role, text: preset.text, kind: 'preset' });
  }

  /** Post the clue this player holds for the current decision into the team feed, once. */
  private publish(p: Player, role: string) {
    if (this.phase !== 'decision') return;
    const r = HINT_ROLES.find((x) => x === role);
    if (!r || this.hintOwner.get(r) !== p.id) return;
    const key = `${this.nodeId}:${r}`;
    if (this.published.has(key)) return;
    this.published.add(key);
    this.pushChat({ from: p.id, name: p.name, role: r, text: this.pickHint(this.story.nodes[this.nodeId], r), kind: 'clue' });
    this.broadcast();
  }

  private system(text: string) {
    this.pushChat({ from: 'system', name: 'Narrator', text, system: true });
  }

  private pushChat(m: Omit<ChatMsg, 'id' | 'ts'>) {
    const msg: ChatMsg = { ...m, id: ++this.chatSeq, ts: Date.now() };
    this.chat.push(msg);
    if (this.chat.length > 200) this.chat.shift();
    for (const p of this.players) if (!p.bot) this.hooks.send(p.id, 'chat', msg);
  }

  // ---------- game flow ----------

  addBots(count: number) {
    if (this.phase !== 'lobby') return;
    const room = 5 - this.players.length;
    const n = Math.max(0, Math.min(count, room));
    let k = 0;
    for (const name of BOT_NAMES) {
      if (k >= n) break;
      if (this.players.some((p) => p.name === name)) continue;
      this.players.push({
        id: `bot-${this.code}-${name}`,
        name,
        connected: true,
        joinedAt: Date.now() + k,
        bot: true,
        lastChatAt: 0,
      });
      k++;
    }
    if (k) this.system(`${k} practice teammate${k > 1 ? 's' : ''} joined the team.`);
    this.broadcast();
  }

  start(by?: string, wantCaptain?: boolean) {
    if (this.phase !== 'lobby') return;
    const rnd = Math.random;
    const order = shuffle(this.players, rnd);
    if (by && typeof wantCaptain === 'boolean' && order.length > 1) {
      const i = order.findIndex((p) => p.id === by);
      if (wantCaptain && i > 0) [order[0], order[i]] = [order[i], order[0]];
      if (!wantCaptain && i === 0) [order[0], order[1]] = [order[1], order[0]];
    }
    order.forEach((p, i) => {
      p.role = i === 0 ? 'captain' : undefined;
    });
    this.captainId = order[0].id;
    const advisorRoles = shuffle(HINT_ROLES, rnd);
    order.slice(1).forEach((p, i) => {
      p.role = advisorRoles[i];
    });
    this.assignHints();
    this.phase = 'intro';
    this.phaseSeconds = this.opts.introSeconds;
    this.deadline = Date.now() + this.opts.introSeconds * 1000;
    this.introTimer = setTimeout(() => this.beginJourney(), this.opts.introSeconds * 1000);
    this.system('Roles have been drawn. Read your role card.');
    this.broadcast();
  }

  /** Each hint role goes to the player holding it; missing roles are shared out round-robin. */
  private assignHints() {
    this.hintOwner.clear();
    const advisors = this.players.filter((p) => p.role && p.role !== 'captain' && p.connected);
    let rr = 0;
    for (const r of HINT_ROLES) {
      const holder = this.players.find((p) => p.role === r && p.connected);
      if (holder) this.hintOwner.set(r, holder.id);
      else if (advisors.length) this.hintOwner.set(r, advisors[rr++ % advisors.length].id);
      else this.hintOwner.set(r, this.captainId); // solo play: the CEO holds every hint
    }
  }

  private swapCaptain(newId: string) {
    const oldCap = this.players.find((p) => p.id === this.captainId);
    const heir = this.players.find((p) => p.id === newId);
    if (!oldCap || !heir) return;
    const heirRole = heir.role;
    heir.role = 'captain';
    oldCap.role = heirRole;
    this.captainId = heir.id;
    this.assignHints();
    this.system(`${heir.name} is now the CEO.`);
  }

  private beginJourney() {
    if (this.phase !== 'intro') return;
    clearTimeout(this.introTimer);
    this.nodeId = this.story.start;
    this.slot = 1;
    this.enterNode();
  }

  private enterNode() {
    this.phase = 'decision';
    const node = this.story.nodes[this.nodeId];
    const rnd = mulberry32(hashStr(this.code + this.nodeId));
    this.order = shuffle(
      node.options.map((o) => o.id),
      rnd,
    );
    this.suggestions.clear();
    this.phaseSeconds = this.opts.decisionSeconds;
    this.deadline = Date.now() + this.opts.decisionSeconds * 1000;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.timeout(), this.opts.decisionSeconds * 1000);
    this.broadcast();
    this.scheduleBots(node);
  }

  private suggest(p: Player, optionId: string) {
    if (this.phase !== 'decision' || p.id === this.captainId) return;
    if (!this.order.includes(optionId)) return;
    if (this.suggestions.get(p.id) === optionId) this.suggestions.delete(p.id);
    else this.suggestions.set(p.id, optionId);
    this.broadcast();
  }

  private mostSuggested(): string | undefined {
    const counts = new Map<string, number>();
    for (const o of this.suggestions.values()) counts.set(o, (counts.get(o) ?? 0) + 1);
    let best = 0;
    let ids: string[] = [];
    for (const [id, c] of counts) {
      if (c > best) {
        best = c;
        ids = [id];
      } else if (c === best) ids.push(id);
    }
    return ids.length ? ids[Math.floor(Math.random() * ids.length)] : undefined;
  }

  private timeout() {
    if (this.phase !== 'decision') return;
    const picked = this.mostSuggested();
    const optionId = picked ?? this.order[Math.floor(Math.random() * this.order.length)];
    this.system(
      picked
        ? 'Time ran out. The team follows the most-suggested option.'
        : 'Time ran out. The team moves on without a clear decision.',
    );
    this.choose(this.captainId, optionId, true);
  }

  choose(pid: string, optionId: string, auto: boolean) {
    if (this.phase !== 'decision') return;
    if (!auto && pid !== this.captainId) return;
    const node = this.story.nodes[this.nodeId];
    const opt = node.options.find((o) => o.id === optionId);
    if (!opt) return;
    clearTimeout(this.timer);
    this.botTimers.forEach(clearTimeout);
    this.botTimers = [];
    const captain = this.players.find((p) => p.id === this.captainId);
    if (!auto) this.system(`${captain?.name ?? 'The CEO'} chose: ${opt.label}`);
    this.history.push({ nodeId: node.id, optionId: opt.id, label: opt.label });
    if (node.band === 'c1') this.score += CHAPTER1_POINTS[opt.type] ?? 0;

    let next = opt.to;
    if (next === '@ch1') next = this.score <= 1 ? 'end_alt1' : this.score <= 3 ? 'dr_a' : 'm4';

    this.aftermath = opt.aftermath;
    if (next.startsWith('end_')) {
      this.endingId = next;
      this.phase = 'ending';
      this.deadline = 0;
      this.system(`The programme ends: ${this.story.endings[next].title}.`);
      this.broadcast();
      return;
    }
    this.nodeId = next;
    this.slot += 1; // a drift node replaces the next main node, so every team makes at most 10 decisions
    this.enterNode();
  }

  // ---------- practice teammates (bots) ----------

  private later(ms: number, fn: () => void) {
    this.botTimers.push(setTimeout(fn, ms));
  }

  private bestOption(node: StoryNode): string | undefined {
    return node.options.find((o) => BEST_TYPES.has(o.type))?.id;
  }

  private scheduleBots(node: StoryNode) {
    const f = this.opts.decisionSeconds / 90;
    for (const bot of this.players.filter((p) => p.bot && p.role)) {
      if (bot.role === 'captain') {
        this.later((55 + Math.random() * 25) * 1000 * f, () => {
          const pick = this.mostSuggested() ?? this.order[Math.floor(Math.random() * this.order.length)];
          this.choose(bot.id, pick, false);
        });
        continue;
      }
      let t = (2 + Math.random() * 6) * 1000 * f;
      for (const [r, owner] of this.hintOwner) {
        if (owner !== bot.id) continue;
        this.later(t, () => this.publish(bot, r));
        t += (3 + Math.random() * 3) * 1000 * f;
      }
      this.later((25 + Math.random() * 30) * 1000 * f, () => {
        const best = this.bestOption(node);
        const id = best && Math.random() < this.opts.botSkill ? best : this.order[Math.floor(Math.random() * this.order.length)];
        this.suggestions.set(bot.id, id);
        this.broadcast();
      });
    }
  }

  // ---------- views (what each player is allowed to see) ----------

  private pickHint(node: StoryNode, r: HintRoleKey): string {
    const variants = node.hints[r];
    return variants[hashStr(this.code + node.id + r) % variants.length];
  }

  broadcast() {
    for (const p of this.players) if (!p.bot) this.hooks.send(p.id, 'state', this.view(p.id));
  }

  view(pid: string) {
    const me = this.players.find((p) => p.id === pid)!;
    const node = this.phase === 'decision' ? this.story.nodes[this.nodeId] : undefined;
    const votes = new Map<string, number>();
    for (const o of this.suggestions.values()) votes.set(o, (votes.get(o) ?? 0) + 1);
    const ending = this.endingId ? this.story.endings[this.endingId] : undefined;
    return {
      code: this.code,
      phase: this.phase,
      serverNow: Date.now(),
      deadline: this.deadline,
      phaseSeconds: this.phaseSeconds,
      title: this.story.title,
      goal: this.story.goal,
      intro: this.story.intro,
      you: {
        id: me.id,
        name: me.name,
        role: me.role,
        isCaptain: me.id === this.captainId,
        isLeader: me.id === this.leaderId,
      },
      members: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        connected: p.connected,
        bot: p.bot,
        isCaptain: p.id === this.captainId,
        isLeader: p.id === this.leaderId,
      })),
      slot: this.slot,
      total: 10,
      chapter: node ? this.story.chapters[node.chapter] : undefined,
      aftermath: this.aftermath,
      solo: !this.players.some((p) => p.role && p.role !== 'captain'),
      node: node && {
        title: node.title,
        scene: node.scene,
        options: this.order.map((oid) => {
          const o = node.options.find((x) => x.id === oid)!;
          return { id: o.id, label: o.label, votes: votes.get(o.id) ?? 0, mine: this.suggestions.get(pid) === o.id };
        }),
      },
      hints: node
        ? HINT_ROLES.filter((r) => this.hintOwner.get(r) === pid).map((r) => ({ from: r, text: this.pickHint(node, r), published: this.published.has(`${this.nodeId}:${r}`) }))
        : [],
      ending: ending && {
        title: ending.title,
        kind: ending.kind,
        text: ending.text,
        debrief: ending.debrief,
        decisions: this.history.length,
        lastChoice: this.history[this.history.length - 1]?.label ?? '',
      },
    };
  }
}

export type View = ReturnType<Team['view']>;
