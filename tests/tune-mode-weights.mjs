// tests/tune-mode-weights.mjs
// 🌱 넝쿨OS FSM v3.0 모드별 가중치 튜닝 루프

import { MODES, computeScores, extractSignals } from "../src/lib/modeEngine.js";
import { getPatternBoosts } from "../src/lib/modePatterns.js";
import { goldSamples } from "./goldSamples.js";

// 검색할 배수 후보들 (필요하면 더 추가 / 수정 가능)
const FACTOR_CANDIDATES = [0.7, 0.85, 1.0, 1.15, 1.3];

// 모드 순서를 고정해 두면, 중첩 for 문 돌리기 편함
const ORDERED_MODES = ["DELAY", "STABILIZE", "REFLECT", "SIMPLIFY", "DECISIVE", "EXPLORATORY"];

// 주어진 가중치 세트로 정확도 계산
function evaluateFactorSet(factorsByMode) {
  let correct = 0;

  for (const sample of goldSamples) {
    const text = sample.text;
    const expected = sample.expected;     // 예: "DELAY"

    // 신호 + 패턴 추출
    const signals = extractSignals(text);
    const patternBoosts = getPatternBoosts(text);

    // prevMode는 골드샘플에서는 없다고 가정 → null
    const baseScores = computeScores(signals, patternBoosts, null);

    // 모드별 가중치 곱해서 튜닝된 점수 만들기
    const tunedScores = {};
    for (const mode of MODES) {
      const factor = factorsByMode[mode] ?? 1.0;
      tunedScores[mode] = baseScores[mode] * factor;
    }

    // 최고 점수 모드 선택
    const predicted = Object.entries(tunedScores)
      .sort((a, b) => b[1] - a[1])[0][0];

    if (predicted === expected) {
      correct++;
    }
  }

  return correct;
}

// 메인 튜닝 루프
async function main() {
  let bestAccuracy = -1;
  let bestFactors = null;

  let totalTried = 0;

  for (const fDelay of FACTOR_CANDIDATES) {
    for (const fStab of FACTOR_CANDIDATES) {
      for (const fReflect of FACTOR_CANDIDATES) {
        for (const fSimplify of FACTOR_CANDIDATES) {
          for (const fDecisive of FACTOR_CANDIDATES) {
            for (const fExpl of FACTOR_CANDIDATES) {
              const factors = {
                DELAY: fDelay,
                STABILIZE: fStab,
                REFLECT: fReflect,
                SIMPLIFY: fSimplify,
                DECISIVE: fDecisive,
                EXPLORATORY: fExpl,
              };

              const correct = evaluateFactorSet(factors);
              totalTried++;

              if (correct > bestAccuracy) {
                bestAccuracy = correct;
                bestFactors = { ...factors };

                console.log("🎯 NEW BEST", bestAccuracy, "/ 68");
                console.log("  factors:", bestFactors);
              }
            }
          }
        }
      }
    }
  }

  console.log("====== 튜닝 종료 ======");
  console.log("총 조합 시도:", totalTried);
  console.log("최고 정확도:", bestAccuracy, "/ 68");
  console.log("최적 모드 가중치:", bestFactors);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
