from collections import defaultdict, deque
from typing import Any


class WorkflowGraph:
    def __init__(self, raw_graph: dict[str, Any]):
        self.raw_graph = raw_graph or {}
        self.nodes: dict[str, dict[str, Any]] = {}
        self.edges: list[dict[str, Any]] = []
        self.adjacency: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.in_degree: dict[str, int] = defaultdict(int)
        self.parents: dict[str, list[str]] = defaultdict(list)
        self._parse()

    def _parse(self) -> None:
        raw_nodes = self.raw_graph.get("nodes", []) or []
        raw_edges = self.raw_graph.get("edges", []) or []

        for node in raw_nodes:
            node_id = str(node.get("id"))
            self.nodes[node_id] = node
            if node_id not in self.in_degree:
                self.in_degree[node_id] = 0

        for edge in raw_edges:
            src = str(edge.get("source"))
            tgt = str(edge.get("target"))
            if src in self.nodes and tgt in self.nodes:
                self.edges.append(edge)
                self.adjacency[src].append(edge)
                self.in_degree[tgt] += 1
                self.parents[tgt].append(src)

    def detect_cycles(self) -> bool:
        """Return True if cycle detected using Kahn's algorithm or DFS."""
        in_deg = dict(self.in_degree)
        queue = deque([n for n, deg in in_deg.items() if deg == 0])
        visited_count = 0

        while queue:
            node_id = queue.popleft()
            visited_count += 1
            for edge in self.adjacency.get(node_id, []):
                tgt = str(edge.get("target"))
                in_deg[tgt] -= 1
                if in_deg[tgt] == 0:
                    queue.append(tgt)

        return visited_count < len(self.nodes)

    def get_trigger_node(self) -> dict[str, Any] | None:
        """Find the start/trigger node."""
        for node in self.nodes.values():
            if node.get("type") == "trigger":
                return node
        # If no explicit trigger node, return first root node
        for node_id, deg in self.in_degree.items():
            if deg == 0:
                return self.nodes[node_id]
        return None

    def get_topological_order(self) -> list[str]:
        """Return list of node IDs in valid topological order."""
        if self.detect_cycles():
            raise ValueError("Workflow graph contains a cycle")

        in_deg = dict(self.in_degree)
        queue = deque([n for n, deg in in_deg.items() if deg == 0])
        order = []

        while queue:
            node_id = queue.popleft()
            order.append(node_id)
            for edge in self.adjacency.get(node_id, []):
                tgt = str(edge.get("target"))
                in_deg[tgt] -= 1
                if in_deg[tgt] == 0:
                    queue.append(tgt)

        return order

    def get_outgoing_edges(self, node_id: str) -> list[dict[str, Any]]:
        return self.adjacency.get(node_id, [])

    def get_parent_ids(self, node_id: str) -> list[str]:
        return self.parents.get(node_id, [])
