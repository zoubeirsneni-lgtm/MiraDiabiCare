import React, { useState, useRef } from 'react';
import { analyzeTunisianMeal } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Info,
  ChevronRight,
  Activity,
  Lightbulb,
  Camera,
  Upload,
  X,
  ImageIcon,
  FileText
} from 'lucide-react';

interface MealAnalyzerProps {
  onNavigate: (tab: any) => void;
}

export default function MealAnalyzer({ onNavigate }: MealAnalyzerProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !selectedImage) return;

    setLoading(true);
    try {
      const base64Image = selectedImage ? selectedImage.split(',')[1] : undefined;
      const data = await analyzeTunisianMeal(description, base64Image);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Couscous aux légumes et poulet",
    "Lablabi avec oeuf et thon (sans harissa)",
    "Tajine malseka et salade mechouia",
    "Ojja aux merguez avec du pain"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
          <Utensils className="w-3 h-3" />
          Nutrition Tunisienne
        </div>
        <h2 className="text-4xl font-serif font-bold text-gray-900">Analyseur de Repas</h2>
        <p className="text-gray-500 font-serif italic max-w-lg">Découvre l'impact glycémique de tes plats préférés via photo ou description.</p>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 space-y-8">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Photo du repas
              </label>
              
              <AnimatePresence mode="wait">
                {selectedImage ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative aspect-video rounded-3xl overflow-hidden border border-gray-100 group"
                  >
                    <img src={selectedImage} alt="Repas" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="aspect-video rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 underline">Prendre une photo</p>
                      <p className="text-xs text-gray-400 mt-1">Ou cliquer pour uploader</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Description (Optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-6 py-4 rounded-3xl bg-gray-50 border border-gray-100 text-lg font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-[120px] resize-none"
                placeholder="Ex: Couscous complet au poisson..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 flex-1">
              {examples.slice(0, 2).map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDescription(ex)}
                  className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || (!description.trim() && !selectedImage)}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl shadow-xl hover:bg-emerald-600 disabled:opacity-20 active:scale-95 transition-all font-bold"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  <Activity className="w-5 h-5" />
                </motion.div>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span>Analyser avec AI</span>
            </button>
          </div>
        </form>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-8 border-t border-gray-50 space-y-8"
          >
            <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Plat identifié</h4>
              <p className="text-2xl font-serif font-bold text-gray-900">{result.dishName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Charge Glycémique</h4>
                  <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-lg ${
                    result.glycemicLoad === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    result.glycemicLoad === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    <Scale className="w-6 h-6" />
                    {result.glycemicLoad === 'High' ? 'Élevée' : result.glycemicLoad === 'Medium' ? 'Moyenne' : 'Basse'}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Analyse Nutritionnelle
                  </h4>
                  <p className="text-gray-700 leading-relaxed font-medium italic">
                    "{result.analysis}"
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Glucides estimés:</span>
                    <span className="text-emerald-700 font-bold">{result.estimatedCarbs}g</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-tunisian-amber" />
                  Conseils Saludables
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {result.tips.map((tip: string, i: number) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-emerald-200">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Sparkles className="w-6 h-6" />
                <p className="font-medium text-sm">Mira peut ajouter ce repas à tes logs automatiquement.</p>
              </div>
              <button 
                onClick={() => onNavigate('logs')}
                className="px-6 py-2 bg-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all uppercase tracking-widest"
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
