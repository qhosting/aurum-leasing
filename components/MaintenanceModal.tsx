
import React, { useState, useEffect } from 'react';
import {
    X, Wrench, Calendar, Gauge,
    DollarSign, Save, Loader2,
    ClipboardList, User, CheckCircle2
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';

interface MaintenanceModalProps {
    vehicleId: string;
    onClose: () => void;
    onSuccess: () => void;
    currentMileage: number;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ vehicleId, onClose, onSuccess, currentMileage }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [data, setData] = useState({
        type: 'Preventivo',
        description: '',
        cost: 0,
        mileage: currentMileage,
        performed_by: '',
        next_maintenance_km: currentMileage + 10000
    });

    const handleSave = async () => {
        if (!data.description || data.cost <= 0) {
            alert('Por favor complete la descripción y el costo.');
            return;
        }
        setIsSaving(true);
        const res = await persistenceService.logMaintenance(vehicleId, data);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Error guardando el registro de mantenimiento.');
        }
        setIsSaving(false);
    };

    const labelStyles = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block";
    const inputStyles = "w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-slate-50 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 border-b border-slate-200 bg-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase italic">Bitácora de <span className="text-amber-500">Servicio</span></h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vehículo: {vehicleId}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyles}>Tipo</label>
                            <select
                                className={inputStyles}
                                value={data.type}
                                onChange={e => setData({ ...data, type: e.target.value })}
                            >
                                <option value="Preventivo">Preventivo</option>
                                <option value="Correctivo">Correctivo</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyles}>Kilometraje Actual</label>
                            <div className="relative">
                                <Gauge className="absolute left-4 top-1/2 -track-y-1/2 w-4 h-4 text-slate-300 transform -translate-y-1/2" />
                                <input
                                    type="number"
                                    className={`${inputStyles} pl-12`}
                                    value={data.mileage}
                                    onChange={e => setData({ ...data, mileage: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelStyles}>Descripción de Trabajos</label>
                        <textarea
                            className={`${inputStyles} h-32 resize-none py-6`}
                            placeholder="Ej: Cambio de aceite, filtros y revisión de frenos..."
                            value={data.description}
                            onChange={e => setData({ ...data, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyles}>Costo Total</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -track-y-1/2 w-4 h-4 text-slate-300 transform -translate-y-1/2" />
                                <input
                                    type="number"
                                    className={`${inputStyles} pl-12`}
                                    value={data.cost}
                                    onChange={e => setData({ ...data, cost: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelStyles}>Siguiente Mantenimiento (KM)</label>
                            <input
                                type="number"
                                className={inputStyles}
                                value={data.next_maintenance_km}
                                onChange={e => setData({ ...data, next_maintenance_km: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelStyles}>Realizado por / Taller</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -track-y-1/2 w-4 h-4 text-slate-300 transform -translate-y-1/2" />
                            <input
                                className={`${inputStyles} pl-12`}
                                placeholder="Nombre del mecánico o taller"
                                value={data.performed_by}
                                onChange={e => setData({ ...data, performed_by: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-white border-t border-slate-200">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 text-amber-500" /> Registrar Servicio</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceModal;
