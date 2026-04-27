import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, where, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { UserProfile, HealthLog, OperationType } from '../types';
import { motion } from 'motion/react';
import { 
  Users, 
  Flag, 
  Search, 
  ChevronRight, 
  Activity, 
  AlertCircle,
  FileText,
  Clock,
  Filter,
  ShieldAlert
} from 'lucide-react';

interface AdminPanelProps {
  profile: UserProfile;
}

interface UserWithId extends UserProfile {
  id: string;
}

export default function AdminPanel({ profile }: AdminPanelProps) {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [userLogs, setUserLogs] = useState<HealthLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentUserEmail = auth.currentUser?.email;
  const isAuthorized = profile.isAdmin || currentUserEmail === 'zoubeirsneni@gmail.com' || currentUserEmail === 'snenizoubeir@gmail.com';

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const u: UserWithId[] = [];
      snap.forEach(d => u.push({ id: d.id, ...d.data() } as UserWithId));
      setUsers(u);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setError("Erreur de chargement des utilisateurs. Vérifiez vos permissions.");
      setLoading(false);
    });
    return () => unsub();
  }, [isAuthorized]);

  const fetchUserLogs = async (userId: string) => {
    try {
      const q = query(collection(db, 'logs'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const l: HealthLog[] = [];
      snap.forEach(d => {
        l.push({ id: d.id, ...d.data() } as HealthLog);
      });
      setUserLogs(l.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'logs');
      setError("Impossible de charger les logs du patient.");
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getUrgency = (user: UserWithId) => {
    // In a real app, logic would be based on health data
    return 'normal';
  };

  const translateLogType = (type: string) => {
    const types: any = {
      glucose: 'Glycémie',
      food: 'Repas',
      activity: 'Sport',
      medication: 'Médicament',
      weight: 'Poids'
    };
    return types[type] || type;
  };

  const translateDiabetes = (type: string) => {
    const types: any = {
      type1: 'Type 1',
      type2: 'Type 2',
      gestational: 'Gestationnel'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Activity className="w-8 h-8 text-medical-blue" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-12 mt-12 bg-white rounded-[40px] border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">Accès Restreint</h2>
        <p className="text-gray-500 max-w-sm">Désolé, seul l'administrateur principal peut accéder à cette section confidentielle.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Panel d'Administration</h2>
          <p className="text-gray-500 font-serif italic text-lg">Gestion de la flotte de patients et surveillance en temps réel.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-medical-blue rounded-xl flex items-center justify-center text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patients Actifs</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{users.filter(u => getUrgency(u) === 'high').length}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alertes Critiques</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-medical-blue transition-all"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  fetchUserLogs(u.id);
                }}
                className={`
                  w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group
                  ${selectedUser?.id === u.id ? 'bg-medical-blue bg-opacity-5 border-medical-blue' : 'bg-white border-transparent hover:border-gray-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedUser?.id === u.id ? 'bg-medical-blue text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {u.name.substring(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{translateDiabetes(u.diabetesType)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getUrgency(u) === 'high' && <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />}
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedUser?.id === u.id ? 'translate-x-1 text-medical-blue' : 'text-gray-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Detail */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <motion.div 
              key={selectedUser.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-400 text-sm italic">Patient ID: {selectedUser.id}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><Filter className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><FileText className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Type', val: translateDiabetes(selectedUser.diabetesType) },
                    { label: 'Cible Min', val: selectedUser.targetMin },
                    { label: 'Cible Max', val: selectedUser.targetMax },
                    { label: 'Ratio I/G', val: selectedUser.insulinToCarbRatio || 'N/A' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                      <div className="text-lg font-bold text-gray-900 capitalize">{stat.val}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-medical-blue" />
                    Historique Récent
                  </h4>
                  <div className="space-y-3">
                    {userLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl bg-opacity-10 
                            ${log.type === 'glucose' ? 'bg-medical-blue text-medical-blue' : 
                              log.type === 'food' ? 'bg-emerald-500 text-emerald-500' : 'bg-gray-500 text-gray-500'}
                          `}>
                            {log.type === 'glucose' ? <Activity className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {log.value} {log.type === 'glucose' ? 'mg/dL' : ''}
                              <span className="text-[10px] font-bold text-medical-blue uppercase tracking-widest">{translateLogType(log.type)}</span>
                            </div>
                            <div className="text-xs text-gray-400">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="max-w-[200px] text-xs text-gray-500 italic truncate text-right">
                          {log.notes}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 space-y-4">
              <Users className="w-16 h-16" />
              <p className="font-bold">Sélectionne un patient pour voir ses données.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
