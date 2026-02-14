import { Category, Transaction, MonthlyGoal } from '@/types/finance';
import { format, subDays, subMonths } from 'date-fns';

const today = new Date();
const currentMonth = format(today, 'yyyy-MM');
const lastMonth = format(subMonths(today, 1), 'yyyy-MM');

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Salário', icon: 'Briefcase', color: 'hsl(152, 60%, 42%)', type: 'receita' },
  { id: 'cat-2', name: 'Freelance', icon: 'Laptop', color: 'hsl(170, 55%, 40%)', type: 'receita' },
  { id: 'cat-3', name: 'Investimentos', icon: 'TrendingUp', color: 'hsl(200, 60%, 45%)', type: 'receita' },
  { id: 'cat-4', name: 'Alimentação', icon: 'UtensilsCrossed', color: 'hsl(0, 72%, 51%)', type: 'despesa' },
  { id: 'cat-5', name: 'Transporte', icon: 'Car', color: 'hsl(30, 80%, 50%)', type: 'despesa' },
  { id: 'cat-6', name: 'Moradia', icon: 'Home', color: 'hsl(260, 55%, 55%)', type: 'despesa' },
  { id: 'cat-7', name: 'Lazer', icon: 'Gamepad2', color: 'hsl(320, 60%, 50%)', type: 'despesa' },
  { id: 'cat-8', name: 'Saúde', icon: 'Heart', color: 'hsl(350, 70%, 55%)', type: 'despesa' },
  { id: 'cat-9', name: 'Educação', icon: 'GraduationCap', color: 'hsl(220, 70%, 50%)', type: 'despesa' },
  { id: 'cat-10', name: 'Compras', icon: 'ShoppingBag', color: 'hsl(38, 92%, 50%)', type: 'despesa' },
];

function generateTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  let id = 1;

  // Current month transactions
  txs.push(
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-1', description: 'Salário mensal', amount: 8500, date: format(new Date(today.getFullYear(), today.getMonth(), 5), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-2', description: 'Projeto website', amount: 2200, date: format(new Date(today.getFullYear(), today.getMonth(), 12), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-3', description: 'Dividendos', amount: 450, date: format(new Date(today.getFullYear(), today.getMonth(), 8), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-6', description: 'Aluguel', amount: 2800, date: format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-4', description: 'Supermercado', amount: 890, date: format(new Date(today.getFullYear(), today.getMonth(), 3), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-5', description: 'Combustível', amount: 320, date: format(new Date(today.getFullYear(), today.getMonth(), 6), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-7', description: 'Cinema e jantar', amount: 180, date: format(new Date(today.getFullYear(), today.getMonth(), 9), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-8', description: 'Plano de saúde', amount: 650, date: format(new Date(today.getFullYear(), today.getMonth(), 10), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-9', description: 'Curso online', amount: 197, date: format(new Date(today.getFullYear(), today.getMonth(), 7), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-10', description: 'Roupas', amount: 430, date: format(new Date(today.getFullYear(), today.getMonth(), 11), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-4', description: 'Restaurante', amount: 245, date: format(new Date(today.getFullYear(), today.getMonth(), 13), 'yyyy-MM-dd') },
  );

  // Last month transactions
  const lm = subMonths(today, 1);
  txs.push(
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-1', description: 'Salário mensal', amount: 8500, date: format(new Date(lm.getFullYear(), lm.getMonth(), 5), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-2', description: 'Consultoria', amount: 1800, date: format(new Date(lm.getFullYear(), lm.getMonth(), 15), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-6', description: 'Aluguel', amount: 2800, date: format(new Date(lm.getFullYear(), lm.getMonth(), 1), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-4', description: 'Supermercado', amount: 750, date: format(new Date(lm.getFullYear(), lm.getMonth(), 4), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-5', description: 'Uber', amount: 280, date: format(new Date(lm.getFullYear(), lm.getMonth(), 8), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-7', description: 'Show', amount: 350, date: format(new Date(lm.getFullYear(), lm.getMonth(), 20), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-8', description: 'Plano de saúde', amount: 650, date: format(new Date(lm.getFullYear(), lm.getMonth(), 10), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-10', description: 'Eletrônicos', amount: 1200, date: format(new Date(lm.getFullYear(), lm.getMonth(), 18), 'yyyy-MM-dd') },
  );

  // 2 months ago
  const m2 = subMonths(today, 2);
  txs.push(
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-1', description: 'Salário mensal', amount: 8200, date: format(new Date(m2.getFullYear(), m2.getMonth(), 5), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'receita', categoryId: 'cat-3', description: 'Rendimentos', amount: 380, date: format(new Date(m2.getFullYear(), m2.getMonth(), 12), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-6', description: 'Aluguel', amount: 2800, date: format(new Date(m2.getFullYear(), m2.getMonth(), 1), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-4', description: 'Supermercado', amount: 680, date: format(new Date(m2.getFullYear(), m2.getMonth(), 6), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-5', description: 'Combustível', amount: 350, date: format(new Date(m2.getFullYear(), m2.getMonth(), 10), 'yyyy-MM-dd') },
    { id: `tx-${id++}`, type: 'despesa', categoryId: 'cat-9', description: 'Livros', amount: 120, date: format(new Date(m2.getFullYear(), m2.getMonth(), 14), 'yyyy-MM-dd') },
  );

  return txs;
}

export const defaultTransactions = generateTransactions();

export const defaultGoal: MonthlyGoal = {
  month: currentMonth,
  amount: 6000,
};
