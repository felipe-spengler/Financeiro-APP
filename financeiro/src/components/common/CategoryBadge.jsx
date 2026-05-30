import React from 'react';
import { CATEGORIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

export default function CategoryBadge({ category }) {
  const cat = CATEGORIES[category];
  if (!cat) return null;

  return (
    <Badge
      variant="secondary"
      className="text-xs font-medium"
      style={{
        backgroundColor: cat.color + '15',
        color: cat.color,
        borderColor: cat.color + '30',
      }}
    >
      {cat.label}
    </Badge>
  );
}