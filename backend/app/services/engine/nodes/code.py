import asyncio
from typing import Any

from app.services.engine.nodes.base import BaseNode

SAFE_BUILTINS = {
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "float": float,
    "int": int,
    "len": len,
    "list": list,
    "max": max,
    "min": min,
    "range": range,
    "round": round,
    "set": set,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
    "None": None,
    "True": True,
    "False": False,
}


class CodeNode(BaseNode):
    node_type = "code"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        code_str = config.get("code", "").strip()
        if not code_str:
            return {"result": None}

        # Check for disallowed constructs
        disallowed = ["import ", "__import__", "exec(", "eval(", "open(", "os.", "sys.", "subprocess"]
        for bad in disallowed:
            if bad in code_str:
                raise ValueError(f"Disallowed token in code execution: '{bad.strip()}'")

        local_vars: dict[str, Any] = {"input_data": input_data, "result": None}
        global_vars: dict[str, Any] = {"__builtins__": SAFE_BUILTINS}

        timeout_seconds = float(config.get("timeout_seconds", 5))

        def _run_sync() -> Any:
            # Try evaluating as an expression first
            try:
                expr_result = eval(code_str, global_vars, local_vars)
                return {"result": expr_result}
            except SyntaxError:
                # Execute as statements
                exec(code_str, global_vars, local_vars)
                if "result" in local_vars and local_vars["result"] is not None:
                    return {"result": local_vars["result"]}
                # Otherwise return mutated/produced keys excluding input_data
                filtered = {k: v for k, v in local_vars.items() if k != "input_data"}
                return filtered

        loop = asyncio.get_running_loop()
        try:
            return await asyncio.wait_for(
                loop.run_in_executor(None, _run_sync),
                timeout=timeout_seconds,
            )
        except TimeoutError:
            raise TimeoutError(f"Code execution exceeded timeout of {timeout_seconds}s") from None
