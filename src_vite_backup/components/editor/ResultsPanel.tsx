import React, { useState } from 'react';
import { QueryResult, ChartConfig } from '../../lib/types';
import { Table2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ResultsPanelProps {
  result: QueryResult | null;
  chartConfig?: ChartConfig;
  showChart?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16'];

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, chartConfig, showChart }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  if (!result) {
    return (
      <div className={`bg-zinc-900 border-t border-zinc-800 transition-all duration-200 ${isCollapsed ? 'h-10' : 'h-52'}`}>
        <div 
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-zinc-800/50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Results</span>
          </div>
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
        {!isCollapsed && (
          <div className="flex items-center justify-center h-32">
            <p className="text-zinc-600 text-sm">Execute a block to see results</p>
          </div>
        )}
      </div>
    );
  }

  const renderChart = () => {
    if (!chartConfig || !result.rows.length) return null;

    const data = result.rows.slice(0, 50); // Limit data points for performance

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey={chartConfig.xAxis} stroke="#71717a" fontSize={10} />
              <YAxis stroke="#71717a" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Bar dataKey={chartConfig.yAxis} fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey={chartConfig.xAxis} stroke="#71717a" fontSize={10} />
              <YAxis stroke="#71717a" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Line type="monotone" dataKey={chartConfig.yAxis} stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                dataKey={chartConfig.yAxis}
                nameKey={chartConfig.xAxis}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                label={({ name }) => name}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`bg-zinc-900 border-t border-zinc-800 transition-all duration-200 ${isCollapsed ? 'h-10' : 'h-52'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-zinc-800/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-300">Results</span>
            <span className="text-xs text-zinc-500">
              ({result.rowCount} rows × {result.columns.length} cols)
            </span>
          </div>
          
          {showChart && chartConfig && !isCollapsed && (
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('table'); }}
                className={`px-2 py-1 rounded text-xs ${viewMode === 'table' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Table
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('chart'); }}
                className={`px-2 py-1 rounded text-xs ${viewMode === 'chart' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Chart
              </button>
            </div>
          )}
        </div>
        
        {isCollapsed ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 h-40 overflow-auto">
          {viewMode === 'chart' && showChart && chartConfig ? (
            renderChart()
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="sticky top-0 bg-zinc-800">
                  {result.columns.map((col) => (
                    <th
                      key={col.name}
                      className="text-left px-3 py-2 text-zinc-300 font-medium border-b border-zinc-700"
                    >
                      {col.name}
                      <span className="text-zinc-600 font-normal ml-1">({col.type})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 100).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-zinc-800/50 border-b border-zinc-800/50"
                  >
                    {result.columns.map((col) => (
                      <td key={col.name} className="px-3 py-1.5 text-zinc-400">
                        {formatValue(row[col.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(null)';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  return String(value);
}

export default ResultsPanel;
