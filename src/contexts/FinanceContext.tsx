import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Category, Transaction, MonthlyGoal, UserProfile, CreditCard } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  goal: MonthlyGoal;
  cards: CreditCard[];
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
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (card: CreditCard) => void;
  deleteCard: (id: string) => void;
  importCardTransactions: (cardId: string, txs: Omit<Transaction, 'id'>[]) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, updateUser } = useAuth();

  const transactions = currentUser?.transactions || [];
  const categories = currentUser?.categories || [];
  const goal = currentUser?.goal || { month: '', amount: 0 };
  const cards = currentUser?.cards || [];
  const theme = currentUser?.theme || 'light';
  const profile: UserProfile = useMemo(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar,
  }), [currentUser]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    updateUser({ transactions: [...transactions, { ...tx, id: `tx-${Date.now()}` }] });
  }, [transactions, updateUser]);

  const updateTransaction = useCallback((tx: Transaction) => {
    updateUser({ transactions: transactions.map(t => t.id === tx.id ? tx : t) });
  }, [transactions, updateUser]);

  const deleteTransaction = useCallback((id: string) => {
    updateUser({ transactions: transactions.filter(t => t.id !== id) });
  }, [transactions, updateUser]);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    updateUser({ categories: [...categories, { ...cat, id: `cat-${Date.now()}` }] });
  }, [categories, updateUser]);

  const updateCategory = useCallback((cat: Category) => {
    updateUser({ categories: categories.map(c => c.id === cat.id ? cat : c) });
  }, [categories, updateUser]);

  const deleteCategory = useCallback((id: string) => {
    updateUser({ categories: categories.filter(c => c.id !== id) });
  }, [categories, updateUser]);

  const setGoal = useCallback((g: MonthlyGoal) => {
    updateUser({ goal: g });
  }, [updateUser]);

  const setProfile = useCallback((p: UserProfile) => {
    updateUser({ name: p.name, email: p.email, avatar: p.avatar });
  }, [updateUser]);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    updateUser({ theme: t });
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, [updateUser]);

  const addCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    updateUser({ cards: [...cards, { ...card, id: `card-${Date.now()}` }] });
  }, [cards, updateUser]);

  const updateCard = useCallback((card: CreditCard) => {
    updateUser({ cards: cards.map(c => c.id === card.id ? card : c) });
  }, [cards, updateUser]);

  const deleteCard = useCallback((id: string) => {
    updateUser({
      cards: cards.filter(c => c.id !== id),
      transactions: transactions.filter(t => t.cardId !== id),
    });
  }, [cards, transactions, updateUser]);

  const importCardTransactions = useCallback((cardId: string, txs: Omit<Transaction, 'id'>[]) => {
    const newTxs = txs.map((tx, i) => ({ ...tx, id: `tx-${Date.now()}-${i}`, cardId }));
    updateUser({ transactions: [...transactions, ...newTxs] });
  }, [transactions, updateUser]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, goal, cards, profile, theme,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      setGoal, setProfile, setTheme,
      addCard, updateCard, deleteCard, importCardTransactions,
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
