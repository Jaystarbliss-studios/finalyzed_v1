import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Search, FileText, Send, ShieldCheck, Download } from 'lucide-react';

const steps = [
  {
    icon: <FileText className="w-8 h-8 text-primary" />,
    title: '1. Specify Your Project',
    description: 'Fill out our intelligent specification wizard. Tell us exactly what your institution requires—formatting, citation styles, structure, and academic parameters.',
  },
  {
    icon: <Search className="w-8 h-8 text-primary" />,
    title: '2. Select a Specialist',
    description: 'Browse our marketplace of verified academic specialists. Compare their ratings, expertise, completion rates, and previous reviews.',
  },
  {
    icon: <Send className="w-8 h-8 text-primary" />,
    title: '3. Securely Commission',
    description: 'Choose a plan (Basic, Standard, or Premium) and place your order. Your funds are held securely while the specialist works on your project.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: '4. Editor Quality Assurance',
    description: 'Before you receive the project, an independent Quality Assurance Editor reviews it against your original specifications to ensure 100% compliance.',
  },
  {
    icon: <Download className="w-8 h-8 text-primary" />,
    title: '5. Receive & Review',
    description: 'Download your finalized project files securely. If you need changes, use your included revision allowance to request updates directly through the platform.',
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-primary" />,
    title: '6. Finalize & Rate',
    description: 'Once you are fully satisfied, approve the delivery. The funds are released to the specialist, and you can leave a review to help future students.',
  }
];

export default function HowItWorks() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="mono-label mb-4 inline-block">The Finalyzed Workflow</span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            From specification to <span className="font-bold">completion</span>.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            We've engineered a rigorous, transparent process to ensure your academic project meets the exact requirements of your institution. Here is how we guarantee quality.
          </p>
        </motion.div>
      </section>

      {/* Steps Timeline */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col md:flex-row gap-6 items-start md:items-center bento-card p-8 hover:border-primary/30 transition-colors"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-4 bg-primary/5 border-t border-primary/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-light tracking-tight mb-12">
            Why trust <span className="font-bold">Finalyzed?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <h4 className="font-bold text-lg mb-3">Verified Experts</h4>
              <p className="text-muted-foreground text-sm">Every specialist on our platform undergoes a rigorous verification process before they can accept commissions.</p>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-lg mb-3">Independent QA</h4>
              <p className="text-muted-foreground text-sm">Unlike other platforms, we use an independent layer of human editors to enforce your specific university guidelines.</p>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-lg mb-3">Secure Ledger</h4>
              <p className="text-muted-foreground text-sm">Your payment is held safely in escrow and is only released when you approve the final delivery.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
