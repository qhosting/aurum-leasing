
import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, 
  Bell, Lock, Smartphone, HeartPulse, 
  Save, Camera, Star, CheckCircle2, 
  AlertCircle, ChevronRight, Eye, EyeOff,
  LogOut, Globe, Moon, CreditCard, Hash,
  Loader2
} from 'lucide-react';
import { MOCK_DRIVERS } from '../constants';

interface ArrendatarioSettingsViewProps {
  onLogout: () => void;
}

const ArrendatarioSettingsView: React.FC<ArrendatarioSettingsViewProps> = ({ onLogout }) => {
  const driver = MOCK_DRIVERS[0];
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    phone: driver.phone,
    email: 'juan.perez@aurum.mx',
    address: 'Av. de los Insurgentes Sur 1234, CDMX',
    emergencyName: 'Marta Pérez',
    emergencyPhone: '55 9988 7766',
    emergencyRel: 'Esposa',
    notifications: {
      payments: true,
      maintenance: true,
      promos: false
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const labelStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block";
  const inputStyles = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all";
  const cardStyles = "bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      {/* Header Profile Hero */}
      <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-slate-900 text-5xl font-black shadow-2xl border-4 border-white/10 group-hover:scale-105 transition-transform duration-500">
              {driver.name.charAt(0)}
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-xl hover:bg-amber-400 transition-colors">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
              <h2 className="text-3xl font-black tracking-tight">{driver.name}</h2>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-500/30">Nivel Platinum</span>
            </div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center justify-center md:justify-start gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {driver.rating} Rating de Conductor
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-fit">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Miembro desde</p>
              <p className="text-sm font-black text-white">Ene 2023</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-sm font-black text-white">02 Activos</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Contratos</p>
            </div>
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
              <div className="space-y-1">
                <label className={labelStyles}>Email Personal</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    className={`${inputStyles} pl-12`} 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                <label className={labelStyles}>Nombre Completo</label>
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

          <div className={cardStyles}>
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <Lock className="w-5 h-5 text-amber-500" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Seguridad de Cuenta</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelStyles}>Contraseña Actual</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={inputStyles} 
                    defaultValue="••••••••" 
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelStyles}>Nueva Contraseña</label>
                <input type="password" className={inputStyles} placeholder="Dejar en blanco para no cambiar" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-6">Detalles de Socio</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Contrato</p>
                <p className="text-sm font-black text-white">#AUR-8829</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estatus</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-sm font-black text-white">ACTIVO</p>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Límite de Fianza</p>
                <p className="text-sm font-black text-amber-500">$15,000.00</p>
              </div>
            </div>
          </div>

          <div className={cardStyles}>
            <h5 className={labelStyles}>Preferencias</h5>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Alertas de Pago</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Notif. de Taller</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-500" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Tema Oscuro</span>
                <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-500" />
              </label>
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
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Perfil actualizado con éxito</p>
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
