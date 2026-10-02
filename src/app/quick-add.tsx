import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, PrimaryButton } from '@/components/ui';
import { categoriesFor, KIND_TITLE } from '@/finance/categories';
import { addDays, dayMonth, todayStr } from '@/finance/dates';
import { formatBRL, splitInstallments } from '@/finance/money';
import type { CategoryId, EntryKind } from '@/finance/types';
import { useStore } from '@/store';
import { colors, gutter, haptic } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'] as const;
const MAX_CENTS = 99_999_999_99;

/**
 * Lançamento em dois toques: digita o valor e salva.
 * Categoria e conta já vêm sugeridas. Abre também por tapfin://quick-add (Toque nas Costas, NFC).
 */
export default function QuickAddScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyWidth = Math.floor((width - gutter * 2 - 20) / 3);
  const params = useLocalSearchParams<{ kind?: string }>();
  const accounts = useStore((s) => s.accounts);
  const cards = useStore((s) => s.cards);
  const lastExpenseCategory = useStore((s) => s.lastExpenseCategory);
  const addEntry = useStore((s) => s.addEntry);

  const [kind, setKind] = useState<EntryKind>(params.kind === 'income' ? 'income' : 'expense');
  const [cents, setCents] = useState(0);
  const [category, setCategory] = useState<CategoryId>(kind === 'income' ? 'salary' : lastExpenseCategory);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [accountId, setAccountId] = useState<string | undefined>(accounts[0]?.id);
  const [cardId, setCardId] = useState<string | undefined>();
  const [installments, setInstallments] = useState(1);
  const [recurring, setRecurring] = useState(false);

  const today = todayStr();
  const isCardPurchase = kind === 'expense' && !!cardId;
  const tint = kind === 'income' ? colors.income : colors.expense;

  const switchKind = (next: EntryKind) => {
    setKind(next);
    setCategory(next === 'income' ? 'salary' : lastExpenseCategory);
    if (next === 'income') {
      setCardId(undefined);
      setAccountId((current) => current ?? accounts[0]?.id);
    }
  };

  const press = (key: (typeof KEYS)[number]) => {
    haptic.light();
    setCents((value) => {
      if (key === 'del') return Math.floor(value / 10);
      if (key === '00') return value * 100 > MAX_CENTS ? value : value * 100;
      const next = value * 10 + Number(key);
      return next > MAX_CENTS ? value : next;
    });
  };

  const save = () => {
    if (cents === 0) return;
    addEntry({
      title: title.trim() || categoriesFor(kind).find((c) => c.id === category)?.title || 'Lançamento',
      amount: cents,
      kind,
      category,
      date,
      recurring,
      installments: isCardPurchase && !recurring ? installments : 1,
      accountId: cardId ? undefined : accountId,
      cardId: isCardPurchase ? cardId : undefined,
    });
    haptic.success();
    router.back();
  };

  const dateLabel = date === today ? 'Hoje' : date === addDays(today, -1) ? 'Ontem' : dayMonth(date);
  const verb = date > today ? 'Agendar' : 'Salvar';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }}>
      {/* Topo: cancelar + gasto/receita */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingTop: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 80 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancelar</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: colors.card }}>
            {(['expense', 'income'] as const).map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  haptic.selection();
                  switchKind(k);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: kind === k ? (k === 'income' ? colors.income : colors.expense) : 'transparent',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: kind === k ? '#000' : '#fff' }}>
                  {KIND_TITLE[k]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingVertical: 14 }} keyboardShouldPersistTaps="handled">
        {/* Valor */}
        <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: gutter }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontSize: 52,
              fontWeight: '600',
              color: cents === 0 ? colors.textTertiary : tint,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatBRL(cents)}
          </Text>
          {isCardPurchase && installments > 1 && cents > 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
              {installments}x de {formatBRL(splitInstallments(cents, installments)[0])}
            </Text>
          )}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Descrição (opcional)"
          placeholderTextColor={colors.textTertiary}
          style={{ color: colors.text, fontSize: 16, textAlign: 'center', paddingHorizontal: 40, paddingVertical: 6 }}
          returnKeyType="done"
        />

        {/* Categorias */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }}>
          {categoriesFor(kind).map((c) => (
            <Chip
              key={c.id}
              label={c.title}
              icon={c.icon}
              tint={c.color}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </ScrollView>

        {/* Conta ou cartão */}
        {(accounts.length > 0 || (kind === 'expense' && cards.length > 0)) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }}>
            {accounts.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                icon="business"
                tint="#fff"
                selected={!cardId && accountId === a.id}
                onPress={() => {
                  setAccountId(a.id);
                  setCardId(undefined);
                }}
              />
            ))}
            {kind === 'expense' &&
              cards.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  icon="card"
                  tint="#fff"
                  selected={cardId === c.id}
                  onPress={() => setCardId(c.id)}
                />
              ))}
          </ScrollView>
        )}

        {/* Data, parcelas e recorrência */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: gutter }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: colors.card }}>
            <Pressable onPress={() => setDate((d) => addDays(d, -1))} hitSlop={8} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setDate(today)}>
              <Text style={{ color: date === today ? colors.textSecondary : colors.lime, fontSize: 13, fontWeight: '600' }}>
                {dateLabel}
              </Text>
            </Pressable>
            <Pressable onPress={() => setDate((d) => addDays(d, 1))} hitSlop={8} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Option
            icon="repeat"
            label="Todo mês"
            active={recurring}
            onPress={() => {
              setRecurring((r) => !r);
              setInstallments(1);
            }}
          />
          {isCardPurchase && !recurring && (
            <Option
              icon="layers-outline"
              label={installments === 1 ? 'À vista' : `${installments}x`}
              active={installments > 1}
              onPress={() => setInstallments((n) => (n >= 12 ? 1 : n + 1))}
            />
          )}
        </View>
      </ScrollView>

      {/* Teclado */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: gutter }}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            accessibilityLabel={key === 'del' ? 'Apagar' : key}
            onPress={() => press(key)}
            onLongPress={key === 'del' ? () => setCents(0) : undefined}
            style={({ pressed }) => ({
              width: keyWidth,
              height: 54,
              borderRadius: 16,
              backgroundColor: pressed ? colors.elevated : colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            {key === 'del' ? (
              <Ionicons name="backspace-outline" size={24} color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '500' }}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <PrimaryButton
        title={cents === 0 ? 'Digite o valor' : `${verb} ${KIND_TITLE[kind].toLowerCase()}`}
        onPress={save}
        disabled={cents === 0}
        style={{ marginHorizontal: gutter, marginTop: 12 }}
      />
    </View>
  );
}

function Option({
  icon,
  label,
  active,
  onPress,
}: {
  icon: 'repeat' | 'layers-outline';
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? colors.lime : colors.card,
      }}
    >
      <Ionicons name={icon} size={14} color={active ? '#000' : colors.textSecondary} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#000' : colors.textSecondary }}>{label}</Text>
    </Pressable>
  );
}
