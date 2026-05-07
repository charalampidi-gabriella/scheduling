const KEYS = ['current_schedule', 'drafts', 'locks', 'requests', 'coaches', 'locations'];

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT key, value FROM kv WHERE key IN (${KEYS.map(() => '?').join(',')})`
  ).bind(...KEYS).all();

  const out = {};
  for (const k of KEYS) out[k] = null;
  for (const r of results) {
    try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = null; }
  }
  return Response.json(out, { headers: { 'cache-control': 'no-store' } });
}
