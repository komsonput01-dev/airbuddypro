-- 1. เพิ่มคอลัมน์ line_user_id ในตาราง profiles (ถ้ายังไม่มี)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE;

-- 2. สร้างฟังก์ชัน (RPC) เพื่อให้ Edge Function ดึงความลับจาก Vault
-- โดยจำกัดสิทธิ์ให้เฉพาะ Service Role เท่านั้นที่สามารถเรียกใช้ได้
CREATE OR REPLACE FUNCTION get_decrypted_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- ให้ทำงานโดยใช้สิทธิ์ของผู้สร้างฟังก์ชัน
SET search_path = public
AS $$
DECLARE
  secret_value text;
BEGIN
  -- ตรวจสอบว่าผู้เรียกใช้มี Role เป็น service_role เท่านั้น
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service_role can access vault secrets';
  END IF;

  -- ดึงค่าความลับที่ถูกถอดรหัสแล้วจาก vault
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN secret_value;
END;
$$;
