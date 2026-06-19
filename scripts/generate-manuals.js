/**
 * generate-manuals.js
 * Generates 5 demonstration PDF manuals for Air Buddy Pro document library.
 * Uses only Node.js built-ins (fs + Buffer) — no npm packages needed.
 *
 * Each PDF is a minimal but valid PDF 1.4 file with Thai content pages.
 * Run: node scripts/generate-manuals.js
 */

const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'public', 'manuals')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── PDF Builder (minimal valid PDF without external libs) ─────────────────────
function buildPDF(title, brand, category, pages) {
  // We encode Thai as UTF-8 via PDF hex strings.
  // For simplicity, the body text will be in English since embedding
  // Thai fonts requires a full TTF embed. The title on cover is shown in English/Thai.

  const objs = []
  let oid = 1

  function pushObj(content) {
    const id = oid++
    objs.push({ id, content })
    return id
  }

  // Page content streams — one per logical page
  const streamIds = []

  // Cover page
  const coverContent = [
    'BT',
    '/F1 28 Tf',
    '72 750 Td',
    `(${brand}) Tj`,
    '/F1 20 Tf',
    '0 -40 Td',
    `(${title}) Tj`,
    '/F1 14 Tf',
    '0 -30 Td',
    `(Category: ${category}) Tj`,
    '/F1 12 Tf',
    '0 -25 Td',
    `(Pages: ${pages}) Tj`,
    '0 -20 Td',
    '(This document is a demonstration manual for Air Buddy Pro.) Tj',
    '0 -16 Td',
    '(For actual installation, refer to the official manufacturer manual.) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(--- INSTALLATION SAFETY PRECAUTIONS ---) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    '(1. Always switch off main power before starting installation.) Tj',
    '0 -16 Td',
    '(2. Ensure proper grounding of all electrical components.) Tj',
    '0 -16 Td',
    '(3. Use only refrigerant specified for this model.) Tj',
    '0 -16 Td',
    '(4. Check for refrigerant leaks after installation.) Tj',
    '0 -16 Td',
    '(5. Do not install in a location exposed to direct flammable gas.) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(--- TOOLS REQUIRED ---) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    '(- Torque wrench, Manifold gauge set, Vacuum pump) Tj',
    '0 -16 Td',
    '(- Flaring tool, Pipe cutter, Level instrument) Tj',
    '0 -16 Td',
    '(- Electrical tester, Clamp meter) Tj',
    'ET',
  ].join('\n')

  const coverStream = pushObj(
    `<< /Length ${coverContent.length} >>\nstream\n${coverContent}\nendstream`
  )
  streamIds.push(coverStream)

  // Spec page
  const specContent = [
    'BT',
    '/F1 18 Tf',
    '72 750 Td',
    '(TECHNICAL SPECIFICATIONS) Tj',
    '/F1 12 Tf',
    '0 -30 Td',
    `(Model Series: ${brand} Standard Series) Tj`,
    '0 -20 Td',
    '(Refrigerant Type: R32 / R410A) Tj',
    '0 -16 Td',
    '(Power Supply: 220V / 50Hz / 1Ph) Tj',
    '0 -16 Td',
    '(Cooling Capacity: 9,000 - 36,000 BTU/h) Tj',
    '0 -16 Td',
    '(EER Rating: 3.0 - 3.8) Tj',
    '0 -16 Td',
    '(Operating Temp Range: -10 C to 46 C) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(--- PIPE SPECIFICATIONS ---) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    '(Liquid Pipe (9000-18000 BTU): 1/4" OD) Tj',
    '0 -16 Td',
    '(Suction Pipe (9000-18000 BTU): 3/8" OD) Tj',
    '0 -16 Td',
    '(Liquid Pipe (24000-36000 BTU): 3/8" OD) Tj',
    '0 -16 Td',
    '(Suction Pipe (24000-36000 BTU): 5/8" OD) Tj',
    '0 -16 Td',
    '(Max Pipe Length: 15 m) Tj',
    '0 -16 Td',
    '(Max Height Difference: 10 m) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(--- ELECTRICAL REQUIREMENTS ---) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    '(9000 BTU: 10A breaker, 1.5 mm2 wire) Tj',
    '0 -16 Td',
    '(12000 BTU: 16A breaker, 2.5 mm2 wire) Tj',
    '0 -16 Td',
    '(18000 BTU: 20A breaker, 4.0 mm2 wire) Tj',
    '0 -16 Td',
    '(24000 BTU: 25A breaker, 6.0 mm2 wire) Tj',
    'ET',
  ].join('\n')

  const specStream = pushObj(
    `<< /Length ${specContent.length} >>\nstream\n${specContent}\nendstream`
  )
  streamIds.push(specStream)

  // Wiring page
  const wireContent = [
    'BT',
    '/F1 18 Tf',
    '72 750 Td',
    '(WIRING DIAGRAM & CONNECTION) Tj',
    '/F1 12 Tf',
    '0 -30 Td',
    '(Indoor Unit Terminal Block:) Tj',
    '0 -20 Td',
    '(  L  : Live (Phase) - Brown wire) Tj',
    '0 -16 Td',
    '(  N  : Neutral - Blue wire) Tj',
    '0 -16 Td',
    '(  1  : Signal wire to outdoor - Yellow/Green) Tj',
    '0 -16 Td',
    '(  E  : Earth/Ground - Green wire) Tj',
    '0 -30 Td',
    '(Outdoor Unit Terminal Block:) Tj',
    '0 -20 Td',
    '(  L  : Live input from breaker) Tj',
    '0 -16 Td',
    '(  N  : Neutral input) Tj',
    '0 -16 Td',
    '(  1  : Signal from indoor) Tj',
    '0 -16 Td',
    '(  E  : Earth) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(--- TROUBLESHOOTING QUICK REFERENCE ---) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    '(E1 / U4 : Communication error - check signal wire) Tj',
    '0 -16 Td',
    '(E3      : High pressure - clean outdoor coil) Tj',
    '0 -16 Td',
    '(E4      : Low pressure - check refrigerant leak) Tj',
    '0 -16 Td',
    '(A6      : Fan motor lock - check motor & capacitor) Tj',
    '0 -16 Td',
    '(L5      : Inverter protection - check current) Tj',
    'ET',
  ].join('\n')

  const wireStream = pushObj(
    `<< /Length ${wireContent.length} >>\nstream\n${wireContent}\nendstream`
  )
  streamIds.push(wireStream)

  // Font object
  const fontId = pushObj(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  )

  // Resources
  const resId = pushObj(
    `<< /Font << /F1 ${fontId} 0 R >> >>`
  )

  // Page objects
  const pageIds = streamIds.map((sid) =>
    pushObj(
      `<< /Type /Page /Parent 0 /MediaBox [0 0 612 792] /Contents ${sid} 0 R /Resources ${resId} 0 R >>`
    )
  )

  // Pages catalog
  const pagesId = pushObj(
    `<< /Type /Pages /Kids [${pageIds.map((p) => `${p} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  )

  // Fix parent reference in page objects
  objs.forEach((o) => {
    if (o.content.includes('/Type /Page /Parent 0')) {
      o.content = o.content.replace('/Parent 0', `/Parent ${pagesId}`)
    }
  })

  // Catalog
  const catId = pushObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  // Build PDF bytes
  const header = '%PDF-1.4\n'
  let body = ''
  const offsets = []

  objs.forEach((obj) => {
    offsets[obj.id] = header.length + body.length
    body += `${obj.id} 0 obj\n${obj.content}\nendobj\n`
  })

  const xrefOffset = header.length + body.length
  let xref = `xref\n0 ${oid}\n0000000000 65535 f \n`
  for (let i = 1; i < oid; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  const trailer = `trailer\n<< /Size ${oid} /Root ${catId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return header + body + xref + trailer
}

// ─── Define 5 Manuals ─────────────────────────────────────────────────────────
const manuals = [
  {
    filename: 'daikin-ftkq-installation.pdf',
    title: 'Installation Manual - FTKQ Series Inverter',
    brand: 'Daikin',
    category: 'Installation',
    pages: 48,
  },
  {
    filename: 'mitsubishi-msyz-wiring.pdf',
    title: 'Wiring & Electrical Manual - MSY-Z Series',
    brand: 'Mitsubishi Electric',
    category: 'Wiring',
    pages: 36,
  },
  {
    filename: 'carrier-xpower-error-manual.pdf',
    title: 'Error Code Service Manual - X-Power Series',
    brand: 'Carrier',
    category: 'Error Manuals',
    pages: 62,
  },
  {
    filename: 'panasonic-cu-installation.pdf',
    title: 'Installation Guide - CU Series Inverter',
    brand: 'Panasonic',
    category: 'Installation',
    pages: 44,
  },
  {
    filename: 'haier-hsu-wiring-diagram.pdf',
    title: 'Wiring Diagram Manual - HSU Fixed Speed',
    brand: 'Haier',
    category: 'Wiring',
    pages: 28,
  },
]

// ─── Generate & Write ─────────────────────────────────────────────────────────
manuals.forEach(({ filename, title, brand, category, pages }) => {
  const pdf = buildPDF(title, brand, category, pages)
  const outPath = path.join(OUT_DIR, filename)
  fs.writeFileSync(outPath, pdf, 'binary')
  console.log(`✅  Created: public/manuals/${filename}  (${pdf.length} bytes)`)
})

console.log('\n✨  All 5 manuals generated in public/manuals/')
