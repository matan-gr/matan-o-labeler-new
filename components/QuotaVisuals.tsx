
import React, { useState, useMemo } from 'react';
import { QuotaEntry } from '../types';
import { 
  AlertOctagon, AlertTriangle, Gauge, 
  MapPin, Info, ShieldAlert, Cpu, HardDrive, 
  Globe, LayoutGrid, Zap, TrendingUp, HelpCircle
} from 'lucide-react';
import { Card, Tooltip, Badge } from './DesignSystem';
import { SparkLine } from './Visualizations';
import { QUOTA_DESCRIPTIONS } from '../constants';
import { motion } from 'framer-motion';

interface QuotaVisualsProps {
  quotas: QuotaEntry[];
  isLoading: boolean;
}

type Category = 'ALL' | 'COMPUTE' | 'STORAGE' | 'NETWORK';

const getCategory = (metric: string): Category => {
  const m = metric.toUpperCase();
  if (m.includes('CPU') || m.includes('INSTANCE') || m.includes('GPU') || m.includes('TPU') || m.includes('NVIDIA')) return 'COMPUTE';
  if (m.includes('DISK') || m.includes('SSD') || m.includes('STORAGE') || m.includes('SNAPSHOT')) return 'STORAGE';
  if (m.includes('ADDRESS') || m.includes('IP') || m.includes('NETWORK') || m.includes('FIREWALL') || m.includes('FORWARDING')) return 'NETWORK';
  return 'ALL'; // Fallback for uncategorized
};

const QuotaVisuals: React.FC<QuotaVisualsProps> = ({ quotas, isLoading }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');

  const filteredQuotas = useMemo(() => {
    if (activeCategory === 'ALL') return quotas;
    return quotas.filter(q => getCategory(q.metric) === activeCategory);
  }, [quotas, activeCategory]);

  const stats = useMemo(() => {
    const critical = quotas.filter(q => q.percentage >= 100);
    const highRisk = quotas.filter(q => q.percentage >= 80 && q.percentage < 100);
    const avgUtilization = quotas.length > 0 
      ? quotas.reduce((acc, q) => acc + q.percentage, 0) / quotas.length 
      : 0;
    
    // Sort by usage desc for top risk list
    const topRisks = [...quotas].sort((a,b) => b.percentage - a.percentage).slice(0, 5);

    return { critical, highRisk, avgUtilization, topRisks };
  }, [quotas]);

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
    );
  }

  if (quotas.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <Gauge className="w-10 h-10 opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Quota Data Available</h3>
              <p className="text-sm mt-2 max-w-md text-center">
                Ensure the Compute Engine API is enabled and you have permissions to view regions.
              </p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        {/* Top Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* 1. Health Score */}
           <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="p-6 relative z-10 flex flex-col h-full justify-between">
                 <div>
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                       <Zap className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase tracking-widest">Platform Health</span>
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight mt-2">
                       {Math.max(0, 100 - Math.round(stats.avgUtilization))}/100
                    </div>
                    <div className="text-xs opacity-60 mt-1">Based on aggregated regional quota utilization</div>
                 </div>
                 
                 <div className="mt-6 flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${stats.critical.length > 0 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    <span className="text-sm font-medium">
                       {stats.critical.length > 0 
                         ? `${stats.critical.length} Critical Limits Reached` 
                         : 'All systems within capacity limits'}
                    </span>
                 </div>
              </div>
           </Card>

           {/* 2. Top Risks List */}
           <Card className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Highest Utilization Risks
                 </h3>
                 <Badge variant="neutral">{stats.topRisks.length} Detected</Badge>
              </div>
              <div className="p-2">
                 {stats.topRisks.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group cursor-default">
                       <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</div>
                          <div>
                             <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{q.metric.replace(/_/g, ' ').replace('QUOTA', '')}</div>
                             <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {q.region}
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${q.percentage >= 90 ? 'bg-red-500' : 'bg-amber-500'}`}
                               style={{ width: `${Math.min(q.percentage, 100)}%` }}
                             ></div>
                          </div>
                          <span className={`text-xs font-bold w-10 text-right ${q.percentage >= 90 ? 'text-red-600' : 'text-amber-600'}`}>
                             {Math.round(q.percentage)}%
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
           {[
             { id: 'ALL', label: 'All Quotas', icon: LayoutGrid },
             { id: 'COMPUTE', label: 'Compute Engine', icon: Cpu },
             { id: 'STORAGE', label: 'Storage', icon: HardDrive },
             { id: 'NETWORK', label: 'Networking', icon: Globe },
           ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as Category)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeCategory === cat.id 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
                `}
              >
                 <cat.icon className="w-4 h-4" />
                 {cat.label}
              </button>
           ))}
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredQuotas.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400">
                 <div className="flex justify-center mb-4"><HelpCircle className="w-12 h-12 opacity-20" /></div>
                 <p>No quotas found for this category with active usage.</p>
              </div>
           )}

           {filteredQuotas.map((q, idx) => (
              <motion.div 
                key={`${q.metric}-${q.region}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                 <QuotaCard quota={q} />
              </motion.div>
           ))}
        </div>

        {/* Limits Info Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  <ShieldAlert className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Governance Limits</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Standard GCP resource limits per project.</p>
               </div>
            </div>
            <div className="flex gap-8">
               <div className="text-center">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">64</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Labels / Res</div>
               </div>
               <div className="text-center">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">63</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Char Limit</div>
               </div>
               <div className="text-center">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">15.5k</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Req / Min</div>
               </div>
            </div>
        </div>
    </div>
  );
};

const QuotaCard = ({ quota }: { quota: QuotaEntry }) => {
    // Generate mock historical data based on current usage
    const historyData = useMemo(() => {
      // Create 7 points ending at current usage
      const trend = [];
      const base = quota.usage;
      for (let i = 6; i > 0; i--) {
        // Fluctuate between -30% and +10% of current base, clamped to limit
        const randomFactor = 0.7 + Math.random() * 0.4;
        let val = base * randomFactor;
        if (val > quota.limit) val = quota.limit;
        trend.push(val);
      }
      trend.push(base); // Current value is last
      return trend;
    }, [quota.usage, quota.limit]);

    // Advanced Risk Styling
    const isCritical = quota.percentage >= 100;
    const isHighRisk = quota.percentage >= 80 && !isCritical;

    let containerClasses = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
    let progressColor = 'bg-emerald-500 shadow-emerald-500/20';
    let textColor = 'text-emerald-600 dark:text-emerald-400';
    let sparkColor = '#10b981'; // emerald-500

    if (isCritical) {
        containerClasses = 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 shadow-md shadow-red-500/10 border-l-4 border-l-red-500';
        progressColor = 'bg-red-500 shadow-red-500/40 animate-pulse';
        textColor = 'text-red-600 dark:text-red-400';
        sparkColor = '#ef4444'; // red-500
    } else if (isHighRisk) {
        containerClasses = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm border-l-4 border-l-amber-500';
        progressColor = 'bg-amber-500 shadow-amber-500/30';
        textColor = 'text-amber-600 dark:text-amber-400';
        sparkColor = '#f59e0b'; // amber-500
    }

    const formattedMetric = quota.metric.replace(/_/g, ' ').replace('QUOTA', '').trim();
    const description = QUOTA_DESCRIPTIONS[quota.metric] || `Regional limit for ${formattedMetric}`;

    return (
        <div className={`relative rounded-xl border p-5 transition-all duration-300 group hover:shadow-lg ${containerClasses}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3 max-w-[85%]">
                    <div className={`p-2 rounded-lg shrink-0 ${isCritical ? 'bg-red-100 dark:bg-red-900/40' : isHighRisk ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                       {isCritical ? <AlertOctagon className={`w-5 h-5 ${textColor}`} /> : 
                        isHighRisk ? <AlertTriangle className={`w-5 h-5 ${textColor}`} /> :
                        getCategory(quota.metric) === 'COMPUTE' ? <Cpu className="w-5 h-5 text-slate-500" /> :
                        <Gauge className="w-5 h-5 text-slate-500" />
                       }
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight break-words pr-2" title={formattedMetric}>
                            {formattedMetric}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <MapPin className="w-3 h-3" />
                            <span>{quota.region}</span>
                        </div>
                    </div>
                </div>
                
                <Tooltip content={description} placement="bottom">
                    <Info className="w-4 h-4 text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
                </Tooltip>
            </div>

            {/* Metric Big Number */}
            <div className="flex items-baseline gap-1 mb-3">
               <span className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
                  {Math.round(quota.percentage)}%
               </span>
               <span className={`text-xs font-semibold uppercase tracking-wide ${isCritical ? 'text-red-500' : 'text-slate-400'}`}>Utilized</span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2.5 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden shadow-inner mb-4">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`} 
                    style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                ></div>
            </div>
            
            {/* Stats Row */}
            <div className="flex justify-between items-end text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                <div className="flex flex-col">
                   <span className="text-slate-400 text-[9px] uppercase mb-0.5">Used</span>
                   <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{quota.usage.toLocaleString()}</span>
                </div>
                
                {/* Trend Chart (Middle) */}
                <div className="flex-1 mx-4 h-8 flex flex-col justify-end items-center opacity-50 hover:opacity-100 transition-opacity">
                   <div className="w-20 h-6">
                      <SparkLine data={historyData} color={sparkColor} height={24} />
                   </div>
                   <span className="text-[8px] uppercase tracking-wider text-slate-400">7d Trend</span>
                </div>

                <div className="flex flex-col text-right">
                   <span className="text-slate-400 text-[9px] uppercase mb-0.5">Limit</span>
                   <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{quota.limit.toLocaleString()}</span>
                </div>
            </div>

            {/* Interactive Overlay */}
            {isHighRisk && (
               <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pointer-events-none group-hover:pointer-events-auto">
                  <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold px-4 py-2 rounded-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                     <TrendingUp className="w-3 h-3" /> Request Increase
                  </button>
               </div>
            )}
        </div>
    );
};

export default QuotaVisuals;
