// src/components/HistoryPage.jsx
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nuckleos_logs_v1";

const MODE_LABEL = {
  DELAY: "DELAY : 결정 보류",
  STABILIZE: "STABILIZE : 안정 회복",
  REFLECT: "REFLECT : 성찰/내면정리",
  SIMPLIFY: "SIMPLIFY : 단순화",
  DECISIVE: "DECISIVE : 결단/실행",
  EXPLORATORY: "EXPLORATORY : 탐색/실험",
};

// 리포트용 모드 해석 문장
const MODE_SUMMARY_TEXT = {
  DELAY:
    "최근에는 결정을 미루고 상황을 더 지켜보는 경향이 많았습니다. 큰 결정보다는 에너지 회복과 정리부터 하는 것이 좋습니다.",
  STABILIZE:
    "최근에는 기준을 다시 잡고, 생활·업무를 안정시키는 흐름이 많았습니다. 급한 확장보다 루틴을 다지는 시기에 가깝습니다.",
  REFLECT:
    "최근에는 스스로를 돌아보고, 기준과 감정을 정리하는 흐름이 강했습니다. 성찰과 내면 정리에 좋은 타이밍입니다.",
  SIMPLIFY:
    "최근에는 복잡한 것들을 줄이고, 우선순위를 정리하는 흐름이 두드러집니다. 해야 할 일을 가볍게 줄이기에 좋은 시기입니다.",
  DECISIVE:
    "최근에는 결단과 실행 중심의 흐름이 강했습니다. 미뤄둔 일을 밀어붙이거나, 중요한 결정을 내리기에 좋은 타이밍입니다.",
  EXPLORATORY:
    "최근에는 새로운 시도와 탐색의 비중이 높았습니다. 실험과 테스트, 아이디어 발산에 잘 맞는 구간입니다.",
};

// "2025-11-24" 또는 "2025. 11. 24." 같은 걸 비교용 YYYY-MM-DD로 변환
function normalizeDateKey(raw) {
  if (!raw) return "";

  // 이미 YYYY-MM-DD 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // "2025. 11. 24." 형식 처리
  const m = raw.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    const mm = String(mo).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  // 기타 포맷은 Date로 한 번 시도
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState(""); // yyyy-MM-dd
  const [endDate, setEndDate] = useState(""); // yyyy-MM-dd
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [report, setReport] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 최신이 위로 오도록
        setLogs([...parsed].reverse());
      }
    } catch (e) {
      console.error("Failed to load logs from localStorage", e);
    }
  }, []);

  // 기간 필터 적용된 로그
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const dateKey = normalizeDateKey(log.date || "");
      if (!dateKey) return false;

      if (startDate && dateKey < startDate) return false;
      if (endDate && dateKey > endDate) return false;

      return true;
    });
  }, [logs, startDate, endDate]);

  // 모드 통계 (필터된 로그 기준)
  const modeStats = filteredLogs.reduce(
    (acc, log) => {
      if (log.mode && acc[log.mode] != null) {
        acc[log.mode] += 1;
      }
      return acc;
    },
    {
      DELAY: 0,
      STABILIZE: 0,
      REFLECT: 0,
      SIMPLIFY: 0,
      DECISIVE: 0,
      EXPLORATORY: 0,
    }
  );

  const total = filteredLogs.length || 1; // 0으로 나누기 방지

  // 현재 목록 전체 선택 여부
  const allVisibleSelected =
    filteredLogs.length > 0 &&
    filteredLogs.every((log) => selectedIds.has(log.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        // 전체 해제
        filteredLogs.forEach((log) => next.delete(log.id));
      } else {
        // 전체 선택
        filteredLogs.forEach((log) => {
          if (log.id != null) next.add(log.id);
        });
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      alert("삭제할 기록을 먼저 선택해 주세요.");
      return;
    }

    if (!window.confirm("선택한 기록을 정말 삭제할까요?")) return;

    const remaining = logs.filter((log) => !selectedIds.has(log.id));
    setLogs(remaining);
    setSelectedIds(new Set());

    // 저장은 원래 순서(오래된 → 최신)로 맞춰서 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...remaining].reverse()));
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setReport(null);
  };

  // 🔹 리포트 생성
  const handleGenerateReport = () => {
    if (filteredLogs.length === 0) {
      alert("해당 기간에 기록이 없습니다. 먼저 기록을 남겨주세요.");
      return;
    }

    // 실제 기간: 필터된 로그들 기준 최소/최대 날짜
    const dateKeys = filteredLogs
      .map((log) => normalizeDateKey(log.date || ""))
      .filter(Boolean)
      .sort();

    const from = startDate || dateKeys[0];
    const to = endDate || dateKeys[dateKeys.length - 1];

    // 최다 모드 찾기
    let topMode = null;
    let topCount = 0;
    Object.entries(modeStats).forEach(([mode, count]) => {
      if (count > topCount) {
        topCount = count;
        topMode = mode;
      }
    });

    const totalCount = filteredLogs.length;
    const topPercent =
      totalCount > 0 ? Math.round((topCount / totalCount) * 100) : 0;

    // 대표 기록 3개 (최신순)
    const samples = filteredLogs.slice(0, 3).map((log) => ({
      id: log.id,
      date: log.date,
      mode: log.mode,
      text: log.text,
    }));

    setReport({
      from,
      to,
      totalCount,
      topMode,
      topPercent,
      samples,
    });
  };

  const handleClearReport = () => {
    setReport(null);
  };

  return (
    <section className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 nk-text-primary">
          기록 히스토리
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-6">
          지금까지 남긴 하루 기록과 의사결정 모드의 목록입니다.
        </p>

        {/* 기간 필터 */}
        <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs md:text-sm">
          <div className="font-semibold mb-2">기간별 조회</div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">시작일</span>
              <input
                type="date"
                className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">종료일</span>
              <input
                type="date"
                className="border border-gray-300 rounded px-2 py-1 text-xs md:text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilter}
              className="ml-auto md:ml-0 text-xs md:text-sm text-blue-600 underline whitespace-nowrap"
            >
              기간 초기화
            </button>
          </div>
        </div>

        {/* 모드 요약 */}
        <div className="mb-6 p-4 rounded-lg bg-white border border-gray-200 text-xs md:text-sm">
          <div className="font-semibold mb-2">모드 요약</div>
          {filteredLogs.length === 0 ? (
            <p className="text-gray-500">
              해당 기간에 저장된 기록이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              {Object.entries(modeStats).map(([mode, count]) => (
                <div
                  key={mode}
                  className="p-2 rounded-md bg-nk-bg border border-nk-accent/40"
                >
                  <div className="text-[11px] md:text-xs font-semibold text-nk-primary mb-1">
                    {mode}
                  </div>
                  <div className="text-sm md:text-base font-bold">
                    {count}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500">
                    {Math.round((count / total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 선택/삭제 + 리포트 생성 툴바 */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 text-xs md:text-sm gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
              />
              <span>현재 목록 전체 선택</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateReport}
                className="px-5 py-1 rounded-md bg-blue-600 text-white font-semibold text-xs md:text-sm"
              >
                출력
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-5 py-1 rounded-md bg-blue-600 text-white font-semibold text-xs md:text-sm"
              >
                삭제
              </button>
              <span className="text-gray-500">
                선택 {selectedIds.size}건 / 표시 {filteredLogs.length}건 (전체{" "}
                {logs.length}건)
              </span>
            </div>
          </div>
        )}

        {/* 리포트 카드 */}
        {report && (
          <div className="mb-6 p-4 rounded-lg bg-white border border-blue-200 text-xs md:text-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-blue-700">
                기간별 리포트 ({report.from} ~ {report.to})
              </div>
              <button
                type="button"
                onClick={handleClearReport}
                className="text-[11px] text-gray-500 underline"
              >
                리포트 숨기기
              </button>
            </div>
            <div className="mb-2">
              <div>
                전체 기록 수:{" "}
                <span className="font-semibold">{report.totalCount}</span>건
              </div>
              {report.topMode && (
                <div>
                  가장 많이 나타난 모드:{" "}
                  <span className="font-semibold">
                    {MODE_LABEL[report.topMode] || report.topMode}
                  </span>{" "}
                  (
                  <span className="font-semibold">
                    {report.topPercent}%
                  </span>
                  )
                </div>
              )}
            </div>
            {report.topMode && (
              <p className="mb-3 text-gray-700">
                {MODE_SUMMARY_TEXT[report.topMode]}
              </p>
            )}
            {report.samples.length > 0 && (
              <div>
                <div className="font-semibold mb-1">대표 기록</div>
                <ul className="space-y-1">
                  {report.samples.map((s) => (
                    <li key={s.id} className="text-gray-700">
                      <span className="text-[11px] text-gray-500 mr-2">
                        {s.date}
                      </span>
                      <span className="text-[11px] text-blue-700 mr-1">
                        {MODE_LABEL[s.mode] || s.mode}
                      </span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 히스토리 리스트 */}
        {filteredLogs.length === 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
            해당 기간에 저장된 기록이 없습니다. 메인 화면에서 오늘의 기록을
            먼저 남겨보세요.
          </div>
        )}

        {filteredLogs.length > 0 && (
          <ul className="space-y-3 text-sm md:text-base">
            {filteredLogs.map((log) => (
              <li
                key={log.id}
                className="p-3 rounded-lg border border-gray-200 bg-white flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(log.id)}
                      onChange={() => toggleSelect(log.id)}
                    />
                    <span className="text-xs text-gray-500">{log.date}</span>
                  </div>
                  <span className="text-[11px] md:text-xs text-blue-700 font-semibold">
                    {MODE_LABEL[log.mode] || log.mode}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-line">{log.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default HistoryPage;
