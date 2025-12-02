import { BlockConfig } from '../../types';
import { ArrowRight, X } from 'lucide-react';

interface DiffViewProps {
  original: Partial<BlockConfig>;
  modified: Partial<BlockConfig>;
  onAccept: () => void;
  onReject: () => void;
}

export const DiffView = ({ original, modified, onAccept, onReject }: DiffViewProps) => {
  // Helper to flatten and compare
  // For MVP, just showing mock JSON diff or key-value pairs
  
  const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(modified)]));
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Review Changes</h3>
        <div className="flex gap-2">
          <button onClick={onReject} className="text-slate-500 hover:text-red-400 transition-colors">
             <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
         {allKeys.map(key => {
            const oldVal = (original as any)[key];
            const newVal = (modified as any)[key];
            
            if (oldVal === newVal) return null;

            return (
              <div key={key} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs border-b border-slate-800/50 pb-2 last:border-0">
                 <div className="text-slate-500 font-mono truncate text-right" title={JSON.stringify(oldVal)}>
                    {oldVal !== undefined ? String(oldVal) : <span className="italic text-slate-600">null</span>}
                 </div>
                 <ArrowRight size={12} className="text-slate-600" />
                 <div className="text-blue-400 font-mono font-medium truncate" title={JSON.stringify(newVal)}>
                    {newVal !== undefined ? String(newVal) : <span className="italic text-slate-600">null</span>}
                 </div>
                 <div className="col-span-3 text-[10px] text-slate-500 font-bold uppercase text-center mt-1">{key}</div>
              </div>
            );
         })}
         {allKeys.length === 0 && (
            <div className="text-center text-xs text-slate-500 italic">No changes detected</div>
         )}
      </div>

      <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
        <button onClick={onReject} className="flex-1 py-1.5 rounded text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
           Reject
        </button>
        <button onClick={onAccept} className="flex-1 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
           Accept Changes
        </button>
      </div>
    </div>
  );
};

