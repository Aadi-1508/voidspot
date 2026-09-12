import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  Search, 
  ArrowUpDown, 
  CheckSquare, 
  Square, 
  SlidersHorizontal, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  Layers,
  Scale
} from 'lucide-react';

export default function OpportunityRanking({
  opportunities = [],
  onSelectCorridor,
  selectedCorridorIds = [],
  onToggleCompare,
  onLaunchCompare,
  categoryName,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('voidspot_score');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Filtering and sorting
  const filteredAndSorted = useMemo(() => {
    return opportunities
      .filter((opp) => {
        const query = searchTerm.toLowerCase();
        const name = (opp.corridor_name || '').toLowerCase();
        const district = (opp.district || '').toLowerCase();
        return name.includes(query) || district.includes(query);
      })
      .sort((a, b) => {
        let valA = a.voidspot_score;
        let valB = b.voidspot_score;

        if (sortBy === 'category_fit') {
          valA = a.signals?.category_fit || 0;
          valB = b.signals?.category_fit || 0;
        } else if (sortBy === 'whitespace') {
          valA = a.signals?.whitespace || 0;
          valB = b.signals?.whitespace || 0;
        } else if (sortBy === 'demand') {
          valA = a.signals?.demand || 0;
          valB = b.signals?.demand || 0;
        } else if (sortBy === 'resilience') {
          valA = a.signals?.resilience || 0;
          valB = b.signals?.resilience || 0;
        } else if (sortBy === 'name') {
          valA = a.corridor_name;
          valB = b.corridor_name;
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [opportunities, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const isCompareReady = selectedCorridorIds.length >= 2 && selectedCorridorIds.length <= 3;

  return (
    <div className="bg-void-900 border border-void-800 rounded-2xl p-6 shadow-card mb-12">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-void-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white tracking-tight">Opportunity Ranking</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-void-800 text-slate-300 border border-void-700">
              {opportunities.length} corridors evaluated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Corridors evaluated for <span className="text-cyan-300 font-semibold">{categoryName || 'selected category'}</span>. Click any corridor for granular telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search corridor or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-void-950 border border-void-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Compare Button if items selected */}
          {selectedCorridorIds.length > 0 && (
            <button
              type="button"
              onClick={onLaunchCompare}
              disabled={!isCompareReady}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isCompareReady
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-indigo'
                  : 'bg-void-800 text-slate-500 border border-void-700 cursor-not-allowed'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare ({selectedCorridorIds.length}/3)</span>
            </button>
          )}
        </div>
      </div>

      {/* Corridor Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-void-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3 w-10 text-center">Compare</th>
              <th className="py-3 px-3 w-12 text-center">Rank</th>
              <th className="py-3 px-4">
                <button 
                  onClick={() => handleSort('name')} 
                  className="flex items-center gap-1 hover:text-slate-200"
                >
                  <span>Corridor</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-4">District</th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => handleSort('voidspot_score')} 
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>VoidSpot Score</span>
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => handleSort('category_fit')} 
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>Category Fit</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => handleSort('whitespace')} 
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>Whitespace</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => handleSort('demand')} 
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>Demand</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => handleSort('resilience')} 
                  className="inline-flex items-center gap-1 hover:text-slate-200 ml-auto"
                >
                  <span>Resilience</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-void-800/60 text-xs">
            {filteredAndSorted.map((opp, index) => {
              const isSelected = selectedCorridorIds.includes(opp.corridor_id);
              const rank = index + 1;

              return (
                <tr 
                  key={opp.corridor_id}
                  className={`group hover:bg-void-850/80 transition-colors ${
                    isSelected ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(opp.corridor_id);
                      }}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Select for comparison (up to 3)"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                  </td>

                  {/* Rank */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold">
                    <span className={`inline-block w-6 h-6 leading-6 rounded-md text-xs ${
                      rank === 1 
                        ? 'bg-amber-400/20 text-amber-300 font-extrabold border border-amber-500/40'
                        : rank <= 3
                        ? 'bg-void-800 text-slate-300 border border-void-700'
                        : 'text-slate-500'
                    }`}>
                      {rank}
                    </span>
                  </td>

                  {/* Name + Source */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCorridor(opp.corridor_id)}
                        className="hover:text-cyan-300 transition-colors text-left font-bold"
                      >
                        {opp.corridor_name}
                      </button>
                      {opp.score_source === 'voidspot_derived' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-void-800 text-slate-400 border border-void-700">
                          Derived
                        </span>
                      )}
                    </div>
                  </td>

                  {/* District */}
                  <td className="py-3.5 px-4 text-slate-400">
                    {opp.district || '—'}
                  </td>

                  {/* VoidSpot Score */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono font-extrabold text-sm text-cyan-400">
                      {opp.voidspot_score}
                    </span>
                  </td>

                  {/* Category Fit */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    <div className="inline-flex items-center gap-1.5">
                      <span>{opp.signals?.category_fit}%</span>
                      <div className="w-8 bg-void-800 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="bg-cyan-500 h-full rounded-full" 
                          style={{ width: `${Math.min(opp.signals?.category_fit || 0, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>

                  {/* Whitespace */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    <div className="inline-flex items-center gap-1.5">
                      <span>{opp.signals?.whitespace}%</span>
                      <div className="w-8 bg-void-800 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="bg-teal-400 h-full rounded-full" 
                          style={{ width: `${Math.min(opp.signals?.whitespace || 0, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>

                  {/* Demand */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    <div className="inline-flex items-center gap-1.5">
                      <span>{opp.signals?.demand}%</span>
                      <div className="w-8 bg-void-800 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="bg-emerald-400 h-full rounded-full" 
                          style={{ width: `${Math.min(opp.signals?.demand || 0, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>

                  {/* Resilience */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    <div className="inline-flex items-center gap-1.5">
                      <span>{opp.signals?.resilience}%</span>
                      <div className="w-8 bg-void-800 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="bg-indigo-400 h-full rounded-full" 
                          style={{ width: `${Math.min(opp.signals?.resilience || 0, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectCorridor(opp.corridor_id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-void-800 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-void-700 hover:border-cyan-800/80 transition-all"
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSorted.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            No commercial corridors match your search query.
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="mt-4 pt-3 border-t border-void-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>Tip: Select 2 or 3 checkboxes to trigger a side-by-side comparative radar and metric matrix.</span>
        <span>VoidSpot algorithmic ranking powered by deterministic spatial heuristics.</span>
      </div>

    </div>
  );
}
