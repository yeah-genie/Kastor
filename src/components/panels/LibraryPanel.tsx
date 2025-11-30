import { BlockType } from '../../types';
import { useBlockStore } from '../../store/useBlockStore';
import { 
  Upload, 
  Wand2, 
  BarChart3, 
  Lightbulb, 
  Zap,
  Box,
  Search,
  Folder,
  Calendar,
  Filter,
  ArrowUpDown,
  Combine,
  Layers,
  Eraser,
  MessageSquare,
  LayoutDashboard,
  Download,
  Bell,
  Globe,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const getBlockIcon = (type: BlockType) => {
  switch (type) {
    // Data
    case BlockType.LOAD: return <Upload size={18} />;
    case BlockType.API_CALL: return <Globe size={18} />;
    // Preprocessing
    case BlockType.TRANSFORM: return <Wand2 size={18} />;
    case BlockType.FILTER: return <Filter size={18} />;
    case BlockType.SORT: return <ArrowUpDown size={18} />;
    case BlockType.JOIN: return <Combine size={18} />;
    case BlockType.GROUP_BY: return <Layers size={18} />;
    case BlockType.CLEAN: return <Eraser size={18} />;
    // Analysis
    case BlockType.INSIGHT: return <Lightbulb size={18} />;
    case BlockType.ASK_AI: return <MessageSquare size={18} />;
    // Viz
    case BlockType.VISUALIZE: return <BarChart3 size={18} />;
    case BlockType.KPI_CARD: return <LayoutDashboard size={18} />;
    // Action
    case BlockType.ACTION: return <Zap size={18} />;
    case BlockType.EXPORT: return <Download size={18} />;
    case BlockType.NOTIFY: return <Bell size={18} />;
    // Control
    case BlockType.GROUP: return <Folder size={18} />;
    case BlockType.SCHEDULE: return <Calendar size={18} />;
    default: return <Box size={18} />;
  }
};

const getBlockDescription = (type: BlockType) => {
  switch (type) {
    case BlockType.LOAD: return "Import data from files/cloud";
    case BlockType.API_CALL: return "Fetch data from external API";
    case BlockType.TRANSFORM: return "AI-based data transformation";
    case BlockType.FILTER: return "Filter rows by condition";
    case BlockType.SORT: return "Sort data by column";
    case BlockType.JOIN: return "Merge two datasets";
    case BlockType.GROUP_BY: return "Aggregate data (sum, avg)";
    case BlockType.CLEAN: return "Remove nulls/duplicates";
    case BlockType.INSIGHT: return "Auto-detect patterns";
    case BlockType.ASK_AI: return "Q&A with your data";
    case BlockType.VISUALIZE: return "Create charts";
    case BlockType.KPI_CARD: return "Display key metric";
    case BlockType.ACTION: return "Trigger general action";
    case BlockType.EXPORT: return "Save result as file";
    case BlockType.NOTIFY: return "Send alerts (Slack/Email)";
    case BlockType.GROUP: return "Group blocks";
    case BlockType.SCHEDULE: return "Schedule run";
    default: return "Generic block";
  }
};

const CATEGORIES = [
  {
    id: 'data',
    label: 'Data Sources',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    blocks: [BlockType.LOAD, BlockType.API_CALL]
  },
  {
    id: 'prep',
    label: 'Preprocessing',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    blocks: [BlockType.TRANSFORM, BlockType.FILTER, BlockType.SORT, BlockType.JOIN, BlockType.GROUP_BY, BlockType.CLEAN]
  },
  {
    id: 'analysis',
    label: 'Analysis & AI',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    blocks: [BlockType.INSIGHT, BlockType.ASK_AI]
  },
  {
    id: 'viz',
    label: 'Visualization',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    blocks: [BlockType.VISUALIZE, BlockType.KPI_CARD]
  },
  {
    id: 'action',
    label: 'Actions',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    blocks: [BlockType.ACTION, BlockType.EXPORT, BlockType.NOTIFY]
  },
  {
    id: 'control',
    label: 'Flow Control',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    blocks: [] // Moved to Quick Actions
  }
];

export const LibraryPanel = () => {
  const addBlock = useBlockStore(state => state.addBlock);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
      'data': true,
      'prep': true,
      'analysis': true,
      'viz': true,
      'action': true,
      'control': false
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter Logic
  const filteredCategories = CATEGORIES.map(cat => {
    const matchingBlocks = cat.blocks.filter(blockType => 
        blockType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getBlockDescription(blockType).toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Also keep category if its label matches
    if (cat.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return { ...cat, blocks: matchingBlocks.length > 0 ? matchingBlocks : cat.blocks };
    }
    
    return { ...cat, blocks: matchingBlocks };
  }).filter(cat => cat.blocks.length > 0);

  // Auto-expand on search
  if (searchQuery && filteredCategories.length > 0) {
      filteredCategories.forEach(cat => {
          if (!openCategories[cat.id]) openCategories[cat.id] = true;
      });
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      
      {/* Quick Actions (Non-Core Blocks) */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800/50">
        <button 
            onClick={() => addBlock(BlockType.SCHEDULE)}
            className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all group"
            title="Schedule Workflow"
        >
            <div className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-md group-hover:bg-emerald-500/20">
                <Calendar size={16} />
            </div>
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-300">Schedule</span>
        </button>
        <button 
            onClick={() => addBlock(BlockType.GROUP)}
            className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all group"
            title="Group Blocks"
        >
            <div className="text-blue-400 bg-blue-500/10 p-1.5 rounded-md group-hover:bg-blue-500/20">
                <Folder size={16} />
            </div>
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-300">Group</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 mt-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blocks..." 
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {filteredCategories.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8">No blocks found.</div>
        ) : (
            filteredCategories.map(category => (
                <div key={category.id} className="space-y-1">
                    <button 
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                    >
                        <span>{category.label}</span>
                        {openCategories[category.id] || searchQuery ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    
                    {(openCategories[category.id] || searchQuery) && (
                        <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-1 duration-200">
                            {category.blocks.map(type => (
                                <button
                                    key={type}
                                    onClick={() => addBlock(type)}
                                    className="w-full group flex items-center gap-3 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition-all text-left hover:shadow-md"
                                >
                                    <div className={`p-2 rounded-md ${category.bgColor} ${category.color} ring-1 ring-inset ${category.borderColor}`}>
                                        {getBlockIcon(type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-200 group-hover:text-white text-sm truncate">{type.replace('_', ' ')}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{getBlockDescription(type)}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
      
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2">
            <Box size={14} />
            <span>v2.1.0 (Expanded)</span>
        </button>
      </div>
    </div>
  );
};
