# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Only copy necessary files for runtime
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy custom server
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3001

# In production, we typically run the compiled server, 
# but for this setup we'll use ts-node for simplicity if dist is not targetted
CMD ["npx", "ts-node", "server.ts"]
