import React, { useState } from 'react';
import { Shield, LayoutDashboard, MessageSquare, Scan, Mic, Settings, User, Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');

  const languages = ['English', 'Urdu', 'Sindhi', 'Roman Urdu'];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ask', label: 'Ask', icon: MessageSquare },
    { id: 'scan', label: 'Scan', icon: Scan },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-gradient">Shehri-Agent</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">AI Legal Assistant for Pakistan</p>
          </div>
          
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all text-slate-400 hover:text-cyan-400 border border-white/5"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{currentLanguage}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isLanguageOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isLanguageOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLanguageOpen(false)}
                    className="fixed inset-0 z-[-1]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-48 glass rounded-2xl p-2 shadow-2xl border border-white/10 overflow-hidden"
                  >
                    <div className="py-1 px-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Language</span>
                    </div>
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setCurrentLanguage(lang);
                          setIsLanguageOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                          currentLanguage === lang 
                            ? "bg-cyan-500/10 text-cyan-400" 
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        )}
                      >
                        {lang}
                        {currentLanguage === lang && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-semibold">Ahmed Ali</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">Premium Member</span>
              {/* Pakistan Flag Wave Animation */}
              <div className="relative w-4 h-2.5 overflow-hidden rounded-[1px] border border-white/10 shadow-sm" title="Pakistan">
                <div className="absolute inset-0 bg-[#006600] flex">
                  <div className="w-[30%] bg-white h-full" />
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90 scale-x-125 mb-0.5" style={{ borderRadius: '50% 10% 50% 50%' }} />
                  </div>
                </div>
                {/* Subtle Shine/Wave effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%]"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center text-slate-300">
            <User className="w-6 h-6" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 md:pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass h-16 flex items-center justify-around border-t border-white/5 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative group",
                isActive ? "text-cyan-400" : "text-slate-400 opacity-60 hover:opacity-100"
              )}
              id={`nav-${item.id}`}
            >
              <div className="mb-1">
                <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute top-0 w-12 h-1 bg-accent-gradient rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Sidebar for Desktop (optional, but keep it simple for now as requested mobile-first) */}
    </div>
  );
}
