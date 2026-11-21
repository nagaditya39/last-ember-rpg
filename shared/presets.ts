/**
 * The only things a player can "say". There is no free text anywhere in the game: the server accepts a
 * preset id, looks the words up here, and posts them to the team feed. Safe to ship to the browser.
 */
export interface Preset {
  id: string;
  /** short button text */
  label: string;
  /** what the team feed shows */
  text: string;
  /** 'meet' presets arrange a real-world meeting, so they only work in the lobby */
  group: 'meet' | 'talk';
}

export const PRESETS: Preset[] = [
  { id: 'meet2', label: 'Meet in 2 min', text: "Let's meet in 2 minutes and discuss.", group: 'meet' },
  { id: 'meet3', label: 'Meet in 3 min', text: "Let's meet in 3 minutes and discuss.", group: 'meet' },
  { id: 'meet5', label: 'Meet in 5 min', text: "Let's meet in 5 minutes and discuss.", group: 'meet' },
  { id: 'ready', label: 'I am here', text: "I'm here and ready.", group: 'meet' },
  { id: 'now', label: 'Discuss now', text: "Let's discuss this now.", group: 'talk' },
  { id: 'ask', label: 'Share your clues', text: 'Could everyone publish their clue?', group: 'talk' },
  { id: 'unsure', label: 'Not sure yet', text: "I'm not sure yet. Let's hear more.", group: 'talk' },
  { id: 'agree', label: 'I agree', text: 'I agree with the leading option.', group: 'talk' },
  { id: 'time', label: 'Need a minute', text: 'I need a little more time.', group: 'talk' },
];

export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
