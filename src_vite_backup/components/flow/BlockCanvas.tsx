import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import BlockNode from './BlockNode';
import { useFlowStore } from '../../store/useFlowStore';
import { BlockType } from '../../lib/types';

const nodeTypes = {
  blockNode: BlockNode,
};

const BlockCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addBlock,
    setSelectedBlock,
  } = useFlowStore();

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      setSelectedBlock(node.id);
    },
    [setSelectedBlock]
  );

  const onPaneClick = useCallback(() => {
    setSelectedBlock(null);
  }, [setSelectedBlock]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/blocktype') as BlockType;
      if (!type || !reactFlowInstance.current || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addBlock(type, position);
    },
    [addBlock]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#525252', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#3f3f46"
        />
        <Controls
          className="!bg-zinc-800 !border-zinc-700 !rounded-lg !shadow-xl"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
          nodeColor={(node) => {
            const colors: Record<BlockType, string> = {
              datasource: '#10b981',
              filter: '#3b82f6',
              aggregate: '#a855f7',
              sort: '#f59e0b',
              chart: '#f43f5e',
              insight: '#06b6d4',
            };
            return colors[node.data?.type as BlockType] || '#71717a';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>
    </div>
  );
};

const BlockCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <BlockCanvasInner />
    </ReactFlowProvider>
  );
};

export default BlockCanvas;
