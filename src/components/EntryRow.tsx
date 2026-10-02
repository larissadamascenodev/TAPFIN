import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { CATEGORIES } from '@/finance/categories';
import { dayMonth, todayStr } from '@/finance/dates';
import { displayTitle } from '@/finance/factory';
import type { Entry } from '@/finance/types';
import { useStore } from '@/store';
import { colors } from '@/theme';

import { CategoryBadge, Money } from './ui';

export function EntryRow({ entry }: { entry: Entry }) {
  const source = useStore((s) =>
    entry.cardId
      ? s.cards.find((c) => c.id === entry.cardId)?.name
      : s.accounts.find((a) => a.id === entry.accountId)?.name,
  );
  const scheduled = entry.date > todayStr();
  const meta = [dayMonth(entry.date), CATEGORIES[entry.category].title, source].filter(Boolean).join(' · ');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: scheduled ? 0.6 : 1 }}>
      <CategoryBadge category={entry.category} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
          {displayTitle(entry)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12, flexShrink: 1 }}>
            {meta}
          </Text>
          {entry.recurring && <Ionicons name="repeat" size={12} color={colors.textSecondary} />}
          {scheduled && <Ionicons name="time-outline" size={12} color={colors.textSecondary} />}
        </View>
      </View>
      <Money
        cents={entry.kind === 'income' ? entry.amount : -entry.amount}
        signed
        size={15}
        color={entry.kind === 'income' ? colors.income : colors.expense}
        style={{ maxWidth: 130 }}
      />
    </View>
  );
}
