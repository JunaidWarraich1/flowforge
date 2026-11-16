import asyncio
from typing import Any

from app.services.engine.nodes.base import BaseNode


class DelayNode(BaseNode):
    node_type = "delay"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        seconds = float(config.get("seconds", 1))
        # Clamp to avoid hanging runs indefinitely
        seconds_to_wait = max(0.0, min(seconds, 300.0))
        await asyncio.sleep(seconds_to_wait)
        return {
            "delayed_seconds": seconds_to_wait,
            "data": input_data,
        }
