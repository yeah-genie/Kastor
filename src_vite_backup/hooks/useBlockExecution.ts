import { useCallback } from 'react';
import { useFlowStore } from '../store/useFlowStore';
import { useDuckDB } from './useDuckDB';
import { generateSQL, generatePreviewSQL, validateBlockConfig } from '../lib/sqlGenerator';
import { DataSourceConfig } from '../lib/types';

export function useBlockExecution() {
  const { runQuery, getColumns } = useDuckDB();
  const {
    nodes,
    edges,
    updateBlockStatus,
    setBlockOutputTable,
    setBlockResult,
    getDownstreamBlocks,
    setTableColumns,
  } = useFlowStore();

  const getInputTableName = useCallback((blockId: string): string | null => {
    const edge = edges.find((e) => e.target === blockId);
    if (!edge) return null;
    
    const sourceNode = nodes.find((n) => n.id === edge.source);
    return sourceNode?.data.outputTableName || null;
  }, [nodes, edges]);

  const executeBlock = useCallback(async (blockId: string) => {
    const node = nodes.find((n) => n.id === blockId);
    if (!node) {
      console.error(`Block ${blockId} not found`);
      return;
    }

    const block = node.data;

    // Validate config
    const validation = validateBlockConfig(block);
    if (!validation.valid) {
      updateBlockStatus(blockId, 'error', validation.error);
      return;
    }

    // Start execution
    updateBlockStatus(blockId, 'running');

    try {
      const outputTableName = `temp_${blockId}`;
      
      if (block.type === 'datasource') {
        // DataSource just references the loaded table
        const config = block.config as DataSourceConfig;
        setBlockOutputTable(blockId, config.tableName);
        
        // Get and cache columns
        const columns = await getColumns(config.tableName);
        setTableColumns(config.tableName, columns);
        
        // Get preview data
        const result = await runQuery(generatePreviewSQL(config.tableName));
        setBlockResult(blockId, result);
        
        updateBlockStatus(blockId, 'success');
      } else {
        // Other blocks need input
        const inputTableName = getInputTableName(blockId);
        if (!inputTableName) {
          throw new Error('No input connected');
        }

        // Generate and execute SQL
        const sql = generateSQL(block, inputTableName, outputTableName);
        
        if (sql) {
          console.log(`Executing SQL for ${blockId}:`, sql);
          await runQuery(sql);
        }
        
        setBlockOutputTable(blockId, outputTableName);
        
        // Get and cache columns
        const columns = await getColumns(outputTableName);
        setTableColumns(outputTableName, columns);
        
        // Get preview data
        const result = await runQuery(generatePreviewSQL(outputTableName));
        setBlockResult(blockId, result);
        
        updateBlockStatus(blockId, 'success');
      }

      // Execute downstream blocks
      const downstream = getDownstreamBlocks(blockId);
      for (const downstreamId of downstream) {
        await executeBlock(downstreamId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Execution failed';
      console.error(`Block ${blockId} execution error:`, error);
      updateBlockStatus(blockId, 'error', message);
    }
  }, [nodes, edges, runQuery, getColumns, updateBlockStatus, setBlockOutputTable, setBlockResult, getDownstreamBlocks, setTableColumns, getInputTableName]);

  const executeAllBlocks = useCallback(async () => {
    // Find root blocks (datasource blocks with no input)
    const rootBlocks = nodes.filter((n) => n.data.type === 'datasource');
    
    for (const block of rootBlocks) {
      await executeBlock(block.id);
    }
  }, [nodes, executeBlock]);

  return {
    executeBlock,
    executeAllBlocks,
    getInputTableName,
  };
}
