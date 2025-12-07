// src/pages/Insight.jsx
// 넝쿨 인사이트 v2.1
// - 최근 7일 / 30일 범위 선택
// - nkos_logs 기반 모드 통계
// - planner_items(user_id + date) 기반 실행률 통계
// - 모드 분포 차트 / 실행률 타임라인
// - 📈 모드 변화 타임라인 (새로 추가)
// - 📊 모드 × 실행률 상관 분석

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  LabelList, // ← 모드 라벨 표시용
} from "recharts";
import { Link } from "react-router-dom";

const RANGE_OPTIONS = [
  { key: "7d", label: "최근 7일" },
  { key: "30d", label: "최근 30일" },
];

// 기간 키 → [from, to] (YYYY-MM-DD)
function getDateRange(rangeKey) {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  const fromDate = new Date(today);
  if (rangeKey === "30d") {
    fromDate.setDate(fromDate.getDate() - 29);
  } else {
    fromDate.setDate(fromDate.getDate() - 6);
  }
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

// 모드별 평균 실행률 → 한 줄 요약 메시지
function getModeRateInsight(modeRateAvg) {
  const entries = Object.entries(modeRateAvg);
  if (entries.length === 0) {
    return "아직 모드와 실행률을 함께 볼 수 있을 만큼 데이터가 충분하지 않아요.";
  }

  let bestMode = null;
  let bestRate = -1;
  let worstMode = null;
  let worstRate = 101;

  entries.forEach(([mode, rate]) => {
    if (rate > bestRate) {
      bestRate = rate;
      bestMode = mode;
    }
    if (rate < worstRate) {
      worstRate = rate;
      worstMode = mode;
    }
  });

  if (entries.length === 1) {
    return `이번 기간에는 ${bestMode} 모드에서 평균 실행률이 ${bestRate}%였어요. 이 모드의 특징을 잘 활용해보면 좋아요.`;
  }

  return `이번 기간에는 ${bestMode} 모드에서 평균 실행률이 가장 높았고, ${worstMode} 모드에서 가장 낮았어요.`;
}

async function generateWeeklyReport() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/insight/weekly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        range,
        modeTimeline,
        plannerRates,
        modeCounts,
        avgRate,
      }),
    });

    const { report } = await response.json();
    setAiReport(report);
  } catch (e) {
    console.error("Weekly report error", e);
    setError("리포트를 생성하는 중 문제가 발생했습니다.");
  } finally {
    setLoading(false);
  }
}


function Insight() {
  const [userId, setUserId] = useState(null);
  const [range, setRange] = useState("7d");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 로그 요약
  const [logSummary, setLogSummary] = useState({
    totalLogs: 0,
    dayCount: 0,
    modeCounts: {},
    topMode: null,
  });

  // 플래너 요약
  const [plannerSummary, setPlannerSummary] = useState({
    daysWithPlan: 0,
    avgRate: null,
    ratesByDate: [], // [{ date, rate }]
  });

  // 모드별 평균 실행률
  const [modeRateAvg, setModeRateAvg] = useState({});

  // 📈 모드 변화 타임라인 데이터
  //   예: [{ date: '2025-12-03', mode: 'REFLECT', index: 1 }, ...]
  const [modeTimeline, setModeTimeline] = useState([]);

  // 로그인 유저
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "로그인이 필요합니다. 인사이트를 보려면 먼저 기록을 남겨주세요."
        );
        setLoading(false);
        return;
      }
      setUserId(user.id);
    };
    loadUser();
  }, []);

  // 메인 인사이트 로딩
  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      setLoading(true);
      setError("");

      const { from, to } = getDateRange(range);

      try {
        // -------------------------------
        // 1) nkos_logs에서 모드 통계
        // -------------------------------
        const { data: logs, error: logError } = await supabase
          .from("nkos_logs")
          .select("mode, log_date")
          .eq("user_id", userId)
          .gte("log_date", from)
          .lte("log_date", to)
          .order("log_date", { ascending: true });

        if (logError) throw logError;

        const modeCounts = {};
        const daySet = new Set();
        const modeByDate = new Map(); // 날짜 → 대표 모드

        logs?.forEach((row) => {
          if (row.log_date) {
            daySet.add(row.log_date);
            if (row.mode) {
              // 같은 날짜에 여러 줄이 있어도,
              // "하루를 대표하는 모드 1개"만 쓰기 위해 마지막 값만 저장
              modeByDate.set(row.log_date, row.mode);
            }
          }
          if (row.mode) {
            modeCounts[row.mode] = (modeCounts[row.mode] || 0) + 1;
          }
        });

        let topMode = null;
        let topCount = 0;
        Object.entries(modeCounts).forEach(([mode, count]) => {
          if (count > topCount) {
            topCount = count;
            topMode = mode;
          }
        });

        setLogSummary({
          totalLogs: logs?.length || 0,
          dayCount: daySet.size,
          modeCounts,
          topMode,
        });

        // 📈 모드 변화 타임라인용 데이터 생성
        const modeTimelineData = Array.from(modeByDate.entries())
          .map(([date, mode]) => ({
            date,
            mode,
            index: 1, // y축에 찍기 위한 더미 값 (항상 1)
          }))
          .sort((a, b) => (a.date < b.date ? -1 : 1));

        setModeTimeline(modeTimelineData);

        // -------------------------------
        // 2) planner_items에서 실행률 통계
        //    (user_id + date 기준으로 직접 집계)
        // -------------------------------
        const { data: items, error: itemError } = await supabase
          .from("planner_items")
          .select("date, completed")
          .eq("user_id", userId)
          .gte("date", from)
          .lte("date", to);

        if (itemError) throw itemError;

        if (!items || items.length === 0) {
          setPlannerSummary({
            daysWithPlan: 0,
            avgRate: null,
            ratesByDate: [],
          });
          setModeRateAvg({});
        } else {
          // date → [completed, completed, ...]
          const byDate = new Map();
          items.forEach((row) => {
            if (!row.date) return;
            const dateStr = row.date;
            const completed = !!row.completed;

            if (!byDate.has(dateStr)) {
              byDate.set(dateStr, []);
            }
            byDate.get(dateStr).push(completed);
          });

          let totalRateSum = 0;
          let rateCount = 0;
          const ratesByDate = [];

          byDate.forEach((list, dateStr) => {
            if (!list || list.length === 0) return;
            const total = list.length;
            const completed = list.filter(Boolean).length;
            const rate = completed / total;

            ratesByDate.push({
              date: dateStr,
              rate: Math.round(rate * 100),
            });

            totalRateSum += rate;
            rateCount += 1;
          });

          const avgRate =
            rateCount === 0
              ? null
              : Math.round((totalRateSum / rateCount) * 100);

          ratesByDate.sort((a, b) => (a.date < b.date ? -1 : 1));

          setPlannerSummary({
            daysWithPlan: byDate.size,
            avgRate,
            ratesByDate,
          });

          // -------------------------------
          // 3) 모드 × 실행률 상관 분석
          // -------------------------------
          const rateByDate = new Map();
          ratesByDate.forEach((item) => {
            rateByDate.set(item.date, item.rate);
          });

          const modeRateGroups = {};
          rateByDate.forEach((rate, date) => {
            const mode = modeByDate.get(date);
            if (!mode) return;

            if (!modeRateGroups[mode]) {
              modeRateGroups[mode] = [];
            }
            modeRateGroups[mode].push(rate);
          });

          const avgByMode = {};
          Object.entries(modeRateGroups).forEach(([mode, list]) => {
            if (!list || list.length === 0) return;
            const sum = list.reduce((a, b) => a + b, 0);
            avgByMode[mode] = Math.round(sum / list.length);
          });

          setModeRateAvg(avgByMode);
        }
      } catch (e) {
        console.error("Insight load error:", e);
        setError("인사이트 데이터를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId, range]);

  const { totalLogs, dayCount, modeCounts, topMode } = logSummary;
  const { daysWithPlan, avgRate, ratesByDate } = plannerSummary;

  const modeChartData = Object.entries(modeCounts).map(([mode, count]) => ({
    mode,
    count,
  }));

  return (
    <section className="py-6 px-5 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="nk-title-main text-2xl font-bold">넝쿨 인사이트</h2>

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
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="nk-banner-strong text-xs md:text-sm">{error}</div>
        )}

        {/* 요약 카드 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="nk-card-soft space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              📌 기간 요약
            </div>
            <div className="text-sm text-slate-700">
              이 기간 동안 <b>{dayCount}</b>일에 걸쳐 총{" "}
              <b>{totalLogs}</b>개의 기록을 남겼어요.
            </div>
            <div className="text-xs text-slate-500">
              가장 자주 등장한 모드는{" "}
              <b>{topMode || "아직 충분한 데이터가 없어요"}</b> 입니다.
            </div>
          </div>

          <div className="nk-card-soft space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              ✅ 실행률 요약
            </div>
            {avgRate == null ? (
              <div className="text-sm text-slate-600">
                이 기간에는 플래너 데이터가 충분하지 않아요.
                <br />
                넝쿨플래너에서 하루 3줄 계획을 조금씩 쌓아보면 실행 패턴이
                보이기 시작해요.
              </div>
            ) : (
              <div className="text-sm text-slate-700">
                <b>{daysWithPlan}</b>일 동안 플래너를 사용했고,
                <br />
                하루 평균 실행률은 <b>{avgRate}%</b> 정도예요.
              </div>
            )}
          </div>
        </div>

        {/* 모드 분포 리스트 */}
        <div className="nk-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              🎭 모드 분포
            </h3>
          </div>

        {Object.keys(modeCounts).length === 0 ? (
            <p className="text-xs text-slate-400">
              선택한 기간 동안의 모드 기록이 아직 많지 않아요.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {Object.entries(modeCounts).map(([mode, count]) => (
                <li key={mode} className="flex justify-between">
                  <span>{mode}</span>
                  <span className="text-slate-500">{count}회</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 모드 분포 / 실행률 차트 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="nk-card-soft space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              🎭 모드 분포 차트
            </div>
            {modeChartData.length === 0 ? (
              <p className="text-xs text-slate-400">
                아직 모드 데이터가 충분하지 않아요.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={modeChartData}
                    margin={{ top: 10, right: 10, bottom: 20, left: -60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mode" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="nk-card-soft space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              ✅ 플래너 실행률 타임라인
            </div>
            {ratesByDate.length === 0 ? (
              <p className="text-xs text-slate-400">
                이 기간에는 플래너 실행 데이터가 아직 없어요.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={ratesByDate}
                    margin={{ top: 10, right: 10, bottom: 20, left: -20 }}                  
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      fontSize={11}
                    />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 📈 모드 변화 타임라인 */}
        <div className="nk-card-soft space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            📈 모드 변화 타임라인
          </div>
          {modeTimeline.length === 0 ? (
            <p className="text-xs text-slate-400">
              이 기간에는 모드 변화 데이터를 그릴 만큼 기록이 충분하지 않아요.
            </p>
          ) : (
            <div className="h-40 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={modeTimeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} />
                  {/* y축은 의미 없는 더미 값이라 숨김 */}
                  <YAxis hide domain={[0, 2]} />
                  <Tooltip
                    formatter={(_, __, props) =>
                      props && props.payload ? props.payload.mode : ""
                    }
                    labelFormatter={(label) => `날짜: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="index"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  >
                    {/* 각 포인트 위에 모드 이름 표시 */}
                    <LabelList dataKey="mode" position="top" fontSize={11} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            한 눈에 최근 며칠 동안의 기조가 어떻게 바뀌었는지 볼 수 있는 타임라인이에요.
          </p>
        </div>

        {/* 모드 × 실행률 분석 */}
        <div className="nk-card-soft space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            📊 모드 × 실행률 분석
          </div>

          {Object.keys(modeRateAvg).length === 0 ? (
            <p className="text-xs text-slate-400">
              아직 모드와 실행률을 함께 분석할 만큼 데이터가 충분하지 않아요.
              <br />
              기록과 플래너를 며칠 더 쌓아두면, 어떤 모드에서 실행력이 높은지
              패턴이 보이기 시작해요.
            </p>
          ) : (
            <>
              <ul className="space-y-1 text-sm">
                {Object.entries(modeRateAvg).map(([mode, rate]) => (
                  <li key={mode} className="flex justify-between">
                    <span>{mode}</span>
                    <span className="text-slate-600">{rate}%</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-2">
                {getModeRateInsight(modeRateAvg)}
              </p>
            </>
          )}
        </div>

        {loading && (
          <div className="text-[11px] text-slate-400 text-right">
            인사이트를 계산하는 중입니다...
          </div>
        )}
      </div>
      {/* Insight 페이지 맨 아래에 추가 */}
      <div className="text-center mt-8 mb-4">
        <Link
          to="/insight/report"
          className="text-[12px] text-nk-primary underline underline-offset-2 font-medium"
        >
          AI 주간 코칭 리포트 보러가기 →
        </Link>
      </div>      
    </section>
    
  );
}

export default Insight;
