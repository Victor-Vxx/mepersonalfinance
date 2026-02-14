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
}

export interface MonthlyGoal {
  month: string; // YYYY-MM
  amount: number;
}

export interface UserProfile {
  name: string;
  email: string;
}

export type PeriodFilter = 'this-month' | 'last-month' | 'last-3-months';
