import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LegalAssistant } from './components/LegalAssistant';
import { LayoutDashboard, Settings, Scan, Mic } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('ask');

  const renderContent = () => {
    switch (activeTab) {
      case 'ask':
        return <LegalAssistant />;
      case 'dashboard':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 mb-4">
              <LayoutDashboard size={40} />
            </div>
            <h2 className="text-2xl font-bold">Your Dashboard</h2>
            <p className="text-slate-400">Your previous legal cases and files will appear here.</p>
          </div>
        );
      case 'scan':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 mb-4">
              <Scan size={40} />
            </div>
            <h2 className="text-2xl font-bold">Document Scanner</h2>
            <p className="text-slate-400">Scan legal documents to automatically extract data.</p>
            <button className="accent-gradient px-6 py-3 rounded-xl font-bold mt-4 shadow-lg text-sm tracking-widest">OPEN CAMERA</button>
          </div>
        );
      case 'voice':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-40 h-40 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border-4 border-cyan-500/20 animate-pulse">
              <Mic size={60} />
            </div>
            <h2 className="text-2xl font-bold">Voice Assistant</h2>
            <p className="text-slate-400">Listening to your problem... (Urdu/English/Sindhi)</p>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold pb-4 border-b border-white/5 text-gradient">Settings</h2>
            <div className="space-y-4">
              {['Profile', 'Notifications', 'Preferred Authority', 'Accessibility', 'Privacy Policy'].map(item => (
                <button key={item} className="w-full flex items-center justify-between p-5 glass rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-all text-left group">
                  <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors uppercase text-xs tracking-widest">{item}</span>
                  <Settings className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return <LegalAssistant />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
