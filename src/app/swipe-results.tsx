import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const GAME_SIZE = 20;
const MAX_SCORE = GAME_SIZE * 10;

interface Rank {
  title: string;
  emoji: string;
  description: string;
  color: string;
}

function getRank(correct: number): Rank {
  if (correct >= 18) {
    return {
      title: 'Untouchable',
      emoji: '🛡️',
      description:
        "You spotted the red flags AND gave the good ones a chance. Peak dating intelligence. Apps should pay you for consultancy.",
      color: '#4caf50',
    };
  }
  if (correct >= 14) {
    return {
      title: 'Red Flag Radar',
      emoji: '🔍',
      description:
        "Solid. You can smell a walking disaster from across the bar — and you didn't ghost the decent ones either. A few slipped past but you'll survive.",
      color: '#2196f3',
    };
  }
  if (correct >= 10) {
    return {
      title: 'Questionable Taste',
      emoji: '🤔',
      description:
        "You know some red flags but you're also absolutely going to end up with someone who has a 'Backup Options' folder or reject every good person out of paranoia.",
      color: '#ff9800',
    };
  }
  if (correct >= 5) {
    return {
      title: "This Is Why You're Single",
      emoji: '😬',
      description:
        "You missed most of the red flags AND passed on the decent ones. Have you considered that the problem might be the person swiping?",
      color: '#ff7043',
    };
  }
  return {
    title: 'Walking Red Flag',
    emoji: '🚩',
    description:
      "You dated the chaos, ghosted the kind ones, and called it intuition. You ARE the red flag. Therapy. Now.",
    color: '#ff4d6d',
  };
}

export default function SwipeResultsScreen() {
  const { score: scoreParam, correct: correctParam } = useLocalSearchParams<{
    score: string;
    correct: string;
  }>();
  const router = useRouter();

  const score = parseInt(scoreParam ?? '0', 10);
  const correct = parseInt(correctParam ?? '0', 10);
  const wrong = GAME_SIZE - correct;
  const rank = getRank(correct);

  const tiers = [
    { label: 'Untouchable', range: '18–20 correct', color: '#4caf50' },
    { label: 'Red Flag Radar', range: '14–17 correct', color: '#2196f3' },
    { label: 'Questionable Taste', range: '10–13 correct', color: '#ff9800' },
    { label: "This Is Why You're Single", range: '5–9 correct', color: '#ff7043' },
    { label: 'Walking Red Flag', range: '0–4 correct', color: '#ff4d6d' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Game Over</Text>
      <Text style={styles.subheading}>Here's your damage</Text>

      {/* Rank card */}
      <View style={[styles.rankCard, { borderColor: rank.color }]}>
        <Text style={styles.rankEmoji}>{rank.emoji}</Text>
        <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
        <Text style={styles.rankDescription}>{rank.description}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{score > 0 ? '+' : ''}{score}</Text>
          <Text style={styles.statLabel}>Final Score</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statValue, styles.statGreen]}>{correct}</Text>
          <Text style={styles.statLabel}>Correct ✅</Text>
        </View>
        <View style={[styles.statCard, styles.statCardRed]}>
          <Text style={[styles.statValue, styles.statRed]}>{wrong}</Text>
          <Text style={styles.statLabel}>Wrong ❌</Text>
        </View>
      </View>

      {/* Rank ladder */}
      <View style={styles.ladderCard}>
        <Text style={styles.ladderTitle}>Rank Ladder</Text>
        {tiers.map((tier) => (
          <View
            key={tier.label}
            style={[styles.ladderRow, rank.title === tier.label && styles.ladderRowActive]}>
            <View style={[styles.dot, { backgroundColor: tier.color }]} />
            <Text style={[styles.ladderLabel, rank.title === tier.label && styles.ladderLabelActive]}>
              {tier.label}
            </Text>
            <Text style={styles.ladderRange}>{tier.range}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace('/swipe-game')}
        activeOpacity={0.8}>
        <Text style={styles.primaryBtnText}>Play Again 🔄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.replace('/')}
        activeOpacity={0.8}>
        <Text style={styles.secondaryBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subheading: {
    color: '#888',
    fontSize: 16,
    marginTop: -8,
  },
  rankCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    width: '100%',
  },
  rankEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  rankTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  rankDescription: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statCardGreen: {
    borderColor: '#2e4a2e',
    backgroundColor: '#0a1f0a',
  },
  statCardRed: {
    borderColor: '#4a2e2e',
    backgroundColor: '#1f0a0a',
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statGreen: {
    color: '#4caf50',
  },
  statRed: {
    color: '#ff4d6d',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  ladderCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  ladderTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ladderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 8,
  },
  ladderRowActive: {
    backgroundColor: '#2a2a2a',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ladderLabel: {
    color: '#666',
    fontSize: 13,
    flex: 1,
  },
  ladderLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  ladderRange: {
    color: '#444',
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: '#ff4d6d',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#666',
    fontSize: 15,
  },
});
