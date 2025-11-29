// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// .env 파일에서 주소와 키를 가져옵니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 없습니다. .env 파일을 확인하세요.");
}

// Supabase 클라이언트 생성 (이게 있어야 DB랑 대화할 수 있습니다)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);