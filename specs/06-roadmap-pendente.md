# Status do Projeto & Roadmap Final (Pendências Restantes)

A etapa inicial da Refatoração foi um sucesso absoluto. Consolidou-se o backend (Fastify + SQLite Prisma) e a integração do Motor de OCR Inteligente (Gemini 2.5) possuindo fila offline e câmbio em tempo real. No entanto, realizando a varredura das **Especificações Originais Técnicas (01 a 05)**, foram detectadas as últimas ramificações pendentes de finalização antes que o aplicativo alcance seu estado "Go-Live / Production Ready".

Faltam os seguintes 4 Pilares Práticos:

## 1. Saudabilidade e Matemática dos Budgets (Spec 03)
**Status Atual:** Frontend desenha gráficos e alertas, mas consome métricas falsas.\
**Aquela pendência detalhada:** A Rota de saúde de projeto (`/api/projects/:id/health`) atualmente devolve um JSON "dummy" (estático) `{"status": "🟢"}`. 
**Como deve ser implementado:**
- Realizar query SQL complexa no backend pegando todas as `Expenses` originadas para aquele determinado `projectId`.
- Somar iterativamente o campo pré-processado `amountInBRL`.
- Cruzar esta soma total com o campo alvo limite de teto `budget` do próprio `Project`.
- Retornar o cálculo final de porcentagem esgotada `%`, permitindo que o frontend exiba gráficos progressivos de consumação e crie travas ou alertas se passar de 100%.

## 2. Motor de Exportação e Relatórios (Spec 03)
**Status Atual:** O botão de baixar relatórios está interativo, porém atinge uma rota sem ação real.\
**A pendência detalhada:** `/api/reports/export` atualmente devolve uma string URL genérica (`"download_url": "https://app/report-temp.pdf"`). Não processa arquivos físicos.
**Como deve ser implementado:**
- Receber os filtros de data (`startDate`, `endDate`) via `query param`.
- Montar uma Tabela utilizando recursos de bibliotecas aglutinadoras (como `pdf-lib`, `exceljs` ou conversores Pug-to-PDF).
- Agrupar e renderizar de forma sofisticada os dados: nome da despesa, data, estabelecimento, categoria e quantia paga.
- Enviar o pacote em binário ao Frontend (Buffer) para que ocorra o _Download Silencioso_.

## 3. Câmera Nativa em HD UX Mobile (Spec 04 / 05)
**Status Atual:** Ao clicar em escanear, o aplicativo pede pra subir um arquivo pelo visualizador do HTML comum Web (`<input type="file" />`). Funciona por simulador, mas em celulares nativos é pobre.
**A pendência detalhada:** A integração precisa ser completamente movida para dentro do core do Celular substituindo a caixa isolada do browser.
**Como deve ser implementado:**
- Configurar ambiente para suportar plugins (`@capacitor/camera`).
- Utilizar a macro `Camera.getPhoto({ quality: 100, resultType: CameraResultType.Base64 })` pra invocar a câmera nativa e entregar a imagem extraída cirurgicamente crua e processada ao OCR diretamente em memória.
- Proteger erros de permissão de câmera via tratamentos visuais nativos (*Toasts*).

## 4. Segurança de Biometria na Sessão (Spec 05)
**Status Atual:** O Token Persistente JWT não impede que terceiros que peguem o celular logado vejam despesas bancárias / orçamentos confidenciais criados.
**A pendência detalhada:** Integração de plugin Premium para travar as entranhas vitais do App financeiro.
**Como deve ser implementado:**
- Integrar a library oficial ou fork nativa suportada (`@capacitor-community/biometric-auth`).
- Configurar dentro do `AuthContext.jsx` o evento de *Launch / Resume App* para acionar e escurecer a tela, cobrando na interface do iPhone (FaceID) ou Android (Fingerprint) as credenciais biométricas cadastradas no OS.
- Disparar *logout* em falhas sucessivas de digital.

---
*Assim que finalizarmos e testarmos esses 4 quadros supracitados, o ecossistema atinge 100% de convergência da sua planta original exigida.*
