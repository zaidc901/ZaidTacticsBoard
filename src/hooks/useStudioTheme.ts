import { useTacticsStore } from '../store/tacticsStore';

// Keep the chosen appearance across the home page and editors, using the
// board's saved theme and its existing pitch palettes.
export function useStudioTheme() {
  const dark = useTacticsStore(state => state.project.settings.theme === 'dark');
  const updateSettings = useTacticsStore(state => state.updateSettings);
  const toggleTheme = () => updateSettings({
    theme: dark ? 'portfolio-light' : 'dark',
    backgroundColor: dark ? '#edf7ef' : '#071b12',
    grassColor: dark ? '#69a873' : '#2f7a4f',
    lineColor: '#f8fafc',
  });
  return { dark, toggleTheme };
}
