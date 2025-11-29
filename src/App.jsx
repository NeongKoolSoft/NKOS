import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
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
    </div>
  );
}

function App() {
  const navigate = useNavigate();

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
  if (!hasSeenOnboarding && !session) {
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
      <main className="max-w-5xl mx-auto px-5 py-10">
        <Routes>
          <Route path="/" element={<DailyLogInput />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/pro-support" element={<ProSupportPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
