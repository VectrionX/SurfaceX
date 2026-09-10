import React from 'react';
import { ArrowLeft, Book, CheckCircle2, Globe, Shield, XCircle } from 'lucide-react';

interface DocsViewProps { onBack: () => void; }

const DocsView: React.FC<DocsViewProps> = ({ onBack }) => (
  <div className="max-w-4xl mx-auto py-8 space-y-10">
    <header className="flex items-center justify-between border-b border-slate-800 pb-7">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 flex gap-2 items-center"><Book size={14} /> Methodology</p><h1 className="text-3xl font-bold text-white mt-2">SurfaceX observation model</h1></div>
      <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"><ArrowLeft size={16} /> Back</button>
    </header>

    <section className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-7 space-y-3">
      <h2 className="text-xl font-bold text-white flex gap-2 items-center"><Shield className="text-indigo-400" /> Scope</h2>
      <p className="text-sm leading-relaxed text-slate-300">SurfaceX is a bounded analyst snapshot. It records selected public-source responses for one domain at one time. It is not an enterprise attack-surface-management platform, an asset inventory, a vulnerability scanner, or an authorization system.</p>
    </section>

    <section className="grid md:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7"><h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex gap-2 items-center"><CheckCircle2 size={16} /> What happens</h2><ul className="mt-4 space-y-3 text-sm text-slate-400"><li>• The browser validates a public-looking domain.</li><li>• It sends that domain to crt.sh for certificate-name search.</li><li>• It sends that domain to Cloudflare DNS-over-HTTPS for TXT lookup.</li><li>• It resolves up to 25 names returned by crt.sh through the same passive DNS provider for bounded address inventory.</li><li>• It preserves source URL, query time, returned values, empty result, or error state.</li></ul></div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7"><h2 className="text-sm font-bold uppercase tracking-widest text-rose-400 flex gap-2 items-center"><XCircle size={16} /> What does not happen</h2><ul className="mt-4 space-y-3 text-sm text-slate-400"><li>• No target HTTP request, port probe, crawl, or service check.</li><li>• No AI-generated findings, synthetic tool output, severity, score, exploit scenario, or attack path.</li><li>• No credentials, authenticated access, brute force, or vulnerability testing.</li><li>• No server-side database or report retention.</li></ul></div>
    </section>

    <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-7 space-y-4"><h2 className="text-xl font-bold text-white flex gap-2 items-center"><Globe className="text-indigo-400" /> Egress and target safeguards</h2><p className="text-sm leading-relaxed text-slate-400">The input domain leaves the browser for <code>https://crt.sh</code> and <code>https://cloudflare-dns.com</code>. Those provider requests are passive; SurfaceX does not contact the target. Before egress, the client rejects address literals, localhost, reserved suffixes, and private/internal-looking names, plus paths, ports, credentials, queries, and fragments. These checks are guardrails, not a guarantee of public routability or target ownership. The operator must obtain authorization.</p></section>

    <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-7 space-y-4"><h2 className="text-xl font-bold text-white">How to interpret a snapshot</h2><ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-slate-400"><li>Each displayed value is a provider response with provenance, not target-derived proof.</li><li>Certificate names and TXT records do not establish ownership, reachability, security posture, or vulnerability.</li><li>Empty results and source errors are reported explicitly. Neither means the corresponding data or control is absent.</li><li>Provider content and availability can change; rerun only with appropriate authorization and review the new snapshot independently.</li></ul></section>
  </div>
);

export default DocsView;
