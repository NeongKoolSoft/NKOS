// src/lib/modeEngine.js
// 넝쿨OS 모드 엔진 FSM 2.2 (REFLECT Mode 포함)

import { extractSignals } from "./modeSignals";
import { getPatternBoosts } from "./modePatterns";

export const MODES = [
  "DELAY",
  "STABILIZE",
  "REFLECT",
  "SIMPLIFY",
  "DECISIVE",
  "EXPLORATORY",
];

// 신호 + 패턴 + 이전 모드 → 점수 계산
export function computeScores(signals, patternBoosts, prevMode) {
  const s = signals || {};
  const p = patternBoosts || {};

  // 0~3 스케일을 쓰는 신호는 없을 수도 있으니 안전하게 기본값 0 처리
  const ap = s.analysis_paralysis || 0;
  const pc = s.priority_confusion || 0;
  const ra = s.risk_avoidance || 0;
  const ea = s.emotion_vs_logic || 0;
  const resp = s.responsibility_avoidance || 0;
  const en = s.energy_level || 0;
  const nv = s.novelty_drive || 0;

  // 1) 기본 점수 매트릭스
  const base = {
    // 결정 보류 모드: 마비 + 혼란 + 감정
    DELAY: 2 * ap + 2 * pc + 1 * ea + (p.DELAY || 0),

    // 안정 회복 모드: 불안/위험 + 약간의 혼란
    STABILIZE: 1 * ap + 3 * ra + 1 * pc + (p.STABILIZE || 0),

    // 🔹 새로 추가: REFLECT 모드 (성찰/내면 정리)
    // 감정·기준에 대한 의식 ↑, 혼란/마비는 낮거나 중간, 새로움 욕구는 낮은 편
    REFLECT:
    1.7 * ea +
    0.7 * (3 - ap) +
    1.0 * (3 - pc) +
    0.8 * (3 - nv) +
    0.5 * ra +
    (p.REFLECT || 0),


    // 단순화 모드: 우선순위 정리 + 선택 줄이기
    SIMPLIFY: 2 * pc + 1 * ap + 1 * resp + (p.SIMPLIFY || 0),

    // 결단/실행 모드: 마비/혼란 ↓, 에너지 ↑, 새로움에 너무 끌리면 오히려 감점
    DECISIVE:
      1 * (3 - ap) +
      1 * (3 - pc) +
      0.5 * (3 - ra) +
      1 * en +
      (p.DECISIVE || 0) -
      1 * nv,

    // 탐색/실험 모드: 새로움/에너지 ↑, 불안 ↓, 마비/혼란 ↑면 감점
    EXPLORATORY:
      1 * (3 - ra) +
      1 * (3 - resp) +
      1 * en +
      2.5 * nv -
      1 * ap -
      1 * pc +
      (p.EXPLORATORY || 0),
  };

  const adjusted = { ...base };

  // 2) 특수 패턴 보정들

  // 🔥 강한 DECISIVE 패턴이면 결단 모드 쪽으로 강하게
  if ((p.DECISIVE || 0) >= 2) {
    adjusted.DECISIVE += 3;
    adjusted.EXPLORATORY -= 2;
    adjusted.EXPLORATORY -= nv * 1.5;
  }

  // 🔥 강한 REFLECT 패턴이거나, 감정 신호↑ + 마비/혼란↓ + 새로움 욕구↓ 일 때
  if (
    (p.REFLECT || 0) >= 2 ||
    (ea >= 2 && nv <= 1 && ap <= 1 && pc <= 1)
  ) {
    adjusted.REFLECT += 2;
    adjusted.DECISIVE -= 1;
    adjusted.EXPLORATORY -= 1;
  }

  // 🔥 리스크/불안이 높은데 탐색 욕구가 낮으면 STABILIZE 쪽으로
  if (ra >= 2 && nv <= 1) {
    adjusted.STABILIZE += 2;
    adjusted.DECISIVE -= 1;
    adjusted.EXPLORATORY -= 1;
  }

  // 3) 이전 모드 관성/전이 규칙 (FSM 느낌)
  if (prevMode && MODES.includes(prevMode)) {
    MODES.forEach((mode) => {
      // 같은 모드 유지에 약간 보너스
      if (mode === prevMode) {
        adjusted[mode] += 0.5;
      }

      // 극단 전환 패널티 (DELAY ↔ DECISIVE)
      if (
        (prevMode === "DELAY" && mode === "DECISIVE") ||
        (prevMode === "DECISIVE" && mode === "DELAY")
      ) {
        adjusted[mode] -= 0.5;
      }

      // 인접 모드 보너스
      // DELAY → STABILIZE → REFLECT → SIMPLIFY → DECISIVE → EXPLORATORY
      if (
        (prevMode === "DELAY" && mode === "STABILIZE") ||
        (prevMode === "STABILIZE" && mode === "REFLECT") ||
        (prevMode === "REFLECT" && mode === "SIMPLIFY") ||
        (prevMode === "SIMPLIFY" && mode === "DECISIVE") ||
        (prevMode === "DECISIVE" && mode === "EXPLORATORY")
      ) {
        adjusted[mode] += 0.3;
      }
    });
  }

  return adjusted;
}

// signals + patternBoosts + prevMode → bestMode
export function decideMode(signals, patternBoosts, prevMode) {
  const scores = computeScores(signals, patternBoosts, prevMode);

  let bestMode = "DECISIVE";
  let bestScore = -Infinity;

  MODES.forEach((mode) => {
    if (scores[mode] > bestScore) {
      bestScore = scores[mode];
      bestMode = mode;
    }
  });

  return bestMode;
}

// 텍스트 + 이전 모드 → 오늘 모드
export function decideModeFromText(text, prevMode) {
  const signals = extractSignals(text);
  const patternBoosts = getPatternBoosts(text);
  return decideMode(signals, patternBoosts, prevMode);
}

// 필요 시 외부에서도 신호 벡터를 보고 싶을 수 있으니 재-export
export { extractSignals };
