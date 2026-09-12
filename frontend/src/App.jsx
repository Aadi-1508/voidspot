import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HeroControlPanel from './components/HeroControlPanel';
import TopOpportunity from './components/TopOpportunity';
import OpportunityRanking from './components/OpportunityRanking';
import CorridorDetailModal from './components/CorridorDetailModal';
import CorridorComparison from './components/CorridorComparison';
import OpportunityMap from './components/OpportunityMap';
import CrossMetroTwinModal from './components/CrossMetroTwinModal';
import AskVoidSpotModal from './components/AskVoidSpotModal';
import ErrorBanner from './components/ErrorBanner';
import { TopOpportunitySkeleton, OpportunityRankingSkeleton } from './components/LoadingSkeleton';
import api from './services/api';
import { Compass, Sparkles, Building2, Layers, AlertCircle } from 'lucide-react';

export default function App() {
  const [city, setCity] = useState('nyc');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [opportunities, setOpportunities] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchRun, setSearchRun] = useState(false);

  const [backendHealthy, setBackendHealthy] = useState(true);
  const [backendError, setBackendError] = useState(null);

  // Modals & Drawers
  const [detailCorridorId, setDetailCorridorId] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');
  const [twinCorridorId, setTwinCorridorId] = useState(null);
  const [isTwinOpen, setIsTwinOpen] = useState(false);
  const [mapSelectedCorridorId, setMapSelectedCorridorId] = useState(null);

  // Check health on load
  const checkSystemHealth = useCallback(async () => {
    try {
      await api.checkHealth();
      setBackendHealthy(true);
      setBackendError(null);
    } catch (err) {
      setBackendHealthy(false);
      setBackendError('VoidSpot backend is currently unavailable. Please make sure the API is running on port 8000.');
    }
  }, []);

  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  // Load categories when city changes
  useEffect(() => {
    let isMounted = true;
    async function loadCityCategories() {
      try {
        setLoadingCategories(true);
        // Clear stale results as required
        setOpportunities([]);
        setRecommendation(null);
        setSearchRun(false);
        setSelectedForCompare([]);
        setDetailCorridorId(null);
        setMapSelectedCorridorId(null);
        setTwinCorridorId(null);
        setBackendError(null);

        const cats = await api.getCategories(city);
        if (isMounted) {
          setCategories(cats);
          if (cats.length > 0) {
            setSelectedCategory(cats[0].category_id);
          } else {
            setSelectedCategory('');
          }
          setBackendHealthy(true);
        }
      } catch (err) {
        if (isMounted) {
          setBackendHealthy(false);
          setBackendError(err.message || 'VoidSpot backend is currently unavailable. Please make sure the API is running on port 8000.');
        }
      } finally {
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    }

    loadCityCategories();

    return () => {
      isMounted = false;
    };
  }, [city]);

  // Handle Find Opportunities
  const handleFindOpportunities = async () => {
    if (!selectedCategory) return;

    try {
      setLoadingSearch(true);
      setBackendError(null);
      setSelectedForCompare([]);

      // Fetch opportunities and recommendation concurrently
      const [oppsData, recData] = await Promise.all([
        api.getOpportunities(city, selectedCategory),
        api.getRecommendation(city, selectedCategory).catch((err) => {
          console.warn('Recommendation fetch note:', err);
          return null;
        }),
      ]);

      setOpportunities(oppsData.opportunities || []);
      setRecommendation(recData);
      if (recData?.corridor_id) {
        setMapSelectedCorridorId(recData.corridor_id);
      } else if (oppsData.opportunities?.length > 0) {
        setMapSelectedCorridorId(oppsData.opportunities[0].corridor_id);
      }
      setSearchRun(true);
      setBackendHealthy(true);
    } catch (err) {
      setBackendError(err.message || 'Failed to compute corridor opportunities.');
      if (err.status === 0) {
        setBackendHealthy(false);
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  // Compare toggles
  const handleToggleCompare = (corridorId) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(corridorId)) {
        return prev.filter((id) => id !== corridorId);
      } else {
        if (prev.length >= 3) {
          // Limit to max 3
          return [...prev.slice(1), corridorId];
        }
        return [...prev, corridorId];
      }
    });
  };

  const isSelectedForCompare = (corridorId) => selectedForCompare.includes(corridorId);

  const selectedCategoryObj = categories.find((c) => c.category_id === selectedCategory);
  const categoryDisplayName = selectedCategoryObj?.name || selectedCategory;

  return (
    <div className="min-h-screen bg-void-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Navigation Header */}
      <Header 
        city={city} 
        onCityChange={setCity} 
        backendHealthy={backendHealthy}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        loading={loadingSearch}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Hero & Filter Panel */}
        <HeroControlPanel
          city={city}
          onCityChange={setCity}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onFindOpportunities={handleFindOpportunities}
          loading={loadingSearch}
          loadingCategories={loadingCategories}
        />

        {/* Global Error Banner */}
        {backendError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <ErrorBanner 
              message={backendError} 
              isBackendDown={!backendHealthy}
              onRetry={() => {
                checkSystemHealth();
                if (selectedCategory) handleFindOpportunities();
              }} 
            />
          </div>
        )}

        {/* Geospatial Opportunity Intelligence Engine Map */}
        {selectedCategory && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
            <OpportunityMap
              city={city}
              categoryId={selectedCategory}
              categoryName={categoryDisplayName}
              selectedCorridorId={mapSelectedCorridorId}
              onSelectCorridor={(id) => {
                setMapSelectedCorridorId(id);
              }}
              onOpenFullDossier={(id) => setDetailCorridorId(id)}
              onToggleCompare={handleToggleCompare}
              isSelectedForCompare={isSelectedForCompare}
              onOpenTwin={(corridorId) => {
                setTwinCorridorId(corridorId);
                setIsTwinOpen(true);
              }}
              onAskAiWithContext={(prompt) => {
                setAiInitialQuery(prompt);
                setIsAiModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Dynamic Results Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          
          {/* Loading Skeletons */}
          {loadingSearch && (
            <div className="space-y-6">
              <TopOpportunitySkeleton />
              <OpportunityRankingSkeleton />
            </div>
          )}

          {/* Results State */}
          {!loadingSearch && searchRun && (
            <>
              {opportunities.length === 0 ? (
                <div className="bg-void-900 border border-void-800 rounded-2xl p-12 text-center my-8 shadow-card">
                  <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">No Opportunities Located</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No matching corridors satisfied the threshold constraints for {categoryDisplayName} in {city.toUpperCase()}. Try selecting another business category.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Recommended Opportunity */}
                  {recommendation && (
                    <TopOpportunity
                      recommendationData={recommendation}
                      onSelectCorridor={setDetailCorridorId}
                      onToggleCompare={handleToggleCompare}
                      isSelectedForCompare={isSelectedForCompare}
                    />
                  )}

                  {/* Opportunity Ranking Table */}
                  <OpportunityRanking
                    opportunities={opportunities}
                    onSelectCorridor={setDetailCorridorId}
                    selectedCorridorIds={selectedForCompare}
                    onToggleCompare={handleToggleCompare}
                    onLaunchCompare={() => setIsCompareOpen(true)}
                    categoryName={categoryDisplayName}
                  />
                </>
              )}
            </>
          )}

          {/* Empty State before search */}
          {!loadingSearch && !searchRun && !backendError && (
            <div className="bg-gradient-to-b from-void-900/60 to-void-950/60 border border-void-800/80 rounded-2xl p-12 text-center my-8 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-void-850 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Ready to Discover Commercial Corridors</h3>
              <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
                Select your target metro market ({city.toUpperCase()}) and category ({categoryDisplayName || 'Cafe, Retail, etc.'}), then click <span className="text-cyan-300 font-semibold">"Find Opportunities"</span> to compute multi-factor spatial heuristics.
              </p>
              
              {/* Feature summary pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-900 border border-void-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Category Fit (45%)
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-900 border border-void-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Whitespace Signal (25%)
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-900 border border-void-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Demand Footfall (20%)
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-900 border border-void-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Macro Resilience (10%)
                </span>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Corridor Detail Intelligence Modal */}
      {detailCorridorId && (
        <CorridorDetailModal
          city={city}
          categoryId={selectedCategory}
          corridorId={detailCorridorId}
          onClose={() => setDetailCorridorId(null)}
          categoryName={categoryDisplayName}
        />
      )}

      {/* Multi-Corridor Comparison Modal */}
      {isCompareOpen && (
        <CorridorComparison
          city={city}
          categoryId={selectedCategory}
          corridorIds={selectedForCompare}
          onClose={() => setIsCompareOpen(false)}
          onSelectCorridor={(id) => {
            setIsCompareOpen(false);
            setDetailCorridorId(id);
          }}
          categoryName={categoryDisplayName}
        />
      )}

      {/* Ask VoidSpot AI Modal Entry Point */}
      {isAiModalOpen && (
        <AskVoidSpotModal
          initialQuery={aiInitialQuery}
          onClose={() => {
            setIsAiModalOpen(false);
            setAiInitialQuery('');
          }}
          onSelectSample={(sample) => {
            // handle sample selection
          }}
        />
      )}

      {/* Cross-Metro Twin Matcher Modal */}
      {isTwinOpen && twinCorridorId && (
        <CrossMetroTwinModal
          city={city}
          categoryId={selectedCategory}
          corridorId={twinCorridorId}
          categoryName={categoryDisplayName}
          onClose={() => {
            setIsTwinOpen(false);
            setTwinCorridorId(null);
          }}
          onLaunchCompareWithTwin={(source, match) => {
            setIsTwinOpen(false);
            setAiInitialQuery(`Compare ${source?.corridor_name || source?.corridor_id} in ${source?.city?.toUpperCase() || ''} with ${match?.corridor_name || match?.corridor_id} in ${match?.city?.toUpperCase() || ''} for ${categoryDisplayName}.`);
            setIsAiModalOpen(true);
          }}
        />
      )}

      {/* Enterprise Footer */}
      <footer className="border-t border-void-800/80 bg-void-950 py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">VOIDSPOT</span>
            <span>—</span>
            <span>Retail Gap &amp; Opportunity Engine</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>Deterministic Spatial Telemetry</span>
            <span>Model Context Protocol (MCP) Ready</span>
            <span className="font-mono text-cyan-400">Status: Operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
