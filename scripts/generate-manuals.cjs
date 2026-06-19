const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'public', 'manuals')
fs.mkdirSync(OUT_DIR, { recursive: true })

function buildPDF(title, brand, category, pages) {
  const objs = []
  let oid = 1
  function pushObj(content) {
    const id = oid++
    objs.push({ id, content })
    return id
  }

  const streamIds = []

  // Page 1: Cover
  const page1 = [
    'BT',
    '/F1 26 Tf 72 750 Td',
    '(' + brand + ') Tj',
    '/F1 18 Tf 0 -40 Td',
    '(' + title + ') Tj',
    '/F1 13 Tf 0 -30 Td',
    '(Category: ' + category + '   |   Pages: ' + pages + ') Tj',
    '0 -30 Td',
    '(---------------------------------------------------) Tj',
    '0 -20 Td',
    '/F1 14 Tf',
    '(SAFETY PRECAUTIONS) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(1. Switch off main breaker before any installation work.) Tj',
    '0 -15 Td',
    '(2. Use proper grounding on all electrical components.) Tj',
    '0 -15 Td',
    '(3. Use only approved refrigerant for this model.) Tj',
    '0 -15 Td',
    '(4. Perform leak test before commissioning.) Tj',
    '0 -15 Td',
    '(5. Do not install near flammable gas or heat sources.) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(REQUIRED TOOLS) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(Torque wrench, Manifold gauge set, Vacuum pump,) Tj',
    '0 -15 Td',
    '(Flaring tool, Pipe cutter, Level, Clamp meter) Tj',
    'ET',
  ].join(' ')

  streamIds.push(pushObj('<< /Length ' + page1.length + ' >>\nstream\n' + page1 + '\nendstream'))

  // Page 2: Specs
  const page2 = [
    'BT',
    '/F1 18 Tf 72 750 Td',
    '(TECHNICAL SPECIFICATIONS) Tj',
    '/F1 12 Tf 0 -30 Td',
    '(Brand: ' + brand + ') Tj',
    '0 -18 Td',
    '(Refrigerant: R32 or R410A) Tj',
    '0 -18 Td',
    '(Power: 220V / 50Hz / Single Phase) Tj',
    '0 -18 Td',
    '(Cooling Capacity: 9,000 to 36,000 BTU/h) Tj',
    '0 -18 Td',
    '(Operating Temperature: -10C to 46C) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(PIPE SPECIFICATIONS) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(9,000-18,000 BTU: Liquid 1/4in  Suction 3/8in) Tj',
    '0 -15 Td',
    '(24,000-36,000 BTU: Liquid 3/8in  Suction 5/8in) Tj',
    '0 -15 Td',
    '(Maximum Pipe Length: 15 metres) Tj',
    '0 -15 Td',
    '(Maximum Height Difference: 10 metres) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(ELECTRICAL REQUIREMENTS) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(9,000  BTU: 10A breaker  1.5 sq.mm wire) Tj',
    '0 -15 Td',
    '(12,000 BTU: 16A breaker  2.5 sq.mm wire) Tj',
    '0 -15 Td',
    '(18,000 BTU: 20A breaker  4.0 sq.mm wire) Tj',
    '0 -15 Td',
    '(24,000 BTU: 25A breaker  6.0 sq.mm wire) Tj',
    'ET',
  ].join(' ')

  streamIds.push(pushObj('<< /Length ' + page2.length + ' >>\nstream\n' + page2 + '\nendstream'))

  // Page 3: Wiring & Error Codes
  const page3 = [
    'BT',
    '/F1 18 Tf 72 750 Td',
    '(WIRING & ERROR CODE REFERENCE) Tj',
    '/F1 12 Tf 0 -30 Td',
    '(INDOOR UNIT TERMINAL BLOCK) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(L : Live - Phase wire) Tj',
    '0 -15 Td',
    '(N : Neutral wire) Tj',
    '0 -15 Td',
    '(1 : Signal to outdoor unit) Tj',
    '0 -15 Td',
    '(E : Earth / Ground) Tj',
    '0 -25 Td',
    '/F1 12 Tf',
    '(OUTDOOR UNIT TERMINAL BLOCK) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(L : Live input from breaker) Tj',
    '0 -15 Td',
    '(N : Neutral) Tj',
    '0 -15 Td',
    '(1 : Signal from indoor unit) Tj',
    '0 -15 Td',
    '(E : Earth) Tj',
    '0 -30 Td',
    '/F1 14 Tf',
    '(COMMON ERROR CODES) Tj',
    '/F1 11 Tf 0 -20 Td',
    '(E1/U4 : Communication error - check signal wire (terminals 1 to 1)) Tj',
    '0 -15 Td',
    '(E3    : High pressure protection - clean outdoor coil) Tj',
    '0 -15 Td',
    '(E4    : Low pressure / refrigerant leak - check pressure) Tj',
    '0 -15 Td',
    '(A6    : Indoor fan motor lock - inspect motor and capacitor) Tj',
    '0 -15 Td',
    '(L5    : Inverter overcurrent - check compressor amperage) Tj',
    '0 -15 Td',
    '(H11   : Comm error Panasonic - check all wiring terminals) Tj',
    '0 -15 Td',
    '(F93   : Compressor revolution error - IPM or compressor fault) Tj',
    'ET',
  ].join(' ')

  streamIds.push(pushObj('<< /Length ' + page3.length + ' >>\nstream\n' + page3 + '\nendstream'))

  // Font
  const fontId = pushObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const resId = pushObj('<< /Font << /F1 ' + fontId + ' 0 R >> >>')

  // Page objects
  const pageIds = streamIds.map(sid =>
    pushObj('<< /Type /Page /Parent 0 /MediaBox [0 0 612 792] /Contents ' + sid + ' 0 R /Resources ' + resId + ' 0 R >>')
  )

  // Pages tree
  const pagesId = pushObj('<< /Type /Pages /Kids [' + pageIds.map(p => p + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>')

  // Fix parent refs
  objs.forEach(o => {
    if (o.content.includes('/Type /Page /Parent 0')) {
      o.content = o.content.replace('/Parent 0', '/Parent ' + pagesId)
    }
  })

  const catId = pushObj('<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>')

  // Serialize
  const header = '%PDF-1.4\n'
  let body = ''
  const offsets = []
  objs.forEach(obj => {
    offsets[obj.id] = header.length + body.length
    body += obj.id + ' 0 obj\n' + obj.content + '\nendobj\n'
  })

  const xrefOffset = header.length + body.length
  let xref = 'xref\n0 ' + oid + '\n0000000000 65535 f \n'
  for (let i = 1; i < oid; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  }
  const trailer = 'trailer\n<< /Size ' + oid + ' /Root ' + catId + ' 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n'
  return header + body + xref + trailer
}

const manuals = [
  { filename: 'daikin-ftkq-installation.pdf',      title: 'Installation Manual - FTKQ Series Inverter',       brand: 'Daikin',             category: 'Installation',   pages: 48 },
  { filename: 'mitsubishi-msyz-wiring.pdf',         title: 'Wiring & Electrical Manual - MSY-Z Series',        brand: 'Mitsubishi Electric', category: 'Wiring',         pages: 36 },
  { filename: 'carrier-xpower-error-manual.pdf',    title: 'Error Code Service Manual - X-Power Series',       brand: 'Carrier',            category: 'Error Manuals',  pages: 62 },
  { filename: 'panasonic-cu-installation.pdf',      title: 'Installation Guide - CU Series Inverter',          brand: 'Panasonic',          category: 'Installation',   pages: 44 },
  { filename: 'haier-hsu-wiring-diagram.pdf',       title: 'Wiring Diagram Manual - HSU Fixed Speed',          brand: 'Haier',              category: 'Wiring',         pages: 28 },
]

manuals.forEach(({ filename, title, brand, category, pages }) => {
  const pdf = buildPDF(title, brand, category, pages)
  const outPath = path.join(OUT_DIR, filename)
  fs.writeFileSync(outPath, pdf, 'binary')
  console.log('Created: public/manuals/' + filename + '  (' + pdf.length + ' bytes)')
})

console.log('\nDone! All 5 PDFs generated in public/manuals/')
