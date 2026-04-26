import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ChevronRight, 
  Zap, 
  Utensils, 
  Target,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';

interface InsulinCalculatorProps {
  profile: UserProfile;
}

export default function InsulinCalculator({ profile }: InsulinCalculatorProps) {
  const [currentGlucose, setCurrentGlucose] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [result, setResult] = useState<{
    correction: number;
    meal: number;
    total: number;
  } | null>(null);

  const calculate = () => {
    if (!profile.insulinToCarbRatio || !profile.insulinSensitivityFactor) return;

    const glucose = Number(currentGlucose) || 0;
    const carbCount = Number(carbs) || 0;
    const targetMid = (profile.targetMin + profile.targetMax) / 2;

    // Correction: (Current - Target) / ISF
    const correction = glucose > profile.targetMax 
      ? (glucose - targetMid) / profile.insulinSensitivityFactor 
      : 0;

    // Meal: Carbs / ITR
    const meal = carbCount / profile.insulinToCarbRatio;

    setResult({
      correction: Math.max(0, Number(correction.toFixed(1))),
      meal: Math.max(0, Number(meal.toFixed(1))),
      total: Math.max(0, Number((correction + meal).toFixed(1)))
    });
  };

  const reset = () => {
    setCurrentGlucose('');
    setCarbs('');
    setResult(null);
  };

  const isMissingData = !profile.insulinToCarbRatio || !profile.insulinSensitivityFactor;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-5 bg-gradient-to-r from-medical-blue/10 to-transparent border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-medical-blue">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Calculateur de Bolus</h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Aide à la décision</p>
          </div>
        </div>
        {result && (
          <button 
            onClick={reset}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {isMissingData ? (
          <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Tes ratios d'insuline (I/G ou ISF) ne sont pas configurés dans ton profil. Mira ne peut pas calculer ta dose.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Target className="w-3 h-3" /> Glycémie (mg/dL)
                </label>
                <input 
                  type="number"
                  value={currentGlucose}
                  onChange={e => setCurrentGlucose(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 145"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-medical-blue focus:bg-white rounded-xl outline-none transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Utensils className="w-3 h-3" /> Glucides (g)
                </label>
                <input 
                  type="number"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 60"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-medical-blue focus:bg-white rounded-xl outline-none transition-all font-bold"
                />
              </div>
            </div>

            {!result ? (
              <button 
                onClick={calculate}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all group"
              >
                Calculer la dose
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-medical-blue p-6 rounded-3xl text-white relative overflow-hidden">
                  <Zap className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10" />
                  <div className="relative z-10">
                    <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Dose Recommandée</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black">{result.total}</span>
                      <span className="text-xl font-bold opacity-80">Unités</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Correction</p>
                    <p className="text-lg font-bold text-gray-900">{result.correction} U</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Repas</p>
                    <p className="text-lg font-bold text-gray-900">{result.meal} U</p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 text-center italic mt-2 italic px-4">
                  * Ce calcul est indicatif. Tiens compte de ton activité physique récente et de ton insuline onboard.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
