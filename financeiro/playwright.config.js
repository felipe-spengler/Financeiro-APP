import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Executa os testes isolados pra garantir estabilidade
  fullyParallel: true,
  // Tenta refazer se uma chamada de API travar e falhar
  retries: 1, 
  reporter: 'html', // Vai gerar um sitezinho no final te mostrando onde quebrou em vermelho
  use: {
    // URL base do Front-end em dev
    baseURL: 'http://localhost:5173',
    // Rastreia e grava cada click pra gente depurar depois
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Ele também simula telas de mobile de iPhones e Androids perfeitamente!
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
