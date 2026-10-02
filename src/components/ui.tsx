import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { CATEGORIES, type IconName } from '@/finance/categories';
import { formatBRL } from '@/finance/money';
import type { CategoryId } from '@/finance/types';
import { useStore } from '@/store';
import { colors, haptic, radius } from '@/theme';

/** Card de vidro escuro usado em todos os widgets. */
export function Card({
  children,
  padding = 16,
  style,
}: {
  children: ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

/** Card que responde ao toque (abre detalhe). */
export function PressableCard({
  children,
  onPress,
  padding = 16,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [styles.card, { padding, opacity: pressed ? 0.75 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

export function WidgetHeader({ title, chevron = true }: { title: string; chevron?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.widgetTitle} numberOfLines={1}>
        {title}
      </Text>
      {chevron && <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />}
    </View>
  );
}

/** Valor em reais que respeita o "ocultar valores" (olhinho no topo). */
export function Money({
  cents,
  size = 20,
  weight = '600',
  color = colors.text,
  signed = false,
  style,
}: {
  cents: number;
  size?: number;
  weight?: TextStyle['fontWeight'];
  color?: string;
  signed?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const hidden = useStore((s) => s.hideValues);
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={[{ fontSize: size, fontWeight: weight, color, fontVariant: ['tabular-nums'] }, style]}
    >
      {hidden ? 'R$ ••••' : formatBRL(cents, { signed })}
    </Text>
  );
}

export function CategoryBadge({ category, size = 36 }: { category: CategoryId; size?: number }) {
  const info = CATEGORIES[category];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${info.color}29`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={info.icon} size={size * 0.46} color={info.color} />
    </View>
  );
}

/** Pílula selecionável (filtros, categorias, contas). */
export function Chip({
  label,
  icon,
  selected,
  tint = colors.lime,
  onPress,
}: {
  label: string;
  icon?: IconName;
  selected: boolean;
  tint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: tint, borderColor: 'transparent' } : null,
        pressed ? { opacity: 0.7 } : null,
      ]}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? '#000' : colors.text} />}
      <Text style={[styles.chipText, { color: selected ? '#000' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function ProgressBar({
  progress,
  tint = colors.lime,
  height = 8,
}: {
  progress: number;
  tint?: string;
  height?: number;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(clamped * 100, 2)}%`, height, borderRadius: height, backgroundColor: tint }} />
    </View>
  );
}

export function EmptyState({
  icon,
  text,
  action,
  onAction,
}: {
  icon: IconName;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <Ionicons name={icon} size={26} color={colors.textSecondary} />
      <Text style={[styles.secondary, { textAlign: 'center' }]}>{text}</Text>
      <Pressable onPress={onAction} style={styles.ghostButton}>
        <Ionicons name="add" size={16} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{action}</Text>
      </Pressable>
    </View>
  );
}

export function IconCircle({ icon, color = colors.textSecondary }: { icon: IconName; color?: string }) {
  return (
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardStroke,
    borderWidth: 1,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    width: '100%',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  widgetTitle: { color: colors.textSecondary, fontSize: 14, flexShrink: 1 },
  secondary: { color: colors.textSecondary, fontSize: 14 },
  tertiary: { color: colors.textTertiary, fontSize: 12 },
  caption: { color: colors.textSecondary, fontSize: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  primary: {
    backgroundColor: colors.lime,
    borderRadius: radius.chip,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryText: { color: '#000', fontSize: 17, fontWeight: '700' },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.chip,
    backgroundColor: colors.elevated,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: { color: colors.text, fontSize: 34, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
