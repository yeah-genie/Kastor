'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  NodeTypes,
  DefaultEdgeOptions,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCanvasStore } from '@/app/lib/store';
import BlockNode from './BlockNode';

const BlockCanvas = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    connectBlocks,
    setSelectedBlock,
  } = useCanvasStore();

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      block: BlockNode,
    }),
    []
  );

  // Default edge options
  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
      },
    }),
    []
  );

  // Handle connection
  const onConnect = useCallback(
    (connection: Connection) => {
      connectBlocks(connection);
    },
    [connectBlocks]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedBlock(node.id);
    },
    [setSelectedBlock]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedBlock(null);
  }, [setSelectedBlock]);

  return (
    <div className="w-full h-full bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        className="bg-slate-900"
        proOptions={{ hideAttribution: true }}
      >
        {/* Background with dots pattern */}
        <Background
          color="#475569"
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
        />

        {/* Controls for zoom/pan */}
        <Controls
          className="bg-slate-800 border border-slate-700 rounded-lg"
          showInteractive={false}
        />

        {/* MiniMap */}
        <MiniMap
          className="bg-slate-800 border border-slate-700 rounded-lg"
          nodeColor={(node) => {
            const colorMap: Record<string, string> = {
              datasource: '#10b981',
              filter: '#3b82f6',
              aggregate: '#a855f7',
              sort: '#f97316',
              chart: '#ec4899',
              insight: '#eab308',
            };
            return colorMap[node.data.type] || '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
        />
      </ReactFlow>
    </div>
  );
};

export default BlockCanvas;
