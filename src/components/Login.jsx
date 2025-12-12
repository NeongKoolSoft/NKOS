// src/components/Login.jsx
import { supabase } from "../lib/supabase";
import Footer from "./Footer";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert("로그인 에러: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* 상단 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">

        {/* 로고 / 타이틀 */}
        <div className="text-center mb-10">
          <h1 className="nk-title-main text-4xl mb-2">넝쿨OS 🌱</h1>
          <p className="text-gray-500">
            나를 발견하는 하루 한 줄 로그
          </p>
        </div>

        {/* 🔹 안내 문구 (로그인 전에 유저 안심시키는 역할) */}
        <div className="max-w-sm text-center mb-6">
          <p className="mt-3 text-xs text-gray-500">
            “로그인해도 기록은 언제든 삭제 가능하며, Google 인증만 사용합니다. 비밀번호는 넝쿨OS에 저장되지 않습니다.”
          </p>
        </div>

        {/* 로그인 버튼 */}
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

        {/* 추가 안내 */}
        <p className="mt-8 text-xs text-gray-400 leading-relaxed">
          넝쿨OS는 계정정보를 저장하지 않으며,<br />
          언제든지 탈퇴할 수 있습니다.
        </p>
      </div>

      {/* 하단 고정 Footer */}
      <Footer />
    </div>
  );
}
