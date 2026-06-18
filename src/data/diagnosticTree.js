export const diagnosticTree = [
  {
    id: 'no_cool',
    label: 'แอร์มีแต่ลมไม่มีความเย็น',
    icon: '🌬️',
    questions: [
      {
        id: 'q1',
        text: 'พัดลมคอยล์ร้อน (ยูนิตนอก) หมุนหรือไม่?',
        options: [
          {
            label: 'หมุนปกติ',
            next: 'q2',
          },
          {
            label: 'ไม่หมุน / หมุนช้า',
            results: [
              { probability: 85, text: 'Capacitor พัดลมคอยล์ร้อนเสีย', fix: 'เปลี่ยน Capacitor มอเตอร์ (Run Capacitor) ให้ตรงค่า µF ตามสเปค' },
              { probability: 15, text: 'มอเตอร์พัดลมคอยล์ร้อนเสีย', fix: 'เปลี่ยนมอเตอร์พัดลมคอยล์ร้อน วัดขดลวดก่อนสั่งอะไหล่' },
            ],
          },
        ],
      },
      {
        id: 'q2',
        text: 'Compressor (ยูนิตนอก) ทำงานส่งเสียงหรือไม่?',
        options: [
          {
            label: 'ทำงานปกติ มีเสียงฮัม',
            next: 'q3',
          },
          {
            label: 'ไม่ทำงาน / เงียบ',
            results: [
              { probability: 70, text: 'Capacitor Compressor เสีย', fix: 'วัดค่า Capacitor Compressor เทียบกับค่าที่ระบุ ±10% หากเกินให้เปลี่ยน' },
              { probability: 20, text: 'Overload Protector ทำงาน', fix: 'รอให้ Compressor เย็น 30 นาที แล้วลองเปิดใหม่ ตรวจแรงดันไฟ' },
              { probability: 10, text: 'Compressor ล็อค / เสีย', fix: 'ทดสอบโดยใช้ Hard Start Kit หากยังไม่สตาร์ท ต้องเปลี่ยน Compressor' },
            ],
          },
        ],
      },
      {
        id: 'q3',
        text: 'วัดแรงดันน้ำยาฝั่งต่ำ (Low Pressure) ได้เท่าไหร่?',
        options: [
          {
            label: 'ต่ำกว่า 50 PSI (น้ำยาน้อย)',
            results: [
              { probability: 90, text: 'น้ำยารั่วหรือระบบขาดน้ำยา', fix: 'ตรวจหาจุดรั่วด้วย Leak Detector → ซ่อมรอยรั่ว → Vacuum → เติมน้ำยาตามสเปค' },
              { probability: 10, text: 'Expansion Valve ปิดตัน', fix: 'ตรวจสอบ Expansion Valve หรือ Capillary Tube ว่าอุดตันหรือไม่' },
            ],
          },
          {
            label: 'ปกติ 70-120 PSI',
            results: [
              { probability: 75, text: 'ฟิลเตอร์อากาศอุดตัน / คอยล์เย็นสกปรก', fix: 'ทำความสะอาดฟิลเตอร์และล้างคอยล์เย็นด้วยน้ำยาล้างคอยล์' },
              { probability: 25, text: 'น้ำยาเสื่อมคุณภาพ / ปน Moisture', fix: 'Vacuum ระบบและเปลี่ยน Filter Drier ก่อนเติมน้ำยาใหม่' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'outdoor_dead',
    label: 'คอยล์ร้อนไม่ทำงาน',
    icon: '🔌',
    questions: [
      {
        id: 'q1',
        text: 'มีไฟฟ้าเข้ายูนิตนอกหรือไม่?',
        options: [
          {
            label: 'มีไฟ ไฟสัญญาณติด',
            next: 'q2',
          },
          {
            label: 'ไม่มีไฟ / เบรกเกอร์ตัด',
            results: [
              { probability: 60, text: 'เบรกเกอร์ตัดเพราะกระแสเกิน', fix: 'ตรวจสอบกระแสของ Compressor, เช็คว่า Compressor ไม่ล็อค แล้ว Reset เบรกเกอร์' },
              { probability: 30, text: 'สายไฟหลุด / ขาด', fix: 'ตรวจสอบสายไฟทั้งระบบ ขัน Screw ขั้วต่อทุกจุด' },
              { probability: 10, text: 'ฟิวส์บน PCB ขาด', fix: 'ตรวจสอบและเปลี่ยนฟิวส์บน Main PCB ของ Outdoor Unit' },
            ],
          },
        ],
      },
      {
        id: 'q2',
        text: 'มีสัญญาณส่งจากยูนิตในมายูนิตนอกหรือไม่?',
        options: [
          {
            label: 'มีสัญญาณ (วัดได้ 12-24V)',
            results: [
              { probability: 65, text: 'Contactor หรือ Relay คอยล์ร้อนเสีย', fix: 'ตรวจสอบ Contactor และ PCB Relay ของ Outdoor Unit เปลี่ยนตามที่วัดพบ' },
              { probability: 35, text: 'PCB Outdoor เสีย', fix: 'ตรวจสอบ PCB Outdoor โดยละเอียด หากพบชิ้นส่วนไหม้ ต้องเปลี่ยน PCB' },
            ],
          },
          {
            label: 'ไม่มีสัญญาณ',
            results: [
              { probability: 80, text: 'สายสัญญาณขาดหรือหลวม', fix: 'ตรวจสอบและซ่อมสายสัญญาณระหว่างยูนิต เช็คขั้วต่อทั้งสองฝั่ง' },
              { probability: 20, text: 'PCB Indoor ไม่ส่งสัญญาณ', fix: 'ทดสอบ PCB Indoor ด้วย Multimeter ตรวจจุดส่งสัญญาณ' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'water_leak',
    label: 'น้ำหยด / น้ำล้น',
    icon: '💧',
    questions: [
      {
        id: 'q1',
        text: 'น้ำหยดจากส่วนไหน?',
        options: [
          {
            label: 'หยดจากด้านหน้ายูนิตใน',
            next: 'q2',
          },
          {
            label: 'หยดจากข้อต่อท่อน้ำยา',
            results: [
              { probability: 95, text: 'ฉนวนท่อน้ำยาเสื่อม / ท่อน้ำยาเปียก', fix: 'พันฉนวนท่อน้ำยาใหม่ ตรวจสอบว่าท่อน้ำยาไม่ถูกแสงแดดโดยตรง' },
            ],
          },
        ],
      },
      {
        id: 'q2',
        text: 'ถาดน้ำทิ้ง (Drain Pan) มีน้ำขังหรือล้นหรือไม่?',
        options: [
          {
            label: 'ถาดน้ำล้น ท่อน้ำทิ้งตัน',
            results: [
              { probability: 90, text: 'ท่อน้ำทิ้งอุดตันจากตะไคร่น้ำหรือฝุ่น', fix: 'เป่าท่อน้ำทิ้งด้วย Pump หรือลม → เทน้ำทดสอบ → ติดตั้งท่อน้ำทิ้งให้ลาดเอียงถูกต้อง' },
              { probability: 10, text: 'ถาดน้ำทิ้งแตก / รั่ว', fix: 'เปลี่ยนถาดน้ำทิ้งใหม่' },
            ],
          },
          {
            label: 'ถาดปกติ แต่คอยล์เป็นน้ำแข็ง',
            results: [
              { probability: 70, text: 'น้ำยาน้อยเกินไป / รั่ว', fix: 'วัดแรงดันน้ำยา ถ้าต่ำกว่าปกติ ตรวจหารั่วและเติมน้ำยา' },
              { probability: 20, text: 'ฟิลเตอร์อากาศอุดตัน ลมไม่ผ่านคอยล์', fix: 'ทำความสะอาดฟิลเตอร์ ตรวจสอบพัดลมคอยล์เย็น' },
              { probability: 10, text: 'อุณหภูมิตั้งต่ำเกินไป', fix: 'ตั้งอุณหภูมิไม่ต่ำกว่า 20°C ในสภาพอากาศปกติ' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'wont_start',
    label: 'แอร์เปิดไม่ติด',
    icon: '⚡',
    questions: [
      {
        id: 'q1',
        text: 'ไฟแสดงสถานะบนยูนิตในติดหรือไม่?',
        options: [
          {
            label: 'ไม่มีไฟเลย',
            results: [
              { probability: 50, text: 'เบรกเกอร์ตัด หรือฟิวส์หลักขาด', fix: 'ตรวจสอบเบรกเกอร์ รีเซ็ตถ้าตัด หากตัดซ้ำให้ตรวจสอบสาย' },
              { probability: 30, text: 'ฟิวส์บน PCB คอยล์เย็นขาด', fix: 'ตรวจสอบและเปลี่ยนฟิวส์บน Indoor PCB' },
              { probability: 20, text: 'แรงดันไฟต่ำเกินไป', fix: 'วัดแรงดันไฟ ควรได้ 220V ±10%' },
            ],
          },
          {
            label: 'ไฟติด แต่ไม่ตอบสนองรีโมท',
            next: 'q2',
          },
        ],
      },
      {
        id: 'q2',
        text: 'รีโมทส่งสัญญาณออกมาหรือไม่? (ทดสอบด้วยกล้องโทรศัพท์)',
        options: [
          {
            label: 'ไม่มีสัญญาณ (กล้องไม่เห็นแสง)',
            results: [
              { probability: 80, text: 'ถ่านรีโมทหมด หรือรีโมทเสีย', fix: 'เปลี่ยนถ่านรีโมทก่อน หากยังไม่ทำงาน เปลี่ยนรีโมทใหม่' },
            ],
          },
          {
            label: 'มีสัญญาณ แต่ยูนิตไม่ตอบ',
            results: [
              { probability: 70, text: 'IR Receiver บน PCB เสีย', fix: 'ตรวจสอบ IR Sensor บน Indoor PCB เปลี่ยน Receiver หรือ PCB' },
              { probability: 30, text: 'PCB Indoor เสีย', fix: 'ทดสอบสั่งงานโดยตรงที่ปุ่มบนตัวเครื่อง หากไม่ทำงาน เปลี่ยน PCB' },
            ],
          },
        ],
      },
    ],
  },
]
