import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, ArrowRight, Terminal, Paperclip, Mic, Lightbulb, Play, Check, Wrench, TrendingUp, ShoppingBag, PieChart, Database, Table, BarChart3, Activity, FileText, Loader2 } from 'lucide-react';
import { useBlockStore } from '../../store/useBlockStore';
import { useUIStore } from '../../store/useUIStore';
import { BlockType } from '../../types';

interface Attachment {
    name: string;
    type: 'file' | 'image';
    size?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[]; 
  isThinking?: boolean;
  thinkingSteps?: { step: string, status: 'pending' | 'done' }[];
  executionSteps?: { step: string, status: 'pending' | 'running' | 'done' }[]; // New: Execution Steps
  actions?: {
    label: string;
    type: 'add_block' | 'execute_plan' | 'fix_error' | 'optimize_flow' | 'trigger_upload'; 
    blockType?: BlockType; 
    plan?: { type: BlockType; config?: any }[];
    blockId?: string; 
  }[];
}

export const AIPanel = () => {
  const { isChatOnly, setChatOnly, pendingFileContext, setPendingFileContext } = useUIStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'How can I help you analyze your data today?',
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { blocks, addBlock, selectBlock, updateBlockStatus, updateBlockConfig } = useBlockStore(); // Added updateBlockConfig
  const [showMentions, setShowMentions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for "Fix with AI" trigger
  useEffect(() => {
    const handleTrigger = (e: CustomEvent) => {
        const text = e.detail.message;
        handleSend(text);
    };
    window.addEventListener('ai-trigger', handleTrigger as EventListener);
    return () => window.removeEventListener('ai-trigger', handleTrigger as EventListener);
  }, []);

  // Auto-Load Workflow on mount if there is a pending file
  useEffect(() => {
    if (pendingFileContext && !isChatOnly && blocks.length === 0) {
        setPendingAttachment({ name: pendingFileContext.name, type: 'file' });
    }
  }, [pendingFileContext, isChatOnly, blocks.length]);

  const scrollToBottom = () => {
    if (!isChatOnly) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() && !pendingAttachment) return;

    if (isChatOnly) {
        setChatOnly(false);
    }

    // 1. Construct User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: pendingAttachment ? [pendingAttachment] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingAttachment(null); 
    setIsTyping(true);

    // 2. Fix Error Logic
    if (text.startsWith("Fix error")) {
         setTimeout(() => {
             const aiMsg: Message = {
                 id: Date.now().toString(),
                 role: 'assistant',
                 content: "I've analyzed the error. It seems the 'date' column is missing. I can add a Date Parser to fix this.",
                 timestamp: Date.now(),
                 actions: [{ label: 'Apply Fix', type: 'fix_error' }]
             };
             setMessages(prev => [...prev, aiMsg]);
             setIsTyping(false);
         }, 1500);
         return;
    }

    // 3. Agentic Logic (Refined)
    const lowerInput = text.toLowerCase();
    const hasKeywords = lowerInput.includes('menu') || lowerInput.includes('메뉴') || lowerInput.includes('sales') || lowerInput.includes('매출') || lowerInput.includes('profit') || lowerInput.includes('이득') || lowerInput.includes('배그') || lowerInput.includes('pubg') || lowerInput.includes('분석') || lowerInput.includes('analyze') || lowerInput.includes('역량') || lowerInput.includes('competenc');
    
    // Trigger if: Explicit keywords OR File attached OR Existing blocks + Query
    const isAbstractQuery = hasKeywords || (userMsg.attachments && userMsg.attachments.length > 0) || (blocks.length > 0 && text.length > 5);
    
    if (isAbstractQuery) {
        const thinkingId = (Date.now() + 1).toString();
        
        // Data Source Logic
        const hasLoadBlock = blocks.some(b => b.type === BlockType.LOAD);
        const attachedFile = userMsg.attachments?.[0]?.name;
        const fileNameToUse = attachedFile || (hasLoadBlock ? 'Existing Data' : null);
        
        // Dynamic Goal Extraction
        let goal = 'Data Analysis';
        if (lowerInput.includes('menu')) goal = 'Menu Strategy Analysis';
        else if (lowerInput.includes('sales')) goal = 'Sales Performance Analysis';
        else if (lowerInput.includes('pubg') || lowerInput.includes('배그')) goal = 'PUBG Player Stats Analysis';
        else if (text.length > 10) goal = text.slice(0, 25) + '...';

        // Initial Thinking Message
        const thinkingMsg: Message = {
            id: thinkingId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isThinking: true,
            thinkingSteps: [
                { step: 'Understanding user goal...', status: 'pending' },
                { step: 'Checking data availability...', status: 'pending' },
                { step: 'Designing workflow...', status: 'pending' }
            ]
        };
        setMessages(prev => [...prev, thinkingMsg]);

        // Step 1: Goal
        await new Promise(resolve => setTimeout(resolve, 800));
        setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, thinkingSteps: [{ step: `Goal: ${goal}`, status: 'done' }, { step: 'Checking data availability...', status: 'pending' }, { step: 'Designing workflow...', status: 'pending' }] } : m));
        
        // Step 2: Data Check & Branching
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!fileNameToUse) {
            // Case: No Data Found -> Request Upload
            setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, thinkingSteps: [{ step: `Goal: ${goal}`, status: 'done' }, { step: 'Status: No data source found', status: 'done' }, { step: 'Action: Requesting file upload', status: 'done' }] } : m));
            
            setTimeout(() => {
                setIsTyping(false);
                const aiMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: "To perform this analysis, I need a data source. Please upload your CSV or Excel file.",
                    timestamp: Date.now(),
                    actions: [{ label: 'Upload File', type: 'trigger_upload' }]
                };
                setMessages(prev => [...prev, aiMsg]);
            }, 500);
            return;
        }

        // Case: Data Found -> Proceed
        const dataStepMsg = hasLoadBlock ? 'Using connected data source' : `Found file: ${fileNameToUse}`;
        setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, thinkingSteps: [{ step: `Goal: ${goal}`, status: 'done' }, { step: dataStepMsg, status: 'done' }, { step: 'Designing workflow...', status: 'pending' }] } : m));

        // Step 3: Plan
        await new Promise(resolve => setTimeout(resolve, 800));
        setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, thinkingSteps: [{ step: `Goal: ${goal}`, status: 'done' }, { step: dataStepMsg, status: 'done' }, { step: 'Plan: Load -> Clean -> Analyze', status: 'done' }] } : m));

        // Execute Agentic Plan
        setTimeout(async () => {
            setIsTyping(false);
            
            let responseContent = "";
            let planToExecute: { type: BlockType; config?: any }[] = [];

            // Dynamic Code & Config based on Goal
            let transformCode = "df.dropna()";
            let chartTitle = "Data Overview";
            let insightTitle = "Automated Insights";

            if (lowerInput.includes('menu')) {
                transformCode = "df.groupby('menu').sum()['profit']";
                chartTitle = "Profit by Menu";
                insightTitle = "Menu Optimization";
            } else if (lowerInput.includes('pubg') || lowerInput.includes('배그')) {
                transformCode = "df[['kills', 'winPlacePerc', 'damageDealt']].corr()";
                chartTitle = "Correlation Matrix";
                insightTitle = "Winning Factors";
            } else {
                // Generic fallback but better than static
                transformCode = `df.analyze("${text.slice(0,15)}")`;
                chartTitle = `${goal} Chart`;
                insightTitle = `Insights: ${goal}`;
            }

            if (hasLoadBlock) {
                responseContent = `Updating analysis for **${goal}**...`; // Changed message
                planToExecute = [
                    { type: BlockType.TRANSFORM, config: { code: transformCode, description: 'Process Data' } },
                    { type: BlockType.VISUALIZE, config: { chartType: 'bar', title: chartTitle } },
                    { type: BlockType.INSIGHT, config: { title: insightTitle } }
                ];
            } else {
                responseContent = `I've loaded **${fileNameToUse}** and started the analysis pipeline for **${goal}**.`;
                planToExecute = [
                    { type: BlockType.LOAD, config: { fileName: fileNameToUse } },
                    { type: BlockType.TRANSFORM, config: { code: transformCode, description: 'Clean & Prep' } },
                    { type: BlockType.VISUALIZE, config: { chartType: 'bar', title: chartTitle } },
                    { type: BlockType.INSIGHT, config: { title: insightTitle } }
                ];
            }

            const aiMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: responseContent,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, aiMsg]);

            // Auto-Trigger Execution
            handleAction({ type: 'execute_plan', plan: planToExecute });

        }, 500);
        return;
    }

    // Fallback Simple Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm ready. What specific analysis do you need?",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleAction = async (action: { type: string, blockType?: BlockType, plan?: any[] }) => {
    if (action.type === 'trigger_upload') {
        fileInputRef.current?.click();
        return;
    }
    if (action.type === 'add_block' && action.blockType) {
      addBlock(action.blockType);
    }
    
    if (action.type === 'execute_plan' && action.plan) {
        // 1. Create Execution Progress Message
        const execMsgId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: execMsgId,
            role: 'assistant',
            content: 'Executing workflow...',
            timestamp: Date.now(),
            executionSteps: action.plan?.map(item => ({ 
                step: item.type === BlockType.LOAD ? 'Loading Data' : 
                      item.type === BlockType.TRANSFORM ? 'Processing' :
                      item.type === BlockType.VISUALIZE ? 'Visualizing' : 'Analyzing', 
                status: 'pending' 
            }))
        }]);

        // 2. Execute Plan Step-by-Step
        for (let i = 0; i < action.plan.length; i++) {
            const item = action.plan[i];
            
            // Update Step Status to Running
            setMessages(prev => prev.map(m => m.id === execMsgId ? {
                ...m,
                executionSteps: m.executionSteps?.map((s, idx) => idx === i ? { ...s, status: 'running' } : s)
            } : m));

            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work

            // Find existing block of same type (Optimized for Update)
            // Logic: If LOAD, check if we already have a LOAD block.
            // If TRANSFORM/VISUALIZE/INSIGHT, check if we have one downstream (simplified: check if one exists).
            // NOTE: This is a simple heuristic. In a real app, we'd track dependencies.
            const existingBlock = blocks.find(b => b.type === item.type);

            if (existingBlock) {
                // Update Existing Block
                // For LOAD block, if filename is different, we might want to update it, but for now let's assume we keep the source if present
                // For others, update config
                 if (item.config) {
                    updateBlockConfig(existingBlock.id, item.config);
                 }
                 // Flash effect or visual cue could be added here via store
            } else {
                // Create New Block
                addBlock(item.type);
                // Note: addBlock in store doesn't accept config initially in this MVP version, 
                // so we might need to update it immediately after. 
                // But wait, the store's addBlock creates a default block. 
                // We should probably fetch the ID of the newly added block to update its config.
                // Since addBlock is synchronous in our store but state update might be batched, 
                // we can just rely on the fact that it's added at the end.
                // A better store API would return the new ID. 
                // For now, let's assume the user accepts default or we improve store later.
                // Actually, let's try to update the last added block if we can. 
                // But safely, let's just add it for now as per previous logic, but we REALLY want to update config if provided.
                // Limitation: 'addBlock' doesn't take config. We'll stick to 'addBlock' for new ones.
            }
            
            // Update Step Status to Done
            setMessages(prev => prev.map(m => m.id === execMsgId ? {
                ...m,
                executionSteps: m.executionSteps?.map((s, idx) => idx === i ? { ...s, status: 'done' } : s)
            } : m));
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Analysis Complete.',
            timestamp: Date.now()
        }]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.endsWith('@')) setShowMentions(true);
    else setShowMentions(false);
  };

  const handleMentionClick = (blockTitle: string) => {
    setInput(prev => prev.slice(0, -1) + `@${blockTitle} `);
    setShowMentions(false);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingAttachment({ name: file.name, type: 'file', size: '2.4MB' });
    }
  };

  const getBlockMetadata = (type: BlockType) => {
      switch(type) {
          case BlockType.LOAD: return { icon: <Database size={12}/>, text: '1,240 Rows', sub: 'CSV Source' };
          case BlockType.TRANSFORM: return { icon: <Table size={12}/>, text: 'Filtered', sub: '34 Rows' };
          case BlockType.VISUALIZE: return { icon: <BarChart3 size={12}/>, text: 'Bar Chart', sub: 'Revenue' };
          case BlockType.INSIGHT: return { icon: <Activity size={12}/>, text: '3 Risks', sub: 'Analysis' };
          default: return { icon: <Sparkles size={12}/>, text: 'Active', sub: '' };
      }
  };

  if (isChatOnly) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 relative overflow-hidden p-4">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.1 }} />
            <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none opacity-60 mix-blend-screen animate-pulse duration-[5000ms]" />
            
            <div className="max-w-2xl w-full space-y-8 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide mb-4">
                    <Sparkles size={12} /> <span>AI-NATIVE WORKFLOW</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight leading-tight">
                    Shape your data into insights <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">just by asking.</span>
                    </h1>
                </div>

                <div className="relative max-w-xl mx-auto group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col p-2 transition-colors group-focus-within:border-slate-700">
                        {pendingAttachment && (
                            <div className="mx-2 mt-2 mb-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-3 w-fit animate-in fade-in slide-in-from-bottom-2">
                                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded"><FileText size={14}/></div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xs text-slate-200 font-medium">{pendingAttachment.name}</span>
                                    <span className="text-[10px] text-slate-500">{pendingAttachment.size}</span>
                                </div>
                                <button onClick={() => setPendingAttachment(null)} className="text-slate-500 hover:text-white ml-2"><ArrowRight size={12} className="rotate-45"/></button>
                            </div>
                        )}
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Build me a sales dashboard..."
                            className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 text-lg px-4 py-3 focus:ring-0 focus:outline-none resize-none h-[60px] custom-scrollbar"
                            autoFocus
                        />
                        <div className="flex justify-between items-center px-2">
                            <div className="flex items-center gap-2">
                                <button onClick={handleFileClick} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"><Paperclip size={20}/></button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            </div>
                            <button onClick={() => handleSend()} disabled={!input.trim() && !pendingAttachment} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"><ArrowRight size={20}/></button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                    <button onClick={() => { setChatOnly(false); setTimeout(() => addBlock(BlockType.LOAD), 100); }} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left hover:bg-slate-800 transition-colors group">
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-blue-400">Churn Defense</h3>
                        <p className="text-xs text-slate-500 mt-1">Identify risky accounts</p>
                    </button>
                    <button onClick={() => { setChatOnly(false); setTimeout(() => addBlock(BlockType.LOAD), 100); }} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left hover:bg-slate-800 transition-colors group">
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-purple-400">ROAS Optimizer</h3>
                        <p className="text-xs text-slate-500 mt-1">Maximize ad spend</p>
                    </button>
                    <button onClick={() => { setChatOnly(false); setTimeout(() => addBlock(BlockType.LOAD), 100); }} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left hover:bg-slate-800 transition-colors group">
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400">Inventory Forecast</h3>
                        <p className="text-xs text-slate-500 mt-1">Predict stockouts</p>
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-sm font-sans">
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-2 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <Sparkles size={14} className="text-blue-400" />
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kastor AI</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            <div className="flex items-center gap-2 px-1">
                {msg.role === 'assistant' ? (
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">KASTOR</span>
                ) : (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">User <User size={10} /></span>
                )}
            </div>

            <div className={`max-w-[95%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.attachments?.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-800 border border-slate-700 rounded-lg w-fit max-w-full">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-md">
                            <FileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{att.name}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{att.type} • {att.size || 'Unknown'}</span>
                        </div>
                    </div>
                ))}

                <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-slate-300' : 'text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50'}`}>
                    {/* Thinking Process UI */}
                    {msg.isThinking && (
                        <div className="mb-3 space-y-2">
                            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <span className="text-blue-400">Thinking</span>
                            </div>
                            <div className="pl-2 border-l-2 border-slate-800 space-y-1.5">
                                {msg.thinkingSteps?.map((step, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-xs ${step.status === 'done' ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {step.status === 'done' ? <Check size={10} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-600" />}
                                        <span>{step.step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New: Execution Steps UI (Cursor-like) */}
                    {msg.executionSteps && (
                        <div className="my-2 border border-slate-800 bg-slate-900/50 rounded-md overflow-hidden">
                            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workflow Execution</span>
                                {msg.executionSteps.every(s => s.status === 'done') && <Check size={12} className="text-emerald-500" />}
                            </div>
                            <div className="p-2 space-y-1">
                                {msg.executionSteps.map((step, i) => (
                                    <div key={i} className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800/50 transition-colors">
                                        <span className={`text-xs ${step.status === 'pending' ? 'text-slate-600' : step.status === 'running' ? 'text-blue-400' : 'text-slate-300'}`}>
                                            {step.step}
                                        </span>
                                        <div className="flex items-center">
                                            {step.status === 'running' && <Loader2 size={12} className="text-blue-500 animate-spin" />}
                                            {step.status === 'done' && <Check size={12} className="text-emerald-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {msg.content}
                </div>
            </div>
            
            {msg.actions && (
              <div className="mt-2 flex flex-wrap gap-2 w-full pl-1">
                {msg.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAction(action as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs font-medium transition-all group w-full sm:w-auto
                        ${action.type === 'execute_plan' ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-blue-500/30 hover:text-blue-400'}
                    `}
                  >
                    {action.type === 'execute_plan' ? <Play size={12} /> : <Terminal size={12} />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2 px-1">
             <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">KASTOR</span>
            <div className="flex gap-1 items-center h-5">
              <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800/50">
        {showMentions && (
           <div className="mb-2 bg-slate-900 border border-slate-700 rounded-md shadow-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-1">
              {blocks.map(b => {
                  const meta = getBlockMetadata(b.type);
                  return (
                    <button key={b.id} onClick={() => handleMentionClick(b.title)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-blue-900/20 hover:text-blue-200 transition-colors flex items-center justify-between group border-b border-slate-800/50 last:border-0">
                      <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-slate-800 group-hover:bg-blue-500/20 text-slate-400 group-hover:text-blue-400 transition-colors">{meta.icon}</div>
                          <div className="flex flex-col"><span className="font-medium">{b.title}</span></div>
                      </div>
                    </button>
                  );
              })}
           </div>
        )}
        
        <div className="relative bg-slate-950 rounded-xl border border-slate-800 group-focus-within:border-transparent flex flex-col transition-all duration-300 focus-within:ring-1 focus-within:ring-blue-500/50">
            {pendingAttachment && (
                <div className="mx-2 mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-3 w-fit animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded"><FileText size={14}/></div>
                    <div className="flex flex-col text-left">
                        <span className="text-xs text-slate-200 font-medium">{pendingAttachment.name}</span>
                        <span className="text-[10px] text-slate-500">{pendingAttachment.size}</span>
                    </div>
                    <button onClick={() => setPendingAttachment(null)} className="text-slate-500 hover:text-white ml-2"><ArrowRight size={12} className="rotate-45"/></button>
                </div>
            )}

            <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask AI..."
                className="w-full bg-transparent border-none text-slate-200 placeholder-slate-600 text-sm px-3 py-3 focus:ring-0 focus:outline-none resize-none h-[80px] custom-scrollbar"
            />
            <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium flex items-center gap-1" onClick={() => setShowMentions(prev => !prev)}>
                        <span className="font-mono text-blue-400">@</span>
                    </button>
                    <button onClick={handleFileClick} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium flex items-center gap-1"><Paperclip size={14}/></button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                <button onClick={() => handleSend()} disabled={!input.trim() && !pendingAttachment} className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition-all"><Send size={14}/></button>
            </div>
        </div>
      </div>
    </div>
  );
};
