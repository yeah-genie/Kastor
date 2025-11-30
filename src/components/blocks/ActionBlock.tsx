import { CheckCircle2, Circle, ArrowRight, Eye, Send, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export const ActionBlock = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);

  return (
    <div className="flex flex-col gap-4">
       <div className="flex flex-col gap-2">
         <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Action</h4>
            <div className="flex gap-1">
                <button 
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${showPreview ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-500 border-transparent hover:bg-slate-800'}`}
                >
                    <Eye size={10} /> Preview
                </button>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-500/20">AI Generated</span>
            </div>
         </div>

         {showPreview ? (
             // Slack Preview UI
             <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                 <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700 flex items-center gap-2">
                     <div className="p-1 bg-[#4A154B] rounded text-white"><MessageSquare size={12}/></div>
                     <span className="text-xs font-bold text-slate-300">#marketing-alerts</span>
                     <span className="text-[10px] text-slate-500 ml-auto">Bot</span>
                 </div>
                 <div className="p-3 space-y-2">
                     <div className="flex gap-3">
                         <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">K</div>
                         <div className="flex-1 space-y-1">
                             <div className="flex items-baseline gap-2">
                                 <span className="text-xs font-bold text-slate-200">Kastor Bot</span>
                                 <span className="text-[10px] text-slate-500">Just now</span>
                             </div>
                             <div className="text-xs text-slate-300 leading-relaxed">
                                 🚀 <span className="font-bold">Action Required: Ad Spend Update</span>
                                 <br/>
                                 Based on the latest ROAS analysis, we recommend increasing the APAC campaign budget.
                             </div>
                             <div className="pl-2 border-l-2 border-emerald-500 mt-2">
                                 <div className="text-[10px] text-slate-500 uppercase font-bold">Action Item</div>
                                 <div className="text-xs text-emerald-400 font-medium">Increase daily spend by 15% ($500 &rarr; $575)</div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         ) : (
             // Standard Card
             <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-lg shadow-lg shadow-black/20 border-l-4 border-l-emerald-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ArrowRight size={40} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-emerald-100 relative z-10">Increase ad spend on APAC campaign by 15%</p>
             </div>
         )}
       </div>

       <div>
         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Approval Checklist</h4>
         <div className="space-y-1">
           <div className="flex items-center gap-3 p-2.5 bg-slate-800/30 border border-transparent hover:border-slate-700 rounded-lg cursor-pointer group transition-all">
             <CheckCircle2 size={18} className="text-emerald-500" />
             <span className="text-sm text-slate-500 line-through">Budget Check</span>
           </div>
           <div className="flex items-center gap-3 p-2.5 bg-slate-800/30 border border-transparent hover:border-slate-700 rounded-lg cursor-pointer group transition-all">
             <Circle size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
             <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">Creative Assets Review</span>
           </div>
           <div className="flex items-center gap-3 p-2.5 bg-slate-800/30 border border-transparent hover:border-slate-700 rounded-lg cursor-pointer group transition-all">
             <Circle size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
             <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">Manager Approval</span>
           </div>
         </div>
       </div>
       
       <div className="mt-2 pt-4 border-t border-slate-800 flex justify-end">
          <button 
            onClick={() => setIsExecuted(true)}
            className={`px-4 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all
                ${isExecuted 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 cursor-default' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 border-transparent shadow-lg shadow-blue-600/20'}
            `}
            disabled={isExecuted}
          >
            {isExecuted ? (
                <>
                    <CheckCircle2 size={14} /> Sent
                </>
            ) : (
                <>
                    <Send size={14} /> Execute Action
                </>
            )}
          </button>
       </div>
    </div>
  );
};
