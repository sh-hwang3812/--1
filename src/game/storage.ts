import { CarModelId, HighScoreRecord } from './types';

const STORAGE_KEYS = {
  HIGH_SCORE: 'turbo_racer_high_score',
  BEST_DISTANCE: 'turbo_racer_best_distance',
  TOTAL_COINS: 'turbo_racer_total_coins',
  HIGH_SCORES_LIST: 'turbo_racer_scores_list',
  UNLOCKED_CARS: 'turbo_racer_unlocked_cars',
  SELECTED_CAR: 'turbo_racer_selected_car',
  SELECTED_COLOR: 'turbo_racer_selected_color',
};

export interface LocalGameData {
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  recentScores: HighScoreRecord[];
  unlockedCars: CarModelId[];
  selectedCar: CarModelId;
  selectedColor: string;
}

export function loadGameData(): LocalGameData {
  try {
    const highScore = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    const bestDistance = parseInt(localStorage.getItem(STORAGE_KEYS.BEST_DISTANCE) || '0', 10);
    const totalCoins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_COINS) || '0', 10);

    const scoresJson = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES_LIST);
    const recentScores: HighScoreRecord[] = scoresJson ? JSON.parse(scoresJson) : [];

    const unlockedJson = localStorage.getItem(STORAGE_KEYS.UNLOCKED_CARS);
    const unlockedCars: CarModelId[] = unlockedJson
      ? JSON.parse(unlockedJson)
      : ['thunderbolt'];

    const selectedCar = (localStorage.getItem(STORAGE_KEYS.SELECTED_CAR) as CarModelId) || 'thunderbolt';
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
  } catch {
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

export function saveRunResult(
  score: number,
  distance: number,
  coinsEarned: number,
  carName: string
): { isNewHighScore: boolean; isNewBestDistance: boolean; updatedTotalCoins: number } {
  const current = loadGameData();
  const isNewHighScore = score > current.highScore;
  const isNewBestDistance = distance > current.bestDistance;
  const updatedTotalCoins = current.totalCoins + coinsEarned;

  try {
    if (isNewHighScore) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(score));
    }
    if (isNewBestDistance) {
      localStorage.setItem(STORAGE_KEYS.BEST_DISTANCE, String(distance));
    }
    localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, String(updatedTotalCoins));

    const newRecord: HighScoreRecord = {
      score,
      distance,
      coins: coinsEarned,
      date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      carName,
    };

    const updatedList = [newRecord, ...current.recentScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    localStorage.setItem(STORAGE_KEYS.HIGH_SCORES_LIST, JSON.stringify(updatedList));
  } catch {
    // LocalStorage failure handling
  }

  return { isNewHighScore, isNewBestDistance, updatedTotalCoins };
}

export function saveCarSelection(carId: CarModelId, color: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CAR, carId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_COLOR, color);
  } catch {
    // Ignore
  }
}

export function unlockCar(carId: CarModelId, cost: number): boolean {
  const data = loadGameData();
  if (data.totalCoins < cost) return false;

  const nextCoins = data.totalCoins - cost;
  const nextUnlocked = Array.from(new Set([...data.unlockedCars, carId]));

  try {
    localStorage.setItem(STORAGE_KEYS.TOTAL_COINS, String(nextCoins));
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_CARS, JSON.stringify(nextUnlocked));
    return true;
  } catch {
    return false;
  }
}
