-- Create configuracoes table for system settings
CREATE TABLE public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_aprovacao TEXT,
  webhook_reprovacao TEXT,
  webhook_notificacao_cliente TEXT,
  webhook_callback TEXT,
  ambiente_banco TEXT DEFAULT 'public',
  schema_atual TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin master can view configuracoes" 
ON public.configuracoes 
FOR SELECT 
USING (true);

CREATE POLICY "Admin master can insert configuracoes" 
ON public.configuracoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin master can update configuracoes" 
ON public.configuracoes 
FOR UPDATE 
USING (true);

CREATE POLICY "Admin master can delete configuracoes" 
ON public.configuracoes 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.configuracoes (
  webhook_aprovacao,
  webhook_reprovacao,
  webhook_notificacao_cliente,
  webhook_callback,
  ambiente_banco,
  schema_atual
) VALUES (
  '',
  '',
  '',
  '',
  'public',
  'public'
);