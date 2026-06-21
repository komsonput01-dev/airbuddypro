import fs from 'fs';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyMQNrd-ll1yP0f8ZV52ACdPo6rk2vB890crJ_PgcTmx3bEfFWy9V4IncRhmpqePbzE-g/exec';

async function generateSQL() {
  const res = await fetch(GAS_URL);
  const gsJobs = await res.json();
  
  let sql = ``;

  gsJobs.forEach(gsJob => {
    const created_at = gsJob.created_at || new Date().toISOString();
    const date = gsJob.created_at ? gsJob.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
    const customer_name = gsJob.customer ? gsJob.customer.replace(/'/g, "''") : 'ไม่มีชื่อ';
    const customer_phone = String(gsJob.phone || '').replace(/'/g, "''");
    const customer_address = String(gsJob.location || '').replace(/'/g, "''");
    const symptoms = String(gsJob.notes || '').replace(/'/g, "''");
    const ac_model = gsJob.brand ? `${gsJob.brand} ${gsJob.model || ''}`.trim().replace(/'/g, "''") : '';
    
    const repair_details = JSON.stringify({
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
    }).replace(/'/g, "''");

    const cost = (Number(gsJob.laborFee) || 0) + (Number(gsJob.materialFee) || 0) - (Number(gsJob.discount) || 0);
    
    // We need the technician_id. In SQL we can look it up via subquery:
    let email = '';
    if (gsJob.tech_id === 'u-001') email = 'komsonput01@gmail.com';
    else if (gsJob.tech_id === 'u-002') email = 'goggig@gmail.com';
    else if (gsJob.tech_id === 'u-003') email = 'maewbb@gmail.com';
    else email = 'komsonput01@gmail.com'; // fallback

    sql += `INSERT INTO public.job_records (created_at, date, customer_name, customer_phone, customer_address, symptoms, ac_model, repair_details, cost, status, technician_id)
VALUES ('${created_at}', '${date}', '${customer_name}', '${customer_phone}', '${customer_address}', '${symptoms}', '${ac_model}', '${repair_details}', ${cost}, 'completed', (SELECT id FROM public.profiles WHERE username = '${email}' LIMIT 1));\n`;
  });

  fs.writeFileSync('migration.sql', sql);
  console.log('migration.sql generated!');
}

generateSQL();
