
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MoonIcon, SunIcon } from './Icons';

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};
