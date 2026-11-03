/**
 * TURBO HIGHWAY: 2D Retro Racer
 * Standalone Vanilla JavaScript Game Engine
 * Zero build step required - runs directly in GitHub Pages or any modern browser.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. DATA DEFINITIONS & CAR CONFIGURATIONS
  // ==========================================================================
  const CAR_MODELS = [
    {
      id: 'thunderbolt',
      name: '썬더 볼트 (Thunderbolt)',
      subtitle: '균형 잡힌 스트리트 튜닝 스포츠 쿠페',
      description: '민첩한 핸들링과 안정적인 속도 밸런스를 갖춘 전천후 레이싱 카입니다.',
      maxSpeed: 190,
      acceleration: 1.1,
      handling: 1.15,
      durability: 3,
      width: 46,
      height: 84,
      baseColor: '#e11d48',
      accentColor: '#ffffff',
      unlockedByDefault: true,
      cost: 0,
    },
    {
      id: 'night_fury',
      name: '나이트 퓨리 (Night Fury)',
      subtitle: '극한의 최고속도를 자랑하는 머슬 카',
      description: '폭발적인 가속력과 초고속 질주력을 자랑하지만 코너링에 주의가 필요합니다.',
      maxSpeed: 230,
      acceleration: 1.35,
      handling: 0.95,
      durability: 2,
      width: 48,
      height: 88,
      baseColor: '#1e293b',
      accentColor: '#38bdf8',
      unlockedByDefault: false,
      cost: 200,
    },
    {
      id: 'titan_cruiser',
      name: '타이탄 크루저 (Titan Cruiser)',
      subtitle: '강철 프레임 중형 장갑 SUV',
      description: '압도적인 충돌 내구도로 5회의 충돌까지 버텨냅니다.',
      maxSpeed: 170,
      acceleration: 0.95,
      handling: 0.95,
      durability: 5,
      width: 52,
      height: 92,
      baseColor: '#059669',
      accentColor: '#f59e0b',
      unlockedByDefault: false,
      cost: 150,
    },
    {
      id: 'cyber_phantom',
      name: '사이버 팬텀 (Cyber Phantom)',
      subtitle: '전자기 부스터 탑재 미래형 하이퍼카',
      description: '레이저처럼 정교한 칼치기 핸들링과 최고속 터보 부스트를 탑재했습니다.',
      maxSpeed: 245,
      acceleration: 1.45,
      handling: 1.35,
      durability: 3,
      width: 48,
      height: 86,
      baseColor: '#8b5cf6',
      accentColor: '#22d3ee',
      unlockedByDefault: false,
      cost: 350,
    },
  ];

  const COLOR_PALETTES = [
    { name: '크림슨 레드', value: '#e11d48' },
    { name: '사이버 사이언', value: '#06b6d4' },
    { name: '일렉트릭 옐로우', value: '#eab308' },
    { name: '네온 퍼플', value: '#9333ea' },
    { name: '에메랄드 그린', value: '#10b981' },
    { name: '미드나잇 블랙', value: '#1e293b' },
    { name: '레이싱 오렌지', value: '#f97316' },
    { name: '펄 화이트', value: '#f8fafc' },
  ];

  function getCarConfig(id) {
    return CAR_MODELS.find((c) => c.id === id) || CAR_MODELS[0];
  }

  // ==========================================================================
  // 2. WEB AUDIO API SYNTHESIZER (100% Offline & Procedural)
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.engineGain = null;
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineFilter = null;
      this.isEngineRunning = false;

      try {
        const saved = localStorage.getItem('turbo_racer_muted');
        if (saved !== null) {
          this.isMuted = saved === 'true';
        }
      } catch (e) {
        // Fallback
      }
    }

    initContext() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    getMuted() {
      return this.isMuted;
    }

    setMuted(muted) {
      this.isMuted = muted;
      try {
        localStorage.setItem('turbo_racer_muted', String(muted));
      } catch (e) {}

      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx.currentTime);
      }
    }

    toggleMute() {
      this.setMuted(!this.isMuted);
      return this.isMuted;
    }

    startEngine() {
      if (this.isEngineRunning) return;
      this.initContext();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, now);

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(280, now);

        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc1.frequency.setValueAtTime(45, now);

        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc2.type = 'triangle';
        this.engineOsc2.frequency.setValueAtTime(68, now);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc1.start();
        this.engineOsc2.start();
        this.isEngineRunning = true;
      } catch (e) {}
    }

    updateEngine(speedRatio, isBoosting) {
      if (!this.ctx || !this.isEngineRunning) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      try {
        const now = this.ctx.currentTime;
        const clamped = Math.max(0, Math.min(1.2, speedRatio));
        const baseFreq = 40 + clamped * 130 + (isBoosting ? 40 : 0);
        const filterFreq = 220 + clamped * 500 + (isBoosting ? 300 : 0);

        if (this.engineOsc1) this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
        if (this.engineOsc2) this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
        if (this.engineFilter) this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

        if (this.engineGain && !this.isMuted) {
          const targetVol = 0.06 + clamped * 0.08 + (isBoosting ? 0.06 : 0);
          this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
        }
      } catch (e) {}
    }

    stopEngine() {
      if (!this.isEngineRunning) return;
      try {
        if (this.engineOsc1) {
          this.engineOsc1.stop();
          this.engineOsc1.disconnect();
        }
        if (this.engineOsc2) {
          this.engineOsc2.stop();
          this.engineOsc2.disconnect();
        }
        if (this.engineGain) this.engineGain.disconnect();
      } catch (e) {}
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineGain = null;
      this.engineFilter = null;
      this.isEngineRunning = false;
    }

    playCoin() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } catch (e) {}
    }

    playNitro() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
      } catch (e) {}
    }

    playPowerup() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const now = this.ctx.currentTime;
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const noteTime = now + i * 0.06;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.15, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.2);
        });
      } catch (e) {}
    }

    playCrash() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.52);

        // Impact crunch noise
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.frequency.linearRampToValueAtTime(200, now + 0.35);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.36);
      } catch (e) {}
    }

    playNearMiss() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } catch (e) {}
    }

    playShieldDeflect() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.15);
        osc.frequency.linearRampToValueAtTime(400, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } catch (e) {}
    }
  }

  const sound = new SoundEngine();

  // ==========================================================================
  // 3. STORAGE CONTROLLER
  // ==========================================================================
  const STORAGE_KEYS = {
    HIGH_SCORE: 'turbo_racer_high_score',
    BEST_DISTANCE: 'turbo_racer_best_distance',
    TOTAL_COINS: 'turbo_racer_total_coins',
    HIGH_SCORES_LIST: 'turbo_racer_scores_list',
    UNLOCKED_CARS: 'turbo_racer_unlocked_cars',
    SELECTED_CAR: 'turbo_racer_selected_car',
    SELECTED_COLOR: 'turbo_racer_selected_color',
  };

  function loadGameData() {
    try {
      const highScore = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
      const bestDistance = parseInt(localStorage.getItem(STORAGE_KEYS.BEST_DISTANCE) || '0', 10);
      const totalCoins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_COINS) || '0', 10);

      const scoresJson = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES_LIST);
      const recentScores = scoresJson ? JSON.parse(scoresJson) : [];

      const unlockedJson = localStorage.getItem(STORAGE_KEYS.UNLOCKED_CARS);
      const unlockedCars = unlockedJson ? JSON.parse(unlockedJson) : ['thunderbolt'];

      const selectedCar = localStorage.getItem(STORAGE_KEYS.SELECTED_CAR) || 'thunderbolt';
      const selectedColor = localStorage.getItem(STORAGE_KEYS.SELECTED_COLOR) || '#e11d48';

      return {
        highScore: isNaN(highScore) ? 0 : highScore,
        bestDistance: isNaN(bestDistance) ? 0 : bestDistance,
        totalCoins: isNaN(totalCoins) ? 0 : totalCoins,
        recentScores: Array.isArray(recentScores) ? recentScores : [],
        unlockedCars: Array.isArray(unlockedCars) ? unlockedCars : ['thunderbolt'],
        selectedCar,
        selectedColor,
      };
    } catch (e) {
      return {
        highScore: 0,
        bestDistance: 0,
        totalCoins: 0,
        recentScores: [],
        unlockedCars: ['thunderbolt'],
        selectedCar: 'thunderbolt',
        selectedColor: '#e11d48',
      };
    }
  }

  function saveRunResult(score, distance, coinsEarned, carName) {
    const current = loadGameData();
    const isNewHighScore = score > current.highScore;
    const isNewBestDistance = distance > current.bestDistance;
    const updatedTotalCoins = current.totalCoins + coinsEarned;

    try {
      if (isNewHighScore) localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(score));
      if (isNewBestDistance) localStorage.setItem(STORAGE_KEYS.BEST_DISTANCE, String(distance));
      localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, String(updatedTotalCoins));

      const newRecord = {
        score,
        distance,
        coins: coinsEarned,
        date: new Date().toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        carName,
      };

      const updatedList = [newRecord, ...current.recentScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      localStorage.setItem(STORAGE_KEYS.HIGH_SCORES_LIST, JSON.stringify(updatedList));
    } catch (e) {}

    return { isNewHighScore, isNewBestDistance, updatedTotalCoins };
  }

  function saveCarSelection(carId, color) {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CAR, carId);
      localStorage.setItem(STORAGE_KEYS.SELECTED_COLOR, color);
    } catch (e) {}
  }

  function unlockCarInStorage(carId, cost) {
    const data = loadGameData();
    if (data.totalCoins < cost) return false;

    const nextCoins = data.totalCoins - cost;
    const nextUnlocked = Array.from(new Set([...data.unlockedCars, carId]));

    try {
      localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, String(nextCoins));
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_CARS, JSON.stringify(nextUnlocked));
      return true;
    } catch (e) {
      return false;
    }
  }

  function resetStoredScores() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
      localStorage.removeItem(STORAGE_KEYS.BEST_DISTANCE);
      localStorage.removeItem(STORAGE_KEYS.HIGH_SCORES_LIST);
    } catch (e) {}
  }

  // ==========================================================================
  // 4. CANVAS RENDERER & VISUAL PRIMITIVES
  // ==========================================================================
  class GameRenderer {
    constructor(ctx, width, height) {
      this.ctx = ctx;
      this.width = width;
      this.height = height;
      this.numLanes = 4;
      this.resize(width, height);
    }

    resize(width, height) {
      this.width = width;
      this.height = height;
      this.roadWidth = Math.min(width * 0.75, 460);
      this.roadLeft = (width - this.roadWidth) / 2;
      this.laneWidth = this.roadWidth / this.numLanes;
    }

    getRoadBounds() {
      return {
        left: this.roadLeft + 10,
        right: this.roadLeft + this.roadWidth - 10,
        width: this.roadWidth,
        laneWidth: this.laneWidth,
        numLanes: this.numLanes,
      };
    }

    getLaneCenter(laneIndex) {
      return this.roadLeft + (laneIndex + 0.5) * this.laneWidth;
    }

    drawRoad(roadOffset, env, speed, distance) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

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

      // Terrain
      ctx.fillStyle = grassColor;
      ctx.fillRect(0, 0, w, h);

      if (env === 'night') {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w / 2);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
        gradient.addColorStop(1, 'rgba(2, 6, 23, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Asphalt
      ctx.fillStyle = asphaltColor;
      ctx.fillRect(this.roadLeft, 0, this.roadWidth, h);

      // Borders
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.roadLeft, 0, 6, h);
      ctx.fillRect(this.roadLeft + this.roadWidth - 6, 0, 6, h);

      // Rumble curbs
      const curbSegmentH = 36;
      const curbOffset = roadOffset % curbSegmentH;
      const curbWidth = 10;
      for (let y = -curbSegmentH + curbOffset; y < h + curbSegmentH; y += curbSegmentH) {
        const isAlt = Math.floor((y - curbOffset) / curbSegmentH) % 2 === 0;
        ctx.fillStyle = isAlt ? curbColor1 : curbColor2;
        ctx.fillRect(this.roadLeft - curbWidth, y, curbWidth, curbSegmentH);
        ctx.fillRect(this.roadLeft + this.roadWidth, y, curbWidth, curbSegmentH);
      }

      // Dashed lane lines
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
      ctx.setLineDash([]);

      // Roadside decorations
      const spacing = 180;
      const offset = roadOffset % spacing;
      for (let y = -spacing + offset; y < h + spacing; y += spacing) {
        const seed = Math.floor((y - offset + distance * 10) / spacing);
        const lx = this.roadLeft - 32;
        const rx = this.roadLeft + this.roadWidth + 32;

        if (env === 'night') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(lx - 2, y, 4, 18);
          ctx.fillRect(rx - 2, y, 4, 18);

          const bulbColor = seed % 2 === 0 ? '#38bdf8' : '#fbbf24';
          ctx.fillStyle = bulbColor;
          ctx.beginPath();
          ctx.arc(lx, y, 4, 0, Math.PI * 2);
          ctx.arc(rx, y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = seed % 2 === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.25)';
          ctx.beginPath();
          ctx.arc(lx, y, 22, 0, Math.PI * 2);
          ctx.arc(rx, y, 22, 0, Math.PI * 2);
          ctx.fill();
        } else {
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

      // High speed streaks
      if (speed > 150) {
        const intensity = Math.min(1, (speed - 150) / 90);
        const numStreaks = Math.floor(6 + intensity * 14);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * intensity})`;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < numStreaks; i++) {
          const rx =
            Math.random() < 0.5
              ? this.roadLeft + Math.random() * (this.roadWidth * 0.15)
              : this.roadLeft + this.roadWidth * 0.85 + Math.random() * (this.roadWidth * 0.15);
          const ry = Math.random() * h;
          const length = 40 + intensity * 60;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx, ry + length);
          ctx.stroke();
        }
      }
    }

    drawSkidMarks(skidMarks) {
      const ctx = this.ctx;
      for (const mark of skidMarks) {
        ctx.fillStyle = `rgba(15, 23, 42, ${mark.alpha * 0.4})`;
        ctx.fillRect(mark.x - mark.width / 2, mark.y, mark.width, 6);
      }
    }

    drawCollectible(c) {
      const ctx = this.ctx;
      const y = c.y + Math.sin(c.bobOffset) * 4;
      const x = c.x;

      ctx.save();
      ctx.translate(x, y);

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
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);
      } else if (c.type === 'nitro') {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-7, -12, 14, 24, 4);
        else ctx.rect(-7, -12, 14, 24);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-5, -6, 10, 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-3, -15, 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N₂O', 0, 0);
      } else if (c.type === 'repair') {
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -7, 4, 14);
        ctx.fillRect(-7, -2, 14, 4);
      } else if (c.type === 'shield') {
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c4b5fd';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.type === 'magnet') {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, -2, 10, Math.PI, 0, false);
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-12, -2, 4, 6);
        ctx.fillRect(8, -2, 4, 6);
      }

      ctx.restore();
    }

    drawTrafficCar(car, env) {
      const ctx = this.ctx;
      const { x, y, width, height, type, color, blinkerTimer, isChangingLane } = car;

      ctx.save();
      ctx.translate(x, y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-width / 2 + 2, -height / 2 + 4, width - 4, height, 8);
      else ctx.rect(-width / 2 + 2, -height / 2 + 4, width - 4, height);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-width / 2 - 2, -height / 2 + 10, 4, 16);
      ctx.fillRect(width / 2 - 2, -height / 2 + 10, 4, 16);
      ctx.fillRect(-width / 2 - 2, height / 2 - 26, 4, 16);
      ctx.fillRect(width / 2 - 2, height / 2 - 26, 4, 16);

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      const r = type === 'truck' ? 4 : 10;
      if (ctx.roundRect) ctx.roundRect(-width / 2, -height / 2, width, height, r);
      else ctx.rect(-width / 2, -height / 2, width, height);
      ctx.fill();

      // Top Highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, 8);

      if (type === 'truck') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-width / 2 + 3, -height / 2 + 24, width - 6, height - 30);
        ctx.fillStyle = '#475569';
        for (let ry = -height / 2 + 30; ry < height / 2 - 10; ry += 12) {
          ctx.fillRect(-width / 2 + 5, ry, width - 10, 2);
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-width / 2 + 5, -height / 2 + 8, width - 10, 10);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-width / 2 + 5, -height / 2 + 16, width - 10, 14, 3);
          ctx.roundRect(-width / 2 + 6, height / 2 - 22, width - 12, 10, 2);
        } else {
          ctx.rect(-width / 2 + 5, -height / 2 + 16, width - 10, 14);
          ctx.rect(-width / 2 + 6, height / 2 - 22, width - 12, 10);
        }
        ctx.fill();
      }

      // Police flasher
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

      // Beams
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

    drawPlayerCar(player, carConfig, env, isBraking) {
      const ctx = this.ctx;
      const { x, y, steeringAngle, nitro, isBoosting, shieldTimer, magnetTimer, invincibleTimer } =
        player;
      const { width, height } = carConfig;

      if (invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(steeringAngle);

      // Headlight Beam
      const beamGradient = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 - 240);
      beamGradient.addColorStop(
        0,
        env === 'night' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.2)'
      );
      beamGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamGradient;
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 4, -height / 2);
      ctx.lineTo(-width / 2 - 40, -height / 2 - 240);
      ctx.lineTo(width / 2 + 40, -height / 2 - 240);
      ctx.lineTo(width / 2 - 4, -height / 2);
      ctx.fill();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-width / 2 + 2, -height / 2 + 6, width - 4, height, 12);
      else ctx.rect(-width / 2 + 2, -height / 2 + 6, width - 4, height);
      ctx.fill();

      // Nitro Jets
      if (isBoosting && nitro > 0) {
        const flameLen = 30 + Math.random() * 20;
        const flameGrad = ctx.createLinearGradient(0, height / 2, 0, height / 2 + flameLen);
        flameGrad.addColorStop(0, '#38bdf8');
        flameGrad.addColorStop(0.5, '#60a5fa');
        flameGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = flameGrad;

        ctx.beginPath();
        ctx.moveTo(-width / 4 - 5, height / 2 - 2);
        ctx.lineTo(-width / 4, height / 2 + flameLen);
        ctx.lineTo(-width / 4 + 5, height / 2 - 2);
        ctx.fill();

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

      // Chassis Body
      ctx.fillStyle = player.carColor;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-width / 2, -height / 2, width, height, 12);
      else ctx.rect(-width / 2, -height / 2, width, height);
      ctx.fill();

      // Contours
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(-width / 2, -height / 2 + 24, 4, height - 48);
      ctx.fillRect(width / 2 - 4, -height / 2 + 24, 4, height - 48);

      // Racing Stripe
      ctx.fillStyle = carConfig.accentColor;
      ctx.fillRect(-4, -height / 2 + 4, 8, height - 8);

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-width / 2 + 6, -height / 2 + 20, width - 12, 18, 4);
      else ctx.rect(-width / 2 + 6, -height / 2 + 20, width - 12, 18);
      ctx.fill();

      // Glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 10, -height / 2 + 22);
      ctx.lineTo(-width / 2 + 20, -height / 2 + 22);
      ctx.lineTo(-width / 2 + 14, -height / 2 + 36);
      ctx.lineTo(-width / 2 + 8, -height / 2 + 36);
      ctx.fill();

      // Roof
      ctx.fillStyle = player.carColor;
      ctx.fillRect(-width / 2 + 7, -height / 2 + 38, width - 14, 20);

      // Rear Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-width / 2 + 7, height / 2 - 26, width - 14, 12, 3);
      else ctx.rect(-width / 2 + 7, height / 2 - 26, width - 14, 12);
      ctx.fill();

      // Spoiler
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-width / 2 + 2, height / 2 - 4, width - 4, 5);

      // Headlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-width / 2 + 4, -height / 2, 8, 3);
      ctx.fillRect(width / 2 - 12, -height / 2, 8, 3);

      // Taillights
      if (isBraking) {
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(-width / 2 + 3, height / 2 - 3, 11, 4);
        ctx.fillRect(width / 2 - 14, height / 2 - 3, 11, 4);
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

      // Energy Shield
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

      // Magnet Wave
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

    drawParticles(particles) {
      const ctx = this.ctx;
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.type === 'sparkle' || p.type === 'smoke') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }
    }

    drawFloatingTexts(texts) {
      const ctx = this.ctx;
      for (const t of texts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.alpha);
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }
    }
  }

  // ==========================================================================
  // 5. MAIN GAME LOGIC & CONTROLLER
  // ==========================================================================
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let renderer = null;

  // Stored preferences
  let storedData = loadGameData();
  let selectedCarId = storedData.selectedCar;
  let selectedColor = storedData.selectedColor;
  let unlockedCars = storedData.unlockedCars;
  let totalCoins = storedData.totalCoins;
  let highScore = storedData.highScore;
  let bestDistance = storedData.bestDistance;

  // Game state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
  let gameState = 'MENU';
  let environment = 'day';
  let difficulty = 'normal';

  // Player state
  const player = {
    x: 0,
    y: 0,
    speed: 70,
    steeringAngle: 0,
    health: 3,
    maxHealth: 3,
    nitro: 50,
    isBoosting: false,
    shieldTimer: 0,
    magnetTimer: 0,
    carId: selectedCarId,
    carColor: selectedColor,
    invincibleTimer: 0,
  };

  // Run statistics
  const stats = {
    score: 0,
    distance: 0,
    coins: 0,
    nearMisses: 0,
    timeElapsed: 0,
    currentCombo: 1,
    comboTimer: 0,
  };

  // Keyboard and touch inputs
  const inputs = {
    left: false,
    right: false,
    up: false,
    down: false,
    nitro: false,
  };

  let trafficCars = [];
  let collectibles = [];
  let particles = [];
  let skidMarks = [];
  let floatingTexts = [];
  let roadOffset = 0;
  let screenShake = 0;
  let nextEntityId = 1;
  let lastTime = 0;
  let spawnTimer = 0;
  let collectibleTimer = 0;

  // ==========================================================================
  // 6. UI DOM REFERENCES
  // ==========================================================================
  const headerCoinsCount = document.getElementById('header-coins-count');
  const primaryActionBtn = document.getElementById('primary-action-btn');
  const navSoundBtn = document.getElementById('nav-sound-btn');
  const navSoundLabel = document.getElementById('nav-sound-label');
  const navSoundIconWrapper = document.getElementById('nav-sound-icon-wrapper');
  const mobileSoundBtn = document.getElementById('mobile-sound-btn');

  const menuOverlay = document.getElementById('menu-overlay');
  const menuStartBtn = document.getElementById('menu-start-btn');
  const menuCarName = document.getElementById('menu-car-name');
  const menuCarStats = document.getElementById('menu-car-stats');
  const menuCarColorBox = document.getElementById('menu-car-color-box');
  const menuOpenGarageBtn = document.getElementById('menu-open-garage-btn');

  const pauseOverlay = document.getElementById('pause-overlay');
  const pauseResumeBtn = document.getElementById('pause-resume-btn');
  const pauseRestartBtn = document.getElementById('pause-restart-btn');
  const pauseMenuBtn = document.getElementById('pause-menu-btn');

  const gameHud = document.getElementById('game-hud');
  const hudScore = document.getElementById('hud-score');
  const hudDistance = document.getElementById('hud-distance');
  const hudCoins = document.getElementById('hud-coins');
  const hudMobileDistance = document.getElementById('hud-mobile-distance');
  const hudMobileCoins = document.getElementById('hud-mobile-coins');
  const hudHealthHearts = document.getElementById('hud-health-hearts');
  const hudBuffShield = document.getElementById('hud-buff-shield');
  const hudBuffShieldTime = document.getElementById('hud-buff-shield-time');
  const hudBuffMagnet = document.getElementById('hud-buff-magnet');
  const hudBuffMagnetTime = document.getElementById('hud-buff-magnet-time');
  const hudComboBadge = document.getElementById('hud-combo-badge');
  const hudComboText = document.getElementById('hud-combo-text');
  const hudSpeed = document.getElementById('hud-speed');
  const hudGear = document.getElementById('hud-gear');
  const hudNitroPercent = document.getElementById('hud-nitro-percent');
  const hudNitroBar = document.getElementById('hud-nitro-bar');

  const touchControls = document.getElementById('touch-controls');
  const touchLeft = document.getElementById('touch-left');
  const touchRight = document.getElementById('touch-right');
  const touchGas = document.getElementById('touch-gas');
  const touchBrake = document.getElementById('touch-brake');
  const touchNitro = document.getElementById('touch-nitro');

  const gameOverModal = document.getElementById('game-over-modal');
  const gameOverBadge = document.getElementById('game-over-badge');
  const gameOverScore = document.getElementById('game-over-score');
  const gameOverHighScore = document.getElementById('game-over-high-score');
  const gameOverDistance = document.getElementById('game-over-distance');
  const gameOverCoins = document.getElementById('game-over-coins');
  const gameOverNearMisses = document.getElementById('game-over-near-misses');
  const gameOverRestartBtn = document.getElementById('game-over-restart-btn');
  const gameOverGarageBtn = document.getElementById('game-over-garage-btn');

  const garageModal = document.getElementById('garage-modal');
  const garageTotalCoins = document.getElementById('garage-total-coins');
  const garageCloseBtn = document.getElementById('garage-close-btn');
  const garageCarTabs = document.getElementById('garage-car-tabs');
  const garageCarPreview = document.getElementById('garage-car-preview');
  const garageCarTitle = document.getElementById('garage-car-title');
  const garageCarSubtitle = document.getElementById('garage-car-subtitle');
  const garageStatSpeed = document.getElementById('garage-stat-speed');
  const garageBarSpeed = document.getElementById('garage-bar-speed');
  const garageStatAccel = document.getElementById('garage-stat-accel');
  const garageBarAccel = document.getElementById('garage-bar-accel');
  const garageStatHandling = document.getElementById('garage-stat-handling');
  const garageBarHandling = document.getElementById('garage-bar-handling');
  const garageStatDurability = document.getElementById('garage-stat-durability');
  const garageBarDurability = document.getElementById('garage-bar-durability');
  const garageColorSwatches = document.getElementById('garage-color-swatches');
  const garageUnlockHint = document.getElementById('garage-unlock-hint');
  const garageActionContainer = document.getElementById('garage-action-container');

  const howToPlayModal = document.getElementById('how-to-play-modal');
  const howToPlayCloseBtn = document.getElementById('how-to-play-close-btn');
  const howToPlayConfirmBtn = document.getElementById('how-to-play-confirm-btn');
  const navHowToPlayBtn = document.getElementById('nav-how-to-play-btn');

  const leaderboardModal = document.getElementById('leaderboard-modal');
  const leaderboardCloseBtn = document.getElementById('leaderboard-close-btn');
  const leaderboardConfirmBtn = document.getElementById('leaderboard-confirm-btn');
  const leaderboardResetBtn = document.getElementById('leaderboard-reset-btn');
  const leaderboardHighScore = document.getElementById('leaderboard-high-score');
  const leaderboardBestDistance = document.getElementById('leaderboard-best-distance');
  const leaderboardList = document.getElementById('leaderboard-list');
  const navLeaderboardBtn = document.getElementById('nav-leaderboard-btn');
  const navGarageBtn = document.getElementById('nav-garage-btn');

  // Garage temporary selection state
  let previewCarId = selectedCarId;
  let previewColor = selectedColor;

  // ==========================================================================
  // 7. INITIALIZATION & RESIZE
  // ==========================================================================
  function handleResize() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    if (!renderer) {
      renderer = new GameRenderer(ctx, rect.width, rect.height);
    } else {
      renderer.resize(rect.width, rect.height);
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // Initial car sync
  function syncCarSetup() {
    const config = getCarConfig(selectedCarId);
    player.carId = selectedCarId;
    player.carColor = selectedColor;
    player.maxHealth = config.durability;
    player.health = config.durability;

    if (menuCarName) menuCarName.textContent = config.name;
    if (menuCarStats) {
      menuCarStats.textContent = `최고속 ${config.maxSpeed} km/h · 내구도 ${config.durability} HP`;
    }
    if (menuCarColorBox) {
      menuCarColorBox.style.backgroundColor = selectedColor;
    }
    if (headerCoinsCount) {
      headerCoinsCount.textContent = totalCoins.toLocaleString();
    }
  }

  syncCarSetup();

  // Update sound icon display
  function updateSoundUI() {
    const isMuted = sound.getMuted();
    if (navSoundLabel) {
      navSoundLabel.textContent = isMuted ? '사운드 켜기' : '사운드 끄기';
    }
    const iconHtml = isMuted
      ? '<i data-lucide="volume-x" class="w-4 h-4 text-rose-400"></i>'
      : '<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i>';

    if (navSoundIconWrapper) navSoundIconWrapper.innerHTML = iconHtml;
    if (mobileSoundBtn) mobileSoundBtn.innerHTML = iconHtml;
    if (window.lucide) window.lucide.createIcons();
  }

  updateSoundUI();

  // ==========================================================================
  // 8. GAMEPLAY ACTIONS
  // ==========================================================================
  function startGame() {
    const config = getCarConfig(selectedCarId);
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : 400;
    const h = parent ? parent.clientHeight : 600;

    player.x = w / 2;
    player.y = h - 140;
    player.speed = 70;
    player.steeringAngle = 0;
    player.health = config.durability;
    player.maxHealth = config.durability;
    player.nitro = 50;
    player.isBoosting = false;
    player.shieldTimer = 0;
    player.magnetTimer = 0;
    player.invincibleTimer = 0;
    player.carId = selectedCarId;
    player.carColor = selectedColor;

    stats.score = 0;
    stats.distance = 0;
    stats.coins = 0;
    stats.nearMisses = 0;
    stats.timeElapsed = 0;
    stats.currentCombo = 1;
    stats.comboTimer = 0;

    trafficCars = [];
    collectibles = [];
    particles = [];
    skidMarks = [];
    floatingTexts = [];
    roadOffset = 0;
    screenShake = 0;

    gameState = 'PLAYING';
    menuOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    gameHud.classList.remove('hidden');

    // Show touch controls on small screens
    if (window.innerWidth < 768) {
      touchControls.classList.remove('hidden');
    }

    primaryActionBtn.textContent = '일시 정지 (ESC)';
    primaryActionBtn.className =
      'px-4 sm:px-5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm';

    sound.startEngine();
  }

  function pauseGame() {
    if (gameState !== 'PLAYING') return;
    gameState = 'PAUSED';
    pauseOverlay.classList.remove('hidden');
    primaryActionBtn.textContent = '계속 달리기';
    primaryActionBtn.className =
      'px-4 sm:px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md';
    sound.stopEngine();
  }

  function resumeGame() {
    if (gameState !== 'PAUSED') return;
    gameState = 'PLAYING';
    pauseOverlay.classList.add('hidden');
    primaryActionBtn.textContent = '일시 정지 (ESC)';
    primaryActionBtn.className =
      'px-4 sm:px-5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm';
    sound.startEngine();
  }

  function endGame() {
    gameState = 'GAME_OVER';
    sound.stopEngine();
    sound.playCrash();

    const carConfig = getCarConfig(selectedCarId);
    const result = saveRunResult(
      stats.score,
      Math.round(stats.distance),
      stats.coins,
      carConfig.name
    );

    totalCoins = result.updatedTotalCoins;
    highScore = Math.max(highScore, stats.score);
    bestDistance = Math.max(bestDistance, Math.round(stats.distance));

    if (headerCoinsCount) headerCoinsCount.textContent = totalCoins.toLocaleString();

    // Populate Game Over modal
    gameOverScore.textContent = stats.score.toLocaleString();
    gameOverHighScore.textContent = highScore.toLocaleString();
    gameOverDistance.textContent = Math.round(stats.distance).toLocaleString();
    gameOverCoins.textContent = stats.coins;
    gameOverNearMisses.textContent = stats.nearMisses;

    if (result.isNewHighScore) {
      gameOverBadge.innerHTML = '<i data-lucide="trophy" class="w-3.5 h-3.5 text-amber-400"></i><span>신기록 달성 (NEW RECORD)!</span>';
      gameOverBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 mb-2';
    } else {
      gameOverBadge.innerHTML = '<span>충돌 발생 (CRASH)!</span>';
      gameOverBadge.className = 'inline-flex items-center gap-1 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-xs font-bold text-rose-300 mb-2';
    }

    if (window.lucide) window.lucide.createIcons();

    gameOverModal.classList.remove('hidden');
    gameHud.classList.add('hidden');
    touchControls.classList.add('hidden');

    primaryActionBtn.textContent = '레이스 시작';
    primaryActionBtn.className =
      'px-4 sm:px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md';
  }

  function returnToMenu() {
    gameState = 'MENU';
    sound.stopEngine();
    pauseOverlay.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    gameHud.classList.add('hidden');
    touchControls.classList.add('hidden');
    menuOverlay.classList.remove('hidden');

    primaryActionBtn.textContent = '레이스 시작';
    primaryActionBtn.className =
      'px-4 sm:px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md';
  }

  // ==========================================================================
  // 9. SPAWNING UTILITIES
  // ==========================================================================
  function spawnTraffic() {
    if (!renderer) return;
    const types = ['sedan', 'sports', 'truck', 'police', 'taxi'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    const occupiedLanes = trafficCars.filter((c) => c.y < 150).map((c) => c.lane);
    const availableLanes = [0, 1, 2, 3].filter((l) => !occupiedLanes.includes(l));
    if (availableLanes.length === 0) return;

    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const x = renderer.getLaneCenter(lane);

    let width = 44;
    let height = 80;
    let speed = 65 + Math.random() * 35;
    let color = '#3b82f6';

    if (chosenType === 'truck') {
      width = 48;
      height = 120;
      speed = 50 + Math.random() * 20;
      color = '#475569';
    } else if (chosenType === 'sports') {
      width = 46;
      height = 82;
      speed = 85 + Math.random() * 35;
      color = '#f59e0b';
    } else if (chosenType === 'police') {
      width = 46;
      height = 84;
      speed = 80 + Math.random() * 25;
      color = '#0f172a';
    } else if (chosenType === 'taxi') {
      width = 44;
      height = 80;
      speed = 65 + Math.random() * 25;
      color = '#eab308';
    }

    trafficCars.push({
      id: nextEntityId++,
      x,
      y: -height - 40,
      lane,
      targetLane: lane,
      speed,
      type: chosenType,
      color,
      width,
      height,
      blinkerTimer: 0,
      isChangingLane: false,
      overtaken: false,
    });
  }

  function spawnCollectible() {
    if (!renderer) return;
    const lane = Math.floor(Math.random() * 4);
    const x = renderer.getLaneCenter(lane);
    const rand = Math.random();

    let type = 'coin';
    if (rand < 0.65) type = 'coin';
    else if (rand < 0.78) type = 'nitro';
    else if (rand < 0.88) type = 'repair';
    else if (rand < 0.94) type = 'shield';
    else type = 'magnet';

    collectibles.push({
      id: nextEntityId++,
      x,
      y: -60,
      type,
      width: 24,
      height: 24,
      lane,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  // ==========================================================================
  // 10. REAL-TIME HUD SYNCHRONIZER
  // ==========================================================================
  function updateHUD() {
    if (gameState !== 'PLAYING') return;

    const currentSpeed = Math.round(player.speed);
    hudScore.textContent = stats.score.toLocaleString();
    hudDistance.textContent = Math.round(stats.distance).toLocaleString();
    hudCoins.textContent = stats.coins;
    hudMobileDistance.textContent = `${Math.round(stats.distance)}m`;
    hudMobileCoins.textContent = stats.coins;

    // Combo badge
    if (stats.currentCombo > 1) {
      hudComboBadge.classList.remove('hidden');
      hudComboText.textContent = `x${stats.currentCombo} 콤보`;
    } else {
      hudComboBadge.classList.add('hidden');
    }

    // Health hearts
    let heartsHtml = '';
    for (let i = 0; i < player.maxHealth; i++) {
      if (i < player.health) {
        heartsHtml += '<i data-lucide="heart" class="w-4 h-4 text-rose-500 fill-rose-500"></i>';
      } else {
        heartsHtml += '<i data-lucide="heart" class="w-4 h-4 text-slate-700 fill-slate-800"></i>';
      }
    }
    hudHealthHearts.innerHTML = heartsHtml;

    // Buffs
    if (player.shieldTimer > 0) {
      hudBuffShield.classList.remove('hidden');
      hudBuffShieldTime.textContent = `보호막 ${Math.ceil(player.shieldTimer)}s`;
    } else {
      hudBuffShield.classList.add('hidden');
    }

    if (player.magnetTimer > 0) {
      hudBuffMagnet.classList.remove('hidden');
      hudBuffMagnetTime.textContent = `자석 ${Math.ceil(player.magnetTimer)}s`;
    } else {
      hudBuffMagnet.classList.add('hidden');
    }

    // Speedometer & Gear
    hudSpeed.textContent = currentSpeed;
    const gear =
      currentSpeed < 30
        ? 1
        : currentSpeed < 75
        ? 2
        : currentSpeed < 120
        ? 3
        : currentSpeed < 165
        ? 4
        : currentSpeed < 205
        ? 5
        : 6;
    hudGear.textContent = gear;

    // Nitro Bar
    const nitroRounded = Math.round(player.nitro);
    hudNitroPercent.textContent = `${nitroRounded}%`;
    hudNitroBar.style.width = `${nitroRounded}%`;

    if (player.isBoosting) {
      hudNitroBar.className =
        'h-full bg-gradient-to-r from-cyan-400 to-white transition-all duration-75';
    } else {
      hudNitroBar.className = 'h-full bg-cyan-500 transition-all duration-75';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // 11. MAIN 60FPS GAME LOOP
  // ==========================================================================
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    const parent = canvas ? canvas.parentElement : null;
    const renderW = parent ? parent.clientWidth : 400;
    const renderH = parent ? parent.clientHeight : 600;

    if (renderer) {
      const carConfig = getCarConfig(player.carId);
      const roadBounds = renderer.getRoadBounds();

      if (gameState === 'PLAYING') {
        stats.timeElapsed += deltaTime;

        // Nitro
        const canBoost = inputs.nitro && player.nitro > 2;
        player.isBoosting = canBoost;
        if (canBoost) {
          player.nitro = Math.max(0, player.nitro - deltaTime * 30);
          if (Math.random() < 0.4) sound.playNitro();
        } else {
          player.nitro = Math.min(100, player.nitro + deltaTime * 6);
        }

        // Speed calculation
        const maxSpeed = player.isBoosting ? carConfig.maxSpeed + 35 : carConfig.maxSpeed;
        const targetSpeed = inputs.up ? maxSpeed : inputs.down ? 35 : 90;
        const accelRate =
          (inputs.up ? 45 : 25) * carConfig.acceleration * (player.isBoosting ? 1.8 : 1);

        if (player.speed < targetSpeed) {
          player.speed = Math.min(targetSpeed, player.speed + accelRate * deltaTime);
        } else if (player.speed > targetSpeed) {
          const decelRate = inputs.down ? 95 : 30;
          player.speed = Math.max(targetSpeed, player.speed - decelRate * deltaTime);
        }

        sound.updateEngine(player.speed / 200, player.isBoosting);

        // Steering
        let steerDir = 0;
        if (inputs.left) steerDir -= 1;
        if (inputs.right) steerDir += 1;

        const steerSpeed = 240 * carConfig.handling;
        player.x += steerDir * steerSpeed * deltaTime;

        const targetAngle = steerDir * 0.12;
        player.steeringAngle += (targetAngle - player.steeringAngle) * 0.2;

        // Road boundaries clamp
        const halfW = carConfig.width / 2;
        if (player.x - halfW < roadBounds.left) {
          player.x = roadBounds.left + halfW;
          player.speed = Math.max(40, player.speed * 0.85);
          screenShake = 6;
        } else if (player.x + halfW > roadBounds.right) {
          player.x = roadBounds.right - halfW;
          player.speed = Math.max(40, player.speed * 0.85);
          screenShake = 6;
        }

        // Skidmarks
        if ((inputs.down && player.speed > 80) || (steerDir !== 0 && player.speed > 130)) {
          skidMarks.push({
            x: player.x,
            y: player.y + carConfig.height / 2 - 6,
            alpha: 1.0,
            width: carConfig.width - 10,
          });
        }

        // Exhaust Particles
        if (Math.random() < (player.isBoosting ? 0.9 : 0.3)) {
          particles.push({
            x: player.x + (Math.random() * 12 - 6),
            y: player.y + carConfig.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: 60 + Math.random() * 40,
            size: player.isBoosting ? 4 : 3,
            color: player.isBoosting ? '#38bdf8' : '#94a3b8',
            alpha: 0.8,
            decay: player.isBoosting ? 3.0 : 1.5,
            type: player.isBoosting ? 'fire' : 'smoke',
          });
        }

        // Distance & Base Score
        const speedMps = (player.speed * 1000) / 3600;
        const distanceDelta = speedMps * deltaTime;
        stats.distance += distanceDelta;
        roadOffset += distanceDelta * 18;

        const speedBonus = player.speed > 160 ? 1.5 : 1.0;
        stats.score += Math.round(distanceDelta * 0.5 * speedBonus * stats.currentCombo);

        if (stats.comboTimer > 0) {
          stats.comboTimer -= deltaTime;
          if (stats.comboTimer <= 0) stats.currentCombo = 1;
        }

        // Buff timers
        if (player.shieldTimer > 0) player.shieldTimer = Math.max(0, player.shieldTimer - deltaTime);
        if (player.magnetTimer > 0) player.magnetTimer = Math.max(0, player.magnetTimer - deltaTime);
        if (player.invincibleTimer > 0)
          player.invincibleTimer = Math.max(0, player.invincibleTimer - deltaTime);

        // Traffic Spawning
        spawnTimer += deltaTime;
        const spawnInterval = difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 2.5 : 1.7;
        if (spawnTimer > spawnInterval) {
          spawnTimer = 0;
          spawnTraffic();
        }

        // Collectible Spawning
        collectibleTimer += deltaTime;
        if (collectibleTimer > 2.8) {
          collectibleTimer = 0;
          spawnCollectible();
        }

        // Traffic Update
        for (let i = trafficCars.length - 1; i >= 0; i--) {
          const car = trafficCars[i];
          const relativeSpeedMps = ((player.speed - car.speed) * 1000) / 3600;
          car.y += relativeSpeedMps * deltaTime * 18;

          if (!car.isChangingLane && Math.random() < 0.005 && car.type === 'sports') {
            const possibleLane =
              car.lane === 0 ? 1 : car.lane === 3 ? 2 : Math.random() < 0.5 ? car.lane - 1 : car.lane + 1;
            car.targetLane = possibleLane;
            car.isChangingLane = true;
            car.blinkerTimer = 0;
          }

          if (car.isChangingLane) {
            car.blinkerTimer += deltaTime;
            const targetX = renderer.getLaneCenter(car.targetLane);
            car.x += (targetX - car.x) * 0.08;
            if (Math.abs(car.x - targetX) < 2) {
              car.lane = car.targetLane;
              car.isChangingLane = false;
            }
          }

          // Near Miss
          if (!car.overtaken && car.y > player.y - 20 && car.y < player.y + 40) {
            const lateralDist = Math.abs(player.x - car.x);
            const nearMissThreshold = (carConfig.width + car.width) / 2 + 18;
            if (lateralDist < nearMissThreshold) {
              car.overtaken = true;
              stats.nearMisses++;
              stats.currentCombo = Math.min(5, stats.currentCombo + 1);
              stats.comboTimer = 3.5;
              const bonus = 250 * stats.currentCombo;
              stats.score += bonus;
              sound.playNearMiss();

              floatingTexts.push({
                id: nextEntityId++,
                text: `근접 추월! +${bonus}`,
                x: player.x,
                y: player.y - 45,
                alpha: 1.0,
                color: '#f59e0b',
                size: 15,
              });
            }
          }

          // Collision
          const hitW = (carConfig.width + car.width) * 0.42;
          const hitH = (carConfig.height + car.height) * 0.42;
          const isColliding = Math.abs(player.x - car.x) < hitW && Math.abs(player.y - car.y) < hitH;

          if (isColliding && player.invincibleTimer <= 0) {
            screenShake = 14;
            for (let p = 0; p < 16; p++) {
              particles.push({
                x: (player.x + car.x) / 2,
                y: (player.y + car.y) / 2,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                size: 3 + Math.random() * 4,
                color: Math.random() < 0.5 ? '#ef4444' : '#e2e8f0',
                alpha: 1.0,
                decay: 2.2,
                type: 'spark',
              });
            }

            if (player.shieldTimer > 0) {
              player.shieldTimer = 0;
              player.invincibleTimer = 1.6;
              sound.playShieldDeflect();
              floatingTexts.push({
                id: nextEntityId++,
                text: '방어막 흡수!',
                x: player.x,
                y: player.y - 40,
                alpha: 1.0,
                color: '#a855f7',
                size: 14,
              });
            } else {
              player.health--;
              player.invincibleTimer = 1.8;
              player.speed = Math.max(35, player.speed * 0.6);
              sound.playCrash();

              if (player.health <= 0) {
                endGame();
                break;
              }
            }
          }

          if (car.y > renderH + 150 || car.y < -350) {
            trafficCars.splice(i, 1);
          }
        }

        // Collectibles Update
        for (let i = collectibles.length - 1; i >= 0; i--) {
          const c = collectibles[i];
          const relativeSpeedMps = (player.speed * 1000) / 3600;
          c.y += relativeSpeedMps * deltaTime * 18;
          c.bobOffset += deltaTime * 5;

          if (player.magnetTimer > 0 && c.type === 'coin') {
            const dx = player.x - c.x;
            const dy = player.y - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              c.x += (dx / dist) * 280 * deltaTime;
              c.y += (dy / dist) * 280 * deltaTime;
            }
          }

          const distToPlayer = Math.hypot(player.x - c.x, player.y - c.y);
          if (distToPlayer < 36 && !c.collected) {
            c.collected = true;

            for (let p = 0; p < 8; p++) {
              particles.push({
                x: c.x,
                y: c.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                size: 3,
                color: '#fbbf24',
                alpha: 1.0,
                decay: 2.5,
                type: 'sparkle',
              });
            }

            if (c.type === 'coin') {
              stats.coins++;
              stats.score += 50 * stats.currentCombo;
              sound.playCoin();
              floatingTexts.push({
                id: nextEntityId++,
                text: '+50 🪙',
                x: c.x,
                y: c.y,
                alpha: 1.0,
                color: '#fbbf24',
                size: 13,
              });
            } else if (c.type === 'nitro') {
              player.nitro = Math.min(100, player.nitro + 50);
              sound.playPowerup();
              floatingTexts.push({
                id: nextEntityId++,
                text: '부스트 충전! 🔥',
                x: c.x,
                y: c.y,
                alpha: 1.0,
                color: '#38bdf8',
                size: 14,
              });
            } else if (c.type === 'repair') {
              player.health = Math.min(player.maxHealth, player.health + 1);
              sound.playPowerup();
              floatingTexts.push({
                id: nextEntityId++,
                text: '차량 수리 완료 ❤️',
                x: c.x,
                y: c.y,
                alpha: 1.0,
                color: '#10b981',
                size: 14,
              });
            } else if (c.type === 'shield') {
              player.shieldTimer = 8.0;
              sound.playPowerup();
              floatingTexts.push({
                id: nextEntityId++,
                text: '에너지 쉴드 발동! 🛡️',
                x: c.x,
                y: c.y,
                alpha: 1.0,
                color: '#a855f7',
                size: 14,
              });
            } else if (c.type === 'magnet') {
              player.magnetTimer = 9.0;
              sound.playPowerup();
              floatingTexts.push({
                id: nextEntityId++,
                text: '코인 자석 활성! 🧲',
                x: c.x,
                y: c.y,
                alpha: 1.0,
                color: '#ef4444',
                size: 14,
              });
            }

            collectibles.splice(i, 1);
            continue;
          }

          if (c.y > renderH + 50) {
            collectibles.splice(i, 1);
          }
        }

        // Day / Sunset / Night cycle
        const cycle = Math.floor(stats.distance / 1200) % 3;
        if (cycle === 0) environment = 'day';
        else if (cycle === 1) environment = 'sunset';
        else if (cycle === 2) environment = 'night';

        updateHUD();
      } else if (gameState === 'MENU') {
        roadOffset += 12;
        player.speed = 100;
        player.x = renderW / 2 + Math.sin(timestamp / 1000) * 45;
        player.steeringAngle = Math.cos(timestamp / 1000) * 0.05;
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.alpha -= p.decay * deltaTime;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // Skidmarks
      for (let i = skidMarks.length - 1; i >= 0; i--) {
        const m = skidMarks[i];
        m.alpha -= deltaTime * 0.4;
        m.y += ((player.speed * 1000) / 3600) * deltaTime * 18;
        if (m.alpha <= 0 || m.y > renderH + 50) skidMarks.splice(i, 1);
      }

      // Floating Texts
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y -= 45 * deltaTime;
        t.alpha -= deltaTime * 0.8;
        if (t.alpha <= 0) floatingTexts.splice(i, 1);
      }

      // Screen Shake Decay
      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - deltaTime * 30);
      }

      // RENDER
      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
      }

      renderer.drawRoad(roadOffset, environment, player.speed, stats.distance);
      renderer.drawSkidMarks(skidMarks);

      for (const item of collectibles) renderer.drawCollectible(item);
      for (const traffic of trafficCars) renderer.drawTrafficCar(traffic, environment);

      renderer.drawPlayerCar(player, carConfig, environment, inputs.down);
      renderer.drawParticles(particles);
      renderer.drawFloatingTexts(floatingTexts);

      ctx.restore();
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  // ==========================================================================
  // 12. GARAGE MODAL CONTROLLER
  // ==========================================================================
  function renderGarage() {
    const currentCar = getCarConfig(previewCarId);
    const isUnlocked = unlockedCars.includes(currentCar.id);

    if (garageTotalCoins) garageTotalCoins.textContent = totalCoins.toLocaleString();
    if (garageCarTitle) garageCarTitle.textContent = currentCar.name;
    if (garageCarSubtitle) garageCarSubtitle.textContent = currentCar.subtitle;

    // Stat bars
    if (garageStatSpeed) garageStatSpeed.textContent = `${currentCar.maxSpeed} km/h`;
    if (garageBarSpeed) garageBarSpeed.style.width = `${(currentCar.maxSpeed / 250) * 100}%`;

    if (garageStatAccel)
      garageStatAccel.textContent = `${Math.round((currentCar.acceleration / 1.5) * 100)}%`;
    if (garageBarAccel)
      garageBarAccel.style.width = `${(currentCar.acceleration / 1.5) * 100}%`;

    if (garageStatHandling)
      garageStatHandling.textContent = `${Math.round((currentCar.handling / 1.4) * 100)}%`;
    if (garageBarHandling)
      garageBarHandling.style.width = `${(currentCar.handling / 1.4) * 100}%`;

    if (garageStatDurability) garageStatDurability.textContent = `${currentCar.durability} HP`;
    if (garageBarDurability)
      garageBarDurability.style.width = `${(currentCar.durability / 5) * 100}%`;

    // Car Preview Render
    if (garageCarPreview) {
      garageCarPreview.style.width = `${currentCar.width}px`;
      garageCarPreview.style.height = `${currentCar.height}px`;
      garageCarPreview.innerHTML = `
        <div class="absolute -left-1 top-3 w-1.5 h-4 bg-slate-950 rounded-xs"></div>
        <div class="absolute -right-1 top-3 w-1.5 h-4 bg-slate-950 rounded-xs"></div>
        <div class="absolute -left-1 bottom-3 w-1.5 h-4 bg-slate-950 rounded-xs"></div>
        <div class="absolute -right-1 bottom-3 w-1.5 h-4 bg-slate-950 rounded-xs"></div>
        <div class="w-full h-full rounded-xl relative shadow-lg overflow-hidden border border-white/20" style="background-color: ${previewColor}">
          <div class="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2" style="background-color: ${currentCar.accentColor}"></div>
          <div class="absolute top-4 left-2 right-2 h-4 bg-slate-950 rounded-sm"></div>
          <div class="absolute top-9 left-2.5 right-2.5 h-5 rounded-xs" style="background-color: ${previewColor}"></div>
          <div class="absolute bottom-5 left-2 right-2 h-3 bg-slate-950 rounded-xs"></div>
          <div class="absolute bottom-1 left-1 right-1 h-1.5 bg-slate-950 rounded-xs"></div>
        </div>
      `;
    }

    // Car Selection Tabs
    if (garageCarTabs) {
      garageCarTabs.innerHTML = CAR_MODELS.map((car) => {
        const carUnlocked = unlockedCars.includes(car.id);
        const isSelected = previewCarId === car.id;
        return `
          <button class="garage-tab-btn p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
            isSelected
              ? 'bg-slate-800 border-rose-500 shadow-md ring-1 ring-rose-500/50'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }" data-car-id="${car.id}">
            <div class="flex items-center justify-between w-full mb-2">
              <span class="text-xs font-bold text-slate-200 truncate">${car.name.split(' (')[0]}</span>
              ${!carUnlocked ? '<i data-lucide="lock" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>' : ''}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
              <span>최고 ${car.maxSpeed}</span>
              <span class="text-[9px]">km/h</span>
            </div>
          </button>
        `;
      }).join('');
    }

    // Color Swatches
    if (garageColorSwatches) {
      garageColorSwatches.innerHTML = COLOR_PALETTES.map((color) => {
        const isActive = previewColor === color.value;
        return `
          <button class="garage-color-btn w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center ${
            isActive ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
          }" style="background-color: ${color.value}" data-color="${color.value}" title="${color.name}">
            ${isActive ? '<i data-lucide="check" class="w-4 h-4 text-white drop-shadow"></i>' : ''}
          </button>
        `;
      }).join('');
    }

    // Bottom action
    if (isUnlocked) {
      if (garageUnlockHint) {
        garageUnlockHint.innerHTML =
          '<span class="text-emerald-400 font-medium">✓ 선택된 차량으로 주행할 준비가 되었습니다</span>';
      }
      if (garageActionContainer) {
        garageActionContainer.innerHTML = `
          <button id="garage-confirm-btn" class="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap">
            차량 적용 및 나가기
          </button>
        `;
      }
    } else {
      if (garageUnlockHint) {
        garageUnlockHint.innerHTML = `<span>잠금 해제 필요: <strong class="text-amber-400">${currentCar.cost} 코인</strong></span>`;
      }
      const canAfford = totalCoins >= currentCar.cost;
      if (garageActionContainer) {
        garageActionContainer.innerHTML = `
          <button id="garage-unlock-btn" class="px-5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            canAfford
              ? 'text-white bg-amber-600 hover:bg-amber-500 shadow-md'
              : 'text-slate-500 bg-slate-800 cursor-not-allowed'
          }" ${!canAfford ? 'disabled' : ''}>
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>${currentCar.cost} 코인으로 잠금 해제</span>
          </button>
        `;
      }
    }

    if (window.lucide) window.lucide.createIcons();

    // Reattach listeners
    document.querySelectorAll('.garage-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-car-id');
        if (id) {
          previewCarId = id;
          renderGarage();
        }
      });
    });

    document.querySelectorAll('.garage-color-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const col = btn.getAttribute('data-color');
        if (col) {
          previewColor = col;
          renderGarage();
        }
      });
    });

    const confirmBtn = document.getElementById('garage-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        selectedCarId = previewCarId;
        selectedColor = previewColor;
        saveCarSelection(selectedCarId, selectedColor);
        syncCarSetup();
        garageModal.classList.add('hidden');
      });
    }

    const unlockBtn = document.getElementById('garage-unlock-btn');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        const car = getCarConfig(previewCarId);
        if (unlockCarInStorage(car.id, car.cost)) {
          totalCoins -= car.cost;
          unlockedCars.push(car.id);
          selectedCarId = car.id;
          selectedColor = previewColor;
          saveCarSelection(selectedCarId, selectedColor);
          syncCarSetup();
          sound.playPowerup();
          renderGarage();
        }
      });
    }
  }

  function openGarage() {
    previewCarId = selectedCarId;
    previewColor = selectedColor;
    renderGarage();
    garageModal.classList.remove('hidden');
  }

  // ==========================================================================
  // 13. LEADERBOARD MODAL CONTROLLER
  // ==========================================================================
  function renderLeaderboard() {
    const data = loadGameData();
    if (leaderboardHighScore) leaderboardHighScore.textContent = data.highScore.toLocaleString();
    if (leaderboardBestDistance)
      leaderboardBestDistance.textContent = data.bestDistance.toLocaleString();

    if (leaderboardList) {
      if (data.recentScores.length === 0) {
        leaderboardList.innerHTML = `
          <div class="p-8 text-center text-xs text-slate-500 bg-slate-950/30 border border-slate-800/60 rounded-xl">
            아직 저장된 레이싱 기록이 없습니다. 지금 첫 주행을 시작해보세요!
          </div>
        `;
      } else {
        leaderboardList.innerHTML = data.recentScores
          .map((rec, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
            return `
              <div class="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-xs shrink-0 bg-slate-800 text-slate-200">
                    ${medal}
                  </div>
                  <div>
                    <div class="font-display font-bold text-sm text-white tabular-nums">
                      ${rec.score.toLocaleString()}점
                    </div>
                    <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>${rec.carName.split(' (')[0]}</span>
                      <span>·</span>
                      <span>${rec.distance}m</span>
                      <span>·</span>
                      <span>🪙 ${rec.coins}</span>
                    </div>
                  </div>
                </div>
                <div class="text-[10px] text-slate-500 tabular-nums">
                  ${rec.date}
                </div>
              </div>
            `;
          })
          .join('');
      }
    }
  }

  function openLeaderboard() {
    renderLeaderboard();
    leaderboardModal.classList.remove('hidden');
  }

  // ==========================================================================
  // 14. EVENT LISTENERS
  // ==========================================================================
  // Keyboard Listeners
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputs.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputs.down = true;

    if (e.key === ' ') {
      inputs.nitro = true;
      if (gameState === 'GAME_OVER') startGame();
    }

    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputs.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') inputs.down = false;
    if (e.key === ' ') inputs.nitro = false;
  });

  // Primary Start / Pause button
  if (primaryActionBtn) {
    primaryActionBtn.addEventListener('click', () => {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
      else startGame();
    });
  }

  // Sound toggles
  if (navSoundBtn) {
    navSoundBtn.addEventListener('click', () => {
      sound.toggleMute();
      updateSoundUI();
    });
  }

  if (mobileSoundBtn) {
    mobileSoundBtn.addEventListener('click', () => {
      sound.toggleMute();
      updateSoundUI();
    });
  }

  // Menu Start button
  if (menuStartBtn) menuStartBtn.addEventListener('click', startGame);
  if (menuOpenGarageBtn) menuOpenGarageBtn.addEventListener('click', openGarage);
  if (navGarageBtn) navGarageBtn.addEventListener('click', openGarage);

  // Difficulty tabs in Title Menu
  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const diff = btn.getAttribute('data-diff');
      if (diff) {
        difficulty = diff;
        document.querySelectorAll('.diff-btn').forEach((b) => {
          b.className =
            'diff-btn px-3 py-1.5 rounded-lg transition-colors text-slate-400 hover:text-white';
        });
        if (diff === 'easy') {
          btn.className = 'diff-btn px-3 py-1.5 rounded-lg transition-colors bg-emerald-600 text-white font-bold';
        } else if (diff === 'normal') {
          btn.className = 'diff-btn px-3 py-1.5 rounded-lg transition-colors bg-cyan-600 text-white font-bold';
        } else {
          btn.className = 'diff-btn px-3 py-1.5 rounded-lg transition-colors bg-rose-600 text-white font-bold';
        }
      }
    });
  });

  // Paused Modal buttons
  if (pauseResumeBtn) pauseResumeBtn.addEventListener('click', resumeGame);
  if (pauseRestartBtn) pauseRestartBtn.addEventListener('click', startGame);
  if (pauseMenuBtn) pauseMenuBtn.addEventListener('click', returnToMenu);

  // Game Over Modal buttons
  if (gameOverRestartBtn) gameOverRestartBtn.addEventListener('click', startGame);
  if (gameOverGarageBtn) {
    gameOverGarageBtn.addEventListener('click', () => {
      gameOverModal.classList.add('hidden');
      openGarage();
    });
  }

  // Garage Modal Close
  if (garageCloseBtn) {
    garageCloseBtn.addEventListener('click', () => {
      garageModal.classList.add('hidden');
    });
  }

  // How to Play Modal
  if (navHowToPlayBtn) {
    navHowToPlayBtn.addEventListener('click', () => {
      howToPlayModal.classList.remove('hidden');
    });
  }
  if (howToPlayCloseBtn) {
    howToPlayCloseBtn.addEventListener('click', () => {
      howToPlayModal.classList.add('hidden');
    });
  }
  if (howToPlayConfirmBtn) {
    howToPlayConfirmBtn.addEventListener('click', () => {
      howToPlayModal.classList.add('hidden');
    });
  }

  // Leaderboard Modal
  if (navLeaderboardBtn) navLeaderboardBtn.addEventListener('click', openLeaderboard);
  if (leaderboardCloseBtn) {
    leaderboardCloseBtn.addEventListener('click', () => {
      leaderboardModal.classList.add('hidden');
    });
  }
  if (leaderboardConfirmBtn) {
    leaderboardConfirmBtn.addEventListener('click', () => {
      leaderboardModal.classList.add('hidden');
    });
  }
  if (leaderboardResetBtn) {
    leaderboardResetBtn.addEventListener('click', () => {
      if (confirm('모든 최고 기록을 초기화하시겠습니까?')) {
        resetStoredScores();
        highScore = 0;
        bestDistance = 0;
        renderLeaderboard();
      }
    });
  }

  // Mobile Touch Controls
  function bindTouch(btn, controlKey) {
    if (!btn) return;
    const start = (e) => {
      e.preventDefault();
      inputs[controlKey] = true;
    };
    const end = (e) => {
      e.preventDefault();
      inputs[controlKey] = false;
    };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  }

  bindTouch(touchLeft, 'left');
  bindTouch(touchRight, 'right');
  bindTouch(touchGas, 'up');
  bindTouch(touchBrake, 'down');
  bindTouch(touchNitro, 'nitro');

  // Initialize Lucide icons on page load
  if (window.lucide) {
    window.lucide.createIcons();
  }
})();
