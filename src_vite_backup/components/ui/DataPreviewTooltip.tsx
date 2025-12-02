import { useMemo } from 'react';
import { Block } from '../../types';

interface DataPreviewTooltipProps {
  block: Block;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const DataPreviewTooltip = ({ block, isVisible, position }: DataPreviewTooltipProps) => {
  // Mock Data based on block type
  const mockRows = useMemo(() => {
    const seed = block.id.charCodeAt(0);
    return Array.from({ length: 3 }).map((_, i) => ({
      id: i + 1,
      value: Math.floor((i * seed + 100) % 500),
      category: ['A', 'B', 'C', 'D'][Math.floor((i + seed) % 4)],
      trend: (seed * (i + 1) % 10) > 5 ? '↑' : '↓'
    }));
  }, [block.id]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-[60] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output Preview</span>
        <span className="text-[10px] text-emerald-400 font-mono">3 rows</span>
      </div>
      
      <div className="space-y-1">
         <div className="grid grid-cols-4 gap-2 text-[9px] font-bold text-slate-600 uppercase pb-1">
            <span>ID</span>
            <span>Val</span>
            <span>Cat</span>
            <span>Trd</span>
         </div>
         {mockRows.map((row, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 border-b border-slate-800/30 last:border-0 pb-1">
               <span className="truncate font-mono">{row.id}</span>
               <span className="truncate font-mono text-slate-300">{row.value}</span>
               <span className="truncate font-mono">{row.category}</span>
               <span className={`truncate font-mono ${row.trend === '↑' ? 'text-emerald-500' : 'text-red-500'}`}>{row.trend}</span>
            </div>
         ))}
      </div>
      
      <div className="mt-2 text-[10px] text-slate-600 italic text-center">
         Double-click block to expand
      </div>
    </div>
  );
};
