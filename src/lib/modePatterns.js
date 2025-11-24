// src/lib/modePatterns.js
// 문장 패턴 기반 모드 보너스 점수 (넝쿨OS FSM 2.2)

export function getPatternBoosts(text) {
  const t = (text || "").trim();
  const has = (w) => t.includes(w);

  const boosts = {
    DELAY: 0,
    STABILIZE: 0,
    REFLECT: 0,
    SIMPLIFY: 0,
    DECISIVE: 0,
    EXPLORATORY: 0,
  };

  // ---------------------------------------
  // 🔹 DELAY (결정 보류 / 마비 패턴)
  // ---------------------------------------

  // 강한 마비 패턴
  if (
    (has("막연") || has("막막")) &&
    (has("생각만") || has("계속 생각")) &&
    (has("결정을 못") || has("못 정했"))
  ) {
    boosts.DELAY += 2;
  }

  // 약한 마비/혼란 패턴
  if (has("막연") || has("막막") || has("헷갈") || has("정리가 안")) {
    boosts.DELAY += 1;
    boosts.SIMPLIFY += 1; // 정리 니즈 증가
  }

  // ---------------------------------------
  // 🔹 STABILIZE (불안/실패/걱정 회복 패턴)
  // ---------------------------------------

  // 강한 형태
  if (
    (has("실패할까") || has("망할까") || has("망하면")) &&
    (has("불안") || has("걱정") || has("초조"))
  ) {
    boosts.STABILIZE += 2;
  }

  // 약한 형태 (실패/걱정 단독)
  if (has("실패할까") || has("망할까") || has("불안") || has("걱정")) {
    boosts.STABILIZE += 1;
  }

  // ---------------------------------------
  // 🔹 DECISIVE (정리 + 실행)
  // ---------------------------------------

  if (
    (has("계획을 정리") || has("정리했고") || has("정리했다")) &&
    (has("실행") || has("시작했다") || has("착수"))
  ) {
    boosts.DECISIVE += 2; // 가장 강한 DECISIVE 패턴
  }

  // 실행·결정 의지
  if (has("실행") || has("시작했다") || has("정했다") || has("결정했다")) {
    boosts.DECISIVE += 1;
  }

  // ---------------------------------------
  // 🔹 EXPLORATORY (탐색/실험 패턴)
  // ---------------------------------------

  // 강한 탐색 패턴: 설렘 + 새로움 + 실험 의지
  const hasStrongExploratory =
    has("설레") &&
    (has("새로운") || has("아이디어")) &&
    (has("실험") || has("시도해보고 싶다") || has("해보고 싶다"));

  // 약한 탐색 패턴
  const hasWeakExploratory =
    has("새로운") ||
    has("아이디어") ||
    has("실험") ||
    has("탐색") ||
    has("시도해보고 싶다");

  if (hasStrongExploratory) {
    boosts.EXPLORATORY += 3;
  } else if (hasWeakExploratory) {
    boosts.EXPLORATORY += 1; // 2 → 1 (너무 강했음)
  }

  // ---------------------------------------
  // 🔹 REFLECT (성찰/내면 정리 패턴)
  // ---------------------------------------
  // 강한 REFLECT 패턴: 명확한 성찰/되돌아봄/기준 재정비
  if (
    has("성찰") ||
    has("되짚어") ||
    has("되짚어보고") ||
    has("돌아보니") ||
    has("되돌아보니") ||
    has("생각해보니") ||
    has("기준을 다시") ||
    has("기준을 재정비") ||
    has("내 마음이 왜") ||
    has("왜 이렇게 느끼")
  ) {
    boosts.REFLECT += 2;
  }

  // 약한 REFLECT 패턴: 약한 정리/되돌아보기
  if (
    has("되돌아보") ||
    has("정리해보") ||
    has("정리하면서") ||
    has("요약해보") ||
    has("다시 생각해보")
  ) {
    boosts.REFLECT += 1;
  }

  // ---------------------------------------
  // 🔹 SIMPLIFY (단순화 욕구)
  // ---------------------------------------

  if (has("선택을 줄여") || has("단순하게") || has("핵심만")) {
    boosts.SIMPLIFY += 2;
  }

  return boosts;
}
