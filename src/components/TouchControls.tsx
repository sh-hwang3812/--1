import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Flame } from 'lucide-react';
import { InputControls } from '../game/types';

interface TouchControlsProps {
  onControlChange: (key: keyof InputControls, value: boolean) => void;
  nitroLevel: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onControlChange, nitroLevel }) => {
  const handleTouchStart = (key: keyof InputControls) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onControlChange(key, true);
  };

  const handleTouchEnd = (key: keyof InputControls) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onControlChange(key, false);
  };

  return (
    <div className="md:hidden absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-30 select-none">
      {/* Left / Right Steering Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd('left')}
          onMouseDown={handleTouchStart('left')}
          onMouseUp={handleTouchEnd('left')}
          className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-slate-700 border border-slate-700 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform backdrop-blur-sm"
          aria-label="좌회전"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        <button
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd('right')}
          onMouseDown={handleTouchStart('right')}
          onMouseUp={handleTouchEnd('right')}
          className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-slate-700 border border-slate-700 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform backdrop-blur-sm"
          aria-label="우회전"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Right Side: Gas, Brake, Nitro */}
      <div className="flex items-end gap-2 pointer-events-auto">
        {/* Nitro Button */}
        <button
          onTouchStart={handleTouchStart('nitro')}
          onTouchEnd={handleTouchEnd('nitro')}
          onMouseDown={handleTouchStart('nitro')}
          onMouseUp={handleTouchEnd('nitro')}
          disabled={nitroLevel < 10}
          className={`w-13 h-13 rounded-2xl border flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm ${
            nitroLevel >= 20
              ? 'bg-cyan-600/90 active:bg-cyan-500 border-cyan-400 text-white'
              : 'bg-slate-900/70 border-slate-800 text-slate-500'
          }`}
          aria-label="니트로 부스트"
        >
          <Flame className="w-5 h-5" />
          <span className="text-[9px] font-bold">부스트</span>
        </button>

        {/* Brake Button */}
        <button
          onTouchStart={handleTouchStart('down')}
          onTouchEnd={handleTouchEnd('down')}
          onMouseDown={handleTouchStart('down')}
          onMouseUp={handleTouchEnd('down')}
          className="w-13 h-13 rounded-2xl bg-rose-950/80 active:bg-rose-900 border border-rose-800/80 flex flex-col items-center justify-center text-rose-200 shadow-lg active:scale-95 transition-transform backdrop-blur-sm"
          aria-label="브레이크"
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[9px] font-bold">감속</span>
        </button>

        {/* Gas Button */}
        <button
          onTouchStart={handleTouchStart('up')}
          onTouchEnd={handleTouchEnd('up')}
          onMouseDown={handleTouchStart('up')}
          onMouseUp={handleTouchEnd('up')}
          className="w-15 h-16 rounded-2xl bg-emerald-600/90 active:bg-emerald-500 border border-emerald-400 flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-transform backdrop-blur-sm"
          aria-label="가속"
        >
          <ArrowUp className="w-6 h-6" />
          <span className="text-[10px] font-extrabold tracking-tight">가속</span>
        </button>
      </div>
    </div>
  );
};
