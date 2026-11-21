# RepoRabbit — Frontend

Astro + React islands + Tailwind CSS v4. Dark-only, Linear-style UI.

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Configuration

Copy `.env.example` to `.env` and set `PUBLIC_API_URL` to the FastAPI
backend base URL (default `http://localhost:8000`). When the backend is
unreachable the UI falls back to clearly labelled sample data.
