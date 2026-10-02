import type { DateStr, MonthKey } from './types';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateStr(date: Date): DateStr {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayStr(now: Date = new Date()): DateStr {
  return toDateStr(now);
}

function parts(date: DateStr) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthOf(date: DateStr): MonthKey {
  return date.slice(0, 7);
}

export function dayOf(date: DateStr): number {
  return parts(date).d;
}

export function makeDate(month: MonthKey, day: number): DateStr {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${pad(Math.min(Math.max(day, 1), daysInMonth(y, m)))}`;
}

export function addMonthsKey(month: MonthKey, count: number): MonthKey {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + count;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** Quantos meses de `from` até `to` (pode ser negativo). */
export function monthsBetween(from: MonthKey, to: MonthKey): number {
  const [y1, m1] = from.split('-').map(Number);
  const [y2, m2] = to.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

/** Soma meses a uma data, ajustando o dia ao fim do mês (31/jan + 1 mês = 28 ou 29/fev). */
export function addMonthsDate(date: DateStr, count: number): DateStr {
  return makeDate(addMonthsKey(monthOf(date), count), dayOf(date));
}

export function addDays(date: DateStr, count: number): DateStr {
  const { y, m, d } = parts(date);
  return toDateStr(new Date(y, m - 1, d + count));
}

export function monthName(month: MonthKey): string {
  return MONTHS[Number(month.slice(5, 7)) - 1];
}

export function shortMonthName(month: MonthKey): string {
  return monthName(month).slice(0, 3);
}

export function monthYear(month: MonthKey): string {
  return `${monthName(month)} de ${month.slice(0, 4)}`;
}

/** "05 out" */
export function dayMonth(date: DateStr): string {
  return `${pad(dayOf(date))} ${shortMonthName(monthOf(date))}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
