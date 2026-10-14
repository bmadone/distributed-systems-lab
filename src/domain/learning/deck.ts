import { LESSONS } from '../curriculum/catalog';
import type { LessonId } from '../curriculum/ids';
import type { Card } from '../curriculum/types';
import type { Progress } from './progress';
import { isDue } from '../review/srs';

export interface DeckCard { readonly id: string; readonly lesson: LessonId; readonly lessonTitle: string; readonly front: Card[0]; readonly back: Card[1] }

export const ALL_CARDS: readonly DeckCard[] = LESSONS.flatMap(l => l.cards.map(([front, back], i) => ({ id: `${l.id}:${i}`, lesson: l.id, lessonTitle: l.title, front, back })));

/** Cards unlock when their lesson has been opened. */
export const unlockedCards = (p: Progress): readonly DeckCard[] => ALL_CARDS.filter(c => p.visited[c.lesson] !== undefined);
export const dueCards = (p: Progress, now: number): readonly DeckCard[] => unlockedCards(p).filter(c => isDue(p.cards[c.id], now));

