
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, Car, AlertTriangle, Wallet, Users, 
  ArrowUpRight, ArrowDownRight, Activity, 
  Clock, ShieldAlert, CheckCircle2, ChevronRight,
  Zap, DollarSign
} from 'lucide-react';
import { MOCK_VEHICLES, MOCK_DRIVERS, MOCK_PAYMENTS } from '../constants';
import { VehicleStatus } from '../types';

const data = [
  { name: 'Lun', flow: 1200 },
  { name: 'Mar', flow: 2100 },
  { name: 'Mie', flow: 800 },
  { name: 'Jue', flow: 1600 },
  { name: 'Vie', flow: 2400 },
  { name: 'Sab', flow: 3100 },
  { name: 'Dom', flow: 1800 },
];

const DashboardView: React.FC = () => {
  const metrics = useMemo(() => {
    const totalAssetsValue = MOCK_VEHICLES.reduce((acc, v) => acc + v.currentEstimatedValue, 0);
    const activeVehicles = MOCK_VEHICLES.filter(v => v.status === VehicleStatus.ACTIVE).length;
    const occupancyRate = (activeVehicles / MOCK_VEHICLES.length) * 100;
    const totalArrears = MOCK_DRIVERS.reduce((acc, d) => acc + (d.balance < 0 ? Math.abs(d.balance) : 0), 0);

    const criticalActions = [
      ...MOCK_VEHICLES.filter(v => (v.nextMaintenanceKm - v.mileage) < 1000).map(v => ({ type: 'maint', title: 'Mantenimiento', ref: v.plate })),
      ...MOCK_DRIVERS.filter(d => d.balance < -1000).map(d => ({ type: 'arrears', title: 'Mora Crítica', ref: d.name })),
    ];

    return { totalAssetsValue, occupancyRate, totalArrears, criticalActions, totalRevenue: MOCK_PAYMENTS.reduce((acc, p) => acc + p.amount, 0) };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Scrollable KPIs on Mobile */}
      <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto pb-4 gap-4 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
        <StatCard title="Activos" value={`$${(metrics.totalAssetsValue / 1000).toFixed(1)}k`} icon={<Car className="w-5 h-5" />} color="slate" trend="+1.2%" />
        <StatCard title="Ocupación" value={`${metrics.occupancyRate.toFixed(0)}%`} icon={<Activity className="w-5 h-5" />} color="amber" trend="+5%" />
        <StatCard title="Vencido" value={`$${metrics.totalArrears.toLocaleString()}`} icon={<ShieldAlert className="w-5 h-5" />} color="rose" trend="+12%" />
        <StatCard title="Recaudado" value={`$${metrics.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="emerald" trend="+8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Flujo de Recaudación</h3>
            <div className="h-[280px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
                  <Area type="monotone" dataKey="flow" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl group">
             <Zap className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
             <h4 className="text-xl font-black mb-2 leading-none">IA Preventiva</h4>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Gemini ha detectado anomalías en 3 contratos activos.</p>
             <button className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-400 transition-all active:scale-95">Ver Análisis de Riesgo</button>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Alertas</h3>
              <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100">{metrics.criticalActions.length} Hoy</span>
           </div>
           <div className="space-y-4">
              {metrics.criticalActions.map((action, i) => (
                <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center active:scale-[0.98] transition-all">
                   <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight">{action.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{action.ref}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
           </div>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
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
