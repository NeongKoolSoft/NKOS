// src/pages/Planner.jsx
// 🔹 넝쿨 Planner (별도 페이지)
// - 오늘 기록의 "마지막 모드"를 기준으로 자동 계획 생성
// - Apple Reminders처럼 심플한 체크리스트 UI
// - 모드 기반 요약/실행 팁/응원/테마컬러 + 진행률 표시

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { MODE_PLAN_PRESETS, MODE_LABEL } from "../lib/plannerPresets";
import Footer from "../components/Footer";

// 오늘 날짜 YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().slice(0, 10);

/**
 * 🔸 모드별 메타정보
 *  - summary:   오늘 모드 한 줄 요약
 *  - tip:       실행 팁 한 줄
 *  - cheer:     짧은 응원 메시지
 *  - themeClass: 메인 플래너 카드 배경색 (Tailwind 클래스)
 */
const MODE_META = {
  DELAY: {
    summary: "결정을 미루고 싶은 날, 속도를 잠시 늦춰도 괜찮아요.",
    tip: "오늘 꼭 넘어야 하는 선택 1가지만 골라, 마감 시간을 정해 보세요.",
    cheer: "아직 결정하지 못한 나도 괜찮아요. 천천히 정리해도 넝쿨OS가 흐름을 기억하고 있어요.",
    themeClass: "bg-slate-50",
  },
  STABILIZE: {
    summary: "작은 정리와 루틴에 집중하면 마음이 안정되는 날이에요.",
    tip: "하나의 공간이나 일만 골라 10분만 정리해 보세요. 완벽할 필요는 없어요.",
    cheer: "조금만 정리해도 숨이 트일 거예요. 오늘은 ‘딱 여기까지만’ 해도 충분합니다.",
    themeClass: "bg-emerald-50/40 bg-emerald-50",
  },
  SIMPLIFY: {
    summary: "선택지를 줄이고 단순하게 만들수록 힘이 나는 날이에요.",
    tip: "오늘 해야 할 일 3개만 남기고 나머지는 내일 이후로 미뤄 보세요.",
    cheer: "모든 걸 다 잘할 필요 없어요. 오늘은 중요한 것 몇 개만 잘해도 충분합니다.",
    themeClass: "bg-sky-50",
  },
  DECISIVE: {
    summary: "결정을 내리고 실행하기에 가장 좋은 날이에요.",
    tip: "가장 미뤄두던 일 하나를 고르고, 지금 바로 ‘첫 액션’만 실행해 보세요.",
    cheer: "완벽한 준비보다 작은 실행이 더 멀리 데려다 줍니다. 지금의 한 걸음을 응원할게요.",
    themeClass: "bg-amber-50",
  },
  EXPLORATORY: {
    summary: "새로운 것을 시도하고 탐색하기 좋은 날이에요.",
    tip: "실패해도 괜찮은 작은 실험을 하나 정해서 오늘 안에 시도해 보세요.",
    cheer: "결과가 어떻든 오늘의 시도는 다음 넝쿨 패턴을 풍부하게 만들어 줄 거예요.",
    themeClass: "bg-indigo-50",
  },
  REFLECT: {
    summary: "돌아보고 정리할수록 통찰이 잘 나오는 날이에요.",
    tip: "오늘/최근 있었던 일을 3줄로 정리하고, 거기서 얻은 한 가지 배움을 적어 보세요.",
    cheer: "지금의 느린 정리도 앞으로의 선택을 더 단단하게 만들고 있어요.",
    themeClass: "bg-violet-50",
  },
};

export default function Planner() {
  const [loading, setLoading] = useState(true);       // 전체 플래너 로딩 상태
  const [modeLoading, setModeLoading] = useState(true); // 오늘 모드만 별도 로딩

  const [todayMode, setTodayMode] = useState("");      // 오늘 마지막 기록의 모드
  const [plannerItems, setPlannerItems] = useState([]); // 오늘 계획 목록
  const [newItemText, setNewItemText] = useState("");   // 새 계획 입력값
  const [error, setError] = useState("");

  const today = getTodayDate();

  // ===========================================================
  // 1) 현재 유저 + 오늘 모드 + 오늘 Planner 항목 로드
  // ===========================================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError("");

        // 1-1. 로그인 유저 확인
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        // 1-2. 오늘 기록 중 "마지막 모드" 가져오기
        const { data: logs, error: logError } = await supabase
          .from("logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .order("id", { ascending: true }); // 오래된 → 최신

        if (logError) throw logError;

        let latestMode = "";
        if (logs && logs.length > 0) {
          const latest = logs[logs.length - 1];
          latestMode = latest.mode || "";
          setTodayMode(latestMode);
        } else {
          setTodayMode("");
        }

        setModeLoading(false);

        // 1-3. 오늘 Planner 항목 불러오기
        const { data: plans, error: planError } = await supabase
          .from("planner_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .order("id", { ascending: true });

        if (planError) throw planError;

        // 1-4. 오늘 Planner가 비어 있고 + 오늘 모드가 있으면 자동 생성
        if (!plans || plans.length === 0) {
          if (latestModeHasPreset(latestMode)) {
            const presets = MODE_PLAN_PRESETS[latestMode];
            const insertRows = presets.map((text) => ({
              user_id: user.id,
              date: today,
              text,
              completed: false,
              source: "auto",
              mode: latestMode,
            }));

            const { data: inserted, error: insertError } = await supabase
              .from("planner_items")
              .insert(insertRows)
              .select();

            if (insertError) throw insertError;

            setPlannerItems(inserted || []);
          } else {
            // 모드 없거나 프리셋 없는 경우 → 빈 상태
            setPlannerItems([]);
          }
        } else {
          setPlannerItems(plans);
        }
      } catch (e) {
        console.error("Planner init error:", e);
        setError("플래너 정보를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]); // 날짜가 바뀌면 새로 로드

  // 특정 모드에 프리셋이 있는지 여부
  const latestModeHasPreset = (mode) => {
    if (!mode) return false;
    return Boolean(MODE_PLAN_PRESETS[mode]);
  };

  // ===========================================================
  // 2) 체크 상태 토글
  // ===========================================================
  const handleToggle = async (itemId) => {
    const target = plannerItems.find((p) => p.id === itemId);
    if (!target) return;

    const nextCompleted = !target.completed;

    // 2-1. UI 먼저 변경 (낙관적 업데이트)
    setPlannerItems((prev) =>
      prev.map((p) =>
        p.id === itemId ? { ...p, completed: nextCompleted } : p
      )
    );

    // 2-2. Supabase로 실제 상태 반영
    const { error } = await supabase
      .from("planner_items")
      .update({ completed: nextCompleted })
      .eq("id", itemId);

    if (error) {
      console.error("Toggle error:", error);
      // 2-3. 실패 시 UI 롤백
      setPlannerItems((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, completed: !nextCompleted } : p
        )
      );
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // ===========================================================
  // 3) 항목 삭제
  // ===========================================================
  const handleDelete = async (itemId) => {
    if (!window.confirm("이 계획을 삭제할까요?")) return;

    // 3-1. UI 먼저 제거
    const prev = plannerItems;
    setPlannerItems((items) => items.filter((p) => p.id !== itemId));

    // 3-2. Supabase에서 삭제
    const { error } = await supabase
      .from("planner_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Delete error:", error);
      setPlannerItems(prev); // 실패 시 롤백
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // ===========================================================
  // 4) 새 항목 추가
  // ===========================================================
  const handleAdd = async () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const newRow = {
        user_id: user.id,
        date: today,
        text: trimmed,
        completed: false,
        source: "manual",
        mode: todayMode || null,
      };

      const { data, error } = await supabase
        .from("planner_items")
        .insert([newRow])
        .select()
        .maybeSingle();

      if (error) throw error;

      setPlannerItems((prev) => [...prev, data]);
      setNewItemText("");
    } catch (e) {
      console.error("Add error:", e);
      alert("새 계획을 추가하는 중 문제가 발생했습니다.");
    }
  };

  // ===========================================================
  // 5) 진행률 계산 (완료 개수 / 전체 개수)
  // ===========================================================
  const totalCount = plannerItems.length;
  const completedCount = plannerItems.filter((p) => p.completed).length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ===========================================================
  // UI 렌더링
  // Apple Reminders 스타일 + 넝쿨 카드톤
  // ===========================================================
  if (loading) {
    return (
      <section className="py-6 px-5">
        <div className="max-w-3xl mx-auto text-center text-gray-400 text-sm">
          플래너를 불러오는 중입니다...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6 px-5">
        <div className="max-w-3xl mx-auto text-center text-gray-500 text-sm">
          {error}
        </div>
      </section>
    );
  }

  const modeLabel = todayMode ? MODE_LABEL[todayMode] || todayMode : null;
  const modeMeta = todayMode ? MODE_META[todayMode] || {} : {};
  const themeClass =
    (todayMode && modeMeta.themeClass) || "bg-white";

  return (
    <>
    <section className="py-6 px-5 pb-20">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* ---------------------------------------------
            상단 제목 + 날짜
        ---------------------------------------------- */}
        <div className="flex items-center justify-between">
          <h2 className="nk-title-main text-2xl font-bold">넝쿨 플래너</h2>
          <span className="text-[11px] md:text-xs text-gray-400">
            {today}
          </span>
        </div>

        {/* ---------------------------------------------
            오늘 모드 안내 카드
            - 모드 요약 문구 + 실행 팁
        ---------------------------------------------- */}
        <div className="nk-card-soft text-xs md:text-sm text-gray-700">
          {modeLoading ? (
            "오늘 기록을 확인하는 중입니다..."
          ) : todayMode && modeLabel ? (
            <>
              {/* 모드 한 줄 요약 */}
              {modeMeta.summary && (
                <p className="font-semibold text-nk-text-strong mb-1">
                  {modeMeta.summary}
                </p>
              )}
              {/* 기본 설명 */}
              <p className="mb-1">
                오늘 마지막 기록의 모드는{" "}
                <strong>{modeLabel}</strong> 입니다.{" "}
                이 모드에서 도움이 될만한 실행 계획을 아래에 추천해 두었어요.
              </p>
              {/* 실행 팁 한 줄 */}
              {modeMeta.tip && (
                <p className="mt-1 text-[11px] md:text-xs text-gray-500">
                  💡 <span className="font-medium">실행 팁:</span>{" "}
                  {modeMeta.tip}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="font-semibold text-nk-text-strong mb-1">
                아직 오늘의 모드가 정해지지 않았어요
              </div>
              <p>
                오늘 기록이 없거나, 모드를 계산할 수 있는 데이터가 부족합니다.{" "}
                먼저 &quot;오늘의 모드&quot;에서 1~3줄 기록을 남겨보면,
                모드에 맞는 실행 계획을 추천해 드릴게요.
              </p>
            </>
          )}
        </div>

        {/* ---------------------------------------------
            메인 체크리스트 카드
            - 모드별 테마 컬러 + 진행률 + 체크리스트
        ---------------------------------------------- */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm md:text-base">
              오늘의 계획
            </h3>
            <span className="text-[11px] text-gray-400">
              완료한 항목은 탭하거나 클릭해서 체크해 주세요
            </span>
          </div>

          {/* 진행률 바 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500">
                오늘 진행률
              </span>
              <span className="text-[11px] text-gray-500">
                {totalCount > 0
                  ? `${completedCount} / ${totalCount} (${progressPercent}%)`
                  : "아직 계획이 없습니다"}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/60 bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-nk-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 체크리스트 본문 */}
          {plannerItems.length === 0 ? (
            <div className="text-xs md:text-sm text-gray-500 py-4 text-center">
              아직 오늘 플래너에 추가된 항목이 없습니다.
              <br />
              아래 입력창에서 오늘의 계획을 직접 추가해 보세요.
            </div>
          ) : (
            <ul className="space-y-2">
              {plannerItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl py-2 px-2 hover:bg-white/60 hover:bg-slate-50 transition-colors"
                >
                  {/* 체크 박스 영역 (버튼 전체를 클릭 가능) */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="flex items-start gap-3 flex-1 text-left focus:outline-none"
                  >
                    {/* ☐ 체크박스 스타일 */}
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                        item.completed
                          ? "border-nk-primary bg-nk-primary text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {item.completed && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>

                    {/* 텍스트 */}
                    <span
                      className={`text-xs md:text-sm leading-relaxed ${
                        item.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-[11px] text-gray-300 hover:text-red-400 px-1"
                    aria-label="계획 삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 새 항목 추가 입력 */}
          <div className="mt-4 border-t border-white/60 border-slate-200 pt-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="오늘 추가하고 싶은 계획을 입력하고 Enter를 눌러보세요."
                className="flex-1 text-xs md:text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-nk-primary/70 focus:border-nk-primary/60 bg-white/70 bg-slate-50"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-2 rounded-xl bg-nk-primary text-white text-xs md:text-sm font-semibold hover:opacity-90"
              >
                추가
              </button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------
            모드 기반 짧은 응원 메시지 카드
        ---------------------------------------------- */}
        <div className="nk-card-soft text-[11px] md:text-xs text-gray-600">
          {todayMode && modeMeta.cheer ? (
            <>
              <span className="mr-1">🌱</span>
              {modeMeta.cheer}
            </>
          ) : (
            <>
              <span className="mr-1">🌱</span>
              오늘도 작은 한 줄, 한 계획만 남겨도 충분합니다.  
              넝쿨OS가 당신의 리듬을 계속 기록하고 있어요.
            </>
          )}
        </div>

        {/* 하루 마무리 안내 (향후 Insight 연동용) */}
        <div className="nk-card-soft text-[11px] md:text-xs text-gray-500">
          오늘 플래너에서 완료한 항목들은 나중에 넝쿨 Insight에서{" "}
          <strong>실행 패턴</strong>으로 분석될 예정입니다.{" "}
          오늘 하루를 마칠 때, &quot;오늘의 모드&quot;에 간단한
          회고를 남겨주면 더 풍부하게 해석할 수 있어요.
        </div>
      </div>
    </section>
    <Footer />
    </>
  );
}
