import React from 'react';
import { X, Trophy, Medal, Calendar, Trash2 } from 'lucide-react';
import { HighScoreRecord } from '../game/types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: HighScoreRecord[];
  highScore: number;
  bestDistance: number;
  onResetScores: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  scores,
  highScore,
  bestDistance,
  onResetScores,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-lg text-white">명예의 전당 (Top Records)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">역대 최고 점수</div>
              <div className="font-display font-extrabold text-2xl text-rose-500 tabular-nums mt-0.5">
                {highScore.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">최장 주행 거리</div>
              <div className="font-display font-extrabold text-2xl text-cyan-400 tabular-nums mt-0.5">
                {bestDistance.toLocaleString()} <span className="text-xs font-normal text-slate-400">m</span>
              </div>
            </div>
          </div>

          {/* Scores Table */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              최고 기록 순위 (Top 5)
            </div>

            {scores.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/30 border border-slate-800/60 rounded-xl">
                아직 저장된 레이싱 기록이 없습니다. 지금 첫 주행을 시작해보세요!
              </div>
            ) : (
              <div className="space-y-2">
                {scores.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-xs shrink-0 bg-slate-800 text-slate-200">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm text-white tabular-nums">
                          {rec.score.toLocaleString()}점
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{rec.carName.split(' (')[0]}</span>
                          <span>·</span>
                          <span>{rec.distance}m</span>
                          <span>·</span>
                          <span>🪙 {rec.coins}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {rec.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {scores.length > 0 ? (
            <button
              onClick={onResetScores}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>기록 초기화</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
