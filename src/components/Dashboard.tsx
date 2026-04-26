import React, { useMemo } from 'react';
import { UserProfile, HealthLog } from '../types';
import { translations } from '../lib/translations';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea,
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Zap, 
  Activity, 
  Clock,
  ChevronRight,
  Target,
  Check,
  Brain,
  FileDown,
  Calendar
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import GlycemiaCalendar from './GlycemiaCalendar';

interface DashboardProps {
  profile: UserProfile;
  logs: HealthLog[];
  onNavigate: (tab: any) => void;
  lang: 'fr' | 'ar';
}

export default function Dashboard({ profile, logs, onNavigate, lang }: DashboardProps) {
  const t = (key: string) => translations[lang][key] || key;
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.text('MiraDiabiCare - Rapport Médical', 14, 20);
    
    // Profile Info
    doc.setFontSize(12);
    const translateDiabetes = (t: string) => t === 'type1' ? 'Type 1' : t === 'type2' ? 'Type 2' : 'Gestationnel';
    const translateLog = (t: string) => {
      const m: any = { glucose: 'Glycémie', food: 'Repas', activity: 'Sport', medication: 'Médicament', weight: 'Poids' };
      return m[t] || t;
    };

    doc.text(`Patient: ${profile.name}`, 14, 30);
    doc.text(`Type de Diabète: ${translateDiabetes(profile.diabetesType)}`, 14, 37);
    doc.text(`Cibles: ${profile.targetMin} - ${profile.targetMax} mg/dL`, 14, 44);
    doc.text(`Date du rapport: ${new Date().toLocaleDateString()}`, 14, 51);

    // Logs Table
    const tableData = logs.map(l => [
      new Date(l.timestamp?.seconds * 1000).toLocaleString(),
      translateLog(l.type),
      l.value,
      l.notes || ''
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Date/Heure', 'Type', 'Valeur', 'Notes']],
      body: tableData,
    });

    doc.save(`MiraDiabiCare_Rapport_${profile.name}.pdf`);
  };

  const generateCSV = () => {
    const translateLog = (t: string) => {
      const m: any = { glucose: 'Glycémie', food: 'Repas', activity: 'Sport', medication: 'Médicament', weight: 'Poids' };
      return m[t] || t;
    };

    const headers = ['Date', 'Heure', 'Type', 'Valeur', 'Notes'];
    const csvRows = logs.map(l => {
      const d = new Date(l.timestamp?.seconds * 1000);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        translateLog(l.type),
        l.value,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ].map(String).join(',');
    });

    const csvContent = "\ufeff" + [headers.join(','), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MiraDiabiCare_Logs_${profile.name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const chartData = useMemo(() => {
    // Group logs by timestamp (rounded to minute)
    const groupedData: { [key: string]: any } = {};
    
    [...logs].slice(0, 50).forEach(l => {
      const date = new Date(l.timestamp?.seconds * 1000);
      const key = date.toLocaleString();
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (!groupedData[key]) {
        groupedData[key] = { key, time, glucose: null, carbs: 0, insulin: 0 };
      }
      
      if (l.type === 'glucose') groupedData[key].glucose = l.value;
      if (l.type === 'food') groupedData[key].carbs = l.value;
      if (l.type === 'medication') groupedData[key].insulin = l.value;
    });

    return Object.values(groupedData).sort((a, b) => a.key.localeCompare(b.key));
  }, [logs]);

  const latestGlucose = logs.find(l => l.type === 'glucose');
  
  const stats = useMemo(() => {
    const glucoseLogs = logs.filter(l => l.type === 'glucose');
    if (glucoseLogs.length === 0) return null;
    
    const sum = glucoseLogs.reduce((acc, curr) => acc + curr.value, 0);
    const avg = Math.round(sum / glucoseLogs.length);
    const inRangeCount = glucoseLogs.filter(l => l.value >= profile.targetMin && l.value <= profile.targetMax).length;
    const timeInRange = Math.round((inRangeCount / glucoseLogs.length) * 100);

    return { avg, timeInRange };
  }, [logs, profile]);

  const getStatusColor = (val: number) => {
    if (val < profile.targetMin) return 'text-rose-500';
    if (val > profile.targetMax) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('latest_glucose')}</span>
            <div className={`p-2 rounded-xl bg-opacity-10 ${latestGlucose ? getStatusColor(latestGlucose.value).replace('text', 'bg') : 'bg-gray-100'}`}>
              <Activity className={`w-5 h-5 ${latestGlucose ? getStatusColor(latestGlucose.value) : 'text-gray-400'}`} />
            </div>
          </div>
          <div>
            <h3 className={`text-5xl font-bold tracking-tight ${latestGlucose ? getStatusColor(latestGlucose.value) : 'text-gray-300'}`}>
              {latestGlucose?.value || '--'}
              <span className="text-xl ml-2 font-medium text-gray-400">mg/dL</span>
            </h3>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {latestGlucose ? new Date(latestGlucose.timestamp?.seconds * 1000).toLocaleTimeString() : 'Aucune donnée'}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 bg-gradient-to-br from-emerald-50/50 to-transparent"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('time_in_range')}</span>
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-5xl font-bold text-gray-900 tracking-tight">
            {stats?.timeInRange || 0}
            <span className="text-2xl ml-1 font-medium text-gray-400">%</span>
          </h3>
          <div className="w-full bg-emerald-100 h-2 rounded-full mt-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats?.timeInRange || 0}%` }}
              className="bg-emerald-500 h-full" 
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('stability')}</span>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              (stats?.timeInRange || 0) > 80 ? 'bg-emerald-100 text-emerald-600' : 
              (stats?.timeInRange || 0) > 50 ? 'bg-amber-100 text-amber-600' : 
              'bg-rose-100 text-rose-600'
            }`}>
              {(stats?.timeInRange || 0) > 80 ? t('excellent') : (stats?.timeInRange || 0) > 50 ? t('acceptable') : t('critical')}
            </div>
          </div>
          <h3 className="text-5xl font-bold text-gray-900 tracking-tight">
            {stats?.avg || '--'}
            <span className="text-xl ml-2 font-medium text-gray-400">mg/dL</span>
          </h3>
          <p className="text-sm text-gray-400 mt-2">Moyenne glycémique</p>
        </motion.div>
      </div>

      {/* Main Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-serif font-bold text-gray-900">Évolution Glycémique</h3>
            <p className="text-gray-500 text-sm">Tes readings récents</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex gap-4">
              <button 
                onClick={generateCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
              >
                <FileDown className="w-4 h-4" />
                CSV
              </button>
              <button 
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-medical-blue text-white rounded-xl text-sm font-bold shadow-lg shadow-medical-blue/20 hover:scale-105 transition-all"
              >
                <FileDown className="w-4 h-4" />
                PDF
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-xs text-gray-500 font-medium tracking-wide">Hyper</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-500 font-medium tracking-wide">Cible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-xs text-gray-500 font-medium tracking-wide">Hypo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2B6CB0" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2B6CB0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                domain={[40, 400]}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#CBD5E0', fontSize: 10 }}
                domain={[0, 150]}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              <ReferenceArea yAxisId="left" y1={0} y2={profile.targetMin} fill="#FDE68A" fillOpacity={0.05} />
              <ReferenceArea yAxisId="left" y1={profile.targetMin} y2={profile.targetMax} fill="#A7F3D0" fillOpacity={0.05} />
              <ReferenceArea yAxisId="left" y1={profile.targetMax} y2={450} fill="#FECDD3" fillOpacity={0.05} />
              
              <Bar yAxisId="right" dataKey="carbs" name="Glucides (g)" fill="#ED8936" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
              <Bar yAxisId="right" dataKey="insulin" name="Insuline (U)" fill="#805AD5" radius={[4, 4, 0, 0]} barSize={10} opacity={0.6} />
              
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="glucose" 
                name="Glycémie"
                stroke="#2B6CB0" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorGlucose)" 
                dot={{ r: 4, fill: '#2B6CB0', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Stability Heatmap */}
      <GlycemiaCalendar logs={logs} profile={profile} />

      {/* AI Insights & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xl font-serif font-bold text-gray-900 px-2">Alertes Actives</h4>
          {latestGlucose && (latestGlucose.value < 70 || latestGlucose.value > 250) ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-6 rounded-3xl border flex gap-4 ${latestGlucose.value < 70 ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-rose-50 border-rose-100 text-rose-900'}`}
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h5 className="font-bold">Attention: {latestGlucose.value < 70 ? 'Hypoglycémie' : 'Hyperglycémie'} détectée !</h5>
                <p className="text-sm mt-1 opacity-90">
                  {latestGlucose.value < 70 
                    ? "Prends 15g de sucre rapide (jus d'orange ou 3 morceaux de sucre) et attends 15 min." 
                    : "Bois de l'eau, vérifie tes cétones si possible, et contacte ton médecin si cela persiste."}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="p-8 rounded-3xl border border-gray-100 bg-white flex flex-col items-center justify-center text-center space-y-2 opacity-60">
              <div className="p-3 bg-emerald-50 rounded-full">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="font-medium text-gray-500">Aucune alerte active. Tu es sur la bonne voie !</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-xl font-serif font-bold text-gray-900 px-2">Statut Mira</h4>
          <div className="p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Brain className="w-24 h-24 text-medical-blue" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-medical-blue font-semibold">
                <span className="w-2 h-2 rounded-full bg-medical-blue animate-pulse" />
                Analyse en cours...
              </div>
              <p className="text-gray-600 italic">
                "D'après tes données de ce matin, ta glycémie est stable. N'oublie pas de planifier ton activité physique pour l'après-midi, car hier cela a bien fonctionné pour stabiliser ton soir."
              </p>
              <button 
                onClick={() => onNavigate('mira')}
                className="flex items-center gap-2 text-sm font-bold text-medical-blue hover:gap-3 transition-all"
              >
                Demander plus de détails à Mira
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
