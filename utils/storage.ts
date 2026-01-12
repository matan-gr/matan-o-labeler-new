
/**
 * Storage Utility for Enterprise Resource Governance
 * 
 * Handles local persistence of user configurations (Views, Settings).
 * Data is namespaced by Project ID to ensure multi-tenant isolation 
 * on shared workstations.
 * 
 * Note: Sensitive credentials (Access Tokens) are NEVER stored here 
 * and remain in memory only.
 */

const PREFIX = 'mol_v1_';

export const Storage = {
  /**
   * Save data scoped to a specific project context
   */
  set: (projectId: string, key: string, data: any) => {
    if (!projectId) return;
    try {
      // Create a unique key for this project+resource combo
      const storageKey = `${PREFIX}${projectId}_${key}`;
      const payload = JSON.stringify({
        timestamp: Date.now(),
        data
      });
      localStorage.setItem(storageKey, payload);
    } catch (e) {
      console.warn('Local storage quota exceeded or unavailable', e);
    }
  },

  /**
   * Retrieve data scoped to a specific project context
   */
  get: <T>(projectId: string, key: string, defaultValue: T): T => {
    if (!projectId) return defaultValue;
    try {
      const storageKey = `${PREFIX}${projectId}_${key}`;
      const item = localStorage.getItem(storageKey);
      if (!item) return defaultValue;
      
      const parsed = JSON.parse(item);
      return parsed.data as T;
    } catch (e) {
      return defaultValue;
    }
  },

  /**
   * Clear all data for a specific project (Cleanup)
   */
  clearProjectData: (projectId: string) => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${PREFIX}${projectId}_`)) {
        localStorage.removeItem(key);
      }
    });
  }
};
