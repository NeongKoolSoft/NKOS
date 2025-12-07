// src/lib/modeEngine.js
// 넝쿨OS FSM v3.0 (골든샘플 안정판)

export const MODES = [
  "DELAY",
  "STABILIZE",
  "REFLECT",
  "SIMPLIFY",
  "DECISIVE",
  "EXPLORATORY",
];

/**
 * 안전하게 기본값 0 처리
 */
function normSignals(raw = {}) {
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

/**
 * 1단계: "강한 패턴" 룰 체크
 *  - 여기서 걸리면 바로 모드 리턴
 */
function checkStrongRules(s, prevMode = "") {
  const {
    emotion_vs_logic: ea,
    risk_avoidance: ra,
    responsibility_avoidance: resp,
    analysis_paralysis: ap,
    priority_confusion: pc,
    energy_level: en,
    novelty_drive: nv,
  } = s;

  // [D-1] 에너지 고갈 + 행동 마비
  if (en <= 1 && ap >= 2 && (resp >= 2 || pc >= 2)) {
    return "DELAY";
  }
  // [D-2] 완전 마비
  if (ap === 3 && en <= 2) {
    return "DELAY";
  }

  // [E-1] 고에너지 + 새로움
  if (
    en >= 2 &&
    nv >= 2 &&
    ra <= 1 &&
    ap <= 1 &&
    pc <= 1
  ) {
    return "EXPLORATORY";
  }

  // [De-1] 실행 결심
  if (
    ap <= 1 &&
    pc <= 1 &&
    resp <= 1 &&
    en >= 2 &&
    ea <= 2
  ) {
    return "DECISIVE";
  }

  // [Si-1] 우선순위 혼란 + 정리 의도
  if (
    pc >= 2 &&
    ap <= 2 &&
    en >= 1 &&
    nv <= 2
  ) {
    return "SIMPLIFY";
  }

  // [S-1] 루틴 유지 / 안정
  if (
    ra >= 2 &&
    en >= 1 && en <= 2 &&
    nv <= 1 &&
    pc <= 2
  ) {
    return "STABILIZE";
  }

  // [R-1] 내면 성찰
  if (
    ap <= 2 &&
    en >= 1 && en <= 2 &&
    nv <= 1 &&
    ea >= 1 &&
    pc <= 2
  ) {
    return "REFLECT";
  }

  // 강한 룰에 안 걸리면 null
  return null;
}

/**
 * 2단계: 점수 기반 계산
 */
export function computeScores(rawSignals, prevMode = "") {
  const s = normSignals(rawSignals);
  const {
    emotion_vs_logic: ea,
    risk_avoidance: ra,
    responsibility_avoidance: resp,
    analysis_paralysis: ap,
    priority_confusion: pc,
    energy_level: en,
    novelty_drive: nv,
  } = s;

  const scores = {
    DELAY:
      1.5 * ap +
      1.2 * pc +
      1.0 * resp +
      (3 - en),

    STABILIZE:
      1.5 * ra +
      0.8 * (2 - nv) +
      0.5 * en,

    REFLECT:
      1.3 * ea +
      0.8 * (2 - nv) +
      0.7 * (2 - ap),

    SIMPLIFY:
      1.6 * pc +
      0.7 * resp +
      0.3 * (2 - ap),

    DECISIVE:
      1.4 * en +
      1.0 * (3 - ap) +
      1.0 * (3 - pc) -
      1.0 * resp,

    EXPLORATORY:
      1.5 * nv +
      1.0 * en -
      1.0 * ra -
      0.7 * ap -
      0.7 * pc,
  };

  // 이전 모드 관성 / 전이 보정
  if (prevMode && MODES.includes(prevMode)) {
    MODES.forEach((m) => {
      if (!scores[m]) return;

      // 같은 모드 유지
      if (m === prevMode) scores[m] += 0.3;

      // 극단 전환 패널티 (DELAY ↔ DECISIVE)
      if (
        (prevMode === "DELAY" && m === "DECISIVE") ||
        (prevMode === "DECISIVE" && m === "DELAY")
      ) {
        scores[m] -= 0.4;
      }

      // 인접 전이 보너스
      const neighbors = {
        DELAY: ["STABILIZE"],
        STABILIZE: ["DELAY", "REFLECT"],
        REFLECT: ["STABILIZE", "SIMPLIFY"],
        SIMPLIFY: ["REFLECT", "DECISIVE"],
        DECISIVE: ["SIMPLIFY", "EXPLORATORY"],
        EXPLORATORY: ["DECISIVE"],
      };

      if (neighbors[prevMode]?.includes(m)) {
        scores[m] += 0.2;
      }
    });
  }

  return scores;
}

/**
 * 3단계: 최종 모드 결정
 */
export function decideMode(rawSignals, prevMode = "") {
  const signals = normSignals(rawSignals);

  // 1) 강한 룰 먼저
  const strong = checkStrongRules(signals, prevMode);
  if (strong) return strong;

  // 2) 점수 기반
  const scores = computeScores(signals, prevMode);

  let bestMode = "REFLECT";
  let bestScore = -Infinity;

  for (const mode of MODES) {
    const score = scores[mode] ?? -Infinity;
    if (score > bestScore) {
      bestScore = score;
      bestMode = mode;
    }
  }

  return bestMode;
}
