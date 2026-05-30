# Resumo do Projeto: FabiApp (Controle Financeiro por Voz Inteligente)

O **FabiApp** é um assistente financeiro inovador e de uso pessoal, projetado com uma abordagem *mobile-first* e focado em controle por **Comandos de Voz**. O objetivo principal é resolver a dor de pequenos empresários e profissionais autônomos: a separação clara entre as finanças da **Empresa (CNPJ)** e as finanças **Pessoais (CPF)**, além de gerenciar cartões de crédito de uso misto de forma automática e inteligente.

---

## 🎙️ 1. Como vai funcionar a Entrada por Voz (Speech-to-Text)

O app utilizará a **Web Speech API** nativa do navegador/WebView. O fluxo é totalmente em português, gratuito, instantâneo e offline.

### Fluxo de Processamento da Voz:
1. O usuário toca e segura o botão do microfone na tela.
2. Ele diz um comando de transação de forma natural.
3. O app transcreve em texto e utiliza um **Processador de Linguagem Natural (NLP)** (via expressões regulares estruturadas ou chamadas de API do Gemini) para converter a frase em um registro financeiro:

#### Exemplos de Comandos:
* *"Gastei 50 reais no mercado pessoal"* 
  ➔ **Valor:** R$ 50,00 | **Tipo:** Saída | **Categoria:** Mercado | **Fluxo:** Pessoal (CPF) | **Método:** Dinheiro/Pix.
* *"Entrou 1500 de vendas na empresa hoje"* 
  ➔ **Valor:** R$ 1.500,00 | **Tipo:** Entrada | **Categoria:** Vendas | **Fluxo:** Empresa (CNPJ).
* *"Comprei 200 reais de combustível na empresa usando o cartão de crédito"* 
  ➔ **Valor:** R$ 200,00 | **Tipo:** Saída | **Categoria:** Combustível | **Fluxo:** Empresa (CNPJ) | **Método:** Cartão de Crédito.
* *"Paguei a fatura do cartão de crédito de 1200 reais com a conta da empresa"*
  ➔ **Ação:** Pagamento de Fatura (desencadeia a divisão inteligente).

---

## 💼 2. O Sistema de Carteiras Duplas (Pessoal vs Empresa)

O aplicativo gerencia **duas realidades financeiras paralelas** em uma única interface:

1. **👤 Carteira Pessoal (CPF):** Custos de vida privada, despesas pessoais, economias pessoais.
2. **🏢 Carteira Empresa (CNPJ):** Caixa diário da empresa, despesas operacionais do negócio, receitas de vendas.

### Lógica de Retirada Automática (Pró-Labore / Distribuição):
Se uma despesa for sinalizada como **Pessoal**, mas o pagamento tiver sido feito usando o caixa da **Empresa**, o app faz a reconciliação automática:
* Registra uma **Transferência de Retirada** da Carteira Empresa para a Carteira Pessoal.
* Registra o **Gasto** na Carteira Pessoal.
* O caixa da empresa bate perfeitamente com a conta bancária física, mas o app acusa exatamente o quanto de pró-labore foi retirado no mês.

---

## 💳 3. A Mágica do Cartão de Crédito Misto

O aplicativo resolve de forma definitiva o uso de cartões de crédito mistos (quando o mesmo cartão é usado para gastos pessoais e da empresa).

1. **Acúmulo de Fatura:** Cada despesa lançada no cartão acumula em uma conta de fatura virtual, guardando a origem (Pessoal ou Empresa).
2. **Métricas de Divisão:** O painel do cartão exibe em tempo real:
   * **Valor Total da Fatura:** ex: R$ 1.000,00
   * **Proporção Pessoal:** ex: R$ 300,00 (30%)
   * **Proporção Empresa:** ex: R$ 700,00 (70%)
3. **Divisão Inteligente no Pagamento:**
   * Quando o usuário disser *"Paguei a fatura do cartão"*:
     - **Se pago com a conta da Empresa:** O app retira R$ 1.000,00 do caixa da empresa, mas converte R$ 300,00 automaticamente em uma **Retirada Pessoal**. O balanço pessoal quita a dívida e a empresa registra que o dinheiro cobriu um custo do sócio.
     - **Se pago proporcional:** Desconta R$ 300,00 do Caixa Pessoal e R$ 700,00 do Caixa Empresa.

---

## 🛠️ O que precisa alterar no projeto FabiApp (Atual)

Para transformar o app focado em imagens em um app focado em **Voz e Separação de Contas**:

### A. Modificações no Front-End (`financeiro/src`):
1. **Deletar / Desativar a Rota `/scan` (OCR de imagens):** Remover a câmera e o leitor óptico que eram o foco anterior do FabiApp.
2. **Criar a Nova Home / Central de Voz (`App.jsx` ou `/voz`):**
   * Desenhar um layout minimalista de alta qualidade com um **botão de microfone flutuante premium** (com ondas de áudio animadas e efeitos de pulso via Framer Motion).
   * Exibir uma caixa de texto que mostra o que está sendo falado em tempo real (*Live Transcription*).
   * Painel de confirmação rápida: *"Entendi: Gasto de R$ 50 no Mercado (Pessoal). Confirmar?"*.
3. **Reformular o Dashboard (`/`):**
   * Substituir o gráfico único por uma visualização de **Caixas Separados**. Um botão rápido de alternar: `[ Visão Geral ] [ Empresa 🏢 ] [ Pessoal 👤 ]`.
   * Incluir um **Medidor da Fatura do Cartão**, mostrando a divisão percentual Pessoal vs Empresa.
4. **Atualizar a Listagem de Transações (`/expenses`):**
   * Adicionar tags visuais de identificação rápida: `[👤 Pessoal]` (cor verde/azul) e `[🏢 Empresa]` (cor roxa/laranja).
   * Permitir filtragem por Carteira ou por forma de pagamento (Cartão de Crédito vs Dinheiro).

### B. Modificações no Modelo de Dados (Banco de Dados / Base44 SDK):
1. **Coleção `transactions` (Transações):**
   * Adicionar o campo `flow_type` (`'pessoal'` | `'empresa'`).
   * Adicionar o campo `payment_method` (`'money_pix'` | `'credit_card'`).
   * Adicionar o campo `linked_card_id` (opcional, para vincular a um cartão de crédito).
2. **Coleção `credit_cards` (Cartões de Crédito):**
   * Criar para rastrear o limite, fechamento de fatura e saldo acumulado pessoal/empresa.

---

## 🚀 Roteiro de Implementação (Passo a Passo para o início)

* [ ] **Passo 1: Preparação do Ambiente:** Atualizar o `package.json` se necessário e limpar componentes de upload de imagem legados.
* [ ] **Passo 2: Criação do Custom Hook de Voz (`useSpeechToText.js`):** Integrar a Web Speech API com tratamento de erros, suporte a pausa e captação contínua em português.
* [ ] **Passo 3: Motor de Processamento do Texto (Parser):** Criar o algoritmo de análise (regex/inteligência artificial leve) para extrair Valor, Ação, Categoria e Tipo de Carteira (Pessoal/Empresa) das frases faladas.
* [ ] **Passo 4: Interface da Central de Voz:** Desenhar a tela do microfone com feedback visual (ondas sonoras) e caixa de diálogo para confirmação.
* [ ] **Passo 5: Banco de Dados de Carteiras Duplas:** Configurar o Base44 SDK para salvar os fluxos de forma separada no banco local/nuvem.
* [ ] **Passo 6: Dashboard & Lógica de Cartão:** Montar a visualização dos dois caixas e programar a divisão inteligente no pagamento da fatura do cartão.
