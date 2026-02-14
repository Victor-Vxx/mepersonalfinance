import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, filterByPeriod, sumByType, expensesByCategory, formatDate, getDateRange } from '@/lib/finance-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { format, parseISO, eachDayOfInterval, eachWeekOfInterval, isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodFilter } from '@/types/finance';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const periods: { value: PeriodFilter; label: string }[] = [
  { value: 'this-month', label: 'Esse Mês' },
  { value: 'last-month', label: 'Mês Passado' },
  { value: 'last-3-months', label: 'Últimos 3 Meses' },
];

export default function Relatorios() {
  const { transactions, categories } = useFinance();
  const [period, setPeriod] = useState<PeriodFilter>('this-month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState({ receitas: true, despesas: true, saldo: true });

  const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const income = useMemo(() => sumByType(filtered, 'receita'), [filtered]);
  const expenses = useMemo(() => sumByType(filtered, 'despesa'), [filtered]);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  // Previous period comparison
  const prevComparison = useMemo(() => {
    const now = new Date();
    let prevStart: Date, prevEnd: Date;
    switch (period) {
      case 'this-month':
        prevStart = startOfMonth(subMonths(now, 1));
        prevEnd = endOfMonth(subMonths(now, 1));
        break;
      case 'last-month':
        prevStart = startOfMonth(subMonths(now, 2));
        prevEnd = endOfMonth(subMonths(now, 2));
        break;
      case 'last-3-months':
        prevStart = startOfMonth(subMonths(now, 5));
        prevEnd = endOfMonth(subMonths(now, 3));
        break;
    }
    const prevTxs = transactions.filter(t => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start: prevStart, end: prevEnd });
    });
    const prevIncome = sumByType(prevTxs, 'receita');
    const prevExpenses = sumByType(prevTxs, 'despesa');
    return {
      incomeChange: prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0,
      expenseChange: prevExpenses > 0 ? Math.round(((expenses - prevExpenses) / prevExpenses) * 100) : 0,
    };
  }, [transactions, period, income, expenses]);

  // Pie data
  const pieData = useMemo(() => expensesByCategory(filtered, categories), [filtered, categories]);

  // Line chart data
  const lineData = useMemo(() => {
    const { start, end } = getDateRange(period);
    const actualEnd = end > new Date() ? new Date() : end;

    if (period === 'last-3-months') {
      const weeks = eachWeekOfInterval({ start, end: actualEnd }, { locale: ptBR });
      let accIncome = 0, accExpense = 0;
      return weeks.map(weekStart => {
        const wEnd = endOfWeek(weekStart);
        const weekTxs = filtered.filter(t => {
          const d = parseISO(t.date);
          return isWithinInterval(d, { start: weekStart, end: wEnd });
        });
        accIncome += weekTxs.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
        accExpense += weekTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
        return { label: format(weekStart, 'dd/MM', { locale: ptBR }), receitas: accIncome, despesas: accExpense, saldo: accIncome - accExpense };
      });
    }

    const days = eachDayOfInterval({ start, end: actualEnd });
    let accIncome = 0, accExpense = 0;
    return days.map(day => {
      const dayTxs = filtered.filter(t => isSameDay(parseISO(t.date), day));
      accIncome += dayTxs.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
      accExpense += dayTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
      return { label: format(day, 'dd', { locale: ptBR }), receitas: accIncome, despesas: accExpense, saldo: accIncome - accExpense };
    });
  }, [filtered, period]);

  // Bar chart monthly comparison
  const barData = useMemo(() => {
    const { start, end } = getDateRange(period);
    // Group by month
    const months: Record<string, { receitas: number; despesas: number }> = {};
    filtered.forEach(t => {
      const m = format(parseISO(t.date), 'MMM', { locale: ptBR });
      if (!months[m]) months[m] = { receitas: 0, despesas: 0 };
      if (t.type === 'receita') months[m].receitas += t.amount;
      else months[m].despesas += t.amount;
    });
    return Object.entries(months).map(([name, val]) => ({
      name,
      receitas: val.receitas,
      despesas: val.despesas,
      lucro: val.receitas - val.despesas,
    }));
  }, [filtered]);

  // Filtered transaction list
  const displayTxs = useMemo(() => {
    let txs = filtered;
    if (selectedCategory) txs = txs.filter(t => t.categoryId === selectedCategory);
    return [...txs].sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered, selectedCategory]);

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Outros';

  const handlePieClick = (data: any) => {
    setSelectedCategory(prev => prev === data.categoryId ? null : data.categoryId);
  };

  const toggleLine = (key: string) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      {/* Period Filter */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => { setPeriod(p.value); setSelectedCategory(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${period === p.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="finance-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" /> Receitas
            </div>
            <p className="text-lg font-bold text-[hsl(var(--finance-income))]">{formatCurrency(income)}</p>
            {prevComparison.incomeChange !== 0 && (
              <p className={`text-xs mt-1 ${prevComparison.incomeChange > 0 ? 'text-[hsl(var(--finance-income))]' : 'text-[hsl(var(--finance-expense))]'}`}>
                {prevComparison.incomeChange > 0 ? '▲' : '▼'} {Math.abs(prevComparison.incomeChange)}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="finance-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" /> Despesas
            </div>
            <p className="text-lg font-bold text-[hsl(var(--finance-expense))]">{formatCurrency(expenses)}</p>
            {prevComparison.expenseChange !== 0 && (
              <p className={`text-xs mt-1 ${prevComparison.expenseChange > 0 ? 'text-[hsl(var(--finance-expense))]' : 'text-[hsl(var(--finance-income))]'}`}>
                {prevComparison.expenseChange > 0 ? '▲' : '▼'} {Math.abs(prevComparison.expenseChange)}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="finance-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Wallet className="h-3 w-3" /> Saldo
            </div>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-[hsl(var(--finance-income))]' : 'text-[hsl(var(--finance-expense))]'}`}>{formatCurrency(balance)}</p>
          </CardContent>
        </Card>
        <Card className="finance-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <PiggyBank className="h-3 w-3" /> Economia
            </div>
            <p className={`text-lg font-bold ${savingsRate >= 0 ? 'text-[hsl(var(--finance-income))]' : 'text-[hsl(var(--finance-expense))]'}`}>{savingsRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <Card className="finance-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} onClick={handlePieClick} cursor="pointer"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={selectedCategory && selectedCategory !== entry.categoryId ? 0.3 : 1} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map(d => (
                    <button key={d.categoryId} onClick={() => setSelectedCategory(prev => prev === d.categoryId ? null : d.categoryId)}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-opacity ${selectedCategory && selectedCategory !== d.categoryId ? 'opacity-40' : ''}`}>
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">Sem dados para o período</div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="finance-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Evolução</CardTitle>
              <div className="flex gap-2">
                {(['receitas', 'despesas', 'saldo'] as const).map(key => (
                  <button key={key} onClick={() => toggleLine(key)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-opacity capitalize ${visibleLines[key] ? '' : 'opacity-30'}`}>
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                {visibleLines.receitas && <Line type="monotone" dataKey="receitas" stroke="hsl(152, 60%, 42%)" strokeWidth={2} dot={false} />}
                {visibleLines.despesas && <Line type="monotone" dataKey="despesas" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />}
                {visibleLines.saldo && <Line type="monotone" dataKey="saldo" stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="finance-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Comparativo Receita x Despesa</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={10} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {barData.length > 0 && (
            <div className="flex gap-4 mt-2 justify-center">
              {barData.map(d => (
                <span key={d.name} className={`text-xs font-medium ${d.lucro >= 0 ? 'text-[hsl(var(--finance-income))]' : 'text-[hsl(var(--finance-expense))]'}`}>
                  {d.name}: {d.lucro >= 0 ? 'Lucro' : 'Prejuízo'} {formatCurrency(Math.abs(d.lucro))}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="finance-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Transações {selectedCategory ? `— ${getCategoryName(selectedCategory)}` : ''}
            </CardTitle>
            {selectedCategory && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                <X className="h-3 w-3 mr-1" /> Limpar Filtro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {displayTxs.length > 0 ? (
            <div className="space-y-3">
              {displayTxs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{getCategoryName(tx.categoryId)} · {formatDate(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'receita' ? 'text-[hsl(var(--finance-income))]' : 'text-[hsl(var(--finance-expense))]'}`}>
                    {tx.type === 'receita' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
