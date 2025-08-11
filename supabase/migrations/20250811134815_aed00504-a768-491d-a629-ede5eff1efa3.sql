-- Add password_hash for custom auth and set default UUID for profiles.id
-- Safe-guard: only add column if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password_hash text;

-- Set default for id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
      AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.profiles
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Optional: ensure is_active has a default true (already present but keep idempotent)
ALTER TABLE public.profiles
ALTER COLUMN is_active SET DEFAULT true;

-- Note: We intentionally avoid creating a UNIQUE constraint on email to prevent migration failures if duplicates exist.
-- You can add it later after cleaning duplicates:
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_key ON public.profiles ((lower(email)));