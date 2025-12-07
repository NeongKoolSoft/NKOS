// test-fsm.js
// 골든샘플을 이용해서 LLM + FSM v3.0 전체 파이프라인 정확도 측정 스크립트

import fs from "fs";
import { parse } from "csv-parse/sync";
import fetch from "node-fetch"; // Node 18 이상이면 이 줄과 아래 fetch import는 빼도 됨
import { decideMode } from "./src/lib/modeEngine.js";

// 1) 설정 -------------------------------------------------------
const CSV_PATH = "./golden_samples.csv";
const BACKEND_URL = "http://localhost:3000/api/generate-action"; // server.js 엔드포인트

// 2) CSV 로드 ----------------------------------------------------
const csvText = fs.readFileSync(CSV_PATH, "utf8");

// 헤더 기반으로 파싱 (text, expected_mode, prev_mode)
const records = parse(csvText, {
  columns: true,
  skip_empty_lines: true,
});

console.log(`📄 골든샘플 ${records.length}개 로드 완료\n`);

// 3) 메인 실행 ---------------------------------------------------
let total = 0;
let correct = 0;

const perModeStats = {
  DELAY: { total: 0, correct: 0 },
  STABILIZE: { total: 0, correct: 0 },
  REFLECT: { total: 0, correct: 0 },
  SIMPLIFY: { total: 0, correct: 0 },
  DECISIVE: { total: 0, correct: 0 },
  EXPLORATORY: { total: 0, correct: 0 },
};

async function run() {
  for (const row of records) {
    const text = (row.text || "").trim();
    const expected = (row.expected_mode || "").trim().toUpperCase();
    const prevMode = (row.prev_mode || "").trim().toUpperCase() || "";

    if (!text || !expected) {
      console.warn("⚠️ text/expected_mode 누락, 건너뜀:", row);
      continue;
    }

    total++;
    if (perModeStats[expected]) {
      perModeStats[expected].total++;
    }

    // 1) 백엔드에 LLM 분석 요청 → signals 받기
    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userLog: text }),
    });

    const data = await resp.json();
    const signals = data.signals;

    if (!signals) {
      console.error("❌ signals 없음, fallback 발생 – 문장:", text);
      continue;
    }

    // 2) FSM v3.0으로 최종 MODE 계산
    const predicted = decideMode(signals, prevMode);

    const isCorrect = predicted === expected;
    if (isCorrect) {
      correct++;
      if (perModeStats[expected]) perModeStats[expected].correct++;
    } else {
      console.log("❌ 미스매치 발견");
      console.log("   문장     :", text);
      console.log("   기대 MODE:", expected);
      console.log("   예측 MODE:", predicted);
      console.log("   signals  :", signals);
      console.log("--------------------------------------------------");
    }
  }

  // 3) 결과 출력 ------------------------------------------------
  console.log("\n✅ 테스트 완료");
  console.log(`총 샘플: ${total}, 정답: ${correct}, 정확도: ${(correct / total * 100).toFixed(1)}%`);

  console.log("\n📊 모드별 통계");
  for (const [mode, stat] of Object.entries(perModeStats)) {
    if (stat.total === 0) continue;
    const acc = (stat.correct / stat.total * 100).toFixed(1);
    console.log(
      `${mode.padEnd(12)}  total: ${String(stat.total).padStart(3)}  ` +
      `correct: ${String(stat.correct).padStart(3)}  acc: ${acc}%`
    );
  }
}

run().catch((err) => {
  console.error("🔥 스크립트 오류", err);
});
