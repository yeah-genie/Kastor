import React, { useCallback } from 'react';
import BlockCanvas from '../flow/BlockCanvas';
import BlockPalette from './BlockPalette';
import ConfigPanel from './ConfigPanel';
import ResultsPanel from './ResultsPanel';
import { useFlowStore } from '../../store/useFlowStore';
import { useDuckDB } from '../../hooks/useDuckDB';
import { useBlockExecution } from '../../hooks/useBlockExecution';
import { Block, ChartConfig } from '../../lib/types';
import { Loader2, Database } from 'lucide-react';

const DataEditor: React.FC = () => {
  const {
    nodes,
    selectedBlockId,
    loadedTables,
    tableColumns,
    blockResults,
    addLoadedTable,
    updateBlockConfig,
    deleteBlock,
    setTableColumns,
  } = useFlowStore();

  const { isReady, isLoading, error, loadCSV } = useDuckDB();
  const { executeBlock, getInputTableName } = useBlockExecution();

  // Get selected block
  const selectedBlock = selectedBlockId
    ? nodes.find((n) => n.id === selectedBlockId)?.data
    : null;

  // Get available columns for selected block
  const getAvailableColumns = useCallback(() => {
    if (!selectedBlock) return [];
    
    if (selectedBlock.type === 'datasource') {
      const tableName = (selectedBlock.config as { tableName?: string }).tableName;
      return tableName ? (tableColumns[tableName] || []) : [];
    }
    
    const inputTable = getInputTableName(selectedBlock.id);
    return inputTable ? (tableColumns[inputTable] || []) : [];
  }, [selectedBlock, tableColumns, getInputTableName]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const tableInfo = await loadCSV(file);
      addLoadedTable(tableInfo);
      setTableColumns(tableInfo.tableName, tableInfo.columns);
    } catch (err) {
      console.error('Failed to load CSV:', err);
    }
  }, [loadCSV, addLoadedTable, setTableColumns]);

  // Handle block config update
  const handleUpdateConfig = useCallback((config: Partial<Block['config']>) => {
    if (selectedBlockId) {
      updateBlockConfig(selectedBlockId, config);
    }
  }, [selectedBlockId, updateBlockConfig]);

  // Handle block execution
  const handleExecute = useCallback(async () => {
    if (selectedBlockId) {
      await executeBlock(selectedBlockId);
    }
  }, [selectedBlockId, executeBlock]);

  // Handle block deletion
  const handleDelete = useCallback(() => {
    if (selectedBlockId) {
      deleteBlock(selectedBlockId);
    }
  }, [selectedBlockId, deleteBlock]);

  // Get current result for results panel
  const currentResult = selectedBlockId ? blockResults[selectedBlockId] : null;
  const showChart = selectedBlock?.type === 'chart';
  const chartConfig = showChart ? (selectedBlock?.config as ChartConfig) : undefined;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-zinc-400">Initializing DuckDB...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4 p-8 bg-red-950/50 rounded-xl border border-red-500/30">
          <Database className="w-12 h-12 text-red-400" />
          <p className="text-red-400">Failed to initialize DuckDB</p>
          <p className="text-sm text-red-300/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Kastor</h1>
            <p className="text-xs text-zinc-500">Visual Data Analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isReady && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DuckDB Ready
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Block Palette */}
        <BlockPalette
          loadedTables={loadedTables}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
        />

        {/* Center - Canvas + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative">
            <BlockCanvas />
            
            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800">
                  <p className="text-zinc-400 text-lg mb-2">Drop blocks here to start</p>
                  <p className="text-zinc-600 text-sm">
                    Upload a CSV file, then drag a Data Source block
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Results Panel */}
          <ResultsPanel
            result={currentResult}
            chartConfig={chartConfig}
            showChart={showChart}
          />
        </div>

        {/* Right Panel - Config */}
        <ConfigPanel
          block={selectedBlock || null}
          availableColumns={getAvailableColumns()}
          loadedTables={loadedTables}
          onUpdateConfig={handleUpdateConfig}
          onExecute={handleExecute}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default DataEditor;
