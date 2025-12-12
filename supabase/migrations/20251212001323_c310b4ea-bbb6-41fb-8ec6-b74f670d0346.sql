-- Create table for saved simulations
CREATE TABLE public.saved_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('goal', 'contribution')),
  name TEXT NOT NULL,
  initial_value NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC,
  monthly_contribution NUMERIC,
  years NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  result NUMERIC NOT NULL,
  total_invested NUMERIC,
  earnings NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own simulations" 
ON public.saved_simulations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulations" 
ON public.saved_simulations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations" 
ON public.saved_simulations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations" 
ON public.saved_simulations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_simulations_updated_at
BEFORE UPDATE ON public.saved_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();