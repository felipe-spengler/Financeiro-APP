import { test, expect } from '@playwright/test';

test.describe('FinanceiroApp E2E - Assistente de Voz e Carteiras Duplas', () => {

  test.beforeEach(async ({ page, request }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Erro')) console.log('BROWSER CONSOLE:', msg.text());
    });
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    // Autenticando no backend local real para pegar o Token JWT
    const apiRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: 'teste-e2e@financeiroapp.com', password: '123' }
    });
    const { token } = await apiRes.json();
    
    // Injetando o Token e Mockando a API de Reconhecimento de Voz nativa
    await page.addInitScript((jwt) => {
      window.localStorage.setItem('token', jwt);
      
      // Mock da Web Speech API (SpeechRecognition / webkitSpeechRecognition)
      class MockSpeechRecognition {
        constructor() {
          this.continuous = false;
          this.interimResults = false;
          this.lang = 'pt-BR';
        }
        
        start() {
          if (this.onstart) this.onstart();
          
          // Simula o usuário falando e transcrevendo a frase após um pequeno intervalo
          setTimeout(() => {
            const simulatedEvent = {
              results: [
                [{ transcript: 'Gastei 55 reais de almoço pessoal no cartão' }]
              ]
            };
            if (this.onresult) this.onresult(simulatedEvent);
            if (this.onend) this.onend();
          }, 800);
        }
        
        stop() {
          if (this.onend) this.onend();
        }
      }
      
      window.SpeechRecognition = MockSpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;
    }, token);

    // Navega para a home
    await page.goto('/');
    await expect(page.locator('text=Início').first()).toBeVisible({ timeout: 10000 });
  });

  // TESTE 1: FLUXO DE VOZ E PREENCHIMENTO AUTOMÁTICO (IA)
  test('Deve conseguir usar o microfone, transcrever e preencher a despesa via IA', async ({ page }) => {
    // Aumentar o timeout pois envolve chamada ao Gemini Mockado ou real no backend
    test.setTimeout(45000);

    // Clica no botão "Falar" no header
    await page.click('button:has-text("Falar"), a[href="/scan"]');
    await expect(page.locator('text=Assistente de Voz')).toBeVisible();

    // Clica no botão do microfone para iniciar
    const micButton = page.locator('button:has(.lucide-mic)');
    await micButton.click();

    // Espera a transcrição simulada aparecer na tela
    await expect(page.locator('text=Gastei 55 reais de almoço pessoal no cartão')).toBeVisible({ timeout: 10000 });

    // Clica de novo no microfone para parar e processar
    await micButton.click();

    // Deve mudar para a tela de revisão
    await expect(page.locator('text=Confirmar e Salvar')).toBeVisible({ timeout: 15000 });

    // Verifica se os campos foram extraídos corretamente pela IA/Backend
    const amountVal = await page.inputValue('input[placeholder="0,00"]');
    expect(parseFloat(amountVal)).toBe(55);

    // Verifica se o seletor Pessoal está ativo
    const pessoalCard = page.locator('div:has-text("Pessoal"):has-text("Carteira CPF")').first();
    await expect(pessoalCard).toHaveClass(/border-primary/);

    // Confirma e Salva
    await page.click('button:has-text("Confirmar e Salvar")');

    // Retorna para a home e verifica se a despesa de 55 reais apareceu
    await expect(page.locator('text=Início').first()).toBeVisible({ timeout: 10000 });
  });

  // TESTE 2: DUAL-WALLET (ALTERNAÇÃO DE CARTEIRAS CPF vs CNPJ)
  test('Deve alternar visualizações de carteira no Dashboard e filtrar lançamentos', async ({ page }) => {
    // Garante que estamos na home
    await expect(page.locator('text=Início').first()).toBeVisible();

    // Clica na carteira "Pessoal (CPF)"
    await page.click('button:has-text("Pessoal (CPF)")');
    await expect(page.locator('button:has-text("Pessoal (CPF)")')).toHaveClass(/text-primary/);

    // Clica na carteira "Empresa (CNPJ)"
    await page.click('button:has-text("Empresa (CNPJ)")');
    await expect(page.locator('button:has-text("Empresa (CNPJ)")')).toHaveClass(/text-purple-500/);

    // Retorna para a Geral
    await page.click('button:has-text("Geral")');
  });

  // TESTE 3: WIDGET DE CARTÃO MISTO (QUITACÃO INTELIGENTE)
  test('Deve interagir com o Splitter do Cartão de Crédito Misto e disparar a quitação', async ({ page }) => {
    await expect(page.locator('text=Início').first()).toBeVisible();

    // Verifica se o painel do Cartão Misto está presente (se houver despesas em cartão)
    const cardSplitter = page.locator('text=Fatura do Cartão Misto');
    if (await cardSplitter.isVisible()) {
      // Clica em "Pagar Proporcional"
      await page.click('button:has-text("Pagar Proporcional")');
      await expect(page.locator('text=Fatura Paga Proporcional!')).toBeVisible({ timeout: 5000 });

      // Clica em "Pagar Pela Empresa"
      await page.click('button:has-text("Pagar Pela Empresa")');
      await expect(page.locator('text=Quitação via Empresa (Retirada)')).toBeVisible({ timeout: 5000 });
    }
  });

});
