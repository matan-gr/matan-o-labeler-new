
import { GceResource } from '../types';
import { updateResourceLabels } from './gcpService';

export type NormalizationMap = Record<string, string>;

/**
 * Custom Rate Limiter (p-limit style)
 * Ensures we don't exceed API quotas by limiting concurrent executions.
 */
const createRateLimiter = (concurrency: number) => {
  const queue: (() => void)[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const run = queue.shift();
      if (run) run();
    }
  };

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    const waitForSlot = async () => {
      if (activeCount < concurrency) {
        activeCount++;
        return;
      }
      await new Promise<void>(resolve => queue.push(resolve));
      activeCount++;
    };

    await waitForSlot();

    try {
      return await fn();
    } finally {
      next();
    }
  };

  return run;
};

/**
 * Batch Normalizer Function
 * Iterates through resources, checks for label value matches in the map,
 * and updates them using a rate-limited API queue.
 */
export const batchNormalizeResources = async (
  resources: GceResource[],
  normalizationMap: NormalizationMap,
  projectId: string,
  accessToken: string,
  isDemoMode: boolean = false
) => {
  // Initialize Rate Limiter (10 concurrent requests to stay within standard quota)
  const limit = createRateLimiter(10);

  // 1. Identify Target Resources & Construct Payloads
  // We filter first to avoid creating promises for resources that don't need updates
  const targets = resources.filter(resource => {
    return Object.values(resource.labels).some(val => 
      normalizationMap[val] && normalizationMap[val] !== val
    );
  });

  // 2. Create Promise Queue
  const promises = targets.map(resource => {
    return limit(async () => {
      // Construct new label set
      const newLabels = { ...resource.labels };
      let hasChanges = false;

      Object.entries(newLabels).forEach(([key, value]) => {
        if (normalizationMap[value] && normalizationMap[value] !== value) {
          newLabels[key] = normalizationMap[value];
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        return { id: resource.id, success: true, skipped: true };
      }

      // Construct API Patch Request via Service
      try {
        if (!isDemoMode) {
            await updateResourceLabels(projectId, accessToken, resource, newLabels);
        } else {
            await new Promise(r => setTimeout(r, 50 + Math.random() * 50)); // Mock delay
        }
        return { id: resource.id, success: true, newLabels };
      } catch (error) {
        console.error(`[Normalization] Failed to update ${resource.name}:`, error);
        return { id: resource.id, success: false, error };
      }
    });
  });

  // 3. Execute Batch
  return Promise.all(promises);
};
