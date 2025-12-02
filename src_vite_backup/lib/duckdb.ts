import * as duckdb from '@duckdb/duckdb-wasm';
import { QueryResult, ColumnInfo } from './types';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// CDN URLs for DuckDB WASM bundles
const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-eh.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-eh.worker.js',
  },
};

export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  // Select appropriate bundle
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);
  
  // Instantiate worker
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  
  // Instantiate database
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  
  // Create connection
  conn = await db.connect();
  
  console.log('DuckDB-WASM initialized successfully');
  return db;
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!conn) {
    await initDuckDB();
  }
  return conn!;
}

export async function executeQuery(sql: string): Promise<QueryResult> {
  const connection = await getConnection();
  
  try {
    const result = await connection.query(sql);
    
    // Get column info
    const schema = result.schema;
    const columns: ColumnInfo[] = schema.fields.map((field) => ({
      name: field.name,
      type: field.type.toString(),
    }));
    
    // Convert to array of objects
    const rows: Record<string, unknown>[] = result.toArray().map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
        obj[col.name] = row[idx];
      });
      return obj;
    });
    
    return {
      columns,
      rows,
      rowCount: rows.length,
    };
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

export async function loadCSVFromFile(file: File, tableName: string): Promise<QueryResult> {
  const connection = await getConnection();
  const database = db!;
  
  // Read file content
  const content = await file.text();
  
  // Register the CSV content as a virtual file
  await database.registerFileText(file.name, content);
  
  // Create table from CSV
  await connection.query(`
    CREATE OR REPLACE TABLE ${tableName} AS 
    SELECT * FROM read_csv_auto('${file.name}')
  `);
  
  // Get table info
  const result = await executeQuery(`SELECT * FROM ${tableName} LIMIT 100`);
  
  console.log(`Loaded CSV "${file.name}" as table "${tableName}" with ${result.rowCount} rows (showing first 100)`);
  
  return result;
}

export async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const result = await executeQuery(`DESCRIBE ${tableName}`);
  return result.rows.map((row) => ({
    name: row.column_name as string,
    type: row.column_type as string,
  }));
}

export async function getTableRowCount(tableName: string): Promise<number> {
  const result = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
  return Number(result.rows[0]?.count ?? 0);
}

export async function dropTable(tableName: string): Promise<void> {
  const connection = await getConnection();
  await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
}

export async function tableExists(tableName: string): Promise<boolean> {
  try {
    await executeQuery(`SELECT 1 FROM ${tableName} LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

export { db, conn };
