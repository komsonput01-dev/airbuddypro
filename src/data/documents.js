export const documents = [
  // DAIKIN
  {
    id: 'd1', brand: 'Daikin', model: 'FTKQ Series', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Daikin FTKQ Series (Inverter)',
    description: 'ขั้นตอนการติดตั้งอย่างละเอียด ระยะท่อ น้ำยา R32',
    pages: 48, year: 2023, popular: true,
    url: '/manuals/daikin-ftkq-installation.pdf',
  },
  // MITSUBISHI
  {
    id: 'm1', brand: 'Mitsubishi', model: 'MSY-Z Series', type: 'Inverter',
    category: 'Wiring', title: 'Wiring & Electrical Manual - Mitsubishi MSY-Z Series',
    description: 'ไดอะแกรมสายไฟและข้อกำหนดทางไฟฟ้าครบ MSY-Z Inverter',
    pages: 36, year: 2022, popular: true,
    url: '/manuals/mitsubishi-msyz-wiring.pdf',
  },
  // CARRIER
  {
    id: 'c1', brand: 'Carrier', model: 'X-Power Series', type: 'Inverter',
    category: 'Error Manuals', title: 'Error Code Service Manual - Carrier X-Power Series',
    description: 'Error Code CHG/CL/E1-F9 พร้อมขั้นตอนวินิจฉัย X-Power ทุกรุ่น',
    pages: 62, year: 2023, popular: true,
    url: '/manuals/carrier-xpower-error-manual.pdf',
  },
  // PANASONIC
  {
    id: 'p1', brand: 'Panasonic', model: 'CU Series', type: 'Inverter',
    category: 'Installation', title: 'Installation Guide - Panasonic CU Series Inverter',
    description: 'ขั้นตอนการติดตั้ง Panasonic CU Series ครบวงจร',
    pages: 44, year: 2024, popular: true,
    url: '/manuals/panasonic-cu-installation.pdf',
  },
  // HAIER
  {
    id: 'h1', brand: 'Haier', model: 'HSU Series', type: 'Fixed Speed',
    category: 'Wiring', title: 'Wiring Diagram Manual - Haier HSU Fixed Speed',
    description: 'ไดอะแกรมสายไฟ Haier HSU Fixed Speed ครบวงจร R22/R32',
    pages: 28, year: 2023, popular: false,
    url: '/manuals/haier-hsu-wiring-diagram.pdf',
  },
  // LG
  {
    id: 'l1', brand: 'LG', model: 'General Inverter', type: 'Inverter',
    category: 'Error Manuals', title: 'คู่มือรหัสข้อผิดพลาด LG Error Code (Inverter)',
    description: 'โค้ดรหัสแสดงข้อบกพร่อง วิธีแก้ไขและการวินิจฉัยอาการเสียแอร์ LG',
    pages: 35, year: 2023, popular: true,
    url: '/manuals/Lg-Error-Code.pdf',
  },
  // TOSHIBA
  {
    id: 't1', brand: 'Toshiba', model: 'RAS Series', type: 'Inverter',
    category: 'Installation', title: 'Installation Manual - Toshiba RAS Series',
    description: 'คู่มือการติดตั้งและการบริการเครื่องปรับอากาศ Toshiba RAS Series',
    pages: 52, year: 2022, popular: false,
    url: '/manuals/TOSHIBA RAS Series Manual.pdf',
  },
  // SAMSUNG
  {
    id: 's1', brand: 'Samsung', model: 'DB68-12570A', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Samsung DB68-12570A (ภาษาไทย)',
    description: 'ขั้นตอนการติดตั้ง การเดินท่อสายไฟ และคำแนะนำการติดตั้งภาษาไทย',
    pages: 40, year: 2023, popular: false,
    url: '/manuals/samsung_DB68-12570A_TH.pdf',
  },
]

export const brands = ['Daikin', 'Mitsubishi', 'Carrier', 'Panasonic', 'Haier', 'LG', 'Toshiba', 'Samsung']
export const types = ['Inverter', 'Fixed Speed']
export const categories = ['Installation', 'Wiring', 'Error Manuals']
