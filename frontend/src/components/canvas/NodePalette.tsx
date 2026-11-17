import React from 'react';
import {
  Play,
  Globe,
  Shuffle,
  GitBranch,
  Clock,
  Code2,
  FileText,
  GripVertical,
  Layers,
} from 'lucide-react';
import { NodeType } from '../../types';

interface PaletteItem {
  type: NodeType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'Triggers' | 'Actions' | 'Logic' | 'Utilities';
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'trigger',
    name: 'Manual Trigger',
    description: 'Workflow start event',
    icon: Play,
    color: '#d4af37',
    category: 'Triggers',
  },
  {
    type: 'http_request',
    name: 'HTTP Request',
    description: 'REST API calls (GET, POST)',
    icon: Globe,
    color: '#38bdf8',
    category: 'Actions',
  },
  {
    type: 'code',
    name: 'Run Script',
    description: 'Execute Python expression',
    icon: Code2,
    color: '#10b981',
    category: 'Actions',
  },
  {
    type: 'transform',
    name: 'Transform Data',
    description: 'JSON path & field mappings',
    icon: Shuffle,
    color: '#e5c07b',
    category: 'Logic',
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Branch on true / false paths',
    icon: GitBranch,
    color: '#f59e0b',
    category: 'Logic',
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Pause execution for N seconds',
    icon: Clock,
    color: '#71717a',
    category: 'Utilities',
  },
  {
    type: 'log',
    name: 'Log Output',
    description: 'Record message to timeline',
    icon: FileText,
    color: '#f43f5e',
    category: 'Utilities',
  },
];

export const NodePalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = ['Triggers', 'Actions', 'Logic', 'Utilities'] as const;

  return (
    <div className="w-64 h-full bg-[#0b0b0c] border-r border-[#2a2822] flex flex-col select-none z-20">
      {/* Palette Header */}
      <div className="p-4 border-b border-[#2a2822] flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
          Node Library
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <p className="text-[11px] text-zinc-400 px-1">
          Drag and drop nodes onto the canvas to construct your workflow graph.
        </p>

        {categories.map((category) => {
          const items = PALETTE_ITEMS.filter((item) => item.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-zinc-400 px-1">
                {category}
              </span>

              <div className="space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.type)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-md bg-[#141416] border border-[#2a2822] hover:border-primary/50 hover:bg-[#1a1a1e] cursor-grab active:cursor-grabbing transition-all duration-150"
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftColor: item.color,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-primary truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {item.description}
                        </p>
                      </div>

                      <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
