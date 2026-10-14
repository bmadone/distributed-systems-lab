import { LESSONS } from '../../domain/curriculum/catalog';
import type { PageId } from '../../domain/curriculum/ids';

export const SPECIAL = {
  progress: { title: 'My progress', part: 'consol' },
  review: { title: 'Spaced review', part: 'consol' },
  exam: { title: 'Final exam', part: 'consol' },
} as const;
export type SpecialKey = keyof typeof SPECIAL;

export const pageTitle = (id: PageId): string =>
  id in SPECIAL ? SPECIAL[id as SpecialKey].title : LESSONS.find(l => l.id === id)?.title ?? '';

/** Reading order for previous/next navigation. */
export const PAGE_ORDER: readonly PageId[] = [...LESSONS.map(l => l.id), 'review', 'exam', 'progress'];

export const neighbour = (current: PageId, delta: 1 | -1): PageId | undefined => PAGE_ORDER[PAGE_ORDER.indexOf(current) + delta];
