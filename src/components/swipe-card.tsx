import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { Profile } from '@/data/profiles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 90;

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeCard({ profile, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.15;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 280 }, (finished) => {
          if (finished) runOnJS(onSwipeRight)();
        });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 280 }, (finished) => {
          if (finished) runOnJS(onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-14, 0, 14],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, 100], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-100, -20], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Overlays */}
        <Animated.View style={[styles.stamp, styles.stampLike, likeOpacity]} pointerEvents="none">
          <Text style={styles.stampLikeText}>DATE 💚</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, nopeOpacity]} pointerEvents="none">
          <Text style={styles.stampNopeText}>NOPE ❌</Text>
        </Animated.View>

        {/* Avatar */}
        <View style={[styles.avatarContainer, { backgroundColor: profile.avatarColor }]}>
          <Text style={styles.avatarEmoji}>{profile.emoji}</Text>
        </View>

        {/* Identity */}
        <View style={styles.identityRow}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.age}>{profile.age}</Text>
        </View>
        <Text style={styles.occupation}>{profile.occupation}</Text>
        <Text style={styles.suburb}>📍 {profile.suburb}</Text>

        <View style={styles.divider} />

        {/* Bio */}
        <Text style={styles.bio}>{profile.bio}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  stamp: {
    position: 'absolute',
    top: 28,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  stampLike: {
    right: 20,
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76,175,80,0.15)',
    transform: [{ rotate: '12deg' }],
  },
  stampLikeText: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stampNope: {
    left: 20,
    borderColor: '#ff4d6d',
    backgroundColor: 'rgba(255,77,109,0.15)',
    transform: [{ rotate: '-12deg' }],
  },
  stampNopeText: {
    color: '#ff4d6d',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  age: {
    color: '#ccc',
    fontSize: 22,
    fontWeight: '400',
  },
  occupation: {
    color: '#ff4d6d',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suburb: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginBottom: 16,
  },
  bio: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 23,
  },
});
