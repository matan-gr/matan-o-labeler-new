
import { LabelHistoryEntry } from '../types';

const DB_NAME = 'CloudGov_Governance_DB';
const STORE_NAME = 'audit_history';
const DB_VERSION = 1;

export interface HistoryRecord {
  projectId: string;
  resourceId: string;
  entries: LabelHistoryEntry[];
  lastModified: number;
}

class PersistenceService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: ['projectId', 'resourceId'] });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.error("Database error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Retrieves the full audit history for a specific project.
   */
  async getProjectHistory(projectId: string): Promise<Record<string, LabelHistoryEntry[]>> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const results = request.result as HistoryRecord[];
        const historyMap: Record<string, LabelHistoryEntry[]> = {};
        results.forEach(record => {
          historyMap[record.resourceId] = record.entries;
        });
        resolve(historyMap);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Saves history for a single resource.
   */
  async saveHistory(projectId: string, resourceId: string, entries: LabelHistoryEntry[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record: HistoryRecord = {
        projectId,
        resourceId,
        entries,
        lastModified: Date.now()
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Efficiently saves history for multiple resources in a single transaction.
   */
  async bulkSaveHistory(projectId: string, updates: Map<string, LabelHistoryEntry[]>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      updates.forEach((entries, resourceId) => {
        const record: HistoryRecord = {
          projectId,
          resourceId,
          entries,
          lastModified: Date.now()
        };
        store.put(record);
      });
    });
  }
}

export const persistenceService = new PersistenceService();
