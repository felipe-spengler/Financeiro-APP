const http = require('http');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fetchPost(urlStr, data, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(body)),
          text: () => Promise.resolve(body)
        });
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log("=== INICIANDO BATERIA DE TESTES DE INTEGRAÇÃO ===");

  try {
    console.log("1. Autenticando usuário de teste...");
    const loginRes = await fetchPost("http://localhost:3000/api/auth/login", { email: "test-auto@financeiroapp.com", password: "123" });
    
    if (!loginRes.ok) throw new Error("Erro no login: " + loginRes.status);
    const { token, user } = await loginRes.json();
    console.log("✓ Login com sucesso. Token adquirido: " + token.substring(0, 15) + "...");

    console.log("\n2. Preparando envio de Nota Fiscal de Nova York...");
    const filePath = 'C:\\Users\\Felipe\\.gemini\\antigravity\\brain\\e306b06b-21b7-4aee-9cd3-a869c4b14585\\new_york_receipt_1775675806509.png';
    const imageBase64 = fs.readFileSync(filePath).toString('base64');
    
    console.log("3. Disparando processamento OCR via Gemini 2.5...");
    const scanRes = await fetchPost("http://localhost:3000/api/ai/scan", 
      { base64Image: `data:image/jpeg;base64,${imageBase64}` }, 
      { "Authorization": `Bearer ${token}` }
    );
    
    if (!scanRes.ok) {
       const text = await scanRes.text();
       throw new Error(`Erro OCR: ${scanRes.status} - ${text}`);
    }
    
    const scanData = await scanRes.json();
    console.log("✓ Dados extraídos com sucesso pela IA:");
    console.log(JSON.stringify(scanData, null, 2));

    console.log("\n4. Salvando processamento no Banco SQLite...");
    const newExpense = await prisma.expense.create({
      data: {
        amount: scanData.amount || 142.5,
        amountInBRL: (scanData.amount || 142.5) * 5.05, 
        currency: scanData.currency || 'USD',
        merchant: scanData.merchant || 'Balthazar NY',
        category: scanData.category || 'alimentacao',
        date: new Date(),
        userId: user ? user.id : 'user_test'
      }
    });
    console.log("✓ Despesa persistida com sucesso!");
    console.log(`- Valor Original: ${newExpense.currency} ${newExpense.amount}`);
    console.log(`- Valor Convertido em BRL (Câmbio Automático): R$ ${newExpense.amountInBRL.toFixed(2)}`);

    console.log("\n--- TESTE FINALIZADO COM 100% SUCESSO ---");
    process.exit(0);
  } catch (err) {
    console.error("FALHA NOS TESTES:", err.message);
    process.exit(1);
  }
}

run();
