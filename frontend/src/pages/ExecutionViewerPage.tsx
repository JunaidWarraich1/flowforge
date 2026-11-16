import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { useExecutionStore } from '../stores/executionStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { useCanvasStore } from '../stores/canvasStore';
import { useExecutionWebSocket } from '../hooks/useWebSocket';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { NodeExecution } from '../types';

export const ExecutionViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    currentExecution,
    isLoading: isExecutionLoading,
    fetchExecution,
  } = useExecutionStore();

  const { fetchWorkflow } = useWorkflowStore();
  const { setGraph, updateNodeStatus } = useCanvasStore();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Connect WebSocket if this execution is running
  const isRunning =
    currentExecution?.status === 'running' || currentExecution?.status === 'pending';
  useExecutionWebSocket(isRunning && id ? id : null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const exec = await fetchExecution(id);
        // Load associated workflow graph to render on canvas
        const wf = await fetchWorkflow(exec.workflow_id);
        if (wf.graph) {
          setGraph(wf.graph);
          // Sync node statuses from execution
          (exec.node_executions || []).forEach((ne) => {
            updateNodeStatus(ne.node_id, ne.status, {
              input_data: ne.input_data,
              output_data: ne.output_data,
              duration_ms: ne.duration_ms,
              error: ne.error,
            });
          });
        }
      } catch (err) {
        // Handled in store
      }
    };
    load();
  }, [id, fetchExecution, fetchWorkflow, setGraph, updateNodeStatus]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  if (isExecutionLoading || !currentExecution) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Spinner size="lg" label="Loading execution telemetry & DAG replay..." />
      </div>
    );
  }

  const nodeExecutions = currentExecution.node_executions || [];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0c0c14] px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            to={`/workflows/${currentExecution.workflow_id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="Back to Workflow"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200">
                Execution {currentExecution.id.slice(0, 8)}
              </span>
              <Badge
                variant={currentExecution.status}
                size="sm"
                pulse={isRunning}
              >
                {currentExecution.status}
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-slate-500">
              Triggered via {currentExecution.triggered_by} •{' '}
              {currentExecution.started_at
                ? new Date(currentExecution.started_at).toLocaleTimeString()
                : 'Pending'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Duration:</span>
            <span className="text-slate-200 font-bold">
              {currentExecution.duration_ms
                ? `${currentExecution.duration_ms}ms`
                : '—'}
            </span>
          </div>

          <Link
            to={`/workflows/${currentExecution.workflow_id}`}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#141420] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <span>Edit Workflow</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Split View: Left 60% Canvas, Right 40% Timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Read-Only Graph Visualization */}
        <div className="flex-[3] h-full relative border-r border-slate-800">
          <WorkflowCanvas readOnly={true} />
        </div>

        {/* Right: Execution Timeline & Node Inspector */}
        <div className="flex-[2] h-full bg-[#0d0d14] flex flex-col overflow-hidden">
          {/* Timeline Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Execution Timeline
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {nodeExecutions.length} {nodeExecutions.length === 1 ? 'node' : 'nodes'}
            </span>
          </div>

          {/* Timeline Node List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentExecution.error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase">Pipeline Failure</span>
                  <p className="mt-1">{currentExecution.error}</p>
                </div>
              </div>
            )}

            {nodeExecutions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                Waiting for step telemetry...
              </div>
            ) : (
              nodeExecutions.map((step, idx) => {
                const isExpanded = !!expandedNodes[step.node_id];

                return (
                  <div
                    key={step.id || step.node_id}
                    className="rounded-xl bg-[#13131e] border border-slate-800/80 overflow-hidden transition-all duration-150"
                  >
                    {/* Node Summary Row */}
                    <button
                      onClick={() => toggleExpand(step.node_id)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {step.status === 'running' ? (
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                        ) : step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : step.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {step.node_id}
                            </span>
                            <Badge variant={step.status} size="sm">
                              {step.status}
                            </Badge>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Type: {step.node_type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
                        <span>
                          {step.duration_ms ? `${step.duration_ms}ms` : '—'}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Details: Input/Output JSON */}
                    {isExpanded && (
                      <div className="p-3.5 border-t border-slate-800/60 bg-[#0a0a0f] space-y-3 text-xs font-mono">
                        {step.error && (
                          <div className="p-2.5 rounded bg-red-950/30 border border-red-500/30 text-red-300 text-[11px]">
                            <span className="font-bold">Error:</span> {step.error}
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            Input Data
                          </span>
                          <pre className="mt-1 p-2 rounded bg-[#111118] border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-36">
                            {step.input_data
                              ? JSON.stringify(step.input_data, null, 2)
                              : '{}'}
                          </pre>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            Output Data
                          </span>
                          <pre className="mt-1 p-2 rounded bg-[#111118] border border-slate-800 text-[11px] text-cyan-300/90 overflow-x-auto max-h-36">
                            {step.output_data
                              ? JSON.stringify(step.output_data, null, 2)
                              : '{}'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
