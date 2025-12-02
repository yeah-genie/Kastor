import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { MessageSquare, X } from 'lucide-react';

export const CanvasAnnotations = () => {
  const { annotations, updateAnnotation, removeAnnotation, moveAnnotation, zoom } = useUIStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);
    dragOffset.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingId) {
        const annotation = annotations.find(a => a.id === draggingId);
        if (annotation) {
           const dx = (e.clientX - dragOffset.current.x) / zoom;
           const dy = (e.clientY - dragOffset.current.y) / zoom;
           moveAnnotation(draggingId, annotation.x + dx, annotation.y + dy);
           dragOffset.current = { x: e.clientX, y: e.clientY };
        }
      }
    };
    const handleMouseUp = () => setDraggingId(null);
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, annotations, moveAnnotation, zoom]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
      {annotations.map((note) => {
        const isActive = activeId === note.id;
        return (
          <div 
            key={note.id}
            className="absolute pointer-events-auto group"
            style={{ left: note.x, top: note.y }}
            onClick={(e) => { e.stopPropagation(); setActiveId(note.id); }}
            onMouseEnter={() => setActiveId(note.id)}
            onMouseLeave={() => { if (!document.activeElement?.closest('.annotation-input')) setActiveId(null); }}
          >
             {/* Pin/Avatar Marker */}
             <div 
               className={`
                 relative w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing transition-all duration-200 z-20
                 ${isActive ? 'scale-110 border-white bg-blue-500' : 'border-white bg-slate-800 group-hover:bg-blue-500 group-hover:scale-105'}
               `}
               onMouseDown={(e) => handleMouseDown(e, note.id)}
             >
               {/* User Initials */}
               <span className="text-[10px] font-bold text-white">YJ</span>
               
               {/* Connecting Line (when open) */}
               {isActive && (
                 <svg className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 overflow-visible pointer-events-none">
                    <line x1="0" y1="0" x2="0" y2="16" stroke="white" strokeWidth="2" />
                 </svg>
               )}
             </div>

             {/* Comment Bubble (Figma Style) */}
             <div 
                className={`
                  absolute left-1/2 -translate-x-1/2 top-12 w-56 bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden transition-all duration-200 origin-top z-10
                  ${isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                `}
             >
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Comment</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAnnotation(note.id); }}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                       <X size={12} />
                    </button>
                </div>
                <div className="p-2">
                    <textarea 
                        value={note.content}
                        onChange={(e) => updateAnnotation(note.id, e.target.value)}
                        className="annotation-input w-full min-h-[60px] bg-transparent text-xs text-slate-200 placeholder-slate-600 resize-none outline-none leading-relaxed"
                        placeholder="Add a comment..."
                        onKeyDown={(e) => e.stopPropagation()}
                        autoFocus={isActive}
                    />
                </div>
                <div className="px-2 py-1 bg-slate-800/30 flex justify-end">
                   <span className="text-[9px] text-slate-500">Just now</span>
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};
