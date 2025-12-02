'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDuckDBContext } from '@/app/providers/DuckDBProvider';
import { DataSourceConfig } from '@/app/lib/types';

interface DataSourceBlockProps {
  blockId: string;
  config: DataSourceConfig;
  onConfigUpdate: (config: Partial<DataSourceConfig>) => void;
  onStatusUpdate: (status: 'idle' | 'running' | 'success' | 'error', error?: string) => void;
}

export function DataSourceBlock({
  blockId,
  config,
  onConfigUpdate,
  onStatusUpdate,
}: DataSourceBlockProps) {
  const { loadCSV } = useDuckDBContext();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.csv')) {
        onStatusUpdate('error', 'Only CSV files are supported');
        return;
      }

      setUploading(true);
      onStatusUpdate('running');

      try {
        const tableName = `data_${blockId}`;
        const columns = await loadCSV(file, tableName);

        onConfigUpdate({
          fileName: file.name,
          tableName,
          columns,
        });

        onStatusUpdate('success');
      } catch (error) {
        console.error('Failed to load CSV:', error);
        onStatusUpdate('error', error instanceof Error ? error.message : 'Failed to load CSV');
      } finally {
        setUploading(false);
      }
    },
    [blockId, loadCSV, onConfigUpdate, onStatusUpdate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const loadSampleData = useCallback(async () => {
    try {
      const response = await fetch('/sample-data/sales.csv');
      const blob = await response.blob();
      const file = new File([blob], 'sales.csv', { type: 'text/csv' });
      await handleFileUpload(file);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      onStatusUpdate('error', 'Failed to load sample data');
    }
  }, [handleFileUpload, onStatusUpdate]);

  // If data is loaded, show summary
  if (config.fileName) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{config.fileName}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Database className="w-4 h-4" />
            <span>Table: {config.tableName}</span>
          </div>

          <div className="text-slate-400">
            {config.columns.length} column{config.columns.length !== 1 ? 's' : ''}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {config.columns.slice(0, 3).map((col) => (
              <div
                key={col.name}
                className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
              >
                {col.name}
              </div>
            ))}
            {config.columns.length > 3 && (
              <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-500">
                +{config.columns.length - 3} more
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            onConfigUpdate({ fileName: '', tableName: '', columns: [] });
            onStatusUpdate('idle');
          }}
          className="text-xs text-slate-500 hover:text-slate-400 underline"
        >
          Upload different file
        </button>
      </div>
    );
  }

  // Upload UI
  return (
    <div className="p-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          transition-colors cursor-pointer
          ${
            dragActive
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
          }
        `}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="text-sm text-slate-400">Loading CSV...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-8 h-8 mx-auto text-slate-500" />
            <div>
              <p className="text-sm text-slate-300 font-medium">
                Drop CSV file here
              </p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id={`file-upload-${blockId}`}
            />
            <label
              htmlFor={`file-upload-${blockId}`}
              className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 cursor-pointer transition-colors"
            >
              Browse Files
            </label>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={loadSampleData}
                className="text-xs text-slate-500 hover:text-slate-400 underline"
              >
                Or load sample sales data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
