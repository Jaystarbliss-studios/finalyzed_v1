import type { Config, Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const config: Config = { schedule: '*/10 * * * *' };

const handler: Handler = async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.FINALYZED_FROM_EMAIL || 'Finalyzed <onboarding@resend.dev>';

  if (!url || !serviceKey || !resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email worker environment is not configured.' }) };
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rows, error } = await supabase
    .from('email_outbox')
    .select('id,email,subject,body,attempts')
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(25);

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

  let sent = 0;
  for (const row of rows || []) {
    const { error: sending } = await supabase.from('email_outbox').update({
      status: 'sending',
      attempts: Number(row.attempts || 0) + 1
    }).eq('id', row.id).eq('status', 'queued');

    if (sending) continue;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [row.email],
          subject: row.subject,
          text: row.body
        })
      });
      if (!response.ok) throw new Error(await response.text());
      await supabase.from('email_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', row.id);
      sent++;
    } catch (err) {
      await supabase.from('email_outbox').update({
        status: Number(row.attempts || 0) + 1 >= 5 ? 'failed' : 'queued',
        last_error: err instanceof Error ? err.message : 'Email send failed',
        scheduled_for: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      }).eq('id', row.id);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ processed: rows?.length || 0, sent }) };
};

export { handler };