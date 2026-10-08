import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

// New key on purpose: the old 'theme' entry was polluted by the previous
// passive-persist bug (it saved 'dark' on every first load), so we ignore it
// and let everyone start fresh following the system.
const STORAGE_KEY = 'theme-v2';

const getSavedTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'dark' || saved === 'light' ? saved : null;
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useTheme = () => {
  // Lazy init: saved choice wins; otherwise FOLLOW THE SYSTEM. (The old code
  // started from 'dark' and immediately persisted it, permanently overriding
  // the system preference after the very first load.)
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() ?? getSystemTheme());

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow live system theme changes until the user makes an explicit choice.
  useEffect(() => {
    if (getSavedTheme()) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Persist ONLY on explicit user action — never passively, so the default
  // keeps following the system.
  const choose = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setDarkTheme = useCallback(() => choose('dark'), [choose]);
  const setLightTheme = useCallback(() => choose('light'), [choose]);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setDarkTheme,
    setLightTheme,
  };
};
