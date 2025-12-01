// src/components/Login.jsx
import { supabase } from "../lib/supabase";
import Footer from "./Footer";   // 🔹 footer import 추가

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      alert("로그인 에러: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* 🔹 상단 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
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

      {/* 🔥 항상 화면 하단에 고정되는 Footer */}
      <Footer />
    </div>
  );
}
