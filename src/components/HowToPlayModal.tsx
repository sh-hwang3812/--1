import React from 'react';
import { X, ArrowLeftRight, ArrowUpDown, Flame, Shield, Zap, Heart, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-display font-bold text-lg text-white">조작 방법 & 아이템 가이드</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Controls Table */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              키보드 조작법
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 font-mono font-bold shrink-0">
                  ← →
                </div>
                <div>
                  <div className="font-semibold text-white">조향 (차선 변경)</div>
                  <div className="text-[11px] text-slate-400">또는 A, D 키</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 font-mono font-bold shrink-0">
                  ↑ ↓
                </div>
                <div>
                  <div className="font-semibold text-white">가속 / 감속</div>
                  <div className="text-[11px] text-slate-400">또는 W, S 키</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-300 font-mono font-bold shrink-0 text-[10px]">
                  SPACE
                </div>
                <div>
                  <div className="font-semibold text-cyan-200">니트로 부스트</div>
                  <div className="text-[11px] text-slate-400">초고속 순간 질주</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 font-mono font-bold shrink-0 text-[10px]">
                  ESC / P
                </div>
                <div>
                  <div className="font-semibold text-white">일시 정지</div>
                  <div className="text-[11px] text-slate-400">게임 멈춤 / 재개</div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * 모바일/태블릿에서는 화면 하단의 터치 패드를 사용하여 조향 및 가속할 수 있습니다.
            </p>
          </div>

          {/* Collectibles Guide */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              도로 위 아이템 가이드
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  🪙
                </div>
                <div className="flex-1">
                  <span className="font-bold text-amber-300">골드 코인</span>
                  <p className="text-[11px] text-slate-400">+50점 획득 및 차고에서 신규 차량 구매에 사용됩니다.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-cyan-300">니트로 캔 (N₂O)</span>
                  <p className="text-[11px] text-slate-400">부스터 게이지를 50% 즉시 충전합니다.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-emerald-300">차량 수리 키트</span>
                  <p className="text-[11px] text-slate-400">충돌로 소모된 차량 내구도(HP)를 1칸 회복합니다.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-purple-300">에너지 쉴드</span>
                  <p className="text-[11px] text-slate-400">일정 시간 동안 트래픽 충돌 피해를 1회 완전히 무효화합니다.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-rose-300">코인 자석</span>
                  <p className="text-[11px] text-slate-400">주변 차선의 모든 코인을 자동으로 끌어당깁니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>고득점 팁 (Pro Tips)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>앞차를 아슬아슬하게 스쳐 지나가면 <strong className="text-amber-300">근접 추월(Near Miss) 보너스(+250점)</strong>와 콤보 배수가 증가합니다.</li>
              <li>고속 주행을 유지할수록 주행 거리당 획득 점수가 빨라집니다.</li>
              <li>경찰차나 대형 트럭은 차선 변경 시 깜빡이를 켜니 미리 확인하고 피하세요.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
