
import { FileText, Server, Activity, Settings, Network, Gauge } from 'lucide-react';

export const APP_NAME = "CloudGov AI";
export const APP_VERSION = "4.0.0-enterprise";

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'inventory', label: 'Resource Inventory', icon: Server },
  { id: 'topology', label: 'Topology Map', icon: Network },
  { id: 'quotas', label: 'Quotas & Limits', icon: Gauge },
  { id: 'logs', label: 'Audit Logs', icon: FileText },
  { id: 'settings', label: 'Configuration', icon: Settings },
];

export const LABEL_TEMPLATES = [
  { label: 'Env: Production', key: 'environment', value: 'production' },
  { label: 'Env: Staging', key: 'environment', value: 'staging' },
  { label: 'Env: Development', key: 'environment', value: 'development' },
  { label: 'Dept: Engineering', key: 'department', value: 'engineering' },
  { label: 'Dept: Finance', key: 'department', value: 'finance' },
  { label: 'App: Web Server', key: 'application', value: 'web-server' },
  { label: 'App: Database', key: 'application', value: 'database' },
  { label: 'Cost: Default Center', key: 'cost-center', value: 'cc-general' },
  { label: 'Comp: PCI-DSS', key: 'compliance', value: 'pci-dss' },
  { label: 'Comp: HIPAA', key: 'compliance', value: 'hipaa' },
];

export const QUOTA_DESCRIPTIONS: Record<string, string> = {
  'CPUS': 'The total number of virtual CPUs (vCPUs) available for VM instances in this region.',
  'SSD_TOTAL_GB': 'Total storage capacity (in GB) available for SSD persistent disks.',
  'IN_USE_ADDRESSES': 'Number of static and ephemeral external IP addresses currently in use.',
  'INSTANCES': 'Total number of VM instances allowed in this region.',
  'DISKS_TOTAL_GB': 'Total storage capacity (in GB) for standard persistent disks.',
  'GLOBAL_INTERNAL_ADDRESSES': 'Number of internal IP addresses available within the VPC.',
  'PREEMPTIBLE_CPUS': 'Number of vCPUs available for Spot/Preemptible instances (cost-effective batch processing).'
};
