import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { scenarios } from '@/data/scenarios';

interface Rank {
  title: string;
  emoji: string;
  description: string;
  color: string;
}

function getRank(score: number, total: number): Rank {
  const pct = score / total;
  if (pct >= 0.84) {
    return {
      title: 'Human Lie Detector',
      emoji: '🔍',
      description:
        "You can spot a red flag from three suburbs away. You see through everything. Protect yourself at all costs — you know too much.",
      color: '#4caf50',
    };
  }
  if (pct >= 0.56) {
    return {
      title: 'Relationship Survivor',
      emoji: '🛡️',
      description:
        "You've been through some things. You've learned from them. You're still standing. That counts for a lot.",
      color: '#2196f3',
    };
  }
  if (pct >= 0.28) {
    return {
      title: 'Questionable Taste',
      emoji: '🤔',
      description:
        "You mean well, but you'd absolutely date someone with a folder called 'Backup Options'. You should speak to a professional.",
      color: '#ff9800',
    };
  }
  return {
    title: 'Walking Red Flag',
    emoji: '🚩',
    description:
      "Bestie. BESTIE. You are the red flag. You'd see 'we need to talk' and think that's just their flirting style.",
    color: '#ff4d6d',
  };
}

export default function ResultsScreen() {
  const { score: scoreParam } = useLocalSearchParams<{ score: string }>();
  const router = useRouter();

  const score = parseInt(scoreParam ?? '0', 10);
  const total = scenarios.length;
  const rank = getRank(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Results</Text>

      {/* Rank card */}
      <View style={[styles.rankCard, { borderColor: rank.color }]}>
        <Text style={styles.rankEmoji}>{rank.emoji}</Text>
        <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
        <Text style={styles.rankDescription}>{rank.description}</Text>
      </View>

      {/* Score card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreEyebrow}>Your Score</Text>
        <Text style={styles.scoreValue}>
          {score}
          <Text style={styles.scoreTotal}> / {total}</Text>
        </Text>
        <Text style={styles.scorePercent}>{pct}% correct</Text>
      </View>

      {/* Rank ladder */}
      <View style={styles.ladderCard}>
        <Text style={styles.ladderTitle}>Rank Ladder</Text>
        {[
          { label: 'Human Lie Detector', threshold: '84–100%', color: '#4caf50' },
          { label: 'Relationship Survivor', threshold: '56–83%', color: '#2196f3' },
          { label: 'Questionable Taste', threshold: '28–55%', color: '#ff9800' },
          { label: 'Walking Red Flag', threshold: '0–27%', color: '#ff4d6d' },
        ].map((tier) => (
          <View
            key={tier.label}
            style={[
              styles.ladderRow,
              rank.title === tier.label && styles.ladderRowActive,
            ]}>
            <View style={[styles.ladderDot, { backgroundColor: tier.color }]} />
            <Text
              style={[
                styles.ladderLabel,
                rank.title === tier.label && styles.ladderLabelActive,
              ]}>
              {tier.label}
            </Text>
            <Text style={styles.ladderThreshold}>{tier.threshold}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/')}
        activeOpacity={0.8}>
        <Text style={styles.buttonText}>Play Again</Text>
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
  },
  heading: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 28,
  },
  rankCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    width: '100%',
    marginBottom: 16,
  },
  rankEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  rankTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  rankDescription: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  scoreEyebrow: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 52,
    fontWeight: 'bold',
    lineHeight: 60,
  },
  scoreTotal: {
    color: '#888',
    fontSize: 28,
    fontWeight: 'normal',
  },
  scorePercent: {
    color: '#888',
    fontSize: 15,
    marginTop: 4,
  },
  ladderCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
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
    padding: 10,
    borderRadius: 8,
  },
  ladderRowActive: {
    backgroundColor: '#2a2a2a',
  },
  ladderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ladderLabel: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
  ladderLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  ladderThreshold: {
    color: '#555',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#ff4d6d',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
