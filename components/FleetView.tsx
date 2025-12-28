
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_VEHICLES } from '../constants';
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

interface FleetViewProps {
  isAddingExternal?: boolean;
  onDrawerClose?: () => void;
}

const FleetView: React.FC<FleetViewProps> = ({ isAddingExternal, onDrawerClose }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isSchedulingMaintenance, setIsSchedulingMaintenance] = useState(false);
  const [activeTabDetail, setActiveTabDetail] = useState<'info' | 'history'>('info');
  const [formErrors, setFormErrors] = useState<{ insurance?: string; verification?: string; plate?: string }>({});

  const [maintenanceForm, setMaintenanceForm] = useState<Partial<MaintenanceRecord>>({
    type: 'Preventivo',
    description: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    mileage: 0
  });

  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

  useEffect(() => {
    if (isAddingExternal) {
      setIsAddingVehicle(true);
    }
  }, [isAddingExternal]);

  const handleCloseDrawer = () => {
    setIsAddingVehicle(false);
    setFormErrors({});
    if (onDrawerClose) onDrawerClose();
  };

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    brand: '', model: '', plate: '', year: new Date().getFullYear(),
    mileage: 0, status: VehicleStatus.AVAILABLE, monthlyRent: 0,
    securityDeposit: 0, interestRate: 1.5, nextMaintenanceKm: 5000,
    insuranceExpiry: '', verificationExpiry: '',
    maintenanceHistory: []
  });

  const validateDates = (insurance: string, verification: string) => {
    const errors: { insurance?: string; verification?: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (insurance) {
      const insDate = new Date(insurance);
      if (insDate < today) {
        errors.insurance = "La póliza no puede estar vencida.";
      }
    }

    if (verification) {
      const verDate = new Date(verification);
      if (verDate < today) {
        errors.verification = "La verificación no puede estar vencida.";
      }
    }

    return errors;
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = activeFilter === 'ALL' || v.status === activeFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, activeFilter, vehicles]);

  const stats = useMemo(() => ({
    total: vehicles.length,
    inWorkshop: vehicles.filter(v => v.status === VehicleStatus.WORKSHOP).length,
    critical: vehicles.filter(v => (v.nextMaintenanceKm - v.mileage) < 1000).length
  }), [vehicles]);

  const handleSaveNewVehicle = () => {
    const dateErrors = validateDates(newVehicle.insuranceExpiry || '', newVehicle.verificationExpiry || '');
    const plateExists = vehicles.some(v => v.plate.trim().toUpperCase() === (newVehicle.plate || '').trim().toUpperCase());
    const plateErrors = plateExists ? { plate: "Esta placa ya está registrada." } : {};

    const allErrors = { ...dateErrors, ...plateErrors };
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (!newVehicle.plate || !newVehicle.brand) return;
    const vehicleToAdd: Vehicle = {
      ...newVehicle as Vehicle,
      id: Math.random().toString(36).substr(2, 9),
      lastMaintenance: new Date().toISOString().split('T')[0],
      insuranceExpiry: newVehicle.insuranceExpiry || '2025-01-01',
      verificationExpiry: newVehicle.verificationExpiry || '2025-01-01',
      purchasePrice: 0,
      currentEstimatedValue: 0,
      maintenanceHistory: []
    };
    setVehicles([vehicleToAdd, ...vehicles]);
    handleCloseDrawer();
  };

  const handleSaveMaintenance = () => {
    if (!selectedVehicle) return;
    setIsSavingMaintenance(true);
    
    // Simular guardado
    setTimeout(() => {
      const newRecord: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: maintenanceForm.date || new Date().toISOString().split('T')[0],
        type: maintenanceForm.type as any,
        description: maintenanceForm.description || 'Mantenimiento programado',
        cost: maintenanceForm.cost || 0,
        mileage: maintenanceForm.mileage || selectedVehicle.mileage
      };

      const updatedVehicle = {
        ...selectedVehicle,
        status: VehicleStatus.WORKSHOP,
        maintenanceHistory: [newRecord, ...selectedVehicle.maintenanceHistory]
      };

      setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? updatedVehicle : v));
      setSelectedVehicle(updatedVehicle);
      setIsSchedulingMaintenance(false);
      setIsSavingMaintenance(false);
    }, 1500);
  };

  const openMaintenanceForm = () => {
    if (!selectedVehicle) return;
    setMaintenanceForm({
      type: 'Preventivo',
      description: `Mantenimiento preventivo para ${selectedVehicle.brand} ${selectedVehicle.model}`,
      cost: 0,
      date: new Date().toISOString().split('T')[0],
      mileage: selectedVehicle.mileage
    });
    setIsSchedulingMaintenance(true);
  };

  const labelStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block";
  const inputStyles = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all";

  return (
    <div className="relative min-h-[calc(100vh-120px)] pb-24 lg:pb-0">
      <button 
        className="lg:hidden fixed bottom-8 right-6 z-50 w-16 h-16 bg-slate-900 text-amber-500 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform border border-white/10"
        onClick={() => setIsAddingVehicle(true)}
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </button>

      <div className="hidden lg:flex justify-between items-center mb-8">
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Exportar Inventario
          </button>
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
          <p className={`text-4xl font-black ${activeFilter === 'ALL' ? 'text-amber-500' : 'text-slate-900'}`}>{stats.total}</p>
        </button>
        <button onClick={() => setActiveFilter(VehicleStatus.WORKSHOP)} className={`min-w-[160px] flex-1 p-6 rounded-[2rem] transition-all border text-left ${activeFilter === VehicleStatus.WORKSHOP ? 'bg-rose-600 text-white border-rose-600 shadow-xl' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">En Taller</p><Wrench className="w-4 h-4" /></div>
          <p className="text-4xl font-black">{stats.inWorkshop}</p>
        </button>
        <button onClick={() => setActiveFilter(VehicleStatus.DEBT_HOLD)} className={`min-w-[160px] flex-1 p-6 rounded-[2rem] transition-all border text-left ${activeFilter === VehicleStatus.DEBT_HOLD ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-xl' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-2"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Alertas Críticas</p><AlertTriangle className="w-4 h-4" /></div>
          <p className="text-4xl font-black">{stats.critical}</p>
        </button>
      </div>

      <div className="sticky top-16 lg:top-0 z-30 bg-slate-50/95 backdrop-blur-md lg:static lg:bg-transparent lg:backdrop-blur-none -mx-6 px-6 py-4 lg:mx-0 lg:px-0 lg:mb-8">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar unidad..." className="w-full pl-14 pr-6 py-4 lg:py-5 bg-white border border-slate-200 rounded-[1.5rem] lg:rounded-2xl text-sm font-bold shadow-xl shadow-slate-200/40 outline-none transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => (
          <div key={v.id} onClick={() => { setSelectedVehicle(v); setActiveTabDetail('info'); }} className="bg-white rounded-[2.8rem] border border-slate-200 shadow-sm overflow-hidden active:scale-[0.97] transition-all duration-300 cursor-pointer group">
            <div className="p-7">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-slate-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl leading-none">{v.brand} {v.model}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[11px] font-mono font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg uppercase tracking-tighter">{v.plate}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mantenimiento</p>
                   <p className="text-sm font-black text-slate-900">{(v.nextMaintenanceKm - v.mileage).toLocaleString()} km restantes</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DRAWER: DETALLE DEL VEHÍCULO --- */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-stretch lg:justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedVehicle(null)}></div>
          <div className="relative w-full lg:max-w-3xl bg-white rounded-t-[3.5rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[92vh] lg:h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 shadow-2xl">
            
            <div className="p-8 lg:p-12 bg-slate-900 text-white relative overflow-hidden shrink-0">
               <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-amber-500 text-slate-900 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-2xl animate-in zoom-in-75">{selectedVehicle.plate.charAt(0)}</div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter italic uppercase">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-mono font-black bg-white/10 text-amber-500 px-3 py-1 rounded-lg border border-white/10">{selectedVehicle.plate}</span>
                        <StatusBadge status={selectedVehicle.status} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedVehicle(null)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
               </div>
               
               <div className="flex gap-4 mt-12 overflow-x-auto no-scrollbar pb-2">
                  {[
                    { id: 'info', label: 'Información Base', icon: <Info className="w-4 h-4" /> },
                    { id: 'history', label: 'Historial', icon: <History className="w-4 h-4" /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabDetail(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTabDetail === tab.id ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 pb-40 no-scrollbar">
               {activeTabDetail === 'info' && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                     <div className="grid grid-cols-2 gap-4">
                        <DisplayStat label="Kilometraje" value={`${selectedVehicle.mileage.toLocaleString()} KM`} icon={<Gauge className="w-5 h-5 text-amber-500" />} />
                        <DisplayStat label="Salud Mecánica" value="94%" icon={<Heart className="w-5 h-5 text-rose-500" />} />
                     </div>
                     <section className="space-y-8">
                        <h4 className={labelStyles}>Vigencias Legales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                              <p className={labelStyles}>Seguro</p>
                              <p className="text-lg font-black text-slate-900">{selectedVehicle.insuranceExpiry}</p>
                           </div>
                           <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                              <p className={labelStyles}>Verificación</p>
                              <p className="text-lg font-black text-slate-900">{selectedVehicle.verificationExpiry}</p>
                           </div>
                        </div>
                     </section>
                  </div>
               )}

               {activeTabDetail === 'history' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     {selectedVehicle.maintenanceHistory.length > 0 ? (
                        selectedVehicle.maintenanceHistory.map((record) => (
                          <div key={record.id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.date} • {record.type}</p>
                              <p className="font-bold text-slate-900 mt-1">{record.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900">${record.cost.toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{record.mileage.toLocaleString()} KM</p>
                            </div>
                          </div>
                        ))
                     ) : (
                        <p className="text-center text-slate-400 font-bold py-20 text-xs uppercase tracking-widest">Sin registros de mantenimiento recientes</p>
                     )}
                  </div>
               )}
            </div>
            
            <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4 absolute bottom-0 left-0 right-0">
               <button 
                onClick={openMaintenanceForm}
                className="flex-1 py-5 bg-slate-900 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
               >
                  <Wrench className="w-4 h-4 text-amber-500" /> Programar Taller
               </button>
               <button className="p-5 bg-white border border-slate-200 rounded-[1.8rem] text-slate-400">
                  <MoreVertical className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DRAWER: FORMULARIO DE MANTENIMIENTO --- */}
      {isSchedulingMaintenance && selectedVehicle && (
        <div className="fixed inset-0 z-[110] flex items-end lg:items-stretch lg:justify-end">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in" onClick={() => !isSavingMaintenance && setIsSchedulingMaintenance(false)}></div>
           <div className="relative w-full lg:max-w-xl bg-white rounded-t-[3.5rem] lg:rounded-t-none lg:rounded-l-[4rem] h-[85vh] lg:h-full overflow-hidden flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 shadow-2xl">
              <div className="p-8 lg:p-12 bg-amber-500 text-slate-900 shrink-0">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Nueva Orden</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest mt-3 opacity-70">Unidad: {selectedVehicle.plate}</p>
                    </div>
                    <button onClick={() => setIsSchedulingMaintenance(false)} className="w-12 h-12 bg-slate-950/10 rounded-2xl flex items-center justify-center"><X className="w-6 h-6" /></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 pb-40">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className={labelStyles}>Tipo de Servicio</label>
                       <select 
                        className={inputStyles} 
                        value={maintenanceForm.type} 
                        onChange={e => setMaintenanceForm({...maintenanceForm, type: e.target.value as any})}
                       >
                          <option value="Preventivo">Preventivo</option>
                          <option value="Correctivo">Correctivo</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className={labelStyles}>Fecha Programada</label>
                       <input type="date" className={inputStyles} value={maintenanceForm.date} onChange={e => setMaintenanceForm({...maintenanceForm, date: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className={labelStyles}>Kilometraje Actual</label>
                       <input type="number" className={inputStyles} value={maintenanceForm.mileage} onChange={e => setMaintenanceForm({...maintenanceForm, mileage: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                       <label className={labelStyles}>Costo Estimado ($)</label>
                       <input type="number" className={inputStyles} value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: Number(e.target.value)})} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className={labelStyles}>Descripción del Trabajo</label>
                    <textarea 
                      className={`${inputStyles} h-32 resize-none`} 
                      placeholder="Detalles del mantenimiento..."
                      value={maintenanceForm.description}
                      onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                    />
                 </div>
              </div>

              <div className="p-10 border-t border-slate-100 bg-slate-50 absolute bottom-0 left-0 right-0">
                 <button 
                  onClick={handleSaveMaintenance}
                  disabled={isSavingMaintenance}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isSavingMaintenance ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 text-amber-500" /> Confirmar Orden de Taller</>}
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const DisplayStat = ({ label, value, icon }: any) => (
  <div className="p-7 bg-slate-50 border border-slate-200 rounded-[2.2rem]">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
    <div className="flex items-center gap-3">
      {icon}
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: VehicleStatus }) => {
  const styles: any = {
    [VehicleStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [VehicleStatus.WORKSHOP]: 'bg-rose-100 text-rose-700 border-rose-200',
    [VehicleStatus.AVAILABLE]: 'bg-blue-100 text-blue-700 border-blue-200',
    [VehicleStatus.DEBT_HOLD]: 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse',
  };
  return <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[status]}`}>{status}</span>;
};

export default FleetView;
