import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackKey = process.env.PAYSTACK_SECRET_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  if (!url || !serviceKey || !paystackKey) return { statusCode: 503, body: JSON.stringify({ error: 'Payment service is not configured.' }) };
  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const reference = String(body.reference || '');
    const points = Number(body.points);
    if (!reference || !Number.isInteger(points) || points <= 0) return { statusCode: 400, body: JSON.stringify({ error: 'Valid reference and points are required' }) };
    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(auth.slice(7));
    if (userError || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    const verified = await response.json();
    if (!response.ok || !verified.status || verified.data?.status !== 'success') return { statusCode: 400, body: JSON.stringify({ error: 'Transaction verification failed' }) };

    const baseNaira = points * 10;
    const chargedNaira = Math.round(baseNaira * 1.02);
    const paidNaira = Number(verified.data.amount) / 100;
    const currency = String(verified.data.currency || '');
    const customerEmail = String(verified.data.customer?.email || '').toLowerCase();
    if (!Number.isFinite(paidNaira) || Math.round(paidNaira) !== chargedNaira || currency !== 'NGN') return { statusCode: 400, body: JSON.stringify({ error: 'Point purchase amount or currency does not match' }) };
    if (customerEmail && user.email && customerEmail !== user.email.toLowerCase()) return { statusCode: 400, body: JSON.stringify({ error: 'Payment customer does not match the authenticated account' }) };

    const { data: wallet, error } = await supabase.rpc('credit_purchased_points', {
      p_user_id: user.id, p_points: points, p_amount_ngn: baseNaira, p_reference: reference,
    });
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true, points, amountNgn: baseNaira, feeNgn: chargedNaira - baseNaira, chargedNgn: chargedNaira, currency, wallet }) };
  } catch (error: any) {
    console.error('Finalyzed Points verification error', error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || 'Internal server error' }) };
  }
};
