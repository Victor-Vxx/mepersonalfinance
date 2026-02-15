import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserAccount } from '@/types/finance';
import { simpleHash, verifyPassword } from '@/lib/auth-utils';
import { defaultCategories, defaultTransactions, defaultGoal } from '@/data/mock-data';

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (email: string, password: string) => string | null; // returns error or null
  register: (name: string, email: string, password: string) => string | null;
  logout: () => void;
  updateUser: (updates: Partial<UserAccount>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadUsers(): UserAccount[] {
  try {
    const stored = localStorage.getItem('fin_users');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem('fin_users', JSON.stringify(users));
}

function loadActiveUserId(): string | null {
  return localStorage.getItem('fin_active_user');
}

function saveActiveUserId(id: string | null) {
  if (id) localStorage.setItem('fin_active_user', id);
  else localStorage.removeItem('fin_active_user');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const id = loadActiveUserId();
    if (!id) return null;
    const all = loadUsers();
    return all.find(u => u.id === id) || null;
  });

  const persistUsers = useCallback((updated: UserAccount[]) => {
    setUsers(updated);
    saveUsers(updated);
  }, []);

  const login = useCallback((email: string, password: string): string | null => {
    const all = loadUsers();
    const user = all.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return 'Usuário não encontrado.';
    if (!verifyPassword(password, user.passwordHash)) return 'Senha incorreta.';
    setCurrentUser(user);
    saveActiveUserId(user.id);
    // Apply theme
    document.documentElement.classList.toggle('dark', user.theme === 'dark');
    return null;
  }, []);

  const register = useCallback((name: string, email: string, password: string): string | null => {
    const all = loadUsers();
    if (all.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return 'Este email já está cadastrado.';
    }
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: simpleHash(password),
      transactions: defaultTransactions,
      categories: defaultCategories,
      goal: defaultGoal,
      cards: [],
      theme: 'light',
    };
    const updated = [...all, newUser];
    persistUsers(updated);
    setCurrentUser(newUser);
    saveActiveUserId(newUser.id);
    document.documentElement.classList.remove('dark');
    return null;
  }, [persistUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    saveActiveUserId(null);
    document.documentElement.classList.remove('dark');
  }, []);

  const updateUser = useCallback((updates: Partial<UserAccount>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      const allUsers = loadUsers().map(u => u.id === updated.id ? updated : u);
      persistUsers(allUsers);
      return updated;
    });
  }, [persistUsers]);

  return (
    <AuthContext.Provider value={{ currentUser, users, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
