import { createClient } from '@supabase/supabase-js';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyMQNrd-ll1yP0f8ZV52ACdPo6rk2vB890crJ_PgcTmx3bEfFWy9V4IncRhmpqePbzE-g/exec';
const SUPABASE_URL = 'https://inrjqksjftelzdjsnxnn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LCNZo3H-SyqmSM4ZcNtmgQ_h9MF4MT8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailMap = {
  'u-001': 'komsonput01@gmail.com',
  'u-002': 'goggig@gmail.com',
  'u-003': 'maewbb@gmail.com'
};

async function migrate() {
  try {
    console.log('Fetching old records from Google Sheets...');
    const res = await fetch(GAS_URL);
    const gsJobs = await res.json();
    console.log(`Found ${gsJobs.length} records.`);

    console.log('Fetching profiles from Supabase to map technician IDs...');
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, username');
    
    if (profileErr) throw profileErr;

    const profileIdMap = {};
    for (const [oldId, email] of Object.entries(emailMap)) {
      const p = profiles.find(p => p.username === email);
      if (p) {
        profileIdMap[oldId] = p.id;
      } else {
        console.warn(`Warning: Could not find profile for ${email}`);
      }
    }

    const newJobs = gsJobs.map(gsJob => {
      return {
        created_at: gsJob.created_at || new Date().toISOString(),
        date: gsJob.created_at ? gsJob.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        customer_name: gsJob.customer || 'ไม่มีชื่อ',
        customer_phone: String(gsJob.phone || ''),
        customer_address: gsJob.location || '',
        symptoms: gsJob.notes || '',
        ac_model: gsJob.brand ? `${gsJob.brand} ${gsJob.model || ''}`.trim() : '',
        repair_details: JSON.stringify({
          refrigerant: gsJob.refrigerant || '',
          pressure: {
            low: { before: String(gsJob.lowBefore || ''), after: String(gsJob.lowAfter || '') },
            high: { before: String(gsJob.highBefore || ''), after: String(gsJob.highAfter || '') }
          },
          electrical: {
            current: String(gsJob.current || '')
          },
          serialNumber: String(gsJob.serialNo || ''),
          location: { lat: Number(gsJob.lat) || 0, lon: Number(gsJob.lon) || 0 }
        }),
        cost: (Number(gsJob.laborFee) || 0) + (Number(gsJob.materialFee) || 0) - (Number(gsJob.discount) || 0),
        photo_url: '',
        status: 'completed',
        technician_id: profileIdMap[gsJob.tech_id] || null
      };
    });

    console.log(`Inserting ${newJobs.length} records into Supabase...`);
    
    // We insert one by one or in batch. Supabase insert takes an array.
    const { error: insertErr } = await supabase.from('job_records').insert(newJobs);
    
    if (insertErr) throw insertErr;

    console.log('Migration completed successfully! 🎉');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();
