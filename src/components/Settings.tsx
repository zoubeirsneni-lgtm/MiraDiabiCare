import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { UserProfile, DiabetesType, OperationType } from '../types';
import { translations } from '../lib/translations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Target, 
  Scale, 
  Calendar, 
  Droplet,
  Save,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface SettingsProps {
  user: User;
  profile: UserProfile;
  lang: 'fr' | 'ar';
}

export default function Settings({ user, profile, lang }: SettingsProps) {
  const t = (key: string) => translations[lang][key] || key;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name || '',
    age: profile.age || 0,
    weight: profile.weight || 0,
    diabetesType: profile.diabetesType || 'type2' as DiabetesType,
    targetMin: profile.targetMin || 70,
    targetMax: profile.targetMax || 180,
    dailyCarbGoal: profile.dailyCarbGoal || 200,
    dailyStepGoal: profile.dailyStepGoal || 10000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-medical-blue outline-none transition-all font-medium";
  const labelClasses = "block text-sm font-semibold text-gray-400 mb-2 px-1 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">{t('profile')}</h2>
          <p className="text-gray-500 mt-2">Personnalisez votre expérience et ajustez vos objectifs.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-medical-blue bg-opacity-10 rounded-2xl text-medical-blue">
              <UserIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Informations Personnelles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Nom Complet</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className={labelClasses}>{t('type')}</label>
              <select
                value={formData.diabetesType}
                onChange={(e) => setFormData({...formData, diabetesType: e.target.value as DiabetesType})}
                className={inputClasses}
              >
                <option value="type1">Type 1</option>
                <option value="type2">Type 2</option>
                <option value="gestational">Gestationnel</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>{t('age')}</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: Number(e.target.value)})}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('weight')}</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                className={inputClasses}
              />
            </div>
          </div>
        </motion.div>

        {/* Glucose Targets */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-tunisian-red bg-opacity-10 rounded-2xl text-tunisian-red">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('targets')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>{t('min_target')}</label>
              <input
                type="number"
                value={formData.targetMin}
                onChange={(e) => setFormData({...formData, targetMin: Number(e.target.value)})}
                className={inputClasses}
              />
              <p className="text-xs text-gray-400 mt-2 px-1">Seuil d'alerte hypoglycémie.</p>
            </div>
            <div>
              <label className={labelClasses}>{t('max_target')}</label>
              <input
                type="number"
                value={formData.targetMax}
                onChange={(e) => setFormData({...formData, targetMax: Number(e.target.value)})}
                className={inputClasses}
              />
              <p className="text-xs text-gray-400 mt-2 px-1">Seuil d'alerte hyperglycémie.</p>
            </div>
          </div>
        </motion.div>

        {/* Daily Goals */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-50"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-2xl text-emerald-500">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Objectifs de Santé</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>{t('carb_goal')}</label>
              <input
                type="number"
                value={formData.dailyCarbGoal}
                onChange={(e) => setFormData({...formData, dailyCarbGoal: Number(e.target.value)})}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('step_goal')}</label>
              <input
                type="number"
                value={formData.dailyStepGoal}
                onChange={(e) => setFormData({...formData, dailyStepGoal: Number(e.target.value)})}
                className={inputClasses}
              />
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3 font-medium"
              >
                <CheckCircle2 className="w-5 h-5" />
                {t('profile_updated')}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gray-900 text-white rounded-3xl font-bold text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-6 h-6" />
                {t('save_profile')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
