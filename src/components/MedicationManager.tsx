import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Package, 
  RotateCcw,
  PlusCircle,
  MinusCircle,
  Bell
} from 'lucide-react';

interface Medication {
  id?: string;
  userId: string;
  name: string;
  dosage: string;
  stock: number;
  minStock: number;
  type: 'insulin-fast' | 'insulin-slow' | 'pill' | 'other';
}

interface MedicationManagerProps {
  lang: 'fr' | 'ar';
}

export default function MedicationManager({ lang }: MedicationManagerProps) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    stock: 0,
    minStock: 5,
    type: 'insulin-fast'
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'medications'), where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const m: Medication[] = [];
      snap.forEach(d => m.push({ id: d.id, ...d.data() } as Medication));
      setMeds(m);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'medications');
    });

    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!newMed.name || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'medications'), {
        ...newMed,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setShowAdd(false);
      setNewMed({ name: '', dosage: '', stock: 0, minStock: 5, type: 'insulin-fast' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'medications');
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'medications', id), { stock: Math.max(0, newStock) });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `medications/${id}`);
    }
  };

  const deleteMed = async (id: string) => {
    if (!confirm('Supprimer ce médicament ?')) return;
    try {
      await deleteDoc(doc(db, 'medications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `medications/${id}`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <RotateCcw className="w-8 h-8 text-medical-blue" />
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-bold text-gray-900">Pharmacie & Stocks</h2>
          <p className="text-gray-500 font-serif italic">Gère tes traitements et ne sois jamais à court.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-6 py-3 bg-medical-blue text-white rounded-2xl font-bold shadow-lg shadow-medical-blue/20 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {meds.map((med) => (
            <motion.div
              key={med.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${med.stock <= med.minStock ? 'bg-rose-50 text-rose-500' : 'bg-medical-blue/10 text-medical-blue'}`}>
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{med.name}</h4>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{med.dosage}</p>
                  </div>
                </div>
                <button onClick={() => deleteMed(med.id!)} className="text-gray-300 hover:text-rose-500 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-end justify-between pt-4 border-t border-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black ${med.stock <= med.minStock ? 'text-rose-500' : 'text-gray-900'}`}>{med.stock}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">unités</span>
                  </div>
                  {med.stock <= med.minStock && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase">
                      <AlertTriangle className="w-3 h-3" /> Stock Faible
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStock(med.id!, med.stock - 1)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-600">
                    <MinusCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => updateStock(med.id!, med.stock + 1)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-600">
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {meds.length === 0 && !showAdd && (
        <div className="p-12 bg-white rounded-[40px] border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <Package className="w-8 h-8" />
          </div>
          <p className="text-gray-500 italic font-serif">Ta pharmacie est vide. Ajoute tes médicaments pour suivre tes stocks.</p>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <h3 className="text-2xl font-serif font-bold text-gray-900">Nouveau Médicament</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Nom</label>
                    <input 
                      type="text" 
                      placeholder="Ex: NovoRapid, Humalog, Metformine..."
                      value={newMed.name}
                      onChange={e => setNewMed({...newMed, name: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-transparent focus:border-medical-blue focus:bg-white outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Dosage/Note</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 5U par repas, 1 comprimé soir"
                      value={newMed.dosage}
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-transparent focus:border-medical-blue focus:bg-white outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Stock Initial</label>
                      <input 
                        type="number" 
                        value={newMed.stock}
                        onChange={e => setNewMed({...newMed, stock: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-transparent focus:border-medical-blue focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Alerte à (unités)</label>
                      <input 
                        type="number" 
                        value={newMed.minStock}
                        onChange={e => setNewMed({...newMed, minStock: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-transparent focus:border-medical-blue focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600">Annuler</button>
                  <button onClick={handleAdd} className="flex-1 py-4 bg-medical-blue text-white rounded-2xl font-bold shadow-lg shadow-medical-blue/20">Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
