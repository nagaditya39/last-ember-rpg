import { useEffect, useRef, useState } from 'react';
import type { ChatMsg, View } from '../../shared/team';
import { HINT_TITLE, ROLE_ICON, ROLE_LABEL } from '../../shared/types';
import type { HintRoleKey, Role } from '../../shared/types';
import { IS_DEMO, createNet, type Net } from './net';

function getToken(): string {
  try {
    let t = localStorage.getItem('dm-token');
    if (!t) {
      t = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('dm-token', t);
    }
    return IS_DEMO ? `me-${t.slice(0, 6)}` : t;
  } catch {
    return 'p-' + Math.random().toString(36).slice(2);
  }
}

function savedName(): string {
  try {
    return localStorage.getItem('dm-name') ?? '';
  } catch {
    return '';
  }
}

const ROLE_BLURB: Record<Role, string> = {
  captain: 'You choose the team\'s path. You see no hints, so listen closely to your advisors, then decide.',
  seer: 'You alone see omens of what is coming. Share them in your own words, and weigh the others\' clues.',
  scout: 'You alone see the terrain and the dangers ahead. Share what you find, and weigh the others\' clues.',
  scholar: 'You alone know the lore behind each scene. Share it in your own words, and weigh the others\' clues.',
  empath: 'You alone sense what people and places truly intend. Share it in your own words, and weigh the others\' clues.',
};

export default function App() {
  const [net, setNet] = useState<Net | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const netRef = useRef<Net | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  function leave() {
    netRef.current?.close();
    netRef.current = null;
    setNet(null);
    setView(null);
    setChat([]);
    setOnline(true);
  }

  function connect(name: string, code?: string) {
    setError('');
    try {
      localStorage.setItem('dm-name', name);
    } catch {
      /* private mode: ignore */
    }
    netRef.current?.close();
    const n = createNet({ name: name.trim() || 'Wanderer', code, token: getToken() });
    netRef.current = n;
    n.on('state', (v: View) => {
      setView(v);
      setOffset(v.serverNow - Date.now());
    });
    n.on('chat', (m: ChatMsg) => setChat((c) => [...c.slice(-199), m]));
    n.on('chatlog', (l: ChatMsg[]) => setChat(l));
    n.on('error', (e: { message: string }) => {
      setError(e.message);
      leave();
    });
    n.on('connect', () => setOnline(true));
    n.on('disconnect', () => setOnline(false));
    setNet(n);
  }

  if (!net || !view) {
    return <Welcome onConnect={connect} error={error} connecting={!!net} />;
  }

  const remaining = view.deadline ? Math.max(0, Math.ceil((view.deadline - (now + offset)) / 1000)) : 0;

  return (
    <div className="app">
      <Header view={view} online={online} onLeave={leave} />
      <main className="layout">
        <section className="stage">
          {view.phase === 'lobby' && <Lobby view={view} net={net} />}
          {view.phase === 'intro' && <Intro view={view} net={net} remaining={remaining} />}
          {view.phase === 'decision' && <Decision view={view} net={net} remaining={remaining} />}
          {view.phase === 'ending' && <Ending view={view} onAgain={leave} />}
        </section>
        <ChatPanel view={view} chat={chat} net={net} />
      </main>
    </div>
  );
}

function Header({ view, online, onLeave }: { view: View; online: boolean; onLeave: () => void }) {
  return (
    <header className="top">
      <div className="brand">
        <span className="flame" aria-hidden>🔥</span>
        <div>
          <strong>{view.title}</strong>
          <small>{IS_DEMO ? 'Practice team (runs in your browser)' : `Team ${view.code}`}</small>
        </div>
      </div>
      <div className="top-right">
        {!online && <span className="pill warn">Reconnecting…</span>}
        {view.phase === 'decision' && (
          <span className="pill">
            Decision {view.slot} of {view.total}
          </span>
        )}
        <button className="ghost" onClick={onLeave}>
          Leave
        </button>
      </div>
    </header>
  );
}

function Welcome({ onConnect, error, connecting }: { onConnect: (n: string, c?: string) => void; error: string; connecting: boolean }) {
  const [name, setName] = useState(savedName());
  const [code, setCode] = useState('');
  const ok = name.trim().length > 0;
  return (
    <div className="welcome">
      <div className="card hero">
        <div className="flame big" aria-hidden>🔥</div>
        <h1>The Last Ember of Aldoria</h1>
        <p className="lead">
          A team quest told in about twenty minutes. One of you is the Warden and makes every decision. The rest are advisors who each see
          a private clue the others cannot, and must pass it on through chat.
        </p>
        <label className="field">
          <span>Your name</span>
          <input value={name} maxLength={20} placeholder="e.g. Brenna" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ok && onConnect(name)} autoFocus />
        </label>
        {IS_DEMO ? (
          <>
            <button className="primary" disabled={!ok || connecting} onClick={() => onConnect(name)}>
              Begin the practice quest
            </button>
            <p className="fine">
              You play with four practice teammates who chat and suggest options. This preview runs entirely in your browser; the real game
              uses a server so human teams can play together.
            </p>
          </>
        ) : (
          <>
            <button className="primary" disabled={!ok || connecting} onClick={() => onConnect(name)}>
              Create a new team
            </button>
            <div className="or">or join one</div>
            <div className="row">
              <input className="code" value={code} maxLength={4} placeholder="CODE" onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <button disabled={!ok || code.length < 4 || connecting} onClick={() => onConnect(name, code)}>
                Join team
              </button>
            </div>
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

function Lobby({ view, net }: { view: View; net: Net }) {
  const [pref, setPref] = useState<'random' | 'captain' | 'advisor'>('random');
  const hasBots = view.members.some((m) => m.bot);
  return (
    <div className="card">
      <h2>Gather your party</h2>
      {!IS_DEMO && (
        <div className="codebox">
          <span>Share this code with your teammates</span>
          <b>{view.code}</b>
        </div>
      )}
      <ul className="members">
        {view.members.map((m) => (
          <li key={m.id} className={m.connected ? '' : 'off'}>
            <span className="avatar">{m.bot ? '🤖' : '🧑'}</span>
            <span className="mname">{m.name}</span>
            {m.id === view.you.id && <span className="tag">you</span>}
            {m.isLeader && <span className="tag gold">leader</span>}
            {m.bot && <span className="tag">practice</span>}
          </li>
        ))}
        {Array.from({ length: Math.max(0, 5 - view.members.length) }).map((_, i) => (
          <li key={`e${i}`} className="empty">
            <span className="avatar">·</span> <span className="mname">Open seat</span>
          </li>
        ))}
      </ul>
      {view.you.isLeader ? (
        <>
          {view.members.length < 5 && (
            <button className="ghost" onClick={() => net.emit('bots', { count: 5 - view.members.length })}>
              Fill empty seats with practice teammates
            </button>
          )}
          {hasBots && (
            <div className="seg" role="radiogroup" aria-label="Your role">
              <span>Your role:</span>
              {(['random', 'captain', 'advisor'] as const).map((k) => (
                <button key={k} role="radio" aria-checked={pref === k} className={pref === k ? 'on' : ''} onClick={() => setPref(k)}>
                  {k === 'random' ? 'Random' : k === 'captain' ? 'Warden' : 'Advisor'}
                </button>
              ))}
            </div>
          )}
          <button className="primary" onClick={() => net.emit('start', pref === 'random' ? {} : { captain: pref === 'captain' })}>
            Set out ({view.members.length} {view.members.length === 1 ? 'player' : 'players'})
          </button>
          <p className="fine">Roles are drawn at random. With fewer than five players, the missing roles' clues are shared among the advisors.</p>
        </>
      ) : (
        <p className="waiting">Waiting for the team leader to set out…</p>
      )}
    </div>
  );
}

function RoleCard({ role }: { role?: Role }) {
  if (!role) return null;
  return (
    <div className="rolecard">
      <span className="ricon" aria-hidden>{ROLE_ICON[role]}</span>
      <div>
        <b>You are the {ROLE_LABEL[role]}</b>
        <p>{ROLE_BLURB[role]}</p>
      </div>
    </div>
  );
}

function Timer({ remaining, total }: { remaining: number; total: number }) {
  const pct = total ? Math.min(100, (remaining / total) * 100) : 0;
  return (
    <div className={`timer ${remaining <= 15 ? 'low' : ''}`} aria-label={`${remaining} seconds left`}>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <span>{remaining}s</span>
    </div>
  );
}

function Intro({ view, net, remaining }: { view: View; net: Net; remaining: number }) {
  const canSkip = view.you.isCaptain || view.you.isLeader;
  return (
    <div className="card">
      <h2>{view.title}</h2>
      <p className="story">{view.intro}</p>
      <div className="goal"><b>Your goal.</b> {view.goal}</div>
      <RoleCard role={view.you.role} />
      <Timer remaining={remaining} total={view.phaseSeconds} />
      {canSkip && (
        <button className="primary" onClick={() => net.emit('skip')}>
          Begin the journey
        </button>
      )}
    </div>
  );
}

function Decision({ view, net, remaining }: { view: View; net: Net; remaining: number }) {
  const [pending, setPending] = useState('');
  useEffect(() => setPending(''), [view.slot, view.node?.title]);
  const node = view.node;
  if (!node) return null;
  const captain = view.you.isCaptain;
  const maxVotes = Math.max(0, ...node.options.map((o) => o.votes));
  return (
    <div className="card">
      <div className="meta">
        <span className="chapter">{view.chapter}</span>
        <Timer remaining={remaining} total={view.phaseSeconds} />
      </div>
      <h2>{node.title}</h2>
      {view.aftermath && <p className="aftermath">{view.aftermath}</p>}
      <p className="story">{node.scene}</p>

      {view.hints.length > 0 && (
        <div className="hints">
          {view.hints.map((h) => (
            <div key={h.from} className={`hint ${h.from}`}>
              <span className="hlabel">
                <span aria-hidden>{ROLE_ICON[h.from as HintRoleKey]}</span> {HINT_TITLE[h.from as HintRoleKey]}
                <em>only you can see this</em>
              </span>
              <p>{h.text}</p>
            </div>
          ))}
        </div>
      )}
      {captain && view.hints.length === 0 && <p className="fine">You are the Warden: ask your advisors what they have seen, then choose.</p>}

      <h3>{captain ? 'Choose your path' : 'Suggest a path to the Warden'}</h3>
      <ul className="options">
        {node.options.map((o) => {
          const selected = captain ? pending === o.id : o.mine;
          return (
            <li key={o.id}>
              <button
                className={`opt ${selected ? 'sel' : ''} ${o.votes > 0 && o.votes === maxVotes ? 'top' : ''}`}
                aria-pressed={selected}
                onClick={() => (captain ? setPending(o.id) : net.emit('suggest', { optionId: o.id }))}
              >
                <span className="otext">{o.label}</span>
                {o.votes > 0 && <span className="votes">{o.votes} {o.votes === 1 ? 'suggestion' : 'suggestions'}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {captain ? (
        <button className="primary" disabled={!pending} onClick={() => net.emit('choose', { optionId: pending })}>
          Lead the party this way
        </button>
      ) : (
        <p className="fine">The Warden decides. If time runs out, the most-suggested path is taken.</p>
      )}
    </div>
  );
}

function Ending({ view, onAgain }: { view: View; onAgain: () => void }) {
  const e = view.ending;
  if (!e) return null;
  const win = e.kind === 'true';
  return (
    <div className={`card ending ${win ? 'win' : 'lose'}`}>
      <div className="badge">{win ? 'The goal is achieved' : 'The goal slips away'}</div>
      <h2>{e.title}</h2>
      <p className="story">{e.text}</p>
      <div className="debrief">
        <b>What mattered.</b> {e.debrief}
        <div className="fine">Final choice: "{e.lastChoice}" · {e.decisions} decisions made</div>
      </div>
      <button className="primary" onClick={onAgain}>
        {IS_DEMO ? 'Play again' : 'Leave the party'}
      </button>
    </div>
  );
}

function ChatPanel({ view, chat, net }: { view: View; chat: ChatMsg[]; net: Net }) {
  const [text, setText] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [chat.length]);
  function send() {
    const t = text.trim();
    if (!t) return;
    net.emit('chat', { text: t });
    setText('');
  }
  return (
    <aside className="chat" aria-label="Team chat">
      <div className="chat-head">
        <b>Party chat</b>
        <div className="roster">
          {view.members.map((m) => (
            <span key={m.id} className={`chip ${m.connected ? '' : 'off'}`} title={m.role ? ROLE_LABEL[m.role] : ''}>
              {m.role ? ROLE_ICON[m.role] : '·'} {m.name}
            </span>
          ))}
        </div>
      </div>
      <div className="log" ref={box} aria-live="polite">
        {chat.map((m) =>
          m.system ? (
            <div key={m.id} className="msg sys">{m.text}</div>
          ) : (
            <div key={m.id} className={`msg ${m.from === view.you.id ? 'mine' : ''}`}>
              <span className="who">
                {m.role ? ROLE_ICON[m.role] + ' ' : ''}
                {m.name}
              </span>
              <span className="body">{m.text}</span>
            </div>
          ),
        )}
      </div>
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input value={text} maxLength={200} placeholder="Share what you know…" onChange={(e) => setText(e.target.value)} />
        <button className="primary" type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
}
