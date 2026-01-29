
import React, { useMemo, useState, useEffect } from 'react';
/* Added CheckCircle2 to imports */
import { 
  Building2, Users, TrendingUp, ShieldCheck, 
  Search, Plus, Activity, Globe, Server, ShieldAlert,
  ChevronRight, ExternalLink, Package, DollarSign, Settings2, 
  X, Save, Layers, BarChart3, Cpu, Zap, Lock, MessageSquare, 
  Link, RefreshCw, Trash2, PlusCircle, LogOut, Copy, Loader2,
  CloudLightning, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrendadoraAccount, ServicePlan } from '../shared/types';
import { persistenceService } from '../services/persistenceService';

interface SuperAdminViewProps {
  onLogout: () => void;
}

const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'arrendadoras' | 'planes'>('dashboard');
  const [tenants, setTenants] = useState<ArrendadoraAccount[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [globalStats, setGlobalStats] = useState<any>({ totalMrr: 0, totalFleet: 0, activeTenants: 0, suspendedTenants: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTenant, setEditingTenant] = useState<ArrendadoraAccount | null>(null);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [stats, tenantsData, plansData] = await Promise.all([
        persistenceService.getSuperStats(),
        persistenceService.getSuperTenants(),
        persistenceService.getSuperPlans()
      ]);
      setGlobalStats(stats);
      setTenants(tenantsData);
      setPlans(plansData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const revenueData = useMemo(() => {
    return plans.map(p => ({
      name: p.name,
      mrr: tenants.filter(t => t.plan === p.name).reduce((acc, curr) => acc + (curr.monthlyRevenue || 0), 0),
      color: p.color === 'amber' ? '#f59e0b' : p.color === 'indigo' ? '#6366f1' : p.color === 'emerald' ? '#10b981' : '#64748b'
    }));
  }, [plans, tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => t.companyName?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, tenants]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[2rem] w-full lg:w-fit border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', label: 'Consola Estratégica', icon: <Cpu className="w-4 h-4" /> },
          { id: 'arrendadoras', label: 'Clientes SaaS', icon: <Users className="w-4 h-4" /> },
          { id: 'planes', label: 'Gestión de Planes', icon: <Layers className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeSubTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-[1.05]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'dashboard' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlobalStatCard title="MRR Consolidado" value={`$${(globalStats.totalMrr / 1000).toFixed(1)}k`} subValue="Facturación Directa DB" icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
            <GlobalStatCard title="Flota Global" value={globalStats.totalFleet.toLocaleString()} subValue="Activos en Red" icon={<Globe className="w-5 h-5" />} color="amber" />
            <GlobalStatCard title="Empresas SaaS" value={globalStats.activeTenants} subValue={`${globalStats.suspendedTenants} Suspendidas`} icon={<Building2 className="w-5 h-5" />} color="indigo" />
            <GlobalStatCard title="Latencia API" value="42ms" subValue="Infraestructura OK" icon={<Zap className="w-5 h-5" />} color="rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase mb-10">Ingresos por Suscripción</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="mrr" radius={[12, 12, 12, 12]} barSize={60}>
                        {revenueData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-8">
               <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-8 italic">Infraestructura Real-time</h4>
               <div className="space-y-6">
                  <StatusItem icon={<Server className="w-4 h-4" />} label="Database Cluster" status="Optimal" color="text-emerald-400" />
                  <StatusItem icon={<MessageSquare className="w-4 h-4" />} label="API Gateway" status="Operational" color="text-emerald-400" />
                  <StatusItem icon={<Lock className="w-4 h-4" />} label="n8n Auth" status="Secure" color="text-blue-400" />
               </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'arrendadoras' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm outline-none transition-all" />
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Suscripción</th>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flota</th>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map(t => (
                    <tr key={t.id} onClick={() => setEditingTenant(t)} className="hover:bg-amber-50/30 transition-all group cursor-pointer">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">{t.companyName.charAt(0)}</div>
                          <p className="font-black text-slate-900">{t.companyName}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl border border-indigo-200 uppercase">{t.plan}</span>
                      </td>
                      <td className="px-10 py-8 font-black text-slate-900">{t.fleetSize} uds</td>
                      <td className="px-10 py-8 text-right"><Settings2 className="w-5 h-5 text-slate-300 group-hover:text-amber-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeSubTab === 'planes' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col group overflow-hidden">
                <div className="p-10 border-b border-slate-50">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${plan.color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Package className="w-7 h-7" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 italic uppercase">{plan.name}</h4>
                  <p className="text-3xl font-black text-slate-900 mt-2">${plan.monthlyPrice}<span className="text-[10px] text-slate-400 ml-1">/mes</span></p>
                </div>
                <div className="p-10 space-y-4">
                  {plan.features.map((f, i) => <div key={i} className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GlobalStatCard = ({ title, value, subValue, icon, color }: any) => {
  const colors: any = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between h-56 hover:-translate-y-1 transition-all">
       <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm ${colors[color]}`}>{icon}</div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
          <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase">{subValue}</p>
       </div>
    </div>
  );
};

const StatusItem = ({ icon, label, status, color }: any) => (
  <div className="flex items-center justify-between group">
     <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 border border-white/5">{icon}</div>
        <p className="text-[11px] font-bold text-slate-300">{label}</p>
     </div>
     <p className={`text-[10px] font-black uppercase ${color}`}>{status}</p>
  </div>
);

export default SuperAdminView;
