# Guia de Refatoração do Mobile React (Versão Pró / Híbrida)

O Empacotamento do formato Web para Android/iOS via Capacitor agora carrega todas as engenharias sofisticadas das funcionalidades adicionais para ser gerado Liso, Seguro e Blindado a falhas de Internet.

## Etapa 1: A Remoção do Base44 (Desmame)
O código hoje importa funções vitais do Base44, como `base44.Auth`, `base44.entities.Expense.create` e `base44.integrations.Core.InvokeLLM`.
- O pacote `@base44/sdk` e plugin Vite serão desinstalados.
- Criação e adoção da suíte de requisição pura via **Axios**.

## Etapa 2: Motor Off-line Persistente
Antes de empacotar em capacitor, devemos preparar o App pra rodar na rua.
* Configurar o `persistQueryClient` (Parte do próprio TanStack usado pelo APP) para escrever as tabelas requisitadas no Frontend dentro da memória real persistida do celular local usando o **SQLite**.
* Se o botão *ScanReceipt* for finalizado e a Internet falhar, joga para um objeto de "Tasks Fila". 
* Escrever um *Listener* (Fofoqueiro nativo) via componente Capacitor, que, ao notar uma reconexão (Wifi ou 4G encontrado) roda um loop postando na nossa rota de baciada: `axios.post('/api/expenses/sync', fila)`.

## Etapa 3: Autenticação Biométrica e Componentes Nativos
Transacionando de ambiente 'Navegador Web' para 'Telefone Apple/Android', certas restrições e liberdades mudam. Adicionaremos pacotes premium e sofisticados de Lojas:
* Adicionar a biometria para a sessão:
  `npm install @capacitor/device @capacitor-community/biometric-auth`
* Adicionar câmera nativa em tela-cheia HD para scan da NF: 
  `npm install @capacitor/camera`

## Etapa 4: Configurando e Abrindo no Capacitor
Com a arquitetura robusta acoplada perfeitamente, empacotaremos para as lojas.
1. Na base projeto, rodar a base capacitor global: `npm i @capacitor/core @capacitor/cli`.
2. Rodar Inicialização e responder pacote: `npx cap init FabiApp br.com.felipe.fabiapp`.
3. Adicionar Plataformas App Store / Google Play: 
   * `npm install @capacitor/android @capacitor/ios`
   * `npx cap add android && npx cap add ios`
4. Sincronizar (`npx cap sync`) e abrir nativamente (`npx cap open android`). 

Agora nós não precisamos retocar código "duas vezes". Ele já irá subir com Suporte a Câmbio, Sincronização Sem Fio Offline, Biometria da Tela e API blindadas sendo implementado de ponta a ponta na primeira ida do seu código!
