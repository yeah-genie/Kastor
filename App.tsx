import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Node, Edge, NodeType, NodeData, TransformType, DatasetRow } from './types';
import { NodeBlock } from './components/NodeBlock';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Search, Workflow, PanelLeftClose, PanelLeftOpen, Calculator, ArrowUpDown, ListFilter, FileSpreadsheet, Filter, LineChart, PieChart, BarChart, Sparkles, Undo2, Redo2, ZoomIn, ZoomOut, Hand, MousePointer2, ScatterChart, CreditCard, ArrowRight, Plus } from 'lucide-react';
import { TutorialOverlay } from './components/TutorialOverlay';

// SVG Path with Smoother S-Curve
const getEdgePath = (source: { x: number; y: number }, target: { x: number; y: number }) => {
  // Node width is w-72 (288px). Half is 144px.
  const sourceX = source.x + 144; 
  const targetX = target.x - 144;
  
  const deltaX = targetX - sourceX;
  const dist = Math.abs(deltaX);

  // Dynamic control point offset based on distance for smoother curves
  // Increased smoothing factor for nicer "s-curve"
  const controlPointOffset = Math.max(dist * 0.5, 150); 

  return `M${sourceX},${source.y} C${sourceX + controlPointOffset},${source.y} ${targetX - controlPointOffset},${target.y} ${targetX},${target.y}`;
};

// Grid Snapping Helper
const SNAP_SIZE = 20;
const snapToGrid = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

// Smart CSV Parser
const parseCSV = (text: string): DatasetRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row: DatasetRow = {};
        
        headers.forEach((h, i) => {
            let val = values[i]?.trim();
            if (val === undefined) {
                row[h] = '';
                return;
            }

            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

            const numericVal = val.replace(/,/g, '');
            
            if (!isNaN(Number(numericVal)) && numericVal !== '') {
                row[h] = Number(numericVal);
            } else {
                row[h] = val;
            }
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
            { id: 'r1-2', type: NodeType.TRANSFORM, position: { x: 500, y: 0 }, data: { label: 'Filter Low Sales', subLabel: 'Filter', config: { transformType: TransformType.FILTER, filterColumn: 'Amount', filterValue: 100, summary: 'Filter: Amount > 100' } } },
            { id: 'r1-3', type: NodeType.TRANSFORM, position: { x: 1000, y: 0 }, data: { label: 'Sort Top Sales', subLabel: 'Sort', config: { transformType: TransformType.SORT, sortColumn: 'Amount', sortDirection: 'desc', summary: 'Sort: Amount' } } }
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
            { id: 'r2-2', type: NodeType.VISUALIZE, position: { x: 500, y: -150 }, data: { label: 'Total Spend', subLabel: 'KPI Card', config: { chartType: 'kpi', kpiColumn: 'Spend' } } },
            { id: 'r2-3', type: NodeType.VISUALIZE, position: { x: 500, y: 150 }, data: { label: 'Spend by Channel', subLabel: 'Bar Chart', config: { chartType: 'bar', xAxis: 'Channel', yAxis: 'Spend' } } }
        ],
        edges: [
            { id: 'e2-1', source: 'r2-1', target: 'r2-2' },
            { id: 'e2-2', source: 'r2-1', target: 'r2-3' }
        ]
    }
];

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(() => {
      const saved = localStorage.getItem('kastor_nodes');
      return saved ? JSON.parse(saved) : [{ id: 'start', type: NodeType.SOURCE, position: { x: 0, y: 0 }, data: { label: 'CSV Input', config: {} } }];
  });
  const [edges, setEdges] = useState<Edge[]>(() => {
      const saved = localStorage.getItem('kastor_edges');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
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
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  // Lifted state to App for Tutorial access
  const [activePanelTab, setActivePanelTab] = useState<'config' | 'preview'>('config');
  const [sidebarSearch, setSidebarSearch] = useState('');
  
  // Tutorial
  const [tutorialStep, setTutorialStep] = useState(0);

  // History State
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isSpacePressed = useRef(false);
  
  // Touch Panning State
  const lastTouchCenter = useRef<{x: number, y: number} | null>(null);

  // Auto Save
  useEffect(() => {
      localStorage.setItem('kastor_nodes', JSON.stringify(nodes));
      localStorage.setItem('kastor_edges', JSON.stringify(edges));
  }, [nodes, edges]);

  // Auto-open panel when node selected
  useEffect(() => {
      if (selectedNodeId) {
          setIsPanelOpen(true);
      }
  }, [selectedNodeId]);

  const addToHistory = useCallback(() => {
      const currentState = { nodes: JSON.parse(JSON.stringify(nodes)), edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter((n) => n.id !== id));
    setEdges(prev => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addToHistory();
  }, [selectedNodeId, addToHistory]);

  const handleDeleteEdge = useCallback((id: string) => {
      setEdges(prev => prev.filter(e => e.id !== id));
      if (selectedEdgeId === id) setSelectedEdgeId(null);
      addToHistory();
  }, [selectedEdgeId, addToHistory]);

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

  const resetPipeline = () => {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 });
      // Force a history entry
      addToHistory();
  };

  // --- GLOBAL MOUSE UP HANDLER FOR ROBUST DRAGGING ---
  useEffect(() => {
      const handleGlobalMouseUp = () => {
          setIsPanning(false);
          setIsDraggingNode(false);
          setDraggedNodeId(null);
          setConnectingNodeId(null);
          // Reset touch pan state
          lastTouchCenter.current = null;
      };

      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (e.shiftKey) {
                  handleRedo();
              } else {
                  handleUndo();
              }
          }
          if (e.code === 'Space' && !e.repeat) {
             isSpacePressed.current = true;
          }

          // Delete key support
          if ((e.key === 'Delete' || e.key === 'Backspace')) {
              const activeEl = document.activeElement;
              const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
              
              if (!isInput) {
                  if (selectedNodeId) {
                      handleDeleteNode(selectedNodeId);
                  }
                  if (selectedEdgeId) {
                      handleDeleteEdge(selectedEdgeId);
                  }
              }
          }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
           if (e.code === 'Space') {
             isSpacePressed.current = false;
           }
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchend', handleGlobalMouseUp);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('mouseup', handleGlobalMouseUp);
          window.removeEventListener('touchend', handleGlobalMouseUp);
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [history, historyIndex, selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge]);

  const getInputNode = (targetNodeId: string, currentEdges: Edge[], currentNodes: Node[]): Node | undefined => {
      const edge = currentEdges.find(e => e.target === targetNodeId);
      if (!edge) return undefined;
      return currentNodes.find(n => n.id === edge.source);
  };

  const calculateNodeOutput = (node: Node, inputData: any[] | undefined): any[] | undefined => {
      if (node.type === NodeType.SOURCE) {
          if (node.data.fileContent) {
              return parseCSV(node.data.fileContent);
          }
          // Initial sample data if empty
          return [
             { ID: 1, Name: 'Product A', Amount: 120, Category: 'Tech', Date: '2023-01-01' },
             { ID: 2, Name: 'Product B', Amount: 80, Category: 'Home', Date: '2023-01-02' },
             { ID: 3, Name: 'Product C', Amount: 200, Category: 'Tech', Date: '2023-01-03' },
             { ID: 4, Name: 'Product D', Amount: 50, Category: 'Garden', Date: '2023-01-04' },
             { ID: 5, Name: 'Product E', Amount: 150, Category: 'Home', Date: '2023-01-05' },
          ];
      }

      if (!inputData) return undefined;

      if (node.type === NodeType.TRANSFORM) {
          const { config } = node.data;
          let result = [...inputData];

          if (config.transformType === TransformType.FILTER) {
              if (config.filterColumn && config.filterValue !== undefined) {
                  result = result.filter(row => {
                      const val = row[config.filterColumn];
                      return Number(val) > Number(config.filterValue);
                  });
              }
          }
          else if (config.transformType === TransformType.SORT) {
              if (config.sortColumn) {
                  result.sort((a, b) => {
                      const valA = a[config.sortColumn];
                      const valB = b[config.sortColumn];
                      if (valA < valB) return config.sortDirection === 'desc' ? 1 : -1;
                      if (valA > valB) return config.sortDirection === 'desc' ? -1 : 1;
                      return 0;
                  });
              }
          }
          else if (config.transformType === TransformType.LIMIT) {
              result = result.slice(0, config.limitCount || 10);
          }
          else if (config.transformType === TransformType.MATH) {
              if (config.mathCol1 && config.mathCol2) {
                  result = result.map(row => {
                      const v1 = Number(row[config.mathCol1]) || 0;
                      const v2 = Number(row[config.mathCol2]) || 0;
                      let calc = 0;
                      if (config.mathOp === '+') calc = v1 + v2;
                      if (config.mathOp === '-') calc = v1 - v2;
                      if (config.mathOp === '*') calc = v1 * v2;
                      if (config.mathOp === '/') calc = v2 !== 0 ? v1 / v2 : 0;
                      return { ...row, [`${config.mathCol1}_${config.mathOp}_${config.mathCol2}`]: calc };
                  });
              }
          }
          else if (config.transformType === TransformType.RENAME) {
              if (config.renameColOld && config.renameColNew) {
                   result = result.map(row => {
                       const newRow = { ...row };
                       newRow[config.renameColNew] = newRow[config.renameColOld];
                       delete newRow[config.renameColOld];
                       return newRow;
                   });
              }
          }
          else if (config.transformType === TransformType.DROP) {
              if (config.dropColumn) {
                  result = result.map(row => {
                      const newRow = { ...row };
                      delete newRow[config.dropColumn];
                      return newRow;
                  });
              }
          }
          else if (config.transformType === TransformType.CLEAN) {
              if (config.cleanColumn && config.cleanAction) {
                  result = result.filter(row => {
                      if (config.cleanAction === 'drop_missing') {
                          const val = row[config.cleanColumn];
                          return val !== null && val !== '' && val !== undefined;
                      }
                      return true;
                  }).map(row => {
                       if (config.cleanAction === 'trim' && typeof row[config.cleanColumn] === 'string') {
                           return { ...row, [config.cleanColumn]: row[config.cleanColumn].trim() };
                       }
                       if (config.cleanAction === 'fill_zero' && (row[config.cleanColumn] === null || row[config.cleanColumn] === '')) {
                           return { ...row, [config.cleanColumn]: 0 };
                       }
                       return row;
                  });
              }
          }

          return result;
      }
      
      return inputData; // Visualize and AI just pass through for now (logic handled in props panel for display)
  };

  // Reactive calculation of all nodes
  const calculatedNodes = useMemo(() => {
      const resolvedNodes = new Map<string, Node>();
      const maxPasses = nodes.length + 1;
      
      nodes.forEach(n => resolvedNodes.set(n.id, { ...n }));

      for (let pass = 0; pass < maxPasses; pass++) {
          let changed = false;
          nodes.forEach(node => {
              const inputNode = getInputNode(node.id, edges, nodes);
              const inputData = inputNode ? resolvedNodes.get(inputNode.id)?.data.outputData : undefined;
              
              const output = calculateNodeOutput(node, inputData);
              
              const currentNode = resolvedNodes.get(node.id)!;
              if (JSON.stringify(currentNode.data.outputData) !== JSON.stringify(output)) {
                  resolvedNodes.set(node.id, { ...currentNode, data: { ...currentNode.data, outputData: output } });
                  changed = true;
              }
          });
          if (!changed) break;
      }
      
      return Array.from(resolvedNodes.values());
  }, [nodes, edges]);

  const handleUpdateNode = (id: string, newData: NodeData) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data: newData } : n));
      addToHistory();
  };

  // --- CANVAS EVENTS ---
  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  }

  const screenToWorld = (sx: number, sy: number) => ({
      x: (sx - viewport.x) / viewport.zoom,
      y: (sy - viewport.y) / viewport.zoom
  });

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      // Deselect if clicking background (and not panning mode)
      if (interactionMode === 'pointer' && 'button' in e && e.button === 0 && !isSpacePressed.current) {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
      }

      if (isSpacePressed.current || interactionMode === 'hand' || ('button' in e && e.button === 1)) {
          setIsPanning(true);
          const pos = getClientPos(e);
          setLastMousePos(pos);
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
          // Multi-touch Pan Start
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const center = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 };
          lastTouchCenter.current = center;
      } else if (e.touches.length === 1) {
          // Delegate single touch to standard interaction logic
          handleMouseDown(e);
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastTouchCenter.current) {
          // Two-finger Pan logic
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const currentCenter = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 };
          
          const dx = currentCenter.x - lastTouchCenter.current.x;
          const dy = currentCenter.y - lastTouchCenter.current.y;

          setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          lastTouchCenter.current = currentCenter;
      } else if (e.touches.length === 1 && !lastTouchCenter.current) {
          // Standard single finger interaction (moving nodes etc handled by mouseMove)
          // We manually call mouse move logic for the first touch
          const touch = e.touches[0];
          const pos = { x: touch.clientX, y: touch.clientY };
          const worldPos = screenToWorld(pos.x, pos.y);
          setMousePos(worldPos);

          if (isDraggingNode && draggedNodeId) {
             const snappedX = snapToGrid(worldPos.x);
             const snappedY = snapToGrid(worldPos.y);
             setNodes(prev => prev.map(n => {
                 if (n.id === draggedNodeId) {
                     return { ...n, position: { x: snappedX, y: snappedY } };
                 }
                 return n;
             }));
          }
      }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
      if (interactionMode === 'hand') return;
      e.stopPropagation();
      setIsDraggingNode(true);
      setDraggedNodeId(id);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
  };

  const handleConnectStart = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setConnectingNodeId(id);
      const pos = screenToWorld(e.clientX, e.clientY);
      setMousePos(pos);
  };

  const handleConnectEnd = (e: React.MouseEvent, targetId: string) => {
      e.stopPropagation();
      if (connectingNodeId && connectingNodeId !== targetId) {
          // Prevent cycles (simple check)
          if (edges.some(edge => edge.source === targetId && edge.target === connectingNodeId)) return;
          
          // Prevent duplicate edges
          if (edges.some(edge => edge.source === connectingNodeId && edge.target === targetId)) return;

          const newEdge: Edge = {
              id: `e-${Date.now()}`,
              source: connectingNodeId,
              target: targetId
          };
          setEdges(prev => [...prev, newEdge]);
          addToHistory();
      }
      setConnectingNodeId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const pos = getClientPos(e);
      const worldPos = screenToWorld(pos.x, pos.y);
      setMousePos(worldPos);

      if (isPanning) {
          const dx = pos.x - lastMousePos.x;
          const dy = pos.y - lastMousePos.y;
          setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          setLastMousePos(pos);
      } else if (isDraggingNode && draggedNodeId) {
          // Snap to grid when dragging
          const snappedX = snapToGrid(worldPos.x);
          const snappedY = snapToGrid(worldPos.y);
          
          setNodes(prev => prev.map(n => {
              if (n.id === draggedNodeId) {
                  return { ...n, position: { x: snappedX, y: snappedY } };
              }
              return n;
          }));
      }
  };

  // Zoom towards cursor
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const ZOOM_SENSITIVITY = 0.001;
        const MIN_ZOOM = 0.1;
        const MAX_ZOOM = 3;

        const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY;
        let newZoom = viewport.zoom + zoomDelta;
        newZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));

        // Calculate mouse position relative to canvas
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newViewportX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
        const newViewportY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

        setViewport({
            x: newViewportX,
            y: newViewportY,
            zoom: newZoom
        });
    }
  };

  const handleZoomButton = (delta: number) => {
      setViewport(prev => ({ 
          ...prev, 
          zoom: Math.min(Math.max(prev.zoom + delta, 0.1), 3),
      }));
  };

  // Smart Add Node
  const handleAddNode = (type: NodeType, subType?: any, label?: string) => {
      const id = Date.now().toString();
      
      let position = { x: 0, y: 0 };
      let sourceNodeId: string | null = null;

      if (selectedNodeId) {
          const prevNode = nodes.find(n => n.id === selectedNodeId);
          if (prevNode) {
              // Snap new node position relative to previous
              position = { x: snapToGrid(prevNode.position.x + 350), y: snapToGrid(prevNode.position.y) };
              sourceNodeId = prevNode.id;
          }
      } else {
          // Snap initial position to CENTER OF SCREEN
          const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
          const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
          position = { x: snapToGrid(centerX), y: snapToGrid(centerY) };
      }

      const newNode: Node = {
          id,
          type,
          position,
          data: {
              label: label || type,
              config: subType ? (type === NodeType.TRANSFORM ? { transformType: subType } : { chartType: subType }) : {}
          }
      };

      setNodes(prev => [...prev, newNode]);

      if (sourceNodeId && type !== NodeType.SOURCE) {
          const prevNode = nodes.find(n => n.id === sourceNodeId);
          if (prevNode && prevNode.type !== NodeType.VISUALIZE && prevNode.type !== NodeType.AI_ANALYST) {
              const newEdge: Edge = {
                  id: `e-${Date.now()}`,
                  source: sourceNodeId,
                  target: id
              };
              setEdges(prev => [...prev, newEdge]);
          }
      }

      setSelectedNodeId(id);
      setIsPanelOpen(true);
      setActivePanelTab('config'); // Reset to config when adding new
      addToHistory();
  };

  const handleLoadRecipe = (recipe: typeof RECIPES[0]) => {
      setNodes(recipe.nodes);
      setEdges(recipe.edges);
      setViewport({ x: window.innerWidth/2 - 500, y: window.innerHeight/2, zoom: 0.8 });
      addToHistory();
  };

  const selectedNode = calculatedNodes.find(n => n.id === selectedNodeId) || null;
  const inputNode = selectedNodeId ? getInputNode(selectedNodeId, edges, calculatedNodes) : undefined;

  return (
    <div className="w-screen h-screen overflow-hidden bg-background text-gray-200 font-sans flex select-none">
      
      <TutorialOverlay 
        step={tutorialStep} 
        nodes={nodes} 
        edges={edges} 
        onNext={() => setTutorialStep(s => s + 1)} 
        onClose={() => setTutorialStep(100)}
        onReset={resetPipeline}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setIsSidebarOpen}
        activePanelTab={activePanelTab}
      />

      {/* --- FLOATING SIDEBAR TOGGLE (Outside) --- */}
      {!isSidebarOpen && (
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-4 w-10 h-10 bg-surface/80 backdrop-blur border border-border rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-surfaceHighlight transition-all z-[60] shadow-xl animate-in fade-in slide-in-from-left-2"
            title="Open Sidebar"
        >
             <PanelLeftOpen className="w-5 h-5" />
         </button>
      )}

      {/* --- REBUILT SIDEBAR --- */}
      {/* Changed from width transition to margin transition for smoother sliding */}
      <div className={`${isSidebarOpen ? 'ml-0' : '-ml-[280px]'} w-[280px] shrink-0 bg-[#13151f]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col relative z-50 shadow-2xl`}>
         
         {/* FIX: Wrapper to prevent content squashing during transition */}
         <div className="w-[280px] h-full flex flex-col">
             {/* Header with Internal Close Button */}
             <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow shadow-primary/40">
                         <Workflow className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">Kastor</span>
                 </div>
                 <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="text-gray-500 hover:text-white transition-colors p-2 rounded-md hover:bg-white/5"
                    title="Close Sidebar"
                 >
                    <PanelLeftClose className="w-5 h-5" />
                 </button>
             </div>

             {/* Segmented Control Tabs */}
             <div className="px-4 pt-4 pb-2">
                <div className="flex p-1 bg-black/20 rounded-lg border border-white/5">
                    <button onClick={() => setActiveSidebarTab('blocks')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeSidebarTab === 'blocks' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                        Blocks
                    </button>
                    <button onClick={() => setActiveSidebarTab('recipes')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeSidebarTab === 'recipes' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                        Recipes
                    </button>
                </div>
             </div>
             
             {/* Search */}
             <div className="px-4 py-2">
                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search components..." 
                        className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-primary/50 focus:bg-black/30 transition-all placeholder:text-gray-600"
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                </div>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-6" id="sidebar-content">
                {activeSidebarTab === 'blocks' ? (
                    <>
                        {/* Premium AI Feature */}
                        <div className="px-2">
                            <button onClick={() => handleAddNode(NodeType.AI_ANALYST, undefined, 'Gemini Analyst')} className="w-full relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] group text-left transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-2 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-900/30">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="relative">
                                    <div className="text-sm font-bold text-amber-100 group-hover:text-white">Gemini Analyst</div>
                                    <div className="text-[11px] text-amber-200/50">AI-powered insights</div>
                                </div>
                                <Plus className="w-5 h-5 text-amber-500 absolute right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                            </button>
                        </div>

                        {/* Data Sources */}
                        <div>
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4">Data Sources</h3>
                            <div className="space-y-1">
                                 <button id="btn-add-source" onClick={() => handleAddNode(NodeType.SOURCE, undefined, 'CSV Upload')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-emerald-500"><FileSpreadsheet className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">CSV File</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                            </div>
                        </div>
                        
                        {/* Transformations */}
                        <div>
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4">Transform</h3>
                            <div className="space-y-1">
                                 <button id="btn-add-filter" onClick={() => handleAddNode(NodeType.TRANSFORM, TransformType.FILTER, 'Filter Rows')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-blue-400"><Filter className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Filter Rows</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.TRANSFORM, TransformType.SORT, 'Sort Data')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-blue-400"><ArrowUpDown className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Sort Data</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.TRANSFORM, TransformType.MATH, 'Calculate')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-blue-400"><Calculator className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Math Formula</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.TRANSFORM, TransformType.LIMIT, 'Top N')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-blue-400"><ListFilter className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Limit / Top N</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.TRANSFORM, TransformType.CLEAN, 'Clean Data')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-blue-400"><Sparkles className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Auto Clean</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                            </div>
                        </div>

                        {/* Visualization */}
                        <div>
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4">Visualize</h3>
                            <div className="space-y-1">
                                 <button id="btn-add-chart" onClick={() => handleAddNode(NodeType.VISUALIZE, 'bar', 'Bar Chart')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-purple-400"><BarChart className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Bar Chart</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'line', 'Line Chart')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-purple-400"><LineChart className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Line Chart</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'pie', 'Pie Chart')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-purple-400"><PieChart className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Pie Chart</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'scatter', 'Scatter Chart')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-purple-400"><ScatterChart className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">Scatter Chart</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                                 <button onClick={() => handleAddNode(NodeType.VISUALIZE, 'kpi', 'KPI Card')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 text-left transition-all group relative">
                                     <div className="text-purple-400"><CreditCard className="w-5 h-5"/></div>
                                     <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">KPI Card</span>
                                     <Plus className="w-4 h-4 text-gray-600 group-hover:text-white absolute right-3 opacity-0 group-hover:opacity-100 transition-all" />
                                 </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-3 px-2">
                         {RECIPES.map(r => (
                             <div key={r.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 cursor-pointer group transition-all duration-300" onClick={() => handleLoadRecipe(r)}>
                                 <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-gray-200 group-hover:text-primary">{r.name}</h4>
                                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                                 </div>
                                 <p className="text-xs text-gray-400 leading-relaxed">{r.description}</p>
                                 <div className="mt-3 flex items-center gap-2">
                                     <span className="text-[10px] px-2 py-0.5 rounded bg-black/20 text-gray-500 border border-white/5">{r.nodes.length} Blocks</span>
                                 </div>
                             </div>
                         ))}
                    </div>
                )}
             </div>
         </div>
      </div>

      {/* --- CANVAS AREA --- */}
      <div className="flex-1 relative overflow-hidden bg-[#0f111a]">
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-md border border-border rounded-full p-1.5 flex items-center gap-1 shadow-2xl z-40">
              <button onClick={() => handleUndo()} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Undo2 className="w-4 h-4"/></button>
              <button onClick={() => handleRedo()} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Redo2 className="w-4 h-4"/></button>
              <div className="w-px h-4 bg-border mx-1" />
              <button 
                onClick={() => setInteractionMode('pointer')} 
                className={`p-2 rounded-full transition-colors ${interactionMode === 'pointer' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                  <MousePointer2 className="w-4 h-4"/>
              </button>
              <button 
                onClick={() => setInteractionMode('hand')} 
                className={`p-2 rounded-full transition-colors ${interactionMode === 'hand' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                  <Hand className="w-4 h-4"/>
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={() => handleZoomButton(-0.1)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><ZoomOut className="w-4 h-4"/></button>
              <span className="text-xs font-mono w-8 text-center text-gray-500">{Math.round(viewport.zoom * 100)}%</span>
              <button onClick={() => handleZoomButton(0.1)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><ZoomIn className="w-4 h-4"/></button>
          </div>

          {/* Infinite Canvas */}
          <div 
            ref={canvasRef}
            className={`w-full h-full infinite-grid ${interactionMode === 'hand' || isSpacePressed.current ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            style={{
                backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px`
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
          >
              <div 
                className="transform-gpu will-change-transform"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                    transformOrigin: '0 0'
                }}
              >
                  <svg 
                    className="absolute top-0 left-0 pointer-events-none" 
                    width="0" 
                    height="0" 
                    style={{ overflow: 'visible' }}
                  >
                      <defs>
                        <linearGradient id="gradient-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      
                      {edges.map(edge => {
                          const sourceNode = nodes.find(n => n.id === edge.source);
                          const targetNode = nodes.find(n => n.id === edge.target);
                          if (!sourceNode || !targetNode) return null;
                          
                          const path = getEdgePath(sourceNode.position, targetNode.position);
                          const isNodeSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;
                          const isEdgeSelected = selectedEdgeId === edge.id;
                          const isSelected = isNodeSelected || isEdgeSelected;

                          return (
                              <g 
                                key={edge.id} 
                                className="transition-opacity duration-300 hover:opacity-100 pointer-events-auto cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEdgeId(edge.id);
                                    setSelectedNodeId(null);
                                }}
                              >
                                  {/* Hit area - invisible wide stroke for easier clicking */}
                                  <path 
                                    d={path}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                  />

                                  {/* Base Shadow Line */}
                                  <path 
                                    d={path}
                                    fill="none"
                                    stroke={isEdgeSelected ? "#6366f1" : "#0f111a"}
                                    strokeWidth={isEdgeSelected ? "8" : "6"}
                                    strokeLinecap="round"
                                    className="transition-colors"
                                  />
                                  {/* Main Line */}
                                  <path 
                                    d={path}
                                    fill="none"
                                    stroke={isSelected ? "url(#gradient-flow)" : "#334155"}
                                    strokeWidth={isSelected ? "3" : "2"}
                                    className="transition-all duration-300"
                                    strokeLinecap="round"
                                  />
                                  {/* Animated Flow Dashes - Giving the 'Flow' effect */}
                                  <path 
                                    d={path}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="2"
                                    strokeDasharray="4 8"
                                    className="animate-flow opacity-0 transition-opacity duration-300"
                                    style={{ opacity: isSelected ? 0.6 : 0.1 }}
                                    strokeLinecap="round"
                                  />
                              </g>
                          )
                      })}
                      
                      {/* Dragging Connection Line */}
                      {connectingNodeId && (
                          <g>
                            <path 
                                d={getEdgePath(nodes.find(n => n.id === connectingNodeId)!.position, mousePos)}
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                className="animate-pulse opacity-80"
                            />
                            <circle cx={mousePos.x} cy={mousePos.y} r="4" fill="#6366f1" />
                          </g>
                      )}
                  </svg>

                  {/* Nodes Layer */}
                  {calculatedNodes.map(node => (
                      <NodeBlock 
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id}
                        onSelect={setSelectedNodeId}
                        onDelete={handleDeleteNode}
                        onMouseDown={handleNodeMouseDown}
                        onConnectStart={handleConnectStart}
                        onConnectEnd={handleConnectEnd}
                      />
                  ))}
              </div>
          </div>
          
          {/* Properties Panel - Now Draggable */}
          <PropertiesPanel 
            node={selectedNode}
            inputData={inputNode?.data.outputData}
            onUpdateNode={handleUpdateNode}
            isOpen={isPanelOpen}
            onToggle={() => setIsPanelOpen(!isPanelOpen)}
            activeTab={activePanelTab}
            onTabChange={setActivePanelTab}
          />
      </div>
    </div>
  );
};

export default App;