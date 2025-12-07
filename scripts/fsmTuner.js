// scripts/fsmTuner.js
// ------------------------------------------------------
// 넝쿨OS FSM 튜너 v1 (분석용)
// - test/goldSamples.js 의 GOLD_SAMPLES를 이용해서
//   현재 modeEngine의 decideMode가 얼마나 잘 맞는지 측정
// - 각 모드별 정확도, 혼동 매트릭스, 평균 신호를 출력
//
// ⚠️ 전제:
//  1) GOLD_SAMPLES 항목에 signals가 들어있으면 그대로 사용
//     예) { id, text, expected, signals: { ... } }
//  2) signals가 없는 샘플은 "신호 없음"으로 스킵
//
// 실행 방법:
//   node scripts/fsmTuner.js
// ------------------------------------------------------

import { goldSamples } from "../tests/goldSamples.js"
import { decideMode } from "../src/lib/modeEngine.js";
import { getPatternBoosts } from "../src/lib/modePatterns.js";

const MODES = ["DELAY", "STABILIZE", "REFLECT", "SIMPLIFY", "DECISIVE", "EXPLORATORY"];

// 혼동 매트릭스 초기화: confusion[expected][predicted] = count
function initConfusion() {
  const m = {};
  for (const e of MODES) {
    m[e] = {};
    for (const p of MODES) {
      m[e][p] = 0;
    }
  }
  return m;
}

// 신호 평균 계산용 accumulator
function initSignalStats() {
  const base = {
    emotion_vs_logic: 0,
    risk_avoidance: 0,
    responsibility_avoidance: 0,
    analysis_paralysis: 0,
    priority_confusion: 0,
    energy_level: 0,
    novelty_drive: 0,
  };
  const stats = {};
  for (const mode of MODES) {
    stats[mode] = {
      sum: { ...base },
      count: 0,
    };
  }
  return stats;
}

// 신호만 추려서 안전하게 가져오기
function normalizeSignals(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    emotion_vs_logic: raw.emotion_vs_logic ?? 0,
    risk_avoidance: raw.risk_avoidance ?? 0,
    responsibility_avoidance: raw.responsibility_avoidance ?? 0,
    analysis_paralysis: raw.analysis_paralysis ?? 0,
    priority_confusion: raw.priority_confusion ?? 0,
    energy_level: raw.energy_level ?? 0,
    novelty_drive: raw.novelty_drive ?? 0,
  };
}

// 신호 평균 계산
function computeAverages(signalStats) {
  const result = {};
  for (const mode of MODES) {
    const { sum, count } = signalStats[mode];
    if (count === 0) {
      result[mode] = null;
      continue;
    }
    result[mode] = Object.fromEntries(
      Object.entries(sum).map(([k, v]) => [k, v / count])
    );
  }
  return result;
}

// 메인 실행
async function run() {
  console.log("🔍 FSM 튜너 분석 시작...");
  console.log(`🔹 GOLD_SAMPLES 개수: ${goldSamples.length}\n`);

  const confusion = initConfusion();
  const signalStatsByExpected = initSignalStats();
  const signalStatsByPredicted = initSignalStats();

  let total = 0;
  let correct = 0;
  const perModeTotal = {};
  const perModeCorrect = {};

  for (const m of MODES) {
    perModeTotal[m] = 0;
    perModeCorrect[m] = 0;
  }

  for (const sample of goldSamples) {
    const { id, text, expected, signals: rawSignals } = sample;

    if (!MODES.includes(expected)) {
      console.warn(`⚠️ [ID=${id}] expected 모드가 유효하지 않습니다:`, expected);
      continue;
    }

    const signals = normalizeSignals(rawSignals);
    if (!signals) {
      console.warn(`⚠️ [ID=${id}] signals 없음 → 이 샘플은 스킵합니다.`);
      continue;
    }

    const patternBoosts = getPatternBoosts(text || "");
    const prevMode = ""; // 튜닝 기본은 prevMode 영향을 제거한 순수 판단으로 봄

    const predicted = decideMode(signals, patternBoosts, prevMode);

    total += 1;
    perModeTotal[expected] += 1;

    if (predicted === expected) {
      correct += 1;
      perModeCorrect[expected] += 1;
      console.log(
        `✅ PASS  #${id}  expected=${expected}, predicted=${predicted}`
      );
    } else {
      console.log(
        `❌ FAIL  #${id}  expected=${expected}, predicted=${predicted}`
      );
    }

    confusion[expected][predicted] += 1;

    // expected 기준 신호 평균 누적
    const expBucket = signalStatsByExpected[expected];
    Object.keys(expBucket.sum).forEach((k) => {
      expBucket.sum[k] += signals[k] ?? 0;
    });
    expBucket.count += 1;

    // predicted 기준 신호 평균 누적
    if (MODES.includes(predicted)) {
      const predBucket = signalStatsByPredicted[predicted];
      Object.keys(predBucket.sum).forEach((k) => {
        predBucket.sum[k] += signals[k] ?? 0;
      });
      predBucket.count += 1;
    }
  }

  console.log("\n==============================");
  console.log("📊 전체 정확도");
  console.log("==============================");
  const acc = total > 0 ? (correct / total) * 100 : 0;
  console.log(`총 샘플: ${total},  정답 수: ${correct},  정확도: ${acc.toFixed(1)}%`);

  console.log("\n==============================");
  console.log("📊 모드별 정확도");
  console.log("==============================");
  for (const mode of MODES) {
    const t = perModeTotal[mode];
    const c = perModeCorrect[mode];
    const a = t > 0 ? (c / t) * 100 : 0;
    console.log(
      `${mode.padEnd(11, " ")}  |  샘플 ${String(t).padStart(2, " ")}개  |  정확도 ${a.toFixed(1)}%`
    );
  }

  console.log("\n==============================");
  console.log("📊 혼동 매트릭스 (expected → predicted)");
  console.log("==============================");
  // 헤더
  const header = ["expected\\pred"].concat(MODES).join("\t");
  console.log(header);
  for (const e of MODES) {
    const row = [e.padEnd(11, " ")];
    for (const p of MODES) {
      row.push(String(confusion[e][p]).padStart(3, " "));
    }
    console.log(row.join("\t"));
  }

  // 신호 평균 계산
  const avgByExpected = computeAverages(signalStatsByExpected);
  const avgByPredicted = computeAverages(signalStatsByPredicted);

  console.log("\n==============================");
  console.log("📈 expected 기준 신호 평균");
  console.log("==============================");
  for (const mode of MODES) {
    const avg = avgByExpected[mode];
    if (!avg) {
      console.log(`- ${mode}: 데이터 없음`);
      continue;
    }
    console.log(`- ${mode}:`, avg);
  }

  console.log("\n==============================");
  console.log("📈 predicted 기준 신호 평균");
  console.log("==============================");
  for (const mode of MODES) {
    const avg = avgByPredicted[mode];
    if (!avg) {
      console.log(`- ${mode}: 데이터 없음`);
      continue;
    }
    console.log(`- ${mode}:`, avg);
  }

  console.log("\n✅ FSM 튜너 분석 완료.");
}

run().catch((err) => {
  console.error("❌ FSM 튜너 실행 중 오류:", err);
  process.exit(1);
});
