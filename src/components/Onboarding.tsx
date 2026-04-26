import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { UserProfile, OperationType, DiabetesType } from '../types';
import { motion } from 'motion/react';
import { Activity, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: user.displayName || '',
    diabetesType: 'type1',
    targetMin: 70,
    targetMax: 180,
  });

  const saveProfile = async () => {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        isAdmin: false, // Default
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else saveProfile();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-warm-cream">
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'w-8 bg-medical-blue' : 'w-4 bg-gray-100'}`} />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-400">Étape {step}/3</span>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold">Bienvenue 👋</h2>
            <p className="text-gray-600">Commençons par faire connaissance. Comment devrions-nous vous appeler ?</p>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Nom complet</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-medical-blue outline-none transition-all"
                placeholder="Ex: Ahmed Ben Salem"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Type de diabète</label>
              <div className="grid grid-cols-1 gap-3">
                {(['type1', 'type2', 'gestational'] as DiabetesType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setProfile({ ...profile, diabetesType: t })}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${profile.diabetesType === t ? 'border-medical-blue bg-medical-blue/5' : 'border-gray-100'}`}
                  >
                    <span className="capitalize">{t === 'type1' ? 'Type 1' : t === 'type2' ? 'Type 2' : 'Gestationnel'}</span>
                    {profile.diabetesType === t && <Check className="w-5 h-5 text-medical-blue" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold">Tes Objectifs 🎯</h2>
            <p className="text-gray-600">Définissons tes cibles glycémiques personnalisées.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Minimum (mg/dL)</label>
                <input
                  type="number"
                  value={profile.targetMin}
                  onChange={e => setProfile({ ...profile, targetMin: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-medical-blue outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Maximum (mg/dL)</label>
                <input
                  type="number"
                  value={profile.targetMax}
                  onChange={e => setProfile({ ...profile, targetMax: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-medical-blue outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold">Détails Médicaux 🏥</h2>
            <p className="text-gray-600">Ces informations optionnelles aideront Mira à mieux t'assister (Calculs d'insuline).</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Ratio I/G (Ratio Insuline/Glucides)</label>
                <input
                  type="number"
                  value={profile.insulinToCarbRatio || ''}
                  onChange={e => setProfile({ ...profile, insulinToCarbRatio: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-medical-blue outline-none"
                  placeholder="Grammes par unité"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Facteur de Sensibilité (ISF)</label>
                <input
                  type="number"
                  value={profile.insulinSensitivityFactor || ''}
                  onChange={e => setProfile({ ...profile, insulinSensitivityFactor: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-medical-blue outline-none"
                  placeholder="Baisse en mg/dL par unité"
                />
              </div>
              <div className="p-4 bg-amber-50 rounded-xl flex gap-3 text-amber-800 text-sm italic">
                <Activity className="w-5 h-5 shrink-0" />
                <p>Consulte ton médecin pour obtenir ces valeurs précises.</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={nextStep}
          disabled={step === 1 && !profile.name}
          className="w-full flex items-center justify-center gap-2 py-4 bg-medical-blue text-white rounded-2xl shadow-lg shadow-medical-blue/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 font-bold"
        >
          <span>{step === 3 ? "Terminer l'installation" : "Continuer"}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
