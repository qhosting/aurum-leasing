
import React, { useState, useMemo } from 'react';
import { MOCK_DRIVERS, MOCK_PAYMENTS, MOCK_VEHICLES } from '../constants';
import { Driver, AmortizationInstallment, PaymentRecord, VehicleStatus, Notification } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  DollarSign, TrendingUp, ShieldAlert, CreditCard, 
  CheckCircle2, Clock, Wallet, PieChart, 
  X, ChevronRight, FileText, Calendar, ArrowUpRight, Scale,
  Download, Filter, ArrowRight, AlertCircle, FileSpreadsheet,
  Image as ImageIcon, Check, Ban, AlertTriangle, MessageSquare, Loader2,
  Zap, Target, TrendingDown, Activity
} from 'lucide-react';
import { sendWhatsAppMessage, triggerN8nWorkflow } from '../services/integrationService';
import { persistenceService } from '../services/persistenceService';

interface FinanceViewProps {
  refreshGlobalNotifs?: () => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ refreshGlobalNotifs }) => {
  const [activeSubTab, setActiveSubTab] = useState<'cuentas' | 'validaciones' | 'reportes'>('cuentas');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const currentTenantId = 't1'; 

  const [payments, setPayments] = useState<PaymentRecord[]>([
    ...MOCK_PAYMENTS,
    { id: 'p2', amount: 350, date: '2024-05-18', driverId: 'd1', status: 'pending', type: 'renta' },
    { id: 'p3', amount: 1500, date: '2024-05-19', driverId: 'd2', status: 'pending', type: 'fianza' },
  ]);

  const projectionMetrics = useMemo(() => {
    const activeVehicles = MOCK_VEHICLES.filter(v => v.status === VehicleStatus.ACTIVE);
    const mrr = activeVehicles.reduce((acc, v) => acc + v.monthlyRent, 0);
    const potentialMrr = MOCK_VEHICLES.reduce((acc, v) => acc + v.monthlyRent, 0);
    const occupancyRate = (activeVehicles.length / MOCK_VEHICLES.length) * 100;
    
    const forecastData = [
      { month: 'Jun', income: mrr, risk: mrr * 0.05 },
      { month: 'Jul', income: mrr * 1.05, risk: mrr * 0.08 },
      { month: 'Ago', income: mrr * 1.12, risk: mrr * 0.10 },
      { month: 'Sep', income: mrr * 1.15, risk: mrr * 0.12 },
      { month: 'Oct', income: mrr * 1.25, risk: mrr * 0.07 },
      { month: 'Nov', income: mrr * 1.30, risk: mrr * 0.05 },
    ];

    const totalArrears = MOCK_DRIVERS.reduce((acc, d) => acc + (d.balance < 0 ? Math.abs(d.balance) : 0), 0);

    return { mrr, potentialMrr, occupancyRate, forecastData, totalArrears };
  }, []);

  const pendingCount = useMemo(() => payments.filter(p => p.status === 'pending').length, [payments]);

  const handleVerifyPayment = async (payment: PaymentRecord) => {
    setIsProcessing(payment.id);
    
    const res = await persistenceService.verifyPayment(payment.id, payment.driverId, payment.amount);
    
    if (res.success) {
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'verified' } : p));
      const driver = MOCK_DRIVERS.find(d => d.id === payment.driverId);
      
      if (driver) {
        await sendWhatsAppMessage(currentTenantId, driver.phone, `✅ Tu pago por $${payment.amount.toLocaleString()} verificado.`);
        await triggerN8nWorkflow(currentTenantId, 'PAYMENT_VERIFIED', { paymentId: payment.id, amount: payment.amount });
      }
      
      if (refreshGlobalNotifs) refreshGlobalNotifs();
    }
    
    setIsProcessing(null);
  };

  const getDriverPayments = (driverId: string) => {
    return payments
      .filter(p => p.driverId === driverId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="space-y-6">
      <div className="relative -mx-6 px-6 lg:mx-0 lg:px-0">
        <div className="flex gap-8 border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'cuentas', label: 'Cuentas Chofer', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'validaciones', label: 'Validaciones', icon: <CheckCircle2 className="w-4 h-4" />, badge: pendingCount },
            { id: 'reportes', label: 'Proyecciones', icon: <PieChart className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-3 py-5 px-2 text-sm font-black whitespace-nowrap border-b-4 transition-all relative ${
                activeSubTab === tab.id 
                  ? 'border-amber-500 text-slate-900' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'reportes' && (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
           <div className="flex lg:grid lg:grid-cols-3 overflow-x-auto pb-4 gap-6 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
              <div className="min-w-[280px] bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Ingreso Mensual (MRR)</p>
                 <div className="flex justify-between items-end">
                    <h3 className="text-4xl font-black">${projectionMetrics.mrr.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                       <ArrowUpRight className="w-4 h-4" /> 12%
                    </div>
                 </div>
                 <div className="mt-6 flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Potencial Teórico</span>
                    <span className="text-white">${projectionMetrics.potentialMrr.toLocaleString()}</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{width: `${(projectionMetrics.mrr/projectionMetrics.potentialMrr)*100}%`}}></div>
                 </div>
              </div>

              <div className="min-w-[280px] bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100"><ShieldAlert className="w-5 h-5" /></div>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">Riesgo Crítico</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cartera Vencida</p>
                    <p className="text-3xl font-black text-slate-900">${projectionMetrics.totalArrears.toLocaleString()}</p>
                 </div>
              </div>

              <div className="min-w-[280px] bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100"><Target className="w-5 h-5" /></div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Eficiencia</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ocupación de Flota</p>
                    <p className="text-3xl font-black text-slate-900">{projectionMetrics.occupancyRate.toFixed(1)}%</p>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Proyección de Flujo de Caja (6 meses)</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Zap className="w-3 h-3 text-amber-500" /> Basado en contratos activos y tasa de renovación
                    </p>
                 </div>
              </div>

              <div className="h-[350px] w-full -ml-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionMetrics.forecastData}>
                       <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                             <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '900'}} dy={15} />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}}
                          tickFormatter={(val) => `$${val/1000}k`}
                       />
                       <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                          labelStyle={{ fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}
                       />
                       <Area type="monotone" dataKey="income" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#colorIncome)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'cuentas' && (
        <div className="grid grid-cols-1 gap-4">
           {MOCK_DRIVERS.map(driver => (
             <div 
              key={driver.id} 
              onClick={() => setSelectedDriver(driver)}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm active:scale-[0.98] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
             >
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl">
                    {driver.name.charAt(0)}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-lg leading-none">{driver.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Contrato {driver.rentPlan} • {driver.phone}</p>
                   </div>
                </div>
                <div className="flex items-end justify-between md:flex-col md:items-end md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:mb-1">Saldo Actual</p>
                   <p className={`text-2xl font-black ${driver.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {driver.balance < 0 ? `-$${Math.abs(driver.balance)}` : `$${driver.balance}`}
                   </p>
                </div>
             </div>
           ))}
        </div>
      )}

      {activeSubTab === 'validaciones' && (
        <div className="space-y-6">
           {payments.filter(p => p.status === 'pending').map(payment => (
             <div key={payment.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                   <div className="w-full lg:w-48 h-48 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-slate-300 relative">
                      <ImageIcon className="w-12 h-12" />
                      <p className="text-[10px] font-black uppercase mt-3 tracking-widest text-center">Ver Comprobante</p>
                   </div>
                   <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                            <h4 className="text-xl font-black text-slate-900">{MOCK_DRIVERS.find(d => d.id === payment.driverId)?.name}</h4>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Reportado</p>
                            <p className="text-2xl font-black text-slate-900">${payment.amount.toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="flex gap-3">
                         <button className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all">Rechazar</button>
                         <button 
                          onClick={() => handleVerifyPayment(payment)}
                          disabled={isProcessing === payment.id}
                          className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                            {isProcessing === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Verificar & Notificar
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           ))}
           {pendingCount === 0 && (
              <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                 <p className="text-sm font-bold text-slate-400">No hay pagos pendientes por validar</p>
              </div>
           )}
        </div>
      )}

      {selectedDriver && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDriver(null)}></div>
           <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{selectedDriver.name.charAt(0)}</div>
                    <h3 className="text-xl font-black text-slate-900 leading-none">{selectedDriver.name}</h3>
                 </div>
                 <button onClick={() => setSelectedDriver(null)} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Patrimonio del Conductor</p>
                    <div className="flex justify-between items-end mb-6">
                       <h5 className="text-4xl font-black text-amber-500">${selectedDriver.amortization.paidPrincipal.toLocaleString()}</h5>
                    </div>
                 </div>

                 <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                       <Clock className="w-4 h-4 text-amber-500" /> Historial de Pagos
                    </h4>
                    <div className="space-y-3">
                       {getDriverPayments(selectedDriver.id).map(p => (
                          <div key={p.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center">
                             <div>
                                <p className="text-sm font-black text-slate-900">${p.amount.toLocaleString()}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.date}</p>
                             </div>
                             <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${p.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{p.status}</span>
                          </div>
                       ))}
                    </div>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
