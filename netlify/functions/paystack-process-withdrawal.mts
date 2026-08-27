import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!supabaseUrl || !serviceKey || !paystackKey) return { statusCode: 500, body: JSON.stringify({ error: 'Withdrawal service is not configured.' }) };

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required.' }) };
  const accessToken = authHeader.slice(7);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData } = await admin.auth.getUser(accessToken);
  if (!authData.user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session.' }) };

  const body = JSON.parse(event.body || '{}');
  const withdrawalId = String(body.withdrawal_id || '');
  const { data: profile } = await admin.from('profiles').select('role,account_status').eq('id', authData.user.id).maybeSingle();
  if (profile?.role !== 'admin' || profile?.account_status !== 'approved') return { statusCode: 403, body: JSON.stringify({ error: 'Administrator approval required to process transfers.' }) };

  const { data: withdrawal } = await admin.from('withdrawals').select('*').eq('id', withdrawalId).eq('status','pending').maybeSingle();
  if (!withdrawal) return { statusCode: 404, body: JSON.stringify({ error: 'Pending withdrawal not found.' }) };

  const { data: bank } = await admin.from('bank_accounts').select('*').eq('user_id', withdrawal.user_id).eq('bank_name', withdrawal.bank_name).eq('account_name', withdrawal.account_name).maybeSingle();
  if (!bank) return { statusCode: 400, body: JSON.stringify({ error: 'Saved bank account could not be located.' }) };

  try {
    let recipientCode = bank.paystack_recipient_code;
    if (!recipientCode) {
      const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + paystackKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'nuban', name: bank.account_name, account_number: bank.account_number, bank_code: bank.bank_code, currency: 'NGN' })
      });
      const recipient = await recipientResponse.json();
      if (!recipientResponse.ok || !recipient.status) throw new Error(recipient.message || 'Could not create Paystack transfer recipient.');
      recipientCode = recipient.data.recipient_code;
      await admin.from('bank_accounts').update({ paystack_recipient_code: recipientCode, verified: true, updated_at: new Date().toISOString() }).eq('id', bank.id);
    }

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + paystackKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: Number(withdrawal.amount_ngn) * 100, recipient: recipientCode, reason: 'Finalyzed wallet withdrawal', reference: withdrawal.id })
    });
    const transfer = await transferResponse.json();
    if (!transferResponse.ok || !transfer.status) throw new Error(transfer.message || 'Paystack transfer could not be initiated.');

    await admin.from('withdrawals').update({ status: 'processing', processed_at: new Date().toISOString() }).eq('id', withdrawal.id);
    await admin.from('wallet_transactions').insert({ user_id: withdrawal.user_id, transaction_type: 'paystack_transfer_initiated', amount_ngn: -Number(withdrawal.amount_ngn), reference: transfer.data?.reference || withdrawal.id, metadata: { paystack_transfer_code: transfer.data?.transfer_code, withdrawal_id: withdrawal.id } });
    return { statusCode: 200, body: JSON.stringify({ ok: true, reference: transfer.data?.reference, transfer_code: transfer.data?.transfer_code }) };
  } catch (error) {
    await admin.rpc('admin_reject_withdrawal', { p_withdrawal_id: withdrawal.id, p_reason: error instanceof Error ? error.message : 'Paystack transfer failed' });
    return { statusCode: 502, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Paystack transfer failed' }) };
  }
};

export { handler };