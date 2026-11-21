// Public help text. Nothing here is secret, so it is safe to ship in the browser bundle.
// Edit HELP_CONTACT to tell players where to reach a human on the day.
export const HELP_CONTACT = 'Message the event organisers in the event channel and tell them your team code.';

export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

export const FAQ: FaqGroup[] = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'What is this game?',
        a: 'A 20-minute team exercise. Your team takes a project through ten decisions. One of you is the CEO and makes each decision. The other four are leads (Product Lead, CTO, Quality Lead and Customer Lead) who each see a private clue. You decide together, but only the CEO taps the final choice.',
      },
      {
        q: 'How do I join my team?',
        a: 'Type your name. If a teammate already created the team, enter their 4-letter code and tap Join team. If nobody has, tap Create a new team and send the code to your teammates. A team has up to 5 people.',
      },
      {
        q: 'We are in different places. Can we still play?',
        a: 'Yes. The whole game runs on phones, so you can be anywhere. Everyone must be in the game at the same time, because it runs live for about 20 minutes. There is no typing in the game. The Team tab has a few quick messages, such as "Meet in 5 min" to agree when to start. To actually discuss, open a call with your team in your usual calling app and keep the game open next to it.',
      },
      {
        q: 'When does the game start?',
        a: 'When the person who created the team taps Start. The lobby waits as long as you need, so use that time to get everyone in, and use the quick messages in the Team tab to agree a time. The first screen after that shows your role.',
      },
      {
        q: 'What if someone has not turned up?',
        a: 'You can start with fewer than five people. The missing roles\' clues are shared among the leads who are there, so the puzzle stays solvable. The leader can also add practice teammates (computer players) to fill empty seats.',
      },
    ],
  },
  {
    title: 'Playing',
    items: [
      {
        q: 'What do I do as a lead (Product Lead, CTO, Quality Lead or Customer Lead)?',
        a: 'Read your private clue on each decision. Tap Publish to team to post it to the Team tab, or tell your team on your call. Read what others publish. Then tap the option you recommend. You can change your recommendation at any time before the CEO decides.',
      },
      {
        q: 'What do I do as the CEO?',
        a: 'You have no clues of your own, so tap Share your clues in the Team tab, or ask on your call. When you are ready, tap an option and then tap the button to commit. Nobody else can make the final choice.',
      },
      {
        q: 'Who can see my clue?',
        a: 'Only you, until you tap Publish to team. After that your team can read it in the Team tab. Nobody can see which option is right either.',
      },
      {
        q: 'What happens when the timer runs out?',
        a: 'The team follows the option your leads recommended most. If nobody recommended anything, the game picks one at random. Keep an eye on the timer bar at the top of each decision.',
      },
      {
        q: 'Is there a right answer?',
        a: 'Some paths end well and some do not. Each decision has clues that point towards the better choice, but no single clue gives it away. Teams that share what they know and weigh it together do best.',
      },
      {
        q: 'What does "Decision 4 of 10" mean?',
        a: 'A full game is ten decisions. Some routes end sooner if the team takes a wrong turn. At the end you get a short note on what mattered.',
      },
    ],
  },
  {
    title: 'Something went wrong',
    items: [
      {
        q: 'My phone locked, lost signal or I closed the page',
        a: 'Open the game again in the same browser on the same phone and tap Rejoin team on the first screen. If you do not see it, enter your name and your team code and tap Join team. You get your own seat and role back.',
      },
      {
        q: 'It says the team code is wrong or the team is full',
        a: 'Check the 4 letters with your teammate. A team has up to 5 people, so a sixth person needs to create or join a different team.',
      },
      {
        q: 'The CEO dropped out',
        a: 'If the CEO stays disconnected, the game gives the role to the next connected teammate and the Team tab tells everyone. If they come back, they rejoin as a lead.',
      },
      {
        q: 'The page looks stuck or the timer froze',
        a: 'Check your connection. If you see Reconnecting at the top, wait a few seconds. If it does not clear, reload the page and rejoin your team.',
      },
      {
        q: 'Do I need to install anything?',
        a: 'No. It works in your phone browser. Turn on auto-lock for longer than usual, or keep the screen awake, so the game does not go to sleep during a decision.',
      },
      {
        q: 'I still need help',
        a: HELP_CONTACT,
      },
    ],
  },
];

/** A short "right now" tip for the current screen, shown at the top of the help sheet. */
export function tipFor(phase: string, isCaptain: boolean, isLeader: boolean): string {
  if (phase === 'lobby') return isLeader ? 'You created this team. Share the code, wait for everyone, then tap Start.' : 'Wait here until the team leader taps Start. Use the Team tab to agree when to meet.';
  if (phase === 'intro') return 'Read your goal and role card. The game moves on by itself, or the CEO can skip ahead.';
  if (phase === 'decision') return isCaptain ? 'Tap Share your clues in the Team tab, read what your leads publish, then pick an option and commit.' : 'Publish your clue to the team, read the others, then tap the option you recommend.';
  if (phase === 'ending') return 'The game is over. Read what mattered, then leave the team or ask for a rematch with a new team.';
  return '';
}
