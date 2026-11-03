import React from 'react';
import { Shield, Zap, Heart, Flame } from 'lucide-react';
import { PlayerState, GameStats } from '../game/types';

interface HUDProps {
  player: PlayerState;
  stats: GameStats;
}

export const HUD: React.FC<HUDProps> = ({ player, stats }) => {
  const currentSpeed = Math.round(player.speed);

  // Speedometer calculation
  const speedPercentage = Math.min(100, (currentSpeed / 240) * 100);
  const gear = currentSpeed < 30 ? 1 : currentSpeed < 75 ? 2 : currentSpeed < 120 ? 3 : currentSpeed < 165 ? 4 : currentSpeed < 205 ? 5 : 6;

  return (
    <div className="pointer-events-none absolute inset-0 p-4 sm:p-6 flex flex-col justify-between z-20">
      {/* Top HUD: Score, Distance, Coins & Health */}
      <div className="flex items-start justify-between gap-4 w-full">
        {/* Score & Combo */}
        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">SCORE</div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-white tabular-nums tracking-tight">
            {stats.score.toLocaleString()}
          </div>
          {stats.currentCombo > 1 && (
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded">
                x{stats.currentCombo} 콤보
              </span>
              <span className="text-[11px] text-amber-300">근접 추월 연속!</span>
            </div>
          )}
        </div>

        {/* Center: Distance & Coins */}
        <div className="hidden sm:flex items-center gap-6 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium uppercase">거리 (Distance)</span>
            <span className="font-display font-bold text-lg text-slate-100 tabular-nums">
              {Math.round(stats.distance)} <span className="text-xs font-normal text-slate-400">m</span>
            </span>
          </div>

          <div className="w-[1px] h-6 bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-amber-400/90 font-medium uppercase">코인 (Coins)</span>
            <span className="font-display font-bold text-lg text-amber-400 tabular-nums flex items-center gap-1">
              <span>🪙</span>
              <span>{stats.coins}</span>
            </span>
          </div>
        </div>

        {/* Right: Health & Active Buffs */}
        <div className="flex flex-col items-end gap-2">
          {/* Health Bar */}
          <div className="flex items-center gap-1.5 p-1.5 px-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">내구도</span>
            {Array.from({ length: player.maxHealth }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-colors ${
                  i < player.health
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Active Buffs (Shield / Magnet) */}
          <div className="flex items-center gap-2">
            {player.shieldTimer > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/80 border border-purple-500/50 rounded-lg text-xs font-medium text-purple-200">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>보호막 {Math.ceil(player.shieldTimer)}s</span>
              </div>
            )}

            {player.magnetTimer > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/80 border border-rose-500/50 rounded-lg text-xs font-medium text-rose-200">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <span>자석 {Math.ceil(player.magnetTimer)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom HUD: Speedometer & Nitro Boost Gauge */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Distance & Coins on small screens */}
        <div className="sm:hidden flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-semibold">
          <span className="text-slate-300">{Math.round(stats.distance)}m</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400">🪙 {stats.coins}</span>
        </div>

        {/* Right Corner: Arcade Speedometer & Nitro Gauge */}
        <div className="ml-auto flex flex-col items-end gap-2">
          {/* Nitro Gauge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg w-44">
            <Flame className={`w-4 h-4 shrink-0 ${player.nitro >= 20 ? 'text-cyan-400' : 'text-slate-600'}`} />
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-slate-400">
                <span>NITRO BOOST</span>
                <span className="text-cyan-400 tabular-nums">{Math.round(player.nitro)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    player.isBoosting
                      ? 'bg-gradient-to-r from-cyan-400 to-white'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${player.nitro}%` }}
                />
              </div>
            </div>
          </div>

          {/* Speedometer Instrument Dial */}
          <div className="flex items-baseline gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">GEAR</span>
              <span className="font-display font-black text-rose-500 text-lg tabular-nums leading-none">
                {gear}
              </span>
            </div>

            <div className="w-[1px] h-8 bg-slate-800 mx-1" />

            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-3xl sm:text-4xl text-white tabular-nums tracking-tight">
                {currentSpeed}
              </span>
              <span className="text-xs font-bold text-slate-400">KM/H</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
