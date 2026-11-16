from abc import ABC, abstractmethod
from typing import Any


def resolve_path(data: Any, path: str) -> Any:
    """Extract a value from nested dictionary/list using path like '$.user.name' or 'user.name'."""
    if not path:
        return data
    cleaned = path.strip()
    if cleaned.startswith("$."):
        cleaned = cleaned[2:]
    elif cleaned == "$":
        return data

    parts = cleaned.split(".")
    curr = data
    for part in parts:
        if curr is None:
            return None
        if isinstance(curr, dict):
            curr = curr.get(part)
        elif isinstance(curr, list):
            try:
                idx = int(part)
                curr = curr[idx] if 0 <= idx < len(curr) else None
            except ValueError:
                return None
        else:
            return None
    return curr


def interpolate_template(template_str: str, data: Any) -> str:
    """Interpolate placeholders like {$.user.name} or {count} inside a string."""
    if not isinstance(template_str, str):
        return str(template_str)

    import re

    def replace_match(match: re.Match) -> str:
        var_path = match.group(1).strip()
        val = resolve_path(data, var_path)
        return "" if val is None else str(val)

    return re.sub(r"\{([^}]+)\}", replace_match, template_str)


class BaseNode(ABC):
    node_type: str

    @abstractmethod
    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute the node logic and return the output dictionary."""
        raise NotImplementedError
