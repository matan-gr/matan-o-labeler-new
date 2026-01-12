
import { useState, useCallback } from 'react';
import { LogEntry, GcpCredentials } from '../types';
import { fetchGcpAuditLogs } from '../services/gcpService';

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Add local log entry (Legacy placeholder kept for interface compatibility)
  const addAppLog = useCallback((message: string, level: string = 'INFO') => {
    // Intentionally empty. Application logs are now handled via Notifications or not stored.
  }, []);

  const refreshGcpLogs = useCallback(async (credentials: GcpCredentials) => {
    if (!credentials.accessToken || credentials.accessToken === 'demo-mode') return;

    setIsLoadingLogs(true);
    try {
        const fetched = await fetchGcpAuditLogs(credentials.projectId, credentials.accessToken);
        setLogs(fetched);
    } catch (e) {
        console.error("Failed to fetch logs", e);
    } finally {
        setIsLoadingLogs(false);
    }
  }, []);

  return {
    logs,
    addAppLog,
    refreshGcpLogs,
    isLoadingLogs,
    setLogs 
  };
};
