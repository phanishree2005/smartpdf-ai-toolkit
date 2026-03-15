import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Shield, Sparkles, Globe, Clock, ChevronRight, Star } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { TOOLS } from '../utils/tools'

const STATS = [
  { value: '10M+', label: 'PDFs Processed' },
  { value: '50+', label: 'Countries' },
  { value: '30+', label: 'AI-Powered Tools' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const FEATURES = [
  {
    icon: <Sparkles size={22} />,
    title: 'AI-Powered Intelligence',
    desc: 'GPT-4o summarizes, answers questions, extracts tables, and classifies documents instantly.',
    color: '#6471f5',
  },
  {
    icon: <Shield size={22} />,
    title: 'Bank-Grade Security',
    desc: 'End-to-end encryption, automatic file deletion after 1 hour, GDPR & SOC 2 compliant.',
    color: '#10b981',
  },
  {
    icon: <Globe size={22} />,
    title: 'Cloud-Native Scale',
    desc: 'Backed by distributed job queues, process hundreds of files simultaneously.',
    color: '#06d6d6',
  },
  {
    icon: <Clock size={22} />,
    title: 'Lightning Fast',
    desc: 'Optimized processing pipeline delivers results in seconds, not minutes.',
    color: '#f59e0b',
  },
]

const POPULAR_TOOLS = TOOLS.filter((t) => t.popular).slice(0, 6)

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Navbar />

      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb w-[600px] h-[600px] bg-brand-600/20 -top-40 -left-40" />
        <div className="glow-orb w-[400px] h-[400px] bg-violet-600/15 top-1/3 -right-32" style={{ animationDelay: '3s' }} />
        <div className="glow-orb w-[300px] h-[300px] bg-cyan-600/10 bottom-1/4 left-1/4" style={{ animationDelay: '6s' }} />
      </div>

      {/* ── HERO ─────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-sm font-medium text-brand-300 mb-8"
          >
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            Now with GPT-4o document intelligence
            <ChevronRight size={14} className="text-brand-500" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-extrabold leading-[1.05] tracking-tight mb-6"
          >
            The PDF toolkit
            <br />
            <span className="gradient-text">supercharged with AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Merge, split, compress, convert, and analyse documents with 30+ tools.
            Powered by AI. No signup required for basic tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard" className="btn-primary px-8 py-4 text-base flex items-center gap-2 group">
              Start for free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="btn-secondary px-8 py-4 text-base">
              View all 30+ tools
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-600"
          >
            <div className="flex -space-x-2">
              {['#6471f5','#10b981','#f59e0b','#f43f5e','#06d6d6'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-dark-900" style={{ background: c }} />
              ))}
            </div>
            <div className="flex items-center gap-1 ml-3">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span>10,000+ professionals trust SmartPDF</span>
          </motion.div>
        </div>

        {/* Hero visual – floating tool cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-4xl mx-auto mt-20"
        >
          <div className="relative glass rounded-3xl border border-white/8 p-8 shadow-2xl overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-glow-brand opacity-30 pointer-events-none" />

            {/* Window chrome */}
            <div className="flex items-center gap-2 mb-6">
              {['#f43f5e','#f59e0b','#10b981'].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
              <div className="ml-4 flex-1 h-7 glass rounded-lg px-3 flex items-center">
                <span className="text-xs text-slate-600 font-mono">smartpdf.io/dashboard</span>
              </div>
            </div>

            {/* Mini dashboard grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POPULAR_TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.07 }}
                  className="glass rounded-xl p-4 border border-white/5 hover:border-brand-500/30 transition-all group cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-3"
                    style={{ background: `${tool.color}20` }}
                  >
                    {tool.icon}
                  </div>
                  <p className="text-sm font-medium text-slate-300">{tool.name}</p>
                  {tool.isAI && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-violet-400">
                      <Sparkles size={8} /> AI
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ───────────────────────────── */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-display font-extrabold gradient-text mb-1">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-3">Why SmartPDF</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Built for the modern workflow
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Every feature designed to save you time and protect your data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 flex gap-5"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                >
                  {icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL TOOLS GRID ──────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-3">Tools</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Everything you need, in one place
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={tool.isAI ? `/ai/${tool.id}` : `/tool/${tool.id}`}
                  className="glass rounded-xl p-4 flex flex-col items-start gap-2 hover:border-brand-500/30 border border-white/5 transition-all duration-200 hover:-translate-y-0.5 group block"
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-tight">
                    {tool.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative glass-card p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-violet-600/10 pointer-events-none" />
            <div className="glow-orb w-64 h-64 bg-brand-500/20 -top-20 -right-20 animate-pulse-slow" />

            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-6 bg-gradient-to-br from-brand-500 to-violet-600 rounded-2xl flex items-center justify-center">
                <Zap size={28} className="text-white" fill="white" />
              </div>
              <h2 className="text-4xl font-display font-bold mb-4">
                Start processing smarter
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Free forever for basic tools. Unlock AI features and batch processing with Pro.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary px-8 py-4 text-base flex items-center gap-2 group">
                  Get started free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Explore all tools →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
