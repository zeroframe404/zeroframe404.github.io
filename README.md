# Seguros Dock Sud - Clon Base44

Sitio comercial para seguros de autos y motos en Dock Sud, Argentina.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router (`HashRouter`)
- Supabase (captura de leads)
- Vitest + Testing Library

## Instalación

```bash
npm install
```

## Variables de entorno

Crear `.env` en la raíz usando `.env.example` como guía:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WHATSAPP_NUMBER=5491100000000
VITE_CONTACT_PHONE=+54 9 11 0000-0000
VITE_CONTACT_EMAIL=contacto@segurosdocksud.com
```

## Ejecutar en local

```bash
npm run dev
```

## Build de producción

```bash
npm run optimize:images
npm run build
npm run preview
```

## Cache local (cookies + storage)

El sitio incluye cache local para acelerar visitas repetidas:

- `Service Worker` (`public/sw.js`) para cachear assets estáticos.
- Snapshot de todas las páginas navegadas en `localStorage` con metadatos en cookie:
  - cookie: `sd_page_cache_meta`
  - almacenamiento: `sd:page-cache:1:*`
- Prefetch en segundo plano de todas las secciones y formularios lazy tras el primer ingreso.

## Tests

```bash
npm run test:run
```

## Rutas

Con `HashRouter`:

- `/#/Home`
- `/#/Cotizacion`
- `/#/Coberturas`
- `/#/Siniestros`
- `/#/Nosotros`
- `/#/Contacto`

## Supabase

La tabla y políticas están en:

- `supabase/schema.sql`

Aplicar ese script en tu proyecto Supabase antes de usar formularios en producción.

## Deploy en hosting genérico

Este proyecto usa `HashRouter`, por lo que no requiere reglas de rewrite del servidor.

Pasos mínimos:

1. Ejecutar `npm run build`.
2. Subir el contenido de `dist/` a tu hosting.
3. Configurar variables de entorno en el provider (si compila en CI/CD).
