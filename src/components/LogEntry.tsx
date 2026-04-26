import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { LogType, MealType, MealTiming, OperationType, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Utensils, 
  Syringe, 
  Dumbbell, 
  Scale, 
  Check, 
  Clock,
  ChevronRight,
  Info
} from 'lucide-react';

interface LogEntryProps {
  user: User;
  profile: UserProfile;
  lang: 'fr' | 'ar';
}

export default function LogEntry({ user, profile, lang }: LogEntryProps) {
  const [type, setType] = useState<LogType>('glucose');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [timing, setTiming] = useState<MealTiming>('none');
  const [medicationName, setMedicationName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, 'logs'), {
        userId: user.uid,
        type,
        value: Number(value),
        notes,
        mealType: type === 'food' || type === 'glucose' ? mealType : null,
        timing: type === 'glucose' ? timing : null,
        medicationName: type === 'medication' ? medicationName : null,
        timestamp: serverTimestamp(),
      });
      
      setSuccess(true);
      setValue('');
      setNotes('');
      setMedicationName('');
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Submit error:', err);
      // Try to parse the JSON error from our handler if possible
      try {
        const parsed = JSON.parse(err instanceof Error ? err.message : '');
        setError(parsed.error || 'Erreur lors de l\'enregistrement');
      } catch {
        setError('Une erreur est survenue lors de l\'enregistrement.');
      }
      handleFirestoreError(err, OperationType.CREATE, 'logs');
    } finally {
      setSaving(false);
    }
  };

  const logTypes: { id: LogType; label: string; icon: any; color: string }[] = [
    { id: 'glucose', label: 'Glycémie', icon: Activity, color: 'bg-medical-blue' },
    { id: 'medication', label: 'Médicament', icon: Syringe, color: 'bg-rose-500' },
    { id: 'food', label: 'Repas', icon: Utensils, color: 'bg-emerald-500' },
    { id: 'activity', label: 'Sport', icon: Dumbbell, color: 'bg-amber-500' },
    { id: 'weight', label: 'Poids', icon: Scale, color: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-serif font-bold text-gray-900">Enregistrer un Log</h2>
        <p className="text-gray-500 font-serif italic">Garde une trace précise pour une meilleure assistance de Mira.</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {logTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`
              flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border-2
              ${type === t.id ? `border-gray-900 shadow-lg scale-105` : 'border-transparent bg-white text-gray-400 opacity-60'}
            `}
          >
            <div className={`p-3 rounded-xl ${type === t.id ? t.color : 'bg-gray-100'} transition-colors`}>
              <t.icon className={`w-6 h-6 ${type === t.id ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${type === t.id ? 'text-gray-900' : 'text-gray-400'}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <motion.form 
        key={type}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {type === 'glucose' ? 'Niveau (mg/dL)' : 
               type === 'medication' ? 'Dose (Unités/Comprimés)' :
               type === 'food' ? 'Glucides est. (g)' :
               type === 'activity' ? 'Durée (minutes)' : 'Poids (kg)'}
            </label>
            <input
              type="number"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-2xl font-bold focus:ring-2 focus:ring-medical-blue outline-none"
              placeholder="0"
            />
          </div>

          {(type === 'glucose' || type === 'food') && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Moment du repas</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-medium focus:ring-2 focus:ring-medical-blue outline-none appearance-none"
              >
                <option value="breakfast">Petit-déjeuner</option>
                <option value="lunch">Déjeuner</option>
                <option value="dinner">Dîner</option>
                <option value="snack">Goûter / Snack</option>
                <option value="other">Autre</option>
              </select>
            </div>
          )}
        </div>

        {type === 'glucose' && (
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Timing</label>
            <div className="grid grid-cols-3 gap-3">
              {(['before', 'after', 'none'] as MealTiming[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTiming(t)}
                  className={`
                    py-3 rounded-xl border-2 font-bold text-sm transition-all
                    ${timing === t ? 'border-medical-blue bg-medical-blue/5 text-medical-blue' : 'border-gray-50 text-gray-400 bg-gray-50'}
                  `}
                >
                  {t === 'before' ? 'Avant' : t === 'after' ? 'Après' : 'N/A'}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'medication' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Nom du Médicament</label>
            <input
              type="text"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-medium outline-none"
              placeholder="Ex: Insuline Rapide, Metformine..."
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Notes additionnelles</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 font-medium outline-none h-32 resize-none"
            placeholder="Comment tu te sens ? Qu'est-ce que tu as mangé exactement ?"
          />
        </div>

        <div className="pt-4 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={saving}
            className={`
              w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl transition-all
              ${success ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:scale-[1.01] hover:bg-black'}
              ${saving ? 'opacity-70 cursor-not-allowed shadow-none' : ''}
            `}
          >
            {saving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <Activity className="w-6 h-6" />
              </motion.div>
            ) : success ? (
              <>
                <Check className="w-6 h-6" />
                <span>Enregistré avec succès</span>
              </>
            ) : (
              <>
                <span>Enregistrer la donnée</span>
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </motion.form>

      {profile.insulinToCarbRatio && type === 'food' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-medical-blue/5 p-6 rounded-3xl border border-medical-blue/10 flex gap-4"
        >
          <div className="p-3 bg-medical-blue rounded-2xl h-fit">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-medical-blue">Calculateur d'Insuline</h4>
            <p className="text-sm text-gray-600 mt-1 italic">
              Avec ton ratio de 1:{profile.insulinToCarbRatio}, pour {value || '0'}g de glucides, ta dose suggérée est de{' '}
              <span className="font-bold text-medical-blue">
                {Math.round((Number(value) / (profile.insulinToCarbRatio || 1)) * 10) / 10} unités
              </span>.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
