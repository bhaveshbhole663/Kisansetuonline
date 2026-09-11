import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';

const dictionaries = { en, hi, mr };

const AppContext = createContext();

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('hi'); // Default Hindi per PRD
  const [activeTab, setActiveTab] = useState('farmer'); // 'farmer', 'admin', 'sms', 'ivr', 'arch'
  
  // Farmer Authentication State
  const [isFarmerAuthenticated, setIsFarmerAuthenticated] = useState(() => {
    return localStorage.getItem('kisansetu_farmer_auth') === 'true';
  });

  const [currentFarmer, setCurrentFarmer] = useState(() => {
    const saved = localStorage.getItem('kisansetu_farmer_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 1,
      name: 'Ramesh Jadhav',
      mobile: '9876543210',
      village: 'Hadapsar',
      district: 'Pune',
      identity_reference: 'KID-4091-MH',
      preferred_language: 'mr'
    };
  });

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('kisansetu_admin_auth') === 'true';
  });

  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('kisansetu_admin_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const loginFarmer = (farmerData) => {
    setCurrentFarmer(farmerData);
    setIsFarmerAuthenticated(true);
    localStorage.setItem('kisansetu_farmer_auth', 'true');
    localStorage.setItem('kisansetu_farmer_user', JSON.stringify(farmerData));
    if (farmerData.preferred_language) {
      setLanguage(farmerData.preferred_language);
    }
  };

  const logoutFarmer = () => {
    setIsFarmerAuthenticated(false);
    localStorage.removeItem('kisansetu_farmer_auth');
  };

  const loginAdmin = (userData) => {
    setAdminUser(userData);
    setIsAdminAuthenticated(true);
    localStorage.setItem('kisansetu_admin_auth', 'true');
    localStorage.setItem('kisansetu_admin_user', JSON.stringify(userData));
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('kisansetu_admin_auth');
    localStorage.removeItem('kisansetu_admin_user');
  };
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
        isFarmerAuthenticated,
        isAdminAuthenticated,
        adminUser,
        loginFarmer,
        logoutFarmer,
        loginAdmin,
        logoutAdmin,
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
