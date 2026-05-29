import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  const { error } = await supabase
    .from('keep_alive')
    .update({ last_ping: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({
    ok: true,
    message: 'Supabase activo',
    date: new Date().toISOString(),
  });
}