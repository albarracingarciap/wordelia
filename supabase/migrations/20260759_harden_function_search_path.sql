-- Security Advisor (WARNINGS): "Function Search Path Mutable".
-- Fija un search_path explícito en las funciones de public para que una
-- search_path mutable no pueda redirigir referencias a objetos maliciosos
-- (riesgo real sobre todo en funciones SECURITY DEFINER). Idempotente.
--
-- IMPORTANTE: cada ALTER va en su propio bloque BEGIN/EXCEPTION. Si alguna
-- función de public no nos pertenece (p. ej. instalada por una extensión), su
-- ALTER falla pero NO aborta el resto (sin esto, un único fallo revertía toda la
-- transacción y no se aplicaba nada).
--
-- search_path = `public, extensions, pg_temp`: cubre las tablas de la app y las
-- funciones de extensiones sin romper referencias sin cualificar; pg_temp al
-- final (nunca al principio) por seguridad.

do $$
declare
    r record;
    n_ok  int := 0;
    n_err int := 0;
begin
    for r in
        select p.oid::regprocedure::text as sig
        from pg_proc p
        join pg_namespace nsp on nsp.oid = p.pronamespace
        where nsp.nspname = 'public'
          and p.prokind = 'f'   -- funciones (incluye funciones de trigger)
    loop
        begin
            execute format('alter function %s set search_path = public, extensions, pg_temp', r.sig);
            n_ok := n_ok + 1;
        exception when others then
            n_err := n_err + 1;
            raise notice 'search_path no aplicado en %: %', r.sig, sqlerrm;
        end;
    end loop;
    raise notice 'search_path fijado en % funciones (% omitidas por permisos u otros).', n_ok, n_err;
end $$;
