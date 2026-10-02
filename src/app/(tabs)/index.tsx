import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountsDashboard } from '@/components/home/AccountsDashboard';
import { CardsDashboard } from '@/components/home/CardsDashboard';
import { ForecastDashboard } from '@/components/home/ForecastDashboard';
import { LivingGradient } from '@/components/LivingGradient';
import { greeting, monthOf, todayStr } from '@/finance/dates';
import { monthSummary, mood } from '@/finance/engine';
import { useFinanceData, useStore } from '@/store';
import { colors, gutter, haptic, TAB_BAR_SPACE } from '@/theme';

type Segment = 'accounts' | 'cards' | 'forecast';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'accounts', label: 'Contas' },
  { id: 'cards', label: 'Cartões' },
  { id: 'forecast', label: 'Previsão' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const data = useFinanceData();
  const userName = useStore((s) => s.userName);
  const hideValues = useStore((s) => s.hideValues);
  const toggleHideValues = useStore((s) => s.toggleHideValues);
  const [segment, setSegment] = useState<Segment>('accounts');
  const scrollRef = useRef<ScrollView>(null);

  const currentMood = useMemo(
    () => mood(monthSummary(data, monthOf(todayStr())), data.entries.length > 0),
    [data],
  );

  // "Dois toques na tela": tocar duas vezes na saudação abre o lançamento rápido.
  const lastTap = useRef(0);
  const onGreetingPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      lastTap.current = 0;
      haptic.medium();
      router.push('/quick-add');
    } else {
      lastTap.current = now;
    }
  };

  const showSegment = (next: Segment) => {
    setSegment(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <LivingGradient mood={currentMood} height={460 + insets.top} />

      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: gutter, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            accessibilityLabel="Ajustes"
            onPress={() => router.push('/settings')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#000' }}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityLabel={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            onPress={() => {
              haptic.selection();
              toggleHideValues();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={hideValues ? 'eye-off-outline' : 'eye-outline'} size={19} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => router.navigate('/xray')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: colors.lime,
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 15, color: '#000' }}>Raio-X</Text>
            <Ionicons name="pulse" size={15} color="#000" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SEGMENTS.map((s) => {
            const selected = s.id === segment;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  haptic.selection();
                  showSegment(s.id);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.14)',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '500', color: selected ? '#000' : '#fff' }}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={onGreetingPress} style={{ paddingTop: 76, paddingBottom: 10, gap: 4 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '400' }}>
            {greeting()}, {userName}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Toque duas vezes aqui para lançar</Text>
        </Pressable>

        {segment === 'accounts' && (
          <AccountsDashboard
            data={data}
            onShowCards={() => showSegment('cards')}
            onShowForecast={() => showSegment('forecast')}
          />
        )}
        {segment === 'cards' && <CardsDashboard data={data} />}
        {segment === 'forecast' && <ForecastDashboard data={data} />}

        <Pressable
          onPress={() => router.navigate('/fin')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 18,
            paddingVertical: 16,
            borderRadius: 999,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.cardStroke,
            marginTop: 4,
          }}
        >
          <Ionicons name="sparkles" size={18} color={colors.lime} />
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '500', flex: 1 }}>
            Pergunte ao Fin
          </Text>
          <Ionicons name="arrow-up-outline" size={18} color={colors.textTertiary} style={{ transform: [{ rotate: '45deg' }] }} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
