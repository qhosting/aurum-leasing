
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, 
  Bell, Lock, Smartphone, HeartPulse, 
  Save, Camera, Star, CheckCircle2, 
  AlertCircle, ChevronRight, Eye, EyeOff,
  LogOut, Globe, Moon, CreditCard, Hash,
  Loader2
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';

interface ArrendatarioSettingsViewProps {
  onLogout: () => void;
}

const ArrendatarioSettingsView: React.FC<ArrendatarioSettingsViewProps> = ({ onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [driver, setDriver] = useState<any>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: '',
    notifications: {
      payments: true,
      maintenance: true,
      promos: false
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const driverId = 'd1'; // ID de sesión simulado
      const data = await persistenceService.getDriverMe(driverId);
      if (data) {
        setDriver(data);
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          email: data.email || '',
          address: data.data.address || '',
          emergencyName: data.data.emergencyName || '',
          emergencyPhone: data.data.emergencyPhone || '',
          emergencyRel: data.data.emergencyRel || '',
          notifications: data.data.notifications || { payments: true, maintenance: true, promos: false }
        });
      }
      setIsLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await persistenceService.updateDriverProfile(driver.id, {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      emergencyName: formData.emergencyName,
      emergencyPhone: formData.emergencyPhone,
      emergencyRel: formData.emergencyRel,
      notifications: formData.notifications
    });
    
    if (res.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const labelStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block";
  const inputStyles = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all";
  const cardStyles = "bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm";

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-slate-900 text-5xl font-black shadow-2xl border-4 border-white/10 group-hover:scale-105 transition-transform duration-500">
              {formData.name.charAt(0)}
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-xl hover:bg-amber-400 transition-colors">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
              <h2 className="text-3xl font-black tracking-tight">{formData.name}</h2>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-500/30">ID: {driver.id}</span>
            </div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center justify-center md:justify-start gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Miembro Verificado
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className={cardStyles}>
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Información de Contacto</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelStyles}>Nombre Completo</label>
                <input 
                  className={inputStyles} 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className={labelStyles}>WhatsApp / Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    className={`${inputStyles} pl-12`} 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className={labelStyles}>Dirección de Residencia</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    className={`${inputStyles} pl-12`} 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={cardStyles}>
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Contacto de Emergencia</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelStyles}>Nombre del Contacto</label>
                <input 
                  className={inputStyles} 
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({...formData, emergencyName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelStyles}>Parentesco</label>
                  <input 
                    className={inputStyles} 
                    value={formData.emergencyRel}
                    onChange={(e) => setFormData({...formData, emergencyRel: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelStyles}>Teléfono</label>
                  <input 
                    className={inputStyles} 
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-6">Estado en Red</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-sm font-black text-white">{driver.email}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estatus</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="text-sm font-black text-white uppercase">Activo</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-amber-500 text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
            
            {showSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Perfil persistido en DB</p>
              </div>
            )}
            
            <button 
              onClick={onLogout}
              className="w-full py-5 bg-rose-50 text-rose-600 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrendatarioSettingsView;
