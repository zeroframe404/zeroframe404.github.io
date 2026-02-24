# Seguros Dock Sud

Sitio comercial + backend propio para cotizaciones, contacto, siniestros y dashboard admin.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL + Prisma
- Archivos siniestros: PostgreSQL (`bytea`) y opcional AWS S3
- Tests: Vitest + Testing Library

## Instalación

```bash
npm install
npm run prisma:generate
```

## Variables de entorno

Crear `.env` en la raíz usando `.env.example`.

Variables clave:

- Frontend:
  - `VITE_ADMIN_HIDDEN_PATH` (default recomendado: `Home/adminpanel`)
  - `VITE_API_BASE_URL` (vacío para usar mismo dominio)
  - `VITE_DEV_API_TARGET` (default: `http://localhost:8787`)
- Backend:
  - `DATABASE_URL`
  - `ADMIN_DASHBOARD_PASSWORD`
  - `COOKIE_SECRET`
  - `ADMIN_SESSION_TTL_HOURS`
  - `ADMIN_COOKIE_SAME_SITE` (`lax`, `strict`, `none`)
  - `CORS_ALLOWED_ORIGINS` (lista separada por coma)
  - `SINIESTRO_FILE_STORAGE` (`db`, `s3`, `dual`)
- S3 (solo requerido si SINIESTRO_FILE_STORAGE=s3|dual):
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `S3_BUCKET_SINIESTROS`
  - `S3_PUBLIC_BASE_URL` (opcional)
- Migración histórica (opcional):
  - `MIGRATION_SUPABASE_URL`
  - `MIGRATION_SUPABASE_SERVICE_KEY`

## Desarrollo local

En dos terminales:

1. Frontend
```bash
npm run dev
```

2. Backend API
```bash
npm run dev:server
```

El frontend usa proxy `/api` -> `VITE_DEV_API_TARGET`.

## Deploy con Docker Compose (Hostinger VPS)

Archivos usados:

- `docker-compose.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker/frontend.nginx.conf`
- `nginx/conf.d/default.conf`
- `certbot/www`
- `certbot/letsencrypt`

Pasos:

1. Crear `.env` desde `.env.example` y completar secretos:
   - `ADMIN_DASHBOARD_PASSWORD`
   - `COOKIE_SECRET`
   - `POSTGRES_PASSWORD`
2. Ajustar dominios en `nginx/conf.d/default.conf`.
3. Subir el repo al servidor.
4. Levantar contenedores:
```bash
docker compose up -d --build
```
5. Abrir puertos 80/443 en el firewall del VPS.

SSL con Let's Encrypt (opcional, recomendado):

1. Emitir certificado (reemplazar email y dominio si corresponde):
```bash
docker compose --profile ssl run --rm certbot certonly --webroot -w /var/www/certbot -d dmartinezseguros.com -d www.dmartinezseguros.com --email admin@dmartinezseguros.com --agree-tos --no-eff-email
```
2. Activar config SSL:
```bash
cp nginx/conf.d/default-ssl.conf.example nginx/conf.d/default.conf
docker compose restart nginx
```
3. Renovación manual:
```bash
docker compose --profile ssl run --rm certbot renew
docker compose restart nginx
```

Notas:

- Nginx público enruta `/` al frontend y `/api` al backend.
- El backend ejecuta `prisma db push` al iniciar para asegurar esquema en PostgreSQL.
- Si usas HTTPS, mantener `NODE_ENV=production` y revisar `ADMIN_COOKIE_SAME_SITE` según tu flujo.

## Deploy en Render (frontend + backend separados)

Backend (`Web Service`):

- Build command:
  - `npm ci && npm run prisma:generate && npx prisma db push --schema server/prisma/schema.prisma && npm run build:server`
- Start command:
  - `npm run start:server`
- Variables mínimas:
  - `DATABASE_URL` (internal de Render)
  - `ADMIN_DASHBOARD_PASSWORD`
  - `COOKIE_SECRET`
  - `ADMIN_SESSION_TTL_HOURS=8`
  - `ADMIN_COOKIE_SAME_SITE=none`
  - `CORS_ALLOWED_ORIGINS=https://<tu-frontend>.onrender.com,https://zeroframe404.github.io`
  - `SINIESTRO_FILE_STORAGE=db`

Frontend (`Static Site`):

- Build command:
  - `npm ci && npm run build`
- Publish directory:
  - `dist`
- Variables:
  - `VITE_API_BASE_URL=https://<tu-backend>.onrender.com`
  - `VITE_ADMIN_HIDDEN_PATH=Home/adminpanel`

## Prisma / PostgreSQL

```bash
npm run prisma:migrate
npm run prisma:generate
```

Schema principal: `server/prisma/schema.prisma`.

## Build

Frontend:

```bash
npm run optimize:images
npm run build
npm run preview
```

Backend:

```bash
npm run build:server
npm run start:server
```

## Endpoints principales

- `POST /api/forms/cotizaciones`
- `POST /api/forms/contacto`
- `POST /api/forms/siniestros/:tipo` (`choque|rotura|robo`, multipart)
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/dashboard?limit=500`

## Admin oculto

La URL del panel admin usa `HashRouter`:

- `/#/<VITE_ADMIN_HIDDEN_PATH>`
- ejemplo: `/#/Home/adminpanel`

La sesión admin se maneja con cookie HttpOnly (`admin_session`) emitida por backend Node.

## Migración histórica desde Supabase

Scripts disponibles:

1. Migrar leads históricos a PostgreSQL
```bash
npx tsx server/scripts/migrate-from-supabase.ts --dry-run
npx tsx server/scripts/migrate-from-supabase.ts
```

2. Rehost opcional de adjuntos legacy a S3
```bash
npx tsx server/scripts/rehost-attachments.ts --dry-run
npx tsx server/scripts/rehost-attachments.ts
```

## Tests

```bash
npm run test:run
```



