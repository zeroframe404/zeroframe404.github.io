-- CreateExtension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "CotizacionRoutingBranch" AS ENUM ('avellaneda', 'lanus', 'lejanos');

-- CreateEnum
CREATE TYPE "CotizacionRoutingStatus" AS ENUM ('resolved', 'fallback_invalid_cp', 'fallback_geocode_failed');

-- CreateTable
CREATE TABLE "routing_branches" (
    "key" "CotizacionRoutingBranch" NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_branches_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "postal_geocode_cache" (
    "id" UUID NOT NULL,
    "postal_code_normalized" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "formatted_address" TEXT,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postal_geocode_cache_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "cotizaciones"
ADD COLUMN "routing_branch" "CotizacionRoutingBranch" NOT NULL DEFAULT 'lejanos',
ADD COLUMN "routing_distance_km" DOUBLE PRECISION,
ADD COLUMN "routing_postal_code_normalized" TEXT,
ADD COLUMN "routing_latitude" DOUBLE PRECISION,
ADD COLUMN "routing_longitude" DOUBLE PRECISION,
ADD COLUMN "routing_provider" TEXT,
ADD COLUMN "routing_status" "CotizacionRoutingStatus" NOT NULL DEFAULT 'fallback_invalid_cp',
ADD COLUMN "routing_overridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "routing_overridden_by_user_id" UUID,
ADD COLUMN "routing_overridden_at" TIMESTAMP(3),
ADD COLUMN "routing_override_reason" TEXT;

-- CreateIndex
CREATE INDEX "routing_branches_is_active_idx" ON "routing_branches"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "postal_geocode_cache_postal_code_normalized_key" ON "postal_geocode_cache"("postal_code_normalized");

-- CreateIndex
CREATE INDEX "postal_geocode_cache_last_used_at_idx" ON "postal_geocode_cache"("last_used_at" DESC);

-- CreateIndex
CREATE INDEX "cotizaciones_routing_branch_idx" ON "cotizaciones"("routing_branch");

-- CreateIndex
CREATE INDEX "cotizaciones_routing_status_idx" ON "cotizaciones"("routing_status");

-- CreateIndex
CREATE INDEX "cotizaciones_routing_overridden_idx" ON "cotizaciones"("routing_overridden");

-- CreateIndex
CREATE INDEX "cotizaciones_routing_overridden_by_user_id_idx" ON "cotizaciones"("routing_overridden_by_user_id");

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_routing_overridden_by_user_id_fkey"
FOREIGN KEY ("routing_overridden_by_user_id") REFERENCES "admin_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed routing branches
INSERT INTO "routing_branches" ("key", "name", "latitude", "longitude", "is_active", "created_at", "updated_at")
VALUES
  ('avellaneda', 'Avellaneda', -34.64822919, -58.34735857, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lanus', 'Lanus', -34.71974598, -58.35957901, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
