/**
 * Script to sync all users from Clerk into Supabase public.profiles
 * Run with: node scripts/sync-clerk-users.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env if not loaded
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  });
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!CLERK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing CLERK_SECRET_KEY or SUPABASE credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function fetchClerkUsers() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clerk.com',
      path: '/v1/users?limit=100',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed)) {
            resolve(parsed);
          } else {
            reject(new Error(body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Fetching users from Clerk...');
  try {
    const users = await fetchClerkUsers();
    console.log(`Found ${users.length} users in Clerk.`);

    for (const u of users) {
      const email =
        u.email_addresses?.[0]?.email_address ||
        `${u.id}@placeholder.app`;
      const fullName =
        [u.first_name, u.last_name].filter(Boolean).join(' ') ||
        email.split('@')[0] ||
        'Valued Foodie';
      const phone = u.phone_numbers?.[0]?.phone_number || '+91 98765 43210';

      const { error } = await supabase.from('profiles').upsert(
        {
          id: u.id,
          full_name: fullName,
          email,
          phone,
          role: 'customer',
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn(`Failed to sync user ${u.id} (${email}):`, error.message);
      } else {
        console.log(`Synced user: ${fullName} (${email}) -> ID: ${u.id}`);
      }
    }

    console.log('Sync complete!');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

run();
