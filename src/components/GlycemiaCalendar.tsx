import React, { useMemo } from 'react';
import { HealthLog, UserProfile } from '../types';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

interface GlycemiaCalendarProps {
  logs: HealthLog[];
  profile: UserProfile;
}

export default function GlycemiaCalendar({ logs, profile }: GlycemiaCalendarProps) {
  const days = useMemo(() => {
    const today = new Date();
    const result = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayLogs = logs.filter(l => {
        if (l.type !== 'glucose') return false;
        const logDate = new Date(l.timestamp?.seconds * 1000);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === date.getTime();
      });

      let status = 'none'; // none, optimal, high, low
      let avg = 0;

      if (dayLogs.length > 0) {
        avg = dayLogs.reduce((acc, l) => acc + l.value, 0) / dayLogs.length;
        if (avg < profile.targetMin) status = 'low';
        else if (avg > profile.targetMax) status = 'high';
        else status = 'optimal';
      }

      result.push({
        date,
        dayNum: date.getDate(),
        status,
        avg: Math.round(avg)
      });
    }
    return result;
  }, [logs, profile]);

  const getColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-emerald-500 shadow-emerald-200';
      case 'high': return 'bg-rose-500 shadow-rose-200';
      case 'low': return 'bg-amber-500 shadow-amber-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-medical-blue/10 rounded-xl flex items-center justify-center text-medical-blue">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-gray-900">Stabilité Mensuelle</h3>
            <p className="text-gray-500 text-xs">Vue d'ensemble des 30 derniers jours</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> stable
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-lg text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> instable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3">
        {days.map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.01 }}
            className="group relative"
          >
            <div className={`
              aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all
              ${getColor(day.status)}
              ${day.status === 'none' ? 'text-gray-300' : 'text-white shadow-md hover:scale-110 cursor-pointer'}
            `}>
              {day.dayNum}
            </div>
            
            {day.status !== 'none' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                Moyenne: {day.avg} mg/dL
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 text-xs text-gray-500 leading-relaxed italic">
        <Info className="w-4 h-4 shrink-0 text-medical-blue mt-0.5" />
        <p>Les couleurs indiquent la glycémie moyenne de la journée par rapport à tes cibles personnelles ({profile.targetMin}-{profile.targetMax} mg/dL).</p>
      </div>
    </div>
  );
}
