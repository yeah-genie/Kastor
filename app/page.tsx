'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Package, Settings, CheckCircle2, XCircle } from 'lucide-react';
import { useDuckDBContext } from './providers/DuckDBProvider';
import { BlockPalette } from './components/panels/BlockPalette';
import { ResultsPanel } from './components/panels/ResultsPanel';
import { DataSourceConfigPanel } from './components/panels/configs/DataSourceConfigPanel';
import { useCanvasStore } from './lib/store';
import { DataSourceConfig } from './lib/types';

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
  const { isReady, executeQuery } = useDuckDBContext();
  const { selectedBlockId, nodes, updateBlockConfig, updateBlockStatus } = useCanvasStore();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [previewTable, setPreviewTable] = useState<string | undefined>(undefined);

  // Run test query when DuckDB is ready
  useEffect(() => {
    if (isReady) {
      const runTest = async () => {
        try {
          console.log('🦆 DuckDB is ready! Running test query...');
          const result = await executeQuery('SELECT 1 + 1 as result');
          console.log('✅ Test query result:', result);
          setTestResult(`Test query passed: 1 + 1 = ${result[0].result}`);
        } catch (error) {
          console.error('❌ Test query failed:', error);
          setTestError(error instanceof Error ? error.message : 'Unknown error');
        }
      };
      runTest();
    }
  }, [isReady, executeQuery]);

  // Get selected block
  const selectedBlock = nodes.find((n) => n.id === selectedBlockId);
  const isDataSource = selectedBlock?.data.type === 'datasource';

  const handlePreview = () => {
    if (isDataSource && selectedBlock) {
      const config = selectedBlock.data.config as DataSourceConfig;
      if (config.tableName) {
        setPreviewTable(config.tableName);
      }
    }
  };
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
            <BlockPalette />
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <BlockCanvas />
          </div>

          {/* Bottom Panel - Results */}
          <div className="h-[200px] bg-slate-900 border-t border-slate-800">
            <ResultsPanel previewTable={previewTable} />
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
            {!selectedBlock ? (
              <div className="text-sm text-slate-500 text-center mb-4">
                Select a block to configure
              </div>
            ) : isDataSource ? (
              <DataSourceConfigPanel
                blockId={selectedBlock.id}
                config={selectedBlock.data.config as DataSourceConfig}
                onConfigUpdate={(config) => updateBlockConfig(selectedBlock.id, config)}
                onPreview={handlePreview}
              />
            ) : (
              <div className="text-sm text-slate-500 text-center">
                Configuration for {selectedBlock.data.type} blocks coming soon
              </div>
            )}

            {/* DuckDB Status Test */}
            <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="text-xs font-semibold text-slate-400 mb-2">
                DuckDB Status
              </div>
              {testResult && (
                <div className="flex items-start gap-2 text-xs text-green-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}
              {testError && (
                <div className="flex items-start gap-2 text-xs text-red-400">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{testError}</span>
                </div>
              )}
              {!testResult && !testError && (
                <div className="text-xs text-slate-500">Testing...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
