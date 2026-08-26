import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, Shield, FileText, UserCheck, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 lg:py-32 overflow-hidden">
        {/* Background visual element */}
        <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4 opacity-10 blur-3xl pointer-events-none">
          <div className="w-[800px] h-[800px] rounded-full bg-primary" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6"
          >
            Find the right support. <br className="hidden md:block" />
            <span className="text-primary">Get your project finalized.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The professional academic project-support marketplace. Connect with verified specialists, track progress transparently, and ensure quality with expert editors.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/specialists" className="btn-primary w-full sm:w-auto px-8 py-4 text-lg flex items-center justify-center gap-2">
              Find a Project Specialist
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/become-specialist" className="btn-secondary w-full sm:w-auto px-8 py-4 text-lg">
              Become a Specialist
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 mx-4 my-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">How Finalyzed Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A structured, quality-controlled workflow designed to ensure excellent outcomes.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "1. Specification",
                desc: "Complete our structured questionnaire to tell us exactly what your project needs."
              },
              {
                icon: <UserCheck className="w-6 h-6 text-primary" />,
                title: "2. Match",
                desc: "Find the right verified specialist from our marketplace and commission them."
              },
              {
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: "3. Editor Review",
                desc: "Once the specialist finishes, an editor reviews the work against your specification."
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-primary" />,
                title: "4. Finalize",
                desc: "Receive the reviewed work, request revisions if needed, and finalize the project."
              }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bento-card p-8"
              >
                <div className="bento-glow" />
                <div className="bg-primary/10 w-12 h-12 rounded-xl border border-primary/20 flex items-center justify-center mb-6 relative z-10">
                  {step.icon}
                </div>
                <h3 className="text-xl font-light tracking-tight text-foreground mb-3 relative z-10">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Built on Trust and <br className="hidden md:block" /> Quality Control
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              We don't just connect you with a writer. We manage the entire lifecycle with an independent editor quality assurance layer to ensure requirements are met perfectly.
            </p>
            
            <ul className="space-y-6">
              {[
                "Verified specialists vetted by our team",
                "Funds held securely until completion",
                "Structured revisions built into every plan",
                "Independent editor QA before you receive it"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="mt-1 bg-primary/10 rounded-sm border border-primary/40 p-1">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border">
              <img 
                src="/finalyzed-1.png" 
                alt="Finalyzed Brand Graphic" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating stat card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -left-6 bento-card p-6 flex items-center gap-4"
            >
              <div className="bento-glow" />
              <div className="bg-primary/20 p-3 rounded-sm border border-primary/40 relative z-10">
                <Star className="w-8 h-8 text-primary fill-current" />
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-light text-foreground tracking-tighter">4.9<span className="text-lg font-mono text-muted-foreground uppercase tracking-widest ml-1">/5</span></p>
                <p className="mono-label mt-1">Average rating</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 mb-12">
        <div className="max-w-4xl mx-auto bento-card p-12 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-[100px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
               <div className="badge-verified">SYSTEM LIVE</div>
            </div>
            <h2 className="text-4xl font-light tracking-tight text-foreground mb-6">Ready to get your project organized?</h2>
            <p className="text-muted-foreground text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of students who have finalized their academic projects with professional assistance.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg">
              Start Your Project
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
