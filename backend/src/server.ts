import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const fastify = Fastify({ 
  logger: true,
  bodyLimit: 30 * 1024 * 1024 // 30 MB for Base64 Images
});
const prisma = new PrismaClient();

// Registrando o JWT para middlewares de autenticação
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-super-secret-key'
});

// Registrando CORS para permitir Playwright e Capacitor (Mobile Native Oigins) baterem na API
fastify.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Middleware genérico para verificar autenticação
fastify.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.get('/api/version', async (request, reply) => {
  return { version: '1.0.6' };
});

// === 1. ROTAS DE AUTENTICAÇÃO ===
fastify.post('/api/auth/register', async (request, reply) => {
  const { email, password, name, hasCompany } = request.body as any;
  if (!email || !password) {
    return reply.status(400).send({ error: "E-mail e senha são obrigatórios." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verificar se o usuário já existe
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });
  if (existing) {
    return reply.status(400).send({ error: "Este e-mail já está sendo utilizado." });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        name: name || email.split('@')[0],
        hasCompany: hasCompany !== undefined ? Boolean(hasCompany) : true,
      }
    });

    const token = fastify.jwt.sign({ id: user.id, name: user.name });
    return { token, user: { id: user.id, name: user.name, email: user.email, hasCompany: user.hasCompany } };
  } catch (error: any) {
    return reply.status(500).send({ error: "Erro ao criar usuário: " + error.message });
  }
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as any;
  if (!email || !password) {
    return reply.status(400).send({ error: "E-mail e senha são obrigatórios." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || user.passwordHash !== hashPassword(password)) {
    return reply.status(401).send({ error: "E-mail ou senha incorretos." });
  }

  const token = fastify.jwt.sign({ id: user.id, name: user.name });
  return { token, user: { id: user.id, name: user.name, email: user.email, hasCompany: user.hasCompany } };
});

fastify.get('/api/auth/me', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id }
    });
    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasCompany: user.hasCompany
    };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

fastify.put('/api/auth/profile', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  try {
    const { name, hasCompany } = request.body as any;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (hasCompany !== undefined) updateData.hasCompany = Boolean(hasCompany);

    const user = await prisma.user.update({
      where: { id: request.user.id },
      data: updateData
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasCompany: user.hasCompany
    };
  } catch (err: any) {
    return reply.status(500).send({ error: "Erro ao atualizar perfil: " + err.message });
  }
});

// === 2. PROJETOS E BUDGETS ===
fastify.get('/api/projects', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply) => {
  return await prisma.project.findMany({
    where: { userId: request.user.id }
  });
});

fastify.post('/api/projects', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const data: any = request.body;
  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      budget: data.budget || 0,
      userId: request.user.id
    }
  });
});

fastify.get('/api/projects/:id/health', { preValidation: [(fastify as any).authenticate] }, async (request, reply) => {
  return { status: "health-checked", health: "🟢" };
});

// === 3. ARQUIVOS E IA ===
fastify.post('/api/upload/receipt', { preValidation: [(fastify as any).authenticate] }, async (request, reply) => {
  return { file_url: "https://minha-bucket.s3/nota.jpg" };
});

fastify.post('/api/ai/scan', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const data: any = request.body; 
  try {
    let contentParts: any[] = [
      `Você é um analista fiscal preciso. Extraia os dados da nota fiscal e retorne ESTRITAMENTE um objeto JSON válido.
      As categorias permitidas são: "alimentacao", "transporte", "hospedagem", "saude", "educacao", "entretenimento", "compras", "servicos", "outros".`
    ];

    if (data.base64Image) {
      // Remover prefixo data:image/jpeg;base64, se houver
      const base64Str = data.base64Image.replace(/^data:image\/\w+;base64,/, '');
      contentParts.push({
        inlineData: {
          data: base64Str,
          mimeType: "image/jpeg"
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            currency: { type: Type.STRING },
            tax_amount: { type: Type.NUMBER },
            description: { type: Type.STRING },
            raw_text: { type: Type.STRING }
          },
          required: ["amount", "date", "merchant", "category"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ 
       error: "Erro ao conectar os Serviços de Leitura Mágica. Por favor, adicione na forma manual enquanto as coisas carregam." 
    });
  }
});

// === 4. DESPESAS E SYNC OFFLINE ===
fastify.post('/api/ai/parse-voice', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const data: any = request.body;
  const { text, audio } = data;
  if (!text && !audio) {
    return reply.status(400).send({ error: "O texto ou áudio para processamento é obrigatório." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id }
    });
    const hasCompany = user?.hasCompany ?? true;

    const companyInstruction = !hasCompany 
      ? "\nIMPORTANTE: O usuário NÃO tem empresa (desativado). Ignore qualquer referência a CNPJ, firma ou empresa. Defina ESTRITAMENTE o campo 'flowType' como 'pessoal'.\n"
      : "";

    const prompt = `Você é um analista financeiro de voz inteligente para um aplicativo de controle de gastos em português.
Seu objetivo é analisar a gravação de áudio ou transcrição de voz fornecida e extrair de forma inteligente os atributos financeiros em formato JSON.

${companyInstruction}
Regras para preenchimento de campos:
1. "amount": O valor numérico da compra/entrada. Exemplo: "50 reais" -> 50.00, "1500 de vendas" -> 1500.00.
2. "type": Se é uma despesa/saída ("saida") ou uma receita/entrada ("entrada"). Inferido a partir do contexto:
   - "gastei", "paguei", "comprei", "custou" -> "saida"
   - "recebi", "faturei", "entrou", "ganhei" -> "entrada"
3. "flowType": Identifique se a carteira de destino é "pessoal" (CPF) ou "empresa" (CNPJ). 
   - Se disser "empresa", "cnpj", "do trabalho", "operacional", "da firma" -> "empresa"
   - Se disser "pessoal", "cpf", "para mim", "em casa", "no mercado pessoal" -> "pessoal"
   - Se não houver pistas, use "pessoal" como padrão.
4. "paymentMethod": A forma de pagamento utilizada.
   - "cartão", "crédito", "no cartão" -> "credit_card"
   - "pix", "dinheiro", "no pix", "débito", "à vista" ou não mencionado -> "money_pix"
5. "merchant": O estabelecimento comercial ou fonte. Exemplo: "no mercado" -> "mercado", "no posto de combustível" -> "posto de combustível", "recebi de vendas" -> "vendas".
6. "category": A categoria de gastos ou receitas. Escolha uma das seguintes strings permitidas: "alimentacao", "transporte", "hospedagem", "saude", "educacao", "entretenimento", "compras", "servicos", "outros".
7. "date": Retorne no formato "YYYY-MM-DD" da data da compra. Se disser "hoje", use a data atual. Se disser "ontem", use a data de ontem. Caso contrário, use a data atual.
   A data atual (hoje) é: ${new Date().toISOString().split('T')[0]}.
8. "description": Breve descrição em texto caso haja detalhes adicionais.

Retorne estritamente o JSON.`;

    const contents: any[] = [];
    if (audio) {
      const base64Str = audio.replace(/^data:audio\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          data: base64Str,
          mimeType: "audio/webm"
        }
      });
      contents.push(prompt + `\nO áudio acima contém o comando falado pelo usuário. Transcreva-o silenciosamente e processe o JSON resultante.`);
    } else {
      contents.push(`Texto falado: "${text}"\n` + prompt);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["entrada", "saida"] },
            flowType: { type: Type.STRING, enum: ["pessoal", "empresa"] },
            paymentMethod: { type: Type.STRING, enum: ["money_pix", "credit_card"] },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["amount", "type", "flowType", "paymentMethod"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(500).send({ 
       error: "Erro ao conectar aos Serviços de Voz do Gemini. " + error.message 
    });
  }
});

fastify.get('/api/expenses', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const { sort, limit } = request.query as any;
  return await prisma.expense.findMany({
    where: { userId: request.user.id },
    orderBy: { date: 'desc' },
    take: limit ? parseInt(limit) : 100
  });
});

import https from 'https';

function getExchangeRate(base: string, target: string): Promise<number> {
  return new Promise((resolve) => {
    https.get(`https://open.er-api.com/v6/latest/${base}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.rates?.[target] || 1.0);
        } catch { resolve(1.0); }
      });
    }).on('error', () => resolve(1.0));
  });
}

fastify.post('/api/expenses', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const data: any = request.body;
  const currencyCode = (data.currency || "BRL").toUpperCase();
  
  let rate = 1.0;
  if (currencyCode !== "BRL") {
    rate = await getExchangeRate(currencyCode, "BRL");
  }
  
  return await prisma.expense.create({
    data: {
      amount: parseFloat(data.amount) || 0.0,
      exchangeRate: rate,
      amountInBRL: (parseFloat(data.amount) || 0.0) * rate,
      currency: currencyCode,
      date: new Date(data.date || Date.now()),
      merchant: data.merchant,
      category: data.category || "outros",
      description: data.description,
      paymentMethod: data.paymentMethod || "money_pix",
      flowType: data.flowType || "pessoal",
      type: data.type || "saida",
      linkedCardId: data.linkedCardId || null,
      projectId: data.projectId || null,
      userId: request.user.id
    }
  });
});

fastify.post('/api/expenses/sync', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const expensesPayload = request.body as any[];
  
  const expensesToInsert = expensesPayload.map(data => {
      const currencyCode = (data.currency || "BRL").toUpperCase();
      const amountVal = parseFloat(data.amount) || 0.0;
      return {
          amount: amountVal,
          exchangeRate: 1.0, 
          amountInBRL: amountVal,
          currency: currencyCode,
          date: new Date(data.date || Date.now()),
          merchant: data.merchant,
          category: data.category || "outros",
          description: data.description,
          paymentMethod: data.paymentMethod || "money_pix",
          flowType: data.flowType || "pessoal",
          type: data.type || "saida",
          linkedCardId: data.linkedCardId || null,
          projectId: data.projectId || null,
          userId: request.user.id
      };
  });

  const saved = await prisma.expense.createMany({
      data: expensesToInsert
  });

  return { status: "Sync em Bulk concluída com sucesso ✅", count: saved.count };
});

// === 5. CARTÕES DE CRÉDITO CRUD ===
fastify.get('/api/credit-cards', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  return await prisma.creditCard.findMany({
    where: { userId: request.user.id }
  });
});

fastify.post('/api/credit-cards', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const data: any = request.body;
  return await prisma.creditCard.create({
    data: {
      name: data.name,
      limit: parseFloat(data.limit) || 0.0,
      closingDay: parseInt(data.closingDay) || 10,
      dueDay: parseInt(data.dueDay) || 20,
      userId: request.user.id
    }
  });
});

fastify.put('/api/credit-cards/:id', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const { id } = request.params as any;
  const data: any = request.body;
  return await prisma.creditCard.update({
    where: { id, userId: request.user.id },
    data: {
      name: data.name,
      limit: parseFloat(data.limit) || 0.0,
      closingDay: parseInt(data.closingDay) || 10,
      dueDay: parseInt(data.dueDay) || 20
    }
  });
});

fastify.delete('/api/credit-cards/:id', { preValidation: [(fastify as any).authenticate] }, async (request: any, reply: any) => {
  const { id } = request.params as any;
  return await prisma.creditCard.delete({
    where: { id, userId: request.user.id }
  });
});

fastify.get('/api/reports/export', { preValidation: [(fastify as any).authenticate] }, async (request, reply) => {
  return { download_url: "https://app/report-temp.pdf" }; 
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`🚀 FinanceiroApp Fastify Backend rodando na porta 3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
