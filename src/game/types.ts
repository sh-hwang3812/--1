/**
 * Game Types & Interfaces for Turbo Highway 2D Racer
 */

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameEnvironment = 'day' | 'sunset' | 'night';

export type CarModelId = 'thunderbolt' | 'night_fury' | 'titan_cruiser' | 'cyber_phantom';

export interface CarConfig {
  id: CarModelId;
  name: string;
  subtitle: string;
  description: string;
  maxSpeed: number;        // in km/h (140 - 240)
  acceleration: number;    // 0.8 - 1.5
  handling: number;        // steering responsiveness (0.8 - 1.4)
  durability: number;      // max health hits (2 - 5)
  width: number;
  height: number;
  baseColor: string;
  accentColor: string;
  unlockedByDefault: boolean;
  cost: number;
}

export interface PlayerState {
  x: number;               // road position (horizontal)
  y: number;               // vertical position on screen
  speed: number;           // current speed in km/h
  targetSpeed: number;     // target speed from inputs
  steeringAngle: number;   // tilt visual angle
  health: number;
  maxHealth: number;
  nitro: number;           // 0 to 100
  isBoosting: boolean;
  shieldTimer: number;     // seconds remaining
  magnetTimer: number;     // seconds remaining
  carId: CarModelId;
  carColor: string;
  invincibleTimer: number; // grace period after hit
}

export type TrafficType = 'sedan' | 'sports' | 'truck' | 'police' | 'taxi';

export interface TrafficCar {
  id: number;
  x: number;
  y: number;
  lane: number;
  targetLane: number;
  speed: number;
  type: TrafficType;
  color: string;
  width: number;
  height: number;
  blinkerTimer: number;
  isChangingLane: boolean;
  overtaken: boolean;
}

export type CollectibleType = 'coin' | 'nitro' | 'repair' | 'shield' | 'magnet';

export interface Collectible {
  id: number;
  x: number;
  y: number;
  type: CollectibleType;
  width: number;
  height: number;
  lane: number;
  collected: boolean;
  bobOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'smoke' | 'fire' | 'spark' | 'sparkle' | 'debris';
}

export interface SkidMark {
  x: number;
  y: number;
  alpha: number;
  width: number;
}

export interface InputControls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  nitro: boolean;
}

export interface HighScoreRecord {
  score: number;
  distance: number;
  coins: number;
  date: string;
  carName: string;
}

export interface GameStats {
  score: number;
  distance: number;       // meters
  coins: number;
  nearMisses: number;
  timeElapsed: number;    // seconds
  currentCombo: number;
  comboTimer: number;
}
