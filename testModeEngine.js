// testModeEngine.js
// 골든샘플 문장을 가지고
// 1) backend /api/generate-action 으로 signals 뽑고
// 2) modeEngine v3.0으로 최종 MODE 계산
// 3) 기대 모드와 비교해서 정확도 출력

import fs from "fs";
import path from "path";
import fetch from "node-fetch";      // npm i node-fetch@3 필요
import { fileURLToPath } from "url";
import { decideMode } from "./src/lib/modeEngine.js"; // v3.0 기준

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) CSV 읽기 -------------------------------------------------
const csvPath = path.join(__dirname, "gold_samples.csv");

if (!fs.existsSync(csvPath)) {
  console.error("❌ gold_samples.csv 파일을 찾을 수 없습니다:", csvPath);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, "utf8");

// 매우 단순한 CSV 파서 (쉼표 기준, 따옴표 없는 버전 가정)
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

// 첫 줄은 헤더라고 가정: text,expected,(oldProgram)
const header = lines[0].split(",");
const idxText = header.findIndex((h) => h.toLowerCase().includes("text"));
const idxExpected = header.findIndex((h) =>
  h.toLowerCase().includes("expected")
);

if (idxText === -1 || idxExpected === -1) {
  console.error("❌ CSV 헤더에 text / expected 열이 필요합니다.");
  console.error("현재 헤더:", header);
  process.exit(1);
}

const samples = lines.slice(1).map((line, i) => {
  const cols = line.split(",");
  return {
    lineNo: i + 2, // 1-based + 헤더
    text: cols[idxText]?.trim() ?? "",
    expected: cols[idxExpected]?.trim().toUpperCase() ?? "",
  };
});

console.log(`📄 골든샘플 ${samples.length}개 로드 완료`);

// 2) 각 문장에 대해 backend 호출 + FSM 계산 --------------------

const BACKEND_URL = "http://localhost:3000/api/generate-action";

async function run() {
  let okCount = 0;
  let failCount = 0;

  // 행별 결과를 CSV로도 남길 수 있게 배열로 수집
  const resultRows = [];
  resultRows.push(
    [
      "lineNo",
      "text",
      "expected",
      "predicted",
      "match",
      "signals.emotion_vs_logic",
      "signals.risk_avoidance",
      "signals.responsibility_avoidance",
      "signals.analysis_paralysis",
      "signals.priority_confusion",
      "signals.energy_level",
      "signals.novelty_drive",
    ].join(",")
  );

  for (const s of samples) {
    if (!s.text) continue;

    try {
      // 2-1) 백엔드에 문장 전달해서 signals 얻기
      const resp = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userLog: s.text }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(
          `❌ [${s.lineNo}] 백엔드 오류 status=${resp.status}:`,
          errText
        );
        failCount++;
        continue;
      }

      const { signals } = await resp.json();

      if (!signals) {
        console.error(`❌ [${s.lineNo}] signals 없음 (fallback 발생)`);
        failCount++;
        continue;
      }

      // 2-2) FSM v3.0으로 최종 MODE 계산
      const predicted = decideMode(signals, ""); // prevMode는 여기선 공백으로

      const match = predicted === s.expected;
      if (match) okCount++;
      else failCount++;

      console.log(
        `[#${s.lineNo}] 기대=${s.expected}, 결과=${predicted}, ${
          match ? "✅ OK" : "❌ NG"
        }`
      );

      // 결과 행 저장
      resultRows.push(
        [
          s.lineNo,
          `"${s.text.replace(/"/g, '""')}"`, // CSV용 escape
          s.expected,
          predicted,
          match ? "1" : "0",
          signals.emotion_vs_logic ?? "",
          signals.risk_avoidance ?? "",
          signals.responsibility_avoidance ?? "",
          signals.analysis_paralysis ?? "",
          signals.priority_confusion ?? "",
          signals.energy_level ?? "",
          signals.novelty_drive ?? "",
        ].join(",")
      );

      // API 과부하 방지를 위해 살짝 쉼
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`💥 [${s.lineNo}] 예외 발생:`, e);
      failCount++;
    }
  }

  const total = okCount + failCount;
  const acc = total > 0 ? ((okCount / total) * 100).toFixed(1) : "0.0";

  console.log("--------------------------------------------------");
  console.log(`✅ 총 ${total}개 중 일치 ${okCount}개, 불일치 ${failCount}개`);
  console.log(`🎯 정확도: ${acc}%`);

  // 3) 결과 CSV로 저장 (선택)
  const outPath = path.join(__dirname, "gold_results_fsm_v3.csv");
  fs.writeFileSync(outPath, resultRows.join("\n"), "utf8");
  console.log("📁 상세 결과 저장:", outPath);
}

run();
