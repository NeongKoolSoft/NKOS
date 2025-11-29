// src/App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase"; // DB 연동
import Login from "./components/Login";    // 로그인 화면

import Hero from "./components/Hero";
import StorySection from "./components/StorySection";
import ModesSection from "./components/ModesSection";
import CtaSection from "./components/CtaSection";
import DailyLogInput from "./components/DailyLogInput";
import HistoryPage from "./components/HistoryPage";

import { Routes, Route, Link } from "react-router-dom";
import ProSupportPage from "./components/ProSupportPage";

function App() {
  const [session, setSession] = useState(null);

  // 1. 로그인 상태 관리 (Supabase)
  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 로그인/로그아웃 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 로그인이 안 되어 있으면 로그인 화면 표시
  if (!session) {
    return <Login />;
  }

  // 3. 로그인 상태일 때 메인 앱 표시
  return (
    <div className="min-h-screen nk-bg nk-text">
      
      {/* 상단 헤더 */}
      <header className="border-b border-gray-200 bg-white/70 bg-white sticky top-0 z-50">
        {/* 🌟 max-w-5xl로 넓게 설정 */}
        <nav className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between text-sm md:text-base">
          <Link to="/" className="font-bold nk-text-primary text-lg hover:opacity-80 transition-opacity">
            넝쿨OS
          </Link>
          
          <div className="flex gap-6 items-center">
            <Link to="/" className="text-gray-600 hover:nk-text-primary font-medium transition-colors">
              오늘
            </Link>
            <Link to="/history" className="text-gray-600 hover:nk-text-primary font-medium transition-colors">
              히스토리
            </Link>
            
            {/* 🌟 로그아웃 버튼 추가 */}
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
      {/* 🌟 max-w-5xl로 넓게 설정 */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-10"> {/* 섹션 간격 넓힘 */}
                <Hero />
                
                {/* 일기 입력란 카드 */}
                <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
                  <DailyLogInput />
                </div>

                <StorySection />
                <ModesSection />
                <CtaSection />
              </div>
            }
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/pro-support" element={<ProSupportPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;