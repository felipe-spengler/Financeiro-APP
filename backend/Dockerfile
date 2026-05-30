FROM node:20-alpine

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

# Start server using ts-node (simple and works perfectly out of the box with the ts-node configuration)
CMD ["npm", "run", "dev"]
