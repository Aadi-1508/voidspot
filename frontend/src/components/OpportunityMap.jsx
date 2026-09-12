import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, 
  Compass, 
  Sparkles, 
  Maximize2, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Scale, 
  ChevronRight, 
  CheckSquare, 
  Award,
  Zap,
  Repeat,
  Info,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

// CartoDB Dark Matter tile layer URL
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const CARTODB_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function OpportunityMap({
  city,
  categoryId,
  categoryName,
  selectedCorridorId,
  onSelectCorridor,
  onOpenFullDossier,
  onToggleCompare,
  isSelectedForCompare,
  onOpenTwin,
  onAskAiWithContext,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const h3LayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('opportunity'); // 'opportunity' | 'demand' | 'competition' | 'h3'
  const [corridors, setCorridors] = useState([]);
  const [h3Data, setH3Data] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCorridor, setHoveredCorridor] = useState(null);

  // Active selected corridor data
  const activeCorridor = useMemo(() => {
    return corridors.find(c => c.corridor_id === selectedCorridorId) || corridors[0] || null;
  }, [corridors, selectedCorridorId]);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = city === 'nyc' ? [40.7589, -73.9851] : [32.7767, -96.7970];
    const initialZoom = city === 'nyc' ? 11 : 10;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tiles
    L.tileLayer(DARK_TILES, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Feature group for markers
    const markersGroup = L.featureGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Feature group for H3 hex polygons
    const h3Group = L.featureGroup().addTo(map);
    h3LayerRef.current = h3Group;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fetch Map Corridors & H3 Data when city or category changes
  useEffect(() => {
    let isMounted = true;
    async function loadMapData() {
      try {
        setLoading(true);
        const [mapRes, h3Res] = await Promise.all([
          api.getMapCorridors(city, categoryId).catch(() => ({ corridors: [] })),
          api.getMapH3(city, categoryId).catch(() => ({ available: false, cells: [] })),
        ]);

        if (isMounted) {
          const list = mapRes.corridors || [];
          setCorridors(list);
          setH3Data(h3Res);

          // Update map view center to the new city
          if (mapInstanceRef.current && mapRes.center) {
            mapInstanceRef.current.setView(mapRes.center, mapRes.zoom || 11, { animate: true });
          }
        }
      } catch (err) {
        console.error('Map loading error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (city && categoryId) {
      loadMapData();
    }

    return () => {
      isMounted = false;
    };
  }, [city, categoryId]);

  // 3. Render Markers & H3 Polygons when corridors or activeLayer change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const h3Group = h3LayerRef.current;
    if (!map || !markersGroup || !h3Group) return;

    markersGroup.clearLayers();
    h3Group.clearLayers();

    // Render H3 Layer if selected
    if (activeLayer === 'h3' && h3Data?.available && h3Data.cells?.length > 0) {
      h3Data.cells.forEach(cell => {
        const poly = L.polygon(cell.polygon, {
          color: '#06b6d4',
          weight: 1,
          opacity: 0.6,
          fillColor: cell.voidspot_score >= 75 ? '#10b981' : cell.voidspot_score >= 60 ? '#06b6d4' : '#6366f1',
          fillOpacity: 0.25,
        });

        poly.bindTooltip(`
          <div class="font-sans text-xs p-1">
            <div class="font-bold text-slate-100">${cell.corridor_name}</div>
            <div class="text-[10px] text-cyan-300 font-mono">H3 Cell: ${cell.h3_index}</div>
            <div class="text-[10px] text-slate-400">Score: ${cell.voidspot_score}/100</div>
          </div>
        `, { className: 'void-leaflet-tooltip', sticky: true });

        poly.on('click', () => {
          onSelectCorridor(cell.corridor_id);
        });

        h3Group.addLayer(poly);
      });
    }

    // Render Corridor Markers
    corridors.forEach(c => {
      const isSelected = c.corridor_id === selectedCorridorId;
      const rank = c.rank;

      // Determine size and color depending on active layer
      let radius = 7;
      let fillColor = '#06b6d4';
      let strokeColor = '#22d3ee';
      let layerStatText = `VoidSpot Score: ${c.voidspot_score}/100`;

      if (activeLayer === 'opportunity') {
        radius = Math.max(6, Math.min(16, (c.voidspot_score / 100) * 16));
        fillColor = rank === 1 ? '#10b981' : rank <= 5 ? '#06b6d4' : '#6366f1';
        strokeColor = rank === 1 ? '#34d399' : '#38bdf8';
      } else if (activeLayer === 'demand') {
        radius = Math.max(6, Math.min(16, (c.demand / 100) * 16));
        fillColor = '#06b6d4';
        strokeColor = '#67e8f9';
        layerStatText = `Demand Footfall Signal: ${c.demand}%`;
      } else if (activeLayer === 'competition') {
        radius = Math.max(6, Math.min(16, Math.sqrt(c.competition_count || 1) * 2.5));
        fillColor = '#f59e0b';
        strokeColor = '#fbbf24';
        layerStatText = `Supply / Listings: ${c.competition_count} places`;
      } else if (activeLayer === 'h3') {
        radius = 5;
        fillColor = '#94aecd';
        strokeColor = '#cbd9e7';
      }

      if (isSelected) {
        radius += 4;
        strokeColor = '#ffffff';
      }

      const marker = L.circleMarker(c.coordinates, {
        radius: radius,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.95 : 0.75,
        color: strokeColor,
        weight: isSelected ? 3 : 1.5,
      });

      // Hover Tooltip
      marker.bindTooltip(`
        <div class="font-sans text-xs p-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span class="w-4 h-4 rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold">#${rank}</span>
            <span>${c.corridor_name}</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">${c.district}</div>
          <div class="text-[11px] font-mono font-bold text-cyan-300 mt-1">${layerStatText}</div>
        </div>
      `, { className: 'void-leaflet-tooltip', direction: 'top', offset: [0, -5] });

      marker.on('click', () => {
        onSelectCorridor(c.corridor_id);
        map.panTo(c.coordinates, { animate: true });
      });

      marker.on('mouseover', () => setHoveredCorridor(c));
      marker.on('mouseout', () => setHoveredCorridor(null));

      markersGroup.addLayer(marker);
    });

  }, [corridors, activeLayer, h3Data, selectedCorridorId]);

  // 4. Fly to selected corridor when selectedCorridorId changes from outside
  useEffect(() => {
    if (!selectedCorridorId || !mapInstanceRef.current) return;
    const target = corridors.find(c => c.corridor_id === selectedCorridorId);
    if (target && target.coordinates) {
      mapInstanceRef.current.panTo(target.coordinates, { animate: true });
    }
  }, [selectedCorridorId, corridors]);

  return (
    <div className="bg-void-900 border border-void-800 rounded-2xl shadow-card overflow-hidden mb-12 relative flex flex-col lg:flex-row h-[620px]">
      
      {/* Map Canvas Area */}
      <div className="flex-1 h-full relative">
        <div ref={mapContainerRef} className="w-full h-full bg-void-950 z-10" />

        {/* Floating Header Banner */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center gap-2">
          <div className="bg-void-950/90 backdrop-blur-md border border-void-800 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-wider uppercase text-white">
                  Opportunity Intelligence Map
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                  Spatial Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {city.toUpperCase()} • {categoryName || categoryId} • {corridors.length} corridors mapped
              </p>
            </div>
          </div>
        </div>

        {/* Floating Layer Controls */}
        <div className="absolute top-4 right-14 z-20 pointer-events-auto">
          <div className="bg-void-950/90 backdrop-blur-md border border-void-800 p-1.5 rounded-xl shadow-lg flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveLayer('opportunity')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeLayer === 'opportunity'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-void-800/60'
              }`}
            >
              <span>● Opportunity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLayer('demand')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeLayer === 'demand'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-void-800/60'
              }`}
            >
              <span>● Demand</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLayer('competition')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeLayer === 'competition'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-void-800/60'
              }`}
            >
              <span>● Supply</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLayer('h3')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeLayer === 'h3'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-void-800/60'
              }`}
            >
              <span>⬡ H3 Context</span>
            </button>
          </div>
        </div>

        {/* H3 Notice pill for DFW */}
        {activeLayer === 'h3' && city === 'dfw' && (
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-void-950/90 border border-void-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-400">
            <span className="text-amber-400 font-semibold">Note:</span> H3 geometry is not authoritative for DFW dataset. Gracefully showing corridor visualization.
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none bg-void-950/85 backdrop-blur-md border border-void-800 px-3 py-2 rounded-xl text-[10px] text-slate-400 flex items-center gap-3">
          <span className="font-semibold text-slate-300">Marker Legend:</span>
          {activeLayer === 'opportunity' && (
            <>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Rank #1</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Top 5</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> General Corridor</span>
            </>
          )}
          {activeLayer === 'demand' && (
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Diameter = Footfall Demand Signal</span>
          )}
          {activeLayer === 'competition' && (
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Diameter = Category Listings Count</span>
          )}
          {activeLayer === 'h3' && (
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-cyan-400 bg-cyan-500/30" /> H3-10 Hex Cell Density</span>
          )}
        </div>
      </div>

      {/* Side Intelligence Panel: Click-to-Analyze Experience */}
      <div className="w-full lg:w-96 bg-void-950 border-t lg:border-t-0 lg:border-l border-void-800 p-5 flex flex-col justify-between overflow-y-auto z-20">
        {activeCorridor ? (
          <div className="space-y-4">
            
            {/* Header / Rank */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono font-bold text-xs">
                    Rank #{activeCorridor.rank}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeCorridor.district}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {activeCorridor.score_source === 'dataset' ? 'Dataset Native' : 'Derived'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {activeCorridor.corridor_name}
              </h3>
            </div>

            {/* Score Showcase */}
            <div className="bg-void-900 border border-void-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">VoidSpot Score</span>
                <span className="text-[10px] text-slate-500">Spatial composite heuristic</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-cyan-400 font-mono">
                  {activeCorridor.voidspot_score}
                </span>
                <span className="text-xs font-semibold text-slate-500">/100</span>
              </div>
            </div>

            {/* 4 Core Signals */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-void-900/80 border border-void-800/80 rounded-lg">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Category Fit</span>
                  <span className="font-mono text-cyan-300 font-bold">{activeCorridor.category_fit}%</span>
                </div>
                <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(activeCorridor.category_fit, 100)}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-void-900/80 border border-void-800/80 rounded-lg">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Demand Signal</span>
                  <span className="font-mono text-emerald-300 font-bold">{activeCorridor.demand}%</span>
                </div>
                <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(activeCorridor.demand, 100)}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-void-900/80 border border-void-800/80 rounded-lg">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Whitespace Signal</span>
                  <span className="font-mono text-teal-300 font-bold">{activeCorridor.whitespace}%</span>
                </div>
                <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: `${Math.min(activeCorridor.whitespace, 100)}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-void-900/80 border border-void-800/80 rounded-lg">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Resilience Index</span>
                  <span className="font-mono text-indigo-300 font-bold">{activeCorridor.resilience}%</span>
                </div>
                <div className="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(activeCorridor.resilience, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Strategic Rationale */}
            <div className="p-3 bg-void-900/60 border border-void-800 rounded-xl text-xs text-slate-300 leading-relaxed">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block mb-1">
                Strategic Intelligence
              </span>
              <p className="italic text-slate-300">
                "{activeCorridor.corridor_name} demonstrates {activeCorridor.category_fit >= 60 ? 'strong' : 'balanced'} category fit with an estimated demand signal of {activeCorridor.demand}% and resilience of {activeCorridor.resilience}%."
              </p>
            </div>

            {/* Action Grid */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenFullDossier(activeCorridor.corridor_id)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-cyan transition-all"
              >
                <span>Open Complete Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleCompare(activeCorridor.corridor_id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isSelectedForCompare(activeCorridor.corridor_id)
                      ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                      : 'bg-void-900 border-void-800 text-slate-300 hover:bg-void-850'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSelectedForCompare(activeCorridor.corridor_id) ? 'Comparing' : 'Compare'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTwin(activeCorridor.corridor_id)}
                  className="py-2 px-2.5 rounded-xl bg-void-900 hover:bg-void-850 border border-void-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  title="Find comparable corridor in opposite metro"
                >
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cross-Metro Twin</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onAskAiWithContext(activeCorridor)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ask VoidSpot about {activeCorridor.corridor_name}</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 text-xs">
            Select a corridor marker on the map to inspect spatial intelligence.
          </div>
        )}

        <div className="pt-3 border-t border-void-800/80 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Click any marker to inspect</span>
          <span className="font-mono text-cyan-400">Carto Spatial Engine</span>
        </div>
      </div>

    </div>
  );
}
