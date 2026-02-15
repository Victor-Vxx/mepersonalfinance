export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'receita' | 'despesa';
}

export interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  categoryId: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  cardId?: string; // linked credit card
}

export interface MonthlyGoal {
  month: string; // YYYY-MM
  amount: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string; // base64
}

export interface CreditCard {
  id: string;
  name: string;
  holder: string;
  dueDay: number; // day of month
  limit?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // simulated hash
  avatar?: string;
  transactions: Transaction[];
  categories: Category[];
  goal: MonthlyGoal;
  cards: CreditCard[];
  theme: 'light' | 'dark';
}

export type PeriodFilter = 'this-month' | 'last-month' | 'last-3-months';
