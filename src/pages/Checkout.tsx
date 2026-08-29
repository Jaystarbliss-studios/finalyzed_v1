import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, CreditCard, Lock, Zap, Star, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, createProjectFromSpecification } from '../lib/supabase';
import { usePaystackPayment } from 'react-paystack';

const plans = [
  { id: 'basic', name: 'Basic', price: 35000, icon: <CheckCircle className="w-6 h-6 text-slate-400" />, features: ['Up to 62 pages', 'PDF & DOCX output', '3 revisions'] },
  { id: 'standard', name: 'Standard', price: 55000, icon: <Star className="w-6 h-6 text-yellow-500" />, features: ['Up to 75 pages', 'PDF & DOCX output', '5 revisions', 'Project presentation slides'], popular: true },
  { id: 'premium', name: 'Premium', price: 85000, icon: <Award className="w-6 h-6 text-primary" />, features: ['100–150 pages', 'PDF & DOCX output', '10 revisions', 'Project presentation slides', 'Simplified project presentation guide'] },
];

export default function Checkout() {
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [processing, setProcessing] = useState(false);
  const [spec, setSpec] = useState<any>(null);
  const DEMO_MODE = String((import.meta as any).env.VITE_DEMO_MODE ?? 'true').toLowerCase() !== 'false';
  const navigate = useNavigate();
  const { user } = useAuth();
  const specialistId = localStorage.getItem('finalyzed_selected_specialist') || 'unassigned';

  useEffect(() => {
    try {
      const savedSpec = localStorage.getItem('finalyzed_project_confirmed');
      if (savedSpec) setSpec(JSON.parse(savedSpec));
      else navigate('/start-project', { replace: true });
    } catch {
      navigate('/start-project', { replace: true });
    }
  }, [navigate]);

  const planDetails = plans.find(p => p.id === selectedPlan)!;
  const baseAmount = planDetails.price;
  // Do not silently add a gateway/service surcharge. Any platform fee should be an
  // explicit, administrator-configured line item in the future.
  const totalAmount = baseAmount;

  const config = {
    reference: `FZ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: user?.email || '',
    amount: totalAmount * 100,
    metadata: { custom_fields: [] },
    publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any, projectId: string) => {
    try {
      if (!user) throw new Error('Authentication required');
      const { data: { session } } = await supabase.auth.getSession();
      const idToken = session?.access_token;
      if (!idToken) throw new Error('Authentication session expired. Please sign in again.');
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ reference: reference.reference, projectId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Payment verification failed');
      }

      localStorage.removeItem('finalyzed_project_draft');
      localStorage.removeItem('finalyzed_project_confirmed');
      localStorage.removeItem('finalyzed_selected_specialist');
      navigate('/dashboard', { replace: true, state: { paymentSuccess: true } });
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert(error instanceof Error ? error.message : 'Payment verification failed. Please contact Finalyzed support.');
      setProcessing(false);
    }
  };

  const handleDemoPayment = async (projectId: string) => {
    if (!user) return navigate('/login');
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('complete_demo_project_payment', { p_project_id: projectId });
      if (error) throw error;
      localStorage.removeItem('finalyzed_project_draft');
      localStorage.removeItem('finalyzed_project_confirmed');
      localStorage.removeItem('finalyzed_selected_specialist');
      navigate('/dashboard', { replace: true, state: { paymentSuccess: true, demoPayment: true, projectId: data?.id } });
    } catch (error) {
      console.error('Demo checkout failed:', error);
      alert(error instanceof Error ? error.message : 'Demo checkout could not be completed.');
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!user) return navigate('/login');
    if (!spec?.projectTitle) return navigate('/start-project');
    if (!DEMO_MODE && !config.publicKey) {
      alert('Paystack is not configured yet. Please add VITE_PAYSTACK_PUBLIC_KEY to the environment.');
      return;
    }

    setProcessing(true);
    try {
      const { data: specification, error: specificationError } = await supabase
        .from('project_specifications')
        .select('id')
        .eq('student_id', user.id)
        .eq('status', 'confirmed')
        .eq('is_complete', true)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (specificationError) throw specificationError;
      if (!specification) throw new Error('Please confirm your project specification before payment.');

      const project = await createProjectFromSpecification(
        specification.id,
        selectedPlan as 'basic' | 'standard' | 'premium',
        totalAmount,
        specialistId || undefined,
      );

      if (DEMO_MODE) {
        await handleDemoPayment(project.id);
        return;
      }

      initializePayment({
        config: { amount: totalAmount * 100, email: user.email, metadata: { custom_fields: [
          { display_name: 'Project ID', variable_name: 'project_id', value: project.id },
          { display_name: 'Student ID', variable_name: 'student_id', value: user.id },
        ] } },
        onSuccess: (ref) => onSuccess(ref, project.id),
        onClose: () => setProcessing(false),
      });
    } catch (error) {
      console.error('Error initiating checkout:', error);
      setProcessing(false);
      alert('We could not start checkout. Please try again.');
    }
  };

  if (!spec) return <div className="p-8 text-center text-muted-foreground">Loading your confirmed project specification…</div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-8 md:mb-12"><p className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Secure checkout</p><h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">Finalize Your Commission</h1><p className="text-muted-foreground mt-2">Your confirmed project specification is attached to this order.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4"><h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Select Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`relative flex flex-col p-6 rounded-2xl text-left transition-all border-2 ${selectedPlan === plan.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-background hover:border-primary/40'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>}
                <div className="flex justify-between items-start mb-4">{plan.icon}<span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'border-primary' : 'border-muted'}`}>{selectedPlan === plan.id && <span className="w-2.5 h-2.5 bg-primary rounded-full" />}</span></div>
                <h3 className="font-bold text-lg">{plan.name}</h3><div className="text-2xl font-bold mt-1 mb-4">₦{plan.price.toLocaleString()}</div>
                <ul className="space-y-2 mt-auto">{plan.features.map(feature => <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />{feature}</li>)}</ul>
              </button>)}
            </div>
          </div>
          <div className="bento-card p-6"><h2 className="text-xl font-bold mb-5">Project Summary</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-sm">
            <Summary label="Title" value={spec.projectTitle || 'Untitled'} /><Summary label="Type" value={spec.projectType || 'Standard'} /><Summary label="Target pages" value={spec.targetPages || 'Not specified'} /><Summary label="Specialist" value={specialistId === 'unassigned' ? 'Not pre-selected' : 'Selected specialist'} />
          </div></div>
        </div>
        <div><div className="bento-card p-6 sticky top-24 bg-background shadow-lg shadow-black/5"><h2 className="text-xl font-bold mb-6">Order Details</h2>
          <div className="space-y-4 mb-6"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium capitalize">{selectedPlan}</span></div><div className="pt-4 border-t border-border flex justify-between"><span className="font-bold">Total</span><span className="font-bold text-xl text-primary">₦{totalAmount.toLocaleString()}</span></div></div>
          <div className="space-y-3 mb-6"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="w-4 h-4 text-green-500" /> <span>Payment is verified server-side before the project advances.</span></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="w-4 h-4 text-green-500" /> <span>Secure payment processing via Paystack.</span></div></div>
          <button onClick={handlePayment} disabled={processing} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50">{processing ? 'Processing…' : <><CreditCard className="w-5 h-5" /> {DEMO_MODE ? `Complete Demo Checkout · ₦${totalAmount.toLocaleString()}` : `Pay ₦${totalAmount.toLocaleString()}`}</>}</button>
          <div className="mt-4 text-center"><span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{DEMO_MODE ? 'Finalyzed Demo Payment · Admin wallet' : 'Secured by Paystack'}</span></div>
        </div></div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <div><span className="text-muted-foreground block text-xs uppercase tracking-wider font-bold">{label}</span><span className="font-medium break-words">{value}</span></div>; }
