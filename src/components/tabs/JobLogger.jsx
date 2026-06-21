import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Plus, Save, Search, Copy, Check,
  MessageCircle, Wifi, WifiOff, Trash2, ChevronDown, ChevronUp, FileText,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useCalculator } from '../../context/CalculatorContext'
import { saveJob, saveJobLocally, fetchAllJobs, getQueue } from '../../lib/offlineQueue'
import { refrigerantGuide } from '../../data/refrigerantGuide'

const REFRIGERANT_TYPES = ['R32', 'R410A', 'R22']
const EMPTY_FORM = {
  customer: '', location: '', model: '', brand: '',
  refrigerant: 'R32', serialNo: '',
  lowBefore: '', highBefore: '', lowAfter: '', highAfter: '',
  current: '', notes: '',
}

// ─── Refrigerant Guide ───────────────────────────────────────────────────────
function RefrigerantGuideTable({ unitSystem }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        ตารางอ้างอิงน้ำยาแอร์ — หน่วย {unitSystem}
      </p>
      {refrigerantGuide.map(r => (
        <div key={r.type} className="card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderLeft: `3px solid ${r.color}` }}>
            <span className="mono font-bold text-lg" style={{ color: r.color }}>{r.type}</span>
            <span className="text-xs text-slate-400 flex-1">{r.notes}</span>
          </div>
          <div className="px-4 pb-3 grid grid-cols-3 gap-3">
            <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">แรงดันต่ำ</p>
              <p className="mono font-bold text-sm text-white">
                {r.lowPressure[unitSystem]}
              </p>
              <p className="text-[10px] text-slate-500">{unitSystem}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">แรงดันสูง</p>
              <p className="mono font-bold text-sm text-white">
                {r.highPressure[unitSystem]}
              </p>
              <p className="text-[10px] text-slate-500">{unitSystem}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">กระแส</p>
              <p className="font-bold text-xs text-white leading-tight">{r.normalCurrent}</p>
            </div>
          </div>
          {r.warning && (
            <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: `${r.warningColor}15`, border: `1px solid ${r.warningColor}40` }}>
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-semibold" style={{ color: r.warningColor }}>{r.warning}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function generateLINEReport({ form, sharedBTU, unitSystem }) {
  const lowBeforeVal = parseFloat(form.lowBefore)
  const lowAfterVal = parseFloat(form.lowAfter)
  const highBeforeVal = parseFloat(form.highBefore)
  const highAfterVal = parseFloat(form.highAfter)

  const hasLowDiff = !isNaN(lowBeforeVal) && !isNaN(lowAfterVal)
  const hasHighDiff = !isNaN(highBeforeVal) && !isNaN(highAfterVal)

  const lowDiff = hasLowDiff ? (lowAfterVal - lowBeforeVal) : null
  const highDiff = hasHighDiff ? (highAfterVal - highBeforeVal) : null

  let diffParts = []
  if (lowDiff !== null) diffParts.push(`Low: ${lowDiff >= 0 ? '+' : ''}${lowDiff.toFixed(1)}`)
  if (highDiff !== null) diffParts.push(`High: ${highDiff >= 0 ? '+' : ''}${highDiff.toFixed(1)}`)
  const calculatedDiff = diffParts.length > 0 ? `${diffParts.join(' / ')}` : '-'
  const diffUnit = diffParts.length > 0 ? ` ${unitSystem}` : ''

  return `----------------------------------------
🛠️ **รายงานการตรวจเช็คเครื่องปรับอากาศ (Air Buddy Pro)**
----------------------------------------
👤 **ลูกค้า:** ${form.customer || '-'} | 📞 ${form.phone || '-'}
❄️ **เครื่อง:** ${form.brand || '-'} - ${form.model || '-'} (${form.serialNo || '-'})
🧪 **น้ำยา:** ${form.refrigerant || '-'}
⚡ **กระแสไฟ:** ${form.current || '-'} A
📊 **ความดันน้ำยาแอร์:**
  • ก่อนบริการ: ${form.lowBefore || '-'} / ${form.highBefore || '-'} ${unitSystem}
  • หลังบริการ: ${form.lowAfter || '-'} / ${form.highAfter || '-'} ${unitSystem}
  • ส่วนต่าง: ${calculatedDiff}${diffUnit}
📝 **บันทึกช่าง:** ${form.notes || '-'}
----------------------------------------
ขอบคุณที่ใช้บริการครับ 🙏`
}

const InputField = ({ id, label, placeholder, value, onChange, type = 'text', inputMode }) => (
  <div>
    <label className="label">{label}</label>
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input-field"
    />
  </div>
)

// ─── Job Logger Form ─────────────────────────────────────────────────────────
function JobLoggerForm({ unitSystem, sharedBTU, scannedJobData, onJobSaved }) {
  const { isOnline } = useApp()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null) // 'online' | 'offline' | null
  const [lineReport, setLineReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Apply scanned data when it arrives
  useEffect(() => {
    if (scannedJobData) {
      setForm(prev => ({ ...prev, ...scannedJobData }))
    }
  }, [scannedJobData])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    const record = { ...form, btu: sharedBTU || null, unit: unitSystem }
    let result
    if (!isOnline) {
      saveJobLocally(record)
      result = { saved: 'offline' }
    } else {
      result = await saveJob(record)
      if (result.saved === 'offline') saveJobLocally(record)
    }
    setSaved(result.saved)
    setSaving(false)
    onJobSaved?.()
    setTimeout(() => setSaved(null), 4000)
  }

  const handleGenerateReport = () => {
    const report = generateLINEReport({ form, sharedBTU, unitSystem })
    setLineReport(report)
    setShowReport(true)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lineReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenLINE = () => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(lineReport)}`;
    window.open(url, '_blank');
  }

  const pressureLabel = `แรงดัน (${unitSystem})`

  return (
    <div className="space-y-4">
      {/* Scanned data badge */}
      {scannedJobData && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg animate-fadeInDown">
          <span className="text-purple-400 text-sm">📷</span>
          <p className="text-xs text-purple-400 font-semibold">ข้อมูลจากการสแกนเพลทถูกกรอกอัตโนมัติแล้ว</p>
        </div>
      )}

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ข้อมูลลูกค้า</h3>
        <InputField id="job-customer" label="ชื่อลูกค้า" placeholder="นายสมชาย ใจดี" value={form.customer} onChange={v => set('customer', v)} />
        <InputField id="job-location" label="สถานที่ / ที่อยู่" placeholder="123 ถ.สุขุมวิท กรุงเทพฯ" value={form.location} onChange={v => set('location', v)} />
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ข้อมูลเครื่องแอร์</h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField id="job-brand" label="ยี่ห้อ" placeholder="Daikin" value={form.brand} onChange={v => set('brand', v)} />
          <InputField id="job-model" label="รุ่น" placeholder="FTKQ12UV2S" value={form.model} onChange={v => set('model', v)} />
        </div>
        <InputField id="job-serial" label="ซีเรียลนัมเบอร์" placeholder="23A012345" value={form.serialNo} onChange={v => set('serialNo', v)} />
        <div>
          <label className="label">ประเภทน้ำยา</label>
          <div className="flex gap-2">
            {REFRIGERANT_TYPES.map(r => (
              <button
                key={r}
                id={`job-ref-${r}`}
                onClick={() => set('refrigerant', r)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                  ${form.refrigerant === r
                    ? 'bg-sky-500/20 border border-sky-500/50 text-sky-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 active:bg-slate-700'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ค่าวัด — {unitSystem}</h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField id="job-low-before" label="Low ก่อน" placeholder="80" value={form.lowBefore} onChange={v => set('lowBefore', v)} inputMode="decimal" />
          <InputField id="job-low-after" label="Low หลัง" placeholder="110" value={form.lowAfter} onChange={v => set('lowAfter', v)} inputMode="decimal" />
          <InputField id="job-high-before" label="High ก่อน" placeholder="250" value={form.highBefore} onChange={v => set('highBefore', v)} inputMode="decimal" />
          <InputField id="job-high-after" label="High หลัง" placeholder="380" value={form.highAfter} onChange={v => set('highAfter', v)} inputMode="decimal" />
        </div>
        <InputField id="job-current" label="กระแสขณะทำงาน (A)" placeholder="5.2" value={form.current} onChange={v => set('current', v)} inputMode="decimal" />
      </div>

      <div className="card p-4">
        <label className="label">หมายเหตุ / สิ่งที่ทำ</label>
        <textarea
          id="job-notes"
          placeholder="เช่น ล้างแอร์, เติมน้ำยา, เปลี่ยน Capacitor..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="input-field resize-none"
          rows={3}
        />
      </div>

      {/* Save button */}
      <button id="job-save" onClick={handleSave} disabled={saving} className="btn-success">
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {saving ? 'กำลังบันทึก...' : 'บันทึกงาน'}
      </button>

      {/* Save status */}
      {saved && (
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl animate-fadeInDown
          ${saved === 'online'
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-amber-500/10 border border-amber-500/30'}`}
        >
          {saved === 'online' ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-amber-400" />}
          <p className={`text-sm font-semibold ${saved === 'online' ? 'text-green-400' : 'text-amber-400'}`}>
            {saved === 'online' ? '✅ บันทึกขึ้น Cloud สำเร็จ' : '📦 บันทึกในเครื่อง (Offline) — จะ Sync อัตโนมัติ'}
          </p>
        </div>
      )}

      {/* LINE Report */}
      <button id="job-line-report" onClick={handleGenerateReport} className="btn-primary" style={{ background: 'linear-gradient(135deg, #06b000, #00c300)' }}>
        <MessageCircle size={18} />
        สร้างรายงาน LINE
      </button>

      {showReport && (
        <div className="card p-4 space-y-3 animate-fadeInDown">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-green-400">รายงาน LINE Report</p>
            <button onClick={() => setShowReport(false)} className="text-slate-500 text-xs">ซ่อน</button>
          </div>
          <pre className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
            {lineReport}
          </pre>
          <div className="flex gap-2">
            <button onClick={handleCopy} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
              ${copied ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'bg-slate-700 border border-slate-600 text-white'}`}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </button>
            <button onClick={handleOpenLINE} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #06b000, #00c300)', color: '#fff' }}>
              <MessageCircle size={16} />
              เปิด LINE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Job History ─────────────────────────────────────────────────────────────
function JobHistory({ refresh }) {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const queueCount = getQueue().length

  const load = useCallback(async () => {
    setLoading(true)
    const all = await fetchAllJobs()
    setJobs(all)
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load, refresh])

  const filtered = jobs.filter(j =>
    (j.customer || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.model || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.brand || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      {queueCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-fadeInDown">
          <WifiOff size={14} className="text-amber-400" />
          <p className="text-xs text-amber-400 font-semibold">{queueCount} รายการรอ Sync เมื่อออนไลน์</p>
        </div>
      )}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="job-search"
          type="text"
          placeholder="ค้นหางาน..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <FileText size={36} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">ยังไม่มีประวัติงาน</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job, i) => (
            <div key={job.id || i} className="card">
              <button
                className="w-full flex items-center justify-between p-3.5 text-left"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div>
                  <p className="font-bold text-white text-sm">{job.customer || 'ไม่ระบุชื่อ'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{job.brand} {job.model} · {job.refrigerant} · {new Date(job.created_at).toLocaleDateString('th-TH')}</p>
                </div>
                {expanded === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {expanded === i && (
                <div className="border-t border-slate-700/50 px-4 py-3 grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['สถานที่', job.location],
                    ['ซีเรียล', job.serialNo],
                    [`Low ก่อน/หลัง`, `${job.lowBefore||'-'} / ${job.lowAfter||'-'}`],
                    [`High ก่อน/หลัง`, `${job.highBefore||'-'} / ${job.highAfter||'-'}`],
                    ['กระแส', job.current ? `${job.current} A` : '-'],
                    ['BTU', job.btu ? `${Number(job.btu).toLocaleString()} BTU` : '-'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-slate-500">{l}</p>
                      <p className="text-slate-200 font-semibold">{v || '-'}</p>
                    </div>
                  ))}
                  {job.notes && (
                    <div className="col-span-2">
                      <p className="text-slate-500">หมายเหตุ</p>
                      <p className="text-slate-200">{job.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Job Logger Tab ─────────────────────────────────────────────────────
export default function JobLogger() {
  const { unitSystem } = useApp()
  const { sharedBTU, scannedJobData } = useCalculator()
  const [subTab, setSubTab] = useState(0)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <BookOpen size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">สมุดบันทึกงาน</h1>
          <p className="text-xs text-slate-400">บันทึกงานและตารางน้ำยาอ้างอิง</p>
        </div>
      </div>

      {/* Sub-tab */}
      <div className="flex gap-2 bg-slate-800/80 p-1 rounded-xl">
        {['📋 บันทึกงาน', '💾 ประวัติงาน', '❄️ ตารางน้ำยา'].map((label, i) => (
          <button
            key={i}
            id={`job-subtab-${i}`}
            onClick={() => setSubTab(i)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all
              ${subTab === i
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 active:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 0 && (
        <JobLoggerForm
          unitSystem={unitSystem}
          sharedBTU={sharedBTU}
          scannedJobData={scannedJobData}
          onJobSaved={() => setHistoryRefresh(p => p + 1)}
        />
      )}
      {subTab === 1 && <JobHistory refresh={historyRefresh} />}
      {subTab === 2 && <RefrigerantGuideTable unitSystem={unitSystem} />}
    </div>
  )
}
