
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GceResource, FilterConfig } from '../types';
import { 
  CheckSquare, Square, Search, FilterX, ChevronDown, ChevronUp, ChevronRight, Layers, Tag
} from 'lucide-react';
import { Button, Card } from './DesignSystem';
import { ResourceRow } from './ResourceRow';
import { ResourceFilters, BulkActionBar, PaginationControl, AuditHistoryModal } from './TableControls';
import { LabelingStudio } from './LabelingStudio';
import { useResourceFilter, calculateFacetedCounts } from '../hooks/useResourceFilter';
import { TableRowSkeleton } from './Skeletons';

interface ResourceTableProps {
  resources: GceResource[];
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  onSaveView: (name: string) => void;
  onApplyLabels: (id: string, labels: Record<string, string>) => void;
  onUpdateLabels: (id: string, labels: Record<string, string>) => void;
  onRevert: (id: string) => void;
  onBulkUpdateLabels?: (updates: Map<string, Record<string, string>>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Helper type for display items (either a group header or a resource row)
type DisplayItem = 
  | { type: 'header'; key: string; label: string; count: number; isCollapsed: boolean }
  | { type: 'resource'; data: GceResource };

const ResourceTable: React.FC<ResourceTableProps> = React.memo(({ 
  resources, 
  filterConfig,
  onFilterChange,
  onSaveView,
  onApplyLabels, 
  onUpdateLabels, 
  onRevert, 
  onBulkUpdateLabels,
  onRefresh,
  isLoading
}) => {
  // --- Hooks & State ---
  const { 
    filteredResources, 
    paginatedResources: defaultPaginated, 
    totalPages: defaultTotalPages, 
    itemsPerPage, 
    currentPage: defaultCurrentPage, 
    startIndex: defaultStartIndex, 
    availableZones, 
    availableMachineTypes,
    setCurrentPage, 
    handleItemsPerPageChange 
  } = useResourceFilter(resources, filterConfig);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [historyResource, setHistoryResource] = useState<GceResource | null>(null);
  const [isLabelingStudioOpen, setIsLabelingStudioOpen] = useState(false);
  
  // Grouping State
  const [groupByLabel, setGroupByLabel] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Derive available labels for Group By dropdown
  const availableLabelKeys = useMemo(() => {
    const keys = new Set<string>();
    resources.forEach(r => Object.keys(r.labels).forEach(k => keys.add(k)));
    return Array.from(keys).sort();
  }, [resources]);

  // --- Optimized Faceted Counts ---
  const counts = useMemo(() => {
    return calculateFacetedCounts(resources, filterConfig);
  }, [resources, filterConfig]);

  // --- Grouping Logic ---
  const displayItems = useMemo<DisplayItem[]>(() => {
    if (!groupByLabel) return filteredResources.map(r => ({ type: 'resource', data: r }));

    const groups = new Map<string, GceResource[]>();
    const noLabelKey = 'Unassigned';

    // 1. Group
    filteredResources.forEach(r => {
      const val = r.labels[groupByLabel] || noLabelKey;
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(r);
    });

    // 2. Sort Groups
    const sortedKeys = Array.from(groups.keys()).sort();

    // 3. Flatten
    const items: DisplayItem[] = [];
    sortedKeys.forEach(key => {
        const groupResources = groups.get(key)!;
        const isCollapsed = collapsedGroups.has(key);
        
        // Add Header
        items.push({ 
            type: 'header', 
            key, 
            label: key, 
            count: groupResources.length,
            isCollapsed
        });

        // Add Items if not collapsed
        if (!isCollapsed) {
            groupResources.forEach(r => items.push({ type: 'resource', data: r }));
        }
    });

    return items;
  }, [filteredResources, groupByLabel, collapsedGroups]);

  // --- Pagination Logic (Override hook if grouped) ---
  const totalItems = displayItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  // Ensure current page is valid when grouping changes
  useEffect(() => {
      if (defaultCurrentPage > totalPages && totalPages > 0) {
          setCurrentPage(1);
      }
  }, [totalPages, defaultCurrentPage, setCurrentPage]);

  const startIndex = (defaultCurrentPage - 1) * itemsPerPage;
  const paginatedDisplayItems = useMemo(() => 
      displayItems.slice(startIndex, startIndex + itemsPerPage), 
  [displayItems, startIndex, itemsPerPage]);

  const toggleGroupCollapse = (groupKey: string) => {
      setCollapsedGroups(prev => {
          const next = new Set(prev);
          if (next.has(groupKey)) next.delete(groupKey);
          else next.add(groupKey);
          return next;
      });
  };

  // --- Handlers ---
  const toggleSelectAll = useCallback(() => {
     setSelectedIds(prev => {
        if (prev.size > 0 && prev.size === filteredResources.length) {
            return new Set();
        }
        return new Set(filteredResources.map(r => r.id));
     });
  }, [filteredResources]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if(next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const executeBulkStudioUpdates = useCallback((updates: Map<string, Record<string, string>>) => {
    if (!onBulkUpdateLabels) return;
    onBulkUpdateLabels(updates);
    setSelectedIds(new Set());
  }, [onBulkUpdateLabels]);

  const downloadCSV = useCallback(() => {
    const header = ['ID', 'Name', 'Type', 'Provisioning', 'Status', 'Zone', 'Labels'];
    const rows = filteredResources.map(r => [
        r.id, 
        r.name, 
        r.type, 
        r.provisioningModel, 
        r.status, 
        r.zone, 
        Object.entries(r.labels).map(([k,v]) => `${k}:${v}`).join(';')
    ]);
    
    const csvContent = [header, ...rows]
        .map(e => e.join(","))
        .join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csvContent);
    link.download = `gcp_inventory_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  }, [filteredResources]);

  const renderEmptyState = () => {
     if (isLoading) return null;
     if (resources.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 w-full">
             <div className="bg-white dark:bg-slate-900/50 p-6 rounded-full mb-4 border border-slate-300 dark:border-slate-800 shadow-xl">
                <Search className="w-10 h-10 opacity-50" />
             </div>
             <h3 className="text-xl font-medium text-slate-700 dark:text-slate-400">No resources discovered</h3>
             <p className="max-w-xs text-center mt-2 text-sm text-slate-500">Connect to a project to view resources or check your API permissions.</p>
          </div>
        );
     }
     return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 animate-in fade-in w-full">
           <div className="bg-white dark:bg-slate-900/50 p-6 rounded-full mb-4 border border-slate-300 dark:border-slate-800 shadow-xl">
              <FilterX className="w-10 h-10 opacity-50" />
           </div>
           <h3 className="text-xl font-medium text-slate-700 dark:text-slate-400">No matching resources</h3>
           <p className="max-w-xs text-center mt-2 text-sm text-slate-500">Try adjusting your filters or search terms.</p>
           <Button variant="ghost" size="sm" className="mt-4" onClick={() => onFilterChange({ search: '', statuses: [], types: [], zones: [], machineTypes: [], hasPublicIp: null, dateStart: '', dateEnd: '', labelLogic: 'AND', labels: [], showUnlabeledOnly: false })}>
              Clear all filters
           </Button>
        </div>
     );
  };

  const selectedResourcesList = useMemo(() => 
    resources.filter(r => selectedIds.has(r.id)), 
  [resources, selectedIds]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (filterConfig.sortKey === key && filterConfig.sortDirection === 'asc') {
      direction = 'desc';
    }
    onFilterChange({ ...filterConfig, sortKey: key, sortDirection: direction });
  };

  const SortHeader = ({ label, sortKey, width }: { label: string, sortKey: string, width?: string }) => (
    <th 
      className={`px-4 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none ${width || ''}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <div className="flex flex-col">
           {filterConfig.sortKey === sortKey ? (
              filterConfig.sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />
           ) : (
              <div className="w-3 h-3" /> 
           )}
        </div>
      </div>
    </th>
  );

  return (
    <Card className="flex flex-col border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm shadow-xl relative h-auto">
       
       <ResourceFilters 
          config={filterConfig} 
          onChange={onFilterChange} 
          show={showFilters} 
          onDownload={downloadCSV}
          onToggleShow={() => setShowFilters(!showFilters)}
          onSaveView={onSaveView}
          availableZones={availableZones}
          availableMachineTypes={availableMachineTypes}
          availableLabelKeys={availableLabelKeys}
          groupBy={groupByLabel}
          onGroupByChange={setGroupByLabel}
          counts={counts}
          onRefresh={onRefresh}
          isRefreshing={isLoading}
       />

       <BulkActionBar 
         count={selectedIds.size} 
         onOpenStudio={() => setIsLabelingStudioOpen(true)}
         onClear={() => setSelectedIds(new Set())}
       />

       <LabelingStudio 
          isOpen={isLabelingStudioOpen}
          onClose={() => setIsLabelingStudioOpen(false)}
          selectedResources={selectedResourcesList}
          onApply={executeBulkStudioUpdates}
       />

       {/* Main Table Area */}
       <div className="bg-white/40 dark:bg-slate-900/40 relative min-h-[400px]">
          <table className="w-full text-left text-sm border-collapse">
             <thead className="sticky top-[73px] z-10">
               <tr className="bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider backdrop-blur-md shadow-sm">
                 <th className="pl-6 pr-3 py-4 w-12">
                    <button onClick={toggleSelectAll} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center">
                      {selectedIds.size > 0 && selectedIds.size === filteredResources.length ? <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-500"/> : <Square className="w-5 h-5"/>}
                    </button>
                 </th>
                 <SortHeader label="Identity" sortKey="name" width="w-[260px]" />
                 <SortHeader label="Infrastructure" sortKey="type" width="w-[160px]" />
                 <SortHeader label="Spec / Config" sortKey="machineType" width="w-[180px]" />
                 <SortHeader label="State & Lifecycle" sortKey="status" width="w-[160px]" />
                 <SortHeader label="Governance" sortKey="labels" />
                 <th className="pr-6 pl-4 py-4 text-right w-[100px]"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
               {isLoading && Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)}
               
               {!isLoading && paginatedDisplayItems.map((item, idx) => {
                 if (item.type === 'header') {
                    return (
                        <tr key={`group-${item.key}`} className="bg-slate-100 dark:bg-slate-900/80 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" onClick={() => toggleGroupCollapse(item.key)}>
                            <td colSpan={7} className="px-6 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    {item.isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{groupByLabel}: <span className="text-blue-600 dark:text-blue-400">{item.label}</span></span>
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-500">{item.count} items</span>
                                </div>
                            </td>
                        </tr>
                    );
                 }
                 const r = item.data;
                 return (
                   <ResourceRow 
                     key={r.id} 
                     resource={r} 
                     isSelected={selectedIds.has(r.id)}
                     onToggleSelect={toggleSelect}
                     onUpdate={onUpdateLabels}
                     onApply={onApplyLabels}
                     onRevert={onRevert}
                     onViewHistory={setHistoryResource}
                   />
                 );
               })}
             </tbody>
          </table>
          {!isLoading && filteredResources.length === 0 && renderEmptyState()}
       </div>

       {filteredResources.length > 0 && !isLoading && (
         <div className="shrink-0">
            <PaginationControl 
                currentPage={defaultCurrentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems} // Use display items count if grouped
                startIndex={startIndex}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
         </div>
       )}

       <AuditHistoryModal 
         resource={historyResource} 
         onClose={() => setHistoryResource(null)} 
       />
    </Card>
  );
});

export default ResourceTable;
