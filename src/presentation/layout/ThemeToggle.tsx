import { THEMES, THEME_LABELS } from '../../domain/preferences/theme';
import { useTheme } from '../hooks/theme';
import { Seg } from '../ui/primitives';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="themetoggle">
      <span className="eyebrow">Theme</span>
      <Seg label="Colour theme" value={theme} onChange={setTheme} options={THEMES.map(t => ({ value: t, label: THEME_LABELS[t] }))} />
    </div>
  );
};
