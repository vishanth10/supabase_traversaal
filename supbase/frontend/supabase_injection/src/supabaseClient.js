// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabaseUrl = 'https://bkqotxkglmgpnrjmiwmc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcW90eGtnbG1ncG5yam1pd21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzMDQyMzEsImV4cCI6MjAzNDg4MDIzMX0.SBy0NokWpE5iAzhLuZ-6Aus8z_MxYkc0vlp1RK8ZkCU'

console.log('supabase urls is ',supabaseUrl);
console.log('supabase key is ',supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);
