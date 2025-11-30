import { Clock, CheckCircle2, XCircle, Trash2, Activity } from 'lucide-react';
import { useRunHistoryStore } from '../../store/useRunHistoryStore';

export const RunHistoryPanel = () => {
  const { history, clearHistory } = useRunHistoryStore();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDuration = (start: number, end?: number) => {
    if (!end) return 'Running...';
    const diff = end - start;
    return `${(diff / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
           <Activity size={16} className="text-blue-400" />
           <h3 className="text-sm font-semibold">Run History</h3>
        </div>
        <button 
          onClick={clearHistory}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors"
          title="Clear History"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {history.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8 italic">
                No runs recorded yet.
            </div>
        ) : (
            history.map(run => (
                <div key={run.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {run.status === 'success' ? (
                                <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : run.status === 'failed' ? (
                                <XCircle size={14} className="text-red-400" />
                            ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            )}
                            <span className="text-sm font-medium text-slate-200">{run.workflowName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{getDuration(run.startTime, run.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2">
                        <Clock size={10} />
                        {formatDate(run.startTime)}
                    </div>

                    {run.logs.length > 0 && (
                        <div className="bg-slate-950 rounded p-2 space-y-1 mt-2 border border-slate-800/50">
                            {run.logs.map((log, i) => (
                                <div key={i} className="text-[10px] font-mono text-slate-400 truncate">
                                    &gt; {log}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

