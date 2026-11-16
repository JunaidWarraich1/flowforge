import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import Execution, ExecutionStatus, NodeExecutionStatus
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStatus
from app.services.engine.executor import WorkflowExecutor
from app.services.engine.graph import WorkflowGraph
from app.services.engine.nodes.code import CodeNode
from app.services.engine.nodes.condition import ConditionNode
from app.services.engine.nodes.delay import DelayNode
from app.services.engine.nodes.log import LogNode
from app.services.engine.nodes.transform import TransformNode
from app.services.engine.nodes.trigger import TriggerNode


def test_graph_topological_sort_and_cycle_detection():
    # Valid DAG
    dag = {
        "nodes": [
            {"id": "A", "type": "trigger"},
            {"id": "B", "type": "transform"},
            {"id": "C", "type": "log"},
        ],
        "edges": [
            {"id": "e1", "source": "A", "target": "B"},
            {"id": "e2", "source": "B", "target": "C"},
        ],
    }
    graph = WorkflowGraph(dag)
    assert not graph.detect_cycles()
    assert graph.get_topological_order() == ["A", "B", "C"]

    # Graph with cycle: A -> B -> C -> A
    cyclic = {
        "nodes": [
            {"id": "A", "type": "trigger"},
            {"id": "B", "type": "transform"},
            {"id": "C", "type": "log"},
        ],
        "edges": [
            {"id": "e1", "source": "A", "target": "B"},
            {"id": "e2", "source": "B", "target": "C"},
            {"id": "e3", "source": "C", "target": "A"},
        ],
    }
    cyclic_graph = WorkflowGraph(cyclic)
    assert cyclic_graph.detect_cycles() is True
    with pytest.raises(ValueError, match="cycle"):
        cyclic_graph.get_topological_order()


@pytest.mark.asyncio
async def test_trigger_node():
    node = TriggerNode()
    out = await node.execute({"foo": "bar"}, {"trigger_type": "manual"})
    assert out["foo"] == "bar"
    assert out["trigger_type"] == "manual"


@pytest.mark.asyncio
async def test_transform_node():
    node = TransformNode()
    input_data = {
        "data": {
            "users": [{"name": "Alice"}, {"name": "Bob"}],
            "total": 2,
        }
    }
    config = {
        "mappings": [
            {"source": "$.data.users", "target": "$.users"},
            {"source": "$.data.total", "target": "$.count"},
        ]
    }
    out = await node.execute(input_data, config)
    assert len(out["users"]) == 2
    assert out["count"] == 2


@pytest.mark.asyncio
async def test_condition_node_operators():
    node = ConditionNode()
    input_data = {"status_code": 200, "items": ["apple", "banana"], "tag": None}

    # Equality
    out_eq = await node.execute(
        input_data,
        {"field": "$.status_code", "operator": "eq", "value": 200},
    )
    assert out_eq["result"] is True
    assert out_eq["branch"] == "true"

    # Inequality
    out_neq = await node.execute(
        input_data,
        {"field": "$.status_code", "operator": "neq", "value": 404},
    )
    assert out_neq["result"] is True

    # Numeric comparisons
    out_gt = await node.execute(
        input_data,
        {"field": "$.status_code", "operator": "gt", "value": 100},
    )
    assert out_gt["result"] is True

    # Contains
    out_contains = await node.execute(
        input_data,
        {"field": "$.items", "operator": "contains", "value": "apple"},
    )
    assert out_contains["result"] is True

    # Exists
    out_exists = await node.execute(
        input_data,
        {"field": "$.status_code", "operator": "exists"},
    )
    assert out_exists["result"] is True

    out_not_exists = await node.execute(
        input_data,
        {"field": "$.tag", "operator": "exists"},
    )
    assert out_not_exists["result"] is False
    assert out_not_exists["branch"] == "false"


@pytest.mark.asyncio
async def test_delay_node():
    node = DelayNode()
    # Execute small delay
    out = await node.execute({"status": "ok"}, {"seconds": 0.01})
    assert out["delayed_seconds"] == 0.01


@pytest.mark.asyncio
async def test_code_node_safe_execution():
    node = CodeNode()

    # Safe expression
    out1 = await node.execute(
        {"numbers": [10, 20, 30]},
        {"code": "sum(input_data['numbers'])"},
    )
    assert out1["result"] == 60

    # Safe statements
    script = """
active_users = [u['name'] for u in input_data['users'] if u.get('active')]
result = {'active_count': len(active_users), 'names': active_users}
"""
    out2 = await node.execute(
        {
            "users": [
                {"name": "Alice", "active": True},
                {"name": "Bob", "active": False},
                {"name": "Charlie", "active": True},
            ]
        },
        {"code": script},
    )
    assert out2["result"]["active_count"] == 2
    assert out2["result"]["names"] == ["Alice", "Charlie"]


@pytest.mark.asyncio
async def test_code_node_blocks_dangerous_constructs():
    node = CodeNode()
    dangerous_inputs = [
        "import os",
        "open('/etc/passwd')",
        "__import__('subprocess')",
        "exec('print(1)')",
    ]
    for bad_code in dangerous_inputs:
        with pytest.raises(ValueError, match="Disallowed token"):
            await node.execute({}, {"code": bad_code})


@pytest.mark.asyncio
async def test_log_node():
    node = LogNode()
    out = await node.execute(
        {"order_id": 999, "status": "shipped"},
        {"message": "Order {$.order_id} has been {$.status}", "level": "info"},
    )
    assert out["logged"] is True
    assert out["message"] == "Order 999 has been shipped"
    assert out["level"] == "info"


@pytest.mark.asyncio
async def test_workflow_executor_branching(
    db_session: AsyncSession, test_user: User
):
    # Workflow graph with condition node:
    # trigger -> condition -> (branch true: log_success)
    #                      -> (branch false: log_failure)
    graph_data = {
        "nodes": [
            {
                "id": "node_trigger",
                "type": "trigger",
                "data": {"config": {}},
            },
            {
                "id": "node_cond",
                "type": "condition",
                "data": {
                    "config": {
                        "field": "$.amount",
                        "operator": "gt",
                        "value": 50,
                    }
                },
            },
            {
                "id": "node_true",
                "type": "log",
                "data": {"config": {"message": "High value: {$.amount}"}},
            },
            {
                "id": "node_false",
                "type": "log",
                "data": {"config": {"message": "Low value: {$.amount}"}},
            },
        ],
        "edges": [
            {"id": "e1", "source": "node_trigger", "target": "node_cond"},
            {"id": "e2", "source": "node_cond", "target": "node_true", "sourceHandle": "true"},
            {"id": "e3", "source": "node_cond", "target": "node_false", "sourceHandle": "false"},
        ],
    }

    workflow = Workflow(
        user_id=test_user.id,
        name="Branching Evaluation",
        graph=graph_data,
        status=WorkflowStatus.ACTIVE,
    )
    db_session.add(workflow)
    await db_session.commit()

    # Run with amount=100 (triggers TRUE branch)
    execution = Execution(
        workflow_id=workflow.id,
        status=ExecutionStatus.PENDING,
        input_data={"amount": 100},
    )
    db_session.add(execution)
    await db_session.commit()

    executor = WorkflowExecutor(execution_id=execution.id)
    await executor.run()

    # Verify execution outcome
    await db_session.refresh(execution)
    assert execution.status == ExecutionStatus.COMPLETED

    # Check node executions
    from sqlalchemy import select

    from app.models.execution import NodeExecution

    stmt = select(NodeExecution).where(NodeExecution.execution_id == execution.id)
    res = await db_session.execute(stmt)
    node_execs = {ne.node_id: ne for ne in res.scalars().all()}

    assert node_execs["node_trigger"].status == NodeExecutionStatus.COMPLETED
    assert node_execs["node_cond"].status == NodeExecutionStatus.COMPLETED
    assert node_execs["node_true"].status == NodeExecutionStatus.COMPLETED
    assert node_execs["node_false"].status == NodeExecutionStatus.SKIPPED
