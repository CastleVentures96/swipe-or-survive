import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SwipeCard, ProfileCardStatic, CARD_HEIGHT, CARD_WIDTH } from '@/components/swipe-card';
import { allProfiles, type Profile } from '@/data/profiles';
import { profileCategories } from '@/data/profile-categories';

const GAME_SIZE = 20;
const STACK_OFFSET = 12;
const BASE_CORRECT_PTS = 10;

const STREAK_BONUSES: Record<number, number> = { 3: 5, 5: 10, 10: 25 };
const STREAK_BONUS_LABELS: Record<number, string> = {
  3:  '🔥 Hat Trick! +5',
  5:  '🔥 On Fire! +10',
  10: '🔥 Unstoppable! +25',
};

function getStreakBonus(streak: number): number {
  return STREAK_BONUSES[streak] ?? 0;
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
  totalComboBonus: number;
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

  // ── Button press + ambient glow animations ────────────────────────────────
  const passScale = useSharedValue(1);
  const dateScale = useSharedValue(1);
  const passGlow  = useSharedValue(0.50);
  const dateGlow  = useSharedValue(0.50);

  const passBtnStyle = useAnimatedStyle(() => ({
    transform:    [{ scale: passScale.value }],
    shadowOpacity: passGlow.value,
    shadowRadius:  interpolate(passGlow.value, [0.38, 0.88], [12, 26], Extrapolation.CLAMP),
  }));
  const dateBtnStyle = useAnimatedStyle(() => ({
    transform:    [{ scale: dateScale.value }],
    shadowOpacity: dateGlow.value,
    shadowRadius:  interpolate(dateGlow.value, [0.38, 0.88], [12, 26], Extrapolation.CLAMP),
  }));

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
    if (points === 0) return;
    setScoreFloat({ text: points > 0 ? `+${points}` : `${points}`, pos: points > 0 });
    scoreFloatY.value = 0;
    scoreFloatOpacity.value = 0;
    scoreFloatOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(1, { duration: 380 }),
      withTiming(0, { duration: 280 })
    );
    scoreFloatY.value = withTiming(-96, { duration: 800 });
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

  // ── Ambient glow pulse for PASS / DATE buttons ────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    passGlow.value = withRepeat(
      withSequence(
        withTiming(0.88, { duration: 1100 }),
        withTiming(0.38, { duration: 1100 }),
      ), -1, true,
    );
    dateGlow.value = withRepeat(
      withSequence(
        withTiming(0.88, { duration: 1350 }),
        withTiming(0.38, { duration: 1350 }),
      ), -1, true,
    );
  }, []);

  // ── Score header pop ──────────────────────────────────────────────────────
  const scoreHeaderScale = useSharedValue(1);
  const scoreHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreHeaderScale.value }],
  }));

  function triggerScorePop() {
    scoreHeaderScale.value = withSequence(
      withTiming(1.38, { duration: 85 }),
      withSpring(1, { damping: 7, stiffness: 240 }),
    );
  }

  // ── Combo streak toast ────────────────────────────────────────────────────
  const comboToastY       = useSharedValue(0);
  const comboToastOpacity = useSharedValue(0);
  const comboToastStyle   = useAnimatedStyle(() => ({
    opacity:   comboToastOpacity.value,
    transform: [{ translateY: comboToastY.value }],
  }));
  const [comboToastText, setComboToastText] = useState('');

  function triggerComboToast(streak: number) {
    const label = STREAK_BONUS_LABELS[streak] ?? `🔥 Combo! +${getStreakBonus(streak)}`;
    setComboToastText(label);
    comboToastOpacity.value = 0;
    comboToastY.value = 0;
    comboToastOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 700 }),
      withTiming(0, { duration: 300 }),
    );
    comboToastY.value = withTiming(-50, { duration: 1100 });
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
    totalComboBonus: 0,
    phase: 'swiping',
    swipedRight: false,
    wasCorrect: false,
    categoryResults: {},
  }));

  const profile = state.profiles[state.index];
  const nextProfile = state.profiles[state.index + 1] ?? null;

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
    const isCorrect  = profile.correctDecision === 'reject';
    const newStreak  = isCorrect ? state.streak + 1 : 0;
    const bonus      = isCorrect ? getStreakBonus(newStreak) : 0;
    const points     = isCorrect ? BASE_CORRECT_PTS + bonus : -BASE_CORRECT_PTS;
    const actualDelta = isCorrect ? points : Math.max(0, state.score + points) - state.score;
    triggerFlash(isCorrect);
    if (!isCorrect) triggerShake();
    triggerScoreFloat(actualDelta);
    triggerScorePop();
    if (bonus > 0) triggerComboToast(newStreak);
    triggerReveal();
    setState((prev) => {
      const ns       = isCorrect ? prev.streak + 1 : 0;
      const b        = isCorrect ? getStreakBonus(ns) : 0;
      const pts      = isCorrect ? BASE_CORRECT_PTS + b : -BASE_CORRECT_PTS;
      const newScore = Math.max(0, prev.score + pts);
      return {
        ...prev,
        score: newScore,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: ns,
        bestStreak: Math.max(ns, prev.streak, prev.bestStreak),
        lastPoints: newScore - prev.score,
        totalComboBonus: prev.totalComboBonus + b,
        phase: 'reveal',
        swipedRight: false,
        wasCorrect: isCorrect,
        categoryResults: updateCategoryResults(prev, profile.id, isCorrect),
      };
    });
  }

  function handleSwipeRight() {
    const isCorrect  = profile.correctDecision === 'date';
    const newStreak  = isCorrect ? state.streak + 1 : 0;
    const bonus      = isCorrect ? getStreakBonus(newStreak) : 0;
    const points     = isCorrect ? BASE_CORRECT_PTS + bonus : -BASE_CORRECT_PTS;
    const actualDelta = isCorrect ? points : Math.max(0, state.score + points) - state.score;
    triggerFlash(isCorrect);
    if (!isCorrect) triggerShake();
    triggerScoreFloat(actualDelta);
    triggerScorePop();
    if (bonus > 0) triggerComboToast(newStreak);
    triggerReveal();
    setState((prev) => {
      const ns       = isCorrect ? prev.streak + 1 : 0;
      const b        = isCorrect ? getStreakBonus(ns) : 0;
      const pts      = isCorrect ? BASE_CORRECT_PTS + b : -BASE_CORRECT_PTS;
      const newScore = Math.max(0, prev.score + pts);
      return {
        ...prev,
        score: newScore,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        streak: ns,
        bestStreak: Math.max(ns, prev.streak, prev.bestStreak),
        lastPoints: newScore - prev.score,
        totalComboBonus: prev.totalComboBonus + b,
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
          totalComboBonus: String(state.totalComboBonus),
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
  const lastBonus = state.wasCorrect ? state.lastPoints - BASE_CORRECT_PTS : 0;

  // Badge colour: green when scoring, red when floored (wrongs exist), neutral before first answer
  const answeredCount = state.phase === 'swiping' ? state.index : state.index + 1;
  const wrongCount    = answeredCount - state.correct;

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
  const bottomPadding = insets.bottom + 10;

  return (
    <View style={styles.container}>
      {/* Flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerRow}>

          {/* Exit to home */}
          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={styles.exitBtn}>
            <Text style={styles.exitBtnTxt}>←</Text>
          </TouchableOpacity>

          {/* Progress counter */}
          <View style={styles.progressPill}>
            <Text style={styles.progCurrent}>{progress}</Text>
            <Text style={styles.progSep}> / </Text>
            <Text style={styles.progTotal}>{GAME_SIZE}</Text>
          </View>

          {/* Streak badge */}
          {state.streak >= 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{state.streak}</Text>
            </View>
          )}

          {/* Score */}
          <Animated.View style={[
            styles.scoreBadge,
            state.score === 0 && wrongCount > 0 ? styles.scoreBadgeNeg
            : state.score === 0 ? styles.scoreBadgeNeutral
            : null,
            scoreHeaderStyle,
          ]}>
            <Text style={styles.scoreText}>
              {state.score > 0 ? '+' : ''}{state.score}
            </Text>
          </Animated.View>
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

      {/* Combo streak toast — appears above score float on milestone hits */}
      <Animated.View style={[styles.comboToast, comboToastStyle]} pointerEvents="none">
        <Text style={styles.comboToastText}>{comboToastText}</Text>
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
                  onPressIn={() => { passScale.value = withTiming(0.82, { duration: 65 }); }}
                  onPressOut={() => { passScale.value = withSpring(1, { damping: 6, stiffness: 260 }); }}
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
                  onPressIn={() => { dateScale.value = withTiming(0.82, { duration: 65 }); }}
                  onPressOut={() => { dateScale.value = withSpring(1, { damping: 6, stiffness: 260 }); }}
                  onPress={handleSwipeRight}
                  hitSlop={14}>
                  <Animated.View style={[styles.dateBtn, dateBtnStyle]}>
                    <Text style={styles.dateIcon}>♥</Text>
                  </Animated.View>
                </Pressable>
                <Text style={styles.dateLabel}>DATE</Text>
              </View>
            </View>

            {/* First-card hint — only shown on card 1 */}
            {state.index === 0 && (
              <Text style={styles.hintBanner}>
                💚 Date the good ones · ✕ Pass on the red flags
              </Text>
            )}

          </View>

          <View style={{ height: bottomPadding }} />
        </View>
      )}

      {/* ── Reveal phase ────────────────────────────────────────────────────── */}
      {state.phase === 'reveal' && (
        <Animated.View style={[styles.revealArea, revealAnimStyle]}>
          <ScrollView
            style={styles.revealScroll}
            contentContainerStyle={[
              styles.revealScrollContent,
              { paddingBottom: Math.max(bottomPadding, 24) },
            ]}
            showsVerticalScrollIndicator={false}>

            {/* ── Reveal card — same width, radius, and shadow as profile card ── */}
            <View style={[
              styles.revealCard,
              { shadowColor: state.wasCorrect ? '#22c55e' : '#e8193c' },
            ]}>

              {/* 1. Result icon */}
              <View style={[
                styles.resultIconWrap,
                state.wasCorrect ? styles.resultIconGreen : styles.resultIconRed,
              ]}>
                <Text style={[
                  styles.resultIconTxt,
                  state.wasCorrect ? styles.resultIconTxtGreen : styles.resultIconTxtRed,
                ]}>
                  {state.wasCorrect ? '✓' : '✕'}
                </Text>
              </View>

              {/* 2. Result title */}
              <Text style={styles.resultTitle}>
                {state.wasCorrect
                  ? state.streak >= 10 ? '🔥 Unstoppable'
                  : state.streak >= 5  ? '🔥 On Fire'
                  : state.streak >= 3  ? '🔥 Hat Trick'
                  : state.swipedRight  ? '💚 Good Eye'
                  : '✅ Red Flag Spotted'
                : state.swipedRight    ? '💀 Fell For It'
                : '😬 Missed This One'}
              </Text>

              {/* What the player did */}
              <Text style={styles.resultSubtitle}>
                {state.swipedRight
                  ? `You dated ${profile.name}`
                  : `You passed on ${profile.name}`}
              </Text>

              {/* 3. Score change */}
              <View style={[
                styles.scorePill,
                state.wasCorrect        ? styles.scorePillGreen
                : state.lastPoints < 0  ? styles.scorePillRed
                : styles.scorePillNeutral,
              ]}>
                <Text style={[
                  styles.scoreChangeNum,
                  state.wasCorrect        ? styles.scoreChangeGreen
                  : state.lastPoints < 0  ? styles.scoreChangeRed
                  : styles.scoreChangeNeutral,
                ]}>
                  {state.lastPoints > 0 ? '+' : ''}{state.lastPoints} pts
                </Text>
              </View>

              {/* Combo bonus — only shows when a milestone bonus was earned */}
              {lastBonus > 0 && (
                <View style={styles.comboBadge}>
                  <Text style={styles.comboBadgeTxt}>🔥 +{lastBonus} streak bonus!</Text>
                </View>
              )}

              {/* Divider */}
              <View style={styles.revealDivider} />

              {/* 4. Explanation */}
              <Text style={styles.explanationText}>{profile.decisionReason}</Text>

              {/* 5. Green flags */}
              {profile.greenFlags.length > 0 && (
                <View style={styles.flagCardGreen}>
                  <View style={styles.flagCardHeader}>
                    <View style={styles.flagHeaderDotGreen} />
                    <Text style={styles.flagCardTitleGreen}>Green Flags</Text>
                  </View>
                  {profile.greenFlags.map((flag, i) => (
                    <View key={i} style={styles.flagItem}>
                      <View style={styles.dotGreen} />
                      <Text style={styles.flagText}>{flag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 6. Red flags */}
              {profile.redFlags.length > 0 && (
                <View style={styles.flagCardRed}>
                  <View style={styles.flagCardHeader}>
                    <View style={styles.flagHeaderDotRed} />
                    <Text style={styles.flagCardTitleRed}>Red Flags</Text>
                  </View>
                  {profile.redFlags.map((flag, i) => (
                    <View key={i} style={styles.flagItem}>
                      <View style={styles.dotRed} />
                      <Text style={styles.flagText}>{flag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 7. Next Profile button */}
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
          </ScrollView>
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

  // ── Combo streak toast ─────────────────────────────────────────────────────
  comboToast: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1002,
    pointerEvents: 'none',
  },
  comboToastText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffc107',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 14,
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
    fontSize: 72,
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

  // Exit button — 44×44pt minimum touch target (iOS HIG)
  exitBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  exitBtnTxt: {
    color: '#555',
    fontSize: 20,
    fontWeight: '400',
  },

  // First-card hint
  hintBanner: {
    color: '#444',
    fontSize: 12,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 2,
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
  scoreBadgeNeutral: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 74,
    alignItems: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Progress bar
  progressTrack: {
    height: 4,
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
    width: 86,
    height: 86,
    borderRadius: 43,
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
    width: 86,
    height: 86,
    borderRadius: 43,
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
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    includeFontPadding: false,
  },
  dateIcon: {
    color: '#22c55e',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
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

  // ── Reveal phase ─────────────────────────────────────────────────────────────
  revealArea: {
    flex: 1,
  },
  revealScroll: {
    flex: 1,
  },
  // Centres the reveal card with matching gutters to the gameplay screen.
  revealScrollContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 24,
  },

  // The reveal card — identical width, radius, background, and shadow treatment
  // as the profile card so both screens feel like the same design system.
  revealCard: {
    width: CARD_WIDTH,
    backgroundColor: '#111319',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.50,
    shadowRadius: 30,
    elevation: 20,
    padding: 22,
    gap: 14,
    alignItems: 'center',
  },

  // 1. Result icon — coloured circle
  resultIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resultIconGreen: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.40)',
  },
  resultIconRed: {
    backgroundColor: 'rgba(232,25,60,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(232,25,60,0.40)',
  },
  resultIconTxt: {
    fontSize: 34,
    fontWeight: '900',
  },
  resultIconTxtGreen: { color: '#4ade80' },
  resultIconTxtRed:   { color: '#ff4d6d' },

  // 2. Title
  resultTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },

  // What the player did (smaller, dimmed)
  resultSubtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: -6,
  },

  // 3. Score pill
  scorePill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  scorePillGreen: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.30)',
  },
  scorePillRed: {
    backgroundColor: 'rgba(232,25,60,0.10)',
    borderColor: 'rgba(232,25,60,0.30)',
  },
  scorePillNeutral: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  scoreChangeNum: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreChangeGreen:   { color: '#4ade80' },
  scoreChangeRed:     { color: '#ff4d6d' },
  scoreChangeNeutral: { color: 'rgba(255,255,255,0.38)' },

  // Combo bonus badge
  comboBadge: {
    backgroundColor: 'rgba(255,152,0,0.10)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  comboBadgeTxt: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '700',
  },

  // Divider — full width of card
  revealDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // 4. Explanation — italic, centred
  explanationText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14.5,
    lineHeight: 23,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // 5+6. Flag cards — same left-border treatment, full width within reveal card
  flagCardGreen: {
    width: '100%',
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  flagCardRed: {
    width: '100%',
    backgroundColor: 'rgba(232,25,60,0.05)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,25,60,0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#e8193c',
  },
  flagCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  flagHeaderDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e',
  },
  flagHeaderDotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e8193c',
  },
  flagCardTitleGreen: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  flagCardTitleRed: {
    color: '#ff4d6d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginTop: 7,
    flexShrink: 0,
  },
  dotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8193c',
    marginTop: 7,
    flexShrink: 0,
  },
  flagText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13.5,
    lineHeight: 21,
    flex: 1,
  },

  // 7. Next button — full width of reveal card, same pink gradient as home CTA
  nextBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    marginTop: 4,
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
