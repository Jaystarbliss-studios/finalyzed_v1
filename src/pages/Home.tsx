import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Feather,
  Layers3,
  LockKeyhole,
  PenLine,
  Search,
  Shield,
  Star,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const heroScenes = [
  {
    label: 'WRITE',
    src: 'https://videos.pexels.com/video-files/6929087/6929087-hd_1920_1080_25fps.mp4',
    caption: 'Ideas become pages.',
  },
  {
    label: 'LEARN',
    src: 'https://videos.pexels.com/video-files/8616782/8616782-hd_1920_1080_25fps.mp4',
    caption: 'Research becomes understanding.',
  },
  {
    label: 'GRADUATE',
    src: 'https://videos.pexels.com/video-files/7945191/7945191-hd_1920_1080_25fps.mp4',
    caption: 'The work becomes a milestone.',
  },
];

const signatures = [
  { left: '4%', top: '16%', rotate: -12, delay: '0s', scale: 0.9, path: 'M4 34 C18 8 20 50 34 25 S54 15 58 36 C64 55 76 10 92 29 S116 46 132 20' },
  { left: '72%', top: '12%', rotate: 8, delay: '1.4s', scale: 1.05, path: 'M5 32 C22 18 24 48 38 26 S52 8 64 34 C78 62 84 5 101 29 S120 42 138 18' },
  { left: '18%', top: '40%', rotate: 7, delay: '2.2s', scale: 0.72, path: 'M2 31 C16 4 24 50 38 24 C48 6 57 53 68 27 S86 8 98 30 S116 46 129 19' },
  { left: '78%', top: '43%', rotate: -10, delay: '3.2s', scale: 0.85, path: 'M4 35 C20 12 22 54 37 27 S55 9 65 33 C75 55 85 12 100 30 S122 48 139 19' },
  { left: '2%', top: '67%', rotate: 5, delay: '4s', scale: 1.12, path: 'M3 34 C16 12 25 48 39 22 S54 8 66 31 C79 57 85 11 101 29 S120 44 135 21' },
  { left: '62%', top: '72%', rotate: 13, delay: '5s', scale: 0.78, path: 'M3 30 C18 2 23 53 38 25 S54 7 66 31 C79 58 86 13 99 30 S119 47 136 20' },
  { left: '38%', top: '23%', rotate: -5, delay: '6s', scale: 0.68, path: 'M2 32 C18 10 23 48 37 24 S53 7 65 32 C75 52 85 10 100 29 S120 45 134 19' },
  { left: '45%', top: '83%', rotate: -8, delay: '7s', scale: 0.95, path: 'M4 34 C18 8 24 52 38 25 S55 10 67 33 C77 55 85 9 101 29 S121 46 137 20' },
  { left: '30%', top: '7%', rotate: -7, delay: '0.8s', scale: 0.62, path: 'M4 34 C18 8 24 52 38 25 S55 10 67 33 C77 55 85 9 101 29 S121 46 137 20' },
  { left: '54%', top: '14%', rotate: 11, delay: '1.9s', scale: 0.58, path: 'M3 30 C18 2 23 53 38 25 S54 7 66 31 C79 58 86 13 99 30 S119 47 136 20' },
  { left: '88%', top: '25%', rotate: -5, delay: '2.7s', scale: 0.72, path: 'M2 32 C18 10 23 48 37 24 S53 7 65 32 C75 52 85 10 100 29 S120 45 134 19' },
  { left: '8%', top: '29%', rotate: 14, delay: '3.8s', scale: 0.6, path: 'M4 35 C20 12 22 54 37 27 S55 9 65 33 C75 55 85 12 100 30 S122 48 139 19' },
  { left: '48%', top: '38%', rotate: -13, delay: '4.6s', scale: 0.74, path: 'M3 34 C16 12 25 48 39 22 S54 8 66 31 C79 57 85 11 101 29 S120 44 135 21' },
  { left: '93%', top: '54%', rotate: 8, delay: '5.6s', scale: 0.64, path: 'M3 30 C18 2 23 53 38 25 S54 7 66 31 C79 58 86 13 99 30 S119 47 136 20' },
  { left: '26%', top: '55%', rotate: 6, delay: '6.4s', scale: 0.56, path: 'M2 32 C18 10 23 48 37 24 S53 7 65 32 C75 52 85 10 100 29 S120 45 134 19' },
  { left: '56%', top: '60%', rotate: -9, delay: '7.3s', scale: 0.68, path: 'M4 34 C18 8 24 52 38 25 S55 10 67 33 C77 55 85 9 101 29 S121 46 137 20' },
  { left: '15%', top: '82%', rotate: -6, delay: '8.1s', scale: 0.78, path: 'M3 35 C20 12 22 54 37 27 S55 9 65 33 C75 55 85 12 100 30 S122 48 139 19' },
  { left: '75%', top: '84%', rotate: 12, delay: '9s', scale: 0.62, path: 'M4 34 C18 8 20 50 34 25 S54 15 58 36 C64 55 76 10 92 29 S116 46 132 20' },
  { left: '36%', top: '68%', rotate: 4, delay: '9.8s', scale: 0.5, path: 'M5 32 C22 18 24 48 38 26 S52 8 64 34 C78 62 84 5 101 29 S120 42 138 18' },
  { left: '68%', top: '5%', rotate: -4, delay: '10.6s', scale: 0.52, path: 'M4 34 C18 8 24 52 38 25 S55 10 67 33 C77 55 85 9 101 29 S121 46 137 20' },
  { left: '12%', top: '9%', rotate: 9, delay: '11.2s', scale: 0.48, path: 'M3 30 C18 2 23 53 38 25 S54 7 66 31 C79 58 86 13 99 30 S119 47 136 20' },
  { left: '84%', top: '15%', rotate: 6, delay: '12s', scale: 0.5, path: 'M2 32 C18 10 23 48 37 24 S53 7 65 32 C75 52 85 10 100 29 S120 45 134 19' },
  { left: '33%', top: '31%', rotate: -8, delay: '12.7s', scale: 0.46, path: 'M4 35 C20 12 22 54 37 27 S55 9 65 33 C75 55 85 12 100 30 S122 48 139 19' },
  { left: '67%', top: '31%', rotate: 10, delay: '13.4s', scale: 0.54, path: 'M3 34 C16 12 25 48 39 22 S54 8 66 31 C79 57 85 11 101 29 S120 44 135 21' },
  { left: '5%', top: '48%', rotate: -6, delay: '14.1s', scale: 0.5, path: 'M3 30 C18 2 23 53 38 25 S54 7 66 31 C79 58 86 13 99 30 S119 47 136 20' },
  { left: '41%', top: '50%', rotate: 7, delay: '14.8s', scale: 0.44, path: 'M2 32 C18 10 23 48 37 24 S53 7 65 32 C75 52 85 10 100 29 S120 45 134 19' },
  { left: '73%', top: '47%', rotate: -11, delay: '15.5s', scale: 0.48, path: 'M4 34 C18 8 24 52 38 25 S55 10 67 33 C77 55 85 9 101 29 S121 46 137 20' },
  { left: '21%', top: '66%', rotate: 11, delay: '16.2s', scale: 0.5, path: 'M5 32 C22 18 24 48 38 26 S52 8 64 34 C78 62 84 5 101 29 S120 42 138 18' },
  { left: '89%', top: '70%', rotate: -7, delay: '16.9s', scale: 0.54, path: 'M3 35 C20 12 22 54 37 27 S55 9 65 33 C75 55 85 12 100 30 S122 48 139 19' },
  { left: '51%', top: '90%', rotate: 5, delay: '17.6s', scale: 0.46, path: 'M4 34 C18 8 20 50 34 25 S54 15 58 36 C64 55 76 10 92 29 S116 46 132 20' },
];

const plans = [
  {
    name: 'Basic',
    eyebrow: 'A focused project finish',
    pages: 'Up to 62 pages',
    revisions: '3 revisions',
    features: ['PDF + DOCX delivery', 'Structured project specification', 'Editor quality check before release', 'Project history and progress tracking'],
  },
  {
    name: 'Standard',
    eyebrow: 'More room to present',
    pages: 'Up to 75 pages',
    revisions: '5 revisions',
    features: ['Everything in Basic', 'PDF + DOCX delivery', 'Project slide included', 'Tracked revision workflow', 'Editor QA before customer delivery'],
    featured: true,
  },
  {
    name: 'Premium',
    eyebrow: 'For the full final-year package',
    pages: '100–150 pages',
    revisions: '10 revisions',
    features: ['Everything in Standard', 'PDF + DOCX delivery', 'Project slide included', 'Simplified presentation guide', 'Priority project workflow and tracking'],
  },
];

const faqs = [
  {
    q: 'What is Finalyzed?',
    a: 'Finalyzed is a structured academic project-support marketplace. Students can find project specialists, define their exact project requirements, commission work, track progress, receive independent editor QA, and request revisions through one connected workflow.',
  },
  {
    q: 'Do I have to create an account before commissioning a project?',
    a: 'Yes. You can explore specialists and learn about the platform without an account, but commissioning a project requires authentication and completion of the Finalyzed registration process.',
  },
  {
    q: 'How does Finalyzed protect students from receiving unfinished work?',
    a: 'A completed project does not go straight from a specialist to the student. The specialist submits the work for editor review. The editor checks it against the student’s recorded specification and only an approved project can move into the customer delivery stage.',
  },
  {
    q: 'How do revisions work?',
    a: 'Each plan includes a defined number of revision sessions. After delivery, a student can request a revision from the project history. Once the specialist accepts the revision, one available revision is consumed. Additional revision capacity can be purchased using Finalyzed Points.',
  },
  {
    q: 'What are Finalyzed Points?',
    a: 'Finalyzed Points are the platform’s internal service-credit system. One point represents ₦10. Customers can purchase points for additional services, while writers and editors can use points within the professional workflow. Editors are the platform participants who can convert eligible points into cash.',
  },
  {
    q: 'How are specialists ranked?',
    a: 'Specialists are evaluated using delivery speed, accuracy, completed projects, customer ratings, written reviews, and other platform performance signals. This gives students more context than a name alone when choosing who to commission.',
  },
  {
    q: 'Can I see what my institution and department usually require?',
    a: 'Finalyzed is designed to build a searchable knowledge legacy. General project specifications, institutional formatting expectations, departments, and other non-sensitive project requirements can be organized so future students and specialists can learn from established patterns.',
  },
  {
    q: 'Who can join Finalyzed as a specialist or editor?',
    a: 'Anyone who wants to join as a project writer or editor must complete the appropriate registration information. Capability for professional roles remains subject to Finalyzed’s verification and approval workflow before those users can perform restricted work.',
  },
];

function SignatureWall() {
  const names = ['Ada','Maya','Daniel','Grace','David','Ruth','Samuel','Joy','Michael','Esther','John','Faith','Sarah','Emeka','Chisom','Tolu','Aisha','Daniel','Victor','Deborah','James','Amaka','Peter','Naomi','Joseph','Mercy','Kelvin','Ife','Joshua','Hannah','Nathan','Peace','Benjamin','Zainab','Caleb','Favour','Elijah','Abigail','Noah','Precious','Isaac','Mary','Gabriel','Rose','Andrew','Sophia','David','Evelyn'];
  return (
    <div className="signature-wall" aria-hidden="true">
      {Array.from({ length: 150 }, (_, index) => {
        const col = index % 10;
        const row = Math.floor(index / 10);
        const left = (col * 10.7 + ((row * 7) % 8) - 2) % 100;
        const top = (row * 6.8 + ((index * 13) % 5) - 2) % 100;
        const rotate = ((index * 17) % 34) - 17;
        const scale = 0.48 + ((index * 23) % 55) / 100;
        const delay = ((index * 0.73) % 22).toFixed(2);
        return (
          <span
            key={index}
            className="signature-name"
            style={{
              left: left + '%',
              top: top + '%',
              transform: 'rotate(' + rotate + 'deg) scale(' + scale + ')',
              animationDelay: delay + 's',
            }}
          >
            {names[index % names.length]}
          </span>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="w-full relative overflow-hidden">
      <SignatureWall />

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
              Join Us
            </Link>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="mono-label text-primary mb-3">The workflow</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Built around the way projects actually move.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">Every important handoff has a place, a status and a record — so the student, specialist and editor are never working in the dark.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <FileText className="w-6 h-6 text-primary" />, title: '1. Specify', desc: 'Complete the structured project questionnaire so your title, institution, department, formatting and project expectations are recorded.' },
              { icon: <Search className="w-6 h-6 text-primary" />, title: '2. Match', desc: 'Explore specialists by expertise, verification, ratings, reviews, completed work and delivery performance.' },
              { icon: <Shield className="w-6 h-6 text-primary" />, title: '3. Review', desc: 'Your specialist submits the finished work to an editor who checks it against the specification before customer delivery.' },
              { icon: <CheckCircle className="w-6 h-6 text-primary" />, title: '4. Finalize', desc: 'Review the approved document, request included revisions when necessary, and keep the complete project history in one place.' },
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: idx * 0.08 }}
                className="bento-card p-7 group"
              >
                <div className="bento-glow" />
                <div className="bg-primary/10 w-12 h-12 rounded-xl border border-primary/20 flex items-center justify-center mb-6 relative z-10 group-hover:scale-105 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-3 relative z-10">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="mono-label text-primary mb-3">Trust layer</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">More than a writer marketplace.</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Finalyzed connects the student, specialist and editor into one controlled workflow. That means requirements are captured before commissioning, quality is checked before delivery, and revisions are tied to the project record.
            </p>

            <ul className="space-y-5">
              {[
                ['Verified specialist profiles', 'Students can see verification status, ratings, reviews and performance signals.'],
                ['Independent editor QA', 'Completed work must pass the review stage before the specialist can release it to the student.'],
                ['Protected project flow', 'Payment, assignment, delivery and revision stages are connected to the same commissioned project.'],
                ['A growing academic knowledge base', 'Non-sensitive institutional and departmental requirements can become useful knowledge for future students and specialists.'],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="mt-0.5 bg-primary/10 rounded-xl border border-primary/20 p-2 shrink-0">
                    <BadgeCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="aspect-square md:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-border bg-muted">
              <img src="/finalyzed-1.png" alt="Finalyzed project support workflow" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/45 via-transparent to-primary/15" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -left-3 md:-left-8 bento-card p-5 flex items-center gap-4"
            >
              <div className="bg-primary/20 p-3 rounded-xl border border-primary/40 relative z-10">
                <Star className="w-7 h-7 text-primary fill-current" />
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-bold text-foreground tracking-tight">4.9<span className="text-sm font-mono text-muted-foreground ml-1">/5</span></p>
                <p className="mono-label mt-1">Example marketplace rating</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="relative px-4 sm:px-6 lg:px-8 py-24 md:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
            <div className="max-w-2xl">
              <p className="mono-label text-primary mb-3">Project plans</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">A plan that matches the size of your project.</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">Choose your delivery scope before commissioning. The final price can be presented during checkout once your project specification has been crosschecked.</p>
            </div>
            <div className="flex flex-col items-stretch md:items-end gap-4">
              <a href="#plans-grid" className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm">
                Compare Plans
                <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="w-4 h-4 text-primary" />
              <span>Secure, tracked commissioning</span>
            </div>
          </div>
          </div>

          <div id="plans-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-7 items-stretch">
            {plans.map((plan) => (
              <motion.article
                key={plan.name}
                whileHover={{ y: -5 }}
                className={`bento-card p-8 md:p-9 flex min-w-0 min-h-[520px] flex-col ${plan.featured ? 'border-primary/50 shadow-xl shadow-primary/10 ring-1 ring-primary/20' : ''}`}
              >
                {plan.featured && (
                  <div className="self-start badge-verified mb-5">Most popular</div>
                )}
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{plan.name}</p>
                <h3 className="text-2xl md:text-[1.65rem] font-bold mt-2 leading-tight">{plan.eyebrow}</h3>
                <div className="mt-8 border-y border-border py-6 space-y-4">
                  <div className="flex items-center gap-3"><Layers3 className="w-4 h-4 text-primary" /><span className="font-semibold">{plan.pages}</span></div>
                  <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-primary" /><span className="font-semibold">{plan.revisions}</span></div>
                </div>
                <ul className="space-y-3.5 mt-7 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`mt-9 w-full py-3.5 rounded-xl font-bold text-center transition-all ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}>
                  Choose {plan.name}
                </Link>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-muted/60 p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
            <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Before payment:</strong> Finalyzed records your project specification and crosschecks the required format, structure, institution, department and deliverables so the selected plan is tied to the right project brief.</p>
          </div>
        </div>
      </section>

      {/* READY CTA — intentionally before FAQ */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 mb-4">
        <div className="max-w-5xl mx-auto rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-muted to-muted p-8 md:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/15 blur-[110px]" />
          <div className="relative z-10">
            <div className="flex justify-center mb-5">
              <div className="badge-verified"><PenLine className="w-3.5 h-3.5" /> Ready when you are</div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">Ready to get your project organized?</h2>
            <p className="text-muted-foreground text-lg md:text-xl mb-9 max-w-2xl mx-auto leading-relaxed">
              Start with your project specification. Finalyzed takes it from there — matching the right specialist, tracking the workflow and keeping the quality layer in view.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg">
              Start Your Project
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="mono-label text-primary mb-3">Frequently asked</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Questions, answered.</h2>
            <p className="text-muted-foreground mt-4">A quick guide to how the Finalyzed marketplace and project workflow fit together.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.q} className={`rounded-2xl border bg-muted/50 overflow-hidden transition-colors ${open ? 'border-primary/35' : 'border-border'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    className="w-full flex items-center justify-between gap-6 text-left px-5 md:px-6 py-5"
                    aria-expanded={open}
                  >
                    <span className="font-bold text-foreground">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 md:px-6 pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
