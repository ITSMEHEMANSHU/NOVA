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
} from '@xyflow/react';
import { ArchitectureGraph, GraphNode } from '@/types';
import { ExternalLink, ShieldCheck, Search, Network } from 'lucide-react';

interface ArchitectureGraphViewProps {
  graph: ArchitectureGraph;
  owner: string;
  repo: string;
}

const TYPE_CONFIG = {
  entry_point: {
    color: '#047857',
    bgColor: '#D5F5EF',
    borderColor: '#000000',
    label: 'Entry Point',
  },
  service: {
    color: '#0284c7',
    bgColor: '#DCEFFD',
    borderColor: '#000000',
    label: 'Service / API',
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
    label: 'Test Suite',
  },
  dependency: {
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#000000',
    label: 'Dependency',
  },
};

export default function ArchitectureGraphView({ graph, owner, repo }: ArchitectureGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Transform backend graph nodes into React Flow layout nodes
  const initialNodes: Node[] = useMemo(() => {
    const cols = 5;
    const xSpacing = 220;
    const ySpacing = 120;

    return graph.nodes.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.module;

      const isMatch = !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.path.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        id: n.id,
        position: { x: 50 + col * xSpacing + (row % 2) * 40, y: 50 + row * ySpacing },
        data: {
          label: (
            <div
              className={`px-3 py-2 border-2 border-black shadow-[3px_3px_0px_#000000] text-left transition-all ${
                isMatch ? 'opacity-100' : 'opacity-25'
              }`}
              style={{
                backgroundColor: conf.bgColor,
                color: '#17212B',
                minWidth: '150px',
              }}
            >
              <div className="flex items-center justify-between space-x-1 mb-1">
                <span
                  className="text-[9px] font-mono px-1 py-0.2 font-black border border-black uppercase"
                  style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                >
                  {conf.label}
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-700">{n.language || 'FILE'}</span>
              </div>
              <div className="text-xs font-black font-mono truncate text-black">{n.label}</div>
              <div className="text-[10px] text-slate-700 font-mono font-bold truncate mt-0.5">{n.path}</div>
            </div>
          ),
          rawNode: n,
        },
      };
    });
  }, [graph.nodes, searchQuery]);

  // Transform backend edges into React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: !e.is_inferred,
      style: {
        stroke: e.is_inferred ? '#64748b' : '#000000',
        strokeDasharray: e.is_inferred ? '4 4' : undefined,
        strokeWidth: e.is_inferred ? 1.5 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.is_inferred ? '#64748b' : '#000000',
      },
    }));
  }, [graph.edges]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

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

  return (
    <div className="relative w-full h-[650px] bg-[#F8FCFE] spark-panel-lg overflow-hidden flex flex-col">
      {/* Graph Toolbar (SPARK Contrast Header) */}
      <div className="p-3 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-3 z-10">
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
            {graph.total_nodes} NODES • {graph.total_edges} CONNECTIONS
          </span>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] font-mono font-black text-black">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-none bg-[#D5F5EF] border border-black" />
            <span>Entry</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-none bg-[#DCEFFD] border border-black" />
            <span>Service</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-none bg-[#E0E7FF] border border-black" />
            <span>Module</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-none bg-[#FEF3C7] border border-black" />
            <span>Config</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-0.5 bg-black" />
            <span>AST Import</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-0.5 border-b-2 border-dashed border-slate-500" />
            <span className="text-slate-600">Co-located</span>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          colorMode="light"
          minZoom={0.2}
          maxZoom={2.0}
        >
          <Background color="#cbd5e1" gap={20} size={1.5} />
          <Controls />
          <MiniMap
            className="!border-2 !border-black !shadow-[3px_3px_0px_0px_#000000] !rounded-none !overflow-hidden"
            nodeColor={(node: any) => {
              const raw = node.data?.rawNode as GraphNode;
              if (!raw) return '#94a3b8';
              return TYPE_CONFIG[raw.type]?.color || '#4338ca';
            }}
          />
        </ReactFlow>

        {/* Selected Node Inspector Drawer (SPARK Panel) */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-white spark-panel-lg p-5 flex flex-col justify-between z-20 font-mono">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b-2 border-black mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-black flex items-center">
                  <Network className="w-3.5 h-3.5 mr-1 text-black" />
                  Node Inspector
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-5 h-5 border border-black bg-white hover:bg-[#D5F5EF] text-xs font-black flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <h4 className="text-sm font-black text-black break-all mb-1">
                {selectedNode.label}
              </h4>
              <p className="text-xs font-bold text-slate-600 break-all mb-4">
                {selectedNode.path}
              </p>

              <div className="space-y-2 text-xs font-bold text-black">
                <div className="flex justify-between py-1.5 border-b border-black/10">
                  <span className="text-slate-600">Type</span>
                  <span className="uppercase px-1.5 py-0.2 bg-[#DCEFFD] border border-black font-black">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/10">
                  <span className="text-slate-600">Language</span>
                  <span className="font-black">{selectedNode.language || 'Unknown'}</span>
                </div>
                {selectedNode.line_count && (
                  <div className="flex justify-between py-1.5 border-b border-black/10">
                    <span className="text-slate-600">Estimated Lines</span>
                    <span className="font-black">~{selectedNode.line_count}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-[#D5F5EF] border-2 border-black text-[11px] font-bold text-black shadow-[2px_2px_0px_#000000]">
                <div className="font-black uppercase mb-1 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-black mr-1" />
                  Verified Evidence
                </div>
                <p className="font-sans font-medium text-xs text-slate-800 leading-snug">
                  {graph.analysis_evidence}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black/20">
              <a
                href={selectedNode.github_url || `https://github.com/${owner}/${repo}/blob/main/${selectedNode.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="spark-btn w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#72C7E8] hover:bg-[#5bb8dc] text-black font-black text-xs uppercase"
              >
                <span>View File on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-black" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
