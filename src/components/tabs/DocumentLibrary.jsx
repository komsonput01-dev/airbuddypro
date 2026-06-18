import { useState, useEffect } from 'react'
import { Library, Search, BookOpen, Clock, ExternalLink, FileText } from 'lucide-react'
import { documents, brands, types, categories } from '../../data/documents'

const BOOKMARKS_KEY = 'abp_recent_docs'
const MAX_RECENT = 3

function getRecentDocs() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
  } catch { return [] }
}

function addRecentDoc(doc) {
  const recents = getRecentDocs().filter(d => d.id !== doc.id)
  recents.unshift(doc)
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)))
}

const categoryColors = {
  'Installation': 'badge-blue',
  'Wiring': 'badge-orange',
  'Error Manuals': 'badge-red',
}

const categoryEmoji = {
  'Installation': '🔧',
  'Wiring': '🔌',
  'Error Manuals': '📟',
}

const brandColors = {
  Daikin: '#0ea5e9',
  Mitsubishi: '#e11d48',
  Carrier: '#2563eb',
  Panasonic: '#0891b2',
  Haier: '#16a34a',
}

function DocCard({ doc, onView }) {
  return (
    <button
      onClick={() => onView(doc)}
      className="w-full text-left card p-3.5 active:bg-slate-700/50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: `${brandColors[doc.brand]}20` }}>
          <FileText size={18} style={{ color: brandColors[doc.brand] }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{doc.title}</p>
          <p className="text-xs text-slate-400 mt-1">{doc.brand} · {doc.model} · {doc.pages} หน้า · {doc.year}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`badge ${categoryColors[doc.category]} text-[10px]`}>
              {categoryEmoji[doc.category]} {doc.category}
            </span>
            <span className={`badge text-[10px] ${doc.type === 'Inverter' ? 'badge-blue' : 'badge-green'}`}>
              {doc.type}
            </span>
            {doc.popular && (
              <span className="badge badge-orange text-[10px]">⭐ ยอดนิยม</span>
            )}
          </div>
        </div>
        <ExternalLink size={14} className="text-slate-600 flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}

export default function DocumentLibrary() {
  const [search, setSearch] = useState('')
  const [activeBrands, setActiveBrands] = useState([])
  const [activeTypes, setActiveTypes] = useState([])
  const [activeCategories, setActiveCategories] = useState([])
  const [recentDocs, setRecentDocs] = useState(getRecentDocs())
  const [viewedDoc, setViewedDoc] = useState(null)

  const toggleFilter = (list, setList, value) => {
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const handleView = (doc) => {
    addRecentDoc(doc)
    setRecentDocs(getRecentDocs())
    setViewedDoc(doc)
  }

  const filtered = documents.filter(doc => {
    const matchSearch = search === '' ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.brand.toLowerCase().includes(search.toLowerCase()) ||
      doc.model.toLowerCase().includes(search.toLowerCase())
    const matchBrand = activeBrands.length === 0 || activeBrands.includes(doc.brand)
    const matchType = activeTypes.length === 0 || activeTypes.includes(doc.type)
    const matchCat = activeCategories.length === 0 || activeCategories.includes(doc.category)
    return matchSearch && matchBrand && matchType && matchCat
  })

  const hasFilters = activeBrands.length > 0 || activeTypes.length > 0 || activeCategories.length > 0 || search !== ''

  // Doc viewer modal
  if (viewedDoc) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setViewedDoc(null)}
            className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 active:bg-slate-700"
          >
            ←
          </button>
          <h1 className="text-base font-bold text-white leading-tight flex-1">{viewedDoc.title}</h1>
        </div>
        <div className="card p-4 space-y-4">
          <div className="aspect-[3/4] bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-4 border border-slate-700">
            <FileText size={48} className="text-slate-600" />
            <div className="text-center px-4">
              <p className="text-slate-400 text-sm font-semibold">{viewedDoc.brand} — {viewedDoc.model}</p>
              <p className="text-slate-500 text-xs mt-1">{viewedDoc.pages} หน้า</p>
              <p className="text-slate-600 text-xs mt-4">
                (ตัวอย่าง — ในระบบจริงจะแสดง PDF ที่โหลดจาก Cloud Storage)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[['ยี่ห้อ', viewedDoc.brand], ['รุ่น', viewedDoc.model], ['ประเภท', viewedDoc.type], ['หมวด', viewedDoc.category], ['จำนวนหน้า', `${viewedDoc.pages} หน้า`], ['ปี', viewedDoc.year]].map(([l, v]) => (
              <div key={l} className="bg-slate-900/60 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{l}</p>
                <p className="font-semibold text-white text-sm mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{viewedDoc.description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Library size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">คลังคู่มือ</h1>
          <p className="text-xs text-slate-400">คู่มือ ไดอะแกรม และ Error Code</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="lib-search"
          type="text"
          placeholder="ค้นหาคู่มือ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {brands.map(b => (
            <button key={b} onClick={() => toggleFilter(activeBrands, setActiveBrands, b)}
              className={`chip flex-shrink-0 ${activeBrands.includes(b) ? 'active' : ''}`}>
              {b}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {types.map(t => (
            <button key={t} onClick={() => toggleFilter(activeTypes, setActiveTypes, t)}
              className={`chip flex-shrink-0 ${activeTypes.includes(t) ? 'active' : ''}`}>
              {t}
            </button>
          ))}
          {categories.map(c => (
            <button key={c} onClick={() => toggleFilter(activeCategories, setActiveCategories, c)}
              className={`chip flex-shrink-0 ${activeCategories.includes(c) ? 'active' : ''}`}>
              {categoryEmoji[c]} {c}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={() => { setActiveBrands([]); setActiveTypes([]); setActiveCategories([]); setSearch('') }}
            className="text-xs text-sky-400 font-semibold"
          >
            ล้างตัวกรองทั้งหมด ×
          </button>
        )}
      </div>

      {/* Recent docs */}
      {recentDocs.length > 0 && !hasFilters && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-amber-400" />
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">เปิดดูล่าสุด</p>
          </div>
          <div className="space-y-2">
            {recentDocs.map(doc => (
              <DocCard key={doc.id} doc={doc} onView={handleView} />
            ))}
          </div>
          <div className="divider" />
        </div>
      )}

      {/* All docs */}
      <div>
        <p className="text-xs text-slate-500 mb-2">
          {filtered.length} รายการ {hasFilters ? '(กรองแล้ว)' : 'ทั้งหมด'}
        </p>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <BookOpen size={36} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">ไม่พบคู่มือที่ค้นหา</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => (
              <DocCard key={doc.id} doc={doc} onView={handleView} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
