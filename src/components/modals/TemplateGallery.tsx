import { X, LayoutTemplate, ArrowRight } from 'lucide-react';
import { Block, BlockType } from '../../types';
import { useBlockStore } from '../../store/useBlockStore';

interface Template {
  id: string;
  name: string;
  description: string;
  blocks: Block[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const templates: Template[] = [
  {
    id: 'marketing',
    name: 'Marketing Dashboard',
    description: 'Analyze ad performance and visualize campaign ROI.',
    blocks: [
      { id: generateId(), type: BlockType.LOAD, title: 'Facebook Ads Data', config: { fileName: 'fb_ads_q1.csv' }, status: 'success' },
      { id: generateId(), type: BlockType.TRANSFORM, title: 'Calculate ROI', config: { code: 'df["roi"] = df["revenue"] / df["spend"]' }, status: 'idle' },
      { id: generateId(), type: BlockType.VISUALIZE, title: 'ROI by Campaign', config: { chartType: 'bar', xAxis: 'campaign_name', yAxis: 'roi' }, status: 'idle' }
    ]
  },
  {
    id: 'retention',
    name: 'User Retention Analysis',
    description: 'Identify churn risks and generate action items.',
    blocks: [
      { id: generateId(), type: BlockType.LOAD, title: 'User Activity Logs', config: { fileName: 'user_logs.json' }, status: 'success' },
      { id: generateId(), type: BlockType.INSIGHT, title: 'Churn Risk Factors', config: {}, status: 'idle' },
      { id: generateId(), type: BlockType.ACTION, title: 'Re-engagement Email', config: {}, status: 'idle' }
    ]
  },
  {
    id: 'finance',
    name: 'Monthly Financial Report',
    description: 'Consolidate expenses and forecast next month.',
    blocks: [
        { id: generateId(), type: BlockType.LOAD, title: 'Expense Sheet', config: { fileName: 'expenses_march.xlsx' }, status: 'success' },
        { id: generateId(), type: BlockType.TRANSFORM, title: 'Group by Category', config: {}, status: 'idle' },
        { id: generateId(), type: BlockType.VISUALIZE, title: 'Expense Distribution', config: { chartType: 'pie' }, status: 'idle' },
        { id: generateId(), type: BlockType.INSIGHT, title: 'Budget Anomalies', config: {}, status: 'idle' }
      ]
  }
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateGallery = ({ isOpen, onClose }: TemplateGalleryProps) => {
  const setBlocks = useBlockStore(state => state.setBlocks);

  if (!isOpen) return null;

  const handleLoadTemplate = (template: Template) => {
    // Regenerate IDs to avoid conflicts if loaded multiple times (though we replace currently)
    const newBlocks = template.blocks.map(b => ({ ...b, id: generateId() }));
    setBlocks(newBlocks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
             <div className="flex items-center gap-2">
                <LayoutTemplate className="text-blue-400" size={20} />
                <h2 className="text-lg font-semibold text-slate-200">Template Gallery</h2>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white">
                <X size={20} />
             </button>
          </div>
          
          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950">
             {templates.map(template => (
                <div 
                  key={template.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
                  onClick={() => handleLoadTemplate(template)}
                >
                   <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                         <LayoutTemplate size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 uppercase tracking-wider">
                        {template.blocks.length} Blocks
                      </span>
                   </div>
                   <h3 className="text-base font-semibold text-slate-200 mb-1 group-hover:text-white">{template.name}</h3>
                   <p className="text-xs text-slate-400 leading-relaxed mb-4">{template.description}</p>
                   
                   <div className="flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Load Template <ArrowRight size={12} />
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

