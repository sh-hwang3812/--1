import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CarModelId,
  Collectible,
  GameEnvironment,
  GameState,
  GameStats,
  HighScoreRecord,
  InputControls,
  Particle,
  PlayerState,
  SkidMark,
  TrafficCar,
  TrafficType,
} from './game/types';
import { CAR_MODELS, getCarConfig } from './game/cars';
import { sound } from './game/audio';
import {
  loadGameData,
  saveCarSelection,
  saveRunResult,
  unlockCar,
} from './game/storage';
import { FloatingText, GameRenderer } from './game/renderer';
import { Header } from './components/Header';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { GarageModal } from './components/GarageModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Play, Flame, Car, Trophy, HelpCircle, Sun, Moon, Sunset } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [environment, setEnvironment] = useState<GameEnvironment>('day');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Modals
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Local storage state
  const [highScore, setHighScore] = useState(0);
  const [bestDistance, setBestDistance] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [recentScores, setRecentScores] = useState<HighScoreRecord[]>([]);
  const [unlockedCars, setUnlockedCars] = useState<CarModelId[]>(['thunderbolt']);
  const [selectedCarId, setSelectedCarId] = useState<CarModelId>('thunderbolt');
  const [selectedColor, setSelectedColor] = useState('#e11d48');
  const [isMuted, setIsMuted] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Active game run stats (for React HUD rendering)
  const [hudStats, setHudStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    nearMisses: 0,
    timeElapsed: 0,
    currentCombo: 1,
    comboTimer: 0,
  });

  const [hudPlayer, setHudPlayer] = useState<PlayerState>({
    x: 0,
    y: 0,
    speed: 0,
    targetSpeed: 0,
    steeringAngle: 0,
    health: 3,
    maxHealth: 3,
    nitro: 50,
    isBoosting: false,
    shieldTimer: 0,
    magnetTimer: 0,
    carId: 'thunderbolt',
    carColor: '#e11d48',
    invincibleTimer: 0,
  });

  // Game loop internal references
  const inputsRef = useRef<InputControls>({
    left: false,
    right: false,
    up: false,
    down: false,
    nitro: false,
  });

  const playerRef = useRef<PlayerState>({
    x: 0,
    y: 0,
    speed: 0,
    targetSpeed: 0,
    steeringAngle: 0,
    health: 3,
    maxHealth: 3,
    nitro: 50,
    isBoosting: false,
    shieldTimer: 0,
    magnetTimer: 0,
    carId: 'thunderbolt',
    carColor: '#e11d48',
    invincibleTimer: 0,
  });

  const statsRef = useRef<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    nearMisses: 0,
    timeElapsed: 0,
    currentCombo: 1,
    comboTimer: 0,
  });

  const trafficCarsRef = useRef<TrafficCar[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const skidMarksRef = useRef<SkidMark[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const roadOffsetRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const nextEntityIdRef = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  // Initialize data from local storage
  useEffect(() => {
    const data = loadGameData();
    setHighScore(data.highScore);
    setBestDistance(data.bestDistance);
    setTotalCoins(data.totalCoins);
    setRecentScores(data.recentScores);
    setUnlockedCars(data.unlockedCars);
    setSelectedCarId(data.selectedCar);
    setSelectedColor(data.selectedColor);
    setIsMuted(sound.getMuted());
  }, []);

  // Update player vehicle properties when selected car/color changes
  useEffect(() => {
    const config = getCarConfig(selectedCarId);
    playerRef.current.carId = selectedCarId;
    playerRef.current.carColor = selectedColor;
    playerRef.current.maxHealth = config.durability;
    if (gameState === 'MENU') {
      playerRef.current.health = config.durability;
    }
  }, [selectedCarId, selectedColor, gameState]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputsRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputsRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputsRef.current.up = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputsRef.current.down = true;
      }
      if (e.key === ' ') {
        inputsRef.current.nitro = true;
        if (gameState === 'GAME_OVER') {
          handleStartGame();
        }
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          handlePauseGame();
        } else if (gameState === 'PAUSED') {
          handleResumeGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputsRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputsRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputsRef.current.up = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        inputsRef.current.down = false;
      }
      if (e.key === ' ') {
        inputsRef.current.nitro = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Touch control input handler
  const handleTouchControl = (key: keyof InputControls, value: boolean) => {
    inputsRef.current[key] = value;
  };

  // Start a fresh game run
  const handleStartGame = () => {
    const config = getCarConfig(selectedCarId);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Reset player position and stats
    playerRef.current = {
      x: w / 2,
      y: h - 140,
      speed: 70,
      targetSpeed: 100,
      steeringAngle: 0,
      health: config.durability,
      maxHealth: config.durability,
      nitro: 50,
      isBoosting: false,
      shieldTimer: 0,
      magnetTimer: 0,
      carId: selectedCarId,
      carColor: selectedColor,
      invincibleTimer: 0,
    };

    statsRef.current = {
      score: 0,
      distance: 0,
      coins: 0,
      nearMisses: 0,
      timeElapsed: 0,
      currentCombo: 1,
      comboTimer: 0,
    };

    trafficCarsRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    skidMarksRef.current = [];
    floatingTextsRef.current = [];
    roadOffsetRef.current = 0;
    screenShakeRef.current = 0;

    setIsNewHighScore(false);
    setGameState('PLAYING');
    sound.startEngine();
  };

  const handlePauseGame = () => {
    setGameState('PAUSED');
    sound.stopEngine();
  };

  const handleResumeGame = () => {
    setGameState('PLAYING');
    sound.startEngine();
  };

  const handleEndGame = useCallback(() => {
    sound.stopEngine();
    sound.playCrash();

    const carConfig = getCarConfig(selectedCarId);
    const result = saveRunResult(
      statsRef.current.score,
      Math.round(statsRef.current.distance),
      statsRef.current.coins,
      carConfig.name
    );

    setIsNewHighScore(result.isNewHighScore);
    setHighScore((prev) => Math.max(prev, statsRef.current.score));
    setBestDistance((prev) => Math.max(prev, Math.round(statsRef.current.distance)));
    setTotalCoins(result.updatedTotalCoins);

    const reloaded = loadGameData();
    setRecentScores(reloaded.recentScores);

    setGameState('GAME_OVER');
  }, [selectedCarId]);

  // Traffic spawning helper
  const spawnTraffic = useCallback(
    (canvasHeight: number) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const numLanes = 4;
      const types: TrafficType[] = ['sedan', 'sports', 'truck', 'police', 'taxi'];
      const chosenType = types[Math.floor(Math.random() * types.length)];

      // Pick lane with fewest cars near top
      const occupiedLanes = trafficCarsRef.current
        .filter((c) => c.y < 150)
        .map((c) => c.lane);
      const availableLanes = [0, 1, 2, 3].filter((l) => !occupiedLanes.includes(l));
      if (availableLanes.length === 0) return;

      const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      const x = renderer.getLaneCenter(lane);

      let width = 44;
      let height = 80;
      let speed = 65 + Math.random() * 35; // base km/h
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

      trafficCarsRef.current.push({
        id: nextEntityIdRef.current++,
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
    },
    []
  );

  // Collectible spawning helper
  const spawnCollectible = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const lane = Math.floor(Math.random() * 4);
    const x = renderer.getLaneCenter(lane);

    const rand = Math.random();
    let type: Collectible['type'] = 'coin';

    if (rand < 0.65) {
      type = 'coin';
    } else if (rand < 0.78) {
      type = 'nitro';
    } else if (rand < 0.88) {
      type = 'repair';
    } else if (rand < 0.94) {
      type = 'shield';
    } else {
      type = 'magnet';
    }

    collectiblesRef.current.push({
      id: nextEntityIdRef.current++,
      x,
      y: -60,
      type,
      width: 24,
      height: 24,
      lane,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }, []);

  // Main Canvas Animation and Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI crisp canvas rendering
    const handleResize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      if (!rendererRef.current) {
        rendererRef.current = new GameRenderer(ctx, rect.width, rect.height);
      } else {
        rendererRef.current.resize(rect.width, rect.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial vehicle setup for MENU mode
    if (playerRef.current.x === 0) {
      playerRef.current.x = (canvas.parentElement?.clientWidth || 400) / 2;
      playerRef.current.y = (canvas.parentElement?.clientHeight || 600) - 140;
    }

    let spawnTimer = 0;
    let collectibleTimer = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const container = canvas.parentElement;
      const renderW = container ? container.clientWidth : 400;
      const renderH = container ? container.clientHeight : 600;
      const renderer = rendererRef.current;

      if (!renderer) {
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const player = playerRef.current;
      const stats = statsRef.current;
      const inputs = inputsRef.current;
      const carConfig = getCarConfig(player.carId);
      const roadBounds = renderer.getRoadBounds();

      // ==========================================
      // 1. UPDATE PHYSICS & ENTITIES
      // ==========================================
      if (gameState === 'PLAYING') {
        stats.timeElapsed += deltaTime;

        // Nitro management
        const canBoost = inputs.nitro && player.nitro > 2;
        player.isBoosting = canBoost;

        if (canBoost) {
          player.nitro = Math.max(0, player.nitro - deltaTime * 30);
          if (Math.random() < 0.4) sound.playNitro();
        } else {
          // Slow passive nitro regeneration
          player.nitro = Math.min(100, player.nitro + deltaTime * 6);
        }

        // Acceleration / Deceleration
        const maxSpeed = player.isBoosting
          ? carConfig.maxSpeed + 35
          : carConfig.maxSpeed;
        const targetSpeed = inputs.up
          ? maxSpeed
          : inputs.down
          ? 35
          : 90;

        const accelRate = (inputs.up ? 45 : 25) * carConfig.acceleration * (player.isBoosting ? 1.8 : 1);
        if (player.speed < targetSpeed) {
          player.speed = Math.min(targetSpeed, player.speed + accelRate * deltaTime);
        } else if (player.speed > targetSpeed) {
          const decelRate = inputs.down ? 95 : 30;
          player.speed = Math.max(targetSpeed, player.speed - decelRate * deltaTime);
        }

        // Modulate Audio Engine
        sound.updateEngine(player.speed / 200, player.isBoosting);

        // Steering Physics & Lateral Movement
        let steerDir = 0;
        if (inputs.left) steerDir -= 1;
        if (inputs.right) steerDir += 1;

        const steerSpeed = 240 * carConfig.handling;
        player.x += steerDir * steerSpeed * deltaTime;

        // Visual tilt angle during steering
        const targetAngle = steerDir * 0.12;
        player.steeringAngle += (targetAngle - player.steeringAngle) * 0.2;

        // Road boundaries clamp & damage on guard rail crash
        const halfW = carConfig.width / 2;
        if (player.x - halfW < roadBounds.left) {
          player.x = roadBounds.left + halfW;
          player.speed = Math.max(40, player.speed * 0.85);
          screenShakeRef.current = 6;
        } else if (player.x + halfW > roadBounds.right) {
          player.x = roadBounds.right - halfW;
          player.speed = Math.max(40, player.speed * 0.85);
          screenShakeRef.current = 6;
        }

        // Skidmarks when turning sharply at high speed or hard braking
        if ((inputs.down && player.speed > 80) || (steerDir !== 0 && player.speed > 130)) {
          skidMarksRef.current.push({
            x: player.x,
            y: player.y + carConfig.height / 2 - 6,
            alpha: 1.0,
            width: carConfig.width - 10,
          });
        }

        // Exhaust Particles
        if (Math.random() < (player.isBoosting ? 0.9 : 0.3)) {
          particlesRef.current.push({
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

        // Road Distance & Base Score
        const speedMps = (player.speed * 1000) / 3600;
        const distanceDelta = speedMps * deltaTime;
        stats.distance += distanceDelta;
        roadOffsetRef.current += distanceDelta * 18;

        // Progressive score
        const speedBonus = player.speed > 160 ? 1.5 : 1.0;
        stats.score += Math.round(distanceDelta * 0.5 * speedBonus * stats.currentCombo);

        // Combo timer countdown
        if (stats.comboTimer > 0) {
          stats.comboTimer -= deltaTime;
          if (stats.comboTimer <= 0) {
            stats.currentCombo = 1;
          }
        }

        // Buff Timers countdown
        if (player.shieldTimer > 0) player.shieldTimer = Math.max(0, player.shieldTimer - deltaTime);
        if (player.magnetTimer > 0) player.magnetTimer = Math.max(0, player.magnetTimer - deltaTime);
        if (player.invincibleTimer > 0) player.invincibleTimer = Math.max(0, player.invincibleTimer - deltaTime);

        // Spawn Traffic
        spawnTimer += deltaTime;
        const spawnInterval = difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 2.5 : 1.7;
        if (spawnTimer > spawnInterval) {
          spawnTimer = 0;
          spawnTraffic(renderH);
        }

        // Spawn Collectibles
        collectibleTimer += deltaTime;
        if (collectibleTimer > 2.8) {
          collectibleTimer = 0;
          spawnCollectible();
        }

        // Update Traffic Cars
        for (let i = trafficCarsRef.current.length - 1; i >= 0; i--) {
          const car = trafficCarsRef.current[i];
          const relativeSpeedMps = ((player.speed - car.speed) * 1000) / 3600;
          car.y += relativeSpeedMps * deltaTime * 18;

          // Traffic lane change AI
          if (!car.isChangingLane && Math.random() < 0.005 && car.type === 'sports') {
            const possibleLane = car.lane === 0 ? 1 : car.lane === 3 ? 2 : Math.random() < 0.5 ? car.lane - 1 : car.lane + 1;
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

          // Near Miss Detection (Overtaking closely without crash)
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

              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
                text: `근접 추월! +${bonus}`,
                x: player.x,
                y: player.y - 45,
                alpha: 1.0,
                color: '#f59e0b',
                size: 15,
              });
            }
          }

          // Collision Detection (Player vs Traffic)
          const hitW = (carConfig.width + car.width) * 0.42;
          const hitH = (carConfig.height + car.height) * 0.42;
          const isColliding = Math.abs(player.x - car.x) < hitW && Math.abs(player.y - car.y) < hitH;

          if (isColliding && player.invincibleTimer <= 0) {
            screenShakeRef.current = 14;

            // Generate crash debris particles
            for (let p = 0; p < 16; p++) {
              particlesRef.current.push({
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
              // Shield absorbs the collision
              player.shieldTimer = 0;
              player.invincibleTimer = 1.6;
              sound.playShieldDeflect();
              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
                text: '방어막 흡수!',
                x: player.x,
                y: player.y - 40,
                alpha: 1.0,
                color: '#a855f7',
                size: 14,
              });
            } else {
              // Take damage
              player.health--;
              player.invincibleTimer = 1.8;
              player.speed = Math.max(35, player.speed * 0.6);
              sound.playCrash();

              if (player.health <= 0) {
                handleEndGame();
                break;
              }
            }
          }

          // Remove traffic that scrolled offscreen
          if (car.y > renderH + 150 || car.y < -350) {
            trafficCarsRef.current.splice(i, 1);
          }
        }

        // Update Collectibles
        for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
          const c = collectiblesRef.current[i];
          const relativeSpeedMps = (player.speed * 1000) / 3600;
          c.y += relativeSpeedMps * deltaTime * 18;
          c.bobOffset += deltaTime * 5;

          // Magnet suction logic
          if (player.magnetTimer > 0 && c.type === 'coin') {
            const dx = player.x - c.x;
            const dy = player.y - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              c.x += (dx / dist) * 280 * deltaTime;
              c.y += (dy / dist) * 280 * deltaTime;
            }
          }

          // Collectible Pickup Collision
          const distToPlayer = Math.hypot(player.x - c.x, player.y - c.y);
          if (distToPlayer < 36 && !c.collected) {
            c.collected = true;

            // Sparkle burst
            for (let p = 0; p < 8; p++) {
              particlesRef.current.push({
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
              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
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
              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
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
              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
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
              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
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
              floatingTextsRef.current.push({
                id: nextEntityIdRef.current++,
                text: '코인 자석 활성! 🧲',
                x: c.x,
                y: c.y,
                alpha: 1.0,
                color: '#ef4444',
                size: 14,
              });
            }

            collectiblesRef.current.splice(i, 1);
            continue;
          }

          if (c.y > renderH + 50) {
            collectiblesRef.current.splice(i, 1);
          }
        }

        // Automatic Day / Sunset / Night transition based on distance
        const cycle = Math.floor(stats.distance / 1200) % 3;
        if (cycle === 0 && environment !== 'day') setEnvironment('day');
        if (cycle === 1 && environment !== 'sunset') setEnvironment('sunset');
        if (cycle === 2 && environment !== 'night') setEnvironment('night');

        // Sync React HUD state
        setHudStats({ ...stats });
        setHudPlayer({ ...player });
      } else if (gameState === 'MENU') {
        // Idle cruising simulation in title menu
        roadOffsetRef.current += 12;
        player.speed = 100;
        player.x = renderW / 2 + Math.sin(timestamp / 1000) * 45;
        player.steeringAngle = Math.cos(timestamp / 1000) * 0.05;
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.alpha -= p.decay * deltaTime;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Skidmarks
      for (let i = skidMarksRef.current.length - 1; i >= 0; i--) {
        const m = skidMarksRef.current[i];
        m.alpha -= deltaTime * 0.4;
        m.y += ((player.speed * 1000) / 3600) * deltaTime * 18;
        if (m.alpha <= 0 || m.y > renderH + 50) {
          skidMarksRef.current.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const t = floatingTextsRef.current[i];
        t.y -= 45 * deltaTime;
        t.alpha -= deltaTime * 0.8;
        if (t.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // Decay Screen Shake
      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - deltaTime * 30);
      }

      // ==========================================
      // 2. RENDER SCENE ON CANVAS
      // ==========================================
      ctx.save();

      // Screen shake translation
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      // Draw Road & Scenery
      renderer.drawRoad(roadOffsetRef.current, environment, player.speed, stats.distance);

      // Draw Skidmarks
      renderer.drawSkidMarks(skidMarksRef.current);

      // Draw Collectibles
      for (const item of collectiblesRef.current) {
        renderer.drawCollectible(item);
      }

      // Draw Traffic Cars
      for (const traffic of trafficCarsRef.current) {
        renderer.drawTrafficCar(traffic, environment);
      }

      // Draw Player Car
      renderer.drawPlayerCar(player, carConfig, environment, inputs.down);

      // Draw Particles & Floating Texts
      renderer.drawParticles(particlesRef.current);
      renderer.drawFloatingTexts(floatingTextsRef.current);

      ctx.restore();

      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState, environment, difficulty, selectedCarId, selectedColor, handleEndGame, spawnTraffic, spawnCollectible]);

  // Car unlocked/selected callbacks
  const handleSelectCar = (carId: CarModelId) => {
    setSelectedCarId(carId);
    saveCarSelection(carId, selectedColor);
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    saveCarSelection(selectedCarId, color);
  };

  const handleUnlockCar = (carId: CarModelId, cost: number) => {
    const success = unlockCar(carId, cost);
    if (success) {
      setTotalCoins((prev) => prev - cost);
      setUnlockedCars((prev) => [...prev, carId]);
      setSelectedCarId(carId);
      saveCarSelection(carId, selectedColor);
      sound.playPowerup();
    }
  };

  const handleResetScores = () => {
    try {
      localStorage.removeItem('turbo_racer_high_score');
      localStorage.removeItem('turbo_racer_best_distance');
      localStorage.removeItem('turbo_racer_scores_list');
      setHighScore(0);
      setBestDistance(0);
      setRecentScores([]);
    } catch {
      // Ignore
    }
  };

  const activeCarConfig = getCarConfig(selectedCarId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Header Bar */}
      <Header
        gameState={gameState}
        isMuted={isMuted}
        totalCoins={totalCoins}
        onToggleSound={handleToggleSound}
        onOpenGarage={() => setIsGarageOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onStartOrResume={() => {
          if (gameState === 'PAUSED') handleResumeGame();
          else handleStartGame();
        }}
        onPause={handlePauseGame}
      />

      {/* Main Viewport Container */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-default"
        />

        {/* In-Game HUD (Only during active PLAYING) */}
        {gameState === 'PLAYING' && (
          <HUD player={hudPlayer} stats={hudStats} />
        )}

        {/* Mobile On-Screen Touch Controls */}
        {gameState === 'PLAYING' && (
          <TouchControls
            onControlChange={handleTouchControl}
            nitroLevel={hudPlayer.nitro}
          />
        )}

        {/* Title Menu Overlay (MENU State) */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/65 backdrop-blur-[2px]">
            <div className="w-full max-w-lg flex flex-col items-center text-center animate-in fade-in duration-300">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
                <span>네트워크/API 없이 즐기는 100% 오프라인 레이서</span>
              </div>

              {/* Title Wordmark */}
              <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight drop-shadow-md">
                TURBO HIGHWAY
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-md">
                트래픽을 아슬아슬하게 피하고 코인을 모으세요. 니트로 부스터로 고속도로를 정복하세요!
              </p>

              {/* Quick Car Preview Card */}
              <div className="w-full mt-6 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div
                    className="w-10 h-14 rounded-lg flex items-center justify-center border border-white/20 shadow-md shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white">{activeCarConfig.name}</div>
                    <div className="text-[11px] text-slate-400">
                      최고속 {activeCarConfig.maxSpeed} km/h · 내구도 {activeCarConfig.durability} HP
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsGarageOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  차량 변경
                </button>
              </div>

              {/* Difficulty selector tabs */}
              <div className="flex items-center gap-1 mt-4 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    difficulty === 'easy' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  이지 (Easy)
                </button>
                <button
                  onClick={() => setDifficulty('normal')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    difficulty === 'normal' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  노멀 (Normal)
                </button>
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    difficulty === 'hard' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  터보 (Hard)
                </button>
              </div>

              {/* Start Race Primary CTA */}
              <button
                onClick={handleStartGame}
                className="mt-6 w-full sm:w-72 py-3.5 px-6 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-display font-extrabold text-base rounded-xl transition-all shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>지금 레이스 시작</span>
              </button>

              {/* Quick Key Hints */}
              <div className="flex items-center gap-4 mt-5 text-[11px] text-slate-400">
                <span>조향: <strong className="text-slate-200">← →</strong> / <strong className="text-slate-200">A D</strong></span>
                <span>·</span>
                <span>가속: <strong className="text-slate-200">↑</strong> / <strong className="text-slate-200">W</strong></span>
                <span>·</span>
                <span>부스트: <strong className="text-slate-200">SPACE</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
              <h2 className="font-display font-bold text-2xl text-white mb-2">게임 일시 정지</h2>
              <p className="text-xs text-slate-400 mb-6">잠시 숨을 고르고 계속 달리세요.</p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleResumeGame}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  계속 달리기 (Resume)
                </button>
                <button
                  onClick={handleStartGame}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
                >
                  처음부터 다시 시작
                </button>
                <button
                  onClick={() => {
                    sound.stopEngine();
                    setGameState('MENU');
                  }}
                  className="w-full py-2.5 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                >
                  메인 메뉴로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        <GameOverModal
          isOpen={gameState === 'GAME_OVER'}
          stats={hudStats}
          isNewHighScore={isNewHighScore}
          highScore={highScore}
          totalCoins={totalCoins}
          onRestart={handleStartGame}
          onOpenGarage={() => {
            setIsGarageOpen(true);
          }}
        />

        {/* Garage Modal */}
        <GarageModal
          isOpen={isGarageOpen}
          onClose={() => setIsGarageOpen(false)}
          selectedCarId={selectedCarId}
          selectedColor={selectedColor}
          unlockedCars={unlockedCars}
          totalCoins={totalCoins}
          onSelectCar={handleSelectCar}
          onSelectColor={handleSelectColor}
          onUnlockCar={handleUnlockCar}
        />

        {/* How to Play Modal */}
        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
        />

        {/* Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          scores={recentScores}
          highScore={highScore}
          bestDistance={bestDistance}
          onResetScores={handleResetScores}
        />
      </main>
    </div>
  );
}
