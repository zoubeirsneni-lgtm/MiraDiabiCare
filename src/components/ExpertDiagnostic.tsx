import React, { useState } from 'react';
import { UserProfile, HealthLog } from '../types';
import { getExpertDiagnostic } from '../services/geminiService';
import { motion } from 'motion/react';
import { 
  Stethoscope, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  Activity
} from 'lucide-react';

interface ExpertDiagnosticProps {
  profile: UserProfile;
  logs: HealthLog[];
  onNavigate: (tab: any) => void;
}

export default function ExpertDiagnostic({ profile, logs, onNavigate }: ExpertDiagnosticProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const result = await getExpertDiagnostic(profile, logs);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif font-bold text-gray-900">Diagnostic Expert</h2>
          <p className="text-gray-500 font-serif italic max-w-lg">Analyse approfondie de tes tendances hebdomadaires pour une vision prédictive.</p>
        </div>
        
        <button
          onClick={runDiagnostic}
          disabled={loading || logs.length < 5}
          className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all disabled:opacity-40 disabled:scale-100 active:scale-95 group font-bold"
        >
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
              <Activity className="w-5 h-5" />
            </motion.div>
          ) : (
            <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
          <span>{loading ? 'Analyse en cours...' : 'Générer Diagnostic'}</span>
        </button>
      </div>

      {!data && !loading && (
        <div className="p-12 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="max-w-xs">
            <p className="font-bold text-gray-900">Pas encore d'analyse</p>
            <p className="text-sm text-gray-400 mt-1">
              {logs.length < 5 
                ? "Il nous faut au moins 5 logs pour générer une analyse pertinente." 
                : "Clique sur le bouton ci-dessus pour lancer le moteur de diagnostic expert."}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="h-64 bg-gray-50 rounded-[40px] animate-pulse" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
            <div className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
          </div>
        </div>
      )}

      {data && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 pb-12"
        >
          {/* Health Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center gap-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="58" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={364} 
                    strokeDashoffset={364 - (364 * data.healthScore) / 100} 
                    className="text-medical-blue transition-all duration-1000" 
                  />
                </svg>
                <span className="absolute text-3xl font-bold">{data.healthScore}%</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Score de Santé</h4>
                <p className="text-xs text-gray-400 mt-1 italic">Basé sur la stabilité</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${data.stabilityTrend === 'Improving' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {data.stabilityTrend === 'Improving' ? <TrendingUp className="w-6 h-6" /> : <TrendingUp className="w-6 h-6 rotate-180" />}
                </div>
                <div>
                  <h4 className="text-xl font-bold">Tendance: <span className="capitalize">{data.stabilityTrend === 'Improving' ? 'Amélioration' : data.stabilityTrend === 'Stable' ? 'Stable' : 'Déclin'}</span></h4>
                  <p className="text-gray-500">Ton évolution directionnelle sur les 7 derniers jours.</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 italic text-gray-600 text-sm">
                <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
                {data.topActionableTip}
              </div>
            </div>
          </div>

          {/* Deep Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-xl font-serif font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Patterns Détectés
              </h4>
              <div className="space-y-4">
                {data.patternsDetected.map((p: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <p className="text-sm font-medium text-amber-900">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-xl font-serif font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-medical-blue" />
                Prévisions 7-jours
              </h4>
              <p className="text-gray-600 leading-relaxed italic">
                "{data.forecast}"
              </p>
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Risque estimé</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i <= 2 ? 'bg-amber-400' : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-medical-blue rounded-3xl text-white flex items-center justify-between shadow-xl shadow-medical-blue/20">
             <div className="flex items-center gap-4">
               <Brain className="w-6 h-6" />
               <p className="font-medium">Veux-tu que Mira écrive un plan d'action détaillé ?</p>
             </div>
             <button 
               onClick={() => onNavigate('mira')}
               className="px-6 py-2 bg-white text-medical-blue rounded-xl font-bold hover:scale-105 transition-all"
             >
               Oui, j'en ai besoin
             </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
