import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { CATEGORIES } from '@/finance/categories';
import { monthName, monthOf, todayStr } from '@/finance/dates';
import {
  balance,
  commitment,
  installmentGroups,
  monthSummary,
  monthsSummary,
  recurringExpenses,
  remainingInstallments,
  spendingByCategory,
  totalOpenInvoices,
} from '@/finance/engine';
import type { FinanceData, MonthSummary } from '@/finance/types';
import { colors } from '@/theme';

import { MonthBars } from '../charts';
import { EntryRow } from '../EntryRow';
import { Card, EmptyState, IconCircle, Money, PressableCard, ProgressBar, styles, WidgetHeader } from '../ui';

/** Aba "Contas" da Início: o essencial do mês numa grade de widgets. */
export function AccountsDashboard({
  data,
  onShowCards,
  onShowForecast,
}: {
  data: FinanceData;
  onShowCards: () => void;
  onShowForecast: () => void;
}) {
  const today = todayStr();
  const month = monthOf(today);

  const computed = useMemo(() => {
    const recurring = recurringExpenses(data);
    const installments = remainingInstallments(data, today);
    return {
      summary: monthSummary(data, month),
      balance: balance(data, today),
      invoices: totalOpenInvoices(data, today),
      categories: spendingByCategory(data, month),
      recent: data.entries
        .filter((e) => e.date <= today)
        .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
        .slice(0, 3),
      recurringTotal: recurring.reduce((sum, e) => sum + e.amount, 0),
      recurringCount: recurring.length,
      installmentsTotal: installments.reduce((sum, e) => sum + e.amount, 0),
      installmentsGroups: installmentGroups(installments),
      next: monthsSummary(data, month, 6).map((m) => ({ month: m.month, value: m.net })),
    };
  }, [data, month, today]);

  const empty = data.accounts.length === 0 && data.entries.length === 0;

  return (
    <View style={{ gap: 12 }}>
      {empty && (
        <Card>
          <EmptyState
            icon="wallet-outline"
            text="Adicione suas contas e comece a ver quanto vai sobrar no mês."
            action="Adicionar conta"
            onAction={() => router.push('/account-form')}
          />
        </Card>
      )}

      <MonthForecastCard summary={computed.summary} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PressableCard style={{ flex: 1, width: undefined }} onPress={() => router.push('/accounts')}>
          <View style={{ gap: 8 }}>
            <WidgetHeader title="Saldo em contas" />
            <Money cents={computed.balance} />
            <View style={{ flexDirection: 'row', height: 22 }}>
              {data.accounts.slice(0, 4).map((account, index) => (
                <View
                  key={account.id}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    marginLeft: index === 0 ? 0 : -6,
                    backgroundColor: account.color,
                    borderWidth: 2,
                    borderColor: colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{account.name.charAt(0)}</Text>
                </View>
              ))}
              {data.accounts.length === 0 && <Text style={styles.tertiary}>Nenhuma conta</Text>}
            </View>
          </View>
        </PressableCard>

        <PressableCard style={{ flex: 1, width: undefined }} onPress={onShowCards}>
          <View style={{ gap: 8 }}>
            <WidgetHeader title="Total em faturas" />
            <Money cents={computed.invoices} />
            <Text style={[styles.tertiary, { height: 22, lineHeight: 22 }]}>
              {data.cards.length === 0
                ? 'Nenhum cartão'
                : `${data.cards.length} ${data.cards.length === 1 ? 'cartão' : 'cartões'}`}
            </Text>
          </View>
        </PressableCard>
      </View>

      <CategoryCard totals={computed.categories} />

      <PressableCard onPress={() => router.navigate('/entries')}>
        <View style={{ gap: 12 }}>
          <WidgetHeader title="Transações recentes" />
          {computed.recent.length === 0 ? (
            <Text style={styles.tertiary}>Toque no + para lançar a primeira</Text>
          ) : (
            computed.recent.map((entry) => <EntryRow key={entry.id} entry={entry} />)
          )}
        </View>
      </PressableCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, width: undefined }}>
          <View style={{ gap: 8 }}>
            <IconCircle icon="repeat" />
            <Text style={styles.caption}>Fixos e assinaturas</Text>
            <Money cents={computed.recurringTotal} size={17} />
            <Text style={styles.tertiary}>
              {computed.recurringCount === 0 ? 'Nenhum' : `${computed.recurringCount} por mês`}
            </Text>
          </View>
        </Card>
        <Card style={{ flex: 1, width: undefined }}>
          <View style={{ gap: 8 }}>
            <IconCircle icon="layers" />
            <Text style={styles.caption}>Parcelamentos</Text>
            <Money cents={computed.installmentsTotal} size={17} />
            <Text style={styles.tertiary}>
              {computed.installmentsGroups === 0
                ? 'Nenhum'
                : `${computed.installmentsGroups} ${computed.installmentsGroups === 1 ? 'compra' : 'compras'} em aberto`}
            </Text>
          </View>
        </Card>
      </View>

      <PressableCard padding={18} onPress={onShowForecast}>
        <View style={{ gap: 14 }}>
          <WidgetHeader title="Quanto sobra nos próximos meses" />
          <MonthBars data={computed.next} height={70} />
        </View>
      </PressableCard>
    </View>
  );
}

/** O destaque da Início: quanto vai sobrar no mês, já contando agendados, parcelas e faturas. */
export function MonthForecastCard({ summary }: { summary: MonthSummary }) {
  const ratio = commitment(summary);
  const positive = summary.net >= 0;
  const tint = ratio > 1 ? colors.expense : ratio > 0.85 ? colors.warning : colors.lime;

  return (
    <Card padding={18}>
      <View style={{ gap: 14 }}>
        <WidgetHeader
          title={`${positive ? 'Vai sobrar' : 'Vai faltar'} em ${monthName(summary.month)}`}
          chevron={false}
        />
        <Money cents={Math.abs(summary.net)} size={40} color={positive ? colors.text : colors.expense} />
        <ProgressBar progress={ratio} tint={tint} height={10} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Flow title="Entradas" cents={summary.income} color={colors.income} icon="↙" />
          <Flow title="Saídas" cents={summary.expense} color={colors.expense} icon="↗" />
        </View>
      </View>
    </Card>
  );
}

function Flow({ title, cents, color, icon }: { title: string; cents: number; color: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: `${color}26`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color, fontWeight: '800', fontSize: 14 }}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.caption}>{title}</Text>
        <Money cents={cents} size={15} />
      </View>
    </View>
  );
}

function CategoryCard({ totals }: { totals: { category: keyof typeof CATEGORIES; total: number }[] }) {
  const sum = totals.reduce((acc, t) => acc + t.total, 0);
  const share = (total: number) => (sum > 0 ? total / sum : 0);

  return (
    <Card padding={18}>
      <View style={{ gap: 12 }}>
        <WidgetHeader title="Gastos por categoria · este mês" chevron={false} />
        <Money cents={sum} size={24} />
        <View style={{ flexDirection: 'row', gap: 3, height: 10 }}>
          {totals.length === 0 ? (
            <View style={{ flex: 1, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          ) : (
            totals.map((t) => (
              <View
                key={t.category}
                style={{ flex: Math.max(share(t.total), 0.02), borderRadius: 5, backgroundColor: CATEGORIES[t.category].color }}
              />
            ))
          )}
        </View>
        {totals.length === 0 ? (
          <Text style={styles.tertiary}>Sem gastos lançados neste mês</Text>
        ) : (
          totals.slice(0, 3).map((t) => (
            <View key={t.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CATEGORIES[t.category].color }} />
              <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{CATEGORIES[t.category].title}</Text>
              <Text style={styles.caption}>{Math.round(share(t.total) * 100)}%</Text>
              <Money cents={t.total} size={15} weight="500" style={{ minWidth: 92, textAlign: 'right' }} />
            </View>
          ))
        )}
      </View>
    </Card>
  );
}
