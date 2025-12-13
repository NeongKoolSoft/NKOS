// src/pages/InsightReport.jsx
// 넝쿨 인사이트 - 주간/월간 코칭 리포트(JSON 고정) v2

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const RANGE_OPTIONS = [
  { key: "7d", label: "최근 7일" },
  { key: "30d", label: "최근 30일" },
];

function InsightReport() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [range, setRange] = useState("7d");

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const [error, setError] = useState("");

  // ✅ 변경: 문자열 report → JSON reportData
  const [reportData, setReportData] = useState(null);

  // 1) 로그인 유저 확인
  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError(
            "로그인이 필요합니다. 리포트를 보려면 먼저 넝쿨Mode와 플래너를 사용해 주세요."
          );
          return;
        }
        setUserId(user.id);
      } catch (e) {
        console.error("InsightReport - loadUser error:", e);
        setError("로그인 정보를 확인하는 중 문제가 발생했습니다.");
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // 2) 리포트 생성 호출 (✅ JSON 응답 전제)
  const handleGenerateReport = async () => {
    if (!userId) return;

    try {
      setError("");
      setLoadingReport(true);

      // ✅ 중요: 배포/로컬 모두 안정적으로 동작하게 API_BASE_URL 사용 권장
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      const res = await fetch(`${API_BASE_URL}/api/insight/weekly-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, range }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "weekly-report api error");
      }

      // ✅ 서버가 보정해준 data를 그대로 UI에 사용
      setReportData(json.data || null);
    } catch (e) {
      console.error("InsightReport - generate error:", e);
      setError("리포트를 생성하는 중 문제가 발생했습니다.");
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  // 3) 진입/기간 변경 시 자동 생성
  useEffect(() => {
    if (!loadingUser && userId) {
      handleGenerateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser, userId, range]);

  const isBusy = loadingUser || loadingReport;

  return (
    <section className="py-6 px-5 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            {/* 상단 네비게이션 영역 */}
            <div className="mb-3">
              <button
                onClick={() => navigate(-1)}
                className="
                  flex items-center gap-1
                  px-3 h-9
                  rounded-full
                  border border-gray-300
                  text-gray-600 text-sm
                  hover:bg-gray-100
                  transition
                "
              >
                <span className="text-base leading-none">←</span>
                <span>돌아가기</span>
              </button>
            </div>            
            <h2 className="nk-title-main text-2xl font-bold">
              넝쿨 주간 코칭 리포트
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              지난 기간의 모드 흐름과 실행 패턴을 바탕으로,
              <br className="hidden md:block" />
              넝쿨OS가 따뜻한 코칭 리포트를 만들어 드립니다.
            </p>
          </div> 
        </div>

        {/* 기간 선택 + 다시 생성 */}
        <div className="nk-card-soft flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500">
              리포트 기준 기간
            </div>

            <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRange(opt.key)}
                  className={
                    "px-3 py-1 rounded-full transition " +
                    (range === opt.key
                      ? "bg-white shadow text-nk-primary font-semibold"
                      : "text-slate-500")
                  }
                  disabled={isBusy}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleGenerateReport}
              className="nk-btn-primary text-[11px] px-4 py-2 rounded-lg"
              disabled={isBusy || !userId}
            >
              {loadingReport ? "리포트 생성 중..." : "리포트 다시 생성"}
            </button>

            <span className="text-[10px] text-slate-400">
              * 넝쿨Mode + 넝쿨플래너 데이터를 기반으로 코칭 문장을 생성해요.
            </span>
          </div>
        </div>

        {error && (
          <div className="nk-banner-strong text-xs md:text-sm">{error}</div>
        )}

        {/* ✅ 리포트 본문: JSON 카드형 렌더링 */}
        <div className="nk-card-soft space-y-5 min-h-[200px]">
          <div className="text-xs font-semibold text-slate-500">
            📝 이번 기간 넝쿨님의 흐름
          </div>

          {isBusy && (
            <p className="text-xs text-slate-400">
              데이터를 정리하고 리포트를 준비하는 중입니다...
            </p>
          )}

          {!isBusy && !reportData && !error && (
            <p className="text-xs text-slate-500 leading-relaxed">
              아직 리포트가 생성되지 않았어요.
              <br />
              위의 기간을 선택한 뒤{" "}
              <span className="font-semibold">“리포트 다시 생성”</span> 버튼을
              눌러보세요.
            </p>
          )}

          {!isBusy && reportData && (
            <div className="space-y-4">
              {/* 1) 한 줄 요약 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  {reportData.periodLabel}
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {reportData.oneLineSummary}
                </div>
              </div>

              {/* 2) 잘 유지된 점 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  ✅ 잘 유지된 점
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {reportData.highlights?.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* 3) 관찰된 패턴 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  🔎 관찰된 패턴
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {reportData.patterns?.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* 4) 다음 기간 제안 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 mb-2">
                  🎯 다음 기간 제안
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-800">
                  {reportData.nextActions?.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </div>

              {/* 5) 마무리 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-700 leading-relaxed">
                  {reportData.closing}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 확장 안내 */}
        <div className="nk-card-soft space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            📂 앞으로 추가될 기능
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            · 지난 주 / 지난 달 리포트 히스토리 보기
            <br />
            · PDF로 내보내기, 메일로 보내기
            <br />
            · “올해의 패턴”으로 모은 롱텀 리포트 등으로 확장할 예정입니다.
          </p>
        </div>
      </div>
    </section>
  );
}

export default InsightReport;
