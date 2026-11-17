import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useWorkflowStore } from '../stores/workflowStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

export const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    workflows,
    isLoading,
    fetchWorkflows,
    createWorkflow,
    deleteWorkflow,
  } = useWorkflowStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWorkflows({
      search: searchTerm ? searchTerm : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
  }, [fetchWorkflows, searchTerm, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setIsCreating(true);
    try {
      const created = await createWorkflow({
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
      // Handled in store
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow(id);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Automation Workflows
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build, configure, and orchestrate visual graph workflows.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-gold-active self-start sm:self-auto"
        >
          New Workflow
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search workflows by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Grid of Workflow Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Loading workflows..." />
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No workflows found"
          description={
            searchTerm || statusFilter !== 'all'
              ? 'No workflows match your search filters. Try adjusting the query.'
              : 'You have not created any pipelines yet. Build your first workflow now.'
          }
          actionLabel="Create Workflow"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => (
            <Link
              key={wf.id}
              to={`/workflows/${wf.id}`}
              className="group relative bg-surface border border-surface-border rounded-xl p-5 hover:border-primary/60 hover:shadow-card-carbon transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={wf.status} size="sm">
                    {wf.status}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-zinc-500">
                      v{wf.version}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, wf.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-[#1a1a1e] transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                  {wf.name}
                </h3>

                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                  {wf.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(wf.updated_at || wf.created_at).toLocaleDateString()}
                </span>

                <span className="text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-sans font-medium">
                  Open Canvas <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workflow"
        description="Initialize a new visual workflow graph."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Workflow Name"
            required
            placeholder="e.g. Lead Qualification Engine"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Outline what this workflow executes..."
              value={newWorkflowDesc}
              onChange={(e) => setNewWorkflowDesc(e.target.value)}
              className="w-full bg-[#141416] border border-surface-border rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-primary"
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
