import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { Activity, BarChart3, GitCompare, Layers, TrendingUp } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();

  const [hourly, setHourly] = useState<any[]>([]);
  const [weekday, setWeekday] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [weather, setWeather] = useState<any[]>([]);
  const [actualVsPred, setActualVsPred] = useState<any[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [hrRes, wkRes, moRes, wtRes, avpRes, mdRes] = await Promise.all([
          axios.get('/api/analytics/hourly'),
          axios.get('/api/analytics/weekday'),
          axios.get('/api/analytics/monthly'),
          axios.get('/api/analytics/weather'),
          axios.get('/api/analytics/actual-vs-predicted'),
          axios.get('/api/models')
        ]);

        if (hrRes.data.success) setHourly(hrRes.data.data);
        if (wkRes.data.success) setWeekday(wkRes.data.data);
        if (moRes.data.success) setMonthly(moRes.data.data);
        if (wtRes.data.success) setWeather(wtRes.data.data);
        if (avpRes.data.success) setActualVsPred(avpRes.data.comparison);
        if (mdRes.data.success) setModelsList(mdRes.data.models);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-800 to-slate-900 dark:from-white dark:via-sky-200 dark:to-slate-100 bg-clip-text text-transparent">
          {t('analytics.title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
          {t('analytics.subtitle')}
        </p>
      </div>

      {/* Grid 1: Actual vs Predicted Time Series */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              <span>{t('analytics.timeSeriesTitle')}</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('analytics.timeSeriesSub')}</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={actualVsPred}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="index" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Line type="monotone" dataKey="actual" stroke="#38bdf8" name={t('analytics.actualTraffic')} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="predicted" stroke="#f43f5e" name={t('analytics.predictedTraffic')} strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid 2: Model Comparison Matrix & Weekday Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ML Model Performance Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-500" />
            <span>{t('analytics.modelCompTitle')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">{t('analytics.modelCompSub')}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelsList}>
                <XAxis dataKey="model_name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 1]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                <Bar dataKey="r2" name={t('analytics.r2Score')} fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic by Weekday */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-500" />
            <span>{t('analytics.weekdayTitle')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">{t('analytics.weekdaySub')}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekday}>
                <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                <Bar dataKey="avg_volume" name={t('analytics.avgVehiclesHr')} fill="#0284c7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 3: Monthly Seasonality & Weather Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Traffic by Month */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            <span>{t('analytics.monthlyTitle')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">{t('analytics.monthlySub')}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="avg_volume" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic by Weather */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <span>{t('analytics.weatherTitle')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">{t('analytics.weatherSub')}</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weather}>
                <XAxis dataKey="weather_main" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                <Bar dataKey="avg_volume" name={t('analytics.avgVehiclesHr')} fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
