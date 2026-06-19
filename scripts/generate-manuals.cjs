const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const OUT_DIR = path.join(__dirname, '..', 'public', 'manuals')
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

function buildPDF(filename, title, brand, category, pagesCount) {
  return new Promise((resolve) => {
    const outPath = path.join(OUT_DIR, filename)
    const doc = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)

    // Page 1: Cover
    doc.fontSize(26).text(brand, { align: 'center' })
    doc.moveDown()
    doc.fontSize(18).text(title, { align: 'center' })
    doc.moveDown()
    doc.fontSize(13).text(`Category: ${category}   |   Pages: ${pagesCount}`, { align: 'center' })
    doc.moveDown(2)
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(2)
    
    doc.fontSize(16).text('SAFETY PRECAUTIONS')
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text('1. Switch off main breaker before any installation work.')
    doc.text('2. Use proper grounding on all electrical components.')
    doc.text('3. Use only approved refrigerant for this model.')
    doc.text('4. Perform leak test before commissioning.')
    doc.text('5. Do not install near flammable gas or heat sources.')
    
    doc.moveDown(2)
    doc.fontSize(16).text('REQUIRED TOOLS')
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text('- Torque wrench, Manifold gauge set, Vacuum pump')
    doc.text('- Flaring tool, Pipe cutter, Level, Clamp meter')

    // Page 2: Specs
    doc.addPage()
    doc.fontSize(18).text('TECHNICAL SPECIFICATIONS', { underline: true })
    doc.moveDown()
    doc.fontSize(12)
    doc.text(`Brand: ${brand}`)
    doc.text('Refrigerant: R32 or R410A')
    doc.text('Power: 220V / 50Hz / Single Phase')
    doc.text('Cooling Capacity: 9,000 to 36,000 BTU/h')
    doc.text('Operating Temperature: -10C to 46C')
    
    doc.moveDown(2)
    doc.fontSize(14).text('PIPE SPECIFICATIONS')
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text('9,000-18,000 BTU: Liquid 1/4"  Suction 3/8"')
    doc.text('24,000-36,000 BTU: Liquid 3/8"  Suction 5/8"')
    doc.text('Maximum Pipe Length: 15 metres')
    doc.text('Maximum Height Difference: 10 metres')

    // Page 3: Wiring
    doc.addPage()
    doc.fontSize(18).text('WIRING & ERROR CODE REFERENCE', { underline: true })
    doc.moveDown()
    doc.fontSize(14).text('INDOOR UNIT TERMINAL BLOCK')
    doc.fontSize(12)
    doc.text('L : Live - Phase wire')
    doc.text('N : Neutral wire')
    doc.text('1 : Signal to outdoor unit')
    doc.text('E : Earth / Ground')
    
    doc.moveDown()
    doc.fontSize(14).text('COMMON ERROR CODES')
    doc.fontSize(12)
    doc.text('E1/U4 : Communication error - check signal wire')
    doc.text('E3    : High pressure protection - clean outdoor coil')
    doc.text('E4    : Low pressure / refrigerant leak - check pressure')
    doc.text('A6    : Indoor fan motor lock - inspect motor')
    
    doc.end()

    stream.on('finish', () => {
      console.log(`Created: ${filename}`)
      resolve()
    })
  })
}

const manuals = [
  { filename: 'daikin-ftkq-installation.pdf',      title: 'Installation Manual - FTKQ Series',       brand: 'Daikin',             category: 'Installation',   pages: 48 },
  { filename: 'mitsubishi-msyz-wiring.pdf',         title: 'Wiring & Electrical Manual - MSY-Z',       brand: 'Mitsubishi Electric', category: 'Wiring',         pages: 36 },
  { filename: 'carrier-xpower-error-manual.pdf',    title: 'Error Code Service Manual - X-Power',      brand: 'Carrier',            category: 'Error Manuals',  pages: 62 },
  { filename: 'panasonic-cu-installation.pdf',      title: 'Installation Guide - CU Series Inverter',  brand: 'Panasonic',          category: 'Installation',   pages: 44 },
  { filename: 'haier-hsu-wiring-diagram.pdf',       title: 'Wiring Diagram Manual - HSU Fixed Speed',  brand: 'Haier',              category: 'Wiring',         pages: 28 },
]

async function generateAll() {
  for (const m of manuals) {
    await buildPDF(m.filename, m.title, m.brand, m.category, m.pages)
  }
  console.log('\nDone! All valid PDFs generated using pdfkit.')
}

generateAll()
