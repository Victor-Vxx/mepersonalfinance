import { useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatMonthYear, sumByType, expensesByCategory, filterByPeriod, formatDate } from '@/lib/finance-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { transactions, categories, goal, setGoal } = useFinance();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalAmount, setGoalAmount] = useState(String(goal.amount));

  const now = new Date();
  const currentMonthLabel = formatMonthYear(now);

  const monthTxs = useMemo(() => filterByPeriod(transactions, 'this-month'), [transactions]);
  const income = useMemo(() => sumByType(monthTxs, 'receita'), [monthTxs]);
  const expenses = useMemo(() => sumByType(monthTxs, 'despesa'), [monthTxs]);
  const balance = income - expenses;

  const goalPercent = goal.amount > 0 ? Math.round((expenses / goal.amount) * 100) : 0;
  const goalColor = goalPercent >= 100 ? 'hsl(0, 72%, 51%)' : goalPercent >= 80 ? 'hsl(38, 92%, 50%)' : 'hsl(152, 60%, 42%)';

  const pieData = useMemo(() => expensesByCategory(monthTxs, categories), [monthTxs, categories]);

  const lineData = useMemo(() => {
    const start = startOfMonth(now);
    const end = new Date() > endOfMonth(now) ? endOfMonth(now) : now;
    const days = eachDayOfInterval({ start, end });
    let accIncome = 0, accExpense = 0;
    return days.map(day => {
      const dayTxs = monthTxs.filter(t => isSameDay(parseISO(t.date), day));
      accIncome += dayTxs.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
      accExpense += dayTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
      return { day: format(day, 'dd', { locale: ptBR }), receitas: accIncome, despesas: accExpense };
    });
  }, [monthTxs]);

  const barData = useMemo(() => [
    { name: 'Receitas', value: income, fill: 'hsl(152, 60%, 42%)' },
    { name: 'Despesas', value: expenses, fill: 'hsl(0, 72%, 51%)' },
  ], [income, expenses]);

  const recentTxs = useMemo(() =>
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions]
  );

  const handleSaveGoal = () => {
    setGoal({ month: format(now, 'yyyy-MM'), amount: Number(goalAmount) || 0 });
    setGoalDialogOpen(false);
  };

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Outros';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold capitalize">{currentMonthLabel}</h1>

      <Card className="finance-card bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
            <Wallet className="h-4 w-4" /> Saldo Atual
          </div>
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="finance-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--finance-income))]" /> Receitas
            </div>
            <p className="text-xl font-bold text-[hsl(var(--finance-income))]">{formatCurrency(income)}</p>
          </CardContent>
        </Card>
        <Card className="finance-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4 text-[hsl(var(--finance-expense))]" /> Despesas
            </div>
            <p className="text-xl font-bold text-[hsl(var(--finance-expense))]">{formatCurrency(expenses)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="finance-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium"><Target className="h-4 w-4" /> Meta Mensal</div>
            <Button variant="ghost" size="sm" onClick={() => { setGoalAmount(String(goal.amount)); setGoalDialogOpen(true); }}>Editar Meta</Button>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Gasto: {formatCurrency(expenses)}</span>
            <span>Meta: {formatCurrency(goal.amount)}</span>
          </div>
          <Progress value={Math.min(goalPercent, 100)} className="h-3" style={{ '--progress-color': goalColor } as any} />
          <p className="text-right text-sm mt-1 font-medium" style={{ color: goalColor }}>{goalPercent}%</p>
        </CardContent>
      </Card>

      {/* Charts with data-pdf-chart for PDF export */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="finance-card" data-pdf-chart>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Sem despesas neste mês</div>
            )}
          </CardContent>
        </Card>

        <Card className="finance-card" data-pdf-chart>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Evolução Mensal</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Line type="monotone" dataKey="receitas" stroke="hsl(152, 60%, 42%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="despesas" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="finance-card" data-pdf-chart>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Receita x Despesa</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={10} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="finance-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Últimas Transações</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          {recentTxs.length > 0 ? (
            <div className="space-y-3">
              {recentTxs.map(tx => (
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
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação registrada</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Meta Mensal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Valor da meta (R$)</Label><Input type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="0.00" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveGoal}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
