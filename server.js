// server.js (최종 배포용 - 정리된 최종 버전)
// ------------------------------------------------------------
// 기능 1) 헬스체크 (/api/health) - Render 콜드스타트/상태 확인
// 기능 2) Gemini API 통신 (AI Logic)
//    - /api/generate-action : 로그 1줄 → signals + recommendedAction(JSON)
//    - /api/generate-report : logs 배열 → 마크다운 리포트(텍스트)
//    - /api/analyze-log     : (프로젝트 기존) callGeminiSafe 기반 분석
// 기능 3) ✅ Insight 주간/월간 코칭 리포트 (/api/insight/weekly-report)
//    - 1단계 목표: "LLM 출력 JSON 구조 고정"
//    - 프론트 호환: { report: string }도 함께 내려줌
// ------------------------------------------------------------

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { callGeminiSafe } from "./llmClient.js";
import { createClient } from "@supabase/supabase-js";

// ✅ [추가] PostgreSQL 연결을 위한 라이브러리 가져오기
import pg from "pg";
const { Pool } = pg;

dotenv.config();

// ============================================================
// 1) 필수 환경변수 체크
// ============================================================

// Gemini Key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY가 없습니다. Render 환경변수(.env)를 확인해주세요.");
  process.exit(1);
}

// Supabase 서버용 키 (Service Role)
// - 서버에서만 사용 (RLS 우회 가능)
// - 절대 프론트로 노출 금지
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다. Render 환경변수(.env)를 확인해주세요.");
  process.exit(1);
}

// ✅ 서버 전용 Supabase 클라이언트
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ------------------------------------------------------------
// ✅ [추가] 가상 ERP 데모용 DB 연결 (PostgreSQL Direct Connect)
// ------------------------------------------------------------
// 주의: 실제 배포 시에는 이 주소도 .env 파일에 넣는 것이 안전합니다.
//const connectionString = "postgresql://postgres:[nkerp15648978!]@db.fwsoxupbjdcvertfckbq.supabase.co:5432/postgres";
// ✅ [수정] IPv4 호환되는 'Pooler' 주소 사용 (포트 6543)
const connectionString = "postgresql://postgres.fwsoxupbjdcvertfckbq:nkerp15648978!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Supabase 접속 필수 설정
});
// ------------------------------------------------------------

// ============================================================
// 2) 서버 설정
// ============================================================
const app = express();
const port = process.env.PORT || 3000;

// CORS 설정: 로컬 + 배포 프론트만 허용
// - Vercel 도메인이 바뀌면 여기에 추가 필요
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://nkos.vercel.app",
    ],
  })
);

app.use(express.json());

// ============================================================
// 3) 헬스체크 (콜드 스타트 방지/상태 확인)
// ============================================================
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
});

// ============================================================
// 4) /api/generate-action (유지)
//    - 로그 1줄 → signals + recommendedAction(JSON)
// ============================================================
app.post("/api/generate-action", async (req, res) => {
  console.log("📡 [generate-action] 요청 수신");

  const { userLog } = req.body;

  // 기본 검증
  if (!userLog || typeof userLog !== "string") {
    return res.json({ signals: null, recommendedAction: "" });
  }

  try {
    // ✅ 기존 프롬프트 유지
    const prompt = `
## 역할
당신은 'NungleOS'의 초정밀 심리 분석 엔진입니다.

## 사용자 기록
"${userLog}"

## 임무 1: 심리 신호 분석 (0~3점 척도)
1) emotion_vs_logic (0~3)
- "피곤하다", "힘들다", "졸리다"는 육체적 상태이므로 0점

2) risk_avoidance (0~3)
3) responsibility_avoidance (0~3)
4) analysis_paralysis (0~3)
5) priority_confusion (0~3)
6) energy_level (0~3)
- "지쳤다", "의욕 없다"는 0점
7) novelty_drive (0~3)

## 임무 2: 맞춤형 행동 추천
(80자 이내, 구체적 행동 1가지)

## 출력 형식 (JSON Only)
{
  "signals": {
    "emotion_vs_logic": 0,
    "risk_avoidance": 0,
    "responsibility_avoidance": 0,
    "analysis_paralysis": 0,
    "priority_confusion": 0,
    "energy_level": 0,
    "novelty_drive": 0
  },
  "recommendedAction": "..."
}
`.trim();

    // ※ generate-action은 기존처럼 직접 fetch 사용 (현 구조 유지)
    const modelName = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.0,
          topP: 0.1,
          topK: 1,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ Google API Error:", err);
      return res.json({ signals: null, recommendedAction: "", error: err });
    }

    const result = await response.json();
    const parts = result?.candidates?.[0]?.content?.parts || [];

    let rawText = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("");
    rawText = typeof rawText === "string" ? rawText : String(rawText ?? "");

    // LLM이 ```json ``` 등을 섞어도 안전하게 제거
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    // JSON만 추출
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonString = (jsonMatch ? jsonMatch[0] : cleaned).trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ LLM JSON 파싱 실패:", e);
      return res.json({ signals: null, recommendedAction: "", error: "JSON_PARSE_ERROR" });
    }

    return res.json({
      signals: parsed.signals || null,
      recommendedAction: parsed.recommendedAction || "",
    });
  } catch (error) {
    console.error("❌ [generate-action] handler error:", error);
    return res.json({ signals: null, recommendedAction: "", error: "HANDLER_ERROR" });
  }
});

// ============================================================
// 5) ✅ 핵심: /api/insight/weekly-report (단 1개만 존재)
//    - 입력: { userId, range: "7d" | "30d" }
//    - 출력: { ok, data: reportJson, report: string }
//    - 1단계 목표: LLM 출력 JSON 구조 고정
// ============================================================

// 날짜 범위 계산 (7d/30d)
function getDateRange(range) {
  const safeRange = range === "30d" ? "30d" : "7d";
  const now = new Date();

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const days = safeRange === "30d" ? 30 : 7;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return {
    safeRange,
    days,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    periodLabel: safeRange === "30d" ? "최근 30일" : "최근 7일",
  };
}

// ============================================================
// [ADD] Desire Signals 집계 (nkos_desire_signals 기반)
// ============================================================

function summarizeDesireSignals(rows = []) {
  if (!rows.length) {
    return {
      days: 0,
      avg: null,
      topDomain: null,
      lifeChapter: "UNKNOWN",
      caution: null,
    };
  }

  const days = rows.length;

  // 평균
  const avg = (key) =>
    Math.round(
      (rows.reduce((s, r) => s + (Number(r[key]) || 0), 0) / days) * 10
    ) / 10;

  const desireAvg = avg("desire_intensity");
  const gapAvg = avg("gap_score");
  const controlAvg = avg("control_score");
  const fixationAvg = avg("fixation_score");

  // Top 도메인
  const domainCount = {};
  rows.forEach((r) => {
    if (!r.primary_domain) return;
    domainCount[r.primary_domain] =
      (domainCount[r.primary_domain] || 0) + 1;
  });

  let topDomain = null;
  let topCnt = 0;
  Object.entries(domainCount).forEach(([k, v]) => {
    if (v > topCnt) {
      topDomain = k;
      topCnt = v;
    }
  });

  // Life Chapter 분류 (욕망 vs 성취)
  // 성취는 planner 실행률로 외부에서 보정됨
  let lifeChapter = "UNKNOWN";
  if (desireAvg >= 3 && gapAvg >= 3) lifeChapter = "갈증/방황";
  else if (desireAvg >= 3 && gapAvg < 3) lifeChapter = "확장/도전";
  else if (desireAvg < 3 && gapAvg < 3) lifeChapter = "안정/만족";
  else if (desireAvg < 3 && gapAvg >= 3) lifeChapter = "정체/무기력";

  // 주의 신호
  let caution = null;
  if (fixationAvg >= 4) {
    caution = "욕망 대비 집착 신호가 높아 피로가 누적될 수 있어요.";
  } else if (controlAvg <= 2) {
    caution = "통제감이 낮아 무력감으로 이어질 가능성이 있어요.";
  }

  return {
    days,
    avg: {
      desire: desireAvg,
      gap: gapAvg,
      control: controlAvg,
      fixation: fixationAvg,
    },
    topDomain,
    lifeChapter,
    caution,
  };
}


// 통계 (LLM이 이해하기 좋은 형태)
function buildStats({ logs, plannerItems }) {
  const modeCounts = {};
  for (const row of logs) {
    const m = row.mode;
    if (!m) continue;
    modeCounts[m] = (modeCounts[m] || 0) + 1;
  }

  let topMode = null;
  let topModeCount = 0;
  for (const [k, v] of Object.entries(modeCounts)) {
    if (v > topModeCount) {
      topMode = k;
      topModeCount = v;
    }
  }

  const totalItems = plannerItems.length;
  const completedItems = plannerItems.filter((x) => !!x.completed).length;
  const completionRate =
    totalItems === 0 ? null : Math.round((completedItems / totalItems) * 100);

  return {
    logsCount: logs.length,
    modeCounts,
    topMode,
    completionRate,
    totalItems,
    completedItems,
  };
}

// LLM 응답 JSON을 서버에서 강제 보정 (프론트 절대 안깨지게)
function normalizeWeeklyReport(input, periodLabel) {
  const toStr = (v, fallback) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  const toArr = (v, minLen, fallbackArr) => {
    const arr = Array.isArray(v)
      ? v
          .filter((x) => typeof x === "string" && x.trim())
          .map((x) => x.trim())
      : [];
    while (arr.length < minLen) {
      arr.push(fallbackArr[arr.length] || fallbackArr[0]);
    }
    return arr.slice(0, 6);
  };

  return {
    title: toStr(input?.title, "넝쿨 주간 코칭 리포트"),
    periodLabel: toStr(input?.periodLabel, periodLabel),
    oneLineSummary: toStr(
      input?.oneLineSummary,
      "이번 기간의 흐름을 바탕으로 작은 다음 스텝을 제안드릴게요."
    ),
    highlights: toArr(input?.highlights, 2, [
      "기록을 시도한 점 자체가 이미 좋은 시작이에요.",
      "작게라도 계획을 세운 점이 리듬을 지키는 데 도움이 돼요.",
    ]),
    patterns: toArr(input?.patterns, 2, [
      "특정 상황에서 에너지 흐름이 흔들리는 구간이 있었어요.",
      "모드 전환이 생길 때 스스로를 관찰한 점이 인상적이에요.",
    ]),
    nextActions: toArr(input?.nextActions, 2, [
      "오늘은 3줄 중 1줄만 확정해도 충분해요.",
      "기록은 1줄만—대신 꾸준함을 우선해요.",
    ]),
    closing: toStr(
      input?.closing,
      "다음 기간은 더 가볍게, 더 선명하게 만들어갈 수 있어요. 함께 가요."
    ),
  };
}

// 프론트(기존 InsightReport.jsx)가 바로 보여줄 수 있게 텍스트로도 변환
function toLegacyReportText(reportJson) {
  const lines = [];
  lines.push(`${reportJson.title} (${reportJson.periodLabel})`);
  lines.push("");
  lines.push(reportJson.oneLineSummary);
  lines.push("");
  lines.push("잘 유지된 점");
  reportJson.highlights.forEach((x) => lines.push(`- ${x}`));
  lines.push("");
  lines.push("관찰된 패턴");
  reportJson.patterns.forEach((x) => lines.push(`- ${x}`));
  lines.push("");
  lines.push("다음 기간 제안");
  reportJson.nextActions.forEach((x) => lines.push(`- ${x}`));
  lines.push("");
  lines.push(reportJson.closing);
  return lines.join("\n");
}

// ============================================================
// [ADD] Desire(욕망) Signal 추출 - A1 파이프라인용 유틸
//  - 입력: nkos_logs 1건 (date + text)
//  - 출력: nkos_desire_signals 1건 (1일 1 latest)
// ============================================================

// 1) 도메인 6 + NONE 고정 (DB enum과 동일해야 함)
const DESIRE_DOMAINS = new Set([
  "STABILITY",
  "GROWTH",
  "ACHIEVEMENT",
  "RELATIONSHIP",
  "FREEDOM",
  "MEANING",
  "NONE",
]);

// 2) 점수 보정 (0~5 정수)
function clampInt(v, min = 0, max = 5, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = parseInt(n, 10);
  return Math.max(min, Math.min(max, i));
}

// 3) LLM 출력이 흔들려도 프론트/DB가 절대 안 깨지게 서버에서 강제 정규화
function normalizeDesireSignal(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};

  const primary = DESIRE_DOMAINS.has(safe.primary_domain)
    ? safe.primary_domain
    : "MEANING";

  const secondary = DESIRE_DOMAINS.has(safe.secondary_domain)
    ? safe.secondary_domain
    : "NONE";

  const time_horizon = ["NOW", "SOON", "LATER"].includes(safe.time_horizon)
    ? safe.time_horizon
    : "NOW";

  const signals = safe.signals && typeof safe.signals === "object" ? safe.signals : {};
  const evidence = Array.isArray(safe.evidence_ko)
    ? safe.evidence_ko
        .filter((x) => typeof x === "string" && x.trim())
        .map((x) => x.trim())
        .slice(0, 3)
    : [];

  return {
    schema_version: typeof safe.schema_version === "string" ? safe.schema_version : "desire_v1",
    primary_domain: primary,
    secondary_domain: secondary,

    desire_intensity: clampInt(safe.desire_intensity),
    gap_score: clampInt(safe.gap_score),
    control_score: clampInt(safe.control_score),
    fixation_score: clampInt(safe.fixation_score),

    time_horizon,

    urgency: clampInt(signals.urgency),
    anxiety: clampInt(signals.anxiety),
    clarity: clampInt(signals.clarity),

    desire_summary_ko: typeof safe.desire_summary_ko === "string" ? safe.desire_summary_ko : "",
    evidence_ko: evidence,

    // raw_llm은 디버깅/재현용. 원치 않으면 저장 시 빼도 됨.
    raw_llm: safe,
  };
}

// 4) Gemini 프롬프트: "욕망 추출 전용" (JSON ONLY + 스키마 고정)
function buildDesirePrompt({ date, logText }) {
  return `
You are a strict JSON generator for a Life OS.
Output MUST be a single valid JSON object and nothing else.
No markdown, no code fences, no explanations.

Task: Extract desire signals from user's short daily log (1~3 lines).

Domain meanings:
- STABILITY: money/safety/risk avoidance/daily survival/keeping things from falling apart
- GROWTH: learning/skill/career improvement/self-development
- ACHIEVEMENT: finishing tasks/results/proving performance/completion
- RELATIONSHIP: family/friends/connection/belonging/recognition
- FREEDOM: time/autonomy/less constraint/travel/space
- MEANING: purpose/values/identity/creativity/contribution/why-live

Scoring guide:
- desire_intensity: 0 none, 1 mild wish, 3 strong want, 5 urgent craving/obsession
- gap_score: 0 aligned, 3 friction, 5 blocked/helpless
- control_score: 0 helpless, 3 mixed, 5 fully controllable
- fixation_score: 0 calm, 3 ruminating, 5 obsessive/very anxious
- time_horizon: NOW (today/this week), SOON (this month/near future), LATER (someday/long-term)
- signals:
  - urgency: how urgent it feels
  - anxiety: worry/pressure
  - clarity: how clearly the desire is specified

Input:
- date: ${date}
- user_log (raw):
${JSON.stringify(String(logText || "").slice(0, 500))}

Output schema (use only these keys, exact types):
{
  "schema_version": "desire_v1",
  "primary_domain": "STABILITY|GROWTH|ACHIEVEMENT|RELATIONSHIP|FREEDOM|MEANING",
  "secondary_domain": "STABILITY|GROWTH|ACHIEVEMENT|RELATIONSHIP|FREEDOM|MEANING|NONE",
  "desire_intensity": 0,
  "gap_score": 0,
  "control_score": 0,
  "fixation_score": 0,
  "time_horizon": "NOW|SOON|LATER",
  "signals": { "urgency": 0, "anxiety": 0, "clarity": 0 },
  "desire_summary_ko": "string",
  "evidence_ko": ["string"]
}

Rules:
- JSON ONLY (no extra text)
- Korean for *_ko fields
- evidence_ko: 1~3 items, based only on the input log (no invention)
- If uncertain: choose best guess, and set clarity lower.
`.trim();
}

// 5) Bearer 토큰으로 user_id 확인 (보안)
//    - 프론트는 supabase session.access_token을 Authorization: Bearer <token> 으로 보내면 됨.
async function getUserFromBearer(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

// 6) nkos_desire_signals 저장: 1일 1개 latest 유지
async function saveDesireSignalLatest({
  userId,
  logId,
  signalDate, // 'YYYY-MM-DD'
  desireNorm, // normalizeDesireSignal 결과
}) {
  // (1) 기존 latest를 false로 내림
  const { error: downErr } = await supabaseAdmin
    .from("nkos_desire_signals")
    .update({ is_latest: false })
    .eq("user_id", userId)
    .eq("signal_date", signalDate)
    .eq("is_latest", true);

  if (downErr) throw downErr;

  // (2) 새 레코드 insert (latest=true)
  const payload = {
    user_id: userId,
    log_id: logId || null,
    signal_date: signalDate,

    schema_version: desireNorm.schema_version,
    primary_domain: desireNorm.primary_domain,
    secondary_domain: desireNorm.secondary_domain,

    desire_intensity: desireNorm.desire_intensity,
    gap_score: desireNorm.gap_score,
    control_score: desireNorm.control_score,
    fixation_score: desireNorm.fixation_score,

    time_horizon: desireNorm.time_horizon,
    urgency: desireNorm.urgency,
    anxiety: desireNorm.anxiety,
    clarity: desireNorm.clarity,

    desire_summary_ko: desireNorm.desire_summary_ko,
    evidence_ko: desireNorm.evidence_ko,
    raw_llm: desireNorm.raw_llm,

    is_latest: true,
  };

  const { data, error: insErr } = await supabaseAdmin
    .from("nkos_desire_signals")
    .insert(payload)
    .select("*")
    .single();

  if (insErr) throw insErr;
  return data;
}


app.post("/api/insight/weekly-report", async (req, res) => {
  console.log("🧠 [insight weekly-report] 요청 수신");

  try {
    const { userId, range } = req.body || {};

    // 0) 입력 검증
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ ok: false, error: "INVALID_USER_ID" });
    }

    const { safeRange, days, startISO, endISO, periodLabel } = getDateRange(range);

    // 1-C) nkos_desire_signals 조회 (욕망 신호)
    const { data: desireRows, error: desireErr } = await supabaseAdmin
      .from("nkos_desire_signals")
      .select("signal_date, primary_domain, desire_intensity, gap_score, control_score, fixation_score")
      .eq("user_id", userId)
      .eq("is_latest", true)
      // signal_date는 date 컬럼이므로 YYYY-MM-DD 비교로 충분
      .gte("signal_date", startISO.slice(0, 10))
      .lte("signal_date", endISO.slice(0, 10))
      .order("signal_date", { ascending: true });

    // 실패해도 리포트는 계속 생성되게 안전 처리
    const safeDesireRows = !desireErr && Array.isArray(desireRows) ? desireRows : [];
    if (desireErr) {
      console.warn("⚠️ nkos_desire_signals 조회 실패:", desireErr?.message);
    }


    // ------------------------------------------------------------
    // 1) Supabase 조회
    //    - 스샷 기준 테이블:
    //      1) nkos_planner_entries (헤더/메타)
    //      2) planner_items       (3줄 계획 실제 라인)
    //    - 이번 1단계 목표는 "JSON 구조 고정"이므로
    //      entries는 아직 사용하지 않아도 됨 (필요하면 2단계에서 추가)
    // ------------------------------------------------------------

    // 1-A) nkos_logs 조회 (모드/텍스트)
    const { data: logs, error: logsErr } = await supabaseAdmin
      .from("nkos_logs")
      .select("id,user_id,log_date,created_at,mode,text")
      .eq("user_id", userId)
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true });

    if (logsErr) throw logsErr;

    // 1-B) planner_items 조회 (3줄 계획)
    // ⚠️ 여기가 예전에 너 서버가 죽었던 부분:
    //    .gte("created_at", startISO.0 ? startISO : startISO)  ← 문법 에러였음
    const { data: plannerItems, error: itemsErr } = await supabaseAdmin
      .from("planner_items")
      .select("id,user_id,date,text,completed,source,mode,created_at")
      .eq("user_id", userId)
      .gte("created_at", startISO) // ✅ 정상
      .lte("created_at", endISO)
      .order("created_at", { ascending: true });

    // planner_items는 권한/컬럼/테이블 이슈가 생길 수 있으니
    // 실패해도 리포트는 생성되도록 "빈 배열"로 처리
    const safePlannerItems = !itemsErr && Array.isArray(plannerItems) ? plannerItems : [];
    if (itemsErr) {
      console.warn("⚠️ planner_items 조회 실패(권한/테이블/컬럼 확인):", itemsErr?.message);
    }

    // ------------------------------------------------------------
    // 2) 통계 + 샘플 구성 (토큰 폭발 방지)
    // ------------------------------------------------------------
    const stats = buildStats({
      logs: logs || [],
      plannerItems: safePlannerItems || [],
    });

    const desireSummary = summarizeDesireSignals(safeDesireRows);

    // [ADD] 성취(achievement) = 플래너 실행률 기반(0~5 스케일로 변환)
    const desireAvg = desireSummary?.avg?.desire; // 0~5
    const achievementRate = stats.completionRate; // 0~100 or null
    const achievementScore =
      achievementRate == null ? null : Math.round(((achievementRate / 100) * 5) * 10) / 10; // 0~5 (소수 1자리)

    // 행복(%) = 성취/욕망 * 100  (욕망 0이면 계산 불가)
    const happiness =
      Number.isFinite(desireAvg) && desireAvg > 0 && Number.isFinite(achievementScore)
        ? Math.max(0, Math.min(100, Math.round((achievementScore / desireAvg) * 100)))
        : null;

    // [ADD] 날짜별 Life Chapter 타임라인 만들기
    function classifyLifeChapter(desireAvg, gapAvg) {
      if (!Number.isFinite(desireAvg) || !Number.isFinite(gapAvg)) return "UNKNOWN";
      if (desireAvg >= 3 && gapAvg >= 3) return "갈증/방황";
      if (desireAvg >= 3 && gapAvg < 3) return "확장/도전";
      if (desireAvg < 3 && gapAvg < 3) return "안정/만족";
      if (desireAvg < 3 && gapAvg >= 3) return "정체/무기력";
      return "UNKNOWN";
    }

    const chapterTimeline = (safeDesireRows || []).map((r) => {
      const d = Number(r.desire_intensity);
      const g = Number(r.gap_score);
      return {
        date: r.signal_date,
        chapter: classifyLifeChapter(d, g),
        desire: d,
        gap: g,
      };
    });


    // ✅ 행복 = 성취/욕망 계산 (안전한 분모 처리)
    // - 욕망(D): desire 평균
    // - 갭(G): gap 평균
    // - 성취(A): max(D - G, 0)
    // - 행복(H): (A / max(D,1)) * 100
    const D = Number(desireSummary.avg?.desire ?? 0);
    const G = Number(desireSummary.avg?.gap ?? 0);
    const A = Math.max(D - G, 0);
    const H = Math.round((A / Math.max(D, 1)) * 100);

    const sampleLogs = (logs || []).slice(-20).map((log) => ({
      date: log.log_date || (log.created_at ? String(log.created_at).slice(0, 10) : ""),
      mode: log.mode || "",
      text: (log.text || "").slice(0, 200),
    }));

    const samplePlans = (safePlannerItems || []).slice(-10).map((it) => ({
      text: (it.text || "").slice(0, 120),
      completed: !!it.completed,
    }));

    // ------------------------------------------------------------
    // 3) LLM 프롬프트: ✅ JSON ONLY + 스키마 고정
    // ------------------------------------------------------------
    const prompt = `
당신은 넝쿨OS의 주간/월간 코칭 리포트 생성 엔진입니다.
아래 데이터를 기반으로 "반드시 JSON만" 출력하세요.

[기간]
- range: ${safeRange} (${periodLabel})
- days: ${days}

[요약 통계]
- 기록 수: ${stats.logsCount}
- 모드 Top: ${stats.topMode || "N/A"}
- 모드 분포: ${JSON.stringify(stats.modeCounts)}
- 플래너 실행률: ${stats.completionRate == null ? "N/A" : stats.completionRate + "%"} (${stats.completedItems}/${stats.totalItems})

[욕망 기반 관찰]
- 욕망 기록 일수: ${desireSummary.days}
- 주요 욕망 도메인: ${desireSummary.topDomain || "N/A"}
- 평균 욕망 강도: ${desireSummary.avg?.desire ?? "N/A"}
- 평균 현실 갭: ${desireSummary.avg?.gap ?? "N/A"}
- 현재 Life Chapter 추정: ${desireSummary.lifeChapter}
- 주의 신호: ${desireSummary.caution || "특이사항 없음"}

[최근 기록 샘플]
${JSON.stringify(sampleLogs, null, 2)}

[최근 플래너 샘플]
${JSON.stringify(samplePlans, null, 2)}

[출력 스키마 - 이 키만 사용]
{
  "title": "string",
  "periodLabel": "string",
  "oneLineSummary": "string",
  "highlights": ["string", "string"],
  "patterns": ["string", "string"],
  "nextActions": ["string", "string"],
  "closing": "string"
}

[규칙]
- 마크다운 금지, 코드펜스( \`\`\` ) 금지
- 설명 문장 추가 금지 (오직 JSON)
- 배열은 최소 2개 이상
- 한국어, 과장 없이 따뜻한 관찰 톤
`.trim();

    // ------------------------------------------------------------
    // 4) Gemini 호출 (callGeminiSafe 사용)
    // ------------------------------------------------------------
    const result = await callGeminiSafe({
      prompt,
      system: "넝쿨OS 코칭 리포트를 작성하는 코치로서, 과장 없이 실천 중심으로 작성해줘.",
      maxOutputTokens: 800,
    });

    if (!result.ok) {
      const status = result.errorCode?.includes("QUOTA") ? 429 : 503;
      return res.status(status).json({
        ok: false,
        error: result.message,
        code: result.errorCode,
      });
    }

    // ------------------------------------------------------------
    // 5) JSON 파싱 + 서버 보정(프론트 절대 안깨지게)
    // ------------------------------------------------------------
    const rawText = result.data.text();
    const cleaned = String(rawText || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonString = (jsonMatch ? jsonMatch[0] : "").trim();

    let parsed = {};
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ weekly-report JSON parse fail:", e);
      parsed = {}; // 빈 객체로 두고 normalize에서 안전 보정
    }

    const safeReportJson = normalizeWeeklyReport(parsed, periodLabel);
    const legacyText = toLegacyReportText(safeReportJson);

    // ✅ 프론트 호환: report(string) 유지 + 확장용 data(json) 추가
    return res.json({
      ok: true,
      data: {
        ...safeReportJson,
      life: {
        topDesireDomain: desireSummary.topDomain,
        lifeChapter: desireSummary.lifeChapter,

        // 평균 욕망 신호(0~5)
        desireAverages: desireSummary.avg,

        // ✅ 추가: 욕망(D), 성취(A), 행복(H)
        desire: D,           // 분모
        achievement: A,      // 성취 체감(1차 MVP = D-G)
        happiness: H,        // 0~100

        caution: desireSummary.caution,
        timeline: chapterTimeline, // [{date, chapter, desire, gap}, ...]
      },

      },
      report: legacyText,
    });
  } catch (e) {
    console.error("❌ /api/insight/weekly-report error:", e);
    return res.status(500).json({ ok: false, error: "WEEKLY_REPORT_FAILED" });
  }
});

// ============================================================
// [ADD] /api/desire/extract (A1 트리거 엔드포인트)
// - 목적: "로그 저장 직후" 프론트가 log_id를 보내면,
//         서버가 nkos_logs를 읽고 → LLM 욕망 추출 → nkos_desire_signals 저장
//
// - 보안: Authorization Bearer 토큰으로 본인 확인
//         본인 log_id만 처리 가능
// ============================================================
app.post("/api/desire/extract", async (req, res) => {
  console.log("🌳 [desire extract] 요청 수신");

  try {
    // 0) 로그인 사용자 확인
    const user = await getUserFromBearer(req);
    if (!user) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { log_id } = req.body || {};
    if (!log_id || typeof log_id !== "string") {
      return res.status(400).json({ ok: false, error: "INVALID_LOG_ID" });
    }

    // 1) nkos_logs에서 원본 로그 조회
    //    - 필드명은 네 스샷 그대로: id, user_id, log_date, created_at, text
    const { data: logRow, error: logErr } = await supabaseAdmin
      .from("nkos_logs")
      .select("id,user_id,log_date,created_at,text")
      .eq("id", log_id)
      .single();

    if (logErr || !logRow) {
      return res.status(404).json({ ok: false, error: "LOG_NOT_FOUND" });
    }

    // 2) 본인 로그인지 확인 (중요)
    if (logRow.user_id !== user.id) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    // 3) signal_date 결정
    //    - nkos_logs.log_date가 date 타입이라 가장 안정적.
    //    - 혹시 log_date가 null일 수 있으면 created_at으로 fallback.
    const signalDate =
      logRow.log_date ||
      (logRow.created_at ? String(logRow.created_at).slice(0, 10) : null);

    if (!signalDate) {
      return res.status(400).json({ ok: false, error: "NO_SIGNAL_DATE" });
    }

    const logText = String(logRow.text || "").trim();
    if (!logText) {
      // 로그가 비어있으면 욕망 추출 의미 없음(정책상 빈 값 저장도 가능하나, 우선 실패 처리)
      return res.status(400).json({ ok: false, error: "EMPTY_LOG_TEXT" });
    }

    // 4) Gemini 호출 (callGeminiSafe 재사용)
    //    - weekly-report와 동일한 "JSON ONLY" 파싱/보정 패턴 적용
    const prompt = buildDesirePrompt({ date: signalDate, logText });

    const result = await callGeminiSafe({
      prompt,
      system: "You are a strict JSON generator. Output JSON only.",
      maxOutputTokens: 600,
    });

    if (!result.ok) {
      const status = result.errorCode?.includes("QUOTA") ? 429 : 503;
      return res.status(status).json({
        ok: false,
        error: result.message,
        code: result.errorCode,
      });
    }

    // 5) JSON 파싱 (weekly-report와 동일 패턴)
    const rawText = result.data.text();
    const cleaned = String(rawText || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonString = (jsonMatch ? jsonMatch[0] : "").trim();

    let parsed = {};
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ desire JSON parse fail:", e);
      parsed = {}; // normalize에서 안전 보정
    }

    // 6) 서버 보정(절대 안 깨지게)
    const desireNorm = normalizeDesireSignal(parsed);

    // 7) 저장 (1일 1 latest 유지)
    const saved = await saveDesireSignalLatest({
      userId: user.id,
      logId: logRow.id,
      signalDate,
      desireNorm,
    });

    // 8) 응답
    return res.json({
      ok: true,
      data: saved,
    });
  } catch (e) {
    console.error("❌ /api/desire/extract error:", e);
    return res.status(500).json({ ok: false, error: "DESIRE_EXTRACT_FAILED" });
  }
});


// ============================================================
// 6) /api/generate-report (유지)
//    - logs 배열 → 마크다운 리포트(텍스트)
// ============================================================
app.post("/api/generate-report", async (req, res) => {
  console.log("📊 [generate-report] 요청 수신");

  try {
    const { nkos_logs } = req.body;
    if (!nkos_logs || nkos_logs.length === 0) throw new Error("기록 없음");

    const logsContext = nkos_logs
      .map((log) => {
        const date = log.log_date || log.created_at || "";
        return `- [${date}] ${log.mode}: ${log.text}`;
      })
      .join("\n");

    const prompt = `
## 역할: 회고 비서
## 데이터:
${logsContext}

## 요청:
1. 이번 주 핵심 키워드 3개
2. 감정 흐름 요약 (3문장)
3. 다음 주 조언 (1문장)
위 내용을 마크다운으로 작성해주세요.
`.trim();

    const modelName = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    if (!response.ok) throw new Error("Google API Error");
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.json({ report: text });
  } catch (error) {
    console.error("❌ [generate-report] error:", error);
    return res.status(500).json({ error: "리포트 생성 실패" });
  }
});

// ============================================================
// 7) /api/analyze-log (유지)
// ============================================================
app.post("/api/analyze-log", async (req, res) => {
  const { text } = req.body;

  try {
    const result = await callGeminiSafe({
      prompt: text,
      system: "넝쿨OS 규칙에 맞춰 모드/신호/액션을 분석해줘 ...",
      maxOutputTokens: 512,
    });

    if (!result.ok) {
      const status = result.errorCode?.includes("QUOTA") ? 429 : 503;
      return res.status(status).json({
        error: result.message,
        code: result.errorCode,
      });
    }

    return res.json({ rawText: result.data.text() });
  } catch (e) {
    console.error("/api/analyze-log fatal:", e);
    return res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
});

// ============================================================
// ✅ [추가] 7.5) 가상 ERP 데모 API (/api/erp-demo)
// ============================================================
app.post("/api/erp-demo", async (req, res) => {
  const { question } = req.body;
  console.log(`🏭 [ERP Demo] 질문 수신: "${question}"`);

  try {
    // 1️⃣ [SQL 생성] AI에게 질문을 SQL로 변환 요청
    const schemaInfo = `
      [데이터베이스 테이블 정보]
      - TB_CUSTOMER (CustCode, CustName, CreditLimit, Balance)
        * Balance 설명: 현재 갚지 않은 미수금(외상값) 잔액.
      - TB_SALES_HDR (Status)
        * Status 값: 'Pending' (아직 돈 안 냄), 'Shipped' (배송 완료)
      
      [AI가 꼭 지켜야 할 규칙]
      1. DB는 PostgreSQL이다.
      2. 사용자가 '돈 안 낸 거', '미수금', '얼마야?'라고 물어보면 'Balance > 0' 조건으로 찾아라.
      3. [데이터 조회 규칙]
         - 기본: 거래처 이름(CustName)과 금액(Balance)을 반드시 같이 가져와라.
         - 예외: 사용자가 '전체 합계', '총액(Total Sum)'을 물어보면, 이름 없이 'SUM(Balance)' 함수만 써도 된다.
      4. 사족을 달지 말고 오직 SQL 쿼리 문장만 출력해라.
    `;

    const sqlPrompt = `
      사용자 질문: "${question}"
      스키마 정보: ${schemaInfo}
      조건: 오직 SQL 문장만 출력해 (마크다운 없이). 따옴표는 '' 사용.
    `;

    // 넝쿨OS에서 쓰는 모델 재사용 (gemini-2.0-flash 추천)
    const modelName = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const sqlRes = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sqlPrompt }] }]
      })
    });
    
    const sqlJson = await sqlRes.json();
    let sqlQuery = sqlJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // 마크다운 제거 (```sql ... ```)
    sqlQuery = sqlQuery.replace(/```sql|```/g, "").trim();
    console.log("🤖 생성된 SQL:", sqlQuery);

    // 2️⃣ [DB 조회] 생성된 SQL로 진짜 DB 조회
    const dbResult = await pool.query(sqlQuery);
    const rows = dbResult.rows;
    console.log(`📊 조회 결과: ${rows.length}건`);

    // 3️⃣ [결과 요약] 조회된 데이터를 바탕으로 자연어 답변 생성
    const summaryPrompt = `
      질문: "${question}"
      SQL 결과: ${JSON.stringify(rows)}
      
      위 데이터를 바탕으로 사장님에게 보고하듯 구체적인 숫자를 포함해서 짧게 답변해.
      (결과가 없으면 없다고 정중히 말해.)
    `;

    const sumRes = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: summaryPrompt }] }]
      })
    });

    const sumJson = await sumRes.json();
    const finalAnswer = sumJson?.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";

    res.json({ answer: finalAnswer, debugSql: sqlQuery });

  } catch (error) {
    console.error("❌ ERP Demo Error:", error);
    res.status(500).json({ error: "ERP 처리 중 오류가 발생했습니다." });
  }
});

// ============================================================
// 8) 서버 시작
// ============================================================
app.listen(port, () => {
  console.log(`✅ NKOS Backend running on port ${port}`);
});
