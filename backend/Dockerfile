FROM python:3.15-alpine

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_NO_DEV=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock ./

COPY backend/pyproject.toml ./backend/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --package backend

COPY backend/ ./backend/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --package backend

ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "backend/src/main.py"]