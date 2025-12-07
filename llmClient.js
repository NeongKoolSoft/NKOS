// server/llmClient.js
// 넝쿨OS LLM 호출 게이트웨이 v1

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY;

// LLM 동작 모드: real | mock | off
const LLM_MODE = process.env.LLM_MODE || "real";

// Free Tier 보호용 로컬 한도 (실제 20이지만 여유두고 18 정도로 세팅 추천)
const LOCAL_DAILY_LIMIT = Number(process.env.LLM_DAILY_LIMIT || 18);

// 단순 일별 카운터 (서버 재시작 시 리셋되는 수준이면 충분)
let todayKey = null;
let todayCount = 0;

// 원격 Quota가 완전히 소진된 경우 잠깐 막아두는 플래그
let remoteBlockedUntil = 0;

function getTodayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function incTodayCount() {
  const key = getTodayKey();
  if (todayKey !== key) {
    todayKey = key;
    todayCount = 0;
  }
  todayCount += 1;
  return todayCount;
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function callGeminiSafe({ prompt, system, maxOutputTokens = 512 }) {
  // 0) off / mock 모드 처리
  if (LLM_MODE === "off") {
    return {
      ok: false,
      errorCode: "LLM_DISABLED",
      message: "LLM 기능이 비활성화된 상태입니다.",
    };
  }

  if (LLM_MODE === "mock") {
    // 개발/테스트용 더미 응답
    return {
      ok: true,
      data: {
        text: () =>
          "[MOCK] 실제 LLM 대신 동작 중입니다.\n" +
          "프롬프트 일부: " +
          (prompt || "").slice(0, 80),
      },
    };
  }

  // 1) 로컬 일일 한도 체크
  const key = getTodayKey();
  if (todayKey !== key) {
    todayKey = key;
    todayCount = 0;
  }
  if (todayCount >= LOCAL_DAILY_LIMIT) {
    return {
      ok: false,
      errorCode: "LOCAL_DAILY_LIMIT",
      message:
        "오늘 넝쿨OS에서 설정한 일일 LLM 호출 한도에 도달했어요. 내일 다시 시도해 주세요.",
    };
  }

  // 2) 원격 차단 시간 체크 (직전에 429난 경우)
  const now = Date.now();
  if (remoteBlockedUntil > now) {
    return {
      ok: false,
      errorCode: "REMOTE_BLOCKED",
      message:
        "현재 LLM 서비스가 잠시 사용이 제한된 상태입니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (!genAI) {
    return {
      ok: false,
      errorCode: "NO_API_KEY",
      message: "Gemini API Key가 설정되어 있지 않습니다.",
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: system,
    });

    incTodayCount();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens,
      },
    });

    return {
      ok: true,
      data: result.response,
    };
  } catch (err) {
    console.error("[callGeminiSafe] error:", err?.response?.data || err);

    // 429 등 Quota/Rate 에러 구분
    const msg = String(err.message || "");
    const isQuota =
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("Quota exceeded") ||
      err?.status === 429;

    if (isQuota) {
      // 20~30분 정도 막아두기 (여기선 30분)
      remoteBlockedUntil = Date.now() + 30 * 60 * 1000;

      return {
        ok: false,
        errorCode: "REMOTE_QUOTA_EXCEEDED",
        message:
          "오늘 사용 가능한 LLM 할당량을 거의 다 사용했어요. 잠시 후 또는 내일 오전 9시 이후 다시 시도해 주세요.",
      };
    }

    return {
      ok: false,
      errorCode: "LLM_UNKNOWN_ERROR",
      message: "LLM 호출 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}
