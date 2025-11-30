import { Lightbulb, TrendingUp, ArrowUpRight, TrendingDown, ArrowDownRight, Activity, AlertTriangle, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useUIStore } from '../../store/useUIStore';

export const InsightBlock = ({ blockId }: { blockId?: string }) => {
  const { openPreviewModal } = useUIStore();

  // Dynamic Insight Generation based on Block ID (Seed)
  const insights = useMemo(() => {
    const seed = (blockId || 'default').charCodeAt(0);
    const scenario = seed % 3; // 0: SaaS, 1: Marketing, 2: Commerce

    if (scenario === 0) {
        return {
            id: 'saas',
            type: 'risk',
            title: 'Silent Churn Risk',
            metric: '12',
            metricLabel: 'At-Risk Accounts',
            change: '+3',
            isPositive: false,
            desc: 'High-value Enterprise accounts with 0 support tickets in 90 days.',
            highlight: 'Requires immediate outreach'
        };
    } else if (scenario === 1) {
        return {
            id: 'marketing',
            type: 'optimization',
            title: 'Low ROAS Alert',
            metric: '$420',
            metricLabel: 'Wasted Spend',
            change: '+15%',
            isPositive: false,
            desc: 'Instagram Ad Set "Retargeting_v2" is performing below target CPA.',
            highlight: 'Reallocate budget to Google'
        };
    } else {
        return {
            id: 'commerce',
            type: 'forecast',
            title: 'Stockout Warning',
            metric: '4 Days',
            metricLabel: 'Days until stockout',
            change: '-2',
            isPositive: false,
            desc: 'Sales velocity for "Summer T-Shirt" has doubled this week.',
            highlight: 'Order restock by Friday'
        };
    }
  }, [blockId]);

  const handleShowEvidence = (e: React.MouseEvent) => {
      e.stopPropagation();
      openPreviewModal(blockId || 'demo', `Evidence: ${insights.title}`, 'table', insights.id);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Main Metric - Clickable for Evidence */}
        <div 
            onClick={handleShowEvidence}
            className={`p-2.5 rounded-lg border relative overflow-hidden group transition-all cursor-pointer active:scale-95
            ${insights.isPositive 
                ? 'bg-blue-950/20 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-900/30' 
                : 'bg-red-950/10 border-red-500/20 hover:border-red-500/40 hover:bg-red-900/20'}
        `}>
           <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="p-1 rounded-full bg-slate-900/50 text-slate-400">
                   <Search size={10} />
               </div>
           </div>

           <div className="flex items-center justify-between mb-1 relative z-10">
             <span className={`text-[9px] font-bold uppercase tracking-wider ${insights.isPositive ? 'text-blue-400/80' : 'text-red-400/80'}`}>
                {insights.title}
             </span>
             {insights.isPositive ? <TrendingUp size={10} className="text-blue-400" /> : <AlertTriangle size={10} className="text-red-400" />}
           </div>
           <div className="flex items-end gap-1 relative z-10">
              <p className={`text-2xl font-black tracking-tight leading-none ${insights.isPositive ? 'text-blue-100' : 'text-red-100'}`}>
                {insights.metric}
              </p>
              <div className={`flex items-center pb-0.5 ${insights.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                 <span className="text-[10px] font-bold">{insights.change}</span>
              </div>
           </div>
           <p className={`text-[9px] mt-1 font-medium ${insights.isPositive ? 'text-blue-300/50' : 'text-red-300/50'}`}>{insights.metricLabel}</p>
           
           {/* Hover Tooltip Hint */}
           <div className="absolute bottom-1 right-2 text-[8px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
               Click for evidence
           </div>
        </div>

        {/* Forecast / Secondary */}
        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 relative overflow-hidden hover:border-slate-700 transition-all">
           <div className="flex items-center justify-between mb-1">
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Impact</span>
             <Activity size={10} className="text-slate-600" />
           </div>
           <p className="text-xl font-bold text-slate-300 leading-none">$42k</p>
           <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Revenue at Risk</p>
        </div>
      </div>

      {/* AI Insight Text */}
      <div className="bg-amber-950/10 border border-amber-500/20 rounded-lg p-2.5 relative hover:bg-amber-950/20 transition-all">
         <div className="flex items-center gap-1.5 mb-2">
           <Lightbulb size={12} className="text-amber-500" />
           <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Analysis</span>
         </div>
         <p className="text-[11px] text-amber-100/90 leading-snug font-medium">
            {insights.desc} <span className="text-amber-400 bg-amber-500/10 px-1 rounded block mt-1 w-fit">{insights.highlight}</span>
         </p>
      </div>
    </div>
  );
};
