# Dockerfile (multi-stage)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .

# Vite bakes VITE_* env vars into the JS bundle at build time (import.meta.env),
# not at container runtime - they must come in as build args, not `environment:`.
ARG VITE_TENANT_ID
ARG VITE_SPA_CLIENT_ID
ARG VITE_API_SCOPE
ARG VITE_REDIRECT_URI
ARG VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
# MSAL needs the Web Crypto API (window.crypto.subtle) for PKCE, which browsers
# only expose in secure contexts (HTTPS or localhost) - plain HTTP over a public
# IP throws "BrowserAuthError: crypto_nonexistent" and the app never renders.
# Self-signed cert since there's no domain for a real one; browsers show a
# one-time warning to click through, but it still counts as a secure context.
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/selfsigned.key \
      -out /etc/nginx/ssl/selfsigned.crt \
      -subj "/CN=rutaexpress-frontend"
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 443
