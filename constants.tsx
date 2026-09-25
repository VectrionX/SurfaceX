
import React from 'react';
import { 
  Shield, Globe, Server, Lock, Search, FileText, 
  AlertTriangle, Activity, Cloud, Share2, Target, 
  LayoutDashboard, ShieldCheck, Box
} from 'lucide-react';

export const APP_NAME = "SurfaceX";
export const APP_TAGLINE = "Passive Domain Snapshots";

export const MODULES = [
  { id: 'dns', name: 'DNS & Mail', icon: <Globe size={18} /> },
  { id: 'subdomains', name: 'Inventory', icon: <Search size={18} /> },
  { id: 'cloud', name: 'Cloud & SaaS', icon: <Cloud size={18} /> },
  { id: 'ports', name: 'Services', icon: <Server size={18} /> },
  { id: 'web', name: 'Web Entry', icon: <Activity size={18} /> },
  { id: 'paths', name: 'DNS Relationships', icon: <Share2 size={18} /> },
  { id: 'tls', name: 'Encryption', icon: <Lock size={18} /> },
  { id: 'headers', name: 'Headers', icon: <Shield size={18} /> },
  { id: 'compliance', name: 'Compliance', icon: <ShieldCheck size={18} /> },
];

export const RISK_COLORS = {
  Low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  High: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export const LEGAL_DISCLAIMER = "SurfaceX is a passive-first EASM platform. All data is derived from public internet sources and non-intrusive metadata analysis. Unauthorized use for malicious purposes is strictly prohibited. Responsibility for all activities resides solely with the operator.";
