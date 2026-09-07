import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';

const dictionaries = { en, hi, mr };

const AppContext = createContext();

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('hi'); // Default Hindi per PRD
  const [activeTab, setActiveTab] = useState('farmer'); // 'farmer', 'admin', 'sms', 'ivr', 'arch'
  const [currentFarmer, setCurrentFarmer] = useState({
    id: 1,
    name: 'Ramesh Jadhav',
    mobile: '9876543210',
    village: 'Hadapsar',
    district: 'Pune',
    identity_reference: 'KID-4091-MH',
    preferred_language: 'mr'
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [systemEvents, setSystemEvents] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      channel: 'WEB',
      message: 'Token PUN-0809-031 booked for Ramesh Jadhav (Wheat - 42 Q)',
      badge: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString(),
      channel: 'SMS',
      message: 'Token PUN-0809-032 created via Keypad SMS (Soybean - 35.5 Q)',
      badge: 'bg-blue-100 text-blue-800'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString(),
      channel: 'IVR',
      message: 'Token PUN-0809-033 created via Voice DTMF Helpline (Gram - 28 Q)',
      badge: 'bg-purple-100 text-purple-800'
    }
  ]);

  const triggerRefresh = (channelName = null, eventDetail = null) => {
    setRefreshKey((k) => k + 1);
    if (channelName && eventDetail) {
      setSystemEvents((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          channel: channelName,
          message: eventDetail,
          badge:
            channelName === 'WEB'
              ? 'bg-emerald-100 text-emerald-800'
              : channelName === 'SMS'
              ? 'bg-blue-100 text-blue-800'
              : channelName === 'IVR'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-amber-100 text-amber-800'
        },
        ...prev.slice(0, 9)
      ]);
    }
  };

  const t = (key) => {
    const dict = dictionaries[language] || dictionaries.en;
    if (key.includes('.')) {
      const parts = key.split('.');
      let obj = dict;
      for (const p of parts) {
        if (!obj || obj[p] === undefined) return key;
        obj = obj[p];
      }
      return obj;
    }
    return dict[key] || dictionaries.en[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,
        currentFarmer,
        setCurrentFarmer,
        refreshKey,
        triggerRefresh,
        systemEvents
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
