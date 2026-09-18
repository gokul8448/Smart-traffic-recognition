import React, { useState, useEffect, useCallback } from 'react';
import { RoadScenario, TrafficSign, VehicleTelemetry, HazardAlert, SignType } from './types';
import { ROAD_SCENARIOS } from './data/scenarios';
import { RoadSimulator } from './components/RoadSimulator';
import { TelemetryHUD } from './components/TelemetryHUD';
import { AlertsFeed } from './components/AlertsFeed';
import { LiveCameraAnalyzer } from './components/LiveCameraAnalyzer';
import { SignCatalog } from './components/SignCatalog';
import { SafetyAnalytics } from './components/SafetyAnalytics';
import { AudioAlertEngine } from './utils/audioAlerts';
import { 
  Shield, 
  Activity, 
  Video, 
  BookOpen, 
  BarChart3, 
  AlertTriangle, 
  Sliders, 
  Compass, 
  Layers, 
  Car,
  BellRing,
  Volume2
} from 'lucide-react';

// Monotonic counter & random entropy to ensure globally unique keys across rapid events
let alertIdCounter = 0;
const generateUniqueId = (prefix: string) => {
  alertIdCounter += 1;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${alertIdCounter}-${rand}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'camera_analyzer' | 'catalog' | 'analytics'>('cockpit');
  const [currentScenario, setCurrentScenario] = useState<RoadScenario>(ROAD_SCENARIOS[0]);
  const [activeSigns, setActiveSigns] = useState<TrafficSign[]>(ROAD_SCENARIOS[0].signs);

  // Vehicle Telemetry State
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    speed: ROAD_SCENARIOS[0].defaultSpeed,
    speedLimit: ROAD_SCENARIOS[0].postedLimit,
    targetSpeed: ROAD_SCENARIOS[0].postedLimit,
    rpm: 1450,
    gear: '3',
    throttle: 35,
    brake: 0,
    cruiseControl: false,
    laneOffset: 0.02,
    followingDistance: 38,
    timeToCollision: 3.4,
    safetyScore: 88,
    totalViolations: 0,
    odometer: 14.2,
    roadCondition: ROAD_SCENARIOS[0].roadCondition,
    isAutoBraking: false,
    driverAlertness: 'Optimal'
  });

  // Real-time Hazard and Speed Violation Alerts Feed
  const [alerts, setAlerts] = useState<HazardAlert[]>([
    {
      id: 'init-alert-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'SPEED_VIOLATION',
      title: 'Speed Limit Exceeded in School Zone',
      message: 'Vehicle speed (28 MPH) exceeds detected 20 MPH school zone speed limit. Decelerate to avoid municipal citation.',
      severity: 'warning',
      currentSpeed: 28,
      speedLimit: 20,
      deltaMph: 8
    },
    {
      id: 'init-alert-2',
      timestamp: new Date(Date.now() - 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'PEDESTRIAN_HAZARD',
      title: 'Pedestrian Crosswalk Ahead',
      message: 'Active crosswalk recognized 78 meters ahead. Pedestrian right-of-way alert primed.',
      severity: 'info',
      currentSpeed: 28,
      speedLimit: 20
    }
  ]);

  // Last alerted speed violation tracking to prevent duplicate continuous alerts
  const [lastViolationTime, setLastViolationTime] = useState<number>(0);

  // Monitor speed limit violations in real-time
  useEffect(() => {
    const delta = telemetry.speed - telemetry.speedLimit;
    const now = Date.now();

    // If speeding and at least 6 seconds have passed since last alert
    if (delta >= 4 && now - lastViolationTime > 6000) {
      setLastViolationTime(now);
      const isSevere = delta >= 10;

      const newAlert: HazardAlert = {
        id: generateUniqueId('alert'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'SPEED_VIOLATION',
        title: isSevere ? 'CRITICAL SPEED VIOLATION' : 'Speed Limit Exceeded',
        message: `Current speed is ${Math.round(telemetry.speed)} MPH in a recognized ${telemetry.speedLimit} MPH zone (+${Math.round(delta)} MPH over limit).`,
        severity: isSevere ? 'critical' : 'warning',
        currentSpeed: Math.round(telemetry.speed),
        speedLimit: telemetry.speedLimit,
        deltaMph: Math.round(delta)
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      setTelemetry(prev => ({ ...prev, totalViolations: prev.totalViolations + 1 }));

      if (isSevere) {
        AudioAlertEngine.playSpeedViolationBeep();
      }
    }
  }, [telemetry.speed, telemetry.speedLimit, lastViolationTime]);

  // Scenario switch handler
  const handleScenarioChange = (scenarioId: string) => {
    const sc = ROAD_SCENARIOS.find(s => s.id === scenarioId);
    if (!sc) return;
    setCurrentScenario(sc);
    setActiveSigns(sc.signs);
    setTelemetry(prev => ({
      ...prev,
      speed: sc.defaultSpeed,
      speedLimit: sc.postedLimit,
      targetSpeed: sc.postedLimit,
      roadCondition: sc.roadCondition
    }));

    AudioAlertEngine.playSignDetectedChime();
    AudioAlertEngine.speakVoiceAdvisory(`Switched to ${sc.name}. Posted limit is ${sc.postedLimit} miles per hour.`);

    // Add alert for scenario change
    setAlerts(prev => [
      {
        id: generateUniqueId('sc'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'WEATHER_HAZARD',
        title: `Entered: ${sc.name}`,
        message: `Road condition: ${sc.roadCondition}. Posted speed limit: ${sc.postedLimit} MPH. ${sc.hazardDescription}.`,
        severity: 'info',
        currentSpeed: sc.defaultSpeed,
        speedLimit: sc.postedLimit
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Speed adjust helper
  const handleSpeedChange = (speed: number) => {
    setTelemetry(prev => ({ ...prev, speed }));
  };

  // Dismiss alert
  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  // Clear all alerts
  const handleClearAlerts = () => {
    setAlerts([]);
  };

  // Apply speed compliance (snap speed to limit)
  const handleApplySpeedCompliance = (targetLimit: number) => {
    setTelemetry(prev => ({ ...prev, speed: targetLimit, isAutoBraking: true }));
    AudioAlertEngine.playSignDetectedChime();
    AudioAlertEngine.speakVoiceAdvisory(`Speed reduced to match posted ${targetLimit} miles per hour limit.`);
  };

  // Callback from Camera Analyzer when sign recognized
  const handleSignRecognized = (limit: number, signName: string) => {
    setTelemetry(prev => ({ ...prev, speedLimit: limit }));
    setActiveSigns(prev => [
      {
        id: generateUniqueId('rec'),
        type: 'SPEED_LIMIT',
        name: signName,
        value: limit,
        confidence: 0.96,
        distanceAhead: 50,
        actionRequired: 'UPDATE_LIMIT',
        urgency: 'medium',
        category: 'Regulatory',
        description: `Recognized from forward optical stream: ${signName}`
      },
      ...prev.slice(0, 3)
    ]);
  };

  // Callback from Camera Analyzer when hazard triggered
  const handleHazardTriggered = (title: string, message: string, severity: 'info' | 'warning' | 'critical') => {
    const newAlert: HazardAlert = {
      id: generateUniqueId('hz'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'COLLISION_WARNING',
      title,
      message,
      severity,
      currentSpeed: Math.round(telemetry.speed),
      speedLimit: telemetry.speedLimit
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
  };

  // Inject sign from Catalog
  const handleInjectCatalogSign = (type: SignType, value?: number, name?: string) => {
    const newSign: TrafficSign = {
      id: generateUniqueId('inj'),
      type,
      name: name || `${type} Sign`,
      value,
      confidence: 0.99,
      distanceAhead: 60,
      actionRequired: value ? `ADAPT_TO_${value}` : 'FOLLOW_INSTRUCTION',
      urgency: 'high',
      category: 'Regulatory',
      description: `User injected ${name || type} sign into active simulator environment.`
    };

    setActiveSigns([newSign, ...activeSigns.slice(0, 2)]);
    if (value) {
      setTelemetry(prev => ({ ...prev, speedLimit: value }));
    }

    AudioAlertEngine.playSignDetectedChime();
    AudioAlertEngine.speakVoiceAdvisory(`Recognized sign: ${name || type}`);

    setAlerts(prev => [
      {
        id: 'inj-alert-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: type === 'SPEED_LIMIT' ? 'SPEED_VIOLATION' : 'WORK_ZONE',
        title: `Sign Recognized: ${name}`,
        message: `Optical detection recognized ${name}. Automated response protocol initiated.`,
        severity: 'info',
        currentSpeed: Math.round(telemetry.speed),
        speedLimit: value || telemetry.speedLimit
      },
      ...prev.slice(0, 19)
    ]);
  };

  const isSpeeding = telemetry.speed > telemetry.speedLimit;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  SafeDrive ADAS
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  v3.4 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 -mt-0.5">
                Smart Traffic Sign Recognition & Road Safety Assistance
              </p>
            </div>
          </div>

          {/* Real-time Status Badges & Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Real-time Speeding Warning Capsule */}
            {isSpeeding && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-300 text-xs font-mono font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>+{(telemetry.speed - telemetry.speedLimit).toFixed(0)} MPH OVERSPEED</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('cockpit')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'cockpit'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                Cockpit & Alerts
              </button>

              <button
                onClick={() => setActiveTab('camera_analyzer')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'camera_analyzer'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Camera Analyzer
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'catalog'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Sign Taxonomy
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Driver Scorecard
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* TAB 1: COCKPIT & LIVE ALERT FEED (PRIMARY DASHBOARD) */}
        {activeTab === 'cockpit' && (
          <div className="flex flex-col gap-6">
            {/* Interactive 3D Road Simulator */}
            <RoadSimulator
              scenario={currentScenario}
              telemetry={telemetry}
              activeSigns={activeSigns}
              onSpeedChange={handleSpeedChange}
              onTelemetryUpdate={setTelemetry}
              onScenarioChange={handleScenarioChange}
              allScenarios={ROAD_SCENARIOS}
            />

            {/* Middle Row: Vehicle Cockpit Telemetry HUD */}
            <TelemetryHUD
              telemetry={telemetry}
              onSetSpeed={handleSpeedChange}
            />

            {/* Bottom Row: Real-time Alerts Feed for Detected Traffic Hazards & Speed Limit Violations */}
            <AlertsFeed
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
              onClearAll={handleClearAlerts}
              onApplySpeedCompliance={handleApplySpeedCompliance}
            />
          </div>
        )}

        {/* TAB 2: LIVE CAMERA & DASHCAM VIDEO ANALYZER */}
        {activeTab === 'camera_analyzer' && (
          <div className="flex flex-col gap-6">
            <LiveCameraAnalyzer
              currentSpeed={telemetry.speed}
              onSignRecognized={handleSignRecognized}
              onHazardTriggered={handleHazardTriggered}
            />

            <AlertsFeed
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
              onClearAll={handleClearAlerts}
              onApplySpeedCompliance={handleApplySpeedCompliance}
            />
          </div>
        )}

        {/* TAB 3: SIGN CATALOG & BENCHMARKS */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-6">
            <SignCatalog onInjectSign={handleInjectCatalogSign} />
            <TelemetryHUD telemetry={telemetry} onSetSpeed={handleSpeedChange} />
          </div>
        )}

        {/* TAB 4: ROAD SAFETY ANALYTICS & DRIVER SCORECARD */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <SafetyAnalytics telemetry={telemetry} alerts={alerts} />
            <AlertsFeed
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
              onClearAll={handleClearAlerts}
              onApplySpeedCompliance={handleApplySpeedCompliance}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" />
            <span>Smart Traffic Sign Recognition & Road Safety Assistance Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>MUTCD & UNECE Regulation Compliant</span>
            <span>•</span>
            <span>Intelligent Speed Adaptation (ISA) Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
