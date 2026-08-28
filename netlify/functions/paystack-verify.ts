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
    const projectId = String(body.projectId || '');
    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(auth.slice(7));
    if (userError || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
    if (!reference || !projectId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };

    const { data: project, error: projectError } = await supabase.from('projects').select('id,student_id,price_ngn,status').eq('id', projectId).maybeSingle();
    if (projectError) throw projectError;
    if (!project || project.student_id !== user.id) return { statusCode: 404, body: JSON.stringify({ error: 'Project not found' }) };
    if (!['draft','payment_pending'].includes(String(project.status))) return { statusCode: 409, body: JSON.stringify({ error: 'This project is not awaiting payment' }) };

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    const verified = await response.json();
    if (!response.ok || !verified.status || verified.data?.status !== 'success') return { statusCode: 400, body: JSON.stringify({ error: 'Transaction verification failed' }) };
    const paidNaira = Number(verified.data.amount) / 100;
    const currency = String(verified.data.currency || '');
    const customerEmail = String(verified.data.customer?.email || '').toLowerCase();
    if (!Number.isFinite(paidNaira) || Math.round(paidNaira) !== Number(project.price_ngn) || currency !== 'NGN') return { statusCode: 400, body: JSON.stringify({ error: 'Payment amount or currency does not match the project' }) };
    if (customerEmail && user.email && customerEmail !== user.email.toLowerCase()) return { statusCode: 400, body: JSON.stringify({ error: 'Payment customer does not match the authenticated account' }) };

    const { data: payment, error: rpcError } = await supabase.rpc('record_verified_project_payment', {
      p_project_id: project.id, p_student_id: user.id, p_reference: reference,
      p_amount_ngn: Math.round(paidNaira),
      p_metadata: { currency, paystack_transaction_id: verified.data?.id ?? null },
    });
    if (rpcError) throw rpcError;
    return { statusCode: 200, body: JSON.stringify({ success: true, reference, amount: paidNaira, currency, paymentId: payment?.id }) };
  } catch (error: any) {
    console.error('Paystack project verification error', error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || 'Internal server error' }) };
  }
};
