import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryRow } from '@/components/EntryRow';
import { Card, Chip, Money, styles } from '@/components/ui';
import { CATEGORIES } from '@/finance/categories';
import { addMonthsKey, capitalize, monthOf, monthYear, todayStr } from '@/finance/dates';
import type { Entry, EntryKind } from '@/finance/types';
import { useStore } from '@/store';
import { colors, gutter, TAB_BAR_SPACE } from '@/theme';

/** Todos os lançamentos, mês a mês, com busca e filtro. */
export default function EntriesScreen() {
  const insets = useSafeAreaInsets();
  const entries = useStore((s) => s.entries);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const [month, setMonth] = useState(monthOf(todayStr()));
  const [filter, setFilter] = useState<EntryKind | null>(null);
  const [search, setSearch] = useState('');

  // Pela data da compra; recorrentes aparecem em todo mês a partir do início.
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        const base = monthOf(e.date);
        const inMonth = e.recurring ? month >= base : month === base;
        const matchesKind = !filter || e.kind === filter;
        const matchesSearch =
          !query || e.title.toLowerCase().includes(query) || CATEGORIES[e.category].title.toLowerCase().includes(query);
        return inMonth && matchesKind && matchesSearch;
      })
      .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
  }, [entries, month, filter, search]);

  const income = visible.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = visible.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0);

  const confirmDelete = (entry: Entry) => {
    const message = entry.installment ? 'Todas as parcelas desta compra serão excluídas.' : 'Esse lançamento será excluído.';
    if (Platform.OS === 'web') {
      deleteEntry(entry.id);
      return;
    }
    Alert.alert(`Excluir "${entry.title}"?`, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const header = (
    <View style={{ gap: 14, paddingBottom: 12 }}>
      <Text style={styles.screenTitle}>Lançamentos</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable hitSlop={10} onPress={() => setMonth((m) => addMonthsKey(m, -1))} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.sectionTitle, { flex: 1, textAlign: 'center' }]}>{capitalize(monthYear(month))}</Text>
        <Pressable hitSlop={10} onPress={() => setMonth((m) => addMonthsKey(m, 1))} style={{ padding: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, width: undefined }}>
          <Text style={styles.caption}>Entradas</Text>
          <Money cents={income} size={17} color={colors.income} />
        </Card>
        <Card style={{ flex: 1, width: undefined }}>
          <Text style={styles.caption}>Saídas</Text>
          <Money cents={expense} size={17} color={colors.expense} />
        </Card>
      </View>

      <View style={[styles.chip, { paddingVertical: 10 }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar"
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, color: colors.text, fontSize: 15, padding: 0 }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Tudo" selected={filter === null} onPress={() => setFilter(null)} />
        <Chip label="Gastos" selected={filter === 'expense'} onPress={() => setFilter('expense')} />
        <Chip label="Receitas" selected={filter === 'income'} onPress={() => setFilter('income')} />
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: gutter,
        paddingBottom: TAB_BAR_SPACE + insets.bottom,
      }}
      data={visible}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={[styles.tertiary, { textAlign: 'center', paddingVertical: 40, fontSize: 14 }]}>
          Nenhum lançamento por aqui.
        </Text>
      }
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => (
        <Pressable
          onLongPress={() => confirmDelete(item)}
          style={({ pressed }) => [
            { padding: 12, borderRadius: 18, backgroundColor: colors.card },
            pressed && { opacity: 0.7 },
          ]}
        >
          <EntryRow entry={item} />
        </Pressable>
      )}
      ListFooterComponent={
        visible.length > 0 ? (
          <Text style={[styles.tertiary, { textAlign: 'center', marginTop: 14 }]}>
            Segure um lançamento para excluir
          </Text>
        ) : null
      }
      keyboardDismissMode="on-drag"
    />
  );
}
