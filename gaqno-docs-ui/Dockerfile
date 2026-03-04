FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install --legacy-peer-deps

COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html/public 2>/dev/null || true

RUN echo 'server { listen 3020; server_name _; root /usr/share/nginx/html; index index.html; absolute_redirect off; try_files $uri $uri/ /index.html; location / { add_header Cache-Control "no-cache"; } location /assets/ { add_header Cache-Control "public, immutable"; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3020
CMD ["nginx", "-g", "daemon off;"]
