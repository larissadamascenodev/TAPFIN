import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { dayMonth, todayStr } from '@/finance/dates';
import { dueDate, invoiceTotal, openInvoiceMonth, usedLimit } from '@/finance/engine';
import type { CreditCard, FinanceData } from '@/finance/types';
import { colors } from '@/theme';

import { Card, EmptyState, Money, PressableCard, ProgressBar, styles } from '../ui';

/** Aba "Cartões": fatura aberta, vencimento e limite de cada cartão. */
export function CardsDashboard({ data }: { data: FinanceData }) {
  if (data.cards.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="card-outline"
          text="Cadastre seus cartões para acompanhar faturas, limite e parcelas em tempo real."
          action="Adicionar cartão"
          onAction={() => router.push('/card-form')}
        />
      </Card>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {data.cards.map((card) => (
        <CardSummary key={card.id} card={card} data={data} />
      ))}
      <Pressable onPress={() => router.push('/card-form')} style={[styles.chip, { justifyContent: 'center', paddingVertical: 14 }]}>
        <Ionicons name="add" size={16} color={colors.text} />
        <Text style={[styles.chipText, { color: colors.text, fontWeight: '600' }]}>Adicionar cartão</Text>
      </Pressable>
    </View>
  );
}

export function CardSummary({ card, data }: { card: CreditCard; data: FinanceData }) {
  const today = todayStr();
  const month = openInvoiceMonth(card, today);
  const invoice = invoiceTotal(data, card, month);
  const used = usedLimit(data, card, today);
  const ratio = card.limit > 0 ? used / card.limit : 0;

  return (
    <PressableCard padding={18} onPress={() => router.push({ pathname: '/card/[id]', params: { id: card.id } })}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 34,
              height: 24,
              borderRadius: 6,
              backgroundColor: card.color,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          />
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600', flex: 1 }}>{card.name}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>

        <View style={{ gap: 2 }}>
          <Text style={styles.caption}>Fatura aberta · vence {dayMonth(dueDate(card, month))}</Text>
          <Money cents={invoice} size={30} />
        </View>

        <View style={{ gap: 6 }}>
          <ProgressBar
            progress={ratio}
            tint={ratio > 0.8 ? colors.expense : ratio > 0.6 ? colors.warning : colors.lime}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.caption}>Usado</Text>
            <Money cents={used} size={12} />
            <View style={{ flex: 1 }} />
            <Text style={styles.caption}>Disponível</Text>
            <Money cents={Math.max(card.limit - used, 0)} size={12} color={colors.lime} />
          </View>
        </View>
      </View>
    </PressableCard>
  );
}
