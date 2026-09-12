import React from 'react';

export function TopOpportunitySkeleton() {
  return (
    <div className="mb-10 animate-pulse">
      <div className="h-6 w-64 bg-void-800 rounded-md mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-void-900 border border-void-800 rounded-2xl p-6 h-72">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-void-800 rounded" />
              <div className="h-8 w-60 bg-void-800 rounded" />
            </div>
            <div className="h-14 w-24 bg-void-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="h-16 bg-void-800 rounded-xl" />
            <div className="h-16 bg-void-800 rounded-xl" />
            <div className="h-16 bg-void-800 rounded-xl" />
            <div className="h-16 bg-void-800 rounded-xl" />
          </div>
        </div>
        <div className="bg-void-900 border border-void-800 rounded-2xl p-6 h-72">
          <div className="h-5 w-40 bg-void-800 rounded mb-4" />
          <div className="h-20 bg-void-800 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-void-800 rounded" />
            <div className="h-4 bg-void-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpportunityRankingSkeleton() {
  return (
    <div className="bg-void-900 border border-void-800 rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-void-800">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-void-800 rounded" />
          <div className="h-4 w-72 bg-void-800 rounded" />
        </div>
        <div className="h-9 w-60 bg-void-800 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-void-850 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
