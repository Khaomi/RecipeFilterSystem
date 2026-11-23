# Database

This is a base for our database project

## Presentation & Demo Video

**Presentation Video:** [Database Project Presentation](https://youtu.be/7tIoXY2wpqQ)

## How to run

- Copy `.env.example` and rename it to `.env`.
- Fill in the value inside `.env`
- Choose one of the configuration below

### Production

```bash
docker compose up -f compose.yml -d
```

> [!IMPORTANT]
> `-f compose.yml` IS IMPORTANT AND REQUIRED.
> Without that flag, it will run the development file (due to how Docker handle merging compose).

### Development

> [!IMPORTANT]
> ONLY USE THIS FOR DEVELOPMENT!
> This one will restart the container everytime a file in `src` got changed, and rebuild the image everytime `pyproject.toml` got changed.

```bash
docker compose watch
```

Run only one `docker compose watch` process for this project. If a rapid
`pyproject.toml` edit leaves a stale container-name conflict, clean up the
development containers and start the watcher again:

```bash
docker compose down --remove-orphans
docker compose watch
```

The development override disables automatic container restarts so Compose
Watch can stop and recreate services without competing with Docker's restart
policy.

## Note

Backend should ALWAYS listen on port 8000.
