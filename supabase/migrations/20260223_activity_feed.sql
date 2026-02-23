-- Tabla para almacenar los eventos del feed global de la comunidad
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de actividad: 'review', 'debate', 'start_reading', 'quote', etc.
    activity_type VARCHAR(50) NOT NULL,
    
    -- Qué acción en crudo ha hecho el usuario (ej: "Ha dejado 5 estrellas a 'Dune'.")
    content TEXT NOT NULL,
    
    -- Subtexto opcional (ej: el inicio de la reseña, o el texto de una cita)
    subtext TEXT,
    
    -- Metadatos obligatorios u opcionales según el tipo (libro_id, club_id, nota_id, etc.)
    -- Usamos JSONB porque cada tipo de evento requiere un enlace distinto
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp para ordenar el muro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para almacenar los "Me gusta" o interacciones rápidas de los usuarios sobre las actividades
CREATE TABLE IF NOT EXISTS public.activity_likes (
    activity_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (activity_id, user_id)
);

-- Políticas RLS (Row Level Security) básicas
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios logueados pueden ver el feed de actividad global
CREATE POLICY "Anyone can view activity feed" 
    ON public.activity_feed 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Un usuario puede ver quién ha dado like a qué
CREATE POLICY "Anyone can view activity likes" 
    ON public.activity_likes 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Un usuario solo puede borrar/gestionar sus propios likes
CREATE POLICY "Users can manage their own likes" 
    ON public.activity_likes 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Opcional de cara al futuro: Un trigger o función RPC para insertar en `activity_feed` 
-- de manera centralizada una vez que se haga una acción en otra tabla (ej: al crear reseña)
