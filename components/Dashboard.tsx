import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Globe, Info, Shield, XCircle } from 'lucide-react';
import { SnapshotReport, SourceObservation } from '../types';

interface DashboardProps {
  report: SnapshotReport;
}

const statusStyle: Record<SourceObservation['status'], string> = {
  success: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  empty: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  error: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
};

const StatusIcon = ({ status }: { status: SourceObservation['status'] }) => status === 'success'
  ? <CheckCircle2 size={16} />
  : status === 'error' ? <XCircle size={16} /> : <Info size={16} />;

const Dashboard: React.FC<DashboardProps> = ({ report }) => (
  <div className="max-w-5xl mx-auto space-y-6">
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Passive observation snapshot</p>
        <h1 className="text-3xl font-bold text-white mt-2">{report.target}</h1>
        <p className="text-sm text-slate-400 mt-2 flex gap-2 items-center"><Clock size={14} /> Collected {new Date(report.collectedAt).toLocaleString()}</p>
      </div>
      <div className="text-xs text-slate-400">No risk score · No generated findings · No direct target connection</div>
    </header>

    <section className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6">
      <div className="flex gap-3 items-start">
        <Shield className="text-indigo-400 shrink-0" size={22} />
        <div>
          <h2 className="text-white font-bold">Collection contract</h2>
          <p className="text-sm text-slate-400 mt-1">{report.contract.mode} collection. Target authorization is required; credentials are not accepted; observations stay in browser memory for this session.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-slate-300">Active probing: no</span>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-slate-300">Direct target traffic: no</span>
            {report.contract.egressDestinations.map(destination => <span key={destination} className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-amber-200">Egress: {destination}</span>)}
          </div>
        </div>
      </div>
    </section>

    {report.errors.length > 0 && (
      <section className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6">
        <h2 className="text-rose-200 font-bold flex gap-2 items-center"><AlertTriangle size={18} /> Source errors ({report.errors.length})</h2>
        <ul className="mt-3 space-y-2 text-sm text-rose-100/80">{report.errors.map(error => <li key={`${error.sourceId}-${error.occurredAt}`}>{error.sourceId}: {error.message} ({new Date(error.occurredAt).toLocaleString()})</li>)}</ul>
      </section>
    )}

    <section className="space-y-4">
      <div><h2 className="text-xl font-bold text-white">Resolved public names</h2><p className="text-sm text-slate-400 mt-1">A bounded inventory of A answers for names returned by crt.sh. These are provider responses, not proof that a host is reachable.</p></div>
      {report.assetObservations.length === 0 ? <div className="bg-[#0F111A] border border-white/10 rounded-3xl p-6 text-sm text-slate-500">No in-scope certificate names were available for passive DNS resolution.</div> : report.assetObservations.map(asset => (
        <article key={asset.hostname} className="bg-[#0F111A] border border-white/10 rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-3">
            <div><h3 className="text-white font-bold">{asset.hostname}</h3><a href={asset.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex gap-1 items-center text-xs text-indigo-300 break-all">Provider query <ExternalLink size={12} /></a></div>
            <span className={`h-fit border rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusStyle[asset.status]}`}>{asset.status}</span>
          </div>
          {asset.note && <p className="mt-3 text-sm text-slate-400">{asset.note}</p>}
          {asset.addresses.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{asset.addresses.map(address => <li key={address} className="rounded-lg bg-[#0B0E14] border border-white/5 px-3 py-2 font-mono text-xs text-slate-300">{address}</li>)}</ul>}
        </article>
      ))}
    </section>

    <section className="space-y-4">
      {report.observations.map(observation => (
        <article key={observation.sourceId} className="bg-[#0F111A] border border-white/10 rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div>
              <div className="flex gap-2 items-center"><Globe size={18} className="text-indigo-400" /><h3 className="text-white font-bold">{observation.sourceName}</h3></div>
              <p className="text-xs text-slate-400 mt-2">{observation.egressDisclosure}</p>
              <a href={observation.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex gap-1 items-center text-xs text-indigo-300 hover:text-indigo-200 break-all">Provider query <ExternalLink size={12} /></a>
            </div>
            <span className={`h-fit inline-flex gap-2 items-center border rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusStyle[observation.status]}`}><StatusIcon status={observation.status} />{observation.status}</span>
          </div>
          <p className="text-xs text-slate-500 mt-4">Queried {new Date(observation.queriedAt).toLocaleString()} · {observation.classification}</p>
          {observation.note && <p className="mt-3 text-sm text-slate-300">{observation.note}</p>}
          {observation.records.length > 0 && <ul className="mt-4 space-y-2">{observation.records.map((record, index) => <li key={`${record.kind}-${record.value}-${index}`} className="bg-[#0B0E14] border border-white/5 rounded-xl p-3"><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{record.kind}</span><code className="block mt-1 text-xs text-slate-300 break-all whitespace-pre-wrap">{record.value}</code></li>)}</ul>}
        </article>
      ))}
    </section>

    <section className="bg-slate-900/50 border border-white/10 rounded-3xl p-6">
      <h2 className="text-white font-bold">Interpretation limits</h2>
      <ul className="mt-3 list-disc pl-5 space-y-2 text-sm leading-relaxed text-slate-400">{report.limitations.map(limitation => <li key={limitation}>{limitation}</li>)}</ul>
    </section>
  </div>
);

export default Dashboard;
