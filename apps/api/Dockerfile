# Obraz API (NestJS). Kontekst budowania: katalog główny repo.
#   docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN npm install -g pnpm@12.16.1
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

FROM base AS build
RUN pnpm install --frozen-lockfile --filter api
COPY apps/api apps/api
RUN pnpm --filter api build

FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod --filter api

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/
COPY apps/api/drizzle ./apps/api/drizzle
WORKDIR /repo/apps/api
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
