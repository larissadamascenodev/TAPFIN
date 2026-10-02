import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CategoryId, EntryKind } from './types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface CategoryInfo {
  id: CategoryId;
  title: string;
  icon: IconName;
  color: string;
  kind: EntryKind;
}

const INCOME_GREEN = '#5CE685';

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  food: { id: 'food', title: 'Alimentação', icon: 'fast-food', color: '#FF8A3D', kind: 'expense' },
  groceries: { id: 'groceries', title: 'Mercado', icon: 'cart', color: '#FFC53D', kind: 'expense' },
  transport: { id: 'transport', title: 'Transporte', icon: 'car', color: '#4D8DFF', kind: 'expense' },
  home: { id: 'home', title: 'Casa', icon: 'home', color: '#B07CFF', kind: 'expense' },
  bills: { id: 'bills', title: 'Contas', icon: 'flash', color: '#FFE14D', kind: 'expense' },
  health: { id: 'health', title: 'Saúde', icon: 'medkit', color: '#FF5C7A', kind: 'expense' },
  leisure: { id: 'leisure', title: 'Lazer', icon: 'film', color: '#FF66C4', kind: 'expense' },
  shopping: { id: 'shopping', title: 'Compras', icon: 'bag-handle', color: '#3DD6FF', kind: 'expense' },
  subscriptions: { id: 'subscriptions', title: 'Assinaturas', icon: 'repeat', color: '#9B8CFF', kind: 'expense' },
  education: { id: 'education', title: 'Educação', icon: 'book', color: '#5CE1A6', kind: 'expense' },
  travel: { id: 'travel', title: 'Viagem', icon: 'airplane', color: '#3DA9FF', kind: 'expense' },
  pets: { id: 'pets', title: 'Pets', icon: 'paw', color: '#D9A066', kind: 'expense' },
  other: { id: 'other', title: 'Outros', icon: 'apps', color: '#9DA3AE', kind: 'expense' },
  salary: { id: 'salary', title: 'Salário', icon: 'cash', color: INCOME_GREEN, kind: 'income' },
  freelance: { id: 'freelance', title: 'Freela', icon: 'briefcase', color: INCOME_GREEN, kind: 'income' },
  investments: { id: 'investments', title: 'Rendimentos', icon: 'trending-up', color: INCOME_GREEN, kind: 'income' },
  extraIncome: { id: 'extraIncome', title: 'Extra', icon: 'sparkles', color: INCOME_GREEN, kind: 'income' },
};

export function categoriesFor(kind: EntryKind): CategoryInfo[] {
  return Object.values(CATEGORIES).filter((c) => c.kind === kind);
}

export const KIND_TITLE: Record<EntryKind, string> = {
  expense: 'Gasto',
  income: 'Receita',
};
