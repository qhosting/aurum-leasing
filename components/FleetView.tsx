
import React, { useState, useMemo, useEffect } from 'react';
import { VehicleStatus, Vehicle, MaintenanceRecord } from '../types';
import { 
  Search, Plus, Car, ShieldCheck, 
  Wrench, X, Settings2,
  AlertTriangle, ChevronRight, Gauge, 
  Zap, ClipboardList, Filter, 
  FileText, PlusCircle, MoreVertical, ExternalLink,
  DollarSign, Percent, Save, Briefcase, Hash,
  Calendar, Info, Check, History, Activity, AlertCircle,
  MapPin, Compass, Thermometer, Droplet, Fuel, 
  Orbit, Wind, Navigation, Heart, Loader2
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';

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

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    brand: '', model: '', plate: '', year: new Date().getFullYear(),
    mileage: 0, status: VehicleStatus.AVAILABLE, monthlyRent: 8000,
    securityDeposit: 15000, interestRate: 1.5, nextMaintenanceKm: 5000,
    insuranceExpiry: '2025-01-01', verificationExpiry: '2025-01-01',
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
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddingVehicle(true)}
            className="px-6 py-2.5 bg-amber-500 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Registrar Nueva Unidad
          </button>
        </div>
      </div>

      <div className="flex lg:grid lg:grid-cols-3 overflow-x-auto pb-6 gap-4 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
        <button onClick={() => setActiveFilter('ALL')} className={`min-w-[160px] flex-1 p-6 rounded-[2rem] transition-all border text-left ${activeFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Flota Total</p><Car className="w-4 h-4" /></div>
          <p className="text-4xl font-black">{vehicles.length}</p>
        </button>
      </div>

      <div className="mb-8">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar unidad..." className="w-full pl-14 pr-6 py-4 lg:py-5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => (
          <div key={v.id} onClick={() => setSelectedVehicle(v)} className="bg-white rounded-[2.8rem] border border-slate-200 shadow-sm overflow-hidden active:scale-[0.97] transition-all duration-300 cursor-pointer group p-7">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-[1.5rem] flex items-center justify-center border border-slate-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl leading-none">{v.brand} {v.model}</h4>
                    <span className="text-[11px] font-mono font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg uppercase tracking-tighter mt-3 inline-block">{v.plate}</span>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
          </div>
        ))}
      </div>

      {isAddingVehicle && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-stretch lg:justify-end">
           <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsAddingVehicle(false)}></div>
           <div className="relative w-full lg:max-w-xl bg-white rounded-t-[4rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[90vh] lg:h-full overflow-y-auto p-10 animate-in slide-in-from-right">
              <h3 className="text-3xl font-black italic uppercase mb-10">Nueva Unidad</h3>
              <div className="space-y-6">
                <div><label className={labelStyles}>Marca</label><input className={inputStyles} value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} /></div>
                <div><label className={labelStyles}>Modelo</label><input className={inputStyles} value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} /></div>
                <div><label className={labelStyles}>Placa</label><input className={inputStyles} value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} /></div>
                <button 
                  onClick={handleSaveNewVehicle}
                  disabled={isSaving}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 text-amber-500" /> Guardar Unidad</>}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: VehicleStatus }) => {
  const styles: any = {
    [VehicleStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [VehicleStatus.WORKSHOP]: 'bg-rose-100 text-rose-700 border-rose-200',
    [VehicleStatus.AVAILABLE]: 'bg-blue-100 text-blue-700 border-blue-200',
    [VehicleStatus.DEBT_HOLD]: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  return <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
};

export default FleetView;
