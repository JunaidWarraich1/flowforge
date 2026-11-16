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
    color: '#06b6d4',
    category: 'Triggers',
  },
  {
    type: 'http_request',
    name: 'HTTP Request',
    description: 'REST API calls (GET, POST)',
    icon: Globe,
    color: '#3b82f6',
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
    color: '#8b5cf6',
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
    color: '#64748b',
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
    <div className="w-64 h-full bg-[#0d0d14]/95 backdrop-blur-md border-r border-slate-800 flex flex-col select-none z-20">
      {/* Palette Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Node Library
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <p className="text-[11px] text-slate-400 px-1">
          Drag and drop nodes onto the canvas to construct your workflow graph.
        </p>

        {categories.map((category) => {
          const items = PALETTE_ITEMS.filter((item) => item.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 px-1">
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
                      className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-[#13131e] border border-slate-800 hover:border-slate-700 hover:bg-[#1a1a28] cursor-grab active:cursor-grabbing transition-all duration-150"
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftColor: item.color,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.description}
                        </p>
                      </div>

                      <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
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
