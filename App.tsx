
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
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const FleetView = React.lazy(() => import('./components/FleetView'));
const DriversView = React.lazy(() => import('./components/DriversView'));
const FinanceView = React.lazy(() => import('./components/FinanceView'));
const RiskAIView = React.lazy(() => import('./components/RiskAIView'));
const CompanySettingsView = React.lazy(() => import('./components/CompanySettingsView'));
const SuperAdminView = React.lazy(() => import('./components/SuperAdminView'));
const ArrendatarioView = React.lazy(() => import('./components/ArrendatarioView'));
const ArrendatarioSettingsView = React.lazy(() => import('./components/ArrendatarioSettingsView'));
import { UserRole, Vehicle, Driver, Notification } from './shared/types';
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
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
            <img src="/logo.png" alt="Aurum Logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-black tracking-tighter uppercase italic text-white">Aurum Leasing</span>
          </div>
          <button
            onClick={onStart}
            className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl"
          >
            Acceso Staff
          </button>
        </div>
      </header>

      <main className="relative">
        {/* HERO SECTION */}
        <section className="pt-48 pb-32 px-6 max-w-7xl mx-auto relative min-h-[90vh] flex flex-col justify-center">
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
              Gestión de activos móviles de alto rendimiento para flotas Enterprise, impulsada por tecnología Gemini AI Pro para la máxima rentabilidad.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStart}
                className="px-12 py-7 bg-amber-500 text-slate-900 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Comenzar ahora <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex -space-x-3 items-center ml-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                  </div>
                ))}
                <span className="ml-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">+500 Flotas Gestionadas</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[60%] h-[120%] bg-amber-500/10 blur-[150px] -z-10"></div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-32 px-6 bg-slate-900/50 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">AI Risk Analysis</h3>
                <p className="text-slate-400 leading-relaxed">Evaluación predictiva de conductores mediante algoritmos avanzados para reducir la siniestralidad y el impago.</p>
              </div>
              <div className="space-y-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Omnicanalidad</h3>
                <p className="text-slate-400 leading-relaxed">Conexión directa vía WhatsApp API para cobranza automatizada, alertas de mantenimiento y soporte 24/7.</p>
              </div>
              <div className="space-y-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Control 360°</h3>
                <p className="text-slate-400 leading-relaxed">Dashboard ejecutivo con métricas de rendimiento en tiempo real, histórico de flotas y proyecciones financieras.</p>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS SECTION */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="flex-1">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter italic mb-8">NÚMEROS QUE <br /> <span className="text-amber-500">HABLAN.</span></h2>
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <span className="text-6xl font-black text-white italic tracking-tighter">30%</span>
                  <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Reducción promedio <br /> de riesgo crediticio</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-6xl font-black text-white italic tracking-tighter">99.9%</span>
                  <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Disponibilidad del <br /> sistema SaaS</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-amber-500 to-amber-700 p-1 rounded-[3rem] shadow-2xl">
              <div className="bg-slate-950 p-12 rounded-[2.8rem] space-y-6">
                <blockquote className="text-2xl font-medium italic text-slate-200">
                  "AurumLeasing transformó nuestra gestión de flota de 200 vehículos. La IA nos ahorra miles de dólares al mes en mantenimiento preventivo."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800"></div>
                  <div>
                    <p className="text-sm font-black uppercase italic">Director de Operaciones</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Corporación Logística Global</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Aurum Logo" className="w-10 h-10 object-contain" />
              <span className="text-lg font-black tracking-tighter uppercase italic text-white">Aurum Leasing</span>
            </div>
            <p className="text-slate-500 max-w-sm text-sm">El ecosistema definitivo para el control de activos vehiculares de alto impacto.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-6">Plataforma</h4>
            <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <li className="hover:text-amber-500 cursor-pointer transition-colors">RiskAI Engine</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Flota Enterprise</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">API Docs</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-6">Compañía</h4>
            <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Privacidad</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Términos</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Contacto</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          <p>© 2026 Aurum Leasing. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">SLA 99%</span>
            <span className="hover:text-white cursor-pointer transition-colors">Certificado SSL</span>
          </div>
        </div>
      </footer>
      <WhatsAppFloat phone={systemConfig.saas_contact_whatsapp} />
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
  const [systemConfig, setSystemConfig] = useState<any>({ saas_contact_whatsapp: '5215555555555' });

  useEffect(() => {
    const loadConfig = async () => {
      const config = await persistenceService.getSystemConfig();
      if (config.saas_contact_whatsapp) setSystemConfig(config);
    };
    loadConfig();
  }, []);

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

  const handleLogin = (user: any) => {
    setRole(user.role as UserRole);
    setView('app');
    localStorage.setItem('aurum_session_role', user.role);
    localStorage.setItem('aurum_user', JSON.stringify(user));
  };

  const handleLogout = useCallback(() => {
    if (confirm('¿Cerrar sesión en Aurum Leasing?')) {
      localStorage.removeItem('aurum_session_role');
      localStorage.removeItem('aurum_user');
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
          { id: 'drivers', label: 'Conductores', icon: <Users className="w-5 h-5" /> },
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
          <img src="/logo.png" alt="Aurum Logo" className="w-10 h-10 object-contain" />
          <span className="text-lg font-black tracking-tighter uppercase italic text-white">Aurum Leasing</span>
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
            <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
              {role === UserRole.ARRENDADOR && (
                <>
                  {activeTab === 'dashboard' && <DashboardView />}
                  {activeTab === 'fleet' && <FleetView />}
                  {activeTab === 'drivers' && <DriversView />}
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
            </React.Suspense>
          </div>
        )}
        <WhatsAppFloat phone={systemConfig.saas_contact_whatsapp} />
      </main>
    </div>
  );
};

const LoginView: React.FC<{ onLogin: (user: any) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
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
        onLogin(res.user);
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
            <img src="/logo.png" alt="Aurum Logo" className="w-24 h-24 object-contain mx-auto mb-6" />
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

const WhatsAppFloat: React.FC<{ phone: string }> = ({ phone }) => (
  <a 
    href={`https://wa.me/${phone}`} 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-10 right-10 z-[100] w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
  >
    <div className="absolute -top-12 right-0 bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
      ¿Necesitas ayuda?
    </div>
    <MessageSquare className="w-8 h-8" />
  </a>
);
