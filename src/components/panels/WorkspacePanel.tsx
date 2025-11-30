import { useBlockStore } from '../../store/useBlockStore';
import { useUIStore } from '../../store/useUIStore';
import { BlockType, Block } from '../../types';
import { LoadBlock } from '../blocks/LoadBlock';
import { InsightBlock } from '../blocks/InsightBlock';
import { ActionBlock } from '../blocks/ActionBlock';
import { GroupBlock } from '../blocks/GroupBlock';
import { TransformBlock } from '../blocks/TransformBlock';
import { VisualizeBlock } from '../blocks/VisualizeBlock';
import { ScheduleBlock } from '../blocks/ScheduleBlock';
import { SortableBlockItem } from '../dnd/SortableBlockItem';
import { Layers, Command, MousePointer2, Plus, Minus, Maximize, LayoutList, StickyNote, Eye, ChevronDown, Zap } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState, useRef, useEffect } from 'react';

import { Minimap } from '../ui/Minimap';
import { DataPreviewTooltip } from '../ui/DataPreviewTooltip';
import { CanvasAnnotations } from '../ui/CanvasAnnotations';
import { DataPreviewModal } from '../modals/DataPreviewModal';
import { DashboardView } from '../views/DashboardView';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover'; 

const renderBlockContent = (block: Block) => {
  switch (block.type) {
    case BlockType.LOAD: return <LoadBlock />;
    case BlockType.API_CALL: return <LoadBlock />; // Placeholder
    case BlockType.TRANSFORM: return <TransformBlock />;
    case BlockType.FILTER: return <TransformBlock />; // Placeholder
    case BlockType.SORT: return <TransformBlock />; // Placeholder
    case BlockType.JOIN: return <TransformBlock />; // Placeholder
    case BlockType.GROUP_BY: return <TransformBlock />; // Placeholder
    case BlockType.CLEAN: return <TransformBlock />; // Placeholder
    case BlockType.VISUALIZE: return <VisualizeBlock />;
    case BlockType.KPI_CARD: return <VisualizeBlock />; // Placeholder
    case BlockType.INSIGHT: return <InsightBlock />;
    case BlockType.ASK_AI: return <InsightBlock />; // Placeholder
    case BlockType.ACTION: return <ActionBlock />;
    case BlockType.EXPORT: return <ActionBlock />; // Placeholder
    case BlockType.NOTIFY: return <ActionBlock />; // Placeholder
    case BlockType.SCHEDULE: return <ScheduleBlock block={block} />;
    case BlockType.GROUP: return <GroupBlock block={block} isSelected={false} onClick={() => {}} children={null} />;
    default: return <div className="text-sm text-slate-400 italic">Configuration needed</div>;
  }
};

// Inline Insert Button Component
const InlineInsertButton = ({ index, onInsert }: { index: number; onInsert: (type: BlockType) => void }) => {
  return (
    <div className="h-4 relative group/insert flex items-center justify-center -my-2 z-20">
      <div className="absolute h-0.5 w-full bg-blue-500/0 group-hover/insert:bg-blue-500/30 transition-colors duration-300" />
      <Popover>
        <PopoverTrigger asChild>
           <button className="relative z-10 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-500 flex items-center justify-center shadow-lg scale-0 group-hover/insert:scale-100 transition-all duration-200 hover:bg-blue-600 hover:text-white hover:border-blue-500">
             <Plus size={14} />
           </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl">
           <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">Insert Block</div>
           <button onClick={() => onInsert(BlockType.TRANSFORM)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors text-left">
             <Zap size={12} className="text-purple-400" /> Transform
           </button>
           <button onClick={() => onInsert(BlockType.VISUALIZE)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors text-left">
             <Eye size={12} className="text-pink-400" /> Visualize
           </button>
           <button onClick={() => onInsert(BlockType.INSIGHT)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors text-left">
             <StickyNote size={12} className="text-amber-400" /> Insight
           </button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const WorkspacePanel = () => {
  const { blocks, selectBlock, moveBlock, selectedBlockIds, addBlock, insertBlockAt, removeBlocks, autoLayoutBlocks } = useBlockStore(); 
  const { zoom, pan, setZoom, setPan, toggleLibrary, isLibraryOpen, showAnnotations, toggleAnnotations, openPreviewModal, isDashboardMode, addAnnotation } = useUIStore(); 
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false); // Dropdown for view options
  
  // Tooltip State
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for pan math
  const lastMousePos = useRef({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
           setIsSpacePressed(true);
           e.preventDefault();
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockIds.length > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
           removeBlocks(selectedBlockIds);
           selectBlock(null);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, selectedBlockIds, removeBlocks, selectBlock]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoom(prev => Math.max(0.1, Math.min(2, prev + (delta > 0 ? 0.1 : -0.1))));
    } else {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? e.deltaX : e.deltaY;
      setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (isSpacePressed && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleBlockClick = (id: string, e: React.MouseEvent) => {
    selectBlock(id, e.shiftKey);
  };
  
  const handleBlockMouseEnter = (id: string, e: React.MouseEvent) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    hoverTimeout.current = setTimeout(() => {
      setHoveredBlockId(id);
      const rightSpace = window.innerWidth - rect.right;
      const showOnLeft = rightSpace < 350;
      setTooltipPos({ 
        x: showOnLeft ? rect.left - 270 : rect.right + 20, 
        y: rect.top + rect.height / 2 
      });
    }, 600);
  };

  const handleBlockMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredBlockId(null);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveBlock(active.id as string, over.id as string);
    }
  }
  
  const hoveredBlock = blocks.find(b => b.id === hoveredBlockId);

  const handleOpenLibrary = () => {
    if (!isLibraryOpen) toggleLibrary();
  };

  const handleAddFirstBlock = () => {
    addBlock(BlockType.LOAD);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('.annotation-item')) return;

    if (containerRef.current && containerRef.current.parentElement) {
        const rect = containerRef.current.parentElement.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        // Center the note slightly
        addAnnotation(x - 80, y - 40);
    }
  };

  if (isDashboardMode) {
    return (
      <div className="flex-1 bg-slate-950 relative h-full overflow-hidden">
        <DashboardView />
        <DataPreviewModal />
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 bg-slate-950 relative h-full overflow-hidden group/workspace select-none ${isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleCanvasDoubleClick}
    >
      {/* Data Preview Tooltip */}
      {hoveredBlock && (
        <DataPreviewTooltip 
          block={hoveredBlock} 
          isVisible={!!hoveredBlock} 
          position={tooltipPos}
        />
      )}

      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            opacity: 0.3
        }}
      />
      
      {/* Canvas Controls (Moved to Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto">
         
         {/* View Settings Dropdown */}
         <div className="relative flex justify-end">
            <button 
                onClick={() => setShowViewOptions(!showViewOptions)}
                className="bg-slate-900/90 border border-slate-700 p-2 rounded-lg shadow-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="View Settings"
            >
                <Eye size={18} />
            </button>
            {showViewOptions && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 w-40 animate-in fade-in zoom-in-95 duration-100">
                    <button 
                        onClick={() => { autoLayoutBlocks(); setShowViewOptions(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <LayoutList size={14} /> Auto Layout
                    </button>
                    <button 
                        onClick={() => { toggleAnnotations(); setShowViewOptions(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${showAnnotations ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <StickyNote size={14} /> 
                        {showAnnotations ? 'Hide Notes' : 'Show Notes'}
                    </button>
                </div>
            )}
         </div>

         {/* Zoom Controls */}
         <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg shadow-lg p-1">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                <Minus size={14} />
            </button>
            <span className="text-[10px] font-mono text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
                <Plus size={14} />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button onClick={handleResetView} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded" title="Fit to View">
                <Maximize size={14} />
            </button>
         </div>
      </div>

      {/* Canvas Content */}
      <div 
        ref={containerRef}
        className="w-full h-full relative origin-top-left transition-transform duration-75 ease-out"
        style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          
          {showAnnotations && <CanvasAnnotations />}

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0 relative pb-10">
                {blocks.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-[400px] animate-in fade-in zoom-in-95 duration-500 scale-[1.2]"> 
                     
                     <div className="relative group">
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                       <div className="w-24 h-24 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                          <Command strokeWidth={1} size={48} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/20">
                            NEW
                          </div>
                       </div>
                     </div>

                     <h3 className="text-xl font-light text-slate-300 tracking-tight mb-2">
                       Start building your workflow
                     </h3>
                     <p className="text-slate-500 text-sm max-w-xs text-center leading-relaxed mb-8">
                       Drag blocks from the library or ask AI to generate a data pipeline for you.
                     </p>

                     <div className="flex items-center gap-4 pointer-events-auto">
                       <button 
                         onClick={handleOpenLibrary}
                         className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer"
                       >
                         <MousePointer2 size={12} />
                         <span>Open Library</span>
                       </button>
                       <button 
                         onClick={handleAddFirstBlock}
                         className="flex items-center gap-2 text-xs text-white bg-blue-600/80 hover:bg-blue-600 px-3 py-1.5 rounded-full border border-blue-500/50 hover:border-blue-400 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                       >
                         <Plus size={12} />
                         <span>Add First Block</span>
                       </button>
                       <button 
                         onClick={() => {
                            addBlock(BlockType.LOAD);
                            setTimeout(() => addBlock(BlockType.TRANSFORM), 100);
                            setTimeout(() => addBlock(BlockType.VISUALIZE), 200);
                         }}
                         className="flex items-center gap-2 text-xs text-purple-300 hover:text-white bg-purple-900/20 hover:bg-purple-900/40 px-3 py-1.5 rounded-full border border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer group/sample"
                       >
                         <Zap size={12} className="text-purple-400 group-hover/sample:text-purple-300" />
                         <span>Try Sample Data</span>
                       </button>
                     </div>

                     {/* Connection Glow Hint */}
                     <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-blue-500/50 to-transparent animate-pulse opacity-50 pointer-events-none" />
                   </div>
                ) : (
                  blocks.map((block, index) => {
                    const isFirst = index === 0;
                    const isLast = index === blocks.length - 1;
                    const isSelected = selectedBlockIds.includes(block.id);

                    if (block.type === BlockType.GROUP) {
                       return (
                         <GroupBlock 
                           key={block.id} 
                           block={block} 
                           isSelected={isSelected} 
                           onClick={() => selectBlock(block.id)} 
                           isFirst={isFirst}
                           isLast={isLast}
                         >
                           <div className="text-xs text-slate-500 p-2">Nested blocks support coming soon</div>
                         </GroupBlock>
                       );
                    }
                    return (
                      <div key={block.id}>
                        {/* Inline Insert Button (Before Block, except first one usually handled by empty state or top bar) */}
                        {index > 0 && <InlineInsertButton index={index} onInsert={(type) => insertBlockAt(index, type)} />}
                        
                        <SortableBlockItem 
                          key={block.id}
                          block={block} 
                          isSelected={isSelected} 
                          isFirst={isFirst}
                          isLast={isLast}
                        >
                          <div 
                              onClick={(e) => handleBlockClick(block.id, e)}  
                              onDoubleClick={(e) => { e.stopPropagation(); openPreviewModal(block.id, block.title); }}
                              onMouseEnter={(e) => handleBlockMouseEnter(block.id, e)}
                              onMouseLeave={handleBlockMouseLeave}
                              className="h-full"
                          >
                             {renderBlockContent(block)}
                          </div>
                        </SortableBlockItem>
                      </div>
                    );
                  })
                )}
                {/* Final Insert Button (After last block) */}
                {blocks.length > 0 && <InlineInsertButton index={blocks.length} onInsert={(type) => addBlock(type)} />}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Minimap */}
      {blocks.length > 0 && <Minimap />}
      
      {/* Data Preview Modal */}
      <DataPreviewModal />
      
      {/* Help Tip */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-900/50 pointer-events-none opacity-0 group-hover/workspace:opacity-100 transition-opacity delay-500">
        Space + Drag to Pan • Ctrl + Scroll to Zoom • Shift + Click to Multi-Select
      </div>
    </div>
  );
};
