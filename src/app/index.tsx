import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

// A few preview photos for the decorative fan on the home screen
const PREVIEW_PHOTOS = [
  'https://randomuser.me/api/portraits/women/31.jpg', // Emma (date)
  'https://randomuser.me/api/portraits/men/1.jpg',    // Brad (reject)
  'https://randomuser.me/api/portraits/women/2.jpg',  // Taylah (reject)
];
const BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Hero: fanned card stack ─────────────────────────────────────────── */}
      <View style={styles.heroArea}>
        {/* Back card — tilted right */}
        <View style={styles.fanCardWrapper}>
          <View style={[styles.fanCard, styles.fanCardRight]}>
            <Image
              source={{ uri: PREVIEW_PHOTOS[2] }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              locations={[0.45, 1]}
              style={styles.fanGradient}
            />
            <View style={styles.fanCardLabel}>
              <Text style={styles.fanCardName}>Taylah, 24</Text>
              <Text style={styles.fanCardBadge}>🚩 Red Flag</Text>
            </View>
          </View>
        </View>

        {/* Back card — tilted left */}
        <View style={styles.fanCardWrapper}>
          <View style={[styles.fanCard, styles.fanCardLeft]}>
            <Image
              source={{ uri: PREVIEW_PHOTOS[1] }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              locations={[0.45, 1]}
              style={styles.fanGradient}
            />
            <View style={styles.fanCardLabel}>
              <Text style={styles.fanCardName}>Brad, 29</Text>
              <Text style={styles.fanCardBadgeDanger}>🚩 Red Flag</Text>
            </View>
          </View>
        </View>

        {/* Front card — straight */}
        <View style={styles.fanCardWrapper}>
          <View style={[styles.fanCard, styles.fanCardCenter]}>
            <Image
              source={{ uri: PREVIEW_PHOTOS[0] }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              locations={[0.45, 1]}
              style={styles.fanGradient}
            />
            <View style={styles.fanCardLabel}>
              <Text style={styles.fanCardName}>Emma, 28</Text>
              <Text style={styles.fanCardBadgeGreen}>✅ Green Flag</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Title + description ─────────────────────────────────────────────── */}
      <View style={styles.textArea}>
        <Text style={styles.title}>Swipe or Survive</Text>
        <Text style={styles.subtitle}>Australian Dating Simulator</Text>
        <Text style={styles.description}>
          20 profiles. Some gems. Some disasters.{'\n'}Can you tell who's actually worth your time?
        </Text>
      </View>

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
      <View style={[styles.buttonArea, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/swipe-game')}
          activeOpacity={0.85}>
          <LinearGradient
            colors={['#ff6b84', '#ff4d6d', '#e03055']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtnGradient}>
            <Text style={styles.primaryBtnText}>Start Game</Text>
            <Text style={styles.primaryBtnSub}>Swipe to date · Reject the chaos</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/game')}
          activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>🚩 Red Flag Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  // ── Hero fan ──────────────────────────────────────────────────────────────
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  fanCardWrapper: {
    position: 'absolute',
    width: 200,
    height: 280,
  },
  fanCard: {
    position: 'absolute',
    width: 200,
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fanCardLeft: {
    transform: [{ rotate: '-11deg' }, { translateX: -80 }, { translateY: 12 }],
    zIndex: 1,
  },
  fanCardRight: {
    transform: [{ rotate: '11deg' }, { translateX: 80 }, { translateY: 12 }],
    zIndex: 1,
  },
  fanCardCenter: {
    zIndex: 2,
    transform: [{ translateY: -4 }],
  },
  fanGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  fanCardLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  fanCardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  fanCardBadge: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  fanCardBadgeDanger: {
    color: '#ff8095',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  fanCardBadgeGreen: {
    color: '#6fcf6f',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  // ── Text area ─────────────────────────────────────────────────────────────
  textArea: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#ff4d6d',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  description: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 4,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  buttonArea: {
    paddingHorizontal: 24,
    gap: 14,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryBtnGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 2,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  primaryBtnSub: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryBtnText: {
    color: '#444',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
