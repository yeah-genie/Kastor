'use client';

import { useState, useEffect, useCallback } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import {
  initDuckDB,
  executeQuery as dbExecuteQuery,
  loadCSVToTable as dbLoadCSV,
  getTableSchema as dbGetTableSchema,
  dropTable as dbDropTable,
} from '../lib/duckdb';
import { ColumnInfo } from '../lib/types';

interface UseDuckDBReturn {
  db: duckdb.AsyncDuckDB | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  executeQuery: (sql: string) => Promise<any[]>;
  loadCSV: (file: File, tableName: string) => Promise<ColumnInfo[]>;
  getTableSchema: (tableName: string) => Promise<ColumnInfo[]>;
  dropTable: (tableName: string) => Promise<void>;
}

/**
 * React hook for using DuckDB in components
 */
export function useDuckDB(): UseDuckDBReturn {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize DuckDB on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const dbInstance = await initDuckDB();

        if (mounted) {
          setDb(dbInstance);
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize DuckDB'));
          setIsReady(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Execute SQL query
  const executeQuery = useCallback(
    async (sql: string): Promise<any[]> => {
      if (!isReady) {
        throw new Error('DuckDB is not ready yet');
      }

      try {
        return await dbExecuteQuery(sql);
      } catch (err) {
        console.error('Query execution failed:', err);
        throw err;
      }
    },
    [isReady]
  );

  // Load CSV file
  const loadCSV = useCallback(
    async (file: File, tableName: string): Promise<ColumnInfo[]> => {
      if (!isReady) {
        throw new Error('DuckDB is not ready yet');
      }

      try {
        return await dbLoadCSV(file, tableName);
      } catch (err) {
        console.error('CSV loading failed:', err);
        throw err;
      }
    },
    [isReady]
  );

  // Get table schema
  const getTableSchema = useCallback(
    async (tableName: string): Promise<ColumnInfo[]> => {
      if (!isReady) {
        throw new Error('DuckDB is not ready yet');
      }

      try {
        return await dbGetTableSchema(tableName);
      } catch (err) {
        console.error('Get table schema failed:', err);
        throw err;
      }
    },
    [isReady]
  );

  // Drop table
  const dropTable = useCallback(
    async (tableName: string): Promise<void> => {
      if (!isReady) {
        throw new Error('DuckDB is not ready yet');
      }

      try {
        await dbDropTable(tableName);
      } catch (err) {
        console.error('Drop table failed:', err);
        throw err;
      }
    },
    [isReady]
  );

  return {
    db,
    isReady,
    isLoading,
    error,
    executeQuery,
    loadCSV,
    getTableSchema,
    dropTable,
  };
}
