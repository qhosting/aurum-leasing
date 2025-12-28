
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
import { MOCK_DRIVERS, MOCK_VEHICLES, MOCK_PAYMENTS } from '../constants';

type AssistanceStatus = 'idle' | 'detecting' | 'requesting' | 'tracking' | 'success';

interface LegalDoc {
  id: string;
  label: string;
  expiryDate: string;
  status: 'Vigente' | 'Pendiente' | 'Vencido';
  fileData?: string; // Base64
}

const ArrendatarioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cuenta' | 'perfil'>('cuenta');
  
  // Modals & Drawers States
  const [isReportingPayment, setIsReportingPayment] = useState(false);
  const [isRequestingAssistance, setIsRequestingAssistance] = useState(false);
  const [isReportingAccident, setIsReportingAccident] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<LegalDoc | null>(null);
  
  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [assistanceStatus, setAssistanceStatus] = useState<AssistanceStatus>('idle');
  const [isDetectingAccidentLocation, setIsDetectingAccidentLocation] = useState(false);

  // GPS State
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [eta, setEta] = useState(25);

  // En una app real, esto vendría del contexto de autenticación
  const driver = MOCK_DRIVERS[0]; 
  const vehicle = MOCK_VEHICLES.find(v => v.driverId === driver.id) || MOCK_VEHICLES[0];
  const myPayments = MOCK_PAYMENTS.filter(p => p.driverId === driver.id);

  // Perfil Info States
  const [profileData, setProfileData] = useState({
    phone: driver.phone || '',
    email: 'juan.perez@email.com',
    address: 'Av. Insurgentes Sur 1234, CDMX',
    emergencyContactName: 'Marta Pérez',
    emergencyContactPhone: '5215599887766',
    emergencyContactRel: 'Esposa'
  });

  // Form States
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    type: 'renta',
    targetInstallment: '',
    date: new Date().toISOString().split('T')[0],
    receiptData: '' as string | null
  });

  const pendingInstallments = useMemo(() => {
    return driver.amortization.installments.filter(i => i.status !== 'paid');
  }, [driver]);

  const [assistanceType, setAssistanceType] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  
  const [accidentForm, setAccidentForm] = useState({
    location: '',
    description: '',
    hasPhotos: false,
    severity: 'low',
    gpsVerified: false
  });

  // Refs para inputs de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // --- LOGICA DE DOCUMENTACIÓN LEGAL ---
  const [legalDocs, setLegalDocs] = useState<LegalDoc[]>([
    { id: 'licencia', label: 'Licencia de Conducir', expiryDate: '2025-08-12', status: 'Vigente' },
    { id: 'seguro', label: 'Póliza de Seguro', expiryDate: '2024-12-15', status: 'Vigente' },
    { id: 'contrato', label: 'Contrato Aurum', expiryDate: '2026-01-10', status: 'Vigente' },
    { id: 'verificacion', label: 'Verificación Vehicular', expiryDate: vehicle.verificationExpiry, status: 'Vigente' },
  ]);

  // Cargar docs de localStorage al iniciar
  useEffect(() => {
    const savedDocs = localStorage.getItem(`aurum_docs_${driver.id}`);
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs);
        setLegalDocs(prev => prev.map(d => ({
          ...d,
          fileData: parsed[d.id] || undefined
        })));
      } catch (e) {
        console.error("Error cargando documentos locales", e);
      }
    }
    
    // Cargar perfil local si existe
    const savedProfile = localStorage.getItem(`aurum_profile_${driver.id}`);
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, [driver.id]);

  const handleProfileUpdate = (key: string, value: string) => {
    const updated = { ...profileData, [key]: value };
    setProfileData(updated);
    localStorage.setItem(`aurum_profile_${driver.id}`, JSON.stringify(updated));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedDocs = legalDocs.map(doc => 
        doc.id === uploadingDocId ? { ...doc, fileData: base64String } : doc
      );
      setLegalDocs(updatedDocs);
      
      const storageObj = updatedDocs.reduce((acc, doc) => {
        if (doc.fileData) acc[doc.id] = doc.fileData;
        return acc;
      }, {} as any);
      localStorage.setItem(`aurum_docs_${driver.id}`, JSON.stringify(storageObj));
      
      setUploadingDocId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentForm(prev => ({ ...prev, receiptData: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = (docId: string) => {
    const updatedDocs = legalDocs.map(doc => 
      doc.id === docId ? { ...doc, fileData: undefined } : doc
    );
    setLegalDocs(updatedDocs);
    const saved = JSON.parse(localStorage.getItem(`aurum_docs_${driver.id}`) || '{}');
    delete saved[docId];
    localStorage.setItem(`aurum_docs_${driver.id}`, JSON.stringify(saved));
    setSelectedDocForView(null);
  };

  const triggerUpload = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const triggerReceiptUpload = () => {
    receiptInputRef.current?.click();
  };

  const equityPercentage = (driver.amortization.paidPrincipal / driver.amortization.totalValue) * 100;

  // GPS Logica
  const detectLocation = () => {
    setAssistanceStatus('detecting');
    if (!navigator.geolocation) {
      alert("La geolocalización no es soportada.");
      setAssistanceStatus('idle');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)} (GPS)`);
        setAssistanceStatus('idle');
      },
      () => {
        alert("Error de ubicación.");
        setAssistanceStatus('idle');
      },
      { enableHighAccuracy: true }
    );
  };

  const detectAccidentLocation = () => {
    setIsDetectingAccidentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAccidentForm(prev => ({ 
          ...prev, 
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (GPS)`,
          gpsVerified: true
        }));
        setIsDetectingAccidentLocation(false);
      },
      () => {
        setIsDetectingAccidentLocation(false);
      }
    );
  };

  const handleInstallmentSelect = (installmentId: string) => {
    const inst = pendingInstallments.find(i => i.number.toString() === installmentId);
    if (inst) {
      setPaymentForm(prev => ({
        ...prev,
        targetInstallment: installmentId,
        amount: inst.amount.toString()
      }));
    }
  };

  const handleActionSubmit = (type: 'payment' | 'assistance' | 'accident') => {
    setIsSubmitting(true);
    if (type === 'assistance') setAssistanceStatus('requesting');

    setTimeout(() => {
      setIsSubmitting(false);
      if (type === 'assistance') {
          setAssistanceStatus('tracking');
      } else {
          setShowSuccess(true);
          setTimeout(() => {
            if (type === 'payment') setIsReportingPayment(false);
            if (type === 'accident') setIsReportingAccident(false);
            setShowSuccess(false);
            setPaymentForm({ amount: '', type: 'renta', targetInstallment: '', date: new Date().toISOString().split('T')[0], receiptData: null });
            setAccidentForm({ location: '', description: '', hasPhotos: false, severity: 'low', gpsVerified: false });
          }, 2500);
      }
    }, 2000);
  };

  const labelStyles = "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block";
  const inputStyles = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none";
  const displayCardStyles = "bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden";

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      {/* Inputs Ocultos */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
      <input type="file" ref={receiptInputRef} onChange={handleReceiptUpload} className="hidden" accept="image/*" />

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-md rounded-[2rem] border border-slate-200 w-full lg:w-fit mx-auto lg:mx-0">
        <button onClick={() => setActiveTab('cuenta')} className={`flex-1 lg:flex-none px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cuenta' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Mi Cuenta</button>
        <button onClick={() => setActiveTab('perfil')} className={`flex-1 lg:flex-none px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'perfil' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Mi Perfil</button>
      </div>

      {activeTab === 'cuenta' ? (
        <div className="space-y-8">
          {/* BARRA DE AUXILIO (TOP) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top duration-500">
             <button 
                onClick={() => { setIsRequestingAssistance(true); setAssistanceStatus('idle'); }} 
                className="group p-6 bg-white border border-slate-200 rounded-[2.5rem] flex items-center gap-6 hover:border-amber-400 hover:bg-amber-50/30 transition-all shadow-sm active:scale-95"
             >
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Zap className="w-6 h-6 fill-amber-600" />
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atención en Ruta</p>
                   <p className="text-lg font-black text-slate-900">Solicitar Auxilio Vial</p>
                </div>
             </button>

             <button 
                onClick={() => setIsReportingAccident(true)} 
                className="group p-6 bg-white border border-slate-200 rounded-[2.5rem] flex items-center gap-6 hover:border-rose-400 hover:bg-rose-50/30 transition-all shadow-sm active:scale-95"
             >
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siniestro o Choque</p>
                   <p className="text-lg font-black text-slate-900">Reportar Accidente</p>
                </div>
             </button>
          </div>

          {/* Main Financial Card */}
          <div className="bg-slate-900 rounded-[3.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Saldo a Favor</p>
                  <h3 className="text-5xl font-black tracking-tighter">${driver.balance.toLocaleString()}</h3>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/10">
                  <Wallet className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Progreso de Propiedad</p>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-2xl font-black text-amber-500">{equityPercentage.toFixed(1)}%</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Equity Actual</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${equityPercentage}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                   <button 
                    onClick={() => setIsReportingPayment(true)}
                    className="w-full py-5 bg-amber-500 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                   >
                     <Camera className="w-5 h-5" /> Reportar Pago
                   </button>
                   <p className="text-[9px] text-center font-bold text-slate-500 uppercase tracking-widest">Próximo cargo: 15 Jun 2024</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 md:p-10 border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Historial Reciente</h4>
                 <FileText className="w-5 h-5 text-slate-300" />
               </div>
               <div className="space-y-4">
                 {myPayments.map(p => (
                   <div key={p.id} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex justify-between items-center group hover:border-amber-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">${p.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.date} • {p.type}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-6">
              {/* Aurum Rewards eliminado según solicitud */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                 <h5 className={labelStyles}>Tu Vehículo</h5>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estatus</p>
                       <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded uppercase">En Operación</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Placa</p>
                       <span className="font-black text-slate-900">{vehicle.plate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Siguiente Mantenimiento</p>
                       <span className="font-black text-amber-600">En 540 KM</span>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-100 p-8 rounded-[2.5rem] border border-slate-200/50">
                <div className="flex items-center gap-3 mb-4">
                   <Award className="w-5 h-5 text-slate-400" />
                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Socio Destacado</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">Mantén tus pagos al corriente para desbloquear beneficios exclusivos en nuestra red de talleres.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PHASE 2: PERFIL */
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna Izquierda: ID y Emergencias */}
              <div className="lg:col-span-1 space-y-8">
                 <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden relative text-center">
                    <div className="bg-slate-900 h-32 relative">
                       <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                          <div className="w-24 h-24 bg-white rounded-[2rem] p-1 shadow-2xl">
                             <div className="w-full h-full bg-amber-500 rounded-[1.8rem] flex items-center justify-center text-slate-900 font-black text-3xl">{driver.name.charAt(0)}</div>
                          </div>
                       </div>
                    </div>
                    <div className="pt-16 pb-10 px-8">
                       <h4 className="text-xl font-black text-slate-900">{driver.name}</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Socio Conductor #0921</p>
                       <QrCode className="w-32 h-32 text-slate-900 mx-auto mt-8" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">ID: {driver.id}</p>
                    </div>
                 </div>

                 {/* Contacto de Emergencia */}
                 <div className="bg-rose-50 rounded-[3rem] p-8 border border-rose-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg">
                          <HeartPulse className="w-5 h-5" />
                       </div>
                       <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-[0.3em]">Emergencias</h4>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Nombre de Contacto</p>
                          <input 
                            className="w-full mt-1 bg-transparent border-b border-rose-200 py-1 font-black text-slate-900 outline-none focus:border-rose-500 transition-colors"
                            value={profileData.emergencyContactName}
                            onChange={(e) => handleProfileUpdate('emergencyContactName', e.target.value)}
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Parentesco</p>
                             <input 
                                className="w-full mt-1 bg-transparent border-b border-rose-200 py-1 font-black text-slate-900 outline-none focus:border-rose-500 transition-colors"
                                value={profileData.emergencyContactRel}
                                onChange={(e) => handleProfileUpdate('emergencyContactRel', e.target.value)}
                             />
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Teléfono</p>
                             <input 
                                className="w-full mt-1 bg-transparent border-b border-rose-200 py-1 font-black text-slate-900 outline-none focus:border-rose-500 transition-colors"
                                value={profileData.emergencyContactPhone}
                                onChange={(e) => handleProfileUpdate('emergencyContactPhone', e.target.value)}
                             />
                          </div>
                       </div>
                    </div>
                    <AlertTriangle className="absolute -bottom-6 -right-6 w-24 h-24 text-rose-100/50" />
                 </div>
              </div>

              {/* Columna Derecha: Datos de Contacto, Vehículo y Documentos */}
              <div className="lg:col-span-2 space-y-8">
                 {/* Información de Contacto Personal */}
                 <div className={displayCardStyles}>
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                       <UserPlus className="w-5 h-5 text-amber-500" />
                       <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Información de Contacto</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div>
                             <p className={labelStyles}>Teléfono Particular</p>
                             <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <input 
                                   className="bg-transparent font-black text-slate-900 outline-none flex-1"
                                   value={profileData.phone}
                                   onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                                />
                             </div>
                          </div>
                          <div>
                             <p className={labelStyles}>Correo Electrónico</p>
                             <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <input 
                                   className="bg-transparent font-black text-slate-900 outline-none flex-1"
                                   value={profileData.email}
                                   onChange={(e) => handleProfileUpdate('email', e.target.value)}
                                />
                             </div>
                          </div>
                       </div>
                       <div>
                          <p className={labelStyles}>Domicilio Fiscal / Particular</p>
                          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 h-full min-h-[120px]">
                             <MapPinned className="w-4 h-4 text-slate-400 mt-1" />
                             <textarea 
                                className="bg-transparent font-black text-slate-900 outline-none flex-1 resize-none h-full"
                                value={profileData.address}
                                onChange={(e) => handleProfileUpdate('address', e.target.value)}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-[3.5rem] p-8 md:p-10 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                       <Car className="w-5 h-5 text-amber-500" />
                       <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Unidad Asignada</h4>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                       <div className="w-full md:w-48 h-32 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 relative overflow-hidden">
                          <Car className="w-12 h-12" />
                          <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded uppercase">{vehicle.plate}</div>
                       </div>
                       <div className="flex-1 space-y-4 text-center md:text-left">
                          <h5 className="text-2xl font-black text-slate-900">{vehicle.brand} {vehicle.model}</h5>
                          <div className="flex justify-center md:justify-start gap-6">
                             <div>
                                <p className={labelStyles}>Kilometraje</p>
                                <p className="text-sm font-black text-slate-900">{vehicle.mileage.toLocaleString()} KM</p>
                             </div>
                             <div>
                                <p className={labelStyles}>Modelo</p>
                                <p className="text-sm font-black text-slate-900">{vehicle.year}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-[3.5rem] p-8 md:p-10 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                       <ShieldCheck className="w-5 h-5 text-amber-500" />
                       <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Bóveda Digital Legal</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {legalDocs.map((doc) => (
                         <div key={doc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group relative overflow-hidden hover:border-amber-200 transition-all">
                            <div className="relative z-10">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.label}</p>
                               <p className="text-sm font-black text-slate-900 mt-1">{doc.expiryDate}</p>
                               <div className="flex items-center gap-2 mt-3">
                                  {doc.fileData ? (
                                    <button onClick={() => setSelectedDocForView(doc)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">Ver</button>
                                  ) : (
                                    <button onClick={() => triggerUpload(doc.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-900 text-[9px] font-black uppercase rounded-lg shadow-sm">Subir</button>
                                  )}
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- VIEWER: DOCUMENTO LEGAL --- */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setSelectedDocForView(null)}></div>
           <div className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900">{selectedDocForView.label}</h3>
                 <button onClick={() => setSelectedDocForView(null)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 bg-slate-50 min-h-[400px] flex items-center justify-center">
                 <img src={selectedDocForView.fileData} className="max-w-full rounded-2xl shadow-lg" alt={selectedDocForView.label} />
              </div>
           </div>
        </div>
      )}

      {/* --- DRAWER: REPORTAR PAGO --- */}
      {isReportingPayment && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-stretch lg:justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => !isSubmitting && setIsReportingPayment(false)}></div>
          <div className="relative w-full lg:max-w-xl bg-white rounded-t-[3.5rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[92vh] lg:h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 shadow-2xl">
            
            {showSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Check className="w-12 h-12" strokeWidth={4} />
                </div>
                <h3 className="text-3xl font-black text-slate-900">¡Pago Reportado!</h3>
                <p className="text-slate-500 font-bold mt-2">Estamos validando tu comprobante.</p>
              </div>
            ) : (
              <>
                <div className="p-8 lg:p-12 bg-slate-900 text-white relative overflow-hidden shrink-0">
                  <div className="relative z-10 flex justify-between items-start">
                    <h3 className="text-3xl font-black tracking-tighter">Reportar Pago</h3>
                    <button onClick={() => setIsReportingPayment(false)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><X className="w-6 h-6" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 pb-32">
                  <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={labelStyles}>Concepto</label>
                        <select className={inputStyles} value={paymentForm.type} onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}>
                          <option value="renta">Renta Semanal</option>
                          <option value="fianza">Abono Fianza</option>
                        </select>
                      </div>
                      {paymentForm.type === 'renta' && (
                        <div className="space-y-2">
                          <label className={labelStyles}>Semana / Contrato</label>
                          <select className={inputStyles} value={paymentForm.targetInstallment} onChange={(e) => handleInstallmentSelect(e.target.value)}>
                            <option value="">Selecciona...</option>
                            {pendingInstallments.map(inst => (
                              <option key={inst.number} value={inst.number}>Semana {inst.number}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className={labelStyles}>Monto Pagado</label>
                        <input type="number" placeholder="0.00" className={inputStyles} value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelStyles}>Fecha</label>
                        <input type="date" className={inputStyles} value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <label className={labelStyles}>Comprobante (Imagen)</label>
                    {paymentForm.receiptData ? (
                      <div className="relative group animate-in zoom-in-95">
                         <img src={paymentForm.receiptData} className="w-full h-48 object-cover rounded-[2.5rem] border-2 border-emerald-500 shadow-lg" alt="Preview" />
                         <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center gap-4">
                            <button onClick={triggerReceiptUpload} className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5" /></button>
                            <button onClick={() => setPaymentForm(prev => ({...prev, receiptData: null}))} className="p-3 bg-rose-500 text-white rounded-xl hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                         </div>
                         <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <Check className="w-3 h-3" /> Imagen Cargada
                         </div>
                      </div>
                    ) : (
                      <button 
                        onClick={triggerReceiptUpload}
                        className="w-full py-16 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center gap-4 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
                      >
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Camera className="w-8 h-8 text-slate-400 group-hover:text-amber-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-900">Tomar Foto o Subir</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">JPG o PNG hasta 10MB</p>
                        </div>
                      </button>
                    )}
                  </section>

                  <button 
                    onClick={() => handleActionSubmit('payment')}
                    disabled={isSubmitting || !paymentForm.amount || !paymentForm.receiptData}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 text-amber-500" /> Confirmar Reporte</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- DRAWER: AUXILIO VIAL --- */}
      {isRequestingAssistance && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-stretch lg:justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => (assistanceStatus === 'idle') && setIsRequestingAssistance(false)}></div>
          <div className="relative w-full lg:max-w-2xl bg-white rounded-t-[3.5rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[92vh] lg:h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 shadow-2xl">
            
            {assistanceStatus === 'tracking' ? (
              <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95">
                <div className="flex-1 relative bg-slate-100 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative z-20">
                        <Navigation className="w-4 h-4 text-white fill-white" />
                      </div>
                      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 -m-4"></div>
                    </div>
                  </div>
                </div>
                <div className="p-8 lg:p-12 bg-white">
                   <h3 className="text-2xl font-black text-slate-900">Auxilio en Camino</h3>
                   <p className="text-slate-400 font-bold uppercase text-[9px] mt-2 tracking-widest">Unidad #442 • Roberto Mendez</p>
                   <button onClick={() => setIsRequestingAssistance(false)} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cerrar Seguimiento</button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-8 lg:p-12 bg-amber-500 text-slate-900 shrink-0 relative overflow-hidden">
                  <h3 className="text-3xl font-black tracking-tighter">Asistencia en Ruta</h3>
                  <button onClick={() => setIsRequestingAssistance(false)} className="absolute top-8 right-8 w-12 h-12 bg-slate-900/10 rounded-2xl flex items-center justify-center"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12">
                   <section className="space-y-6">
                      <h4 className={labelStyles}>¿Qué necesitas?</h4>
                      <div className="grid grid-cols-2 gap-4">
                         {['Grúa', 'Gasolina', 'Batería', 'Ponchadura'].map(type => (
                            <button 
                               key={type}
                               onClick={() => setAssistanceType(type)}
                               className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${assistanceType === type ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                            >
                               <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                            </button>
                         ))}
                      </div>
                   </section>
                   <section className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className={labelStyles}>Tu Ubicación</h4>
                        <button onClick={detectLocation} className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1"><Navigation className="w-3 h-3" /> GPS</button>
                      </div>
                      <input className={inputStyles} value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="Referencia o Dirección" />
                   </section>
                   <button 
                    onClick={() => handleActionSubmit('assistance')}
                    disabled={!assistanceType || !locationName}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] disabled:opacity-50"
                   >
                    Solicitar Ahora
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- DRAWER: REPORTAR SINIESTRO --- */}
      {isReportingAccident && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-stretch lg:justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => !isSubmitting && setIsReportingAccident(false)}></div>
          <div className="relative w-full lg:max-w-xl bg-white rounded-t-[3.5rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[92vh] lg:h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 shadow-2xl">
            {showSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-slate-900">Reporte Enviado</h3>
                <p className="text-slate-500 font-bold">Un ajustador se pondrá en contacto pronto.</p>
              </div>
            ) : (
              <>
                <div className="p-8 lg:p-12 bg-rose-600 text-white shrink-0 relative overflow-hidden">
                  <h3 className="text-3xl font-black tracking-tighter">Siniestro</h3>
                  <button onClick={() => setIsReportingAccident(false)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10">
                   <section className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className={labelStyles}>Ubicación</h4>
                        <button onClick={detectAccidentLocation} className="text-[9px] font-black text-rose-600 uppercase flex items-center gap-1"><Navigation className="w-3 h-3" /> GPS</button>
                      </div>
                      <input className={inputStyles} value={accidentForm.location} onChange={e => setAccidentForm({...accidentForm, location: e.target.value})} placeholder="Referencia de Ubicación" />
                   </section>
                   <section className="space-y-2">
                      <h4 className={labelStyles}>Descripción</h4>
                      <textarea className={`${inputStyles} h-32 resize-none`} value={accidentForm.description} onChange={e => setAccidentForm({...accidentForm, description: e.target.value})} placeholder="¿Qué ocurrió?" />
                   </section>
                   <button 
                    onClick={() => handleActionSubmit('accident')}
                    className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px]"
                   >
                    Confirmar Reporte
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrendatarioView;
