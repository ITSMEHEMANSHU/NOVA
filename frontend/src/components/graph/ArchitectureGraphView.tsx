'use client';

import React, { useMemo, useState, useCallback, memo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import { ArchitectureGraph, GraphNode, GraphEdge } from '@/types';
import {
  ExternalLink,
  ShieldCheck,
  Search,
  Network,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  RotateCcw,
} from 'lucide-react';

interface ArchitectureGraphViewProps {
  graph: ArchitectureGraph;
  owner: string;
  repo: string;
}

const TYPE_CONFIG: Record<
  string,
  { color: string; bgColor: string; borderColor: string; label: string }
> = {
  entry_point: {
    color: '#047857',
    bgColor: '#D5F5EF',
    borderColor: '#000000',
    label: 'Entry',
  },
  service: {
    color: '#0284c7',
    bgColor: '#DCEFFD',
    borderColor: '#000000',
    label: 'Service',
  },
  module: {
    color: '#4338ca',
    bgColor: '#E0E7FF',
    borderColor: '#000000',
    label: 'Module',
  },
  component: {
    color: '#0f766e',
    bgColor: '#CCFBF1',
    borderColor: '#000000',
    label: 'Component',
  },
  config: {
    color: '#b45309',
    bgColor: '#FEF3C7',
    borderColor: '#000000',
    label: 'Config',
  },
  test: {
    color: '#7e22ce',
    bgColor: '#F3E8FF',
    borderColor: '#000000',
    label: 'Test',
  },
  dependency: {
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#000000',
    label: 'Dep',
  },
};

/**
 * High-Performance Circular Node
 * Memoized with NO CSS position transitions to eliminate drag lag completely.
 */
const CircularNodeComponent = memo(function CircularNodeComponent({ data }: any) {
  const { rawNode, conf, isHighlighted, isDimmed, isSelected } = data;

  return (
    <div
      className={`relative flex flex-col items-center select-none ${
        isDimmed ? 'opacity-25' : 'opacity-100'
      }`}
    >
      {/* Horizontal Tree Handles: Left (Target/In), Right (Source/Out) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-black !border !border-white !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-black !border !border-white !opacity-0"
      />

      {/* Circular Orb */}
      <div
        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-black cursor-grab active:cursor-grabbing relative ${
          isSelected
            ? 'ring-4 ring-black shadow-[0px_0px_20px_rgba(2,132,199,0.9)] scale-110 z-30'
            : isHighlighted
            ? 'ring-3 ring-[#0284c7] shadow-[0px_0px_14px_rgba(2,132,199,0.5)] scale-105 z-20'
            : 'shadow-[3px_3px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000]'
        }`}
        style={{
          backgroundColor: conf?.bgColor || '#DCEFFD',
        }}
      >
        <span
          className="text-[9px] font-mono font-black uppercase tracking-tight text-center px-1"
          style={{ color: '#17212B' }}
        >
          {rawNode.language || 'FILE'}
        </span>

        {/* Pulsing indicator for entry point */}
        {rawNode.type === 'entry_point' && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10b981] border border-black flex items-center justify-center shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </span>
        )}
      </div>

      {/* Node Title Label Pill */}
      <div
        className={`mt-1.5 px-2 py-0.5 border border-black text-[10px] font-mono font-black truncate max-w-[130px] text-center pointer-events-none ${
          isSelected
            ? 'bg-black text-[#72C7E8] shadow-[2px_2px_0px_#000000]'
            : isHighlighted
            ? 'bg-[#72C7E8] text-black shadow-[2px_2px_0px_#000000]'
            : 'bg-white/95 text-black shadow-[1px_1px_0px_#000000]'
        }`}
        title={rawNode.path}
      >
        {rawNode.label}
      </div>
    </div>
  );
});

const nodeTypes = {
  circular: CircularNodeComponent,
};

/**
 * Builds a clean, non-overlapping hierarchical Tree (DAG) layout
 */
function computeTreeLayout(nodes: GraphNode[], edges: GraphEdge[]) {
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    adjacency[n.id] = [];
  });

  edges.forEach((e) => {
    if (inDegree[e.target] !== undefined) {
      inDegree[e.target]++;
    }
    if (adjacency[e.source]) {
      adjacency[e.source].push(e.target);
    }
  });

  // Assign levels (BFS)
  const levels: Record<string, number> = {};
  const visited = new Set<string>();

  const roots = nodes.filter(
    (n) =>
      n.type === 'entry_point' ||
      n.path.includes('main.') ||
      n.path.includes('app.') ||
      inDegree[n.id] === 0
  );

  const startRoots = roots.length > 0 ? roots : [nodes[0]];
  const queue: { id: string; level: number }[] = startRoots.map((r) => ({
    id: r.id,
    level: 0,
  }));
  startRoots.forEach((r) => visited.add(r.id));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levels[id] = Math.min(4, Math.max(levels[id] ?? 0, level));

    for (const targetId of adjacency[id] || []) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push({ id: targetId, level: level + 1 });
      }
    }
  }

  // Any remaining nodes grouped by architectural role
  nodes.forEach((n) => {
    if (levels[n.id] === undefined) {
      if (n.type === 'entry_point') levels[n.id] = 0;
      else if (n.type === 'service') levels[n.id] = 1;
      else if (n.type === 'module' || n.type === 'component') levels[n.id] = 2;
      else levels[n.id] = 3;
    }
  });

  // Group columns
  const columns: Record<number, GraphNode[]> = {};
  nodes.forEach((n) => {
    const lvl = levels[n.id] ?? 2;
    if (!columns[lvl]) columns[lvl] = [];
    columns[lvl].push(n);
  });

  // Sort within columns by directory so sibling files stay naturally adjacent
  Object.values(columns).forEach((col) => {
    col.sort((a, b) => a.path.localeCompare(b.path));
  });

  const positions: Record<string, { x: number; y: number }> = {};
  const xSpacing = 340; // Wide horizontal gap between tree layers
  const ySpacing = 100; // Generous vertical gap so nodes never touch!

  // Find max column height to center shorter columns gracefully
  const maxNodesInCol = Math.max(...Object.values(columns).map((c) => c.length), 1);
  const totalTreeHeight = maxNodesInCol * ySpacing;

  Object.entries(columns).forEach(([lvlStr, colNodes]) => {
    const lvl = parseInt(lvlStr, 10);
    const colX = 100 + lvl * xSpacing;
    const colHeight = colNodes.length * ySpacing;
    const startY = Math.max(60, (totalTreeHeight - colHeight) / 2 + 60);

    colNodes.forEach((node, idx) => {
      positions[node.id] = {
        x: colX,
        y: Math.round(startY + idx * ySpacing),
      };
    });
  });

  return positions;
}

export default function ArchitectureGraphView({
  graph,
  owner,
  repo,
}: ArchitectureGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Compute tree layout coordinates once per graph change
  const initialPositions = useMemo(() => {
    return computeTreeLayout(graph.nodes, graph.edges);
  }, [graph.nodes, graph.edges]);

  // Lookup map for fast node retrieval by id
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graph.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graph.nodes]);

  // 2. Calculate connected edges and neighbor nodes for path highlighting
  const { incomingEdges, outgoingEdges, connectedNeighbors } = useMemo(() => {
    if (!selectedNode) {
      return {
        incomingEdges: [] as typeof graph.edges,
        outgoingEdges: [] as typeof graph.edges,
        connectedNeighbors: new Set<string>(),
      };
    }

    const inEdges = graph.edges.filter((e) => e.target === selectedNode.id);
    const outEdges = graph.edges.filter((e) => e.source === selectedNode.id);
    const neighbors = new Set<string>([
      ...inEdges.map((e) => e.source),
      ...outEdges.map((e) => e.target),
    ]);

    return {
      incomingEdges: inEdges,
      outgoingEdges: outEdges,
      connectedNeighbors: neighbors,
    };
  }, [selectedNode, graph.edges]);

  // 3. Build initial React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return graph.nodes.map((n) => {
      const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.module;
      const pos = initialPositions[n.id] || { x: 100, y: 100 };

      return {
        id: n.id,
        type: 'circular',
        position: pos,
        data: {
          rawNode: n,
          conf,
          isSelected: false,
          isHighlighted: false,
          isDimmed: false,
        },
      };
    });
  }, [graph.nodes, initialPositions]);

  // 4. Build initial React Flow edges (smoothstep tree curves)
  const initialEdges: Edge[] = useMemo(() => {
    return graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: !e.is_inferred,
      zIndex: 1,
      style: {
        stroke: e.is_inferred ? '#64748b' : '#000000',
        strokeDasharray: e.is_inferred ? '4 4' : undefined,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.is_inferred ? '#64748b' : '#000000',
      },
    }));
  }, [graph.edges]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Sync when graph changes or layout resets
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Update node highlight & dim states without moving their dragged positions
  React.useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const raw = node.data?.rawNode as GraphNode;
        if (!raw) return node;

        const isMatch =
          !searchQuery ||
          raw.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          raw.path.toLowerCase().includes(searchQuery.toLowerCase());

        const isSelected = selectedNode?.id === raw.id;
        const isHighlighted = connectedNeighbors.has(raw.id);
        const isDimmed =
          !isMatch ||
          (selectedNode !== null && !isSelected && !isHighlighted);

        if (
          node.data.isSelected === isSelected &&
          node.data.isHighlighted === isHighlighted &&
          node.data.isDimmed === isDimmed
        ) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            isSelected,
            isHighlighted,
            isDimmed,
          },
        };
      })
    );
  }, [selectedNode, connectedNeighbors, searchQuery]);

  // Update edges with active path highlights
  React.useEffect(() => {
    setEdges(
      graph.edges.map((e) => {
        const isOutgoing = selectedNode?.id === e.source;
        const isIncoming = selectedNode?.id === e.target;
        const isConnected = isOutgoing || isIncoming;
        const hasSelection = selectedNode !== null;

        let stroke = e.is_inferred ? '#64748b' : '#000000';
        let strokeWidth = 2;
        let animated = !e.is_inferred;
        let zIndex = 1;

        if (hasSelection) {
          if (isConnected) {
            stroke = isOutgoing ? '#0284c7' : '#10b981';
            strokeWidth = 3.5;
            animated = true;
            zIndex = 10;
          } else {
            stroke = '#e2e8f0';
            strokeWidth = 1;
            animated = false;
            zIndex = 0;
          }
        }

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          animated,
          zIndex,
          style: {
            stroke,
            strokeDasharray: e.is_inferred && !isConnected ? '4 4' : undefined,
            strokeWidth,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
          },
        };
      })
    );
  }, [graph.edges, selectedNode]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const raw = (node.data as any)?.rawNode as GraphNode;
    if (raw) setSelectedNode(raw);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const handleResetLayout = () => {
    setNodes(initialNodes);
    setSelectedNode(null);
  };

  return (
    <div className="relative w-full h-[700px] bg-[#F8FCFE] spark-panel-lg overflow-hidden flex flex-col border-2 border-black brutal-shadow-md">
      {/* Graph Toolbar */}
      <div className="p-3 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-3 z-10 font-mono">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search file in tree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border-2 border-black rounded-none text-black placeholder-slate-500 font-mono font-bold focus:outline-none focus:bg-[#D5F5EF] w-52 shadow-[2px_2px_0px_#000000]"
            />
          </div>
          <span className="text-xs font-mono font-black text-black hidden sm:inline">
            {graph.total_nodes} NODES • {graph.total_edges} CONNECTIONS (TREE LAYOUT)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono font-black text-black">
          {/* Reset layout button */}
          <button
            onClick={handleResetLayout}
            className="brutal-btn px-2.5 py-1 bg-white border border-black hover:bg-[#D5F5EF] flex items-center space-x-1"
            title="Reset to organized tree layout"
          >
            <RotateCcw className="w-3 h-3 text-black" />
            <span>Reset Tree</span>
          </button>

          {/* Legend */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D5F5EF] border border-black" />
              <span>Entry</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#DCEFFD] border border-black" />
              <span>Service</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E0E7FF] border border-black" />
              <span>Module</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-0.5 bg-[#0284c7]" />
              <span>Imports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          colorMode="light"
          minZoom={0.15}
          maxZoom={2.0}
        >
          <Background color="#cbd5e1" gap={24} size={1.5} />
          <Controls className="!border-2 !border-black !bg-white !shadow-[2px_2px_0px_#000]" />
          <MiniMap
            className="!border-2 !border-black !shadow-[3px_3px_0px_0px_#000000] !rounded-none !overflow-hidden"
            nodeColor={(node: any) => {
              const raw = node.data?.rawNode as GraphNode;
              if (!raw) return '#94a3b8';
              return TYPE_CONFIG[raw.type]?.color || '#4338ca';
            }}
          />
        </ReactFlow>

        {/* Selected Node Right-Side Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-84 bg-white border-2 border-black brutal-shadow-lg p-5 flex flex-col justify-between z-30 font-mono animate-in slide-in-from-right duration-150">
            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b-2 border-black">
                <span className="text-xs font-black uppercase tracking-wider text-black flex items-center">
                  <Network className="w-3.5 h-3.5 mr-1.5 text-black" />
                  Node Inspector
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-6 h-6 border-2 border-black bg-white hover:bg-[#D5F5EF] text-xs font-black flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-black" />
                </button>
              </div>

              {/* Title & Path */}
              <div>
                <h4 className="text-sm font-black text-black break-all mb-1">
                  {selectedNode.label}
                </h4>
                <p className="text-[11px] font-bold text-slate-600 break-all">
                  {selectedNode.path}
                </p>
              </div>

              {/* Node Metadata Table */}
              <div className="space-y-1.5 text-xs font-bold text-black border-y-2 border-black/10 py-3">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Type</span>
                  <span className="uppercase px-2 py-0.5 bg-[#DCEFFD] border border-black font-black text-[11px]">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Language</span>
                  <span className="font-black bg-[#D5F5EF] px-2 py-0.5 border border-black text-[11px]">
                    {selectedNode.language || 'Unknown'}
                  </span>
                </div>
                {selectedNode.line_count && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Estimated Lines</span>
                    <span className="font-black">~{selectedNode.line_count}</span>
                  </div>
                )}
              </div>

              {/* Graphify Linking Paths: Outgoing Dependencies */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-black flex items-center mb-2">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-[#0284c7]" />
                  Outgoing Dependencies ({outgoingEdges.length})
                </div>
                {outgoingEdges.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {outgoingEdges.map((e) => {
                      const target = nodeMap.get(e.target);
                      return (
                        <button
                          key={e.id}
                          onClick={() => target && setSelectedNode(target)}
                          className="px-2 py-1 text-[10px] font-mono font-bold bg-[#DCEFFD] hover:bg-[#72C7E8] text-black border border-black text-left truncate max-w-full transition-colors cursor-pointer"
                          title={`Jump to ${target?.path || e.target}`}
                        >
                          → {target?.label || e.target}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 font-bold italic">
                    No outgoing AST imports detected.
                  </p>
                )}
              </div>

              {/* Graphify Linking Paths: Incoming References */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-black flex items-center mb-2">
                  <ArrowDownLeft className="w-3.5 h-3.5 mr-1 text-[#10b981]" />
                  Imported By ({incomingEdges.length})
                </div>
                {incomingEdges.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {incomingEdges.map((e) => {
                      const source = nodeMap.get(e.source);
                      return (
                        <button
                          key={e.id}
                          onClick={() => source && setSelectedNode(source)}
                          className="px-2 py-1 text-[10px] font-mono font-bold bg-[#D5F5EF] hover:bg-[#a7f3d0] text-black border border-black text-left truncate max-w-full transition-colors cursor-pointer"
                          title={`Jump to ${source?.path || e.source}`}
                        >
                          ← {source?.label || e.source}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 font-bold italic">
                    No incoming module imports detected.
                  </p>
                )}
              </div>

              {/* Code Evidence Banner */}
              <div className="p-3 bg-[#D5F5EF] border-2 border-black text-[11px] font-bold text-black brutal-shadow-sm">
                <div className="font-black uppercase mb-1 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-black mr-1" />
                  Code Evidence
                </div>
                <p className="font-sans font-medium text-xs text-slate-800 leading-snug">
                  {graph.analysis_evidence}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t-2 border-black">
              <a
                href={
                  selectedNode.github_url ||
                  `https://github.com/${owner}/${repo}/blob/main/${selectedNode.path}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="brutal-btn w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#72C7E8] hover:bg-black hover:text-[#72C7E8] text-black font-black text-xs uppercase border-2 border-black brutal-shadow-sm transition-all"
              >
                <span>View Source on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
