import { addMonthsDate, todayStr } from './dates';
import { splitInstallments } from './money';
import type { CategoryId, DateStr, Entry, EntryKind } from './types';

export interface EntryDraft {
  title: string;
  amount: number;
  kind: EntryKind;
  category: CategoryId;
  date?: DateStr;
  recurring?: boolean;
  installments?: number;
  accountId?: string;
  cardId?: string;
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Transforma um rascunho em lançamentos; compras parceladas viram uma entrada por parcela. */
export function buildEntries(draft: EntryDraft, now: number = Date.now()): Entry[] {
  const date = draft.date ?? todayStr();
  const count = draft.recurring ? 1 : Math.max(1, draft.installments ?? 1);
  const base = {
    title: draft.title,
    kind: draft.kind,
    category: draft.category,
    recurring: !!draft.recurring,
    accountId: draft.cardId ? undefined : draft.accountId,
    cardId: draft.kind === 'expense' ? draft.cardId : undefined,
    createdAt: now,
  };

  if (count === 1) {
    return [{ ...base, id: uid(), amount: draft.amount, date }];
  }

  const groupId = uid();
  return splitInstallments(draft.amount, count).map((amount, index) => ({
    ...base,
    id: uid(),
    amount,
    date: addMonthsDate(date, index),
    installment: { number: index + 1, total: count, groupId },
  }));
}

export function displayTitle(entry: Entry): string {
  return entry.installment
    ? `${entry.title} (${entry.installment.number}/${entry.installment.total})`
    : entry.title;
}
