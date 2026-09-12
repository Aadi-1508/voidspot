import React, { useState, useEffect } from 'react';
import { 
  X, 
  Repeat, 
  Sparkles, 
  Scale, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Compass, 
  TrendingUp, 
  Award,
  Info
} from 'lucide-react';
import api from '../services/api';

export default function CrossMetroTwinModal({
  city,
  categoryId,
  corridorId,
  onClose,
  onLaunchCompareWithTwin,
  categoryName,
}) {
  const [loading, setLoading] = useState(true);
  const [twinData, setTwinData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTwin() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCrossMetroTwin(city, categoryId, corridorId);
        if (isMounted) setTwinData(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to compute cross-metro twin.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (city && categoryId && corridorId) {
      loadTwin();
    }

    return () => {
      isMounted = false;
    };
  }, [city, categoryId, corridorId]);

  if (!corridorId) return null;

  const source = twinData?.source_corridor;
  const match = twinData?.best_match;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-void-900 border border-void-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-void-800 bg-void-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Cross-Metro Twin Matcher
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-void-800 text-slate-400 border border-void-700">
                  NYC ↔ DFW Equivalence
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Commercial Profile Twin
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
              <p className="text-sm font-medium">Computing multi-factor spatial twin across metros...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && twinData && source && match && (
            <>
              {/* Twin Showcase Card */}
              <div className="bg-gradient-to-r from-void-950 via-void-900 to-indigo-950/30 border border-indigo-500/30 rounded-2xl p-6 shadow-card">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  {/* Source Corridor */}
                  <div className="flex-1 text-center md:text-left">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 inline-block mb-1.5">
                      Source ({source.city?.toUpperCase()})
                    </span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {source.corridor_name}
                    </h3>
                    <p className="text-xs text-slate-400">{source.district}</p>
                    <div className="mt-2 text-sm font-mono font-bold text-cyan-400">
                      VoidSpot: {source.voidspot_score}/100
                    </div>
                  </div>

                  {/* Similarity Badge in Middle */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-16 h-16 rounded-full bg-void-950 border-2 border-indigo-500/60 flex flex-col items-center justify-center shadow-glow-indigo">
                      <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-mono">
                        {twinData.similarity_score}%
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300 mt-1.5">
                      Similarity
                    </span>
                  </div>

                  {/* Target Twin Corridor */}
                  <div className="flex-1 text-center md:text-right">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 inline-block mb-1.5">
                      Cross-Metro Twin ({twinData.target_city?.toUpperCase()})
                    </span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {match.corridor_name}
                    </h3>
                    <p className="text-xs text-slate-400">{match.district}</p>
                    <div className="mt-2 text-sm font-mono font-bold text-amber-400">
                      VoidSpot: {match.voidspot_score}/100
                    </div>
                  </div>

                </div>
              </div>

              {/* Why Similar Explanation Card */}
              <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Why These Corridors Are Commercial Twins
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {twinData.explanation?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Similarity Signals Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-void-950 border border-void-800 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Category Fit Similarity</span>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {twinData.similarity_signals?.category_fit_similarity}%
                  </span>
                </div>

                <div className="p-3 bg-void-950 border border-void-800 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Demand Similarity</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {twinData.similarity_signals?.demand_similarity}%
                  </span>
                </div>

                <div className="p-3 bg-void-950 border border-void-800 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Resilience Similarity</span>
                  <span className="text-lg font-bold font-mono text-indigo-400">
                    {twinData.similarity_signals?.resilience_similarity}%
                  </span>
                </div>

                <div className="p-3 bg-void-950 border border-void-800 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Score Proximity</span>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {twinData.similarity_signals?.score_similarity}%
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onLaunchCompareWithTwin(source, match)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-indigo transition-all"
                >
                  <Scale className="w-4 h-4" />
                  <span>Compare {source.corridor_name} &amp; {match.corridor_name} Head-to-Head</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-void-950 border-t border-void-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            VoidSpot Derived Similarity Metric
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-void-800 hover:bg-void-700 text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
