import { useState } from 'react'
import { Settings2 } from 'lucide-react'

export default function ToolOptions({ tool, options, onChange }) {
  const set = (key, val) => onChange({ ...options, [key]: val })

  const renderOption = () => {
    switch (tool.id) {
      case 'split-pdf':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Split Mode</label>
              <div className="flex gap-2">
                {[
                  { val: 'byPage', label: 'Every Page' },
                  { val: 'byRange', label: 'Page Range' },
                  { val: 'everyN', label: 'Every N Pages' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => set('mode', val)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      options.mode === val
                        ? 'bg-brand-500 text-white'
                        : 'glass border border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {options.mode === 'byRange' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Page Range (e.g. 1-3, 5, 8-10)
                </label>
                <input
                  className="input-field text-sm"
                  placeholder="1-3, 5, 8-10"
                  value={options.range || ''}
                  onChange={(e) => set('range', e.target.value)}
                />
              </div>
            )}
            {options.mode === 'everyN' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Split every N pages</label>
                <input
                  type="number"
                  className="input-field text-sm w-32"
                  placeholder="2"
                  min={1}
                  value={options.n || ''}
                  onChange={(e) => set('n', e.target.value)}
                />
              </div>
            )}
          </div>
        )

      case 'compress-pdf':
        return (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Compression Level</label>
            <div className="flex gap-2">
              {[
                { val: 'low', label: 'Low', hint: 'Best quality' },
                { val: 'medium', label: 'Medium', hint: 'Balanced' },
                { val: 'high', label: 'High', hint: 'Smallest size' },
              ].map(({ val, label, hint }) => (
                <button
                  key={val}
                  onClick={() => set('quality', val)}
                  className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                    options.quality === val
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'glass border-white/5 text-slate-400 hover:border-brand-500/30'
                  }`}
                >
                  <div>{label}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{hint}</div>
                </button>
              ))}
            </div>
          </div>
        )

      case 'rotate-pdf':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rotation Angle</label>
              <div className="flex gap-2">
                {['90°', '180°', '270°'].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => set('angle', deg)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      options.angle === deg
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'glass border-white/5 text-slate-400 hover:border-brand-500/30'
                    }`}
                  >
                    ↻ {deg}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pages (leave empty for all)
              </label>
              <input
                className="input-field text-sm"
                placeholder="e.g. 1,3,5-8"
                value={options.pages || ''}
                onChange={(e) => set('pages', e.target.value)}
              />
            </div>
          </div>
        )

      case 'add-watermark':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Watermark Text</label>
              <input
                className="input-field text-sm"
                placeholder="CONFIDENTIAL"
                value={options.text || ''}
                onChange={(e) => set('text', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Opacity ({options.opacity || 30}%)</label>
                <input
                  type="range"
                  min={10} max={100}
                  value={options.opacity || 30}
                  onChange={(e) => set('opacity', e.target.value)}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Position</label>
                <select
                  className="input-field text-sm"
                  value={options.position || 'center'}
                  onChange={(e) => set('position', e.target.value)}
                >
                  {['center','top-left','top-right','bottom-left','bottom-right'].map(p => (
                    <option key={p} value={p}>{p.replace(/-/g,' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 'protect-pdf':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="Enter a strong password"
                value={options.password || ''}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>
          </div>
        )

      case 'page-numbers':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Position</label>
              <select className="input-field text-sm" value={options.position || 'bottom-center'} onChange={(e) => set('position', e.target.value)}>
                {['bottom-center','bottom-left','bottom-right','top-center','top-left','top-right'].map(p => (
                  <option key={p} value={p}>{p.replace(/-/g,' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start From</label>
              <input type="number" className="input-field text-sm" min={1} value={options.startFrom || 1} onChange={(e) => set('startFrom', e.target.value)} />
            </div>
          </div>
        )

      case 'translation':
        return (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Language</label>
            <select className="input-field text-sm" value={options.targetLanguage || ''} onChange={(e) => set('targetLanguage', e.target.value)}>
              <option value="">Select language…</option>
              {['Spanish','French','German','Chinese','Japanese','Hindi','Arabic','Portuguese','Russian','Korean','Italian','Dutch'].map(l => (
                <option key={l} value={l.toLowerCase()}>{l}</option>
              ))}
            </select>
          </div>
        )

      case 'pdf-to-images':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Format</label>
              <select className="input-field text-sm" value={options.format || 'png'} onChange={(e) => set('format', e.target.value)}>
                {['png','jpg','webp'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution (DPI)</label>
              <select className="input-field text-sm" value={options.dpi || '150'} onChange={(e) => set('dpi', e.target.value)}>
                {['72','96','150','300'].map(d => <option key={d} value={d}>{d} DPI</option>)}
              </select>
            </div>
          </div>
        )

      default: return null
    }
  }

  const content = renderOption()
  if (!content) return null

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 size={15} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-slate-300">Options</h3>
      </div>
      {content}
    </div>
  )
}
