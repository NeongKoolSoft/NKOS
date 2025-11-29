// src/components/NKChart.jsx
// 넝쿨OS 마음 바이탈 차트 (logs.signals 기반)

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MAX_VITAL = 5;

// 1) 한 로그의 signals → 에너지 / 불안 점수로 변환
function toVitals(signals = {}) {
  const delay = signals.DELAY || 0;
  const stabilize = signals.STABILIZE || 0;
  const decisive = signals.DECISIVE || 0;
  const exploratory = signals.EXPLORATORY || 0;

  // 실행/탐색 계열 → 에너지
  let energy = decisive + exploratory;
  // 지연/안정 계열 → 불안·피로
  let tension = delay + stabilize;

  // 0~5 사이로 클램프
  energy = Math.max(0, Math.min(MAX_VITAL, energy));
  tension = Math.max(0, Math.min(MAX_VITAL, tension));

  return { energy, tension };
}

// 2) 툴팁 컴포넌트(선택)
const VitalTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const energy = payload.find((p) => p.dataKey === "energy")?.value ?? 0;
  const tension = payload.find((p) => p.dataKey === "tension")?.value ?? 0;

  return (
    <div className="rounded-xl bg-white/95 shadow-lg border border-gray-100 px-3 py-2 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      <div className="space-y-0.5">
        <div className="text-[11px] text-emerald-600">
          에너지 : <span className="font-semibold">{energy}</span>
        </div>
        <div className="text-[11px] text-rose-500">
          불안/피로 : <span className="font-semibold">{tension}</span>
        </div>
      </div>
    </div>
  );
};

function NKChart({ logs }) {
  if (!logs || logs.length === 0) return null;

  // 3) 최근 7건만 사용 (일단 날짜 순 정렬)
  const last7 = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const data = last7.map((log) => {
    const { energy, tension } = toVitals(log.signals || {});
    return {
      date: log.date,   // x축
      energy,
      tension,
    };
  });

  return (
    <div>
      <div className="font-semibold text-sm mb-2 text-nk-text-strong">
        🧠 마음 바이탈 흐름 (최근 7건)
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickMargin={6}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fontSize: 10 }}
              ticks={[0, 1, 2, 3, 4, 5]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<VitalTooltip />} />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#10b981" // 에너지(초록)
              strokeWidth={2}
              dot={false}
              name="에너지"
            />
            <Line
              type="monotone"
              dataKey="tension"
              stroke="#ef4444" // 불안/피로(빨강)
              strokeWidth={1.5}
              dot={false}
              name="불안/피로"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default NKChart;
