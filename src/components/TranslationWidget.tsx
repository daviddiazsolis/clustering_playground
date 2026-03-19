import { useLanguage } from '../context/LanguageContext';

export function TranslationWidget() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Custom UI matching the image */}
      <div className="flex items-center bg-[#09090b] border border-zinc-800 rounded-xl p-1 shadow-lg">
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
