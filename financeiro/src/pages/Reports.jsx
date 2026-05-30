import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate, CATEGORIES } from '@/lib/constants';
import StatCard from '@/components/common/StatCard';
import CategoryChart from '@/components/dashboard/CategoryChart';
import { FileText, Download, DollarSign, Receipt, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const dateMatch =
        (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      const catMatch = categoryFilter === 'all' || e.category === categoryFilter;
      const projMatch = projectFilter === 'all' || e.project_id === projectFilter;
      return dateMatch && catMatch && projMatch;
    });
  }, [expenses, startDate, endDate, categoryFilter, projectFilter]);

  const totalAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  const reimbursableTotal = filtered
    .filter((e) => e.is_reimbursable)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const generateCSV = () => {
    const headers = ['Data', 'Estabelecimento', 'Categoria', 'Valor', 'Impostos', 'Reembolsável', 'Descrição'];
    const rows = filtered.map((e) => [
      formatDate(e.date),
      e.merchant || '',
      CATEGORIES[e.category]?.label || e.category,
      (e.amount || 0).toFixed(2),
      (e.tax_amount || 0).toFixed(2),
      e.is_reimbursable ? 'Sim' : 'Não',
      e.description || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_despesas_${startDate}_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'CSV exportado!', description: 'Arquivo baixado com sucesso.' });
  };

  const generatePDFReport = async () => {
    setIsGenerating(true);

    const reportData = filtered.map((e) => ({
      data: formatDate(e.date),
      estabelecimento: e.merchant || 'N/A',
      categoria: CATEGORIES[e.category]?.label || 'Outros',
      valor: formatCurrency(e.amount),
      reembolsavel: e.is_reimbursable ? 'Sim' : 'Não',
    }));

    const htmlContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere um relatório HTML profissional de despesas em português brasileiro.

Dados:
- Período: ${formatDate(startDate)} a ${formatDate(endDate)}
- Total: ${formatCurrency(totalAmount)}
- Total Reembolsável: ${formatCurrency(reimbursableTotal)}
- Número de despesas: ${filtered.length}

Lista de despesas:
${JSON.stringify(reportData, null, 2)}

Crie um HTML completo e formatado com:
- Cabeçalho profissional com título "Relatório de Despesas"
- Período do relatório
- Resumo com totais
- Tabela com todas as despesas
- Estilo CSS inline para impressão
- Layout limpo e profissional
- Cores sóbrias (azul escuro, cinza)

Retorne APENAS o HTML completo.`,
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();

    setIsGenerating(false);
    toast({ title: 'Relatório gerado!', description: 'Use Ctrl+P para salvar como PDF.' });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-6">Relatórios</h1>

      {/* Filters */}
      <Card className="p-4 space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Data Início</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Data Fim</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <SelectItem key={key} value={key}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard title="Total" value={formatCurrency(totalAmount)} icon={DollarSign} />
        <StatCard title="Despesas" value={filtered.length} icon={Receipt} />
      </div>

      {filtered.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Por Categoria</h3>
          <CategoryChart expenses={filtered} />
        </div>
      )}

      {/* Export Actions */}
      <div className="space-y-3">
        <Button
          onClick={generatePDFReport}
          disabled={isGenerating || filtered.length === 0}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Gerar Relatório PDF
        </Button>
        <Button
          variant="outline"
          onClick={generateCSV}
          disabled={filtered.length === 0}
          className="w-full gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar CSV / Excel
        </Button>
      </div>
    </div>
  );
}