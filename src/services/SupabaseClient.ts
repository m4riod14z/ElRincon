import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hyvexfirfsjofdxybrgz.supabase.co'
const supabasePublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dmV4ZmlyZnNqb2ZkeHlicmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTA5MDAsImV4cCI6MjA3MzYyNjkwMH0.521cyIdP2P_xA7NV_YFRm-4aWlRPl88TMO6w8JG55vg'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)