// src/components/NKChart.jsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from "recharts";

// 모드 기반 에너지 점수 (1~5)
const MODE_VITAL_SCORE = {
  DELAY: 1,
  STABILIZE: 2,
  SIMPLIFY: 3,
  DECISIVE: 4,
  EXPLORATORY: 5,
  REFLECT: 2,
};

// 감정 텍스트에서 단순 스코어링 (추후 LLM 결과 대체 가능)
function analyzeEmotion(text = "") {
  const t = text.toLowerCase();

  if (
    t.includes("우울") ||
    t.includes("불안") ||
    t.includes("피곤") ||
    t.includes("힘들")
  )
    return -2;

  if (t.includes("짜증") || t.includes("귀찮") || t.includes("지루"))
    return -1;

  if (
    t.includes("좋다") ||
    t.includes("기분") ||
    t.includes("활기") ||
    t.includes("괜찮")
  )
    return +1;

  return 0; // 중립
}

// 날짜 라벨
function formatDate(raw) {
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

// 로그 → 차트 데이터 (nkos_logs 기준)
function buildChartData(nkos_logs = []) {
  const recent = [...nkos_logs].slice(-7); // 최근 7개

  return recent.map((log, idx) => {
    // created_at이 있으면 그걸 쓰고, 없으면 log_date / date 사용
    const rawDate = log.created_at || log.log_date || log.date;
    return {
      id: log.id ?? idx,
      date: formatDate(rawDate), // X축에 표시할 포맷된 날짜
      energy: MODE_VITAL_SCORE[log.mode] ?? 0,
      emotion: analyzeEmotion(log.text || log.message || ""),
      mode: log.mode,
    };
  });
}

// 커스텀 툴팁
function VitalTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;

  return (
    <div className="bg-white/95 border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-gray-700 mb-1">{p.date}</div>
      <div className="text-pink-500 font-semibold">모드: {p.mode}</div>
      <div>에너지: {p.energy}</div>
      <div>감정: {p.emotion}</div>
    </div>
  );
}

function NKChart({ nkos_logs }) {
  const data = buildChartData(nkos_logs || []);
  if (!data.length) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        마음 바이탈 흐름 (최근 {data.length}건)
      </h3>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="energy" domain={[1, 5]} hide />
            <YAxis yAxisId="emotion" domain={[-2, 2]} hide />
            <Tooltip content={<VitalTooltip />} />

            {/* 에너지 영역 + 라인 */}
            <defs>
              <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <Area
              yAxisId="energy"
              type="monotone"
              dataKey="energy"
              stroke="none"
              fill="url(#energyFill)"
            />

            <Line
              yAxisId="energy"
              type="monotone"
              dataKey="energy"
              stroke="#ec4899"
              strokeWidth={2.4}
              dot={{ r: 4 }}
            />

            {/* 감정 밸런스 라인 */}
            <Line
              yAxisId="emotion"
              type="monotone"
              dataKey="emotion"
              stroke="#3b82f6"
              strokeWidth={2.2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 라벨 설명 */}
      <div className="mt-2 text-[10px] text-gray-400 flex justify-between">
        <span>에너지(핑크): 1~5</span>
        <span>감정(파랑): -2~+2</span>
      </div>
    </div>
  );
}

export default NKChart;
