import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Globe, Info, Loader2, Search, Shield, X } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DocsView from './components/DocsView';
import { collectPassiveSnapshot } from './services/reconService';
import { SnapshotReport } from './types';

export type AppView = 'home' | 'docs';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SnapshotReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showContract, setShowContract] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setError(null);
        setReport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!authorized) {
      setError('Confirm that you are authorized to collect public-source observations for this domain.');
      return;
    }

    setError(null);
    setReport(null);
    setLoading(true);
    try {
      setReport(await collectPassiveSnapshot(domain));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Collection could not start.');
    } finally {
      setLoading(false);
    }
  };

  const renderContract = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0B0E14] border border-indigo-500/30 rounded-3xl p-6 md:p-10 max-w-xl w-full shadow-2xl">
        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
          <Shield className="text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Passive collection safety contract</h2>
        <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <li>Only two declared public sources are queried: crt.sh and Cloudflare DNS-over-HTTPS.</li>
          <li>Your target domain is disclosed to those providers. No request is made directly to the target.</li>
          <li>No port probes, crawling, authentication, AI generation, vulnerability checks, or credentials are used.</li>
          <li>Only public-looking domain names are accepted. IP literals, localhost, reserved, and internal-looking names are rejected client-side.</li>
          <li>Observations and source errors remain only in this browser session. You must have authorization for the target.</li>
        </ul>
        <label className="mt-7 flex gap-3 items-start text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} className="mt-1" />
          <span>I confirm I am authorized to request this public-source snapshot and understand the provider egress.</span>
        </label>
        <button
          disabled={!authorized}
          onClick={() => setShowContract(false)}
          className="mt-7 w-full bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-400 hover:bg-indigo-500 text-white font-bold text-sm py-4 rounded-xl transition-all"
        >
          Continue to passive snapshot
        </button>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Bounded analyst snapshot</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Public-source observations, not findings.</h1>
        <p className="text-base text-slate-400 max-w-2xl">Collect a transparent, point-in-time record from declared passive providers. SurfaceX does not assess vulnerabilities, infer security posture, or contact the target.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-[#0F111A] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Public domain</label>
          <div className="mt-2 flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
              <input
                type="text"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="example.com"
                className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button type="submit" disabled={loading || !authorized} className="bg-indigo-600 disabled:bg-slate-700 text-white px-5 rounded-2xl font-bold flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Collect
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex gap-3 text-xs text-amber-100/80 leading-relaxed">
          <Info className="text-amber-400 shrink-0" size={18} />
          <p><strong className="text-amber-300">Egress disclosure:</strong> submitting sends the domain to <code>crt.sh</code> and <code>cloudflare-dns.com</code>. These are passive provider requests; no target host, port, path, or service is contacted.</p>
        </div>
      </form>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ['Passive only', 'No active probes, crawling, or direct target traffic.'],
          ['Provenance first', 'Every displayed value retains source, URL, time, and status.'],
          ['Errors shown', 'Provider failures are preserved; they are never converted into findings.'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-[#0F111A] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-2">{title}</h2>
            <p className="text-xs leading-relaxed text-slate-400">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {showContract && renderContract()}
      {currentView === 'docs' ? <DocsView onBack={() => setCurrentView('home')} /> : report ? <Dashboard report={report} /> : renderSearch()}
      {error && (
        <div className="fixed bottom-6 right-6 max-w-md bg-rose-950 border border-rose-500/30 text-rose-100 p-4 rounded-2xl shadow-xl flex gap-3">
          <AlertCircle className="shrink-0 text-rose-400" size={20} />
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} aria-label="Dismiss error"><X size={18} /></button>
        </div>
      )}
      {report && <button onClick={() => { setReport(null); setDomain(''); }} className="fixed bottom-6 right-6 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-xl flex gap-2 items-center"><CheckCircle2 size={16} /> New snapshot</button>}
    </Layout>
  );
};

export default App;
