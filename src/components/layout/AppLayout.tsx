import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Home, ArrowLeftRight, BarChart3, Settings, Plus, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function AppLayout() {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const { categories, addTransaction, addCard } = useFinance();
  const [fabOpen, setFabOpen] = useState(false);

  // Quick-add transaction dialog
  const [quickTxOpen, setQuickTxOpen] = useState(false);
  const [quickTxType, setQuickTxType] = useState<'receita' | 'despesa'>('despesa');
  const [txForm, setTxForm] = useState({ categoryId: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Quick-add card dialog
  const [quickCardOpen, setQuickCardOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', holder: '', dueDay: '10', limit: '' });

  const avatarInitial = currentUser?.name?.[0]?.toUpperCase() || 'U';
  const filteredCategories = categories.filter(c => c.type === quickTxType);

  const handleFabAction = (action: 'receita' | 'despesa' | 'cartao') => {
    setFabOpen(false);
    if (action === 'cartao') {
      setCardForm({ name: '', holder: '', dueDay: '10', limit: '' });
      setQuickCardOpen(true);
    } else {
      setQuickTxType(action);
      setTxForm({ categoryId: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      setQuickTxOpen(true);
    }
  };

  const handleSaveQuickTx = () => {
    addTransaction({ type: quickTxType, categoryId: txForm.categoryId, description: txForm.description, amount: Number(txForm.amount), date: txForm.date });
    setQuickTxOpen(false);
  };

  const handleSaveQuickCard = () => {
    addCard({ name: cardForm.name, holder: cardForm.holder, dueDay: Number(cardForm.dueDay), limit: cardForm.limit ? Number(cardForm.limit) : undefined });
    setQuickCardOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 items-center gap-2 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nav-active text-nav-active-foreground font-bold text-sm">
              F
            </div>
            <span className="text-lg font-bold text-sidebar-primary-foreground">FinançasPro</span>
          </div>

          {/* Avatar in sidebar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-sidebar-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-nav-active text-nav-active-foreground text-sm">{avatarInitial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-primary-foreground">{currentUser?.name}</p>
              <p className="text-xs truncate text-sidebar-foreground/60">{currentUser?.email}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-300 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-nav-active text-nav-active-foreground hover:bg-nav-active hover:text-nav-active-foreground"
              >
                <item.icon className="h-5 w-5 transition-transform duration-300" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 min-h-screen",
        !isMobile && "ml-60",
        isMobile && "pb-24"
      )}>
        {/* Mobile top bar with avatar */}
        {isMobile && (
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-nav-active text-nav-active-foreground text-xs">{avatarInitial}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{currentUser?.name}</span>
          </div>
        )}
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav with centered FAB */}
      {isMobile && (
        <>
          {/* FAB Menu Overlay */}
          {fabOpen && (
            <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setFabOpen(false)}>
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                style={{ animation: 'fabMenuIn 400ms ease-out' }}>
                <button onClick={(e) => { e.stopPropagation(); handleFabAction('receita'); }}
                  className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--finance-income))]" /> Receita
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleFabAction('despesa'); }}
                  className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105">
                  <TrendingDown className="h-4 w-4 text-[hsl(var(--finance-expense))]" /> Despesa
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleFabAction('cartao'); }}
                  className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105">
                  <CreditCard className="h-4 w-4 text-[hsl(var(--finance-info))]" /> Cartão
                </button>
              </div>
            </div>
          )}

          <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around border-t bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-2 pt-1">
            {navItems.slice(0, 2).map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-all duration-300 ease-in-out"
                activeClassName="text-nav-active scale-110">
                <item.icon className="h-5 w-5 transition-transform duration-300" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            ))}

            {/* Central FAB */}
            <button
              onClick={() => setFabOpen(!fabOpen)}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full bg-nav-active text-nav-active-foreground shadow-lg -mt-5 transition-all duration-400 hover:shadow-xl",
                fabOpen && "rotate-45"
              )}
            >
              <Plus className="h-7 w-7 transition-transform duration-400" />
            </button>

            {navItems.slice(2).map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-all duration-300 ease-in-out"
                activeClassName="text-nav-active scale-110">
                <item.icon className="h-5 w-5 transition-transform duration-300" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* Quick Transaction Dialog */}
      <Dialog open={quickTxOpen} onOpenChange={setQuickTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova {quickTxType === 'receita' ? 'Receita' : 'Despesa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Categoria</Label>
              <Select value={txForm.categoryId} onValueChange={v => setTxForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickTxOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuickTx} disabled={!txForm.categoryId || !txForm.description || !txForm.amount}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Card Dialog */}
      <Dialog open={quickCardOpen} onOpenChange={setQuickCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome do Cartão</Label><Input value={cardForm.name} onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Titular</Label><Input value={cardForm.holder} onChange={e => setCardForm(f => ({ ...f, holder: e.target.value }))} /></div>
            <div><Label>Dia de Vencimento</Label><Input type="number" min="1" max="31" value={cardForm.dueDay} onChange={e => setCardForm(f => ({ ...f, dueDay: e.target.value }))} /></div>
            <div><Label>Limite (opcional)</Label><Input type="number" value={cardForm.limit} onChange={e => setCardForm(f => ({ ...f, limit: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCardOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuickCard} disabled={!cardForm.name || !cardForm.holder}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
