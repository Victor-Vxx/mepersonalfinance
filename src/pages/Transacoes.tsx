import { useState, useMemo, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate, expensesByCategory } from '@/lib/finance-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2, CreditCard, Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Transaction, Category, CreditCard as CreditCardType } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const iconOptions = ['Briefcase', 'Laptop', 'TrendingUp', 'UtensilsCrossed', 'Car', 'Home', 'Gamepad2', 'Heart', 'GraduationCap', 'ShoppingBag', 'Plane', 'Music', 'Dumbbell', 'Gift'];
const colorOptions = [
  'hsl(152, 60%, 42%)', 'hsl(170, 55%, 40%)', 'hsl(200, 60%, 45%)', 'hsl(0, 72%, 51%)',
  'hsl(30, 80%, 50%)', 'hsl(260, 55%, 55%)', 'hsl(320, 60%, 50%)', 'hsl(350, 70%, 55%)',
  'hsl(220, 70%, 50%)', 'hsl(38, 92%, 50%)',
];

export default function Transacoes() {
  const { transactions, categories, cards, addTransaction, updateTransaction, deleteTransaction, addCategory, updateCategory, deleteCategory, addCard, updateCard, deleteCard, importCardTransactions } = useFinance();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transaction dialog
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txForm, setTxForm] = useState({ type: 'despesa' as 'receita' | 'despesa', categoryId: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: 'Briefcase', color: colorOptions[0], type: 'despesa' as 'receita' | 'despesa' });

  // Card dialog
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [cardForm, setCardForm] = useState({ name: '', holder: '', dueDay: '10', limit: '' });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'tx' | 'cat' | 'card'; id: string } | null>(null);

  // Import
  const [importCardId, setImportCardId] = useState<string | null>(null);

  const [selectedCardForView, setSelectedCardForView] = useState<string | null>(null);

  const sortedTxs = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)), [transactions]);

  // Card-specific data
  const cardTxs = useMemo(() => {
    if (!selectedCardForView) return [];
    return transactions.filter(t => t.cardId === selectedCardForView).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedCardForView]);

  const cardPieData = useMemo(() => {
    if (!selectedCardForView) return [];
    return expensesByCategory(cardTxs, categories);
  }, [cardTxs, categories, selectedCardForView]);

  const cardLineData = useMemo(() => {
    if (!cardTxs.length) return [];
    const grouped: Record<string, number> = {};
    cardTxs.forEach(t => {
      const month = format(parseISO(t.date), 'MMM', { locale: ptBR });
      grouped[month] = (grouped[month] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([month, total]) => ({ month, total }));
  }, [cardTxs]);

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
    if (editingTx) updateTransaction({ ...data, id: editingTx.id });
    else addTransaction(data);
    setTxDialogOpen(false);
  };

  const openNewCat = () => { setEditingCat(null); setCatForm({ name: '', icon: 'Briefcase', color: colorOptions[0], type: 'despesa' }); setCatDialogOpen(true); };
  const openEditCat = (cat: Category) => { setEditingCat(cat); setCatForm({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type }); setCatDialogOpen(true); };
  const handleSaveCat = () => { if (editingCat) updateCategory({ ...catForm, id: editingCat.id }); else addCategory(catForm); setCatDialogOpen(false); };

  const openNewCard = () => { setEditingCard(null); setCardForm({ name: '', holder: '', dueDay: '10', limit: '' }); setCardDialogOpen(true); };
  const openEditCard = (card: CreditCardType) => { setEditingCard(card); setCardForm({ name: card.name, holder: card.holder, dueDay: String(card.dueDay), limit: card.limit ? String(card.limit) : '' }); setCardDialogOpen(true); };
  const handleSaveCard = () => {
    const data = { name: cardForm.name, holder: cardForm.holder, dueDay: Number(cardForm.dueDay), limit: cardForm.limit ? Number(cardForm.limit) : undefined };
    if (editingCard) updateCard({ ...data, id: editingCard.id });
    else addCard(data);
    setCardDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'tx') deleteTransaction(deleteConfirm.id);
    else if (deleteConfirm.type === 'cat') deleteCategory(deleteConfirm.id);
    else deleteCard(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importCardId) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        const txs = rows.map(row => ({
          type: 'despesa' as const,
          categoryId: categories.find(c => c.type === 'despesa')?.id || '',
          description: row['Descrição'] || row['Description'] || row['description'] || 'Importado',
          amount: Math.abs(Number(row['Valor'] || row['Amount'] || row['amount'] || 0)),
          date: row['Data'] || row['Date'] || row['date'] || new Date().toISOString().split('T')[0],
          cardId: importCardId,
        })).filter(t => t.amount > 0);
        importCardTransactions(importCardId, txs);
        toast({ title: `${txs.length} lançamentos importados com sucesso!` });
      } catch {
        toast({ title: 'Erro ao importar arquivo.', variant: 'destructive' });
      }
      setImportCardId(null);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredCategories = (type: 'receita' | 'despesa') => categories.filter(c => c.type === type);
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Outros';
  const getCategoryColor = (catId: string) => categories.find(c => c.id === catId)?.color || 'hsl(0,0%,50%)';

  const selectedCard = cards.find(c => c.id === selectedCardForView);
  const cardSpent = cardTxs.reduce((s, t) => s + t.amount, 0);
  const cardLimitPercent = selectedCard?.limit ? Math.round((cardSpent / selectedCard.limit) * 100) : 0;

  // Due date status
  const getDueStatus = (dueDay: number) => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'vencido';
    if (diff <= 5) return 'proximo';
    return 'ok';
  };

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
          <TabsTrigger value="cartoes" className="flex-1">Cartões</TabsTrigger>
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

        <TabsContent value="cartoes">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={openNewCard}><Plus className="h-4 w-4 mr-1" /> Novo Cartão</Button>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum cartão cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map(card => {
                const status = getDueStatus(card.dueDay);
                return (
                  <Card key={card.id} className={`finance-card cursor-pointer ${selectedCardForView === card.id ? 'ring-2 ring-nav-active' : ''}`}
                    onClick={() => setSelectedCardForView(prev => prev === card.id ? null : card.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{card.name}</p>
                            <p className="text-xs text-muted-foreground">{card.holder} · Venc. dia {card.dueDay}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'vencido' ? 'bg-destructive/10 text-destructive' : status === 'proximo' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                            {status === 'vencido' ? 'Vencido' : status === 'proximo' ? 'Vence em breve' : `Dia ${card.dueDay}`}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditCard(card); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setImportCardId(card.id); fileInputRef.current?.click(); }}><Upload className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'card', id: card.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Card Detail View */}
              {selectedCard && (
                <div className="space-y-4 mt-4">
                  <h3 className="text-lg font-semibold">{selectedCard.name} — Detalhes</h3>

                  {selectedCard.limit && (
                    <Card className="finance-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Gasto: {formatCurrency(cardSpent)}</span>
                          <span>Limite: {formatCurrency(selectedCard.limit)}</span>
                        </div>
                        <Progress value={Math.min(cardLimitPercent, 100)} className="h-3" />
                        <p className="text-right text-xs mt-1 text-muted-foreground">{cardLimitPercent}% utilizado</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {cardPieData.length > 0 && (
                      <Card className="finance-card">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gastos por Categoria</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={cardPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fontSize={10}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {cardPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                              </Pie>
                              <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                    {cardLineData.length > 0 && (
                      <Card className="finance-card">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Evolução de Gastos</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={cardLineData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" fontSize={10} />
                              <YAxis fontSize={10} />
                              <Tooltip formatter={(v: number) => formatCurrency(v)} />
                              <Line type="monotone" dataKey="total" stroke="hsl(var(--finance-expense))" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {cardTxs.length > 0 && (
                    <Card className="finance-card">
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lançamentos do Cartão</CardTitle></CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {cardTxs.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">{getCategoryName(tx.categoryId)} · {formatDate(tx.date)}</p>
                            </div>
                            <span className="text-sm font-semibold text-[hsl(var(--finance-expense))]">-{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTx ? 'Editar Transação' : 'Nova Transação'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Tipo</Label>
              <Select value={txForm.type} onValueChange={v => setTxForm(f => ({ ...f, type: v as any, categoryId: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label>
              <Select value={txForm.categoryId} onValueChange={v => setTxForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{filteredCategories(txForm.type).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} /></div>
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
          <DialogHeader><DialogTitle>{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Tipo</Label>
              <Select value={catForm.type} onValueChange={v => setCatForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Cor</Label>
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

      {/* Card Dialog */}
      <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome do Cartão</Label><Input value={cardForm.name} onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Titular</Label><Input value={cardForm.holder} onChange={e => setCardForm(f => ({ ...f, holder: e.target.value }))} /></div>
            <div><Label>Dia de Vencimento</Label><Input type="number" min="1" max="31" value={cardForm.dueDay} onChange={e => setCardForm(f => ({ ...f, dueDay: e.target.value }))} /></div>
            <div><Label>Limite (opcional)</Label><Input type="number" value={cardForm.limit} onChange={e => setCardForm(f => ({ ...f, limit: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCardDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCard} disabled={!cardForm.name || !cardForm.holder}>Salvar</Button>
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
