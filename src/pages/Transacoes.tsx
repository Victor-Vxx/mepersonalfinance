import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Transaction, Category } from '@/types/finance';

const iconOptions = ['Briefcase', 'Laptop', 'TrendingUp', 'UtensilsCrossed', 'Car', 'Home', 'Gamepad2', 'Heart', 'GraduationCap', 'ShoppingBag', 'Plane', 'Music', 'Dumbbell', 'Gift'];
const colorOptions = [
  'hsl(152, 60%, 42%)', 'hsl(170, 55%, 40%)', 'hsl(200, 60%, 45%)', 'hsl(0, 72%, 51%)',
  'hsl(30, 80%, 50%)', 'hsl(260, 55%, 55%)', 'hsl(320, 60%, 50%)', 'hsl(350, 70%, 55%)',
  'hsl(220, 70%, 50%)', 'hsl(38, 92%, 50%)',
];

export default function Transacoes() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction, addCategory, updateCategory, deleteCategory } = useFinance();
  const isMobile = useIsMobile();

  // Transaction dialog
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txForm, setTxForm] = useState({ type: 'despesa' as 'receita' | 'despesa', categoryId: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: 'Briefcase', color: colorOptions[0], type: 'despesa' as 'receita' | 'despesa' });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'tx' | 'cat'; id: string } | null>(null);

  const sortedTxs = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)), [transactions]);

  const openNewTx = () => {
    setEditingTx(null);
    setTxForm({ type: 'despesa', categoryId: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setTxDialogOpen(true);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxForm({ type: tx.type, categoryId: tx.categoryId, description: tx.description, amount: String(tx.amount), date: tx.date });
    setTxDialogOpen(true);
  };

  const handleSaveTx = () => {
    const data = { type: txForm.type, categoryId: txForm.categoryId, description: txForm.description, amount: Number(txForm.amount), date: txForm.date };
    if (editingTx) {
      updateTransaction({ ...data, id: editingTx.id });
    } else {
      addTransaction(data);
    }
    setTxDialogOpen(false);
  };

  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', icon: 'Briefcase', color: colorOptions[0], type: 'despesa' });
    setCatDialogOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
    setCatDialogOpen(true);
  };

  const handleSaveCat = () => {
    if (editingCat) {
      updateCategory({ ...catForm, id: editingCat.id });
    } else {
      addCategory(catForm);
    }
    setCatDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'tx') deleteTransaction(deleteConfirm.id);
    else deleteCategory(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const filteredCategories = (type: 'receita' | 'despesa') => categories.filter(c => c.type === type);
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Outros';
  const getCategoryColor = (catId: string) => categories.find(c => c.id === catId)?.color || 'hsl(0,0%,50%)';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        {!isMobile && <Button onClick={openNewTx}><Plus className="h-4 w-4 mr-1" /> Nova Transação</Button>}
      </div>

      <Tabs defaultValue="transacoes">
        <TabsList className="w-full">
          <TabsTrigger value="transacoes" className="flex-1">Transações</TabsTrigger>
          <TabsTrigger value="categorias" className="flex-1">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes">
          {sortedTxs.length > 0 ? (
            <div className="space-y-2">
              {sortedTxs.map(tx => (
                <Card key={tx.id} className="finance-card">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(tx.categoryId) }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{getCategoryName(tx.categoryId)} · {formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-semibold ${tx.type === 'receita' ? 'text-[hsl(var(--finance-income))]' : 'text-[hsl(var(--finance-expense))]'}`}>
                        {tx.type === 'receita' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTx(tx)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm({ type: 'tx', id: tx.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma transação registrada</p>
              <Button className="mt-4" onClick={openNewTx}>Adicionar Transação</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categorias">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={openNewCat}><Plus className="h-4 w-4 mr-1" /> Nova Categoria</Button>
          </div>
          <div className="space-y-2">
            {categories.map(cat => (
              <Card key={cat.id} className="finance-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: cat.color }}>
                      {cat.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(cat)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm({ type: 'cat', id: cat.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAB for mobile */}
      {isMobile && (
        <button
          onClick={openNewTx}
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-nav-active text-nav-active-foreground shadow-lg transition-all duration-300 active:scale-95 hover:shadow-xl hover:brightness-110"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTx ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tipo</Label>
              <Select value={txForm.type} onValueChange={v => setTxForm(f => ({ ...f, type: v as any, categoryId: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={txForm.categoryId} onValueChange={v => setTxForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories(txForm.type).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTx} disabled={!txForm.categoryId || !txForm.description || !txForm.amount}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={catForm.type} onValueChange={v => setCatForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {colorOptions.map(c => (
                  <button key={c} onClick={() => setCatForm(f => ({ ...f, color: c }))} className={`h-8 w-8 rounded-full border-2 transition-transform ${catForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCat} disabled={!catForm.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
