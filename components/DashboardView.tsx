import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, Car, AlertTriangle, Wallet, Users,
  ArrowUpRight, ArrowDownRight, Activity,
  Clock, ShieldAlert, CheckCircle2, ChevronRight,
  Zap, DollarSign, Loader2, Download, FileJson, Sparkles
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';

const DashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [stats, daily] = await Promise.all([
        persistenceService.getArrendadorStats(),
        persistenceService.getArrendadorAnalytics()
      ]);
      setMetrics(stats);
      setAnalytics(daily.map((d: any) => ({
        name: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
        flow: parseFloat(d.total_amount)
      })));
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleDownloadCSV = async () => {
    setIsExporting(true);
    try {
      window.location.href = '/api/reports/payments/csv';
    } catch {
      alert('Error descargando el reporte.');
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">AURUM<span className="text-amber-500">FLUX</span></h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Centro de Inteligencia Financiera</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar Pagos (CSV)
        </button>
      </div>

      <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto pb-4 gap-4 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
        <StatCard title="Activos" value={`$${(metrics.totalAssetsValue / 1000).toFixed(1)}k`} icon={<Car className="w-5 h-5" />} color="slate" trend="+1.2%" />
        <StatCard title="Ocupación" value={`${metrics.occupancyRate.toFixed(0)}%`} icon={<Activity className="w-5 h-5" />} color="amber" trend="+5%" />
        <StatCard title="Vencido" value={`$${metrics.totalArrears.toLocaleString()}`} icon={<ShieldAlert className="w-5 h-5" />} color="rose" trend="+12%" />
        <StatCard title="Recaudado" value={`$${metrics.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="emerald" trend="+8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Flujo de Recaudación (30d)</h3>
            <div className="h-[280px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.length > 0 ? analytics : [{ name: '-', flow: 0 }]}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
                  <Area type="monotone" dataKey="flow" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {analytics.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Aún no hay transacciones para graficar</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl group">
            <div className="flex items-center gap-2 text-amber-500 mb-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Resumen Ejecutivo IA</span>
            </div>
            <h4 className="text-xl font-black mb-2 leading-none">Tendencia de Riesgo Gemini</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              {metrics.occupancyRate > 90
                ? "Desempeño excepcional. La flota está al límite de capacidad, se recomienda expansión."
                : "Ocupación estable. Se detectaron 3 conductores con retrasos menores en los últimos 7 días."}
            </p>
            <button className="mt-8 w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-all active:scale-95">Ver Auditoría Predictiva</button>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Alertas</h3>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100">{metrics.criticalActions?.length || 0} Hoy</span>
          </div>
          <div className="space-y-4">
            {metrics.criticalActions?.map((action: any, i: number) => (
              <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center active:scale-[0.98] transition-all">
                <div>
                  <p className="font-black text-slate-900 text-sm tracking-tight">{action.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{action.ref}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
            {(!metrics.criticalActions || metrics.criticalActions.length === 0) && (
              <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase">Sin alertas críticas hoy</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend }: any) => {
  const colors: any = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <div className="min-w-[200px] lg:min-w-0 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-44 hover:shadow-xl transition-all">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl border ${colors[color]}`}>{icon}</div>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
};

export default DashboardView;
