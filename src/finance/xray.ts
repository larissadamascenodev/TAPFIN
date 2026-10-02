import { CATEGORIES, type IconName } from './categories';
import { addMonthsKey, capitalize, monthName, monthOf, todayStr } from './dates';
import {
  installmentGroups,
  monthsSummary,
  recurringExpenses,
  remainingInstallments,
  spendingByCategory,
  usedLimit,
} from './engine';
import { formatBRL } from './money';
import type { DateStr, FinanceData } from './types';

export type InsightLevel = 'good' | 'info' | 'attention' | 'alert';

export interface Insight {
  id: string;
  level: InsightLevel;
  icon: IconName;
  title: string;
  message: string;
}

export interface XRayReport {
  score: number;
  headline: string;
  insights: Insight[];
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Raio-X financeiro: lê tudo que entrou e saiu e avisa o que merece atenção — antes de apertar. */
export function analyze(data: FinanceData, today: DateStr = todayStr()): XRayReport {
  const month = monthOf(today);
  const months = monthsSummary(data, month, 6);
  const current = months[0];

  if (data.entries.length === 0) {
    return {
      score: 0,
      headline: 'Lance suas receitas e gastos para o Raio-X começar a trabalhar.',
      insights: [],
    };
  }

  const insights: Insight[] = [];
  let score = 70;

  // 1. Quanto sobra neste mês.
  if (current.net < 0) {
    score -= 25;
    insights.push({
      id: 'month-negative',
      level: 'alert',
      icon: 'warning',
      title: `${capitalize(monthName(month))} vai fechar no vermelho`,
      message: `Faltam ${formatBRL(-current.net)} para cobrir os gastos previstos. Vale adiar algo ou rever as categorias maiores.`,
    });
  } else if (current.income > 0) {
    const rate = current.net / current.income;
    if (rate >= 0.2) {
      score += 15;
      insights.push({
        id: 'month-saving',
        level: 'good',
        icon: 'checkmark-circle',
        title: `Você vai guardar ${Math.round(rate * 100)}% da renda`,
        message: `Devem sobrar ${formatBRL(current.net)} em ${monthName(month)}. Que tal mandar parte disso para um plano?`,
      });
    } else {
      score -= 5;
      insights.push({
        id: 'month-tight',
        level: 'attention',
        icon: 'speedometer',
        title: 'Mês apertado',
        message: `Só ${Math.round(Math.max(rate, 0) * 100)}% da renda deve sobrar. O ideal é mirar em pelo menos 20%.`,
      });
    }
  }

  // 2. Próximo mês negativo: o aviso antes do problema.
  const nextNegative = months.slice(1).find((m) => m.net < 0);
  if (nextNegative) {
    score -= 10;
    insights.push({
      id: 'future-negative',
      level: 'alert',
      icon: 'calendar',
      title: `${capitalize(monthName(nextNegative.month))} pede atenção`,
      message: `A previsão mostra ${formatBRL(-nextNegative.net)} faltando. Dá tempo de ajustar agora.`,
    });
  }

  // 3. Categoria que mais pesa.
  const categories = spendingByCategory(data, month);
  const spent = categories.reduce((sum, c) => sum + c.total, 0);
  const top = categories[0];
  if (top && spent > 0) {
    const share = Math.round((top.total / spent) * 100);
    const info = CATEGORIES[top.category];
    insights.push({
      id: 'top-category',
      level: share > 45 ? 'attention' : 'info',
      icon: info.icon,
      title: `${info.title} é ${share}% dos gastos`,
      message: `Foram ${formatBRL(top.total)} em ${monthName(month)}. É onde um ajuste pequeno faz mais diferença.`,
    });
  }

  // 4. Categoria que subiu em relação ao mês passado.
  const previous = new Map(spendingByCategory(data, addMonthsKey(month, -1)).map((c) => [c.category, c.total]));
  const jump = categories.find((c) => {
    const before = previous.get(c.category) ?? 0;
    return before > 0 && c.total > before * 1.3 && c.total - before > 10000;
  });
  if (jump) {
    score -= 5;
    insights.push({
      id: 'category-jump',
      level: 'attention',
      icon: 'trending-up',
      title: `${CATEGORIES[jump.category].title} subiu`,
      message: `Foi de ${formatBRL(previous.get(jump.category) ?? 0)} para ${formatBRL(jump.total)} em relação ao mês passado.`,
    });
  }

  // 5. Assinaturas.
  const subscriptions = recurringExpenses(data).filter((e) => e.category === 'subscriptions');
  if (subscriptions.length > 0) {
    const monthly = subscriptions.reduce((sum, e) => sum + e.amount, 0);
    insights.push({
      id: 'subscriptions',
      level: 'info',
      icon: 'repeat',
      title: `${subscriptions.length} ${plural(subscriptions.length, 'assinatura ativa', 'assinaturas ativas')}`,
      message: `São ${formatBRL(monthly)} por mês, ${formatBRL(monthly * 12)} por ano. Ainda usa todas?`,
    });
  }

  // 6. Limite dos cartões.
  for (const card of data.cards) {
    if (card.limit <= 0) continue;
    const used = usedLimit(data, card, today);
    const ratio = used / card.limit;
    if (ratio >= 0.8) {
      score -= 10;
      insights.push({
        id: `card-${card.id}`,
        level: 'alert',
        icon: 'card',
        title: `${card.name} com ${Math.round(ratio * 100)}% do limite usado`,
        message:
          used > card.limit
            ? `Os lançamentos passam ${formatBRL(used - card.limit)} do limite. Vale conferir as faturas e evitar novas compras nele.`
            : `Restam ${formatBRL(card.limit - used)}. Parcelamentos novos vão apertar as próximas faturas.`,
      });
    }
  }

  // 7. Parcelas comprometendo meses futuros.
  const installments = remainingInstallments(data, today);
  if (installments.length > 0) {
    const total = installments.reduce((sum, e) => sum + e.amount, 0);
    const groups = installmentGroups(installments);
    insights.push({
      id: 'installments',
      level: 'info',
      icon: 'layers',
      title: `${groups} ${plural(groups, 'compra parcelada', 'compras parceladas')}`,
      message: `Ainda faltam ${formatBRL(total)} em parcelas nos próximos meses.`,
    });
  }

  const clamped = Math.min(Math.max(score, 5), 100);
  const headline =
    clamped >= 80
      ? 'Suas finanças estão saudáveis. Bora fazer o dinheiro trabalhar pelos seus planos.'
      : clamped >= 55
        ? 'Tudo sob controle, com alguns pontos de atenção.'
        : 'Hora de agir: alguns meses vão apertar se nada mudar.';

  return { score: clamped, headline, insights };
}
