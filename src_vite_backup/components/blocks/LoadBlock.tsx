import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Link as LinkIcon, Clipboard, X, Check, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type Tab = 'file' | 'cloud' | 'paste';

export const LoadBlock = () => {
  const [activeTab, setActiveTab] = useState<Tab>('file');
  const [fileData, setFileData] = useState<{ name: string, rows: number, cols: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [cloudUrl, setCloudUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          setFileData({
            name: file.name,
            rows: results.data.length,
            cols: (results.data[0] as any[]).length
          });
        },
        error: (err) => setError(`Failed to parse CSV: ${err.message}`)
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setFileData({
            name: file.name,
            rows: json.length,
            cols: (json[0] as any[]).length
          });
        } catch (err) {
          setError('Failed to parse Excel file');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Unsupported file format');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const handlePasteParse = () => {
    if (!pasteContent.trim()) return;
    
    // Try to detect delimiter (tab for Excel copy, comma for CSV, etc)
    const rows = pasteContent.trim().split('\n');
    if (rows.length === 0) return;

    const firstRow = rows[0];
    let delimiter = ',';
    if (firstRow.includes('\t')) delimiter = '\t';
    
    const parsed = Papa.parse(pasteContent, { delimiter });
    
    if (parsed.data && parsed.data.length > 0) {
       setFileData({
         name: 'Clipboard Data',
         rows: parsed.data.length,
         cols: (parsed.data[0] as any[]).length
       });
       setPasteContent('');
    } else {
      setError('Could not parse pasted data');
    }
  };

  const handleCloudConnect = () => {
    if (!cloudUrl) return;
    setIsConnecting(true);
    // Mock connection delay
    setTimeout(() => {
       setIsConnecting(false);
       if (cloudUrl.includes('google') || cloudUrl.includes('notion')) {
         setFileData({
            name: 'Cloud Dataset',
            rows: 1240,
            cols: 15
         });
         setCloudUrl('');
       } else {
         setError('Invalid or unsupported URL');
       }
    }, 1500);
  };

  return (
    <div className="bg-slate-950/30 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-800/50">
        <button 
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'file' ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
          `}
        >
          <Upload size={14} /> File
        </button>
        <button 
          onClick={() => setActiveTab('cloud')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'cloud' ? 'text-green-400 bg-green-500/10 border-b-2 border-green-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
          `}
        >
          <LinkIcon size={14} /> Cloud
        </button>
        <button 
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'paste' ? 'text-amber-400 bg-amber-500/10 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
          `}
        >
          <Clipboard size={14} /> Paste
        </button>
      </div>

      {/* Content */}
      <div className="p-2">
        {fileData ? (
          <>
            <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg animate-in fade-in slide-in-from-bottom-2 group/file">
               <div className="flex items-center gap-2 overflow-hidden">
                 <div className={`p-1.5 rounded shrink-0 ${activeTab === 'cloud' ? 'bg-green-500/20 text-green-400' : activeTab === 'paste' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                   {activeTab === 'cloud' ? <LinkIcon size={14} /> : activeTab === 'paste' ? <Clipboard size={14} /> : <FileSpreadsheet size={14} />}
                 </div>
                 <div className="min-w-0">
                   <p className="text-xs text-slate-200 font-medium leading-none truncate max-w-[140px]" title={fileData.name}>{fileData.name}</p>
                   <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{fileData.rows.toLocaleString()} rows • {fileData.cols} cols</p>
                 </div>
               </div>
               <button onClick={(e) => { e.stopPropagation(); setFileData(null); }} className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors opacity-0 group-hover/file:opacity-100">
                 <X size={14} />
               </button>
            </div>
            
            {/* Preview Snippet */}
            <div className="mt-2 border border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-900/50 px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Preview</span>
                    <span className="text-[9px] text-slate-600">Top 3 rows</span>
                </div>
                <div className="p-2 bg-slate-950/30 space-y-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-1 opacity-60">
                            <div className="h-1.5 w-8 bg-slate-700 rounded-sm" />
                            <div className="h-1.5 w-12 bg-slate-700 rounded-sm" />
                            <div className="h-1.5 w-6 bg-slate-700 rounded-sm" />
                            <div className="h-1.5 w-4 bg-slate-700 rounded-sm" />
                        </div>
                    ))}
                </div>
            </div>
          </>
        ) : (
          <>
            {activeTab === 'file' && (
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group
                  ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
                  ${error ? 'border-red-500/50 bg-red-500/5' : ''}
                `}
              >
                <input {...getInputProps()} />
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <Upload className="text-slate-400 group-hover:text-blue-400" size={18} />
                </div>
                <p className="text-sm font-medium text-slate-300">Click or drag file here</p>
                <p className="text-xs text-slate-500 mt-1">CSV, Excel, JSON</p>
                {error && (
                   <div className="flex items-center gap-1 mt-3 text-xs text-red-400 bg-red-950/30 px-2 py-1 rounded">
                      <AlertCircle size={12} />
                      <span>{error}</span>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
                 <div className="space-y-1">
                   <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Data Source</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 outline-none focus:border-green-500 transition-colors cursor-pointer">
                     <option>Google Sheets</option>
                     <option>Notion Database</option>
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">URL / Link</label>
                   <input 
                     type="text" 
                     value={cloudUrl}
                     onChange={(e) => setCloudUrl(e.target.value)}
                     placeholder="https://docs.google.com/spreadsheets/..." 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 outline-none focus:border-green-500 transition-colors placeholder-slate-600"
                   />
                 </div>
                 {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
                 <button 
                   onClick={handleCloudConnect}
                   disabled={isConnecting || !cloudUrl}
                   className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                 >
                   {isConnecting ? (
                     <>
                       <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Connecting...
                     </>
                   ) : (
                     <>
                       <LinkIcon size={14} /> Connect
                     </>
                   )}
                 </button>
              </div>
            )}

            {activeTab === 'paste' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
                <div className="relative">
                  <textarea 
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder="Paste your data here (from Excel, Web table, etc.)"
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-3 text-xs text-slate-300 outline-none focus:border-amber-500 transition-colors placeholder-slate-600 font-mono resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800">
                    {pasteContent ? `${pasteContent.split('\n').length} rows detected` : 'Waiting for data...'}
                  </div>
                </div>
                {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
                <button 
                   onClick={handlePasteParse}
                   disabled={!pasteContent.trim()}
                   className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                   <Check size={14} /> Parse Data
                 </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
