FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./

ENV EXPO_NO_TELEMETRY=1
EXPOSE 8081

CMD ["pnpm", "exec", "expo", "start", "--web", "--port", "8081"]
