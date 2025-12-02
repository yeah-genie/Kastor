'use client';

import React, { useState, useEffect } from 'react';
import { Table2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDuckDBContext } from '@/app/providers/DuckDBProvider';

interface QueryLog {
  id: string;
  timestamp: Date;
  query: string;
  duration: number;
  success: boolean;
  error?: string;
}

interface ResultsPanelProps {
  previewTable?: string;
  onClearPreview?: () => void;
}

export function ResultsPanel({ previewTable, onClearPreview }: ResultsPanelProps) {
  const { executeQuery } = useDuckDBContext();
  const [activeTab, setActiveTab] = useState<'preview' | 'log'>('preview');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [queryLogs] = useState<QueryLog[]>([]);
  const rowsPerPage = 20;

  // Load preview data when table changes
  useEffect(() => {
    if (previewTable && activeTab === 'preview') {
      loadPreview();
    }
  }, [previewTable, currentPage, activeTab]);

  const loadPreview = async () => {
    if (!previewTable) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * rowsPerPage;

      // Get total count
      const countResult = await executeQuery(
        `SELECT COUNT(*) as count FROM ${previewTable}`
      );
      const total = countResult[0]?.count || 0;
      setTotalRows(total);

      // Get paginated data
      const dataResult = await executeQuery(
        `SELECT * FROM ${previewTable} LIMIT ${rowsPerPage} OFFSET ${offset}`
      );

      if (dataResult.length > 0) {
        setColumns(Object.keys(dataResult[0]));
        setData(dataResult);
      } else {
        setColumns([]);
        setData([]);
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('preview')}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${
              activeTab === 'preview'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <Table2 className="w-4 h-4" />
          Data Preview
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${
              activeTab === 'log'
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <Clock className="w-4 h-4" />
          Query Log
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'preview' && (
          <div>
            {!previewTable ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500">
                Select a block and click &quot;Preview Data&quot; to view results
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-400">{error}</div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500">
                No data found
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                          #
                        </th>
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left text-xs font-semibold text-slate-400"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-800/50">
                          <td className="px-3 py-2 text-slate-500">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </td>
                          {columns.map((col) => (
                            <td key={col} className="px-3 py-2 text-slate-300">
                              {row[col]?.toString() || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="text-xs text-slate-500">
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                      {Math.min(currentPage * rowsPerPage, totalRows)} of{' '}
                      {totalRows} rows
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-slate-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="p-4">
            {queryLogs.length === 0 ? (
              <div className="text-sm text-slate-500 text-center">
                No queries executed yet
              </div>
            ) : (
              <div className="space-y-2">
                {queryLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-800 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-slate-500">{log.duration}ms</span>
                    </div>
                    <code className="text-xs text-slate-300 font-mono block">
                      {log.query}
                    </code>
                    {log.error && (
                      <div className="text-xs text-red-400">{log.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
