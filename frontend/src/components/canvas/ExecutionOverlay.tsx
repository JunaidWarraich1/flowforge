import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Play, ExternalLink } from 'lucide-react';
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
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl bg-[#0f0f18]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentExecution.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Live Execution
              </span>
              <Badge variant={currentExecution.status} size="sm" pulse={isRunning}>
                {currentExecution.status}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              ID: {currentExecution.id.slice(0, 8)}... | Trigger: {currentExecution.triggered_by}
            </p>
          </div>
        </div>

        <Link
          to={`/executions/${currentExecution.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <span>Timeline View</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              currentExecution.status === 'failed'
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-primary to-accent'
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
