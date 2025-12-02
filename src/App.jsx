import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import DailyLogInput from "./components/DailyLogInput";
import HistoryPage from "./components/HistoryPage";
import ProSupportPage from "./components/ProSupportPage";

// 랜딩(비로그인)용 컴포넌트들
import Hero from "./components/Hero";
import StorySection from "./components/StorySection";
import ModesSection from "./components/ModesSection";
import CtaSection from "./components/CtaSection";
import Footer from "./components/Footer";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";

// 🔹 비로그인 상태에서 보이는 Public Home (소개 페이지)
function PublicHome({ onClickStart }) {
  return (
    <div className="min-h-screen nk-bg nk-text">
      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="space-y-10">
          <Hero onClickStart={onClickStart} />
          <StorySection />
          <ModesSection />
          <CtaSection onClickStart={onClickStart} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // 약관/정책 페이지 여부
  const isLegalPage =
    location.pathname === "/privacy" || location.pathname === "/terms";


  // ✅ 콜드 스타트 완화용 서버 웜업 훅
  useEffect(() => {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    const warmup = () => {
      fetch(`${API_BASE_URL}/api/health`).catch((err) => {
        // 굳이 사용자에게 보여줄 필요는 없고, 개발용으로만 확인하고 싶으면 콘솔 찍기
        console.warn("health warmup failed (무시해도 됨):", err?.message);
      });
    };

    // 앱 로드 시 한 번 호출
    warmup();

    // 탭이 열려있는 동안 5분에 한 번씩 서버 깨우기
    const id = setInterval(warmup, 5 * 60 * 1000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(id);
  }, []);

  // --------------------------------
  // 🔥 (1) 온보딩 노출 여부 상태
  // --------------------------------
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("NKOS_tutorial_77") === "true";
  });

  const handleFinishOnboarding = () => {
    window.localStorage.setItem("NKOS_tutorial_77", "true");
    setHasSeenOnboarding(true);
  };

  // PublicHome에서 “시작하기” 클릭 시 로그인 화면으로 이동
  const handleClickStart = () => {
    navigate("/login");
  };

  // --------------------------------
  // 🔥 (2) 로그인 세션 상태
  // --------------------------------
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --------------------------------
  // 🔥 (3) 온보딩: 로그인 안 된 사람에게만 1회 노출
  // --------------------------------
  if (!hasSeenOnboarding && !session && !isLegalPage) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }  

  // --------------------------------
  // 🔥 (4) 세션 로딩 중
  // --------------------------------
  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        넝쿨OS 불러오는 중...
      </div>
    );
  }

  // --------------------------------
  // 🔥 (5) 비로그인 상태: Public Home + Login
  // --------------------------------
  if (!session) {
    return (
      <Routes>
        <Route
          path="/"
          element={<PublicHome onClickStart={handleClickStart} />}
        />
        <Route path="/login" element={<Login />} />
        {/* ✅ 비로그인 상태에서도 개인정보/약관 페이지 접근 가능하게 추가 */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    );
  }

  // --------------------------------
  // 🔥 (6) 로그인 상태: 기존 헤더 + 메인 레이아웃 복구
  // --------------------------------
  return (
    <div className="min-h-screen nk-bg nk-text">
      {/* 상단 헤더 (기존 그대로) */}
      <header className="border-b border-gray-200 bg-white/70 bg-white sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between text-sm md:text-base">
          <Link
            to="/"
            className="font-bold nk-text-primary text-lg hover:opacity-80 transition-opacity"
          >
            넝쿨OS
          </Link>

          <div className="flex gap-6 items-center">
            <Link
              to="/"
              className="text-gray-600 hover:nk-text-primary font-medium transition-colors"
            >
              오늘
            </Link>
            <Link
              to="/history"
              className="text-gray-600 hover:nk-text-primary font-medium transition-colors"
            >
              히스토리
            </Link>
            <Link
              to="/pro-support"
              className="text-gray-600 hover:nk-text-primary font-medium transition-colors"
            >
              Pro 안내
            </Link>

            <button
              onClick={() => supabase.auth.signOut()}
              className="text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </nav>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-5xl mx-auto px-5 pt-5 pb-10 md:pt-6">
        <Routes>
          <Route path="/" element={<DailyLogInput />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/pro-support" element={<ProSupportPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />          
        </Routes>
      </main>
    </div>
  );
}

export default App;
