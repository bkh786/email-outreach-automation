import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = match[2] || '';
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    }
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing signInWithPassword for bkh786@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'bkh786@gmail.com',
    password: 'AdminFreight2025!',
  });

  if (error) {
    console.error('❌ Sign in failed:', error.message);
  } else {
    console.log('✅ Sign in successful! User ID:', data.user.id);
    console.log('   Session Token received: OK');
    console.log('   User Email:', data.user.email);
  }
}

test();
