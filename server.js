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

app.post("/api/insight/weekly-report", async (req, res) => {
  console.log("🧠 [insight weekly-report] 요청 수신");

  try {
    const { userId, range } = req.body || {};

    // 0) 입력 검증
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ ok: false, error: "INVALID_USER_ID" });
    }

    const { safeRange, days, startISO, endISO, periodLabel } = getDateRange(range);

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
      data: safeReportJson,
      report: legacyText,
    });
  } catch (e) {
    console.error("❌ /api/insight/weekly-report error:", e);
    return res.status(500).json({ ok: false, error: "WEEKLY_REPORT_FAILED" });
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
// 8) 서버 시작
// ============================================================
app.listen(port, () => {
  console.log(`✅ NKOS Backend running on port ${port}`);
});
