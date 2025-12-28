
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

  const handleDetectLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (latitude > 19 && latitude < 20) {
            setUserLocation("CDMX & Valle de México");
          } else if (latitude > 25 && latitude < 26) {
            setUserLocation("Monterrey & Área Norte");
          } else {
            setUserLocation("México (Cobertura Nacional)");
          }
          setIsLocating(false);
        },
        () => {
          setUserLocation("México");
          setIsLocating(false);
        }
      );
    }
  };

  useEffect(() => {
    handleDetectLocation();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500/30 overflow-x-hidden scroll-smooth selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5" role="banner">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" aria-label="Navegación principal">
          <button onClick={scrollToTop} className="flex items-center gap-3 group transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-black text-slate-900 text-xl shadow-lg group-hover:shadow-amber-500/20">A</div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Aurum</span>
          </button>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#tecnologia" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Tecnología AI</a>
            <a href="#cobertura" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Cobertura</a>
            <a href="#planes" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Planes</a>
            <button 
              onClick={onStart}
              className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Acceso Staff
            </button>
          </div>
          
          <button onClick={onStart} className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-amber-500">
            <UserCircle className="w-6 h-6" />
          </button>
        </nav>
      </header>

      <main>
        <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
          <div className="max-w-7xl mx-auto relative z-10 w-full">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in slide-in-from-bottom duration-1000">
                <Sparkles className="w-3 h-3" /> 
                {isLocating ? "Sincronizando ubicación..." : `Sede Aurum: ${userLocation || "México"}`}
              </div>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter italic leading-[0.85] mb-10 animate-in slide-in-from-bottom duration-1000 delay-100">
                EL LEASING <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">INTELIGENTE</span> <br />
                YA LLEGÓ.
              </h1>
              <p className="text-lg md:text-2xl text-slate-400 font-medium leading-relaxed mb-12 max-w-2xl animate-in slide-in-from-bottom duration-1000 delay-200">
                Gestión de activos móviles de alto rendimiento para flotas Enterprise, impulsada por Gemini AI Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 animate-in slide-in-from-bottom duration-1000 delay-300">
                <button 
                  onClick={onStart}
                  className="px-12 py-7 bg-amber-500 text-slate-900 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all"
                >
                  Comenzar ahora <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={onStart}
                  className="px-12 py-7 bg-slate-900 border border-white/10 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/5 transition-all active:scale-95 backdrop-blur-md"
                >
                  Ver Demo <Zap className="w-5 h-5 text-amber-500" />
                </button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[60%] h-[120%] bg-gradient-to-bl from-amber-500/10 via-slate-950 to-transparent blur-[150px] -z-10"></div>
        </section>

        <section id="cobertura" className="py-24 border-y border-white/5 bg-slate-900/30 backdrop-blur-sm scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatItem value="500+" label="Unidades Activas" />
            <StatItem value="14" label="Ciudades" />
            <StatItem value="98.5%" label="Satisfacción" />
            <StatItem value="24/7" label="Soporte GPS" />
          </div>
        </section>
      </main>
      
      <footer className="py-24 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-900">A</div>
            <span className="font-black tracking-tighter uppercase italic">Aurum Leasing</span>
          </div>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">© 2024 Aurum Enterprise. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

const StatItem = ({ value, label }: any) => (
  <div className="text-center md:text-left">
    <p className="text-4xl md:text-5xl font-black text-white mb-2 leading-none">{value}</p>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'login' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [role, setRole] = useState<UserRole>(UserRole.ARRENDATARIO);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [globalVisits, setGlobalVisits] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [globalData, setGlobalData] = useState<{vehicles: Vehicle[], drivers: Driver[]}>({vehicles: [], drivers: []});

  const refreshData = useCallback(async () => {
    setIsDataLoaded(false);
    const [vehicles, drivers, stats] = await Promise.all([
      persistenceService.getVehicles(),
      persistenceService.getDrivers(),
      persistenceService.getGlobalStats()
    ]);
    setGlobalData({ vehicles, drivers });
    setGlobalVisits(stats.visits);
    
    // FETCH REAL NOTIFICATIONS FROM API
    const userId = role === UserRole.ARRENDATARIO ? 'd1' : '';
    const notifs = await persistenceService.getNotifications(role, userId);
    setNotifications(notifs);
    
    setIsDataLoaded(true);
  }, [role]);

  useEffect(() => {
    refreshData();
    const savedRole = localStorage.getItem('aurum_session_role');
    if (savedRole) {
      setRole(savedRole as UserRole);
      setView('app');
    }
  }, [refreshData]);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setView('app');
    localStorage.setItem('aurum_session_role', selectedRole);
    refreshData();
  };

  const handleLogout = useCallback(() => {
    if (confirm('¿Cerrar sesión en Aurum Leasing?')) {
      localStorage.removeItem('aurum_session_role');
      setRole(UserRole.ARRENDATARIO);
      setActiveTab('dashboard');
      setView('landing');
      setIsMobileMenuOpen(false);
    }
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markNotificationRead = async (id: string) => {
    await persistenceService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = async () => {
    const userId = role === UserRole.ARRENDATARIO ? 'd1' : '';
    await persistenceService.clearNotifications(role, userId);
    setNotifications([]);
  };

  const menuItems = useMemo(() => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return [
          { id: 'dashboard', label: 'Consola Global', icon: <ShieldCheck className="w-5 h-5" /> },
          { id: 'arrendadoras', label: 'Clientes SaaS', icon: <Building2 className="w-5 h-5" /> },
          { id: 'settings', label: 'Configuración SaaS', icon: <Settings className="w-5 h-5" /> },
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

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-500 lg:translate-x-0 lg:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Total Accesos (Redis): {globalVisits}</p>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-widest transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-hidden relative">
        <header className="mb-10 flex justify-between items-center relative">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-amber-500 underline-offset-8">{activeTab}</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center relative ${
                  isNotificationsOpen ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200 shadow-sm hover:border-amber-500'
                }`}
              >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <NotificationCenter 
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onMarkRead={markNotificationRead}
                onClear={clearNotifications}
              />
            </div>

            <button className="lg:hidden w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-6 h-6 text-slate-900" />
            </button>
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
                {(activeTab === 'dashboard' || activeTab === 'arrendadoras') && <SuperAdminView onLogout={handleLogout} />}
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
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
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
    setError('');
    setIsLoading(true);

    try {
      const response = await persistenceService.login(email, password);
      
      if (response.success && response.user) {
        onLogin(response.user.role);
      } else {
        setError(response.error || 'Credenciales no válidas para el sistema Aurum.');
      }
    } catch (err) {
      setError('Error crítico de conexión. Reintente más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group">
          <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver a la web
        </button>

        <div className="bg-slate-900 border border-white/5 p-10 md:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center font-black text-slate-900 text-3xl shadow-xl mx-auto mb-6">A</div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Acceso Staff</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">Seguridad Nivel Enterprise</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID de Usuario / Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all placeholder:text-slate-800"
                  placeholder="usuario@aurum.mx"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-amber-500 transition-all placeholder:text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-black uppercase text-center animate-in shake duration-500">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-6 bg-amber-500 text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/20 active:scale-95 transition-all">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
               Al ingresar aceptas nuestras políticas de <br /> privacidad y seguridad de datos biométricos.
             </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
