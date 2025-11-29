// src/components/Login.jsx
import { supabase } from "../lib/supabase";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 모바일(PWA)에서도 로그인 후 다시 앱으로 돌아오게 하는 설정
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      alert("로그인 에러: " + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center mb-10">
        <h1 className="nk-title-main text-4xl mb-2">넝쿨OS 🌱</h1>
        <p className="text-gray-500">나를 발견하는 하루 한 줄 로그</p>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="flex items-center gap-3 bg-white border border-gray-300 px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all font-medium text-gray-700"
      >
        <img 
          src="https://www.svgrepo.com/show/475656/google-color.svg" 
          alt="Google" 
          className="w-6 h-6"
        />
        구글 계정으로 시작하기
      </button>
      
      <p className="mt-8 text-xs text-gray-400">
        로그인하면 데이터가 클라우드에 안전하게 보관됩니다.
      </p>
    </div>
  );
}