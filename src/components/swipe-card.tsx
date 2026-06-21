import { Dimensions, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import type { Profile } from '@/data/profiles';
import { profilePhotos } from '@/data/profile-photos';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

// Dynamic card height — fits most phones without scrolling in swiping phase
export const CARD_HEIGHT = Math.min(590, Math.max(360, Math.round(SCREEN_HEIGHT - 270)));
const PHOTO_HEIGHT = Math.round(CARD_HEIGHT * 0.61);

// Warm skin-tone placeholder while photo loads
const PHOTO_BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

function CardContent({ profile }: { profile: Profile }) {
  const photoUrl = profilePhotos[profile.id];

  return (
    <>
      {/* Photo area */}
      <View style={styles.photoArea}>
        <Image
          source={{ uri: photoUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={350}
          placeholder={{ blurhash: PHOTO_BLURHASH }}
          cachePolicy="memory-disk"
        />

        {/* Gradient scrim so text is always readable */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.96)']}
          locations={[0.28, 0.62, 1]}
          style={styles.photoGradient}
        />

        {/* Name, age, job, location overlaid on photo */}
        <View style={styles.photoInfo}>
          <View style={styles.nameAgeRow}>
            <Text style={styles.photoName}>{profile.name}</Text>
            <Text style={styles.photoAge}>{profile.age}</Text>
          </View>
          <Text style={styles.photoJob} numberOfLines={1}>
            {profile.occupation}
          </Text>
          <Text style={styles.photoLocation} numberOfLines={1}>
            📍 {profile.suburb}
          </Text>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioArea}>
        <Text style={styles.bioText} numberOfLines={4}>
          {profile.bio}
        </Text>
      </View>
    </>
  );
}

export function SwipeCard({ profile, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const pan = Gesture.Pan()
    .onBegin(() => {
      cardScale.value = withTiming(1.03, { duration: 120 });
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.08;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.7, { duration: 280 }, (done) => {
          if (done) runOnJS(onSwipeRight)();
        });
        cardScale.value = withTiming(0.95, { duration: 280 });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.7, { duration: 280 }, (done) => {
          if (done) runOnJS(onSwipeLeft)();
        });
        cardScale.value = withTiming(0.95, { duration: 280 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-20, 0, 20],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: cardScale.value },
      ],
    };
  });

  // DATE stamp fades in when swiping right
  const dateStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, 100], [0, 1], Extrapolation.CLAMP),
  }));

  // NOPE stamp fades in when swiping left
  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-100, -20], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Swipe stamps — inside photo area */}
        <Animated.View style={[styles.stamp, styles.stampDate, dateStampStyle]} pointerEvents="none">
          <Text style={styles.stampDateText}>DATE 💚</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, nopeStampStyle]} pointerEvents="none">
          <Text style={styles.stampNopeText}>NOPE ❌</Text>
        </Animated.View>

        <CardContent profile={profile} />
      </Animated.View>
    </GestureDetector>
  );
}

// Static version used as the background "stack" card
export function ProfileCardStatic({
  profile,
  style,
}: {
  profile: Profile;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      <CardContent profile={profile} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    backgroundColor: '#111',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 18,
  },

  // ── Photo area ──────────────────────────────────────────────────────────────
  photoArea: {
    height: PHOTO_HEIGHT,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '68%',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  photoName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoAge: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 26,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoJob: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  photoLocation: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 0.1,
  },

  // ── Bio area ────────────────────────────────────────────────────────────────
  bioArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  bioText: {
    color: '#d4d4d4',
    fontSize: 14.5,
    lineHeight: 23,
    letterSpacing: 0.1,
  },

  // ── Swipe stamps ────────────────────────────────────────────────────────────
  stamp: {
    position: 'absolute',
    top: 28,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 3,
  },
  stampDate: {
    right: 16,
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76,175,80,0.22)',
    transform: [{ rotate: '15deg' }],
  },
  stampDateText: {
    color: '#4caf50',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stampNope: {
    left: 16,
    borderColor: '#ff4d6d',
    backgroundColor: 'rgba(255,77,109,0.22)',
    transform: [{ rotate: '-15deg' }],
  },
  stampNopeText: {
    color: '#ff4d6d',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
