
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Layout, Users, Car, DollarSign, Settings, 
  BrainCircuit, ShieldCheck, Building2, UserCircle, 
  LogOut, ChevronDown, Download, WifiOff, X, Menu as MenuIcon,
  Loader2, CheckCircle2, ArrowRight, Zap, Globe, Shield, 
  ChevronRight, Mail, Lock, Sparkles, Star, TrendingUp,
  CreditCard, Smartphone, MapPin, Navigation, MousePointer2,
  Bell, Clock, Trash2
} from 'lucide-react';
import DashboardView from './components/DashboardView';
import FleetView from './components/FleetView';
import FinanceView from './components/FinanceView';
import RiskAIView from './components/RiskAIView';
import CompanySettingsView from './components/CompanySettingsView';
import SuperAdminView from './components/SuperAdminView';
import ArrendatarioView from './components/ArrendatarioView';
import ArrendatarioSettingsView from './components/ArrendatarioSettingsView';
import { UserRole, Vehicle, Driver, Notification } from './types';
import { persistenceService } from './services/persistenceService';

// --- COMPONENTE: NOTIFICATION CENTER ---
const NotificationCenter: React.FC<{ 
  notifications: Notification[]; 
  onMarkRead: (id: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ notifications, onMarkRead, onClear, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-16 w-80 md:w-96 bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-4 duration-300">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Notificaciones</h3>
        <button onClick={onClear} className="text-[10px] font-black text-rose-500 uppercase hover:text-rose-600 transition-colors">Limpiar</button>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin avisos nuevos</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => onMarkRead(n.id)}
              className={`p-5 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 flex gap-4 ${!n.read ? 'bg-amber-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                n.type === 'payment' ? 'bg-emerald-100 text-emerald-600' : 
                n.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {n.type === 'payment' ? <DollarSign className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-900 leading-tight">{n.title}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{n.message}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{n.timestamp}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-2"></div>}
            </div>
          ))
        )}
      </div>
      <button onClick={onClose} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100 hover:text-slate-600 transition-colors">Cerrar</button>
    </div>
  );
};

// --- COMPONENTE: LANDING PAGE ---
const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation(pos.coords.latitude > 19 ? "CDMX & Área Metropolitana" : "México");
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500/30 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-xl shadow-lg">A</div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Aurum</span>
          </div>
          <button 
            onClick={onStart}
            className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl"
          >
            Acceso Staff
          </button>
        </div>
      </header>

      <main className="pt-48 pb-32 px-6 max-w-7xl mx-auto relative">
        <div className="max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest mb-8">
            <Sparkles className="w-3 h-3" /> 
            {isLocating ? "Detectando ubicación..." : `Sede: ${userLocation || "México"}`}
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter italic leading-[0.85] mb-10">
            EL LEASING <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">INTELIGENTE</span> <br />
            YA LLEGÓ.
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 font-medium max-w-2xl mb-12">
            Gestión de activos móviles de alto rendimiento para flotas Enterprise, impulsada por Gemini AI Pro.
          </p>
          <button 
            onClick={onStart}
            className="px-12 py-7 bg-amber-500 text-slate-900 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Comenzar ahora <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-[60%] h-[120%] bg-amber-500/10 blur-[150px] -z-10"></div>
      </main>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'login' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [role, setRole] = useState<UserRole | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [globalVisits, setGlobalVisits] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const refreshData = useCallback(async () => {
    if (!role) return;
    setIsDataLoaded(false);
    const stats = await persistenceService.getGlobalStats();
    setGlobalVisits(stats.visits);
    
    const userId = role === UserRole.ARRENDATARIO ? 'd1' : '';
    const notifs = await persistenceService.getNotifications(role, userId);
    setNotifications(notifs);
    setIsDataLoaded(true);
  }, [role]);

  useEffect(() => {
    const savedRole = localStorage.getItem('aurum_session_role');
    if (savedRole) {
      setRole(savedRole as UserRole);
      setView('app');
    }
  }, []);

  useEffect(() => {
    if (view === 'app') refreshData();
  }, [view, refreshData]);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setView('app');
    localStorage.setItem('aurum_session_role', selectedRole);
  };

  const handleLogout = useCallback(() => {
    if (confirm('¿Cerrar sesión en Aurum Leasing?')) {
      localStorage.removeItem('aurum_session_role');
      setRole(null);
      setView('landing');
      setActiveTab('dashboard');
    }
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markNotificationRead = async (id: string) => {
    await persistenceService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const menuItems = useMemo(() => {
    if (!role) return [];
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return [
          { id: 'dashboard', label: 'Consola Global', icon: <ShieldCheck className="w-5 h-5" /> },
          { id: 'arrendadoras', label: 'Clientes SaaS', icon: <Building2 className="w-5 h-5" /> },
          { id: 'settings', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
        ];
      case UserRole.ARRENDADOR:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: <Layout className="w-5 h-5" /> },
          { id: 'fleet', label: 'Flota', icon: <Car className="w-5 h-5" /> },
          { id: 'finance', label: 'Finanzas', icon: <DollarSign className="w-5 h-5" /> },
          { id: 'risk', label: 'Riesgo AI', icon: <BrainCircuit className="w-5 h-5" /> },
          { id: 'settings', label: 'Mi Empresa', icon: <Settings className="w-5 h-5" /> },
        ];
      default:
        return [
          { id: 'dashboard', label: 'Mi Centro', icon: <UserCircle className="w-5 h-5" /> },
          { id: 'settings', label: 'Ajustes', icon: <Settings className="w-5 h-5" /> },
        ];
    }
  }, [role]);

  if (view === 'landing') return <LandingPage onStart={() => setView('login')} />;
  if (view === 'login') return <LoginView onLogin={handleLogin} onBack={() => setView('landing')} />;
  if (view === 'app' && !role) { setView('login'); return null; }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:static'}`}>
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-xl shadow-lg">A</div>
          <span className="text-lg font-black tracking-tighter uppercase italic">Aurum</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-500 text-slate-900 font-bold shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              {item.icon}
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 bg-slate-950/50">
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2 italic">Accesos Globales: {globalVisits}</p>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-widest transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-hidden relative">
        <header className="mb-10 flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-amber-500 underline-offset-8">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center relative transition-all ${isNotificationsOpen ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
              </button>
              <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkRead={markNotificationRead} onClear={() => setNotifications([])} />
            </div>
            <button className="lg:hidden w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center" onClick={() => setIsMobileMenuOpen(true)}><MenuIcon className="w-6 h-6 text-slate-900" /></button>
          </div>
        </header>

        {!isDataLoaded ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {role === UserRole.ARRENDADOR && (
              <>
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'fleet' && <FleetView />}
                {activeTab === 'finance' && <FinanceView refreshGlobalNotifs={refreshData} />}
                {activeTab === 'risk' && <RiskAIView />}
                {activeTab === 'settings' && <CompanySettingsView onLogout={handleLogout} />}
              </>
            )}
            {role === UserRole.SUPER_ADMIN && (
              <>
                {activeTab === 'dashboard' && <SuperAdminView onLogout={handleLogout} />}
                {activeTab === 'settings' && <CompanySettingsView onLogout={handleLogout} />}
              </>
            )}
            {role === UserRole.ARRENDATARIO && (
              <>
                {activeTab === 'dashboard' ? <ArrendatarioView refreshGlobalNotifs={refreshData} /> : <ArrendatarioSettingsView onLogout={handleLogout} />}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const LoginView: React.FC<{ onLogin: (role: UserRole) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await persistenceService.login(email, password);
      if (res.success && res.user) {
        onLogin(res.user.role as UserRole);
      } else {
        setError(res.error || 'Credenciales inválidas.');
      }
    } catch {
      setError('Error de conexión con el servidor Aurum.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronRight className="w-4 h-4 rotate-180" /> Volver
        </button>
        <div className="bg-slate-900 border border-white/5 p-12 rounded-[4rem] shadow-2xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center font-black text-slate-900 text-3xl mx-auto mb-6">A</div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Acceso Staff</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-2 px-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-2 px-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all" />
            </div>
            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}
            <button disabled={isLoading} className="w-full py-6 bg-amber-500 text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
