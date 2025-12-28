
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Wallet, Car, ShieldCheck, Clock, 
  ChevronRight, Camera, QrCode, 
  FileText, Award, MapPin, Wrench,
  ArrowUpRight, AlertCircle, CheckCircle2,
  Calendar, CreditCard, Gauge, User,
  Bell, Settings, LogOut, Info, Zap,
  X, Save, Upload, Loader2, Check,
  Phone, Truck, Battery, Droplet, Hammer,
  AlertTriangle, ShieldAlert, Navigation,
  Crosshair, Map as MapIcon, Eye, Trash2, FileUp,
  Hash, ChevronDown, ImageIcon, Mail, HeartPulse,
  UserPlus, MapPinned
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';

const ArrendatarioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cuenta' | 'perfil'>('cuenta');
  const [isLoading, setIsLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  
  const [isReportingPayment, setIsReportingPayment] = useState(false);
  const [isRequestingAssistance, setIsRequestingAssistance] = useState(false);
  const [isReportingAccident, setIsReportingAccident] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    type: 'renta',
    date: new Date().toISOString().split('T')[0],
    receiptData: '' as string | null
  });

  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // El driverId real vendría de la sesión, usamos 'd1' para demo persistente
      const driverId = 'd1';
      const [dData, vData, pData] = await Promise.all([
        persistenceService.getDriverMe(driverId),
        persistenceService.getDriverVehicle(driverId),
        persistenceService.getDriverPayments(driverId)
      ]);
      setDriver(dData);
      setVehicle(vData);
      setPayments(pData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentForm(prev => ({ ...prev, receiptData: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleActionSubmit = async (type: 'payment') => {
    if (type === 'payment') {
      setIsSubmitting(true);
      const res = await persistenceService.reportDriverPayment({
        driver_id: driver.id,
        tenant_id: driver.tenant_id,
        amount: parseFloat(paymentForm.amount),
        ...paymentForm
      });
      if (res.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setIsReportingPayment(false);
          setShowSuccess(false);
          setPaymentForm({ amount: '', type: 'renta', date: new Date().toISOString().split('T')[0], receiptData: null });
        }, 2000);
      }
      setIsSubmitting(false);
    }
  };

  const equityPercentage = useMemo(() => {
    if (!driver || !driver.data?.amortization) return 0;
    const { paidPrincipal, totalValue } = driver.data.amortization;
    return (paidPrincipal / totalValue) * 100;
  }, [driver]);

  const labelStyles = "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block";
  const inputStyles = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none";

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <input type="file" ref={receiptInputRef} onChange={handleReceiptUpload} className="hidden" accept="image/*" />

      <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-md rounded-[2rem] border border-slate-200 w-full lg:w-fit mx-auto lg:mx-0">
        <button onClick={() => setActiveTab('cuenta')} className={`flex-1 lg:flex-none px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cuenta' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Mi Cuenta</button>
        <button onClick={() => setActiveTab('perfil')} className={`flex-1 lg:flex-none px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'perfil' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Mi Perfil</button>
      </div>

      {activeTab === 'cuenta' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => setIsRequestingAssistance(true)} className="group p-6 bg-white border border-slate-200 rounded-[2.5rem] flex items-center gap-6 hover:border-amber-400 transition-all shadow-sm active:scale-95">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Zap className="w-6 h-6 fill-amber-600" /></div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atención en Ruta</p>
                   <p className="text-lg font-black text-slate-900">Solicitar Auxilio Vial</p>
                </div>
             </button>
             <button onClick={() => setIsReportingAccident(true)} className="group p-6 bg-white border border-slate-200 rounded-[2.5rem] flex items-center gap-6 hover:border-rose-400 transition-all shadow-sm active:scale-95">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldAlert className="w-6 h-6" /></div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siniestro o Choque</p>
                   <p className="text-lg font-black text-slate-900">Reportar Accidente</p>
                </div>
             </button>
          </div>

          <div className="bg-slate-900 rounded-[3.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Balance Acumulado</p>
                  <h3 className="text-5xl font-black tracking-tighter">${driver.balance?.toLocaleString()}</h3>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/10"><Wallet className="w-8 h-8 text-amber-500" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Progreso de Propiedad</p>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-2xl font-black text-amber-500">{equityPercentage.toFixed(1)}%</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Propiedad Real</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${equityPercentage}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                   <button onClick={() => setIsReportingPayment(true)} className="w-full py-5 bg-amber-500 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Camera className="w-5 h-5" /> Reportar Pago</button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm">
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8">Movimientos en DB</h4>
               <div className="space-y-4">
                 {payments.map(p => (
                   <div key={p.id} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${p.status === 'verified' ? 'text-emerald-500 bg-white' : 'text-amber-500 bg-white'}`}>
                          {p.status === 'verified' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">${p.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.date).toLocaleDateString()} • {p.type}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${p.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{p.status}</span>
                   </div>
                 ))}
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm h-fit">
               <h5 className={labelStyles}>Unidad Vinculada</h5>
               <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-slate-500 uppercase">Estatus</p>
                     <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded uppercase">{vehicle?.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-slate-500 uppercase">Placa</p>
                     <span className="font-black text-slate-900">{vehicle?.plate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-slate-500 uppercase">Mantenimiento</p>
                     <span className="font-black text-amber-600 italic">Venc. {vehicle?.verificationExpiry}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-5">
           <h4 className="text-2xl font-black text-slate-900 italic uppercase mb-8">Perfil del Socio</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div><label className={labelStyles}>Nombre Completo</label><p className="text-xl font-black text-slate-900">{driver.data.name}</p></div>
                <div><label className={labelStyles}>Email de Registro</label><p className="font-bold text-slate-600">{driver.email}</p></div>
                <div><label className={labelStyles}>Teléfono</label><p className="font-bold text-slate-600">{driver.data.phone}</p></div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col items-center justify-center">
                 <QrCode className="w-32 h-32 mb-4 text-amber-500" />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ID Digital Aurum</p>
                 <p className="text-lg font-black mt-2">{driver.id}</p>
              </div>
           </div>
        </div>
      )}

      {isReportingPayment && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-stretch lg:justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsReportingPayment(false)}></div>
          <div className="relative w-full lg:max-w-xl bg-white rounded-t-[3.5rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[92vh] lg:h-full overflow-hidden flex flex-col animate-in slide-in-from-right shadow-2xl">
            {showSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg"><Check className="w-12 h-12" strokeWidth={4} /></div>
                <h3 className="text-3xl font-black text-slate-900">¡Recibido!</h3>
                <p className="text-slate-500 font-bold mt-2">Tu pago está en proceso de validación.</p>
              </div>
            ) : (
              <div className="p-8 lg:p-12 space-y-10 overflow-y-auto">
                <h3 className="text-3xl font-black tracking-tighter uppercase italic">Reportar Pago</h3>
                <div className="space-y-6">
                  <div><label className={labelStyles}>Concepto</label><select className={inputStyles} value={paymentForm.type} onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}><option value="renta">Renta Semanal</option><option value="fianza">Abono Fianza</option></select></div>
                  <div><label className={labelStyles}>Monto ($)</label><input type="number" className={inputStyles} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                  <button onClick={() => receiptInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center gap-2 group hover:border-amber-400 hover:bg-amber-50 transition-all">
                    {paymentForm.receiptData ? <ImageIcon className="w-10 h-10 text-emerald-500" /> : <Camera className="w-10 h-10 text-slate-300 group-hover:text-amber-500" />}
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{paymentForm.receiptData ? "Imagen Cargada" : "Subir Comprobante"}</span>
                  </button>
                  <button onClick={() => handleActionSubmit('payment')} disabled={isSubmitting || !paymentForm.amount} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-amber-500" />} Confirmar Reporte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrendatarioView;
