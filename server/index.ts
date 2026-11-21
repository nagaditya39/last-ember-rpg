import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server, type Socket } from 'socket.io';
import { Team } from '../shared/team';
import type { Story } from '../shared/types';

const here = path.dirname(fileURLToPath(import.meta.url));
const story = JSON.parse(fs.readFileSync(path.join(here, '../shared/story.json'), 'utf-8')) as Story;
const dist = path.join(here, '../dist');

const PORT = Number(process.env.PORT ?? 3000);
const opts = {
  decisionSeconds: Number(process.env.DECISION_SECONDS ?? 90),
  introSeconds: Number(process.env.INTRO_SECONDS ?? 20),
  botSkill: Number(process.env.BOT_SKILL ?? 0.7),
};

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const teams = new Map<string, Team>();
const sockets = new Map<string, Socket>();

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname === '/api/status') {
    const players = [...teams.values()].reduce((n, t) => n + t.players.filter((p) => !p.bot).length, 0);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, teams: teams.size, humanPlayers: players, sockets: sockets.size, opts }));
    return;
  }
  // static client
  let file = path.join(dist, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  if (!fs.existsSync(file)) {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end('Server is running. Build the client with `npm run build`, or run `npm run dev:client` and open http://localhost:5173');
    return;
  }
  res.setHeader('content-type', MIME[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

const io = new Server(server, { pingInterval: 25000, pingTimeout: 30000 });

function newCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += letters[Math.floor(Math.random() * letters.length)];
    if (!teams.has(c)) return c;
  }
}

const hooks = {
  send(pid: string, ev: string, payload: unknown) {
    sockets.get(pid)?.emit(ev, payload);
  },
};

const GAME_EVENTS = new Set(['say', 'publish', 'suggest', 'choose', 'start', 'skip', 'bots']);

io.on('connection', (socket) => {
  let pid = '';
  let team: Team | undefined;

  socket.on('join', (data: { name?: string; code?: string; token?: string }) => {
    const token = String(data?.token ?? '').slice(0, 64);
    if (!token) return socket.emit('error', { message: 'Missing player token.' });
    let t: Team | undefined;
    if (data.code) {
      t = teams.get(String(data.code).trim().toUpperCase());
      if (!t) return socket.emit('error', { message: 'No team with that code.' });
    } else {
      const code = newCode();
      t = new Team(story, code, hooks, opts);
      teams.set(code, t);
    }
    const res = t.join(token, String(data.name ?? ''));
    if (!res.ok) return socket.emit('error', { message: res.error });
    const old = sockets.get(token);
    if (old && old !== socket) old.disconnect(true);
    pid = token;
    team = t;
    sockets.set(pid, socket);
    socket.emit('joined', { code: t.code });
    t.sendInitial(pid);
    t.broadcast();
  });

  socket.onAny((ev, payload) => {
    if (team && pid && GAME_EVENTS.has(ev)) team.handle(pid, ev, payload);
  });

  socket.on('disconnect', () => {
    if (team && pid && sockets.get(pid) === socket) {
      sockets.delete(pid);
      team.setConnected(pid, false);
    }
  });
});

// tidy up abandoned teams
setInterval(() => {
  const now = Date.now();
  for (const [code, t] of teams) {
    if (t.allHumansGone() && now - t.lastActivity > 30 * 60 * 1000) {
      t.destroy();
      teams.delete(code);
    }
  }
}, 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`Project Bridgeline: http://localhost:${PORT}  (decision timer ${opts.decisionSeconds}s)`);
});
