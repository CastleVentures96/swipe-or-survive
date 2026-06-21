import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { scenarios, FlagType } from '@/data/scenarios';

const FLAG_STYLES: Record<FlagType, { bg: string; border: string }> = {
  'Green Flag': { bg: '#1a3320', border: '#4caf50' },
  'Beige Flag': { bg: '#2e2520', border: '#bcaaa4' },
  'Red Flag': { bg: '#3a1a1e', border: '#ff4d6d' },
  'Block Immediately': { bg: '#1a1a1a', border: '#ff1744' },
};

const ALL_FLAGS: FlagType[] = ['Green Flag', 'Beige Flag', 'Red Flag', 'Block Immediately'];

export default function GameScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<FlagType | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const scenario = scenarios[currentIndex];
  const isLastScenario = currentIndex === scenarios.length - 1;
  const isCorrect = selectedAnswer === scenario.correctAnswer;

  function handleAnswer(answer: FlagType) {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);
    if (answer === scenario.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  }

  function handleNext() {
    if (isLastScenario) {
      router.replace({ pathname: '/results', params: { score: String(score) } });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }

  const progress = ((currentIndex + 1) / scenarios.length) * 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.progressLabel}>
          {currentIndex + 1} / {scenarios.length}
        </Text>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${progress}%` as `${number}%` }]} />
        </View>
        <Text style={styles.scoreLabel}>Score: {score}</Text>
      </View>

      {/* Scenario card */}
      <View style={styles.scenarioCard}>
        <Text style={styles.scenarioEyebrow}>🎭 The Scenario</Text>
        <Text style={styles.scenarioText}>{scenario.situation}</Text>
      </View>

      {/* Answer buttons */}
      {!showFeedback && (
        <View style={styles.buttonsContainer}>
          {ALL_FLAGS.map((flag) => (
            <TouchableOpacity
              key={flag}
              style={[
                styles.flagButton,
                {
                  backgroundColor: FLAG_STYLES[flag].bg,
                  borderColor: FLAG_STYLES[flag].border,
                },
              ]}
              onPress={() => handleAnswer(flag)}
              activeOpacity={0.75}>
              <Text style={styles.flagButtonText}>{flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Feedback */}
      {showFeedback && selectedAnswer && (
        <View
          style={[
            styles.feedbackCard,
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
          ]}>
          <Text style={styles.feedbackEmoji}>{isCorrect ? '✅' : '❌'}</Text>
          <Text style={styles.feedbackTitle}>
            {isCorrect ? 'Correct!' : `That's a ${scenario.correctAnswer}`}
          </Text>
          <Text style={styles.feedbackBody}>{scenario.feedback}</Text>

          {!isCorrect && (
            <View
              style={[
                styles.correctBadge,
                {
                  backgroundColor: FLAG_STYLES[scenario.correctAnswer].bg,
                  borderColor: FLAG_STYLES[scenario.correctAnswer].border,
                },
              ]}>
              <Text style={styles.correctBadgeText}>
                Should be: {scenario.correctAnswer}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>
              {isLastScenario ? 'See Results 🎉' : 'Next Scenario →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingTop: 52,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  progressLabel: {
    color: '#888',
    fontSize: 13,
    minWidth: 36,
  },
  progressBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#ff4d6d',
    borderRadius: 3,
  },
  scoreLabel: {
    color: '#888',
    fontSize: 13,
    minWidth: 64,
    textAlign: 'right',
  },
  scenarioCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  scenarioEyebrow: {
    color: '#ff4d6d',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  scenarioText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
  },
  buttonsContainer: {
    gap: 12,
  },
  flagButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  flagButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  feedbackCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  feedbackCorrect: {
    backgroundColor: '#0f2e0f',
    borderColor: '#4caf50',
  },
  feedbackWrong: {
    backgroundColor: '#2e0f13',
    borderColor: '#ff4d6d',
  },
  feedbackEmoji: {
    fontSize: 44,
    marginBottom: 10,
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackBody: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  correctBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  correctBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#ff4d6d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
