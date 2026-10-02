import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { Mood } from '@/finance/engine';
import { colors } from '@/theme';

/** Cores do gradiente conforme a saúde do mês. */
const PALETTES: Record<Mood, [string, string, string]> = {
  neutral: ['#2A5CFF', '#FF3850', '#FF8524'],
  healthy: ['#19CC9E', '#2A5CFF', '#B3FF33'],
  tight: ['#FF8524', '#FF3850', '#2A5CFF'],
  negative: ['#FF3850', '#FF1F3D', '#FF8524'],
};

function Blob({
  id,
  color,
  size,
  x,
  y,
  duration,
}: {
  id: string;
  color: string;
  size: number;
  x: number;
  y: number;
  duration: number;
}) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, reduceMotion, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.value - 0.5) * 50 },
      { translateY: (t.value - 0.5) * 36 },
      { scale: 0.92 + t.value * 0.16 },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }, animated]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.95} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.45} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Gradiente "vivo" do topo da Início: manchas de cor que respiram devagar.
 * Verde quando o mês está saudável, laranja quando aperta, vermelho quando vai faltar.
 */
export function LivingGradient({ mood = 'neutral', height = 460 }: { mood?: Mood; height?: number }) {
  const { width } = useWindowDimensions();
  const [a, b, c] = PALETTES[mood];
  const size = width * 1.25;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height, overflow: 'hidden' }]}>
      <Blob id={`${mood}-a`} color={a} size={size} x={width * 0.1} y={height * 0.18} duration={7000} />
      <Blob id={`${mood}-b`} color={b} size={size} x={width * 0.95} y={height * 0.22} duration={8500} />
      <Blob id={`${mood}-c`} color={c} size={size * 0.95} x={width * 0.55} y={height * 0.62} duration={9500} />
      <LinearGradient
        colors={['rgba(8,8,10,0)', 'rgba(8,8,10,0.55)', colors.background]}
        locations={[0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
