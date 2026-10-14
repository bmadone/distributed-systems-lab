import type { Clock, Random } from '../../application/ports';

export const systemClock: Clock = { now: () => Date.now() };
export const mathRandom: Random = { next: () => Math.random() };
