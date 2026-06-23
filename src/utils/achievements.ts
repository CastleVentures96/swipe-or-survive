import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = '@sos:achievements';

export interface AchievementDef {
  id: string;
  emoji: string;
  title: string;
  description: string;
  progressMax?: number;
}

export interface GameResult {
  score: number;
  correct: number;
  wrong: number;
  bestStreak: number;
  totalSwipedRight: number;
  gamesPlayed: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'untouchable',
    emoji: '🛡️',
    title: 'Untouchable',
    description: 'Score 170 or more points in a single game.',
  },
  {
    id: 'learning_curve',
    emoji: '📈',
    title: 'Learning Curve',
    description: 'Score more than 75 points in a single game.',
  },
  {
    id: 'walking_disaster',
    emoji: '💀',
    title: 'Walking Disaster',
    description: 'Finish a game with a score under 20.',
  },
  {
    id: 'sharp_eye',
    emoji: '👁️',
    title: 'Sharp Eye',
    description: 'Get 15 or more correct answers in a single game.',
  },
  {
    id: 'lightning_round',
    emoji: '⚡',
    title: 'Lightning Round',
    description: 'Achieve a streak of 8 or more correct in a row.',
  },
  {
    id: 'hot_streak',
    emoji: '🔥',
    title: 'Hot Streak',
    description: 'Achieve a streak of 5 or more correct in a row.',
  },
  {
    id: 'hopeless_romantic',
    emoji: '💘',
    title: 'Hopeless Romantic',
    description: 'Swipe right on every single profile.',
  },
  {
    id: 'ghosted',
    emoji: '👻',
    title: 'Ghosted',
    description: "Pass on everyone. Not a single date. Incredible.",
  },
  {
    id: 'veteran',
    emoji: '🎖️',
    title: 'Veteran',
    description: 'Play 10 or more games.',
    progressMax: 10,
  },
  {
    id: 'addicted',
    emoji: '🎮',
    title: 'Addicted',
    description: 'Play 50 or more games.',
    progressMax: 50,
  },
];

export async function loadUnlocked(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function persistUnlocked(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function checkNewUnlocks(result: GameResult, alreadyUnlocked: Set<string>): string[] {
  const newIds: string[] = [];
  function check(id: string, condition: boolean) {
    if (!alreadyUnlocked.has(id) && condition) newIds.push(id);
  }
  check('untouchable',       result.score >= 170);
  check('learning_curve',    result.score > 75);
  check('walking_disaster',  result.score < 20);
  check('sharp_eye',         result.correct >= 15);
  check('lightning_round',   result.bestStreak >= 8);
  check('hot_streak',        result.bestStreak >= 5);
  check('hopeless_romantic', result.totalSwipedRight === 20);
  check('ghosted',           result.totalSwipedRight === 0);
  check('veteran',           result.gamesPlayed >= 10);
  check('addicted',          result.gamesPlayed >= 50);
  return newIds;
}
