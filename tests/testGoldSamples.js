// tests/testGoldSamples.js

import { GOLD_SAMPLES } from "./goldSamples.js";
import { decideMode } from "../src/lib/modeEngine.js";

function runFSM(signals, prevMode = "") {
  return decideMode(signals, {}, prevMode);
}

let passCount = 0;

console.log("====== 🌿 FSM v3.0 GOLD SAMPLE TEST ======");

for (const sample of GOLD_SAMPLES) {
  const expected = sample.expected;   // ✅ 여기!
  const signals = sample.signals || {};  // (지금은 비어있을 수 있음)
  const mode = runFSM(signals, sample.prevMode || "");

  const ok = mode === expected;
  if (ok) passCount++;

  console.log();
  console.log(ok ? "✅ PASS" : "❌ FAIL");
  console.log(`입력: ${sample.text}`);
  console.log(`기대값: ${expected}`);
  console.log(`FSM결과: ${mode}`);
  console.log("--------------------------------------------------");
}

console.log(`\n총 ${GOLD_SAMPLES.length}개 중 ${passCount}개 일치`);
