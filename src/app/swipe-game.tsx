import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SwipeCard } from '@/components/swipe-card';
import { allProfiles, type Profile } from '@/data/profiles';

const GAME_SIZE = 20;

type Phase = 'swiping' | 'reveal';

interface GameState {
  profiles: Profile[];
  index: number;
  score: number;
  correct: number;
  phase: Phase;
  swipedRight: boolean;
  wasCorrect: boolean;
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

  const [state, setState] = useState<GameState>(() => ({
    profiles: shuffle(allProfiles).slice(0, GAME_SIZE),
    index: 0,
    score: 0,
    correct: 0,
    phase: 'swiping',
    swipedRight: false,
    wasCorrect: false,
  }));

  const profile = state.profiles[state.index];

  function handleSwipeLeft() {
    const isCorrect = profile.correctDecision === 'reject';
    setState((prev) => ({
      ...prev,
      score: prev.score + (isCorrect ? 10 : -10),
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      phase: 'reveal',
      swipedRight: false,
      wasCorrect: isCorrect,
    }));
  }

  function handleSwipeRight() {
    const isCorrect = profile.correctDecision === 'date';
    setState((prev) => ({
      ...prev,
      score: prev.score + (isCorrect ? 10 : -10),
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      phase: 'reveal',
      swipedRight: true,
      wasCorrect: isCorrect,
    }));
  }

  function handleNext() {
    const isLast = state.index >= GAME_SIZE - 1;
    if (isLast) {
      router.replace({
        pathname: '/swipe-results',
        params: { score: String(state.score), correct: String(state.correct) },
      });
    } else {
      setState((prev) => ({
        ...prev,
        index: prev.index + 1,
        phase: 'swiping',
        swipedRight: false,
        wasCorrect: false,
      }));
    }
  }

  const progress = state.index + 1;
  const progressPct = (progress / GAME_SIZE) * 100;

  // Build reveal title based on what the player did vs what was correct
  function getRevealTitle() {
    if (state.wasCorrect) {
      if (state.swipedRight) return `You dated ${profile.name} 💚`;
      return `You rejected ${profile.name} ✅`;
    }
    if (state.swipedRight) return `You dated ${profile.name}... 💔`;
    return `You passed on ${profile.name}... 😬`;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.progressNum}>{progress} / {GAME_SIZE}</Text>
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: `${progressPct}%` as `${number}%` }]} />
          </View>
        </View>
        <View style={[styles.scoreBadge, state.score < 0 && styles.scoreBadgeNeg]}>
          <Text style={styles.scoreText}>{state.score > 0 ? '+' : ''}{state.score}</Text>
        </View>
      </View>

      {/* Card / Reveal area */}
      <ScrollView
        contentContainerStyle={styles.cardArea}
        scrollEnabled={state.phase === 'reveal'}
        showsVerticalScrollIndicator={false}>

        {state.phase === 'swiping' && (
          <>
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={handleSwipeLeft}
                activeOpacity={0.8}>
                <Text style={styles.actionBtnIcon}>❌</Text>
                <Text style={styles.rejectLabel}>REJECT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.dateBtn]}
                onPress={handleSwipeRight}
                activeOpacity={0.8}>
                <Text style={styles.actionBtnIcon}>💚</Text>
                <Text style={styles.dateLabel}>DATE</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.swipeHint}>← swipe left to reject · swipe right to date →</Text>
          </>
        )}

        {state.phase === 'reveal' && (
          <View style={[styles.revealCard, state.wasCorrect ? styles.revealCorrect : styles.revealWrong]}>
            <Text style={styles.revealEmoji}>{state.wasCorrect ? '✅' : '❌'}</Text>
            <Text style={styles.revealTitle}>{getRevealTitle()}</Text>

            {/* Score delta */}
            <View style={styles.scoreDelta}>
              <Text style={[styles.scoreDeltaText, state.wasCorrect ? styles.positiveScore : styles.negativeScore]}>
                {state.wasCorrect ? '+10 points' : '-10 points'}
              </Text>
            </View>

            {/* Decision reason */}
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{profile.decisionReason}</Text>
            </View>

            {/* Green flags */}
            {profile.greenFlags.length > 0 && (
              <View style={[styles.flagsSection, styles.greenSection]}>
                <Text style={[styles.flagsTitle, styles.greenTitle]}>✅ Green Flags</Text>
                {profile.greenFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <Text style={styles.greenBullet}>✅</Text>
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Red flags */}
            {profile.redFlags.length > 0 && (
              <View style={[styles.flagsSection, styles.redSection]}>
                <Text style={[styles.flagsTitle, styles.redTitle]}>🚩 Red Flags</Text>
                {profile.redFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <Text style={styles.redBullet}>🚩</Text>
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {profile.greenFlags.length === 0 && profile.redFlags.length === 0 && (
              <View style={[styles.flagsSection, styles.greenSection]}>
                <Text style={[styles.flagsTitle, styles.greenTitle]}>✅ No red flags detected</Text>
                <Text style={styles.flagText}>A genuinely clean profile. They do exist.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>
                {state.index >= GAME_SIZE - 1 ? 'See Results 🎉' : 'Next Profile →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 14,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  progressNum: {
    color: '#888',
    fontSize: 13,
  },
  progressBarOuter: {
    height: 5,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#ff4d6d',
    borderRadius: 3,
  },
  scoreBadge: {
    backgroundColor: '#1c3a1c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  scoreBadgeNeg: {
    backgroundColor: '#3a1c1c',
    borderColor: '#ff4d6d',
  },
  scoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardArea: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    gap: 2,
  },
  rejectBtn: {
    backgroundColor: '#2e0a10',
    borderColor: '#ff4d6d',
  },
  dateBtn: {
    backgroundColor: '#0a2e10',
    borderColor: '#4caf50',
  },
  actionBtnIcon: {
    fontSize: 22,
  },
  rejectLabel: {
    color: '#ff4d6d',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dateLabel: {
    color: '#4caf50',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  swipeHint: {
    color: '#444',
    fontSize: 12,
    textAlign: 'center',
  },
  revealCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 16,
  },
  revealCorrect: {
    backgroundColor: '#0a1f0a',
    borderColor: '#4caf50',
  },
  revealWrong: {
    backgroundColor: '#1f0a0a',
    borderColor: '#ff4d6d',
  },
  revealEmoji: {
    fontSize: 52,
  },
  revealTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreDelta: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  scoreDeltaText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveScore: {
    color: '#4caf50',
  },
  negativeScore: {
    color: '#ff4d6d',
  },
  reasonBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  reasonText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flagsSection: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  greenSection: {
    backgroundColor: '#0a1f0a',
    borderWidth: 1,
    borderColor: '#2e4a2e',
  },
  redSection: {
    backgroundColor: '#1f0a0a',
    borderWidth: 1,
    borderColor: '#4a2e2e',
  },
  flagsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  greenTitle: {
    color: '#4caf50',
  },
  redTitle: {
    color: '#ff4d6d',
  },
  flagRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  greenBullet: {
    fontSize: 13,
    marginTop: 2,
  },
  redBullet: {
    fontSize: 13,
    marginTop: 2,
  },
  flagText: {
    color: '#ddd',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  nextBtn: {
    backgroundColor: '#ff4d6d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
