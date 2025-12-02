'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDuckDB } from '../hooks/useDuckDB';
import * as duckdb from '@duckdb/duckdb-wasm';
import { ColumnInfo } from '../lib/types';

interface DuckDBContextValue {
  db: duckdb.AsyncDuckDB | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  executeQuery: (sql: string) => Promise<any[]>;
  loadCSV: (file: File, tableName: string) => Promise<ColumnInfo[]>;
  getTableSchema: (tableName: string) => Promise<ColumnInfo[]>;
  dropTable: (tableName: string) => Promise<void>;
}

const DuckDBContext = createContext<DuckDBContextValue | undefined>(undefined);

interface DuckDBProviderProps {
  children: ReactNode;
}

/**
 * DuckDB Provider Component
 * Wraps the app and provides DuckDB context to all children
 */
export function DuckDBProvider({ children }: DuckDBProviderProps) {
  const duckdb = useDuckDB();

  // Show loading state while DuckDB initializes
  if (duckdb.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400 text-lg">Initializing DuckDB...</p>
          <p className="text-slate-500 text-sm mt-2">Loading WASM bundles</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (duckdb.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-red-500 text-xl font-semibold mb-2">
            Failed to Initialize DuckDB
          </div>
          <p className="text-slate-400 text-sm mb-4">
            {duckdb.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <DuckDBContext.Provider value={duckdb}>
      {children}
    </DuckDBContext.Provider>
  );
}

/**
 * Hook to use DuckDB context
 * Must be used within DuckDBProvider
 */
export function useDuckDBContext(): DuckDBContextValue {
  const context = useContext(DuckDBContext);

  if (context === undefined) {
    throw new Error('useDuckDBContext must be used within DuckDBProvider');
  }

  return context;
}
