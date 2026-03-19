import { motion } from 'motion/react';
import { HelpCircle, CheckCircle2, FlaskConical } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Activities() {
  const { t } = useLanguage();

  return (
    <section id="activities" className="scroll-mt-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('actTitle')}</h2>
        <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
          {t('actSubtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800"
        >
          <h3 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-500" />
            {t('actExpTitle')}
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-zinc-100">{t('actExp1Title')}</strong> {t('actExp1Desc')}
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-zinc-100">{t('actExp2Title')}</strong> {t('actExp2Desc')}
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-zinc-100">{t('actExp3Title')}</strong> {t('actExp3Desc')}
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-zinc-100">{t('actExp4Title')}</strong> {t('actExp4Desc')}
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-zinc-100">{t('actExp5Title')}</strong> {t('actExp5Desc')}
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-zinc-100">{t('actExp6Title')}</strong> {t('actExp6Desc')}
              </span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-sm"
        >
          <h3 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-zinc-400" />
            {t('actQTitle')}
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-zinc-100 mb-2">{t('actQ1Title')}</h4>
              <p className="text-zinc-400 text-sm">
                {t('actQ1Desc')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100 mb-2">{t('actQ2Title')}</h4>
              <p className="text-zinc-400 text-sm">
                {t('actQ2Desc')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100 mb-2">{t('actQ3Title')}</h4>
              <p className="text-zinc-400 text-sm">
                {t('actQ3Desc')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100 mb-2">{t('actQ4Title')}</h4>
              <p className="text-zinc-400 text-sm">
                {t('actQ4Desc')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100 mb-2">{t('actQ5Title')}</h4>
              <p className="text-zinc-400 text-sm">
                {t('actQ5Desc')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
