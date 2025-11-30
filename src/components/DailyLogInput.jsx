// src/components/DailyLogInput.jsx
// 넝쿨OS 메인 화면 (기능: Supabase + 레벨 + AI 유지, UI는 예전 카드 스타일로 리디자인)
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { extractSignals, decideMode, computeScores } from "../lib/modeEngine";
import { getPatternBoosts } from "../lib/modePatterns";
import DebugPanel from "./DebugPanel";
import NKChart from "./NKChart";
import VineLevel from "./VineLevel";
import { useNavigate } from "react-router-dom";
import { formatKoreanTime } from "../utils/time";
import Hero from "./Hero";
import ModesSection from "./ModesSection";
import StorySection from "./StorySection";

// 기본은 로컬(개발용), 배포에서는 Vercel 환경변수로 덮어씀
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const API_URL = `${API_BASE_URL}/api/generate-action`;

const NEXT_LEVEL_XP = 50;

// 모드 라벨 맵
const MODE_LABEL = {
  DELAY: "DELAY : 결정 보류 모드",
  STABILIZE: "STABILIZE : 안정 회복 모드",
  SIMPLIFY: "SIMPLIFY : 단순화 모드",
  DECISIVE: "DECISIVE : 결단/실행 모드",
  EXPLORATORY: "EXPLORATORY : 탐색/실험 모드",
  REFLECT: "REFLECT : 성찰/내면 정리 모드",
};

// AI 호출 실패 시 fallback 행동 문구
const actionsForMode = (mode) => {
  switch (mode) {
    case "DELAY":
      return ["오늘은 큰 결정은 잠시 보류하는 게 좋아요."];
    case "STABILIZE":
      return ["작은 일 하나만 정리하고 그 이상은 욕심내지 마세요."];
    case "REFLECT":
      return ["감정과 생각을 5줄 정도 글로 적어보세요."];

    case "SIMPLIFY":
      return ["지금 떠오르는 선택지를 최대 3개로 줄여보세요."];
    case "DECISIVE":
      return ["오늘 한 가지는 완료까지 밀어붙여보세요."];
    case "EXPLORATORY":
      return ["새로운 시도를 하나, 부담 없이 해보세요."];
    default:
      return [];
  }
};

function DailyLogInput() {
  const navigate = useNavigate();

  // ---------- 입력/결과 상태 ----------
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [mode, setMode] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [llmAction, setLlmAction] = useState("");

  // ---------- 로그 / 레벨 / XP ----------
  const [logs, setLogs] = useState([]);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  // ---------- 디버그용 ----------
  const [debugData, setDebugData] = useState(null);
  const [debugEnabled, setDebugEnabled] = useState(false);

  // ---------- 여정 단계 / Pro 플로우 ----------
  // logCount : 전체 로그 개수
  // userStage : USER | READY_FOR_PRO | PRO
  const [logCount, setLogCount] = useState(0);
  const [userStage, setUserStage] = useState("USER");
  const [showProModal, setShowProModal] = useState(false);

  // ======================================================
  // 1. 초기 데이터 로드 (logs + user_stats)
  // ======================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) 현재 로그인 유저 가져오기
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 2) 로그 전체 로드 (오래된 → 최신순)
        const { data: logData, error: logError } = await supabase
          .from("logs")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: true });

        if (logError) throw logError;

        if (logData && logData.length > 0) {
          setLogs(logData);
          setLogCount(logData.length);

          const latest = logData[logData.length - 1];
          setSaved(latest.text);
          setMode(latest.mode);
          setSavedAt(latest.date);
          setLlmAction(latest.ai_action);
        }

        // 3) user_stats 로드 (레벨/XP/플랜)
        const { data: statData, error: statError } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (statError) throw statError;

        if (statData) {
          setLevel(statData.level);
          setXp(statData.xp);

          // plan 정보에 따라 Pro 여부 결정
          if (statData.plan === "pro") {
            // 이미 Pro 유저라면 스테이지를 PRO로 고정
            setUserStage("PRO");
          } else {
            // 무료 유저라면 로그 개수에 따라 USER/READY_FOR_PRO 설정
            if (logData && logData.length >= 30) {
              setUserStage("READY_FOR_PRO");
            } else {
              setUserStage("USER");
            }
          }
        } else {
          // user_stats가 없으면 기본값으로 생성
          await supabase
            .from("user_stats")
            .insert([{ user_id: user.id, level: 1, xp: 0, plan: "free" }]);
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };

    fetchData();
  }, []);

  // ======================================================
  // 2. logCount 변화에 따른 여정 단계 업데이트
  //    (단, 이미 PRO이면 스테이지를 건드리지 않음)
  // ======================================================
  useEffect(() => {
    // Pro 유저는 항상 PRO 유지
    if (userStage === "PRO") return;

    if (logCount >= 30) {
      setUserStage("READY_FOR_PRO");
    } else {
      setUserStage("USER");
    }
  }, [logCount, userStage]);

  // ======================================================
  // 3. 디버그 모드 활성화 (URL ?debug=1 이면 켜기)
  //    → 이건 한 번만 체크하면 되므로 의존성 배열은 []
  // ======================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1") setDebugEnabled(true);
  }, []);

  // ======================================================
  // 4. AI 분석 요청 함수
  // ======================================================
  const fetchAIAnalysis = async (userLog) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userLog }),
      });
      if (!response.ok) throw new Error("서버 응답 오류");
      return await response.json(); // { signals, recommendedAction }
    } catch (error) {
      console.error("AI 연결 실패:", error);
      return null;
    }
  };

  // ======================================================
  // 5. 저장 버튼 클릭 핸들러
  //    - 로그 저장
  //    - 모드 계산
  //    - XP / 레벨 업데이트
  //    - logCount 업데이트 + Pro 모달 트리거
  // ======================================================
  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다!");
      setIsSaving(false);
      return;
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    const prevMode = logs.length > 0 ? logs[logs.length - 1].mode : "";
    const patternBoosts = getPatternBoosts(trimmed);

    let finalSignals, finalMode, finalAction;

    // 1) AI 분석 시도
    const aiResult = await fetchAIAnalysis(trimmed);
    if (aiResult && aiResult.signals) {
      finalSignals = aiResult.signals;
      finalAction = aiResult.recommendedAction;
    } else {
      // AI 실패 시 로컬 엔진으로 신호 추출
      finalSignals = extractSignals(trimmed);
      finalAction = "";
    }

    // 2) 모드 결정 + 점수 계산
    const scores = computeScores(finalSignals, patternBoosts, prevMode);
    finalMode = decideMode(finalSignals, patternBoosts, prevMode);

    // 화면 상단 “오늘 기록/모드” 즉시 반영
    setSaved(trimmed);
    setMode(finalMode);
    setSavedAt(dateStr);
    setLlmAction(finalAction);
    setDebugData({
      text: trimmed,
      signals: finalSignals,
      patternBoosts,
      scores,
      finalMode,
    });

    try {
      // 3) Supabase logs 테이블에 저장
      const newEntry = {
        user_id: user.id,
        date: dateStr,
        text: trimmed,
        mode: finalMode,
        ai_action: finalAction,
        signals: finalSignals,
      };

      const { data, error: saveError } = await supabase
        .from("logs")
        .insert([newEntry])
        .select();

      if (saveError) throw saveError;

      const savedData = data[0];

      // 4) 프론트 상태에 로그 추가
      const updatedLogs = [...logs, savedData];
      setLogs(updatedLogs);

      // 5) logCount / Pro 모달 처리
      const newLogCount = updatedLogs.length;
      setLogCount(newLogCount);

      if (userStage !== "PRO" && newLogCount === 30) {
        setShowProModal(true);
      }

      // 6) 레벨 / XP 처리
      let newXp = xp + 10;
      let newLevel = level;

      if (newXp >= NEXT_LEVEL_XP) {
        newLevel += 1;
        newXp -= NEXT_LEVEL_XP;
        alert(`🎉 축하합니다! 넝쿨이 Lv.${newLevel}로 성장했습니다! 🌱`);
      }

      await supabase
        .from("user_stats")
        .update({ level: newLevel, xp: newXp })
        .eq("user_id", user.id);

      setXp(newXp);
      setLevel(newLevel);
      setText("");
    } catch (e) {
      console.error("저장 실패:", e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false); // 저장 끝 → 로딩 false
    }
  };

  // ✅ 오늘 모드에 대한 "미니 인사이트" 생성 함수
  // - 최근 최대 7개의 로그를 기준으로
  //   현재 모드가 얼마나 자주/드물게 나타나는지 한 줄로 설명해줌
  const buildModeInsight = (currentMode, logs) => {
    if (!currentMode || !logs || logs.length === 0) return "";

    // 최근 최대 7개 기록만 사용
    const recent = logs.slice(-7);
    const total = recent.length;

    // 모드별 출현 횟수 집계
    const counts = recent.reduce((acc, log) => {
      if (!log.mode) return acc;
      acc[log.mode] = (acc[log.mode] || 0) + 1;
      return acc;
    }, {});

    const currentCount = counts[currentMode] || 0;
    const label = MODE_LABEL[currentMode] || currentMode;

    // 기록이 너무 적을 때는 "데이터 쌓이는 중" 문구
    if (total <= 2) {
      return "아직 기록이 많지 않아서, 오늘의 모드가 어떤 흐름 속에 있는지는 조금 더 지켜보는 중이에요.";
    }

    const ratio = currentCount / total;

    // 현재 모드가 최근에 자주 반복되는 경우
    if (ratio >= 0.5 && currentCount >= 3) {
      return `최근 ${total}개 기록 중 ${currentCount}개가 "${label}"에 해당해요. 요즘 이 모드가 자주 나타나는 편입니다.`;
    }

    // 현재 모드가 최근에 거의 안 나왔던 경우
    if (currentCount === 1) {
      return `최근 ${total}개 기록 중 오늘만 "${label}" 모드예요. 평소와는 조금 다른 하루일 수 있어요.`;
    }

    // 그 외: 가끔씩 반복되는 패턴
    return `최근 ${total}개 기록 중 ${currentCount}개가 "${label}" 모드예요. 가끔씩 반복되는 패턴으로 자리 잡는 중입니다.`;
  };

  // 최근 5개 로그 (최신순으로 보기 위해 reverse)
  const recentLogs = logs.slice(-5).reverse();

  // ========================================================
  // UI : 예전 스샷 느낌(넓은 폭 + 연한 배경 + 큰 파란 버튼)으로 구성
  // ========================================================
  return (
    <section className="py-8 px-2 md:px-4">
      {/* 상단 소개 영역 */}
      <div className="max-w-4xl mx-auto mb-8">
        <Hero />
      </div>

      {/* 👇 여정 단계 안내 배너 (FREE / READY_FOR_PRO / PRO 용) */}
      <div className="max-w-4xl mx-auto mb-4">
        {userStage === "USER" && logCount >= 20 && logCount < 30 && (
          <div className="nk-banner-soft">
            <p className="text-xs md:text-sm">
              이제 {logCount}개의 기록이 쌓였어요. 곧 장기 흐름이 보이기
              시작합니다. 30개가 넘으면 넝쿨OS가 깊은 패턴 분석을 제안할게요.
            </p>
          </div>
        )}

        {userStage === "READY_FOR_PRO" && (
          <div className="nk-banner-strong">
            <p className="text-xs md:text-sm">
              기록이 {logCount}개를 넘어섰어요. 지금부터는 &quot;장기 패턴&quot;을
              보면 훨씬 더 명확해집니다. Pro 전환을 검토해볼 때예요.
            </p>
          </div>
        )}

        {/* Pro 유저만 보이는 축하/안내 배너 */}
        {userStage === "PRO" && (
          <div className="nk-banner-pro">
            <p className="text-xs md:text-sm">
              🎉 <strong>넝쿨OS Pro</strong>가 활성화되었습니다.
              이제 전체 히스토리와 장기 패턴, AI 코칭을 마음껏 사용하실 수 있어요.
            </p>
            <p className="text-[11px] md:text-xs text-nk-primary mt-1">
              오늘도 기록이 쌓일수록, 넝쿨OS는 당신을 더 잘 이해하게 됩니다 🌱
            </p>
          </div>
        )}
      </div>

      {/* ✅ 메인 영역 전체를 큰 카드로 감싸기 */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-blue-100 px-4 md:px-4 py-6 md:py-8">
          {/* 오늘의 모드 카드 */}
          <h2 className="nk-title-main text-2xl md:text-3xl font-bold mb-3">
            오늘의 모드
          </h2>
          <p className="nk-subtitle mb-4">
            오늘 하루를 1~3줄로 남기면, 넝쿨OS가 당신의 의사결정 모드를
            계산합니다.
          </p>

          {/* 넝쿨 레벨 */}
          <div className="mb-4">
            <VineLevel level={level} xp={xp} nextLevelXp={NEXT_LEVEL_XP} />
          </div>

          {/* 입력창 */}
          <textarea
            className="nk-textarea"
            placeholder="예: 해야 할 일은 많은데 손이 잘 안 간다. 스스로가 조금 답답하게 느껴진다."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* 큰 파란 버튼 */}
          <div className="mt-5 flex justify-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`nk-btn-primary px-10 py-3 rounded-full text-sm md:text-base font-bold shadow-md 
                flex items-center gap-2 transition-all
                ${
                  isSaving
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:-translate-y-0.5"
                }
              `}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <span>저장 중...</span>
                </>
              ) : (
                <span>오늘 기록 저장 &amp; 모드 보기</span>
              )}
            </button>
          </div>

          {/* 오늘 기록 카드 */}
          {saved && (
            <div className="nk-card mt-6">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm">오늘 기록</div>
                {savedAt && (
                  <span className="text-xs text-gray-400">{savedAt}</span>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-line text-sm md:text-base">
                {saved}
              </p>
            </div>
          )}

          {/* 오늘의 모드 + 인사이트 + 추천 행동 카드 */}
          {mode && (
            <>
              {/* 1) 오늘의 모드 */}
              <div className="nk-card nk-card-soft mt-4">
                <div className="font-semibold mb-1 text-nk-text-strong text-sm">
                  오늘의 모드
                </div>
                <p className="text-nk-primary font-bold text-sm md:text-base">
                  {MODE_LABEL[mode] || mode}
                </p>
              </div>

              {/* 2) 오늘 모드에 대한 "한 줄 인사이트" */}
              <div className="nk-card nk-card-soft mt-3">
                <div className="font-semibold mb-2 text-nk-text-strong text-sm">
                  한 줄 인사이트
                </div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {buildModeInsight(mode, logs)}
                </p>
              </div>

              {/* 3) 오늘의 추천 행동 */}
              <div className="nk-card nk-card-soft mt-3">
                <div className="font-semibold mb-2 text-nk-text-strong text-sm">
                  추천 행동
                </div>
                <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                  {llmAction || actionsForMode(mode)[0]}
                </p>
              </div>
            </>
          )}

          {/* 마음 바이탈 차트 */}
          {logs.length > 0 && (
            // min-h를 줘서 Recharts의 width/height -1 warning을 줄임
            <div className="nk-card mt-8 min-h-[260px]">
              <NKChart logs={logs} />
            </div>
          )}

          {/* 최근 기록 5개 */}
          {recentLogs.length > 0 && (
            <div className="nk-card mt-6 text-xs md:text-sm">
              <div className="font-semibold mb-2 text-nk-text-strong">
                최근 기록 5개
              </div>
              <ul className="space-y-2">
                {recentLogs.map((log) => (
                  <li
                    key={log.id}
                    className="nk-log-row flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                  >
                    <div className="text-gray-500">
                      {formatKoreanTime(log.created_at || log.date)}
                    </div>

                    <div className="flex-1 md:mx-4 text-gray-700 truncate">
                      {log.text}
                    </div>
                    <div className="text-[11px] md:text-xs text-blue-700 font-semibold">
                      {MODE_LABEL[log.mode] || log.mode}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 디버그 패널 (debug=1일 때만) */}
          {debugEnabled && debugData && (
            <div className="mt-8 opacity-60 hover:opacity-100 transition-opacity">
              <DebugPanel
                text={debugData.text}
                signals={debugData.signals}
                patternBoosts={debugData.patternBoosts}
                scores={debugData.scores}
                finalMode={debugData.finalMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Pro 전환 모달 (30개 도달 시, FREE 유저만) */}
      {showProModal && userStage === "READY_FOR_PRO" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">🎉 기록이 30개를 넘었어요!</h3>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              이제부터는 지난 기록들을 길게 모아서 볼수록{" "}
              <strong>장기 패턴</strong>이 또렷하게 드러나는 구간이에요.
            </p>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              아직 정식 결제 시스템은 준비 중이라,
              현재는 <strong>카카오톡 후원 + Pro Early Access</strong> 방식으로
              Pro 기능을 열어드리고 있어요. 💛
            </p>

            <div className="mb-4 text-[11px] text-gray-500 bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="font-semibold text-gray-700 mb-1">
                카카오톡 후원 안내
              </div>
              <p>1. 카카오톡 &gt; 송금 메뉴로 들어갑니다.</p>
              <p>2. 아래 계좌로 송금 부탁 드립니다.</p>
              <p className="mt-1">
                - 계좌:{" "}
                <span className="font-mono">
                  토스뱅크 / 1002-2656-2081 / 박경은
                </span>
                <br />
              </p>
              <p className="mt-1">
                3. 송금 후, 아래 &quot;Pro 활성화 요청&quot; 버튼을 눌러
                알려주시면 확인 후 Pro 권한을 열어드립니다.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <button
                className="px-4 py-2 rounded-full bg-nk-primary text-white font-semibold"
                onClick={() => {
                  setShowProModal(false);
                  navigate("/pro-support");
                }}
              >
                후원 완료했어요 · Pro 활성화 요청하기
              </button>

              <button
                className="px-3 py-2 rounded-full border text-gray-500"
                onClick={() => setShowProModal(false)}
              >
                나중에 할게요 (계속 무료로 사용)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단: 왜 OS가 필요한가 / 모드 설명 카드 */}
      <div className="mt-10">
        <StorySection />
      </div>
      <div className="mt-10">
        <ModesSection />
      </div>
    </section>
  );
}

export default DailyLogInput;
