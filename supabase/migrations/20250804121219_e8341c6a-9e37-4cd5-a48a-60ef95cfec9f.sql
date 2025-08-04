-- Enable Row Level Security on prematurajustify table
ALTER TABLE public.prematurajustify ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view all records
CREATE POLICY "Authenticated users can view all prematurajustify records" 
ON public.prematurajustify 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for authenticated users to insert records
CREATE POLICY "Authenticated users can insert prematurajustify records" 
ON public.prematurajustify 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy for authenticated users to update records
CREATE POLICY "Authenticated users can update prematurajustify records" 
ON public.prematurajustify 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete records
CREATE POLICY "Authenticated users can delete prematurajustify records" 
ON public.prematurajustify 
FOR DELETE 
TO authenticated 
USING (true);