// Leitner-box spaced repetition, as pure functions of (card state, answer, time).

export const BOX_DAYS = [0, 1, 3, 7, 14] as const;
export type Box = 0 | 1 | 2 | 3 | 4;
export interface CardState { readonly box: Box; readonly due: number }

const DAY = 86_400_000;
const RETRY_MS = 60_000;

export const nextBox = (box: Box): Box => (box < 4 ? ((box + 1) as Box) : 4);

/** Got it: move up one box and wait that box's interval. Missed: back to box 1, due again in a minute. */
export const grade = (prev: CardState | undefined, ok: boolean, now: number): CardState => {
  if (!ok) return { box: 0, due: now + RETRY_MS };
  const box = nextBox(prev?.box ?? 0);
  return { box, due: now + BOX_DAYS[box] * DAY };
};

export const isDue = (s: CardState | undefined, now: number): boolean => s === undefined || s.due <= now;
