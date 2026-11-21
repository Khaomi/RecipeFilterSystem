FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY app.json index.js tsconfig.json nativewind-env.d.ts ./
COPY frontend/ ./frontend/

ENV EXPO_NO_TELEMETRY=1
EXPOSE 8081

CMD ["pnpm", "exec", "expo", "start", "--web", "--port", "8081"]
