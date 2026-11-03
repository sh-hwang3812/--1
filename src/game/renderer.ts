import {
  CarConfig,
  Collectible,
  GameEnvironment,
  Particle,
  PlayerState,
  SkidMark,
  TrafficCar,
} from './types';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
  size: number;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private roadLeft: number;
  private roadWidth: number;
  private laneWidth: number;
  private numLanes: number = 4;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // Road dimensions centered on canvas
    this.roadWidth = Math.min(width * 0.72, 440);
    this.roadLeft = (width - this.roadWidth) / 2;
    this.laneWidth = this.roadWidth / this.numLanes;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.roadWidth = Math.min(width * 0.75, 460);
    this.roadLeft = (width - this.roadWidth) / 2;
    this.laneWidth = this.roadWidth / this.numLanes;
  }

  public getRoadBounds() {
    return {
      left: this.roadLeft + 10,
      right: this.roadLeft + this.roadWidth - 10,
      width: this.roadWidth,
      laneWidth: this.laneWidth,
      numLanes: this.numLanes,
    };
  }

  public getLaneCenter(laneIndex: number): number {
    return this.roadLeft + (laneIndex + 0.5) * this.laneWidth;
  }

  /**
   * Draw the entire road scene
   */
  public drawRoad(
    roadOffset: number,
    env: GameEnvironment,
    speed: number,
    distance: number
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Off-road terrain background
    let grassColor = '#1e3a1e';
    let asphaltColor = '#151922';
    let curbColor1 = '#ef4444';
    let curbColor2 = '#f8fafc';

    if (env === 'sunset') {
      grassColor = '#2b1d24';
      asphaltColor = '#1a1622';
      curbColor1 = '#ea580c';
    } else if (env === 'night') {
      grassColor = '#090d14';
      asphaltColor = '#0d1117';
      curbColor1 = '#0284c7';
      curbColor2 = '#38bdf8';
    }

    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, w, h);

    // Decorative side lights / city glow
    if (env === 'night') {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Asphalt Road Surface
    ctx.fillStyle = asphaltColor;
    ctx.fillRect(this.roadLeft, 0, this.roadWidth, h);

    // Subtle road borders / shoulders
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.roadLeft, 0, 6, h);
    ctx.fillRect(this.roadLeft + this.roadWidth - 6, 0, 6, h);

    // 3. Curbs / Rumble strips (scrolling)
    const curbSegmentH = 36;
    const curbOffset = roadOffset % curbSegmentH;
    const curbWidth = 10;

    for (let y = -curbSegmentH + curbOffset; y < h + curbSegmentH; y += curbSegmentH) {
      const isAlt = Math.floor((y - curbOffset) / curbSegmentH) % 2 === 0;
      ctx.fillStyle = isAlt ? curbColor1 : curbColor2;

      // Left curb
      ctx.fillRect(this.roadLeft - curbWidth, y, curbWidth, curbSegmentH);
      // Right curb
      ctx.fillRect(this.roadLeft + this.roadWidth, y, curbWidth, curbSegmentH);
    }

    // 4. Lane markings (dashed white lines between lanes)
    const dashLength = 40;
    const dashGap = 35;
    const totalDashPeriod = dashLength + dashGap;
    const dashOffset = roadOffset % totalDashPeriod;

    ctx.strokeStyle = env === 'night' ? 'rgba(226, 232, 240, 0.75)' : 'rgba(241, 245, 249, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([dashLength, dashGap]);
    ctx.lineDashOffset = -dashOffset;

    for (let i = 1; i < this.numLanes; i++) {
      const lx = this.roadLeft + i * this.laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, -totalDashPeriod);
      ctx.lineTo(lx, h + totalDashPeriod);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash

    // 5. Roadside Environment Objects (street lamps and trees)
    this.drawRoadsideDecorations(roadOffset, env, h, distance);

    // 6. High Speed Motion Lines
    if (speed > 150) {
      this.drawSpeedStreaks(speed, h);
    }
  }

  private drawRoadsideDecorations(
    roadOffset: number,
    env: GameEnvironment,
    height: number,
    distance: number
  ) {
    const ctx = this.ctx;
    const spacing = 180;
    const offset = roadOffset % spacing;

    for (let y = -spacing + offset; y < height + spacing; y += spacing) {
      const seed = Math.floor((y - offset + distance * 10) / spacing);

      // Left side pole or tree
      const lx = this.roadLeft - 32;
      const rx = this.roadLeft + this.roadWidth + 32;

      if (env === 'night') {
        // Neon Street Lamps
        ctx.fillStyle = '#64748b';
        ctx.fillRect(lx - 2, y, 4, 18);
        ctx.fillRect(rx - 2, y, 4, 18);

        // Lamp glow
        const glowColor = seed % 2 === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.25)';
        const bulbColor = seed % 2 === 0 ? '#38bdf8' : '#fbbf24';

        ctx.fillStyle = bulbColor;
        ctx.beginPath();
        ctx.arc(lx, y, 4, 0, Math.PI * 2);
        ctx.arc(rx, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(lx, y, 22, 0, Math.PI * 2);
        ctx.arc(rx, y, 22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Roadside trees / bushes
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(lx, y, 14, 0, Math.PI * 2);
        ctx.arc(rx, y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(lx - 2, y - 2, 10, 0, Math.PI * 2);
        ctx.arc(rx + 2, y - 2, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawSpeedStreaks(speed: number, height: number) {
    const ctx = this.ctx;
    const intensity = Math.min(1, (speed - 150) / 90);
    const numStreaks = Math.floor(6 + intensity * 14);

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * intensity})`;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < numStreaks; i++) {
      const rx = Math.random() < 0.5
        ? this.roadLeft + Math.random() * (this.roadWidth * 0.15)
        : this.roadLeft + this.roadWidth * 0.85 + Math.random() * (this.roadWidth * 0.15);
      const ry = Math.random() * height;
      const length = 40 + intensity * 60;

      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx, ry + length);
      ctx.stroke();
    }
  }

  /**
   * Draw skidmarks left on road
   */
  public drawSkidMarks(skidMarks: SkidMark[]) {
    const ctx = this.ctx;
    for (const mark of skidMarks) {
      ctx.fillStyle = `rgba(15, 23, 42, ${mark.alpha * 0.4})`;
      ctx.fillRect(mark.x - mark.width / 2, mark.y, mark.width, 6);
    }
  }

  /**
   * Draw Collectible Items (Coins, Nitro, Repair, Shield, Magnet)
   */
  public drawCollectible(c: Collectible) {
    const ctx = this.ctx;
    const y = c.y + Math.sin(c.bobOffset) * 4;
    const x = c.x;

    ctx.save();
    ctx.translate(x, y);

    // Glowing aura
    let auraColor = 'rgba(234, 179, 8, 0.3)';
    if (c.type === 'nitro') auraColor = 'rgba(56, 189, 248, 0.4)';
    if (c.type === 'repair') auraColor = 'rgba(16, 185, 129, 0.4)';
    if (c.type === 'shield') auraColor = 'rgba(139, 92, 246, 0.4)';
    if (c.type === 'magnet') auraColor = 'rgba(239, 68, 68, 0.4)';

    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    if (c.type === 'coin') {
      // 3D Spinning Gold Coin
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Coin Star Emblem
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
    } else if (c.type === 'nitro') {
      // Nitrous Bottle
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(-7, -12, 14, 24, 4);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-5, -6, 10, 12);

      // Valve
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-3, -15, 6, 3);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N₂O', 0, 0);
    } else if (c.type === 'repair') {
      // Emerald Wrench / Repair Kit
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -7, 4, 14);
      ctx.fillRect(-7, -2, 14, 4);
    } else if (c.type === 'shield') {
      // Energy Shield Sphere
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c4b5fd';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.type === 'magnet') {
      // Red Magnet
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -2, 10, Math.PI, 0, false);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      // Silver tips
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-12, -2, 4, 6);
      ctx.fillRect(8, -2, 4, 6);
    }

    ctx.restore();
  }

  /**
   * Draw Traffic Vehicle
   */
  public drawTrafficCar(car: TrafficCar, env: GameEnvironment) {
    const ctx = this.ctx;
    const { x, y, width, height, type, color, blinkerTimer, isChangingLane } = car;

    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-width / 2 + 2, -height / 2 + 4, width - 4, height, 8);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-width / 2 - 2, -height / 2 + 10, 4, 16);
    ctx.fillRect(width / 2 - 2, -height / 2 + 10, 4, 16);
    ctx.fillRect(-width / 2 - 2, height / 2 - 26, 4, 16);
    ctx.fillRect(width / 2 - 2, height / 2 - 26, 4, 16);

    // Car Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, type === 'truck' ? 4 : 10);
    ctx.fill();

    // Body highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, 8);

    if (type === 'truck') {
      // Long Cargo Container
      ctx.fillStyle = '#334155';
      ctx.fillRect(-width / 2 + 3, -height / 2 + 24, width - 6, height - 30);

      // Ribbed container roof lines
      ctx.fillStyle = '#475569';
      for (let ry = -height / 2 + 30; ry < height / 2 - 10; ry += 12) {
        ctx.fillRect(-width / 2 + 5, ry, width - 10, 2);
      }

      // Truck cab windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-width / 2 + 5, -height / 2 + 8, width - 10, 10);
    } else {
      // Windshield & Rear glass
      ctx.fillStyle = '#0f172a';
      // Front Windshield
      ctx.beginPath();
      ctx.roundRect(-width / 2 + 5, -height / 2 + 16, width - 10, 14, 3);
      ctx.fill();

      // Rear Windshield
      ctx.beginPath();
      ctx.roundRect(-width / 2 + 6, height / 2 - 22, width - 12, 10, 2);
      ctx.fill();

      // Glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 8, -height / 2 + 18);
      ctx.lineTo(-width / 2 + 18, -height / 2 + 18);
      ctx.lineTo(-width / 2 + 12, -height / 2 + 28);
      ctx.lineTo(-width / 2 + 6, -height / 2 + 28);
      ctx.fill();
    }

    // Police Cruiser Lightbar
    if (type === 'police') {
      const isFlash = Math.floor(Date.now() / 120) % 2 === 0;
      ctx.fillStyle = isFlash ? '#ef4444' : '#3b82f6';
      ctx.fillRect(-10, -2, 9, 6);
      ctx.fillStyle = isFlash ? '#3b82f6' : '#ef4444';
      ctx.fillRect(1, -2, 9, 6);
    }

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-width / 2 + 4, height / 2 - 4, 8, 4);
    ctx.fillRect(width / 2 - 12, height / 2 - 4, 8, 4);

    // Front Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-width / 2 + 4, -height / 2, 8, 3);
    ctx.fillRect(width / 2 - 12, -height / 2, 8, 3);

    // Headlight Beams (sunset/night)
    if (env === 'night' || env === 'sunset') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.1)';
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 4, -height / 2);
      ctx.lineTo(-width / 2 - 16, -height / 2 - 100);
      ctx.lineTo(width / 2 + 16, -height / 2 - 100);
      ctx.lineTo(width / 2 - 4, -height / 2);
      ctx.fill();
    }

    // Lane change blinker
    if (isChangingLane && Math.floor(blinkerTimer * 5) % 2 === 0) {
      ctx.fillStyle = '#f59e0b';
      const blinkerX = car.targetLane > car.lane ? width / 2 + 2 : -width / 2 - 6;
      ctx.fillRect(blinkerX, -height / 2 + 12, 4, 6);
      ctx.fillRect(blinkerX, height / 2 - 18, 4, 6);
    }

    ctx.restore();
  }

  /**
   * Draw the Player's Car
   */
  public drawPlayerCar(
    player: PlayerState,
    carConfig: CarConfig,
    env: GameEnvironment,
    isBraking: boolean
  ) {
    const ctx = this.ctx;
    const { x, y, steeringAngle, nitro, isBoosting, shieldTimer, magnetTimer, invincibleTimer } = player;
    const { width, height } = carConfig;

    // Invincibility flashing
    if (invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(steeringAngle);

    // Headlight cone on asphalt
    const beamGradient = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 - 240);
    beamGradient.addColorStop(0, env === 'night' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.2)');
    beamGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = beamGradient;

    ctx.beginPath();
    ctx.moveTo(-width / 2 + 4, -height / 2);
    ctx.lineTo(-width / 2 - 40, -height / 2 - 240);
    ctx.lineTo(width / 2 + 40, -height / 2 - 240);
    ctx.lineTo(width / 2 - 4, -height / 2);
    ctx.fill();

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(-width / 2 + 2, -height / 2 + 6, width - 4, height, 12);
    ctx.fill();

    // Nitro Jet Flames
    if (isBoosting && nitro > 0) {
      const flameLen = 30 + Math.random() * 20;
      const flameGrad = ctx.createLinearGradient(0, height / 2, 0, height / 2 + flameLen);
      flameGrad.addColorStop(0, '#38bdf8');
      flameGrad.addColorStop(0.5, '#60a5fa');
      flameGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      // Left exhaust flame
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-width / 4 - 5, height / 2 - 2);
      ctx.lineTo(-width / 4, height / 2 + flameLen);
      ctx.lineTo(-width / 4 + 5, height / 2 - 2);
      ctx.fill();

      // Right exhaust flame
      ctx.beginPath();
      ctx.moveTo(width / 4 - 5, height / 2 - 2);
      ctx.lineTo(width / 4, height / 2 + flameLen);
      ctx.lineTo(width / 4 + 5, height / 2 - 2);
      ctx.fill();
    }

    // Tires
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-width / 2 - 3, -height / 2 + 12, 5, 18);
    ctx.fillRect(width / 2 - 2, -height / 2 + 12, 5, 18);
    ctx.fillRect(-width / 2 - 3, height / 2 - 28, 5, 18);
    ctx.fillRect(width / 2 - 2, height / 2 - 28, 5, 18);

    // Car Main Body
    ctx.fillStyle = player.carColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, 12);
    ctx.fill();

    // Aerodynamic contours / side skirts
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-width / 2, -height / 2 + 24, 4, height - 48);
    ctx.fillRect(width / 2 - 4, -height / 2 + 24, 4, height - 48);

    // Hood scoop / racing stripe
    ctx.fillStyle = carConfig.accentColor;
    ctx.fillRect(-4, -height / 2 + 4, 8, height - 8);

    // Front Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-width / 2 + 6, -height / 2 + 20, width - 12, 18, 4);
    ctx.fill();

    // Windshield glass gradient highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-width / 2 + 10, -height / 2 + 22);
    ctx.lineTo(-width / 2 + 20, -height / 2 + 22);
    ctx.lineTo(-width / 2 + 14, -height / 2 + 36);
    ctx.lineTo(-width / 2 + 8, -height / 2 + 36);
    ctx.fill();

    // Roof Top
    ctx.fillStyle = player.carColor;
    ctx.fillRect(-width / 2 + 7, -height / 2 + 38, width - 14, 20);

    // Rear Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-width / 2 + 7, height / 2 - 26, width - 14, 12, 3);
    ctx.fill();

    // Rear Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-width / 2 + 2, height / 2 - 4, width - 4, 5);

    // Front Headlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-width / 2 + 4, -height / 2, 8, 3);
    ctx.fillRect(width / 2 - 12, -height / 2, 8, 3);

    // Taillights / Brake lights
    if (isBraking) {
      // Glow intensely
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(-width / 2 + 3, height / 2 - 3, 11, 4);
      ctx.fillRect(width / 2 - 14, height / 2 - 3, 11, 4);

      // Red brake glow halo
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(-width / 2 + 8, height / 2, 10, 0, Math.PI * 2);
      ctx.arc(width / 2 - 8, height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-width / 2 + 4, height / 2 - 3, 8, 3);
      ctx.fillRect(width / 2 - 12, height / 2 - 3, 8, 3);
    }

    // Active Shield Energy Sphere
    if (shieldTimer > 0) {
      const shieldPulse = Math.sin(Date.now() / 150) * 3;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, height / 2 + 10 + shieldPulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fill();
    }

    // Active Magnet Aura
    if (magnetTimer > 0) {
      const magnetWave = (Date.now() % 1000) / 1000;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 - magnetWave * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, height / 2 + magnetWave * 35, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw Explosions, Sparks, Smoke particles
   */
  public drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'sparkle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }
  }

  /**
   * Draw Floating Text Popups (e.g. Near Miss!, +50 Coin)
   */
  public drawFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    for (const t of texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Outline for crisp legibility
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}
