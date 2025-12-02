import React from 'react';
import { BlockType, CSVFileInfo } from '../../lib/types';
import { 
  Database, 
  Filter, 
  Layers, 
  ArrowUpDown, 
  BarChart3, 
  Lightbulb,
  Upload,
  Table2
} from 'lucide-react';

interface BlockPaletteProps {
  loadedTables: CSVFileInfo[];
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const blockTypes: { type: BlockType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'datasource', label: 'Data Source', icon: Database, description: 'Load CSV data' },
  { type: 'filter', label: 'Filter', icon: Filter, description: 'Filter rows by condition' },
  { type: 'aggregate', label: 'Aggregate', icon: Layers, description: 'Group and summarize' },
  { type: 'sort', label: 'Sort', icon: ArrowUpDown, description: 'Order by column' },
  { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Visualize data' },
  { type: 'insight', label: 'Insight', icon: Lightbulb, description: 'AI analysis' },
];

const BlockPalette: React.FC<BlockPaletteProps> = ({ 
  loadedTables, 
  onFileUpload,
  isLoading 
}) => {
  const handleDragStart = (event: React.DragEvent, type: BlockType) => {
    event.dataTransfer.setData('application/blocktype', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      event.target.value = '';
    }
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-white">Blocks</h2>
        <p className="text-xs text-zinc-500 mt-1">Drag blocks to canvas</p>
      </div>

      {/* Block Types */}
      <div className="p-3 space-y-2 border-b border-zinc-800">
        {blockTypes.map(({ type, label, icon: Icon, description }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            className="
              flex items-center gap-3 p-3 rounded-lg
              bg-zinc-800/50 border border-zinc-700/50
              hover:bg-zinc-700/50 hover:border-zinc-600
              cursor-grab active:cursor-grabbing
              transition-all duration-150
              group
            "
          >
            <div className="p-2 rounded-lg bg-zinc-700/50 group-hover:bg-zinc-600/50 transition-colors">
              <Icon className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-500 truncate">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Sources Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Data Sources</h3>
          
          {/* File Upload */}
          <label className="
            flex items-center justify-center gap-2 p-3
            rounded-lg border-2 border-dashed border-zinc-700
            hover:border-emerald-500/50 hover:bg-emerald-950/20
            cursor-pointer transition-all duration-200
            group
          ">
            <Upload className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            <span className="text-sm text-zinc-400 group-hover:text-emerald-400 transition-colors">
              {isLoading ? 'Loading...' : 'Upload CSV'}
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>

        {/* Loaded Tables */}
        <div className="flex-1 overflow-y-auto p-3">
          {loadedTables.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4">
              No data loaded yet
            </p>
          ) : (
            <div className="space-y-2">
              {loadedTables.map((table) => (
                <div
                  key={table.tableName}
                  className="
                    p-3 rounded-lg
                    bg-emerald-950/30 border border-emerald-500/20
                  "
                >
                  <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300 truncate">
                      {table.tableName}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {table.columns.length} columns • {table.rowCount} rows
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockPalette;
