
import React, { useState, useMemo, useEffect } from 'react';
import { VehicleStatus, Vehicle, MaintenanceRecord } from '../shared/types';
import {
  Search, Plus, Car, ShieldCheck,
  Wrench, X, Settings2,
  AlertTriangle, ChevronRight, Gauge,
  Zap, ClipboardList, Filter,
  FileText, PlusCircle, MoreVertical, ExternalLink,
  DollarSign, Percent, Save, Briefcase, Hash,
  Calendar, Info, Check, History, Activity, AlertCircle,
  MapPin, Compass, Thermometer, Droplet, Fuel,
  Orbit, Wind, Navigation, Heart, Loader2,
  CheckCircle2, User
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';
import MaintenanceModal from './MaintenanceModal';

interface FleetViewProps {
  isAddingExternal?: boolean;
  onDrawerClose?: () => void;
}

const FleetView: React.FC<FleetViewProps> = ({ isAddingExternal, onDrawerClose }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [activeTabDetail, setActiveTabDetail] = useState<'info' | 'history'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [isLoggingMaintenance, setIsLoggingMaintenance] = useState(false);

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    brand: '', model: '', plate: '', year: new Date().getFullYear(),
    mileage: 0, status: VehicleStatus.AVAILABLE, monthlyRent: 8000,
    securityDeposit: 15000, interestRate: 1.5, nextMaintenanceKm: 5000,
    insuranceExpiry: '2025-06-01', verificationExpiry: '2025-06-01',
    maintenanceHistory: []
  });

  const fetchData = async () => {
    setIsLoading(true);
    const data = await persistenceService.getVehicles();
    setVehicles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (isAddingExternal) setIsAddingVehicle(true);
  }, [isAddingExternal]);

  useEffect(() => {
    if (selectedVehicle && activeTabDetail === 'history') {
      persistenceService.getMaintenanceHistory(selectedVehicle.id).then(setMaintenanceHistory);
    }
  }, [selectedVehicle, activeTabDetail]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = activeFilter === 'ALL' || v.status === activeFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, activeFilter, vehicles]);

  const handleSaveNewVehicle = async () => {
    if (!newVehicle.plate || !newVehicle.brand) return;
    setIsSaving(true);
    const result = await persistenceService.saveVehicle(newVehicle);
    if (result.success) {
      await fetchData();
      setIsAddingVehicle(false);
    } else {
      alert("Error guardando unidad: " + result.error);
    }
    setIsSaving(false);
  };

  const labelStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block";
  const inputStyles = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all";

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="relative min-h-[calc(100vh-120px)] pb-24 lg:pb-0">
      <div className="hidden lg:flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black italic uppercase italic">Control de <span className="text-amber-500">Flotas</span></h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddingVehicle(true)}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-500" /> Registrar Nueva Unidad
          </button>
        </div>
      </div>

      <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto pb-6 gap-4 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
        <StatSummaryCard title="Unidades Totales" value={vehicles.length} icon={<Car className="w-5 h-5" />} active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} />
        <StatSummaryCard title="En Taller" value={vehicles.filter(v => v.status === VehicleStatus.WORKSHOP).length} icon={<Wrench className="w-5 h-5" />} active={activeFilter === VehicleStatus.WORKSHOP} onClick={() => setActiveFilter(VehicleStatus.WORKSHOP)} />
        <StatSummaryCard title="Disponibles" value={vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length} icon={<CheckCircle2 className="w-5 h-5" />} active={activeFilter === VehicleStatus.AVAILABLE} onClick={() => setActiveFilter(VehicleStatus.AVAILABLE)} />
        <StatSummaryCard title="Mantenimiento Próximo" value={vehicles.filter(v => v.next_maintenance_km && (v.next_maintenance_km - v.mileage) < 1000).length} icon={<AlertTriangle className="w-5 h-5 text-rose-500" />} color="rose" />
      </div>

      <div className="mb-8">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filtrar por placa, marca o modelo..." className="w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVehicles.map(v => (
          <div key={v.id} onClick={() => setSelectedVehicle(v)} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all duration-300 cursor-pointer group p-8 hover:shadow-2xl hover:border-amber-500/20">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                  <Car className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg leading-none">{v.brand} <span className="text-slate-400 font-bold">{v.model}</span></h4>
                  <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase tracking-widest mt-3 inline-block">{v.plate}</span>
                </div>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometraje</p>
                <div className="flex items-center gap-2">
                  <Gauge className="w-3 h-3 text-amber-500" />
                  <p className="text-sm font-black text-slate-900">{(v.mileage || 0).toLocaleString()} km</p>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${v.next_maintenance_km && (v.next_maintenance_km - v.mileage) < 1000 ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Servicio</p>
                <div className="flex items-center gap-2">
                  <Wrench className={`w-3 h-3 ${v.next_maintenance_km && (v.next_maintenance_km - v.mileage) < 1000 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                  <p className={`text-sm font-black ${v.next_maintenance_km && (v.next_maintenance_km - v.mileage) < 1000 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {(v.next_maintenance_km || 0).toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedVehicle(null)}></div>
          <div className="relative w-full lg:max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 lg:rounded-l-[4rem]">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedVehicle.plate}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedVehicle(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[2rem] mb-10">
                <button onClick={() => setActiveTabDetail('info')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTabDetail === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Especificaciones</button>
                <button onClick={() => setActiveTabDetail('history')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTabDetail === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mantenimiento</button>
              </div>

              {activeTabDetail === 'info' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={<Gauge className="w-4 h-4 text-amber-500" />} label="Kilometraje Actual" value={`${(selectedVehicle.mileage || 0).toLocaleString()} km`} />
                    <InfoItem icon={<Calendar className="w-4 h-4 text-amber-500" />} label="Año Modelo" value={selectedVehicle.year} />
                    <InfoItem icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} label="Seguro Vence" value={selectedVehicle.insurance_expiry || 'No registrado'} />
                    <InfoItem icon={<Activity className="w-4 h-4 text-amber-500" />} label="Estatus" value={selectedVehicle.status} />
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white overflow-hidden relative group">
                    <div className="flex items-center gap-3 mb-6">
                      <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Aurum Risk Engine</span>
                    </div>
                    <h4 className="text-xl font-black mb-2">Análisis de Integridad</h4>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
                      {selectedVehicle.status === VehicleStatus.ACTIVE
                        ? "Unidad en condiciones óptimas. Próximo servicio recomendado en 2,400km."
                        : "Unidad requiere atención inmediata en sistema de frenos."}
                    </p>
                    <button className="w-full py-4 bg-white/10 hover:bg-amber-500 hover:text-slate-900 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Auditoría Completa</button>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Historial de Servicios</h4>
                    <button
                      onClick={() => setIsLoggingMaintenance(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" /> Registrar Servicio
                    </button>
                  </div>

                  <div className="space-y-4">
                    {maintenanceHistory.length === 0 ? (
                      <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay registros aún</p>
                      </div>
                    ) : (
                      maintenanceHistory.map((log, i) => (
                        <div key={i} className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:shadow-xl transition-all group flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${log.type === 'Preventivo' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-black text-slate-900 text-sm tracking-tight">{log.description}</p>
                              <p className="text-xs font-black text-slate-900">${parseFloat(log.cost).toLocaleString()}</p>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{new Date(log.date).toLocaleDateString()} • {log.mileage.toLocaleString()} km</p>
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-600 transition-colors">
                              <User className="w-3 h-3" /> Performado por: {log.performed_by || 'Aurum Internal'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoggingMaintenance && selectedVehicle && (
        <MaintenanceModal
          vehicleId={selectedVehicle.id}
          currentMileage={selectedVehicle.mileage || 0}
          onClose={() => setIsLoggingMaintenance(false)}
          onSuccess={() => {
            fetchData();
            persistenceService.getMaintenanceHistory(selectedVehicle.id).then(setMaintenanceHistory);
          }}
        />
      )}

      {isAddingVehicle && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsAddingVehicle(false)}></div>
          <div className="relative w-full lg:max-w-xl bg-white h-full shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-500 lg:rounded-l-[4rem]">
            <h3 className="text-3xl font-black italic uppercase mb-12">Registrar <span className="text-amber-500">Unidad</span></h3>
            <div className="space-y-8">
              <div><label className={labelStyles}>Marca / Fabricante</label><input className={inputStyles} placeholder="Ej: Chevrolet" value={newVehicle.brand} onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></div>
              <div><label className={labelStyles}>Modelo / Línea</label><input className={inputStyles} placeholder="Ej: Aveo NG" value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyles}>Placa</label><input className={inputStyles} placeholder="ABC-1234" value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value })} /></div>
                <div><label className={labelStyles}>Año</label><input type="number" className={inputStyles} value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })} /></div>
              </div>
              <button
                onClick={handleSaveNewVehicle}
                disabled={isSaving}
                className="w-full py-6 mt-10 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-slate-900/30 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-6 h-6 text-amber-500" /> Confirmar Alta de Unidad</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatSummaryCard = ({ title, value, icon, active, onClick, color }: any) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`min-w-[200px] flex-1 p-8 rounded-[3rem] transition-all border text-left h-44 flex flex-col justify-between group ${active
      ? 'bg-slate-900 text-white border-slate-900 shadow-2xl -translate-y-2'
      : 'bg-white text-slate-400 border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-500/20'
      }`}
  >
    <div className="flex justify-between items-start">
      <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${active ? 'bg-amber-500 text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
        {icon}
      </div>
      {color === 'rose' && <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{title}</p>
      <p className={`text-4xl font-black ${active ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  </button>
);

const InfoItem = ({ icon, label, value }: any) => (
  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-900">{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: VehicleStatus }) => {
  const styles: any = {
    [VehicleStatus.ACTIVE]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [VehicleStatus.WORKSHOP]: 'bg-rose-50 text-rose-600 border-rose-100',
    [VehicleStatus.AVAILABLE]: 'bg-blue-50 text-blue-600 border-blue-100',
    [VehicleStatus.DEBT_HOLD]: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
};

export default FleetView;
