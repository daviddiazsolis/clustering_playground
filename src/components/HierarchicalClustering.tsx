import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { GitBranch, Layers, Play, Settings2, Activity, BarChart3, Info, Download, HelpCircle } from 'lucide-react';
import { 
  generateBlobs, generateMoons, generateCircles, generateAniso, generateVaried, generateNoise,
  agglomerativeClustering, getClustersFromDendrogram, calculateWCSS, calculateSilhouette, calculateDaviesBouldin,
  DendrogramNode, Point2D 
} from '../utils/clustering';
import { useLanguage } from '../context/LanguageContext';
import * as d3 from 'd3';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

type DatasetType = 'blobs' | 'moons' | 'circles' | 'aniso' | 'varied' | 'noise';

export function HierarchicalClustering() {
  const { t } = useLanguage();
  const [datasetType, setDatasetType] = useState<DatasetType>('blobs');
  const [numPoints, setNumPoints] = useState(50);
  const [data, setData] = useState<Point2D[]>([]);
  const [root, setRoot] = useState<DendrogramNode | null>(null);
  const [k, setK] = useState(3);
  const [assignments, setAssignments] = useState<number[]>([]);

  // Evaluation metrics for current k
  const [metrics, setMetrics] = useState<{ wcss: number; silhouette: number; dbIndex: number } | null>(null);

  // Evaluation data for Elbow/Silhouette charts
  const [evalData, setEvalData] = useState<{ k: number; wcss: number; silhouette: number; dbIndex: number }[]>([]);

  useEffect(() => {
    let newData: Point2D[] = [];
    switch (datasetType) {
      case 'blobs': newData = generateBlobs(numPoints); break;
      case 'moons': newData = generateMoons(numPoints); break;
      case 'circles': newData = generateCircles(numPoints); break;
      case 'aniso': newData = generateAniso(numPoints); break;
      case 'varied': newData = generateVaried(numPoints); break;
      case 'noise': newData = generateNoise(numPoints); break;
    }
    setData(newData);
    const dendrogram = agglomerativeClustering(newData);
    setRoot(dendrogram);
    setAssignments(new Array(numPoints).fill(-1));
    
    // Pre-calculate evaluation data for charts
    const results = [];
    for (let i = 1; i <= 10; i++) {
      const clusterAssignments = getClustersFromDendrogram(dendrogram, i, newData.length);
      // Calculate centroids for WCSS
      const centroids: Point2D[] = [];
      for (let j = 0; j < i; j++) {
        const clusterPoints = newData.filter((_, idx) => clusterAssignments[idx] === j);
        if (clusterPoints.length > 0) {
          const meanX = clusterPoints.reduce((sum, p) => sum + p[0], 0) / clusterPoints.length;
          const meanY = clusterPoints.reduce((sum, p) => sum + p[1], 0) / clusterPoints.length;
          centroids.push([meanX, meanY]);
        } else {
          centroids.push([0, 0]);
        }
      }
      const wcss = calculateWCSS(newData, clusterAssignments, centroids);
      const silhouette = i > 1 ? calculateSilhouette(newData, clusterAssignments) : 0;
      const dbIndex = i > 1 ? calculateDaviesBouldin(newData, clusterAssignments, centroids) : 0;
      results.push({ k: i, wcss, silhouette, dbIndex });
    }
    setEvalData(results);
  }, [datasetType, numPoints]);

  useEffect(() => {
    if (root) {
      const res = getClustersFromDendrogram(root, k, data.length);
      setAssignments(res);

      // Calculate current metrics
      const centroids: Point2D[] = [];
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, idx) => res[idx] === j);
        if (clusterPoints.length > 0) {
          const meanX = clusterPoints.reduce((sum, p) => sum + p[0], 0) / clusterPoints.length;
          const meanY = clusterPoints.reduce((sum, p) => sum + p[1], 0) / clusterPoints.length;
          centroids.push([meanX, meanY]);
        } else {
          centroids.push([0, 0]);
        }
      }
      const wcss = calculateWCSS(data, res, centroids);
      const silhouette = k > 1 ? calculateSilhouette(data, res) : 0;
      const dbIndex = k > 1 ? calculateDaviesBouldin(data, res, centroids) : 0;
      setMetrics({ wcss, silhouette, dbIndex });
    }
  }, [root, k, data.length]);

  const dendrogramData = useMemo(() => {
    if (!root) return null;
    
    const convert = (node: DendrogramNode): any => {
      if (!node.left || !node.right) {
        return { name: `P${node.pointIdx}`, id: node.id };
      }
      return {
        id: node.id,
        children: [convert(node.left), convert(node.right)],
        distance: node.distance
      };
    };
    
    return d3.hierarchy(convert(root));
  }, [root]);

  return (
    <section id="hierarchical" className="py-24 scroll-mt-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">{t('hacTitle')}</h2>
        <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
          {t('hacSubtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              {t('playHyperparams')}
            </h3>

            <div className="space-y-6">
              {/* Dataset Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">{t('playDataset')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['blobs', 'moons', 'circles', 'aniso', 'varied', 'noise'] as DatasetType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDatasetType(type)}
                      className={`px-2 py-2 text-[10px] font-medium rounded-lg border transition-colors ${
                        datasetType === type
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Points */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-zinc-400 font-medium">{t('playPoints')}</label>
                  <span className="text-blue-400 font-bold">{numPoints}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="10"
                  value={numPoints}
                  onChange={(e) => setNumPoints(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">{t('playPointsDesc')}</p>
              </div>

              {/* K Clusters */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-zinc-400 font-medium">{t('hacKLabel')}</label>
                  <span className="text-blue-400 font-bold">{k}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Real-time Metrics */}
              {metrics && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{t('evalInertiaTitle')}</span>
                    <span className="text-blue-400 font-mono font-bold">{metrics.wcss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Sil.</span>
                    <span className="text-emerald-400 font-mono font-bold">{metrics.silhouette.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">DB</span>
                    <span className="text-amber-400 font-mono font-bold">{metrics.dbIndex.toFixed(3)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('hacSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Dendrogram */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 flex flex-col h-[400px]">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                {t('hacDendrogram')}
              </h3>
              <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative group">
                {dendrogramData && (
                  <DendrogramPlot 
                    data={dendrogramData} 
                    width={400} 
                    height={300} 
                    k={k}
                    onSetK={setK}
                  />
                )}
                <div className="absolute top-2 right-2 bg-zinc-900/80 backdrop-blur px-2 py-1 rounded border border-zinc-800 text-[8px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Click branches to set K
                </div>
              </div>
            </div>

            {/* Cluster Map */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {t('hacMap')}
                </h3>
                <button
                  onClick={() => {
                    const headers = ['X', 'Y', 'Cluster'];
                    const csvContent = [
                      headers.join(','),
                      ...data.map((point, idx) => [
                        point[0].toFixed(4),
                        point[1].toFixed(4),
                        assignments[idx]
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', 'hierarchical_results.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[10px] font-bold transition-colors border border-zinc-700"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
              <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 1 1" className="overflow-visible">
                  {data.map((point, idx) => (
                    <motion.circle
                      key={idx}
                      cx={point[0]}
                      cy={point[1]}
                      r={0.015}
                      fill={assignments[idx] >= 0 ? COLORS[assignments[idx] % COLORS.length] : '#52525b'}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.005 }}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Integrated Evaluation Charts */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Elbow Method */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider">{t('evalInertiaTitle')}</h3>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={evalData}>
                    <defs>
                      <linearGradient id="colorWcssHac" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="wcss" stroke="#3b82f6" fill="url(#colorWcssHac)" />
                    {/* Highlight current k */}
                    <Line type="monotone" dataKey="wcss" stroke="none" dot={(props: any) => {
                      if (props.payload.k === k) {
                        return <circle cx={props.cx} cy={props.cy} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />;
                      }
                      return null;
                    }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Silhouette Score */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider">{t('evalSilTitle')}</h3>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={evalData.filter(m => m.k > 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                    <YAxis domain={[0, 1]} stroke="#71717a" fontSize={8} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="silhouette" stroke="#10b981" strokeWidth={1.5} dot={(props: any) => {
                      if (props.payload.k === k) {
                        return <circle cx={props.cx} cy={props.cy} r={5} fill="#10b981" stroke="#fff" strokeWidth={1.5} />;
                      }
                      return <circle cx={props.cx} cy={props.cy} r={2} fill="#10b981" />;
                    }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DB Index */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider">{t('evalDbTitle')}</h3>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={evalData.filter(m => m.k > 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="k" stroke="#71717a" fontSize={8} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="dbIndex" stroke="#f59e0b" strokeWidth={1.5} dot={(props: any) => {
                      if (props.payload.k === k) {
                        return <circle cx={props.cx} cy={props.cy} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />;
                      }
                      return <circle cx={props.cx} cy={props.cy} r={2} fill="#f59e0b" />;
                    }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DendrogramPlot({ data, width, height, k, onSetK }: { data: d3.HierarchyNode<any>, width: number, height: number, k: number, onSetK: (k: number) => void }) {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const cluster = d3.cluster().size([innerWidth, innerHeight]);
  const root = cluster(data);

  // Root is at y=0 (top), leaves at y=innerHeight (bottom).
  // Higher cut (small y, near root) = fewer clusters; lower cut = more clusters.
  const cutY = innerHeight * (k - 1) / 10;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const y = e.clientY - rect.top - margin.top;

    if (y > 0 && y < innerHeight) {
      // y near 0 (top/root) → k=1; y near innerHeight (bottom/leaves) → k=10
      const newK = Math.max(1, Math.min(10, Math.round(1 + (y / innerHeight) * 9)));
      onSetK(newK);
    }
  };

  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox={`0 0 ${width} ${height}`} 
      className="overflow-visible cursor-crosshair"
      onClick={handleSvgClick}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Cut Line */}
        <line 
          x1={0} 
          x2={innerWidth} 
          y1={cutY} 
          y2={cutY} 
          stroke="#3b82f6" 
          strokeWidth="2" 
          strokeDasharray="4 4"
          className="transition-all duration-300"
        />
        <text
          x={innerWidth - 4}
          y={cutY - 5}
          fill="#3b82f6"
          fontSize="10"
          fontWeight="bold"
          textAnchor="end"
        >
          K={k}
        </text>

        {/* Links */}
        {root.links().map((link, i) => (
          <path
            key={i}
            d={d3.linkVertical()
              .x((d: any) => d.x)
              .y((d: any) => d.y)(link as any) || ''}
            fill="none"
            stroke={link.target.y > cutY ? "#3b82f6" : "#3f3f46"}
            strokeWidth={link.target.y > cutY ? "2" : "1.5"}
            className="transition-all duration-300"
          />
        ))}
        {/* Nodes */}
        {root.descendants().map((node, i) => (
          <g key={i} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              r={node.children ? 3 : 2}
              fill={node.y > cutY ? '#3b82f6' : (node.children ? '#71717a' : '#3b82f6')}
              className="transition-all duration-300"
            />
            {!node.children && (
              <text
                dy="0.31em"
                y={10}
                textAnchor="middle"
                fontSize="6"
                fill="#71717a"
                transform="rotate(45)"
              >
                {(node.data as any).name}
              </text>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

