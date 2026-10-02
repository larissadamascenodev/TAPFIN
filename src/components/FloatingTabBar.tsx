import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/finance/categories';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { colors, gutter, haptic } from '@/theme';

const ITEMS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Início' },
  entries: { icon: 'swap-horizontal', label: 'Lançamentos' },
  xray: { icon: 'pulse', label: 'Raio-X' },
  fin: { icon: 'sparkles', label: 'Fin' },
};

/** Barra flutuante. O botão central é o "tap": abre o lançamento rápido. */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  const renderItem = (index: number) => {
    const route = state.routes[index];
    if (!route) return null;
    const item = ITEMS[route.name];
    const focused = state.index === index;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityLabel={item?.label ?? route.name}
        accessibilityState={{ selected: focused }}
        onPress={() => {
          haptic.selection();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={[styles.item, focused && styles.itemFocused]}
      >
        <Ionicons
          name={item?.icon ?? 'ellipse'}
          size={21}
          color={focused ? colors.lime : colors.textSecondary}
        />
      </Pressable>
    );
  };

  // Some com o teclado para não cobrir campos de texto (no Android a tela encolhe).
  if (keyboardVisible) return null;

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}
        {renderItem(0)}
        {renderItem(1)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Novo lançamento"
          onPress={() => {
            haptic.medium();
            router.push('/quick-add');
          }}
          style={({ pressed }) => [styles.plus, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
        >
          <Ionicons name="add" size={30} color="#000" />
        </Pressable>
        {renderItem(2)}
        {renderItem(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: gutter,
    right: gutter,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(20,20,24,0.55)' : 'rgba(24,24,28,0.96)',
    borderWidth: 1,
    borderColor: colors.cardStroke,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  item: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemFocused: { backgroundColor: 'rgba(255,255,255,0.08)' },
  plus: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginHorizontal: 10,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 18px rgba(209,255,46,0.45)',
  },
});
