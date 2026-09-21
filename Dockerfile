FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source
COPY . .

# Generate Prisma client and build TypeScript backend and client
RUN npx prisma generate && npm run build
RUN cd client && npm run build

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run migrations and seed on startup
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]
