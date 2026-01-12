
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Terminal, Download, RefreshCw, User, Box, Activity, ChevronRight, ChevronDown, FileText, Monitor, Globe, AlertOctagon } from 'lucide-react';
import { Button, Badge } from './DesignSystem';

interface LogViewerProps {
  logs: LogEntry[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const LogViewer: React.FC<LogViewerProps> = React.memo(({ logs, onRefresh, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Layout effect to scroll immediately after render updates
  useEffect(() => {
    if (autoScroll && scrollRef.current && !expandedId) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs, autoScroll, expandedId]);

  // Optimized Scroll Handler using requestAnimationFrame to prevent layout thrashing
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Tolerance of 20px
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;
        
        if (isAtBottom !== autoScroll) {
            setAutoScroll(isAtBottom);
        }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider">Cloud Audit Logs (Admin Activity)</span>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRefresh} 
                disabled={isLoading}
                className="h-8 w-8 p-0"
             >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
             </Button>
          )}
          <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800 pr-6 shrink-0">
         <div className="col-span-1"></div>
         <div className="col-span-2">Timestamp</div>
         <div className="col-span-1">Severity</div>
         <div className="col-span-2">Method</div>
         <div className="col-span-3">Principal / IP</div>
         <div className="col-span-3">Resource</div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-0 font-mono text-xs divide-y divide-slate-100 dark:divide-slate-800/30 bg-white dark:bg-slate-950 scroll-smooth"
      >
        {logs.length === 0 && (
          <div className="text-slate-500 dark:text-slate-600 text-center py-20 italic flex flex-col items-center gap-2 h-full justify-center">
             <Activity className="w-8 h-8 opacity-20" />
             <span>No audit logs found.</span>
          </div>
        )}
        {logs.map((log) => {
          const isExpanded = expandedId === log.id;
          const isErrorStatus = log.status && log.status.code !== 0;
          return (
            <div key={log.id} className="group">
              <div 
                onClick={() => toggleExpand(log.id)}
                className={`grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-colors items-center ${isExpanded ? 'bg-blue-50/50 dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}`}
              >
                <div className="col-span-1 flex justify-center">
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                </div>

                <div className="col-span-2 text-slate-600 dark:text-slate-500 flex flex-col">
                  <span>{log.timestamp.toLocaleDateString()}</span>
                  <span className="text-[10px] opacity-70">{log.timestamp.toLocaleTimeString()}</span>
                </div>
                
                <div className="col-span-1 flex flex-col gap-1">
                  <span className={`
                    px-1.5 py-0.5 rounded text-[10px] font-bold border text-center
                    ${log.severity === 'INFO' || log.severity === 'NOTICE' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : 
                      log.severity === 'WARNING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                      log.severity === 'ERROR' || log.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : 
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                  `}>
                    {log.severity}
                  </span>
                  {isErrorStatus && <span className="text-[9px] text-red-500 font-bold text-center">FAILED</span>}
                </div>

                <div className="col-span-2 text-slate-700 dark:text-slate-300 truncate font-semibold" title={log.methodName}>
                  {log.methodName.split('.').pop()}
                </div>

                <div className="col-span-3 flex flex-col gap-0.5">
                   <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate" title={log.principalEmail}>
                      <User className="w-3 h-3 shrink-0 opacity-50" />
                      <span className="truncate">{log.principalEmail.replace('serviceAccount:', '').split('@')[0]}</span>
                   </div>
                   {log.callerIp && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-600">
                         <Globe className="w-2.5 h-2.5 shrink-0 opacity-50" />
                         <span>{log.callerIp}</span>
                      </div>
                   )}
                </div>

                <div className="col-span-3 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate" title={log.resourceName}>
                  <Box className="w-3 h-3 shrink-0 opacity-50" />
                  <span className="truncate">{log.resourceName}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-12 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-400 animate-in slide-in-from-top-1 duration-200">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Full Method Name</div>
                            <code className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 break-all block">
                              {log.methodName}
                            </code>
                         </div>
                         <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Resource Fully Qualified Name</div>
                            <code className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 break-all block">
                              {log.resourceName}
                            </code>
                         </div>
                         {log.status && (
                            <div>
                               <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Operation Status</div>
                               <div className={`flex items-center gap-2 ${log.status.code !== 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {log.status.code !== 0 ? <AlertOctagon className="w-4 h-4"/> : <Activity className="w-4 h-4"/>}
                                  <span className="font-mono font-bold">{log.status.code === 0 ? 'SUCCESS' : `ERROR CODE ${log.status.code}`}</span>
                                  {log.status.message && <span className="text-slate-500 ml-2">- {log.status.message}</span>}
                               </div>
                            </div>
                         )}
                      </div>
                      <div className="space-y-4">
                         <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Request Metadata</div>
                            <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Principal:</span> {log.principalEmail}
                               </div>
                               {log.callerIp && (
                                  <div className="flex items-center gap-2">
                                     <Globe className="w-3 h-3 text-slate-400" />
                                     <span className="font-semibold text-slate-700 dark:text-slate-300">Caller IP:</span> {log.callerIp}
                                  </div>
                               )}
                               {log.userAgent && (
                                  <div className="flex items-start gap-2">
                                     <Monitor className="w-3 h-3 text-slate-400 mt-0.5" />
                                     <div>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">User Agent:</span>
                                        <div className="text-[10px] text-slate-500 break-all leading-tight mt-0.5">{log.userAgent}</div>
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                         <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Summary</div>
                            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-800 dark:text-blue-200">
                               <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                               <span>{log.summary || 'No summary available.'}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default LogViewer;
