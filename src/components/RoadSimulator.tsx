import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TrafficSign, VehicleTelemetry, RoadScenario } from '../types';
import { TrafficSignIcon } from './TrafficSignIcon';
import { AudioAlertEngine } from '../utils/audioAlerts';
import { 
  Gauge, 
  ShieldAlert, 
  AlertTriangle, 
  Eye, 
  Sliders, 
  Zap, 
  Navigation,
  Compass,
  CloudRain,
  Sun,
  Moon,
  Wind
} from 'lucide-react';

interface RoadSimulatorProps {
  scenario: RoadScenario;
  telemetry: VehicleTelemetry;
  activeSigns: TrafficSign[];
  onSpeedChange: (speed: number) => void;
  onTelemetryUpdate: (updater: (prev: VehicleTelemetry) => VehicleTelemetry) => void;
  onScenarioChange: (scenarioId: string) => void;
  allScenarios: RoadScenario[];
}

export const RoadSimulator: React.FC<RoadSimulatorProps> = ({
  scenario,
  telemetry,
  activeSigns,
  onSpeedChange,
  onTelemetryUpdate,
  onScenarioChange,
  allScenarios
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const roadOffsetRef = useRef<number>(0);
  const signDistanceRef = useRef<number>(45); // distance of sign ahead in meters
  const [autoGoverning, setAutoGoverning] = useState<boolean>(false);
  const [detectionBoxesEnabled, setDetectionBoxesEnabled] = useState<boolean>(true);
  const [hudOverlayEnabled, setHudOverlayEnabled] = useState<boolean>(true);
  const [isPressingGas, setIsPressingGas] = useState<boolean>(false);
  const [isPressingBrake, setIsPressingBrake] = useState<boolean>(false);

  // Speed Limit violation calculation
  const speedDelta = telemetry.speed - telemetry.speedLimit;
  const isViolatingSpeed = speedDelta > 0;
  const isSevereViolation = speedDelta >= 10;

  // Lead vehicle collision distance simulator
  const isCollisionRisk = telemetry.followingDistance < 25 && telemetry.speed > 25;

  // Handle keyboard accelerators (ArrowUp = gas, ArrowDown = brake)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        setIsPressingGas(true);
      } else if (['ArrowDown', 's', 'S', ' '].includes(e.key)) {
        setIsPressingBrake(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        setIsPressingGas(false);
      } else if (['ArrowDown', 's', 'S', ' '].includes(e.key)) {
        setIsPressingBrake(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Driving Physics Engine Tick
  useEffect(() => {
    const interval = setInterval(() => {
      onTelemetryUpdate((prev) => {
        let newSpeed = prev.speed;
        let isBraking = false;

        // Auto Governed Speed Assistance (ISA - Intelligent Speed Adaptation)
        if (autoGoverning) {
          const target = prev.speedLimit;
          if (newSpeed > target) {
            newSpeed = Math.max(target, newSpeed - 1.2);
            isBraking = true;
          } else if (newSpeed < target) {
            newSpeed = Math.min(target, newSpeed + 0.8);
          }
        } else {
          // Manual pedal input
          if (isPressingGas) {
            newSpeed = Math.min(110, newSpeed + 1.2);
          } else if (isPressingBrake) {
            newSpeed = Math.max(0, newSpeed - 2.4);
            isBraking = true;
          } else {
            // Natural road drag
            if (newSpeed > 0) {
              newSpeed = Math.max(0, newSpeed - 0.15);
            }
          }
        }

        // Distance to sign calculation
        signDistanceRef.current = Math.max(8, signDistanceRef.current - (newSpeed * 0.04));
        if (signDistanceRef.current <= 8) {
          signDistanceRef.current = 80; // loop sign approach
        }

        // Following distance fluctuates with speed
        const followingDist = Math.max(12, 50 - (newSpeed * 0.35) + Math.sin(Date.now() / 1500) * 4);
        const timeToCollision = newSpeed > 0 ? (followingDist / (newSpeed * 0.447)) : 99;

        // Safety score computation
        let penalty = 0;
        if (newSpeed > prev.speedLimit) {
          penalty += Math.min(45, (newSpeed - prev.speedLimit) * 3);
        }
        if (followingDist < 20) {
          penalty += 25;
        }
        const currentScore = Math.max(30, Math.round(100 - penalty));

        return {
          ...prev,
          speed: Math.round(newSpeed * 10) / 10,
          followingDistance: Math.round(followingDist),
          timeToCollision: Math.round(timeToCollision * 10) / 10,
          safetyScore: currentScore,
          isAutoBraking: isBraking,
          rpm: Math.round(800 + newSpeed * 35),
          gear: newSpeed === 0 ? 'P' : newSpeed < 15 ? '1' : newSpeed < 30 ? '2' : newSpeed < 45 ? '3' : newSpeed < 65 ? '4' : 'D',
          odometer: Math.round((prev.odometer + (newSpeed / 3600)) * 100) / 100
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [autoGoverning, isPressingGas, isPressingBrake, onTelemetryUpdate]);

  // Canvas 3D Road Perspective Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      // Dynamic motion offset
      roadOffsetRef.current = (roadOffsetRef.current + telemetry.speed * 0.45) % 100;

      // 1. Sky & Horizon
      const isNight = scenario.weather === 'night';
      const isRain = scenario.weather === 'rain';
      const isFog = scenario.weather === 'fog';

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.46);
      if (isNight) {
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(1, '#0f172a');
      } else if (isFog) {
        skyGrad.addColorStop(0, '#64748b');
        skyGrad.addColorStop(1, '#94a3b8');
      } else if (isRain) {
        skyGrad.addColorStop(0, '#1e293b');
        skyGrad.addColorStop(1, '#334155');
      } else {
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.7, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.46);

      // Sun / Moon
      if (isNight) {
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(width * 0.75, height * 0.18, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (!isFog && !isRain) {
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(width * 0.22, height * 0.16, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Distant terrain / skyline
      ctx.fillStyle = isNight ? '#090d16' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.46);
      for (let x = 0; x <= width; x += 40) {
        const h = Math.sin(x * 0.015) * 15 + Math.cos(x * 0.007) * 20;
        ctx.lineTo(x, height * 0.46 - h);
      }
      ctx.lineTo(width, height * 0.46);
      ctx.fill();

      // 2. Ground / Road Grass / Shoulders
      const groundGrad = ctx.createLinearGradient(0, height * 0.46, 0, height);
      groundGrad.addColorStop(0, isNight ? '#0b131f' : '#14532d');
      groundGrad.addColorStop(1, isNight ? '#020617' : '#166534');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height * 0.46, width, height * 0.54);

      // 3. Perspective Road Geometry
      const horizonY = height * 0.46;
      const roadTopWidth = width * 0.12;
      const roadBottomWidth = width * 0.78;
      const roadCenterX = width * 0.5;

      const roadTopLeft = roadCenterX - roadTopWidth / 2;
      const roadTopRight = roadCenterX + roadTopWidth / 2;
      const roadBottomLeft = roadCenterX - roadBottomWidth / 2;
      const roadBottomRight = roadCenterX + roadBottomWidth / 2;

      // Road asphalt polygon
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#1e293b');
      roadGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, height);
      ctx.lineTo(roadBottomLeft, height);
      ctx.closePath();
      ctx.fill();

      // Road shoulder rumble strips
      const stripSegments = 16;
      for (let i = 0; i < stripSegments; i++) {
        const t1 = (i + (roadOffsetRef.current % (100 / stripSegments)) / (100 / stripSegments)) / stripSegments;
        const t2 = Math.min(1, t1 + 0.04);
        if (t1 < 0 || t1 > 1) continue;

        const y1 = horizonY + (height - horizonY) * (t1 * t1);
        const y2 = horizonY + (height - horizonY) * (t2 * t2);

        const wTop = roadTopWidth + (roadBottomWidth - roadTopWidth) * t1;
        const wBot = roadTopWidth + (roadBottomWidth - roadTopWidth) * t2;

        const leftEdgeX1 = roadCenterX - wTop / 2;
        const leftEdgeX2 = roadCenterX - wBot / 2;
        const rightEdgeX1 = roadCenterX + wTop / 2;
        const rightEdgeX2 = roadCenterX + wBot / 2;

        const isWhite = i % 2 === 0;
        ctx.fillStyle = isWhite ? '#e2e8f0' : '#dc2626';

        // Left shoulder strip
        ctx.beginPath();
        ctx.moveTo(leftEdgeX1 - 10 * t1, y1);
        ctx.lineTo(leftEdgeX1, y1);
        ctx.lineTo(leftEdgeX2, y2);
        ctx.lineTo(leftEdgeX2 - 10 * t2, y2);
        ctx.fill();

        // Right shoulder strip
        ctx.beginPath();
        ctx.moveTo(rightEdgeX1, y1);
        ctx.lineTo(rightEdgeX1 + 10 * t1, y1);
        ctx.lineTo(rightEdgeX2 + 10 * t2, y2);
        ctx.lineTo(rightEdgeX2, y2);
        ctx.fill();
      }

      // 4. Center Dashed Lane Markings
      ctx.fillStyle = '#facc15'; // Amber center line
      for (let i = 0; i < 14; i++) {
        const rawT = (i + (roadOffsetRef.current % 10) / 10) / 14;
        const t = Math.pow(rawT, 2); // perspective curve
        const nextT = Math.pow(Math.min(1, rawT + 0.035), 2);

        const y1 = horizonY + (height - horizonY) * t;
        const y2 = horizonY + (height - horizonY) * nextT;
        const dashWidth = Math.max(1.5, 9 * t);

        ctx.fillRect(roadCenterX - dashWidth / 2, y1, dashWidth, y2 - y1);
      }

      // Lane Guide Line Overlays (ADAS Lane Keep Assist AR lines)
      if (hudOverlayEnabled) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        // Left lane corridor
        ctx.beginPath();
        ctx.moveTo(roadCenterX - roadTopWidth * 0.28, horizonY);
        ctx.lineTo(roadCenterX - roadBottomWidth * 0.28, height);
        ctx.stroke();

        // Right lane corridor
        ctx.beginPath();
        ctx.moveTo(roadCenterX + roadTopWidth * 0.28, horizonY);
        ctx.lineTo(roadCenterX + roadBottomWidth * 0.28, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Approaching Lead Car (Collision Hazard Target)
      const leadT = Math.max(0.2, Math.min(0.72, 1 - (telemetry.followingDistance / 75)));
      const carY = horizonY + (height - horizonY) * Math.pow(leadT, 2);
      const carScale = leadT * 1.6;
      const carWidth = 70 * carScale;
      const carHeight = 44 * carScale;
      const carX = roadCenterX - carWidth / 2 + Math.sin(Date.now() / 1200) * 10;

      // Draw Lead Vehicle
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(carX, carY - carHeight, carWidth, carHeight, 6 * carScale);
      ctx.fill();

      // Lead car windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(carX + carWidth * 0.15, carY - carHeight * 0.85, carWidth * 0.7, carHeight * 0.35);

      // Lead car taillights (flash red when braking / collision alert)
      ctx.fillStyle = isCollisionRisk ? '#ef4444' : '#dc2626';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = isCollisionRisk ? 20 : 6;
      ctx.fillRect(carX + carWidth * 0.08, carY - carHeight * 0.45, carWidth * 0.2, carHeight * 0.2);
      ctx.fillRect(carX + carWidth * 0.72, carY - carHeight * 0.45, carWidth * 0.2, carHeight * 0.2);
      ctx.shadowBlur = 0;

      // Lead Vehicle CV Bounding Box
      if (detectionBoxesEnabled) {
        ctx.strokeStyle = isCollisionRisk ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(carX - 6, carY - carHeight - 6, carWidth + 12, carHeight + 12);

        // Reticle corners
        const cornerLen = 8 * carScale;
        ctx.fillStyle = isCollisionRisk ? '#ef4444' : '#06b6d4';
        // Label pill
        const labelText = `Lead Car • ${Math.round(telemetry.followingDistance)}m • ${telemetry.timeToCollision.toFixed(1)}s TTI`;
        ctx.font = '10px monospace';
        const labelW = ctx.measureText(labelText).width + 12;
        ctx.fillStyle = isCollisionRisk ? 'rgba(239, 68, 68, 0.9)' : 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(carX - 6, carY - carHeight - 24, labelW, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, carX, carY - carHeight - 12);
      }

      // 6. Rain droplets simulation
      if (isRain) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 35; i++) {
          const rx = (Math.sin(i * 99 + Date.now() * 0.002) * 0.5 + 0.5) * width;
          const ry = ((i * 37 + Date.now() * 0.8) % height);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 16);
          ctx.stroke();
        }
      }

      // 7. Approaching Physical Traffic Sign Post
      const signDist = signDistanceRef.current;
      const signProgress = Math.max(0.1, Math.min(0.9, 1 - (signDist / 90)));
      const signY = horizonY + (height - horizonY) * Math.pow(signProgress, 1.8);
      const signX = roadCenterX + (roadTopWidth + (roadBottomWidth - roadTopWidth) * signProgress) * 0.56;
      const signSize = Math.max(22, 90 * signProgress);

      // Sign post pole
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(signX + signSize * 0.45, signY, Math.max(2, 6 * signProgress), height - signY);

      // Sign background backing plate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(signX, signY - signSize * 1.1, signSize, signSize * 1.1);

      // Speed limit rendering on canvas post
      const primeSign = activeSigns[0];
      if (primeSign) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(signX + 2, signY - signSize * 1.08, signSize - 4, signSize * 1.06);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 3 * signProgress);
        ctx.strokeRect(signX + 4, signY - signSize * 1.05, signSize - 8, signSize * 1.0);

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.max(8, signSize * 0.38)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${primeSign.value || 35}`, signX + signSize / 2, signY - signSize * 0.25);
        ctx.textAlign = 'start';
      }

      // Sign Recognition Bounding Box & AI Detection Reticle
      if (detectionBoxesEnabled && primeSign) {
        const isAlerting = isViolatingSpeed && primeSign.type === 'SPEED_LIMIT';
        const boxColor = isAlerting ? '#ef4444' : '#10b981';

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(signX - 4, signY - signSize * 1.15, signSize + 8, signSize * 1.2);

        // Confidence badge
        const badgeText = `${primeSign.name} [${(primeSign.confidence * 100).toFixed(0)}%]`;
        ctx.font = 'bold 9px monospace';
        const badgeW = ctx.measureText(badgeText).width + 10;
        ctx.fillStyle = isAlerting ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.9)';
        ctx.fillRect(signX - 4, signY - signSize * 1.15 - 18, badgeW, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(badgeText, signX, signY - signSize * 1.15 - 6);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [telemetry.speed, telemetry.followingDistance, scenario.weather, activeSigns, isViolatingSpeed, isCollisionRisk, detectionBoxesEnabled, hudOverlayEnabled]);

  // Audio warning triggers on speed violation or collision alert
  useEffect(() => {
    if (isSevereViolation) {
      AudioAlertEngine.playSpeedViolationBeep();
      AudioAlertEngine.speakVoiceAdvisory(`Speed violation. Posted limit is ${telemetry.speedLimit} miles per hour. Please decelerate.`);
    } else if (isCollisionRisk) {
      AudioAlertEngine.playCriticalHazardAlarm();
      AudioAlertEngine.speakVoiceAdvisory('Warning! Vehicle ahead approaching rapidly.');
    }
  }, [isSevereViolation, isCollisionRisk, telemetry.speedLimit]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
      {/* Top Cockpit Status Bar */}
      <div className="px-4 py-2.5 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-cyan-400 font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Vision ADAS Live
          </span>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{scenario.name}</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {scenario.roadCondition}
          </span>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDetectionBoxesEnabled(!detectionBoxesEnabled)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              detectionBoxesEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Eye className="w-3 h-3" />
            CV Boxes
          </button>
          <button
            onClick={() => setHudOverlayEnabled(!hudOverlayEnabled)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              hudOverlayEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Sliders className="w-3 h-3" />
            AR HUD
          </button>
          <button
            onClick={() => {
              setAutoGoverning(!autoGoverning);
              if (!autoGoverning) {
                AudioAlertEngine.playSignDetectedChime();
                AudioAlertEngine.speakVoiceAdvisory(`Intelligent Speed Adaptation active. Governing to ${telemetry.speedLimit} miles per hour.`);
              }
            }}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              autoGoverning ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            {autoGoverning ? 'ISA Governed' : 'Enable ISA'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport with AR Heads-Up Overlay */}
      <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] bg-black select-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Real-time AR Windshield HUD Overlay */}
        {hudOverlayEnabled && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            {/* Top Windshield Banner: Speed Limit & Active Violations */}
            <div className="flex items-start justify-between gap-3">
              {/* Active Recognized Sign floating display */}
              <div className="flex items-center gap-3 bg-slate-950/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
                <TrafficSignIcon
                  type="SPEED_LIMIT"
                  value={telemetry.speedLimit}
                  size="md"
                  isFlashing={isViolatingSpeed}
                />
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    Recognized Limit
                  </div>
                  <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
                    {telemetry.speedLimit}
                    <span className="text-xs text-slate-400 font-normal">MPH</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    99.4% Match Conf.
                  </div>
                </div>
              </div>

              {/* Speed Warning Alarm Banner (when speeding) */}
              {isViolatingSpeed && (
                <div className={`px-4 py-2 rounded-xl backdrop-blur-md border shadow-lg animate-pulse flex items-center gap-2.5 ${
                  isSevereViolation 
                    ? 'bg-rose-950/85 border-rose-500/80 text-rose-200' 
                    : 'bg-amber-950/85 border-amber-500/80 text-amber-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${isSevereViolation ? 'text-rose-400' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">
                      {isSevereViolation ? 'CRITICAL SPEED VIOLATION' : 'SPEED WARNING'}
                    </div>
                    <div className="text-[11px] font-mono">
                      Exceeding posted limit by +{speedDelta.toFixed(0)} mph
                    </div>
                  </div>
                </div>
              )}

              {/* Collision alert banner */}
              {isCollisionRisk && (
                <div className="px-4 py-2 rounded-xl bg-rose-900/90 border border-rose-500 text-white shadow-xl animate-bounce flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-300" />
                  <div className="text-xs font-black uppercase">
                    BRAKE NOW • {telemetry.timeToCollision}s TTI
                  </div>
                </div>
              )}

              {/* Weather & Road Sensor Chip */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                {scenario.weather === 'rain' && <CloudRain className="w-4 h-4 text-cyan-400" />}
                {scenario.weather === 'clear' && <Sun className="w-4 h-4 text-amber-400" />}
                {scenario.weather === 'night' && <Moon className="w-4 h-4 text-indigo-300" />}
                {scenario.weather === 'fog' && <Wind className="w-4 h-4 text-slate-400" />}
                <span className="capitalize">{scenario.weather}</span>
              </div>
            </div>

            {/* Bottom Cockpit HUD: Primary Speed Gauge & Telemetry Strip */}
            <div className="flex items-end justify-between gap-4">
              {/* Primary Speed HUD */}
              <div className="bg-slate-950/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800/80 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    CURRENT SPEED
                  </div>
                  <div className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tighter ${
                    isSevereViolation ? 'text-rose-400' : isViolatingSpeed ? 'text-amber-400' : 'text-cyan-300'
                  }`}>
                    {telemetry.speed.toFixed(0)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 -mt-1">
                    MILES / HOUR
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>

                {/* Micro RPM & Gear Indicator */}
                <div className="hidden sm:flex flex-col text-xs font-mono text-slate-300 gap-0.5">
                  <div className="flex justify-between gap-3 text-slate-400 text-[10px]">
                    <span>GEAR</span>
                    <span className="font-bold text-white">{telemetry.gear}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-400 text-[10px]">
                    <span>RPM</span>
                    <span className="font-bold text-cyan-400">{telemetry.rpm}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-400 text-[10px]">
                    <span>RADAR</span>
                    <span className="font-bold text-emerald-400">{telemetry.followingDistance}m</span>
                  </div>
                </div>
              </div>

              {/* Driver Safety Score badge */}
              <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        telemetry.safetyScore >= 80 ? 'text-emerald-400' : telemetry.safetyScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }
                      strokeDasharray={`${telemetry.safetyScore}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-white">
                    {telemetry.safetyScore}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Safety Score
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {telemetry.safetyScore >= 85 ? 'Defensive Driving' : telemetry.safetyScore >= 65 ? 'Caution Advised' : 'High Risk Profile'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Driving Cockpit Control Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Scenario Switcher Chips */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            Road Test Scenarios:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {allScenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => onScenarioChange(sc.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  scenario.id === sc.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sc.name.split(' ')[0]} ({sc.postedLimit} MPH)
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Pedals & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Brake Pedal */}
          <button
            onMouseDown={() => setIsPressingBrake(true)}
            onMouseUp={() => setIsPressingBrake(false)}
            onTouchStart={() => setIsPressingBrake(true)}
            onTouchEnd={() => setIsPressingBrake(false)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 select-none ${
              isPressingBrake || telemetry.isAutoBraking
                ? 'bg-rose-600 text-white scale-95 shadow-lg shadow-rose-600/50 ring-2 ring-rose-400'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700 border border-rose-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Brake (Hold)
          </button>

          {/* Gas / Accelerate Pedal */}
          <button
            onMouseDown={() => setIsPressingGas(true)}
            onMouseUp={() => setIsPressingGas(false)}
            onTouchStart={() => setIsPressingGas(true)}
            onTouchEnd={() => setIsPressingGas(false)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 select-none ${
              isPressingGas
                ? 'bg-cyan-500 text-slate-950 scale-95 shadow-lg shadow-cyan-500/50'
                : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-cyan-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Accelerate (Hold)
          </button>

          {/* Emergency Stop Button */}
          <button
            onClick={() => {
              onSpeedChange(0);
              AudioAlertEngine.playCriticalHazardAlarm();
              AudioAlertEngine.speakVoiceAdvisory('Emergency brake triggered. Vehicle stopped.');
            }}
            className="px-3 py-2.5 rounded-xl bg-red-950 text-red-300 hover:bg-red-900 border border-red-700/50 text-xs font-bold transition-colors"
            title="Emergency Stop"
          >
            E-STOP
          </button>
        </div>
      </div>
    </div>
  );
};
