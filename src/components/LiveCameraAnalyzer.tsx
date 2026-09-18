import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Video,
  VideoOff,
  SwitchCamera,
  ExternalLink,
  Play,
  Square,
  Loader2,
  AlertCircle,
  Car,
  Tv,
  Radio,
  Sliders,
  Settings2
} from 'lucide-react';
import { AudioAlertEngine } from '../utils/audioAlerts';
import { TrafficSignIcon } from './TrafficSignIcon';
import { SignType } from '../types';
import { VirtualDashcamGenerator } from '../utils/virtualDashcam';

interface DetectedSign {
  type: SignType;
  signName: string;
  value?: number;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  actionRequired: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface DetectedHazard {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  distanceMeters: number;
  position: string;
  recommendation: string;
}

interface LiveCameraAnalyzerProps {
  currentSpeed: number;
  onSignRecognized: (limit: number, signName: string) => void;
  onHazardTriggered: (title: string, message: string, severity: 'info' | 'warning' | 'critical') => void;
}

// Curated high-res synthetic test frame scenes
function generateSampleJpeg(id: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (id === 'school_20') {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, '#1e293b');
    sky.addColorStop(1, '#334155');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 180);

    // Roadside ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 180, 640, 180);

    // Road trapezoid
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(260, 180);
    ctx.lineTo(380, 180);
    ctx.lineTo(640, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Road edge lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(260, 180);
    ctx.lineTo(20, 360);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(380, 180);
    ctx.lineTo(620, 360);
    ctx.stroke();

    // Center dashed yellow
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(320, 180);
    ctx.lineTo(320, 360);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosswalk zebra stripes
    ctx.fillStyle = '#ffffff';
    for (let x = 160; x <= 480; x += 40) {
      ctx.fillRect(x, 280, 24, 8);
    }

    // Right post and Speed Limit 20 sign
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(450, 160, 6, 120);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(415, 60, 75, 105, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '900 11px sans-serif';
    ctx.fillText('SPEED', 452, 85);
    ctx.fillText('LIMIT', 452, 102);
    ctx.font = '900 36px sans-serif';
    ctx.fillText('20', 452, 146);

    // Left pedestrian diamond sign
    ctx.save();
    ctx.translate(160, 130);
    ctx.rotate((45 * Math.PI) / 180);
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(-22, -22, 44, 44);
    ctx.strokeRect(-22, -22, 44, 44);
    ctx.restore();

    ctx.font = '22px sans-serif';
    ctx.fillText('🚶', 160, 137);

    // Forward car
    ctx.fillStyle = '#334155';
    ctx.fillRect(290, 200, 60, 35);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(295, 222, 12, 6);
    ctx.fillRect(333, 222, 12, 6);
  } else if (id === 'stop_sign') {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, '#334155');
    sky.addColorStop(1, '#475569');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 180);

    // Intersection
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 180, 640, 180);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(240, 170);
    ctx.lineTo(400, 170);
    ctx.lineTo(640, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Solid stop bar on asphalt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(160, 275, 320, 8);

    // Stop sign post
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(470, 150, 6, 130);

    // Octagon STOP sign
    const cx = 473;
    const cy = 100;
    const r = 45;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('STOP', cx, cy + 8);
  } else if (id === 'freeway_65') {
    // Daytime blue sky
    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(1, '#38bdf8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 180);

    // Green hills and verges
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 180, 640, 180);

    // Multi-lane freeway
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(200, 180);
    ctx.lineTo(440, 180);
    ctx.lineTo(640, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Lane dividers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(280, 180);
    ctx.lineTo(160, 360);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(360, 180);
    ctx.lineTo(480, 360);
    ctx.stroke();
    ctx.setLineDash([]);

    // Speed limit 65 sign
    ctx.fillStyle = '#64748b';
    ctx.fillRect(525, 160, 6, 120);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(485, 55, 85, 110, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '900 12px sans-serif';
    ctx.fillText('SPEED', 527, 82);
    ctx.fillText('LIMIT', 527, 100);
    ctx.font = '900 40px sans-serif';
    ctx.fillText('65', 527, 148);
  } else if (id === 'work_zone_40') {
    // Overcast sky
    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, '#475569');
    sky.addColorStop(1, '#64748b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 180);

    // Road
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(260, 180);
    ctx.lineTo(380, 180);
    ctx.lineTo(640, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Center divider
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(320, 180);
    ctx.lineTo(320, 360);
    ctx.stroke();
    ctx.setLineDash([]);

    // Road work diamond sign on left
    ctx.save();
    ctx.translate(160, 130);
    ctx.rotate((45 * Math.PI) / 180);
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(-28, -28, 56, 56);
    ctx.strokeRect(-28, -28, 56, 56);
    ctx.restore();

    ctx.fillStyle = '#000000';
    ctx.font = '900 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROAD', 160, 126);
    ctx.fillText('WORK', 160, 138);

    // Work Zone 40 regulatory sign on right
    ctx.fillStyle = '#64748b';
    ctx.fillRect(485, 160, 6, 120);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(445, 60, 85, 105, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '900 11px sans-serif';
    ctx.fillText('WORK ZONE', 487, 85);
    ctx.font = '900 36px sans-serif';
    ctx.fillText('40', 487, 135);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

const SAMPLE_FRAMES = [
  {
    id: 'school_20',
    title: 'School Zone 20 MPH & Crosswalk',
    desc: 'Active flashing beacon near pedestrian walkway'
  },
  {
    id: 'stop_sign',
    title: 'Downtown 4-Way Stop Intersection',
    desc: 'Urban residential junction with red stop sign'
  },
  {
    id: 'freeway_65',
    title: 'Interstate Highway 65 MPH Limit',
    desc: 'Multi-lane freeway with clear visibility'
  },
  {
    id: 'work_zone_40',
    title: 'Work Zone 40 MPH & Road Work Ahead',
    desc: 'Highway maintenance with orange construction barrels'
  }
];

export const LiveCameraAnalyzer: React.FC<LiveCameraAnalyzerProps> = ({
  currentSpeed,
  onSignRecognized,
  onHazardTriggered
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'webcam' | 'upload'>('sample');
  const [selectedSample, setSelectedSample] = useState<string>(SAMPLE_FRAMES[0].id);
  const [cameraSource, setCameraSource] = useState<'physical' | 'virtual'>('physical');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(() => {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isMobile ? 'environment' : 'user';
  });
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [virtualScenario, setVirtualScenario] = useState<'highway' | 'school' | 'urban' | 'construction'>('highway');
  const [autoScan, setAutoScan] = useState<boolean>(false);
  const [cameraResolution, setCameraResolution] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>(() => generateSampleJpeg(SAMPLE_FRAMES[0].id));
  const [detectedSigns, setDetectedSigns] = useState<DetectedSign[]>([]);
  const [detectedHazards, setDetectedHazards] = useState<DetectedHazard[]>([]);
  const [aiProvider, setAiProvider] = useState<string>('Local ADAS Vision Model');
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const virtualGenRef = useRef<VirtualDashcamGenerator | null>(null);

  // Enumerate connected cameras
  const refreshCameras = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('Enumerate devices notice:', err);
    }
  }, [selectedCameraId]);

  useEffect(() => {
    refreshCameras();
  }, [refreshCameras]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (virtualGenRef.current) {
      virtualGenRef.current.stop();
      virtualGenRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
    setAutoScan(false);
  }, []);

  // Helper to reliably bind video stream to video DOM element
  const attachStreamToVideo = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video playback autoplay notice:', err);
      });
    }
  }, []);

  // Synchronize stream attachment when camera or tab state activates
  useEffect(() => {
    if (isCameraActive && activeTab === 'webcam') {
      attachStreamToVideo();
    }
  }, [isCameraActive, activeTab, attachStreamToVideo]);

  // Synchronize cockpit vehicle speed with Virtual Dashcam physics
  useEffect(() => {
    if (virtualGenRef.current) {
      virtualGenRef.current.setSpeed(currentSpeed);
    }
  }, [currentSpeed]);

  // Start Virtual Dashcam Live Stream
  const startVirtualCamera = useCallback(
    (scenario: 'highway' | 'school' | 'urban' | 'construction' = virtualScenario) => {
      stopCamera();
      setCameraError('');
      setIsCameraLoading(true);
      setCameraSource('virtual');
      setVirtualScenario(scenario);

      try {
        const gen = new VirtualDashcamGenerator(1280, 720);
        gen.setSpeed(currentSpeed || 55);
        gen.setScenario(scenario);
        gen.start();
        virtualGenRef.current = gen;

        const stream = gen.getStream(30);
        streamRef.current = stream;

        if (videoRef.current && stream) {
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Virtual stream play notice:', err));
        }

        setCameraResolution('1280x720 (Virtual 30 FPS)');
        setIsCameraActive(true);
        setActiveTab('webcam');
      } catch (err: any) {
        console.error('Virtual dashcam initialization error:', err);
        setCameraError('Unable to initialize Virtual Dashcam canvas stream.');
      } finally {
        setIsCameraLoading(false);
      }
    },
    [stopCamera, virtualScenario, currentSpeed]
  );

  // Start Physical Webcam / Rear Camera with progressive fallback
  const startPhysicalCamera = async (
    targetFacing: 'environment' | 'user' = facingMode,
    deviceIdOverride?: string
  ) => {
    stopCamera();
    setCameraError('');
    setIsCameraLoading(true);
    setCameraSource('physical');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera API is not supported in this browser or is blocked by iframe policy. Try opening the app in a new tab or use our Virtual Dashcam stream.'
      );
      setIsCameraLoading(false);
      setIsCameraActive(false);
      return;
    }

    const devId = deviceIdOverride !== undefined ? deviceIdOverride : selectedCameraId;

    const constraintAttempts: MediaStreamConstraints[] = [];

    if (devId) {
      constraintAttempts.push({
        video: { deviceId: { exact: devId } },
        audio: false
      });
    }

    constraintAttempts.push(
      {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: targetFacing === 'environment' ? 'user' : 'environment' }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    );

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraints of constraintAttempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err: any) {
        lastErr = err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
          break;
        }
      }
    }

    setIsCameraLoading(false);

    if (!stream) {
      let message = 'Could not access device camera.';
      if (lastErr?.name === 'NotAllowedError' || lastErr?.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser address bar/settings, or open the app in a new tab.';
      } else if (lastErr?.name === 'NotFoundError' || lastErr?.name === 'DevicesNotFoundError') {
        message = 'No hardware camera device found on this system. You can switch to our 30 FPS Simulated Dashcam Stream.';
      } else if (lastErr?.name === 'NotReadableError' || lastErr?.name === 'TrackStartError') {
        message = 'Camera is already in use by another application or tab (e.g. Zoom, Teams, Meet).';
      } else if (lastErr?.name === 'SecurityError') {
        message = 'Camera access blocked by iframe security policy. Please open this app in a new tab or use our Virtual Dashcam stream.';
      } else if (lastErr?.message) {
        message = `Camera error: ${lastErr.message}`;
      }
      setCameraError(message);
      setIsCameraActive(false);
      return;
    }

    streamRef.current = stream;
    setIsCameraActive(true);
    setActiveTab('webcam');

    // Get active video track info for display
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      if (settings.width && settings.height) {
        setCameraResolution(`${settings.width}x${settings.height}`);
      }
    }

    refreshCameras();

    // Attach immediately if video ref exists
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Physical video play notice:', err);
      });
    }
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive && cameraSource === 'physical') {
      startPhysicalCamera(nextMode);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture current frame from webcam or virtual generator
  const captureFrameFromVideo = (): string | null => {
    if (cameraSource === 'virtual' && virtualGenRef.current) {
      return virtualGenRef.current.captureFrameJpeg(0.85);
    }

    const video = videoRef.current;
    if (!video) return null;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video frame not ready yet (readyState:', video.readyState, ')');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Auto-scan timer when camera active and autoScan enabled
  useEffect(() => {
    if (!isCameraActive || activeTab !== 'webcam' || !autoScan) return;

    const interval = setInterval(() => {
      if (!isAnalyzing) {
        if (cameraSource === 'virtual' || (videoRef.current && videoRef.current.readyState >= 2)) {
          runDetection();
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isCameraActive, activeTab, autoScan, isAnalyzing, cameraSource]);

  // Perform AI Recognition Analysis (calls server `/api/analyze-dashcam`)
  const runDetection = async (imageSrcToUse?: string) => {
    setIsAnalyzing(true);
    let imageToAnalyze = imageSrcToUse || previewImage;

    if (activeTab === 'webcam' && isCameraActive) {
      const captured = captureFrameFromVideo();
      if (captured) {
        imageToAnalyze = captured;
        setPreviewImage(captured);
      }
    }

    try {
      const res = await fetch('/api/analyze-dashcam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageToAnalyze,
          currentSpeed: currentSpeed
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        const signs: DetectedSign[] = data.analysis.detectedSigns || [];
        const rawHazards: DetectedHazard[] = data.analysis.hazards || [];
        const hazards: DetectedHazard[] = rawHazards.map((hz, idx) => ({
          ...hz,
          id: hz.id ? `${hz.id}-${idx}` : `hz-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
        }));

        setDetectedSigns(signs);
        setDetectedHazards(hazards);
        setAiProvider(data.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash Vision' : 'Edge CV Neural Network');
        setLastAnalysisTime(new Date().toLocaleTimeString());

        // Audio & Telemetry Feedback
        AudioAlertEngine.playSignDetectedChime();

        // If speed sign found, notify parent
        const speedSign = signs.find(s => s.type === 'SPEED_LIMIT' || s.value);
        if (speedSign && speedSign.value) {
          onSignRecognized(speedSign.value, speedSign.signName);

          if (currentSpeed > speedSign.value) {
            onHazardTriggered(
              'Speed Limit Violation Detected',
              `Vehicle speed (${currentSpeed} MPH) exceeds recognized ${speedSign.signName}. Please decelerate immediately.`,
              'critical'
            );
          }
        }

        // Check for urgent hazards
        hazards.forEach((hz) => {
          if (hz.severity === 'critical' || hz.severity === 'warning') {
            onHazardTriggered(
              `Road Hazard: ${hz.type.replace('_', ' ')}`,
              `${hz.recommendation} (Position: ${hz.position}, ~${hz.distanceMeters}m ahead)`,
              hz.severity
            );
          }
        });

        if (data.analysis.voiceAdvisory) {
          AudioAlertEngine.speakVoiceAdvisory(data.analysis.voiceAdvisory);
        }
      }
    } catch (err) {
      console.error('Recognition error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initial trigger for default sample
  useEffect(() => {
    const defaultJpeg = generateSampleJpeg(SAMPLE_FRAMES[0].id);
    setPreviewImage(defaultJpeg);
    runDetection(defaultJpeg);
  }, []);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);
      setActiveTab('upload');
      stopCamera();
      runDetection(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* Header with status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white tracking-tight">
              Live Camera & Dashcam Video Analyzer
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Vision Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical sign recognition & roadway obstacle classification
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => runDetection()}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-cyan-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing Frame...' : 'Scan / Re-Analyze'}
          </button>
        </div>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('sample');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'sample' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Road Test Datasets
          </button>
          <button
            onClick={() => {
              setActiveTab('webcam');
              if (!isCameraActive) {
                // If physical had error previously or user prefers virtual, default to virtual, else physical
                if (cameraError) {
                  startVirtualCamera();
                } else {
                  startPhysicalCamera();
                }
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'webcam' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            Live Camera / Dashcam Stream
          </button>
          <label className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            activeTab === 'upload' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}>
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Upload Photo/Frame
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {lastAnalysisTime && (
          <span className="text-[11px] font-mono text-slate-400">
            Engine: <span className="text-cyan-400">{aiProvider}</span> • {lastAnalysisTime}
          </span>
        )}
      </div>

      {/* Sub-mode selector and controls for Live Camera Tab */}
      {activeTab === 'webcam' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Video Feed Source:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onClick={() => {
                  startPhysicalCamera();
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  cameraSource === 'physical' && isCameraActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Physical Webcam / Phone
              </button>
              <button
                onClick={() => {
                  startVirtualCamera();
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  cameraSource === 'virtual' && isCameraActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                Simulated Dashcam (30 FPS)
              </button>
            </div>
          </div>

          {/* Source specific controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {cameraSource === 'physical' && availableCameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startPhysicalCamera(facingMode, e.target.value);
                }}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-cyan-500"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            {cameraSource === 'virtual' && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[11px] mr-1">Scenario:</span>
                {(['highway', 'school', 'urban', 'construction'] as const).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => {
                      setVirtualScenario(sc);
                      if (virtualGenRef.current) {
                        virtualGenRef.current.setScenario(sc);
                      }
                      if (!isCameraActive) {
                        startVirtualCamera(sc);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase transition-colors ${
                      virtualScenario === sc
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            )}

            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full-page window for direct hardware camera access without iframe restrictions"
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              <span>Full Tab</span>
            </a>
          </div>
        </div>
      )}

      {/* Sample presets if on sample tab */}
      {activeTab === 'sample' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_FRAMES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                setSelectedSample(sample.id);
                const jpeg = generateSampleJpeg(sample.id);
                setPreviewImage(jpeg);
                runDetection(jpeg);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedSample === sample.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-200 truncate">{sample.title}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{sample.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Diagnostic & Recovery Banner when physical camera encounters issues */}
      {cameraError && activeTab === 'webcam' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-950 border border-rose-800/80 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5 max-w-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-100 flex items-center gap-2">
                <span>Device Camera Notice</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-900/60 border border-rose-700 text-rose-300">
                  Iframe / Hardware Policy
                </span>
              </div>
              <div className="text-rose-300 mt-1 leading-relaxed">{cameraError}</div>
              <div className="text-slate-400 mt-1 text-[11px]">
                Tip: If your browser blocks camera inside preview iframes, use our <strong>Simulated Dashcam Stream</strong> or click <strong>Open in New Tab</strong> to run in top-level window.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => startVirtualCamera()}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Car className="w-4 h-4" />
              Switch to Simulated Dashcam
            </button>
            <button
              onClick={() => startPhysicalCamera()}
              className="px-3 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-medium text-xs transition-colors"
            >
              Retry Camera
            </button>
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center gap-1 border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </a>
          </div>
        </div>
      )}

      {/* Live Camera Action Strip when streaming */}
      {activeTab === 'webcam' && isCameraActive && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200 font-medium">
              Feed Active: <strong className="text-cyan-300">{cameraSource === 'virtual' ? 'Simulated 30 FPS Road' : facingMode === 'environment' ? 'Rear Dashcam' : 'Front Webcam'}</strong>
            </span>
            {cameraResolution && (
              <span className="text-slate-400 font-mono text-[11px] bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                {cameraResolution}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => runDetection()}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Scan Current View
            </button>

            {cameraSource === 'physical' && (
              <button
                onClick={handleToggleFacingMode}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                Flip (Front/Rear)
              </button>
            )}

            <button
              onClick={() => setAutoScan(!autoScan)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${
                autoScan
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoScan ? 'animate-spin text-cyan-400' : ''}`} />
              Auto-Scan (3s): {autoScan ? 'Active' : 'Paused'}
            </button>
            <button
              onClick={stopCamera}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 transition-colors flex items-center gap-1"
            >
              <Square className="w-3.5 h-3.5" />
              Stop Feed
            </button>
          </div>
        </div>
      )}

      {/* Viewport Area: Image or Live Video Stream with Bounding Box Overlay */}
      <div className="relative w-full h-64 sm:h-96 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Persistent Video Element to guarantee immediate srcObject binding */}
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el) {
              el.muted = true;
              el.defaultMuted = true;
              if (streamRef.current && el.srcObject !== streamRef.current) {
                el.srcObject = streamRef.current;
                el.play().catch(() => {});
              }
            }
          }}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${activeTab === 'webcam' && isCameraActive ? 'block' : 'hidden'}`}
          onLoadedMetadata={() => {
            videoRef.current?.play().catch(() => {});
          }}
        />

        {/* Live Camera Standby Screen when feed is not running */}
        {activeTab === 'webcam' && !isCameraActive && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/40">
              <Camera className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-bold text-slate-100">Live Camera & Roadway Video Feed</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect your device camera for real-world driving assistance, or launch our real-time simulated 30 FPS dashcam road stream.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              <button
                onClick={() => startPhysicalCamera()}
                disabled={isCameraLoading}
                className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group flex flex-col justify-between disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-cyan-400 mb-2">
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono text-slate-400">Webcam / Phone</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Device Hardware Camera</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Use your front webcam or smartphone rear camera</div>
                </div>
              </button>

              <button
                onClick={() => startVirtualCamera()}
                disabled={isCameraLoading}
                className="p-3.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/50 text-left transition-all group flex flex-col justify-between shadow-lg shadow-cyan-950/30 disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-cyan-300 mb-2">
                  <Car className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">Recommended</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-100">Simulated Dashcam Stream</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Live 30 FPS animated road with passing signs & hazards</div>
                </div>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap justify-center mt-1">
              <span>If preview iframe blocks hardware camera:</span>
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-0.5 font-medium ml-1"
              >
                Open in dedicated new tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Static Frame or Upload Image Display when not on active webcam */}
        {activeTab !== 'webcam' && (
          previewImage ? (
            <img
              src={previewImage}
              alt="Dashcam Stream View"
              className="w-full h-full object-contain bg-slate-950"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-slate-500 text-xs font-mono">
              <span>Awaiting camera feed or sample image...</span>
            </div>
          )
        )}

        {/* Live Camera Overlays when Active */}
        {activeTab === 'webcam' && isCameraActive && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-rose-500 -ml-4"></span>
              <span className="text-[11px] font-mono font-bold text-rose-400 tracking-wider">LIVE FEED</span>
              <span className="text-[10px] font-mono text-slate-300 border-l border-slate-700 pl-1.5 ml-0.5">
                {cameraSource === 'virtual' ? 'VIRTUAL DASHCAM' : 'HARDWARE CAM'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              {cameraSource === 'physical' && (
                <button
                  onClick={handleToggleFacingMode}
                  title="Flip Camera (Front/Rear)"
                  className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setAutoScan(!autoScan)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border ${
                  autoScan
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoScan ? 'animate-spin text-cyan-400' : ''}`} />
                Auto-Scan {autoScan ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={stopCamera}
                title="Stop Camera Feed"
                className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Bounding Box Visualizer for Detected Signs */}
        {detectedSigns.map((sign, idx) => {
          const isSpeedViolated = sign.type === 'SPEED_LIMIT' && sign.value && currentSpeed > sign.value;
          const boxColor = isSpeedViolated ? 'border-rose-500 bg-rose-500/10' : 'border-emerald-400 bg-emerald-500/10';

          return (
            <div
              key={idx}
              className={`absolute border-2 rounded transition-all pointer-events-none ${boxColor}`}
              style={{
                left: `${sign.box.x}%`,
                top: `${sign.box.y}%`,
                width: `${sign.box.width}%`,
                height: `${sign.box.height}%`,
              }}
            >
              <div className={`absolute -top-6 left-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md ${
                isSpeedViolated ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {sign.signName} [{(sign.confidence * 100).toFixed(0)}%]
              </div>
            </div>
          );
        })}

        {/* Scanning Reticle Animation during analysis */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-2 text-xs font-mono font-bold text-cyan-300 tracking-wider">
              RUNNING VISION OCR & OBJECT DETECTION...
            </span>
          </div>
        )}
      </div>

      {/* Detection Results & Safety Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Identified Traffic Signs Card */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-xs font-mono uppercase text-slate-400 mb-2 flex items-center justify-between">
            <span>Recognized Traffic Signs ({detectedSigns.length})</span>
            <span className="text-emerald-400 font-semibold">Active Classification</span>
          </div>

          <div className="flex flex-col gap-2">
            {detectedSigns.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                No signs recognized in current frame. Click &quot;Scan / Re-Analyze&quot;.
              </div>
            ) : (
              detectedSigns.map((sign, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <TrafficSignIcon type={sign.type} value={sign.value} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white">{sign.signName}</div>
                      <div className="text-[10px] text-slate-400">{sign.description}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                      {(sign.confidence * 100).toFixed(1)}% Conf
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Action: {sign.actionRequired}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detected Road Hazards & Safety Advisories */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-xs font-mono uppercase text-slate-400 mb-2 flex items-center justify-between">
            <span>Detected Hazards ({detectedHazards.length})</span>
            <span className="text-amber-400 font-semibold">Defensive Guidance</span>
          </div>

          <div className="flex flex-col gap-2">
            {detectedHazards.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                No acute road hazards or collisions detected.
              </div>
            ) : (
              detectedHazards.map((hz, idx) => (
                <div key={`${hz.id}-${idx}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                  <div className={`p-1 rounded mt-0.5 ${
                    hz.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {hz.severity === 'critical' ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{hz.type.replace('_', ' ')}</span>
                      <span className="text-[10px] font-mono text-slate-400">~{hz.distanceMeters}m ahead</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{hz.recommendation}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
