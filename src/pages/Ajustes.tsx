import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User, Moon, Download, LogOut } from 'lucide-react';
import { formatCurrency, sumByType, filterByPeriod } from '@/lib/finance-utils';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function Ajustes() {
  const { profile, setProfile, theme, setTheme, transactions, categories, goal, logout } = useFinance();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const handleSaveProfile = () => {
    setProfile({ name, email });
    setProfileOpen(false);
    toast({ title: 'Perfil atualizado com sucesso!' });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1 - Transactions
    const txData = transactions.map(t => ({
      Data: format(new Date(t.date), 'dd/MM/yyyy'),
      Tipo: t.type === 'receita' ? 'Receita' : 'Despesa',
      Categoria: categories.find(c => c.id === t.categoryId)?.name || 'Outros',
      Descrição: t.description,
      Valor: t.amount,
    }));
    const ws1 = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Transações');

    // Sheet 2 - Summary
    const currentTxs = filterByPeriod(transactions, 'this-month');
    const totalIncome = sumByType(currentTxs, 'receita');
    const totalExpenses = sumByType(currentTxs, 'despesa');
    const balance = totalIncome - totalExpenses;
    const goalPercent = goal.amount > 0 ? Math.round((totalExpenses / goal.amount) * 100) : 0;
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

    const summaryData = [
      { Indicador: 'Total Receitas', Valor: totalIncome },
      { Indicador: 'Total Despesas', Valor: totalExpenses },
      { Indicador: 'Saldo', Valor: balance },
      { Indicador: '% Meta Gasto', Valor: `${goalPercent}%` },
      { Indicador: 'Taxa de Economia', Valor: `${savingsRate}%` },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumo');

    XLSX.writeFile(wb, `financas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: 'Arquivo exportado com sucesso!' });
  };

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    toast({ title: 'Sessão encerrada. Dados restaurados.' });
  };

  const menuItems = [
    { icon: User, label: 'Editar Perfil', desc: profile.name, onClick: () => { setName(profile.name); setEmail(profile.email); setProfileOpen(true); } },
    { icon: Moon, label: 'Tema Escuro', desc: theme === 'dark' ? 'Ativado' : 'Desativado', toggle: true },
    { icon: Download, label: 'Exportar Excel', desc: 'Baixar dados em .xlsx', onClick: handleExportExcel },
    { icon: LogOut, label: 'Sair', desc: 'Limpar dados da sessão', onClick: () => setLogoutOpen(true), destructive: true },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <Card key={i} className="finance-card cursor-pointer" onClick={item.toggle ? undefined : item.onClick}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.destructive ? 'text-destructive' : ''}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              {item.toggle && (
                <Switch checked={theme === 'dark'} onCheckedChange={c => setTheme(c ? 'dark' : 'light')} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProfile}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair</DialogTitle>
            <DialogDescription>Todos os dados serão restaurados para o padrão. Deseja continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleLogout}>Sair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
