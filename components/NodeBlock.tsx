import React, { useEffect, useState } from 'react';
import { Node, NodeType } from '../types';
import { Database, Filter, LineChart, BarChart, PieChart, Sparkles, X, ChevronRight, GripVertical, Calculator, ListFilter, ArrowUpDown, Layers, AlertTriangle, AlertCircle, ScatterChart, CreditCard } from 'lucide-react';

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
            border: 'border-emerald-500/50', 
            shadow: 'shadow-emerald-900/20',
            iconColor: 'text-emerald-400', 
            gradient: 'from-emerald-500/10 to-emerald-500/0',
            icon: <Database className="w-5 h-5" />,
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
            border: 'border-blue-500/50', 
            shadow: 'shadow-blue-900/20',
            iconColor: 'text-blue-400', 
            gradient: 'from-blue-500/10 to-blue-500/0',
            icon: <Icon className="w-5 h-5" />,
            labelColor: 'text-blue-100'
        };
      case NodeType.VISUALIZE:
        let ChartIcon = LineChart;
        if (config.chartType === 'bar') ChartIcon = BarChart;
        if (config.chartType === 'pie') ChartIcon = PieChart;
        if (config.chartType === 'scatter') ChartIcon = ScatterChart;
        if (config.chartType === 'kpi') ChartIcon = CreditCard;

        return { 
            border: 'border-purple-500/50', 
            shadow: 'shadow-purple-900/20',
            iconColor: 'text-purple-400', 
            gradient: 'from-purple-500/10 to-purple-500/0',
            icon: <ChartIcon className="w-5 h-5" />,
            labelColor: 'text-purple-100'
        };
      case NodeType.AI_ANALYST:
        return { 
            border: 'border-amber-500/50', 
            shadow: 'shadow-amber-900/20',
            iconColor: 'text-amber-400', 
            gradient: 'from-amber-500/10 to-amber-500/0',
            icon: <Sparkles className="w-5 h-5" />,
            labelColor: 'text-amber-100'
        };
      default:
        return { 
            border: 'border-gray-500/50', 
            shadow: 'shadow-gray-900/20',
            iconColor: 'text-gray-400', 
            gradient: 'from-gray-500/10 to-gray-500/0',
            icon: <Database className="w-5 h-5" />,
            labelColor: 'text-gray-200'
        };
    }
  };

  const style = getNodeStyles(node.type, node.data.config);
  const rowCount = node.data.outputData?.length || 0;
  const isZeroRows = node.data.outputData && rowCount === 0;

  return (
    <div
      className={`absolute group flex flex-col w-72 bg-[#1e212b] rounded-xl overflow-visible transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#0f111a] ring-primary z-20' : 'border border-border hover:border-gray-500 z-10'}
        ${style.shadow} shadow-2xl
        ${flash ? 'ring-2 ring-emerald-400' : ''}
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
      onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          // ALLOW DRAGGING FROM BODY
          if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.closest('button') || target.isContentEditable) {
              return;
          }
          e.stopPropagation(); 
          onMouseDown(e, node.id);
      }}
      onMouseUp={(e) => {
          onConnectEnd(e, node.id);
      }}
    >
      {/* Header */}
      <div 
        className={`relative flex items-center justify-between p-3.5 rounded-t-xl bg-gradient-to-b ${style.gradient} border-b border-white/5`}
      >
          <div className="flex items-center gap-3 pointer-events-none">
            <div className={`p-1.5 rounded-md bg-black/40 border border-white/10 ${style.iconColor} shadow-sm`}>
                {style.icon}
            </div>
            <div>
                <h3 className={`text-base font-bold leading-tight ${style.labelColor}`}>{node.data.label}</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wider opacity-70">{node.data.subLabel || node.type.replace('_', ' ')}</p>
            </div>
          </div>
          
           <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors pointer-events-auto opacity-0 group-hover:opacity-100"
          >
              <X className="w-4 h-4" />
          </button>
      </div>

      {/* Body Content */}
      <div className="p-3">
        <div className="bg-black/20 rounded-lg p-3 border border-white/5 shadow-inner min-h-[3rem] flex flex-col justify-center">
            {node.type === NodeType.SOURCE && (
                <div className="text-sm flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Loaded Rows</span>
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{rowCount}</span>
                </div>
            )}
            {node.type === NodeType.TRANSFORM && (
                 <div className="text-sm flex justify-between items-center gap-2">
                    <span className="text-gray-400 truncate flex-1" title={node.data.config.summary}>{node.data.config.summary || 'Configure transformation'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                        {isZeroRows && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${isZeroRows ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                            {rowCount}
                        </span>
                    </div>
                 </div>
            )}
            {node.type === NodeType.VISUALIZE && (
                 <div className="text-sm flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Chart Type</span>
                    <span className="text-purple-400 font-medium capitalize">{node.data.config.chartType || 'None'}</span>
                 </div>
            )}
            {node.type === NodeType.AI_ANALYST && (
                 <div className="text-sm text-gray-400 truncate flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${node.data.aiAnalysis ? 'bg-amber-500' : 'bg-gray-600'}`}></div>
                    {node.data.aiAnalysis ? 'Insight ready' : 'Waiting for prompt...'}
                 </div>
            )}
        </div>
      </div>

      {/* Input Port */}
      {node.type !== NodeType.SOURCE && (
        <div 
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-30"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => {
                e.stopPropagation();
                onConnectEnd(e, node.id);
            }}
        >
            <div className={`w-3.5 h-3.5 rounded-full border-2 bg-[#1e212b] transition-all duration-200 
                border-gray-500 hover:border-primary hover:scale-150 hover:bg-primary`} 
            />
        </div>
      )}

      {/* Output Port */}
      {node.type !== NodeType.AI_ANALYST && node.type !== NodeType.VISUALIZE && (
        <div 
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair z-30"
            onMouseDown={(e) => {
                e.stopPropagation();
                onConnectStart(e, node.id);
            }}
        >
             <div className={`w-3.5 h-3.5 rounded-full border-2 bg-[#1e212b] transition-all duration-200 
                border-gray-500 hover:border-primary hover:scale-150 hover:bg-primary`}
            />
        </div>
      )}
    </div>
  );
};