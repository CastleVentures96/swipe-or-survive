import { useState } from 'react';
import { Dimensions, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_META, type ProfileCategory } from '@/data/profile-categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(520, SCREEN_WIDTH - 32);
const GAME_SIZE = 20;

interface Rank {
  title: string;
  emoji: string;
  description: string;
  color: string;
}

function buildShareText(
  rankTitle: string,
  rankEmoji: string,
  score: number,
  correct: number,
  bestStreak: number,
): string {
  const scorePart = `${score > 0 ? '+' : ''}${score} pts`;
  const streakPart = bestStreak >= 3 ? ` · 🔥 ${bestStreak} streak` : '';
  return (
    `I got "${rankTitle}" in Swipe or Survive ${rankEmoji}\n` +
    `${correct}/20 correct · ${scorePart}${streakPart}\n` +
    `Can you do better? 🚩`
  );
}

function getStreakSummary(bestStreak: number): string {
  if (bestStreak >= 10) return "Ten in a row. That's not instinct, that's damage paying dividends.";
  if (bestStreak >= 7)  return "A streak that long means you've been genuinely hurt before. Growth.";
  if (bestStreak >= 5)  return "Five in a row. You were briefly unstoppable before reality returned.";
  if (bestStreak >= 3)  return "Hat trick. A glimpse of who you could be if you stayed off apps.";
  if (bestStreak >= 2)  return "Two in a row. A promising start that went nowhere.";
  return "No consecutive correct reads. Every wrong choice was a standalone event.";
}

function getRank(correct: number): Rank {
  if (correct >= 18) {
    return {
      title: 'Untouchable',
      emoji: '🛡️',
      description: "You spotted the red flags AND gave the good ones a chance. Peak dating intelligence. Apps should pay you for consultancy.",
      color: '#4caf50',
    };
  }
  if (correct >= 14) {
    return {
      title: 'Red Flag Radar',
      emoji: '🔍',
      description: "Solid. You can smell a walking disaster from across the bar — and you didn't ghost the decent ones either. A few slipped past but you'll survive.",
      color: '#2196f3',
    };
  }
  if (correct >= 10) {
    return {
      title: 'Questionable Taste',
      emoji: '🤔',
      description: "You know some red flags but you're also absolutely going to end up with someone who has a 'Backup Options' folder or reject every good person out of paranoia.",
      color: '#ff9800',
    };
  }
  if (correct >= 5) {
    return {
      title: "This Is Why You're Single",
      emoji: '😬',
      description: "You missed most of the red flags AND passed on the decent ones. Have you considered that the problem might be the person swiping?",
      color: '#ff7043',
    };
  }
  return {
    title: 'Walking Red Flag',
    emoji: '🚩',
    description: "You dated the chaos, ghosted the kind ones, and called it intuition. You ARE the red flag. Therapy. Now.",
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
    lines.push(`You survived ${mostSeen.seen} ${CATEGORY_META[mostSeen.key].plural}`);
  }
  const perfect = stats.filter((s) => s.seen > 1 && s.correct === s.seen);
  if (perfect.length > 0) {
    lines.push(`Flawless read on ${CATEGORY_META[perfect[0].key].plural} (${perfect[0].correct}/${perfect[0].seen})`);
  }
  const zeroes = stats.filter((s) => s.correct === 0 && s.seen > 0);
  if (zeroes.length > 0) {
    lines.push(`${CATEGORY_META[zeroes[0].key].plural} took you out — 0 from ${zeroes[0].seen}`);
  }
  const highAccuracy = stats
    .filter((s) => s.seen >= 2 && s.correct / s.seen >= 0.67 && s.correct < s.seen)
    .sort((a, b) => b.correct / b.seen - a.correct / a.seen)[0];
  if (highAccuracy && lines.length < 3) {
    const pct = Math.round((highAccuracy.correct / highAccuracy.seen) * 100);
    lines.push(`You identified ${pct}% of ${CATEGORY_META[highAccuracy.key].plural}`);
  }
  return lines.slice(0, 3);
}

export default function SwipeResultsScreen() {
  const {
    score: scoreParam,
    correct: correctParam,
    bestStreak: bestStreakParam,
    totalComboBonus: totalComboBonusParam,
    categoryResults: categoryResultsParam,
  } = useLocalSearchParams<{
    score: string;
    correct: string;
    bestStreak: string;
    totalComboBonus: string;
    categoryResults: string;
  }>();
  const router = useRouter();

  const score           = parseInt(scoreParam           ?? '0', 10);
  const correct         = parseInt(correctParam         ?? '0', 10);
  const bestStreak      = parseInt(bestStreakParam      ?? '0', 10);
  const totalComboBonus = parseInt(totalComboBonusParam ?? '0', 10);
  const wrong           = GAME_SIZE - correct;
  const rank            = getRank(correct);

  let rawCategoryResults: Record<string, { seen: number; correct: number }> = {};
  try {
    if (categoryResultsParam) rawCategoryResults = JSON.parse(categoryResultsParam);
  } catch { /* corrupted params — show results without category breakdown */ }
  const categoryStats: CatStat[] = Object.entries(rawCategoryResults)
    .map(([key, val]) => ({ key: key as ProfileCategory, seen: val.seen, correct: val.correct }))
    .sort((a, b) => b.seen - a.seen || b.correct - a.correct);
  const headlines = generateHeadlines(categoryStats);

  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  async function handleShare() {
    const text = buildShareText(rank.title, rank.emoji, score, correct, bestStreak);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch { /* unavailable */ }
    } else {
      try {
        await Share.share({ message: text });
      } catch { /* cancelled */ }
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop:    Math.max(40, insets.top + 16),
          paddingBottom: Math.max(40, insets.bottom + 24),
        },
      ]}
      showsVerticalScrollIndicator={false}>

      {/* ── Single centered results card ─────────────────────────────── */}
      <View style={[styles.card, { shadowColor: rank.color }]}>

        {/* 1 + 2. Game Over / Rank */}
        <View style={styles.rankHeader}>
          <View style={[styles.emojiRing, { borderColor: rank.color + '55', backgroundColor: rank.color + '18' }]}>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          </View>
          <Text style={styles.gameOverLabel}>GAME OVER</Text>
          <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
        </View>

        {/* 3. Verdict */}
        <Text style={styles.verdict}>{rank.description}</Text>

        <View style={styles.divider} />

        {/* 4. Score */}
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreNumber}>{score > 0 ? '+' : ''}{score}</Text>
          <Text style={styles.scoreUnit}>points</Text>
        </View>

        {/* 5. Correct / Wrong */}
        <View style={styles.chipRow}>
          <View style={[styles.chip, styles.chipGreen]}>
            <Text style={[styles.chipNum, styles.textGreen]}>{correct}</Text>
            <Text style={styles.chipLabel}>correct ✅</Text>
          </View>
          <View style={[styles.chip, styles.chipRed]}>
            <Text style={[styles.chipNum, styles.textRed]}>{wrong}</Text>
            <Text style={styles.chipLabel}>wrong ❌</Text>
          </View>
        </View>

        {/* 6. Best streak */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Best streak</Text>
          <Text style={styles.metaValue}>
            {bestStreak > 0 ? `🔥 ${bestStreak} in a row` : 'none'}
          </Text>
        </View>
        {bestStreak >= 2 && (
          <Text style={styles.streakQuip}>{getStreakSummary(bestStreak)}</Text>
        )}

        {/* 7. Combo bonus */}
        {totalComboBonus > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Streak bonuses</Text>
            <Text style={[styles.metaValue, styles.textCombo]}>⚡ +{totalComboBonus} pts</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* 8. Top 3 category highlights */}
        {headlines.length > 0 && (
          <View style={styles.highlightsSection}>
            <Text style={styles.sectionLabel}>📊 CATEGORY HIGHLIGHTS</Text>
            {headlines.map((line, i) => (
              <View key={i} style={styles.highlightRow}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Full breakdown (expanded) */}
        {showFullBreakdown && categoryStats.length > 0 && (
          <View style={styles.fullBreakdown}>
            {categoryStats.map((stat) => {
              const meta = CATEGORY_META[stat.key];
              if (!meta) return null;
              const pct    = Math.round((stat.correct / stat.seen) * 100);
              const isGood = pct >= 67;
              const isBad  = pct < 40;
              const quip   = getCategoryQuip(stat.key, stat.seen, stat.correct);
              return (
                <View key={stat.key} style={styles.catRow}>
                  <View style={styles.catRowHeader}>
                    <Text style={styles.catEmoji}>{meta.emoji}</Text>
                    <Text style={styles.catName}>{meta.plural}</Text>
                    <View style={[styles.catBadge, isGood ? styles.badgeGood : isBad ? styles.badgeBad : styles.badgeMid]}>
                      <Text style={[styles.catBadgeText, isGood ? styles.textGood : isBad ? styles.textBad : styles.textMid]}>
                        {stat.correct}/{stat.seen}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.catBar}>
                    <View style={[
                      styles.catBarFill,
                      { width: `${pct}%` as `${number}%` },
                      isGood ? styles.barGood : isBad ? styles.barBad : styles.barMid,
                    ]} />
                  </View>
                  <Text style={styles.catQuip}>{quip}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 9. Show Full Breakdown toggle */}
        {categoryStats.length > 0 && (
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => setShowFullBreakdown((v) => !v)}
            activeOpacity={0.7}>
            <Text style={styles.expandBtnText}>
              {showFullBreakdown ? 'Hide Breakdown ↑' : 'Show Full Breakdown ↓'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        {/* 10. Play Again */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/swipe-game')}
          activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Play Again 🔄</Text>
        </TouchableOpacity>

        {/* 11. Share Result */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>
            {copied ? 'Copied! ✓' : 'Share Result 📤'}
          </Text>
        </TouchableOpacity>

        {/* 12. Back to Home */}
        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}>
          <Text style={styles.ghostBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.versionLabel}>Beta v0.9.0</Text>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // ── Main card — matches the gameplay profile card aesthetic ───────────────
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#111319',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.50,
    shadowRadius: 30,
    elevation: 20,
    padding: 24,
    gap: 14,
  },

  // 1+2. Rank header
  rankHeader: {
    alignItems: 'center',
    gap: 6,
  },
  emojiRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rankEmoji: {
    fontSize: 34,
  },
  gameOverLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  rankTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // 3. Verdict
  verdict: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },

  // 4. Score
  scoreBlock: {
    alignItems: 'center',
    gap: 2,
  },
  scoreNumber: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  scoreUnit: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // 5. Correct / Wrong chips
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  chipGreen: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  chipRed: {
    backgroundColor: 'rgba(232,25,60,0.08)',
    borderColor: 'rgba(232,25,60,0.25)',
  },
  chipNum: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  chipLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
  },

  // 6+7. Meta rows (streak, combo)
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: -4,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '700',
  },
  textGreen: { color: '#4ade80' },
  textRed:   { color: '#ff4d6d' },
  textCombo: { color: '#a78bfa' },
  textGood:  { color: '#4caf50' },
  textMid:   { color: '#ff9800' },
  textBad:   { color: '#ff4d6d' },

  streakQuip: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: -6,
  },

  // 8. Category highlights
  highlightsSection: {
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  highlightDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ff4d6d',
    marginTop: 6,
    flexShrink: 0,
  },
  highlightText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  // Full breakdown
  fullBreakdown: {
    gap: 8,
    marginTop: -2,
  },
  catRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  catRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catEmoji: { fontSize: 15 },
  catName: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  catBadge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeGood: { backgroundColor: '#071407', borderColor: '#2d6a2d' },
  badgeMid:  { backgroundColor: '#1a1200', borderColor: '#5a4000' },
  badgeBad:  { backgroundColor: '#140707', borderColor: '#6a2d2d' },
  catBadgeText: { fontSize: 12, fontWeight: '800' },
  catBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  catBarFill:  { height: '100%', borderRadius: 1 },
  barGood:  { backgroundColor: '#4caf50' },
  barMid:   { backgroundColor: '#ff9800' },
  barBad:   { backgroundColor: '#ff4d6d' },
  catQuip: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11.5,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // 9. Expand button
  expandBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  expandBtnText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // 10–12. Buttons
  primaryBtn: {
    backgroundColor: '#ff4d6d',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  shareBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,77,109,0.38)',
    backgroundColor: 'rgba(255,77,109,0.06)',
  },
  shareBtnText: {
    color: '#ff4d6d',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  ghostBtnText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 13,
  },
  versionLabel: {
    color: 'rgba(255,255,255,0.10)',
    fontSize: 11,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: -4,
  },
});
