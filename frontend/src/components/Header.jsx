import React from 'react';
import { Compass, Sparkles, Activity, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Header({ 
  city, 
  onCityChange, 
  backendHealthy, 
  onOpenAiModal,
  loading
}) {
  return (
    <header className="border-b border-void-800/80 bg-void-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-void-800 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center shadow-glow-cyan">
            <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-lg text-white">VOIDSPOT</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold tracking-wider">v1.0</span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Retail Gap &amp; Opportunity Engine</p>
          </div>
        </div>

        {/* Center: City Selector */}
        <div className="flex items-center bg-void-900 border border-void-800 rounded-lg p-1 shadow-inner">
          <button
            type="button"
            onClick={() => onCityChange('nyc')}
            disabled={loading}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              city === 'nyc'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-void-800/50'
            }`}
          >
            New York (NYC)
          </button>
          <button
            type="button"
            onClick={() => onCityChange('dfw')}
            disabled={loading}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              city === 'dfw'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-void-800/50'
            }`}
          >
            Dallas-Fort Worth (DFW)
          </button>
        </div>

        {/* Right Actions: AI entry & Backend health */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenAiModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-950/60 to-purple-950/60 hover:from-indigo-900/60 hover:to-purple-900/60 border border-indigo-700/40 text-indigo-200 transition-all hover:border-indigo-500/60 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask VoidSpot</span>
            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Agent</span>
          </button>

          <div 
            title={backendHealthy ? "Backend connected (http://127.0.0.1:8000)" : "Backend offline"}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              backendHealthy 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="hidden md:inline">{backendHealthy ? 'API Active' : 'API Offline'}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
