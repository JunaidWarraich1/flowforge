from typing import Any

from app.services.engine.nodes.base import BaseNode


class TriggerNode(BaseNode):
    node_type = "trigger"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        result = dict(input_data or {})
        result["trigger_type"] = config.get("trigger_type", "manual")
        return result
