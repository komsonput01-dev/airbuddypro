-- ตั้งเวลา (Cron Job) ให้เรียกใช้ Edge Function "maintenance-reminder" 
-- ทำงานเวลา 09:00 น. ของทุกวัน (เวลาไทย = 02:00 UTC)

SELECT cron.schedule(
    'invoke-maintenance-reminder-daily', 
    '0 2 * * *', -- เวลา 02:00 UTC ตรงกับ 09:00 น. ประเทศไทย
    $$
    SELECT net.http_post(
        url:='https://inrjqksjftelzdjsnxnn.supabase.co/functions/v1/maintenance-reminder',
        headers:='{"Content-Type": "application/json"}'::jsonb
    )
    $$
);

-- หมายเหตุ: 
-- 1. ฟังก์ชัน `maintenance-reminder` ของเรามีการตรวจสอบด้วย JWT และ API Key ไหม?
-- เนื่องจากเราใส่ --no-verify-jwt ตอน Deploy ไปแล้ว (เพื่อให้เรียกใช้งานได้ง่าย) จึงไม่ต้องแนบ Authorization
-- 2. คุณสามารถรันคำสั่งด้านล่างนี้เพื่อ "ทดสอบรันทันที 1 ครั้ง" ดูได้เลยครับ (จะส่งแจ้งเตือนเข้า LINE ทันทีถ้ามีลูกค้าระยะ 6 เดือนเป๊ะ)

-- [ทดสอบรันทันที]
-- SELECT net.http_post(
--     url:='https://inrjqksjftelzdjsnxnn.supabase.co/functions/v1/maintenance-reminder'
-- );
