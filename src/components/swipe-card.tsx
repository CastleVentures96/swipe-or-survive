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

// Shorter card — content fills it rather than flex-stretching into empty space.
// The header (gradient zone) takes ~54% and bio takes the rest.
export const CARD_HEIGHT = Math.min(400, Math.max(280, Math.round(SCREEN_HEIGHT - 380)));

// Avatar adapts to card height so small screens (iPhone SE) still work.
// On a typical iPhone 14 (CARD_HEIGHT=400) this is ~168px = 30% larger than previous 130px.
const AVATAR_SIZE = Math.min(168, Math.round(CARD_HEIGHT * 0.42));
const RING_SIZE = AVATAR_SIZE + 8; // 4px breathing gap inside the ring each side
const AVATAR_FONT = Math.min(54, Math.round(AVATAR_SIZE * 0.32));
const HEADER_PAD = 20; // equal top/bottom — centres avatar vertically in gradient zone

// Chips are hidden on very short cards (< 340px) to prevent bio being crushed to 1-2 lines
const SHOW_CHIPS = CARD_HEIGHT >= 340;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

// Personality chips shown inside the info column — no separate row needed
const CATEGORY_CHIPS: Record<string, [string, string]> = {
  Gym:          ['🏋️ Gym Rat',       '🥗 Meal Prepper'],
  Gamer:        ['🎮 Main Character', '🌙 Night Owl'],
  Tradie:       ['🔨 Tradie Life',    '🍺 TGIF Energy'],
  Teacher:      ['📚 Educator',       '☕ Coffee First'],
  Nurse:        ['🚑 Frontline',      '💉 Night Shift'],
  Influencer:   ['📸 Content Life',   '✨ The Aesthetic'],
  Entrepreneur: ['🚀 Big Ideas',      '📊 Always On'],
  FIFO:         ['⛏️ Fly-In',         '📱 Long Distance'],
  Traveller:    ['✈️ Wanderer',       '🌏 Passport Ready'],
  Spiritual:    ['🔮 Woo Woo',        '🌙 Moon Child'],
  Fitness:      ['🏃 Health Nerd',    '🥑 Clean Eating'],
  Creative:     ['🎨 Creative Type',  '🎵 Artsy Soul'],
  Corporate:    ['💼 Corporate',      '📅 Fully Booked'],
  Crypto:       ['₿ Crypto Brain',    '📉 HODL Life'],
  Outdoors:     ['🐴 Outdoors',       '🌿 Nature First'],
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function ProfileAvatar({ initials, accentColor }: { initials: string; accentColor: string }) {
  const scale = useSharedValue(0.76);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { scale.value = withSpring(1, { damping: 11, stiffness: 135 }); }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.36)' }]}>
        <View style={[styles.avatarCircle, { backgroundColor: accentColor }]}>
          {/* Dark overlay keeps initials readable against the same-colour gradient */}
          <View style={styles.avatarDark} />
          <Text style={[styles.avatarInitials, { fontSize: AVATAR_FONT }]}>{initials}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Card content ──────────────────────────────────────────────────────────────

function CardContent({ profile }: { profile: Profile }) {
  const category = profileCategories[profile.id];
  const meta    = category ? CATEGORY_META[category] : null;
  const accent  = meta?.color ?? '#4B5563';
  const icon    = meta?.icon  ?? '•';
  const chips   = CATEGORY_CHIPS[category ?? ''] ?? ['• Profile', '• Interesting'];
  const initials = getInitials(profile.name);

  // Fade the whole card in on each new profile
  const opacity = useSharedValue(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { opacity.value = withTiming(1, { duration: 180 }); }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.content, fadeStyle]}>

      {/* Category gradient — covers the header zone precisely (RING_SIZE + 2×HEADER_PAD) */}
      <LinearGradient
        colors={[accent, `${accent}CC`, `${accent}2E`, 'transparent']}
        locations={[0, 0.28, 0.65, 1]}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      {/* ── Header row ──────────────────────────────────────────────────────
          Avatar LEFT — 30% larger than before.
          Info column RIGHT — dense: name, category pill, tags, job, location.
          Equal paddingVertical centres avatar within the gradient zone.
      ──────────────────────────────────────────────────────────────────── */}
      <View style={styles.header}>

        <ProfileAvatar initials={initials} accentColor={accent} />

        <View style={styles.infoStack}>

          {/* Name + age — biggest text on the card */}
          <View style={styles.nameRow}>
            <Text
              style={styles.name}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.68}>
              {profile.name}
            </Text>
            <Text style={styles.age}>{profile.age}</Text>
          </View>

          {/* Category pill — immediate identity signal */}
          <View style={[styles.catPill, { backgroundColor: `${accent}BF`, borderColor: 'rgba(255,255,255,0.20)' }]}>
            <Text style={styles.catPillText}>{icon}  {category ?? '—'}</Text>
          </View>

          {/* Personality chips — only shown when card is tall enough */}
          {SHOW_CHIPS && (
            <View style={styles.chipsRow}>
              {chips.map((chip, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: `${accent}1C`, borderColor: `${accent}55` }]}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Job — coloured to tie back to accent */}
          <Text style={[styles.job, { color: `${accent}FF` }]} numberOfLines={1}>
            {profile.occupation}
          </Text>

          {/* Location */}
          <View style={styles.locRow}>
            <Text style={styles.locPin}>📍</Text>
            <Text style={styles.locText} numberOfLines={1}>{profile.suburb}</Text>
          </View>

        </View>
      </View>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Bio — larger font, fills all remaining space ─────────────────────
          No numberOfLines limit: content fills the flex:1 region naturally.
          Short bios show the watermark in the space below.
      ──────────────────────────────────────────────────────────────────── */}
      <View style={styles.bioSection}>
        <Text style={styles.bioText}>{profile.bio}</Text>
        {/* Large translucent watermark — visually fills space below short bios */}
        <Text style={styles.bioMark} aria-hidden>{icon}</Text>
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
  const tx    = useSharedValue(0);
  const ty    = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Card springs into position on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { scale.value = withSpring(1, { damping: 14, stiffness: 150 }); }, []);

  const pan = Gesture.Pan()
    .onBegin(() => { scale.value = withTiming(1.03, { duration: 80 }); })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY * 0.05;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        tx.value = withTiming(SCREEN_WIDTH * 1.8, { duration: 240 }, (done) => {
          if (done) runOnJS(onSwipeRight)();
        });
        scale.value = withTiming(0.94, { duration: 240 });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        tx.value = withTiming(-SCREEN_WIDTH * 1.8, { duration: 240 }, (done) => {
          if (done) runOnJS(onSwipeLeft)();
        });
        scale.value = withTiming(0.94, { duration: 240 });
      } else {
        tx.value    = withSpring(0, { damping: 18, stiffness: 200 });
        ty.value    = withSpring(0, { damping: 18, stiffness: 200 });
        scale.value = withSpring(1, { damping: 14, stiffness: 160 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(tx.value, [-SCREEN_WIDTH * 0.5, 0, SCREEN_WIDTH * 0.5], [-15, 0, 15], Extrapolation.CLAMP);
    return { transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rotate}deg` }, { scale: scale.value }] };
  });

  const dateStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [20, 90], [0, 1], Extrapolation.CLAMP) }));
  const passStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-90, -20], [1, 0], Extrapolation.CLAMP) }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.shadow, cardStyle]}>
        <View style={styles.inner}>
          <CardContent profile={profile} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.dateOv, dateStyle]} pointerEvents="none">
            <View style={styles.stampDate}><Text style={styles.stampTxt}>❤️  DATE</Text></View>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.passOv, passStyle]} pointerEvents="none">
            <View style={styles.stampPass}><Text style={styles.stampTxt}>✕  PASS</Text></View>
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Static background stack card ──────────────────────────────────────────────

export function ProfileCardStatic({ profile, style }: { profile: Profile; style?: ViewStyle }) {
  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.inner}>
        <CardContent profile={profile} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Card shell: shadow on outer (no overflow:hidden), clip on inner
  shadow: {
    height: CARD_HEIGHT,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.62,
    shadowRadius: 32,
    elevation: 22,
  },
  inner: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0c0d11',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  content: { flex: 1 },

  // Category colour gradient — height matches header zone exactly so the
  // gradient borders are never visible below the header content
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RING_SIZE + HEADER_PAD * 2,
  },

  // Header: avatar + info side by side, symmetric vertical padding
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: HEADER_PAD,
    gap: 14,
  },

  // Avatar ring (border) + circle (filled)
  avatarRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
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
  // 28% dark overlay ensures white initials pop even against a same-colour gradient
  avatarDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -1,
    includeFontPadding: false,
  },

  // Info column (everything to the right of the avatar)
  infoStack: {
    flex: 1,
    gap: 5,
    justifyContent: 'center', // vertically centre the block within the avatar height
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  name: {
    color: '#fff',
    fontSize: 30,     // up from 26px
    fontWeight: '900',
    letterSpacing: -0.8,
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  age: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 22,
    fontWeight: '300',
    flexShrink: 0,
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Category pill (small, right under name)
  catPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Personality chips (wrap to multiple lines within the info column)
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '600',
  },

  // Job title — uses accent colour to tie back to category
  job: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Location
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locPin: {
    fontSize: 11,
    opacity: 0.60,
  },
  locText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // Thin hairline between header and bio
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginHorizontal: 14,
    marginTop: 12,
  },

  // Bio — takes all remaining card height after header + divider.
  // Font size bumped to 16px so even short bios fill the space visually.
  bioSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  bioText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,         // up from 14px
    lineHeight: 25,
    letterSpacing: 0.05,
  },
  // Large faint watermark fills visual weight below short bios
  bioMark: {
    position: 'absolute',
    bottom: 6,
    right: 12,
    fontSize: 72,
    lineHeight: 80,
    opacity: 0.07,
    includeFontPadding: false,
  },

  // Swipe overlays
  dateOv: {
    backgroundColor: 'rgba(20,200,80,0.14)',
    alignItems: 'flex-end',
    paddingTop: 22,
    paddingRight: 18,
  },
  passOv: {
    backgroundColor: 'rgba(220,30,55,0.14)',
    alignItems: 'flex-start',
    paddingTop: 22,
    paddingLeft: 18,
  },
  stampDate: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#20d460',
    transform: [{ rotate: '12deg' }],
    backgroundColor: 'rgba(32,212,96,0.12)',
  },
  stampPass: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#f02045',
    transform: [{ rotate: '-12deg' }],
    backgroundColor: 'rgba(240,32,69,0.12)',
  },
  stampTxt: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#fff',
  },
});
