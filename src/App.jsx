import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import {
  Wind, Zap, Stethoscope, BookOpen, Camera, Library, Settings, Menu,
  Sun, ChevronRight, ChevronLeft, CheckCircle, ArrowRight, Scan,
  AlertCircle, Search, ChevronDown, ChevronUp, RotateCcw,
  AlertTriangle, Plus, Save, Copy, Check, MessageCircle,
  Wifi, WifiOff, Trash2, FileText, ExternalLink, Clock, X,
  Eye, Star, Download, ImagePlus, Brain, Sparkles, Send, MapPin,
  BarChart2
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { 
  CalculatorIcon as CalcOutline, 
  WrenchScrewdriverIcon as WrenchOutline, 
  ClipboardDocumentCheckIcon as ClipboardOutline, 
  CameraIcon as CameraOutline,
  BookOpenIcon as LibraryOutline,
  Cog6ToothIcon as SettingsOutline
} from '@heroicons/react/24/outline'
import { 
  CalculatorIcon as CalcSolid, 
  WrenchScrewdriverIcon as WrenchSolid, 
  ClipboardDocumentCheckIcon as ClipboardSolid, 
  CameraIcon as CameraSolid,
  BookOpenIcon as LibrarySolid,
  Cog6ToothIcon as SettingsSolid
} from '@heroicons/react/24/solid'
// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
export function formatPhoneOrPromptPay(val) {
  if (val === undefined || val === null) return '';
  let str = val.toString().trim();
  str = str.replace(/^'/, '');
  let digits = str.replace(/\D/g, '');
  if (digits.length === 9) {
    return '0' + digits;
  }
  if (digits.length === 12) {
    return '0' + digits;
  }
  return str;
}


// ─── SUPABASE INITIALIZATION ────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseConfigured = supabaseUrl &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-anon-key-here'

const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ─── MOCK DATABASE ──────────────────────────────────────────────────────────
const ROOM_TYPES = [
  { label: 'ห้องนอน', factor: 700 },
  { label: 'ห้องทำงาน / นั่งเล่น', factor: 800 },
  { label: 'ห้องรับแขก / ร้านค้า', factor: 900 },
  { label: 'ร้านอาหาร / ชาบูที่มีหม้อต้ม', factor: 1100 },
]

const STANDARD_SIZES = [9000, 12000, 18000, 24000, 30000, 36000]
const REFRIGERANT_TYPES = ['R32', 'R410A', 'R22']

const refrigerantGuide = [
  {
    type: 'R32',
    color: '#38bdf8',
    lowPressure: { PSI: '115–140', Bar: '7.9–9.7' },
    highPressure: { PSI: '350–420', Bar: '24.1–29.0' },
    normalCurrent: '4–8 A (ขึ้นกับขนาด BTU)',
    evapTemp: '8–12°C',
    condTemp: '40–55°C',
    notes: 'น้ำยาไวไฟ Class A2L สารทำความเย็นเชิงเดี่ยว (Pure Refrigerant) ใช้กับ Inverter รุ่นใหม่',
    warningColor: null,
    warning: null,
  },
  {
    type: 'R410A',
    color: '#818cf8',
    lowPressure: { PSI: '100–130', Bar: '6.9–9.0' },
    highPressure: { PSI: '380–450', Bar: '26.2–31.0' },
    normalCurrent: '4–9 A (ขึ้นกับขนาด BTU)',
    evapTemp: '5–10°C',
    condTemp: '45–58°C',
    notes: 'ไม่ไวไฟ สารผสม Azeotropic ใช้กับระบบ Inverter และ Fixed Speed รุ่นกลาง',
    warningColor: '#fb923c',
    warning: 'ห้ามเติมในสถานะ Gas เด็ดขาด ต้องคว่ำถังเติมในสถานะของเหลว (Liquid) เท่านั้น',
  },
  {
    type: 'R22',
    color: '#4ade80',
    lowPressure: { PSI: '60–80', Bar: '4.1–5.5' },
    highPressure: { PSI: '200–260', Bar: '13.8–17.9' },
    normalCurrent: '5–10 A (ขึ้นกับขนาด BTU)',
    evapTemp: '2–8°C',
    condTemp: '40–55°C',
    notes: 'HCFC — กำลังถูกยกเลิก ใช้กับรุ่นเก่าเท่านั้น ห้ามผสมกับน้ำยาชนิดอื่น',
    warningColor: '#f87171',
    warning: 'สารทำลายชั้นโอโซน ห้ามระบายสู่บรรยากาศโดยเด็ดขาด',
  },
]

const diagnosticTree = [
  {
    id: 'no_cool',
    label: 'แอร์มีแต่ลมไม่มีความเย็น',
    icon: '🌬️',
    questions: [
      {
        id: 'q1',
        text: 'พัดลมคอยล์ร้อน (ยูนิตนอก) หมุนหรือไม่?',
        options: [
          { label: 'หมุนปกติ', next: 'q2' },
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
          { label: 'ทำงานปกติ มีเสียงฮัม', next: 'q3' },
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
          { label: 'มีไฟ ไฟสัญญาณติด', next: 'q2' },
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
          { label: 'หยดจากด้านหน้ายูนิตใน', next: 'q2' },
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
          { label: 'ไฟติด แต่ไม่ตอบสนองรีโมท', next: 'q2' },
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

const errorCodes = {
  Daikin: [
    {
      code: 'E1',
      description: 'ปัญหาการสื่อสารระหว่างคอยล์เย็นและคอยล์ร้อน',
      cause: 'สายสัญญาณขาด / ขั้วต่อหลวม / PCB เสีย',
      steps: [
        'ตรวจสอบสายสัญญาณระหว่างยูนิตในและนอก',
        'ถอดและเสียบขั้วต่อสัญญาณใหม่ทั้งสองฝั่ง',
        'วัดแรงดันไฟฟ้าที่ขั้วสัญญาณ ควรได้ 12-24VDC',
        'หากยังพบปัญหา เปลี่ยน PCB คอยล์เย็น',
      ],
    },
    {
      code: 'E3',
      description: 'แรงดันสูงเกิน (High Pressure Protection)',
      cause: 'คอยล์ร้อนสกปรก / พัดลมคอยล์ร้อนเสีย / น้ำยาอัดเกิน',
      steps: [
        'ตรวจสอบและทำความสะอาดคอยล์ร้อน',
        'ตรวจสอบการหมุนของพัดลมคอยล์ร้อน',
        'วัดแรงดันสูง ถ้าเกิน 400 PSI ให้ระบายน้ำยาออกบ้าง',
        'ตรวจสอบอุณหภูมิแวดล้อม หากร้อนเกิน 45°C แนะนำสร้างที่กำบัง',
      ],
    },
    {
      code: 'E4',
      description: 'แรงดันต่ำเกิน (Low Pressure Protection)',
      cause: 'น้ำยารั่ว / ฟิลเตอร์อุดตัน / Expansion Valve เสีย',
      steps: [
        'วัดแรงดันต่ำ ถ้าต่ำกว่า 50 PSI ให้ตรวจสอบการรั่ว',
        'ทดสอบรอยรั่วด้วย Nitrogen หรือน้ำสบู่',
        'ตรวจสอบและเปลี่ยนฟิลเตอร์ดรายเออร์',
        'ตรวจสอบ Expansion Valve ว่าเปิด-ปิดปกติ',
      ],
    },
    {
      code: 'U4',
      description: 'ระบบสื่อสารคอนโทรลขัดข้อง (Transmission Error)',
      cause: 'สายสัญญาณสายหมายเลข 3 ขาด/หลวม / บอร์ดคอนโทรลฝั่งใดฝั่งหนึ่งเสีย',
      steps: [
        'วัดแรงดันไฟฟ้า DC ระหว่างขั้ว 2 และ 3 ควรได้ 12-24VDC',
        'ตรวจสอบสายสัญญาณคอนโทรลและขั้วต่อทั้งสองญุด',
        'Reset เครื่องโดยปิดเบรกเกอร์ 5 นาทีแล้วเปิดใหม่',
        'หากยังเกิดโค้ดซ้ำ เปลี่ยน PCB เสียก่อนไปในเปลี่ยนรุ่นโดยเริ่มจาก Indoor',
      ],
    },
    {
      code: 'A6',
      description: 'มอเตอร์พัดลมคอยล์เย็นทำงานผิดปกติ / ติดขัด (Fan Motor Lock)',
      cause: 'มอเตอร์พัดลมกรงกระรอกไหม้ / แจ็คเสียบสายพัดลมหลวม / ตลับลูกปืนฝืดล็อกแน่น',
      steps: [
        'ตรวจสอบสิ่งกีดขวางใบพัดหรือรูเสียบตัวคนบังคับแอ็รฟิว',
        'ถอดมอเตอร์ออก หมุนสัมภาษณ์ดูว่าตลับลูกปืนฝืดหรือไม่',
        'ตรวจแจ็คเสียบสายมอเตอร์บน Main PCB ว่าเสียบแน่นดีหรือไม่',
        'วัดความต้านทานขดลวดมอเตอร์ ถ้าผิดปกติเปลี่ยนมอเตอร์ใหม่',
      ],
    },
    {
      code: 'L5',
      description: 'ระบบป้องกัน Inverter ทำงาน',
      cause: 'กระแสไฟ Inverter สูงเกิน / IGBT เสีย / Compressor ล็อค',
      steps: [
        'ปิดเครื่องพักไว้ 30 นาที แล้วเปิดใหม่',
        'วัดกระแสขณะทำงาน เทียบกับค่ามาตรฐาน',
        'ตรวจสอบ Compressor ว่าหมุนได้อิสระ',
        'หากยังพบปัญหา เปลี่ยน Inverter Board',
      ],
    },
  ],
  Mitsubishi: [
    {
      code: 'E6 / ไฟกะพริบ 2 ครั้ง',
      description: 'ระบบสื่อสารคอนโทรลขัดข้อง (Serial Signal Error)',
      cause: 'สายสัญญาณเชื่อมต่อ Indoor-Outdoor ขาด / บอร์ดคอยล์ร้อนไม่มีไฟจ่ายเข้าบอร์ด (Power Supply พัง)',
      steps: [
        'ตรวจสอบสาย S, S1, S2 ระหว่างยูนิตในและนอกอย่างละเอียด',
        'วัดแรงดันไฟเลี้ยง Outdoor PCB ควรได้ 220VAC',
        'ทำความสะอาดขั้วต่อด้วย Contact Cleaner',
        'Reset PCB โดยปิดเบรกเกอร์ 1 นาที',
      ],
    },
    {
      code: 'E7 / ไฟกะพริบ 5 ครั้ง',
      description: 'เซ็นเซอร์วัดอุณหภูมิแผงคอยล์เย็น (Thermistor) ขัดข้อง',
      cause: 'ค่าความต้านทานเพี้ยน / เซ็นสายขาด/ช็อต (ปกติ ~10kΩ ที่อุณหภูมิห้อง)',
      steps: [
        'วัดค่าต้านทาน Thermistor ที่ 25°C ควรได้ประมาณ 10kΩ',
        'ถ้าค่าผิดปกติ (0 หรือ ∞) ให้เปลี่ยนเซ็นเซอร์ทันที',
        'ตรวจขั้วต่อและ Connector บน PCB ว่าแน่นดี',
        'หากเปลี่ยนเซ็นแล้วยังเกิดโค้ด ให้เปลี่ยน Indoor PCB',
      ],
    },
    {
      code: 'P8',
      description: 'อุณหภูมิ Inverter สูงเกิน',
      cause: 'Heatsink สกปรก / พัดลม Inverter เสีย / แอมป์สูงเกิน',
      steps: [
        'ทำความสะอาด Heatsink ของ Inverter Board',
        'ตรวจสอบพัดลมระบายความร้อน Inverter',
        'ตรวจสอบกระแสไฟของ Compressor',
        'ตรวจสอบ Thermal Paste บน IGBT',
      ],
    },
    {
      code: 'P6',
      description: 'แรงดันสูงหรือต่ำเกิน (Pressure Protection)',
      cause: 'น้ำยาไม่สมดุล / คอยล์อุดตัน / Expansion Valve',
      steps: [
        'วัดแรงดันต่ำและสูงพร้อมกัน บันทึกค่า',
        'เช็คค่าเทียบกับตารางมาตรฐานน้ำยา',
        'ล้างคอยล์ทั้งในและนอก',
        'ตรวจสอบและทดสอบ Electronic Expansion Valve',
      ],
    },
    {
      code: 'EF',
      description: 'โหมดป้องกัน Freeze (คอยล์เย็นเป็นน้ำแข็ง)',
      cause: 'น้ำยาน้อย / ฟิลเตอร์อุดตัน / อุณหภูมิห้องต่ำเกิน',
      steps: [
        'ตรวจสอบฟิลเตอร์อากาศ ทำความสะอาดหากสกปรก',
        'ตรวจสอบแรงดันน้ำยา ถ้าต่ำกว่าปกติ ตรวจหารั่ว',
        'ตั้งอุณหภูมิให้สูงขึ้น ไม่ต่ำกว่า 20°C',
        'ตรวจสอบ Thermistor คอยล์เย็น',
      ],
    },
  ],
  Carrier: [
    {
      code: 'E1',
      description: 'ไม่มีสัญญาณจากรีโมท / PCB คอยล์เย็นผิดพลาด',
      cause: 'ถ่านรีโมทหมด / Receiver Board เสีย',
      steps: [
        'เปลี่ยนถ่านรีโมทก่อน',
        'ทดสอบรีโมทด้วยกล้องโทรศัพท์ (ดูแสงอินฟราเรด)',
        'ตรวจสอบ IR Receiver บน PCB คอยล์เย็น',
        'หากไม่มีสัญญาณ เปลี่ยน Indoor PCB',
      ],
    },
    {
      code: 'E2',
      description: 'Indoor Thermistor ผิดพลาด',
      cause: 'Thermistor ขาด / ค่าต้านทานผิดปกติ / ขั้วต่อหลวม',
      steps: [
        'วัดค่าต้านทาน Thermistor ที่อุณหภูมิห้อง ควรได้ ~10kΩ',
        'ตรวจสอบขั้วต่อ Thermistor บน PCB',
        'เปลี่ยน Thermistor ใหม่ (อะไหล่ราคาถูก)',
        'ทดสอบโดย Reset และตั้งอุณหภูมิ',
      ],
    },
    {
      code: 'E3',
      description: 'Coil Thermistor ผิดพลาด',
      cause: 'Thermistor คอยล์เย็นเสีย / สายขาด',
      steps: [
        'วัดค่าต้านทาน Thermistor คอยล์ที่ 0°C ควรได้ ~30kΩ',
        'ตรวจสอบสายและขั้วต่อ',
        'เปลี่ยน Thermistor คอยล์เย็น',
        'ตรวจสอบว่าไม่มีน้ำเข้า Connector',
      ],
    },
    {
      code: 'E4',
      description: 'Outdoor Unit ไม่ตอบสนอง',
      cause: 'สายไฟ / สายสัญญาณ Outdoor / PCB Outdoor เสีย',
      steps: [
        'ตรวจสอบแรงดันไฟฟ้าที่ยูนิตนอก',
        'ตรวจสอบสายสัญญาณ Indoor-Outdoor',
        'ตรวจสอบฟิวส์บน PCB Outdoor',
        'วัดแรงดัน 220V ที่ Compressor Contactor',
      ],
    },
    {
      code: 'Chg / CL',
      description: 'สัญญาณแจ้งล้างแผ่นกรอง / ตรวจพบน้ำยารั่วไหล (Leakage Detection)',
      cause: 'แอร์สกปรกจนน้ำยาเดินไม่สะดวก / จุดรั่วซึมทำให้น้ำยาพร่อง',
      steps: [
        'ตรวจสอบแรงดันน้ำยาต่ำ ถ้าต่ำผิดปกติหาจุดรั่ว',
        'ตรวจสอบกระแสไฟฟ้าเทียบกับสเป็ค ถ้าสูงผิดปกติมีน้ำยาน้อย',
        'ตรวจหาจุดรั่วด้วย Electronic Leak Detector',
        'ล้างแผ่นกรองเพื่อล้าง Chg Indicator หากมี Clean ผังวาก',
      ],
    },
    {
      code: 'F1',
      description: 'Outdoor Thermistor (Ambient) ผิดพลาด',
      cause: 'Thermistor คอยล์ร้อนเสีย / ความชื้นเข้าขั้วต่อ',
      steps: [
        'ตรวจสอบ Thermistor บนคอยล์ร้อน',
        'ทำความสะอาดขั้วต่อด้วย Contact Cleaner',
        'วัดค่าต้านทานเทียบกับตาราง',
        'เปลี่ยน Thermistor หากค่าผิดปกติ',
      ],
    },
  ],
  Haier: [
    {
      code: 'E1',
      description: 'ระบบป้องกันแรงดันสูง (High Pressure Switch)',
      cause: 'Pressure Switch ทำงาน / น้ำยาเกิน / คอยล์ร้อนอุดตัน',
      steps: [
        'ปิดเครื่อง 10 นาที แล้วเปิดใหม่',
        'ทำความสะอาดคอยล์ร้อน',
        'วัดแรงดันสูง ถ้าเกิน 380 PSI ให้ระบายน้ำยา',
        'ตรวจสอบ High Pressure Switch ว่า Reset ได้',
      ],
    },
    {
      code: 'E2',
      description: 'ระบบป้องกันแรงดันต่ำ (Low Pressure Switch)',
      cause: 'น้ำยารั่ว / ฟิลเตอร์ดรายเออร์อุดตัน',
      steps: [
        'วัดแรงดันต่ำ ถ้าต่ำกว่า 40 PSI ตรวจสอบการรั่ว',
        'ทดสอบรอยรั่วด้วย Electronic Leak Detector',
        'เปลี่ยนฟิลเตอร์ดรายเออร์',
        'เติมน้ำยาและวัดแรงดันใหม่',
      ],
    },
    {
      code: 'E3',
      description: 'Compressor ล้มเหลวในการสตาร์ท',
      cause: 'Capacitor เสีย / Compressor ไฟไม่ครบเฟส / Compressor ล็อค',
      steps: [
        'วัด Capacitor Compressor ค่าตามสเปค ±10%',
        'ตรวจสอบแรงดันไฟ 3 เฟส (ถ้ามี)',
        'ลองหมุน Compressor ด้วยมือ (ปิดไฟก่อน)',
        'หาก Compressor ล็อค เปลี่ยน Compressor',
      ],
    },
    {
      code: 'E6',
      description: 'Indoor Fan Motor ผิดพลาด',
      cause: 'มอเตอร์พัดลมคอยล์เย็นเสีย / Capacitor / Hall Sensor',
      steps: [
        'ตรวจสอบว่าพัดลมหมุนได้อิสระ ไม่ติดขัด',
        'วัด Capacitor มอเตอร์คอยล์เย็น',
        'ตรวจสอบ Hall Effect Sensor (DC Motor)',
        'เปลี่ยนมอเตอร์พัดลมคอยล์เย็น',
      ],
    },
    {
      code: 'F1',
      description: 'Indoor Room Temperature Sensor ผิดพลาด',
      cause: 'Thermistor ห้องเสีย / ขั้วต่อหลวม / PCB เสีย',
      steps: [
        'วัดค่า Thermistor ที่ 25°C ควรได้ประมาณ 10kΩ',
        'ตรวจสอบขั้วต่อบน Main PCB',
        'ลอง Bypass Thermistor ชั่วคราวเพื่อทดสอบ',
        'เปลี่ยน Thermistor หรือ PCB ตามผล',
      ],
    },
  ],
  Panasonic: [
    {
      code: 'H11',
      description: 'ระบบสื่อสารขัดข้อง (Indoor/Outdoor Communication Error)',
      cause: 'สายเชื่อมต่อสัญญาณคอนโทรล (สายหมายเลข 3) ขาดหรือสลับเฟส / บอร์ดอินดอร์หรือเอาท์ดอร์ชำรุด',
      steps: [
        'ตรวจสอบความแน่นและเช็คสภาพสายไฟหมายเลข 3 (Signal) ระหว่าง Indoor-Outdoor',
        'วัดแรงดันไฟสัญญาณควบคุมกระแสตรง (DC voltage fluctuation)',
        'เช็คจุดต่อขั้วสายไฟเพื่อดูคราบขี้เกลือและความชื้น',
        'เปลี่ยน Main PCB หรือ Outdoor PCB ตามลำดับ',
      ],
    },
    {
      code: 'H19',
      description: 'Indoor Fan Motor Lock (มอเตอร์พัดลมตัวในขัดข้อง)',
      cause: 'มอเตอร์พัดลมคอยล์เย็นหมุนฝืด ตลับลูกปืนฝืด / ขดลวดมอเตอร์ไหม้ / บอร์ดจ่ายไฟผิดปกติ',
      steps: [
        'ใช้มือหมุนแกนพัดลมกรงกระรอกเช็คความตื่นตึ๊กของมอเตอร์',
        'วัดความต้านทานขดลวดมอเตอร์พัดลมตัวใน',
        'ตรวจเช็คจุดเสียบสายพัดลมบนแผงวงจรควบคุม (PCB)',
        'เปลี่ยนมอเตอร์พัดลมคอยล์เย็น',
      ],
    },
    {
      code: 'H97',
      description: 'Outdoor Fan Motor Lock (มอเตอร์พัดลมตัวนอกขัดข้อง)',
      cause: 'พัดลมคอยล์ร้อนล็อค / มอเตอร์เสีย / มีสิ่งกีดขวางใบพัด / บอร์ดบกพร่อง',
      steps: [
        'ตรวจหาเศษสิ่งกีดขวางรอบตัวพัดลมคอยล์ร้อน',
        'วัดค่าความต้านทานและเช็คการหมุนของมอเตอร์พัดลมนอกยูนิต',
        'ตรวจสอบสายไฟและขั้วเสียบเชื่อมต่อกับ Outdoor PCB',
        'เปลี่ยนมอเตอร์คอยล์ร้อนยูนิตภายนอก',
      ],
    },
    {
      code: 'F99',
      description: 'Outdoor DC Peak Detection (กระแสไฟกระชากฝั่ง DC)',
      cause: 'คอมเพรสเซอร์เกิดปัญหาติดล็อคทางกล / โมดูล IPM บนแผงวงจรเอาท์ดอร์เสียช็อต',
      steps: [
        'ปิดสวิตช์เบรกเกอร์ทิ้งไว้ 3 นาทีแล้วเปิดใหม่เพื่อสังเกตอาการสตาร์ท',
        'วัดค่าโอห์มของขดลวดคอมเพรสเซอร์ (U-V-W) เทียบกันว่าเท่ากันหรือไม่',
        'วัดความต้านทานเทียบโครงของคอมเพรสเซอร์ (เช็คลงดิน)',
        'เปลี่ยน Outdoor Main Board (IPM) หรือคอมเพรสเซอร์',
      ],
    },
    {
      code: 'F91',
      description: 'Refrigeration Cycle Abnormal (น้ำยาพร่องหรือขาดระบบ)',
      cause: 'น้ำยาแอร์รั่วซึมในระบบ / ท่อแอร์พับหรือตีบอุดตัน / เซอร์วิสวาล์วเปิดไม่สุด',
      steps: [
        'วัดแรงดันน้ำยาต่ำ (Low Pressure) เทียบสเปคขณะคอมเพรสเซอร์ทำงาน',
        'เช็คจุดรั่วซึมด้วยฟองสบู่หรือเครื่องตรวจรั่วอิเล็กทรอนิกส์',
        'ตรวจเช็คท่อน้ำยาและท่อเชื่อมต่อว่ามีรอยหักพับอุดตันหรือไม่',
        'ทำระบบแวคคั่มและเติมน้ำยาแอร์เพิ่มตามเกณฑ์น้ำหนักสเปค',
      ],
    },
  ],
  LG: [
    {
      code: 'CH05',
      description: 'ระบบสื่อสารขัดข้อง (Communication Failure)',
      cause: 'สายคอนโทรลเชื่อมต่อระหว่างเครื่องภายนอกและภายในขาดหรือต่อผิด / บอร์ดไม่จ่ายไฟสื่อสาร',
      steps: [
        'ตรวจสอบสายไฟคอนโทรลจุดเชื่อมต่อเชื่อมเข้าหากันว่าถูกขั้วและแน่นดี',
        'ตรวจสอบและวัดแรงดันไฟฟ้าของสายสื่อสารเทียบกับกราวด์',
        'ตรวจเช็คความชื้นที่ขั้วเชื่อมสายและสายดิน (Ground)',
        'เปลี่ยนบอร์ดคอนโทรลคอยล์เย็นหรือคอยล์ร้อน',
      ],
    },
    {
      code: 'CH02',
      description: 'เซ็นเซอร์อากาศคอยล์เย็นบกพร่อง (Indoor Air Sensor)',
      cause: 'เซ็นเซอร์อุณหภูมิห้องขาด / ช็อตลัดวงจร หรือค่าความต้านทานเพี้ยน',
      steps: [
        'วัดค่าต้านทานของรูมเซ็นเซอร์ที่ 25°C (ปกติได้ประมาณ 10kΩ)',
        'ตรวจความถูกต้องของขั้วต่อบน Main PCB คอยล์เย็น',
        'เปลี่ยนชุดเทอร์มิสเตอร์เซ็นเซอร์คอยล์เย็นตัวใหม่',
      ],
    },
    {
      code: 'CH10',
      description: 'มอเตอร์พัดลมคอยล์เย็น BLDC ล็อค (Indoor Fan Motor Lock)',
      cause: 'มอเตอร์พัดลมตัวในเสียรอบตก / แกนใบพัดติดขัด / ชิปขับมอเตอร์บนบอร์ดชำรุด',
      steps: [
        'ใช้มือหมุนเช็คว่าใบพัดกรงกระรอกฝืดหรือสะดุดหรือไม่',
        'วัดแรงดันไฟเลี้ยงและสัญญาณขับของมอเตอร์พัดลม DC',
        'หากใบพัดหมุนคล่องแต่ไฟจ่ายปกติ ให้เปลี่ยนมอเตอร์พัดลม',
        'หากเปลี่ยนมอเตอร์แล้วยังใช้ไม่ได้ ให้เปลี่ยนแผงวงจรคอยล์เย็น',
      ],
    },
    {
      code: 'CH61',
      description: 'แผงคอนเดนเซอร์ร้อนเกินพิกัด (Outdoor Condenser Overheat)',
      cause: 'คอยล์ร้อนสกปรกมากระบายลมร้อนไม่ได้ / พัดลมนอกตัวไม่หมุน / ขวางทางลมระบาย',
      steps: [
        'ล้างทำความสะอาดแผงคอยล์ร้อนเอาฝุ่นและสิ่งสกปรกออก',
        'ตรวจเช็คการทำงานของพัดลมคอยล์ร้อนและตัวเก็บประจุมอเตอร์พัดลม',
        'ตรวจสอบระยะติดตั้งคอยล์ร้อนให้ระบายลมได้ดี ไม่มีลมร้อนวนกลับ',
        'เช็คเซ็นเซอร์คอยล์ร้อน Condenser Thermistor',
      ],
    },
    {
      code: 'CH21',
      description: 'Inverter Compressor DC Peak (กระแสเกินฝั่งอินเวอร์เตอร์)',
      cause: 'คอมเพรสเซอร์ติดล็อกทางกล / โมดูลกำลังไฟฟ้า IPM บนบอร์ดร้อนเสียหายช็อต',
      steps: [
        'วัดค่าความต้านทานขดลวดคอมเพรสเซอร์ (U-V-W) เทียบโอห์ม',
        'ตรวจสอบไฟเลี้ยงเข้าเครื่องแอร์ และเช็คแรงดันตกคร่อมขณะสตาร์ท',
        'ตรวจสอบความร้อนของแผงระบายความร้อนบอร์ดคอยล์ร้อน',
        'เปลี่ยนแผง IPM Board (บอร์ดร้อน) หรือตัวคอมเพรสเซอร์',
      ],
    },
  ],
}


const documents = [
  {
    id: 'd1', brand: 'Daikin', model: 'FTKQ Series', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Daikin FTKQ Series (Inverter)',
    description: 'ขั้นตอนการติดตั้งอย่างละเอียด ระยะท่อ น้ำยา R32',
    pages: 48, year: 2023, popular: true,
    url: '/manuals/daikin-ftkq-installation.pdf',
  },
  {
    id: 'm1', brand: 'Mitsubishi', model: 'MSY-Z Series', type: 'Inverter',
    category: 'Wiring', title: 'Wiring & Electrical Manual - Mitsubishi MSY-Z Series',
    description: 'ไดอะแกรมสายไฟและข้อกำหนดทางไฟฟ้าครบ MSY-Z Inverter',
    pages: 36, year: 2022, popular: true,
    url: '/manuals/mitsubishi-msyz-wiring.pdf',
  },
  {
    id: 'c1', brand: 'Carrier', model: 'X-Power Series', type: 'Inverter',
    category: 'Error Manuals', title: 'Error Code Service Manual - Carrier X-Power Series',
    description: 'Error Code CHG/CL/E1-F9 พร้อมขั้นตอนวินิจฉัย X-Power ทุกรุ่น',
    pages: 62, year: 2023, popular: true,
    url: '/manuals/carrier-xpower-error-manual.pdf',
  },
  {
    id: 'p1', brand: 'Panasonic', model: 'CU Series', type: 'Inverter',
    category: 'Installation', title: 'Installation Guide - Panasonic CU Series Inverter',
    description: 'ขั้นตอนการติดตั้ง Panasonic CU Series ครบวงจร',
    pages: 44, year: 2024, popular: true,
    url: '/manuals/panasonic-cu-installation.pdf',
  },
  {
    id: 'h1', brand: 'Haier', model: 'HSU Series', type: 'Fixed Speed',
    category: 'Wiring', title: 'Wiring Diagram Manual - Haier HSU Fixed Speed',
    description: 'ไดอะแกรมสายไฟ Haier HSU Fixed Speed ครบวงจร R22/R32',
    pages: 28, year: 2023, popular: false,
    url: '/manuals/haier-hsu-wiring-diagram.pdf',
  },
  {
    id: 'l1', brand: 'LG', model: 'General Inverter', type: 'Inverter',
    category: 'Error Manuals', title: 'คู่มือรหัสข้อผิดพลาด LG Error Code (Inverter)',
    description: 'โค้ดรหัสแสดงข้อบกพร่อง วิธีแก้ไขและการวินิจฉัยอาการเสียแอร์ LG',
    pages: 35, year: 2023, popular: true,
    url: '/manuals/Lg-Error-Code.pdf',
  },
  {
    id: 't1', brand: 'Toshiba', model: 'RAS Series', type: 'Inverter',
    category: 'Installation', title: 'Installation Manual - Toshiba RAS Series',
    description: 'คู่มือการติดตั้งและการบริการเครื่องปรับอากาศ Toshiba RAS Series',
    pages: 52, year: 2022, popular: false,
    url: '/manuals/TOSHIBA RAS Series Manual.pdf',
  },
  {
    id: 's1', brand: 'Samsung', model: 'DB68-12570A', type: 'Inverter',
    category: 'Installation', title: 'คู่มือติดตั้ง Samsung DB68-12570A (ภาษาไทย)',
    description: 'ขั้นตอนการติดตั้ง การเดินท่อสายไฟ และคำแนะนำการติดตั้งภาษาไทย',
    pages: 40, year: 2023, popular: false,
    url: '/manuals/samsung_DB68-12570A_TH.pdf',
  },
]


const brands = ['Daikin', 'Mitsubishi', 'Carrier', 'Panasonic', 'Haier', 'LG', 'Toshiba', 'Samsung', 'Saijo Denki', 'Central Air']
const types = ['Inverter', 'Fixed Speed']
const categories = ['Installation', 'Wiring', 'Error Manuals']

const TABS = [
  { id: 0, label: 'คำนวณ', iconOutline: CalcOutline, iconSolid: CalcSolid },
  { id: 1, label: 'วิเคราะห์อาการ', iconOutline: WrenchOutline, iconSolid: WrenchSolid },
  { id: 2, label: 'บันทึกงาน', iconOutline: ClipboardOutline, iconSolid: ClipboardSolid },
  { id: 3, label: 'สแกนเพลท', iconOutline: CameraOutline, iconSolid: CameraSolid },
  { id: 4, label: 'คลังคู่มือ', iconOutline: LibraryOutline, iconSolid: LibrarySolid },
  { id: 5, label: 'ตั้งค่าระบบ', iconOutline: SettingsOutline, iconSolid: SettingsSolid },
]

// ─── CONTEXTS FOR STATE PRESERVATION & GLOBAL SETTINGS ───────────────────────
const AppContext = createContext(null)
const CalculatorContext = createContext(null)

export function AppProvider({ children }) {
  const [unitSystem, setUnitSystem] = useState(() => localStorage.getItem('abp_unit') || 'PSI')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('abp_font') || 'normal')
  const [powerSaving, setPowerSaving] = useState(() => localStorage.getItem('abp_power') === 'true')
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('abp_theme') || 'dark')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const [shopName, setShopName] = useState(() => localStorage.getItem('abp_shop_name') || '')
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('abp_shop_address') || '')
  const [promptPayId, setPromptPayId] = useState(() => formatPhoneOrPromptPay(localStorage.getItem('abp_promptpay_id') || ''))

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('abp_user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        return {
          ...parsed,
          phone: formatPhoneOrPromptPay(parsed.phone),
          promptpay_id: formatPhoneOrPromptPay(parsed.promptpay_id)
        }
      }
      return null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('abp_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('abp_user')
    }
  }, [user])

  useEffect(() => { localStorage.setItem('abp_shop_name', shopName) }, [shopName])
  useEffect(() => { localStorage.setItem('abp_shop_address', shopAddress) }, [shopAddress])
  useEffect(() => { 
    localStorage.setItem('abp_promptpay_id', promptPayId) 
  }, [promptPayId])

  useEffect(() => { localStorage.setItem('abp_unit', unitSystem) }, [unitSystem])
  useEffect(() => { localStorage.setItem('abp_font', fontSize) }, [fontSize])
  useEffect(() => { localStorage.setItem('abp_power', powerSaving) }, [powerSaving])
  useEffect(() => {
    localStorage.setItem('abp_theme', appTheme)
    document.documentElement.setAttribute('data-theme', appTheme)
  }, [appTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-scale', 
      fontSize === 'large' ? '1.18' : 
      fontSize === 'xl' ? '1.38' : 
      fontSize === 'xxl' ? '1.58' : '1.0'
    )
  }, [fontSize])

  useEffect(() => {
    if (powerSaving) {
      document.body.classList.add('power-saving')
    } else {
      document.body.classList.remove('power-saving')
    }
  }, [powerSaving])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AppContext.Provider value={{
      unitSystem, setUnitSystem,
      fontSize, setFontSize,
      powerSaving, setPowerSaving,
      appTheme, setAppTheme,
      isOnline, setIsOnline,
      shopName, setShopName,
      shopAddress, setShopAddress,
      promptPayId, setPromptPayId,
      user, setUser
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}

export function CalculatorProvider({ children }) {
  const [sharedBTU, setSharedBTU] = useState(null)
  const [scannedJobData, setScannedJobData] = useState(null)

  return (
    <CalculatorContext.Provider value={{
      sharedBTU, setSharedBTU,
      scannedJobData, setScannedJobData
    }}>
      {children}
    </CalculatorContext.Provider>
  )
}

export function useCalculator() {
  return useContext(CalculatorContext)
}

// ─── OFFLINE QUEUE UTILS ─────────────────────────────────────────────────────
const QUEUE_KEY = 'abp_offline_queue'

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch { return [] }
}

function enqueue(record) {
  const queue = getQueue()
  const item = { ...record, _queuedAt: Date.now(), _id: crypto.randomUUID() }
  queue.push(item)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return item
}

function dequeue(id) {
  const queue = getQueue().filter(item => item._id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

async function syncQueue(onProgress) {
  if (!supabase) return { synced: 0, failed: 0 }
  const queue = getQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of queue) {
    const { _id, _queuedAt, ...record } = item
    let supabaseSuccess = false

    try {
      const { lat, lon, ...rest } = record
      const supabaseRecord = {
        date: rest.created_at || new Date().toISOString(),
        customer_name: rest.customer || '',
        customer_phone: rest.phone || '',
        customer_address: rest.location || '',
        symptoms: rest.notes || '',
        ac_model: `${rest.brand || ''} ${rest.model || ''} ${rest.serialNo ? '(SN:'+rest.serialNo+')' : ''}`.trim(),
        repair_details: JSON.stringify({
          lowBefore: rest.lowBefore,
          highBefore: rest.highBefore,
          lowAfter: rest.lowAfter,
          highAfter: rest.highAfter,
          current: rest.current,
          refrigerant: rest.refrigerant,
          btu: rest.btu,
          unit: rest.unit,
          lat, lon
        }),
        cost: parseFloat(rest.laborFee || 0) + parseFloat(rest.materialFee || 0) - parseFloat(rest.discount || 0),
        status: 'completed',
        technician_id: rest.tech_id || null
      }
      
      const { error } = await supabase.from('job_records').insert(supabaseRecord)
      if (!error) supabaseSuccess = true
    } catch (err) {
      console.error('Offline sync to Supabase failed:', err)
    }

    if (supabaseSuccess) {
      dequeue(_id)
      synced++
      onProgress?.({ synced, failed, total: queue.length })
    } else {
      failed++
    }
  }

  return { synced, failed }
}

async function saveJob(record, isOnline) {
  const normalizedRecord = {
    ...record,
    phone: formatPhoneOrPromptPay(record.phone)
  }

  if (!isOnline || !supabase) {
    enqueue(normalizedRecord)
    return { saved: 'offline' }
  }

  let supabaseSaved = false
  let action = 'inserted'

  try {
    const { lat, lon, ...rest } = normalizedRecord
    const supabaseRecord = {
      date: rest.created_at || new Date().toISOString(),
      customer_name: rest.customer || '',
      customer_phone: rest.phone || '',
      customer_address: rest.location || '',
      symptoms: rest.notes || '',
      ac_model: `${rest.brand || ''} ${rest.model || ''} ${rest.serialNo ? '(SN:'+rest.serialNo+')' : ''}`.trim(),
      repair_details: JSON.stringify({
        lowBefore: rest.lowBefore,
        highBefore: rest.highBefore,
        lowAfter: rest.lowAfter,
        highAfter: rest.highAfter,
        current: rest.current,
        refrigerant: rest.refrigerant,
        btu: rest.btu,
        unit: rest.unit,
        lat, lon
      }),
      cost: parseFloat(rest.laborFee || 0) + parseFloat(rest.materialFee || 0) - parseFloat(rest.discount || 0),
      status: 'completed',
      technician_id: rest.tech_id || null
    }
    
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data: candidates, error: searchError } = await supabase
      .from('job_records')
      .select('id, customer_name, customer_phone, ac_model')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())

    const match = !searchError && candidates && candidates.find(c => {
      const sameCustomer = (c.customer_name && c.customer_name.toString().trim() === rest.customer.toString().trim()) || 
                           (c.customer_phone && c.customer_phone.toString().trim() === rest.phone.toString().trim());
      const hasSerial = rest.serialNo && c.ac_model && c.ac_model.includes(`SN:${rest.serialNo}`);
      const bothEmptySerial = !rest.serialNo && c.ac_model && !c.ac_model.includes('SN:');
      const sameSerial = hasSerial || bothEmptySerial;
      return sameCustomer && sameSerial;
    })

    if (match) {
      const { error: updateError } = await supabase
        .from('job_records')
        .update(supabaseRecord)
        .eq('id', match.id)
      
      if (!updateError) {
        supabaseSaved = true
        action = 'updated'
      }
    } else {
      const { error: insertError } = await supabase
        .from('job_records')
        .insert(supabaseRecord)
      
      if (!insertError) {
        supabaseSaved = true
      }
    }
  } catch (err) {
    console.error('Failed to save to Supabase:', err)
  }

  if (supabaseSaved) {
    return { saved: 'online', action }
  } else {
    enqueue(normalizedRecord)
    return { saved: 'offline' }
  }
}

async function fetchAllJobs(user) {
  const localJobs = JSON.parse(localStorage.getItem('abp_local_jobs') || '[]')
  
  let onlineJobs = []

    if (supabase) {
      try {
        let query = supabase.from('job_records').select('*, profiles(name)')
        // If not admin, only fetch own jobs
        if (user && user.role !== 'admin' && user.user_id) {
          query = query.eq('technician_id', user.user_id)
        }
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(100)
          
        if (error) throw error
        
        if (data) {
          onlineJobs = data.map(job => {
            let extra = {}
            if (job.repair_details) {
              try {
                extra = JSON.parse(job.repair_details)
              } catch (e) {
                console.warn('Failed to parse repair_details', e)
              }
            }
            
            let brand = ''
            let model = ''
            let serialNo = ''
            
            if (job.ac_model) {
              const parts = job.ac_model.split(' (SN:')
              if (parts.length > 1) {
                serialNo = parts[1].replace(')', '')
                const bm = parts[0].trim().split(' ')
                brand = bm[0] || ''
                model = bm.slice(1).join(' ')
              } else {
                const bm = job.ac_model.trim().split(' ')
                brand = bm[0] || ''
                model = bm.slice(1).join(' ')
              }
            }
  
            return {
              id: job.id,
              created_at: job.date || job.created_at,
              customer: job.customer_name,
              phone: job.customer_phone,
              location: job.customer_address,
              notes: job.symptoms,
              brand: brand,
              model: model,
              serialNo: serialNo,
              laborFee: job.cost,
              materialFee: 0,
              discount: 0,
              tech_id: job.technician_id,
              tech_name: job.profiles?.name || 'ช่างไม่ระบุชื่อ',
              ...extra
            }
          })
        }
    } catch (err) {
      console.error('Failed to fetch jobs from Supabase:', err)
    }
  }

  const formattedOnline = onlineJobs.map(j => ({ ...j, phone: formatPhoneOrPromptPay(j.phone) }))
  const formattedLocal = localJobs.map(j => ({ ...j, phone: formatPhoneOrPromptPay(j.phone) }))
  return [...formattedOnline, ...formattedLocal]
}

function saveJobLocally(record) {
  try {
    const normalizedRecord = {
      ...record,
      phone: formatPhoneOrPromptPay(record.phone)
    }
    const jobs = JSON.parse(localStorage.getItem('abp_local_jobs') || '[]')
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const existingIndex = jobs.findIndex(j => {
      const jobDate = new Date(j.created_at)
      const isToday = jobDate >= todayStart
      const matchesSerial = j.serialNo && j.serialNo.toString().trim() === normalizedRecord.serialNo.toString().trim()
      const matchesCustomerOrPhone = 
        (j.customer && j.customer.toString().trim() === normalizedRecord.customer.toString().trim()) || 
        (j.phone && j.phone.toString().trim() === normalizedRecord.phone.toString().trim())
      return isToday && matchesSerial && matchesCustomerOrPhone
    })

    let action = 'inserted'
    if (existingIndex > -1) {
      jobs[existingIndex] = { ...jobs[existingIndex], ...normalizedRecord, updated_at: new Date().toISOString() }
      action = 'updated'
    } else {
      const newJob = { ...normalizedRecord, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      jobs.unshift(newJob)
    }
    localStorage.setItem('abp_local_jobs', JSON.stringify(jobs.slice(0, 100)))
    return action
  } catch (err) {
    console.error('Failed to save job locally:', err)
    return 'inserted'
  }
}

const BOOKMARKS_KEY = 'abp_recent_docs'
const EMPTY_FORM = {
  customer: '', phone: '', location: '', model: '', brand: '',
  refrigerant: 'R32', serialNo: '',
  lowBefore: '', highBefore: '', lowAfter: '', highAfter: '',
  current: '', notes: '',
  lat: '', lon: '',
  laborFee: '', materialFee: '', discount: '',
}

function generateLINEReport({ form, sharedBTU, unitSystem }) {
  const lowBeforeVal = parseFloat(form.lowBefore)
  const lowAfterVal = parseFloat(form.lowAfter)
  const highBeforeVal = parseFloat(form.highBefore)
  const highAfterVal = parseFloat(form.highAfter)

  const hasLowDiff = !isNaN(lowBeforeVal) && !isNaN(lowAfterVal)
  const hasHighDiff = !isNaN(highBeforeVal) && !isNaN(highAfterVal)

  const lowDiff = hasLowDiff ? (lowAfterVal - lowBeforeVal) : null
  const highDiff = hasHighDiff ? (highAfterVal - highBeforeVal) : null

  let diffParts = []
  if (lowDiff !== null) diffParts.push(`Low: ${lowDiff >= 0 ? '+' : ''}${lowDiff.toFixed(1)}`)
  if (highDiff !== null) diffParts.push(`High: ${highDiff >= 0 ? '+' : ''}${highDiff.toFixed(1)}`)
  const calculatedDiff = diffParts.length > 0 ? `${diffParts.join(' / ')}` : '-'
  const diffUnit = diffParts.length > 0 ? ` ${unitSystem}` : ''

  return `----------------------------------------
🛠️ **รายงานการตรวจเช็คเครื่องปรับอากาศ (Air Buddy Pro)**
----------------------------------------
👤 **ลูกค้า:** ${form.customer || '-'} | 📞 ${form.phone || '-'}
❄️ **เครื่อง:** ${form.brand || '-'} - ${form.model || '-'} (${form.serialNo || '-'})
🧪 **น้ำยา:** ${form.refrigerant || '-'}
⚡ **กระแสไฟ:** ${form.current || '-'} A
📊 **ความดันน้ำยาแอร์:**
  • ก่อนบริการ: ${form.lowBefore || '-'} / ${form.highBefore || '-'} ${unitSystem}
  • หลังบริการ: ${form.lowAfter || '-'} / ${form.highAfter || '-'} ${unitSystem}
  • ส่วนต่าง: ${calculatedDiff}${diffUnit}
📝 **บันทึกช่าง:** ${form.notes || '-'}
----------------------------------------
ขอบคุณที่ใช้บริการครับ 🙏`
}

// ─── PROMPTPAY QR GENERATOR & THAI FONT LOADER FOR INVOICE PDF ───────────────
function crc16ccitt(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePromptPayQR(target, amount) {
  const normalizedTarget = formatPhoneOrPromptPay(target);
  let sanitized = (normalizedTarget || '').toString().replace(/\D/g, '');
  if (!sanitized) return '';

  let targetType = '';
  let formattedTarget = '';

  if (sanitized.length === 10) {
    formattedTarget = '0066' + sanitized.substring(1);
    targetType = '01';
  } else if (sanitized.length === 13) {
    formattedTarget = sanitized;
    targetType = '02';
  } else {
    formattedTarget = sanitized;
    targetType = '01';
  }

  let amountStr = '';
  if (amount !== undefined && amount !== null && amount > 0) {
    const fixedAmount = Number(amount).toFixed(2);
    amountStr = '54' + fixedAmount.length.toString().padStart(2, '0') + fixedAmount;
  }

  const aid = 'A000000677010111';
  const aidTLV = '00' + aid.length.toString().padStart(2, '0') + aid;
  const targetTLV = targetType + formattedTarget.length.toString().padStart(2, '0') + formattedTarget;
  const merchantAccountInfoValue = aidTLV + targetTLV;
  const merchantAccountInfo = '29' + merchantAccountInfoValue.length.toString().padStart(2, '0') + merchantAccountInfoValue;

  let payload = '000201' +
                (amountStr ? '010212' : '010211') +
                merchantAccountInfo +
                '5303764' +
                amountStr +
                '5802TH' +
                '6304';

  const crc = crc16ccitt(payload);
  return payload + crc;
}

let cachedSarabunRegular = null;
let cachedSarabunBold = null;

async function loadSarabunFonts() {
  if (cachedSarabunRegular && cachedSarabunBold) {
    return { regular: cachedSarabunRegular, bold: cachedSarabunBold };
  }

  const [regRes, boldRes] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/sarabun/v17/DtVjJx26TKEr37c9WBI.ttf'),
    fetch('https://fonts.gstatic.com/s/sarabun/v17/DtVmJx26TKEr37c9YK5sulw.ttf')
  ]);

  if (!regRes.ok || !boldRes.ok) {
    throw new Error('Failed to fetch Sarabun font files from Google CDN.');
  }

  const [regBuffer, boldBuffer] = await Promise.all([
    regRes.arrayBuffer(),
    boldRes.arrayBuffer()
  ]);

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  cachedSarabunRegular = arrayBufferToBase64(regBuffer);
  cachedSarabunBold = arrayBufferToBase64(boldBuffer);

  return { regular: cachedSarabunRegular, bold: cachedSarabunBold };
}

// 0. Combined Calculator Wizard Tab Component
function CombinedCalculatorPanel() {
  const [calcMode, setCalcMode] = useState('btu') // 'btu' or 'electrical'
  
  return (
    <div className="space-y-6">
      {/* Wizard Step Toggle Switcher Header */}
      <div className="p-4 md:p-6 pb-0 md:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Wind size={24} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ระบบคำนวณช่างแอร์</h1>
            <p className="text-xs text-slate-400 mt-0.5">คำนวณ BTU และสเปคระบบไฟฟ้า (เบรกเกอร์/สายไฟ)</p>
          </div>
        </div>

        {/* Seamless Toggle / Step Wizard */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shadow-inner">
          <button 
            type="button"
            onClick={() => setCalcMode('btu')}
            className={`py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              calcMode === 'btu' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind size={16} />
            <span>1. คำนวณ BTU</span>
          </button>
          <button 
            type="button"
            onClick={() => setCalcMode('electrical')}
            className={`py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              calcMode === 'electrical' 
                ? 'bg-yellow-500 text-slate-955 shadow-md font-black' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={16} />
            <span>2. ระบบไฟฟ้า</span>
          </button>
        </div>
      </div>

      {calcMode === 'btu' ? (
        <BTUCalculatorPanel onNavigate={() => setCalcMode('electrical')} />
      ) : (
        <ElectricalCalculatorPanel />
      )}
    </div>
  )
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

// 1. BTU Calculator Tab Component
function BTUCalculatorPanel({ onNavigate }) {
  const { setSharedBTU } = useCalculator()
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [height, setHeight] = useState('')
  const [roomTypeIdx, setRoomTypeIdx] = useState(0)
  const [sunlight, setSunlight] = useState(false)
  const [result, setResult] = useState(null)

  const isWidthWarning = width && parseFloat(width) > 50
  const isLengthWarning = length && parseFloat(length) > 50
  const isHeightWarning = height && parseFloat(height) > 10

  const findNearestSizes = (btu) => {
    const sorted = [...STANDARD_SIZES]
    const above = sorted.filter(s => s >= btu)
    const below = sorted.filter(s => s < btu)
    const res = []
    if (above.length > 0) res.push(above[0])
    if (above.length > 1) res.push(above[1])
    if (res.length < 2 && below.length > 0) res.unshift(below[below.length - 1])
    return res
  }

  const calculate = () => {
    const w = parseFloat(width)
    const l = parseFloat(length)
    const h = parseFloat(height) || 3.0
    if (!w || !l || w <= 0 || l <= 0) return

    const baseFactor = ROOM_TYPES[roomTypeIdx].factor + (sunlight ? 100 : 0)
    let btu = w * l * baseFactor
    if (h > 3.0) btu = btu * (h / 3.0)
    btu = Math.round(btu)

    setResult({
      btu,
      area: w * l,
      factor: baseFactor,
      height: h,
      sizes: findNearestSizes(btu),
    })
  }

  const handleUseSize = (size) => {
    setSharedBTU(size)
    onNavigate(1) // Switch to Electrical tab
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <Wind size={24} className="text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">คำนวณขนาดแอร์</h1>
          <p className="text-sm text-slate-400">ระบบคำนวณ BTU ตามลักษณะห้องและฝ้าเพดาน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input area */}
        <div className="card p-5 space-y-5">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ระบุข้อมูลพื้นที่งาน</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">กว้าง (ม.)</label>
              <input
                id="btu-width"
                type="number"
                inputMode="decimal"
                placeholder="3.0"
                value={width}
                onChange={e => setWidth(e.target.value)}
                className={`input-field text-center text-lg font-bold ${isWidthWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
              />
              {isWidthWarning && (
                <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight text-center">
                  ⚠️ กว้างผิดปกติ (&gt; 50 ม.)
                </span>
              )}
            </div>
            <div>
              <label className="label">ยาว (ม.)</label>
              <input
                id="btu-length"
                type="number"
                inputMode="decimal"
                placeholder="4.0"
                value={length}
                onChange={e => setLength(e.target.value)}
                className={`input-field text-center text-lg font-bold ${isLengthWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
              />
              {isLengthWarning && (
                <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight text-center">
                  ⚠️ ยาวผิดปกติ (&gt; 50 ม.)
                </span>
              )}
            </div>
            <div>
              <label className="label">สูงฝ้า (ม.)</label>
              <input
                id="btu-height"
                type="number"
                inputMode="decimal"
                placeholder="3.0"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className={`input-field text-center text-lg font-bold ${isHeightWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
              />
              {isHeightWarning && (
                <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight text-center">
                  ⚠️ สูงผิดปกติ (&gt; 10 ม.)
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="label">ประเภทการใช้งานห้อง</label>
            <select
              id="btu-roomtype"
              value={roomTypeIdx}
              onChange={e => setRoomTypeIdx(Number(e.target.value))}
              className="input-field text-base font-semibold"
            >
              {ROOM_TYPES.map((rt, i) => (
                <option key={i} value={i}>
                  {rt.label} (Factor: {rt.factor})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSunlight(p => !p)}
            className={`flex items-center gap-3 w-full p-4 rounded-xl border transition-all duration-200 tap-target
              ${sunlight
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-slate-800/60 border-slate-700'
              }`}
          >
            <div className={`toggle-track ${sunlight ? 'on' : ''}`}>
              <div className="toggle-thumb" />
            </div>
            <div className="text-left flex-1">
              <p className={`text-base font-bold ${sunlight ? 'text-amber-400' : 'text-slate-300'}`}>
                ห้องโดนแดดบ่าย / ทิศตะวันตก
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {sunlight ? '+100 BTU factor เพิ่มเติม' : 'ไม่โดนแดดสะสมช่วงบ่าย'}
              </p>
            </div>
            <Sun size={20} className={sunlight ? 'text-amber-400' : 'text-slate-600'} />
          </button>

          <button id="btu-calculate" onClick={calculate} className="btn-primary">
            <Wind size={20} />
            คำนวณ BTU สุทธิ
          </button>
        </div>

        {/* Results area */}
        <div>
          {result ? (
            <div className="card-highlight p-5 space-y-4 animate-fadeInDown">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-sky-400" />
                <h3 className="font-bold text-sky-400 text-sm uppercase tracking-wider">ผลวิเคราะห์พลังงานแอร์</h3>
              </div>

              <div className="text-center py-4 bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-slate-200 text-sm mb-1 font-bold">ขนาดความเย็นที่ต้องการจริง</p>
                <p className="mono text-5xl font-black text-white">
                  {result.btu.toLocaleString()}
                </p>
                <p className="text-sky-300 font-extrabold text-lg mt-1">BTU / ชั่วโมง</p>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-4 space-y-2 text-base font-semibold">
                <div className="flex justify-between text-slate-200 font-bold">
                  <span>คำนวณขนาดพื้นที่ห้อง</span>
                  <span className="mono text-white">{result.area.toFixed(2)} ตร.ม.</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold">
                  <span>ตัวคูณความร้อนสะสม (Factor)</span>
                  <span className="mono text-white">{result.factor}</span>
                </div>
                {result.height > 3.0 && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>เพดานสูง ({result.height} ม.) ตัวคูณชดเชย</span>
                    <span className="mono">×{(result.height / 3.0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-200 font-bold uppercase tracking-wider">
                  ขนาดเครื่องที่แนะนำให้ติดตั้งหน้างาน
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {result.sizes.map((size, i) => (
                    <div key={size} className={`flex items-center justify-between p-4 rounded-xl
                      ${i === 0
                        ? 'bg-sky-500/10 border border-sky-500/40 shadow-inner'
                        : 'bg-slate-800/80 border border-slate-700'}`}
                    >
                      <div>
                        <span className="mono font-black text-white text-xl">
                          {size.toLocaleString()}
                        </span>
                        <span className="text-sm ml-1.5 text-slate-200 font-bold">BTU</span>
                        {i === 0 && (
                          <span className="ml-2 badge badge-blue text-[10px]">ชดเชยที่เหมาะสม</span>
                        )}
                      </div>
                      <button
                        id={`btu-use-${size}`}
                        onClick={() => handleUseSize(size)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all tap-target
                          ${i === 0
                            ? 'bg-sky-500 text-white active:bg-sky-600'
                            : 'bg-slate-700 text-slate-100 active:bg-slate-600'}`}
                      >
                        ใช้ขนาดนี้
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-500 space-y-3">
              <Wind size={48} className="mx-auto text-slate-700 animate-pulse-slow" />
              <p className="font-semibold text-base">กรอกข้อมูลพื้นที่ทางซ้ายและกดคำนวณเพื่อจำลองผลลัพธ์</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 2. Electrical Calculator Tab Component
function ElectricalCalculatorPanel() {
  const { sharedBTU } = useCalculator()
  const [selectedBTU, setSelectedBTU] = useState('')
  const [result, setResult] = useState(null)

  const runningAmpsVal = parseFloat(selectedBTU) / (11 * 220) || 0
  const isElecAmpWarning = runningAmpsVal > 100

  const getWireSize = (amps) => {
    if (amps <= 6) return { main: '1.5', desc: 'IEC 01 (THW) / IEC 10 (VAF) 1.5 sq.mm' }
    if (amps <= 11) return { main: '2.5', desc: 'IEC 01 (THW) / IEC 10 (VAF) 2.5 sq.mm' }
    if (amps <= 15) return { main: '4.0', desc: 'IEC 01 (THW) / IEC 10 (VAF) 4.0 sq.mm' }
    if (amps <= 20) return { main: '6.0', desc: 'IEC 01 (THW) / IEC 10 (VAF) 6.0 sq.mm' }
    return { main: '10.0', desc: 'IEC 01 (THW) / IEC 10 (VAF) 10.0 sq.mm' }
  }

  const getBreakerSize = (amps) => {
    const required = amps * 1.25
    const THAI_BREAKER_SIZES = [10, 16, 20, 25, 32]
    const found = THAI_BREAKER_SIZES.find(b => b >= required)
    return found || 32
  }

  const calcElectrical = (btu) => {
    if (!btu) return null
    const runningAmps = btu / (11 * 220)
    const breakerSize = getBreakerSize(runningAmps)
    const wire = getWireSize(runningAmps)
    return {
      runningAmps: runningAmps.toFixed(2),
      breakerSize,
      wire,
      groundWire: '1.5 sq.mm (ขั้นต่ำตาม วสท.)',
      safetyAmps: (runningAmps * 1.25).toFixed(2),
    }
  }

  useEffect(() => {
    if (sharedBTU) {
      setSelectedBTU(String(sharedBTU))
    }
  }, [sharedBTU])

  useEffect(() => {
    const btu = parseFloat(selectedBTU)
    if (btu > 0) {
      setResult(calcElectrical(btu))
    } else {
      setResult(null)
    }
  }, [selectedBTU])

  const fromBTUCalc = sharedBTU && String(sharedBTU) === selectedBTU

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Zap size={24} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">ระบบคำนวณเบรกเกอร์ & สายไฟ</h1>
          <p className="text-sm text-slate-400">คำนวณขนาดตามมาตรฐานการติดตั้งทางวิศวกรรมไฟฟ้าของไทย</p>
        </div>
      </div>

      {fromBTUCalc && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-sky-500/10 border border-sky-500/30 rounded-xl animate-fadeInDown">
          <CheckCircle size={16} className="text-sky-400" />
          <p className="text-sm text-sky-400 font-bold">
            ได้รับข้อมูลขนาดแอร์อัตโนมัติ: {Number(sharedBTU).toLocaleString()} BTU
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column Input */}
        <div className="card p-5 space-y-5">
          <div>
            <label className="label text-slate-200">กรอกขนาด BTU แอร์ (หรือเลือกปุ่มลัด)</label>
            <input
              id="elec-btu-input"
              type="number"
              inputMode="decimal"
              placeholder="เช่น 18000"
              value={selectedBTU}
              onChange={e => setSelectedBTU(e.target.value)}
              className={`input-field text-center text-2xl font-black mono ${isElecAmpWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
            />
            {isElecAmpWarning && (
              <span className="text-[10px] text-amber-400 font-bold block mt-1.5 leading-tight">
                ⚠️ กระแสไฟฟ้าคำนวณได้ ({runningAmpsVal.toFixed(1)}A) เกิน 100A สำหรับไฟบ้าน 1 เฟสทั่วไป (แนะนำใช้ระบบไฟ 3 เฟส)
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="label text-center text-slate-200">ปุ่มลัดขนาดบีทียูมาตรฐานทั่วไป</label>
            <div className="grid grid-cols-3 gap-2">
              {STANDARD_SIZES.map(btu => (
                <button
                  key={btu}
                  id={`elec-btu-${btu}`}
                  onClick={() => setSelectedBTU(String(btu))}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border tap-target
                    ${selectedBTU === String(btu)
                      ? 'bg-yellow-500/25 border-yellow-500/50 text-amber-400 font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'}`}
                >
                  <span className="mono">{(btu / 1000).toFixed(0)}K</span>
                  <br />
                  <span className="text-[10px] opacity-70">BTU</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Output */}
        <div>
          {result ? (
            <div className="space-y-4">
              <div className="card-highlight p-5 space-y-4 animate-fadeInDown">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-yellow-400" />
                  <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wider">
                    สรุปข้อกำหนดงานติดตั้งไฟฟ้า
                  </h3>
                </div>

                <div className="space-y-1">
                  {[
                    { label: 'กระแสไฟฟ้าแอร์ขณะทำงาน', sub: 'Running Current', val: `${result.runningAmps} Amps`, color: 'text-sky-300', icon: '⚡' },
                    { label: 'ขนาดพิกัดเบรกเกอร์ (CB)', sub: `คำนวณจริง 1.25x = ${result.safetyAmps}A`, val: `${result.breakerSize} A`, color: 'text-amber-400', icon: '🔌' },
                    { label: 'ขนาดสายไฟหลักขั้นต่ำ', sub: 'ทองแดงแกนเดี่ยว THW / VAF', val: `${result.wire.main} sq.mm`, color: 'text-emerald-400', icon: '🔶' },
                    { label: 'ขนาดสายดินหลักดิน', sub: 'ตามมาตรฐาน วสท. ขั้นต่ำสุด', val: '1.5 sq.mm', color: 'text-emerald-400', icon: '🟢' }
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0 font-bold">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{row.icon}</span>
                        <div>
                          <p className="text-xs text-slate-100 font-bold uppercase tracking-wider">{row.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">{row.sub}</p>
                        </div>
                      </div>
                      <p className={`mono font-black text-xl ${row.color}`}>{row.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
                <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed font-semibold">
                  * หมายเหตุ: อิงตามค่าสัมประสิทธิ์ความปลอดภัย 1.25 เท่าของพิกัดกระแส ในการเลือกขนาดอุปกรณ์ป้องกัน (มาตรฐาน วสท.) หากเดินสายในรางแอร์ยาวหรือมีสภาพแวดล้อมร้อนเป็นพิเศษ ควรขยับขนาดสายดินเพิ่มเติม
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-500 space-y-3">
              <Zap size={48} className="mx-auto text-slate-700 animate-pulse-slow" />
              <p className="font-semibold text-base">เลือกบีทียูหรือกรอกขนาดเพื่อสรุปเบรกเกอร์และสายไฟ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 3. Diagnostic Tab Component
function DiagnosticPanel() {
  const { appTheme } = useApp()
  const [subTab, setSubTab] = useState(0)

  // Subtab A: Checklist state
  const [symptom, setSymptom] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState('q1')
  const [results, setResults] = useState(null)

  // Subtab B: Error Finder state
  const [brand, setBrand] = useState('Daikin')
  const [search, setSearch] = useState('')
  const [expandedCode, setExpandedCode] = useState(null)

  // Question history stack for back navigation
  const [questionHistory, setQuestionHistory] = useState([])

  // AI Smart Search state
  const [isAiMode, setIsAiMode] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiHistory, setAiHistory] = useState([])

  const handleAiSearch = async (e) => {
    if (e) e.preventDefault()
    if (!aiQuery.trim() || isAiLoading) return

    setIsAiLoading(true)
    setAiResponse('')

    const brandContext = brand ? `แบรนด์เครื่องปรับอากาศ: ${brand}` : ''

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('ไม่พบ Gemini API Key ในระบบ กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env.local')
      }

      const data = await (async () => {
        const models = ['gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash']
        const systemPrompt = `คุณคือ "Air Buddy Pro AI" ผู้ช่วยช่างแอร์อัจฉริยะและผู้เชี่ยวชาญด้านระบบปรับอากาศ (Air Conditioning Specialist) ในไทย
หน้าที่ของคุณคือ:
1. ตอบคำถามเกี่ยวกับการวิเคราะห์อาการเสีย รหัสเออร์เรอร์โค้ด (Error Code) และแนวทางแก้ไขปัญหาเกี่ยวกับเครื่องปรับอากาศทุกแบรนด์ (เช่น Daikin, Mitsubishi, LG, Carrier, Panasonic เป็นต้น)
2. อธิบายขั้นตอนการตรวจเช็คทางเทคนิค (เช่น การวัดกระแสไฟฟ้า การวัดแรงดันน้ำยา การตรวจสอบสัญญาณสื่อสาร) อย่างเป็นลำดับขั้นตอน 1, 2, 3 ชัดเจนและเข้าใจง่าย
3. ใช้ภาษาไทยที่เป็นกันเองแบบมืออาชีพ สุภาพ เหมาะสมกับช่างเทคนิคภาคสนาม
4. หากผู้ใช้ระบุแบรนด์แอร์ ให้ใช้ความรู้เฉพาะของแบรนด์นั้นๆ ในการตอบ
5. หลีกเลี่ยงข้อความที่ยาวเกินไป ให้เน้นเนื้อหาที่เป็นขั้นตอนปฏิบัติจริง (Actionable Steps)
6. หากแอร์มีอันตราย (เช่น แรงดันสูง, สารทำความเย็นไวไฟ R32, หรือเกี่ยวข้องกับกระแสไฟฟ้าสูง) ให้มีคำเตือนเรื่องความปลอดภัยสั้นๆ เสมอ`
        const userPrompt = `คำถาม: ${aiQuery} ${brandContext ? `(${brandContext})` : ''}`
        let lastError = null

        for (const model of models) {
          try {
            console.log(`Trying Gemini model: ${model}`)
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: userPrompt }
                    ]
                  }
                ],
                systemInstruction: {
                  parts: [
                    { text: systemPrompt }
                  ]
                },
                generationConfig: {
                  temperature: 0.7
                }
              })
            })

            const resData = await res.json()
            if (!res.ok) {
              const errMsg = resData.error?.message || `HTTP ${res.status}`
              console.warn(`Model ${model} failed: ${errMsg}`)
              lastError = new Error(`Gemini API Error (${model}): ${errMsg}`)
              continue
            }

            return resData
          } catch (err) {
            console.warn(`Fetch error for model ${model}:`, err)
            lastError = err
          }
        }
        throw lastError || new Error('ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้')
      })()

      if (!data || !data.candidates || !data.candidates[0]) {
        throw new Error(`Invalid response format from AI: ${JSON.stringify(data)}`)
      }

      const reply = data.candidates[0].content?.parts[0]?.text || 'ไม่พบคำตอบจาก AI'
      setAiResponse(reply)
      setAiHistory(prev => [{ query: aiQuery, response: reply, brand: brand }, ...prev].slice(0, 5))
    } catch (err) {
      console.error(err)
      setAiResponse(`❌ เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setIsAiLoading(false)
    }
  }

  const renderFormattedAiResponse = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      if (line.trim().startsWith('###')) {
        return (
          <h4 key={idx} className="text-xs font-black text-white mt-3 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {line.replace(/###\s*/, '').replace(/\*\*/g, '')}
          </h4>
        )
      }
      if (line.trim().startsWith('##')) {
        return (
          <h3 key={idx} className="text-sm font-black text-white mt-4 mb-2 border-b border-slate-800 pb-1">
            {line.replace(/##\s*/, '').replace(/\*\*/g, '')}
          </h3>
        )
      }
      if (line.trim().startsWith('#')) {
        return (
          <h2 key={idx} className="text-base font-black text-white mt-4 mb-2">
            {line.replace(/#\s*/, '').replace(/\*\*/g, '')}
          </h2>
        )
      }
      
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*')
      const isNumbered = /^\d+\./.test(line.trim())
      
      if (isBullet) {
        return (
          <div key={idx} className="flex gap-2 text-slate-300 ml-2 py-0.5 font-semibold">
            <span className="text-red-400 flex-shrink-0 mt-1">•</span>
            <span>{line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')}</span>
          </div>
        )
      }
      
      if (isNumbered) {
        const match = line.trim().match(/^(\d+)\.\s*(.*)/)
        if (match) {
          return (
            <div key={idx} className="flex gap-2 text-slate-300 ml-2 py-0.5 font-semibold">
              <span className="text-red-400 font-bold flex-shrink-0">{match[1]}.</span>
              <span>{match[2].replace(/\*\*/g, '')}</span>
            </div>
          )
        }
      }
      
      if (line.includes('**')) {
        const parts = line.split('**')
        return (
          <p key={idx} className="min-h-[1rem]">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-black text-white">{part}</strong> : part)}
          </p>
        )
      }
      
      return <p key={idx} className="min-h-[1rem]">{line}</p>
    })
  }

  const handleSymptom = (id) => {
    setSymptom(id)
    setAnswers({})
    setCurrentQ('q1')
    setResults(null)
    setQuestionHistory([])
  }

  const handleAnswer = (option) => {
    const newAnswers = { ...answers, [currentQ]: option.label }
    setAnswers(newAnswers)
    if (option.results) {
      setQuestionHistory(prev => [...prev, { q: currentQ, answers: answers, results: null }])
      setResults(option.results)
    } else if (option.next) {
      setQuestionHistory(prev => [...prev, { q: currentQ, answers: answers, results: null }])
      setCurrentQ(option.next)
    }
  }

  const handleBack = () => {
    if (results) {
      const prev = questionHistory[questionHistory.length - 1]
      if (prev) {
        setResults(null)
        setCurrentQ(prev.q)
        setAnswers(prev.answers)
        setQuestionHistory(h => h.slice(0, -1))
      }
      return
    }
    if (questionHistory.length === 0) {
      resetChecklist()
      return
    }
    const prev = questionHistory[questionHistory.length - 1]
    setResults(null)
    setCurrentQ(prev.q)
    setAnswers(prev.answers)
    setQuestionHistory(h => h.slice(0, -1))
  }

  const resetChecklist = () => {
    setSymptom(null)
    setAnswers({})
    setCurrentQ('q1')
    setResults(null)
    setQuestionHistory([])
  }

  const currentTree = symptom ? diagnosticTree.find(s => s.id === symptom) : null
  const currentQuestion = currentTree?.questions.find(q => q.id === currentQ)

  const codes = errorCodes[brand] || []
  const filteredCodes = codes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.cause.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Stethoscope size={24} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">ค้นหาเออร์เรอร์โค้ด & วินิจฉัย</h1>
          <p className="text-sm text-slate-400">ค้นหาอาการเสียทางเทคนิคอย่างรวดเร็วภาคสนาม</p>
        </div>
      </div>

      {/* Main container with side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Diagnostic Flow */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>🩺</span> วินิจฉัยอาการทีละขั้นตอน
          </h2>

          {!symptom && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">เลือกอาการหลักที่พบบนเครื่องลูกค้า</p>
              {diagnosticTree.map(s => (
                <button
                  key={s.id}
                  id={`diag-symptom-${s.id}`}
                  onClick={() => handleSymptom(s.id)}
                  className="w-full flex items-center justify-between p-4 card hover:bg-slate-800/80 active:bg-slate-700 transition-all border border-slate-800 hover:border-slate-700 text-left tap-target"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="font-bold text-white text-base leading-snug">{s.label}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {symptom && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{diagnosticTree.find(s => s.id === symptom)?.icon}</span>
                  <p className="text-base font-black text-white">
                    {diagnosticTree.find(s => s.id === symptom)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(questionHistory.length > 0 || results) && (
                    <button onClick={handleBack} className="flex items-center gap-1 text-xs text-amber-400 active:text-white font-bold px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                      <ChevronLeft size={13} />
                      ย้อนกลับ
                    </button>
                  )}
                  <button onClick={resetChecklist} className="flex items-center gap-1.5 text-xs text-slate-400 active:text-white font-bold">
                    <RotateCcw size={13} />
                    เริ่มใหม่
                  </button>
                </div>
              </div>

              {Object.keys(answers).length > 0 && (
                <div className="bg-slate-900/60 rounded-xl p-3.5 space-y-1.5 border border-slate-800">
                  {Object.entries(answers).map(([q, a]) => (
                    <div key={q} className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion && !results && (
                <div className="card-highlight p-4 space-y-3.5 animate-fadeInDown">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="font-bold text-white leading-relaxed text-base">{currentQuestion.text}</p>
                  </div>
                  <div className="space-y-2">
                    {currentQuestion.options.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => handleAnswer(opt)}
                        className="w-full text-left px-4 py-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700
                          active:bg-sky-500/20 active:border-sky-500/50 transition-all text-sm font-bold text-slate-200 tap-target"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results && (
                <div className="space-y-3.5 animate-fadeInDown">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider">📊 อัตราความเป็นไปได้สูงสุด</p>
                  {results.map((r, i) => (
                    <div key={i} className="card p-4 space-y-2 border border-slate-800">
                      <p className="font-black text-white text-base leading-snug">{r.text}</p>
                      
                      {/* Custom Probability Slider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${r.probability}%`,
                              background: r.probability >= 70 ? '#f87171' : r.probability >= 40 ? '#fb923c' : '#4ade80',
                            }}
                          />
                        </div>
                        <span className="mono text-xs font-black" style={{ color: r.probability >= 70 ? '#f87171' : r.probability >= 40 ? '#fb923c' : '#4ade80' }}>
                          {r.probability}%
                        </span>
                      </div>

                      <div className="pt-2.5 border-t border-slate-800 mt-2">
                        <p className="text-xs font-bold text-sky-400 mb-1">🔧 ขั้นตอน/แนวทางแก้ไขทางเทคนิค</p>
                        <p className="text-sm text-slate-300 leading-relaxed font-semibold">{r.fix}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={resetChecklist} className="btn-secondary">
                    <RotateCcw size={16} />
                    ทำเช็คลิสต์อาการใหม่อีกครั้ง
                  </button>
                  <button onClick={handleBack} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold text-sm tap-target">
                    <ChevronLeft size={16} />
                    ย้อนกลับขั้นตอนที่แล้ว
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Error Code Search & AI Assistant */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              {isAiMode ? (
                <>
                  <span className="text-red-400">🤖</span> ถาม AI วิเคราะห์อาการ
                </>
              ) : (
                <>
                  <span>📟</span> ค้นหารหัสเออร์เรอร์โค้ด
                </>
              )}
            </h2>

            {/* Mode Switcher */}
            <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => { setIsAiMode(false); setExpandedCode(null); }}
                className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all duration-200 tap-target flex items-center gap-1 ${!isAiMode ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white border border-transparent'}`}
              >
                <Search size={10} /> โค้ดปกติ
              </button>
              <button
                type="button"
                onClick={() => { setIsAiMode(true); }}
                className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all duration-200 tap-target flex items-center gap-1 ${isAiMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-white border border-transparent'}`}
              >
                <Zap size={10} className={isAiMode ? "animate-pulse text-red-400" : ""} /> วิเคราะห์ด้วย AI
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {brands.map(b => (
              <button
                key={b}
                id={`errc-brand-${b}`}
                onClick={() => { setBrand(b); setExpandedCode(null); setSearch('') }}
                className={`chip flex-shrink-0 font-bold ${brand === b ? 'active' : ''} tap-target`}
              >
                {b}
              </button>
            ))}
          </div>

          {isAiMode ? (
            <div className="space-y-4">
              <form onSubmit={handleAiSearch} className="space-y-3">
                <div className="relative">
                  <input
                    id="ai-search-input"
                    type="text"
                    placeholder={`ถาม AI สำหรับแอร์ ${brand} (เช่น "เปิดไม่ติดไฟกะพริบ", "รหัส U4 คืออะไร")...`}
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    className="input-field pl-3 pr-10 text-sm"
                  />
                  {aiQuery && (
                    <button
                      type="button"
                      onClick={() => setAiQuery('')}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors tap-target p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 disabled:text-slate-600 transition-colors tap-target"
                  >
                    {isAiLoading ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                </div>
              </form>

              {isAiLoading && (
                <div className="card p-5 border border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center space-y-3 py-10">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white animate-pulse">AI กำลังวิเคราะห์ข้อมูลการซ่อม...</p>
                    <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่ ระบบกำลังเรียกประมวลผลข้อมูล</p>
                  </div>
                </div>
              )}

              {!isAiLoading && aiResponse && (
                <div className="card-highlight p-4 border border-red-500/20 bg-slate-900/50 space-y-3 animate-fadeInDown max-h-[380px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-red-400" />
                      <span className="text-xs font-black text-white">วิเคราะห์ผลลัพธ์โดย AI</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(aiResponse);
                        alert('คัดลอกคำตอบไปที่ Clipboard แล้ว');
                      }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white font-bold bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 active:bg-slate-700 transition-all"
                    >
                      <Copy size={10} />
                      คัดลอกคำตอบ
                    </button>
                  </div>
                  
                  <div className="text-xs text-slate-200 leading-relaxed font-semibold space-y-2.5">
                    {renderFormattedAiResponse(aiResponse)}
                  </div>

                  <div className="text-[9px] text-slate-500 font-bold border-t border-slate-800/80 pt-2 flex items-center gap-1">
                    <AlertCircle size={9} />
                    <span>คำแนะนำจาก AI เป็นแนวทางเบื้องต้น ช่างเทคนิคควรตรวจสอบความปลอดภัยหน้างาน</span>
                  </div>
                </div>
              )}

              {/* Show sample questions in AI Mode when no response and not loading */}
              {!isAiLoading && !aiResponse && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">💡 ตัวอย่างการถามตอบวิเคราะห์อาการ</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      `แอร์ ${brand} รหัส U4 เกิดจากอะไร และแก้ไขอย่างไร`,
                      `คอมเพรสเซอร์แอร์ ${brand} ร้อนแต่พัดลมไม่หมุน`,
                      `พัดลมคอยล์เย็นของ ${brand} หมุนช้ากระแสตก`,
                      `แอร์มีกลิ่นอับและไม่เย็นเกิดจากจุดไหนได้บ้าง`
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setAiQuery(q); }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 active:bg-slate-800 transition-all text-xs font-bold text-slate-300 hover:text-white"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show history if any */}
              {aiHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🕒 ประวัติคำถาม AI ล่าสุด</p>
                    <button
                      type="button"
                      onClick={() => setAiHistory([])}
                      className="text-[9px] text-red-400 hover:text-red-300 font-bold"
                    >
                      ล้างประวัติ
                    </button>
                  </div>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                    {aiHistory.map((hist, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAiQuery(hist.query);
                          setAiResponse(hist.response);
                          setBrand(hist.brand);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-slate-800 hover:bg-slate-800/30 active:bg-slate-800 transition-all text-xs font-semibold text-slate-400 hover:text-slate-200 truncate flex items-center justify-between"
                      >
                        <span className="truncate">"{hist.query}" ({hist.brand})</span>
                        <ChevronRight size={10} className="text-slate-500 flex-shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="errc-search"
                  type="text"
                  placeholder="พิมพ์โค้ด เช่น U4, L5 หรือพิมพ์เพื่อค้นหา..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-10 pr-10 text-base"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors tap-target p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {filteredCodes.length === 0 && (
                  <div className="text-center py-10 text-slate-500">
                    <Search size={36} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-semibold">ไม่พบข้อมูลเออร์เรอร์ที่ค้นหา</p>
                  </div>
                )}
                {filteredCodes.map(c => (
                  <div key={c.code} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left tap-target"
                      onClick={() => setExpandedCode(expandedCode === c.code ? null : c.code)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="mono font-black text-red-400 text-lg w-10">{c.code}</span>
                        <div>
                          <p className="text-sm font-black text-white leading-snug">{c.description}</p>
                          <p className="text-xs text-slate-400 mt-1 font-semibold">สาเหตุ: {c.cause}</p>
                        </div>
                      </div>
                      {expandedCode === c.code
                        ? <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
                        : <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />}
                    </button>
                    {expandedCode === c.code && (
                      <div className="border-t border-slate-800/80 bg-slate-950/40 px-4 py-3.5 space-y-2.5">
                        <p className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                          ขั้นตอนวินิจฉัยและแนวทางซ่อมแซม
                        </p>
                        {c.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2 text-sm leading-relaxed text-slate-300 font-semibold">
                            <span className="mono text-xs font-black text-sky-500 flex-shrink-0 w-4">{idx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Danfoss Ref Tools Integration Button */}
      <a
        id="danfoss-ref-tools-btn"
        href="https://reftools.danfoss.com/"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all w-full text-left ${
          appTheme === 'light'
            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            : 'border-dashed border-sky-500 text-sky-400 bg-sky-950/20 hover:bg-sky-950/50'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          appTheme === 'light' ? 'bg-blue-100' : 'bg-sky-500/15'
        }`}>
          <span className="text-2xl">🔍</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base leading-tight">ตรวจสอบค่าสารทำความเย็นขั้นสูงผ่าน Danfoss</p>
          <p className={`text-xs font-semibold mt-1 ${
            appTheme === 'light' ? 'text-blue-500' : 'text-sky-600'
          }`}>reftools.danfoss.com — เปิดในเบราว์เซอร์ภายนอก</p>
        </div>
        <ExternalLink size={18} className="shrink-0 opacity-70" />
      </a>
    </div>
  )
}

// ฟังก์ชันช่วยดึงที่อยู่จาก Google Maps Geocoding API address_components
const extractGoogleAddress = (components) => {
  const result = {}
  components.forEach(c => {
    const types = c.types || []
    if (types.includes('route')) {
      result.road = c.long_name
    } else if (types.includes('sublocality_level_2')) {
      if (c.long_name.includes('หมู่') || c.long_name.includes('ม.')) {
        result.village = c.long_name
      } else {
        result.subdistrict = c.long_name
      }
    } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
      result.subdistrict = c.long_name
    } else if (types.includes('administrative_area_level_2')) {
      result.district = c.long_name
    } else if (types.includes('administrative_area_level_1')) {
      result.province = c.long_name
    }
  })
  return result
}

// ฟังก์ชันแปลงที่อยู่ภาษาไทยให้สั้นกระชับ (Reverse Geocoding Address Formatter)
const formatThaiAddress = (inputData) => {
  if (!inputData) return ''

  let a = {}
  // รองรับรูปแบบ input data ที่หลากหลาย (Google Maps & OpenStreetMap Nominatim)
  if (Array.isArray(inputData)) {
    a = extractGoogleAddress(inputData)
  } else if (inputData.address_components && Array.isArray(inputData.address_components)) {
    a = extractGoogleAddress(inputData.address_components)
  } else if (inputData.results && Array.isArray(inputData.results) && inputData.results[0] && inputData.results[0].address_components) {
    a = extractGoogleAddress(inputData.results[0].address_components)
  } else {
    a = inputData.address || inputData
  }

  // ดึงข้อมูลส่วนประกอบของที่อยู่เบื้องต้น
  let road = a.road || a.street || a.path || ''
  let village = a.village || a.hamlet || a.croft || ''
  let subdistrict = a.subdistrict || a.suburb || a.municipality || a.neighbourhood || a.quarter || ''
  let district = a.district || a.city_district || a.county || ''
  let province = a.province || a.state || a.province_name || a.region || ''

  // จัดการเช็คและคัดกรองจาก a.city และ a.town หากยังขาดข้อมูลระดับตำบล/อำเภอ หรือดึงข้อมูลผิดระดับ
  const checkCityTown = (val) => {
    if (!val) return
    val = val.toString().trim()
    if (/^(ตำบล|แขวง)/.test(val)) {
      if (!subdistrict) subdistrict = val
    } else if (/^(อำเภอ|เขต)/.test(val)) {
      if (!district) district = val
    } else if (!district && !subdistrict) {
      district = val
    }
  }

  checkCityTown(a.city)
  checkCityTown(a.town)

  // จัดการกรณีตัวแปรดึงสลับระดับกัน (Self-Correction Logic)
  // - ถ้า district ดันมีคำว่า "ตำบล" หรือ "แขวง" ให้ย้ายไป subdistrict
  if (district && /^(ตำบล|แขวง)/.test(district.toString().trim())) {
    if (!subdistrict) subdistrict = district
    district = ''
  }
  // - ถ้า subdistrict ดันมีคำว่า "อำเภอ" หรือ "เขต" ให้ย้ายไป district
  if (subdistrict && /^(อำเภอ|เขต)/.test(subdistrict.toString().trim())) {
    if (!district) district = subdistrict
    subdistrict = ''
  }
  // - ถ้า district ดันมีคำว่า "จังหวัด" ให้ย้ายไป province
  if (district && /^จังหวัด/.test(district.toString().trim())) {
    if (!province) province = district
    district = ''
  }
  // - ถ้า subdistrict ดันมีคำว่า "จังหวัด" ให้ย้ายไป province
  if (subdistrict && /^จังหวัด/.test(subdistrict.toString().trim())) {
    if (!province) province = subdistrict
    subdistrict = ''
  }

  // ล้างค่าช่องว่างส่วนเกิน
  const clean = (str) => str ? str.toString().trim() : ''
  road = clean(road)
  village = clean(village)
  subdistrict = clean(subdistrict)
  district = clean(district)
  province = clean(province)

  // ตรวจสอบว่าเป็นกรุงเทพมหานครหรือไม่
  const isBangkok = province.includes('กรุงเทพมหานคร') || 
                    province === 'กรุงเทพมหานคร' || 
                    province === 'กรุงเทพฯ' ||
                    province === 'กทม' ||
                    district.includes('กรุงเทพมหานคร') ||
                    subdistrict.includes('กรุงเทพมหานคร')

  // ถนน -> ถ.
  if (road) {
    if (road.startsWith('ถนน')) {
      road = road.replace(/^ถนน\s*/, 'ถ.')
    } else if (!road.startsWith('ถ.') && !road.startsWith('ซอย') && !road.startsWith('ซ.') && !road.startsWith('ตรอก')) {
      road = 'ถ.' + road
    }
  }

  // หมู่ที่ / หมู่ -> ม.
  if (village) {
    if (/^(หมู่ที่|หมู่|ม\.)/.test(village)) {
      village = village.replace(/^(หมู่ที่|หมู่)\s*/, 'ม.')
    } else {
      village = 'ม.' + village
    }
  }

  if (isBangkok) {
    province = 'จ.กรุงเทพฯ'
    
    // กทม: เขต -> อ.
    if (district) {
      if (/^(เขต|อำเภอ|อ\.)/.test(district)) {
        district = district.replace(/^(เขต|อำเภอ)\s*/, 'อ.')
      } else {
        district = 'อ.' + district
      }
      if (district.includes('กรุงเทพมหานคร') || district === 'อ.กรุงเทพฯ' || district === 'อ.กทม') {
        district = ''
      }
    }
    
    // กทม: แขวง -> ต.
    if (subdistrict) {
      if (/^(แขวง|ตำบล|ต\.)/.test(subdistrict)) {
        subdistrict = subdistrict.replace(/^(แขวง|ตำบล)\s*/, 'ต.')
      } else {
        subdistrict = 'ต.' + subdistrict
      }
    }
  } else {
    // จังหวัดอื่น ๆ -> จ.
    if (province) {
      if (province.startsWith('จังหวัด')) {
        province = province.replace(/^จังหวัด\s*/, 'จ.')
      } else if (!province.startsWith('จ.')) {
        province = 'จ.' + province
      }
    }
    
    // อำเภอ -> อ.
    if (district) {
      if (/^(อำเภอ|เขต|อ\.)/.test(district)) {
        district = district.replace(/^(อำเภอ|เขต)\s*/, 'อ.')
      } else {
        district = 'อ.' + district
      }
    }
    
    // ตำบล -> ต.
    if (subdistrict) {
      if (/^(ตำบล|แขวง|ต\.)/.test(subdistrict)) {
        subdistrict = subdistrict.replace(/^(ตำบล|แขวง)\s*/, 'ต.')
      } else {
        subdistrict = 'ต.' + subdistrict
      }
    }
  }

  // รวมส่วนต่างๆ คั่นด้วยเครื่องหมายจุลภาคพร้อมเว้นวรรค
  const parts = []
  if (road) parts.push(road)
  if (village) parts.push(village)
  if (subdistrict) parts.push(subdistrict)
  if (district) parts.push(district)
  if (province) parts.push(province)

  return parts.join(', ')
}

// 4. Job Logger & Refrigerant Table Tab Component
function JobLoggerPanel() {
  const { 
    unitSystem, isOnline, appTheme,
    shopName, shopAddress, promptPayId,
    user
  } = useApp()
  const { sharedBTU, scannedJobData, setScannedJobData } = useCalculator()

  const [subTab, setSubTab] = useState(0)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  // Form states
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [saveAction, setSaveAction] = useState(null) // 'inserted' | 'updated' | null
  const [lastSavedForm, setLastSavedForm] = useState(null)
  const [lineReport, setLineReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Billing and Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

  const netAmount = Math.max(0, (parseFloat(form.laborFee) || 0) + (parseFloat(form.materialFee) || 0) - (parseFloat(form.discount) || 0))
  
  const activePromptPayId = formatPhoneOrPromptPay(user?.promptpay_id || promptPayId)
  const activeShopName = user?.name || shopName || 'ช่างแอร์ทั่วไป'

  // Generate PromptPay QR Code payload & image URL
  const handleOpenPayment = async () => {
    if (!activePromptPayId || activePromptPayId.toLowerCase() === 'empty') {
      alert('⚠️ โปรดตั้งค่า "หมายเลขพร้อมเพย์" ในแท็บตั้งค่าระบบหรือหน้าบัญชีช่างก่อนรับชำระเงิน!')
      return
    }
    
    try {
      const payload = generatePromptPayQR(activePromptPayId, netAmount)
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      setQrCodeDataUrl(dataUrl)
      setShowPaymentModal(true)
    } catch (err) {
      console.error('Failed to generate PromptPay QR:', err)
      alert('❌ ไม่สามารถสร้าง QR Code ชำระเงินได้')
    }
  }

  const handleGeneratePdf = async (shareToLine = false) => {
    setGeneratingPdf(true)
    try {
      const { regular, bold } = await loadSarabunFonts()

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      })

      doc.addFileToVFS('Sarabun-Regular.ttf', regular)
      doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal')
      doc.addFileToVFS('Sarabun-Bold.ttf', bold)
      doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold')

      const activePromptPayId = formatPhoneOrPromptPay(user?.promptpay_id || promptPayId)
      const activeName = user?.name || shopName || 'ช่างแอร์ทั่วไป'
      const activePhone = formatPhoneOrPromptPay(user?.phone || (shopAddress && shopAddress.match(/\d{9,10}/) ? shopAddress.match(/\d{9,10}/)[0] : '') || '-')

      doc.setProperties({
        title: `Invoice-${form.customer || 'Customer'}`,
        subject: 'Air Buddy Pro Service Invoice',
        author: activeName
      })

      const margin = 15
      let y = 20

      // Brand Title Header
      doc.setFillColor(15, 23, 42)
      doc.rect(margin, y, 180, 25, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(16)
      doc.text('AIR BUDDY PRO - ใบเสร็จรับเงิน/ใบส่งงาน', margin + 8, y + 10)

      doc.setFont('Sarabun', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(200, 200, 200)
      doc.text('เครื่องมือสากลและระบบบันทึกงานช่างแอร์ไทยมืออาชีพ', margin + 8, y + 16)

      const receiptNo = 'ABP-' + Date.now().toString().slice(-8)
      const dateStr = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFont('Sarabun', 'bold')
      doc.text(`เลขที่: ${receiptNo}`, margin + 120, y + 10)
      doc.text(`วันที่: ${dateStr}`, margin + 120, y + 16)

      y += 33

      // Shop & Customer Columns
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text('ข้อมูลผู้ให้บริการ (ช่าง):', margin, y)

      doc.setFont('Sarabun', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text(activeName, margin, y + 5.5)
      
      const providerAddr = user?.name 
        ? `โทร. ${activePhone}${shopAddress ? ` / ${shopAddress}` : ''}`
        : shopAddress || 'เบอร์ติดต่อ: - (ไม่ได้ตั้งค่าที่อยู่ร้าน)'
      const shopAddrLines = doc.splitTextToSize(providerAddr, 85)
      doc.text(shopAddrLines, margin, y + 11)

      // Right: Customer info
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text('ข้อมูลผู้รับบริการ (ลูกค้า):', margin + 95, y)

      doc.setFont('Sarabun', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text(form.customer || '-', margin + 95, y + 5.5)
      doc.text(`โทรศัพท์: ${form.phone || '-'}`, margin + 95, y + 11)
      
      const custAddrLines = doc.splitTextToSize(`สถานที่ติดตั้ง: ${form.location || '-'}`, 85)
      doc.text(custAddrLines, margin + 95, y + 16.5)

      const maxColHeight = Math.max(11 + shopAddrLines.length * 5, 16.5 + custAddrLines.length * 5)
      y += maxColHeight + 8

      // Horizontal separator line
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(margin, y, margin + 180, y)
      y += 8

      // Service Details (Machine specs)
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text('รายละเอียดระบบปรับอากาศ', margin, y)
      y += 6

      // Box representing specs
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, 180, 28, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.rect(margin, y, 180, 28, 'S')

      doc.setFont('Sarabun', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)

      // Column 1
      doc.text(`แบรนด์แอร์: ${form.brand || '-'}`, margin + 6, y + 7)
      doc.text(`รุ่นแอร์ (Model): ${form.model || '-'}`, margin + 6, y + 14)
      doc.text(`หมายเลขเครื่อง (S/N): ${form.serialNo || '-'}`, margin + 6, y + 21)

      // Column 2
      doc.text(`ประเภทน้ำยา: ${form.refrigerant || '-'}`, margin + 95, y + 7)
      doc.text(`กระแสไฟฟ้า (Current): ${form.current || '-'} แอมป์`, margin + 95, y + 14)
      doc.text(`พิกัดละติจูด/ลองจิจูด: ${form.lat || '-'}, ${form.lon || '-'}`, margin + 95, y + 21)

      y += 36

      // Pressure Stats Table
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text('ตารางบันทึกแรงดันน้ำยาแอร์ (Refrigerant Pressure Check)', margin, y)
      y += 6

      doc.setFillColor(15, 23, 42)
      doc.rect(margin, y, 180, 8, 'F')
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text('พิกัดการวัดแรงดันน้ำยาแอร์', margin + 6, y + 5.5)
      doc.text(`แรงดันก่อนบริการ (${unitSystem})`, margin + 65, y + 5.5)
      doc.text(`แรงดันหลังบริการ (${unitSystem})`, margin + 120, y + 5.5)

      doc.setFont('Sarabun', 'normal')
      doc.setTextColor(71, 85, 105)

      // Row 1: Low Pressure
      y += 8
      doc.setFillColor(255, 255, 255)
      doc.rect(margin, y, 180, 8, 'F')
      doc.rect(margin, y, 180, 8, 'S')
      doc.text('Low Gauge Pressure (ท่อทางดูด / ท่อใหญ่)', margin + 6, y + 5.5)
      doc.text(form.lowBefore || '-', margin + 65, y + 5.5)
      doc.text(form.lowAfter || '-', margin + 120, y + 5.5)

      // Row 2: High Pressure
      y += 8
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, 180, 8, 'F')
      doc.rect(margin, y, 180, 8, 'S')
      doc.text('High Gauge Pressure (ท่อทางส่ง / ท่อเล็ก)', margin + 6, y + 5.5)
      doc.text(form.highBefore || '-', margin + 65, y + 5.5)
      doc.text(form.highAfter || '-', margin + 120, y + 5.5)

      y += 16

      // Price breakdown
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text('รายละเอียดค่าบริการและค่าอะไหล่ (Pricing Breakdown)', margin, y)
      y += 6

      doc.setFillColor(51, 65, 85)
      doc.rect(margin, y, 180, 8, 'F')
      doc.setFont('Sarabun', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text('รายการชำระเงิน', margin + 6, y + 5.5)
      doc.text('จำนวนเงิน (บาท)', margin + 140, y + 5.5)

      doc.setFont('Sarabun', 'normal')
      doc.setTextColor(71, 85, 105)

      // Labor fee
      y += 8
      doc.rect(margin, y, 180, 8, 'S')
      doc.text('1. ค่าบริการตรวจเช็คและค่าแรงช่าง (Labor / Service Fee)', margin + 6, y + 5.5)
      doc.text((parseFloat(form.laborFee) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), margin + 140, y + 5.5)

      // Material fee
      y += 8
      doc.rect(margin, y, 180, 8, 'S')
      doc.text('2. ค่าวัสดุ อะไหล่ และน้ำยาแอร์ (Parts & Refrigerant Fee)', margin + 6, y + 5.5)
      doc.text((parseFloat(form.materialFee) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), margin + 140, y + 5.5)

      // Discount
      y += 8
      doc.rect(margin, y, 180, 8, 'S')
      doc.text('3. ส่วนลดการให้บริการ (Special Discount)', margin + 6, y + 5.5)
      doc.text('-' + (parseFloat(form.discount) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), margin + 140, y + 5.5)

      // Net Amount (Total)
      y += 8
      doc.setFillColor(241, 245, 249)
      doc.rect(margin, y, 180, 10, 'F')
      doc.rect(margin, y, 180, 10, 'S')
      doc.setFont('Sarabun', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('ยอดรวมเงินสุทธิทั้งสิ้น (Net Total Amount)', margin + 6, y + 6.5)
      doc.setFontSize(11)
      doc.text(netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท', margin + 140, y + 6.5)

      y += 18

      // Notes block
      if (form.notes) {
        doc.setFont('Sarabun', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(15, 23, 42)
        doc.text('หมายเหตุเพิ่มเติม:', margin, y)
        doc.setFont('Sarabun', 'normal')
        doc.setTextColor(100, 116, 139)
        const notesWrap = doc.splitTextToSize(form.notes, 100)
        doc.text(notesWrap, margin, y + 5)
      }

      // PromptPay QR Code drawing
      if (activePromptPayId && netAmount > 0) {
        const payload = generatePromptPayQR(activePromptPayId, netAmount)
        const qrUrl = await QRCode.toDataURL(payload, { margin: 1 })
        doc.addImage(qrUrl, 'PNG', margin + 145, y - 2, 30, 30)
        doc.setFont('Sarabun', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(15, 23, 42)
        doc.text('สแกนจ่ายผ่าน PromptPay', margin + 142, y + 31)
      }

      // Technician and Customer Signature placeholders
      y += 35
      doc.setFont('Sarabun', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)

      // Tech sign
      doc.line(margin, y, margin + 50, y)
      doc.text('ลงชื่อ................................................ผู้ให้บริการ', margin, y + 5)
      doc.text(`( ${activeName} )`, margin + 4, y + 10)

      // Customer sign
      doc.line(margin + 90, y, margin + 140, y)
      doc.text('ลงชื่อ................................................ผู้รับบริการ', margin + 90, y + 5)
      doc.text(`( ${form.customer || 'ลูกค้า'} )`, margin + 94, y + 10)

      // Generate and trigger action
      if (shareToLine) {
        const filename = `receipt_${receiptNo}.pdf`
        doc.save(filename)

        const lineText = `----------------------------------------\n` +
          `🧾 ใบเสร็จรับเงินอิเล็กทรอนิกส์ (Air Buddy Pro)\n` +
          `----------------------------------------\n` +
          `👤 ลูกค้า: ${form.customer || '-'}\n` +
          `🛠️ บริการแอร์: ${form.brand || '-'} (${form.model || '-'})\n` +
          `💰 ยอดสุทธิ: ${netAmount.toLocaleString('th-TH')} บาท\n` +
          `🏦 รับชำระผ่าน PromptPay QR เรียบร้อยแล้ว\n` +
          `ดาวน์โหลดใบเสร็จ PDF ในเครื่องของคุณแล้วครับ`

        // Use rel="noreferrer" link to prevent referrer leak (Vercel Preview URL protection crash)
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(lineText)}`
        const a = document.createElement('a')
        a.href = lineUrl
        a.target = '_blank'
        a.rel = 'noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        doc.save(`receipt_${receiptNo}.pdf`)
      }

    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert(`❌ เกิดข้อผิดพลาดในการสร้าง PDF: ${err.message}`)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const isLowBeforeWarning = form.lowBefore && (form.refrigerant === 'R32' ? (unitSystem === 'PSI' ? parseFloat(form.lowBefore) > 250 : parseFloat(form.lowBefore) > 17.2) : (unitSystem === 'PSI' ? parseFloat(form.lowBefore) > 600 : parseFloat(form.lowBefore) > 41.3))
  const isLowAfterWarning = form.lowAfter && (unitSystem === 'PSI' ? parseFloat(form.lowAfter) > 600 : parseFloat(form.lowAfter) > 41.3)
  const isHighBeforeWarning = form.highBefore && (form.refrigerant === 'R32' ? (unitSystem === 'PSI' ? parseFloat(form.highBefore) > 250 : parseFloat(form.highBefore) > 17.2) : (unitSystem === 'PSI' ? parseFloat(form.highBefore) > 600 : parseFloat(form.highBefore) > 41.3))
  const isHighAfterWarning = form.highAfter && (unitSystem === 'PSI' ? parseFloat(form.highAfter) > 600 : parseFloat(form.highAfter) > 41.3)
  const isCurrentWarning = form.current && parseFloat(form.current) > 50

  const lowBeforeVal = parseFloat(form.lowBefore)
  const lowAfterVal = parseFloat(form.lowAfter)
  const highBeforeVal = parseFloat(form.highBefore)
  const highAfterVal = parseFloat(form.highAfter)

  const hasLowDiff = !isNaN(lowBeforeVal) && !isNaN(lowAfterVal)
  const hasHighDiff = !isNaN(highBeforeVal) && !isNaN(highAfterVal)

  const lowDiff = hasLowDiff ? (lowAfterVal - lowBeforeVal) : null
  const highDiff = hasHighDiff ? (highAfterVal - highBeforeVal) : null

  // Apply scanned data
  useEffect(() => {
    if (scannedJobData) {
      setForm(prev => ({ ...prev, ...scannedJobData }))
    }
  }, [scannedJobData])

  const [gettingLoc, setGettingLoc] = useState(false)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ เบราว์เซอร์ของคุณไม่สนับสนุนระบบระบุตำแหน่งพิกัด (Geolocation)')
      return
    }
    setGettingLoc(true)

    const options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }

    const successCallback = async (position) => {
      const { latitude, longitude } = position.coords
      setForm(prev => ({ ...prev, lat: latitude.toString(), lon: longitude.toString() }))
      
      try {
        // Reverse geocoding using OpenStreetMap Nominatim API (Free and open-source)
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=th`, {
          headers: {
            'Accept-Language': 'th,en;q=0.9',
            'User-Agent': 'AirBuddyPro/1.2'
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data) {
            const formatted = formatThaiAddress(data)
            if (formatted) {
              setForm(prev => ({ ...prev, location: formatted }))
            } else if (data.display_name) {
              setForm(prev => ({ ...prev, location: data.display_name }))
            }
          }
        }
      } catch (err) {
        console.error('Reverse Geocoding failed:', err)
      } finally {
        setGettingLoc(false)
      }
    }

    const errorCallback = (error) => {
      // If high accuracy times out or fails, try again with low accuracy fallback
      if (options.enableHighAccuracy) {
        console.warn("High accuracy geolocation failed, falling back to low accuracy...");
        options.enableHighAccuracy = false;
        options.timeout = 10000;
        navigator.geolocation.getCurrentPosition(successCallback, (err2) => {
          setGettingLoc(false)
          if (err2.code === err2.PERMISSION_DENIED) {
            alert('❌ กรุณาอนุญาตให้สิทธิ์การเข้าถึงตำแหน่งพิกัดบนเบราว์เซอร์ของคุณ')
          } else {
            alert(`❌ เกิดข้อผิดพลาดในการดึงตำแหน่ง: ${err2.message}`)
          }
        }, options)
      } else {
        setGettingLoc(false)
        if (error.code === error.PERMISSION_DENIED) {
          alert('❌ กรุณาอนุญาตให้สิทธิ์การเข้าถึงตำแหน่งพิกัดบนเบราว์เซอร์ของคุณ')
        } else {
          alert(`❌ เกิดข้อผิดพลาดในการดึงตำแหน่ง: ${error.message}`)
        }
      }
    }

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
  }

  const isFormUnchanged = !!(lastSavedForm && Object.keys(EMPTY_FORM).every(key => {
    const val1 = form[key] !== undefined && form[key] !== null ? form[key].toString() : ''
    const val2 = lastSavedForm[key] !== undefined && lastSavedForm[key] !== null ? lastSavedForm[key].toString() : ''
    return val1 === val2
  }))

  const handleSave = async () => {
    if (!form.customer || !form.customer.trim()) {
      alert('⚠️ กรุณากรอก "ชื่อลูกค้า" ก่อนทำการบันทึกประวัติ!')
      return
    }
    if (isFormUnchanged) {
      alert('⚠️ ข้อมูลไม่มีการเปลี่ยนแปลง ไม่สามารถบันทึกงานซ้ำได้!')
      return
    }
    setSaving(true)
    const record = { 
      ...form, 
      btu: sharedBTU || null, 
      unit: unitSystem,
      tech_id: user?.user_id || "",
      tech_name: user?.name || ""
    }
    let result
    if (!isOnline) {
      const action = saveJobLocally(record)
      result = { saved: 'offline', action }
    } else {
      result = await saveJob(record, isOnline)
      if (result.saved === 'offline') {
        const action = saveJobLocally(record)
        result.action = action
      }
    }
    setSaved(result.saved)
    setSaveAction(result.action || 'inserted')
    setLastSavedForm({ ...form })
    setSaving(false)
    setHistoryRefresh(p => p + 1)
    setTimeout(() => {
      setSaved(null)
      setSaveAction(null)
    }, 4000)
  }

  const handleGenerateReport = () => {
    const report = generateLINEReport({ form, sharedBTU, unitSystem })
    setLineReport(report)
    setShowReport(true)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lineReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenLINE = () => {
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(lineReport)}`
    const a = document.createElement('a')
    a.href = lineUrl
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDeleteJob = async (job) => {
    let localJobs = JSON.parse(localStorage.getItem('abp_local_jobs') || '[]')
    localJobs = localJobs.filter(j => j.id !== job.id)
    localStorage.setItem('abp_local_jobs', JSON.stringify(localJobs))

    const hasSupabase = !!(supabaseConfigured && supabase)
    if (hasSupabase && job.id) {
      try {
        await supabase.from('jobs').delete().eq('id', job.id)
      } catch (err) {
        console.error('Failed to delete job from Supabase:', err)
      }
    }

    setHistoryRefresh(p => p + 1)
  }

  // History list states
  const [jobs, setJobs] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expandedJobIdx, setExpandedJobIdx] = useState(null)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    const all = await fetchAllJobs(user)
    setJobs(all)
    setLoadingHistory(false)
  }, [user])

  useEffect(() => { loadHistory() }, [loadHistory, historyRefresh])

  const filteredJobs = jobs.filter(j =>
    (j.customer || '').toString().toLowerCase().includes(historySearch.toLowerCase()) ||
    (j.model || '').toString().toLowerCase().includes(historySearch.toLowerCase()) ||
    (j.brand || '').toString().toLowerCase().includes(historySearch.toLowerCase())
  )

  const queueCount = getQueue().length

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <BookOpen size={24} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">บันทึกประวัติและตารางน้ำยา</h1>
            <p className="text-sm text-slate-400">เก็บประวัติลง Local + Cloud และตรวจสอบสเปคน้ำยา</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        {queueCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
            <WifiOff size={14} className="text-amber-400" />
            <span className="text-xs font-black text-amber-400">{queueCount} งานรอการ Sync</span>
          </div>
        )}
      </div>

      {/* Screen layout switches between mobile subtabs and desktop multi-column side-by-side */}
      <div className="lg:hidden flex gap-2 bg-slate-800/80 p-1 rounded-xl">
        {['📋 ฟอร์มกรอกงาน', '💾 รายการประวัติ', '❄️ ตารางน้ำยา'].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setSubTab(idx)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all tap-target
              ${subTab === idx
                ? 'bg-slate-700 text-white shadow-sm font-black'
                : 'text-slate-400 active:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Desktop Grid Layout: Form on the Left, Refrigerant Table / History list on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Hand: The form - visible if tab is selected on mobile OR always on desktop */}
        <div className={`space-y-4 ${subTab === 0 ? 'block' : 'hidden lg:block'}`}>
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">รายละเอียดงานติดตั้ง / บริการ</h2>

            {scannedJobData && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-3 bg-purple-500/15 border border-purple-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📷</span>
                  <p className="text-xs text-purple-300 font-bold">ข้อมูลสแกนเพลทนำเข้าเรียบร้อยแล้ว</p>
                </div>
                <button
                  onClick={() => {
                    setScannedJobData(null)
                    setForm(EMPTY_FORM)
                    setLastSavedForm(null)
                  }}
                  className="text-xs text-purple-400 font-bold hover:underline"
                >
                  ล้างข้อมูล
                </button>
              </div>
            )}

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="label">ชื่อลูกค้า</label>
                  <input
                    id="job-customer"
                    type="text"
                    placeholder="เช่น นายอรรถพล มั่นคง"
                    value={form.customer}
                    onChange={e => set('customer', e.target.value)}
                    className="input-field font-semibold"
                  />
                </div>
                <div>
                  <label className="label">เบอร์โทรศัพท์ลูกค้า</label>
                  <input
                    id="job-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="เช่น 0812345678"
                    value={form.phone || ''}
                    onChange={e => set('phone', e.target.value)}
                    onBlur={e => set('phone', formatPhoneOrPromptPay(e.target.value))}
                    className="input-field font-semibold"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label mb-0">สถานที่ติดตั้ง / สาขา</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLoc}
                    className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all tap-target active:scale-95 shadow-lg shadow-emerald-500/5"
                  >
                    {gettingLoc ? (
                      <div className="w-3.5 h-3.5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                    ) : (
                      <MapPin size={14} className="text-emerald-400" />
                    )}
                    {gettingLoc ? 'กำลังดึงพิกัด...' : 'ลงพิกัดปัจจุบัน'}
                  </button>
                </div>
                <input
                  id="job-location"
                  type="text"
                  placeholder="เช่น หมู่บ้านรื่นรมย์ ซอย 4"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  className="input-field font-semibold"
                />
              </div>

              {/* Latitude and Longitude Inputs */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="label">พิกัดละติจูด (LAT)</label>
                  <input
                    id="job-lat"
                    type="text"
                    placeholder="ละติจูด (อัตโนมัติ)"
                    value={form.lat || ''}
                    readOnly
                    className="input-field font-semibold bg-slate-900/60 border-slate-800/80 text-slate-400 cursor-not-allowed select-all"
                  />
                </div>
                <div>
                  <label className="label">พิกัดลองจิจูด (LONG)</label>
                  <input
                    id="job-lon"
                    type="text"
                    placeholder="ลองจิจูด (อัตโนมัติ)"
                    value={form.lon || ''}
                    readOnly
                    className="input-field font-semibold bg-slate-900/60 border-slate-800/80 text-slate-400 cursor-not-allowed select-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="label">แบรนด์แอร์</label>
                  <input
                    id="job-brand"
                    type="text"
                    placeholder="Mitsubishi"
                    value={form.brand}
                    onChange={e => set('brand', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">รุ่นคอยล์เย็น/ร้อน</label>
                  <input
                    id="job-model"
                    type="text"
                    placeholder="MSY-KX13VF"
                    value={form.model}
                    onChange={e => set('model', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">ประเภทน้ำยาแอร์</label>
                <div className="flex gap-2">
                  {REFRIGERANT_TYPES.map(r => (
                    <button
                      key={r}
                      id={`job-ref-${r}`}
                      onClick={() => set('refrigerant', r)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border tap-target
                        ${form.refrigerant === r
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 font-black'
                          : 'bg-slate-800 border-slate-700 text-slate-400 active:bg-slate-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">ซีเรียลนัมเบอร์เพลท</label>
                <input
                  id="job-serial"
                  type="text"
                  placeholder="24B098715"
                  value={form.serialNo}
                  onChange={e => set('serialNo', e.target.value)}
                  className="input-field mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Low Pressure ก่อนเติม ({unitSystem})</label>
                  <input
                    id="job-low-before"
                    type="number"
                    inputMode="decimal"
                    placeholder="80"
                    value={form.lowBefore}
                    onChange={e => set('lowBefore', e.target.value)}
                    className={`input-field mono text-center ${isLowBeforeWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
                  />
                  {isLowBeforeWarning && (
                    <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight">
                      ⚠️ สูงผิดปกติ เกิน {unitSystem === 'PSI' ? (form.refrigerant === 'R32' ? '250 PSI' : '600 PSI') : (form.refrigerant === 'R32' ? '17.2 Bar' : '41.3 Bar')}
                    </span>
                  )}
                </div>
                <div>
                  <label className="label">Low Pressure หลังเติม ({unitSystem})</label>
                  <input
                    id="job-low-after"
                    type="number"
                    inputMode="decimal"
                    placeholder="125"
                    value={form.lowAfter}
                    onChange={e => set('lowAfter', e.target.value)}
                    className={`input-field mono text-center ${isLowAfterWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
                  />
                  {isLowAfterWarning && (
                    <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight">
                      ⚠️ สูงผิดปกติ เกิน {unitSystem === 'PSI' ? '600 PSI' : '41.3 Bar'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">High Pressure ก่อนเติม ({unitSystem})</label>
                  <input
                    id="job-high-before"
                    type="number"
                    inputMode="decimal"
                    placeholder="220"
                    value={form.highBefore}
                    onChange={e => set('highBefore', e.target.value)}
                    className={`input-field mono text-center ${isHighBeforeWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
                  />
                  {isHighBeforeWarning && (
                    <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight">
                      ⚠️ สูงผิดปกติ เกิน {unitSystem === 'PSI' ? (form.refrigerant === 'R32' ? '250 PSI' : '600 PSI') : (form.refrigerant === 'R32' ? '17.2 Bar' : '41.3 Bar')}
                    </span>
                  )}
                </div>
                <div>
                  <label className="label">High Pressure หลังเติม ({unitSystem})</label>
                  <input
                    id="job-high-after"
                    type="number"
                    inputMode="decimal"
                    placeholder="380"
                    value={form.highAfter}
                    onChange={e => set('highAfter', e.target.value)}
                    className={`input-field mono text-center ${isHighAfterWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
                  />
                  {isHighAfterWarning && (
                    <span className="text-[10px] text-amber-400 font-bold block mt-1 leading-tight">
                      ⚠️ สูงผิดปกติ เกิน {unitSystem === 'PSI' ? '600 PSI' : '41.3 Bar'}
                    </span>
                  )}
                </div>
              </div>

              {/* Pressure Differential Metric Card */}
              {(hasLowDiff || hasHighDiff) && (
                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-2.5 animate-fadeInDown">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      📊 ส่วนต่างความดันน้ำยา (Pressure Differential)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold">
                      หน่วย: {unitSystem}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 text-center flex flex-col justify-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">ฝั่ง Low (Low Diff)</p>
                      {hasLowDiff ? (
                        <div>
                          <p className={`mono text-base font-black ${lowDiff > 0 ? 'text-emerald-400' : lowDiff < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {lowDiff > 0 ? '+' : ''}{lowDiff.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            {lowDiff > 0 ? 'แรงดันเพิ่มขึ้น' : lowDiff < 0 ? 'แรงดันลดลง' : 'แรงดันคงที่'}
                          </p>
                        </div>
                      ) : (
                        <p className="mono text-base font-black text-slate-600">-</p>
                      )}
                    </div>
                    
                    <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 text-center flex flex-col justify-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">ฝั่ง High (High Diff)</p>
                      {hasHighDiff ? (
                        <div>
                          <p className={`mono text-base font-black ${highDiff > 0 ? 'text-emerald-400' : highDiff < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {highDiff > 0 ? '+' : ''}{highDiff.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            {highDiff > 0 ? 'แรงดันเพิ่มขึ้น' : highDiff < 0 ? 'แรงดันลดลง' : 'แรงดันคงที่'}
                          </p>
                        </div>
                      ) : (
                        <p className="mono text-base font-black text-slate-600">-</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">กระแสไฟฟ้าหน้างาน (แอมป์)</label>
                <input
                  id="job-current"
                  type="number"
                  inputMode="decimal"
                  placeholder="5.2"
                  value={form.current}
                  onChange={e => set('current', e.target.value)}
                  className={`input-field mono font-black ${isCurrentWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-500/5 text-amber-400' : ''}`}
                />
                {isCurrentWarning && (
                  <span className="text-[10px] text-amber-400 font-bold block mt-1.5 leading-tight">
                    ⚠️ กระแสไฟฟ้าสูงผิดปกติ เกิน 50A
                  </span>
                )}
              </div>

              <div>
                <label className="label">หมายเหตุการบริการ / อะไหล่ที่เปลี่ยน</label>
                <textarea
                  id="job-notes"
                  placeholder="รายละเอียดเพิ่มเติมความบกพร่องระบบ อุปกรณ์เสีย..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="input-field min-h-[80px]"
                  rows={2}
                />
              </div>

              {/* Billing Inputs Block */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    🪙 ข้อมูลค่าบริการ & การรับเงิน (Billing & Payment)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label mb-1">ค่าบริการ / ค่าแรง (บาท)</label>
                    <input
                      id="job-labor-fee"
                      type="number"
                      inputMode="decimal"
                      placeholder="เช่น 500"
                      value={form.laborFee || ''}
                      onChange={e => set('laborFee', e.target.value)}
                      className="input-field text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="label mb-1">ค่าอะไหล่ / น้ำยา (บาท)</label>
                    <input
                      id="job-material-fee"
                      type="number"
                      inputMode="decimal"
                      placeholder="เช่น 300"
                      value={form.materialFee || ''}
                      onChange={e => set('materialFee', e.target.value)}
                      className="input-field text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="label mb-1">ส่วนลดพิเศษ (บาท)</label>
                    <input
                      id="job-discount"
                      type="number"
                      inputMode="decimal"
                      placeholder="เช่น 50"
                      value={form.discount || ''}
                      onChange={e => set('discount', e.target.value)}
                      className="input-field text-sm font-bold text-center text-rose-400"
                    />
                  </div>
                </div>
                
                {/* Net Total Display */}
                <div className="flex items-center justify-between pt-2.5 px-1 bg-slate-950/40 rounded-lg p-2.5 border border-slate-900">
                  <span className="text-xs font-bold text-slate-400">ยอดรวมสุทธิทั้งสิ้น:</span>
                  <span className="text-base font-black text-sky-400">
                    {netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  id="job-save"
                  onClick={handleSave}
                  disabled={saving || isFormUnchanged}
                  className={`btn-success w-full ${isFormUnchanged ? 'opacity-65 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isFormUnchanged ? 'บันทึกข้อมูลเรียบร้อยแล้ว' : (saving ? 'กำลังบันทึก...' : 'บันทึกงาน')}
                </button>
                <button
                  id="job-promptpay"
                  type="button"
                  onClick={handleOpenPayment}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all active:scale-98 text-white"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
                >
                  <span>💸</span>
                  รับชำระเงิน (พร้อมเพย์)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  id="job-line-report"
                  onClick={handleGenerateReport}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #06b000, #00c300)', padding: '12px 14px' }}
                >
                  <MessageCircle size={18} />
                  <span className="text-xs">สร้างรายงาน LINE</span>
                </button>
                
                <button
                  id="job-pdf-invoice"
                  type="button"
                  disabled={generatingPdf}
                  onClick={() => handleGeneratePdf(false)}
                  className="btn-primary w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-650 text-white font-bold"
                  style={{ background: 'none', padding: '12px 14px' }}
                >
                  {generatingPdf ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FileText size={18} className="text-slate-300" />
                  )}
                  <span className="text-xs">{generatingPdf ? 'ดาวน์โหลดฟอนต์...' : 'พิมพ์ใบเสร็จ (PDF)'}</span>
                </button>

                <button
                  id="job-pdf-line"
                  type="button"
                  disabled={generatingPdf}
                  onClick={() => handleGeneratePdf(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-white font-bold"
                  style={{ background: 'none', padding: '12px 14px' }}
                >
                  <Send size={18} className="text-sky-400" />
                  <span className="text-xs">ส่งใบเสร็จเข้า LINE</span>
                </button>
              </div>

              {saved && (
                <div className={`flex items-center gap-2 p-3.5 rounded-xl border animate-fadeInDown
                  ${saved === 'online'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}
                >
                  {saved === 'online' ? <Wifi size={18} /> : <WifiOff size={18} />}
                  <span className="font-bold">
                    {saved === 'online' 
                      ? (saveAction === 'updated' ? '✅ อัปเดตข้อมูลทับงานเดิมวันนี้บนคลาวด์สำเร็จ' : '✅ บันทึกข้อมูลงานขึ้นระบบคลาวด์เสร็จสิ้น') 
                      : (saveAction === 'updated' ? '📦 อัปเดตข้อมูลทับงานเดิมวันนี้ในเครื่องสำเร็จ' : '📦 จัดเก็บออฟไลน์ในเครื่องชั่วคราว')}
                  </span>
                </div>
              )}

              {showReport && (
                <div className="card-highlight p-4 space-y-3 border border-green-500 animate-fadeInDown">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-green-400">ตัวอย่างข้อความรายงานบริการช่าง</p>
                    <button onClick={() => setShowReport(false)} className="text-slate-400 font-bold hover:underline text-xs">ปิด</button>
                  </div>
                  <pre className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg overflow-y-auto leading-relaxed max-h-48 font-sans border border-slate-900 whitespace-pre-wrap">
                    {lineReport}
                  </pre>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopy}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all border tap-target
                        ${copied
                          ? 'bg-green-500/20 border-green-500/40 text-green-400 font-black'
                          : 'bg-slate-800 border-slate-700 text-white'}`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกข้อความ'}
                    </button>
                    <button
                      onClick={handleOpenLINE}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white tap-target"
                      style={{ background: 'linear-gradient(135deg, #06b000, #00c300)' }}
                    >
                      <MessageCircle size={16} />
                      ส่งห้องแชท LINE
                    </button>
                  </div>
                </div>
              )}

              {/* PromptPay Payment Modal Overlay */}
              {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
                  <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💸</span>
                        <span className="font-black text-white text-base">ชำระเงินผ่านพร้อมเพย์</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-90"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center bg-white p-5 rounded-2xl shadow-inner border border-slate-200">
                      {/* PromptPay Logo */}
                      <div className="w-full flex justify-center mb-2.5">
                        <img 
                          src="https://promptpay.io/public/images/promptpay-logo.png" 
                          alt="PromptPay" 
                          className="h-7 object-contain filter contrast-125"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="PromptPay QR Code" className="w-52 h-52 object-contain" />
                      ) : (
                        <div className="w-52 h-52 flex items-center justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-450 text-xs">
                          กำลังสร้าง QR Code...
                        </div>
                      )}

                      {/* Security Prompt */}
                      <p className="text-[10px] text-slate-500 font-bold mt-2 text-center">
                        สแกนจ่ายด้วยแอปพลิเคชันธนาคารบนมือถือของคุณ
                      </p>
                    </div>

                    {/* Billing Summary */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
                      <div className="flex justify-between text-xs text-slate-400 font-semibold">
                        <span>บัญชีรับเงิน:</span>
                        <span className="text-slate-200 font-mono font-bold">{activePromptPayId}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-semibold">
                        <span>ชื่อร้านค้า/ช่าง:</span>
                        <span className="text-slate-200 font-bold">{activeShopName}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-300">ยอดเงินสุทธิ:</span>
                        <span className="text-xl font-black text-emerald-400">
                          {netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                        </span>
                      </div>
                    </div>

                    {/* Modal actions */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="py-3 px-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white font-bold text-sm transition-all active:scale-95 text-center cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentModal(false)
                          alert('✅ ยืนยันการรับชำระเงินเรียบร้อยแล้ว!')
                        }}
                        className="py-3 px-4 rounded-xl font-bold text-sm text-white transition-all active:scale-95 text-center cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                      >
                        ยืนยันรับเงินแล้ว
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Hand: Column 2 (Mobile Tab view switcher fallback OR always side-by-side on desktop) */}
        {/* Refrigerant Guide */}
        <div className={`space-y-4 ${subTab === 2 ? 'block' : 'hidden lg:block'}`}>
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              ตารางอ้างอิงแรงดันและพิกัดน้ำยาแอร์สากล ({unitSystem})
            </h2>

            {refrigerantGuide.map(r => (
              <div key={r.type} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderLeft: `4px solid ${r.color}` }}>
                  <span className="mono font-black text-xl" style={{ color: r.color }}>{r.type}</span>
                  <span className="text-xs text-slate-400 font-semibold">{r.notes}</span>
                </div>
                <div className="px-4 pb-4.5 pt-2 grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">แรงดันเกจฝั่งต่ำ</p>
                    <p className="mono font-black text-sm text-white">{r.lowPressure[unitSystem]}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{unitSystem}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">แรงดันเกจฝั่งสูง</p>
                    <p className="mono font-black text-sm text-white">{r.highPressure[unitSystem]}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{unitSystem}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 text-center flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">กระแสทั่วไป</p>
                    <p className="text-xs font-black text-white leading-tight mt-0.5">{r.normalCurrent}</p>
                  </div>
                </div>
                {r.warning && (
                  <div className="mx-4 mb-3.5 flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: `${r.warningColor}12`, border: `1px solid ${r.warningColor}30` }}>
                    <span className="text-base mt-0.5">⚠️</span>
                    <p className="text-xs font-bold leading-normal" style={{ color: r.warningColor }}>{r.warning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* History records */}
        <div className={`space-y-4 ${subTab === 1 ? 'block' : 'hidden lg:block lg:mt-6'}`}>
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">รายการบันทึกประวัติการส่งงานล่าสุด</h2>

            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="job-search"
                type="text"
                placeholder="พิมพ์ชื่อลูกค้าหรือรุ่นแอร์เพื่อค้นหา..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {loadingHistory ? (
              <div className="space-y-2">
                {[1, 2, 3].map(idx => <div key={idx} className="shimmer h-14 rounded-xl" />)}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText size={36} className="mx-auto mb-2 opacity-25" />
                <p className="text-sm font-semibold">ไม่พบข้อมูลประวัติช่าง</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {filteredJobs.map((job, idx) => {
                  const expanded = expandedJobIdx === idx
                  let displayLocation = (job.location !== undefined && job.location !== null) ? job.location.toString() : ''
                  let displayPhone = (job.phone !== undefined && job.phone !== null) ? job.phone.toString() : ''
                  if (displayLocation.includes(' / ') && !displayPhone) {
                    const parts = displayLocation.split(' / ')
                    displayLocation = parts[0]
                    displayPhone = parts[1]
                  }
                  let displayNotes = (job.notes !== undefined && job.notes !== null) ? job.notes.toString() : ''
                  if (displayNotes.includes('ทดสอบการส่งข้อมูลอัตโนมัติเข้า Google Sheets สำเร็จเรียบร้อย!')) {
                    displayNotes = ''
                  }
                  return (
                    <div key={job.id || idx} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 text-left tap-target"
                        onClick={() => setExpandedJobIdx(expanded ? null : idx)}
                      >
                        <div>
                          <p className="font-bold text-white text-base leading-snug">{job.customer || 'ลูกค้าสแตนด์บาย'}</p>
                          <p className="text-xs text-slate-400 mt-1 font-semibold">
                            {job.brand || '-'} {job.model || '-'} · {job.refrigerant} · {new Date(job.created_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>
                      {expanded && (
                        <div className="border-t border-slate-800/80 bg-slate-950/20 px-4 py-3.5 grid grid-cols-2 gap-3 text-xs font-semibold">
                          {[
                            ['พิกัดตำแหน่ง', displayLocation],
                            ['เบอร์โทรศัพท์', displayPhone],
                            ['หมายเลขซีเรียล', job.serialNo],
                            [`แรงดันเกจฝั่งต่ำ ก่อน/หลัง`, `${job.lowBefore || '-'} / ${job.lowAfter || '-'} ${job.unit || 'PSI'}`],
                            [`แรงดันเกจฝั่งสูง ก่อน/หลัง`, `${job.highBefore || '-'} / ${job.highAfter || '-'} ${job.unit || 'PSI'}`],
                            ['กระแสคอมเพรสเซอร์', job.current ? `${job.current} A` : '-'],
                            ['ขนาดบีทียูคำนวณ', job.btu ? `${Number(job.btu).toLocaleString()} BTU` : '-'],
                          ].map(([lbl, val]) => (
                            <div key={lbl} className="bg-slate-900/30 p-2 rounded-lg border border-slate-900">
                              <p className="text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">{lbl}</p>
                              <p className="text-slate-200 text-sm font-bold">{val || '-'}</p>
                            </div>
                          ))}
                          {displayNotes && (
                            <div className="col-span-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900">
                              <p className="text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">หมายเหตุหน้างาน</p>
                              <p className="text-slate-300 text-sm">{displayNotes}</p>
                            </div>
                          )}

                          <div className="col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 mt-1">
                            <button
                              onClick={() => {
                                setForm({
                                  customer: job.customer || '',
                                  phone: displayPhone,
                                  location: displayLocation,
                                  model: job.model || '',
                                  brand: job.brand || '',
                                  refrigerant: job.refrigerant || 'R32',
                                  serialNo: job.serialNo || '',
                                  lowBefore: job.lowBefore || '',
                                  highBefore: job.highBefore || '',
                                  lowAfter: job.lowAfter || '',
                                  highAfter: job.highAfter || '',
                                  current: job.current || '',
                                  notes: displayNotes,
                                  lat: job.lat || '',
                                  lon: job.lon || '',
                                  laborFee: job.laborFee || '',
                                  materialFee: job.materialFee || '',
                                  discount: job.discount || '',
                                })
                                setSubTab(0)
                                document.getElementById('job-customer')?.scrollIntoView({ behavior: 'smooth' })
                              }}
                              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold transition-all tap-target"
                            >
                              <Download size={14} />
                              ดึงข้อมูลไปที่ฟอร์ม
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('คุณต้องการลบประวัติงานนี้ใช่หรือไม่?')) {
                                  await handleDeleteJob(job)
                                }
                              }}
                              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all tap-target"
                            >
                              <Trash2 size={14} />
                              ลบรายการนี้
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 5. Nameplate Scanner Tab Component (Simulator)
function NameplateScannerPanel({ onNavigate }) {
  const { setScannedJobData } = useCalculator()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const imageInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [cameraState, setCameraState] = useState('idle') // idle | requesting | active | denied | scanning | done
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)

  const MOCK_RESULTS = [
    { brand: 'Mitsubishi', model: 'MSY-KX13VF', serialNo: '24B098715', refrigerant: 'R32', notes: '' },
    { brand: 'Daikin', model: 'FTKQ12UV2S', serialNo: '23A0045821', refrigerant: 'R32', notes: '' },
    { brand: 'Carrier', model: '38MAQB012', serialNo: '22C003391', refrigerant: 'R410A', notes: '' },
  ]

  const startCamera = async () => {
    setCameraState('requesting')
    setError('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์ไม่รองรับกล้องเว็บแคมผ่าน HTTP (ต้องใช้เว็บแบบ HTTPS) หรือไม่มีสิทธิ์เข้าใช้งานกล้อง')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraState('active')
    } catch (err) {
      setCameraState('denied')
      setError(err.message || 'ไม่สามารถเปิดใช้งานกล้องในขณะนี้ได้ (ระบบจะเปิดระบบสแกนจำลองสำหรับตรวจสอบการติดตั้ง)')
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
    }, 2000)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setUploadedImage(evt.target.result)
      setCameraState('scanning')
      setTimeout(() => {
        const mock = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]
        setScanResult(mock)
        setScannedJobData(mock)
        setCameraState('done')
        setUploadedImage(null)
      }, 2500)
    }
    reader.readAsDataURL(file)
  }

  const handleUseData = () => {
    stopCamera()
    onNavigate(2) // Switch to Job Logger
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Camera size={24} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Nameplate Scanner (จำลอง)</h1>
          <p className="text-sm text-slate-400">ระบบจำลองการสกัดข้อความเพื่อกรอกข้อมูลแอร์แทนการเขียนพิมพ์</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Camera block */}
        <div className="card p-5 space-y-4">
          <div className="relative aspect-video bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraState === 'active' || cameraState === 'scanning' ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {cameraState === 'idle' && (
              <div className="text-center p-4 space-y-3">
                <Camera size={48} className="mx-auto text-slate-700 animate-pulse" />
                <p className="text-sm font-semibold text-slate-400">หน้าต่างกล้องพร้อมเปิดใช้งาน</p>
                {/* Dashed target overlay guideline */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1/2 border-2 border-dashed border-purple-500/40 rounded-xl relative">
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] text-purple-400 font-bold">วางเนมเพลทในกรอบนี้</span>
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl" />
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 border-t-2 border-r-2 border-purple-400 rounded-tr" />
                    <span className="absolute bottom-0.5 left-0.5 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl" />
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 border-b-2 border-r-2 border-purple-400 rounded-br" />
                  </div>
                </div>
              </div>
            )}

            {cameraState === 'requesting' && (
              <div className="text-center p-4 space-y-2.5">
                <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400">กำลังเข้าถึงกล้องหลังอุปกรณ์...</p>
              </div>
            )}

            {(cameraState === 'active') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-2 border-dashed border-purple-400/60 rounded-xl relative">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-950/80 px-2 text-[10px] text-purple-300 font-bold">เล็งเนมเพลทให้อยู่ในกรอบ</span>
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl" />
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 border-t-2 border-r-2 border-purple-400 rounded-tr" />
                  <span className="absolute bottom-0.5 left-0.5 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl" />
                  <span className="absolute bottom-0.5 right-0.5 w-4 h-4 border-b-2 border-r-2 border-purple-400 rounded-br" />
                </div>
              </div>
            )}

            {cameraState === 'scanning' && (
              <>
                <div className="scan-line" />
                <div className="absolute top-4 left-4 right-4 bg-slate-950/80 p-2.5 rounded-lg border border-purple-500/30 text-center animate-pulse">
                  <p className="text-xs font-black text-purple-400 tracking-wide">กำลังประมวลผลข้อความเพลทแอร์...</p>
                </div>
              </>
            )}

            {cameraState === 'done' && scanResult && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-3.5 animate-fadeInDown">
                <CheckCircle size={40} className="text-green-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">สแกนและสกัดคำสำเร็จ</p>
                  <p className="mono font-black text-sky-400 text-lg">{scanResult.brand} {scanResult.model}</p>
                  <p className="text-xs text-slate-300 mt-1 font-semibold">S/N: {scanResult.serialNo} · {scanResult.refrigerant}</p>
                </div>
              </div>
            )}

            {cameraState === 'denied' && (
              <div className="text-center p-5 space-y-3.5">
                <AlertCircle size={32} className="text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-400">{error}</p>
                <div className="flex flex-col gap-2 w-full">
                  <div className="block md:hidden w-full">
                    <label 
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-purple-500/30 bg-purple-500/20 text-purple-300 font-bold text-sm hover:bg-purple-500/30 transition-all cursor-pointer"
                    >
                      <Camera size={18} />
                      ถ่ายรูปด้วยกล้องจริงบนมือถือ (Native Camera)
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="absolute w-0 h-0 opacity-0 -z-10"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  <button onClick={handleScan} className="text-xs font-black text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 w-full">
                    คลิกเพื่อจำลองสแกนทันที (Bypass)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              {cameraState === 'idle' && (
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="hidden md:block w-full">
                    <button id="scanner-start" onClick={startCamera} className="btn-primary w-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                      <Camera size={20} />
                      เปิดระบบกล้องสแกนสด (Webcam)
                    </button>
                  </div>
                  <div className="block md:hidden w-full">
                    <label 
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 font-bold text-sm hover:bg-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                    >
                      <Camera size={18} />
                      ถ่ายรูปด้วยกล้องจริงบนมือถือ (Native Camera)
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="absolute w-0 h-0 opacity-0 -z-10"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              )}

              {cameraState === 'active' && (
                <button id="scanner-scan" onClick={handleScan} className="btn-primary">
                  <Scan size={20} />
                  เริ่มสแกนและประมวลผล
                </button>
              )}

              {cameraState === 'scanning' && (
                <button disabled className="btn-primary opacity-60 cursor-not-allowed">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังสแกน...
                </button>
              )}

              {cameraState === 'done' && (
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  <button id="scanner-use-data" onClick={handleUseData} className="btn-success">
                    <CheckCircle size={18} />
                    กรอกฟอร์มส่งงาน →
                  </button>
                  <button onClick={() => { setCameraState('active'); setScanResult(null) }} className="btn-secondary">
                    <Scan size={18} />
                    สแกนซ้ำอีกครั้ง
                  </button>
                </div>
              )}
            </div>

            {cameraState === 'idle' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-xs text-slate-500 font-bold">หรือ</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
                <label
                  id="scanner-upload"
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/5 text-purple-300 font-bold text-sm hover:border-purple-500/70 hover:bg-purple-500/10 transition-all cursor-pointer"
                >
                  <ImagePlus size={18} />
                  อัปโหลดรูปภาพเนมเพลทจากคลังภาพ
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute w-0 h-0 opacity-0 -z-10"
                    onChange={handleImageUpload}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Info detail block */}
        <div className="space-y-4">
          <div className="p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-2.5">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">💡 คู่มือการใช้สแกนเนอร์ AI</h3>
            <ul className="space-y-1.5 text-xs font-semibold text-slate-300 leading-relaxed">
              <li>1. เปิดระบบประมวลผลรูปโดยกด "เปิดระบบกล้องบันทึกเพลท"</li>
              <li>2. เล็งกล้องไปให้ตัวหนังสือเลข Serial หรือ Model ชัดเจนและกด "สแกน & วิเคราะห์"</li>
              <li>3. รอระบบประมวลผล 2 วินาที ตัวแปรที่สกัดได้จะอัปเดตลงใน สมุดบันทึกงาน โดยผู้ใช้ไม่ต้องพิมพ์</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// 6. Document Library Tab Component
function DocumentLibraryPanel() {
  const [search, setSearch] = useState('')
  const [activeBrands, setActiveBrands] = useState([])
  const [activeTypes, setActiveTypes] = useState([])
  const [activeCategories, setActiveCategories] = useState([])
  const [recentDocs, setRecentDocs] = useState([])
  const [viewedDoc, setViewedDoc] = useState(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
      setRecentDocs(stored)
    } catch {
      setRecentDocs([])
    }
  }, [])

  const addRecent = (doc) => {
    let list = recentDocs.filter(d => d.id !== doc.id)
    list.unshift(doc)
    list = list.slice(0, 3)
    setRecentDocs(list)
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list))
  }

  const toggleBrand = (b) => {
    setActiveBrands(prev => prev.includes(b) ? prev.filter(v => v !== b) : [...prev, b])
  }

  const toggleType = (t) => {
    setActiveTypes(prev => prev.includes(t) ? prev.filter(v => v !== t) : [...prev, t])
  }

  const toggleCategory = (c) => {
    setActiveCategories(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c])
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

  const brandColors = {
    Daikin: '#0ea5e9',
    Mitsubishi: '#e11d48',
    Carrier: '#2563eb',
    Panasonic: '#0891b2',
    Haier: '#16a34a',
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Library size={24} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">คลังคู่มือติดตั้ง & วงจรไฟฟ้า</h1>
          <p className="text-sm text-slate-400">ค้นหาคู่มือเทคนิคแอร์ไทยจากแบรนด์ชั้นนำ</p>
        </div>
      </div>

      {viewedDoc ? (
        <div className="card p-5 space-y-4 animate-fadeInDown">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <button
              onClick={() => setViewedDoc(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
            >
              ← ย้อนกลับ
            </button>
            <h2 className="text-base font-bold text-white leading-snug">{viewedDoc.title}</h2>
            {viewedDoc.url && (
              <a
                href={viewedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold hover:bg-sky-500/25"
              >
                <ExternalLink size={12} />
                เปิดในแท็บใหม่
              </a>
            )}
          </div>

          {viewedDoc.url ? (
            <div className="w-full rounded-xl overflow-hidden border border-slate-800" style={{ height: '70vh' }}>
              <iframe
                src={viewedDoc.url}
                title={viewedDoc.title}
                className="w-full h-full"
                style={{ minHeight: '500px' }}
              />
            </div>
          ) : (
            <div className="aspect-[3/4] max-w-sm mx-auto bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center justify-center gap-4 text-center p-4">
              <FileText size={56} className="text-slate-700 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-white">{viewedDoc.brand} — {viewedDoc.model}</p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">{viewedDoc.pages} หน้า · ปี {viewedDoc.year}</p>
                <p className="text-xs text-slate-600 mt-4 leading-relaxed font-semibold">
                  ไฟล์ PDF ยังไม่ได้อัพโหลดสำหรับรายการนี้
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ['แบรนด์แอร์', viewedDoc.brand],
              ['รหัสรุ่น', viewedDoc.model],
              ['เทคโนโลยีคอม', viewedDoc.type],
              ['ประเภทไฟล์', viewedDoc.category],
              ['ขนาดไฟล์เอกสาร', `${viewedDoc.pages} หน้า`],
            ].map(([lbl, val]) => (
              <div key={lbl} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                <p className="text-slate-500 uppercase tracking-wide text-[9px] font-bold">{lbl}</p>
                <p className="text-slate-200 text-sm font-bold mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Filters Column */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">ตัวกรองเอกสาร</h2>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="lib-search"
                type="text"
                placeholder="ค้นชื่องานคู่มือ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">แบรนด์แอร์</p>
                <div className="flex flex-wrap gap-1.5">
                  {brands.map(b => (
                    <button
                      key={b}
                      onClick={() => toggleBrand(b)}
                      className={`chip ${activeBrands.includes(b) ? 'active' : ''}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">ชนิดบอร์ดควบคุม</p>
                <div className="flex flex-wrap gap-1.5">
                  {types.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`chip ${activeTypes.includes(t) ? 'active' : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">หมวดคู่มือเอกสาร</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleCategory(c)}
                      className={`chip ${activeCategories.includes(c) ? 'active' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    setActiveBrands([])
                    setActiveTypes([])
                    setActiveCategories([])
                    setSearch('')
                  }}
                  className="text-xs text-sky-400 font-bold hover:underline"
                >
                  ล้างตัวกรองทั้งหมด ×
                </button>
              )}
            </div>
          </div>

          {/* List Docs Column */}
          <div className="lg:col-span-2 space-y-4">
            {recentDocs.length > 0 && !hasFilters && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} /> รายการโปรดล่าสุด / เปิดดูล่าสุด
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentDocs.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        addRecent(doc)
                        setViewedDoc(doc)
                      }}
                      className="card p-3 text-left border-amber-500/25 hover:border-amber-500/50 hover:bg-slate-800 transition-all flex items-start gap-2.5 tap-target"
                    >
                      <FileText size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 line-clamp-1">{doc.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{doc.brand} · {doc.model}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                เอกสารทั้งหมดในระบบคลัง ({filtered.length} รายการ)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(doc => (
                  <div
                    key={doc.id}
                    className="card p-4 flex items-start gap-3 border border-slate-800"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: `${brandColors[doc.brand]}15` }}>
                      <FileText size={20} style={{ color: brandColors[doc.brand] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white leading-snug line-clamp-2">{doc.title}</p>
                      <p className="text-xs text-slate-500 mt-1 font-bold">{doc.brand} · {doc.model} · {doc.pages} หน้า · ปี {doc.year}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="badge badge-blue text-[9px]">{doc.type}</span>
                        <span className="badge badge-orange text-[9px]">{doc.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {doc.url ? (
                          <a
                            id={`doc-view-${doc.id}`}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => addRecent(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold hover:bg-sky-500/25 transition-all tap-target"
                            title="เปิดอ่าน PDF"
                          >
                            <Eye size={12} />
                            เปิดอ่าน PDF
                          </a>
                        ) : (
                          <button
                            id={`doc-view-${doc.id}`}
                            onClick={() => { addRecent(doc); setViewedDoc(doc) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-700 text-slate-400 text-xs font-bold transition-all tap-target"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={12} />
                            รายละเอียด
                          </button>
                        )}
                        <button
                          id={`doc-bookmark-${doc.id}`}
                          onClick={() => addRecent(doc)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all tap-target ${
                            recentDocs.some(d => d.id === doc.id)
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                          title="บันทึกสำหรับโปรด"
                        >
                          <Star size={12} />
                          {recentDocs.some(d => d.id === doc.id) ? 'โปรดแล้ว' : 'บันทึก'}
                        </button>
                        <button
                          id={`doc-download-${doc.id}`}
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = '#'
                            link.download = `${doc.title}.pdf`
                            alert(`กำลังดาวน์โหลด: ${doc.title} (ระบบจำลอง — เชื่อมต่อ Cloud Storage เพื่อดาวน์โหลดไฟล์จริง)`)
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-700 transition-all tap-target"
                          title="ดาวน์โหลด PDF"
                        >
                          <Download size={12} />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 7. Settings Tab Component
function SettingsPanel() {
  const { 
    unitSystem, setUnitSystem, 
    fontSize, setFontSize, 
    powerSaving, setPowerSaving, 
    appTheme, setAppTheme,
    shopName, setShopName,
    shopAddress, setShopAddress,
    promptPayId, setPromptPayId,
    user, setUser
  } = useApp()

  const fontOptions = [
    { label: 'ปกติ', value: 'normal' },
    { label: 'ใหญ่', value: 'large' },
    { label: 'ใหญ่พิเศษ', value: 'xl' },
    { label: 'สายตายาว', value: 'xxl' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
          <Settings size={24} className="text-slate-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">ตั้งค่าระบบการทำงาน</h1>
          <p className="text-sm text-slate-400">ปรับเปลี่ยนการแสดงผลและโหมดประหยัดพลังงาน</p>
        </div>
      </div>

      {/* Account Settings Card */}
      {user && (
        <div className="card p-5 space-y-4 bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white">
                👤
              </div>
              <div>
                <p className="text-sm font-bold text-white">บัญชีผู้ใช้งานปัจจุบัน</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">ช่างปฏิบัติงานในระบบ</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUser(null)}
              className="py-1.5 px-3.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold active:scale-95 transition-all text-xs cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-slate-350">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ชื่อช่าง</p>
              <p className="text-white text-sm font-black">{user.name}</p>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ประเภทบัญชี</p>
              <p className="text-white text-sm font-black">
                {user.role === 'admin' ? '🛡️ แอดมิน (เจ้าของร้าน)' : '🛠️ ช่างเทคนิค'}
              </p>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">เบอร์ติดต่อ</p>
              <p className="text-white text-sm font-black mono">{user.phone || '-'}</p>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">พร้อมเพย์ ID</p>
              <p className="text-white text-sm font-black mono">{user.promptpay_id || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Theme Switcher Card ─────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <span className="text-base">{appTheme === 'dark' ? '🌙' : '☀️'}</span>
          </div>
          <div>
            <p className="text-base font-bold text-white">ธีมสีหน้าจอแบบสากล</p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">เปลี่ยนโทนสีเพื่อให้เหมาะกับสภาพแสงหน้างาน</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            id="theme-dark-btn"
            onClick={() => setAppTheme('dark')}
            className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
              appTheme === 'dark'
                ? 'border-sky-500 bg-sky-500/10'
                : 'border-slate-700 bg-slate-900 opacity-60 hover:opacity-90'
            }`}
          >
            {appTheme === 'dark' && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">✓</span>
              </span>
            )}
            <div className="text-2xl mb-2">🌙</div>
            <p className="text-sm font-black text-white leading-tight">Dark Mode</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">สู้แดดจัด ถนอมสายตา</p>
            <div className="flex gap-1 mt-2.5">
              <div className="w-5 h-2 rounded-full bg-slate-950" />
              <div className="w-5 h-2 rounded-full bg-slate-800" />
              <div className="w-5 h-2 rounded-full bg-sky-500" />
            </div>
          </button>
          <button
            id="theme-light-btn"
            onClick={() => setAppTheme('light')}
            className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
              appTheme === 'light'
                ? 'border-blue-500 bg-blue-50/10'
                : 'border-slate-700 bg-slate-900 opacity-60 hover:opacity-90'
            }`}
          >
            {appTheme === 'light' && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">✓</span>
              </span>
            )}
            <div className="text-2xl mb-2">☀️</div>
            <p className="text-sm font-black text-white leading-tight">Light Mode</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">สะอาด คมชัด สำนักงาน</p>
            <div className="flex gap-1 mt-2.5">
              <div className="w-5 h-2 rounded-full bg-slate-100" />
              <div className="w-5 h-2 rounded-full bg-white border border-slate-300" />
              <div className="w-5 h-2 rounded-full bg-blue-600" />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Unit & Size controls */}
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div>
              <p className="text-base font-bold text-white">หน่วยวัดแรงดันน้ำยาแอร์</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">ส่งผลต่อค่าแรงดันเกจในตารางและแบบฟอร์ม</p>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['PSI', 'Bar'].map(unit => (
                <button
                  key={unit}
                  onClick={() => setUnitSystem(unit)}
                  className={`py-2 px-4 rounded-lg text-xs font-black transition-all ${
                    unitSystem === unit
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-500 active:text-slate-300'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-3.5 border-b border-slate-800">
            <div>
              <p className="text-base font-bold text-white">ตัวปรับขนาดฟอนต์อ่านง่าย (สู้แดดจัด)</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">ขยายอักษรไทยให้มีขนาดใหญ่ชัดเจน</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {fontOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFontSize(opt.value)}
                  className={`py-2.5 px-2 rounded-lg text-xs font-black transition-all ${
                    fontSize === opt.value
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-500 active:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">โหมดประหยัดพลังงาน (Pure Black)</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">ปรับพื้นหลังดำสนิทเพื่อประหยัดแบตหน้างาน</p>
            </div>
            <button
              onClick={() => setPowerSaving(p => !p)}
              className={`toggle-track ${powerSaving ? 'on' : ''}`}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Billing & Payment Settings */}
        <div className="card p-5 space-y-4">
          <div>
            <p className="text-base font-bold text-white">ข้อมูลสำหรับออกใบเสร็จ & รับเงิน</p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">ใช้พิมพ์บนหัวใบเสร็จ PDF และสร้างพร้อมเพย์ QR Code</p>
          </div>
          <div className="space-y-3.5 pt-1">
            <div>
              <label className="label mb-1">ชื่อร้านค้า / ชื่อช่าง</label>
              <input
                type="text"
                placeholder="เช่น ช่างเจริญ แอร์บริการ"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="input-field text-sm font-semibold"
              />
            </div>
            <div>
              <label className="label mb-1">เบอร์โทรติดต่อ / ที่อยู่ร้าน</label>
              <input
                type="text"
                placeholder="เช่น โทร. 089-1234567 / 123/45 จ.กรุงเทพฯ"
                value={shopAddress}
                onChange={e => setShopAddress(e.target.value)}
                className="input-field text-sm font-semibold"
              />
            </div>
            <div>
              <label className="label mb-1">หมายเลขพร้อมเพย์รับชำระเงิน (PromptPay ID)</label>
              <input
                type="text"
                placeholder="ไม่มีข้อมูลในระบบ"
                value={promptPayId || 'EMPTY'}
                readOnly
                className="input-field text-sm font-semibold mono opacity-70 bg-slate-900/50 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500 font-bold mt-1 leading-tight">
                * อ่านข้อมูลจากฐานข้อมูลเท่านั้น (หากต้องการแก้ไขให้แก้ไขใน Supabase โดยตรง)
              </p>
            </div>
          </div>
        </div>

        {/* Preview and tips */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3 bg-slate-900/30">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">พรีวิวจำลองขนาดหน้าจอ</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-slate-400 text-xs font-bold">พรีวิวข้อความภาษาไทย:</p>
              <h4 className="text-lg font-black text-white leading-normal">แอร์บัดดี้โปรสำหรับช่างแอร์ไทย</h4>
              <p className="text-sm text-slate-300 font-semibold">
                แรงดันเกจสแตนดาร์ด R32: <span className="mono font-bold text-sky-400">120 PSI (8.27 Bar)</span>
              </p>
              <p className="text-xs text-slate-500 font-bold">
                ขนาดตัวอักษรจะปรับเปลี่ยนทันทีตามระดับที่ท่านเลือก
              </p>
            </div>
          </div>

          {/* Cloud & AI Diagnostics Card */}
          <div className="card p-5 space-y-3 bg-slate-900/30">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔌</span> การเชื่อมต่อฐานข้อมูล & AI
            </h3>
            
            <div className="space-y-3 pt-1">
              {/* Supabase Status */}
              <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">ตารางข้อมูล Supabase</span>
                  {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/30">ตั้งค่าแล้ว</span>
                  ) : (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold border border-red-500/30">ไม่ได้ตั้งค่า</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-mono break-all leading-relaxed">
                  {import.meta.env.VITE_SUPABASE_URL 
                    ? import.meta.env.VITE_SUPABASE_URL.substring(0, 45) + "..." 
                    : "ไม่มีข้อมูล URL (โปรดเช็ค VITE_SUPABASE_URL ในตัวแปร)"}
                </p>
                {supabase && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.from('job_records').select('id').limit(1)
                        if (!error) {
                          alert("🟢 เชื่อมต่อสำเร็จ! สามารถดึงประวัติจาก Supabase ได้แล้ว")
                        } else {
                          alert(`❌ เชื่อมต่อล้มเหลว: ${error.message}`)
                        }
                      } catch (err) {
                        alert(`❌ เชื่อมต่อล้มเหลว: ${err.message}`)
                      }
                    }}
                    className="mt-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-lg text-[10px] font-bold text-white text-center transition-colors border border-slate-700 cursor-pointer"
                  >
                    ทดสอบการดึงข้อมูล Supabase
                  </button>
                )}
              </div>

              {/* Gemini Status */}
              <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">ตัวช่วยวิเคราะห์ AI (Gemini)</span>
                  {import.meta.env.VITE_GEMINI_API_KEY ? (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/30">ตั้งค่าแล้ว</span>
                  ) : (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold border border-red-500/30">ไม่ได้ตั้งค่า</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-mono break-all leading-relaxed">
                  {import.meta.env.VITE_GEMINI_API_KEY 
                    ? "AQ-gemini-..." + import.meta.env.VITE_GEMINI_API_KEY.substring(10, 22) + "..." 
                    : "ไม่มีข้อมูล Key (โปรดเช็ค VITE_GEMINI_API_KEY ในตัวแปร Vercel)"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-sky-500/5 border border-sky-500/25 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>💡</span> ข้อมูลแอปลิเคชันสถิติ
            </h3>
            <ul className="space-y-1 text-xs font-bold text-slate-300 leading-relaxed">
              <li>• พัฒนาโดยอิงตามเกณฑ์พิกัดมาตรฐานระบบช่างประเทศไทย</li>
              <li>• การซิงค์ออนไลน์จะประมวลผลทันทีที่สัญญาณมือถือกลับมา</li>
              <li>• ใช้โหมด Pure OLED Black จะช่วยถนอมสายตากลางแดดจัด</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN SCREEN COMPONENT ──────────────────────────────────────────────────
function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
      return
    }
    setError('')
    setLoading(true)

    try {
      if (!supabase) {
        throw new Error('ระบบยังไม่ได้ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY')
      }

      // Format username as email if needed since Supabase Auth requires an email format
      let loginEmail = username.trim()
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@airbuddy.local`
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password.trim(),
      })

      if (authError) {
        throw new Error(authError.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.warn('Could not fetch user profile details:', profileError)
      }

      const userObject = {
        user_id: authData.user.id,
        username: username.trim(),
        name: profile?.name || username.trim(),
        phone: formatPhoneOrPromptPay(profile?.phone || ''),
        promptpay_id: formatPhoneOrPromptPay(profile?.promptpay_id || ''),
        role: profile?.role || 'technician'
      }
      
      onLoginSuccess(userObject)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการล็อกอิน โปรดตรวจสอบอินเทอร์เน็ต')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      {/* Background gradients for premium glassmorphism vibe */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wind className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-black gradient-text tracking-tight mt-4">เข้าสู่ระบบ Air Buddy Pro</h2>
          <p className="text-sm text-slate-400">ระบบบันทึกงานช่างแอร์มืออาชีพ</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="username">ชื่อผู้ใช้งาน (Username)</label>
            <input
              id="username"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 text-white placeholder-slate-600 outline-none transition-all"
              placeholder="กรอกชื่อผู้ใช้..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password">รหัสผ่าน (Password)</label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-955 border border-slate-850 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 text-white placeholder-slate-600 outline-none transition-all"
              placeholder="กรอกรหัสผ่าน..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 active:scale-[0.98] transition-all rounded-xl font-bold text-white shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 tap-target disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500">Air Buddy Pro v1.2.0 © 2026</p>
        </div>
      </div>
    </div>
  )
}

// ─── ADMIN DASHBOARD PANEL ───────────────────────────────────────────────────
function AdminDashboardPanel() {
  const { isOnline, appTheme, user } = useApp()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedJobId, setExpandedJobId] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedTech, setSelectedTech] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch all jobs for admin
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAllJobs(user)
        setJobs(data || [])
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err)
        setError('ไม่สามารถดึงข้อมูลประวัติงานรวมได้')
      } finally {
        setLoading(false)
      }
    }
    if (user && user.role === 'admin') {
      fetchAdminData()
    }
  }, [user, refreshTrigger])

  // Compute stats
  const totalJobs = jobs.length
  
  const totalRevenue = jobs.reduce((sum, j) => {
    const labor = parseFloat(j.laborFee) || 0
    const material = parseFloat(j.materialFee) || 0
    const discount = parseFloat(j.discount) || 0
    return sum + Math.max(0, labor + material - discount)
  }, 0)

  // Unique technician count and leaderboard calculation
  const techLeaderboardMap = {}
  jobs.forEach(j => {
    const techId = j.tech_id || 'unknown'
    const techName = j.tech_name || 'ช่างไม่ระบุชื่อ'
    const labor = parseFloat(j.laborFee) || 0
    const material = parseFloat(j.materialFee) || 0
    const discount = parseFloat(j.discount) || 0
    const net = Math.max(0, labor + material - discount)

    if (!techLeaderboardMap[techId]) {
      techLeaderboardMap[techId] = {
        id: techId,
        name: techName,
        jobCount: 0,
        revenue: 0
      }
    }
    techLeaderboardMap[techId].jobCount += 1
    techLeaderboardMap[techId].revenue += net
  })

  const leaderboard = Object.values(techLeaderboardMap).sort((a, b) => b.revenue - a.revenue)
  const activeTechCount = leaderboard.length

  // Filter lists
  const uniqueTechs = Array.from(new Set(jobs.map(j => JSON.stringify({ id: j.tech_id || 'unknown', name: j.tech_name || 'ช่างไม่ระบุชื่อ' }))))
    .map(str => JSON.parse(str))

  const uniqueBrands = Array.from(new Set(jobs.map(j => j.brand).filter(Boolean)))

  // Apply filters
  const filteredJobs = jobs.filter(j => {
    const searchText = search.toLowerCase()
    const matchesSearch = !search || 
      (j.customer || '').toLowerCase().includes(searchText) ||
      (j.model || '').toLowerCase().includes(searchText) ||
      (j.serialNo || '').toLowerCase().includes(searchText) ||
      (j.tech_name || '').toLowerCase().includes(searchText)

    const matchesTech = selectedTech === 'all' || (j.tech_id || 'unknown') === selectedTech
    const matchesBrand = selectedBrand === 'all' || j.brand === selectedBrand

    let matchesDate = true
    if (j.created_at) {
      const jobDate = new Date(j.created_at)
      jobDate.setHours(0, 0, 0, 0)
      
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (jobDate < start) matchesDate = false
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (jobDate > end) matchesDate = false
      }
    }

    return matchesSearch && matchesTech && matchesBrand && matchesDate
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">แดชบอร์ดแอดมิน (Admin Analytics)</h1>
            <p className="text-sm text-slate-400">สรุปยอดรวมผลงาน รายรับ และรายละเอียดของช่างแอร์ทุกคน</p>
          </div>
        </div>
        <button
          onClick={() => setRefreshTrigger(t => t + 1)}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-sm cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw size={16} />
          รีเฟรชข้อมูล
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 relative overflow-hidden bg-slate-900/40 border border-slate-800">
          <div className="absolute right-4 top-4 text-3xl opacity-20">💼</div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">งานสำเร็จทั้งหมด</p>
          <h3 className="text-3xl font-black text-white mt-1.5 leading-none">
            {loading ? <span className="text-xl text-slate-500">กำลังโหลด...</span> : totalJobs.toLocaleString()} งาน
          </h3>
          <p className="text-[10px] text-slate-505 font-semibold mt-2">ยอดสะสมจากการบันทึกผ่านระบบ</p>
        </div>

        <div className="card p-5 relative overflow-hidden bg-slate-900/40 border border-slate-800">
          <div className="absolute right-4 top-4 text-3xl opacity-20">💰</div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">รายรับสะสมรวม</p>
          <h3 className="text-3xl font-black text-emerald-400 mt-1.5 leading-none">
            {loading ? <span className="text-xl text-slate-500">กำลังโหลด...</span> : `${totalRevenue.toLocaleString('th-TH')} บาท`}
          </h3>
          <p className="text-[10px] text-slate-550 font-semibold mt-2">คำนวณสุทธิหลังหักส่วนลดทั้งหมด</p>
        </div>

        <div className="card p-5 relative overflow-hidden bg-slate-900/40 border border-slate-800">
          <div className="absolute right-4 top-4 text-3xl opacity-20">👥</div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ช่างปฏิบัติงานทั้งหมด</p>
          <h3 className="text-3xl font-black text-indigo-400 mt-1.5 leading-none">
            {loading ? <span className="text-xl text-slate-500">กำลังโหลด...</span> : `${activeTechCount} คน`}
          </h3>
          <p className="text-[10px] text-slate-550 font-semibold mt-2">จำนวนบัญชีผู้ใช้งานที่ส่งข้อมูลบันทึกประวัติ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1 bg-slate-900/40 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              🏆 ลีดเดอร์บอร์ดช่างแอร์ (Tech Leaderboard)
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">จัดอันดับช่างตามยอดรายได้รวมของงานที่ทำสำเร็จ</p>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="shimmer h-12 rounded-xl" />)
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-slate-505 text-center py-4">ไม่มีข้อมูลการปฏิบัติงาน</p>
            ) : (
              leaderboard.map((tech, idx) => (
                <div key={tech.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-400/30' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-snug">{tech.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{tech.jobCount} งานสำเร็จ</p>
                    </div>
                  </div>
                  <p className="text-sm font-extrabold text-white mono">
                    {tech.revenue.toLocaleString('th-TH')} ฿
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2 bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h3 className="text-base font-bold text-white">🗂️ ประวัติบันทึกงานรวม (Master Logs)</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                ประวัติงานซ่อมแอร์ทั้งหมดจากพนักงานในระบบ (กรองได้ตามผู้ใช้และช่วงวัน)
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 self-start sm:self-auto">
              พบ {filteredJobs.length} งานจากคัดกรอง
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-505">ค้นหาลูกค้า/ซีเรียล</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหา..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold focus:border-indigo-500/80 outline-none text-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">เลือกช่างแอร์</label>
              <select
                value={selectedTech}
                onChange={e => setSelectedTech(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:border-indigo-500/80 outline-none transition-colors"
              >
                <option value="all">ทั้งหมดทุกคน</option>
                {uniqueTechs.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">แบรนด์แอร์</label>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:border-indigo-500/80 outline-none transition-colors"
              >
                <option value="all">ทุกแบรนด์</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:border-indigo-500/80 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:border-indigo-500/80 outline-none transition-colors"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSelectedTech('all')
                  setSelectedBrand('all')
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 active:scale-95 transition-all text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="shimmer h-14 rounded-xl" />)
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-950/20 rounded-xl border border-slate-850">
                <FileText size={36} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold">ไม่พบประวัติงานซ่อมตรงตามตัวกรองที่เลือก</p>
              </div>
            ) : (
              filteredJobs.map((job, idx) => {
                const expanded = expandedJobId === job.id
                const labor = parseFloat(job.laborFee) || 0
                const material = parseFloat(job.materialFee) || 0
                const discount = parseFloat(job.discount) || 0
                const net = Math.max(0, labor + material - discount)

                return (
                  <div key={job.id || idx} className="bg-slate-955/30 border border-slate-850 rounded-xl overflow-hidden hover:border-slate-800 transition-colors">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left tap-target"
                      onClick={() => setExpandedJobId(expanded ? null : job.id)}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-base leading-snug truncate">{job.customer || 'ลูกค้าไม่ระบุชื่อ'}</p>
                          <span className="text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                            👤 {job.tech_name || 'ช่างทั่วไป'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                          {job.brand || '-'} {job.model || '-'} · {job.refrigerant || '-'} · {new Date(job.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-white mono">{net.toLocaleString('th-TH')} ฿</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">สุทธิ</p>
                        </div>
                        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-slate-855 bg-slate-950/50 px-4 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                        {[
                          ['ช่างผู้บันทึก', `${job.tech_name || '-'} (${job.tech_id || '-'})`],
                          ['เบอร์ลูกค้า', job.phone || '-'],
                          ['พิกัดตำแหน่ง', job.location || '-'],
                          ['หมายเลขซีเรียล', job.serialNo || '-'],
                          [`แรงดันเกจฝั่งต่ำ ก่อน/หลัง`, `${job.lowBefore || '-'} / ${job.lowAfter || '-'} ${job.unit || 'PSI'}`],
                          [`แรงดันเกจฝั่งสูง ก่อน/หลัง`, `${job.highBefore || '-'} / ${job.highAfter || '-'} ${job.unit || 'PSI'}`],
                          ['กระแสคอมเพรสเซอร์', job.current ? `${job.current} A` : '-'],
                          ['ขนาดบีทียูคำนวณ', job.btu ? `${Number(job.btu).toLocaleString()} BTU` : '-'],
                          ['ค่าบริการ / ค่าแรงช่าง', job.laborFee ? `${Number(job.laborFee).toLocaleString()} ฿` : '-'],
                          ['ค่าอะไหล่ / น้ำยาแอร์', job.materialFee ? `${Number(job.materialFee).toLocaleString()} ฿` : '-'],
                          ['ส่วนลดการบริการ', job.discount ? `-${Number(job.discount).toLocaleString()} ฿` : '-'],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850/80">
                            <p className="text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">{lbl}</p>
                            <p className="text-slate-200 text-sm font-bold break-all leading-tight">{val || '-'}</p>
                          </div>
                        ))}
                        {job.notes && (
                          <div className="col-span-2 sm:col-span-4 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850/80">
                            <p className="text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">หมายเหตุหน้างาน</p>
                            <p className="text-slate-350 text-sm leading-relaxed">{job.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP COMPONENT ──────────────────────────────────────────────────────
function MainAppContent() {
  const { powerSaving, isOnline, appTheme, user, setUser } = useApp()
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 6 : 0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Redirect on user role change
  useEffect(() => {
    if (user?.role === 'admin') {
      setActiveTab(6)
    } else {
      setActiveTab(0)
    }
  }, [user])

  // Offline syncing indicator when coming back online
  useEffect(() => {
    if (isOnline) {
      syncQueue()
    }
  }, [isOnline])

  if (!user) {
    return <LoginScreen onLoginSuccess={(loggedInUser) => {
      setUser(loggedInUser)
      if (loggedInUser.promptpay_id) {
        setPromptPayId(loggedInUser.promptpay_id)
      }
    }} />
  }

  // Dynamic tabs configuration based on role
  const availableTabs = [
    { id: 0, label: 'คำนวณ', iconOutline: CalcOutline, iconSolid: CalcSolid },
    { id: 1, label: 'วิเคราะห์อาการ', iconOutline: WrenchOutline, iconSolid: WrenchSolid },
    { id: 2, label: 'บันทึกงาน', iconOutline: ClipboardOutline, iconSolid: ClipboardSolid },
    { id: 3, label: 'สแกนเพลท', iconOutline: CameraOutline, iconSolid: CameraSolid },
    { id: 4, label: 'คลังคู่มือ', iconOutline: LibraryOutline, iconSolid: LibrarySolid },
    { id: 5, label: 'ตั้งค่าระบบ', iconOutline: SettingsOutline, iconSolid: SettingsSolid },
  ]
  if (user.role === 'admin') {
    availableTabs.push({ id: 6, label: 'แดชบอร์ดแอดมิน', iconOutline: BarChart2, iconSolid: BarChart2 })
  }

  const mainSidebarTabs = user.role === 'admin'
    ? [availableTabs.find(t => t.id === 6), ...availableTabs.filter(t => t.id < 4)].filter(Boolean)
    : availableTabs.filter(t => t.id < 4)

  const mobileBottomTabs = user.role === 'admin'
    ? [availableTabs.find(t => t.id === 6), ...availableTabs.filter(t => t.id < 3)].filter(Boolean)
    : availableTabs.filter(t => t.id < 4)

  const drawerTabs = availableTabs.filter(t => t.id === 4 || t.id === 5)

  return (
    <div className={`min-h-screen w-full flex ${
      powerSaving ? 'bg-black text-white' :
      appTheme === 'light' ? 'bg-slate-50 text-slate-900' :
      'bg-slate-955 text-slate-100'
    } transition-colors duration-200`}>

      {/* Sidebar Navigation - Tablet & Desktop */}
      <aside className={`hidden md:flex flex-col w-64 border-r p-5 shrink-0 ${
        powerSaving ? 'bg-black border-slate-900' :
        appTheme === 'light' ? 'bg-white border-slate-200' :
        'border-slate-800/80 bg-slate-900/40 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
            <Wind className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-black text-lg gradient-text tracking-tight leading-tight">Air Buddy Pro</h1>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              appTheme === 'light' ? 'text-slate-500' : 'text-slate-500'
            }`}>เครื่องมือสากลช่างไทย</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {mainSidebarTabs.map(({ id, label, iconOutline: IconOutline, iconSolid: IconSolid }) => {
            const active = activeTab === id
            const Icon = active ? IconSolid : IconOutline
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold transition-all text-left border tap-target ${
                  active
                    ? appTheme === 'light'
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 shadow-inner'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-inner'
                    : appTheme === 'light'
                      ? 'bg-transparent border-transparent text-slate-655 hover:bg-slate-100 hover:text-slate-900'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${active
                  ? appTheme === 'light' ? 'text-blue-600' : 'text-indigo-400'
                  : appTheme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <span className="text-base">{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          {isOnline ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold bg-green-500/10 text-green-400">
              <Wifi size={18} />
              <span>เชื่อมต่อเครือข่าย</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl border-2 font-bold bg-red-500/15 border-red-500/50 text-red-300 animate-pulse">
              <WifiOff size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs leading-tight">⚠️ โหมดออฟไลน์ — กำลังบันทึกข้อมูลในเครื่องชั่วคราว</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Top Header Bar on All Screen Sizes */}
        <header className={`flex items-center justify-between px-4 md:px-6 py-3.5 border-b shrink-0 ${
          powerSaving ? 'bg-black border-slate-900' :
          appTheme === 'light' ? 'bg-white border-slate-200 shadow-sm' :
          'border-slate-900 bg-slate-900/60 backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
              <Wind className="text-white" size={16} />
            </div>
            <h1 className="font-black text-base md:text-lg text-white tracking-tight">
              {availableTabs.find(t => t.id === activeTab)?.label || 'Air Buddy Pro'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full animate-pulse">
                <WifiOff size={12} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400">Offline</span>
              </div>
            )}
            {isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <Wifi size={12} className="text-green-400" />
                <span className="text-[10px] font-black text-green-400">Online</span>
              </div>
            )}
            <button
              id="hamburger-menu-btn"
              onClick={() => setIsDrawerOpen(true)}
              className={`p-2 rounded-xl transition-all border tap-target flex items-center justify-center ${
                appTheme === 'light' 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Container - All panels mounted for state preservation */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6 relative content-area">
          <div className="max-w-7xl mx-auto w-full">
            <div className={activeTab === 0 ? 'block' : 'hidden'}>
              <CombinedCalculatorPanel />
            </div>
            <div className={activeTab === 1 ? 'block' : 'hidden'}>
              <DiagnosticPanel />
            </div>
            <div className={activeTab === 2 ? 'block' : 'hidden'}>
              <JobLoggerPanel />
            </div>
            <div className={activeTab === 3 ? 'block' : 'hidden'}>
              <NameplateScannerPanel onNavigate={(idx) => setActiveTab(idx)} />
            </div>
            <div className={activeTab === 4 ? 'block' : 'hidden'}>
              <DocumentLibraryPanel />
            </div>
            <div className={activeTab === 5 ? 'block' : 'hidden'}>
              <SettingsPanel />
            </div>
            {user.role === 'admin' && (
              <div className={activeTab === 6 ? 'block' : 'hidden'}>
                <AdminDashboardPanel />
              </div>
            )}
          </div>
        </main>

        {/* Bottom Navigation - Mobile Devices */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t ${
          powerSaving ? 'bg-black border-slate-900' :
          appTheme === 'light' ? 'bg-white/85 backdrop-blur-md border-slate-200/85 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]' :
          'border-slate-900/60 bg-slate-950/80 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.2)]'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 8px)' }}
        >
          <div className="flex items-stretch justify-around pt-2.5 px-3">
            {mobileBottomTabs.map(({ id, label, iconOutline: IconOutline, iconSolid: IconSolid }) => {
              const active = activeTab === id
              const Icon = active ? IconSolid : IconOutline
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 tap-target group"
                  style={{ minHeight: '56px' }}
                >
                  {/* Icon container with bounce animation */}
                  <div className={`transition-all duration-300 transform active:scale-90 hover:scale-110 ${
                    active ? 'scale-110 text-indigo-650 dark:text-indigo-400 -translate-y-1' : 'text-slate-400 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-400'
                  }`}>
                    <Icon className="w-6 h-6 transition-transform duration-350 ease-spring" />
                  </div>
                  {/* Dot/Indicator below active icon */}
                  {active && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  )}
                  {/* Label */}
                  <span className={`text-[10px] mt-1 font-bold tracking-wide transition-all duration-200 ${
                    active ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-655'
                  }`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Slide-out Hamburger Menu Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <nav className={`relative w-72 max-w-[80vw] h-full flex flex-col justify-between p-6 shadow-2xl transition-transform duration-300 ${
            powerSaving ? 'bg-black border-l border-slate-900 text-white' :
            appTheme === 'light' ? 'bg-white border-l border-slate-200 text-slate-900' :
            'bg-slate-955 border-l border-slate-900 text-slate-100'
          }`}>
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-black text-lg">เมนูเพิ่มเติม</h3>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    appTheme === 'light'
                      ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="space-y-2.5">
                {drawerTabs.map(({ id, label, iconOutline: IconOutline, iconSolid: IconSolid }) => {
                  const active = activeTab === id
                  const Icon = active ? IconSolid : IconOutline
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id)
                        setIsDrawerOpen(false)
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold transition-all text-left border tap-target ${
                        active
                          ? appTheme === 'light'
                            ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 shadow-inner'
                            : 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-inner'
                          : appTheme === 'light'
                            ? 'bg-transparent border-transparent text-slate-655 hover:bg-slate-100 hover:text-slate-900'
                            : 'bg-transparent border-transparent text-slate-450 hover:bg-slate-900 hover:text-slate-250'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active
                        ? appTheme === 'light' ? 'text-blue-600' : 'text-sky-400'
                        : appTheme === 'light' ? 'text-slate-450' : 'text-slate-500'
                      }`} />
                      <span className="text-base">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-855 flex flex-col items-center gap-3">
              <button 
                onClick={() => {
                  setUser(null)
                  setIsDrawerOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 active:scale-95 transition-all text-xs cursor-pointer"
              >
                ออกจากระบบ (Logout)
              </button>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Air Buddy Pro v1.2.0</p>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <CalculatorProvider>
        <MainAppContent />
      </CalculatorProvider>
    </AppProvider>
  )
}
