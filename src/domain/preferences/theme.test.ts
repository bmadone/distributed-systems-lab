import { isTheme, nextTheme, resolveTheme, THEMES } from './theme';

describe('theme', () => {
  it('cycles through every theme and returns to the start', () => {
    expect(THEMES.reduce(t => nextTheme(t), 'system' as (typeof THEMES)[number])).toBe('system');
    expect([nextTheme('system'), nextTheme('light'), nextTheme('dark')]).toEqual(['light', 'dark', 'system']);
  });
  it('resolves "system" from the OS preference and leaves explicit choices alone', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
  it('recognises valid themes only', () => {
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('sepia')).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});
