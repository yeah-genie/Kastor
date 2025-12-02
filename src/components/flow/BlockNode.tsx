import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Block, BlockType } from '../../lib/types';
import { 
  Database, 
  Filter, 
  Layers, 
  ArrowUpDown, 
  BarChart3, 
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

const blockTypeConfig: Record<BlockType, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  datasource: {
    label: 'Data Source',
    icon: Database,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/50',
    borderColor: 'border-emerald-500/30',
  },
  filter: {
    label: 'Filter',
    icon: Filter,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/50',
    borderColor: 'border-blue-500/30',
  },
  aggregate: {
    label: 'Aggregate',
    icon: Layers,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/50',
    borderColor: 'border-purple-500/30',
  },
  sort: {
    label: 'Sort',
    icon: ArrowUpDown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/50',
    borderColor: 'border-amber-500/30',
  },
  chart: {
    label: 'Chart',
    icon: BarChart3,
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/50',
    borderColor: 'border-rose-500/30',
  },
  insight: {
    label: 'Insight',
    icon: Lightbulb,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/50',
    borderColor: 'border-cyan-500/30',
  },
};

const StatusIcon: React.FC<{ status: Block['status'] }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return null;
  }
};

const BlockNode: React.FC<NodeProps<Block>> = ({ data, selected }) => {
  const config = blockTypeConfig[data.type];
  const Icon = config.icon;
  
  // Get display info from config
  const getDisplayInfo = () => {
    switch (data.type) {
      case 'datasource': {
        const cfg = data.config as { tableName?: string; fileName?: string };
        return cfg.fileName || cfg.tableName || 'No data';
      }
      case 'filter': {
        const cfg = data.config as { column?: string; operator?: string; value?: string };
        if (cfg.column && cfg.operator && cfg.value !== undefined) {
          return `${cfg.column} ${cfg.operator} ${cfg.value}`;
        }
        return 'Configure filter';
      }
      case 'aggregate': {
        const cfg = data.config as { groupBy?: string[]; metrics?: { func: string; column: string }[] };
        if (cfg.metrics && cfg.metrics.length > 0) {
          return cfg.metrics.map(m => `${m.func}(${m.column})`).join(', ');
        }
        return 'Configure aggregation';
      }
      case 'sort': {
        const cfg = data.config as { column?: string; direction?: string };
        if (cfg.column) {
          return `${cfg.column} ${cfg.direction?.toUpperCase() || 'ASC'}`;
        }
        return 'Configure sort';
      }
      case 'chart': {
        const cfg = data.config as { type?: string };
        return cfg.type ? `${cfg.type} chart` : 'Configure chart';
      }
      case 'insight':
        return 'AI Insight';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        relative min-w-[200px] rounded-xl border-2 backdrop-blur-sm
        transition-all duration-200 ease-out
        ${config.bgColor} ${config.borderColor}
        ${selected ? 'ring-2 ring-white/30 scale-105 shadow-xl' : 'shadow-lg'}
        hover:shadow-xl
      `}
    >
      {/* Input Handle */}
      {data.type !== 'datasource' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400 hover:!bg-zinc-400 transition-colors"
        />
      )}

      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${config.borderColor}`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className={`font-semibold text-sm ${config.color}`}>
          {config.label}
        </span>
        <div className="ml-auto">
          <StatusIcon status={data.status} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-xs text-zinc-400 truncate max-w-[180px]">
          {getDisplayInfo()}
        </p>
        {data.outputTableName && (
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            → {data.outputTableName}
          </p>
        )}
        {data.error && (
          <p className="text-xs text-red-400 mt-1 truncate">
            {data.error}
          </p>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400 hover:!bg-zinc-400 transition-colors"
      />
    </div>
  );
};

export default memo(BlockNode);
