// ============================================================================
// 📄 HistoryPage.jsx
// 넝쿨OS — 전체 히스토리 화면
// 기능:
//   ✔ Supabase에서 사용자 로그 로드
//   ✔ 무료/Pro 플랜 구분에 따른 최대 조회 가능 범위 제한
//   ✔ 인피니트 스크롤 (스크롤 시 추가로 레코드 로드)
//   ✔ 주간 AI 리포트 생성 모달
//   ✔ ‘맨 위로’ 플로팅 버튼
//   ✔ 최근 기록 기반 한 줄 요약
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://nkos.onrender.com";
const API_REPORT_URL = `${API_BASE_URL}/api/generate-report`;

// 한 번에 스크롤로 불러올 로그 개수
const PAGE_SIZE = 30;

// ---------------------------------------------
// 모드 라벨 (히스토리 화면용 표시)
// ---------------------------------------------
const MODE_LABEL = {
  DELAY: "결정 보류 모드 (Delay)",
  STABILIZE: "안정 회복 모드 (Stabilize)",
  SIMPLIFY: "단순화 모드 (Simplify)",
  DECISIVE: "결단/실행 모드 (Decisive)",
  EXPLORATORY: "탐색/실험 모드 (Exploratory)",
  REFLECT: "성찰/내면 정리 모드 (Reflect)",
};

// ============================================================================
// 🔍 최근 N개 로그 요약 생성 (히스토리 상단 한 줄 요약 카드)
// ============================================================================
function buildHistorySummary(logs, count = 7) {
  if (!logs || logs.length === 0) {
    return "아직 기록이 없어요. 오늘의 첫 기록을 남겨볼까요?";
  }

  // 최신 N개만 추출
  const recent = logs.slice(0, count);
  const total = recent.length;

  // 모드별 개수 집계
  const modeCounts = recent.reduce((acc, log) => {
    if (!log.mode) return acc;
    acc[log.mode] = (acc[log.mode] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(modeCounts);
  if (entries.length === 0) {
    return "아직 모드 데이터가 부족합니다. 기록이 좀 더 쌓이면 흐름을 알려드릴게요.";
  }

  // 최다 모드 찾기
  const [topMode, topCount] = entries.sort((a, b) => b[1] - a[1])[0];
  const percent = Math.round((topCount / total) * 100);
  const label = MODE_LABEL[topMode] || topMode;

  if (total <= 2) {
    return `최근 ${total}개의 기록 중 "${label}"이 ${topCount}회 나타났어요.`;
  }

  return `최근 ${total}개 기록 중 "${label}" 모드가 ${topCount}회(${percent}%)로 가장 많이 나타났어요.`;
}

// ============================================================================
// ⭐ 메인 컴포넌트
// ============================================================================
function HistoryPage() {
  // ---------------------------------------------
  // 기본 로그 및 사용자 상태
  // ---------------------------------------------
  const [logs, setLogs] = useState([]);              // 전체 로그
  const [logCount, setLogCount] = useState(0);        // 전체 로그 개수
  const [userStage, setUserStage] = useState("USER"); // USER | READY_FOR_PRO | PRO
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ---------------------------------------------
  // 인피니트 스크롤: 현재 화면에 표시 중인 로그 개수
  // ---------------------------------------------
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // sentinel 용 ref (화면 하단 감지)
  const loaderRef = useRef(null);

  // ---------------------------------------------
  // 맨 위로 버튼 표시 여부
  // ---------------------------------------------
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ---------------------------------------------
  // AI 리포트 모달 상태
  // ---------------------------------------------
  const [showModal, setShowModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // 📥 Supabase에서 사용자 로그 로드
  // ============================================================================
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      setLoadError("");

      try {
        // 현재 로그인한 사용자 정보
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setLoadError("로그인이 필요합니다.");
          return;
        }

        // 해당 사용자의 로그 전체 조회 (최신순)
        const { data, error } = await supabase
          .from("logs")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false });

        if (error) throw error;

        setLogs(data);
        setLogCount(data.length);
      } catch (e) {
        console.error("Failed to load logs:", e);
        setLoadError("기록을 불러오는 중 문제가 발생했습니다.");
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchLogs();
  }, []);

  // ============================================================================
  // 📊 로그 수 → 사용자 스테이지 (무료/Pro/전환 권장)
  // ============================================================================
  useEffect(() => {
    // TODO: 추후 user_stats.plan 등으로 Pro 여부 반영
    const isPro = false;

    if (isPro) {
      setUserStage("PRO");
      return;
    }

    if (logCount >= 30) setUserStage("READY_FOR_PRO");
    else setUserStage("USER");
  }, [logCount]);

  // ============================================================================
  // 📌 플랜 제한: USER/READY_FOR_PRO → 최대 30개까지만 조회 가능
  // ============================================================================
  let visibleCount = logs.length;
  if (userStage === "USER" || userStage === "READY_FOR_PRO") {
    visibleCount = Math.min(logs.length, 30);
  }

  const visibleLogs = logs.slice(0, visibleCount); // 실제 렌더링 가능 영역
  const hasLockedLogs = logs.length > visibleLogs.length;

  // ============================================================================
  // 🔄 visibleLogs 개수가 변경되면 표시 개수 초기화
  // ============================================================================
  useEffect(() => {
    // displayCount = min(기본페이지, 실제 표시 가능한 만큼)
    setDisplayCount(Math.min(PAGE_SIZE, visibleLogs.length));
  }, [visibleLogs.length]);

  // 최종 렌더링할 로그 목록
  const renderedLogs = visibleLogs.slice(0, displayCount);

  // ============================================================================
  // 📡 인피니트 스크롤: sentinel이 보이면 다음 PAGE_SIZE만큼 로드
  // ============================================================================
  useEffect(() => {
    if (!loaderRef.current) return;
    if (renderedLogs.length >= visibleLogs.length) return; // 더 불러올 게 없으면 중지

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setDisplayCount((prev) =>
            Math.min(prev + PAGE_SIZE, visibleLogs.length)
          );
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [renderedLogs.length, visibleLogs.length]);

  // ============================================================================
  // ⬆ 스크롤 위치 → 맨 위로 버튼 표시
  // ============================================================================
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ============================================================================
  // 🌱 주간 AI 리포트 생성
  // ============================================================================
  const handleGenerateReport = async () => {
    if (logs.length < 2) {
      alert("분석할 기록이 부족합니다.(최소 2개 이상)");
      return;
    }

    setIsLoading(true);
    setShowModal(true);

    try {
      // AI는 과거→현재 순을 선호하므로 reverse
      const recentLogs = logs.slice(0, 7).reverse();

      const response = await fetch(API_REPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: recentLogs }),
      });

      if (!response.ok) throw new Error("서버 오류");

      const data = await response.json();
      setReportText(data.report); // AI 글
    } catch (err) {
      console.error("Report Error:", err);
      setReportText("리포트를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setReportText("");
  };

  // ============================================================================
  // 🖥 UI 렌더링
  // ============================================================================
  return (
    <section className="py-6 px-5 pb-20">
      <div className="max-w-3xl mx-auto">

        {/* --------------------------------------------- */}
        {/* 📌 제목 + AI 리포트 버튼 */}
        {/* --------------------------------------------- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="nk-title-main text-2xl font-bold">히스토리</h2>

          <button
            onClick={handleGenerateReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-full shadow-md"
          >
            ✨ 주간 리포트 분석
          </button>
        </div>

        {/* --------------------------------------------- */}
        {/* 🔍 최근 기록 요약 (한 줄) */}
        {/* --------------------------------------------- */}
        <div className="nk-card-soft mb-6 text-xs md:text-sm text-gray-700">
          {buildHistorySummary(logs)}
        </div>

        {/* --------------------------------------------- */}
        {/* 플랜 단계 안내 배너 */}
        {/* --------------------------------------------- */}
        <div className="mb-4">
          {userStage === "USER" && logCount < 30 && (
            <div className="nk-banner-soft text-xs md:text-sm">
              지금까지 <strong>{logCount}개</strong>의 기록이 쌓였습니다.  
              30개가 넘으면 넝쿨OS가 장기 흐름 분석을 제안할게요.
            </div>
          )}

          {userStage === "READY_FOR_PRO" && (
            <div className="nk-banner-strong text-xs md:text-sm">
              기록이 <strong>{logCount}개</strong>를 넘었어요!  
              현재 화면에선 최근 30개까지만 보이고,  
              더 오래된 기록은 Pro 기능에서 열립니다.
            </div>
          )}
        </div>

        {/* --------------------------------------------- */}
        {/* 로그 목록 / 로딩 / 에러 */}
        {/* --------------------------------------------- */}
        {isLoadingLogs ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            기록을 불러오는 중입니다...
          </div>
        ) : loadError ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {loadError}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            아직 기록이 없습니다.
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {renderedLogs.map((log) => (
                <li key={log.id} className="nk-card text-sm md:text-base">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 text-xs">{log.date}</span>
                    <span className="text-nk-primary font-bold text-xs bg-blue-50 px-2 py-1 rounded">
                      {MODE_LABEL[log.mode] || log.mode}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{log.text}</p>

                  {/* AI 액션(추천 행동)이 존재하는 경우만 표시 */}
                  {log.ai_action && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      💡 {log.ai_action}
                    </div>
                  )}
                </li>
              ))}

              {/* 플랜 제한으로 잠긴 더 예전 로그 안내 */}
              {hasLockedLogs &&
                renderedLogs.length === visibleLogs.length && (
                  <li className="nk-card text-xs md:text-sm text-gray-500 border-dashed border-gray-300">
                    총 {logs.length}개 중{" "}
                    <strong>{logs.length - visibleLogs.length}개</strong>의 기록은  
                    현재 플랜에서 숨겨져 있어요.
                  </li>
                )}
            </ul>

            {/* 인피니트 스크롤 sentinel */}
            <div
              ref={loaderRef}
              className="mt-4 h-8 text-center text-[11px] text-gray-400"
            >
              {renderedLogs.length < visibleLogs.length
                ? "스크롤하면 더 많은 기록을 불러옵니다..."
                : hasLockedLogs
                ? "현재 플랜 기준으로 볼 수 있는 기록을 모두 불러왔어요."
                : "모든 기록을 불러왔어요."}
            </div>
          </>
        )}

        {/* --------------------------------------------- */}
        {/* 🌱 AI 리포트 모달 */}
        {/* --------------------------------------------- */}
        {showModal && (
          <div className="nk-modal-backdrop" onClick={closeModal}>
            <div
              className="nk-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between mb-3 border-b pb-2">
                <h3 className="text-lg font-bold text-indigo-700">
                  🌱 주간 넝쿨 리포트
                </h3>
                <button className="text-gray-400" onClick={closeModal}>
                  ✕
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-10">
                  <div className="nk-spinner mb-4"></div>
                  <p className="animate-pulse text-gray-600">
                    기록을 분석하는 중입니다...
                  </p>
                </div>
              ) : (
                <div className="prose-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {reportText}
                </div>
              )}

              {!isLoading && (
                <button
                  className="nk-btn-primary w-full mt-4 py-2 rounded-lg"
                  onClick={closeModal}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        )}

        {/* --------------------------------------------- */}
        {/* ⬆ 맨 위로 플로팅 버튼 */}
        {/* --------------------------------------------- */}
        {showScrollTop && (
          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="fixed bottom-6 right-4 z-40 bg-white border px-3 py-2 rounded-full shadow-lg text-xs"
          >
            ⬆ 맨 위로
          </button>
        )}
      </div>
    </section>
  );
}

export default HistoryPage;
