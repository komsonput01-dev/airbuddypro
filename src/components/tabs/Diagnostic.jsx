import { useState } from 'react'
import { Stethoscope, Search, ChevronRight, ChevronDown, RotateCcw, AlertTriangle } from 'lucide-react'
import { diagnosticTree } from '../../data/diagnosticTree'
import { errorCodes } from '../../data/errorCodes'

const BRANDS = ['Daikin', 'Mitsubishi', 'Carrier', 'Haier']

// ─── Error Code Finder ──────────────────────────────────────────────────────
function ErrorCodeFinder() {
  const [brand, setBrand] = useState('Daikin')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const codes = errorCodes[brand] || []
  const filtered = codes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.cause.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      {/* Brand selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {BRANDS.map(b => (
          <button
            key={b}
            id={`errc-brand-${b}`}
            onClick={() => { setBrand(b); setExpanded(null); setSearch('') }}
            className={`chip flex-shrink-0 ${brand === b ? 'active' : ''}`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="errc-search"
          type="text"
          placeholder="ค้นหาโค้ด / อาการ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Search size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ไม่พบโค้ดที่ค้นหา</p>
          </div>
        )}
        {filtered.map(c => (
          <div key={c.code} className="card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3.5 text-left"
              onClick={() => setExpanded(expanded === c.code ? null : c.code)}
            >
              <div className="flex items-center gap-3">
                <span className="mono font-bold text-red-400 text-lg w-10">{c.code}</span>
                <div>
                  <p className="text-sm font-semibold text-white leading-snug">{c.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.cause}</p>
                </div>
              </div>
              {expanded === c.code
                ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
            </button>
            {expanded === c.code && (
              <div className="border-t border-slate-700/70 bg-slate-900/50 px-4 py-3 space-y-2">
                <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">ขั้นตอนการแก้ไข</p>
                {c.steps.map((step, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="mono text-xs font-bold text-sky-500 flex-shrink-0 w-5">{i + 1}.</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Interactive Checklist ───────────────────────────────────────────────────
function ProbabilityBar({ value, color }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: color,
          }}
        />
      </div>
      <span className="mono text-xs font-bold" style={{ color }}>{value}%</span>
    </div>
  )
}

function InteractiveChecklist() {
  const [symptom, setSymptom] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState('q1')
  const [results, setResults] = useState(null)

  const tree = symptom ? diagnosticTree.find(s => s.id === symptom) : null

  const handleSymptom = (id) => {
    setSymptom(id)
    setAnswers({})
    setCurrentQ('q1')
    setResults(null)
  }

  const handleAnswer = (option) => {
    const newAnswers = { ...answers, [currentQ]: option.label }
    setAnswers(newAnswers)

    if (option.results) {
      setResults(option.results)
    } else if (option.next) {
      setCurrentQ(option.next)
    }
  }

  const reset = () => {
    setSymptom(null)
    setAnswers({})
    setCurrentQ('q1')
    setResults(null)
  }

  const currentQuestion = tree?.questions.find(q => q.id === currentQ)

  return (
    <div className="space-y-3">
      {/* Symptom selection */}
      {!symptom && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">เลือกอาการที่พบ</p>
          {diagnosticTree.map(s => (
            <button
              key={s.id}
              id={`diag-symptom-${s.id}`}
              onClick={() => handleSymptom(s.id)}
              className="w-full flex items-center justify-between p-4 card active:bg-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <p className="font-semibold text-white text-left">{s.label}</p>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          ))}
        </div>
      )}

      {/* Breadcrumb */}
      {symptom && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{diagnosticTree.find(s => s.id === symptom)?.icon}</span>
            <p className="text-sm font-bold text-white">
              {diagnosticTree.find(s => s.id === symptom)?.label}
            </p>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 active:text-white">
            <RotateCcw size={13} />
            เริ่มใหม่
          </button>
        </div>
      )}

      {/* Answer trail */}
      {Object.keys(answers).length > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-3 space-y-1">
          {Object.entries(answers).map(([q, a]) => (
            <div key={q} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
              {a}
            </div>
          ))}
        </div>
      )}

      {/* Current Question */}
      {symptom && currentQuestion && !results && (
        <div className="card p-4 space-y-3 animate-fadeInDown">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-white leading-snug">{currentQuestion.text}</p>
          </div>
          <div className="space-y-2">
            {currentQuestion.options.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt)}
                className="w-full text-left px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700
                  active:bg-sky-500/20 active:border-sky-500/50 transition-all text-sm font-medium text-slate-200"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3 animate-fadeInDown">
          <p className="text-xs font-bold text-green-400 uppercase tracking-wider">📊 ผลการวินิจฉัย</p>
          {results.map((r, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-white text-sm leading-snug">{r.text}</p>
              </div>
              <ProbabilityBar
                value={r.probability}
                color={r.probability >= 70 ? '#f87171' : r.probability >= 40 ? '#fb923c' : '#4ade80'}
              />
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-sky-400 mb-1">🔧 วิธีแก้ไข</p>
                <p className="text-sm text-slate-300 leading-relaxed">{r.fix}</p>
              </div>
            </div>
          ))}
          <button onClick={reset} className="btn-secondary">
            <RotateCcw size={16} />
            วินิจฉัยอาการใหม่
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Diagnostic Tab ─────────────────────────────────────────────────────
export default function Diagnostic() {
  const [subTab, setSubTab] = useState(0)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Stethoscope size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">วินิจฉัยอาการเสีย</h1>
          <p className="text-xs text-slate-400">ค้นหาโค้ดและวินิจฉัยด้วย AI</p>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-2 bg-slate-800/80 p-1 rounded-xl">
        {['🔍 วินิจฉัยอาการ', '📟 Error Code'].map((label, i) => (
          <button
            key={i}
            id={`diag-subtab-${i}`}
            onClick={() => setSubTab(i)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
              ${subTab === i
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 active:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === 0 ? <InteractiveChecklist /> : <ErrorCodeFinder />}
    </div>
  )
}
