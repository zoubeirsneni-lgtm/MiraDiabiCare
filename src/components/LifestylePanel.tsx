import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Heart, 
  RefreshCw, 
  ChevronRight, 
  Clock, 
  Info,
  Activity,
  Moon,
  Wind,
  Sparkles
} from 'lucide-react';
import { UserProfile, HealthLog } from '../types';
import { getLifestylePlan } from '../services/geminiService';
import { translations } from '../lib/translations';

interface LifestylePanelProps {
  profile: UserProfile;
  logs: HealthLog[];
  lang: 'fr' | 'ar';
}

export default function LifestylePanel({ profile, logs, lang }: LifestylePanelProps) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'nutrition' | 'lifestyle'>('nutrition');
  const [showAlternative, setShowAlternative] = useState<number | null>(null);

  const t = (key: string) => translations[lang][key] || key;

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await getLifestylePlan(profile, logs);
      setPlan(data);
    } catch (error) {
      console.error("Error fetching lifestyle plan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-4 bg-emerald-100 rounded-full"
        >
          <Sparkles className="w-12 h-12 text-emerald-600" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-bold text-gray-900">{t('loading_plan')}</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Je prépare des conseils adaptés à tes glycémies et à notre culture tunisienne...</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Heart className="w-24 h-24 text-red-500" />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">Message de Mira</h2>
            <p className="text-gray-600 italic leading-relaxed">"{plan.intro}"</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            activeTab === 'nutrition' ? 'bg-medical-blue text-white shadow-md' : 'text-gray-500'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span className="font-medium">{t('nutrition')}</span>
        </button>
        <button
          onClick={() => setActiveTab('lifestyle')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
            activeTab === 'lifestyle' ? 'bg-medical-blue text-white shadow-md' : 'text-gray-500'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="font-medium">{t('advice')}</span>
        </button>
      </div>

      {activeTab === 'nutrition' ? (
        <div className="grid gap-6">
          {plan.nutrition.map((item: any, idx: number) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-400">{item.meal}</span>
                  </div>
                  <button 
                    onClick={() => setShowAlternative(showAlternative === idx ? null : idx)}
                    className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t('alternatives')}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {showAlternative === idx ? (
                    <motion.div
                      key="alt"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-3"
                    >
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 italic text-emerald-800">
                        {item.alternative}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="main"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4"
                    >
                      <h4 className="text-xl font-serif font-bold text-gray-900 group-hover:text-medical-blue transition-colors">
                        {item.suggestion}
                      </h4>
                      <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-2xl">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-medical-blue" />
                        <p>{item.why}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plan.lifestyle.map((item: any, idx: number) => {
            const getIcon = (cat: string) => {
              if (cat.toLowerCase().includes('activité') || cat.toLowerCase().includes('sport')) return Activity;
              if (cat.toLowerCase().includes('sommeil')) return Moon;
              if (cat.toLowerCase().includes('stress') || cat.toLowerCase().includes('bien-être')) return Wind;
              return Info;
            };
            const Icon = getIcon(item.category);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full"
              >
                <div className="p-3 bg-medical-blue/5 rounded-2xl w-fit mb-4">
                  <Icon className="w-6 h-6 text-medical-blue" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{item.category}</h4>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{item.tip}</p>
                <div className="pt-4 border-t border-gray-50 text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>{item.impact}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-center pt-8">
        <button
          onClick={fetchPlan}
          className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-xs">Actualiser mon plan</span>
        </button>
      </div>
    </div>
  );
}
