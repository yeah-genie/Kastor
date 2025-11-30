import { useBlockStore } from '../../store/useBlockStore';
import { BlockType } from '../../types';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Maximize2, Filter, Download } from 'lucide-react';
import { useMemo } from 'react';

// Reuse generator for consistency
const generateData = (id: string) => {
  const seed = id.charCodeAt(0); 
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((name, i) => ({
    name,
    revenue: Math.floor((Math.sin(i + seed) + 2) * 5000),
    users: Math.floor((Math.cos(i + seed) + 2) * 1000),
    cost: Math.floor((Math.sin(i * 2 + seed) + 2) * 3000),
  }));
};

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export const DashboardView = () => {
  const { blocks } = useBlockStore();
  
  // Filter only visualize blocks
  const vizBlocks = blocks.filter(b => b.type === BlockType.VISUALIZE || b.type === BlockType.KPI_CARD);

  return (
    <div className="w-full h-full bg-slate-950 overflow-y-auto p-8 custom-scrollbar">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Marketing Overview</h1>
                <p className="text-slate-400 text-sm">Real-time insights from your connected data sources.</p>
            </div>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm transition-colors">
                    <Filter size={14} /> Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-900/20 transition-colors">
                    <Download size={14} /> Export Report
                </button>
            </div>
        </div>

        {/* Empty State */}
        {vizBlocks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
                    <Maximize2 size={24} />
                </div>
                <h3 className="text-slate-300 font-medium mb-2">No Charts Yet</h3>
                <p className="text-slate-500 text-sm max-w-xs text-center">
                    Add 'Visualize' blocks to your workflow to populate this dashboard.
                </p>
            </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
            {vizBlocks.map((block, idx) => {
                // Determine Chart Type (Mock logic based on title or random)
                const isLine = block.config?.chartType === 'line' || block.title.toLowerCase().includes('trend');
                const isPie = block.config?.chartType === 'pie' || block.title.toLowerCase().includes('dist');
                const data = generateData(block.id);
                const isLarge = idx === 0; // Make first chart wider

                return (
                    <div 
                        key={block.id}
                        className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col relative group hover:border-slate-700 transition-colors ${isLarge ? 'md:col-span-2 lg:col-span-2' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-200 truncate">{block.title || 'Untitled Chart'}</h3>
                            <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors">
                                <Maximize2 size={14} />
                            </button>
                        </div>
                        
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                {isPie ? (
                                    <PieChart>
                                        <Pie
                                            data={data.slice(0, 5)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="revenue"
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                ) : isLine ? (
                                    <LineChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                            itemStyle={{ color: '#A78BFA' }}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="#A78BFA" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} dot={false} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                            cursor={{ fill: '#1e293b' }}
                                        />
                                        <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
