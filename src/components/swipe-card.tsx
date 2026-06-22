import { useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import type { Profile } from '@/data/profiles';
import { profileCategories, CATEGORY_META } from '@/data/profile-categories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

// Portrait card — narrow and tall like a real dating profile.
// Width: gutter of 20px each side; cap at 480 so tablets stay readable.
export const CARD_WIDTH  = Math.min(480, Math.max(320, SCREEN_WIDTH - 40));

// Height: 320px overhead accounts for safe-area insets (top ~44-59pt on iPhone,
// ~24-48dp on Android), header, gap, buttons, and home-indicator clearance.
// Verified against iPhone 13 (844), iPhone 15 Pro Max (932),
// Samsung S23 (851), and Pixel 8 (892) logical heights.
export const CARD_HEIGHT = Math.min(660, Math.max(380, Math.round(SCREEN_HEIGHT - 320)));

// Lines of bio text visible before ellipsis — scales with card height.
// Formula: content zone (64% of card) minus fixed elements (~179pt), divided by line height (28pt).
const BIO_LINES = Math.max(2, Math.floor((CARD_HEIGHT * 0.64 - 179) / 28));

// Card background — clearly distinct from the app's #0a0a0a canvas.
const CARD_BG = '#111319';

// Fixed avatar size; top gradient zone height scales with the card.
const AVATAR_SIZE = 96;
const RING_SIZE   = AVATAR_SIZE + 8;
const TOP_ZONE_H  = Math.round(CARD_HEIGHT * 0.36);

// Secondary chip needs more room now that bio text is larger.
const SHOW_CHIP = CARD_HEIGHT >= 540;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const CATEGORY_CHIP: Record<string, string> = {
  Gym:          '🏋️ Gym Rat',
  Gamer:        '🎮 Gamer',
  Tradie:       '🔨 Tradie Life',
  Teacher:      '📚 Educator',
  Nurse:        '🚑 Frontline',
  Influencer:   '📸 Content Creator',
  Entrepreneur: '🚀 Self-Made',
  FIFO:         '⛏️ Fly-In Fly-Out',
  Traveller:    '✈️ Digital Nomad',
  Spiritual:    '🔮 Spiritual',
  Fitness:      '🏃 Fitness First',
  Creative:     '🎨 Creative',
  Corporate:    '💼 Corporate',
  Crypto:       '₿ Crypto Bro',
  Outdoors:     '🐴 Outdoors',
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function ProfileAvatar({ initials, accentColor }: { initials: string; accentColor: string }) {
  const scale = useSharedValue(0.72);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { scale.value = withSpring(1, { damping: 10, stiffness: 120 }); }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.32)' }]}>
        <View style={[styles.avatarRingInner, { borderColor: `${accentColor}99` }]}>
          <View style={[styles.avatarCircle, { backgroundColor: accentColor }]}>
            <View style={styles.avatarDark} />
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Card content ──────────────────────────────────────────────────────────────

function CardContent({ profile }: { profile: Profile }) {
  const category = profileCategories[profile.id];
  const meta     = category ? CATEGORY_META[category] : null;
  const accent   = meta?.color ?? '#4B5563';
  const icon     = meta?.icon  ?? '•';
  const chip     = CATEGORY_CHIP[category ?? ''];
  const initials = getInitials(profile.name);

  const opacity = useSharedValue(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { opacity.value = withTiming(1, { duration: 220 }); }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.content, fadeStyle]}>

      {/* ── Top gradient zone — accent colour fades into card background ──────
          This gives each archetype a distinct colour identity without photos.
          The gradient ends at CARD_BG so there is no visible seam below.
      ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.topZone}>
        <LinearGradient
          colors={[accent, `${accent}DD`, `${accent}55`, CARD_BG]}
          locations={[0, 0.38, 0.72, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ProfileAvatar initials={initials} accentColor={accent} />
      </View>

      {/* ── Name + Age ───────────────────────────────────────────────────────── */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {profile.name}
        </Text>
        <Text style={styles.nameSep}>,</Text>
        <Text style={styles.nameAge}> {profile.age}</Text>
      </View>

      {/* ── Job ──────────────────────────────────────────────────────────────── */}
      <Text style={[styles.job, { color: accent }]} numberOfLines={1}>
        {profile.occupation}
      </Text>

      {/* ── Location ─────────────────────────────────────────────────────────── */}
      <Text style={styles.location} numberOfLines={1}>
        📍  {profile.suburb}
      </Text>

      {/* ── Category tags ────────────────────────────────────────────────────── */}
      <View style={styles.tagsRow}>
        <View style={[styles.tag, { backgroundColor: `${accent}22`, borderColor: `${accent}66` }]}>
          <Text style={[styles.tagText, { color: accent }]}>{icon}  {category}</Text>
        </View>
        {SHOW_CHIP && chip ? (
          <View style={styles.tagNeutral}>
            <Text style={styles.tagNeutralText}>{chip}</Text>
          </View>
        ) : null}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* ── Bio — occupies most of the remaining card height ──────────────────
          flex: 1 ensures it fills whatever space the fixed elements leave.
      ───────────────────────────────────────────────────────────────────── */}
      <View style={styles.bioSection}>
        <Text style={styles.bioText} numberOfLines={BIO_LINES} ellipsizeMode="tail">{profile.bio}</Text>
      </View>

      {/* ── Swipe instruction hint ───────────────────────────────────────────── */}
      <View style={styles.swipeHint}>
        <Text style={styles.hintLeft}>← PASS</Text>
        <Text style={styles.hintRight}>DATE →</Text>
      </View>

    </Animated.View>
  );
}

// ── Swipe card (gesture + overlays) ──────────────────────────────────────────

export function SwipeCard({ profile, onSwipeLeft, onSwipeRight }: {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const _cat   = profileCategories[profile.id];
  const _meta  = _cat ? CATEGORY_META[_cat] : null;
  const accent = _meta?.color ?? '#000';

  const tx      = useSharedValue(0);
  const ty      = useSharedValue(0);
  const scale   = useSharedValue(0.88);
  const entryY  = useSharedValue(32);   // slides up on entrance
  const entryOp = useSharedValue(0);    // fades in on entrance

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    entryOp.value = withTiming(1, { duration: 220 });
    entryY.value  = withSpring(0, { damping: 14, stiffness: 130 });
    scale.value   = withSpring(1, { damping: 11, stiffness: 115 });
  }, []);

  const pan = Gesture.Pan()
    .onBegin(() => { scale.value = withTiming(1.016, { duration: 70 }); })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY * 0.04;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        // Decisive swipe-out: fast exit with slight upward arc and scale-down.
        ty.value    = withTiming(-16, { duration: 200 });
        tx.value    = withTiming(SCREEN_WIDTH * 1.8, { duration: 200 }, (done) => {
          if (done) runOnJS(onSwipeRight)();
        });
        scale.value = withTiming(0.88, { duration: 200 });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        ty.value    = withTiming(-16, { duration: 200 });
        tx.value    = withTiming(-SCREEN_WIDTH * 1.8, { duration: 200 }, (done) => {
          if (done) runOnJS(onSwipeLeft)();
        });
        scale.value = withTiming(0.88, { duration: 200 });
      } else {
        // Snap-back: bouncy spring so the card feels physical.
        tx.value    = withSpring(0, { damping: 14, stiffness: 190 });
        ty.value    = withSpring(0, { damping: 14, stiffness: 190 });
        scale.value = withSpring(1,  { damping: 8,  stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      tx.value,
      [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5],
      [-16, 0, 16],   // wider rotation arc = more expressive tilt
      Extrapolation.CLAMP,
    );
    return {
      opacity: entryOp.value,
      transform: [
        { translateX: tx.value },
        { translateY: ty.value + entryY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
    };
  });

  const dateOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [22, 100], [0, 1], Extrapolation.CLAMP),
  }));
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-100, -22], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      {/* Shadow wrapper — no overflow:hidden so iOS shadow renders correctly */}
      <Animated.View style={[styles.shadow, { shadowColor: accent }, cardStyle]}>
        <View style={styles.inner}>
          <CardContent profile={profile} />

          {/* DATE overlay — right swipe */}
          <Animated.View style={[StyleSheet.absoluteFill, dateOpacity]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(34,197,94,0.00)', 'rgba(34,197,94,0.28)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.stampDate}>
              <Text style={styles.stampTxt}>❤️  DATE</Text>
            </View>
          </Animated.View>

          {/* PASS overlay — left swipe */}
          <Animated.View style={[StyleSheet.absoluteFill, passOpacity]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(232,25,60,0.28)', 'rgba(232,25,60,0.00)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.stampPass}>
              <Text style={styles.stampTxt}>✕  PASS</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Static peek card (next in queue) ─────────────────────────────────────────

export function ProfileCardStatic({ profile, style }: { profile: Profile; style?: ViewStyle }) {
  const _cat   = profileCategories[profile.id];
  const _meta  = _cat ? CATEGORY_META[_cat] : null;
  const accent = _meta?.color ?? '#000';

  return (
    <View style={[styles.shadow, { shadowColor: accent, shadowOpacity: 0.35 }, style]}>
      <View style={styles.inner}>
        <CardContent profile={profile} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Outer shadow wrapper — explicit width keeps the card narrow and centred.
  // No overflow:hidden here so iOS can render coloured shadows outside the bounds.
  shadow: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.60,
    shadowRadius: 30,
    elevation: 20,
  },

  // Inner clips content to rounded corners.
  inner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  content: {
    flex: 1,
  },

  // ── Top gradient zone ──────────────────────────────────────────────────────
  topZone: {
    height: TOP_ZONE_H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarRing: {
    width: RING_SIZE + 8,
    height: RING_SIZE + 8,
    borderRadius: (RING_SIZE + 8) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingInner: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDark: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    includeFontPadding: false,
  },

  // ── Name row ──────────────────────────────────────────────────────────────
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  name: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    flexShrink: 1,
  },
  nameSep: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 26,
    fontWeight: '300',
    flexShrink: 0,
  },
  nameAge: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 26,
    fontWeight: '300',
    flexShrink: 0,
  },

  // ── Job ───────────────────────────────────────────────────────────────────
  job: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    paddingHorizontal: 20,
    marginTop: 5,
  },

  // ── Location ──────────────────────────────────────────────────────────────
  location: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 20,
    marginTop: 3,
  },

  // ── Category tags ─────────────────────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tagNeutral: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagNeutralText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 20,
    marginTop: 12,
  },

  // ── Bio ───────────────────────────────────────────────────────────────────
  bioSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  bioText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.1,
  },

  // ── Swipe hint ────────────────────────────────────────────────────────────
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  hintLeft: {
    color: 'rgba(232,25,60,0.35)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  hintRight: {
    color: 'rgba(34,197,94,0.35)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // ── Swipe overlays ─────────────────────────────────────────────────────────
  stampDate: {
    position: 'absolute',
    top: 28,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#22c55e',
    transform: [{ rotate: '14deg' }],
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  stampPass: {
    position: 'absolute',
    top: 28,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#e8193c',
    transform: [{ rotate: '-14deg' }],
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  stampTxt: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
