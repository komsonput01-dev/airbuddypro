import { Settings, Globe, Type, Zap, Info, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className="text-slate-400" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
    </div>
  )
}

function SettingRow({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-700/50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-semibold text-white">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ on, onToggle, id }) {
  return (
    <button id={id} onClick={onToggle} className={`toggle-track ${on ? 'on' : ''}`} aria-pressed={on}>
      <div className="toggle-thumb" />
    </button>
  )
}

function SegmentedControl({ options, value, onChange, id }) {
  return (
    <div className="flex gap-1 bg-slate-900 p-1 rounded-xl">
      {options.map(opt => (
        <button
          key={opt.value}
          id={`${id}-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
            ${value === opt.value
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-500 active:text-slate-300'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function SettingsTab() {
  const { unitSystem, setUnitSystem, fontSize, setFontSize, powerSaving, setPowerSaving } = useApp()

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
          <Settings size={20} className="text-slate-300" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">การตั้งค่า</h1>
          <p className="text-xs text-slate-400">ปรับแต่งการใช้งานให้เหมาะสม</p>
        </div>
      </div>

      {/* Units */}
      <div className="card p-4">
        <SectionHeader icon={Globe} title="หน่วยการวัด" />
        <SettingRow
          label="หน่วยแรงดันน้ำยา"
          sub="ส่งผลต่อ ตารางน้ำยา และ แบบฟอร์มบันทึกงาน"
        >
          <SegmentedControl
            id="settings-unit"
            value={unitSystem}
            onChange={setUnitSystem}
            options={[
              { label: 'PSI', value: 'PSI' },
              { label: 'Bar', value: 'Bar' },
            ]}
          />
        </SettingRow>
      </div>

      {/* Font Size */}
      <div className="card p-4">
        <SectionHeader icon={Type} title="ขนาดตัวอักษร" />
        <SettingRow
          label="ขนาด Font"
          sub="ขยายตัวอักษรเพื่อความชัดเจนในที่แสงจ้า"
        >
          <SegmentedControl
            id="settings-font"
            value={fontSize}
            onChange={setFontSize}
            options={[
              { label: 'ปกติ', value: 'normal' },
              { label: 'ใหญ่', value: 'large' },
              { label: 'ใหญ่มาก', value: 'xl' },
            ]}
          />
        </SettingRow>

        {/* Preview */}
        <div className="mt-3 p-3 bg-slate-900/60 rounded-xl">
          <p className="text-slate-400 font-semibold">ตัวอย่างข้อความ</p>
          <p className="text-white font-bold mt-1">Air Buddy Pro — ระบบช่างแอร์</p>
          <p className="mono text-sky-400 font-bold">12,000 BTU · 5.2A · 20A Breaker</p>
        </div>
      </div>

      {/* Power Saving */}
      <div className="card p-4">
        <SectionHeader icon={Zap} title="การประหยัดพลังงาน" />
        <SettingRow
          label="โหมดประหยัดพลังงาน"
          sub="ปิด Animation, ลด Blur, พื้นหลังดำสนิท (OLED) ช่วยประหยัดแบตเตอรี่ในที่แจ้ง"
        >
          <Toggle id="settings-power" on={powerSaving} onToggle={() => setPowerSaving(p => !p)} />
        </SettingRow>

        {powerSaving && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Zap size={14} className="text-green-400" />
            <p className="text-xs text-green-400 font-semibold">โหมดประหยัดพลังงานเปิดอยู่ — Animation ถูกปิด</p>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="card p-4 space-y-0">
        <SectionHeader icon={Info} title="เกี่ยวกับแอป" />
        {[
          ['เวอร์ชัน', 'Air Buddy Pro v1.0.0'],
          ['พัฒนาเพื่อ', 'ช่างแอร์ไทย 🇹🇭'],
          ['มาตรฐาน', 'วิศวกรรมไฟฟ้าไทย (EIT)'],
          ['ฐานข้อมูล', 'Supabase + Offline LocalStorage'],
        ].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
            <p className="text-sm text-slate-400">{l}</p>
            <p className="text-sm font-semibold text-white">{v}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 bg-sky-500/8 border border-sky-500/20 rounded-xl space-y-2">
        <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">💡 เคล็ดลับการใช้งาน</p>
        <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
          <li>• คำนวณ BTU แล้วกด "ใช้ขนาดนี้" เพื่อส่งค่าไปยังแท็บไฟฟ้าอัตโนมัติ</li>
          <li>• สแกนเพลทแอร์แล้วกด "ใช้ข้อมูลนี้" เพื่อกรอกสมุดงานอัตโนมัติ</li>
          <li>• ข้อมูลงานจะ Sync ขึ้น Cloud อัตโนมัติเมื่อกลับมาออนไลน์</li>
          <li>• เปิดโหมดประหยัดพลังงานเพื่อใช้งานในแสงแดดได้ง่ายขึ้น</li>
        </ul>
      </div>

      <div className="h-4" />
    </div>
  )
}
