import React from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, Activity, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Wallet() {
  const { userData } = useAuth();
  
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <header className="mb-4">
        <span className="mono-label">Financial Ledger</span>
        <h1 className="text-3xl font-light tracking-tight mt-2">
          MY <span className="font-bold">WALLET</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bento-card p-8 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider mb-2 block">Available Balance</span>
            <div className="text-5xl font-bold mb-8">₦{(userData?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            
            <div className="flex gap-4">
              <button className="bg-white text-primary px-6 py-3 rounded-lg font-bold text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" /> Withdraw Funds
              </button>
              <button className="bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary-foreground/20 transition-colors flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4" /> Add Funds
              </button>
            </div>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-center">
          <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-2 block">Pending Clearance</span>
          <div className="text-3xl font-bold mb-4">₦{(userData?.pendingClearance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div className="bg-yellow-400 h-2 rounded-full w-[60%]"></div>
          </div>
          <p className="text-xs text-muted-foreground">From 2 active projects in QA Review</p>
        </div>
      </div>

      <h3 className="font-bold text-lg mt-8 mb-4">Transaction Ledger</h3>
      <div className="bento-card p-0 overflow-hidden">
        <div className="divide-y divide-border">
          {[
            { type: 'credit', amount: '+₦15,000', desc: 'Project Completion - AI Research', date: 'Today, 2:45 PM', status: 'cleared' },
            { type: 'debit', amount: '-₦5,000', desc: 'Withdrawal to Bank ****1234', date: 'Yesterday, 9:00 AM', status: 'cleared' },
            { type: 'pending', amount: '+₦10,000', desc: 'Project Submission - Data Analysis', date: 'Yesterday, 8:30 AM', status: 'pending' },
            { type: 'credit', amount: '+₦4,500', desc: 'Finalyzed Points Conversion', date: 'Aug 22, 2026', status: 'cleared' },
          ].map((tx, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  tx.type === 'credit' ? 'bg-green-500/10 text-green-500' :
                  tx.type === 'debit' ? 'bg-red-500/10 text-red-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> :
                   tx.type === 'debit' ? <ArrowUpRight className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{tx.desc}</h4>
                  <span className="text-xs text-muted-foreground">{tx.date}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${
                  tx.type === 'credit' ? 'text-green-500' :
                  tx.type === 'debit' ? 'text-foreground' :
                  'text-yellow-500'
                }`}>{tx.amount}</div>
                <span className="text-xs text-muted-foreground capitalize">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
