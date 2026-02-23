-- Añadir política de INSERT que faltaba para la tabla activity_feed
CREATE POLICY "Users can insert their own activity" 
    ON public.activity_feed 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
