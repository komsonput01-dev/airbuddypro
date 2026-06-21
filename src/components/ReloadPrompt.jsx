import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] z-[100] flex items-center justify-between animate-in slide-in-from-bottom-5">
      <div className="flex-1 mr-4">
        <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin-slow" />
          อัปเดตเวอร์ชันใหม่
        </h4>
        <p className="text-xs text-indigo-100 leading-tight">มีฟีเจอร์ใหม่หรือการแก้ไขข้อบกพร่อง กรุณากดรีเฟรชเพื่ออัปเดตแอป</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={() => updateServiceWorker(true)}
          className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors"
        >
          รีเฟรชเลย
        </button>
        <button 
          onClick={close}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default ReloadPrompt
