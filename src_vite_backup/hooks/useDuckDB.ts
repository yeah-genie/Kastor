import { useState, useEffect, useCallback } from 'react';
import { initDuckDB, executeQuery, loadCSVFromFile, getTableColumns } from '../lib/duckdb';
import { QueryResult, ColumnInfo, CSVFileInfo } from '../lib/types';

export function useDuckDB() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedTables, setLoadedTables] = useState<CSVFileInfo[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        await initDuckDB();
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize DuckDB');
        console.error('DuckDB initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const runQuery = useCallback(async (sql: string): Promise<QueryResult> => {
    if (!isReady) {
      throw new Error('DuckDB is not ready');
    }
    return executeQuery(sql);
  }, [isReady]);

  const loadCSV = useCallback(async (file: File): Promise<CSVFileInfo> => {
    if (!isReady) {
      throw new Error('DuckDB is not ready');
    }

    // Generate table name from file name
    const tableName = file.name
      .replace(/\.csv$/i, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();

    const result = await loadCSVFromFile(file, tableName);
    const columns = await getTableColumns(tableName);

    const tableInfo: CSVFileInfo = {
      fileName: file.name,
      tableName,
      columns,
      rowCount: result.rowCount,
    };

    setLoadedTables((prev) => {
      // Replace if table already exists
      const existing = prev.findIndex((t) => t.tableName === tableName);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = tableInfo;
        return updated;
      }
      return [...prev, tableInfo];
    });

    return tableInfo;
  }, [isReady]);

  const getColumns = useCallback(async (tableName: string): Promise<ColumnInfo[]> => {
    if (!isReady) {
      throw new Error('DuckDB is not ready');
    }
    return getTableColumns(tableName);
  }, [isReady]);

  return {
    isReady,
    isLoading,
    error,
    loadedTables,
    runQuery,
    loadCSV,
    getColumns,
  };
}
