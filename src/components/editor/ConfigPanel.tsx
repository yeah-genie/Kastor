import React from 'react';
import { Block, BlockType, ColumnInfo, FilterConfig, AggregateConfig, SortConfig, ChartConfig, DataSourceConfig, CSVFileInfo } from '../../lib/types';
import { Settings, Play, Trash2 } from 'lucide-react';

interface ConfigPanelProps {
  block: Block | null;
  availableColumns: ColumnInfo[];
  loadedTables: CSVFileInfo[];
  onUpdateConfig: (config: Partial<Block['config']>) => void;
  onExecute: () => void;
  onDelete: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  block,
  availableColumns,
  loadedTables,
  onUpdateConfig,
  onExecute,
  onDelete,
}) => {
  if (!block) {
    return (
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Select a block to configure</p>
      </div>
    );
  }

  const renderConfig = () => {
    switch (block.type) {
      case 'datasource':
        return <DataSourceConfigForm config={block.config as DataSourceConfig} loadedTables={loadedTables} onUpdate={onUpdateConfig} />;
      case 'filter':
        return <FilterConfigForm config={block.config as FilterConfig} columns={availableColumns} onUpdate={onUpdateConfig} />;
      case 'aggregate':
        return <AggregateConfigForm config={block.config as AggregateConfig} columns={availableColumns} onUpdate={onUpdateConfig} />;
      case 'sort':
        return <SortConfigForm config={block.config as SortConfig} columns={availableColumns} onUpdate={onUpdateConfig} />;
      case 'chart':
        return <ChartConfigForm config={block.config as ChartConfig} columns={availableColumns} onUpdate={onUpdateConfig} />;
      default:
        return <p className="text-zinc-500 text-sm">No configuration available</p>;
    }
  };

  const blockTypeLabels: Record<BlockType, string> = {
    datasource: 'Data Source',
    filter: 'Filter',
    aggregate: 'Aggregate',
    sort: 'Sort',
    chart: 'Chart',
    insight: 'Insight',
  };

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-white">
            {blockTypeLabels[block.type]}
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1 font-mono">{block.id}</p>
      </div>

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderConfig()}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <button
          onClick={onExecute}
          disabled={block.status === 'running'}
          className="
            w-full flex items-center justify-center gap-2 py-2 px-4
            bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700
            text-white font-medium rounded-lg
            transition-colors duration-150
          "
        >
          <Play className="w-4 h-4" />
          {block.status === 'running' ? 'Running...' : 'Execute'}
        </button>
        <button
          onClick={onDelete}
          className="
            w-full flex items-center justify-center gap-2 py-2 px-4
            bg-zinc-800 hover:bg-red-900/50 hover:text-red-400
            text-zinc-400 font-medium rounded-lg
            border border-zinc-700 hover:border-red-500/50
            transition-all duration-150
          "
        >
          <Trash2 className="w-4 h-4" />
          Delete Block
        </button>
      </div>
    </div>
  );
};

// Data Source Config Form
const DataSourceConfigForm: React.FC<{
  config: DataSourceConfig;
  loadedTables: CSVFileInfo[];
  onUpdate: (config: Partial<DataSourceConfig>) => void;
}> = ({ config, loadedTables, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Select Table
        </label>
        <select
          value={config.tableName}
          onChange={(e) => {
            const table = loadedTables.find(t => t.tableName === e.target.value);
            onUpdate({ 
              tableName: e.target.value,
              fileName: table?.fileName || e.target.value
            });
          }}
          className="
            w-full px-3 py-2 rounded-lg
            bg-zinc-800 border border-zinc-700
            text-zinc-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50
          "
        >
          <option value="">Select a table...</option>
          {loadedTables.map((table) => (
            <option key={table.tableName} value={table.tableName}>
              {table.fileName} ({table.tableName})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Filter Config Form
const FilterConfigForm: React.FC<{
  config: FilterConfig;
  columns: ColumnInfo[];
  onUpdate: (config: Partial<FilterConfig>) => void;
}> = ({ config, columns, onUpdate }) => {
  const operators = [
    { value: '=', label: 'Equals (=)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: 'contains', label: 'Contains' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Column</label>
        <select
          value={config.column}
          onChange={(e) => onUpdate({ column: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">Select column...</option>
          {columns.map((col) => (
            <option key={col.name} value={col.name}>
              {col.name} ({col.type})
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Operator</label>
        <select
          value={config.operator}
          onChange={(e) => onUpdate({ operator: e.target.value as FilterConfig['operator'] })}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Value</label>
        <input
          type="text"
          value={String(config.value)}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="Enter value..."
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
    </div>
  );
};

// Aggregate Config Form
const AggregateConfigForm: React.FC<{
  config: AggregateConfig;
  columns: ColumnInfo[];
  onUpdate: (config: Partial<AggregateConfig>) => void;
}> = ({ config, columns, onUpdate }) => {
  const aggregateFuncs = ['sum', 'avg', 'count', 'min', 'max'];

  const addMetric = () => {
    onUpdate({
      metrics: [...config.metrics, { column: columns[0]?.name || '', func: 'sum' }],
    });
  };

  const removeMetric = (index: number) => {
    onUpdate({
      metrics: config.metrics.filter((_, i) => i !== index),
    });
  };

  const updateMetric = (index: number, updates: Partial<{ column: string; func: string }>) => {
    onUpdate({
      metrics: config.metrics.map((m, i) =>
        i === index ? { ...m, ...updates } as AggregateConfig['metrics'][0] : m
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Group By</label>
        <select
          multiple
          value={config.groupBy}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, opt => opt.value);
            onUpdate({ groupBy: values });
          }}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px]"
        >
          {columns.map((col) => (
            <option key={col.name} value={col.name}>{col.name}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-300">Metrics</label>
          <button
            onClick={addMetric}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            + Add Metric
          </button>
        </div>
        <div className="space-y-2">
          {config.metrics.map((metric, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={metric.func}
                onChange={(e) => updateMetric(index, { func: e.target.value })}
                className="w-24 px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs"
              >
                {aggregateFuncs.map((f) => (
                  <option key={f} value={f}>{f.toUpperCase()}</option>
                ))}
              </select>
              <select
                value={metric.column}
                onChange={(e) => updateMetric(index, { column: e.target.value })}
                className="flex-1 px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs"
              >
                {columns.map((col) => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
              <button
                onClick={() => removeMetric(index)}
                className="px-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sort Config Form
const SortConfigForm: React.FC<{
  config: SortConfig;
  columns: ColumnInfo[];
  onUpdate: (config: Partial<SortConfig>) => void;
}> = ({ config, columns, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Column</label>
        <select
          value={config.column}
          onChange={(e) => onUpdate({ column: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">Select column...</option>
          {columns.map((col) => (
            <option key={col.name} value={col.name}>{col.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Direction</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ direction: 'asc' })}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              config.direction === 'asc'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Ascending ↑
          </button>
          <button
            onClick={() => onUpdate({ direction: 'desc' })}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              config.direction === 'desc'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Descending ↓
          </button>
        </div>
      </div>
    </div>
  );
};

// Chart Config Form
const ChartConfigForm: React.FC<{
  config: ChartConfig;
  columns: ColumnInfo[];
  onUpdate: (config: Partial<ChartConfig>) => void;
}> = ({ config, columns, onUpdate }) => {
  const chartTypes = ['line', 'bar', 'pie'];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Chart Type</label>
        <div className="flex gap-2">
          {chartTypes.map((type) => (
            <button
              key={type}
              onClick={() => onUpdate({ type: type as ChartConfig['type'] })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-colors ${
                config.type === type
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">X Axis</label>
        <select
          value={config.xAxis}
          onChange={(e) => onUpdate({ xAxis: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        >
          <option value="">Select column...</option>
          {columns.map((col) => (
            <option key={col.name} value={col.name}>{col.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Y Axis</label>
        <select
          value={config.yAxis}
          onChange={(e) => onUpdate({ yAxis: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        >
          <option value="">Select column...</option>
          {columns.map((col) => (
            <option key={col.name} value={col.name}>{col.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Title (optional)</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Chart title..."
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        />
      </div>
    </div>
  );
};

export default ConfigPanel;
