import { Wind, Zap, Stethoscope, BookOpen, Camera, Library, Settings } from 'lucide-react'

const tabs = [
  { id: 0, label: 'BTU', icon: Wind },
  { id: 1, label: 'ไฟฟ้า', icon: Zap },
  { id: 2, label: 'วินิจฉัย', icon: Stethoscope },
  { id: 3, label: 'บันทึก', icon: BookOpen },
  { id: 4, label: 'สแกน', icon: Camera },
  { id: 5, label: 'คลัง', icon: Library },
  { id: 6, label: 'ตั้งค่า', icon: Settings },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav glass-dark border-t border-slate-700/50">
      <div className="flex items-stretch">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 tap-target
                ${active
                  ? 'text-sky-400'
                  : 'text-slate-500 active:text-slate-300'
                }`}
              aria-label={label}
              aria-selected={active}
            >
              <div className={`relative p-1 rounded-xl transition-all duration-200
                ${active ? 'bg-sky-400/15' : ''}`}>
                <Icon
                  size={active ? 22 : 20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400" />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-all duration-200
                ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
