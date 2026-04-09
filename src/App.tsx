import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TranslatorPanel } from './components/TranslatorPanel';
import { VoiceTranslator } from './components/VoiceTranslator';
import { MessageSquare, Mic, LayoutDashboard, Settings, Info, Globe, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
  const [isObsMode, setIsObsMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'obs') {
      setIsObsMode(true);
      document.body.style.background = 'transparent';
    }
  }, []);

  if (isObsMode) {
    return (
      <div className="h-screen w-screen flex items-end justify-center pb-20 px-10 overflow-hidden bg-transparent">
        <VoiceTranslator isOverlay={true} />
      </div>
    );
  }

  const openObsOverlay = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'obs');
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 border-r border-white/5 flex flex-col items-center py-12 gap-12 bg-[#080808] z-50">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          <Globe className="w-6 h-6 text-black" />
        </div>

        <div className="flex flex-col gap-6">
          <NavItem 
            icon={<MessageSquare className="w-5 h-5" />} 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            label="Chat"
          />
          <NavItem 
            icon={<Mic className="w-5 h-5" />} 
            active={activeTab === 'voice'} 
            onClick={() => setActiveTab('voice')} 
            label="Voice"
          />
        </div>

        <div className="mt-auto flex flex-col gap-6">
          <NavItem icon={<ExternalLink className="w-5 h-5" />} active={false} onClick={openObsOverlay} label="OBS Mode" />
          <NavItem icon={<Settings className="w-5 h-5" />} active={false} onClick={() => {}} label="Settings" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-12 py-8 flex items-center justify-between border-b border-white/5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">Clique Translator</h1>
            <p className="text-xs font-mono text-white/30 uppercase tracking-widest">Streaming Assistant v1.0.4</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('mode', 'obs');
                navigator.clipboard.writeText(url.toString());
                alert('Link copied! Paste this as a Browser Source in OBS.');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group"
            >
              <LayoutDashboard className="w-4 h-4 text-white/40 group-hover:text-white" />
              <span className="text-xs font-medium">Copy OBS Link</span>
            </button>
            <button 
              onClick={openObsOverlay}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group"
            >
              <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
              <span className="text-xs font-medium">Open OBS Overlay</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Gemini 1.5 Flash</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full max-w-7xl mx-auto"
              >
                <TranslatorPanel 
                  title="User Input" 
                  sourceLang="English" 
                  targetLang="Spanish" 
                  placeholder="Paste what the user wrote here..."
                />
                <TranslatorPanel 
                  title="Model Response" 
                  sourceLang="Spanish" 
                  targetLang="English" 
                  placeholder="Escribe tu respuesta en español..."
                />
              </motion.div>
            ) : (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto"
              >
                <VoiceTranslator />
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Accuracy" value="98.2%" />
                  <StatCard label="Latency" value="1.2s" />
                  <StatCard label="Words" value="1,240" />
                </div>

                <div className="mt-12 p-8 bg-white/5 border border-white/10 rounded-3xl">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    How to use with OBS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/60 leading-relaxed">
                    <div className="flex flex-col gap-3">
                      <p><strong className="text-white">1. The Overlay:</strong> Copy the OBS Link and add it as a "Browser Source" in OBS. Set the width to 1920 and height to 1080.</p>
                      <p><strong className="text-white">2. Cloud Sync:</strong> The translation now travels through the cloud (Firebase). You can have the controller open in your phone, a tablet, or a separate PC, and it will update the OBS overlay instantly.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <p><strong className="text-white">3. Professional Setup:</strong> This architecture is designed for high-performance streaming. No local network or shared browser session is required.</p>
                      <p><strong className="text-white">4. Audio:</strong> Ensure your microphone is active in the controller window to start translating.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
          : 'text-white/20 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="absolute left-16 px-2 py-1 bg-white text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute -left-4 w-1 h-6 bg-white rounded-full"
        />
      )}
    </button>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
      <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-display font-semibold text-white/90">{value}</span>
    </div>
  );
}
