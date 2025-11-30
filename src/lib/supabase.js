// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// .env 파일에서 주소와 키를 가져옵니다.
const supabaseUrl = "https://uizkygoasnczxhmvzcbh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemt5Z29hc25jenhobXZ6Y2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDUyNDksImV4cCI6MjA3OTg4MTI0OX0.Dxwn73XnnNZbvp3k9BaKsWZXoeEVdaKHkdYnwJVVzUc";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 없습니다. .env 파일을 확인하세요.");
}

// Supabase 클라이언트 생성 (이게 있어야 DB랑 대화할 수 있습니다)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);