from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class GraphNode(BaseModel):
    id: str
    label: str
    path: str
    type: str  # "entry_point", "module", "component", "service", "config", "test", "dependency"
    language: Optional[str] = None
    line_count: Optional[int] = None
    exports: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    relationship: str = "imports"  # "imports", "calls", "tests", "configures", "inferred"
    is_inferred: bool = False      # Explicitly distinguishes direct code AST evidence from heuristic inference
    evidence: Optional[str] = None

class ArchitectureGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int
    is_partial: bool = False       # True if bounded due to repo size
    analysis_evidence: str = "AST and static import analysis"
