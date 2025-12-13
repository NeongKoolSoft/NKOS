// src/pages/LifePage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

// ============================================================
// 0) 상수/라벨
// ============================================================
const DOMAIN_LABEL_KO = {
  STABILITY: "안정",
  GROWTH: "성장",
  ACHIEVEMENT: "성취",
  RELATIONSHIP: "관계",
  FREEDOM: "자유",
  MEANING: "의미",
  NONE: "없음",
};

const CHAPTERS = ["갈증/방황", "확장/도전", "정체/무기력", "안정/만족"];
const CHAPTER_POS = {
  "갈증/방황": { x: 60, y: 40 }, // 좌상
  "확장/도전": { x: 260, y: 40 }, // 우상
  "정체/무기력": { x: 60, y: 170 }, // 좌하
  "안정/만족": { x: 260, y: 170 }, // 우하
  UNKNOWN: { x: 160, y: 105 },
};

// ============================================================
// 1) 유틸 함수들
// ============================================================

function pickChapterDescription(chapter) {
  switch (chapter) {
    case "갈증/방황":
      return "욕망이 큰데 현실 갭도 커서 마음이 바쁘게 흔들릴 수 있는 구간이에요.";
    case "확장/도전":
      return "욕망이 크고 움직임도 있는 구간이에요. 작은 실행을 꾸준히 쌓기 좋아요.";
    case "안정/만족":
      return "욕망이 과도하지 않고 흐름이 비교적 안정적인 구간이에요. 리듬 유지가 핵심이에요.";
    case "정체/무기력":
      return "욕망은 크지 않지만 갭이 느껴질 수 있는 구간이에요. 부담 없는 1스텝이 필요해요.";
    default:
      return "아직 데이터가 충분치 않아 국면을 추정 중이에요. 기록이 쌓이면 더 정확해져요.";
  }
}

function compressTimeline(tl = []) {
  const out = [];
  for (const row of tl) {
    const chapter = row?.chapter;
    if (!chapter) continue;
    const prev = out[out.length - 1];
    if (!prev || prev.chapter !== chapter) out.push(row);
  }
  return out;
}

function buildTransitionTrigger(timeline = []) {
  const path = compressTimeline(timeline);
  if (path.length <= 1)
    return "최근에는 큰 국면 이동이 없어요. 지금 리듬을 유지하는 게 좋아요.";

  const prev = path[path.length - 2];
  const curr = path[path.length - 1];

  const d0 = Number(prev?.desire);
  const g0 = Number(prev?.gap);
  const d1 = Number(curr?.desire);
  const g1 = Number(curr?.gap);

  const dd = Number.isFinite(d0) && Number.isFinite(d1) ? d1 - d0 : null;
  const dg = Number.isFinite(g0) && Number.isFinite(g1) ? g1 - g0 : null;

  const dTxt =
    dd == null
      ? "욕망 변화는 불명확했지만"
      : dd >= 1
      ? "욕망이 올라가면서"
      : dd <= -1
      ? "욕망이 내려가면서"
      : "욕망은 비슷한데";

  const gTxt =
    dg == null
      ? "갭 변화는 불명확했어요."
      : dg >= 1
      ? "현실 갭이 커졌어요."
      : dg <= -1
      ? "현실 갭이 줄었어요."
      : "현실 갭은 큰 변화가 없어요.";

  return `국면이 "${prev.chapter}" → "${curr.chapter}"로 이동했어요. ${dTxt} ${gTxt}`;
}

function clampPct(n) {
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ✅ 다음 1스텝 자동 생성 (프론트 규칙 기반 1차 버전)
function generateNextStep(life) {
  if (!life)
    return {
      type: "OBSERVE",
      text: "오늘은 판단하지 말고, 기록만 1줄 남겨보세요.",
      rationale: "Life 데이터가 아직 없어서, 관찰 모드로 시작해요.",
    };

  const chapter = life?.lifeChapter || "UNKNOWN";

  switch (chapter) {
    case "갈증/방황":
      return {
        type: "REDUCE_DESIRE",
        text: "오늘 하고 싶은 것 중 가장 큰 목표 1개를 이번 주에서 빼보세요.",
        rationale: "욕망 대비 현실 갭이 큰 구간이라, 먼저 분모(욕망)를 줄이는 게 안전해요.",
      };

    case "확장/도전":
      return {
        type: "INCREASE_ACHIEVEMENT",
        text: "오늘 계획 중 가장 쉬운 1줄을 10분 안에 끝내고 완료 표시하세요.",
        rationale: "욕망과 실행이 맞물리는 구간이에요. 분자(성취) 1칸을 확정해요.",
      };

    case "정체/무기력":
      return {
        type: "MICRO_ACTION",
        text: "타이머 5분만 켜고, 결과 상관없이 손만 움직여보세요.",
        rationale: "욕망 자체가 낮은 상태라, 초소형 행동이 가장 반발이 적어요.",
      };

    case "안정/만족":
      return {
        type: "MAINTAIN",
        text: "오늘 기록에 ‘잘 유지된 점’ 1줄만 추가하세요.",
        rationale: "지금은 바꾸는 것보다 흐름을 유지하는 게 더 큰 성취예요.",
      };

    default:
      return {
        type: "OBSERVE",
        text: "오늘은 판단 없이 기록만 1줄 남겨보세요.",
        rationale: "국면이 아직 UNKNOWN이라, 데이터부터 쌓는 게 좋아요.",
      };
  }
}

// ============================================================
// 2) 미니 컴포넌트들
// ============================================================

function LifeTransitionDiagram({ timeline = [], currentChapter = "UNKNOWN" }) {
  const path = compressTimeline(timeline);
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) edges.push([path[i], path[i + 1]]);

  const isKnown = (c) => !!CHAPTER_POS[c] && c !== "UNKNOWN";

  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "white",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
        국면 이동 다이어그램 (최근 7일)
      </div>

      <svg width="100%" viewBox="0 0 420 260" style={{ display: "block" }}>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" />
          </marker>
        </defs>

        {/* 이동 경로(점선) */}
        {edges.map(([a, b], idx) => {
          const A = a?.chapter;
          const B = b?.chapter;
          if (!isKnown(A) || !isKnown(B)) return null;

          const pA = CHAPTER_POS[A];
          const pB = CHAPTER_POS[B];
          return (
            <path
              key={idx}
              d={`M ${pA.x + 70} ${pA.y + 35} L ${pB.x + 70} ${pB.y + 35}`}
              fill="none"
              stroke="#111827"
              strokeWidth="2"
              strokeDasharray="6 6"
              markerEnd="url(#arrow)"
              opacity="0.55"
            />
          );
        })}

        {/* 노드 카드 */}
        {CHAPTERS.map((c) => {
          const p = CHAPTER_POS[c];
          const active = c === currentChapter;
          const sub =
            c === "갈증/방황"
              ? "욕망↑ 갭↑"
              : c === "확장/도전"
              ? "욕망↑ 갭↓"
              : c === "정체/무기력"
              ? "욕망↓ 갭↑"
              : "욕망↓ 갭↓";

          return (
            <g key={c} transform={`translate(${p.x}, ${p.y})`}>
              <rect
                x="0"
                y="0"
                width="140"
                height="70"
                rx="16"
                ry="16"
                fill={active ? "#EEF2FF" : "#F9FAFB"}
                stroke={active ? "#111827" : "#E5E7EB"}
                strokeWidth={active ? "2.5" : "1.5"}
              />
              <text x="14" y="28" fontSize="14" fontWeight="800" fill="#111827">
                {c}
              </text>
              <text x="14" y="50" fontSize="11" fill="#6B7280">
                {sub}
              </text>

              {active && (
                <>
                  <rect x="96" y="10" width="34" height="18" rx="9" fill="#111827" />
                  <text x="113" y="23" fontSize="10" fill="white" textAnchor="middle">
                    NOW
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: 8, fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
        {path.length <= 1 ? (
          <span>최근 7일 동안 국면 변화가 크지 않았어요.</span>
        ) : (
          <span>
            이동:{" "}
            {path.map((p, i) => (
              <span key={(p.date || "d") + i}>
                <b>{p.chapter}</b>
                {i < path.length - 1 ? " → " : ""}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function TrendBars({ timeline = [] }) {
  const rows = (timeline || []).slice(-7); // 최근 7개
  const max = 5;

  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "white",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
        욕망/현실갭 트렌드 (최근 7일)
      </div>

      {/* 욕망 */}
      <div style={{ fontSize: 12, color: "#111827", marginBottom: 6 }}>욕망 강도</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 42, marginBottom: 10 }}>
        {rows.map((r, idx) => {
          const v = Number(r?.desire);
          const h = Number.isFinite(v) ? Math.max(2, Math.round((v / max) * 40)) : 2;
          return (
            <div
              key={"d" + (r?.date || idx)}
              style={{ width: 14, height: h, borderRadius: 6, background: "#111827", opacity: 0.25 }}
            />
          );
        })}
      </div>

      {/* 갭 */}
      <div style={{ fontSize: 12, color: "#111827", marginBottom: 6 }}>현실 갭</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 42 }}>
        {rows.map((r, idx) => {
          const v = Number(r?.gap);
          const h = Number.isFinite(v) ? Math.max(2, Math.round((v / max) * 40)) : 2;
          return (
            <div
              key={"g" + (r?.date || idx)}
              style={{ width: 14, height: h, borderRadius: 6, background: "#111827", opacity: 0.12 }}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#6B7280" }}>
        막대는 0~5 스케일 기준이에요. (왼쪽 → 오른쪽: 과거 → 최근)
      </div>
    </div>
  );
}

// ============================================================
// 3) 메인 페이지 컴포넌트
// ============================================================
export default function LifePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [life, setLife] = useState(null);

  // ✅ DailyLogInput.jsx와 같은 ENV명을 쓰는 게 안전해요.
  // (네 프로젝트는 VITE_API_BASE_URL을 이미 쓰고 있음)
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // ---- 파생값(useMemo) ----
  const domainKo = useMemo(() => {
    const code = life?.topDesireDomain || "NONE";
    return DOMAIN_LABEL_KO[code] || code;
  }, [life]);

  const chapter = life?.lifeChapter || "UNKNOWN";
  const chapterDesc = useMemo(() => pickChapterDescription(chapter), [chapter]);

  const timeline = life?.timeline || [];

  // ✅ 행복 = 성취/욕망 (서버에서 0~100으로 내려주는 happiness가 있으면 그대로 사용)
  const safeH = useMemo(() => clampPct(Number(life?.happiness)), [life]);

  const triggerLine = useMemo(() => buildTransitionTrigger(timeline), [timeline]);

  const oneLine = useMemo(() => {
    if (safeH == null) return "아직 데이터가 부족해요. 기록이 쌓이면 행복 지수를 계산해드릴게요.";
    if (safeH >= 70) return "이번 주는 욕망 대비 성취가 잘 따라오고 있어요. 리듬을 유지하면 좋아요.";
    if (safeH >= 40) return "욕망은 있는데 성취가 조금 늦는 편이에요. ‘작은 완료’가 도움돼요.";
    return "욕망 대비 성취가 낮아 피로가 쌓일 수 있어요. 목표를 더 작게 쪼개보세요.";
  }, [safeH]);

  // ✅ 다음 1스텝
  const nextStep = useMemo(() => generateNextStep(life), [life]);

  // ---- 데이터 로드 ----
  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErrMsg("");

      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.user?.id) {
        if (alive) {
          setLoading(false);
          setErrMsg("로그인이 필요합니다.");
        }
        return;
      }

      try {
        const resp = await fetch(`${apiBase}/api/insight/weekly-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, range: "7d" }),
        });

        const raw = await resp.text();

        let json = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(`서버 응답이 JSON이 아님: ${resp.status} ${raw.slice(0, 120)}`);
        }

        if (!resp.ok || !json?.ok) {
          throw new Error(json?.error || `요청 실패: ${resp.status}`);
        }

        const lifeData = json?.data?.life || null;
        if (alive) setLife(lifeData);
      } catch (e) {
        if (alive) setErrMsg(e?.message || "데이터를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [apiBase]);

  // ---- 렌더 ----
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      {/* 상단 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid #e5e7eb",
            padding: "8px 12px",
            borderRadius: 10,
            background: "white",
            cursor: "pointer",
          }}
        >
          ← 돌아가기
        </button>

        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>넝쿨라이프</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>최근 7일 기반의 삶의 국면(챕터) & 이동</div>
        </div>
      </div>

      {/* 로딩/에러 */}
      {loading && (
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 14 }}>
          불러오는 중…
        </div>
      )}

      {!loading && errMsg && (
        <div
          style={{
            padding: 16,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            borderRadius: 14,
            color: "#9f1239",
          }}
        >
          {errMsg}
        </div>
      )}

      {/* 메인 카드 */}
      {!loading && !errMsg && (
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "white",
            boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
          }}
        >
          {/* 핵심 요약 */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>현재 Life Chapter</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{chapter}</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>주요 욕망 도메인</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{domainKo}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, lineHeight: 1.55, color: "#111827" }}>{chapterDesc}</div>

          {/* 이번 주 변화(트리거) */}
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#111827",
              lineHeight: 1.5,
              fontSize: 13,
            }}
          >
            <b>이번 주 변화</b> · {triggerLine}
          </div>

          {/* 행복 게이지 */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
              <span>행복 지수 (성취/욕망)</span>
              <span>{safeH == null ? "N/A" : `${safeH}%`}</span>
            </div>

            <div style={{ height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden", marginTop: 6 }}>
              <div style={{ width: `${safeH ?? 0}%`, height: "100%", background: "#111827", opacity: 0.25 }} />
            </div>

            <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>{oneLine}</div>
          </div>

          {/* ✅ 다음 1스텝 (추가한 “윗 부분”은 여기서 출력) */}
          {nextStep && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 16,
                border: "1px solid #111827",
                background: "#111827",
                color: "white",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>다음 1스텝 (오늘)</div>
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4 }}>{nextStep.text}</div>
              {nextStep.rationale && (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>이유 · {nextStep.rationale}</div>
              )}
            </div>
          )}

          {/* 국면 이동 다이어그램 */}
          <LifeTransitionDiagram timeline={timeline} currentChapter={chapter} />

          {/* 욕망/갭 트렌드 */}
          <TrendBars timeline={timeline} />

          {/* 주의 신호 */}
          {life?.caution && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
                lineHeight: 1.5,
              }}
            >
              <b>주의 신호</b> · {life.caution}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
            오늘 기록을 남기면 이동/트렌드가 더 정확해져요.
          </div>
        </div>
      )}
    </div>
  );
}
