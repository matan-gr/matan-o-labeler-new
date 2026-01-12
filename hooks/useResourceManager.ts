
import { useState, useCallback, useMemo, useRef } from 'react';
import { GceResource, GcpCredentials, LabelHistoryEntry } from '../types';
import { fetchAllResources, updateResourceLabels as updateResourceLabelsApi } from '../services/gcpService';
import { analyzeResourceBatch, generateComplianceReport } from '../services/geminiService';
import { generateMockResources } from '../services/mockService';
import { persistenceService } from '../services/persistenceService';
import { batchNormalizeResources, NormalizationMap } from '../services/normalizationService';

export const useResourceManager = (
  addLog: (msg: string, level?: string) => void,
  addNotification: (msg: string, type?: 'success'|'error'|'info') => void
) => {
  const [resources, setResources] = useState<GceResource[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [report, setReport] = useState<string>('');
  
  // Keep credentials in ref to allow refresh without passing them around everywhere in UI components
  const currentCredentials = useRef<GcpCredentials | null>(null);

  // Stats derivation
  const stats = useMemo(() => {
    const total = resources.length;
    const labeled = resources.filter(r => Object.keys(r.labels).length > 0).length;
    return { total, labeled, unlabeled: total - labeled };
  }, [resources]);

  // Actions
  const connectProject = useCallback(async (credentials: GcpCredentials) => {
    setIsConnecting(true);
    addLog(`Connecting to GCP Project: ${credentials.projectId}...`);
    currentCredentials.current = credentials;
    
    try {
      // 1. Fetch live infrastructure
      const fetchedResources = await fetchAllResources(credentials.projectId, credentials.accessToken);
      
      // 2. Load secure persistent history from IndexedDB
      let historyMap: Record<string, LabelHistoryEntry[]> = {};
      try {
        historyMap = await persistenceService.getProjectHistory(credentials.projectId);
      } catch (dbError) {
        console.warn("Failed to load local history DB", dbError);
        addLog("Warning: Could not load audit history from local DB.", "WARNING");
      }
      
      const resourcesWithHistory = fetchedResources.map(r => ({
        ...r,
        history: historyMap[r.id] || []
      }));

      setResources(resourcesWithHistory);
      
      addLog('Authentication successful.', 'SUCCESS');
      addLog(`Discovered ${fetchedResources.length} resources.`, 'SUCCESS');
      addNotification(`Connected. Found ${fetchedResources.length} resources.`, 'success');
      return true;
    } catch (error: any) {
      // Enhanced Error Context for UX
      const rawMsg = error.message || 'Unknown error';
      let userMsg = rawMsg;
      let title = 'Connection Failed';

      // Parse common status codes from gcpService
      if (rawMsg.includes('403')) {
         title = 'Error 403: Access Denied';
         userMsg = 'Ensure your token has "Compute Viewer" permissions.';
      } else if (rawMsg.includes('401')) {
         title = 'Error 401: Unauthorized';
         userMsg = 'Your access token has expired. Please regenerate it.';
      } else if (rawMsg.includes('429')) {
         title = 'Error 429: Quota Exceeded';
         userMsg = 'Too many requests. Please wait a moment before retrying.';
      } else if (rawMsg.includes('404')) {
         title = 'Error 404: Not Found';
         userMsg = 'Project ID not found or API is not enabled.';
      }

      addLog(`Connection failed: ${rawMsg}`, 'ERROR');
      addNotification(`**${title}**: ${userMsg}`, 'error');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [addLog, addNotification]);

  const refreshResources = useCallback(async () => {
    if (!currentCredentials.current) return;
    return connectProject(currentCredentials.current);
  }, [connectProject]);

  const loadDemoData = useCallback(() => {
    setIsConnecting(true);
    addLog('Initializing Demo Environment...', 'INFO');
    currentCredentials.current = { projectId: 'demo-mode', accessToken: 'demo-mode' };
    
    setTimeout(() => {
      const demoResources = generateMockResources(45);
      setResources(demoResources);
      setIsConnecting(false);
      addLog('Demo environment loaded successfully.', 'SUCCESS');
      addNotification('Welcome to CloudGov AI Demo!', 'success');
    }, 1500);
    
    return true;
  }, [addLog, addNotification]);

  const analyzeResources = useCallback(async () => {
    try {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if(!hasKey) await window.aistudio.openSelectKey();
        }
    } catch (err) {
        console.warn("API Key check skipped:", err);
    }

    setIsAnalysing(true);
    addLog('Initiating Gemini AI analysis...', 'INFO');
    addNotification('AI Analysis started...', 'info');
    
    try {
      const unlabeled = resources.filter(r => Object.keys(r.labels).length === 0);
      
      if (unlabeled.length === 0) {
        addLog('No unlabeled resources found to analyze.', 'WARN');
        addNotification('All resources are already labeled.', 'success');
        return;
      }

      const results = await analyzeResourceBatch(unlabeled);
      
      const newResources = resources.map(res => {
        const match = results.find(r => r.resourceId === res.id);
        if (match) {
          return { ...res, proposedLabels: match.suggestedLabels };
        }
        return res;
      });

      setResources(newResources);
      addLog(`Analysis complete. Generated suggestions for ${results.length} resources.`, 'SUCCESS');
      addNotification(`Analysis complete. ${results.length} suggestions generated.`, 'success');
      
      const reportText = await generateComplianceReport(newResources);
      setReport(reportText);
      
    } catch (error) {
      addLog('Analysis failed. Check console.', 'ERROR');
      addNotification('AI Analysis failed.', 'error');
    } finally {
      setIsAnalysing(false);
    }
  }, [resources, addLog, addNotification]);

  const updateResourceLabels = useCallback(async (
    credentials: GcpCredentials, 
    resourceId: string, 
    newLabels: Record<string, string>,
    isProposal = false
  ) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    // Set updating state
    setResources(prev => prev.map(r => r.id === resourceId ? { ...r, isUpdating: true } : r));
    addLog(`${isProposal ? 'Applying proposal' : 'Updating labels'} for ${resource.name}...`, 'INFO');

    try {
      const finalLabels = { ...resource.labels, ...newLabels };
      
      // If we are in demo mode (fake token or no token), don't call real API
      if (credentials.accessToken !== 'demo-mode') {
        await updateResourceLabelsApi(credentials.projectId, credentials.accessToken, resource, finalLabels);
      } else {
        await new Promise(r => setTimeout(r, 800)); // Simulate network delay
      }

      // Create history entry
      const historyEntry: LabelHistoryEntry = {
        timestamp: new Date(),
        actor: 'User',
        changeType: isProposal ? 'APPLY_PROPOSAL' : 'UPDATE',
        previousLabels: resource.labels,
        newLabels: finalLabels
      };

      const newHistory = [historyEntry, ...(resource.history || [])];

      setResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          return {
            ...r,
            labels: finalLabels,
            proposedLabels: undefined,
            isDirty: true,
            history: newHistory,
            isUpdating: false
          };
        }
        return r;
      }));

      // Persist history asynchronously
      persistenceService.saveHistory(credentials.projectId, resourceId, newHistory).catch(err => {
        console.error("Failed to persist history to DB", err);
      });

      addLog(`Successfully updated ${resource.name}`, 'SUCCESS');
      addNotification(`Updated ${resource.name}`, 'success');
    } catch (error: any) {
      setResources(prev => prev.map(r => r.id === resourceId ? { ...r, isUpdating: false } : r));
      addLog(`Failed to update labels: ${error.message}`, 'ERROR');
      addNotification(`Update failed: ${error.message}`, 'error');
    }
  }, [resources, addLog, addNotification]);

  // OPTIMIZED BULK UPDATE
  const bulkUpdateLabels = useCallback(async (
    credentials: GcpCredentials,
    updates: Map<string, Record<string, string>>
  ) => {
     const idsToUpdate = Array.from(updates.keys());
     const count = idsToUpdate.length;
     addLog(`Starting batch update for ${count} resources...`, 'INFO');
     addNotification(`Processing ${count} resources. Please wait...`, 'info');

     // 1. Optimistic State Update: Mark all target resources as updating (Single Render)
     setResources(prev => prev.map(r => {
       if (updates.has(r.id)) {
         return { ...r, isUpdating: true };
       }
       return r;
     }));

     // 2. Process in Chunks (Concurrency Control)
     // GCP Quota safe limit ~10-20 parallel requests for standard projects
     const BATCH_SIZE = 10; 
     let successCount = 0;
     let failedCount = 0;
     const processedResults: Map<string, { success: boolean, newHistory?: LabelHistoryEntry[], finalLabels?: Record<string, string> }> = new Map();
     
     // We will collect history updates to save them in one DB transaction at the end
     const historyUpdates = new Map<string, LabelHistoryEntry[]>();

     // Helper to process a single item
     const processItem = async (id: string) => {
        const resource = resources.find(r => r.id === id);
        if (!resource) return;

        const labelsToMerge = updates.get(id) || {};
        const finalLabels = { ...resource.labels, ...labelsToMerge };

        try {
           if (credentials.accessToken !== 'demo-mode') {
             await updateResourceLabelsApi(credentials.projectId, credentials.accessToken, resource, finalLabels);
           } else {
             await new Promise(r => setTimeout(r, 50 + Math.random() * 50)); // Fast mock delay
           }

           const historyEntry: LabelHistoryEntry = {
             timestamp: new Date(),
             actor: 'User (Bulk)',
             changeType: 'UPDATE',
             previousLabels: resource.labels,
             newLabels: finalLabels
           };

           const newHistory = [historyEntry, ...(resource.history || [])];
           
           processedResults.set(id, { success: true, newHistory, finalLabels });
           historyUpdates.set(id, newHistory);
           successCount++;
        } catch (e) {
           processedResults.set(id, { success: false });
           failedCount++;
           console.error(`Failed to update ${resource.name}`, e);
        }
     };

     // Execute Batches
     for (let i = 0; i < count; i += BATCH_SIZE) {
        const batch = idsToUpdate.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(id => processItem(id)));
        
        // Optional: Progress log for large batches
        if (i + BATCH_SIZE < count) {
           console.log(`Processed ${i + BATCH_SIZE}/${count}`);
        }
     }

     // 3. Final State Commit (Single Render)
     setResources(prev => prev.map(r => {
       const result = processedResults.get(r.id);
       if (result) {
         if (result.success && result.finalLabels && result.newHistory) {
            return {
               ...r,
               labels: result.finalLabels,
               proposedLabels: undefined,
               isDirty: true,
               history: result.newHistory,
               isUpdating: false
            };
         } else {
            // Failed, just remove loading state
            return { ...r, isUpdating: false };
         }
       }
       return r;
     }));

     // 4. Persist all history changes in a single DB transaction
     if (historyUpdates.size > 0) {
        persistenceService.bulkSaveHistory(credentials.projectId, historyUpdates).catch(err => {
           console.error("Failed to batch save history to DB", err);
           addLog("Warning: Failed to save batch audit history.", "WARNING");
        });
     }

     addLog(`Batch complete. Success: ${successCount}, Failed: ${failedCount}`, 'SUCCESS');
     addNotification(`Batch complete. ${successCount} updated.`, failedCount > 0 ? 'error' : 'success');
  }, [resources, addLog, addNotification]);

  // NEW: Normalization Capability
  const normalizeLabels = useCallback(async (map: NormalizationMap) => {
    if (!currentCredentials.current) return;
    const { projectId, accessToken } = currentCredentials.current;
    const isDemoMode = accessToken === 'demo-mode';

    addLog('Starting batch normalization...', 'INFO');
    addNotification('Normalizing labels...', 'info');

    // 1. Optimistic Update (mark potential targets as updating)
    // NOTE: This logic assumes simple value check; detailed check is inside service
    // To keep UI responsive, we might just set global loading or rely on fast service execution
    
    try {
      const results = await batchNormalizeResources(resources, map, projectId, accessToken, isDemoMode);
      const successful = results.filter(r => r.success && !r.skipped);
      
      // Update state with results
      setResources(prev => prev.map(r => {
        const res = successful.find(s => s.id === r.id);
        if (res && res.newLabels) {
          return { ...r, labels: res.newLabels, isDirty: true };
        }
        return r;
      }));

      const count = successful.length;
      if (count > 0) {
        addLog(`Normalization complete. ${count} resources updated.`, 'SUCCESS');
        addNotification(`Normalization complete. ${count} updated.`, 'success');
      } else {
        addLog('Normalization complete. No matching labels found.', 'INFO');
        addNotification('No resources needed normalization.', 'info');
      }
    } catch (e: any) {
      addLog(`Normalization error: ${e.message}`, 'ERROR');
      addNotification('Normalization failed.', 'error');
    }
  }, [resources, addLog, addNotification]);

  const revertResource = useCallback((resourceId: string) => {
    setResources(prev => prev.map(r => {
      if (r.id === resourceId) {
        return { ...r, proposedLabels: undefined, isDirty: false };
      }
      return r;
    }));
    addLog(`Reverted changes for ${resourceId}`, 'INFO');
  }, [addLog]);

  const clearReport = () => setReport('');

  return {
    resources,
    setResources,
    stats,
    isConnecting,
    isAnalysing,
    report,
    connectProject,
    refreshResources,
    loadDemoData,
    analyzeResources,
    updateResourceLabels,
    bulkUpdateLabels,
    normalizeLabels,
    revertResource,
    clearReport
  };
};
