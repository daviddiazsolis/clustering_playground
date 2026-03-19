import { useLanguage } from '../context/LanguageContext';

export function References() {
  const { t } = useLanguage();

  return (
    <section id="references" className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">{t('refTitle')}</h2>
      <ul className="list-disc list-inside space-y-3 text-zinc-400 marker:text-zinc-600">
        <li>
          {t('refBook1')}
        </li>
        <li>
          <a 
            href="https://scikit-learn.org/stable/modules/clustering.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {t('refLink1')}
          </a>
        </li>
        <li>
          <a 
            href="https://playground.tensorflow.org/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {t('refLink2')}
          </a>
        </li>
        <li>
          <a 
            href="https://www.naftaliharris.com/blog/visualizing-k-means-clustering/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {t('refLink3')}
          </a>
        </li>
        <li>
          <a 
            href="https://www.naftaliharris.com/blog/visualizing-dbscan-clustering/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {t('refLink4')}
          </a>
        </li>
        <li>
          <a 
            href="https://hdbscan.readthedocs.io/en/latest/how_hdbscan_works.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {t('refLink5')}
          </a>
        </li>
      </ul>
    </section>
  );
}
