import * as duckdb from '@duckdb/duckdb-wasm';
import { ColumnInfo } from './types';

// Singleton instance
let dbInstance: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

/**
 * Initialize DuckDB WASM instance (singleton pattern)
 */
export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance;
  }

  // Return existing init promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Configure CDN URLs for DuckDB bundles
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

      // Select appropriate bundle
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

      // Create worker
      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
          type: 'text/javascript',
        })
      );

      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger();

      // Initialize DuckDB
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      dbInstance = db;
      return db;
    } catch (error) {
      console.error('Failed to initialize DuckDB:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get a new connection to the database
 */
export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  const db = await initDuckDB();
  return await db.connect();
}

/**
 * Execute a SQL query and return results as array of objects
 */
export async function executeQuery(sql: string): Promise<any[]> {
  const conn = await getConnection();
  try {
    const result = await conn.query(sql);
    const rows = result.toArray().map((row) => row.toJSON());
    await conn.close();
    return rows;
  } catch (error) {
    await conn.close();
    throw error;
  }
}

/**
 * Load CSV file into DuckDB table
 */
export async function loadCSVToTable(
  file: File,
  tableName: string
): Promise<ColumnInfo[]> {
  const conn = await getConnection();

  try {
    // Read file as text
    const text = await file.text();

    // Register the file data with DuckDB
    const db = await initDuckDB();
    await db.registerFileText(file.name, text);

    // Drop table if it exists
    await conn.query(`DROP TABLE IF EXISTS ${tableName}`);

    // Create table from CSV using DuckDB's CSV reader
    await conn.query(`
      CREATE TABLE ${tableName} AS
      SELECT * FROM read_csv_auto('${file.name}')
    `);

    // Get schema
    const columns = await getTableSchema(tableName, conn);

    await conn.close();
    return columns;
  } catch (error) {
    await conn.close();
    throw error;
  }
}

/**
 * Get table schema (column names and types)
 */
export async function getTableSchema(
  tableName: string,
  conn?: duckdb.AsyncDuckDBConnection
): Promise<ColumnInfo[]> {
  const shouldCloseConn = !conn;
  const connection = conn || (await getConnection());

  try {
    const result = await connection.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
    `);

    const columns: ColumnInfo[] = result.toArray().map((row) => {
      const obj = row.toJSON();
      return {
        name: obj.column_name,
        type: mapDuckDBType(obj.data_type),
      };
    });

    if (shouldCloseConn) {
      await connection.close();
    }

    return columns;
  } catch (error) {
    if (shouldCloseConn) {
      await connection.close();
    }
    throw error;
  }
}

/**
 * Map DuckDB types to our simplified type system
 */
function mapDuckDBType(
  duckdbType: string
): 'string' | 'number' | 'date' | 'boolean' {
  const type = duckdbType.toLowerCase();

  if (
    type.includes('int') ||
    type.includes('float') ||
    type.includes('double') ||
    type.includes('decimal') ||
    type.includes('numeric')
  ) {
    return 'number';
  }

  if (type.includes('date') || type.includes('time')) {
    return 'date';
  }

  if (type.includes('bool')) {
    return 'boolean';
  }

  return 'string';
}

/**
 * Drop a table from the database
 */
export async function dropTable(tableName: string): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
    await conn.close();
  } catch (error) {
    await conn.close();
    throw error;
  }
}

/**
 * Get database instance (for advanced usage)
 */
export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  return await initDuckDB();
}
