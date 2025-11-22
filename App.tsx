
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Node, Edge, NodeType, NodeData, TransformType, DatasetRow } from './types';
import { NodeBlock } from './components/NodeBlock';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Search, LayoutGrid, Bell, HelpCircle, Workflow, PanelLeftClose, PanelLeftOpen, Calculator, ArrowUpDown, ListFilter, FileSpreadsheet, Filter, LineChart, PieChart, BarChart, Sparkles, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Hand, MousePointer2, PenLine, Eraser, ScatterChart, CreditCard, BookOpen, Play } from 'lucide-react';

// SVG Path with Circle-to-Circle logic (Port based)
const getEdgePath = (source: { x: number; y: number }, target: { x: number; y: number }) => {
  // Node width is w-72 (18rem = 288px). Half is 144px.
  const sourceX = source.x + 144;
  const targetX = target.x - 144;
  
  const deltaX = targetX - sourceX;
  const controlPointX = sourceX + (deltaX * 0.5);
  
  return `M${sourceX},${source.y} C${controlPointX},${source.y} ${controlPointX},${target.y} ${targetX},${target.y}`;
};

// Simple CSV Parser
const parseCSV = (text: string): DatasetRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row: DatasetRow = {};
        headers.forEach((h, i) => {
            const val = values[i]?.trim();
            row[h] = isNaN(Number(val)) ? val : Number(val);
        });
        return row;
    });
};

// --- RECIPES DATA ---
const RECIPES = [
    {
        id: 'sales_clean',
        name: 'Sales Data Cleaning',
        description: 'Load CSV, Filter low values, and Sort by revenue.',
        nodes: [
            { id: 'r1-1', type: NodeType.SOURCE, position: { x: 0, y: 0 }, data: { label: 'Sales CSV', config: {} } },
            { id: 'r1-2', type: NodeType.TRANSFORM, position: { x: 400, y: 0 }, data: { label: 'Filter Low Sales', subLabel: 'Filter', config: { transformType: TransformType.FILTER, filterColumn: 'Amount', filterValue: 100, summary: 'Filter: Amount > 100' } } },
            { id: 'r1-3', type: NodeType.TRANSFORM, position: { x: 800, y: 0 }, data: { label: 'Sort Top Sales', subLabel: 'Sort', config: { transformType: TransformType.SORT, sortColumn: 'Amount', sortDirection: 'desc', summary: 'Sort: Amount' } } }
        ],
        edges: [
            { id: 'e1-1', source: 'r1-1', target: 'r1-2' },
            { id: 'e1-2', source: 'r1-2', target: 'r1-3' }
        ]
    },
    {
        id: 'kpi_dashboard',
        name: 'Simple KPI Dashboard',
        description: 'Visualize total revenue and distribution.',
        nodes: [
            { id: 'r2-1', type: NodeType.SOURCE, position: { x: 0, y: 0 }, data: { label: 'Marketing Data', config: {} } },
            { id: 'r2-2', type: NodeType.VISUALIZE, position: { x: 500, y: -100 }, data: { label: 'Total Spend', subLabel: 'KPI Card', config: { chartType: 'kpi', kpiColumn: 'Spend' } } },
            { id: 'r2-3', type: NodeType.VISUALIZE, position: { x: 500, y: 100 }, data: { label: 'Spend by Channel', subLabel: 'Bar Chart', config: { chartType: 'bar', xAxis: 'Channel', yAxis: 'Spend' } } }
        ],
        edges: [
            { id: 'e2-1', source: 'r2-1', target: 'r2-2' },
            { id: 'e2-2', source: 'r2-1', target: 'r2-3' }
        ]
    }
];

const App: React.FC = () => {
  // --- State ---
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'start',
      type: NodeType.SOURCE,
      position: { x: 0, y: 0 },
      data: { label: 'CSV Input', config: {} }
    }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Canvas State
  const [viewport, setViewport] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 });
  const [interactionMode, setInteractionMode] = useState<'pointer' | 'hand'>('pointer');
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Interaction State
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // World coords
  
  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'blocks' | 'recipes'>('blocks');
  const [panelHeight, setPanelHeight] = useState(250);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // History State
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isSpacePressed = useRef(false); // Track spacebar state

  // --- History Management ---
  const addToHistory = useCallback(() => {
      const currentState = { nodes: JSON.parse(JSON.stringify(nodes)), edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      // Limit history size
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          setNodes(prev.nodes);
          setEdges(prev.edges);
          setHistoryIndex(historyIndex - 1);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          setNodes(next.nodes);
          setEdges(next.edges);
          setHistoryIndex(historyIndex + 1);
      }
  };

  // Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (e.shiftKey) {
                  handleRedo();
              } else {
                  handleUndo();
              }
          }
          // Spacebar for panning
          if (e.code === 'Space' && !e.repeat) {
             isSpacePressed.current = true;
          }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
           if (e.code === 'Space') {
             isSpacePressed.current = false;
           }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [history, historyIndex]);

  // --- Logic Engine ---
  const getInputNode = (targetNodeId: string, currentEdges: Edge[], currentNodes: Node[]): Node | undefined => {
      const edge = currentEdges.find(e => e.target === targetNodeId);
      if (!edge) return undefined;
      return currentNodes.find(n => n.id === edge.source);
  };

  const calculateNodeOutput = (node: Node, inputData: any[] | undefined): any[] | undefined => {
      if (node.type === NodeType.SOURCE) {
          // Parse CSV if present
          if (node.data.fileContent && (!node.data.outputData || node.data.outputData.length === 0)) {
              return parseCSV(node.data.fileContent);
          }
          return node.data.outputData; 
      }
      
      if (!inputData) return undefined;

      if (node.type === NodeType.TRANSFORM) {
          let result = [...inputData];
          const config = node.data.config;
          
          switch (config.transformType) {
              case TransformType.FILTER:
                  if (config.filterColumn && config.filterValue !== undefined && config.filterValue !== '') {
                      result = result.filter(row => {
                          const val = Number(row[config.filterColumn]);
                          return !isNaN(val) && val > Number(config.filterValue);
                      });
                  }
                  break;
              case TransformType.SORT:
                  if (config.sortColumn) {
                      result.sort((a, b) => {
                          const valA = a[config.sortColumn];
                          const valB = b[config.sortColumn];
                          if (typeof valA === 'number' && typeof valB === 'number') {
                              return config.sortDirection === 'asc' ? valA - valB : valB - valA;
                          }
                          const strA = String(valA);
                          const strB = String(valB);
                          return config.sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
                      });
                  }
                  break;
              case TransformType.LIMIT:
                  if (config.limitCount) {
                      result = result.slice(0, config.limitCount);
                  }
                  break;
              case TransformType.MATH:
                  if (config.mathCol1 && config.mathCol2 && config.mathOp) {
                      const newColName = `${config.mathCol1} ${config.mathOp} ${config.mathCol2}`;
                      result = result.map(row => {
                          const v1 = Number(row[config.mathCol1]) || 0;
                          const v2 = Number(row[config.mathCol2]) || 0;
                          let val = 0;
                          if (config.mathOp === '+') val = v1 + v2;
                          if (config.mathOp === '-') val = v1 - v2;
                          if (config.mathOp === '*') val = v1 * v2;
                          if (config.mathOp === '/') val = v2 !== 0 ? v1 / v2 : 0;
                          return { ...row, [newColName]: Number(val.toFixed(2)) };
                      });
                  }
                  break;
              case TransformType.RENAME:
                  if (config.renameColOld && config.renameColNew) {
                      result = result.map(row => {
                          const newRow = { ...row };
                          newRow[config.renameColNew] = newRow[config.renameColOld];
                          delete newRow[config.renameColOld];
                          return newRow;
                      });
                  }
                  break;
              case TransformType.DROP:
                  if (config.dropColumn) {
                       result = result.map(row => {
                          const newRow = { ...row };
                          delete newRow[config.dropColumn];
                          return newRow;
                      });
                  }
                  break;
          }
          return result;
      }
      return inputData;
  };

  // Data Propagation Effect
  useEffect(() => {
      let updatedNodes = [...nodes];
      let hasChanged = false;
      const processQueue = updatedNodes.filter(n => n.type === NodeType.SOURCE);
      const processedIds = new Set<string>();
      processQueue.forEach(n => processedIds.add(n.id));

      // Calculate Source Nodes first (Parsing)
      processQueue.forEach(node => {
          const newData = calculateNodeOutput(node, undefined);
          if (newData && (!node.data.outputData || newData.length !== node.data.outputData.length)) {
              node.data.outputData = newData;
              hasChanged = true;
          }
      });

      let safetyLoop = 0;
      while(processedIds.size < updatedNodes.length && safetyLoop < 15) {
          safetyLoop++;
          const remaining = updatedNodes.filter(n => !processedIds.has(n.id));
          
          for (const node of remaining) {
              const inputNode = getInputNode(node.id, edges, updatedNodes);
              
              if (!inputNode && node.type !== NodeType.SOURCE) {
                   if (node.data.outputData !== undefined) {
                       node.data.outputData = undefined;
                       hasChanged = true;
                   }
                   processedIds.add(node.id); 
                   continue;
              }
              
              if (inputNode && processedIds.has(inputNode.id)) {
                  const newData = calculateNodeOutput(node, inputNode.data.outputData);
                  // Simple change detection
                  const currentJson = JSON.stringify(node.data.outputData?.slice(0,5));
                  const newJson = JSON.stringify(newData?.slice(0,5));
                  const lengthChanged = node.data.outputData?.length !== newData?.length;
                  
                  if (currentJson !== newJson || lengthChanged) {
                      node.data.outputData = newData;
                      hasChanged = true;
                  }
                  processedIds.add(node.id);
              }
          }
      }
      if (hasChanged) {
          setNodes([...updatedNodes]);
      }
  }, [edges, nodes.map(n => JSON.stringify(n.data.config) + n.data.fileContent).join('')]);


  // --- Infinite Canvas Handlers ---
  
  // Convert Screen Coords to World Coords
  const screenToWorld = (sx: number, sy: number) => ({
      x: (sx - viewport.x) / viewport.zoom,
      y: (sy - viewport.y) / viewport.zoom
  });

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
          // Zoom
          e.preventDefault();
          const zoomSensitivity = 0.001;
          const newZoom = Math.min(Math.max(viewport.zoom - e.deltaY * zoomSensitivity, 0.2), 3);
          setViewport(v => ({ ...v, zoom: newZoom }));
      } else {
          // Pan
          setViewport(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      // Pan if middle mouse, Space+Left, or Hand Tool active
      if (e.button === 1 || (e.button === 0 && isSpacePressed.current) || (e.button === 0 && interactionMode === 'hand')) {
          setIsPanning(true);
          setLastMousePos({ x: e.clientX, y: e.clientY });
          e.preventDefault();
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isPanning) {
          const dx = e.clientX - lastMousePos.x;
          const dy = e.clientY - lastMousePos.y;
          setViewport(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
          setLastMousePos({ x: e.clientX, y: e.clientY });
          return;
      }

      // Track mouse for edges
      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const rawX = e.clientX - rect.left;
          const rawY = e.clientY - rect.top;
          const worldPos = screenToWorld(rawX, rawY);
          setMousePos(worldPos);

          if (isDraggingNode && draggedNodeId) {
               setNodes(nodes.map(n => n.id === draggedNodeId ? { ...n, position: worldPos } : n));
          }
      }
  };

  const handleMouseUp = () => {
      if (isDraggingNode) addToHistory(); // Save state after drag
      setIsPanning(false);
      setIsDraggingNode(false);
      setDraggedNodeId(null);
      setConnectingNodeId(null);
  };

  // --- Node Actions ---

  const handleAddNode = (type: NodeType, label: string, transformType?: TransformType, chartType?: string) => {
    const id = `node-${Date.now()}`;
    // Place in center of viewport
    const worldCenter = screenToWorld(canvasRef.current!.clientWidth / 2, canvasRef.current!.clientHeight / 2);
    
    const newNode: Node = {
      id,
      type,
      position: { x: worldCenter.x + (Math.random() * 50 - 25), y: worldCenter.y + (Math.random() * 50 - 25) },
      data: { 
          label,
          subLabel: type === NodeType.VISUALIZE ? (chartType || 'Visual') : (transformType ? transformType : type.replace('_', ' ')),
          config: { transformType, chartType: chartType || 'bar' } 
      },
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(id);
    addToHistory();
  };

  const handleLoadRecipe = (recipe: typeof RECIPES[0]) => {
      // Calculate center of screen for recipe placement
      const cx = viewport.x * -1 + window.innerWidth/2; 
      
      // Create new nodes based on recipe
      const newNodes = recipe.nodes.map(n => ({
          ...n,
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // We'll need to remap edges, so keep track of original IDs if needed, 
          // but for simplicity let's just generate new IDs and map edge indices
      }));

      // To properly link edges in a template, we need a map of templateId -> realId
      const idMap: Record<string, string> = {};
      recipe.nodes.forEach(n => {
          idMap[n.id] = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      });

      const finalNodes = recipe.nodes.map(n => ({
          ...n,
          id: idMap[n.id],
          position: { x: n.position.x, y: n.position.y } // Relative positioning
      }));

      const finalEdges = recipe.edges.map(e => ({
          id: `edge-${Date.now()}-${Math.random()}`,
          source: idMap[e.source],
          target: idMap[e.target]
      }));

      setNodes(finalNodes);
      setEdges(finalEdges);
      setViewport({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 100, zoom: 1 }); // Center view approx
      addToHistory();
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addToHistory();
  };

  const handleUpdateNode = (id: string, newData: NodeData) => {
      setNodes(nodes.map(n => n.id === id ? { ...n, data: newData } : n));
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const selectedNodeInput = useMemo(() => {
      if (!selectedNode) return undefined;
      if (selectedNode.type === NodeType.SOURCE) return selectedNode.data.outputData;
      const inputNode = getInputNode(selectedNode.id, edges, nodes);
      return inputNode ? inputNode.data.outputData : undefined;
  }, [selectedNode, edges, nodes]);

  // Filter sidebar items
  const matchesSearch = (term: string) => term.toLowerCase().includes(sidebarSearch.toLowerCase());

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-gray-200 overflow-hidden selection:bg-primary/30">
      
      {/* TOP HEADER */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-2.5">
                 <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                    <Workflow className="w-5 h-5" strokeWidth={2.5} />
                 </div>
                 <span className="font-bold text-lg tracking-tight text-white">Kastor</span>
             </div>
             
             {/* Toolbar */}
             <div className="flex items-center bg-surfaceHighlight rounded-lg p-1 border border-border shadow-inner">
                <div className="flex items-center border-r border-gray-700 pr-2 mr-2 gap-1">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors" title="Redo (Ctrl+Shift+Z)">
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex items-center border-r border-gray-700 pr-2 mr-2 gap-1">
                    <button 
                        onClick={() => setInteractionMode('pointer')} 
                        className={`p-1.5 rounded transition-colors ${interactionMode === 'pointer' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Select Tool"
                    >
                        <MousePointer2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setInteractionMode('hand')} 
                        className={`p-1.5 rounded transition-colors ${interactionMode === 'hand' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Pan Tool (Space+Drag)"
                    >
                        <Hand className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1">
                     <button onClick={() => setViewport(v => ({...v, zoom: Math.max(v.zoom - 0.1, 0.2)}))} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Zoom Out">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-gray-400 w-12 text-center">{Math.round(viewport.zoom * 100)}%</span>
                     <button onClick={() => setViewport(v => ({...v, zoom: Math.min(v.zoom + 0.1, 3)}))} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Zoom In">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewport({ x: window.innerWidth/2, y: window.innerHeight/2, zoom: 1 })} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Reset View">
                        <Maximize className="w-3 h-3" />
                    </button>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
              <Bell className="w-5 h-5 hover:text-white cursor-pointer" />
              <HelpCircle className="w-5 h-5 hover:text-white cursor-pointer" />
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
          
        {/* LEFT PALETTE */}
        <div className={`bg-surface border-r border-border flex flex-col z-30 shadow-xl transition-all duration-300 ease-in-out overflow-hidden relative ${isSidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}>
            
            {/* Sidebar Tabs */}
            <div className="flex border-b border-border">
                <button 
                    onClick={() => setActiveSidebarTab('blocks')}
                    className={`flex-1 py-3 text-xs font-medium flex justify-center items-center gap-2 transition-colors ${activeSidebarTab === 'blocks' ? 'text-white border-b-2 border-primary bg-surfaceHighlight/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <LayoutGrid className="w-3.5 h-3.5" /> Blocks
                </button>
                <button 
                    onClick={() => setActiveSidebarTab('recipes')}
                    className={`flex-1 py-3 text-xs font-medium flex justify-center items-center gap-2 transition-colors ${activeSidebarTab === 'recipes' ? 'text-white border-b-2 border-primary bg-surfaceHighlight/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <BookOpen className="w-3.5 h-3.5" /> Recipes
                </button>
            </div>

            <div className="p-3 border-b border-border">
                 {/* Search Bar */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder={activeSidebarTab === 'blocks' ? "Search blocks..." : "Search recipes..."}
                        className="w-full bg-surfaceHighlight border border-border rounded pl-8 pr-3 py-1.5 text-xs text-gray-300 focus:border-primary outline-none placeholder:text-gray-600"
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                
                {/* BLOCKS TAB */}
                {activeSidebarTab === 'blocks' && (
                    <>
                    {matchesSearch('AI Analyst') && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase pl-1">AI Assistant</h3>
                            <button onClick={() => handleAddNode(NodeType.AI_ANALYST, 'AI Analyst')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-amber-500/20 p-1.5 rounded text-amber-500 group-hover:text-amber-400"><Sparkles className="w-4 h-4" /></div>
                                AI Analyst
                            </button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase pl-1">Sources</h3>
                        {matchesSearch('CSV') && (
                            <button onClick={() => handleAddNode(NodeType.SOURCE, 'CSV File')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-emerald-500/20 p-1.5 rounded text-emerald-500 group-hover:text-emerald-400"><FileSpreadsheet className="w-4 h-4" /></div>
                                CSV Upload
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase pl-1">Transformations</h3>
                        {matchesSearch('Filter') && (
                            <button onClick={() => handleAddNode(NodeType.TRANSFORM, 'Filter', TransformType.FILTER)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-blue-500/20 p-1.5 rounded text-blue-500 group-hover:text-blue-400"><Filter className="w-4 h-4" /></div>
                                Filter Rows
                            </button>
                        )}
                        {matchesSearch('Sort') && (
                            <button onClick={() => handleAddNode(NodeType.TRANSFORM, 'Sort', TransformType.SORT)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-blue-500/20 p-1.5 rounded text-blue-500 group-hover:text-blue-400"><ArrowUpDown className="w-4 h-4" /></div>
                                Sort Data
                            </button>
                        )}
                        {matchesSearch('Math') && (
                            <button onClick={() => handleAddNode(NodeType.TRANSFORM, 'Math', TransformType.MATH)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-blue-500/20 p-1.5 rounded text-blue-500 group-hover:text-blue-400"><Calculator className="w-4 h-4" /></div>
                                Math Op
                            </button>
                        )}
                        {matchesSearch('Limit') && (
                            <button onClick={() => handleAddNode(NodeType.TRANSFORM, 'Limit', TransformType.LIMIT)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-blue-500/20 p-1.5 rounded text-blue-500 group-hover:text-blue-400"><ListFilter className="w-4 h-4" /></div>
                                Limit Rows
                            </button>
                        )}
                        {matchesSearch('Rename') && (
                            <button onClick={() => handleAddNode(NodeType.TRANSFORM, 'Rename', TransformType.RENAME)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-blue-500/20 p-1.5 rounded text-blue-500 group-hover:text-blue-400"><PenLine className="w-4 h-4" /></div>
                                Rename Column
                            </button>
                        )}
                        {matchesSearch('Drop') && (
                            <button onClick={() => handleAddNode(NodeType.TRANSFORM, 'Drop Column', TransformType.DROP)} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-blue-500/20 p-1.5 rounded text-blue-500 group-hover:text-blue-400"><Eraser className="w-4 h-4" /></div>
                                Drop Column
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase pl-1">Visualize</h3>
                        {matchesSearch('Bar') && (
                            <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'Bar Chart', undefined, 'bar')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-purple-500/20 p-1.5 rounded text-purple-500 group-hover:text-purple-400"><BarChart className="w-4 h-4" /></div>
                                Bar Chart
                            </button>
                        )}
                        {matchesSearch('Line') && (
                            <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'Line Chart', undefined, 'line')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-purple-500/20 p-1.5 rounded text-purple-500 group-hover:text-purple-400"><LineChart className="w-4 h-4" /></div>
                                Line Chart
                            </button>
                        )}
                        {matchesSearch('Pie') && (
                            <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'Pie Chart', undefined, 'pie')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-purple-500/20 p-1.5 rounded text-purple-500 group-hover:text-purple-400"><PieChart className="w-4 h-4" /></div>
                                Pie Chart
                            </button>
                        )}
                        {matchesSearch('Scatter') && (
                            <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'Scatter Plot', undefined, 'scatter')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-purple-500/20 p-1.5 rounded text-purple-500 group-hover:text-purple-400"><ScatterChart className="w-4 h-4" /></div>
                                Scatter Plot
                            </button>
                        )}
                        {matchesSearch('KPI') && (
                            <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'KPI Card', undefined, 'kpi')} className="w-full flex items-center gap-3 p-2 rounded hover:bg-surfaceHighlight border border-transparent hover:border-border text-sm text-gray-300 hover:text-white group transition-all">
                                <div className="bg-purple-500/20 p-1.5 rounded text-purple-500 group-hover:text-purple-400"><CreditCard className="w-4 h-4" /></div>
                                KPI Card
                            </button>
                        )}
                    </div>
                    </>
                )}

                {/* RECIPES TAB */}
                {activeSidebarTab === 'recipes' && (
                    <div className="space-y-4">
                        {RECIPES.filter(r => matchesSearch(r.name)).map(recipe => (
                            <div key={recipe.id} className="bg-surfaceHighlight/30 rounded-lg border border-border p-3 hover:border-primary/50 transition-colors group">
                                <h4 className="text-sm font-semibold text-gray-200 mb-1">{recipe.name}</h4>
                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{recipe.description}</p>
                                <button 
                                    onClick={() => handleLoadRecipe(recipe)}
                                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs py-1.5 rounded transition-all"
                                >
                                    <Play className="w-3 h-3" fill="currentColor" /> Load Template
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        {!isSidebarOpen && (
             <button onClick={() => setIsSidebarOpen(true)} className="absolute left-4 top-4 z-50 p-2 bg-surface border border-border rounded text-gray-400 hover:text-white"><PanelLeftOpen className="w-5 h-5" /></button>
        )}

        {/* CENTRAL CANVAS */}
        <div className="flex-1 flex flex-col relative bg-background min-w-0">
            <div 
                ref={canvasRef}
                className="flex-1 relative overflow-hidden infinite-grid"
                style={{ 
                    cursor: interactionMode === 'hand' || isPanning ? 'grab' : 'default',
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                    backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}`
                }}
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={(e) => { 
                    if (!isDraggingNode && !isPanning) setSelectedNodeId(null); 
                }}
            >
                {/* Transformation Layer */}
                <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
                    
                    {/* Edges */}
                    <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: '1px', height: '1px' }}>
                         <defs>
                            <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        {edges.map(edge => {
                            const sourceNode = nodes.find(n => n.id === edge.source);
                            const targetNode = nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;
                            return (
                                <g key={edge.id}>
                                    {/* Flow animation path */}
                                    <path d={getEdgePath(sourceNode.position, targetNode.position)} stroke="url(#gradientStroke)" strokeWidth="3" fill="none" className="opacity-40" />
                                    <path d={getEdgePath(sourceNode.position, targetNode.position)} stroke="#8b5cf6" strokeWidth="3" strokeDasharray="4 8" fill="none" className="animate-flow opacity-80" />
                                </g>
                            );
                        })}
                        {connectingNodeId && (
                            <path 
                                d={getEdgePath(nodes.find(n => n.id === connectingNodeId)!.position, mousePos)}
                                stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" fill="none" className="opacity-50"
                            />
                        )}
                    </svg>

                    {/* Nodes */}
                    {nodes.map(node => (
                        <NodeBlock
                            key={node.id}
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            onSelect={setSelectedNodeId}
                            onDelete={handleDeleteNode}
                            onMouseDown={(e, id) => {
                                // Only allow selection/dragging if not in Hand mode
                                if (interactionMode === 'hand') return; 
                                setIsDraggingNode(true);
                                setDraggedNodeId(id);
                            }}
                            onConnectStart={(e, id) => {
                                e.stopPropagation();
                                if (interactionMode === 'hand') return;
                                setConnectingNodeId(id);
                            }}
                            onConnectEnd={(e, id) => {
                                e.stopPropagation();
                                if (connectingNodeId && connectingNodeId !== id) {
                                    if (!edges.some(edge => edge.source === connectingNodeId && edge.target === id)) {
                                        setEdges([...edges, { id: `e-${Date.now()}`, source: connectingNodeId, target: id }]);
                                        addToHistory();
                                    }
                                }
                                setConnectingNodeId(null);
                            }}
                        />
                    ))}
                </div>
            </div>

            <PropertiesPanel 
                node={selectedNode} 
                inputData={selectedNodeInput || (selectedNode?.type === NodeType.SOURCE ? selectedNode.data.outputData : undefined)}
                onUpdateNode={handleUpdateNode}
                height={panelHeight}
                isOpen={isPanelOpen}
                onToggle={() => setIsPanelOpen(!isPanelOpen)}
                onResizeStart={() => {}}
            />
        </div>
      </div>
    </div>
  );
};

export default App;
