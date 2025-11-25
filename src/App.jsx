// src/App.jsx
import Hero from "./components/Hero";
import StorySection from "./components/StorySection";
import ModesSection from "./components/ModesSection";
import CtaSection from "./components/CtaSection";
import DailyLogInput from "./components/DailyLogInput";
import HistoryPage from "./components/HistoryPage";

import { Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen nk-bg nk-text">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between text-sm md:text-base">
          <Link to="/" className="font-bold nk-text-primary">
            넝쿨소프트
          </Link>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:nk-text-primary">
              오늘
            </Link>
            <Link to="/history" className="text-gray-600 hover:nk-text-primary">
              히스토리
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-10">
        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-12">
                <Hero />
                <div className="bg-white rounded-2xl shadow-md border nk-border-accent">
                  <DailyLogInput />
                </div>
                <StorySection />
                <ModesSection />
                <CtaSection />
              </div>
            }
          />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
      <div className="text-center text-[11px] text-gray-400 mt-10 mb-5">
        모든 기록은 로컬 저장소에만 보관되며, 서버로 전송되지 않습니다.
      </div>
    </div>
  );
}

export default App;
