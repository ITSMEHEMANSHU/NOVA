'use client';

import React, { useMemo, useState, useCallback } from 'react';
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
import { ArchitectureGraph, GraphNode } from '@/types';
import {
  ExternalLink,
  ShieldCheck,
  Search,
  Network,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Layers,
  Sparkles,
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
 * Graphify-inspired Circular Orb Node
 */
function CircularNodeComponent({ data }: any) {
  const { rawNode, conf, isHighlighted, isDimmed, isSelected } = data;

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-300 ${
        isDimmed ? 'opacity-20 scale-90' : 'opacity-100 scale-100'
      }`}
    >
      {/* React Flow Handles for multi-directional connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-black !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-black !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-1.5 !h-1.5 !bg-black !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-1.5 !h-1.5 !bg-black !opacity-0"
      />

      {/* Circular Orb */}
      <div
        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-black transition-all duration-300 relative cursor-pointer select-none ${
          isSelected
            ? 'ring-4 ring-black shadow-[0px_0px_24px_rgba(2,132,199,0.95)] scale-115 z-30'
            : isHighlighted
            ? 'ring-3 ring-[#0284c7] shadow-[0px_0px_14px_rgba(2,132,199,0.6)] scale-105 z-20'
            : 'shadow-[3px_3px_0px_0px_#000000] hover:scale-105 hover:shadow-[4px_4px_0px_0px_#000000]'
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

      {/* Floating Pill Label */}
      <div
        className={`mt-1.5 px-2 py-0.5 border border-black text-[10px] font-mono font-black truncate max-w-[130px] transition-all text-center pointer-events-none ${
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
}

const nodeTypes = {
  circular: CircularNodeComponent,
};

export default function ArchitectureGraphView({
  graph,
  owner,
  repo,
}: ArchitectureGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate connected edges and neighbor nodes for path highlighting
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

  // Lookup map for fast node retrieval by id
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graph.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graph.nodes]);

  // 2. Cosmic Orbital Layout (Concentric Rings instead of rigid grid)
  const nodePositions = useMemo(() => {
    const tier1: GraphNode[] = []; // Entrypoints / hubs
    const tier2: GraphNode[] = []; // Services / modules
    const tier3: GraphNode[] = []; // Configs / tests / utils

    graph.nodes.forEach((n) => {
      const p = n.path.toLowerCase();
      if (
        n.type === 'entry_point' ||
        p.includes('main') ||
        p.includes('app') ||
        p.endsWith('index.ts') ||
        p.endsWith('index.js')
      ) {
        tier1.push(n);
      } else if (n.type === 'service' || n.type === 'module') {
        tier2.push(n);
      } else {
        tier3.push(n);
      }
    });

    const centerX = 550;
    const centerY = 380;
    const positions: Record<string, { x: number; y: number }> = {};

    // Center Core Tier 1 (Radius 120-160px)
    const count1 = Math.max(1, tier1.length);
    const r1 = Math.max(120, count1 * 30);
    tier1.forEach((n, idx) => {
      const angle = (idx / count1) * 2 * Math.PI - Math.PI / 2;
      positions[n.id] = {
        x: Math.round(centerX + r1 * Math.cos(angle)),
        y: Math.round(centerY + r1 * Math.sin(angle)),
      };
    });

    // Middle Orbit Tier 2 (Radius 270-350px)
    const count2 = Math.max(1, tier2.length);
    const r2 = Math.max(270, r1 + 140);
    tier2.forEach((n, idx) => {
      const angle = (idx / count2) * 2 * Math.PI;
      positions[n.id] = {
        x: Math.round(centerX + r2 * Math.cos(angle)),
        y: Math.round(centerY + r2 * Math.sin(angle)),
      };
    });

    // Outer Orbit Tier 3 (Radius 420-520px)
    const count3 = Math.max(1, tier3.length);
    const r3 = Math.max(430, r2 + 150);
    tier3.forEach((n, idx) => {
      const angle = (idx / count3) * 2 * Math.PI + Math.PI / 8;
      positions[n.id] = {
        x: Math.round(centerX + r3 * Math.cos(angle)),
        y: Math.round(centerY + r3 * Math.sin(angle)),
      };
    });

    return positions;
  }, [graph.nodes]);

  // 3. Transform nodes with dynamic highlight/dim states
  const flowNodes: Node[] = useMemo(() => {
    return graph.nodes.map((n) => {
      const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.module;
      const pos = nodePositions[n.id] || { x: 400, y: 300 };

      const isMatch =
        !searchQuery ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.path.toLowerCase().includes(searchQuery.toLowerCase());

      const isSelected = selectedNode?.id === n.id;
      const isHighlighted = connectedNeighbors.has(n.id);
      const isDimmed =
        !isMatch ||
        (selectedNode !== null && !isSelected && !isHighlighted);

      return {
        id: n.id,
        type: 'circular',
        position: pos,
        data: {
          rawNode: n,
          conf,
          isSelected,
          isHighlighted,
          isDimmed,
        },
      };
    });
  }, [graph.nodes, nodePositions, searchQuery, selectedNode, connectedNeighbors]);

  // 4. Transform edges with active path highlights
  const flowEdges: Edge[] = useMemo(() => {
    return graph.edges.map((e) => {
      const isOutgoing = selectedNode?.id === e.source;
      const isIncoming = selectedNode?.id === e.target;
      const isConnected = isOutgoing || isIncoming;
      const hasSelection = selectedNode !== null;

      let stroke = e.is_inferred ? '#64748b' : '#000000';
      let strokeWidth = e.is_inferred ? 1.5 : 2;
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
        animated,
        zIndex,
        style: {
          stroke,
          strokeDasharray: e.is_inferred && !isConnected ? '4 4' : undefined,
          strokeWidth,
          transition: 'all 0.3s ease',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
        },
      };
    });
  }, [graph.edges, selectedNode]);

  const [nodes, setNodes] = useState<Node[]>(flowNodes);
  const [edges, setEdges] = useState<Edge[]>(flowEdges);

  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges]);

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

  return (
    <div className="relative w-full h-[700px] bg-[#F8FCFE] spark-panel-lg overflow-hidden flex flex-col border-2 border-black brutal-shadow-md">
      {/* Graph Toolbar */}
      <div className="p-3 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-3 z-10 font-mono">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search file in graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border-2 border-black rounded-none text-black placeholder-slate-500 font-mono font-bold focus:outline-none focus:bg-[#D5F5EF] w-52 shadow-[2px_2px_0px_#000000]"
            />
          </div>
          <span className="text-xs font-mono font-black text-black">
            {graph.total_nodes} CIRCULAR NODES • {graph.total_edges} CONNECTIONS
          </span>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] font-mono font-black text-black">
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
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEF3C7] border border-black" />
            <span>Config</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-0.5 bg-[#0284c7]" />
            <span>Imports</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-0.5 border-b-2 border-dashed border-slate-500" />
            <span className="text-slate-600">Sibling</span>
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
          fitViewOptions={{ padding: 0.2 }}
          colorMode="light"
          minZoom={0.2}
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

        {/* Selected Node Right-Side Inspector Drawer (Graphify Style) */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-84 bg-white border-2 border-black brutal-shadow-lg p-5 flex flex-col justify-between z-30 font-mono animate-in slide-in-from-right duration-200">
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
