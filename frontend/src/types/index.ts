export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

export type WorkflowStatus = 'draft' | 'active' | 'archived';

export type NodeType =
  | 'trigger'
  | 'http_request'
  | 'transform'
  | 'condition'
  | 'delay'
  | 'code'
  | 'log';

export interface TriggerConfig {
  trigger_type: 'manual' | 'webhook';
}

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body: string | null;
  timeout_seconds: number;
}

export interface FieldMapping {
  source: string;
  target: string;
}

export interface TransformConfig {
  expression: string;
  mappings: FieldMapping[];
}

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'exists';

export interface ConditionConfig {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export interface DelayConfig {
  seconds: number;
}

export interface CodeConfig {
  code: string;
  timeout_seconds: number;
}

export interface LogConfig {
  message: string;
  level: 'info' | 'warning' | 'error';
}

export type NodeConfigMap = {
  trigger: TriggerConfig;
  http_request: HttpRequestConfig;
  transform: TransformConfig;
  condition: ConditionConfig;
  delay: DelayConfig;
  code: CodeConfig;
  log: LogConfig;
};

export interface NodeData {
  label: string;
  config: any;
  status?: NodeExecutionStatus;
  executionResult?: {
    input_data?: any;
    output_data?: any;
    duration_ms?: number;
    error?: string;
  };
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string | null;
  animated?: boolean;
}

export interface GraphData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface WorkflowSummary {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  version: number;
  created_at: string;
  updated_at: string;
  node_count?: number;
}

export interface Workflow extends WorkflowSummary {
  graph: GraphData;
}

export interface WorkflowCreatePayload {
  name: string;
  description?: string;
  graph?: GraphData;
}

export interface WorkflowUpdatePayload {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  graph?: GraphData;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface NodeExecution {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: NodeType;
  status: NodeExecutionStatus;
  input_data?: any;
  output_data?: any;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  error?: string | null;
}

export interface ExecutionSummary {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: ExecutionStatus;
  triggered_by: string;
  started_at?: string | null;
  finished_at?: string | null;
  error?: string | null;
  duration_ms?: number;
}

export interface Execution extends ExecutionSummary {
  input_data?: any;
  node_executions: NodeExecution[];
}

export interface DashboardStats {
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time_ms: number;
  recent_executions: ExecutionSummary[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface WebSocketMessage {
  type: 'execution_status' | 'node_status' | 'execution_complete';
  data: any;
}
