import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus credenciales de Supabase
const SUPABASE_URL = 'https://uqjlaqnxocxsfoycayma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamxhcW54b2N4c2ZveWNheW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzExMzMsImV4cCI6MjEwNzY0NzEzM30.vJRBwg0LKIdR6kpQns76OBURG4O-6tSj4qmCXH38lm4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});