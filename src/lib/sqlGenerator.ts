import { 
  Block, 
  FilterConfig, 
  AggregateConfig, 
  SortConfig 
} from './types';

/**
 * Generate SQL query for a block based on its type and config
 */
export function generateSQL(
  block: Block,
  inputTableName: string | null,
  outputTableName: string
): string {
  switch (block.type) {
    case 'datasource':
      // DataSource doesn't generate SQL - it loads from CSV
      return '';
    
    case 'filter':
      return generateFilterSQL(block.config as FilterConfig, inputTableName!, outputTableName);
    
    case 'aggregate':
      return generateAggregateSQL(block.config as AggregateConfig, inputTableName!, outputTableName);
    
    case 'sort':
      return generateSortSQL(block.config as SortConfig, inputTableName!, outputTableName);
    
    case 'chart':
    case 'insight':
      // Chart and Insight don't create new tables, they just read
      return `CREATE OR REPLACE VIEW ${outputTableName} AS SELECT * FROM ${inputTableName}`;
    
    default:
      throw new Error(`Unknown block type: ${block.type}`);
  }
}

function generateFilterSQL(
  config: FilterConfig,
  inputTable: string,
  outputTable: string
): string {
  const { column, operator, value } = config;
  
  let condition: string;
  
  if (operator === 'contains') {
    condition = `"${column}" LIKE '%${escapeSQL(String(value))}%'`;
  } else {
    const formattedValue = typeof value === 'string' 
      ? `'${escapeSQL(value)}'` 
      : value;
    condition = `"${column}" ${operator} ${formattedValue}`;
  }
  
  return `CREATE OR REPLACE TABLE ${outputTable} AS SELECT * FROM ${inputTable} WHERE ${condition}`;
}

function generateAggregateSQL(
  config: AggregateConfig,
  inputTable: string,
  outputTable: string
): string {
  const { groupBy, metrics } = config;
  
  // Build SELECT clause
  const selectParts: string[] = [];
  
  // Add group by columns
  groupBy.forEach((col) => {
    selectParts.push(`"${col}"`);
  });
  
  // Add aggregate metrics
  metrics.forEach((metric) => {
    const alias = metric.alias || `${metric.func}_${metric.column}`;
    if (metric.func === 'count') {
      selectParts.push(`COUNT(*) AS "${alias}"`);
    } else {
      selectParts.push(`${metric.func.toUpperCase()}("${metric.column}") AS "${alias}"`);
    }
  });
  
  // Build GROUP BY clause
  const groupByClause = groupBy.length > 0 
    ? `GROUP BY ${groupBy.map((col) => `"${col}"`).join(', ')}` 
    : '';
  
  return `CREATE OR REPLACE TABLE ${outputTable} AS SELECT ${selectParts.join(', ')} FROM ${inputTable} ${groupByClause}`;
}

function generateSortSQL(
  config: SortConfig,
  inputTable: string,
  outputTable: string
): string {
  const { column, direction } = config;
  
  return `CREATE OR REPLACE TABLE ${outputTable} AS SELECT * FROM ${inputTable} ORDER BY "${column}" ${direction.toUpperCase()}`;
}

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Generate a SELECT query to preview data from a table
 */
export function generatePreviewSQL(tableName: string, limit: number = 100): string {
  return `SELECT * FROM ${tableName} LIMIT ${limit}`;
}

/**
 * Validate block config
 */
export function validateBlockConfig(block: Block): { valid: boolean; error?: string } {
  switch (block.type) {
    case 'datasource': {
      const config = block.config as { tableName?: string };
      if (!config.tableName) {
        return { valid: false, error: 'Table name is required' };
      }
      return { valid: true };
    }
    
    case 'filter': {
      const config = block.config as FilterConfig;
      if (!config.column) {
        return { valid: false, error: 'Column is required' };
      }
      if (!config.operator) {
        return { valid: false, error: 'Operator is required' };
      }
      if (config.value === undefined || config.value === '') {
        return { valid: false, error: 'Value is required' };
      }
      return { valid: true };
    }
    
    case 'aggregate': {
      const config = block.config as AggregateConfig;
      if (config.metrics.length === 0) {
        return { valid: false, error: 'At least one metric is required' };
      }
      return { valid: true };
    }
    
    case 'sort': {
      const config = block.config as SortConfig;
      if (!config.column) {
        return { valid: false, error: 'Column is required' };
      }
      return { valid: true };
    }
    
    case 'chart': {
      const config = block.config as { xAxis?: string; yAxis?: string };
      if (!config.xAxis || !config.yAxis) {
        return { valid: false, error: 'X and Y axis are required' };
      }
      return { valid: true };
    }
    
    default:
      return { valid: true };
  }
}
