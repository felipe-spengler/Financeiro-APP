const https = require('https');

const BASE_URL = 'https://diario.techinteligente.site/api';
const EMAIL = `vps-tester-${Date.now()}@financeiroapp.com`;
const PASSWORD = 'SuperSecurePassword123';
const NAME = 'VPS Auto Validator';

console.log("==================================================");
console.log("   FINANCEIROAPP - LIVE PRODUCTION VPS VALIDATOR   ");
console.log("==================================================");
console.log(`Live API URL: ${BASE_URL}`);
console.log(`Test Email  : ${EMAIL}`);
console.log("--------------------------------------------------\n");

function request(path, method, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const parsedUrl = new URL(url);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers,
      rejectUnauthorized: false // Skip SSL issues if any, though let's keep it safe
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const isJson = res.headers['content-type']?.includes('application/json');
          const data = isJson ? JSON.parse(responseBody) : responseBody;
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSuite() {
  let token = null;
  let userId = null;
  let projectId = null;
  let cardId = null;
  let testSuccess = true;

  const steps = [
    {
      name: "1. Cadastro de Novo Usuário (/api/auth/register)",
      fn: async () => {
        const res = await request('/auth/register', 'POST', {
          email: EMAIL,
          password: PASSWORD,
          name: NAME,
          hasCompany: true
        });
        if (res.status !== 200 || !res.data.token) {
          throw new Error(`Falha no cadastro (Status ${res.status}): ${JSON.stringify(res.data)}`);
        }
        token = res.data.token;
        userId = res.data.user.id;
        console.log(`   ✓ Usuário cadastrado com ID: ${userId}`);
      }
    },
    {
      name: "2. Login do Usuário (/api/auth/login)",
      fn: async () => {
        const res = await request('/auth/login', 'POST', {
          email: EMAIL,
          password: PASSWORD
        });
        if (res.status !== 200 || !res.data.token) {
          throw new Error(`Falha no login (Status ${res.status}): ${JSON.stringify(res.data)}`);
        }
        console.log(`   ✓ Login efetuado com sucesso (JWT adquirido)`);
      }
    },
    {
      name: "3. Perfil do Usuário e Configurações (/api/auth/me)",
      fn: async () => {
        const res = await request('/auth/me', 'GET', null, token);
        if (res.status !== 200) {
          throw new Error(`Falha ao obter perfil (Status ${res.status})`);
        }
        console.log("     Dados recebidos do /auth/me:", JSON.stringify(res.data));
        if (res.data.hasCompany !== true) {
          throw new Error(`Campo 'hasCompany' deveria ser true por padrão. Valor recebido: ${res.data.hasCompany}`);
        }
        console.log(`   ✓ Perfil validado. Nome: "${res.data.name}", Empresa Habilitada: ${res.data.hasCompany}`);
      }
    },
    {
      name: "4. Personalização / Toggle de CNPJ (/api/auth/profile)",
      fn: async () => {
        // Desativar empresa
        let res = await request('/auth/profile', 'PUT', { hasCompany: false }, token);
        if (res.status !== 200 || res.data.hasCompany !== false) {
          throw new Error(`Falha ao desativar CNPJ (Status ${res.status}): ${JSON.stringify(res.data)}`);
        }
        console.log(`   ✓ CNPJ desativado com sucesso.`);

        // Reativar empresa
        res = await request('/auth/profile', 'PUT', { hasCompany: true }, token);
        if (res.status !== 200 || res.data.hasCompany !== true) {
          throw new Error(`Falha ao reativar CNPJ (Status ${res.status}): ${JSON.stringify(res.data)}`);
        }
        console.log(`   ✓ CNPJ reativado com sucesso.`);
      }
    },
    {
      name: "5. CRUD de Projetos (/api/projects)",
      fn: async () => {
        // Criar projeto
        let res = await request('/projects', 'POST', {
          name: "Projeto Teste VPS",
          description: "Criado automaticamente pela bateria de testes",
          budget: 5000
        }, token);
        if (res.status !== 200 || !res.data.id) {
          throw new Error(`Erro ao criar projeto (Status ${res.status})`);
        }
        projectId = res.data.id;
        console.log(`   ✓ Projeto criado com ID: ${projectId}`);

        // Listar projetos
        res = await request('/projects', 'GET', null, token);
        if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) {
          throw new Error(`Erro ao listar projetos (Status ${res.status})`);
        }
        console.log(`   ✓ Projetos listados. Encontrados: ${res.data.length} projeto(s)`);
      }
    },
    {
      name: "6. CRUD de Cartões de Crédito (/api/credit-cards)",
      fn: async () => {
        // Criar cartão
        let res = await request('/credit-cards', 'POST', {
          name: "Visa Misto Tester",
          limit: 10000,
          closingDay: 5,
          dueDay: 15
        }, token);
        if (res.status !== 200 || !res.data.id) {
          throw new Error(`Erro ao criar cartão de crédito (Status ${res.status})`);
        }
        cardId = res.data.id;
        console.log(`   ✓ Cartão de crédito criado com ID: ${cardId}`);

        // Listar cartões
        res = await request('/credit-cards', 'GET', null, token);
        if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) {
          throw new Error(`Erro ao listar cartões (Status ${res.status})`);
        }
        console.log(`   ✓ Cartões de crédito listados. Encontrados: ${res.data.length} cartão(ões)`);
      }
    },
    {
      name: "7. Fluxo de Voz e NLP com Gemini 2.5 (/api/ai/parse-voice)",
      fn: async () => {
        console.log("   Processando transcrição de teste no Gemini...");
        const text = "comprei 120 reais de gasolina na empresa no cartão de crédito";
        const res = await request('/ai/parse-voice', 'POST', { text }, token);
        if (res.status !== 200) {
          throw new Error(`Erro ao processar voz no Gemini (Status ${res.status}): ${JSON.stringify(res.data)}`);
        }
        const scan = res.data;
        if (scan.amount !== 120 || scan.flowType !== "empresa" || scan.paymentMethod !== "credit_card") {
          throw new Error(`Gemini não extraiu os dados corretamente: ${JSON.stringify(scan)}`);
        }
        console.log(`   ✓ Gemini extraiu perfeitamente:`);
        console.log(`     - Valor: R$ ${scan.amount}`);
        console.log(`     - Fluxo (Carteira): ${scan.flowType.toUpperCase()}`);
        console.log(`     - Método: ${scan.paymentMethod}`);
        console.log(`     - Estabelecimento: "${scan.merchant}"`);
      }
    },
    {
      name: "8. Criação e Reconciliação de Despesas (/api/expenses)",
      fn: async () => {
        // Criar despesa pessoal no cartão
        let res = await request('/expenses', 'POST', {
          amount: 85.50,
          date: new Date().toISOString(),
          merchant: "Almoço Pessoal Executivo",
          category: "alimentacao",
          paymentMethod: "credit_card",
          flowType: "pessoal",
          type: "saida",
          linkedCardId: cardId,
          projectId: projectId
        }, token);

        if (res.status !== 200 || !res.data.id) {
          throw new Error(`Erro ao criar despesa (Status ${res.status})`);
        }

        // Criar despesa da empresa
        res = await request('/expenses', 'POST', {
          amount: 350.00,
          date: new Date().toISOString(),
          merchant: "Servidor Nuvem VPS",
          category: "servicos",
          paymentMethod: "money_pix",
          flowType: "empresa",
          type: "saida",
          projectId: projectId
        }, token);

        if (res.status !== 200 || !res.data.id) {
          throw new Error(`Erro ao criar despesa empresarial (Status ${res.status})`);
        }

        // Listar despesas
        res = await request('/expenses', 'GET', null, token);
        if (res.status !== 200 || !Array.isArray(res.data) || res.data.length < 2) {
          throw new Error(`Erro ao listar despesas (Status ${res.status})`);
        }
        console.log(`   ✓ Despesas listadas. Total cadastradas para este teste: ${res.data.length}`);
      }
    },
    {
      name: "9. Sincronização em Massa de Fila Offline (/api/expenses/sync)",
      fn: async () => {
        const payload = [
          {
            amount: 45.00,
            date: new Date().toISOString().split('T')[0],
            merchant: "Café com Cliente Offline",
            category: "alimentacao",
            paymentMethod: "money_pix",
            flowType: "pessoal",
            type: "saida"
          },
          {
            amount: 1500.00,
            date: new Date().toISOString().split('T')[0],
            merchant: "Faturamento Venda Offline",
            category: "outros",
            paymentMethod: "money_pix",
            flowType: "empresa",
            type: "entrada"
          }
        ];

        const res = await request('/expenses/sync', 'POST', payload, token);
        if (res.status !== 200 || res.data.count !== 2) {
          throw new Error(`Erro ao sincronizar offline (Status ${res.status}): ${JSON.stringify(res.data)}`);
        }
        console.log(`   ✓ Sincronização offline em massa concluída com sucesso: ${res.data.count} itens inseridos.`);
      }
    }
  ];

  for (const step of steps) {
    console.log(`👉 Executando: ${step.name}`);
    try {
      await step.fn();
      console.log("   [PASSOU]\n");
    } catch (e) {
      console.log(`   [FALHOU]: ${e.message}\n`);
      testSuccess = false;
      break;
    }
  }

  console.log("==================================================");
  if (testSuccess) {
    console.log("🟢 BATERIA DE TESTES DE INTEGRAÇÃO PASSOU COM 100% SUCESSO!");
    console.log("   ✓ Backend, Banco de Dados PostgreSQL e Conexão de IA Gemini");
    console.log("   ✓ Funcionando redondinho na VPS!");
  } else {
    console.log("🔴 BATERIA DE TESTES DE INTEGRAÇÃO FALHOU!");
    console.log("   Por favor revise os logs acima para depuração.");
  }
  console.log("==================================================");
}

runSuite();
