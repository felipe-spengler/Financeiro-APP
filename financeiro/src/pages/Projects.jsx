import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, apiClient } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/constants';
import EmptyState from '@/components/common/EmptyState';
import { Plus, FolderOpen, Briefcase, Plane, Building2, Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const TYPE_ICONS = {
  projeto: Briefcase,
  viagem: Plane,
  empresa: Building2,
};

const TYPE_LABELS = {
  projeto: 'Projeto',
  viagem: 'Viagem',
  empresa: 'Empresa',
};

export default function Projects() {
  const { user, logout, updateProfile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'projeto', budget: '', description: '' });
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { toast } = useToast();
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleCheckUpdate = async () => {
    try {
      setCheckingUpdate(true);
      const localVersion = localStorage.getItem('app_version') || '1.0.0';
      const res = await apiClient.get('/version');
      const backendVersion = res.data.version;

      // Limpar todos os caches do browser/webview
      try {
        if ('caches' in window && typeof caches !== 'undefined') {
          const names = await caches.keys();
          for (let name of names) {
            await caches.delete(name).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Erro ao limpar caches manuais:", e);
      }

      if (localVersion !== backendVersion) {
        toast({
          title: "Nova versão encontrada! 🚀",
          description: `Atualizando da versão v${localVersion} para v${backendVersion}...`
        });
        
        localStorage.setItem('app_version', backendVersion);
        
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast({
          title: "Aplicativo Atualizado! ✅",
          description: `Forçando recarga dos arquivos da VPS por segurança...`
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Falha na verificação",
        description: "Não foi possível conectar ao servidor para verificar atualizações.",
        variant: "destructive"
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setForm({ name: '', type: 'projeto', budget: '', description: '' });
    },
  });

  const getProjectExpenses = (projectId) => {
    return expenses.filter((e) => e.project_id === projectId);
  };

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Seção de Configurações / Perfil */}
      <Card className="p-4 mb-6 border-border/40 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 pb-3.5 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-primary/10">
              {user?.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout(true)} className="text-xs font-bold text-destructive hover:bg-destructive/10">
            Sair
          </Button>
        </div>

        {/* Linha de Versão e Atualização Manual */}
        <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3.5 mb-3.5">
          <div className="flex-1">
            <p className="text-xs font-extrabold text-foreground">Versão do Aplicativo</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
              Versão instalada: v{localStorage.getItem('app_version') || '1.0.0'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={checkingUpdate}
            onClick={handleCheckUpdate} 
            className="text-xs font-extrabold text-primary border-primary/20 hover:bg-primary/5 h-8 gap-1.5"
          >
            {checkingUpdate ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Atualizar
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-extrabold text-foreground">Gerenciar CNPJ (Empresa)</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
              Ativa a carteira dupla CPF/CNPJ e widgets de partilha proporcional de faturas de cartão.
            </p>
          </div>
          <Switch 
            checked={user?.hasCompany ?? true} 
            onCheckedChange={async (checked) => {
              try {
                await updateProfile({ hasCompany: checked });
              } catch (err) {
                console.error(err);
              }
            }}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Projetos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-2">
              <Plus className="w-4 h-4" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do projeto"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projeto">Projeto</SelectItem>
                    <SelectItem value="viagem">Viagem</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Orçamento (R$)</Label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() =>
                  createMutation.mutate({
                    ...form,
                    budget: parseFloat(form.budget) || 0,
                    status: 'ativo',
                  })
                }
                disabled={createMutation.isPending || !form.name}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Criar Projeto'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nenhum projeto"
          description="Crie projetos para organizar suas despesas por viagem, empresa ou projeto"
        />
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const projExpenses = getProjectExpenses(project.id);
            const spent = projExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const TypeIcon = TYPE_ICONS[project.type] || Briefcase;
            const budgetPct = project.budget ? Math.min((spent / project.budget) * 100, 100) : 0;

            return (
              <Link to={`/projects/${project.id}`} key={project.id}>
                <Card className="p-4 hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{project.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {TYPE_LABELS[project.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {projExpenses.length} despesa{projExpenses.length !== 1 ? 's' : ''} · {formatCurrency(spent)}
                      </p>
                      {project.budget > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{formatCurrency(spent)}</span>
                            <span>{formatCurrency(project.budget)}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${budgetPct}%`,
                                backgroundColor: budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : 'hsl(217, 91%, 60%)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}