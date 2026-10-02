import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Tokens visuais: fundo quase preto, cards de vidro e verde-limão como cor de ação. */
export const colors = {
  background: '#08080A',
  card: 'rgba(255,255,255,0.06)',
  cardStroke: 'rgba(255,255,255,0.08)',
  elevated: 'rgba(255,255,255,0.10)',
  lime: '#D1FF2E',
  income: '#5CE685',
  expense: '#FF5C61',
  warning: '#FF8F33',
  info: '#5C94FF',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.35)',
} as const;

export const radius = { card: 26, chip: 999, key: 16 } as const;
export const gutter = 16;

/** Espaço reservado no fim das telas para a barra flutuante. */
export const TAB_BAR_SPACE = 120;

export const SWATCHES = ['#8A05BE', '#FF7A00', '#2E6BFF', '#00A86B', '#EC0000', '#FFCC00', '#3A3A3C', '#D1FF2E'];

const canVibrate = Platform.OS === 'ios' || Platform.OS === 'android';

/** Vibrações sutis (no web não fazem nada). */
export const haptic = {
  selection: () => canVibrate && Haptics.selectionAsync(),
  light: () => canVibrate && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => canVibrate && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => canVibrate && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};
