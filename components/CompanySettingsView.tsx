import React, { useState, useEffect } from 'react';
import {
  Building2, Save, Globe, Palette, DollarSign,
  Bell, ShieldCheck, Mail, Phone, MapPin,
  CreditCard, ChevronRight, Image as ImageIcon,
  CheckCircle, Zap, ChevronLeft, Briefcase,
  Share2, MessageSquare, Code2, Link, Terminal, Check,
  LogOut, Calendar, Receipt, ExternalLink, Loader2
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';

interface CompanySettingsViewProps {
  onLogout: () => void;
}

const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'notificaciones' | 'integraciones' | 'suscripcion'>('perfil');
  const [tenant, setTenant] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Presuming we have tenant_id in local storage or session
    const userData = JSON.parse(localStorage.getItem('aurum_user') || '{}');
    if (userData.tenant_id) {
      const t = await persistenceService.getTenantDetails(userData.tenant_id);
      setTenant(t);
      const inv = await persistenceService.getInvoices(userData.tenant_id);
      setInvoices(inv);
      const p = await persistenceService.getSuperPlans();
      setPlans(p);
    }
    setLoading(false);
  };

  const handleUpgrade = async (planId: string) => {
    if (!tenant) return;
    if (confirm('¿Deseas cambiar tu plan? Se generará un cargo prorrateado.')) {
      setLoading(true);
      const res = await persistenceService.upgradePlan(tenant.id, planId);
      if (res.success) {
        alert('Plan actualizado correctamente');
        fetchData();
      }
      setLoading(false);
    }
  };

  const labelBaseStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block";
  const inputBaseStyles = "w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-900 font-bold placeholder:text-slate-400 outline-none transition-all focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 shadow-sm font-mono text-xs";

  return (
    <div className="space-y-8 pb-24">
      {/* Settings Nav */}
      <div className="relative -mx-6 px-6 lg:mx-0 lg:px-0">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.8rem] w-full lg:w-fit border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
          {[
            { id: 'perfil', label: 'Empresa & Marca', icon: <Building2 className="w-4 h-4" /> },
            { id: 'suscripcion', label: 'Plan & Facturación', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'notificaciones', label: 'Alertas de Flota', icon: <Bell className="w-4 h-4" /> },
            { id: 'integraciones', label: 'Conectividad & API', icon: <Share2 className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-lg scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : (
              <>
                {activeTab === 'perfil' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                      <div className="w-32 h-32 bg-white rounded-3xl border-4 border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-amber-400 hover:text-amber-500 cursor-pointer transition-all shadow-xl group">
                        <ImageIcon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-center md:text-left space-y-2">
                        <h5 className="font-black text-xl text-slate-900 tracking-tight">Logotipo Corporativo</h5>
                        <p className="text-xs font-bold text-slate-400 max-w-xs leading-relaxed">Personaliza tu PWA y reportes con la identidad de tu marca.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className={labelBaseStyles}>Nombre Fiscal</label>
                        <input className={inputBaseStyles} defaultValue={tenant?.company_name || 'Aurum Leasing S.A.'} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelBaseStyles}>RFC / Tax ID</label>
                        <input className={inputBaseStyles} defaultValue="ALE230415-G42" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'suscripcion' && tenant && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Plan Actual</p>
                            <h3 className="text-4xl font-black">{tenant.plan_name}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black">${tenant.plan_price}<span className="text-xs text-slate-400">/mes</span></p>
                            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-lg border border-emerald-500/20">{tenant.status}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase">Próximo Pago</p>
                              <p className="text-xs font-bold">{tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase">Método de Pago</p>
                              <p className="text-xs font-bold">Tarjeta terminada en •••• 4242</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">Planes Disponibles</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map(plan => (
                          <div
                            key={plan.id}
                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${tenant.plan_id === plan.id ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{plan.name}</p>
                            <p className="text-xl font-black text-slate-900 mb-4">${plan.monthly_price}</p>
                            <button
                              onClick={() => handleUpgrade(plan.id)}
                              disabled={tenant.plan_id === plan.id}
                              className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tenant.plan_id === plan.id ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-slate-900 text-white hover:bg-amber-500 shadow-lg shadow-slate-900/10'}`}
                            >
                              {tenant.plan_id === plan.id ? 'Actual' : 'Upgrade'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">Facturas Recientes</h5>
                        <button className="text-[9px] font-black text-amber-600 uppercase tracking-widest hover:underline">Ver todas</button>
                      </div>
                      <div className="bg-slate-50 rounded-[2rem] border border-slate-100 divide-y divide-slate-200 overflow-hidden">
                        {invoices.length > 0 ? invoices.map((inv, i) => (
                          <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white rounded-lg border border-slate-200"><Receipt className="w-4 h-4 text-slate-400" /></div>
                              <div>
                                <p className="text-[11px] font-black text-slate-900">Mensualidad - {inv.plan_id}</p>
                                <p className="text-[9px] font-bold text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-black text-slate-900">${inv.amount}</p>
                              <span className="text-[8px] font-black uppercase text-emerald-500">{inv.status}</span>
                            </div>
                          </div>
                        )) : (
                          <div className="p-10 text-center">
                            <p className="text-xs font-bold text-slate-400 italic">No hay facturas registradas aún.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notificaciones' && (
                  <div className="divide-y divide-slate-50 animate-in fade-in duration-500">
                    {[
                      { title: 'Vencimiento de Seguros', desc: 'Alertar 15 días antes', icon: <ShieldCheck className="w-5 h-5" /> },
                      { title: 'Cobranza en Mora', desc: 'Notificar al equipo legal', icon: <Briefcase className="w-5 h-5" /> },
                      { title: 'Mantenimiento Predictivo', desc: 'Alertas de motor IA', icon: <Zap className="w-5 h-5" /> },
                    ].map((item, i) => (
                      <div key={i} className="py-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">{item.icon}</div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{item.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'integraciones' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-900 text-lg">WhatsApp (API Waha)</h5>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal de comunicación directa con choferes</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div className="space-y-2">
                          <label className={labelBaseStyles}>WAHA Base URL</label>
                          <div className="relative">
                            <input className={inputBaseStyles} defaultValue="http://waha.aurum-cloud.com:3000" />
                            <Terminal className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={labelBaseStyles}>API Key / Token</label>
                          <input type="password" className={inputBaseStyles} defaultValue="••••••••••••••••" />
                        </div>
                        <div className="flex gap-3">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-100 flex items-center gap-2 italic">
                            <Check className="w-3 h-3" strokeWidth={4} /> Instancia Conectada
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                          <Code2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-900 text-lg">Workflows (n8n)</h5>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automatización de reportes y sync externo</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div className="space-y-2">
                          <label className={labelBaseStyles}>n8n Webhook Endpoint</label>
                          <div className="relative">
                            <input className={inputBaseStyles} defaultValue="https://n8n.servicios.mx/webhook/aurum-finance" />
                            <Link className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                          Este Webhook recibirá eventos de: Validación de Pagos, Alertas de Taller y Nuevos Contratos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <button className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                <Save className="w-5 h-5 text-amber-500" /> Guardar Configuración
              </button>
              <button
                onClick={onLogout}
                className="w-full py-5 bg-rose-50 text-rose-600 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <LogOut className="w-5 h-5" /> Cerrar Sesión Corporativa
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Estado de API</h4>
              <div className="flex justify-between items-end mb-6">
                <p className="text-3xl font-black">Operational</p>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Normal</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span>WAHA Uptime</span>
                  <span className="text-white">99.8%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '99.8%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Terminal className="w-8 h-8" />
            </div>
            <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest text-center">Docs de Integración</h5>
            <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed text-center">Consulta cómo estructurar tus flujos de n8n para recibir los eventos de Aurum.</p>
            <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Ver Documentación</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsView;
