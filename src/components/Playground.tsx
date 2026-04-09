import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Settings2, AlertCircle, Timer, Activity, BarChart3, Info, HelpCircle, Box, Maximize2, Download, Shuffle, Lock } from 'lucide-react';
import { 
  generateBlobs, generateMoons, generateCircles, generateNoise, generateAniso, generateVaried, generate3DClouds,
  kMeans, dbscan, meanShift, calculateWCSS, calculateSilhouette, calculateDaviesBouldin, Point2D, Point3D, Point 
} from '../utils/clustering';
import { useLanguage } from '../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float } from '@react-three/drei';

type DatasetType = 'blobs' | 'moons' | 'circles' | 'aniso' | 'varied' | 'noise' | 'clusters3d';
type AlgorithmType = 'kmeans' | 'dbscan' | 'meanshift';

const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

export function Playground() {
  const { t } = useLanguage();
  const [datasetType, setDatasetType] = useState<DatasetType>('blobs');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('kmeans');
  const [numPoints, setNumPoints] = useState(300);
  
  // Params
  const [k, setK] = useState(3);
  const [eps, setEps] = useState(0.1);
  const [minPts, setMinPts] = useState(5);
  const [bandwidth, setBandwidth] = useState(0.1);
  const [fixedSeed, setFixedSeed] = useState(true);
  const [seedValue, setSeedValue] = useState(42);
  const [lastSeed, setLastSeed] = useState<number | null>(null);

  const [data, setData] = useState<Point[]>([]);
  const is3D = datasetType === 'clusters3d';

  const [assignments, setAssignments] = useState<number[]>([]);
  const [isClustered, setIsClustered] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<{ wcss: number; silhouette: number; dbIndex: number } | null>(null);
  const [evalData, setEvalData] = useState<{ k: number; wcss: number; silhouette: number; dbIndex: number }[]>([]);

  // Generate data
  useEffect(() => {
    let newData: Point[] = [];
    switch (datasetType) {
      case 'blobs': newData = generateBlobs(numPoints); break;
      case 'moons': newData = generateMoons(numPoints); break;
      case 'circles': newData = generateCircles(numPoints); break;
      case 'aniso': newData = generateAniso(numPoints); break;
      case 'varied': newData = generateVaried(numPoints); break;
      case 'noise': newData = generateNoise(numPoints); break;
      case 'clusters3d': newData = generate3DClouds(numPoints); break;
    }
    setData(newData);
    setAssignments(new Array(newData.length).fill(-1));
    setIsClustered(false);
    setExecutionTime(null);
    setMetrics(null);
    
    // Pre-calculate evaluation for K-Means if applicable
    if (algorithm === 'kmeans') {
      const results = [];
      for (let i = 1; i <= 10; i++) {
        const { assignments: clusterAssignments, centroids } = kMeans(newData, i, 100, 42);
        const wcss = calculateWCSS(newData, clusterAssignments, centroids);
        const silhouette = i > 1 ? calculateSilhouette(newData, clusterAssignments) : 0;
        const dbIndex = i > 1 ? calculateDaviesBouldin(newData, clusterAssignments, centroids) : 0;
        results.push({ k: i, wcss, silhouette, dbIndex });
      }
      setEvalData(results);
    }
  }, [datasetType, numPoints, algorithm]);

  const runClustering = () => {
    const start = performance.now();
    let res: number[] = [];
    let centroids: Point[] = [];

    if (algorithm === 'kmeans') {
      const actualSeed = fixedSeed ? seedValue : Math.floor(Math.random() * 100000);
      setLastSeed(actualSeed);
      const result = kMeans(data, k, 100, actualSeed);
      res = result.assignments;
      centroids = result.centroids;
    } else if (algorithm === 'dbscan') {
      res = dbscan(data, eps, minPts);
    } else if (algorithm === 'meanshift') {
      res = meanShift(data, bandwidth);
    }
    
    const end = performance.now();
    setExecutionTime(end - start);
    setAssignments(res);
    setIsClustered(true);

    // Calculate metrics for current run
    if (algorithm === 'kmeans') {
      const wcss = calculateWCSS(data, res, centroids);
      const silhouette = k > 1 ? calculateSilhouette(data, res) : 0;
      const dbIndex = k > 1 ? calculateDaviesBouldin(data, res, centroids) : 0;
      const currentMetrics = { wcss, silhouette, dbIndex };
      setMetrics(currentMetrics);

      // Update evalData to match current run for consistency
      setEvalData(prev => prev.map(item => 
        item.k === k ? { ...item, ...currentMetrics } : item
      ));
    } else {
      // For non-kmeans, silhouette is still useful if there are clusters
      const uniqueClusters = Array.from(new Set(res.filter(a => a >= 0)));
      if (uniqueClusters.length > 1) {
        // We need centroids for DB index, let's calculate them
        const clusterCentroids: Point[] = uniqueClusters.map(cId => {
          const clusterPoints = data.filter((_, idx) => res[idx] === cId);
          const dim = data[0].length;
          const sums = new Array(dim).fill(0);
          clusterPoints.forEach(p => {
            for (let d = 0; d < dim; d++) sums[d] += p[d];
          });
          return sums.map(s => s / clusterPoints.length);
        });
        setMetrics({ 
          wcss: calculateWCSS(data, res, clusterCentroids), 
          silhouette: calculateSilhouette(data, res),
          dbIndex: calculateDaviesBouldin(data, res, clusterCentroids)
        });
      } else {
        setMetrics(null);
      }
    }
  };

  const reset = () => {
    setAssignments(new Array(data.length).fill(-1));
    setIsClustered(false);
    setExecutionTime(null);
    setMetrics(null);
    setLastSeed(null);
  };

  return (
    <section id="playground" className="scroll-mt-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('playTitle')}</h2>
        <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
          {t('playSubtitle')}
        </p>
      </div>

      <div className="bg-zinc-900 rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 p-6 bg-zinc-900/50 space-y-8">
            
            {/* Dataset Selection */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">{t('playDataset')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['blobs', 'moons', 'circles', 'aniso', 'varied', 'noise', 'clusters3d'] as DatasetType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDatasetType(type)}
                    className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                      datasetType === type
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {type === 'clusters3d' && <Box className="w-3 h-3" />}
                    {type === 'clusters3d' ? '3D' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Points */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-zinc-400 font-medium">{t('playPoints')}</label>
                <span className="text-emerald-400 font-bold">{numPoints}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={numPoints}
                onChange={(e) => setNumPoints(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Algorithm Selection */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">{t('playAlgorithm')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['kmeans', 'dbscan', 'meanshift'] as AlgorithmType[]).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => { setAlgorithm(algo); setIsClustered(false); setAssignments(new Array(data.length).fill(-1)); setExecutionTime(null); setMetrics(null); }}
                    className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      algorithm === algo
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {algo === 'kmeans' ? 'K-Means' : algo === 'dbscan' ? 'DBSCAN' : 'Mean Shift'}
                  </button>
                ))}
              </div>
            </div>

            {/* Hyperparameters */}
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-zinc-400" />
                {t('playHyperparams')}
              </h3>
              
              {algorithm === 'kmeans' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <label className="text-zinc-400 font-medium">{t('playKLabel')}</label>
                      <span className="text-emerald-400 font-bold">{k}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={k}
                      onChange={(e) => setK(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 font-medium text-sm flex items-center gap-1.5 mb-2">
                      {fixedSeed ? <Lock className="w-3 h-3 text-amber-400" /> : <Shuffle className="w-3 h-3 text-emerald-400" />}
                      {t('playSeedLabel')}
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs font-medium mb-2">
                      <button
                        onClick={() => setFixedSeed(true)}
                        className={`flex-1 py-1.5 transition-colors ${fixedSeed ? 'bg-amber-500/20 text-amber-300 border-r border-zinc-700' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-r border-zinc-700'}`}
                      >
                        <Lock className="w-3 h-3 inline mr-1" />{t('playSeedFixed')}
                      </button>
                      <button
                        onClick={() => setFixedSeed(false)}
                        className={`flex-1 py-1.5 transition-colors ${!fixedSeed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        <Shuffle className="w-3 h-3 inline mr-1" />{t('playSeedRandom')}
                      </button>
                    </div>
                    {fixedSeed && (
                      <input
                        type="number"
                        min="0"
                        max="999999"
                        value={seedValue}
                        onChange={(e) => setSeedValue(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    )}
                    {!fixedSeed && isClustered && lastSeed !== null && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                        <Shuffle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-[11px] text-zinc-400">{t('playSeedUsed')}</span>
                        <span className="text-xs font-mono font-bold text-emerald-300 ml-auto">{lastSeed}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{t('playSeedTooltip')}</p>
                  </div>
                </div>
              )}

              {algorithm === 'dbscan' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <label className="text-zinc-400 font-medium">{t('playEpsLabel')}</label>
                      <span className="text-emerald-400 font-bold">{eps.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.3"
                      step="0.01"
                      value={eps}
                      onChange={(e) => setEps(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <label className="text-zinc-400 font-medium">{t('playMinPtsLabel')}</label>
                      <span className="text-emerald-400 font-bold">{minPts}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="1"
                      value={minPts}
                      onChange={(e) => setMinPts(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              )}

              {algorithm === 'meanshift' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <label className="text-zinc-400 font-medium">Bandwidth</label>
                      <span className="text-emerald-400 font-bold">{bandwidth.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={bandwidth}
                      onChange={(e) => setBandwidth(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={runClustering}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  {t('playRunBtn')}
                </button>
                <button
                  onClick={reset}
                  className="flex items-center justify-center p-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors shadow-sm"
                  title={t('playResetBtn')}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {executionTime !== null && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 bg-zinc-800/30 py-2 rounded-lg border border-zinc-800">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <span>Execution Time: <span className="text-emerald-400 font-mono font-bold">{executionTime.toFixed(2)}ms</span></span>
                </div>
              )}

              {isClustered && (
                <button
                  onClick={() => {
                    const dim = data[0]?.length ?? 2;
                    const headers = dim === 3
                      ? ['X', 'Y', 'Z', 'Cluster']
                      : ['X', 'Y', 'Cluster'];
                    const csvContent = [
                      headers.join(','),
                      ...data.map((point, idx) => [
                        ...point.map(v => v.toFixed(4)),
                        assignments[idx]
                      ].join(','))
                    ].join('\n');
                    const params =
                      algorithm === 'kmeans'
                        ? `k${k}_seed${lastSeed ?? seedValue}`
                        : algorithm === 'dbscan'
                        ? `eps${eps.toFixed(2)}_minPts${minPts}`
                        : `bw${bandwidth.toFixed(2)}`;
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', `${algorithm}_${datasetType}_${params}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors border border-zinc-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('playExportBtn')}
                </button>
              )}

              {isClustered && metrics && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{t('evalInertiaTitle')}</p>
                    <p className="text-blue-400 font-mono font-bold text-xs">{metrics.wcss.toFixed(1)}</p>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Sil.</p>
                    <p className="text-emerald-400 font-mono font-bold text-xs">{metrics.silhouette.toFixed(3)}</p>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">DB</p>
                    <p className="text-amber-400 font-mono font-bold text-xs">{metrics.dbIndex.toFixed(3)}</p>
                  </div>
                </div>
              )}
            </div>
            
            {algorithm === 'kmeans' && datasetType === 'noise' && isClustered && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2 text-sm text-amber-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <p>{t('playAlertNoise')}</p>
              </div>
            )}
            
            {algorithm === 'kmeans' && (datasetType === 'moons' || datasetType === 'circles') && isClustered && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2 text-sm text-amber-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <p>{t('playAlertShapes')}</p>
              </div>
            )}

          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-8 p-6 bg-zinc-950 flex flex-col items-center justify-center min-h-[500px] relative">
            <div className="w-full max-w-2xl aspect-square border border-zinc-800 rounded-2xl bg-zinc-900/50 shadow-inner relative overflow-hidden">
              {is3D ? (
                <div className="w-full h-full">
                  <Canvas dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[1.5, 1.5, 1.5]} fov={50} />
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} enableDamping />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <Suspense fallback={null}>
                      <group key={`data-${data.length}-${datasetType}`} position={[-0.5, -0.5, -0.5]}>
                        {/* Bounding Box — positioned at center of data range [0,1]³ */}
                        <mesh position={[0.5, 0.5, 0.5]}>
                          <boxGeometry args={[1, 1, 1]} />
                          <meshBasicMaterial color="#3f3f46" wireframe transparent opacity={0.15} />
                        </mesh>
                        {data.map((point, idx) => {
                          const clusterId = assignments[idx];
                          let color = '#71717a'; // zinc-400 for better visibility
                          if (clusterId === -2) color = '#ffffff';
                          else if (clusterId >= 0) color = COLORS[clusterId % COLORS.length];

                          return (
                            <mesh key={idx} position={[point[0], point[1], point[2]]}>
                              <sphereGeometry args={[0.015, 8, 8]} />
                              <meshStandardMaterial 
                                color={color} 
                                emissive={color}
                                emissiveIntensity={isClustered ? 0.6 : 0.3}
                              />
                            </mesh>
                          );
                        })}
                      </group>
                    </Suspense>
                  </Canvas>
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800 text-[10px] text-zinc-400">
                    <Maximize2 className="w-3 h-3" />
                    <span>Drag to rotate · Scroll to zoom</span>
                  </div>
                </div>
              ) : (
                <svg width="100%" height="100%" viewBox="0 0 1 1" className="overflow-visible">
                  {data.map((point, idx) => {
                    const clusterId = assignments[idx];
                    let fill = '#52525b'; // default unclustered (zinc-600)
                    
                    if (clusterId === -2) {
                      fill = '#ffffff'; // Noise in DBSCAN (white)
                    } else if (clusterId >= 0) {
                      fill = COLORS[clusterId % COLORS.length];
                    }

                    return (
                      <motion.circle
                        key={idx}
                        cx={point[0]}
                        cy={point[1]}
                        r={0.012}
                        fill={fill}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, fill }}
                        transition={{ 
                          scale: { duration: 0.3, delay: idx * 0.001 },
                          fill: { duration: 0.5 }
                        }}
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      />
                    );
                  })}
                </svg>
              )}
            </div>
            
            {is3D && (
              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 max-w-xl">
                <p className="text-xs text-emerald-200 leading-relaxed text-center italic">
                  {t('play3DNote')}
                </p>
              </div>
            )}
            
            {/* Real-time Evaluation Charts for K-Means */}
            {algorithm === 'kmeans' && evalData.length > 0 && isClustered && (
              <div className="w-full mt-8 grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{t('evalInertiaTitle')}</span>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={evalData}>
                        <defs>
                          <linearGradient id="colorWcss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="wcss" stroke="#3b82f6" fill="url(#colorWcss)" />
                        <Line type="monotone" dataKey="wcss" stroke="none" dot={(props: any) => {
                          if (props.payload.k === k) {
                            return <circle cx={props.cx} cy={props.cy} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />;
                          }
                          return null;
                        }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{t('evalSilTitle')}</span>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={evalData.filter(m => m.k > 1)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                        <YAxis domain={[0, 1]} stroke="#71717a" fontSize={8} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="silhouette" stroke="#10b981" strokeWidth={1.5} dot={(props: any) => {
                          if (props.payload.k === k) {
                            return <circle cx={props.cx} cy={props.cy} r={4} fill="#10b981" stroke="#fff" strokeWidth={1.5} />;
                          }
                          return <circle cx={props.cx} cy={props.cy} r={1.5} fill="#10b981" />;
                        }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{t('evalDbTitle')}</span>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={evalData.filter(m => m.k > 1)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="dbIndex" stroke="#f59e0b" strokeWidth={1.5} dot={(props: any) => {
                          if (props.payload.k === k) {
                            return <circle cx={props.cx} cy={props.cy} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />;
                          }
                          return <circle cx={props.cx} cy={props.cy} r={1.5} fill="#f59e0b" />;
                        }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            {isClustered && (
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
                {algorithm === 'dbscan' && assignments.includes(-2) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <span>{t('playLegendNoise')}</span>
                  </div>
                )}
                {Array.from(new Set<number>(assignments.filter(a => a >= 0))).sort((a,b)=>a-b).map(clusterId => (
                  <div key={clusterId} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[clusterId % COLORS.length] }}></div>
                    <span>{t('playLegendCluster')} {clusterId + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Comparison & Analysis */}
      <div className="mt-12 bg-zinc-900 rounded-3xl border border-zinc-800 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100">{t('evalComparisonTitle')}</h3>
            <p className="text-zinc-400">{t('evalComparisonDesc')}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Inertia */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">{t('evalInertiaTitle')}</h4>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{t('evalInertiaDesc')}</p>
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('evalWhenToUse')}</p>
                <p className="text-xs text-zinc-400">{t('evalInertiaWhen')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('evalAnalysis')}</p>
                <p className="text-sm text-zinc-400 leading-relaxed italic">{t('evalCompInertia')}</p>
              </div>
            </div>
          </div>

          {/* Silhouette */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">{t('evalSilTitle')}</h4>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{t('evalSilDesc')}</p>
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('evalWhenToUse')}</p>
                <p className="text-xs text-zinc-400">{t('evalSilWhen')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('evalAnalysis')}</p>
                <p className="text-sm text-zinc-400 leading-relaxed italic">{t('evalCompSil')}</p>
              </div>
            </div>
          </div>

          {/* Davies-Bouldin */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">{t('evalDbTitle')}</h4>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{t('evalDbDesc')}</p>
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('evalWhenToUse')}</p>
                <p className="text-xs text-zinc-400">{t('evalDbWhen')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('evalAnalysis')}</p>
                <p className="text-sm text-zinc-400 leading-relaxed italic">{t('evalCompDb')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
