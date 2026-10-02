import { addMonthsKey, makeDate, monthOf, todayStr } from './dates';
import { buildEntries, uid, type EntryDraft } from './factory';
import type { Account, CreditCard, DateStr, FinanceData } from './types';

/** Dados de exemplo para demonstrar o app (Ajustes → Carregar dados de exemplo). */
export function sampleData(today: DateStr = todayStr()): FinanceData {
  const month = monthOf(today);
  const day = (d: number, offset = 0) => makeDate(addMonthsKey(month, offset), d);
  const now = Date.now();

  const nubank: Account = { id: uid(), name: 'Nubank', openingBalance: 185000, color: '#8A05BE', createdAt: now };
  const inter: Account = { id: uid(), name: 'Inter', openingBalance: 420000, color: '#FF7A00', createdAt: now + 1 };
  const card: CreditCard = {
    id: uid(),
    name: 'Roxinho',
    limit: 1200000,
    closingDay: 3,
    dueDay: 10,
    color: '#8A05BE',
    createdAt: now,
  };

  const drafts: EntryDraft[] = [
    { title: 'Salário', amount: 750000, kind: 'income', category: 'salary', date: day(5, -1), recurring: true, accountId: nubank.id },
    { title: 'Aluguel', amount: 210000, kind: 'expense', category: 'home', date: day(8, -1), recurring: true, accountId: nubank.id },
    { title: 'Internet', amount: 11990, kind: 'expense', category: 'bills', date: day(15, -1), recurring: true, accountId: nubank.id },
    { title: 'Netflix', amount: 4490, kind: 'expense', category: 'subscriptions', date: day(12, -1), recurring: true, cardId: card.id },
    { title: 'Spotify', amount: 2190, kind: 'expense', category: 'subscriptions', date: day(20, -1), recurring: true, cardId: card.id },
    { title: 'Academia', amount: 12990, kind: 'expense', category: 'health', date: day(10, -1), recurring: true, accountId: inter.id },
    { title: 'iPhone', amount: 480000, kind: 'expense', category: 'shopping', date: day(2, -2), installments: 10, cardId: card.id },
    { title: 'Passagem Lisboa', amount: 320000, kind: 'expense', category: 'travel', date: day(1), installments: 6, cardId: card.id },
    { title: 'Mercado', amount: 61240, kind: 'expense', category: 'groceries', date: day(1), cardId: card.id },
    { title: 'iFood', amount: 8650, kind: 'expense', category: 'food', date: day(1), cardId: card.id },
    { title: 'Uber', amount: 3420, kind: 'expense', category: 'transport', date: day(1), accountId: nubank.id },
    { title: 'Restaurante', amount: 30000, kind: 'expense', category: 'food', date: day(1), accountId: nubank.id },
    { title: 'Freela site', amount: 180000, kind: 'income', category: 'freelance', date: day(25), accountId: inter.id },
    { title: 'Mercado', amount: 54000, kind: 'expense', category: 'groceries', date: day(6, -1), cardId: card.id },
    { title: 'Bar', amount: 18000, kind: 'expense', category: 'leisure', date: day(18, -1), accountId: nubank.id },
    { title: 'IPVA', amount: 145000, kind: 'expense', category: 'transport', date: day(10, 2), accountId: nubank.id },
  ];

  return {
    accounts: [nubank, inter],
    cards: [card],
    entries: drafts.flatMap((draft) => buildEntries(draft, now)),
  };
}
