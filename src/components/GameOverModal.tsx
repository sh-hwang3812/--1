import React from 'react';
import { RotateCcw, Trophy, Award, Car } from 'lucide-react';
import { GameStats } from '../game/types';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  isNewHighScore: boolean;
  highScore: number;
  totalCoins: number;
  onRestart: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  isNewHighScore,
  highScore,
  totalCoins,
  onRestart,
  onOpenGarage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
        {/* Banner */}
        <div className="mb-4">
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>신기록 달성 (NEW RECORD)!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-xs font-bold text-rose-300 mb-2">
              <span>충돌 발생 (CRASH)!</span>
            </div>
          )}
          <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
            레이스 종료
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            고속도로 레이싱 기록이 저장되었습니다.
          </p>
        </div>

        {/* Primary Score */}
        <div className="py-4 my-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">최종 점수 (FINAL SCORE)</div>
          <div className="font-display font-black text-4xl text-rose-500 tabular-nums mt-0.5 tracking-tight">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            최고 기록: {Math.max(highScore, stats.score).toLocaleString()}
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4 text-left">
          <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">주행 거리</div>
            <div className="font-display font-bold text-base text-slate-200 tabular-nums mt-0.5">
              {Math.round(stats.distance)} <span className="text-[10px] text-slate-400 font-normal">m</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] text-amber-400/90 uppercase font-semibold">획득 코인</div>
            <div className="font-display font-bold text-base text-amber-400 tabular-nums mt-0.5 flex items-center gap-1">
              <span>+{stats.coins}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <div className="text-[10px] text-cyan-400 uppercase font-semibold">근접 추월</div>
            <div className="font-display font-bold text-base text-cyan-300 tabular-nums mt-0.5">
              {stats.nearMisses} <span className="text-[10px] text-slate-400 font-normal">회</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 달리기 (Space 또는 클릭)</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
          >
            <Car className="w-4 h-4 text-cyan-400" />
            <span>차고에서 차량 업그레이드하기 (보유 코인: {totalCoins})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
