import ast
import os
import re
import logging
from typing import Dict, List, Set, Tuple, Optional, Any
from app.schemas.graph import GraphNode, GraphEdge, ArchitectureGraph
from app.github.client import github_client
from app.cache.redis_client import cache_service

logger = logging.getLogger("oss_compass.graph")

ENTRY_POINT_NAMES = {
    "main.py", "app.py", "index.ts", "index.js", "index.tsx", "index.jsx",
    "server.py", "server.js", "server.ts", "manage.py", "main.go", "mod.rs", "lib.rs"
}

CONFIG_FILES = {
    "package.json", "pyproject.toml", "setup.py", "cargo.toml", "go.mod",
    "dockerfile", "docker-compose.yml", "docker-compose.yaml", "tsconfig.json",
    "vite.config.ts", "next.config.js", "next.config.ts", "requirements.txt"
}

class GraphBuilder:
    def _classify_node(self, path: str) -> str:
        basename = os.path.basename(path).lower()
        path_lower = path.lower()
        
        if basename in ENTRY_POINT_NAMES or basename.startswith("main."):
            return "entry_point"
        if basename in CONFIG_FILES or basename.startswith("."):
            return "config"
        if "test" in basename or "/test/" in path_lower or "/tests/" in path_lower or basename.endswith(".test.ts") or basename.endswith("_test.py"):
            return "test"
        if "/components/" in path_lower or "/ui/" in path_lower or basename.endswith(".tsx") or basename.endswith(".jsx"):
            return "component"
        if "/service" in path_lower or "/api/" in path_lower or "/routes/" in path_lower or "/client" in path_lower or "/controllers/" in path_lower:
            return "service"
        return "module"

    def _extract_python_imports(self, code_str: str) -> List[str]:
        imports = []
        try:
            tree = ast.parse(code_str)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
        except Exception:
            # Fallback to regex if syntax error or incomplete code snippet
            matches = re.findall(r"^(?:from|import)\s+([a-zA-Z0-9_\.]+)", code_str, re.MULTILINE)
            imports.extend(matches)
        return imports

    def _extract_js_ts_imports(self, code_str: str) -> List[str]:
        # Matches: import ... from './foo' or require('./foo')
        patterns = [
            r"from\s+['\"]([^'\"]+)['\"]",
            r"import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
            r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)"
        ]
        found = []
        for pattern in patterns:
            found.extend(re.findall(pattern, code_str))
        return found

    async def build_graph(self, owner: str, repo: str, branch: str = "main", max_nodes: int = 40) -> ArchitectureGraph:
        cache_key = f"graph:{owner}:{repo}:{branch}"
        cached = await cache_service.get_json(cache_key)
        if cached:
            return ArchitectureGraph(**cached)

        # 1. Fetch git tree recursively
        tree_res = await github_client.get_tree(owner, repo, branch=branch, recursive=True)
        raw_tree = tree_res.get("tree", [])

        # Filter out noisy vendor/lock files and hidden directories (.git, node_modules, dist, etc.)
        valid_items = []
        for item in raw_tree:
            path = item.get("path", "")
            if item.get("type") == "blob":
                # Exclude lockfiles, assets, and standard vendor directories
                if any(x in path for x in ["node_modules/", "vendor/", ".git/", "dist/", "build/", "site-packages/"]):
                    continue
                if path.endswith((".png", ".jpg", ".jpeg", ".ico", ".svg", ".lock", ".jsonl", ".min.js", ".min.css")):
                    continue
                valid_items.append(item)

        # Prioritize key files: configs, entrypoints, src/ or lib/ code
        def priority_score(item: Dict[str, Any]) -> int:
            p = item["path"].lower()
            if os.path.basename(p) in ENTRY_POINT_NAMES:
                return 100
            if os.path.basename(p) in CONFIG_FILES:
                return 80
            if p.startswith("src/") or p.startswith("app/") or p.startswith("lib/"):
                return 60
            if "test" in p:
                return 20
            return 40

        valid_items.sort(key=priority_score, reverse=True)
        selected_items = valid_items[:max_nodes]

        nodes: List[GraphNode] = []
        path_to_node_id: Dict[str, str] = {}
        file_paths_set: Set[str] = {item["path"] for item in selected_items}

        for idx, item in enumerate(selected_items):
            path = item["path"]
            node_id = f"node_{idx}_{os.path.basename(path).replace('.', '_')}"
            path_to_node_id[path] = node_id
            
            node_type = self._classify_node(path)
            lang = os.path.splitext(path)[1].replace(".", "").upper() or "TEXT"
            github_url = f"https://github.com/{owner}/{repo}/blob/{branch}/{path}"

            nodes.append(GraphNode(
                id=node_id,
                label=os.path.basename(path),
                path=path,
                type=node_type,
                language=lang,
                line_count=item.get("size", 0) // 35 if item.get("size") else None,
                github_url=github_url,
                data={"full_path": path, "size": item.get("size")}
            ))

        # 2. Extract relationships (inspect top 15 priority files for verified code import links)
        edges: List[GraphEdge] = []
        edge_id_counter = 0
        edge_signatures: Set[str] = set()

        files_to_inspect = selected_items[:15]
        for item in files_to_inspect:
            src_path = item["path"]
            src_node_id = path_to_node_id[src_path]
            
            # Fetch content for AST inspection
            try:
                content = await github_client.get_file_content(owner, repo, src_path, branch=branch)
                if not content or len(content) > 50000:
                    continue
                
                imported_modules: List[str] = []
                if src_path.endswith(".py"):
                    imported_modules = self._extract_python_imports(content)
                elif src_path.endswith((".ts", ".tsx", ".js", ".jsx")):
                    imported_modules = self._extract_js_ts_imports(content)

                # Match imported module against our graph nodes
                for imp in imported_modules:
                    imp_clean = imp.replace("./", "").replace("../", "").strip()
                    for target_path, target_id in path_to_node_id.items():
                        if target_id == src_node_id:
                            continue
                        target_base = os.path.splitext(os.path.basename(target_path))[0]
                        # Exact filename match or path component match
                        if imp_clean.endswith(target_base) or imp_clean == target_base or imp_clean in target_path:
                            sig = f"{src_node_id}->{target_id}"
                            if sig not in edge_signatures:
                                edge_signatures.add(sig)
                                edge_id_counter += 1
                                edges.append(GraphEdge(
                                    id=f"e_{edge_id_counter}",
                                    source=src_node_id,
                                    target=target_id,
                                    label="imports",
                                    relationship="imports",
                                    is_inferred=False,
                                    evidence=f"Direct import '{imp}' discovered in {os.path.basename(src_path)}"
                                ))
            except Exception as e:
                logger.debug(f"Failed to inspect imports for {src_path}: {e}")

        # 3. Add module-level structural relationships (inferred based on directory proximity)
        dir_groups: Dict[str, List[str]] = {}
        for path in file_paths_set:
            dir_name = os.path.dirname(path)
            if dir_name:
                dir_groups.setdefault(dir_name, []).append(path)

        for dir_name, paths_in_dir in dir_groups.items():
            if len(paths_in_dir) > 1:
                root_file = paths_in_dir[0]
                root_id = path_to_node_id[root_file]
                for other_file in paths_in_dir[1:]:
                    other_id = path_to_node_id[other_file]
                    sig = f"{root_id}->{other_id}"
                    if sig not in edge_signatures:
                        edge_signatures.add(sig)
                        edge_id_counter += 1
                        edges.append(GraphEdge(
                            id=f"e_{edge_id_counter}",
                            source=root_id,
                            target=other_id,
                            label="sibling",
                            relationship="sibling_in_module",
                            is_inferred=True,
                            evidence=f"Files co-located in directory: '{dir_name}'"
                        ))

        result_graph = ArchitectureGraph(
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges),
            is_partial=len(valid_items) > max_nodes,
            analysis_evidence=f"Analyzed {len(nodes)} structural files. {len([e for e in edges if not e.is_inferred])} verified AST import links and {len([e for e in edges if e.is_inferred])} structural module groupings."
        )

        await cache_service.set_json(cache_key, result_graph.model_dump(), ttl=1800)
        return result_graph

graph_builder = GraphBuilder()
