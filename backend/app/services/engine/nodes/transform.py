from typing import Any

from app.services.engine.nodes.base import BaseNode, resolve_path


def set_nested_value(target_dict: dict[str, Any], path: str, value: Any) -> None:
    """Set a value in a nested dict using a dot-delimited path."""
    cleaned = path.strip()
    if cleaned.startswith("$."):
        cleaned = cleaned[2:]
    elif cleaned.startswith("$"):
        cleaned = cleaned[1:].lstrip(".")

    parts = [p for p in cleaned.split(".") if p]
    if not parts:
        return

    curr = target_dict
    for part in parts[:-1]:
        if part not in curr or not isinstance(curr[part], dict):
            curr[part] = {}
        curr = curr[part]
    curr[parts[-1]] = value


class TransformNode(BaseNode):
    node_type = "transform"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        output: dict[str, Any] = {}
        mappings: list[dict[str, str]] = config.get("mappings", [])

        if mappings:
            for item in mappings:
                source_path = item.get("source", "")
                target_path = item.get("target", "")
                if source_path and target_path:
                    val = resolve_path(input_data, source_path)
                    set_nested_value(output, target_path, val)
        else:
            output = dict(input_data or {})

        return output
