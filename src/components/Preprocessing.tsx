import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, SlidersHorizontal, Info, Layers, Maximize2, Scale, AlertTriangle, Zap, Code } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type Step = 'raw' | 'encoded' | 'scaled';
type EncodingStrategy = 'onehot' | 'mapping';
type ScalingStrategy = 'minmax' | 'zscore';

export function Preprocessing() {
  const [step, setStep] = useState<Step>('raw');
  const [encodingStrategy, setEncodingStrategy] = useState<EncodingStrategy>('mapping');
  const [scalingStrategy, setScalingStrategy] = useState<ScalingStrategy>('zscore');
  const { t } = useLanguage();

  const rawData = useMemo(() => [
    { id: 1, color: t('prepValRed'), status: t('prepValSingle'), city: 'New York', income: 45000, age: 22 },
    { id: 2, color: t('prepValBlue'), status: t('prepValMarried'), city: 'Los Angeles', income: 80000, age: 35 },
    { id: 3, color: t('prepValGreen'), status: t('prepValDivorced'), city: 'Chicago', income: 65000, age: 45 },
    { id: 4, color: 'Orange', status: t('prepValMarried'), city: 'Houston', income: 120000, age: 52 },
    { id: 5, color: 'Grey', status: t('prepValSingle'), city: 'Phoenix', income: 32000, age: 19 },
    { id: 6, color: 'Light Blue', status: t('prepValSingle'), city: 'Philadelphia', income: 55000, age: 28 },
    { id: 7, color: t('prepValRed'), status: t('prepValMarried'), city: 'San Antonio', income: 72000, age: 41 },
    { id: 8, color: t('prepValBlue'), status: t('prepValDivorced'), city: 'San Diego', income: 95000, age: 38 },
    { id: 9, color: 'Orange', status: t('prepValMarried'), city: 'Dallas', income: 110000, age: 49 },
    { id: 10, color: 'Grey', status: t('prepValSingle'), city: 'San Jose', income: 130000, age: 31 },
  ], [t]);

  const encodedData = useMemo(() => {
    const allColors = [t('prepValRed'), t('prepValBlue'), t('prepValGreen'), 'Orange', 'Grey', 'Light Blue'];
    const allStatuses = [t('prepValSingle'), t('prepValMarried'), t('prepValDivorced')];
    const allCities = Array.from(new Set(rawData.map(r => r.city))) as string[];

    return rawData.map(row => {
      if (encodingStrategy === 'mapping') {
        // Business Mapping: RGB Vectors, GPS Coordinates, Intensity
        const colorMap: Record<string, number[]> = { 
          [t('prepValRed')]: [255, 0, 0], 
          [t('prepValBlue')]: [0, 0, 255], 
          [t('prepValGreen')]: [0, 255, 0],
          'Orange': [255, 165, 0],
          'Grey': [128, 128, 128],
          'Light Blue': [173, 216, 230]
        };
        const statusMap: Record<string, number> = { [t('prepValSingle')]: 0, [t('prepValMarried')]: 100, [t('prepValDivorced')]: 50 };
        const cityMap: Record<string, number[]> = { 
          'New York': [40.71, -74.00], 'Los Angeles': [34.05, -118.24], 'Chicago': [41.87, -87.62], 
          'Houston': [29.76, -95.36], 'Phoenix': [33.44, -112.07], 'Philadelphia': [39.95, -75.16], 
          'San Antonio': [29.42, -98.49], 'San Diego': [32.71, -117.16], 'Dallas': [32.77, -96.79], 
          'San Jose': [37.33, -121.88] 
        };
        
        const rgb = colorMap[row.color] || [0, 0, 0];
        const gps = cityMap[row.city] || [0, 0];

        return {
          id: row.id,
          color_r: rgb[0],
          color_g: rgb[1],
          color_b: rgb[2],
          status_intensity: statusMap[row.status] || 0,
          city_lat: gps[0],
          city_lon: gps[1],
          income: row.income,
          age: row.age
        };
      } else {
        const newRow: any = { id: row.id };
        
        allColors.forEach(c => {
          newRow[`is_${c.toLowerCase().replace(' ', '_')}`] = row.color === c ? 1 : 0;
        });
        allStatuses.forEach(s => {
          newRow[`is_${s.toLowerCase()}`] = row.status === s ? 1 : 0;
        });
        allCities.forEach(city => {
          newRow[`is_${city.replace(' ', '_').toLowerCase()}`] = row.city === city ? 1 : 0;
        });
        
        newRow.income = row.income;
        newRow.age = row.age;
        return newRow;
      }
    });
  }, [rawData, encodingStrategy, t]);

  const scaledData = useMemo(() => {
    const getStats = (vals: number[]) => {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / vals.length) || 1;
      return { min, max, avg, std };
    };

    // Get all numeric keys from encoded data (excluding id)
    const keys = Object.keys(encodedData[0]).filter(k => k !== 'id');
    const stats: Record<string, any> = {};
    keys.forEach(key => {
      stats[key] = getStats(encodedData.map(d => d[key as keyof typeof d] as number));
    });

    return encodedData.map((row) => {
      const newRow: any = { id: row.id };

      const scale = (val: number, s: any) => {
        if (scalingStrategy === 'minmax') {
          return (val - s.min) / (s.max - s.min || 1);
        } else {
          return (val - s.avg) / s.std;
        }
      };

      keys.forEach(key => {
        newRow[key] = scale(row[key as keyof typeof row] as number, stats[key]).toFixed(2);
      });

      return newRow;
    });
  }, [encodedData, scalingStrategy]);

  const currentData = step === 'raw' ? rawData : step === 'encoded' ? encodedData : scaledData;
  
  const dimensions = useMemo(() => {
    if (currentData.length === 0) return 0;
    return Object.keys(currentData[0]).length - 1; // -1 for id
  }, [currentData]);

  const tableColumns = useMemo(() => {
    if (step === 'raw') {
      return [
        { key: 'id', label: t('prepColId') },
        { key: 'color', label: t('prepColColor') },
        { key: 'status', label: t('prepColStatus') },
        { key: 'city', label: t('prepColCity') },
        { key: 'income', label: t('prepColIncome') },
        { key: 'age', label: t('prepColAge') },
      ];
    } else {
      const cols = [{ key: 'id', label: t('prepColId') }];
      if (currentData.length > 0) {
        Object.keys(currentData[0]).forEach(key => {
          if (key !== 'id') {
            cols.push({ key, label: key });
          }
        });
      }
      return cols;
    }
  }, [step, currentData, t]);

  return (
    <section id="preprocessing" className="scroll-mt-24 space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('prepTitle')}</h2>
        <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
          {t('prepSubtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Conceptual Guide 1: Curse of Dimensionality */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4"
        >
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">{t('prepCurseTitle')}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {t('prepCurseDesc')}
          </p>
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">{t('prepDimCount')}</span>
              <span className={`font-mono font-bold ${dimensions > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {dimensions}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Conceptual Guide 2: Business Mapping */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4"
        >
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">{t('prepMappingTitle')}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {t('prepMappingDesc')}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 font-mono">NY → East</span>
            <span className={`px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 font-mono ${encodingStrategy === 'mapping' ? 'border border-emerald-500/50 text-emerald-400' : ''}`}>
              Red → [255,0,0]
            </span>
          </div>
        </motion.div>

        {/* Conceptual Guide 3: Scaling Methods */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4"
        >
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100">{t('prepScalingDeepTitle')}</h3>
          <div className="space-y-3">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <code className="text-xs text-emerald-400 font-mono">{t('prepMinMaxFormula')}</code>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <code className="text-xs text-blue-400 font-mono">{t('prepZScoreFormula')}</code>
            </div>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            {t('prepZScoreDesc')}
          </p>
        </motion.div>
      </div>

      <div className="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 p-8 bg-zinc-900/50 space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-100">
                <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                {t('prepSteps')}
              </h3>
              
              <div className="space-y-4 relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-zinc-800" />
                
                {[
                  { id: 'raw', icon: Database, title: t('prepRawTitle'), desc: t('prepRawDesc') },
                  { id: 'encoded', icon: Code, title: t('prepEncodedTitle'), desc: t('prepEncodedDesc') },
                  { id: 'scaled', icon: Maximize2, title: t('prepScaledTitle'), desc: t('prepScaledDesc') }
                ].map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id as Step)}
                    className={`w-full text-left p-4 rounded-xl relative z-10 transition-all ${
                      step === s.id ? 'bg-zinc-800 shadow-md border border-zinc-700' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        step === s.id ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className={`font-medium ${step === s.id ? 'text-emerald-400' : 'text-zinc-300'}`}>{s.title}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{s.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Toggles */}
            <AnimatePresence>
              {step !== 'raw' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-6 border-t border-zinc-800"
                >
                  {step === 'encoded' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('prepEncodedTitle')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setEncodingStrategy('onehot')}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${encodingStrategy === 'onehot' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                        >
                          {t('prepStrategyOneHot')}
                        </button>
                        <button 
                          onClick={() => setEncodingStrategy('mapping')}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${encodingStrategy === 'mapping' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                        >
                          {t('prepStrategyMapping')}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 'scaled' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('prepScalingDeepTitle')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setScalingStrategy('minmax')}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${scalingStrategy === 'minmax' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                        >
                          {t('prepStrategyMinMax')}
                        </button>
                        <button 
                          onClick={() => setScalingStrategy('zscore')}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${scalingStrategy === 'zscore' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                        >
                          {t('prepStrategyZScore')}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Data Table Panel */}
          <div className="lg:col-span-8 p-8 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
                <Database className="w-5 h-5 text-zinc-500" />
                {t('prepDataView')}
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-medium rounded-full uppercase tracking-wider">
                  {step === 'raw' ? t('prepRawBadge') : step === 'encoded' ? t('prepEncodedBadge') : t('prepScaledBadge')}
                </span>
                {step !== 'raw' && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wider ${step === 'encoded' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {step === 'encoded' ? encodingStrategy : scalingStrategy}
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800 max-w-full">
              <table className="w-full text-left text-sm min-w-max">
                <thead className="bg-zinc-900/50 text-zinc-400 font-medium border-b border-zinc-800">
                  <tr>
                    {tableColumns.map(col => (
                      <th key={col.key} className="px-6 py-4 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <motion.tbody
                    key={`${step}-${encodingStrategy}-${scalingStrategy}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="divide-y divide-zinc-800/50 bg-zinc-900"
                  >
                    {currentData.map((row: any) => (
                      <tr
                        key={row.id}
                        className="hover:bg-zinc-800/50 group"
                      >
                        {tableColumns.map(col => (
                          <td key={col.key} className="px-6 py-4 font-mono text-zinc-300 whitespace-nowrap">
                            {col.key === 'id' ? (
                              <span className="text-zinc-500">{row[col.key]}</span>
                            ) : col.key === 'color' || col.key === 'status' || col.key === 'city' ? (
                              <span className={`px-2 py-1 rounded text-xs transition-colors ${
                                step === 'raw' 
                                  ? col.key === 'color' 
                                    ? row[col.key] === t('prepValRed') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                      : row[col.key] === t('prepValBlue') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                      : row[col.key] === 'Orange' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                      : row[col.key] === 'Grey' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                      : row[col.key] === 'Light Blue' ? 'bg-sky-400/10 text-sky-400 border border-sky-400/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-zinc-800 text-zinc-300'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}>
                                {row[col.key]}
                              </span>
                            ) : col.key.startsWith('is_') ? (
                              <span className={`font-bold ${row[col.key] === 1 ? 'text-amber-400' : 'text-zinc-700'}`}>
                                {row[col.key]}
                              </span>
                            ) : (
                              <span className="tabular-nums">{row[col.key]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>

            <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1 text-blue-100">{t('prepInfoTitle')}</p>
                <p>
                  {t('prepInfoDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
