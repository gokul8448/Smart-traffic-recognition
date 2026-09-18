import React from 'react';
import { VehicleTelemetry, HazardAlert } from '../types';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  Award, 
  BarChart3, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface SafetyAnalyticsProps {
  telemetry: VehicleTelemetry;
  alerts: HazardAlert[];
}

export const SafetyAnalytics: React.FC<SafetyAnalyticsProps> = ({ telemetry, alerts }) => {
  const speedViolations = alerts.filter(a => a.type === 'SPEED_VIOLATION');
  const hazardAlerts = alerts.filter(a => a.type !== 'SPEED_VIOLATION');

  // Performance metrics calculation
  const complianceRate = Math.max(35, 100 - (speedViolations.length * 8));
  const headwayRating = telemetry.followingDistance >= 30 ? 95 : telemetry.followingDistance >= 20 ? 75 : 45;
  const reactionScore = 92; // typical ADAS assisted reaction score
  const overallSafetyGrade = telemetry.safetyScore >= 90 ? 'A+' : telemetry.safetyScore >= 80 ? 'A' : telemetry.safetyScore >= 70 ? 'B' : telemetry.safetyScore >= 60 ? 'C' : 'D';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white tracking-tight">
              Road Safety Diagnostics & Driver Scorecard
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic speed compliance, following cushion, and hazard avoidance analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Overall Rating:</span>
          <span className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-sm ${
            telemetry.safetyScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            Grade {overallSafetyGrade} ({telemetry.safetyScore}/100)
          </span>
        </div>
      </div>

      {/* 4 Pillars of ADAS Driver Safety */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Speed Limit Adherence */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Speed Compliance</span>
            <span className="text-xs font-bold font-mono text-emerald-400">{complianceRate}%</span>
          </div>
          <div className="my-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${complianceRate}%` }}></div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {speedViolations.length} recorded overspeed incidents during drive
          </div>
        </div>

        {/* Headway Distance Safety */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Following Cushion</span>
            <span className={`text-xs font-bold font-mono ${headwayRating >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {headwayRating}%
            </span>
          </div>
          <div className="my-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${headwayRating >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${headwayRating}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Current radar buffer: {telemetry.followingDistance} meters ({telemetry.timeToCollision.toFixed(1)}s)
          </div>
        </div>

        {/* Sign Detection & Compliance Reaction */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Sign Reaction Time</span>
            <span className="text-xs font-bold font-mono text-cyan-400">0.32 sec</span>
          </div>
          <div className="my-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Automated Vision OCR warning prompt latency
          </div>
        </div>

        {/* Hazard Mitigation Score */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Defensive Rating</span>
            <span className="text-xs font-bold font-mono text-indigo-400">Top 5%</span>
          </div>
          <div className="my-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '88%' }}></div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {hazardAlerts.length} hazards proactively identified & logged
          </div>
        </div>
      </div>

      {/* Safety Copilot Coaching Recommendations */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              AI Driving Copilot Advisory
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {telemetry.speed > telemetry.speedLimit
                ? `You are currently exceeding the posted ${telemetry.speedLimit} MPH limit by ${(telemetry.speed - telemetry.speedLimit).toFixed(0)} MPH. Engage Intelligent Speed Adaptation (ISA) or brake smoothly to avoid infraction risk.`
                : telemetry.followingDistance < 25
                ? 'Lead vehicle is within close proximity. Increase headway buffer to at least 3 seconds on current road surface.'
                : 'Excellent speed control. Vehicle is operating within safe statutory parameters with active radar obstacle coverage.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            Safety Assist: Standby
          </span>
        </div>
      </div>
    </div>
  );
};
