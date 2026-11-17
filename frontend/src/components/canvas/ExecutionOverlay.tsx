import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useExecutionStore } from '../../stores/executionStore';
import { Badge } from '../ui/Badge';

export const ExecutionOverlay: React.FC = () => {
  const { currentExecution, isRunning } = useExecutionStore();

  if (!currentExecution) return null;

  const totalSteps = currentExecution.node_executions?.length || 0;
  const completedSteps =
    currentExecution.node_executions?.filter(
      (n) => n.status === 'completed' || n.status === 'skipped'
    ).length || 0;

  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : isRunning ? 30 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl bg-[#141416] border border-[#2a2822] rounded-lg p-4 shadow-card-carbon"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1f1d17] border border-primary/40 flex items-center justify-center text-primary">
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : currentExecution.status === 'completed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Execution Pipeline
              </span>
              <Badge variant={currentExecution.status} size="sm" pulse={isRunning}>
                {currentExecution.status}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              ID: {currentExecution.id.slice(0, 8)}... | Trigger: {currentExecution.triggered_by}
            </p>
          </div>
        </div>

        <Link
          to={`/executions/${currentExecution.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1a1e] border border-[#2a2822] hover:border-primary/50 text-xs font-medium text-zinc-200 transition-colors"
        >
          <span>Timeline</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>Telemetry Progress</span>
          <span className="text-primary font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#0b0b0c] border border-[#2a2822] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              currentExecution.status === 'failed'
                ? 'bg-rose-500'
                : 'bg-primary'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
};
