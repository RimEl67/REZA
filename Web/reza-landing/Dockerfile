# --- Build stage ---
FROM node:18-alpine AS deps
WORKDIR /app
# Install dependencies based on lock file if present
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --legacy-peer-deps --no-fund --no-audit

FROM deps AS builder
COPY . .
RUN npm run build

# --- Production image ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
COPY --from=builder /app .
EXPOSE 80
CMD ["npm", "start"] 