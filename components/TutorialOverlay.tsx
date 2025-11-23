import React, { useEffect, useState, useRef } from 'react';
import { Node, Edge, NodeType } from '../types';
import { Sparkles, X, ArrowRight, CheckCircle2, MousePointer2, SkipForward, Play, Loader2 } from 'lucide-react';

interface TutorialOverlayProps {
  step: number;
  nodes: Node[];
  edges: Edge[];
  onNext: () => void;
  onClose: () => void;
  onReset: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  activePanelTab?: 'config' | 'preview';
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, nodes, edges, onNext, onClose, onReset, isSidebarOpen, setSidebarOpen, activePanelTab }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  
  // Tutorial Steps Configuration
  const steps = [
    {
      id: 0,
      targetId: null,
      title: "Welcome to Kastor",
      content: "Kastor helps you analyze data visually. No coding required. Let's build a simple pipeline in 3 minutes.",
      action: "Start Tutorial",
      position: 'top-center',
      onStart: () => onReset()
    },
    {
      id: 1,
      targetId: 'btn-add-source',
      title: "1. Get Data",
      content: "First, add a Source block by clicking 'CSV File'. Then, click the 'Upload CSV' area in the panel to load your actual data file.",
      check: () => nodes.some(n => n.type === NodeType.SOURCE && n.data.fileName),
      position: 'right',
      requiresSidebar: true
    },
    {
      id: 2,
      targetId: 'btn-add-filter',
      title: "2. Transform",
      content: "Data is often messy. Add a 'Filter Rows' block, then enter a column and value in the properties panel to configure it completely.",
      check: () => nodes.some(n => 
        n.type === NodeType.TRANSFORM && 
        n.data.config.transformType === 'FILTER' && 
        n.data.config.filterColumn && 
        n.data.config.filterValue !== undefined && n.data.config.filterValue !== ''
      ),
      position: 'right',
      requiresSidebar: true
    },
    {
      id: 3,
      targetId: null,
      title: "3. Connect",
      content: "Great! Now connect the two blocks. Drag from the RIGHT circle of the Source block to the LEFT circle of the Filter block.",
      check: () => {
        // Find source nodes
        const sourceNodes = nodes.filter(n => n.type === NodeType.SOURCE);
        // Check if any edge starts from a source node
        return edges.some(e => sourceNodes.some(s => s.id === e.source));
      },
      position: 'top-center'
    },
    {
      id: 4,
      targetId: 'btn-add-chart',
      title: "4. Visualize",
      content: "Add a 'Bar Chart' block and connect the Filter block to it. Configure X/Y axes, then click the 'Preview & Results' tab to see it.",
      check: () => nodes.some(n => 
          n.type === NodeType.VISUALIZE && 
          n.data.config.xAxis && 
          n.data.config.yAxis
      ) && activePanelTab === 'preview',
      position: 'right',
      requiresSidebar: true
    },
    {
      id: 5,
      targetId: null,
      title: "You're ready! 🚀",
      content: "You've built your first pipeline. Try clicking on nodes to configure them in the properties panel.",
      action: "Finish",
      position: 'top-center'
    }
  ];

  const currentStep = steps[step];

  // 1. Force Sidebar Open if needed
  useEffect(() => {
      if (currentStep && currentStep.requiresSidebar && !isSidebarOpen) {
          setSidebarOpen(true);
      }
  }, [step, currentStep, isSidebarOpen, setSidebarOpen]);

  // 2. Position Tracking with Hysteresis (Smooth Movement)
  useEffect(() => {
    if (!currentStep || !currentStep.targetId) {
        setTargetRect(null);
        return;
    }

    const updatePosition = () => {
        const el = document.getElementById(currentStep.targetId!);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(prev => {
                // Hysteresis: Only update if moved more than 3px to prevent jitter
                if (!prev || Math.abs(prev.top - rect.top) > 3 || Math.abs(prev.left - rect.left) > 3) {
                    return rect;
                }
                return prev;
            });
        } else {
            setTargetRect(null);
        }
    };

    updatePosition();
    const intervalId = setInterval(updatePosition, 100); 
    return () => clearInterval(intervalId);
  }, [step, currentStep, isSidebarOpen]);

  // 3. Reset State ONLY when step changes (Fixes flickering)
  useEffect(() => {
      setIsStepComplete(false);
      setIsAutoAdvancing(false);
  }, [step]);

  // 4. Check for Completion & Auto Advance
  useEffect(() => {
    if (isStepComplete || isAutoAdvancing) return;

    if (currentStep && currentStep.check) {
        const checkInterval = setInterval(() => {
             // Re-check completion
             if (currentStep.check && currentStep.check()) {
                 setIsStepComplete(true);
                 setIsAutoAdvancing(true);
                 clearInterval(checkInterval);
                 
                 // Auto advance after 1 second delay so user sees success state
                 setTimeout(() => {
                     handleNextWrapper();
                 }, 1000);
             }
        }, 500);
        return () => clearInterval(checkInterval);
    }
  }, [nodes, edges, step, currentStep, isStepComplete, isAutoAdvancing, activePanelTab]);
  
  const handleNextWrapper = () => {
      if (currentStep.onStart) {
          currentStep.onStart();
      }
      onNext();
  };

  if (step >= steps.length) return null;

  // Calculate Card Position based on target
  const getCardStyle = () => {
    if (!currentStep.targetId || !targetRect) {
        if (currentStep.position === 'top-center') {
            return { top: '15%', left: '50%', transform: 'translate(-50%, 0)' };
        }
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    return {
        top: targetRect.top,
        left: targetRect.right + 24, 
    };
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden font-sans">
        
        {/* Spotlight Highlighter (Non-blocking) */}
        {targetRect && (
            <div 
                className="absolute rounded-lg border-2 border-primary shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-300 ease-out pointer-events-none animate-pulse"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8
                }}
            />
        )}

        {/* Instruction Card */}
        <div 
            className="absolute pointer-events-auto bg-surface/95 backdrop-blur-md border border-primary/30 p-6 rounded-xl shadow-2xl w-[360px] transition-all duration-300 ease-out animate-in fade-in slide-in-from-left-2"
            style={getCardStyle()}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors duration-300 ${isStepComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'}`}>
                        {isStepComplete ? <CheckCircle2 className="w-5 h-5 animate-in zoom-in spin-in-90" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <span className="font-bold text-white text-base">{currentStep.title}</span>
                </div>
                <button 
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors p-1"
                    title="Skip Tutorial"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <p className="text-gray-300 text-sm leading-relaxed mb-5">
                {currentStep.content}
            </p>

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                        {steps.map((s, i) => (
                            <div 
                                key={s.id} 
                                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-gray-700'}`} 
                            />
                        ))}
                    </div>
                </div>

                {currentStep.action ? (
                    <button 
                        onClick={currentStep.id === 5 ? onClose : handleNextWrapper}
                        className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                    >
                        {currentStep.action === 'Start Tutorial' && <Play className="w-3.5 h-3.5 fill-current" />}
                        {currentStep.action !== 'Start Tutorial' && <ArrowRight className="w-4 h-4" />}
                        {currentStep.action} 
                    </button>
                ) : (
                    <>
                        {isStepComplete ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-1">
                                <span>Great! Continuing...</span>
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-400 font-medium flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Waiting for action...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};