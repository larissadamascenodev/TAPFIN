import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildEntries, uid, type EntryDraft } from './finance/factory';
import { sampleData } from './finance/sample';
import type { Account, CategoryId, CreditCard, Entry, FinanceData } from './finance/types';

interface AppState {
  hydrated: boolean;
  userName: string;
  hideValues: boolean;
  lastExpenseCategory: CategoryId;
  entries: Entry[];
  accounts: Account[];
  cards: CreditCard[];

  setUserName: (name: string) => void;
  toggleHideValues: () => void;
  addEntry: (draft: EntryDraft) => void;
  deleteEntry: (id: string) => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  deleteAccount: (id: string) => void;
  addCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => void;
  deleteCard: (id: string) => void;
  loadSample: () => void;
  resetAll: () => void;
}

const emptyData = { entries: [], accounts: [], cards: [] };

/** Todo o estado do app. Fica salvo só no aparelho (AsyncStorage). */
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      userName: '',
      hideValues: false,
      lastExpenseCategory: 'food',
      ...emptyData,

      setUserName: (userName) => set({ userName: userName.trim() }),
      toggleHideValues: () => set((s) => ({ hideValues: !s.hideValues })),

      addEntry: (draft) =>
        set((s) => ({
          entries: [...buildEntries(draft), ...s.entries],
          lastExpenseCategory: draft.kind === 'expense' ? draft.category : s.lastExpenseCategory,
        })),

      // Excluir uma parcela exclui a compra parcelada inteira.
      deleteEntry: (id) =>
        set((s) => {
          const target = s.entries.find((e) => e.id === id);
          const group = target?.installment?.groupId;
          return {
            entries: s.entries.filter((e) => e.id !== id && (!group || e.installment?.groupId !== group)),
          };
        }),

      addAccount: (account) =>
        set((s) => ({ accounts: [...s.accounts, { ...account, id: uid(), createdAt: Date.now() }] })),
      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          entries: s.entries.map((e) => (e.accountId === id ? { ...e, accountId: undefined } : e)),
        })),

      addCard: (card) => set((s) => ({ cards: [...s.cards, { ...card, id: uid(), createdAt: Date.now() }] })),
      deleteCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          entries: s.entries.map((e) => (e.cardId === id ? { ...e, cardId: undefined } : e)),
        })),

      loadSample: () =>
        set((s) => {
          const sample = sampleData();
          return {
            accounts: [...s.accounts, ...sample.accounts],
            cards: [...s.cards, ...sample.cards],
            entries: [...sample.entries, ...s.entries],
          };
        }),

      resetAll: () => set({ ...emptyData, userName: '', hideValues: false, lastExpenseCategory: 'food' }),
    }),
    {
      name: 'tapfin-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ userName, hideValues, lastExpenseCategory, entries, accounts, cards }) => ({
        userName,
        hideValues,
        lastExpenseCategory,
        entries,
        accounts,
        cards,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Contas, cartões e lançamentos juntos, no formato que o motor financeiro usa. */
export function useFinanceData(): FinanceData {
  const entries = useStore((s) => s.entries);
  const accounts = useStore((s) => s.accounts);
  const cards = useStore((s) => s.cards);
  return useMemo(() => ({ entries, accounts, cards }), [entries, accounts, cards]);
}
