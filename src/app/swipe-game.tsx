import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard, ProfileCardStatic, CARD_HEIGHT, CARD_WIDTH } from '@/components/swipe-card';
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
      ? 'rgba(34,197,94,0.22)'
      : 'rgba(232,25,60,0.22)',
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

  // ── Card shake on wrong answer ────────────────────────────────────────────
  const shakeX = useSharedValue(0);
  const cardShakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  function triggerShake() {
    shakeX.value = withSequence(
      withTiming(-11, { duration: 50 }),
      withTiming(11,  { duration: 50 }),
      withTiming(-8,  { duration: 50 }),
      withTiming(8,   { duration: 50 }),
      withTiming(-4,  { duration: 50 }),
      withTiming(0,   { duration: 50 })
    );
  }

  // ── Floating score animation ──────────────────────────────────────────────
  const scoreFloatY       = useSharedValue(0);
  const scoreFloatOpacity = useSharedValue(0);
  const [scoreFloat, setScoreFloat] = useState({ text: '', pos: true });

  const scoreFloatStyle = useAnimatedStyle(() => ({
    opacity:   scoreFloatOpacity.value,
    transform: [{ translateY: scoreFloatY.value }],
  }));

  function triggerScoreFloat(points: number) {
    setScoreFloat({ text: points > 0 ? `+${points}` : `${points}`, pos: points > 0 });
    scoreFloatY.value = 0;
    scoreFloatOpacity.value = 0;
    scoreFloatOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(1, { duration: 380 }),
      withTiming(0, { duration: 280 })
    );
    scoreFloatY.value = withTiming(-72, { duration: 740 });
  }

  // ── Reveal entrance animation ─────────────────────────────────────────────
  const revealOpacity  = useSharedValue(0);
  const revealSlideY   = useSharedValue(18);
  const revealAnimStyle = useAnimatedStyle(() => ({
    opacity:   revealOpacity.value,
    transform: [{ translateY: revealSlideY.value }],
  }));

  function triggerReveal() {
    revealOpacity.value = 0;
    revealSlideY.value  = 18;
    revealOpacity.value = withTiming(1, { duration: 260 });
    revealSlideY.value  = withTiming(0, { duration: 260 });
  }

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
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const points    = isCorrect ? getPointsForCorrect(newStreak) : -10;
    triggerFlash(isCorrect);
    if (!isCorrect) triggerShake();
    triggerScoreFloat(points);
    triggerReveal();
    setState((prev) => {
      const ns  = isCorrect ? prev.streak + 1 : 0;
      const pts = isCorrect ? getPointsForCorrect(ns) : -10;
      return {
        ...prev,
        score: prev.score + pts,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: ns,
        bestStreak: Math.max(ns, prev.streak, prev.bestStreak),
        lastPoints: pts,
        phase: 'reveal',
        swipedRight: false,
        wasCorrect: isCorrect,
        categoryResults: updateCategoryResults(prev, profile.id, isCorrect),
      };
    });
  }

  function handleSwipeRight() {
    const isCorrect = profile.correctDecision === 'date';
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const points    = isCorrect ? getPointsForCorrect(newStreak) : -10;
    triggerFlash(isCorrect);
    if (!isCorrect) triggerShake();
    triggerScoreFloat(points);
    triggerReveal();
    setState((prev) => {
      const ns  = isCorrect ? prev.streak + 1 : 0;
      const pts = isCorrect ? getPointsForCorrect(ns) : -10;
      return {
        ...prev,
        score: prev.score + pts,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: ns,
        bestStreak: Math.max(ns, prev.streak, prev.bestStreak),
        lastPoints: pts,
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
  const bottomPadding = insets.bottom + 4;

  return (
    <View style={styles.container}>
      {/* Flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerRow}>

          {/* Progress counter */}
          <View style={styles.progressPill}>
            <Text style={styles.progCurrent}>{progress}</Text>
            <Text style={styles.progSep}> / </Text>
            <Text style={styles.progTotal}>{GAME_SIZE}</Text>
          </View>

          {/* Streak badge */}
          {state.streak >= 2 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{state.streak}</Text>
              {currentCombo > 1 && (
                <Text style={styles.comboMult}>×{currentCombo}</Text>
              )}
            </View>
          )}

          {/* Score */}
          <View style={[styles.scoreBadge, state.score < 0 && styles.scoreBadgeNeg]}>
            <Text style={styles.scoreText}>
              {state.score > 0 ? '+' : ''}{state.score}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
      </View>

      {/* Floating score badge — rises from card center on each swipe */}
      <Animated.View style={[styles.scoreFloat, scoreFloatStyle]} pointerEvents="none">
        <Text style={[styles.scoreFloatTxt, scoreFloat.pos ? styles.scoreFloatPos : styles.scoreFloatNeg]}>
          {scoreFloat.text}
        </Text>
      </Animated.View>

      {/* ── Swiping phase ───────────────────────────────────────────────────── */}
      {state.phase === 'swiping' && (
        <View style={styles.gameArea}>
          {/* cardColumn centres the card horizontally and stacks buttons
              directly beneath it — no gap between card and buttons */}
          <View style={styles.cardColumn}>

            {/* Card stack — shake animation applied at this level */}
            <Animated.View style={[styles.cardStack, cardShakeStyle]}>
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
            </Animated.View>

            {/* ── Action buttons — directly below card ──────────────────────── */}
            <View style={styles.actions}>
              {/* PASS */}
              <View style={styles.btnGroup}>
                <Pressable
                  onPressIn={() => { passScale.value = withTiming(0.86, { duration: 75 }); }}
                  onPressOut={() => { passScale.value = withSpring(1, { damping: 9, stiffness: 200 }); }}
                  onPress={handleSwipeLeft}
                  hitSlop={14}>
                  <Animated.View style={[styles.passBtn, passBtnStyle]}>
                    <Text style={styles.passIcon}>✕</Text>
                  </Animated.View>
                </Pressable>
                <Text style={styles.passLabel}>PASS</Text>
              </View>

              {/* DATE */}
              <View style={styles.btnGroup}>
                <Pressable
                  onPressIn={() => { dateScale.value = withTiming(0.86, { duration: 75 }); }}
                  onPressOut={() => { dateScale.value = withSpring(1, { damping: 9, stiffness: 200 }); }}
                  onPress={handleSwipeRight}
                  hitSlop={14}>
                  <Animated.View style={[styles.dateBtn, dateBtnStyle]}>
                    <Text style={styles.dateIcon}>♥</Text>
                  </Animated.View>
                </Pressable>
                <Text style={styles.dateLabel}>DATE</Text>
              </View>
            </View>

          </View>

          <View style={{ height: bottomPadding }} />
        </View>
      )}

      {/* ── Reveal phase ────────────────────────────────────────────────────── */}
      {state.phase === 'reveal' && (
        <Animated.View style={[styles.revealArea, revealAnimStyle]}>

          {/* Result banner */}
          <View style={styles.revealBanner}>
            <LinearGradient
              colors={
                state.wasCorrect
                  ? ['rgba(34,197,94,0.30)', 'rgba(34,197,94,0.06)', 'transparent']
                  : ['rgba(232,25,60,0.30)', 'rgba(232,25,60,0.06)', 'transparent']
              }
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={styles.revealEmoji}>{state.wasCorrect ? '✅' : '❌'}</Text>
            <Text style={styles.revealTitle}>{getRevealTitle()}</Text>
            <View style={styles.revealMeta}>
              <View style={[styles.pointsPill, state.wasCorrect ? styles.pointsPillGreen : styles.pointsPillRed]}>
                <Text style={[styles.pointsVal, state.wasCorrect ? styles.pointsValGreen : styles.pointsValRed]}>
                  {state.lastPoints > 0 ? '+' : ''}{state.lastPoints} pts
                </Text>
              </View>
              {isComboActive && (
                <View style={styles.comboPill}>
                  <Text style={styles.comboText}>🔥 ×{currentCombo} combo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.revealScroll}
            contentContainerStyle={styles.revealScrollContent}
            showsVerticalScrollIndicator={false}>

            {/* Decision reason — plain, no label */}
            <View style={styles.reasonPanel}>
              <Text style={styles.reasonText}>{profile.decisionReason}</Text>
            </View>

            {/* Green flags — left-bordered, dot markers */}
            {profile.greenFlags.length > 0 && (
              <View style={styles.flagGroupGreen}>
                {profile.greenFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <View style={styles.dotGreen} />
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Red flags — left-bordered, dot markers */}
            {profile.redFlags.length > 0 && (
              <View style={styles.flagGroupRed}>
                {profile.redFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <View style={styles.dotRed} />
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Fixed footer — Next button */}
          <View style={[styles.revealFooter, { paddingBottom: Math.max(bottomPadding, 12) }]}>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.85}>
              <LinearGradient
                colors={['#ff6b84', '#ff4d6d', '#e03055']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextBtnGrad}>
                <Text style={styles.nextBtnText}>
                  {state.index >= GAME_SIZE - 1 ? 'See Results 🎉' : 'Next Profile →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
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

  // ── Floating score ─────────────────────────────────────────────────────────
  scoreFloat: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  scoreFloatTxt: {
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  scoreFloatPos: { color: '#4ade80' },
  scoreFloatNeg: { color: '#ff4d6d' },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Progress counter
  progressPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progCurrent: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  progSep: {
    color: 'rgba(255,255,255,0.20)',
    fontSize: 18,
    fontWeight: '400',
    marginHorizontal: 2,
  },
  progTotal: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 16,
    fontWeight: '600',
  },

  // Streak badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.35)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 3,
  },
  streakFire: { fontSize: 13 },
  streakCount: {
    color: '#ff9800',
    fontSize: 15,
    fontWeight: '800',
  },
  comboMult: {
    color: '#ffc107',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 1,
  },

  // Score badge
  scoreBadge: {
    backgroundColor: 'rgba(34,197,94,0.09)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 74,
    alignItems: 'center',
  },
  scoreBadgeNeg: {
    backgroundColor: 'rgba(232,25,60,0.09)',
    borderColor: 'rgba(232,25,60,0.30)',
  },
  scoreText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff4d6d',
    borderRadius: 2,
  },

  // ── Game area ───────────────────────────────────────────────────────────────
  // Centre the card horizontally so dark gutters are visible on both sides.
  gameArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },

  // Column that holds the card stack + buttons as a tight unit.
  cardColumn: {
    alignItems: 'center',
    gap: 12,
  },

  // Card stack — explicit width matches the card so peek card aligns.
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + STACK_OFFSET,
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    top: STACK_OFFSET,
    left: 0,
    right: 0,
    opacity: 0.28,
    transform: [{ scale: 0.96 }],
  },
  activeCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // ── Action buttons ──────────────────────────────────────────────────────────
  // Width matches card so buttons align under its edges.
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 72,
    width: CARD_WIDTH,
  },
  btnGroup: {
    alignItems: 'center',
    gap: 8,
  },
  passBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,25,60,0.08)',
    borderWidth: 2,
    borderColor: '#e8193c',
    shadowColor: '#e8193c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  dateBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  passIcon: {
    color: '#f02040',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    includeFontPadding: false,
  },
  dateIcon: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    includeFontPadding: false,
  },
  passLabel: {
    color: '#e8193c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  dateLabel: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },

  // ── Reveal phase ────────────────────────────────────────────────────────────
  revealArea: {
    flex: 1,
    flexDirection: 'column',
  },

  // Result banner
  revealBanner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 9,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  revealEmoji: {
    fontSize: 50,
  },
  revealTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 27,
  },
  revealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pointsPill: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
  },
  pointsPillGreen: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.32)',
  },
  pointsPillRed: {
    backgroundColor: 'rgba(232,25,60,0.10)',
    borderColor: 'rgba(232,25,60,0.32)',
  },
  pointsVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pointsValGreen: { color: '#4ade80' },
  pointsValRed: { color: '#ff4d6d' },
  comboPill: {
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  comboText: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '700',
  },

  // Scrollable content
  revealScroll: {
    flex: 1,
  },
  revealScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },

  // Reason panel — no label, just the italic verdict text
  reasonPanel: {
    backgroundColor: '#111318',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  reasonText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14.5,
    lineHeight: 23,
    fontStyle: 'italic',
  },

  // Flag groups — left accent border, dot markers, no section headers
  flagGroupGreen: {
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  flagGroupRed: {
    backgroundColor: 'rgba(232,25,60,0.05)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,25,60,0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#e8193c',
  },
  dotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e',
    marginTop: 7,
    flexShrink: 0,
  },
  dotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e8193c',
    marginTop: 7,
    flexShrink: 0,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  flagText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13.5,
    lineHeight: 21,
    flex: 1,
  },

  // Footer — Next button
  revealFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  nextBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 16,
    elevation: 10,
  },
  nextBtnGrad: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
