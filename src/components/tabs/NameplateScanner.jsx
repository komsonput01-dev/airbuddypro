import { useState, useRef, useEffect } from 'react'
import { Camera, Scan, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useCalculator } from '../../context/CalculatorContext'

const MOCK_RESULTS = [
  { brand: 'Mitsubishi', model: 'MSY-KX13VF', serialNo: '24B098715', refrigerant: 'R32', notes: 'สแกนจากเพลทแอร์' },
  { brand: 'Daikin', model: 'FTKQ12UV2S', serialNo: '23A0045821', refrigerant: 'R32', notes: 'สแกนจากเพลทแอร์' },
  { brand: 'Carrier', model: '38MAQB012', serialNo: '22C003391', refrigerant: 'R410A', notes: 'สแกนจากเพลทแอร์' },
  { brand: 'Panasonic', model: 'CS-XU18WKT', serialNo: '24D117823', refrigerant: 'R32', notes: 'สแกนจากเพลทแอร์' },
]

export default function NameplateScanner({ onNavigate }) {
  const { setScannedJobData } = useCalculator()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraState, setCameraState] = useState('idle') // idle | requesting | active | denied | scanning | done
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')

  const startCamera = async () => {
    setCameraState('requesting')
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraState('active')
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraState('denied')
        setError('ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์')
      } else {
        setCameraState('denied')
        setError(`เกิดข้อผิดพลาด: ${err.message}`)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraState('idle')
    setScanResult(null)
  }

  const handleScan = () => {
    setCameraState('scanning')
    setTimeout(() => {
      const mock = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]
      setScanResult(mock)
      setScannedJobData(mock)
      setCameraState('done')
    }, 2200)
  }

  const handleUseData = () => {
    stopCamera()
    onNavigate(3) // Go to Job Logger tab
  }

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Camera size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">สแกนเพลทแอร์ (AI)</h1>
          <p className="text-xs text-slate-400">ระบบจำลองการสแกนข้อมูลจาก Nameplate</p>
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-3.5 bg-purple-500/8 border border-purple-500/20 rounded-xl">
        <AlertCircle size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-purple-300 leading-relaxed">
          ชี้กล้องไปที่เพลทข้อมูลของแอร์ กดปุ่ม "สแกน" ระบบจะอ่านข้อมูลและกรอกลงในสมุดบันทึกงานอัตโนมัติ
        </p>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-slate-700">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraState === 'active' || cameraState === 'scanning' || cameraState === 'done' ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Idle state */}
        {cameraState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Camera size={28} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">กล้องยังไม่เปิด</p>
          </div>
        )}

        {/* Requesting */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">กำลังขอสิทธิ์กล้อง...</p>
          </div>
        )}

        {/* Scan overlay */}
        {(cameraState === 'active' || cameraState === 'scanning') && (
          <div className="absolute inset-0">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-sky-400 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-sky-400 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />

            {/* Scan line */}
            {cameraState === 'scanning' && <div className="scan-line" />}
          </div>
        )}

        {/* Done overlay */}
        {cameraState === 'done' && scanResult && (
          <div className="absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center gap-2 p-4">
            <CheckCircle size={36} className="text-green-400" />
            <p className="text-sm font-bold text-white text-center">อ่านข้อมูลสำเร็จ!</p>
            <div className="text-center space-y-1">
              <p className="mono text-sky-400 font-bold text-base">{scanResult.brand} {scanResult.model}</p>
              <p className="text-xs text-slate-400">S/N: {scanResult.serialNo} · {scanResult.refrigerant}</p>
            </div>
          </div>
        )}

        {/* Denied */}
        {cameraState === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <X size={32} className="text-red-400" />
            <p className="text-sm text-red-400 font-semibold text-center">{error}</p>
          </div>
        )}

        {/* Scanning animation overlay */}
        {cameraState === 'scanning' && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-3 py-2 bg-slate-900/80 rounded-lg">
            <div className="w-4 h-4 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs text-sky-400 font-semibold">กำลังสแกนและอ่านข้อมูล...</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {cameraState === 'idle' || cameraState === 'denied' ? (
          <button id="scanner-start" onClick={startCamera} className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            <Camera size={18} />
            เปิดกล้อง
          </button>
        ) : cameraState === 'active' ? (
          <div className="flex gap-2">
            <button id="scanner-scan" onClick={handleScan} className="btn-primary flex-1">
              <Scan size={18} />
              สแกน & วิเคราะห์
            </button>
            <button onClick={stopCamera} className="btn-secondary" style={{ width: 'auto', padding: '0 1rem' }}>
              <X size={18} />
            </button>
          </div>
        ) : cameraState === 'scanning' ? (
          <button disabled className="btn-primary opacity-60 cursor-not-allowed">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            กำลังสแกน...
          </button>
        ) : cameraState === 'done' ? (
          <div className="flex gap-2">
            <button id="scanner-use-data" onClick={handleUseData} className="btn-success flex-1">
              <CheckCircle size={18} />
              ใช้ข้อมูลนี้ → บันทึกงาน
            </button>
            <button onClick={() => { setScanResult(null); setCameraState('active') }}
              className="btn-secondary" style={{ width: 'auto', padding: '0 1rem' }}>
              <Scan size={18} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Scanned data preview */}
      {scanResult && cameraState === 'done' && (
        <div className="card p-4 space-y-3 animate-fadeInDown">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">ข้อมูลที่อ่านได้</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['ยี่ห้อ', scanResult.brand],
              ['รุ่น', scanResult.model],
              ['ซีเรียล', scanResult.serialNo],
              ['น้ำยา', scanResult.refrigerant],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-900/60 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{l}</p>
                <p className="mono font-bold text-sm text-white mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            ข้อมูลนี้จะถูกกรอกลงในสมุดบันทึกงานอัตโนมัติเมื่อกด "ใช้ข้อมูลนี้"
          </p>
        </div>
      )}
    </div>
  )
}
