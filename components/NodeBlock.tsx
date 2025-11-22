import React, { useEffect, useState } from 'react';
import { Node, NodeType } from '../types';
import { Database, Filter, LineChart, BarChart, PieChart, Sparkles, X, ChevronRight, GripVertical, Calculator, ListFilter, ArrowUpDown, Layers } from 'lucide-react';

interface NodeBlockProps {
  node: Node;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string) => void;
  onConnectEnd: (e: React.MouseEvent, id: string) => void;
}

export const NodeBlock: React.FC<NodeBlockProps> = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onMouseDown,
  onConnectStart,
  onConnectEnd
}) => {
  const [flash, setFlash] = useState(false);
  const prevDataLength = React.useRef(node.data.outputData?.length || 0);

  // Trigger flash animation when data updates
  useEffect(() => {
      const currentLength = node.data.outputData?.length || 0;
      if (currentLength !== prevDataLength.current) {
          setFlash(true);
          const timer = setTimeout(() => setFlash(false), 500);
          prevDataLength.current = currentLength;
          return () => clearTimeout(timer);
      }
  }, [node.data.outputData]);
  
  const getNodeStyles = (type: NodeType, config: any) => {
    switch (type) {
      case NodeType.SOURCE:
        return { 
            border: 'border-emerald-500', 
            shadow: 'shadow-emerald-900/20',
            iconColor: 'text-emerald-400', 
            gradient: 'from-emerald-500/20 to-transparent',
            icon: <Database className="w-4 h-4" />,
            labelColor: 'text-emerald-100'
        };
      case NodeType.TRANSFORM:
        // Dynamic icons for transform types
        let Icon = Filter;
        if (config.transformType === 'MATH') Icon = Calculator;
        if (config.transformType === 'SORT') Icon = ArrowUpDown;
        if (config.transformType === 'GROUP_BY') Icon = Layers;
        if (config.transformType === 'LIMIT') Icon = ListFilter;

        return { 
            border: 'border-blue-500', 
            shadow: 'shadow-blue-900/20',
            iconColor: 'text-blue-400', 
            gradient: 'from-blue-500/20 to-transparent',
            icon: <Icon className="w-4 h-4" />,
            labelColor: 'text-blue-100'
        };
      case NodeType.VISUALIZE:
        let ChartIcon = LineChart;
        if (config.chartType === 'bar') ChartIcon = BarChart;
        if (config.chartType === 'pie') ChartIcon = PieChart;

        return { 
            border: 'border-purple-500', 
            shadow: 'shadow-purple-900/20',
            iconColor: 'text-purple-400', 
            gradient: 'from-purple-500/20 to-transparent',
            icon: <ChartIcon className="w-4 h-4" />,
            labelColor: 'text-purple-100'
        };
      case NodeType.AI_ANALYST:
        return { 
            border: 'border-amber-500', 
            shadow: 'shadow-amber-900/20',
            iconColor: 'text-amber-400', 
            gradient: 'from-amber-500/20 to-transparent',
            icon: <Sparkles className="w-4 h-4" />,
            labelColor: 'text-amber-100'
        };
      default:
        return { 
            border: 'border-gray-500', 
            shadow: 'shadow-gray-900/20',
            iconColor: 'text-gray-400', 
            gradient: 'from-gray-500/20 to-transparent',
            icon: <Database className="w-4 h-4" />,
            labelColor: 'text-gray-200'
        };
    }
  };

  const style = getNodeStyles(node.type, node.data.config);

  return (
    <div
      className={`absolute group flex flex-col w-72 bg-surface rounded-xl overflow-visible transition-shadow duration-200
        ${isSelected ? 'ring-2 ring-primary z-20' : 'border border-border hover:border-gray-500 z-10'}
        ${style.shadow} shadow-xl backdrop-blur-sm
        ${flash ? 'animate-flash' : ''}
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: 'translate(-50%, -50%)', 
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        className={`relative flex items-center justify-between p-3 rounded-t-xl bg-gradient-to-b ${style.gradient} border-b border-white/5 cursor-grab active:cursor-grabbing`}
        onMouseDown={(e) => {
            e.stopPropagation(); 
            onMouseDown(e, node.id);
        }}
      >
          <div className="flex items-center gap-3">
            {/* Drag Icon */}
            <div className="text-gray-500 cursor-grab active:cursor-grabbing hover:text-gray-300">
                <GripVertical className="w-4 h-4" />
            </div>
            <div className={`p-1.5 rounded-md bg-black/20 backdrop-blur-md border border-white/10 ${style.iconColor}`}>
                {style.icon}
            </div>
            <div>
                <h3 className={`text-sm font-bold leading-tight ${style.labelColor}`}>{node.data.label}</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">{node.data.subLabel || node.type.replace('_', ' ')}</p>
            </div>
          </div>
          
           <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors"
          >
              <X className="w-4 h-4" />
          </button>
      </div>

      {/* Body Content */}
      <div className="p-3 bg-surface/50">
        <div className="bg-background/50 rounded-lg p-2 border border-border/50 shadow-inner min-h-[2.5rem] flex flex-col justify-center">
            {node.type === NodeType.SOURCE && (
                <div className="text-xs flex justify-between items-center">
                    <span className="text-gray-500">Loaded Rows</span>
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">{node.data.outputData?.length || 0}</span>
                </div>
            )}
            {node.type === NodeType.TRANSFORM && (
                 <div className="text-xs text-gray-400">
                    {node.data.config.summary || 'Configure transformation'}
                 </div>
            )}
            {node.type === NodeType.VISUALIZE && (
                 <div className="text-xs flex items-center justify-between">
                    <span className="text-gray-500">Chart Type</span>
                    <span className="text-purple-400 font-medium capitalize">{node.data.config.chartType || 'None'}</span>
                 </div>
            )}
            {node.type === NodeType.AI_ANALYST && (
                 <div className="text-xs text-gray-400 truncate flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${node.data.aiAnalysis ? 'bg-amber-500' : 'bg-gray-600'}`}></div>
                    {node.data.aiAnalysis ? 'Insight ready' : 'Waiting for prompt...'}
                 </div>
            )}
        </div>
      </div>

      {/* Input Port */}
      {node.type !== NodeType.SOURCE && (
        <div 
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center group/port cursor-crosshair z-30"
            onMouseUp={(e) => {
                e.stopPropagation();
                onConnectEnd(e, node.id);
            }}
        >
            <div className={`w-4 h-4 rounded-full border-2 bg-surface shadow-lg transition-all duration-200 
                border-gray-500 group-hover/port:border-primary group-hover/port:scale-125 group-hover/port:bg-primary group-hover/port:shadow-[0_0_10px_rgba(99,102,241,0.5)]`} 
            />
        </div>
      )}

      {/* Output Port */}
      {node.type !== NodeType.AI_ANALYST && node.type !== NodeType.VISUALIZE && (
        <div 
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center group/port cursor-crosshair z-30"
            onMouseDown={(e) => {
                e.stopPropagation();
                onConnectStart(e, node.id);
            }}
        >
             <div className={`w-4 h-4 rounded-full border-2 bg-surface shadow-lg transition-all duration-200 
                border-gray-500 group-hover/port:border-primary group-hover/port:scale-125 group-hover/port:bg-primary group-hover/port:shadow-[0_0_10px_rgba(99,102,241,0.5)] flex items-center justify-center`}
            >
                 <ChevronRight className="w-3 h-3 text-white opacity-0 group-hover/port:opacity-100" />
            </div>
        </div>
      )}
    </div>
  );
};