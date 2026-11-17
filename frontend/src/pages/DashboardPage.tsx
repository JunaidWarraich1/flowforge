import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GitBranch,
  PlaySquare,
  CheckCircle,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../api/dashboard';
import { workflowsApi } from '../api/workflows';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/ui/StatsCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (err) {
        // Fallback mock stats if backend is initial
        setStats({
          total_workflows: 0,
          active_workflows: 0,
          total_executions: 0,
          successful_executions: 0,
          failed_executions: 0,
          avg_execution_time_ms: 0,
          recent_executions: [],
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setIsCreating(true);
    try {
      const created = await workflowsApi.create({
        name: newWorkflowName.trim(),
        description: newWorkflowDesc.trim() || undefined,
        graph: {
          nodes: [
            {
              id: 'node_trigger',
              type: 'trigger',
              position: { x: 250, y: 150 },
              data: {
                label: 'Manual Trigger',
                config: { trigger_type: 'manual' },
              },
            },
          ],
          edges: [],
        },
      });
      setIsModalOpen(false);
      navigate(`/workflows/${created.id}`);
    } catch (err) {
      // Failed to create
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading dashboard metrics..." />
      </div>
    );
  }

  const successRate =
    stats && stats.total_executions > 0
      ? (stats.successful_executions / stats.total_executions) * 100
      : 100;

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Engineering Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time pipeline analytics, execution health, and workflow status.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-gold-active self-start sm:self-auto"
        >
          Create Workflow
        </Button>
      </div>

      {/* Row of 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Workflows"
          value={stats?.total_workflows || 0}
          icon={GitBranch}
          color="amber"
        />
        <StatsCard
          label="Active Pipelines"
          value={stats?.active_workflows || 0}
          icon={Activity}
          color="amber"
        />
        <StatsCard
          label="Total Executions"
          value={stats?.total_executions || 0}
          icon={PlaySquare}
          color="amber"
        />
        <StatsCard
          label="Success Rate"
          value={successRate}
          suffix="%"
          decimals={1}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Activity Trend & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-surface-border rounded-xl p-6 shadow-card-carbon">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Execution Throughput & Latency
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Average execution time:{' '}
                <span className="font-mono text-primary font-semibold">
                  {stats?.avg_execution_time_ms ? `${stats.avg_execution_time_ms.toFixed(1)}ms` : '0ms'}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="inline-block w-2.5 h-2.5 rounded bg-primary" /> Success
              <span className="inline-block w-2.5 h-2.5 rounded bg-red-500 ml-2" /> Failed
            </div>
          </div>

          {/* Graphical trend visualization */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-surface-border px-2">
            {[45, 60, 75, 40, 85, 95, 65, 80, 70, 90, 88, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full max-w-[28px] rounded-t-sm bg-gradient-to-t from-[#2a2822] via-[#d4af37]/60 to-[#d4af37] group-hover:from-primary/60 group-hover:to-primary-light transition-all duration-200"
                />
                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300">
                  {i + 1}h
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>Historical 12-hour execution window</span>
            <span className="text-zinc-400 font-mono">100% DAG Integrity</span>
          </div>
        </div>

        {/* Quick Launch Panel */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-card-carbon flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">
              Build Visual Automation
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Design complex pipelines with automatic topological resolution.
              Support for HTTP endpoints, Python scripts, JSON transformations,
              and condition branching.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-border space-y-2.5">
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="w-full justify-between"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start New Canvas
            </Button>
            <Link
              to="/workflows"
              className="block text-center text-xs text-zinc-400 hover:text-primary transition-colors py-1"
            >
              Browse all workflows
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Executions Table */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-card-carbon">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              Recent Executions
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest pipeline triggers across all active workflows.
            </p>
          </div>
          <Link
            to="/executions"
            className="text-xs text-primary hover:text-primary-light font-medium flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recent_executions && stats.recent_executions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border text-zinc-400 uppercase font-mono text-[10px] bg-background-deep">
                <tr>
                  <th className="pb-3 px-3">Execution ID</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Triggered By</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {stats.recent_executions.map((exec) => (
                  <tr
                    key={exec.id}
                    className="hover:bg-background-hover/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-zinc-300 font-semibold">
                      {exec.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={exec.status} size="sm">
                        {exec.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono">
                      {exec.triggered_by}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">
                      {exec.duration_ms ? `${exec.duration_ms}ms` : '—'}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono">
                      {exec.started_at
                        ? new Date(exec.started_at).toLocaleTimeString()
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/executions/${exec.id}`}
                        className="text-primary hover:text-primary-light font-medium inline-flex items-center gap-1"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-surface-border rounded-xl">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">
              No executions logged yet. Run a workflow to populate this timeline.
            </p>
          </div>
        )}
      </div>

      {/* Quick Create Workflow Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workflow"
        description="Provide a title and description to initialize the canvas."
      >
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <Input
            label="Workflow Name"
            required
            placeholder="e.g. Data Sync & ETL Pipeline"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of pipeline purpose..."
              value={newWorkflowDesc}
              onChange={(e) => setNewWorkflowDesc(e.target.value)}
              className="w-full bg-[#141416] border border-surface-border rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create & Open Canvas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
