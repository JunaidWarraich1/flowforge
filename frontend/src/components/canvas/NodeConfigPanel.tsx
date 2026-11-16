import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Trash2,
  Save,
  Plus,
  Trash,
  Code2,
  Globe,
  Shuffle,
  GitBranch,
  Clock,
  Play,
  FileText,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useCanvasStore } from '../../stores/canvasStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NodeType } from '../../types';

export const NodeConfigPanel: React.FC = () => {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, removeNode } =
    useCanvasStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<any>({});
  const [headersList, setHeadersList] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    if (selectedNode) {
      setLabel((selectedNode.data as any)?.label || '');
      const cfg = (selectedNode.data as any)?.config || {};
      setConfig({ ...cfg });

      if (selectedNode.type === 'http_request' && cfg.headers) {
        setHeadersList(
          Object.entries(cfg.headers).map(([k, v]) => ({
            key: k,
            value: String(v),
          }))
        );
      } else {
        setHeadersList([]);
      }
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const nodeType = (selectedNode.type as NodeType) || 'trigger';

  const handleSave = () => {
    let finalConfig = { ...config };

    if (nodeType === 'http_request') {
      const headersObj: Record<string, string> = {};
      headersList.forEach(({ key, value }) => {
        if (key.trim()) headersObj[key.trim()] = value;
      });
      finalConfig.headers = headersObj;
    }

    updateNodeConfig(selectedNode.id, label, finalConfig);
    selectNode(null);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this node from the workflow?')) {
      removeNode(selectedNode.id);
    }
  };

  // Header helpers for http_request
  const addHeader = () => {
    setHeadersList([...headersList, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, key: string, value: string) => {
    const next = [...headersList];
    next[index] = { key, value };
    setHeadersList(next);
  };

  const removeHeader = (index: number) => {
    setHeadersList(headersList.filter((_, i) => i !== index));
  };

  // Transform mapping helpers
  const addMapping = () => {
    const currentMappings = config.mappings || [];
    setConfig({
      ...config,
      mappings: [...currentMappings, { source: '', target: '' }],
    });
  };

  const updateMapping = (index: number, field: 'source' | 'target', val: string) => {
    const currentMappings = [...(config.mappings || [])];
    currentMappings[index] = { ...currentMappings[index], [field]: val };
    setConfig({ ...config, mappings: currentMappings });
  };

  const removeMapping = (index: number) => {
    const currentMappings = [...(config.mappings || [])];
    setConfig({
      ...config,
      mappings: currentMappings.filter((_, i) => i !== index),
    });
  };

  const getNodeIcon = () => {
    switch (nodeType) {
      case 'trigger':
        return <Play className="w-4 h-4 text-cyan-400" />;
      case 'http_request':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'transform':
        return <Shuffle className="w-4 h-4 text-violet-400" />;
      case 'condition':
        return <GitBranch className="w-4 h-4 text-amber-400" />;
      case 'delay':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'log':
        return <FileText className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <motion.aside
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute top-0 right-0 w-96 h-full bg-[#0d0d14]/95 backdrop-blur-md border-l border-slate-800 z-30 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#141420] border border-slate-800">
            {getNodeIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Configure Node</h3>
            <span className="text-[10px] font-mono uppercase text-slate-400">
              {nodeType}
            </span>
          </div>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body / Dynamic Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* General: Node Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Node Label
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Name this node..."
          />
        </div>

        {/* Dynamic type fields */}
        {nodeType === 'trigger' && (
          <div className="p-3.5 rounded-xl bg-[#141420] border border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Trigger Type</span>
            <p className="text-xs text-slate-400">
              Manual Execution: Workflow initiates on demand via the API or dashboard button.
            </p>
          </div>
        )}

        {nodeType === 'http_request' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                HTTP Method
              </label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                className="w-full bg-[#111118] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Endpoint URL
              </label>
              <Input
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://api.example.com/v1/..."
              />
            </div>

            {/* Headers Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Request Headers
                </label>
                <button
                  onClick={addHeader}
                  type="button"
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-light"
                >
                  <Plus className="w-3 h-3" /> Add Header
                </button>
              </div>

              <div className="space-y-2">
                {headersList.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      placeholder="Header"
                      value={h.key}
                      onChange={(e) => updateHeader(i, e.target.value, h.value)}
                      className="w-1/2 bg-[#111118] border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-primary"
                    />
                    <input
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => updateHeader(i, h.key, e.target.value)}
                      className="w-1/2 bg-[#111118] border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      type="button"
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Request Body (JSON)
              </label>
              <textarea
                rows={4}
                value={config.body || ''}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                placeholder='{\n  "query": "value"\n}'
                className="w-full bg-[#111118] border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 outline-none focus:border-primary resize-y"
              />
            </div>
          </div>
        )}

        {nodeType === 'condition' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Field Path
              </label>
              <Input
                value={config.field || ''}
                onChange={(e) => setConfig({ ...config, field: e.target.value })}
                placeholder="$.status_code or $.data.active"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Comparison Operator
              </label>
              <select
                value={config.operator || 'eq'}
                onChange={(e) => setConfig({ ...config, operator: e.target.value })}
                className="w-full bg-[#111118] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary"
              >
                <option value="eq">Equal to (eq)</option>
                <option value="neq">Not equal to (neq)</option>
                <option value="gt">Greater than (gt)</option>
                <option value="lt">Less than (lt)</option>
                <option value="gte">Greater or equal (gte)</option>
                <option value="lte">Less or equal (lte)</option>
                <option value="contains">Contains (contains)</option>
                <option value="exists">Exists (exists)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Expected Value
              </label>
              <Input
                value={config.value ?? ''}
                onChange={(e) => setConfig({ ...config, value: e.target.value })}
                placeholder="200 or true or text"
              />
            </div>
          </div>
        )}

        {nodeType === 'transform' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Root Expression (JMESPath / JSONPath)
              </label>
              <Input
                value={config.expression || ''}
                onChange={(e) => setConfig({ ...config, expression: e.target.value })}
                placeholder="$.data or $.users"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Field Mappings
                </label>
                <button
                  onClick={addMapping}
                  type="button"
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-light"
                >
                  <Plus className="w-3 h-3" /> Add Mapping
                </button>
              </div>

              <div className="space-y-2">
                {(config.mappings || []).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      placeholder="Source ($.id)"
                      value={m.source}
                      onChange={(e) => updateMapping(i, 'source', e.target.value)}
                      className="w-1/2 bg-[#111118] border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-primary"
                    />
                    <input
                      placeholder="Target ($.user_id)"
                      value={m.target}
                      onChange={(e) => updateMapping(i, 'target', e.target.value)}
                      className="w-1/2 bg-[#111118] border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => removeMapping(i)}
                      type="button"
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {nodeType === 'delay' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Delay Duration
              </label>
              <span className="text-xs font-mono font-bold text-slate-200">
                {config.seconds || 5} seconds
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={config.seconds || 5}
              onChange={(e) =>
                setConfig({ ...config, seconds: parseInt(e.target.value, 10) })
              }
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        )}

        {nodeType === 'code' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Python Script
            </label>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0a0f]">
              <Editor
                height="220px"
                defaultLanguage="python"
                theme="vs-dark"
                value={config.code || ''}
                onChange={(val) => setConfig({ ...config, code: val || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Variables available: <code className="text-emerald-400">input_data</code>.
              Store output into <code className="text-emerald-400">result</code>.
            </p>
          </div>
        )}

        {nodeType === 'log' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Log Level
              </label>
              <select
                value={config.level || 'info'}
                onChange={(e) => setConfig({ ...config, level: e.target.value })}
                className="w-full bg-[#111118] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary"
              >
                <option value="info">INFO</option>
                <option value="warning">WARNING</option>
                <option value="error">ERROR</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Message Template
              </label>
              <Input
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                placeholder="Workflow checkpoint reached: {$.field}"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0a0a0f]/80 flex items-center justify-between gap-3">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Delete
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => selectNode(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};
