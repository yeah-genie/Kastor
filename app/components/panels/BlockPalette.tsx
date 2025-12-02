'use client';

import React from 'react';
import {
  Database,
  Filter,
  GitMerge,
  ArrowUpDown,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { BlockType } from '@/app/lib/types';
import { useCanvasStore } from '@/app/lib/store';

interface BlockPaletteItem {
  type: BlockType;
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
}

const BLOCK_PALETTE: BlockPaletteItem[] = [
  {
    type: 'datasource',
    icon: <Database className="w-5 h-5" />,
    name: 'Data Source',
    description: 'Load CSV or connect data',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    type: 'filter',
    icon: <Filter className="w-5 h-5" />,
    name: 'Filter',
    description: 'Filter rows by condition',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    type: 'aggregate',
    icon: <GitMerge className="w-5 h-5" />,
    name: 'Aggregate',
    description: 'Group and summarize data',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    type: 'sort',
    icon: <ArrowUpDown className="w-5 h-5" />,
    name: 'Sort',
    description: 'Sort by column',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  },
  {
    type: 'chart',
    icon: <BarChart3 className="w-5 h-5" />,
    name: 'Chart',
    description: 'Visualize data',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  },
  {
    type: 'insight',
    icon: <Lightbulb className="w-5 h-5" />,
    name: 'Insight',
    description: 'AI business insight',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  },
];

export function BlockPalette() {
  const { addBlock } = useCanvasStore();

  const handleAddBlock = (type: BlockType) => {
    // Add block to center of canvas with slight offset for each new block
    const position = {
      x: 250 + Math.random() * 100,
      y: 100 + Math.random() * 100,
    };
    addBlock(type, position);
  };

  return (
    <div className="space-y-2">
      {BLOCK_PALETTE.map((item) => (
        <button
          key={item.type}
          onClick={() => handleAddBlock(item.type)}
          className={`
            w-full p-3 rounded-lg border transition-all
            hover:scale-105 hover:shadow-lg
            active:scale-95
            flex items-start gap-3 text-left
            ${item.color}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{item.name}</div>
            <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
