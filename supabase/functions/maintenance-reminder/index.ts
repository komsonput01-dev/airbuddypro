import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  // Allow POST requests (usually from pg_net or cron)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch LINE Channel Access Token from Vault
    const { data: accessToken, error: tokenErr } = await supabase.rpc('get_decrypted_secret', { secret_name: 'LINE_CHANNEL_ACCESS_TOKEN' })
    if (tokenErr || !accessToken) {
      console.error('Failed to retrieve LINE access token', tokenErr)
      return new Response('Internal Server Error: Missing Access Token', { status: 500 })
    }

    // Check if it's a test broadcast
    let isTestMode = false
    try {
      const bodyText = await req.text()
      if (bodyText) {
        const body = JSON.parse(bodyText)
        isTestMode = body.test === true
      }
    } catch (e) {
      // Ignore body parse errors
    }

    if (isTestMode) {
      const { data: profiles } = await supabase.from('profiles').select('name, line_user_id').not('line_user_id', 'is', null)
      if (!profiles || profiles.length === 0) return new Response('No profiles with LINE ID found', { status: 200 })
      
      let sentCount = 0
      for (const p of profiles) {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({
            to: p.line_user_id,
            messages: [{ type: 'text', text: `📢 [ทดสอบระบบ]\nสวัสดีช่าง ${p.name || 'แอร์'}\nนี่คือข้อความทดสอบการแจ้งเตือนจากระบบ Air Buddy Pro ครับ หากได้รับข้อความนี้แสดงว่าระบบเชื่อมต่อสมบูรณ์ครับ ✅` }]
          })
        })
        if (res.ok) sentCount++
      }
      return new Response(`Test broadcast sent to ${sentCount} technicians.`, { status: 200 })
    }

    // 2. Calculate the target date (Exactly 6 months ago)
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - 6)
    // Format to YYYY-MM-DD
    const targetDateString = targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) 

    // 3. Find jobs that were completed EXACTLY 6 months ago
    // We join with profiles to get the technician's line_user_id
    const { data: oldJobs, error: oldErr } = await supabase
      .from('job_records')
      .select('*, profiles!inner(name, line_user_id)')
      .like('date', `${targetDateString}%`) // handle if time is included in the string
      .not('profiles.line_user_id', 'is', null)

    if (oldErr) {
      console.error('Error fetching old jobs:', oldErr)
      throw oldErr
    }

    if (!oldJobs || oldJobs.length === 0) {
      return new Response('No jobs found from exactly 6 months ago.', { status: 200 })
    }

    // 4. Filter out customers who have had a more recent job
    // This prevents reminding a customer if they already called the tech e.g. 1 month ago
    const customerNames = [...new Set(oldJobs.map(j => j.customer_name))]
    
    const { data: newerJobs, error: newerErr } = await supabase
      .from('job_records')
      .select('customer_name')
      .in('customer_name', customerNames)
      .gt('date', targetDateString)

    if (newerErr) throw newerErr

    const customersWithNewerJobs = new Set(newerJobs.map(j => j.customer_name))
    const jobsToNotify = oldJobs.filter(j => !customersWithNewerJobs.has(j.customer_name))

    let successCount = 0

    // 5. Send LINE Push Message for each valid job
    for (const job of jobsToNotify) {
      const lineUserId = job.profiles.line_user_id
      if (!lineUserId) continue;

      const techName = job.profiles.name || 'ช่าง'
      const custName = job.customer_name
      const acModel = job.ac_model || '-'
      const custAddress = job.customer_address || '-'
      const custPhone = job.customer_phone || '-'
      const oldDate = new Date(job.date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const msg = `📢 [แจ้งเตือนงานเก่าครบ 6 เดือน]\n\nช่าง ${techName} ครับ! แอร์ของลูกค้าคุณ ${custName}\nแบรนด์/รุ่น: ${acModel}\nสถานที่: ${custAddress}\n\nครบกำหนดรอบล้างแอร์ 6 เดือนแล้วครับ (ล้างล่าสุดเมื่อวันที่ ${oldDate})\n\nลองติดต่อหาลูกค้าเพื่อเสนอคิวล้างแอร์รอบใหม่ได้เลยครับ\n📞 โทรศัพท์ลูกค้า: ${custPhone}`

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{ type: 'text', text: msg }]
        })
      })

      if (response.ok) {
        successCount++
      } else {
        console.error(`Failed to send LINE message to ${lineUserId}:`, await response.text())
      }
    }

    return new Response(`Cron job completed. Sent ${successCount} notifications out of ${jobsToNotify.length} eligible jobs.`, { status: 200 })

  } catch (error) {
    console.error('Maintenance reminder error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
