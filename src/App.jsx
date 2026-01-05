// ============================================================================
// App.jsx
// 넝쿨OS 메인 엔트리
// - 광고 랜딩: /welcome (네이버 광고 전용 첫 화면)
// - 비로그인: 랜딩(/), 모드 체험(/mode), 로그인(/login)
// - 로그인: 온보딩(1회) → 모드, 히스토리, 플래너, 인사이트, Pro 안내 등
// - 라우트 변경 시 항상 스크롤 최상단 이동
// - 서버 콜드 스타트 웜업
// ============================================================================

import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";

// -------------------------
// 공통/핵심 컴포넌트
// -------------------------
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import DailyLogInput from "./components/DailyLogInput";
import HistoryPage from "./components/HistoryPage";
import ProSupportPage from "./components/ProSupportPage";
import HeaderMobile from "./components/HeaderMobile";

// -------------------------
// 랜딩(비로그인)용 컴포넌트
// -------------------------
import Hero from "./components/Hero";
import StorySection from "./components/StorySection";
import ModesSection from "./components/ModesSection";
import CtaSection from "./components/CtaSection";
import Footer from "./components/Footer";

// -------------------------
// 정적 페이지 / 추가 페이지
// -------------------------
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import PlannerPage from "./pages/PlannerPage";
import Insight from "./pages/Insight";
import InsightReport from "./pages/InsightReport";
import Welcome from "./pages/Welcome"; // ★ 변경: 네이버 광고용 /welcome 랜딩 페이지
import LifePage from "./pages/LifePage";

// -------------------------
// 넝쿨ERP
// -------------------------
import ErpDemo from "./pages/ErpDemo";
import ErpDemo2 from "./pages/ErpDemo2";
import ErpDemo3 from "./pages/ErpDemo3";

// ============================================================================
// 1) 공통 유틸 컴포넌트 : ScrollToTop
// - 라우트(pathname)가 변경될 때마다 스크롤을 항상 최상단으로 이동
// - 비로그인 / 로그인 레이아웃 모두에서 공통 사용
// ============================================================================
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // behavior: "smooth" → 부드럽게 위로 올라가게
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

// ============================================================================
// 2) 비로그인용 상단 헤더 : PublicHeader
// - 좌측: 로고(누르면 / 로 이동)
// - 우측: "로그인" 버튼 (눌렀을 때 /login 으로 이동하도록, 상위에서 함수 전달)
// ============================================================================
function PublicHeader({ onClickLogin }) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
        {/* 로고 - 항상 루트(/)로 이동 */}
        <Link
          to="/"
          className="font-bold nk-text-primary text-lg hover:opacity-80 transition-opacity"
        >
          넝쿨OS
        </Link>

        {/* 로그인 버튼 - 실제 이동 동작은 부모(App)에서 주입 */}
        <button
          onClick={onClickLogin}
          className="text-sm text-gray-600 hover:nk-text-primary"
        >
          로그인
        </button>
      </div>
    </header>
  );
}

// ============================================================================
// 3) 비로그인 상태에서 보이는 랜딩 페이지 : PublicHome
// - 상단: PublicHeader (로그인 버튼)
// - 본문: Hero + StorySection + ModesSection + CtaSection
// - 하단: Footer
// - "기록 시작하기" 버튼 클릭 → /mode 로 이동 (상위에서 onClickStart 전달)
// ============================================================================
function PublicHome({ onClickStart, onClickLogin }) {
  return (
    <div className="min-h-screen nk-bg nk-text">
      {/* 상단 헤더 (로고 + 로그인 버튼) */}
      <PublicHeader onClickLogin={onClickLogin} />

      {/* 메인 랜딩 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="space-y-10">
          {/* 최상단 히어로 영역 */}
          <Hero onClickStart={onClickStart} />

          {/* 왜 OS가 필요한가 섹션 */}
          <StorySection />

          {/* 6가지 의사결정 모드 소개 섹션 */}
          <ModesSection />

          {/* 기록 시작하기 CTA 섹션 */}
          <CtaSection onClickStart={onClickStart} />
        </div>
      </main>

      {/* 하단 푸터 (개인정보처리방침 / 이용약관 링크 포함) */}
      <Footer />
    </div>
  );
}

// ============================================================================
// 4) 메인 App 컴포넌트
// ============================================================================
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // -------------------------
  // (a) 약관/정책 페이지 여부
  // - 온보딩은 정책/약관 페이지에서 막지 않기 위해 사용
  // -------------------------
  const isLegalPage =
    location.pathname === "/privacy" || location.pathname === "/terms";

  // -------------------------
  // (b) 서버 웜업 (콜드 스타트 완화)
  // - Render 같은 무료/저비용 서버가 슬립 상태일 때 첫 호출이 느려지는 문제 완화
  // - 앱 로드 시 한 번 + 5분 간격으로 /api/health 호출
  // -------------------------
  useEffect(() => {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    const warmup = () => {
      fetch(`${API_BASE_URL}/api/health`).catch((err) => {
        console.warn("health warmup failed (무시해도 됨):", err?.message);
      });
    };

    warmup(); // 최초 1회
    const id = setInterval(warmup, 5 * 60 * 1000); // 5분마다
    return () => clearInterval(id);
  }, []);

  // -------------------------
  // (c) 온보딩 노출 여부
  // - localStorage "NKOS_tutorial_77" 값으로 관리
  // - true : 온보딩 완료
  // -------------------------
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("NKOS_tutorial_77") === "true";
  });

  const handleFinishOnboarding = () => {
    window.localStorage.setItem("NKOS_tutorial_77", "true");
    setHasSeenOnboarding(true);
  };

  // -------------------------
  // (d) 버튼 핸들러
  // - 기록 시작하기 버튼 → /mode 이동
  // - 로그인 버튼 → /login 이동
  // -------------------------
  const handleClickStart = () => {
    navigate("/mode");
  };

  const handleClickLogin = () => {
    navigate("/login");
  };

  // -------------------------
  // (e) Supabase 세션 상태 관리
  // - session: 현재 로그인 유저 정보
  // - loadingSession: 최초 세션 체크 로딩 상태
  // -------------------------
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    // 1) 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    // 2) 로그인/로그아웃 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3) 언마운트 시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ========================================================================
  // 5) 화면 분기
  // ========================================================================

  // -------------------------
  // (1) 세션 로딩 중 (Supabase에서 세션 체크하는 동안)
  // - 예전에는 여기 앞에서 "비로그인 온보딩"을 띄웠지만,
  //   광고 랜딩(/welcome)을 살리기 위해 로딩 이후에만 온보딩을 체크하도록 변경함.
  // -------------------------
  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        넝쿨OS 불러오는 중...
      </div>
    );
  }

  // -------------------------
  // (2) 비로그인 상태
  // - 광고 유입: /welcome
  // - 일반 접속: /
  // - 체험용 모드(/mode), 로그인(/login), 정책/약관(/privacy, /terms)
  // -------------------------
  if (!session) {
    return (
      <>
        {/* 라우트 변경 시 항상 스크롤 최상단으로 */}
        <ScrollToTop />

        <Routes>
          {/* ★ 변경: 네이버 광고 전용 랜딩 페이지 */}
          <Route path="/welcome" element={<Welcome />} />

          {/* 비로그인 랜딩 홈 (소개/스토리용) */}
          
          {/* ✅ 비로그인 기본 진입(/)을 Welcome 페이지로 변경 */}
          <Route path="/" element={<Welcome />} />

          {/* 필요하면 예전 랜딩은 /intro 같은 별도 경로로 살려둘 수 있음 */}
          {/* 
          <Route
            path="/intro"
            element={
              <PublicHome
                onClickStart={handleClickStart}
                onClickLogin={handleClickLogin}
              />
            }
          />
        */}

          {/* /mode : 상단 헤더 + DailyLogInput + Footer
              → "기록 시작하기" 후 진입하는 체험용 모드 페이지 */}
          <Route
            path="/mode"
            element={
              <div className="min-h-screen nk-bg nk-text">
                <PublicHeader onClickLogin={handleClickLogin} />

                <main className="max-w-5xl mx-auto px-5 pt-5 pb-10 md:pt-6">
                  <DailyLogInput />
                </main>

                <Footer />
              </div>
            }
          />

          {/* 이메일/소셜 로그인 화면 */}
          <Route path="/login" element={<Login />} />
          <Route path="/erp-demo" element={<ErpDemo />} />
          <Route path="/erp-demo2" element={<ErpDemo2 />} />
          <Route path="/erp-demo3" element={<ErpDemo3 />} />

          {/* 정책/약관 페이지 (비로그인에서도 접근 가능) */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />          
        </Routes>
      </>
    );
  }


  // -------------------------
  // (4) 로그인 + 온보딩 완료 상태
  // - HeaderMobile(햄버거 메뉴) + 라우트별 메인 콘텐츠
  // -------------------------
  return (
    <div className="min-h-screen nk-bg nk-text">
      {/* 라우트 변경 시 최상단 이동 */}
      <ScrollToTop />

      {/* 모바일 상단 헤더 (넝쿨 모드 / 히스토리 / 플래너 / 인사이트 등) */}
      <HeaderMobile />

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-5xl mx-auto px-5 pt-5 pb-10 md:pt-6">
        <Routes>
          {/* 기본 홈: 오늘의 모드 입력 화면 */}
          <Route path="/" element={<DailyLogInput />} />

          {/* 로그인 상태에서 /mode로 들어오면 /로 리다이렉트 */}
          <Route path="/mode" element={<Navigate to="/" replace />} />

          {/* 넝쿨 모드 히스토리 */}
          <Route path="/history" element={<HistoryPage />} />

          {/* 넝쿨 플래너 / 넝쿨 인사이트 */}
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/insight" element={<Insight />} />
          <Route path="/insight/report" element={<InsightReport />} />
          <Route path="/life" element={<LifePage />} />

          {/* Pro 안내 / 후원 안내 페이지 */}
          <Route path="/pro-support" element={<ProSupportPage />} />

          {/* ERP 데모 페이지 */}
          <Route path="/erp-demo" element={<ErpDemo />} />
          <Route path="/erp-demo2" element={<ErpDemo2 />} />
          <Route path="/erp-demo3" element={<ErpDemo3 />} />

          {/* 정책/약관 (로그인 상태에서도 접근 가능) */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
