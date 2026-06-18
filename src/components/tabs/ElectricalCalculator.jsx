import { useState, useEffect } from 'react'
import { Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { useCalculator } from '../../context/CalculatorContext'

const STANDARD_BTUS = [9000, 12000, 18000, 24000, 30000, 36000]
const BREAKER_SIZES = [10, 16, 20, 25, 32, 40, 50, 63]

function getWireSize(amps) {
  if (amps <= 6)  return { main: '1.5', desc: 'THW 1.5 ตร.มม.' }
  if (amps <= 11) return { main: '2.5', desc: 'THW 2.5 ตร.มม.' }
  if (amps <= 15) return { main: '4.0', desc: 'THW 4.0 ตร.มม.' }
  if (amps <= 20) return { main: '6.0', desc: 'THW 6.0 ตร.มม.' }
  return { main: '10.0', desc: 'THW 10.0 ตร.มม.' }
}

function getBreakerSize(amps) {
  const required = amps * 1.25
  return BREAKER_SIZES.find(b => b >= required) || 63
}

function calcElectrical(btu) {
  if (!btu) return null
  const runningAmps = btu / (11 * 220)
  const breakerSize = getBreakerSize(runningAmps)
  const wire = getWireSize(runningAmps)
  return {
    runningAmps: runningAmps.toFixed(2),
    breakerSize,
    wire,
    groundWire: '1.5 ตร.มม. (ขั้นต่ำ)',
    safetyAmps: (runningAmps * 1.25).toFixed(2),
  }
}

function ResultRow({ label, value, sub, color = 'text-white', icon }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
      <p className={`mono font-bold text-lg ${color}`}>{value}</p>
    </div>
  )
}

export default function ElectricalCalculator() {
  const { sharedBTU } = useCalculator()
  const [selectedBTU, setSelectedBTU] = useState('')
  const [result, setResult] = useState(null)

  // Auto-populate from BTU Calculator
  useEffect(() => {
    if (sharedBTU) {
      setSelectedBTU(String(sharedBTU))
    }
  }, [sharedBTU])

  // Auto-calculate when BTU is set
  useEffect(() => {
    const btu = parseFloat(selectedBTU)
    if (btu > 0) {
      setResult(calcElectrical(btu))
    } else {
      setResult(null)
    }
  }, [selectedBTU])

  const fromBTUCalc = sharedBTU && String(sharedBTU) === selectedBTU

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Zap size={20} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">คำนวณไฟฟ้าและสายไฟ</h1>
          <p className="text-xs text-slate-400">มาตรฐานวิศวกรรมไฟฟ้าไทย</p>
        </div>
      </div>

      {/* Auto-filled badge */}
      {fromBTUCalc && (
        <div className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 border border-sky-500/30 rounded-lg animate-fadeInDown">
          <CheckCircle size={14} className="text-sky-400" />
          <p className="text-xs text-sky-400 font-semibold">
            รับค่า BTU จากการคำนวณ — {Number(sharedBTU).toLocaleString()} BTU
          </p>
        </div>
      )}

      {/* Input Card */}
      <div className="card p-4 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ขนาด BTU</h2>

        {/* Manual entry */}
        <div>
          <label className="label">กรอก BTU โดยตรง</label>
          <input
            id="elec-btu-input"
            type="number"
            inputMode="numeric"
            placeholder="เช่น 12000"
            value={selectedBTU}
            onChange={e => setSelectedBTU(e.target.value)}
            className="input-field text-center text-xl font-bold mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 font-semibold">หรือเลือกขนาดมาตรฐาน</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Standard size picker */}
        <div className="grid grid-cols-3 gap-2">
          {STANDARD_BTUS.map(btu => (
            <button
              key={btu}
              id={`elec-btu-${btu}`}
              onClick={() => setSelectedBTU(String(btu))}
              className={`py-3 rounded-xl text-sm font-bold transition-all
                ${selectedBTU === String(btu)
                  ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 active:bg-slate-700'}`}
            >
              <span className="mono">{(btu / 1000).toFixed(0)}K</span>
              <br />
              <span className="text-[9px] font-normal text-slate-500">BTU</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="space-y-3 animate-fadeInDown">
          {/* Formula info */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              สูตร: กระแส = BTU ÷ (11 × 220V) · เบรกเกอร์ = กระแส × 1.25 (ปัดขึ้น)
            </p>
          </div>

          {/* Main Result Card */}
          <div className="card-highlight p-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-yellow-400" />
              <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wider">
                สรุปค่าไฟฟ้าที่แนะนำ
              </h3>
            </div>

            <ResultRow
              label="กระแสขณะทำงาน"
              sub="Running Current"
              value={`${result.runningAmps} A`}
              color="text-sky-400"
              icon="⚡"
            />
            <ResultRow
              label="เบรกเกอร์ที่แนะนำ"
              sub={`Safety factor 1.25× = ${result.safetyAmps}A → ปัดขึ้น`}
              value={`${result.breakerSize} A`}
              color="text-yellow-400"
              icon="🔌"
            />
            <ResultRow
              label="สายไฟหลัก"
              sub="Main Wire (THW/VAF Copper)"
              value={result.wire.main + ' ตร.มม.'}
              color="text-green-400"
              icon="🔶"
            />
            <ResultRow
              label="สายดิน"
              sub="Ground Wire (ขั้นต่ำตามมาตรฐาน)"
              value="1.5 ตร.มม."
              color="text-purple-400"
              icon="🟢"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
            <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              ค่าที่แสดงเป็นค่าขั้นต่ำตามมาตรฐาน ควรให้วิศวกรไฟฟ้าตรวจสอบก่อนติดตั้งจริงเสมอ
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
