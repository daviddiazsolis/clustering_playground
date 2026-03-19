import { Github, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 mt-24 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <p className="text-zinc-300 text-lg">
          {t('footerCreatedBy')} <strong className="text-zinc-100 font-bold">David Díaz Ph.D.</strong>
        </p>
        
        <p className="text-zinc-500 italic">
          {t('footerLiveCoded')}
        </p>
        
        <div className="flex justify-center items-center gap-8 pt-4">
          <a 
            href="https://daviddiazsolis.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
          >
            <Globe className="w-5 h-5" />
            <span>daviddiazsolis.com</span>
          </a>
          
          <a 
            href="https://github.com/daviddiazsolis" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
          >
            <Github className="w-5 h-5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
