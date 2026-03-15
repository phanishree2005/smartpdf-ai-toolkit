import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function ToolCard({ tool, index = 0 }) {
  const href = tool.isAI ? `/ai/${tool.id}` : `/tool/${tool.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Link to={href} className="block group">
        <div
          className="tool-card h-full"
          style={{ '--card-accent': tool.color }}
        >
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse at top left, ${tool.color}18 0%, transparent 60%)`,
            }}
          />

          {/* Popular badge */}
          {tool.popular && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-wider">
                Popular
              </span>
            </div>
          )}

          {/* AI badge */}
          {tool.isAI && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                <Sparkles size={9} />
                AI
              </span>
            </div>
          )}

          {/* Icon */}
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl"
            style={{ background: `${tool.color}18`, border: `1px solid ${tool.color}30` }}
          >
            <span role="img" aria-label={tool.name}>{tool.icon}</span>
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 20px ${tool.color}40` }}
            />
          </div>

          {/* Content */}
          <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors mb-1.5">
            {tool.name}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
            {tool.description}
          </p>

          {/* Arrow */}
          <div className="mt-4 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0"
            style={{ color: tool.color }}>
            Open tool <ArrowRight size={12} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
