FROM python:3.15-alpine

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_NO_DEV=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml uv.lock ./

COPY frontend/pyproject.toml ./frontend/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --package frontend

COPY frontend/ ./frontend/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --package frontend

ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "frontend/src/main.py"]