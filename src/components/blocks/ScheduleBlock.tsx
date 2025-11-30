import React from 'react';
import { Clock, Calendar, Power, Play, AlertCircle } from 'lucide-react';
import { ScheduleBlockConfig, Block } from '../../types';
import { useBlockStore } from '../../store/useBlockStore';

interface ScheduleBlockProps {
  block: Block;
}

export const ScheduleBlock = ({ block }: ScheduleBlockProps) => {
  const { updateBlockConfig } = useBlockStore();
  const config = block.config as ScheduleBlockConfig;

  const frequencies = ['daily', 'weekly', 'monthly'];
  
  const handleToggle = () => {
    updateBlockConfig(block.id, { enabled: !config.enabled });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                 <Power size={18} />
              </div>
              <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${config.enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {config.enabled ? 'Schedule Active' : 'Schedule Paused'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                      Next run: {config.enabled ? 'Tomorrow, 09:00 AM' : '-'}
                  </span>
              </div>
          </div>
          <button 
             onClick={handleToggle}
             className={`
                px-3 py-1.5 rounded text-xs font-bold transition-all
                ${config.enabled 
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}
             `}
          >
              {config.enabled ? 'Stop' : 'Start'}
          </button>
      </div>

      {/* Config Form */}
      <div className={`space-y-4 transition-opacity ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {/* Frequency */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Frequency
             </label>
             <div className="flex gap-2">
                {frequencies.map(f => (
                    <button
                      key={f}
                      onClick={() => updateBlockConfig(block.id, { frequency: f as any })}
                      className={`
                        flex-1 py-2 text-xs font-medium rounded border transition-colors capitalize
                        ${config.frequency === f 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                      `}
                    >
                        {f}
                    </button>
                ))}
             </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Time
             </label>
             <input 
                type="time" 
                value={config.time || '09:00'}
                onChange={(e) => updateBlockConfig(block.id, { time: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
             />
          </div>
          
          {/* Environment Notice (Founder Feedback) */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2 flex gap-2 items-start">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/80 leading-tight">
                  <span className="font-bold text-amber-500">Note:</span> Automation runs in your local browser. Keep this tab open to execute scheduled tasks.
              </p>
          </div>
      </div>
    </div>
  );
};
