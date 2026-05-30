# Modelagem e Estruturação do Banco de Dados (Consolidado)

Para não cometermos o erro de ter retrabalho de refatorações no futuro, a modelagem principal do banco já englobará todos os pilares essenciais: Orçamentos (Budgets) fixos por projeto, e Controle Multinacional (Várias Moedas e Taxa de Câmbio em despesas).

Criaremos nosso próprio banco PostgreSQL usando um ORM moderno (ex: Prisma), garantindo integridade e cálculos precisos.

### Esquema do Prisma (Prisma Schema Definitivo)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String?
  createdAt     DateTime  @default(now())
  
  // Relacionamentos
  expenses      Expense[]
  projects      Project[]
}

model Project {
  id          String    @id @default(uuid())
  name        String
  description String?
  budget      Decimal   @default(0.0) @db.Decimal(10, 2) // Meta Limite de Gasto
  createdAt   DateTime  @default(now())
  
  userId      String    
  user        User      @relation(fields: [userId], references: [id])
  expenses    Expense[]
}

model Expense {
  id              String   @id @default(uuid())
  
  // Valores e Cambial
  amount          Decimal  @db.Decimal(10, 2) // Preço Pago na Moeda Original
  currency        String   @default("BRL")    // "BRL", "USD", "EUR"
  exchangeRate    Decimal  @default(1.0) @db.Decimal(10, 4) // Cotação no dia da compra
  amountInBRL     Decimal  @db.Decimal(10, 2) // (amount * exchangeRate) - Para geração de relatórios e Budget somado.
  taxAmount       Decimal  @default(0.0) @db.Decimal(10, 2)
  
  // Metadados
  date            DateTime 
  merchant        String?  
  category        String   @default("outros") 
  description     String?
  paymentMethod   String?
  isReimbursable  Boolean  @default(false)
  receiptImageUrl String?  // Link seguro (AWS / R2)
  ocrRawText      String?  
  
  // Relacionamento Opcional
  projectId       String?
  project         Project? @relation(fields: [projectId], references: [id])
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  createdAt       DateTime @default(now())
}
```

## Benefícios Desta Estrutura Base
- Mantendo o `exchangeRate` salvo estatigamente na linha da Despesa, o gráfico do passado não irá sofrer mutação se o dólar disparar 2 anos depois.
- Fica extremamente simples varrer o `amountInBRL` ao computar se um Orçamento (Budget) do `Project` já se esgotou ou não sem ter dor de cabeça de cruzar moedas.
