import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CATEGORY_META, type ProfileCategory } from '@/data/profile-categories';

const GAME_SIZE = 20;

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

interface CatStat {
  key: ProfileCategory;
  seen: number;
  correct: number;
}

function getCategoryQuip(key: ProfileCategory, seen: number, correct: number): string {
  const pct = Math.round((correct / seen) * 100);
  const meta = CATEGORY_META[key];

  if (seen === 1) {
    if (correct === 1) return `You handled the only ${meta.plural} you met. Barely counts, but we'll take it.`;
    return `One ${key} showed up and took you out completely. Embarrassing.`;
  }

  if (pct === 100) {
    const lines: Record<string, string> = {
      Crypto:       "Zero crypto losses. You have been burned before and you remembered.",
      Gym:          "Every Gym Bro correctly handled. You know the look.",
      Influencer:   "Every Influencer identified. The ring light did not fool you.",
      Tradie:       "Flawless on Tradies. You know the difference between handy and impossible.",
      FIFO:         "Perfect on FIFO Workers. Long distance is not a personality.",
      Traveller:    "You correctly assessed every Traveller. The passport photo says nothing.",
      Spiritual:    "Every Spiritual Type correctly handled. The tarot said no and so did you.",
      Gamer:        "Flawless on Gamers. You have probably dated one before.",
      Corporate:    "Perfect on Corporate Types. You speak the language.",
      Nurse:        "Every Nurse or health worker correctly assessed. You know the good ones.",
      Teacher:      "Flawless on Teachers. You understand the assignment.",
      Entrepreneur: "Zero entrepreneur losses. You can spot a 'vision' from a mile away.",
      Fitness:      "Every Fitness Fanatic correctly handled. You know the difference between healthy and insufferable.",
      Creative:     "Flawless on Creatives. You can tell real from performance.",
      Outdoors:     "Perfect on Outdoorsy Types. You know who comes home and who doesn't.",
    };
    return lines[key] ?? `Flawless on ${meta.plural}. That category had no chance.`;
  }

  if (pct === 0) {
    const lines: Record<string, string> = {
      Crypto:       `${seen} Crypto Bros. ${seen} times you fell for it. The blockchain is laughing.`,
      Gym:          `${seen} Gym Bros walked through and you missed every one. The forearms got you.`,
      Influencer:   `${seen} Influencers and zero correct reads. You are the target demographic.`,
      Tradie:       `Every Tradie fooled you. You cannot tell a good sparkie from a disaster.`,
      FIFO:         `Every FIFO Worker got past you. The roster is not romantic.`,
      Traveller:    `Zero Travellers correctly handled. You always fall for someone with a connecting flight.`,
      Spiritual:    `Every Spiritual Type slipped through. Mercury retrograde is not responsible for your choices.`,
      Gamer:        `You missed every Gamer. You might be one of them.`,
      Corporate:    `${seen} Corporate Types and zero correct reads. The salary blinded you.`,
      Nurse:        `You got every Nurse wrong. They are trying to help you.`,
      Teacher:      `You failed every Teacher. The irony is noted.`,
      Entrepreneur: `${seen} Entrepreneurs in and not one correctly handled. You will become a line item.`,
      Fitness:      `Every Fitness Fanatic got past you. You are not immune to the calves.`,
      Creative:     `${seen} Creatives and zero correct reads. You love potential more than people.`,
      Outdoors:     `Every Outdoorsy Type fooled you. The hiking boots meant nothing.`,
    };
    return lines[key] ?? `0 from ${seen} on ${meta.plural}. That category has your number.`;
  }

  if (pct >= 75) return `Mostly solid on ${meta.plural}. ${seen - correct} got through the filter.`;
  if (pct >= 50) return `Even odds on ${meta.plural}. They had you half the time.`;
  return `${meta.plural} played you more often than not. ${correct} from ${seen}.`;
}

function generateHeadlines(stats: CatStat[]): string[] {
  const lines: string[] = [];

  const mostSeen = [...stats].sort((a, b) => b.seen - a.seen)[0];
  if (mostSeen) {
    const meta = CATEGORY_META[mostSeen.key];
    lines.push(`You survived ${mostSeen.seen} ${meta.plural}`);
  }

  const perfect = stats.filter((s) => s.seen > 1 && s.correct === s.seen);
  if (perfect.length > 0) {
    const meta = CATEGORY_META[perfect[0].key];
    lines.push(`Flawless read on ${meta.plural} (${perfect[0].correct}/${perfect[0].seen})`);
  }

  const zeroes = stats.filter((s) => s.correct === 0 && s.seen > 0);
  if (zeroes.length > 0) {
    const meta = CATEGORY_META[zeroes[0].key];
    lines.push(`${meta.plural} took you out — 0 from ${zeroes[0].seen}`);
  }

  const highAccuracy = stats
    .filter((s) => s.seen >= 2 && s.correct / s.seen >= 0.67 && s.correct < s.seen)
    .sort((a, b) => b.correct / b.seen - a.correct / a.seen)[0];
  if (highAccuracy && lines.length < 3) {
    const meta = CATEGORY_META[highAccuracy.key];
    const pct = Math.round((highAccuracy.correct / highAccuracy.seen) * 100);
    lines.push(`You identified ${pct}% of ${meta.plural}`);
  }

  return lines.slice(0, 3);
}

export default function SwipeResultsScreen() {
  const {
    score: scoreParam,
    correct: correctParam,
    bestStreak: bestStreakParam,
    categoryResults: categoryResultsParam,
  } = useLocalSearchParams<{
    score: string;
    correct: string;
    bestStreak: string;
    categoryResults: string;
  }>();
  const router = useRouter();

  const score = parseInt(scoreParam ?? '0', 10);
  const correct = parseInt(correctParam ?? '0', 10);
  const bestStreak = parseInt(bestStreakParam ?? '0', 10);
  const wrong = GAME_SIZE - correct;
  const rank = getRank(correct);

  const rawCategoryResults: Record<string, { seen: number; correct: number }> =
    categoryResultsParam ? JSON.parse(categoryResultsParam) : {};

  const categoryStats: CatStat[] = Object.entries(rawCategoryResults)
    .map(([key, val]) => ({ key: key as ProfileCategory, seen: val.seen, correct: val.correct }))
    .sort((a, b) => b.seen - a.seen || b.correct - a.correct);

  const headlines = generateHeadlines(categoryStats);

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
          <Text style={styles.statLabel}>Score</Text>
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

      {/* Streak stat */}
      {bestStreak >= 2 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakRowEmoji}>🔥</Text>
          <Text style={styles.streakRowLabel}>
            Best streak:{' '}
            <Text style={styles.streakRowValue}>{bestStreak} in a row</Text>
          </Text>
          {bestStreak >= 5 && (
            <View style={styles.streakCombo}>
              <Text style={styles.streakComboText}>×2 COMBO</Text>
            </View>
          )}
          {bestStreak >= 3 && bestStreak < 5 && (
            <View style={styles.streakCombo}>
              <Text style={styles.streakComboText}>×1.5 COMBO</Text>
            </View>
          )}
        </View>
      )}

      {/* Category breakdown */}
      {categoryStats.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>

          {/* Headline callouts */}
          {headlines.length > 0 && (
            <View style={styles.headlinesCard}>
              {headlines.map((line, i) => (
                <View key={i} style={[styles.headlineLine, i > 0 && styles.headlineLineBorder]}>
                  <Text style={styles.headlineText}>{line}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Per-category rows */}
          {categoryStats.map((stat) => {
            const meta = CATEGORY_META[stat.key];
            if (!meta) return null;
            const pct = Math.round((stat.correct / stat.seen) * 100);
            const isGood = pct >= 67;
            const isBad = pct < 40;
            const quip = getCategoryQuip(stat.key, stat.seen, stat.correct);
            return (
              <View key={stat.key} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Text style={styles.catEmoji}>{meta.emoji}</Text>
                  <Text style={styles.catLabel}>{meta.plural}</Text>
                  <View style={[
                    styles.catBadge,
                    isGood ? styles.catBadgeGood : isBad ? styles.catBadgeBad : styles.catBadgeMid,
                  ]}>
                    <Text style={[
                      styles.catBadgeText,
                      isGood ? styles.catTextGood : isBad ? styles.catTextBad : styles.catTextMid,
                    ]}>
                      {stat.correct}/{stat.seen}
                    </Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View style={styles.catBar}>
                  <View style={[
                    styles.catBarFill,
                    { width: `${pct}%` as `${number}%` },
                    isGood ? styles.catBarGood : isBad ? styles.catBarBad : styles.catBarMid,
                  ]} />
                </View>
                <Text style={styles.catQuip}>{quip}</Text>
              </View>
            );
          })}
        </View>
      )}

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

  // ── Rank card ──────────────────────────────────────────────────────────────
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

  // ── Stats row ──────────────────────────────────────────────────────────────
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

  // ── Streak row ─────────────────────────────────────────────────────────────
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4a3000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  streakRowEmoji: {
    fontSize: 22,
  },
  streakRowLabel: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
  streakRowValue: {
    color: '#ff9800',
    fontWeight: '700',
  },
  streakCombo: {
    backgroundColor: '#2b1a00',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e67e00',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakComboText: {
    color: '#ffcc02',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Category section ───────────────────────────────────────────────────────
  categorySection: {
    width: '100%',
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },

  headlinesCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  headlineLine: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headlineLineBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  headlineText: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  catRow: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#252525',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catEmoji: {
    fontSize: 18,
  },
  catLabel: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.1,
  },
  catBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  catBadgeGood: {
    backgroundColor: '#071407',
    borderColor: '#2d6a2d',
  },
  catBadgeMid: {
    backgroundColor: '#1a1200',
    borderColor: '#5a4000',
  },
  catBadgeBad: {
    backgroundColor: '#140707',
    borderColor: '#6a2d2d',
  },
  catBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  catTextGood: {
    color: '#4caf50',
  },
  catTextMid: {
    color: '#ff9800',
  },
  catTextBad: {
    color: '#ff4d6d',
  },
  catBar: {
    height: 3,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  catBarGood: {
    backgroundColor: '#4caf50',
  },
  catBarMid: {
    backgroundColor: '#ff9800',
  },
  catBarBad: {
    backgroundColor: '#ff4d6d',
  },
  catQuip: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // ── Rank ladder ────────────────────────────────────────────────────────────
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

  // ── Buttons ────────────────────────────────────────────────────────────────
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
