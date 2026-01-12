
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GcpCredentials } from '../types';
import { APP_NAME, APP_VERSION } from '../constants';
import { Button, Input } from './DesignSystem';
import { 
  ScanBarcode, ArrowRight, Shield, Zap, 
  Layout, Terminal, Lock, Key, PlayCircle,
  Cloud, CheckCircle2, Server
} from 'lucide-react';

interface LoginScreenProps {
  onConnect: (creds: GcpCredentials) => Promise<void>;
  isConnecting: boolean;
  onDemo: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onConnect, isConnecting, onDemo }) => {
  const [projectId, setProjectId] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId && token) {
      onConnect({ projectId, accessToken: token });
    }
  };

  const features = [
    { icon: Layout, label: "Unified Inventory", desc: "Visualize VMs, Disks, and Services across all zones." },
    { icon: Zap, label: "AI Governance", desc: "Gemini-powered labeling and policy enforcement." },
    { icon: Terminal, label: "Audit Trails", desc: "Real-time tracking of admin activities and changes." },
  ];

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-violet-500/30">
      
      {/* Left Panel - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-[#020617] overflow-hidden">
         {/* Background Effects */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.15),transparent_40%)]"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(124,58,237,0.15),transparent_40%)]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
               <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                  <ScanBarcode className="w-6 h-6 text-white" />
               </div>
               <span className="text-xl font-bold text-white tracking-tight">{APP_NAME}</span>
            </div>

            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.7 }}
               className="text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight"
            >
               Cloud Governance <br /> 
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Reimagined.</span>
            </motion.h1>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.7, delay: 0.1 }}
               className="text-lg text-slate-400 max-w-md leading-relaxed font-light"
            >
               Stop wrestling with untagged resources. Automate your labeling strategy with AI and gain total visibility into your GCP infrastructure.
            </motion.p>
         </div>

         <div className="relative z-10 space-y-8">
            <div className="space-y-4">
               {features.map((f, idx) => (
                  <motion.div 
                     key={idx}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
                     className="flex items-center gap-4 group p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                  >
                     <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-colors shadow-sm">
                        <f.icon className="w-5 h-5 text-slate-300 group-hover:text-indigo-300" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-200 mb-0.5">{f.label}</h3>
                        <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">{f.desc}</p>
                     </div>
                  </motion.div>
               ))}
            </div>

            <div className="pt-8 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500 font-medium">
               <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" /> Enterprise Grade Security
               </div>
               <div className="font-mono opacity-50">v{APP_VERSION}</div>
            </div>
         </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative">
         {/* Mobile Background */}
         <div className="absolute inset-0 bg-mesh lg:hidden opacity-50 -z-10"></div>
         
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
         >
            <div className="lg:hidden flex justify-center mb-8">
               <div className="flex items-center gap-3">
                  <div className="bg-violet-600 p-2 rounded-lg"><ScanBarcode className="w-6 h-6 text-white" /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{APP_NAME}</span>
               </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
               {/* Decorative top shimmer */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500"></div>

               <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                     Connect to Google Cloud Platform to begin managing your resources.
                  </p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Project ID</label>
                     <Input 
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        placeholder="e.g. enterprise-production-001"
                        required
                        icon={<Cloud className="w-4 h-4" />}
                        className="bg-slate-50 dark:bg-slate-950/50 h-11"
                     />
                  </div>
                  
                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Token</label>
                        <a 
                           href="https://developers.google.com/oauthplayground" 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                           Get Token <ArrowRight className="w-3 h-3" />
                        </a>
                     </div>
                     <Input 
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ya29.a0..."
                        required
                        icon={<Key className="w-4 h-4" />}
                        className="bg-slate-50 dark:bg-slate-950/50 h-11"
                     />
                     <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Token is stored in memory only.</span>
                     </div>
                  </div>

                  <Button 
                     type="submit" 
                     className="w-full h-12 text-base font-semibold shadow-xl shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none transition-all hover:scale-[1.01]"
                     isLoading={isConnecting}
                     rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                     Connect Environment
                  </Button>
               </form>

               <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                  <button 
                     type="button"
                     onClick={onDemo}
                     className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                     <div className="bg-slate-200 dark:bg-slate-700 p-1.5 rounded-full group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                     </div>
                     <span className="text-sm font-medium">Launch Interactive Demo</span>
                  </button>
               </div>
            </div>
            
            <p className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
               <Shield className="w-3 h-3" />
               <span>Secured by Google Cloud IAM</span>
            </p>
         </motion.div>
      </div>
    </div>
  );
};
