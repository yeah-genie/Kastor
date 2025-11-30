import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, Settings2 } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

// Mock Data Generator
const generateData = (type: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(name => ({
    name,
    value: Math.floor(Math.random() * 5000) + 1000,
    value2: Math.floor(Math.random() * 5000) + 1000,
  }));
};

const PIE_COLORS = ['#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FBBF24'];

export const VisualizeBlock = ({ blockId }: { blockId?: string }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [isConfigMode, setIsConfigMode] = useState(false);
  const { openPreviewModal } = useUIStore();
  
  // Generate stable random data for this instance
  const data = useMemo(() => generateData(chartType), [chartType]);

  // Auto-switch to chart view after a moment if it was just created (Simulation)
  useEffect(() => {
      const timer = setTimeout(() => {
          // If we had a real "isNew" prop, we'd use it. For now, default to chart view.
      }, 500);
      return () => clearTimeout(timer);
  }, []);

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px', color: '#f1f5f9' }}
                itemStyle={{ color: '#60A5FA' }}
                cursor={{ fill: '#1e293b' }}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1500} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px', color: '#f1f5f9' }}
            />
            <Line type="monotone" dataKey="value" stroke="#A78BFA" strokeWidth={3} dot={{ fill: '#A78BFA', r: 4 }} animationDuration={1500} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px', color: '#f1f5f9' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="flex flex-col h-64 w-full bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800 relative group/chart">
        {/* Toolbar (Hover only) */}
        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover/chart:opacity-100 transition-opacity">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsConfigMode(!isConfigMode); }}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md shadow-lg hover:bg-slate-700 transition-colors"
                title="Configure Chart"
            >
                <Settings2 size={14} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); openPreviewModal(blockId || 'demo', 'Sales Analysis', 'chart'); }}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md shadow-lg hover:bg-slate-700 transition-colors"
                title="Expand View"
            >
                <Maximize2 size={14} />
            </button>
        </div>

        {isConfigMode ? (
            <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 absolute inset-0 bg-slate-900/95 z-20 backdrop-blur-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Chart Type</h4>
                <div className="grid grid-cols-3 gap-2">
                    {['bar', 'line', 'pie'].map(type => (
                        <button 
                            key={type}
                            onClick={() => { setChartType(type as any); setIsConfigMode(false); }}
                            className={`p-3 rounded border flex flex-col items-center gap-2 text-xs font-medium transition-all
                                ${chartType === type 
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}
                            `}
                        >
                            <span className="capitalize">{type}</span>
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setIsConfigMode(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700"
                >
                    Close
                </button>
            </div>
        ) : (
            <div className="flex-1 w-full h-full p-2 pt-6 min-h-0">
                {renderChart()}
            </div>
        )}
    </div>
  );
};
