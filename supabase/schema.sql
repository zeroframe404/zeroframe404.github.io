create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tipo_formulario text not null check (tipo_formulario in ('cotizacion', 'contacto')),
  nombre text not null,
  telefono text not null,
  email text,
  tipo_vehiculo text,
  marca_modelo text,
  anio text,
  localidad text,
  uso text,
  cobertura_deseada text,
  motivo_contacto text,
  mensaje text,
  consentimiento boolean not null default false,
  source_page text not null
);

alter table public.leads enable row level security;

drop policy if exists "insert leads anon" on public.leads;
create policy "insert leads anon"
  on public.leads
  for insert
  to anon
  with check (true);
