import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  PhoneCall, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles,
  Phone,
  Signal,
  CheckCircle2
} from 'lucide-react';

export default function IVRPhoneSimulator() {
  const { triggerRefresh } = useApp();
  const [callerPhone, setCallerPhone] = useState('9812345678'); // Mahesh Shinde
  const [callState, setCallState] = useState('DISCONNECTED'); // DISCONNECTED, CONNECTING, ACTIVE
  const [currentStep, setCurrentStep] = useState('INIT');
  const [ivrData, setIvrData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [selectedCentreId, setSelectedCentreId] = useState(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  // Web Audio Context for DTMF tone simulation
  const playDTMF = (frequency1 = 697, frequency2 = 1209) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = frequency1;
      osc2.frequency.value = frequency2;
      gain.gain.value = 0.08;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        ctx.close();
      }, 150);
    } catch (e) {
      // Audio not permitted without user interaction
    }
  };

  // Web Speech synthesis to read prompt aloud in regional language
  const speakPrompt = (text, lang = 'hi') => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === 'hi') utterance.lang = 'hi-IN';
      else if (lang === 'mr') utterance.lang = 'mr-IN';
      else utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error', e);
    }
  };

  useEffect(() => {
    if (callState === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const handleStartCall = async () => {
    setCallState('CONNECTING');
    try {
      const res = await api.sendIVR({
        caller_phone: callerPhone,
        step: 'INIT',
        language: 'hi'
      });
      setCallState('ACTIVE');
      setCurrentStep(res.next_step || 'LANG_SELECTED');
      setIvrData(res);
      speakPrompt(res.voice_prompt_hi || res.voice_prompt_en, 'hi');
    } catch (err) {
      setCallState('DISCONNECTED');
    }
  };

  const handleEndCall = () => {
    setCallState('DISCONNECTED');
    setCurrentStep('INIT');
    setIvrData(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleDigitPress = async (digit) => {
    playDTMF(770, 1336);
    if (callState !== 'ACTIVE') return;

    try {
      let nextPayload = {
        caller_phone: callerPhone,
        step: currentStep,
        input_digits: digit,
        language: selectedLanguage,
        centre_id: selectedCentreId
      };

      if (currentStep === 'LANG_SELECTED') {
        const langCode = digit === '1' ? 'hi' : digit === '2' ? 'en' : 'mr';
        setSelectedLanguage(langCode);
        nextPayload.language = langCode;
      }

      if (currentStep === 'CENTRE_SELECTED') {
        const cId = parseInt(digit) || 1;
        setSelectedCentreId(cId);
        nextPayload.centre_id = cId;
      }

      const res = await api.sendIVR(nextPayload);
      setIvrData(res);
      setCurrentStep(res.next_step || 'FINISHED');

      if (res.language) setSelectedLanguage(res.language);
      if (res.token_number) {
        triggerRefresh('IVR', `IVR Booking confirmed: Token ${res.token_number} from ${callerPhone}`);
      }

      if (res.voice_prompt) {
        speakPrompt(res.voice_prompt, selectedLanguage);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const keypadButtons = [
    { num: '1', sub: ' ' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: ' ' },
    { num: '0', sub: '+' },
    { num: '#', sub: ' ' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Interactive Voice Response (IVR) Helpline Simulator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Toll-free DTMF telephone helpline for farmers without internet access.
            Offers voice menus in Hindi, Marathi, and English, and generates verified tokens.
          </p>
        </div>

        <button
          onClick={() => setSpeechEnabled(!speechEnabled)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            speechEnabled 
              ? 'bg-purple-50 text-purple-800 border-purple-200' 
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {speechEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          <span>{speechEnabled ? 'Voice Synthesis: ON' : 'Voice Synthesis: Muted'}</span>
        </button>
      </div>

      {/* Main Simulator Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Voice Prompt Transcript & Menu Navigator */}
        <div className="md:col-span-6 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Live Voice Prompt Audio Transcript</span>
              </span>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                Lang: {selectedLanguage.toUpperCase()}
              </span>
            </div>

            {callState === 'ACTIVE' && ivrData ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200">
                  <p className="text-xs font-semibold text-purple-900 leading-relaxed">
                    "{ivrData.voice_prompt || ivrData.voice_prompt_hi || ivrData.voice_prompt_en}"
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Available Keypad Choices:
                  </span>
                  <p className="font-mono text-emerald-800 font-bold mt-1">
                    {ivrData.display_text || 'Enter 1, 2, 3 on the dialler keypad'}
                  </p>
                </div>

                {ivrData.token_number && (
                  <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <span className="text-xs font-bold text-emerald-900 block">
                      IVR Booking Confirmed!
                    </span>
                    <p className="text-xl font-black text-emerald-950 tracking-widest mt-0.5">
                      {ivrData.token_number}
                    </p>
                    <span className="text-[10px] text-emerald-700">Reflected in APMC Admin Queue</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                Press the green <strong className="text-emerald-700 font-semibold">Call 1800-KISAN</strong> button below to initiate simulated IVR call.
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">Recommended Demo Script:</span>
            <div className="space-y-1 font-mono text-[11px] text-slate-600">
              <p>1. Call 1800-KISAN</p>
              <p>2. Press <strong>1</strong> for Hindi (or <strong>3</strong> for Marathi)</p>
              <p>3. Press <strong>1</strong> to Book Slot</p>
              <p>4. Press <strong>1</strong> for Pune Mandi</p>
              <p>5. Press <strong>1</strong> for Morning Slot</p>
              <p className="text-purple-700 font-bold">→ Voice reads out Token & sends SMS!</p>
            </div>
          </div>
        </div>

        {/* Right Side: Telephone Dialler Keypad */}
        <div className="md:col-span-6 flex justify-center">
          <div className="w-full max-w-[320px] bg-slate-900 rounded-[38px] p-5 shadow-2xl border-4 border-slate-800 text-white">
            
            {/* Screen Area */}
            <div className="bg-slate-800 rounded-2xl p-3.5 mb-4 text-center border border-slate-700">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span>Toll-Free 1800-547-2673</span>
                <span className="font-mono text-emerald-400">{formatTimer(callDuration)}</span>
              </div>
              <p className="text-sm font-bold tracking-wider">
                {callState === 'ACTIVE' ? 'KisanSetu IVR Connected' : callState === 'CONNECTING' ? 'Calling...' : 'Call Disconnected'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Caller: {callerPhone}</p>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {keypadButtons.map((btn) => (
                <button
                  key={btn.num}
                  disabled={callState !== 'ACTIVE'}
                  onClick={() => handleDigitPress(btn.num)}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-purple-600 disabled:opacity-40 text-white font-bold flex flex-col items-center justify-center transition-all border border-slate-700/60 shadow-xs"
                >
                  <span className="text-base leading-none">{btn.num}</span>
                  {btn.sub.trim() && (
                    <span className="text-[8px] text-slate-400 leading-none mt-0.5 tracking-wider">{btn.sub}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Call / End Buttons */}
            <div className="flex gap-2.5">
              {callState === 'ACTIVE' ? (
                <button
                  onClick={handleEndCall}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              ) : (
                <button
                  onClick={handleStartCall}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call 1800-KISAN</span>
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
