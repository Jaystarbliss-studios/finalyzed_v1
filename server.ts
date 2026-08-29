import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient, type User } from '@supabase/supabase-js';

type ProjectRow = {
  id: string;
  student_id: string;
  title: string;
  plan: 'basic' | 'standard' | 'premium';
  status: string;
  price_ngn: number;
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let adminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

async function requireAuth(req: express.Request): Promise<User> {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const token = header.slice('Bearer '.length);
  const client = getSupabaseAdmin();
  if (!client) throw new Error('SERVER_NOT_CONFIGURED');
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHENTICATED');
  return data.user;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    const client = getSupabaseAdmin();
    if (!client) return res.status(503).json({ status: 'degraded', database: 'not_configured' });
    const { error } = await client.from('profiles').select('id').limit(1);
    if (error) return res.status(503).json({ status: 'degraded', database: 'unavailable' });
    return res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  });

  app.post('/api/paystack/verify', async (req, res) => {
    const { reference, projectId } = req.body as { reference?: string; projectId?: string };
    if (!reference || !projectId) return res.status(400).json({ error: 'Missing required fields' });
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const client = getSupabaseAdmin() as any;
    if (!paystackKey || !client) return res.status(503).json({ error: 'Payment service is not configured.' });
    try {
      const user = await requireAuth(req);
      const { data: project, error: projectError } = await client.from('projects')
        .select('id,student_id,title,plan,status,price_ngn').eq('id', projectId).maybeSingle();
      if (projectError) throw projectError;
      if (!project || project.student_id !== user.id) return res.status(404).json({ error: 'Project not found' });
      if (!['draft', 'payment_pending'].includes(String(project.status))) return res.status(409).json({ error: 'This project is not awaiting payment' });

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });
      const data = await response.json();
      if (!response.ok || !data.status || data.data?.status !== 'success') return res.status(400).json({ error: 'Transaction verification failed' });

      const paidNaira = Number(data.data.amount) / 100;
      const expectedNaira = Number(project.price_ngn);
      const currency = String(data.data.currency || '');
      const customerEmail = String(data.data.customer?.email || '').toLowerCase();
      const accountEmail = String(user.email || '').toLowerCase();
      if (!Number.isFinite(paidNaira) || Math.round(paidNaira) !== expectedNaira || currency !== 'NGN') return res.status(400).json({ error: 'Payment amount or currency does not match the project' });
      if (customerEmail && accountEmail && customerEmail !== accountEmail) return res.status(400).json({ error: 'Payment customer does not match the authenticated account' });

      const { data: payment, error: paymentError } = await client.rpc('record_verified_project_payment', {
        p_project_id: project.id, p_student_id: user.id, p_reference: reference,
        p_amount_ngn: Math.round(paidNaira),
        p_metadata: { currency, paystack_transaction_id: data.data?.id ?? null },
      });
      if (paymentError) {
        if (String(paymentError.message).includes('PAYMENT_REFERENCE_ALREADY_USED')) return res.status(409).json({ error: 'This payment reference has already been processed' });
        throw paymentError;
      }
      return res.json({ success: true, reference, amount: paidNaira, currency, paymentId: payment?.id });
    } catch (error: any) {
      if (error?.message === 'UNAUTHENTICATED') return res.status(401).json({ error: 'Authentication required' });
      if (error?.message === 'SERVER_NOT_CONFIGURED') return res.status(503).json({ error: 'Payment service is not configured.' });
      console.error('Paystack verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/paystack/verify-points', async (req, res) => {
    const { reference, points } = req.body as { reference?: string; points?: number };
    if (!reference || !Number.isInteger(points) || points <= 0) return res.status(400).json({ error: 'Valid reference and points are required' });
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const client = getSupabaseAdmin() as any;
    if (!paystackKey || !client) return res.status(503).json({ error: 'Payment service is not configured.' });
    try {
      const user = await requireAuth(req);
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });
      const data = await response.json();
      if (!response.ok || !data.status || data.data?.status !== 'success') return res.status(400).json({ error: 'Transaction verification failed' });
      const paidNaira = Number(data.data.amount) / 100;
      const expectedNaira = points * 10;
      const expectedGrossNaira = Math.round(expectedNaira * 1.02);
      const currency = String(data.data.currency || '');
      const customerEmail = String(data.data.customer?.email || '').toLowerCase();
      const accountEmail = String(user.email || '').toLowerCase();
      if (!Number.isFinite(paidNaira) || Math.round(paidNaira) !== expectedNaira || currency !== 'NGN') return res.status(400).json({ error: 'Point purchase amount or currency does not match' });
      if (customerEmail && accountEmail && customerEmail !== accountEmail) return res.status(400).json({ error: 'Payment customer does not match the authenticated account' });
      const { data: wallet, error } = await client.rpc('credit_purchased_points', {
        p_user_id: user.id, p_points: points, p_amount_ngn: expectedNaira, p_reference: reference,
      });
      if (error) throw error;
      return res.json({ success: true, points, amountNgn: expectedNaira, feeNgn: expectedGrossNaira - expectedNaira, chargedNgn: expectedGrossNaira, currency, wallet });
    } catch (error: any) {
      if (error?.message === 'UNAUTHENTICATED') return res.status(401).json({ error: 'Authentication required' });
      if (error?.message === 'SERVER_NOT_CONFIGURED') return res.status(503).json({ error: 'Payment service is not configured.' });
      console.error('Finalyzed Points verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Finalyzed server running on port ${PORT}`));
}

startServer().catch(error => { console.error('Unable to start Finalyzed server:', error); process.exit(1); });
