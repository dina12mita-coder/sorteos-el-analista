-- ============================================================
-- Borrado lógico de boletos + historial de auditoría
-- Aplicar en el SQL editor de Supabase (o `supabase db push`).
-- ============================================================

-- 1) Columna de borrado lógico en boletos
ALTER TABLE public.boletos
  ADD COLUMN IF NOT EXISTS eliminado boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS boletos_eliminado_idx ON public.boletos (eliminado);

-- 2) Reemplazar el constraint único de numero por uno PARCIAL que solo
--    tenga en cuenta los boletos activos. Así un número liberado puede
--    volver a venderse sin chocar con el boleto eliminado lógicamente
--    que todavía conserva ese número.
DO $$
DECLARE
  r record;
BEGIN
  -- constraints únicos que referencian (numero)
  FOR r IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.boletos'::regclass AND contype = 'u'
  LOOP
    IF position('(numero)' in r.def) > 0 AND position('eliminado' in r.def) = 0 THEN
      EXECUTE format('ALTER TABLE public.boletos DROP CONSTRAINT %I', r.conname);
    END IF;
  END LOOP;
  -- índices únicos sin constraint que referencian (numero)
  FOR r IN
    SELECT indexrelid::regclass::text AS name, pg_get_indexdef(indexrelid) AS def
    FROM pg_index
    WHERE indrelid = 'public.boletos'::regclass AND indisunique AND NOT indisprimary
  LOOP
    IF position('(numero)' in r.def) > 0 AND position('eliminado' in r.def) = 0 THEN
      EXECUTE 'DROP INDEX ' || r.name;
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS boletos_numero_activo_idx
  ON public.boletos (numero)
  WHERE eliminado = false;

-- 3) Tabla de auditoría. boleto_id es texto (sin FK) para funcionar con
--    cualquier tipo de id de la tabla boletos.
CREATE TABLE IF NOT EXISTS public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id text,
  numero integer,
  accion text NOT NULL,
  detalle text,
  usuario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auditoria_boleto_idx ON public.auditoria (boleto_id);
CREATE INDEX IF NOT EXISTS auditoria_created_idx ON public.auditoria (created_at DESC);

-- 4) Realtime: publicar boletos, pagos y auditoría para que el cartón y el
--    historial se actualicen en vivo entre dispositivos.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boletos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pagos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.auditoria;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
