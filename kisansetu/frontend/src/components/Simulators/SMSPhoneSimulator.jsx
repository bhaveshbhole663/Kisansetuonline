import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Send, 
  MessageSquare, 
  Smartphone, 
  RotateCcw, 
  Sparkles,
  CheckCircle2,
  Signal,
  Battery,
  Wifi
} from 'lucide-react';

export default function SMSPhoneSimulator() {
  const { triggerRefresh } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('9823456789'); // Suresh Patil (Keypad farmer)
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'system',
      text: 'KisanSetu SMS Gateway Active.\nSend BOOK to schedule a slot.\nSend STATUS <Token> to check progress.\nSend PAYMENT <Token> for DBT info.',
      time: '08:00 AM'
    },
    {
      id: 2,
      sender: 'user',
      text: 'STATUS PUN-0809-032',
      time: '08:02 AM'
    },
    {
      id: 3,
      sender: 'system',
      text: 'Token: PUN-0809-032\nStatus: Quality Check\nCrop: Soybean\nQuantity: 35.5 Q\nResult: GRADE B\nPayment: PENDING',
      time: '08:02 AM'
    }
  ]);

  const quickChips = [
    { label: 'BOOK', text: 'BOOK' },
    { label: 'Option 1 (Pune)', text: '1' },
    { label: 'Option 2 (Baramati)', text: '2' },
    { label: 'STATUS PUN-0809-031', text: 'STATUS PUN-0809-031' },
    { label: 'PAYMENT PUN-0809-031', text: 'PAYMENT PUN-0809-031' },
    { label: 'HELP', text: 'HELP' }
  ];

  const handleSend = async (customText = null) => {
    const text = (customText || inputMessage).trim();
    if (!text) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append farmer's outbound SMS
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: timeNow
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendSMS(phoneNumber, text);
      const replyMsg = {
        id: Date.now() + 1,
        sender: 'system',
        text: res.reply || 'No response received from SMS gateway.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, replyMsg]);
      triggerRefresh('SMS', `SMS from ${phoneNumber}: ${text}`);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'system',
          text: 'SMS Delivery Error: Unable to reach KisanSetu backend gateway.',
          time: timeNow
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'system',
        text: 'KisanSetu SMS Gateway Reset.\nReply BOOK to start a new slot booking session.\nReply HELP for commands.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Keypad Phone SMS Channel Simulator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Demonstrates deterministic state-machine booking for keypad-phone farmers (2G/Basic mobile).
            All SMS interactions update the exact same centralized database and APMC queue.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Thread</span>
        </button>
      </div>

      {/* Main Simulator Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Explanatory Guide & Quick Actions */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-3 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>How Deterministic SMS Works</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Keypad phone users do not need apps or data packs. By texting short keywords to <strong>56161</strong>, the farmer navigates a numeric choice menu:
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px] text-slate-700">
              <p className="text-blue-700 font-bold">1. Send: BOOK</p>
              <p>2. Reply: 1 (Pune APMC)</p>
              <p>3. Reply: 1 (Today's Date)</p>
              <p>4. Reply: 2 (09:00 - 10:00 AM)</p>
              <p className="text-emerald-700 font-bold">→ Token Generated & Confirmed!</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700 block mb-2">Simulated Phone Number:</span>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick Simulation Chips */}
          <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl">
            <span className="text-xs font-bold text-blue-900 block mb-2">
              Quick Demonstration Steps:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(c.text)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-medium text-blue-800 transition-colors shadow-2xs"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Realistic Phone Mockup */}
        <div className="md:col-span-7 flex justify-center">
          <div className="w-full max-w-[340px] bg-slate-900 rounded-[42px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700">
            
            {/* Phone Screen Outer */}
            <div className="bg-slate-100 rounded-[32px] overflow-hidden flex flex-col h-[520px] shadow-inner">
              
              {/* Phone Status Bar */}
              <div className="bg-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-700 font-medium">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* SMS Conversation Header */}
              <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  KS
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">KisanSetu SMS</h5>
                  <span className="text-[10px] text-slate-400">Govt APMC Mandi Helpline</span>
                </div>
              </div>

              {/* Message Thread Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-100">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-br-xs shadow-xs'
                          : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 italic px-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[10px] ml-1">KisanSetu Gateway replying...</span>
                  </div>
                )}
              </div>

              {/* SMS Input Bar */}
              <div className="bg-white p-2.5 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Text BOOK, STATUS..."
                  className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputMessage.trim()}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
