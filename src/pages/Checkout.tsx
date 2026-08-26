import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Shield, CreditCard, Lock, ArrowRight, Zap, Star, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const plans = [
  {
    id: 'basic',
    name: 'Standard Edit',
    price: 45,
    icon: <CheckCircle className="w-6 h-6 text-blue-400" />,
    features: ['Proofreading & Grammar', 'Format check', '7-day delivery', '1 revision'],
  },
  {
    id: 'premium',
    name: 'Deep Review',
    price: 95,
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    features: ['Structural edit', 'Flow & tone improvements', '3-day delivery', '3 revisions', 'Plagiarism check'],
    popular: true,
  },
  {
    id: 'elite',
    name: 'Finalyzed Pro',
    price: 185,
    icon: <Award className="w-6 h-6 text-primary" />,
    features: ['Expert rewrite suggestions', 'Academic tone perfection', '24-hour delivery', 'Unlimited revisions', 'Plagiarism check', 'Priority support'],
  },
];

export default function Checkout() {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Assume project details were passed via state
  const projectDetails = location.state?.project || {
    title: 'New Academic Paper',
    type: 'Research Essay',
  };

  const handlePayment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setProcessing(true);
    
    // Simulate Paystack Payment Gateway Delay
    setTimeout(async () => {
      try {
        const planDetails = plans.find(p => p.id === selectedPlan);
        
        // Create project in Firestore
        await addDoc(collection(db, 'projects'), {
          userId: user.uid,
          title: projectDetails.title,
          type: projectDetails.type,
          plan: selectedPlan,
          amount: planDetails?.price,
          status: 'assigned',
          paymentStatus: 'paid',
          createdAt: serverTimestamp(),
        });

        // Redirect to dashboard with success state
        navigate('/dashboard', { state: { paymentSuccess: true } });
      } catch (error) {
        console.error('Error creating project:', error);
        setProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light tracking-tight text-foreground">
          SELECT.<span className="opacity-50">PLAN</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Choose the level of editorial support required for "{projectDetails.title}".
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`bento-card p-6 cursor-pointer relative transition-all duration-300 ${
              selectedPlan === plan.id ? 'ring-2 ring-primary bg-primary/5 scale-[1.02]' : 'hover:border-primary/50'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" /> MOST POPULAR
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="mb-2">{plan.icon}</div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${plan.price}
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className={`w-full py-2.5 rounded-lg text-center text-sm font-medium transition-colors ${
              selectedPlan === plan.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}>
              {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bento-card p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]"></div>
          
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Secure Checkout
          </h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${plans.find(p => p.id === selectedPlan)?.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee (5%)</span>
              <span className="font-medium">${((plans.find(p => p.id === selectedPlan)?.price || 0) * 0.05).toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg text-primary">
                ${((plans.find(p => p.id === selectedPlan)?.price || 0) * 1.05).toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            disabled={processing}
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing Payment...
              </span>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Pay via Paystack (Mock)
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-green-400" />
            256-bit SSL encrypted. Payments are securely processed.
          </div>
        </div>
      </div>
    </div>
  );
}
