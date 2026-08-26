import fs from 'fs';

const code = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, CreditCard, Lock, Zap, Star, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { usePaystackPayment } from 'react-paystack';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 35000,
    icon: <CheckCircle className="w-6 h-6 text-slate-400" />,
    features: ['Up to 62 pages', 'PDF & DOCX output', '3 revisions'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 55000,
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    features: ['Up to 75 pages', 'PDF & DOCX output', '5 revisions', 'Project presentation slides'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 85000,
    icon: <Award className="w-6 h-6 text-primary" />,
    features: ['100–150 pages', 'PDF & DOCX output', '10 revisions', 'Project presentation slides', 'Simplified project presentation guide'],
  },
];

export default function Checkout() {
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [processing, setProcessing] = useState(false);
  const [spec, setSpec] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const specialistId = localStorage.getItem('finalyzed_selected_specialist') || 'unassigned';

  useEffect(() => {
    const savedSpec = localStorage.getItem('finalyzed_project_confirmed');
    if (savedSpec) {
      setSpec(JSON.parse(savedSpec));
    } else {
      navigate('/start-project');
    }
  }, [navigate]);

  const planDetails = plans.find(p => p.id === selectedPlan);
  const baseAmount = planDetails?.price || 0;
  const totalAmount = baseAmount * 1.025; // 2.5% fee
  
  // Paystack Configuration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || 'student@example.com',
    amount: totalAmount * 100, // in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder', // MUST BE PROVIDED IN .env
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any, projectId: string) => {
    try {
      // Hit our secure backend to verify and fulfill
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.reference,
          projectId,
          userId: user?.uid
        })
      });
      
      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      // Clear local storage drafts
      localStorage.removeItem('finalyzed_project_draft');
      localStorage.removeItem('finalyzed_project_confirmed');
      localStorage.removeItem('finalyzed_selected_specialist');
      
      // Redirect to dashboard with success state
      navigate('/dashboard', { state: { paymentSuccess: true } });
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert("Payment was successful but we couldn't verify it. Please contact support.");
      setProcessing(false);
    }
  };

  const onClose = () => {
    console.log('Payment closed');
    setProcessing(false);
  };

  const handlePayment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setProcessing(true);
    
    try {
      // 1. Create project in Firestore (State Machine: PAYMENT_PENDING)
      const docRef = await addDoc(collection(db, 'projects'), {
        studentId: user.uid,
        specialistId: specialistId,
        title: spec.projectTitle || 'Untitled Project',
        type: spec.projectType || 'Standard Academic Project',
        plan: selectedPlan,
        baseAmount: baseAmount,
        totalAmount: totalAmount,
        status: 'PAYMENT_PENDING', 
        specification: spec,
        createdAt: serverTimestamp(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      // 2. Trigger Paystack
      initializePayment({
        onSuccess: (ref) => onSuccess(ref, docRef.id),
        onClose: onClose
      });
      
    } catch (error) {
      console.error('Error initiating checkout:', error);
      setProcessing(false);
    }
  };

  if (!spec) return <div className="p-8 text-center">Loading specification...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Finalize Your Commission</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Select your plan and complete payment securely.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Select Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={\`relative flex flex-col p-6 rounded-xl text-left transition-all border-2 \${
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-border bg-background hover:border-primary/50'
                  }\`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    {plan.icon}
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                      selectedPlan === plan.id ? 'border-primary' : 'border-muted'
                    }\`}>
                      {selectedPlan === plan.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="text-2xl font-bold text-foreground mt-1 mb-4">₦{plan.price.toLocaleString()}</div>
                  <ul className="space-y-2 mt-auto">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Project Summary */}
          <div className="bento-card p-6 border-border">
            <h2 className="text-xl font-bold mb-4">Project Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider font-bold">Title</span>
                <span className="font-medium">{spec.projectTitle || 'Untitled'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider font-bold">Type</span>
                <span className="font-medium">{spec.projectType || 'Standard'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider font-bold">Target Pages</span>
                <span className="font-medium">{spec.targetPages || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider font-bold">Specialist</span>
                <span className="font-medium">{specialistId === 'unassigned' ? 'To be assigned automatically' : 'Pre-selected Specialist'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Sidebar */}
        <div className="lg:col-span-1">
          <div className="bento-card p-6 border-primary/20 sticky top-24 bg-background shadow-lg shadow-black/5">
            <h2 className="text-xl font-bold mb-6">Order Details</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium capitalize">{selectedPlan}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee (2.5%)</span>
                <span className="font-medium">₦{(baseAmount * 0.025).toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between">
                <span className="font-bold">Total Paystack Amount</span>
                <span className="font-bold text-xl text-primary">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Your funds are held securely until editor approval.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Encrypted 256-bit payment processing via Paystack.</span>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={processing}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay Now
                </>
              )}
            </button>
            <div className="mt-4 text-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secured by Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/pages/Checkout.tsx', code);
console.log('patched checkout with real paystack');
