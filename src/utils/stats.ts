import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = '@sos:lifetime_stats';

export interface LifetimeStats {
  gamesPlayed: number;
  highestScore: number;
  bestStreakEver: number;
  totalCorrect: number;
  totalWrong: number;
}

const DEFAULT_STATS: LifetimeStats = {
  gamesPlayed: 0,
  highestScore: 0,
  bestStreakEver: 0,
  totalCorrect: 0,
  totalWrong: 0,
};

export async function loadStats(): Promise<LifetimeStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export async function updateStats(game: {
  score: number;
  correct: number;
  wrong: number;
  bestStreak: number;
}): Promise<void> {
  try {
    const prev = await loadStats();
    const next: LifetimeStats = {
      gamesPlayed:   prev.gamesPlayed + 1,
      highestScore:  Math.max(prev.highestScore, game.score),
      bestStreakEver: Math.max(prev.bestStreakEver, game.bestStreak),
      totalCorrect:  prev.totalCorrect + game.correct,
      totalWrong:    prev.totalWrong + game.wrong,
    };
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    // Non-critical — stats tracking must never crash the game
  }
}
