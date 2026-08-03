## What this is
A full‑stack web application for Renault’s software development team: a NestJS (TypeScript) backend exposing a Postgres‑backed API and an Angular frontend served on localhost:4200. The backend models “projects” (Project entity) and the frontend is an Angular app scaffolded with the Angular CLI.

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
- The NestJS backend (backend/src) runs on port 3000 and uses TypeORM to persist Project objects to a Postgres database. ProjectsModule registers the Project entity (backend/src/projects/entities/project.entity.ts) and exposes endpoints through its controller. main.ts enables CORS for the Angular dev server origin (http://localhost:4200).  
- The Angular frontend (frontend/) runs with `ng serve` on port 4200; `proxy.conf.json` is present to forward API requests in development to the backend. User interactions in the UI call backend REST endpoints, which read/write Postgres via TypeORM.

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
