export const documents = [
  // DAIKIN
  {
    id: 'd1', brand: 'Daikin', model: 'FTKQ Series', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Daikin FTKQ Series (Inverter)',
    description: 'ขั้นตอนการติดตั้งอย่างละเอียด ระยะท่อ น้ำยา R32',
    pages: 48, year: 2023, popular: true,
  },
  {
    id: 'd2', brand: 'Daikin', model: 'FTKQ Series', type: 'Inverter',
    category: 'Wiring', title: 'ไดอะแกรมสายไฟ Daikin Inverter R32',
    description: 'แผนผังวงจรไฟฟ้าครบทุกรุ่น FTKQ/FTXQ/CTXQ',
    pages: 24, year: 2023, popular: false,
  },
  {
    id: 'd3', brand: 'Daikin', model: 'All Series', type: 'Inverter',
    category: 'Error Manuals', title: 'รายการ Error Code ทุกรุ่น Daikin 2020-2024',
    description: 'Error Code E1-L5 พร้อมวิธีการแก้ไขและอะไหล่ที่ต้องใช้',
    pages: 120, year: 2024, popular: true,
  },
  {
    id: 'd4', brand: 'Daikin', model: 'FTN Series', type: 'Fixed Speed',
    category: 'Installation', title: 'คู่มือติดตั้ง Daikin Fixed Speed FTN (R22/R410A)',
    description: 'คู่มือติดตั้งรุ่น Fixed Speed เหมาะกับงานซ่อมเครื่องเก่า',
    pages: 36, year: 2019, popular: false,
  },
  // MITSUBISHI
  {
    id: 'm1', brand: 'Mitsubishi', model: 'MSY-KX Series', type: 'Inverter',
    category: 'Installation', title: 'Installation Manual Mitsubishi MSY-KX (R32)',
    description: 'ขั้นตอนการติดตั้งพร้อมค่า Torque การขันท่อน้ำยา',
    pages: 52, year: 2022, popular: true,
  },
  {
    id: 'm2', brand: 'Mitsubishi', model: 'MSY-KX Series', type: 'Inverter',
    category: 'Wiring', title: 'Wiring Diagram Mitsubishi Inverter KX/GX Series',
    description: 'ไดอะแกรมสาย PCB คอยล์เย็นและคอยล์ร้อน',
    pages: 18, year: 2022, popular: false,
  },
  {
    id: 'm3', brand: 'Mitsubishi', model: 'All Series', type: 'Inverter',
    category: 'Error Manuals', title: 'Service Manual & Error Code Mitsubishi Electric',
    description: 'Error E6, E7, P6, P8 พร้อมวิธีวินิจฉัยเชิงลึก',
    pages: 200, year: 2023, popular: true,
  },
  {
    id: 'm4', brand: 'Mitsubishi', model: 'MS-GN Series', type: 'Fixed Speed',
    category: 'Installation', title: 'คู่มือ Mitsubishi Fixed Speed GN (R22)',
    description: 'สำหรับรุ่นเก่า MS-GN 9000-24000 BTU',
    pages: 28, year: 2015, popular: false,
  },
  // CARRIER
  {
    id: 'c1', brand: 'Carrier', model: '38/40MAQB', type: 'Inverter',
    category: 'Installation', title: 'Carrier Inverter 38/40MAQB Installation Guide',
    description: 'ขั้นตอนการติดตั้งแอร์ Carrier Inverter รุ่นขายดี',
    pages: 44, year: 2023, popular: true,
  },
  {
    id: 'c2', brand: 'Carrier', model: '38/40MAQB', type: 'Inverter',
    category: 'Wiring', title: 'Carrier Inverter Wiring & PCB Diagram',
    description: 'ไดอะแกรมสายไฟและ PCB Board ทุกรุ่น Inverter',
    pages: 32, year: 2023, popular: false,
  },
  {
    id: 'c3', brand: 'Carrier', model: 'All Series', type: 'Inverter',
    category: 'Error Manuals', title: 'Carrier Error Code Full List (E1-F9)',
    description: 'รายการ Error Code ครบสำหรับ Carrier ทุกซีรีส์',
    pages: 80, year: 2024, popular: false,
  },
  {
    id: 'c4', brand: 'Carrier', model: '42/38QHV', type: 'Fixed Speed',
    category: 'Installation', title: 'คู่มือติดตั้ง Carrier Fixed Speed R22',
    description: 'คู่มือรุ่น Fixed Speed ที่ยังมีใช้ในประเทศไทย',
    pages: 30, year: 2018, popular: false,
  },
  // PANASONIC
  {
    id: 'p1', brand: 'Panasonic', model: 'CS-XU Series', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Panasonic Inverter XU Series',
    description: 'ขั้นตอนการติดตั้ง Panasonic nanoe™X รุ่นล่าสุด',
    pages: 56, year: 2024, popular: true,
  },
  {
    id: 'p2', brand: 'Panasonic', model: 'CS-XU Series', type: 'Inverter',
    category: 'Wiring', title: 'Wiring Diagram Panasonic XU/PU/KZ Series',
    description: 'ไดอะแกรมสายไฟครอบคลุมทุกรุ่น Panasonic Inverter',
    pages: 22, year: 2024, popular: false,
  },
  {
    id: 'p3', brand: 'Panasonic', model: 'All Series', type: 'Inverter',
    category: 'Error Manuals', title: 'Panasonic Error Code & Blink Code Guide',
    description: 'รหัสกะพริบ LED และ Error Code ทุกรุ่น',
    pages: 64, year: 2023, popular: false,
  },
  {
    id: 'p4', brand: 'Panasonic', model: 'CS-PN Series', type: 'Fixed Speed',
    category: 'Installation', title: 'คู่มือ Panasonic Fixed Speed PN Series',
    description: 'รุ่น Fixed Speed R410A ราคาประหยัด',
    pages: 32, year: 2020, popular: false,
  },
  // HAIER
  {
    id: 'h1', brand: 'Haier', model: 'HSU-INVT Series', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Haier Inverter INVT',
    description: 'ขั้นตอนการติดตั้งครบถ้วน Haier Inverter R32/R410A',
    pages: 40, year: 2023, popular: false,
  },
  {
    id: 'h2', brand: 'Haier', model: 'HSU-INVT Series', type: 'Inverter',
    category: 'Wiring', title: 'Haier Inverter Wiring Schematic',
    description: 'ไดอะแกรมสายไฟ Haier Inverter รุ่นปัจจุบัน',
    pages: 16, year: 2023, popular: false,
  },
  {
    id: 'h3', brand: 'Haier', model: 'All Series', type: 'Inverter',
    category: 'Error Manuals', title: 'Haier Error Code E1-F9 Troubleshooting',
    description: 'Error Code และวิธีแก้ไขสำหรับ Haier ทุกรุ่น',
    pages: 55, year: 2023, popular: false,
  },
  {
    id: 'h4', brand: 'Haier', model: 'HSU Series', type: 'Fixed Speed',
    category: 'Installation', title: 'คู่มือ Haier Fixed Speed HSU R22',
    description: 'รุ่น Fixed Speed สำหรับงานซ่อมเครื่องเก่า',
    pages: 28, year: 2016, popular: false,
  },
]

export const brands = ['Daikin', 'Mitsubishi', 'Carrier', 'Panasonic', 'Haier']
export const types = ['Inverter', 'Fixed Speed']
export const categories = ['Installation', 'Wiring', 'Error Manuals']
