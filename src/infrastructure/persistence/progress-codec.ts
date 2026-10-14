import type { ProgressCodec } from '../../application/ports';
import { fromParsed, progressSchema } from './progress-schema';

export const jsonProgressCodec: ProgressCodec = {
  encode: p => JSON.stringify(p, null, 2),
  decode: text => {
    try {
      const parsed = progressSchema.safeParse(JSON.parse(text));
      return parsed.success ? fromParsed(parsed.data) : null;
    } catch { return null; }
  },
};
