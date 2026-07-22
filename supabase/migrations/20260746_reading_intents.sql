-- Separa las "intenciones" del onboarding (descubrir libros, unirse a clubes…) de
-- las metas estructuradas del perfil (profiles.goals). Antes ambas colisionaban en
-- profiles.goals. El objetivo anual de libros pasa a ser único en reading_goals.
-- Ejecutar una vez.

alter table public.profiles add column if not exists reading_intents jsonb;

-- Migra intenciones ya guardadas como array plano en profiles.goals a la nueva
-- columna, y limpia profiles.goals (para que quede como objeto de metas).
update public.profiles
   set reading_intents = goals,
       goals = null
 where jsonb_typeof(goals) = 'array';
