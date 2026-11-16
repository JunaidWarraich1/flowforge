import json
from typing import Any

import httpx

from app.services.engine.nodes.base import BaseNode, interpolate_template


class HttpRequestNode(BaseNode):
    node_type = "http_request"

    async def execute(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
    ) -> dict[str, Any]:
        url_template = config.get("url", "")
        url = interpolate_template(url_template, input_data)
        if not url:
            raise ValueError("URL is required for HTTP Request node")

        method = config.get("method", "GET").upper()
        raw_headers = config.get("headers", {}) or {}
        headers = {
            k: interpolate_template(str(v), input_data)
            for k, v in raw_headers.items()
        }

        raw_body = config.get("body")
        data = None
        json_body = None

        if raw_body is not None:
            if isinstance(raw_body, str):
                interpolated_body = interpolate_template(raw_body, input_data)
                try:
                    json_body = json.loads(interpolated_body)
                except Exception:
                    data = interpolated_body
            elif isinstance(raw_body, (dict, list)):
                json_body = raw_body

        timeout_seconds = float(config.get("timeout_seconds", 30))

        async with httpx.AsyncClient(timeout=timeout_seconds, follow_redirects=True) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                json=json_body if json_body is not None else None,
                content=data if data is not None else None,
            )

            try:
                response_json = response.json()
            except Exception:
                response_json = None

            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "data": response_json if response_json is not None else response.text,
                "text": response.text,
                "ok": response.is_success,
            }
