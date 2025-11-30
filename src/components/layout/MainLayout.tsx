import { LibraryPanel } from '../panels/LibraryPanel';
import { WorkspacePanel } from '../panels/WorkspacePanel';
import { AIPanel } from '../panels/AIPanel';
import { RunHistoryPanel } from '../panels/RunHistoryPanel';
import { TopBar } from './TopBar';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, History } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const MainLayout = () => {
  const { 
    isLibraryOpen, 
    isRightPanelOpen, 
    activeRightTab, 
    toggleLibrary, 
    toggleRightPanel,
    setActiveRightTab,
    isChatOnly
  } = useUIStore();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-200 flex flex-col">
      
      {/* Top Bar - Hidden in ChatOnly */}
      {!isChatOnly && <TopBar />}

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Left Panel (Collapsible) - Hidden in ChatOnly */}
        {!isChatOnly && (
          <div 
            className={`
              relative z-20 h-full border-r border-slate-800 bg-slate-900/95 backdrop-blur-md transition-all duration-300 ease-in-out shrink-0
              ${isLibraryOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-r-0'}
            `}
          >
            <div className="h-full w-72">
              <LibraryPanel />
            </div>
          </div>
        )}

        {/* Toggle Button for Left Panel - Hidden in ChatOnly */}
        {!isChatOnly && (
          <button
            onClick={toggleLibrary}
            className={`
              absolute top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg border border-slate-700 transition-all duration-300
              ${isLibraryOpen ? 'left-72 -ml-4' : 'left-4'}
            `}
          >
            {isLibraryOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        )}

        {/* Center Panel (Workspace) - Hidden in ChatOnly */}
        {!isChatOnly && <WorkspacePanel />}

        {/* Toggle Button for Right Panel - Hidden in ChatOnly */}
        {!isChatOnly && (
          <button
            onClick={toggleRightPanel}
            className={`
              absolute top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg border border-slate-700 transition-all duration-300
              ${isRightPanelOpen ? 'right-96 -mr-4' : 'right-4'}
            `}
          >
            {isRightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}

        {/* Right Panel (Collapsible Flow - OR Centered Chat Only) */}
        <div 
          className={`
            relative z-20 h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col shrink-0
            ${isChatOnly 
              ? 'absolute inset-0 w-full border-none items-center justify-center bg-slate-950' 
              : `bg-slate-900/95 backdrop-blur-md shadow-2xl border-l border-slate-800 ${isRightPanelOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full overflow-hidden border-l-0 opacity-0 pointer-events-none'}`
            }
          `}
        >
           {/* Right Panel Tabs - Hidden in ChatOnly */}
           {/* Removed Kastor AI header based on user feedback */}
           
           {/* History Header - if History is active */}
           {!isChatOnly && activeRightTab === 'history' && (
              <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/50 shrink-0">
                 <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase">
                    <History size={14} /> Run History
                 </div>
                 <button onClick={() => setActiveRightTab('ai')} className="text-slate-500 hover:text-white text-[10px] underline">
                    Back to AI
                 </button>
              </div>
           )}

           {/* Content */}
           <div className={`flex-1 overflow-hidden relative h-full w-full ${isChatOnly ? 'max-w-3xl' : ''}`}>
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                 {isChatOnly ? <AIPanel /> : activeTabContent(activeRightTab)}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

function activeTabContent(tab: 'inspector' | 'ai' | 'history') {
  switch (tab) {
    case 'inspector': return <AIPanel />; // Fallback to AI since Inspector is removed
    case 'ai': return <AIPanel />;
    case 'history': return <RunHistoryPanel />;
    default: return null;
  }
}
