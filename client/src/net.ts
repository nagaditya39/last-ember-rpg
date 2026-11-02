import { io } from 'socket.io-client';
import { Team } from '../../shared/team';
import story from '../../shared/story.json';
import type { Story } from '../../shared/types';

export const IS_DEMO = typeof __DEMO__ !== 'undefined' && __DEMO__;

export interface JoinPayload {
  name: string;
  code?: string;
  token: string;
}

export interface Net {
  emit(ev: string, payload?: unknown): void;
  on(ev: string, fn: (p: any) => void): void;
  close(): void;
}

/** Real mode: a Socket.IO connection to the game server. It re-joins by token after any reconnect. */
function realNet(join: JoinPayload): Net {
  const socket = io({ transports: ['websocket', 'polling'] });
  socket.on('connect', () => socket.emit('join', join));
  return {
    emit: (ev, p) => socket.emit(ev, p),
    on: (ev, fn) => {
      socket.on(ev, fn);
    },
    close: () => socket.close(),
  };
}

/**
 * Demo mode: the very same Team engine runs inside the page, with four practice
 * teammates. No server, no network. It is how the single-file preview works.
 */
function demoNet(join: JoinPayload): Net {
  const handlers = new Map<string, (p: any) => void>();
  const fire = (ev: string, p: unknown) => {
    const fn = handlers.get(ev);
    if (fn) queueMicrotask(() => fn(JSON.parse(JSON.stringify(p))));
  };
  const team = new Team(
    story as unknown as Story,
    'DEMO',
    { send: (pid, ev, p) => (pid === join.token ? fire(ev, p) : undefined) },
    { decisionSeconds: 75, introSeconds: 25, botSkill: 0.72 },
  );
  // let the page register its handlers before the first events fire
  setTimeout(() => {
    team.join(join.token, join.name);
    team.addBots(4);
    fire('joined', { code: 'DEMO' });
    team.sendInitial(join.token);
  }, 0);
  return {
    emit: (ev, p) => team.handle(join.token, ev, p),
    on: (ev, fn) => {
      handlers.set(ev, fn);
    },
    close: () => team.destroy(),
  };
}

export function createNet(join: JoinPayload): Net {
  return IS_DEMO ? demoNet(join) : realNet(join);
}
