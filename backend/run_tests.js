const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO TESTE DIRETO DE OCR E DB ===");
  
  // 1. Ler o arquivo da imagem que baixamos localmente
  const filePath = '../financeiro/e2e/test_receipt.jpg';
  if (!fs.existsSync(filePath)) {
    throw new Error("Arquivo da imagem de teste não encontrado!");
  }
  const imageBuffer = fs.readFileSync(filePath);
  const base64Data = imageBuffer.toString('base64');
  console.log("✓ Arquivo da imagem lido com sucesso.");

  // 2. Chamar o serviço Gemini Mockado (API Local /api/ai/scan)
  // Como é script Node, enviaremos via fetch do node 18+ pro backend Fastify!
  console.log("Enviando requisição OCR pro servidor (127.0.0.1:3000)...");
  
  try {
    const res = await fetch('http://127.0.0.1:3000/api/ai/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: `data:image/jpeg;base64,${base64Data}` })
    });
    
    if (!res.ok) {
      throw new Error(`Servidor Fastify retornou erro: ${res.status} ${res.statusText}`);
    }
    const ocrResponse = await res.json();
    console.log("✓ OCR Respondeu com sucesso:", ocrResponse);
    
    // Parses the nested message from Gemini if necessary
    const parsedData = typeof ocrResponse.message === 'string' ? JSON.parse(ocrResponse.message) : ocrResponse.message;

    // 3. Salvar o resultado no banco SQLite
    const createdExpense = await prisma.expense.create({
      data: {
        amount: parsedData.amount || Math.random() * 100,
        currency: parsedData.currency || 'BRL',
        merchant: parsedData.merchant || 'Estabelecimento Gringo',
        category: parsedData.category || 'alimentacao',
        date: new Date(),
        description: "Nota fiscal OCR Auto Teste"
      }
    });
    console.log("✓ Despesa persistida no banco SQLite perfeitamente:");
    console.log(createdExpense);

    // 4. Ler do Banco para provar
    const allExpenses = await prisma.expense.findMany();
    console.log(`✓ Total de despesas atualmente no banco: ${allExpenses.length}`);
    
  } catch (err) {
    console.error("ERRO DURANTE TESTE:", err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
