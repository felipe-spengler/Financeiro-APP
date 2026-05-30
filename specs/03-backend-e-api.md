# Rotas Básicas do Backend e API (Definitivo)

Construção do servidor em (Node.js/TypeScript) desde o início considerando todas as ramificações de regras de Câmbio, Budgets, Sincronização Off-line e Exportação.

Todas rotas operam sob *Middlewares JWT Bearer*. 

## 1. Rota de Autenticação (`/api/auth`)
* `POST /api/auth/register`
* `POST /api/auth/login` (Devolve JWT)

## 2. Rota de Projetos e Budgets (`/api/projects`)
* `GET /api/projects`: Traz os centros de custos.
* `POST /api/projects`: Cria com um limitador (Budget).
* `GET /api/projects/:id/health`: Traz os dados do projeto SOMADOS todos os gastos e qual a % consumida do `Budget` (Meta) pra alimentar o componente visual e disparar os alertas de Overbudget no App.

## 3. Arquivos e IA (`/api/upload` / `/api/ai`)
* `POST /api/upload/receipt`: Repasse do app e hospedagem em um S3 Binário.
* `POST /api/ai/scan`: Injeção da Imagem no Gpt-4o e leitura do OCR Json. 

## 4. Despesas (Single e Sync Offline) (`/api/expenses`)
* `GET /api/expenses`: Busca dos gastos em período.
* `POST /api/expenses`: Recebe a Despesa preenchida. (Se a moeda for "USD", o Backend aciona uma API fixadora de cotações oficial silenciosamente, crava o `exchangeRate` do dia, traduz o valor total em Reais no campo `amountInBRL` e salva de uma vez tudo mastigado).
* `POST /api/expenses/sync`: **Ponto crucial criado para suportar o Off-line**. Rota massiva que recebe um "Array []" com todas as despesas acumuladas pelo App Mobile enquanto estava sem Internet, processando as cotações em bloco (bulk-insert) e salvando rapidamente.

## 5. Exportação Genial (`/api/reports`)
* `GET /api/reports/export`: Uma rota pesada onde nós enviaremos o comando. O Backend pega as métricas do mês via banco de dados, utiliza a bibliotecas (como Puppeter ou Pdf-lib) para desenhar um documento tabular sofisticado e retorna pro *App Celular* imediatamente um arquivo pronto .PDF para ele salvar localmente, enviar no wpp ou encaminhar à contabilidade.
