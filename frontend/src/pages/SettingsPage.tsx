import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useStore';
import {
  Globe,
  LogOut,
  MapPin,
  Moon,
  Sun,
  Trash2,
  User as UserIcon
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    locationPermission,
    setLocationPermission,
    setUserCoords,
    user,
    token,
    logout
  } = useAppStore();

  const [unit, setUnit] = useState('metric');

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' }
  ];

  const handleClearLocation = () => {
    setUserCoords(null);
    setLocationPermission(false);
    alert('Location data and cached coordinates cleared.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-800 to-slate-900 dark:from-white dark:via-sky-200 dark:to-slate-100 bg-clip-text text-transparent">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language & Regional Settings */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <Globe className="w-5 h-5 text-sky-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.langTitle')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              {t('settings.interfaceLang')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              {t('settings.measurementUnits')}
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium cursor-pointer"
            >
              <option value="metric" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('settings.unitMetric')}</option>
              <option value="imperial" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('settings.unitImperial')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Theme Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.themeTitle')}</h2>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 p-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
              theme === 'dark'
                ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold ring-2 ring-sky-500/30'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>{t('settings.darkTheme')}</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`flex-1 p-4 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
              theme === 'light'
                ? 'bg-sky-500/20 border-sky-500 text-sky-700 dark:text-sky-300 font-bold ring-2 ring-sky-500/30'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>{t('settings.lightTheme')}</span>
          </button>
        </div>
      </div>

      {/* Location Privacy Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <MapPin className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.privacyTitle')}</h2>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.geoPerm')}</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('settings.geoPermSub')}</p>
          </div>
          <button
            onClick={() => setLocationPermission(!locationPermission)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              locationPermission
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {locationPermission ? t('settings.btnOn') : t('settings.btnOff')}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{t('settings.clearCoords')}</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('settings.clearCoordsSub')}</p>
          </div>
          <button
            onClick={handleClearLocation}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/25 transition-all flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('settings.clearBtn')}</span>
          </button>
        </div>
      </div>

      {/* Account & Sign Out */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <UserIcon className="w-5 h-5 text-sky-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Account & Authentication</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{user?.name || 'Active Session'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                Authenticated
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {user?.email || 'Logged in to SmartTraffic AI Platform'}
            </p>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout') || 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
