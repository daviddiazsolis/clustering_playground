import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Table as TableIcon, Settings2, BarChart, 
  ArrowRight, Info, Database, Filter, CheckCircle2, Play,
  Activity, BarChart3, HelpCircle, Download
} from 'lucide-react';
import { kMeans, Point2D, calculateWCSS, calculateSilhouette, calculateDaviesBouldin } from '../utils/clustering';
import { useLanguage } from '../context/LanguageContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
  BarChart, Bar
} from 'recharts';

interface Customer {
  id: number;
  age: number;
  income: number;
  spendingScore: number;
  savings: number;
  status: string;
}

const STATUS_OPTIONS = ['Single', 'Married', 'Divorced'];

const MOCK_DATA: Customer[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  age: Math.floor(Math.random() * 50) + 18,
  income: Math.floor(Math.random() * 80000) + 20000,
  spendingScore: Math.floor(Math.random() * 100),
  savings: Math.floor(Math.random() * 100000),
  status: STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)],
}));

type ScalingType = 'none' | 'minmax' | 'standard';
type EncodingType = 'onehot' | 'mapping';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CustomerSegmentation() {
  const { t } = useLanguage();
  const [encodingStrategy, setEncodingStrategy] = useState<EncodingType>('mapping');
  const [statusMapping, setStatusMapping] = useState<Record<string, number>>({
    Single: 0,
    Married: 100,
    Divorced: 50,
  });
  const [scaling, setScaling] = useState<Record<string, ScalingType>>({
    age: 'none',
    income: 'none',
    spendingScore: 'none',
    savings: 'none',
    status_intensity: 'none',
    is_single: 'none',
    is_married: 'none',
    is_divorced: 'none',
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['income', 'spendingScore']);
  const [k, setK] = useState(3);
  const [results, setResults] = useState<{ assignments: number[], centroids: any[] } | null>(null);
  const [clusterNames, setClusterNames] = useState<string[]>(['Segment A', 'Segment B', 'Segment C', 'Segment D', 'Segment E', 'Segment F']);

  // Evaluation metrics
  const [metrics, setMetrics] = useState<{ wcss: number; silhouette: number; dbIndex: number } | null>(null);
  const [evalData, setEvalData] = useState<{ k: number; wcss: number; silhouette: number; dbIndex: number }[]>([]);

  const encodedData = useMemo(() => {
    return MOCK_DATA.map(row => {
      const newRow: any = { ...row };
      if (encodingStrategy === 'mapping') {
        newRow.status_intensity = statusMapping[row.status] ?? 0;
      } else {
        STATUS_OPTIONS.forEach(s => {
          newRow[`is_${s.toLowerCase()}`] = row.status === s ? 1 : 0;
        });
      }
      return newRow;
    });
  }, [encodingStrategy, statusMapping]);

  const availableFeatures = useMemo(() => {
    const base = ['age', 'income', 'spendingScore', 'savings'];
    if (encodingStrategy === 'mapping') {
      return [...base, 'status_intensity'];
    } else {
      return [...base, 'is_single', 'is_married', 'is_divorced'];
    }
  }, [encodingStrategy]);

  const processedData = useMemo(() => {
    const data = encodedData.map(c => ({ ...c }));
    
    availableFeatures.forEach(f => {
      const type = scaling[f] || 'none';
      if (type === 'none') return;

      const values = data.map(d => (d as any)[f]);
      if (type === 'minmax') {
        const min = Math.min(...values);
        const max = Math.max(...values);
        data.forEach(d => {
          (d as any)[f] = (max - min) === 0 ? 0 : ((d as any)[f] - min) / (max - min);
        });
      } else if (type === 'standard') {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length) || 1;
        data.forEach(d => {
          (d as any)[f] = (d as any)[f] = (d as any)[f] === undefined ? 0 : ((d as any)[f] - mean) / std;
        });
      }
    });

    return data;
  }, [encodedData, scaling, availableFeatures]);

  const processedFeatureColumns = useMemo(() => {
    const encodingCols = encodingStrategy === 'mapping'
      ? ['status_intensity']
      : ['is_single', 'is_married', 'is_divorced'];
    return ['age', 'income', 'spendingScore', 'savings', ...encodingCols];
  }, [encodingStrategy]);

  // Pre-calculate evaluation charts when data or features change
  useEffect(() => {
    const points: number[][] = processedData.map(d => selectedFeatures.map(f => (d as any)[f]));
    const results = [];
    for (let i = 2; i <= 8; i++) {
      const { assignments, centroids } = kMeans(points as any, i);
      const wcss = calculateWCSS(points as any, assignments, centroids as any);
      const silhouette = calculateSilhouette(points as any, assignments);
      const dbIndex = calculateDaviesBouldin(points as any, assignments, centroids as any);
      results.push({ k: i, wcss, silhouette, dbIndex });
    }
    setEvalData(results);
    setResults(null);
    setMetrics(null);
  }, [processedData, selectedFeatures]);

  const runSegmentation = () => {
    const points: number[][] = processedData.map(d => selectedFeatures.map(f => (d as any)[f]));
    const { assignments, centroids } = kMeans(points as any, k);
    setResults({ assignments, centroids });
    
    // Initialize cluster names if not enough
    if (clusterNames.length < k) {
      const newNames = [...clusterNames];
      for (let i = clusterNames.length; i < k; i++) {
        newNames.push(`Segment ${String.fromCharCode(65 + i)}`);
      }
      setClusterNames(newNames);
    }

    // Calculate metrics for current run
    const wcss = calculateWCSS(points as any, assignments, centroids as any);
    const silhouette = calculateSilhouette(points as any, assignments);
    const dbIndex = calculateDaviesBouldin(points as any, assignments, centroids as any);
    setMetrics({ wcss, silhouette, dbIndex });
  };

  const clusterStats = useMemo(() => {
    if (!results) return null;
    
    const featuresToStat = selectedFeatures;
    const stats = Array.from({ length: k }, () => {
      const obj: any = { count: 0 };
      featuresToStat.forEach(f => {
        obj[f] = { sum: 0, values: [], min: Infinity, max: -Infinity };
      });
      return obj;
    });

    results.assignments.forEach((clusterIdx, i) => {
      const row = encodedData[i];
      stats[clusterIdx].count++;
      featuresToStat.forEach(f => {
        const val = (row as any)[f];
        stats[clusterIdx][f].sum += val;
        stats[clusterIdx][f].values.push(val);
        if (val < stats[clusterIdx][f].min) stats[clusterIdx][f].min = val;
        if (val > stats[clusterIdx][f].max) stats[clusterIdx][f].max = val;
      });
    });

    return stats.map(s => {
      const final: any = { count: s.count };
      featuresToStat.forEach(f => {
        const avg = s.count ? s[f].sum / s.count : 0;
        const variance = s.count ? s[f].values.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / s.count : 0;
        final[f] = {
          avg: avg.toFixed(1),
          std: Math.sqrt(variance).toFixed(1),
          min: s[f].min === Infinity ? 0 : s[f].min.toFixed(1),
          max: s[f].max === -Infinity ? 0 : s[f].max.toFixed(1)
        };
      });
      return final;
    });
  }, [results, k, selectedFeatures, encodedData]);

  const finalResultsTable = useMemo(() => {
    if (!results) return [];
    return MOCK_DATA.map((row, i) => {
      const clusterIdx = results.assignments[i];
      const centroid = results.centroids[clusterIdx];
      const point = selectedFeatures.map(f => (processedData[i] as any)[f]);
      
      // Calculate distance to centroid
      const dist = Math.sqrt(point.reduce((sum, val, idx) => sum + Math.pow(val - centroid[idx], 2), 0));
      
      return {
        ...row,
        cluster: clusterIdx + 1,
        clusterName: clusterNames[clusterIdx] || `Segment ${clusterIdx + 1}`,
        distance: dist.toFixed(3)
      };
    });
  }, [results, processedData, selectedFeatures, clusterNames]);

  const anovaResults = useMemo(() => {
    if (!results) return [];
    const assignments = results.assignments;
    const N = encodedData.length;
    const K = Math.max(...assignments) + 1;
    const dfBetween = Math.max(1, K - 1);
    const dfWithin = Math.max(1, N - K);

    return selectedFeatures.map(f => {
      const values = encodedData.map(d => (d as any)[f] as number);
      const grandMean = values.reduce((a, b) => a + b, 0) / N;

      const clusterVals: number[][] = Array.from({ length: K }, () => []);
      assignments.forEach((k, i) => clusterVals[k].push(values[i]));

      let ssBetween = 0;
      let ssWithin = 0;
      clusterVals.forEach(vals => {
        if (vals.length === 0) return;
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        ssBetween += vals.length * Math.pow(mean - grandMean, 2);
        vals.forEach(v => { ssWithin += Math.pow(v - mean, 2); });
      });

      const msBetween = ssBetween / dfBetween;
      const msWithin = ssWithin / dfWithin;
      const f_stat = msWithin > 1e-12 ? msBetween / msWithin : 0;

      return {
        name: f.replace(/_/g, ' ').toUpperCase(),
        fStat: f_stat,
      };
    }).sort((a, b) => b.fStat - a.fStat);
  }, [results, selectedFeatures, encodedData]);

  return (
    <section id="segmentation" className="py-24 border-t border-zinc-800 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('segTitle')}</h2>
          <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
            {t('segSubtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              {t('segConfig')}
            </h3>

            <div className="space-y-6">
              {/* Encoding Strategy */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Nominal Encoding (Status)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setEncodingStrategy('mapping');
                      setSelectedFeatures(prev => prev.filter(f => !f.startsWith('is_')));
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      encodingStrategy === 'mapping'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    Business Mapping
                  </button>
                  <button
                    onClick={() => {
                      setEncodingStrategy('onehot');
                      setSelectedFeatures(prev => prev.filter(f => f !== 'status_intensity'));
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      encodingStrategy === 'onehot'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    One-Hot Encoding
                  </button>
                </div>

                {encodingStrategy === 'mapping' ? (
                  <div className="mt-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <p className="text-[9px] text-zinc-500 mb-2 leading-snug">
                      Each status is replaced by one numeric intensity in the new column <span className="text-emerald-400 font-mono">status_intensity</span>. Edit the values to change the mapping.
                    </p>
                    <div className="space-y-1.5">
                      {STATUS_OPTIONS.map(s => (
                        <div key={s} className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-zinc-300 font-medium">{s}</span>
                          <span className="text-zinc-600 text-[10px]">&rarr;</span>
                          <input
                            type="number"
                            value={statusMapping[s]}
                            onChange={(e) => setStatusMapping({
                              ...statusMapping,
                              [s]: parseFloat(e.target.value) || 0,
                            })}
                            className="w-20 bg-zinc-800 text-[10px] text-emerald-300 font-mono rounded px-2 py-1 border border-zinc-700 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <p className="text-[9px] text-zinc-500 mb-2 leading-snug">
                      The Status column is expanded into 3 binary columns (0/1). Select any of them as features below.
                    </p>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      {['is_single', 'is_married', 'is_divorced'].map(c => (
                        <div key={c} className="bg-zinc-800 text-amber-300 font-mono text-[9px] py-1 rounded border border-zinc-700">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">{t('segFeatures')}</label>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        if (selectedFeatures.includes(f)) {
                          if (selectedFeatures.length > 2) setSelectedFeatures(selectedFeatures.filter(sf => sf !== f));
                        } else {
                          setSelectedFeatures([...selectedFeatures, f]);
                        }
                      }}
                      className={`px-3 py-2 text-[10px] font-medium rounded-lg border transition-all ${
                        selectedFeatures.includes(f)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      {f.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scaling Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">{t('segScaling')}</label>
                <div className="space-y-2">
                  {selectedFeatures.map(f => (
                    <div key={f} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-300 font-medium truncate max-w-[120px]">{f.replace(/_/g, ' ')}</span>
                      <select 
                        value={scaling[f] || 'none'} 
                        onChange={(e) => setScaling({ ...scaling, [f]: e.target.value as ScalingType })}
                        className="bg-zinc-800 text-[10px] text-zinc-100 rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="minmax">Min-Max</option>
                        <option value="standard">Z-Score</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Algorithm Params */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-zinc-400 font-medium">{t('playKLabel')}</label>
                  <span className="text-blue-400 font-bold">{k}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value))}
                  className="w-full accent-blue-500 mb-6"
                />

                {/* Custom Naming */}
                <div className="space-y-3 mb-6">
                  <label className="text-xs font-bold text-zinc-500 uppercase block">{t('segCustomNames')}</label>
                  {Array.from({ length: k }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <input
                        type="text"
                        value={clusterNames[i] || ''}
                        onChange={(e) => {
                          const newNames = [...clusterNames];
                          newNames[i] = e.target.value;
                          setClusterNames(newNames);
                        }}
                        placeholder={`Segment ${String.fromCharCode(65 + i)}`}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={runSegmentation}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t('segRun')}
                </button>
              </div>

              {/* Real-time Metrics */}
              {metrics && (
                <>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-800">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                      <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">{t('evalInertiaTitle')}</p>
                      <p className="text-blue-400 font-mono font-bold text-xs">{metrics.wcss.toFixed(1)}</p>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                      <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Sil.</p>
                      <p className="text-emerald-400 font-mono font-bold text-xs">{metrics.silhouette.toFixed(3)}</p>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                      <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">DB</p>
                      <p className="text-amber-400 font-mono font-bold text-xs">{metrics.dbIndex.toFixed(3)}</p>
                    </div>
                  </div>

                </>
              )}
            </div>
          </div>
        </div>

        {/* Evaluation Charts & Results */}
        <div className="lg:col-span-8 space-y-8">
          {/* Raw Data Preview */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-zinc-500" />
                1. Raw Data
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">{MOCK_DATA.length} records · before encoding & scaling</span>
            </div>
            <div className="overflow-x-auto max-h-[260px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-500 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Age</th>
                    <th className="px-6 py-3 font-semibold">Income</th>
                    <th className="px-6 py-3 font-semibold">Spending</th>
                    <th className="px-6 py-3 font-semibold">Savings</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {MOCK_DATA.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 text-zinc-500">#{row.id}</td>
                      <td className="px-6 py-3 text-zinc-300">{row.age}</td>
                      <td className="px-6 py-3 text-zinc-300">${row.income.toLocaleString()}</td>
                      <td className="px-6 py-3 text-zinc-300">{row.spendingScore}</td>
                      <td className="px-6 py-3 text-zinc-300">${row.savings.toLocaleString()}</td>
                      <td className="px-6 py-3 text-zinc-300">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Processed Data */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-500" />
                2. Processed Data
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono border border-zinc-700">
                  encoding: {encodingStrategy === 'mapping' ? 'business mapping' : 'one-hot'}
                </span>
                {processedFeatureColumns.some(f => scaling[f] && scaling[f] !== 'none') && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-blue-300 font-mono border border-zinc-700">
                    scaling applied
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto max-h-[260px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    {processedFeatureColumns.map(f => {
                      const sc = scaling[f] || 'none';
                      return (
                        <th key={f} className="px-4 py-3 font-semibold">
                          <div className="text-zinc-400">{f}</div>
                          <div className="text-[8px] text-zinc-600 font-mono normal-case">
                            {sc === 'none' ? 'raw' : sc === 'minmax' ? 'min-max' : 'z-score'}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {processedData.map((row: any) => (
                    <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2 text-zinc-500">#{row.id}</td>
                      {processedFeatureColumns.map(f => (
                        <td key={f} className="px-4 py-2 text-zinc-300 font-mono">
                          {typeof row[f] === 'number'
                            ? (Number.isInteger(row[f]) ? row[f] : row[f].toFixed(3))
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evaluation Charts */}
          {evalData.length > 0 && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Model Evaluation Plots
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3">{t('evalInertiaTitle')}</p>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evalData}>
                        <defs>
                          <linearGradient id="colorWcssSeg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="wcss" stroke="#3b82f6" fill="url(#colorWcssSeg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3">{t('evalSilTitle')}</p>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                        <YAxis domain={[0, 1]} stroke="#71717a" fontSize={8} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="silhouette" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3">{t('evalDbTitle')}</p>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="dbIndex" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cluster Statistics */}
          {clusterStats && (
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase mb-1">Descriptive Statistics</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    These metrics provide a detailed profile of each segment on the original data scale. 
                    <span className="text-zinc-400 font-medium"> Average</span> shows the typical value, 
                    <span className="text-zinc-400 font-medium"> STD</span> indicates how varied the group is, and 
                    <span className="text-zinc-400 font-medium"> Min/Max</span> define the boundaries of the cluster.
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clusterStats.map((s, i) => (
                  <div key={i} className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <h4 className="font-bold text-zinc-100">Cluster {i + 1}</h4>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">{s.count} members</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedFeatures.map(f => (
                        <div key={f} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">{f.replace(/_/g, ' ')}</p>
                            <p className="text-zinc-200 font-bold text-xs">{s[f].avg}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[8px] text-zinc-500 font-mono">
                            <div><span className="text-zinc-600">STD:</span> {s[f].std}</div>
                            <div><span className="text-zinc-600">MIN:</span> {s[f].min}</div>
                            <div><span className="text-zinc-600">MAX:</span> {s[f].max}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parallel Coordinates - Center Stage */}
          {results && (
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-start gap-3">
                <BarChart className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase mb-1">Parallel Coordinates Analysis</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    This plot visualizes the "DNA" of each cluster across all dimensions simultaneously. 
                    Each vertical line is a feature, and each colored line represents a cluster's centroid. 
                    <span className="text-zinc-400 font-medium"> Crossing lines</span> indicate inverse relationships between features for specific segments.
                  </p>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-8 flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  Cluster Profile DNA (Parallel Coordinates)
                </h3>
                <div className="h-[400px] w-full">
                  <InteractiveParallelCoordinates 
                    centroids={results.centroids} 
                    features={selectedFeatures} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Centroids & Feature Importance */}
          {results && (
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Centroid Table */}
              <div className="lg:col-span-7 bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-400" />
                    {t('segCentroids')}
                  </h3>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-zinc-600 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                      Centroids represent the mathematical "center" of each cluster. These values are on the processed scale (scaled/encoded) and are used by the algorithm to define segment boundaries.
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-zinc-500 border-b border-zinc-800">
                      <tr>
                        <th className="pb-4 px-4">{t('playLegendCluster')}</th>
                        {selectedFeatures.map(f => (
                          <th key={f} className="pb-4 px-4 font-semibold uppercase tracking-wider text-[10px]">
                            {f.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {results.centroids.map((c, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                            {clusterNames[i] || `Segment ${String.fromCharCode(65 + i)}`}
                          </td>
                          {c.map((val: number, idx: number) => (
                            <td key={idx} className="py-4 px-4 text-zinc-400 font-mono">
                              {val.toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feature Importance Chart */}
              <div className="lg:col-span-5 bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  ANOVA F-statistic per Feature
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anovaResults} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#71717a" fontSize={9} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#71717a"
                        fontSize={9}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        labelStyle={{ color: '#a1a1aa', fontSize: '10px' }}
                        formatter={(value: any) => [Number(value).toFixed(2), 'F']}
                      />
                      <Bar dataKey="fStat" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-[10px] text-zinc-500 leading-relaxed italic">
                  One-way ANOVA computed per feature on the original (encoded) scale, using cluster membership as the grouping factor. Higher F = the feature differs more between clusters than within them — i.e. it drives the separation.
                </p>
              </div>
            </div>
          )}

          {/* Final Results Table */}
          {results && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-zinc-500" />
                  3. Clustering Results (Original Data + Cluster Labels)
                </h3>
                <button
                  onClick={() => {
                    const headers = ['ID', 'Age', 'Income', 'SpendingScore', 'Savings', 'Status', 'Cluster', 'SegmentName', 'Distance'];
                    const csvContent = [
                      headers.join(','),
                      ...finalResultsTable.map(row => [
                        row.id,
                        row.age,
                        row.income,
                        row.spendingScore,
                        row.savings,
                        row.status,
                        row.cluster,
                        `"${row.clusterName}"`,
                        row.distance
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', 'clustering_results.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors border border-zinc-700"
                >
                  <Download className="w-3 h-3" />
                  {t('segExport')}
                </button>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-semibold">ID</th>
                      <th className="px-6 py-3 font-semibold">Age</th>
                      <th className="px-6 py-3 font-semibold">Income</th>
                      <th className="px-6 py-3 font-semibold">Spending</th>
                      <th className="px-6 py-3 font-semibold">Savings</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-blue-400">Cluster</th>
                      <th className="px-6 py-3 font-semibold text-blue-400">Segment Name</th>
                      <th className="px-6 py-3 font-semibold text-emerald-400">Dist. to Centroid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {finalResultsTable.map((row: any) => (
                      <tr key={row.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-3 text-zinc-500">#{row.id}</td>
                        <td className="px-6 py-3 text-zinc-300">{row.age}</td>
                        <td className="px-6 py-3 text-zinc-300">${row.income.toLocaleString()}</td>
                        <td className="px-6 py-3 text-zinc-300">{row.spendingScore}</td>
                        <td className="px-6 py-3 text-zinc-300">${row.savings.toLocaleString()}</td>
                        <td className="px-6 py-3 text-zinc-300">{row.status}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${COLORS[(row.cluster-1) % COLORS.length]}20`, color: COLORS[(row.cluster-1) % COLORS.length] }}>
                            C{row.cluster}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-zinc-400 italic text-xs">{row.clusterName}</td>
                        <td className="px-6 py-3 text-emerald-400 font-mono text-xs">{row.distance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
);
}

function InteractiveParallelCoordinates({ centroids, features }: { centroids: number[][], features: string[] }) {
  const chartData = useMemo(() => {
    return features.map((f, featureIdx) => {
      const entry: any = { name: f.replace(/_/g, ' ').toUpperCase() };
      centroids.forEach((c, clusterIdx) => {
        // Normalize value for plotting (0 to 1)
        const vals = centroids.map(cent => cent[featureIdx]);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const normalized = (max - min) === 0 ? 0.5 : (c[featureIdx] - min) / (max - min);
        entry[`cluster${clusterIdx + 1}`] = normalized;
        entry[`cluster${clusterIdx + 1}_raw`] = c[featureIdx];
      });
      return entry;
    });
  }, [centroids, features]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={true} horizontal={false} />
        <XAxis 
          dataKey="name" 
          stroke="#71717a" 
          fontSize={10} 
          tick={{ fill: '#71717a', fontWeight: 'bold' }}
        />
        <YAxis hide domain={[0, 1]} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
          itemStyle={{ fontSize: '11px', padding: '2px 0' }}
          formatter={(value: any, name: string, props: any) => {
            const clusterNum = name.replace('cluster', '');
            const rawValue = props.payload[`cluster${clusterNum}_raw`];
            return [`Value: ${rawValue.toFixed(3)}`, `Cluster ${clusterNum}`];
          }}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
          formatter={(value) => <span className="text-xs text-zinc-400 font-medium">{value.replace('cluster', 'Cluster ')}</span>}
        />
        {centroids.map((_, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={`cluster${i + 1}`}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#18181b' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1000}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
