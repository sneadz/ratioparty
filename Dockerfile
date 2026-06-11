FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm --filter shared build
RUN pnpm --filter client build
RUN pnpm --filter server build

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "apps/server/dist/index.js"]
