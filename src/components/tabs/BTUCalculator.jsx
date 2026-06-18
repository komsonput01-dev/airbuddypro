import { useState } from 'react'
import { Wind, Sun, ChevronRight, CheckCircle, ArrowRight } from 'lucide-react'
import { useCalculator } from '../../context/CalculatorContext'

const ROOM_TYPES = [
  { label: 'ห้องนอน', factor: 700 },
  { label: 'ห้องทำงาน / นั่งเล่น', factor: 800 },
  { label: 'ห้องรับแขก / ร้านค้า', factor: 900 },
  { label: 'ร้านอาหาร / ชาบูที่มีหม้อต้ม', factor: 1100 },
]

const STANDARD_SIZES = [9000, 12000, 18000, 24000, 30000, 36000]

function findNearestSizes(btu) {
  // Return the nearest size equal or above, plus one above that
  const sorted = [...STANDARD_SIZES]
  const above = sorted.filter(s => s >= btu)
  const below = sorted.filter(s => s < btu)
  const result = []
  if (above.length > 0) result.push(above[0])
  if (above.length > 1) result.push(above[1])
  if (result.length < 2 && below.length > 0) result.unshift(below[below.length - 1])
  return result
}

function Toggle({ on, onToggle, label }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 w-full p-3.5 rounded-xl border transition-all duration-200
        ${on
          ? 'bg-amber-500/10 border-amber-500/40'
          : 'bg-slate-800/60 border-slate-700'
        }`}
    >
      <div className={`toggle-track ${on ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
      <div className="text-left flex-1">
        <p className={`text-sm font-semibold ${on ? 'text-amber-400' : 'text-slate-300'}`}>
          {label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {on ? '+100 BTU factor เพิ่มเติม' : 'ไม่เพิ่ม Factor'}
        </p>
      </div>
      <Sun size={18} className={on ? 'text-amber-400' : 'text-slate-600'} />
    </button>
  )
}

export default function BTUCalculator({ onNavigate }) {
  const { setSharedBTU } = useCalculator()
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [height, setHeight] = useState('')
  const [roomTypeIdx, setRoomTypeIdx] = useState(0)
  const [sunlight, setSunlight] = useState(false)
  const [result, setResult] = useState(null)

  const calculate = () => {
    const w = parseFloat(width)
    const l = parseFloat(length)
    const h = parseFloat(height) || 3.0
    if (!w || !l || w <= 0 || l <= 0) return

    const baseFactor = ROOM_TYPES[roomTypeIdx].factor + (sunlight ? 100 : 0)
    let btu = w * l * baseFactor
    if (h > 3.0) btu = btu * (h / 3.0)
    btu = Math.round(btu)

    setResult({
      btu,
      area: w * l,
      factor: baseFactor,
      height: h,
      sizes: findNearestSizes(btu),
    })
  }

  const handleUseSize = (size) => {
    setSharedBTU(size)
    onNavigate(1) // Switch to Electrical tab
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <Wind size={20} className="text-sky-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">คำนวณขนาดแอร์</h1>
          <p className="text-xs text-slate-400">ระบบคำนวณ BTU จากพื้นที่</p>
        </div>
      </div>

      {/* Inputs Card */}
      <div className="card p-4 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ขนาดห้อง</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">กว้าง (ม.)</label>
            <input
              id="btu-width"
              type="number"
              inputMode="decimal"
              placeholder="3.0"
              value={width}
              onChange={e => setWidth(e.target.value)}
              className="input-field text-center text-lg font-bold"
            />
          </div>
          <div>
            <label className="label">ยาว (ม.)</label>
            <input
              id="btu-length"
              type="number"
              inputMode="decimal"
              placeholder="4.0"
              value={length}
              onChange={e => setLength(e.target.value)}
              className="input-field text-center text-lg font-bold"
            />
          </div>
          <div>
            <label className="label">สูง (ม.)</label>
            <input
              id="btu-height"
              type="number"
              inputMode="decimal"
              placeholder="2.7"
              value={height}
              onChange={e => setHeight(e.target.value)}
              className="input-field text-center text-lg font-bold"
            />
          </div>
        </div>

        {/* Room Type */}
        <div>
          <label className="label">ประเภทห้อง</label>
          <select
            id="btu-roomtype"
            value={roomTypeIdx}
            onChange={e => setRoomTypeIdx(Number(e.target.value))}
            className="input-field"
          >
            {ROOM_TYPES.map((rt, i) => (
              <option key={i} value={i}>
                {rt.label} (Factor: {rt.factor})
              </option>
            ))}
          </select>
        </div>

        {/* Sunlight Toggle */}
        <Toggle
          on={sunlight}
          onToggle={() => setSunlight(p => !p)}
          label="ห้องโดนแดดบ่าย / ทิศตะวันตก"
        />
      </div>

      {/* Calculate Button */}
      <button id="btu-calculate" onClick={calculate} className="btn-primary">
        <Wind size={18} />
        คำนวณ BTU
      </button>

      {/* Result */}
      {result && (
        <div className="card-highlight p-4 space-y-3 animate-fadeInDown">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-sky-400" />
            <h3 className="font-bold text-sky-400 text-sm uppercase tracking-wider">ผลการคำนวณ</h3>
          </div>

          {/* BTU Result */}
          <div className="text-center py-3">
            <p className="text-slate-400 text-sm mb-1">ต้องการความเย็น</p>
            <p className="mono text-4xl font-bold text-white">
              {result.btu.toLocaleString()}
            </p>
            <p className="text-sky-400 font-semibold text-lg">BTU/ชั่วโมง</p>
          </div>

          {/* Formula breakdown */}
          <div className="bg-slate-900/60 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>พื้นที่</span>
              <span className="mono text-white">{result.area.toFixed(2)} ตร.ม.</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Factor ที่ใช้</span>
              <span className="mono text-white">{result.factor}</span>
            </div>
            {result.height > 3.0 && (
              <div className="flex justify-between text-amber-400">
                <span>ปรับเพดานสูง ({result.height}ม.)</span>
                <span className="mono">×{(result.height / 3.0).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Suggested Sizes */}
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
              ขนาดแอร์ที่แนะนำ
            </p>
            <div className="space-y-2">
              {result.sizes.map((size, i) => (
                <div key={size} className={`flex items-center justify-between p-3 rounded-xl
                  ${i === 0
                    ? 'bg-sky-500/15 border border-sky-500/40'
                    : 'bg-slate-800/60 border border-slate-700'}`}
                >
                  <div>
                    <span className="mono font-bold text-white text-lg">
                      {size.toLocaleString()}
                    </span>
                    <span className={`text-sm ml-1.5 ${i === 0 ? 'text-sky-400' : 'text-slate-400'}`}>BTU</span>
                    {i === 0 && (
                      <span className="ml-2 badge badge-blue text-[10px]">แนะนำ</span>
                    )}
                  </div>
                  <button
                    id={`btu-use-${size}`}
                    onClick={() => handleUseSize(size)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all
                      ${i === 0
                        ? 'bg-sky-500 text-white active:bg-sky-600'
                        : 'bg-slate-700 text-slate-300 active:bg-slate-600'}`}
                  >
                    ใช้ขนาดนี้
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
