/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, query, collection, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { auth, signIn, logOut, db, handleFirestoreError } from './lib/firebase';
import { UserProfile, HealthLog, OperationType, DiabetesType } from './types';
import { 
  Activity, 
  Plus, 
  MessageSquare, 
  PieChart, 
  Settings, 
  LogOut, 
  Brain, 
  Utensils,
  AlertCircle,
  Menu,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Stethoscope,
  Pill,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import LogEntry from './components/LogEntry';
import MiraChat from './components/MiraChat';
import ExpertDiagnostic from './components/ExpertDiagnostic';
import MealAnalyzer from './components/MealAnalyzer';
import Onboarding from './components/Onboarding';
import AdminPanel from './components/AdminPanel';
import MedicationManager from './components/MedicationManager';

type Tab = 'dashboard' | 'logs' | 'mira' | 'diagnostic' | 'meal-analyzer' | 'admin' | 'medications';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubLogs: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      // Clear previous listeners if any
      if (unsubProfile) unsubProfile();
      if (unsubLogs) unsubLogs();
      
      setUser(u);
      
      if (u) {
        // Listen to profile
        const profileRef = doc(db, 'users', u.uid);
        unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          // Only handle error if we are still signed in as this user
          if (auth.currentUser?.uid === u.uid) {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          }
        });

        // Listen to logs
        const logsQuery = query(
          collection(db, 'logs'),
          where('userId', '==', u.uid),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        unsubLogs = onSnapshot(logsQuery, (querySnap) => {
          const l: HealthLog[] = [];
          querySnap.forEach(d => l.push({ id: d.id, ...d.data() } as HealthLog));
          setLogs(l);
        }, (error) => {
          if (auth.currentUser?.uid === u.uid) {
            handleFirestoreError(error, OperationType.LIST, 'logs');
          }
        });
      } else {
        setProfile(null);
        setLogs([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-warm-cream">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="w-12 h-12 text-medical-blue" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-warm-cream">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-medical-blue rounded-3xl flex items-center justify-center shadow-xl rotate-3">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-tight">MiraDiabiCare</h1>
            <p className="text-xl text-gray-600 font-serif italic">Ton écosystème intelligent pour une vie équilibrée.</p>
          </div>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all group font-medium"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>Se connecter avec Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding user={user} onComplete={() => {}} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard profile={profile} logs={logs} onNavigate={setActiveTab} />;
      case 'logs': return <LogEntry user={user} profile={profile} />;
      case 'mira': return <MiraChat profile={profile} logs={logs} />;
      case 'diagnostic': return <ExpertDiagnostic profile={profile} logs={logs} onNavigate={setActiveTab} />;
      case 'meal-analyzer': return <MealAnalyzer onNavigate={setActiveTab} />;
      case 'medications': return <MedicationManager />;
      case 'admin': return <AdminPanel profile={profile} />;
      default: return <Dashboard profile={profile} logs={logs} onNavigate={setActiveTab} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: PieChart },
    { id: 'logs', label: 'Ajouter une mesure', icon: Plus },
    { id: 'mira', label: 'Discuter avec Mira', icon: MessageSquare },
    { id: 'diagnostic', label: 'Diagnostic Expert', icon: Stethoscope },
    { id: 'medications', label: 'Médicaments', icon: Pill },
    { id: 'meal-analyzer', label: 'Analyseur de repas', icon: Utensils },
    ...(profile.isAdmin || user.email === 'zoubeirsneni@gmail.com' ? [{ id: 'admin', label: 'Administration', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-warm-cream">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-medical-blue rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">DiaCare</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all
                  ${activeTab === item.id 
                    ? 'bg-medical-blue text-white shadow-lg shadow-medical-blue/20' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-gray-50 rounded-xl text-gray-500 hover:text-medical-blue transition-all"
              title="Changer de thème"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={logOut}
              className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:max-w-6xl mx-auto p-4 lg:p-8">
        <header className="flex items-center justify-between mb-8 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white rounded-xl">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-xl font-serif font-bold text-gray-900">MiraDiabiCare</h2>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-24 lg:pb-0"
        >
          {renderContent()}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-gray-100 lg:hidden flex items-center justify-around px-4 z-40">
        {menuItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`p-2 transition-colors ${activeTab === item.id ? 'text-medical-blue' : 'text-gray-400'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
}
