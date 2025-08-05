-- Adicionar novas colunas na tabela prematurajustify
ALTER TABLE public.prematurajustify 
ADD COLUMN IF NOT EXISTS tipoenvio TEXT DEFAULT 'Email',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS analisado_por TEXT,
ADD COLUMN IF NOT EXISTS dataanalise TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_reprovacao TEXT;

-- Atualizar registros existentes que não têm status
UPDATE public.prematurajustify 
SET status = 'pendente' 
WHERE status IS NULL;

-- Atualizar registros existentes que não têm tipoenvio
UPDATE public.prematurajustify 
SET tipoenvio = 'Email' 
WHERE tipoenvio IS NULL;