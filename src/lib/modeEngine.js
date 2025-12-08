// src/lib/modeEngine.js
// 넝쿨OS 모드 엔진 FSM v3 (GOLD 68 기준 튜닝용)

import { extractSignals } from "./modeSignals.js";
import { getPatternBoosts } from "./modePatterns.js";

export const MODES = [
  "DELAY",
  "STABILIZE",
  "REFLECT",
  "SIMPLIFY",
  "DECISIVE",
  "EXPLORATORY",
];

// GOLD 68 샘플 기반 v3.1 모드 가중치 (STABILIZE 과대 문제 보정)
const MODE_FACTORS = {
  DELAY: 1.05,
  STABILIZE: 0.7,
  REFLECT: 1.05,
  SIMPLIFY: 1.1,
  DECISIVE: 1.15,
  EXPLORATORY: 1.2,
};

// src/lib/modeEngine.js

// 모드 점수 → 정렬된 리스트
export function rankModes(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, score]) => ({ mode, score }));
}

// Top1 + Top2 + 점수 벡터 + 시그널까지 한 번에
export function decideModesWithMeta(signals, patternBoosts, prevMode) {
  const scores = computeScores(signals, patternBoosts, prevMode);
  const ranked = rankModes(scores);

  let primary = ranked[0].mode;
  const primaryScore = ranked[0].score;
  const prevScore = prevMode ? scores[prevMode] : null;

  // 이전 모드 유지 규칙은 그대로 존중
  if (prevMode && prevScore >= primaryScore - 1) {
    primary = prevMode;
  }

  // secondary는 "가장 높은, primary가 아닌 모드"
  const secondary = ranked.find((r) => r.mode !== primary)?.mode || null;

  return {
    primary,
    secondary,
    scores,
    ranked,   // 필요하면 상위 3개도 쓸 수 있도록
    signals,  // UI에서도 시그널 카드에 써먹을 수 있게 같이 넘김
  };
}

// 텍스트 기반 진단용 (기존 decideModeFromText 업그레이드 버전)
export function decideModesFromText(text, prevMode) {
  const signals = extractSignals(text);
  const patternBoosts = getPatternBoosts(text);
  return decideModesWithMeta(signals, patternBoosts, prevMode);
}


// 신호 + 패턴 + 이전 모드 → 점수 계산 (FSM v3)
// signals + patternBoosts + prevMode → 모드 점수 계산
export function computeScores(signals, patternBoosts, prevMode) {
  const s = signals || {};
  const p = patternBoosts || {};

  // 0~3 스케일 신호들 (없으면 0)
  const ap   = s.analysis_paralysis || 0;
  const pc   = s.priority_confusion || 0;
  const ra   = s.risk_avoidance || 0;
  const ea   = s.emotion_vs_logic || 0;
  const resp = s.responsibility_avoidance || 0;
  const en   = s.energy_level || 0;
  const nv   = s.novelty_drive || 0;

  // 1) 기본 점수 매트릭스
  const base = {
    // DELAY: 마비·미룸·우선순위 혼란 + 에너지↓ + 책임 회피
    DELAY:
      1.6 * ap +        // 분석 마비
      1.4 * pc +        // 우선순위 혼란
      1.0 * (3 - en) +  // 에너지 낮을수록 지연
      0.8 * resp +      // 책임 회피/부담
      (p.DELAY || 0),

    // STABILIZE: 루틴/기본기·컨디션 회복
    STABILIZE:
      0.8 * (3 - pc) +        // 혼란이 적을수록 안정, 하지만 너무 세지 않게
      0.8 * (3 - ap) +        // 마비 적음
      0.5 * (3 - ea) +        // 감정 기복 적을수록 안정
      0.3 * (3 - ra) +        // 위험 회피가 너무 강하지 않을 때
      0.5 * (en <= 1 ? 1 : 0) + // 에너지가 낮거나 보통일 때만 회복 모드 보너스
      (p.STABILIZE || 0),

    // REFLECT: 감정·의미에 대한 내면 탐색
    REFLECT:
      2.0 * ea +        // 감정/가치에 대한 고민
      1.0 * ap +        // 머릿속에서 곱씹는 분석
      0.5 * resp +      // 책임/선택 되짚어보기
      0.5 * (3 - en) +  // 에너지가 너무 높진 않을 때
      (p.REFLECT || 0),

    // SIMPLIFY: 복잡한 걸 줄이고 핵심만 남기려는 상태
    SIMPLIFY:
      2.0 * pc +        // 우선순위 혼잡 → 정리 욕구
      0.7 * ap +        // 생각은 좀 많고
      0.5 * (3 - en) +  // 에너지는 아주 높지 않음
      0.3 * ea +        // 약간의 답답함/부담
      (p.SIMPLIFY || 0),

    // DECISIVE: 에너지↑ + 결심·실행
    DECISIVE:
      2.0 * en +        // 실행 에너지
      0.8 * (3 - ap) +  // 고민 적음
      0.8 * (3 - pc) +  // 우선순위 정리됨
      0.5 * (3 - ra) +  // 과도한 위험 회피 없음
      (p.DECISIVE || 0),

    // EXPLORATORY: 새로움·실험
    EXPLORATORY:
      2.0 * nv +        // 새로움/호기심
      1.0 * en +        // 실험할 에너지
      0.5 * (3 - ra) +  // 실패 허용
      (p.EXPLORATORY || 0),
  };

  // 2) base를 복사해서 조정용 컨테이너 준비
  const adjusted = { ...base };

  // 2-1) 모든 신호가 거의 0인 "조용한 상태" → STABILIZE 쪽으로
  const sumSignals = ap + pc + ra + ea + resp + en + nv;
  if (sumSignals <= 1) {
    adjusted.STABILIZE += 1.5;
    adjusted.DELAY     -= 0.5;
    adjusted.DECISIVE  -= 0.5;
  }

  // 2) 특수 패턴 보정들
  // 2-1) 우선순위 혼잡 + 감정 답답 + 에너지 낮음 → "정리하고 싶은" SIMPLIFY 쪽으로
  if (pc >= 2 && ea >= 2 && en <= 1) {
    adjusted.SIMPLIFY += 2;
    adjusted.DELAY -= 1;
    adjusted.REFLECT += 0.5; // 약간은 되짚어보는 느낌도 있음
  }  

  // 2-2) 내면 탐색 패턴 (REFLECT vs DELAY) 보정
  // 감정(ea) 높고, 생각(ap)도 돌고, 새로움(nv)은 낮은 쪽이면 REFLECT 쪽으로
  if (ea >= 2 && ap >= 1 && nv <= 1) {
    adjusted.REFLECT  += 1.5;
    adjusted.DELAY    -= 0.5;
    adjusted.DECISIVE -= 0.5;
  }

  // 2-3) 우선순위 혼잡 + 마비 → SIMPLIFY 보정
  if (pc >= 2 && ap >= 1 && en <= 1) {
    adjusted.SIMPLIFY += 1.5;
    adjusted.DELAY    -= 1.0;
  }

  // 2-4) 에너지가 0일 때 DECISIVE 과대평가 방지
  if (en === 0) {
    adjusted.DECISIVE -= 1.0;
  }

  // 3) 특수 패턴 보정들 (기존 로직 유지)
  // 강한 DECISIVE 패턴이면 결단 모드 쪽으로 강하게
  if ((p.DECISIVE || 0) >= 2) {
    adjusted.DECISIVE += 3;
    adjusted.EXPLORATORY -= 2;
    adjusted.EXPLORATORY -= nv * 1.5;
  }

  // 리스크/불안↑ + 탐색욕구↓ → STABILIZE 쪽으로
  if (ra >= 2 && nv <= 1) {
    adjusted.STABILIZE += 2;
    adjusted.DECISIVE  -= 1;
    adjusted.EXPLORATORY -= 1;
  }

  // 4) 이전 모드 관성/전이 규칙
  if (prevMode && MODES.includes(prevMode)) {
    MODES.forEach((mode) => {
      // 같은 모드 유지 보너스
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

  // 5) GOLD 튜닝 결과 모드별 가중치 적용
  const finalScores = {};
  MODES.forEach((mode) => {
    const factor = MODE_FACTORS[mode] ?? 1;
    finalScores[mode] = adjusted[mode] * factor;
  });

  return finalScores;
}



// 최고 점수 모드 선택
export function decideMode(signals, patternBoosts, prevMode) {
  const scores = computeScores(signals, patternBoosts, prevMode);
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestMode, bestScore] = entries[0];

  if (prevMode && scores[prevMode] >= bestScore - 1) {
    return prevMode;
  }

  return bestMode;
}

// 텍스트 + 이전 모드 → 오늘 모드
export function decideModeFromText(text, prevMode) {
  const signals = extractSignals(text);
  const patternBoosts = getPatternBoosts(text);
  return decideMode(signals, patternBoosts, prevMode);
}

// 신호 벡터도 필요할 수 있어서 재-export
export { extractSignals };
