import { useState, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Moon, Download, LogOut, FileText, Lock, Camera } from 'lucide-react';
import { formatCurrency, sumByType, filterByPeriod } from '@/lib/finance-utils';
import { useToast } from '@/hooks/use-toast';
import { simpleHash, verifyPassword } from '@/lib/auth-utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function Ajustes() {
  const { profile, setProfile, theme, setTheme, transactions, categories, goal } = useFinance();
  const { currentUser, updateUser, logout: authLogout } = useAuth();
  const { toast } = useToast();

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    // Check email uniqueness
    const allUsers = JSON.parse(localStorage.getItem('fin_users') || '[]');
    const emailTaken = allUsers.some((u: any) => u.id !== currentUser?.id && u.email.toLowerCase() === email.toLowerCase());
    if (emailTaken) {
      toast({ title: 'Este email já está em uso.', variant: 'destructive' });
      return;
    }
    setProfile({ name, email, avatar: avatarPreview });
    if (avatarPreview !== currentUser?.avatar) {
      updateUser({ avatar: avatarPreview });
    }
    setProfileOpen(false);
    toast({ title: 'Perfil atualizado com sucesso!' });
  };

  const handleChangePassword = () => {
    setPasswordError('');
    if (!currentUser) return;
    if (!verifyPassword(currentPassword, currentUser.passwordHash)) {
      setPasswordError('Senha atual incorreta.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }
    updateUser({ passwordHash: simpleHash(newPassword) });
    setPasswordOpen(false);
    setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    toast({ title: 'Senha alterada com sucesso!' });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const txData = transactions.map(t => ({
      Data: format(new Date(t.date), 'dd/MM/yyyy'),
      Tipo: t.type === 'receita' ? 'Receita' : 'Despesa',
      Categoria: categories.find(c => c.id === t.categoryId)?.name || 'Outros',
      Descrição: t.description,
      Valor: t.amount,
    }));
    const ws1 = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Transações');

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

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cover
    doc.setFontSize(24);
    doc.text('Relatório Financeiro', pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text(profile.name, pageWidth / 2, 55, { align: 'center' });
    doc.setFontSize(10);
    doc.text(profile.email, pageWidth / 2, 63, { align: 'center' });
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 71, { align: 'center' });

    // Summary
    const currentTxs = filterByPeriod(transactions, 'this-month');
    const totalIncome = sumByType(currentTxs, 'receita');
    const totalExpenses = sumByType(currentTxs, 'despesa');
    const balance = totalIncome - totalExpenses;
    const goalPercent = goal.amount > 0 ? Math.round((totalExpenses / goal.amount) * 100) : 0;
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

    doc.setFontSize(16);
    doc.text('Resumo Financeiro', 14, 95);
    doc.setFontSize(11);
    const summaryLines = [
      `Total Receitas: ${formatCurrency(totalIncome)}`,
      `Total Despesas: ${formatCurrency(totalExpenses)}`,
      `Saldo: ${formatCurrency(balance)}`,
      `Meta: ${goalPercent}%`,
      `Taxa de Economia: ${savingsRate}%`,
    ];
    summaryLines.forEach((line, i) => doc.text(line, 14, 105 + i * 8));

    // Capture charts from DOM
    const chartElements = document.querySelectorAll('[data-pdf-chart]');
    let yPos = 150;
    for (const el of Array.from(chartElements)) {
      try {
        const canvas = await html2canvas(el as HTMLElement, { backgroundColor: null, scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        if (yPos + imgHeight > 280) {
          doc.addPage();
          yPos = 14;
        }
        doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      } catch {
        // skip chart if capture fails
      }
    }

    // Transactions table
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Transações', 14, 20);
    doc.setFontSize(9);
    let ty = 30;
    const recentTxs = [...currentTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    recentTxs.forEach(tx => {
      if (ty > 280) { doc.addPage(); ty = 14; }
      const cat = categories.find(c => c.id === tx.categoryId)?.name || 'Outros';
      doc.text(`${format(new Date(tx.date), 'dd/MM/yyyy')}  |  ${tx.type === 'receita' ? 'Receita' : 'Despesa'}  |  ${cat}  |  ${tx.description}  |  ${formatCurrency(tx.amount)}`, 14, ty);
      ty += 6;
    });

    doc.save(`relatorio_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Relatório em PDF exportado com sucesso.' });
  };

  const handleLogout = () => {
    authLogout();
    setLogoutOpen(false);
  };

  const menuItems = [
    { icon: User, label: 'Editar Perfil', desc: profile.name, onClick: () => { setName(profile.name); setEmail(profile.email); setAvatarPreview(currentUser?.avatar || ''); setProfileOpen(true); } },
    { icon: Lock, label: 'Alterar Senha', desc: 'Mudar sua senha', onClick: () => { setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPasswordError(''); setPasswordOpen(true); } },
    { icon: Moon, label: 'Tema Escuro', desc: theme === 'dark' ? 'Ativado' : 'Desativado', toggle: true },
    { icon: Download, label: 'Exportar Excel', desc: 'Baixar dados em .xlsx', onClick: handleExportExcel },
    { icon: FileText, label: 'Exportar PDF', desc: 'Relatório com gráficos', onClick: handleExportPDF },
    { icon: LogOut, label: 'Sair', desc: 'Encerrar sessão', onClick: () => setLogoutOpen(true), destructive: true },
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
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-nav-active text-nav-active-foreground text-2xl">{name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-3 w-3" /> Alterar foto
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
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

      {/* Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Senha Atual</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
            <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
            <div><Label>Confirmar Nova Senha</Label><Input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} /></div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair</DialogTitle>
            <DialogDescription>Deseja encerrar sua sessão?</DialogDescription>
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
