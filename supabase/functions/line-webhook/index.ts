import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Helper function to verify LINE signature (HMAC-SHA256)
async function verifySignature(signature: string, body: string, channelSecret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  )
  
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
  return base64Signature === signature
}

serve(async (req) => {
  // LINE Webhooks use POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    // 1. Get Supabase environment variables (Auto-provided in Edge Functions)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Create Supabase client with SERVICE_ROLE key (Bypasses RLS to call our secure RPC)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Fetch LINE Secrets from Vault using our custom RPC function
    const { data: channelSecret, error: secretErr } = await supabase.rpc('get_decrypted_secret', { secret_name: 'LINE_CHANNEL_SECRET' })
    const { data: accessToken, error: tokenErr } = await supabase.rpc('get_decrypted_secret', { secret_name: 'LINE_CHANNEL_ACCESS_TOKEN' })

    if (secretErr || tokenErr || !channelSecret || !accessToken) {
      console.error('Failed to retrieve LINE secrets from vault', secretErr, tokenErr)
      return new Response('Internal Server Error: Missing Vault Secrets', { status: 500 })
    }

    // 3. Verify X-Line-Signature
    const signature = req.headers.get('x-line-signature')
    const bodyText = await req.text() // Read raw body as text for signature verification
    
    if (!signature || !(await verifySignature(signature, bodyText, channelSecret))) {
      console.error('Invalid LINE signature')
      return new Response('Unauthorized: Invalid Signature', { status: 401 })
    }

    // Parse the body as JSON now that signature is verified
    const body = JSON.parse(bodyText)

    // A webhook can contain multiple events
    const events = body.events || []

    for (const event of events) {
      // Only handle message events of type text
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId
        const text = event.message.text.trim()
        const replyToken = event.replyToken

        // 4. Lookup user in 'profiles' by line_user_id
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('line_user_id', userId)
          .single()

        let replyMessageText = ''

        if (profileErr || !profile) {
          // Case 1: User not found in database
          const appUrl = `https://airbuddypro.vercel.app/profile?line_id=${userId}`
          replyMessageText = `คุณยังไม่ได้ลงทะเบียนช่างแอร์ในระบบ Air Buddy Pro\n\nนี่คือรหัสประจำตัว LINE ของคุณ:\n${userId}\n\nให้นำรหัสนี้ไปใส่ในตารางเพื่อผูกบัญชี หรือกดลิงก์ด้านล่างเพื่อผูกอัตโนมัติ (กำลังพัฒนาระบบนี้อยู่ครับ):\n${appUrl}`
        } else {
          // User found! Check what they typed
          if (text === 'งานวันนี้') {
            // Case 2: Query job_records for today
            // Assuming 'date' column is stored as 'YYYY-MM-DD'
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) // e.g. "2026-06-22"
            
            const { data: jobs, error: jobsErr } = await supabase
              .from('job_records')
              .select('customer_name, ac_model, symptoms, cost')
              .eq('technician_id', profile.id)
              .like('date', `${today}%`)

            if (jobsErr) {
              console.error('Error fetching jobs:', jobsErr)
              replyMessageText = 'ขออภัย เกิดข้อผิดพลาดในการดึงข้อมูลงานของคุณจากฐานข้อมูล'
            } else if (!jobs || jobs.length === 0) {
              replyMessageText = `คุณ ${profile.name} ยังไม่มีคิวงานที่บันทึกไว้ในระบบสำหรับวันนี้ครับ`
            } else {
              // Format the job list into a short, readable Thai string
              let jobListText = `📅 สรุปงานวันนี้ของคุณ ${profile.name}\nจำนวน: ${jobs.length} งาน\n\n`
              
              jobs.forEach((job, index) => {
                jobListText += `[งานที่ ${index + 1}]\n`
                jobListText += `ลูกค้า: ${job.customer_name}\n`
                jobListText += `แอร์: ${job.ac_model || '-'}\n`
                jobListText += `อาการ: ${job.symptoms || '-'}\n`
                jobListText += `ค่าบริการ: ${job.cost || 0} บาท\n`
                jobListText += `-------------------\n`
              })
              
              replyMessageText = jobListText.trim()
            }
          } else {
            // Friendly default response
            replyMessageText = `สวัสดีครับช่าง ${profile.name}\n\nหากต้องการดูคิวงานของวันนี้ กรุณาพิมพ์คำว่า "งานวันนี้" ได้เลยครับ 🛠️`
          }
        }

        // 5. Send Reply back to LINE via Messaging API
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [{
              type: 'text',
              text: replyMessageText
            }]
          })
        })
      }
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
