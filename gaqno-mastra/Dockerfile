FROM node:22-bookworm AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY .npmrc* ./
ARG NPM_TOKEN
RUN if [ -n "$NPM_TOKEN" ]; then \
  printf '%s\n' "@gaqno-development:registry=https://npm.pkg.github.com" "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc; \
  fi
RUN --mount=type=cache,target=/root/.npm \
  npm config set fetch-timeout 1200000 && \
  npm config set fetch-retries 10 && \
  npm ci --legacy-peer-deps
ARG GAQNO_CACHE_BUST
RUN npm update @gaqno-development/mastra-runtime --legacy-peer-deps 2>/dev/null || true
RUN rm -f .npmrc

COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=builder /app/.mastra/output ./
ENV NODE_ENV=production
ENV PORT=4111
ENV MASTRA_STUDIO_PATH=./studio
ENV MASTRA_AUTO_DETECT_URL=true
EXPOSE 4111
CMD ["node", "index.mjs"]
