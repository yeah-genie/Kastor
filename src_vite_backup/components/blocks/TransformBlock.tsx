import { Wand2, Database, Code, Sparkles, ArrowRight, Filter, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useBlockStore } from '../../store/useBlockStore';
import { Block } from '../../types';

export const TransformBlock = ({ blockId }: { blockId?: string }) => {
  const { updateBlockConfig, blocks } = useBlockStore();
  const block = blocks.find(b => b.id === blockId);
  const config = block?.config || {};

  const [mode, setMode] = useState<'ai' | 'sql'>(config.mode || 'ai');
  const [showCode, setShowCode] = useState(false); 
  const [sqlCode, setSqlCode] = useState(config.code || 'SELECT * FROM df WHERE amount > 0');
  const [isExecuted, setIsExecuted] = useState(false);

  // Editable State for "Smart Inputs" - Initialize from config if available
  const [tierValue, setTierValue] = useState(config.tier || 'Enterprise');
  const [scoreValue, setScoreValue] = useState<number | string>(config.score || 40);
  
  const [editingField, setEditingField] = useState<'tier' | 'score' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulation: Auto-execute for demo effect
  useEffect(() => {
      const timer = setTimeout(() => {
          setIsExecuted(true);
      }, 1500);
      return () => clearTimeout(timer);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
      if (editingField && inputRef.current) {
          inputRef.current.focus();
      }
  }, [editingField]);

  const handleSave = () => {
      setEditingField(null);
      if (blockId) {
          // Update the global store
          updateBlockConfig(blockId, { 
              tier: tierValue, 
              score: scoreValue,
              // Also update the generated code to match
              code: `df[ (df.tier == '${tierValue}') & (df.score < ${scoreValue}) ]`
          });
      }
      
      setIsExecuted(false);
      setTimeout(() => setIsExecuted(true), 800); // Simulate re-execution
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSave();
      }
  };

  const toggleMode = (newMode: 'ai' | 'sql') => {
      setMode(newMode);
      if (blockId) updateBlockConfig(blockId, { mode: newMode });
  };

  return (
    <div className="space-y-3">
       {/* Mode Toggle */}
       <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
         <button
           onClick={(e) => { e.stopPropagation(); toggleMode('ai'); }}
           className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded transition-all ${mode === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <Sparkles size={10} /> AI Logic
         </button>
         <button
           onClick={(e) => { e.stopPropagation(); toggleMode('sql'); }}
           className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded transition-all ${mode === 'sql' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <Database size={10} /> SQL
         </button>
       </div>

       {mode === 'ai' ? (
         <>
           <div className="relative group">
                {/* View Toggle (Natural vs Code) */}
                <div className="absolute top-2 right-2 z-10">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowCode(!showCode); }}
                        className={`p-1.5 rounded transition-colors ${showCode ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                        title={showCode ? "Show Description" : "Show Code"}
                    >
                        <Code size={12}/>
                    </button>
                </div>

                {showCode ? (
                    // Python Code View
                    <div className="bg-slate-950/50 border border-slate-800 rounded p-3 text-xs font-mono text-slate-400">
                        <span className="text-purple-400">def</span> <span className="text-blue-400">transform_data</span>(df):
                        <br />
                        &nbsp;&nbsp;<span className="text-slate-500"># Filter High Risk & {tierValue}</span>
                        <br />
                        &nbsp;&nbsp;<span className="text-purple-400">return</span> df[ (df.tier == <span className="text-green-400">'{tierValue}'</span>) & (df.score &lt; <span className="text-orange-400">{scoreValue}</span>) ]
                    </div>
                ) : (
                    // Natural Language View (Smart Inputs)
                    <div className="bg-slate-900/50 border border-slate-800 rounded p-4 text-sm text-slate-300 leading-relaxed relative">
                         <div className="flex items-start gap-2">
                            <Wand2 size={16} className="text-purple-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-slate-400 font-medium">Filter rows where </span>
                                <span className="font-medium">Tier is </span>
                                
                                {/* Smart Input: Tier */}
                                {editingField === 'tier' ? (
                                    <div className="inline-flex items-center relative mx-1">
                                        <input 
                                            ref={inputRef}
                                            value={tierValue}
                                            onChange={(e) => setTierValue(e.target.value)}
                                            onBlur={handleSave}
                                            onKeyDown={handleKeyDown}
                                            className="w-24 bg-slate-800 border border-blue-500 text-white rounded px-1.5 py-0.5 text-sm focus:outline-none"
                                        />
                                        <button onClick={handleSave} className="absolute right-1 text-blue-400"><Check size={12} /></button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setEditingField('tier')}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:border-blue-400 transition-all font-bold cursor-text"
                                    >
                                        "{tierValue}"
                                    </button>
                                )}

                                <span className="font-medium"> and Score is less than </span>

                                {/* Smart Input: Score */}
                                {editingField === 'score' ? (
                                    <div className="inline-flex items-center relative mx-1">
                                        <input 
                                            ref={inputRef}
                                            type="number"
                                            value={scoreValue}
                                            onChange={(e) => setScoreValue(e.target.value)}
                                            onBlur={handleSave}
                                            onKeyDown={handleKeyDown}
                                            className="w-16 bg-slate-800 border border-orange-500 text-white rounded px-1.5 py-0.5 text-sm focus:outline-none"
                                        />
                                        <button onClick={handleSave} className="absolute right-1 text-orange-400"><Check size={12} /></button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setEditingField('score')}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded hover:border-orange-400 transition-all font-bold cursor-text"
                                    >
                                        {scoreValue}
                                    </button>
                                )}
                            </div>
                         </div>
                    </div>
                )}
           </div>
           
           {/* Result Summary */}
           {isExecuted && (
               <div className="flex items-center justify-between p-2 bg-purple-900/10 border border-purple-500/20 rounded text-[10px] animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center gap-2 text-purple-300">
                       <Filter size={12} />
                       <span>Filtered Result</span>
                   </div>
                   <div className="flex items-center gap-2 font-mono">
                       <span className="text-slate-500 line-through">1,240</span>
                       <ArrowRight size={10} className="text-slate-600" />
                       <span className="text-white font-bold">
                           {/* Dynamic result simulation based on filter strictness */}
                           {Number(scoreValue) < 30 ? '12' : Number(scoreValue) < 50 ? '34' : '85'} Rows
                       </span>
                   </div>
               </div>
           )}
         </>
       ) : (
         <div className="space-y-2">
            <div className="relative">
                <textarea 
                    value={sqlCode}
                    onChange={(e) => setSqlCode(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2 text-[10px] font-mono text-blue-300 placeholder-slate-600 focus:border-blue-500 outline-none resize-none custom-scrollbar"
                    spellCheck={false}
                />
                {/* Auto-Generated Comment Overlay (Simulated) */}
                <div className="absolute top-2 right-8 text-[9px] text-slate-500 font-mono pointer-events-none select-none">
                    -- Auto-generated by Kastor
                </div>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900 rounded text-[8px] text-slate-500 border border-slate-800">SQL</div>
            </div>
         </div>
       )}
    </div>
  );
};
