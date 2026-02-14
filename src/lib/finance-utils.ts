import { Transaction, Category, PeriodFilter } from '@/types/finance';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getDateRange(filter: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  switch (filter) {
    case 'this-month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last-month': {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case 'last-3-months':
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
  }
}

export function filterByPeriod(transactions: Transaction[], filter: PeriodFilter): Transaction[] {
  const { start, end } = getDateRange(filter);
  return transactions.filter(t => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start, end });
  });
}

export function getPreviousPeriodFilter(filter: PeriodFilter): PeriodFilter {
  // For comparison, we just shift back
  return filter; // simplified — we calculate manually in reports
}

export function sumByType(transactions: Transaction[], type: 'receita' | 'despesa'): number {
  return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

export function expensesByCategory(transactions: Transaction[], categories: Category[]) {
  const expenses = transactions.filter(t => t.type === 'despesa');
  const grouped: Record<string, number> = {};
  expenses.forEach(t => {
    grouped[t.categoryId] = (grouped[t.categoryId] || 0) + t.amount;
  });
  return Object.entries(grouped).map(([catId, value]) => {
    const cat = categories.find(c => c.id === catId);
    return {
      name: cat?.name || 'Outros',
      value,
      color: cat?.color || 'hsl(0,0%,50%)',
      categoryId: catId,
    };
  }).sort((a, b) => b.value - a.value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy');
}
