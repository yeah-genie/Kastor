import { useBlockStore } from '../../store/useBlockStore';
import { useUIStore } from '../../store/useUIStore';
import { BlockType } from '../../types';

export const Minimap = () => {
  const blocks = useBlockStore(state => state.blocks);
  const { zoom, pan, setPan } = useUIStore();
  
  // Minimap scale factor (e.g., 1/10th of the real size)
  const scale = 0.1;
  
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Move pan to center this position
    // Target Y in real coordinates = y / scale
    // We want to center this, so pan.y = - (TargetY) + CanvasHeight/2
    // For MVP, simple approximation:
    const targetY = (y / scale) * -1 + 500; // Offset
    setPan(prev => ({ x: prev.x, y: targetY }));
  };

  return (
    <div className="absolute bottom-6 left-6 w-40 h-28 bg-slate-900/50 border border-slate-700/30 rounded-lg backdrop-blur-sm shadow-lg overflow-hidden z-10 group transition-all hover:scale-105 hover:bg-slate-900 hover:border-slate-600 hover:shadow-2xl opacity-60 hover:opacity-100">
      <div 
        className="w-full h-full relative cursor-crosshair opacity-50 group-hover:opacity-100 transition-opacity"
        onClick={handleMinimapClick}
      >
        {/* Blocks Representation */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-1">
           {blocks.map(block => (
             <div 
               key={block.id}
               className={`w-20 h-3 rounded-[2px] ${
                 block.type === BlockType.LOAD ? 'bg-blue-500' :
                 block.type === BlockType.INSIGHT ? 'bg-amber-500' :
                 block.type === BlockType.VISUALIZE ? 'bg-green-500' :
                 'bg-slate-600'
               }`} 
             />
           ))}
        </div>

        {/* Viewport Indicator */}
        {/* This is a simplified viewport box. Calculating exact viewport rect requires window size ref */}
        <div 
          className="absolute left-0 w-full border-2 border-white/20 bg-white/5 pointer-events-none"
          style={{
            top: `${Math.max(0, (-pan.y * scale) + 10)}px`,
            height: `${(100 / zoom)}%` // Rough approximation of viewport height
          }}
        />
      </div>
      <div className="absolute bottom-1 right-1 text-[8px] text-slate-600 font-mono pointer-events-none">
         MINIMAP
      </div>
    </div>
  );
};

