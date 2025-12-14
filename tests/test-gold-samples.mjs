// tests/test-gold-samples.mjs
// FSM v3.0 + LLM 엔드투엔드 골드샘플 테스트 (Top1/Top2)

// ✅ gold
import { goldSamples } from "./goldSamples.js";

// ✅ engine
import { getModeRanking } from "../src/lib/modeEngine.js";
import { getPatternBoosts } from "../src/lib/modePatterns.js";

// 프론트가 사용하는 백엔드 엔드포인트 그대로 사용
const BASE_URL = "http://localhost:3000/api/generate-action";

// 간단 딜레이 함수 (rate limit 보호용)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callLLM(userLog) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userLog }),
  });

  const data = await res.json();

  if (!data || !data.signals) {
    const msg =
      data?.error || "signals=null (LLM fallback / quota / 기타 오류 추정)";
    throw new Error(msg);
  }

  return data; // { signals, recommendedAction, ... }
}

function fmtScore(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return n.toFixed(2);
}

async function run() {
  console.log("====== 🌱 FSM v3.0 GOLD SAMPLE TEST (Top1/Top2) ======");

  let passTop1 = 0;
  let passTop2 = 0;
  const total = goldSamples.length;

  // Top1-Top2 점수 차이가 작으면 "혼합(blend)"으로 표시
  const BLEND_GAP = 1.2;

  // prevMode를 테스트에 넣고 싶으면 여기서 관리 가능(지금은 null 고정)
  const prevMode = null;

  for (const sample of goldSamples) {
    const { id, text, expected } = sample;

    console.log(`\n#${id}`);

    let llmSignals = null;

    try {
      // 1) LLM 호출 → signals 받기
      const { signals } = await callLLM(text);
      llmSignals = signals;

      // 2) 패턴부스트 (문장 기반이 맞음)
      const patternBoosts = getPatternBoosts(text);

      // 3) Top1/Top2 랭킹 산출 (✅ 여기서 getModeRanking 사용)
      const ranking = getModeRanking(llmSignals, patternBoosts, prevMode, {
        gapForBlend: BLEND_GAP,
        prevModeHoldGap: 1.0,
      });

      const top1 = ranking.top1; // { mode, score }
      const top2 = ranking.top2; // { mode, score }
      const primary = top1.mode;
      const secondary = top2?.mode ?? null;

      const ok1 = primary === expected;
      const ok2 = !ok1 && secondary === expected;

      if (ok1) {
        passTop1++;
        console.log(`✅ PASS (Top1)  #${id}`);
      } else if (ok2) {
        passTop2++;
        console.log(`🟡 PASS (Top2)  #${id}`);
      } else {
        console.log(`❌ FAIL        #${id}`);
      }

      console.log(`입력: ${text}`);
      console.log(`기대: ${expected}`);
      console.log(`Top1: ${primary} (score ${fmtScore(top1.score)})`);
      console.log(`Top2: ${secondary ?? "(없음)"} (score ${fmtScore(top2?.score)})`);
      console.log(
        `Blend: ${ranking.blend ? "YES" : "NO"} (gap ${fmtScore(ranking.gap)})`
      );

      // 참고용: 엔드투엔드 LLM signals 출력
      console.log("LLM signals:", llmSignals);
    } catch (err) {
      console.log(`❌ LLM 응답 없음 / 에러  #${id}`);
      console.log(`입력: ${text}`);
      console.log(`기대: ${expected}`);
      console.log("error:", err?.message ?? err);
    }

    // Gemini 무료 쿼터 보호
    await sleep(4000); // 네가 2000으로 내려도 되긴 하는데, 불안정하면 다시 4000~5000
  }

  console.log("\n===============================");
  console.log(`Top1 통과: ${passTop1}`);
  console.log(`Top2 통과: ${passTop2}`);
  console.log(`Top1+Top2 통과: ${passTop1 + passTop2} / ${total}`);
  console.log("===============================");
}

run().catch((e) => {
  console.error("테스트 스크립트 전체 오류:", e);
});
