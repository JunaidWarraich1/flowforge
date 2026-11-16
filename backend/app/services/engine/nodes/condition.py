from typing import Any

from app.services.engine.nodes.base import BaseNode, resolve_path


class ConditionNode(BaseNode):
    node_type = "condition"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        field = config.get("field", "")
        operator = config.get("operator", "eq").lower()
        expected = config.get("value")

        actual = resolve_path(input_data, field) if field else input_data
        result = False

        if operator == "exists":
            result = actual is not None
        elif operator == "not_exists":
            result = actual is None
        elif operator == "eq":
            result = str(actual) == str(expected) if (isinstance(actual, (int, float, str)) and isinstance(expected, (int, float, str))) else actual == expected
        elif operator == "neq":
            result = str(actual) != str(expected) if (isinstance(actual, (int, float, str)) and isinstance(expected, (int, float, str))) else actual != expected
        elif operator == "gt":
            result = float(actual) > float(expected)
        elif operator == "lt":
            result = float(actual) < float(expected)
        elif operator == "gte":
            result = float(actual) >= float(expected)
        elif operator == "lte":
            result = float(actual) <= float(expected)
        elif operator == "contains":
            if isinstance(actual, (list, tuple, set)):
                result = expected in actual
            elif isinstance(actual, str) or isinstance(actual, dict):
                result = str(expected) in actual
            else:
                result = False
        else:
            raise ValueError(f"Unsupported condition operator: {operator}")

        branch = "true" if result else "false"
        return {
            "result": result,
            "branch": branch,
            "field_value": actual,
            "expected_value": expected,
        }
