const ALLOWED = new Set(['current_schedule', 'drafts', 'locks', 'requests']);

export async function onRequestPut({ params, request, env }) {
  const key = params.key;
  if (!ALLOWED.has(key)) {
    return new Response('Unknown key', { status: 400 });
  }

  let bodyText;
  try {
    bodyText = await request.text();
    JSON.parse(bodyText); // validate it's JSON
  } catch {
    return new Response('Body must be valid JSON', { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(key, bodyText).run();

  return Response.json({ ok: true });
}

export async function onRequestGet({ params, env }) {
  const key = params.key;
  if (!ALLOWED.has(key)) return new Response('Unknown key', { status: 400 });
  const row = await env.DB.prepare('SELECT value FROM kv WHERE key = ?').bind(key).first();
  if (!row) return Response.json(null);
  try { return Response.json(JSON.parse(row.value)); }
  catch { return Response.json(null); }
}
