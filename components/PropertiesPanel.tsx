import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeType, DatasetRow, TransformType } from '../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzeData } from '../services/geminiService';
import { Sparkles, Bot, Settings2, Table, Info, ChevronDown, ChevronUp, HelpCircle, Upload, AlertCircle, Download, CheckCircle2, Type, Hash, Calendar, Split, ArrowRight, Camera, CreditCard, Maximize2, Minimize2, X, GripHorizontal, Filter, Calculator, Layers, ListFilter, ArrowUpDown } from 'lucide-react';

interface PropertiesPanelProps {
  node: Node | null;
  inputData: DatasetRow[] | undefined;
  onUpdateNode: (id: string, newData: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'config' | 'preview';
  onTabChange: (tab: 'config' | 'preview') => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

const getColumnIcon = (val: any) => {
    if (typeof val === 'number') return <Hash className="w-3.5 h-3.5 text-blue-400" />;
    if (typeof val === 'string') return <Type className="w-3.5 h-3.5 text-emerald-400" />;
    if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 5) return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
    return <HelpCircle className="w-3.5 h-3.5 text-gray-500" />;
}

const getNodeIcon = (type: NodeType, config: any) => {
    if (type === NodeType.SOURCE) return <Table className="w-5 h-5" />;
    if (type === NodeType.AI_ANALYST) return <Sparkles className="w-5 h-5" />;
    if (type === NodeType.VISUALIZE) return <BarChart className="w-5 h-5" />;
    
    // Transforms
    if (config?.transformType === 'FILTER') return <Filter className="w-5 h-5" />;
    if (config?.transformType === 'MATH') return <Calculator className="w-5 h-5" />;
    if (config?.transformType === 'SORT') return <ArrowUpDown className="w-5 h-5" />;
    if (config?.transformType === 'GROUP_BY') return <Layers className="w-5 h-5" />;
    
    return <Settings2 className="w-5 h-5" />;
};

const getNodeColor = (type: NodeType) => {
    if (type === NodeType.SOURCE) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (type === NodeType.VISUALIZE) return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    if (type === NodeType.AI_ANALYST) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
}

// --- CUSTOM SELECT COMPONENT ---
interface Option {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

const CustomSelect = ({ value, options, onChange, placeholder, className, width = 'min-w-[140px]' }: { value: any, options: Option[], onChange: (val: any) => void, placeholder: string, className?: string, width?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as any)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block align-middle ${className} ${width}`}>
      <div 
        className={`
            flex items-center justify-between gap-2 bg-background border 
            ${isOpen ? 'border-primary ring-1 ring-primary' : 'border-primary/30 hover:border-primary/60'} 
            rounded px-3 h-10 cursor-pointer text-primary font-bold text-sm shadow-sm transition-all
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            <span className="truncate">{selectedOption ? selectedOption.label : <span className="text-gray-500 font-normal">{placeholder}</span>}</span>
        </div>
        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        // OPEN UPWARDS (bottom-full + mb-1)
        <div className="absolute bottom-full left-0 mb-1 w-full min-w-[220px] bg-surface border border-border rounded-lg shadow-2xl z-[100] max-h-60 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100">
            {options.length > 0 ? options.map((opt) => (
                <div 
                    key={opt.value}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 border-l-2
                        ${opt.value === value ? 'bg-primary/10 text-primary border-primary' : 'text-gray-300 hover:bg-white/5 border-transparent'}
                    `}
                    onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                    }}
                >
                    {opt.icon}
                    {opt.label}
                </div>
            )) : (
                <div className="px-4 py-3 text-sm text-gray-500 italic">No options</div>
            )}
        </div>
      )}
    </div>
  );
};


export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
    node, 
    inputData, 
    onUpdateNode,
    isOpen,
    onToggle,
    activeTab,
    onTabChange
}) => {
  const [aiQuery, setAiQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeHeaderStat, setActiveHeaderStat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging Logic
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging.current) {
            setPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        }
    };
    const handleMouseUp = () => {
        isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const outputData = node?.type === NodeType.SOURCE ? node.data.outputData : node?.data.outputData;
  const columns = inputData && inputData.length > 0 ? Object.keys(inputData[0]) : [];
  const outputColumns = outputData && outputData.length > 0 ? Object.keys(outputData[0]) : [];

  const columnOptions = columns.map(c => ({ 
      label: c, 
      value: c, 
      icon: inputData ? getColumnIcon(inputData[0][c]) : undefined 
  }));
  
  const numericColumnOptions = columns.filter(c => inputData && typeof inputData[0][c] === 'number').map(c => ({
       label: c, 
       value: c, 
       icon: <Hash className="w-3.5 h-3.5 text-blue-400" />
  }));

  const handleConfigChange = (key: string, value: any) => {
    if (!node) return;
    const newConfig = { ...node.data.config, [key]: value };
    let summary = node.data.config.summary;
    
    // Basic summary update logic
    if (node.type === NodeType.TRANSFORM) {
        if (newConfig.transformType === TransformType.FILTER) summary = `Filter: ${newConfig.filterColumn || '?'} > ${newConfig.filterValue || '?'}`;
        if (newConfig.transformType === TransformType.SORT) summary = `Sort: ${newConfig.sortColumn || '?'} (${newConfig.sortDirection === 'desc' ? 'Desc' : 'Asc'})`;
        if (newConfig.transformType === TransformType.MATH) summary = `Math: ${newConfig.mathCol1 || '?'} ${newConfig.mathOp || '+'} ${newConfig.mathCol2 || '?'}`;
        if (newConfig.transformType === TransformType.LIMIT) summary = `Top ${newConfig.limitCount || '10'} Rows`;
    }
    if (node.type === NodeType.VISUALIZE) {
        if(newConfig.chartType === 'bar' || newConfig.chartType === 'line') summary = `${newConfig.chartType} of ${newConfig.yAxis || '?'} by ${newConfig.xAxis || '?'}`;
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

  const handleExportImage = () => {
      const svg = document.querySelector('.recharts-surface');
      if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();
          const rect = svg.getBoundingClientRect();
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          
          img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
          img.onload = function() {
              if (ctx) {
                  ctx.fillStyle = "#1e212b"; 
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.scale(2, 2);
                  ctx.drawImage(img, 0, 0);
                  const a = document.createElement("a");
                  a.download = "chart.png";
                  a.href = canvas.toDataURL("image/png");
                  a.click();
              }
          };
      }
  };

  const handleAiAnalysis = async (overrideQuery?: string) => {
    if (!node || !outputData || outputData.length === 0) return;
    const query = overrideQuery || aiQuery;
    if(!query) return;
    setIsAnalyzing(true);
    const result = await analyzeData(outputData, query);
    onUpdateNode(node.id, { ...node.data, aiAnalysis: result });
    setIsAnalyzing(false);
  };

  const sentenceContainer = "bg-surfaceHighlight/30 border border-white/5 p-6 rounded-xl shadow-inner text-lg text-gray-300 leading-[4rem]";
  const slotInputClass = "bg-background border border-primary/30 text-center w-28 h-10 outline-none text-white rounded px-2 mx-1.5 focus:border-primary focus:ring-1 focus:ring-primary transition-all align-middle inline-block text-sm";

  const getColumnStats = (colName: string, data: any[]) => {
      const values = data.map(r => r[colName]);
      const numericValues = values.filter(v => typeof v === 'number');
      const nulls = values.filter(v => v === null || v === '' || v === undefined).length;
      return {
          min: numericValues.length ? Math.min(...numericValues) : 'N/A',
          max: numericValues.length ? Math.max(...numericValues) : 'N/A',
          nulls
      };
  };

  if (!node) return null;

  // --- MINIMIZED STATE (Mini Card) ---
  if (!isOpen) {
      const colorClass = getNodeColor(node.type);
      return (
          <div className="fixed bottom-6 right-6 z-40">
              <button 
                onClick={onToggle}
                className="group flex items-center gap-4 bg-surface/90 backdrop-blur-md border border-border shadow-2xl pl-4 pr-6 py-4 rounded-xl hover:bg-surfaceHighlight transition-all animate-in fade-in slide-in-from-bottom-4 hover:scale-105"
              >
                  <div className={`p-2.5 rounded-lg ${colorClass}`}>
                      {getNodeIcon(node.type, node.data.config)}
                  </div>
                  <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Editing</span>
                      <span className="font-semibold text-base text-gray-200 max-w-[180px] truncate">{node.data.label}</span>
                  </div>
                  <Maximize2 className="w-5 h-5 text-gray-500 group-hover:text-primary ml-2 transition-colors" />
              </button>
          </div>
      )
  }

  return (
    <div 
        className="fixed z-40 w-[550px] max-w-[90vw] max-h-[85vh] bg-surface border border-border rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{ 
            bottom: '24px', 
            right: '24px', 
            transform: `translate(${position.x}px, ${position.y}px)`
        }}
    >
      
      {/* Window Header - Drag Handle */}
      <div 
        className="h-16 flex items-center justify-between px-5 border-b border-border bg-surfaceHighlight/50 shrink-0 select-none cursor-grab active:cursor-grabbing group"
        onMouseDown={handleMouseDown}
      >
          <div className="flex items-center gap-4 overflow-hidden">
               {/* Grip Icon to hint draggable */}
              <GripHorizontal className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
              
              <div className={`p-2 rounded-md ${getNodeColor(node.type)}`}>
                  {getNodeIcon(node.type, node.data.config)}
              </div>
              <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{node.type}</span>
                  <span className="text-base font-semibold text-white truncate">{node.data.label}</span>
              </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={onToggle} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Minimize">
                <Minimize2 className="w-5 h-5" />
             </button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-background/50 shrink-0">
          <button 
            onClick={() => onTabChange('config')} 
            className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-primary text-white bg-surfaceHighlight/20' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Configuration
          </button>
          <button 
            onClick={() => onTabChange('preview')} 
            className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-primary text-white bg-surfaceHighlight/20' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Preview & Results
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface relative h-[500px]">
        
        {/* CONFIG TAB */}
        {activeTab === 'config' && (
            <div className="p-6 space-y-6">
                {node.type === NodeType.SOURCE && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-14 h-14 rounded-full bg-surfaceHighlight flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-7 h-7 text-gray-400 group-hover:text-primary" />
                            </div>
                            <span className="text-base font-medium text-gray-200">{node.data.fileName || "Upload CSV File"}</span>
                            <span className="text-sm text-gray-500 mt-1">Click to select a file from your computer</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </div>
                        <div className="text-sm text-gray-500 bg-surfaceHighlight/30 p-4 rounded border border-white/5">
                            <p className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> <strong>Smart Import:</strong> Commas in numbers (e.g., "1,200") are automatically removed.</p>
                        </div>
                    </div>
                )}

                {node.type === NodeType.TRANSFORM && inputData && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {node.data.config.transformType === TransformType.FILTER && (
                            <div className={sentenceContainer}>
                                I want to keep rows where the
                                <CustomSelect 
                                    value={node.data.config.filterColumn}
                                    onChange={(v) => handleConfigChange('filterColumn', v)}
                                    options={columnOptions}
                                    placeholder="Column"
                                    className="mx-2"
                                />
                                    column is greater than
                                    <input 
                                    type="number" 
                                    placeholder="Value"
                                    className={slotInputClass}
                                    value={node.data.config.filterValue === undefined ? '' : node.data.config.filterValue}
                                    onChange={(e) => handleConfigChange('filterValue', e.target.value === '' ? '' : Number(e.target.value))}
                                    />.
                            </div>
                        )}

                        {node.data.config.transformType === TransformType.SORT && (
                            <div className={sentenceContainer}>
                                Please sort the table by
                                <CustomSelect 
                                    value={node.data.config.sortColumn}
                                    onChange={(v) => handleConfigChange('sortColumn', v)}
                                    options={columnOptions}
                                    placeholder="Column"
                                    className="mx-2"
                                />
                                    in
                                    <CustomSelect 
                                    value={node.data.config.sortDirection || 'asc'}
                                    onChange={(v) => handleConfigChange('sortDirection', v)}
                                    options={[{label: 'Ascending (A-Z)', value: 'asc'}, {label: 'Descending (Z-A)', value: 'desc'}]}
                                    placeholder="Order"
                                    className="mx-2"
                                    width="w-40"
                                    />
                                    order.
                            </div>
                        )}

                        {node.data.config.transformType === TransformType.MATH && (
                            <div className="space-y-4">
                                <div className={sentenceContainer}>
                                    Create a new column by calculating:
                                    <div className="flex items-center mt-3 flex-wrap gap-2">
                                            <CustomSelect 
                                            value={node.data.config.mathCol1}
                                            onChange={(v) => handleConfigChange('mathCol1', v)}
                                            options={columnOptions}
                                            placeholder="Col 1"
                                            />
                                            <CustomSelect 
                                            value={node.data.config.mathOp || '+'}
                                            onChange={(v) => handleConfigChange('mathOp', v)}
                                            options={[{label:'+', value:'+'}, {label:'-', value:'-'}, {label:'×', value:'*'}, {label:'÷', value:'/'}]}
                                            placeholder="Op"
                                            width="w-20 min-w-0"
                                            />
                                            <CustomSelect 
                                            value={node.data.config.mathCol2}
                                            onChange={(v) => handleConfigChange('mathCol2', v)}
                                            options={columnOptions}
                                            placeholder="Col 2"
                                            />
                                    </div>
                                </div>
                            </div>
                        )}

                        {node.data.config.transformType === TransformType.LIMIT && (
                            <div className={sentenceContainer}>
                                I only want to see the top
                                <input 
                                    type="number" 
                                    className={slotInputClass}
                                    value={node.data.config.limitCount || 10}
                                    onChange={(e) => handleConfigChange('limitCount', Number(e.target.value))}
                                    />
                                rows.
                            </div>
                        )}
                    </div>
                )}

                {node.type === NodeType.VISUALIZE && inputData && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {(node.data.config.chartType === 'bar' || node.data.config.chartType === 'line' || node.data.config.chartType === 'scatter') && (
                            <div className={sentenceContainer}>
                                Visualize data as a <span className="font-bold text-primary capitalize">{node.data.config.chartType} Chart</span>.
                                <br/>
                                Use
                                <CustomSelect 
                                    value={node.data.config.xAxis}
                                    onChange={(v) => handleConfigChange('xAxis', v)}
                                    options={columnOptions}
                                    placeholder="X Axis"
                                    className="mx-2"
                                />
                                for the X-Axis
                                <br/>
                                and
                                <CustomSelect 
                                    value={node.data.config.yAxis}
                                    onChange={(v) => handleConfigChange('yAxis', v)}
                                    options={numericColumnOptions}
                                    placeholder="Y Axis"
                                    className="mx-2"
                                />
                                for the Y-Axis.
                            </div>
                        )}
                        {node.data.config.chartType === 'pie' && (
                            <div className={sentenceContainer}>
                                Create a <span className="font-bold text-primary">Pie Chart</span>.
                                <br/>
                                Use
                                <CustomSelect 
                                    value={node.data.config.xAxis}
                                    onChange={(v) => handleConfigChange('xAxis', v)}
                                    options={columnOptions}
                                    placeholder="Category"
                                    className="mx-2"
                                />
                                for labels and
                                <CustomSelect 
                                    value={node.data.config.yAxis}
                                    onChange={(v) => handleConfigChange('yAxis', v)}
                                    options={numericColumnOptions}
                                    placeholder="Value"
                                    className="mx-2"
                                />
                                for slice size.
                            </div>
                        )}
                        {node.data.config.chartType === 'kpi' && (
                            <div className={sentenceContainer}>
                                Show a <span className="font-bold text-primary">KPI Card</span> displaying the total sum of
                                <CustomSelect 
                                    value={node.data.config.kpiColumn}
                                    onChange={(v) => handleConfigChange('kpiColumn', v)}
                                    options={numericColumnOptions}
                                    placeholder="Column"
                                    className="mx-2"
                                />.
                            </div>
                        )}
                    </div>
                )}

                {node.type === NodeType.AI_ANALYST && inputData && (
                    <div className="space-y-3">
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-xl p-5">
                            <h4 className="text-base font-bold text-amber-500 mb-4 flex items-center gap-2"><Bot className="w-5 h-5"/> Ask Gemini</h4>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <button onClick={() => handleAiAnalysis("Summarize this dataset in 3 bullet points.")} className="text-sm bg-surface border border-border/50 hover:border-amber-500/50 rounded-lg p-3 text-left text-gray-300 transition-colors">📊 Summarize this dataset</button>
                                <button onClick={() => handleAiAnalysis("Identify any outliers or anomalies in the numeric columns.")} className="text-sm bg-surface border border-border/50 hover:border-amber-500/50 rounded-lg p-3 text-left text-gray-300 transition-colors">🧐 Find unusual numbers (outliers)</button>
                                <button onClick={() => handleAiAnalysis("Suggest 3 ways to visualize this data.")} className="text-sm bg-surface border border-border/50 hover:border-amber-500/50 rounded-lg p-3 text-left text-gray-300 transition-colors">🎨 How should I graph this?</button>
                            </div>
                            <div className="relative">
                                <textarea 
                                    className="w-full bg-surface border border-border/50 rounded-lg p-3 text-sm text-gray-200 h-28 resize-none focus:border-amber-500 outline-none pr-10 shadow-inner"
                                    placeholder="Or type your own question..."
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                />
                                <button
                                    onClick={() => handleAiAnalysis()}
                                    disabled={isAnalyzing || !aiQuery}
                                    className="absolute bottom-3 right-3 p-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 disabled:opacity-50 transition-colors"
                                >
                                    {isAnalyzing ? <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> : <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {/* PREVIEW TAB */}
        {activeTab === 'preview' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
                <div className="flex-1 overflow-auto no-scrollbar">
                    {/* --- CHART RESULT --- */}
                    {node.type === NodeType.VISUALIZE && (
                        <div className="h-full p-6 flex flex-col">
                            <div className="flex justify-end mb-3">
                                <button onClick={handleExportImage} className="text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-4 py-2 rounded flex items-center gap-2 transition-colors border border-purple-500/20 hover:border-purple-500/50">
                                    <Camera className="w-4 h-4" /> Save Image
                                </button>
                            </div>
                            <div className="flex-1 min-h-[300px] bg-surface border border-border rounded-lg p-4">
                                {node.data.config.chartType === 'kpi' && node.data.config.kpiColumn ? (
                                     <div className="h-full flex flex-col items-center justify-center">
                                        <span className="text-gray-500 text-sm uppercase tracking-wider mb-2">{node.data.config.kpiColumn}</span>
                                        <span className="text-6xl font-bold text-white">
                                            {outputData?.reduce((acc: number, row: any) => acc + (Number(row[node.data.config.kpiColumn]) || 0), 0).toLocaleString()}
                                        </span>
                                    </div>
                                ) : outputData && outputData.length > 0 && node.data.config.xAxis ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {node.data.config.chartType === 'bar' ? (
                                            <BarChart data={outputData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey={node.data.config.xAxis} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                                                <Bar dataKey={node.data.config.yAxis} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        ) : node.data.config.chartType === 'line' ? (
                                            <LineChart data={outputData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey={node.data.config.xAxis} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                                                <Line type="monotone" dataKey={node.data.config.yAxis} stroke="#6366f1" strokeWidth={3} dot={{fill: '#6366f1', r: 4}} />
                                            </LineChart>
                                        ) : node.data.config.chartType === 'scatter' ? (
                                            <ScatterChart>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis type="number" dataKey={node.data.config.xAxis} name={node.data.config.xAxis} stroke="#94a3b8" fontSize={12} />
                                                <YAxis type="number" dataKey={node.data.config.yAxis} name={node.data.config.yAxis} stroke="#94a3b8" fontSize={12} />
                                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                                                <Scatter name="Values" data={outputData} fill="#8884d8">
                                                    {outputData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        ) : (
                                            <PieChart>
                                                <Pie data={outputData} dataKey={node.data.config.yAxis} nameKey={node.data.config.xAxis} cx="50%" cy="50%" outerRadius={100} label>
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
                                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">No Data to visualize</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TABLE PREVIEW --- */}
                    {(node.type === NodeType.SOURCE || node.type === NodeType.TRANSFORM) && (
                        <div className="h-full flex flex-col">
                             <div className="bg-surfaceHighlight p-3 flex items-center justify-between border-b border-border">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <Table className="w-4 h-4" /> 
                                    <span>{outputData?.length || 0} Rows</span>
                                    <span>•</span>
                                    <span>{outputColumns.length} Cols</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExportCSV} className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded flex items-center gap-1 border border-primary/20">
                                        <Download className="w-3.5 h-3.5" /> CSV
                                    </button>
                                </div>
                             </div>

                             <div className="flex-1 overflow-auto no-scrollbar relative">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-surfaceHighlight sticky top-0 z-20">
                                        <tr>
                                            {outputColumns.map(c => (
                                                <th 
                                                    key={c} 
                                                    className="px-5 py-3 border-b border-border whitespace-nowrap font-medium text-gray-400 hover:text-white cursor-pointer group relative"
                                                    onClick={() => setActiveHeaderStat(activeHeaderStat === c ? null : c)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {outputData && getColumnIcon(outputData[0][c])}
                                                        {c}
                                                    </div>
                                                    {activeHeaderStat === c && outputData && (
                                                        <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-border rounded shadow-xl p-4 z-50 text-xs min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
                                                            <div className="text-gray-500 mb-2 uppercase font-bold">Stats</div>
                                                            {(() => {
                                                                const stats = getColumnStats(c, outputData);
                                                                return (
                                                                    <div className="space-y-1.5 text-gray-300">
                                                                        <div className="flex justify-between"><span>Min:</span> <span className="font-mono text-white">{stats.min}</span></div>
                                                                        <div className="flex justify-between"><span>Max:</span> <span className="font-mono text-white">{stats.max}</span></div>
                                                                        <div className="flex justify-between"><span>Nulls:</span> <span className={`${stats.nulls > 0 ? 'text-amber-500' : 'text-emerald-500'} font-mono`}>{stats.nulls}</span></div>
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300 divide-y divide-border">
                                        {outputData?.slice(0, 50).map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                {outputColumns.map(c => (
                                                    <td key={c} className="px-5 py-3 whitespace-nowrap max-w-[250px] truncate">{row[c]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    )}

                    {node.type === NodeType.AI_ANALYST && (
                        <div className="p-6">
                            {node.data.aiAnalysis ? (
                                <div className="prose prose-invert prose-base max-w-none text-gray-300 whitespace-pre-wrap">
                                    {node.data.aiAnalysis}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 text-sm mt-10">Ask Gemini to get started.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};