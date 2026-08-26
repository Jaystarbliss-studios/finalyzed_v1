import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Coins, RefreshCw } from 'lucide-react';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

interface WalletRecord { availableBalance?: number; pendingBalance?: number; pointBalance?: number; }
interface LedgerItem { id: string; type?: string; amount?: number; description?: string; status?: string; createdAt?: any; }

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletRecord>({});
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const walletSnap = await getDoc(doc(db, 'wallets', user.uid));
      const txSnap = await getDocs(query(collection(db, 'walletTransactions'), where('userId', '==', user.uid), limit(50)));
      const entries = txSnap.docs.map(item => ({ id: item.id, ...item.data() })) as LedgerItem[];
      entries.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      setWallet(walletSnap.exists() ? walletSnap.data() as WalletRecord : {});
      setTransactions(entries.slice(0, 30));
    } catch (error) {
      console.error('Unable to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWallet(); }, [user]);

  const money = (value = 0) => `₦${Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const points = Number(wallet.pointBalance || 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-7">
      <header className="flex items-end justify-between gap-4"><div><span className="mono-label">Finalyzed Wallet</span><h1 className="text-3xl font-light tracking-tight mt-2">YOUR <span className="font-bold">BALANCES</span></h1><p className="text-sm text-muted-foreground mt-1">Real wallet and point balances from the Finalyzed ledger.</p></div><button onClick={loadWallet} className="btn-secondary p-3" aria-label="Refresh wallet"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button></header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bento-card p-7 bg-primary text-primary-foreground relative overflow-hidden"><div className="relative z-10"><span className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">Available cash balance</span><div className="text-4xl md:text-5xl font-bold mt-2">{money(wallet.availableBalance)}</div><div className="mt-6 text-sm text-primary-foreground/75">Withdrawals become available only when the wallet meets Finalyzed’s configured minimum and any applicable transaction fee is shown before confirmation.</div></div></div>
        <div className="bento-card p-6"><div className="flex items-center gap-2 text-primary"><Coins className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-wider">Finalyzed Points</span></div><div className="text-3xl font-bold mt-3">{points.toLocaleString()} pts</div><p className="text-sm text-muted-foreground mt-2">1 point = ₦10</p><div className="mt-4 rounded-xl bg-muted p-3 text-sm font-semibold">Value: {money(points * 10)}</div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5"><Balance label="Pending balance" value={money(wallet.pendingBalance)} /><Balance label="Available points" value={`${points.toLocaleString()} pts`} /><Balance label="Point value" value={money(points * 10)} /></div>
      <section><div className="flex items-center justify-between mb-4"><h2 className="font-bold text-lg">Transaction Ledger</h2><span className="text-xs text-muted-foreground">Latest 30 entries</span></div><div className="bento-card p-0 overflow-hidden">{loading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading your ledger…</div> : transactions.length === 0 ? <div className="p-10 text-center"><WalletIcon className="w-8 h-8 text-primary mx-auto mb-3" /><h3 className="font-semibold">No transactions yet</h3><p className="text-sm text-muted-foreground mt-1">Completed payments, earnings and withdrawals will appear here.</p></div> : <div className="divide-y divide-border">{transactions.map(tx => <LedgerRow key={tx.id} tx={tx} money={money} />)}</div>}</div></section>
    </div>
  );
}
function Balance({ label, value }: { label: string; value: string }) { return <div className="bento-card p-5"><span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</span><div className="text-xl font-bold mt-2">{value}</div></div>; }
function LedgerRow({ tx, money }: { tx: LedgerItem; money: (v?: number) => string }) { const negative = ['DEBIT', 'WITHDRAWAL', 'FEE', 'POINT_SPEND'].includes(String(tx.type || '').toUpperCase()); const date = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString('en-NG') : '—'; return <div className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"><div className="flex items-center gap-3 min-w-0"><div className={`p-2.5 rounded-full shrink-0 ${negative ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>{negative ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}</div><div className="min-w-0"><p className="font-semibold text-sm truncate">{tx.description || tx.type || 'Wallet transaction'}</p><p className="text-xs text-muted-foreground mt-0.5">{date}</p></div></div><div className="text-right shrink-0"><p className={`font-bold ${negative ? 'text-red-500' : 'text-primary'}`}>{negative ? '-' : '+'}{money(Math.abs(Number(tx.amount || 0)))}</p><p className="text-xs text-muted-foreground capitalize">{String(tx.status || 'recorded').toLowerCase()}</p></div></div>; }
