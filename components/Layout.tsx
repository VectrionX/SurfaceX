import React, { useState } from 'react';
import { Book, Home, Menu, Shield, X } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, LEGAL_DISCLAIMER } from '../constants';
import { AppView } from '../App';

interface LayoutProps { children: React.ReactNode; currentView: AppView; setCurrentView: (view: AppView) => void; }

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Snapshot', icon: <Home size={19} /> },
    { id: 'docs', label: 'Methodology', icon: <Book size={19} /> },
  ];
  return <div className="min-h-screen bg-[#05050A] text-slate-200 font-sans flex">
    {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/70 z-40 lg:hidden" />}
    <aside className={`fixed lg:relative z-50 inset-y-0 left-0 w-72 bg-[#0B0E14] border-r border-white/5 flex flex-col transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-8"><button onClick={() => { setCurrentView('home'); setMenuOpen(false); }} className="flex items-center gap-3 text-left"><span className="bg-indigo-600 p-2.5 rounded-xl"><Shield size={23} className="text-white" /></span><span><strong className="block text-xl text-white">{APP_NAME}</strong><small className="text-[10px] uppercase tracking-wider text-slate-500">{APP_TAGLINE}</small></span></button></div>
      <nav className="px-4 space-y-2">{navItems.map(item => <button key={item.id} onClick={() => { setCurrentView(item.id); setMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-semibold ${currentView === item.id ? 'bg-indigo-500/15 text-white border border-indigo-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>{item.icon}{item.label}</button>)}</nav>
      <p className="mt-auto p-6 text-[10px] leading-relaxed text-slate-600">{LEGAL_DISCLAIMER}</p>
    </aside>
    <main className="flex-1 min-w-0 h-screen overflow-y-auto"><header className="lg:hidden flex justify-between p-5 border-b border-white/5"><span className="font-bold text-white">{APP_NAME}</span><button aria-label="Open navigation" onClick={() => setMenuOpen(true)}>{menuOpen ? <X /> : <Menu />}</button></header><div className="p-6 lg:p-10 pb-16">{children}</div></main>
  </div>;
};

export default Layout;
