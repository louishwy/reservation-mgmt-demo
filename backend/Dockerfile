FROM node:18 AS builder
WORKDIR /app

# Install deps and build
COPY backend/package*.json backend/tsconfig.json ./
COPY backend/ ./
RUN npm ci
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy production package manifest and built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN sed -i 's/\r$//' ./docker-entrypoint.sh && \
    chmod +x ./docker-entrypoint.sh

# Install only production deps
RUN npm ci --only=production

EXPOSE 4000
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
