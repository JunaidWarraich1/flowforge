import { TriggerNode } from './TriggerNode';
import { HttpRequestNode } from './HttpRequestNode';
import { TransformNode } from './TransformNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';
import { CodeNode } from './CodeNode';
import { LogNode } from './LogNode';

export const nodeTypes = {
  trigger: TriggerNode,
  http_request: HttpRequestNode,
  transform: TransformNode,
  condition: ConditionNode,
  delay: DelayNode,
  code: CodeNode,
  log: LogNode,
};

export {
  TriggerNode,
  HttpRequestNode,
  TransformNode,
  ConditionNode,
  DelayNode,
  CodeNode,
  LogNode,
};
