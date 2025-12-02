import { useBlockStore } from '../../store/useBlockStore';
import { X, Settings, Trash2, FileUp, Table, BarChart2, Filter, Lightbulb, PlayCircle, Edit2, Check, Database, Sparkles, Code } from 'lucide-react';
import { BlockType, Block } from '../../types';
import { useState } from 'react';

// Mock Configuration Components
const LoadConfig = () => (
  <div className="space-y-4">
    <div className="p-4 border border-dashed border-slate-700 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors cursor-pointer group">
      <div className="flex flex-col items-center gap-2 text-center">
        <FileUp className="text-slate-500 group-hover:text-blue-400 transition-colors" />
        <div>
          <p className="text-sm text-slate-300 font-medium">Upload File</p>
          <p className="text-xs text-slate-500">CSV, JSON, Excel</p>
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-500 uppercase">Data Preview</label>
      <div className="bg-slate-950 rounded border border-slate-800 p-2 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800">
          <Table size={12} />
          <span>sales_data_2024.csv</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 min-w-[200px]">
          <div className="font-medium text-slate-400">id</div><div className="font-medium text-slate-400">amount</div><div className="font-medium text-slate-400">date</div>
          <div className="text-slate-300">001</div><div className="text-slate-300">1,200</div><div className="text-slate-300">2024-01</div>
          <div className="text-slate-300">002</div><div className="text-slate-300">850</div><div className="text-slate-300">2024-01</div>
        </div>
      </div>
    </div>
  </div>
);

const TransformConfig = ({ block }: { block: Block }) => {
  const { updateBlockConfig } = useBlockStore();
  const config = block.config as { code?: string; description?: string; mode?: 'ai' | 'sql' };
  const [activeTab, setActiveTab] = useState<'ai' | 'sql'>(config.mode || 'ai');
  const [sqlCode, setSqlCode] = useState(config.code || 'SELECT * FROM df WHERE amount > 0');

  const handleModeChange = (mode: 'ai' | 'sql') => {
    setActiveTab(mode);
    updateBlockConfig(block.id, { mode });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSqlCode(e.target.value);
    updateBlockConfig(block.id, { code: e.target.value });
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => handleModeChange('ai')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'ai' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Sparkles size={14} />
          AI Logic
        </button>
        <button
          onClick={() => handleModeChange('sql')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'sql' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Database size={14} />
          SQL Editor
        </button>
      </div>

      {activeTab === 'ai' ? (
        <div className="space-y-2">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={14} className="text-purple-400" />
              <span className="text-sm text-slate-200 font-mono">Filter & Clean</span>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed space-y-1">
              <div className="flex gap-2">
                 <span className="text-slate-600">1.</span>
                 <span>Drop rows where <code className="bg-slate-800 px-1 rounded text-slate-300">amount</code> is null</span>
              </div>
              <div className="flex gap-2">
                 <span className="text-slate-600">2.</span>
                 <span>Convert <code className="bg-slate-800 px-1 rounded text-slate-300">date</code> to YYYY-MM format</span>
              </div>
            </div>
          </div>
          <button className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2">
            <Edit2 size={12} />
            Edit Instructions
          </button>
        </div>
      ) : (
        <div className="space-y-2">
            <div className="relative">
                <textarea 
                    value={sqlCode}
                    onChange={handleCodeChange}
                    className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-300 placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y leading-relaxed"
                    placeholder="SELECT * FROM ..."
                    spellCheck={false}
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-[10px] text-slate-500 border border-slate-800">
                    SQL
                </div>
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Code size={10} />
                Use standard SQL syntax. Table name is usually <code>df</code>.
            </p>
        </div>
      )}
    </div>
  );
};

const VisualizeConfig = ({ block }: { block: Block }) => {
  const { updateBlockConfig } = useBlockStore();
  const config = block.config as { chartType?: string; xAxis?: string; yAxis?: string; title?: string };
  const [chartType, setChartType] = useState(config.chartType || 'bar');
  const [xAxis, setXAxis] = useState(config.xAxis || 'Date');
  const [yAxis, setYAxis] = useState(config.yAxis || 'Amount');
  
  const isTimeSeries = xAxis === 'Date';
  const recommendedChart = isTimeSeries ? 'line' : 'bar';

  const handleChartChange = (type: string) => {
    setChartType(type);
    updateBlockConfig(block.id, { chartType: type });
  };

  const handleXAxisChange = (val: string) => {
    setXAxis(val);
    updateBlockConfig(block.id, { xAxis: val });
  };

  const handleYAxisChange = (val: string) => {
    setYAxis(val);
    updateBlockConfig(block.id, { yAxis: val });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {['bar', 'line', 'pie'].map(type => (
          <button 
            key={type} 
            onClick={() => handleChartChange(type)}
            className={`relative flex flex-col items-center gap-1 p-2 rounded border transition-all group 
                ${chartType === type ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-500 hover:text-slate-400'}
                ${type === recommendedChart && chartType !== type ? 'border-blue-500/30 bg-blue-900/10' : ''}
            `}
          >
            {type === recommendedChart && (
                <span className="absolute -top-2 -right-1 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-lg shadow-blue-500/20">BEST</span>
            )}
            <BarChart2 size={16} className={chartType === type ? 'text-blue-400' : 'text-slate-500'} />
            <span className="text-[10px] font-medium capitalize">{type}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase">X Axis</label>
        <select 
            value={xAxis} 
            onChange={(e) => handleXAxisChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded p-2 outline-none focus:border-blue-500 transition-colors"
        >
          <option>Date</option>
          <option>Category</option>
          <option>Region</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase">Y Axis</label>
        <select 
            value={yAxis} 
            onChange={(e) => handleYAxisChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded p-2 outline-none focus:border-blue-500 transition-colors"
        >
          <option>Amount</option>
          <option>Users</option>
        </select>
      </div>
    </div>
  );
};

const InsightConfig = ({ block }: { block: Block }) => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-500 uppercase">AI Analysis</span>
        </div>
        <p className="text-xs text-amber-200/80 leading-relaxed">
          Correlation found between ad spend and weekend traffic spikes.
        </p>
        <div className="mt-2 flex items-center gap-2">
           <span className="text-[10px] text-amber-500/70 uppercase">Confidence</span>
           <div className="h-1.5 flex-1 bg-amber-950 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-amber-500 rounded-full" />
           </div>
           <span className="text-[10px] text-amber-400 font-mono">85%</span>
        </div>
      </div>
      <button className="w-full py-2 bg-amber-900/20 text-amber-500 border border-amber-900/50 rounded text-xs font-medium hover:bg-amber-900/30 transition-colors">
        Regenerate Insights
      </button>
    </div>
  );
};

const ActionConfig = ({ block }: { block: Block }) => {
  const { updateBlockStatus } = useBlockStore();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = () => {
      setIsExecuting(true);
      updateBlockStatus(block.id, 'loading');
      setTimeout(() => {
          setIsExecuting(false);
          updateBlockStatus(block.id, 'success');
      }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <label className="text-xs font-medium text-slate-500 uppercase block mb-2">Action Type</label>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <PlayCircle size={16} className="text-emerald-500" />
          <span>Slack Notification</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase">Recipients</label>
        <input type="text" value="#marketing-team" readOnly className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-400 focus:border-emerald-500/50 outline-none transition-colors" />
      </div>
      <button 
        onClick={handleExecute}
        disabled={isExecuting || block.status === 'success'}
        className="w-full py-2 bg-emerald-900/20 text-emerald-500 border border-emerald-900/50 rounded text-xs font-medium hover:bg-emerald-900/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
         {isExecuting ? <span className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <Check size={12} />}
         {block.status === 'success' ? 'Executed' : 'Approve & Execute'}
      </button>
    </div>
  );
};

export const InspectorPanel = () => {
  const { selectedBlockIds, blocks, selectBlock, removeBlocks } = useBlockStore();
  
  // ... (Multi-select logic remains same)
  
  const isMultiSelect = selectedBlockIds.length > 1;
  const selectedBlock = blocks.find(b => b.id === selectedBlockIds[0]);

  if (selectedBlockIds.length === 0) {
    // ... (Empty state remains same)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/5">
          <Settings size={24} className="text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400">Select a block to configure</p>
        <p className="text-xs text-slate-600 mt-2">Click on any block in the stack to view details</p>
      </div>
    );
  }

  if (isMultiSelect) {
      // ... (Multi-select UI remains same)
      return (
        <div className="w-full h-full flex flex-col bg-slate-950">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500/20 p-1 rounded text-blue-400">
                        <Settings size={14} />
                    </div>
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{selectedBlockIds.length} Items Selected</h2>
                </div>
                <button onClick={() => selectBlock(null)} className="text-slate-500 hover:text-slate-300 p-1">
                    <X size={16} />
                </button>
            </div>
            <div className="p-6">
                <p className="text-sm text-slate-400 mb-4">Bulk actions for selected blocks:</p>
                <button 
                    onClick={() => {
                        removeBlocks(selectedBlockIds);
                        selectBlock(null);
                    }}
                    className="w-full py-2.5 px-4 bg-red-500/5 text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 hover:border-red-500/30 text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                    <Trash2 size={14} /> Delete {selectedBlockIds.length} Blocks
                </button>
            </div>
        </div>
      );
  }

  if (!selectedBlock) return null;

  const renderConfig = () => {
    switch (selectedBlock.type) {
      case BlockType.LOAD: return <LoadConfig />;
      case BlockType.TRANSFORM: return <TransformConfig block={selectedBlock} />;
      case BlockType.VISUALIZE: return <VisualizeConfig block={selectedBlock} />;
      case BlockType.INSIGHT: return <InsightConfig block={selectedBlock} />;
      case BlockType.ACTION: return <ActionConfig block={selectedBlock} />;
      case BlockType.SCHEDULE: return <ScheduleConfig block={selectedBlock} />;
      default: return <div className="text-xs text-slate-500 italic">No configuration available</div>;
    }
  };
// ... (Rest remains same)

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <Settings size={14} className="text-blue-500" />
           <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configuration</h2>
        </div>
        <button 
          onClick={() => selectBlock(null)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-800 rounded"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        <div className="space-y-1">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Block Type</label>
           <div className="text-sm font-medium text-slate-300 bg-slate-900 px-3 py-2 rounded border border-slate-800 flex items-center justify-between">
              {selectedBlock.type}
              <span className={`w-2 h-2 rounded-full ${selectedBlock.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
           </div>
        </div>
        
        <div className="space-y-1">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</label>
           <input 
             type="text" 
             value={selectedBlock.title}
             readOnly
             className="w-full text-sm p-2.5 border border-slate-800 rounded bg-slate-900 text-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
           />
        </div>

        <div className="pt-4 border-t border-slate-800/50">
           {renderConfig()}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={() => removeBlocks([selectedBlock.id])}
            className="w-full py-2.5 px-4 bg-red-500/5 text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 hover:border-red-500/30 text-sm font-medium transition-all flex items-center justify-center gap-2 group"
          >
            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
            Delete Block
          </button>
        </div>
      </div>
    </div>
  );
};
