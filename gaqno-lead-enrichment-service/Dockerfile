FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

ARG NPM_TOKEN
RUN if [ -n "$NPM_TOKEN" ]; then \
  printf '%s\n' "@gaqno-development:registry=https://npm.pkg.github.com" "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc; \
  fi
RUN --mount=type=cache,target=/root/.npm \
  npm config set fetch-timeout 1200000 && \
  npm config set fetch-retries 10 && \
  npm install --include=dev --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN --mount=type=cache,target=/root/.npm \
  npm config set fetch-timeout 1200000 && \
  npm config set fetch-retries 10 && \
  npm install --omit=dev --legacy-peer-deps --ignore-scripts

EXPOSE 4010
ENV PORT=4010
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:4010/" || exit 1

CMD ["node", "dist/main.js"]
