from app.services.engine.nodes.base import BaseNode
from app.services.engine.nodes.code import CodeNode
from app.services.engine.nodes.condition import ConditionNode
from app.services.engine.nodes.delay import DelayNode
from app.services.engine.nodes.http_request import HttpRequestNode
from app.services.engine.nodes.log import LogNode
from app.services.engine.nodes.transform import TransformNode
from app.services.engine.nodes.trigger import TriggerNode

NODE_REGISTRY: dict[str, BaseNode] = {
    "trigger": TriggerNode(),
    "http_request": HttpRequestNode(),
    "transform": TransformNode(),
    "condition": ConditionNode(),
    "delay": DelayNode(),
    "code": CodeNode(),
    "log": LogNode(),
}


def get_node_handler(node_type: str) -> BaseNode:
    handler = NODE_REGISTRY.get(node_type)
    if not handler:
        raise ValueError(f"Unknown node type: '{node_type}'")
    return handler


__all__ = [
    "NODE_REGISTRY",
    "BaseNode",
    "CodeNode",
    "ConditionNode",
    "DelayNode",
    "HttpRequestNode",
    "LogNode",
    "TransformNode",
    "TriggerNode",
    "get_node_handler",
]
