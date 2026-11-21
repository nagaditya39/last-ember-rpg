import { useEffect, useRef, useState } from 'react';
import type { ChatMsg, View } from '../../shared/team';
import { HINT_TITLE, ROLE_ICON, ROLE_LABEL } from '../../shared/types';
import type { HintRoleKey, Role } from '../../shared/types';
import { IS_DEMO, createNet, type Net } from './net';
import { FAQ, tipFor } from './faq';
import { PRESETS } from '../../shared/presets';

function getToken(): string {
  try {
    // One id per browser, so a phone that reloads gets its seat back.
    // For testing several players on one computer, open the page with ?seat=1, ?seat=2 ...
    const key = 'dm-token' + (new URLSearchParams(location.search).get('seat') ?? '');
    let t = localStorage.getItem(key);
    if (!t) {
      t = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, t);
    }
    return IS_DEMO ? `me-${t.slice(0, 6)}` : t;
  } catch {
    return 'p-' + Math.random().toString(36).slice(2);
  }
}

function savedCode(): string {
  try {
    return localStorage.getItem('dm-code') ?? '';
  } catch {
    return '';
  }
}
function saveCode(c: string) {
  try {
    if (c) localStorage.setItem('dm-code', c);
    else localStorage.removeItem('dm-code');
  } catch {
    /* ignore */
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
  captain: "You are the CEO. You make the team's decisions. You see no clues of your own, so ask your leads to publish theirs, then decide.",
  seer: 'You see what is coming: market, customer and regulatory signals. Publish your clue to the team, and weigh the others\' clues.',
  scout: 'You know what the systems and test cells can really do. Publish your clue to the team, and weigh the others\' clues.',
  scholar: 'You know the quality records, rules and past lessons. Publish your clue to the team, and weigh the others\' clues.',
  empath: 'You know what customers and colleagues truly want and fear. Publish your clue to the team, and weigh the others\' clues.',
};

export default function App() {
  const [net, setNet] = useState<Net | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState<'game' | 'chat'>('game');
  const [helpOpen, setHelpOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const netRef = useRef<Net | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  function leave() {
    saveCode('');
    netRef.current?.close();
    netRef.current = null;
    setNet(null);
    setView(null);
    setChat([]);
    setTab('game');
    setSeen(0);
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
    const n = createNet({ name: name.trim() || 'Colleague', code, token: getToken() });
    netRef.current = n;
    n.on('state', (v: View) => {
      setView(v);
      if (!IS_DEMO && v.code) saveCode(v.code);
      setOffset(v.serverNow - Date.now());
    });
    n.on('chat', (m: ChatMsg) => setChat((c) => [...c.slice(-199), m]));
    n.on('chatlog', (l: ChatMsg[]) => setChat(l));
    n.on('error', (e: { message: string }) => {
      saveCode('');
      setError(e.message);
      leave();
    });
    n.on('connect', () => setOnline(true));
    n.on('disconnect', () => setOnline(false));
    setNet(n);
  }

  const unread = tab === 'chat' ? 0 : Math.max(0, chat.filter((m) => !m.system).length - seen);
  useEffect(() => {
    if (tab === 'chat') setSeen(chat.filter((m) => !m.system).length);
  }, [tab, chat]);

  if (!net || !view) {
    return (
      <>
        <Welcome onConnect={connect} error={error} connecting={!!net} onHelp={() => setHelpOpen(true)} />
        {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} tip="" />}
      </>
    );
  }

  const remaining = view.deadline ? Math.max(0, Math.ceil((view.deadline - (now + offset)) / 1000)) : 0;

  return (
    <div className="app" data-tab={tab}>
      <Header view={view} online={online} onLeave={leave} onHelp={() => setHelpOpen(true)} />
      <main className="layout">
        <section className="stage" aria-label="Game">
          {view.phase === 'lobby' && <Lobby view={view} net={net} />}
          {view.phase === 'intro' && <Intro view={view} net={net} remaining={remaining} />}
          {view.phase === 'decision' && <Decision view={view} net={net} remaining={remaining} />}
          {view.phase === 'ending' && <Ending view={view} onAgain={leave} />}
        </section>
        <FeedPanel view={view} chat={chat} net={net} active={tab === 'chat'} />
      </main>
      <nav className="tabbar" aria-label="Screens">
        <button className={tab === 'game' ? 'on' : ''} aria-current={tab === 'game'} onClick={() => setTab('game')}>
          <span aria-hidden>🎮</span> Game
        </button>
        <button className={tab === 'chat' ? 'on' : ''} aria-current={tab === 'chat'} onClick={() => setTab('chat')}>
          <span aria-hidden>💬</span> Team{unread > 0 && <b className="badge-n">{unread > 9 ? '9+' : unread}</b>}
        </button>
      </nav>
      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} tip={tipFor(view.phase, view.you.isCaptain, view.you.isLeader)} />}
    </div>
  );
}

function HelpSheet({ onClose, tip }: { onClose: () => void; tip: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Help and FAQ" tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Help &amp; FAQ</h2>
          <button className="ghost" onClick={onClose} aria-label="Close help">
            Close
          </button>
        </div>
        <div className="sheet-body">
          {tip && (
            <div className="tip">
              <b>Right now.</b> {tip}
            </div>
          )}
          {FAQ.map((g) => (
            <section key={g.title}>
              <h3>{g.title}</h3>
              {g.items.map((it) => (
                <details key={it.q} className="faq">
                  <summary>{it.q}</summary>
                  <p>{it.a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Header({ view, online, onLeave, onHelp }: { view: View; online: boolean; onLeave: () => void; onHelp: () => void }) {
  return (
    <header className="top">
      <div className="brand">
        <span className="flame" aria-hidden>🌉</span>
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
        <button className="ghost help-btn" onClick={onHelp} aria-label="Help and FAQ">
          ? <span className="lbl">Help</span>
        </button>
        <button className="ghost" onClick={onLeave}>
          Leave
        </button>
      </div>
    </header>
  );
}

function Welcome({ onConnect, error, connecting, onHelp }: { onConnect: (n: string, c?: string) => void; error: string; connecting: boolean; onHelp: () => void }) {
  const [name, setName] = useState(savedName());
  const [code, setCode] = useState('');
  const last = IS_DEMO ? '' : savedCode();
  const ok = name.trim().length > 0;
  return (
    <div className="welcome">
      <div className="card hero">
        <div className="flame big" aria-hidden>🌉</div>
        <h1>Project Bridgeline</h1>
        <p className="lead">
          A team simulation played in about twenty minutes. One of you is the CEO and makes every decision. The other four are leads
          (Product, CTO, Quality, Customer) who each see a private clue the others cannot, and publish it to the team.
        </p>
        <label className="field">
          <span>Your name</span>
          <input value={name} maxLength={20} placeholder="e.g. Priya" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ok && onConnect(name)} autoComplete="given-name" />
        </label>
        {IS_DEMO ? (
          <>
            <button className="primary" disabled={!ok || connecting} onClick={() => onConnect(name)}>
              Begin the practice run
            </button>
            <p className="fine">
              You play with four practice teammates who publish clues and recommend options. This preview runs entirely in your browser; the real game
              uses a server so human teams can play together.
            </p>
          </>
        ) : (
          <>
            {last && (
              <button className="primary" disabled={!ok || connecting} onClick={() => onConnect(name, last)}>
                Rejoin team {last}
              </button>
            )}
            <button className={last ? '' : 'primary'} style={last ? { width: '100%', marginTop: 10 } : undefined} disabled={!ok || connecting} onClick={() => onConnect(name)}>
              Create a new team
            </button>
            <div className="or">or join one</div>
            <div className="row">
              <input className="code" value={code} maxLength={4} placeholder="CODE" autoCapitalize="characters" autoCorrect="off" spellCheck={false} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <button disabled={!ok || code.length < 4 || connecting} onClick={() => onConnect(name, code)}>
                Join team
              </button>
            </div>
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="ghost helplink" onClick={onHelp}>
          New here? Read the FAQ
        </button>
      </div>
    </div>
  );
}

function Lobby({ view, net }: { view: View; net: Net }) {
  const [pref, setPref] = useState<'random' | 'captain' | 'lead'>('random');
  const hasBots = view.members.some((m) => m.bot);
  return (
    <div className="card">
      <h2>Assemble your team</h2>
      {!IS_DEMO && (
        <div className="codebox">
          <span>Share this code with your teammates</span>
          <b>{view.code}</b>
          <ShareCode code={view.code} />
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
              {(['random', 'captain', 'lead'] as const).map((k) => (
                <button key={k} role="radio" aria-checked={pref === k} className={pref === k ? 'on' : ''} onClick={() => setPref(k)}>
                  {k === 'random' ? 'Random' : k === 'captain' ? 'CEO' : 'Lead'}
                </button>
              ))}
            </div>
          )}
          <button className="primary" onClick={() => net.emit('start', pref === 'random' ? {} : { captain: pref === 'captain' })}>
            Start the programme ({view.members.length} {view.members.length === 1 ? 'player' : 'players'})
          </button>
          <p className="fine">Roles are drawn at random. With fewer than five players, the missing roles' clues are shared among the leads.</p>
        </>
      ) : (
        <p className="waiting">Waiting for the team leader to start…</p>
      )}
    </div>
  );
}

function ShareCode({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  const text = `Join my Project Bridgeline team. Open ${location.origin}${location.pathname} and enter the code ${code}`;
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Project Bridgeline', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* cancelled or blocked: ignore */
    }
  }
  return (
    <button className="ghost sharebtn" onClick={share}>
      {done ? 'Copied' : 'Share invite'}
    </button>
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
          Begin the programme
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
                <em>only you can see this until you publish it</em>
              </span>
              <p>{h.text}</p>
              <button className="ghost pub" disabled={h.published} onClick={() => net.emit('publish', { role: h.from })}>
                {h.published ? 'Published to your team ✓' : 'Publish to team'}
              </button>
            </div>
          ))}
        </div>
      )}
      {captain && view.hints.length === 0 && <p className="fine">You are the CEO: ask your leads to publish their clues, then decide.</p>}

      <h3>{captain ? 'Choose your next move' : 'Recommend a move to the CEO'}</h3>
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
        <div className="actionbar">
          <button className="primary" disabled={!pending} onClick={() => net.emit('choose', { optionId: pending })}>
            Commit the team to this move
          </button>
        </div>
      ) : (
        <p className="fine">The CEO decides. If time runs out, the most-suggested option is taken.</p>
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
        {IS_DEMO ? 'Play again' : 'Leave the team'}
      </button>
    </div>
  );
}

function FeedPanel({ view, chat, net, active }: { view: View; chat: ChatMsg[]; net: Net; active: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [cool, setCool] = useState(false);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [chat.length, active]);
  const lobby = view.phase === 'lobby';
  const shown = PRESETS.filter((p) => (lobby ? true : p.group === 'talk'));
  function say(id: string) {
    if (cool) return;
    net.emit('say', { id });
    setCool(true);
    setTimeout(() => setCool(false), 900);
  }
  const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <aside className="chat" aria-label="Team feed" data-active={active}>
      <div className="chat-head">
        <b>Team feed</b>
        <div className="roster">
          {view.members.map((m) => (
            <span key={m.id} className={`chip ${m.connected ? '' : 'off'}`} title={m.role ? ROLE_LABEL[m.role] : ''}>
              {m.role ? ROLE_ICON[m.role] : '·'} {m.name}
            </span>
          ))}
        </div>
      </div>
      <div className="log" ref={box} aria-live="polite">
        {chat.length === 0 && <div className="msg sys">Nothing yet. Tap a message below to tell your team something.</div>}
        {chat.map((m) =>
          m.system ? (
            <div key={m.id} className="msg sys">{m.text}</div>
          ) : m.kind === 'clue' ? (
            <div key={m.id} className="msg clue">
              <span className="who">
                {m.role ? ROLE_ICON[m.role] + ' ' : ''}
                {m.name} published a clue · {time(m.ts)}
              </span>
              <span className="body">
                {m.role && <b>{HINT_TITLE[m.role as HintRoleKey]}</b>}
                {m.text}
              </span>
            </div>
          ) : (
            <div key={m.id} className={`msg ${m.from === view.you.id ? 'mine' : ''}`}>
              <span className="who">
                {m.role ? ROLE_ICON[m.role] + ' ' : ''}
                {m.name} · {time(m.ts)}
              </span>
              <span className="body">{m.text}</span>
            </div>
          ),
        )}
      </div>
      <div className="presets" role="group" aria-label="Quick messages">
        {lobby && <p className="fine">Agree when to meet, then the leader taps Start. These are the only messages in the game.</p>}
        <div className="pgrid">
          {shown.map((p) => (
            <button key={p.id} disabled={cool} onClick={() => say(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
