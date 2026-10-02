import { describe, expect, it } from '@jest/globals';

import { addMonthsDate, addMonthsKey, monthsBetween } from '../dates';
import {
  balance,
  invoiceMonth,
  monthsSummary,
  projectedBalances,
  remainingNet,
  spendingByCategory,
  usedLimit,
} from '../engine';
import { buildEntries } from '../factory';
import { formatBRL, splitInstallments } from '../money';
import type { CreditCard, FinanceData } from '../types';
import { analyze } from '../xray';

const card: CreditCard = {
  id: 'c1',
  name: 'Cartão',
  limit: 500000,
  closingDay: 3,
  dueDay: 10,
  color: '#000',
  createdAt: 0,
};

function data(partial: Partial<FinanceData> = {}): FinanceData {
  return { entries: [], accounts: [], cards: [card], ...partial };
}

describe('datas', () => {
  it('soma meses ajustando o fim do mês', () => {
    expect(addMonthsDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsDate('2027-12-15', 2)).toBe('2028-02-15');
    expect(addMonthsKey('2026-11', 3)).toBe('2027-02');
    expect(monthsBetween('2026-10', '2027-01')).toBe(3);
  });
});

describe('dinheiro', () => {
  it('formata em reais', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(-5)).toBe('-R$ 0,05');
    expect(formatBRL(100, { signed: true })).toBe('+R$ 1,00');
  });

  it('divide parcelas sem perder centavos', () => {
    const parts = splitInstallments(100000, 3);
    expect(parts).toEqual([33333, 33333, 33334]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100000);
  });
});

describe('fatura do cartão', () => {
  it('compra antes do fechamento vence no mesmo mês', () => {
    expect(invoiceMonth(card, '2026-10-02')).toBe('2026-10');
  });

  it('compra depois do fechamento vai para a fatura seguinte', () => {
    expect(invoiceMonth(card, '2026-10-04')).toBe('2026-11');
  });

  it('vencimento antes do fechamento empurra para o mês seguinte', () => {
    const late = { ...card, closingDay: 25, dueDay: 5 };
    expect(invoiceMonth(late, '2026-10-20')).toBe('2026-11');
    expect(invoiceMonth(late, '2026-10-26')).toBe('2026-12');
  });
});

describe('previsão', () => {
  const today = '2026-10-15';

  it('soma recorrentes em todos os meses e compras do cartão no mês da fatura', () => {
    const entries = [
      ...buildEntries({ title: 'Salário', amount: 500000, kind: 'income', category: 'salary', date: '2026-09-05', recurring: true }),
      ...buildEntries({ title: 'Aluguel', amount: 200000, kind: 'expense', category: 'home', date: '2026-09-08', recurring: true }),
      ...buildEntries({ title: 'Tênis', amount: 60000, kind: 'expense', category: 'shopping', date: '2026-10-10', installments: 3, cardId: 'c1' }),
    ];
    const months = monthsSummary(data({ entries }), '2026-10', 4);
    // Compra em 10/out (depois do fechamento dia 3) vence em novembro.
    expect(months.map((m) => m.net)).toEqual([300000, 280000, 280000, 280000]);
  });

  it('simula uma compra parcelada', () => {
    const entries = buildEntries({ title: 'Salário', amount: 300000, kind: 'income', category: 'salary', date: '2026-10-01', recurring: true });
    const months = monthsSummary(data({ entries }), '2026-10', 3, { amount: 90000, installments: 2, startMonth: '2026-10' });
    expect(months.map((m) => m.expense)).toEqual([45000, 45000, 0]);
  });

  it('calcula saldo atual e o que ainda falta acontecer no mês', () => {
    const accounts = [{ id: 'a1', name: 'Conta', openingBalance: 100000, color: '#000', createdAt: 0 }];
    const entries = [
      ...buildEntries({ title: 'Salário', amount: 500000, kind: 'income', category: 'salary', date: '2026-09-05', recurring: true, accountId: 'a1' }),
      ...buildEntries({ title: 'Luz', amount: 20000, kind: 'expense', category: 'bills', date: '2026-10-20', accountId: 'a1' }),
      ...buildEntries({ title: 'Mercado', amount: 30000, kind: 'expense', category: 'groceries', date: '2026-10-01', cardId: 'c1' }),
    ];
    const d = data({ accounts, entries });
    // Dois salários já caíram (set e out); cartão não mexe no saldo.
    expect(balance(d, today)).toBe(1100000);
    // Ainda vêm a luz (20/out) e a fatura de outubro.
    expect(remainingNet(d, today)).toBe(-50000);
    const months = monthsSummary(d, '2026-10', 2);
    expect(projectedBalances(d, months, today)).toEqual([1050000, 1550000]);
  });

  it('conta o limite usado pelas parcelas futuras', () => {
    const entries = buildEntries({ title: 'TV', amount: 300000, kind: 'expense', category: 'shopping', date: '2026-10-01', installments: 3, cardId: 'c1' });
    expect(usedLimit(data({ entries }), card, today)).toBe(200000);
  });

  it('agrupa gastos por categoria no mês da compra', () => {
    const entries = [
      ...buildEntries({ title: 'iFood', amount: 5000, kind: 'expense', category: 'food', date: '2026-10-02' }),
      ...buildEntries({ title: 'Bar', amount: 8000, kind: 'expense', category: 'leisure', date: '2026-10-03' }),
      ...buildEntries({ title: 'Jantar', amount: 7000, kind: 'expense', category: 'food', date: '2026-10-04' }),
    ];
    expect(spendingByCategory(data({ entries }), '2026-10')).toEqual([
      { category: 'food', total: 12000 },
      { category: 'leisure', total: 8000 },
    ]);
  });
});

describe('raio-x', () => {
  it('avisa quando um mês futuro vai fechar negativo', () => {
    const entries = [
      ...buildEntries({ title: 'Salário', amount: 300000, kind: 'income', category: 'salary', date: '2026-10-01', recurring: true }),
      ...buildEntries({ title: 'IPVA', amount: 500000, kind: 'expense', category: 'transport', date: '2026-12-10' }),
    ];
    const report = analyze(data({ entries }), '2026-10-15');
    expect(report.insights.map((i) => i.id)).toContain('future-negative');
  });
});
