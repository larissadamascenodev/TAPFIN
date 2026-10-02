import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { EntryRow } from '@/components/EntryRow';
import { Card, Chip, Money, styles, WidgetHeader } from '@/components/ui';
import { addMonthsKey, capitalize, dayMonth, monthName, shortMonthName } from '@/finance/dates';
import { dueDate, invoiceEntries, invoiceTotal, openInvoiceMonth } from '@/finance/engine';
import { formatBRL } from '@/finance/money';
import { useFinanceData, useStore } from '@/store';
import { colors, gutter } from '@/theme';

/** Detalhe do cartão: próximas faturas e o que tem em cada uma. */
export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useFinanceData();
  const deleteCard = useStore((s) => s.deleteCard);
  const card = data.cards.find((c) => c.id === id);

  const months = useMemo(() => {
    if (!card) return [];
    const first = openInvoiceMonth(card);
    return Array.from({ length: 6 }, (_, i) => addMonthsKey(first, i));
  }, [card]);
  const [selected, setSelected] = useState(months[0]);

  if (!card) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.secondary}>Cartão não encontrado.</Text>
      </View>
    );
  }

  const month = selected ?? months[0];
  const entries = invoiceEntries(data, card, month);

  const confirmDelete = () => {
    const remove = () => {
      router.back();
      deleteCard(card.id);
    };
    if (Platform.OS === 'web') return remove();
    Alert.alert(`Excluir ${card.name}?`, 'Os lançamentos continuam salvos, mas deixam de estar ligados a este cartão.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: card.name,
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={10} accessibilityLabel="Excluir cartão">
              <Ionicons name="trash-outline" size={20} color={colors.expense} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: gutter, gap: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {months.map((m) => (
            <Chip key={m} label={capitalize(shortMonthName(m))} selected={m === month} onPress={() => setSelected(m)} />
          ))}
        </ScrollView>

        <Card padding={18}>
          <View style={{ gap: 4 }}>
            <Text style={styles.caption}>
              Fatura de {monthName(month)} · vence {dayMonth(dueDate(card, month))}
            </Text>
            <Money cents={invoiceTotal(data, card, month)} size={34} />
            <Text style={styles.tertiary}>
              Fecha dia {card.closingDay} · Limite {formatBRL(card.limit)}
            </Text>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <WidgetHeader
              title={`${entries.length} ${entries.length === 1 ? 'lançamento' : 'lançamentos'}`}
              chevron={false}
            />
            {entries.length === 0 ? (
              <Text style={styles.tertiary}>Nada nesta fatura ainda.</Text>
            ) : (
              entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
            )}
          </View>
        </Card>
      </ScrollView>
    </>
  );
}
