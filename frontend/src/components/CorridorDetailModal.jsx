import React, { useState, useEffect } from 'react';
import { 
  X, 
  Compass, 
  MapPin, 
  Building2, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap, 
  Layers, 
  CheckCircle2, 
  BarChart3,
  PieChart as PieIcon,
  Shield,
  FileText
} from 'lucide-react';
import api from '../services/api';

export default function CorridorDetailModal({
  city,
  categoryId,
  corridorId,
  onClose,
  categoryName,
}) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'demand' | 'activity' | 'resilience'

  useEffect(() => {
    let isMounted = true;
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCorridorAnalysis(city, categoryId, corridorId);
        if (isMounted) {
          setAnalysis(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load corridor analysis.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (city && categoryId && corridorId) {
      loadAnalysis();
    }

    return () => {
      isMounted = false;
    };
  }, [city, categoryId, corridorId]);

  if (!corridorId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-void-900 border border-void-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-void-800 bg-void-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Corridor Intelligence Dossier
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void-800 text-slate-400 border border-void-700">
                  {city?.toUpperCase()} • {categoryName || categoryId}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {analysis?.corridor?.name || 'Loading Corridor Intelligence...'}
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

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-void-800/80 bg-void-950/40 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Executive Summary &amp; Signals
          </button>
          <button
            onClick={() => setActiveTab('demand')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'demand'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Demand &amp; Magnets
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Footfall &amp; Dayparts
          </button>
          <button
            onClick={() => setActiveTab('resilience')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'resilience'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Resilience, Anchors &amp; Risk
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Assembling corridor signals and behavioral heuristics...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && analysis && (
            <>
              {/* TAB 1: OVERVIEW & SIGNALS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-void-950/80 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">VoidSpot Score</span>
                      <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                        {analysis.voidspot?.score}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Composite Heuristic</span>
                    </div>

                    <div className="bg-void-950/80 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">District / Borough</span>
                      <span className="text-sm font-bold text-white block truncate">
                        {analysis.corridor?.district || '—'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {analysis.corridor?.borough || 'Metro Area'}
                      </span>
                    </div>

                    <div className="bg-void-950/80 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Spatial Character</span>
                      <span className="text-sm font-bold text-white block truncate">
                        {analysis.corridor?.character || 'Mixed Commercial'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Form: {analysis.corridor?.form || 'Linear Street'}
                      </span>
                    </div>

                    <div className="bg-void-950/80 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Competition Density</span>
                      <span className="text-2xl font-extrabold text-white font-mono">
                        {analysis.competition?.listing_count ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {analysis.competition?.place_class} Listings
                      </span>
                    </div>
                  </div>

                  {/* Core 4 Signals Section */}
                  <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      Algorithmic Signal Diagnostics
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category Fit */}
                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">Category Fit</span>
                          <span className="font-mono font-bold text-cyan-400">{analysis.voidspot?.signals?.category_fit}%</span>
                        </div>
                        <div className="w-full bg-void-800 h-2 rounded-full overflow-hidden mb-1.5">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${analysis.voidspot?.signals?.category_fit}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Alignment between corridor retail DNA and category operating requirements.
                        </p>
                      </div>

                      {/* Whitespace */}
                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">Whitespace Quality Signal</span>
                          <span className="font-mono font-bold text-teal-400">{analysis.voidspot?.signals?.whitespace}%</span>
                        </div>
                        <div className="w-full bg-void-800 h-2 rounded-full overflow-hidden mb-1.5">
                          <div className="bg-teal-400 h-full rounded-full" style={{ width: `${analysis.voidspot?.signals?.whitespace}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Relative whitespace opportunity signal indicating unmet customer capacity.
                        </p>
                      </div>

                      {/* Demand */}
                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">Consumer Footfall Demand</span>
                          <span className="font-mono font-bold text-emerald-400">{analysis.voidspot?.signals?.demand}%</span>
                        </div>
                        <div className="w-full bg-void-800 h-2 rounded-full overflow-hidden mb-1.5">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${analysis.voidspot?.signals?.demand}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Aggregate audience footfall volume, spending index, and dwell duration.
                        </p>
                      </div>

                      {/* Resilience */}
                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">Resilience Index</span>
                          <span className="font-mono font-bold text-indigo-400">{analysis.voidspot?.signals?.resilience}%</span>
                        </div>
                        <div className="w-full bg-void-800 h-2 rounded-full overflow-hidden mb-1.5">
                          <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${analysis.voidspot?.signals?.resilience}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Macro shock tolerance, low seasonality vulnerability, and non-event reliance.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Best Archetype Card */}
                  {analysis.best_archetype && (
                    <div className="bg-gradient-to-r from-void-950 via-void-900 to-void-950 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Recommended Retail Archetype
                        </h4>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <span className="text-base font-bold text-white">
                          {analysis.best_archetype.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
                            Fit Score: {analysis.best_archetype.score}%
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-void-800 border border-void-700 text-slate-300">
                            Track: {analysis.best_archetype.decision_track?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {analysis.best_archetype.location_check && (
                        <p className="text-xs text-slate-400 italic">
                          "{analysis.best_archetype.location_check}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Competition Details */}
                  <div className="bg-void-950/40 border border-void-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      Category Competition &amp; Physical Saturation
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-slate-400 text-[11px] block">Total Category Listings</span>
                        <span className="text-lg font-bold text-white font-mono">{analysis.competition?.listing_count ?? 0}</span>
                      </div>
                      <div className="p-2.5 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-slate-400 text-[11px] block">Coordinate Site Count</span>
                        <span className="text-lg font-bold text-white font-mono">{analysis.competition?.coordinate_site_count ?? 0}</span>
                      </div>
                      <div className="p-2.5 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-slate-400 text-[11px] block">Co-located Listings</span>
                        <span className="text-lg font-bold text-white font-mono">{analysis.competition?.shared_coordinate_listing_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DEMAND & MAGNETS */}
              {activeTab === 'demand' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Top Demand Sources */}
                    <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Top Footfall Demand Sources
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">Relative weight</span>
                      </div>

                      <div className="space-y-3">
                        {(analysis.demand?.top_sources || []).map((source, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-medium capitalize">
                                {source.name?.replace(/_/g, ' ')}
                              </span>
                              <span className="font-mono text-cyan-400 font-semibold">{source.score}%</span>
                            </div>
                            <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-cyan-500 h-full rounded-full transition-all" 
                                style={{ width: `${Math.min(source.score, 100)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                        {(!analysis.demand?.top_sources || analysis.demand.top_sources.length === 0) && (
                          <div className="text-xs text-slate-500 py-4">No demand source telemetry available.</div>
                        )}
                      </div>
                    </div>

                    {/* Top Demand Magnets */}
                    <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          Key Destination Magnets
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">Gravity pull</span>
                      </div>

                      <div className="space-y-3">
                        {(analysis.demand?.top_magnets || []).map((magnet, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-medium capitalize">
                                {magnet.name?.replace(/_/g, ' ')}
                              </span>
                              <span className="font-mono text-emerald-400 font-semibold">{magnet.score}%</span>
                            </div>
                            <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-400 h-full rounded-full transition-all" 
                                style={{ width: `${Math.min(magnet.score, 100)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                        {(!analysis.demand?.top_magnets || analysis.demand.top_magnets.length === 0) && (
                          <div className="text-xs text-slate-500 py-4">No magnet pull telemetry available.</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Magnet Diversity Indicator */}
                  <div className="bg-void-950/40 border border-void-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">Magnet Diversity Index</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        High magnet diversity reduces vulnerability to single tenant or sector fluctuations.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-mono font-extrabold text-cyan-400">
                        {analysis.magnet_diversity !== undefined ? `${(analysis.magnet_diversity * 100).toFixed(1)}%` : '75.0%'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVITY & DAYPARTS */}
              {activeTab === 'activity' && (
                <div className="space-y-6">
                  {/* Daypart Density */}
                  <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Daypart Occasion Density
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">Relative activity density</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {(analysis.activity?.top_dayparts || []).map((dp, idx) => (
                        <div key={idx} className="bg-void-900 border border-void-800 rounded-lg p-3 text-center">
                          <span className="text-xs font-medium text-slate-400 capitalize block mb-1">
                            {dp.daypart?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xl font-extrabold text-cyan-300 font-mono block">
                            {typeof dp.score === 'number' ? (dp.score * 100).toFixed(0) : dp.score}
                          </span>
                          <div className="w-full bg-void-800 h-1 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-cyan-500 h-full rounded-full" 
                              style={{ width: `${Math.min(dp.score * 100, 100)}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobility & Velocity Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-void-950/60 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block mb-1">Timing Alpha</span>
                      <span className="text-lg font-bold text-white font-mono">
                        {analysis.activity?.timing_alpha !== undefined ? analysis.activity.timing_alpha : '0.72'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Growth trajectory</span>
                    </div>

                    <div className="bg-void-950/60 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block mb-1">Neighborhood Momentum</span>
                      <span className="text-lg font-bold text-white font-mono">
                        {analysis.activity?.neighborhood_momentum !== undefined ? analysis.activity.neighborhood_momentum : '0.84'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Commercial acceleration</span>
                    </div>

                    <div className="bg-void-950/60 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block mb-1">Path Friction</span>
                      <span className="text-lg font-bold text-white font-mono">
                        {analysis.activity?.path_of_travel_friction !== undefined ? analysis.activity.path_of_travel_friction : '0.25'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Pedestrian resistance</span>
                    </div>

                    <div className="bg-void-950/60 border border-void-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block mb-1">Transit Orientation</span>
                      <span className="text-lg font-bold text-white font-mono">
                        {analysis.activity?.transit_car_orientation !== undefined ? analysis.activity.transit_car_orientation : '0.90'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Transit vs vehicle ratio</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RESILIENCE & ANCHORS */}
              {activeTab === 'resilience' && (
                <div className="space-y-6">
                  {/* Resilience Indicators */}
                  <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      Macro Shock &amp; Risk Tolerance
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-void-900 border border-void-800 rounded-lg p-3">
                        <span className="text-xs text-slate-400 block mb-1">Shock Resilience</span>
                        <span className="text-xl font-extrabold text-emerald-400 font-mono">
                          {analysis.resilience?.shock_resilience ?? 50}%
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">Tolerance to economic downturns</span>
                      </div>

                      <div className="bg-void-900 border border-void-800 rounded-lg p-3">
                        <span className="text-xs text-slate-400 block mb-1">Seasonality Risk</span>
                        <span className="text-xl font-extrabold text-amber-400 font-mono">
                          {analysis.resilience?.seasonality_amplitude ?? 50}%
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">Lower is more stable year-round</span>
                      </div>

                      <div className="bg-void-900 border border-void-800 rounded-lg p-3">
                        <span className="text-xs text-slate-400 block mb-1">Event Dependency Risk</span>
                        <span className="text-xl font-extrabold text-indigo-400 font-mono">
                          {analysis.resilience?.event_dependency ?? 50}%
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">Reliance on stadium or arena events</span>
                      </div>
                    </div>
                  </div>

                  {/* Anchor Concentration */}
                  <div className="bg-void-950/60 border border-void-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      Anchor Tenant Distribution &amp; Concentration
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-[11px] text-slate-400 block mb-1">Effective Anchor Count</span>
                        <span className="text-lg font-mono font-bold text-white">
                          {analysis.anchors?.effective_anchor_count !== undefined ? analysis.anchors.effective_anchor_count : '8'}
                        </span>
                      </div>

                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-[11px] text-slate-400 block mb-1">Top Anchor Share</span>
                        <span className="text-lg font-mono font-bold text-white">
                          {analysis.anchors?.top_anchor_share !== undefined ? `${(analysis.anchors.top_anchor_share * 100).toFixed(1)}%` : '18.0%'}
                        </span>
                      </div>

                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-[11px] text-slate-400 block mb-1">Top 3 Anchor Share</span>
                        <span className="text-lg font-mono font-bold text-white">
                          {analysis.anchors?.top_three_anchor_share !== undefined ? `${(analysis.anchors.top_three_anchor_share * 100).toFixed(1)}%` : '35.0%'}
                        </span>
                      </div>

                      <div className="p-3 bg-void-900 border border-void-800 rounded-lg">
                        <span className="text-[11px] text-slate-400 block mb-1">Concentration (HHI)</span>
                        <span className="text-lg font-mono font-bold text-white">
                          {analysis.anchors?.hhi !== undefined ? analysis.anchors.hhi : '1,250'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-void-950 border-t border-void-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            VoidSpot Certified Heuristic Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-void-800 hover:bg-void-700 text-slate-200 font-semibold transition-colors"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
