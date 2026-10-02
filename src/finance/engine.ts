import { addMonthsDate, addMonthsKey, dayOf, makeDate, monthOf, monthsBetween, todayStr } from './dates';
import type {
  Account,
  CategoryId,
  CreditCard,
  DateStr,
  Entry,
  FinanceData,
  MonthKey,
  MonthSummary,
  SimulatedPurchase,
} from './types';

// Toda a matemática financeira do app: funções puras sobre os lançamentos,
// reaproveitadas pela Início, Previsão, Raio-X e pelo Fin (e cobertas por testes).

export type Mood = 'neutral' | 'healthy' | 'tight' | 'negative';

const signed = (entry: Entry) => (entry.kind === 'income' ? entry.amount : -entry.amount);

function cardOf(entry: Entry, data: FinanceData): CreditCard | undefined {
  return entry.cardId ? data.cards.find((c) => c.id === entry.cardId) : undefined;
}

// MARK: Cartão

/**
 * Mês de vencimento da fatura que contém uma compra feita em `date`.
 * Compras depois do fechamento entram na fatura seguinte.
 */
export function invoiceMonth(card: CreditCard, date: DateStr): MonthKey {
  let closingMonth = monthOf(date);
  if (dayOf(date) > card.closingDay) closingMonth = addMonthsKey(closingMonth, 1);
  return card.dueDay > card.closingDay ? closingMonth : addMonthsKey(closingMonth, 1);
}

/** Mês em que o lançamento sai (ou entra) no caixa. */
export function cashMonth(entry: Entry, data: FinanceData): MonthKey {
  const card = entry.kind === 'expense' ? cardOf(entry, data) : undefined;
  return card ? invoiceMonth(card, entry.date) : monthOf(entry.date);
}

export function occursInCashMonth(entry: Entry, month: MonthKey, data: FinanceData): boolean {
  const base = cashMonth(entry, data);
  return entry.recurring ? month >= base : month === base;
}

// MARK: Fluxo de caixa

/** Receitas x gastos de `count` meses a partir de `start`: a base da previsão do que vai sobrar. */
export function monthsSummary(
  data: FinanceData,
  start: MonthKey,
  count: number,
  simulation?: SimulatedPurchase,
): MonthSummary[] {
  const result: MonthSummary[] = Array.from({ length: count }, (_, i) => ({
    month: addMonthsKey(start, i),
    income: 0,
    expense: 0,
    net: 0,
  }));

  for (const entry of data.entries) {
    const base = cashMonth(entry, data);
    for (const month of result) {
      const hits = entry.recurring ? month.month >= base : month.month === base;
      if (!hits) continue;
      if (entry.kind === 'income') month.income += entry.amount;
      else month.expense += entry.amount;
    }
  }

  if (simulation && simulation.amount > 0 && simulation.installments > 0) {
    const part = Math.round(simulation.amount / simulation.installments);
    for (const month of result) {
      const offset = monthsBetween(simulation.startMonth, month.month);
      if (offset >= 0 && offset < simulation.installments) month.expense += part;
    }
  }

  for (const month of result) month.net = month.income - month.expense;
  return result;
}

export function monthSummary(data: FinanceData, month: MonthKey): MonthSummary {
  return monthsSummary(data, month, 1)[0];
}

/** Fração da renda comprometida com gastos (0…1+). */
export function commitment(summary: MonthSummary): number {
  if (summary.income <= 0) return summary.expense > 0 ? 1 : 0;
  return summary.expense / summary.income;
}

// MARK: Saldo

/** Quantas vezes o lançamento já aconteceu até `today` (recorrentes contam uma vez por mês). */
export function occurrenceCount(entry: Entry, today: DateStr): number {
  if (entry.date > today) return 0;
  if (!entry.recurring) return 1;
  let count = 0;
  while (count < 600 && addMonthsDate(entry.date, count) <= today) count += 1;
  return count;
}

/** Saldo das contas: saldo inicial + lançamentos já ocorridos fora do cartão. */
export function balance(data: FinanceData, today: DateStr = todayStr(), accountId?: string): number {
  const accounts = accountId ? data.accounts.filter((a) => a.id === accountId) : data.accounts;
  const opening = accounts.reduce((sum, a) => sum + a.openingBalance, 0);
  const moved = data.entries
    .filter((e) => !e.cardId && (accountId ? e.accountId === accountId : true))
    .reduce((sum, e) => sum + signed(e) * occurrenceCount(e, today), 0);
  return opening + moved;
}

/** O que do mês atual ainda vai acontecer: agendados, recorrentes futuros e faturas do mês. */
export function remainingNet(data: FinanceData, today: DateStr = todayStr()): number {
  const month = monthOf(today);
  let total = 0;
  for (const entry of data.entries) {
    if (!occursInCashMonth(entry, month, data)) continue;
    if (entry.kind === 'expense' && entry.cardId) {
      // Cartão não mexe no saldo até a fatura: entra inteiro no mês do vencimento.
      total += signed(entry);
      continue;
    }
    const occurrence = entry.recurring
      ? addMonthsDate(entry.date, monthsBetween(monthOf(entry.date), month))
      : entry.date;
    if (occurrence > today) total += signed(entry);
  }
  return total;
}

/** Saldo projetado ao fim de cada mês da previsão. */
export function projectedBalances(data: FinanceData, months: MonthSummary[], today: DateStr = todayStr()): number[] {
  let running = balance(data, today);
  return months.map((month, index) => {
    running += index === 0 && month.month === monthOf(today) ? remainingNet(data, today) : month.net;
    return running;
  });
}

// MARK: Gastos

export interface CategoryTotal {
  category: CategoryId;
  total: number;
}

/** Gastos por categoria no mês da compra (é o que a pessoa sente, não o mês da fatura). */
export function spendingByCategory(data: FinanceData, month: MonthKey): CategoryTotal[] {
  const totals = new Map<CategoryId, number>();
  for (const entry of data.entries) {
    if (entry.kind !== 'expense') continue;
    const base = monthOf(entry.date);
    const hits = entry.recurring ? month >= base : month === base;
    if (hits) totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function recurringExpenses(data: FinanceData): Entry[] {
  return data.entries.filter((e) => e.recurring && e.kind === 'expense');
}

/** Parcelas que ainda vão vencer (a partir do mês atual). */
export function remainingInstallments(data: FinanceData, today: DateStr = todayStr()): Entry[] {
  const current = monthOf(today);
  return data.entries.filter((e) => e.installment && cashMonth(e, data) >= current);
}

export function installmentGroups(entries: Entry[]): number {
  return new Set(entries.map((e) => e.installment?.groupId).filter(Boolean)).size;
}

// MARK: Faturas

export function invoiceTotal(data: FinanceData, card: CreditCard, month: MonthKey): number {
  return data.entries
    .filter((e) => e.cardId === card.id && e.kind === 'expense' && occursInCashMonth(e, month, data))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function invoiceEntries(data: FinanceData, card: CreditCard, month: MonthKey): Entry[] {
  return data.entries.filter(
    (e) => e.cardId === card.id && e.kind === 'expense' && occursInCashMonth(e, month, data),
  );
}

/** Fatura aberta hoje (a próxima a vencer). */
export function openInvoiceMonth(card: CreditCard, today: DateStr = todayStr()): MonthKey {
  return invoiceMonth(card, today);
}

/** Limite comprometido: fatura aberta + faturas futuras (parcelas) + recorrentes do mês. */
export function usedLimit(data: FinanceData, card: CreditCard, today: DateStr = todayStr()): number {
  const open = openInvoiceMonth(card, today);
  return data.entries
    .filter((e) => e.cardId === card.id && e.kind === 'expense')
    .reduce((sum, e) => {
      const base = cashMonth(e, data);
      if (e.recurring) return sum + (base <= open ? e.amount : 0);
      return sum + (base >= open ? e.amount : 0);
    }, 0);
}

export function totalOpenInvoices(data: FinanceData, today: DateStr = todayStr()): number {
  return data.cards.reduce((sum, card) => sum + invoiceTotal(data, card, openInvoiceMonth(card, today)), 0);
}

export function dueDate(card: CreditCard, month: MonthKey): DateStr {
  return makeDate(month, card.dueDay);
}

// MARK: Humor do mês (cor do gradiente da Início)

export function mood(summary: MonthSummary, hasData: boolean): Mood {
  if (!hasData) return 'neutral';
  if (summary.net < 0) return 'negative';
  if (commitment(summary) > 0.85) return 'tight';
  return 'healthy';
}

export function accountBalance(data: FinanceData, account: Account, today: DateStr = todayStr()): number {
  return balance(data, today, account.id);
}
