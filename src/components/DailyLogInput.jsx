// src/components/DailyLogInput.jsx

import { useState, useEffect } from "react";
import { extractSignals, decideMode, computeScores } from "../lib/modeEngine";
import DebugPanel from "./DebugPanel";
import { getPatternBoosts } from "../lib/modePatterns";

const STORAGE_KEY = "nuckleos_logs_v1";

const MODE_LABEL = {
  DELAY: "DELAY : 결정 보류 모드",
  STABILIZE: "STABILIZE : 안정 회복 모드",
  SIMPLIFY: "SIMPLIFY : 단순화 모드",
  DECISIVE: "DECISIVE : 결단/실행 모드",
  EXPLORATORY: "EXPLORATORY : 탐색/실험 모드",
  REFLECT: "REFLECT : 성찰/내면 정리 모드",
};

// 모드별 오늘의 추천 행동
const actionsForMode = (mode) => {
  switch (mode) {
    case "DELAY":
      return [
        "오늘은 큰 결정은 잠시 보류하는 게 좋아요.",
        "정리보다 쉬는 시간을 먼저 확보해보세요.",
        "지금 피곤함의 원인을 가볍게 메모해보면 도움이 됩니다.",
      ];

    case "STABILIZE":
      return [
        "작은 일 하나만 정리하고 그 이상은 욕심내지 마세요.",
        "20~30분 정도 가벼운 산책이나 스트레칭을 해보세요.",
        "부담되는 일은 리스트에서 딱 하나만 남겨보세요.",
      ];

    case "REFLECT":
      return [
        "감정과 생각을 5줄 정도 글로 적어보세요.",
        "‘요즘 나에게 중요한 기준은 무엇일까?’ 질문을 던져보세요.",
        "지난 7일의 감정 흐름을 떠올리며 되짚어보세요.",
      ];

    case "SIMPLIFY":
      return [
        "지금 떠오르는 선택지를 최대 3개로 줄여보세요.",
        "오늘 가장 중요한 목표 하나만 골라보세요.",
        "불필요한 일정·할 일 1개를 과감히 삭제해보세요.",
      ];

    case "DECISIVE":
      return [
        "오늘 한 가지는 완료까지 밀어붙여보세요.",
        "5분 안에 바로 할 수 있는 실행을 지금 시작해보세요.",
        "계속 미뤘던 결론을 오늘은 가볍게 내려도 괜찮은 날입니다.",
      ];

    case "EXPLORATORY":
      return [
        "새로운 시도를 하나, 부담 없이 해보세요.",
        "아이디어 3개를 적고 가장 설레는 것을 골라보세요.",
        "완벽함보다 오늘은 ‘경험해보는 것’ 자체에 집중해보세요.",
      ];

    default:
      return [];
  }
};

function DailyLogInput() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [mode, setMode] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [logs, setLogs] = useState([]);
  const [debugData, setDebugData] = useState(null);

  // 🔹 URL 파라미터 기반 디버그 활성 여부
  const [debugEnabled, setDebugEnabled] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      setLogs(parsed);

      const latest = parsed[parsed.length - 1];
      setSaved(latest.text || "");
      setMode(latest.mode || "");
      setSavedAt(latest.date || "");
    } catch (e) {
      console.error("Failed to load logs from localStorage", e);
    }
  }, []);

  // 🔹 URL 쿼리로 디버그 모드 활성화 (?debug=1 일 때만)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "1") {
        setDebugEnabled(true);
      }
    } catch (e) {
      console.error("Failed to read debug query param", e);
    }
  }, []);  

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      //console.log("빈 문자열로 판단되어 return");
      return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // 0~11 이라 +1
    const dd = String(today.getDate()).padStart(2, "0");

    const dateStr = `${yyyy}-${mm}-${dd}`; // 로컬 시간 기준 YYYY-MM-DD

    // 이전 모드
    const prevMode = logs.length > 0 ? logs[logs.length - 1].mode : "";

    // 신호·패턴·점수 계산
    const signals = extractSignals(trimmed);
    const patternBoosts = getPatternBoosts(trimmed);
    const scores = computeScores(signals, patternBoosts, prevMode);
    const m = decideMode(signals, patternBoosts, prevMode);

    // 화면 표시용 상태 갱신
    setSaved(trimmed);
    setMode(m);
    setSavedAt(dateStr);

    setDebugData({
      text: trimmed,
      signals,
      patternBoosts,
      scores,
      finalMode: m,
    });

    // localStorage 저장
    try {
      const newEntry = {
        id: Date.now(),
        date: dateStr,
        text: trimmed,
        mode: m,
      };

      const nextLogs = [...logs, newEntry];
      setLogs(nextLogs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLogs));
    } catch (e) {
      console.error("Failed to save log to localStorage", e);
    }
  };

  const recentLogs = logs.slice(-5).reverse();

  return (
    <section className="py-6 px-5">
      <div className="max-w-3xl mx-auto">
        <h2 className="nk-title-main text-2xl md:text-3xl font-bold mb-3">
          오늘의 모드
        </h2>
        <p className="nk-subtitle mb-4">
          오늘 하루를 1~3줄로 남기면, 넝쿨OS가 당신의 의사결정 모드를 계산합니다.
        </p>

        <textarea
          className="nk-textarea"
          placeholder="예: 오늘은 넝쿨OS 구조를 잡았고, 약간 막연하지만 설렌다."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* 저장 정보 + 버튼 영역 */}
        <div className="nk-save-row">
          <button onClick={handleSave} className="nk-btn-primary nk-save-button">
            오늘 기록 저장 &amp; 모드 보기
          </button>
        </div>        

        {/* 오늘 기록 카드 */}
        {saved && (
          <div className="nk-card mt-6 text-sm md:text-base">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">오늘 기록</div>
              {savedAt && (
                <span className="text-xs text-gray-400">{savedAt}</span>
              )}
            </div>
            <p className="text-gray-700 whitespace-pre-line">{saved}</p>
          </div>
        )}

        {/* 오늘의 모드 + 추천 행동 */}
        {mode && (
          <>
            <div className="nk-card nk-card-soft mt-4 text-sm md:text-base">
              <div className="font-semibold mb-1 text-nk-text-strong">
                오늘의 모드
              </div>
              <p className="text-nk-primary font-bold">
                {MODE_LABEL[mode] || mode}
              </p>
            </div>

            {actionsForMode(mode).length > 0 && (
              <div className="nk-card nk-card-soft mt-3 text-xs md:text-sm">
                <div className="font-semibold mb-2 text-nk-text-strong">
                  오늘의 추천 행동
                </div>
                <ul className="list-disc ml-5 space-y-1 text-gray-700">
                  {actionsForMode(mode).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
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
                  <div className="text-gray-500">{log.date}</div>
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

        {/* 🔍 디버그 패널 */}
        {debugEnabled ? (
          <DebugPanel
            text={debugData?.text}
            signals={debugData?.signals}
            patternBoosts={debugData?.patternBoosts}
            scores={debugData?.scores}
            finalMode={debugData?.finalMode}
          />
        ) : null}
      </div>
    </section>
  );
}

export default DailyLogInput;
