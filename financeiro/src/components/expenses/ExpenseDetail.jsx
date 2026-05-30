import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, CATEGORIES, PAYMENT_METHODS, REIMBURSEMENT_STATUS } from '@/lib/constants';
import CategoryBadge from '@/components/common/CategoryBadge';
import { Trash2, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ExpenseDetail({ expense, open, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  if (!expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Expense.delete(expense.id);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    setIsDeleting(false);
    onClose();
  };

  const handleReimbursementChange = async (status) => {
    await base44.entities.Expense.update(expense.id, { reimbursement_status: status });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">Detalhes da Despesa</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {expense.receipt_image_url && (
            <div className="w-full h-40 rounded-xl overflow-hidden bg-muted">
              <img
                src={expense.receipt_image_url}
                alt="Receipt"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(expense.amount)}</p>
              <p className="text-sm text-muted-foreground">{expense.merchant || 'Sem nome'}</p>
            </div>
            <CategoryBadge category={expense.category} />
          </div>

          <div className="grid grid-cols-2 gap-3 bg-muted/50 rounded-xl p-3">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium">Data</p>
              <p className="text-sm font-medium">{formatDate(expense.date)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium">Impostos</p>
              <p className="text-sm font-medium">
                {expense.tax_amount ? formatCurrency(expense.tax_amount) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium">Pagamento</p>
              <p className="text-sm font-medium">
                {PAYMENT_METHODS[expense.payment_method] || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium">Reembolsável</p>
              <p className="text-sm font-medium">
                {expense.is_reimbursable ? 'Sim' : 'Não'}
              </p>
            </div>
          </div>

          {expense.description && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Descrição</p>
              <p className="text-sm">{expense.description}</p>
            </div>
          )}

          {expense.is_reimbursable && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">
                Status do Reembolso
              </p>
              <Select
                value={expense.reimbursement_status || 'pendente'}
                onValueChange={handleReimbursementChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REIMBURSEMENT_STATUS).map(([key, s]) => (
                    <SelectItem key={key} value={key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Excluir Despesa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}