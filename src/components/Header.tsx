import React from 'react';
import { Volume2, VolumeX, Shield, Trophy, HelpCircle, Car } from 'lucide-react';
import { GameState } from '../game/types';

interface HeaderProps {
  gameState: GameState;
  isMuted: boolean;
  totalCoins: number;
  onToggleSound: () => void;
  onOpenGarage: () => void;
  onOpenHowToPlay: () => void;
  onOpenLeaderboard: () => void;
  onStartOrResume: () => void;
  onPause: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  isMuted,
  totalCoins,
  onToggleSound,
  onOpenGarage,
  onOpenHowToPlay,
  onOpenLeaderboard,
  onStartOrResume,
  onPause,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 rotate-45 inline-block" />
          TURBO HIGHWAY
        </span>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={onOpenGarage}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Car className="w-4 h-4 text-cyan-400" />
          <span>차고 (Garage)</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>명예의 전당</span>
        </button>

        <button
          onClick={onOpenHowToPlay}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>조작법 & 아이템</span>
        </button>

        <button
          onClick={onToggleSound}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span>사운드 켜기</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>사운드 끄기</span>
            </>
          )}
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick coin counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-amber-400 tabular-nums">
          <span>🪙</span>
          <span>{totalCoins.toLocaleString()}</span>
        </div>

        {/* Sound toggle for mobile */}
        <button
          onClick={onToggleSound}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="사운드 설정"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {gameState === 'PLAYING' ? (
          <button
            onClick={onPause}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            일시 정지 (ESC)
          </button>
        ) : (
          <button
            onClick={onStartOrResume}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-rose-950/30"
          >
            {gameState === 'PAUSED' ? '계속 달리기' : '레이스 시작'}
          </button>
        )}
      </div>
    </header>
  );
};
