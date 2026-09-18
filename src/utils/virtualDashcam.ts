/**
 * Virtual Dashcam Live Stream Engine
 * Generates an interactive 30 FPS simulated dashcam driving video stream
 * with animated perspective road, approaching traffic signs, passing vehicles,
 * and road hazards. Provides a seamless MediaStream for browsers with no camera
 * or restricted iframe policies.
 */

export interface VirtualRoadState {
  scenario: 'highway' | 'school' | 'urban' | 'construction';
  speed: number;
  timeOfDay: 'day' | 'dusk' | 'night';
}

export class VirtualDashcamGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private distanceTraveled: number = 0;
  private currentSignIndex: number = 0;
  private signDistance: number = 80; // Distance in arbitrary depth units
  private carDistance: number = 55;
  private scenario: 'highway' | 'school' | 'urban' | 'construction' = 'highway';
  private speed: number = 55;

  private signsPool = [
    { type: 'SPEED_LIMIT', value: 65, text: '65', label: 'SPEED LIMIT 65' },
    { type: 'SPEED_LIMIT', value: 45, text: '45', label: 'SPEED LIMIT 45' },
    { type: 'STOP', value: undefined, text: 'STOP', label: 'STOP' },
    { type: 'SCHOOL_ZONE', value: 20, text: '20', label: 'SCHOOL SPEED LIMIT 20' },
    { type: 'SPEED_LIMIT', value: 55, text: '55', label: 'SPEED LIMIT 55' },
    { type: 'WORK_ZONE', value: 40, text: '40', label: 'ROAD WORK 40 MPH' },
    { type: 'YIELD', value: undefined, text: 'YIELD', label: 'YIELD' }
  ];

  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not supported');
    this.ctx = ctx;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getStream(fps = 30): MediaStream | null {
    if (typeof this.canvas.captureStream === 'function') {
      try {
        return this.canvas.captureStream(fps);
      } catch (e) {
        console.warn('captureStream failed:', e);
      }
    }
    return null;
  }

  public setSpeed(newSpeed: number) {
    this.speed = Math.max(10, Math.min(120, newSpeed));
  }

  public setScenario(sc: 'highway' | 'school' | 'urban' | 'construction') {
    this.scenario = sc;
    this.signDistance = 80;
    if (sc === 'school') {
      this.currentSignIndex = 3; // School 20
    } else if (sc === 'urban') {
      this.currentSignIndex = 2; // Stop
    } else if (sc === 'construction') {
      this.currentSignIndex = 5; // Work zone
    } else {
      this.currentSignIndex = 0; // Highway 65
    }
  }

  public start(onFrameRendered?: () => void) {
    if (this.animId !== null) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update distance based on vehicle speed
      const speedFactor = (this.speed / 50) * 25 * dt;
      this.distanceTraveled += speedFactor;

      // Move sign closer
      this.signDistance -= speedFactor;
      if (this.signDistance < -10) {
        this.signDistance = 90;
        this.currentSignIndex = (this.currentSignIndex + 1) % this.signsPool.length;
      }

      // Move forward car
      this.carDistance -= (speedFactor * 0.3);
      if (this.carDistance < 15) {
        this.carDistance = 75;
      }

      this.render();
      if (onFrameRendered) onFrameRendered();

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public render() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const horizonY = h * 0.5;

    ctx.clearRect(0, 0, w, h);

    // 1. Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (this.scenario === 'urban') {
      sky.addColorStop(0, '#1e293b');
      sky.addColorStop(1, '#475569');
    } else if (this.scenario === 'construction') {
      sky.addColorStop(0, '#182335');
      sky.addColorStop(1, '#3b4252');
    } else {
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizonY);

    // Distant mountain silhouette / city skyline
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= w; x += 40) {
      const peak = Math.sin(x * 0.015) * 20 + Math.cos(x * 0.03) * 12;
      ctx.lineTo(x, horizonY - 15 - peak);
    }
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // 2. Roadside Ground (Shoulders)
    const ground = ctx.createLinearGradient(0, horizonY, 0, h);
    ground.addColorStop(0, '#0f172a');
    ground.addColorStop(1, '#050811');
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // 3. Road Surface Perspective Trapezoid
    const roadTopWidth = w * 0.18;
    const roadBottomWidth = w * 0.88;
    const roadTopLeft = (w - roadTopWidth) / 2;
    const roadTopRight = roadTopLeft + roadTopWidth;
    const roadBottomLeft = (w - roadBottomWidth) / 2;
    const roadBottomRight = roadBottomLeft + roadBottomWidth;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(roadTopLeft, horizonY);
    ctx.lineTo(roadTopRight, horizonY);
    ctx.lineTo(roadBottomRight, h);
    ctx.lineTo(roadBottomLeft, h);
    ctx.closePath();
    ctx.fill();

    // Road Edge Lines (Solid White)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(roadTopLeft, horizonY);
    ctx.lineTo(roadBottomLeft, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(roadTopRight, horizonY);
    ctx.lineTo(roadBottomRight, h);
    ctx.stroke();

    // 4. Center Dashed Yellow Lines (moving forward with vehicle speed)
    const dashOffset = (this.distanceTraveled * 40) % 80;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.beginPath();

    const roadCenterX = w / 2;
    const numDashes = 12;
    for (let i = 0; i < numDashes; i++) {
      const p1 = (i * 80 + dashOffset) / (numDashes * 80);
      const p2 = (i * 80 + 40 + dashOffset) / (numDashes * 80);

      if (p1 >= 0 && p1 <= 1) {
        // Quadratic perspective mapping
        const y1 = horizonY + Math.pow(p1, 2) * (h - horizonY);
        const y2 = horizonY + Math.pow(Math.min(p2, 1), 2) * (h - horizonY);
        ctx.moveTo(roadCenterX, y1);
        ctx.lineTo(roadCenterX, y2);
      }
    }
    ctx.stroke();

    // 5. Approaching Traffic Sign on the Right Shoulder
    const currentSign = this.signsPool[this.currentSignIndex];
    if (this.signDistance > 0 && this.signDistance < 90) {
      // Perspective interpolation
      const t = 1 - (this.signDistance / 90); // 0 at distance, 1 near
      const signScale = Math.pow(t, 2.2); // grows larger non-linearly

      if (signScale > 0.05) {
        // Sign position on right shoulder
        const signX = (w * 0.5) + (roadTopWidth * 0.6) + t * (w * 0.35);
        const signY = horizonY + (t * (h - horizonY) * 0.7) - (signScale * 140);
        const signW = Math.max(30, signScale * 180);
        const signH = Math.max(40, signScale * 240);

        // Sign Post
        ctx.fillStyle = '#64748b';
        const postW = Math.max(4, signScale * 14);
        ctx.fillRect(signX + (signW / 2) - (postW / 2), signY + signH, postW, (h * 0.95) - (signY + signH));

        // Draw Specific Sign Type
        if (currentSign.type === 'STOP') {
          // Octagon STOP
          const size = signW;
          const cx = signX + size / 2;
          const cy = signY + size / 2;
          const r = size / 2;

          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2, signScale * 8);
          ctx.beginPath();
          for (let a = 0; a < 8; a++) {
            const angle = (a * Math.PI) / 4 + Math.PI / 8;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `900 ${Math.max(12, signScale * 52)}px sans-serif`;
          ctx.fillText('STOP', cx, cy);
        } else if (currentSign.type === 'YIELD') {
          // Inverted triangle
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(signX, signY);
          ctx.lineTo(signX + signW, signY);
          ctx.lineTo(signX + signW / 2, signY + signH);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          const innerPadding = Math.max(4, signScale * 16);
          ctx.beginPath();
          ctx.moveTo(signX + innerPadding, signY + innerPadding * 0.5);
          ctx.lineTo(signX + signW - innerPadding, signY + innerPadding * 0.5);
          ctx.lineTo(signX + signW / 2, signY + signH - innerPadding);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#dc2626';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `900 ${Math.max(10, signScale * 36)}px sans-serif`;
          ctx.fillText('YIELD', signX + signW / 2, signY + signH * 0.38);
        } else if (currentSign.type === 'WORK_ZONE') {
          // Orange Diamond
          const cx = signX + signW / 2;
          const cy = signY + signH / 2;
          const r = signW * 0.65;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((45 * Math.PI) / 180);
          ctx.fillStyle = '#ea580c';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(2, signScale * 6);
          ctx.fillRect(-r / 2, -r / 2, r, r);
          ctx.strokeRect(-r / 2, -r / 2, r, r);
          ctx.restore();

          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `900 ${Math.max(9, signScale * 30)}px sans-serif`;
          ctx.fillText('ROAD', cx, cy - signScale * 26);
          ctx.fillText('WORK', cx, cy);
          ctx.font = `900 ${Math.max(10, signScale * 36)}px sans-serif`;
          ctx.fillText('40', cx, cy + signScale * 30);
        } else {
          // Standard Rectangular Speed Limit Sign
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = Math.max(3, signScale * 9);
          ctx.beginPath();
          ctx.roundRect(signX, signY, signW, signH, Math.max(4, signScale * 12));
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (currentSign.type === 'SCHOOL_ZONE') {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(signX + 3, signY + 3, signW - 6, signH * 0.28);
            ctx.fillStyle = '#000000';
            ctx.font = `900 ${Math.max(8, signScale * 24)}px sans-serif`;
            ctx.fillText('SCHOOL', signX + signW / 2, signY + signH * 0.14);

            ctx.font = `800 ${Math.max(8, signScale * 22)}px sans-serif`;
            ctx.fillText('SPEED', signX + signW / 2, signY + signH * 0.38);
            ctx.fillText('LIMIT', signX + signW / 2, signY + signH * 0.52);

            ctx.font = `900 ${Math.max(14, signScale * 72)}px sans-serif`;
            ctx.fillText('20', signX + signW / 2, signY + signH * 0.78);
          } else {
            ctx.font = `800 ${Math.max(8, signScale * 24)}px sans-serif`;
            ctx.fillText('SPEED', signX + signW / 2, signY + signH * 0.22);
            ctx.fillText('LIMIT', signX + signW / 2, signY + signH * 0.38);

            ctx.font = `900 ${Math.max(16, signScale * 82)}px sans-serif`;
            ctx.fillText(currentSign.text, signX + signW / 2, signY + signH * 0.72);
          }
        }
      }
    }

    // 6. Lead Vehicle Ahead in Center Lane (Collision avoidance test target)
    if (this.carDistance > 10 && this.carDistance < 80) {
      const ct = 1 - (this.carDistance / 80);
      const carScale = Math.pow(ct, 2);
      if (carScale > 0.08) {
        const carW = Math.max(30, carScale * 220);
        const carH = Math.max(20, carScale * 130);
        const carX = roadCenterX - (carW / 2);
        const carY = horizonY + (ct * (h - horizonY) * 0.75) - carH;

        // Vehicle body
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(carX, carY, carW, carH, Math.max(3, carScale * 12));
        ctx.fill();

        // Rear window
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(carX + carW * 0.15, carY + carH * 0.1, carW * 0.7, carH * 0.35, 4);
        ctx.fill();

        // Glowing Brake Taillights
        ctx.fillStyle = '#ef4444';
        const lightW = carW * 0.2;
        const lightH = carH * 0.2;
        ctx.fillRect(carX + carW * 0.08, carY + carH * 0.55, lightW, lightH);
        ctx.fillRect(carX + carW * 0.72, carY + carH * 0.55, lightW, lightH);

        // Brake glow halo
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(carX + carW * 0.18, carY + carH * 0.65, lightW * 1.5, 0, Math.PI * 2);
        ctx.arc(carX + carW * 0.82, carY + carH * 0.65, lightW * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Hood / Windshield Dashcam Vignette at bottom
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.15, h - 35);
    ctx.lineTo(w * 0.85, h - 35);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 8. HUD Telemetry Overlay on Canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(20, 20, 240, 52);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 240, 52);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE DASHCAM SIMULATOR', 32, 40);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(`SPEED: ${this.speed} MPH | 30 FPS`, 32, 58);
  }

  public captureFrameJpeg(quality = 0.85): string {
    return this.canvas.toDataURL('image/jpeg', quality);
  }
}
