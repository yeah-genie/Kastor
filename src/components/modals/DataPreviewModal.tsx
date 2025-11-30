import { X, Download, Table, FileSpreadsheet, BarChart2 } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const DataPreviewModal = () => {
  const { previewModal, closePreviewModal } = useUIStore();
  const [animateOpen, setAnimateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    if (previewModal.isOpen) {
      setAnimateOpen(true);
      setActiveTab(previewModal.initialTab || 'table');
    } else {
      setTimeout(() => setAnimateOpen(false), 200);
    }
  }, [previewModal.isOpen, previewModal.initialTab]);

  // Mock Table Data
  const data = useMemo(() => {
    if (!previewModal.isOpen && !animateOpen) return [];
    
    // Determine Demo Type from props or infer
    const demoType = previewModal.demoType;

    if (demoType === 'saas' || previewModal.title.includes('Churn')) {
        // SaaS Data
        const tiers = ['Starter', 'Growth', 'Enterprise'];
        return Array.from({ length: 50 }).map((_, i) => {
            const tier = tiers[i % 3];
            const mrr = tier === 'Enterprise' ? 2500 + Math.floor(Math.random() * 5000) : 500;
            return {
                id: `USR-${1000 + i}`,
                company: `Company ${String.fromCharCode(65 + (i % 26))}`,
                tier,
                mrr: `$${mrr.toLocaleString()}`,
                health: Math.floor(Math.random() * 100),
                last_login: `${Math.floor(Math.random() * 30)}d ago`,
                status: i % 5 === 0 ? 'At Risk' : 'Active'
            };
        });
    }

    if (demoType === 'marketing' || previewModal.title.includes('Ad')) {
        // Marketing Data
        const channels = ['Facebook', 'Instagram', 'Google Search', 'LinkedIn', 'TikTok'];
        return Array.from({ length: 50 }).map((_, i) => {
            const spend = Math.floor(Math.random() * 5000) + 500;
            const clicks = Math.floor(spend / (Math.random() * 2 + 0.5));
            const conv = Math.floor(clicks * 0.05);
            return {
                campaign: `Camp-${100 + i}`,
                channel: channels[i % 5],
                spend: `$${spend}`,
                clicks,
                cpa: `$${(spend / (conv || 1)).toFixed(2)}`,
                roas: (Math.random() * 5 + 1).toFixed(2) + 'x'
            };
        });
    }

    if (demoType === 'commerce' || previewModal.title.includes('Inventory')) {
        // Commerce Data
        return Array.from({ length: 50 }).map((_, i) => {
            return {
                sku: `SKU-${200 + i}`,
                product: `Item ${String.fromCharCode(65 + (i % 26))}`,
                stock: Math.floor(Math.random() * 200),
                sales_7d: Math.floor(Math.random() * 50),
                burn_rate: (Math.random() * 5).toFixed(1),
                days_left: Math.floor(Math.random() * 20) + 5
            };
        });
    }

    // Default Fallback
    const seed = (previewModal.blockId || 'default').charCodeAt(0);
    const categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports'];
    const statuses = ['Completed', 'Pending', 'Refunded', 'Processing'];
    
    return Array.from({ length: 50 }).map((_, i) => {
      const pseudoRandom = (i * seed) % 1000 / 1000; 
      return {
        id: i + 1,
        date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
        category: categories[Math.floor(pseudoRandom * categories.length)],
        product: `Product ${String.fromCharCode(65 + (i % 26))}-${Math.floor(pseudoRandom * 100)}`,
        amount: Math.floor(pseudoRandom * 5000) + 100,
        status: statuses[Math.floor(pseudoRandom * statuses.length)],
        rating: (pseudoRandom * 5).toFixed(1),
      };
    });
  }, [previewModal.isOpen, animateOpen, previewModal.blockId, previewModal.title]);

  // Mock Chart Data
  const chartData = useMemo(() => {
    return data.slice(0, 10).map(item => ({
        name: item.date,
        value: item.amount,
        category: item.category
    }));
  }, [data]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  if (!previewModal.isOpen && !animateOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200 ${previewModal.isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closePreviewModal}
      />

      {/* Modal Content */}
      <div 
        className={`
          bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col relative z-10 overflow-hidden transition-all duration-300
          ${previewModal.isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                {activeTab === 'table' ? <Table size={20} /> : <BarChart2 size={20} />}
                </div>
                <div>
                <h2 className="text-lg font-semibold text-slate-200">
                    {activeTab === 'table' ? 'Data Preview' : 'Chart Analysis'}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                    Source: <span className="text-slate-400 font-medium">{previewModal.title}</span>
                </p>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700 ml-4">
                <button 
                    onClick={() => setActiveTab('table')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2
                        ${activeTab === 'table' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}
                    `}
                >
                    <Table size={14} /> Table
                </button>
                <button 
                    onClick={() => setActiveTab('chart')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2
                        ${activeTab === 'chart' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}
                    `}
                >
                    <BarChart2 size={14} /> Analysis
                </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors">
               <Download size={14} />
               Export
            </button>
            <button 
              onClick={closePreviewModal}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-950/50 relative">
            {activeTab === 'table' ? (
                <div className="h-full overflow-auto custom-scrollbar p-6">
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase border-b border-slate-800 w-12 text-center">#</th>
                                    {columns.map(col => (
                                        <th key={col} className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800 border-l border-slate-800/50 whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="py-2.5 px-4 text-xs text-slate-600 text-center font-mono border-r border-slate-800/50 group-hover:text-slate-500">{idx + 1}</td>
                                        {columns.map(col => (
                                            <td key={col} className="py-2.5 px-4 text-sm text-slate-300 border-r border-slate-800/50 whitespace-nowrap font-mono">
                                                {/* @ts-ignore */}
                                                {row[col]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="h-full w-full p-6 flex flex-col">
                    <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                    cursor={{ fill: '#1e293b' }}
                                />
                                <Legend />
                                <Bar dataKey="value" name="Sales Amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                         <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                            <h4 className="text-slate-500 text-xs uppercase font-bold mb-1">Total Revenue</h4>
                            <p className="text-2xl font-bold text-white">$142,300</p>
                         </div>
                         <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                            <h4 className="text-slate-500 text-xs uppercase font-bold mb-1">Avg Order Value</h4>
                            <p className="text-2xl font-bold text-white">$342</p>
                         </div>
                         <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                            <h4 className="text-slate-500 text-xs uppercase font-bold mb-1">Growth</h4>
                            <p className="text-2xl font-bold text-emerald-400">+12.5%</p>
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-4">
                <span>Total Rows: <strong>{data.length.toLocaleString()}</strong></span>
                <span>Columns: <strong>{columns.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
                <FileSpreadsheet size={14} />
                <span>Preview showing first 50 rows</span>
            </div>
        </div>
      </div>
    </div>
  );
};
