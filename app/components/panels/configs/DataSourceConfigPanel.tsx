'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Database, Eye, RefreshCw } from 'lucide-react';
import { DataSourceConfig } from '@/app/lib/types';
import { useDuckDBContext } from '@/app/providers/DuckDBProvider';

interface DataSourceConfigPanelProps {
  blockId: string;
  config: DataSourceConfig;
  onConfigUpdate: (config: Partial<DataSourceConfig>) => void;
  onPreview: () => void;
}

export function DataSourceConfigPanel({
  blockId,
  config,
  onConfigUpdate,
  onPreview,
}: DataSourceConfigPanelProps) {
  const { executeQuery } = useDuckDBContext();
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Get row count
  const fetchRowCount = useCallback(async () => {
    if (!config.tableName) return;

    try {
      setLoading(true);
      const result = await executeQuery(
        `SELECT COUNT(*) as count FROM ${config.tableName}`
      );
      setRowCount(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get row count:', error);
    } finally {
      setLoading(false);
    }
  }, [config.tableName, executeQuery]);

  // Fetch row count when component mounts or table changes
  React.useEffect(() => {
    if (config.tableName) {
      fetchRowCount();
    }
  }, [config.tableName, fetchRowCount]);

  if (!config.fileName) {
    return (
      <div className="text-sm text-slate-500 text-center p-4">
        Upload a CSV file to see configuration options
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <FileText className="w-4 h-4" />
          <span>File Information</span>
        </div>
        <div className="p-3 bg-slate-800 rounded-lg space-y-2">
          <div className="text-sm">
            <div className="text-slate-500 text-xs">File Name</div>
            <div className="text-slate-300">{config.fileName}</div>
          </div>
        </div>
      </div>

      {/* Table Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Database className="w-4 h-4" />
          <span>Table Information</span>
        </div>
        <div className="p-3 bg-slate-800 rounded-lg space-y-2">
          <div className="text-sm">
            <div className="text-slate-500 text-xs">Table Name</div>
            <div className="text-slate-300 font-mono text-xs">
              {config.tableName}
            </div>
          </div>

          {rowCount !== null && (
            <div className="text-sm">
              <div className="text-slate-500 text-xs">Row Count</div>
              <div className="text-slate-300">
                {rowCount.toLocaleString()} rows
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columns */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400">
          Columns ({config.columns.length})
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {config.columns.map((col) => (
            <div
              key={col.name}
              className="p-2 bg-slate-800 rounded flex items-center justify-between text-xs"
            >
              <span className="text-slate-300 font-medium">{col.name}</span>
              <span className="text-slate-500 font-mono">{col.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <button
          onClick={onPreview}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview Data
        </button>

        <button
          onClick={fetchRowCount}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>
    </div>
  );
}
