## What this is
A full‑stack web application for Renault’s software development team: a NestJS (TypeScript) backend exposing a Postgres‑backed API and an Angular frontend served on localhost:4200. The backend manages Project objects and the frontend provides a simple UI to view and manage them.

### Stack
- **Language(s):** TypeScript (primary), HTML, CSS, JavaScript  
- **Framework / runtime:** NestJS 11 (backend) and Angular 22 (frontend)  
- **Notable libraries:** TypeORM (ORM), pg (Postgres driver), RxJS, Jest (backend tests), Vitest / Angular test tooling (frontend)

## How it's organized
```
backend/                      NestJS application (server-side)
  package.json                backend scripts, deps (nestjs, typeorm, pg, typescript, jest)
  README.md                   Nest starter README and run/test instructions
  src/
    main.ts                   app bootstrap (enables CORS for http://localhost:4200; listens on :3000)
    app.module.ts             TypeOrmModule.forRoot(...) with Postgres connection
    projects/
      projects.module.ts      Projects module wiring TypeORM entity + controller + service
      entities/
        project.entity.ts     Project entity (uygulamaAdi, canliUrl, feVersion, beVersion, custom_fields jsonb, createdAt, etc.)
      projects.controller.ts  API surface for projects
      projects.service.ts     business logic for projects
    auth/                     auth module
frontend/                     Angular single-page app (client-side)
  package.json                frontend scripts (ng serve, build, test)
  README.md                   Angular CLI usage and build/test instructions
  src/
    index.html
    main.ts                   Angular bootstrap
    proxy.conf.json           dev proxy config (likely forwards API calls to backend)
    styles.css
    app/                      Angular app code (components, services)
    assets/                   static assets
node_modules/                 installed deps (checked in)
package-lock.json             root lockfile
package.json                  (root/top-level manifest)
```

How it fits together:
- The NestJS backend (backend/src) runs on port 3000 and uses TypeORM to persist Project objects to a Postgres database. ProjectsModule registers the Project entity and exposes REST endpoints for CRUD operations.
- The Angular frontend (frontend/) runs with `ng serve` on port 4200; `proxy.conf.json` is present to forward API requests in development to the backend. User interactions in the UI call backend REST endpoints.

## How to run it
Backend (development)
```bash
cd backend
npm install
npm run start:dev     # NestJS watch mode — http://localhost:3000
```

Frontend (development)
```bash
cd frontend
npm install
npm start             # ng serve — http://localhost:4200
```

Tests
- Backend unit/e2e: from backend/ run `npm run test` and `npm run test:e2e`.  
- Frontend: from frontend/ run `npm run test` (Angular CLI / Vitest).

Notes on configuration (from code)
- DB connection is configured in backend/src/app.module.ts:
  - host: localhost, port: 5432, username: postgres, password: "mert", database: postgres
  - autoLoadEntities: true, synchronize: false
- CORS in backend/src/main.ts permits origin `http://localhost:4200` with credentials.
- `frontend/src/proxy.conf.json` exists to simplify local API calls.

## Docker Compose (local development)
If you'd like to run Postgres + backend + frontend together locally, you can add a docker-compose.yml and simple Dockerfiles for backend/frontend. Below are instructions and a minimal example you can drop into the repository.

1) Create a `.env` file at the repository root (do NOT commit secrets to public repos):

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mert
POSTGRES_DB=postgres
```

2) Example `docker-compose.yml` (place at repo root):

```yaml
version: "3.8"
services:
  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    depends_on:
      - db
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USERNAME: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_DATABASE: ${POSTGRES_DB}
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    depends_on:
      - backend
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
    command: npm start

volumes:
  db_data:
```

3) Minimal Dockerfiles
- backend/Dockerfile (development-friendly, mounts source and runs dev server):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

- frontend/Dockerfile (development-friendly):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
EXPOSE 4200
CMD ["npm", "start"]
```

Notes:
- The compose file uses bind mounts (`volumes: - ./backend:/app`) to make live code edits available inside containers (hot reload). This is convenient for development but not suitable for production images.
- The backend must be configured to read DB connection values from environment variables (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE). Currently app.module.ts appears to hardcode Postgres values — update it to use process.env or the NestJS ConfigModule if you run via Docker. I can provide a small patch to use ConfigModule/forRootAsync if you want.

Bring everything up:

```bash
# from repo root
docker compose up --build
# or (older docker-compose)
docker-compose up --build
```

Open the frontend at http://localhost:4200 and the backend at http://localhost:3000. The backend will talk to Postgres at the service name `db` inside the compose network.
