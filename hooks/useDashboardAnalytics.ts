
import { useMemo } from 'react';
import { GceResource } from '../types';

export const useDashboardAnalytics = (resources: GceResource[], stats: { total: number; labeled: number; unlabeled: number }) => {
  return useMemo(() => {
    const complianceRate = stats.total > 0 ? Math.round((stats.labeled / stats.total) * 100) : 100;
    
    // Resource Counts
    const vmCount = resources.filter(r => r.type === 'INSTANCE').length;
    const diskCount = resources.filter(r => r.type === 'DISK').length;
    const bucketCount = resources.filter(r => r.type === 'BUCKET').length;
    const imageCount = resources.filter(r => r.type === 'IMAGE').length;
    const snapshotCount = resources.filter(r => r.type === 'SNAPSHOT').length;
    const cloudRunCount = resources.filter(r => r.type === 'CLOUD_RUN').length;
    const sqlCount = resources.filter(r => r.type === 'CLOUD_SQL').length;
    
    // Risks
    const stoppedInstances = resources.filter(r => r.type === 'INSTANCE' && r.status === 'STOPPED');
    
    // Network Exposure (Valid Data replacement for Mock Cost)
    const publicIpCount = resources.filter(r => r.ips?.some(ip => !!ip.external) || r.type === 'CLOUD_RUN').length;

    // Provisioning Mix (VM Only)
    const vmResources = resources.filter(r => r.type === 'INSTANCE');
    const vmTotal = vmResources.length;
    const spotCount = vmResources.filter(r => r.provisioningModel === 'SPOT').length;
    const reservedCount = vmResources.filter(r => r.provisioningModel === 'RESERVED').length;
    const onDemandCount = vmTotal - spotCount - reservedCount;

    // Top Machine Types
    const machineTypes: Record<string, number> = {};
    resources.filter(r => r.machineType).forEach(r => {
        machineTypes[r.machineType!] = (machineTypes[r.machineType!] || 0) + 1;
    });
    const topMachineTypes = Object.entries(machineTypes)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3);

    // Zone Distribution
    const zones: Record<string, number> = {};
    resources.forEach(r => zones[r.zone] = (zones[r.zone] || 0) + 1);
    const topZones = Object.entries(zones).sort((a,b) => b[1] - a[1]).slice(0, 4);
    const maxZone = Math.max(...Object.values(zones), 1);

    // Label Usage Distribution
    const labelCounts: Record<string, number> = {};
    resources.forEach(r => {
        Object.keys(r.labels).forEach(key => {
            labelCounts[key] = (labelCounts[key] || 0) + 1;
        });
    });
    const labelDistribution = Object.entries(labelCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 labels
    
    const maxLabelCount = Math.max(...labelDistribution.map(l => l.value), 1);

    return {
        complianceRate,
        vmCount,
        diskCount,
        bucketCount,
        imageCount,
        snapshotCount,
        cloudRunCount,
        sqlCount,
        stoppedInstances,
        publicIpCount,
        spotCount,
        reservedCount,
        onDemandCount,
        topMachineTypes,
        topZones,
        maxZone,
        labelDistribution,
        maxLabelCount
    };
  }, [resources, stats]);
};
