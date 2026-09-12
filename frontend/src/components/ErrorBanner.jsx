import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff, CheckCircle } from 'lucide-react';

export default function ErrorBanner({ message, onRetry, isBackendDown }) {
  return (
    <div className="max-w-4xl mx-auto my-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 shadow-card backdrop-blur-sm animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-900/40 border border-rose-700/60 flex items-center justify-center text-rose-400 shrink-0">
            {isBackendDown ? <ServerOff className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200">
              {isBackendDown ? 'Backend Connection Error' : 'Analysis Request Error'}
            </h4>
            <p className="text-xs text-rose-300/80 mt-0.5 leading-relaxed">
              {message || 'VoidSpot backend is currently unavailable. Please make sure the API is running on port 8000.'}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-900/60 hover:bg-rose-800/60 text-rose-200 border border-rose-700/60 transition-colors shrink-0 self-end sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    </div>
  );
}
