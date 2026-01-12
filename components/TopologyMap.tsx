
import React, { useCallback, useEffect, useState, memo, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  MarkerType,
  BackgroundVariant,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { GceResource } from '../types';
import { 
  Server, HardDrive, Globe, Cloud, Database, Monitor, 
  Activity, X, Network as NetworkIcon,
  Maximize, Cpu, Zap, Box, Layers, ArrowRight, Tag
} from 'lucide-react';
import { RegionIcon } from './RegionIcon';
import { Badge, Button, ToggleSwitch } from './DesignSystem';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface TopologyFilters {
  showDisks: boolean;
  showStopped: boolean;
  groupZones: boolean;
}

// --- Custom Nodes ---

const NetworkNode = memo(({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`
    relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 group
    ${selected 
      ? 'bg-blue-600/90 shadow-[0_0_50px_rgba(37,99,235,0.5)] scale-110 z-50 ring-4 ring-blue-500/20' 
      : 'bg-slate-900/90 dark:bg-slate-950/90 shadow-2xl border border-slate-700/50 backdrop-blur-md opacity-80 hover:opacity-100'}
  `}>
    <Handle type="source" position={Position.Right} className="!opacity-0" />
    <Handle type="target" position={Position.Left} className="!opacity-0" />
    
    <div className={`absolute inset-0 rounded-full border-2 border-dashed border-slate-600/50 ${selected ? 'animate-spin-slow' : 'group-hover:animate-spin-slow'}`}></div>
    <div className={`absolute inset-[-4px] rounded-full border border-slate-700/30 opacity-50`}></div>
    
    <div className="relative z-10 p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border border-slate-700 shadow-inner">
        <NetworkIcon className={`w-8 h-8 ${selected ? 'text-white' : 'text-blue-400'}`} />
    </div>

    <div className={`
        absolute -bottom-8 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border transition-all whitespace-nowrap
        ${selected 
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg scale-110' 
            : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
    `}>
      {data.label}
    </div>
  </div>
));

const ResourceNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
  const isRunning = data.status === 'RUNNING' || data.status === 'READY';
  const isStopped = data.status === 'STOPPED' || data.status === 'TERMINATED';
  
  const getIcon = () => {
    switch(data.type) {
      case 'INSTANCE': return <Server className={`w-5 h-5 ${isRunning ? 'text-emerald-500' : 'text-slate-400'}`} />;
      case 'DISK': return <HardDrive className="w-5 h-5 text-purple-500" />;
      case 'CLOUD_RUN': return <Cloud className="w-5 h-5 text-indigo-500" />;
      case 'CLOUD_SQL': return <Database className="w-5 h-5 text-orange-500" />;
      case 'BUCKET': return <Box className="w-5 h-5 text-yellow-500" />;
      default: return <Monitor className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = () => {
      if (isRunning) return 'border-l-emerald-500 shadow-emerald-500/10';
      if (isStopped) return 'border-l-red-500 shadow-red-500/10';
      return 'border-l-slate-400';
  };

  return (
    <div className={`
      relative min-w-[240px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-l-4 transition-all duration-300 rounded-lg overflow-hidden group
      ${getStatusColor()}
      ${selected 
        ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/50 scale-105 z-50' 
        : 'border-y border-r border-y-slate-200 dark:border-y-slate-800 border-r-slate-200 dark:border-r-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1'}
    `}>
      <Handle type="target" position={Position.Left} className="!bg-slate-400/50 !w-2 !h-2 !-left-[5px] !border-none" />
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

      <div className="p-3.5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg border shadow-sm ${selected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                {getIcon()}
             </div>
             <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]" title={data.label}>
                    {data.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                   {data.type === 'INSTANCE' ? data.machineType : 
                    data.type === 'BUCKET' ? data.storageClass :
                    data.type}
                </div>
             </div>
          </div>
          
          {data.zone && data.zone !== 'global' && (
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                <RegionIcon zone={data.zone} className="w-3 h-2" />
                <span>{data.zone.split('-')[1]}</span>
             </div>
          )}
        </div>

        {data.type === 'INSTANCE' && (
           <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                 <span>Resources</span>
                 <span className={isRunning ? 'text-emerald-500' : 'text-slate-500'}>{isRunning ? 'Active' : 'Stopped'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-100 dark:bg-slate-950 rounded px-2 py-1 flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                    <Cpu className="w-3 h-3 text-slate-400" />
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[40%]"></div>
                    </div>
                 </div>
                 <div className="bg-slate-100 dark:bg-slate-950 rounded px-2 py-1 flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                    <Zap className="w-3 h-3 text-slate-400" />
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[65%]"></div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {data.ip && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-500 truncate flex items-center gap-1">
                <Globe className="w-3 h-3 opacity-50" />
                {data.ip}
            </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-400/50 !w-2 !h-2 !-right-[5px] !border-none" />
    </div>
  );
});

const nodeTypes = {
  network: NetworkNode,
  resource: ResourceNode,
};

// --- Layout Engine ---

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction, 
    align: 'DL', 
    nodesep: 50, 
    ranksep: 120, 
    ranker: 'network-simplex'
  });

  nodes.forEach((node) => {
    const width = node.type === 'network' ? 120 : 260;
    const height = node.type === 'network' ? 120 : 160;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - (node.type === 'network' ? 60 : 130),
        y: nodeWithPosition.y - (node.type === 'network' ? 60 : 80),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- Main Component ---

interface TopologyMapProps {
  resources: GceResource[];
}

const TopologyMapInner: React.FC<TopologyMapProps> = ({ resources }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selection, setSelection] = useState<{ type: 'resource' | 'network', id: string, data?: any } | null>(null);
  const [filters, setFilters] = useState<TopologyFilters>({
    showDisks: true,
    showStopped: true,
    groupZones: false
  });
  
  const { fitView } = useReactFlow();

  // Create a structural hash. Including selection ID to trigger style updates.
  const topologyHash = useMemo(() => {
    return resources.map(r => `${r.id}-${r.status}-${r.ips?.length}-${r.disks?.length}`).join('|') 
           + `-${filters.showDisks}-${filters.showStopped}-${selection?.id}`;
  }, [resources, filters, selection]);

  // Graph Construction Logic
  useEffect(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    const createdNetworks = new Set<string>();

    // Helper to check if a node/edge should be highlighted
    const isHighlighted = (nodeId: string, connectedIds: string[] = []) => {
        if (!selection) return true; // No selection = all highlighted (or default state)
        if (selection.id === nodeId) return true;
        
        if (selection.type === 'network') {
            // If network selected, highlight connected resources
            // The network ID is `net-${networkName}`
            // We need to check if this resource is connected to this network
            // This is tricky inside this helper without full graph context, 
            // so we'll handle specific logic in the loop below.
            return false; 
        }
        
        if (selection.type === 'resource') {
            // If resource selected, highlight connected network and disks
            return connectedIds.includes(selection.id);
        }
        return false;
    };

    // 1. Networks (Root Nodes)
    resources.forEach(r => {
      if (!filters.showStopped && r.status === 'STOPPED') return;

      r.ips?.forEach(ip => {
        const netName = ip.network;
        const netNodeId = `net-${netName}`;
        
        if (!createdNetworks.has(netName)) {
          createdNetworks.add(netName);
          
          const isSelected = selection?.id === netNodeId;
          const isRelated = selection?.type === 'resource' && selection.data.ips?.some((i: any) => i.network === netName);
          const isDimmed = selection && !isSelected && !isRelated;

          rawNodes.push({
            id: netNodeId,
            type: 'network',
            data: { label: netName },
            position: { x: 0, y: 0 },
            zIndex: 10,
            className: isDimmed ? 'opacity-20 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300',
            selected: isSelected
          });
        }
      });
    });

    // 2. Resources
    resources.forEach(r => {
      if (!filters.showStopped && r.status === 'STOPPED') return;
      const isRunning = r.status === 'RUNNING' || r.status === 'READY';
      
      const isSelected = selection?.id === r.id;
      
      // Check if related to selected network
      let isRelatedToNetwork = false;
      if (selection?.type === 'network') {
          const selectedNetName = selection.id.replace('net-', '');
          isRelatedToNetwork = r.ips?.some(ip => ip.network === selectedNetName) || false;
      }

      // Check if related to selected resource (e.g. disk)
      let isRelatedToResource = false;
      if (selection?.type === 'resource' && selection.id.includes('-disk-')) {
          // If a disk is selected, highlight its parent VM
          const parentId = selection.id.split('-disk-')[0];
          isRelatedToResource = r.id === parentId;
      }

      const isDimmed = selection && !isSelected && !isRelatedToNetwork && !isRelatedToResource;

      // Add Resource Node
      rawNodes.push({
        id: r.id,
        type: 'resource',
        selected: isSelected, 
        data: { 
          label: r.name, 
          machineType: r.machineType,
          storageClass: r.storageClass,
          type: r.type,
          status: r.status,
          zone: r.zone,
          ip: r.ips?.[0]?.internal || r.ips?.[0]?.external,
          resource: r 
        },
        position: { x: 0, y: 0 },
        zIndex: isSelected ? 50 : 1,
        className: isDimmed ? 'opacity-20 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300'
      });

      // Edge: Network -> Resource
      r.ips?.forEach(ip => {
        const netNodeId = `net-${ip.network}`;
        const isNetSelected = selection?.id === netNodeId;
        const isResSelected = selection?.id === r.id;
        
        // Highlight edge if:
        // 1. No selection
        // 2. This network is selected
        // 3. This resource is selected
        const isHighlit = !selection || isNetSelected || isResSelected;

        rawEdges.push({
          id: `e-${ip.network}-${r.id}`,
          source: netNodeId,
          target: r.id,
          type: 'default',
          animated: isRunning && isHighlit,
          style: { 
              stroke: isHighlit ? (isRunning ? '#3b82f6' : '#64748b') : '#e2e8f0', 
              strokeWidth: isHighlit ? (isNetSelected || isResSelected ? 3 : 2) : 1, 
              opacity: isHighlit ? (isRunning ? 0.8 : 0.5) : 0.1 
          },
          zIndex: isHighlit ? 20 : 0,
          markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: isHighlit ? (isRunning ? '#3b82f6' : '#64748b') : '#e2e8f0'
          },
        });
      });

      // Disks (Attached)
      if (filters.showDisks) {
        r.disks?.forEach((d, idx) => {
          const diskNodeId = `${r.id}-disk-${idx}`;
          const isDiskSelected = selection?.id === diskNodeId;
          const isParentSelected = selection?.id === r.id;
          
          const isHighlit = !selection || isDiskSelected || isParentSelected;
          const isDimmed = selection && !isHighlit;

          rawNodes.push({
            id: diskNodeId,
            type: 'resource',
            data: { 
              label: d.deviceName, 
              machineType: `${d.sizeGb}GB ${d.type}`, 
              type: 'DISK',
              status: 'READY' 
            },
            position: { x: 0, y: 0 },
            zIndex: isDiskSelected ? 40 : 1,
            className: isDimmed ? 'opacity-20 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300',
            selected: isDiskSelected
          });
          
          rawEdges.push({
            id: `e-${r.id}-${diskNodeId}`,
            source: r.id,
            target: diskNodeId,
            type: 'step', 
            animated: false,
            style: { 
              stroke: isHighlit ? '#a855f7' : '#e2e8f0', 
              strokeWidth: isHighlit ? 2 : 1.5, 
              strokeDasharray: '4,4', 
              opacity: isHighlit ? 0.6 : 0.1 
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: isHighlit ? '#a855f7' : '#e2e8f0' }
          });
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    if (!selection) {
       setTimeout(() => fitView({ padding: 0.3, duration: 800 }), 100);
    }

  }, [topologyHash, fitView, setNodes, setEdges, filters, selection, resources]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'resource') {
       if (node.data.type === 'DISK') {
           // Construct partial resource for disk visualization
           const diskData = {
              id: node.id,
              name: node.data.label,
              type: 'DISK',
              zone: 'attached',
              status: 'READY',
              creationTimestamp: new Date().toISOString(),
              provisioningModel: 'STANDARD',
              labels: {},
              labelFingerprint: 'virtual-disk',
              machineType: node.data.machineType,
           } as GceResource;
           setSelection({ type: 'resource', id: node.id, data: diskData });
       } else {
           setSelection({ type: 'resource', id: node.id, data: node.data.resource });
       }
    } else if (node.type === 'network') {
       setSelection({ type: 'network', id: node.id, data: node.data });
    } else {
       setSelection(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelection(null);
  }, []);

  // Helper to get the resource data for the side panel
  const selectedResource = selection?.type === 'resource' ? selection.data : null;

  return (
    <div className="w-full h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl relative" style={{ minHeight: '500px' }}>
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          className="bg-slate-950"
          minZoom={0.1}
          maxZoom={4}
          style={{ width: '100%', height: '100%' }}
        >
          <Background 
              variant={BackgroundVariant.Dots} 
              gap={30} 
              size={1} 
              color="#334155" 
              className="opacity-50"
          />
          
          <Controls className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 fill-slate-500 rounded-lg shadow-lg" />
          
          <Panel position="top-left" className="m-6">
             <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-slate-700 shadow-2xl w-72 space-y-5 animate-in slide-in-from-left-4 fade-in duration-500">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                          <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Topology Layers</span>
                   </div>
                   <Badge variant="info">{nodes.length}</Badge>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Storage Devices</span>
                      <ToggleSwitch 
                          checked={filters.showDisks} 
                          onChange={v => setFilters(p => ({...p, showDisks: v}))}
                      />
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Inactive Resources</span>
                      <ToggleSwitch 
                          checked={filters.showStopped} 
                          onChange={v => setFilters(p => ({...p, showStopped: v}))}
                      />
                   </div>
                </div>

                <div className="pt-2">
                   <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => fitView({ duration: 800 })}>
                      <Maximize className="w-3 h-3 mr-2" /> Center Map
                   </Button>
                </div>
             </div>
          </Panel>

          <Panel position="bottom-left" className="m-6">
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-lg flex gap-4 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div> Network Flow
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div> Storage Link
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div> Stopped
                  </div>
              </div>
          </Panel>
        </ReactFlow>
      </div>

      <AnimatePresence>
        {selectedResource && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 top-0 bottom-0 w-[400px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
          >
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-gradient-to-b from-slate-50 to-transparent dark:from-black/20">
                <div className="flex-1 pr-4">
                   <div className="flex items-center gap-2 mb-2">
                       <Badge variant="neutral" className="font-mono text-[10px]">{selectedResource.type}</Badge>
                       <span className={`w-2 h-2 rounded-full ${selectedResource.status === 'RUNNING' || selectedResource.status === 'READY' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white break-words leading-tight">{selectedResource.name}</h3>
                   <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Globe className="w-3 h-3" /> {selectedResource.zone}
                   </div>
                </div>
                <button onClick={() => setSelection(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                   <X className="w-5 h-5 text-slate-500" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">State</div>
                      <div className={`text-lg font-bold flex items-center gap-2 ${selectedResource.status === 'RUNNING' || selectedResource.status === 'READY' ? 'text-emerald-500' : 'text-slate-500'}`}>
                         <Activity className="w-4 h-4" /> {selectedResource.status}
                      </div>
                   </div>
                   <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                         {selectedResource.type === 'BUCKET' ? 'Storage Class' : 'Machine Type'}
                      </div>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate" title={selectedResource.type === 'BUCKET' ? selectedResource.storageClass : selectedResource.machineType}>
                         {selectedResource.type === 'BUCKET' ? selectedResource.storageClass : (selectedResource.machineType || 'Standard')}
                      </div>
                   </div>
                </div>

                {/* Labels Section */}
                <div>
                   <h4 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-wider">
                      <Tag className="w-3 h-3" /> Metadata Labels
                   </h4>
                   {Object.keys(selectedResource.labels || {}).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                         {Object.entries(selectedResource.labels).map(([k,v]) => (
                            <span key={k} className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                               <span className="font-semibold mr-1">{k}:</span> {v}
                            </span>
                         ))}
                      </div>
                   ) : (
                      <div className="text-slate-400 italic text-sm">No labels assigned.</div>
                   )}
                </div>

                {/* Network Section (Conditional) */}
                {selectedResource.type !== 'BUCKET' && selectedResource.type !== 'DISK' && (
                   <div>
                      <h4 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-wider">
                         <NetworkIcon className="w-3 h-3" /> Network Interface
                      </h4>
                      {selectedResource.ips && selectedResource.ips.length > 0 ? selectedResource.ips.map((ip: any, i: number) => (
                         <div key={i} className="mb-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-sm">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                               <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                   <Box className="w-3 h-3 text-blue-500" /> VPC: {ip.network}
                               </span>
                            </div>
                            <div className="space-y-2 font-mono text-slate-500">
                               <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded">
                                   <span>Internal IP</span> 
                                   <span className="text-slate-800 dark:text-slate-200 select-all">{ip.internal}</span>
                               </div>
                               {ip.external && (
                                   <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                                       <span className="text-blue-700 dark:text-blue-300">Public IP</span> 
                                       <span className="text-blue-700 dark:text-blue-300 font-bold select-all">{ip.external}</span>
                                   </div>
                               )}
                            </div>
                         </div>
                      )) : (
                        <div className="text-slate-400 italic text-sm">No network interfaces attached.</div>
                      )}
                   </div>
                )}

                {selectedResource.disks && selectedResource.disks.length > 0 && (
                   <div>
                       <h4 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-wider">
                          <HardDrive className="w-3 h-3" /> Storage
                       </h4>
                       <div className="space-y-2">
                           {selectedResource.disks.map((disk: any, i: number) => (
                               <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
                                   <div className="flex items-center gap-2">
                                       <div className={`w-1.5 h-1.5 rounded-full ${disk.boot ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                       <span className="font-medium text-slate-700 dark:text-slate-300">{disk.deviceName}</span>
                                   </div>
                                   <div className="font-mono text-slate-500">{disk.sizeGb} GB</div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}
             </div>
             
             <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <Button className="w-full" variant="secondary" onClick={() => setSelection(null)}>
                    <ArrowRight className="w-4 h-4 mr-2" /> Close Details
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TopologyMap: React.FC<TopologyMapProps> = memo((props) => (
  <ReactFlowProvider>
    <TopologyMapInner {...props} />
  </ReactFlowProvider>
));

export default TopologyMap;
