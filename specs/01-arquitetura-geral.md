# Arquitetura e Engenharia do Sistema: FabiApp

## 1. Visão Geral
Como toda a infraestrutura "Base44" (Backend de "caixa preta") será substituída por um ecossistema próprio e o Frontend será empacotado como um app nativo para as lojas, o sistema será dividido em duas camadas principais:

### Camada 1: O Aplicativo (Client / MobileApp)
* **Status Atual:** É uma aplicação Web feita em React + Vite.
* **Futuro:** Será convertido para um aplicativo mobile híbrido instalável utilizando o **Capacitor**.
* **Responsabilidades:** Cuidar unica e exclusivamente da Interface de Usuário (UI), navegação (UX), captura da câmera do dispositivo, leitura do armazenamento local seguro e disparo da comunicação via API REST.

### Camada 2: O Backend Próprio (Servidor)
* **Status Atual:** Inexistente (era terceirizado pela Base44).
* **Futuro:** Uma API customizada, performática, segura e que concentra a regra de negócio do app (Banco de Dados, Autenticação, AI e Regras Financeiras).
* **Responsabilidades:** Lidar com requisições, armazenar dados seguros, hospedar as imagens dos recibos no Storage e fazer a ponte com os modelos inteligêntes de IA para OCR.

## 2. Proposta da Stack Tecnológica (Backend Próprio)
Como o App Atual foi todo feito em Ecossistema JavaScript (React), sugere-se a padronização do Backend na mesma linguagem para reaproveitamento de conhecimento:

* **Linguagem:** TypeScript / Node.js
* **Framework Web:** Fastify ou NestJS (altamente modularizados e performáticos para subida em servidores).
* **Banco de Dados (ORM):** PostgreSQL com **Prisma ORM**. (Uma base relacional SQL é ideal para assegurar as integridades das categorias e valores financeiros dos usuários).
* **File Storage (Armazenamento de Imagens):** Amazon S3 (AWS) ou Cloudflare R2 (Mais barato e sem taxa de saída - ideal para hospedar os JPEGs das notas fiscais).
* **Inteligência Artificial (IA OCR):** OpenAI API (Modelo `gpt-4o-mini` ou `gpt-4o` para Visão) ou Anthropic (Claude 3 Haiku). São muito acessíveis e perfeitos pra extração de JSON em imagens curtas.
* **Hospedagem:** Render, Railway ou Fly.io para deploy automatizado e rápido, ou VPS próprio (AWS EC2 / DigitalOcean).
