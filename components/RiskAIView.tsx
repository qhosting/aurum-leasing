
import React, { useState, useEffect } from 'react';
import { analyzeFleetRisk } from '../services/geminiService';
import { MOCK_VEHICLES, MOCK_DRIVERS } from '../constants';
import { BrainCircuit, Loader2, ShieldAlert, Zap, Target } from 'lucide-react';

const RiskAIView: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    const result = await analyzeFleetRisk(MOCK_VEHICLES, MOCK_DRIVERS);
    setAnalysis(result);
    setLoading(false);
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="w-8 h-8 text-amber-400" />
            <h3 className="text-2xl font-bold">Motor de Riesgo Inteligente</h3>
          </div>
          <p className="text-indigo-100 max-w-2xl opacity-80">
            Analizamos cientos de puntos de datos de telemetría, historial de pagos y depreciación de flota 
            para predecir riesgos antes de que ocurran.
          </p>
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            Actualizar Análisis de IA
          </button>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
           <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
           <p className="text-slate-500 font-medium">Gemini AI está analizando tu flota...</p>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Top Risks */}
           <div className="space-y-4">
             <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Riesgos Identificados
             </h4>
             <div className="space-y-4">
               {analysis.risks?.map((risk: any, i: number) => (
                 <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
                   <h5 className="font-bold text-slate-900 text-lg mb-2">{risk.title}</h5>
                   <p className="text-slate-600 text-sm leading-relaxed">{risk.description}</p>
                 </div>
               ))}
             </div>
           </div>

           {/* Recommendations */}
           <div className="space-y-4">
             <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Acciones Estratégicas
             </h4>
             <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
               <ul className="space-y-4">
                 {analysis.recommendations?.map((rec: string, i: number) => (
                   <li key={i} className="flex gap-3">
                     <div className="mt-1 w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-xs">
                       {i + 1}
                     </div>
                     <p className="text-emerald-900 text-sm font-medium">{rec}</p>
                   </li>
                 ))}
               </ul>
             </div>

             {/* ROI Simulator Card */}
             <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
               <h5 className="font-bold mb-2">Simulación de Mejora</h5>
               <p className="text-slate-400 text-xs mb-4">Si aplicas estas recomendaciones, estimamos una mejora en flujo de caja de:</p>
               <div className="text-4xl font-bold text-amber-400">+18.5% <span className="text-sm font-normal text-slate-500 ml-1">estimado</span></div>
             </div>
           </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400">Presione el botón para iniciar el análisis.</p>
        </div>
      )}
    </div>
  );
};

export default RiskAIView;
