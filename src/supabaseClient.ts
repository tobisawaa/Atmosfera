// File: src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari file .env (Cara Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Jika kode di atas error karena pakai Create React App, gunakan yang bawah ini:
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau Key tidak ditemukan. Cek file .env kamu!");
}

// Membuat "jembatan" ke database Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);