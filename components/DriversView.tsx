
import React, { useState, useEffect } from 'react';
import {
    Users, Search, Plus, Filter, MoreHorizontal,
    ShieldCheck, ShieldAlert, Phone, Mail,
    Calendar, CreditCard, ArrowUpRight,
    ChevronRight, Loader2, Upload, CheckCircle2,
    AlertCircle, FileText, Camera
} from 'lucide-react';
import { persistenceService } from '../services/persistenceService';
import { Driver } from '../shared/types';

const DriversView: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setIsLoading(true);
        const data = await persistenceService.getDrivers();
        setDrivers(data);
        setIsLoading(false);
    };

    const handleVerifyLicense = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedDriver) return;

        setIsVerifying(true);
        try {
            const result = await persistenceService.verifyLicense(selectedDriver.id, file);
            if (result.success) {
                // Refresh driver data
                const updatedDrivers = await persistenceService.getDrivers();
                setDrivers(updatedDrivers);
                const updatedSelected = updatedDrivers.find(d => d.id === selectedDriver.id);
                if (updatedSelected) setSelectedDriver(updatedSelected);
                alert(`Licencia verificada con éxito: ${result.data.license_number}`);
            } else {
                alert('Error al verificar la licencia con IA.');
            }
        } catch (error) {
            console.error('OCR Error:', error);
            alert('Fallo en la conexión con el servidor de IA.');
        } finally {
            setIsVerifying(false);
        }
    };

    const triggerFileInput = () => {
        document.getElementById('license-upload-input')?.click();
    };

    const filteredDrivers = drivers.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm)
    );

    if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Gestión de <span className="text-amber-500">Conductores</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Control de flota y verificación de identidad</p>
                </div>
                <button className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                    <Plus className="w-4 h-4 text-amber-500" /> Nuevo Conductor
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-4 px-8">
                        <Search className="w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            className="flex-1 bg-transparent py-4 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Licencia</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Balance</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDrivers.map(driver => (
                                    <tr
                                        key={driver.id}
                                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedDriver?.id === driver.id ? 'bg-amber-50/50' : ''}`}
                                        onClick={() => setSelectedDriver(driver)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center font-black text-slate-500 shadow-inner">
                                                    {driver.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">{driver.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${driver.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                }`}>
                                                {driver.isVerified ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                                {driver.isVerified ? 'Verificado' : 'Pendiente'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <p className={`text-sm font-black ${driver.balance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
                                                ${driver.balance.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    {selectedDriver ? (
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500 sticky top-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center font-black text-slate-900 text-3xl shadow-2xl">
                                    {selectedDriver.name.charAt(0)}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Puntuación</span>
                                    <div className="flex items-center gap-1 text-amber-500 font-black">
                                        <Star className="w-4 h-4 fill-amber-500" /> {selectedDriver.rating}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">{selectedDriver.name}</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Conductor desde {new Date().toLocaleDateString()}</p>

                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">{selectedDriver.phone}</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">conductor@aurum.mx</span>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group mb-6">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-amber-500 mb-4">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Documentación</span>
                                    </div>
                                    <h4 className="text-lg font-black mb-1">Licencia de Conducir</h4>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                                        {selectedDriver.isVerified ? `Vence: ${selectedDriver.licenseExpiry || 'N/A'}` : 'Requisito de Seguridad Aurum'}
                                    </p>

                                    {selectedDriver.isVerified ? (
                                        <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                            <CheckCircle2 className="w-4 h-4" /> Licencia Validada
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                id="license-upload-input"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleVerifyLicense}
                                            />
                                            <button
                                                onClick={triggerFileInput}
                                                disabled={isVerifying}
                                                className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                                Validar con Gemini AI
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" /> Ver Expediente Digital
                                </button>
                                <button className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-rose-100">
                                    <AlertCircle className="w-4 h-4" /> Bloquear Acceso
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed p-12 rounded-[3rem] text-center flex flex-col items-center justify-center min-h-[500px]">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                                <Users className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">Selecciona un Conductor</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">Haz clic en un registro de la lista para gestionar su perfil e identidad.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriversView;

const Star = ({ className, fill }: { className?: string, fill?: string }) => (
    <svg className={className} fill={fill || 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
    </svg>
)
