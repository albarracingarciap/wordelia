-- Permite que las server actions de admin (service role) regalen Wordix a un
-- usuario llamando a la función atómica credit_coins. El execute estaba revocado
-- a PUBLIC (el saldo solo se toca vía funciones security definer); aquí se lo
-- concedemos explícitamente a service_role, que es quien usa el admin client.
grant execute on function public.credit_coins(uuid, integer, text, text) to service_role;
