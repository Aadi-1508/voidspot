import React from 'react';
import { Award, TrendingUp, Compass, ShieldAlert, BarChart3, ChevronRight, CheckSquare, Sparkles } from 'lucide-react';

export default function TopOpportunity({
  recommendationData,
  onSelectCorridor,
  onToggleCompare,
  isSelectedForCompare,
}) {
  if (!recommendationData || !recommendationData.recommendation) {
    return null;
  }

  const { recommendation, why, top_3 } = recommendationData;
  const { corridor_id, corridor_name, district, voidspot_score, signals, score_source } = recommendation;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold tracking-tight text-white">Top Opportunity Recommendation</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Algorithm Rank: #1 of {top_3 ? `${top_3.length}+` : 'N'} evaluated
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Opportunity Spotlight Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-void-900 via-void-900 to-void-850 border border-cyan-500/30 rounded-2xl p-6 shadow-card relative overflow-hidden group">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  Highest Potential
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {district || 'Commercial District'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  score_source === 'dataset' 
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-void-800 border-void-700 text-slate-400'
                }`}>
                  {score_source === 'dataset' ? 'Dataset Native' : 'Derived Heuristic'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {corridor_name}
              </h3>
            </div>

            {/* VoidSpot Score Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-void-950/80 border border-void-800 sm:border-transparent px-4 py-2.5 sm:p-0 rounded-xl">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">VoidSpot Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  {voidspot_score}
                </span>
                <span className="text-sm font-semibold text-slate-500">/100</span>
              </div>
            </div>
          </div>

          {/* 4 Signals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            
            {/* Category Fit */}
            <div className="bg-void-950/70 border border-void-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Category Fit</span>
                <span className="font-mono font-bold text-cyan-400">{signals.category_fit}%</span>
              </div>
              <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(signals.category_fit, 100)}%` }} 
                />
              </div>
            </div>

            {/* Whitespace */}
            <div className="bg-void-950/70 border border-void-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Whitespace</span>
                <span className="font-mono font-bold text-teal-400">{signals.whitespace}%</span>
              </div>
              <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(signals.whitespace, 100)}%` }} 
                />
              </div>
            </div>

            {/* Demand */}
            <div className="bg-void-950/70 border border-void-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Demand</span>
                <span className="font-mono font-bold text-emerald-400">{signals.demand}%</span>
              </div>
              <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(signals.demand, 100)}%` }} 
                />
              </div>
            </div>

            {/* Resilience */}
            <div className="bg-void-950/70 border border-void-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Resilience</span>
                <span className="font-mono font-bold text-indigo-400">{signals.resilience}%</span>
              </div>
              <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(signals.resilience, 100)}%` }} 
                />
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-void-800/80">
            <button
              type="button"
              onClick={() => onSelectCorridor(corridor_id)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors py-1.5"
            >
              <span>Inspect Detailed Corridor Dossier</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onToggleCompare(corridor_id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSelectedForCompare(corridor_id)
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                  : 'bg-void-950 border-void-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <CheckSquare className={`w-3.5 h-3.5 ${isSelectedForCompare(corridor_id) ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{isSelectedForCompare(corridor_id) ? 'Selected for Compare' : 'Add to Compare'}</span>
            </button>
          </div>

        </div>

        {/* Strategic Insight Card: "Why this corridor?" */}
        <div className="bg-void-900 border border-void-800 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-sm font-bold uppercase tracking-wider">Why This Corridor?</h4>
            </div>
            
            <p className="text-sm text-slate-200 leading-relaxed italic border-l-2 border-cyan-500/50 pl-3 py-1 mb-4 bg-void-950/40 rounded-r-lg">
              "{why}"
            </p>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between py-1 border-b border-void-800/50">
                <span className="text-slate-400">Category Fit Priority</span>
                <span className="text-slate-200 font-medium">45% Weight in Scoring</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-void-800/50">
                <span className="text-slate-400">Whitespace Opportunity</span>
                <span className="text-slate-200 font-medium">25% Weight in Scoring</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-void-800/50">
                <span className="text-slate-400">Consumer Footfall Demand</span>
                <span className="text-slate-200 font-medium">20% Weight in Scoring</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Structural Resilience</span>
                <span className="text-slate-200 font-medium">10% Weight in Scoring</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-void-800/60 text-[11px] text-slate-500">
            Automated reasoning based on normalized multi-dimensional corridor telemetry.
          </div>
        </div>

      </div>
    </div>
  );
}
