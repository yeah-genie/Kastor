'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Package, Settings, BarChart3 } from 'lucide-react';

// Dynamically import BlockCanvas to avoid SSR issues with React Flow
const BlockCanvas = dynamic(() => import('./components/canvas/BlockCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-slate-400">Loading canvas...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Block Palette */}
        <div className="w-[250px] bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-100">
              <Package className="w-5 h-5" />
              <h2 className="font-semibold">Block Palette</h2>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {/* Placeholder for block palette */}
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-400">
                Datasource
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-400">
                Filter
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-400">
                Aggregate
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-400">
                Sort
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-400">
                Chart
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-400">
                Insight
              </div>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <BlockCanvas />
          </div>

          {/* Bottom Panel - Results */}
          <div className="h-[200px] bg-slate-900 border-t border-slate-800 flex flex-col">
            <div className="p-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100">
                <BarChart3 className="w-4 h-4" />
                <h3 className="font-medium text-sm">Results</h3>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <div className="text-sm text-slate-500 text-center">
                Results will appear here when blocks are executed
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Config Panel */}
        <div className="w-[300px] bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-100">
              <Settings className="w-5 h-5" />
              <h2 className="font-semibold">Configuration</h2>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-sm text-slate-500 text-center">
              Select a block to configure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
