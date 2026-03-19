import { motion } from 'motion/react';
import { Target, Layers, Network, Move } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Theory() {
  const { t } = useLanguage();

  return (
    <section id="theory" className="scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('theoryTitle')}</h2>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800"
        >
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6 border border-blue-500/50">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-zinc-100">{t('kmeansTitle')}</h3>
          <p className="text-sm text-zinc-400 mb-4">
            {t('kmeansDesc')}
          </p>
          <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
            <li>{t('kmeansPoint1')}</li>
            <li>{t('kmeansPoint2')}</li>
            <li>{t('kmeansPoint3')}</li>
            <li>{t('kmeansPoint4')}</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800"
        >
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/50">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-zinc-100">{t('hierarchicalTitle')}</h3>
          <p className="text-sm text-zinc-400 mb-4">
            {t('hierarchicalDesc')}
          </p>
          <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
            <li>{t('hierarchicalPoint1')}</li>
            <li>{t('hierarchicalPoint2')}</li>
            <li>{t('hierarchicalPoint3')}</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800"
        >
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/50">
            <Network className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-zinc-100">{t('dbscanTitle')}</h3>
          <p className="text-sm text-zinc-400 mb-4">
            {t('dbscanDesc')}
          </p>
          <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
            <li>{t('dbscanPoint1')}</li>
            <li>{t('dbscanPoint2')}</li>
            <li>{t('dbscanPoint3')}</li>
            <li>{t('dbscanPoint4')}</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800"
        >
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6 border border-amber-500/50">
            <Move className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-zinc-100">{t('meanshiftTitle')}</h3>
          <p className="text-sm text-zinc-400 mb-4">
            {t('meanshiftDesc')}
          </p>
          <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
            <li>{t('meanshiftPoint1')}</li>
            <li>{t('meanshiftPoint2')}</li>
            <li>{t('meanshiftPoint3')}</li>
            <li>{t('meanshiftPoint4')}</li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
