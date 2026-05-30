FROM node:20-slim

# Install OpenSSL for Prisma compatibility in Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Start server using ts-node
CMD ["npm", "run", "dev"]
