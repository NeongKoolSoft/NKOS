// tests/testGoldE2E.js
// 넝쿨OS FSM + LLM 엔드투엔드 골든샘플 검증 스크립트

import { GOLD_SAMPLES } from "./goldSamples.js";              // 골든 샘플 텍스트 + expected
import { decideMode } from "../src/lib/modeEngine.js";        // FSM v3.0
// prevMode까지 쓰고 싶으면 import { decideMode } 외에도 필요하면 가져오면 됨

// ✅ 서버 주소: server.js 가 띄워진 포트와 맞춰야 함
//   .env 에서 PORT=3000 이면 아래를 그대로 두고,
//   PORT=3001 같은 다른 포트 쓰면 이 값만 바꿔줘.
const API_BASE = "http://localhost:3000";

// Node 18 이상이면 글로벌 fetch 있음.
// 만약 없다면: npm i node-fetch 하고, 위에
//   import fetch from "node-fetch";
// 추가하면 됨.

async function callBackend(userLog) {
  const res = await fetch(`${API_BASE}/api/generate-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userLog }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API 실패 status=${res.status}, body=${text}`);
  }

  const data = await res.json();

  if (!data || !data.signals) {
    throw new Error(`API 응답에 signals 없음: ${JSON.stringify(data)}`);
  }

  return data; // { signals, recommendedAction }
}

async function runOneSample(sample) {
  try {
    // 1) 서버에 LLM + 분석 요청
    const { signals, recommendedAction } = await callBackend(sample.text);

    // 2) FSM v3.0 으로 최종 모드 결정
    const prevMode = sample.prevMode || ""; // 필요하면 골든샘플에 prevMode 필드 추가해서 사용
    const mode = decideMode(signals, {}, prevMode);

    const ok = mode === sample.expected;

    console.log("\n========================================");
    console.log(ok ? `✅ PASS  #${sample.id}` : `❌ FAIL  #${sample.id}`);
    console.log(`입력: ${sample.text}`);
    console.log(`기대 모드: ${sample.expected}`);
    console.log(`LLM signals:`, signals);
    console.log(`FSM 결과 모드: ${mode}`);
    console.log(`추천 행동: ${recommendedAction || "(없음)"}`);

    return ok;
  } catch (err) {
    console.error("\n💥 ERROR  #" + sample.id, "-", err.message);
    return false;
  }
}

async function main() {
  console.log("====== 🌿 넝쿨OS FSM v3.0 + Gemini E2E GOLD TEST ======");
  console.log(`총 샘플 수: ${GOLD_SAMPLES.length}\n`);

  let pass = 0;
  let fail = 0;

  for (const sample of GOLD_SAMPLES) {
    const ok = await runOneSample(sample);
    if (ok) pass++;
    else fail++;

    // 너무 빨리 때리지 않게 살짝 딜레이 (API 보호용)
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n====== ✅ 테스트 완료 ======");
  console.log(`PASS: ${pass} / FAIL: ${fail}`);
}

main().catch((e) => {
  console.error("테스트 실행 중 에러:", e);
  process.exit(1);
});
