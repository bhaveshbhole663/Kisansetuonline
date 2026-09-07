import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Database, 
  HelpCircle,
  CheckCircle2,
  Mic
} from 'lucide-react';

export default function FarmerAIAssistant() {
  const { currentFarmer, language, t } = useApp();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      text: {
        hi: 'नमस्ते! मैं किसानसेतु सहायक हूँ। आप मुझसे अपने टोकन, कतार (Queue) स्थिति, या पेमेंट के बारे में अपनी भाषा में पूछ सकते हैं।',
        mr: 'नमस्कार! मी किसानसेतू सहाय्यक आहे. तुम्ही मला तुमचे टोकन, रांगेतील स्थान किंवा पेमेंटबद्दल विचारू शकता.',
        en: 'Hello! I am your KisanSetu Assistant. Ask me about your Token status, Queue position, or PFMS payment.'
      }[language] || 'Hello! How can I assist you with your procurement booking today?',
      groundTruth: null
    }
  ]);

  const quickQuestions = [
    { label: 'मेरा पेमेंट कब आएगा?', text: 'मेरा पेमेंट कब आएगा?' },
    { label: 'माझे टोकन कोणत्या नंबरवर आहे?', text: 'माझे टोकन कोणत्या नंबरवर आहे?' },
    { label: 'कतार में मेरी स्थिति क्या है?', text: 'कतार में मेरी स्थिति क्या है?' },
    { label: 'How to cancel slot?', text: 'How do I cancel my booking?' }
  ];

  const handleAsk = async (textToAsk = null) => {
    const q = (textToAsk || query).trim();
    if (!q) return;

    // Add user question
    const userMsg = { role: 'user', text: q };
    setConversation(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.askAI(q, currentFarmer?.id || 1, language);
      const assistantMsg = {
        role: 'assistant',
        text: res.response,
        intent: res.intent,
        groundTruth: res.ground_truth_record
      };
      setConversation(prev => [...prev, assistantMsg]);
    } catch (err) {
      setConversation(prev => [
        ...prev, 
        { role: 'assistant', text: 'Error connecting to procurement database. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">{t('ai_assistant_title')}</h3>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Database className="w-3 h-3" />
                DB-Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">{t('ai_assistant_sub')}</p>
          </div>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Try:</span>
        {quickQuestions.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(chip.text)}
            className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="bg-slate-50 rounded-xl p-3 max-h-60 overflow-y-auto space-y-3 mb-3 border border-slate-200/60">
        {conversation.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
              }`}
            >
              {msg.text}

              {/* Ground Truth Metadata Tag */}
              {msg.groundTruth && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified via Database: Token {msg.groundTruth.token || msg.groundTruth.token_number}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600" />
            <span>Consulting procurement database records...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder={t('ai_placeholder')}
          className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs"
        >
          <span>{t('send')}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
