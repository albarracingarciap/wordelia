/**
 * Utilidad para consultas `.in()` con listas largas de ids.
 *
 * PostgREST filtra `.in("col", ids)` metiendo todos los valores en la query
 * string de un GET. Contra el proxy self-hosted (supabase.wordelia.es) una lista
 * larga de UUIDs desborda el límite de longitud de URL y devuelve HTTP 414
 * "URI too long" (empíricamente ~209 UUIDs ≈ 8KB). Troceamos la lista en lotes
 * para que la URL siempre quepa.
 *
 * El caller construye la query para cada lote (así funciona con cualquier tabla,
 * columnas, filtros extra .eq(), y cualquier cliente Supabase). Semántica
 * all-or-nothing como una query única: si un lote falla, se devuelve ese error y
 * data=null; si no, data = concatenación de todos los lotes.
 */
export async function selectInChunks<T = unknown, E = unknown>(
    ids: string[],
    runChunk: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: E | null }>,
    chunkSize = 100,
): Promise<{ data: T[] | null; error: E | null }> {
    if (ids.length === 0) return { data: [], error: null };

    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));

    const results = await Promise.all(chunks.map(runChunk));

    const data: T[] = [];
    for (const r of results) {
        if (r.error) return { data: null, error: r.error };
        if (r.data) data.push(...r.data);
    }
    return { data, error: null };
}
