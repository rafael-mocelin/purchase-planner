import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ajqoikmlozhqpznsrkkj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcW9pa21sb3pocXB6bnNya2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODM3MDMsImV4cCI6MjA5MDk1OTcwM30.-_0fRQTLJ56dbakt0JsLKG5IYL6vv6dXLU9bbPcEA7Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
