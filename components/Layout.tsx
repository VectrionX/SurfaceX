
import React, { useEffect, useRef, useState } from 'react';
import { Shield, Github, Linkedin, Menu, X, Home, Book, FileText, Activity } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, LEGAL_DISCLAIMER } from '../constants';
import { AppView } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMobileMenuOpen) firstNavRef.current?.focus();
    else menuButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) { event.preventDefault(); setIsMobileMenuOpen(false); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'docs', label: 'Documentation', icon: <Book size={20} /> },
    { id: 'risk-model', label: 'Risk Model', icon: <Activity size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside id="surface-nav" className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-72 shrink-0 bg-[#0B0E14] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <button type="button" aria-label="Close navigation" onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
          <X size={20} />
        </button>
        {/* Brand Header */}
        <div className="p-8 pb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer group mb-8 text-left"
            onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setCurrentView('home'); setIsMobileMenuOpen(false); } }}
            aria-label="Go to SurfaceX snapshot"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 rounded-full group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-xl border border-white/10 group-hover:scale-105 transition-transform">
                <Shield className="text-white" size={24} />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-white">{APP_NAME}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{APP_TAGLINE}</p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              ref={index === 0 ? firstNavRef : undefined}
              onClick={() => { setCurrentView(item.id as AppView); setIsMobileMenuOpen(false); }}
              aria-current={currentView === item.id ? 'page' : undefined}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group
                ${currentView === item.id 
                  ? 'bg-gradient-to-r from-indigo-600/10 to-violet-600/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-indigo-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
              `}
            >
              <span className={`${currentView === item.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </button>
          ))}

          <div className="pt-8 mt-8 border-t border-white/5 px-4">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Resources</p>
            <div className="flex flex-col gap-2">
              <a 
                href="https://github.com/VectrionX" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                <Github size={18} /> GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/mag99/" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                <Linkedin size={18} /> LinkedIn
              </a>
            </div>
          </div>
        </nav>

        {/* User / Footer Area */}
        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-b from-indigo-900/20 to-violet-900/10 border border-indigo-500/20 rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
               <Shield size={40} className="text-indigo-500 rotate-12" />
            </div>
            <h4 className="text-white font-bold text-sm mb-1">SurfaceX Pro</h4>
            <p className="text-[10px] text-indigo-300 mb-3">Enterprise Grade Recon</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-500">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-h-screen bg-[#05050A]">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-[#05050A]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Shield className="text-white" size={18} />
             </div>
             <span className="font-bold text-white tracking-tight">{APP_NAME}</span>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={isMobileMenuOpen}
            aria-controls="surface-nav"
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 p-6 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
             {children}
          </div>

          {/* Footer inside content area for layout consistency */}
          <footer className="max-w-7xl mx-auto mt-20 py-8 border-t border-white/5">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
               <div>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                   &copy; {new Date().getFullYear()} {APP_NAME}. <span className="text-indigo-500">Defensive Use Only.</span>
                 </p>
               </div>
               <div className="flex gap-4">
                 <p className="text-[10px] text-slate-600 max-w-md italic">
                   {LEGAL_DISCLAIMER.substring(0, 100)}...
                 </p>
               </div>
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Layout;
