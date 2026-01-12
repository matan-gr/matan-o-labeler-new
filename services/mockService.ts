
import { GceResource, ResourceType, LabelHistoryEntry, ProvisioningModel, ResourceDisk, ResourceIP } from '../types';

const ZONES = ['us-central1-a', 'us-central1-b', 'europe-west1-d', 'asia-east1-a'];
const REGIONS = ['us-central1', 'europe-west1', 'asia-east1', 'us-east1'];
const MACHINE_TYPES = ['n1-standard-1', 'e2-medium', 'c2-standard-4', 'm1-ultramem-40', 'e2-micro'];
const ENVIRONMENTS = ['production', 'staging', 'development', 'qa'];
const DEPARTMENTS = ['engineering', 'finance', 'marketing', 'data-science', 'hr'];
const APPLICATIONS = ['web-portal', 'payment-gateway', 'user-db', 'analytics-engine', 'internal-tools'];

const generateId = () => Math.random().toString(36).substring(2, 15);

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateHistory = (count: number): LabelHistoryEntry[] => {
  const history: LabelHistoryEntry[] = [];
  for (let i = 0; i < count; i++) {
    history.push({
      timestamp: new Date(Date.now() - Math.random() * 10000000000), // Random time in past
      actor: Math.random() > 0.5 ? 'jane.doe@company.com' : 'system-automation',
      changeType: 'UPDATE',
      previousLabels: { 'env': 'dev' },
      newLabels: { 'env': 'prod', 'reviewed': 'true' }
    });
  }
  return history;
};

const generateDisks = (vmName: string): ResourceDisk[] => {
  const disks: ResourceDisk[] = [];
  // Boot disk
  disks.push({
    deviceName: `${vmName}-boot`,
    sizeGb: Math.random() > 0.5 ? 20 : 50,
    type: 'PERSISTENT',
    boot: true
  });
  // Optional data disk
  if (Math.random() > 0.6) {
    disks.push({
      deviceName: `${vmName}-data`,
      sizeGb: Math.floor(Math.random() * 500) + 100,
      type: 'PERSISTENT',
      boot: false
    });
  }
  return disks;
};

const generateIPs = (type: ResourceType): ResourceIP[] => {
  const ips: ResourceIP[] = [];
  const networks = ['default', 'vpc-prod', 'vpc-dev'];
  const network = networks[Math.floor(Math.random() * networks.length)];
  
  // Internal
  ips.push({
    network: network,
    internal: `10.128.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    external: type === 'INSTANCE' && Math.random() > 0.3 ? `34.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : undefined
  });
  return ips;
};

export const generateMockResources = (count: number = 30): GceResource[] => {
  const resources: GceResource[] = [];

  for (let i = 0; i < count; i++) {
    const env = getRandomItem(ENVIRONMENTS);
    const app = getRandomItem(APPLICATIONS);
    
    // Randomize Type
    const rand = Math.random();
    let type: ResourceType = 'INSTANCE';
    if (rand > 0.85) type = 'BUCKET';
    else if (rand > 0.75) type = 'DISK';
    else if (rand > 0.65) type = 'CLOUD_SQL';
    else if (rand > 0.55) type = 'CLOUD_RUN';
    
    const isLabeled = Math.random() > 0.4;
    
    let name = `${env}-${app}-${Math.floor(Math.random() * 99)}`;
    if (type === 'INSTANCE') name += '-vm';
    if (type === 'DISK') name += '-disk';
    if (type === 'CLOUD_SQL') name += '-db';
    if (type === 'CLOUD_RUN') name += '-svc';
    if (type === 'BUCKET') name = `${env}-assets-${app}-${Math.floor(Math.random() * 9999)}`;
    
    const machineType = type === 'INSTANCE' ? getRandomItem(MACHINE_TYPES) : 
                        type === 'CLOUD_SQL' ? 'db-custom-2-3840' : undefined;
    
    // FinOps logic
    let provisioning: ProvisioningModel = 'STANDARD';
    if (type === 'INSTANCE') {
        const r = Math.random();
        if (r > 0.7) provisioning = 'SPOT';
        else if (r > 0.9) provisioning = 'RESERVED';
    }

    // Bucket specific props
    let storageClass: string | undefined;
    let sizeGb: string | undefined;
    if (type === 'BUCKET') {
        storageClass = getRandomItem(['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE']);
        sizeGb = Math.floor(Math.random() * 5000).toString();
    }

    // Cloud SQL specific
    let databaseVersion: string | undefined;
    if (type === 'CLOUD_SQL') {
        databaseVersion = getRandomItem(['POSTGRES_14', 'MYSQL_8_0', 'SQLSERVER_2019_STANDARD']);
    }

    // Cloud Run specific
    let url: string | undefined;
    if (type === 'CLOUD_RUN') {
        url = `https://${name}-${generateId()}.a.run.app`;
    }

    const labels: Record<string, string> = {};
    if (isLabeled) {
      labels['environment'] = env;
      labels['application'] = app;
      labels['department'] = getRandomItem(DEPARTMENTS);
      if (Math.random() > 0.5) labels['cost-center'] = `cc-${Math.floor(Math.random() * 5000)}`;
    }

    // Generate IPs for Instances and SQL to show connectivity
    const ips = (type === 'INSTANCE' || type === 'CLOUD_SQL') ? generateIPs(type) : undefined;

    resources.push({
      id: generateId(),
      name: name,
      type: type as ResourceType,
      zone: type === 'BUCKET' ? getRandomItem(REGIONS) : getRandomItem(ZONES),
      machineType: machineType,
      sizeGb: sizeGb || (type === 'DISK' ? (Math.floor(Math.random() * 500) + 10).toString() : undefined),
      status: type === 'BUCKET' ? 'READY' : (Math.random() > 0.2 ? (type === 'INSTANCE' ? 'RUNNING' : 'READY') : 'STOPPED'),
      creationTimestamp: new Date(Date.now() - Math.random() * 30000000000).toISOString(),
      
      provisioningModel: provisioning,
      disks: type === 'INSTANCE' ? generateDisks(name) : undefined,
      ips: ips,
      storageClass: storageClass,
      databaseVersion: databaseVersion,
      url: url,
      
      labels: labels,
      labelFingerprint: generateId(),
      history: generateHistory(Math.floor(Math.random() * 5)),
      isDirty: false
    });
  }
  return resources;
};
