
import { useState, useMemo, useEffect } from 'react';
import { GceResource, FilterConfig } from '../types';

/**
 * Highly optimized filter function using imperative loops for performance on large datasets.
 * Returns true if resource matches criteria.
 */
const matchesFilter = (r: GceResource, config: FilterConfig, ignoreKey?: keyof FilterConfig): boolean => {
  // 1. Text Search (Most expensive, check first if exists to fail fast)
  if (config.search) {
      const searchLower = config.search.toLowerCase();
      const matchesName = r.name.toLowerCase().includes(searchLower);
      const matchesId = r.id.toLowerCase().includes(searchLower);
      
      // Optimization: Only check inner objects if name/id don't match
      if (!matchesName && !matchesId) {
         const matchesZone = r.zone.toLowerCase().includes(searchLower);
         const matchesLabel = !matchesZone && Object.values(r.labels).some(v => (v as string).toLowerCase().includes(searchLower));
         if (!matchesZone && !matchesLabel) return false;
      }
  }

  // 2. Status
  if (ignoreKey !== 'statuses' && config.statuses.length > 0) {
      if (!config.statuses.includes(r.status)) return false;
  }

  // 3. Type
  if (ignoreKey !== 'types' && config.types.length > 0) {
      if (!config.types.includes(r.type)) return false;
  }

  // 4. Zones
  if (ignoreKey !== 'zones' && config.zones.length > 0) {
      if (!config.zones.includes(r.zone)) return false;
  }

  // 5. Machine Types (Only for instances and SQL)
  if (ignoreKey !== 'machineTypes' && config.machineTypes.length > 0) {
    if ((r.type !== 'INSTANCE' && r.type !== 'CLOUD_SQL') || !r.machineType || !config.machineTypes.includes(r.machineType)) return false;
  }

  // 6. Public IP
  if (ignoreKey !== 'hasPublicIp' && config.hasPublicIp !== null) {
      const hasExternal = r.ips?.some(ip => !!ip.external) || false;
      if (config.hasPublicIp && !hasExternal) return false;
      if (!config.hasPublicIp && hasExternal) return false;
  }

  // 7. Date Range
  if (config.dateStart && new Date(r.creationTimestamp) < new Date(config.dateStart)) return false;
  if (config.dateEnd) {
    const end = new Date(config.dateEnd);
    end.setHours(23, 59, 59);
    if (new Date(r.creationTimestamp) > end) return false;
  }

  // 8. Unlabeled Toggle
  if (config.showUnlabeledOnly) {
      if (Object.keys(r.labels).length > 0) return false;
  }

  // 9. Advanced Label Logic
  if (config.labels.length > 0) {
    if (config.labelLogic === 'AND') {
        for (const l of config.labels) {
            if (!l.value) {
                if (r.labels[l.key] === undefined) return false;
            } else {
                if (r.labels[l.key] !== l.value) return false;
            }
        }
    } else {
        // OR Logic
        let someMatch = false;
        for (const l of config.labels) {
            if ((!l.value && r.labels[l.key] !== undefined) || (l.value && r.labels[l.key] === l.value)) {
                someMatch = true;
                break;
            }
        }
        if (!someMatch) return false;
    }
  }

  return true;
};

export const filterResources = (resources: GceResource[], config: FilterConfig, ignoreKey?: keyof FilterConfig) => {
    const result = [];
    for (let i = 0; i < resources.length; i++) {
        if (matchesFilter(resources[i], config, ignoreKey)) {
            result.push(resources[i]);
        }
    }

    // Sort if configured
    if (config.sortKey && config.sortDirection) {
        result.sort((a, b) => {
            let valA: any = a[config.sortKey as keyof GceResource];
            let valB: any = b[config.sortKey as keyof GceResource];

            // Handle special cases
            if (config.sortKey === 'labels') {
                valA = Object.keys(a.labels).length;
                valB = Object.keys(b.labels).length;
            } else if (config.sortKey === 'ips') {
                valA = a.ips?.[0]?.internal || '';
                valB = b.ips?.[0]?.internal || '';
            } else if (config.sortKey === 'disks') {
                valA = a.disks?.length || 0;
                valB = b.disks?.length || 0;
            }

            // Handle null/undefined
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            // String comparison case-insensitive
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return config.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return config.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
};

/**
 * Calculates faceted counts in a single pass O(N) instead of O(4N).
 */
export const calculateFacetedCounts = (resources: GceResource[], config: FilterConfig) => {
    const counts = {
        statuses: {} as Record<string, number>,
        types: {} as Record<string, number>,
        zones: {} as Record<string, number>,
        machineTypes: {} as Record<string, number>
    };

    for (const r of resources) {
        // We check "Does this resource match the filter IF we ignore the specific key?"
        // This allows us to show "If you select this status, you get X results" context.
        
        if (matchesFilter(r, config, 'statuses')) {
            counts.statuses[r.status] = (counts.statuses[r.status] || 0) + 1;
        }
        if (matchesFilter(r, config, 'types')) {
            counts.types[r.type] = (counts.types[r.type] || 0) + 1;
        }
        if (matchesFilter(r, config, 'zones')) {
            counts.zones[r.zone] = (counts.zones[r.zone] || 0) + 1;
        }
        if (matchesFilter(r, config, 'machineTypes') && r.machineType) {
            counts.machineTypes[r.machineType] = (counts.machineTypes[r.machineType] || 0) + 1;
        }
    }

    return counts;
};

export const useResourceFilter = (resources: GceResource[], filterConfig: FilterConfig) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('gcp_inventory_rows');
        return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });

  const availableZones = useMemo(() => Array.from(new Set(resources.map(r => r.zone))).sort(), [resources]);
  const availableMachineTypes = useMemo(() => Array.from(new Set(resources.filter(r => r.machineType).map(r => r.machineType!))).sort(), [resources]);

  const filteredResources = useMemo(() => filterResources(resources, filterConfig), [resources, filterConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterConfig, resources.length]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResources = useMemo(() => filteredResources.slice(startIndex, startIndex + itemsPerPage), [filteredResources, startIndex, itemsPerPage]);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    setItemsPerPage(val);
    setCurrentPage(1);
    localStorage.setItem('gcp_inventory_rows', val.toString());
  };

  return {
      filteredResources,
      paginatedResources,
      totalPages,
      itemsPerPage,
      currentPage,
      startIndex,
      availableZones,
      availableMachineTypes,
      setCurrentPage,
      handleItemsPerPageChange
  };
};
