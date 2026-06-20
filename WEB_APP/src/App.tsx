/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { 
  Sun, 
  Thermometer, 
  Zap, 
  Cpu, 
  Activity, 
  Database,
  RefreshCw,
  AlertCircle,
  Download,
  X,
  Maximize2,
  PauseCircle,
  Trash2
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'motion/react';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Constants
const MAX_DATA_POINTS = 25;
const UPDATE_INTERVAL = 2000;

type TabType = 'mppt' | 'cooling' | 'converter';

interface TelemetryData {
  timestamp: string;
  irradiance: number; // Keep for backward compatibility or global average
  normal: {
    irradiance: number;
    temperature: number;
    p_pv: number;
    v_pv: number;
    i_pv: number;
    v_battery: number;
    i_battery: number;
    p_battery: number;
  };
  cooled: {
    irradiance: number;
    temperature: number;
    p_pv: number;
    v_pv: number;
    i_pv: number;
    v_battery: number;
    i_battery: number;
    p_battery: number;
  };
}

interface ESPData {
  timestamp: string;
  irradiance: number;
  temperature: number;
  v_pv: number;
  i_pv: number;
  p_pv: number;
  v_battery: number;
  i_battery: number;
  p_battery: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('mppt');
  const [converterMode, setConverterMode] = useState<'proposed' | 'standard'>('proposed');
  const [fullDataHistory, setFullDataHistory] = useState<TelemetryData[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [espConnected, setEspConnected] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    args: [string, Extract<keyof TelemetryData, string> | ((d: TelemetryData) => number), string?, (Extract<keyof TelemetryData, string> | ((d: TelemetryData) => number))?, string?, string?, boolean?];
    options: ChartOptions<'line'>;
  } | null>(null);

  // Firebase Error Handler as required by guidelines
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // Don't throw to avoid crashing the whole app during active simulation, just log
  };

  // Listen to Firebase instead of local generation for the chart data
  useEffect(() => {
    if (!isLive) return;

    let lastPushedTimestamp = '';
    let espTimeout: NodeJS.Timeout;

    const watchdog = () => {
      setEspConnected(true);
      clearTimeout(espTimeout);
      espTimeout = setTimeout(() => {
        setEspConnected(false);
      }, 5000); // 5 seconds of silence means disconnected
    };

    const unsubscribe = onValue(ref(db, 'devices'), (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.val();
      const localNorm = (data['esp32-normal'] || {}) as Partial<ESPData>;
      const localCool = (data['esp32-cooled'] || {}) as Partial<ESPData>;
      
      if (!data['esp32-normal'] && !data['esp32-cooled']) return;
      
      const time1 = localNorm.timestamp || '';
      const time2 = localCool.timestamp || '';
      const latestTime = time1 > time2 ? time1 : (time2 || new Date().toLocaleTimeString());
      
      // Update watchdog regardless of duplication, because an identical timestamp might
      // just mean the ESP didn't update the time yet, but it's still sending alive packets.
      // But if we want true data liveness, we ensure time is advancing.
      if (latestTime !== '' && latestTime === lastPushedTimestamp) return;
      lastPushedTimestamp = latestTime;
      
      watchdog();

      const newData: TelemetryData = {
        timestamp: latestTime,
        irradiance: localCool.irradiance || localNorm.irradiance || 0,
        normal: {
          irradiance: localNorm.irradiance || 0,
          temperature: localNorm.temperature || 0,
          p_pv: localNorm.p_pv || 0,
          v_pv: localNorm.v_pv || 0,
          i_pv: localNorm.i_pv || 0,
          v_battery: localNorm.v_battery || 0,
          i_battery: localNorm.i_battery || 0,
          p_battery: localNorm.p_battery || 0
        },
        cooled: {
          irradiance: localCool.irradiance || 0,
          temperature: localCool.temperature || 0,
          p_pv: localCool.p_pv || 0,
          v_pv: localCool.v_pv || 0,
          i_pv: localCool.i_pv || 0,
          v_battery: localCool.v_battery || 0,
          i_battery: localCool.i_battery || 0,
          p_battery: localCool.p_battery || 0
        }
      };

      setFullDataHistory(prev => {
        const updatedHistory = [...prev, newData];
        if (updatedHistory.length > 5000) return updatedHistory.slice(-5000);
        return updatedHistory;
      });
    }, (error) => handleFirestoreError(error, 'get', 'devices'));

    return () => {
      unsubscribe();
      clearTimeout(espTimeout);
      setEspConnected(false);
    };
  }, [isLive]);


  const dataHistory = fullDataHistory.slice(-MAX_DATA_POINTS);
  const latest = fullDataHistory[fullDataHistory.length - 1];
  const tempDiff = latest ? latest.normal.temperature - latest.cooled.temperature : 0;
  const isCoolingActive = tempDiff > 3.0;
  const coolingEfficiency = latest && latest.normal.temperature > 0 ? ((latest.normal.temperature - latest.cooled.temperature) / latest.normal.temperature) * 100 : 0;
  const avgCoolingEfficiency = dataHistory.length > 0 ? (dataHistory.reduce((acc, curr) => acc + (curr.normal.temperature > 0 ? ((curr.normal.temperature - curr.cooled.temperature) / curr.normal.temperature) * 100 : 0), 0) / dataHistory.length) : 0;
  const maxCoolingEfficiency = dataHistory.length > 0 ? Math.max(...dataHistory.map(curr => curr.normal.temperature > 0 ? ((curr.normal.temperature - curr.cooled.temperature) / curr.normal.temperature) * 100 : 0)) : 0;
  
  const maxStdTemp = dataHistory.length > 0 ? Math.max(...dataHistory.map(d => d.normal.temperature)) : 0;
  const maxCoolTemp = dataHistory.length > 0 ? Math.max(...dataHistory.map(d => d.cooled.temperature)) : 0;
  
  const avgStdPower = dataHistory.length > 0 ? (dataHistory.reduce((acc, curr) => acc + (curr.normal.p_pv || 0), 0) / dataHistory.length) : 0;
  const avgCoolPower = dataHistory.length > 0 ? (dataHistory.reduce((acc, curr) => acc + (curr.cooled.p_pv || 0), 0) / dataHistory.length) : 0;

  // Chart configuration helpers
  const getChartData = (
    history: TelemetryData[], 
    label1: string, 
    key1: Extract<keyof TelemetryData, string> | ((d: TelemetryData) => number), 
    label2?: string, 
    key2?: Extract<keyof TelemetryData, string> | ((d: TelemetryData) => number), 
    color1 = '#3b82f6', color2 = '#10b981', fill = false
  ) => {
    const getValue = (d: TelemetryData, key: Extract<keyof TelemetryData, string> | ((d: TelemetryData) => number)) => {
      if (typeof key === 'function') return key(d);
      return Number(d[key]);
    }
    return {
      labels: history.map(d => d.timestamp),
      datasets: [
        {
          label: label1,
          data: history.map(d => getValue(d, key1)),
          borderColor: color1,
          backgroundColor: fill ? `${color1}22` : color1,
          borderWidth: 1,
          pointRadius: 0,
          fill: fill,
          tension: 0,
        },
        ...(label2 && key2 ? [{
          label: label2,
          data: history.map(d => getValue(d, key2)),
          borderColor: color2,
          backgroundColor: fill ? `${color2}22` : color2,
          borderWidth: 1,
          pointRadius: 0,
          fill: fill,
          tension: 0,
        }] : [])
      ],
    };
  };

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#94a3b8', boxWidth: 12, usePointStyle: true, font: { size: 10 } }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
      },
      y: {
        display: true,
        grid: { color: '#1e293b' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const converterEfficiency = latest ? 
    (converterMode === 'proposed' 
      ? (latest.cooled.v_pv > 0 && latest.cooled.i_pv > 0 ? ((latest.cooled.v_battery * latest.cooled.i_battery) / (latest.cooled.v_pv * latest.cooled.i_pv)) * 100 : 0)
      : (latest.normal.v_pv > 0 && latest.normal.i_pv > 0 ? ((latest.normal.v_battery * latest.normal.i_battery) / (latest.normal.v_pv * latest.normal.i_pv)) * 100 : 0)) 
    : 0;

  const downloadCSV = () => {
    if (fullDataHistory.length === 0) return;

    const headers = [
      'Timestamp',
      'Irradiance_standard (W/m²)',
      'Irradiance_proposed (W/m²)',
      'T_normal panel (°C)',
      'T_cool panel (°C)',
      'P_pv_standard (W)',
      'V_pv_standard (V)',
      'I_pv_standard (A)',
      'P_battery_standard (W)',
      'V_battery_standard (V)',
      'I_battery_standard (A)',
      'P_pv_proposed (W)',
      'V_pv_proposed (V)',
      'I_pv_proposed (A)',
      'P_battery_proposed (W)',
      'V_battery_proposed (V)',
      'I_battery_proposed (A)'
    ];

    const rows = fullDataHistory.map(d => [
      d.timestamp,
      d.normal.irradiance.toFixed(2),
      d.cooled.irradiance.toFixed(2),
      d.normal.temperature.toFixed(2),
      d.cooled.temperature.toFixed(2),
      d.normal.p_pv.toFixed(2),
      d.normal.v_pv.toFixed(2),
      d.normal.i_pv.toFixed(3),
      d.normal.p_battery.toFixed(2),
      d.normal.v_battery.toFixed(2),
      d.normal.i_battery.toFixed(3),
      d.cooled.p_pv.toFixed(2),
      d.cooled.v_pv.toFixed(2),
      d.cooled.i_pv.toFixed(3),
      d.cooled.p_battery.toFixed(2),
      d.cooled.v_battery.toFixed(2),
      d.cooled.i_battery.toFixed(3)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rk_power_data_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearData = async () => {
    try {
      setFullDataHistory([]);
      await set(ref(db, 'devices/esp32-normal'), null);
      await set(ref(db, 'devices/esp32-cooled'), null);
      setShowClearConfirm(false);
    } catch(err) {
      console.error('Failed to clear device data:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none">
      {/* Header & Branding */}
      <header className="bg-brand-card border-b border-brand-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-white">
              R <span className="text-brand-accent">|</span> K POWER
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ESP32 MPPT Controller v2.4</p>
          </div>
        </div>

        <nav className="flex bg-brand-bg rounded-lg p-1 border border-brand-border h-fit">
          <TabButton active={activeTab === 'mppt'} onClick={() => setActiveTab('mppt')} label="MPPT Comparison" icon={<Activity size={16} />} />
          <TabButton active={activeTab === 'cooling'} onClick={() => setActiveTab('cooling')} label="Cooling Method" icon={<Thermometer size={16} />} />
          <TabButton active={activeTab === 'converter'} onClick={() => setActiveTab('converter')} label="Converter Details" icon={<Cpu size={16} />} />
        </nav>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`relative flex h-2.5 w-2.5`}>
              {espConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${espConnected ? 'bg-brand-success' : 'bg-brand-danger'}`}></span>
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${espConnected ? 'text-brand-success' : 'text-brand-danger'}`}>
              {espConnected ? 'SYSTEM ONLINE' : 'DEVICE OFFLINE'}
            </span>
          </div>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all ${isLive ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 hover:bg-[#10b981]/30' : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 hover:bg-[#ef4444]/30'}`}
          >
            {isLive ? (
              <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
            ) : (
              <PauseCircle size={14} />
            )}
            {isLive ? 'RUN' : 'PAUSED'}
          </button>
        </div>
      </header>



      <main className="flex-1 p-6 overflow-x-hidden custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'mppt' && (
            <motion.div 
              key="mppt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-end">
                  {!showClearConfirm ? (
                    <button 
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-bg hover:bg-brand-card text-slate-400 hover:text-brand-danger border border-brand-border hover:border-brand-danger rounded-lg transition-colors font-medium text-xs shadow-sm"
                    >
                      <Trash2 size={14} />
                      Remove Previous Data
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-brand-danger/10 border border-brand-danger/30 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-right-4">
                      <span className="text-xs font-semibold text-brand-danger uppercase">Confirm Deletion?</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={clearData}
                          className="px-3 py-1 bg-brand-danger hover:bg-red-600 text-white text-xs font-bold rounded shadow transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button 
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1 bg-brand-card hover:bg-slate-700 text-slate-300 text-xs font-medium border border-brand-border rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <ChartCard title="PV Power Output Comparison" icon={<Zap className="text-yellow-400" size={18} />} onExpand={() => setExpandedChart({ title: 'PV Power Output Comparison', args: ['P_norm (Standard)', d => d.normal.p_pv, 'P_cool (Proposed)', d => d.cooled.p_pv, '#94a3b8', '#10b981', true], options: commonOptions })}>
                  <div className="chart-container">
                    <Line data={getChartData(dataHistory, 'P_norm (Standard)', d => d.normal.p_pv, 'P_cool (Proposed)', d => d.cooled.p_pv, '#94a3b8', '#10b981', true)} options={commonOptions} />
                  </div>
                </ChartCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="Solar Irradiance" icon={<Sun className="text-orange-400" size={18} />} onExpand={() => setExpandedChart({ title: 'Solar Irradiance', args: ['PV Irradiance', d => d.cooled.irradiance, undefined, undefined, '#fbbf24', undefined, true], options: {...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales?.y, max: 1200, min: 0 } }}})}>
                    <div className="chart-container">
                      <Line data={getChartData(dataHistory, 'PV Irradiance', d => d.cooled.irradiance, undefined, undefined, '#fbbf24', undefined, true)} options={{...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales?.y, max: 1200, min: 0 } }}} />
                    </div>
                  </ChartCard>
                  <ChartCard title="Panel Temperature" icon={<Thermometer className="text-blue-400" size={18} />} onExpand={() => setExpandedChart({ title: 'Panel Temperature', args: ['T_normal panel', d => d.normal.temperature, 'T_cool panel', d => d.cooled.temperature, '#f87171', '#3b82f6'], options: commonOptions })}>
                    <div className="chart-container">
                      <Line data={getChartData(dataHistory, 'T_normal panel', d => d.normal.temperature, 'T_cool panel', d => d.cooled.temperature, '#f87171', '#3b82f6')} options={commonOptions} />
                    </div>
                  </ChartCard>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-brand-card rounded-2xl border border-brand-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="text-brand-accent" size={18} />
                    <h3 className="text-sm font-semibold">Algorithm Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-500 border-b border-brand-border">
                          <th className="pb-2 font-medium">Metric</th>
                          <th className="pb-2 font-medium">Standard</th>
                          <th className="pb-2 font-medium">Proposed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        <TableRow label="Efficiency" val1={`${latest && latest.normal.p_pv > 0 ? ((latest.normal.p_battery / latest.normal.p_pv) * 100).toFixed(1) : 0}%`} val2={`${latest && latest.cooled.p_pv > 0 ? ((latest.cooled.p_battery / latest.cooled.p_pv) * 100).toFixed(1) : 0}%`} />
                        <TableRow label="PV Voltage" val1={`${(latest?.normal.v_pv ?? 0).toFixed(1)}V`} val2={`${(latest?.cooled.v_pv ?? 0).toFixed(1)}V`} />
                        <TableRow label="PV Current" val1={`${(latest?.normal.i_pv ?? 0).toFixed(2)}A`} val2={`${(latest?.cooled.i_pv ?? 0).toFixed(2)}A`} />
                        <TableRow label="Battery Power" val1={`${(latest?.normal.p_battery ?? 0).toFixed(1)}W`} val2={`${(latest?.cooled.p_battery ?? 0).toFixed(1)}W`} />
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-brand-accent to-blue-600 rounded-2xl p-6 text-white overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="text-xs opacity-80 font-medium mb-1">Estimated Power Gain</p>
                    <h4 className="text-3xl font-bold">+{(( (latest?.cooled.p_pv ?? 0) / (latest?.normal.p_pv ?? 1) - 1 ) * 100).toFixed(1)}%</h4>
                    <p className="text-[10px] opacity-70 mt-4 leading-relaxed">
                      Cooling improves panel Voc and reduces internal resistance losses in cells.
                    </p>
                  </div>
                  <Zap className="absolute -right-4 -bottom-4 opacity-20 w-32 h-32 rotate-12" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cooling' && (
            <motion.div 
              key="cooling"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
               <ChartCard title="Thermal Comparison" icon={<Thermometer size={18} />} onExpand={() => setExpandedChart({ title: 'Thermal Comparison', args: ['T_normal panel', d => d.normal.temperature, 'T_cool panel', d => d.cooled.temperature, '#ef4444', '#06b6d4', true], options: commonOptions })}>
                  <div className="chart-container">
                    <Line data={getChartData(dataHistory, 'T_normal panel', d => d.normal.temperature, 'T_cool panel', d => d.cooled.temperature, '#ef4444', '#06b6d4', true)} options={commonOptions} />
                  </div>
                </ChartCard>

                <ChartCard title="Solar Irradiance" icon={<Sun size={18} />} onExpand={() => setExpandedChart({ title: 'Solar Irradiance', args: ['PV Irradiance', d => d.cooled.irradiance, undefined, undefined, '#fbbf24'], options: {...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales?.y, max: 1200, min: 0 } }}})}>
                  <div className="chart-container">
                    <Line data={getChartData(dataHistory, 'PV Irradiance', d => d.cooled.irradiance, undefined, undefined, '#fbbf24')} options={{...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales?.y, max: 1200, min: 0 } }}} />
                  </div>
                </ChartCard>

                <div className="md:col-span-2 bg-brand-card rounded-2xl border border-brand-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Thermal Management Analytics</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-brand-border">
                          <th className="pb-3 text-left">Parameter</th>
                          <th className="pb-3 text-left">Standard</th>
                          <th className="pb-3 text-left">Proposed</th>
                          <th className="pb-3 text-left">Saved / Diff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        <TableRowWide label="Avg Temp" val1={`${(latest?.normal.temperature ?? 0).toFixed(1)}°C`} val2={`${(latest?.cooled.temperature ?? 0).toFixed(1)}°C`} diff={`-${tempDiff.toFixed(1)}°C`} />
                        <TableRowWide label="Max (Peak)" val1={`${maxStdTemp.toFixed(1)}°C`} val2={`${maxCoolTemp.toFixed(1)}°C`} diff={`${-(maxStdTemp - maxCoolTemp).toFixed(1)}°C`} />
                        <TableRowWide label="Avg Pwr (W)" val1={avgStdPower.toFixed(1)} val2={avgCoolPower.toFixed(1)} diff={`${avgCoolPower >= avgStdPower ? '+' : ''}${(avgCoolPower - avgStdPower).toFixed(1)} W`} isGood={avgCoolPower >= avgStdPower} />
                        <TableRowWide label="Current efficiency" val1="0.0%" val2={`${coolingEfficiency.toFixed(1)}%`} diff={`+${coolingEfficiency.toFixed(1)}%`} isGood={coolingEfficiency >= 0} />
                        <TableRowWide label="Avg. Efficiency" val1="0.0%" val2={`${avgCoolingEfficiency.toFixed(1)}%`} diff={`+${avgCoolingEfficiency.toFixed(1)}%`} isGood={avgCoolingEfficiency >= 0} />
                        <TableRowWide label="Max Efficiency" val1="0.0%" val2={`${maxCoolingEfficiency.toFixed(1)}%`} diff={`+${maxCoolingEfficiency.toFixed(1)}%`} isGood={maxCoolingEfficiency >= 0} />
                      </tbody>
                    </table>
                  </div>
                </div>
            </motion.div>
          )}

          {activeTab === 'converter' && (
            <motion.div 
              key="converter"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Converter Performance</h2>
                <div className="bg-brand-bg p-1 rounded-lg border border-brand-border flex gap-1 shadow-sm">
                  <button 
                    onClick={() => setConverterMode('standard')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${converterMode === 'standard' ? 'bg-brand-card text-white shadow border border-brand-border' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Standard Panel
                  </button>
                  <button 
                    onClick={() => setConverterMode('proposed')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${converterMode === 'proposed' ? 'bg-brand-card text-brand-accent shadow border border-brand-border' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Proposed Panel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 bg-brand-card rounded-2xl border border-brand-border p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${converterMode === 'proposed' ? 'bg-brand-accent' : 'bg-slate-400'}`} />
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Overall Efficiency ({converterMode === 'proposed' ? 'Proposed' : 'Standard'})</p>
                  <div className="text-5xl font-bold text-brand-success font-mono">
                    {converterEfficiency.toFixed(1)}<span className="text-2xl opacity-50">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 uppercase">Loss: {(100 - converterEfficiency).toFixed(1)}%</p>
                </div>
                
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="Voltage Dynamics" icon={<Activity size={18} />} onExpand={() => setExpandedChart({ title: 'Voltage Dynamics', args: ['V_pv (Input)', d => converterMode === 'proposed' ? d.cooled.v_pv : d.normal.v_pv, 'V_batt (Output)', d => converterMode === 'proposed' ? d.cooled.v_battery : d.normal.v_battery, '#c084fc', '#4ade80'], options: {...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales?.y, max: 30, min: 0 } }}})}>
                    <div className="chart-container">
                      <Line data={getChartData(dataHistory, 'V_pv (Input)', d => converterMode === 'proposed' ? d.cooled.v_pv : d.normal.v_pv, 'V_batt (Output)', d => converterMode === 'proposed' ? d.cooled.v_battery : d.normal.v_battery, '#c084fc', '#4ade80')} options={{...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales?.y, max: 30, min: 0 } }}} />
                    </div>
                  </ChartCard>
                  <ChartCard title={`Current Metrics (${converterMode === 'proposed' ? 'Proposed' : 'Standard'})`} icon={<Activity size={18} />} onExpand={() => setExpandedChart({ title: `Current Metrics (${converterMode === 'proposed' ? 'Proposed' : 'Standard'})`, args: ['I_pv', d => converterMode === 'proposed' ? d.cooled.i_pv : d.normal.i_pv, 'I_batt', d => converterMode === 'proposed' ? d.cooled.i_battery : d.normal.i_battery, '#f472b6', '#34d399'], options: commonOptions })}>
                    <div className="chart-container">
                      <Line data={getChartData(dataHistory, 'I_pv', d => converterMode === 'proposed' ? d.cooled.i_pv : d.normal.i_pv, 'I_batt', d => converterMode === 'proposed' ? d.cooled.i_battery : d.normal.i_battery, '#f472b6', '#34d399')} options={commonOptions} />
                    </div>
                  </ChartCard>
                </div>
              </div>

              <ChartCard title={`Power Mapping (${converterMode === 'proposed' ? 'Proposed' : 'Standard'} Panel)`} icon={<Zap size={18} />} onExpand={() => setExpandedChart({ title: `Power Mapping (${converterMode === 'proposed' ? 'Proposed' : 'Standard'} Panel)`, args: ['P_pv (Input)', d => converterMode === 'proposed' ? d.cooled.p_pv : d.normal.p_pv, 'P_batt (Output)', d => converterMode === 'proposed' ? d.cooled.p_battery : d.normal.p_battery, '#38bdf8', '#fbbf24', true], options: commonOptions })}>
                  <div className="chart-container h-[300px]">
                    <Line data={getChartData(dataHistory, 'P_pv (Input)', d => converterMode === 'proposed' ? d.cooled.p_pv : d.normal.p_pv, 'P_batt (Output)', d => converterMode === 'proposed' ? d.cooled.p_battery : d.normal.p_battery, '#38bdf8', '#fbbf24', true)} options={commonOptions} />
                  </div>
              </ChartCard>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-card hover:bg-slate-800 text-white border border-brand-border rounded-lg shadow transition-colors font-semibold text-sm"
                >
                  <Download size={16} className="text-brand-accent" />
                  Export Data (CSV)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Chart Modal */}
        <AnimatePresence>
          {expandedChart && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md p-6"
              onClick={() => setExpandedChart(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-brand-bg border border-brand-border shadow-2xl rounded-2xl p-6 w-full max-w-6xl h-[80vh] flex flex-col relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    <Activity className="text-brand-accent" size={20} />
                    {expandedChart.title}
                  </h2>
                  <button 
                    onClick={() => setExpandedChart(null)} 
                    className="text-slate-400 hover:text-white hover:bg-white hover:bg-opacity-10 p-2 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 w-full min-h-0 relative bg-brand-card rounded-xl border border-brand-border p-4">
                  <Line 
                    data={getChartData(fullDataHistory, expandedChart.args[0], expandedChart.args[1], expandedChart.args[2], expandedChart.args[3], expandedChart.args[4], expandedChart.args[5], expandedChart.args[6])} 
                    options={{
                      ...expandedChart.options,
                      maintainAspectRatio: false,
                      plugins: {
                        ...expandedChart.options.plugins,
                        tooltip: {
                          ...expandedChart.options.plugins?.tooltip,
                          mode: 'index',
                          intersect: false,
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        }
                      }
                    }} 
                  />
                  {fullDataHistory.length > 50 && (
                    <div className="absolute top-4 left-4 text-[10px] text-slate-400 bg-brand-bg px-2 py-1 rounded border border-brand-border font-mono shadow-sm">
                      Full Dataset: {fullDataHistory.length} points
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-brand-card border-t border-brand-border px-6 py-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-success" />
            ESP32: STABLE
          </div>
          <div className="flex items-center gap-2">
            <Database size={10} />
            DATABASE: READY
          </div>
        </div>
        <div>
          DESIGNED BY R | K POWER © 2026
        </div>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all duration-300 ${active ? 'bg-brand-card text-white shadow-lg border border-brand-border' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ChartCard({ title, icon, children, badge, onExpand }: { title: string, icon: React.ReactNode, children: React.ReactNode, badge?: string, onExpand?: () => void }) {
  return (
    <div 
      className={`bg-brand-card rounded-2xl border border-brand-border overflow-hidden p-5 flex flex-col gap-4 relative group ${onExpand ? 'hover:border-brand-accent transition-colors' : ''}`}
    >
      {onExpand && (
         <button 
           className="absolute top-4 right-4 text-slate-500 hover:text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity" 
           title="Expand Chart"
           onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             onExpand();
           }}
         >
            <Maximize2 size={18} />
         </button>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-tight">{title}</h3>
        </div>
        {badge && <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">{badge}</span>}
      </div>
      <div className="flex-1 w-full min-h-0">
        {children}
      </div>
    </div>
  );
}

function TableRow({ label, val1, val2 }: { label: string, val1: string, val2: string }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="py-2.5 text-slate-400">{label}</td>
      <td className="py-2.5 font-medium text-slate-300">{val1}</td>
      <td className="py-2.5 font-bold text-brand-success">{val2}</td>
    </tr>
  );
}

function TableRowWide({ label, val1, val2, diff, isGood }: { label: string, val1: string, val2: string, diff: string, isGood?: boolean }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="py-4 font-medium text-slate-300">{label}</td>
      <td className="py-4 text-slate-400 font-mono">{val1}</td>
      <td className="py-4 text-white font-mono">{val2}</td>
      <td className={`py-4 font-bold font-mono ${isGood ? 'text-brand-success' : 'text-brand-accent'}`}>{diff}</td>
    </tr>
  );
}
