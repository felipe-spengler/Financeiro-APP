export const CATEGORIES = {
  alimentacao: { label: 'Alimentação', icon: 'UtensilsCrossed', color: '#f97316' },
  transporte: { label: 'Transporte', icon: 'Car', color: '#3b82f6' },
  hospedagem: { label: 'Hospedagem', icon: 'Hotel', color: '#8b5cf6' },
  saude: { label: 'Saúde', icon: 'Heart', color: '#ef4444' },
  educacao: { label: 'Educação', icon: 'GraduationCap', color: '#06b6d4' },
  entretenimento: { label: 'Entretenimento', icon: 'Gamepad2', color: '#ec4899' },
  compras: { label: 'Compras', icon: 'ShoppingBag', color: '#14b8a6' },
  servicos: { label: 'Serviços', icon: 'Wrench', color: '#6366f1' },
  outros: { label: 'Outros', icon: 'MoreHorizontal', color: '#64748b' },
};

export const PROJECT_TYPES = {
  projeto: { label: 'Projeto', icon: 'Briefcase' },
  viagem: { label: 'Viagem', icon: 'Plane' },
  empresa: { label: 'Empresa', icon: 'Building2' },
};

export const PAYMENT_METHODS = {
  dinheiro: 'Dinheiro',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  pix: 'PIX',
  transferencia: 'Transferência',
  outro: 'Outro',
};

export const REIMBURSEMENT_STATUS = {
  pendente: { label: 'Pendente', color: '#f59e0b' },
  enviado: { label: 'Enviado', color: '#3b82f6' },
  aprovado: { label: 'Aprovado', color: '#22c55e' },
  rejeitado: { label: 'Rejeitado', color: '#ef4444' },
};

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}