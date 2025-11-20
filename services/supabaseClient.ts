
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfzxqzbfvmphhlbmollm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenhxemJmdm1waGhsYm1vbGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjMzMzcsImV4cCI6MjA3OTIzOTMzN30.K4t0dMvG3PDIZ1CqGO24bgcKufCyBuTduMDqvJTcHP8';

export const supabase = createClient(supabaseUrl, supabaseKey);
