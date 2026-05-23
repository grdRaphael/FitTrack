// supabase.js — Client Supabase pour FitTrack

const SUPABASE_URL = 'https://vgpvrwhhicwtfsublzuo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHZyd2hoaWN3dGZzdWJsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjEyMDEsImV4cCI6MjA5NTAzNzIwMX0.SmT1098sTEJVlmUjkfFrSimV1XO-HmHESgSoP8l1yVw';

let _sb;
try {
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  });
} catch (e) {
  console.error('FitTrack: échec init Supabase —', e.message);
}
