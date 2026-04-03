// SPDX-License-Identifier: Apache-2.0
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export function TranslationWidget() {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900/90 backdrop-blur border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Language toggle */}
      <div className="flex items-center bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-1">
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            lang === 'en'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang('es')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            lang === 'es'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ES
        </button>
      </div>
    </div>
  );
}
