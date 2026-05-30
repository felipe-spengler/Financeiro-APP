import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/constants';
import StatCard from '@/components/common/StatCard';
import SpendingChart from '@/components/dashboard/SpendingChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import ExpenseCard from '@/components/common/ExpenseCard';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Mic,
  ChevronRight,
  RefreshCw,
  CreditCard as CardIcon,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [period, setPeriod] = useState('month');
  const [wallet, setWallet] = useState('all'); // 'all', 'pessoal', 'empresa'
  const { toast } = useToast();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 200),
  });

  const filtered = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      // Filtro de Carteira (Dual-Wallet)
      if (wallet === 'pessoal' && e.flowType !== 'pessoal') return false;
      if (wallet === 'empresa' && e.flowType !== 'empresa') return false;

      if (!e.date) return false;
      const d = new Date(e.date);
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
  }, [expenses, period, wallet]);

  // Cálculos Gerais das Métricas
  const totalAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  const reimbursableAmount = filtered
    .filter((e) => e.is_reimbursable)
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Lógica do Cartão Misto Inteligente (Credit Card Splitter)
  const creditCardExpenses = filtered.filter(e => e.paymentMethod === 'credit_card');
  const totalCardAmount = creditCardExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const cardPessoalAmount = creditCardExpenses.filter(e => e.flowType === 'pessoal').reduce((sum, e) => sum + (e.amount || 0), 0);
  const cardEmpresaAmount = creditCardExpenses.filter(e => e.flowType === 'empresa').reduce((sum, e) => sum + (e.amount || 0), 0);

  const cardPessoalPercent = totalCardAmount > 0 ? Math.round((cardPessoalAmount / totalCardAmount) * 100) : 0;
  const cardEmpresaPercent = totalCardAmount > 0 ? Math.round((cardEmpresaAmount / totalCardAmount) * 100) : 0;

  const recentExpenses = filtered.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
            💼 FinanceiroApp <span className="text-[10px] bg-primary/20 text-primary py-0.5 px-2 rounded-full font-mono uppercase">Voz</span>
          </h1>
          <p className="text-xs text-muted-foreground">Controle financeiro inteligente</p>
        </div>
        <Link to="/scan">
          <Button size="sm" className="rounded-full gap-2 shadow-lg shadow-primary/20 font-bold">
            <Mic className="w-4 h-4 animate-pulse" />
            Falar
          </Button>
        </Link>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="Nenhum registro ainda"
          description="Toque no botão de microfone e diga seu primeiro gasto pessoal ou da empresa!"
          actionLabel="Registrar por Voz"
          actionPath="/scan"
        />
      ) : (
        <>
          {/* Seletor CPF vs CNPJ (Dual-Wallet Selector) */}
          <div className="grid grid-cols-3 gap-2 bg-muted p-1 rounded-xl mb-4">
            <button
              onClick={() => setWallet('all')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                wallet === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🔄 Geral
            </button>
            <button
              onClick={() => setWallet('pessoal')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                wallet === 'pessoal'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👤 Pessoal (CPF)
            </button>
            <button
              onClick={() => setWallet('empresa')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                wallet === 'empresa'
                  ? 'bg-background text-purple-500 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏢 Empresa (CNPJ)
            </button>
          </div>

          {/* Period Tabs */}
          <Tabs value={period} onValueChange={setPeriod} className="mb-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="year">Ano</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard
              title={wallet === 'empresa' ? "Entrou / Saída (Empresa)" : (wallet === 'pessoal' ? "Total Pessoal" : "Total Geral")}
              value={formatCurrency(totalAmount)}
              icon={DollarSign}
              subtitle={`${filtered.length} lançamentos`}
            />
            <StatCard
              title="Reembolsável"
              value={formatCurrency(reimbursableAmount)}
              icon={RefreshCw}
            />
          </div>

          {/* Widget Mágico do Cartão de Crédito Misto */}
          {totalCardAmount > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <CardIcon className="w-4 h-4 text-primary shrink-0" /> Fatura do Cartão Misto
                </h3>
                <span className="text-xs font-extrabold text-foreground">{formatCurrency(totalCardAmount)}</span>
              </div>
              
              {/* Barra Progressiva Proporcional de Divisão */}
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex mb-2.5">
                <div 
                  style={{ width: `${cardPessoalPercent}%` }} 
                  className="bg-primary h-full transition-all"
                  title={`Pessoal: ${cardPessoalPercent}%`}
                />
                <div 
                  style={{ width: `${cardEmpresaPercent}%` }} 
                  className="bg-purple-500 h-full transition-all animate-pulse"
                  title={`Empresa: ${cardEmpresaPercent}%`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold px-0.5">
                <span className="flex items-center gap-1 text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Pessoal: {cardPessoalPercent}% ({formatCurrency(cardPessoalAmount)})
                </span>
                <span className="flex items-center gap-1 text-purple-500">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                  Empresa: {cardEmpresaPercent}% ({formatCurrency(cardEmpresaAmount)})
                </span>
              </div>

              {/* Botões de Ação para Quitação Inteligente */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    toast({ 
                      title: "Fatura Paga Proporcional! 💵", 
                      description: `Foi descontado ${formatCurrency(cardPessoalAmount)} do caixa Pessoal e ${formatCurrency(cardEmpresaAmount)} do caixa Empresa.` 
                    });
                  }}
                  className="text-[9px] h-8 font-bold leading-tight"
                >
                  Pagar Proporcional
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    toast({ 
                      title: "Quitação via Empresa (Retirada) 🏢", 
                      description: `Fatura paga pela Empresa. Lançado um Pró-labore/Retirada de ${formatCurrency(cardPessoalAmount)} do caixa Empresa para o seu CPF.` 
                    });
                  }}
                  className="text-[9px] h-8 font-bold leading-tight text-purple-500 hover:text-purple-600 border-purple-500/20"
                >
                  Pagar Pela Empresa
                </Button>
              </div>
            </div>
          )}

          {/* Spending Chart */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">Evolução do Caixa</h3>
            <SpendingChart expenses={filtered} period={period} />
          </div>

          {/* Category Chart */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">Por Categoria</h3>
            <CategoryChart expenses={filtered} />
          </div>

          {/* Recent */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">Recentes ({wallet === 'pessoal' ? 'Pessoal' : (wallet === 'empresa' ? 'Empresa' : 'Todos')})</h3>
              <Link to="/expenses" className="text-xs text-primary font-bold flex items-center gap-0.5">
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentExpenses.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                  Nenhum lançamento recente nessa carteira.
                </div>
              ) : (
                recentExpenses.map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}