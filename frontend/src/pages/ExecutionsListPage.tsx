import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlaySquare,
  Clock,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useExecutionStore } from '../stores/executionStore';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export const ExecutionsListPage: React.FC = () => {
  const { executions, isLoading, fetchExecutions } = useExecutionStore();
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchExecutions({
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
  }, [fetchExecutions, statusFilter]);

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Execution Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time logs, duration metrics, and status records across all pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Loading execution history..." />
        </div>
      ) : executions.length === 0 ? (
        <EmptyState
          icon={PlaySquare}
          title="No executions found"
          description={
            statusFilter !== 'all'
              ? 'No executions match your current status filter.'
              : 'Pipelines will record execution logs here once triggered.'
          }
        />
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden shadow-card-carbon">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border text-zinc-400 uppercase font-mono text-[10px] bg-background-deep">
                <tr>
                  <th className="py-3 px-4">Execution ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trigger</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {executions.map((exec) => (
                  <tr
                    key={exec.id}
                    className="hover:bg-background-hover/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                      {exec.id.slice(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={exec.status} size="sm">
                        {exec.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400 capitalize">
                      {exec.triggered_by}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {exec.duration_ms ? `${exec.duration_ms}ms` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {exec.started_at
                        ? new Date(exec.started_at).toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/executions/${exec.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-light font-medium"
                      >
                        Inspect
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
