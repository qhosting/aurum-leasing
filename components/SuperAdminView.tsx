
import React, { useMemo, useState } from 'react';
import { 
  Building2, Users, TrendingUp, ShieldCheck, 
  MoreVertical, Search, Plus, Filter, 
  Activity, Globe, Server, ShieldAlert,
  ChevronRight, ExternalLink, Ban, CheckCircle2,
  Package, DollarSign, Settings2, Sparkles, Check,
  X, Save, Hash, Layers, Palette, BarChart3, 
  Cpu, Zap, HardDrive, Wifi, Lock, Terminal, MessageSquare,
  Link, RefreshCw, Trash2, PlusCircle, LogOut, Copy,
  CheckCircle, 
  CloudLightning
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_TENANTS, MOCK_PLANS } from '../constants';
import { ArrendadoraAccount, ServicePlan } from '../types';

interface SuperAdminViewProps {
  onLogout: () => void;
}

const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'arrendadoras' | 'planes'>('dashboard');
  const [tenants, setTenants] = useState<ArrendadoraAccount[]>(MOCK_TENANTS);
  const [plans, setPlans] = useState<ServicePlan[]>(MOCK_PLANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTenant, setEditingTenant] = useState<ArrendadoraAccount | null>(null);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [newFeature, setNewFeature] = useState('');

  // Estadísticas globales y por plan
  const revenueData = useMemo(() => {
    return plans.map(p => ({
      name: p.name,
      mrr: tenants.filter(t => t.plan === p.name).reduce((acc, curr) => acc + curr.monthlyRevenue, 0),
      color: p.color === 'amber' ? '#f59e0b' : p.color === 'indigo' ? '#6366f1' : p.color === 'emerald' ? '#10b981' : '#64748b'
    }));
  }, [plans, tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => t.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, tenants]);

  const globalStats = useMemo(() => ({
    totalMrr: tenants.reduce((acc, t) => acc + t.monthlyRevenue, 0),
    totalFleet: tenants.reduce((acc, t) => acc + t.fleetSize, 0),
    activeTenants: tenants.filter(t => t.status === 'active').length,
    suspendedTenants: tenants.filter(t => t.status === 'suspended').length
  }), [tenants]);

  // --- LÓGICA DE TENANTS ---
  const handleUpdateTenantSettings = (id: string, updates: Partial<ArrendadoraAccount['integrationSettings']>) => {
    setTenants(prev => prev.map(t => 
      t.id === id ? { ...t, integrationSettings: { ...t.integrationSettings, ...updates } } : t
    ));
    if (editingTenant?.id === id) {
      setEditingTenant(prev => prev ? ({
        ...prev,
        integrationSettings: { ...prev.integrationSettings, ...updates }
      }) : null);
    }
  };

  // --- LÓGICA DE PLANES ---
  const handleSavePlan = () => {
    if (!editingPlan) return;
    if (plans.find(p => p.id === editingPlan.id)) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? editingPlan : p));
    } else {
      setPlans(prev => [...prev, editingPlan]);
    }
    setEditingPlan(null);
  };

  const duplicatePlan = (plan: ServicePlan) => {
    const newPlan = {
      ...plan,
      id: Math.random().toString(36).substr(2, 9),
      name: `${plan.name} (Copia)`,
      activeSubscribers: 0
    };
    setPlans([...plans, newPlan]);
  };

  const initiateNewPlan = () => {
    setEditingPlan({
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nuevo Plan Premium',
      monthlyPrice: 299,
      maxFleetSize: 50,
      features: ['Gestión de Flota Básica'],
      activeSubscribers: 0,
      color: 'slate'
    });
  };

  const addFeature = () => {
    if (!newFeature.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()]
    });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index)
    });
  };

  const labelStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block";
  const inputStyles = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all";

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Navegación de Sub-módulos */}
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
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'dashboard' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlobalStatCard title="MRR Consolidado" value={`$${(globalStats.totalMrr / 1000).toFixed(1)}k`} subValue="+12.5% vs mes anterior" icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
            <GlobalStatCard title="Flota Global" value={globalStats.totalFleet.toLocaleString()} subValue="Activos en Red" icon={<Globe className="w-5 h-5" />} color="amber" />
            <GlobalStatCard title="Empresas SaaS" value={globalStats.activeTenants} subValue={`${globalStats.suspendedTenants} Suspendidas`} icon={<Building2 className="w-5 h-5" />} color="indigo" />
            <GlobalStatCard title="Latencia API" value="42ms" subValue="Infraestructura OK" icon={<Zap className="w-5 h-5" />} color="rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Mix de Ingresos por Suscripción</h3>
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="mrr" radius={[12, 12, 12, 12]} barSize={60}>
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AUDITORÍA DE FUNCIONES DE PLANES */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-10">
                    <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl shadow-lg">
                       <CloudLightning className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">AuditorÍA de Capacidades</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Validación técnica de módulos en planes</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                       { name: 'Gestión Inventario (Basic)', status: 'Implementado', detail: 'FleetView CRUD OK', color: 'emerald' },
                       { name: 'Portal PWA Chofer (Basic)', status: 'Implementado', detail: 'ArrendatarioView OK', color: 'emerald' },
                       { name: 'IA Preventiva (Pro)', status: 'Implementado', detail: 'Gemini Lite/Pro Engine', color: 'emerald' },
                       { name: 'Conciliación n8n (Pro)', status: 'Implementado', detail: 'FinanceView Trigger OK', color: 'emerald' },
                       { name: 'White Labeling (Enterprise)', status: 'En Pruebas', detail: 'CompanySettings DNS', color: 'amber' },
                       { name: 'Telemetría Geotab (Pro)', status: 'Deshabilitado', detail: 'Módulo Oculto', color: 'slate' },
                    ].map((item, i) => (
                       <div key={i} className={`p-5 rounded-2xl flex items-center justify-between border ${item.status === 'Deshabilitado' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                          <div>
                             <p className={`text-xs font-black ${item.status === 'Deshabilitado' ? 'text-slate-400' : 'text-slate-900'}`}>{item.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{item.detail}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                             item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             item.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                             'bg-slate-200 text-slate-500 border-slate-300'
                          }`}>
                             {item.status}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-8 italic">Infraestructura Global</h4>
                 <div className="space-y-6">
                    <StatusItem icon={<Server className="w-4 h-4" />} label="Database Cluster" status="Optimal" color="text-emerald-400" />
                    <StatusItem icon={<MessageSquare className="w-4 h-4" />} label="API Waha Gateway" status="Operational" color="text-emerald-400" />
                    <StatusItem icon={<Lock className="w-4 h-4" />} label="n8n Webhook Auth" status="Secure" color="text-blue-400" />
                    <StatusItem icon={<Wifi className="w-4 h-4" />} label="CDN Global Edge" status="Fast" color="text-emerald-400" />
                 </div>
                 <div className="pt-8 border-t border-white/10">
                    <button 
                      onClick={onLogout}
                      className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión Administrador
                    </button>
                 </div>
               </div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'arrendadoras' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar arrendadora..." 
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                />
              </div>
              <button className="px-8 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-3">
                <Plus className="w-4 h-4 text-amber-500" /> Registrar Nuevo Tenant
              </button>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
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
                      <tr 
                        key={t.id} 
                        onClick={() => setEditingTenant(t)}
                        className="hover:bg-amber-50/30 transition-all group cursor-pointer"
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${t.status === 'active' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400'}`}>
                              {t.companyName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base group-hover:text-amber-600 transition-colors uppercase italic tracking-tighter">{t.companyName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">ID: {t.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            t.plan === 'Enterprise' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 
                            t.plan === 'Pro' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                            'border-slate-200 bg-slate-50 text-slate-500'
                          }`}>
                            {t.plan}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-sm font-black text-slate-900">{t.fleetSize} <span className="text-[10px] text-slate-400 font-medium tracking-tight">Unidades</span></p>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <Settings2 className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'planes' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Modelos de Suscripción</h3>
            <button 
              onClick={initiateNewPlan}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl"
            >
              <PlusCircle className="w-4 h-4" /> Crear Nuevo Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden group hover:border-amber-500/50 transition-all">
                <div className="p-10 border-b border-slate-50">
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-4 rounded-[1.5rem] shadow-inner ${
                      plan.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                      plan.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                      plan.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Package className="w-7 h-7" />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => duplicatePlan(plan)}
                        className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-all"
                        title="Duplicar Plan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-black text-slate-900 mb-2 italic uppercase tracking-tighter">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">${plan.monthlyPrice}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ Pago Mensual</span>
                  </div>
                </div>

                <div className="p-10 flex-1 space-y-8">
                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresas en Plan</p>
                        <p className="text-xl font-black text-slate-900">{plan.activeSubscribers}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MRR Plan</p>
                        <p className="text-xl font-black text-emerald-600">${(plan.activeSubscribers * plan.monthlyPrice).toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Features Incluidos:</p>
                    {plan.features.slice(0, 5).map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={4} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{feat}</span>
                      </div>
                    ))}
                    {plan.features.length > 5 && (
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">+ {plan.features.length - 5} características más</p>
                    )}
                  </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingPlan(plan)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl group"
                  >
                    <Settings2 className="w-4 h-4 text-amber-500 group-hover:text-slate-900" /> Gestionar Parámetros
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL EDITOR DE PLAN --- */}
      {editingPlan && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setEditingPlan(null)}></div>
          <div className="relative w-full lg:max-w-2xl bg-white h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
            <div className="p-10 lg:p-14 bg-slate-900 text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                  <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black text-2xl shadow-2xl ${
                    editingPlan.color === 'amber' ? 'bg-amber-500 text-slate-900' :
                    editingPlan.color === 'indigo' ? 'bg-indigo-500 text-white' :
                    editingPlan.color === 'emerald' ? 'bg-emerald-500 text-white' :
                    'bg-slate-500 text-white'
                  }`}>
                    <Package className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter italic uppercase">{editingPlan.name}</h3>
                    <p className="text-amber-500 font-bold uppercase text-[9px] tracking-[0.3em] mt-2">Configuración de Producto SaaS</p>
                  </div>
                </div>
                <button onClick={() => setEditingPlan(null)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 lg:p-14 space-y-12 pb-40 no-scrollbar">
              <section className="space-y-8">
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-100 pb-4">
                   Comercialización
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className={labelStyles}>Nombre del Nivel</label>
                    <input className={inputStyles} value={editingPlan.name} onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyles}>Identidad Visual</label>
                    <select className={inputStyles} value={editingPlan.color} onChange={(e) => setEditingPlan({...editingPlan, color: e.target.value as any})}>
                      <option value="slate">Slate (Basic)</option>
                      <option value="amber">Amber (Pro)</option>
                      <option value="indigo">Indigo (Enterprise)</option>
                      <option value="emerald">Emerald (Custom)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyles}>Precio Mensual ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="number" className={`${inputStyles} pl-10`} value={editingPlan.monthlyPrice} onChange={(e) => setEditingPlan({...editingPlan, monthlyPrice: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyles}>Límite de Unidades</label>
                    <input type="number" className={inputStyles} value={editingPlan.maxFleetSize} onChange={(e) => setEditingPlan({...editingPlan, maxFleetSize: Number(e.target.value)})} />
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-100 pb-4">
                   Features & Capacidades
                </h5>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input 
                      placeholder="Ej: Reportes IA Gemini Pro"
                      className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-amber-500"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    />
                    <button 
                      onClick={addFeature}
                      className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {editingPlan.features.map((feat, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 px-5 py-3 bg-slate-100 border border-slate-200 rounded-xl group">
                        <span className="text-xs font-bold text-slate-700">{feat}</span>
                        <button onClick={() => removeFeature(i)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="pt-10 space-y-4">
                 <button 
                  onClick={handleSavePlan}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
                >
                  <Save className="w-5 h-5 text-amber-500" /> Confirmar Configuración de Plan
                </button>
                <button 
                  onClick={() => {
                    if(confirm("¿Estás seguro de eliminar este plan?")) {
                      setPlans(plans.filter(p => p.id !== editingPlan.id));
                      setEditingPlan(null);
                    }
                  }}
                  className="w-full py-4 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                >
                  Eliminar permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TENANT EDIT DRAWER (Integraciones por Cliente) --- */}
      {editingTenant && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setEditingTenant(null)}></div>
          <div className="relative w-full lg:max-w-2xl bg-white h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 lg:p-12 bg-slate-900 text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 bg-amber-500 text-slate-900 rounded-[1.8rem] flex items-center justify-center font-black text-2xl shadow-2xl">
                    {editingTenant.companyName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none">{editingTenant.companyName}</h3>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-3">Configuración multi-tenant de API</p>
                  </div>
                </div>
                <button onClick={() => setEditingTenant(null)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 pb-32">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><MessageSquare className="w-5 h-5" /></div>
                  <h5 className="font-black text-slate-900 text-lg">WhatsApp Individual (API Waha)</h5>
                </div>
                
                <div className="grid grid-cols-1 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Waha URL</label>
                     <div className="relative">
                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="text" 
                          placeholder="https://su-waha.com"
                          className="w-full pl-11 pr-5 py-4 bg-white border border-slate-200 rounded-2xl font-mono text-xs font-bold outline-none focus:border-amber-500 transition-all"
                          value={editingTenant.integrationSettings.wahaUrl}
                          onChange={(e) => handleUpdateTenantSettings(editingTenant.id, { wahaUrl: e.target.value })}
                        />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key / Token</label>
                     <input 
                        type="password" 
                        placeholder="••••••••••••••••"
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-mono text-xs font-bold outline-none focus:border-amber-500 transition-all"
                        value={editingTenant.integrationSettings.wahaToken}
                        onChange={(e) => handleUpdateTenantSettings(editingTenant.id, { wahaToken: e.target.value })}
                      />
                   </div>
                   <button className="flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase tracking-widest py-2 hover:opacity-70 transition-opacity">
                     <RefreshCw className="w-3 h-3" /> Test Connection
                   </button>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Link className="w-5 h-5" /></div>
                  <h5 className="font-black text-slate-900 text-lg">Workflows Dinámicos (n8n)</h5>
                </div>
                
                <div className="grid grid-cols-1 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom n8n Webhook</label>
                     <input 
                        type="text" 
                        placeholder="https://n8n.cliente.com/webhook/..."
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-mono text-xs font-bold outline-none focus:border-amber-500 transition-all"
                        value={editingTenant.integrationSettings.n8nWebhook}
                        onChange={(e) => handleUpdateTenantSettings(editingTenant.id, { n8nWebhook: e.target.value })}
                      />
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 leading-relaxed bg-white p-4 rounded-xl border border-slate-100">
                     Este endpoint recibirá payloads de: <b>PAYMENT_VERIFIED</b>, <b>MAINTENANCE_ALERT</b> y <b>NEW_CONTRACT</b> de forma exclusiva para esta Arrendadora.
                   </p>
                </div>
              </section>

              <button 
                onClick={() => setEditingTenant(null)}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
              >
                <Save className="w-5 h-5 text-amber-500" /> Guardar Cambios Técnicos
              </button>
            </div>
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
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between h-56 hover:shadow-xl hover:-translate-y-1 transition-all">
       <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm ${colors[color]}`}>{icon}</div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest flex items-center gap-2 italic">
            <span className={`w-1.5 h-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            {subValue}
          </p>
       </div>
    </div>
  );
};

const StatusItem = ({ icon, label, status, color }: any) => (
  <div className="flex items-center justify-between group">
     <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-white transition-colors border border-white/5">{icon}</div>
        <p className="text-[11px] font-bold text-slate-300">{label}</p>
     </div>
     <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</p>
  </div>
);

export default SuperAdminView;
