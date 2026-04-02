// SPDX-License-Identifier: Apache-2.0
import { ExternalLink, Github, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COLAB_URL = 'https://colab.research.google.com/github/daviddiazsolis/association_rules_playground/blob/main/notebooks/03_clustering.ipynb';
const GH_URL    = 'https://github.com/daviddiazsolis/association_rules_playground/blob/main/notebooks/03_clustering.ipynb';

export function NotebooksSection() {
  const { t } = useLanguage();

  return (
    <section id="notebooks" className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-3">
        <BookOpen className="w-6 h-6 text-violet-400" />
        <h2 className="text-2xl font-bold text-zinc-100">{t('notebooksTitle')}</h2>
      </div>
      <p className="text-zinc-400 mb-6 text-sm">{t('notebooksSubtitle')}</p>

      <div className="rounded-xl border border-violet-500/30 hover:border-violet-500/60 bg-zinc-900/60 p-5 flex flex-col gap-4 transition-colors max-w-2xl">
        <div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300">
            03_clustering.ipynb
          </span>
          <h3 className="mt-3 text-base font-semibold text-zinc-100">{t('notebooksClustering')}</h3>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{t('notebooksClusteringDesc')}</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
          <a
            href={COLAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('notebooksOpenColab')}
          </a>
          <a
            href={GH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            {t('notebooksViewGitHub')}
          </a>
        </div>
      </div>
    </section>
  );
}
