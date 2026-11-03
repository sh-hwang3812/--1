import React from 'react';
import { X, Lock, Check, Sparkles } from 'lucide-react';
import { CAR_MODELS, COLOR_PALETTES } from '../game/cars';
import { CarModelId } from '../game/types';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCarId: CarModelId;
  selectedColor: string;
  unlockedCars: CarModelId[];
  totalCoins: number;
  onSelectCar: (carId: CarModelId) => void;
  onSelectColor: (color: string) => void;
  onUnlockCar: (carId: CarModelId, cost: number) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  selectedCarId,
  selectedColor,
  unlockedCars,
  totalCoins,
  onSelectCar,
  onSelectColor,
  onUnlockCar,
}) => {
  if (!isOpen) return null;

  const currentCar = CAR_MODELS.find((c) => c.id === selectedCarId) || CAR_MODELS[0];
  const isCurrentCarUnlocked = unlockedCars.includes(currentCar.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-xl text-white">차고 & 튜닝</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs font-semibold text-amber-400 tabular-nums">
              <span>🪙</span>
              <span>보유 코인: {totalCoins.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Vehicle Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAR_MODELS.map((car) => {
              const isUnlocked = unlockedCars.includes(car.id);
              const isSelected = selectedCarId === car.id;

              return (
                <button
                  key={car.id}
                  onClick={() => onSelectCar(car.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-bold text-slate-200 truncate">{car.name.split(' (')[0]}</span>
                    {!isUnlocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                    <span>최고 {car.maxSpeed}</span>
                    <span className="text-[9px]">km/h</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Car Showcase Card */}
          <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Visual Vehicle Render */}
            <div className="flex flex-col items-center justify-center py-6 bg-radial from-slate-800/40 to-transparent rounded-lg relative">
              {/* Top-down vehicle SVG preview */}
              <div
                className="relative transition-transform duration-300"
                style={{ width: currentCar.width, height: currentCar.height }}
              >
                {/* Wheels */}
                <div className="absolute -left-1 top-3 w-1.5 h-4 bg-slate-950 rounded-xs" />
                <div className="absolute -right-1 top-3 w-1.5 h-4 bg-slate-950 rounded-xs" />
                <div className="absolute -left-1 bottom-3 w-1.5 h-4 bg-slate-950 rounded-xs" />
                <div className="absolute -right-1 bottom-3 w-1.5 h-4 bg-slate-950 rounded-xs" />

                {/* Body */}
                <div
                  className="w-full h-full rounded-xl relative shadow-lg overflow-hidden border border-white/20"
                  style={{ backgroundColor: selectedColor }}
                >
                  {/* Racing stripe */}
                  <div
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2"
                    style={{ backgroundColor: currentCar.accentColor }}
                  />

                  {/* Windshield */}
                  <div className="absolute top-4 left-2 right-2 h-4 bg-slate-950 rounded-sm" />

                  {/* Roof */}
                  <div
                    className="absolute top-9 left-2.5 right-2.5 h-5 rounded-xs"
                    style={{ backgroundColor: selectedColor }}
                  />

                  {/* Rear glass */}
                  <div className="absolute bottom-5 left-2 right-2 h-3 bg-slate-950 rounded-xs" />

                  {/* Spoiler */}
                  <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-slate-950 rounded-xs" />
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="font-display font-bold text-base text-white">{currentCar.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{currentCar.subtitle}</div>
              </div>
            </div>

            {/* Performance Stats Bars */}
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>최고 속도 (Max Speed)</span>
                  <span className="font-bold text-white tabular-nums">{currentCar.maxSpeed} km/h</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(currentCar.maxSpeed / 250) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>가속력 (Acceleration)</span>
                  <span className="font-bold text-white tabular-nums">
                    {Math.round((currentCar.acceleration / 1.5) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(currentCar.acceleration / 1.5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>핸들링 (Handling)</span>
                  <span className="font-bold text-white tabular-nums">
                    {Math.round((currentCar.handling / 1.4) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(currentCar.handling / 1.4) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>차체 내구도 (Durability)</span>
                  <span className="font-bold text-white tabular-nums">{currentCar.durability} HP</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(currentCar.durability / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Customization */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              도색 컬러 커스텀
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTES.map((color) => {
                const isActive = selectedColor === color.value;
                return (
                  <button
                    key={color.value}
                    onClick={() => onSelectColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center ${
                      isActive
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isActive && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isCurrentCarUnlocked ? (
              <span className="text-emerald-400 font-medium">✓ 선택된 차량으로 주행할 준비가 되었습니다</span>
            ) : (
              <span>잠금 해제 필요: <strong className="text-amber-400">{currentCar.cost} 코인</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isCurrentCarUnlocked ? (
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap"
              >
                차량 적용 및 나가기
              </button>
            ) : (
              <button
                onClick={() => onUnlockCar(currentCar.id, currentCar.cost)}
                disabled={totalCoins < currentCar.cost}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  totalCoins >= currentCar.cost
                    ? 'text-white bg-amber-600 hover:bg-amber-500 shadow-md'
                    : 'text-slate-500 bg-slate-800 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentCar.cost} 코인으로 잠금 해제</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
