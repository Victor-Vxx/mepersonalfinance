import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, Transaction, MonthlyGoal, UserProfile } from '@/types/finance';
import { defaultCategories, defaultTransactions, defaultGoal } from '@/data/mock-data';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  goal: MonthlyGoal;
  profile: UserProfile;
  theme: 'light' | 'dark';
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  setGoal: (goal: MonthlyGoal) => void;
  setProfile: (profile: UserProfile) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage('fin_transactions', defaultTransactions)
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage('fin_categories', defaultCategories)
  );
  const [goal, setGoalState] = useState<MonthlyGoal>(() =>
    loadFromStorage('fin_goal', defaultGoal)
  );
  const [profile, setProfileState] = useState<UserProfile>(() =>
    loadFromStorage('fin_profile', { name: 'Usuário', email: 'usuario@email.com' })
  );
  const [theme, setThemeState] = useState<'light' | 'dark'>(() =>
    loadFromStorage('fin_theme', 'light')
  );

  useEffect(() => { localStorage.setItem('fin_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('fin_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('fin_goal', JSON.stringify(goal)); }, [goal]);
  useEffect(() => { localStorage.setItem('fin_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => {
    localStorage.setItem('fin_theme', JSON.stringify(theme));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...tx, id: `tx-${Date.now()}` }]);
  }, []);

  const updateTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...cat, id: `cat-${Date.now()}` }]);
  }, []);

  const updateCategory = useCallback((cat: Category) => {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const setGoal = useCallback((g: MonthlyGoal) => setGoalState(g), []);
  const setProfile = useCallback((p: UserProfile) => setProfileState(p), []);
  const setTheme = useCallback((t: 'light' | 'dark') => setThemeState(t), []);

  const logout = useCallback(() => {
    localStorage.removeItem('fin_transactions');
    localStorage.removeItem('fin_categories');
    localStorage.removeItem('fin_goal');
    localStorage.removeItem('fin_profile');
    localStorage.removeItem('fin_theme');
    setTransactions(defaultTransactions);
    setCategories(defaultCategories);
    setGoalState(defaultGoal);
    setProfileState({ name: 'Usuário', email: 'usuario@email.com' });
    setThemeState('light');
  }, []);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, goal, profile, theme,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      setGoal, setProfile, setTheme, logout,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
