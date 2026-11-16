import logging
from typing import Any

from app.services.engine.nodes.base import BaseNode, interpolate_template

logger = logging.getLogger("flowforge.engine.nodes.log")


class LogNode(BaseNode):
    node_type = "log"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        template_msg = config.get("message", "")
        message = interpolate_template(template_msg, input_data)
        level = config.get("level", "info").lower()

        if level == "error":
            logger.error(f"[Workflow Log] {message}")
        elif level == "warning":
            logger.warning(f"[Workflow Log] {message}")
        else:
            logger.info(f"[Workflow Log] {message}")

        return {
            "logged": True,
            "message": message,
            "level": level,
            "input_data": input_data,
        }
