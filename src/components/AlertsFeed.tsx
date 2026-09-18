import React, { useState } from 'react';
import { HazardAlert, AlertSeverity } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Sliders, 
  Clock, 
  Zap, 
  ArrowDownRight,
  Info
} from 'lucide-react';
import { AudioAlertEngine } from '../utils/audioAlerts';

interface AlertsFeedProps {
  alerts: HazardAlert[];
  onDismissAlert: (id: string) => void;
  onClearAll: () => void;
  onApplySpeedCompliance: (targetSpeed: number) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onDismissAlert,
  onClearAll,
  onApplySpeedCompliance
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SPEED_VIOLATION' | 'HAZARDS' | 'CRITICAL'>('ALL');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.6);

  const toggleSound = () => {
    const next = !audioMuted;
    setAudioMuted(next);
    AudioAlertEngine.setSoundEnabled(!next);
  };

  const toggleVoice = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    AudioAlertEngine.setVoiceEnabled(!next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    AudioAlertEngine.setVolume(val);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'ALL') return true;
    if (filter === 'SPEED_VIOLATION') return alert.type === 'SPEED_VIOLATION';
    if (filter === 'HAZARDS') return alert.type !== 'SPEED_VIOLATION';
    if (filter === 'CRITICAL') return alert.severity === 'critical';
    return true;
  });

  const activeViolationsCount = alerts.filter(a => a.type === 'SPEED_VIOLATION' && !a.dismissed).length;
  const criticalHazardsCount = alerts.filter(a => a.severity === 'critical' && !a.dismissed).length;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-xl">
      {/* Header with audio controls and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Real-Time Alert Feed & Hazard Monitor
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live edge-detection event stream for speeding violations & road safety threats
          </p>
        </div>

        {/* Audio & Voice Control Strip */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium ${
              !audioMuted ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-400'
            }`}
            title={audioMuted ? 'Unmute alert beeps' : 'Mute alert beeps'}
          >
            {!audioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">Beeps</span>
          </button>

          <button
            onClick={toggleVoice}
            className={`px-2 py-1 rounded-lg transition-colors text-[11px] font-medium ${
              !voiceMuted ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40' : 'text-slate-500'
            }`}
            title="Driver Voice Advisory Assistant"
          >
            Voice Copilot: {!voiceMuted ? 'ON' : 'OFF'}
          </button>

          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-[10px] font-mono text-slate-500">VOL</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metric Counters & Alert Filter Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] font-mono uppercase text-slate-400">Speed Violations</div>
          <div className="text-xl font-bold font-mono text-amber-400">{activeViolationsCount}</div>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] font-mono uppercase text-slate-400">Critical Hazards</div>
          <div className="text-xl font-bold font-mono text-rose-400">{criticalHazardsCount}</div>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] font-mono uppercase text-slate-400">Detection Latency</div>
          <div className="text-xl font-bold font-mono text-cyan-400">14ms</div>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="text-[10px] font-mono uppercase text-slate-400">TSR Model Accuracy</div>
          <div className="text-xl font-bold font-mono text-emerald-400">99.4%</div>
        </div>
      </div>

      {/* Filter Tabs & Clear Actions */}
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'SPEED_VIOLATION', 'HAZARDS', 'CRITICAL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab === 'ALL' && 'All Alerts'}
              {tab === 'SPEED_VIOLATION' && 'Speed Violations'}
              {tab === 'HAZARDS' && 'Road Hazards'}
              {tab === 'CRITICAL' && 'Critical Only'}
            </button>
          ))}
        </div>

        {alerts.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        )}
      </div>

      {/* Scrollable Alerts List */}
      <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/70" />
            <span className="text-sm font-medium text-slate-400">Roadway Clear — No Active Violations</span>
            <span className="text-xs text-slate-500">
              Drive safely or accelerate past posted speed to trigger real-time alerts.
            </span>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => {
            const isSpeedAlert = alert.type === 'SPEED_VIOLATION';
            const isCrit = alert.severity === 'critical';

            return (
              <div
                key={`${alert.id}-${index}`}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCrit
                    ? 'bg-rose-950/30 border-rose-800/60 shadow-md shadow-rose-950/20'
                    : isSpeedAlert
                    ? 'bg-amber-950/25 border-amber-800/50'
                    : 'bg-slate-950/60 border-slate-800'
                } ${alert.dismissed ? 'opacity-50' : 'opacity-100'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    isCrit ? 'bg-rose-500/20 text-rose-400' : isSpeedAlert ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {isCrit ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                        isCrit ? 'bg-rose-500/20 text-rose-300' : isSpeedAlert ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {alert.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {/* Speed delta indicator tag */}
                    {isSpeedAlert && alert.deltaMph && alert.deltaMph > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                          <ArrowDownRight className="w-3 h-3 rotate-45" />
                          +{alert.deltaMph.toFixed(0)} MPH Over Limit ({alert.currentSpeed} in {alert.speedLimit} MPH Zone)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Interactive Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isSpeedAlert && (
                    <button
                      onClick={() => onApplySpeedCompliance(alert.speedLimit)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Adjust throttle to match posted speed limit"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Comply ({alert.speedLimit} MPH)
                    </button>
                  )}

                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Dismiss alert"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
