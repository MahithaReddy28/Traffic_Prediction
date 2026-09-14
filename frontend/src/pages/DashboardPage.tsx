import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, hrRes, mdRes] = await Promise.all([
          axios.get('/api/analytics/traffic-overview'),
          axios.get('/api/analytics/hourly'),
          axios.get('/api/models/active')
        ]);
        if (ovRes.data.success) setOverview(ovRes.data);
        if (hrRes.data.success) setHourlyData(hrRes.data.data);
        if (mdRes.data.success) setActiveModel(mdRes.data.active_model);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-800 to-slate-900 dark:from-white dark:via-sky-200 dark:to-slate-100 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <Link
          to="/predict"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-95 transition-all"
        >
          <BrainCircuit className="w-4 h-4" />
          <span>{t('dashboard.launchBtn')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Records */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpis.totalRecords')}
            </span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {overview?.total_records?.toLocaleString() || '48,187'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> {t('kpis.cleanedDataset')}
            </p>
          </div>
        </motion.div>

        {/* Avg Volume */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpis.avgVolume')}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {overview?.avg_volume ? `${overview.avg_volume}` : '3,259.8'}
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1.5">{t('kpis.vehiclesPerHour')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /> {t('kpis.maxVolume')}: {overview?.max_volume?.toLocaleString()} {t('kpis.vehiclesPerHour')}
            </p>
          </div>
        </motion.div>

        {/* Peak Congestion Hour */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpis.peakHour')}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {overview?.peak_hour !== undefined ? `${overview.peak_hour}:00 HRS` : '17:00 HRS'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              {t('kpis.rushHour')}
            </p>
          </div>
        </motion.div>

        {/* Best Model Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('kpis.bestModel')}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeModel?.model_name || 'XGBoost'}
              <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 ml-2">R² {activeModel?.r2 || '0.9472'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              MAE: {activeModel?.mae || '280.1'} | RMSE: {activeModel?.rmse || '455.8'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Hourly Trend Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.hourlyTitle')}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('dashboard.hourlySubtitle')}</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Area type="monotone" dataKey="avg_volume" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#trafficGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
