// src/pages/InsightReport.jsx
// 넝쿨 인사이트 - 주간 코칭 리포트 전용 페이지 v1
//
// 예상 API 계약:
//   POST /api/insight/weekly-report
//   body: { userId: string, range: "7d" | "30d" }
//   res:  { report: string }
//
// ※ 실제 DB 조회/분석/LLM 호출 로직은 서버에서 처리하고,
//    프론트는 "userId + 기간"만 넘겨받는 구조로 단순화.

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
  const [report, setReport] = useState("");

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

  // 2) 리포트 생성 호출
  const handleGenerateReport = async () => {
    if (!userId) return;

    try {
      setError("");
      setLoadingReport(true);

      const res = await fetch("/api/insight/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, range }),
      });

      if (!res.ok) {
        throw new Error("weekly-report api error");
      }

      const json = await res.json();
      setReport(json.report || "");
    } catch (e) {
      console.error("InsightReport - generate error:", e);
      setError("리포트를 생성하는 중 문제가 발생했습니다.");
    } finally {
      setLoadingReport(false);
    }
  };

  // 3) 페이지 첫 진입 시 자동 한 번 생성 (선택 사항)
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
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="nk-title-main text-2xl font-bold">
              넝쿨 주간 코칭 리포트
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              지난 기간의 모드 흐름과 실행 패턴을 바탕으로,
              <br className="hidden md:block" />
              넝쿨OS가 따뜻한 코칭 리포트를 만들어 드립니다.
            </p>
          </div>

          <button
            onClick={() => navigate("/insight")}
            className="text-[11px] px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            ← 돌아가기
          </button>
        </div>

        {/* 기간 선택 + 리포트 새로 생성 버튼 */}
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

        {/* 리포트 본문 영역 */}
        <div className="nk-card-soft space-y-3 min-h-[200px]">
          <div className="text-xs font-semibold text-slate-500">
            📝 이번 기간 넝쿨님의 흐름
          </div>

          {isBusy && (
            <p className="text-xs text-slate-400">
              데이터를 정리하고 리포트를 준비하는 중입니다...
            </p>
          )}

          {!isBusy && !report && !error && (
            <p className="text-xs text-slate-500 leading-relaxed">
              아직 리포트가 생성되지 않았어요.
              <br />
              위의 기간을 선택한 뒤{" "}
              <span className="font-semibold">“리포트 다시 생성”</span> 버튼을
              눌러보세요.
            </p>
          )}

          {report && (
            <article className="text-sm whitespace-pre-line leading-relaxed text-slate-800">
              {report}
            </article>
          )}
        </div>

        {/* 향후 확장 영역: 리포트 히스토리 / PDF / 공유 등 */}
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
