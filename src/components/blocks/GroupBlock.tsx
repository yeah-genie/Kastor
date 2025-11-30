import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block } from '../../types';
import { ChevronDown, ChevronRight, GripVertical, Folder } from 'lucide-react';
import { useBlockStore } from '../../store/useBlockStore';

interface GroupBlockProps {
  block: Block;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

export const GroupBlock = ({ block, isSelected, onClick, children, isFirst = false, isLast = false }: GroupBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const updateBlockConfig = useBlockStore(state => state.updateBlockConfig);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
    marginTop: isFirst ? '0px' : '-12px',
    paddingBottom: '12px', // Reserve for bottom bump
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateBlockConfig(block.id, { collapsed: !block.collapsed } as any);
  };

  // Group Block also needs puzzle shapes!
  // But it's C-shaped.
  // The "Header" acts like a normal block top.
  // The "Footer" acts like a normal block bottom.
  
  const notchDepth = 12; 
  const notchWidth = 48;
  const notchStart = 24;
  const notchEnd = notchStart + notchWidth;

  const topPath = isFirst 
    ? '0% 0%, 100% 0%' 
    : `0% 0%, ${notchStart}px 0%, ${notchStart}px ${notchDepth}px, ${notchEnd}px ${notchDepth}px, ${notchEnd}px 0%, 100% 0%`;

  const bottomPath = isLast
    ? `100% calc(100% - ${notchDepth}px), 0% calc(100% - ${notchDepth}px)` 
    : `100% calc(100% - ${notchDepth}px), ${notchEnd}px calc(100% - ${notchDepth}px), ${notchEnd}px 100%, ${notchStart}px 100%, ${notchStart}px calc(100% - ${notchDepth}px), 0% calc(100% - ${notchDepth}px)`;

  const clipPath = `polygon(${topPath}, ${bottomPath})`;

  return (
    <div ref={setNodeRef} style={{...style, clipPath}} {...attributes} className={`mb-0 relative group/container ${isSelected ? 'drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]'}`}>
      {/* C-Shape Container */}
      <div className={`
        relative transition-all rounded-lg overflow-hidden bg-slate-900 border
        ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-600 hover:border-slate-500'}
      `} style={{ height: '100%' }}>
        
        {/* Header (Top Bar of C) */}
        <div 
          onClick={onClick}
          className={`
            flex items-center gap-2 p-2 border-b border-slate-700/50 cursor-pointer h-10 relative
            ${isSelected ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700'}
            ${!isFirst ? 'pt-4' : ''}
          `}
          style={{ height: !isFirst ? '48px' : '40px' }}
        >
          {/* Inner Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/10 pointer-events-none" />
          <div {...listeners} className="text-slate-500 cursor-grab p-1 hover:text-slate-300">
            <GripVertical size={14} />
          </div>
          
          <button onClick={toggleCollapse} className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700">
            {block.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          <Folder size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{block.title || "Group"}</span>
          
          {block.collapsed && (
             <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full ml-auto">
               {block.children?.length || 0} items
             </span>
          )}
        </div>

        {/* Body (Content of C) */}
        {!block.collapsed && (
          <div className="flex bg-slate-950/30">
            {/* Left Indentation Line (Vertical Bar of C) */}
            <div className="w-4 border-r-2 border-slate-800 bg-slate-900/50 ml-2 my-1 rounded-l-md" />
            
            {/* Content Area */}
            <div className="flex-1 p-2 min-h-[60px] bg-slate-950/10">
               {children}
               {/* Drop Zone Placeholder */}
               <div className="h-8 border border-dashed border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-600 bg-slate-900/20">
                 Drop blocks here
               </div>
            </div>
          </div>
        )}

        {/* Footer (Bottom Bar of C) */}
        {!block.collapsed && (
          <div className="h-3 bg-slate-900 border-t border-slate-800/50 rounded-b-lg" />
        )}
      </div>
    </div>
  );
};
