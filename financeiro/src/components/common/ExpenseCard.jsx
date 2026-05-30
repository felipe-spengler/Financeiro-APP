import React from 'react';
import { formatCurrency, formatDate, CATEGORIES } from '@/lib/constants';
import CategoryBadge from './CategoryBadge';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function ExpenseCard({ expense, onClick }) {
  const cat = CATEGORIES[expense.category] || CATEGORIES.outros;

  return (
    <div
      onClick={() => onClick?.(expense)}
      className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cat.color + '15' }}
      >
        <span className="text-lg" style={{ color: cat.color }}>
          {cat.label.charAt(0)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {expense.merchant || 'Sem nome'}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatDate(expense.date)}
          </span>
          <CategoryBadge category={expense.category} />
          {expense.flowType && (
            <Badge 
              variant="outline" 
              className={`text-[9px] h-4 px-1.5 rounded-md font-extrabold uppercase shrink-0 ${
                expense.flowType === 'empresa' 
                  ? 'border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400' 
                  : 'border-primary/30 bg-primary/5 text-primary'
              }`}
            >
              {expense.flowType === 'empresa' ? '🏢 Empresa' : '👤 Pessoal'}
            </Badge>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-sm text-foreground">
          {formatCurrency(expense.amount)}
        </p>
        {expense.is_reimbursable && (
          <Badge variant="outline" className="text-[10px] mt-0.5 gap-1">
            <RefreshCw className="w-2.5 h-2.5" />
            Reemb.
          </Badge>
        )}
      </div>
    </div>
  );
}