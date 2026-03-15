import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Bell, Key, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../context/themeStore'
import { authAPI } from '../utils/api'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('profile')

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.updateProfile(form)
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setLoading(false) }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">Account Settings</h1>
        <p className="text-slate-500">Manage your profile and preferences.</p>
      </motion.div>

      {/* Avatar + Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">{user?.name}</h2>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/20">
            {user?.plan === 'pro' ? '⭐ Pro Plan' : '🆓 Free Plan'}
          </span>
        </div>
        <div className="ml-auto">
          <button className="btn-secondary text-sm">Upgrade to Pro</button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1 border border-white/5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-brand-500 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <User size={12} className="inline mr-1" /> Full Name
              </label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Mail size={12} className="inline mr-1" /> Email Address
              </label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save changes
            </button>
          </form>
        </motion.div>
      )}

      {tab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Key size={12} className="inline mr-1" /> Current Password
            </label>
            <input type="password" className="input-field" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
            <input type="password" className="input-field" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <input type="password" className="input-field" placeholder="••••••••" />
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Shield size={14} /> Update Password
          </button>
        </motion.div>
      )}

      {tab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
          {[
            { label: 'Processing complete', desc: 'Get notified when your file is ready' },
            { label: 'Storage limit warnings', desc: 'Alert when approaching plan limits' },
            { label: 'Product updates', desc: 'New tools and feature announcements' },
            { label: 'Weekly digest', desc: 'Summary of your document activity' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-white/10 peer-checked:bg-brand-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-brand-500/30 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
          <button className="btn-primary text-sm flex items-center gap-2 mt-2">
            <Save size={14} /> Save preferences
          </button>
        </motion.div>
      )}
    </div>
  )
}
