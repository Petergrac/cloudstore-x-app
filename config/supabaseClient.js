const { createClient} = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseRoleKey = process.env.SUPABASE_SERVICE_KEY;
if(!supabaseRoleKey || !supabaseUrl){
    console.error('SUPABASE KEYS NOT SET IN THE ENVIRONMENT VARIABLE')
}

// Create a connection
const supabase = createClient(supabaseUrl,supabaseRoleKey);

module.exports = supabase;