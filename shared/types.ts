export type HintRoleKey = 'seer' | 'scout' | 'scholar' | 'empath';
export type Role = 'captain' | HintRoleKey;

export const HINT_ROLES: HintRoleKey[] = ['seer', 'scout', 'scholar', 'empath'];

export const ROLE_LABEL: Record<Role, string> = {
  captain: 'CEO',
  seer: 'Product Lead',
  scout: 'CTO',
  scholar: 'Quality Lead',
  empath: 'Customer Lead',
};

export const ROLE_ICON: Record<Role, string> = {
  captain: '👔',
  seer: '🧭',
  scout: '💻',
  scholar: '📋',
  empath: '🤝',
};

export const HINT_TITLE: Record<HintRoleKey, string> = {
  seer: "The Product Lead’s outlook",
  scout: "The CTO’s technical read",
  scholar: "The Quality Lead’s record",
  empath: "The Customer Lead’s feedback",
};

/**
 * Option types are authored data. They never leave the server / engine:
 * clients only see id + label.
 *   c1 band:   strong (2 pts) / mixed (1) / weak (0)
 *   d45 band:  true (stay on main) / doom (alt ending 2) / detour (drift node)
 *   d68 band:  right / rash (alt ending 4) / timid (alt ending 5)
 *   d910 band: right x2 / wrong (alt ending 6)
 *   drift:     right (rejoin main) / wrong x2 (alt ending 3)
 */
export type OptionType =
  | 'strong' | 'mixed' | 'weak'
  | 'true' | 'doom' | 'detour'
  | 'right' | 'rash' | 'timid' | 'wrong';

export type Band = 'c1' | 'd45' | 'd68' | 'd910' | 'drift';

export interface StoryOption {
  id: string;
  label: string;
  type: OptionType;
  /** node id, ending id (starts with end_), or "@ch1" for the Chapter 1 score check */
  to: string;
  /** one line shown at the top of the next scene */
  aftermath: string;
}

export interface StoryNode {
  id: string;
  title: string;
  chapter: number;
  band: Band;
  scene: string;
  options: StoryOption[];
  /** each hint has one or more pre-generated phrasings; the server picks one per team */
  hints: Record<HintRoleKey, string[]>;
}

export interface StoryEnding {
  id: string;
  title: string;
  kind: 'alt' | 'true';
  text: string;
  debrief: string;
}

export interface Story {
  title: string;
  goal: string;
  intro: string;
  chapters: string[];
  start: string;
  nodes: Record<string, StoryNode>;
  endings: Record<string, StoryEnding>;
}
