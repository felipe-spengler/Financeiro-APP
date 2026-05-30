import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import StatCard from '@/components/common/StatCard';
import ExpenseCard from '@/components/common/ExpenseCard';
import ExpenseDetail from '@/components/expenses/ExpenseDetail';
import EmptyState from '@/components/common/EmptyState';
import CategoryChart from '@/components/dashboard/CategoryChart';
import { ArrowLeft, DollarSign, Receipt, Camera } from 'lucide-react';

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = window.location.pathname.split('/').pop();
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.list();
      return projects.find((p) => p.id === projectId);
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 500),
  });

  const projectExpenses = useMemo(
    () => expenses.filter((e) => e.project_id === projectId),
    [expenses, projectId]
  );

  const totalSpent = projectExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <Link to="/projects">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </Link>

      <h1 className="text-xl font-bold text-foreground mb-1">{project?.name || 'Projeto'}</h1>
      <p className="text-sm text-muted-foreground mb-6">{project?.description || ''}</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard title="Total Gasto" value={formatCurrency(totalSpent)} icon={DollarSign} />
        <StatCard title="Despesas" value={projectExpenses.length} icon={Receipt} />
      </div>

      {projectExpenses.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Por Categoria</h3>
          <CategoryChart expenses={projectExpenses} />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Despesas</h3>
        <Link to="/scan">
          <Button size="sm" variant="outline" className="gap-1">
            <Camera className="w-3 h-3" /> Adicionar
          </Button>
        </Link>
      </div>

      {projectExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sem despesas"
          description="Adicione despesas a este projeto"
          actionLabel="Escanear Nota"
          actionPath="/scan"
        />
      ) : (
        <div className="space-y-2">
          {projectExpenses.map((exp) => (
            <ExpenseCard key={exp.id} expense={exp} onClick={setSelectedExpense} />
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