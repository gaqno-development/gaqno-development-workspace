FROM node:20-alpine AS base
RUN apk add --no-cache git libc6-compat

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY .npmrc* ./
ARG NPM_TOKEN
ARG VITE_SERVICE_DROPSHIPPING_ADMIN_URL=http://localhost:4011
ENV VITE_SERVICE_DROPSHIPPING_ADMIN_URL=$VITE_SERVICE_DROPSHIPPING_ADMIN_URL
RUN if [ -z "$NPM_TOKEN" ] || [ "$NPM_TOKEN" = "REPLACE_WITH_GITHUB_PAT_IN_COOLIFY_UI" ]; then \
    echo "ERROR: NPM_TOKEN must be set in Coolify Build Arguments (GitHub PAT with read:packages)."; exit 1; \
    fi && \
    printf '%s\\n' "@gaqno-development:registry=https://npm.pkg.github.com" "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc
ENV NODE_ENV=development
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 1200000 && \
    npm config set fetch-retries 10 && \
    npm install --legacy-peer-deps --include=dev

COPY . .
RUN mkdir -p public && \
    (find node_modules -name useDialogForm.ts -exec sed -i.bak '/@ts-expect-error/d' {} \; -exec rm -f {}.bak \; 2>/dev/null || true) && \
    npm run build

FROM nginx:alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html/public

RUN echo 'server { listen 3017; server_name _; root /usr/share/nginx/html; index index.html; absolute_redirect off; \
    location /dropshipping-admin/assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; } \
    location /assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; } \
    location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3017
CMD ["nginx", "-g", "daemon off;"]
