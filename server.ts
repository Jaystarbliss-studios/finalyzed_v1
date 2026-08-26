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
    const client = getSupabaseAdmin();
    if (!paystackKey || !client) return res.status(503).json({ error: 'Payment service is not configured.' });

    try {
      const user = await requireAuth(req);
      const { data: project, error: projectError } = await client
        .from('projects').select('id,student_id,title,plan,status,price_ngn')
        .eq('id', projectId).maybeSingle<ProjectRow>();
      if (projectError) throw projectError;
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (project.student_id !== user.id) return res.status(403).json({ error: 'You do not own this project' });
      if (!['draft', 'payment_pending'].includes(String(project.status))) return res.status(409).json({ error: 'This project is not awaiting payment' });

      const { data: existingPayment, error: existingPaymentError } = await client.from('payments').select('id').eq('reference', reference).maybeSingle();
      if (existingPaymentError) throw existingPaymentError;
      if (existingPayment) return res.status(409).json({ error: 'This payment reference has already been processed' });

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });
      const data = await response.json();
      if (!response.ok || !data.status || data.data?.status !== 'success') return res.status(400).json({ error: 'Transaction verification failed' });

      const paidNaira = Number(data.data.amount) / 100;
      const expectedNaira = Number(project.price_ngn);
      const currency = String(data.data.currency || '');
      if (!Number.isFinite(expectedNaira) || Math.abs(paidNaira - expectedNaira) > 0.01 || currency !== 'NGN') return res.status(400).json({ error: 'Payment amount or currency does not match the project' });

      const customerEmail = String(data.data.customer?.email || '').toLowerCase();
      const accountEmail = String(user.email || '').toLowerCase();
      if (customerEmail && accountEmail && customerEmail !== accountEmail) return res.status(400).json({ error: 'Payment customer does not match the authenticated account' });

      const { data: payment, error: paymentError } = await client.from('payments').insert({
        project_id: project.id, student_id: user.id, provider: 'paystack', reference,
        amount_ngn: Math.round(paidNaira), status: 'completed', paid_at: new Date().toISOString(),
        metadata: { currency, paystack_transaction_id: data.data?.id ?? null },
      }).select('id').single();
      if (paymentError) throw paymentError;

      const { error: projectUpdateError } = await client.from('projects').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', project.id).eq('student_id', user.id);
      if (projectUpdateError) throw projectUpdateError;

      const { error: auditError } = await client.from('audit_logs').insert({
        actor_id: user.id, action: 'PROJECT_PAYMENT_VERIFIED', entity_type: 'project', entity_id: project.id,
        metadata: { payment_id: payment.id, reference, amount_ngn: Math.round(paidNaira), currency },
      });
      if (auditError) console.warn('Payment audit log failed:', auditError.message);
      return res.json({ success: true, reference, amount: paidNaira, currency });
    } catch (error: any) {
      if (error?.message === 'UNAUTHENTICATED') return res.status(401).json({ error: 'Authentication required' });
      if (error?.message === 'SERVER_NOT_CONFIGURED') return res.status(503).json({ error: 'Payment service is not configured.' });
      console.error('Paystack verification error:', error);
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
