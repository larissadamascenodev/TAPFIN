import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { capitalize, monthOf, monthYear, todayStr } from '@/finance/dates';
import { monthsSummary, projectedBalances } from '@/finance/engine';
import type { FinanceData } from '@/finance/types';
import { colors } from '@/theme';

import { BalanceLine, MonthBars } from '../charts';
import { Card, Chip, Money, styles, WidgetHeader } from '../ui';

/** Aba "Previsão": quanto sobra em cada mês e como fica o saldo ao longo do tempo. */
export function ForecastDashboard({ data }: { data: FinanceData }) {
  const [horizon, setHorizon] = useState(6);
  const today = todayStr();

  const { months, balances } = useMemo(() => {
    const months = monthsSummary(data, monthOf(today), horizon);
    return { months, balances: projectedBalances(data, months, today) };
  }, [data, horizon, today]);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[3, 6, 12].map((value) => (
          <Chip key={value} label={`${value} meses`} selected={horizon === value} onPress={() => setHorizon(value)} />
        ))}
      </View>

      <Card padding={18}>
        <View style={{ gap: 14 }}>
          <WidgetHeader title="Sobra prevista por mês" chevron={false} />
          <MonthBars data={months.map((m) => ({ month: m.month, value: m.net }))} height={110} />
        </View>
      </Card>

      <Card padding={18}>
        <View style={{ gap: 14 }}>
          <WidgetHeader title="Saldo projetado nas contas" chevron={false} />
          <BalanceLine data={months.map((m, i) => ({ month: m.month, value: balances[i] }))} />
        </View>
      </Card>

      <Card>
        {months.map((m, i) => (
          <View
            key={m.month}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: i < months.length - 1 ? 1 : 0,
              borderBottomColor: colors.cardStroke,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{capitalize(monthYear(m.month))}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Money cents={m.income} size={12} weight="400" color={colors.income} />
                <Text style={styles.tertiary}>·</Text>
                <Money cents={m.expense} size={12} weight="400" color={colors.expense} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Money cents={m.net} signed size={15} color={m.net >= 0 ? colors.text : colors.expense} />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={styles.tertiary}>saldo</Text>
                <Money cents={balances[i]} size={12} weight="400" color={colors.textSecondary} />
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Text style={[styles.tertiary, { paddingHorizontal: 4 }]}>
        A previsão soma lançamentos agendados, recorrentes, parcelas e faturas de cartão no mês em que vencem.
      </Text>
    </View>
  );
}
