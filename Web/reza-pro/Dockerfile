# Dockerfile for SaaS Frontend (saas) - Next.js Production Build
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN rm -rf node_modules package-lock.json 2>/dev/null || true && \
    npm install --legacy-peer-deps --no-fund --no-audit
COPY . .
ARG REACT_APP_API_URL=https://api.reza.ma
ARG REACT_APP_ENV=production
ARG NEXT_PUBLIC_API_URL=https://api.reza.ma/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ENV=$REACT_APP_ENV
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.reza.ma/api}
ENV NODE_ENV=production
RUN NEXT_PRIVATE_SKIP_TURBO=1 npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"
COPY --from=build /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps --no-fund --no-audit && \
    npm install typescript --save-dev --legacy-peer-deps --no-fund --no-audit
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.* ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["npm", "start"]
