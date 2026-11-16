FROM python:3.15-alpine

ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --upgrade pip

COPY pyproject.toml .

RUN pip install .

COPY . .

CMD ["python", "src/main.py"]
