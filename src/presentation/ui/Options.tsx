import type { Rich as RichText } from '../../domain/curriculum/types';
import { seededShuffle } from '../../domain/shared-kernel/fp';
import { Rich } from './primitives';

const LETTERS = 'ABCDEFG';
const PINNED = /^(none|all|both|neither)\b/i;

/**
 * Display order for multiple-choice options: a stable shuffle per question so the answer isn't always
 * in the same slot. Ordered numeric scales stay in order, and "None / All of …" options stay last.
 */
export const optionOrder = (seed: string, opts: readonly string[]): readonly number[] => {
  const idx = opts.map((_, i) => i);
  if (opts.every(o => /\d/.test(o))) return idx;
  const pinned = idx.filter(i => PINNED.test(opts[i] ?? ''));
  return [...seededShuffle(seed, idx.filter(i => !pinned.includes(i))), ...pinned];
};

export const Options = ({ seed, opts, answer, pick, onPick }: {
  readonly seed: string; readonly opts: readonly RichText[]; readonly answer: number; readonly pick: number | undefined; readonly onPick: (i: number) => void;
}) => (
  <div className="opts">
    {optionOrder(seed, opts).map((i, pos) => {
      const cls = pick === undefined ? '' : i === answer ? 'right' : i === pick ? 'wrong' : '';
      return (
        <button key={i} type="button" className={`opt ${cls}`} aria-disabled={pick !== undefined} onClick={() => { if (pick === undefined) onPick(i); }}>
          <span className="k">{LETTERS[pos]}</span><Rich html={opts[i] ?? ''} />
        </button>
      );
    })}
  </div>
);
