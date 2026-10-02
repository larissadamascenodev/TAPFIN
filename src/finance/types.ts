/** Data local no formato YYYY-MM-DD. */
export type DateStr = string;
/** Mês no formato YYYY-MM. */
export type MonthKey = string;

export type EntryKind = 'expense' | 'income';

export type CategoryId =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'home'
  | 'bills'
  | 'health'
  | 'leisure'
  | 'shopping'
  | 'subscriptions'
  | 'education'
  | 'travel'
  | 'pets'
  | 'other'
  | 'salary'
  | 'freelance'
  | 'investments'
  | 'extraIncome';

/** Um lançamento. Valores sempre em centavos e positivos; `kind` define o sinal. */
export interface Entry {
  id: string;
  title: string;
  amount: number;
  kind: EntryKind;
  category: CategoryId;
  date: DateStr;
  /** Repete todo mês a partir de `date`. */
  recurring: boolean;
  installment?: { number: number; total: number; groupId: string };
  accountId?: string;
  cardId?: string;
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  /** Saldo informado pelo usuário ao criar a conta, em centavos. */
  openingBalance: number;
  color: string;
  createdAt: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  createdAt: number;
}

export interface FinanceData {
  entries: Entry[];
  accounts: Account[];
  cards: CreditCard[];
}

export interface MonthSummary {
  month: MonthKey;
  income: number;
  expense: number;
  net: number;
}

/** Compra hipotética do simulador "Posso comprar?". */
export interface SimulatedPurchase {
  amount: number;
  installments: number;
  startMonth: MonthKey;
}
