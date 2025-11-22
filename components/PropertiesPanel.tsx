
import React, { useState, useRef } from 'react';
import { Node, NodeType, DatasetRow, TransformType } from '../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzeData } from '../services/geminiService';
import { Sparkles, Bot, Settings2, Table, Info, ChevronDown, ChevronUp, HelpCircle, Upload, FileSpreadsheet, AlertCircle, Download, FileText, CheckCircle2, Type, Hash, Calendar, Split, ArrowRight } from 'lucide-react';

interface PropertiesPanelProps {
  node: Node | null;
  inputData: DatasetRow[] | undefined;
  onUpdateNode: (id: string, newData: any) => void;
  height: number;
  isOpen: boolean;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

const ConfigTooltip = ({ content }: { content: string }) => (
  <div className="group relative inline-flex ml-1.5 cursor-help align-middle">
    <HelpCircle className="w-3 h-3 text-gray-500 hover:text-primary transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900/95 backdrop-blur border border-gray-700 text-xs text-gray-200 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] pointer-events-none text-left leading-relaxed">
      {content}
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
    </div>
  </div>
);

// Helper to get icon for column type
const getColumnIcon = (val: any) => {
    if (typeof val === 'number') return <Hash className="w-3 h-3 text-blue-400" />;
    if (typeof val === 'string') return <Type className="w-3 h-3 text-emerald-400" />;
    // Basic Date check logic (naive)
    if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 5) return <Calendar className="w-3 h-3 text-amber-400" />;
    return <HelpCircle className="w-3 h-3 text-gray-500" />;
}

const getTypeName = (val: any) => {
    if (typeof val === 'number') return 'Number';
    if (typeof val === 'string') return 'Text';
    return 'Unknown';
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
    node, 
    inputData, 
    onUpdateNode,
    height,
    isOpen,
    onToggle,
    onResizeStart
}) => {
  const [aiQuery, setAiQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For Source nodes, inputData IS the outputData. 
  // For Transform nodes, inputData is PRE-transform, node.data.outputData is POST-transform.
  const outputData = node?.type === NodeType.SOURCE ? node.data.outputData : node?.data.outputData;

  const columns = inputData && inputData.length > 0 ? Object.keys(inputData[0]) : [];
  const outputColumns = outputData && outputData.length > 0 ? Object.keys(outputData[0]) : [];

  // Health Check Metrics
  const healthCheck = outputData ? {
      rows: outputData.length,
      cols: outputColumns.length,
      nullCount: outputData.reduce((acc: number, row: any) => acc + Object.values(row).filter((v: any) => v === null || v === '' || v === undefined).length, 0)
  } : null;

  const handleConfigChange = (key: string, value: any) => {
    if (!node) return;
    const newConfig = { ...node.data.config, [key]: value };
    
    // Auto-update summary text
    let summary = node.data.config.summary;
    if (node.type === NodeType.TRANSFORM) {
        if (newConfig.transformType === TransformType.FILTER) summary = `Filter: ${newConfig.filterColumn || '?'} > ${newConfig.filterValue || '?'}`;
        if (newConfig.transformType === TransformType.SORT) summary = `Sort: ${newConfig.sortColumn || '?'}`;
        if (newConfig.transformType === TransformType.MATH) summary = `Math: ${newConfig.mathCol1 || '?'} ${newConfig.mathOp || '+'} ${newConfig.mathCol2 || '?'}`;
        if (newConfig.transformType === TransformType.LIMIT) summary = `Limit: Top ${newConfig.limitCount || '10'}`;
        if (newConfig.transformType === TransformType.RENAME) summary = `Rename: ${newConfig.renameColOld || '?'} -> ${newConfig.renameColNew || '?'}`;
        if (newConfig.transformType === TransformType.DROP) summary = `Drop: ${newConfig.dropColumn || '?'}`;
    }

    onUpdateNode(node.id, { ...node.data, config: { ...newConfig, summary } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && node) {
          const reader = new FileReader();
          reader.onload = (evt) => {
              const content = evt.target?.result as string;
              onUpdateNode(node.id, { 
                  ...node.data, 
                  fileName: file.name,
                  fileContent: content
              });
          };
          reader.readAsText(file);
      }
  };

  const handleExportCSV = () => {
      if (!outputData || outputData.length === 0) return;
      const headers = Object.keys(outputData[0]).join(',');
      const rows = outputData.map((row: any) => Object.values(row).join(',')).join('\n');
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `kastor_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const handleAiAnalysis = async (overrideQuery?: string) => {
    if (!node || !outputData || outputData.length === 0) return;
    const query = overrideQuery || aiQuery;
    if(!query) return;
    
    setIsAnalyzing(true);
    const result = await analyzeData(outputData, query);
    onUpdateNode(node.id, { ...node.data, aiAnalysis: result });
    setIsAnalyzing(false);
  };

  if (!node) {
    return (
      <div 
        className="bg-surface border-t border-border flex flex-col shadow-xl z-30 relative transition-all duration-200 ease-out"
        style={{ height: isOpen ? height : '40px' }}
      >
         <div className="h-1 w-full cursor-row-resize hover:bg-primary/50 absolute top-0 left-0 z-50" onMouseDown={onResizeStart}/>
        <div className="h-10 flex items-center justify-between px-4 border-b border-border bg-surfaceHighlight/30">
            <div className="flex items-center gap-2 text-gray-500">
                <Settings2 className="w-4 h-4" />
                <span className="text-xs">Properties</span>
            </div>
            <button onClick={onToggle} className="text-gray-500 hover:text-white">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div 
        className="bg-surface border-t border-border flex flex-col shadow-xl z-30 relative transition-all duration-75 ease-linear"
        style={{ height: isOpen ? height : '42px' }}
    >
      <div 
        className="absolute -top-1 left-0 w-full h-2 cursor-row-resize hover:bg-primary/50 z-50 group flex justify-center items-center"
        onMouseDown={onResizeStart}
      >
          <div className="w-12 h-1 bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <div className="h-[42px] flex items-center justify-between px-6 py-2 border-b border-border bg-surfaceHighlight/50 shrink-0 select-none">
          <div className="flex items-center gap-3">
              <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
                 {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                  {node.type.replace('_', ' ')}
              </span>
              <h2 className="font-semibold text-sm text-gray-200">{node.data.label}</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
             {healthCheck && (
                 <div className="flex items-center gap-3 bg-background/50 px-3 py-1 rounded-full border border-white/5">
                    <span className="flex items-center gap-1.5" title="Total Rows"><Table className="w-3 h-3 text-gray-500" /> {healthCheck.rows}</span>
                    <span className="w-px h-3 bg-gray-700"></span>
                    <span className="flex items-center gap-1.5" title="Columns"><div className="w-3 h-3 text-gray-500 font-bold border rounded flex items-center justify-center text-[8px]">C</div> {healthCheck.cols}</span>
                    {healthCheck.nullCount > 0 ? (
                        <span className="flex items-center gap-1.5 text-amber-500 font-medium" title="Empty cells found"><AlertCircle className="w-3 h-3" /> {healthCheck.nullCount} Issues</span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-emerald-500 font-medium" title="Data is clean"><CheckCircle2 className="w-3 h-3" /> Healthy</span>
                    )}
                 </div>
             )}
          </div>
      </div>

      {isOpen && (
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT CONFIGURATION COLUMN */}
        <div className="w-80 border-r border-border p-6 overflow-y-auto shrink-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                <Settings2 className="w-3 h-3" /> Configuration
            </h3>

            {node.type === NodeType.SOURCE && (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-200">{node.data.fileName || "Upload CSV File"}</span>
                        <span className="text-xs text-gray-500 mt-1">Click to select file</span>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".csv" 
                            onChange={handleFileUpload} 
                        />
                    </div>
                </div>
            )}

            {node.type === NodeType.TRANSFORM && inputData && (
                <div className="space-y-4">
                    {/* Filter Config */}
                    {node.data.config.transformType === TransformType.FILTER && (
                        <>
                             <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Filter Column
                                    <ConfigTooltip content="Select the column to check conditions against. Rows that don't match will be removed." />
                                </label>
                                <select 
                                    className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                    value={node.data.config.filterColumn || ''}
                                    onChange={(e) => handleConfigChange('filterColumn', e.target.value)}
                                >
                                    <option value="">Select Column</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <div>
                                 <label className="block text-xs font-medium text-gray-400 mb-1">
                                     Greater Than
                                     <ConfigTooltip content="Keep rows where the value is strictly larger than this number." />
                                 </label>
                                 <input 
                                    type="number" 
                                    className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                    value={node.data.config.filterValue ?? ''}
                                    onChange={(e) => handleConfigChange('filterValue', e.target.value === '' ? '' : Number(e.target.value))}
                                 />
                             </div>
                        </>
                    )}

                    {/* Sort Config */}
                    {node.data.config.transformType === TransformType.SORT && (
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                Sort By Column
                                <ConfigTooltip content="Reorder the dataset based on this column." />
                            </label>
                             <select 
                                className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                value={node.data.config.sortColumn || ''}
                                onChange={(e) => handleConfigChange('sortColumn', e.target.value)}
                            >
                                <option value="">Select Column</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="mt-2 flex gap-2">
                                <button 
                                    onClick={() => handleConfigChange('sortDirection', 'asc')}
                                    className={`flex-1 py-1 text-xs rounded border ${node.data.config.sortDirection === 'asc' ? 'bg-primary border-primary' : 'border-gray-600 text-gray-400'}`}
                                >Ascending</button>
                                <button 
                                    onClick={() => handleConfigChange('sortDirection', 'desc')}
                                    className={`flex-1 py-1 text-xs rounded border ${node.data.config.sortDirection !== 'asc' ? 'bg-primary border-primary' : 'border-gray-600 text-gray-400'}`}
                                >Descending</button>
                            </div>
                        </div>
                    )}

                    {/* Math Config */}
                    {node.data.config.transformType === TransformType.MATH && (
                        <>
                             <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Operation <ConfigTooltip content="Create a new column based on math between two existing columns." /></label>
                                {/* Type Safety Warning */}
                                {node.data.config.mathCol1 && inputData.length > 0 && typeof inputData[0][node.data.config.mathCol1] === 'string' && (
                                    <div className="mb-2 text-xs bg-amber-500/20 text-amber-200 p-2 rounded border border-amber-500/30 flex gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Warning: Column 1 is Text. Math may fail.</span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                     <select 
                                        className="flex-1 bg-background border border-border rounded p-2 text-xs"
                                        value={node.data.config.mathCol1 || ''}
                                        onChange={(e) => handleConfigChange('mathCol1', e.target.value)}
                                    >
                                        <option value="">Col 1</option>
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                     <select 
                                        className="w-16 bg-background border border-border rounded p-2 text-xs font-mono"
                                        value={node.data.config.mathOp || '+'}
                                        onChange={(e) => handleConfigChange('mathOp', e.target.value)}
                                    >
                                        <option value="+">+</option>
                                        <option value="-">-</option>
                                        <option value="*">×</option>
                                        <option value="/">÷</option>
                                    </select>
                                    <select 
                                        className="flex-1 bg-background border border-border rounded p-2 text-xs"
                                        value={node.data.config.mathCol2 || ''}
                                        onChange={(e) => handleConfigChange('mathCol2', e.target.value)}
                                    >
                                        <option value="">Col 2</option>
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                             </div>
                        </>
                    )}

                     {/* Limit Config */}
                    {node.data.config.transformType === TransformType.LIMIT && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Row Limit <ConfigTooltip content="Keep only the first N rows of the dataset." /></label>
                            <input 
                                type="number" 
                                className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200"
                                value={node.data.config.limitCount || 10}
                                onChange={(e) => handleConfigChange('limitCount', Number(e.target.value))}
                             />
                        </div>
                    )}

                     {/* Rename Config */}
                    {node.data.config.transformType === TransformType.RENAME && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Column to Rename</label>
                                <select 
                                    className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                    value={node.data.config.renameColOld || ''}
                                    onChange={(e) => handleConfigChange('renameColOld', e.target.value)}
                                >
                                    <option value="">Select Column</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">New Name</label>
                                <input 
                                    type="text"
                                    placeholder="Enter new name"
                                    className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                    value={node.data.config.renameColNew || ''}
                                    onChange={(e) => handleConfigChange('renameColNew', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Drop Config */}
                    {node.data.config.transformType === TransformType.DROP && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Column to Drop <ConfigTooltip content="Permanently remove this column from the dataset." /></label>
                             <select 
                                className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                value={node.data.config.dropColumn || ''}
                                onChange={(e) => handleConfigChange('dropColumn', e.target.value)}
                            >
                                <option value="">Select Column</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {node.type === NodeType.VISUALIZE && inputData && (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Chart Type
                            <ConfigTooltip content="Visual representation of data." />
                        </label>
                         <div className="text-sm font-semibold text-purple-400 bg-purple-500/10 px-3 py-2 rounded border border-purple-500/20 capitalize">
                             {node.data.config.chartType?.replace('-', ' ')}
                         </div>
                    </div>

                    {node.data.config.chartType === 'kpi' ? (
                         <div>
                             <label className="block text-xs font-medium text-gray-400 mb-1">
                                 Value Column
                                 <ConfigTooltip content="Select the column to display as a big number." />
                             </label>
                             <select 
                                 className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                 value={node.data.config.kpiColumn || ''}
                                 onChange={(e) => handleConfigChange('kpiColumn', e.target.value)}
                             >
                                 <option value="">Select Column</option>
                                 {columns.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                             <div className="mt-2 text-xs text-gray-500">Displays the sum of the selected column.</div>
                         </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    X Axis
                                    <ConfigTooltip content="The horizontal axis. Typically categories or dates." />
                                </label>
                                <select 
                                    className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                    value={node.data.config.xAxis || ''}
                                    onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                                >
                                    <option value="">Select Column</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Y Axis (Value)
                                    <ConfigTooltip content="The vertical axis. Must be a number." />
                                </label>
                                <select 
                                    className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 focus:border-primary outline-none"
                                    value={node.data.config.yAxis || ''}
                                    onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                                >
                                    <option value="">Select Column</option>
                                    {columns.map(c => (typeof inputData[0][c] === 'number' ? <option key={c} value={c}>{c}</option> : null))}
                                </select>
                            </div>
                        </>
                    )}
                 </div>
            )}

            {node.type === NodeType.AI_ANALYST && inputData && (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Ask Gemini
                            <ConfigTooltip content="Get insights about your data." />
                        </label>
                        
                        {/* Quick Prompts */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button onClick={() => handleAiAnalysis("Summarize this dataset in 3 bullet points.")} className="text-xs bg-surfaceHighlight hover:bg-white/10 border border-border rounded p-2 text-left text-gray-300 transition-colors">
                                📊 Summarize
                            </button>
                             <button onClick={() => handleAiAnalysis("Identify any outliers or anomalies in the numeric columns.")} className="text-xs bg-surfaceHighlight hover:bg-white/10 border border-border rounded p-2 text-left text-gray-300 transition-colors">
                                🧐 Find Outliers
                            </button>
                             <button onClick={() => handleAiAnalysis("What is the trend over time based on this data?")} className="text-xs bg-surfaceHighlight hover:bg-white/10 border border-border rounded p-2 text-left text-gray-300 transition-colors">
                                📈 Analyze Trend
                            </button>
                             <button onClick={() => handleAiAnalysis("Suggest 3 ways to visualize this data.")} className="text-xs bg-surfaceHighlight hover:bg-white/10 border border-border rounded p-2 text-left text-gray-300 transition-colors">
                                🎨 Visualization Ideas
                            </button>
                        </div>

                        <div className="relative">
                            <textarea 
                                className="w-full bg-background border border-border rounded p-2 text-sm text-gray-200 h-20 resize-none focus:border-primary outline-none pr-10"
                                placeholder="Or type your own question..."
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                            />
                            <button
                                onClick={() => handleAiAnalysis()}
                                disabled={isAnalyzing || !aiQuery}
                                className="absolute bottom-2 right-2 p-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-500 disabled:opacity-50 transition-colors"
                            >
                                {isAnalyzing ? <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> : <Sparkles className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>

        {/* RIGHT RESULT/PREVIEW COLUMN */}
        <div className="flex-1 bg-background p-6 overflow-y-auto no-scrollbar relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ backgroundImage: 'radial-gradient(#272a36 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.5 }}></div>
            
            <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Info className="w-3 h-3" /> {node.type === NodeType.VISUALIZE ? 'Visualization Preview' : node.type === NodeType.AI_ANALYST ? 'AI Insights' : 'Data Preview'}</span>
                    
                    <div className="flex items-center gap-2">
                        {node.type === NodeType.TRANSFORM && (
                            <button 
                                onClick={() => setShowDiff(!showDiff)}
                                className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors border ${showDiff ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-gray-400 hover:text-white'}`}
                            >
                                <Split className="w-3 h-3" /> Compare Before/After
                            </button>
                        )}

                        {(node.type === NodeType.SOURCE || node.type === NodeType.TRANSFORM) && (
                            <button onClick={handleExportCSV} className="text-[10px] bg-primary/20 text-primary hover:bg-primary/30 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                <Download className="w-3 h-3" /> Export CSV
                            </button>
                        )}
                    </div>
                </h3>

                {(node.type === NodeType.SOURCE || node.type === NodeType.TRANSFORM) && (
                    <div className={`flex-1 grid gap-4 ${showDiff ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        
                        {/* INPUT DATA (Only shown in diff mode for Transform nodes) */}
                        {showDiff && node.type === NodeType.TRANSFORM && (
                            <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm flex flex-col">
                                <div className="bg-surfaceHighlight/50 p-2 text-xs font-bold text-gray-500 border-b border-border flex items-center justify-between">
                                    <span>Input Data (Before)</span>
                                </div>
                                <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-surfaceHighlight text-gray-400 font-medium sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                {columns.map(c => (
                                                    <th key={c} className="px-4 py-3 border-b border-border whitespace-nowrap bg-surfaceHighlight group" title={getTypeName(inputData?.[0]?.[c])}>
                                                        <div className="flex items-center gap-2">
                                                            {inputData && getColumnIcon(inputData[0][c])}
                                                            {c}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-300 divide-y divide-border">
                                            {inputData?.slice(0, 100).map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    {columns.map(c => (
                                                        <td key={c} className="px-4 py-2 whitespace-nowrap opacity-70">{row[c]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* OUTPUT DATA */}
                        <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm flex-1 flex flex-col">
                             {showDiff && (
                                <div className="bg-surfaceHighlight/50 p-2 text-xs font-bold text-primary border-b border-border flex items-center justify-between">
                                    <span className="flex items-center gap-2">Output Data (After) <ArrowRight className="w-3 h-3" /></span>
                                </div>
                            )}
                            <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-surfaceHighlight text-gray-400 font-medium sticky top-0 z-20 shadow-sm">
                                        <tr>
                                            {outputColumns.map(c => (
                                                <th key={c} className="px-4 py-3 border-b border-border whitespace-nowrap bg-surfaceHighlight group" title={getTypeName(outputData?.[0]?.[c])}>
                                                    <div className="flex items-center gap-2">
                                                        {outputData && getColumnIcon(outputData[0][c])}
                                                        {c}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300 divide-y divide-border">
                                        {outputData?.slice(0, 100).map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                {outputColumns.map(c => (
                                                    <td key={c} className="px-4 py-2 whitespace-nowrap">{row[c]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-surfaceHighlight px-4 py-2 text-[10px] text-gray-500 border-t border-border flex justify-between shrink-0">
                               <span>Showing first 100 rows</span>
                               <span>Total: {outputData?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chart Preview */}
                {node.type === NodeType.VISUALIZE && (
                    <div className="flex-1 min-h-[200px] bg-surface border border-border rounded-lg p-4 flex flex-col">
                         {node.data.config.chartType === 'kpi' && node.data.config.kpiColumn ? (
                             <div className="flex-1 flex flex-col items-center justify-center">
                                 <span className="text-gray-500 text-sm uppercase tracking-wider mb-2">{node.data.config.kpiColumn}</span>
                                 <span className="text-5xl font-bold text-white">
                                     {outputData.reduce((acc: number, row: any) => acc + (Number(row[node.data.config.kpiColumn]) || 0), 0).toLocaleString()}
                                 </span>
                                 <span className="text-emerald-400 text-xs mt-2 bg-emerald-400/10 px-2 py-1 rounded-full">Total Sum</span>
                             </div>
                         ) : (node.data.config.chartType && node.data.config.xAxis && node.data.config.yAxis && outputData) ? (
                             <ResponsiveContainer width="100%" height="100%">
                                {node.data.config.chartType === 'bar' ? (
                                    <BarChart data={outputData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey={node.data.config.xAxis} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                                            itemStyle={{ color: '#f1f5f9' }}
                                            cursor={{ fill: '#334155', opacity: 0.4 }}
                                        />
                                        <Bar dataKey={node.data.config.yAxis} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : node.data.config.chartType === 'line' ? (
                                    <LineChart data={outputData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey={node.data.config.xAxis} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                                        />
                                        <Line type="monotone" dataKey={node.data.config.yAxis} stroke="#6366f1" strokeWidth={3} dot={{fill: '#6366f1', r: 4}} activeDot={{r: 6}} />
                                    </LineChart>
                                ) : node.data.config.chartType === 'scatter' ? (
                                    <ScatterChart>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" dataKey={node.data.config.xAxis} name={node.data.config.xAxis} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis type="number" dataKey={node.data.config.yAxis} name={node.data.config.yAxis} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                                        <Scatter name="Values" data={outputData} fill="#8884d8">
                                            {outputData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                ) : (
                                    <PieChart>
                                        <Pie
                                            data={outputData}
                                            dataKey={node.data.config.yAxis}
                                            nameKey={node.data.config.xAxis}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {outputData.map((entry: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                                        <Legend />
                                    </PieChart>
                                )}
                             </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                <BarChart className="w-8 h-8 opacity-50" />
                                <p>Configure axes to visualize data</p>
                            </div>
                        )}
                    </div>
                )}

                {node.type === NodeType.AI_ANALYST && (
                    <div className="flex-1 bg-surface border border-border rounded-lg p-6 overflow-y-auto no-scrollbar">
                         {node.data.aiAnalysis ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <div className="flex items-center gap-2 mb-4 text-amber-400">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="font-semibold">Gemini Analysis</span>
                                </div>
                                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                                    {node.data.aiAnalysis}
                                </div>
                            </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                                <Bot className="w-10 h-10 opacity-20" />
                                <p className="text-sm">Select a Quick Prompt or ask your own question</p>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>
      </div>
      )}
    </div>
  );
};
