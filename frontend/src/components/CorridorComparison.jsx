import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Scale, 
  TrendingUp, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import api from '../services/api';

const CORRIDOR_COLORS = [
  { stroke: '#06b6d4', fill: '#06b6d4', badge: 'text-cyan-400 border-cyan-800 bg-cyan-950/60' },
  { stroke: '#f59e0b', fill: '#f59e0b', badge: 'text-amber-400 border-amber-800 bg-amber-950/60' },
  { stroke: '#a855f7', fill: '#a855f7', badge: 'text-purple-400 border-purple-800 bg-purple-950/60' },
];

export default function CorridorComparison({
  city,
  categoryId,
  corridorIds = [],
  onClose,
  onSelectCorridor,
  categoryName,
}) {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchComparison() {
      if (corridorIds.length < 2) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.compareCorridors(city, categoryId, corridorIds);
        if (isMounted) {
          setComparison(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to compare corridors.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchComparison();

    return () => {
      isMounted = false;
    };
  }, [city, categoryId, corridorIds]);

  if (corridorIds.length < 2) return null;

  // Format data for RadarChart
  const radarData = [
    {
      signal: 'Category Fit',
      ...comparison?.corridors?.reduce((acc, c, idx) => {
        acc[`corridor_${idx}`] = c.signals?.category_fit || 0;
        return acc;
      }, {})
    },
    {
      signal: 'Whitespace',
      ...comparison?.corridors?.reduce((acc, c, idx) => {
        acc[`corridor_${idx}`] = c.signals?.whitespace || 0;
        return acc;
      }, {})
    },
    {
      signal: 'Demand',
      ...comparison?.corridors?.reduce((acc, c, idx) => {
        acc[`corridor_${idx}`] = c.signals?.demand || 0;
        return acc;
      }, {})
    },
    {
      signal: 'Resilience',
      ...comparison?.corridors?.reduce((acc, c, idx) => {
        acc[`corridor_${idx}`] = c.signals?.resilience || 0;
        return acc;
      }, {})
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-void-900 border border-void-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-void-800 bg-void-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Head-to-Head Comparison Matrix
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void-800 text-slate-400 border border-void-700">
                  {corridorIds.length} Corridors Selected
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Multi-Corridor Trade Area Diagnostics
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-void-800 hover:bg-void-700 border border-void-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Computing head-to-head comparative signals...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && comparison && (
            <>
              {/* Winner Highlight Card */}
              {comparison.winner && (
                <div className="bg-gradient-to-r from-void-950 via-void-900 to-indigo-950/30 border border-indigo-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Highest Projected Fit
                        </span>
                        <span className="text-xs text-slate-400">
                          {comparison.winner.district}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white">
                        {comparison.winner.corridor_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">VoidSpot Score</span>
                      <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                        {comparison.winner.voidspot_score}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectCorridor(comparison.winner.corridor_id)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-glow-indigo"
                    >
                      View Dossier
                    </button>
                  </div>
                </div>
              )}

              {/* Side-by-Side Radar Visualization & Corridor Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Radar Chart */}
                <div className="bg-void-950/60 border border-void-800 rounded-xl p-4 flex flex-col items-center justify-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 self-start mb-2">
                    Comparative Signal Radar
                  </h4>
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#1f2e47" />
                        <PolarAngleAxis dataKey="signal" stroke="#94aecd" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#2b3f60" tick={{ fontSize: 9 }} />
                        {comparison.corridors.map((c, idx) => (
                          <Radar
                            key={c.corridor_id}
                            name={c.corridor_name}
                            dataKey={`corridor_${idx}`}
                            stroke={CORRIDOR_COLORS[idx % CORRIDOR_COLORS.length].stroke}
                            fill={CORRIDOR_COLORS[idx % CORRIDOR_COLORS.length].fill}
                            fillOpacity={0.25}
                          />
                        ))}
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="space-y-3 flex flex-col justify-center">
                  {comparison.corridors.map((c, idx) => {
                    const colorScheme = CORRIDOR_COLORS[idx % CORRIDOR_COLORS.length];
                    const isWinner = comparison.winner?.corridor_id === c.corridor_id;

                    return (
                      <div 
                        key={c.corridor_id}
                        className={`p-4 rounded-xl border transition-all ${
                          isWinner 
                            ? 'bg-void-950/90 border-cyan-500/40 shadow-sm' 
                            : 'bg-void-950/40 border-void-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: colorScheme.stroke }} />
                            <span className="text-sm font-bold text-white">{c.corridor_name}</span>
                            <span className="text-xs text-slate-400">({c.district})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isWinner && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                Winner
                              </span>
                            )}
                            <span className="text-lg font-extrabold font-mono text-cyan-400">
                              {c.voidspot_score}
                            </span>
                          </div>
                        </div>

                        {/* Mini signal bars */}
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-void-800/60 text-[10px] font-mono">
                          <div>
                            <span className="text-slate-400 block">Fit</span>
                            <span className="font-bold text-slate-200">{c.signals?.category_fit}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Whitespace</span>
                            <span className="font-bold text-teal-300">{c.signals?.whitespace}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Demand</span>
                            <span className="font-bold text-emerald-300">{c.signals?.demand}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Resilience</span>
                            <span className="font-bold text-indigo-300">{c.signals?.resilience}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Head-to-Head Comparison Table */}
              <div className="bg-void-950/60 border border-void-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-void-800 bg-void-950 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Metric</th>
                      {comparison.corridors.map((c, idx) => (
                        <th key={c.corridor_id} className="py-3 px-4">
                          <span className="text-white block font-bold">{c.corridor_name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{c.district}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-void-800/60 font-mono">
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-sans font-medium">VoidSpot Score</td>
                      {comparison.corridors.map((c) => (
                        <td key={c.corridor_id} className="py-3 px-4 font-bold text-cyan-400 text-sm">
                          {c.voidspot_score}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-sans font-medium">Category Fit Signal</td>
                      {comparison.corridors.map((c) => (
                        <td key={c.corridor_id} className="py-3 px-4 text-slate-200">
                          {c.signals?.category_fit}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-sans font-medium">Whitespace Opportunity</td>
                      {comparison.corridors.map((c) => (
                        <td key={c.corridor_id} className="py-3 px-4 text-teal-300">
                          {c.signals?.whitespace}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-sans font-medium">Consumer Demand Footfall</td>
                      {comparison.corridors.map((c) => (
                        <td key={c.corridor_id} className="py-3 px-4 text-emerald-300">
                          {c.signals?.demand}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-sans font-medium">Resilience Index</td>
                      {comparison.corridors.map((c) => (
                        <td key={c.corridor_id} className="py-3 px-4 text-indigo-300">
                          {c.signals?.resilience}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-slate-400 font-sans font-medium">Signal Provenance</td>
                      {comparison.corridors.map((c) => (
                        <td key={c.corridor_id} className="py-3 px-4 text-[10px] text-slate-400 uppercase font-sans">
                          {c.score_source === 'dataset' ? 'Dataset Native' : 'VoidSpot Derived'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-void-950 border-t border-void-800 flex items-center justify-between text-xs text-slate-500">
          <span>Comparing multi-attribute deterministic location metrics.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-void-800 hover:bg-void-700 text-slate-200 font-semibold transition-colors"
          >
            Done Comparing
          </button>
        </div>

      </div>
    </div>
  );
}
