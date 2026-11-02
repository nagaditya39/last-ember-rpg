/**
 * Phase 0 load test: opens TEAMS x 5 real Socket.IO clients against a running server,
 * has them chat at a steady rate and play, and reports message delay.
 *
 *   TARGET=http://localhost:3000 TEAMS=40 SECONDS=60 npm run loadtest
 *
 * Run it against your deployed URL to measure the real host. Numbers from localhost
 * only prove the code path works; they say nothing about a free cloud instance.
 */
import { io, type Socket } from 'socket.io-client';

const TARGET = process.env.TARGET ?? 'http://localhost:3000';
const TEAMS = Number(process.env.TEAMS ?? 40);
const SECONDS = Number(process.env.SECONDS ?? 60);
const CHAT_EVERY_MS = Number(process.env.CHAT_EVERY_MS ?? 5000);

const delays: number[] = [];
let sent = 0;
let received = 0;
let disconnects = 0;
let connected = 0;
const sentAt = new Map<string, number>();

function client(team: number, idx: number, getCode: () => string | undefined, setCode: (c: string) => void): Promise<Socket> {
  return new Promise((resolve) => {
    const token = `lt-${team}-${idx}`;
    const s = io(TARGET, { transports: ['websocket'], reconnection: true });
    s.on('connect', () => {
      s.emit('join', { name: `Bot${team}-${idx}`, code: getCode(), token });
    });
    s.on('disconnect', () => disconnects++);
    s.on('joined', (d: { code: string }) => {
      setCode(d.code);
      connected++;
      resolve(s);
    });
    s.on('chat', (m: { text: string; from: string }) => {
      received++;
      if (m.from === token) {
        const t = sentAt.get(m.text);
        if (t) {
          delays.push(Date.now() - t);
          sentAt.delete(m.text);
        }
      }
    });
    s.on('state', (v: any) => {
      if (v.phase === 'decision' && v.you.isCaptain && !(s as any)._busy) {
        (s as any)._busy = true;
        setTimeout(() => {
          (s as any)._busy = false;
          if (v.node) s.emit('choose', { optionId: v.node.options[Math.floor(Math.random() * 3)].id });
        }, 3000 + Math.random() * 20000);
      }
    });
  });
}

async function main() {
  console.log(`Target ${TARGET}: ${TEAMS} teams x 5 players = ${TEAMS * 5} sockets, chat every ${CHAT_EVERY_MS / 1000}s per player, ${SECONDS}s`);
  const all: Socket[] = [];
  const leaders: Socket[] = [];
  const t0 = Date.now();
  for (let t = 0; t < TEAMS; t++) {
    let code: string | undefined;
    const leader = await client(t, 0, () => undefined, (c) => (code = c));
    leaders.push(leader);
    all.push(leader);
    const rest = await Promise.all([1, 2, 3, 4].map((i) => client(t, i, () => code, () => undefined)));
    all.push(...rest);
  }
  console.log(`All ${connected} sockets joined in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  leaders.forEach((l) => l.emit('start', {}));
  setTimeout(() => leaders.forEach((l) => l.emit('skip', {})), 1500);

  const timers = all.map((s, i) =>
    setInterval(() => {
      const text = `m${i}-${Date.now()}`;
      sentAt.set(text, Date.now());
      sent++;
      s.emit('chat', { text });
    }, CHAT_EVERY_MS + (i % 7) * 100),
  );

  await new Promise((r) => setTimeout(r, SECONDS * 1000));
  timers.forEach(clearInterval);
  await new Promise((r) => setTimeout(r, 1500));
  delays.sort((a, b) => a - b);
  const q = (p: number) => delays[Math.min(delays.length - 1, Math.floor(delays.length * p))] ?? 0;
  console.log(`sent ${sent}, own-echo received ${delays.length} (${((delays.length / Math.max(1, sent)) * 100).toFixed(1)}%), all chat events received ${received}`);
  console.log(`delay ms: p50 ${q(0.5)}  p95 ${q(0.95)}  p99 ${q(0.99)}  max ${delays[delays.length - 1] ?? 0}`);
  console.log(`unexpected disconnects: ${disconnects}`);
  all.forEach((s) => s.close());
  process.exit(0);
}
main();
