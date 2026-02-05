FROM node:20-alpine AS base
RUN apk add --no-cache git libc6-compat

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 1200000 && \
    npm config set fetch-retries 10 && \
    npm install --legacy-peer-deps --include=dev

COPY . .
RUN mkdir -p public
RUN npm run build

FROM nginx:alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html/public

RUN echo 'server { listen 3012; server_name _; root /usr/share/nginx/html; index index.html; absolute_redirect off; \
    location /warehouse/assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; } \
    location /assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; } \
    location /warehouse/ { try_files $uri $uri/ /index.html; } \
    location / { return 302 /warehouse/; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3012
CMD ["nginx", "-g", "daemon off;"]
