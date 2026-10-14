// The single source of truth for course structure. Everything else is typed against these.

export const PARTS = [
  { id: 'sd', title: 'System design fundamentals' },
  { id: 'found', title: 'Distributed foundations' },
  { id: 'data', title: 'Distributing data' },
  { id: 'guar', title: 'Guarantees' },
  { id: 'agree', title: 'Agreement' },
  { id: 'time', title: 'Time & order' },
  { id: 'prac', title: 'In practice' },
  { id: 'consol', title: 'Consolidate' },
] as const;
export type PartId = (typeof PARTS)[number]['id'];

export const LESSON_IDS = [
  'sd-intro', 'sd-availability', 'sd-comm', 'sd-storage', 'sd-scaling', 'sd-observability', 'sd-security',
  'intro', 'fallacies', 'failures', 'delivery',
  'partitioning', 'replication', 'quorums',
  'cap', 'models', 'isolation',
  'commit', 'consensus',
  'clocks',
  'production', 'systems', 'sd-interview',
] as const;
export type LessonId = (typeof LESSON_IDS)[number];

export const SPECIAL_IDS = ['progress', 'review', 'exam'] as const;
export type SpecialId = (typeof SPECIAL_IDS)[number];
export type PageId = LessonId | SpecialId;

export const isLessonId = (s: string): s is LessonId => (LESSON_IDS as readonly string[]).includes(s);
export const isPageId = (s: string): s is PageId => isLessonId(s) || (SPECIAL_IDS as readonly string[]).includes(s);

export const SORTER_IDS = ['sl', 'dx', 'rq', 'cia', 'hj'] as const;
export type SorterId = (typeof SORTER_IDS)[number];
export const MATCHER_IDS = ['api', 'db', 'sc', 'th', 'mt'] as const;
export type MatcherId = (typeof MATCHER_IDS)[number];
