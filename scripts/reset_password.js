/* Temporary script to reset a Supabase user's password using service role key.
   Usage: node reset_password.js "user@example.com" "newPassword"
*/
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error('Usage: node reset_password.js "email" "newPassword"');
    process.exit(1);
  }

  try {
    // Find user id from profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileErr) {
      console.error('Failed to query profiles:', profileErr);
      process.exit(1);
    }

    if (!profile || !profile.id) {
      console.error('No profile found for email', email);
      process.exit(1);
    }

    const userId = profile.id;
    console.log('Found userId:', userId);

    // Update user password via admin API
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true,
    });

    if (error) {
      console.error('Failed to update user password:', error);
      process.exit(1);
    }

    console.log('Password updated for user', email);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();
