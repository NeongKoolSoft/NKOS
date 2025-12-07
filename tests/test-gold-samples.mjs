// tests/test-gold-samples.mjs
// FSM v3.0 + LLM 엔드투엔드 골드샘플 테스트

import { goldSamples } from "./goldSamples.js";
import { decideMode } from "../src/lib/modeEngine.js";
import { getPatternBoosts } from "../src/lib/modePatterns.js";

// 프론트가 사용하는 백엔드 엔드포인트 그대로 사용
const BASE_URL = "http://localhost:3000/api/generate-action";

// 간단 딜레이 함수 (rate limit 보호용)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callLLM(userLog) {
  // 백엔드(server.js)로 요청 보내기
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userLog }),
  });

  const data = await res.json();

  // 서버에서 LLM 에러나 쿼터 초과 시:
  // { signals: null, recommendedAction: "", error: "..."} 형태가 들어올 수 있음
  if (!data || !data.signals) {
    const msg =
      data?.error ||
      "signals=null (LLM fallback / quota / 기타 오류 추정)";
    throw new Error(msg);
  }

  return data;
}

async function run() {
  console.log("====== 🌱 FSM v3.0 GOLD SAMPLE TEST ======");

  let passCount = 0;
  const total = goldSamples.length;

  // 🔸 중요한 부분: 전체 GOLD_SAMPLES를 그대로 순환
  for (const sample of goldSamples) {
    const { id, text, expected } = sample;

    console.log(`\n#${id}`);

    let decidedMode = null;
    let signals = null;
    let errorObj = null;

    try {
      // 1) LLM 호출 → signals 받기
      const { signals: s } = await callLLM(text);
      signals = s;

      // 2) 패턴 부스트 (지금은 패턴 히스토리가 없으니 빈 객체 사용)
      const patternBoosts = getPatternBoosts({}); // 필요 없으면 내부에서 무시하게 구현해두면 됨

      // 3) FSM v3.0으로 최종 모드 결정
      decidedMode = decideMode(signals, patternBoosts, null);

      const ok = decidedMode === expected;

      if (ok) {
        passCount++;
        console.log(`✅ PASS  #${id}`);
      } else {
        console.log(`❌ FAIL  #${id}`);
      }
    } catch (err) {
      errorObj = err;
      console.log(`❌ LLM 응답 없음 / 에러  #${id}`);
    }

    console.log(`입력: ${text}`);
    console.log(`기대: ${expected}`);
    console.log(`FSM결과: ${decidedMode ?? "(결과 없음)"}`);
    console.log("signals:", signals);

    if (errorObj) {
      console.log("error:", errorObj.message ?? errorObj);
    }

    // 🔸 Gemini 무료 쿼터 보호: 분당 15회 → 1회당 5초 정도로 여유있게
    await sleep(5000);
  }

  console.log("\n===============================");
  console.log(`총 통과: ${passCount} / ${total}`);
  console.log("===============================");
}

run().catch((e) => {
  console.error("테스트 스크립트 전체 오류:", e);
});
