DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum enum_values
    JOIN pg_type enum_types ON enum_types.oid = enum_values.enumtypid
    WHERE enum_types.typname = 'SiniestroTipo'
      AND enum_values.enumlabel = 'incendio'
  ) THEN
    ALTER TYPE "SiniestroTipo" ADD VALUE 'incendio';
  END IF;
END $$;
