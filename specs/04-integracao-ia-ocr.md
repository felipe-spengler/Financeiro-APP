# Integração da Inteligência Artificial (OCR e LLM)

Com foco financeiro e robustez visual de recibos avariados sob a câmera, a integração exige ser feita exclusivamente no lado de servidor (Backend Node.js). 

## 1. O Fluxo de Transação AI
1. **O Usuário no Celular** clica no ícone da câmera. Tira a foto usando a API do Capacitor Camera. Converte a foto nativa em binário.
2. **O Aplicativo Front-End** aciona rota `/api/upload/receipt`.
3. **O Backend Node** armazena num Bucket Seguro e adquire uma URL pública/assinada expirábil.
4. **O Backend Node** inicia a chamada para API Vision da OpenAI passando a URL da Imagem e um prompt de enquadramento contendo formato Forçado em JSON.
5. **O modelo extraí e responde.**
6. **O Backend** repassa essas respostas ao APP para o usuário conferir na tela `.jsx` se a IA não "alucinou".

## 2. Abordagem Code Prompt Sugerida

A OpenAI provê o "JSON_MODE" ou as "Function Calling Tools" que garantem que nunca virão textos jogados quebrando a tela, e sempre um payload idêntico no padrão. Exemplo da nova integração pelo lado Backend:

```typescript
// Exemplo em API com "OpenAI SDK" oficial.
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini", // Muito barato, ágil, tem suporte muito superior em português
  messages: [
    {
      role: "system",
      content: `Você é um analista fiscal preciso. Olhe a nota fiscal, extraia dados. Retorne estritamente um código puro de objeto JSON neste formato esquemático: { amount: Number, date: "YYYY-MM-DD", merchant: String, category: String, tax_amount: Number, description: String }. 
      Regras Categoria: As únicas permitidas são: "alimentacao", "transporte", "hospedagem", "outros" etc.`
    },
    {
      role: "user",
      content: [
         { type: "text", text: "Processe tudo nesta imagem de recibo fiscal/nfe." },
         { type: "image_url", image_url: { url: imagemUrlDoS3DaNuvem } }
      ]
    }
  ],
  response_format: { type: "json_object" }
});
```

*Importante*: É crucial implementar um bloco de tratamento `Try/Catch` se a OpenAI esbarrar em erro de *Timeout* por excesso de requisição, alertando amigavelmente ao usuário: *"Erro ao conectar os Serviços de Leitura Mágica. Por favor, adicione na forma manual enquanto as coisas carregam".*
