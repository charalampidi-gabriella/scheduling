// Same-origin coach pool: reads coaches + current_schedule from D1
// and returns per-facility/day morning + evening name lists.

export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(
    `SELECT key, value FROM kv WHERE key IN ('coaches', 'current_schedule')`
  ).all();

  let coaches = [], sched = {};
  for (const r of rows.results || []) {
    try {
      if (r.key === 'coaches') coaches = JSON.parse(r.value);
      if (r.key === 'current_schedule') sched = JSON.parse(r.value);
    } catch {}
  }

  const FACILITIES = ['satc', 'pharr', 'wilco'];
  const nameById = new Map(coaches.map(c => [c.id, c.name]));
  const out = {};
  for (const f of FACILITIES) {
    out[f] = {};
    for (let d = 0; d < 7; d++) out[f][d] = { morning: new Set(), evening: new Set() };
  }
  for (const [k, v] of Object.entries(sched || {})) {
    const [cid, day] = k.split('_').map(Number);
    const name = nameById.get(cid);
    if (!name) continue;
    for (const shift of ['morning', 'evening']) {
      const loc = v[shift];
      if (!loc || !out[loc]) continue;
      out[loc][day][shift].add(name);
    }
  }
  for (const f of FACILITIES) for (let d = 0; d < 7; d++) {
    out[f][d].morning = [...out[f][d].morning].sort();
    out[f][d].evening = [...out[f][d].evening].sort();
  }
  return Response.json(out, { headers: { 'cache-control': 'no-store' } });
}
