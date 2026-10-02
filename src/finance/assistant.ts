import { CATEGORIES } from './categories';
import { capitalize, monthName, monthOf, todayStr } from './dates';
import {
  balance,
  invoiceTotal,
  monthSummary,
  monthsSummary,
  openInvoiceMonth,
  recurringExpenses,
  spendingByCategory,
  usedLimit,
} from './engine';
import { formatBRL } from './money';
import type { DateStr, FinanceData } from './types';

export const SUGGESTIONS = [
  'Quanto vai sobrar este mês?',
  'Onde estou gastando mais?',
  'Como estão os próximos meses?',
  'Quanto pago de assinaturas?',
  'Como está meu cartão?',
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Respostas do Fin calculadas localmente a partir dos dados do usuário.
 * Próximo passo: trocar por IA de verdade via backend próprio (nunca com chave de API dentro do app).
 */
export function answer(question: string, data: FinanceData, today: DateStr = todayStr()): string {
  const q = normalize(question);
  const month = monthOf(today);
  const name = monthName(month);

  if (data.entries.length === 0 && data.accounts.length === 0) {
    return 'Ainda não tenho dados seus. Toque no + e lance sua renda e seus gastos fixos — em menos de um minuto eu já consigo prever o seu mês.';
  }

  if (q.includes('sobra') || q.includes('este mes') || q.includes('esse mes')) {
    const s = monthSummary(data, month);
    if (s.net >= 0) {
      return `Em ${name} entram ${formatBRL(s.income)} e saem ${formatBRL(s.expense)}. Devem sobrar ${formatBRL(s.net)}. 🎯`;
    }
    return `Atenção: em ${name} os gastos previstos (${formatBRL(s.expense)}) passam da renda (${formatBRL(s.income)}). Faltam ${formatBRL(-s.net)}. Quer que eu mostre onde dá para cortar?`;
  }

  if (q.includes('gast') && (q.includes('mais') || q.includes('maior') || q.includes('onde'))) {
    const top = spendingByCategory(data, month).slice(0, 3);
    if (top.length === 0) return `Ainda não vi gastos em ${name}.`;
    const lines = top.map((c) => `• ${CATEGORIES[c.category].title}: ${formatBRL(c.total)}`).join('\n');
    return `Seus maiores gastos em ${name}:\n${lines}`;
  }

  if (q.includes('proxim') || q.includes('previs') || q.includes('futuro')) {
    const lines = monthsSummary(data, month, 4)
      .map((m) => `• ${capitalize(monthName(m.month))}: ${formatBRL(m.net, { signed: true })}`)
      .join('\n');
    return `Previsão do que sobra:\n${lines}`;
  }

  if (q.includes('assinatura')) {
    const subs = recurringExpenses(data).filter((e) => e.category === 'subscriptions');
    if (subs.length === 0) {
      return 'Não encontrei assinaturas. Lance como "Todo mês" na categoria Assinaturas que eu acompanho.';
    }
    const total = subs.reduce((sum, e) => sum + e.amount, 0);
    return `Você paga ${formatBRL(total)} por mês em assinaturas (${subs.map((e) => e.title).join(', ')}). Em um ano, isso dá ${formatBRL(total * 12)}.`;
  }

  if (q.includes('cartao') || q.includes('fatura') || q.includes('limite')) {
    if (data.cards.length === 0) return 'Você ainda não cadastrou cartões. Vá em Início → Cartões.';
    return data.cards
      .map((card) => {
        const invoice = invoiceTotal(data, card, openInvoiceMonth(card, today));
        const free = card.limit - usedLimit(data, card, today);
        return `• ${card.name}: fatura de ${formatBRL(invoice)}, ${formatBRL(free)} de limite livre`;
      })
      .join('\n');
  }

  if (q.includes('comprar') || q.includes('posso') || q.includes('simul')) {
    return 'Abra o Raio-X e use o simulador "Posso comprar?": eu mostro mês a mês quanto a compra tira do que ia sobrar.';
  }

  if (q.includes('saldo') || q.includes('conta')) {
    return `Seu saldo somado nas contas é ${formatBRL(balance(data, today))}.`;
  }

  return 'Posso te dizer quanto vai sobrar, onde você mais gasta, como estão os próximos meses, suas assinaturas e seus cartões. O que quer saber?';
}
