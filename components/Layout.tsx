
import React from 'react';
import { NAVIGATION_ITEMS, APP_NAME, APP_VERSION } from '../constants';
import { LogOut, Menu, X, CheckCircle, AlertCircle, Info, Moon, Sun, Bookmark, Trash2, ScanBarcode, Tag } from 'lucide-react';
import { Notification, SavedView } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (id: string) => void;
  onDisconnect: () => void;
  notifications?: Notification[];
  onDismissNotification?: (id: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  savedViews?: SavedView[];
  onSelectView?: (view: SavedView) => void;
  onDeleteView?: (id: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onNavigate, 
  onDisconnect,
  notifications = [],
  onDismissNotification,
  isDark,
  toggleTheme,
  savedViews = [],
  onSelectView,
  onDeleteView
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 selection:text-blue-900 dark:selection:text-blue-100">
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div 
              key={n.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`
                pointer-events-auto flex items-start gap-3 px-4 py-4 rounded-lg shadow-xl border backdrop-blur-md relative overflow-hidden group
                ${n.type === 'success' 
                  ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/20 text-slate-800 dark:text-emerald-50' 
                  : n.type === 'error' 
                    ? 'bg-white/95 dark:bg-slate-900/95 border-red-500/20 text-slate-800 dark:text-red-50' 
                    : 'bg-white/95 dark:bg-slate-900/95 border-blue-500/20 text-slate-800 dark:text-blue-50'}
              `}
            >
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-[3px] 
                  ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
                `}
              />

              <div className={`mt-0.5 shrink-0
                 ${n.type === 'success' ? 'text-emerald-500' : n.type === 'error' ? 'text-red-500' : 'text-blue-500'}
              `}>
                {n.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {n.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {n.type === 'info' && <Info className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 pr-4">
                 <h4 className="text-sm font-bold leading-tight mb-1">
                    {n.type === 'success' ? 'Success' : n.type === 'error' ? 'Error' : 'Notification'}
                 </h4>
                 <p className="text-sm opacity-90 leading-relaxed font-normal text-slate-600 dark:text-slate-300">{n.message}</p>
              </div>

              {onDismissNotification && (
                <button 
                  onClick={() => onDismissNotification(n.id)} 
                  className="absolute top-2 right-2 p-1.5 opacity-40 hover:opacity-100 transition-opacity rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
        flex flex-col shadow-sm
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="relative group cursor-default">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-500/20 ring-1 ring-black/5 dark:ring-white/10">
               <ScanBarcode className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-slate-900 dark:text-white tracking-tight text-sm leading-none">
              {APP_NAME}
            </h1>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase mt-0.5">Enterprise</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-8 custom-scrollbar">
          <nav className="space-y-0.5">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              Platform
            </div>
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${activeTab === item.id 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                `}
              >
                <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                <span className="relative z-10">{item.label}</span>
                {activeTab === item.id && (
                    <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg" 
                    />
                )}
              </button>
            ))}
          </nav>

          {/* Saved Views */}
          <div className="space-y-0.5">
             <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
               <span>Saved Views</span>
               {savedViews.length > 0 && <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{savedViews.length}</span>}
             </div>
             
             {savedViews.length === 0 && (
                <div className="px-3 py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center mx-2">
                   <p className="text-xs text-slate-400">No views saved.</p>
                </div>
             )}

             <AnimatePresence>
               {savedViews.map(view => (
                 <motion.div 
                   key={view.id} 
                   layout
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   className="group relative flex items-center px-2"
                 >
                   <button
                     onClick={() => {
                       onSelectView?.(view);
                       setMobileMenuOpen(false);
                     }}
                     className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                   >
                     <Bookmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                     <span className="truncate">{view.name}</span>
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDeleteView?.(view.id); }}
                     className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow mb-2"
          >
              <div className="flex items-center gap-2">
                 {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                 <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
          </button>
          <button 
            onClick={onDisconnect}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
          
          <div className="mt-3 text-[10px] text-center text-slate-400 dark:text-slate-600 font-mono opacity-60">
             v{APP_VERSION}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-16 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-500 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                 {NAVIGATION_ITEMS.find(n => n.id === activeTab)?.label}
               </h2>
               <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
               <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Project Alpha
               </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative scroll-smooth">
           <div className="w-full max-w-[1600px] mx-auto space-y-8">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};
