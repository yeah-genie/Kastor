'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Database,
  Filter,
  GitMerge,
  ArrowUpDown,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { BlockData, BlockType } from '@/app/lib/types';
import { useCanvasStore } from '@/app/lib/store';

// Icon mapping for block types
const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  datasource: <Database className="w-4 h-4" />,
  filter: <Filter className="w-4 h-4" />,
  aggregate: <GitMerge className="w-4 h-4" />,
  sort: <ArrowUpDown className="w-4 h-4" />,
  chart: <BarChart3 className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
};

// Color classes for block types
const BLOCK_COLOR_CLASSES: Record<BlockType, { bg: string; border: string; text: string }> = {
  datasource: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
  },
  filter: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  aggregate: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-400',
  },
  sort: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500',
    text: 'text-orange-400',
  },
  chart: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500',
    text: 'text-pink-400',
  },
  insight: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
  },
};

// Get config summary text
const getConfigSummary = (data: BlockData): string => {
  switch (data.type) {
    case 'datasource':
      return data.config.fileName || 'No file selected';
    case 'filter':
      return data.config.column
        ? `${data.config.column} ${data.config.operator} ${data.config.value}`
        : 'No filter configured';
    case 'aggregate':
      return data.config.metrics?.length
        ? `${data.config.metrics.length} metric(s)`
        : 'No metrics';
    case 'sort':
      return data.config.column
        ? `${data.config.column} (${data.config.direction})`
        : 'No column selected';
    case 'chart':
      return data.config.type || 'No chart type';
    case 'insight':
      return data.config.context || 'No context';
    default:
      return 'Not configured';
  }
};

const BlockNode = memo(({ data, selected }: NodeProps<BlockData>) => {
  const colorClasses = BLOCK_COLOR_CLASSES[data.type];
  const icon = BLOCK_ICONS[data.type];
  const configSummary = getConfigSummary(data);

  // Status indicator colors
  const statusColors = {
    idle: 'bg-slate-500',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <div
      className={`
        relative min-w-[250px] rounded-lg border-2 bg-slate-800
        ${colorClasses.border}
        ${selected ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-900' : ''}
        transition-all duration-200
      `}
    >
      {/* Target Handle (Input) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-slate-600 !border-2 !border-slate-400"
      />

      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 ${colorClasses.bg} border-b ${colorClasses.border}`}>
        <div className={colorClasses.text}>{icon}</div>
        <div className="flex-1">
          <div className={`font-medium ${colorClasses.text}`}>{data.label}</div>
        </div>
        {/* Status Indicator */}
        <div className={`w-2 h-2 rounded-full ${statusColors[data.status]}`} />
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="text-sm text-slate-400">{configSummary}</div>
        {data.error && (
          <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
            {data.error}
          </div>
        )}
        {data.outputTable && (
          <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 rounded px-2 py-1">
            Output: {data.outputTable}
          </div>
        )}
      </div>

      {/* Source Handle (Output) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-slate-600 !border-2 !border-slate-400"
      />
    </div>
  );
});

BlockNode.displayName = 'BlockNode';

export default BlockNode;
