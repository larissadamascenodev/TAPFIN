import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompareBars, Ring } from '@/components/charts';
import { Card, Chip, styles } from '@/components/ui';
import { monthName, monthOf, todayStr } from '@/finance/dates';
import { monthsSummary } from '@/finance/engine';
import { formatBRL, parseBRL, splitInstallments } from '@/finance/money';
import { analyze, type Insight } from '@/finance/xray';
import { useFinanceData } from '@/store';
import { colors, gutter, TAB_BAR_SPACE } from '@/theme';

const LEVEL_COLOR: Record<Insight['level'], string> = {
  good: colors.income,
  info: colors.info,
  attention: colors.warning,
  alert: colors.expense,
};

/** Raio-X financeiro: nota de saúde, alertas antes de apertar e o simulador "Posso comprar?". */
export default function XRayScreen() {
  const insets = useSafeAreaInsets();
  const data = useFinanceData();
  const report = useMemo(() => analyze(data), [data]);
  const scoreColor = report.score >= 80 ? colors.lime : report.score >= 55 ? colors.warning : colors.expense;
  const empty = data.entries.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: gutter, paddingBottom: TAB_BAR_SPACE + insets.bottom, gap: 14 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Raio-X</Text>

      <Card padding={20}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute' }}>
              <Ring progress={report.score / 100} color={scoreColor} />
            </View>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>{empty ? '–' : report.score}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>de 100</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.caption}>Saúde financeira</Text>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{report.headline}</Text>
          </View>
        </View>
      </Card>

      <PurchaseSimulator />

      {report.insights.length > 0 && (
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>O que o Raio-X encontrou</Text>
      )}
      {report.insights.map((insight) => (
        <Card key={insight.id}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: `${LEVEL_COLOR[insight.level]}26`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={insight.icon} size={17} color={LEVEL_COLOR[insight.level]} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{insight.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{insight.message}</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/** "Posso comprar?": mostra mês a mês quanto a compra tira do que ia sobrar. */
function PurchaseSimulator() {
  const data = useFinanceData();
  const [cents, setCents] = useState(0);
  const [installments, setInstallments] = useState(1);
  const month = monthOf(todayStr());

  const { before, after } = useMemo(() => {
    const simulation = cents > 0 ? { amount: cents, installments, startMonth: month } : undefined;
    return {
      before: monthsSummary(data, month, 6),
      after: monthsSummary(data, month, 6, simulation),
    };
  }, [data, cents, installments, month]);

  const negative = after.find((m) => m.net < 0);
  const worst = Math.min(...after.map((m) => m.net));

  return (
    <Card padding={18}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="cart" size={18} color={colors.lime} />
          <Text style={styles.sectionTitle}>Posso comprar?</Text>
        </View>

        <TextInput
          value={cents > 0 ? formatBRL(cents) : ''}
          onChangeText={(text) => setCents(parseBRL(text))}
          placeholder="Valor da compra"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: '600',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.elevated,
          }}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[1, 2, 3, 6, 10, 12].map((n) => (
            <Chip key={n} label={n === 1 ? 'À vista' : `${n}x`} selected={installments === n} onPress={() => setInstallments(n)} />
          ))}
        </View>

        {cents > 0 ? (
          <>
            <CompareBars
              before={before.map((m) => ({ month: m.month, value: m.net }))}
              after={after.map((m) => ({ month: m.month, value: m.net }))}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Ionicons
                name={negative ? 'warning' : 'checkmark-circle'}
                size={18}
                color={negative ? colors.expense : colors.lime}
              />
              <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
                  {negative
                    ? `Com essa compra, ${monthName(negative.month)} fecha faltando ${formatBRL(-negative.net)}. Tente mais parcelas, um valor menor ou espere alguns meses.`
                    : `Cabe no seu orçamento. São ${formatBRL(splitInstallments(cents, installments)[0])} por mês e o pior mês ainda sobra ${formatBRL(worst)}.`}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.secondary}>Digite o valor e veja o impacto antes de passar o cartão.</Text>
        )}
      </View>
    </Card>
  );
}
