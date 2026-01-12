
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { GceResource } from '../types';
import { LABEL_TEMPLATES } from '../constants';
import { 
  Server, HardDrive, Zap, Clock, Check, X, Pencil, Save, 
  Trash2, Plus, ArrowRight, Copy, History, 
  CheckSquare, Square, ChevronDown, ChevronRight,
  Cpu, Tag, Globe, Network, Fingerprint, Database,
  Image as ImageIcon, Camera, Cloud, GripVertical, AlertCircle, PlayCircle, StopCircle, Box
} from 'lucide-react';
import { Button, Input, Select, Badge, Tooltip, Spinner } from './DesignSystem';
import { validateKey, validateValue } from '../utils/validation';
import { RegionIcon } from './RegionIcon';
import { motion } from 'framer-motion';

interface ResourceRowProps {
  resource: GceResource;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdate: (id: string, labels: Record<string, string>) => void;
  onApply: (id: string, labels: Record<string, string>) => void;
  onRevert: (id: string) => void;
  onViewHistory: (r: GceResource) => void;
}

export const ResourceRow = React.memo(({ 
  resource, 
  isSelected, 
  onToggleSelect, 
  onUpdate, 
  onApply, 
  onRevert, 
  onViewHistory 
}: ResourceRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editForm, setEditForm] = useState<{key: string, value: string}[]>([]);
  const [copiedId, setCopiedId] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Derived State
  const isVM = resource.type === 'INSTANCE';
  const hasProposed = resource.proposedLabels && Object.keys(resource.proposedLabels).length > 0;
  const isFormValid = useMemo(() => editForm.every(l => !validateKey(l.key) && !validateValue(l.value)), [editForm]);
  const labelCount = Object.keys(resource.labels).length;
  const isCompliant = labelCount > 0;
  const hasHistory = resource.history && resource.history.length > 0;
  
  const hasPublicIp = resource.ips?.some(ip => !!ip.external);

  const timeAgo = useMemo(() => {
    const date = new Date(resource.creationTimestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    return "Just now";
  }, [resource.creationTimestamp]);

  // Handlers
  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditForm(Object.entries(resource.labels).map(([key, value]) => ({ key, value })));
    setIsExpanded(false);
  }, [resource.labels]);

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newLabels: Record<string, string> = {};
    editForm.forEach(({key, value}) => {
      if (key.trim()) newLabels[key.trim()] = value.trim();
    });
    onUpdate(resource.id, newLabels);
    setIsEditing(false);
  }, [editForm, resource.id, onUpdate]);

  const addTemplate = (templateString: string) => {
    if(!templateString) return;
    const [k, v] = templateString.split('::');
    const exists = editForm.some(i => i.key === k);
    if(exists) {
      setEditForm(prev => prev.map(i => i.key === k ? { ...i, value: v } : i));
    } else {
      setEditForm(prev => [...prev, { key: k, value: v }]);
    }
  };

  const copyId = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resource.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [resource.id]);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    const start = dragItem.current;
    const end = dragOverItem.current;

    if (start !== null && end !== null && start !== end) {
      const newItems = [...editForm];
      const draggedItemContent = newItems[start];
      newItems.splice(start, 1);
      newItems.splice(end, 0, draggedItemContent);
      setEditForm(newItems);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Icons & Colors
  const getIcon = () => {
      switch(resource.type) {
          case 'INSTANCE': return Server;
          case 'DISK': return HardDrive;
          case 'IMAGE': return ImageIcon;
          case 'SNAPSHOT': return Camera;
          case 'CLOUD_RUN': return Cloud;
          case 'CLOUD_SQL': return Database;
          case 'BUCKET': return Box;
          default: return Server;
      }
  };
  const Icon = getIcon();
  
  const getIconColorClass = () => {
      switch(resource.type) {
          case 'INSTANCE': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300';
          case 'DISK': return 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300';
          case 'IMAGE': return 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300';
          case 'SNAPSHOT': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300';
          case 'CLOUD_RUN': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300';
          case 'CLOUD_SQL': return 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300';
          case 'BUCKET': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300';
          default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      }
  };

  const getFullTypeName = () => {
      switch(resource.type) {
          case 'INSTANCE': return 'Virtual Machine Instance';
          case 'DISK': return 'Persistent Disk';
          case 'IMAGE': return 'Machine Image';
          case 'SNAPSHOT': return 'Disk Snapshot';
          case 'CLOUD_RUN': return 'Cloud Run Service';
          case 'CLOUD_SQL': return 'Cloud SQL Database Instance';
          case 'BUCKET': return 'Storage Bucket';
          default: return resource.type;
      }
  };

  const statusColor = resource.status === 'RUNNING' || resource.status === 'READY' || resource.status === 'RUNNABLE'
    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
    : resource.status === 'STOPPED' 
      ? 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
      : 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';

  return (
    <>
      <motion.tr 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        onClick={() => !isEditing && !resource.isUpdating && setIsExpanded(p => !p)}
        className={`
          group border-b border-slate-200 dark:border-slate-800/60 transition-all duration-200 relative
          ${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer'}
          ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30' : ''}
          ${isExpanded && !isEditing ? 'bg-slate-50/80 dark:bg-slate-800/40 shadow-inner' : ''}
          ${resource.isUpdating ? 'bg-slate-50/60 dark:bg-slate-900/60 pointer-events-none' : ''}
        `}
      >
        {/* Loading Overlay Progress Line */}
        {resource.isUpdating && (
           <motion.td 
             className="absolute bottom-0 left-0 h-[2px] bg-blue-500 z-10"
             initial={{ width: "0%" }}
             animate={{ width: "100%" }}
             transition={{ duration: 2, ease: "linear", repeat: Infinity }}
             style={{ padding: 0 }}
           />
        )}

        {/* 1. Selection Checkbox */}
        <td className="pl-6 pr-3 py-4 align-top" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onToggleSelect(resource.id)} 
            disabled={resource.isUpdating}
            className={`
              mt-1.5 p-1 rounded transition-colors
              ${resource.isUpdating ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}
              ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}
            `}
          >
            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </button>
        </td>

        {/* 2. Identity (Name, ID) */}
        <td className={`px-4 py-4 align-top ${resource.isUpdating ? 'opacity-60' : ''}`}>
          <div className="flex flex-col gap-1.5">
             <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm leading-tight max-w-[220px]" title={resource.name}>
                  {resource.name}
                </span>
                {/* Dynamically change expansion indicator */}
                {isExpanded 
                  ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" /> 
                  : <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                }
             </div>
             <div className="flex items-center gap-1.5">
                <code className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 max-w-[140px] truncate tabular-nums" title={resource.id}>
                   {resource.id}
                </code>
                <button onClick={copyId} className="text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                   {copiedId ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                </button>
             </div>
             {resource.url && (
                <a href={resource.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                   {resource.url.replace('https://', '')} <Globe className="w-2.5 h-2.5"/>
                </a>
             )}
          </div>
        </td>

        {/* 3. Infrastructure (Type, Zone) */}
        <td className={`px-4 py-4 align-top ${resource.isUpdating ? 'opacity-60' : ''}`}>
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <Tooltip content={getFullTypeName()}>
                    <div className={`p-1 rounded-md shrink-0 cursor-help ${getIconColorClass()}`}>
                       <Icon className="w-3.5 h-3.5" />
                    </div>
                 </Tooltip>
                 <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {resource.type === 'INSTANCE' ? 'VM Instance' : 
                     resource.type === 'CLOUD_SQL' ? 'Cloud SQL' : 
                     resource.type === 'BUCKET' ? 'Bucket' :
                     resource.type.replace('_', ' ')}
                 </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                 <RegionIcon zone={resource.zone} className="w-3.5 h-2.5 rounded-[1px] shadow-sm" />
                 <span className="font-mono text-[11px] tabular-nums">{resource.zone}</span>
              </div>
           </div>
        </td>

        {/* 4. Configuration (Specs) */}
        <td className={`px-4 py-4 align-top ${resource.isUpdating ? 'opacity-60' : ''}`}>
           <div className="space-y-1.5">
              {/* Primary Spec */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                 {isVM && (
                    <>
                       <Cpu className="w-3.5 h-3.5 text-slate-400" />
                       <span title="Machine Type" className="tabular-nums">{resource.machineType}</span>
                    </>
                 )}
                 {resource.type === 'CLOUD_SQL' && (
                    <>
                       <Database className="w-3.5 h-3.5 text-slate-400" />
                       <span title="DB Version">{resource.databaseVersion?.split('_')[1]}</span>
                    </>
                 )}
                 {resource.sizeGb && (
                    <>
                       <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                       <span className="tabular-nums">{resource.sizeGb} GB</span>
                    </>
                 )}
                 {resource.type === 'CLOUD_RUN' && (
                    <>
                       <Zap className="w-3.5 h-3.5 text-slate-400" />
                       <span>Serverless</span>
                    </>
                 )}
                 {resource.type === 'BUCKET' && (
                    <>
                       <Box className="w-3.5 h-3.5 text-slate-400" />
                       <span title="Storage Class">{resource.storageClass}</span>
                       {resource.sizeGb && (
                          <>
                             <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
                             <span className="tabular-nums">{resource.sizeGb} GB</span>
                          </>
                       )}
                    </>
                 )}
              </div>

              {/* Secondary Spec (Network/Storage detail) */}
              <div className="flex flex-wrap gap-2">
                 {hasPublicIp && (
                    <Tooltip content="Exposed to Public Internet">
                       <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Globe className="w-2.5 h-2.5" /> Public
                       </span>
                    </Tooltip>
                 )}
                 {resource.disks && resource.disks.length > 1 && (
                    <Tooltip content={`${resource.disks.length} Attached Disks`}>
                       <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 tabular-nums">
                          <HardDrive className="w-2.5 h-2.5" /> {resource.disks.length}
                       </span>
                    </Tooltip>
                 )}
              </div>
           </div>
        </td>

        {/* 5. State & Lifecycle */}
        <td className={`px-4 py-4 align-top ${resource.isUpdating ? 'opacity-60' : ''}`}>
           <div className="flex flex-col gap-2">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold w-fit ${statusColor}`}>
                 {resource.status === 'RUNNING' || resource.status === 'READY' ? <PlayCircle className="w-3 h-3" /> : 
                  resource.status === 'STOPPED' ? <StopCircle className="w-3 h-3" /> : 
                  <AlertCircle className="w-3 h-3" />}
                 {resource.status}
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                 <Clock className="w-3 h-3" />
                 <span className="tabular-nums">{timeAgo}</span>
              </div>

              {/* Provisioning */}
              {resource.provisioningModel !== 'STANDARD' && (
                 <div>
                    {resource.provisioningModel === 'SPOT' && <Badge variant="purple" className="py-0 px-1.5 text-[10px]">Spot</Badge>}
                    {resource.provisioningModel === 'RESERVED' && <Badge variant="success" className="py-0 px-1.5 text-[10px]">Reserved</Badge>}
                 </div>
              )}
           </div>
        </td>

        {/* 6. Governance (Labels) */}
        <td className="px-4 py-4 align-top" onClick={(e) => isEditing && e.stopPropagation()}>
           {isEditing ? (
             <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl p-4 min-w-[340px] z-20 relative animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                   <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                     <Tag className="w-3 h-3" /> Manage Labels
                   </h4>
                   <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4"/></button>
                </div>
                
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                   {editForm.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex gap-2 items-center group/item transition-transform duration-200 ease-out"
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                         <div className="cursor-move text-slate-300 hover:text-slate-500">
                            <GripVertical className="w-3.5 h-3.5" />
                         </div>
                         <Input 
                            value={item.key} 
                            placeholder="Key" 
                            className="h-8 text-xs py-1 font-mono"
                            onChange={e => { const n = [...editForm]; n[idx].key = e.target.value; setEditForm(n); }}
                            error={validateKey(item.key) || undefined}
                         />
                         <span className="text-slate-300">:</span>
                         <Input 
                            value={item.value} 
                            placeholder="Value" 
                            className="h-8 text-xs py-1 font-mono"
                            onChange={e => { const n = [...editForm]; n[idx].value = e.target.value; setEditForm(n); }}
                            error={validateValue(item.value) || undefined}
                         />
                         <button 
                            onClick={() => setEditForm(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                         >
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   ))}
                   {editForm.length === 0 && <div className="text-xs text-slate-400 italic text-center py-2">No labels assigned</div>}
                </div>
                
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-2">
                   <div className="flex gap-2">
                      <Button size="xs" variant="ghost" onClick={() => setEditForm(p => [...p, {key:'', value:''}])} leftIcon={<Plus className="w-3 h-3" />}>Add</Button>
                      <Select className="h-7 text-xs py-1 w-28" onChange={(e) => { addTemplate(e.target.value); e.target.value=""; }}>
                         <option value="">Templates...</option>
                         {LABEL_TEMPLATES.map((t, i) => <option key={i} value={`${t.key}::${t.value}`}>{t.label}</option>)}
                      </Select>
                   </div>
                   <Button size="xs" variant="primary" disabled={!isFormValid} onClick={handleSave} leftIcon={<Save className="w-3 h-3" />}>Save</Button>
                </div>
             </div>
           ) : (
             <div className={`space-y-2 ${resource.isUpdating ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap gap-1.5 content-start">
                   {Object.entries(resource.labels).slice(0, 4).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 max-w-[140px] truncate" title={`${k}: ${v}`}>
                         <span className="opacity-60 mr-1">{k}:</span> {v}
                      </span>
                   ))}
                   {Object.keys(resource.labels).length > 4 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">+{Object.keys(resource.labels).length - 4} more</span>
                   )}
                   {!isCompliant && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                         <X className="w-3 h-3" /> Unlabeled
                      </span>
                   )}
                </div>

                {hasProposed && (
                   <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 animate-in slide-in-from-left-2 duration-300">
                      <div className="w-full text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                         <Zap className="w-3 h-3" /> AI Suggestion
                      </div>
                      {Object.entries(resource.proposedLabels || {}).map(([k, v]) => {
                          const isNew = resource.labels[k] === undefined;
                          return (
                              <Badge key={k} variant={isNew ? 'success' : 'warning'} className="max-w-full truncate text-[10px] px-1.5 py-0.5 border-dashed">
                                  {isNew ? <Plus className="w-2.5 h-2.5 mr-1" /> : <ArrowRight className="w-2.5 h-2.5 mr-1" />}
                                  {k}:{v}
                              </Badge>
                          )
                      })}
                   </div>
                )}
             </div>
           )}
        </td>

        {/* 7. Actions */}
        <td className="pr-6 pl-4 py-4 align-top text-right w-[120px]">
           <div className="flex items-center justify-end gap-1 min-h-[32px]">
              {resource.isUpdating ? (
                 <div className="flex items-center gap-2 text-slate-400 animate-in fade-in">
                    <span className="text-[10px] font-medium uppercase tracking-wide">Processing</span>
                    <Spinner className="w-3.5 h-3.5 text-blue-500" />
                 </div>
              ) : (
                 !isEditing && (
                    <>
                        {hasProposed ? (
                           <div className="flex items-center gap-1">
                             <Button 
                                size="xs" 
                                variant="success" 
                                onClick={(e) => { e.stopPropagation(); onApply(resource.id, resource.proposedLabels!); }} 
                                className="h-8 px-2" 
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Apply
                              </Button>
                             <Button 
                                size="xs" 
                                variant="danger" 
                                onClick={(e) => { e.stopPropagation(); onRevert(resource.id); }} 
                                className="h-8 px-2"
                                leftIcon={<X className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                           </div>
                        ) : (
                           <>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); onViewHistory(resource); }}
                                 className={`
                                   p-2 rounded-lg transition-colors relative
                                   ${hasHistory 
                                     ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20' 
                                     : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'}
                                 `}
                                 title={hasHistory ? `${resource.history?.length} history entries` : 'View Audit History'}
                              >
                                 <History className="w-4 h-4" />
                                 {hasHistory && (
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white dark:border-slate-900"></span>
                                 )}
                              </button>
                              <button 
                                 onClick={startEditing} 
                                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                 title="Edit Labels"
                              >
                                 <Pencil className="w-4 h-4" />
                              </button>
                           </>
                        )}
                    </>
                 )
              )}
           </div>
        </td>
      </motion.tr>

      {/* Expanded Details Panel - Conditionally Rendered */}
      {isExpanded && !isEditing && (
        <tr className="bg-slate-50/50 dark:bg-slate-900/20 animate-in fade-in duration-200">
          <td colSpan={7} className="p-0">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 mx-6 mb-6 mt-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/50 shadow-sm">
                
                {/* Column 1: Core IDs & Fingerprint */}
                <div className="space-y-4">
                   <div>
                     <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                        <Fingerprint className="w-3 h-3"/> Identity & Security
                     </div>
                     <div className="space-y-2">
                        <div className="group relative">
                          <label className="text-[10px] text-slate-500 block">Resource ID</label>
                          <div className="flex items-center gap-2">
                             <code className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 break-all tabular-nums">
                                {resource.id}
                             </code>
                             <button onClick={copyId} className="text-slate-400 hover:text-blue-500 transition-colors">
                                {copiedId ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                             </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label Fingerprint</label>
                          <code className="text-[10px] font-mono text-slate-500 truncate block tabular-nums" title={resource.labelFingerprint}>
                            {resource.labelFingerprint}
                          </code>
                        </div>
                        {resource.url && (
                           <div>
                              <label className="text-[10px] text-slate-500 block">Service URL</label>
                              <a href={resource.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                {resource.url} <Globe className="w-3 h-3"/>
                              </a>
                           </div>
                        )}
                     </div>
                   </div>
                </div>
                
                {/* Column 2: Provisioning & Lifecycle */}
                <div className="space-y-4">
                   <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3"/> Lifecycle & Cost
                   </div>
                   <div className="space-y-2">
                     <div>
                        <label className="text-[10px] text-slate-500 block">Created At</label>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                           {new Date(resource.creationTimestamp).toLocaleDateString()}
                           <span className="text-slate-400 font-normal ml-1">{new Date(resource.creationTimestamp).toLocaleTimeString()}</span>
                        </div>
                     </div>
                     {isVM && (
                         <div>
                            <label className="text-[10px] text-slate-500 block">Provisioning Model</label>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               {resource.provisioningModel === 'SPOT' ? (
                                 <Badge variant="purple" className="py-0">Spot Instance</Badge>
                               ) : resource.provisioningModel === 'RESERVED' ? (
                                 <Badge variant="success" className="py-0">Reserved</Badge>
                               ) : (
                                 <Badge variant="neutral" className="py-0">On-Demand</Badge>
                               )}
                            </div>
                         </div>
                     )}
                   </div>
                </div>

                {/* Column 3: Network (IPs) */}
                <div className="space-y-4">
                   <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                      <Network className="w-3 h-3"/> Network Interfaces
                   </div>
                   {resource.ips && resource.ips.length > 0 ? (
                      <div className="space-y-2">
                         {resource.ips.map((ip, i) => (
                           <div key={i} className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{ip.network}</span>
                                {ip.external && <Globe className="w-3 h-3 text-blue-500" />}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                                 <div>Int: {ip.internal}</div>
                                 {ip.external && <div className="text-blue-600 dark:text-blue-400">Ext: {ip.external}</div>}
                              </div>
                           </div>
                         ))}
                      </div>
                   ) : (
                      <div className="text-xs text-slate-400 italic">No network interfaces detected.</div>
                   )}
                </div>

                {/* Column 4: Storage (Disks) */}
                <div className="space-y-4">
                   <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                      <Database className="w-3 h-3"/> Storage & DB
                   </div>
                   {resource.type === 'CLOUD_SQL' ? (
                      <div className="space-y-2">
                         <div className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Database Engine</span>
                            <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">{resource.databaseVersion}</div>
                         </div>
                         <div className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Machine Tier</span>
                            <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">{resource.machineType}</div>
                         </div>
                      </div>
                   ) : resource.type === 'BUCKET' ? (
                      <div className="space-y-2">
                          <div className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                             <span className="font-semibold text-slate-700 dark:text-slate-300">Storage Class</span>
                             <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">{resource.storageClass}</div>
                          </div>
                          {resource.sizeGb && (
                              <div className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                 <span className="font-semibold text-slate-700 dark:text-slate-300">Total Size</span>
                                 <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">{resource.sizeGb} GB</div>
                              </div>
                          )}
                      </div>
                   ) : resource.disks && resource.disks.length > 0 ? (
                      <div className="space-y-2">
                         {resource.disks.map((d, i) => (
                           <div key={i} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                              <div className="flex flex-col">
                                 <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={d.deviceName}>
                                   {d.deviceName}
                                 </span>
                                 <span className="text-[10px] text-slate-500">{d.type}</span>
                              </div>
                              <div className="text-right">
                                 <div className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">{d.sizeGb} GB</div>
                                 {d.boot && <Badge variant="info" className="py-0 px-1 text-[9px]">Boot</Badge>}
                              </div>
                           </div>
                         ))}
                      </div>
                   ) : resource.sizeGb ? (
                       <div className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Standalone Disk</span>
                          <div className="font-mono font-bold mt-1 tabular-nums">{resource.sizeGb} GB</div>
                       </div>
                   ) : (
                      <div className="text-xs text-slate-400 italic">No storage details available.</div>
                   )}
                </div>
             </div>
          </td>
        </tr>
      )}
    </>
  );
});
