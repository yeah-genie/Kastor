import { ReactNode, useState, useRef, useEffect } from 'react';
import { Block } from '../../types';
import { GripVertical, MoreVertical, Copy, Trash2, EyeOff, AlertTriangle, Wand2, Code, ImageDown, RefreshCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { useBlockStore } from '../../store/useBlockStore';
import { useUIStore } from '../../store/useUIStore';
import { generateMockCode } from '../../utils/codeGenerator';
import html2canvas from 'html2canvas';

interface BlockCardProps {
  block: Block;
  isSelected: boolean;
  onClick: () => void;
  children?: ReactNode;
  dragHandleProps?: any;
  isFirst?: boolean;
  isLast?: boolean;
}

export const BlockCard = ({ block, isSelected, children, dragHandleProps, isFirst = false, isLast = false }: BlockCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCodeView, setIsCodeView] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false); // Renaming State
  const [titleInput, setTitleInput] = useState(block.title);
  
  // Animation State for Snap
  const [isSnapping, setIsSnapping] = useState(false);
  
  const { duplicateBlock, removeBlock, renameBlock, toggleBlockCollapse } = useBlockStore();
  const { setChatOnly, setActiveRightTab } = useUIStore();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(block.title);
  }, [block.title]);

  // Trigger Snap Animation on Mount (Simulating Snap)
  useEffect(() => {
     setIsSnapping(true);
     const timer = setTimeout(() => setIsSnapping(false), 300);
     return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleRenameSubmit = () => {
    if (titleInput.trim()) {
        renameBlock(block.id, titleInput.trim());
    } else {
        setTitleInput(block.title); // Revert if empty
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleRenameSubmit();
    } else if (e.key === 'Escape') {
        setTitleInput(block.title);
        setIsEditingTitle(false);
    }
    e.stopPropagation(); // Prevent interfering with global shortcuts
  };

  // Shape Logic:
  const notchDepth = 12; // Increased depth for more "block-like" feel
  const notchWidth = 48;
  const notchStart = 24;
  const notchEnd = notchStart + notchWidth;

  const topPath = isFirst 
    ? '0% 0%, 100% 0%'
    : `0% 0%, ${notchStart}px 0%, ${notchStart}px ${notchDepth}px, ${notchEnd}px ${notchDepth}px, ${notchEnd}px 0%, 100% 0%`;

  // If collapsed, bottom path should still have the notch to connect to next block, 
  // but the visual height is small.
  const bottomPath = isLast
    ? `100% 100%, 0% 100%`
    : `100% calc(100% - ${notchDepth}px), ${notchEnd}px calc(100% - ${notchDepth}px), ${notchEnd}px 100%, ${notchStart}px 100%, ${notchStart}px calc(100% - ${notchDepth}px), 0% calc(100% - ${notchDepth}px)`;

  const clipPath = `polygon(${topPath}, ${bottomPath})`;

  const handleExportImage = async () => {
    if (!cardRef.current) return;
    
    try {
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null, // Transparent background
            scale: 2, // High resolution
            logging: false,
            useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `kastor-block-${block.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Export failed:', err);
    }
  };

  const handleMenuAction = (action: 'duplicate' | 'delete' | 'disable' | 'export', e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (action === 'duplicate') duplicateBlock(block.id);
    if (action === 'delete') removeBlock(block.id);
    if (action === 'export') handleExportImage();
  };

  const handleFixWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatOnly(false);
    setActiveRightTab('ai');
    window.dispatchEvent(new CustomEvent('ai-trigger', { 
        detail: { message: `Fix error in block "${block.title}": ${block.errorMessage || 'Missing configuration'}` } 
    }));
  };

  return (
      <div 
      ref={cardRef}
      className={`
        relative transition-all duration-300 ease-out mb-0 group overflow-visible origin-top
        ${isSelected ? 'z-10 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]'}
        ${block.status === 'error' ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''} 
        ${block.isStale ? 'opacity-90' : ''}
        ${isSnapping ? 'scale-[1.02]' : 'scale-100'} 
      `}
      style={{
        marginTop: isFirst ? '0px' : '-12px', 
        paddingBottom: isLast ? '0px' : '12px', 
        clipPath, 
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      {/* Connection Glow Effect */}
      {!isLast && !block.collapsed && (
         <div className="absolute left-[24px] bottom-[1px] w-[48px] h-[12px] z-0 pointer-events-none">
            <div className="absolute inset-0 bg-blue-500/20 blur-[4px] animate-pulse rounded-b-lg" />
         </div>
      )}

      {/* Flash Effect on Snap */}
      {isSnapping && !isFirst && (
         <div className="absolute top-0 left-[24px] w-[48px] h-[12px] bg-white/80 blur-md z-20 animate-ping duration-300" />
      )}

      <div className={`
         bg-slate-900 rounded-lg overflow-hidden transition-all border
         ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-600 hover:border-slate-500'}
         ${block.status === 'error' ? 'border-red-500 ring-1 ring-red-500/50 bg-red-950/10' : ''}
         ${block.isStale ? 'border-amber-500/50 border-dashed bg-amber-950/5' : ''}
      `}
      style={{ height: '100%' }} 
      >
          {/* Header */}
          <div className={`
            flex items-center justify-between px-2 py-1.5 border-b transition-colors relative
            ${isSelected ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 group-hover:bg-slate-800 border-slate-700'}
            ${block.status === 'error' ? 'bg-red-900/20 border-red-500/30' : ''}
            ${block.isStale ? 'bg-amber-900/10 border-amber-500/30' : ''}
            ${!isFirst ? 'pt-2' : ''} 
            ${block.collapsed ? 'border-b-0' : ''}
          `}>
             {/* Inner Top Highlight for 3D feel */}
             <div className="absolute inset-x-0 top-0 h-px bg-white/10 pointer-events-none" />
             <div className="flex items-center gap-2 flex-1 overflow-hidden">
               <div 
                 {...dragHandleProps}
                 className="text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-700 rounded hover:text-slate-300 shrink-0"
               >
                 <GripVertical size={14} />
               </div>
               
               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBlockCollapse(block.id);
                  }}
                  className="text-slate-500 hover:text-white p-0.5 rounded hover:bg-slate-700 transition-colors"
               >
                  {block.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
               </button>

               <div className="flex items-baseline gap-2 min-w-0 w-full pr-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">{block.type}</span>
                  {isEditingTitle ? (
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        className="bg-slate-950 border border-blue-500 rounded px-1 py-0.5 text-xs font-semibold text-white outline-none w-full"
                        onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                        className={`font-semibold text-xs truncate cursor-text hover:text-blue-300 transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingTitle(true);
                        }}
                        title="Click to rename"
                    >
                        {block.title}
                    </span>
                  )}
               </div>
             </div>
             
             <div className="flex items-center gap-1 relative shrink-0">
                {block.status === 'error' && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-[9px] text-red-400 font-bold animate-pulse">
                    <AlertTriangle size={8} />
                    ERR
                  </div>
                )}
                
                {block.isStale && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/50 rounded text-[9px] text-amber-400 font-bold">
                    <RefreshCcw size={8} />
                    STALE
                  </div>
                )}

                <span className={`w-1.5 h-1.5 rounded-full shadow-sm mx-1 ${
                    block.status === 'idle' ? 'bg-slate-600' : 
                    block.status === 'success' ? 'bg-emerald-400 shadow-emerald-400/50' : 
                    block.status === 'error' ? 'bg-red-500 shadow-red-500/50' :
                    'bg-blue-400 shadow-blue-400/50'
                }`} />
                
                {/* Code View Toggle (Hover-reveal) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCodeView(!isCodeView);
                  }}
                  className={`p-1 rounded transition-colors ${isCodeView ? 'bg-slate-700 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-700'} opacity-0 group-hover:opacity-100`}
                  title="Toggle Code View"
                >
                  <Code size={12} />
                </button>

                {/* Context Menu Button (Hover-reveal) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={12} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-6 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={(e) => handleMenuAction('duplicate', e)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                      <Copy size={12} /> Duplicate
                    </button>
                    <button onClick={(e) => handleMenuAction('export', e)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                      <ImageDown size={12} /> Export Image
                    </button>
                    <button onClick={(e) => handleMenuAction('disable', e)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                      <EyeOff size={12} /> Disable
                    </button>
                    <div className="h-px bg-slate-700 my-0.5" />
                    <button onClick={(e) => handleMenuAction('delete', e)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
                
                {/* Backdrop to close menu */}
                {showMenu && (
                  <div className="fixed inset-0 z-40" onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }} />
                )}
             </div>
          </div>
          
          {/* Content */}
          {!block.collapsed && (
            <div className={`p-2 min-h-[40px] ${block.status === 'error' ? 'bg-red-950/5' : 'bg-slate-950/30'}`}>
              {isCodeView ? (
                <div className="relative group/code animate-in fade-in zoom-in-95 duration-200">
                    <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                      <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700 uppercase font-bold tracking-wider">Python</span>
                    </div>
                    <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto custom-scrollbar leading-relaxed">
                      {generateMockCode(block)}
                    </pre>
                </div>
              ) : (
                <>
                  {children || <div className="text-sm text-slate-500 italic">No configuration</div>}
                  
                  {/* Error Message & Fix Action */}
                  {block.status === 'error' && (
                    <div className="mt-3 pt-3 border-t border-red-500/20 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                          <p className="text-xs text-red-300 font-medium">Missing required column: 'date'</p>
                          <button 
                            onClick={handleFixWithAI}
                            className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-[10px] font-bold text-red-400 transition-colors w-full justify-center"
                          >
                            <Wand2 size={10} />
                            Fix with AI
                          </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
      </div>
    </div>
  );
};
