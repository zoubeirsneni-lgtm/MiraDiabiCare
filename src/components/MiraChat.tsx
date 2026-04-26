import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, HealthLog } from '../types';
import { askMira } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  Activity, 
  Brain,
  MessageCircle,
  Clock,
  ChevronDown,
  Calculator as CalcIcon
} from 'lucide-react';
import Markdown from 'react-markdown';
import InsulinCalculator from './InsulinCalculator';

interface MiraChatProps {
  profile: UserProfile;
  logs: HealthLog[];
}

interface Message {
  id: string;
  role: 'user' | 'mira';
  content: string;
  timestamp: Date;
}

export default function MiraChat({ profile, logs }: MiraChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'mira',
      content: `Asslema ${profile.name} ! Je suis Mira, ton assistante intelligente. Comment puis-je t'aider aujourd'hui ? Tu peux me poser des questions sur tes récentes glycémies ou sur tes repas tunisiens.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await askMira(input, profile, logs);
      const miraMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mira',
        content: responseText || "Désolée, j'ai rencontré un petit problème technique. Peux-tu reformuler ?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, miraMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "Pourquoi ma glycémie est haute ce matin ?",
    "Analyse mon déjeuner d'hier.",
    "Comment adapter mon dîner après le sport ?",
    "Conseille-moi un menu tunisien équilibré."
  ];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-16rem)] flex gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-medical-blue/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-medical-blue rounded-2xl flex items-center justify-center shadow-lg shadow-medical-blue/20">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Discuter avec Mira</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En ligne & Prête
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTools(!showTools)}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${showTools ? 'bg-medical-blue text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              <CalcIcon className="w-4 h-4" />
              <span className="hidden md:inline">{showTools ? 'Masquer Outils' : 'Calculateur'}</span>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1 ${m.role === 'user' ? 'bg-white border-gray-100' : 'bg-medical-blue border-transparent'}`}>
                    {m.role === 'user' ? <UserIcon className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`
                    p-4 rounded-3xl space-y-2
                    ${m.role === 'user' 
                      ? 'bg-gray-900 text-white rounded-tr-none' 
                      : 'bg-gray-50 text-gray-800 rounded-tl-none'}
                  `}>
                    <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-medical-blue">
                      <Markdown>{m.content}</Markdown>
                    </div>
                    <div className={`text-[10px] opacity-40 flex items-center gap-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-medical-blue flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl rounded-tl-none flex gap-1">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pose ta question à Mira..."
              className="w-full pl-6 pr-16 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-medical-blue outline-none transition-all group-hover:border-gray-200 font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black disabled:opacity-20 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tools Sidebar / Modal */}
      <AnimatePresence>
        {showTools && (
          <>
            {/* Mobile Overlay Background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTools(false)}
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Sidebar Content */}
            <motion.div 
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: window.innerWidth > 1024 ? '380px' : '90%' }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              className="fixed lg:relative right-4 lg:right-0 top-20 lg:top-0 bottom-4 lg:bottom-0 z-50 lg:z-0 overflow-hidden"
            >
              <div className="h-full shadow-2xl lg:shadow-none">
                <InsulinCalculator profile={profile} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
