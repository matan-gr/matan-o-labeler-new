
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { GcpCredentials, FilterConfig, SavedView, QuotaEntry } from './types';
import { Layout } from './components/Layout';
// Lazy load heavy components
const ResourceTable = React.lazy(() => import('./components/ResourceTable'));
const LogViewer = React.lazy(() => import('./components/LogViewer'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TopologyMap = React.lazy(() => import('./components/TopologyMap'));
const QuotaVisuals = React.lazy(() => import('./components/QuotaVisuals'));

import { LoginScreen } from './components/LoginScreen';
import { useNotifications } from './hooks/useNotifications';
import { useResourceManager } from './hooks/useResourceManager';
import { useLogs } from './hooks/useLogs';
import { Button, Input, Card, SectionHeader } from './components/DesignSystem';
import { BarChart3, Wand2, Moon, Sun, Network, RefreshCw, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { MarkdownView } from './components/MarkdownView';
import { Storage } from './utils/storage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchQuotas } from './services/gcpService';

const DEFAULT_FILTER_CONFIG: FilterConfig = {
  search: '',
  statuses: [],
  types: [],
  zones: [],
  machineTypes: [],
  hasPublicIp: null,
  dateStart: '',
  dateEnd: '',
  labelLogic: 'AND',
  labels: [],
  showUnlabeledOnly: false
};

// Enterprise-grade transition with spring physics
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="h-full flex flex-col origin-top"
  >
    {children}
  </motion.div>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<GcpCredentials>({ projectId: '', accessToken: '' });
  
  // View State
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  
  // Quota State
  const [quotas, setQuotas] = useState<QuotaEntry[]>([]);
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(false);

  // Theme Management
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  // Hooks
  const { logs, addAppLog, refreshGcpLogs, isLoadingLogs, setLogs } = useLogs();
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const { 
    resources, stats, isConnecting, isAnalysing, report,
    connectProject, refreshResources, loadDemoData, analyzeResources, updateResourceLabels, bulkUpdateLabels, revertResource, clearReport
  } = useResourceManager(addAppLog, addNotification);

  // Auto-refresh logs when tab is active
  useEffect(() => {
    if (isAuthenticated && activeTab === 'logs' && credentials.accessToken && credentials.accessToken !== 'demo-mode') {
      refreshGcpLogs(credentials);
    }
  }, [isAuthenticated, activeTab, credentials, refreshGcpLogs]);

  // Load Quotas when tab is active
  const loadQuotas = useCallback(async () => {
      if (credentials.accessToken && credentials.accessToken !== 'demo-mode') {
          setIsLoadingQuotas(true);
          const data = await fetchQuotas(credentials.projectId, credentials.accessToken);
          setQuotas(data);
          setIsLoadingQuotas(false);
      } else if (credentials.accessToken === 'demo-mode') {
          // Mock quotas for demo
          setQuotas([
              { metric: 'CPUS', limit: 24, usage: 22, region: 'us-central1', percentage: 91.6 },
              { metric: 'CPUS', limit: 24, usage: 18, region: 'europe-west1', percentage: 75.0 },
              { metric: 'SSD_TOTAL_GB', limit: 500, usage: 480, region: 'us-central1', percentage: 96.0 },
              { metric: 'IN_USE_ADDRESSES', limit: 8, usage: 8, region: 'us-east1', percentage: 100.0 },
              { metric: 'INSTANCES', limit: 50, usage: 10, region: 'asia-east1', percentage: 20.0 },
          ]);
      }
  }, [credentials]);

  useEffect(() => {
      if (isAuthenticated && activeTab === 'quotas') {
          loadQuotas();
      }
  }, [isAuthenticated, activeTab, loadQuotas]);

  // Handlers
  const handleConnect = useCallback(async (creds: GcpCredentials) => {
    const success = await connectProject(creds);
    if (success) {
      setCredentials(creds);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
      
      // Load user-specific settings securely
      const userViews = Storage.get<SavedView[]>(creds.projectId, 'saved_views', []);
      setSavedViews(userViews);
    }
  }, [connectProject]);

  const handleDemoMode = useCallback(() => {
    setCredentials({ projectId: 'demo-enterprise-prod', accessToken: 'demo-mode' });
    setIsAuthenticated(true);
    if (loadDemoData()) {
      setActiveTab('dashboard');
      // Inject some fake logs for demo
      setLogs([
        { id: '1', timestamp: new Date(), severity: 'NOTICE', methodName: 'v1.compute.instances.start', principalEmail: 'jane@company.com', resourceName: 'prod-web-vm-01', summary: 'Start VM', source: 'GCP' },
        { id: '2', timestamp: new Date(Date.now() - 100000), severity: 'INFO', methodName: 'v1.compute.instances.setLabels', principalEmail: 'system-auto', resourceName: 'dev-db-04', summary: 'Update Labels', source: 'GCP' },
      ]);
      // Mock saved views for demo
      setSavedViews([
         { id: 'demo-1', name: 'Production Errors', createdAt: Date.now(), config: { ...DEFAULT_FILTER_CONFIG, statuses: ['TERMINATED', 'STOPPED'] } }
      ]);
    }
  }, [loadDemoData, setLogs]);

  const handleDisconnect = useCallback(() => {
    setIsAuthenticated(false);
    setCredentials({ projectId: '', accessToken: '' });
    setSavedViews([]);
    // Do NOT clear storage here, just logout
  }, []);

  // Memoized Action Handlers for Resource Table to prevent row re-renders
  const handleUpdate = useCallback((id: string, labels: Record<string, string>) => {
    updateResourceLabels(credentials, id, labels, false);
  }, [credentials, updateResourceLabels]);

  const handleApply = useCallback((id: string, labels: Record<string, string>) => {
    updateResourceLabels(credentials, id, labels, true);
  }, [credentials, updateResourceLabels]);

  const handleRevert = useCallback((id: string) => {
    revertResource(id);
  }, [revertResource]);

  const handleBulk = useCallback((updates: Map<string, Record<string, string>>) => {
    bulkUpdateLabels(credentials, updates);
  }, [credentials, bulkUpdateLabels]);

  // View Handlers
  const handleSaveView = useCallback((name: string) => {
    const newView: SavedView = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      config: { ...filterConfig },
      createdAt: Date.now()
    };
    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    
    // Persist securely scoped to project
    Storage.set(credentials.projectId, 'saved_views', updatedViews);
    
    addNotification(`View "${name}" saved`, 'success');
  }, [credentials.projectId, filterConfig, savedViews, addNotification]);

  const handleDeleteView = useCallback((id: string) => {
    const updatedViews = savedViews.filter(v => v.id !== id);
    setSavedViews(updatedViews);
    Storage.set(credentials.projectId, 'saved_views', updatedViews);
  }, [credentials.projectId, savedViews]);

  const handleSelectView = useCallback((view: SavedView) => {
    setFilterConfig(view.config);
    setActiveTab('inventory');
    addNotification(`Loaded view: ${view.name}`, 'info');
  }, [addNotification]);

  // --- Login State ---
  if (!isAuthenticated) {
     return (
       <>
          {/* Notifications can appear on login screen too */}
          <AnimatePresence>
             {notifications.map(n => (
                <motion.div 
                  key={n.id} 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className={`fixed top-4 right-4 p-4 rounded-xl border shadow-2xl z-[100] font-medium text-sm flex items-start gap-3 max-w-sm ${
                    n.type === 'error' ? 'bg-red-50 text-red-900 border-red-200 shadow-red-500/10' : 'bg-slate-900 text-white border-slate-700 shadow-slate-900/20'
                  }`}
                >
                  <div className="flex-1 break-words">
                    {n.message}
                  </div>
                </motion.div>
             ))}
          </AnimatePresence>
          <LoginScreen 
            onConnect={handleConnect} 
            isConnecting={isConnecting} 
            onDemo={handleDemoMode} 
          />
       </>
     );
  }

  return (
    <ErrorBoundary>
      <Layout 
        activeTab={activeTab} 
        onNavigate={setActiveTab} 
        onDisconnect={handleDisconnect}
        notifications={notifications}
        onDismissNotification={dismissNotification}
        isDark={isDark}
        toggleTheme={toggleTheme}
        savedViews={savedViews}
        onSelectView={handleSelectView}
        onDeleteView={handleDeleteView}
      >
        <AnimatePresence mode="wait">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full w-full">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          }>
          {activeTab === 'dashboard' && (
            <PageTransition key="dashboard">
              <Dashboard 
                resources={resources} 
                stats={stats} 
                onNavigate={setActiveTab}
              />
            </PageTransition>
          )}

          {activeTab === 'inventory' && (
            <PageTransition key="inventory">
              {/* Changed: Removed h-full to allow natural height growth */}
              <div className="space-y-6 pb-10 flex flex-col">
                <SectionHeader 
                  title="Resource Inventory" 
                  subtitle="Manage, audit, and label your cloud infrastructure across all zones."
                  action={
                    <Button 
                      onClick={analyzeResources} 
                      isLoading={isAnalysing}
                      leftIcon={<Wand2 className="w-4 h-4" />}
                      variant="primary"
                      className="shadow-lg shadow-violet-500/20 dark:shadow-violet-900/20 bg-violet-600 hover:bg-violet-700 text-white border-transparent"
                    >
                      Analyze with Gemini
                    </Button>
                  }
                />

                {report && (
                  <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 border border-violet-200 dark:border-violet-500/20 backdrop-blur-md animate-in slide-in-from-top-2 relative overflow-hidden shadow-xl dark:shadow-2xl flex-shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Wand2 className="w-32 h-32 text-violet-900 dark:text-white" />
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10 border-b border-slate-200 dark:border-white/5 pb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        Inventory Insights
                      </h3>
                      <button onClick={clearReport} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-2xl leading-none">&times;</button>
                    </div>
                    <div className="relative z-10">
                      <MarkdownView content={report} />
                    </div>
                  </div>
                )}

                <ResourceTable 
                  resources={resources}
                  filterConfig={filterConfig}
                  onFilterChange={setFilterConfig}
                  onSaveView={handleSaveView}
                  onApplyLabels={handleApply}
                  onUpdateLabels={handleUpdate}
                  onRevert={handleRevert}
                  onBulkUpdateLabels={handleBulk}
                  onRefresh={refreshResources}
                  isLoading={isConnecting} 
                />
              </div>
            </PageTransition>
          )}

          {activeTab === 'topology' && (
            <PageTransition key="topology">
              <div className="space-y-6 h-full flex flex-col">
                <SectionHeader 
                  title="Network Topology" 
                  subtitle="Visual map of your infrastructure dependencies."
                  action={
                    <Button onClick={refreshResources} isLoading={isConnecting} variant="secondary">
                      Refresh Data
                    </Button>
                  }
                />
                <div className="flex-1 w-full relative min-h-[600px] h-[calc(100vh-220px)] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <TopologyMap resources={resources} />
                </div>
              </div>
            </PageTransition>
          )}

          {activeTab === 'quotas' && (
            <PageTransition key="quotas">
              <div className="space-y-6 h-full flex flex-col">
                <SectionHeader 
                  title="Quotas & Limits" 
                  subtitle="Monitor resource consumption against Google Cloud regional limits."
                  action={
                    <Button onClick={loadQuotas} isLoading={isLoadingQuotas} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4"/>}>
                      Refresh Quotas
                    </Button>
                  }
                />
                <div className="flex-1 min-h-0 overflow-auto pb-8">
                  <QuotaVisuals quotas={quotas} isLoading={isLoadingQuotas} />
                </div>
              </div>
            </PageTransition>
          )}

          {activeTab === 'logs' && (
            <PageTransition key="logs">
              <div className="space-y-6 h-full flex flex-col">
                <SectionHeader 
                  title="Audit Logs" 
                  subtitle="Real-time Admin Activity logs from Cloud Logging."
                  action={
                    <Button onClick={() => refreshGcpLogs(credentials)} isLoading={isLoadingLogs} variant="secondary">
                      Refresh Logs
                    </Button>
                  }
                />
                <div className="flex-1 min-h-0">
                  <LogViewer logs={logs} onRefresh={() => refreshGcpLogs(credentials)} isLoading={isLoadingLogs} />
                </div>
              </div>
            </PageTransition>
          )}

          {activeTab === 'settings' && (
            <PageTransition key="settings">
              <div className="space-y-6">
                <SectionHeader 
                  title="Configuration" 
                  subtitle="Manage application preferences and AI analysis rules."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="General Settings">
                    <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Region</label>
                          <Input defaultValue="us-central1" disabled />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cost Center Format</label>
                          <Input defaultValue="CC-####" disabled />
                      </div>
                      <div className="pt-4">
                        <Button variant="secondary" disabled>Save Changes</Button>
                      </div>
                    </div>
                  </Card>
                  <Card title="AI Tuning">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300">Auto-Analyze New Resources</span>
                          <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300">Strict Naming Convention</span>
                          <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </PageTransition>
          )}
          </Suspense>
        </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
};
