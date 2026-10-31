# ==============================================================================
# Production Dockerfile for Railway & Cloud Deployments
# Avaliador de Atendimento & Ranking de Encantamento
# ==============================================================================

# STAGE 1: Build frontend assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies for build
RUN npm ci

# Copy source files
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src

# Build production frontend bundle
RUN npm run build

# STAGE 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies needed for server runtime
RUN npm ci

# Copy application server and built frontend distribution
COPY server.ts tsconfig.json ./
COPY src ./src
COPY --from=builder /app/dist ./dist

# Ensure persistent data directory exists with write permissions
RUN mkdir -p /app/.data && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "start"]
