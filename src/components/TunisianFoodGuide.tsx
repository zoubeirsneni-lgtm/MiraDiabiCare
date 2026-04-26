import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Info, X } from 'lucide-react';

const FOOD_DATABASE = [
  { name: 'Couscous (Agneau/Légumes)', carbs: '25g', ig: 'Moyen', portion: '100g cuit', note: 'Attention à la sauce et aux pois chiches.' },
  { name: 'Lablabi', carbs: '35g', ig: 'Bas', portion: 'Bol moyen', note: 'Riche en fibres, mais attention au pain ajouté.' },
  { name: 'Mloukhia', carbs: '5g', ig: 'Bas', portion: 'Assiette', note: 'Très faible en glucides si mangée avec modération de pain.' },
  { name: 'Brik à l\'œuf', carbs: '15g', ig: 'Moyen', portion: '1 pièce', note: 'La friture augmente la charge glycémique.' },
  { name: 'Makrouna (Pâtes tunisiennes)', carbs: '30g', ig: 'Haut', portion: '100g cuit', note: 'Préférer les pâtes al dente.' },
  { name: 'Ojja (sans merguez)', carbs: '8g', ig: 'Bas', portion: 'Assiette', note: 'Excellent choix, riche en tomates et œufs.' },
  { name: 'Kaftaji', carbs: '20g', ig: 'Haut', portion: 'Assiette', note: 'Riche en huile, attention au pic glycémique tardif.' },
  { name: 'Fricassé', carbs: '25g', ig: 'Haut', portion: '1 pièce', note: 'Très calorique et riche en glucides rapides.' },
  { name: 'Chorba Frik', carbs: '12g', ig: 'Bas', portion: 'Bol', note: 'Le blé concassé est une excellente source de fibres.' },
  { name: 'Assida Zgougou', carbs: '45g', ig: 'Haut', portion: 'Petit bol', note: 'À consommer avec grande modération.' },
  { name: 'Bambalouni', carbs: '50g', ig: 'Très Haut', portion: '1 pièce', note: 'Pic glycémique garanti. À éviter.' },
];

export default function TunisianFoodGuide({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');

  const filtered = FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-tunisian-amber/10 to-transparent">
          <div>
            <h3 className="text-2xl font-serif font-bold text-gray-900">Guide Nutritionnel Tunisien</h3>
            <p className="text-gray-500 text-sm">Index glycémique et glucides approximatifs</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher un plat (ex: Couscous, Ojja...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border-transparent focus:ring-2 focus:ring-medical-blue outline-none shadow-sm transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.map((food, idx) => (
            <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-medical-blue transition-colors flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900">{food.name}</h4>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{food.portion}</p>
                <p className="text-xs text-gray-500 italic mt-1">{food.note}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs font-bold text-gray-400 uppercase">Glucides</span>
                  <span className="text-lg font-black text-medical-blue">{food.carbs}</span>
                </div>
                <div className={`
                  inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                  ${food.ig === 'Bas' ? 'bg-emerald-50 text-emerald-600' : food.ig === 'Moyen' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}
                `}>
                  IG {food.ig}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 italic">
              Aucun plat trouvé pour cette recherche.
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 text-xs text-gray-400 italic">
          <Info className="w-4 h-4 shrink-0" />
          <p>Valeurs données à titre indicatif. La préparation familiale peut varier considérablement le contenu en glucides.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
