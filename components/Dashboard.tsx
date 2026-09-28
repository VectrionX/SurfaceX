
import React, { useEffect, useState, useRef } from 'react';
import { ReconReport, RiskLevel, ConfidenceLevel, AttackPath, ReconFinding } from '../types';
import { RISK_COLORS } from '../constants';
import { 
  Globe, ExternalLink, Download, ArrowRight, Cloud, Share2, Target, 
  BarChart3, Shield, CheckCircle2, Terminal, X, Zap, ListChecks, 
  Fingerprint, Camera, Eye, Trash2, ImageIcon, Server, ShieldCheck, Sword, ChevronRight,
  FileText, List, Search, Box, Lock, Activity, Printer, Video, AlertTriangle, MoreHorizontal, Plus, Cpu
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, YAxis, AreaChart, Area } from 'recharts';
import ScoreGauge from './ScoreGauge';
import html2canvas from 'html2canvas';

interface DashboardProps {
  report: ReconReport;
}

const Dashboard: React.FC<DashboardProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRemediation, setSelectedRemediation] = useState<ReconFinding | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [findingScreenshots, setFindingScreenshots] = useState<Record<string, string>>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const remediationCloseRef = useRef<HTMLButtonElement>(null);
  const remediationTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedRemediation) return;
    remediationTriggerRef.current = document.activeElement as HTMLElement;
    remediationCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setSelectedRemediation(null); return; }
      if (event.key !== 'Tab') return;
      const dialog = document.getElementById('remediation-dialog');
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      remediationTriggerRef.current?.focus();
    };
  }, [selectedRemediation]);

  if (!report) return null;

  const safeSubdomains = Array.isArray(report.subdomains) ? report.subdomains : [];
  const safeFindings = Array.isArray(report.findings) ? report.findings : [];
  const safeAttackPaths = Array.isArray(report.attackPaths) ? report.attackPaths : [];
  const safeDnsRecords = Array.isArray(report.dnsRecords) ? report.dnsRecords : [];
  const safeSecurityHeaders = Array.isArray(report.securityHeaders) ? report.securityHeaders : [];
  const safeDimensions = report.dimensions || { initialAccess: 0, lateralMovement: 0, dataExposure: 0, brandReputation: 0 };

  // Data for "Asset Distribution" chart (similar to "Spending" in reference)
  const assetData = safeSubdomains.reduce((acc: any[], sd) => {
    if (!sd || !sd.category) return acc;
    const catName = sd.category.charAt(0).toUpperCase() + sd.category.slice(1);
    const existing = acc.find(item => item.name === catName);
    if (existing) existing.count++;
    else acc.push({ name: catName, count: 1 });
    return acc;
  }, []);

  // Data for "Exposure Trend" area chart (simulated based on dimension scores)
  const exposureTrendData = [
    { name: 'IA', value: safeDimensions.initialAccess * 0.8 },
    { name: 'LM', value: safeDimensions.lateralMovement * 0.9 },
    { name: 'DE', value: safeDimensions.dataExposure },
    { name: 'BR', value: safeDimensions.brandReputation * 1.1 },
    { name: 'Agg', value: report.overallScore },
  ];

  const downloadScreenshot = (id: string) => {
    const dataUrl = findingScreenshots[id];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `surfacex-proof-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCaptureScreenshot = async (targetFinding?: ReconFinding) => {
    const finding = targetFinding || selectedRemediation;
    if (!finding) return;
    
    setCapturing(true);
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:9999;opacity:0.8;pointer-events:none;transition:opacity 0.4s ease-out;';
    document.body.appendChild(flash);

    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(document.body, {
        backgroundColor: '#020617',
        scale: 2, 
        logging: false,
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setFindingScreenshots(prev => ({
        ...prev,
        [finding.id]: dataUrl
      }));

      requestAnimationFrame(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
      });
    } catch (error) {
      console.error("Snapshot capture failed:", error);
      flash.remove();
    } finally {
      setCapturing(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const Tabs = () => (
    <div className="flex items-center gap-1 bg-[#0F111A] p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto print:hidden">
      {[
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
        { id: 'assets', label: 'Assets', icon: <Globe size={14} /> },
        { id: 'findings', label: 'Findings', icon: <Target size={14} /> },
        { id: 'dns', label: 'Network', icon: <Server size={14} /> }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap
            ${activeTab === tab.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Risk Score Card (Top Left) */}
      <div className="col-span-1 bg-[#0F111A] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Risk Posture</h3>
            <p className="text-xs text-slate-500">Overall Security Score</p>
          </div>
          <button className="p-2 bg-[#0B0E14] rounded-xl text-slate-400 hover:text-white transition-colors">
            <Activity size={16} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center py-4">
           <ScoreGauge score={report.overallScore || 0} />
        </div>

        <div className="mt-4 bg-[#0B0E14] rounded-2xl p-4 flex items-center justify-between">
           <span className="text-xs font-medium text-slate-400">Status</span>
           <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${RISK_COLORS[report.riskLevel]}`}>
             {report.riskLevel} Risk
           </span>
        </div>
      </div>

      {/* 2. Executive Summary (Top Middle - Wide) */}
      <div className="col-span-1 lg:col-span-2 bg-[#0F111A] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all" />
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
               <Cpu size={18} className="text-white" />
             </div>
             <div>
               <h3 className="text-white font-bold text-lg">Passive Snapshot Summary</h3>
               <p className="text-xs text-indigo-300">Provider observations</p>
             </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-slate-300 leading-loose font-medium">
              "{report.summary || 'Strategic overview pending completion of scan telemetry. Ensure all probes have completed successfully.'}"
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex gap-12">
             <div>
               <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Impact</span>
               <span className="text-xl font-bold text-white">{report.findings.length} <span className="hidden sm:inline">Findings</span></span>
             </div>
             <div>
               <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Assets</span>
               <span className="text-xl font-bold text-white">{report.subdomains.length} <span className="hidden sm:inline">Nodes</span></span>
             </div>
          </div>
        </div>
      </div>

      {/* 3. Exposure Dimensions Chart (Middle Left) */}
      <div className="col-span-1 lg:col-span-2 bg-[#0F111A] border border-white/5 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg">Exposure Trend</h3>
          <div className="flex gap-2">
             <span className="px-3 py-1 rounded-lg bg-[#0B0E14] text-[10px] font-bold text-slate-400 border border-white/5">This Scan</span>
          </div>
        </div>
        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={exposureTrendData}>
               <defs>
                 <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
               <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
               <Tooltip 
                 contentStyle={{backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff'}}
                 itemStyle={{color: '#818cf8'}}
                 cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1}}
               />
               <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Asset Distribution (Middle Right) */}
      <div className="col-span-1 bg-[#0F111A] border border-white/5 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg">Assets</h3>
          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"><MoreHorizontal size={16} /></button>
        </div>
        <div className="space-y-4">
           {assetData.slice(0, 4).map((item, idx) => (
             <div key={idx} className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                     <Server size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.count}</span>
             </div>
           ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/5">
           <button onClick={() => setActiveTab('assets')} className="w-full py-3 rounded-xl bg-[#0B0E14] text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
             View All Assets
           </button>
        </div>
      </div>

      {/* 5. High Priority Findings (Bottom Full Width) */}
      <div className="col-span-1 lg:col-span-3 bg-[#0F111A] border border-white/5 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-white font-bold text-lg">Critical Findings</h3>
             <p className="text-xs text-slate-500">Requires immediate attention</p>
           </div>
           <button onClick={() => setActiveTab('findings')} className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors">
             <ArrowRight size={16} />
           </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {safeFindings.slice(0, 3).map((finding) => (
             <div key={finding.id} className="bg-[#0B0E14] border border-white/5 p-5 rounded-2xl hover:border-indigo-500/30 transition-all group cursor-pointer" onClick={() => setSelectedRemediation(finding)}>
                <div className="flex justify-between items-start mb-3">
                   <div className={`p-1.5 rounded-lg ${finding.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <AlertTriangle size={16} />
                   </div>
                   <span className="text-[10px] font-mono text-slate-500">{finding.id}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{finding.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{finding.description}</p>
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                   <span className="flex items-center gap-1"><Globe size={10} /> {finding.affectedAsset}</span>
                   <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">Details &rarr;</span>
                </div>
             </div>
           ))}
           {safeFindings.length === 0 && (
             <div className="col-span-full py-8 text-center text-slate-500 text-sm font-medium italic bg-[#0B0E14] rounded-2xl border border-dashed border-white/10">
               No critical findings detected.
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="bg-[#0F111A] border border-white/5 rounded-3xl overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <div>
           <h3 className="text-white font-bold text-lg">Asset Inventory</h3>
           <p className="text-xs text-slate-500">Discovered digital footprint</p>
        </div>
        <div className="flex gap-2">
           <button className="p-2 bg-[#0B0E14] rounded-lg text-slate-400 hover:text-white border border-white/5"><Search size={16}/></button>
           <button className="p-2 bg-[#0B0E14] rounded-lg text-slate-400 hover:text-white border border-white/5"><List size={16}/></button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0E14] text-slate-500 uppercase font-mono tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">Endpoint</th>
              <th className="px-6 py-4 font-bold">IP Address</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Ports</th>
              <th className="px-6 py-4 font-bold">Provider</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {safeSubdomains.map((sd, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-indigo-500/10 rounded text-indigo-400"><Globe size={14} /></div>
                      <span className="font-bold text-white font-mono">{sd.name}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono">{sd.ip}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-lg bg-[#0B0E14] text-slate-300 border border-white/10 text-[10px] uppercase font-bold">
                    {sd.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {sd.ports.map(p => (
                      <span key={p} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {p}
                      </span>
                    ))}
                    {sd.ports.length === 0 && <span className="text-slate-600 italic">None</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400 font-medium">{sd.provider || 'Unidentified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFindingsList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeFindings.map((finding) => (
          <div key={finding.id} className="bg-[#0F111A] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
               <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${RISK_COLORS[finding.severity]}`}>
                 {finding.severity}
               </span>
               <button onClick={() => setSelectedRemediation(finding)} className="text-slate-500 hover:text-white transition-colors">
                 <MoreHorizontal size={16} />
               </button>
            </div>
            
            <h3 className="text-white font-bold text-lg mb-2 leading-snug group-hover:text-indigo-400 transition-colors">
              {finding.title}
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-1">
              {finding.description}
            </p>
            
            <div className="mt-auto pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
               <div>
                 <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Asset</span>
                 <span className="text-xs font-mono text-indigo-300 truncate block max-w-[100px]">{finding.affectedAsset}</span>
               </div>
               <div className="flex justify-end items-end">
                 <button 
                   onClick={() => setSelectedRemediation(finding)}
                   className="p-2 bg-[#0B0E14] hover:bg-indigo-600 hover:text-white text-slate-400 rounded-xl transition-all"
                 >
                   <ArrowRight size={16} />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Reusing DNS and Compliance renderers but updating containers
  const renderDNS = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      <div className="col-span-1 lg:col-span-2 bg-[#0F111A] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Search size={18} className="text-indigo-500" /> DNS Zone
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0E14] text-slate-500 font-mono uppercase">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {safeDnsRecords.map((rec, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-6 py-4 font-bold text-indigo-400 font-mono">{rec.type}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono break-all">{rec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-[#0F111A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-500" /> Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.techStack.map((tech, i) => (
              <span key={i} className="px-3 py-1.5 bg-[#0B0E14] border border-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
                <Box size={12} className="text-indigo-500" /> {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8" ref={reportRef}>
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="truncate w-full lg:w-auto">
           <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Target Overview</h1>
           <p className="text-sm text-slate-500 font-medium truncate">Domain: <span className="text-indigo-400 font-mono">{report.domain}</span></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto overflow-x-auto">
          <Tabs />
          <div className="h-8 w-px bg-white/10 hidden md:block mx-2" />
          <button 
            onClick={handleExportPDF}
            className="p-2.5 bg-[#0F111A] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all flex items-center justify-center min-w-[40px]"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="print:block min-h-[60vh]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'assets' && renderAssets()}
        {activeTab === 'findings' && renderFindingsList()}
        {activeTab === 'dns' && renderDNS()}
      </div>

      {/* Modal - Remediation Blueprint */}
      {selectedRemediation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden print:hidden" role="presentation">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedRemediation(null)} />
          <div id="remediation-dialog" role="dialog" aria-modal="true" aria-labelledby="remediation-title" className="relative w-full max-w-3xl bg-[#0F111A] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0B0E14]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${selectedRemediation.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <h3 className="text-white font-bold text-sm uppercase tracking-wider">Remediation Blueprint</h3>
                   <p className="text-[10px] text-slate-500 font-mono">{selectedRemediation.id}</p>
                </div>
              </div>
              <button ref={remediationCloseRef} aria-label="Close remediation details" onClick={() => setSelectedRemediation(null)} className="p-2 bg-[#0F111A] text-slate-400 rounded-xl hover:text-white hover:bg-white/5 transition-colors"><X size={20} /></button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border mb-3 inline-block ${RISK_COLORS[selectedRemediation.severity]}`}>{selectedRemediation.severity} Severity</span>
                <h2 id="remediation-title" className="text-3xl font-bold text-white leading-tight mb-3">{selectedRemediation.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-[#0B0E14] p-2 rounded-lg inline-flex border border-white/5">
                  <Globe size={14} className="text-indigo-500" /> {selectedRemediation.affectedAsset}
                </div>
              </div>

              <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Sword size={64} className="text-rose-500" />
                </div>
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   Defensive Context
                </h4>
                <p className="text-sm text-rose-100/80 leading-relaxed italic relative z-10">
                  "{selectedRemediation.threatActorContext}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0B0E14] border border-white/5 p-5 rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12} /> Technical Evidence</h4>
                  <div className="font-mono text-[11px] text-indigo-400 break-all leading-relaxed">
                    {selectedRemediation.evidence}
                  </div>
                </div>
                <div className="bg-[#0B0E14] border border-white/5 p-5 rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Target size={12} /> Risk Impact</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedRemediation.impact}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-900/10 to-violet-900/10 border border-indigo-500/20 p-6 rounded-2xl">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ListChecks size={18} /> Recommended Action</h4>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedRemediation.recommendation}</p>
              </div>
            </div>
            
            <div className="p-6 bg-[#0B0E14] border-t border-white/5 flex justify-end gap-3">
               <button 
                  onClick={() => handleCaptureScreenshot(selectedRemediation)}
                  disabled={capturing}
                  className="px-6 py-3 bg-[#0F111A] text-slate-300 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 flex items-center gap-2 transition-all"
                >
                  <Camera size={14} /> {capturing ? 'Saving...' : 'Proof'}
                </button>
              <button onClick={() => setSelectedRemediation(null)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .bg-\\[\\#0F111A\\], .bg-\\[\\#0B0E14\\] { background: #fff !important; border: 1px solid #ccc !important; }
          .text-white, .text-slate-200, .text-slate-300 { color: #000 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
