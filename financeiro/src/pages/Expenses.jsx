import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, formatCurrency } from '@/lib/constants';
import ExpenseCard from '@/components/common/ExpenseCard';
import ExpenseDetail from '@/components/expenses/ExpenseDetail';
import EmptyState from '@/components/common/EmptyState';
import { Search, Receipt, SlidersHorizontal, User, Building, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all'); // 'all', 'pessoal', 'empresa'
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 500),
  });

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !search ||
        (e.merchant || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      
      // Filtro de Carteira CPF / CNPJ
      const matchesWallet = walletFilter === 'all' || e.flowType === walletFilter;
      
      return matchesSearch && matchesCategory && matchesWallet;
    });
  }, [expenses, search, categoryFilter, walletFilter]);

  const totalFiltered = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Agrupamento por Data
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((e) => {
      const dateKey = e.date || 'Sem data';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-extrabold tracking-tight text-foreground mb-4">Lançamentos</h1>

      {/* Seletor Rápido de Carteira no Topo */}
      <div className="grid grid-cols-3 gap-2 bg-muted p-1 rounded-xl mb-4">
        <button
          onClick={() => setWalletFilter('all')}
          className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
            walletFilter === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🔄 Geral
        </button>
        <button
          onClick={() => setWalletFilter('pessoal')}
          className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
            walletFilter === 'pessoal'
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          👤 Pessoal (CPF)
        </button>
        <button
          onClick={() => setWalletFilter('empresa')}
          className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
            walletFilter === 'empresa'
              ? 'bg-background text-purple-500 shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🏢 Empresa (CNPJ)
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Filters Collapsible */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="mb-3 gap-2 text-muted-foreground font-bold">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros Avançados
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mb-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 text-xs">
              <SelectValue placeholder="Filtrar por Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <SelectItem key={key} value={key} className="text-xs">{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CollapsibleContent>
      </Collapsible>

      {/* Resumo financeiro rápido */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </span>
        <span className="text-base font-extrabold text-foreground">{formatCurrency(totalFiltered)}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhum registro encontrado"
          description="Tente ajustar a sua busca ou trocar a carteira selecionada acima."
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, exps]) => (
            <div key={date} className="space-y-2.5">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest pl-1.5 border-l-2 border-primary/40">
                {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-2">
                {exps.map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} onClick={setSelectedExpense} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseDetail
        expense={selectedExpense}
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
}