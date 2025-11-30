import { useState } from 'react';
import { X, Plus, Trash2, Save, BrainCircuit } from 'lucide-react';
import { useGlobalRulesStore } from '../../store/useGlobalRulesStore';

interface GlobalRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalRulesModal = ({ isOpen, onClose }: GlobalRulesModalProps) => {
  const { rules, addRule, removeRule, updateRule } = useGlobalRulesStore();
  const [newRule, setNewRule] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newRule.trim()) {
      addRule(newRule.trim());
      setNewRule('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <BrainCircuit size={20} />
             </div>
             <div>
               <h2 className="text-lg font-semibold text-slate-200">Global Rules (Memory)</h2>
               <p className="text-xs text-slate-500">Teach AI how to behave across all workflows.</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-950/30">
           
           {/* Rules List */}
           <div className="space-y-3">
             {rules.length === 0 ? (
                <div className="text-center text-slate-500 py-8 italic border border-dashed border-slate-800 rounded-lg">
                    No rules defined yet. AI will use default behavior.
                </div>
             ) : (
                 rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 group">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        <div className="flex-1">
                             <input 
                                type="text" 
                                value={rule} 
                                onChange={(e) => updateRule(idx, e.target.value)}
                                className="w-full bg-transparent border-none text-sm text-slate-300 focus:ring-0 p-0 focus:border-b focus:border-purple-500 transition-colors"
                             />
                        </div>
                        <button 
                            onClick={() => removeRule(idx)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                 ))
             )}
           </div>

           {/* Add New Rule */}
           <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
              <input 
                type="text" 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="e.g., Always summarize data before visualizing..."
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button 
                onClick={handleAdd}
                disabled={!newRule.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
           </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end">
           <button 
             onClick={onClose}
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm font-medium transition-colors flex items-center gap-2"
           >
             <Save size={16} />
             Save & Close
           </button>
        </div>

      </div>
    </div>
  );
};

