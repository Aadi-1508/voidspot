import React from 'react';
import { Search, MapPin, Layers, ArrowRight, Database, Cpu, Sparkles, Filter } from 'lucide-react';

export default function HeroControlPanel({
  city,
  onCityChange,
  categories,
  selectedCategory,
  onSelectCategory,
  onFindOpportunities,
  loading,
  loadingCategories,
}) {
  const currentCategoryObj = categories.find(c => c.category_id === selectedCategory);

  return (
    <section className="relative pt-8 pb-12 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-void-900 border border-void-700/60 mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">Commercial Location Intelligence &amp; Whitespace Discovery</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-5">
            Find the gap.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              Capture the opportunity.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            VoidSpot helps entrepreneurs and retail teams identify promising commercial corridors by combining demand, whitespace, category fit and resilience signals.
          </p>
        </div>

        {/* Control Panel Card */}
        <div className="max-w-4xl mx-auto bg-void-900/90 border border-void-800 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-card transition-all">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            
            {/* City Selector Box */}
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Target Market
              </label>
              <div className="grid grid-cols-2 gap-2 bg-void-950 p-1.5 rounded-xl border border-void-800">
                <button
                  type="button"
                  onClick={() => onCityChange('nyc')}
                  disabled={loading}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    city === 'nyc'
                      ? 'bg-void-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>New York (NYC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCityChange('dfw')}
                  disabled={loading}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    city === 'dfw'
                      ? 'bg-void-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Dallas-FW (DFW)</span>
                </button>
              </div>
            </div>

            {/* Dynamic Category Selector */}
            <div className="flex-[1.5]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Business Category
                </span>
                {currentCategoryObj && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    currentCategoryObj.source === 'dataset'
                      ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                      : 'bg-void-800 border-void-700 text-slate-400'
                  }`}>
                    {currentCategoryObj.source === 'dataset' ? 'Dataset Native' : 'VoidSpot Derived Signal'}
                  </span>
                )}
              </label>
              
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => onSelectCategory(e.target.value)}
                  disabled={loading || loadingCategories}
                  className="w-full bg-void-950 border border-void-800 text-slate-200 text-sm font-medium rounded-xl py-3 pl-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingCategories ? (
                    <option value="">Loading categories...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name} {cat.source === 'voidspot_derived' ? '• (Derived Signal)' : '• (Dataset Native)'}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="md:w-56 flex flex-col justify-end">
              <label className="hidden md:block text-xs font-semibold text-transparent mb-2 select-none">Action</label>
              <button
                type="button"
                onClick={onFindOpportunities}
                disabled={loading || !selectedCategory}
                className="w-full h-[46px] rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 flex items-center justify-center gap-2 shadow-glow-cyan transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Signals...</span>
                  </>
                ) : (
                  <>
                    <span>Find Opportunities</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Subtext description */}
          <div className="mt-4 pt-3 border-t border-void-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              Compare commercial corridors using VoidSpot intelligence.
            </span>
            <span className="text-slate-500">
              City-specific corridor behavior, footfall density, and whitespace heuristics.
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
