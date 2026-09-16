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
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
