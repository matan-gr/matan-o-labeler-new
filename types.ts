
export enum AppState {
  CONNECTING = 'CONNECTING',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  ANALYSIS = 'ANALYSIS',
  REPORTING = 'REPORTING',
}

export interface GcpCredentials {
  projectId: string;
  accessToken: string;
}

export interface AppSettings {
  defaultRegion: string;
  autoAnalyze: boolean;
  costCenterFormat: string;
  departmentList: string[];
}

export type ResourceType = 'INSTANCE' | 'DISK' | 'SNAPSHOT' | 'IMAGE' | 'CLOUD_RUN' | 'CLOUD_SQL' | 'BUCKET';
export type ProvisioningModel = 'STANDARD' | 'SPOT' | 'RESERVED';

export interface LabelHistoryEntry {
  timestamp: Date;
  actor: string;
  previousLabels: Record<string, string>;
  newLabels: Record<string, string>;
  changeType: 'UPDATE' | 'APPLY_PROPOSAL' | 'REVERT';
}

export interface ResourceDisk {
  deviceName: string;
  sizeGb: number;
  type: string;
  boot: boolean;
}

export interface ResourceIP {
  network: string;
  internal: string;
  external?: string;
}

export interface GceResource {
  id: string;
  name: string;
  type: ResourceType;
  zone: string;
  machineType?: string;
  sizeGb?: string; // For standalone disks
  status: string;
  creationTimestamp: string;
  
  // FinOps Data
  provisioningModel: ProvisioningModel;

  // Detailed Configuration
  disks?: ResourceDisk[];
  ips?: ResourceIP[];
  url?: string; // For Cloud Run
  databaseVersion?: string; // For Cloud SQL
  storageClass?: string; // For Buckets

  labels: Record<string, string>;
  labelFingerprint: string;
  
  // UI State
  proposedLabels?: Record<string, string>;
  isDirty?: boolean;
  history?: LabelHistoryEntry[];
  isUpdating?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  severity: 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';
  methodName: string;
  principalEmail: string;
  resourceName: string;
  summary: string;
  source: 'APP' | 'GCP';
  // Rich Data
  callerIp?: string;
  userAgent?: string;
  status?: { code?: number; message?: string };
  location?: string;
}

export interface AnalysisResult {
  resourceId: string;
  suggestedLabels: Record<string, string>;
  reasoning: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface FilterConfig {
  search: string;
  statuses: string[];
  types: string[];
  zones: string[];
  machineTypes: string[];
  hasPublicIp: boolean | null; // null = any, true = yes, false = no
  dateStart: string;
  dateEnd: string;
  labelLogic: 'AND' | 'OR';
  labels: { key: string; value: string }[];
  showUnlabeledOnly: boolean;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SavedView {
  id: string;
  name: string;
  config: FilterConfig;
  createdAt: number;
}

export interface QuotaEntry {
  metric: string;
  limit: number;
  usage: number;
  region: string;
  percentage: number;
}
