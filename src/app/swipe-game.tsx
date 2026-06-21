import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard, ProfileCardStatic, CARD_HEIGHT } from '@/components/swipe-card';
import { allProfiles, type Profile } from '@/data/profiles';
import { profileCategories } from '@/data/profile-categories';

const GAME_SIZE = 20;
const STACK_OFFSET = 14; // px the stack card peeks below the active card

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

  // Full-screen color flash on swipe
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
      {/* Flash overlay — full screen, sits above everything, no pointer events */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        {/* Row 1: round count + streak + score */}
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

        {/* Row 2: progress bar */}
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
      </View>

      {/* ── Swiping phase ─────────────────────────────────────────────────── */}
      {state.phase === 'swiping' && (
        <View style={styles.gameArea}>
          {/* Card stack */}
          <View style={styles.cardStack}>
            {/* Background card — peeks STACK_OFFSET px below active card */}
            {nextProfile && (
              <View style={styles.stackCard} pointerEvents="none">
                <ProfileCardStatic profile={nextProfile} />
              </View>
            )}
            {/* Active card */}
            <View style={styles.activeCard}>
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={handleSwipeLeft}
              activeOpacity={0.75}>
              <Text style={styles.actionIcon}>❌</Text>
              <Text style={styles.rejectLabel}>REJECT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.dateBtn]}
              onPress={handleSwipeRight}
              activeOpacity={0.75}>
              <Text style={styles.actionIcon}>💚</Text>
              <Text style={styles.dateLabel}>DATE</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.swipeHint}>← swipe to reject · swipe to date →</Text>
          <View style={{ height: bottomPadding }} />
        </View>
      )}

      {/* ── Reveal phase ──────────────────────────────────────────────────── */}
      {state.phase === 'reveal' && (
        <ScrollView
          style={styles.revealScroll}
          contentContainerStyle={[styles.revealContent, { paddingBottom: bottomPadding + 16 }]}
          showsVerticalScrollIndicator={false}>

          <View style={[styles.revealCard, state.wasCorrect ? styles.revealCorrect : styles.revealWrong]}>
            {/* Result emoji + title */}
            <Text style={styles.revealEmoji}>{state.wasCorrect ? '✅' : '❌'}</Text>
            <Text style={styles.revealTitle}>{getRevealTitle()}</Text>

            {/* Points + optional combo tag */}
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

            {/* Why this was the right call */}
            <View style={styles.reasonCard}>
              <Text style={styles.reasonText}>{profile.decisionReason}</Text>
            </View>

            {/* Green flags */}
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

            {/* Red flags */}
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

            {/* Next button */}
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
    color: '#777',
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
  streakFire: {
    fontSize: 13,
  },
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

  // ── Game area (swiping phase) ───────────────────────────────────────────────
  gameArea: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 18,
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
    opacity: 0.4,
    transform: [{ scale: 0.965 }],
  },
  activeCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    gap: 3,
  },
  rejectBtn: {
    backgroundColor: '#160404',
    borderColor: '#cc2244',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  dateBtn: {
    backgroundColor: '#041606',
    borderColor: '#2d8a2d',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIcon: {
    fontSize: 26,
  },
  rejectLabel: {
    color: '#cc2244',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  dateLabel: {
    color: '#2d8a2d',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  swipeHint: {
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Reveal phase ────────────────────────────────────────────────────────────
  revealScroll: {
    flex: 1,
  },
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
  revealEmoji: {
    fontSize: 52,
  },
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
  pointsGreen: {
    color: '#4caf50',
  },
  pointsRed: {
    color: '#ff4d6d',
  },
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
  flagsTitleGreen: {
    color: '#4caf50',
  },
  flagsTitleRed: {
    color: '#ff4d6d',
  },
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
