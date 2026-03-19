import { motion } from 'motion/react';
import { Users, ShieldAlert, TrendingUp, Search, Database, FileText, Layers, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function BusinessApplications() {
  const { t } = useLanguage();

  return (
    <section id="business" className="scroll-mt-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('bizTitle')}</h2>
        <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
          {t('bizSubtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Customer Segmentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6 hover:border-emerald-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">{t('bizSegmentationTitle')}</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              {t('bizSegmentationDesc')}
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-zinc-300 italic">
                {t('bizSegmentationExample')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Outlier Detection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6 hover:border-amber-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:bg-amber-500/20 transition-colors">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">{t('bizOutlierTitle')}</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              {t('bizOutlierDesc')}
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex gap-3">
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-zinc-300 italic">
                {t('bizOutlierExample')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Image Compression */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6 hover:border-blue-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
              <Layers className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">{t('bizCompressionTitle')}</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              {t('bizCompressionDesc')}
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex gap-3">
              <Database className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-zinc-300 italic">
                {t('bizCompressionExample')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Document Clustering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6 hover:border-violet-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 rounded-2xl group-hover:bg-violet-500/20 transition-colors">
              <FileText className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">{t('bizDocsTitle')}</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              {t('bizDocsDesc')}
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex gap-3">
              <Target className="w-5 h-5 text-violet-500 shrink-0" />
              <p className="text-sm text-zinc-300 italic">
                {t('bizDocsExample')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Genomic Data Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6 hover:border-rose-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:bg-rose-500/20 transition-colors">
              <Database className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">{t('bizGenomicsTitle')}</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              {t('bizGenomicsDesc')}
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex gap-3">
              <Search className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-zinc-300 italic">
                {t('bizGenomicsExample')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Urban Planning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6 hover:border-teal-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 rounded-2xl group-hover:bg-teal-500/20 transition-colors">
              <Layers className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">{t('bizUrbanTitle')}</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed">
              {t('bizUrbanDesc')}
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex gap-3">
              <Target className="w-5 h-5 text-teal-500 shrink-0" />
              <p className="text-sm text-zinc-300 italic">
                {t('bizUrbanExample')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
