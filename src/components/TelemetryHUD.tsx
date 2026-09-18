import React from 'react';
import { VehicleTelemetry } from '../types';
import { TrafficSignIcon } from './TrafficSignIcon';
import { 
  Gauge, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Radar, 
  Car, 
  Flame, 
  AlertOctagon, 
  Compass,
  CheckCircle2
} from 'lucide-react';

interface TelemetryHUDProps {
  telemetry: VehicleTelemetry;
  onSetSpeed: (speed: number) => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry, onSetSpeed }) => {
  const isSpeeding = telemetry.speed > telemetry.speedLimit;
  const overspeedDelta = Math.max(0, telemetry.speed - telemetry.speedLimit);

  // Speedometer arc angle calculations (0 to 120 mph mapped to 0% to 100%)
  const maxDialSpeed = 120;
  const speedPercentage = Math.min(100, (telemetry.speed / maxDialSpeed) * 100);
  const limitPercentage = Math.min(100, (telemetry.speedLimit / maxDialSpeed) * 100);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Title & ADAS Systems Online status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white tracking-tight">
            Vehicle Telemetry & Cockpit HUD
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ADAS Active
          </span>
        </div>
      </div>

      {/* Main Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Gauge 1: Radial Speedometer Dial */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Background circular track */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Outer track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#1e293b"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset="66" // open bottom arc
              />

              {/* Posted Speed Limit Marker Indicator */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={264 - ((limitPercentage * 0.75) / 100) * 264}
                className="opacity-40"
              />

              {/* Active Current Speed Arc */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isSpeeding ? '#f43f5e' : '#06b6d4'}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="264"
                strokeDashoffset={264 - ((speedPercentage * 0.75) / 100) * 264}
                className="transition-all duration-150"
              />
            </svg>

            {/* Inner Speed Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold font-mono tracking-tighter ${
                isSpeeding ? 'text-rose-400' : 'text-cyan-300'
              }`}>
                {telemetry.speed.toFixed(0)}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400 -mt-1 font-bold">
                MPH
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1">
                MAX 120
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 px-2 mt-1">
            <span>0 MPH</span>
            <span className="text-amber-400 font-semibold">Limit: {telemetry.speedLimit}</span>
            <span>120 MPH</span>
          </div>
        </div>

        {/* Gauge 2: Speed Compliance & ISA Status */}
        <div className="flex flex-col justify-between h-full p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Speed Compliance
            </span>
            <TrafficSignIcon
              type="SPEED_LIMIT"
              value={telemetry.speedLimit}
              size="sm"
              isFlashing={isSpeeding}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-300">Posted Speed Zone:</span>
              <span className="text-sm font-bold font-mono text-white">
                {telemetry.speedLimit} MPH
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs text-slate-300">Speed Delta:</span>
              <span className={`text-sm font-bold font-mono ${
                isSpeeding ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {isSpeeding ? `+${overspeedDelta.toFixed(1)} MPH (VIOLATION)` : `${(telemetry.speedLimit - telemetry.speed).toFixed(1)} MPH Under`}
              </span>
            </div>

            {/* Visual Compliance Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-200 ${
                  isSpeeding ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (telemetry.speed / (telemetry.speedLimit * 1.3)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">ISA Speed Limiter:</span>
            <button
              onClick={() => onSetSpeed(telemetry.speedLimit)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono font-medium transition-colors"
            >
              Snap to {telemetry.speedLimit} MPH
            </button>
          </div>
        </div>

        {/* Gauge 3: Radar Distance & Collision Mitigation */}
        <div className="flex flex-col justify-between h-full p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Forward Radar (FCW)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              telemetry.followingDistance < 25 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {telemetry.followingDistance < 25 ? 'TAILGATING' : 'SAFE DIST'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">DISTANCE AHEAD</div>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {telemetry.followingDistance}m
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">TIME TO IMPACT</div>
              <div className={`text-xl font-bold font-mono ${
                telemetry.timeToCollision < 2.5 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {telemetry.timeToCollision.toFixed(1)}s
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>AEB Braking Assist:</span>
            <span className="font-mono text-emerald-400 font-semibold">STANDBY READY</span>
          </div>
        </div>
      </div>

      {/* Driver Coaching & Active Subsystems Status Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Driver Attention</div>
            <div className="font-semibold text-slate-200">{telemetry.driverAlertness}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Lane Guidance</div>
            <div className="font-semibold text-slate-200">Center Lock (±0.04)</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Odometer Trip</div>
            <div className="font-semibold text-slate-200">{telemetry.odometer.toFixed(1)} mi</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Speed Violations</div>
            <div className="font-semibold text-amber-300">{telemetry.totalViolations} events</div>
          </div>
        </div>
      </div>
    </div>
  );
};
