FROM node:22-bookworm AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=builder /app/.mastra/output ./
ENV NODE_ENV=production
ENV PORT=4111
ENV MASTRA_STUDIO_PATH=./studio
EXPOSE 4111
CMD ["node", "index.mjs"]
