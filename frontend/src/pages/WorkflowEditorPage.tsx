import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Save,
  Loader2,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useWorkflowStore } from '../stores/workflowStore';
import { useCanvasStore } from '../stores/canvasStore';
import { useExecutionStore } from '../stores/executionStore';
import { useExecutionWebSocket } from '../hooks/useWebSocket';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { NodePalette } from '../components/canvas/NodePalette';
import { NodeConfigPanel } from '../components/canvas/NodeConfigPanel';
import { ExecutionOverlay } from '../components/canvas/ExecutionOverlay';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { WorkflowStatus } from '../types';

export const WorkflowEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentWorkflow,
    isLoading: isWorkflowLoading,
    isSaving,
    fetchWorkflow,
    updateWorkflow,
  } = useWorkflowStore();

  const {
    nodes,
    edges,
    isDirty,
    setGraph,
    getGraph,
    markClean,
    clearAllNodeStatuses,
  } = useCanvasStore();

  const {
    activeExecutionId,
    isRunning: isExecutionRunning,
    startExecution,
  } = useExecutionStore();

  // Connect WebSocket for live updates during active execution
  useExecutionWebSocket(activeExecutionId);

  const [workflowName, setWorkflowName] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('draft');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

  // Load workflow on mount
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const wf = await fetchWorkflow(id);
        setWorkflowName(wf.name);
        setWorkflowStatus(wf.status);
        if (wf.graph) {
          setGraph(wf.graph);
        }
      } catch (err) {
        // Failed
      }
    };
    load();
  }, [id, fetchWorkflow, setGraph]);

  // Handle Save
  const handleSave = useCallback(async () => {
    if (!id) return;
    try {
      const graph = getGraph();
      await updateWorkflow(id, {
        name: workflowName,
        status: workflowStatus,
        graph,
      });
      markClean();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      // Save error
    }
  }, [id, workflowName, workflowStatus, getGraph, updateWorkflow, markClean]);

  // Keyboard shortcut for saving (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Handle Execute
  const handleExecute = async () => {
    if (!id) return;
    clearAllNodeStatuses();
    // Auto-save graph before execution if dirty
    if (isDirty) {
      await handleSave();
    }
    try {
      await startExecution(id, {});
    } catch (err) {
      // Execute error
    }
  };

  if (isWorkflowLoading || !currentWorkflow) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Spinner size="lg" label="Initializing Canvas & Graph Engine..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background select-none">
      {/* Canvas Top Bar */}
      <header className="h-14 border-b border-surface-border bg-background px-4 flex items-center justify-between z-20">
        {/* Left: Back & Workflow Name */}
        <div className="flex items-center gap-3">
          <Link
            to="/workflows"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-surface transition-colors"
            title="Back to workflows"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-surface-border" />

          {/* Inline Editable Workflow Name */}
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            onBlur={handleSave}
            className="bg-transparent border border-transparent hover:border-surface-border focus:border-primary rounded px-2 py-1 text-sm font-semibold text-zinc-100 outline-none transition-colors max-w-xs sm:max-w-md truncate"
            title="Click to rename"
          />

          {/* Dirty indicator */}
          {isDirty && (
            <span
              className="w-2 h-2 rounded-full bg-accent"
              title="Unsaved changes (Cmd+S)"
            />
          )}

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-xs font-mono"
            >
              <Badge variant={workflowStatus} size="sm">
                {workflowStatus}
              </Badge>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showStatusDropdown && (
              <div className="absolute left-0 mt-1.5 w-32 bg-surface border border-surface-border rounded-xl shadow-card-carbon py-1 z-30">
                {(['draft', 'active', 'archived'] as WorkflowStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setWorkflowStatus(st);
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#1a1a1e] capitalize"
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isPaletteOpen
                ? 'bg-surface border-[#3d392e] text-zinc-200'
                : 'bg-background-deep border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Node Library"
          >
            <Layers className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Palette</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={
              saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )
            }
          >
            {saveSuccess ? 'Saved' : 'Save (Ctrl+S)'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExecute}
            isLoading={isExecutionRunning}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            className="shadow-gold-active"
          >
            {isExecutionRunning ? 'Executing...' : 'Run Pipeline'}
          </Button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Palette */}
        {isPaletteOpen && <NodePalette />}

        {/* Canvas Center */}
        <div className="flex-1 h-full relative">
          <WorkflowCanvas />
          <ExecutionOverlay />
        </div>

        {/* Right Node Config Drawer */}
        <NodeConfigPanel />
      </div>
    </div>
  );
};
