import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard, ProfileCardStatic, CARD_HEIGHT } from '@/components/swipe-card';
import { allProfiles, type Profile } from '@/data/profiles';
import { profileCategories } from '@/data/profile-categories';

const GAME_SIZE = 20;
const STACK_OFFSET = 12;

function getComboMultiplier(streak: number): number {
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

function getPointsForCorrect(newStreak: number): number {
  return Math.round(10 * getComboMultiplier(newStreak));
}

type Phase = 'swiping' | 'reveal';

interface CategoryStat {
  seen: number;
  correct: number;
}

interface GameState {
  profiles: Profile[];
  index: number;
  score: number;
  correct: number;
  streak: number;
  bestStreak: number;
  lastPoints: number;
  phase: Phase;
  swipedRight: boolean;
  wasCorrect: boolean;
  categoryResults: Record<string, CategoryStat>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SwipeGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Full-screen flash on swipe ────────────────────────────────────────────
  const flashOpacity = useSharedValue(0);
  const flashIsSuccess = useSharedValue(true);
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: flashIsSuccess.value
      ? 'rgba(76, 175, 80, 0.28)'
      : 'rgba(255, 77, 109, 0.28)',
  }));

  function triggerFlash(success: boolean) {
    flashIsSuccess.value = success;
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(0, { duration: 480 })
    );
  }

  // ── Button press animations ────────────────────────────────────────────────
  const passScale = useSharedValue(1);
  const dateScale = useSharedValue(1);
  const passBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: passScale.value }] }));
  const dateBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: dateScale.value }] }));

  // ── Game state ────────────────────────────────────────────────────────────
  const [state, setState] = useState<GameState>(() => ({
    profiles: shuffle(allProfiles).slice(0, GAME_SIZE),
    index: 0,
    score: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    lastPoints: 0,
    phase: 'swiping',
    swipedRight: false,
    wasCorrect: false,
    categoryResults: {},
  }));

  const profile = state.profiles[state.index];
  const nextProfile = state.profiles[state.index + 1] ?? null;
  const currentCombo = getComboMultiplier(state.streak);

  function updateCategoryResults(
    prev: GameState,
    profileId: number,
    isCorrect: boolean
  ): Record<string, CategoryStat> {
    const cat = profileCategories[profileId] ?? 'Other';
    const prevStat = prev.categoryResults[cat] ?? { seen: 0, correct: 0 };
    return {
      ...prev.categoryResults,
      [cat]: { seen: prevStat.seen + 1, correct: isCorrect ? prevStat.correct + 1 : prevStat.correct },
    };
  }

  function handleSwipeLeft() {
    const isCorrect = profile.correctDecision === 'reject';
    triggerFlash(isCorrect);
    setState((prev) => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const points = isCorrect ? getPointsForCorrect(newStreak) : -10;
      return {
        ...prev,
        score: prev.score + points,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: newStreak,
        bestStreak: Math.max(newStreak, prev.streak, prev.bestStreak),
        lastPoints: points,
        phase: 'reveal',
        swipedRight: false,
        wasCorrect: isCorrect,
        categoryResults: updateCategoryResults(prev, profile.id, isCorrect),
      };
    });
  }

  function handleSwipeRight() {
    const isCorrect = profile.correctDecision === 'date';
    triggerFlash(isCorrect);
    setState((prev) => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const points = isCorrect ? getPointsForCorrect(newStreak) : -10;
      return {
        ...prev,
        score: prev.score + points,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: newStreak,
        bestStreak: Math.max(newStreak, prev.streak, prev.bestStreak),
        lastPoints: points,
        phase: 'reveal',
        swipedRight: true,
        wasCorrect: isCorrect,
        categoryResults: updateCategoryResults(prev, profile.id, isCorrect),
      };
    });
  }

  function handleNext() {
    const isLast = state.index >= GAME_SIZE - 1;
    if (isLast) {
      router.replace({
        pathname: '/swipe-results',
        params: {
          score: String(state.score),
          correct: String(state.correct),
          bestStreak: String(state.bestStreak),
          categoryResults: JSON.stringify(state.categoryResults),
        },
      });
    } else {
      setState((prev) => ({
        ...prev,
        index: prev.index + 1,
        phase: 'swiping',
        swipedRight: false,
        wasCorrect: false,
        lastPoints: 0,
      }));
    }
  }

  const progress = state.index + 1;
  const progressPct = (progress / GAME_SIZE) * 100;
  const isComboActive = state.wasCorrect && state.streak >= 3;

  function getRevealTitle() {
    if (state.wasCorrect) {
      return state.swipedRight
        ? `You dated ${profile.name} 💚`
        : `You rejected ${profile.name} ✅`;
    }
    return state.swipedRight
      ? `You dated ${profile.name}... 💔`
      : `You passed on ${profile.name}... 😬`;
  }

  const headerPaddingTop = insets.top + 10;
  const bottomPadding = insets.bottom + 8;

  return (
    <View style={styles.container}>
      {/* Flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerRow}>
          <Text style={styles.progressNum}>{progress} / {GAME_SIZE}</Text>

          {state.streak >= 2 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{state.streak}</Text>
              {currentCombo > 1 && (
                <Text style={styles.comboMult}>×{currentCombo}</Text>
              )}
            </View>
          )}

          <View style={[styles.scoreBadge, state.score < 0 && styles.scoreBadgeNeg]}>
            <Text style={styles.scoreText}>
              {state.score > 0 ? '+' : ''}{state.score}
            </Text>
          </View>
        </View>

        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
      </View>

      {/* ── Swiping phase ───────────────────────────────────────────────────── */}
      {state.phase === 'swiping' && (
        <View style={styles.gameArea}>
          {/* Card stack */}
          <View style={styles.cardStack}>
            {nextProfile && (
              <View style={styles.stackCard} pointerEvents="none">
                <ProfileCardStatic profile={nextProfile} />
              </View>
            )}
            <View style={styles.activeCard}>
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            </View>
          </View>

          {/* ── Action buttons ─────────────────────────────────────────────── */}
          <View style={styles.actions}>
            {/* PASS button */}
            <View style={styles.actionGroup}>
              <Pressable
                onPressIn={() => { passScale.value = withTiming(0.86, { duration: 75 }); }}
                onPressOut={() => { passScale.value = withSpring(1, { damping: 9, stiffness: 200 }); }}
                onPress={handleSwipeLeft}
                hitSlop={14}>
                <Animated.View style={[styles.actionBtn, styles.passBtn, passBtnStyle]}>
                  <Text style={styles.passIcon}>✕</Text>
                </Animated.View>
              </Pressable>
              <Text style={styles.passLabel}>PASS</Text>
            </View>

            {/* DATE button */}
            <View style={styles.actionGroup}>
              <Pressable
                onPressIn={() => { dateScale.value = withTiming(0.86, { duration: 75 }); }}
                onPressOut={() => { dateScale.value = withSpring(1, { damping: 9, stiffness: 200 }); }}
                onPress={handleSwipeRight}
                hitSlop={14}>
                <Animated.View style={[styles.actionBtn, styles.dateBtn, dateBtnStyle]}>
                  <Text style={styles.dateIcon}>♥</Text>
                </Animated.View>
              </Pressable>
              <Text style={styles.dateLabel}>DATE</Text>
            </View>
          </View>

          <View style={{ height: bottomPadding }} />
        </View>
      )}

      {/* ── Reveal phase ────────────────────────────────────────────────────── */}
      {state.phase === 'reveal' && (
        <ScrollView
          style={styles.revealScroll}
          contentContainerStyle={[styles.revealContent, { paddingBottom: bottomPadding + 16 }]}
          showsVerticalScrollIndicator={false}>

          <View style={[styles.revealCard, state.wasCorrect ? styles.revealCorrect : styles.revealWrong]}>
            <Text style={styles.revealEmoji}>{state.wasCorrect ? '✅' : '❌'}</Text>
            <Text style={styles.revealTitle}>{getRevealTitle()}</Text>

            <View style={styles.pointsRow}>
              <View style={[styles.pointsBadge, state.wasCorrect ? styles.pointsBadgeGreen : styles.pointsBadgeRed]}>
                <Text style={[styles.pointsText, state.wasCorrect ? styles.pointsGreen : styles.pointsRed]}>
                  {state.lastPoints > 0 ? '+' : ''}{state.lastPoints} pts
                </Text>
              </View>
              {isComboActive && (
                <View style={styles.comboBadge}>
                  <Text style={styles.comboBadgeText}>🔥 ×{currentCombo} combo</Text>
                </View>
              )}
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonText}>{profile.decisionReason}</Text>
            </View>

            {profile.greenFlags.length > 0 && (
              <View style={[styles.flagsCard, styles.flagsCardGreen]}>
                <Text style={[styles.flagsTitle, styles.flagsTitleGreen]}>✅ Green Flags</Text>
                {profile.greenFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <Text style={styles.flagBullet}>✅</Text>
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {profile.redFlags.length > 0 && (
              <View style={[styles.flagsCard, styles.flagsCardRed]}>
                <Text style={[styles.flagsTitle, styles.flagsTitleRed]}>🚩 Red Flags</Text>
                {profile.redFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <Text style={styles.flagBullet}>🚩</Text>
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>
                {state.index >= GAME_SIZE - 1 ? 'See Results 🎉' : 'Next Profile →'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  // ── Flash overlay ──────────────────────────────────────────────────────────
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressNum: {
    color: '#666',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1200',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cc6600',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 3,
  },
  streakFire: { fontSize: 13 },
  streakCount: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '800',
  },
  comboMult: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 1,
  },
  scoreBadge: {
    backgroundColor: '#0a1f0a',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2d6a2d',
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 74,
    alignItems: 'center',
  },
  scoreBadgeNeg: {
    backgroundColor: '#1f0a0a',
    borderColor: '#6a2d2d',
  },
  scoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  progressBarOuter: {
    height: 3,
    backgroundColor: '#1e1e1e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#ff4d6d',
    borderRadius: 2,
  },

  // ── Game area ───────────────────────────────────────────────────────────────
  gameArea: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },

  // Card stack
  cardStack: {
    height: CARD_HEIGHT + STACK_OFFSET,
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    top: STACK_OFFSET,
    left: 10,
    right: 10,
    opacity: 0.35,
    transform: [{ scale: 0.97 }],
  },
  activeCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // ── Action buttons ──────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 48,
  },
  actionGroup: {
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  passBtn: {
    backgroundColor: '#170408',
    borderColor: '#c41430',
    shadowColor: '#ff2244',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  dateBtn: {
    backgroundColor: '#04120a',
    borderColor: '#1e8038',
    shadowColor: '#33cc55',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  passIcon: {
    color: '#f02040',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    includeFontPadding: false,
  },
  dateIcon: {
    color: '#22cc44',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    includeFontPadding: false,
  },
  passLabel: {
    color: '#c41430',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dateLabel: {
    color: '#1e8038',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  swipeHint: {
    color: '#2e2e2e',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: -8,
  },

  // ── Reveal phase ────────────────────────────────────────────────────────────
  revealScroll: { flex: 1 },
  revealContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  revealCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 14,
  },
  revealCorrect: {
    backgroundColor: '#071407',
    borderColor: '#2d6a2d',
  },
  revealWrong: {
    backgroundColor: '#140707',
    borderColor: '#6a2d2d',
  },
  revealEmoji: { fontSize: 52 },
  revealTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pointsBadge: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
  },
  pointsBadgeGreen: {
    backgroundColor: '#0a1f0a',
    borderColor: '#2d6a2d',
  },
  pointsBadgeRed: {
    backgroundColor: '#1f0a0a',
    borderColor: '#6a2d2d',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pointsGreen: { color: '#4caf50' },
  pointsRed: { color: '#ff4d6d' },
  comboBadge: {
    backgroundColor: '#1f1200',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cc6600',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  comboBadgeText: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '700',
  },
  reasonCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  reasonText: {
    color: '#bbb',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flagsCard: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  flagsCardGreen: {
    backgroundColor: '#071407',
    borderColor: '#1a3d1a',
  },
  flagsCardRed: {
    backgroundColor: '#140707',
    borderColor: '#3d1a1a',
  },
  flagsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  flagsTitleGreen: { color: '#4caf50' },
  flagsTitleRed: { color: '#ff4d6d' },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  flagBullet: {
    fontSize: 12,
    marginTop: 3,
  },
  flagText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  nextBtn: {
    backgroundColor: '#ff4d6d',
    paddingHorizontal: 36,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
